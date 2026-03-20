import SwiftUI
import HealthKit
import Charts

// MARK: - TaiChiView
// Analyzes tai chi sessions: Yang style, Chen style, 24-form, sword, push hands.
// Tai chi is a moving meditation with profound evidence for balance, blood pressure,
// neurological function, and bone health — particularly for older adults.
//
// Science:
//   Wolf et al. 1996 (J Am Geriatr Soc): 15-week Tai Chi program reduced fall risk
//     by 47.5% in community-dwelling elderly — the largest fall prevention effect
//     ever recorded from a single intervention at that time.
//   Yeh et al. 2011 (Arch Intern Med): 12-week Tai Chi reduced systolic BP by 15.6 mmHg
//     and diastolic BP by 8.8 mmHg in chronic heart failure patients — comparable
//     to first-line antihypertensive medications.
//   Li et al. 2012 (N Engl J Med): Tai Chi vs stretching vs resistance training
//     for Parkinson's disease — Tai Chi produced the greatest improvement in balance,
//     functional reach, and stride length; 67% fewer falls vs stretching group.
//   Lan et al. 1998 (J Am Geriatr Soc): 12 months Tai Chi in 64–70 year olds
//     attenuated VO₂max decline (only 3.5% vs 8.5% in sedentary controls); improved
//     balance significantly better than sedentary controls.
//   Song et al. 2003 (J Rheumatol): 12-week Tai Chi in knee osteoarthritis patients
//     reduced pain 22%, improved balance 18%, and reduced fear of falling 35%.
//   Irwin et al. 2003 (Ann Intern Med): 16-week Tai Chi program in adults ≥60 boosted
//     varicella-zoster immunity 40% — comparable to the chickenpox vaccine booster effect.
//
// Tai chi movement characteristics:
//   Continuous, flowing, low-impact movement with deep breathing integration.
//   Weight shifts: 70/30 to 100/0 between legs — extreme single-leg balance demand.
//   Speed: 10–20× slower than combat application — proprioceptive challenge is maximal.
//   Chen style: includes explosive fajin bursts; Yang style: purely continuous.

struct TaiChiView: View {

    // MARK: - Models

