import Foundation
import AuthenticationServices
import UIKit
import Supabase

@Observable
class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    var currentUser: User?
    var isAuthenticated: Bool { currentUser != nil }
    var currentSession: Session?

    private init() {
        // Load from environment or Info.plist
        let supabaseUrl = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String
            ?? ProcessInfo.processInfo.environment["SUPABASE_URL"]
            ?? ""
        let supabaseAnonKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String
            ?? ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
            ?? ""

        let resolvedURL: URL
        let resolvedKey: String
        if let parsedURL = URL(string: supabaseUrl), !supabaseAnonKey.isEmpty {
            resolvedURL = parsedURL
            resolvedKey = supabaseAnonKey
        } else {
            #if DEBUG
            fatalError("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY in Info.plist or environment.")
            #else
            print("[SupabaseService] Warning: Missing Supabase configuration. Backend features will be unavailable.")
            resolvedURL = URL(string: "https://placeholder.supabase.co")!
            resolvedKey = "placeholder"
            #endif
        }

        client = SupabaseClient(
            supabaseURL: resolvedURL,
            supabaseKey: resolvedKey
        )

        // Check for existing session on init
        Task {
            await restoreSession()
        }
    }

    // MARK: - Session Management

    private func restoreSession() async {
        do {
            let session = try await client.auth.session
            self.currentSession = session
            self.currentUser = try await fetchCurrentUser()
        } catch {
            // No existing session
            self.currentSession = nil
            self.currentUser = nil
        }
    }

    // MARK: - Authentication

    func signInWithApple(credential: ASAuthorizationAppleIDCredential) async throws {
        guard let identityToken = credential.identityToken,
              let tokenString = String(data: identityToken, encoding: .utf8) else {
            throw SupabaseError.invalidCredential
        }

        // Sign in with Supabase using the Apple ID token
        let session = try await client.auth.signInWithIdToken(
            credentials: .init(
                provider: .apple,
                idToken: tokenString
            )
        )

        self.currentSession = session

        // Update user profile with name if available (only on first sign-in)
        if let fullName = credential.fullName {
            let displayName = [fullName.givenName, fullName.familyName]
                .compactMap { $0 }
                .joined(separator: " ")

            if !displayName.isEmpty {
                do {
                    try await updateUserProfile(displayName: displayName)
                } catch {
                    print("[SupabaseService] Failed to update user profile on sign-in: \(error)")
                }
            }
        }

        // Fetch the user profile
        self.currentUser = try await fetchCurrentUser()
    }

    func signOut() async throws {
        try await client.auth.signOut()
        currentSession = nil
        currentUser = nil
    }

    func fetchCurrentUser() async throws -> User? {
        guard let userId = currentSession?.user.id else {
            return nil
        }

        let response: User = try await client
            .from("users")
            .select()
            .eq("id", value: userId.uuidString)
            .single()
            .execute()
            .value

        return response
    }

    private func updateUserProfile(displayName: String) async throws {
        guard let userId = currentSession?.user.id else { return }

        try await client
            .from("users")
            .update(["display_name": displayName])
            .eq("id", value: userId.uuidString)
            .execute()
    }

    func updateLastSyncAt() async {
        guard let userId = currentSession?.user.id else { return }
        let (deviceId, deviceName) = await MainActor.run {
            (UIDevice.current.identifierForVendor?.uuidString ?? "unknown", UIDevice.current.name)
        }

        struct DeviceUpsert: Encodable {
            let userId: UUID
            let deviceName: String
            let deviceType: String
            let deviceId: String
            let lastSyncAt: Date
            enum CodingKeys: String, CodingKey {
                case userId = "user_id"
                case deviceName = "device_name"
                case deviceType = "device_type"
                case deviceId = "device_id"
                case lastSyncAt = "last_sync_at"
            }
        }

        do {
            try await client
                .from("user_devices")
                .upsert(
                    DeviceUpsert(
                        userId: userId,
                        deviceName: deviceName,
                        deviceType: "iphone",
                        deviceId: deviceId,
                        lastSyncAt: Date()
                    ),
                    onConflict: "user_id,device_id"
                )
                .execute()
        } catch {
            print("[SupabaseService] updateLastSyncAt failed: \(error)")
        }
    }

    func saveDevicePushToken(_ token: String) async {
        guard let userId = currentSession?.user.id else { return }

        struct PushTokenUpsert: Encodable {
            let userId: UUID
            let token: String
            let platform: String
            let updatedAt: Date
            enum CodingKeys: String, CodingKey {
                case userId = "user_id"
                case token
                case platform
                case updatedAt = "updated_at"
            }
        }

        do {
            try await client
                .from("push_tokens")
                .upsert(
                    PushTokenUpsert(userId: userId, token: token, platform: "ios", updatedAt: Date()),
                    onConflict: "user_id"
                )
                .execute()
        } catch {
            print("[SupabaseService] saveDevicePushToken failed: \(error)")
        }
    }

    func fetchTodayReadinessScore() async throws -> Int? {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let todayStr = df.string(from: Date())

        struct ReadinessRow: Decodable {
            let recovery_score: Int?
        }

        let rows: [ReadinessRow] = try await client
            .from("daily_summaries")
            .select("recovery_score")
            .eq("date", value: todayStr)
            .limit(1)
            .execute()
            .value

        return rows.first?.recovery_score
    }

    func syncReadinessScore(_ score: Int, date: Date) async {
        guard let userId = currentSession?.user.id else { return }

        struct ReadinessUpsert: Encodable {
            let user_id: String
            let date: String
            let recovery_score: Int
        }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        do {
            try await client
                .from("daily_summaries")
                .upsert(
                    ReadinessUpsert(user_id: userId.uuidString, date: df.string(from: date), recovery_score: score),
                    onConflict: "user_id,date"
                )
                .execute()
        } catch {
            print("[SupabaseService] syncReadinessScore failed: \(error)")
        }
    }

    // MARK: - Notification Preferences

    struct NotificationPreferences: Codable {
        var morningBriefing: Bool
        var goalReminders: Bool
        var anomalyAlerts: Bool
        var streakMilestones: Bool
        var weeklyDigest: Bool
        var hrvAlerts: Bool
        var sleepAlerts: Bool
        var activityReminders: Bool
        var briefingHour: Int
        var hrvThresholdPercent: Int
        var rhrThresholdBpm: Int

        enum CodingKeys: String, CodingKey {
            case morningBriefing = "morning_briefing"
            case goalReminders = "goal_reminders"
            case anomalyAlerts = "anomaly_alerts"
            case streakMilestones = "streak_milestones"
            case weeklyDigest = "weekly_digest"
            case hrvAlerts = "hrv_alerts"
            case sleepAlerts = "sleep_alerts"
            case activityReminders = "activity_reminders"
            case briefingHour = "briefing_hour"
            case hrvThresholdPercent = "hrv_threshold_percent"
            case rhrThresholdBpm = "rhr_threshold_bpm"
        }
    }

    /// Fetches notification preferences from Supabase and updates NotificationService accordingly.
    /// Call on app launch so preferences survive reinstalls.
    func syncNotificationPreferences() async {
        guard let userId = currentSession?.user.id else { return }

        do {
            let rows: [NotificationPreferences] = try await client
                .from("notification_preferences")
                .select()
                .eq("user_id", value: userId.uuidString)
                .limit(1)
                .execute()
                .value

            guard let prefs = rows.first else { return }

            await MainActor.run {
                let svc = NotificationService.shared
                svc.morningBriefHour = prefs.briefingHour
                svc.weeklyDigestEnabled = prefs.weeklyDigest
                svc.hrvAlertEnabled = prefs.hrvAlerts
                svc.stepReminderEnabled = prefs.activityReminders
                svc.morningReadinessEnabled = prefs.morningBriefing
            }
        } catch {
            print("[SupabaseService] syncNotificationPreferences failed: \(error)")
        }
    }

    /// Persists the current NotificationService state to Supabase.
    func saveNotificationPreferences() async {
        guard let userId = currentSession?.user.id else { return }

        let svc = NotificationService.shared
        let prefs = NotificationPreferences(
            morningBriefing: svc.morningReadinessEnabled,
            goalReminders: svc.stepReminderEnabled,
            anomalyAlerts: true,
            streakMilestones: svc.achievementEnabled,
            weeklyDigest: svc.weeklyDigestEnabled,
            hrvAlerts: svc.hrvAlertEnabled,
            sleepAlerts: svc.sleepReminderEnabled,
            activityReminders: svc.stepReminderEnabled,
            briefingHour: svc.morningBriefHour,
            hrvThresholdPercent: 20,
            rhrThresholdBpm: 10
        )

        struct UpsertRow: Encodable {
            let userId: String
            let morningBriefing: Bool
            let goalReminders: Bool
            let anomalyAlerts: Bool
            let streakMilestones: Bool
            let weeklyDigest: Bool
            let hrvAlerts: Bool
            let sleepAlerts: Bool
            let activityReminders: Bool
            let briefingHour: Int
            let hrvThresholdPercent: Int
            let rhrThresholdBpm: Int
            enum CodingKeys: String, CodingKey {
                case userId = "user_id"
                case morningBriefing = "morning_briefing"
                case goalReminders = "goal_reminders"
                case anomalyAlerts = "anomaly_alerts"
                case streakMilestones = "streak_milestones"
                case weeklyDigest = "weekly_digest"
                case hrvAlerts = "hrv_alerts"
                case sleepAlerts = "sleep_alerts"
                case activityReminders = "activity_reminders"
                case briefingHour = "briefing_hour"
                case hrvThresholdPercent = "hrv_threshold_percent"
                case rhrThresholdBpm = "rhr_threshold_bpm"
            }
        }

        do {
            try await client
                .from("notification_preferences")
                .upsert(
                    UpsertRow(
                        userId: userId.uuidString,
                        morningBriefing: prefs.morningBriefing,
                        goalReminders: prefs.goalReminders,
                        anomalyAlerts: prefs.anomalyAlerts,
                        streakMilestones: prefs.streakMilestones,
                        weeklyDigest: prefs.weeklyDigest,
                        hrvAlerts: prefs.hrvAlerts,
                        sleepAlerts: prefs.sleepAlerts,
                        activityReminders: prefs.activityReminders,
                        briefingHour: prefs.briefingHour,
                        hrvThresholdPercent: prefs.hrvThresholdPercent,
                        rhrThresholdBpm: prefs.rhrThresholdBpm
                    ),
                    onConflict: "user_id"
                )
                .execute()
        } catch {
            print("[SupabaseService] saveNotificationPreferences failed: \(error)")
        }
    }

    func saveUserGoals(stepGoal: Int, calorieGoal: Int, sleepGoalMinutes: Int) async throws {
        guard let userId = currentSession?.user.id else { return }

        struct GoalUpdate: Encodable {
            let stepGoal: Int
            let calorieGoal: Int
            let sleepGoalMinutes: Int
            enum CodingKeys: String, CodingKey {
                case stepGoal = "step_goal"
                case calorieGoal = "calorie_goal"
                case sleepGoalMinutes = "sleep_goal_minutes"
            }
        }

        try await client
            .from("users")
            .update(GoalUpdate(stepGoal: stepGoal, calorieGoal: calorieGoal, sleepGoalMinutes: sleepGoalMinutes))
            .eq("id", value: userId.uuidString)
            .execute()
    }

    func updatePhysicalProfile(heightCm: Double?, weightKg: Double?, maxHeartRate: Int?, restingHr: Int?) async throws {
        guard let userId = currentSession?.user.id else { return }

        // Only non-nil values are serialised (Swift omits nil optionals from JSON),
        // so existing columns are untouched when a field is left blank.
        struct PhysicalProfileUpdate: Encodable {
            let heightCm: Double?
            let weightKg: Double?
            let maxHeartRate: Int?
            let restingHr: Int?
            enum CodingKeys: String, CodingKey {
                case heightCm = "height_cm"
                case weightKg = "weight_kg"
                case maxHeartRate = "max_heart_rate"
                case restingHr = "resting_hr"
            }
        }

        let payload = PhysicalProfileUpdate(
            heightCm: heightCm,
            weightKg: weightKg,
            maxHeartRate: maxHeartRate,
            restingHr: restingHr
        )
        try await client
            .from("users")
            .update(payload)
            .eq("id", value: userId.uuidString)
            .execute()
    }

    // MARK: - Auth State Listener

    func observeAuthStateChanges() -> AsyncStream<AuthChangeEvent> {
        AsyncStream { continuation in
            Task {
                for await (event, session) in client.auth.authStateChanges {
                    switch event {
                    case .signedIn, .tokenRefreshed, .userUpdated:
                        await MainActor.run {
                            self.currentSession = session
                            self.currentUser = nil
                        }
                    case .signedOut:
                        await MainActor.run {
                            self.currentSession = nil
                            self.currentUser = nil
                        }
                    default:
                        break
                    }
                    continuation.yield(event)
                }
            }
        }
    }

    func ensureValidSession() async throws {
        if currentSession == nil {
            let session = try await client.auth.session
            await MainActor.run { self.currentSession = session }
        }
    }

    // MARK: - Scanner History
    /// Save scan history to API
    @MainActor
    func saveScanHistory(barcode: String?, productName: String, brand: String?, score: Int?, imageURL: String?) async {
        guard let url = URL(string: "\(ProcessInfo.processInfo.environment["SUPABASE_API_BASE_URL"] ?? "https://kquarks.app")/api/scanner/history") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = currentSession?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let body: [String: Any?] = [
            "barcode": barcode,
            "product_name": productName,
            "brand": brand,
            "score": score,
            "image_url": imageURL
        ]
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body.compactMapValues { $0 })
            _ = try await URLSession.shared.data(for: request)
        } catch {
            NSLog("[KQuarks] Product scan log failed: %@", error.localizedDescription)
        }
    }

    // MARK: - Health Data Sync

    func uploadHealthRecords(_ records: [HealthRecordUpload]) async throws {
        guard !BiometricService.shared.isLocked else { throw BiometricError.appLocked }
        guard !records.isEmpty else { return }
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        // Upload in batches of 100
        let batchSize = 100
        for i in stride(from: 0, to: records.count, by: batchSize) {
            let batch = Array(records[i..<min(i + batchSize, records.count)])
            try await client
                .from("health_records")
                .upsert(batch, onConflict: "user_id,type,start_time")
                .execute()
        }
    }

    func uploadDailySummary(_ summary: DailySummaryUpload) async throws {
        guard !BiometricService.shared.isLocked else { throw BiometricError.appLocked }
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        try await client
            .from("daily_summaries")
            .upsert(summary, onConflict: "user_id,date")
            .execute()
    }

    func uploadSleepRecord(_ record: SleepRecordUpload) async throws {
        guard !BiometricService.shared.isLocked else { throw BiometricError.appLocked }
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        try await client
            .from("sleep_records")
            .upsert(record, onConflict: "user_id,start_time")
            .execute()
    }

    func uploadWorkoutRecord(_ record: WorkoutRecordUpload) async throws {
        guard !BiometricService.shared.isLocked else { throw BiometricError.appLocked }
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        try await client
            .from("workout_records")
            .upsert(record, onConflict: "user_id,start_time")
            .execute()
    }

    @available(iOS 14.0, *)
    func uploadECGRecords(_ records: [ECGRecordUpload]) async throws {
        guard !BiometricService.shared.isLocked else { throw BiometricError.appLocked }
        guard !records.isEmpty else { return }
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        try await client
            .from("ecg_records")
            .upsert(records, onConflict: "user_id,recorded_at")
            .execute()
    }

    // MARK: - Fetch Data

    func fetchDailySummary(for date: Date) async throws -> DailySummary? {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let dateStr = df.string(from: date)
        let response: [DailySummary] = try await client
            .from("daily_summaries")
            .select()
            .eq("date", value: dateStr)
            .limit(1)
            .execute()
            .value
        return response.first
    }

    func fetchWorkoutRecords(for date: Date) async throws -> [WorkoutRecord] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        let startOfDay = Calendar.current.startOfDay(for: date)
        let endOfDay = Calendar.current.date(byAdding: .day, value: 1, to: startOfDay) ?? Date()
        return try await client
            .from("workout_records")
            .select()
            .gte("start_time", value: startOfDay.ISO8601Format())
            .lt("start_time", value: endOfDay.ISO8601Format())
            .order("start_time", ascending: true)
            .execute()
            .value
    }

    func fetchSleepRecords(for date: Date) async throws -> [SleepRecord] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        // Sleep for "date" means sleep that ended on that date or the morning of
        let startOfDay = Calendar.current.startOfDay(for: date)
        let noon = Calendar.current.date(byAdding: .hour, value: 12, to: startOfDay) ?? Date()
        let previousNoon = Calendar.current.date(byAdding: .day, value: -1, to: noon) ?? Date()
        return try await client
            .from("sleep_records")
            .select()
            .gte("end_time", value: previousNoon.ISO8601Format())
            .lte("end_time", value: noon.ISO8601Format())
            .gt("duration_minutes", value: 60)
            .order("start_time", ascending: true)
            .execute()
            .value
    }

    func fetchDailySummaries(days: Int = 7) async throws -> [DailySummary] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -days, to: Date()) ?? Date()

        let response: [DailySummary] = try await client
            .from("daily_summaries")
            .select()
            .gte("date", value: startDate.ISO8601Format())
            .order("date", ascending: false)
            .execute()
            .value

        return response
    }

    func fetchSleepRecords(days: Int = 7) async throws -> [SleepRecord] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -days, to: Date()) ?? Date()

        let response: [SleepRecord] = try await client
            .from("sleep_records")
            .select()
            .gte("start_time", value: startDate.ISO8601Format())
            .order("start_time", ascending: false)
            .execute()
            .value

        return response
    }

    func fetchWorkoutRecords(days: Int = 30) async throws -> [WorkoutRecord] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -days, to: Date()) ?? Date()

        let response: [WorkoutRecord] = try await client
            .from("workout_records")
            .select()
            .gte("start_time", value: startDate.ISO8601Format())
            .order("start_time", ascending: false)
            .execute()
            .value

        return response
    }

    // MARK: - Water Logging

    func logWater(amountMl: Int) async throws {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }

        struct WaterLogInsert: Encodable {
            let userId: UUID
            let amountMl: Int
            let loggedAt: String
            let source: String
            enum CodingKeys: String, CodingKey {
                case userId = "user_id"
                case amountMl = "amount_ml"
                case loggedAt = "logged_at"
                case source
            }
        }

        try await client
            .from("water_logs")
            .upsert(WaterLogInsert(
                userId: userId,
                amountMl: amountMl,
                loggedAt: ISO8601DateFormatter().string(from: Date()),
                source: "siri"
            ), onConflict: "user_id,logged_at")
            .execute()
    }

    func getTodayWaterTotal() async throws -> Int {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }

        struct DailyWater: Decodable {
            let totalMl: Int
            enum CodingKeys: String, CodingKey {
                case totalMl = "total_ml"
            }
        }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let today = df.string(from: Date())

        let rows: [DailyWater] = try await client
            .from("daily_water")
            .select("total_ml")
            .eq("user_id", value: userId.uuidString)
            .eq("date", value: today)
            .execute()
            .value

        return rows.first?.totalMl ?? 0
    }

    func getWeekWaterHistory() async throws -> [(date: String, ml: Int)] {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let since = df.string(from: Calendar.current.date(byAdding: .day, value: -6, to: Date()) ?? Date())

        struct Row: Decodable { let date: String; let total_ml: Int }
        let rows: [Row] = try await client.from("daily_water")
            .select("date, total_ml")
            .eq("user_id", value: userId.uuidString)
            .gte("date", value: since)
            .order("date", ascending: true)
            .execute()
            .value

        return rows.map { (date: $0.date, ml: $0.total_ml) }
    }

    func getWaterTarget() async throws -> Int {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }
        struct Row: Decodable { let water_target_ml: Int? }
        let rows: [Row] = try await client.from("user_nutrition_settings")
            .select("water_target_ml")
            .eq("user_id", value: userId.uuidString)
            .limit(1)
            .execute()
            .value
        return rows.first?.water_target_ml ?? 2500
    }

    // MARK: - Fasting Sessions

    func startFasting(protocolName: String, targetHours: Int) async throws {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }

        struct FastingInsert: Encodable {
            let userId: UUID
            let protocolName: String
            let targetHours: Int
            let startedAt: String
            enum CodingKeys: String, CodingKey {
                case userId = "user_id"
                case protocolName = "protocol"
                case targetHours = "target_hours"
                case startedAt = "started_at"
            }
        }

        try await client
            .from("fasting_sessions")
            .upsert(FastingInsert(
                userId: userId,
                protocolName: protocolName,
                targetHours: targetHours,
                startedAt: ISO8601DateFormatter().string(from: Date())
            ), onConflict: "user_id,started_at")
            .execute()
    }

    func getFastingStatus() async throws -> (isActive: Bool, elapsedHours: Double, targetHours: Int) {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }

        struct FastingSession: Decodable {
            let startedAt: String
            let targetHours: Int
            let endedAt: String?
            enum CodingKeys: String, CodingKey {
                case startedAt = "started_at"
                case targetHours = "target_hours"
                case endedAt = "ended_at"
            }
        }

        let since = ISO8601DateFormatter().string(from: Calendar.current.date(byAdding: .day, value: -2, to: Date()) ?? Date())

        let sessions: [FastingSession] = try await client
            .from("fasting_sessions")
            .select("started_at,target_hours,ended_at")
            .eq("user_id", value: userId.uuidString)
            .gte("started_at", value: since)
            .order("started_at", ascending: false)
            .limit(5)
            .execute()
            .value

        guard let active = sessions.first(where: { $0.endedAt == nil }) else {
            return (false, 0, 0)
        }

        let start = ISO8601DateFormatter().date(from: active.startedAt) ?? Date()
        let elapsed = Date().timeIntervalSince(start) / 3600
        return (true, elapsed, active.targetHours)
    }

    func endFasting() async throws -> Double? {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }

        struct FastingSession: Decodable {
            let id: UUID
            let startedAt: String
            let targetHours: Int
            let endedAt: String?
            enum CodingKeys: String, CodingKey {
                case id
                case startedAt = "started_at"
                case targetHours = "target_hours"
                case endedAt = "ended_at"
            }
        }

        struct FastingUpdate: Encodable {
            let endedAt: String
            let actualHours: Double
            let completed: Bool
            enum CodingKeys: String, CodingKey {
                case endedAt = "ended_at"
                case actualHours = "actual_hours"
                case completed
            }
        }

        let since = ISO8601DateFormatter().string(from: Calendar.current.date(byAdding: .day, value: -2, to: Date()) ?? Date())

        let sessions: [FastingSession] = try await client
            .from("fasting_sessions")
            .select("id,started_at,target_hours,ended_at")
            .eq("user_id", value: userId.uuidString)
            .gte("started_at", value: since)
            .order("started_at", ascending: false)
            .limit(5)
            .execute()
            .value

        guard let active = sessions.first(where: { $0.endedAt == nil }) else {
            return nil
        }

        let now = Date()
        let start = ISO8601DateFormatter().date(from: active.startedAt) ?? now
        let elapsed = now.timeIntervalSince(start) / 3600

        try await client
            .from("fasting_sessions")
            .update(FastingUpdate(
                endedAt: ISO8601DateFormatter().string(from: now),
                actualHours: elapsed,
                completed: elapsed >= Double(active.targetHours)
            ))
            .eq("id", value: active.id.uuidString)
            .execute()

        return elapsed
    }

    func getFastingHistory(limit: Int = 10) async throws -> [FastSession] {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }
        let sessions: [FastSession] = try await client.from("fasting_sessions")
            .select("id, protocol, target_hours, started_at, ended_at, actual_hours, completed")
            .eq("user_id", value: userId.uuidString)
            .order("started_at", ascending: false)
            .limit(limit)
            .execute()
            .value
        return sessions
    }

    // MARK: - Daily Check-ins

    func logCheckin(energy: Int?, mood: Int?, stress: Int?, notes: String?) async throws {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let userId = session.user.id.uuidString

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let today = df.string(from: Date())

        struct CheckinPayload: Encodable {
            let user_id: String
            let date: String
            let energy: Int?
            let mood: Int?
            let stress: Int?
            let notes: String?
        }

        try await client.from("daily_checkins")
            .upsert(
                CheckinPayload(user_id: userId, date: today, energy: energy, mood: mood, stress: stress, notes: notes),
                onConflict: "user_id,date"
            )
            .execute()
    }

    func getCheckinHistory(days: Int = 7) async throws -> [(date: String, energy: Int, mood: Int, stress: Int, notes: String?)] {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let cutoff = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        let cutoffStr = df.string(from: cutoff)

        struct CheckinRow: Decodable {
            let date: String
            let energy: Int
            let mood: Int
            let stress: Int
            let notes: String?
        }
        let rows: [CheckinRow] = try await client.from("daily_checkins")
            .select("date, energy, mood, stress, notes")
            .eq("user_id", value: userId.uuidString)
            .gte("date", value: cutoffStr)
            .order("date", ascending: false)
            .execute()
            .value

        return rows.map { ($0.date, $0.energy, $0.mood, $0.stress, $0.notes) }
    }

    // MARK: - Nutrition

    struct MealEntry: Identifiable, Decodable {
        let id: String
        let name: String
        let meal_type: String
        let calories: Int
        let protein: Double
        let carbs: Double
        let fat: Double
        let logged_at: String
    }

    struct DailyNutrition: Decodable {
        let calories_consumed: Int
        let protein_consumed: Double
        let carbs_consumed: Double
        let fat_consumed: Double
        let meal_count: Int
    }

    func logMeal(
        mealType: String,
        name: String,
        calories: Int,
        protein: Double,
        carbs: Double,
        fat: Double,
        servings: Double = 1.0
    ) async throws {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let userId = session.user.id.uuidString

        struct MealPayload: Encodable {
            let user_id: String
            let name: String
            let meal_type: String
        }

        struct ItemPayload: Encodable {
            let meal_id: String
            let user_id: String
            let name: String
            let serving_size: String
            let servings: Double
            let calories: Int
            let protein: Double
            let carbs: Double
            let fat: Double
            let source: String
        }

        // Create meal
        struct MealRow: Decodable { let id: String }
        let meals: [MealRow] = try await client.from("meals")
            .insert(MealPayload(user_id: userId, name: name, meal_type: mealType))
            .select("id")
            .execute()
            .value
        guard let mealId = meals.first?.id else { return }

        // Create meal item
        try await client.from("meal_items")
            .insert(ItemPayload(
                meal_id: mealId,
                user_id: userId,
                name: name,
                serving_size: "1 serving",
                servings: servings,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat,
                source: "manual"
            ))
            .execute()
    }

    // MARK: Nutrition Goals

    struct NutritionGoals {
        let calories: Int
        let protein: Int
        let carbs: Int
        let fat: Int
    }

    func fetchNutritionGoals() async throws -> NutritionGoals? {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }
        struct Row: Decodable {
            let calories_target: Int?
            let protein_target: Int?
            let carbs_target: Int?
            let fat_target: Int?
        }
        let rows: [Row] = try await client.from("user_nutrition_settings")
            .select("calories_target, protein_target, carbs_target, fat_target")
            .eq("user_id", value: userId.uuidString)
            .limit(1)
            .execute()
            .value
        guard let row = rows.first,
              let cal = row.calories_target else { return nil }
        return NutritionGoals(
            calories: cal,
            protein: row.protein_target ?? 150,
            carbs: row.carbs_target ?? 250,
            fat: row.fat_target ?? 65
        )
    }

    func saveNutritionGoals(
        calorieGoal: Int,
        proteinGoal: Int,
        carbsGoal: Int,
        fatGoal: Int
    ) async throws {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }

        struct UpdateData: Encodable {
            let calories_target: Int
            let protein_target: Int
            let carbs_target: Int
            let fat_target: Int
        }

        let data = UpdateData(
            calories_target: calorieGoal,
            protein_target: proteinGoal,
            carbs_target: carbsGoal,
            fat_target: fatGoal
        )

        _ = try await client.from("user_nutrition_settings")
            .update(data)
            .eq("user_id", value: userId.uuidString)
            .execute()
    }

    func fetchTodayNutrition() async throws -> DailyNutrition? {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let today = df.string(from: Date())

        let rows: [DailyNutrition] = try await client.from("daily_nutrition")
            .select("calories_consumed, protein_consumed, carbs_consumed, fat_consumed, meal_count")
            .eq("user_id", value: session.user.id.uuidString)
            .eq("date", value: today)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    func fetchTodayMeals() async throws -> [MealEntry] {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? Date()

        struct MealRow: Decodable {
            let id: String
            let name: String
            let meal_type: String
            let logged_at: String
            let meal_items: [ItemRow]
            struct ItemRow: Decodable {
                let calories: Int
                let protein: Double
                let carbs: Double
                let fat: Double
            }
        }

        let rows: [MealRow] = try await client.from("meals")
            .select("id, name, meal_type, logged_at, meal_items(calories, protein, carbs, fat)")
            .eq("user_id", value: session.user.id.uuidString)
            .gte("logged_at", value: ISO8601DateFormatter().string(from: startOfDay))
            .lt("logged_at", value: ISO8601DateFormatter().string(from: endOfDay))
            .order("logged_at", ascending: false)
            .execute()
            .value

        return rows.map { row in
            let calories = row.meal_items.reduce(0) { $0 + $1.calories }
            let protein = row.meal_items.reduce(0.0) { $0 + $1.protein }
            let carbs = row.meal_items.reduce(0.0) { $0 + $1.carbs }
            let fat = row.meal_items.reduce(0.0) { $0 + $1.fat }
            return MealEntry(id: row.id, name: row.name, meal_type: row.meal_type,
                           calories: calories, protein: protein, carbs: carbs, fat: fat, logged_at: row.logged_at)
        }
    }

    func deleteMeal(mealId: String) async throws {
        try await client.from("meals").delete().eq("id", value: mealId).execute()
    }
    
    func updateMealItem(itemId: String, calories: Int, protein: Double, carbs: Double, fat: Double) async throws {
        try await client.from("meal_items")
            .update(["calories": Double(calories), "protein": protein, "carbs": carbs, "fat": fat])
            .eq("id", value: itemId)
            .execute()
    }

    func getFoodDiaryEntries(date: String) async throws -> [FoodDiaryEntry] {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        
        struct MealItemRow: Decodable {
            let id: String
            let calories: Int
            let protein: Double
            let carbs: Double
            let fat: Double
        }
        
        struct MealRow: Decodable {
            let id: String
            let name: String
            let meal_type: String
            let logged_at: String
            let meal_items: [MealItemRow]
        }
        
        let startOfDay = date + "T00:00:00Z"
        let endOfDay = date + "T23:59:59Z"
        
        let rows: [MealRow] = try await client.from("meals")
            .select("id, name, meal_type, logged_at, meal_items(id, calories, protein, carbs, fat)")
            .eq("user_id", value: session.user.id.uuidString)
            .gte("logged_at", value: startOfDay)
            .lte("logged_at", value: endOfDay)
            .order("logged_at", ascending: true)
            .execute()
            .value
        
        var entries: [FoodDiaryEntry] = []
        for row in rows {
            for item in row.meal_items {
                entries.append(FoodDiaryEntry(
                    id: item.id,
                    name: row.name,
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fat: item.fat,
                    mealType: row.meal_type,
                    loggedAt: ISO8601DateFormatter().date(from: row.logged_at) ?? Date()
                ))
            }
        }
        
        return entries
    }

    // MARK: - Habits

    func fetchHabits(userId: String) async throws -> ([Habit], [HabitCompletion]) {
        let since: String = {
            let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
            return df.string(from: Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date())
        }()

        struct HabitRow: Decodable {
            let id: String
            let name: String
            let emoji: String
            let target_days: [String]
            let sort_order: Int
            let created_at: String
        }
        struct CompletionRow: Decodable {
            let habit_id: String
            let date: String
        }

        async let habitRows: [HabitRow] = client.from("habits")
            .select("id, name, emoji, target_days, sort_order, created_at")
            .eq("user_id", value: userId)
            .is("archived_at", value: nil)
            .order("sort_order", ascending: true)
            .execute()
            .value

        async let compRows: [CompletionRow] = client.from("habit_completions")
            .select("habit_id, date")
            .eq("user_id", value: userId)
            .gte("date", value: since)
            .execute()
            .value

        let (hr, cr) = try await (habitRows, compRows)
        let habits = hr.map { Habit(id: $0.id, name: $0.name, emoji: $0.emoji, target_days: $0.target_days, sort_order: $0.sort_order, created_at: $0.created_at) }
        let completions = cr.map { HabitCompletion(habit_id: $0.habit_id, date: $0.date) }
        return (habits, completions)
    }

    func toggleHabit(habitId: String, date: String, completed: Bool) async throws {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        if completed {
            struct Payload: Encodable { let habit_id: String; let user_id: String; let date: String }
            try await client.from("habit_completions")
                .upsert(Payload(habit_id: habitId, user_id: session.user.id.uuidString, date: date), onConflict: "habit_id,date")
                .execute()
        } else {
            try await client.from("habit_completions")
                .delete()
                .eq("habit_id", value: habitId)
                .eq("date", value: date)
                .execute()
        }
    }

    func createHabit(name: String, emoji: String) async throws {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        struct Payload: Encodable {
            let user_id: String; let name: String; let emoji: String
            let target_days: [String]
        }
        let allDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        try await client.from("habits")
            .insert(Payload(user_id: session.user.id.uuidString, name: name, emoji: emoji, target_days: allDays))
            .execute()
    }

    func archiveHabit(habitId: String) async throws {
        struct Patch: Encodable { let archived_at: String }
        let df = ISO8601DateFormatter()
        try await client.from("habits")
            .update(Patch(archived_at: df.string(from: Date())))
            .eq("id", value: habitId)
            .execute()
    }

    func reorderHabits(_ orderedIds: [String]) async throws {
        struct Patch: Encodable { let sort_order: Int }
        for (idx, habitId) in orderedIds.enumerated() {
            try await client.from("habits")
                .update(Patch(sort_order: idx))
                .eq("id", value: habitId)
                .execute()
        }
    }

    func fetchRecentCheckins(days: Int = 14) async throws -> [DailyCheckin] {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let since = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"

        struct Row: Decodable {
            let id: String
            let date: String
            let energy: Int?
            let mood: Int?
            let stress: Int?
            let notes: String?
        }

        let rows: [Row] = try await client.from("daily_checkins")
            .select("id, date, energy, mood, stress, notes")
            .eq("user_id", value: session.user.id.uuidString)
            .gte("date", value: df.string(from: since))
            .order("date", ascending: false)
            .execute()
            .value

        return rows.map { DailyCheckin(id: $0.id, date: $0.date, energy: $0.energy, mood: $0.mood, stress: $0.stress, notes: $0.notes) }
    }

    func fetchTodayCheckin() async throws -> DailyCheckin? {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let today = df.string(from: Date())

        struct Row: Decodable {
            let id: String
            let date: String
            let energy: Int?
            let mood: Int?
            let stress: Int?
            let notes: String?
        }

        let rows: [Row] = try await client.from("daily_checkins")
            .select("id, date, energy, mood, stress, notes")
            .eq("user_id", value: session.user.id.uuidString)
            .eq("date", value: today)
            .limit(1)
            .execute()
            .value

        guard let row = rows.first else { return nil }
        return DailyCheckin(id: row.id, date: row.date, energy: row.energy, mood: row.mood, stress: row.stress, notes: row.notes)
    }

    // MARK: - Wellness Insights

    struct WellnessInsightItem {
        let date: String
        let energy: Int?
        let mood: Int?
        let stress: Int?
        let avgHrv: Double?
        let restingHeartRate: Double?
        let sleepDurationMinutes: Int?
        let steps: Int?
    }

    func fetchWellnessInsightsData(days: Int = 90) async throws -> [WellnessInsightItem] {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let userId = session.user.id.uuidString
        let since: String = {
            let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
            return df.string(from: Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date())
        }()

        struct CheckinRow: Decodable {
            let date: String
            let energy: Int?
            let mood: Int?
            let stress: Int?
        }
        struct SummaryRow: Decodable {
            let date: String
            let avg_hrv: Double?
            let resting_heart_rate: Double?
            let sleep_duration_minutes: Int?
            let steps: Int?
        }

        async let checkinRows: [CheckinRow] = client.from("daily_checkins")
            .select("date, energy, mood, stress")
            .eq("user_id", value: userId)
            .gte("date", value: since)
            .order("date", ascending: false)
            .execute()
            .value

        async let summaryRows: [SummaryRow] = client.from("daily_summaries")
            .select("date, avg_hrv, resting_heart_rate, sleep_duration_minutes, steps")
            .eq("user_id", value: userId)
            .gte("date", value: since)
            .order("date", ascending: false)
            .execute()
            .value

        let (checkins, summaries) = try await (checkinRows, summaryRows)

        let summaryMap = Dictionary(uniqueKeysWithValues: summaries.map { ($0.date, $0) })

        return checkins.compactMap { c in
            guard c.energy != nil || c.mood != nil || c.stress != nil else { return nil }
            let s = summaryMap[c.date]
            return WellnessInsightItem(
                date: c.date,
                energy: c.energy,
                mood: c.mood,
                stress: c.stress,
                avgHrv: s?.avg_hrv,
                restingHeartRate: s?.resting_heart_rate,
                sleepDurationMinutes: s?.sleep_duration_minutes,
                steps: s?.steps
            )
        }
    }

    // MARK: - Correlation Analysis

    struct DailySummaryRow: Decodable {
        let date: String
        let steps: Int
        let sleep_duration_minutes: Int?
        let avg_hrv: Double?
        let recovery_score: Int?
        let active_calories: Double?
        let strain_score: Int?
        let distance_meters: Double?
        let resting_heart_rate: Double?

        var sleepHours: Double? {
            guard let mins = sleep_duration_minutes, mins > 0 else { return nil }
            return Double(mins) / 60.0
        }
        var avgHrv: Double? { avg_hrv }
        var recoveryScore: Int? { recovery_score }
        var restingHeartRate: Double? { resting_heart_rate }
    }

    private static let summarySelectFields = "date, steps, sleep_duration_minutes, avg_hrv, recovery_score, active_calories, strain_score, distance_meters, resting_heart_rate"

    func fetchDailySummariesForCorrelation(days: Int = 60) async throws -> [DailySummaryRow] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        let since = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        return try await client.from("daily_summaries")
            .select(Self.summarySelectFields)
            .gte("date", value: df.string(from: since))
            .order("date", ascending: true)
            .execute()
            .value
    }

    func fetchAllDailySummaries(days: Int = 365) async throws -> [DailySummaryRow] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        let since = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        return try await client.from("daily_summaries")
            .select(Self.summarySelectFields)
            .gte("date", value: df.string(from: since))
            .order("date", ascending: false)
            .execute()
            .value
    }

    // MARK: - AI Insights

    func deleteAllUserData() async throws {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let userId = session.user.id.uuidString

        try await client.from("health_insights").delete().eq("user_id", value: userId).execute()
        try await client.from("sleep_records").delete().eq("user_id", value: userId).execute()
        try await client.from("workout_records").delete().eq("user_id", value: userId).execute()
        try await client.from("health_records").delete().eq("user_id", value: userId).execute()
        try await client.from("daily_summaries").delete().eq("user_id", value: userId).execute()
    }

    func exportAllUserData(selection: ExportSelection) async throws -> Data {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        async let summariesTask = fetchDailySummaries(days: 365)
        async let workoutsTask = fetchWorkoutRecords(days: 365)
        async let sleepTask = fetchSleepRecords(days: 365)
        async let mealsTask = fetchMealsForExport()

        let summaries: [DailySummary]?
        if selection.healthRecords || selection.bodyMeasurements {
            do { summaries = try await summariesTask } catch { NSLog("[KQuarks] exportAllUserData summaries failed: %@", error.localizedDescription); summaries = nil }
        } else { summaries = nil }

        let workoutList: [WorkoutRecord]?
        if selection.workouts {
            do { workoutList = try await workoutsTask } catch { NSLog("[KQuarks] exportAllUserData workouts failed: %@", error.localizedDescription); workoutList = nil }
        } else { workoutList = nil }

        let sleepList: [SleepRecord]?
        if selection.sleep {
            do { sleepList = try await sleepTask } catch { NSLog("[KQuarks] exportAllUserData sleep failed: %@", error.localizedDescription); sleepList = nil }
        } else { sleepList = nil }

        let mealList: [ExportMealEntry]?
        if selection.foodDiary {
            do { mealList = try await mealsTask } catch { NSLog("[KQuarks] exportAllUserData meals failed: %@", error.localizedDescription); mealList = nil }
        } else { mealList = nil }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        let export = UserDataExport(
            exportDate: df.string(from: Date()),
            appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0",
            dailySummaries: summaries,
            workouts: workoutList,
            sleepRecords: sleepList,
            meals: mealList
        )

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try encoder.encode(export)
    }

    private func fetchMealsForExport() async throws -> [ExportMealEntry] {
        guard let session = currentSession else { throw SupabaseError.notAuthenticated }
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -365, to: Date()) ?? Date()

        struct MealRow: Decodable {
            let id: String
            let name: String
            let meal_type: String
            let logged_at: String
            let meal_items: [ItemRow]
            struct ItemRow: Decodable {
                let calories: Int
                let protein: Double
                let carbs: Double
                let fat: Double
            }
        }

        let rows: [MealRow] = try await client
            .from("meals")
            .select("id, name, meal_type, logged_at, meal_items(calories, protein, carbs, fat)")
            .eq("user_id", value: session.user.id.uuidString)
            .gte("logged_at", value: ISO8601DateFormatter().string(from: startDate))
            .order("logged_at", ascending: false)
            .execute()
            .value

        return rows.map { row in
            let cal = row.meal_items.reduce(0) { $0 + $1.calories }
            let pro = row.meal_items.reduce(0.0) { $0 + $1.protein }
            let carb = row.meal_items.reduce(0.0) { $0 + $1.carbs }
            let fat = row.meal_items.reduce(0.0) { $0 + $1.fat }
            return ExportMealEntry(id: row.id, name: row.name, mealType: row.meal_type,
                                   calories: cal, protein: pro, carbs: carb, fat: fat,
                                   loggedAt: row.logged_at)
        }
    }

    func fetchInsights() async throws -> [HealthInsight] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        let response: [HealthInsight] = try await client
            .from("health_insights")
            .select()
            .order("created_at", ascending: false)
            .limit(20)
            .execute()
            .value

        return response
    }

    // MARK: - Predictions

    struct PredictionRow: Decodable, Identifiable {
        let id: UUID
        let userId: UUID
        let weekOf: String
        let recoveryForecast: String
        let performanceWindow: String
        let cautionFlags: String
        let createdAt: Date

        enum CodingKeys: String, CodingKey {
            case id
            case userId = "user_id"
            case weekOf = "week_of"
            case recoveryForecast = "recovery_forecast"
            case performanceWindow = "performance_window"
            case cautionFlags = "caution_flags"
            case createdAt = "created_at"
        }
    }

    /// Fetches stored prediction rows ordered by week, most recent first.
    func fetchPredictions(limit: Int = 4) async throws -> [PredictionRow] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        return try await client
            .from("predictions")
            .select()
            .order("week_of", ascending: false)
            .limit(limit)
            .execute()
            .value
    }

    // MARK: - Achievements

    struct Achievement: Decodable, Identifiable {
        let id: String
        let achievement_type: String
        let title: String
        let description: String
        let icon: String
        let granted_at: String
    }

    func fetchAchievements() async throws -> [Achievement] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        return try await client
            .from("user_achievements")
            .select()
            .order("granted_at", ascending: false)
            .execute()
            .value
    }

    func checkAchievements() async {
        guard let session = currentSession else { return }
        let userId = session.user.id.uuidString
        let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        guard let url = URL(string: "\(supabaseURL)/functions/v1/check-achievements") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: ["userId": userId])
        } catch {
            print("[SupabaseService] Failed to serialize achievements request body: \(error)")
            return
        }

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let jsonObject = try JSONSerialization.jsonObject(with: data)
            guard let json = jsonObject as? [String: Any],
                  let newlyGranted = json["newly_granted"] as? [String],
                  !newlyGranted.isEmpty else { return }

            // Fetch titles for newly granted achievements to show in notifications
            do {
                let achievements = try await fetchAchievements()
                let newAchievements = achievements.filter { newlyGranted.contains($0.achievement_type) }
                for achievement in newAchievements {
                    NotificationService.shared.scheduleAchievementUnlocked(
                        icon: achievement.icon,
                        title: achievement.title,
                        description: achievement.description
                    )
                }
            } catch {
                print("[SupabaseService] Failed to fetch achievements for notifications: \(error)")
            }
        } catch {
            print("[SupabaseService] checkAchievements network error: \(error)")
        }
    }

    /// Call the generate-insights edge function
    func invokeGenerateInsights(
        healthContext: AIInsightsService.HealthContext,
        userApiKey: String?
    ) async throws -> AIInsightsService.AIAnalysisResult {
        guard let session = currentSession else {
            throw SupabaseError.notAuthenticated
        }

        struct RequestBody: Encodable {
            let healthContext: AIInsightsService.HealthContext
            let userApiKey: String?
        }

        let body = RequestBody(healthContext: healthContext, userApiKey: userApiKey)
        let bodyData = try JSONEncoder().encode(body)

        let url = URL(string: Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as! String)!
            .appendingPathComponent("functions/v1/generate-insights")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue(
            Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? "",
            forHTTPHeaderField: "apikey"
        )
        request.httpBody = bodyData

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.networkError
        }

        guard httpResponse.statusCode == 200 else {
            do {
                let errorBody = try JSONDecoder().decode([String: String].self, from: data)
                if let errorMessage = errorBody["error"] {
                    throw SupabaseError.unknown(NSError(domain: "AI", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage]))
                }
            } catch let decodeError as SupabaseError {
                throw decodeError
            } catch {
                // Error body could not be decoded; fall through to generic error
            }
            throw SupabaseError.networkError
        }

        let result = try JSONDecoder().decode(AIInsightsService.AIAnalysisResult.self, from: data)
        return result
    }

    // MARK: - App Intents helpers

    /// Log a quick manual workout (used by App Intents / Siri shortcuts).
    func logWorkout(activityType: String, durationMinutes: Int, distanceKm: Double?) async throws {
        guard let userId = currentSession?.user.id else { throw SupabaseError.notAuthenticated }
        let now = Date()
        let start = now.addingTimeInterval(-Double(durationMinutes) * 60)
        let record = WorkoutRecordUpload(
            userId: userId,
            workoutType: activityType,
            startTime: start,
            endTime: now,
            durationMinutes: durationMinutes,
            activeCalories: nil,
            totalCalories: nil,
            distanceMeters: distanceKm.map { $0 * 1000 },
            avgHeartRate: nil,
            maxHeartRate: nil,
            elevationGainMeters: nil,
            avgPacePerKm: nil,
            source: "AppIntent"
        )
        try await uploadWorkoutRecord(record)
    }

    /// Request a full health data export to be sent via email (stub — queues server-side job).
    func requestHealthExport() async throws {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }
        // Export is processed server-side via Supabase Edge Function
        _ = try await client.functions.invoke("request-data-export", options: .init())
    }
}

