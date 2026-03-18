import UserNotifications
import SwiftUI

@Observable
final class NotificationService {
    static let shared = NotificationService()
    private init() {}

    var isAuthorized = false

    private let stepGoalNotifiedKey = "stepGoalNotifiedDate"
    private let weeklyReviewKey = "weeklyReviewNotifiedDate"
    private let stepReminderKey = "stepReminderNotifiedDate"
    private let hrvHistoryKey = "hrv_history_json"
    private let hrvAlertKey = "hrvAlertNotifiedDate"

    // Configurable morning brief hour (0-23), defaults to 8am
    @ObservationIgnored
    @AppStorage("morningBriefHour") var morningBriefHour: Int = 8

    // Toggle: step afternoon reminder enabled
    @ObservationIgnored
    @AppStorage("stepReminderEnabled") var stepReminderEnabled: Bool = true

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

            // Afternoon step reminder (4–8pm, if below 50% of goal and enabled)
            let hour = Calendar.current.component(.hour, from: Date())
            if stepReminderEnabled && hour >= 16 && hour <= 20 && !alreadySentStepReminderToday() {
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

            // HRV baseline alert — cache today's reading and fire if 2+ days below baseline
            if let hrv = summary.hrv, hrv > 0 {
                cacheHRVValue(hrv)
                checkHRVAlert(todayHRV: hrv)
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
        components.hour = morningBriefHour
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

    // MARK: - HRV Baseline Alert

    /// Appends today's HRV reading to the rolling 35-day history stored in UserDefaults.
    func cacheHRVValue(_ hrv: Double) {
        var history = loadHRVHistory()
        history.append((Date(), hrv))
        let cutoff = Calendar.current.date(byAdding: .day, value: -35, to: Date())!
        history = history.filter { $0.0 > cutoff }
        let json = history.map { ["ts": $0.0.timeIntervalSince1970, "hrv": $0.1] }
        if let data = try? JSONSerialization.data(withJSONObject: json) {
            UserDefaults.standard.set(data, forKey: hrvHistoryKey)
        }
    }

    /// Fires a local notification if HRV has been ≥15% below 30-day baseline
    /// for 2 or more consecutive days. Sends at most once per day.
    func checkHRVAlert(todayHRV: Double) {
        guard isAuthorized else { return }
        guard !alreadySentHRVAlertToday() else { return }

        let history = loadHRVHistory()
        guard history.count >= 7 else { return }

        // Baseline: all entries older than 3 days (avoids comparing against the current dip)
        let threeDaysAgo = Calendar.current.date(byAdding: .day, value: -3, to: Date())!
        let baseline = history.filter { $0.0 < threeDaysAgo }
        guard baseline.count >= 5 else { return }
        let baselineAvg = baseline.map { $0.1 }.reduce(0, +) / Double(baseline.count)

        // Recent 2 days (today + yesterday)
        let calendar = Calendar.current
        let recentReadings = history.filter {
            calendar.isDateInToday($0.0) || calendar.isDateInYesterday($0.0)
        }
        guard recentReadings.count >= 2 else { return }
        let recentAvg = recentReadings.map { $0.1 }.reduce(0, +) / Double(recentReadings.count)

        if recentAvg < baselineAvg * 0.85 {
            let diff = Int(baselineAvg - recentAvg)
            scheduleHRVAlert(currentHRV: Int(recentAvg), baseline: Int(baselineAvg), diff: diff)
            markHRVAlertSentToday()
        }
    }

    private func scheduleHRVAlert(currentHRV: Int, baseline: Int, diff: Int) {
        let content = UNMutableNotificationContent()
        content.title = "HRV Below Baseline"
        content.body = "Your HRV (\(currentHRV) ms) is \(diff) ms below your baseline of \(baseline) ms. Consider prioritising rest and recovery today."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "hrv-alert-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    private func loadHRVHistory() -> [(Date, Double)] {
        guard let data = UserDefaults.standard.data(forKey: hrvHistoryKey),
              let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Double]]
        else { return [] }
        return arr.compactMap { entry -> (Date, Double)? in
            guard let ts = entry["ts"], let hrv = entry["hrv"] else { return nil }
            return (Date(timeIntervalSince1970: ts), hrv)
        }
    }

    private func alreadySentHRVAlertToday() -> Bool {
        guard let last = UserDefaults.standard.object(forKey: hrvAlertKey) as? Date else { return false }
        return Calendar.current.isDateInToday(last)
    }

    private func markHRVAlertSentToday() {
        UserDefaults.standard.set(Date(), forKey: hrvAlertKey)
    }
}
