import SwiftUI
import HealthKit

struct FencingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .gray)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .purple)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Blade Speed & Attack Biomechanics",
                    icon: "bolt.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Blade tip velocity: 25–35 m/s",
                               detail: "Roi & Bianchedi 2008 (Sports Med): fencing blade tip reaches 25–35 m/s (90–126 km/h) during attacks. Elite épéeists generate the highest tip velocity due to longer, heavier blades; sabre cuts can exceed 30 m/s. Tip velocity emerges from the kinetic chain: rear-leg extension force → hip drive → shoulder rotation → wrist snap."),
                        sciRow(stat: "Lunge biomechanics: rear-leg extension up to 3× body weight",
                               detail: "Turner 2011 (J Sports Sci): lunge rear-leg peak ground reaction force averages 2.8–3.2× body weight. Front foot touchdown occurs with a rapid heel strike — impact force 1.4–1.8× BW. Attack time from en garde to target: 150–300 ms for elite fencers, with sabre attacks fastest (150–180 ms) due to the right-of-way rules incentivising explosive first movement."),
                        sciRow(stat: "Sabre vs foil vs épée tactical profiles",
                               detail: "Gutierrez-Davila 2013 (J Hum Kinet): sabre prioritises explosive first action (right-of-way rule) — 86% of points won by the attacker. Foil also right-of-way but smaller target (torso only) demands precise line control. Épée has no right-of-way — simultaneous touches score for both. Épée fencers show the longest decision times (220–300 ms) due to whole-body valid target requiring threat assessment at more distances."),
                        sciRow(stat: "Biomechanical asymmetry from en garde stance",
                               detail: "Guilhem 2014 (Eur J Sport Sci): chronic en garde stance (dominant leg forward, ~60° knee flexion) produces measurable bilateral strength asymmetry — front quadriceps 12–18% stronger, rear hamstrings 14–22% stronger due to lunge propulsion demand. Ankle plantar flexors show 15–25% asymmetry. These imbalances persist for years and require targeted corrective training to reduce injury risk.")
                    ]
                )

                scienceCard(
                    title: "Reaction Time & Decision Science",
                    icon: "brain.head.profile",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Simple RT 150–180 ms; choice RT 220–320 ms in fencing context",
                               detail: "Borysiuk 2010 (Arch Budo): elite fencers' simple reaction time (single stimulus → single response) averages 150–180 ms, comparable to other elite combat sport athletes. However, fencing-specific choice reaction time — where the fencer must select the correct parry-riposte or counter-attack from multiple simultaneous stimuli — averages 220–320 ms. Elite vs sub-elite difference is largest in choice RT (40–60 ms gap), not simple RT."),
                        sciRow(stat: "Parry-riposte timing window: 100–200 ms",
                               detail: "Harmenberg 2007 (Int J Sports Physiol Perf): a successful parry must intercept an incoming attack within 100–200 ms from the moment of attack recognition. Given that fencer reaction time alone is ~200 ms, successful defense is frequently impossible in real time — pointing to why anticipation and preparation strategies dominate elite fencing, not pure reaction."),
                        sciRow(stat: "Action-reaction paradox: attackers are often faster than defenders",
                               detail: "Tsolakis 2011 (J Hum Kinet): the 'action-reaction paradox' is a well-established principle — a prepared attack launched first is biomechanically faster than the reactive defense because the attacker's motor program is already queued while the defender must identify the attack, select the response, and initiate movement. This is why fencing rewards tactical deception and feints that delay the defender's recognition phase by 50–120 ms."),
                        sciRow(stat: "EEG alpha waves: elite fencer neural signature",
                               detail: "Borysiuk & Waskiewicz 2008 (J Hum Kinet): EEG studies reveal elite fencers exhibit elevated left-temporal alpha-wave activity (8–12 Hz) during competition — a pattern associated with efficient motor memory retrieval and reduced cortical 'noise'. Elite fencers process tactical cues with 30–40% less neural activation than novices performing the same decision, consistent with motor chunking theories. Anticipation based on opponent movement preparation (kinematic cues ~80–120 ms before blade departure) allows apparent 'impossibly fast' reactions.")
                    ]
                )

                scienceCard(
                    title: "Physical Demands & Energy Systems",
                    icon: "heart.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Anaerobic alactic dominance: PCr system primary fuel",
                               detail: "Bottoms 2011 (J Sports Sci): individual fencing actions last 1–5 seconds with rest intervals between actions. The phosphocreatine (PCr) system provides 80–90% of energy for single explosive actions. Blood lactate during competition peaks at 4–8 mmol/L — elevated but not extreme, indicating significant aerobic contribution during between-action recovery. Anaerobic power output correlates strongly (r = 0.78) with competitive success."),
                        sciRow(stat: "Bout structure: 3 periods × 3 minutes, HR 85–95% HRmax",
                               detail: "Iglesias 2003 (Eur J Appl Physiol): FIE bouts consist of three 3-minute periods with 1-minute rests; individual points last 2–20 s with 10–45 s recovery. Heart rate during a competition bout averages 85–92% HRmax for foil/épée, reaching 90–95% HRmax in sabre due to faster action tempo. Tournament days can involve 6–15 bouts, making aerobic base critical for recovery between bouts despite the alactic nature of individual actions."),
                        sciRow(stat: "VO₂max: 55–65 mL/kg/min; asymmetric muscle development",
                               detail: "Roi & Bianchedi 2008 (Sports Med): elite male fencers average VO₂max 55–65 mL/kg/min, with sabre specialists at the higher end. Female elite fencers: 48–58 mL/kg/min. The lateral en garde stance creates systematic muscle asymmetry: front-leg quadriceps and rear-leg hamstrings and glutes are 15–25% stronger than their contralateral counterparts after years of training. This is compounded by rotational core asymmetry from the dominant weapon arm."),
                        sciRow(stat: "Knee and ankle demands from sustained en garde stance",
                               detail: "Guilhem 2014 (Eur J Sport Sci): maintaining en garde (front knee 120–140° flexion, rear knee 130–150°) for extended periods generates sustained patellofemoral joint compression of 2.0–3.5× body weight. Patellar tendinopathy prevalence in competitive fencers: 18–28% (higher in sabre). Ankle inversion injury is the most common acute injury due to rapid lateral footwork on piste. Front knee osteoarthritis risk is elevated in long-career fencers (≥15 years competitive).")
                    ]
                )

                scienceCard(
                    title: "Training Science & Elite Development",
                    icon: "chart.bar.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "10,000+ hours to elite; deliberate practice structure",
                               detail: "Helsen 1998 (J Sports Sci): consistent with Ericsson's deliberate practice framework, elite international fencers accumulate 10,000–14,000 hours of deliberate practice before senior international success. Unlike many sports, fencing has a bimodal talent pathway — late specialisers (starting age 12–16) can reach elite level due to transferable coordination from other racket/combat sports. Early specialisation before age 10 is associated with higher burnout rates (Moesch 2011)."),
                        sciRow(stat: "Footwork drill volume: 40–60% of training time",
                               detail: "Turner 2011 (J Sports Sci): footwork (advance, retreat, lunge, fleche, cross-step) constitutes 40–60% of elite training time. Lunge acceleration is trainable — plyometric training (box jumps, bounding) improves lunge velocity by 8–14% over 12 weeks (Boo 2013, IJSPP). Bout simulation (sparring with scored hits) is reserved for 25–35% of training; excessive sparring without technical feedback slows skill development in sub-elite fencers."),
                        sciRow(stat: "Strength & conditioning: asymmetry correction is essential",
                               detail: "Guilhem 2014 (Eur J Sport Sci): elite fencing S&C programs use bilateral resistance training (bilateral squat, Romanian deadlift) to counteract stance-induced asymmetry. Non-dominant leg single-leg strength training (split squat, step-up) is prioritised to reduce bilateral deficits to <10%. Core rotational strength training (pallof press, cable rotation) addresses the rotational trunk asymmetry from weapon arm use. Injury reduction: programs targeting asymmetry below 15% reduce lower-limb injury incidence by ~30%."),
                        sciRow(stat: "Periodisation and psychological preparation for competition",
                               detail: "Bompa 2009 (Periodization): fencing season periodisation: Oct–Dec general conditioning (aerobic base, strength); Jan–Feb technical-tactical (footwork density, blade work); Mar–Jun competition phase (peak intensity, taper 7–10 days pre-major event). Psychological preparation is integral — visualisation of attack-parry-riposte sequences activates the same motor cortex pathways as physical execution (Guillot 2012, Brain & Cognition). Elite fencers report pre-bout routines of 10–15 minutes: physical warm-up, mental rehearsal of 3–4 key tactical scenarios, and attentional focus cues ('see the target, not the blade').")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Fencing Science")
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
        let fencing = workouts.filter { $0.workoutActivityType == .fencing }
        let sessions = fencing.count
        let totalHR = fencing.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = fencing.map { $0.duration / 60 }.reduce(0, +)
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
