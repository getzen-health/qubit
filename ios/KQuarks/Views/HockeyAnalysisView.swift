import SwiftUI
import HealthKit
import Charts

// MARK: - HockeyAnalysisView
// Analyzes ice hockey, field hockey, and lacrosse sessions tracked via Apple Watch.
// These are high-intensity intermittent team sports with repeated sprint demands
// and specific movement patterns — skating, stick handling, explosive bursts.
//
// Science:
//   Quinney et al. 2008 (J Strength Cond Res): elite ice hockey players average
//     HR 170–185 bpm during game play; VO₂max 55–65 ml/kg/min for forwards.
//     A typical shift lasts 40–70 seconds at near-maximal intensity.
//   Petrella et al. 2007 (J Appl Physiol): skating demands 8–12 high-intensity
//     bursts per shift; total distance per game ≈ 5–7 km.
//   Twist & Rhodes 1993 (J Strength Cond Res): ice hockey combines aerobic
//     (between shifts) and anaerobic (on-ice) pathways in roughly 70:30 ratio.
//   Spencer et al. 2005 (J Sports Sci): field hockey players cover 9–12 km per
//     game with 16 sprints per half; HR averages 85–92% HRmax during play.
//
// Physiological profile: brief (<90 s) maximal efforts followed by 3–5 min bench
// rest — unique dual-pathway demands require both aerobic base and sprint capacity.

struct HockeyAnalysisView: View {

    // MARK: - Models

    struct GameSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let sport: SportType
        let duration: TimeInterval
        let kcal: Double
        var kcalPerMin: Double { duration > 0 ? kcal / (duration / 60) : 0 }
        var durationMin: Double { duration / 60 }

        var sessionType: SessionType {
            durationMin >= 50 ? .game : durationMin >= 25 ? .practice : .drill
        }
    }

    enum SportType: String {
        case iceHockey   = "Ice Hockey"
        case fieldHockey = "Field Hockey"
        case lacrosse    = "Lacrosse"

        var color: Color {
            switch self {
            case .iceHockey:   return .cyan
            case .fieldHockey: return .green
            case .lacrosse:    return .purple
            }
        }

        var icon: String {
            switch self {
            case .iceHockey:   return "figure.hockey"
            case .fieldHockey: return "sportscourt.fill"
            case .lacrosse:    return "figure.lacrosse"
            }
        }

        static func classify(_ type: HKWorkoutActivityType) -> SportType? {
            switch type {
            case .hockey:   return .iceHockey
            case .lacrosse: return .lacrosse
            default:        return nil
            }
        }
    }

    enum SessionType: String {
        case game     = "Game"
        case practice = "Practice"
        case drill    = "Drills"

        var color: Color {
            switch self {
            case .game:     return .red
            case .practice: return .blue
            case .drill:    return .orange
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

    @State private var sessions: [GameSession] = []
    @State private var weekLoads: [WeekLoad] = []
    @State private var avgGameKcal: Double = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading game history…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    weeklyLoadChart
                    intensityDistributionCard
                    recentSessionsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Hockey & Lacrosse")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let games     = sessions.filter { $0.sessionType == .game }.count
        let practices = sessions.filter { $0.sessionType == .practice }.count

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
                    value: "\(games)",
                    label: "Games",
                    sub: "\(practices) practices",
                    color: .red
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: avgKcalPerMin > 8 ? "High intensity" : "Moderate",
                    color: avgKcalPerMin > 8 ? .orange : .blue
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "bolt.heart.fill")
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
        let avgKpm = sessions.isEmpty ? 0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)
        if avgKpm > 10 { return "Very high intensity — elite hockey demands. Quinney 2008: 170–185 bpm during game play." }
        else if avgKpm > 7 { return "High intensity — consistent with competitive hockey match demands." }
        else if avgKpm > 5 { return "Moderate-high intensity — likely practice and training sessions dominate." }
        else { return "Moderate load — mostly drills and skill work." }
    }

    // MARK: - Weekly Load Chart

    private var weeklyLoadChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Load (kcal)", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Total calorie expenditure per week. Hockey season typically shows bimodal distribution — heavy game weeks alternate with lighter practice weeks.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 1200 ? Color.red.gradient : Color.cyan.gradient)
                .cornerRadius(3)
            }
            .frame(height: 130)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Intensity Distribution

    private var intensityDistributionCard: some View {
        let total = Double(sessions.count)
        let types: [(SessionType, Int)] = [
            (.game,     sessions.filter { $0.sessionType == .game }.count),
            (.practice, sessions.filter { $0.sessionType == .practice }.count),
            (.drill,    sessions.filter { $0.sessionType == .drill }.count),
        ]

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Distribution", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Games (≥50 min), practices (25–50 min), drills (<25 min). Target: 2–3 practices per game for skill development (Twist & Rhodes 1993).")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(types, id: \.0.rawValue) { type, count in
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack {
                    Text(type.rawValue).font(.caption2).frame(width: 60, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 10)
                            Capsule().fill(type.color.gradient).frame(width: geo.size.width * pct / 100, height: 10)
                        }
                    }
                    .frame(height: 10)
                    Text("\(count)  (\(String(format: "%.0f%%", pct)))")
                        .font(.caption2.bold()).foregroundStyle(type.color).frame(width: 65, alignment: .trailing)
                }
            }
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
                    Image(systemName: s.sport.icon)
                        .foregroundStyle(s.sport.color)
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.sport.rawValue)
                            .font(.caption.bold()).foregroundStyle(s.sport.color)
                        Text("\(s.label) · \(s.sessionType.rawValue)")
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

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Hockey & Lacrosse Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Ice hockey and lacrosse are uniquely demanding: brief, maximal-intensity efforts (skating shifts, lacrosse sprints) followed by rest periods require both elite aerobic and anaerobic capacity.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Quinney et al. 2008 (J Strength Cond Res): elite ice hockey forwards average HR 170–185 bpm during shifts; a typical shift lasts 40–70 seconds. Over a 60-min game, this accumulates to nearly 30 min of near-maximal effort.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Spencer et al. 2005 (J Sports Sci): field hockey players cover 9–12 km per game with 16+ sprints per half. HR averages 85–92% HRmax during active play — among the highest of any team sport. Apple Watch captures total load via calorie and HR tracking.")
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
            Image(systemName: "figure.hockey")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No hockey or lacrosse sessions")
                .font(.headline)
            Text("Record ice hockey, field hockey, or lacrosse workouts with your Apple Watch to see game history, intensity analysis, and training load tracking here.")
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
                    $0.workoutActivityType == .hockey ||
                    $0.workoutActivityType == .lacrosse
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [GameSession] = rawWorkouts.map { w in
            let sport = SportType.classify(w.workoutActivityType) ?? .iceHockey
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return GameSession(date: w.startDate, label: fmt.string(from: w.startDate),
                               sport: sport, duration: w.duration, kcal: kcal)
        }

        // Weekly load
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

        let games = sessions.filter { $0.sessionType == .game }
        let avgMatchK = games.isEmpty ? 0.0 : games.map(\.kcal).reduce(0, +) / Double(games.count)
        let avgKpm = sessions.isEmpty ? 0.0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)

        DispatchQueue.main.async {
            self.sessions       = sessions
            self.weekLoads      = weekLoads
            self.avgGameKcal    = avgMatchK
            self.avgKcalPerMin  = avgKpm
            self.isLoading      = false
        }
    }
}
