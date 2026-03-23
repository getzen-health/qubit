import SwiftUI
import HealthKit
import Charts

// MARK: - WalkingAsymmetryView
// Tracks walking asymmetry percentage — the difference in timing between left and right steps.
// Automatically measured by iPhone/Apple Watch from iOS 14+.
// Low asymmetry = symmetrical gait = lower injury risk.
//
// Science:
//   Schmid et al. 2019 (Gait & Posture): walking asymmetry >5% associated with 2.5× higher
//     knee osteoarthritis risk; >10% indicates significant neuromuscular imbalance.
//   Zifchock et al. 2006 (Gait & Posture): bilateral asymmetry in runners correlates with
//     location of stress fractures and chronic musculoskeletal injuries.
//   Haugen et al. 2014 (JOSPT): reduced bilateral asymmetry (<5%) correlates with lower
//     injury incidence in team sport athletes.
//   Fukuchi et al. 2018 (J Biomech): age-related gait asymmetry can indicate early
//     neurological or orthopedic deterioration — a sensitive fall risk marker.
//
// Normal values: <2.5% = excellent, 2.5–5% = normal, 5–10% = mild asymmetry, >10% = concern.
// Apple captures this automatically from wrist motion during walks — no special protocol needed.

struct WalkingAsymmetryView: View {

    // MARK: - Models

