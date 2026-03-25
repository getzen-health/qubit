import SwiftUI
import HealthKit

// MARK: - StreaksView

/// Tracks consecutive-day streaks for steps, workouts, active calories, sleep, and mindfulness.
/// All data fetched directly from HealthKit — no backend needed.
struct StreaksView: View {
    @State private var isLoading = true
    @State private var stepsByDay:  [String: Double] = [:]   // "yyyy-MM-dd" → steps
    @State private var calsByDay:   [String: Double] = [:]   // "yyyy-MM-dd" → kcal
    @State private var sleepByDay:  [String: Double] = [:]   // "yyyy-MM-dd" → hours
    @State private var workoutDays: Set<String>       = []   // days with any workout
    @State private var mindfulDays: Set<String>       = []   // days with any mindfulness

    private let healthKit = HealthKitService.shared
    private let goals     = GoalService.shared

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()

    private var stepGoal:  Double { Double(goals.stepsGoal) }
    private var calGoal:   Double { Double(goals.activeCaloriesGoal) }
    private var sleepGoalHrs: Double { Double(goals.sleepGoalMinutes) / 60 }

    // MARK: - Computed Streaks

    private var stepsStreak:   StreakResult { computeStreak(days: stepsByDay.keys.sorted(by: >)) { stepsByDay[$0, default: 0] >= stepGoal } }
    private var calStreak:     StreakResult { computeStreak(days: calsByDay.keys.sorted(by: >)) { calsByDay[$0, default: 0] >= calGoal } }
    private var sleepStreak:   StreakResult { computeStreak(days: sleepByDay.keys.sorted(by: >)) { sleepByDay[$0, default: 0] >= sleepGoalHrs } }
    private var workoutStreak: StreakResult { computeStreak(days: workoutDays.sorted(by: >)) { workoutDays.contains($0) } }
    private var mindfulStreak: StreakResult { computeStreak(days: mindfulDays.sorted(by: >)) { mindfulDays.contains($0) } }

