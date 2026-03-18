import SwiftUI
import Supabase
import BackgroundTasks

@main
struct KQuarksApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var appState = AppState()
    @State private var themeManager = ThemeManager.shared

    init() {
        // MUST register handlers before app finishes launching.
        // Do NOT move this to .task or .onAppear.
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.kquarks.sync.refresh", using: nil) { task in
            Task { await SyncService.shared.handleRefreshTask(task as! BGAppRefreshTask) }
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.kquarks.sync.full", using: nil) { task in
            Task { await SyncService.shared.handleFullSyncTask(task as! BGProcessingTask) }
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
                .environment(themeManager)
                .preferredColorScheme(themeManager.appearanceMode.colorScheme)
                .tint(themeManager.accentColor)
                .task {
                    await appState.initializeAuth()
                }
                .task {
                    SyncService.shared.scheduleBackgroundSync()
                    await NotificationService.shared.refreshAuthorizationStatus()
                }
                .task {
                    // Set up HealthKit observer queries for background delivery
                    // Only after HealthKit is authorized (no-op if not yet authorized)
                    HealthKitService.shared.setupBackgroundDelivery()
                }
        }
    }
}

@Observable
class AppState {
    var isAuthenticated = false
    var isCheckingAuth = true
    var hasCompletedOnboarding = false
    var user: User?

    private let supabaseService = SupabaseService.shared

    init() {
        // Check stored auth state
        hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
    }

    func initializeAuth() async {
        isCheckingAuth = true

        // Check if there's an existing session
        if let user = try? await supabaseService.fetchCurrentUser() {
            self.user = user
            self.isAuthenticated = true
        }

        isCheckingAuth = false

        // Listen for auth state changes
        for await event in supabaseService.observeAuthStateChanges() {
            await handleAuthEvent(event)
        }
    }

    @MainActor
    private func handleAuthEvent(_ event: AuthChangeEvent) async {
        switch event {
        case .signedIn:
            if let user = try? await supabaseService.fetchCurrentUser() {
                self.user = user
                self.isAuthenticated = true
            }
        case .signedOut:
            self.user = nil
            self.isAuthenticated = false
        case .tokenRefreshed:
            // Token was refreshed, optionally refresh user data
            break
        default:
            break
        }
    }

    func completeOnboarding() {
        hasCompletedOnboarding = true
        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
    }

    func signOut() async {
        do {
            try await supabaseService.signOut()
            user = nil
            isAuthenticated = false
        } catch {
            print("Sign out error: \(error)")
        }
    }
}