    struct DayReading: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let pct: Double       // asymmetry %
        var level: AsymLevel {
            switch pct {
            case ..<2.5:  return .excellent
            case 2.5..<5: return .normal
            case 5..<10:  return .mild
            default:      return .significant
            }
        }
    }

    enum AsymLevel: String {
        case excellent   = "Excellent"
        case normal      = "Normal"
        case mild        = "Mild"
        case significant = "Significant"

        var color: Color {
            switch self {
            case .excellent:   return .green
            case .normal:      return .blue
            case .mild:        return .orange
            case .significant: return .red
            }
        }
    }

    // MARK: - State

    @State private var readings: [DayReading] = []
    @State private var avg30: Double = 0
    @State private var trend: Double = 0    // slope: % per week (negative = improving)
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Reading gait symmetry…")
                        .padding(.top, 60)
                } else if readings.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    asymmetryChart
                    histogramCard
                    riskCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Walking Asymmetry")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let latest = readings.last
        let level  = latest.map { AsymLevel(rawValue: $0.level.rawValue) ?? .normal } ?? .normal

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: latest.map { String(format: "%.1f%%", $0.pct) } ?? "—",
                    label: "Latest",
                    sub: latest?.level.rawValue ?? "—",
                    color: latest?.level.color ?? .secondary
                )
                Divider().frame(height: 44)
                statBox(
                    value: avg30 > 0 ? String(format: "%.1f%%", avg30) : "—",
                    label: "30-Day Avg",
                    sub: asymLevelForPct(avg30).rawValue,
                    color: asymLevelForPct(avg30).color
                )
                Divider().frame(height: 44)
                statBox(
                    value: trend != 0 ? String(format: "%+.2f%%/wk", trend) : "—",
                    label: "Trend",
                    sub: trend < -0.1 ? "Improving" : trend > 0.1 ? "Worsening" : "Stable",
                    color: trend < -0.1 ? .green : trend > 0.1 ? .red : .secondary
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: statusIcon(level))
                    .foregroundStyle(level.color)
                Text(statusMessage(avg30))
                    .font(.caption)
                    .foregroundStyle(level.color)
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statusIcon(_ level: AsymLevel) -> String {
        switch level {
        case .excellent:   return "checkmark.circle.fill"
        case .normal:      return "checkmark.circle"
        case .mild:        return "exclamationmark.circle"
        case .significant: return "exclamationmark.triangle.fill"
        }
    }

    private func statusMessage(_ pct: Double) -> String {
        switch asymLevelForPct(pct) {
        case .excellent:   return "Excellent bilateral symmetry — lower injury risk and efficient gait."
        case .normal:      return "Normal asymmetry range — no intervention needed."
        case .mild:        return "Mild asymmetry detected. Consider single-leg strength exercises to improve balance."
        case .significant: return "Significant asymmetry (>10%) — consult a physiotherapist; may indicate injury or neuromuscular imbalance."
        }
    }

    private func asymLevelForPct(_ pct: Double) -> AsymLevel {
        switch pct {
        case ..<2.5:  return .excellent
        case 2.5..<5: return .normal
        case 5..<10:  return .mild
        default:      return .significant
        }
    }

    // MARK: - Chart

    private var asymmetryChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Walking Asymmetry — 90 Days", systemImage: "figure.walk.motion")
                .font(.subheadline).bold()
            Text("Lower % = better bilateral symmetry. Target: <5%. Spikes may indicate acute injury, fatigue, or footwear issues.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(readings) { r in
                LineMark(
                    x: .value("Date", r.date),
                    y: .value("Asymmetry (%)", r.pct)
                )
                .foregroundStyle(Color.orange.gradient)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Date", r.date),
                    y: .value("Asymmetry (%)", r.pct)
                )
                .foregroundStyle(Color.orange.opacity(0.08))
                .interpolationMethod(.catmullRom)

                // 5% threshold
                RuleMark(y: .value("Normal upper", 5.0))
                    .foregroundStyle(Color.orange.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .annotation(position: .trailing, alignment: .leading) {
                        Text("5%").font(.caption2).foregroundStyle(.orange)
                    }

                // 10% concern threshold
                RuleMark(y: .value("Concern", 10.0))
                    .foregroundStyle(Color.red.opacity(0.4))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .annotation(position: .trailing, alignment: .leading) {
                        Text("10%").font(.caption2).foregroundStyle(.red)
                    }
            }
            .frame(height: 160)
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear, count: 2)) { _ in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .chartYScale(domain: 0...max(12, (readings.map(\.pct).max() ?? 0) + 2))
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Histogram

    private var histogramCard: some View {
        let bins: [(String, ClosedRange<Double>, Color)] = [
            ("0–2.5%", 0.0...2.5, .green),
            ("2.5–5%", 2.5...5.0, .blue),
            ("5–7.5%", 5.0...7.5, .orange),
            ("7.5–10%", 7.5...10.0, .orange),
            (">10%",  10.0...Double.greatestFiniteMagnitude, .red),
        ]
        let total = Double(readings.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Distribution of Days", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()

            ForEach(bins, id: \.0) { label, range, color in
                let count = Double(readings.filter { range.contains($0.pct) }.count)
                let pct   = total > 0 ? count / total * 100 : 0

                HStack {
                    Text(label).font(.caption2).frame(width: 52, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 12)
                            Capsule().fill(color.gradient).frame(width: geo.size.width * pct / 100, height: 12)
                        }
                    }
                    .frame(height: 12)
                    Text(String(format: "%.0f%%", pct))
                        .font(.caption2.bold()).foregroundStyle(color).frame(width: 32, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Risk Card

    private var riskCard: some View {
        let highDays = readings.filter { $0.pct > 10 }.count
        let mildDays = readings.filter { $0.pct > 5 }.count

        return VStack(alignment: .leading, spacing: 8) {
            Label("Injury Risk Context", systemImage: "cross.case.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)

            if highDays > 3 {
                Text("⚠️ \(highDays) day(s) with asymmetry >10% in the past 90 days. Significant asymmetry this frequent suggests a chronic issue — unilateral weakness, unresolved injury, or footwear mismatch.")
                    .font(.caption).foregroundStyle(.secondary)
            } else if mildDays > 10 {
                Text("Frequent mild asymmetry (>5%) on \(mildDays) days. Consider single-leg balance work, hip strengthening, or a gait analysis from a physio to address the imbalance.")
                    .font(.caption).foregroundStyle(.secondary)
            } else {
                Text("Asymmetry is within normal ranges on most days. Continue monitoring — spikes may correlate with specific activities, surfaces, or fatigue states.")
                    .font(.caption).foregroundStyle(.secondary)
            }

            if trend > 0.2 {
                Text("⚠️ Asymmetry is trending upward (+\(String(format: "%.2f", trend))%/week). Watch for upcoming injury — consider a planned rest or physio check-in.")
                    .font(.caption).foregroundStyle(.red)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Gait Asymmetry Science", systemImage: "figure.walk")
                .font(.subheadline).bold()
            Text("Apple Watch and iPhone passively measure walking asymmetry — the difference in timing between left and right steps during everyday walking. No treadmill or laboratory test required (iOS 14+, Apple Watch Series 4+).")
                .font(.caption).foregroundStyle(.secondary)
            Text("Schmid et al. 2019 (Gait & Posture): asymmetry >5% associated with 2.5× higher knee osteoarthritis risk. Haugen et al. 2014 (JOSPT): <5% asymmetry linked to lower injury incidence in athletes.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Fukuchi et al. 2018 (J Biomech): age-related gait asymmetry can be an early indicator of neurological deterioration — making it a sensitive marker for fall risk in older adults.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.walk.motion")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No asymmetry data")
                .font(.headline)
            Text("Walking asymmetry is recorded automatically by iPhone or Apple Watch (Series 4+, iOS 14+) during everyday walks. Walk outdoors with your device to start collecting data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal)
        }
        .padding(40)
    }

    // MARK: - Helpers

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let asymType = HKQuantityType(.walkingAsymmetryPercentage)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [asymType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .day, value: -90, to: end)!
        let interval = DateComponents(day: 1)
        let anchor = calendar.startOfDay(for: start)

        let collection: HKStatisticsCollection? = await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(
                quantityType: asymType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: end),
                options: .discreteAverage,
                anchorDate: anchor, intervalComponents: interval)
            q.initialResultsHandler = { _, results, _ in cont.resume(returning: results) }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        var result: [DayReading] = []
        collection?.enumerateStatistics(from: start, to: end) { stat, _ in
            guard let qty = stat.averageQuantity() else { return }
            let pct = qty.doubleValue(for: .percent()) * 100
            guard pct > 0 else { return }
            result.append(DayReading(date: stat.startDate, label: fmt.string(from: stat.startDate), pct: pct))
        }

        let avg = result.isEmpty ? 0.0 : result.map(\.pct).reduce(0, +) / Double(result.count)

        // Linear trend (slope of pct over time in days)
        let trendPerWeek: Double
        if result.count >= 7 {
            let xs = result.enumerated().map { Double($0.offset) }
            let ys = result.map(\.pct)
            let n  = Double(xs.count)
            let meanX = xs.reduce(0, +) / n; let meanY = ys.reduce(0, +) / n
            let num  = zip(xs, ys).map { ($0 - meanX) * ($1 - meanY) }.reduce(0, +)
            let den  = xs.map { pow($0 - meanX, 2) }.reduce(0, +)
            trendPerWeek = den == 0 ? 0 : (num / den) * 7  // convert days → weeks
        } else { trendPerWeek = 0 }

        DispatchQueue.main.async {
            self.readings  = result
            self.avg30     = avg
            self.trend     = trendPerWeek
            self.isLoading = false
        }
    }
}
