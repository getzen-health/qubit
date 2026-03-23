import SwiftUI
import Charts
import HealthKit

// MARK: - RaceGoalPlannerView

/// Goal race countdown with personalized weekly mileage targets.
/// The user picks a race distance and date; this view builds a 16-week
/// progressive training plan based on their current running volume and
/// the VDOT-derived target pace from the Race Predictor.
struct RaceGoalPlannerView: View {

    // MARK: - Models

    enum RaceDistance: String, CaseIterable, Identifiable {
        case fiveK     = "5K"
        case tenK      = "10K"
        case halfMarathon = "Half Marathon"
        case marathon  = "Marathon"

        var id: String { rawValue }
        var distanceKm: Double {
            switch self {
            case .fiveK:          return 5.0
            case .tenK:           return 10.0
            case .halfMarathon:   return 21.0975
            case .marathon:       return 42.195
            }
        }
        var icon: String {
            switch self {
            case .fiveK:          return "5.circle.fill"
            case .tenK:           return "10.circle.fill"
            case .halfMarathon:   return "h.circle.fill"
            case .marathon:       return "m.circle.fill"
            }
        }
        var color: Color {
            switch self {
            case .fiveK:          return .green
            case .tenK:           return .blue
            case .halfMarathon:   return .orange
            case .marathon:       return .red
            }
        }
        /// Minimum recommended weekly km for this race
        var minWeeklyKm: Double {
            switch self {
            case .fiveK:          return 20
            case .tenK:           return 30
            case .halfMarathon:   return 40
            case .marathon:       return 55
            }
        }
        /// Peak weekly km target
        var peakWeeklyKm: Double {
            switch self {
            case .fiveK:          return 40
            case .tenK:           return 55
            case .halfMarathon:   return 70
            case .marathon:       return 90
            }
        }
    }

    struct WeekPlan: Identifiable {
        let id: Int     // week number from now (1 = this week)
        let weekStart: Date
        let targetKm: Double
        let phase: String
        let phaseColor: Color
        var isCurrentWeek: Bool { id == 1 }
    }

    // MARK: - State

    @AppStorage("raceGoal_distance") private var selectedDistanceRaw = RaceDistance.halfMarathon.rawValue
    @AppStorage("raceGoal_targetDate") private var targetDateDouble: Double = Date().addingTimeInterval(16 * 7 * 86400).timeIntervalSince1970

    @State private var weekPlan: [WeekPlan] = []
    @State private var currentWeeklyKm: Double = 0
    @State private var weeksToRace: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    private var selectedDistance: RaceDistance {
        RaceDistance(rawValue: selectedDistanceRaw) ?? .halfMarathon
    }

    private var targetDate: Date {
        get { Date(timeIntervalSince1970: targetDateDouble) }
        set { targetDateDouble = newValue.timeIntervalSince1970 }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                goalSetterCard
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    countdownCard
                    trainingPlanChart
                    currentFitnessCard
                    weekByWeekCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Race Goal Planner")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
        .onChange(of: selectedDistanceRaw) { buildPlan() }
        .onChange(of: targetDateDouble) { buildPlan() }
    }

    // MARK: - Goal Setter

    private var goalSetterCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Set Your Goal")
                .font(.headline)

