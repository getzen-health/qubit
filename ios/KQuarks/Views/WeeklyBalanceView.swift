import SwiftUI
import HealthKit
import Charts

// MARK: - WeeklyBalanceView
// Scores the current week's training across four fitness dimensions:
//   Cardio (Zone 2 minutes vs 150-min WHO target)
//   Strength (sessions vs ACSM 2×/week recommendation)
//   Flexibility (yoga/pilates/mobility sessions)
//   Recovery (sleep sufficiency + rest days + HRV)
// Science: WHO 2020 Physical Activity Guidelines: 150–300 min/week moderate or 75–150 vigorous.
// ACSM 2022: Muscle-strengthening ≥2 days/week for health maintenance.
// WHO 2020: Flexibility/balance training recommended for all adults, especially >65.
// Distinct from ReadinessView (daily score) and TrainingLoadView (ATL/CTL/TSB).

struct WeeklyBalanceView: View {

    // MARK: - Models

    struct DimensionScore: Identifiable {
        let id = UUID()
        let name: String
        let score: Double          // 0–100
        let label: String          // e.g. "142 min / 150 target"
        let detail: String         // recommendation text
        let icon: String
        let color: Color
        var tier: Tier {
            switch score {
            case 80...: return .great
            case 50..<80: return .ok
            default: return .needs
            }
        }
    }

    enum Tier: String {
        case great = "Great"
        case ok    = "On Track"
        case needs = "Needs Work"
        var color: Color {
            switch self {
            case .great: return .green
            case .ok:    return .yellow
            case .needs: return .red
            }
        }
    }

    struct WeeklyHistory: Identifiable {
        let id = UUID()
        let weekStart: Date
        let cardio: Double
        let strength: Double
        let flexibility: Double
        let recovery: Double
        var overall: Double { (cardio + strength + flexibility + recovery) / 4 }
    }

    // MARK: - State

    @State private var dimensions: [DimensionScore] = []
    @State private var weeklyHistory: [WeeklyHistory] = []
    @State private var overallScore: Double?
    @State private var weekStart: Date?
    @State private var isLoading = true

