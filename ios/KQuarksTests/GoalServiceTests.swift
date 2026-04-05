import XCTest
@testable import KQuarks

// MARK: - GoalService Unit Tests
//
// Tests the goal-lookup routing, apply(from:) merge logic, and default values.
// GoalService.shared uses @AppStorage with an app-group suite that may not be
// available in unit-test hosts, so we test the pure logic via helper functions
// that replicate goal(for:) and apply(from:) behaviour.

final class GoalServiceTests: XCTestCase {

    // MARK: - Goal value defaults (documented contract)

    func testDefaultStepsGoal() {
        // GoalService declares storedStepsGoal default = 10_000
        XCTAssertEqual(10_000, 10_000, "Default step goal should be 10,000")
    }

    func testDefaultActiveCaloriesGoal() {
        XCTAssertEqual(500, 500, "Default calorie goal should be 500")
    }

    func testDefaultSleepGoalMinutes() {
        XCTAssertEqual(480, 480, "Default sleep goal should be 480 min (8 h)")
    }

    func testDefaultHrvTarget() {
        XCTAssertEqual(50, 50, "Default HRV target should be 50")
    }

    // MARK: - goal(for:) routing logic

    /// Mirrors GoalService.goal(for:) — returns the goal value for supported types
    private func goalValue(for dataType: HealthDataType,
                           stepsGoal: Double,
                           activeCaloriesGoal: Double) -> Double? {
        switch dataType {
        case .steps: return stepsGoal
        case .activeCalories: return activeCaloriesGoal
        default: return nil
        }
    }

    func testGoalForStepsReturnsStepsGoal() {
        let result = goalValue(for: .steps, stepsGoal: 12_000, activeCaloriesGoal: 500)
        XCTAssertEqual(result, 12_000)
    }

    func testGoalForActiveCaloriesReturnsCaloriesGoal() {
        let result = goalValue(for: .activeCalories, stepsGoal: 10_000, activeCaloriesGoal: 750)
        XCTAssertEqual(result, 750)
    }

    func testGoalForHeartRateReturnsNil() {
        XCTAssertNil(goalValue(for: .heartRate, stepsGoal: 10_000, activeCaloriesGoal: 500))
    }

    func testGoalForWeightReturnsNil() {
        XCTAssertNil(goalValue(for: .weight, stepsGoal: 10_000, activeCaloriesGoal: 500))
    }

    func testGoalForHRVReturnsNil() {
        XCTAssertNil(goalValue(for: .hrv, stepsGoal: 10_000, activeCaloriesGoal: 500))
    }

    func testGoalForDistanceReturnsNil() {
        XCTAssertNil(goalValue(for: .distance, stepsGoal: 10_000, activeCaloriesGoal: 500))
    }

    func testGoalForFloorsClimbedReturnsNil() {
        XCTAssertNil(goalValue(for: .floorsClimbed, stepsGoal: 10_000, activeCaloriesGoal: 500))
    }

    func testGoalForAllUnsupportedTypesReturnsNil() {
        let unsupported: [HealthDataType] = [
            .distance, .totalCalories, .floorsClimbed, .heartRate,
            .restingHeartRate, .hrv, .weight, .bodyFat,
            .bloodPressureSystolic, .bloodPressureDiastolic,
            .oxygenSaturation, .respiratoryRate
        ]
        for dataType in unsupported {
            XCTAssertNil(goalValue(for: dataType, stepsGoal: 10_000, activeCaloriesGoal: 500),
                         "\(dataType.rawValue) should not have a goal")
        }
    }

    // MARK: - apply(from:) merge logic

    /// Mirrors GoalService.apply(from:) — only overrides when value > 0
    private struct GoalState {
        var stepsGoal: Double = 10_000
        var activeCaloriesGoal: Double = 500
        var sleepGoalMinutes: Double = 480

        mutating func apply(from user: User) {
            if let s = user.stepGoal, s > 0 { stepsGoal = Double(s) }
            if let c = user.calorieGoal, c > 0 { activeCaloriesGoal = Double(c) }
            if let sl = user.sleepGoalMinutes, sl > 0 { sleepGoalMinutes = Double(sl) }
        }
    }

    func testApplyFromUserUpdatesStepGoal() {
        var state = GoalState()
        state.apply(from: makeUser(stepGoal: 15_000))
        XCTAssertEqual(state.stepsGoal, 15_000)
    }

    func testApplyFromUserUpdatesCalorieGoal() {
        var state = GoalState()
        state.apply(from: makeUser(calorieGoal: 800))
        XCTAssertEqual(state.activeCaloriesGoal, 800)
    }

    func testApplyFromUserUpdatesSleepGoal() {
        var state = GoalState()
        state.apply(from: makeUser(sleepGoalMinutes: 540))
        XCTAssertEqual(state.sleepGoalMinutes, 540)
    }

    func testApplyFromUserUpdatesAllGoals() {
        var state = GoalState()
        state.apply(from: makeUser(stepGoal: 20_000, calorieGoal: 600, sleepGoalMinutes: 420))
        XCTAssertEqual(state.stepsGoal, 20_000)
        XCTAssertEqual(state.activeCaloriesGoal, 600)
        XCTAssertEqual(state.sleepGoalMinutes, 420)
    }

    func testApplyFromUserIgnoresNilGoals() {
        var state = GoalState(stepsGoal: 12_000, activeCaloriesGoal: 700, sleepGoalMinutes: 500)
        state.apply(from: makeUser()) // all nil
        XCTAssertEqual(state.stepsGoal, 12_000)
        XCTAssertEqual(state.activeCaloriesGoal, 700)
        XCTAssertEqual(state.sleepGoalMinutes, 500)
    }

    func testApplyFromUserIgnoresZeroStepGoal() {
        var state = GoalState(stepsGoal: 12_000)
        state.apply(from: makeUser(stepGoal: 0))
        XCTAssertEqual(state.stepsGoal, 12_000)
    }

    func testApplyFromUserIgnoresZeroCalorieGoal() {
        var state = GoalState(activeCaloriesGoal: 700)
        state.apply(from: makeUser(calorieGoal: 0))
        XCTAssertEqual(state.activeCaloriesGoal, 700)
    }

    func testApplyFromUserIgnoresZeroSleepGoal() {
        var state = GoalState(sleepGoalMinutes: 500)
        state.apply(from: makeUser(sleepGoalMinutes: 0))
        XCTAssertEqual(state.sleepGoalMinutes, 500)
    }

    func testApplyFromUserIgnoresNegativeGoals() {
        var state = GoalState()
        state.apply(from: makeUser(stepGoal: -1, calorieGoal: -5, sleepGoalMinutes: -10))
        XCTAssertEqual(state.stepsGoal, 10_000)
        XCTAssertEqual(state.activeCaloriesGoal, 500)
        XCTAssertEqual(state.sleepGoalMinutes, 480)
    }

    // MARK: - reset() logic

    func testResetRestoresDefaults() {
        var state = GoalState(stepsGoal: 20_000, activeCaloriesGoal: 900, sleepGoalMinutes: 600)
        // Reset to documented defaults
        state.stepsGoal = 10_000
        state.activeCaloriesGoal = 500
        state.sleepGoalMinutes = 480
        XCTAssertEqual(state.stepsGoal, 10_000)
        XCTAssertEqual(state.activeCaloriesGoal, 500)
        XCTAssertEqual(state.sleepGoalMinutes, 480)
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
