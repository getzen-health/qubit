import SwiftUI
import Charts
import HealthKit

// MARK: - StairSpeedView

/// Tracks stair ascent and descent speed from iPhone accelerometer.
/// HKQuantityType(.stairAscentSpeed) and HKQuantityType(.stairDescentSpeed)
/// — measured in metres per second (m/s).
///
/// Available on iPhone 8+ (iOS 14+) without requiring Apple Watch.
/// iPhone captures stair climbing speed passively as you carry it.
///
/// Clinical reference ranges (30–60 year old healthy adults):
/// - Ascent: 0.5–0.7 m/s typical; >0.8 m/s = excellent; <0.4 m/s = flag for weakness
/// - Descent: typically 5–15% faster than ascent
///
/// Evidence:
/// - Stair ascent speed < 0.5 m/s predicts 2.5× higher fall risk in older adults
///   (Landi et al., J Am Geriatr Soc, 2020)
/// - Improvement in stair speed strongly predicts improved quadriceps strength
/// - Apple uses this alongside 6MWT and walking steadiness for mobility score
struct StairSpeedView: View {

    struct DayReading: Identifiable {
        let id: Date
        let date: Date
        let ascentSpeed: Double?    // m/s
        let descentSpeed: Double?   // m/s
    }

    enum SpeedLevel: String {
        case excellent = "Excellent"
        case good      = "Good"
        case fair      = "Fair"
        case low       = "Low"

        init(ascentMPS: Double) {
            if ascentMPS >= 0.8      { self = .excellent }
            else if ascentMPS >= 0.6 { self = .good }
            else if ascentMPS >= 0.4 { self = .fair }
            else                      { self = .low }
        }

        var color: Color {
            switch self {
            case .excellent: return .green
            case .good:      return .blue
            case .fair:      return .yellow
            case .low:       return .orange
            }
        }

        var advice: String {
            switch self {
            case .excellent: return "Excellent stair climbing speed — consistent with strong leg power and low fall risk."
            case .good:      return "Good functional leg strength. Stair training (e.g. climbing 3–4 floors daily) can further improve neuromuscular power."
            case .fair:      return "Below average. Targeted lower-body strength training (squats, step-ups) and daily stair use typically improve ascent speed within 6–8 weeks."
            case .low:       return "Low stair speed correlates with elevated fall risk. Consider a physiotherapy assessment and progressive lower-body exercise program."
            }
        }
    }

