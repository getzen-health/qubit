import SwiftUI
import HealthKit
import Charts

struct WrestlingView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklyWrestlingData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0

    struct WeeklyWrestlingData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("Wrestling", systemImage: "figure.wrestling")
                        .font(.title2).bold()
                    Text("Takedown mechanics, mat conditioning & weight management science")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Wrestling Sessions",
                        systemImage: "figure.wrestling",
                        description: Text("Record wrestling sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    physicalDemandsCard
                    takedownMechanicsCard
                    weightManagementCard
                    injuryPrevCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Wrestling")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "figure.wrestling", color: .indigo)
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
        let competition = sessions.filter { $0.duration >= 7200 }
        let dualMeet = sessions.filter { $0.duration >= 3600 && $0.duration < 7200 }
        let practice = sessions.filter { $0.duration >= 2700 && $0.duration < 3600 }
        let drilling = sessions.filter { $0.duration < 2700 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types").font(.headline).padding(.horizontal)
            VStack(spacing: 8) {
                sessionRow(label: "Tournament / Competition", count: competition.count, color: .indigo,
                    desc: "2h+ – full tournament with multiple matches")
                sessionRow(label: "Dual Meet", count: dualMeet.count, color: .blue,
                    desc: "60–120 min – team dual meet, weigh-in to final match")
                sessionRow(label: "Practice", count: practice.count, color: .teal,
                    desc: "45–60 min – live wrestling, situational drilling")
                sessionRow(label: "Drilling", count: drilling.count, color: .green,
                    desc: "<45 min – technique drilling, conditioning")
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
                        .foregroundStyle(Color.indigo.gradient).cornerRadius(4)
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
            Label("Physical Demands", systemImage: "figure.run.circle.fill")
                .font(.headline).foregroundStyle(.indigo)

            Text("Wrestling demands the broadest combination of physical qualities in sport — strength, power, aerobic capacity, and anaerobic endurance all within a 6-minute match.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "heart.fill", title: "Match Intensity",
                    detail: "Yoon 2002: collegiate wrestling match avg HR 175–190 bpm (>90% HRmax); peak HR during scrambles: 195–205 bpm; blood lactate 8–14 mmol/L after competitive match — among the highest lactate responses in sport",
                    color: .red)
                sciRow(icon: "flame.fill", title: "Energy System Profile",
                    detail: "Callan 2000: 60–70% aerobic + 30–40% anaerobic for 6-minute match; ATP-PCr system critical for explosive takedowns (first 3–5 s); repeated anaerobic efforts demand aerobic recovery between scrambles; VO₂max 55–65 mL/kg/min for elite collegiate wrestlers",
                    color: .orange)
                sciRow(icon: "bolt.fill", title: "Explosive Power Demands",
                    detail: "Single-leg takedown generates 8–12 W/kg peak power output; hip-extension power during double-leg (level change) = most predictive of takedown success; vertical jump height correlates with takedown power: r = 0.71 (Kraemer 2004)",
                    color: .yellow)
                sciRow(icon: "figure.strengthtraining.traditional", title: "Strength Profile",
                    detail: "Elite wrestlers: bench press 1.5× BW, squat 2.0× BW, deadlift 2.3× BW; grip strength a differentiating factor — above 60 kgf (600 N) for collegiate; isometric strength on mat (bridging, posting) determines position battles",
                    color: .blue)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Takedown Mechanics Card

    private var takedownMechanicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Takedown & Throw Mechanics", systemImage: "arrow.down.circle.fill")
                .font(.headline).foregroundStyle(.blue)

            Text("Takedowns are the biomechanically complex centerpiece of wrestling — physics of leverage, force timing, and center-of-mass control determine success.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "arrow.down.circle", title: "Double-Leg Takedown Physics",
                    detail: "Level change (drop height 15–25 cm) lowers CG to below opponent's; leg drive generates 500–800 N horizontal force; finish requires elevating opponent's CG above their base of support (~30 cm); total movement completed in 0.8–1.2 s from penetration to finish",
                    color: .blue)
                sciRow(icon: "figure.stand", title: "Single-Leg Mechanics",
                    detail: "Single-leg attack: ankle-knee-hip isolation removes one base of support; trip finishes use foot-behind-heel lever (mechanical advantage ~2:1 against opponent); inside trip rotates body around a vertical axis through opponent's stance midpoint",
                    color: .cyan)
                sciRow(icon: "arrow.up.circle", title: "Greco-Roman Throws",
                    detail: "Greco-Roman suplex: hip-to-hip contact generates 14–18 Nm torque at landing; arch-throw generates peak force 8–12× BW at mat contact for thrown wrestler — crash mats absorb 60–70% of impact vs. standard wrestling mat; Greco requires 40% more hip extension power than freestyle",
                    color: .teal)
                sciRow(icon: "brain.head.profile", title: "Reactive Vs. Setups",
                    detail: "Elite wrestlers react to exposed limbs in 150–200 ms (faster than visual reaction time alone — proprioceptive pre-processing); setups (chains of motion to create openings) take 0.4–0.8 s; film study reveals opponent's level change tells 200 ms before initiation",
                    color: .indigo)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Weight Management Card

    private var weightManagementCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Weight Management Science", systemImage: "scalemass.fill")
                .font(.headline).foregroundStyle(.orange)

            Text("Weight cutting is prevalent in wrestling — the science shows significant performance and health costs at extremes, driving regulatory reform.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "drop.fill", title: "Dehydration Effects on Performance",
                    detail: "Fogelholm 1994: 5% BW loss via dehydration reduces anaerobic power output 9.5%; aerobic capacity down 8%; reaction time slows 10%; strength -5–7%; 24h rehydration window restores aerobic capacity but NOT anaerobic power (incomplete muscle glycogen restoration)",
                    color: .red)
                sciRow(icon: "thermometer.sun", title: "Safe Weight Cutting Guidelines",
                    detail: "NCAA Wrestling Weight Certification: hydration testing (urine specific gravity <1.025 = acceptable competition weight); minimum weight set at 5% dehydration threshold; NHSCA: no more than 1.5% BW loss per week; 3-4 hours post-weigh-in for partial rehydration",
                    color: .orange)
                sciRow(icon: "figure.run.circle", title: "Competing at Natural Weight",
                    detail: "Wroble & Moxley 1996: wrestlers who compete at natural weight have 40–50% lower injury rate and show superior anaerobic performance vs. those cutting >5%; elite freestyle programs (US Olympic team) trending toward competing at measured weight",
                    color: .green)
                sciRow(icon: "scalemass.fill", title: "Optimal Nutrition Strategy",
                    detail: "Competition morning: 6–8 g/kg carbohydrate refeeding after weigh-in; 12–16 oz water/h rehydration rate (max intestinal absorption); creatine + carbohydrate combination accelerates glycogen resynthesis 14% faster than carbohydrate alone in 4h window",
                    color: .blue)
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
                    detail: "NCAA Wrestling Injury Surveillance (2010–2014): shoulder injuries = 28% of all wrestling injuries; AC separations from posting falls; rotator cuff strains from arm drag defense; anterior shoulder instability from repeated elevation + external rotation — eccentric program reduces incidence 45%",
                    color: .red)
                sciRow(icon: "figure.stand", title: "Knee Injuries",
                    detail: "MCL sprains from takedown attempts (valgus knee stress from single-leg stance during shot); prepatellar bursitis ('wrestler's knee') from mat time — compression shorts reduce bursitis incidence 35%; ACL injury rare but season-ending when it occurs",
                    color: .orange)
                sciRow(icon: "ear.fill", title: "Cauliflower Ear (Auricular Hematoma)",
                    detail: "Repeated ear trauma → blood pooling between cartilage and perichondrium → fibrous scar tissue → permanent deformity; prevention: wrestling headgear reduces incidence by 91%; immediate aspiration within 24h prevents calcification; untreated hematomas calcify in 5–7 days",
                    color: .yellow)
                sciRow(icon: "microbe.fill", title: "Skin Infections",
                    detail: "Herpes gladiatorum, ringworm (tinea corporis gladiatorum), MRSA — most preventable wrestling hazard; mandatory daily mat cleaning with EPA-registered disinfectants; NCAA rules require skin clearance before competition; antiviral prophylaxis reduces herpes transmission 75% in team settings",
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
                            .fontWeight(.medium).foregroundStyle(.indigo)
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
        case 7200...: return "Tournament / Competition"
        case 3600..<7200: return "Dual Meet"
        case 2700..<3600: return "Practice"
        default: return "Drilling"
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
        let predicate = HKQuery.predicateForWorkouts(with: .wrestling)
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
        var weekData: [WeeklyWrestlingData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklyWrestlingData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        DispatchQueue.main.async { self.isLoading = false }
    }
}
