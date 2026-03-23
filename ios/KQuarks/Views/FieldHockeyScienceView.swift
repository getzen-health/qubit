import SwiftUI
import HealthKit

struct FieldHockeyScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .orange)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .green)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Running Profile & GPS Demands",
                    icon: "figure.hockey",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Elite players: 9–13 km per match",
                               detail: "Jennings 2012 (GPS, international field hockey): elite players cover 9–13 km per match on synthetic turf. High-intensity running (>18 km/h): 2,000–3,500 m per match. Positional differences: midfielders highest total distance (11–13 km); defenders 9–10 km; forwards 9–11 km but highest sprint count. Match format: 4 × 15-minute quarters (since 2014 rule change), creating clear intensity variations between quarters."),
                        sciRow(stat: "Sprint efforts: 40–60 maximal sprints per match",
                               detail: "Macutkiewicz 2011: elite field hockey players perform 40–60 sprint efforts per match. Sprint duration: 2–4 s. Repeated sprint ability (RSA) test: 6 × 30 m sprints with 20 s recovery — elite performance <4.5 s per sprint. High-intensity running represents 18–22% of total match distance. Work:rest ratio approximately 1:3 overall but 1:1 during intense phases."),
                        sciRow(stat: "Match intensity: 82–91% HRmax across quarters",
                               detail: "MacLeod 2007: heart rate during elite field hockey sustained at 82–91% HRmax. Blood lactate: 4–7 mmol/L. VO₂max requirements: midfielders 60–68 mL/kg/min; defenders/forwards 55–63 mL/kg/min. Quarter 3 typically shows highest HR (accumulated fatigue + tactical intensity). Synthetic turf vs. natural grass: turf increases total distance 8–12% due to more consistent surface."),
                        sciRow(stat: "Goalkeeper: explosive lateral demands, 15–30 saves per match",
                               detail: "Penalty corners (15–20 per match average): goalkeeper must react to drag-flick shots within 90–110 ms. Goalkeeper HR: 75–88% HRmax — lower than field players but with extreme peak intensities during set pieces. Leg pad weight: 4–6 kg per leg, significantly increasing metabolic cost of movement.")
                    ]
                )

                scienceCard(
                    title: "Stick Skill Biomechanics",
                    icon: "bolt.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Drag flick: 130–150 km/h at penalty corner",
                               detail: "Chivers 2011 (drag-flick biomechanics): penalty corner drag-flick injection generates ball speeds of 130–150 km/h from the top of the circle. Kinetic chain: run-up → low stick position → sweeping drag motion → wrist snap at release. Flicker's approach velocity: 5–7 m/s contributing 30–35% of total ball speed. Wrist radial deviation at release generates final acceleration."),
                        sciRow(stat: "Hit: peak ball speed 160–180 km/h in slap-hit technique",
                               detail: "The 3D hit (hockey-specific flat-stick strike): trunk rotation 400–500°/s, shoulder internal rotation, wrist snap generating 160–180 km/h. Reverse-stick reverse hit: increasingly used in modern hockey — opposite side of blade, enabling attacking from all angles. Stick weight: 500–560 g with J-hook head design creating specific aerodynamic and contact properties."),
                        sciRow(stat: "Aerial pass: parabolic trajectory over 40+ m",
                               detail: "3D game evolution: aerial balls (lifted passes) requiring recipients to control balls dropping at 12–15 m/s. Catching mechanics on the move, stick presentation angle for trap, body repositioning. Aerial balls now used in 25–35% of transitions in elite international hockey."),
                        sciRow(stat: "Dribbling: Indian dribble (left-right stick rotation)",
                               detail: "The traditional Indian dribble (alternating forehand-backhand stick rotation while running): stick rotation frequency 4–6 Hz in elite dribblers, evasion of pressure, ball protection mechanics. Modern 3D skills: lifts, 'jink' moves, toe drag — requiring wrist pronation-supination at 400–600°/s.")
                    ]
                )

                scienceCard(
                    title: "Physical Conditioning & Injury",
                    icon: "heart.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "ACL injury: 3–5 per 100 player-seasons",
                               detail: "Malisoux 2015: synthetic turf increases ACL injury risk 20–30% vs. natural grass — higher traction, altered foot-surface interface. Field hockey ACL mechanisms: cutting/pivoting under defensive pressure, stick checking distraction. Female players: 2–3× higher ACL rate than male players. Prevention: Nordic hamstring program reduces ACL risk 50% in randomised controlled trials."),
                        sciRow(stat: "Shoulder injuries: 15–20% from stick contact",
                               detail: "Upper extremity injuries from stick contact, high velocity ball impact (160+ km/h), and overhead trapping. Goalkeeper-specific: wrist and hand injuries from shot blocking. Dental injuries: mouthguard compliance significantly reduces dental trauma from stick/ball contact."),
                        sciRow(stat: "Lower back: lumbar flexion demands from stick grip position",
                               detail: "Chronic lower back pain in 35–45% of elite field hockey players — attributable to sustained trunk flexion during play (stick must contact ground-level ball). Ergonomic research suggests 40° forward trunk lean as a prolonged postural stressor. Core strengthening and periodic postural reset protocols recommended."),
                        sciRow(stat: "Turf burns: abrasive synthetic surface injuries",
                               detail: "Synthetic Astroturf abrasion injuries affecting 60–70% of players per season. Prevention: compression garments, padded shin guards extending beyond knee. Infection risk from abrasion wounds on artificial surface. Skin protection protocols in elite environments.")
                    ]
                )

                scienceCard(
                    title: "Tactical & Team Science",
                    icon: "chart.bar.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Penalty corner: 25–30% of goals scored from set pieces",
                               detail: "Set piece conversion rates in elite international hockey: penalty corners convert at 22–32% of injections. Injector run-up speed → flicker timing → deflection/shot coordination. Defensive slide timing: 0.8–1.0 s from injection to shot — requiring coordinated team rush."),
                        sciRow(stat: "High press: GPS shows increased high-intensity distance 15%",
                               detail: "Modern pressing tactics in field hockey, high press requiring 15% more high-intensity running than mid-block defence. Counter-press immediately after ball loss. Physical requirements of sustained pressing: RSA and high aerobic capacity."),
                        sciRow(stat: "Self-pass rule (2009): transformed game speed and attacking play",
                               detail: "The self-pass rule allowing direct self-pass from free hits transformed tactical tempo, increasing game speed and reducing stoppages. Average ball-in-play time increased 12–15% post-rule change. Physical consequence: higher sustained intensity."),
                        sciRow(stat: "Video analysis: elite teams use 400–600 clips per week for review",
                               detail: "Modern performance analysis in field hockey: GPS data combined with video, heat maps, pressing triggers, transition speed analysis. Physical data informing tactical decisions — high-load players tactically rotated in high-press sequences.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Field Hockey Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: now) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let hockey = workouts.filter { $0.workoutActivityType == .hockey }
        let sessions = hockey.count
        let totalHR = hockey.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = hockey.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = sessions
            avgHR = sessions > 0 ? totalHR / Double(sessions) : 0
            avgDurationMin = sessions > 0 ? totalDur / Double(sessions) : 0
            isLoading = false
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(.title2, design: .rounded, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    private func scienceCard(title: String, icon: String, color: Color, rows: [AnyView]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundColor(color)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in row }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    private func sciRow(stat: String, detail: String) -> AnyView {
        AnyView(VStack(alignment: .leading, spacing: 3) {
            Text(stat).font(.subheadline).fontWeight(.semibold)
            Text(detail).font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
