import SwiftUI
import HealthKit
import Charts

// MARK: - FlexibilityView
// Analyzes flexibility and stretching sessions: static, dynamic, PNF, yin yoga, mobility.
// Flexibility training is one of the most evidence-misunderstood areas of exercise science —
// the popular belief that stretching prevents injury is not supported by research, while
// the role of flexibility in performance, recovery, and longevity is nuanced and fascinating.
//
// Science:
//   Harvey et al. 2002 (Cochrane Database): systematic review of 8 RCTs — stretching
//     before OR after exercise does NOT prevent injury; muscle soreness is unchanged.
//     This finding contradicted decades of conventional wisdom.
//   Behm & Chaouachi 2011 (Eur J Appl Physiol): meta-analysis — static stretching >45 s
//     reduces maximal strength 5.8%, power output 1.9%, and sprint speed 2.8%. Short
//     bouts (<30 s) show minimal performance impairment.
//   Opplert & Babault 2018 (Sports Med): dynamic stretching pre-exercise preserves or
//     modestly improves acute performance vs static stretching which impairs it; dynamic
//     stretching should replace static in warm-up protocols.
//   Freitas et al. 2018 (Int J Sports Phys Ther): PNF (proprioceptive neuromuscular
//     facilitation) stretching produces greatest acute ROM gains (20–30% greater than
//     static); static stretching remains superior for long-term chronic ROM improvement.
//   Simic et al. 2013 (Scand J Med Sci Sports): meta-analysis — isolated pre-exercise
//     static stretching impairs strength −5.5%, rate of force development −2.8%, and
//     explosive performance across 104 studies. Recommendation: replace pre-exercise
//     static stretch with dynamic movement preparation.
//   Chaouachi et al. 2017 (J Strength Cond Res): chronic static stretching 3–5×/week
//     for 4+ weeks significantly improves passive ROM, tissue compliance, and stretch
//     tolerance — effects are neurological (increased pain threshold) more than mechanical.
//
// Flexibility session types:
//   Static: held positions 20–60+ s; best for chronic ROM; impairs acute performance.
//   Dynamic: controlled movement through range; warm-up optimal; preserves performance.
//   PNF: contract-relax or hold-relax; greatest acute ROM gains; requires partner or band.
//   Yin yoga: passive floor postures held 3–5 min; targets fascia and joint capsules.
//   Foam rolling: self-myofascial release; reduces DOMS; modest acute ROM gains.

struct FlexibilityView: View {

    // MARK: - Models

