import ActivityKit
import HealthKit
import Foundation
import os

#if !targetEnvironment(macCatalyst)
@available(iOS 16.1, *)
@Observable
class WorkoutLiveActivityService {
    private var currentActivity: Activity<WorkoutActivityAttributes>?
    var isActive = false
    
    func startActivity(workoutType: String) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        
        let attributes = WorkoutActivityAttributes(
            workoutType: workoutType,
            startTime: Date()
        )
        let state = WorkoutActivityAttributes.ContentState(
            elapsedSeconds: 0,
            heartRate: 0,
            activeCalories: 0,
            currentPace: nil
        )
        
        do {
            currentActivity = try Activity.request(
                attributes: attributes,
                contentState: state,
                pushType: nil
            )
            isActive = true
        } catch {
            Logger.general.debug("[WorkoutLiveActivity] Failed to start: \(error)")
        }
    }
    
    func update(elapsedSeconds: Int, heartRate: Double, calories: Double, pace: String? = nil) {
        guard let activity = currentActivity else { return }
        let state = WorkoutActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds,
            heartRate: heartRate,
            activeCalories: calories,
            currentPace: pace
        )
        Task {
            await activity.update(using: state)
        }
    }
    
    func stop() {
        guard let activity = currentActivity else { return }
        let finalState = activity.contentState
        Task {
            await activity.end(using: finalState, dismissalPolicy: .after(.now + 60))
            isActive = false
            currentActivity = nil
        }
    }
}
#endif
