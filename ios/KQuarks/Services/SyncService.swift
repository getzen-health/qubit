import Foundation
import HealthKit
#if os(iOS)
import BackgroundTasks
#endif

@Observable
@MainActor
class SyncService {
    static let shared = SyncService()

    private let healthKit = HealthKitService.shared
    private let supabase = SupabaseService.shared

    var isSyncing = false
    var lastSyncDate: Date?
    var syncError: Error?

    private let lastSyncKey = "lastSyncDate"

    private init() {
        lastSyncDate = UserDefaults.standard.object(forKey: lastSyncKey) as? Date
    }

    // MARK: - Retry Helper

    /// Retries an async throwing operation with exponential backoff.
    /// - Parameters:
    ///   - maxAttempts: Maximum number of attempts (default 3)
    ///   - initialDelay: Initial delay in seconds before first retry (default 1.0)
    ///   - operation: The async operation to retry
    private func withRetry<T>(
        maxAttempts: Int = 3,
        initialDelay: TimeInterval = 1.0,
        operation: () async throws -> T
    ) async throws -> T {
        var lastError: Error?
        for attempt in 0..<maxAttempts {
            do {
                return try await operation()
            } catch {
                lastError = error
                if attempt < maxAttempts - 1 {
                    let delay = initialDelay * pow(2.0, Double(attempt))
                    try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                }
            }
        }
        throw lastError!
    }

    // MARK: - Full Sync

