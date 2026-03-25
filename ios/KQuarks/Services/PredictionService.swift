import Foundation

/// Manages fetching and generating weekly AI-powered health predictions.
///
/// Predictions are stored in the Supabase `predictions` table, keyed by
/// (user_id, week_of). `loadPrediction()` queries the current week's row;
/// `generatePrediction()` calls the Edge Function which runs the full
/// 90-day analysis via Claude and then persists the result.
@Observable
class PredictionService {
    static let shared = PredictionService()

    var currentPrediction: PredictionRecord?
    var isLoading = true
    var error: String?

    private init() {}

    // MARK: - PredictionRecord

    struct PredictionRecord: Decodable, Identifiable {
        let id: UUID
        let userId: UUID
        let weekOf: Date
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

    // MARK: - Current week Monday

    /// Returns the ISO-8601 date string (yyyy-MM-dd) for Monday of the current week.
    private func currentWeekMonday() -> String {
        let calendar = Calendar(identifier: .iso8601)
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
        let monday = calendar.date(from: components) ?? Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter.string(from: monday)
    }

    // MARK: - Load prediction from Supabase

    /// Fetches the latest prediction row for the current week from the `predictions` table.
    /// Sets `currentPrediction` if a row exists; clears it otherwise.
    func loadPrediction() async {
        isLoading = true
        error = nil

        guard let session = SupabaseService.shared.currentSession else {
            error = "Not signed in"
            isLoading = false
            return
        }

        let userId = session.user.id.uuidString
        let weekOf = currentWeekMonday()

        do {
            let records: [PredictionRecord] = try await SupabaseService.shared.client
                .from("predictions")
                .select()
                .eq("user_id", value: userId)
                .eq("week_of", value: weekOf)
                .order("created_at", ascending: false)
                .limit(1)
                .execute()
                .value

            currentPrediction = records.first
        } catch {
            self.error = error.localizedDescription
            currentPrediction = nil
        }

        isLoading = false
    }

    // MARK: - Generate prediction via Edge Function

    /// Calls the `predictions` Edge Function to run the full 90-day Claude analysis,
    /// then reloads the stored result from the database.
    func generatePrediction() async {
        isLoading = true
        error = nil

        guard let session = SupabaseService.shared.currentSession else {
            error = "Not signed in"
            isLoading = false
            return
        }

        let supabaseUrl = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String
            ?? ProcessInfo.processInfo.environment["SUPABASE_URL"]
            ?? ""
        let supabaseAnonKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String
            ?? ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
            ?? ""

        guard !supabaseUrl.isEmpty,
              let url = URL(string: "\(supabaseUrl)/functions/v1/predictions") else {
            error = "Invalid Supabase URL configuration"
            isLoading = false
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: String] = ["user_id": session.user.id.uuidString]
        do {
            request.httpBody = try JSONEncoder().encode(payload)
        } catch {
            self.error = "Failed to encode request: \(error.localizedDescription)"
            isLoading = false
            return
        }

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                error = "Unexpected response from server"
                isLoading = false
                return
            }

            guard httpResponse.statusCode == 200 else {
                let body = String(data: data, encoding: .utf8) ?? "(unreadable)"
                error = "Prediction failed (HTTP \(httpResponse.statusCode)): \(body)"
                isLoading = false
                return
            }
        } catch {
            self.error = "Network request failed: \(error.localizedDescription)"
            isLoading = false
            return
        }

        // Reload the freshly stored prediction from the database
        await loadPrediction()
    }
}
