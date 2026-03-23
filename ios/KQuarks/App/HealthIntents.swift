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

struct SyncHealthDataIntent: AppIntent {
    static var title: LocalizedStringResource = "Sync Health Data"
    static var description = IntentDescription("Syncs your Apple Health data to KQuarks.")

    func perform() async throws -> some ReturnsValue<Bool> & ProvidesDialog {
        guard SupabaseService.shared.isAuthenticated else {
            return .result(
                value: false,
                dialog: IntentDialog(stringLiteral: "Please open KQuarks and sign in first.")
            )
        }
        await SyncService.shared.performFullSync()
        return .result(
            value: true,
            dialog: IntentDialog(stringLiteral: "Health data synced to KQuarks.")
        )
    }
}

struct GetTodayCaloriesIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Today's Active Calories"
    static var description = IntentDescription("Shows your active calorie burn for today from Apple Health.")

    func perform() async throws -> some ReturnsValue<Int> & ProvidesDialog {
        let summary = try await HealthKitService.shared.fetchTodaySummary()
        let cal = Int(summary.activeCalories)
        let goal = Int(GoalService.shared.activeCaloriesGoal)
        let pct = goal > 0 ? Int(Double(cal) / Double(goal) * 100) : 0
        return .result(
            value: cal,
            dialog: IntentDialog(stringLiteral: "\(cal.formatted()) active calories today — \(pct)% of your goal.")
        )
    }
}

struct GetTodayHRVIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Today's HRV"
    static var description = IntentDescription("Shows your heart rate variability from Apple Health.")

    func perform() async throws -> some ReturnsValue<Int> & ProvidesDialog {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let samples = (try? await HealthKitService.shared.fetchSamples(
            for: .heartRateVariabilitySDNN,
            from: startOfDay,
            to: Date()
        )) ?? []
        if !samples.isEmpty {
            let values = samples.map { $0.quantity.doubleValue(for: HKUnit(from: "ms")) }
            let avg = values.reduce(0.0, +) / Double(values.count)
            return .result(
                value: Int(avg),
                dialog: IntentDialog(stringLiteral: "Your HRV today is \(Int(avg)) ms.")
            )
        }
        // Fall back to cached value from last sync
        let cached = UserDefaults.standard.double(forKey: "cached_hrv")
        if cached > 0 {
            return .result(
                value: Int(cached),
                dialog: IntentDialog(stringLiteral: "Your most recent HRV is \(Int(cached)) ms.")
            )
        }
        return .result(
            value: 0,
            dialog: IntentDialog(stringLiteral: "No HRV data found. Try syncing KQuarks first.")
        )
    }
}

struct LogWaterIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Water"
    static var description = IntentDescription("Log water intake in KQuarks.")

    @Parameter(title: "Amount (ml)", description: "Amount of water in millilitres.")
    var amountMl: Int

    static var parameterSummary: some ParameterSummary {
        Summary("Log \(\.$amountMl) ml of water")
    }

    func perform() async throws -> some ReturnsValue<Int> & ProvidesDialog {
        guard SupabaseService.shared.isAuthenticated else {
            return .result(
                value: 0,
                dialog: IntentDialog(stringLiteral: "Please open KQuarks and sign in first.")
            )
        }
        try await SupabaseService.shared.logWater(amountMl: amountMl)
        let total = (try? await SupabaseService.shared.getTodayWaterTotal()) ?? amountMl
        let amountStr = amountMl >= 1000 ? String(format: "%.1fL", Double(amountMl) / 1000) : "\(amountMl)ml"
        let totalStr = total >= 1000 ? String(format: "%.1fL", Double(total) / 1000) : "\(total)ml"
        return .result(
            value: total,
            dialog: IntentDialog(stringLiteral: "Logged \(amountStr). Today's total: \(totalStr).")
        )
    }
}

