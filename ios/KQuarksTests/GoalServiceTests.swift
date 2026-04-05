import XCTest
@testable import KQuarks

// MARK: - GoalService Unit Tests
//
// Tests default goal values, goal(for:) routing, apply(from:) updates,
// and reset behaviour. Uses GoalService.shared since init is private.
// Cleans up the app-group UserDefaults in tearDown.

final class GoalServiceTests: XCTestCase {

    private let suiteName = "group.com.qxlsz.kquarks"
    var sut: GoalService!

    override func setUp() {
        super.setUp()
        sut = GoalService.shared
        // Reset to known defaults before each test
        sut.stepsGoal = 10_000
        sut.activeCaloriesGoal = 500
        sut.sleepGoalMinutes = 480
        sut.hrvTarget = 50
    }

    override func tearDown() {
        // Restore defaults so tests are independent
        sut.stepsGoal = 10_000
        sut.activeCaloriesGoal = 500
        sut.sleepGoalMinutes = 480
        sut.hrvTarget = 50
        sut = nil
        super.tearDown()
    }

    // MARK: - Default Values

    func testDefaultStepsGoal() {
        XCTAssertEqual(sut.stepsGoal, 10_000, "Default step goal should be 10,000")
    }

    func testDefaultActiveCaloriesGoal() {
        XCTAssertEqual(sut.activeCaloriesGoal, 500, "Default calorie goal should be 500")
    }

    func testDefaultSleepGoalMinutes() {
        XCTAssertEqual(sut.sleepGoalMinutes, 480, "Default sleep goal should be 480 min (8 h)")
    }

    func testDefaultHrvTarget() {
        XCTAssertEqual(sut.hrvTarget, 50, "Default HRV target should be 50")
    }

    // MARK: - goal(for:) Routing

    func testGoalForStepsReturnsStepsGoal() {
        sut.stepsGoal = 12_000
        XCTAssertEqual(sut.goal(for: .steps), 12_000)
    }

    func testGoalForActiveCaloriesReturnsCaloriesGoal() {
        sut.activeCaloriesGoal = 750
        XCTAssertEqual(sut.goal(for: .activeCalories), 750)
    }

    func testGoalForUnsupportedTypeReturnsNil() {
        XCTAssertNil(sut.goal(for: .heartRate), "Heart rate has no goal")
        XCTAssertNil(sut.goal(for: .weight), "Weight has no goal")
        XCTAssertNil(sut.goal(for: .hrv), "HRV has no goal via goal(for:)")
        XCTAssertNil(sut.goal(for: .distance), "Distance has no goal")
    }

    // MARK: - apply(from:) with valid User

    func testApplyFromUserUpdatesStepGoal() {
        let user = makeUser(stepGoal: 15_000)
        sut.apply(from: user)
        XCTAssertEqual(sut.stepsGoal, 15_000)
    }

    func testApplyFromUserUpdatesCalorieGoal() {
        let user = makeUser(calorieGoal: 800)
        sut.apply(from: user)
        XCTAssertEqual(sut.activeCaloriesGoal, 800)
    }

    func testApplyFromUserUpdatesSleepGoal() {
        let user = makeUser(sleepGoalMinutes: 540)
        sut.apply(from: user)
        XCTAssertEqual(sut.sleepGoalMinutes, 540)
    }

    func testApplyFromUserUpdatesAllGoals() {
        let user = makeUser(stepGoal: 20_000, calorieGoal: 600, sleepGoalMinutes: 420)
        sut.apply(from: user)
        XCTAssertEqual(sut.stepsGoal, 20_000)
        XCTAssertEqual(sut.activeCaloriesGoal, 600)
        XCTAssertEqual(sut.sleepGoalMinutes, 420)
    }

    // MARK: - apply(from:) ignores zero and nil values

    func testApplyFromUserIgnoresNilGoals() {
        sut.stepsGoal = 12_000
        sut.activeCaloriesGoal = 700
        sut.sleepGoalMinutes = 500
        let user = makeUser()  // all goals nil
        sut.apply(from: user)
        XCTAssertEqual(sut.stepsGoal, 12_000, "Should keep existing step goal when user.stepGoal is nil")
        XCTAssertEqual(sut.activeCaloriesGoal, 700, "Should keep existing calorie goal when nil")
        XCTAssertEqual(sut.sleepGoalMinutes, 500, "Should keep existing sleep goal when nil")
    }

    func testApplyFromUserIgnoresZeroGoals() {
        sut.stepsGoal = 12_000
        sut.activeCaloriesGoal = 700
        let user = makeUser(stepGoal: 0, calorieGoal: 0, sleepGoalMinutes: 0)
        sut.apply(from: user)
        XCTAssertEqual(sut.stepsGoal, 12_000, "Should keep existing step goal when user.stepGoal is 0")
        XCTAssertEqual(sut.activeCaloriesGoal, 700, "Should keep existing calorie goal when 0")
    }

    // MARK: - reset()

    func testResetRestoresDefaults() {
        sut.stepsGoal = 20_000
        sut.activeCaloriesGoal = 900
        sut.sleepGoalMinutes = 600
        sut.hrvTarget = 80
        sut.reset()
        XCTAssertEqual(sut.stepsGoal, 10_000)
        XCTAssertEqual(sut.activeCaloriesGoal, 500)
        XCTAssertEqual(sut.sleepGoalMinutes, 480)
        XCTAssertEqual(sut.hrvTarget, 50)
    }

    // MARK: - Helpers

    private func makeUser(
        stepGoal: Int? = nil,
        calorieGoal: Int? = nil,
        sleepGoalMinutes: Int? = nil
    ) -> User {
        User(
            id: UUID(),
            email: "test@test.com",
            displayName: "Test",
            avatarUrl: nil,
            timezone: "UTC",
            createdAt: Date(),
            updatedAt: Date(),
            stepGoal: stepGoal,
            calorieGoal: calorieGoal,
            sleepGoalMinutes: sleepGoalMinutes,
            heightCm: nil,
            weightKg: nil,
            maxHeartRate: nil,
            restingHr: nil,
            fitnessLevel: nil
        )
    }
}
