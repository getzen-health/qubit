import SwiftUI
import Charts

// MARK: - WeeklyReportView

/// Shows a digest comparing this week to last week across all key health metrics.
struct WeeklyReportView: View {
    @State private var report: WeeklyReport?
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if let report = report {
                    periodHeader(report)
                    overallCard(report)
                    comparisonGrid(report)
                    highlightsCard(report)
                    streaksCard(report)
                } else {
                    emptyState
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Weekly Report")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Period Header

    private func periodHeader(_ r: WeeklyReport) -> some View {
        VStack(spacing: 2) {
            Text(r.weekRangeLabel)
                .font(.subheadline.bold())
                .foregroundStyle(.primary)
            Text("vs \(r.lastWeekRangeLabel)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Overall Card

    private func overallCard(_ r: WeeklyReport) -> some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: r.overallTrend >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                    .foregroundStyle(r.overallTrend >= 0 ? .green : .orange)
                    .font(.title2)
                Text(r.overallSummary)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Comparison Grid

    private func comparisonGrid(_ r: WeeklyReport) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Key Metrics")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(r.comparisons) { comp in
                    ComparisonRow(item: comp)
                    if comp.id != r.comparisons.last?.id {
                        Divider().padding(.leading, 60)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Highlights Card

    private func highlightsCard(_ r: WeeklyReport) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Week Highlights")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 10) {
                ForEach(r.highlights) { h in
                    HStack(spacing: 12) {
                        Image(systemName: h.icon)
                            .foregroundStyle(h.color)
                            .frame(width: 32, height: 32)
                            .background(h.color.opacity(0.12))
                            .clipShape(Circle())
                        VStack(alignment: .leading, spacing: 2) {
                            Text(h.title)
                                .font(.subheadline.weight(.medium))
                            Text(h.subtitle)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical, 10)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Streaks Card

    private func streaksCard(_ r: WeeklyReport) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Consistency")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                StreakRow(
                    icon: "figure.walk",
                    color: .green,
                    label: "Days with goal steps",
                    value: "\(r.daysAtStepGoal)/7"
                )
                Divider().padding(.leading, 60)
                StreakRow(
                    icon: "moon.fill",
                    color: .indigo,
                    label: "Nights with 7+ hours sleep",
                    value: "\(r.nightsWith7hSleep)/7"
                )
                Divider().padding(.leading, 60)
                StreakRow(
                    icon: "figure.run",
                    color: .orange,
                    label: "Active workout days",
                    value: "\(r.workoutDays)/7"
                )
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Sync at least 2 weeks of data to see your weekly progress report.")
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

        guard let rows = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 14),
              rows.count >= 7 else { return }

        let sorted = rows.sorted { $0.date > $1.date }
        let thisWeek = Array(sorted.prefix(7))
        let lastWeek = Array(sorted.dropFirst(7).prefix(7))
        guard !lastWeek.isEmpty else { return }

        report = buildReport(thisWeek: thisWeek, lastWeek: lastWeek)
    }

    // MARK: - Report Builder

    private func buildReport(
        thisWeek: [SupabaseService.DailySummaryRow],
        lastWeek: [SupabaseService.DailySummaryRow]
    ) -> WeeklyReport {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let display = DateFormatter()
        display.dateFormat = "MMM d"

        let thisStart = thisWeek.last.flatMap { df.date(from: $0.date) } ?? Date()
        let thisEnd = thisWeek.first.flatMap { df.date(from: $0.date) } ?? Date()
        let lastStart = lastWeek.last.flatMap { df.date(from: $0.date) } ?? Date()
        let lastEnd = lastWeek.first.flatMap { df.date(from: $0.date) } ?? Date()

        let weekRange = "\(display.string(from: thisStart)) – \(display.string(from: thisEnd))"
        let lastWeekRange = "\(display.string(from: lastStart)) – \(display.string(from: lastEnd))"

        // Averages
        let avgSteps = avg(thisWeek.map { Double($0.steps) })
        let avgStepsLW = avg(lastWeek.map { Double($0.steps) })

        let avgSleep = avg(thisWeek.compactMap { $0.sleepHours })
        let avgSleepLW = avg(lastWeek.compactMap { $0.sleepHours })

        let avgHRV = avg(thisWeek.compactMap { $0.avg_hrv })
        let avgHRVLW = avg(lastWeek.compactMap { $0.avg_hrv })

        let avgRecovery = avg(thisWeek.compactMap { $0.recovery_score.map { Double($0) } })
        let avgRecoveryLW = avg(lastWeek.compactMap { $0.recovery_score.map { Double($0) } })

        let avgCal = avg(thisWeek.compactMap { $0.active_calories })
        let avgCalLW = avg(lastWeek.compactMap { $0.active_calories })

        var comparisons: [ComparisonItem] = []

        if let tw = avgSteps, let lw = avgStepsLW {
            comparisons.append(ComparisonItem(
                id: "steps", icon: "figure.walk", color: .green,
                label: "Avg Daily Steps",
                thisWeek: Int(tw).formatted(),
                lastWeek: Int(lw).formatted(),
                change: pct(tw, lw)
            ))
        }
        if let tw = avgSleep, let lw = avgSleepLW {
            comparisons.append(ComparisonItem(
                id: "sleep", icon: "moon.fill", color: .indigo,
                label: "Avg Sleep",
                thisWeek: fmtHours(tw),
                lastWeek: fmtHours(lw),
                change: pct(tw, lw)
            ))
        }
        if let tw = avgHRV, let lw = avgHRVLW {
            comparisons.append(ComparisonItem(
                id: "hrv", icon: "waveform.path.ecg", color: .purple,
                label: "Avg HRV",
                thisWeek: "\(Int(tw)) ms",
                lastWeek: "\(Int(lw)) ms",
                change: pct(tw, lw)
            ))
        }
        if let tw = avgRecovery, let lw = avgRecoveryLW {
            comparisons.append(ComparisonItem(
                id: "recovery", icon: "bolt.fill", color: .teal,
                label: "Avg Recovery",
                thisWeek: "\(Int(tw))%",
                lastWeek: "\(Int(lw))%",
                change: pct(tw, lw)
            ))
        }
        if let tw = avgCal, let lw = avgCalLW, tw > 0, lw > 0 {
            comparisons.append(ComparisonItem(
                id: "calories", icon: "flame.fill", color: .orange,
                label: "Avg Active Calories",
                thisWeek: "\(Int(tw)) kcal",
                lastWeek: "\(Int(lw)) kcal",
                change: pct(tw, lw)
            ))
        }

        // Overall trend: average of non-nil percentage changes
        let changes = comparisons.compactMap { $0.change }
        let overallTrend: Double = changes.isEmpty ? 0 : changes.reduce(0, +) / Double(changes.count)

        // Highlights
        var highlights: [Highlight] = []
        if let best = thisWeek.max(by: { $0.steps < $1.steps }), best.steps > 0 {
            highlights.append(Highlight(
                id: "steps",
                icon: "figure.walk", color: .green,
                title: "Best Step Day",
                subtitle: "\(best.steps.formatted()) steps · \(fmtDate(best.date, df: df))"
            ))
        }
        if let best = thisWeek.max(by: { ($0.avg_hrv ?? 0) < ($1.avg_hrv ?? 0) }),
           let hrv = best.avg_hrv, hrv > 0 {
            highlights.append(Highlight(
                id: "hrv",
                icon: "waveform.path.ecg", color: .purple,
                title: "Peak HRV",
                subtitle: "\(Int(hrv)) ms · \(fmtDate(best.date, df: df))"
            ))
        }
        if let best = thisWeek.compactMap({ r -> (Double, String)? in
            guard let h = r.sleepHours, h > 0 else { return nil }
            return (h, r.date)
        }).max(by: { $0.0 < $1.0 }) {
            highlights.append(Highlight(
                id: "sleep",
                icon: "moon.stars.fill", color: .indigo,
                title: "Best Sleep Night",
                subtitle: "\(fmtHours(best.0)) · \(fmtDate(best.1, df: df))"
            ))
        }

        // Consistency
        let stepGoal = GoalService.shared.stepsGoal
        let daysAtGoal = thisWeek.filter { Double($0.steps) >= stepGoal }.count
        let nightsWith7h = thisWeek.filter { ($0.sleepHours ?? 0) >= 7 }.count

        let overallSummary: String = {
            if overallTrend >= 10 {
                return "Excellent week! You're up across all key metrics."
            } else if overallTrend >= 0 {
                return "Solid week. Slight improvement over last week."
            } else if overallTrend >= -10 {
                return "A slightly quieter week. Small dip from last week."
            } else {
                return "Recovery week. Give your body time to rebuild."
            }
        }()

        return WeeklyReport(
            weekRangeLabel: weekRange,
            lastWeekRangeLabel: lastWeekRange,
            overallTrend: overallTrend,
            overallSummary: overallSummary,
            comparisons: comparisons,
            highlights: highlights,
            daysAtStepGoal: daysAtGoal,
            nightsWith7hSleep: nightsWith7h,
            workoutDays: 0 // populated from HealthKit if needed
        )
    }

    // MARK: - Helpers

    private func avg(_ values: [Double]) -> Double? {
        guard !values.isEmpty else { return nil }
        return values.reduce(0, +) / Double(values.count)
    }

    private func pct(_ current: Double, _ previous: Double) -> Double? {
        guard previous > 0 else { return nil }
        return ((current - previous) / previous) * 100
    }

    private func fmtHours(_ h: Double) -> String {
        let hours = Int(h)
        let mins = Int((h - Double(hours)) * 60)
        return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
    }

    private func fmtDate(_ dateStr: String, df: DateFormatter) -> String {
        guard let d = df.date(from: dateStr) else { return dateStr }
        let out = DateFormatter()
        out.dateFormat = "EEE, MMM d"
        return out.string(from: d)
    }
}

// MARK: - Comparison Row

private struct ComparisonRow: View {
    let item: ComparisonItem

    private var changeText: String {
        guard let c = item.change else { return "—" }
        return String(format: "%+.0f%%", c)
    }

    private var changeColor: Color {
        guard let c = item.change else { return .secondary }
        return c >= 0 ? .green : .orange
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.icon)
                .font(.subheadline)
                .foregroundStyle(item.color)
                .frame(width: 36, height: 36)
                .background(item.color.opacity(0.1))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(item.label)
                    .font(.subheadline.weight(.medium))
                Text("Was \(item.lastWeek)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(item.thisWeek)
                    .font(.subheadline.bold())
                Text(changeText)
                    .font(.caption.bold())
                    .foregroundStyle(changeColor)
            }
        }
        .padding()
    }
}

// MARK: - Streak Row

private struct StreakRow: View {
    let icon: String
    let color: Color
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundStyle(color)
                .frame(width: 36, height: 36)
                .background(color.opacity(0.1))
                .clipShape(Circle())
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
        }
        .padding()
    }
}

// MARK: - Models

struct WeeklyReport {
    let weekRangeLabel: String
    let lastWeekRangeLabel: String
    let overallTrend: Double
    let overallSummary: String
    let comparisons: [ComparisonItem]
    let highlights: [Highlight]
    let daysAtStepGoal: Int
    let nightsWith7hSleep: Int
    let workoutDays: Int
}

struct ComparisonItem: Identifiable {
    let id: String
    let icon: String
    let color: Color
    let label: String
    let thisWeek: String
    let lastWeek: String
    let change: Double?
}

struct Highlight: Identifiable {
    let id: String
    let icon: String
    let color: Color
    let title: String
    let subtitle: String
}

#Preview {
    NavigationStack {
        WeeklyReportView()
    }
}
