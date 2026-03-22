import SwiftUI
import HealthKit

struct ClimbingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .brown)
                    statCard(value: avgHR > 0 ? String(format: "%.0f", avgHR) : "--", label: "Avg HR bpm", color: .orange)
                    statCard(value: avgDurationMin > 0 ? String(format: "%.0f min", avgDurationMin) : "--", label: "Avg Duration", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Bouldering & Lead Climbing Physiology",
                    icon: "figure.climbing",
                    color: .brown,
                    rows: [
                        sciRow(stat: "Finger flexor strength: 2–3× body weight in elite boulderers",
                               detail: "MacLeod 2007: crimp strength (A2 pulley loading) in elite boulderers reaches 2–3× body weight. Full crimp position generates higher A2 pulley loading than two-finger pocket or half-crimp positions; finger flexor force normalised to body weight is the primary performance predictor (r=0.82 with grade). V15–16 grade demands require near-maximal forearm flexor recruitment with high specificity. Forearm extensor fatigue during sustained climbing contributes to pump onset through loss of antagonist joint stabilisation."),
                        sciRow(stat: "Forearm blood flow occlusion: pump in sustained routes",
                               detail: "Forearm arterial occlusion occurs at >40% maximum voluntary contraction (MVC) during sustained gripping. Ischaemic metabolism shifts energy production to glycolysis, causing 'pump' — a state where intramuscular pressure exceeds capillary perfusion pressure. Local blood lactate in the forearm reaches 12–18 mmol/L during sustained climbing, far above systemic levels. Reperfusion occurs at rest holds (knee bars, stemming). Campus board training develops power endurance by training the metabolic clearance rate at threshold intensity."),
                        sciRow(stat: "Lead climbing VO₂max: 52–62 mL/kg/min",
                               detail: "España-Romero 2009: aerobic demand of lead climbing on 40–60-minute routes requires oxygen consumption at 50–75% VO₂max, heart rate 75–88% HRmax. VO₂max in elite lead climbers: 52–62 mL/kg/min. System board training (45° overhang board sessions) demands intermittent aerobic output approaching 80–90% VO₂max, functioning as high-intensity interval training for forearm and systemic aerobic development simultaneously."),
                        sciRow(stat: "Body composition: <10% BF men, <16% BF women at elite level",
                               detail: "Power-to-weight ratio is critical in climbing because all weight must be moved upward against gravity. Weight carried directly impacts achievable grade: finger-force-to-body-weight ratio is the strongest individual performance predictor (r=0.82). Elite male competition climbers average <10% body fat; elite females <16%. Weight management strategies in competitive climbing require careful monitoring due to documented risk of relative energy deficiency in sport (RED-S), particularly in youth competition athletes.")
                    ]
                )

                scienceCard(
                    title: "Speed Climbing Science",
                    icon: "bolt.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Speed climbing world record: 4.79 s for 15m wall (men)",
                               detail: "Veddriq Leonardo set the men's world record of 4.79 s on the standardised 15m speed wall (Paris 2024). Average ascent speed: 3.1 m/s. Power output per step is enormous: peak forces estimated at 500–800 N per leg push at maximal velocity. Contact time per hold is under 100 ms — comparable to 100m sprint ground contact times (80–100 ms). Kinematics resemble sprint acceleration: trunk lean, explosive leg extension, and aggressive arm pull from identical hold positions memorised across thousands of attempts."),
                        sciRow(stat: "Step frequency: 18–22 holds in 5 s",
                               detail: "Elite speed climbers contact 18–22 holds in under 5 seconds. Individual hold contact duration: 80–130 ms. Force application per hold must be precisely directed to maintain momentum — any excess braking force costs time. The standardised identical route worldwide enables bilateral coordination patterns to become fully automatised. Athletes develop sport-specific neural drive patterns allowing explosive reactive force production at each hold without conscious movement planning."),
                        sciRow(stat: "Leg power: 80% of propulsion from lower limbs",
                               detail: "Biomechanical analysis shows lower limb extension contributes approximately 80% of upward propulsion in speed climbing. Leg extension forces: 500–800 N per push for elite athletes. Arm pull contribution provides the remaining 20%, primarily for body alignment and hold-transition mechanics. Ground reaction force measurement at standardised holds confirms the dominance of leg drive, contrasting with bouldering where upper body contribution is proportionally greater due to overhang geometry."),
                        sciRow(stat: "Training: 1,000+ route attempts for optimal automatisation",
                               detail: "Speed climbing is primarily a motor learning event: the route is identical worldwide, enabling complete movement automatisation through repetition. Elite athletes perform 1,000+ attempts on the standardised route to encode the movement sequence below the level of conscious control. Competition psychological pressure is extreme in an event decided in <5 s — false starts result in disqualification, demanding near-perfect arousal regulation. Mental performance under this pressure is trained through competition simulation and gradual exposure to high-pressure attempts.")
                    ]
                )

                scienceCard(
                    title: "Finger Injury Science",
                    icon: "bandage.fill",
                    color: .brown,
                    rows: [
                        sciRow(stat: "A2 pulley rupture: 30–40% of serious climbing injuries",
                               detail: "The ring finger A2 pulley is the most commonly injured climbing structure (30–40% of serious injuries). In full crimp position, A2 pulley loading reaches 6–10× the applied finger force due to mechanical disadvantage. Partial ruptures are more common than complete tears; diagnostic ultrasound is the gold standard for grading injury severity. Conservative return-to-climbing protocol: 6–12 weeks with H-taping (pulley unloading tape) and graduated load reintroduction. Surgery reserved for complete Grade IV ruptures with bowstringing deformity."),
                        sciRow(stat: "Epiphyseal plate stress in young climbers: growth plate injury",
                               detail: "Rohrbough 2000 and Schöffl 2013 documented Salter-Harris Type III epiphyseal (growth plate) fractures in competitive youth climbers before skeletal maturity. Intense crimp training before growth plate closure at approximately 15–16 years (proximal phalangeal physis) risks permanent deformity. Radiographic screening is recommended for symptomatic young climbers. UIAA Medical Commission load management guidelines: maximum 3 climbing sessions/week under age 14, avoid maximum-intensity crimping until skeletal maturity confirmed on X-ray."),
                        sciRow(stat: "Shoulder: 25% of climbing injuries, labrum and rotator cuff",
                               detail: "Overhead pulling demands in climbing generate high dynamic loading of the posterior glenohumeral capsule. SLAP (Superior Labrum Anterior to Posterior) lesion mechanism occurs during dynamic lock-off movements and catching dynamic moves. Rotator cuff pathology from repetitive shoulder flexion and adduction is common at elite level. Prevention: posterior capsule stretching (sleeper stretch), eccentric external rotator strengthening (90/90 position), and serratus anterior activation reduce shoulder injury incidence."),
                        sciRow(stat: "Prevention: antagonist training reduces injury rate 40–60%",
                               detail: "Climbing is an exclusively pulling sport generating severe flexor/extensor imbalance. Antagonist training (finger extensor strengthening with rubber band extension, reverse wrist curls, shoulder external rotation, push-up progressions) addresses this structural imbalance. Schöffl 2013 injury prevention data shows programmes incorporating antagonist exercises reduce overuse injury incidence 40–60% compared to climbing-only training. The UIAA and IFSC now include antagonist training in junior athlete development guidelines.")
                    ]
                )

                scienceCard(
                    title: "Competition Format & Mental Science",
                    icon: "brain.head.profile",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Bouldering: 4–5 problems, 4 min each, 2 min read time",
                               detail: "Olympic bouldering format: 4–5 boulder problems, each with 4-minute attempt window preceded by 2-minute read time. Athletes are held in isolation (no prior problem viewing) until their category starts. Tactics include attempt number management (minimising attempts to reach zone and top), timing of rests, and problem-reading visual analysis strategy. The psychological pressure of a compressed 4-minute window on an unfamiliar problem creates high-arousal conditions demanding specific mental preparation."),
                        sciRow(stat: "Lead climbing: onsight performance 2–4 grades below redpoint",
                               detail: "Olympic lead climbing is an onsight discipline: athletes receive 6-minute viewing time followed by a single attempt with no prior hands-on practice. Onsight performance in elite climbers is typically 2–4 grades below redpoint (pre-practised) level, reflecting the cognitive demands of simultaneously reading beta, managing fatigue, and executing unfamiliar movement sequences under competition pressure. Route reading strategy — sequence prediction, rest identification, clipping position — is a trainable skill that narrows the onsight-to-redpoint gap."),
                        sciRow(stat: "Flow state: optimal arousal at ~70% HRmax for complex movement",
                               detail: "Climbing-specific arousal research shows optimal performance in complex route-reading occurs near 70% HRmax, with performance degrading both below (under-activation, poor decision speed) and above (over-activation, overgripping). Fear of falling triggers sympathetic arousal causing overgripping — forearm grip tension increases 25–35% above technical optimum under fall anxiety, accelerating pump onset. Mental training interventions: controlled breathing (4-7-8 breathing cycles), progressive muscle relaxation, and fall practice normalisation directly reduce overgripping responses."),
                        sciRow(stat: "Visualisation: elite climbers visualise route 2–5× before attempting",
                               detail: "Kinaesthetic imagery (motor rehearsal without physical movement) is standard practice among elite competition climbers. Research shows elite climbers visualise the route 2–5 full times during read windows, mentally rehearsing movement sequences, foot placements, rest positions, and clipping stances. Beta memorisation through visualisation improves onsight performance 8–15% versus reading without structured visualisation. Visualisation quality (kinaesthetic vividness and internal perspective) predicts performance outcome better than visualisation duration alone.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Competition Climbing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: now)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let climbing = workouts.filter { $0.workoutActivityType == .climbing }
        let count = climbing.count
        let totalHR = climbing.compactMap {
            $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min"))
        }.reduce(0, +)
        let totalDur = climbing.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = count
            avgHR = count > 0 ? totalHR / Double(count) : 0
            avgDurationMin = count > 0 ? totalDur / Double(count) : 0
            isLoading = false
        }
    }

    // MARK: - Helpers

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
