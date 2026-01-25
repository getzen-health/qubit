import Foundation

// MARK: - Health Record

struct HealthRecord: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let type: HealthDataType
    let value: Double
    let unit: String
    let source: String?
    let startTime: Date
    let endTime: Date?
    let metadata: [String: String]?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case type
        case value
        case unit
        case source
        case startTime = "start_time"
        case endTime = "end_time"
        case metadata
        case createdAt = "created_at"
    }
}

enum HealthDataType: String, Codable, CaseIterable {
    case steps
    case distance
    case activeCalories = "active_calories"
    case totalCalories = "total_calories"
    case floorsClimbed = "floors_climbed"
    case heartRate = "heart_rate"
    case restingHeartRate = "resting_heart_rate"
    case hrv
    case weight
    case bodyFat = "body_fat"
    case bloodPressureSystolic = "blood_pressure_systolic"
    case bloodPressureDiastolic = "blood_pressure_diastolic"
    case oxygenSaturation = "oxygen_saturation"
    case respiratoryRate = "respiratory_rate"

    var displayName: String {
        switch self {
        case .steps: return "Steps"
        case .distance: return "Distance"
        case .activeCalories: return "Active Calories"
        case .totalCalories: return "Total Calories"
        case .floorsClimbed: return "Floors Climbed"
        case .heartRate: return "Heart Rate"
        case .restingHeartRate: return "Resting Heart Rate"
        case .hrv: return "Heart Rate Variability"
        case .weight: return "Weight"
        case .bodyFat: return "Body Fat"
        case .bloodPressureSystolic: return "Blood Pressure (Systolic)"
        case .bloodPressureDiastolic: return "Blood Pressure (Diastolic)"
        case .oxygenSaturation: return "Blood Oxygen"
        case .respiratoryRate: return "Respiratory Rate"
        }
    }

    var icon: String {
        switch self {
        case .steps: return "figure.walk"
        case .distance: return "map"
        case .activeCalories, .totalCalories: return "flame"
        case .floorsClimbed: return "stairs"
        case .heartRate, .restingHeartRate: return "heart.fill"
        case .hrv: return "waveform.path.ecg"
        case .weight: return "scalemass"
        case .bodyFat: return "percent"
        case .bloodPressureSystolic, .bloodPressureDiastolic: return "heart.circle"
        case .oxygenSaturation: return "lungs"
        case .respiratoryRate: return "wind"
        }
    }
}

// MARK: - Sleep Record

struct SleepRecord: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let startTime: Date
    let endTime: Date
    let durationMinutes: Int
    var awakeMinutes: Int?
    var remMinutes: Int?
    var coreMinutes: Int?
    var deepMinutes: Int?
    var sleepQualityScore: Int?
    var timeToSleepMinutes: Int?
    var wakeCount: Int?
    let source: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case startTime = "start_time"
        case endTime = "end_time"
        case durationMinutes = "duration_minutes"
        case awakeMinutes = "awake_minutes"
        case remMinutes = "rem_minutes"
        case coreMinutes = "core_minutes"
        case deepMinutes = "deep_minutes"
        case sleepQualityScore = "sleep_quality_score"
        case timeToSleepMinutes = "time_to_sleep_minutes"
        case wakeCount = "wake_count"
        case source
        case createdAt = "created_at"
    }

    var totalSleepMinutes: Int {
        (remMinutes ?? 0) + (coreMinutes ?? 0) + (deepMinutes ?? 0)
    }
}

// MARK: - Workout Record

struct WorkoutRecord: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let workoutType: String
    let startTime: Date
    let endTime: Date
    let durationMinutes: Int
    var activeCalories: Double?
    var totalCalories: Double?
    var distanceMeters: Double?
    var avgHeartRate: Int?
    var maxHeartRate: Int?
    var elevationGainMeters: Double?
    let source: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
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
        case source
        case createdAt = "created_at"
    }
}

// MARK: - Daily Summary

struct DailySummary: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let date: Date
    var steps: Int
    var distanceMeters: Double
    var floorsClimbed: Int
    var activeCalories: Double
    var totalCalories: Double
    var activeMinutes: Int
    var sleepDurationMinutes: Int?
    var sleepQualityScore: Int?
    var restingHeartRate: Int?
    var avgHrv: Double?
    var weightKg: Double?
    var bodyFatPercent: Double?
    var recoveryScore: Int?
    var strainScore: Int?

    enum CodingKeys: String, CodingKey {
        case id
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
        case weightKg = "weight_kg"
        case bodyFatPercent = "body_fat_percent"
        case recoveryScore = "recovery_score"
        case strainScore = "strain_score"
    }
}
