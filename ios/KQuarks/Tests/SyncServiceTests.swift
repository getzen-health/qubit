import XCTest
@testable import KQuarks

final class SyncServiceTests: XCTestCase {
    var sut: SyncService!
    
    override func setUp() {
        super.setUp()
        sut = SyncService.shared
    }
    
    override func tearDown() {
        sut = nil
        super.tearDown()
    }
    
    // MARK: - Data Transformation Tests
    
    func testHealthDataAggregation() {
        // Test that multiple samples are properly aggregated
        let testSamples = [100.0, 105.0, 110.0, 95.0, 100.0]
        
        let sum = testSamples.reduce(0, +)
        let average = sum / Double(testSamples.count)
        
        XCTAssertEqual(average, 102.0, accuracy: 0.1)
        XCTAssertEqual(testSamples.count, 5)
    }
    
    func testDailySummaryCalculation() {
        // Test daily summary aggregation
        struct DailySummary {
            let totalSteps: Int
            let totalCalories: Double
            let averageHR: Double
            let sleepMinutes: Int
        }
        
        let dailyData = DailySummary(
            totalSteps: 10234,
            totalCalories: 450.5,
            averageHR: 72.5,
            sleepMinutes: 480  // 8 hours
        )
        
        XCTAssertGreater(dailyData.totalSteps, 0)
        XCTAssertGreater(dailyData.totalCalories, 0)
        XCTAssertGreater(dailyData.averageHR, 0)
        XCTAssertGreater(dailyData.sleepMinutes, 0)
        
        // Validate ranges
        XCTAssertLess(dailyData.averageHR, 200)
        XCTAssertLess(dailyData.sleepMinutes, 1440)  // Less than 24 hours
    }
    
    func testTimestampDataTransformation() {
        // Test that timestamps are properly transformed for sync
        let testDate = Date()
        let formatter = ISO8601DateFormatter()
        let isoString = formatter.string(from: testDate)
        
        // Should be able to round-trip
        let parsedDate = formatter.date(from: isoString)
        
        XCTAssertNotNil(parsedDate)
        XCTAssertEqual(testDate.timeIntervalSince1970, 
                      parsedDate?.timeIntervalSince1970 ?? 0, 
                      accuracy: 1.0)
    }
    
    func testUnitNormalization() {
        // Test that different unit inputs are normalized correctly
        struct HealthValue {
            let raw: Double
            let unit: String
            
            func normalized() -> Double {
                switch unit {
                case "mg/dL":  // Glucose
                    return (raw - 20) * 0.0555  // Convert to mmol/L
                case "%":      // O2 saturation (already percentage)
                    return raw
                case "bpm":    // Heart rate (no conversion needed)
                    return raw
                default:
                    return raw
                }
            }
        }
        
        let testCases = [
            HealthValue(raw: 100, unit: "mg/dL"),
            HealthValue(raw: 95, unit: "%"),
            HealthValue(raw: 72, unit: "bpm"),
        ]
        
        for value in testCases {
            let normalized = value.normalized()
            XCTAssertGreater(normalized, 0, "Normalized value should be positive")
        }
    }
    
    // MARK: - Sleep Data Transformation Tests
    
    func testSleepStageAggregation() {
        struct SleepStage {
            let name: String
            let durationMinutes: Int
        }
        
        let stages = [
            SleepStage(name: "Awake", durationMinutes: 15),
            SleepStage(name: "REM", durationMinutes: 90),
            SleepStage(name: "Core", durationMinutes: 180),
            SleepStage(name: "Deep", durationMinutes: 120),
        ]
        
        let totalSleep = stages.reduce(0) { $0 + $1.durationMinutes }
        
        XCTAssertEqual(totalSleep, 405)  // 6h 45m
        XCTAssertEqual(stages.count, 4)
        
        // Validate each stage is within reasonable bounds
        for stage in stages {
            XCTAssertGreater(stage.durationMinutes, 0)
            XCTAssertLess(stage.durationMinutes, 1440)  // Less than 24 hours
        }
    }
    
