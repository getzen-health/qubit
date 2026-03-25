import SwiftUI
import HealthKit
import Charts

// MARK: - SleepTrainingBalanceView
// Analyzes the tradeoff between weekly training volume and sleep duration.
// Research shows heavy training blocks often compress sleep time, and sleep deprivation
// directly impairs recovery, performance, and injury risk.
// Science:
//   Mah et al. 2011 (Sleep): extending sleep to 10h/night improved athletic performance 9%.
//   Sargent et al. 2014 (Br J Sports Med): heavy training blocks reduce sleep 30+ min/night.
//   Lastella et al. 2018 (Int J Sport Physiol Perform): elite athletes sleep <7h during peak load.
//   Fullagar et al. 2015 (Sports Medicine): sleep deprivation reduces endurance performance 3–8%.
//   Dattilo et al. 2011 (Med Hypotheses): sleep debt ↓ anabolic hormone + ↑ catabolic → impairs adaptation.
//
// Balance score: penalizes heavy training weeks with inadequate sleep (<7h avg).
// Sweet spot: 6–10h training + ≥7.5h sleep = balanced training stimulus with recovery.

struct SleepTrainingBalanceView: View {

    // MARK: - Models

    struct WeekBalance: Identifiable {
        let id = UUID()
        let weekStart: Date
        let weekLabel: String
        let trainingHours: Double      // total workout time this week
        let avgSleepHours: Double      // avg sleep duration this week (0 = no data)
        let sleepSessions: Int
        var balanceScore: Double {
            // Ideal: 6–10h training + ≥7.5h sleep → 100
            let sleepScore: Double = avgSleepHours <= 0 ? 50 : min(100, (avgSleepHours / 7.5) * 80)
            // Training score: up to 10h training gets full marks, >10h slight penalty
            let trainScore: Double = trainingHours > 10 ? max(0, 80 - (trainingHours - 10) * 5)
                                   : trainingHours > 0 ? min(80, trainingHours * 8) : 0
            return (sleepScore * 0.6 + trainScore * 0.4).clamped(to: 0...100)
        }
        var status: BalanceStatus {
            guard avgSleepHours > 0 else { return .noSleepData }
            if avgSleepHours >= 7.5 && trainingHours <= 10 { return .optimal }
            if avgSleepHours >= 7 && trainingHours <= 12   { return .adequate }
            if avgSleepHours < 7 && trainingHours > 8      { return .overtaxed }
            if avgSleepHours < 6.5                         { return .sleepDeprived }
            return .adequate
        }
    }

    enum BalanceStatus: String {
        case optimal      = "Optimal"
        case adequate     = "Adequate"
        case overtaxed    = "Overtaxed"
        case sleepDeprived = "Sleep-Deprived"
        case noSleepData  = "No Sleep Data"

        var color: Color {
            switch self {
            case .optimal:       return .green
            case .adequate:      return .blue
            case .overtaxed:     return .orange
            case .sleepDeprived: return .red
            case .noSleepData:   return .secondary
            }
        }

        var message: String {
            switch self {
            case .optimal:       return "Training load and sleep are well balanced — ideal for adaptation."
            case .adequate:      return "Good balance. Minor adjustments could optimize recovery."
            case .overtaxed:     return "High training volume with insufficient sleep — recovery is compromised. Reduce load or prioritize sleep."
            case .sleepDeprived: return "Chronic sleep deprivation detected. Sleep < 7h severely impairs muscle repair and hormonal recovery (Dattilo 2011)."
            case .noSleepData:   return "Record sleep with Apple Watch to see balance analysis."
            }
        }
    }

    // MARK: - State

    @State private var weeks: [WeekBalance] = []
    @State private var correlationR: Double = 0   // Pearson r between training hours and sleep hours
    @State private var isLoading = true

