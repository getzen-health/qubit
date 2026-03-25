import SwiftUI
import HealthKit
import Charts

struct SoccerScienceView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklySoccerData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0

    struct WeeklySoccerData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("Soccer Science", systemImage: "soccerball")
                        .font(.title2).bold()
                    Text("Positional GPS demands, sprint science & the world game's physiology")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Soccer Sessions",
                        systemImage: "soccerball",
                        description: Text("Record soccer sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    gpsDemandsCard
                    positionalProfilesCard
                    injuryScienceCard
                    headingNeuroscienceCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Soccer Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "soccerball", color: .green)
            statCard(value: formatDuration(avgDuration), label: "Avg Duration", icon: "clock", color: .blue)
            statCard(value: "\(Int(avgCalories))", label: "Avg kcal", icon: "flame.fill", color: .orange)
        }
        .padding(.horizontal)
    }

    private func statCard(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.title3).foregroundStyle(color)
            Text(value).font(.title3).bold()
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Session Type Breakdown

    private var sessionTypeBreakdown: some View {
        let fullGame = sessions.filter { $0.duration >= 5400 }
        let training = sessions.filter { $0.duration >= 3600 && $0.duration < 5400 }
        let smallSided = sessions.filter { $0.duration >= 1800 && $0.duration < 3600 }
        let technical = sessions.filter { $0.duration < 1800 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types").font(.headline).padding(.horizontal)
            VStack(spacing: 8) {
                sessionRow(label: "Full Match (11v11)", count: fullGame.count, color: .green,
                    desc: "90min+ – full game with warm-up and post-match")
                sessionRow(label: "Team Training", count: training.count, color: .blue,
                    desc: "60–90 min – tactical, technical & fitness")
                sessionRow(label: "Small-Sided Game", count: smallSided.count, color: .teal,
                    desc: "30–60 min – 5v5 to 7v7 high-intensity")
                sessionRow(label: "Technical / Futsal", count: technical.count, color: .yellow,
                    desc: "<30 min – passing drills, individual skills")
            }
            .padding(.horizontal)
        }
    }

    private func sessionRow(label: String, count: Int, color: Color, desc: String) -> some View {
        HStack {
            Circle().fill(color).frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.subheadline).fontWeight(.medium)
                Text(desc).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(count)").font(.headline).foregroundStyle(color)
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weekly Calories").font(.headline).padding(.horizontal)
            if weeklyData.isEmpty {
                Text("Not enough data").font(.caption).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity).padding()
            } else {
                Chart(weeklyData) { item in
                    BarMark(x: .value("Week", item.week), y: .value("kcal", item.calories))
                        .foregroundStyle(Color.green.gradient).cornerRadius(4)
                }
                .frame(height: 160).padding(.horizontal)
                .chartYAxis { AxisMarks(position: .leading) }
                .chartXAxis { AxisMarks { _ in AxisValueLabel().font(.caption2) } }
            }
        }
    }

    // MARK: - GPS Demands Card

    private var gpsDemandsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Game GPS Demands", systemImage: "figure.run.circle.fill")
                .font(.headline).foregroundStyle(.green)

            Text("GPS technology has transformed soccer science — elite players are now tracked to a granularity of 10 Hz, revealing the true physical demands of 'the beautiful game.'")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run", title: "Total Running Distance",
                    detail: "Bradley 2009 (J Sport Sci): elite players cover 10–13 km/match; midfielders 11–13 km; central defenders 9–10 km; variability between players = ±15%; wide players cover more distance but at lower intensity than central midfielders",
                    color: .green)
                sciRow(icon: "bolt.fill", title: "Sprint Frequency",
                    detail: "Bradley 2009: elite players perform 30–60 sprints per game, averaging 1 sprint every 60–90 s; sprint distance 10–40 m; 65% of sprints are without the ball; sprint output declines 10–15% in second half — physical or tactical?",
                    color: .yellow)
                sciRow(icon: "heart.fill", title: "High-Intensity Running",
                    detail: "Stolen 2005: 8–12% of total distance at high intensity (>19.8 km/h); 1.5–3.0 km at high intensity per match; elite Premier League vs. Championship: EPL players cover 15% more high-intensity distance; sprinting speed correlates with team success",
                    color: .red)
                sciRow(icon: "clock.fill", title: "Recovery Between Sprints",
                    detail: "Carling 2010: mean recovery between sprint efforts = 72 s; 65% of recovery periods are standing or walking; cardiac output remains elevated throughout; 90-min match ACWR load = 10 AU on RPE scale; schedule congestion reduces sprint output 12%",
                    color: .orange)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Positional Profiles Card

    private var positionalProfilesCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Positional Profiles", systemImage: "person.3.fill")
                .font(.headline).foregroundStyle(.blue)

            Text("Modern soccer has moved to position-specific conditioning — what a goalkeeper needs is fundamentally different from a central midfielder.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run.circle", title: "Central Midfielders (Highest Demand)",
                    detail: "Di Salvo 2007: box-to-box midfielders cover 12.8 km/game — highest of any position; 35–40% at high intensity; required: VO₂max 58–68 mL/kg/min; aerobic base + repeated sprint ability; physical decline begins minute 70–75 without substitution",
                    color: .blue)
                sciRow(icon: "figure.stand", title: "Forwards / Strikers",
                    detail: "Di Salvo 2007: strikers cover 10–11 km but include 3.5–4.5 km at high intensity — highest HSR ratio; most explosive position: 6–9 individual sprints >25 km/h per match; strength power for aerial duels → heading height correlates with jump training",
                    color: .orange)
                sciRow(icon: "figure.arms.open", title: "Center Backs",
                    detail: "Lowest total distance (9–10.5 km) but highest collision load; peak accelerations (>3 m/s²) in defensive 1v1 situations; anticipatory positioning reduces physical demands; minimal requirement: VO₂max 52–58 mL/kg/min, with elite strength for aerial duels",
                    color: .green)
                sciRow(icon: "goalpost.fill", title: "Goalkeepers",
                    detail: "Lowest aerobic demand: 5–6 km/match (most walking/standing); but highest reaction speed requirement: elite GK reacts to penalty in 0.3 s while ball flight time is 0.4–0.7 s; GK dive covers 1.5–2 m range; reflex training is the primary conditioning focus",
                    color: .purple)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Injury Science Card

    private var injuryScienceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Injury Prevention Science", systemImage: "bandage.fill")
                .font(.headline).foregroundStyle(.red)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run", title: "Hamstring Strain (Most Common)",
                    detail: "Ekstrand 2011 (Eur J Sport Sci): hamstrings = 37% of all muscle injuries in elite soccer; 1 strain per team per 10 matches; recurrence rate 14–17% without prevention training; FIFA 11+ warm-up: Silvers 2017: reduces hamstring injury 45%; Nordic curl 3×week reduces by 65%",
                    color: .red)
                sciRow(icon: "figure.stand", title: "ACL — Season Ending",
                    detail: "Waldén 2011: 0.08 ACL tears per 1,000 training hours in women's soccer — 3× the men's rate; non-contact planting mechanism (deceleration + cutting); FIFA 11+ reduces ACL injuries 50% in female players; female hormonal cycle affects ligament laxity",
                    color: .orange)
                sciRow(icon: "figure.walk", title: "Ankle Sprains",
                    detail: "Ankle injuries = 25% of soccer injuries; 77% are lateral sprains; instability from prior ankle sprain is the strongest predictor; prophylactic ankle tape/brace reduces re-sprain 50%; proprioception training (wobble board) reduces sprain incidence 35%",
                    color: .yellow)
                sciRow(icon: "figure.fall", title: "Concussion in Soccer",
                    detail: "Herring 2011: heading motion generates 14–17 g head acceleration (below concussion threshold at single exposure, but cumulative); FIFA rules: heading limit training 10 headers/session for youth; goalpost collision = highest single-event concussion risk in soccer",
                    color: .blue)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Heading Neuroscience Card

    private var headingNeuroscienceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Heading & Brain Health", systemImage: "brain.head.profile")
                .font(.headline).foregroundStyle(.purple)

            Text("The emerging science of heading in soccer is one of sport medicine's most important ongoing debates.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "brain", title: "Cumulative Heading Impact",
                    detail: "Koerte 2012 (Radiology): professional soccer players with >1,000 headers/year show diffusion tensor MRI white matter changes similar to mild TBI; Lipton 2013: heading >1,000/year associated with impaired memory and psychomotor speed",
                    color: .purple)
                sciRow(icon: "figure.stand.line.dotted.figure.stand", title: "Safe Heading Guidelines",
                    detail: "US Soccer Federation 2016: heading banned under age 10; limited to 30 min/week ages 11–13; FA (England) 2021: adults limit heading training to <10 per session; PowerHead protective headband reduces impact forces 30–50% but no RCT evidence for brain protection",
                    color: .blue)
                sciRow(icon: "chart.line.downtrend.xyaxis", title: "Positional Exposure Differences",
                    detail: "Franke 2023: central defenders perform 2–3× more headers than forwards; defensive headers often at higher speed (ball arriving from clearance at 40–50 km/h) vs. offensive headers (crosses at 25–35 km/h); header biomechanics training (tensing neck) reduces linear acceleration 20%",
                    color: .red)
                sciRow(icon: "checkmark.shield.fill", title: "Protective Neck Strengthening",
                    detail: "Mansell 2005: neck muscle activation before heading contact reduces head acceleration by 20–30%; strong neck muscles (>200 N extension strength) act as shock absorbers; 3× weekly neck strengthening recommended by neurology expert groups for soccer players",
                    color: .green)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Recent Sessions

    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Sessions").font(.headline).padding(.horizontal)
            ForEach(Array(sessions.prefix(5)), id: \.uuid) { session in
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(session.startDate, style: .date).font(.subheadline).fontWeight(.medium)
                        Text(sessionType(session)).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 3) {
                        Text(formatDuration(session.duration)).font(.subheadline)
                            .fontWeight(.medium).foregroundStyle(.green)
                        if let kcal = session.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                            Text("\(Int(kcal)) kcal").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(12)
                .background(Color(uiColor: .secondarySystemBackground))
                .cornerRadius(10)
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Helpers

    private func sciRow(icon: String, title: String, detail: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).font(.subheadline).foregroundStyle(color).frame(width: 22)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.subheadline).fontWeight(.semibold)
                Text(detail).font(.caption).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func sessionType(_ session: HKWorkout) -> String {
        switch session.duration {
        case 5400...: return "Full Match (11v11)"
        case 3600..<5400: return "Team Training"
        case 1800..<3600: return "Small-Sided Game"
        default: return "Technical / Futsal"
        }
    }

    private func formatDuration(_ seconds: Double) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        if h > 0 { return "\(h)h \(m)m" }
        return "\(m)m"
    }

    // MARK: - Data Loading

    @MainActor
    func loadData() async {
        let store = HKHealthStore()
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }
        let predicate = HKQuery.predicateForWorkouts(with: .soccer)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let fetched: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: workoutType, predicate: predicate,
                limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }
        let sorted = fetched.sorted { $0.startDate > $1.startDate }
        self.sessions = sorted
        self.totalSessions = sorted.count
        if !sorted.isEmpty {
            self.avgDuration = sorted.map(\.duration).reduce(0, +) / Double(sorted.count)
            let cals = sorted.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }
            self.avgCalories = cals.isEmpty ? 0 : cals.reduce(0, +) / Double(cals.count)
        }
        var weekData: [WeeklySoccerData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklySoccerData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        isLoading = false
    }
}
