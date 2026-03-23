import SwiftUI
import HealthKit
import Charts

// MARK: - FencingView
// Analyzes fencing sessions recorded via Apple Watch.
// Fencing (épée, foil, sabre) is a unique combat sport combining explosive
// anaerobic bursts with prolonged tactical competition.
//
// Science:
//   Turner et al. 2014 (J Strength Cond Res): elite fencers perform 30–50
//     explosive actions per bout, each lasting 1–5 seconds; HR averages
//     80–85% HRmax during competition with peaks >90% HRmax during actions.
//     Total bout time: 3 min with 1-min rest between sets.
//   Roi & Bianchedi 2008 (Sports Med): fencing requires maximal explosive force
//     in the lunge (0.5–1.5 s), with ground reaction forces up to 2× bodyweight;
//     the en garde position requires sustained isometric quad contraction.
//   Bottoms et al. 2011 (J Sci Med Sport): sabre fencing energy demands are
//     predominantly anaerobic during actions (ATP-PCr + glycolytic); aerobic
//     system is critical for recovery between bouts and across tournament day.
//   Iglesias et al. 2010 (Eur J Appl Physiol): elite fencers average
//     VO₂max 55–65 ml/kg/min (comparable to middle-distance runners);
//     lower extremity power (countermovement jump) strongly predicts lunge speed.
//   Bompa & Haff 2009 (Periodization): combat sports periodize in
//     3-month macrocycles: GPP (strength base) → SPP (sport-specific) →
//     competition (technical sharpening + taper).
//
// Weapon disciplines and their demands:
//   Foil: Only torso target, right-of-way rules, highest technical complexity
//   Épée: Full-body target, no right-of-way, most physically demanding (any touch scores)
//   Sabre: Upper body target + right-of-way, fastest weapon, most explosive

struct FencingView: View {

    // MARK: - Models

    struct FencingSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 90 { return .tournament }
            if durationMin >= 45 { return .sparring }
            if durationMin >= 20 { return .drilling }
            return .conditioning }
    }

    enum SessionType: String, CaseIterable {
        case tournament    = "Tournament (90+ min)"
        case sparring      = "Sparring / Bouts"
        case drilling      = "Technical Drilling"
        case conditioning  = "Conditioning"

        var color: Color {
            switch self {
            case .tournament:   return .red
            case .sparring:     return .orange
            case .drilling:     return .blue
            case .conditioning: return .green
            }
        }

        var icon: String {
            switch self {
            case .tournament:   return "trophy.fill"
            case .sparring:     return "figure.fencing"
            case .drilling:     return "target"
            case .conditioning: return "figure.run"
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

    @State private var sessions: [FencingSession] = []
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
                    ProgressView("Loading fencing data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    weaponDemandCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Fencing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let tournaments = sessions.filter { $0.sessionType == .tournament }.count
        _ = sessions.map(\.kcal).reduce(0, +)

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
                    value: "\(tournaments)",
                    label: "Tournaments",
                    sub: "competition days",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 8 ? .red : .orange
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.fencing")
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
        if avgKcalPerMin > 10 { return "Tournament intensity" }
        if avgKcalPerMin > 7  { return "High intensity" }
        if avgKcalPerMin > 5  { return "Moderate-high" }
        return "Technical work"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 8 { return "Elite-level demands. Turner 2014: fencers average 80–85% HRmax during competition, peaking >90% during explosive actions." }
        if avgKcalPerMin > 5 { return "Competitive sparring load. Bottoms 2011: fencing primarily anaerobic during actions; aerobic system drives between-bout recovery." }
        return "Technical training focus. Roi & Bianchedi 2008: the en garde position demands sustained isometric quad contraction — add plyometric conditioning for lunge power."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Distribution", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Tournament days involve 6–12+ bouts across multiple weapons/pools. Sparring sessions build fight-specific conditioning. Drilling develops muscle memory for the 8 core fencing actions.")
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
            Text("Fencing competition season typically peaks Oct–Apr. Bompa 2009: 3-month macrocycle — base strength → sport-specific → competition taper. High tournament weeks alternate with recovery/drilling weeks.")
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

    // MARK: - Weapon Demand Card

    private var weaponDemandCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Three Weapons — Three Physiological Profiles", systemImage: "bolt.circle.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.red)

            let weapons: [(String, String, String, Color)] = [
                ("Épée", "Most physical", "Full-body target · no right-of-way · any touch scores", .blue),
                ("Sabre", "Most explosive", "Upper-body target · right-of-way · fastest weapon", .red),
                ("Foil", "Most technical", "Torso target · right-of-way · highest complexity", .orange),
            ]

            VStack(spacing: 8) {
                ForEach(weapons, id: \.0) { weapon, demand, desc, color in
                    HStack(alignment: .top, spacing: 8) {
                        VStack(alignment: .center, spacing: 2) {
                            Text(weapon).font(.caption.bold()).foregroundStyle(color)
                            Text(demand).font(.caption2).foregroundStyle(color.opacity(0.8))
                        }
                        .frame(width: 80)
                        Text(desc).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if weapon != "Foil" { Divider() }
                }
            }

            Text("Roi & Bianchedi 2008: lunge generates 2× bodyweight ground reaction forces in 0.5–1.5 s. Iglesias 2010: elite fencers VO₂max 55–65 ml/kg/min; countermovement jump height strongly predicts lunge speed.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.red.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Fencing Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Fencing occupies a unique physiological niche — short explosive actions (1–5 s) at maximal intensity demand ATP-PCr and glycolytic systems, while sustained tournaments across a competition day demand elite aerobic capacity for recovery.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Turner et al. 2014 (J Strength Cond Res): 30–50 explosive actions per bout; HR averages 80–85% HRmax, peaks >90% during actions. 3-min bout + 1-min rest format. Bottoms et al. 2011: sabre fencing energetics predominantly anaerobic during actions; aerobic base critical for recovery.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Bompa & Haff 2009: combat sport periodization — 3-month macrocycles. Training for fencing: plyometrics + sprint for explosive power, Zone 2 aerobic base for tournament recovery, technical drilling for motor programs.")
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
            Image(systemName: "figure.fencing")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No fencing sessions")
                .font(.headline)
            Text("Record fencing workouts with your Apple Watch to see bout load analysis, tournament tracking, and explosive power science here.")
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
                    $0.workoutActivityType == .fencing
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [FencingSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return FencingSession(date: w.startDate, label: fmt.string(from: w.startDate),
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
