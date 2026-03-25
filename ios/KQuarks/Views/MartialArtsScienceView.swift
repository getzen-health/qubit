import SwiftUI
import HealthKit

struct MartialArtsScienceView: View {
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
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .orange)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Striking Biomechanics Across Disciplines",
                    icon: "figure.martial.arts",
                    color: .red,
                    rows: [
                        sciRow(stat: "Karate reverse punch: 3,000–4,000 N peak force",
                               detail: "Gulledge 2006 (force plate striking study): karate reverse punch (gyaku-zuki) generates 3,000–4,000 N peak force in elite black belts vs. 1,200–1,800 N in untrained adults. Kinetic chain: rear-foot push → hip rotation → shoulder rotation → elbow extension → wrist snap. Hip rotation angular velocity: 500–600°/s. Kime (focus at impact) — rapid muscle co-contraction at moment of contact — transfers force efficiently and stiffens the kinetic chain, increasing peak force 20–30% over relaxed strikes."),
                        sciRow(stat: "Taekwondo turning kick: 4,200–5,600 N",
                               detail: "Estevan 2013 (TKD biomechanics): rear-leg turning kick (dollyo chagi) generates 4,200–5,600 N — higher than any hand technique. Foot velocity at impact: 12–14 m/s (43–50 km/h). Hip-to-foot angular velocity chain: hip abduction → external hip rotation → knee extension → ankle plantarflexion. World champion TKD athletes generate 15–25% more peak force than national-level competitors, driven primarily by superior hip rotation velocity rather than absolute leg strength."),
                        sciRow(stat: "MMA ground-and-pound: 1,800–2,600 N",
                               detail: "Lenetsky 2015: MMA ground-and-pound strikes (descending hammerfist/elbow from mounted position) generate 1,800–2,600 N, with the shorter kinetic chain compared to standing strikes offset by gravity contribution. Elbow strikes: 2,200–3,100 N peak (shorter distance = higher contact velocity relative to limb mass). Grappling transitions from stand-up to ground: metabolic cost equivalent to 90–95% VO₂max effort during scramble phases, creating tactical opportunity for opponent who maintains aerobic fitness."),
                        sciRow(stat: "Wrestling takedown: force × 3× body weight",
                               detail: "Kraemer 2004: double-leg takedown entry generates ground reaction forces of 2.5–3.0× body weight in the penetration step. Judo ippon seoi nage (shoulder throw): peak force on uke (thrown athlete): 6–8× body weight on landing impact — highest uncontrolled impact of any martial art technique. Sprawl defence against takedown: hip extension and downward pressure of 400–800 N from defending athlete must exceed attacker's penetration force to nullify the attempt.")
                    ]
                )

                scienceCard(
                    title: "Energy Systems in Combat Sports",
                    icon: "heart.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Judo: 90% anaerobic during randori (sparring)",
                               detail: "Franchini 2011 (combat sports physiology comprehensive review): judo randori generates 90% anaerobic energy contribution during explosive grip-fight and throw sequences. Blood lactate post-match: 8–14 mmol/L. Heart rate: 90–95% HRmax throughout 5-minute match. Judo VO₂max: 55–65 mL/kg/min for elite men; 52–60 mL/kg/min for women. Despite high anaerobic demand during throws, aerobic fitness is the primary predictor of match performance (more gripping attempts per minute, higher throw success rate in final 2 minutes)."),
                        sciRow(stat: "BJJ: 75–85% aerobic for ground fighting",
                               detail: "Del Vecchio 2010: Brazilian jiu-jitsu competition is 75–85% aerobic by energy contribution, reflecting the sustained moderate-intensity nature of positional control and submission hunting from guard or mount positions. Peak intensity: guard pass or submission attempt = near-maximal PCr burst (85–95% VO₂max for 3–8 s). BJJ-specific fitness: isometric grip strength, hip mobility, and anaerobic power for escape sequences predict performance better than VO₂max alone."),
                        sciRow(stat: "MMA: all three energy systems in one bout",
                               detail: "Kirk 2015: MMA competition uniquely demands simultaneous readiness in all three energy pathways. Stand-up striking exchanges: 85–95% HRmax; grappling transitions: 80–90% HRmax; ground control: 65–75% HRmax (active recovery). Average UFC fight duration: 9–12 min (3 rounds × 5 min); championship: 24 min (5 rounds). VO₂max in elite MMA: 55–65 mL/kg/min; elite jiu-jitsu specialists 48–55 mL/kg/min reflecting less cardiovascular emphasis vs. sport-specific anaerobic conditioning."),
                        sciRow(stat: "Judo weight cutting: up to 8% BW in 24 hours",
                               detail: "Artioli 2010: 89% of elite judo athletes regularly cut weight before competition (IJF weigh-in protocols). Average cut: 4–5% body weight; extreme cases 7–8% BW in 24 hours. Methods: fluid restriction, sweat suit, sauna. Rehydration within 4 hours (current IJF same-day weigh-in): insufficient to restore VO₂max (−10–15% impairment), grip strength (−8–12%), and cognitive function (−12–18% reaction time). IJF same-day weigh-in (2017) has reduced extreme cutting but not eliminated it.")
                    ]
                )

                scienceCard(
                    title: "Decision-Making & Tactical Intelligence",
                    icon: "brain.head.profile",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Expert fighters: 3× faster decision-making",
                               detail: "Starkes 2003 (sport expertise in combat): expert martial artists (10+ years, national/international level) process opponent movement patterns 2.5–3.5× faster than novices in video-based decision tasks, with identical laboratory simple reaction times. Expert advantage is entirely in pattern recognition, not motor speed. Kata (form practice) and sparring drills develop tactical schemas — mental libraries of attack-defence sequences — that allow sub-200ms defensive responses to telegraphed attacks."),
                        sciRow(stat: "Judoka: 6–8 technical attacks per minute in elite",
                               detail: "Franchini 2013 (IJF technical analysis): elite judo players attempt 6–8 technical throwing or ne-waza (ground) attacks per minute of randori vs. 2–3 attempts/min for national-level competitors. Attack frequency is the strongest predictor of match victory — not individual technique quality. This statistical finding is widely used in elite judo coaching: maximise attack attempts per minute while maintaining defensive integrity, rather than perfecting single techniques."),
                        sciRow(stat: "Anticipation: reading grip = 200 ms advance notice",
                               detail: "Calmet 2010: experienced judo players use opponent grip kinematics (wrist angle, elbow position, grip tightening) to anticipate throw attempts 200–250 ms before initiation — sufficient for defensive stepping or kuzushi (off-balancing) nullification. This anticipation advantage completely disappears when fighters are matched at the same experience level, explaining why elite vs. national-level match outcomes are largely determined by who executes techniques with less telegraphing."),
                        sciRow(stat: "Pre-competition cortisol: adaptive if moderate",
                               detail: "Salvador 2003: pre-competition cortisol elevation of 15–35% above baseline improves combat sport performance by sharpening sensory processing and aggressive intent — the 'optimal pre-competition arousal' window. Cortisol elevation >50% above baseline (excessive anxiety) impairs decision-making speed and motor programme execution. Heart rate variability (HRV) in the 4–6 hours before competition: a morning HRV reading at <85% of baseline is a reliable indicator of over-arousal requiring psycho-physiological regulation techniques.")
                    ]
                )

                scienceCard(
                    title: "Training Science & Periodisation",
                    icon: "dumbbell.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "BJJ/Judo training: 5–6 sessions × 90 min per week",
                               detail: "Artioli 2012 (training loads in combat sports): elite judo and BJJ competitors average 5–6 training sessions per week of 90–120 min each. Training composition: 30% technical drilling (kata/techniques), 50% randori/sparring (highest physiological demand), 20% physical conditioning. Weekly training load equivalent: 35–50 km running equivalent in energy expenditure. Deload weeks (1 per 4–6-week block): 40% volume reduction maintains fitness while enabling supercompensation and reducing chronic overuse injury risk."),
                        sciRow(stat: "Grip strength: 65–75 kg dominant hand in elite judo",
                               detail: "Franchini 2007: elite judo athletes demonstrate dominant-hand grip strength of 65–75 kg (crush grip dynamometer) vs. 45–55 kg in national-level competitors and 35–45 kg in age-matched non-athletes. Grip strength is the single strongest physical performance predictor in judo — outperforming VO₂max, bench press, and squat in multivariate models. Training: towel pull-ups, thick-bar deadlifts, gi-specific pull-up variations, and finger extension isometrics to prevent flexor-extensor strength imbalance causing tendinopathy."),
                        sciRow(stat: "Periodisation: technique → fitness → competition peaks",
                               detail: "Turner 2017 (combat sport periodisation): optimal periodisation for competitive combat sports: preparation phase (8–16 weeks) prioritises technical volume and general fitness; specific preparation (4–8 weeks) increases sparring intensity and sport-specific conditioning; competition phase (2–4 weeks) tapers volume 40–50% while maintaining intensity; transition (2–4 weeks) active recovery. Single-periodisation (one competition peak) suits national championships; double-periodisation required for IJF/UFC fight camps that may have 4–6 competitive events annually."),
                        sciRow(stat: "Kata practice: 40% of elite performance benefit from non-sparring",
                               detail: "Tanaka 2016: analysis of training time allocation in medalists vs. non-medalists at IJF World Championships found that athletes who allocated 35–45% of training to technical drilling (kata, partner technique work) significantly outperformed those who sparred >70% of training time. Hypothesis: high sparring ratios create compensatory movement patterns and increase injury rate; technical work reinforces optimal biomechanics under low fatigue. Modern periodisation increasingly separates technical mastery work from physiological conditioning days.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Martial Arts Science")
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
        let martialArts = workouts.filter { $0.workoutActivityType == .martialArts }
        let sessions = martialArts.count
        let totalHR = martialArts.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = martialArts.map { $0.duration / 60 }.reduce(0, +)
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