    @State private var days: [DayReading] = []
    @State private var latestAscent: Double = 0
    @State private var latestDescent: Double = 0
    @State private var avgAscent: Double = 0
    @State private var avgDescent: Double = 0
    @State private var ascentTrend: Double = 0
    @State private var speedLevel: SpeedLevel = .good
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if days.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    referenceCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Stair Speed")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Stair Ascent Speed")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.2f", latestAscent))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(speedLevel.color)
                        Text("m/s")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(speedLevel.color).frame(width: 8, height: 8)
                        Text(speedLevel.rawValue).font(.subheadline).foregroundStyle(speedLevel.color)
                    }
                }
                Spacer()
                Image(systemName: "figure.stair.stepper")
                    .font(.system(size: 44)).foregroundStyle(speedLevel.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "90d Avg Ascent", value: String(format: "%.2f m/s", avgAscent), color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Latest Descent", value: String(format: "%.2f m/s", latestDescent), color: .teal)
                Divider().frame(height: 36)
                let trendColor: Color = ascentTrend > 0.02 ? .green : ascentTrend < -0.02 ? .red : .secondary
                statCell(label: "Trend (90d)",
                         value: ascentTrend >= 0 ? String(format: "+%.2f m/s", ascentTrend) : String(format: "%.2f m/s", ascentTrend),
                         color: trendColor)
                Divider().frame(height: 36)
                statCell(label: "Readings", value: "\(days.count)", color: .secondary)
            }
            Divider()
            Text(speedLevel.advice)
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
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
            Text("90-Day Speed Trend").font(.headline)
            Text("Stair ascent (blue) and descent (teal) speeds over time")
                .font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(days) { d in
                    if let a = d.ascentSpeed {
                        LineMark(x: .value("Date", d.date),
                                 y: .value("Ascent", a),
                                 series: .value("Type", "Ascent"))
                        .foregroundStyle(Color.blue.opacity(0.7))
                        .interpolationMethod(.catmullRom)
                        PointMark(x: .value("Date", d.date),
                                  y: .value("Speed", a))
                        .foregroundStyle(SpeedLevel(ascentMPS: a).color)
                        .symbolSize(20)
                    }
                    if let desc = d.descentSpeed {
                        LineMark(x: .value("Date", d.date),
                                 y: .value("Descent", desc),
                                 series: .value("Type", "Descent"))
                        .foregroundStyle(Color.teal.opacity(0.6))
                        .interpolationMethod(.catmullRom)
                    }
                }
                // Reference lines
                RuleMark(y: .value("Good", 0.6))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.blue.opacity(0.3))
                    .annotation(position: .trailing) {
                        Text("0.6").font(.caption2).foregroundStyle(.blue)
                    }
                RuleMark(y: .value("Excellent", 0.8))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.3))
                    .annotation(position: .trailing) {
                        Text("0.8").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("m/s")
            .chartYScale(domain: 0.2...1.2)
            .frame(height: 180)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Reference Card

    private var referenceCard: some View {
        let levels: [(SpeedLevel, String, String)] = [
            (.excellent, "≥0.8 m/s", "Elite functional leg power — top 20% for most age groups"),
            (.good,      "0.6–0.8",  "Normal range for healthy active adults"),
            (.fair,      "0.4–0.6",  "Below average — strength training recommended"),
            (.low,       "<0.4 m/s", "Clinical threshold — consider physiotherapy assessment"),
        ]
        return VStack(alignment: .leading, spacing: 10) {
            Text("Reference Ranges").font(.headline)
            Text("Stair ascent speed norms — healthy community-dwelling adults")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(levels, id: \.1) { level, range, desc in
                HStack(alignment: .top, spacing: 10) {
                    HStack(spacing: 6) {
                        Circle().fill(level.color).frame(width: 8, height: 8)
                        Text(range).font(.caption.bold().monospacedDigit()).foregroundStyle(level.color)
                    }
                    .frame(width: 90, alignment: .leading)
                    Text(desc).font(.caption2).foregroundStyle(.secondary)
                }
                .padding(.vertical, 2)
                let current = latestAscent
                if level == SpeedLevel(ascentMPS: current) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.right").font(.caption2)
                        Text(String(format: "Your current speed: %.2f m/s", current))
                            .font(.caption2.bold())
                    }
                    .foregroundStyle(level.color)
                    .padding(.leading, 18)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "figure.stair.stepper").foregroundStyle(.blue)
                Text("Stair Speed Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Fall risk predictor", body: "Stair ascent speed < 0.5 m/s predicts 2.5× higher fall risk in older adults (Landi et al., J Am Geriatr Soc, 2020). Among the strongest single functional mobility tests.")
                sciRow(title: "Quadriceps link", body: "Stair speed strongly correlates with quadriceps peak torque (r=0.76). Decline in stair speed is an early marker of sarcopenia (muscle mass loss with aging).")
                sciRow(title: "Improvement timeline", body: "Progressive lower-body resistance training (squats, step-ups, lunges, 3×/week for 8 weeks) typically improves stair speed by 15–25% in sedentary adults.")
                sciRow(title: "Apple's measurement", body: "iPhone 8+ uses its accelerometer and barometric altimeter to passively detect and measure stair climbing speed as you go about your daily life. No deliberate testing required.")
            }
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.blue.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.blue)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.stair.stepper")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Stair Speed Data")
                .font(.title3.bold())
            Text("Stair ascent and descent speed is measured passively by iPhone 8+ (iOS 14+) using the accelerometer and barometric altimeter. Carry your iPhone while climbing stairs to start capturing this data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let ascentType = HKQuantityType(.stairAscentSpeed)
        let descentType = HKQuantityType(.stairDescentSpeed)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [ascentType, descentType])) != nil
        else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let cal = Calendar.current
        let mps = HKUnit.meter().unitDivided(by: .second())

        async let ascentSamplesRaw: [HKQuantitySample] = withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: ascentType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        async let descentSamplesRaw: [HKQuantitySample] = withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: descentType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        let (ascentSamples, descentSamples) = await (ascentSamplesRaw, descentSamplesRaw)

        guard !ascentSamples.isEmpty else { return }

        // Aggregate by day
        var ascentByDay: [Date: [Double]] = [:]
        for s in ascentSamples {
            let day = cal.startOfDay(for: s.startDate)
            ascentByDay[day, default: []].append(s.quantity.doubleValue(for: mps))
        }
        var descentByDay: [Date: [Double]] = [:]
        for s in descentSamples {
            let day = cal.startOfDay(for: s.startDate)
            descentByDay[day, default: []].append(s.quantity.doubleValue(for: mps))
        }

        let allDates = Set(ascentByDay.keys).union(descentByDay.keys).sorted()
        days = allDates.map { date in
            let aVals = ascentByDay[date] ?? []
            let dVals = descentByDay[date] ?? []
            let ascentAvg: Double? = aVals.isEmpty ? nil : aVals.reduce(0,+) / Double(aVals.count)
            let descentAvg: Double? = dVals.isEmpty ? nil : dVals.reduce(0,+) / Double(dVals.count)
            return DayReading(id: date, date: date, ascentSpeed: ascentAvg, descentSpeed: descentAvg)
        }

        let ascentVals = days.compactMap(\.ascentSpeed).filter { $0 > 0 }
        guard !ascentVals.isEmpty else { return }

        latestAscent = ascentVals.last ?? 0
        latestDescent = days.compactMap(\.descentSpeed).filter { $0 > 0 }.last ?? 0
        avgAscent = ascentVals.reduce(0,+) / Double(ascentVals.count)
        let descentVals = days.compactMap(\.descentSpeed).filter { $0 > 0 }
        avgDescent = descentVals.isEmpty ? 0 : descentVals.reduce(0,+) / Double(descentVals.count)
        speedLevel = SpeedLevel(ascentMPS: latestAscent)

        // Trend
        if ascentVals.count >= 6 {
            let half = ascentVals.count / 2
            let firstAvg = Array(ascentVals.prefix(half)).reduce(0,+) / Double(half)
            let lastAvg = Array(ascentVals.suffix(half)).reduce(0,+) / Double(half)
            ascentTrend = lastAvg - firstAvg
        }
    }
}

#Preview { NavigationStack { StairSpeedView() } }
