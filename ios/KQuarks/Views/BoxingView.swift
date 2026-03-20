import SwiftUI
import HealthKit
import Charts

struct BoxingView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklyBoxingData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0

    struct WeeklyBoxingData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("Boxing", systemImage: "figure.boxing")
                        .font(.title2).bold()
                    Text("Punch biomechanics, round intensity & multi-system energy demands")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Boxing Sessions",
                        systemImage: "figure.boxing",
                        description: Text("Record boxing sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    punchBiomechanicsCard
                    energySystemsCard
                    trainingModesCard
                    injuryBrainHealthCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Boxing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "figure.boxing", color: .red)
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
        let fight = sessions.filter { $0.duration >= 5400 }
        let sparring = sessions.filter { $0.duration >= 3600 && $0.duration < 5400 }
        let training = sessions.filter { $0.duration >= 1800 && $0.duration < 3600 }
        let technical = sessions.filter { $0.duration < 1800 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types").font(.headline).padding(.horizontal)
            VStack(spacing: 8) {
                sessionRow(label: "Competition / Fight", count: fight.count, color: .red,
                    desc: "90min+ – full bout with warm-up, rounds & cool-down")
                sessionRow(label: "Sparring", count: sparring.count, color: .orange,
                    desc: "60–90 min – multiple rounds, defensive work")
                sessionRow(label: "Full Training", count: training.count, color: .yellow,
                    desc: "30–60 min – bags, pads, mitts, footwork drills")
                sessionRow(label: "Technical Session", count: technical.count, color: .green,
                    desc: "<30 min – shadow boxing, pad work, skill work")
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

    // MARK: - Punch Biomechanics Card

    private var punchBiomechanicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Punch Biomechanics", systemImage: "hand.raised.fill")
                .font(.headline).foregroundStyle(.red)

            Text("Punching is one of sport's most studied explosive movements — elite boxers generate forces comparable to small vehicle impacts.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "bolt.fill", title: "Peak Punch Force",
                    detail: "Turner 2011 (Sports Eng): elite amateur boxers generate 2.4–4.8 kN peak punch force; straight punches (jab/cross) generate higher force than hooks; novice boxers generate 1.2–2.1 kN — elite generate 2–4× more through better kinetic chain transfer",
                    color: .red)
                sciRow(icon: "rotate.3d", title: "Kinetic Chain Mechanics",
                    detail: "Lenetsky 2013: ground reaction force → leg drive → hip rotation → trunk rotation → shoulder → elbow extension → wrist pronation — each link multiplies force; hip-shoulder separation is the primary determinant of power output",
                    color: .orange)
                sciRow(icon: "timer", title: "Elbow Extension Velocity",
                    detail: "Cheraghi 2014: elite boxer elbow extension velocity during straight punch = 1,100–1,300°/s; contact duration 3–10 ms; contact velocity at fist impact: 9–12 m/s; impact force reduces with distance ('punch through' technique — target 15 cm behind surface)",
                    color: .yellow)
                sciRow(icon: "figure.boxing", title: "Defense Mechanics",
                    detail: "Parry/slip angles: rolling under hook reduces impact force by 40–60%; Bobbing (head movement): 8–15 cm below punch trajectory; effective head movement reduces eye focus — cognitive cost of defense is measurable via dual-task performance paradigms",
                    color: .blue)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Energy Systems Card

    private var energySystemsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Energy Systems & Round Intensity", systemImage: "flame.fill")
                .font(.headline).foregroundStyle(.orange)

            Text("A 3-minute boxing round engages all three energy systems — the classic work:rest ratio of 3:1 creates a unique metabolic profile unlike most sports.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "heart.fill", title: "Heart Rate Profile",
                    detail: "Dunn 2016: competitive boxing round — average HR 175–185 bpm (>90% HRmax); 1-minute rest → HR recovery to 155–165 bpm; peak HR during exchanges: 195–200 bpm; sustained anaerobic work demands elite aerobic base for recovery between rounds",
                    color: .red)
                sciRow(icon: "chart.bar.fill", title: "Energy System Breakdown",
                    detail: "Davis 2002: 3-min round energy split ≈ phosphocreatine 45%, glycolytic 45%, aerobic 10% for high-intensity exchanges; by round 10+, aerobic contribution rises to 25–30% as phosphocreatine stores deplete — 'punch output in late rounds' is aerobic dependent",
                    color: .orange)
                sciRow(icon: "flame.fill", title: "Caloric Expenditure",
                    detail: "Sparring: 9–12 METs (~650–850 kcal/h); heavy bag work: 10–13 METs; shadow boxing: 5–7 METs; jump rope (boxing): 8–10 METs; full competition = 750–1,200 kcal including pre/post warming; dehydration from pre-fight weight cuts reduces power output 6–12%",
                    color: .yellow)
                sciRow(icon: "lungs.fill", title: "Breath Control Science",
                    detail: "Boxers exhale sharply on punch (forced exhalation activates core, increases IAP, improves power transfer); breath-holding during exchanges leads to early fatigue; CO₂ threshold determines recovery rate between rounds — aerobic training raises this ceiling",
                    color: .blue)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Training Modes Card

    private var trainingModesCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Training Modes & Conditioning", systemImage: "figure.run.circle.fill")
                .font(.headline).foregroundStyle(.blue)

            VStack(spacing: 10) {
                sciRow(icon: "figure.run", title: "Roadwork (Running Base)",
                    detail: "Traditional boxing 'roadwork' — 5–10 km easy runs; builds aerobic base for round recovery; Ward 2017: boxers with higher aerobic capacity maintain punch output 15–20% better in late rounds; optimal: 3–4 roadwork sessions/week at Zone 2 (60–70% HRmax)",
                    color: .blue)
                sciRow(icon: "figure.boxing", title: "Heavy Bag vs. Mitts vs. Sparring",
                    detail: "Heavy bag: builds power, timing, stamina (max resistance); mitts: improves combinations, timing, reaction (~70% of bag power); shadow boxing: technique refinement, footwork (low force output); sparring: closest to fight demands — limits to 2–3 times/week to manage cumulative head impact",
                    color: .cyan)
                sciRow(icon: "arrow.up.and.down", title: "Jump Rope Science",
                    detail: "Rope skipping at boxing pace (120–140 RPM) improves footwork, rhythm, and coordination transfer; Trecroci 2021: 6-week rope program improved agility test times 8–12%; jump rope at 150+ RPM reaches 10+ METs — effective high-intensity conditioning",
                    color: .teal)
                sciRow(icon: "chart.line.uptrend.xyaxis", title: "Periodization for Fight Prep",
                    detail: "12-week fight camp structure: 4 weeks general prep (aerobic base, strength) → 4 weeks specific prep (sparring intensity, power) → 4 weeks pre-competition (peaking, weight management, final sharpening); taper 7–10 days before bout",
                    color: .green)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Injury & Brain Health Card

    private var injuryBrainHealthCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Injury & Brain Health Science", systemImage: "brain.head.profile")
                .font(.headline).foregroundStyle(.purple)

            Text("Head injury prevention in boxing is the sport's most researched safety topic — modern evidence guides protective equipment and training volume.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "hand.raised.fill", title: "Hand Injuries",
                    detail: "Boxer's fracture (5th metacarpal neck) = most common boxing injury from improper technique (hook with wrist deviation); Bennett's fracture (1st metacarpal base) from thumb impact; proper wrapping + glove selection reduces hand injury rate by 60%",
                    color: .red)
                sciRow(icon: "brain", title: "Chronic Traumatic Encephalopathy",
                    detail: "Bernick 2019 (Cleveland Clinic): cumulative fight exposure correlates with white matter changes on MRI — brain injury is a continuum, not threshold event; professional boxers with >100 pro rounds show 2.3× higher tau accumulation than controls; 'punch drunk' syndrome (dementia pugilistica) is the terminal presentation",
                    color: .purple)
                sciRow(icon: "eye.fill", title: "Retinal Health",
                    detail: "Head impacts in boxing can cause retinal detachments — more common in amateur boxing; Giovinazzo 1987: detachment rate 0.6% of professional boxers annually; dilated fundus exam annually recommended for professional boxers; lens injury can also occur",
                    color: .orange)
                sciRow(icon: "shield.fill", title: "Protective Strategies",
                    detail: "Headgear reduces lacerations but may NOT reduce concussion risk (USA Boxing 2016: removed headgear from amateur competition citing increased concussion exposure from slower reaction time); mouthguard use lowers dental injury 67%; mandatory rest periods after KOs reduce cumulative damage",
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
        case 5400...: return "Competition / Fight"
        case 3600..<5400: return "Sparring"
        case 1800..<3600: return "Full Training"
        default: return "Technical Session"
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
        let predicate = HKQuery.predicateForWorkouts(with: .boxing)
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
        var weekData: [WeeklyBoxingData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklyBoxingData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        DispatchQueue.main.async { self.isLoading = false }
    }
}
