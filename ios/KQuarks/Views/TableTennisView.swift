import SwiftUI
import HealthKit
import Charts

// MARK: - TableTennisView
// Analyzes table tennis sessions: competitive matches, practice rallying, drills, and serving.
// Table tennis combines explosive short-burst aerobic demands with elite reaction time and spin
// physics — a sport that rewards both physical conditioning and neurocognitive precision.
//
// Science:
//   Zagatto et al. 2010 (J Strength Cond Res): match average VO₂ demand 45–65% VO₂max with
//     explosive rally bursts reaching 85%+; intermittent demand profile similar to tennis.
//   Muller et al. 2015 (IJSM): match HR averages 70–80% HRmax; aerobic recovery between
//     points critically important — resting HR recovery in <5 s between points.
//   Yuza et al. 1992 (J Physiol Anthropol): elite table tennis players demonstrate choice
//     reaction times 250–300 ms vs 350–400 ms in untrained controls — 25% faster neural processing.
//   Faber et al. 2015 (IJSM): elite players cover 5–8 km per match hour; 80–90% of movement
//     is lateral (<2 m per burst); movement pattern is multi-directional and asymmetric.
//   Drianovski & Otcheva 2002 (Int J TT Sci): serve is the single most tactically decisive
//     stroke — >60% of points involve serve/receive interaction; spin variation is the
//     primary differentiator at elite level.
//   Phomsoupha & Laffaye 2015 (Sports Med): ball velocity 60–110 km/h; topspin loop
//     generates 100–150 rev/s — ball deforms 2–3 mm on contact with paddle.
//
// Match structure:
//   Best-of-7 games (first to 11 pts, 2 ahead); service alternates every 2 points.
//   Average rally duration: 3–4 s; work:rest ≈ 1:3–1:5 with between-point recovery.

struct TableTennisView: View {

    // MARK: - Models

    struct TableTennisSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 50 { return .match }
            if durationMin >= 30 { return .rallying }
            if durationMin >= 15 { return .drills }
            return .serving
        }
    }

    enum SessionType: String, CaseIterable {
        case match    = "Competitive Match"
        case rallying = "Rallying Practice"
        case drills   = "Technical Drills"
        case serving  = "Serve Practice"

        var color: Color {
            switch self {
            case .match:    return .blue
            case .rallying: return .green
            case .drills:   return .orange
            case .serving:  return .purple
            }
        }

        var icon: String {
            switch self {
            case .match:    return "trophy.fill"
            case .rallying: return "figure.table.tennis"
            case .drills:   return "target"
            case .serving:  return "arrow.up.right.circle.fill"
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

    @State private var sessions: [TableTennisSession] = []
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
                    ProgressView("Loading table tennis data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    strokeScienceCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Table Tennis")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let matchCount = sessions.filter { $0.sessionType == .match }.count
        _ = sessions.map(\.kcal).reduce(0, +)

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .blue)
                Divider().frame(height: 44)
                statBox(value: "\(matchCount)", label: "Matches",
                        sub: "competitive", color: .green)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 6 ? .blue : .green
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.table.tennis")
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
        if avgKcalPerMin > 8  { return "Elite match intensity" }
        if avgKcalPerMin > 5  { return "Competitive load" }
        if avgKcalPerMin > 3  { return "Practice load" }
        return "Light drilling"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 6 {
            return "Match-intensity play. Zagatto 2010: match VO₂ demand 45–65% VO₂max with rally bursts to 85%+; HR averages 70–80% HRmax (Muller 2015)."
        }
        if avgKcalPerMin > 3 {
            return "Practice-level intensity. Consistent rally practice builds aerobic base and motor pattern automation — key for point-ending shot reliability."
        }
        return "Technical drilling focus. Drianovski 2002: serve is the most decisive stroke — spin variation and placement determine outcome at elite level."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Competitive matches are the primary performance context. Practice rallying builds aerobic base and consistency. Technical drills isolate stroke mechanics. Serving practice refines the most tactically decisive stroke.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct   = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue)
                        .font(.caption2).frame(width: 120, alignment: .leading)
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
            Text("Optimal training: 3–5 sessions/week with variation across match play, multi-ball drilling, and footwork training. Match weeks typically show highest load due to extended rally duration.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 600 ? Color.blue.gradient : Color.green.opacity(0.6).gradient)
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

    // MARK: - Stroke Science Card

    private var strokeScienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("The Physics of Table Tennis", systemImage: "waveform.path.ecg")
                .font(.subheadline).bold()
                .foregroundStyle(.blue)
            Text("Phomsoupha & Laffaye 2015 (Sports Med): ball velocity 60–110 km/h; topspin loop generates 100–150 rev/s — the ball deforms 2–3 mm on paddle contact and rebounds with a curved trajectory.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Reaction time", "Elite: 250–300 ms vs 350–400 ms untrained (Yuza 1992) — 25% faster neural processing", .blue),
                ("Ball speed",    "60–110 km/h; topspin loop is the primary offensive weapon at all levels", .orange),
                ("Spin rate",     "100–150 rev/s generates curved trajectory; rubber texture determines friction coefficient", .purple),
                ("Work:rest",     "Rally ≈ 3–4 s; between-point rest 5–10 s; intermittent aerobic demand", .green),
                ("Movement",      "80–90% lateral bursts <2 m; 5–8 km/match hr total (Faber 2015)", .red),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 90, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Movement" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Table Tennis Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Table tennis is deceptively demanding: millisecond reaction decisions, sustained aerobic effort across 2–3 hour matches, and the highest cognitive load of any racquet sport due to spin reading and tactical variation.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Zagatto 2010 (JSCR): match VO₂ 45–65% average with bursts to 85%+ VO₂max. Muller 2015: HR averages 70–80% HRmax — players must maintain aerobic fitness comparable to tennis players. Drianovski 2002: >60% of points involve serve/receive — tactical serve variation is the primary weapon at elite level.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training recommendation: aerobic base (running / cycling 3×/week) supports between-point recovery; reaction training and multi-ball drilling develop the critical 250–300 ms decision window that separates elite from recreational players.")
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
            Image(systemName: "figure.table.tennis")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No table tennis sessions")
                .font(.headline)
            Text("Record table tennis workouts with your Apple Watch to see match history, intensity analysis, and performance science here.")
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
                    $0.workoutActivityType == .tableTennis
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [TableTennisSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return TableTennisSession(
                date: w.startDate, label: fmt.string(from: w.startDate),
                duration: w.duration, kcal: kcal
            )
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
