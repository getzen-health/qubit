import SwiftUI
import Charts
import HealthKit

// MARK: - SixMinuteWalkView

/// Apple's Six-Minute Walk Test (6MWT) distance estimate.
///
/// HKQuantityType(.sixMinuteWalkTestDistance) — iPhone and Apple Watch
/// estimate the distance a person could walk in 6 minutes at their typical
/// walking pace, using a predictive algorithm based on step length, cadence,
/// walking speed, and heart rate. Available on iPhone 8+ (iOS 14+).
///
/// Clinical reference ranges (ATS Guidelines + normative studies):
/// - Age 60–69:  Male ≥576m / Female ≥494m (Enright & Sherrill, 1998)
/// - Age 40–59:  Male ≥620m / Female ≥530m (estimated from Enright normatives)
/// - Below-normal 6MWT correlates with higher cardiovascular event risk.
/// - Improvement of >50m over 12 weeks is considered clinically meaningful.
///
/// This metric is NOT collected during an explicit test — Apple estimates it
/// continuously from daily walking behavior.
struct SixMinuteWalkView: View {

    struct DayReading: Identifiable {
        let id: Date
        let date: Date
        let distanceM: Double

        var fitnessLevel: FitnessLevel { FitnessLevel(distanceM: distanceM) }
    }

    enum FitnessLevel: String {
        case excellent = "Excellent"
        case good      = "Good"
        case fair      = "Fair"
        case low       = "Low"

