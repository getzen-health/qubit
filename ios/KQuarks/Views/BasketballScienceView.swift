import SwiftUI
import HealthKit
import Charts

struct BasketballScienceView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklyBballData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0

    struct WeeklyBballData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("Basketball Science", systemImage: "basketball.fill")
                        .font(.title2).bold()
                    Text("Jump mechanics, shooting biomechanics & position-specific demands")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Basketball Sessions",
                        systemImage: "basketball.fill",
                        description: Text("Record basketball sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    physicalDemandsCard
                    jumpScienceCard
                    shootingBiomechanicsCard
                    injuryAndFatigueCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Basketball Science")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "basketball.fill", color: .orange)
            statCard(value: formatDuration(avgDuration), label: "Avg Duration", icon: "clock", color: .blue)
            statCard(value: "\(Int(avgCalories))", label: "Avg kcal", icon: "flame.fill", color: .red)
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
        let fullGame = sessions.filter { $0.duration >= 7200 }
        let scrimmage = sessions.filter { $0.duration >= 3600 && $0.duration < 7200 }
        let practice = sessions.filter { $0.duration >= 1800 && $0.duration < 3600 }
        let skillwork = sessions.filter { $0.duration < 1800 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types").font(.headline).padding(.horizontal)
            VStack(spacing: 8) {
                sessionRow(label: "Full Game", count: fullGame.count, color: .orange,
                    desc: "2h+ – 4 quarters, warm-up & post-game")
                sessionRow(label: "Scrimmage / 5v5", count: scrimmage.count, color: .red,
                    desc: "60–120 min – full court game simulation")
                sessionRow(label: "Team Practice", count: practice.count, color: .yellow,
                    desc: "30–60 min – drills, sets, defensive rotations")
                sessionRow(label: "Skill Work", count: skillwork.count, color: .green,
                    desc: "<30 min – shooting, ball handling, footwork")
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
                        .foregroundStyle(Color.orange.gradient).cornerRadius(4)
                }
                .frame(height: 160).padding(.horizontal)
                .chartYAxis { AxisMarks(position: .leading) }
                .chartXAxis { AxisMarks { _ in AxisValueLabel().font(.caption2) } }
            }
        }
    }

    // MARK: - Physical Demands Card

    private var physicalDemandsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Position-Specific Physical Demands", systemImage: "figure.run.circle.fill")
                .font(.headline).foregroundStyle(.orange)

            Text("Basketball's positional demands differ more than in any other team sport — a point guard and a center play completely different physiological games.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run", title: "Running Distance by Position",
                    detail: "McInnes 1995: point guards cover 4.8 km/game at highest intensity; shooting guards 4.5 km; small forwards 4.2 km; power forwards 3.8 km; centers 3.5 km — but centers perform more high-force contacts; NBA GameTrack: total distance 2.4–3.2 miles/game",
                    color: .orange)
                sciRow(icon: "heart.fill", title: "Cardiovascular Demands",
                    detail: "Heart rate: 169 ± 12 bpm average during play; 70–88% of game time above 85% HRmax (Ben Abdelkrim 2007); rest periods (fouls, timeouts, substitutions) reduce average HR 20–25 bpm — recovery periods are essential for high-intensity repeat efforts",
                    color: .red)
                sciRow(icon: "bolt.fill", title: "Anaerobic Power Demands",
                    detail: "Ziv & Lidor 2010: NBA players perform 1,000 explosive movements per game — 100+ jumps, 150+ rapid direction changes; ATP-PCr system critical for each burst; aerobic base determines recovery quality between possessions (mean 25–30 s)",
                    color: .yellow)
                sciRow(icon: "flame.fill", title: "Caloric Expenditure",
                    detail: "College basketball: 500–700 kcal/game for guards; 400–600 kcal for big men (lower total distance but higher metabolic cost per movement); practice intensity = 70% of game: 350–500 kcal/h; 3-point line expansion changed energy demands — more lateral movement",
                    color: .orange)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Jump Science Card

    private var jumpScienceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Jump Science", systemImage: "arrow.up.circle.fill")
                .font(.headline).foregroundStyle(.blue)

            Text("Basketball is the highest-volume jumping sport in the world — more jumps per session than volleyball, high jump, or any other discipline.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "arrow.up.circle", title: "Vertical Jump Standards",
                    detail: "Ziv & Lidor 2010: elite NBA small forwards average 67 cm vertical; guards 63 cm; centers 60 cm; Kobe Bryant measured 81 cm; Michael Jordan: 48 in (122 cm) official max jump height (combined horizontal + vertical reach); college standards: D1 guard >70 cm",
                    color: .blue)
                sciRow(icon: "figure.basketball", title: "Jump Biomechanics",
                    detail: "Countermovement jump (CMJ): hip-knee-ankle triple extension; pre-stretch (eccentric) phase stores elastic energy in tendons (50–70% of jump energy is elastic reuse); arm swing contributes 10% of jump height via momentum transfer; dominant leg vs. non-dominant: 3–8% asymmetry",
                    color: .cyan)
                sciRow(icon: "waveform", title: "Fatigue & Jump Performance",
                    detail: "Scanlan 2014: NBA jump height declines 8.4% from first to fourth quarter; free throw arc decreases 2° by late-game fatigue; repeat sprint ability (RSA) determines whether jumping quality can be maintained; caffeine ingestion (3–6 mg/kg) preserves late-game jump height",
                    color: .teal)
                sciRow(icon: "chart.line.uptrend.xyaxis", title: "Plyometric Development",
                    detail: "Matavulj 2001: 6-week plyometric protocol (depth jumps) increased vertical by 5.6 cm (8.2%); optimal depth jump box height = 30–60% of maximum jump height; single-leg work reduces bilateral deficit — trains landing mechanics reducing ACL risk",
                    color: .green)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Shooting Biomechanics Card

    private var shootingBiomechanicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Shooting Biomechanics", systemImage: "scope")
                .font(.headline).foregroundStyle(.yellow)

            Text("Elite shooting is among sport's most repeatable motor programs — Steph Curry has estimated 1 million practice shots in his career.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "angle", title: "Optimal Shooting Arc",
                    detail: "Okazaki 2006: ideal shot entry angle into basket = 45–55°; below 40° — narrow target window, increases bounce-off risk; above 60° — requires excessive force for distance; NBA player shot arc trends: corner 3 entry angle 47–52° optimal; free throws peak at 51–55°",
                    color: .yellow)
                sciRow(icon: "hand.raised.fill", title: "Release Mechanics",
                    detail: "Hamilton 1982: wrist flexion at release generates backspin (10–15 Hz optimal); backspin increases chance of rattling in by 50% on near-misses; elbow alignment under ball determines trajectory consistency; kinetic chain: feet → legs → core → arm → wrist → fingertips",
                    color: .orange)
                sciRow(icon: "brain.head.profile", title: "Fatigue & Shooting Accuracy",
                    detail: "Cheng 2016: NBA 3-point accuracy drops 3.5% in overtime vs. regulation; second game of back-to-back: shooting drops 2.1%; free throw accuracy declines 4–6% in 4th quarter vs. 1st — muscle glycogen depletion affects fine motor control before gross motor",
                    color: .red)
                sciRow(icon: "figure.mind.and.body", title: "Pressure & Clutch Shooting",
                    detail: "Goldman 2012: clutch time shooting (±5 points, last 5 min) improves with NBA experience — veterans shoot 42% clutch vs. 39% non-clutch; arousal narrows attention (Yerkes-Dodson): moderate anxiety optimal; pre-shot routine consistency is the primary clutch predictor",
                    color: .purple)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Injury & Fatigue Card

    private var injuryAndFatigueCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Injury Prevention & Fatigue", systemImage: "bandage.fill")
                .font(.headline).foregroundStyle(.red)

            VStack(spacing: 10) {
                sciRow(icon: "figure.walk", title: "Ankle Sprains (Most Common)",
                    detail: "NBA injury data: ankle sprains = 13.2% of all injuries (Drakos 2010); lateral ankle sprains from landing on opponent's foot — most dangerous play in basketball; high-top shoes reduce inversion sprain rate 25%; ankle disc proprioceptive training reduces re-sprain 38%",
                    color: .red)
                sciRow(icon: "figure.stand", title: "Patellar Tendinopathy",
                    detail: "Jumper's knee (patellar tendinopathy) = chronic pain from patellar tendon overload; Lian 2005: 32% of elite basketball players have symptomatic patellar tendinopathy; eccentric decline squat protocol (Alfredson 2007) reduces pain 50–70%; load management prevents progression",
                    color: .orange)
                sciRow(icon: "calendar", title: "Schedule Fatigue Science",
                    detail: "Cheng 2016: NBA 4-game-in-5-nights schedule reduces performance 2.3%; back-to-back shot efficiency drops 2.1% second game; travel across time zones: westward travel less disruptive than eastward; sleep extension (10h) eliminates performance decrements (Mah 2011)",
                    color: .yellow)
                sciRow(icon: "figure.fall", title: "Achilles Tendon Rupture",
                    detail: "Most career-threatening injury for NBA big men; typically occurs from explosive push-off on planted foot; age >30 and prior tendinopathy are leading risk factors; Kobe Bryant, Kevin Durant, Kyrie Irving (Achilles); prophylactic measures: eccentric calf training, load monitoring",
                    color: .blue)
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
                            .fontWeight(.medium).foregroundStyle(.orange)
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
        case 7200...: return "Full Game"
        case 3600..<7200: return "Scrimmage / 5v5"
        case 1800..<3600: return "Team Practice"
        default: return "Skill Work"
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
        let predicate = HKQuery.predicateForWorkouts(with: .basketball)
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
        var weekData: [WeeklyBballData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklyBballData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        isLoading = false
    }
}
