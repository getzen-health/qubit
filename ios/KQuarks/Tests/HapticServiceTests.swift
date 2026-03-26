import XCTest
@testable import KQuarks

final class HapticServiceTests: XCTestCase {
    // HapticService is a struct with static methods  test they compile and don't crash
    func testImpactDoesNotCrash() {
        // UIImpactFeedbackGenerator works on device; on simulator it's a no-op
        HapticService.impact(.light)
        HapticService.impact(.medium)
        HapticService.impact(.heavy)
        // No assertions needed  just verify no crash
    }

    func testNotificationDoesNotCrash() {
        HapticService.notification(.success)
        HapticService.notification(.warning)
        HapticService.notification(.error)
    }

    func testSelectionDoesNotCrash() {
        HapticService.selection()
    }
}
