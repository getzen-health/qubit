import SwiftUI
import HealthKit
import Charts

// MARK: - TrainingPerformanceCorrelationView
// Validates whether building training load (CTL) actually translates to improved running efficiency.
// Shows the relationship between long-term fitness base and running economy over time.
//
// Key questions answered:
//   1. Does my CTL actually correlate with running performance?
//   2. At what TSB (form) do I perform best?
//   3. Are my training efforts translating to fitness gains?
//
// Science:
//   Lucia et al. 2000 (Med Sci Sports Exerc): running economy accounts for 65–78% of variance
//     in endurance performance when VO₂ max is controlled for.
//   Bannister 1991 PMC model: CTL = fitness, ATL = fatigue, TSB = form. Performance peaks at
//     positive TSB after CTL has been built (the "tapering" effect).
//   Coyle et al. 1991 (J Appl Physiol): training-induced improvements in running economy
//     reflect neuromuscular and metabolic adaptations — trackable from HR/pace data.
//
// Method: weekly CTL (from Bannister model) paired with weekly running efficiency (km/h per bpm).
// Pearson r > 0 = fitness is building performance. Scatter plot shows optimal TSB window.

struct TrainingPerformanceCorrelationView: View {

    // MARK: - Models

    struct WeekPoint: Identifiable {
        let id = UUID()
        let weekStart: Date
        let weekLabel: String
        let ctl: Double          // fitness at week start
        let tsb: Double          // TSB form score
        let efficiency: Double   // avg running efficiency (km/h per bpm)
        let runSessions: Int
    }

    // MARK: - State

