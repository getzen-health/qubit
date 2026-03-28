import ActivityKit
import BackgroundTasks
import Foundation

#if !targetEnvironment(macCatalyst)
@MainActor
class LiveActivityManager: ObservableObject {
    static let shared = LiveActivityManager()
    
    private var fastingActivity: Activity<FastingLiveActivityAttributes>?
    private var workoutActivity: Activity<WorkoutLiveActivityAttributes>?
    
    func startFastingActivity(startTime: Date, goal: String, targetSeconds: Int) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let attributes = FastingLiveActivityAttributes(startTime: startTime, goal: goal)
        let state = FastingLiveActivityAttributes.ContentState(
            elapsedSeconds: 0,
            targetSeconds: targetSeconds,
            phase: "starting"
        )
        do {
            let staleDate = Calendar.current.date(byAdding: .minute, value: 1, to: Date())
            fastingActivity = try Activity.request(
                attributes: attributes,
                content: .init(state: state, staleDate: staleDate)
            )
            Task {
                LiveActivityManager.shared.scheduleFastingUpdate()
            }
        } catch {
            print("Failed to start fasting Live Activity: \(error)")
        }
    }
    
    func updateFastingActivity(elapsedSeconds: Int, targetSeconds: Int, phase: String) {
        Task {
            let state = FastingLiveActivityAttributes.ContentState(
                elapsedSeconds: elapsedSeconds,
                targetSeconds: targetSeconds,
                phase: phase
            )
            let staleDate = Calendar.current.date(byAdding: .minute, value: 1, to: Date())
            await fastingActivity?.update(.init(state: state, staleDate: staleDate))
        }
    }
    
    func stopFastingActivity() {
        Task {
            await fastingActivity?.end(nil, dismissalPolicy: .immediate)
            fastingActivity = nil
        }
    }
    
    func startWorkoutActivity(workoutType: String, startTime: Date) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let attributes = WorkoutLiveActivityAttributes(workoutType: workoutType, startTime: startTime)
        let state = WorkoutLiveActivityAttributes.ContentState(
            heartRate: 0, calories: 0, durationSeconds: 0, distanceMeters: 0,
            zone: "Zone 1", zoneColor: "#4CAF50"
        )
        do {
            workoutActivity = try Activity.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil)
            )
        } catch {
            print("Failed to start workout Live Activity: \(error)")
        }
    }
    
    func updateWorkoutActivity(heartRate: Int, calories: Int, durationSeconds: Int, distanceMeters: Int, zone: String, zoneColor: String) {
        Task {
            let state = WorkoutLiveActivityAttributes.ContentState(
                heartRate: heartRate, calories: calories, durationSeconds: durationSeconds, distanceMeters: distanceMeters,
                zone: zone, zoneColor: zoneColor
            )
            await workoutActivity?.update(.init(state: state, staleDate: nil))
        }
    }
    
    func stopWorkoutActivity() {
        Task {
            await workoutActivity?.end(nil, dismissalPolicy: .immediate)
            workoutActivity = nil
        }
    }
    
    func scheduleFastingUpdate() {
        let request = BGAppRefreshTaskRequest(identifier: "com.kquarks.fasting-update")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60)
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule fasting update: \(error)")
        }
    }
}
#endif
