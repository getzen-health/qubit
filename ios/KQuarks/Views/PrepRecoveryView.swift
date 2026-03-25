import SwiftUI
import HealthKit
import Charts

// MARK: - PrepRecoveryView
// Analyzes preparation and recovery sessions: warm-ups, cool-downs, active recovery, mobility work.
// Proper preparation amplifies training performance; strategic recovery determines adaptation.
// This is one of the most evidence-rich and practically impactful areas of sports science.
//
// Science:
//   Fradkin et al. 2010 (J Sci Med Sport): systematic review of 32 studies — warm-up
//     improved performance in 79% of studies; average performance improvement 4.7%.
//     The evidence for warm-up benefit is among the strongest in applied sports science.
//   Bishop 2003 (Sports Med): warm-up mechanisms — each +1°C in muscle temperature
//     raises metabolic rate 13%; nerve conduction velocity improves 2–3 m/s per °C;
//     hemoglobin releases O₂ more readily (Bohr effect); joint viscosity decreases.
//   McGowan et al. 2015 (Sports Med): post-activation potentiation (PAP) — heavy
//     explosive exercises during warm-up enhance subsequent power output by 5–12%;
//     optimal PAP window is 4–12 min after the potentiating exercise.
//   Dupuy et al. 2018 (Front Physiol): meta-analysis of 99 recovery interventions —
//     active recovery, massage, compression, and cold water immersion each reduce
//     DOMS and perceived fatigue with different optimal applications and time courses.
//   Peake et al. 2017 (Nat Rev Physiol): cold water immersion reduces acute inflammation
//     and DOMS but blunts long-term strength and hypertrophy adaptations — avoid
//     after strength/hypertrophy sessions; appropriate for competition periods.
//   Cook et al. 2019 (IJSPP): passive heat (sauna, hot bath) post-exercise accelerates
//     glycogen resynthesis and plasma volume expansion — cardiovascular adaptations
//     comparable to moderate-intensity endurance training.
//
// Session types logged as preparationAndRecovery:
//   Pre-session warm-ups, post-session cool-downs, active recovery rides/walks,
//   recovery-focused mobility or foam rolling sessions, sauna/ice bath logging.

struct PrepRecoveryView: View {

    // MARK: - Models