    @State private var weekPoints: [WeekPoint] = []
    @State private var ctlEfficiencyR: Double = 0   // CTL-efficiency Pearson r
    @State private var tsbOptimal: Double = 0        // TSB at peak efficiency
    @State private var efficiencyTrend: Double = 0   // slope: efficiency per CTL unit
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Correlating load & performance…")
                        .padding(.top, 60)
                } else if weekPoints.filter({ $0.runSessions > 0 }).count < 5 {
                    noDataCard
                } else {
                    insightCard
                    ctlVsEfficiencyScatter
                    tsbVsEfficiencyScatter
                    efficiencyTrendChart
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Load vs Performance")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Insight Card

    private var insightCard: some View {
        let validPoints = weekPoints.filter { $0.runSessions > 0 }
        let r = ctlEfficiencyR
        let interpretation = r > 0.4 ? "Strong positive correlation — your training investment is paying off. Higher CTL directly translates to better running efficiency." :
                             r > 0.1 ? "Moderate positive correlation — your aerobic base is helping performance, but there's room for better training consistency." :
                             r < -0.2 ? "Negative correlation detected — possible overtraining or training specificity issues. Consider adjusting your approach." :
                             "Weak correlation — not enough running data or training consistency to establish a clear relationship."

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: String(format: "%.2f", r),
                    label: "CTL-Performance r",
                    sub: r > 0.3 ? "Significant" : "Weak",
                    color: r > 0.3 ? .green : (r > 0 ? .yellow : .red)
                )
                Divider().frame(height: 44)
                statBox(
                    value: tsbOptimal != 0 ? String(format: "%+.0f", tsbOptimal) : "—",
                    label: "Optimal TSB",
                    sub: "peak performance",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(validPoints.count)",
                    label: "Data Points",
                    sub: "weeks with runs",
                    color: .secondary
                )
            }
            .padding(.vertical, 12)

            Text(interpretation)
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
                .padding(.bottom, 10)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - CTL vs Efficiency Scatter

    private var ctlVsEfficiencyScatter: some View {
        let validPoints = weekPoints.filter { $0.runSessions > 0 && $0.efficiency > 0 }

        return VStack(alignment: .leading, spacing: 10) {
            Label("CTL (Fitness) vs Running Efficiency", systemImage: "chart.dots.scatter")
                .font(.subheadline).bold()
            Text("Each dot = one week. X = your CTL fitness base. Y = running efficiency (km/h per bpm). Upward trend = your fitness is translating to better economy.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart {
                ForEach(validPoints) { pt in
                    PointMark(
                        x: .value("CTL", pt.ctl),
                        y: .value("Efficiency", pt.efficiency)
                    )
                    .foregroundStyle(
                        pt.tsb > 10 ? Color.green :
                        pt.tsb > 0  ? Color.blue  :
                        pt.tsb > -20 ? Color.orange : Color.red
                    )
                    .symbolSize(55)
                }
            }
            .frame(height: 160)
            .chartXAxisLabel("CTL (Fitness)")
            .chartYAxisLabel("Efficiency")

            HStack(spacing: 12) {
                legendDot(color: .green,  label: "TSB >10 (Fresh)")
                legendDot(color: .blue,   label: "TSB 0–10 (Neutral)")
                legendDot(color: .orange, label: "TSB <0 (Fatigued)")
                legendDot(color: .red,    label: "TSB <−20 (Overreached)")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - TSB vs Efficiency Scatter

    private var tsbVsEfficiencyScatter: some View {
        let validPoints = weekPoints.filter { $0.runSessions > 0 && $0.efficiency > 0 }

        return VStack(alignment: .leading, spacing: 10) {
            Label("TSB (Form) vs Running Performance", systemImage: "gauge.with.needle.fill")
                .font(.subheadline).bold()
            Text("TSB = fitness − fatigue. Peak performance typically occurs at TSB +10 to +25 (fresh but not detrained). Negative TSB means you're training through fatigue.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart {
                // Optimal TSB band
                RuleMark(x: .value("Lower", 10.0))
                    .foregroundStyle(Color.green.opacity(0.3))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                RuleMark(x: .value("Upper", 25.0))
                    .foregroundStyle(Color.green.opacity(0.3))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))

                ForEach(validPoints) { pt in
                    PointMark(
                        x: .value("TSB", pt.tsb),
                        y: .value("Efficiency", pt.efficiency)
                    )
                    .foregroundStyle(Color.blue.gradient)
                    .symbolSize(55)
                }
            }
            .frame(height: 140)
            .chartXAxisLabel("TSB (Form = CTL − ATL)")
            .chartYAxisLabel("Efficiency")

            Text("Green dashed lines mark the Bannister optimal TSB window (+10 to +25 = peak form).")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Efficiency Trend Over Time

    private var efficiencyTrendChart: some View {
        let validPoints = weekPoints.filter { $0.runSessions > 0 && $0.efficiency > 0 }

        return VStack(alignment: .leading, spacing: 10) {
            Label("Running Efficiency Trend — 6 Months", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("Efficiency = km/h per bpm. A rising trend means you're running faster at the same heart rate — the core measure of aerobic improvement.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(validPoints) { pt in
                LineMark(
                    x: .value("Week", pt.weekStart),
                    y: .value("Efficiency", pt.efficiency)
                )
                .foregroundStyle(Color.orange.gradient)
                .interpolationMethod(.catmullRom)
                .symbol(Circle())
                .symbolSize(30)

                AreaMark(
                    x: .value("Week", pt.weekStart),
                    y: .value("Efficiency", pt.efficiency)
                )
                .foregroundStyle(Color.orange.opacity(0.08))
                .interpolationMethod(.catmullRom)
            }
            .frame(height: 130)
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear, count: 3)) { _ in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }

            if efficiencyTrend != 0 {
                Text(String(format: "Efficiency %@ by %.5f per CTL unit — %@",
                            efficiencyTrend > 0 ? "improving" : "declining",
                            abs(efficiencyTrend),
                            efficiencyTrend > 0 ? "your aerobic training is paying off." : "consider reviewing training specificity and recovery."))
                    .font(.caption2).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "chart.dots.scatter")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("Not enough data")
                .font(.headline)
            Text("You need at least 5 weeks of runs recorded on Apple Watch to build a CTL-performance correlation. Keep training!")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal)
        }
        .padding(40)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Performance Science", systemImage: "flask.fill")
                .font(.subheadline).bold()
            Text("Bannister 1991 Fitness-Fatigue Model: Performance = CTL − ATL. After a building phase (negative TSB), performance peaks when TSB returns to +10 to +25 — the tapering window. This is why athletes race faster after a 2-week taper despite doing less training.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Lucia et al. 2000 (Med Sci Sports Exerc): running economy (HR efficiency) explains 65–78% of endurance performance variance when VO₂ max is controlled. Improving economy at sub-maximal paces is the hallmark of aerobic training adaptation.")
                .font(.caption).foregroundStyle(.secondary)
            Text("If CTL-performance correlation (r) is low, consider: training specificity (do your runs match your race needs?), recovery quality (are you adapting or just accumulating fatigue?), or test if you're in a plateau requiring stimulation change.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.purple.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
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

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let workoutType = HKObjectType.workoutType()
        let hrType      = HKQuantityType(.heartRate)
        let distType    = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, hrType, distType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .month, value: -7, to: end)!  // extra month for CTL warmup

        var allWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: HKObjectQueryNoLimit,
                                   sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                allWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        computeCorrelation(workouts: allWorkouts, end: end)
        isLoading = false
    }

    private func computeCorrelation(workouts: [HKWorkout], end: Date) {
        let hrUnit  = HKUnit.count().unitDivided(by: .minute())
        let kmUnit  = HKUnit.meterUnit(with: .kilo)
        let eCtl    = exp(-1.0 / 42.0)
        let eAtl    = exp(-1.0 / 7.0)
        let kCalScale = 1.0 / 500.0

        var ctl = 0.0, atl = 0.0

        // Group workouts by day
        let grouped = Dictionary(grouping: workouts) { w in
            calendar.startOfDay(for: w.startDate)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"

        func weekStart(for date: Date) -> Date {
            calendar.nextDate(after: date, matching: DateComponents(weekday: 2),
                              matchingPolicy: .previousTimePreservingSmallerComponents,
                              direction: .backward) ?? calendar.startOfDay(for: date)
        }

        var weekCTL: [Date: Double] = [:]
        var weekATL: [Date: Double] = [:]
        var weekEff: [Date: [Double]] = [:]
        var weekRuns: [Date: Int] = [:]

        var cursor = calendar.startOfDay(for: workouts.first?.startDate ?? end)
        while cursor <= end {
            let dayWorkouts = grouped[cursor] ?? []
            let dayTSS = dayWorkouts.map { w -> Double in
                let kcal = w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
                return kcal * kCalScale
            }.reduce(0, +)
            ctl = eCtl * ctl + (1 - eCtl) * dayTSS
            atl = eAtl * atl + (1 - eAtl) * dayTSS

            let ws = weekStart(for: cursor)
            weekCTL[ws] = ctl
            weekATL[ws] = atl

            // Running efficiency this day
            let runs = dayWorkouts.filter { $0.workoutActivityType == .running }
            for r in runs {
                guard let avgHR = r.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: hrUnit),
                      avgHR > 80,
                      let distKm = r.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: kmUnit),
                      distKm > 1 else { continue }
                let paceKmH = distKm / (r.duration / 3600)
                guard paceKmH > 4 && paceKmH < 25 else { continue }
                weekEff[ws, default: []].append(paceKmH / avgHR)
                weekRuns[ws, default: 0] += 1
            }

            cursor = calendar.date(byAdding: .day, value: 1, to: cursor)!
        }

        // Build week points (discard first month = CTL warmup)
        let warmupEnd = calendar.date(byAdding: .month, value: 1, to: workouts.first?.startDate ?? end)!
        let allWeeks = weekCTL.keys.sorted().filter { $0 >= weekStart(for: warmupEnd) }
        let built: [WeekPoint] = allWeeks.map { ws in
            let c = weekCTL[ws] ?? 0
            let a = weekATL[ws] ?? 0
            let effVals = weekEff[ws] ?? []
            let avgEff  = effVals.isEmpty ? 0 : effVals.reduce(0, +) / Double(effVals.count)
            return WeekPoint(weekStart: ws, weekLabel: fmt.string(from: ws),
                              ctl: c, tsb: c - a, efficiency: avgEff,
                              runSessions: weekRuns[ws] ?? 0)
        }

        let r = pearsonR(xs: built.filter { $0.efficiency > 0 }.map(\.ctl),
                         ys: built.filter { $0.efficiency > 0 }.map(\.efficiency))

        // Optimal TSB: the TSB at which efficiency is highest (from available data)
        let runWeeks = built.filter { $0.efficiency > 0 }
        let optTSB = runWeeks.max(by: { $0.efficiency < $1.efficiency })?.tsb ?? 0

        // Efficiency vs CTL slope (linear regression)
        let slope = linearSlope(xs: runWeeks.map(\.ctl), ys: runWeeks.map(\.efficiency))

        DispatchQueue.main.async {
            self.weekPoints   = built
            self.ctlEfficiencyR = r
            self.tsbOptimal   = optTSB
            self.efficiencyTrend = slope
        }
    }

    private func pearsonR(xs: [Double], ys: [Double]) -> Double {
        guard xs.count >= 4 else { return 0 }
        let n = Double(xs.count)
        let meanX = xs.reduce(0, +) / n; let meanY = ys.reduce(0, +) / n
        let num   = zip(xs, ys).map { ($0 - meanX) * ($1 - meanY) }.reduce(0, +)
        let denX  = sqrt(xs.map { pow($0 - meanX, 2) }.reduce(0, +))
        let denY  = sqrt(ys.map { pow($0 - meanY, 2) }.reduce(0, +))
        return (denX * denY) == 0 ? 0 : num / (denX * denY)
    }

    private func linearSlope(xs: [Double], ys: [Double]) -> Double {
        guard xs.count >= 3 else { return 0 }
        let n    = Double(xs.count)
        let meanX = xs.reduce(0, +) / n
        let meanY = ys.reduce(0, +) / n
        let num   = zip(xs, ys).map { ($0 - meanX) * ($1 - meanY) }.reduce(0, +)
        let den   = xs.map { pow($0 - meanX, 2) }.reduce(0, +)
        return den == 0 ? 0 : num / den
    }
}
