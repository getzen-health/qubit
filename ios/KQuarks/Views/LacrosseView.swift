import SwiftUI
import HealthKit
import Charts

struct LacrosseView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklyLaxData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0

    struct WeeklyLaxData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("Lacrosse", systemImage: "figure.lacrosse")
                        .font(.title2).bold()
                    Text("Shot mechanics, cradling physics & game load analysis")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Lacrosse Sessions",
                        systemImage: "figure.lacrosse",
                        description: Text("Record lacrosse sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    gameLoadCard
                    shotMechanicsCard
                    cradlingPhysicsCard
                    injuryPrevCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Lacrosse")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "figure.lacrosse", color: .purple)
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
        let practice = sessions.filter { $0.duration >= 3600 && $0.duration < 5400 }
        let drills = sessions.filter { $0.duration >= 1800 && $0.duration < 3600 }
        let quick = sessions.filter { $0.duration < 1800 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types").font(.headline).padding(.horizontal)
            VStack(spacing: 8) {
                sessionRow(label: "Full Game", count: fullGame.count, color: .purple,
                    desc: "90min+ – 4 quarters, field or box lacrosse")
                sessionRow(label: "Team Practice", count: practice.count, color: .blue,
                    desc: "60–90 min – drills, small-sided & scrimmage")
                sessionRow(label: "Skills Session", count: drills.count, color: .teal,
                    desc: "30–60 min – stick work, shooting, ground balls")
                sessionRow(label: "Wall Ball / Quick", count: quick.count, color: .green,
                    desc: "<30 min – wall ball, catch & throw")
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
                        .foregroundStyle(Color.purple.gradient).cornerRadius(4)
                }
                .frame(height: 160).padding(.horizontal)
                .chartYAxis { AxisMarks(position: .leading) }
                .chartXAxis { AxisMarks { _ in AxisValueLabel().font(.caption2) } }
            }
        }
    }

    // MARK: - Game Load Card

    private var gameLoadCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Game Load & Intensity", systemImage: "figure.run.circle.fill")
                .font(.headline).foregroundStyle(.purple)

            Text("Lacrosse combines the intermittent intensity of hockey with the field coverage of soccer — unique physiological demands across position groups.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run", title: "Running Volume",
                    detail: "Kelly 2012: field lacrosse players cover 5.5–7.5 km/game; midfielders 7–9 km; attackers/defenders 5–6 km; 250–350 explosive efforts/game — change of direction every 4–8 s on average",
                    color: .purple)
                sciRow(icon: "heart.fill", title: "Intensity Profile",
                    detail: "Root 2015: box lacrosse (indoor) avg HR 160–170 bpm vs. field lacrosse 145–155 bpm; box lacrosse has smaller area and walls — more sustained high-intensity effort; field lacrosse more intermittent with recovery periods",
                    color: .red)
                sciRow(icon: "flame.fill", title: "Caloric Expenditure",
                    detail: "Field lacrosse: 8–11 METs (~550–750 kcal/h for 75 kg player); box lacrosse: 10–13 METs (~700–900 kcal/h); midfielder positions burn ~25% more than attack/defense due to end-to-end running",
                    color: .orange)
                sciRow(icon: "bolt.fill", title: "Aerobic Requirements",
                    detail: "Elite field lacrosse midfielders: VO₂max 55–65 mL/kg/min (Tierney 2016); box lacrosse requires higher anaerobic capacity (30–35% of total energy from anaerobic vs. 15–20% in field); repeated sprint ability is limiting factor for midfielders",
                    color: .yellow)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Shot Mechanics Card

    private var shotMechanicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Shot Mechanics", systemImage: "arrow.right.circle.fill")
                .font(.headline).foregroundStyle(.blue)

            Text("The overhand lacrosse shot is a high-velocity throw-pattern using a rigid stick — the biomechanics differ meaningfully from baseball and tennis.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "bolt.fill", title: "Shot Velocity",
                    detail: "Goss 2013: MLL professional overhand shot: 130–160 km/h (80–100 mph); elite college: 110–140 km/h; sidearm: 5–10% faster due to reduced wrist-flip travel distance; women's lacrosse (longer release arc): avg 95–120 km/h",
                    color: .blue)
                sciRow(icon: "rotate.3d", title: "Wrist Snap Mechanics",
                    detail: "Schroeder 2017: top-hand wrist flexion generates 60–70% of final shot velocity; elbow extension contributes 20%; shoulder internal rotation contributes 15%; bottom hand acts as lever pivot — grip pressure distribution determines accuracy",
                    color: .cyan)
                sciRow(icon: "figure.handball", title: "Shooting Angles & Pockets",
                    detail: "Pocket depth determines release point: shallow pocket → earlier release (higher release point, shorter shooting window); deep pocket → later release (longer whip, more velocity); NFHS regulations limit pocket depth to below bottom of side wall",
                    color: .teal)
                sciRow(icon: "scope", title: "Shooting Accuracy Science",
                    detail: "Schertz 2020: top players achieve <6° angular error in shot placement; fixation on target (goalie hip/pipe location) 200–350 ms before release; catching sight of goalie movement triggers shot re-direction — elite reaction shot < 0.25 s",
                    color: .indigo)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Cradling Physics Card

    private var cradlingPhysicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Cradling Physics & Stick Skills", systemImage: "arrow.left.and.right.circle")
                .font(.headline).foregroundStyle(.teal)

            Text("Cradling is unique to lacrosse — centripetal force keeps the ball in the pocket during running, one of sport's only centripetal skill mechanics.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "figure.walk", title: "Centripetal Force Mechanism",
                    detail: "Ball stays in pocket because cradling generates centripetal acceleration (a = v²/r) directed inward; angular velocity ~45–60°/s per cradle cycle; stick head radius ~0.3 m; ball feels apparent force of 0.5–1.5× gravity — sufficient to overcome pocket friction",
                    color: .teal)
                sciRow(icon: "waveform", title: "Wall Ball Training Science",
                    detail: "500+ repetitions per hand per session for elite development; wall ball at 10 m develops 'quick hands' (reaction catch-pass cycle < 0.4 s); off-hand repetitions critical — ambidexterity reduces defensive tell and increases passing options",
                    color: .green)
                sciRow(icon: "figure.run", title: "Ground Ball Mechanics",
                    detail: "Scoop mechanics: stick angle 20–30° at ball contact; forward weight shift generates scoop force; 97% of 50/50 balls won by player with lower center of gravity — body position pre-contact determines outcome more than stick skill",
                    color: .blue)
                sciRow(icon: "shield.fill", title: "Protective Equipment Physics",
                    detail: "Hopkins 2017: lacrosse helmet with face mask reduces head injury risk; shoulder pads absorb 2–4 kJ of impact energy in body checks; arm guards protect from cross-checks; mandatory equipment reduces soft tissue injury rate by 35–40%",
                    color: .purple)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Injury Prevention Card

    private var injuryPrevCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Injury Prevention", systemImage: "bandage.fill")
                .font(.headline).foregroundStyle(.red)

            VStack(spacing: 10) {
                sciRow(icon: "figure.arms.open", title: "Shoulder (Most Common)",
                    detail: "Barber 2017: shoulder injuries = 26% of all lacrosse injuries; AC joint separation from falls and body checks; rotator cuff overuse from high-velocity shooting; eccentric rotator cuff strengthening (side-lying ER) reduces incidence 50%",
                    color: .red)
                sciRow(icon: "figure.stand", title: "Knee Injuries",
                    detail: "Knee injuries = 24% (Barber 2017); ACL predominantly non-contact (cutting/planting mechanism); women's lacrosse higher ACL rate than men's (no full body checking); FIFA 11+ warm-up adapted for lacrosse reduces ACL incidence 32%",
                    color: .orange)
                sciRow(icon: "brain", title: "Head & Concussion",
                    detail: "Men's lacrosse = 20% head/neck injuries (body checking allowed); concussion rate 0.26/1,000 AE in men's (higher than soccer, lower than football); women's lacrosse: incidental contact and stick-to-head contact — goggles mandatory; helmet mandatory in men's",
                    color: .yellow)
                sciRow(icon: "wrist.digital.crown.right", title: "Wrist & Hand",
                    detail: "Stick-to-hand impacts during defense — gloves provide impact absorption; dorsal wrist impaction syndrome from repeated butt-end impact with crosse; hamate fractures from grip stress — rare but underdiagnosed; goalkeeper: highest hand injury risk (shot exposure)",
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
                            .fontWeight(.medium).foregroundStyle(.purple)
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
        case 3600..<5400: return "Team Practice"
        case 1800..<3600: return "Skills Session"
        default: return "Wall Ball / Quick"
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
        let predicate = HKQuery.predicateForWorkouts(with: .lacrosse)
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
        var weekData: [WeeklyLaxData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklyLaxData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        isLoading = false
    }
}
