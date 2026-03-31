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
            // Fallback 1: retry without CloudKit (handles schema migration failures)
            let localConfig = ModelConfiguration(
                schema: Schema([PendingSyncItem.self]),
                isStoredInMemoryOnly: false,
                cloudKitDatabase: .none
            )
            if let fallbackContainer = try? ModelContainer(for: Schema([PendingSyncItem.self]), configurations: [localConfig]) {
                modelContainer = fallbackContainer
            } else {
                // Fallback 2: in-memory store — app stays alive, no local persistence
                let memoryConfig = ModelConfiguration(isStoredInMemoryOnly: true)
                // swiftlint:disable:next force_try
                modelContainer = try! ModelContainer(for: Schema([PendingSyncItem.self]), configurations: [memoryConfig])
            }
        }

        #if os(iOS)
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.kquarks.sync.refresh", using: nil) { task in
            if let refreshTask = task as? BGAppRefreshTask {
                Task { await SyncService.shared.handleRefreshTask(refreshTask) }
            } else {
                task.setTaskCompleted(success: false)
            }
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.kquarks.sync.full", using: nil) { task in
            if let processingTask = task as? BGProcessingTask {
                Task { await SyncService.shared.handleFullSyncTask(processingTask) }
            } else {
                task.setTaskCompleted(success: false)
            }
        }
        AIBriefingService.shared.registerBackgroundTask()
        CrashReportingService.shared.start()
        SentryService.start(dsn: ProcessInfo.processInfo.environment["SENTRY_DSN"] ?? "")
        BackgroundSyncService.shared.registerBackgroundTask()
        BackgroundSyncService.shared.scheduleNextSync()
        if #available(iOS 16.4, *) {
            KQuarksShortcuts.updateAppShortcutParameters()
        }
        #endif
    }

    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

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
                .fullScreenCover(isPresented: Binding(
                    get: {
                        #if targetEnvironment(simulator)
                        return false  // Skip onboarding in simulator for faster iteration
                        #else
                        return !hasCompletedOnboarding
                        #endif
                    },
                    set: { _ in }
                )) {
                    OnboardingView()
                        .environment(appState)
                        .environment(themeManager)
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
        // Skip real auth during UI testing
        if ProcessInfo.processInfo.arguments.contains("UI_TESTING") {
            isAuthenticated = true
            isCheckingAuth = false
            return
        }

        isCheckingAuth = true

        do {
            let user = try await supabaseService.fetchCurrentUser()
            self.user = user
            self.isAuthenticated = true
            if let user { GoalService.shared.apply(from: user) }
        } catch {
            print("[Auth] initializeAuth failed: \(error.localizedDescription)")
            self.isAuthenticated = false
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
                if let user { GoalService.shared.apply(from: user) }
            } catch {
                print("[Auth] signedIn user fetch failed: \(error.localizedDescription)")
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
