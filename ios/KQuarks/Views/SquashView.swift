import SwiftUI
import HealthKit
import Charts

// MARK: - SquashView
// Analyzes squash sessions: competitive matches, conditioned games, ghosting drills, fitness.
// Squash is among the most aerobically demanding sports — players maintain 85–95% HRmax for
// the majority of a match while performing 18+ direction changes per minute in a tiny 9.75×6.4 m court.
//
// Science:
//   Todd et al. 1998 (J Sports Med Phys Fitness): elite squash players maintain 85–95% HRmax
//     for the majority of match time — more sustained high-intensity than tennis or badminton.
//   Wilkinson et al. 2009 (JSCR): blood lactate 6–10 mmol/L during competitive squash —
//     highest of any racquet sport; indicates profound glycolytic contribution.
//   Hughes & Knight 1995 (J Sports Sci): top-level players cover 2.5–4 km per game in a
//     9.75×6.4 m court — extraordinary repeated acceleration/deceleration density.
//   Novas et al. 2003 (J Sports Med Phys Fitness): 18 direction changes per minute —
//     among the highest of any sport; demands exceptional reactive agility and deceleration strength.
//   Veltmeijer et al. 2014 (IJSPP): average match HR 165–175 bpm (similar to maximal running
//     intervals); VO₂max requirement 55–70 ml/kg/min at elite level.
//   Dube et al. 1993 (J Sports Med Phys Fitness): rally length averages 10–15 s; rest between
//     points 7–12 s; work:rest ratio ~1:0.7 — unlike tennis (work:rest 1:3–1:5), squash is
//     nearly continuous high-intensity effort.
//
// Squash court:
//   9.75 m (length) × 6.4 m (width); 5.64 m front wall height; tin at 0.48 m from floor.
//   The small court + fast ball (up to 170 km/h) creates extreme reaction demand — the ball
//   travels court-length in <0.2 s at full speed.

struct SquashView: View {

    // MARK: - Models

