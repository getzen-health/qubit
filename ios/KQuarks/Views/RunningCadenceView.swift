import SwiftUI
import HealthKit
import Charts

// MARK: - RunningCadenceView
// Analyses running cadence (steps per minute) from Apple Watch step count within running workouts.
// Cadence = (step count within workout) ÷ duration in minutes.
// Science: Heiderscheit et al. 2011 (Med Sci Sports Exerc): Increasing cadence 5–10%
//   reduces knee joint loading by 20% and hip loading by 34%.
// Schubert et al. 2014 (J Orthop Sports Phys Ther): 170 spm minimises impact per stride.
// Nelson et al. 2019 (J Athl Train): Cadence ≥164 spm associated with reduced injury risk.
// Distinct from RunningFormView (stride/oscillation) and RunningEfficiencyView (AEI).

struct RunningCadenceView: View {

    // MARK: - Models

    enum CadenceZone: String, CaseIterable {
        case slow     = "Slow (<155 spm)"
        case building = "Building (155–165)"
        case optimal  = "Optimal (165–175)"
        case elite    = "Elite (>175 spm)"

        var color: Color {
            switch self {
            case .slow:     return .red
            case .building: return .orange
            case .optimal:  return .green
            case .elite:    return .blue
            }
        }
        var icon: String {
            switch self {
            case .slow:     return "tortoise.fill"
            case .building: return "figure.walk"
            case .optimal:  return "figure.run"
            case .elite:    return "hare.fill"
            }
        }
    }

    struct RunPoint: Identifiable {
        let id = UUID()
        let date: Date
        let cadence: Double    // spm
        let durationMins: Double
        let paceMinKm: Double  // min/km
    }

    struct BucketBar: Identifiable {
        let id = UUID()
        let label: String
        let count: Int
        let zone: CadenceZone
    }

    // MARK: - State

    @State private var runs: [RunPoint] = []
    @State private var buckets: [BucketBar] = []

