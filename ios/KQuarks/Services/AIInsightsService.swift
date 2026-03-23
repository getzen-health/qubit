import Foundation
import HealthKit

@Observable
class AIInsightsService {
    static let shared = AIInsightsService()

    var isGenerating = false
    var lastError: String?
    var latestRecoveryScore: Int?
    var latestStrainScore: Double?

    private let healthKit = HealthKitService.shared
    private let supabase = SupabaseService.shared

    struct AIAnalysisResult: Codable {
        let recoveryScore: Int
        let strainScore: Double
        let insights: [AIInsight]
    }

    struct AIInsight: Codable {
        let category: String
        let title: String
        let content: String
        let priority: String
    }

    struct HealthContext: Codable {
        let dailySummary: DailySummaryContext
        let weekHistory: [DaySummaryForAI]
        let recentWorkouts: [WorkoutContext]
        let recentSleep: [SleepContext]
    }

    struct DailySummaryContext: Codable {
        let date: String
        let steps: Int
        let distanceMeters: Double
        let activeCalories: Double
        let totalCalories: Double
        let floorsClimbed: Int
        let restingHeartRate: Int?
        let avgHrv: Double?
        let sleepDurationMinutes: Int?
        let sleepQualityScore: Int?
        let activeMinutes: Int
    }

    struct WorkoutContext: Codable {
        let workoutType: String
        let durationMinutes: Int
        let activeCalories: Double?
        let avgHeartRate: Int?
    }

    struct SleepContext: Codable {
        let durationMinutes: Int
        let deepMinutes: Int
        let remMinutes: Int
        let coreMinutes: Int
        let awakeMinutes: Int
    }

    /// Generate fresh insights from current health data via Claude
    func generateInsights() async -> AIAnalysisResult? {
        await MainActor.run {
            isGenerating = true
            lastError = nil
        }

        defer {
            Task { @MainActor in
                isGenerating = false
            }
        }

        do {
            let context = try await buildHealthContext()
            let userApiKey = KeychainHelper.load(key: "claude_api_key")

            let result = try await supabase.invokeGenerateInsights(
                healthContext: context,
                userApiKey: userApiKey
            )

            await MainActor.run {
                latestRecoveryScore = result.recoveryScore
                latestStrainScore = result.strainScore
            }

            NotificationService.shared.scheduleInsightsNotification()
            return result
        } catch {
            await MainActor.run {
                lastError = error.localizedDescription
            }
            return nil
        }
    }

    private func buildHealthContext() async throws -> HealthContext {
        let today = try await healthKit.fetchTodaySummary()
        let weekHistory = try await healthKit.fetchWeekSummaries(days: 7)

        let calendar = Calendar.current
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        let workouts = try await healthKit.fetchWorkouts(from: weekAgo, to: Date())
        let sleepSamples = try await healthKit.fetchSleepAnalysis(from: weekAgo, to: Date())

        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]

        let dailySummary = DailySummaryContext(
            date: dateFormatter.string(from: Date()),
            steps: today.steps,
            distanceMeters: today.distanceMeters,
            activeCalories: today.activeCalories,
            totalCalories: today.activeCalories,
            floorsClimbed: today.floorsClimbed,
            restingHeartRate: today.restingHeartRate,
            avgHrv: today.hrv,
            sleepDurationMinutes: today.sleepHours.map { Int($0 * 60) },
            sleepQualityScore: nil,
            activeMinutes: 0
        )

        // Uses the HKWorkoutActivityType.name extension from SyncService.swift
        let workoutContexts = workouts.prefix(5).map { workout in
            WorkoutContext(
                workoutType: workout.workoutActivityType.name,
                durationMinutes: Int(workout.duration / 60),
                activeCalories: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                avgHeartRate: nil
            )
        }

        let sleepContexts = buildSleepContexts(from: sleepSamples)

        return HealthContext(
            dailySummary: dailySummary,
            weekHistory: weekHistory,
            recentWorkouts: workoutContexts,
            recentSleep: sleepContexts
        )
    }

    private func buildSleepContexts(from samples: [HKCategorySample]) -> [SleepContext] {
        guard !samples.isEmpty else { return [] }

        var deepMinutes = 0
        var remMinutes = 0
        var coreMinutes = 0
        var awakeMinutes = 0
        var totalMinutes = 0

        for sample in samples {
            let minutes = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
            let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)

            switch value {
            case .asleepDeep:
                deepMinutes += minutes
                totalMinutes += minutes
            case .asleepREM:
                remMinutes += minutes
                totalMinutes += minutes
            case .asleepCore, .asleepUnspecified:
                coreMinutes += minutes
                totalMinutes += minutes
            case .awake, .inBed:
                awakeMinutes += minutes
            default:
                break
            }
        }

        guard totalMinutes > 0 else { return [] }

        return [SleepContext(
            durationMinutes: totalMinutes,
            deepMinutes: deepMinutes,
            remMinutes: remMinutes,
            coreMinutes: coreMinutes,
            awakeMinutes: awakeMinutes
        )]
    }
}

// Note: HKWorkoutActivityType.name extension already exists in SyncService.swift
// Do NOT duplicate it here — it will cause a compilation error.
