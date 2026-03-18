import AppIntents
import HealthKit

struct GetTodayStepsIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Today's Steps"
    static var description = IntentDescription("Shows your step count for today from Apple Health.")

    func perform() async throws -> some ReturnsValue<Int> & ProvidesDialog {
        let summary = try await HealthKitService.shared.fetchTodaySummary()
        let goal = Int(GoalService.shared.stepsGoal)
        let pct = goal > 0 ? Int(Double(summary.steps) / Double(goal) * 100) : 0
        return .result(
            value: summary.steps,
            dialog: IntentDialog(stringLiteral: "\(summary.steps.formatted()) steps today — \(pct)% of your goal.")
        )
    }
}

struct GetRecoveryScoreIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Recovery Score"
    static var description = IntentDescription("Shows your current recovery score from KQuarks.")

    func perform() async throws -> some ReturnsValue<Int> & ProvidesDialog {
        let score = UserDefaults.standard.integer(forKey: "cached_recovery_score")
        let displayScore = score > 0 ? score : 50
        let level: String
        switch displayScore {
        case 67...: level = "great"
        case 34..<67: level = "moderate"
        default: level = "low"
        }
        return .result(
            value: displayScore,
            dialog: IntentDialog(stringLiteral: "Your recovery score is \(displayScore) percent — \(level) recovery today.")
        )
    }
}

struct GetSleepDurationIntent: AppIntent {
    static var title: LocalizedStringResource = "How Did I Sleep?"
    static var description = IntentDescription("Shows your sleep duration for last night.")

    func perform() async throws -> some ReturnsValue<Double> & ProvidesDialog {
        let calendar = Calendar.current
        let yesterday = calendar.date(byAdding: .day, value: -1, to: calendar.startOfDay(for: Date()))!
        let samples = (try? await HealthKitService.shared.fetchSleepAnalysis(from: yesterday, to: Date())) ?? []
        let minutes = samples.filter {
            if case .asleepDeep? = HKCategoryValueSleepAnalysis(rawValue: $0.value) { return true }
            if case .asleepREM? = HKCategoryValueSleepAnalysis(rawValue: $0.value) { return true }
            if case .asleepCore? = HKCategoryValueSleepAnalysis(rawValue: $0.value) { return true }
            return false
        }.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 }
        let hours = minutes / 60
        let h = Int(hours)
        let m = Int(minutes) % 60
        return .result(
            value: hours,
            dialog: IntentDialog(stringLiteral: h > 0 ? "You slept \(h) hours and \(m) minutes last night." : "No sleep data found for last night.")
        )
    }
}

struct GetWeeklyWorkoutsIntent: AppIntent {
    static var title: LocalizedStringResource = "Workouts This Week"
    static var description = IntentDescription("Shows how many workouts you've done this week.")

    func perform() async throws -> some ReturnsValue<Int> & ProvidesDialog {
        let weekStart = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let workouts = (try? await HealthKitService.shared.fetchWorkouts(from: weekStart, to: Date())) ?? []
        let count = workouts.count
        let word = count == 1 ? "workout" : "workouts"
        return .result(
            value: count,
            dialog: IntentDialog(stringLiteral: count > 0
                ? "You've completed \(count) \(word) this week. Keep it up!"
                : "No workouts logged this week yet. Time to move!")
        )
    }
}

struct LogWeightIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Body Weight"
    static var description = IntentDescription("Records your body weight in Apple Health.")

    @Parameter(title: "Weight (kg)", description: "Your body weight in kilograms.")
    var weightKg: Double

    func perform() async throws -> some ReturnsValue<Double> & ProvidesDialog {
        try await HealthKitService.shared.requestAuthorization()
        try await HealthKitService.shared.saveBodyWeight(weightKg)
        return .result(
            value: weightKg,
            dialog: IntentDialog(stringLiteral: "Logged \(String(format: "%.1f", weightKg)) kg in Apple Health.")
        )
    }
}

struct KQuarksShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GetTodayStepsIntent(),
            phrases: [
                "What are my steps in \(.applicationName)",
                "Show today's steps in \(.applicationName)",
                "How many steps today in \(.applicationName)"
            ],
            shortTitle: "Today's Steps",
            systemImageName: "figure.walk"
        )
        AppShortcut(
            intent: GetRecoveryScoreIntent(),
            phrases: [
                "What's my recovery in \(.applicationName)",
                "Recovery score in \(.applicationName)"
            ],
            shortTitle: "Recovery Score",
            systemImageName: "bolt.fill"
        )
        AppShortcut(
            intent: GetSleepDurationIntent(),
            phrases: [
                "How did I sleep in \(.applicationName)",
                "Show last night's sleep in \(.applicationName)"
            ],
            shortTitle: "Last Night's Sleep",
            systemImageName: "moon.fill"
        )
        AppShortcut(
            intent: GetWeeklyWorkoutsIntent(),
            phrases: [
                "How many workouts in \(.applicationName)",
                "Workouts this week in \(.applicationName)"
            ],
            shortTitle: "Weekly Workouts",
            systemImageName: "figure.run"
        )
        AppShortcut(
            intent: LogWeightIntent(),
            phrases: [
                "Log my weight in \(.applicationName)",
                "Record my weight in \(.applicationName)"
            ],
            shortTitle: "Log Weight",
            systemImageName: "scalemass.fill"
        )
    }
}
