import LocalAuthentication
import OSLog
import SwiftUI

// MARK: - BiometricError

enum BiometricError: Error, LocalizedError {
    case appLocked
    case lockoutActive(remainingSeconds: Int)
    case authFailed

    var errorDescription: String? {
        switch self {
        case .appLocked:
            return "KQuarks is locked. Please authenticate to continue."
        case .lockoutActive(let remaining):
            let m = remaining / 60
            let s = remaining % 60
            return "Too many failed attempts. Try again in \(m):\(String(format: "%02d", s))."
        case .authFailed:
            return "Biometric authentication failed."
        }
    }
}

// MARK: - BiometricService

@Observable
class BiometricService {
    static let shared = BiometricService()

    // MARK: UserDefaults keys
    private let enabledKey        = "biometric_lock_enabled"
    private let failureCountKey   = "biometric_failure_count"
    private let lockedUntilKey    = "biometric_locked_until"

    // MARK: Lockout policy
    private let maxFailures: Int           = 3
    private let lockoutDuration: TimeInterval = 5 * 60  // 5 minutes

    private static let logger = Logger(subsystem: "com.kquarks", category: "BiometricService")

    // MARK: Observable state
    private(set) var isLocked = false
    private(set) var biometryType: LABiometryType = .none
    /// Seconds remaining in the current lockout period (0 when not locked out).
    private(set) var lockoutRemainingSeconds: Int = 0

    private var lockoutTimer: Timer?

    // MARK: Persisted state

    var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: enabledKey) }
        set { UserDefaults.standard.set(newValue, forKey: enabledKey) }
    }

    private var failureCount: Int {
        get { UserDefaults.standard.integer(forKey: failureCountKey) }
        set { UserDefaults.standard.set(newValue, forKey: failureCountKey) }
    }

    private var lockedUntil: Date? {
        get { UserDefaults.standard.object(forKey: lockedUntilKey) as? Date }
        set { UserDefaults.standard.set(newValue, forKey: lockedUntilKey) }
    }

    // MARK: Computed

    var isInLockout: Bool { lockoutRemainingSeconds > 0 }

    var biometryName: String {
        switch biometryType {
        case .faceID:  return "Face ID"
        case .touchID: return "Touch ID"
        case .opticID: return "Optic ID"
        default:       return "Biometrics"
        }
    }

    var biometryIcon: String {
        switch biometryType {
        case .faceID:  return "faceid"
        case .touchID: return "touchid"
        default:       return "lock.fill"
        }
    }

    var isAvailable: Bool {
        let ctx = LAContext()
        var error: NSError?
        return ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    // MARK: Init

    private init() {
        let ctx = LAContext()
        var error: NSError?
        _ = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        biometryType = ctx.biometryType
        resumeLockoutIfNeeded()
    }

    // MARK: Lockout helpers

    private func resumeLockoutIfNeeded() {
        guard let until = lockedUntil else { return }
        if until > Date() {
            startLockoutCountdown(until: until)
        } else {
            clearLockout()
        }
    }

    private func startLockoutCountdown(until: Date) {
        lockoutRemainingSeconds = max(0, Int(until.timeIntervalSinceNow))
        lockoutTimer?.invalidate()
        lockoutTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            guard let self else { timer.invalidate(); return }
            let remaining = max(0, Int(until.timeIntervalSinceNow))
            Task { @MainActor [weak self] in
                self?.lockoutRemainingSeconds = remaining
                if remaining == 0 { self?.clearLockout() }
            }
        }
    }

    private func clearLockout() {
        lockoutTimer?.invalidate()
        lockoutTimer = nil
        lockoutRemainingSeconds = 0
        lockedUntil = nil
        failureCount = 0
    }

    // MARK: Lock / Unlock

    func lock() {
        guard isEnabled else { return }
        isLocked = true
    }

    func unlock() async {
        guard isLocked else { return }

        if isInLockout {
            Self.logger.info("Unlock attempt blocked: lockout active (\(self.lockoutRemainingSeconds)s remaining)")
            return
        }

        let context = LAContext()
        context.localizedCancelTitle = "Use Passcode"
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Unlock KQuarks to view your health data"
            )
            if success {
                await MainActor.run {
                    isLocked = false
                    clearLockout()
                }
            }
        } catch {
            await MainActor.run { recordAuthFailure() }
        }
    }

    func unlockWithPasscode() async {
        guard isLocked else { return }
        let context = LAContext()
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: "Unlock KQuarks to view your health data"
            )
            if success {
                await MainActor.run {
                    isLocked = false
                    clearLockout()
                }
            }
        } catch { }
    }

    // MARK: Failure tracking

    @MainActor
    private func recordAuthFailure() {
        let newCount = failureCount + 1
        failureCount = newCount
        Self.logger.warning("Biometric failure \(newCount)/\(self.maxFailures)")

        if newCount >= maxFailures {
            let until = Date().addingTimeInterval(lockoutDuration)
            lockedUntil = until
            startLockoutCountdown(until: until)
            Self.logger.error("Biometric locked until \(until) after \(newCount) failures")
        }
    }

    /// Formats the remaining lockout time as "M:SS" for display on the lock screen.
    var lockoutCountdownText: String {
        let m = lockoutRemainingSeconds / 60
        let s = lockoutRemainingSeconds % 60
        return "\(m):\(String(format: "%02d", s))"
    }
}