    struct TaiChiSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 60 { return .fullForm }
            if durationMin >= 35 { return .practice }
            if durationMin >= 20 { return .shortForm }
            return .qigong }
    }

    enum SessionType: String, CaseIterable {
        case fullForm  = "Full Form Practice"
        case practice  = "Extended Practice"
        case shortForm = "Short Form / 24-Step"
        case qigong    = "Qigong / Standing"

        var color: Color {
            switch self {
            case .fullForm:  return .indigo
            case .practice:  return .blue
            case .shortForm: return .teal
            case .qigong:    return .green
            }
        }

        var icon: String {
            switch self {
            case .fullForm:  return "figure.mind.and.body"
            case .practice:  return "figure.taichi"
            case .shortForm: return "figure.taichi"
            case .qigong:    return "wind"
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

    @State private var sessions: [TaiChiSession] = []
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
                    ProgressView("Loading tai chi data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    balanceScienceCard
                    cardiovascularCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Tai Chi")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let totalMin = sessions.map(\.durationMin).reduce(0, +)

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .indigo)
                Divider().frame(height: 44)
                statBox(value: totalMin > 0 ? String(format: "%.0f", totalMin / 60) : "0",
                        label: "Hours", sub: "total practice", color: .blue)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: .teal
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.taichi")
                    .foregroundStyle(.indigo)
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
        if avgKcalPerMin > 4  { return "Active Chen style" }
        if avgKcalPerMin > 2.5 { return "Yang / long form" }
        if avgKcalPerMin > 1.5 { return "Short form / 24-step" }
        return "Qigong / standing"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 3 {
            return "Active practice intensity. Chen style includes explosive fajin bursts; deeper stances increase leg load. Lan 1998: 12 months Tai Chi attenuated VO₂max decline to only 3.5% vs 8.5% in sedentary controls."
        }
        if avgKcalPerMin > 1.5 {
            return "Moderate practice intensity. Wolf 1996 (JAGS): 15 weeks Tai Chi reduced fall risk 47.5% — the largest single-intervention fall prevention effect recorded at the time."
        }
        return "Gentle qigong or standing practice. Even low-intensity Tai Chi significantly improves proprioception, postural stability, and parasympathetic activation (lower resting HR and improved HRV)."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Practice Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Full form practice (60+ min) provides the deepest training stimulus. The 24-step simplified Yang form (created 1956) is the world's most practiced form — 10–15 min to complete. Qigong standing postures develop root strength and breath awareness.")
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
            Label("Weekly Volume (kcal)", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Tai chi benefits are dose-dependent: Song 2003 found 12 weeks needed for pain and balance improvements; Li 2012 found maximum benefit at 6 months. Daily 20–60 min practice is traditional and evidence-supported. Consistency > intensity.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.sessions >= 4 ? Color.indigo.gradient : Color.teal.opacity(0.7).gradient)
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

    // MARK: - Balance Science Card

    private var balanceScienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Balance & Neurological Benefits", systemImage: "figure.taichi")
                .font(.subheadline).bold()
                .foregroundStyle(.indigo)
            Text("Li et al. 2012 (N Engl J Med): Tai Chi was superior to stretching AND resistance training for Parkinson's disease balance improvement — 67% fewer falls than stretching group. The slow, controlled weight shifts create an extreme proprioceptive training stimulus.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Fall prevention",    "Wolf 1996: 47.5% fall risk reduction in 15 weeks — largest single-intervention effect", .indigo),
                ("Parkinson's",        "Li 2012 (NEJM): superior to stretching + resistance for balance; 67% fewer falls", .blue),
                ("Weight shift",       "70/30 to 100/0 between legs — extreme single-leg proprioceptive demand at slow speed", .teal),
                ("Knee OA",            "Song 2003: 12 weeks → pain −22%, balance +18%, fear of falling −35%", .green),
                ("Aging deceleration", "Lan 1998: VO₂max decline only 3.5%/year vs 8.5% sedentary in adults 64–70", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 110, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Aging deceleration" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.indigo.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Cardiovascular Card

    private var cardiovascularCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Cardiovascular & Immune Effects", systemImage: "heart.text.square")
                .font(.subheadline).bold()
                .foregroundStyle(.teal)
            Text("Yeh et al. 2011 (Arch Intern Med): 12-week Tai Chi reduced systolic BP by 15.6 mmHg and diastolic by 8.8 mmHg in heart failure patients — comparable to first-line antihypertensive medications with no side effects.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Blood pressure",  "Yeh 2011: −15.6/−8.8 mmHg SBP/DBP in heart failure patients (Arch Intern Med)", .red),
                ("Immune function", "Irwin 2003: 16-week Tai Chi boosted varicella-zoster immunity 40% in adults ≥60", .green),
                ("HRV",            "Slow diaphragmatic breathing + movement increases parasympathetic tone and HRV", .blue),
                ("Cortisol",       "Regular practice associated with lower resting cortisol; stress buffering effect", .orange),
                ("Sleep quality",  "Multiple RCTs show improved PSQI sleep quality score after 12+ week programs", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 100, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Sleep quality" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.teal.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Tai Chi Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("With 200+ million practitioners globally, tai chi is the world's most widely practiced mind-body exercise. Despite its gentle appearance, the evidence base rivals conventional medicine for balance, blood pressure, and neurological function.")
                .font(.caption).foregroundStyle(.secondary)
            Text("The mechanism of tai chi's balance benefit is the extreme proprioceptive challenge: single-leg weight shifts at 10–20× slower than combat speed maximally engage the vestibular-somatosensory integration pathways. At slow speeds, the central nervous system cannot rely on momentum — every degree of sway must be actively corrected.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Practice recommendation: daily 20–45 min at any intensity produces measurable balance improvements in 4–6 weeks. The 24-step Yang form (8–12 min) is ideal as a minimum effective dose. Adding morning qigong standing builds root strength for deeper stances.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.indigo.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.taichi")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No tai chi sessions")
                .font(.headline)
            Text("Record tai chi practice with your Apple Watch to see session history, weekly volume, and evidence-based benefits here.")
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
                    $0.workoutActivityType == .taiChi
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [TaiChiSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return TaiChiSession(date: w.startDate, label: fmt.string(from: w.startDate),
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
