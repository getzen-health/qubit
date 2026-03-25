import Foundation
import UserNotifications
#if os(iOS)
import BackgroundTasks
#endif

/// Manages AI-generated morning briefings.
///
/// Registers and schedules a `BGProcessingTask` that fires at ~7am each day.
/// When triggered it calls the `morning-briefing` Supabase Edge Function,
/// persists the result to `UserDefaults`, and posts a local push notification
/// with the first sentence of the briefing.
@Observable
class AIBriefingService {
    static let shared = AIBriefingService()

    var latestBriefing: String?
    var lastBriefingDate: Date?

    static let backgroundTaskIdentifier = "com.kquarks.morning-briefing"

    // UserDefaults keys
    private let briefingContentKey = "ai_briefing_content"
    private let briefingDateKey = "ai_briefing_date"

    private init() {
        // Restore cached briefing on startup
        latestBriefing = UserDefaults.standard.string(forKey: briefingContentKey)
        lastBriefingDate = UserDefaults.standard.object(forKey: briefingDateKey) as? Date
    }

    // MARK: - Background Task Registration

    /// Register the BGProcessingTask with the system.
    /// Must be called early in the app lifecycle (e.g. `application(_:didFinishLaunchingWithOptions:)`).
    func registerBackgroundTask() {
        #if os(iOS)
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: AIBriefingService.backgroundTaskIdentifier,
            using: nil
        ) { [weak self] task in
            guard let processingTask = task as? BGProcessingTask else { return }
            self?.handleBackgroundTask(processingTask)
        }
        #endif
    }

    /// Schedule the next briefing processing task for ~7am the following day.
    func scheduleBriefingTask() {
        #if os(iOS)
        let request = BGProcessingTaskRequest(
            identifier: AIBriefingService.backgroundTaskIdentifier
        )

        // Target 7am local time tomorrow
        var components = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        components.day = (components.day ?? 0) + 1
        components.hour = 7
        components.minute = 0
        components.second = 0
        let earliestBeginDate = Calendar.current.date(from: components) ?? Date().addingTimeInterval(8 * 3600)

        request.earliestBeginDate = earliestBeginDate
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("[AIBriefingService] Failed to schedule background task: \(error)")
        }
        #endif
    }

    // MARK: - Background Task Handler

    /// Called by the system when the scheduled BGProcessingTask fires.
    /// Reschedules the next task before doing work to ensure continuity.
    #if os(iOS)
    func handleBackgroundTask(_ task: BGProcessingTask) {
        // Reschedule for the next day immediately
        scheduleBriefingTask()

        let fetchTask = Task {
            await fetchBriefing()
            task.setTaskCompleted(success: true)
        }

        task.expirationHandler = {
            fetchTask.cancel()
            task.setTaskCompleted(success: false)
        }
    }
    #endif

    // MARK: - Briefing Fetch

    /// Calls the Supabase `morning-briefing` Edge Function, saves the result
    /// locally, and fires a push notification with the briefing's first sentence.
    func fetchBriefing() async {
        guard let userId = SupabaseService.shared.currentSession?.user.id.uuidString else {
            print("[AIBriefingService] No authenticated user — skipping briefing fetch")
            return
        }

        let supabaseUrl = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String
            ?? ProcessInfo.processInfo.environment["SUPABASE_URL"]
            ?? ""
        let supabaseAnonKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String
            ?? ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
            ?? ""

        guard !supabaseUrl.isEmpty, let url = URL(string: "\(supabaseUrl)/functions/v1/morning-briefing") else {
            print("[AIBriefingService] Invalid or missing SUPABASE_URL")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: String] = ["user_id": userId]
        do {
            request.httpBody = try JSONEncoder().encode(payload)
        } catch {
            print("[AIBriefingService] Failed to encode request payload: \(error)")
            return
        }

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                print("[AIBriefingService] Non-HTTP response received")
                return
            }

            guard httpResponse.statusCode == 200 else {
                let body = String(data: data, encoding: .utf8) ?? "(unreadable)"
                print("[AIBriefingService] Edge function returned HTTP \(httpResponse.statusCode): \(body)")
                return
            }

            struct BriefingResponse: Decodable {
                let briefing: String
            }

            let decoded = try JSONDecoder().decode(BriefingResponse.self, from: data)
            let briefingText = decoded.briefing
            let now = Date()

            // Persist to UserDefaults
            UserDefaults.standard.set(briefingText, forKey: briefingContentKey)
            UserDefaults.standard.set(now, forKey: briefingDateKey)

            // Update in-memory state on main actor
            await MainActor.run {
                self.latestBriefing = briefingText
                self.lastBriefingDate = now
            }

            // Send local push notification
            await sendBriefingNotification(briefingText)

        } catch {
            print("[AIBriefingService] Network request failed: \(error)")
        }
    }

    // MARK: - Push Notification

    private func sendBriefingNotification(_ briefing: String) async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        guard settings.authorizationStatus == .authorized else { return }

        // Use just the first sentence as the notification body
        let firstSentence = briefing
            .components(separatedBy: CharacterSet(charactersIn: ".!?"))
            .first?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            ?? briefing

        let content = UNMutableNotificationContent()
        content.title = "Good morning 👋"
        content.body = firstSentence.isEmpty ? briefing : firstSentence
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "morning-briefing-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("[AIBriefingService] Failed to schedule briefing notification: \(error)")
        }
    }
}
