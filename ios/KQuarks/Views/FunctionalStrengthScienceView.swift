import SwiftUI
import HealthKit

struct FunctionalStrengthScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .red)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .orange)
                    statCard(value: avgHR > 0 ? String(format: "%.0f bpm", avgHR) : "--", label: "Avg HR", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "CrossFit & High-Intensity Functional Training",
                    icon: "dumbbell.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "WOD intensity: 85–95% HRmax in MetCon workouts",
                               detail: "Glassman 2002 CrossFit methodology: metabolic conditioning (MetCon) workouts elicit HR 85–95% HRmax with blood lactate 8–15 mmol/L — near-maximum across all energy systems simultaneously. CrossFit Games athletes average VO₂max 58–68 mL/kg/min (both sexes at elite level). Energy system demands vary dramatically by WOD structure: short AMRAPs are anaerobic-dominant; 20+ min chippers engage sustained aerobic metabolism."),
                        sciRow(stat: "Fran (21-15-9 thrusters + pull-ups): 2–4 min for elite",
                               detail: "Benchmark WOD Fran completed in 2–4 min by elite competitors, 6–10 min by competitive athletes. Near-maximal effort is maintained throughout with no rest prescribed. The thruster (front squat to push press) carries the highest metabolic cost per repetition in functional training — it activates the full kinetic chain from ankle to overhead lockout and demands rapid transition between a maximal-depth squat pattern and explosive overhead press, creating simultaneous leg, trunk, and shoulder fatigue."),
                        sciRow(stat: "Power output: Olympic lifts generate 4,000–6,000 W peak",
                               detail: "Clean and jerk and snatch peak power outputs in functional training contexts reach 4,000–6,000 W — measured via force plates and bar-mounted accelerometers. Bar velocity monitoring (VBT) is increasingly used in elite CrossFit to track bar speed as a proxy for fatigue and readiness. Rate of force development (RFD) — the slope of the force-time curve in the first 100 ms — is the primary neurological adaptation from repeated Olympic lifting and the most sport-applicable explosive quality."),
                        sciRow(stat: "Injury rate: 3.1 per 1,000 training hours",
                               detail: "Hak 2013 (CrossFit injury epidemiology, n=132): 3.1 injuries per 1,000 training hours — comparable to Olympic weightlifting and gymnastics, and substantially lower than contact sports (rugby: 91/1,000h; American football: 35/1,000h). Shoulder injuries account for 25% of all incidents, spine 20%. Rhabdomyolysis risk is elevated with extreme first exposure to high-volume eccentric loading in untrained individuals ('Uncle Rhabdo' phenomenon) — gradual introductory programming is essential.")
                    ]
                )

                scienceCard(
                    title: "Olympic Weightlifting Science",
                    icon: "bolt.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Clean & jerk: bar velocity 1.8–2.2 m/s at highest point",
                               detail: "Biomechanics of the clean: first pull (floor to mid-thigh), transition (scoop/double knee bend), second pull (explosive triple extension of ankle, knee, hip), catch (front squat receiving position). Force plate data at triple extension shows 2–3× body weight vertical force, peak power 4,000–6,500 W for elite lifters. Bar path traces a sigma-shaped curve — optimal bar contact with thighs in the transition reduces horizontal bar displacement and maximises vertical velocity into the catch."),
                        sciRow(stat: "Snatch: most technically demanding lift — 60° catch depth",
                               detail: "The snatch requires catching the bar in a full overhead squat with approximately 60° forward trunk lean. Shoulder stability demands are extreme — the glenohumeral joint must maintain a packed, externally rotated position against downward bar momentum. Common technical errors and their biomechanical causes: early arm bend (reduces bar height at turnover), early pull (bar loses contact with thighs reducing transfer efficiency), forward miss (insufficient hip-to-shoulder sequencing in the second pull)."),
                        sciRow(stat: "Maximum strength: back squat 2.5× body weight for elite OLY lifters",
                               detail: "Relative strength standards in Olympic weightlifting: back squat typically 120–130% of clean; front squat 105–115% of clean. Elite men's 89 kg class back squat: 220–240 kg (2.5–2.7× BW). The posterior chain — glutes, hamstrings, and erector spinae — is central to both pulls. Accessory work prioritises Romanian deadlifts, good mornings, and weighted back extensions to build the hip extension capacity that determines second pull height and therefore snatch/clean ceiling."),
                        sciRow(stat: "Neural adaptations: 6–8 weeks for rate coding improvements",
                               detail: "Early-stage strength gains (first 4–8 weeks of systematic training) are predominantly neural: improved motor unit recruitment, elevated firing rate (rate coding), enhanced inter-muscular coordination, and reduced antagonist co-contraction at peak force. RFD improvements measurable within 4–6 weeks precede significant hypertrophy. Structural (hypertrophic) gains become the primary driver after 8–12 weeks. Motor pattern acquisition for complex OLY lifts requires 200–400 repetitions of technically correct execution before movement automaticity develops.")
                    ]
                )

                scienceCard(
                    title: "Kettlebell Science",
                    icon: "figure.strengthtraining.functional",
                    color: .red,
                    rows: [
                        sciRow(stat: "Kettlebell swing: 600–900 hip extensions per session",
                               detail: "High-volume hip hinge training: the two-arm swing at 24 kg elicits approximately 20 kcal/min metabolic demand. Posterior chain activation: glutes ~40%, hamstrings ~35%, erector spinae ~25%. The ballistic loading characteristic — eccentric-to-concentric transition at the bottom of the swing under hip hinge mechanics — develops the stretch-shortening cycle of the posterior chain more effectively than slow isotonic work. Contrast loading (swings followed by jumps) amplifies RFD via post-activation potentiation."),
                        sciRow(stat: "Turkish get-up: 7-step movement integrating full-body stability",
                               detail: "TGU biomechanics: (1) roll to elbow, (2) roll to hand, (3) hip bridge, (4) sweep leg through to half-kneeling, (5) tall kneeling, (6) stand. Throughout all phases, the shoulder is maintained in a packed (depressed, retracted) externally rotated position supporting the overhead kettlebell. The movement sequentially challenges floor-level rotary stability, trunk lateral stability, hip mobility, and finally single-leg balance — making it a comprehensive stability assessment as well as a training stimulus."),
                        sciRow(stat: "Snatch test: 100 reps in 5 minutes (RKC standard)",
                               detail: "The RKC (Russian Kettlebell Certification) snatch test requires 100 repetitions in 5 minutes with 24 kg (men) / 16 kg (women) using hand switches but no setting the bell down. VO₂ demand throughout: 85–90% HRmax. The primary limiting factor is grip endurance and cumulative forearm fatigue rather than cardiovascular capacity — experienced practitioners develop a loose finger-grip technique to spare forearm flexors. Callus management (pumice stone, avoiding torn skin) is critical for training continuity."),
                        sciRow(stat: "Cardiovascular response: 20-min KB circuit = 400+ kcal",
                               detail: "Jay 2010 (RCT, n=40): 20-minute kettlebell circuit training 3× weekly increased VO₂max 6% and core strength 70% in previously sedentary adults over 8 weeks. Metabolic conditioning effects are comparable to treadmill running at equivalent heart rate. The combination of strength and cardiorespiratory demands in a single tool with minimal setup makes kettlebells among the most time-efficient exercise modalities for general population fitness, particularly where space or equipment access is limited.")
                    ]
                )

                scienceCard(
                    title: "Programming & Periodisation",
                    icon: "chart.bar.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "RFD: rate of force development — most trainable explosive quality",
                               detail: "RFD (0–100 ms peak force rate) is the most sport-applicable strength quality — ground contact times in sprinting and jumping are too brief for maximal force to be expressed; only RFD matters. Olympic lifts, plyometrics, and contrast training (heavy compound set immediately followed by explosive movement) improve RFD 15–25% in 8–12 weeks. Neural mechanisms: increased motor unit synchronisation, enhanced rate coding (firing frequency), and reduced antagonist inhibition at high velocities."),
                        sciRow(stat: "Concurrent training: strength + cardio reduces hypertrophy gains 25–30%",
                               detail: "The interference effect (Hickson 1980): simultaneous strength and endurance training in the same session creates molecular signalling conflict — AMPK activation from endurance work inhibits mTORC1 signalling required for muscle protein synthesis. This blunts hypertrophic adaptation by 25–30% vs. strength-only training. Mitigation strategies: separate sessions by 6+ hours minimum, or if same session, sequence endurance before strength so the anabolic signalling window post-strength training is not blunted by subsequent AMPK activation."),
                        sciRow(stat: "Periodisation: daily undulating outperforms linear by 10–15%",
                               detail: "Daily undulating periodisation (DUP) — varying rep ranges on consecutive training days (e.g., Mon: 3×5 heavy; Wed: 4×8 moderate; Fri: 5×12–15 high rep) — outperforms linear periodisation (weekly progression within a single rep range) by 10–15% in RCTs at 12 weeks for functional fitness athletes (Rhea 2002). DUP allows movement pattern variety while accumulating progressive overload, prevents neural and metabolic accommodation, and aligns well with the multi-quality demands of CrossFit and functional fitness competition."),
                        sciRow(stat: "Tapering: 7–10 days, 40% volume reduction, maintain intensity",
                               detail: "Competition-phase taper for functional fitness (CrossFit Open, OLY competitions): reduce volume 40–50% while maintaining load intensity (same weights, fewer total sets and reps). Prioritise skill practice, movement quality, and sleep in the final week. The taper window for strength-power sports is shorter than endurance (7–10 days vs. 14–21 days) because neuromuscular fatigue dissipates faster than aerobic detraining occurs. Avoid introducing new movements, extreme range exercises, or unfamiliar loading patterns in the 10 days before competition.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Functional Strength Science")
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
        let functional = workouts.filter { $0.workoutActivityType == .functionalStrengthTraining }
        let sessions = functional.count
        let totalHR = functional.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = functional.map { $0.duration / 60 }.reduce(0, +)
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
