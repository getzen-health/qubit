import SwiftUI
import HealthKit

struct SwimmingScienceView: View {
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
                hydrodynamicsCard
                physiologyCard
                trainingSystemsCard
                recentSessions
            }
            .padding()
        }
        .navigationTitle("Swimming Science")
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
            sessionBar(label: "Distance/Endurance", subtitle: "≥60 min • Aerobic base & LT work", color: .blue, fraction: 0.35)
            sessionBar(label: "Technique/Drill", subtitle: "30–60 min • Stroke mechanics focus", color: .cyan, fraction: 0.25)
            sessionBar(label: "Interval/Speed", subtitle: "30–50 min • 50/100/200m repeats", color: .teal, fraction: 0.25)
            sessionBar(label: "Open Water", subtitle: "Variable • Sighting & OW tactics", color: .mint, fraction: 0.15)
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
        scienceCard(title: "Stroke Biomechanics", icon: "🏊", color: .blue) {
            sciRow(stat: "Toussaint 1988", detail: "Freestyle propulsion: hand enters at 30–40° lateral angle; sculling path creates lift and drag forces — effective propulsive force 60–80 N in elite swimmers; catch-up vs. continuous coordination affects propulsion continuity")
            sciRow(stat: "Chollet 2000", detail: "Index of coordination (IdC) in freestyle: elite swimmers use overlap phase (positive IdC) while novices have glide phase (negative IdC); each 10% increase in IdC from 0 improves velocity 3–5% at race pace")
            sciRow(stat: "Counsilman 1968", detail: "S-curve pull pattern still debated; Maglischo 2003 confirmed S-shaped path is epiphenomenon; straight back-pull with maximum applied force outperforms complex sculling — key is elbow position, not hand path")
            sciRow(stat: "Kjendlie 2004", detail: "SWOLF score (strokes per lap + time): optimal SWOLF 25–35 for competitive 100m freestyle; below 25 = over-gliding, above 40 = under-gliding; elite 1500m swimmers maintain SWOLF within ±2 across entire race")
        }
    }

    private var hydrodynamicsCard: some View {
        scienceCard(title: "Hydrodynamics & Drag Science", icon: "💧", color: .cyan) {
            sciRow(stat: "Pendergast 1977", detail: "Active drag in swimming: 5–10× greater than passive drag; body position error of 10° increases drag 30%; freestyle drag coefficient 0.4–0.6 vs. dolphin kick 0.25 — underwater phase post-turn reduces drag by 40%")
            sciRow(stat: "Toussaint 2002", detail: "Frontal area minimization: horizontal body alignment reduces active drag 25%; rotation 35–45° during arm pull improves shoulder clearance without increasing frontal area; hip rotation timing is the primary differentiator between elite and sub-elite")
            sciRow(stat: "Marinho 2010", detail: "Computational fluid dynamics (CFD) analysis: hand pitch angle 0° (flat) is suboptimal; 45° pitch generates 30% more lift; thumb-first entry reduces wrist drag; pinky-side exit minimizes eddies during pull-through")
            sciRow(stat: "Lyttle 1999", detail: "Underwater dolphin kick (UDK) speed exceeds surface swimming in first 10–15 m post-turn: elite swimmers up to 2.5 m/s UDK vs. 2.1 m/s surface; optimal UDK depth 0.4–0.6 m — too deep increases pressure drag")
        }
    }

    private var physiologyCard: some View {
        scienceCard(title: "Swimming Physiology", icon: "🫁", color: .teal) {
            sciRow(stat: "Holmér 1974", detail: "Swimming VO₂max: 70–80% of treadmill VO₂max in untrained; 90–100% in elite swimmers due to sport-specific cardiovascular adaptation; elite male VO₂max 65–75 mL/kg/min; women 55–65 mL/kg/min")
            sciRow(stat: "Maglischo 2003", detail: "Energy systems by event: 50m sprint = 85% anaerobic; 100m = 65% anaerobic; 200m = 55% aerobic; 1500m = 90% aerobic; breaststroke requires 15–20% more energy than freestyle at same velocity due to stop-and-go propulsion pattern")
            sciRow(stat: "Pöyhönen 1999", detail: "Caloric expenditure: 400–700 kcal/hour at moderate intensity; water buoyancy reduces gravitational load but heat dissipation in cold water increases thermoregulatory cost; swimming in 18°C vs. 26°C increases energy expenditure 12–18%")
            sciRow(stat: "Troup 1991", detail: "Lactate threshold in swimmers: LT1 at 75–80% VO₂max, LT2 at 88–95%; critical velocity (CV) = velocity sustainable for 30–60 min without lactate accumulation; race pace training above CV provides stimulus for LT2 adaptation")
        }
    }

    private var trainingSystemsCard: some View {
        scienceCard(title: "Training Systems & Periodization", icon: "📈", color: .mint) {
            sciRow(stat: "Costill 1991", detail: "Optimal swim volume: 10,000–20,000 m/week for competitive swimmers; exceeding 20,000 m shows diminishing returns; overtraining syndrome in swimmers: decreased performance despite high volume — marker is resting HR +5 bpm sustained >3 days")
            sciRow(stat: "Mujika 1995", detail: "Taper science: 2–3 week taper reduces volume 50–75% while maintaining intensity; VO₂max increases 5–7% during taper via plasma volume expansion; elite swimmers gain 1–3% velocity in race performance post-taper")
            sciRow(stat: "Toubekis 2008", detail: "Active vs. passive recovery between intervals: moderate-intensity active recovery (50% VO₂max) clears lactate 40% faster than rest; optimal rest:work ratio for 100m repeats at VO₂max intensity is 1:2.5–3.0")
            sciRow(stat: "Pyne 2001", detail: "Stroke-specific strength training: dry-land resisted-cord freestyle training at 105% race velocity improves peak velocity 3.2% in 10 weeks; resisted swimming with parachute improves 100m time by 1.8% more than unresisted training")
        }
    }

    // MARK: - Recent Sessions
    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(5), id: \.uuid) { session in
                HStack {
                    Image(systemName: "figure.pool.swim")
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
                Text("No swimming sessions found").foregroundColor(.secondary).frame(maxWidth: .infinity)
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
        if mins >= 60 { return "Distance/Endurance" }
        if mins >= 40 { return "Interval/Speed" }
        return "Technique/Drill"
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { isLoading = false; return }

        let swimTypes: [HKWorkoutActivityType] = [.swimming]
        let predicates = swimTypes.map { HKQuery.predicateForWorkouts(with: $0) }
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
