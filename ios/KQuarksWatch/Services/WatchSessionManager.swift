import Foundation
import WatchConnectivity

@Observable
class WatchSessionManager: NSObject, WCSessionDelegate {
    var snapshot: WatchHealthSnapshot?
    var lastUpdated: Date?

    override init() {
        super.init()
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    // MARK: - Quick Log (Watch → iPhone)

    /// Send a quick log entry to the paired iPhone.
    /// Uses transferUserInfo so delivery is guaranteed even if iPhone is not reachable.
    func sendQuickLog(type: String, value: Double) {
        guard WCSession.default.activationState == .activated else {
            print("[WatchSession] Session not activated — cannot send quick log")
            return
        }
        let payload: [String: Any] = [
            "type": "quick_log",
            "log_type": type,
            "value": value,
            "timestamp": Date().timeIntervalSince1970,
        ]
        WCSession.default.transferUserInfo(payload)
    }

    // MARK: - WCSessionDelegate

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if let error {
            print("[WatchSession] Activation error: \(error.localizedDescription)")
        }
    }

    func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        guard
            let data = applicationContext["snapshot"] as? Data
        else { return }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .secondsSince1970

        do {
            let decoded = try decoder.decode(WatchHealthSnapshot.self, from: data)
            DispatchQueue.main.async {
                self.snapshot = decoded
                self.lastUpdated = Date()
            }
        } catch {
            print("[WatchSession] Failed to decode snapshot: \(error.localizedDescription)")
        }
    }
}
