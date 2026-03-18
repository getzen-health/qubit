import SwiftUI

/// Adaptive navigation that uses:
/// - NavigationSplitView with sidebar on iPad (regular width)
/// - TabView on iPhone (compact width)
struct AdaptiveNavigationView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @State private var selectedSidebarItem: SidebarItem? = .dashboard
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    var body: some View {
        if horizontalSizeClass == .regular {
            // iPad: Split view with sidebar
            iPadNavigationView
        } else {
            // iPhone: Tab view
            iPhoneNavigationView
        }
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
        TabView {
            DashboardListView()
                .tabItem {
                    Label("Dashboard", systemImage: "heart.text.square")
                }

            HealthDataView()
                .tabItem {
                    Label("Health", systemImage: "figure.walk")
                }

            WorkoutsView()
                .tabItem {
                    Label("Workouts", systemImage: "figure.run")
                }

            InsightsView()
                .tabItem {
                    Label("Insights", systemImage: "sparkles")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
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
