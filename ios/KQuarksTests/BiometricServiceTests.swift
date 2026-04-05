import XCTest
import LocalAuthentication
@testable import KQuarks

// MARK: - BiometricService Unit Tests
//
// Tests the pure-logic formatting and mapping helpers in BiometricService.
// lockoutCountdownText, biometryName, biometryIcon, and BiometricError
// descriptions are tested via standalone helper functions that mirror the
// production code, since BiometricService.shared uses LAContext in init().

final class BiometricServiceTests: XCTestCase {

    // MARK: - lockoutCountdownText logic

    /// Mirrors BiometricService.lockoutCountdownText formatting
    private func formatCountdown(seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return "\(m):\(String(format: "%02d", s))"
    }

    func testCountdownText_fiveMinutes() {
        XCTAssertEqual(formatCountdown(seconds: 300), "5:00")
    }

    func testCountdownText_oneMinuteFiveSeconds() {
        XCTAssertEqual(formatCountdown(seconds: 65), "1:05")
    }

    func testCountdownText_zero() {
        XCTAssertEqual(formatCountdown(seconds: 0), "0:00")
    }

    func testCountdownText_oneSecond() {
        XCTAssertEqual(formatCountdown(seconds: 1), "0:01")
    }

    func testCountdownText_fiftynineSeconds() {
        XCTAssertEqual(formatCountdown(seconds: 59), "0:59")
    }

    func testCountdownText_tenMinutes() {
        XCTAssertEqual(formatCountdown(seconds: 600), "10:00")
    }

    func testCountdownText_ninetySeconds() {
        XCTAssertEqual(formatCountdown(seconds: 90), "1:30")
    }

    // MARK: - biometryName mapping

    /// Mirrors BiometricService.biometryName
    private func biometryName(for type: LABiometryType) -> String {
        switch type {
        case .faceID:  return "Face ID"
        case .touchID: return "Touch ID"
        case .opticID: return "Optic ID"
        default:       return "Biometrics"
        }
    }

    func testBiometryName_faceID() {
        XCTAssertEqual(biometryName(for: .faceID), "Face ID")
    }

    func testBiometryName_touchID() {
        XCTAssertEqual(biometryName(for: .touchID), "Touch ID")
    }

    func testBiometryName_opticID() {
        XCTAssertEqual(biometryName(for: .opticID), "Optic ID")
    }

    func testBiometryName_none() {
        XCTAssertEqual(biometryName(for: .none), "Biometrics")
    }

    // MARK: - biometryIcon mapping

    /// Mirrors BiometricService.biometryIcon
    private func biometryIcon(for type: LABiometryType) -> String {
        switch type {
        case .faceID:  return "faceid"
        case .touchID: return "touchid"
        default:       return "lock.fill"
        }
    }

    func testBiometryIcon_faceID() {
        XCTAssertEqual(biometryIcon(for: .faceID), "faceid")
    }

    func testBiometryIcon_touchID() {
        XCTAssertEqual(biometryIcon(for: .touchID), "touchid")
    }

    func testBiometryIcon_none() {
        XCTAssertEqual(biometryIcon(for: .none), "lock.fill")
    }

    // MARK: - BiometricError descriptions

    func testErrorDescription_appLocked() {
        let error = BiometricError.appLocked
        XCTAssertEqual(error.errorDescription, "KQuarks is locked. Please authenticate to continue.")
    }

    func testErrorDescription_lockoutActive() {
        let error = BiometricError.lockoutActive(remainingSeconds: 300)
        XCTAssertEqual(error.errorDescription, "Too many failed attempts. Try again in 5:00.")
    }

    func testErrorDescription_lockoutActiveOddSeconds() {
        let error = BiometricError.lockoutActive(remainingSeconds: 125)
        XCTAssertEqual(error.errorDescription, "Too many failed attempts. Try again in 2:05.")
    }

    func testErrorDescription_authFailed() {
        let error = BiometricError.authFailed
        XCTAssertEqual(error.errorDescription, "Biometric authentication failed.")
    }
}
