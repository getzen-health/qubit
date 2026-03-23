import SwiftUI
import Charts
import HealthKit

// MARK: - ActiveEnergyBudgetView

/// Tracks HKQuantityType(.activeEnergyBurned) — calories burned through movement
/// beyond the resting metabolic rate. This is the "Active Calories" Move ring on Apple Watch.
///
/// Evidence-based targets:
/// - ACSM: 150–400 kcal/day from moderate activity for cardiometabolic benefit
/// - Harvard Alumni Study: ≥1000 kcal/week active expenditure reduces all-cause
///   mortality by ~30% (Lee & Paffenbarger, 2000)
/// - Non-exercise activity thermogenesis (NEAT) contributes 200–500+ kcal/day
///   and is a major predictor of long-term weight management.
struct ActiveEnergyBudgetView: View {

    struct DayReading: Identifiable {
        let id: Date
        let date: Date
        let calories: Double
    }

    struct WeekBucket: Identifiable {
        let id: Date
        let weekStart: Date
        let total: Double
        var metGoal: Bool { total >= 3500 }
    }

    @State private var days: [DayReading] = []
    @State private var weeks: [WeekBucket] = []
    @State private var today: Double = 0
    @State private var avg30: Double = 0
    @State private var best30: Double = 0
    @State private var totalKcal: Double = 0
    @State private var daysMetGoal: Int = 0
    @State private var currentStreak: Int = 0
    @State private var dowAvg: [Double] = Array(repeating: 0, count: 7)
    @State private var isLoading = true

