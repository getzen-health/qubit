import AppIntents

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
    }
}
