import SwiftUI
import Charts
import HealthKit

// MARK: - AerobicDecouplingView

/// Aerobic decoupling measures how well your aerobic system maintains efficiency
/// during prolonged effort. Specifically: the ratio of pace-to-HR in the first
/// half vs second half of long runs. < 5% coupling = well-trained aerobic base.
///
/// This is distinct from Cardiac Drift (single-workout HR rise) — decoupling
/// tracks session-to-session trend in efficiency at aerobic pace.
struct AerobicDecouplingView: View {

    // MARK: - Models

    struct RunPoint: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let distanceKm: Double
        let avgHR: Double
        let decouplingPct: Double     // estimated from pace-HR efficiency proxy

        var aerobicLevel: AerobicLevel { AerobicLevel.from(pct: decouplingPct) }
    }

    enum AerobicLevel: String {
        case excellent = "Excellent"
        case good      = "Good"
        case moderate  = "Moderate"
        case poor      = "Poor"

        var color: Color {
            switch self {
            case .excellent: return .green
            case .good:      return .mint
            case .moderate:  return .orange
            case .poor:      return .red
            }
        }

        var threshold: String {
            switch self {
            case .excellent: return "< 5%"
            case .good:      return "5–7%"
            case .moderate:  return "7–10%"
            case .poor:      return "> 10%"
            }
        }

        static func from(pct: Double) -> AerobicLevel {
            if pct < 5  { return .excellent }
            if pct < 7  { return .good }
            if pct < 10 { return .moderate }
            return .poor
        }
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let avgDecoupling: Double
        let runCount: Int
    }

    // MARK: - State

    @State private var runs: [RunPoint] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var avgDecoupling: Double = 0
    @State private var trend: Double = 0           // improvement (negative = getting more efficient)
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if runs.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    decouplingTrendChart
                    weeklyAverageChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Aerobic Decoupling")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let level = AerobicLevel.from(pct: avgDecoupling)

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("90-Day Avg Decoupling")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", avgDecoupling))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(level.color)
                        Text("%")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(level.color).frame(width: 8, height: 8)
                        Text(level.rawValue)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(level.color)
                    }
                }
                Spacer()
                VStack(spacing: 8) {
                    if abs(trend) > 0.1 {
                        let improving = trend < 0
                        VStack(spacing: 2) {
                            Label(String(format: "%+.1f%%", trend),
                                  systemImage: improving ? "arrow.down.right.circle.fill" : "arrow.up.right.circle.fill")
                                .font(.caption.bold())
                                .foregroundStyle(improving ? .green : .orange)
                            Text("trend")
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    Text("\(runs.count) long runs")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "< 5%",   value: "Excellent", color: .green)
                Divider().frame(height: 36)
                statCell(label: "5–7%",   value: "Good",      color: .mint)
                Divider().frame(height: 36)
                statCell(label: "7–10%",  value: "Moderate",  color: .orange)
                Divider().frame(height: 36)
                statCell(label: "> 10%",  value: "Poor",      color: .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.caption2.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 6)
    }

    // MARK: - Trend Chart

    private var decouplingTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Decoupling per Run (90 days)")
                .font(.headline)

            Chart {
                ForEach(runs) { r in
                    PointMark(
                        x: .value("Date", r.date),
                        y: .value("%", r.decouplingPct)
                    )
                    .foregroundStyle(r.aerobicLevel.color.opacity(0.75))
                    .symbolSize(r.durationMins > 60 ? 60 : 36)  // larger dots = longer runs
                }

                // 7-run rolling average
                let rolling = rollingAvg(runs: runs, window: 5)
                ForEach(rolling, id: \.id) { r in
                    LineMark(
                        x: .value("Date", r.date),
                        y: .value("%", r.decouplingPct)
                    )
                    .foregroundStyle(Color.secondary.opacity(0.6))
                    .interpolationMethod(.monotone)
                }

                RuleMark(y: .value("Good", 5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.5))
                RuleMark(y: .value("Moderate", 10))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.orange.opacity(0.5))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("%")
            .chartYScale(domain: 0...max(15, (runs.map(\.decouplingPct).max() ?? 12) + 2))
            .frame(height: 180)

            Text("Dot size reflects run duration. Smaller = better aerobic base.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func rollingAvg(runs: [RunPoint], window: Int) -> [RunPoint] {
        guard runs.count >= window else { return [] }
        return (window - 1 ..< runs.count).map { i in
            let slice = runs[(i - window + 1)...i]
            let avg = slice.map(\.decouplingPct).reduce(0, +) / Double(window)
            return RunPoint(id: UUID(), date: runs[i].date, durationMins: runs[i].durationMins,
                            distanceKm: runs[i].distanceKm, avgHR: runs[i].avgHR, decouplingPct: avg)
        }
    }

    // MARK: - Weekly Average Chart

    private var weeklyAverageChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Average")
                .font(.headline)

            Chart {
                ForEach(weekBuckets) { b in
                    BarMark(
                        x: .value("Week", b.weekStart, unit: .weekOfYear),
                        y: .value("%", b.avgDecoupling)
                    )
                    .foregroundStyle(AerobicLevel.from(pct: b.avgDecoupling).color.opacity(0.7))
                    .cornerRadius(3)
                }

                RuleMark(y: .value("Good", 5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("%")
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("What Is Aerobic Decoupling?", systemImage: "waveform.path")
                .font(.headline).foregroundStyle(.teal)

            Text("Aerobic decoupling measures how well your heart rate stays stable relative to your pace during sustained effort. A well-trained aerobic system maintains pace-to-HR efficiency throughout a run — pace stays high as HR stays low.")
                .font(.caption).foregroundStyle(.secondary)

            Text("Dr. Phil Maffetone's MAF training philosophy centers on keeping decoupling below 5%: if your HR rises relative to your pace during a long run, your aerobic base needs more Zone 2 work.")
                .font(.caption).foregroundStyle(.secondary)

            Text("Estimation note: decoupling is estimated from max-to-avg HR ratio and run duration since per-minute GPS+HR splits aren't stored in HealthKit summaries.")
                .font(.caption2).foregroundStyle(.tertiary).italic()
        }
        .padding()
        .background(Color.teal.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Long Run Data")
                .font(.title3.bold())
            Text("Aerobic decoupling analysis requires running workouts of at least 30 minutes with heart rate data from Apple Watch.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let distType = HKQuantityType(.distanceWalkingRunning)
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, distType, hrType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: .running)
            ])
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        let kmUnit = HKUnit.meterUnit(with: .kilo)
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        // Filter to long runs (≥ 30 min) with HR data
        var rawRuns: [RunPoint] = []
        for w in workouts {
            let durationMins = w.duration / 60
            guard durationMins >= 30 else { continue }
            guard let avgHR = w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit),
                  avgHR > 0 else { continue }
            let maxHR = w.statistics(for: hrType)?.maximumQuantity()?.doubleValue(for: hrUnit) ?? avgHR * 1.1
            let distKm = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: kmUnit) ?? 0

            // Estimate decoupling from max/avg HR spread and duration
            // Longer runs tend to drift more; ratio closer to 1.0 = better coupling
            let hrRatio = maxHR / avgHR
            let durationFactor = min(durationMins / 120, 1.5)  // longer = more potential drift
            let estimatedDecoupling = max(0, (hrRatio - 1.0) * 100 * 0.7 * durationFactor)

            rawRuns.append(RunPoint(
                id: w.uuid,
                date: w.startDate,
                durationMins: durationMins,
                distanceKm: distKm,
                avgHR: avgHR,
                decouplingPct: min(estimatedDecoupling, 20)
            ))
        }

        guard !rawRuns.isEmpty else { return }

        runs = rawRuns
        avgDecoupling = rawRuns.map(\.decouplingPct).reduce(0, +) / Double(rawRuns.count)

        if rawRuns.count >= 6 {
            let half = rawRuns.count / 2
            let firstAvg = rawRuns.prefix(half).map(\.decouplingPct).reduce(0, +) / Double(half)
            let lastAvg = rawRuns.suffix(half).map(\.decouplingPct).reduce(0, +) / Double(half)
            trend = lastAvg - firstAvg
        }

        // Weekly buckets
        var cal = Calendar.current; cal.firstWeekday = 2
        var bucketMap: [String: (Date, [Double])] = [:]
        for r in rawRuns {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: r.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let weekStart = cal.date(from: comps) ?? r.date
            var cur = bucketMap[key] ?? (weekStart, [])
            cur.1.append(r.decouplingPct)
            bucketMap[key] = cur
        }
        weekBuckets = bucketMap.map { key, val in
            WeekBucket(id: key, weekStart: val.0,
                       avgDecoupling: val.1.reduce(0, +) / Double(val.1.count),
                       runCount: val.1.count)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview { NavigationStack { AerobicDecouplingView() } }
