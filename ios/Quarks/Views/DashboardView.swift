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

                        // Sync button
                        Button {
                            Task {
                                await viewModel.sync()
                            }
                        } label: {
                            Image(systemName: viewModel.isSyncing ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                                .font(.title2)
                                .symbolEffect(.rotate, isActive: viewModel.isSyncing)
                        }
                        .disabled(viewModel.isSyncing)
                    }
                    .padding(.horizontal)

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
        }
    }
}

// MARK: - Activity Rings View

struct ActivityRingsView: View {
    let summary: TodayHealthSummary

    // Goals (could be user-configurable)
    let stepsGoal = 10000
    let caloriesGoal = 500.0
    let activeMinutesGoal = 30

    var body: some View {
        HStack(spacing: 24) {
            // Steps ring
            RingView(
                progress: Double(summary.steps) / Double(stepsGoal),
                color: .green,
                lineWidth: 12
            )
            .frame(width: 80, height: 80)
            .overlay {
                VStack(spacing: 0) {
                    Image(systemName: "figure.walk")
                        .font(.caption)
                    Text("\(Int(Double(summary.steps) / Double(stepsGoal) * 100))%")
                        .font(.caption.bold())
                }
                .foregroundColor(.green)
            }

            // Calories ring
            RingView(
                progress: summary.activeCalories / caloriesGoal,
                color: .orange,
                lineWidth: 12
            )
            .frame(width: 80, height: 80)
            .overlay {
                VStack(spacing: 0) {
                    Image(systemName: "flame.fill")
                        .font(.caption)
                    Text("\(Int(summary.activeCalories / caloriesGoal * 100))%")
                        .font(.caption.bold())
                }
                .foregroundColor(.orange)
            }

            Spacer()

            // Summary text
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(summary.steps)")
                    .font(.title2.bold())
                    .foregroundColor(.green)
                Text("of \(stepsGoal.formatted()) steps")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text("\(Int(summary.activeCalories))")
                    .font(.title2.bold())
                    .foregroundColor(.orange)
                Text("of \(Int(caloriesGoal)) cal")
                    .font(.caption)
                    .foregroundColor(.secondary)
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
class DashboardViewModel {
    var todaySummary: TodayHealthSummary?
    var isLoading = false
    var isSyncing = false
    var error: String?

    private let healthKit = HealthKitService.shared
    private let syncService = SyncService.shared

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
        }

        await syncService.performFullSync()

        await MainActor.run {
            isSyncing = false
        }

        // Reload data after sync
        await loadData()
    }
}

#Preview {
    DashboardView()
}
