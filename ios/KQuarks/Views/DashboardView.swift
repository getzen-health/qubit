import SwiftUI

struct DashboardView: View {
    @State private var viewModel = DashboardViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Date header
                    HStack {
                        VStack(alignment: .leading) {
                            Text(Date(), style: .date)
                                .font(.headline)
                                .foregroundColor(.secondary)
                            Text("Today's Summary")
                                .font(.largeTitle.bold())
                        }
                        Spacer()

                        // Sync button + last sync time
                        VStack(alignment: .trailing, spacing: 4) {
                            Button {
                                Task {
                                    await viewModel.sync()
                                }
                            } label: {
                                Image(systemName: viewModel.isSyncing ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                                    .font(.title2)
                                    .rotationEffect(.degrees(viewModel.isSyncing ? 360 : 0))
                                    .animation(viewModel.isSyncing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: viewModel.isSyncing)
                            }
                            .disabled(viewModel.isSyncing)

                            if viewModel.isSyncing {
                                Text("Syncing…")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            } else if let last = viewModel.lastSyncDate {
                                Text(last, style: .relative)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal)

                    // Sync error banner
                    if let syncErr = viewModel.syncError {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                            Text(syncErr)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                            Spacer()
                            Button {
                                viewModel.syncError = nil
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(12)
                        .background(Color.orange.opacity(0.12))
                        .cornerRadius(10)
                        .padding(.horizontal)
                    }

                    if viewModel.isLoading {
                        ProgressView()
                            .padding(.top, 50)
                    } else if let summary = viewModel.todaySummary {
                        // Activity ring placeholder
                        ActivityRingsView(summary: summary)
                            .padding(.horizontal)

                        // Stats grid
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            StatCard(
                                title: "Steps",
                                value: "\(summary.steps.formatted())",
                                icon: "figure.walk",
                                color: .green
                            )

                            StatCard(
                                title: "Distance",
                                value: String(format: "%.1f km", summary.distanceKm),
                                icon: "map",
                                color: .blue
                            )

                            StatCard(
                                title: "Calories",
                                value: "\(Int(summary.activeCalories))",
                                icon: "flame.fill",
                                color: .orange
                            )

                            StatCard(
                                title: "Floors",
                                value: "\(summary.floorsClimbed)",
                                icon: "stairs",
                                color: .purple
                            )
                        }
                        .padding(.horizontal)

                        // Heart section
                        if summary.restingHeartRate != nil || summary.hrv != nil {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Heart")
                                    .font(.headline)
                                    .padding(.horizontal)

                                HStack(spacing: 16) {
                                    if let rhr = summary.restingHeartRate {
                                        StatCard(
                                            title: "Resting HR",
                                            value: "\(rhr) bpm",
                                            icon: "heart.fill",
                                            color: .red
                                        )
                                    }

                                    if let hrv = summary.hrv {
                                        StatCard(
                                            title: "HRV",
                                            value: "\(Int(hrv)) ms",
                                            icon: "waveform.path.ecg",
                                            color: .pink
                                        )
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }

                        // Sleep section
                        if let sleepFormatted = summary.formattedSleep {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Last Night's Sleep")
                                    .font(.headline)
                                    .padding(.horizontal)

                                StatCard(
                                    title: "Sleep Duration",
                                    value: sleepFormatted,
                                    icon: "moon.fill",
                                    color: .indigo,
                                    isWide: true
                                )
                                .padding(.horizontal)
                            }
                        }
                    } else if let error = viewModel.error {
                        VStack(spacing: 16) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.largeTitle)
                                .foregroundColor(.orange)

                            Text(error)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)

                            Button("Try Again") {
                                Task {
                                    await viewModel.loadData()
                                }
                            }
                        }
                        .padding(.top, 50)
                    }

                    Spacer(minLength: 100)
                }
                .padding(.top)
            }
            .refreshable {
                await viewModel.loadData()
            }
            .task {
                await viewModel.loadData()
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    HStack(spacing: 4) {
                        NavigationLink(destination: HealthScoreView()) {
                            Image(systemName: "chart.bar.doc.horizontal")
                        }
                        NavigationLink(destination: ReadinessView()) {
                            Image(systemName: "gauge.with.dots.needle.67percent")
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Activity Rings View

struct ActivityRingsView: View {
    let summary: TodayHealthSummary

    // Goals from user settings
    var stepsGoal: Int { Int(GoalService.shared.stepsGoal) }
    var caloriesGoal: Double { GoalService.shared.activeCaloriesGoal }
    var sleepGoalHours: Double { GoalService.shared.sleepGoalMinutes / 60 }

    private var sleepHours: Double { summary.sleepHours ?? 0 }
    private var sleepProgress: Double { sleepGoalHours > 0 ? sleepHours / sleepGoalHours : 0 }

    var body: some View {
        HStack(spacing: 16) {
            // Steps ring
            RingView(
                progress: Double(summary.steps) / Double(stepsGoal),
                color: .green,
                lineWidth: 11
            )
            .frame(width: 76, height: 76)
            .overlay {
                VStack(spacing: 0) {
                    Image(systemName: "figure.walk")
                        .font(.caption2)
                    Text("\(Int(Double(summary.steps) / Double(stepsGoal) * 100))%")
                        .font(.caption2.bold())
                }
                .foregroundColor(.green)
            }

            // Calories ring
            RingView(
                progress: summary.activeCalories / caloriesGoal,
                color: .orange,
                lineWidth: 11
            )
            .frame(width: 76, height: 76)
            .overlay {
                VStack(spacing: 0) {
                    Image(systemName: "flame.fill")
                        .font(.caption2)
                    Text("\(Int(summary.activeCalories / caloriesGoal * 100))%")
                        .font(.caption2.bold())
                }
                .foregroundColor(.orange)
            }

            // Sleep ring
            RingView(
                progress: sleepProgress,
                color: .indigo,
                lineWidth: 11
            )
            .frame(width: 76, height: 76)
            .overlay {
                VStack(spacing: 0) {
                    Image(systemName: "moon.fill")
                        .font(.caption2)
                    Text("\(Int(sleepProgress * 100))%")
                        .font(.caption2.bold())
                }
                .foregroundColor(.indigo)
            }

            Spacer()

            // Summary text
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(summary.steps)")
                    .font(.headline.bold())
                    .foregroundColor(.green)
                Text("of \(stepsGoal.formatted()) steps")
                    .font(.caption2)
                    .foregroundColor(.secondary)

                Text("\(Int(summary.activeCalories)) kcal")
                    .font(.headline.bold())
                    .foregroundColor(.orange)

                if sleepHours > 0 {
                    let h = Int(sleepHours)
                    let m = Int((sleepHours - Double(h)) * 60)
                    Text(m > 0 ? "\(h)h \(m)m sleep" : "\(h)h sleep")
                        .font(.headline.bold())
                        .foregroundColor(.indigo)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
}

struct RingView: View {
    let progress: Double
    let color: Color
    let lineWidth: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.2), lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: min(progress, 1.0))
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeOut, value: progress)
        }
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var isWide: Bool = false

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: icon)
                        .foregroundColor(color)
                    Text(title)
                        .foregroundColor(.secondary)
                }
                .font(.subheadline)

                Text(value)
                    .font(.title2.bold())
            }

            if isWide {
                Spacer()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

// MARK: - View Model

@Observable
@MainActor
class DashboardViewModel {
    var todaySummary: TodayHealthSummary?
    var isLoading = true
    var isSyncing = false
    var error: String?
    var lastSyncDate: Date?
    var syncError: String?

    private let healthKit = HealthKitService.shared
    private let syncService = SyncService.shared

    init() {
        lastSyncDate = syncService.lastSyncDate
    }

    func loadData() async {
        await MainActor.run {
            isLoading = true
            error = nil
        }

        do {
            let summary = try await healthKit.fetchTodaySummary()
            await MainActor.run {
                todaySummary = summary
                isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                isLoading = false
            }
        }
    }

    func sync() async {
        await MainActor.run {
            isSyncing = true
            syncError = nil
        }

        await syncService.performFullSync()

        await MainActor.run {
            isSyncing = false
            lastSyncDate = syncService.lastSyncDate
            if let err = syncService.syncError {
                syncError = err.localizedDescription
            }
        }

        // Reload data after sync
        await loadData()
    }
}

#Preview {
    DashboardView()
}
