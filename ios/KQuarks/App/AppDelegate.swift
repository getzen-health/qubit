import UIKit

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        application.shortcutItems = Self.makeShortcutItems()
        return true
    }

    func application(
        _ application: UIApplication,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        switch shortcutItem.type {
        case "com.kquarks.sync":
            Task { await SyncService.shared.performFullSync() }
        default:
            break
        }
        completionHandler(true)
    }

    static func makeShortcutItems() -> [UIApplicationShortcutItem] {
        [
            UIApplicationShortcutItem(
                type: "com.kquarks.sync",
                localizedTitle: "Sync Now",
                localizedSubtitle: "Update health data",
                icon: UIApplicationShortcutIcon(systemImageName: "arrow.clockwise"),
                userInfo: nil
            ),
            UIApplicationShortcutItem(
                type: "com.kquarks.steps",
                localizedTitle: "Today's Steps",
                localizedSubtitle: nil,
                icon: UIApplicationShortcutIcon(systemImageName: "figure.walk"),
                userInfo: nil
            ),
            UIApplicationShortcutItem(
                type: "com.kquarks.workouts",
                localizedTitle: "Workouts",
                localizedSubtitle: nil,
                icon: UIApplicationShortcutIcon(systemImageName: "figure.run"),
                userInfo: nil
            ),
        ]
    }
}
