import Foundation

struct User: Codable, Identifiable {
    let id: UUID
    var email: String?
    var displayName: String?
    var avatarUrl: String?
    var timezone: String
    var createdAt: Date
    var updatedAt: Date
    var stepGoal: Int?
    var calorieGoal: Int?
    var sleepGoalMinutes: Int?
    var heightCm: Double?
    var weightKg: Double?
    var maxHeartRate: Int?
    var restingHr: Int?
    var fitnessLevel: String?

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case displayName = "display_name"
        case avatarUrl = "avatar_url"
        case timezone
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case stepGoal = "step_goal"
        case calorieGoal = "calorie_goal"
        case sleepGoalMinutes = "sleep_goal_minutes"
        case heightCm = "height_cm"
        case weightKg = "weight_kg"
        case maxHeartRate = "max_heart_rate"
        case restingHr = "resting_hr"
        case fitnessLevel = "fitness_level"
    }
}
