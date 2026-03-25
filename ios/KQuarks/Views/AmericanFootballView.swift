import SwiftUI
import HealthKit
import Charts

struct AmericanFootballView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklyFootballData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0
    @State private var longestSession: Double = 0

    struct WeeklyFootballData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("American Football", systemImage: "football.fill")
                        .font(.title2).bold()
                    Text("Positional demands, concussion science & explosive performance analytics")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Football Sessions",
                        systemImage: "football.fill",
                        description: Text("Record football sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    positionalDemandsCard
                    concussionScienceCard
                    injuryEpidemiologyCard
                    trainingPerformanceCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("American Football")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "football.fill", color: .brown)
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
        let game = sessions.filter { $0.duration >= 7200 }
        let practice = sessions.filter { $0.duration >= 3600 && $0.duration < 7200 }
        let walkthrough = sessions.filter { $0.duration >= 2700 && $0.duration < 3600 }
        let conditioning = sessions.filter { $0.duration < 2700 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types").font(.headline).padding(.horizontal)
            VStack(spacing: 8) {
                sessionRow(label: "Full Game", count: game.count, color: .brown,
                    desc: "2h+ – 4 quarters, pregame & postgame")
                sessionRow(label: "Practice", count: practice.count, color: .orange,
                    desc: "1–2h – install, team/individual periods")
                sessionRow(label: "Walkthrough", count: walkthrough.count, color: .yellow,
                    desc: "45–60 min – scheme review, no contact")
                sessionRow(label: "Conditioning", count: conditioning.count, color: .green,
                    desc: "<45 min – speed, agility & strength")
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
                        .foregroundStyle(Color.brown.gradient).cornerRadius(4)
                }
                .frame(height: 160).padding(.horizontal)
                .chartYAxis { AxisMarks(position: .leading) }
                .chartXAxis { AxisMarks { _ in AxisValueLabel().font(.caption2) } }
            }
        }
    }

    // MARK: - Positional Demands Card

    private var positionalDemandsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Positional Demands", systemImage: "figure.american.football")
                .font(.headline).foregroundStyle(.brown)

            Text("American football positions have dramatically different physiological demands — the most diverse positional variation of any team sport.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "figure.strengthtraining.traditional", title: "Linemen (OL/DL)",
                    detail: "Brechue 2010 (NFL Combine): OL avg 315 lbs, 4.9 s 40-yd; 85–95% maximal effort in 3–5 s bursts; Rhea 2011: 4,500–6,000 kcal/day required; strength endurance (75–85% 1RM repeated explosive effort)",
                    color: .brown)
                sciRow(icon: "figure.run", title: "Skill Positions (WR/DB/RB)",
                    detail: "Drakos 2010: WRs run 1.5–2.5 miles/game at 70% full sprint; DB coverage = 8–12 explosive direction changes per play; peak sprint speed 20–23 mph; repeat-sprint capacity critical",
                    color: .orange)
                sciRow(icon: "figure.handball", title: "Quarterbacks",
                    detail: "Fleisig 2000: QB throwing generates 6,000°/s elbow angular velocity at release — highest of any overhead sport; rotator cuff at 80–90% MVC on follow-through; footwork generates 40–60% of throwing force",
                    color: .yellow)
                sciRow(icon: "heart.fill", title: "Game Day HR Profile",
                    detail: "Bishop 2008: average game-day HR 140–160 bpm for linemen (contact + isometric load); skill positions peak at 180–195 bpm on play; 40 s of rest between plays allows HR recovery to 120–140 bpm",
                    color: .red)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Concussion Science Card

    private var concussionScienceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Concussion & Brain Health Science", systemImage: "brain.head.profile")
                .font(.headline).foregroundStyle(.purple)

            Text("Concussion is the most studied injury in sport neuroscience, and football has driven most of the research advances in the field.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "exclamationmark.triangle.fill", title: "Concussion Epidemiology",
                    detail: "Guskiewicz 2003: football players experience 1–3 concussions per 1,000 athlete-exposures; 3.8× higher risk with prior concussion; up to 5.3 g average acceleration at impact threshold",
                    color: .purple)
                sciRow(icon: "brain", title: "CTE Risk Science",
                    detail: "McKee 2023 (NEJM): CTE confirmed in 110 of 111 NFL brains donated; tau accumulation correlates with # of years played, not just concussions — subconcussive hits matter; >16 years of play = high risk",
                    color: .red)
                sciRow(icon: "clock.fill", title: "Return-to-Play Protocol",
                    detail: "NFL/NHL 5-step RTP protocol (Zurich consensus 2017): symptom-free rest → light aerobic → sport-specific → non-contact drills → contact drills → game clearance; each step = 24h minimum",
                    color: .blue)
                sciRow(icon: "shield.fill", title: "Protective Factors",
                    detail: "Neck strength training: stronger neck muscles reduce angular acceleration by 20–33% (Mihalik 2011); helmet fit critical — STAR 5-star helmets reduce concussion risk 54% vs. 1-star (VT Helmet Ratings 2023)",
                    color: .green)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Injury Epidemiology Card

    private var injuryEpidemiologyCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Injury Prevention Science", systemImage: "bandage.fill")
                .font(.headline).foregroundStyle(.red)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run", title: "ACL — Most Feared Injury",
                    detail: "Drakos 2010: ACL tears = 1.2% of NFL exposures but represent 40% of career-ending injuries; 95% from non-contact mechanism; valgus collapse + tibial rotation; hip abductor strengthening reduces risk by 50% (Meehan 2020)",
                    color: .red)
                sciRow(icon: "figure.stand", title: "Hamstring Strains",
                    detail: "NFL injury surveillance: hamstrings = 13% of all muscle injuries; high-speed running & deceleration; Arnason 2008: Nordic hamstring curl reduces re-injury rate by 65%; eccentric loading is gold standard prevention",
                    color: .orange)
                sciRow(icon: "figure.handball", title: "Shoulder (AC Joint & Rotator Cuff)",
                    detail: "Shoulder injuries account for 20% of football injuries; AC separations in linemen from blocking; RC tears in QBs from chronic overhead load — proactive rotator cuff strengthening prevents 50% of shoulder injuries",
                    color: .yellow)
                sciRow(icon: "figure.fall", title: "Turf vs. Grass Rates",
                    detail: "Mack 2019: artificial turf increases non-contact lower extremity injury rate 28% vs. natural grass; cleat type matters — 3/4 shoe length cleats on turf reduce ankle injury 22%; NFL injury rate 1.04/game vs. grass 0.72/game",
                    color: .blue)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Training Performance Card

    private var trainingPerformanceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Performance Science", systemImage: "chart.bar.fill")
                .font(.headline).foregroundStyle(.orange)

            VStack(spacing: 10) {
                sciRow(icon: "bolt.fill", title: "Speed & Agility Standards",
                    detail: "NFL Combine: elite DB 40-yd dash 4.30–4.45 s; elite OL 4.85–5.10 s; 3-cone drill (L-drill) separates agility from pure speed — 6.5 s or less = elite; vertical jump: WR/DB >35 in, OL >27 in",
                    color: .yellow)
                sciRow(icon: "flame.fill", title: "Caloric Demands",
                    detail: "Linemen: 4,500–6,000 kcal/day during season; skill positions: 3,000–4,000 kcal/day; game day: 1,800–2,200 kcal expended; carb-loading the night before game (8–10 g/kg) optimizes glycogen stores",
                    color: .orange)
                sciRow(icon: "moon.fill", title: "Season Load Management",
                    detail: "16-week NFL season: cumulative hits = 900–1,500 subconcussive impacts (helmet accelerometers); weekly soft tissue damage requires 5–7 day recovery cycle; Wednesday/Thursday full-speed, Friday/Saturday walkthrough",
                    color: .purple)
                sciRow(icon: "figure.strengthtraining.traditional", title: "Off-Season Strength",
                    detail: "Potteiger 1999: in-season strength maintenance requires ≥1 heavy session/week to prevent atrophy; post-season: 4–6 week recovery, then hypertrophy → strength → power periodization for 22-week off-season program",
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
                            .fontWeight(.medium).foregroundStyle(.brown)
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
        case 3600..<7200: return "Practice"
        case 2700..<3600: return "Walkthrough"
        default: return "Conditioning"
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
        let predicate = HKQuery.predicateForWorkouts(with: .americanFootball)
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
            self.longestSession = sorted.map(\.duration).max() ?? 0
            let cals = sorted.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }
            self.avgCalories = cals.isEmpty ? 0 : cals.reduce(0, +) / Double(cals.count)
        }
        var weekData: [WeeklyFootballData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklyFootballData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        isLoading = false
    }
}
