import SwiftUI
import HealthKit
import Charts

// MARK: - WaterPoloView
// Analyzes water polo sessions: matches, pool training, sprint sets, and shooting drills.
// Water polo is uniquely demanding — players must simultaneously maintain position via
// eggbeater kick (no touching the pool floor) while executing explosive jumps, powerful
// throws, and full-contact defensive play.
//
// Science:
//   Smith 1998 (Sports Med): water polo players cover 1.5–3 km per game; 48% of total
//     match time is spent at >80% HRmax; VO₂max requirements 55–65 ml/kg/min at elite level.
//   Platanou & Geladas 2006 (J Sports Sci): average match HR 155–165 bpm; field players
//     perform 267 explosive actions per game including jumps from water, power shots, sprints.
//   Smith 1998 (Sports Med): eggbeater kick (vertical sculling to maintain position) accounts
//     for 35–50% of total match energy expenditure — the biomechanical foundation of the sport.
//   Lupo et al. 2010 (J Strength Cond Res): elite water polo players jump 40–80 cm from
//     the water using only eggbeater propulsion — equivalent to a standing jump with 30–40%
//     of body submerged; requires exceptional hip abductor and hip external rotator strength.
//   Pinnington et al. 1988 (Aust J Sci Med Sport): shot velocity 50–90 km/h at elite level;
//     overhand throw from water requires core stability, trunk rotation, and shoulder power
//     all while maintaining vertical body position without ground support.
//   Ravasi et al. 2013 (Int J Aquatic Res Educ): water polo matches show blood lactate
//     5–8 mmol/L — indicating significant glycolytic contribution alongside high aerobic demand.
//
// Water polo match structure:
//   4 × 8-minute periods (stoppage time extends actual duration to 24–32 min total play);
//   Shot clock: 30 seconds; maximum 6 field players + goalkeeper per team.
//   Goal dimensions: 3 m × 0.9 m, set 0.9 m above waterline.

struct WaterPoloView: View {

    // MARK: - Models

