import SwiftUI
import Charts
import HealthKit

// MARK: - ExerciseMinutesView

/// Tracks Apple Exercise Minutes (HKQuantityType(.appleExerciseTime)) against
/// the WHO physical activity guidelines.
///
/// WHO 2020 Physical Activity Guidelines for Adults (18–64):
///   - 150–300 min/week moderate-intensity aerobic activity, OR
///   - 75–150 min/week vigorous-intensity aerobic activity, OR
///   - Equivalent combination (1 min vigorous ≈ 2 min moderate)
///
/// Apple Exercise Minutes counts minutes above 50% estimated HRmax from any
/// workout or elevated-HR daily activity recorded by Apple Watch.
///
/// Reference: Bull et al., Lancet 2020; WHO Global Action Plan on PA 2018-2030
struct ExerciseMinutesView: View {

    struct WeekBucket: Identifiable {
        let id: Date
        let weekStart: Date
        let totalMins: Double
        let metGoal: Bool   // ≥ 150 min
    }

    struct DayBucket: Identifiable {
        let id: Date
        let date: Date
        let mins: Double
    }

    @State private var weeks: [WeekBucket] = []
    @State private var recentDays: [DayBucket] = []
    @State private var currentWeekMins: Double = 0
    @State private var avgWeekMins: Double = 0
    @State private var bestWeekMins: Double = 0
    @State private var goalStreak: Int = 0
    @State private var longestStreak: Int = 0
    @State private var dowAvg: [Double] = Array(repeating: 0, count: 7)   // Mon–Sun
    @State private var isLoading = true

    private let weekGoal: Double = 150
    private let healthStore = HKHealthStore()

