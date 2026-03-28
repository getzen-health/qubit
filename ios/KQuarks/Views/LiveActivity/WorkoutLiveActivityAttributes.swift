import ActivityKit
import Foundation

#if !targetEnvironment(macCatalyst)
struct WorkoutLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var heartRate: Int
        var calories: Int
        var durationSeconds: Int
        var distanceMeters: Int // Distance in meters
        var zone: String // "Zone 1" through "Zone 5"
        var zoneColor: String // hex color string
    }
    var workoutType: String
    var startTime: Date
}
#endif
