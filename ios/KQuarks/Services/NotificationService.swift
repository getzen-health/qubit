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

    // Toggle: fasting milestone notifications
    @ObservationIgnored
    @AppStorage("fastingMilestonesEnabled") var fastingMilestonesEnabled: Bool = true

    // Toggle: daily water reminder
    @ObservationIgnored
    @AppStorage("waterReminderEnabled") var waterReminderEnabled: Bool = false

    // Water reminder hour (0-23), defaults to 2pm
    @ObservationIgnored
    @AppStorage("waterReminderHour") var waterReminderHour: Int = 14

    // Sleep wind-down reminder toggle
    @ObservationIgnored
    @AppStorage("sleepReminderEnabled") var sleepReminderEnabled: Bool = false

    // Sleep reminder hour (0-23), defaults to 9pm
    @ObservationIgnored
    @AppStorage("sleepReminderHour") var sleepReminderHour: Int = 21

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
            do {
                try await UNUserNotificationCenter.current().setBadgeCount(badgeValue)
            } catch {
                print("[NotificationService] Failed to set badge count: \(error)")
            }
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
        let weekStart = Calendar.current.date(byAdding: .day, value: -6, to: Calendar.current.startOfDay(for: Date())) ?? Date()
        var summaries: [DaySummaryForAI] = []
        do { summaries = try await HealthKitService.shared.fetchWeekSummaries(days: 7) } catch {
            print("[NotificationService] Failed to fetch week summaries: \(error)")
        }
        var workoutCount = 0
        do { workoutCount = try await HealthKitService.shared.fetchWorkouts(from: weekStart, to: Date()).count } catch {
            print("[NotificationService] Failed to fetch workouts for weekly review: \(error)")
        }

        let weeklySteps = summaries.reduce(0) { $0 + $1.steps }
        let goalDays = summaries.filter { Double($0.steps) >= GoalService.shared.stepsGoal }.count

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
        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("[NotificationService] Failed to schedule weekly review notification: \(error)")
        }
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
        let cutoff = Calendar.current.date(byAdding: .day, value: -35, to: Date()) ?? Date()
        history = history.filter { $0.0 > cutoff }
        let json = history.map { ["ts": $0.0.timeIntervalSince1970, "hrv": $0.1] }
        do {
            let data = try JSONSerialization.data(withJSONObject: json)
            UserDefaults.standard.set(data, forKey: hrvHistoryKey)
        } catch {
            print("[NotificationService] Failed to serialize HRV history: \(error)")
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
        let threeDaysAgo = Calendar.current.date(byAdding: .day, value: -3, to: Date()) ?? Date()
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

    // MARK: - Achievement Unlocked

    func scheduleAchievementUnlocked(icon: String, title: String, description: String) {
        guard isAuthorized else { return }
        let content = UNMutableNotificationContent()
        content.title = "\(icon) Achievement Unlocked!"
        content.body = "\(title) — \(description)"
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 2, repeats: false)
        let request = UNNotificationRequest(
            identifier: "achievement-\(title.lowercased().replacingOccurrences(of: " ", with: "-"))-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    // MARK: - Fasting Milestones

    /// Schedule local notifications at 25%, 50%, 75%, and 100% of the fasting target.
    /// Call when a fast is started.
    func scheduleFastingMilestones(targetHours: Int, startedAt: Date) {
        guard isAuthorized, fastingMilestonesEnabled else { return }
        cancelFastingNotifications()

        let milestones: [(fraction: Double, label: String)] = [
            (0.25, "25%"),
            (0.50, "Halfway"),
            (0.75, "75%"),
            (1.00, "Goal reached"),
        ]

        for m in milestones {
            let hoursElapsed = Double(targetHours) * m.fraction
            let fireDate = startedAt.addingTimeInterval(hoursElapsed * 3600)
            guard fireDate > Date() else { continue }

            let content = UNMutableNotificationContent()
            if m.fraction < 1.0 {
                content.title = "Fasting \(m.label)"
                content.body = "\(String(format: "%.0f", hoursElapsed))h down — \(String(format: "%.0f", Double(targetHours) - hoursElapsed))h to go. Stay strong!"
            } else {
                content.title = "Fast Complete! 🎉"
                content.body = "You've hit your \(targetHours)h fasting goal. Amazing discipline!"
            }
            content.sound = .default

            let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: fireDate)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(
                identifier: "fasting-milestone-\(m.fraction)",
                content: content,
                trigger: trigger
            )
            UNUserNotificationCenter.current().add(request)
        }
    }

    /// Cancel all pending fasting milestone notifications.
    func cancelFastingNotifications() {
        let ids = [0.25, 0.50, 0.75, 1.00].map { "fasting-milestone-\($0)" }
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
    }

    // MARK: - Water Reminder

    /// Schedule (or replace) a daily water goal reminder at the configured hour.
    func scheduleWaterReminder() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["water-reminder"])
        guard isAuthorized, waterReminderEnabled else { return }

        let content = UNMutableNotificationContent()
        content.title = "Stay Hydrated 💧"
        content.body = "Don't forget to log your water intake and hit your daily hydration goal."
        content.sound = .default

        var components = DateComponents()
        components.hour = waterReminderHour
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: "water-reminder", content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    // MARK: - Sleep Wind-Down Reminder

    /// Schedule (or replace) a nightly sleep wind-down reminder.
    func scheduleSleepReminder() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["sleep-reminder"])
        guard isAuthorized, sleepReminderEnabled else { return }

        let content = UNMutableNotificationContent()
        content.title = "Wind Down 🌙"
        content.body = "Time to start winding down for bed. Good sleep is the foundation of great health."
        content.sound = .default

        var components = DateComponents()
        components.hour = sleepReminderHour
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: "sleep-reminder", content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    private func loadHRVHistory() -> [(Date, Double)] {
        guard let data = UserDefaults.standard.data(forKey: hrvHistoryKey) else { return [] }
        do {
            guard let arr = try JSONSerialization.jsonObject(with: data) as? [[String: Double]] else { return [] }
            return arr.compactMap { entry -> (Date, Double)? in
                guard let ts = entry["ts"], let hrv = entry["hrv"] else { return nil }
                return (Date(timeIntervalSince1970: ts), hrv)
            }
        } catch {
            print("[NotificationService] Failed to decode HRV history: \(error)")
            return []
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
