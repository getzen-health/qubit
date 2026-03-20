import SwiftUI
import HealthKit
import Charts

// MARK: - BadmintonView
// Analyzes badminton sessions recorded via Apple Watch.
// Badminton is the world's fastest racquet sport with shuttle speeds exceeding
// 493 km/h, demanding unique explosive lateral movement, wrist mechanics, and
// intermittent high-intensity cardiorespiratory demands.
//
// Science:
//   Gawin et al. 2015 (Int J Perf Anal Sport): elite badminton requires
//     1300–2000 changes of direction per match; HR averages 80–90% HRmax;
//     rally duration 5–11 s, recovery time 10–20 s (1:1.5–2 work:rest ratio).
//   Phomsoupha & Laffaye 2015 (Sports Med): shuttle speed in jump smash can
//     reach 493 km/h (men) — the fastest racquet speed in any sport. Wrist
//     pronation generates 60–80% of smash power; shoulder contributes 20–30%.
//   Liddle et al. 1996 (J Sports Sci): badminton match HR 85–90% HRmax; blood
//     lactate 5–7 mmol/L during intense rallies — anaerobic threshold is critical.
//   Faude et al. 2007 (Int J Sports Med): movement demands per game — 340–380
//     direction changes; 60% of time in lateral movement; lunge is the most
//     metabolically costly movement pattern in badminton.
//   Phomsoupha & Laffaye 2015: optimal ready position allows fastest first-step
//     reaction; training studies show 6 weeks agility training improves shuttle
//     time 5–8% in recreational badminton players.
//
// Game formats:
//   Singles: 1v1, higher individual cardiorespiratory demand, more court coverage
//   Doubles: 2v2, faster rallies, specialized court zones, shorter work periods
//   Mixed doubles: unique tactical demands, gender-specific role positioning
//   Training: footwork drills, multi-shuttle feeds, technical shadow work

struct BadmintonView: View {

    // MARK: - Models

    struct BadmintonSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 80  { return .match }
            if durationMin >= 40  { return .gamePlay }
            if durationMin >= 20  { return .drilling }
            return .footwork
        }
    }

    enum SessionType: String, CaseIterable {
        case match      = "Tournament / Match"
        case gamePlay   = "Game Play"
        case drilling   = "Technical Drilling"
        case footwork   = "Footwork / Shadow"

        var color: Color {
            switch self {
            case .match:     return .red
            case .gamePlay:  return .orange
            case .drilling:  return .blue
            case .footwork:  return .green
            }
        }

        var icon: String {
            switch self {
            case .match:     return "trophy.fill"
            case .gamePlay:  return "figure.badminton"
            case .drilling:  return "target"
            case .footwork:  return "figure.run"
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

    @State private var sessions: [BadmintonSession] = []
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
                    ProgressView("Loading badminton data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    movementDemandCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Badminton")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let matchSessions = sessions.filter { $0.sessionType == .match || $0.sessionType == .gamePlay }.count
        let totalKcal = sessions.map(\.kcal).reduce(0, +)

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(sessions.count)",
                    label: "Sessions",
                    sub: "past 12 months",
                    color: .red
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(matchSessions)",
                    label: "Game Sessions",
                    sub: "match & play",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 9 ? .red : .orange
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.badminton")
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
        if avgKcalPerMin > 11 { return "Elite intensity" }
        if avgKcalPerMin > 8  { return "Competitive play" }
        if avgKcalPerMin > 5  { return "Recreational" }
        return "Technical work"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 9 { return "High-intensity badminton. Liddle 1996: match HR 85–90% HRmax; blood lactate 5–7 mmol/L — anaerobic threshold is the key fitness determinant." }
        if avgKcalPerMin > 6 { return "Competitive recreational intensity. Gawin 2015: elite badminton 1300–2000 direction changes per match; 1:1.5–2 work:rest ratio." }
        return "Technical and footwork focus. Faude 2007: the lunge is the most metabolically costly movement in badminton — prioritize hip flexibility and lunge strength."
    }

    // MARK: - Session Type Breakdown

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Match sessions capture full competitive play. Drilling sessions improve technical precision. Footwork/shadow training is often underlogged but critical — Faude 2007: footwork quality determines court coverage efficiency.")
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
            Text("Aim for 3–4 sessions/week for performance gains. Tournament weeks show high load; follow with a recovery week at 60–70% volume. Blood lactate capacity improves with consistent high-intensity game play.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 900 ? Color.red.gradient : Color.orange.opacity(0.6).gradient)
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

    // MARK: - Movement Demand Card

    private var movementDemandCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("The World's Fastest Racquet Sport", systemImage: "bolt.circle.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.red)

            let facts: [(String, String)] = [
                ("Shuttle speed", "Up to 493 km/h — men's jump smash world record (Phomsoupha 2015)"),
                ("Direction changes", "1300–2000 per match at elite level (Gawin 2015)"),
                ("Work:rest ratio", "1:1.5–2 — rallies 5–11 s, recovery 10–20 s"),
                ("Wrist pronation", "60–80% of smash power comes from wrist supination-to-pronation"),
                ("Match HR", "80–90% HRmax average; lactate 5–7 mmol/L (Liddle 1996)"),
                ("Lateral movement", "60% of match time — split-step and lunge are primary patterns"),
            ]

            VStack(spacing: 6) {
                ForEach(facts, id: \.0) { key, val in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold()).foregroundStyle(.red).frame(width: 95, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Lateral movement" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.red.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Badminton Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Badminton combines the explosive demands of sprinting with the cardiovascular endurance of interval training. The short rally / short recovery format is physiologically equivalent to high-intensity interval training, making regular play exceptionally effective for cardiovascular fitness.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Faude et al. 2007 (Int J Sports Med): the lunging movement pattern is the most metabolically costly in badminton — hip flexibility and quad/glute strength training directly improve court coverage. Phomsoupha & Laffaye 2015 (Sports Med): 6-week agility training improves shuttle time 5–8%.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training for badminton: footwork drills (6-corner pattern), multi-shuttle feeding for conditioning, wrist strengthening for smash power, and lactate threshold development for sustained competitive play. Apple Watch captures calorie burn and HR intensity per session.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.red.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.badminton")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No badminton sessions")
                .font(.headline)
            Text("Record badminton workouts with your Apple Watch to see match intensity, footwork load, and performance science here.")
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
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    $0.workoutActivityType == .badminton
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [BadmintonSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return BadmintonSession(date: w.startDate, label: fmt.string(from: w.startDate),
                                    duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            let ws = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date))!
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