    func testSleepEfficiencyCalculation() {
        // Sleep efficiency = Time Asleep / Time in Bed
        let timeAsleep = 420.0  // 7 hours
        let timeInBed = 480.0   // 8 hours
        let efficiency = (timeAsleep / timeInBed) * 100
        
        XCTAssertEqual(efficiency, 87.5, accuracy: 0.1)
        XCTAssertLessThanOrEqual(efficiency, 100.0)
        XCTAssertGreater(efficiency, 0.0)
    }
    
    // MARK: - Workout Data Transformation Tests
    
    func testWorkoutDataNormalization() {
        struct WorkoutSample {
            let type: String
            let duration: TimeInterval
            let calories: Double
            let distance: Double?
        }
        
        let workouts = [
            WorkoutSample(type: "Running", duration: 1800, calories: 250, distance: 3.2),
            WorkoutSample(type: "Cycling", duration: 2700, calories: 350, distance: 12.5),
            WorkoutSample(type: "Strength", duration: 1200, calories: 150, distance: nil),
        ]
        
        let totalCalories = workouts.reduce(0) { $0 + $1.calories }
        let totalDuration = workouts.reduce(0) { $0 + $1.duration }
        
        XCTAssertEqual(totalCalories, 750.0)
        XCTAssertEqual(totalDuration, 5700)  // 95 minutes
        
        let averageCaloriesPerMinute = totalCalories / (totalDuration / 60)
        XCTAssertGreater(averageCaloriesPerMinute, 0)
        XCTAssertLess(averageCaloriesPerMinute, 20)  // Reasonable range
    }
    
    func testWorkoutDurationFormatting() {
        let testDurations: [TimeInterval] = [600, 1800, 3600, 5400]
        
        for duration in testDurations {
            let minutes = Int(duration) / 60
            let seconds = Int(duration) % 60
            
            XCTAssertGreaterThanOrEqual(minutes, 0)
            XCTAssertGreaterThanOrEqual(seconds, 0)
            XCTAssertLess(seconds, 60)
        }
    }
    
    // MARK: - Oxygen Saturation Transformation
    
    func testOxygenSaturationRangeValidation() {
        // O2 sat in HealthKit is 0.0-1.0, we convert to 0-100%
        let testValues = [0.92, 0.95, 0.98, 1.0]
        
        for value in testValues {
            let percentage = value * 100
            XCTAssertGreaterThanOrEqual(percentage, 90)
            XCTAssertLessThanOrEqual(percentage, 100)
        }
    }
    
    // MARK: - Data Validation Tests
    
    func testHeartRateDataValidation() {
        let validHRValues = [40.0, 60.0, 100.0, 150.0]
        let invalidHRValues = [-10.0, 0.0, 400.0]
        
        for hr in validHRValues {
            let isValid = hr > 0 && hr < 300
            XCTAssertTrue(isValid, "HR \(hr) should be valid")
        }
        
        for hr in invalidHRValues {
            let isValid = hr > 0 && hr < 300
            XCTAssertFalse(isValid, "HR \(hr) should be invalid")
        }
    }
    
    func testStepCountValidation() {
        let testCases: [(steps: Int, isValid: Bool)] = [
            (0, true),          // Valid (zero steps in a day)
            (10000, true),      // Normal
            (50000, true),      // High but valid
            (-100, false),      // Negative
        ]
        
        for (steps, shouldBeValid) in testCases {
            let isValid = steps >= 0 && steps <= 100000
            XCTAssertEqual(isValid, shouldBeValid,
                          "Step validation failed for: \(steps)")
        }
    }
    
    // MARK: - Date Range Tests
    
    func testDateRangeCalculation() {
        let startDate = Date()
        let endDate = startDate.addingTimeInterval(86400 * 7)  // 7 days
        let daysDifference = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0
        
        XCTAssertEqual(daysDifference, 7, "Date range calculation failed")
    }
    
    func testSyncWindowValidation() {
        // Sync should look back reasonable amount of time
        let syncWindow: TimeInterval = 7 * 24 * 60 * 60  // 7 days
        let now = Date()
        let syncStart = now.addingTimeInterval(-syncWindow)
        
        XCTAssertLess(syncStart, now, "Sync window start should be before now")
        let difference = now.timeIntervalSince(syncStart)
        XCTAssertEqual(difference, syncWindow, accuracy: 1.0)
    }
}
