import SwiftUI
import HealthKit
import Charts

// MARK: - HandballView
// Analyzes handball sessions: team handball (Olympic), beach handball, field handball.
// Handball is a high-intensity team sport combining basketball-like movement patterns
// with unique throwing biomechanics and physical contact.
//
// Science:
//   Michalsik et al. 2013 (J Sports Sci): elite handball players cover
//     4000–6000 m per game at high intensity (>14.4 km/h); 15–17% of total
//     distance at sprinting pace; HR averages 85% HRmax. Goalkeepers ~10–12%
//     lower total distance but higher explosive demands.
//   Wagner et al. 2011 (J Strength Cond Res): handball throwing velocity
//     80–120+ km/h at elite level; throwing biomechanics require trunk rotation
//     velocity 4–6× greater than shoulder rotation for optimal force transfer.
//   Povoas et al. 2012 (Int J Sports Med): physiological demands comparable
//     to soccer — VO₂max 55–65 ml/kg/min for elite players; match HR
//     averages 86% HRmax; significant glycolytic demand during attacking phases.
//   Mónaco et al. 2020 (J Sports Med Phys Fitness): handball shoulder
//     loading — 3000–5000 throws per season in elite players; rotator cuff
//     and labrum most commonly injured structures (30–40% of injuries).
//   Chaouachi et al. 2009 (J Strength Cond Res): jump performance (CMJ,
//     sprint) strongly predicts handball playing level; plyometric training
//     improves 20-m sprint time 3–5% and jump height 8–12% in handball athletes.
//
// Handball game structure:
//   2 × 30-min halves (60 min total); 3-line format (backs, wings, pivot)
//   Continuous substitutions — work:rest highly variable by position
//   Beach handball: 2 × 10-min periods, more aerial play

struct HandballView: View {

    // MARK: - Models

    struct HandballSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 70 { return .match }
            if durationMin >= 40 { return .training }
            if durationMin >= 20 { return .tactics }
            return .throwing
        }
    }

    enum SessionType: String, CaseIterable {
        case match    = "Match / Game"
        case training = "Full Training"
        case tactics  = "Tactical / Technical"
        case throwing = "Throwing / Skills"

        var color: Color {
            switch self {
            case .match:    return .blue
            case .training: return .green
            case .tactics:  return .orange
            case .throwing: return .purple
            }
        }

        var icon: String {
            switch self {
            case .match:    return "trophy.fill"
            case .training: return "figure.handball"
            case .tactics:  return "figure.run"
            case .throwing: return "hand.raise.fill"
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

    @State private var sessions: [HandballSession] = []
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
                    ProgressView("Loading handball data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    throwingCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Handball")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let matchSessions = sessions.filter { $0.sessionType == .match }.count
        _ = sessions.map(\.kcal).reduce(0, +)

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(sessions.count)",
                    label: "Sessions",
                    sub: "past 12 months",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(matchSessions)",
                    label: "Matches",
                    sub: "game sessions",
                    color: .green
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 9 ? .blue : .green
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.handball")
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
        return "Technical work"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 9 { return "Elite-level handball demands. Michalsik 2013: elite players cover 4–6 km/game at high intensity (>14 km/h); 85% HRmax average." }
        if avgKcalPerMin > 6 { return "Solid match-level intensity. Povoas 2012: handball VO₂max demands comparable to soccer — 55–65 ml/kg/min at elite level." }
        return "Training and technical focus. Chaouachi 2009: plyometric training improves sprint 3–5% and CMJ 8–12% in handball players — strong ROI for performance."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Full matches (2×30 min) are the primary performance context. Training typically 90–120 min covering tactics, technical work, and conditioning. Dedicated throwing sessions develop velocity and mechanics.")
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
            Text("Handball season: Sept–May in most leagues. In-season: 2–3 training sessions + 1 match/week. Off-season: strength base + aerobic conditioning. Match weeks show highest load.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 1000 ? Color.blue.gradient : Color.green.opacity(0.6).gradient)
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

    // MARK: - Throwing Card

    private var throwingCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Throwing: The Core Athletic Skill", systemImage: "hand.raise.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.purple)
            Text("Wagner et al. 2011 (J Strength Cond Res): elite handball throwing velocity 80–120+ km/h. The kinematic chain amplifies force: legs → trunk → shoulder → arm → wrist.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Trunk rotation", "4–6× faster than shoulder = optimal force transfer", .purple),
                ("Throwing volume", "3000–5000 throws/season at elite level (Mónaco 2020)", .blue),
                ("Shoulder risk", "Rotator cuff & labrum — 30–40% of handball injuries", .red),
                ("CMJ correlation", "Jump height predicts playing level (Chaouachi 2009)", .green),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold()).foregroundStyle(color).frame(width: 100, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "CMJ correlation" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.purple.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Handball Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Handball occupies a unique athletic space: the physical contact and sprint demands of rugby, the throwing volume of baseball, and the tactical court coverage of basketball — simultaneously.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Michalsik et al. 2013 (J Sports Sci): elite players cover 4000–6000 m at high intensity (>14.4 km/h) per game; 15–17% at sprinting pace. HR averages 85% HRmax with constant substitution. Povoas 2012: demands comparable to soccer — VO₂max 55–65 ml/kg/min required.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Chaouachi 2009: plyometric training improves 20-m sprint 3–5% and CMJ 8–12%. Training recommendation: 2× weekly plyometrics + position-specific throw conditioning + aerobic base maintenance during competitive season.")
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
            Image(systemName: "figure.handball")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No handball sessions")
                .font(.headline)
            Text("Record handball workouts with your Apple Watch to see match load, throwing demands, and performance science here.")
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
                    $0.workoutActivityType == .handball
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [HandballSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return HandballSession(date: w.startDate, label: fmt.string(from: w.startDate),
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
