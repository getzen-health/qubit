import SwiftUI

struct ContentView: View {
    @Environment(AppState.self) private var appState
    @State private var biometric = BiometricService.shared

    var body: some View {
        Group {
            #if targetEnvironment(simulator)
            // In simulator, skip auth to show the dashboard directly
            if biometric.isLocked {
                BiometricLockView()
            } else {
                MainTabView()
            }
            #else
            if !appState.isAuthenticated {
                AuthView()
            } else if biometric.isLocked {
                BiometricLockView()
            } else {
                MainTabView()
            }
            #endif
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)) { _ in
            biometric.lock()
        }
    }
}

struct MainTabView: View {
    var body: some View {
        AdaptiveNavigationView()
    }
}

#Preview {
    ContentView()
        .environment(AppState())
}