            VStack(alignment: .leading, spacing: 6) {
                Text("Race Distance")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Picker("Distance", selection: $selectedDistanceRaw) {
                    ForEach(RaceDistance.allCases) { d in
                        Text(d.rawValue).tag(d.rawValue)
                    }
                }
                .pickerStyle(.segmented)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Race Date")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                DatePicker("Race Date", selection: Binding(
                    get: { targetDate },
                    set: { targetDateDouble = $0.timeIntervalSince1970 }
                ), in: Date()..., displayedComponents: .date)
                .datePickerStyle(.compact)
                .labelsHidden()
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Countdown Card

    private var countdownCard: some View {
        HStack(spacing: 20) {
            VStack(spacing: 4) {
                Image(systemName: selectedDistance.icon)
                    .font(.title)
                    .foregroundStyle(selectedDistance.color)
                Text(selectedDistance.rawValue)
                    .font(.caption.bold())
                    .foregroundStyle(selectedDistance.color)
            }

            VStack(spacing: 2) {
                Text("\(weeksToRace)")
                    .font(.system(size: 52, weight: .bold, design: .rounded))
                    .foregroundStyle(weekCountColor)
                Text("weeks to race day")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            VStack(spacing: 4) {
                Image(systemName: "flag.checkered")
                    .font(.title)
                    .foregroundStyle(.gray)
                Text(raceCountdownDate)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var weekCountColor: Color {
        if weeksToRace < 4 { return .red }
        if weeksToRace < 8 { return .orange }
        return selectedDistance.color
    }

    private var raceCountdownDate: String {
        let df = DateFormatter()
        df.dateFormat = "MMM d\nyyyy"
        return df.string(from: targetDate)
    }

    // MARK: - Training Plan Chart

    private var trainingPlanChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Volume Plan")
                .font(.headline)

            let displayPlan = weekPlan.prefix(min(weeksToRace, 16))

            Chart {
                ForEach(displayPlan) { week in
                    BarMark(
                        x: .value("Week", week.id),
                        y: .value("km", week.targetKm)
                    )
                    .foregroundStyle(week.isCurrentWeek ? selectedDistance.color : week.phaseColor.opacity(0.6))
                    .cornerRadius(3)
                }

                if currentWeeklyKm > 0 {
                    RuleMark(y: .value("Current", currentWeeklyKm))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary)
                        .annotation(position: .topTrailing) {
                            Text("current")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: 4)) { val in
                    AxisGridLine()
                    if let week = val.as(Int.self) {
                        AxisValueLabel { Text("W\(week)") .font(.caption2) }
                    }
                }
            }
            .chartYAxisLabel("km/week")
            .frame(height: 180)

            HStack(spacing: 16) {
                legendDot(color: .blue.opacity(0.6), label: "Base")
                legendDot(color: .orange.opacity(0.6), label: "Build")
                legendDot(color: .red.opacity(0.6), label: "Peak")
                legendDot(color: .green.opacity(0.6), label: "Taper")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Current Fitness Card

    private var currentFitnessCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Your Current Fitness")
                .font(.headline)

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("4-Week Avg Volume")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(String(format: "%.1f km/week", currentWeeklyKm))
                        .font(.title3.bold())
                        .foregroundStyle(selectedDistance.color)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Target Peak")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(String(format: "%.0f km/week", selectedDistance.peakWeeklyKm))
                        .font(.title3.bold())
                        .foregroundStyle(selectedDistance.color)
                }
            }

            let progress = min(currentWeeklyKm / selectedDistance.peakWeeklyKm, 1.0)
            ProgressView(value: progress)
                .tint(selectedDistance.color)

            Text(fitnessReadinessText)
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var fitnessReadinessText: String {
        let ratio = selectedDistance.peakWeeklyKm > 0 ? currentWeeklyKm / selectedDistance.peakWeeklyKm : 0
        if ratio >= 0.8 {
            return "You're in great shape for this goal. Maintain consistency and follow the taper plan."
        } else if ratio >= 0.5 {
            return "Solid base. The plan will progressively build your volume — stick to it and avoid too much too soon."
        } else if weeksToRace >= 16 {
            return "You have enough time to safely build your base. Follow the plan and increase volume by 10% per week."
        } else {
            return "This may be ambitious given your current volume and timeline. Consider a shorter race or a later target date."
        }
    }

    // MARK: - Week-by-Week Card

    private var weekByWeekCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Week-by-Week Plan")
                .font(.headline)

            let display = Array(weekPlan.prefix(min(weeksToRace, 16)))
            let df = DateFormatter()
            let _ = { df.dateFormat = "MMM d" }()

            VStack(spacing: 0) {
                HStack {
                    Text("Week").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .leading)
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("Phase").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(minWidth: 50, alignment: .leading)
                    Spacer()
                    Text("Target").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(display) { week in
                    Divider()
                    HStack {
                        Text("W\(week.id)")
                            .font(.caption.bold())
                            .foregroundStyle(week.isCurrentWeek ? selectedDistance.color : .primary)
                            .frame(width: 40, alignment: .leading)
                        Text(df.string(from: week.weekStart))
                            .font(.caption)
                            .frame(width: 65, alignment: .leading)
                        Text(week.phase)
                            .font(.caption)
                            .foregroundStyle(week.phaseColor)
                            .frame(minWidth: 50, alignment: .leading)
                        Spacer()
                        Text(String(format: "%.0f km", week.targetKm))
                            .font(.caption.bold().monospacedDigit())
                            .foregroundStyle(week.phaseColor)
                            .frame(width: 55, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 7)
                    .background(week.isCurrentWeek ? selectedDistance.color.opacity(0.06) : Color.clear)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Build Plan

    private func buildPlan() {
        let weeks = max(0, Calendar.current.dateComponents([.weekOfYear], from: Date(), to: targetDate).weekOfYear ?? 0)
        weeksToRace = weeks
        guard weeks > 0 else { weekPlan = []; return }

        let planWeeks = min(weeks, 20)
        let startKm = max(currentWeeklyKm, selectedDistance.minWeeklyKm * 0.5)
        let peakKm = selectedDistance.peakWeeklyKm
        let taperWeeks = weeks <= 8 ? 2 : 3
        let buildWeeks = planWeeks - taperWeeks

        var plan: [WeekPlan] = []
        let cal = Calendar.current

        for w in 1...planWeeks {
            let weekStart = cal.date(byAdding: .weekOfYear, value: w - 1, to: Date()) ?? Date()
            let isTaper = w > buildWeeks

            let targetKm: Double
            let phase: String
            let phaseColor: Color

            if isTaper {
                let taperProgress = Double(w - buildWeeks) / Double(taperWeeks)
                targetKm = peakKm * (1 - taperProgress * 0.5)
                phase = "Taper"
                phaseColor = .green
            } else {
                // Progressive build: 4-week cycles with 10% weekly increase + cutback every 4th week
                let cycleWeek = (w - 1) % 4
                let cycleNum = (w - 1) / 4
                let totalCycles = max(1, (buildWeeks - 1) / 4)
                let baseProgress = Double(cycleNum) / Double(totalCycles)
                let cycleKm = startKm + (peakKm - startKm) * baseProgress

                if cycleWeek == 3 {
                    targetKm = cycleKm * 0.75  // cutback week
                    phase = "Recovery"
                    phaseColor = .blue
                } else {
                    let weekKm = cycleKm * (1 + Double(cycleWeek) * 0.1)
                    targetKm = min(weekKm, peakKm)
                    let isEarlyBuild = baseProgress < 0.4
                    phase = isEarlyBuild ? "Base" : "Build"
                    phaseColor = isEarlyBuild ? .blue : .orange
                }
            }

            // Peak weeks
            let finalPhase = targetKm >= peakKm * 0.9 && !isTaper ? "Peak" : phase
            let finalColor = finalPhase == "Peak" ? Color.red : phaseColor

            plan.append(WeekPlan(
                id: w,
                weekStart: weekStart,
                targetKm: max(targetKm, selectedDistance.minWeeklyKm * 0.3),
                phase: finalPhase,
                phaseColor: finalColor
            ))
        }

        weekPlan = plan
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let distType = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, distType])) != nil else {
            buildPlan(); return
        }

        let fourWeeksAgo = Calendar.current.date(byAdding: .weekOfYear, value: -4, to: Date())!

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: fourWeeksAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: .running)
            ])
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        let kmUnit = HKUnit.meterUnit(with: .kilo)
        let totalKm = workouts.compactMap { w in
            w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: kmUnit)
        }.reduce(0, +)

        currentWeeklyKm = totalKm / 4.0
        buildPlan()
    }
}

#Preview {
    NavigationStack {
        RaceGoalPlannerView()
    }
}
