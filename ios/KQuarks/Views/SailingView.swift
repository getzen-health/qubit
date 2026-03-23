import SwiftUI
import HealthKit
import Charts

// MARK: - SailingView
// Analyzes sailing sessions: dinghy racing, keelboat, offshore, and recreational sailing.
// Sailing spans a vast physiological spectrum — from the extreme quadriceps isometric
// demands of dinghy hiking to the sleep deprivation physiology of offshore ocean racing.
//
// Science:
//   Blackburn 1994 (J Sports Sci): dinghy hiking requires sustained isometric quadriceps
//     contraction at 60–80% MVC for up to 20 consecutive minutes while maintaining
//     dynamic body position — one of the most extreme sustained isometric demands in sport.
//   Vogiatzis et al. 2002 (Int J Sports Med): competitive dinghy racing averages 110–140
//     bpm HR; hiking increases metabolic rate 4–5× compared to seated sailing;
//     VO₂ during hiking comparable to moderate-intensity running.
//   Callewaert et al. 2012 (Eur J Appl Physiol): hiking induces severe quadriceps
//     fatigue — quad endurance, not cardiovascular capacity, is the primary performance
//     limiter in dinghy and single-handed sailing classes.
//   Legg et al. 2003 (J Sports Sci): offshore sailing physiological demands — sailors
//     accumulate progressive sleep deprivation (3–4 h/day for weeks), cold stress, and
//     cardiovascular demand during heavy weather that can exceed 80% HRmax.
//   Tan et al. 2006 (J Sports Sci): elite sailors demonstrate 30% greater quadriceps
//     endurance and significantly better trunk stability vs recreational sailors; hiking
//     simulation training produces 8–12% improvement in sustained quad output.
//   Aagaard et al. 2007 (Scand J Med Sci Sports): sailing's asymmetric upper body demands
//     (constant tiller/wheel operation on the favored side) create significant left-right
//     muscular imbalances in professional sailors over multi-year careers.
//
// Sailing activity spectrum:
//   Dinghy (Laser, Finn, 470, 49er): extreme hiking demand; highest cardiovascular load.
//   Keelboat (Melges, IRC, ORC): crew hiking; divided physical roles; moderate intensity.
//   Offshore (RORC, Vendée Globe): sleep deprivation physiology dominates.
//   Recreational / cruising: low intensity; navigation cognitive load.

struct SailingView: View {

    // MARK: - Models

