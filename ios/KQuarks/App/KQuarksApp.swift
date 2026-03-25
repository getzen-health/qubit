import SwiftUI
import Supabase
import SwiftData
#if os(iOS)
import BackgroundTasks
#endif

@main
struct KQuarksApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var appState = AppState()
    @State private var themeManager = ThemeManager.shared
    
    let modelContainer: ModelContainer

    init() {
        let config = ModelConfiguration(
            schema: Schema([PendingSyncItem.self]),
            isStoredInMemoryOnly: false,
            cloudKitDatabase: .automatic
        )
        do {
            modelContainer = try ModelContainer(for: Schema([PendingSyncItem.self]), configurations: [config])
        } catch {
            fatalError("Could not initialize ModelContainer: \(error)")
        }

        #if os(iOS)
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.kquarks.sync.refresh", using: nil) { task in
            Task { await SyncService.shared.handleRefreshTask(task as! BGAppRefreshTask) }
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.kquarks.sync.full", using: nil) { task in
            Task { await SyncService.shared.handleFullSyncTask(task as! BGProcessingTask) }
        }
        AIBriefingService.shared.registerBackgroundTask()
        CrashReportingService.shared.start()
        #endif
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
                .environment(themeManager)
                .modelContainer(modelContainer)
                .preferredColorScheme(themeManager.appearanceMode.colorScheme)
                .tint(themeManager.accentColor)
                .task {
                    let modelContext = ModelContext(modelContainer)
                    OfflineSyncQueue.shared.setModelContext(modelContext)
                }
                .task {
                    await appState.initializeAuth()
                }
                .task {
                    #if os(iOS)
                    SyncService.shared.scheduleBackgroundSync()
                    #endif
                    await NotificationService.shared.refreshAuthorizationStatus()
                }
                .task {
                    HealthKitService.shared.setupBackgroundDelivery()
                }
                .onOpenURL { url in
                    DeepLinkHandler.shared.handleDeepLink(url)
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
        hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
    }

    func initializeAuth() async {
        isCheckingAuth = true

        do {
            let user = try await supabaseService.fetchCurrentUser()
            self.user = user
            self.isAuthenticated = true
            GoalService.shared.apply(from: user)
        } catch {
        }

        isCheckingAuth = false

        for await event in supabaseService.observeAuthStateChanges() {
            await handleAuthEvent(event)
        }
    }

    @MainActor
    private func handleAuthEvent(_ event: AuthChangeEvent) async {
        switch event {
        case .signedIn:
            do {
                let user = try await supabaseService.fetchCurrentUser()
                self.user = user
                self.isAuthenticated = true
                GoalService.shared.apply(from: user)
            } catch {
            }
        case .signedOut:
            self.user = nil
            self.isAuthenticated = false
        case .tokenRefreshed:
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
