import Foundation
import AuthenticationServices
import Supabase

@Observable
class SupabaseService {
    static let shared = SupabaseService()

    private let client: SupabaseClient

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

        guard let url = URL(string: supabaseUrl), !supabaseAnonKey.isEmpty else {
            fatalError("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY in Info.plist or environment.")
        }

        client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: supabaseAnonKey
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
                try? await updateUserProfile(displayName: displayName)
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

    // MARK: - Auth State Listener

    func observeAuthStateChanges() -> AsyncStream<AuthChangeEvent> {
        AsyncStream { continuation in
            Task {
                for await (event, _) in client.auth.authStateChanges {
                    continuation.yield(event)
                }
            }
        }
    }

    // MARK: - Health Data Sync

    func uploadHealthRecords(_ records: [HealthRecordUpload]) async throws {
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
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        try await client
            .from("daily_summaries")
            .upsert(summary, onConflict: "user_id,date")
            .execute()
    }

    func uploadSleepRecord(_ record: SleepRecordUpload) async throws {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        try await client
            .from("sleep_records")
            .upsert(record, onConflict: "user_id,start_time")
            .execute()
    }

    func uploadWorkoutRecord(_ record: WorkoutRecordUpload) async throws {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        try await client
            .from("workout_records")
            .upsert(record, onConflict: "user_id,start_time")
            .execute()
    }

    // MARK: - Fetch Data

    func fetchDailySummaries(days: Int = 7) async throws -> [DailySummary] {
        guard currentSession != nil else { throw SupabaseError.notAuthenticated }

        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -days, to: Date())!

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
        let startDate = calendar.date(byAdding: .day, value: -days, to: Date())!

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
        let startDate = calendar.date(byAdding: .day, value: -days, to: Date())!

        let response: [WorkoutRecord] = try await client
            .from("workout_records")
            .select()
            .gte("start_time", value: startDate.ISO8601Format())
            .order("start_time", ascending: false)
            .execute()
            .value

        return response
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
            if let errorBody = try? JSONDecoder().decode([String: String].self, from: data),
               let errorMessage = errorBody["error"] {
                throw SupabaseError.unknown(NSError(domain: "AI", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage]))
            }
            throw SupabaseError.networkError
        }

        let result = try JSONDecoder().decode(AIInsightsService.AIAnalysisResult.self, from: data)
        return result
    }
}

// MARK: - Upload Models

struct HealthRecordUpload: Encodable {
    let userId: UUID
    let type: String
    let value: Double
    let unit: String
    let source: String?
    let startTime: Date
    let endTime: Date?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case type
        case value
        case unit
        case source
        case startTime = "start_time"
        case endTime = "end_time"
    }
}

struct DailySummaryUpload: Encodable {
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
    }
}

struct SleepRecordUpload: Encodable {
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

struct WorkoutRecordUpload: Encodable {
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
        case source
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