    struct SailingSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 240 { return .offshore }
            if durationMin >= 90  { return .inshoreRace }
            if durationMin >= 40  { return .training }
            return .recreational }
    }

    enum SessionType: String, CaseIterable {
        case offshore     = "Offshore / Ocean Racing"
        case inshoreRace  = "Inshore Race / Regatta"
        case training     = "Training Sail"
        case recreational = "Recreational / Cruising"

        var color: Color {
            switch self {
            case .offshore:     return .blue
            case .inshoreRace:  return .cyan
            case .training:     return .green
            case .recreational: return .teal
            }
        }

        var icon: String {
            switch self {
            case .offshore:     return "wind"
            case .inshoreRace:  return "trophy.fill"
            case .training:     return "sailboat"
            case .recreational: return "sailboat.fill"
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

    @State private var sessions: [SailingSession] = []
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
                    ProgressView("Loading sailing data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    hikingCard
                    offshoreCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Sailing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let raceSessions = sessions.filter {
            $0.sessionType == .inshoreRace || $0.sessionType == .offshore
        }.count

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .blue)
                Divider().frame(height: 44)
                statBox(value: "\(raceSessions)", label: "Races",
                        sub: "inshore + offshore", color: .cyan)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 5 ? .blue : .teal
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "sailboat")
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
        if avgKcalPerMin > 8  { return "Dinghy / heavy hiking" }
        if avgKcalPerMin > 5  { return "Inshore racing" }
        if avgKcalPerMin > 2  { return "Keelboat / training" }
        return "Recreational cruise"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 6 {
            return "High hiking intensity. Blackburn 1994: dinghy hiking requires 60–80% MVC sustained quad contraction for 20+ min — one of sport's most extreme isometric demands. Vogiatzis 2002: HR averages 110–140 bpm during racing."
        }
        if avgKcalPerMin > 3 {
            return "Racing/training load. Callewaert 2012: quad endurance is the primary performance limiter in dinghy sailing — not cardiovascular capacity. Tan 2006: elite sailors show 30% greater quad endurance."
        }
        return "Recreational sailing intensity. Even recreational sailing improves spatial reasoning, wind reading, and situational awareness. Upper body isometric demands accumulate during longer sessions."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Dinghy inshore racing produces the highest physical demand through hiking. Offshore racing trades acute intensity for cumulative sleep deprivation and sustained cardiovascular load in heavy weather. Training builds boat-handling skills and race-specific fitness.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct   = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue)
                        .font(.caption2).frame(width: 145, alignment: .leading)
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
            Text("Sailing season: April–October (northern hemisphere). Regatta weeks show highest load. Off-season: dry-land hiking simulation and leg strength work maintains quad endurance capacity for spring.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 500 ? Color.blue.gradient : Color.cyan.opacity(0.6).gradient)
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

    // MARK: - Hiking Card

    private var hikingCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Dinghy Hiking: Sport's Most Extreme Isometric Demand", systemImage: "figure.strengthtraining.traditional")
                .font(.subheadline).bold()
                .foregroundStyle(.blue)
            Text("Blackburn 1994 (J Sports Sci): hiking out of a dinghy requires sustained isometric quadriceps contraction at 60–80% MVC for up to 20 consecutive minutes. For context: a maximal leg press can only be maintained for seconds — hiking is one of the most extreme sustained muscle demands in all of sport.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Quad demand",    "60–80% MVC sustained for 20+ min — extreme isometric endurance (Blackburn 1994)", .blue),
                ("HR during race", "110–140 bpm average; hiking increases metabolic rate 4–5× (Vogiatzis 2002)", .red),
                ("Performance limiter", "Quad endurance, NOT cardio, limits dinghy performance (Callewaert 2012)", .orange),
                ("Training gap",   "Elite sailors: 30% greater quad endurance vs recreational (Tan 2006)", .green),
                ("Dry-land work",  "Hiking bench, wall sits, Spanish squats: +8–12% sustained quad output", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 110, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Dry-land work" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Offshore Card

    private var offshoreCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Offshore Sailing: Sleep Deprivation Physiology", systemImage: "moon.stars")
                .font(.subheadline).bold()
                .foregroundStyle(.indigo)
            Text("Legg et al. 2003 (J Sports Sci): offshore sailors accumulate progressive sleep deprivation (3–4 h/day) over weeks; cognitive function declines significantly after 2–3 days — particularly navigation accuracy and risk assessment. Physical demands spike to >80% HRmax during heavy weather sail changes.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Sleep deprivation", "3–4 h/day sleep across multi-day races; cognitive decline after 48–72 h", .indigo),
                ("Heavy weather",     "Sail changes + emergency maneuvers: brief spikes to >80% HRmax", .red),
                ("Thermal stress",    "Cold water spray, night temperatures: thermoregulation cost adds metabolic load", .blue),
                ("Muscular fatigue",  "Asymmetric upper body loading accumulates over days — wrist + shoulder imbalances", .orange),
                ("Recovery",         "Meal timing, watch systems (3-on/3-off), and caffeine management are performance-critical", .green),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 110, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Recovery" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.indigo.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Sailing Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Sailing occupies a unique athletic space — dinghy sailors must combine extreme lower-body isometric endurance with dynamic balance, tactical intelligence, and wind reading skills. The sport's performance limiter (quad endurance) is counterintuitive given its low-impact aquatic setting.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Aagaard 2007: professional sailors develop significant left-right muscular imbalances from asymmetric tiller and sheet handling over careers. Corrective unilateral training and rotational strengthening should be built into annual training plans.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training recommendation: hiking bench simulation 4×/week (wall sits, Spanish squats, terminal knee extensions) for dinghy sailors. Upper body pulling and anti-rotation work for all classes. Cardio base through cycling maintains aerobic capacity without quad fatigue.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.cyan.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "sailboat")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No sailing sessions")
                .font(.headline)
            Text("Record sailing workouts with your Apple Watch to see session history, race load, and hiking science here.")
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
        let start = calendar.date(byAdding: .month, value: -12, to: end)!

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    $0.workoutActivityType == .sailing
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [SailingSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return SailingSession(date: w.startDate, label: fmt.string(from: w.startDate),
                                  duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            let ws  = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date))!
            let cur = weekMap[ws] ?? (0, 0)
            weekMap[ws] = (cur.kcal + s.kcal, cur.sessions + 1)
        }
        var wCursor = calendar.date(byAdding: .month, value: -3, to: end)!
        wCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: wCursor))!
        var weekLoads: [WeekLoad] = []
        while wCursor <= end {
            let d = weekMap[wCursor] ?? (0, 0)
            weekLoads.append(WeekLoad(label: weekFmt.string(from: wCursor), date: wCursor,
                                      kcal: d.kcal, sessions: d.sessions))
            wCursor = calendar.date(byAdding: .weekOfYear, value: 1, to: wCursor)!
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
