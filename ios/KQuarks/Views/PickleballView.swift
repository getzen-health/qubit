import SwiftUI
import HealthKit
import Charts

// MARK: - PickleballView
// Analyzes pickleball sessions: competitive matches, casual games, drilling, and warmups.
// Pickleball is America's fastest-growing sport for 3 consecutive years (2020–2023),
// with explosive growth in the 55+ demographic driven by lower joint impact than tennis
// combined with vigorous-intensity cardiovascular benefits.
//
// Science:
//   Decker et al. 2023 (J Aging Phys Act): recreational pickleball in adults 50–75 years
//     averages 75–85% HRmax — ACSM threshold for vigorous intensity is ≥77% HRmax.
//     Pickleball provides vigorous-intensity aerobic benefit comparable to jogging.
//   Doose et al. 2021 (Innov Aging): 6-week pickleball program (3×/week) in older adults
//     produced significant mental health benefits: depression −11.7%, anxiety −12.7%,
//     and significant improvement in life satisfaction and purpose scores.
//   Peng & Ruddell 2018 (J Aging Phys Act): pickleball injury rates significantly
//     lower than tennis; court is 1/4 the size (44×20 ft vs 78-ft singles); lighter
//     paddle; slower ball; less lateral running demand reduces knee and ankle injury risk.
//   Stork et al. 2019 (J Sci Med Sport): the "kitchen" (non-volley zone) creates a
//     unique tactical and neuromuscular challenge — soft hands, touch shots, and
//     controlled power at the net are the primary performance differentiators.
//   Casper et al. 2021 (Int J Sport Psychol): pickleball's inherent social nature —
//     played in doubles typically in close proximity — drives exceptional adherence
//     rates (73% 12-month retention) vs other recreational sports (40–50%).
//   Ainsworth et al. 2011 (Med Sci Sports Exerc): pickleball MET value 4–6
//     (moderate to vigorous); equivalent to doubles tennis or recreational cycling.
//
// Pickleball court: 44 ft × 20 ft (badminton-sized court); kitchen line 7 ft from net.
// Ball: perforated plastic, 3-inch diameter; paddle: graphite/composite, 7–8 oz.
// Scoring: rally to 11 (win by 2); serve must clear kitchen; only serving team scores.

struct PickleballView: View {

    // MARK: - Models

