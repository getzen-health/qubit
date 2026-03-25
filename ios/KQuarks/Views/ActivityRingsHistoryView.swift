import SwiftUI
import Charts
import HealthKit

// MARK: - ActivityRingsHistoryView

/// Shows Apple Watch ring close history over the past 30 days.
/// Tracks Move (calories), Exercise (minutes), and Stand (hours) ring completion.
struct ActivityRingsHistoryView: View {
    @State private var days: [RingDay] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    struct RingDay: Identifiable {
        let id = UUID()
        let date: Date
        let moveFraction: Double   // 0–1+ (> 1 = exceeded)
        let exerciseFraction: Double
        let standFraction: Double

        var movePercent: Int { Int(moveFraction * 100) }
        var exercisePercent: Int { Int(exerciseFraction * 100) }
        var standPercent: Int { Int(standFraction * 100) }

        var moveClosed: Bool { moveFraction >= 1 }
        var exerciseClosed: Bool { exerciseFraction >= 1 }
        var standClosed: Bool { standFraction >= 1 }

        var allClosed: Bool { moveClosed && exerciseClosed && standClosed }
    }

    private var perfectDays: Int { days.filter(\.allClosed).count }
    private var moveStreak: Int { streak(for: \.moveClosed) }
    private var allRingsStreak: Int { streak(for: \.allClosed) }

    private var avgMove: Double {
        guard !days.isEmpty else { return 0 }
        return days.map(\.moveFraction).reduce(0, +) / Double(days.count) * 100
    }

