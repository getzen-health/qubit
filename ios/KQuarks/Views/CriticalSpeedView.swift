import SwiftUI
import Charts
import HealthKit

// MARK: - CriticalSpeedView

/// Estimates Critical Speed (CS) — the aerobic/anaerobic threshold boundary in running.
/// CS is the maximum speed sustainable without progressive fatigue accumulation,
/// derived from the linear distance-duration relationship (3-parameter hyperbolic model).
///
/// Methodology: fits a linear regression to the duration vs distance data from recent
/// runs at various distances. CS = slope of the D-t line. D' (D-prime) = y-intercept,
/// representing the anaerobic work capacity above CS.
///
/// References: Poole et al. 2016, Jones et al. 2019.
struct CriticalSpeedView: View {

    struct RunPoint: Identifiable {
        let id: UUID
        let date: Date
        let distanceM: Double
        let durationMins: Double
        var speedMps: Double { durationMins > 0 ? distanceM / (durationMins * 60) : 0 }
        var paceMinsPerKm: Double { speedMps > 0 ? (1000 / speedMps) / 60 : 0 }
    }

    struct CSResult {
        let criticalSpeedMps: Double   // m/s
        let dPrimeM: Double            // meters (anaerobic capacity)
        let r2: Double                 // goodness of fit

        var criticalSpeedKmh: Double { criticalSpeedMps * 3.6 }
        var criticalPaceMinsPerKm: Double { criticalSpeedMps > 0 ? (1000 / criticalSpeedMps) / 60 : 0 }

        func paceString(_ minsPerKm: Double) -> String {
            let mins = Int(minsPerKm)
            let secs = Int((minsPerKm - Double(mins)) * 60)
            return String(format: "%d:%02d/km", mins, secs)
        }

        var criticalPaceString: String { paceString(criticalPaceMinsPerKm) }
    }

    struct SpeedBucket: Identifiable {
        let id: String
        let weekStart: Date
        let avgSpeed: Double   // m/s
    }

    @State private var runs: [RunPoint] = []
    @State private var csResult: CSResult? = nil
    @State private var speedBuckets: [SpeedBucket] = []
    @State private var recentRuns: [RunPoint] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if runs.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    if let cs = csResult {
                        criticalSpeedCard(cs: cs)
                        trainingZonesCard(cs: cs)
                    }
                    weeklySpeedChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Critical Speed")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Critical Speed Card