struct StartFastIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Fasting"
    static var description = IntentDescription("Start a fasting session in KQuarks.")

    @Parameter(title: "Hours", description: "Fast duration in hours.", default: 16)
    var targetHours: Int

    static var parameterSummary: some ParameterSummary {
        Summary("Start a \(\.$targetHours)-hour fast")
    }

    func perform() async throws -> some ReturnsValue<Bool> & ProvidesDialog {
        guard SupabaseService.shared.isAuthenticated else {
            return .result(
                value: false,
                dialog: IntentDialog(stringLiteral: "Please open KQuarks and sign in first.")
            )
        }
        let protocolName: String
        switch targetHours {
        case 18: protocolName = "18:6"
        case 20: protocolName = "20:4"
        case 23: protocolName = "OMAD"
        default: protocolName = "16:8"
        }
        let start = Date()
        try await SupabaseService.shared.startFasting(protocolName: protocolName, targetHours: targetHours)
        NotificationService.shared.scheduleFastingMilestones(targetHours: targetHours, startedAt: start)
        return .result(
            value: true,
            dialog: IntentDialog(stringLiteral: "Started your \(targetHours)-hour fast (\(protocolName)). Eating window opens in \(targetHours) hours.")
        )
    }
}

struct CheckFastIntent: AppIntent {
    static var title: LocalizedStringResource = "Fasting Status"
    static var description = IntentDescription("Check your current fasting progress in KQuarks.")

    func perform() async throws -> some ReturnsValue<Double> & ProvidesDialog {
        guard SupabaseService.shared.isAuthenticated else {
            return .result(
                value: 0,
                dialog: IntentDialog(stringLiteral: "Please open KQuarks and sign in first.")
            )
        }
        let status = try await SupabaseService.shared.getFastingStatus()
        if status.isActive {
            let h = Int(status.elapsedHours)
            let m = Int((status.elapsedHours - Double(h)) * 60)
            let remaining = max(0, Double(status.targetHours) - status.elapsedHours)
            let rh = Int(remaining)
            let rm = Int((remaining - Double(rh)) * 60)
            let msg = remaining > 0
                ? "You've been fasting for \(h)h \(m)m. \(rh)h \(rm)m until your \(status.targetHours)-hour goal."
                : "Fast complete! You've fasted for \(h)h \(m)m. Great work!"
            return .result(value: status.elapsedHours, dialog: IntentDialog(stringLiteral: msg))
        } else {
            return .result(
                value: 0,
                dialog: IntentDialog(stringLiteral: "No active fast. Say \"Start fasting in KQuarks\" to begin.")
            )
        }
    }
}

struct EndFastIntent: AppIntent {
    static var title: LocalizedStringResource = "End Fasting"
    static var description = IntentDescription("End your current fasting session in KQuarks.")

    func perform() async throws -> some ReturnsValue<Double> & ProvidesDialog {
        guard SupabaseService.shared.isAuthenticated else {
            return .result(
                value: 0,
                dialog: IntentDialog(stringLiteral: "Please open KQuarks and sign in first.")
            )
        }
        guard let elapsed = try await SupabaseService.shared.endFasting() else {
            return .result(
                value: 0,
                dialog: IntentDialog(stringLiteral: "No active fast found. Say \"Start fasting in KQuarks\" to begin one.")
            )
        }
        NotificationService.shared.cancelFastingNotifications()
        let h = Int(elapsed)
        let m = Int((elapsed - Double(h)) * 60)
        return .result(
            value: elapsed,
            dialog: IntentDialog(stringLiteral: "Fast ended. You fasted for \(h)h \(m)m. Great work!")
        )
    }
}

