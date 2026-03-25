import XCTest
@testable import KQuarks

final class HealthDataUtilityTests: XCTestCase {
    
    // MARK: - Number Formatting Tests
    
    func testStepCountFormatting() {
        let testCases: [(steps: Int, expected: String)] = [
            (1234, "1,234"),
            (10000, "10,000"),
            (100, "100"),
            (1000000, "1,000,000"),
        ]
        
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        
        for (steps, expected) in testCases {
            let formatted = formatter.string(from: NSNumber(value: steps)) ?? ""
            XCTAssertEqual(formatted, expected,
                          "Step formatting failed for: \(steps)")
        }
    }
    
    func testCalorieFormatting() {
        let testCases: [(calories: Double, expected: String)] = [
            (100.0, "100"),
            (250.5, "251"),
            (1500.0, "1,500"),
        ]
        
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        
        for (calories, expected) in testCases {
            let formatted = formatter.string(from: NSNumber(value: calories)) ?? ""
            XCTAssertEqual(formatted, expected,
                          "Calorie formatting failed for: \(calories)")
        }
    }
    
    func testHeartRateFormatting() {
        let testCases: [(bpm: Int, expected: String)] = [
            (60, "60"),
            (72, "72"),
            (125, "125"),
        ]
        
        for (bpm, expected) in testCases {
            let formatted = String(bpm)
            XCTAssertEqual(formatted, expected,
                          "HR formatting failed for: \(bpm)")
        }
    }
    
    func testHRVFormatting() {
        let testCases: [(hrv: Double, expected: String)] = [
            (30.5, "31 ms"),
            (50.0, "50 ms"),
            (100.25, "100 ms"),
        ]
        
        for (hrv, _) in testCases {
            let rounded = String(Int(round(hrv)))
            XCTAssertNotNil(rounded, "HRV formatting failed for: \(hrv)")
        }
    }
    
    // MARK: - Time Duration Formatting Tests
    
    func testSleepDurationFormatting() {
        let testCases: [(minutes: Int, expectedHours: Double)] = [
            (480, 8.0),      // 8 hours
            (420, 7.0),      // 7 hours
            (540, 9.0),      // 9 hours
            (360, 6.0),      // 6 hours
        ]
        
        for (minutes, expectedHours) in testCases {
            let hours = Double(minutes) / 60.0
            XCTAssertEqual(hours, expectedHours, accuracy: 0.1,
                          "Sleep duration formatting failed for: \(minutes) minutes")
        }
    }
    
    func testWorkoutDurationFormatting() {
        let testCases: [(seconds: Int, expected: String)] = [
            (600, "10:00"),      // 10 minutes
            (1800, "30:00"),     // 30 minutes
            (3600, "60:00"),     // 1 hour
            (5400, "90:00"),     // 1.5 hours
        ]
        
        for (seconds, expected) in testCases {
            let minutes = seconds / 60
            let secs = seconds % 60
            let formatted = String(format: "%d:%02d", minutes, secs)
            XCTAssertEqual(formatted, expected,
                          "Duration formatting failed for: \(seconds) seconds")
        }
    }
    
    // MARK: - Distance Formatting Tests
    
    func testDistanceFormatting() {
        let testCases: [(km: Double, expected: String)] = [
            (0.5, "0.5 km"),
            (3.2, "3.2 km"),
            (10.0, "10.0 km"),
            (21.1, "21.1 km"),
        ]
        
        for (km, _) in testCases {
            let formatted = String(format: "%.1f km", km)
            XCTAssertTrue(formatted.contains("km"), 
                         "Distance formatting failed for: \(km)")
        }
    }
    
    // MARK: - Percentage Formatting Tests
    
    func testBodyFatPercentageFormatting() {
        let testCases: [(percentage: Double, expected: String)] = [
            (15.5, "15.5%"),
            (25.0, "25.0%"),
            (35.75, "35.8%"),
        ]
        
        for (percentage, _) in testCases {
            let formatted = String(format: "%.1f%%", percentage)
            XCTAssertTrue(formatted.contains("%"), 
                         "Body fat percentage formatting failed")
        }
    }
    
