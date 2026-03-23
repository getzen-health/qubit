import SwiftUI
import HealthKit
import Charts

// MARK: - CricketView
// Analyzes cricket sessions: matches (Test, ODI, T20), net practice, batting/bowling drills.
// Cricket is a unique intermittent sport — batting requires explosive power and decision-making
// over hours, fast bowling is one of sport's highest-intensity repeated actions, and fielding
// combines sustained alertness with explosive sprints.
//
// Science:
//   Petersen et al. 2010 (Int J Sports Physiol Perf): elite fast bowlers produce peak ground
//     reaction forces of 6–9× BW during delivery stride; lower back stress fractures occur
//     in 15–20% of fast bowlers due to accumulative loading.
//   Duffield & Draper 2008 (J Sci Med Sport): T20 cricket demands — HR averages 80–85% HRmax
//     during fielding; batting requires explosive outputs every 3–5 minutes interspersed with
//     recovery between deliveries.
//   Bartlett et al. 1996 (J Sports Sci): fast bowling action is a hyperextension mechanism;
//     mixed action bowlers (trunk counter-rotation >40°) have significantly higher injury risk.
//   Noakes & Durandt 2000 (J Sports Sci): batting decision-making window 0.15–0.20 s — batters
//     must initiate swing before ball releases from bowler's hand using predictive cues.
//   Stretch et al. 1999 (J Sports Sci): elite fielders cover 11–15 km per day's play in
//     Test matches; outfielders perform 50–80 sprints per session averaging 10–15 m each.
//   Petersen et al. 2011 (IJSPP): bowling workload >14 overs/day associated with 3.4× increased
//     injury risk; fast bowling demands 4–6 MET base with peaks to 10–12 MET at delivery.
//
// Cricket formats:
//   Test: 5 days × 6 hours; longest form, maximum physical endurance.
//   ODI: 50 overs/side ≈ 7–8 hours total.
//   T20: 20 overs/side ≈ 3 hours; highest intensity batting/fielding.
//   Club/casual: varied formats, typical 2–4 hour sessions.

struct CricketView: View {

    // MARK: - Models

    struct CricketSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 240 { return .match }       // 4+ hours = match day
            if durationMin >= 90  { return .longSession } // 1.5–4 hrs = training / short match
            if durationMin >= 40  { return .nets }        // 40–90 min = net practice
            return .drills                                // <40 min = batting/bowling drills
        }
    }

    enum SessionType: String, CaseIterable {
        case match       = "Match Play"
        case longSession = "Training Match"
        case nets        = "Net Practice"
        case drills      = "Skills Drills"

        var color: Color {
            switch self {
            case .match:       return .blue
            case .longSession: return .green
            case .nets:        return .orange
            case .drills:      return .purple
            }
        }

        var icon: String {
            switch self {
            case .match:       return "trophy.fill"
            case .longSession: return "figure.cricket"
            case .nets:        return "net"
            case .drills:      return "target"
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

    @State private var sessions: [CricketSession] = []
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
                    ProgressView("Loading cricket data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    bowlingLoadCard
                    battingCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Cricket")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let matchSessions = sessions.filter { $0.sessionType == .match }.count

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .blue)
                Divider().frame(height: 44)
                statBox(value: "\(matchSessions)", label: "Matches",
                        sub: "match days", color: .green)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 5 ? .blue : .green
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.cricket")
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
        if avgKcalPerMin > 7  { return "High fielding/bowling" }
        if avgKcalPerMin > 4  { return "Match load" }
        if avgKcalPerMin > 2  { return "Net practice" }
        return "Skills focus"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 5 {
            return "Fielding/bowling-heavy sessions. Duffield 2008: T20 fielding averages 80–85% HRmax; fast bowling peaks at 10–12 METs per delivery."
        }
        if avgKcalPerMin > 3 {
            return "Match-level intensity. Stretch 1999: elite fielders cover 11–15 km per day's play in Test matches; 50–80 sprints of 10–15 m."
        }
        return "Practice and skills focus. Petersen 2011: bowling workload >14 overs/day = 3.4× injury risk — structured load management is essential."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Cricket's intermittent structure makes load monitoring critical. Full match days have highest cumulative load; net practice targets technical development; drilling isolates batting or bowling mechanics with controlled repetition.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct   = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue)
                        .font(.caption2).frame(width: 110, alignment: .leading)
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
            Text("Cricket season: April–September (UK/Aus), Oct–March (subcontinent). In-season: 1–2 match days + 2–3 practice sessions/week. Match weeks show highest load — especially for bowlers.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 800 ? Color.blue.gradient : Color.green.opacity(0.6).gradient)
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

    // MARK: - Bowling Load Card

    private var bowlingLoadCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Fast Bowling: A High-Risk, High-Reward Action", systemImage: "figure.cricket")
                .font(.subheadline).bold()
                .foregroundStyle(.red)
            Text("Petersen et al. 2010 (IJSPP): fast bowlers produce 6–9× BW peak ground reaction force during the delivery stride — comparable to elite weightlifting. Lumbar stress fractures occur in 15–20% of fast bowlers.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("GRF at delivery", "6–9× body weight — comparable to elite Olympic lifting", .red),
                ("Overload limit", ">14 overs/day → 3.4× injury risk (Petersen 2011)", .orange),
                ("Mixed action", "Counter-rotation >40° → highest lumbar injury risk (Bartlett 1996)", .red),
                ("Intensity", "10–12 MET peak at delivery; 4–6 MET base during fielding", .blue),
                ("Recovery", "24–48h recommended between heavy bowling sessions", .green),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 100, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Recovery" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.red.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Batting Card

    private var battingCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Batting: Decision-Making Under Extreme Time Pressure", systemImage: "eye.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.green)
            Text("Noakes & Durandt 2000 (J Sports Sci): elite batters have a 0.15–0.20 s decision window — they must initiate their swing before the ball is released using predictive cues from the bowler's run-up, grip, and release point.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Decision window",  "0.15–0.20 s — batters predict from pre-release cues", .green),
                ("Ball velocity",    "Fast bowling: 130–160 km/h; seam movement adds deception", .blue),
                ("Physiological",   "Batting: intermittent; elevated HR between deliveries via anticipatory arousal", .orange),
                ("Cognitive load",  "Shot selection, field placement reading, pitch assessment — continuous processing", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 100, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Cognitive load" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.green.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Cricket Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Cricket is unique in occupying all energy systems simultaneously: fast bowling is highly anaerobic (10–12 MET), sustained fielding is aerobic (4–5 MET), and batting demands prolonged cognitive alertness across hours.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Duffield & Draper 2008: T20 fielding HR averages 80–85% HRmax — T20 has made cricket far more physically demanding than traditional perceptions. Stretch 1999: Test fielders cover 11–15 km/day; outfielders perform 50–80 explosive short sprints.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training recommendation: fast bowlers require periodized workload management (no-ball counting, over limits); all-rounders benefit from aerobic base for fielding endurance; batters — perceptual-cognitive training improves pickup of bowler release cues.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.cricket")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No cricket sessions")
                .font(.headline)
            Text("Record cricket workouts with your Apple Watch to see match load, bowling workload, and fielding intensity here.")
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
                    $0.workoutActivityType == .cricket
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [CricketSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return CricketSession(date: w.startDate, label: fmt.string(from: w.startDate),
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