    private let dailyGoal: Double = 500
    private let weeklyGoal: Double = 3500
    private let healthStore = HKHealthStore()
    private let dowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

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
                    weeklyChart
                    dowChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Active Energy")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", today))
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(today >= dailyGoal ? .red : .secondary)
                        Text("kcal")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    Text(today >= dailyGoal ? "Move goal reached!" :
                         String(format: "%.0f kcal to goal", max(0, dailyGoal - today)))
                        .font(.subheadline)
                        .foregroundStyle(today >= dailyGoal ? .green : .secondary)
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(Color.red.opacity(0.15), lineWidth: 10)
                        .frame(width: 88, height: 88)
                    Circle()
                        .trim(from: 0, to: min(1.0, today / dailyGoal))
                        .stroke(Color.red, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 88, height: 88)
                    Image(systemName: "flame.fill")
                        .font(.title2).foregroundStyle(.red)
                }
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "30d Average", value: String(format: "%.0f kcal", avg30),
                         color: avg30 >= dailyGoal ? .green : .red)
                Divider().frame(height: 36)
                statCell(label: "Best Day (30d)", value: String(format: "%.0f kcal", best30), color: .red)
                Divider().frame(height: 36)
                statCell(label: "Days ≥500", value: "\(daysMetGoal)",
                         color: daysMetGoal >= 20 ? .green : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Streak", value: "\(currentStreak)d",
                         color: currentStreak >= 7 ? .green : .secondary)
            }
            Divider()
            Text(String(format: "Total (30d): %.0f kcal  ·  %.1f× weekly goal", totalKcal, totalKcal / weeklyGoal))
                .font(.caption).foregroundStyle(.secondary)
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

    // MARK: - 30-Day Trend

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day Active Calories").font(.headline)
            Chart {
                ForEach(days) { d in
                    BarMark(x: .value("Date", d.date),
                            y: .value("kcal", d.calories))
                    .foregroundStyle(dayBarColor(d.calories))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Goal", dailyGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("500").font(.caption2).foregroundStyle(.green)
                    }
                if avg30 > 0 {
                    RuleMark(y: .value("Avg", avg30))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
                        .foregroundStyle(Color.secondary.opacity(0.4))
                        .annotation(position: .trailing, alignment: .center) {
                            Text("avg").font(.caption2).foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("kcal")
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func dayBarColor(_ cal: Double) -> Color {
        if cal >= 700 { return Color.red.opacity(0.85) }
        if cal >= dailyGoal { return Color.red.opacity(0.6) }
        if cal >= 300 { return Color.red.opacity(0.35) }
        return Color.red.opacity(0.2)
    }

    // MARK: - Weekly Totals

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Totals").font(.headline)
            Text("Target: 3,500 kcal/week (500/day)").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(weeks) { w in
                    BarMark(x: .value("Week", w.weekStart, unit: .weekOfYear),
                            y: .value("Total", w.total))
                    .foregroundStyle(w.metGoal ? Color.red.opacity(0.75) : Color.red.opacity(0.35))
                    .cornerRadius(3)
                }
                RuleMark(y: .value("Goal", weeklyGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.5))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("kcal/week")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Day-of-Week Pattern

    private struct DOWEntry: Identifiable {
        let id: String; let day: String; let avg: Double
    }

    private func dowEntries() -> [DOWEntry] {
        zip(dowLabels, dowAvg).map { DOWEntry(id: $0, day: $0, avg: $1) }
    }

    private func dowBarColor(_ cal: Double) -> Color {
        cal >= dailyGoal ? Color.red.opacity(0.8) : Color.red.opacity(0.4)
    }

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Day-of-Week Pattern").font(.headline)
            Chart {
                ForEach(dowEntries()) { e in
                    BarMark(x: .value("Day", e.day),
                            y: .value("Avg kcal", e.avg))
                    .foregroundStyle(dowBarColor(e.avg))
                    .cornerRadius(4)
                }
                RuleMark(y: .value("Goal", dailyGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
            }
            .chartYAxisLabel("Avg kcal")
            .frame(height: 120)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "flame.fill").foregroundStyle(.red)
                Text("Active Energy Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                evidenceRow(stat: "≥1000 kcal/wk", detail: "Harvard Alumni Study: ≥1000 kcal/week in physical activity reduces all-cause mortality by ~30% (Lee & Paffenbarger, 2000)")
                evidenceRow(stat: "200 kcal/day", detail: "Minimum daily active expenditure for meaningful cardioprotective benefit (Pate et al., ACSM, 1995)")
                evidenceRow(stat: "NEAT effect", detail: "Non-exercise activity thermogenesis (fidgeting, walking, chores) contributes 200–500+ kcal/day and is the biggest driver of daily calorie variability")
                evidenceRow(stat: "Move ring", detail: "Apple Watch default 500 kcal goal. Consistent closure associated with improved resting HR, HRV, and VO₂max over 8–12 weeks")
            }
            Divider()
            Text("Active calories ≠ total burn. Resting metabolism (BMR) burns ~1,400–2,000 kcal/day in addition to active energy. Apple Watch estimates active calories from movement, heart rate, and your height/weight/age.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.red.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.red.opacity(0.18), lineWidth: 1))
    }

    private func evidenceRow(stat: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(stat).font(.caption.bold()).foregroundStyle(.red).frame(width: 90, alignment: .leading)
            Text(detail).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "flame.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Active Energy Data")
                .font(.title3.bold())
            Text("Active calories are tracked by Apple Watch using your movement, heart rate, and personal metrics. Wear your Watch throughout the day to start tracking.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let energyType = HKQuantityType(.activeEnergyBurned)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [energyType])) != nil else { return }

        let cal = Calendar.current
        var calMon = Calendar.current; calMon.firstWeekday = 2
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: Date())!

        let stats: HKStatisticsCollection? = await withCheckedContinuation { cont in
            var comps = DateComponents(); comps.day = 1
            let q = HKStatisticsCollectionQuery(
                quantityType: energyType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date()),
                options: .cumulativeSum,
                anchorDate: cal.startOfDay(for: thirtyDaysAgo),
                intervalComponents: comps
            )
            q.initialResultsHandler = { _, result, _ in cont.resume(returning: result) }
            healthStore.execute(q)
        }

        guard let stats else { return }

        var readings: [DayReading] = []
        stats.enumerateStatistics(from: thirtyDaysAgo, to: Date()) { stat, _ in
            let val = stat.sumQuantity()?.doubleValue(for: HKUnit.kilocalorie()) ?? 0
            readings.append(DayReading(id: stat.startDate, date: stat.startDate, calories: val))
        }

        guard !readings.isEmpty else { return }

        days = readings
        today = readings.last?.calories ?? 0
        let calVals = readings.map(\.calories)
        avg30 = calVals.reduce(0, +) / Double(calVals.count)
        best30 = calVals.max() ?? 0
        totalKcal = calVals.reduce(0, +)
        daysMetGoal = readings.filter { $0.calories >= dailyGoal }.count
        currentStreak = readings.reversed().prefix(while: { $0.calories >= dailyGoal }).count

        // Weekly buckets
        var weekMap: [Date: Double] = [:]
        for r in readings {
            let weekStart = calMon.date(from: calMon.dateComponents(
                [.yearForWeekOfYear, .weekOfYear], from: r.date))!
            weekMap[weekStart, default: 0] += r.calories
        }
        weeks = weekMap.map { WeekBucket(id: $0, weekStart: $0, total: $1) }
            .sorted { $0.weekStart < $1.weekStart }

        // DOW averages (0=Mon)
        var dowSums = Array(repeating: 0.0, count: 7)
        var dowCounts = Array(repeating: 0, count: 7)
        for r in readings {
            let wd = calMon.component(.weekday, from: r.date)
            let idx = (wd + 5) % 7
            dowSums[idx] += r.calories
            dowCounts[idx] += 1
        }
        dowAvg = zip(dowSums, dowCounts).map { s, c in c > 0 ? s / Double(c) : 0 }
    }
}

#Preview { NavigationStack { ActiveEnergyBudgetView() } }
