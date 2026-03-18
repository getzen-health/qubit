import UserNotifications

@Observable
final class NotificationService {
    static let shared = NotificationService()
    private init() {}

    var isAuthorized = false

    private let stepGoalNotifiedKey = "stepGoalNotifiedDate"

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

            // Update morning brief with fresh data
            let recoveryScore = UserDefaults.standard.integer(forKey: "cached_recovery_score")
            scheduleMorningBrief(
                recoveryScore: recoveryScore > 0 ? recoveryScore : nil,
                steps: summary.steps,
                stepGoal: Int(goal)
            )
        } catch { }
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
}