    private var overallBest: Int {
        [stepsStreak.best, calStreak.best, sleepStreak.best, workoutStreak.best].max() ?? 0
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else {
                    heroCard
                    streakGrid
                    heatmapsCard
                    todayChecklistCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Streaks")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        VStack(spacing: 4) {
            Text("Best Streak Ever")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text("\(overallBest)")
                .font(.system(size: 64, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
            Text("days")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Streak Grid

    private var today: String { Self.df.string(from: Date()) }
    private var yesterday: String {
        Self.df.string(from: Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date())
    }

    private var streakGrid: some View {
        let cols = [GridItem(.flexible()), GridItem(.flexible())]
        return LazyVGrid(columns: cols, spacing: 12) {
            StreakCard(
                icon: "figure.walk",
                label: "Steps",
                current: stepsStreak.current,
                best: stepsStreak.best,
                color: .green,
                metToday: stepsByDay[today, default: 0] >= stepGoal
            )
            StreakCard(
                icon: "moon.fill",
                label: "Sleep",
                current: sleepStreak.current,
                best: sleepStreak.best,
                color: .indigo,
                metToday: sleepByDay[today, default: 0] >= sleepGoalHrs
            )
            StreakCard(
                icon: "flame.fill",
                label: "Active Cal",
                current: calStreak.current,
                best: calStreak.best,
                color: .orange,
                metToday: calsByDay[today, default: 0] >= calGoal
            )
            StreakCard(
                icon: "figure.run",
                label: "Workouts",
                current: workoutStreak.current,
                best: workoutStreak.best,
                color: .purple,
                metToday: workoutDays.contains(today)
            )
            if mindfulStreak.best > 0 {
                StreakCard(
                    icon: "brain.head.profile",
                    label: "Mindfulness",
                    current: mindfulStreak.current,
                    best: mindfulStreak.best,
                    color: .pink,
                    metToday: mindfulDays.contains(today)
                )
            }
        }
    }

    // MARK: - Heatmaps Card

    private var heatmapsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Last 28 Days")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 14) {
                StreakHeatmap(
                    label: "Steps goal",
                    color: .green,
                    isGoalMet: { stepsByDay[$0, default: 0] >= stepGoal }
                )
                StreakHeatmap(
                    label: "Sleep goal",
                    color: .indigo,
                    isGoalMet: { sleepByDay[$0, default: 0] >= sleepGoalHrs }
                )
                StreakHeatmap(
                    label: "Workout days",
                    color: .purple,
                    isGoalMet: { workoutDays.contains($0) }
                )
                StreakHeatmap(
                    label: "Active cal goal",
                    color: .orange,
                    isGoalMet: { calsByDay[$0, default: 0] >= calGoal }
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Today's Checklist

    private var todayChecklistCard: some View {
        let stepsToday = stepsByDay[today, default: 0]
        let calsToday = calsByDay[today, default: 0]
        let sleepToday = sleepByDay[today, default: 0]
        let goalHrs = sleepGoalHrs

        return VStack(alignment: .leading, spacing: 12) {
            Text("Today's Goals")
                .font(.headline)

            VStack(spacing: 0) {
                ChecklistRow(
                    icon: "figure.walk",
                    label: "Steps ≥ \(Int(stepGoal).formatted())",
                    value: "\(Int(stepsToday).formatted()) / \(Int(stepGoal).formatted())",
                    met: stepsToday >= stepGoal
                )
                Divider().padding(.leading, 36)
                ChecklistRow(
                    icon: "flame.fill",
                    label: "Active Cal ≥ \(Int(calGoal))",
                    value: "\(Int(calsToday)) / \(Int(calGoal)) kcal",
                    met: calsToday >= calGoal
                )
                Divider().padding(.leading, 36)
                ChecklistRow(
                    icon: "moon.fill",
                    label: "Sleep ≥ \(Int(goalHrs))h",
                    value: String(format: "%.1fh slept", sleepToday),
                    met: sleepToday >= goalHrs
                )
                Divider().padding(.leading, 36)
                ChecklistRow(
                    icon: "figure.run",
                    label: "Workout",
                    value: workoutDays.contains(today) ? "Logged" : "None yet",
                    met: workoutDays.contains(today)
                )
                if mindfulStreak.best > 0 {
                    Divider().padding(.leading, 36)
                    ChecklistRow(
                        icon: "brain.head.profile",
                        label: "Mindfulness",
                        value: mindfulDays.contains(today) ? "Logged" : "None yet",
                        met: mindfulDays.contains(today)
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Streak Algorithm

    struct StreakResult {
        let current: Int
        let best: Int
    }

    private func computeStreak(days: [String], isGoalMet: (String) -> Bool) -> StreakResult {
        let today = Self.df.string(from: Date())
        let yesterday = Self.df.string(from: Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date())
        let sorted = days.filter { $0 <= today }.sorted(by: >)

        var current = 0
        var best = 0
        var streak = 0
        var prev: String? = nil
        var countingCurrent = true

        for date in sorted {
            if isGoalMet(date) {
                if prev == nil {
                    streak = 1
                } else {
                    // Check consecutive
                    if let prev = prev, let prevDate = Self.df.date(from: prev),
                       let curDate = Self.df.date(from: date) {
                        let diff = prevDate.timeIntervalSince(curDate) / 86400
                        if abs(diff - 1) < 0.5 {
                            streak += 1
                        } else {
                            if countingCurrent { current = streak; countingCurrent = false }
                            streak = 1
                        }
                    }
                }
                best = max(best, streak)
                prev = date
            } else {
                if countingCurrent && prev != nil { current = streak; countingCurrent = false }
                streak = 0
                prev = nil
            }
        }

        // If streak still running, finalize current
        if countingCurrent {
            if let mostRecent = sorted.first, (mostRecent == today || mostRecent == yesterday) {
                current = streak
            }
        }

        return StreakResult(current: current, best: best)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let cal = Calendar.current
        let now = Date()
        let start = cal.date(byAdding: .day, value: -60, to: cal.startOfDay(for: now)) ?? Date()

        // Fetch steps per day
        async let stepsRaw = (try? await healthKit.fetchWeekData(for: .stepCount, isDiscrete: false, days: 60)) ?? []
        async let calsRaw = (try? await healthKit.fetchWeekData(for: .activeEnergyBurned, isDiscrete: false, days: 60)) ?? []
        async let sleepRaw = fetchSleepPerDay(start: start)
        async let workoutsRaw = (try? await healthKit.fetchWorkouts(from: start, to: now)) ?? []
        async let mindfulRaw = fetchMindfulDays(start: start)

        let (steps, cals, sleep, workouts, mindful) = await (stepsRaw, calsRaw, sleepRaw, workoutsRaw, mindfulRaw)

        // Map to dictionaries
        let df = Self.df
        stepsByDay  = Dictionary(uniqueKeysWithValues: steps.map { (df.string(from: $0.date), $0.value) })
        calsByDay   = Dictionary(uniqueKeysWithValues: cals.map { (df.string(from: $0.date), $0.value) })
        sleepByDay  = sleep
        workoutDays = Set(workouts.map { df.string(from: $0.startDate) })
        mindfulDays = mindful
    }

    private func fetchSleepPerDay(start: Date) async -> [String: Double] {
        let type = HKCategoryType(.sleepAnalysis)
        let pred = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                guard let samples = samples as? [HKCategorySample] else {
                    cont.resume(returning: [:])
                    return
                }
                let df = Self.df
                let cal = Calendar.current
                var byDay: [String: Double] = [:]
                for s in samples {
                    guard let v = HKCategoryValueSleepAnalysis(rawValue: s.value),
                          [.asleepDeep, .asleepREM, .asleepCore, .asleepUnspecified].contains(v)
                    else { continue }
                    // Attribute sleep to the day you wake up
                    let wakeDay = df.string(from: cal.startOfDay(for: s.endDate))
                    let hrs = s.endDate.timeIntervalSince(s.startDate) / 3600
                    byDay[wakeDay, default: 0] += hrs
                }
                cont.resume(returning: byDay)
            }
            HKHealthStore().execute(q)
        }
    }

    private func fetchMindfulDays(start: Date) async -> Set<String> {
        let type = HKCategoryType(.mindfulSession)
        guard HKHealthStore().authorizationStatus(for: type) != .notDetermined else { return [] }
        let pred = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)

        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                let df = Self.df
                let days = Set((samples ?? []).map { df.string(from: $0.startDate) })
                cont.resume(returning: days)
            }
            HKHealthStore().execute(q)
        }
    }
}

// MARK: - Supporting Views

private struct StreakCard: View {
    let icon: String
    let label: String
    let current: Int
    let best: Int
    let color: Color
    let metToday: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.subheadline)
                    .foregroundStyle(color)
                Text(label)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
                Spacer()
                if metToday {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundStyle(.green)
                }
            }

            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text("\(current)")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(color)
                Text("days")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            if best > 0 {
                Text("Best: \(best)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(metToday ? color.opacity(0.4) : Color.clear, lineWidth: 1.5)
        )
    }
}

private struct StreakHeatmap: View {
    let label: String
    let color: Color
    let isGoalMet: (String) -> Bool

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()

    private var days: [String] {
        (0..<28).reversed().map { offset in
            Self.df.string(from: Calendar.current.date(byAdding: .day, value: -offset, to: Date()) ?? Date())
        }
    }

    private var todayStr: String { Self.df.string(from: Date()) }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)

            HStack(spacing: 3) {
                ForEach(days, id: \.self) { day in
                    let met = isGoalMet(day)
                    let isToday = day == todayStr
                    RoundedRectangle(cornerRadius: 3)
                        .fill(met ? color : Color(.systemGray5))
                        .frame(maxWidth: .infinity)
                        .aspectRatio(1, contentMode: .fit)
                        .overlay(
                            RoundedRectangle(cornerRadius: 3)
                                .stroke(isToday ? Color.white.opacity(0.5) : Color.clear, lineWidth: 1)
                        )
                }
            }
        }
    }
}

private struct ChecklistRow: View {
    let icon: String
    let label: String
    let value: String
    let met: Bool

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: met ? "checkmark.circle.fill" : "circle")
                .font(.title3)
                .foregroundStyle(met ? .green : Color(.systemGray4))
                .frame(width: 26)

            Text(label)
                .font(.subheadline)
                .foregroundStyle(met ? .primary : .secondary)

            Spacer()

            Text(value)
                .font(.caption)
                .foregroundStyle(.secondary)
                .monospacedDigit()
        }
        .padding(.vertical, 10)
    }
}

#Preview {
    NavigationStack {
        StreaksView()
    }
}