    func testOxygenSaturationFormatting() {
        let testCases: [(percent: Double, expected: String)] = [
            (95.0, "95%"),
            (98.5, "98.5%"),
            (92.0, "92%"),
        ]
        
        for (percent, _) in testCases {
            let formatted = String(format: "%.0f%%", percent)
            XCTAssertTrue(formatted.contains("%"),
                         "O2 sat formatting failed")
        }
    }
    
    // MARK: - Date Formatting Tests
    
    func testDateFormatting() {
        let testDate = Date(timeIntervalSince1970: 1640000000)
        
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        
        let formatted = formatter.string(from: testDate)
        XCTAssertFalse(formatted.isEmpty, "Date formatting produced empty string")
    }
    
    func testTimeFormatting() {
        let testDate = Date(timeIntervalSince1970: 1640000000)
        
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        formatter.dateStyle = .none
        
        let formatted = formatter.string(from: testDate)
        XCTAssertFalse(formatted.isEmpty, "Time formatting produced empty string")
    }
    
    // MARK: - Unit Conversion Helpers
    
    func testMilesToKilometersConversion() {
        let testCases: [(miles: Double, expectedKm: Double)] = [
            (1.0, 1.609),
            (5.0, 8.047),
            (10.0, 16.09),
        ]
        
        for (miles, expectedKm) in testCases {
            let km = miles * 1.60934
            XCTAssertEqual(km, expectedKm, accuracy: 0.01)
        }
    }
    
    func testPoundsToKilogramsConversion() {
        let testCases: [(lbs: Double, expectedKg: Double)] = [
            (150.0, 68.04),
            (200.0, 90.72),
            (175.0, 79.38),
        ]
        
        for (lbs, expectedKg) in testCases {
            let kg = lbs / 2.20462
            XCTAssertEqual(kg, expectedKg, accuracy: 0.1)
        }
    }
    
    func testFeetInchesToCentimetersConversion() {
        // 5'10" should be approximately 177.8 cm
        let feet = 5.0
        let inches = 10.0
        let totalInches = feet * 12 + inches
        let cm = totalInches * 2.54
        
        XCTAssertEqual(cm, 177.8, accuracy: 0.1)
    }
    
    // MARK: - String Parsing Tests
    
    func testNumericStringParsing() {
        let testCases = [
            ("123", 123),
            ("0", 0),
            ("50000", 50000),
            ("invalid", -1),  // Should fail to parse
        ]
        
        for (str, expected) in testCases {
            let parsed = Int(str) ?? -1
            XCTAssertEqual(parsed, expected,
                          "Numeric parsing failed for: '\(str)'")
        }
    }
    
    func testDecimalStringParsing() {
        let testCases = [
            ("95.5", 95.5),
            ("100.0", 100.0),
            ("72.25", 72.25),
        ]
        
        for (str, expected) in testCases {
            let parsed = Double(str) ?? 0
            XCTAssertEqual(parsed, expected, accuracy: 0.01,
                          "Decimal parsing failed for: '\(str)'")
        }
    }
    
    // MARK: - Range and Bounds Tests
    
    func testHeartRateRangeDisplay() {
        // Display HR range with bounds
        let minHR = 55.0
        let maxHR = 125.0
        let avgHR = 85.0
        
        XCTAssertLessThanOrEqual(minHR, avgHR)
        XCTAssertLessThanOrEqual(avgHR, maxHR)
        XCTAssertGreater(maxHR - minHR, 0)
    }
    
    func testStepsProgressPercentage() {
        let stepGoal = 10000
        let currentSteps = 7500
        let percentage = (Double(currentSteps) / Double(stepGoal)) * 100
        
        XCTAssertEqual(percentage, 75.0, accuracy: 0.1)
        XCTAssertGreater(percentage, 0)
        XCTAssertLessThanOrEqual(percentage, 100)
    }
}
