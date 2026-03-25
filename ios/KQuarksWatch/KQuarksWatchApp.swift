import SwiftUI

@main
struct KQuarksWatchApp: App {
    @StateObject private var session = WatchSessionManager()

    var body: some Scene {
        WindowGroup {
            WatchContentView()
                .environmentObject(session)
        }
    }
}
