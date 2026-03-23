import SwiftUI
import HealthKit

// MARK: - TriathlonView

/// Multi-sport analytics for triathlon training: swim/bike/run volume splits,
/// brick workout detection, discipline progression and race-type ratio comparison.
struct TriathlonView: View {

    // MARK: - Models

    enum Discipline: String, CaseIterable {
        case swim = "Swim"
        case bike = "Bike"
        case run  = "Run"

        var icon: String {
            switch self {
            case .swim: return "figure.pool.swim"
            case .bike: return "figure.outdoor.cycle"
            case .run:  return "figure.run"
            }
        }
        var color: Color {
            switch self {
            case .swim: return .cyan
            case .bike: return .blue
            case .run:  return .orange
            }
        }

        static func classify(_ type: HKWorkoutActivityType) -> Discipline? {
            switch type {
            case .swimming:     return .swim
            case .cycling:      return .bike
            case .running:      return .run
            case .swimBikeRun:  return nil // composite triathlon event — handled separately
            default:            return nil
            }
        }
    }

    struct DisciplineWorkout: Identifiable {
        let id = UUID()
        let date: Date
        let discipline: Discipline
        let durationMin: Double
        let kcal: Double
        let distanceKm: Double
    }

    struct BrickWorkout: Identifiable {
        let id = UUID()
        let date: Date
        let first: Discipline
        let second: Discipline
        let totalDurationMin: Double
    }

    struct WeekVolume: Identifiable {
        let id = UUID()
        let weekStart: Date
        var swimMin: Double = 0
        var bikeMin: Double = 0
        var runMin: Double = 0
        var totalMin: Double { swimMin + bikeMin + runMin }
    }

    enum RaceType: String, CaseIterable {
        case sprint    = "Sprint"
        case olympic   = "Olympic"
        case halfIron  = "70.3"
        case ironman   = "Ironman"

        // Recommended weekly training distribution (%)
        var swimPct: Double { switch self { case .sprint: 20; case .olympic: 22; case .halfIron: 18; case .ironman: 15 } }
        var bikePct: Double { switch self { case .sprint: 40; case .olympic: 38; case .halfIron: 45; case .ironman: 50 } }
        var runPct:  Double { switch self { case .sprint: 40; case .olympic: 40; case .halfIron: 37; case .ironman: 35 } }

        var description: String {
            switch self {
            case .sprint:   return "750m | 20km | 5km"
            case .olympic:  return "1.5km | 40km | 10km"
            case .halfIron: return "1.9km | 90km | 21km"
            case .ironman:  return "3.8km | 180km | 42km"
            }
        }
    }

    // MARK: - State

    @State private var workouts: [DisciplineWorkout] = []
    @State private var bricks:   [BrickWorkout]      = []
    @State private var weekVols: [WeekVolume]         = []
    @State private var isLoading  = true
    @State private var errorMessage: String?
    @State private var selectedRace: RaceType = .olympic

    private let hkStore = HKHealthStore()

    // MARK: - Computed

    private func totalMin(_ d: Discipline) -> Double {
        workouts.filter { $0.discipline == d }.map(\.durationMin).reduce(0, +)
    }

    private var grandTotal: Double { Discipline.allCases.map { totalMin($0) }.reduce(0, +) }