    struct PrepSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 30 { return .activeRecovery }
            if durationMin >= 15 { return .warmupCooldown }
            if durationMin >= 8  { return .mobilityWork }
            return .quickPrep
        }
    }

    enum SessionType: String, CaseIterable {
        case activeRecovery  = "Active Recovery (30+ min)"
        case warmupCooldown  = "Warm-Up / Cool-Down (15–30 min)"
        case mobilityWork    = "Mobility / Foam Rolling (8–15 min)"
        case quickPrep       = "Quick Prep (<8 min)"

        var color: Color {
            switch self {
            case .activeRecovery: return .green
            case .warmupCooldown: return .blue
            case .mobilityWork:   return .orange
            case .quickPrep:      return .teal
            }
        }

        var icon: String {
            switch self {
            case .activeRecovery: return "figure.walk"
            case .warmupCooldown: return "flame"
            case .mobilityWork:   return "figure.flexibility"
            case .quickPrep:      return "bolt.fill"
            }
        }
    }

    struct WeekLoad: Identifiable {
        let id = UUID()
        let label: String
        let date: Date
        let sessions: Int
        let totalMin: Double
    }

    // MARK: - State

    @State private var sessions: [PrepSession] = []
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
                    ProgressView("Loading prep & recovery data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyChart
                    recentSessionsCard
                    warmupScienceCard
                    recoveryModalitiesCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Prep & Recovery")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let avgMin = sessions.isEmpty ? 0.0 : totalMinutes / Double(sessions.count)

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .green)
                Divider().frame(height: 44)
                statBox(value: String(format: "%.0f", totalMinutes / 60), label: "Hours",
                        sub: "total prep/recovery", color: .blue)
                Divider().frame(height: 44)
                statBox(value: String(format: "%.0f", avgMin), label: "min/session",
                        sub: sessionQualityLabel(avgMin), color: .orange)
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "arrow.clockwise.heart")
                    .foregroundStyle(.green)
                Text(recoveryContext)
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

    private func sessionQualityLabel(_ avg: Double) -> String {
        if avg >= 25 { return "Full recovery protocol" }
        if avg >= 15 { return "Quality warm-up" }
        if avg >= 8  { return "Standard prep" }
        return "Quick mobilization"
    }

    private var recoveryContext: String {
        let sessionsPerWeek = Double(sessions.count) / 52.0
        if sessionsPerWeek >= 5 {
            return "Excellent recovery discipline. Athletes who consistently log prep/recovery sessions show lower injury rates and better adaptation — the training stimulus is only half the equation."
        }
        if sessionsPerWeek >= 2 {
            return "Good recovery integration. Fradkin 2010: warm-up improved performance in 79% of studies — average +4.7%. These sessions directly amplify the value of every workout they precede."
        }
        return "Building recovery habits. The recovery session is when adaptation happens — the workout is just the signal; sleep and active recovery are where the response occurs."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Active recovery (easy movement at 50–60% HRmax) is the most evidence-supported recovery modality for reducing DOMS. Standard warm-up/cool-down sessions bookend training. Mobility and foam rolling address tissue quality. Quick prep sessions fire the nervous system before explosive work.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct   = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue)
                        .font(.caption2).frame(width: 175, alignment: .leading)
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

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Sessions", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Recovery frequency mirrors training quality. Elite athletes typically spend 1 preparation/recovery session for every 1–2 training sessions. Gaps in prep/recovery volume often precede injury or performance decline.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("Sessions", w.sessions)
                )
                .foregroundStyle(w.sessions >= 3 ? Color.green.gradient : Color.teal.opacity(0.6).gradient)
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

    // MARK: - Warm-Up Science Card

    private var warmupScienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Warm-Up: The Performance Amplifier", systemImage: "thermometer.sun.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)
            Text("Bishop 2003 (Sports Med): each +1°C in muscle temperature raises metabolic rate 13%, improves nerve conduction velocity 2–3 m/s, and shifts the oxygen-hemoglobin dissociation curve (Bohr effect) — more O₂ delivered per heartbeat. Fradkin 2010: +4.7% average performance improvement.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Temperature",  "+1°C muscle temp = +13% metabolic rate; enzyme kinetics double per +10°C (Q₁₀ effect)", .orange),
                ("Neural",       "Nerve conduction velocity improves 2–3 m/s/°C — faster reaction times, smoother contractions", .blue),
                ("O₂ delivery",  "Bohr effect: warm blood releases O₂ more readily at working muscles", .red),
                ("Viscosity",    "Joint and muscle viscosity decreases — reduced mechanical resistance to movement", .green),
                ("PAP",          "McGowan 2015: heavy warm-up exercise creates post-activation potentiation — +5–12% power for 4–12 min after", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 80, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "PAP" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recovery Modalities Card

    private var recoveryModalitiesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Recovery Modalities: What Works (and When)", systemImage: "snowflake")
                .font(.subheadline).bold()
                .foregroundStyle(.blue)
            Text("Dupuy et al. 2018 (Front Physiol): meta-analysis of 99 interventions. Different modalities have different optimal timing and application — matching modality to goal is key.")
                .font(.caption).foregroundStyle(.secondary)

            let modalities: [(String, String, String, Color)] = [
                ("Active Recovery", "Best for DOMS + next-day readiness", "Easy movement 50–60% HRmax; accelerates lactate clearance, maintains blood flow, reduces perceived fatigue — the gold standard between training days", .green),
                ("Cold Water", "Competition blocks — use carefully", "Peake 2017 (Nat Rev Physiol): reduces DOMS/inflammation but BLUNTS long-term strength and hypertrophy adaptations — avoid after strength sessions; reserve for multi-day competition", .blue),
                ("Heat / Sauna", "Aerobic adaptations + glycogen", "Cook 2019 (IJSPP): post-exercise heat accelerates glycogen resynthesis, expands plasma volume — cardiovascular adaptations comparable to moderate endurance training", .red),
                ("Compression", "Travel + long recovery windows", "Reduces perceived soreness, improves venous return — modest effect size but convenient for passive recovery periods (flights, sleep)", .purple),
            ]

            VStack(spacing: 8) {
                ForEach(modalities, id: \.0) { name, when, desc, color in
                    VStack(alignment: .leading, spacing: 3) {
                        HStack {
                            Text(name).font(.caption.bold()).foregroundStyle(color)
                            Spacer()
                            Text(when).font(.caption2).foregroundStyle(.tertiary)
                        }
                        Text(desc).font(.caption2).foregroundStyle(.secondary)
                    }
                    if name != "Compression" { Divider() }
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
            Label("The Science of Preparation", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Recovery is when adaptation occurs — the training session is just the stimulus. Athletes who systematically invest in preparation and recovery demonstrate: lower injury incidence, better session-to-session performance, and superior long-term adaptation rates.")
                .font(.caption).foregroundStyle(.secondary)
            Text("McGowan 2015: post-activation potentiation (PAP) — performing a heavy strength exercise 4–12 min before explosive work (sprints, jumps) amplifies power output 5–12%. The loaded warm-up primes motor units beyond baseline activation. This is why elite sprinters perform resisted sprints or heavy squats before competition warm-up.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Optimal prep protocol: 5–10 min aerobic elevation → sport-specific dynamic movement → PAP exercise (if power/speed follows) → 4–8 min reset → main training. Cool-down: 10 min easy movement + static stretch of worked muscles.")
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
            Image(systemName: "arrow.clockwise.heart")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No prep & recovery sessions")
                .font(.headline)
            Text("Record warm-up and cool-down workouts with your Apple Watch to see recovery frequency, session breakdown, and performance science here.")
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
                    $0.workoutActivityType == .preparationAndRecovery
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [PrepSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return PrepSession(date: w.startDate, label: fmt.string(from: w.startDate),
                               duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (sessions: Int, totalMin: Double)] = [:]
        for s in sessions {
            guard let ws = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)) else { continue }
            let cur = weekMap[ws] ?? (0, 0)
            weekMap[ws] = (cur.sessions + 1, cur.totalMin + s.durationMin)
        }
        var wCursor = calendar.date(byAdding: .month, value: -3, to: end) ?? Date()
        wCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: wCursor)) ?? wCursor
        var weekLoads: [WeekLoad] = []
        while wCursor <= end {
            let d = weekMap[wCursor] ?? (0, 0)
            weekLoads.append(WeekLoad(label: weekFmt.string(from: wCursor), date: wCursor,
                                      sessions: d.sessions, totalMin: d.totalMin))
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
