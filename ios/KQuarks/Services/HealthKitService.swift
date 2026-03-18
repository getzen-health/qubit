import Foundation
import HealthKit

@Observable
class HealthKitService {
    static let shared = HealthKitService()

    private let healthStore = HKHealthStore()

    var isAuthorized = false
    var authorizationStatus: HKAuthorizationStatus = .notDetermined

    // MARK: - Health Data Types

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()

        // Activity
        types.insert(HKQuantityType(.stepCount))
        types.insert(HKQuantityType(.distanceWalkingRunning))
        types.insert(HKQuantityType(.activeEnergyBurned))
        types.insert(HKQuantityType(.basalEnergyBurned))
        types.insert(HKQuantityType(.flightsClimbed))

        // Heart
        types.insert(HKQuantityType(.heartRate))
        types.insert(HKQuantityType(.restingHeartRate))
        types.insert(HKQuantityType(.heartRateVariabilitySDNN))

        // Body
        types.insert(HKQuantityType(.bodyMass))
        types.insert(HKQuantityType(.bodyFatPercentage))
        types.insert(HKQuantityType(.height))

        // Vitals
        types.insert(HKQuantityType(.oxygenSaturation))
        types.insert(HKQuantityType(.respiratoryRate))
        types.insert(HKQuantityType(.bloodPressureSystolic))
        types.insert(HKQuantityType(.bloodPressureDiastolic))

        // Sleep
        types.insert(HKCategoryType(.sleepAnalysis))

        // Workouts
        types.insert(HKObjectType.workoutType())

