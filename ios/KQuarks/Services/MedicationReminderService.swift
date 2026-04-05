import UserNotifications
import Foundation
import os

struct MedicationReminderService {
    static func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            return try await center.requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            return false
        }
    }

    static func scheduleMedicationReminder(
        medicationName: String,
        timeOfDay: String,  // "morning", "afternoon", "evening", "bedtime"
        identifier: String
    ) {
        let center = UNUserNotificationCenter.current()

        let content = UNMutableNotificationContent()
        content.title = "Medication Reminder"
        content.body = "Time to take your \(medicationName)"
        content.sound = .default
        content.interruptionLevel = .timeSensitive

        var components = DateComponents()
        switch timeOfDay {
        case "morning":   components.hour = 8;  components.minute = 0
        case "afternoon": components.hour = 13; components.minute = 0
        case "evening":   components.hour = 18; components.minute = 0
        case "bedtime":   components.hour = 21; components.minute = 0
        default:          components.hour = 9;  components.minute = 0
        }

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: "med-\(identifier)-\(timeOfDay)", content: content, trigger: trigger)

        center.add(request) { error in
            if let error { Logger.general.debug("Failed to schedule medication reminder: \(error)") }
        }
    }

    static func cancelMedicationReminder(identifier: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["med-\(identifier)-morning", "med-\(identifier)-afternoon", "med-\(identifier)-evening", "med-\(identifier)-bedtime"]
        )
    }

    static func cancelAllMedicationReminders() {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let medIds = requests.filter { $0.identifier.hasPrefix("med-") }.map { $0.identifier }
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: medIds)
        }
    }
}