        init(distanceM: Double) {
            if distanceM >= 600      { self = .excellent }
            else if distanceM >= 500 { self = .good }
            else if distanceM >= 380 { self = .fair }
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
            case .excellent: return "Outstanding functional fitness — consistent with high aerobic capacity and low cardiovascular risk."
            case .good:      return "Good functional mobility. Maintain regular moderate aerobic exercise and consider adding Zone 2 walking sessions."
            case .fair:      return "Below average for most age groups. Regular brisk walking (30 min, 5×/week) typically improves 6MWT by 50–80m in 12 weeks."
            case .low:       return "Low functional capacity. Consider consulting a physiotherapist or physician for a structured walking program."
            }
        }
    }

    @State private var readings: [DayReading] = []
    @State private var latest: Double = 0
    @State private var avg90: Double = 0
    @State private var best90: Double = 0
    @State private var trend: Double = 0     // change from first to last 30 days within 90d window
    @State private var fitnessLevel: FitnessLevel = .good
    @State private var isLoading = true

    private var walkDomain: ClosedRange<Double> {
        let lo = readings.map(\.distanceM).min().map { max(200.0, $0 - 30) } ?? 300.0
        let hi = readings.map(\.distanceM).max().map { max(750.0, $0 + 30) } ?? 750.0
        return lo...hi
    }

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
                    normativeCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("6-Min Walk Test")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Estimated 6MWT Distance")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", latest))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(fitnessLevel.color)
                        Text("m")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(fitnessLevel.color).frame(width: 8, height: 8)
                        Text(fitnessLevel.rawValue)
                            .font(.subheadline).foregroundStyle(fitnessLevel.color)
                    }
                }
                Spacer()
                Image(systemName: "figure.walk.motion")
                    .font(.system(size: 44)).foregroundStyle(fitnessLevel.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "90d Average", value: String(format: "%.0f m", avg90), color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Best (90d)", value: String(format: "%.0f m", best90), color: .green)
                Divider().frame(height: 36)
                let trendColor: Color = trend > 20 ? .green : trend < -20 ? .red : .secondary
                statCell(label: "Trend (90d)", value: trend >= 0 ? String(format: "+%.0f m", trend) :
                                                                   String(format: "%.0f m", trend), color: trendColor)
                Divider().frame(height: 36)
                statCell(label: "Readings (90d)", value: "\(readings.count)", color: .secondary)
            }
            Divider()
            Text(fitnessLevel.advice)
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
            Text("90-Day 6MWT Estimate Trend").font(.headline)
            Text("Apple estimates this continuously from your daily walking behavior")
                .font(.caption).foregroundStyle(.secondary)

            Chart {
                ForEach(readings) { r in
                    LineMark(x: .value("Date", r.date),
                             y: .value("Distance", r.distanceM))
                    .foregroundStyle(Color.blue.opacity(0.5))
                    .interpolationMethod(.catmullRom)
                    AreaMark(x: .value("Date", r.date),
                             y: .value("Distance", r.distanceM))
                    .foregroundStyle(Color.blue.opacity(0.07))
                    .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Date", r.date),
                              y: .value("Distance", r.distanceM))
                    .foregroundStyle(r.fitnessLevel.color)
                    .symbolSize(20)
                }
                RuleMark(y: .value("Good", 500))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.blue.opacity(0.35))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("500m").font(.caption2).foregroundStyle(.blue)
                    }
                RuleMark(y: .value("Excellent", 600))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.35))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("600m").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("metres")
            .chartYScale(domain: walkDomain)
            .frame(height: 180)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Normative Reference Card

    private var normativeCard: some View {
        let norms: [(ageGroup: String, male: Int, female: Int)] = [
            ("40–49", 631, 554),
            ("50–59", 617, 530),
            ("60–69", 576, 494),
            ("70–79", 500, 453),
        ]

        return VStack(alignment: .leading, spacing: 10) {
            Text("Age-Group Reference Ranges").font(.headline)
            Text("Enright & Sherrill 1998 — healthy community-dwelling adults")
                .font(.caption).foregroundStyle(.secondary)

            HStack {
                Text("Age").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .leading)
                Text("Male").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .center)
                Text("Female").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .center)
                Text("You").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
            }
            .padding(.horizontal, 12)

            ForEach(norms, id: \.ageGroup) { norm in
                Divider()
                HStack {
                    Text(norm.ageGroup).font(.caption).frame(width: 60, alignment: .leading)
                    Text("\(norm.male)m").font(.caption.monospacedDigit())
                        .frame(maxWidth: .infinity, alignment: .center)
                        .foregroundStyle(latest >= Double(norm.male) ? .green : .secondary)
                    Text("\(norm.female)m").font(.caption.monospacedDigit())
                        .frame(maxWidth: .infinity, alignment: .center)
                        .foregroundStyle(latest >= Double(norm.female) ? .green : .secondary)
                    Text(String(format: "%.0fm", latest)).font(.caption.bold().monospacedDigit())
                        .foregroundStyle(fitnessLevel.color)
                        .frame(width: 55, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 5)
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
                Image(systemName: "figure.walk").foregroundStyle(.blue)
                Text("6MWT Science & Context").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "What it measures", body: "The 6-minute walk test (6MWT) is a validated submaximal exercise test assessing functional capacity and cardiovascular fitness. Originally developed for heart failure patients, now used across populations.")
                sciRow(title: "Apple's estimation method", body: "Rather than a formal test, Apple uses machine learning on daily walking data (cadence, step length, heart rate, pace variability) to estimate your likely 6MWT distance. Validated against clinical measurements in NHANES data.")
                sciRow(title: "Clinically meaningful change", body: "A difference of ≥50m is considered the minimum clinically important difference (MCID). Improving 6MWT by 50m+ over 12 weeks reflects genuine fitness gains.")
                sciRow(title: "Predictors of low 6MWT", body: "BMI, sedentary time, age, smoking history, and cardiorespiratory fitness. Each 50m improvement correlates with ~12% reduction in all-cause mortality (Bittner et al., 1993).")
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
            Image(systemName: "figure.walk.motion")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No 6MWT Data")
                .font(.title3.bold())
            Text("Apple estimates your Six-Minute Walk Test distance from daily walking patterns captured by iPhone (8+) or Apple Watch. Walk more throughout the day to enable this estimate.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let walkType = HKQuantityType(.sixMinuteWalkTestDistance)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [walkType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let cal = Calendar.current

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: walkType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        var dayMap: [Date: [Double]] = [:]
        for s in samples {
            let day = cal.startOfDay(for: s.startDate)
            dayMap[day, default: []].append(s.quantity.doubleValue(for: HKUnit.meter()))
        }

        let allDays = dayMap.map { date, vals in
            DayReading(id: date, date: date,
                       distanceM: vals.reduce(0, +) / Double(vals.count))
        }.sorted { $0.date < $1.date }

        readings = allDays
        latest = allDays.last?.distanceM ?? 0
        fitnessLevel = FitnessLevel(distanceM: latest)

        let dists = allDays.map(\.distanceM)
        avg90 = dists.reduce(0, +) / Double(dists.count)
        best90 = dists.max() ?? 0

        // Trend: last 30 readings avg vs first 30 readings avg
        if allDays.count >= 10 {
            let half = allDays.count / 2
            let firstHalf = Array(allDays.prefix(half)).map(\.distanceM)
            let lastHalf = Array(allDays.suffix(half)).map(\.distanceM)
            let firstAvg = firstHalf.reduce(0, +) / Double(firstHalf.count)
            let lastAvg = lastHalf.reduce(0, +) / Double(lastHalf.count)
            trend = lastAvg - firstAvg
        }
    }
}

#Preview { NavigationStack { SixMinuteWalkView() } }
