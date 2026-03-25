import Foundation

struct WatchHealthSnapshot: Codable {
    let steps: Int
    let hrv: Double?
    let restingHR: Double?
    let sleepHours: Double?
    let activeCalories: Double?
    let moveRingPercent: Double?
    let exerciseRingPercent: Double?
    let standRingPercent: Double?
    let lastUpdated: Date

    enum CodingKeys: String, CodingKey {
        case steps
        case hrv
        case restingHR = "resting_hr"
        case sleepHours = "sleep_hours"
        case activeCalories = "active_calories"
        case moveRingPercent = "move_ring_percent"
        case exerciseRingPercent = "exercise_ring_percent"
        case standRingPercent = "stand_ring_percent"
        case lastUpdated = "last_updated"
    }
}
