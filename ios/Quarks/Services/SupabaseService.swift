import Foundation
import AuthenticationServices

// Note: Add Supabase Swift SDK via Swift Package Manager
// https://github.com/supabase/supabase-swift

@Observable
class SupabaseService {
    static let shared = SupabaseService()

    // TODO: Replace with your Supabase project credentials
    private let supabaseUrl = "YOUR_SUPABASE_URL"
    private let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"

    var currentUser: User?
    var isAuthenticated: Bool { currentUser != nil }

    private init() {
        // Initialize Supabase client
        // Will be implemented when adding Supabase SDK
    }

    // MARK: - Authentication

    func signInWithApple(credential: ASAuthorizationAppleIDCredential) async throws {
        guard let identityToken = credential.identityToken,
              let tokenString = String(data: identityToken, encoding: .utf8) else {
            throw SupabaseError.invalidCredential
        }

        // TODO: Implement Supabase Apple Sign-In
        // let session = try await supabase.auth.signInWithIdToken(
        //     credentials: .init(provider: .apple, idToken: tokenString)
        // )
        // currentUser = try await fetchCurrentUser()
    }

    func signOut() async throws {
        // TODO: Implement sign out
        // try await supabase.auth.signOut()
        currentUser = nil
    }

    func fetchCurrentUser() async throws -> User? {
        // TODO: Implement fetch user profile
        // let response = try await supabase
        //     .from("users")
        //     .select()
        //     .eq("id", value: session.user.id)
        //     .single()
        //     .execute()
        // return try response.value
        return nil
    }

    // MARK: - Health Data Sync

    func uploadHealthRecords(_ records: [HealthRecordUpload]) async throws {
        guard !records.isEmpty else { return }

        // TODO: Implement batch upload
        // try await supabase
        //     .from("health_records")
        //     .upsert(records, onConflict: "user_id,type,start_time")
        //     .execute()
    }

    func uploadDailySummary(_ summary: DailySummaryUpload) async throws {
        // TODO: Implement daily summary upsert
        // try await supabase
        //     .from("daily_summaries")
        //     .upsert(summary, onConflict: "user_id,date")
        //     .execute()
    }

    func uploadSleepRecord(_ record: SleepRecordUpload) async throws {
        // TODO: Implement sleep record upload
        // try await supabase
        //     .from("sleep_records")
        //     .insert(record)
        //     .execute()
    }

    func uploadWorkoutRecord(_ record: WorkoutRecordUpload) async throws {
        // TODO: Implement workout record upload
        // try await supabase
        //     .from("workout_records")
        //     .insert(record)
        //     .execute()
    }

    // MARK: - Fetch Data

    func fetchDailySummaries(days: Int = 7) async throws -> [DailySummary] {
        // TODO: Implement fetch
        // let calendar = Calendar.current
        // let startDate = calendar.date(byAdding: .day, value: -days, to: Date())!
        //
        // let response = try await supabase
        //     .from("daily_summaries")
        //     .select()
        //     .gte("date", value: startDate.ISO8601Format())
        //     .order("date", ascending: false)
        //     .execute()
        //
        // return try response.value
        return []
    }

    func fetchSleepRecords(days: Int = 7) async throws -> [SleepRecord] {
        // TODO: Implement fetch
        return []
    }

    func fetchWorkoutRecords(days: Int = 30) async throws -> [WorkoutRecord] {
        // TODO: Implement fetch
        return []
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
    let date: String // YYYY-MM-DD
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

// MARK: - Errors

enum SupabaseError: Error, LocalizedError {
    case invalidCredential
    case notAuthenticated
    case networkError
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .invalidCredential:
            return "Invalid sign-in credential"
        case .notAuthenticated:
            return "Not authenticated"
        case .networkError:
            return "Network error occurred"
        case .unknown(let error):
            return error.localizedDescription
        }
    }
}
