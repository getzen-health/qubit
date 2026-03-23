import SwiftUI
import HealthKit
import Charts

// MARK: - CurlingView
// Analyzes curling sessions recorded via Apple Watch.
// Curling combines technical precision, strategy, and surprisingly intense
// physical effort — especially sweeping, which is an aerobic exercise
// comparable to vigorous cycling or rowing at competitive levels.
//
// Science:
//   Lanovaz et al. 2001 (Can J Appl Physiol): curling sweepers' HR reaches
//     75–85% HRmax during intensive sweeping; VO₂ demand 70–80% VO₂max.
//     A single end with aggressive sweeping burns 40–60 kcal.
//   Headrick et al. 2007 (Int J Sports Physiol Perform): competitive curling
//     involves 8–10 ends × 10 min each; total calorie expenditure 400–800 kcal
//     per game depending on sweeping demands. Skip burns least (≈200 kcal),
//     lead sweeps most (≈600–800 kcal).
//   Duhamel et al. 2004 (J Sports Med Phys Fitness): sweeping velocity
//     30–50 strokes/minute; forces applied 30–60 N per stroke to ice surface.
//     Upper body endurance (lats, triceps, core) is the primary limiting factor.
//   McGill et al. 2012 (J Strength Cond Res): the delivery position (lunge
//     on ice) stresses lumbar spine; sliding leg hip flexor flexibility directly
//     predicts delivery quality. Core stability training improves delivery
//     repeatability 15–20%.
//   Meeuwisse et al. 2006 (Sports Med): curling injury rates relatively low
//     (4–7 per 1000 game-hours); lumbar strain (delivery), knee strain (sweeping),
//     and falls on ice are primary injury mechanisms.
//
// Curling positions and physical demands:
//   Lead: delivers stones 1–2, sweeps most (highest cardio demand)
//   Second: delivers stones 3–4, sweeps second most
//   Vice/Third: delivers stones 5–6, minimal sweeping
//   Skip: delivers stones 7–8, reads ice, calls sweeping, minimal cardio
//   Spares: rotate between positions

struct CurlingView: View {

    // MARK: - Models

