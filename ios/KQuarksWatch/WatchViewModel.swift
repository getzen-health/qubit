import Foundation
import HealthKit
import WatchKit

@MainActor
class WatchViewModel: ObservableObject {
    @Published var steps: Int = 0
    @Published var heartRate: Int = 0
    @Published var healthScore: Int = 0

    private let healthStore = HKHealthStore()

    func fetchData() {
        requestPermissions()
        fetchSteps()
        fetchHeartRate()
        // Health score fetched from shared UserDefaults (App Group)
        if let score = UserDefaults(suiteName: "group.app.kquarks")?.integer(forKey: "healthScore") {
            healthScore = score
        }
    }

    private func requestPermissions() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let types: Set<HKObjectType> = [
            HKQuantityType(.stepCount),
            HKQuantityType(.heartRate),
        ]
        healthStore.requestAuthorization(toShare: nil, read: types) { _, _ in }
    }

    private func fetchSteps() {
        let type = HKQuantityType(.stepCount)
        let start = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date())
        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] _, result, _ in
            Task { @MainActor in
                self?.steps = Int(result?.sumQuantity()?.doubleValue(for: .count()) ?? 0)
            }
        }
        healthStore.execute(query)
    }

    private func fetchHeartRate() {
        let type = HKQuantityType(.heartRate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            Task { @MainActor in
                if let sample = samples?.first as? HKQuantitySample {
                    self?.heartRate = Int(sample.quantity.doubleValue(for: HKUnit(from: "count/min")))
                }
            }
        }
        healthStore.execute(query)
    }

    func logWater() {
        WKInterfaceDevice.current().play(.click)
        // TODO: Save to HealthKit HKQuantityType(.dietaryWater)
    }

    func logMood() {
        WKInterfaceDevice.current().play(.click)
        // TODO: Navigate to mood picker
    }
}
