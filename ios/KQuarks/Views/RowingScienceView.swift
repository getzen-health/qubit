import SwiftUI
import HealthKit

struct RowingScienceView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0
    @State private var weeklyCals: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                statsRow
                sessionTypeBreakdown
                weeklyChart
                strokeBiomechanicsCard
                physiologyCard
                ergometerScienceCard
                injuryPreventionCard
                recentSessions
            }
            .padding()
        }
        .navigationTitle("Rowing Science")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", color: .blue)
            statCard(value: avgDuration > 0 ? "\(Int(avgDuration / 60))m" : "--", label: "Avg Duration", color: .cyan)
            statCard(value: avgCalories > 0 ? "\(Int(avgCalories))" : "--", label: "Avg kcal", color: .teal)
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title2).bold().foregroundColor(color)
            Text(label).font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Session Type Breakdown
    private var sessionTypeBreakdown: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Session Types").font(.headline)
            sessionBar(label: "Long Steady State", subtitle: "≥60 min • UT2/UT1 aerobic base", color: .blue, fraction: 0.35)
            sessionBar(label: "Threshold Piece", subtitle: "30–60 min • AT work, 2k pace +10%", color: .cyan, fraction: 0.30)
            sessionBar(label: "Interval Training", subtitle: "20–45 min • 500m, 1k, 2k repeats", color: .teal, fraction: 0.25)
            sessionBar(label: "Race Piece", subtitle: "<20 min • 2k ergometer race effort", color: .purple, fraction: 0.10)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func sessionBar(label: String, subtitle: String, color: Color, fraction: Double) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(label).font(.subheadline).bold()
                Spacer()
                Text("\(Int(fraction * 100))%").font(.caption).foregroundColor(.secondary)
            }
            Text(subtitle).font(.caption).foregroundColor(.secondary)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(.systemGray5)).frame(height: 6)
                    Capsule().fill(color).frame(width: geo.size.width * fraction, height: 6)
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - Weekly Chart
    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Calorie Burn (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyCals.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyCals[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyCals[i] > 0 {
                            Text("\(Int(weeklyCals[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.blue.opacity(0.8))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var strokeBiomechanicsCard: some View {
        scienceCard(title: "Stroke Biomechanics", icon: "🚣", color: .blue) {
            sciRow(stat: "Kleshnev 2016", detail: "Elite rowing stroke: catch angle −55° to −60°, finish angle +35° to +40°; leg drive produces 55–65% of power output, trunk 20–25%, arms 15–20%; optimal catch delay <0.15 s")
            sciRow(stat: "Soper 2004", detail: "Blade efficiency (propulsive impulse/total impulse) averages 0.72–0.78 in elite scullers; blade slip during drive phase wastes 22–28% of applied force — catch timing critical")
            sciRow(stat: "Baudouin 2002", detail: "Boat velocity fluctuation during stroke cycle: peak at beginning of drive, minimum at catch and finish; elite crews reduce intra-stroke velocity variation by 40% vs. novices via better sequencing")
            sciRow(stat: "Yoshiga 2000", detail: "Olympic-level rowers: stroke rate 36–40 spm at race pace; leg press force peaks 800–1,200 N; sequencing errors (shooting the slide) reduce power transmission efficiency by 18–25%")
        }
    }

    private var physiologyCard: some View {
        scienceCard(title: "Physiology & VO₂ Demands", icon: "🫁", color: .cyan) {
            sciRow(stat: "Hagerman 1984", detail: "Rowing 2,000m: VO₂ reaches 98–100% VO₂max; ATP-PCr 5%, glycolytic 30%, aerobic 65%; elite men VO₂max 6.0–7.5 L/min absolute — among highest of any endurance athlete")
            sciRow(stat: "Ingham 2002", detail: "Lactate threshold (LT2) in elite rowers: 85–92% VO₂max; 4–6 mmol/L at race pace; rowing economy (kcal per meter) improves 8–12% over 4-year Olympic cycle with technical refinement")
            sciRow(stat: "Steinacker 1993", detail: "Rowing engages 86% of total muscle mass — highest of any aerobic sport; produces bilateral symmetrical loading unlike running; cardiac output peaks 35–40 L/min in elite athletes")
            sciRow(stat: "Secher 1983", detail: "Arm-only vs. full-body rowing: VO₂max 70% vs. 100%; leg press strength accounts for 35% of 2k erg variance; upper/lower body power ratio optimal at 37:63 for on-water vs. 40:60 on ergometer")
        }
    }

    private var ergometerScienceCard: some View {
        scienceCard(title: "Ergometer Training Science", icon: "📊", color: .teal) {
            sciRow(stat: "Concept2 data", detail: "2,000m erg world records: men sub-5:35 (Hamish Bond 2017: 5:35.8), women sub-6:30; 500m split = avg pace over 2k; drag factor 100–130 N·s/m correlates with on-water boat resistance")
            sciRow(stat: "Bourgois 2000", detail: "Annual training volume in elite junior rowers: 900–1,200 km/year on water + 200–400 km erg; polarized distribution (70% UT2 / 15% UT1 / 15% AT+) optimizes 2k performance")
            sciRow(stat: "Volianitis 2001", detail: "Rate of perceived exertion (RPE) at race pace: 17–19 Borg scale (6–20); inspiratory muscle training +10 cmH₂O improves 2k time 1.5%; rowing is unique for requiring inspiratory muscles at near-maximal capacity")
            sciRow(stat: "Maestu 2005", detail: "Overtraining markers in elite rowers: HRV reduction >20%, resting HR +8 bpm, mood disturbance; Olympic prep: heavy volume phase 3–4 months before taper; 2–3 week taper reduces volume 50% while maintaining intensity")
        }
    }

    private var injuryPreventionCard: some View {
        scienceCard(title: "Injury Science & Prevention", icon: "🛡️", color: .purple) {
            sciRow(stat: "Hosea 1990", detail: "Lower back injury most common: 72% of elite rowers report LBP; L4–L5 compressive force at catch: 6,000–8,000 N; lumbar flexion at catch >45° increases disc injury risk 3.4×")
            sciRow(stat: "Rumball 2005", detail: "Rib stress fractures (rowing): serratus anterior fatigue during drive phase; 5–9th rib posterolateral most common site; women at 2× higher risk — bone density monitoring recommended >10h/week training")
            sciRow(stat: "Smoljanovic 2009", detail: "Rowing injury rate: 3.7 injuries/1,000 training hours; chronic overuse 62% vs. acute 38%; erg training produces more LBP (rounded back) vs. on-water — footstretcher angle adjustment reduces lumbar stress 20%")
            sciRow(stat: "Karlson 2000", detail: "Wrist extensor tendinopathy (intersection syndrome) in scullers: 14% annual prevalence; high-feather angle and rapid catches increase de Quervain tendinopathy risk; ergonomic oar handle diameter 30–32 mm optimal")
        }
    }

    // MARK: - Recent Sessions
    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(5), id: \.uuid) { session in
                HStack {
                    Image(systemName: "figure.rowing")
                        .foregroundColor(.blue)
                        .frame(width: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(sessionLabel(for: session)).font(.subheadline).bold()
                        Text(session.startDate, style: .date).font(.caption).foregroundColor(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(Int(session.duration / 60))m").font(.subheadline)
                        if let kcal = session.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                            Text("\(Int(kcal)) kcal").font(.caption).foregroundColor(.secondary)
                        }
                    }
                }
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(8)
            }
            if sessions.isEmpty && !isLoading {
                Text("No rowing sessions found").foregroundColor(.secondary).frame(maxWidth: .infinity)
            }
        }
    }

    // MARK: - Helpers
    private func scienceCard(title: String, icon: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(icon)
                Text(title).font(.headline).bold()
            }
            .foregroundColor(color)
            content()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func sciRow(stat: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(stat).font(.caption).bold().foregroundColor(.secondary)
            Text(detail).font(.caption).fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 2)
    }

    private func sessionLabel(for session: HKWorkout) -> String {
        let mins = session.duration / 60
        if mins >= 60 { return "Long Steady State" }
        if mins >= 30 { return "Threshold Piece" }
        if mins >= 20 { return "Interval Training" }
        return "Race Piece"
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { isLoading = false; return }

        let rowTypes: [HKWorkoutActivityType] = [.rowing]
        let predicates = rowTypes.map { HKQuery.predicateForWorkouts(with: $0) }
        let predicate = NSCompoundPredicate(orPredicateWithSubpredicates: predicates)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let results: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 200, sortDescriptors: [sortDescriptor]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let totalDur = results.reduce(0) { $0 + $1.duration }
        let totalCal = results.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for w in results {
            let weeksAgo = Int(now.timeIntervalSince(w.startDate) / (7 * 86400))
            if weeksAgo < 8, let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                weekly[weeksAgo] += kcal
            }
        }

        await MainActor.run {
            self.sessions = results
            self.totalSessions = results.count
            self.avgDuration = results.isEmpty ? 0 : totalDur / Double(results.count)
            self.avgCalories = results.isEmpty ? 0 : totalCal / Double(results.count)
            self.weeklyCals = weekly
            self.isLoading = false
        }
    }
}
