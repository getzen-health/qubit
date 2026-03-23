import SwiftUI
import HealthKit

struct SnowboardingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .purple)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .orange)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .cyan)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Halfpipe & Freestyle Physics",
                    icon: "figure.snowboarding",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Halfpipe air: 5–7 m above lip at Olympic level",
                               detail: "Olympic-standard halfpipes are 22 feet (6.7 m) wall height (FIS specification). Athletes achieve 5–7 m above the lip using launch velocities of 14–18 m/s at takeoff. Gravitational potential energy at peak height: mgh = 70 kg × 9.81 × 6 m ≈ 4,120 J. Shaun White's 2018 Olympic gold run averaged 6.1 m air above lip; Ayumu Hirano's 2022 Beijing gold run peaked at 7.2 m on back-to-back 1440° attempts. Higher amplitude directly increases time aloft for rotation completion — every extra 0.5 m of air provides ≈0.1 s additional hang time."),
                        sciRow(stat: "Rotation: 1440° (4 full rotations) in competition",
                               detail: "Angular momentum L = Iω is conserved once airborne. Athletes initiate spin on the lip with angular velocity, then manipulate moment of inertia I by tucking (reducing I → increasing ω for faster rotation) and extending limbs for landing (increasing I → reducing ω for controlled touchdown). Frontside spins rotate toward the heel edge; backside toward the toe edge — different muscle activation patterns and visual reference cues. 1440° (4 full rotations) is the current competition benchmark; Hirano debuted the 1620° in 2022. Axis of rotation shifts from vertical (spins) to horizontal (flips) in McTwist and double-cork variants."),
                        sciRow(stat: "Rail/jib impact forces: 2–3× body weight",
                               detail: "Ground reaction forces during park feature landings reach 2–3× body weight (1,400–2,100 N for 70 kg rider), measured via force plate studies. Nose and tail press mechanics require isometric loading of ankle and knee extensors to maintain board contact angle. Wrist injuries constitute 25–30% of all snowboard injuries, with forward-fall impact the primary mechanism. Wrist guards (hard-shell dorsal splint type) reduce distal radius fracture incidence by approximately 80% (Idzikowski 2000, n=3,213). Landing mechanics: dorsiflexion absorption reduces knee valgus collapse during jump landings — a key injury prevention target in park riding."),
                        sciRow(stat: "Speed events (boardercross): 60–80 km/h with terrain features",
                               detail: "Boardercross (SBX) is a race discipline: 4–6 riders simultaneously navigating berms, rollers, jumps, and flat sections at 60–80 km/h. Aerodynamic drag dominates at these speeds — tuck position reduces frontal area from ~0.6 m² (upright) to ~0.35 m² (race tuck), cutting drag force 42%. Berm turns require centripetal force generation: banked angle allows lateral component of normal force to provide turn force, enabling higher cornering speed than flat turns. Jump sequencing strategy — absorb (compress on takeoff face) vs. pop (extend for air) — trades air time for ground speed. Pack riding tactics include drafting (reducing drag 15–20%), strategic blocking, and gate positioning.")
                    ]
                )

                scienceCard(
                    title: "Biomechanics & Balance",
                    icon: "figure.stand",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Stance asymmetry: front foot 15° angled creates unique biomechanics",
                               detail: "Snowboard binding angles define stance orientation: duck stance (e.g. +15°/−15°) places both feet angled outward symmetrically for freestyle; forward stance (e.g. +21°/+6°) aligns hips more toward the nose for alpine/freeride. Unlike skiing, the snowboarder's hips never fully align with the board direction — creating a permanent offset that demands asymmetrical hip external rotation (lead hip) and internal rotation (rear hip). Regular stance (left foot forward) vs. goofy (right foot forward) results in mirror-image muscle development asymmetry: lead-side vastus medialis and rear-side hip abductors are typically more developed. Knee tracking challenges arise from the toe-out angle inducing valgus stress on the lead knee during heelside turns."),
                        sciRow(stat: "Carving: edge angles 60–75° in high-performance turns",
                               detail: "High-performance carving achieves edge angles of 60–75° from vertical (measured as the angle between the board and snow surface). Toeside turns engage ankle dorsiflexion and tibialis anterior activation to tip the board onto the toe edge; heelside turns require ankle plantarflexion and strong posterior tibialis engagement. Hard-boot alpine snowboarding (plate bindings) allows greater ankle dorsiflexion angles (25–35°) than soft-boot freestyle setups (12–20°), enabling higher centripetal forces. Pressure distribution shifts between front and back foot to control turn radius — front-foot pressure initiates/tightens turns; rear-foot pressure extends/completes them. Centripetal force in a carved turn: F = mv²/r; at 50 km/h with r = 10 m, F ≈ 540 N (0.78× body weight)."),
                        sciRow(stat: "Wrist injuries: 25–30% of all snowboard injuries",
                               detail: "Wrist injuries are the most common snowboard injury, representing 25–30% of all presentations (Hagel 2004, systematic review). The mechanism is the forward fall protective reflex: falling forward at speed triggers an automatic wrist extension + pronation response as the hand contacts snow, loading the distal radius in dorsiflexion. Triangular fibrocartilage complex (TFCC) injuries result from rotational loading at impact. Biomechanically, hard-shell wrist guards function as load distributors — redirecting impact force from wrist joint to forearm shaft. Learning phase shows highest wrist injury incidence (beginners: 50% higher rate than advanced riders). Expert injury patterns shift toward knee and shoulder injuries as riding speed and terrain difficulty increase."),
                        sciRow(stat: "Head/neck: helmet reduces severe injury 60%",
                               detail: "Snowboard helmet use reduces the risk of head injury by 35–60% depending on impact type (Haider 2012, meta-analysis n=4,000+ injuries). Halfpipe and big-air disciplines carry highest head injury risk from backward falls — the rider cannot see the landing approach and cannot brace effectively. MIPS (Multi-directional Impact Protection System) helmets reduce rotational acceleration transmitted to the brain by 40% compared to standard EPS helmets in oblique impacts. Neck musculature loading during aerial landings: cervical extensors and deep neck flexors absorb landing shock transmitted up the spine. Co-contraction of neck muscles 50–100 ms before anticipated impact (pre-activation) reduces concussion risk — a trainable response developed through experience.")
                    ]
                )

                scienceCard(
                    title: "Physiological Demands",
                    icon: "heart.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "VO₂max: 52–62 mL/kg/min for halfpipe specialists",
                               detail: "Halfpipe snowboarders tested at altitude training camps show VO₂max values of 52–62 mL/kg/min (Turnbull 2009), comparable to alpine ski racers but lower than endurance athletes. Aerobic capacity serves primarily to sustain hiking energy expenditure, recover at chairlift altitude between runs, and support the sustained muscular demands of repeated run attempts (8–12 qualifying runs in competition format). Individual halfpipe run duration: 45–75 seconds of high-intensity effort. Average HR during runs: 80–92% HRmax. Between-run HR recovery to <70% HRmax at chairlift altitude (typically 1,800–2,500 m) requires greater aerobic capacity than sea-level riding."),
                        sciRow(stat: "Anaerobic demands: park/halfpipe 85–95% HRmax",
                               detail: "Phosphocreatine (PCr) system provides the primary energy for jump takeoffs (0–3 s explosive effort) with peak power demands of 800–1,200 W. Each halfpipe run involves 6–8 wall hits at near-maximal explosive intensity. Lactate accumulation becomes significant after the 3rd–4th wall hit, contributing to the 'arm pump' and coordination degradation seen late in runs. Slopestyle runs (10–15 features in 50–60 s) show blood lactate of 6–10 mmol/L post-run. Recovery at chairlift altitude (hypoxic environment) is delayed compared to sea level — O₂ delivery to recovering muscles is reduced 8–12% at 2,200 m altitude, extending PCr resynthesis time from ≈3 min to ≈4 min."),
                        sciRow(stat: "Core stability: fundamental for rotation control",
                               detail: "Trunk rotational stability is the physical foundation of aerial snowboarding. Transverse abdominis and internal obliques provide segmental spinal stability during twisting takeoffs; spinal erectors maintain upright posture under impact landing forces; hip rotators (piriformis, gemelli, obturator) generate and absorb rotational forces at binding interface. EMG studies of aerial skiing — closely analogous to halfpipe snowboarding — show transverse abdominis pre-activates 80–120 ms before jump takeoff, indicating central nervous system-driven feed-forward stabilisation. Perturbation training (balance board with unexpected disturbances) has been shown to improve trunk stabilisation response speed by 20–35% in 8-week programmes, directly translating to more consistent aerial axis control."),
                        sciRow(stat: "Altitude performance: competitions at 1,800–2,500 m",
                               detail: "Major snowboard competitions (World Cup halfpipe, slopestyle, big air) occur at 1,800–2,500 m altitude. At 2,200 m, barometric pressure ≈ 76 kPa, reducing inspired O₂ partial pressure to ≈159 × 0.76 = 121 mmHg (vs. 159 mmHg at sea level) — approximately 24% hypoxic deficit. SpO₂ in unacclimatised athletes: 90–93% at 2,200 m vs. 98–99% at sea level. Acclimatisation protocols for snow sports: 3–7 days at altitude produces erythropoietin (EPO) increase, reticulocyte elevation after 4–5 days, and haematocrit rise after 7–10 days. Live high–train low (LHTL) strategies using altitude tents (2,500–3,000 m simulated) for 8–10 hours/night improve sea-level VO₂max 2–4% and competition-altitude performance 3–5%.")
                    ]
                )

                scienceCard(
                    title: "Training Science",
                    icon: "chart.bar.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Dry-slope/trampoline training: 50% of elite aerial skill development",
                               detail: "Elite halfpipe and big-air snowboarders spend approximately 50% of skill development time in off-snow environments (Dubravcic-Simunjak 2006). Trampoline training is the primary tool for rotation mechanics — athletes can complete 100+ repetitions per session vs. 10–15 on snow, accelerating motor learning through mass practice. Foam pit progression (from trampoline directly into foam pit, then to airbag, then to snow) provides a safe failure environment for learning new tricks, following a structured progressive difficulty framework. Dry slope carving on artificial snow (Dendix or Snowflex) maintains edge-setting mechanics in summer. Video-only analysis of trampoline vs. on-snow kinematics shows 85–90% technique correspondence for rotational tricks, validating off-snow training fidelity."),
                        sciRow(stat: "Strength: posterior chain focus for landing absorption",
                               detail: "Landing absorption from halfpipe and jump landings requires eccentric strength across ankle, knee, and hip extensors. Peak knee flexion angles of 90–120° during hard landings demand high eccentric quadriceps and glute capacity. Romanian deadlift (RDL) is the foundational exercise: targets biceps femoris, gluteus maximus, and spinal erectors in the landing-specific hinge pattern. Single-leg work (Bulgarian split squat, single-leg RDL, pistol squat progressions) addresses stance asymmetry and bilateral strength imbalances common in snowboarders. Balance board training (wobble board, Indo Board) during lower-body exercises increases proprioceptive demand, matching on-snow instability. Plyometric progressions (drop landings → depth jumps → maximal bounds) develop reactive strength index (RSI) — the key metric for landing absorption efficiency."),
                        sciRow(stat: "Balance training: balance board improves on-snow performance 15–20%",
                               detail: "A 6-week balance board training programme (3 sessions/week, 20 min/session) improved on-snow slalom performance by 15–20% in competitive junior snowboarders (Nardone 2007). Proprioceptive mechanisms: mechanoreceptors in ankle ligaments (Golgi tendon organs, Ruffini endings) detect board inclination changes and trigger corrective muscle activation. Unstable surface training on BOSU and wobble boards increases ankle and knee stabiliser co-activation patterns that transfer to edge-angle adjustments on snow. Medial-lateral ankle stability is particularly critical for heelside turns where limited ankle plantar flexion (constrained by boot shell) requires greater tibialis anterior pre-tension to prevent edge-wash. Unilateral balance training (single-leg stance, eyes closed >60 s) on the snowboard-specific lead leg is strongly recommended."),
                        sciRow(stat: "Video analysis: frame-by-frame for rotation mechanics",
                               detail: "High-speed video analysis (240–480 fps) is the standard coaching tool for halfpipe and freestyle snowboarding. Frame-by-frame review allows measurement of: takeoff angle and axis of rotation initiation, peak tuck ratio (minimum moment of inertia configuration), landing phase joint angles, and board-axis alignment at snow contact. Joint angle measurement via 2D video digitisation achieves ±5° accuracy, sufficient for coaching feedback but below research-grade 3D motion capture (±1–2°). Self-modelling methodology — where athletes repeatedly watch video of their best successful attempts rather than failure analysis — has been shown to accelerate skill acquisition 25–30% compared to error-focused review (Dowrick 1999). Optimal feedback frequency: reduced-frequency video feedback (every 3rd attempt) produces better long-term retention than immediate feedback after every attempt.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Snowboarding Science")
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
        let snowboarding = workouts.filter { $0.workoutActivityType == .snowboarding }
        let sessions = snowboarding.count
        let totalHR = snowboarding.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = snowboarding.map { $0.duration / 60 }.reduce(0, +)
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
