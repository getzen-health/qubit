import ActivityKit
import Foundation

#if !targetEnvironment(macCatalyst)
struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var elapsedSeconds: Int
        var heartRate: Double
        var activeCalories: Double
        var currentPace: String? // e.g. "5:30/km"
    }
    
    var workoutType: String // e.g. "Running"
    var startTime: Date
}
#endif