    private let dowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if weeks.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    weeklyProgressCard
                    weeklyTrendChart
                    dowPatternChart
                    guidelinesCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Exercise Minutes")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let pct = min(1.0, currentWeekMins / weekGoal)
        let status: (label: String, color: Color) = {
            if currentWeekMins >= weekGoal { return ("Goal Met 🎉", .green) }
            let remaining = weekGoal - currentWeekMins
            return (String(format: "%.0f min to go", remaining), .orange)
        }()

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("This Week")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", currentWeekMins))
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(pct >= 1 ? .green : .orange)
                        Text("/ 150 min")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    Text(status.label)
                        .font(.subheadline).foregroundStyle(status.color)
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(Color.green.opacity(0.15), lineWidth: 10)
                        .frame(width: 88, height: 88)
                    Circle()
                        .trim(from: 0, to: pct)
                        .stroke(pct >= 1 ? Color.green : Color.orange,
                                style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 88, height: 88)
                    Text(String(format: "%.0f%%", pct * 100))
                        .font(.subheadline.bold().monospacedDigit())
                        .foregroundStyle(pct >= 1 ? .green : .orange)
                }
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg / Week", value: String(format: "%.0f min", avgWeekMins), color: avgWeekMins >= weekGoal ? .green : .orange)
                Divider().frame(height: 36)
                statCell(label: "Best Week", value: String(format: "%.0f min", bestWeekMins), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Goal Streak", value: "\(goalStreak) wks", color: goalStreak >= 4 ? .green : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Longest Streak", value: "\(longestStreak) wks", color: .blue)
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

    private func weekColor(_ w: WeekBucket) -> Color {
        if w.metGoal        { return Color.green.opacity(0.8) }
        if w.totalMins >= 100 { return Color.yellow.opacity(0.7) }
        if w.totalMins >= 50  { return Color.orange.opacity(0.5) }
        return Color.gray.opacity(0.2)
    }

    // MARK: - Weekly Progress Streaks

    private var weeklyProgressCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("52-Week Goal History").font(.headline)
            Text("Each square = one week. Green = met 150 min WHO target.")
                .font(.caption).foregroundStyle(.secondary)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: 13), spacing: 3) {
                ForEach(weeks.suffix(52)) { w in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(weekColor(w))
                        .aspectRatio(1, contentMode: .fit)
                        .help(String(format: "%.0f min", w.totalMins))
                }
            }

            HStack(spacing: 8) {
                legendSquare(color: .green.opacity(0.8), label: "≥150 min")
                legendSquare(color: .yellow.opacity(0.7), label: "100-149")
                legendSquare(color: .orange.opacity(0.5), label: "50-99")
                legendSquare(color: .gray.opacity(0.3), label: "<50 min")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func legendSquare(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 12, height: 12)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Weekly Trend Chart

    private var weeklyTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Exercise Minutes — 52 Weeks").font(.headline)
            Chart {
                ForEach(weeks.suffix(26)) { w in
                    BarMark(x: .value("Week", w.weekStart, unit: .weekOfYear),
                            y: .value("Minutes", w.totalMins))
                    .foregroundStyle(w.metGoal ? Color.green.opacity(0.7) :
                                     w.totalMins >= 100 ? Color.yellow.opacity(0.7) :
                                     Color.orange.opacity(0.6))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("WHO Target", weekGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("150").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("min")
            .frame(height: 150)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private struct DOWEntry: Identifiable {
        let id: String
        let day: String
        let mins: Double
    }

    private func dowEntries() -> [DOWEntry] {
        zip(dowLabels, dowAvg).map { DOWEntry(id: $0, day: $0, mins: $1) }
    }

    private func dowBarColor(_ mins: Double) -> Color {
        if mins >= 21 { return Color.green.opacity(0.75) }
        if mins >= 14 { return Color.teal.opacity(0.7) }
        return Color.blue.opacity(0.5)
    }

    // MARK: - Day of Week Pattern

    private var dowPatternChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("When You Exercise — Day of Week").font(.headline)
            Text("Average exercise minutes per day over the last 12 weeks")
                .font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(dowEntries()) { entry in
                    BarMark(x: .value("Day", entry.day),
                            y: .value("Minutes", entry.mins))
                    .foregroundStyle(dowBarColor(entry.mins))
                    .cornerRadius(4)
                }
                RuleMark(y: .value("Daily Target", weekGoal / 5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.secondary.opacity(0.4))
            }
            .chartYAxisLabel("min/day")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - WHO Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "figure.run").foregroundStyle(.green)
                Text("WHO Physical Activity Guidelines").font(.headline)
            }
            VStack(spacing: 5) {
                guideRow(icon: "checkmark.seal.fill", text: "150–300 min/week of moderate-intensity activity (brisk walking, cycling at comfortable pace)", color: .green)
                guideRow(icon: "checkmark.seal.fill", text: "75–150 min/week of vigorous-intensity activity (running, fast cycling, HIIT)", color: .green)
                guideRow(icon: "arrow.triangle.2.circlepath", text: "1 minute vigorous = 2 minutes moderate (use either or a combination)", color: .blue)
                guideRow(icon: "plus.circle.fill", text: "Additional benefits above 300 min/week moderate — no upper limit on benefit", color: .teal)
                guideRow(icon: "figure.strengthtraining.traditional", text: "Muscle-strengthening 2+ days/week (not counted in Exercise Minutes)", color: .orange)
            }
            Divider()
            Text("Apple Exercise Minutes counts minutes where your heart rate exceeds 50% HRmax, or matches moderate-intensity effort guidelines. Sitting less and moving more provides health benefits at ANY level.")
                .font(.caption2).foregroundStyle(.secondary)
            Text("Source: WHO Global Action Plan on Physical Activity 2018–2030; Bull et al., Lancet 2020")
                .font(.caption2).foregroundStyle(.secondary).italic()
        }
        .padding()
        .background(Color.green.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.green.opacity(0.18), lineWidth: 1))
    }

    private func guideRow(icon: String, text: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).foregroundStyle(color).frame(width: 20)
            Text(text).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.run")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Exercise Minute Data")
                .font(.title3.bold())
            Text("Exercise Minutes are recorded by Apple Watch during workouts and elevated-HR daily activity. Complete workouts with your Watch to start tracking your WHO goal progress.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let exType = HKQuantityType(.appleExerciseTime)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [exType])) != nil else { return }

        let cal = Calendar.current
        var calMon = Calendar.current; calMon.firstWeekday = 2
        let yearAgo = cal.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let minUnit = HKUnit.minute()

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: exType,
                predicate: HKQuery.predicateForSamples(withStart: yearAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        let readings = samples.map { s in
            (date: s.startDate, mins: s.quantity.doubleValue(for: minUnit))
        }

        // Group by day
        var dayMap: [Date: Double] = [:]
        for r in readings {
            let day = cal.startOfDay(for: r.date)
            dayMap[day, default: 0] += r.mins
        }

        // Group by week
        var weekMap: [String: (Date, Double)] = [:]
        for (day, mins) in dayMap {
            let comps = calMon.dateComponents([.yearForWeekOfYear, .weekOfYear], from: day)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = calMon.date(from: comps) ?? day
            var cur = weekMap[key] ?? (ws, 0)
            cur.1 += mins
            weekMap[key] = cur
        }

        let allWeeks = weekMap.map { key, val in
            WeekBucket(id: val.0, weekStart: val.0, totalMins: val.1, metGoal: val.1 >= 150)
        }.sorted { $0.weekStart < $1.weekStart }

        weeks = allWeeks
        avgWeekMins = allWeeks.isEmpty ? 0 : allWeeks.map(\.totalMins).reduce(0, +) / Double(allWeeks.count)
        bestWeekMins = allWeeks.map(\.totalMins).max() ?? 0

        // Current week
        let thisWeekComps = calMon.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
        let thisWeekKey = "\(thisWeekComps.yearForWeekOfYear ?? 0)-\(thisWeekComps.weekOfYear ?? 0)"
        currentWeekMins = weekMap[thisWeekKey]?.1 ?? 0

        // Streaks
        let sorted = allWeeks.filter { $0.weekStart < cal.startOfWeek(for: Date()) }.reversed()
        var streak = 0
        for w in sorted {
            if w.metGoal { streak += 1 } else { break }
        }
        goalStreak = streak

        var longest = 0, current = 0
        for w in allWeeks {
            if w.metGoal { current += 1; longest = max(longest, current) } else { current = 0 }
        }
        longestStreak = longest

        // Day-of-week averages (last 12 weeks)
        let twelveWeeksAgo = cal.date(byAdding: .weekOfYear, value: -12, to: Date()) ?? Date()
        var dowSums = Array(repeating: 0.0, count: 7)
        var dowCounts = Array(repeating: 0, count: 7)
        for (day, mins) in dayMap where day >= twelveWeeksAgo {
            let wd = calMon.component(.weekday, from: day) // 1=Sun in Apple calendar
            let idx = (wd + 5) % 7   // 0=Mon ... 6=Sun
            dowSums[idx] += mins
            dowCounts[idx] += 1
        }
        dowAvg = zip(dowSums, dowCounts).map { s, c in c > 0 ? s / Double(c) : 0 }
    }
}

// Calendar extension for startOfWeek
private extension Calendar {
    func startOfWeek(for date: Date) -> Date {
        var cal = self
        cal.firstWeekday = 2
        let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return cal.date(from: comps) ?? date
    }
}

#Preview { NavigationStack { ExerciseMinutesView() } }
