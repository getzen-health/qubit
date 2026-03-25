import SwiftUI
import Charts
import HealthKit

// MARK: - MindfulnessImpactView
// Shows how mindfulness sessions correlate with next-day HRV, RHR, and recovery.

struct MindfulnessImpactView: View {
    @State private var isLoading = true

    // Aggregated data
    @State private var totalSessions = 0
    @State private var totalMins = 0.0

    // Group averages
    @State private var avgHrvWith: Double?
    @State private var avgHrvWithout: Double?
    @State private var avgRhrWith: Double?
    @State private var avgRhrWithout: Double?
    @State private var avgRecWith: Double?
    @State private var avgRecWithout: Double?

    // Weekly volume (date string → minutes)
    @State private var weeklyMins: [(date: String, mins: Double)] = []

    // Scatter: session minutes → next-day HRV
    @State private var scatterPairs: [(mins: Double, hrv: Double)] = []

    private var hrvDiff: Double? {
        guard let w = avgHrvWith, let wo = avgHrvWithout else { return nil }
        return w - wo
    }
    private var rhrDiff: Double? {
        guard let w = avgRhrWith, let wo = avgRhrWithout else { return nil }
        return w - wo
    }
    private var recDiff: Double? {
        guard let w = avgRecWith, let wo = avgRecWithout else { return nil }
        return w - wo
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalSessions < 5 {
                    emptyState
                } else {
                    summaryCards
                    if avgHrvWith != nil || avgRhrWith != nil { comparisonCard }
                    if weeklyMins.count > 1 { weeklyChart }
                    if scatterPairs.count >= 5 { scatterCard }
                    disclaimer
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Mindfulness Impact")
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                NavigationLink(destination: MindfulnessPatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        let h = Int(totalMins / 60)
        let m = Int(totalMins) % 60
        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(title: "Sessions", value: "\(totalSessions)", sub: "last 90 days", color: .teal)
            statCard(title: "Total Time", value: "\(h)h \(m)m", sub: "mindfulness practice", color: .purple)
            if let diff = hrvDiff {
                let pos = diff > 0
                statCard(
                    title: "HRV Impact",
                    value: String(format: "%+.0f ms", diff),
                    sub: "next-day diff",
                    color: pos ? .green : .orange
                )
            }
            if let diff = rhrDiff {
                let pos = diff < 0
                statCard(
                    title: "RHR Impact",
                    value: String(format: "%+.0f bpm", diff),
                    sub: "next-day diff",
                    color: pos ? .green : .orange
                )
            }
        }
    }

    private func statCard(title: String, value: String, sub: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title2.bold())
                .foregroundStyle(color)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Comparison Card

    private var comparisonCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Next-Day Metrics")
                    .font(.headline)
                Text("After mindfulness vs. after no session")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let wm = avgHrvWith, let wo = avgHrvWithout {
                comparisonRow(
                    label: "HRV (ms) — higher is better",
                    withVal: wm,
                    withoutVal: wo,
                    higherIsBetter: true,
                    format: "%.0f ms"
                )
            }
            if let wm = avgRhrWith, let wo = avgRhrWithout {
                comparisonRow(
                    label: "Resting HR (bpm) — lower is better",
                    withVal: wm,
                    withoutVal: wo,
                    higherIsBetter: false,
                    format: "%.0f bpm"
                )
            }
            if let wm = avgRecWith, let wo = avgRecWithout {
                comparisonRow(
                    label: "Recovery Score (%)",
                    withVal: wm,
                    withoutVal: wo,
                    higherIsBetter: true,
                    format: "%.0f%%"
                )
            }

            Text("Correlation, not causation. Sleep and training load also affect these metrics.")
                .font(.caption2)
                .foregroundStyle(.secondary.opacity(0.7))
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func comparisonRow(
        label: String,
        withVal: Double,
        withoutVal: Double,
        higherIsBetter: Bool,
        format: String
    ) -> some View {
        let isBetter = higherIsBetter ? withVal >= withoutVal : withVal <= withoutVal
        let maxVal = max(withVal, withoutVal)
        let withFrac = maxVal > 0 ? withVal / maxVal : 0
        let withoutFrac = maxVal > 0 ? withoutVal / maxVal : 0

        return VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(spacing: 8) {
                // After mindfulness bar
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Circle().fill(Color.teal).frame(width: 8, height: 8)
                        Text("Mindfulness").font(.caption2).foregroundStyle(.secondary)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.teal.opacity(0.15)).frame(height: 8)
                            Capsule().fill(Color.teal).frame(width: geo.size.width * CGFloat(withFrac), height: 8)
                        }
                    }.frame(height: 8)
                    Text(String(format: format, withVal))
                        .font(.caption.monospacedDigit().bold())
                        .foregroundStyle(isBetter ? .teal : .orange)
                }

                // After no session bar
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Circle().fill(Color.secondary.opacity(0.5)).frame(width: 8, height: 8)
                        Text("No session").font(.caption2).foregroundStyle(.secondary)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.15)).frame(height: 8)
                            Capsule().fill(Color.secondary.opacity(0.5)).frame(width: geo.size.width * CGFloat(withoutFrac), height: 8)
                        }
                    }.frame(height: 8)
                    Text(String(format: format, withoutVal))
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Practice")
                .font(.headline)
                .padding(.horizontal, 4)
            Text("Minutes per week over last 90 days")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeklyMins, id: \.date) { entry in
                    BarMark(
                        x: .value("Week", shortWeek(entry.date)),
                        y: .value("Minutes", entry.mins)
                    )
                    .foregroundStyle(Color.teal.opacity(0.75))
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let s = val.as(String.self) { Text(s).font(.caption2) }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) { Text("\(Int(v))m").font(.caption2) }
                    }
                }
            }
            .frame(height: 150)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Scatter Card

    private var scatterCard: some View {
        let avgHrvLine = scatterPairs.map(\.hrv).reduce(0, +) / Double(scatterPairs.count)

        return VStack(alignment: .leading, spacing: 8) {
            Text("Session Length vs Next-Day HRV")
                .font(.headline)
                .padding(.horizontal, 4)
            Text("Each dot = one day. Does a longer session predict higher HRV?")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Avg HRV", avgHrvLine))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.teal.opacity(0.4))

                ForEach(Array(scatterPairs.enumerated()), id: \.offset) { _, pair in
                    PointMark(
                        x: .value("Minutes", pair.mins),
                        y: .value("HRV (ms)", pair.hrv)
                    )
                    .foregroundStyle(Color.teal.opacity(0.7))
                    .symbolSize(60)
                }
            }
            .chartXAxisLabel("Session minutes", position: .bottom)
            .chartYAxisLabel("Next-day HRV (ms)", position: .leading)
            .chartXAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) { Text("\(Int(v))m").font(.caption2) }
                    }
                }
            }
            .frame(height: 200)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 48))
                .foregroundStyle(.teal.opacity(0.7))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Complete at least 5 mindfulness sessions to see how they affect your next-day HRV, resting heart rate, and recovery.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Disclaimer

    private var disclaimer: some View {
        Text("\(totalSessions) mindfulness days analysed · 90-day window · Correlation analysis only")
            .font(.caption2)
            .foregroundStyle(.secondary.opacity(0.5))
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.bottom, 8)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        // 1. Fetch mindfulness sessions from HealthKit
        let sessions = (try? await HealthKitService.shared.fetchMindfulnessSessions(days: 90)) ?? []

        // 2. Aggregate minutes by calendar date
        let cal = Calendar.current
        var mindByDate: [String: Double] = [:]
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"

        for s in sessions {
            let dateKey = df.string(from: s.startDate)
            let mins = s.endDate.timeIntervalSince(s.startDate) / 60.0
            mindByDate[dateKey, default: 0] += mins
        }

        totalSessions = mindByDate.keys.count
        totalMins = mindByDate.values.reduce(0, +)

        // 3. Fetch daily summaries from Supabase
        guard let rows = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 90) else { return }
        let sorted = rows.sorted { $0.date < $1.date }

        // 4. Build day-pairs
        struct Pair {
            let date: String
            let minsMeditated: Double
            let hadMindfulness: Bool
            let nextHrv: Double?
            let nextRhr: Double?
            let nextRecovery: Double?
        }

        var pairs: [Pair] = []
        for (i, row) in sorted.enumerated() {
            let next = i + 1 < sorted.count ? sorted[i + 1] : nil
            let mins = mindByDate[row.date] ?? 0
            pairs.append(Pair(
                date: row.date,
                minsMeditated: mins,
                hadMindfulness: mins > 0,
                nextHrv: next?.avg_hrv,
                nextRhr: nil,
                nextRecovery: next?.recovery_score.map(Double.init)
            ))
        }
        let validPairs = pairs.filter { $0.nextHrv != nil || $0.nextRhr != nil }

        let withMind = validPairs.filter { $0.hadMindfulness }
        let withoutMind = validPairs.filter { !$0.hadMindfulness }

        func avgOf(_ arr: [Pair], _ key: (Pair) -> Double?) -> Double? {
            let vals = arr.compactMap(key).filter { $0 > 0 }
            return vals.isEmpty ? nil : vals.reduce(0, +) / Double(vals.count)
        }

        avgHrvWith    = avgOf(withMind,    { $0.nextHrv })
        avgHrvWithout = avgOf(withoutMind, { $0.nextHrv })
        avgRhrWith    = avgOf(withMind,    { $0.nextRhr })
        avgRhrWithout = avgOf(withoutMind, { $0.nextRhr })
        avgRecWith    = avgOf(withMind,    { $0.nextRecovery })
        avgRecWithout = avgOf(withoutMind, { $0.nextRecovery })

        // 5. Weekly buckets (ISO week starting Monday)
        var weekBuckets: [String: Double] = [:]
        for (date, mins) in mindByDate {
            guard let d = df.date(from: date) else { continue }
            var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d)
            comps.weekday = 2 // Monday
            let weekStart = cal.date(from: comps) ?? d
            let key = df.string(from: weekStart)
            weekBuckets[key, default: 0] += mins
        }
        weeklyMins = weekBuckets
            .sorted { $0.key < $1.key }
            .map { (date: $0.key, mins: $0.value) }

        // 6. Scatter data
        scatterPairs = validPairs
            .compactMap { r -> (mins: Double, hrv: Double)? in
                guard r.minsMeditated > 0, let hrv = r.nextHrv else { return nil }
                return (mins: r.minsMeditated, hrv: hrv)
            }
    }

    // MARK: - Helpers

    private func shortWeek(_ dateStr: String) -> String {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let out = DateFormatter()
        out.dateFormat = "MMM d"
        guard let d = df.date(from: dateStr) else { return dateStr }
        return out.string(from: d)
    }
}

#Preview {
    NavigationStack { MindfulnessImpactView() }
}