        return types
    }

    // MARK: - Authorization

    var isHealthDataAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    func requestAuthorization() async throws {
        guard isHealthDataAvailable else {
            throw HealthKitError.notAvailable
        }

        try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        await MainActor.run {
            isAuthorized = true
        }
    }

    func checkAuthorizationStatus() -> HKAuthorizationStatus {
        healthStore.authorizationStatus(for: HKQuantityType(.stepCount))
    }

    // MARK: - Fetch Today's Summary

    func fetchTodaySummary() async throws -> TodayHealthSummary {
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)

        async let steps = fetchSum(for: .stepCount, from: startOfDay, to: now)
        async let distance = fetchSum(for: .distanceWalkingRunning, from: startOfDay, to: now)
        async let activeCalories = fetchSum(for: .activeEnergyBurned, from: startOfDay, to: now)
        async let floors = fetchSum(for: .flightsClimbed, from: startOfDay, to: now)
        async let restingHR = fetchLatest(for: .restingHeartRate)
        async let hrv = fetchLatest(for: .heartRateVariabilitySDNN)
        async let lastNightSleep = fetchLastNightSleep()

        return try await TodayHealthSummary(
            steps: Int(steps ?? 0),
            distanceMeters: distance ?? 0,
            activeCalories: activeCalories ?? 0,
            floorsClimbed: Int(floors ?? 0),
            restingHeartRate: restingHR.map { Int($0) },
            hrv: hrv,
            sleepHours: lastNightSleep
        )
    }

    // MARK: - Week Summaries for AI

    /// Fetches daily summaries for the past N days for AI context
    func fetchWeekSummaries(days: Int = 7) async throws -> [DaySummaryForAI] {
        let calendar = Calendar.current
        let now = Date()
        var summaries: [DaySummaryForAI] = []

        for dayOffset in 0..<days {
            let date = calendar.date(byAdding: .day, value: -dayOffset, to: now)!
            let startOfDay = calendar.startOfDay(for: date)
            let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

            async let steps = fetchSum(for: .stepCount, from: startOfDay, to: endOfDay)
            async let calories = fetchSum(for: .activeEnergyBurned, from: startOfDay, to: endOfDay)
            async let rhr = fetchLatestInRange(for: .restingHeartRate, from: startOfDay, to: endOfDay)
            async let hrv = fetchLatestInRange(for: .heartRateVariabilitySDNN, from: startOfDay, to: endOfDay)

            let dateFormatter = ISO8601DateFormatter()
            dateFormatter.formatOptions = [.withFullDate]

            let summary = try await DaySummaryForAI(
                date: dateFormatter.string(from: startOfDay),
                steps: Int(steps ?? 0),
                activeCalories: calories ?? 0,
                restingHeartRate: rhr.map { Int($0) },
                avgHrv: hrv,
                sleepDurationMinutes: nil // Sleep is fetched separately
            )
            summaries.append(summary)
        }

        return summaries
    }

    /// Fetch per-day stats for the past 7 days for charting.
    /// - Parameters:
    ///   - identifier: The HealthKit quantity type identifier.
    ///   - isDiscrete: true → discreteAverage (HR, HRV, weight); false → cumulativeSum (steps, calories).
    func fetchWeekData(for identifier: HKQuantityTypeIdentifier, isDiscrete: Bool) async throws -> [(date: Date, value: Double)] {
        let calendar = Calendar.current
        let now = Date()
        let startOfToday = calendar.startOfDay(for: now)
        let startDate = calendar.date(byAdding: .day, value: -6, to: startOfToday)!

        let quantityType = HKQuantityType(identifier)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        let interval = DateComponents(day: 1)
        let options: HKStatisticsOptions = isDiscrete ? .discreteAverage : .cumulativeSum

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsCollectionQuery(
                quantityType: quantityType,
                quantitySamplePredicate: predicate,
                options: options,
                anchorDate: startOfToday,
                intervalComponents: interval
            )

            query.initialResultsHandler = { _, results, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let results = results else {
                    continuation.resume(returning: [])
                    return
                }

                let unit = self.preferredUnit(for: identifier)
                var data: [(date: Date, value: Double)] = []

                results.enumerateStatistics(from: startDate, to: now) { statistics, _ in
                    let value: Double?
                    if isDiscrete {
                        value = statistics.averageQuantity()?.doubleValue(for: unit)
                    } else {
                        value = statistics.sumQuantity()?.doubleValue(for: unit)
                    }
                    if let value = value {
                        data.append((date: statistics.startDate, value: value))
                    }
                }

                continuation.resume(returning: data)
            }

            self.healthStore.execute(query)
        }
    }

    /// Fetch latest value within a date range
    func fetchLatestInRange(for identifier: HKQuantityTypeIdentifier, from startDate: Date, to endDate: Date) async throws -> Double? {
        let quantityType = HKQuantityType(identifier)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: quantityType,
                predicate: predicate,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let sample = samples?.first as? HKQuantitySample else {
                    continuation.resume(returning: nil)
                    return
                }
                let unit = self.preferredUnit(for: identifier)
                continuation.resume(returning: sample.quantity.doubleValue(for: unit))
            }
            self.healthStore.execute(query)
        }
    }

    // MARK: - Quantity Queries

    func fetchSum(for identifier: HKQuantityTypeIdentifier, from startDate: Date, to endDate: Date) async throws -> Double? {
        let quantityType = HKQuantityType(identifier)

        let predicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: .strictStartDate
        )

        let query = HKStatisticsQuery(
            quantityType: quantityType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, _, _ in }

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: quantityType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let unit = self.preferredUnit(for: identifier)
                let value = statistics?.sumQuantity()?.doubleValue(for: unit)
                continuation.resume(returning: value)
            }

            healthStore.execute(query)
        }
    }

    func fetchLatest(for identifier: HKQuantityTypeIdentifier) async throws -> Double? {
        let quantityType = HKQuantityType(identifier)

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: quantityType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let sample = samples?.first as? HKQuantitySample else {
                    continuation.resume(returning: nil)
                    return
                }

                let unit = self.preferredUnit(for: identifier)
                let value = sample.quantity.doubleValue(for: unit)
                continuation.resume(returning: value)
            }

            healthStore.execute(query)
        }
    }

    func fetchSamples(for identifier: HKQuantityTypeIdentifier, from startDate: Date, to endDate: Date, limit: Int = HKObjectQueryNoLimit) async throws -> [HKQuantitySample] {
        let quantityType = HKQuantityType(identifier)

        let predicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: .strictStartDate
        )

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: quantityType,
                predicate: predicate,
                limit: limit,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let quantitySamples = (samples as? [HKQuantitySample]) ?? []
                continuation.resume(returning: quantitySamples)
            }

            healthStore.execute(query)
        }
    }

    // MARK: - Sleep

    func fetchLastNightSleep() async throws -> Double? {
        let calendar = Calendar.current
        let now = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: calendar.startOfDay(for: now))!

        let sleepType = HKCategoryType(.sleepAnalysis)

        let predicate = HKQuery.predicateForSamples(
            withStart: yesterday,
            end: now,
            options: .strictStartDate
        )

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let samples = samples as? [HKCategorySample] else {
                    continuation.resume(returning: nil)
                    return
                }

                // Calculate total sleep (excluding awake periods)
                var totalSleepSeconds: TimeInterval = 0

                for sample in samples {
                    let sleepValue = HKCategoryValueSleepAnalysis(rawValue: sample.value)

                    // Only count actual sleep stages
                    if sleepValue == .asleepCore || sleepValue == .asleepDeep || sleepValue == .asleepREM || sleepValue == .asleepUnspecified {
                        totalSleepSeconds += sample.endDate.timeIntervalSince(sample.startDate)
                    }
                }

                let hours = totalSleepSeconds / 3600
                continuation.resume(returning: hours > 0 ? hours : nil)
            }

            healthStore.execute(query)
        }
    }

    func fetchSleepAnalysis(from startDate: Date, to endDate: Date) async throws -> [HKCategorySample] {
        let sleepType = HKCategoryType(.sleepAnalysis)

        let predicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: .strictStartDate
        )

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let categorySamples = (samples as? [HKCategorySample]) ?? []
                continuation.resume(returning: categorySamples)
            }

            healthStore.execute(query)
        }
    }

    // MARK: - Workouts

    func fetchWorkouts(from startDate: Date, to endDate: Date) async throws -> [HKWorkout] {
        let predicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: .strictStartDate
        )

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: .workoutType(),
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let workouts = (samples as? [HKWorkout]) ?? []
                continuation.resume(returning: workouts)
            }

            healthStore.execute(query)
        }
    }

    func fetchAverageHeartRate(during workout: HKWorkout) async throws -> Double? {
        let hrType = HKQuantityType(.heartRate)
        let predicate = HKQuery.predicateForSamples(
            withStart: workout.startDate,
            end: workout.endDate,
            options: .strictStartDate
        )
        let beatsPerMinute = HKUnit.count().unitDivided(by: .minute())

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: hrType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { _, statistics, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                let value = statistics?.averageQuantity()?.doubleValue(for: beatsPerMinute)
                continuation.resume(returning: value)
            }
            self.healthStore.execute(query)
        }
    }

    // MARK: - Helpers

    private func preferredUnit(for identifier: HKQuantityTypeIdentifier) -> HKUnit {
        switch identifier {
        case .stepCount, .flightsClimbed:
            return .count()
        case .distanceWalkingRunning:
            return .meter()
        case .activeEnergyBurned, .basalEnergyBurned:
            return .kilocalorie()
        case .heartRate, .restingHeartRate:
            return HKUnit.count().unitDivided(by: .minute())
        case .heartRateVariabilitySDNN:
            return .secondUnit(with: .milli)
        case .bodyMass:
            return .gramUnit(with: .kilo)
        case .bodyFatPercentage, .oxygenSaturation:
            return .percent()
        case .height:
            return .meter()
        case .respiratoryRate:
            return HKUnit.count().unitDivided(by: .minute())
        case .bloodPressureSystolic, .bloodPressureDiastolic:
            return .millimeterOfMercury()
        default:
            return .count()
        }
    }
}

// MARK: - Supporting Types

struct TodayHealthSummary {
    var steps: Int
    var distanceMeters: Double
    var activeCalories: Double
    var floorsClimbed: Int
    var restingHeartRate: Int?
    var hrv: Double?
    var sleepHours: Double?

    var distanceKm: Double {
        distanceMeters / 1000
    }

    var formattedSleep: String? {
        guard let hours = sleepHours else { return nil }
        let h = Int(hours)
        let m = Int((hours - Double(h)) * 60)
        return "\(h)h \(m)m"
    }
}

enum HealthKitError: Error, LocalizedError {
    case notAvailable
    case authorizationDenied
    case noData

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "HealthKit is not available on this device"
        case .authorizationDenied:
            return "HealthKit access was denied"
        case .noData:
            return "No health data available"
        }
    }
}

struct DaySummaryForAI: Codable {
    let date: String
    let steps: Int
    let activeCalories: Double
    let restingHeartRate: Int?
    let avgHrv: Double?
    let sleepDurationMinutes: Int?
}
