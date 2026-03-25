import SwiftUI
import HealthKit
import Charts

// MARK: - GymnasticsView
// Analyzes gymnastics sessions: artistic, rhythmic, acrobatic, tumbling, and
// recreational gymnastics. Gymnastics uniquely demands maximum strength-to-weight
// ratio, flexibility, coordination, and spatial awareness.
//
// Science:
//   Arkaev & Suchilin 2004 (Biomechanics of Artistic Gymnastics): elite gymnastics
//     requires force production 3–5× bodyweight during landings; training develops
//     the highest relative strength of any sport (strength/weight basis).
//   Prassas et al. 2006 (Sports Biomech): gymnastics energy demands vary widely —
//     a 90-s floor routine is 80% anaerobic; vault (3–6 s) is 100% ATP-PCr;
//     bars and beam require sustained muscle effort lasting 60–90 s.
//   Caine et al. 2003 (Sports Med): gymnasts have 2–5× higher injury rates than
//     many other sports; wrist, ankle, and knee most common. Proper landing
//     mechanics reduce tibial stress up to 30%.
//   Naughton et al. 2000 (Sports Med): gymnastic training before puberty enhances
//     bone mineral density 10–30% above controls — childhood gymnastics is one
//     of the most bone-protective activities available.
//   Slater et al. 2007 (Int J Sport Nutr Exerc Metab): male artistic gymnasts
//     typical body composition: 6–8% fat, 70+ kg FFM; females: 12–15% fat.
//     Relative strength (pull-to-bodyweight): male gymnasts pull 130–160% BW.
//
// Gymnastics disciplines in Apple Health:
//   - Artistic gymnastics (floor, vault, bars, beam, rings)
//   - Rhythmic gymnastics (apparatus routines)
//   - Acrobatics / tumbling / trampoline
//   - Recreational gymnastics / gymnastics conditioning classes

struct GymnasticsView: View {

    // MARK: - Models