// MARK: - Data Export

struct ExportSelection {
    let healthRecords: Bool
    let workouts: Bool
    let sleep: Bool
    let foodDiary: Bool
    let bodyMeasurements: Bool
}

struct UserDataExport: Codable {
    let exportDate: String
    let appVersion: String
    let dailySummaries: [DailySummary]?
    let workouts: [WorkoutRecord]?
    let sleepRecords: [SleepRecord]?
    let meals: [ExportMealEntry]?

    enum CodingKeys: String, CodingKey {
        case exportDate = "export_date"
        case appVersion = "app_version"
        case dailySummaries = "daily_summaries"
        case workouts
        case sleepRecords = "sleep_records"
        case meals
    }
}

struct ExportMealEntry: Codable {
    let id: String
    let name: String
    let mealType: String
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let loggedAt: String

    enum CodingKeys: String, CodingKey {
        case id, name, calories, protein, carbs, fat
        case mealType = "meal_type"
        case loggedAt = "logged_at"
    }
}

// MARK: - Upload Models

struct HealthRecordUpload: Codable {
    let userId: UUID
    let type: String
    let value: Double
    let unit: String
    let source: String?
    let startTime: Date
    let endTime: Date?
    var metadata: [String: String]? = nil

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case type
        case value
        case unit
        case source
        case startTime = "start_time"
        case endTime = "end_time"
        case metadata
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(userId, forKey: .userId)
        try container.encode(type, forKey: .type)
        try container.encode(value, forKey: .value)
        try container.encode(unit, forKey: .unit)
        try container.encodeIfPresent(source, forKey: .source)
        try container.encode(startTime, forKey: .startTime)
        try container.encodeIfPresent(endTime, forKey: .endTime)
        if let metadata = metadata, !metadata.isEmpty {
            try container.encode(metadata, forKey: .metadata)
        }
    }
}

