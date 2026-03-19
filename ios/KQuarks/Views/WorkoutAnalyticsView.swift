import SwiftUI

// MARK: - WorkoutAnalyticsView

/// Hub view listing all workout analysis sections and cross-cutting analytics.
struct WorkoutAnalyticsView: View {

    private struct AnalyticsEntry: Identifiable {
        let id = UUID()
        let title: String
        let subtitle: String
        let icon: String
        let color: Color
        let destination: AnyView
    }

    private let sections: [(header: String, entries: [AnalyticsEntry])] = [
        (
            header: "Sport Analysis",
            entries: [
                AnalyticsEntry(title: "Running", subtitle: "Pace, distance & PRs", icon: "figure.run", color: .orange,
                               destination: AnyView(RunningAnalysisView())),
                AnalyticsEntry(title: "Cycling", subtitle: "Speed, distance & weekly volume", icon: "figure.outdoor.cycle", color: .blue,
                               destination: AnyView(CyclingAnalysisView())),
                AnalyticsEntry(title: "Swimming", subtitle: "Pace per 100m & pool sets", icon: "figure.pool.swim", color: .cyan,
                               destination: AnyView(SwimmingAnalysisView())),
                AnalyticsEntry(title: "Strength Training", subtitle: "Frequency, volume & sessions", icon: "figure.strengthtraining.traditional", color: .red,
                               destination: AnyView(StrengthAnalysisView())),
                AnalyticsEntry(title: "Hiking", subtitle: "Distance, elevation & hike log", icon: "figure.hiking", color: .green,
                               destination: AnyView(HikingAnalysisView())),
                AnalyticsEntry(title: "HIIT", subtitle: "Peak HR, burn rate & intensity", icon: "bolt.heart.fill", color: .pink,
                               destination: AnyView(HIITAnalysisView())),
                AnalyticsEntry(title: "Rowing", subtitle: "500m splits, distance & HR", icon: "figure.rowing", color: .cyan,
                               destination: AnyView(RowingAnalysisView())),
            ]
        ),
        (
            header: "Training Analytics",
            entries: [
                AnalyticsEntry(title: "Heart Rate Zones", subtitle: "Z1–Z5 distribution across workouts", icon: "heart.circle.fill", color: .red,
                               destination: AnyView(HeartRateZonesView())),
                AnalyticsEntry(title: "Training Load", subtitle: "Acute:chronic ratio & fatigue", icon: "chart.bar.fill", color: .purple,
                               destination: AnyView(TrainingLoadView())),
                AnalyticsEntry(title: "Running Form", subtitle: "Cadence, stride & vertical oscillation", icon: "figure.run.motion", color: .orange,
                               destination: AnyView(RunningFormView())),
                AnalyticsEntry(title: "Race Predictor", subtitle: "5K, 10K, half & full via VDOT", icon: "stopwatch.fill", color: .green,
                               destination: AnyView(RacePredictorView())),
                AnalyticsEntry(title: "Records & PRs", subtitle: "Your lifetime personal bests", icon: "trophy.fill", color: .yellow,
                               destination: AnyView(RecordsView())),
            ]
        ),
    ]

    var body: some View {
        List {
            ForEach(sections, id: \.header) { section in
                Section(section.header) {
                    ForEach(section.entries) { entry in
                        NavigationLink(destination: entry.destination) {
                            HStack(spacing: 12) {
                                Image(systemName: entry.icon)
                                    .font(.title3)
                                    .foregroundStyle(entry.color)
                                    .frame(width: 36, height: 36)
                                    .background(entry.color.opacity(0.12))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(entry.title)
                                        .font(.subheadline.weight(.medium))
                                    Text(entry.subtitle)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Analytics")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        WorkoutAnalyticsView()
    }
}
