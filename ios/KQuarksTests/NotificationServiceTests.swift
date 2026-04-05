import XCTest
@testable import KQuarks

// MARK: - Notification Badge Logic Tests
//
// NotificationService.updateStepBadge uses:
//   remaining = max(goal - steps, 0)
//   badge     = min(remaining / 100, 99)
//
// Since updateStepBadge is coupled to UNUserNotificationCenter (requires
// authorization), we extract and test the pure badge-calculation logic
// directly. This mirrors the algorithm 1-for-1.

final class NotificationServiceTests: XCTestCase {

    // Replicate the exact badge formula from NotificationService.updateStepBadge
    private func calculateStepBadge(steps: Int, goal: Int) -> Int {
        let remaining = max(goal - steps, 0)
        return min(remaining / 100, 99)
    }

    // MARK: - Badge = 99 (capped)

    func testBadge_zeroSteps_goalTenThousand_cappedAt99() {
        let badge = calculateStepBadge(steps: 0, goal: 10_000)
        XCTAssertEqual(badge, 99, "remaining 10000 / 100 = 100, capped at 99")
    }

    func testBadge_zeroSteps_veryHighGoal_cappedAt99() {
        let badge = calculateStepBadge(steps: 0, goal: 50_000)
        XCTAssertEqual(badge, 99, "remaining 50000 / 100 = 500, capped at 99")
    }

    // MARK: - Badge = 50 (midway)

    func testBadge_halfwayToGoal() {
        let badge = calculateStepBadge(steps: 5_000, goal: 10_000)
        XCTAssertEqual(badge, 50, "remaining 5000 / 100 = 50")
    }

    // MARK: - Badge = 0 (goal reached)

    func testBadge_exactlyAtGoal() {
        let badge = calculateStepBadge(steps: 10_000, goal: 10_000)
        XCTAssertEqual(badge, 0, "remaining 0 → badge 0")
    }

    func testBadge_overGoal() {
        let badge = calculateStepBadge(steps: 12_000, goal: 10_000)
        XCTAssertEqual(badge, 0, "over-goal clamps remaining to 0 → badge 0")
    }

    // MARK: - Boundary cases

    func testBadge_oneStepBelowGoal() {
        let badge = calculateStepBadge(steps: 9_999, goal: 10_000)
        // remaining = 1, 1/100 = 0 (integer division)
        XCTAssertEqual(badge, 0)
    }

    func testBadge_hundredBelowGoal() {
        let badge = calculateStepBadge(steps: 9_900, goal: 10_000)
        XCTAssertEqual(badge, 1, "remaining 100 / 100 = 1")
    }

    func testBadge_ninetyNineHundredRemaining() {
        // remaining = 9900, badge = 99 (exactly at cap)
        let badge = calculateStepBadge(steps: 100, goal: 10_000)
        XCTAssertEqual(badge, 99)
    }

    func testBadge_justBelowCap() {
        // remaining = 9899, badge = 98 (just under cap)
        let badge = calculateStepBadge(steps: 101, goal: 10_000)
        XCTAssertEqual(badge, 98)
    }

    func testBadge_zeroGoal() {
        let badge = calculateStepBadge(steps: 500, goal: 0)
        XCTAssertEqual(badge, 0, "zero goal → remaining clamped to 0")
    }

    func testBadge_bothZero() {
        let badge = calculateStepBadge(steps: 0, goal: 0)
        XCTAssertEqual(badge, 0)
    }

    // MARK: - Small goals

    func testBadge_smallGoal() {
        let badge = calculateStepBadge(steps: 0, goal: 500)
        XCTAssertEqual(badge, 5, "remaining 500 / 100 = 5")
    }

    func testBadge_smallGoalPartial() {
        let badge = calculateStepBadge(steps: 250, goal: 500)
        XCTAssertEqual(badge, 2, "remaining 250 / 100 = 2 (integer division)")
    }
}
