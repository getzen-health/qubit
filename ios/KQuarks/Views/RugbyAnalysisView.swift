import SwiftUI
import HealthKit
import Charts

// MARK: - RugbyAnalysisView
// Analyzes rugby union, rugby league, and American football workout sessions.
// These are high-collision, high-sprint sports with the greatest physical demands
// of any team sport — average match HR 150–165 bpm, spikes near max during collisions.
//
// Science:
//   Cunniffe et al. 2009 (J Strength Cond Res): elite rugby union players maintain
//     average HR >85% HRmax for 35–40% of match time. Total distance: 5–7 km per game.
//   Twist et al. 2012 (J Sports Sci): rugby match play causes significant muscle
//     damage — blood CK peaks at 24 h post-game. Recovery to baseline takes 72–96 h.
//   Gabbett 2010 (Br J Sports Med): high chronic training loads in rugby predict
//     lower injury risk — consistent with the protective effect hypothesis.
//   Buchheit et al. 2010 (Int J Sports Med): elite rugby union players average
//     30+ high-intensity accelerations/decelerations per half; heart rate rarely drops
//     below 70% HRmax during active play.
//
// Key metric: kcal/min as a proxy for match intensity. Rugby matches typically
//   burn 600–900 kcal/h; training sessions 300–500 kcal/h.

struct RugbyAnalysisView: View {

    // MARK: - Models

    struct MatchSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let sportType: SportType
        let duration: TimeInterval
        let kcal: Double
        var kcalPerMin: Double { duration > 0 ? kcal / (duration / 60) : 0 }
        var durationMin: Double { duration / 60 }