    private func pct(_ d: Discipline) -> Double {
        grandTotal > 0 ? totalMin(d) / grandTotal * 100 : 0
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Loading triathlon data…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if let err = errorMessage {
                    ContentUnavailableView(err, systemImage: "sportscourt.fill")
                } else if workouts.isEmpty {
                    ContentUnavailableView(
                        "No Multi-Sport Data",
                        systemImage: "sportscourt.fill",
                        description: Text("Record swim, bike, and run workouts in Workout app to enable triathlon analytics.")
                    )
                } else {
                    disciplineSummaryCards
                    distributionChart
                    weeklyVolumeChart
                    raceRatioCard
                    if !bricks.isEmpty { brickWorkoutsCard }
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("Triathlon")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Discipline Summary Cards

    private var disciplineSummaryCards: some View {
        HStack(spacing: 10) {
            ForEach(Discipline.allCases, id: \.rawValue) { d in
                let mins = totalMin(d)
                let hrs  = Int(mins / 60)
                let min  = Int(mins.truncatingRemainder(dividingBy: 60))
                let count = workouts.filter { $0.discipline == d }.count
                VStack(spacing: 6) {
                    Image(systemName: d.icon)
                        .font(.title2)
                        .foregroundStyle(d.color)
                    Text(hrs > 0 ? "\(hrs)h \(min)m" : "\(min)m")
                        .font(.subheadline.bold())
                    Text("\(count) sessions")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(d.rawValue)
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(.secondary)
                    Text(String(format: "%.0f%%", pct(d)))
                        .font(.caption2.bold())
                        .foregroundStyle(d.color)
                }
                .frame(maxWidth: .infinity)
                .padding(12)
                .background(d.color.opacity(0.1))
                .cornerRadius(14)
            }
        }
    }

    // MARK: - Distribution Chart (horizontal stacked bar)

    private var distributionChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Training Distribution (12 weeks)")
                .font(.headline)

            GeometryReader { geo in
                HStack(spacing: 0) {
                    ForEach(Discipline.allCases, id: \.rawValue) { d in
                        let fraction = grandTotal > 0 ? CGFloat(totalMin(d) / grandTotal) : 0
                        Rectangle()
                            .fill(d.color)
                            .frame(width: geo.size.width * fraction)
                    }
                }
                .cornerRadius(8)
            }
            .frame(height: 28)

            HStack {
                ForEach(Discipline.allCases, id: \.rawValue) { d in
                    HStack(spacing: 4) {
                        Circle().fill(d.color).frame(width: 8, height: 8)
                        Text("\(d.rawValue) \(String(format: "%.0f%%", pct(d)))")
                            .font(.caption2)
                    }
                }
            }
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Weekly Volume Chart

    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Weekly Volume (hours)")
                .font(.headline)

            let displayed = weekVols.suffix(12)
            let maxTotal = displayed.map(\.totalMin).max() ?? 120

            GeometryReader { geo in
                HStack(alignment: .bottom, spacing: 2) {
                    ForEach(Array(displayed.enumerated()), id: \.1.id) { _, wk in
                        VStack(spacing: 1) {
                            Spacer()
                            let swimH  = CGFloat(wk.swimMin / maxTotal) * geo.size.height
                            let bikeH  = CGFloat(wk.bikeMin / maxTotal) * geo.size.height
                            let runH   = CGFloat(wk.runMin  / maxTotal) * geo.size.height

                            Rectangle().fill(Discipline.run.color).frame(height: runH)
                            Rectangle().fill(Discipline.bike.color).frame(height: bikeH)
                            Rectangle().fill(Discipline.swim.color).frame(height: swimH)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .cornerRadius(4)
            }
            .frame(height: 120)

            HStack {
                Text("12 weeks ago")
                Spacer()
                Text("This week")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Race Ratio Card

    private var raceRatioCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Race Type Distribution Target")
                .font(.headline)

            // Race picker
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(RaceType.allCases, id: \.rawValue) { rt in
                        Button {
                            selectedRace = rt
                        } label: {
                            VStack(spacing: 2) {
                                Text(rt.rawValue).font(.subheadline.weight(.semibold))
                                Text(rt.description).font(.caption2).foregroundStyle(.secondary)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(selectedRace == rt ? Color.blue : Color(.tertiarySystemBackground))
                            .foregroundStyle(selectedRace == rt ? .white : .primary)
                            .cornerRadius(10)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            ForEach(Discipline.allCases, id: \.rawValue) { d in
                let target: Double = {
                    switch d {
                    case .swim: return selectedRace.swimPct
                    case .bike: return selectedRace.bikePct
                    case .run:  return selectedRace.runPct
                    }
                }()
                let actual = pct(d)
                let delta  = actual - target

                HStack(spacing: 10) {
                    Image(systemName: d.icon).foregroundStyle(d.color).font(.title3)
                        .frame(width: 28)

                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(d.rawValue).font(.subheadline.weight(.medium))
                            Spacer()
                            Text(String(format: "%.0f%%", actual)).font(.subheadline.bold())
                                .foregroundStyle(d.color)
                            Text("vs \(Int(target))% target").font(.caption2).foregroundStyle(.secondary)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3).fill(d.color.opacity(0.2))
                                    .frame(width: geo.size.width * CGFloat(target / 100), height: 6)
                                RoundedRectangle(cornerRadius: 3).fill(d.color)
                                    .frame(width: geo.size.width * CGFloat(min(actual / 100, 1.0)), height: 6)
                            }
                        }
                        .frame(height: 6)
                    }

                    let sign = delta >= 0 ? "+" : ""
                    Text("\(sign)\(Int(delta))%")
                        .font(.caption2.bold())
                        .foregroundStyle(abs(delta) < 5 ? .green : .orange)
                        .frame(width: 36, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Brick Workouts Card

    private var brickWorkoutsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Brick Workouts (\(bricks.count) detected)")
                .font(.headline)

            Text("Consecutive disciplines within 60 minutes — the hallmark of triathlon training.")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(bricks.prefix(8)) { brick in
                HStack {
                    Image(systemName: brick.first.icon).foregroundStyle(brick.first.color)
                    Image(systemName: "arrow.right").font(.caption2).foregroundStyle(.secondary)
                    Image(systemName: brick.second.icon).foregroundStyle(brick.second.color)
                    Text("\(brick.first.rawValue)→\(brick.second.rawValue)")
                        .font(.caption.weight(.medium))
                    Spacer()
                    Text("\(Int(brick.totalDurationMin))min total")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(brick.date, format: .dateTime.month().day())
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
                Divider()
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("About Triathlon Training", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.blue)

            Text("Triathlon training requires balancing three aerobically demanding disciplines. Research (Millet & Vleck 2000) shows brick workouts (back-to-back disciplines) are essential for developing the specific neuromuscular adaptation needed for the run-off-the-bike.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("For most age-groupers, ~50–60% of training time should come from running (highest injury risk), ~30–35% from cycling, and ~15–20% from swimming — though swim efficiency gains can justify more swim time in novices.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Apple Watch tracks swim (pool + open water), cycling, and running workouts separately. It also supports HKWorkoutActivityType.swimBikeRun for triathlon-specific tracking.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .cornerRadius(14)
    }

    // MARK: - Data Loading

    @MainActor
    private func load() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit not available"
            isLoading = false
            return
        }

        let workoutType = HKObjectType.workoutType()
        do {
            try await hkStore.requestAuthorization(toShare: [], read: [workoutType])
        } catch {
            errorMessage = "Authorization failed"
            isLoading = false
            return
        }

        let end   = Date()
        let start = Calendar.current.date(byAdding: .day, value: -84, to: end)! // 12 weeks
        let pred  = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort  = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                let workouts = (samples as? [HKWorkout]) ?? []

                var disciplineWorkouts: [DisciplineWorkout] = []
                for w in workouts {
                    guard let d = Discipline.classify(w.workoutActivityType) else { continue }
                    let durMin = w.duration / 60.0
                    let kcal   = w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
                    let distM  = w.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: .meter()) ?? 0
                    disciplineWorkouts.append(DisciplineWorkout(
                        date: w.startDate,
                        discipline: d,
                        durationMin: durMin,
                        kcal: kcal,
                        distanceKm: distM / 1000
                    ))
                }

                // Detect bricks: two different disciplines within 60 min
                var brickWorkouts: [BrickWorkout] = []
                for (i, w1) in disciplineWorkouts.enumerated().dropLast() {
                    let w2 = disciplineWorkouts[i + 1]
                    guard w2.discipline != w1.discipline else { continue }
                    let gap = w2.date.timeIntervalSince(w1.date) / 60.0
                    guard gap < 60 else { continue }
                    brickWorkouts.append(BrickWorkout(
                        date: w1.date,
                        first: w1.discipline,
                        second: w2.discipline,
                        totalDurationMin: w1.durationMin + gap + w2.durationMin
                    ))
                }

                // Weekly volumes
                let cal = Calendar.current
                var weekDict: [Date: WeekVolume] = [:]
                for w in disciplineWorkouts {
                    let weekStart = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.date)
                    guard let ws = cal.date(from: weekStart) else { continue }
                    if weekDict[ws] == nil { weekDict[ws] = WeekVolume(weekStart: ws) }
                    switch w.discipline {
                    case .swim: weekDict[ws]!.swimMin += w.durationMin
                    case .bike: weekDict[ws]!.bikeMin += w.durationMin
                    case .run:  weekDict[ws]!.runMin  += w.durationMin
                    }
                }
                let sortedWeeks = weekDict.values.sorted { $0.weekStart < $1.weekStart }

                Task { @MainActor in
                    self.workouts = disciplineWorkouts
                    self.bricks   = brickWorkouts.reversed() // most recent first
                    self.weekVols = sortedWeeks
                    self.isLoading = false
                }
                cont.resume()
            }
            hkStore.execute(q)
        }
    }
}

#Preview {
    NavigationStack { TriathlonView() }
}
