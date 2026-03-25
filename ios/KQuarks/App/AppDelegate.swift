import UIKit

extension Notification.Name {
    static let quickActionTriggered = Notification.Name("KQuarks.quickAction")
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        application.shortcutItems = Self.makeShortcutItems()
        // Handle shortcut launched cold
        if let shortcut = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
            handleShortcut(shortcut)
        }
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        Task { await SupabaseService.shared.saveDevicePushToken(token) }
    }

    func application(
        _ application: UIApplication,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        handleShortcut(shortcutItem)
        completionHandler(true)
    }

    private func handleShortcut(_ item: UIApplicationShortcutItem) {
        switch item.type {
        case "com.kquarks.sync":
            Task { await SyncService.shared.performFullSync() }
        default:
            NotificationCenter.default.post(
                name: .quickActionTriggered,
                object: nil,
                userInfo: ["type": item.type]
            )
        }
    }

    static func makeShortcutItems() -> [UIApplicationShortcutItem] {
        [
            UIApplicationShortcutItem(
                type: "com.kquarks.insights",
                localizedTitle: "Insights",
                localizedSubtitle: "AI health insights",
                icon: UIApplicationShortcutIcon(systemImageName: "sparkles"),
                userInfo: nil
            ),
            UIApplicationShortcutItem(
                type: "com.kquarks.workouts",
                localizedTitle: "Workouts",
                localizedSubtitle: nil,
                icon: UIApplicationShortcutIcon(systemImageName: "figure.run"),
                userInfo: nil
            ),
            UIApplicationShortcutItem(
                type: "com.kquarks.checkin",
                localizedTitle: "Daily Check-in",
                localizedSubtitle: "Log energy, mood & stress",
                icon: UIApplicationShortcutIcon(systemImageName: "checklist"),
                userInfo: nil
            ),
            UIApplicationShortcutItem(
                type: "com.kquarks.sync",
                localizedTitle: "Sync Now",
                localizedSubtitle: "Update health data",
                icon: UIApplicationShortcutIcon(systemImageName: "arrow.clockwise"),
                userInfo: nil
            ),
        ]
    }
}