        var sessionType: SessionType {
            if durationMin >= 70 { return .match }
            else if durationMin >= 30 { return .training }
            else { return .drill }
        }
    }

    enum SportType: String {
        case rugbyUnion   = "Rugby Union"
        case rugbyLeague  = "Rugby League"
        case football     = "American Football"
        case unknown      = "Rugby"

        var color: Color {
            switch self {
            case .rugbyUnion:  return .green
            case .rugbyLeague: return .blue
            case .football:    return Color(red: 0.8, green: 0.3, blue: 0.0)
            case .unknown:     return .teal
            }
        }
    }

    enum SessionType: String {
        case match    = "Match"
        case training = "Training"
        case drill    = "Drills"

        var icon: String {
            switch self {
            case .match:    return "sportscourt.fill"
            case .training: return "figure.run"
            case .drill:    return "timer"
            }
        }

        var color: Color {
            switch self {
            case .match:    return .red
            case .training: return .blue
            case .drill:    return .orange
            }
        }
    }

    struct WeekLoad: Identifiable {
        let id = UUID()
        let weekLabel: String
        let date: Date
        let kcal: Double
        let sessions: Int
    }

    // MARK: - State

    @State private var sessions: [MatchSession] = []
    @State private var weekLoads: [WeekLoad] = []
    @State private var totalKcal: Double = 0
    @State private var matchCount: Int = 0
    @State private var avgMatchKcal: Double = 0
    @State private var avgRecoveryDays: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading match history…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    weeklyLoadChart
                    sessionBreakdownCard
                    recoveryCard
                    recentSessionsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Rugby & Football")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let matches = sessions.filter { $0.sessionType == .match }

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(sessions.count)",
                    label: "Sessions",
                    sub: "past 12 months",
                    color: .green
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(matches.count)",
                    label: "Matches",
                    sub: "≥70 min sessions",
                    color: .red
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgMatchKcal > 0 ? String(format: "%.0f kcal", avgMatchKcal) : "—",
                    label: "Avg Match Burn",
                    sub: avgMatchKcal > 700 ? "High intensity" : "Moderate",
                    color: avgMatchKcal > 700 ? .orange : .blue
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "bolt.heart.fill")
                    .foregroundStyle(.red)
                Text(intensitySummary)
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

    private var intensitySummary: String {
        let avgKpm = sessions.isEmpty ? 0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)
        if avgKpm > 8 { return "Very high intensity — consistent with elite match play demands (Cunniffe 2009)." }
        else if avgKpm > 6 { return "High intensity load — strong cardio demand typical of rugby." }
        else if avgKpm > 4 { return "Moderate intensity — likely training sessions dominate the log." }
        else { return "Light load — mostly drills or light training." }
    }

    // MARK: - Weekly Load Chart

    private var weeklyLoadChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Training Load", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Total kcal per week. Rugby's periodization: hard match week → lighter recovery week. Gabbett 2010: high chronic load protects against injury when acute:chronic ratio stays below 1.5.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.weekLabel),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 1000 ? Color.red.gradient : Color.green.gradient)
                .cornerRadius(3)
            }
            .frame(height: 140)
            .chartXAxis {
                AxisMarks(values: .stride(by: 2)) { _ in
                    AxisValueLabel()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Session Breakdown

    private var sessionBreakdownCard: some View {
        let matches   = sessions.filter { $0.sessionType == .match }.count
        let trainings = sessions.filter { $0.sessionType == .training }.count
        let drills    = sessions.filter { $0.sessionType == .drill }.count
        let total     = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Type Breakdown", systemImage: "list.bullet.clipboard")
                .font(.subheadline).bold()
            Text("Sessions classified by duration: Match (≥70 min), Training (30–70 min), Drills (<30 min).")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach([
                ("Matches", matches, Color.red),
                ("Training", trainings, Color.blue),
                ("Drills", drills, Color.orange),
            ], id: \.0) { label, count, color in
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack {
                    Text(label).font(.caption2).frame(width: 60, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 10)
                            Capsule().fill(color.gradient).frame(width: geo.size.width * pct / 100, height: 10)
                        }
                    }
                    .frame(height: 10)
                    Text("\(count) (\(String(format: "%.0f%%", pct)))")
                        .font(.caption2.bold()).foregroundStyle(color).frame(width: 60, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recovery Card

    private var recoveryCard: some View {
        let matches = sessions.filter { $0.sessionType == .match }.sorted { $0.date < $1.date }

        var intervals: [Double] = []
        for i in 1..<matches.count {
            let days = calendar.dateComponents([.day], from: matches[i-1].date, to: matches[i].date).day ?? 0
            if days > 0 && days <= 21 { intervals.append(Double(days)) }
        }
        let avgGap = intervals.isEmpty ? 0.0 : intervals.reduce(0, +) / Double(intervals.count)

        return VStack(alignment: .leading, spacing: 8) {
            Label("Recovery Between Matches", systemImage: "arrow.up.heart.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.teal)

            if avgGap > 0 {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(String(format: "%.1f days", avgGap))
                            .font(.title3.bold())
                            .foregroundStyle(avgGap >= 6 ? .green : avgGap >= 4 ? .orange : .red)
                        Text("avg between matches")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(avgGap >= 7 ? "Adequate" : avgGap >= 5 ? "Borderline" : "Tight")
                            .font(.caption.bold())
                            .foregroundStyle(avgGap >= 7 ? .green : avgGap >= 5 ? .orange : .red)
                        Text("recovery window")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }

                Text(avgGap < 5 ? "⚠️ Matches <5 days apart leave insufficient time for muscle damage recovery. Twist et al. 2012: blood CK normalizes in 72–96 h post-match; force production may remain impaired for up to 5 days." : "Recovery gap is adequate. Elite programs target 7 days between competitive matches to fully restore neuromuscular function (Cunniffe 2009).")
                    .font(.caption).foregroundStyle(.secondary)
            } else {
                Text("Insufficient match data to calculate recovery intervals.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.teal.opacity(0.07))
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
                        Text(String(format: "%.0f kcal  ·  %.1f kcal/min", s.kcal, s.kcalPerMin))
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
            Label("Rugby & Football Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Rugby union, rugby league, and American football are among the highest-demand team sports. Apple Watch HR monitoring during matches captures the intermittent, high-intensity nature of these sports — continuous high HR with repeated near-maximal spikes.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Cunniffe et al. 2009 (J Strength Cond Res): elite rugby union players spend 35–40% of match time at >85% HRmax; total distance 5–7 km per game. Twist et al. 2012 (J Sports Sci): post-match muscle damage persists for 72–96 h — critical for fixture scheduling.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Gabbett 2010 (Br J Sports Med): players with higher chronic training loads suffer fewer injuries in rugby — consistent training volume creates tissue resilience and neuromuscular protection against impact forces.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.green.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "sportscourt.fill")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No rugby or football sessions")
                .font(.headline)
            Text("Record rugby union, rugby league, or American football workouts with your Apple Watch to see match history, load analysis, and recovery tracking here.")
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
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        let rugbyWorkouts = rawWorkouts.filter {
            $0.workoutActivityType == .rugby ||
            $0.workoutActivityType == .americanFootball
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [MatchSession] = rugbyWorkouts.map { w in
            let sportType: SportType = w.workoutActivityType == .americanFootball ? .football : .rugbyUnion
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return MatchSession(
                date: w.startDate,
                label: fmt.string(from: w.startDate),
                sportType: sportType,
                duration: w.duration,
                kcal: kcal
            )
        }

        // Weekly load
        let weekFmt = DateFormatter(); weekFmt.dateFormat = "MMM d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            let weekStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date))!
            let cur = weekMap[weekStart] ?? (0, 0)
            weekMap[weekStart] = (cur.kcal + s.kcal, cur.sessions + 1)
        }

        var weekCursor = calendar.date(byAdding: .month, value: -3, to: end)!
        weekCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: weekCursor))!
        var weekLoads: [WeekLoad] = []
        while weekCursor <= end {
            let data = weekMap[weekCursor] ?? (0, 0)
            weekLoads.append(WeekLoad(
                weekLabel: weekFmt.string(from: weekCursor),
                date: weekCursor,
                kcal: data.kcal,
                sessions: data.sessions
            ))
            weekCursor = calendar.date(byAdding: .weekOfYear, value: 1, to: weekCursor)!
        }

        let totalKcal = sessions.map(\.kcal).reduce(0, +)
        let matches   = sessions.filter { $0.sessionType == .match }
        let avgMatchK = matches.isEmpty ? 0.0 : matches.map(\.kcal).reduce(0, +) / Double(matches.count)

        DispatchQueue.main.async {
            self.sessions       = sessions
            self.weekLoads      = weekLoads
            self.totalKcal      = totalKcal
            self.matchCount     = matches.count
            self.avgMatchKcal   = avgMatchK
            self.isLoading      = false
        }
    }
}
