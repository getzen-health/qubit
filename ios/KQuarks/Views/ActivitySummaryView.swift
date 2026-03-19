import SwiftUI
import Charts
import HealthKit

// MARK: - Models

private struct DayActivity: Identifiable {
    let id = UUID()
    let date: Date
    let steps: Int
    let calories: Int
    let distanceKm: Double
    let exerciseMinutes: Int
    let floors: Int

    var isToday: Bool { Calendar.current.isDateInToday(date) }
}

private struct WeekSummary {
    let totalSteps: Int
    let totalCalories: Int
    let totalDistanceKm: Double
    let totalExerciseMinutes: Int
    let totalFloors: Int
    let activeDays: Int      // days with >2000 steps
    let peakStepsDay: DayActivity?
}

// MARK: - ActivitySummaryView

struct ActivitySummaryView: View {
    @State private var thisWeek: [DayActivity] = []
    @State private var lastWeek: [DayActivity] = []
    @State private var last28: [DayActivity] = []  // for 4-week trend
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared
    private let stepGoal = 7500

    private var thisWeekSummary: WeekSummary { summary(of: thisWeek) }
    private var lastWeekSummary: WeekSummary { summary(of: lastWeek) }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                } else if thisWeek.isEmpty {
                    emptyState
                } else {
                    comparisonHeader
                    metricsGrid
                    dailyStepsChart
                    streakCard
                    fourWeekTrend
                    goalProgressCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Activity Summary")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Comparison Header

    private var comparisonHeader: some View {
        VStack(spacing: 4) {
            Text("This Week vs Last Week")
                .font(.subheadline.weight(.semibold))
            let stepDiff = thisWeekSummary.totalSteps - lastWeekSummary.totalSteps
            let pct = lastWeekSummary.totalSteps > 0
                ? Int((Double(stepDiff) / Double(lastWeekSummary.totalSteps)) * 100)
                : 0
            HStack(spacing: 4) {
                Image(systemName: stepDiff >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                    .foregroundStyle(stepDiff >= 0 ? .green : .red)
                Text(stepDiff >= 0 ? "+\(pct)% steps vs last week" : "\(pct)% fewer steps vs last week")
                    .font(.caption)
                    .foregroundStyle(stepDiff >= 0 ? .green : .secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Metrics Grid

    private var metricsGrid: some View {
        let tw = thisWeekSummary
        let lw = lastWeekSummary
        return VStack(spacing: 10) {
            HStack(spacing: 10) {
                metricCompare(
                    icon: "figure.walk", color: .blue,
                    label: "Steps",
                    thisVal: formatNum(tw.totalSteps), lastVal: formatNum(lw.totalSteps),
                    better: tw.totalSteps >= lw.totalSteps
                )
                metricCompare(
                    icon: "flame.fill", color: .orange,
                    label: "Calories",
                    thisVal: "\(tw.totalCalories) cal", lastVal: "\(lw.totalCalories) cal",
                    better: tw.totalCalories >= lw.totalCalories
                )
            }
            HStack(spacing: 10) {
                metricCompare(
                    icon: "map.fill", color: .green,
                    label: "Distance",
                    thisVal: String(format: "%.1f km", tw.totalDistanceKm),
                    lastVal: String(format: "%.1f km", lw.totalDistanceKm),
                    better: tw.totalDistanceKm >= lw.totalDistanceKm
                )
                metricCompare(
                    icon: "timer", color: .purple,
                    label: "Exercise",
                    thisVal: "\(tw.totalExerciseMinutes) min", lastVal: "\(lw.totalExerciseMinutes) min",
                    better: tw.totalExerciseMinutes >= lw.totalExerciseMinutes
                )
            }
        }
    }

    private func metricCompare(icon: String, color: Color, label: String,
                               thisVal: String, lastVal: String, better: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon).foregroundStyle(color).font(.caption)
                Text(label).font(.caption2).foregroundStyle(.secondary)
                Spacer()
                Image(systemName: better ? "arrow.up" : "arrow.down")
                    .font(.caption2)
                    .foregroundStyle(better ? .green : .red)
            }
            Text(thisVal)
                .font(.subheadline.bold().monospacedDigit())
            Text("vs \(lastVal)")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Daily Steps Chart

    private var dailyStepsChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Daily Steps — Last 7 Days")
                .font(.headline)
                .padding(.horizontal, 4)

            let days = thisWeek.sorted { $0.date < $1.date }
            Chart {
                RuleMark(y: .value("Goal", stepGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5]))
                    .foregroundStyle(Color.blue.opacity(0.5))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Goal")
                            .font(.caption2)
                            .foregroundStyle(.blue.opacity(0.7))
                    }

                ForEach(days) { day in
                    BarMark(
                        x: .value("Day", day.date, unit: .day),
                        y: .value("Steps", day.steps)
                    )
                    .foregroundStyle(
                        day.steps >= stepGoal
                            ? Color.green.gradient
                            : day.isToday
                                ? Color.blue.gradient
                                : Color.blue.opacity(0.5).gradient
                    )
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { val in
                    if let d = val.as(Date.self) {
                        AxisValueLabel {
                            Text(d, format: .dateTime.weekday(.abbreviated))
                                .font(.caption2)
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    if let v = val.as(Int.self) {
                        AxisValueLabel { Text("\(v / 1000)k") }
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            if let peak = thisWeekSummary.peakStepsDay {
                Text("🏆 Best day: \(peak.date, format: .dateTime.weekday(.wide)) with \(formatNum(peak.steps)) steps")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }
        }
    }

    // MARK: - Streak Card

    private var streakCard: some View {
        let streak = computeStreak()
        let activeDays = thisWeekSummary.activeDays

        return HStack(spacing: 16) {
            VStack(spacing: 4) {
                Text("\(streak)")
                    .font(.system(size: 36, weight: .black, design: .rounded))
                    .foregroundStyle(.orange)
                Text("Day Streak")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Divider().frame(height: 50)

            VStack(spacing: 4) {
                Text("\(activeDays)/7")
                    .font(.system(size: 36, weight: .black, design: .rounded))
                    .foregroundStyle(.blue)
                Text("Active Days")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Divider().frame(height: 50)

            VStack(spacing: 4) {
                Text("\(thisWeek.filter { $0.steps >= stepGoal }.count)/7")
                    .font(.system(size: 36, weight: .black, design: .rounded))
                    .foregroundStyle(.green)
                Text("Goal Days")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - 4-Week Trend

    private var fourWeekTrend: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("4-Week Step Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            let weeklyData = computeWeeklyTotals()
            Chart {
                ForEach(weeklyData.indices, id: \.self) { i in
                    BarMark(
                        x: .value("Week", weeklyData[i].label),
                        y: .value("Steps", weeklyData[i].steps)
                    )
                    .foregroundStyle(i == weeklyData.count - 1 ? Color.blue.gradient : Color.indigo.opacity(0.5).gradient)
                    .cornerRadius(4)
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    if let v = val.as(Int.self) {
                        AxisValueLabel { Text("\(v / 1000)k") }
                    }
                }
            }
            .frame(height: 120)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Goal Progress

    private var goalProgressCard: some View {
        let weeklyGoal = stepGoal * 7
        let progress = Double(thisWeekSummary.totalSteps) / Double(weeklyGoal)
        let remaining = max(0, weeklyGoal - thisWeekSummary.totalSteps)

        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Weekly Goal Progress")
                    .font(.headline)
                Spacer()
                Text("\(Int(min(progress, 1) * 100))%")
                    .font(.subheadline.bold())
                    .foregroundStyle(progress >= 1 ? .green : .blue)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6).fill(Color(.systemGray5)).frame(height: 12)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(progress >= 1 ? Color.green : Color.blue)
                        .frame(width: geo.size.width * min(CGFloat(progress), 1.0), height: 12)
                }
            }
            .frame(height: 12)

            HStack {
                Text("\(formatNum(thisWeekSummary.totalSteps)) / \(formatNum(weeklyGoal)) steps")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                if remaining > 0 {
                    Text("\(formatNum(remaining)) to go")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Text("Goal reached! 🎉")
                        .font(.caption)
                        .foregroundStyle(.green)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.walk.circle")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No activity data")
                .font(.title3.bold())
            Text("Make sure HealthKit access is enabled to see your activity summary.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let cal = Calendar.current
        let today = Date()

        // This week: Mon–today
        var weekStart = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: today)
        weekStart.weekday = 2  // Monday
        let thisMonday = cal.date(from: weekStart) ?? today
        let lastMonday = cal.date(byAdding: .day, value: -7, to: thisMonday)!
        let fourWeeksAgo = cal.date(byAdding: .day, value: -28, to: thisMonday)!

        async let stepsThis  = try? healthKit.fetchDailyStats(for: .stepCount,        from: thisMonday,  to: today, isDiscrete: false)
        async let calsThis   = try? healthKit.fetchDailyStats(for: .activeEnergyBurned, from: thisMonday, to: today, isDiscrete: false)
        async let distThis   = try? healthKit.fetchDailyStats(for: .distanceWalkingRunning, from: thisMonday, to: today, isDiscrete: false)
        async let exThis     = try? healthKit.fetchDailyStats(for: .appleExerciseTime, from: thisMonday,  to: today, isDiscrete: false)
        async let floorsThis = try? healthKit.fetchDailyStats(for: .flightsClimbed,   from: thisMonday,  to: today, isDiscrete: false)

        async let stepsLast  = try? healthKit.fetchDailyStats(for: .stepCount,        from: lastMonday,  to: thisMonday, isDiscrete: false)
        async let calsLast   = try? healthKit.fetchDailyStats(for: .activeEnergyBurned, from: lastMonday, to: thisMonday, isDiscrete: false)
        async let distLast   = try? healthKit.fetchDailyStats(for: .distanceWalkingRunning, from: lastMonday, to: thisMonday, isDiscrete: false)
        async let exLast     = try? healthKit.fetchDailyStats(for: .appleExerciseTime, from: lastMonday,  to: thisMonday, isDiscrete: false)
        async let floorsLast = try? healthKit.fetchDailyStats(for: .flightsClimbed,   from: lastMonday,  to: thisMonday, isDiscrete: false)

        async let steps28    = try? healthKit.fetchDailyStats(for: .stepCount,        from: fourWeeksAgo, to: today, isDiscrete: false)
        async let cals28     = try? healthKit.fetchDailyStats(for: .activeEnergyBurned, from: fourWeeksAgo, to: today, isDiscrete: false)
        async let dist28     = try? healthKit.fetchDailyStats(for: .distanceWalkingRunning, from: fourWeeksAgo, to: today, isDiscrete: false)
        async let ex28       = try? healthKit.fetchDailyStats(for: .appleExerciseTime, from: fourWeeksAgo, to: today, isDiscrete: false)
        async let floors28   = try? healthKit.fetchDailyStats(for: .flightsClimbed,   from: fourWeeksAgo, to: today, isDiscrete: false)

        let (sT, cT, dT, eT, fT) = await (stepsThis ?? [:], calsThis ?? [:], distThis ?? [:], exThis ?? [:], floorsThis ?? [:])
        let (sL, cL, dL, eL, fL) = await (stepsLast ?? [:], calsLast ?? [:], distLast ?? [:], exLast ?? [:], floorsLast ?? [:])
        let (s28, c28, d28, e28, f28) = await (steps28 ?? [:], cals28 ?? [:], dist28 ?? [:], ex28 ?? [:], floors28 ?? [:])

        thisWeek = buildDays(from: sT, cals: cT, dist: dT, ex: eT, floors: fT, start: thisMonday, end: today)
        lastWeek = buildDays(from: sL, cals: cL, dist: dL, ex: eL, floors: fL, start: lastMonday, end: thisMonday)
        last28   = buildDays(from: s28, cals: c28, dist: d28, ex: e28, floors: f28, start: fourWeeksAgo, end: today)
    }

    // MARK: - Helpers

    private func buildDays(from steps: [Date: Double], cals: [Date: Double], dist: [Date: Double],
                           ex: [Date: Double], floors: [Date: Double],
                           start: Date, end: Date) -> [DayActivity] {
        var days: [DayActivity] = []
        let cal = Calendar.current
        var current = start
        while current <= end {
            let daySteps = Int(closestValue(in: steps, to: current) ?? 0)
            if daySteps >= 0 {
                days.append(DayActivity(
                    date: current,
                    steps: daySteps,
                    calories: Int(closestValue(in: cals, to: current) ?? 0),
                    distanceKm: (closestValue(in: dist, to: current) ?? 0) / 1000,
                    exerciseMinutes: Int(closestValue(in: ex, to: current) ?? 0),
                    floors: Int(closestValue(in: floors, to: current) ?? 0)
                ))
            }
            current = cal.date(byAdding: .day, value: 1, to: current) ?? current.addingTimeInterval(86400)
        }
        return days
    }

    private func closestValue(in dict: [Date: Double], to date: Date) -> Double? {
        let cal = Calendar.current
        return dict.first { cal.isDate($0.key, inSameDayAs: date) }?.value
    }

    private func summary(of days: [DayActivity]) -> WeekSummary {
        WeekSummary(
            totalSteps: days.reduce(0) { $0 + $1.steps },
            totalCalories: days.reduce(0) { $0 + $1.calories },
            totalDistanceKm: days.reduce(0.0) { $0 + $1.distanceKm },
            totalExerciseMinutes: days.reduce(0) { $0 + $1.exerciseMinutes },
            totalFloors: days.reduce(0) { $0 + $1.floors },
            activeDays: days.filter { $0.steps > 2000 }.count,
            peakStepsDay: days.max(by: { $0.steps < $1.steps })
        )
    }

    private func computeStreak() -> Int {
        let cal = Calendar.current
        let allDays = last28.sorted { $0.date > $1.date }
        var streak = 0
        var checkDate = Date()
        for day in allDays {
            if cal.isDate(day.date, inSameDayAs: checkDate) || day.date < checkDate {
                if day.steps >= stepGoal {
                    streak += 1
                    checkDate = cal.date(byAdding: .day, value: -1, to: day.date) ?? day.date
                } else if !cal.isDateInToday(day.date) {
                    break
                }
            }
        }
        return streak
    }

    private func computeWeeklyTotals() -> [(label: String, steps: Int)] {
        let cal = Calendar.current
        let today = Date()
        var result: [(label: String, steps: Int)] = []
        for weekOffset in [-3, -2, -1, 0] {
            let weekStart = cal.date(byAdding: .weekOfYear, value: weekOffset, to: today) ?? today
            let weekEnd   = cal.date(byAdding: .day, value: 7, to: weekStart) ?? weekStart
            let weekDays = last28.filter { $0.date >= weekStart && $0.date < weekEnd }
            let total = weekDays.reduce(0) { $0 + $1.steps }
            let label = weekOffset == 0 ? "This\nWeek" : "\(abs(weekOffset))w\nago"
            result.append((label: label, steps: total))
        }
        return result
    }

    private func formatNum(_ n: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: n)) ?? "\(n)"
    }
}

#Preview {
    NavigationStack { ActivitySummaryView() }
}
