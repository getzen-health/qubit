import SwiftUI
import Charts
import HealthKit

// MARK: - RunningProgressionView
// 12-month pace trend, monthly volume, quarterly breakdown, and pace improvement analysis.

struct RunningProgressionView: View {
    @State private var isLoading = false
    @State private var runs: [RunEntry] = []
    @State private var months: [MonthEntry] = []
    @State private var quarters: [QuarterEntry] = []

    // Scalars
    @State private var totalDistKm: Double = 0
    @State private var totalSessions = 0
    @State private var bestPaceEntry: RunEntry?
    @State private var longestEntry: RunEntry?
    @State private var avgPaceFirstSecs: Double?
    @State private var avgPaceLastSecs: Double?
    @State private var slopeSecsPerRun: Double = 0  // negative = getting faster

    struct RunEntry: Identifiable {
        let id = UUID()
        let date: Date
        let distKm: Double
        let durationMins: Int
        let paceSecsPerKm: Double
        let trendPaceSecs: Double  // from linear regression

        var formattedPace: String { Self.formatPace(paceSecsPerKm) }

        static func formatPace(_ secs: Double) -> String {
            guard secs > 0 else { return "—" }
            let min = Int(secs / 60)
            let sec = Int(secs) % 60
            return String(format: "%d:%02d /km", min, sec)
        }
    }

    struct MonthEntry: Identifiable {
        let id: Int  // 0-11
        let label: String
        let distKm: Double
        let sessions: Int
        let avgPaceSecs: Double
    }

    struct QuarterEntry: Identifiable {
        let id: String
        let label: String
        let distKm: Double
        let sessions: Int
        let avgPaceSecs: Double
    }

    private static let monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    private var improving: Bool { slopeSecsPerRun < 0 }
    private var pctImprovement: Int? {
        guard let f = avgPaceFirstSecs, let l = avgPaceLastSecs, f > 0 else { return nil }
        return Int(((f - l) / f) * 100)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalSessions < 3 {
                    emptyState
                } else {
                    summaryCards
                    paceTrendChart
                    monthlyVolumeChart
                    if quarters.count >= 2 { quarterlyCard }
                    paceComparisonCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Running Progression")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(title: "Distance", value: String(format: "%.0f km", totalDistKm), sub: "last 12 months", color: .orange)
            statCard(title: "Runs", value: "\(totalSessions)", sub: "logged sessions", color: .blue)
            if let pct = pctImprovement {
                statCard(
                    title: "Pace Change",
                    value: String(format: "%+d%%", pct),
                    sub: improving ? "faster" : "slower",
                    color: improving ? .green : .orange
                )
            }
            if let best = longestEntry {
                statCard(title: "Longest Run", value: String(format: "%.1f km", best.distKm), sub: shortDate(best.date), color: .purple)
            }
        }
    }

    private func statCard(title: String, value: String, sub: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2.bold()).foregroundStyle(color)
            Text(sub).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Pace Trend Chart

