import Foundation
import BackgroundTasks
import HealthKit

class BackgroundSyncService {
    static let shared = BackgroundSyncService()
    static let taskIdentifier = "com.kquarks.healthsync"
    
    private let healthStore = HKHealthStore()
    private var lastSyncDate: Date? {
        get { UserDefaults.standard.object(forKey: "lastHealthSyncDate") as? Date }
        set { UserDefaults.standard.set(newValue, forKey: "lastHealthSyncDate") }
    }
    
    func registerBackgroundTask() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.taskIdentifier,
            using: nil
        ) { task in
            guard let bgTask = task as? BGAppRefreshTask else {
                task.setTaskCompleted(success: false)
                return
            }
            self.handleBackgroundSync(task: bgTask)
        }
    }
    
    func scheduleNextSync() {
        let request = BGAppRefreshTaskRequest(identifier: Self.taskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 4 * 60 * 60) // 4 hours
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            NSLog("[KQuarks] BGTaskScheduler submit failed: %@", error.localizedDescription)
        }
    }
    
    private func handleBackgroundSync(task: BGAppRefreshTask) {
        scheduleNextSync() // Schedule next sync immediately
        
        task.expirationHandler = { task.setTaskCompleted(success: false) }
        
        Task {
            do {
                try await syncHealthData()
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
    }
    
    func syncHealthData() async throws {
        let now = Date()
        let startDate = lastSyncDate ?? Calendar.current.date(byAdding: .day, value: -7, to: now)!
        
        // Sync steps
        let stepsType = HKQuantityType(.stepCount)
        let query = HKStatisticsCollectionQuery(
            quantityType: stepsType,
            quantitySamplePredicate: HKQuery.predicateForSamples(withStart: startDate, end: now),
            options: .cumulativeSum,
            anchorDate: startDate,
            intervalComponents: DateComponents(day: 1)
        )
        
        // Post steps to Supabase API
        guard let baseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String else { return }
        guard let url = URL(string: "\(baseURL)/api/health/steps?since=\(ISO8601DateFormatter().string(from: startDate))") else { return }

        let (data, _) = try await URLSession.shared.data(from: url)
        _ = data
        
        lastSyncDate = now
        
        // Notify UI
        await MainActor.run {
            NotificationCenter.default.post(name: .healthDataDidSync, object: nil)
        }
    }
    
    var lastSyncFormatted: String {
        guard let date = lastSyncDate else { return "Never" }
        let formatter = RelativeDateTimeFormatter()
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

extension Notification.Name {
    static let healthDataDidSync = Notification.Name("healthDataDidSync")
}
