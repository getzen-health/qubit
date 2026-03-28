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

struct WorkoutEntry: Identifiable {
    let id: UUID
    let type: String
    let durationMinutes: Int
    let calories: Int?
    let date: Date
}
