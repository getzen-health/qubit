import SwiftUI
import HealthKit
import Charts

struct AustralianFootballView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklyAFLData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0

    struct WeeklyAFLData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("Australian Football", systemImage: "soccerball.inverse")
                        .font(.title2).bold()
                    Text("AFL positional demands, kicking biomechanics & elite fitness science")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Australian Football Sessions",
                        systemImage: "soccerball.inverse",
                        description: Text("Record AFL sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    fitnessDemandsCard
                    kickingBiomechanicsCard
                    injuryScienceCard
                    positionalProfilesCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Australian Football")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "soccerball.inverse", color: .red)
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
        let halfGame = sessions.filter { $0.duration >= 3600 && $0.duration < 5400 }
        let training = sessions.filter { $0.duration >= 2700 && $0.duration < 3600 }
        let skills = sessions.filter { $0.duration < 2700 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types").font(.headline).padding(.horizontal)
            VStack(spacing: 8) {
                sessionRow(label: "Full Game", count: fullGame.count, color: .red,
                    desc: "90min+ – 4 quarters, full match")
                sessionRow(label: "Half Game / Match Sim", count: halfGame.count, color: .orange,
                    desc: "60–90 min – match simulation or half")
                sessionRow(label: "Training Session", count: training.count, color: .yellow,
                    desc: "45–60 min – structured team/individual")
                sessionRow(label: "Skills & Fitness", count: skills.count, color: .green,
                    desc: "<45 min – kicking drills, fitness testing")
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
                        .foregroundStyle(Color.red.gradient).cornerRadius(4)
                }
                .frame(height: 160).padding(.horizontal)
                .chartYAxis { AxisMarks(position: .leading) }
                .chartXAxis { AxisMarks { _ in AxisValueLabel().font(.caption2) } }
            }
        }
    }

    // MARK: - Fitness Demands Card

    private var fitnessDemandsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("AFL Fitness Demands", systemImage: "figure.run.circle.fill")
                .font(.headline).foregroundStyle(.red)

            Text("AFL is considered the world's most physically demanding team sport — combining the aerobic capacity of distance running with the explosive demands of sprinting.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run", title: "Distance Per Game",
                    detail: "Coutts 2010: elite AFL players cover 12–20 km/game; midfielders average 16–18 km at 125 m/min average; high-intensity running (>18 km/h) accounts for 2.5–3.5 km — equivalent to running a half-marathon at threshold pace",
                    color: .red)
                sciRow(icon: "bolt.fill", title: "Energy System Profile",
                    detail: "Gastin 2013: aerobic system = 88–90% of total game energy; anaerobic contribution = 10–12% but determines explosive play outcomes; VO₂max 55–65 mL/kg/min in elite players — top-end aerobic capacity with repeated sprint ability",
                    color: .orange)
                sciRow(icon: "heart.fill", title: "Heart Rate Profile",
                    detail: "Average game HR 155–165 bpm (85–90% HRmax); peak HR during contests and repeat sprints: 185–195 bpm; half-time HR recovery to 120–130 bpm in 5 min indicates aerobic fitness quality",
                    color: .pink)
                sciRow(icon: "flame.fill", title: "Caloric Expenditure",
                    detail: "Elite full game: 1,500–2,200 kcal; midfielders at the high end; ruck contests add significant upper-body expenditure; match-day carbohydrate needs: 8–10 g/kg body weight",
                    color: .yellow)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Kicking Biomechanics Card

    private var kickingBiomechanicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Kicking & Handball Biomechanics", systemImage: "figure.kickboxing")
                .font(.headline).foregroundStyle(.blue)

            Text("The punt kick is AFL's signature skill — a complex ballistic movement requiring precise timing, hip mobility, and explosive power.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "rotate.3d", title: "Punt Kick Mechanics",
                    detail: "Ball 2008: hip internal rotation peaks at 570–620°/s at ball contact; hip flexion velocity 610–670°/s; ball speed 55–90 km/h from standard kicks; accuracy requires < 5° variability in knee alignment at contact",
                    color: .blue)
                sciRow(icon: "timer", title: "Kick Timing Window",
                    detail: "Elite players release ball 0.35–0.42 s from drop to contact (Dichiera 2006); ball-hand contact duration: 0.01–0.015 s; grip pressure modulates spin rate — spiral (high spin) = more accurate over distance",
                    color: .cyan)
                sciRow(icon: "hand.point.right.fill", title: "Handball Biomechanics",
                    detail: "Hand-pass requires rapid supination-pronation of the non-dominant forearm generating 25–35 km/h ball velocity; wrist ulnar deviation at release adds 15–20 km/h; practiced to become automatic — 5,000+ repetitions for motor programming",
                    color: .teal)
                sciRow(icon: "figure.arms.open", title: "Mark-Taking (Contested Aerial)",
                    detail: "High-marking contest: player accelerates to 4–6 m/s horizontal, leaps off opponent's back or shoulder, peak jump height 40–65 cm above normal standing reach; GRF at landing: 4–7× BW — knee valgus risk during landing",
                    color: .indigo)
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
            Label("Injury Science", systemImage: "bandage.fill")
                .font(.headline).foregroundStyle(.orange)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run", title: "Hamstring Strain (Most Common)",
                    detail: "Orchard 2013 (AFL Injury Database): hamstring strain = 7.4 cases/club/season; accounts for 16% of all missed games; high-speed running loads are primary cause — progressive sprint volume exposure is best prevention; Askling 2003: eccentric training reduces incidence 70%",
                    color: .red)
                sciRow(icon: "figure.stand", title: "ACL — Most Disabling",
                    detail: "AFL has highest ACL incidence in professional sport — 15–20 cases/season across 18 clubs; contested marking landings, pivoting from full speed, wet conditions increase risk; Nielsen 2016: neuromuscular warm-up (AFL-specific) reduces ACL risk 64%",
                    color: .orange)
                sciRow(icon: "exclamationmark.triangle.fill", title: "Soft Tissue Load Monitoring",
                    detail: "Champion Data GPS tracking shows ACWR > 1.5 (Gabbett 2016) increases injury risk 2–4×; AFL clubs use weekly exposure targets: 9–11 km high-speed running / week as upper limit for injury-free training",
                    color: .yellow)
                sciRow(icon: "figure.wrestling", title: "Contact Injuries",
                    detail: "Orchard 2013: shoulder dislocations common from mark contests; corked thigh (quadriceps contusion) in 6.2/club/season; protective padding at thighs and shoulders reduces grade 1–2 bruising incidence by 40%",
                    color: .blue)
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
                .font(.headline).foregroundStyle(.purple)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run.circle", title: "Midfielders (Wings & On-Ballers)",
                    detail: "Highest workload: 16–18 km/game including 3–4 km at high intensity; require elite aerobic base (VO₂max >60 mL/kg/min) plus repeated sprint ability; on-ballers attend every centre bounce — avg 50–70 stoppages/game",
                    color: .purple)
                sciRow(icon: "arrow.up.circle", title: "Ruckmen",
                    detail: "Rucks contest 50–80 hit-outs per game; jump height 45–65 cm above opponents; upper-body mass & power primary — avg height 200 cm, 100+ kg; aerobic demand lower but explosive demand highest of any position",
                    color: .cyan)
                sciRow(icon: "figure.stand", title: "Forwards & Defenders",
                    detail: "Forwards: sprint-dominant, 15–20 explosive efforts <5 s per game; key forwards: aerial marking specialists, 1–3 km high-intensity/game; key defenders: agility-focused, must match forward movements + clear the ball under pressure",
                    color: .green)
                sciRow(icon: "scope", title: "Small Forwards / Flanks",
                    detail: "Highest peak speed position: up to 34–37 km/h tracked by Champion Data; multiple acceleration-deceleration cycles; position change every 5–15 s on average — requires best repeated-sprint capacity on the team",
                    color: .orange)
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
                            .fontWeight(.medium).foregroundStyle(.red)
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
        case 5400...: return "Full Game"
        case 3600..<5400: return "Match Sim"
        case 2700..<3600: return "Training Session"
        default: return "Skills & Fitness"
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
        let predicate = HKQuery.predicateForWorkouts(with: .australianFootball)
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
        var weekData: [WeeklyAFLData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklyAFLData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        isLoading = false
    }
}
