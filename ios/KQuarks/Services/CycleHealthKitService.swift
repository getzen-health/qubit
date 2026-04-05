import HealthKit
import Foundation
import os

@Observable
class CycleHealthKitService {
    private let healthStore = HKHealthStore()

    func requestWritePermissions() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable(),
              let menstrualType = HKObjectType.categoryType(forIdentifier: .menstrualFlow) else {
            return false
        }
        do {
            try await healthStore.requestAuthorization(toShare: [menstrualType], read: [menstrualType])
            return true
        } catch {
            Logger.general.debug("HealthKit write permission error: \(error)")
            return false
        }
    }

    func logMenstrualFlow(date: Date, flow: HKCategoryValueMenstrualFlow) async throws {
        guard let menstrualType = HKObjectType.categoryType(forIdentifier: .menstrualFlow) else {
            throw NSError(domain: "CycleHealthKit", code: 1, userInfo: [NSLocalizedDescriptionKey: "Menstrual flow type unavailable"])
        }
        let sample = HKCategorySample(
            type: menstrualType,
            value: flow.rawValue,
            start: date,
            end: date
        )
        try await healthStore.save(sample)
    }

    func fetchMenstrualFlow(days: Int = 90) async -> [HKCategorySample] {
        guard let menstrualType = HKObjectType.categoryType(forIdentifier: .menstrualFlow) else { return [] }
        let predicate = HKQuery.predicateForSamples(
            withStart: Calendar.current.date(byAdding: .day, value: -days, to: Date()),
            end: Date()
        )
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: menstrualType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKCategorySample]) ?? [])
            }
            healthStore.execute(query)
        }
    }
}
