import SwiftUI
import HealthKit

struct DownhillSkiingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .cyan)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .white)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Biomechanics & Force Production",
                    icon: "figure.skiing.downhill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Peak G-forces: 3–4 G in giant slalom turns",
                               detail: "Müller 2000 (J Appl Biomech): carving turns generate 3–4 G centripetal forces at peak loading. Skiers maintain edge angles of 65–75° during GS turns to maximize lateral force. Speed ranges: 80–140 km/h in downhill, 40–60 km/h in slalom. Knee joint loading reaches 5–7× body weight during high-speed carved turns — primary driver of ACL stress and cartilage fatigue."),
                        sciRow(stat: "Leg muscle activation: eccentric quad dominance",
                               detail: "Hintermeister 1997 (Med Sci Sports Exerc): VMO and VL demonstrate highest activation during edge control and turn initiation — up to 80–100% MVC during dynamic carving. Isometric contractions dominate the tuck position (sustained 30–60% MVC). Fatigue accumulates progressively across a run as glycolytic demand increases. The hip-knee-ankle kinetic chain requires coordinated eccentric control from gluteus maximus through to tibialis anterior for optimal edge stability."),
                        sciRow(stat: "Slalom turn: 0.3–0.5 s gate-to-gate timing",
                               detail: "Raschner 2013 (Scand J Med Sci Sports): elite slalom racers complete gate-to-gate cycles in 0.3–0.5 s. Pole timing initiates upper-body counter-rotation, while hip angulation (lateral tilt toward the slope) keeps center of mass inside the arc. Hip counter-rotation (separation between upper and lower body) reduces rotational inertia and accelerates edge-to-edge transition. Transition time between edges < 0.15 s discriminates elite from sub-elite."),
                        sciRow(stat: "Aerodynamic drag: tuck reduces drag 40–50%",
                               detail: "Brodie 2008 (Sports Technol): a fully crouched downhill tuck position reduces the drag coefficient (CdA) by 40–50% compared to upright skiing. At 130 km/h, drag force in tuck ≈ 30–40 N vs 60–80 N upright — translating directly to 10–15 km/h speed differential. Optimal tuck: arms forward, back flat, knees at ~90°, helmet chin on hands. Micro-variations in tuck posture produce measurable time differences over a 2-minute downhill course.")
                    ]
                )

                scienceCard(
                    title: "Physiological Demands",
                    icon: "heart.fill",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "VO₂max: 58–68 mL/kg/min for alpine racers",
                               detail: "Hydren 2013 (J Strength Cond Res): World Cup alpine skiers average VO₂max 58–68 mL/kg/min (male), 52–60 mL/kg/min (female). Aerobic demands are highest in training volume (repetitive 60–90 s runs) rather than single race efforts. Blood lactate peaks at 8–12 mmol/L post-slalom, 5–8 mmol/L post-downhill — reflecting higher glycolytic demand in technical disciplines due to repeated high-intensity muscular contractions."),
                        sciRow(stat: "Race HR: 85–95% HRmax in 45–120 s race",
                               detail: "Ferguson 2014 (Int J Sports Physiol Perform): race HR reaches 85–95% HRmax within the first 10 s of slalom (45–60 s total) and remains elevated throughout. Anaerobic contribution dominates slalom (PCr + glycolytic ≈ 65% of energy), while downhill (100–125 s) shifts to ~50% aerobic. Super-G and GS fall between these extremes. Post-race PCr depletion occurs in < 10 s of maximal effort; glycolytic rate determines whether performance is maintained across the full run."),
                        sciRow(stat: "Cold exposure: metabolic rate increase 10–20%",
                               detail: "Castellani 2006 (Compr Physiol): sustained exposure to temperatures of −5°C to −20°C on alpine courses increases resting metabolic rate 10–20% via shivering thermogenesis. Muscle temperature at the start gate may be 2–4°C below optimal (37°C), reducing maximal force output 5–10% and muscle relaxation speed. Cold-induced vasoconstriction reduces blood flow to working muscle, impairing lactate clearance and contributing to faster local fatigue. Appropriate warm-up in cold conditions is performance-critical."),
                        sciRow(stat: "Altitude effects: most World Cup venues at 1,500–2,500 m",
                               detail: "Gore 2001 (J Appl Physiol): World Cup venues (Kitzbühel, Val Gardena, Bormio) sit at 1,500–2,500 m above sea level, where VO₂max is reduced 5–10% per 1,000 m gain. Anaerobic power is relatively preserved at these altitudes but aerobic capacity declines measurably. Full acclimatisation requires 2–3 weeks; partial benefit in 5–7 days. SpO₂ typically falls to 93–96% at 2,000 m — significant for skiers conducting high-intensity training. Altitude training camps are standard pre-season protocol for World Cup teams.")
                    ]
                )

                scienceCard(
                    title: "Injury Science & Prevention",
                    icon: "bandage.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "ACL injury: 35–40% of all alpine skiing injuries",
                               detail: "Bere 2014 (Br J Sports Med, FIS injury surveillance): ACL rupture represents 35–40% of all competitive alpine skiing injuries. Two primary mechanisms: the 'phantom foot' (boot-induced ACL, hip flexed, knee twisted inward during backward fall with ski tip catching) and catching an inside edge creating sudden dynamic valgus. Binding release systems are tuned for edge-catch forces but may not release in phantom-foot mechanism. ACL incidence: 8–10 per 1,000 ski-days in alpine competition, 3–5× higher than recreational skiing."),
                        sciRow(stat: "Head injuries: helmet reduces concussion risk 60%",
                               detail: "Sulheim 2006 (JAMA): helmet use in skiing reduces head injury risk by 60% and severe head injury risk by 72%. MIPS (Multi-directional Impact Protection System) technology reduces rotational acceleration transmitted to the brain by 25–40% in oblique impacts — the most common head injury vector in falls. Impact velocities in high-speed skiing falls: 15–25 m/s; gate contact forces: up to 3 kN. FIS mandated helmet use in all alpine disciplines from 2000; ongoing research evaluates neck collar devices for further protection."),
                        sciRow(stat: "Knee valgus: most common technique-related injury pattern",
                               detail: "Ettlinger 1995 (Am J Sports Med): dynamic knee valgus during skiing arises from boot stiffness mismatches, footbed alignment, and fatigue-related technique breakdown. Custom orthotics and precision insole alignment correct hindfoot pronation that contributes to valgus collapse in the ski boot. Proprioceptive training in ski-specific balance boards and wobble discs improves joint position sense in ski boots. Skiers with > 5° resting valgus alignment have 2.3× higher ACL risk."),
                        sciRow(stat: "Training injury rate: pre-season dryland 3× higher than on-snow",
                               detail: "Spörri 2012 (Br J Sports Med): injury incidence during pre-season off-snow dryland training is 3.0–3.5× higher than during the on-snow competition season. High-intensity plyometric protocols (box jumps, depth jumps), gym-based maximal strength sessions, and early-season agility drills carry disproportionate ACL and lower limb injury risk when sport-specific neuromuscular patterns have not yet been activated. Progressive gym-to-snow transfer, starting with low-impact movement patterns before adding plyometric loads, reduces this risk substantially.")
                    ]
                )

                scienceCard(
                    title: "Training Science & Performance",
                    icon: "chart.bar.fill",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Strength: leg press 3.5–4.5× body weight for elite",
                               detail: "Neumayr 2003 (J Strength Cond Res): elite alpine skiers demonstrate leg press 1RM of 3.5–4.5× body weight; recreational skiers average 1.5–2.5×. Eccentric strength (quad eccentric / concentric ratio > 1.3) is more predictive of slalom performance than concentric strength alone. Inter-limb asymmetry > 15% in dominant vs non-dominant leg predicts increased injury risk. Hip abductor and core strength are underappreciated determinants of edge control and lateral force production."),
                        sciRow(stat: "Dryland training: 200+ hours before snow season",
                               detail: "Behm 2005 (Can J Appl Physiol): World Cup alpine programs prescribe 200–250 hours of dryland conditioning before first snow contact. Key components: plyometric lateral hops (simulating slalom edge-to-edge transitions), slide board training (lateral power + coordination), slalom simulation runs, video analysis sessions, and progressive strength loading. A structured 6-month pre-season includes 3 phases: general fitness (months 1–2), sport-specific strength (months 3–4), and power/speed conversion (months 5–6)."),
                        sciRow(stat: "Mental preparation: visualization reduces error rate 12–18%",
                               detail: "Gallwey 2003 (inner game) + Vealey 2007 (mental skills): systematic mental rehearsal reduces technical error rate during races by 12–18% in alpine skiing. Course inspection and imagery (skiers mentally rehearse every gate while physically walking the course pre-race) allows pre-programming of movement sequences. Arousal management in the start gate — using controlled breathing (4-7-8 technique) — reduces pre-race cortisol spike by ~15%. Elite skiers spend 10–15 min in active imagery before race starts."),
                        sciRow(stat: "Wax and equipment: 0.5–1.5% speed differential from tuning",
                               detail: "Nachbauer 2016 (Procedia Eng): ski preparation science produces measurable speed differentials of 0.5–1.5% from base preparation and waxing alone — translating to 0.3–1.8 s over a 2-minute downhill course. Temperature-specific fluorocarbon wax selection (cold wax < −10°C; warm wax > −4°C; universal −4° to −10°C) critically affects kinetic friction. Base structure (micro-groove pattern) optimises water film management at the ski-snow interface. Edge sharpness (1°–3° side bevel angle) determines carving precision and grip on hard-packed course surfaces.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Downhill Skiing Science")
        .toolbarTitleDisplayMode(.inline)
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
        let skiing = workouts.filter { $0.workoutActivityType == .downhillSkiing }
        let sessions = skiing.count
        let totalHR = skiing.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = skiing.map { $0.duration / 60 }.reduce(0, +)
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
