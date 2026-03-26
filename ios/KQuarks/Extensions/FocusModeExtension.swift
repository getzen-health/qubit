import Foundation
import CoreLocation

// Focus mode awareness — check if user is in a Focus mode and adjust notifications
// iOS 15+ Focus mode can be detected via notification authorization
struct FocusModeHelper {
    static func shouldSendHealthAlert() async -> Bool {
        // Health alerts should always break through
        // In production: use UNNotificationRequest with interruptionLevel = .timeSensitive
        return true
    }

    static func getNotificationInterruptionLevel() -> String {
        // Returns the interruption level to use for health notifications
        // .timeSensitive breaks through Focus modes for urgent health alerts
        return "timeSensitive"
    }
}