    private func criticalSpeedCard(cs: CSResult) -> some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Estimated Critical Speed")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(cs.criticalPaceString)
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundStyle(.teal)
                    }
                    Text("Aerobic-anaerobic threshold boundary")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "gauge.with.dots.needle.67percent")
                    .font(.system(size: 44)).foregroundStyle(.teal)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "CS (km/h)", value: String(format: "%.1f", cs.criticalSpeedKmh), color: .teal)
                Divider().frame(height: 36)
                statCell(label: "D' (m)", value: String(format: "%.0f", cs.dPrimeM), color: .cyan)
                Divider().frame(height: 36)
                statCell(label: "Fit (R²)", value: String(format: "%.2f", cs.r2), color: cs.r2 >= 0.9 ? .green : cs.r2 >= 0.75 ? .yellow : .orange)
                Divider().frame(height: 36)
                statCell(label: "Runs Used", value: "\(runs.count)", color: .secondary)
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

    // MARK: - Training Zones Card

    private func trainingZonesCard(cs: CSResult) -> some View {
        let cs_pace = cs.criticalPaceMinsPerKm
        let z1_top = cs_pace * 1.25  // well below CS: recovery
        let z2_top = cs_pace * 1.10  // below CS: aerobic base
        let z3_top = cs_pace * 1.02  // near CS: tempo
        // above CS: > CP territory (anaerobic)

        let zones: [(label: String, desc: String, range: String, color: Color)] = [
            ("Z1 Recovery", "Easy aerobic", "> \(paceStr(z1_top))/km", .green),
            ("Z2 Aerobic Base", "Below CS — sustainable effort", "\(paceStr(z2_top))–\(paceStr(z1_top))/km", .teal),
            ("Z3 Tempo", "Approaching CS — high aerobic", "\(paceStr(z3_top))–\(paceStr(z2_top))/km", .yellow),
            ("Z4 Critical Speed", "At CS boundary — VO₂ max region", "< \(paceStr(z3_top))/km", .orange),
            ("Z5 Above CS (D')", "Burning D' — unsustainable", "Race pace/sprints", .red),
        ]

        return VStack(alignment: .leading, spacing: 8) {
            Text("Training Zones").font(.headline)
            VStack(spacing: 0) {
                ForEach(zones, id: \.label) { z in
                    HStack(spacing: 10) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(z.color)
                            .frame(width: 4, height: 36)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(z.label).font(.caption.bold()).foregroundStyle(z.color)
                            Text(z.desc).font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(z.range).font(.caption2.monospacedDigit()).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                    if z.label != zones.last?.label { Divider() }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func paceStr(_ minsPerKm: Double) -> String {
        let mins = Int(minsPerKm)
        let secs = Int((minsPerKm - Double(mins)) * 60)
        return String(format: "%d:%02d", mins, secs)
    }

    // MARK: - Weekly Speed Trend Chart

    private var weeklySpeedChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Avg Running Speed").font(.headline)
            Text("All runs — pace trend over 12 weeks").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(speedBuckets) { b in
                    LineMark(x: .value("Week", b.weekStart),
                             y: .value("Speed", b.avgSpeed * 3.6))
                    .foregroundStyle(Color.teal.opacity(0.7))
                    .interpolationMethod(.catmullRom)
                }
                ForEach(speedBuckets) { b in
                    PointMark(x: .value("Week", b.weekStart),
                              y: .value("Speed", b.avgSpeed * 3.6))
                    .foregroundStyle(.teal)
                    .symbolSize(25)
                }
                if let cs = csResult {
                    RuleMark(y: .value("CS", cs.criticalSpeedKmh))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.orange.opacity(0.7))
                        .annotation(position: .trailing, alignment: .center) {
                            Text("CS").font(.caption2).foregroundStyle(.orange)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("km/h")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "flask.fill").foregroundStyle(.teal)
                Text("The Science").font(.headline)
            }
            Text("Critical Speed (CS) is the highest running speed that can be maintained without progressive accumulation of fatigue — it represents the boundary between heavy and severe exercise intensity domains.")
                .font(.caption).foregroundStyle(.secondary)
            Text("D' (D-prime) is the finite work capacity above CS — once depleted, you must drop below CS to recover it. Elite runners have high CS but also large D' for race surges.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training at or slightly below CS maximizes VO₂ max stimulus while remaining sustainable. Training above CS depletes D' and requires recovery time.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Source: Jones et al. 2019, Poole et al. 2016 — Br J Sports Med")
                .font(.caption2).foregroundStyle(.tertiary).italic()
        }
        .padding()
        .background(Color.teal.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.teal.opacity(0.2), lineWidth: 1))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "gauge.with.dots.needle.67percent")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("Not Enough Run Data")
                .font(.title3.bold())
            Text("Critical Speed estimation requires at least 5 outdoor runs with distance data recorded on Apple Watch. Run more varied distances to improve accuracy.")
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

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, distType])) != nil else { return }

        let sixMonthsAgo = Calendar.current.date(byAdding: .month, value: -6, to: Date()) ?? Date()
        let mUnit = HKUnit.meter()

        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: sixMonthsAgo, end: Date()),
            HKQuery.predicateForWorkouts(with: .running)
        ])

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        // Filter: runs ≥ 5 min, distance 1–42 km
        let validRuns = workouts.compactMap { w -> RunPoint? in
            let dist = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: mUnit) ?? 0
            let mins = w.duration / 60
            guard mins >= 5, dist >= 1000, dist <= 42200 else { return nil }
            return RunPoint(id: w.uuid, date: w.startDate, distanceM: dist, durationMins: mins)
        }

        guard validRuns.count >= 5 else { return }
        runs = validRuns

        // Linear regression: duration (s) = D'/CS + (1/CS) * distance
        // i.e. t = a + b * d  where b = 1/CS, a = D'/CS
        // Equivalently in meters: d = CS * t - D'
        // We regress distance ~ duration_seconds to get CS (slope) and -D' (intercept)
        let xs = validRuns.map { $0.durationMins * 60 }   // duration in seconds
        let ys = validRuns.map { $0.distanceM }             // distance in meters
        let n = Double(xs.count)
        let sumX = xs.reduce(0, +)
        let sumY = ys.reduce(0, +)
        let sumXY = zip(xs, ys).map { $0 * $1 }.reduce(0, +)
        let sumX2 = xs.map { $0 * $0 }.reduce(0, +)

        let denom = n * sumX2 - sumX * sumX
        guard denom != 0 else { return }

        let slope = (n * sumXY - sumX * sumY) / denom  // CS in m/s
        let intercept = (sumY - slope * sumX) / n       // -D' in meters

        // Goodness of fit R²
        let yMean = sumY / n
        let ssTot = ys.map { ($0 - yMean) * ($0 - yMean) }.reduce(0.0, +)
        let ssRes: Double = zip(xs, ys).map { (x: Double, y: Double) -> Double in
            let pred = slope * x + intercept
            return (y - pred) * (y - pred)
        }.reduce(0.0, +)
        let r2 = ssTot > 0 ? max(0, 1 - ssRes / ssTot) : 0

        guard slope > 1.5, slope < 8 else { return }  // sanity: 1.5–8 m/s is plausible CS

        csResult = CSResult(
            criticalSpeedMps: slope,
            dPrimeM: max(0, -intercept),
            r2: r2
        )

        // Weekly avg speed buckets
        var cal = Calendar.current; cal.firstWeekday = 2
        var bMap: [String: (Date, [Double])] = [:]
        for r in validRuns {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: r.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = cal.date(from: comps) ?? r.date
            var cur = bMap[key] ?? (ws, [])
            cur.1.append(r.speedMps)
            bMap[key] = cur
        }
        speedBuckets = bMap.compactMap { key, val in
            guard !val.1.isEmpty else { return nil }
            let avg = val.1.reduce(0, +) / Double(val.1.count)
            return SpeedBucket(id: key, weekStart: val.0, avgSpeed: avg)
        }.sorted { $0.weekStart < $1.weekStart }

        recentRuns = Array(validRuns.suffix(12).reversed())
    }
}

#Preview { NavigationStack { CriticalSpeedView() } }