struct DailySummaryUpload: Codable {
    let userId: UUID
    let date: Date
    let steps: Int
    let distanceMeters: Double
    let floorsClimbed: Int
    let activeCalories: Double
    let totalCalories: Double
    let activeMinutes: Int
    let sleepDurationMinutes: Int?
    let sleepQualityScore: Int?
    let restingHeartRate: Int?
    let avgHrv: Double?
    let recoveryScore: Int?
    let strainScore: Int?
    let weightKg: Double?
    let bodyFatPercent: Double?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case date
        case steps
        case distanceMeters = "distance_meters"
        case floorsClimbed = "floors_climbed"
        case activeCalories = "active_calories"
        case totalCalories = "total_calories"
        case activeMinutes = "active_minutes"
        case sleepDurationMinutes = "sleep_duration_minutes"
        case sleepQualityScore = "sleep_quality_score"
        case restingHeartRate = "resting_heart_rate"
        case avgHrv = "avg_hrv"
        case recoveryScore = "recovery_score"
        case strainScore = "strain_score"
        case weightKg = "weight_kg"
        case bodyFatPercent = "body_fat_percent"
    }
}

struct SleepRecordUpload: Codable {
    let userId: UUID
    let startTime: Date
    let endTime: Date
    let durationMinutes: Int
    let awakeMinutes: Int
    let remMinutes: Int
    let coreMinutes: Int
    let deepMinutes: Int
    let source: String?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case startTime = "start_time"
        case endTime = "end_time"
        case durationMinutes = "duration_minutes"
        case awakeMinutes = "awake_minutes"
        case remMinutes = "rem_minutes"
        case coreMinutes = "core_minutes"
        case deepMinutes = "deep_minutes"
        case source
    }
}