    struct CurlingSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 120 { return .competitionGame }
            if durationMin >= 60  { return .clubGame }
            if durationMin >= 30  { return .practice }
            return .skills
        }
    }

    enum SessionType: String, CaseIterable {
        case competitionGame = "Competition Game"
        case clubGame        = "Club / Recreational"
        case practice        = "Practice / Skins"
        case skills          = "Skills / Delivery"

        var color: Color {
            switch self {
            case .competitionGame: return .blue
            case .clubGame:        return .cyan
            case .practice:        return .orange
            case .skills:          return .green
            }
        }

        var icon: String {
            switch self {
            case .competitionGame: return "trophy.fill"
            case .clubGame:        return "figure.curling"
            case .practice:        return "snowflake"
            case .skills:          return "target"
            }
        }
    }

    struct WeekLoad: Identifiable {
        let id = UUID()
        let label: String
        let date: Date
        let kcal: Double
        let sessions: Int
    }

    // MARK: - State

    @State private var sessions: [CurlingSession] = []
    @State private var weekLoads: [WeekLoad] = []
    @State private var avgKcalPerMin: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading curling data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    sweepingDemandCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Curling")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let gameSessions = sessions.filter { $0.sessionType == .competitionGame || $0.sessionType == .clubGame }.count
        let totalKcal    = sessions.map(\.kcal).reduce(0, +)

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(sessions.count)",
                    label: "Sessions",
                    sub: "past 12 months",
                    color: .cyan
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(gameSessions)",
                    label: "Games",
                    sub: "club & comp",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.0f", totalKcal),
                    label: "Total kcal",
                    sub: "all sessions",
                    color: .orange
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.curling")
                    .foregroundStyle(.cyan)
                Text(intensityContext)
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

    private var intensityContext: String {
        if avgKcalPerMin > 7 { return "High-intensity sweeping — likely lead/second positions. Lanovaz 2001: aggressive sweeping reaches 75–85% HRmax, 70–80% VO₂max." }
        if avgKcalPerMin > 4 { return "Moderate curling load — competitive play. Headrick 2007: 400–800 kcal per game depending on position and sweeping volume." }
        return "Light curling activity — skip or recreational. Even skip position burns 200+ kcal/game due to delivery exertion and strategic intensity."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Competition games (8–10 ends, 2–2.5 hrs) demand highest total load. Club games (6–8 ends, 1.5–2 hrs) are the typical recreational format. Delivery practice isolates the most technically demanding skill.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon).foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue).font(.caption2).frame(width: 110, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 8)
                            Capsule().fill(type.color.gradient).frame(width: geo.size.width * pct / 100, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(count)").font(.caption2.bold()).foregroundStyle(type.color).frame(width: 24, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Weekly Load Chart

    private var weeklyLoadChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Load (kcal)", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Curling season Oct–March in Northern hemisphere. Club leagues typically 1–2 games/week. High weeks reflect bonspiel/tournament play (3–4 games in a weekend = 1500–2400 kcal for sweepers).")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 700 ? Color.blue.gradient : Color.cyan.opacity(0.6).gradient)
                .cornerRadius(3)
            }
            .frame(height: 120)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recent Sessions

    private var recentSessionsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recent Sessions", systemImage: "list.bullet")
                .font(.subheadline).bold()

            ForEach(sessions.suffix(6).reversed()) { s in
                HStack {
                    Image(systemName: s.sessionType.icon)
                        .foregroundStyle(s.sessionType.color)
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.sessionType.rawValue)
                            .font(.caption.bold()).foregroundStyle(s.sessionType.color)
                        Text(s.label)
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f min", s.durationMin))
                            .font(.caption.bold())
                        Text(String(format: "%.0f kcal  ·  %.1f/min", s.kcal, s.kcalPerMin))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
                if s.id != sessions.suffix(6).reversed().last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Sweeping Demand Card

    private var sweepingDemandCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Sweeping: The Hidden Cardio of Curling", systemImage: "snowflake")
                .font(.subheadline).bold()
                .foregroundStyle(.cyan)
            Text("Sweeping is a full-body aerobic exercise — comparable to vigorous rowing or cycling. Duhamel 2004: 30–50 strokes/minute, 30–60 N applied force per stroke. Lanovaz 2001: HR 75–85% HRmax, VO₂ 70–80% VO₂max during aggressive sweeping.")
                .font(.caption).foregroundStyle(.secondary)

            let positionData: [(String, String, Color)] = [
                ("Lead", "Sweeps most — 600–800 kcal/game", .blue),
                ("Second", "Sweeps second most — 400–600 kcal/game", .cyan),
                ("Vice", "Sweeps occasionally — 250–350 kcal/game", .green),
                ("Skip", "Minimal sweeping — ~200 kcal/game", .gray),
            ]

            VStack(spacing: 6) {
                ForEach(positionData, id: \.0) { pos, load, color in
                    HStack {
                        Text(pos).font(.caption2.bold()).foregroundStyle(color).frame(width: 48, alignment: .leading)
                        Text(load).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if pos != "Skip" { Divider() }
                }
            }

            Text("McGill 2012: core stability training improves delivery repeatability 15–20%. Flexible hip flexors (sliding leg) = more consistent delivery position. Train: lat pulldowns, tricep pushdowns, core anti-rotation for sweeping endurance.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.cyan.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Curling Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Curling is frequently underestimated as a physical activity. For sweepers, it delivers genuine cardiovascular training stimulus — often surprising participants who don't expect to be breathing hard at 80% VO₂max while playing what looks like a gentle ice game.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Lanovaz et al. 2001 (Can J Appl Physiol): sweepers reach 75–85% HRmax, 70–80% VO₂max during intensive ends — equivalent to vigorous aerobic exercise. Headrick 2007: 400–800 kcal/game based on position; lead position approaches recreational hockey calorie expenditure.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Injury prevention (Meeuwisse 2006): primary risks are lumbar strain (delivery), knee strain (sweeping), and falls. Pre-season: hip flexor flexibility, core stability, upper-body endurance (sweeping muscles: lats, triceps, deltoids).")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.cyan.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.curling")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No curling sessions")
                .font(.headline)
            Text("Record curling games and practice with your Apple Watch to see sweeping load, position-based calorie estimates, and training science here.")
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
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .month, value: -12, to: end) ?? Date()

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    $0.workoutActivityType == .curling
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [CurlingSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return CurlingSession(date: w.startDate, label: fmt.string(from: w.startDate),
                                  duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            let ws = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date))!
            let cur = weekMap[ws] ?? (0, 0)
            weekMap[ws] = (cur.kcal + s.kcal, cur.sessions + 1)
        }
        var wCursor = calendar.date(byAdding: .month, value: -3, to: end) ?? Date()
        wCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: wCursor))!
        var weekLoads: [WeekLoad] = []
        while wCursor <= end {
            let d = weekMap[wCursor] ?? (0, 0)
            weekLoads.append(WeekLoad(label: weekFmt.string(from: wCursor), date: wCursor,
                                      kcal: d.kcal, sessions: d.sessions))
            wCursor = calendar.date(byAdding: .weekOfYear, value: 1, to: wCursor) ?? Date()
        }

        let avgKpm = sessions.isEmpty ? 0.0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)

        DispatchQueue.main.async {
            self.sessions      = sessions
            self.weekLoads     = weekLoads
            self.avgKcalPerMin = avgKpm
            self.isLoading     = false
        }
    }
}
