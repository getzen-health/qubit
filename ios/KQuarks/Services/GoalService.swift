import SwiftUI

@Observable
final class GoalService {
    static let shared = GoalService()
    private init() {}

    // @AppStorage inside @Observable must use @ObservationIgnored + computed property pair
    // Without @ObservationIgnored the @Observable macro conflicts with @AppStorage's machinery.
    @ObservationIgnored
    @AppStorage("goal_steps") private var storedStepsGoal: Double = 10_000

    @ObservationIgnored
    @AppStorage("goal_activeCalories") private var storedActiveCaloriesGoal: Double = 500

    var stepsGoal: Double {
        get { storedStepsGoal }
        set { storedStepsGoal = newValue }
    }

    var activeCaloriesGoal: Double {
        get { storedActiveCaloriesGoal }
        set { storedActiveCaloriesGoal = newValue }
    }

    func goal(for dataType: HealthDataType) -> Double? {
        switch dataType {
        case .steps: return stepsGoal
        case .activeCalories: return activeCaloriesGoal
        default: return nil
        }
    }

    func reset() {
        stepsGoal = 10_000
        activeCaloriesGoal = 500
    }
}
