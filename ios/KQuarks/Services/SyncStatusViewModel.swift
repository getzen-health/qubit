import Foundation

/// Observes sync success/failure notifications and surfaces errors to the UI.
@Observable
@MainActor
final class SyncStatusViewModel {
    static let shared = SyncStatusViewModel()

    var lastSyncError: String?
    var showSyncErrorBanner = false

    private init() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSyncFailure(_:)),
            name: .syncDidFail,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSyncSuccess),
            name: .syncDidSucceed,
            object: nil
        )
    }

    @objc private func handleSyncFailure(_ notification: Notification) {
        let message = notification.userInfo?["error"] as? String ?? "Sync failed"
        lastSyncError = message
        showSyncErrorBanner = true
    }

    @objc private func handleSyncSuccess() {
        lastSyncError = nil
        showSyncErrorBanner = false
    }

    func dismissBanner() {
        showSyncErrorBanner = false
    }
}