    private func streak(for keyPath: KeyPath<RingDay, Bool>) -> Int {
        var count = 0
        for day in days.reversed() {
            if day[keyPath: keyPath] { count += 1 } else { break }
        }
        return count
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if days.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    calendarGrid
                    trendChart
                    streakCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Activity Rings")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Ring Completions")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(perfectDays)")
                        .font(.system(size: 52, weight: .bold, design: .rounded))
                        .foregroundStyle(.green)
                    Text("perfect days (all 3 rings)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f%%", avgMove))
                            .font(.title3.bold())
                        Text("avg move ring")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if allRingsStreak > 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "flame.fill")
                                .foregroundStyle(.orange)
                            Text("\(allRingsStreak) day streak")
                                .font(.caption.bold())
                        }
                    }
                }
            }

            HStack(spacing: 0) {
                ringBubble(
                    label: "Move",
                    pct: days.filter(\.moveClosed).count,
                    total: days.count,
                    color: .red
                )
                Divider().frame(height: 44)
                ringBubble(
                    label: "Exercise",
                    pct: days.filter(\.exerciseClosed).count,
                    total: days.count,
                    color: .green
                )
                Divider().frame(height: 44)
                ringBubble(
                    label: "Stand",
                    pct: days.filter(\.standClosed).count,
                    total: days.count,
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func ringBubble(label: String, pct: Int, total: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            Text("\(pct)/\(total)")
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label + " closed")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Calendar Grid

    private var calendarGrid: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day Ring Calendar")
                .font(.headline)
                .padding(.horizontal, 4)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4) {
                ForEach(days.suffix(35)) { day in
                    RingDayCell(day: day)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            // Legend
            HStack(spacing: 16) {
                legendItem(color: .green, label: "All rings")
                legendItem(color: .yellow, label: "Partial")
                legendItem(color: Color(.systemFill), label: "None")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 4)
        }
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 3)
                .fill(color)
                .frame(width: 14, height: 14)
            Text(label)
        }
    }

    // MARK: - Trend Chart

    private var trendchartmax: Double {
        let maxValue = days.flatMap { [$0.moveFraction, $0.exerciseFraction, $0.standFraction] }.max().map { $0 * 100 } ?? 0
        return max(110.0, maxValue + 10)
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Ring Completion Trends")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(Array(days.enumerated()), id: \.offset) { _, day in
                    LineMark(
                        x: .value("Date", day.date),
                        y: .value("Move %", min(day.moveFraction * 100, 100))
                    )
                    .foregroundStyle(.red.opacity(0.8))
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: 1.5))
                }
                ForEach(Array(days.enumerated()), id: \.offset) { _, day in
                    LineMark(
                        x: .value("Date", day.date),
                        y: .value("Exercise %", min(day.exerciseFraction * 100, 100))
                    )
                    .foregroundStyle(.green.opacity(0.8))
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: 1.5))
                }
                ForEach(Array(days.enumerated()), id: \.offset) { _, day in
                    LineMark(
                        x: .value("Date", day.date),
                        y: .value("Stand %", min(day.standFraction * 100, 100))
                    )
                    .foregroundStyle(.blue.opacity(0.8))
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: 1.5))
                }
                RuleMark(y: .value("Goal", 100))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.secondary.opacity(0.5))
            }
            .chartYScale(domain: 0...trendchartmax)
            .chartYAxisLabel("%")
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 160)

            // Legend
            HStack(spacing: 16) {
                legendLine(color: .red, label: "Move")
                legendLine(color: .green, label: "Exercise")
                legendLine(color: .blue, label: "Stand")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func legendLine(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 1).fill(color).frame(width: 16, height: 3)
            Text(label)
        }
    }

    // MARK: - Streak Card

    private var streakCard: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                streakBubble(label: "All-rings streak", value: allRingsStreak, icon: "3.circle.fill", color: .green)
                Divider().frame(height: 40)
                streakBubble(label: "Move streak", value: moveStreak, icon: "flame.fill", color: .red)
                Divider().frame(height: 40)
                streakBubble(label: "Perfect days", value: perfectDays, icon: "star.fill", color: .yellow)
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func streakBubble(label: String, value: Int, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.title3)
            Text("\(value)")
                .font(.title2.bold())
                .foregroundStyle(value > 0 ? color : .secondary)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "rays")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Ring Data")
                .font(.title3.bold())
            Text("Activity ring data requires Apple Watch. Make sure your Watch is paired and you're wearing it regularly.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        let start = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let summaries = (try? await healthKit.fetchActivitySummaries(from: start, to: Date())) ?? []
        days = summaries.compactMap { summary -> RingDay? in
            guard let date = summary.dateComponents(for: .current).date else { return nil }
            let energyBurned = summary.activeEnergyBurned.doubleValue(for: .kilocalorie())
            let energyGoal = summary.activeEnergyBurnedGoal.doubleValue(for: .kilocalorie())
            let exerciseMins = summary.appleExerciseTime.doubleValue(for: .minute())
            let exerciseGoal = summary.appleExerciseTimeGoal.doubleValue(for: .minute())
            let standHours = Double(summary.appleStandHours.doubleValue(for: .count()))
            let standGoal = Double(summary.appleStandHoursGoal.doubleValue(for: .count()))

            return RingDay(
                date: date,
                moveFraction: energyGoal > 0 ? energyBurned / energyGoal : 0,
                exerciseFraction: exerciseGoal > 0 ? exerciseMins / exerciseGoal : 0,
                standFraction: standGoal > 0 ? standHours / standGoal : 0
            )
        }.sorted { $0.date < $1.date }
    }
}

// MARK: - Ring Day Cell

struct RingDayCell: View {
    let day: ActivityRingsHistoryView.RingDay

    private var bgColor: Color {
        if day.allClosed { return .green }
        let count = [day.moveClosed, day.exerciseClosed, day.standClosed].filter { $0 }.count
        if count >= 2 { return .yellow }
        if count >= 1 { return .orange.opacity(0.5) }
        return Color(.systemFill)
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 5)
                .fill(bgColor.opacity(0.8))
                .aspectRatio(1, contentMode: .fit)

            Text(day.date.formatted(.dateTime.day()))
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(day.allClosed ? .white : .primary)
        }
    }
}

#Preview {
    NavigationStack {
        ActivityRingsHistoryView()
    }
}
