import SwiftUI
import Charts
import HealthKit

// MARK: - Models

private struct MonthMetric {
    let total: Double
    let bestValue: Double
    let bestDate: Date?
    let activeDays: Int
}

private struct MonthSleepSummary {
    let totalNights: Int
    let avgDurationMinutes: Double
    let avgDeepMinutes: Double
    let avgRemMinutes: Double
    let bestNightMinutes: Int
    let bestNightDate: Date?
}

private struct DailyStepBar: Identifiable {
    let id = UUID()
    let date: Date
    let steps: Int
    let isGoalDay: Bool
}

// MARK: - MonthlyHealthSummaryView

struct MonthlyHealthSummaryView: View {
    @State private var isLoading = false

    // This month
    @State private var thisSteps: MonthMetric?
    @State private var thisCalories: MonthMetric?
    @State private var thisDistanceKm: MonthMetric?
    @State private var thisWorkoutCount = 0
    @State private var thisSleep: MonthSleepSummary?
    @State private var thisAvgHRV: Double?
    @State private var thisAvgRHR: Double?

    // Last month
    @State private var lastStepsTotal: Int = 0
    @State private var lastCaloriesTotal: Int = 0
    @State private var lastDistanceKm: Double = 0
    @State private var lastWorkoutCount = 0
    @State private var lastAvgSleepMin: Double = 0
    @State private var lastAvgHRV: Double?
    @State private var lastAvgRHR: Double?

    // Chart data
    @State private var dailySteps: [DailyStepBar] = []

    private let healthKit = HealthKitService.shared
    private let stepGoal = 7500
    private let cal = Calendar.current

    private var monthTitle: String {
        let fmt = DateFormatter()
        fmt.dateFormat = "MMMM yyyy"
        return fmt.string(from: Date())
    }

    private var lastMonthTitle: String {
        let fmt = DateFormatter()
        fmt.dateFormat = "MMMM"
        let start = lastMonthRange.start
        return fmt.string(from: start)
    }

    private var thisMonthRange: (start: Date, end: Date) {
        let now = Date()
        let start = cal.date(from: cal.dateComponents([.year, .month], from: now))!
        return (start, now)
    }