    private var cadenceChartDomain: ClosedRange<Double> {
        let lo = runs.map(\.cadence).min().map { max(140.0, $0 - 5) } ?? 140.0
        let hi = runs.map(\.cadence).max().map { max(200.0, $0 + 5) } ?? 200.0
        return lo...hi
    }
    @State private var avgCadence: Double?
    @State private var currentZone: CadenceZone?
    @State private var trend: Double?  // improvement over last 3 months
    @State private var optimalPercent: Double?  // % of runs in optimal zone
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    private let targetSPM: Double = 170

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing running cadence…")
                        .padding(.top, 60)
                } else if runs.isEmpty {
                    ContentUnavailableView("No Running Data",
                        systemImage: "figure.run.circle",
                        description: Text("Run with Apple Watch to track cadence. Step count data is required."))
                } else {
                    summaryCard
                    trendChart
                    distributionCard
                    paceCorrelationCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Running Cadence")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Cards

    private var summaryCard: some View {
        VStack(spacing: 14) {
            // Zone badge
            if let zone = currentZone {
                HStack(spacing: 10) {
                    Image(systemName: zone.icon)
                        .font(.system(size: 32))
                        .foregroundStyle(zone.color)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(zone.rawValue)
                            .font(.headline.weight(.bold))
                            .foregroundStyle(zone.color)
                        if let avg = avgCadence {
                            Text(String(format: "Average: %.0f spm · Target: %.0f spm", avg, targetSPM))
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Spacer()
                    if let avg = avgCadence {
                        let delta = avg - targetSPM
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%+.0f", delta))
                                .font(.title2.weight(.bold))
                                .foregroundStyle(abs(delta) <= 5 ? .green : delta < 0 ? .red : .blue)
                            Text("vs 170 target").font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                }
                .padding()
            }

            HStack(spacing: 0) {
                statBox(value: avgCadence.map { String(format: "%.0f spm", $0) } ?? "—",
                        label: "Avg Cadence", sub: "all runs", color: currentZone?.color ?? .secondary)
                Divider().frame(height: 44)
                statBox(value: optimalPercent.map { String(format: "%.0f%%", $0) } ?? "—",
                        label: "In Optimal Zone", sub: "165–175 spm", color: .green)
                Divider().frame(height: 44)
                statBox(value: "\(runs.count)", label: "Runs Analysed", sub: "past 90 days", color: .secondary)
            }
            .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Cadence Trend — Past 90 Days", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("Each point = one run. Target zone: 165–175 spm (green band).")
                .font(.caption2).foregroundStyle(.secondary)

            Chart {
                // Target band
                RectangleMark(
                    xStart: .value("Start", runs.first?.date ?? Date()),
                    xEnd: .value("End", runs.last?.date ?? Date()),
                    yStart: .value("Lo", 165.0),
                    yEnd: .value("Hi", 175.0)
                )
                .foregroundStyle(Color.green.opacity(0.08))

                RuleMark(y: .value("Target", targetSPM))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))

                ForEach(runs) { run in
                    PointMark(
                        x: .value("Date", run.date),
                        y: .value("Cadence", run.cadence)
                    )
                    .foregroundStyle(cadenceColor(run.cadence))
                    .symbolSize(25)
                }

                if runs.count >= 3 {
                    ForEach(runs) { run in
                        LineMark(
                            x: .value("Date", run.date),
                            y: .value("Cadence", run.cadence)
                        )
                        .foregroundStyle(Color.secondary.opacity(0.3))
                        .interpolationMethod(.catmullRom)
                    }
                }
            }
            .chartYScale(domain: cadenceChartDomain)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 160)

            // Trend delta
            if let t = trend {
                HStack {
                    Image(systemName: t > 0 ? "arrow.up.circle.fill" : t < 0 ? "arrow.down.circle.fill" : "minus.circle")
                        .foregroundStyle(t > 0 ? .green : t < 0 ? .orange : .secondary)
                    Text(t == 0 ? "Cadence stable" : String(format: "%+.1f spm vs 3 months ago — %@", t,
                        t > 0 ? "moving toward optimal" : "check your form"))
                    .font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var distributionCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Cadence Distribution", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()

            Chart(buckets) { bucket in
                BarMark(
                    x: .value("Range", bucket.label),
                    y: .value("Runs", bucket.count)
                )
                .foregroundStyle(bucket.zone.color.gradient)
                .cornerRadius(4)
            }
            .frame(height: 120)

            HStack(spacing: 12) {
                ForEach(CadenceZone.allCases, id: \.rawValue) { z in
                    HStack(spacing: 4) {
                        Circle().fill(z.color).frame(width: 7, height: 7)
                        Text(z.rawValue.components(separatedBy: " (").first ?? z.rawValue)
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var paceCorrelationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Cadence vs Pace", systemImage: "chart.dots.scatter")
                .font(.subheadline).bold()
            Text("Higher cadence at the same effort = better running economy.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(runs) { run in
                PointMark(
                    x: .value("Pace (min/km)", run.paceMinKm),
                    y: .value("Cadence (spm)", run.cadence)
                )
                .foregroundStyle(cadenceColor(run.cadence).opacity(0.7))
                .symbolSize(30)
            }
            .chartXAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            Text(String(format: "%.0f'", v))
                        }
                    }
                }
            }
            .frame(height: 120)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Cadence Science", systemImage: "info.circle.fill")
                .font(.subheadline).bold()
            Text("Heiderscheit et al. 2011 (Med Sci Sports Exerc): Increasing cadence by 5–10% (from a runner's self-selected pace) reduced knee joint loading by 20% and hip loading by 34% — significant injury prevention benefit.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Schubert et al. 2014 (J Orthop Sports Phys Ther): 170 spm minimises vertical impact force per stride across runner body weights. Nelson et al. 2019 (J Athl Train): Cadence ≥164 spm consistently associated with reduced injury incidence.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Note: Optimal cadence varies slightly by height and speed. Taller runners typically run at 160–165 spm; shorter runners at 170–180 spm. The key is to increase your self-selected cadence by ~5% initially.")
                .font(.caption).foregroundStyle(.tertiary)

            // Zone guide
            VStack(alignment: .leading, spacing: 4) {
                Text("Cadence zones:").font(.caption.weight(.semibold))
                ForEach(CadenceZone.allCases, id: \.rawValue) { zone in
                    HStack(spacing: 6) {
                        Circle().fill(zone.color).frame(width: 6, height: 6)
                        Text(zone.rawValue).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.green.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Helpers

    private func cadenceColor(_ c: Double) -> Color {
        if c < 155 { return .red }
        if c < 165 { return .orange }
        if c <= 175 { return .green }
        return .blue
    }

    private func cadenceZone(_ c: Double) -> CadenceZone {
        if c < 155 { return .slow }
        if c < 165 { return .building }
        if c <= 175 { return .optimal }
        return .elite
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .day, value: -90, to: end) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        var workouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                workouts = (samples as? [HKWorkout] ?? []).filter { $0.workoutActivityType == .running && $0.duration > 300 }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let stepUnit = HKUnit.count()
        let distUnit = HKUnit.meter()

        let runs: [RunPoint] = workouts.compactMap { w in
            let steps = w.statistics(for: HKQuantityType(.stepCount))?.sumQuantity()?.doubleValue(for: stepUnit) ?? 0
            let dist = w.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: distUnit) ?? 0
            let durationMins = w.duration / 60
            guard steps > 0, durationMins > 0 else { return nil }
            let cadence = steps / durationMins
            guard cadence > 100, cadence < 250 else { return nil }  // sanity check
            let paceMinKm = dist > 0 ? (durationMins / (dist / 1000)) : 0
            return RunPoint(date: w.startDate, cadence: cadence, durationMins: durationMins, paceMinKm: paceMinKm)
        }

        guard !runs.isEmpty else { isLoading = false; return }

        let avgCad = runs.map(\.cadence).reduce(0, +) / Double(runs.count)
        let currentZone = cadenceZone(avgCad)
        let optPct = Double(runs.filter { cadenceZone($0.cadence) == .optimal }.count) / Double(runs.count) * 100

        // Trend: compare first half vs second half
        let half = runs.count / 2
        let trend: Double
        if half > 0 {
            let firstAvg = runs.prefix(half).map(\.cadence).reduce(0, +) / Double(half)
            let lastAvg = runs.suffix(half).map(\.cadence).reduce(0, +) / Double(half)
            trend = lastAvg - firstAvg
        } else {
            trend = 0
        }

        // Distribution buckets
        let bucketDefs: [(label: String, lo: Double, hi: Double, zone: CadenceZone)] = [
            ("<150", 0, 150, .slow), ("150–160", 150, 160, .slow), ("160–165", 160, 165, .building),
            ("165–170", 165, 170, .optimal), ("170–175", 170, 175, .optimal),
            ("175–180", 175, 180, .elite), (">180", 180, 999, .elite)
        ]
        let buckets = bucketDefs.map { def in
            BucketBar(label: def.label,
                      count: runs.filter { $0.cadence >= def.lo && $0.cadence < def.hi }.count,
                      zone: def.zone)
        }

        DispatchQueue.main.async {
            self.runs = runs
            self.avgCadence = avgCad
            self.currentZone = currentZone
            self.optimalPercent = optPct
            self.trend = trend
            self.buckets = buckets
            self.isLoading = false
        }
    }
}
