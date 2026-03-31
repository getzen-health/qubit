import SwiftUI
import Charts

// MARK: - WellnessInsightsView
// Correlates daily check-in data (energy, mood, stress) with health metrics (HRV, sleep, steps, RHR).

struct WellnessInsightsView: View {
    @State private var records: [WellnessRecord] = []
    @State private var isLoading = true

    struct WellnessRecord: Identifiable {
        let id = UUID()
        let date: String
        let energy: Int?
        let mood: Int?
        let stress: Int?
        let hrv: Double?
        let rhr: Double?
        let sleepMinutes: Int?
        let steps: Int?
    }

    private let energyEmojis = ["", "😴", "😑", "😐", "🙂", "😄"]
    private let moodEmojis   = ["", "😞", "😕", "😐", "🙂", "😁"]
    private let stressEmojis = ["", "😌", "🙂", "😐", "😟", "😰"]

    private var withEnergy: [WellnessRecord] { records.filter { $0.energy != nil } }
    private var withMood: [WellnessRecord] { records.filter { $0.mood != nil } }
    private var withStress: [WellnessRecord] { records.filter { $0.stress != nil } }

    private func avg(_ values: [Double?]) -> Double? {
        let valid = values.compactMap { $0 }
        guard !valid.isEmpty else { return nil }
        return valid.reduce(0, +) / Double(valid.count)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if records.isEmpty {
                    emptyState
                } else if records.count < 7 {
                    insufficientDataView
                } else {
                    averagesCard
                    trendChart
                    correlationSection
                    recentLog
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Wellness Insights")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Averages

    private var averagesCard: some View {
        HStack(spacing: 0) {
            avgBubble("Energy",
                      value: avg(withEnergy.map { $0.energy.map(Double.init) }),
                      emojis: energyEmojis, color: .yellow)
            Divider().frame(height: 50)
            avgBubble("Mood",
                      value: avg(withMood.map { $0.mood.map(Double.init) }),
                      emojis: moodEmojis, color: .blue)
            Divider().frame(height: 50)
            avgBubble("Stress",
                      value: avg(withStress.map { $0.stress.map(Double.init) }),
                      emojis: stressEmojis, color: .orange)
        }
        .padding(.vertical, 8)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func avgBubble(_ label: String, value: Double?, emojis: [String], color: Color) -> some View {
        VStack(spacing: 4) {
            Text(label).font(.caption2).foregroundStyle(.secondary)
            if let v = value {
                let idx = min(max(Int(v.rounded()), 1), 5)
                Text(emojis[idx]).font(.title2)
                Text(String(format: "%.1f", v)).font(.caption.bold()).foregroundStyle(color)
            } else {
                Text("—").font(.title2).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        let data = records.suffix(21)
        let wellnessmax = 5

        return VStack(alignment: .leading, spacing: 8) {
            Text("Last 21 Days").font(.headline).padding(.horizontal, 4)
            Chart {
                ForEach(data) { r in
                    if let e = r.energy, let date = parseDate(r.date) {
                        LineMark(x: .value("Date", date), y: .value("Energy", Double(e)))
                            .foregroundStyle(.yellow)
                            .lineStyle(StrokeStyle(lineWidth: 2))
                    }
                    if let m = r.mood, let date = parseDate(r.date) {
                        LineMark(x: .value("Date", date), y: .value("Mood", Double(m)))
                            .foregroundStyle(.blue)
                            .lineStyle(StrokeStyle(lineWidth: 2))
                    }
                    if let s = r.stress, let date = parseDate(r.date) {
                        LineMark(x: .value("Date", date), y: .value("Stress", Double(s)))
                            .foregroundStyle(.orange)
                            .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
                    }
                }
                RuleMark(y: .value("Midpoint", 3)).foregroundStyle(.secondary.opacity(0.2))
            }
            .chartYScale(domain: 0...wellnessmax)
            .chartYAxis {
                AxisMarks(values: [1, 2, 3, 4, 5]) { _ in AxisValueLabel() }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 150)
            .padding(.horizontal, 4)

            HStack(spacing: 12) {
                Label("Energy", systemImage: "circle.fill").foregroundStyle(.yellow)
                Label("Mood", systemImage: "circle.fill").foregroundStyle(.blue)
                Label("Stress", systemImage: "circle.fill").foregroundStyle(.orange)
            }
            .font(.caption2).foregroundStyle(.secondary).padding(.horizontal, 4)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Correlation Section

    private var correlationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("How Health Affects How You Feel")
                .font(.headline)

            let correlationPairs: [(label: String, xKey: String, yKey: String, pairs: [(Double, Double)], invert: Bool)] = [
                ("Energy vs HRV",         "energy", "hrv",   makePairs(\.energy, \.hrv), false),
                ("Energy vs Sleep",        "energy", "sleep", makePairs(\.energy, { r in r.sleepMinutes.map { Double($0) } }), false),
                ("Mood vs HRV",           "mood",   "hrv",   makePairs(\.mood, \.hrv), false),
                ("Stress vs Resting HR",  "stress", "rhr",   makePairs(\.stress, \.rhr), true),
                ("Stress vs Sleep",       "stress", "sleep", makePairs(\.stress, { r in r.sleepMinutes.map { Double($0) } }), true),
            ]

            ForEach(correlationPairs.indices, id: \.self) { i in
                let cp = correlationPairs[i]
                if cp.pairs.count >= 5 {
                    let r = pearson(cp.pairs.map(\.0), cp.pairs.map(\.1))
                    let eff = cp.invert ? -r : r
                    if abs(r) >= 0.1 {
                        CorrRow(label: cp.label, r: r, effectiveR: eff, pairs: cp.pairs)
                    }
                }
            }
        }
    }

    private struct CorrRow: View {
        let label: String
        let r: Double
        let effectiveR: Double
        let pairs: [(Double, Double)]

        private var corrColor: Color {
            let abs = Swift.abs(effectiveR)
            if abs >= 0.5 { return effectiveR > 0 ? .green : .red }
            if abs >= 0.25 { return effectiveR > 0 ? .blue : .orange }
            return .secondary
        }

        private var corrLabel: String {
            let abs = Swift.abs(r)
            let dir = r >= 0 ? "positive" : "negative"
            if abs >= 0.5 { return "Strong \(dir)" }
            if abs >= 0.25 { return "Moderate \(dir)" }
            return "Weak \(dir)"
        }

        var body: some View {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(label).font(.subheadline.weight(.medium))
                    Spacer()
                    Text(String(format: "r = %.2f", r))
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(corrColor)
                }
                Text(corrLabel)
                    .font(.caption)
                    .foregroundStyle(corrColor)

                // Simple bar showing correlation direction
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color(.systemFill)).frame(height: 6)
                        Capsule().fill(corrColor)
                            .frame(width: geo.size.width * CGFloat(abs(r)), height: 6)
                    }
                }.frame(height: 6)
            }
            .padding(12)
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Recent Log

    private var recentLog: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Check-ins").font(.headline).padding(.horizontal, 4)

            VStack(spacing: 1) {
                ForEach(records.prefix(10)) { r in
                    HStack(spacing: 10) {
                        Text(shortDate(r.date))
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 50, alignment: .leading)

                        HStack(spacing: 6) {
                            if let e = r.energy { Text(energyEmojis[e]).font(.body) }
                            if let m = r.mood { Text(moodEmojis[m]).font(.body) }
                            if let s = r.stress { Text(stressEmojis[s]).font(.body) }
                        }
                        .frame(width: 60, alignment: .leading)

                        Spacer()
                        HStack(spacing: 8) {
                            if let h = r.hrv { Text(String(format: "%.0f ms", h)).font(.caption2).foregroundStyle(.secondary) }
                            if let s = r.sleepMinutes { Text(formatMin(s)).font(.caption2).foregroundStyle(.secondary) }
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    if r.id != records.prefix(10).last?.id {
                        Divider().padding(.leading, 8)
                    }
                }
            }
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Empty States

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "chart.line.text.clipboard").font(.system(size: 48)).foregroundStyle(.secondary)
            Text("No Check-in Data").font(.title3.bold())
            Text("Use the Daily Check-in to log your energy, mood, and stress. After at least 7 days you'll see how your physical health correlates with how you feel.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }.padding(.top, 60)
    }

    private var insufficientDataView: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.plus").font(.system(size: 48)).foregroundStyle(.secondary)
            Text("Keep Going!").font(.title3.bold())
            Text("You have \(records.count) check-in\(records.count == 1 ? "" : "s"). Log at least 7 days to see wellness correlations.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }.padding(.top, 60)
    }

    // MARK: - Helpers

    private func makePairs(_ getX: (WellnessRecord) -> Int?, _ getY: (WellnessRecord) -> Double?) -> [(Double, Double)] {
        records.compactMap { r in
            guard let x = getX(r), let y = getY(r), y > 0 else { return nil }
            return (Double(x), y)
        }
    }

    private func pearson(_ xs: [Double], _ ys: [Double]) -> Double {
        let n = Double(xs.count)
        guard n >= 3 else { return 0 }
        let mx = xs.reduce(0, +) / n
        let my = ys.reduce(0, +) / n
        let num = zip(xs, ys).reduce(0) { $0 + ($1.0 - mx) * ($1.1 - my) }
        let sdX = sqrt(xs.reduce(0) { $0 + ($1 - mx) * ($1 - mx) })
        let sdY = sqrt(ys.reduce(0) { $0 + ($1 - my) * ($1 - my) })
        guard sdX > 0, sdY > 0 else { return 0 }
        return num / (sdX * sdY)
    }

    private func parseDate(_ s: String) -> Date? {
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        return df.date(from: s)
    }

    private func shortDate(_ s: String) -> String {
        guard let d = parseDate(s) else { return s }
        let df = DateFormatter(); df.dateFormat = "MMM d"
        return df.string(from: d)
    }

    private func formatMin(_ m: Int) -> String {
        let h = m / 60; let min = m % 60
        return h > 0 ? "\(h)h \(min)m" : "\(min)m"
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let data = try? await SupabaseService.shared.fetchWellnessInsightsData() else { return }
        records = data.map { item in
            WellnessRecord(
                date: item.date,
                energy: item.energy,
                mood: item.mood,
                stress: item.stress,
                hrv: item.avgHrv,
                rhr: item.restingHeartRate,
                sleepMinutes: item.sleepDurationMinutes,
                steps: item.steps
            )
        }
        .sorted { $0.date > $1.date }
    }
}

#Preview {
    NavigationStack { WellnessInsightsView() }
}
