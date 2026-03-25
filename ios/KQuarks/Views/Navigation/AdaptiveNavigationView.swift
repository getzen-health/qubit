import SwiftUI

/// Adaptive navigation that uses:
/// - NavigationSplitView with sidebar on iPad (regular width)
/// - TabView on iPhone (compact width)
struct AdaptiveNavigationView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    
    @State private var deepLinkHandler = DeepLinkHandler.shared
    @State private var selectedSidebarItem: SidebarItem? = .dashboard
    @State private var columnVisibility: NavigationSplitViewVisibility = .all
    @State private var selectedTab: Int = 0
    @State private var showCheckinSheet = false

    var body: some View {
        if horizontalSizeClass == .regular {
            // iPad: Split view with sidebar
            iPadNavigationView
        } else {
            // iPhone: Tab view
            iPhoneNavigationView
        }
        .onChange(of: deepLinkHandler.pendingDestination) { _, destination in
            handleDeepLinkNavigation(destination)
        }
    }
    
    // MARK: - Deep Link Navigation
    
    private func handleDeepLinkNavigation(_ destination: DeepLinkDestination?) {
        guard let destination = destination else { return }
        
        // Map deep link destination to tab index
        switch destination {
        case .foodScanner, .foodDiary, .foodHistory:
            selectedTab = 0 // Dashboard tab (contains food scanner)
        case .readiness, .sleep, .workouts, .water, .hrv, .body, .glucose, .vitals:
            selectedTab = 1 // Health tab
        case .insights, .achievements, .social:
            selectedTab = 3 // Insights tab (social/achievements)
        case .settings, .profile:
            selectedTab = 4 // Settings tab
        case .habits:
            selectedTab = 3 // Insights tab
        }
        
        // Clear the pending destination after handling
        deepLinkHandler.pendingDestination = nil
    }

    // MARK: - iPad Navigation

    @ViewBuilder
    private var iPadNavigationView: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            SidebarView(selection: $selectedSidebarItem)
        } content: {
            if let item = selectedSidebarItem {
                SidebarContentView(item: item)
            } else {
                ContentUnavailableView(
                    "Select an item",
                    systemImage: "sidebar.left",
                    description: Text("Choose a section from the sidebar.")
                )
            }
        } detail: {
            // Detail view for deeper navigation
            if let item = selectedSidebarItem {
                detailView(for: item)
            } else {
                ContentUnavailableView(
                    "No Selection",
                    systemImage: "doc.text.magnifyingglass",
                    description: Text("Select an item to view details.")
                )
            }
        }
        .navigationSplitViewStyle(.balanced)
    }

    @ViewBuilder
    private func detailView(for item: SidebarItem) -> some View {
        switch item {
        case .dashboard:
            Text("Select a metric for details")
                .foregroundStyle(.secondary)
        case .health:
            Text("Select a health metric")
                .foregroundStyle(.secondary)
        case .insights:
            Text("Select an insight for details")
                .foregroundStyle(.secondary)
        case .workouts:
            Text("Select a workout for details")
                .foregroundStyle(.secondary)
        case .sleep:
            Text("Select a sleep record")
                .foregroundStyle(.secondary)
        case .settings:
            Text("Select a setting")
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - iPhone Navigation

    @ViewBuilder
    private var iPhoneNavigationView: some View {
        TabView(selection: $selectedTab) {
            DashboardListView()
                .tabItem { Label("Dashboard", systemImage: "heart.text.square") }
                .tag(0)

            HealthDataView()
                .tabItem { Label("Health", systemImage: "figure.walk") }
                .tag(1)

            WorkoutsView()
                .tabItem { Label("Workouts", systemImage: "figure.run") }
                .tag(2)

            InsightsView()
                .tabItem { Label("Insights", systemImage: "sparkles") }
                .tag(3)

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
                .tag(4)
        }
        .sheet(isPresented: $showCheckinSheet) {
            CheckinView()
        }
        .onReceive(NotificationCenter.default.publisher(for: .quickActionTriggered)) { note in
            guard let type = note.userInfo?["type"] as? String else { return }
            switch type {
            case "com.kquarks.insights": selectedTab = 3
            case "com.kquarks.workouts": selectedTab = 2
            case "com.kquarks.checkin":
                selectedTab = 0
                showCheckinSheet = true
            default: break
            }
        }
    }
}

#Preview("iPad") {
    AdaptiveNavigationView()
        .environment(\.horizontalSizeClass, .regular)
        .environment(AppState())
        .environment(ThemeManager.shared)
}

#Preview("iPhone") {
    AdaptiveNavigationView()
        .environment(\.horizontalSizeClass, .compact)
        .environment(AppState())
        .environment(ThemeManager.shared)
}
