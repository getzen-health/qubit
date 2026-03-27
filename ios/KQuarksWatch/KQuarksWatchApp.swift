import SwiftUI

@main
struct KQuarksWatchApp: App {
    @StateObject private var session = WatchSessionManager()

    var body: some Scene {
        WindowGroup {
            TabView {
                WatchContentView()
                    .tag(0)
                NavigationStack {
                    QuickLogWatchView()
                }
                .tag(1)
            }
            .tabViewStyle(.page)
            .environmentObject(session)
        }
    }
}
