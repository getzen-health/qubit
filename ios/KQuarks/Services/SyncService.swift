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
        let weightKg = try? await healthKit.fetchLatest(for: .bodyMass)

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
            weightKg: weightKg
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
                source: workout.sourceRevision.source.name
            )
            try await supabase.uploadWorkoutRecord(upload)
        }
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
