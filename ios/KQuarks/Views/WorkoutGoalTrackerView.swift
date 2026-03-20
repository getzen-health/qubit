import SwiftUI
import Charts
import HealthKit

// MARK: - WorkoutGoalTrackerView

/// Tracks progress toward weekly workout goals — how many sessions per week,
/// goal completion rate, streaks, and per-sport goal breakdown.
/// Users can set a weekly session target and see their historical achievement rate.
struct WorkoutGoalTrackerView: View {

    struct WeekSummary: Identifiable {
        let id: String
        let weekStart: Date
        let sessionCount: Int
        let goalMet: Bool
    }

    struct SportCount: Identifiable {
        let id: HKWorkoutActivityType
        let name: String
        let count: Int
        let color: Color
    }

    @AppStorage("weeklyWorkoutGoal") private var weeklyGoal: Int = 4

    @State private var weekSummaries: [WeekSummary] = []
    @State private var sportCounts: [SportCount] = []
    @State private var currentWeekCount: Int = 0
    @State private var goalStreakWeeks: Int = 0
    @State private var totalWeeks: Int = 0
    @State private var goalMetWeeks: Int = 0
    @State private var totalSessions: Int = 0
    @State private var isLoading = true
    @State private var showGoalPicker = false

    private let healthStore = HKHealthStore()

