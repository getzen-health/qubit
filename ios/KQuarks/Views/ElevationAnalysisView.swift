import SwiftUI
import HealthKit
import CoreLocation
import Charts

// MARK: - ElevationAnalysisView
// Analyzes elevation gain from outdoor GPS workout routes using HKWorkoutRoute.
// Outdoor runs and hikes record GPS tracks via Apple Watch + iPhone — altitude
// data (from GPS/barometric altimeter) enables training load decomposition.
//
// Science:
//   Minetti et al. 2002 (J Appl Physiol): energy cost of gradient running is
//     nonlinear — uphill running (+6% grade) costs ~2× flat; downhill recovery
//     (-10% grade) still costs ~1.5× flat. Elevation gain is a key load predictor.
//   Scharhag-Rosenberger et al. 2009 (Int J Sports Physiol Perform): for every
//     100m of climbing per km, perceived effort rises 3–4 RPE points at same pace.
//   Vogt et al. 2008 (J Sports Sci): cyclists in Tour de France average 3000–4000m
//     elevation gain per stage; altitude-adjusted TSS predicts fatigue better than time.
//   Gimenez et al. 2013 (J Strength Cond Res): trail runners accumulate 2–3× higher
//     eccentric muscle damage from downhill sections than flat running at same distance.
//
// Data: GPS altitude from CLLocation.altitude (HKWorkoutRoute), captured by iPhone
//   or Watch barometric altimeter. Accuracy: ±2–5m for altitude on modern devices.

struct ElevationAnalysisView: View {

    // MARK: - Models

    struct WorkoutElevation: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let sport: String
        let distanceKm: Double
        let gainMeters: Double          // total elevation gain (sum of +ve altitude deltas)
        let lossMeters: Double          // total descent
        let avgGradePct: Double         // gainMeters / (distanceKm * 1000) * 100
        var gainPer100m: Double { distanceKm > 0 ? gainMeters / (distanceKm * 10) : 0 }