    private var paceTrendChart: some View {
        let validRuns = runs.filter { $0.paceSecsPerKm > 0 }
        guard !validRuns.isEmpty else { return AnyView(EmptyView()) }

        let minPace = validRuns.map(\.paceSecsPerKm).min() ?? 200
        let maxPace = validRuns.map(\.paceSecsPerKm).max() ?? 500

        let df = DateFormatter()
        df.dateFormat = "MMM d"

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Pace Progression").font(.headline).padding(.horizontal, 4)
            Text("Each dot = one run. Dashed line = trend (lower = faster)")
                .font(.caption).foregroundStyle(.secondary).padding(.horizontal, 4)

            Chart {
                // Actual run points
                ForEach(validRuns) { r in
                    PointMark(
                        x: .value("Date", r.date),
                        y: .value("Pace", r.paceSecsPerKm)
                    )
                    .foregroundStyle(Color.orange.opacity(0.7))
                    .symbolSize(50)
                }
                // Trend line
                ForEach(validRuns) { r in
                    LineMark(
                        x: .value("Date", r.date),
                        y: .value("Trend", r.trendPaceSecs)
                    )
                    .foregroundStyle(Color.orange.opacity(0.35))
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 3]))
                    .interpolationMethod(.linear)
                }
            }
            .chartYScale(domain: (minPace * 0.9)...(maxPace * 1.05))
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            Text(RunEntry.formatPace(v)).font(.caption2)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("← faster", position: .topLeading)
            .frame(height: 200)

            if improving {
                Label(
                    String(format: "Trend: %.0f sec/km faster per run on average", abs(slopeSecsPerRun * Double(totalSessions))),
                    systemImage: "arrow.down.right"
                )
                .font(.caption2)
                .foregroundStyle(.green)
                .padding(.horizontal, 4)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16)))
    }

    // MARK: - Monthly Volume Chart

    private var monthlyVolumeChart: some View {
        let validMonths = months.filter { $0.distKm > 0 }
        guard validMonths.count >= 2 else { return AnyView(EmptyView()) }
        let maxDist = validMonths.map(\.distKm).max() ?? 1

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Volume").font(.headline).padding(.horizontal, 4)
            Text("Distance per month").font(.caption).foregroundStyle(.secondary).padding(.horizontal, 4)

            Chart {
                ForEach(validMonths) { m in
                    BarMark(
                        x: .value("Month", m.label),
                        y: .value("km", m.distKm)
                    )
                    .foregroundStyle(Color.orange.opacity(0.7))
                    .cornerRadius(4)
                    .annotation(position: .top) {
                        if m.distKm == validMonths.map(\.distKm).max() {
                            Text("🏆").font(.caption2)
                        }
                    }
                }
            }
            .chartYScale(domain: 0...(maxDist * 1.25))
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) { Text("\(Int(v))km").font(.caption2) }
                    }
                }
            }
            .frame(height: 150)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16)))
    }

    // MARK: - Quarterly Card

    private var quarterlyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quarterly Breakdown").font(.headline)
            Text("Training volume and avg pace per quarter").font(.caption).foregroundStyle(.secondary)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: min(quarters.count, 4)), spacing: 8) {
                ForEach(quarters) { q in
                    VStack(spacing: 4) {
                        Text(q.label).font(.caption2.bold()).foregroundStyle(.secondary)
                        Text(String(format: "%.0f km", q.distKm)).font(.subheadline.bold()).foregroundStyle(.orange)
                        Text("\(q.sessions) runs").font(.caption2).foregroundStyle(.secondary)
                        if q.avgPaceSecs > 0 {
                            Text(RunEntry.formatPace(q.avgPaceSecs)).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity)
                    .background(Color(.systemFill))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Pace Comparison Card

    private var paceComparisonCard: some View {
        guard let first = avgPaceFirstSecs, let last = avgPaceLastSecs else {
            return AnyView(EmptyView())
        }

        return AnyView(VStack(alignment: .leading, spacing: 12) {
            Text("Pace Comparison").font(.headline)
            Text("Early period vs. recent period average pace").font(.caption).foregroundStyle(.secondary)

            HStack(spacing: 12) {
                VStack(spacing: 4) {
                    Text("Early period").font(.caption).foregroundStyle(.secondary)
                    Text(RunEntry.formatPace(first)).font(.title3.bold())
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color(.systemFill))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                VStack(spacing: 4) {
                    Text("Recent period").font(.caption).foregroundStyle(.secondary)
                    Text(RunEntry.formatPace(last))
                        .font(.title3.bold())
                        .foregroundStyle(improving ? .green : .orange)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(improving ? Color.green.opacity(0.1) : Color(.systemFill))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(improving ? Color.green.opacity(0.3) : Color.clear, lineWidth: 1)
                )
            }

            if let pct = pctImprovement {
                HStack(spacing: 6) {
                    Image(systemName: improving ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                        .foregroundStyle(improving ? .green : .orange)
                    Text(improving
                         ? "Running \(abs(pct))% faster than your early runs in this period"
                         : "Pace has slowed \(abs(pct))% — more easy runs or recovery may help")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16)))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.run.circle")
                .font(.system(size: 48))
                .foregroundStyle(.orange.opacity(0.7))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Log at least 3 runs to see your pace progression and training volume over time.")
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

        let hk = HealthKitService.shared
        let cal = Calendar.current
        let oneYearAgo = cal.date(byAdding: .year, value: -1, to: Date())!

        // Fetch running workouts from HealthKit
        let allSamples = (try? await hk.fetchWorkouts(from: oneYearAgo, to: Date())) ?? []
        let samples = allSamples.filter { $0.workoutActivityType == .running }
        let rawRuns = samples.compactMap { w -> (date: Date, distKm: Double, durationMins: Int, paceSecsPerKm: Double)? in
            let km = w.totalDistance?.doubleValue(for: HKUnit.meterUnit(with: .kilo)) ?? 0
            guard km > 0.5 else { return nil }
            let mins = Int(w.duration / 60)
            let pace = km > 0 ? w.duration / km : 0  // secs per km
            guard pace > 120, pace < 900 else { return nil }
            return (date: w.startDate, distKm: km, durationMins: mins, paceSecsPerKm: pace)
        }
        .sorted { $0.date < $1.date }

        guard !rawRuns.isEmpty else { return }

        // Linear regression on pace
        func linReg(_ ys: [Double]) -> (slope: Double, intercept: Double) {
            let n = Double(ys.count)
            guard n >= 2 else { return (slope: 0, intercept: ys.first ?? 0) }
            let xs = (0..<ys.count).map { Double($0) }
            let mx = (n - 1) / 2
            let my = ys.reduce(0, +) / n
            let slope = zip(xs, ys).reduce(0) { $0 + ($1.0 - mx) * ($1.1 - my) } /
                xs.reduce(0) { $0 + ($1 - mx) * ($1 - mx) }
            return (slope: slope, intercept: my - slope * mx)
        }

        let paces = rawRuns.map { $0.paceSecsPerKm }
        let (slope, intercept) = linReg(paces)
        slopeSecsPerRun = slope

        runs = rawRuns.enumerated().map { i, r in
            RunEntry(
                date: r.date,
                distKm: r.distKm,
                durationMins: r.durationMins,
                paceSecsPerKm: r.paceSecsPerKm,
                trendPaceSecs: intercept + slope * Double(i)
            )
        }

        totalSessions = runs.count
        totalDistKm = runs.reduce(0) { $0 + $1.distKm }
        longestEntry = runs.max(by: { $0.distKm < $1.distKm })
        bestPaceEntry = runs.filter { $0.distKm >= 1 }.min(by: { $0.paceSecsPerKm < $1.paceSecsPerKm })

        // First / last quarter of runs for pace comparison
        let quartLen = max(3, totalSessions / 4)
        let firstRuns = Array(runs.prefix(quartLen))
        let lastRuns  = Array(runs.suffix(quartLen))
        avgPaceFirstSecs = firstRuns.isEmpty ? nil : firstRuns.map(\.paceSecsPerKm).reduce(0, +) / Double(firstRuns.count)
        avgPaceLastSecs  = lastRuns.isEmpty  ? nil : lastRuns.map(\.paceSecsPerKm).reduce(0, +) / Double(lastRuns.count)

        // Monthly buckets
        var monthMap: [Int: (dist: Double, paces: [Double], sessions: Int)] = [:]
        for r in runs {
            let month = cal.component(.month, from: r.date) - 1  // 0-11
            var m = monthMap[month] ?? (dist: 0, paces: [], sessions: 0)
            m.dist += r.distKm
            m.paces.append(r.paceSecsPerKm)
            m.sessions += 1
            monthMap[month] = m
        }
        months = (0..<12).compactMap { i in
            guard let m = monthMap[i], m.sessions > 0 else { return nil }
            return MonthEntry(
                id: i,
                label: Self.monthLabels[i],
                distKm: m.dist,
                sessions: m.sessions,
                avgPaceSecs: m.paces.reduce(0, +) / Double(m.paces.count)
            )
        }

        // Quarterly buckets
        var quarterMap: [String: (dist: Double, paces: [Double], sessions: Int)] = [:]
        for r in runs {
            let month = cal.component(.month, from: r.date)  // 1-12
            let year  = cal.component(.year, from: r.date)
            let q     = "\(year) Q\((month - 1) / 3 + 1)"
            var qd = quarterMap[q] ?? (dist: 0, paces: [], sessions: 0)
            qd.dist += r.distKm
            qd.paces.append(r.paceSecsPerKm)
            qd.sessions += 1
            quarterMap[q] = qd
        }
        quarters = quarterMap.sorted { $0.key < $1.key }.map { key, qd in
            QuarterEntry(
                id: key,
                label: String(key.suffix(2)),  // "Q1", "Q2", etc.
                distKm: qd.dist,
                sessions: qd.sessions,
                avgPaceSecs: qd.paces.isEmpty ? 0 : qd.paces.reduce(0, +) / Double(qd.paces.count)
            )
        }
    }

    // MARK: - Helpers

    private func shortDate(_ date: Date) -> String {
        let df = DateFormatter()
        df.dateFormat = "MMM d"
        return df.string(from: date)
    }
}

#Preview {
    NavigationStack { RunningProgressionView() }
}
