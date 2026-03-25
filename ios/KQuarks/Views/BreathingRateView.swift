import SwiftUI
import Charts
import HealthKit

// MARK: - BreathingRateView

/// Deep-dive into respiratory rate — Apple Watch measures breathing rate during sleep
/// (HKQuantityType(.respiratoryRate)) via accelerometer motion analysis.
///
/// Normal adult resting respiratory rate: 12–20 breaths/min.
/// Elevated rate (>20) during sleep may indicate illness, overtraining, or respiratory issues.
/// Unusually low rate (<10) can indicate deep sedation or sleep apnea.
///
/// Key insight: Compare current rate vs 30-day baseline. Significant elevation
/// (>2 breaths above personal baseline) warrants attention.
struct BreathingRateView: View {

    struct RRReading: Identifiable {
        let id: UUID
        let date: Date
        let breathsPerMin: Double
    }

    struct WeekAvg: Identifiable {
        let id: String
        let weekStart: Date
        let avgRate: Double
        let minRate: Double
        let maxRate: Double
    }

    enum RRStatus: String {
        case low = "Below Normal"
        case normal = "Normal"
        case elevated = "Slightly Elevated"
        case high = "Elevated"

        init(bpm: Double, baseline: Double) {
            let delta = bpm - baseline
            if bpm < 10 { self = .low }
            else if delta < 1.5 { self = .normal }
            else if delta < 3.0 { self = .elevated }
            else { self = .high }
        }

        var color: Color {
            switch self {
            case .low: return .blue
            case .normal: return .green
            case .elevated: return .yellow
            case .high: return .orange
            }
        }
    }