    struct GymnasticsSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 120 { return .competition }
            if durationMin >= 60  { return .fullTraining }
            if durationMin >= 30  { return .conditioning }
            return .skills
        }
    }

    enum SessionType: String, CaseIterable {
        case competition   = "Competition (120+ min)"
        case fullTraining  = "Full Training"
        case conditioning  = "Conditioning"
        case skills        = "Skills / Drills"

        var color: Color {
            switch self {
            case .competition:  return .red
            case .fullTraining: return .purple
            case .conditioning: return .orange
            case .skills:       return .blue
            }
        }

        var icon: String {
            switch self {
            case .competition:  return "trophy.fill"
            case .fullTraining: return "figure.gymnastics"
            case .conditioning: return "figure.strengthtraining.functional"
            case .skills:       return "sparkle"
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

    @State private var sessions: [GymnasticsSession] = []
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
                    ProgressView("Loading gymnastics data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    strengthCard
                    injuryPreventionCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Gymnastics")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let competitionSessions = sessions.filter { $0.sessionType == .competition }.count
        let totalKcal = sessions.map(\.kcal).reduce(0, +)

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(sessions.count)",
                    label: "Sessions",
                    sub: "past 12 months",
                    color: .purple
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(competitionSessions)",
                    label: "Competition",
                    sub: "days",
                    color: .red
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
                Image(systemName: "figure.gymnastics")
                    .foregroundStyle(.purple)
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
        if avgKcalPerMin > 8 { return "Competition-level intensity. Prassas 2006: floor routine (90 s) is 80% anaerobic — requires elite aerobic recovery between elements." }
        if avgKcalPerMin > 6 { return "High-intensity gymnastics training. Sustained muscle effort + explosive elements create unique mixed energy system demand." }
        if avgKcalPerMin > 4 { return "Moderate gymnastics work. Focus on skill quality, flexibility, and strength-to-weight ratio development (Arkaev & Suchilin 2004)." }
        return "Conditioning or beginner gymnastics. A great foundation — Naughton 2000: gymnastics is one of the most bone-protective childhood activities (10–30% higher BMD)."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Distribution", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Full training sessions include all apparatus work. Conditioning sessions target gymnastics-specific strength (muscle-ups, L-sits, handstands). Competition days are long and mentally demanding.")
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
            Text("Gymnastics training volume peaks pre-competition. Periodize: 3–4 weeks high volume + 1 deload week. Competition weeks often show high load from multi-event, multi-rotation format.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 1000 ? Color.purple.gradient : Color.purple.opacity(0.5).gradient)
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

    // MARK: - Strength Card

    private var strengthCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Gymnastics Strength Standards", systemImage: "figure.strengthtraining.functional")
                .font(.subheadline).bold()
                .foregroundStyle(.purple)
            Text("Gymnastics develops the highest relative strength of any sport (Arkaev & Suchilin 2004). Slater 2007: male artistic gymnasts pull 130–160% bodyweight. These standards give context to gymnastics-specific conditioning.")
                .font(.caption2).foregroundStyle(.secondary)

            let standards: [(String, String, String)] = [
                ("Pull-up", "Elite: 20+ reps", "Gymnasts average 25–30 strict pull-ups"),
                ("Ring support", "Elite: 60+ sec", "Straight-arm support, full shoulder depression"),
                ("L-sit", "Elite: 30+ sec", "Full hip flexion, legs parallel to floor"),
                ("Handstand", "Elite: 60+ sec", "Free-standing with tight body line"),
                ("Push-up", "Elite: 50+ reps", "Chest-to-floor, full ROM, no break"),
            ]

            VStack(spacing: 6) {
                ForEach(standards, id: \.0) { skill, standard, note in
                    HStack(alignment: .top) {
                        Text(skill).font(.caption2.bold()).foregroundStyle(.purple).frame(width: 80, alignment: .leading)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(standard).font(.caption2.bold())
                            Text(note).font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    if skill != "Push-up" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.purple.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Injury Prevention Card

    private var injuryPreventionCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Injury Prevention", systemImage: "cross.circle.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)
            Text("Caine et al. 2003 (Sports Med): gymnastics has 2–5× higher injury rates than many sports; wrist, ankle, knee most common. Proper landing mechanics reduce tibial stress up to 30%.")
                .font(.caption).foregroundStyle(.secondary)

            let tips: [(String, String, Bool)] = [
                ("Wrist conditioning", "Wrist circles, push-up progressions on fists before full load", true),
                ("Landing mechanics", "Knees over toes, soft landing (1.5–2.5 BW vs 3–5 BW impact)", true),
                ("Progressive loading", "New skills on foam pits/crash mats before hard floor", true),
                ("Rest days", "24–48h between high-skill sessions — CNS and connective tissue recovery", true),
                ("Training through pain", "Wrist/ankle pain ≠ normal training — rule out growth plate issues", false),
            ]

            VStack(spacing: 4) {
                ForEach(tips, id: \.0) { tip, detail, safe in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: safe ? "checkmark.circle" : "xmark.circle")
                            .foregroundStyle(safe ? .green : .red).frame(width: 16)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(tip).font(.caption2.bold())
                            Text(detail).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
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
            Label("Gymnastics Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Gymnastics demands uniquely develop the complete athletic profile: strength-to-weight ratio, flexibility, coordination, spatial awareness, and explosive power simultaneously. No other sport requires such diverse physical qualities at elite level.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Prassas et al. 2006 (Sports Biomech): vault (3–6 s) is 100% ATP-PCr; floor (90 s) is 80% anaerobic; bars/beam require sustained isometric + dynamic muscle effort. Naughton 2000: early gymnastics increases BMD 10–30% above controls — lifelong bone protection.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Arkaev & Suchilin 2004: elite gymnastics training 30–35 hrs/week at advanced levels; periodized with technical emphasis in pre-comp and fitness emphasis in off-season. Recovery: sleep 9–10 hrs/night recommended for growth and tissue repair.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.purple.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.gymnastics")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No gymnastics sessions")
                .font(.headline)
            Text("Record gymnastics workouts with your Apple Watch to see session analysis, strength standards, and injury prevention insights here.")
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
                    $0.workoutActivityType == .gymnastics
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [GymnasticsSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return GymnasticsSession(date: w.startDate, label: fmt.string(from: w.startDate),
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
