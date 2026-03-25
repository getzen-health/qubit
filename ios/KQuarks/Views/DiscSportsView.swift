import SwiftUI
import HealthKit
import Charts

// MARK: - DiscSportsView
// Analyzes disc sports sessions: ultimate frisbee, disc golf, freestyle/DDC.
// Ultimate frisbee is an exceptionally demanding full-body sport combining
// explosive sprinting with sustained aerobic effort and rapid direction changes.
//
// Science:
//   Krustrup et al. 2010 (Med Sci Sports Exerc): recreational football (soccer)
//     is physiologically comparable to ultimate frisbee; 1.5 km high-intensity
//     running per game, HR 80–85% HRmax across the match. Both involve
//     repeated sprint bouts with 20–30 s recovery periods.
//   Duthie et al. 2003 (J Sports Sci): field sports with repeated sprint demands
//     require both aerobic base (≥55 ml/kg/min VO₂max) and anaerobic capacity.
//     Players cover 8–12 km per game (70% aerobic running, 30% sprint efforts).
//   Loturco et al. 2015 (J Strength Cond Res): explosive acceleration in team
//     sports requires 4–6 weeks of plyometric + sprint work to improve 0–10 m time
//     by 3–5%. Disc sports require repeated cuts and explosive jumps for catches.
//   Levy & Sherrin 2008 (Int J Perf Anal Sport): disc golf average metabolic
//     equivalent 4.1 METs — classified as moderate-intensity physical activity;
//     18-hole round ≈ 4–6 km walking with intermittent throwing exertion.
//
// Session types:
//   Ultimate (high intensity): 2–4 METs avg, spikes 8–12 METs during sprints
//   Disc golf (moderate): 3–5 METs walking 18 holes (2–4 hr)
//   Freestyle/training: variable, depends on conditioning drills

struct DiscSportsView: View {

    // MARK: - Models

    struct DiscSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin > 90 { return .ultimate }
            if durationMin > 50 && kcalPerMin < 5 { return .discGolf }
            if durationMin > 40 { return .game }
            return .practice
        }
    }

    enum SessionType: String, CaseIterable {
        case ultimate  = "Ultimate (Full Game)"
        case game      = "Game / Tournament"
        case discGolf  = "Disc Golf (18 holes)"
        case practice  = "Practice / Drills"

        var color: Color {
            switch self {
            case .ultimate:  return .green
            case .game:      return .blue
            case .discGolf:  return .teal
            case .practice:  return .orange
            }
        }

        var icon: String {
            switch self {
            case .ultimate:  return "figure.run"
            case .game:      return "figure.disc.sports"
            case .discGolf:  return "figure.walk"
            case .practice:  return "sportscourt.fill"
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

    @State private var sessions: [DiscSession] = []
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
                    ProgressView("Loading disc sport sessions…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    demandCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Disc Sports")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let ultimateSessions = sessions.filter { $0.sessionType == .ultimate || $0.sessionType == .game }
        let totalKcal = sessions.map(\.kcal).reduce(0, +)

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
                    value: "\(ultimateSessions.count)",
                    label: "Games",
                    sub: "ultimate/tournament",
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
                Image(systemName: "figure.disc.sports")
                    .foregroundStyle(.green)
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
        guard !sessions.isEmpty else { return "" }
        let avgKpm = sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)
        if avgKpm > 9 { return "Very high intensity — comparable to soccer match load. Duthie 2003: field sport players cover 8–12 km per game with repeated sprint demands." }
        if avgKpm > 6 { return "High intensity ultimate play. Target ≥55 ml/kg/min VO₂max for competitive disc (Duthie 2003)." }
        if avgKpm > 4 { return "Moderate intensity — likely disc golf dominant. Levy & Sherrin 2008: disc golf ≈ 4.1 METs — a solid moderate-intensity workout." }
        return "Light disc activity — practice or recreational play."
    }

    // MARK: - Session Type Breakdown

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Auto-classified by duration and intensity. Ultimate games are long (90+ min) and high-intensity; disc golf is moderate (~4 METs) and long duration.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon).foregroundStyle(type.color).frame(width: 20)
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
            Text("Ultimate frisbee has distinct seasonal patterns — indoor winter leagues, outdoor spring/summer. Disc golf is year-round in mild climates.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 800 ? Color.green.gradient : Color.teal.opacity(0.7).gradient)
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

    // MARK: - Demand Card

    private var demandCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Physical Demands by Discipline", systemImage: "bolt.circle.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.green)

            let demands: [(String, String, String, Color)] = [
                ("Ultimate Frisbee", "8–12 METs peak", "8–12 km/game, 30% sprint", .green),
                ("Disc Golf (18 holes)", "4.1 METs avg", "4–6 km walking", .teal),
                ("Beach Ultimate", "10–13 METs peak", "Sand reduces sprint speed 50%", .orange),
                ("Freestyle / DDC", "4–6 METs", "Coordination + aerobic", .blue),
            ]

            VStack(spacing: 6) {
                ForEach(demands, id: \.0) { sport, intensity, note, color in
                    HStack(alignment: .top, spacing: 8) {
                        Text(sport).font(.caption2.bold()).foregroundStyle(color).frame(width: 110, alignment: .leading)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(intensity).font(.caption2.bold())
                            Text(note).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    if sport != "Freestyle / DDC" { Divider() }
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
            Label("Disc Sports Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Ultimate frisbee is a high-intensity intermittent team sport with physiological demands comparable to soccer or rugby. The spirit-of-the-game self-officiating model maintains high sporting culture while delivering significant cardiovascular stimulus.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Duthie et al. 2003 (J Sports Sci): competitive field sport players need VO₂max ≥55 ml/kg/min. Field coverage 8–12 km per game with repeated sprints averaging 20–30 s, recovery periods 30–60 s — classic intermittent aerobic demand.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Levy & Sherrin 2008: disc golf is a legitimate moderate-intensity physical activity (4.1 METs) — walking 18 holes burns 400–600 kcal. Loturco 2015: 4–6 weeks plyometric training improves 0–10 m acceleration 3–5% in field sport athletes.")
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
            Image(systemName: "figure.disc.sports")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No disc sport sessions")
                .font(.headline)
            Text("Record ultimate frisbee, disc golf, or disc sports workouts with your Apple Watch to see intensity analysis and training load tracking here.")
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
                    $0.workoutActivityType == .discSports
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [DiscSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return DiscSession(date: w.startDate, label: fmt.string(from: w.startDate),
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
