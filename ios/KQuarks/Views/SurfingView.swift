import SwiftUI
import HealthKit
import Charts

struct SurfingView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklySurfData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0

    struct WeeklySurfData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("Surfing", systemImage: "figure.surfing")
                        .font(.title2).bold()
                    Text("Paddle mechanics, pop-up biomechanics & surf fitness science")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Surfing Sessions",
                        systemImage: "figure.surfing",
                        description: Text("Record surfing sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    paddleMechanicsCard
                    popUpBiomechanicsCard
                    injuryPrevCard
                    fitnessDemandCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Surfing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "figure.surfing", color: .cyan)
            statCard(value: formatDuration(avgDuration), label: "Avg Duration", icon: "clock", color: .blue)
            statCard(value: "\(Int(avgCalories))", label: "Avg kcal", icon: "flame.fill", color: .orange)
        }
        .padding(.horizontal)
    }

    private func statCard(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            Text(value)
                .font(.title3).bold()
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Session Type Breakdown

    private var sessionTypeBreakdown: some View {
        let big = sessions.filter { $0.duration >= 10800 }
        let full = sessions.filter { $0.duration >= 5400 && $0.duration < 10800 }
        let standard = sessions.filter { $0.duration >= 2700 && $0.duration < 5400 }
        let quick = sessions.filter { $0.duration < 2700 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 8) {
                sessionRow(label: "Big Session", count: big.count, color: .cyan, desc: "3h+ – big swell or all-day point break")
                sessionRow(label: "Full Session", count: full.count, color: .blue, desc: "1.5–3h – standard beach break")
                sessionRow(label: "Dawn Patrol", count: standard.count, color: .teal, desc: "45–90 min – early morning before work")
                sessionRow(label: "Quick Surf", count: quick.count, color: .indigo, desc: "<45 min – tide-dependent window")
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
            Text("Weekly Calories")
                .font(.headline)
                .padding(.horizontal)

            if weeklyData.isEmpty {
                Text("Not enough data").font(.caption).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity).padding()
            } else {
                Chart(weeklyData) { item in
                    BarMark(x: .value("Week", item.week), y: .value("kcal", item.calories))
                        .foregroundStyle(Color.cyan.gradient)
                        .cornerRadius(4)
                }
                .frame(height: 160)
                .padding(.horizontal)
                .chartYAxis { AxisMarks(position: .leading) }
                .chartXAxis { AxisMarks { _ in AxisValueLabel().font(.caption2) } }
            }
        }
    }

    // MARK: - Paddle Mechanics Card

    private var paddleMechanicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Paddle Mechanics", systemImage: "arrow.forward.circle.fill")
                .font(.headline).foregroundStyle(.cyan)

            Text("Paddling dominates surf sessions — elite surfers spend more time paddling than riding waves.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "percent", title: "Time Distribution",
                    detail: "Farley 2012: paddling = 54% of session time; wave riding = 8%; sitting waiting = 35%; pop-ups + wipeouts = 3% — most surf 'fitness' is actually paddling endurance",
                    color: .cyan)
                sciRow(icon: "figure.strengthtraining.traditional", title: "Shoulder Mechanics",
                    detail: "Lowdon 1994: shoulder internal rotation generates 85% of paddle force; latissimus dorsi + posterior deltoid are primary drivers — asymmetric stroke patterns at 38–42 strokes/min",
                    color: .blue)
                sciRow(icon: "figure.arms.open", title: "Prone Paddling VO₂",
                    detail: "Mendez-Villanueva 2006: elite surfers VO₂max 42–56 mL/kg/min; prone paddling uses 70–75% VO₂max at race pace — competitive paddling is physiologically demanding",
                    color: .teal)
                sciRow(icon: "arrow.up.and.down.circle", title: "Duck-Dive vs Turtle Roll",
                    detail: "Shortboard duck-dive: 60–80% body submerged, horizontal force 1.8–2.5× BW (Katz 2013); longboard turtle roll: upper body torque to invert — rotator cuff stress greatest at wave impact",
                    color: .indigo)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Pop-Up Biomechanics Card

    private var popUpBiomechanicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Pop-Up Biomechanics", systemImage: "figure.surfing")
                .font(.headline).foregroundStyle(.blue)

            Text("The pop-up from prone to surfing stance is one of the fastest full-body movements in sport.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "timer", title: "Pop-Up Timing",
                    detail: "Dascombe 2011: experienced surfers complete pop-up in <0.4 s; beginners require 0.8–1.2 s — critical because wave face overtakes the board within 0.5 s of catch",
                    color: .blue)
                sciRow(icon: "figure.run", title: "Power Demand",
                    detail: "Hip extension power during pop-up peaks at 8–12 W/kg (Lowdon 1994) — comparable to a vertical jump; plyometric training (box jumps, burpees) directly transfers to faster pop-ups",
                    color: .orange)
                sciRow(icon: "figure.stand", title: "Stance Biomechanics",
                    detail: "Regular vs. goofy stance determined by lead foot preference; surfing stance width 50–70% of height for optimal CG; bent knees lower CG by 15–20 cm, increasing stability",
                    color: .yellow)
                sciRow(icon: "wave.3.forward", title: "Wave Reading",
                    detail: "Hutt 2001: experienced surfers spend 35% more time in optimal take-off zone (peak of breaking wave); anticipatory positioning accounts for >50% of successful wave rides",
                    color: .cyan)
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

            Text("Surf injuries are predictable — most are from board contact, not wipeouts.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "surfboard", title: "Board Impact (Primary Cause)",
                    detail: "Nathanson 2002: board impact = 55% of all surf injuries; fin lacerations = 25%; reef/rocks = 10% — leash management and nose guards significantly reduce impact injuries",
                    color: .red)
                sciRow(icon: "figure.arms.open", title: "Rotator Cuff Overuse",
                    detail: "Surf-induced shoulder injuries are predominantly rotator cuff tendinopathy from repetitive paddling (>200 strokes/session); impingement prevalent in surfers >35 y — eccentric external rotation exercises prevent progression",
                    color: .orange)
                sciRow(icon: "spine", title: "Lower Back",
                    detail: "Prone paddle position maintains lumbar hyperextension 35–54 min/h of surfing; McGill 2007: compressive load on L4/L5 in hyperextension → surfer's back (spondylolysis risk); cobra stretch before and after sessions recommended",
                    color: .yellow)
                sciRow(icon: "ear.and.waveform", title: "Surfer's Ear (Exostosis)",
                    detail: "Cold water exposure (< 19°C) → exostosis (bone growths) in ear canal (Van Buren 2016: 73% of regular cold-water surfers); silicone ear plugs reduce risk by >90% — most surgically preventable surf injury",
                    color: .teal)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Fitness Demand Card

    private var fitnessDemandCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Surf Fitness Science", systemImage: "heart.fill")
                .font(.headline).foregroundStyle(.orange)

            VStack(spacing: 10) {
                sciRow(icon: "flame.fill", title: "Caloric Expenditure",
                    detail: "Recreational surfing: 6–8 METs (~400–550 kcal/h); competitive surfing: 8–10 METs; paddling sessions without waves: 5–6 METs — caloric burn scales with wave quality and set frequency",
                    color: .orange)
                sciRow(icon: "heart.fill", title: "Cardiovascular Profile",
                    detail: "Mean HR during surfing: 140–165 bpm; peak HR on set waves: 170–185 bpm (Farley 2012); intermittent pattern — aerobic base supports long-duration paddle, anaerobic capacity for wave sprints",
                    color: .red)
                sciRow(icon: "figure.run", title: "Cross-Training Recommendations",
                    detail: "Prone paddling: ~54 min/h at 70–75% VO₂max demands strong lat + rhomboid endurance; recommended: cable rows, prone DB rows, pull-ups; explosive pop-up: plyometric box work; balance: single-leg BOSU, balance board",
                    color: .blue)
                sciRow(icon: "moon.fill", title: "Recovery from Big Sessions",
                    detail: "Full-day surf sessions (4–6h): significant rotator cuff fatigue (Johnson 2008: EMG amplitude declines 20% after 2h); 48h shoulder rest recommended; contrast therapy (hot/cold) reduces soreness in 24h",
                    color: .purple)
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
            Text("Recent Sessions")
                .font(.headline)
                .padding(.horizontal)

            ForEach(Array(sessions.prefix(5)), id: \.uuid) { session in
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(session.startDate, style: .date)
                            .font(.subheadline).fontWeight(.medium)
                        Text(sessionType(session))
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 3) {
                        Text(formatDuration(session.duration))
                            .font(.subheadline).fontWeight(.medium)
                            .foregroundStyle(.cyan)
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
        case 10800...: return "Big Session"
        case 5400..<10800: return "Full Session"
        case 2700..<5400: return "Dawn Patrol"
        default: return "Quick Surf"
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

        let predicate = HKQuery.predicateForWorkouts(with: .surfingSports)
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

        var weekData: [WeeklySurfData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklySurfData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        DispatchQueue.main.async { self.isLoading = false }
    }
}
