import XCTest
@testable import KQuarks

final class MedicationReminderServiceTests: XCTestCase {
    func testCancelDoesNotCrash() {
        // Should not throw even with non-existent identifiers
        MedicationReminderService.cancelMedicationReminder(identifier: "test-medication-123")
        MedicationReminderService.cancelAllMedicationReminders()
    }

    func testScheduleDoesNotCrash() {
        // Schedule  won't actually fire in test environment
        MedicationReminderService.scheduleMedicationReminder(
            medicationName: "Test Med",
            timeOfDay: "morning",
            identifier: "test-123"
        )
        // Clean up
        MedicationReminderService.cancelMedicationReminder(identifier: "test-123")
    }
}
