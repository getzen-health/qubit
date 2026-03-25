import ActivityKit
import Foundation

struct FastingLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var elapsedSeconds: Int
        var targetSeconds: Int
        var phase: String // "fat burning", "ketosis", "deep ketosis"
    }
    var startTime: Date
    var goal: String // "16:8", "18:6", "24h"
}