    private var sleepDomain: ClosedRange<Double> {
        let sleepVals = weeks.map(\.avgSleepHours).filter { $0 > 0 }
        let lo = sleepVals.min().map { max(3.0, $0 - 0.5) } ?? 4.0
        let hi = sleepVals.max().map { max(10.0, $0 + 0.5) } ?? 10.0
        return lo...hi
    }

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analyzing sleep-training balance…")
                        .padding(.top, 60)
                } else {
                    if let latest = weeks.last {
                        statusCard(latest)
                    }
                    dualLineChart
                    scatterCard
                    weeklyTableCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Sleep-Training Balance")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Status Card

    private func statusCard(_ w: WeekBalance) -> some View {
        VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: String(format: "%.1fh", w.trainingHours),
                    label: "Training This Week",
                    sub: "workout hours",
                    color: w.trainingHours > 10 ? .orange : .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: w.avgSleepHours > 0 ? String(format: "%.1fh", w.avgSleepHours) : "—",
                    label: "Avg Sleep",
                    sub: "per night",
                    color: w.avgSleepHours >= 7.5 ? .green : (w.avgSleepHours >= 6.5 ? .yellow : .red)
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.0f", w.balanceScore),
                    label: "Balance Score",
                    sub: "out of 100",
                    color: w.status.color
                )
            }
            .padding(.vertical, 12)

            HStack(spacing: 6) {
                Circle()
                    .fill(w.status.color)
                    .frame(width: 8, height: 8)
                Text(w.status.message)
                    .font(.caption)
                    .foregroundStyle(w.status.color)
            }
            .padding(.horizontal)
            .padding(.bottom, 10)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Dual Line Chart

    private var dualLineChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Training Hours vs Sleep — 12 Weeks", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("Weeks with high training volume often show compressed sleep. Watch for inverse correlation — when training spikes, ensure sleep is protected.")
                .font(.caption2).foregroundStyle(.secondary)

            let validWeeks = weeks.filter { $0.avgSleepHours > 0 }
            if !validWeeks.isEmpty {
                Chart {
                    ForEach(validWeeks) { w in
                        LineMark(
                            x: .value("Week", w.weekStart),
                            y: .value("Training (h)", w.trainingHours),
                            series: .value("Metric", "Training")
                        )
                        .foregroundStyle(Color.blue)
                        .symbol(Circle())
                        .symbolSize(30)

                        AreaMark(
                            x: .value("Week", w.weekStart),
                            y: .value("Training (h)", w.trainingHours)
                        )
                        .foregroundStyle(Color.blue.opacity(0.08))
                    }

                    ForEach(validWeeks) { w in
                        LineMark(
                            x: .value("Week", w.weekStart),
                            y: .value("Sleep (h)", w.avgSleepHours),
                            series: .value("Metric", "Sleep")
                        )
                        .foregroundStyle(Color.green)
                        .symbol(Circle())
                        .symbolSize(30)
                    }

                    // 7.5h sleep target line
                    RuleMark(y: .value("Target", 7.5))
                        .foregroundStyle(Color.green.opacity(0.4))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .annotation(position: .trailing, alignment: .leading) {
                            Text("7.5h").font(.caption2).foregroundStyle(.green)
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

                HStack(spacing: 16) {
                    legendLine(color: .blue,  label: "Training hours")
                    legendLine(color: .green, label: "Avg sleep hours")
                }
                .font(.caption2)

                if abs(correlationR) > 0.2 {
                    Text(String(format: "Correlation (r = %.2f): %@", correlationR,
                                correlationR < -0.3 ? "Training and sleep are inversely correlated — busy weeks compress sleep." :
                                correlationR > 0.3 ? "Training and sleep move together — you tend to sleep more on active weeks." :
                                "Weak correlation between training load and sleep duration."))
                        .font(.caption2).foregroundStyle(.secondary).italic()
                }
            } else {
                Text("No Apple Watch sleep data found for the past 12 weeks. Enable sleep tracking to see balance analysis.")
                    .font(.caption).foregroundStyle(.secondary).italic()
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Scatter Card

    private var scatterCard: some View {
        let validWeeks = weeks.filter { $0.avgSleepHours > 0 }
        return VStack(alignment: .leading, spacing: 10) {
            Label("Training Load vs Sleep Scatter", systemImage: "chart.dots.scatter")
                .font(.subheadline).bold()
            Text("Each dot = one week. X = training hours, Y = avg sleep. Bottom-right = overtaxed (high training, low sleep). Top-left = undertraining with long sleep.")
                .font(.caption2).foregroundStyle(.secondary)

            if !validWeeks.isEmpty {
                Chart {
                    // Quadrant backgrounds (simplified — just reference lines)
                    RuleMark(y: .value("7.5h target", 7.5))
                        .foregroundStyle(Color.green.opacity(0.3))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    RuleMark(x: .value("10h training", 10.0))
                        .foregroundStyle(Color.orange.opacity(0.3))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))

                    ForEach(validWeeks) { w in
                        PointMark(
                            x: .value("Training (h)", w.trainingHours),
                            y: .value("Sleep (h)", w.avgSleepHours)
                        )
                        .foregroundStyle(w.status.color)
                        .symbolSize(70)
                    }
                }
                .frame(height: 160)
                .chartXAxisLabel("Weekly Training Hours")
                .chartYAxisLabel("Avg Sleep (h)")
                .chartXScale(domain: 0...(weeks.map(\.trainingHours).max() ?? 12) + 2)
                .chartYScale(domain: sleepDomain)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Weekly Table

    private var weeklyTableCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Weekly Breakdown", systemImage: "tablecells")
                .font(.subheadline).bold()

            ForEach(weeks.suffix(8).reversed()) { w in
                HStack {
                    Text(w.weekLabel).font(.caption2).foregroundStyle(.secondary).frame(width: 48, alignment: .leading)
                    Spacer()
                    Text(String(format: "%.1fh train", w.trainingHours)).font(.caption2).foregroundStyle(.blue)
                    Spacer()
                    if w.avgSleepHours > 0 {
                        Text(String(format: "%.1fh sleep", w.avgSleepHours)).font(.caption2).foregroundStyle(.green)
                    } else {
                        Text("no sleep data").font(.caption2).foregroundStyle(.tertiary)
                    }
                    Spacer()
                    Text(w.status.rawValue)
                        .font(.caption2.bold())
                        .foregroundStyle(w.status.color)
                }
                if w.id != weeks.suffix(8).reversed().last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Sleep-Training Science", systemImage: "moon.stars.fill")
                .font(.subheadline).bold()
            Text("Mah et al. 2011 (Sleep): Stanford athletes who extended sleep to 10h/night for 5-7 weeks improved sprint times 4%, free-throw accuracy 9%, and reaction time significantly. Sleep extension is a performance enhancer.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Sargent et al. 2014 (Br J Sports Med): heavy training blocks reduced athlete sleep duration 30+ min/night due to early sessions and recovery fatigue. Schedule sleep like training — block it in the calendar.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Dattilo et al. 2011 (Med Hypotheses): chronic sleep restriction (<7h) elevates cortisol and reduces testosterone and GH, directly impairing the anabolic signaling required for muscle adaptation. Recovery requires both rest and sleep.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.indigo.opacity(0.07))
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

    private func legendLine(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 1).fill(color).frame(width: 14, height: 2)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let workoutType  = HKObjectType.workoutType()
        let sleepType    = HKCategoryType(.sleepAnalysis)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, sleepType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .weekOfYear, value: -12, to: end) ?? Date()

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        var rawSleep: [HKSample] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: sleepType, predicate: pred,
                                   limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                rawSleep = s ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        let computed = buildWeeks(workouts: rawWorkouts, sleepSamples: rawSleep, start: start, end: end)
        let r = pearsonR(xs: computed.map(\.trainingHours), ys: computed.map(\.avgSleepHours))

        DispatchQueue.main.async {
            self.weeks       = computed
            self.correlationR = r
            self.isLoading   = false
        }
    }

    private func buildWeeks(workouts: [HKWorkout], sleepSamples: [HKSample], start: Date, end: Date) -> [WeekBalance] {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        func weekStart(for date: Date) -> Date {
            calendar.nextDate(after: date, matching: DateComponents(weekday: 2),
                              matchingPolicy: .previousTimePreservingSmallerComponents,
                              direction: .backward) ?? calendar.startOfDay(for: date)
        }

        // Workout hours per week
        var trainingMap: [Date: Double] = [:]
        for w in workouts {
            let ws = weekStart(for: w.startDate)
            trainingMap[ws, default: 0] += w.duration / 3600
        }

        // Sleep hours per day (asleep samples only)
        var dailySleep: [Date: Double] = [:]
        for s in sleepSamples {
            guard let cat = s as? HKCategorySample else { continue }
            let isAsleep: Bool
            switch HKCategoryValueSleepAnalysis(rawValue: cat.value) {
            case .asleepCore, .asleepDeep, .asleepREM, .asleepUnspecified: isAsleep = true
            default: isAsleep = false
            }
            guard isAsleep else { continue }
            let day = calendar.startOfDay(for: cat.startDate)
            dailySleep[day, default: 0] += cat.endDate.timeIntervalSince(cat.startDate) / 3600
        }

        // Build week list (Monday-anchored)
        var result: [WeekBalance] = []
        var cursor = weekStart(for: start)
        while cursor <= end {
            let weekDays = (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: cursor) }
            let sleepVals = weekDays.compactMap { dailySleep[calendar.startOfDay(for: $0)] }.filter { $0 > 0 }
            let avgSleep  = sleepVals.isEmpty ? 0.0 : sleepVals.reduce(0, +) / Double(sleepVals.count)

            result.append(WeekBalance(
                weekStart: cursor,
                weekLabel: formatter.string(from: cursor),
                trainingHours: trainingMap[cursor] ?? 0,
                avgSleepHours: avgSleep,
                sleepSessions: sleepVals.count
            ))
            cursor = calendar.date(byAdding: .weekOfYear, value: 1, to: cursor) ?? Date()
        }
        return result
    }

    /// Simple Pearson correlation coefficient
    private func pearsonR(xs: [Double], ys: [Double]) -> Double {
        let pairs = zip(xs, ys).filter { $0.1 > 0 }
        guard pairs.count >= 4 else { return 0 }
        let n = Double(pairs.count)
        let xArr = pairs.map(\.0); let yArr = pairs.map(\.1)
        let meanX = xArr.reduce(0, +) / n; let meanY = yArr.reduce(0, +) / n
        let num = zip(xArr, yArr).map { ($0 - meanX) * ($1 - meanY) }.reduce(0, +)
        let denX = sqrt(xArr.map { pow($0 - meanX, 2) }.reduce(0, +))
        let denY = sqrt(yArr.map { pow($0 - meanY, 2) }.reduce(0, +))
        return (denX * denY) == 0 ? 0 : num / (denX * denY)
    }
}

private extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}
