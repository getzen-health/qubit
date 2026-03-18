import UserNotifications

@Observable
final class NotificationService {
    static let shared = NotificationService()
    private init() {}

    var isAuthorized = false

    private let stepGoalNotifiedKey = "stepGoalNotifiedDate"
    private let weeklyReviewKey = "weeklyReviewNotifiedDate"
    private let stepReminderKey = "stepReminderNotifiedDate"

    func requestPermission() async {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            await MainActor.run { isAuthorized = granted }
        } catch {
            await MainActor.run { isAuthorized = false }
        }
    }

    func refreshAuthorizationStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        await MainActor.run {
            isAuthorized = settings.authorizationStatus == .authorized
        }
    }

    func notifyAfterSync() async {
        guard isAuthorized else { return }

        do {
            let summary = try await HealthKitService.shared.fetchTodaySummary()
            let goal = GoalService.shared.stepsGoal

            if !alreadyNotifiedStepGoalToday() && Double(summary.steps) >= goal {
                scheduleStepGoalNotification(steps: Double(summary.steps), goal: goal)
                markStepGoalNotifiedToday()
            }

            // Update app icon badge with step progress (remaining steps to goal, 0 when goal reached)
            updateStepBadge(steps: summary.steps, goal: Int(goal))

            // Update morning brief with fresh data
            let recoveryScore = UserDefaults.standard.integer(forKey: "cached_recovery_score")
            scheduleMorningBrief(
                recoveryScore: recoveryScore > 0 ? recoveryScore : nil,
                steps: summary.steps,
                stepGoal: Int(goal)
            )

            // Afternoon step reminder (4–8pm, if below 50% of goal)
            let hour = Calendar.current.component(.hour, from: Date())
            if hour >= 16 && hour <= 20 && !alreadySentStepReminderToday() {
                let pct = Double(summary.steps) / goal
                if pct < 0.5 {
                    let remaining = Int(goal) - summary.steps
                    scheduleStepReminder(remaining: remaining)
                    markStepReminderSentToday()
                }
            }

            // Weekly review notification on Sundays
            let weekday = Calendar.current.component(.weekday, from: Date())
            if weekday == 1 && !alreadyNotifiedWeeklyReviewThisWeek() {
                await scheduleWeeklyReview()
            }
        } catch { }
    }

    /// Shows remaining steps to goal on app icon badge. Clears badge when goal is met.
    func updateStepBadge(steps: Int, goal: Int) {
        guard isAuthorized else { return }
        let remaining = max(goal - steps, 0)
        // Show remaining in hundreds (e.g. 2500 remaining → badge 25), cap at 99
        let badgeValue = min(remaining / 100, 99)
        Task { @MainActor in
            try? await UNUserNotificationCenter.current().setBadgeCount(badgeValue)
        }
    }

    /// Schedules (or replaces) tomorrow's 8am morning brief with today's data.
    func scheduleMorningBrief(recoveryScore: Int?, steps: Int, stepGoal: Int) {
        guard isAuthorized else { return }

        let content = UNMutableNotificationContent()
        content.title = "Morning Brief"

        var bodyParts: [String] = []
        if let rec = recoveryScore, rec > 0 {
            let emoji = rec >= 67 ? "🟢" : rec >= 34 ? "🟡" : "🔴"
            bodyParts.append("\(emoji) Recovery \(rec)%")
        }
        if steps > 0 {
            bodyParts.append("Yesterday: \(steps.formatted()) steps")
        }
        bodyParts.append("Goal: \(stepGoal.formatted()) steps today")
        content.body = bodyParts.joined(separator: " · ")
        content.sound = .default

        var components = Calendar.current.dateComponents([.hour, .minute], from: Date())
        components.hour = 8
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)

        let request = UNNotificationRequest(
            identifier: "morning-brief",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    func cancelMorningBrief() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["morning-brief"])
    }

    func scheduleInsightsNotification() {
        guard isAuthorized else { return }
        let content = UNMutableNotificationContent()
        content.title = "New Health Insights"
        content.body = "Your AI-powered health insights are ready to view."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "insights-ready-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    private func scheduleWeeklyReview() async {
        let weekStart = Calendar.current.date(byAdding: .day, value: -6, to: Calendar.current.startOfDay(for: Date()))!
        let summaries = (try? await HealthKitService.shared.fetchWeekSummaries(days: 7)) ?? []
        let workouts = (try? await HealthKitService.shared.fetchWorkouts(from: weekStart, to: Date())) ?? []

        let weeklySteps = summaries.reduce(0) { $0 + $1.steps }
        let goalDays = summaries.filter { Double($0.steps) >= GoalService.shared.stepsGoal }.count
        let workoutCount = workouts.count

        let content = UNMutableNotificationContent()
        content.title = "Your Week in Review"
        var parts: [String] = []
        if weeklySteps > 0 { parts.append("\(weeklySteps.formatted()) steps") }
        if workoutCount > 0 { parts.append("\(workoutCount) workout\(workoutCount == 1 ? "" : "s")") }
        if summaries.count > 0 { parts.append("\(goalDays)/\(summaries.count) days at goal") }
        content.body = parts.isEmpty ? "Great week — keep it up!" : parts.joined(separator: " · ")
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "weekly-review-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(request)
        markWeeklyReviewNotified()
    }

    private func alreadyNotifiedWeeklyReviewThisWeek() -> Bool {
        guard let last = UserDefaults.standard.object(forKey: weeklyReviewKey) as? Date else { return false }
        return Calendar.current.isDate(last, equalTo: Date(), toGranularity: .weekOfYear)
    }

    private func markWeeklyReviewNotified() {
        UserDefaults.standard.set(Date(), forKey: weeklyReviewKey)
    }

    private func scheduleStepGoalNotification(steps: Double, goal: Double) {
        let content = UNMutableNotificationContent()
        content.title = "Step Goal Reached!"
        content.body = "You've hit \(Int(steps).formatted()) steps today. Keep it up!"
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "step-goal-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    private func alreadyNotifiedStepGoalToday() -> Bool {
        guard let last = UserDefaults.standard.object(forKey: stepGoalNotifiedKey) as? Date else {
            return false
        }
        return Calendar.current.isDateInToday(last)
    }

    private func markStepGoalNotifiedToday() {
        UserDefaults.standard.set(Date(), forKey: stepGoalNotifiedKey)
    }

    private func scheduleStepReminder(remaining: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Keep Moving!"
        content.body = "You've got \(remaining.formatted()) steps to go — finish strong!"
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "step-reminder-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    private func alreadySentStepReminderToday() -> Bool {
        guard let last = UserDefaults.standard.object(forKey: stepReminderKey) as? Date else { return false }
        return Calendar.current.isDateInToday(last)
    }

    private func markStepReminderSentToday() {
        UserDefaults.standard.set(Date(), forKey: stepReminderKey)
    }
}