    private var lastMonthRange: (start: Date, end: Date) {
        let now = Date()
        let thisStart = cal.date(from: cal.dateComponents([.year, .month], from: now))!
        let lastStart = cal.date(byAdding: .month, value: -1, to: thisStart)!
        let lastEnd   = cal.date(byAdding: .second, value: -1, to: thisStart)!
        return (lastStart, lastEnd)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 80)
                } else {
                    monthHeaderCard
                    comparisonGrid
                    if !dailySteps.isEmpty {
                        dailyStepsChart
                    }
                    sleepCard
                    vitalsCard
                    bestDaysCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Monthly Summary")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Month Header

    private var monthHeaderCard: some View {
        VStack(spacing: 6) {
            Text(monthTitle)
                .font(.title2.bold())
            Text("vs \(lastMonthTitle)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Comparison Grid

    private var comparisonGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            comparisonCard(
                title: "Steps",
                icon: "figure.walk",
                color: .green,
                thisVal: thisSteps.map { Int($0.total) },
                lastVal: lastStepsTotal,
                format: { fmtInt($0) }
            )
            comparisonCard(
                title: "Calories",
                icon: "flame.fill",
                color: .orange,
                thisVal: thisCalories.map { Int($0.total) },
                lastVal: lastCaloriesTotal,
                format: { fmtInt($0) + " kcal" }
            )
            comparisonCard(
                title: "Distance",
                icon: "map.fill",
                color: .blue,
                thisVal: thisDistanceKm.map { Int($0.total) },
                lastVal: Int(lastDistanceKm),
                format: { String(format: "%.1f km", Double($0)) }
            )
            comparisonCard(
                title: "Workouts",
                icon: "dumbbell.fill",
                color: .red,
                thisVal: thisWorkoutCount,
                lastVal: lastWorkoutCount,
                format: { "\($0)" }
            )
        }
    }

    private func comparisonCard(
        title: String,
        icon: String,
        color: Color,
        thisVal: Int?,
        lastVal: Int,
        format: (Int) -> String
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption.bold())
                    .foregroundStyle(color)
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
            }

            if let v = thisVal {
                Text(format(v))
                    .font(.headline.monospacedDigit())
                    .foregroundStyle(.primary)

                let diff = lastVal > 0 ? Double(v - lastVal) / Double(lastVal) * 100 : 0
                HStack(spacing: 3) {
                    if lastVal > 0 {
                        Image(systemName: diff >= 0 ? "arrow.up" : "arrow.down")
                            .font(.caption2)
                            .foregroundStyle(diff >= 0 ? .green : .red)
                        Text(String(format: "%.0f%%", abs(diff)))
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(diff >= 0 ? .green : .red)
                        Text("vs \(lastMonthTitle)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("—")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                Text("—")
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Daily Steps Chart

    private var dailyStepsChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Daily Steps This Month")
                .font(.headline)
                .padding(.horizontal, 4)

            let maxSteps = dailySteps.map(\.steps).max() ?? stepGoal
            let yMax = max(maxSteps, stepGoal) + 1000

            Chart {
                RuleMark(y: .value("Goal", stepGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.secondary.opacity(0.6))

                ForEach(dailySteps) { bar in
                    BarMark(
                        x: .value("Day", bar.date, unit: .day),
                        y: .value("Steps", bar.steps)
                    )
                    .foregroundStyle(bar.isGoalDay ? Color.green : Color.green.opacity(0.35))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.day())
                }
            }
            .chartYScale(domain: 0...yMax)
            .frame(height: 180)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Sleep Card

    private var sleepCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image(systemName: "moon.fill")
                    .foregroundStyle(.indigo)
                Text("Sleep This Month")
                    .font(.headline)
            }

            if let s = thisSleep, s.totalNights > 0 {
                HStack(spacing: 0) {
                    sleepStat(label: "Nights", value: "\(s.totalNights)")
                    Divider().frame(height: 36)
                    sleepStat(label: "Avg Duration",
                              value: fmtDuration(Int(s.avgDurationMinutes)))
                    Divider().frame(height: 36)
                    sleepStat(label: "Avg Deep",
                              value: s.avgDeepMinutes > 0 ? "\(Int(s.avgDeepMinutes))m" : "—")
                    Divider().frame(height: 36)
                    sleepStat(label: "Avg REM",
                              value: s.avgRemMinutes > 0 ? "\(Int(s.avgRemMinutes))m" : "—")
                }

                if lastAvgSleepMin > 0 {
                    let diff = s.avgDurationMinutes - lastAvgSleepMin
                    HStack(spacing: 4) {
                        Image(systemName: diff >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                            .foregroundStyle(diff >= 0 ? .green : .orange)
                            .font(.caption)
                        Text(String(format: "%+.0f min avg vs \(lastMonthTitle)", diff))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                Text("No sleep data for this month")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func sleepStat(label: String, value: String) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Vitals Card

    private var vitalsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
                Text("Avg Vitals This Month")
                    .font(.headline)
            }

            HStack(spacing: 0) {
                vitalStat(label: "Avg HRV",
                          value: thisAvgHRV.map { "\(Int($0)) ms" } ?? "—",
                          delta: vitalDelta(this: thisAvgHRV, last: lastAvgHRV),
                          color: .purple)
                Divider().frame(height: 40)
                vitalStat(label: "Avg RHR",
                          value: thisAvgRHR.map { "\(Int($0)) bpm" } ?? "—",
                          delta: vitalDelta(this: thisAvgRHR, last: lastAvgRHR, lowerIsBetter: true),
                          color: .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func vitalStat(label: String, value: String, delta: String?, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            if let d = delta {
                Text(d)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
    }

    private func vitalDelta(this: Double?, last: Double?, lowerIsBetter: Bool = false) -> String? {
        guard let t = this, let l = last, l > 0 else { return nil }
        let diff = t - l
        let arrow = (diff >= 0) == !lowerIsBetter ? "↑" : "↓"
        return String(format: "%@%.0f vs \(lastMonthTitle)", arrow, abs(diff))
    }

    // MARK: - Best Days Card

    private var bestDaysCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Best Days This Month")
                .font(.headline)

            if let s = thisSteps, let d = s.bestDate {
                bestDayRow(icon: "figure.walk", color: .green,
                           label: "Most Steps",
                           value: fmtInt(Int(s.bestValue)),
                           date: d)
            }
            if let c = thisCalories, let d = c.bestDate {
                bestDayRow(icon: "flame.fill", color: .orange,
                           label: "Most Calories",
                           value: "\(fmtInt(Int(c.bestValue))) kcal",
                           date: d)
            }
            if let dist = thisDistanceKm, let d = dist.bestDate {
                bestDayRow(icon: "map.fill", color: .blue,
                           label: "Longest Distance",
                           value: String(format: "%.2f km", dist.bestValue),
                           date: d)
            }
            if let s = thisSleep, let d = s.bestNightDate {
                bestDayRow(icon: "moon.fill", color: .indigo,
                           label: "Best Sleep Night",
                           value: fmtDuration(s.bestNightMinutes),
                           date: d)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func bestDayRow(icon: String, color: Color, label: String, value: String, date: Date) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.body)
                .foregroundStyle(color)
                .frame(width: 32, height: 32)
                .background(color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.subheadline.bold())
            }

            Spacer()

            Text(date, format: .dateTime.month(.abbreviated).day())
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let (thisStart, thisEnd) = thisMonthRange
        let (lastStart, lastEnd) = lastMonthRange

        // Fetch this month & last month concurrently
        async let thisStepsData    = try? healthKit.fetchDailyStats(for: .stepCount, from: thisStart, to: thisEnd, isDiscrete: false)
        async let thisCalsData     = try? healthKit.fetchDailyStats(for: .activeEnergyBurned, from: thisStart, to: thisEnd, isDiscrete: false)
        async let thisDistData     = try? healthKit.fetchDailyStats(for: .distanceWalkingRunning, from: thisStart, to: thisEnd, isDiscrete: false)
        async let thisHRVData      = try? healthKit.fetchDailyStats(for: .heartRateVariabilitySDNN, from: thisStart, to: thisEnd, isDiscrete: true)
        async let thisRHRData      = try? healthKit.fetchDailyStats(for: .restingHeartRate, from: thisStart, to: thisEnd, isDiscrete: true)
        async let thisWorkouts     = try? healthKit.fetchWorkouts(from: thisStart, to: thisEnd)
        async let thisSleepRaw     = try? healthKit.fetchSleepAnalysis(from: thisStart, to: thisEnd)

        async let lastStepsData    = try? healthKit.fetchDailyStats(for: .stepCount, from: lastStart, to: lastEnd, isDiscrete: false)
        async let lastCalsData     = try? healthKit.fetchDailyStats(for: .activeEnergyBurned, from: lastStart, to: lastEnd, isDiscrete: false)
        async let lastDistData     = try? healthKit.fetchDailyStats(for: .distanceWalkingRunning, from: lastStart, to: lastEnd, isDiscrete: false)
        async let lastHRVData      = try? healthKit.fetchDailyStats(for: .heartRateVariabilitySDNN, from: lastStart, to: lastEnd, isDiscrete: true)
        async let lastRHRData      = try? healthKit.fetchDailyStats(for: .restingHeartRate, from: lastStart, to: lastEnd, isDiscrete: true)
        async let lastWorkoutsData = try? healthKit.fetchWorkouts(from: lastStart, to: lastEnd)
        async let lastSleepRaw     = try? healthKit.fetchSleepAnalysis(from: lastStart, to: lastEnd)

        let tSteps  = await thisStepsData  ?? [:]
        let tCals   = await thisCalsData   ?? [:]
        let tDist   = await thisDistData   ?? [:]
        let tHRV    = await thisHRVData    ?? [:]
        let tRHR    = await thisRHRData    ?? [:]
        let tWkts   = await thisWorkouts   ?? []
        let tSleep  = await thisSleepRaw   ?? []

        let lSteps  = await lastStepsData    ?? [:]
        let lCals   = await lastCalsData     ?? [:]
        let lDist   = await lastDistData     ?? [:]
        let lHRV    = await lastHRVData      ?? [:]
        let lRHR    = await lastRHRData      ?? [:]
        let lWkts   = await lastWorkoutsData ?? []
        let lSleep  = await lastSleepRaw     ?? []

        // ── This month metrics ───────────────────────────────────────────────
        thisSteps      = buildMonthMetric(from: tSteps)
        thisCalories   = buildMonthMetric(from: tCals)
        let distMetric = buildMonthMetric(from: tDist.mapValues { $0 / 1000 })  // m → km
        thisDistanceKm = distMetric
        thisWorkoutCount = tWkts.count
        thisAvgHRV     = average(of: tHRV)
        thisAvgRHR     = average(of: tRHR)
        thisSleep      = buildSleepSummary(from: tSleep)

        // ── Last month reference ─────────────────────────────────────────────
        lastStepsTotal    = Int(lSteps.values.reduce(0, +))
        lastCaloriesTotal = Int(lCals.values.reduce(0, +))
        lastDistanceKm    = lDist.values.reduce(0, +) / 1000
        lastWorkoutCount  = lWkts.count
        lastAvgHRV        = average(of: lHRV)
        lastAvgRHR        = average(of: lRHR)

        let lastSleepSummary = buildSleepSummary(from: lSleep)
        lastAvgSleepMin      = lastSleepSummary?.avgDurationMinutes ?? 0

        // ── Daily steps chart ────────────────────────────────────────────────
        dailySteps = tSteps.map { date, steps in
            DailyStepBar(date: date, steps: Int(steps), isGoalDay: Int(steps) >= stepGoal)
        }.sorted { $0.date < $1.date }
    }

    // MARK: - Helpers

    private func buildMonthMetric(from dict: [Date: Double]) -> MonthMetric? {
        guard !dict.isEmpty else { return nil }
        let total = dict.values.reduce(0, +)
        let best  = dict.max { $0.value < $1.value }
        return MonthMetric(
            total: total,
            bestValue: best?.value ?? 0,
            bestDate: best?.key,
            activeDays: dict.count
        )
    }

    private func buildSleepSummary(from samples: [HKCategorySample]) -> MonthSleepSummary? {
        guard !samples.isEmpty else { return nil }
        var byDay: [DateComponents: [HKCategorySample]] = [:]
        for s in samples {
            let key = cal.dateComponents([.year, .month, .day], from: s.endDate)
            byDay[key, default: []].append(s)
        }
        var nights: [(date: Date, total: Int, deep: Int, rem: Int)] = []
        for (comps, daySamples) in byDay {
            guard let date = cal.date(from: comps) else { continue }
            var deep = 0, rem = 0, core = 0
            for sample in daySamples {
                let mins = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                switch HKCategoryValueSleepAnalysis(rawValue: sample.value) {
                case .asleepDeep:                               deep += mins
                case .asleepREM:                                rem  += mins
                case .asleepCore, .asleepUnspecified:           core += mins
                default:                                        break
                }
            }
            let total = deep + rem + core
            guard total > 60 else { continue }
            nights.append((date, total, deep, rem))
        }
        guard !nights.isEmpty else { return nil }
        let avgDur  = Double(nights.map(\.total).reduce(0, +)) / Double(nights.count)
        let avgDeep = Double(nights.map(\.deep).reduce(0, +)) / Double(nights.count)
        let avgRem  = Double(nights.map(\.rem).reduce(0, +)) / Double(nights.count)
        let best    = nights.max { $0.total < $1.total }
        return MonthSleepSummary(
            totalNights: nights.count,
            avgDurationMinutes: avgDur,
            avgDeepMinutes: avgDeep,
            avgRemMinutes: avgRem,
            bestNightMinutes: best?.total ?? 0,
            bestNightDate: best?.date
        )
    }

    private func average(of dict: [Date: Double]) -> Double? {
        guard !dict.isEmpty else { return nil }
        return dict.values.reduce(0, +) / Double(dict.count)
    }

    private func fmtInt(_ n: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return f.string(from: NSNumber(value: n)) ?? "\(n)"
    }

    private func fmtDuration(_ minutes: Int) -> String {
        let h = minutes / 60, m = minutes % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }
}

#Preview {
    NavigationStack {
        MonthlyHealthSummaryView()
    }
}
