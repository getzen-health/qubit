import UserNotifications
import Foundation

class HydrationReminderService {
    static let shared = HydrationReminderService()
    
    func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let granted = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
        return granted ?? false
    }
    
    func scheduleReminders(startHour: Int = 8, endHour: Int = 20, intervalHours: Int = 2) {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        
        var hour = startHour
        while hour <= endHour {
            let content = UNMutableNotificationContent()
            content.title = "💧 Time to hydrate!"
            content.body = "Stay on track with your water goal. Log your intake in KQuarks."
            content.sound = .default
            
            var dateComponents = DateComponents()
            dateComponents.hour = hour
            dateComponents.minute = 0
            
            let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
            let request = UNNotificationRequest(
                identifier: "hydration_\(hour)",
                content: content,
                trigger: trigger
            )
            UNUserNotificationCenter.current().add(request)
            hour += intervalHours
        }
    }
    
    func cancelReminders() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}
