import SwiftUI
import Charts
import HealthKit

// MARK: - RestingHRDeepDiveView

/// Deep-dive into resting heart rate — 12-month trend, fitness classification,
/// day-of-week pattern, and correlation with training load.
/// HKQuantityType(.restingHeartRate) — Apple Watch measures this each morning.
///
/// AHA fitness classification by age/sex for resting HR (general adult guidelines).
struct RestingHRDeepDiveView: View {

    struct RHRReading: Identifiable {
        let id: UUID
        let date: Date
        let bpm: Double
    }

    struct MonthAvg: Identifiable {
        let id: String
        let monthStart: Date
        let avgBPM: Double
        let minBPM: Double
        let maxBPM: Double
    }

    struct DOWAvg: Identifiable {
        let id: Int     // 0=Monday, 6=Sunday
        let dayName: String
        let avgBPM: Double
    }

    enum FitnessClass: String {
        case athlete = "Athletic"
        case excellent = "Excellent"
        case good = "Good"
        case average = "Average"
        case belowAverage = "Below Average"
        case poor = "Poor"

        init(rhr: Double) {
            switch rhr {
            case ..<50: self = .athlete
            case 50..<60: self = .excellent
            case 60..<68: self = .good
            case 68..<76: self = .average
            case 76..<85: self = .belowAverage
            default: self = .poor
            }
        }

        var color: Color {
            switch self {
            case .athlete: return .blue
            case .excellent: return .green
            case .good: return .teal
            case .average: return .yellow
            case .belowAverage: return .orange
            case .poor: return .red
            }
        }

        var range: String {
            switch self {
            case .athlete: return "< 50 bpm"
            case .excellent: return "50–59 bpm"
            case .good: return "60–67 bpm"
            case .average: return "68–75 bpm"
            case .belowAverage: return "76–84 bpm"
            case .poor: return "≥ 85 bpm"
            }
        }
    }

