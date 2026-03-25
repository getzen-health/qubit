import SwiftUI
import HealthKit
import Charts

// MARK: - BoneLoadingView
// Estimates weekly bone mechanical loading from impact activities (running, walking, climbing).
// Science: Wolff's Law (1892): bone adapts its structure to mechanical load — "use it or lose it".
//   Nikander et al. 2010 (Br J Sports Med): High-impact sport athletes have significantly
//   higher bone mineral density than non-impact sport athletes.
//   MacKelvie et al. 2002 (Br J Sports Med): Regular impact loading critical for peak bone mass.
//   Running: ~2.0–3.0× body weight per foot strike; walking ~1.2×; cycling/swimming = 0×.
// Key insight: Cycling and swimming, despite cardiovascular benefits, provide NO bone loading.
//   Impact-deficient athletes are at elevated osteoporosis risk (Tenforde 2010, CJSM).

struct BoneLoadingView: View {

    // MARK: - Models

    struct ActivityImpact {
        // Impact factor relative to body weight per unit (steps or floors)
        static let running: Double  = 2.5   // per running step
        static let walking: Double  = 1.2   // per walking step
        static let climbing: Double = 1.8   // per floor
    }

    struct WeekBoneLoad: Identifiable {
        let id = UUID()
        let weekStart: Date
        let weekLabel: String
        let runSteps: Int
        let walkSteps: Int
        let flightsClimbed: Int
        var boneLoadScore: Double {
            // Normalized: running step × 2.5, walk step × 1.2, flight × 1.8 (×10 steps/floor)
            let run  = Double(runSteps)  * ActivityImpact.running
            let walk = Double(walkSteps) * ActivityImpact.walking
            let climb = Double(flightsClimbed) * 10 * ActivityImpact.climbing
            return (run + walk + climb) / 1_000  // scale to readable units
        }
        var level: BoneLevel {
            switch boneLoadScore {
            case 500...:   return .high
            case 200..<500: return .moderate
            case 50..<200:  return .low
            default:        return .minimal
            }
        }
    }

    enum BoneLevel: String {
        case high     = "Excellent"
        case moderate = "Good"
        case low      = "Low"
        case minimal  = "Minimal"
        var color: Color {
            switch self {
            case .high:     return .green
            case .moderate: return .blue
            case .low:      return .orange
            case .minimal:  return .red
            }
        }
    }

    struct SportImpact: Identifiable {
        let id = UUID()
        let name: String
        let isImpact: Bool
        let count: Int
        let totalMins: Double
    }

    // MARK: - State