    @State private var readings: [RRReading] = []
    @State private var weekAvgs: [WeekAvg] = []
    @State private var latest: Double = 0
    @State private var baseline: Double = 0
    @State private var minRate: Double = 0
    @State private var maxRate: Double = 0
    @State private var status: RRStatus = .normal
    @State private var daysElevated: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if readings.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    weeklyChart
                    guidelinesCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Breathing Rate")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latest Sleeping Rate")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", latest))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(status.color)
                        Text("br/min")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(status.color).frame(width: 8, height: 8)
                        Text(status.rawValue)
                            .font(.subheadline).foregroundStyle(status.color)
                    }
                }
                Spacer()
                Image(systemName: "wind")
                    .font(.system(size: 44)).foregroundStyle(status.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "30d Baseline", value: String(format: "%.1f br/min", baseline), color: .teal)
                Divider().frame(height: 36)
                statCell(label: "vs Baseline", value: String(format: "%+.1f", latest - baseline), color: latest - baseline > 2 ? .orange : .green)
                Divider().frame(height: 36)
                statCell(label: "Lowest (30d)", value: String(format: "%.1f", minRate), color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Highest (30d)", value: String(format: "%.1f", maxRate), color: maxRate > 20 ? .orange : .secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day Respiratory Rate Trend").font(.headline)
            Text("Nightly sleeping rate — measured via wrist motion analysis").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(readings.suffix(30)) { r in
                    LineMark(x: .value("Date", r.date),
                             y: .value("Rate", r.breathsPerMin))
                    .foregroundStyle(Color.teal.opacity(0.6))
                    .interpolationMethod(.catmullRom)
                }
                ForEach(readings.suffix(30)) { r in
                    PointMark(x: .value("Date", r.date),
                              y: .value("Rate", r.breathsPerMin))
                    .foregroundStyle(RRStatus(bpm: r.breathsPerMin, baseline: baseline).color)
                    .symbolSize(20)
                }
                if baseline > 0 {
                    RuleMark(y: .value("Baseline", baseline))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                        .annotation(position: .trailing, alignment: .center) {
                            Text("BL").font(.caption2).foregroundStyle(.secondary)
                        }
                }
                RuleMark(y: .value("Upper Normal", 20))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
                    .foregroundStyle(Color.orange.opacity(0.4))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("br/min")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 170)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Average").font(.headline)
            Chart {
                ForEach(weekAvgs) { w in
                    BarMark(x: .value("Week", w.weekStart, unit: .weekOfYear),
                            y: .value("Avg", w.avgRate))
                    .foregroundStyle(w.avgRate > 18 ? Color.orange.opacity(0.7) :
                                     w.avgRate > 16 ? Color.yellow.opacity(0.7) :
                                     Color.teal.opacity(0.7))
                    .cornerRadius(3)
                }
                if baseline > 0 {
                    RuleMark(y: .value("Baseline", baseline))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.4))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("br/min")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 120)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "wind").foregroundStyle(.teal)
                Text("What to Watch For").font(.headline)
            }
            VStack(alignment: .leading, spacing: 6) {
                guideRow(range: "< 10 br/min", desc: "Below normal — deep sedation, possible sleep apnea risk", color: .blue)
                guideRow(range: "12–16 br/min", desc: "Optimal resting rate — calm, efficient breathing", color: .green)
                guideRow(range: "16–20 br/min", desc: "Normal range — standard adult sleep rate", color: .teal)
                guideRow(range: "20–25 br/min", desc: "Slightly elevated — illness, alcohol, overtraining?", color: .yellow)
                guideRow(range: "> 25 br/min", desc: "Elevated — respiratory infection, fever, stress", color: .orange)
            }
            Divider()
            Text("⚠️ Consistent elevation >2 br/min above your personal baseline for 3+ consecutive nights is a meaningful signal — consider rest, recovery, and monitoring for illness symptoms.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Apple Watch measures respiratory rate via accelerometer motion analysis during sleep. Wrist motion correlates with breathing at ~90% accuracy vs clinical measurement.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.teal.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.teal.opacity(0.18), lineWidth: 1))
    }

    private func guideRow(range: String, desc: String, color: Color) -> some View {
        HStack(spacing: 10) {
            Text(range).font(.caption.bold().monospacedDigit()).foregroundStyle(color).frame(width: 80, alignment: .leading)
            Text(desc).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "wind")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Breathing Rate Data")
                .font(.title3.bold())
            Text("Respiratory rate is measured automatically by Apple Watch Series 3+ during sleep. Wear your Watch to bed to collect overnight breathing data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let rrType = HKQuantityType(.respiratoryRate)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [rrType])) != nil else { return }

        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let brUnit = HKUnit.count().unitDivided(by: .minute())
        var calMon = Calendar.current; calMon.firstWeekday = 2
        let df = DateFormatter(); df.dateFormat = "yyyy-'W'ww"

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: rrType,
                predicate: HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        readings = samples.map { s in
            RRReading(id: s.uuid, date: s.startDate,
                      breathsPerMin: s.quantity.doubleValue(for: brUnit))
        }.filter { $0.breathsPerMin >= 8 && $0.breathsPerMin <= 35 }

        guard !readings.isEmpty else { return }

        let vals = readings.map(\.breathsPerMin)
        latest = readings.last?.breathsPerMin ?? 0
        baseline = vals.reduce(0, +) / Double(vals.count)
        minRate = vals.min() ?? 0
        maxRate = vals.max() ?? 0
        status = RRStatus(bpm: latest, baseline: baseline)
        daysElevated = readings.filter { $0.breathsPerMin - baseline > 2 }.count

        // Week buckets
        var wMap: [String: (Date, [Double])] = [:]
        for r in readings {
            let comps = calMon.dateComponents([.yearForWeekOfYear, .weekOfYear], from: r.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = calMon.date(from: comps) ?? r.date
            var cur = wMap[key] ?? (ws, [])
            cur.1.append(r.breathsPerMin)
            wMap[key] = cur
        }
        weekAvgs = wMap.compactMap { key, val in
            guard !val.1.isEmpty else { return nil }
            return WeekAvg(id: key, weekStart: val.0,
                           avgRate: val.1.reduce(0, +) / Double(val.1.count),
                           minRate: val.1.min() ?? 0, maxRate: val.1.max() ?? 0)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview { NavigationStack { BreathingRateView() } }
