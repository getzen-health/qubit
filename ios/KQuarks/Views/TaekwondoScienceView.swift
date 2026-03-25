import SwiftUI
import HealthKit

struct TaekwondoScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .red)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .gray)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Kicking Biomechanics",
                    icon: "figure.martial.arts",
                    color: .red,
                    rows: [
                        sciRow(stat: "Turning kick: 4,200–5,600 N, foot velocity 12–14 m/s",
                               detail: "Estevan 2013 (TKD biomechanics): rear-leg turning kick (dollyo chagi) at world championship level generates 4,200–5,600 N peak force. Hip abduction → external hip rotation → knee extension → ankle plantarflexion kinetic chain. Hip rotation angular velocity: 800–1,200°/s as primary force generator. World champion athletes generate 25% higher peak force than national-level competitors through superior hip rotation mechanics."),
                        sciRow(stat: "Back kick: highest linear kick velocity, 14–16 m/s",
                               detail: "Mechanically strongest TKD kick: rear leg back kick (dwi chagi) utilising full hip extension. Foot velocity 14–16 m/s; peak force potential 5,000–6,800 N. Rarely used in competition due to visual telegraph — primarily used as counter technique when opponent rushes forward."),
                        sciRow(stat: "Spinning heel kick (dwi hurigi): 540° rotation in 0.4 s",
                               detail: "Complex spinning technique: 360° body rotation + 180° heel arc. Angular momentum conservation, visual target tracking during rotation, timing of heel strike at maximum angular velocity. Increasingly used at elite level as surprise attack. Biomechanical study: Pearson 2001."),
                        sciRow(stat: "Jump kicks: 60+ cm height adds 2–3 m/s foot velocity",
                               detail: "Aerial kick mechanics: jump height contributing additional gravitational potential converted to rotational velocity. Jump turning kick (twie dollyo chagi): elite male athletes achieve 75–90 cm jump height, adding 2.5–3.5 m/s foot velocity at impact. Olympic scoring system values jump kicks +1 point for spinning, +2 for jumping.")
                    ]
                )

                scienceCard(
                    title: "Competition Science & Scoring",
                    icon: "trophy.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Reaction time: 80–120 ms kick initiation to counter-attack",
                               detail: "TKD-specific reaction time demands: defensive-to-offensive transition. Expert TKD athletes initiate counter-kick 80–120 ms after detecting opponent kick — comparable to badminton and tennis reaction demands. Anticipation from trunk lean and hip initiation cues: 200–250 ms advance warning available to trained observer. Falco 2009."),
                        sciRow(stat: "Electronic scoring: 48–50 N threshold at trunk protector",
                               detail: "World Taekwondo (WT) electronic scoring system: trunk protector sensors require 48–50 N to register point. Kick force at competition: 200–600 N average, well above threshold but variable with angle and contact area. Calibration issues: sensor face vs. side impacts. Head kick: manual judging + sensor."),
                        sciRow(stat: "Match intensity: 85–95% HRmax, blood lactate 8–12 mmol/L",
                               detail: "Heller 1998 (TKD competition physiology): Olympic-format matches (3 × 2 min rounds) generate HR 85–95% HRmax and post-match lactate 8–12 mmol/L. Aerobic and anaerobic systems both critical. VO₂max: 55–65 mL/kg/min for Olympic-level competitors. Significant rest (1 min between rounds) insufficient for full lactate clearance."),
                        sciRow(stat: "Weight categories: 8 divisions from –49 kg to +80 kg",
                               detail: "Weight management science in TKD: 30–40% of competitors cut weight before competition. Acute dehydration for weigh-in → rapid rehydration. Performance implications similar to judo and wrestling weight cutting research. Same-day weigh-in (WT rule change 2017) has partially reduced extreme cutting.")
                    ]
                )

                scienceCard(
                    title: "Physical Conditioning",
                    icon: "heart.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "Flexibility: 170–190° hip external rotation range elite",
                               detail: "Hip flexibility requirements for head-height kicks, dynamic flexibility vs. static flexibility distinction, PNF stretching for kick amplitude, hip flexor length for chamber height. Research: Kazemi 2005 (TKD athlete profiling)."),
                        sciRow(stat: "Speed training: kicking combinations at 6–8 kicks/second",
                               detail: "High-speed combination sequences (3–5 kick combinations in <1 s), reaction training devices, speed bag equivalents in TKD (kick target pads), partner reaction training. Neural adaptation: 8-week speed training improved kick speed 12–15% in RCT."),
                        sciRow(stat: "Strength asymmetry: 10–15% dominant vs. non-dominant leg",
                               detail: "Kick force asymmetry between preferred and non-preferred leg in TKD athletes. Training implications: bilateral strength training to reduce asymmetry, non-preferred leg technical development, competition strategy for disguising non-preferred leg."),
                        sciRow(stat: "Injury prevention: ankle and knee most common (25–35%)",
                               detail: "Ankle sprains (22–28%) and knee ligament injuries (12–18%) dominate TKD injury profile. Falls from failed jump kicks. Head and face injuries: 15–20% despite helmet; ear injury from head kicks. Groin strain: 8–12% from extreme hip abduction kicks.")
                    ]
                )

                scienceCard(
                    title: "Mental Performance & Training",
                    icon: "brain.head.profile",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Poomsae (forms): precision-focused branch, different psychology",
                               detail: "TKD poomsae (Olympic sport since Paris 2024): predetermined movement sequences judged on accuracy, power, and rhythm. Different mental demands from sparring — motor programme execution vs. reactive combat. EEG research shows different neural activation patterns."),
                        sciRow(stat: "Pre-competition routine: 20–30 min warm-up essential for explosive performance",
                               detail: "Neuromuscular warm-up for TKD: dynamic hip mobility, progressive kicking speed, pad work, sprint activations. Cold muscle: maximum kick speed 15–20% reduced vs. fully warmed. Competition environment warm-up area management."),
                        sciRow(stat: "Decision-making training: scenario-based defensive/offensive drills",
                               detail: "Video-based anticipation training (opponent body position → predict attack type) improves counter-attack timing 15–20% in 6-week intervention. Pattern recognition library development through systematic sparring analysis."),
                        sciRow(stat: "Elite development: average age of world championship medals: 22–26",
                               detail: "Career trajectory in TKD: peak competition age 20–28, with some extending to 30+. Early development: poomsae base at 8–14, competitive sparring 14+. Korean national programme: dedicated training centres from age 15. Long-term athlete development frameworks.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Taekwondo Science")
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
        let tkd = workouts.filter { $0.workoutActivityType == .martialArts }
        let sessions = tkd.count
        let totalHR = tkd.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = tkd.map { $0.duration / 60 }.reduce(0, +)
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
