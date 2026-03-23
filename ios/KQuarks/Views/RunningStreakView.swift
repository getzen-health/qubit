import SwiftUI
import Charts
import HealthKit

// MARK: - RunningStreakView

/// Tracks running consistency via streak analysis — current streak, longest streak,
/// weekly frequency trend, and a 90-day activity heatmap showing which days had runs.
struct RunningStreakView: View {

    struct DayActivity: Identifiable {
        let id: Date
        let date: Date
        let ran: Bool
        let distanceKm: Double
    }

    struct WeekFreq: Identifiable {
        let id: String
        let weekStart: Date
        let runDays: Int     // 0–7
    }

    @State private var currentStreak: Int = 0
    @State private var longestStreak: Int = 0
    @State private var totalRunDays: Int = 0
    @State private var runRate: Double = 0     // % days with a run
    @State private var dayGrid: [DayActivity] = []
    @State private var weekFreqs: [WeekFreq] = []
    @State private var avgRunsPerWeek: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if dayGrid.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    streakCard
                    heatmapCard
                    weeklyFreqChart
                    consistencyCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Running Streaks")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Streak Card

    private var streakCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Current Streak")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(currentStreak)")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(currentStreak >= 7 ? .orange : currentStreak >= 3 ? .yellow : .primary)
                        Text("days")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                }
                Spacer()
                VStack(spacing: 4) {
                    ZStack {
                        Circle()
                            .stroke(Color.orange.opacity(0.2), lineWidth: 6)
                            .frame(width: 64, height: 64)
                        Circle()
                            .trim(from: 0, to: min(1, Double(currentStreak) / 30))
                            .stroke(Color.orange, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                            .frame(width: 64, height: 64)
                            .rotationEffect(.degrees(-90))
                        Image(systemName: "figure.run")
                            .font(.title2).foregroundStyle(.orange)
                    }
                    Text("of 30").font(.caption2).foregroundStyle(.secondary)
                }
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Longest Streak", value: "\(longestStreak) days", color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Run Days (90d)", value: "\(totalRunDays)", color: .green)
                Divider().frame(height: 36)
                statCell(label: "Run Rate", value: String(format: "%.0f%%", runRate * 100), color: .teal)
                Divider().frame(height: 36)
                statCell(label: "Avg/Week", value: String(format: "%.1f", avgRunsPerWeek), color: .blue)
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

    // MARK: - 90-Day Heatmap

    private var heatmapCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("90-Day Activity Map").font(.headline)
            Text("Each square = one day").font(.caption).foregroundStyle(.secondary)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4) {
                // Day labels
                ForEach(["M", "T", "W", "T", "F", "S", "S"], id: \.self) { d in
                    Text(d)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
                ForEach(dayGrid) { day in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(day.ran ? runColor(km: day.distanceKm) : Color.gray.opacity(0.12))
                        .frame(height: 18)
                }
            }

            HStack(spacing: 8) {
                Text("Less").font(.caption2).foregroundStyle(.secondary)
                HStack(spacing: 3) {
                    ForEach([0.15, 0.35, 0.55, 0.75, 1.0], id: \.self) { op in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.orange.opacity(op))
                            .frame(width: 12, height: 12)
                    }
                }
                Text("More").font(.caption2).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func runColor(km: Double) -> Color {
        if km >= 20 { return Color.orange }
        if km >= 10 { return Color.orange.opacity(0.8) }
        if km >= 5  { return Color.orange.opacity(0.6) }
        return Color.orange.opacity(0.35)
    }

    // MARK: - Weekly Frequency Chart

    private var weeklyFreqChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Runs Per Week").font(.headline)
            Chart {
                ForEach(weekFreqs) { w in
                    BarMark(x: .value("Week", w.weekStart, unit: .weekOfYear),
                            y: .value("Days", w.runDays))
                    .foregroundStyle(w.runDays >= 5 ? Color.orange :
                                     w.runDays >= 3 ? Color.orange.opacity(0.65) :
                                     Color.orange.opacity(0.35))
                    .cornerRadius(3)
                }
                if avgRunsPerWeek > 0 {
                    RuleMark(y: .value("Avg", avgRunsPerWeek))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxis {
                AxisMarks(values: [0, 1, 2, 3, 4, 5, 6, 7])
            }
            .chartYAxisLabel("days/week")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Consistency Card

    private var consistencyCard: some View {
        let tier: (label: String, color: Color, icon: String) = {
            switch runRate {
            case 0.7...: return ("Elite Consistency", .orange, "star.fill")
            case 0.5...: return ("Strong Runner", .green, "checkmark.circle.fill")
            case 0.3...: return ("Regular Runner", .teal, "figure.run")
            default: return ("Building Habit", .blue, "arrow.up.circle.fill")
            }
        }()

        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: tier.icon).foregroundStyle(tier.color)
                Text("Consistency Level").font(.headline)
            }
            HStack(spacing: 12) {
                Text(tier.label)
                    .font(.title3.bold())
                    .foregroundStyle(tier.color)
                Spacer()
                Text(String(format: "%.0f%%", runRate * 100))
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(tier.color)
            }
            Text("Run frequency over the past 90 days. Elite runners typically run 5–6 days per week (71–86% consistency).")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.run.circle")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Running Data")
                .font(.title3.bold())
            Text("Start tracking outdoor or treadmill runs on Apple Watch to see your streak history, run frequency, and consistency here.")
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

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let mUnit = HKUnit.meter()
        let cal = Calendar.current

        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
            HKQuery.predicateForWorkouts(with: .running)
        ])

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        // Build a set of run days and distances
        var runDayMap: [Date: Double] = [:]
        for w in workouts {
            let dayStart = cal.startOfDay(for: w.startDate)
            let dist = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: mUnit) ?? 0
            runDayMap[dayStart, default: 0] += dist / 1000  // km
        }

        guard !runDayMap.isEmpty else { return }

        // Build 90-day grid starting from Monday before ninetyDaysAgo
        var gridStart = ninetyDaysAgo
        while cal.component(.weekday, from: gridStart) != 2 {  // 2 = Monday
            gridStart = cal.date(byAdding: .day, value: -1, to: gridStart)!
        }

        var grid: [DayActivity] = []
        var d = gridStart
        let today = cal.startOfDay(for: Date())
        while d <= today {
            let ran = runDayMap[d] != nil
            grid.append(DayActivity(id: d, date: d, ran: ran, distanceKm: runDayMap[d] ?? 0))
            d = cal.date(byAdding: .day, value: 1, to: d)!
        }
        dayGrid = grid

        // Current streak: count backwards from today
        var streak = 0
        var checkDay = today
        while let km = runDayMap[checkDay], km > 0 {
            streak += 1
            checkDay = cal.date(byAdding: .day, value: -1, to: checkDay)!
        }
        currentStreak = streak

        // Longest streak
        var longest = 0, cur = 0
        for day in grid {
            if day.ran { cur += 1; longest = max(longest, cur) }
            else { cur = 0 }
        }
        longestStreak = longest

        totalRunDays = runDayMap.keys.count
        runRate = Double(totalRunDays) / 90.0

        // Weekly freq
        var weekMap: [String: (Date, Int)] = [:]
        var calMon = Calendar.current; calMon.firstWeekday = 2
        for day in grid where day.ran {
            let comps = calMon.dateComponents([.yearForWeekOfYear, .weekOfYear], from: day.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = calMon.date(from: comps) ?? day.date
            var cur = weekMap[key] ?? (ws, 0)
            cur.1 += 1
            weekMap[key] = cur
        }
        weekFreqs = weekMap.map { key, val in
            WeekFreq(id: key, weekStart: val.0, runDays: val.1)
        }.sorted { $0.weekStart < $1.weekStart }
        avgRunsPerWeek = weekFreqs.isEmpty ? 0 : Double(weekFreqs.map(\.runDays).reduce(0, +)) / Double(weekFreqs.count)
    }
}

#Preview { NavigationStack { RunningStreakView() } }
