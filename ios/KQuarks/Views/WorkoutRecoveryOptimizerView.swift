import SwiftUI
import HealthKit
import Charts

// MARK: - WorkoutRecoveryOptimizerView
// Scores each workout by the next morning's HRV and RHR relative to personal baseline.
// Identifies which workout types, durations, and intensities generate the best/worst recovery.
// Science: Buchheit 2014 (Sports Medicine: HRV as recovery indicator),
// Plews et al. 2013 (IJSPP: next-day HRV), Meur 2013 (recovery fatigue taxonomy).
// Distinct from WorkoutSleepImpactView (sleep stages) and OvertrainingWarningView (composite).

struct WorkoutRecoveryOptimizerView: View {

    // MARK: - Model

    struct RecoveredSession: Identifiable {
        let id = UUID()
        let date: Date
        let workoutType: String
        let durationMins: Int
        let activeCalories: Int
        let hrvNext: Double?    // next morning HRV vs baseline
        let rhrNext: Double?    // next morning RHR vs baseline
        let recoveryScore: Int  // 0-100
        var recoveryGrade: Grade {
            switch recoveryScore {
            case 85...:   return .excellent
            case 70..<85: return .good
            case 50..<70: return .fair
            default:      return .poor
            }
        }
    }

    enum Grade: String {
        case excellent = "Excellent"
        case good = "Good"
        case fair = "Fair"
        case poor = "Poor"

        var color: Color {
            switch self {
            case .excellent: return .green
            case .good:      return .mint
            case .fair:      return .orange
            case .poor:      return .red
            }
        }
    }

    struct SportRecovery: Identifiable {
        let id = UUID()
        let name: String
        let avgScore: Double
        let count: Int
        let color: Color
    }

    struct ScorePoint: Identifiable {
        let id = UUID()
        let date: Date
        let score: Double
        let sport: String
    }

    // MARK: - State