    struct PickleballSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 50 { return .match }
            if durationMin >= 25 { return .games }
            if durationMin >= 12 { return .drilling }
            return .warmup
        }
    }

    enum SessionType: String, CaseIterable {
        case match    = "Competitive Match"
        case games    = "Game Play"
        case drilling = "Dinking & Drills"
        case warmup   = "Warm-Up / Skills"

        var color: Color {
            switch self {
            case .match:    return .green
            case .games:    return .blue
            case .drilling: return .orange
            case .warmup:   return .teal
            }
        }

        var icon: String {
            switch self {
            case .match:    return "trophy.fill"
            case .games:    return "figure.pickleball"
            case .drilling: return "target"
            case .warmup:   return "bolt.fill"
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

    @State private var sessions: [PickleballSession] = []
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
                    ProgressView("Loading pickleball data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    intensityCard
                    kitchenCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Pickleball")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let matchCount = sessions.filter { $0.sessionType == .match }.count

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .green)
                Divider().frame(height: 44)
                statBox(value: "\(matchCount)", label: "Matches",
                        sub: "competitive", color: .blue)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 6 ? .green : .teal
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.pickleball")
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

    private var intensityLabel: String {
        if avgKcalPerMin > 8  { return "Vigorous competitive" }
        if avgKcalPerMin > 5  { return "Vigorous play" }
        if avgKcalPerMin > 3  { return "Moderate-vigorous" }
        return "Moderate / drilling"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 5 {
            return "Vigorous-intensity pickleball. Decker 2023 (J Aging Phys Act): recreational pickleball averages 75–85% HRmax in adults 50–75 — above ACSM's vigorous threshold (≥77% HRmax)."
        }
        if avgKcalPerMin > 3 {
            return "Moderate-to-vigorous intensity. Ainsworth 2011: pickleball MET 4–6 — equivalent to doubles tennis or recreational cycling. 30 min/session meets CDC aerobic guidelines."
        }
        return "Drilling and technique focus. The dinking game (soft kitchen shots) is low-intensity but develops the touch and control that determines rally outcomes at all competitive levels."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Competitive matches provide the highest intensity through sustained rally play. Casual games build consistency and fun — the primary driver of pickleball's exceptional adherence. Dinking drills develop the soft touch that wins at the kitchen line. Skills sessions build serve and return consistency.")
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
            Text("Pickleball's best-in-class adherence makes it ideal for consistent aerobic conditioning. Casper 2021: 73% 12-month retention rate — far above most recreational sports (40–50%). The social and competitive elements create intrinsic motivation that sustains training.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 500 ? Color.green.gradient : Color.teal.opacity(0.6).gradient)
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
            Label("Surprisingly Vigorous: The Science of Pickleball Intensity", systemImage: "heart.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.green)
            Text("Decker et al. 2023 (J Aging Phys Act): pickleball in adults 50–75 years averages 75–85% HRmax — above ACSM's vigorous-intensity threshold of 77% HRmax. The sport provides aerobic benefit comparable to jogging in a social, joint-friendly format.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("HR average",    "75–85% HRmax recreational; up to 90%+ in competitive play (Decker 2023)", .red),
                ("MET value",     "4–6 METs (Ainsworth 2011) — equivalent to doubles tennis or recreational cycling", .orange),
                ("Joint impact",  "Peng 2018: injury rates significantly lower than tennis; smaller court = less lateral running", .green),
                ("Mental health", "Doose 2021: 6 weeks → depression −11.7%, anxiety −12.7%, life satisfaction ↑", .blue),
                ("Adherence",     "Casper 2021: 73% 12-month retention — best in class for recreational sports", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 90, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Adherence" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.green.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Kitchen Card

    private var kitchenCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("The Kitchen Game: Pickleball's Unique Element", systemImage: "target")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)
            Text("Stork et al. 2019 (J Sci Med Sport): the non-volley zone (\"kitchen\") creates demands found in no other racquet sport — touch, control, and patience replace pure power. The kitchen line (7 ft from net) is where points are won and lost at every competitive level.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Dink",         "Soft cross-court shot landing in kitchen; keeps rally low and slow; patience wins", .green),
                ("Third shot drop", "Server's return: drive or drop into kitchen to gain net position — key tactical decision", .blue),
                ("Erne",         "Aggressive volley taken beside the kitchen — timing and court awareness required", .orange),
                ("Speed-up",     "Sudden power shot from kitchen exchange; requires fast reaction time (~350 ms)", .red),
                ("Stacking",     "Formation tactic to keep stronger forehand player in coverage — doubles strategy", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 90, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Stacking" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Pickleball Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Pickleball's explosive growth (36% annually 2020–2023; 36.5M US players by 2023 per SFIA) is driven by a unique convergence: vigorous aerobic intensity, low joint impact, inherent social connection, and a short learning curve that produces fun competitive play within weeks.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Doose 2021 mental health findings explain the sport's retention advantage — pickleball's social structure (typically played in doubles, often with strangers who become regulars) activates social connection pathways that produce documented wellbeing benefits beyond the exercise itself.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training recommendation: to improve competitive level, supplement court time with lateral agility work (lateral band walks, carioca), rotator cuff strengthening (external rotation exercises), and reaction training. The kitchen dink game develops faster with dedicated drilling than with pure game play.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.green.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.pickleball")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No pickleball sessions")
                .font(.headline)
            Text("Record pickleball workouts with your Apple Watch to see match history, intensity analysis, and performance science here.")
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
                    $0.workoutActivityType == .pickleball
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [PickleballSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return PickleballSession(date: w.startDate, label: fmt.string(from: w.startDate),
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
