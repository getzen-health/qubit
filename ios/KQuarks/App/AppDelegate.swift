import UIKit
import UserNotifications

extension Notification.Name {
    static let quickActionTriggered = Notification.Name("KQuarks.quickAction")
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Setup UNUserNotificationCenter delegate to handle notifications
        UNUserNotificationCenter.current().delegate = self
        
        // Request notification permissions
        Task {
            do {
                try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            } catch {
                print("Failed to request notification permissions: \(error)")
            }
        }
        
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
                type: "com.kquarks.foodscanner",
                localizedTitle: "Food Scanner",
                localizedSubtitle: "Scan & check ZenScore™",
                icon: UIApplicationShortcutIcon(systemImageName: "barcode.viewfinder"),
                userInfo: nil
            ),
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
    
    // MARK: - UNUserNotificationCenterDelegate
    
    // Handle notifications when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        print("[AppDelegate] Foreground notification received: \(userInfo)")
        
        // Display notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        print("[AppDelegate] Notification tapped: \(userInfo)")
        
        // Handle deep links from notification data
        if let deepLink = userInfo["deepLink"] as? String,
           let url = URL(string: deepLink) {
            DeepLinkHandler.shared.handleDeepLink(url)
        }
        
        completionHandler()
    }
}