    var goalCompletionRate: Double {
        totalWeeks > 0 ? Double(goalMetWeeks) / Double(totalWeeks) : 0
    }

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else {
                VStack(spacing: 16) {
                    goalCard
                    weeklyProgressChart
                    if !sportCounts.isEmpty { sportBreakdownCard }
                    streakCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Workout Goals")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Edit Goal") { showGoalPicker = true }
                    .font(.caption)
            }
        }
        .sheet(isPresented: $showGoalPicker) {
            goalPickerSheet
        }
        .task { await load() }
    }

    // MARK: - Goal Card

    private var goalCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("This Week")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(currentWeekCount)")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(currentWeekCount >= weeklyGoal ? .green : .primary)
                        Text("/ \(weeklyGoal)")
                            .font(.title).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    Text("sessions completed")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(Color.green.opacity(0.2), lineWidth: 8)
                        .frame(width: 80, height: 80)
                    Circle()
                        .trim(from: 0, to: min(1, Double(currentWeekCount) / Double(weeklyGoal)))
                        .stroke(currentWeekCount >= weeklyGoal ? Color.green : Color.blue,
                                style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                    if currentWeekCount >= weeklyGoal {
                        Image(systemName: "checkmark").font(.title2.bold()).foregroundStyle(.green)
                    } else {
                        Text("\(weeklyGoal - currentWeekCount) left")
                            .font(.caption2.bold()).foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                }
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Goal Rate", value: String(format: "%.0f%%", goalCompletionRate * 100), color: goalCompletionRate >= 0.8 ? .green : goalCompletionRate >= 0.6 ? .yellow : .orange)
                Divider().frame(height: 36)
                statCell(label: "Weeks Hit", value: "\(goalMetWeeks)/\(totalWeeks)", color: .teal)
                Divider().frame(height: 36)
                statCell(label: "Total Sessions", value: "\(totalSessions)", color: .blue)
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

    // MARK: - Weekly Progress Chart

    private var weeklyProgressChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Progress — 13 Weeks").font(.headline)
            Chart {
                ForEach(weekSummaries) { w in
                    BarMark(x: .value("Week", w.weekStart, unit: .weekOfYear),
                            y: .value("Sessions", w.sessionCount))
                    .foregroundStyle(w.goalMet ? Color.green.opacity(0.8) : Color.blue.opacity(0.5))
                    .cornerRadius(3)
                }
                RuleMark(y: .value("Goal", weeklyGoal))
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 3]))
                    .foregroundStyle(Color.orange.opacity(0.7))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("Goal").font(.caption2).foregroundStyle(.orange)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 140)

            HStack(spacing: 16) {
                legendDot(color: .green, label: "Goal met")
                legendDot(color: .blue.opacity(0.5), label: "Below goal")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 12, height: 10)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Sport Breakdown Card

    private var sportBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Sessions by Sport (13 weeks)").font(.headline)
            ForEach(sportCounts.prefix(8)) { s in
                HStack {
                    Text(s.name).font(.caption).frame(width: 120, alignment: .leading)
                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 3)
                            .fill(s.color.opacity(0.7))
                            .frame(width: geo.size.width * (Double(s.count) / Double(sportCounts.first?.count ?? 1)), height: 12)
                    }
                    .frame(height: 12)
                    Text("\(s.count)").font(.caption.monospacedDigit()).foregroundStyle(.secondary).frame(width: 30, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Streak Card

    private var streakCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Current Goal Streak")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(goalStreakWeeks)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(goalStreakWeeks >= 4 ? .orange : .primary)
                        Text("weeks")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text("consecutive weeks meeting your \(weeklyGoal)-session goal")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: goalStreakWeeks >= 4 ? "flame.fill" : "flame")
                    .font(.system(size: 44))
                    .foregroundStyle(goalStreakWeeks >= 4 ? .orange : .secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Goal Picker Sheet

    private var goalPickerSheet: some View {
        NavigationStack {
            Form {
                Section("Weekly Session Goal") {
                    ForEach([2, 3, 4, 5, 6, 7], id: \.self) { n in
                        HStack {
                            Text("\(n) sessions/week")
                            Spacer()
                            if weeklyGoal == n {
                                Image(systemName: "checkmark").foregroundStyle(.blue)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            weeklyGoal = n
                            showGoalPicker = false
                            Task { await load() }
                        }
                    }
                }
            }
            .navigationTitle("Set Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showGoalPicker = false }
                }
            }
        }
        .presentationDetents([.medium])
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "trophy.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Workout Data")
                .font(.title3.bold())
            Text("Log workouts on Apple Watch to start tracking your weekly goals and session streaks.")
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
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else { return }

        let thirteenWeeksAgo = Calendar.current.date(byAdding: .weekOfYear, value: -13, to: Date())!
        var cal = Calendar.current; cal.firstWeekday = 2  // Monday start

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType,
                predicate: HKQuery.predicateForSamples(withStart: thirteenWeeksAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        totalSessions = workouts.count

        // Build week buckets
        var weekMap: [String: (Date, Int)] = [:]
        for w in workouts {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.startDate)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = cal.date(from: comps) ?? w.startDate
            var cur = weekMap[key] ?? (ws, 0)
            cur.1 += 1
            weekMap[key] = cur
        }

        let sorted = weekMap.map { key, val in
            WeekSummary(id: key, weekStart: val.0, sessionCount: val.1, goalMet: val.1 >= weeklyGoal)
        }.sorted { $0.weekStart < $1.weekStart }

        weekSummaries = sorted
        totalWeeks = sorted.count
        goalMetWeeks = sorted.filter(\.goalMet).count

        // Current week
        let thisWeekComps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
        let thisKey = "\(thisWeekComps.yearForWeekOfYear ?? 0)-\(thisWeekComps.weekOfYear ?? 0)"
        currentWeekCount = weekMap[thisKey]?.1 ?? 0

        // Goal streak — count consecutive weeks from most recent
        var streak = 0
        for week in sorted.reversed() {
            if week.goalMet { streak += 1 }
            else { break }
        }
        goalStreakWeeks = streak

        // Sport counts
        var sportMap: [HKWorkoutActivityType: Int] = [:]
        for w in workouts { sportMap[w.workoutActivityType, default: 0] += 1 }

        let colorMap: [HKWorkoutActivityType: Color] = [
            .running: .orange, .cycling: .blue, .swimming: .cyan,
            .walking: .green, .functionalStrengthTraining: .orange,
            .traditionalStrengthTraining: .red, .hiking: .green,
            .highIntensityIntervalTraining: .pink, .yoga: .purple,
            .rowing: .teal, .crossTraining: .red
        ]

        sportCounts = sportMap.map { type, count in
            SportCount(id: type, name: sportName(type), count: count, color: colorMap[type] ?? .gray)
        }.sorted { $0.count > $1.count }
    }

    private func sportName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running: return "Running"
        case .cycling: return "Cycling"
        case .swimming: return "Swimming"
        case .walking: return "Walking"
        case .hiking: return "Hiking"
        case .highIntensityIntervalTraining: return "HIIT"
        case .yoga: return "Yoga"
        case .functionalStrengthTraining: return "Functional Strength"
        case .traditionalStrengthTraining: return "Strength Training"
        case .rowing: return "Rowing"
        case .crossTraining: return "Cross Training"
        case .tennis: return "Tennis"
        case .soccer: return "Soccer"
        case .basketball: return "Basketball"
        default: return "Other"
        }
    }
}

#Preview { NavigationStack { WorkoutGoalTrackerView() } }