    struct FlexSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 50 { return .extended }
            if durationMin >= 25 { return .dedicated }
            if durationMin >= 12 { return .moderate }
            return .quickStretch
        }
    }

    enum SessionType: String, CaseIterable {
        case extended     = "Full Session (50+ min)"
        case dedicated    = "Dedicated Stretch (25–50 min)"
        case moderate     = "Moderate Session (12–25 min)"
        case quickStretch = "Quick Stretch (<12 min)"

        var color: Color {
            switch self {
            case .extended:     return .purple
            case .dedicated:    return .blue
            case .moderate:     return .green
            case .quickStretch: return .orange
            }
        }

        var icon: String {
            switch self {
            case .extended:     return "figure.flexibility"
            case .dedicated:    return "figure.flexibility"
            case .moderate:     return "arrow.up.and.down"
            case .quickStretch: return "clock"
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

    @State private var sessions: [FlexSession] = []
    @State private var weekLoads: [WeekLoad] = []
    @State private var totalMinutes: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading flexibility data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    mythBusterCard
                    stretchTypeCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Flexibility")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let totalHours = totalMinutes / 60

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .purple)
                Divider().frame(height: 44)
                statBox(value: String(format: "%.1f", totalHours), label: "Hours",
                        sub: "total flexibility", color: .blue)
                Divider().frame(height: 44)
                statBox(
                    value: sessions.isEmpty ? "—" : String(format: "%.0f", totalMinutes / max(Double(sessions.count), 1)),
                    label: "min/session",
                    sub: sessionLengthLabel,
                    color: .green
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.flexibility")
                    .foregroundStyle(.purple)
                Text(consistencyContext)
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

    private var sessionLengthLabel: String {
        let avg = sessions.isEmpty ? 0 : totalMinutes / Double(sessions.count)
        if avg >= 40 { return "Yin / deep session" }
        if avg >= 20 { return "Dedicated work" }
        if avg >= 10 { return "Moderate stretch" }
        return "Post-workout quick"
    }

    private var consistencyContext: String {
        let sessionsPerWeek = Double(sessions.count) / 52.0
        if sessionsPerWeek >= 4 {
            return "Excellent flexibility frequency. Chaouachi 2017: 3–5×/week chronic stretching produces significant ROM gains via increased stretch tolerance (neurological, not mechanical)."
        }
        if sessionsPerWeek >= 2 {
            return "Good consistency. Freitas 2018: static stretching 3× weekly for 4+ weeks produces meaningful chronic ROM improvements — key is cumulative duration per week."
        }
        return "Building the habit. Even 10–15 min of static stretching daily produces measurable ROM gains in 4–6 weeks (Chaouachi 2017). Consistency > session duration."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Full yin-style sessions (50+ min) produce the deepest tissue changes through long passive holds. Dedicated sessions (25–50 min) build consistent ROM. Quick stretches after workouts leverage post-exercise tissue warmth for improved range. All session lengths contribute to chronic ROM goals when done consistently.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct   = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue)
                        .font(.caption2).frame(width: 155, alignment: .leading)
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

    // MARK: - Weekly Chart

    private var weeklyLoadChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Sessions", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Flexibility gains are cumulative: total weekly stretching time matters more than any single session. Aim for 60+ min of flexibility work distributed across 3–5 sessions per week for meaningful chronic ROM improvement.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("Sessions", w.sessions)
                )
                .foregroundStyle(w.sessions >= 4 ? Color.purple.gradient : Color.blue.opacity(0.6).gradient)
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
                        Text(String(format: "%.0f kcal", s.kcal))
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

    // MARK: - Myth Buster Card

    private var mythBusterCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("What the Science Actually Says", systemImage: "exclamationmark.triangle.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)
            Text("Several widely-held beliefs about stretching are not supported by evidence. Understanding what stretching actually does — and doesn't do — leads to smarter programming.")
                .font(.caption).foregroundStyle(.secondary)

            let myths: [(String, String, Bool)] = [
                ("Stretching prevents injury", "Harvey 2002 (Cochrane): systematic review of 8 RCTs found stretching before/after exercise does NOT reduce injury incidence or severity", false),
                ("Stretching prevents soreness", "Herbert & Gabriel 2002 (BMJ): stretching before and after exercise does not prevent delayed-onset muscle soreness", false),
                ("Pre-workout static stretch is good", "Simic 2013: isolated static stretch >45 s impairs strength −5.5%, explosive power −2.8% — use dynamic warm-up instead", false),
                ("Flexibility = tissue lengthening", "Chaouachi 2017: ROM gains from chronic stretching are primarily neurological (increased stretch tolerance), not muscle elongation", true),
            ]

            VStack(spacing: 8) {
                ForEach(myths, id: \.0) { belief, evidence, isTrue in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: isTrue ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundStyle(isTrue ? Color.green : Color.red)
                            .font(.caption)
                            .padding(.top, 1)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(belief).font(.caption.bold())
                            Text(evidence).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    if belief != "Flexibility = tissue lengthening" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Stretch Type Card

    private var stretchTypeCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Choosing the Right Stretch Method", systemImage: "arrow.left.and.right.circle")
                .font(.subheadline).bold()
                .foregroundStyle(.purple)
            Text("Freitas et al. 2018 (Int J Sports Phys Ther): different stretch methods have different optimal applications — timing and technique matter as much as duration.")
                .font(.caption).foregroundStyle(.secondary)

            let types: [(String, String, String, Color)] = [
                ("Dynamic",  "Pre-workout", "Controlled movement through full range. Preserves or improves acute performance. Replaces static stretch in warm-up. E.g., leg swings, arm circles.", .green),
                ("Static",   "Post-workout / standalone", "Hold 20–60+ s. Best for chronic ROM improvement. Avoid pre-strength workout. Most practical for solo practice.", .blue),
                ("PNF",      "Greatest acute ROM gain", "Contract-relax technique: hold → contract 6 s → relax → deepen 20% more. 20–30% greater acute ROM vs static (Freitas 2018). Requires band or partner.", .purple),
                ("Yin",      "Fascia & joint capsules", "Passive floor postures held 3–5 min. Targets connective tissue. Profound parasympathetic activation. Best evening practice.", .orange),
            ]

            VStack(spacing: 8) {
                ForEach(types, id: \.0) { name, timing, desc, color in
                    VStack(alignment: .leading, spacing: 3) {
                        HStack {
                            Text(name).font(.caption.bold()).foregroundStyle(color)
                            Spacer()
                            Text(timing).font(.caption2).foregroundStyle(.tertiary)
                        }
                        Text(desc).font(.caption2).foregroundStyle(.secondary)
                    }
                    if name != "Yin" { Divider() }
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
            Label("Flexibility Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("ROM gains from chronic stretching are primarily neurological — the nervous system raises its \"stretch pain threshold\" allowing greater range before protective reflexes activate. The muscles don't actually get permanently longer in adults.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Best evidence for flexibility training: Opplert 2018 — dynamic stretching pre-exercise preserves performance (replaces static warm-up). Post-exercise: static or PNF while tissue is warm maximizes sessions. Yin yoga (3–5 min holds) specifically loads joint capsules and superficial fascia — distinct from muscle-targeted approaches.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Clinical minimum: 60 s per muscle group per session, 3× weekly, for 4+ weeks to produce meaningful chronic ROM change. Below this threshold, sessions provide temporary range improvement only.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.purple.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.flexibility")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No flexibility sessions")
                .font(.headline)
            Text("Record flexibility and stretching workouts with your Apple Watch to see session history, weekly volume, and evidence-based stretching science here.")
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
                    $0.workoutActivityType == .flexibility
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [FlexSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return FlexSession(date: w.startDate, label: fmt.string(from: w.startDate),
                               duration: w.duration, kcal: kcal)
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

        let totalMin = sessions.map(\.durationMin).reduce(0, +)

        DispatchQueue.main.async {
            self.sessions      = sessions
            self.weekLoads     = weekLoads
            self.totalMinutes  = totalMin
            self.isLoading     = false
        }
    }
}
