import LocalAuthentication
import SwiftUI

@Observable
class BiometricService {
    static let shared = BiometricService()

    private let enabledKey = "biometric_lock_enabled"
    private(set) var isLocked = false
    private(set) var biometryType: LABiometryType = .none

    var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: enabledKey) }
        set { UserDefaults.standard.set(newValue, forKey: enabledKey) }
    }

    private init() {
        let ctx = LAContext()
        var error: NSError?
        _ = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        biometryType = ctx.biometryType
    }

    var biometryName: String {
        switch biometryType {
        case .faceID: return "Face ID"
        case .touchID: return "Touch ID"
        case .opticID: return "Optic ID"
        default: return "Biometrics"
        }
    }

    var biometryIcon: String {
        switch biometryType {
        case .faceID: return "faceid"
        case .touchID: return "touchid"
        default: return "lock.fill"
        }
    }

    var isAvailable: Bool {
        let ctx = LAContext()
        var error: NSError?
        return ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    func lock() {
        guard isEnabled else { return }
        isLocked = true
    }

    func unlock() async {
        guard isLocked else { return }
        let context = LAContext()
        context.localizedCancelTitle = "Use Passcode"
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Unlock KQuarks to view your health data"
            )
            if success {
                await MainActor.run { isLocked = false }
            }
        } catch {
            // Allow falling back to passcode via system UI (already shown by LAContext)
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
                await MainActor.run { isLocked = false }
            }
        } catch { }
    }
}
