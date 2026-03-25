import SwiftUI
import HealthKit

struct ArcheryScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .green)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .purple)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Precision Biomechanics & Shot Execution",
                    icon: "scope",
                    color: .green,
                    rows: [
                        sciRow(stat: "Olympic 10-ring: 12.4 cm diameter at 70 m",
                               detail: "World Archery regulations: Olympic recurve target at 70 m has a 10-ring (gold) diameter of 12.4 cm, subtending a visual angle of 0.10°. Elite archers achieve 30/36 scores (10+9 rings) in 72-arrow rounds — a mean grouping of <4 cm at 70 m. Arrow flight time: 350–400 ms for a 240-grain arrow at 200+ fps. Physical tremor in the aiming bow arm averages 2–4 mm lateral movement in elite archers — managed by trained muscular co-contraction and timing of the clicker (draw length trigger) to shoot at a moment of minimal sway."),
                        sciRow(stat: "Back tension: 20–25 kg draw force, 28–30 inch draw",
                               detail: "Leroyer 1993 (Olympic archery biomechanics): recurve bow draw weight for elite: 18–24 kg (40–53 lbs) at 28–30 inch draw length. Primary muscles: scapular retractors (rhomboids, middle trapezius, serratus posterior): 70% of draw force; rotator cuff external rotators (infraspinatus, teres minor): 20%; biceps brachii: 10%. Muscle activation is maintained isometrically for 2–4 seconds between full draw and clicker-triggered release — a high-demand sustained hold under tremor management pressure."),
                        sciRow(stat: "Heart rate: shot timed in cardiac diastole",
                               detail: "Sillero 2014: elite archers develop the ability to time arrow release during cardiac diastole — the 0.4 s phase when heart muscle relaxation minimises transmitted cardiovascular tremor to the bow arm. This reduces shot-to-shot grouping scatter 8–12% compared to random release timing. Resting HR for elite archers: 48–58 bpm (trained vagal tone). Pre-shot HR increase (adrenaline response at competition): 15–25 bpm above resting; elite archers show smaller competition-induced HR elevation (better arousal regulation) vs. recreational."),
                        sciRow(stat: "Arrow paradox: arrow flexes around the riser at release",
                               detail: "Kooi 1994 (classical archer's paradox physics): at release, stored bow energy is transferred to the arrow in <2 ms, generating peak arrow acceleration of ~1,500 m/s². The arrow's shaft temporarily flexes laterally 10–20 mm (the 'archer's paradox') as it passes the bow's riser, then oscillates longitudinally 3–5 times before stabilising during flight. Arrow spine (stiffness) must match bow draw weight precisely — too stiff: arrow kicks left; too flexible: arrow kicks right. Tuning eliminates paradox effects by optimising spine-to-draw-weight matching.")
                    ]
                )

                scienceCard(
                    title: "Mental Performance & Focus Science",
                    icon: "brain.head.profile",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Quiet eye: 0.7 s pre-shot fixation on gold",
                               detail: "Vickers 2007 (quiet eye in precision sports): elite archers maintain a stable final aiming fixation (quiet eye) of 0.7–1.2 s on the gold before trigger/release, vs. 0.3–0.5 s in intermediate archers. Longer quiet eye predicts score accuracy (r=0.68). Quiet eye duration is trainable: 6-week QE training programme (video feedback + verbal cuing to extend fixation) improved elite archer scores 4–6% — meaningful in a discipline where hundredths of centimetres determine placements."),
                        sciRow(stat: "EEG: alpha waves increase 18% in final 3 s before release",
                               detail: "Landers 1994 (EEG in Olympic archery): alpha wave power in left temporal cortex increases 18–22% in the final 3 seconds before release in expert archers — reflecting motor quietude and suppression of verbal-analytical processing. Novice archers show decreased alpha (increased cortical activation = overthinking). Mindfulness-based archery coaching explicitly targets this neural state: 'think less, feel more' — reducing self-instructed conscious control and allowing motor automaticity to execute the technically rehearsed shot sequence."),
                        sciRow(stat: "Choking under pressure: HR >20 bpm above baseline",
                               detail: "Beilock 2010 (applied to precision sports): performance breakdown under competition pressure ('choking') in archery correlates with HR elevation >20 bpm above practice baseline — reflecting arousal exceeding the optimal performance zone. Choking mechanism: redirected attentional resources to explicit monitoring of normally automatic motor sequences (grip, anchor, draw), disrupting procedural memory execution. Intervention: pressure training (training with audience, financial incentives, video recording) reduces performance-anxiety HR elevation 30–40% over 8 weeks."),
                        sciRow(stat: "Breathing: timed to respiratory pause for lowest tremor",
                               detail: "Nishizono 1987: optimal arrow release timing within the respiratory cycle is during the natural pause between exhalation and inhalation — a 1–2 s window of lowest respiratory-transmitted tremor. Elite archers hold breath during final aim and release in this post-expiratory pause. This reduces vertical bow-arm tremor amplitude 30–45% vs. mid-inhalation release. Competitive athletes train explicit breath control: 3 preparatory breaths → half-exhalation → pause → draw → aim → release, with each phase having defined timing.")
                    ]
                )

                scienceCard(
                    title: "Compound vs Recurve Physiology",
                    icon: "chart.bar.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Compound: 90% let-off = 6–9 kg holding weight at full draw",
                               detail: "Compound bow physics: cam system provides 65–90% let-off, meaning a 30 kg peak draw weight requires only 3–9 kg holding force at full draw vs. 30 kg continuously in recurve. This reduces muscular fatigue 75–80% during the aiming phase, enabling more stable aim and longer sustainable training volumes. Draw cycle: smooth increase to peak weight → cam rollover → rapid let-off to holding weight → holding phase (indefinite with training) → release. Physical requirement shifts from muscular endurance to postural stability and trigger control."),
                        sciRow(stat: "Compound peep sight: <2 mm tolerance at 50m",
                               detail: "World Archery compound specifications: peep sight diameter 0.5–4 mm; target face 6 cm 10-ring at 50m (vs. 12.4 cm at 70m for recurve). Combined with mechanical release aid (vs. fingers), this creates extraordinarily tight groupings: elite compound archers achieve groups of <2 cm at 50m (1 mm tolerance per arrow). Physical factors: forearm and wrist stability for consistent release activation; trigger pull weight 60–250 g (adjustable). Compound archery physiology: 40% lower physical demand than recurve; mental performance is the dominant discriminator."),
                        sciRow(stat: "Field archery: cardiovascular demands add VO₂ component",
                               detail: "Field archery courses: archers hike 3–5 km across varied terrain between targets at unknown distances (10–60 m). Cardiovascular demand: HR 65–80% HRmax during inter-target movement; returning to 55–65% during shooting. VO₂max 45–55 mL/kg/min adequate for field archery. Physical fitness allows stable platform after exertion: field archers with VO₂max >50 mL/kg/min recover sufficiently (HR <70% HRmax) within 60–90 s of arrival at the target peg — threshold for acceptable shooting stability."),
                        sciRow(stat: "Para-archery: adaptive classifications",
                               detail: "World Archery Para classification: Standing (minimal disability), W1 (wheelchair, upper and lower limb), W2 (wheelchair, lower limb only). W1 archers use mouth tabs or chin support for draw — triceps and shoulder extension substituting for standard draw mechanics. Chin/mouth support archers: thoracic stability replaces scapular retraction as primary physical demand. Physical screening: grip strength, shoulder ER strength, and trunk stability are evaluated in classification. Adaptive equipment: bow support frames, sight adjusters, and custom releases accommodate upper limb differences.")
                    ]
                )

                scienceCard(
                    title: "Equipment Physics & Arrow Ballistics",
                    icon: "wrench.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Arrow velocity: 200–240 fps recurve, 280–320 fps compound",
                               detail: "WA equipment regulations: recurve arrows 18–25 grains/inch; compound arrows 5 grains/inch minimum. Recurve arrow speed: 200–240 fps (60–73 m/s) at 70m; compound: 280–320 fps (85–97 m/s) at 50m. Kinetic energy at target: recurve ~10 J; compound ~25 J. Arrow drop over 70m for recurve: 1.8–2.4 m below line of sight — requiring 2–3° of sight elevation. Wind correction: 1.5–2.5 cm per km/h crosswind for recurve; compound is less affected due to higher velocity and heavier arrows."),
                        sciRow(stat: "String vibration: dampeners reduce post-release oscillation",
                               detail: "Lienhard 2018 (vibration analysis): bow string vibration post-release (the 'string oscillation' phase) generates 50–150 Hz mechanical oscillation transmitted to the bow grip. Without dampening: grip vibration amplitude 3–5 mm; with modern dampeners (rubber/polymer absorbers): reduced to <1 mm. Counter-intuitively, higher string vibration (less dampening) is not correlated with reduced accuracy if the bow rests properly during follow-through — the arrow has left the bow within 15 ms of release, before vibration effects accumulate. Dampeners primarily reduce noise and subjective 'hand shock' rather than accuracy."),
                        sciRow(stat: "Sight magnification: Olympic = open ring; compound = 6× scope",
                               detail: "Olympic recurve rules prohibit optical magnification — sights use a single pin or aperture system with no magnification. Compound can use up to 6× magnification scope with level and clarifier lens. Effect on precision: compound scopes enable consistent sight picture and reduce aim point scatter 40–50% vs. equivalent pin sight. This equipment advantage contributes to compound scoring 5–8% higher than recurve at equivalent distances. Recurve sight alignment: eye-to-peep (if used) to sight ring to gold — three points aligned with the aiming eye in 100–300 ms during final aim phase.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Archery Science")
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
        let archery = workouts.filter { $0.workoutActivityType == .archery }
        let sessions = archery.count
        let totalHR = archery.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = archery.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = sessions
            avgHR = sessions > 0 ? totalHR / Double(sessions) : 0
            avgDurationMin = sessions > 0 ? totalDur / Double(sessions) : 0
            isLoading = false
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(.title2, design: .rounded, weight: .bold)).foregroundColor(color)
            Text(label).font(.caption2).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 10)
        .background(Color(.secondarySystemBackground)).cornerRadius(10)
    }

    private func scienceCard(title: String, icon: String, color: Color, rows: [AnyView]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon).font(.headline).foregroundColor(color)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in row }
        }
        .padding().background(Color(.secondarySystemBackground)).cornerRadius(14).padding(.horizontal)
    }

    private func sciRow(stat: String, detail: String) -> AnyView {
        AnyView(VStack(alignment: .leading, spacing: 3) {
            Text(stat).font(.subheadline).fontWeight(.semibold)
            Text(detail).font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
