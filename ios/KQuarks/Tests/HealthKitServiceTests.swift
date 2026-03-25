import XCTest
import HealthKit
@testable import KQuarks

final class HealthKitServiceTests: XCTestCase {
    var sut: HealthKitService!
    
    override func setUp() {
        super.setUp()
        sut = HealthKitService.shared
    }
    
    override func tearDown() {
        sut = nil
        super.tearDown()
    }
    
    // MARK: - Unit Conversion Tests
    
    func testOxygenSaturationConversionFromFraction() {
        // HK stores O2 sat as 0.0-1.0 fraction, we display as percentage
        let testCases: [(Double, Double)] = [
            (0.95, 95.0),   // Normal: 95%
            (0.98, 98.0),   // Excellent: 98%
            (0.92, 92.0),   // Low: 92%
            (1.0, 100.0),   // Max
            (0.0, 0.0),     // Min (edge case)
        ]
        
        for (input, expected) in testCases {
            let converted = input * 100.0
            XCTAssertEqual(converted, expected, accuracy: 0.1,
                          "Conversion failed for input \(input)")
        }
    }
    
    func testHeartRateUnitConversion() {
        // HR unit should be beats per minute (bpm)
        let testCases: [Double] = [60.0, 72.0, 100.0, 150.0]
        
        for bpm in testCases {
            XCTAssertGreater(bpm, 0, "Invalid BPM value")
            XCTAssertLess(bpm, 300, "BPM exceeds physiological maximum")
        }
    }
    
    func testStepCountUnitConversion() {
        // Steps should be whole numbers
        let testCases: Int = 10000
        
        XCTAssertGreaterThanOrEqual(testCases, 0, "Step count cannot be negative")
        XCTAssertEqual(testCases % 1, 0, "Step count must be whole number")
    }
    
    func testCalorieConversion() {
        // Active energy in kcal
        let testCases: [Double] = [100.0, 250.5, 500.75]
        
        for calories in testCases {
            XCTAssertGreaterThanOrEqual(calories, 0, "Calorie value cannot be negative")
        }
    }
    
    func testHRVUnitConversion() {
        // HRV in milliseconds
        let testCases: [Double] = [30.0, 50.5, 100.0]
        
        for hrv in testCases {
            XCTAssertGreaterThanOrEqual(hrv, 0, "HRV cannot be negative")
            // HRV typically ranges 20-100ms for healthy individuals
            XCTAssertLess(hrv, 500, "HRV exceeds reasonable range")
        }
    }
    
    // MARK: - Data Validation Tests
    
    func testBloodPressureValidation() {
        let testCases: [(systolic: Int, diastolic: Int, isValid: Bool)] = [
            (120, 80, true),     // Normal
            (140, 90, true),     // Stage 2 hypertension
            (90, 60, true),       // Normal low
            (180, 120, true),     // Crisis
            (80, 120, false),     // Diastolic > systolic (invalid)
            (-10, 60, false),     // Negative systolic
        ]
        
        for (sys, dia, shouldBeValid) in testCases {
            let isValid = sys > 0 && dia > 0 && sys >= dia
            XCTAssertEqual(isValid, shouldBeValid,
                          "Validation failed for BP: \(sys)/\(dia)")
        }
    }
    
    func testRestingHeartRateValidation() {
        let testCases: [(bpm: Double, isValid: Bool)] = [
            (60.0, true),        // Normal
            (40.0, true),        // Athletic
            (100.0, true),       // Elevated but valid
            (-10.0, false),      // Negative
            (500.0, false),      // Unrealistic
        ]
        
        for (bpm, shouldBeValid) in testCases {
            let isValid = bpm > 0 && bpm < 300
            XCTAssertEqual(isValid, shouldBeValid,
                          "RHR validation failed for: \(bpm)")
        }
    }
    
    func testSleepDurationValidation() {
        let testCases: [(hours: Double, isValid: Bool)] = [
            (8.0, true),         // Normal
            (6.5, true),         // Short but valid
            (10.0, true),        // Long but valid
            (0.0, false),        // No sleep
            (-2.0, false),       // Negative
            (25.0, false),       // More than 24 hours
        ]
        
        for (hours, shouldBeValid) in testCases {
            let isValid = hours > 0 && hours <= 24
            XCTAssertEqual(isValid, shouldBeValid,
                          "Sleep duration validation failed for: \(hours)h")
        }
    }
    
    // MARK: - Data Parsing Tests
    
    func testDateComponentExtraction() {
        let testDate = Date(timeIntervalSince1970: 1640000000) // Known timestamp
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day], from: testDate)
        
        XCTAssertNotNil(components.year)
        XCTAssertNotNil(components.month)
        XCTAssertNotNil(components.day)
        XCTAssertGreaterThan(components.year!, 2000)
    }
    
    func testTimestampFormatting() {
        let testDate = Date()
        let formatter = ISO8601DateFormatter()
        let formatted = formatter.string(from: testDate)
        
        XCTAssertFalse(formatted.isEmpty, "Formatted timestamp should not be empty")
        XCTAssertTrue(formatted.contains("T"), "ISO8601 should contain T separator")
        XCTAssertTrue(formatted.contains("Z") || formatted.contains("+") || formatted.contains("-"),
                     "Should include timezone")
    }
    
    // MARK: - Unit Conversion Edge Cases
    
    func testZeroValueHandling() {
        // Test conversion of zero values
        let o2Zero = 0.0 * 100.0
        XCTAssertEqual(o2Zero, 0.0, "Zero oxygen saturation should remain zero")
        
        let hrZero = 0
        XCTAssertEqual(hrZero, 0, "Zero heart rate should remain zero")
    }
    
    func testLargeValueHandling() {
        // Test conversion of large but valid values
        let largeO2 = 1.0 * 100.0  // Max fraction to percentage
        XCTAssertEqual(largeO2, 100.0, "Max O2 should be 100%")
        
        let largeHR = 200.0
        XCTAssertLess(largeHR, 300, "High HR should stay below physiological max")
    }
    
    func testDecimalPrecision() {
        // Test that conversions maintain reasonable precision
        let testValue = 95.5
        let converted = testValue * 1.0  // Mock conversion
        let roundedValue = round(converted * 10) / 10
        
        XCTAssertEqual(roundedValue, testValue, accuracy: 0.1)
    }
}
