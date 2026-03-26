import Foundation
import SwiftUI

struct WorkoutAPIEntry: Codable {
    let id: String
    let type: String
    let duration_minutes: Int
    let calories: Int?
    let workout_date: String
}

struct WorkoutListResponse: Codable {
    let data: [WorkoutAPIEntry]
}

@Observable
class WorkoutLogViewModel: ObservableObject {
    @Published var workoutType: String = ""
    @Published var durationMinutes: Double = 30
    @Published var calories: String = ""
    @Published var notes: String = ""
    @Published var isLoading: Bool = false
    @Published var message: String = ""
    @Published var recentWorkouts: [WorkoutEntry] = []

    func logWorkout() async {
        isLoading = true
        defer { isLoading = false }
        
        guard let baseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ProcessInfo.processInfo.environment["SUPABASE_URL"],
              let url = URL(string: "\(baseURL)/api/workouts") else {
            message = "Configuration error"
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Add Supabase auth token if available
        if let token = SupabaseService.shared.currentSession?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let body: [String: Any] = [
            "type": workoutType,
            "duration_minutes": Int(durationMinutes),
            "calories": calories.isEmpty ? NSNull() : Int(calories) as Any,
            "notes": notes.isEmpty ? NSNull() : notes as Any
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let httpResponse = response as? HTTPURLResponse
            if httpResponse?.statusCode == 201 {
                message = "Workout logged! 💪"
                durationMinutes = 30
                calories = ""
                notes = ""
                await loadRecentWorkouts()
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [self] in
                    message = ""
                }
            } else {
                let errorData = try? JSONDecoder().decode([String: String].self, from: data)
                message = "Error: \(errorData?["error"] ?? "Unknown error")"
            }
        } catch {
            message = "Network error: \(error.localizedDescription)"
        }
    }

    func loadRecentWorkouts() async {
        guard let baseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ProcessInfo.processInfo.environment["SUPABASE_URL"],
              let url = URL(string: "\(baseURL)/api/workouts") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            if let json = try? JSONDecoder().decode(WorkoutListResponse.self, from: data) {
                await MainActor.run {
                    recentWorkouts = json.data.map { w in
                        WorkoutEntry(
                            id: UUID(uuidString: w.id) ?? UUID(),
                            type: w.type,
                            durationMinutes: w.duration_minutes,
                            calories: w.calories,
                            date: ISO8601DateFormatter().date(from: w.workout_date) ?? Date()
                        )
                    }
                }
            }
        } catch { }
    }
}