    @State private var weeklyLoads: [WeekBoneLoad] = []
    @State private var totalRunSteps: Int = 0
    @State private var totalWalkSteps: Int = 0
    @State private var totalFlights: Int = 0
    @State private var impactSports: [SportImpact] = []
    @State private var nonImpactWorkoutMins: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Calculating bone loading…")
                        .padding(.top, 60)
                } else {
                    let currentWeek = weeklyLoads.last
                    summaryCard(currentWeek)
                    boneLoadChart
                    impactBreakdownCard
                    if nonImpactWorkoutMins > 0 { nonImpactWarningCard }
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Bone Loading")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary

    private func summaryCard(_ week: WeekBoneLoad?) -> some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: week.map { String(format: "%.0f", $0.boneLoadScore) } ?? "—",
                    label: "This Week",
                    sub: "bone load units",
                    color: week?.level.color ?? .secondary
                )
                Divider().frame(height: 44)
                statBox(
                    value: totalRunSteps > 0 ? String(format: "%.0fK", Double(totalRunSteps) / 1000) : "—",
                    label: "Run Steps",
                    sub: "high-impact (×2.5)",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: totalFlights > 0 ? "\(totalFlights)" : "—",
                    label: "Floors",
                    sub: "stair impacts (×1.8)",
                    color: .blue
                )
            }
            .padding(.vertical, 12)

            if let w = week {
                HStack {
                    Image(systemName: levelIcon(w.level))
                        .foregroundStyle(w.level.color)
                    Text(levelMessage(w))
                        .font(.caption)
                        .foregroundStyle(w.level.color)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func levelIcon(_ level: BoneLevel) -> String {
        switch level {
        case .high:     return "checkmark.circle.fill"
        case .moderate: return "circle.fill"
        case .low:      return "exclamationmark.circle"
        case .minimal:  return "exclamationmark.triangle.fill"
        }
    }

    private func levelMessage(_ week: WeekBoneLoad) -> String {
        switch week.level {
        case .high:     return "Excellent bone loading — maintain this impact activity for long-term bone health"
        case .moderate: return "Good impact activity — consider adding running or stair climbing for more loading"
        case .low:      return "Low bone loading this week — add weight-bearing activity (walk, run, stairs)"
        case .minimal:  return "Minimal bone loading — dominant impact-free sports don't build bone density"
        }
    }

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Bone Load Chart

    private var boneLoadChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Bone Load — 8 Weeks", systemImage: "figure.run.circle.fill")
                .font(.subheadline).bold()
            Text("Combined impact score from running (×2.5), walking (×1.2), and stair climbing (×1.8 per floor). Higher = better for bone density.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weeklyLoads.suffix(8)) { week in
                BarMark(
                    x: .value("Week", week.weekLabel),
                    y: .value("Load", week.boneLoadScore)
                )
                .foregroundStyle(week.level.color.gradient)
                .cornerRadius(3)
            }
            .frame(height: 130)

            HStack(spacing: 12) {
                legendDot(color: .green,  label: "Excellent")
                legendDot(color: .blue,   label: "Good")
                legendDot(color: .orange, label: "Low")
                legendDot(color: .red,    label: "Minimal")
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
            Circle().fill(color).frame(width: 7, height: 7)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Impact Breakdown

    private var impactBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Impact Activity (30 Days)", systemImage: "figure.walk.circle.fill")
                .font(.subheadline).bold()

            let impactRows: [(label: String, value: String, sub: String, color: Color)] = [
                ("Running Steps", totalRunSteps > 0 ? String(format: "%dK", totalRunSteps / 1000) : "0", "Impact factor ×2.5 per step", .orange),
                ("Walking Steps", totalWalkSteps > 0 ? String(format: "%dK", totalWalkSteps / 1000) : "0", "Impact factor ×1.2 per step", .blue),
                ("Floors Climbed", "\(totalFlights)", "Impact factor ×1.8 per floor (×10 steps)", .green),
            ]

            ForEach(impactRows, id: \.label) { row in
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(row.label).font(.caption.bold())
                        Text(row.sub).font(.caption2).foregroundStyle(.tertiary)
                    }
                    Spacer()
                    Text(row.value).font(.caption.bold()).foregroundStyle(row.color)
                }
                if row.label != impactRows.last?.label { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Non-Impact Warning

    private var nonImpactWarningCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Non-Impact Activities", systemImage: "exclamationmark.circle.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)
            Text(String(format: "%.0f minutes of cycling, swimming, or similar non-impact training in the last 30 days. These activities provide excellent cardiovascular benefits but ZERO bone mechanical loading.", nonImpactWorkoutMins))
                .font(.caption).foregroundStyle(.secondary)
            Text("Consider adding short runs or walks to your non-impact sessions to maintain bone loading, especially if you're an endurance cyclist or swimmer.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Bone Health Science", systemImage: "cross.case.fill")
                .font(.subheadline).bold()
            Text("Wolff's Law (1892): Bone remodels in response to mechanical stress — loaded bone becomes denser; unloaded bone atrophies. Running exerts 2.0–3.0× body weight per foot strike, generating optimal osteogenic stimulus.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Nikander et al. 2010 (Br J Sports Med): High-impact athletes have significantly higher bone mineral density than non-impact sport athletes. Tenforde et al. 2010 (Clin J Sport Med): Impact-deficient athletes (cyclists, swimmers) face elevated fracture risk.")
                .font(.caption).foregroundStyle(.secondary)
            Text("MacKelvie et al. 2002 (Br J Sports Med): Consistent weight-bearing impact exercise is critical for achieving peak bone mass during adolescence, and maintaining it throughout life.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.green.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let stepType    = HKQuantityType(.stepCount)
        let flightType  = HKQuantityType(.flightsClimbed)
        let workoutType = HKObjectType.workoutType()

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [stepType, flightType, workoutType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .day, value: -56, to: end) ?? Date()  // 8 weeks
        let start30 = calendar.date(byAdding: .day, value: -30, to: end) ?? Date()

        let interval = DateComponents(day: 1)
        let anchor = calendar.startOfDay(for: start)

        // Step count collection
        let stepCollection: HKStatisticsCollection? = await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(
                quantityType: stepType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: end),
                options: .cumulativeSum, anchorDate: anchor, intervalComponents: interval)
            q.initialResultsHandler = { _, results, _ in cont.resume(returning: results) }
            healthStore.execute(q)
        }

        // Flight count collection
        let flightCollection: HKStatisticsCollection? = await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(
                quantityType: flightType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: end),
                options: .cumulativeSum, anchorDate: anchor, intervalComponents: interval)
            q.initialResultsHandler = { _, results, _ in cont.resume(returning: results) }
            healthStore.execute(q)
        }

        // Workouts for run vs non-impact separation
        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start30, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        processData(steps: stepCollection, flights: flightCollection, workouts: rawWorkouts, start: start, end: end)
        isLoading = false
    }

    private func processData(steps: HKStatisticsCollection?, flights: HKStatisticsCollection?,
                              workouts: [HKWorkout], start: Date, end: Date) {
        // Build daily steps & flights
        var dailySteps: [Date: Int] = [:]
        steps?.enumerateStatistics(from: start, to: end) { stat, _ in
            let day = calendar.startOfDay(for: stat.startDate)
            dailySteps[day] = Int(stat.sumQuantity()?.doubleValue(for: .count()) ?? 0)
        }

        var dailyFlights: [Date: Int] = [:]
        flights?.enumerateStatistics(from: start, to: end) { stat, _ in
            let day = calendar.startOfDay(for: stat.startDate)
            dailyFlights[day] = Int(stat.sumQuantity()?.doubleValue(for: .count()) ?? 0)
        }

        // Estimate running steps from workouts
        var dailyRunSteps: [Date: Int] = [:]
        var nonImpactMins = 0.0
        for w in workouts {
            let day = calendar.startOfDay(for: w.startDate)
            if w.workoutActivityType.isImpactActivity {
                // Estimate run steps from distance or duration
                let distanceM = w.totalDistance?.doubleValue(for: .meter()) ?? 0
                let runStepsEstimate = distanceM > 0
                    ? Int(distanceM / 0.8)  // ~0.8m stride length
                    : Int(w.duration / 60 * 150)  // ~150 steps/min if no distance
                dailyRunSteps[day, default: 0] += runStepsEstimate
            } else {
                nonImpactMins += w.duration / 60
            }
        }

        // Build weekly aggregates
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        func weekStart(for date: Date) -> Date {
            calendar.nextDate(after: date, matching: DateComponents(weekday: 2),
                              matchingPolicy: .previousTimePreservingSmallerComponents,
                              direction: .backward) ?? calendar.startOfDay(for: date)
        }

        var weekMap: [Date: (runSteps: Int, walkSteps: Int, flights: Int)] = [:]
        var cursor = start
        while cursor <= end {
            let day = calendar.startOfDay(for: cursor)
            let ws = weekStart(for: day)
            let run = dailyRunSteps[day] ?? 0
            let totalSteps = dailySteps[day] ?? 0
            let walk = max(0, totalSteps - run)
            let fl = dailyFlights[day] ?? 0
            let cur = weekMap[ws] ?? (runSteps: 0, walkSteps: 0, flights: 0)
            weekMap[ws] = (runSteps: cur.runSteps + run, walkSteps: cur.walkSteps + walk, flights: cur.flights + fl)
            cursor = calendar.date(byAdding: .day, value: 1, to: cursor) ?? Date()
        }

        let weeklyList = weekMap.sorted { $0.key < $1.key }.map { ws, vals in
            WeekBoneLoad(weekStart: ws, weekLabel: formatter.string(from: ws),
                          runSteps: vals.runSteps, walkSteps: vals.walkSteps, flightsClimbed: vals.flights)
        }

        let last30start = calendar.date(byAdding: .day, value: -30, to: end) ?? Date()
        let recentDays = weeklyList.filter { $0.weekStart >= weekStart(for: last30start) }
        let totalRun  = recentDays.map(\.runSteps).reduce(0, +)
        let totalWalk = recentDays.map(\.walkSteps).reduce(0, +)
        let totalFl   = recentDays.map(\.flightsClimbed).reduce(0, +)

        DispatchQueue.main.async {
            self.weeklyLoads = weeklyList
            self.totalRunSteps = totalRun
            self.totalWalkSteps = totalWalk
            self.totalFlights = totalFl
            self.nonImpactWorkoutMins = nonImpactMins
            self.isLoading = false
        }
    }
}

private extension HKWorkoutActivityType {
    var isImpactActivity: Bool {
        switch self {
        case .running, .hiking, .stairClimbing, .jumpRope: return true
        default: return false
        }
    }
}