    struct SquashSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 55 { return .match }
            if durationMin >= 30 { return .game }
            if durationMin >= 15 { return .ghosting }
            return .conditioning
        }
    }

    enum SessionType: String, CaseIterable {
        case match        = "Competitive Match"
        case game         = "Conditioned Games"
        case ghosting     = "Ghosting / Drills"
        case conditioning = "Fitness / Conditioning"

        var color: Color {
            switch self {
            case .match:        return .red
            case .game:         return .orange
            case .ghosting:     return .blue
            case .conditioning: return .green
            }
        }

        var icon: String {
            switch self {
            case .match:        return "trophy.fill"
            case .game:         return "figure.squash"
            case .ghosting:     return "figure.run"
            case .conditioning: return "heart.fill"
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

    @State private var sessions: [SquashSession] = []
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
                    ProgressView("Loading squash data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    intensityCard
                    movementCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Squash")
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
                        sub: "past 12 months", color: .red)
                Divider().frame(height: 44)
                statBox(value: "\(matchCount)", label: "Matches",
                        sub: "competitive", color: .orange)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 10 ? .red : .orange
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.squash")
                    .foregroundStyle(.red)
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
        if avgKcalPerMin > 12 { return "Elite match intensity" }
        if avgKcalPerMin > 9  { return "Competitive load" }
        if avgKcalPerMin > 6  { return "Hard practice" }
        return "Ghosting / drills"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 10 {
            return "Elite squash intensity. Todd 1998: 85–95% HRmax sustained; Veltmeijer 2014: match HR 165–175 bpm; lactate 6–10 mmol/L (Wilkinson 2009) — highest of any racquet sport."
        }
        if avgKcalPerMin > 7 {
            return "High competitive load. Hughes & Knight 1995: 2.5–4 km covered per game; Novas 2003: 18 direction changes/min — extraordinary agility demands in a 9.75×6.4 m court."
        }
        return "Training and drilling focus. Ghosting (solo court movement without ball) is the highest-fidelity conditioning tool — replicates match movement patterns at controlled intensity."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Competitive matches provide peak physiological demand. Conditioned games (with artificial constraints e.g. width limit, shot restrictions) build specific patterns. Ghosting replicates movement at controlled intensity without ball. Fitness sessions target VO₂max and lactate threshold.")
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
            Text("Optimal squash training: 3–5 sessions/week. Peak match weeks show highest kcal due to sustained 85–95% HRmax intensity. Recovery sessions after hard matches are essential — lactate 6–10 mmol/L requires 24–48h recovery.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 900 ? Color.red.gradient : Color.orange.opacity(0.7).gradient)
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

    // MARK: - Intensity Card

    private var intensityCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Why Squash Is Uniquely Intense", systemImage: "flame.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.red)
            Text("Unlike tennis (work:rest 1:3–1:5), squash work:rest is nearly 1:1 — Dube 1993: rally 10–15 s, between-point rest 7–12 s. This near-continuous intensity creates the highest sustained HR of any racquet sport.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("HR during match",  "165–175 bpm average — comparable to maximal running (Veltmeijer 2014)", .red),
                ("% HRmax sustained", "85–95% for majority of match (Todd 1998) — vs tennis 60–80%", .orange),
                ("Blood lactate",    "6–10 mmol/L — highest of any racquet sport (Wilkinson 2009)", .red),
                ("VO₂max needed",   "55–70 ml/kg/min at elite level; 45–55 competitive amateur", .blue),
                ("Work:rest ratio",  "~1:0.7 — near continuous vs tennis 1:3–1:5 (Dube 1993)", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 110, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Work:rest ratio" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.red.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Movement Card

    private var movementCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Movement: Extreme Agility in a Tiny Court", systemImage: "arrow.left.and.right")
                .font(.subheadline).bold()
                .foregroundStyle(.blue)
            Text("Hughes & Knight 1995 (J Sports Sci): elite players cover 2.5–4 km per 40-min match in a court barely larger than 60 m². Novas 2003: 18 direction changes per minute — this deceleration/re-acceleration demand rivals field hockey.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Distance/game",     "2.5–4 km in a 9.75×6.4 m court (Hughes & Knight 1995)", .blue),
                ("Direction changes", "18 per minute — among highest of any sport (Novas 2003)", .purple),
                ("Ball speed",        "Up to 170 km/h — court-length in <0.2 s at full pace", .orange),
                ("Key movement",      "T-position recovery after each shot — tactical court control center", .green),
                ("Lower body load",   "Explosive lunge + rapid deceleration → high knee/ankle load", .red),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 110, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Lower body load" { Divider() }
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
            Label("Squash Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Forbes magazine famously named squash the world's healthiest sport. The combination of sustained high-intensity aerobic demand, extreme agility requirements, tactical decision-making, and social play creates a uniquely health-promoting activity profile.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Veltmeijer 2014 (IJSPP): match HR averages 165–175 bpm across elite matches. Wilkinson 2009: lactate 6–10 mmol/L — highest of any racquet sport. Novas 2003: 18 direction changes/min demands exceptional reactive agility that transfers to injury prevention in other activities.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training recommendation: ghosting (T-movement patterns without ball) is the gold standard squash conditioning drill. Interval training at 90%+ HRmax 2×/week builds the lactate tolerance required for competitive match play. Eccentric quad/glute strengthening prevents the knee injuries common from extreme deceleration patterns.")
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
            Image(systemName: "figure.squash")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No squash sessions")
                .font(.headline)
            Text("Record squash workouts with your Apple Watch to see match intensity, weekly load, and agility science here.")
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
                    $0.workoutActivityType == .squash
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [SquashSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return SquashSession(date: w.startDate, label: fmt.string(from: w.startDate),
                                 duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            guard let ws = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)) else { continue }
            let cur = weekMap[ws] ?? (0, 0)
            weekMap[ws] = (cur.kcal + s.kcal, cur.sessions + 1)
        }
        var wCursor = calendar.date(byAdding: .month, value: -3, to: end) ?? Date()
        wCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: wCursor)) ?? wCursor
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
