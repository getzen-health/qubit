import SwiftUI

/// Sidebar navigation items
enum SidebarItem: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case health = "Health"
    case insights = "Insights"
    case workouts = "Workouts"
    case water = "Water"
    case bodyMeasurements = "Measurements"
    case supplements = "Supplements"
    case mood = "Mood"
    case cycle = "Cycle"
    case profile = "Profile"
    case sleep = "Sleep"
    case stress = "Stress"
    case weeklyBalance = "Weekly Balance"
    case caffeine = "Caffeine"
    case energy = "Energy"
    case deskBreaks = "Desk Breaks"
    case hearingHealth = "Hearing Health"
    case settings = "Settings"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .dashboard: "heart.text.square"
        case .health: "figure.walk"
        case .insights: "sparkles"
        case .workouts: "figure.run"
        case .water: "drop.fill"
        case .bodyMeasurements: "ruler"
        case .supplements: "pills.fill"
        case .mood: "face.smiling"
        case .cycle: "calendar"
        case .profile: "person.crop.circle"
        case .sleep: "moon.fill"
        case .stress: "brain.head.profile"
        case .weeklyBalance: "chart.bar.xaxis"
        case .caffeine: "cup.and.saucer.fill"
        case .energy: "bolt.fill"
        case .deskBreaks: "figure.stand"
        case .hearingHealth: "ear.fill"
        case .settings: "gearshape"
        }
    }

    var section: SidebarSection {
        switch self {
        case .dashboard, .health, .insights, .water, .bodyMeasurements, .supplements, .mood, .cycle, .profile: .main
        case .workouts, .sleep, .stress, .weeklyBalance, .caffeine, .energy, .deskBreaks, .hearingHealth: .data
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
        case .water:
            WaterTrackingView()
        case .bodyMeasurements:
            BodyMeasurementsView()
        case .supplements:
            SupplementsView()
        case .mood:
            MoodView()
        case .cycle:
            CycleView()
        case .profile:
            ProfileView()
        case .sleep:
            SleepView()
        case .stress:
            StressView()
        case .weeklyBalance:
            WeeklyBalanceView()
        case .caffeine:
            CaffeineView()
        case .energy:
            EnergyView()
        case .deskBreaks:
            DeskBreaksView()
        case .hearingHealth:
            HearingHealthView()
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