struct GetHabitsProgressIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Today's Habit Progress"
    static var description = IntentDescription("Shows how many habits you've completed today in KQuarks.")

    func perform() async throws -> some ReturnsValue<Int> & ProvidesDialog {
        guard SupabaseService.shared.isAuthenticated else {
            return .result(
                value: 0,
                dialog: IntentDialog(stringLiteral: "Please open KQuarks and sign in first.")
            )
        }
        guard let session = SupabaseService.shared.currentSession else {
            return .result(value: 0, dialog: IntentDialog(stringLiteral: "Not signed in."))
        }
        let (habits, completions) = (try? await SupabaseService.shared.fetchHabits(userId: session.user.id.uuidString)) ?? ([], [])

        let dowLabels = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        let todayDow = dowLabels[Calendar.current.component(.weekday, from: Date()) - 1]
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let today = df.string(from: Date())

        let todayHabits = habits.filter { $0.target_days.contains(todayDow) }
        let done = todayHabits.filter { h in completions.contains { $0.habit_id == h.id && $0.date == today } }.count
        let total = todayHabits.count

        if total == 0 {
            return .result(value: 0, dialog: IntentDialog(stringLiteral: "You have no habits scheduled for today."))
        }
        let msg = done == total
            ? "All \(total) habits done today. Great work!"
            : "You've completed \(done) of \(total) habits today."
        return .result(value: done, dialog: IntentDialog(stringLiteral: msg))
    }
}

struct LogCheckinIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Daily Check-in"
    static var description = IntentDescription("Log your energy, mood, and stress levels in KQuarks.")

    @Parameter(title: "Energy (1-5)", description: "Your energy level from 1 (very low) to 5 (great).", default: 3)
    var energy: Int

    @Parameter(title: "Mood (1-5)", description: "Your mood from 1 (very low) to 5 (excellent).", default: 3)
    var mood: Int

    @Parameter(title: "Stress (1-5)", description: "Your stress level from 1 (none) to 5 (very high).", default: 2)
    var stress: Int

    static var parameterSummary: some ParameterSummary {
        Summary("Log check-in: energy \(\.$energy), mood \(\.$mood), stress \(\.$stress)")
    }

    func perform() async throws -> some ReturnsValue<Bool> & ProvidesDialog {
        guard SupabaseService.shared.isAuthenticated else {
            return .result(
                value: false,
                dialog: IntentDialog(stringLiteral: "Please open KQuarks and sign in first.")
            )
        }
        let e = max(1, min(5, energy))
        let m = max(1, min(5, mood))
        let s = max(1, min(5, stress))
        try await SupabaseService.shared.logCheckin(energy: e, mood: m, stress: s, notes: nil)
        return .result(
            value: true,
            dialog: IntentDialog(stringLiteral: "Check-in logged. Energy \(e)/5, mood \(m)/5, stress \(s)/5.")
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
        AppShortcut(
            intent: SyncHealthDataIntent(),
            phrases: [
                "Sync my health data in \(.applicationName)",
                "Sync \(.applicationName)"
            ],
            shortTitle: "Sync Health Data",
            systemImageName: "arrow.clockwise.heart"
        )
        AppShortcut(
            intent: GetTodayCaloriesIntent(),
            phrases: [
                "How many calories today in \(.applicationName)",
                "Show my calories in \(.applicationName)"
            ],
            shortTitle: "Today's Calories",
            systemImageName: "flame.fill"
        )
        AppShortcut(
            intent: GetTodayHRVIntent(),
            phrases: [
                "What's my HRV in \(.applicationName)",
                "Show my heart rate variability in \(.applicationName)"
            ],
            shortTitle: "Today's HRV",
            systemImageName: "waveform.path.ecg"
        )
        AppShortcut(
            intent: StartFastIntent(),
            phrases: [
                "Start fasting in \(.applicationName)",
                "Begin my fast in \(.applicationName)"
            ],
            shortTitle: "Start Fast",
            systemImageName: "timer"
        )
        AppShortcut(
            intent: LogCheckinIntent(),
            phrases: [
                "Log my check-in in \(.applicationName)",
                "Daily check-in in \(.applicationName)"
            ],
            shortTitle: "Daily Check-in",
            systemImageName: "checklist"
        )
    }
}
