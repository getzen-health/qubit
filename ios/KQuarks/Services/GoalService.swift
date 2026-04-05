import SwiftUI
import UIKit
import os

@Observable
final class GoalService {
    static let shared = GoalService()
    private init() {}

    // @AppStorage inside @Observable must use @ObservationIgnored + computed property pair
    // Without @ObservationIgnored the @Observable macro conflicts with @AppStorage's machinery.
    @ObservationIgnored
    @AppStorage("goal_steps", store: UserDefaults(suiteName: "group.com.qxlsz.kquarks")) private var storedStepsGoal: Double = 10_000

    @ObservationIgnored
    @AppStorage("goal_calories", store: UserDefaults(suiteName: "group.com.qxlsz.kquarks")) private var storedActiveCaloriesGoal: Double = 500

    @ObservationIgnored
    @AppStorage("goal_sleepMinutes", store: UserDefaults(suiteName: "group.com.qxlsz.kquarks")) private var storedSleepGoalMinutes: Double = 480

    @ObservationIgnored
    @AppStorage("goal_hrv", store: UserDefaults(suiteName: "group.com.qxlsz.kquarks")) private var storedHrvTarget: Double = 50

    var stepsGoal: Double {
        get { storedStepsGoal }
        set { storedStepsGoal = newValue }
    }

    var activeCaloriesGoal: Double {
        get { storedActiveCaloriesGoal }
        set { storedActiveCaloriesGoal = newValue }
    }

    var sleepGoalMinutes: Double {
        get { storedSleepGoalMinutes }
        set { storedSleepGoalMinutes = newValue }
    }

    var hrvTarget: Double {
        get { storedHrvTarget }
        set { storedHrvTarget = newValue }
    }

    func goal(for dataType: HealthDataType) -> Double? {
        switch dataType {
        case .steps: return stepsGoal
        case .activeCalories: return activeCaloriesGoal
        default: return nil
        }
    }

    /// Apply goals fetched from the server (DB wins over local).
    func apply(from user: User) {
        if let s = user.stepGoal, s > 0 { stepsGoal = Double(s) }
        if let c = user.calorieGoal, c > 0 { activeCaloriesGoal = Double(c) }
        if let sl = user.sleepGoalMinutes, sl > 0 { sleepGoalMinutes = Double(sl) }
    }

    /// Persist current goals to Supabase.
    func saveToSupabase() {
        Task {
            do {
                try await SupabaseService.shared.saveUserGoals(
                    stepGoal: Int(stepsGoal),
                    calorieGoal: Int(activeCaloriesGoal),
                    sleepGoalMinutes: Int(sleepGoalMinutes)
                )
                #if os(iOS)
                await MainActor.run {
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                }
                #endif
            } catch {
                Logger.general.debug("[GoalService] Failed to save goals to Supabase: \(error)")
            }
        }
    }

    func reset() {
        stepsGoal = 10_000
        activeCaloriesGoal = 500
        sleepGoalMinutes = 480
        hrvTarget = 50
        saveToSupabase()
    }
}