        var terrainType: TerrainType {
            switch avgGradePct {
            case ..<1:    return .flat
            case 1..<3:   return .rolling
            case 3..<6:   return .hilly
            default:      return .mountainous
            }
        }
    }

    enum TerrainType: String {
        case flat         = "Flat"
        case rolling      = "Rolling"
        case hilly        = "Hilly"
        case mountainous  = "Mountainous"

        var color: Color {
            switch self {
            case .flat:        return .blue
            case .rolling:     return .green
            case .hilly:       return .orange
            case .mountainous: return .red
            }
        }

        var icon: String {
            switch self {
            case .flat:        return "arrow.right"
            case .rolling:     return "waveform"
            case .hilly:       return "mountain.2.fill"
            case .mountainous: return "mountain.2.circle.fill"
            }
        }
    }

    struct MonthGain: Identifiable {
        let id = UUID()
        let label: String
        let date: Date
        let totalGainM: Double
        let workouts: Int
    }

    // MARK: - State

    @State private var workouts: [WorkoutElevation] = []
    @State private var monthlyGains: [MonthGain] = []
    @State private var totalGain90d: Double = 0
    @State private var avgGainPerRun: Double = 0
    @State private var maxGainSingle: Double = 0
    @State private var isLoading = true
    @State private var loadingMessage = "Reading GPS routes…"

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView(loadingMessage)
                        .padding(.top, 60)
                } else if workouts.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    monthlyGainChart
                    terrainCard
                    recentWorkoutsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Elevation Analysis")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: totalGain90d > 1000
                        ? String(format: "%.1f km", totalGain90d / 1000)
                        : String(format: "%.0f m", totalGain90d),
                    label: "Total Climbed",
                    sub: "90 days",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgGainPerRun > 0 ? String(format: "%.0f m", avgGainPerRun) : "—",
                    label: "Avg per Workout",
                    sub: avgGainPerRun > 500 ? "Hilly" : avgGainPerRun > 200 ? "Rolling" : "Flat",
                    color: avgGainPerRun > 500 ? .red : avgGainPerRun > 200 ? .orange : .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: maxGainSingle > 0 ? String(format: "%.0f m", maxGainSingle) : "—",
                    label: "Best Climb",
                    sub: "single session",
                    color: .purple
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "mountain.2.fill")
                    .foregroundStyle(.orange)
                Text(motivationText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var motivationText: String {
        if totalGain90d > 8848 { return "You've climbed Everest height in 90 days. Extraordinary." }
        if totalGain90d > 5000 { return "Serious mountain runner — \(Int(totalGain90d))m in 90 days." }
        if totalGain90d > 2000 { return "Strong elevation base. Uphill running builds aerobic power efficiently." }
        if totalGain90d > 500  { return "Adding elevation to workouts increases metabolic demand without extra distance." }
        return "Most workouts are on flat terrain. Try adding hills — Minetti 2002: +6% grade costs 2× flat energy."
    }

    // MARK: - Monthly Gain Chart

    private var monthlyGainChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Monthly Elevation Gain", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Total meters climbed per month from GPS routes. Scharhag-Rosenberger 2009: each 100m/km gradient adds ~3–4 RPE points of perceived effort at constant pace.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(monthlyGains) { m in
                BarMark(
                    x: .value("Month", m.label),
                    y: .value("Gain (m)", m.totalGainM)
                )
                .foregroundStyle(Color.orange.gradient)
                .cornerRadius(4)
            }
            .frame(height: 140)
            .chartYAxisLabel("Elevation gain (m)")
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Terrain Card

    private var terrainCard: some View {
        let counts: [(TerrainType, Int)] = [
            (.flat,        workouts.filter { $0.terrainType == .flat }.count),
            (.rolling,     workouts.filter { $0.terrainType == .rolling }.count),
            (.hilly,       workouts.filter { $0.terrainType == .hilly }.count),
            (.mountainous, workouts.filter { $0.terrainType == .mountainous }.count),
        ]
        let total = Double(workouts.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Terrain Distribution", systemImage: "mountain.2")
                .font(.subheadline).bold()
            Text("Classified by avg gradient: flat <1%, rolling 1–3%, hilly 3–6%, mountainous >6%.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(counts, id: \.0.rawValue) { terrain, count in
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack {
                    Image(systemName: terrain.icon)
                        .foregroundStyle(terrain.color).frame(width: 20)
                    Text(terrain.rawValue).font(.caption2).frame(width: 80, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 10)
                            Capsule().fill(terrain.color.gradient).frame(width: geo.size.width * pct / 100, height: 10)
                        }
                    }
                    .frame(height: 10)
                    Text(String(format: "%.0f%%", pct))
                        .font(.caption2.bold()).foregroundStyle(terrain.color).frame(width: 32, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recent Workouts Card

    private var recentWorkoutsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recent Workouts with Elevation", systemImage: "list.bullet")
                .font(.subheadline).bold()

            ForEach(workouts.suffix(6).reversed()) { w in
                HStack {
                    Image(systemName: w.terrainType.icon)
                        .foregroundStyle(w.terrainType.color).frame(width: 20)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(w.sport)
                            .font(.caption.bold())
                        Text(w.label)
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "+%.0fm", w.gainMeters))
                            .font(.caption.bold()).foregroundStyle(.orange)
                        Text(String(format: "%.1f km  ·  %.1f%%", w.distanceKm, w.avgGradePct))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
                if w.id != workouts.suffix(6).reversed().last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Elevation Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Elevation gain fundamentally changes training stress. A 10km run with 500m of climbing has roughly the same metabolic cost as a 13–14km flat run — making route elevation a critical load management variable.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Minetti et al. 2002 (J Appl Physiol): energy cost peaks at +25% grade (+80% over flat) and remains elevated even on descents — downhill running at -10% grade costs ~1.5× flat running due to eccentric loading. This explains post-race quad soreness after hilly events.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Gimenez et al. 2013 (J Strength Cond Res): trail runners show 2–3× higher markers of muscle damage (CK, myoglobin) after hilly vs flat runs at matched pace. GPS altitude data enables precise load accounting in hilly training environments.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "mountain.2.fill")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No GPS route data found")
                .font(.headline)
            Text("Elevation analysis requires outdoor GPS workouts (running or hiking) recorded with iPhone or Apple Watch with GPS. Ensure location access is enabled in Health settings.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal)
        }
        .padding(40)
    }

    // MARK: - Helpers

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let workoutType = HKObjectType.workoutType()
        let routeType   = HKSeriesType.workoutRoute()

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, routeType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .day, value: -90, to: end)!

        // Fetch outdoor running + hiking workouts
        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                let outdoorTypes: Set<HKWorkoutActivityType> = [.running, .hiking, .cycling]
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    outdoorTypes.contains($0.workoutActivityType)
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        var result: [WorkoutElevation] = []

        await withTaskGroup(of: WorkoutElevation?.self) { group in
            for workout in rawWorkouts.prefix(30) {  // limit to 30 most recent for performance
                group.addTask {
                    await self.processWorkout(workout, fmt: fmt)
                }
            }
            for await elevation in group {
                if let e = elevation { result.append(e) }
            }
        }

        result.sort { $0.date < $1.date }

        // Monthly aggregation
        let monthFmt = DateFormatter(); monthFmt.dateFormat = "MMM"
        var monthMap: [Date: (gain: Double, count: Int)] = [:]
        for w in result {
            let ms = calendar.date(from: calendar.dateComponents([.year, .month], from: w.date))!
            let cur = monthMap[ms] ?? (0, 0)
            monthMap[ms] = (cur.gain + w.gainMeters, cur.count + 1)
        }
        var monthCursor = calendar.date(from: calendar.dateComponents([.year, .month], from: start))!
        var monthly: [MonthGain] = []
        while monthCursor <= end {
            let d = monthMap[monthCursor] ?? (0, 0)
            monthly.append(MonthGain(label: monthFmt.string(from: monthCursor), date: monthCursor,
                                     totalGainM: d.gain, workouts: d.count))
            monthCursor = calendar.date(byAdding: .month, value: 1, to: monthCursor)!
        }

        let totalGain = result.map(\.gainMeters).reduce(0, +)
        let avg       = result.isEmpty ? 0.0 : totalGain / Double(result.count)
        let maxGain   = result.map(\.gainMeters).max() ?? 0

        DispatchQueue.main.async {
            self.workouts      = result
            self.monthlyGains  = monthly
            self.totalGain90d  = totalGain
            self.avgGainPerRun = avg
            self.maxGainSingle = maxGain
            self.isLoading     = false
        }
    }

    private func processWorkout(_ workout: HKWorkout, fmt: DateFormatter) async -> WorkoutElevation? {
        // Get routes for this workout
        var routes: [HKWorkoutRoute] = []
        await withCheckedContinuation { cont in
            let routePred = HKQuery.predicateForObjects(from: workout)
            let q = HKSampleQuery(sampleType: HKSeriesType.workoutRoute(),
                                  predicate: routePred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: nil) { _, s, _ in
                routes = (s as? [HKWorkoutRoute]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        guard let route = routes.first else { return nil }

        // Stream all CLLocations from the route
        var allLocations: [CLLocation] = []
        await withCheckedContinuation { cont in
            var finished = false
            let q = HKWorkoutRouteQuery(route: route) { _, locations, done, _ in
                if let locs = locations {
                    allLocations.append(contentsOf: locs)
                }
                if done && !finished {
                    finished = true
                    cont.resume()
                }
            }
            healthStore.execute(q)
        }

        guard allLocations.count >= 2 else { return nil }

        // Calculate elevation gain (sum of positive altitude deltas)
        var gain = 0.0
        var loss = 0.0
        for i in 1..<allLocations.count {
            let delta = allLocations[i].altitude - allLocations[i-1].altitude
            if delta > 0.5 { gain += delta }
            else if delta < -0.5 { loss += abs(delta) }
        }

        guard gain > 0 else { return nil }

        let distanceM = workout.totalDistance?.doubleValue(for: .meter()) ?? 0
        let distanceKm = distanceM / 1000
        let avgGrade = distanceM > 0 ? (gain / distanceM) * 100 : 0

        let sportName: String
        switch workout.workoutActivityType {
        case .running:  sportName = "Running"
        case .hiking:   sportName = "Hiking"
        case .cycling:  sportName = "Cycling"
        default:        sportName = "Workout"
        }

        return WorkoutElevation(
            date: workout.startDate,
            label: fmt.string(from: workout.startDate),
            sport: sportName,
            distanceKm: distanceKm,
            gainMeters: gain,
            lossMeters: loss,
            avgGradePct: avgGrade
        )
    }
}