struct WorkoutRecordUpload: Codable {
    let userId: UUID
    let workoutType: String
    let startTime: Date
    let endTime: Date
    let durationMinutes: Int
    let activeCalories: Double?
    let totalCalories: Double?
    let distanceMeters: Double?
    let avgHeartRate: Int?
    let maxHeartRate: Int?
    let elevationGainMeters: Double?
    let avgPacePerKm: Double?
    let source: String?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case workoutType = "workout_type"
        case startTime = "start_time"
        case endTime = "end_time"
        case durationMinutes = "duration_minutes"
        case activeCalories = "active_calories"
        case totalCalories = "total_calories"
        case distanceMeters = "distance_meters"
        case avgHeartRate = "avg_heart_rate"
        case maxHeartRate = "max_heart_rate"
        case elevationGainMeters = "elevation_gain_meters"
        case avgPacePerKm = "avg_pace_per_km"
        case source
    }
}

// MARK: - ECG Upload Model

@available(iOS 14.0, *)
struct ECGRecordUpload: Encodable {
    let userId: UUID
    let recordedAt: Date
    let classification: String
    let averageHrBpm: Int?
    let samplingFrequencyHz: Double?
    let symptomsStatus: String?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case recordedAt = "recorded_at"
        case classification
        case averageHrBpm = "average_hr_bpm"
        case samplingFrequencyHz = "sampling_frequency_hz"
        case symptomsStatus = "symptoms_status"
    }
}

// MARK: - Health Insight Model

struct HealthInsight: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let category: String
    let title: String
    let content: String
    let priority: String
    let isRead: Bool
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case category
        case title
        case content
        case priority
        case isRead = "is_read"
        case createdAt = "created_at"
    }
}

// MARK: - Errors

enum SupabaseError: Error, LocalizedError {
    case invalidCredential
    case notAuthenticated
    case networkError
    case userNotFound
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .invalidCredential:
            return "Invalid sign-in credential"
        case .notAuthenticated:
            return "Not authenticated"
        case .networkError:
            return "Network error occurred"
        case .userNotFound:
            return "User profile not found"
        case .unknown(let error):
            return error.localizedDescription
        }
    }
}

// Re-exported so callers importing only SupabaseService can catch appLocked
typealias BiometricLockError = BiometricError
