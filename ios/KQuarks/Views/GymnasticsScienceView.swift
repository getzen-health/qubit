import SwiftUI
import HealthKit

struct GymnasticsScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .purple)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .pink)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .blue)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Strength-to-Weight & Physical Demands",
                    icon: "figure.gymnastics",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Iron cross: 8.9 N·m/kg shoulder torque",
                               detail: "Gogu 2015 (biomechanics of gymnastics): the iron cross on still rings requires shoulder abduction torque of 8.9 N·m/kg body mass — approximately 3× higher than the maximum achievable in elite powerlifters relative to body weight. This represents the highest weight-normalised shoulder torque in any sport. Elite male gymnasts maintain this position for 2–3 s minimum for code score; training to achieve it requires 3–5 years of progressive ring strength training."),
                        sciRow(stat: "Muscle fibre: 60–70% fast-twitch in elite gymnasts",
                               detail: "Maffiuletti 2011: gymnasts demonstrate 60–70% Type II (fast-twitch) fibre composition in major muscle groups, enabling explosive power output for vaulting and tumbling. Simultaneously, elite gymnasts possess extraordinary relative strength: grip strength 80–90 kg for men's artistic gymnasts averaging 65–70 kg body mass. The gymnast's physique represents the optimal power-to-weight ratio in human sport — estimated peak mechanical power of 4,000–5,500 W during vault run-up."),
                        sciRow(stat: "Landing forces: 10–14× body weight on dismounts",
                               detail: "McNitt-Gray 1993: dismount landing forces in artistic gymnastics reach 10–14× body weight — among the highest repetitive ground reaction forces in sport. Knee and ankle joint contact forces during double-back somersault landings: 8–10× BW. Landing technique (progressive joint flexion, foot-hip-shoulder alignment) reduces peak force 30–40% versus stiff landings. Gymnastics training introduces 20,000–30,000 high-impact landings per year in elite pre-pubescent gymnasts."),
                        sciRow(stat: "VO₂max: 55–62 mL/kg/min for artistic gymnasts",
                               detail: "Sands 2013 (gymnastics physiology review): elite artistic gymnasts VO₂max = 55–62 mL/kg/min for men, 48–55 mL/kg/min for women — higher than expected given the sport's anaerobic nature, reflecting the aerobic demands of floor routines and extended training sessions. Rhythmic gymnastics: VO₂max 55–62 mL/kg/min; acrobatic gymnastics: 52–58 mL/kg/min. Energy systems: floor routines (70–90 s) are approximately 60–70% anaerobic during peak tumbling sequences.")
                    ]
                )

                scienceCard(
                    title: "Flexibility, Mobility & Injury Science",
                    icon: "figure.flexibility",
                    color: .pink,
                    rows: [
                        sciRow(stat: "Hip flexion: 160–180° in elite gymnasts",
                               detail: "Herrington 2013: elite gymnasts achieve active hip flexion of 160–180° — well beyond the typical elite athlete range of 120–140°. This extreme range is acquired through systematic progressive stretching over 8–12 years starting in childhood, predominantly through plastic deformation of joint capsule and connective tissue rather than pure muscle elongation. Passive hip abduction ('splits') in elite gymnasts: 180°+. These ranges are largely non-transferable to adult-onset training due to the reduced plasticity of adult connective tissue."),
                        sciRow(stat: "Wrist: most common injury site (37% of all injuries)",
                               detail: "Bradshaw 2012 (gymnastics injury registry): wrist injuries account for 37% of all time-loss injuries in men's artistic gymnastics — primarily distal radial growth plate stress reactions (DRU stress fractures) in adolescent gymnasts from high-load compressive and shear forces during pommel horse and floor tumbling. Wrist pain prevalence in competing gymnasts: 56–88%. Gripping mechanics, wrist-guard use, and periodic unloading weeks are primary prevention strategies."),
                        sciRow(stat: "Spondylolysis: 11–32% in elite gymnasts",
                               detail: "Motley 2002: lumbar spondylolysis (stress fracture of the pars interarticularis) prevalence in elite gymnasts: 11–32% — versus 6% in the general athletic population. The extreme lumbar extension requirements of gymnastics (back walkovers, arabesques, dismount arching) create repetitive hyperextension loading at L5–S1. Bilateral spondylolisthesis (stress fracture with vertebral slippage) requires cessation of gymnastics loading for 3–6 months. MRI recommended over X-ray for early detection."),
                        sciRow(stat: "RED-S: 30–50% of female gymnasts energy deficient",
                               detail: "Relative Energy Deficiency in Sport (RED-S, formerly Female Athlete Triad) prevalence in aesthetic sports gymnastics: 30–50% meet energy deficiency criteria. Consequences: bone stress injury (stress fractures 2–3× higher than non-gymnasts), hormonal suppression (low oestrogen → decreased bone density), and impaired immune function. Aesthetic scoring pressures create environment for disordered eating. Recommended screening: DXA bone density, hormonal panel, and dietary assessment at annual sports physicals for artistic and rhythmic gymnasts.")
                    ]
                )

                scienceCard(
                    title: "Skill Acquisition & Motor Learning",
                    icon: "brain.head.profile",
                    color: .blue,
                    rows: [
                        sciRow(stat: "10,000+ training hours to Olympic standard",
                               detail: "Ericsson 1993 applied to gymnastics: Olympic-standard gymnasts accumulate 10,000–15,000 hours of deliberate training practice, typically beginning at ages 4–7 for women and 6–9 for men. Critical sensitive periods for motor skill plasticity: proprioceptive and vestibular development peaks at ages 8–12 in both sexes. Early technical instruction in fundamental movement patterns (handstand, cartwheel, round-off) creates the biomechanical foundation on which advanced skills are built — adult gymnasts learning these from scratch face significantly greater injury risk during acquisition."),
                        sciRow(stat: "Mental rehearsal: 15–20% skill improvement in 2 weeks",
                               detail: "Feltz 2013 (mental imagery in gymnastics): structured mental rehearsal programmes (20–30 min/day of kinesthetic imagery focusing on body position and spatial orientation) improve skill execution scores 15–20% in 2 weeks for skills already physically acquired. This exceeds the improvement from equivalent additional physical practice alone. Elite gymnasts routinely use performance imagery during competition warm-up: full routine mental run-through reduces execution errors 12% in competition vs. non-imagery conditions."),
                        sciRow(stat: "Vestibular adaptation: desensitisation to angular rotation",
                               detail: "Berthoz 1988: gymnasts perform 50–150 rotational elements per training day, requiring progressive vestibular desensitisation. Elite gymnasts show 70% reduction in vestibular nystagmus response (involuntary eye movement after rotation) vs. non-athletes — achieved through systematic adaptation of the otolith-canal reflex arc. This allows execution of multiple somersaults without spatial disorientation. The adaptation is sport-specific and does not transfer to other rotational contexts (e.g., pilots do not benefit from gymnastics training)."),
                        sciRow(stat: "Coaching feedback: augmented feedback every 3rd repetition optimal",
                               detail: "Wulf 2010 (motor learning applied to gymnastics coaching): augmented coaching feedback (verbal or video) provided after every repetition impairs long-term skill retention vs. feedback given every 3rd–5th repetition ('faded feedback' schedule). Over-feedback creates dependency on external error correction and prevents development of internal error detection mechanisms. Elite gymnastics coaching has transitioned from continuous verbal correction to post-set or post-routine review, consistent with motor learning theory.")
                    ]
                )

                scienceCard(
                    title: "Acrobatics, Vault & Power Science",
                    icon: "bolt.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Tsukahara vault: peak force 19× BW on horse",
                               detail: "Krug 2008: vault contact forces on the springboard: 3–5× body weight over 80–120 ms; horse contact forces during Tsukahara entry: 15–19× body weight over 40–60 ms — the highest rate-of-force-development event in gymnastics. Run-up velocity for men's vault: 7.5–8.5 m/s. Springboard energy storage and return: elastic deformation stores 60–80% of run-up kinetic energy for vertical conversion. Post-flight angular momentum determines number of somersaults and twists — set entirely during horse contact phase."),
                        sciRow(stat: "Floor routine: 7,000–9,000 W peak power in tumbling",
                               detail: "King 2015: floor exercise tumbling passes generate peak mechanical power of 7,000–9,000 W (normalised: 95–130 W/kg body mass) — among the highest power outputs in human sport. Quadruple twisting double back somersault (Silivas): peak angular velocity 1,800°/s in twist axis; somersault angular velocity 650°/s simultaneously. Flight phase duration for double twisting double: 0.85–1.10 s. Energy source: 90–95% anaerobic (PCr + glycolytic) for individual tumbling passes; aerobic contribution critical for 90-second routine endurance."),
                        sciRow(stat: "Balance beam: sway amplitude <1.5 cm in elite",
                               detail: "Golomer 1999: elite balance beam specialists maintain centre-of-pressure sway amplitude of <1.5 cm on a 10 cm wide beam during quasi-static balance elements — compared to 3–4 cm on a wide surface for elite athletes in other sports. Postural control strategy: ankle-dominant at low frequencies, hip-dominant at higher frequencies. Fear of height (acrophobia) on 125 cm high beam: managed through progressive exposure in 6-stage protocols (floor, 5 cm, 10 cm, 20 cm, 60 cm, competition height). Mental representation of beam width matches 1–2 m surface after extensive training.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Gymnastics Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

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
        let gymnastics = workouts.filter { $0.workoutActivityType == .gymnastics }
        let sessions = gymnastics.count
        let totalHR = gymnastics.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = gymnastics.map { $0.duration / 60 }.reduce(0, +)
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
