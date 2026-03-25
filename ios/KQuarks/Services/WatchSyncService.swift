import Foundation
import WatchConnectivity

class WatchSyncService: NSObject, WCSessionDelegate {
    static let shared = WatchSyncService()

    private override init() {
        super.init()
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    // MARK: - Public API

    func sendSnapshot(_ snapshot: WatchHealthSnapshot) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated, session.isWatchAppInstalled else { return }

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .secondsSince1970

        do {
            let data = try encoder.encode(snapshot)
            try session.updateApplicationContext(["snapshot": data])
        } catch {
            print("[WatchSyncService] Failed to send snapshot: \(error.localizedDescription)")
        }
    }

    // MARK: - WCSessionDelegate

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if let error {
            print("[WatchSyncService] Activation error: \(error.localizedDescription)")
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }
}