    struct WaterPoloSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 60  { return .match }
            if durationMin >= 35  { return .scrimmage }
            if durationMin >= 20  { return .swimming }
            return .drills
        }
    }

    enum SessionType: String, CaseIterable {
        case match     = "Match / Game"
        case scrimmage = "Scrimmage / Training"
        case swimming  = "Pool Conditioning"
        case drills    = "Shooting & Skills"

        var color: Color {
            switch self {
            case .match:     return .blue
            case .scrimmage: return .cyan
            case .swimming:  return .green
            case .drills:    return .orange
            }
        }

        var icon: String {
            switch self {
            case .match:     return "trophy.fill"
            case .scrimmage: return "figure.water.fitness"
            case .swimming:  return "waveform"
            case .drills:    return "target"
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

    @State private var sessions: [WaterPoloSession] = []
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
                    ProgressView("Loading water polo data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    eggbeaterCard
                    positionCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Water Polo")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let matchCount = sessions.filter { $0.sessionType == .match }.count

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .blue)
                Divider().frame(height: 44)
                statBox(value: "\(matchCount)", label: "Matches",
                        sub: "game sessions", color: .cyan)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 9 ? .blue : .cyan
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.water.fitness")
                    .foregroundStyle(.blue)
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

    private var intensityLabel: String {
        if avgKcalPerMin > 11 { return "Elite match load" }
        if avgKcalPerMin > 8  { return "Competitive play" }
        if avgKcalPerMin > 5  { return "Training load" }
        return "Skills / drills"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 9 {
            return "Elite match intensity. Smith 1998: 48% of match time at >80% HRmax; average HR 155–165 bpm. Lactate 5–8 mmol/L (Ravasi 2013)."
        }
        if avgKcalPerMin > 6 {
            return "Strong competitive load. Water polo combines aerobic swimming endurance with explosive jumps and power shots — VO₂max demands 55–65 ml/kg/min at elite level."
        }
        return "Training and skills focus. Eggbeater kick conditioning is the foundation — it accounts for 35–50% of match energy expenditure (Smith 1998)."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Match play provides the full cardio + skill demand. Scrimmages build tactical and explosive conditioning. Pool conditioning (sprint sets, endurance laps) builds the aerobic base; shooting drills develop throwing power from water.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct   = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue)
                        .font(.caption2).frame(width: 130, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 8)
                            Capsule().fill(type.color.gradient)
                                .frame(width: geo.size.width * pct / 100, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(count)").font(.caption2.bold())
                        .foregroundStyle(type.color).frame(width: 24, alignment: .trailing)
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
            Text("Water polo season: Oct–Mar (northern hemisphere). Match weeks: typically 2 pool sessions + 1 match. Pre-season: higher swimming volume. Competition peaks show highest kcal weeks due to extended match duration.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 900 ? Color.blue.gradient : Color.cyan.opacity(0.7).gradient)
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
                        .foregroundStyle(s.sessionType.color).frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.sessionType.rawValue)
                            .font(.caption.bold()).foregroundStyle(s.sessionType.color)
                        Text(s.label).font(.caption2).foregroundStyle(.secondary)
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
                if s.id != sessions.suffix(6).reversed().last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Eggbeater Card

    private var eggbeaterCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("The Eggbeater Kick: Water Polo's Engine", systemImage: "arrow.2.circlepath")
                .font(.subheadline).bold()
                .foregroundStyle(.blue)
            Text("Smith 1998 (Sports Med): the eggbeater kick — alternating circular leg movements that generate vertical thrust — accounts for 35–50% of total match energy expenditure. Mastery determines vertical jump height out of water and sustained positioning ability.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Energy cost",    "35–50% of match kcal just for vertical positioning (Smith 1998)", .blue),
                ("Jump height",    "40–80 cm from water using only eggbeater propulsion (Lupo 2010)", .cyan),
                ("Hip strength",   "Hip abductors + external rotators are the primary eggbeater muscles", .purple),
                ("Shot platform",  "Overhand throw from water: core + trunk rotation without ground contact", .orange),
                ("Shot velocity",  "50–90 km/h at elite level (Pinnington 1988)", .red),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 90, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Shot velocity" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Position Card

    private var positionCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Position-Based Demands", systemImage: "person.3.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.cyan)
            Text("Platanou 2006 (J Sports Sci): field players perform 267 explosive actions per game. Each position has distinct physical demands based on court zone and tactical role.")
                .font(.caption).foregroundStyle(.secondary)

            let positions: [(String, String, Color)] = [
                ("Goalkeeper", "Highest eggbeater demand; explosive lateral jumps; minimal distance swum", .yellow),
                ("Center Back", "Primary defender; physical contact; highest defensive work rate", .red),
                ("Wings (2–4)", "Fastest swimmers; most distance covered; sprint-dominant", .green),
                ("Center Fwd",  "Physical positioning vs defender; highest shot volume; close-range power", .blue),
                ("Drivers",     "Perimeter players; balanced swim/shot/defensive demands", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(positions, id: \.0) { pos, desc, color in
                    HStack(alignment: .top) {
                        Text(pos).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 90, alignment: .leading)
                        Text(desc).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if pos != "Drivers" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.cyan.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Water Polo Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Water polo may be the world's most physiologically complex team sport — players must maintain vertical position via eggbeater kick while simultaneously reading the field, executing tactical movements, defending, and throwing at goal with 90 km/h precision.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Smith 1998: 48% of match time >80% HRmax; 1.5–3 km swum per game; blood lactate 5–8 mmol/L. Platanou 2006: HR averages 155–165 bpm. Lupo 2010: 267 explosive actions/game including water jumps equivalent to standing jumps with partial submersion.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training recommendation: eggbeater-specific hip strengthening (abduction, external rotation) + explosive pulling/pushing intervals for jump height. Shot power requires dry-land shoulder/rotator cuff work — water support is absent during throwing.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.water.fitness")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No water polo sessions")
                .font(.headline)
            Text("Record water polo workouts with your Apple Watch to see match load, weekly volume, and eggbeater science here.")
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
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    $0.workoutActivityType == .waterPolo
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [WaterPoloSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return WaterPoloSession(date: w.startDate, label: fmt.string(from: w.startDate),
                                    duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            let ws  = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date))!
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