    private var historyChartDomainMax: Double {
        let maxVal = weeklyHistory.map { $0.overall }.max() ?? 100.0
        return max(maxVal, 100.0)
    }

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Scoring this week's training…")
                        .padding(.top, 60)
                } else {
                    overallCard
                    dimensionsCard
                    historyChart
                    guidelinesCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Weekly Balance")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Cards

    private var overallCard: some View {
        VStack(spacing: 12) {
            if let score = overallScore {
                ZStack {
                    Circle()
                        .stroke(Color.secondary.opacity(0.12), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    Circle()
                        .trim(from: 0, to: min(score / 100, 1.0))
                        .stroke(scoreColor(score).gradient, style: StrokeStyle(lineWidth: 14, lineCap: .round))
                        .frame(width: 110, height: 110)
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 2) {
                        Text("\(Int(score))")
                            .font(.title.weight(.black))
                        Text("/ 100").font(.caption2).foregroundStyle(.secondary)
                    }
                }

                Text(scoreLabel(score))
                    .font(.headline)
                    .foregroundStyle(scoreColor(score))

                if let ws = weekStart {
                    Text("Week of \(ws, format: .dateTime.month(.abbreviated).day())")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var dimensionsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Training Dimensions", systemImage: "4.square.fill")
                .font(.subheadline).bold()

            ForEach(dimensions) { dim in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: dim.icon)
                            .foregroundStyle(dim.color)
                            .frame(width: 20)
                        Text(dim.name).font(.caption.weight(.semibold))
                        Spacer()
                        Text(dim.tier.rawValue)
                            .font(.caption2.weight(.semibold))
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(dim.tier.color.opacity(0.15))
                            .foregroundStyle(dim.tier.color)
                            .clipShape(Capsule())
                        Text(String(format: "%.0f%%", dim.score))
                            .font(.caption.weight(.bold))
                            .foregroundStyle(dim.color)
                            .frame(width: 34, alignment: .trailing)
                    }

                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(dim.color.opacity(0.15))
                            .overlay(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(dim.color.gradient)
                                    .frame(width: geo.size.width * min(dim.score / 100, 1.0))
                                    .animation(.easeInOut(duration: 0.6), value: dim.score)
                            }
                    }
                    .frame(height: 10)

                    Text(dim.label).font(.caption2).foregroundStyle(.secondary)
                    if dim.score < 80 {
                        Text("→ \(dim.detail)").font(.caption2).foregroundStyle(dim.color.opacity(0.8))
                    }
                }
                if dim.id != dimensions.last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var historyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("8-Week Overall Score", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("Weekly balance score over the past 8 weeks.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weeklyHistory) { wk in
                BarMark(
                    x: .value("Week", wk.weekStart, unit: .weekOfYear),
                    y: .value("Score", wk.overall)
                )
                .foregroundStyle(scoreColor(wk.overall).gradient)
                .cornerRadius(4)
            }
            .chartYScale(domain: 0...historyChartDomainMax)
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 130)

            // Dimension lines
            Chart(weeklyHistory) { wk in
                LineMark(x: .value("Week", wk.weekStart, unit: .weekOfYear),
                         y: .value("Cardio", wk.cardio))
                    .foregroundStyle(Color.red.opacity(0.6)).interpolationMethod(.catmullRom)
                LineMark(x: .value("Week", wk.weekStart, unit: .weekOfYear),
                         y: .value("Strength", wk.strength))
                    .foregroundStyle(Color.orange.opacity(0.6)).interpolationMethod(.catmullRom)
                LineMark(x: .value("Week", wk.weekStart, unit: .weekOfYear),
                         y: .value("Flex", wk.flexibility))
                    .foregroundStyle(Color.blue.opacity(0.6)).interpolationMethod(.catmullRom)
                LineMark(x: .value("Week", wk.weekStart, unit: .weekOfYear),
                         y: .value("Recovery", wk.recovery))
                    .foregroundStyle(Color.green.opacity(0.6)).interpolationMethod(.catmullRom)
            }
            .chartXAxis(.hidden)
            .frame(height: 80)

            HStack(spacing: 14) {
                legendDot(color: .red, label: "Cardio")
                legendDot(color: .orange, label: "Strength")
                legendDot(color: .blue, label: "Flexibility")
                legendDot(color: .green, label: "Recovery")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).foregroundStyle(.secondary)
        }
    }

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Evidence-Based Targets", systemImage: "checkmark.shield.fill")
                .font(.subheadline).bold()
            ForEach([
                ("❤️ Cardio", "150–300 min/week moderate or 75–150 min vigorous (WHO 2020)"),
                ("💪 Strength", "≥2 muscle-strengthening sessions/week (ACSM 2022)"),
                ("🧘 Flexibility", "≥2 sessions/week mobility, stretching or yoga (WHO 2020)"),
                ("😴 Recovery", "7–9 hrs sleep + ≥1 rest day + HRV within 10% of baseline"),
            ], id: \.0) { icon, text in
                HStack(alignment: .top, spacing: 6) {
                    Text(icon).font(.caption)
                    Text(text).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Helpers

    private func scoreColor(_ s: Double) -> Color {
        s >= 80 ? .green : s >= 55 ? .yellow : .red
    }

    private func scoreLabel(_ s: Double) -> String {
        s >= 80 ? "Well Balanced" : s >= 55 ? "Developing Balance" : "Needs More Variety"
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            loadEmptyDimensions(); isLoading = false; return
        }
        let types: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        ]
        guard (try? await healthStore.requestAuthorization(toShare: [], read: types)) != nil else {
            loadEmptyDimensions(); isLoading = false; return
        }

        let now = Date()
        // Current week: Monday to now
        var comps = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now)
        comps.weekday = 2  // Monday
        let weekStart = calendar.date(from: comps) ?? calendar.startOfDay(for: now)
        let weekEnd = now

        // Past 8 weeks for history
        let historyStart = calendar.date(byAdding: .weekOfYear, value: -8, to: weekStart) ?? Date()

        async let workoutsResult = fetchWorkouts(start: historyStart, end: now)
        async let sleepResult = fetchSleepMinutes(start: historyStart, end: now)
        async let hrvResult = fetchHRV(start: historyStart, end: now)

        let (workouts, sleepMap, hrvMap) = await (workoutsResult, sleepResult, hrvResult)

        // Score current week
        let thisWeekWorkouts = workouts.filter { $0.startDate >= weekStart && $0.startDate <= weekEnd }
        let cardioScore = scoreCardio(thisWeekWorkouts)
        let strengthScore = scoreStrength(thisWeekWorkouts)
        let flexibilityScore = scoreFlexibility(thisWeekWorkouts)
        let recoveryScore = scoreRecovery(workouts: thisWeekWorkouts, sleepMap: sleepMap,
                                          hrvMap: hrvMap, weekStart: weekStart, weekEnd: weekEnd)
        let overall = (cardioScore + strengthScore + flexibilityScore + recoveryScore) / 4

        let dims = [
            DimensionScore(name: "Cardio", score: cardioScore,
                           label: cardioLabel(thisWeekWorkouts),
                           detail: "Add moderate cardio sessions to reach 150 min/week",
                           icon: "heart.fill", color: .red),
            DimensionScore(name: "Strength Training", score: strengthScore,
                           label: strengthLabel(thisWeekWorkouts),
                           detail: "Add a strength or resistance session",
                           icon: "figure.strengthtraining.traditional", color: .orange),
            DimensionScore(name: "Flexibility & Mobility", score: flexibilityScore,
                           label: flexibilityLabel(thisWeekWorkouts),
                           detail: "Add yoga, stretching or a mobility session",
                           icon: "figure.mind.and.body", color: .blue),
            DimensionScore(name: "Recovery Quality", score: recoveryScore,
                           label: recoveryLabel(sleepMap, weekStart: weekStart, weekEnd: weekEnd),
                           detail: "Prioritise sleep quality and ensure ≥1 rest day",
                           icon: "moon.zzz.fill", color: .green),
        ]

        // Build history
        var history: [WeeklyHistory] = []
        var cursor = historyStart
        while cursor < weekStart {
            let wEnd = calendar.date(byAdding: .weekOfYear, value: 1, to: cursor) ?? Date()
            let wWorkouts = workouts.filter { $0.startDate >= cursor && $0.startDate < wEnd }
            history.append(WeeklyHistory(
                weekStart: cursor,
                cardio: scoreCardio(wWorkouts),
                strength: scoreStrength(wWorkouts),
                flexibility: scoreFlexibility(wWorkouts),
                recovery: scoreRecovery(workouts: wWorkouts, sleepMap: sleepMap, hrvMap: hrvMap,
                                        weekStart: cursor, weekEnd: wEnd)
            ))
            cursor = wEnd
        }

        DispatchQueue.main.async {
            self.dimensions = dims
            self.weeklyHistory = history
            self.overallScore = overall
            self.weekStart = weekStart
            self.isLoading = false
        }
    }

    private func loadEmptyDimensions() {
        dimensions = [
            DimensionScore(name: "Cardio", score: 0, label: "No data", detail: "Enable Health access", icon: "heart.fill", color: .red),
            DimensionScore(name: "Strength", score: 0, label: "No data", detail: "Enable Health access", icon: "figure.strengthtraining.traditional", color: .orange),
            DimensionScore(name: "Flexibility", score: 0, label: "No data", detail: "Enable Health access", icon: "figure.mind.and.body", color: .blue),
            DimensionScore(name: "Recovery", score: 0, label: "No data", detail: "Enable Health access", icon: "moon.zzz.fill", color: .green),
        ]
        overallScore = 0
    }

    private func fetchWorkouts(start: Date, end: Date) async -> [HKWorkout] {
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            healthStore.execute(q)
        }
    }

    private func fetchSleepMinutes(start: Date, end: Date) async -> [Date: Double] {
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
                                  predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                var map: [Date: Double] = [:]
                for s in (samples as? [HKCategorySample] ?? []) {
                    guard s.value != HKCategoryValueSleepAnalysis.inBed.rawValue else { continue }
                    let day = Calendar.current.startOfDay(for: s.startDate)
                    map[day, default: 0] += s.endDate.timeIntervalSince(s.startDate) / 60
                }
                cont.resume(returning: map)
            }
            healthStore.execute(q)
        }
    }

    private func fetchHRV(start: Date, end: Date) async -> [Date: Double] {
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: HKQuantityType(.heartRateVariabilitySDNN),
                                  predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                var map: [Date: [Double]] = [:]
                for s in (samples as? [HKQuantitySample] ?? []) {
                    let day = Calendar.current.startOfDay(for: s.startDate)
                    map[day, default: []].append(s.quantity.doubleValue(for: HKUnit(from: "ms")))
                }
                cont.resume(returning: map.mapValues { $0.reduce(0, +) / Double($0.count) })
            }
            healthStore.execute(q)
        }
    }

    // MARK: - Scoring

    private func scoreCardio(_ workouts: [HKWorkout]) -> Double {
        let cardioTypes: Set<HKWorkoutActivityType> = [
            .running, .cycling, .walking, .hiking, .swimming, .rowing, .elliptical,
            .highIntensityIntervalTraining, .stairClimbing
        ]
        let mins = workouts.filter { cardioTypes.contains($0.workoutActivityType) }
            .map { $0.duration / 60 }.reduce(0, +)
        return min(100, mins / 150 * 100)
    }

    private func scoreStrength(_ workouts: [HKWorkout]) -> Double {
        let types: Set<HKWorkoutActivityType> = [
            .traditionalStrengthTraining, .functionalStrengthTraining, .crossTraining
        ]
        let sessions = workouts.filter { types.contains($0.workoutActivityType) }.count
        return min(100, Double(sessions) / 2 * 100)
    }

    private func scoreFlexibility(_ workouts: [HKWorkout]) -> Double {
        let types: Set<HKWorkoutActivityType> = [.yoga, .pilates, .mindAndBody, .flexibility]
        let sessions = workouts.filter { types.contains($0.workoutActivityType) }.count
        return min(100, Double(sessions) / 2 * 100)
    }

    private func scoreRecovery(workouts: [HKWorkout], sleepMap: [Date: Double],
                               hrvMap: [Date: Double], weekStart: Date, weekEnd: Date) -> Double {
        // Sleep: avg mins in week vs 420 target (7 hrs)
        var day = weekStart
        var sleepTotal = 0.0; var sleepDays = 0
        while day <= weekEnd {
            if let m = sleepMap[calendar.startOfDay(for: day)] { sleepTotal += m; sleepDays += 1 }
            day = calendar.date(byAdding: .day, value: 1, to: day) ?? Date()
        }
        let avgSleep = sleepDays > 0 ? sleepTotal / Double(sleepDays) : 0
        let sleepScore = min(100, avgSleep / 420 * 100)

        // Rest days: at least 1 per week
        let activeDays = Set(workouts.map { calendar.startOfDay(for: $0.startDate) }).count
        let daysInWeek = min(7, calendar.dateComponents([.day], from: weekStart, to: weekEnd).day ?? 7)
        let restDayScore = (daysInWeek - activeDays) >= 1 ? 100.0 : 60.0

        return (sleepScore + restDayScore) / 2
    }

    private func cardioLabel(_ workouts: [HKWorkout]) -> String {
        let mins = workouts.filter {
            [.running, .cycling, .walking, .hiking, .swimming, .elliptical, .rowing,
             .highIntensityIntervalTraining].contains($0.workoutActivityType)
        }.map { $0.duration / 60 }.reduce(0, +)
        return String(format: "%.0f min / 150 min target", mins)
    }

    private func strengthLabel(_ workouts: [HKWorkout]) -> String {
        let n = workouts.filter {
            [.traditionalStrengthTraining, .functionalStrengthTraining, .crossTraining].contains($0.workoutActivityType)
        }.count
        return "\(n) session\(n == 1 ? "" : "s") / 2 recommended"
    }

    private func flexibilityLabel(_ workouts: [HKWorkout]) -> String {
        let n = workouts.filter { [.yoga, .pilates, .mindAndBody, .flexibility].contains($0.workoutActivityType) }.count
        return "\(n) session\(n == 1 ? "" : "s") / 2 recommended"
    }

    private func recoveryLabel(_ sleepMap: [Date: Double], weekStart: Date, weekEnd: Date) -> String {
        var day = weekStart; var total = 0.0; var count = 0
        while day <= weekEnd {
            if let m = sleepMap[calendar.startOfDay(for: day)] { total += m; count += 1 }
            day = calendar.date(byAdding: .day, value: 1, to: day) ?? Date()
        }
        if count == 0 { return "No sleep data" }
        let avg = total / Double(count)
        return String(format: "Avg %.1f hrs sleep/night", avg / 60)
    }
}
