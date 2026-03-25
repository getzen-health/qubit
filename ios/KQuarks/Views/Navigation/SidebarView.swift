import SwiftUI

/// Sidebar navigation items
enum SidebarItem: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case health = "Health"
    case insights = "Insights"
    case workouts = "Workouts"
    case sleep = "Sleep"
    case weeklyBalance = "Weekly Balance"
    case settings = "Settings"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .dashboard: "heart.text.square"
        case .health: "figure.walk"
        case .insights: "sparkles"
        case .workouts: "figure.run"
        case .sleep: "moon.fill"
        case .weeklyBalance: "chart.bar.xaxis"
        case .settings: "gearshape"
        }
    }

    var section: SidebarSection {
        switch self {
        case .dashboard, .health, .insights: .main
        case .workouts, .sleep, .weeklyBalance: .data
        case .settings: .other
        }
    }
}

enum SidebarSection: String, CaseIterable {
    case main = "Main"
    case data = "Data"
    case other = "Other"

    var items: [SidebarItem] {
        SidebarItem.allCases.filter { $0.section == self }
    }
}

/// iPad sidebar navigation
struct SidebarView: View {
    @Binding var selection: SidebarItem?

    var body: some View {
        List(selection: $selection) {
            ForEach(SidebarSection.allCases, id: \.self) { section in
                Section(section.rawValue) {
                    ForEach(section.items) { item in
                        NavigationLink(value: item) {
                            Label(item.rawValue, systemImage: item.icon)
                        }
                    }
                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("KQuarks")
        .toolbarTitleDisplayMode(.inline)
    }
}

/// View for selected sidebar item
struct SidebarContentView: View {
    let item: SidebarItem

    var body: some View {
        switch item {
        case .dashboard:
            DashboardListView()
        case .health:
            HealthDataView()
        case .insights:
            InsightsView()
        case .workouts:
            WorkoutsView()
        case .sleep:
            SleepView()
        case .weeklyBalance:
            WeeklyBalanceView()
        case .settings:
            SettingsView()
        }
    }
}

#Preview {
    NavigationStack {
        SidebarView(selection: .constant(.dashboard))
    }
}
