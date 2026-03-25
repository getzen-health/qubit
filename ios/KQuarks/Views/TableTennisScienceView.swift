import SwiftUI
import HealthKit

struct TableTennisScienceView: View {
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
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .red)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .blue)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Reaction Time & Ball Physics",
                    icon: "circle.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Ball speed: 70–112 km/h elite topspin drives",
                               detail: "Bankosz 2012 (motion analysis, elite table tennis): topspin drive speeds range 70–90 km/h for forehand loop and 80–112 km/h for forehand loop kill from mid-table distance. Flight time from 2.74 m (table length) at 100 km/h: 98 ms — meaning the total time from bat contact to opponent reach is <100 ms. Elite players anticipate ball flight entirely from opponent's pre-contact preparation (stance, bat angle, swing initiation) rather than post-contact ball tracking."),
                        sciRow(stat: "Reaction time: top 1% human RT = 140–160 ms",
                               detail: "Mori 2002: elite table tennis players demonstrate simple reaction times of 140–175 ms vs. 200–250 ms in age-matched non-athletes — representing the fastest reaction times documented in any athlete cohort. However, simple reaction time explains only 15% of match performance variance. The dominant performance factor is 'sport-specific reaction time' — integrating anticipation cues, tactical positioning, and movement pre-programming to achieve effective responses 50–80 ms faster than simple reaction time would suggest."),
                        sciRow(stat: "Spin: 3,000–9,000 rpm on elite shots",
                               detail: "Zhang 2013 (spin measurement, World Championships): topspin loop: 3,000–5,500 rpm; backspin chop: 4,000–7,000 rpm; sidespin serve: 2,000–4,500 rpm; heavy topspin loop kill: 6,000–9,000 rpm. Spin directly affects post-bounce trajectory: 7,000 rpm backspin causes ball to decelerate sharply; 9,000 rpm topspin causes violent forward kick after bounce. Elite returners process spin direction within 100 ms of opponent contact using grip/wrist observation — making serve variation (not just serve speed) the dominant serving weapon."),
                        sciRow(stat: "Ball size change (2000): 38mm → 40mm slows game",
                               detail: "ITTF changed ball diameter from 38mm to 40mm in 2000, then to poly 40+ in 2015. Physics: larger diameter increases drag force, reducing maximum speeds and spin retention. Effect: point duration increased 15–20%; service spin effectiveness reduced 10–15% (poly ball absorbs less spin than celluloid). Speed glue (boosted rubber) banned 2008: reduced forehand loop speed from 110–120 km/h to current 80–100 km/h, fundamentally altering elite tactical structures toward longer rallies.")
                    ]
                )

                scienceCard(
                    title: "Technique Biomechanics",
                    icon: "hand.raised.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Forehand loop: 900–1,400°/s wrist angular velocity",
                               detail: "Iimoto 2011 (3D motion capture, world-class players): forehand topspin loop generates wrist angular velocity of 900–1,400°/s at contact — the primary determinant of spin generation. The kinetic chain: hip rotation (first) → trunk rotation → shoulder adduction → elbow flexion → forearm pronation → wrist flexion. Contact point on rubber: 'catching' the ball (grazing upward) at the apex of bounce maximises dwell time and spin transfer. Contact time: 2–4 ms — within this window, wrist acceleration is the only controllable variable."),
                        sciRow(stat: "Backhand flick: 0.4 s maximum preparation time",
                               detail: "Kasai 2010 (backhand biomechanics): the backhand flick (attacking short balls to the forehand or body with backhand) must be completed within 0.4 s from the moment of reading opponent's short shot. Elbow leads the swing (flexed elbow pivot); forearm supination generates topspin. This technique is the defining skill separating elite from sub-elite modern players — enables attack from any ball position without forehand movement exposure. Development: 10–15% performance improvement per 6-month deliberate practice block in players who can already loop."),
                        sciRow(stat: "Serve: 60–70% of elite points decided by serve-receive",
                               detail: "Li 2015 (ITTF match data analysis): serve and third-ball (the attack following a favourable return) determines 60–70% of elite match points — far exceeding the importance of rally consistency. Top 3 balls from serve: +1.9 win-probability advantage per legal service restriction. Serve variation taxonomy: pendulum (sidespin), reverse pendulum (opposite sidespin), tomahawk (heavy backspin/topspin from backhand), ghost serve (no-spin disguised as topspin). Elbow and wrist deceleration (soft contact) produces no-spin serves that mimic heavy-spin preparation motions."),
                        sciRow(stat: "Footwork: side-to-side shuffle 0.3–0.4 s completion",
                               detail: "Munivrana 2015: elite table tennis footwork patterns — side-to-side shuffle, crossover step, adjustment step — must be completed in 0.3–0.4 s. The split-step (bilateral jump landing to bimodal ready position) reduces initial step reaction time 20–40 ms vs. static stance. Footwork volume: elite players complete 40–60 footwork positioning events per rally-intensive training hour. Lower limb conditioning: lateral plyometric hops, speed ladder drills, and reactive footwork (random direction stimulus response) are the dominant physical training modalities.")
                    ]
                )

                scienceCard(
                    title: "Physiology & Training Science",
                    icon: "heart.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "VO₂max: 55–62 mL/kg/min for Olympic-level",
                               detail: "Zagatto 2011: elite table tennis VO₂max values: 55–62 mL/kg/min for Olympic men; 48–55 mL/kg/min for Olympic women. Heart rate during match play: 75–88% HRmax for active rally phases; 55–65% between points. Blood lactate: 2–4 mmol/L — lower than most racket sports, reflecting the intermittent structure with short rallies (average 4 shots/rally) and rest between points. Aerobic capacity is important for recovery between sets and 5-set match endurance rather than individual rally intensity."),
                        sciRow(stat: "Wrist and elbow tendinopathy: 25–35% of elite players",
                               detail: "Zhang 2017 (ITTF Medical Commission): forearm tendinopathy (primarily extensor carpi ulnaris, lateral epicondylar) prevalence in elite Chinese National Team: 25–35%. Causative factors: forehand loop volume (2,000–4,000 strokes/session), narrow wrist movement patterns creating muscle imbalance, and early specialisation. Prevention: wrist pronation-supination antagonist strengthening, forearm stretching post-session, ice massage after high-volume sessions. Grip pressure: intermediate grip pressure (3–4 out of 5) optimal — excess grip tension impairs wrist snap and accelerates forearm fatigue."),
                        sciRow(stat: "Training: 6–8 hours/day in China elite programmes",
                               detail: "Chinese National Team training model (documented by ITTF coaching commission): elite junior and senior players average 6–8 hours/day of structured practice, including 3–4 hours multi-ball drilling, 2–3 hours partner sparring, and 1–2 hours physical conditioning. Weekly training volume: 35–50 hours — among the highest of any sport. Early specialisation: Chinese pathway begins systematic training at age 5–7. Long-term development: average time from beginning structured training to first world ranking: 12–15 years."),
                        sciRow(stat: "Psychological: pre-point routines reduce score pressure",
                               detail: "Lidor 2010 (sport psychology in table tennis): players with structured between-point routines (bounce ball, breath, focal cue word) show 18–28% lower performance decline under high-stakes scoring situations (game-point scenarios) compared to those without routines. Routine duration: 8–15 s optimal — shorter (< 6 s) insufficient for arousal regulation; longer (>20 s) impairs match rhythm and risks rule violation. Mental training is considered mandatory in Chinese National Programme from junior entry: imagery, self-talk scripts, and pressure training protocols.")
                    ]
                )

                scienceCard(
                    title: "Equipment Science & Rubbers",
                    icon: "wrench.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "Rubber thickness: 2.0 mm optimal control-speed",
                               detail: "Theiner 2019 (ITTF equipment testing): maximum rubber thickness: 4 mm total (blade + rubber sheet). Sponge thickness 2.0–2.1 mm: optimal balance of speed (dwell time for spin), control (consistent contact angle), and vibration dampening. Inverted rubber (pimples-facing-in): used by 95% of elite players for topspin generating forehand loops. Long-pips rubber: causes ball to return with opposite spin (topspin input → backspin output), creating returns that confuse timing. Anti-spin rubber: eliminates spin, returns near-zero-spin regardless of incoming spin."),
                        sciRow(stat: "Blade composition: carbon layers increase speed 15–20%",
                               detail: "Bankosz 2020 (blade materials comparison): carbon-fibre layer blades (1–3 carbon layers in 5–7 ply construction) increase ball exit velocity 15–20% vs. all-wood blades of equivalent weight. Carbon blades allow higher stroke velocities with equivalent effort; however, dwell time (contact duration with rubber) decreases proportionally — reducing spin generation and off-centre forgiveness. Most elite attackers use 1–2 carbon layer blades (balanced speed-control); defensive players prefer all-wood or glass-fibre for maximum dwell time."),
                        sciRow(stat: "Table: 76 cm height, 2.74 m length — physics constraints",
                               detail: "ITTF regulations: table 2.74 m × 1.525 m, 76 cm height; net 15.25 cm high. Ball arc height over net: topspin loop crosses 3–8 cm above net for maximum consistency while maintaining attack angle. Net clearance probability curves: topspin shots clear net with 95% probability at 5+ cm clearance; speed flat drives require <2 cm clearance and have 30% net error rate at elite level. Long-pips/chop returns: cross net at 10–20 cm height due to backspin deceleration arc — visually distinctive trajectory used to disrupt opponent timing patterns.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Table Tennis Science")
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
        let tt = workouts.filter { $0.workoutActivityType == .tableTennis }
        let sessions = tt.count
        let totalHR = tt.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = tt.map { $0.duration / 60 }.reduce(0, +)
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