    func performFullSync() async {
        guard !isSyncing else { return }
        guard supabase.isAuthenticated else { return }

        isSyncing = true
            syncError = nil

        do {
            // Sync today's summary
            try await syncTodaySummary()

            // Sync recent health samples
            try await syncRecentHealthData()

            // Sync sleep data
            try await syncSleepData()

            // Sync workouts
            try await syncWorkouts()

            // Sync ECG recordings (Apple Watch Series 4+, iOS 14+)
            if #available(iOS 14.0, *) {
                await syncECGRecords()
            }

            lastSyncDate = Date()
                UserDefaults.standard.set(lastSyncDate, forKey: lastSyncKey)
                isSyncing = false
            Task { await NotificationService.shared.notifyAfterSync() }
            Task { await SupabaseService.shared.checkAchievements() }
            await supabase.updateLastSyncAt()
        } catch {
            syncError = error
                isSyncing = false
        }
    }

    // MARK: - Sync Today's Summary

    private func syncTodaySummary() async throws {
        guard let userId = supabase.currentUser?.id else { return }

        let summary = try await healthKit.fetchTodaySummary()
        var weightKg: Double?
        do { weightKg = try await healthKit.fetchLatest(for: .bodyMass) } catch { weightKg = nil }
        var bodyFatRaw: Double?
        do { bodyFatRaw = try await healthKit.fetchLatest(for: .bodyFatPercentage) } catch { bodyFatRaw = nil }
        // HealthKit stores body fat as a fraction (0.0–1.0); convert to percent
        let bodyFatPercent = bodyFatRaw.map { $0 > 1.0 ? $0 : $0 * 100.0 }

        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())

        let upload = DailySummaryUpload(
            userId: userId,
            date: today,
            steps: summary.steps,
            distanceMeters: summary.distanceMeters,
            floorsClimbed: summary.floorsClimbed,
            activeCalories: summary.activeCalories,
            totalCalories: 0,
            activeMinutes: summary.exerciseMinutes,
            sleepDurationMinutes: summary.sleepHours.map { Int($0 * 60) },
            sleepQualityScore: nil,
            restingHeartRate: summary.restingHeartRate,
            avgHrv: summary.hrv,
            recoveryScore: AIInsightsService.shared.latestRecoveryScore,
            strainScore: AIInsightsService.shared.latestStrainScore.map { Int($0) },
            weightKg: weightKg,
            bodyFatPercent: bodyFatPercent
        )

        try await withRetry { try await self.supabase.uploadDailySummary(upload) }

        // Cache recovery score for morning brief notification
        // Using Keychain (not UserDefaults) to prevent exposure via iCloud backup
        if let rec = AIInsightsService.shared.latestRecoveryScore {
            try? KeychainHelper.save(key: "cached_recovery_score", value: String(rec))
            // Also write to shared App Group suite so the widget extension can read it
            UserDefaults(suiteName: "group.com.qxlsz.kquarks")?.set(rec, forKey: "cached_recovery_score")
        }
    }

    // MARK: - Sync Health Samples

    private func syncRecentHealthData() async throws {
        guard let userId = supabase.currentUser?.id else { return }

        let calendar = Calendar.current
        let now = Date()
        let startDate = lastSyncDate ?? calendar.date(byAdding: .day, value: -7, to: now) ?? Date()

        var records: [HealthRecordUpload] = []

        // Fetch heart rate samples
        let hrSamples = try await healthKit.fetchSamples(
            for: .heartRate,
            from: startDate,
            to: now
        )

        for sample in hrSamples {
            let bpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
            records.append(HealthRecordUpload(
                userId: userId,
                type: "heart_rate",
                value: bpm,
                unit: "bpm",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        // Fetch blood oxygen samples (SpO2)
        let spO2Samples = try await healthKit.fetchSamples(
            for: .oxygenSaturation,
            from: startDate,
            to: now,
            limit: 200
        )
        for sample in spO2Samples {
            // HealthKit stores as fraction (0.0–1.0); convert to percent
            let pct = sample.quantity.doubleValue(for: .percent()) * 100.0
            records.append(HealthRecordUpload(
                userId: userId,
                type: "oxygen_saturation",
                value: pct,
                unit: "%",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        // Fetch respiratory rate
        let rrSamples = try await healthKit.fetchSamples(
            for: .respiratoryRate,
            from: startDate,
            to: now,
            limit: 200
        )
        for sample in rrSamples {
            let brpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
            records.append(HealthRecordUpload(
                userId: userId,
                type: "respiratory_rate",
                value: brpm,
                unit: "brpm",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        // Fetch blood pressure samples
        let systolicSamples = try await healthKit.fetchSamples(
            for: .bloodPressureSystolic,
            from: startDate,
            to: now,
            limit: 200
        )
        for sample in systolicSamples {
            let mmHg = sample.quantity.doubleValue(for: .millimeterOfMercury())
            records.append(HealthRecordUpload(
                userId: userId,
                type: "blood_pressure_systolic",
                value: mmHg,
                unit: "mmHg",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        let diastolicSamples = try await healthKit.fetchSamples(
            for: .bloodPressureDiastolic,
            from: startDate,
            to: now,
            limit: 200
        )
        for sample in diastolicSamples {
            let mmHg = sample.quantity.doubleValue(for: .millimeterOfMercury())
            records.append(HealthRecordUpload(
                userId: userId,
                type: "blood_pressure_diastolic",
                value: mmHg,
                unit: "mmHg",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        // Fetch VO2 Max samples
        let vo2Samples = try await healthKit.fetchSamples(
            for: .vo2Max,
            from: startDate,
            to: now,
            limit: 50
        )
        for sample in vo2Samples {
            let vo2Unit = HKUnit.literUnit(with: .milli).unitDivided(by: HKUnit.gramUnit(with: .kilo).unitMultiplied(by: .minute()))
            let value = sample.quantity.doubleValue(for: vo2Unit)
            records.append(HealthRecordUpload(
                userId: userId,
                type: "vo2_max",
                value: value,
                unit: "ml/kg/min",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        // Fetch wrist temperature during sleep (Apple Watch Series 8+, iOS 16+)
        if #available(iOS 16.0, *) {
            let wristTempSamples = try await healthKit.fetchSamples(
                for: .appleSleepingWristTemperature,
                from: startDate,
                to: now,
                limit: 100
            )
            for sample in wristTempSamples {
                let degC = sample.quantity.doubleValue(for: .degreeCelsius())
                records.append(HealthRecordUpload(
                    userId: userId,
                    type: "wrist_temperature",
                    value: degC,
                    unit: "°C",
                    source: sample.sourceRevision.source.name,
                    startTime: sample.startDate,
                    endTime: sample.endDate
                ))
            }
        }

        // Fetch hearing health (headphone + environmental audio exposure)
        let dbUnit = HKUnit.decibelAWeightedSoundPressureLevel()
        let headphoneSamples = try await healthKit.fetchSamples(
            for: .headphoneAudioExposure,
            from: startDate,
            to: now,
            limit: 500
        )
        for sample in headphoneSamples {
            let db = sample.quantity.doubleValue(for: dbUnit)
            records.append(HealthRecordUpload(
                userId: userId,
                type: "headphone_audio_exposure",
                value: db,
                unit: "dBASPL",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        let environmentalSamples = try await healthKit.fetchSamples(
            for: .environmentalAudioExposure,
            from: startDate,
            to: now,
            limit: 500
        )
        for sample in environmentalSamples {
            let db = sample.quantity.doubleValue(for: dbUnit)
            records.append(HealthRecordUpload(
                userId: userId,
                type: "environmental_audio_exposure",
                value: db,
                unit: "dBASPL",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        // Fetch running form metrics (Apple Watch, iOS 16+) — averaged per workout session
        if #available(iOS 16.0, *) {
            let runningWorkouts = try await healthKit.fetchWorkouts(from: startDate, to: now)
                .filter { $0.workoutActivityType == .running && $0.duration >= 120 }

            for workout in runningWorkouts {
                struct FormMetric { let identifier: HKQuantityTypeIdentifier; let type: String; let unit: HKUnit }
                let formMetrics = [
                    FormMetric(identifier: .runningStrideLength, type: "running_stride_length", unit: .meter()),
                    FormMetric(identifier: .runningVerticalOscillation, type: "running_vertical_oscillation", unit: .meterUnit(with: .centi)),
                    FormMetric(identifier: .runningGroundContactTime, type: "running_ground_contact_time", unit: .secondUnit(with: .milli)),
                    FormMetric(identifier: .runningPower, type: "running_power", unit: HKUnit.watt()),
                    FormMetric(identifier: .runningCadence, type: "running_cadence", unit: HKUnit.count().unitDivided(by: .minute())),
                ]
                for metric in formMetrics {
                    let samples = try await healthKit.fetchSamples(
                        for: metric.identifier,
                        from: workout.startDate,
                        to: workout.endDate,
                        limit: 5000
                    )
                    guard !samples.isEmpty else { continue }
                    let avg = samples.map { $0.quantity.doubleValue(for: metric.unit) }.reduce(0, +) / Double(samples.count)
                    records.append(HealthRecordUpload(
                        userId: userId,
                        type: metric.type,
                        value: avg,
                        unit: metric.identifier == HKQuantityTypeIdentifier.runningGroundContactTime ? "ms" :
                              metric.identifier == HKQuantityTypeIdentifier.runningVerticalOscillation ? "cm" :
                              metric.identifier == HKQuantityTypeIdentifier.runningStrideLength ? "m" :
                              metric.identifier == HKQuantityTypeIdentifier.runningPower ? "W" :
                              metric.identifier == HKQuantityTypeIdentifier.runningCadence ? "spm" : "spm",
                        source: workout.sourceRevision.source.name,
                        startTime: workout.startDate,
                        endTime: workout.endDate
                    ))
                }
            }
        }

        // Fetch time in daylight (iPhone ambient light sensor, iOS 17+)
        if #available(iOS 17.0, *) {
            let daylightSamples = try await healthKit.fetchSamples(
                for: .timeInDaylight,
                from: startDate,
                to: now,
                limit: 100
            )
            for sample in daylightSamples {
                let minutes = sample.quantity.doubleValue(for: .minute())
                records.append(HealthRecordUpload(
                    userId: userId,
                    type: "time_in_daylight",
                    value: minutes,
                    unit: "minutes",
                    source: sample.sourceRevision.source.name,
                    startTime: sample.startDate,
                    endTime: sample.endDate
                ))
            }
        }

        // Fetch mobility metrics (iPhone walking health, iOS 14+)
        let mobilityTypes: [(HKQuantityTypeIdentifier, String, HKUnit, String)] = [
            (.walkingSpeed, "walking_speed", HKUnit.meter().unitDivided(by: .second()), "m/s"),
            (.walkingStepLength, "walking_step_length", .meter(), "m"),
            (.walkingAsymmetryPercentage, "walking_asymmetry", .percent(), "%"),
            (.walkingDoubleSupportPercentage, "walking_double_support", .percent(), "%"),
            (.appleWalkingSteadiness, "walking_steadiness", .percent(), "%"),
            (.walkingHeartRateAverage, "walking_heart_rate_avg", HKUnit.count().unitDivided(by: .minute()), "bpm"),
            (.stairAscentSpeed, "stair_ascent_speed", HKUnit.meter().unitDivided(by: .second()), "m/s"),
            (.stairDescentSpeed, "stair_descent_speed", HKUnit.meter().unitDivided(by: .second()), "m/s"),
        ]
        for (identifier, typeName, unit, unitStr) in mobilityTypes {
            let samples = try await healthKit.fetchSamples(
                for: identifier,
                from: startDate,
                to: now,
                limit: 200
            )
            for sample in samples {
                var value = sample.quantity.doubleValue(for: unit)
                // Convert percent fraction to 0-100 range
                if unitStr == "%" && value <= 1.0 { value *= 100 }
                records.append(HealthRecordUpload(
                    userId: userId,
                    type: typeName,
                    value: value,
                    unit: unitStr,
                    source: sample.sourceRevision.source.name,
                    startTime: sample.startDate,
                    endTime: sample.endDate
                ))
            }
        }

        // Fetch mindfulness sessions
        let mindfulSamples = try await healthKit.fetchMindfulSessions(from: startDate, to: now)
        for sample in mindfulSamples {
            let durationMinutes = sample.endDate.timeIntervalSince(sample.startDate) / 60
            records.append(HealthRecordUpload(
                userId: userId,
                type: "mindfulness",
                value: durationMinutes,
                unit: "minutes",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        // Fetch stand hours from activity summaries
        let activitySummaries = try await healthKit.fetchActivitySummaries(from: startDate, to: now)
        let calendar2 = Calendar.current
        for summary in activitySummaries {
            let standHours = summary.appleStandHours.doubleValue(for: .count())
            let standGoal = summary.appleStandHoursGoal.doubleValue(for: .count())
            // Reconstruct approximate date from calendar components (activity summaries use date components)
            let comps = summary.dateComponents(for: calendar2)
            guard let date = calendar2.date(from: comps) else { continue }
            records.append(HealthRecordUpload(
                userId: userId,
                type: "stand_hours",
                value: standHours,
                unit: "hours",
                source: "Apple Watch",
                startTime: date,
                endTime: calendar2.date(byAdding: .day, value: 1, to: date) ?? date
            ))
            if standGoal > 0 {
                records.append(HealthRecordUpload(
                    userId: userId,
                    type: "stand_hours_goal",
                    value: standGoal,
                    unit: "hours",
                    source: "Apple Watch",
                    startTime: date,
                    endTime: calendar2.date(byAdding: .day, value: 1, to: date) ?? date
                ))
            }
        }

        // Sleep breathing disturbances: .sleepBreathingDisturbances not available in this SDK version

        // Dietary macros (from third-party apps writing to Apple Health, aggregated by day)
        struct DietaryMetric { let identifier: HKQuantityTypeIdentifier; let type: String; let unit: HKUnit; let unitName: String }
        let dietaryMetrics = [
            DietaryMetric(identifier: .dietaryEnergyConsumed, type: "dietary_energy", unit: HKUnit.kilocalorie(), unitName: "kcal"),
            DietaryMetric(identifier: .dietaryProtein, type: "dietary_protein", unit: .gram(), unitName: "g"),
            DietaryMetric(identifier: .dietaryCarbohydrates, type: "dietary_carbs", unit: .gram(), unitName: "g"),
            DietaryMetric(identifier: .dietaryFatTotal, type: "dietary_fat", unit: .gram(), unitName: "g"),
            DietaryMetric(identifier: .dietaryFiber, type: "dietary_fiber", unit: .gram(), unitName: "g"),
            DietaryMetric(identifier: .dietaryWater, type: "dietary_water", unit: HKUnit.liter(), unitName: "mL"),
            DietaryMetric(identifier: .numberOfAlcoholicBeverages, type: "alcoholic_beverages", unit: HKUnit.count(), unitName: "drinks"),
        ]
        for metric in dietaryMetrics {
            let samples = try await healthKit.fetchSamples(for: metric.identifier, from: startDate, to: now)
            // Aggregate samples by day (sum per calendar day)
            var dayTotals: [String: Double] = [:]
            var dayDates: [String: (Date, Date)] = [:]
            for sample in samples {
                let cal = Calendar.current
                let dayStart = cal.startOfDay(for: sample.startDate)
                let dayEnd = cal.date(byAdding: .day, value: 1, to: dayStart) ?? Date(timeInterval: 86400, since: dayStart)
                let key = ISO8601DateFormatter().string(from: dayStart).prefix(10).description
                var value = sample.quantity.doubleValue(for: metric.unit)
                if metric.identifier == .dietaryWater { value *= 1000 } // convert L to mL
                dayTotals[key, default: 0] += value
                dayDates[key] = (dayStart, dayEnd)
            }
            for (_, (start, end)) in dayDates {
                let key = ISO8601DateFormatter().string(from: start).prefix(10).description
                guard let total = dayTotals[key], total > 0 else { continue }
                records.append(HealthRecordUpload(
                    userId: userId,
                    type: metric.type,
                    value: total,
                    unit: metric.unitName,
                    source: "Apple Health",
                    startTime: start,
                    endTime: end
                ))
            }
        }

        // Blood glucose
        let glucoseSamples = try await healthKit.fetchSamples(for: .bloodGlucose, from: startDate, to: now)
        for sample in glucoseSamples {
            // HealthKit stores glucose in mmol/L; convert for display (store as mg/dL)
            let mgDL = sample.quantity.doubleValue(for: HKUnit(from: "mg/dL"))
            records.append(HealthRecordUpload(
                userId: userId,
                type: "blood_glucose",
                value: mgDL,
                unit: "mg/dL",
                source: sample.sourceRevision.source.name,
                startTime: sample.startDate,
                endTime: sample.endDate
            ))
        }

        // Fetch cardiac events (AFib, high HR, low HR) from Apple Watch
        let cardiacEvents: [(HKCategoryTypeIdentifier, String)] = [
            (.irregularHeartRhythmEvent, "afib_event"),
            (.highHeartRateEvent, "high_heart_rate_event"),
            (.lowHeartRateEvent, "low_heart_rate_event"),
        ]
        for (identifier, typeName) in cardiacEvents {
            let events = try await healthKit.fetchCategoryEvents(identifier, from: startDate, to: now)
            for event in events {
                records.append(HealthRecordUpload(
                    userId: userId,
                    type: typeName,
                    value: 1.0,
                    unit: "event",
                    source: event.sourceRevision.source.name,
                    startTime: event.startDate,
                    endTime: event.endDate
                ))
            }
        }

        // Fetch ECG samples (Apple Watch Series 4+, iOS 14+)
        if #available(iOS 14.0, *) {
            let ecgSamples = try await healthKit.fetchECGSamples(from: startDate, to: now)
            let bpmUnit = HKUnit.count().unitDivided(by: .minute())
            for ecg in ecgSamples {
                let avgHR = ecg.averageHeartRate?.doubleValue(for: bpmUnit) ?? 0.0
                let classification = ecg.classification.syncName
                records.append(HealthRecordUpload(
                    userId: userId,
                    type: "ecg",
                    value: avgHR,
                    unit: "bpm",
                    source: ecg.sourceRevision.source.name,
                    startTime: ecg.startDate,
                    endTime: ecg.endDate,
                    metadata: ["classification": classification]
                ))
            }
        }

        // Batch upload
        if !records.isEmpty {
            // Split into batches of 100
            let batches = stride(from: 0, to: records.count, by: 100).map {
                Array(records[$0..<min($0 + 100, records.count)])
            }

            var failedBatches = 0
            for (index, batch) in batches.enumerated() {
                do {
                    try await withRetry { try await self.supabase.uploadHealthRecords(batch) }
                } catch {
                    // Log and skip failed batches rather than aborting entire sync
                    // This prevents 1 bad record from losing all subsequent data
                    failedBatches += 1
                    NSLog("[SyncService] Batch %d/%d failed (skipping): %@", index + 1, batches.count, error.localizedDescription)
                }
            }
            if failedBatches > 0 {
                NSLog("[SyncService] Health records sync: %d/%d batches failed", failedBatches, batches.count)
            }
        }
    }

    // MARK: - Sync Sleep

    private func syncSleepData() async throws {
        guard let userId = supabase.currentUser?.id else { return }

        let calendar = Calendar.current
        let now = Date()
        let startDate = lastSyncDate ?? calendar.date(byAdding: .day, value: -7, to: now) ?? Date()

        let sleepSamples = try await healthKit.fetchSleepAnalysis(from: startDate, to: now)

        // Group samples by sleep session (samples that are close together)
        let sessions = groupSleepSamples(sleepSamples)

        for session in sessions {
            guard let first = session.first, let last = session.last else { continue }

            var awake = 0, rem = 0, core = 0, deep = 0

            for sample in session {
                let minutes = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)

                switch value {
                case .awake:
                    awake += minutes
                case .asleepREM:
                    rem += minutes
                case .asleepCore:
                    core += minutes
                case .asleepDeep:
                    deep += minutes
                default:
                    core += minutes // Treat unspecified as core
                }
            }

            let totalMinutes = Int(last.endDate.timeIntervalSince(first.startDate) / 60)

            let upload = SleepRecordUpload(
                userId: userId,
                startTime: first.startDate,
                endTime: last.endDate,
                durationMinutes: totalMinutes,
                awakeMinutes: awake,
                remMinutes: rem,
                coreMinutes: core,
                deepMinutes: deep,
                source: first.sourceRevision.source.name
            )

            try await withRetry { try await self.supabase.uploadSleepRecord(upload) }
        }
    }

    private func groupSleepSamples(_ samples: [HKCategorySample]) -> [[HKCategorySample]] {
        guard !samples.isEmpty else { return [] }

        var sessions: [[HKCategorySample]] = []
        var currentSession: [HKCategorySample] = []

        let sortedSamples = samples.sorted { $0.startDate < $1.startDate }

        for sample in sortedSamples {
            if let last = currentSession.last {
                // If more than 2 hours between samples, start new session
                let gap = sample.startDate.timeIntervalSince(last.endDate)
                if gap > 7200 {
                    if !currentSession.isEmpty {
                        sessions.append(currentSession)
                    }
                    currentSession = [sample]
                } else {
                    currentSession.append(sample)
                }
            } else {
                currentSession.append(sample)
            }
        }

        if !currentSession.isEmpty {
            sessions.append(currentSession)
        }

        return sessions
    }

    // MARK: - Sync Workouts

    private func syncWorkouts() async throws {
        guard let userId = supabase.currentUser?.id else { return }

        let calendar = Calendar.current
        let now = Date()
        let startDate = lastSyncDate ?? calendar.date(byAdding: .day, value: -30, to: now) ?? Date()

        let workouts = try await healthKit.fetchWorkouts(from: startDate, to: now)

        for workout in workouts {
            var avgHRValue: Double?
            do { avgHRValue = try await healthKit.fetchAverageHeartRate(during: workout) } catch { avgHRValue = nil }
            var maxHRValue: Double?
            do { maxHRValue = try await healthKit.fetchMaxHeartRate(during: workout) } catch { maxHRValue = nil }
            let avgHR = avgHRValue.map { Int($0) }
            let maxHR = maxHRValue.map { Int($0) }
            let elevationGain: Double? = {
                if let quantity = workout.metadata?[HKMetadataKeyElevationAscended] as? HKQuantity {
                    return quantity.doubleValue(for: .meter())
                }
                return nil
            }()
            let distMeters = workout.totalDistance?.doubleValue(for: .meter())
            let durationSecs = workout.duration
            // Pace in seconds per km (only meaningful for distance-based workouts)
            let avgPacePerKm: Double? = {
                guard let d = distMeters, d > 100, durationSecs > 0 else { return nil }
                return (durationSecs / d) * 1000
            }()
            let upload = WorkoutRecordUpload(
                userId: userId,
                workoutType: workout.workoutActivityType.name,
                startTime: workout.startDate,
                endTime: workout.endDate,
                durationMinutes: Int(workout.duration / 60),
                activeCalories: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                totalCalories: nil,
                distanceMeters: distMeters,
                avgHeartRate: avgHR,
                maxHeartRate: maxHR,
                elevationGainMeters: elevationGain,
                avgPacePerKm: avgPacePerKm,
                source: workout.sourceRevision.source.name
            )
            try await withRetry { try await self.supabase.uploadWorkoutRecord(upload) }
        }
    }

    // MARK: - ECG Sync

    @available(iOS 14.0, *)
    private func syncECGRecords() async {
        guard let userId = supabase.currentUser?.id else { return }
        let ecgs = await healthKit.fetchRecentECGs(limit: 20)
        let beatsPerMinute = HKUnit.count().unitDivided(by: .minute())
        let records: [ECGRecordUpload] = ecgs.map { ecg in
            let classification: String
            switch ecg.classification {
            case .sinusRhythm:              classification = "sinusRhythm"
            case .atrialFibrillation:       classification = "atrialFibrillation"
            case .inconclusiveLowHeartRate: classification = "inconclusiveLowHR"
            case .inconclusiveHighHeartRate: classification = "inconclusiveHighHR"
            case .inconclusiveOther:        classification = "inconclusiveOther"
            default:                        classification = "unrecognized"
            }
            let avgHrBpm = ecg.averageHeartRate.map { Int($0.doubleValue(for: beatsPerMinute)) }
            let samplingHz = ecg.samplingFrequency?.doubleValue(for: .hertz())
            let symptomsStatus = ecg.symptomsStatus == .none ? "none" : "notSet"
            return ECGRecordUpload(
                userId: userId,
                recordedAt: ecg.startDate,
                classification: classification,
                averageHrBpm: avgHrBpm,
                samplingFrequencyHz: samplingHz,
                symptomsStatus: symptomsStatus
            )
        }
        guard !records.isEmpty else { return }
        try? await withRetry { try await self.supabase.uploadECGRecords(records) }
    }

    // MARK: - Historical Backfill

    var historicalSyncProgress: Double = 0.0
    var isHistoricalSyncing: Bool = false

    /// Backfills all available HealthKit data going back `daysBack` days.
    /// Uses bulk HKStatisticsCollectionQuery for efficiency.
    func performHistoricalSync(daysBack: Int = 365) async {
        guard !isHistoricalSyncing && !isSyncing else { return }
        guard let userId = supabase.currentUser?.id else { return }

        isHistoricalSyncing = true
            historicalSyncProgress = 0.0

        do {
            let calendar = Calendar.current
            let now = Date()
            let endDate = calendar.startOfDay(for: now) // up to start of today (today handled by regular sync)
            let startDate = calendar.date(byAdding: .day, value: -daysBack, to: endDate) ?? Date()

            historicalSyncProgress = 0.05

            // Fetch all daily activity stats in parallel using efficient collection queries
            async let stepMap = healthKit.fetchDailyStats(for: .stepCount, from: startDate, to: endDate, isDiscrete: false)
            async let distMap = healthKit.fetchDailyStats(for: .distanceWalkingRunning, from: startDate, to: endDate, isDiscrete: false)
            async let calMap = healthKit.fetchDailyStats(for: .activeEnergyBurned, from: startDate, to: endDate, isDiscrete: false)
            async let floorsMap = healthKit.fetchDailyStats(for: .flightsClimbed, from: startDate, to: endDate, isDiscrete: false)
            let (steps, dist, cal, floors) = try await (stepMap, distMap, calMap, floorsMap)

            async let exerciseMap = healthKit.fetchDailyStats(for: .appleExerciseTime, from: startDate, to: endDate, isDiscrete: false)
            async let rhrMap = healthKit.fetchDailyStats(for: .restingHeartRate, from: startDate, to: endDate, isDiscrete: true)
            async let hrvMap = healthKit.fetchDailyStats(for: .heartRateVariabilitySDNN, from: startDate, to: endDate, isDiscrete: true)
            let (exercise, rhr, hrv) = try await (exerciseMap, rhrMap, hrvMap)

            historicalSyncProgress = 0.35

            // Fetch all sleep samples for the range and group into per-day minutes
            let sleepSamples = try await healthKit.fetchSleepAnalysis(from: startDate, to: endDate)
            let sleepByDay = buildDailySleepMap(from: sleepSamples)

            historicalSyncProgress = 0.45

            // Build ordered list of days to upload
            var allDates: [Date] = []
            var d = startDate
            while d < endDate {
                allDates.append(d)
                d = calendar.date(byAdding: .day, value: 1, to: d) ?? Date()
            }

            let total = Double(allDates.count)
            for (i, dayStart) in allDates.enumerated() {
                // Skip days with no data (reduces unnecessary upserts)
                let daySteps = Int(steps[dayStart] ?? 0)
                let dayCalories = cal[dayStart] ?? 0
                guard daySteps > 0 || dayCalories > 0 else { continue }

                let dayDist = dist[dayStart] ?? 0
                let dayFloors = Int(floors[dayStart] ?? 0)
                let dayExercise = Int(exercise[dayStart] ?? 0)
                let daySleep: Int? = sleepByDay[dayStart]
                let dayRhr: Int? = rhr[dayStart].map { Int($0) }
                let dayHrv: Double? = hrv[dayStart]

                let upload = DailySummaryUpload(
                    userId: userId,
                    date: dayStart,
                    steps: daySteps,
                    distanceMeters: dayDist,
                    floorsClimbed: dayFloors,
                    activeCalories: dayCalories,
                    totalCalories: 0,
                    activeMinutes: dayExercise,
                    sleepDurationMinutes: daySleep,
                    sleepQualityScore: nil,
                    restingHeartRate: dayRhr,
                    avgHrv: dayHrv,
                    recoveryScore: nil,
                    strainScore: nil,
                    weightKg: nil,
                    bodyFatPercent: nil
                )
                try await withRetry { try await self.supabase.uploadDailySummary(upload) }
                let progress = 0.45 + 0.35 * Double(i + 1) / total
                historicalSyncProgress = progress
            }

            // Sync historical workouts
            let workouts = try await healthKit.fetchWorkouts(from: startDate, to: endDate)
            for workout in workouts {
                var avgHRValue: Double?
                do { avgHRValue = try await healthKit.fetchAverageHeartRate(during: workout) } catch { avgHRValue = nil }
                var maxHRValue: Double?
                do { maxHRValue = try await healthKit.fetchMaxHeartRate(during: workout) } catch { maxHRValue = nil }
                let avgHR = avgHRValue.map { Int($0) }
                let maxHR = maxHRValue.map { Int($0) }
                let elevationGain: Double? = {
                    if let quantity = workout.metadata?[HKMetadataKeyElevationAscended] as? HKQuantity {
                        return quantity.doubleValue(for: .meter())
                    }
                    return nil
                }()
                let distMeters = workout.totalDistance?.doubleValue(for: .meter())
                let avgPacePerKm: Double? = {
                    guard let d = distMeters, d > 100, workout.duration > 0 else { return nil }
                    return (workout.duration / d) * 1000
                }()
                let upload = WorkoutRecordUpload(
                    userId: userId,
                    workoutType: workout.workoutActivityType.name,
                    startTime: workout.startDate,
                    endTime: workout.endDate,
                    durationMinutes: Int(workout.duration / 60),
                    activeCalories: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                    totalCalories: nil,
                    distanceMeters: distMeters,
                    avgHeartRate: avgHR,
                    maxHeartRate: maxHR,
                    elevationGainMeters: elevationGain,
                    avgPacePerKm: avgPacePerKm,
                    source: workout.sourceRevision.source.name
                )
                do {
                    try await withRetry { try await self.supabase.uploadWorkoutRecord(upload) }
                } catch {
                    print("[SyncService] Failed to upload historical workout record: \(error)")
                }
            }

            // Sync historical sleep sessions
            let sleepSessions = groupSleepSamples(sleepSamples)
            for session in sleepSessions {
                guard let first = session.first, let last = session.last else { continue }
                var awake = 0, rem = 0, core = 0, deep = 0
                for sample in session {
                    let minutes = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                    let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)
                    switch value {
                    case .awake: awake += minutes
                    case .asleepREM: rem += minutes
                    case .asleepCore: core += minutes
                    case .asleepDeep: deep += minutes
                    default: core += minutes
                    }
                }
                let totalMin = Int(last.endDate.timeIntervalSince(first.startDate) / 60)
                let upload = SleepRecordUpload(
                    userId: userId,
                    startTime: first.startDate,
                    endTime: last.endDate,
                    durationMinutes: totalMin,
                    awakeMinutes: awake,
                    remMinutes: rem,
                    coreMinutes: core,
                    deepMinutes: deep,
                    source: first.sourceRevision.source.name
                )
                do {
                    try await withRetry { try await self.supabase.uploadSleepRecord(upload) }
                } catch {
                    print("[SyncService] Failed to upload historical sleep record: \(error)")
                }
            }

            historicalSyncProgress = 1.0
            isHistoricalSyncing = false
        } catch {
            syncError = error
            isHistoricalSyncing = false
        }
    }

    /// Groups sleep samples by the calendar day they END on (morning wakeup day),
    /// returning total actual sleep minutes (excluding awake time) per day.
    private func buildDailySleepMap(from samples: [HKCategorySample]) -> [Date: Int] {
        let calendar = Calendar.current
        var map: [Date: Int] = [:]
        for sample in samples {
            let day = calendar.startOfDay(for: sample.endDate)
            let minutes = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
            let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)
            // Only count actual sleep stages, not awake time
            switch value {
            case .asleepREM, .asleepCore, .asleepDeep, .asleepUnspecified:
                map[day] = (map[day] ?? 0) + minutes
            default:
                break
            }
        }
        return map
    }

    // MARK: - Background Sync

    #if os(iOS)
    func scheduleBackgroundSync() {
        let refreshRequest = BGAppRefreshTaskRequest(identifier: "com.kquarks.sync.refresh")
        refreshRequest.earliestBeginDate = Date(timeIntervalSinceNow: 2 * 3600)
        do {
            try BGTaskScheduler.shared.submit(refreshRequest)
        } catch {
            print("[SyncService] Failed to schedule background refresh: \(error)")
        }

        let fullRequest = BGProcessingTaskRequest(identifier: "com.kquarks.sync.full")
        fullRequest.requiresNetworkConnectivity = true
        fullRequest.requiresExternalPower = true
        do {
            try BGTaskScheduler.shared.submit(fullRequest)
        } catch {
            print("[SyncService] Failed to schedule background processing: \(error)")
        }
    }

    func handleRefreshTask(_ task: BGAppRefreshTask) async {
        // Reschedule before doing work so the next refresh is always queued
        scheduleBackgroundSync()

        guard supabase.isAuthenticated else {
            task.setTaskCompleted(success: true)
            return
        }

        do {
            try await syncTodaySummary()
            Task { await NotificationService.shared.notifyAfterSync() }
            task.setTaskCompleted(success: true)
        } catch {
            print("[BGTask] Refresh sync failed: \(error)")
            task.setTaskCompleted(success: false)
        }
    }

    func handleFullSyncTask(_ task: BGProcessingTask) async {
        // Reschedule before doing work
        scheduleBackgroundSync()

        guard supabase.isAuthenticated else {
            task.setTaskCompleted(success: true)
            return
        }

        // Set expiration handler — OS can cancel long-running tasks
        var didExpire = false
        task.expirationHandler = {
            didExpire = true
            print("[BGTask] Full sync task expired")
        }

        await performFullSync()
        let succeeded = syncError == nil && !didExpire
        task.setTaskCompleted(success: succeeded)
    }
    #endif
}

// MARK: - Workout Type Name Extension

extension HKWorkoutActivityType {
    var name: String {
        switch self {
        case .running: return "Running"
        case .cycling: return "Cycling"
        case .walking: return "Walking"
        case .swimming: return "Swimming"
        case .hiking: return "Hiking"
        case .yoga: return "Yoga"
        case .functionalStrengthTraining: return "Strength Training"
        case .traditionalStrengthTraining: return "Weight Training"
        case .coreTraining: return "Core Training"
        case .highIntensityIntervalTraining: return "HIIT"
        case .crossTraining: return "Cross Training"
        case .elliptical: return "Elliptical"
        case .rowing: return "Rowing"
        case .stairClimbing: return "Stair Climbing"
        case .pilates: return "Pilates"
        case .dance: return "Dance"
        case .cooldown: return "Cooldown"
        case .basketball: return "Basketball"
        case .soccer: return "Soccer"
        case .tennis: return "Tennis"
        case .golf: return "Golf"
        default: return "Workout"
        }
    }
}

// MARK: - ECG Classification Name Extension

@available(iOS 14.0, *)
extension HKElectrocardiogram.Classification {
    var syncName: String {
        switch self {
        case .sinusRhythm: return "sinus_rhythm"
        case .atrialFibrillation: return "atrial_fibrillation"
        case .inconclusiveLowHeartRate: return "inconclusive_low_heart_rate"
        case .inconclusiveHighHeartRate: return "inconclusive_high_heart_rate"
        case .inconclusivePoorReading: return "inconclusive_poor_reading"
        case .inconclusiveOther: return "inconclusive_other"
        case .unrecognized: return "unrecognized"
        case .notSet: return "not_set"
        @unknown default: return "unknown"
        }
    }
}
