import Foundation
import HealthKit
import BackgroundTasks

@Observable
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

    // MARK: - Full Sync

    func performFullSync() async {
        guard !isSyncing else { return }
        guard supabase.isAuthenticated else { return }

        await MainActor.run {
            isSyncing = true
            syncError = nil
        }

        do {
            // Sync today's summary
            try await syncTodaySummary()

            // Sync recent health samples
            try await syncRecentHealthData()

            // Sync sleep data
            try await syncSleepData()

            // Sync workouts
            try await syncWorkouts()

            await MainActor.run {
                lastSyncDate = Date()
                UserDefaults.standard.set(lastSyncDate, forKey: lastSyncKey)
                isSyncing = false
            }
            Task { await NotificationService.shared.notifyAfterSync() }
            await supabase.updateLastSyncAt()
        } catch {
            await MainActor.run {
                syncError = error
                isSyncing = false
            }
        }
    }

    // MARK: - Sync Today's Summary

    private func syncTodaySummary() async throws {
        guard let userId = supabase.currentUser?.id else { return }

        let summary = try await healthKit.fetchTodaySummary()
        async let weightKgTask = healthKit.fetchLatest(for: .bodyMass)
        async let bodyFatTask = healthKit.fetchLatest(for: .bodyFatPercentage)
        let weightKg = try? await weightKgTask
        let bodyFatRaw = try? await bodyFatTask
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

        try await supabase.uploadDailySummary(upload)

        // Cache recovery score for morning brief notification
        if let rec = AIInsightsService.shared.latestRecoveryScore {
            UserDefaults.standard.set(rec, forKey: "cached_recovery_score")
        }
    }

    // MARK: - Sync Health Samples

    private func syncRecentHealthData() async throws {
        guard let userId = supabase.currentUser?.id else { return }

        let calendar = Calendar.current
        let now = Date()
        let startDate = lastSyncDate ?? calendar.date(byAdding: .day, value: -7, to: now)!

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
                    FormMetric(identifier: .runningCadence, type: "running_cadence", unit: HKUnit.count().unitDivided(by: .minute())),
                    FormMetric(identifier: .runningStrideLength, type: "running_stride_length", unit: .meter()),
                    FormMetric(identifier: .runningVerticalOscillation, type: "running_vertical_oscillation", unit: .meterUnit(with: .centi)),
                    FormMetric(identifier: .runningGroundContactTime, type: "running_ground_contact_time", unit: .secondUnit(with: .milli)),
                    FormMetric(identifier: .runningPower, type: "running_power", unit: HKUnit.watt()),
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
                        unit: metric.identifier == .runningGroundContactTime ? "ms" :
                              metric.identifier == .runningVerticalOscillation ? "cm" :
                              metric.identifier == .runningStrideLength ? "m" :
                              metric.identifier == .runningPower ? "W" : "spm",
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

        // Fetch sleep breathing disturbances (Watch Series 4+, iOS 16+)
        if #available(iOS 16.0, *) {
            let breathingEvents = try await healthKit.fetchCategoryEvents(.sleepBreathingDisturbances, from: startDate, to: now)
            for event in breathingEvents {
                // value 0 = not elevated, 1 = elevated
                records.append(HealthRecordUpload(
                    userId: userId,
                    type: "sleep_breathing_disturbances",
                    value: Double(event.value), // 0 = normal, 1 = elevated
                    unit: "category",
                    source: event.sourceRevision.source.name,
                    startTime: event.startDate,
                    endTime: event.endDate
                ))
            }
        }

        // Dietary macros (from third-party apps writing to Apple Health, aggregated by day)
        struct DietaryMetric { let identifier: HKQuantityTypeIdentifier; let type: String; let unit: HKUnit; let unitName: String }
        let dietaryMetrics = [
            DietaryMetric(identifier: .dietaryEnergyConsumed, type: "dietary_energy", unit: HKUnit.kilocalorie(), unitName: "kcal"),
            DietaryMetric(identifier: .dietaryProtein, type: "dietary_protein", unit: .gram(), unitName: "g"),
            DietaryMetric(identifier: .dietaryCarbohydrates, type: "dietary_carbs", unit: .gram(), unitName: "g"),
            DietaryMetric(identifier: .dietaryFatTotal, type: "dietary_fat", unit: .gram(), unitName: "g"),
            DietaryMetric(identifier: .dietaryFiber, type: "dietary_fiber", unit: .gram(), unitName: "g"),
            DietaryMetric(identifier: .dietaryWater, type: "dietary_water", unit: HKUnit.liter(), unitName: "mL"),
        ]
        for metric in dietaryMetrics {
            let samples = try await healthKit.fetchSamples(for: metric.identifier, from: startDate, to: now)
            // Aggregate samples by day (sum per calendar day)
            var dayTotals: [String: Double] = [:]
            var dayDates: [String: (Date, Date)] = [:]
            for sample in samples {
                let cal = Calendar.current
                let dayStart = cal.startOfDay(for: sample.startDate)
                let dayEnd = cal.date(byAdding: .day, value: 1, to: dayStart)!
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

        // Batch upload
        if !records.isEmpty {
            // Split into batches of 100
            let batches = stride(from: 0, to: records.count, by: 100).map {
                Array(records[$0..<min($0 + 100, records.count)])
            }

            for batch in batches {
                try await supabase.uploadHealthRecords(batch)
            }
        }
    }

    // MARK: - Sync Sleep

    private func syncSleepData() async throws {
        guard let userId = supabase.currentUser?.id else { return }

        let calendar = Calendar.current
        let now = Date()
        let startDate = lastSyncDate ?? calendar.date(byAdding: .day, value: -7, to: now)!

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

            try await supabase.uploadSleepRecord(upload)
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
        let startDate = lastSyncDate ?? calendar.date(byAdding: .day, value: -30, to: now)!

        let workouts = try await healthKit.fetchWorkouts(from: startDate, to: now)

        for workout in workouts {
            let avgHR = (try? await healthKit.fetchAverageHeartRate(during: workout)).map { Int($0) }
            let maxHR = (try? await healthKit.fetchMaxHeartRate(during: workout)).map { Int($0) }
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
            try await supabase.uploadWorkoutRecord(upload)
        }
    }

    // MARK: - Historical Backfill

    var historicalSyncProgress: Double = 0.0
    var isHistoricalSyncing: Bool = false

    /// Backfills all available HealthKit data going back `daysBack` days.
    /// Uses bulk HKStatisticsCollectionQuery for efficiency.
    func performHistoricalSync(daysBack: Int = 365) async {
        guard !isHistoricalSyncing && !isSyncing else { return }
        guard let userId = supabase.currentUser?.id else { return }

        await MainActor.run {
            isHistoricalSyncing = true
            historicalSyncProgress = 0.0
        }

        do {
            let calendar = Calendar.current
            let now = Date()
            let endDate = calendar.startOfDay(for: now) // up to start of today (today handled by regular sync)
            let startDate = calendar.date(byAdding: .day, value: -daysBack, to: endDate)!

            await MainActor.run { historicalSyncProgress = 0.05 }

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

            await MainActor.run { historicalSyncProgress = 0.35 }

            // Fetch all sleep samples for the range and group into per-day minutes
            let sleepSamples = try await healthKit.fetchSleepAnalysis(from: startDate, to: endDate)
            let sleepByDay = buildDailySleepMap(from: sleepSamples)

            await MainActor.run { historicalSyncProgress = 0.45 }

            // Build ordered list of days to upload
            var allDates: [Date] = []
            var d = startDate
            while d < endDate {
                allDates.append(d)
                d = calendar.date(byAdding: .day, value: 1, to: d)!
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
                    weightKg: nil
                )
                try await supabase.uploadDailySummary(upload)
                let progress = 0.45 + 0.35 * Double(i + 1) / total
                await MainActor.run { historicalSyncProgress = progress }
            }

            // Sync historical workouts
            let workouts = try await healthKit.fetchWorkouts(from: startDate, to: endDate)
            for workout in workouts {
                let avgHR = (try? await healthKit.fetchAverageHeartRate(during: workout)).map { Int($0) }
                let maxHR = (try? await healthKit.fetchMaxHeartRate(during: workout)).map { Int($0) }
                let elevationGain: Double? = {
                    if let quantity = workout.metadata?[HKMetadataKeyElevationAscended] as? HKQuantity {
                        return quantity.doubleValue(for: .meter())
                    }
                    return nil
                }()
                let upload = WorkoutRecordUpload(
                    userId: userId,
                    workoutType: workout.workoutActivityType.name,
                    startTime: workout.startDate,
                    endTime: workout.endDate,
                    durationMinutes: Int(workout.duration / 60),
                    activeCalories: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                    totalCalories: nil,
                    distanceMeters: workout.totalDistance?.doubleValue(for: .meter()),
                    avgHeartRate: avgHR,
                    maxHeartRate: maxHR,
                    elevationGainMeters: elevationGain,
                    avgPacePerKm: nil,
                    source: workout.sourceRevision.source.name
                )
                try? await supabase.uploadWorkoutRecord(upload)
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
                try? await supabase.uploadSleepRecord(upload)
            }

            await MainActor.run {
                historicalSyncProgress = 1.0
                isHistoricalSyncing = false
            }
        } catch {
            await MainActor.run {
                syncError = error
                isHistoricalSyncing = false
            }
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

    func scheduleBackgroundSync() {
        let refreshRequest = BGAppRefreshTaskRequest(identifier: "com.kquarks.sync.refresh")
        refreshRequest.earliestBeginDate = Date(timeIntervalSinceNow: 2 * 3600)
        try? BGTaskScheduler.shared.submit(refreshRequest)

        let fullRequest = BGProcessingTaskRequest(identifier: "com.kquarks.sync.full")
        fullRequest.requiresNetworkConnectivity = true
        fullRequest.requiresExternalPower = true
        try? BGTaskScheduler.shared.submit(fullRequest)
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
        // Read syncError on MainActor to avoid data race
        let succeeded = await MainActor.run { self.syncError == nil } && !didExpire
        task.setTaskCompleted(success: succeeded)
    }
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