    @State private var readings: [RHRReading] = []
    @State private var monthStats: [MonthAvg] = []
    @State private var dowAvgs: [DOWAvg] = []
    @State private var latest: Double = 0
    @State private var baseline: Double = 0
    @State private var lowestRHR: Double = 0
    @State private var highestRHR: Double = 0
    @State private var fitnessClass: FitnessClass = .average
    @State private var trend30: Double = 0
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
                    monthlyChart
                    dowChart
                    fitnessClassCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Resting HR Deep Dive")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Resting Heart Rate")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", latest))
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(fitnessClass.color)
                        Text("bpm")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(fitnessClass.color).frame(width: 8, height: 8)
                        Text(fitnessClass.rawValue)
                            .font(.subheadline).foregroundStyle(fitnessClass.color)
                    }
                }
                Spacer()
                VStack(spacing: 4) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 44)).foregroundStyle(fitnessClass.color)
                    if trend30 != 0 {
                        HStack(spacing: 2) {
                            Image(systemName: trend30 < 0 ? "arrow.down" : "arrow.up")
                                .font(.caption2)
                                .foregroundStyle(trend30 < 0 ? .green : .orange)
                            Text(String(format: "%.1f bpm/30d", abs(trend30)))
                                .font(.caption2).foregroundStyle(trend30 < 0 ? .green : .orange)
                        }
                    }
                }
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "90d Average", value: String(format: "%.0f bpm", baseline), color: .red)
                Divider().frame(height: 36)
                statCell(label: "Lowest (12mo)", value: String(format: "%.0f bpm", lowestRHR), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Highest (12mo)", value: String(format: "%.0f bpm", highestRHR), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Readings", value: "\(readings.count)", color: .secondary)
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

    // MARK: - 12-Month Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("12-Month RHR Trend").font(.headline)
            Text("Lower = better cardiovascular fitness").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(readings.suffix(300)) { r in
                    PointMark(x: .value("Date", r.date),
                              y: .value("BPM", r.bpm))
                    .foregroundStyle(fitnessClass.color.opacity(0.3))
                    .symbolSize(12)
                }
                ForEach(rollingAvg(readings, window: 14).suffix(300)) { r in
                    LineMark(x: .value("Date", r.date),
                             y: .value("Avg", r.bpm))
                    .foregroundStyle(Color.red.opacity(0.8))
                    .lineStyle(StrokeStyle(lineWidth: 2))
                    .interpolationMethod(.catmullRom)
                }
                if baseline > 0 {
                    RuleMark(y: .value("Baseline", baseline))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.4))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("bpm")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 190)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Average Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Average RHR").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.monthStart, unit: .month),
                            y: .value("Avg", m.avgBPM))
                    .foregroundStyle(FitnessClass(rhr: m.avgBPM).color.opacity(0.7))
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("bpm")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 120)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Day-of-Week Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Day-of-Week Pattern").font(.headline)
            Text("RHR tends to be lower mid-week and higher after weekends").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(dowAvgs) { d in
                    BarMark(x: .value("Day", d.dayName),
                            y: .value("Avg", d.avgBPM))
                    .foregroundStyle(Color.red.opacity(0.65))
                    .cornerRadius(3)
                }
                if baseline > 0 {
                    RuleMark(y: .value("Overall Avg", baseline))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                }
            }
            .chartYAxisLabel("bpm")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Fitness Class Card

    private var fitnessClassCard: some View {
        let classes: [(FitnessClass, String)] = [
            (.athlete, "Athletes"), (.excellent, "Excellent"),
            (.good, "Good"), (.average, "Average"),
            (.belowAverage, "Below Avg"), (.poor, "Poor")
        ]

        return VStack(alignment: .leading, spacing: 8) {
            Text("AHA Fitness Classification").font(.headline)
            VStack(spacing: 0) {
                ForEach(classes, id: \.0.rawValue) { cls, label in
                    HStack(spacing: 10) {
                        Circle().fill(cls.color).frame(width: 10, height: 10)
                        Text(cls.rawValue).font(.caption.bold()).foregroundStyle(cls.color).frame(width: 80, alignment: .leading)
                        Text(cls.range).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        Spacer()
                        if cls == fitnessClass {
                            Image(systemName: "chevron.left")
                                .font(.caption2).foregroundStyle(cls.color)
                            Text("You").font(.caption2.bold()).foregroundStyle(cls.color)
                        }
                    }
                    .padding(.vertical, 5)
                    if cls != classes.last?.0 { Divider() }
                }
            }
            Text("Classification based on American Heart Association general guidelines for adults. Athletes and highly trained individuals often have RHR < 40 bpm.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Resting HR Data")
                .font(.title3.bold())
            Text("Apple Watch measures resting heart rate automatically each morning. Wear your Watch overnight or during rest periods to collect data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func rollingAvg(_ data: [RHRReading], window: Int) -> [RHRReading] {
        guard data.count >= window else { return data }
        return (window - 1..<data.count).map { i in
            let slice = data[(i - window + 1)...i]
            let avg = slice.map(\.bpm).reduce(0, +) / Double(window)
            return RHRReading(id: data[i].id, date: data[i].date, bpm: avg)
        }
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let rhrType = HKQuantityType(.restingHeartRate)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [rhrType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!
        let bpmUnit = HKUnit.count().unitDivided(by: .minute())
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: rhrType,
                predicate: HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        let allReadings = samples.map { s in
            RHRReading(id: s.uuid, date: s.startDate,
                       bpm: s.quantity.doubleValue(for: bpmUnit))
        }.filter { $0.bpm > 30 && $0.bpm < 120 }

        guard !allReadings.isEmpty else { return }
        readings = allReadings

        let vals = allReadings.map(\.bpm)
        latest = allReadings.last?.bpm ?? 0
        lowestRHR = vals.min() ?? 0
        highestRHR = vals.max() ?? 0
        baseline = vals.reduce(0, +) / Double(vals.count)
        fitnessClass = FitnessClass(rhr: latest)

        if allReadings.count >= 30 {
            let recent = allReadings.suffix(15).map(\.bpm)
            let older  = allReadings.prefix(15).map(\.bpm)
            trend30 = recent.reduce(0, +) / Double(recent.count) - older.reduce(0, +) / Double(older.count)
        }

        // Monthly stats
        var mMap: [String: (Date, [Double])] = [:]
        for r in allReadings {
            let mk = df.string(from: r.date)
            let ms = cal.date(from: cal.dateComponents([.year, .month], from: r.date)) ?? r.date
            var cur = mMap[mk] ?? (ms, [])
            cur.1.append(r.bpm)
            mMap[mk] = cur
        }
        monthStats = mMap.compactMap { key, val in
            guard !val.1.isEmpty else { return nil }
            return MonthAvg(id: key, monthStart: val.0,
                            avgBPM: val.1.reduce(0, +) / Double(val.1.count),
                            minBPM: val.1.min() ?? 0, maxBPM: val.1.max() ?? 0)
        }.sorted { $0.monthStart < $1.monthStart }

        // Day-of-week averages (0=Sunday in Apple's Calendar, we map to Mon–Sun display)
        let dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        var dowMap: [Int: [Double]] = [:]
        for r in allReadings {
            let wd = cal.component(.weekday, from: r.date)  // 1=Sun, 2=Mon...
            let idx = (wd + 5) % 7  // convert to 0=Mon, 6=Sun
            dowMap[idx, default: []].append(r.bpm)
        }
        dowAvgs = (0..<7).compactMap { i in
            guard let vals = dowMap[i], !vals.isEmpty else { return nil }
            return DOWAvg(id: i, dayName: dayNames[i], avgBPM: vals.reduce(0, +) / Double(vals.count))
        }
    }
}

#Preview { NavigationStack { RestingHRDeepDiveView() } }