    @State private var sessions: [RecoveredSession] = []
    @State private var sportSummaries: [SportRecovery] = []
    @State private var recentPoints: [ScorePoint] = []
    @State private var avgRecovery: Double?
    @State private var bestSport: String?
    @State private var worstSport: String?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                if let avg = avgRecovery {
                    overviewCard(avg: avg)
                }
                if !sportSummaries.isEmpty { sportCard }
                if !recentPoints.isEmpty  { trendCard }
                if !sessions.isEmpty      { sessionListCard }
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Recovery Optimizer")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Analyzing post-workout recovery…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private func overviewCard(avg: Double) -> some View {
        VStack(spacing: 14) {
            HStack(alignment: .center, spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(Color(.tertiarySystemBackground), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    Circle()
                        .trim(from: 0, to: CGFloat(avg) / 100)
                        .stroke(gradeColor(avg).gradient,
                                style: StrokeStyle(lineWidth: 14, lineCap: .round))
                        .frame(width: 110, height: 110)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.8), value: avg)
                    VStack(spacing: 2) {
                        Text(String(format: "%.0f", avg))
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(gradeColor(avg))
                        Text("avg").font(.caption2).foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Recovery Quality").font(.headline)
                        Text(gradeLabel(avg))
                            .font(.subheadline).bold()
                            .foregroundStyle(gradeColor(avg))
                        Text("Avg next-morning HRV & RHR response across \(sessions.count) sessions")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    if let best = bestSport, let worst = worstSport {
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Best recovery").font(.caption2).foregroundStyle(.secondary)
                                Text(best).font(.caption.weight(.semibold)).foregroundStyle(.green)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Hardest recovery").font(.caption2).foregroundStyle(.secondary)
                                Text(worst).font(.caption.weight(.semibold)).foregroundStyle(.orange)
                            }
                        }
                    }
                }
                Spacer()
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var sportCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recovery by Sport", systemImage: "figure.mixed.cardio")
                .font(.subheadline).bold()
            Text("Average next-morning recovery score (HRV + RHR composite) after each workout type.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(sportSummaries.sorted { $0.avgScore > $1.avgScore }) { sport in
                HStack(spacing: 10) {
                    Text(sport.name)
                        .font(.caption)
                        .frame(width: 110, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(height: 16)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(gradeColor(sport.avgScore).gradient)
                                .frame(width: geo.size.width * CGFloat(sport.avgScore / 100), height: 16)
                                .animation(.easeInOut(duration: 0.6), value: sport.avgScore)
                        }
                    }
                    .frame(height: 16)
                    Text(String(format: "%.0f", sport.avgScore))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(gradeColor(sport.avgScore))
                        .frame(width: 32, alignment: .trailing)
                    Text("(\(sport.count))")
                        .font(.caption2).foregroundStyle(.secondary)
                        .frame(width: 28, alignment: .leading)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var trendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recovery Score Trend", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()

            Chart(recentPoints) { pt in
                PointMark(x: .value("Date", pt.date),
                          y: .value("Score", pt.score))
                    .foregroundStyle(gradeColor(pt.score).gradient)
                    .symbolSize(50)
                LineMark(x: .value("Date", pt.date),
                         y: .value("Score", pt.score))
                    .foregroundStyle(Color.blue.opacity(0.3))
                    .interpolationMethod(.catmullRom)
                RuleMark(y: .value("Good", 70))
                    .foregroundStyle(.green.opacity(0.3))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                RuleMark(y: .value("Fair", 50))
                    .foregroundStyle(.orange.opacity(0.3))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
            }
            .frame(height: 140)
            .chartYScale(domain: 0...100)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var sessionListCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recent Sessions", systemImage: "list.bullet.rectangle.fill")
                .font(.subheadline).bold()

            ForEach(sessions.prefix(10)) { session in
                HStack(spacing: 12) {
                    Circle()
                        .fill(session.recoveryGrade.color.opacity(0.8))
                        .frame(width: 10, height: 10)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(session.workoutType).font(.caption.weight(.semibold))
                        Text(session.date.formatted(.dateTime.month(.abbreviated).day().year()))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("\(session.durationMins)m")
                        .font(.caption2).foregroundStyle(.secondary)
                    Text("\(session.activeCalories) cal")
                        .font(.caption2).foregroundStyle(.secondary)
                    VStack(alignment: .trailing, spacing: 1) {
                        Text("\(session.recoveryScore)")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(session.recoveryGrade.color)
                        Text(session.recoveryGrade.rawValue)
                            .font(.system(size: 9))
                            .foregroundStyle(session.recoveryGrade.color)
                    }
                }
                Divider()
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Science", systemImage: "book.closed.fill")
                .font(.subheadline).bold()
            scienceItem("HRV as Recovery Indicator (Buchheit 2014)", detail: "Next-morning HRV provides a sensitive and specific signal for physiological recovery status. HRV >2% above baseline = well-recovered. HRV <5% below baseline = accumulated fatigue.")
            scienceItem("Recovery Score Calculation", detail: "Score 0-100 based on: next-morning HRV deviation from 30-day baseline (70% weight) + RHR deviation (30% weight). Higher = better recovery. Score 70+ = adequate recovery for training.")
            scienceItem("Sport-Specific Recovery (Meur 2013)", detail: "High-impact sports (running, HIIT) generate greater residual fatigue than low-impact (swimming, cycling). Knowing your per-sport recovery allows smarter training sequencing.")
            scienceItem("Practical Application", detail: "If a workout type consistently scores <50, consider reducing duration or intensity for that sport. Pair high-scoring sports with harder training blocks and low-scoring sessions with easier days.")
        }
        .padding()
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func scienceItem(_ title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption).bold()
            Text(detail).font(.caption2).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Helpers

    private func gradeColor(_ score: Double) -> Color {
        score >= 85 ? .green : score >= 70 ? .mint : score >= 50 ? .orange : .red
    }

    private func gradeLabel(_ score: Double) -> String {
        score >= 85 ? "Excellent Recovery" : score >= 70 ? "Good Recovery" : score >= 50 ? "Fair Recovery" : "Poor Recovery"
    }

    private func workoutTypeName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running:              return "Running"
        case .cycling:              return "Cycling"
        case .swimming:             return "Swimming"
        case .hiking:               return "Hiking"
        case .walking:              return "Walking"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength"
        case .highIntensityIntervalTraining: return "HIIT"
        case .yoga:                 return "Yoga"
        case .rowing:               return "Rowing"
        case .soccer:               return "Soccer"
        case .tennis:               return "Tennis"
        case .basketball:           return "Basketball"
        case .crossTraining:        return "Cross Training"
        case .dance:                return "Dance"
        case .pilates:              return "Pilates"
        case .elliptical:           return "Elliptical"
        case .stairClimbing:        return "Stair Climbing"
        case .coreTraining:         return "Core"
        default:                    return "Workout"
        }
    }

    // MARK: - Data Loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            await MainActor.run { isLoading = false }; return
        }

        let types: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKQuantityType(.heartRateVariabilitySDNN),
            HKQuantityType(.restingHeartRate),
        ]
        do { try await healthStore.requestAuthorization(toShare: [], read: types) }
        catch { await MainActor.run { isLoading = false }; return }

        let since90 = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let workoutPred = HKQuery.predicateForSamples(withStart: since90, end: Date())
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        // Fetch workouts
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: workoutPred,
                                  limit: 100, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            healthStore.execute(q)
        }

        // Fetch 30-day HRV baseline
        let since30 = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let hrvBaseline: Double = await fetchAvg(.heartRateVariabilitySDNN, since: since30,
                                                 unit: HKUnit(from: "ms"))
        let rhrBaseline: Double = await fetchAvg(.restingHeartRate, since: since30,
                                                 unit: .count().unitDivided(by: .minute()))

        var results: [RecoveredSession] = []

        for workout in workouts {
            let nextDay = Calendar.current.date(byAdding: .day, value: 1, to: workout.startDate) ?? workout.startDate
            let nextDayEnd = Calendar.current.date(byAdding: .day, value: 2, to: workout.startDate) ?? workout.startDate

            // Fetch next-morning HRV and RHR
            async let nextHRV = fetchMorning(.heartRateVariabilitySDNN, from: nextDay, to: nextDayEnd,
                                             unit: HKUnit(from: "ms"))
            async let nextRHR = fetchMorning(.restingHeartRate, from: nextDay, to: nextDayEnd,
                                             unit: .count().unitDivided(by: .minute()))
            let (hrv, rhr) = await (nextHRV, nextRHR)

            // Compute recovery score
            var score = 70.0  // default if no data
            if let h = hrv, hrvBaseline > 0 {
                let hrvDev = (h - hrvBaseline) / hrvBaseline * 100
                let hrvScore = min(100, max(0, 70 + hrvDev * 0.7))
                if let r = rhr, rhrBaseline > 0 {
                    let rhrDev = (r - rhrBaseline) / rhrBaseline * 100
                    let rhrScore = min(100, max(0, 70 - rhrDev * 0.5))
                    score = hrvScore * 0.7 + rhrScore * 0.3
                } else {
                    score = hrvScore
                }
            }

            let duration = Int(workout.duration / 60)
            let calories = Int(workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0)

            results.append(RecoveredSession(
                date: workout.startDate,
                workoutType: workoutTypeName(workout.workoutActivityType),
                durationMins: duration,
                activeCalories: calories,
                hrvNext: hrv,
                rhrNext: rhr,
                recoveryScore: Int(score)
            ))
        }

        // Sport summaries
        var sportMap: [String: [Int]] = [:]
        for r in results {
            sportMap[r.workoutType, default: []].append(r.recoveryScore)
        }
        let sportColors: [Color] = [.orange, .blue, .cyan, .green, .red, .purple, .mint, .yellow]
        let summaries = sportMap.sorted { a, b in
            let aAvg = a.value.reduce(0,+) / a.value.count
            let bAvg = b.value.reduce(0,+) / b.value.count
            return aAvg > bAvg
        }.enumerated().map { idx, kv in
            SportRecovery(name: kv.key,
                          avgScore: Double(kv.value.reduce(0,+)) / Double(kv.value.count),
                          count: kv.value.count,
                          color: sportColors[idx % sportColors.count])
        }

        let avgScore = results.isEmpty ? nil : Double(results.map(\.recoveryScore).reduce(0,+)) / Double(results.count)

        let points = results.prefix(30).reversed().map { r in
            ScorePoint(date: r.date, score: Double(r.recoveryScore), sport: r.workoutType)
        }

        let best = summaries.first?.name
        let worst = summaries.last?.name

        await MainActor.run {
            sessions = results
            sportSummaries = summaries
            recentPoints = Array(points)
            avgRecovery = avgScore
            bestSport = best
            worstSport = worst
            isLoading = false
        }
    }

    private func fetchAvg(_ id: HKQuantityTypeIdentifier, since: Date, unit: HKUnit) async -> Double {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return 0 }
        let pred = HKQuery.predicateForSamples(withStart: since, end: Date())
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            healthStore.execute(q)
        }
        let vals = samples.map { $0.quantity.doubleValue(for: unit) }
        return vals.isEmpty ? 0 : vals.reduce(0,+) / Double(vals.count)
    }

    private func fetchMorning(_ id: HKQuantityTypeIdentifier, from: Date, to: Date, unit: HKUnit) async -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return nil }
        let pred = HKQuery.predicateForSamples(withStart: from, end: to)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: 5,
                                  sortDescriptors: [sort]) { _, s, _ in
                let val = (s as? [HKQuantitySample])?.first?.quantity.doubleValue(for: unit)
                cont.resume(returning: val)
            }
            healthStore.execute(q)
        }
    }
}
