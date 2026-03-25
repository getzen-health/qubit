import SwiftUI
import HealthKit

struct BadmintonScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .cyan)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .orange)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .blue)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "The World's Fastest Racket Sport",
                    icon: "sportscourt.fill",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Smash speed: 493 km/h world record",
                               detail: "Guinness World Records (Tan Boon Heong, 2013): badminton smash record 493 km/h (306 mph) — the fastest racket-propelled object in sport. Professional competition smashes: 320–420 km/h. Shuttlecock aerodynamics: unique deceleration from 320 km/h at net to 80–100 km/h at rear court due to extreme drag coefficient (CD ≈ 0.6 vs. 0.3 for a tennis ball). This hyperbolic deceleration creates unique opponent timing challenges not present in any other racket sport."),
                        sciRow(stat: "Court coverage: 1.5–3.0 km per game",
                               detail: "Phomsoupha 2015 (GPS/motion capture in elite badminton): elite singles players cover 1.5–3.0 km per game, executing 350–600 movement changes per match. Multidirectional sprint frequency: 20–30 maximal acceleration efforts per game. Total distance per match (best-of-3 games): 3–7 km. Effective playing time per point: 4–6 seconds on average; recovery between points: 8–15 seconds. Work-to-rest ratio: approximately 1:2 — higher than tennis but lower than squash."),
                        sciRow(stat: "Rally pace: 90–95% HRmax sustained",
                               detail: "Faude 2007 (elite badminton HR monitoring): during match play, heart rate is sustained at 87–95% HRmax. Mean match HR: 90–92% HRmax for elite singles players. Blood lactate: 3–5 mmol/L during sustained match play. VO₂max requirements: 65–75 mL/kg/min for Olympic-level singles players; 58–68 mL/kg/min for doubles specialists. Oxygen kinetics: rapid on-transients (fast VO₂ kinetics) enable quicker O₂ delivery at point start — a trainable adaptation that distinguishes elite from club players."),
                        sciRow(stat: "Shuttle: 16 feathers, 4.74–5.50 g, extreme aerodynamics",
                               detail: "Cohen 2016 (badminton aerodynamics research): the feathered shuttlecock's 16-feather skirt creates 8–10× more drag than a synthetic nylon shuttle at equivalent velocities. Natural feather shuttles are mandatory in international competition due to superior aerodynamic consistency. Altitude effect: at 1,500 m above sea level, air density reduction requires shuttles with 3 grains heavier weight to maintain equivalent flight characteristics — BWF regulates shuttle specification by atmospheric conditions.")
                    ]
                )

                scienceCard(
                    title: "Biomechanics & Reaction Time",
                    icon: "bolt.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Smash return reaction: 85–105 ms",
                               detail: "Abernethy 1996 (occlusion paradigm in badminton): returning a 350 km/h smash from mid-court requires a response to be initiated within 85–105 ms of shuttle departure — comfortably within the simple reaction time of 200–250 ms, meaning elite defenders cannot react to the shuttle alone. Expert receivers instead anticipate from opponent body position, racket angle, and swing kinematics up to 250 ms before shuttle contact, providing sufficient anticipation time. Defensive ready position preparation and footwork timing are trained cognitive skills, not purely physical reflexes."),
                        sciRow(stat: "Jump smash: 23–28 m/s racket head speed",
                               detail: "Rambely 2005: jump smash racket head speed at contact: 23–28 m/s (83–101 km/h). Arm contribution: 45% of total racket head speed; forearm pronation at contact: 38%; wrist snap: 17%. Jump height for jump smash: 40–60 cm. Shoulder external rotation velocity in preparation: 4,000–4,500°/s — comparable to volleyball spike. Optimal jump smash trajectory: shuttle contacted at peak of jump, arm fully extended, with 15–20° forward lean of racket face for steep angle."),
                        sciRow(stat: "Net kill: contact at 1.0–1.2 m above net",
                               detail: "Poole 2013: net kill (sharp downward shot from above the tape) requires shuttle contact 1.0–1.2 m above the net for optimal angle. Deceptive preparation (same body motion for net kill and net drop) reduces opponent reaction time by 80–120 ms. Net cord incidents: net tape contact within 3 ms of shot execution — 15–20% of elite net shots involve unintentional tape contact, reduced by optimising contact height. Net feint training improves deception effectiveness 25% in 6-week intervention studies."),
                        sciRow(stat: "Footwork: 9 fundamental movement patterns",
                               detail: "Lees 2003: badminton footwork taxonomy identifies 9 fundamental court movement patterns (6 corners + central ready position + lunge + split-step). Lunge depth in extreme net shots: 70–90 cm extension. Split-step timing: 50–80 ms before opponent contact — optimises reactive capacity by pre-loading lower limb muscles in bilateral isometric contraction before explosive direction change. Footwork efficiency (steps to reach target) accounts for 35% of variance in rally outcome at elite level — more than racket skill contribution in multivariate match analysis.")
                    ]
                )

                scienceCard(
                    title: "Physical Conditioning & Physiology",
                    icon: "heart.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Shoulder: rotator cuff dominant injury (28% of all)",
                               detail: "Yung 2007 (BWF injury survey): shoulder injuries account for 28% of all time-loss injuries in elite badminton. Supraspinatus tendinopathy and infraspinatus strains from high-volume overhead striking. Prevention: rotator cuff eccentric programme (ER side-lying, prone Y/T/W raises), posterior capsule flexibility maintenance, and progressive stroke volume periodisation avoiding >10% weekly increase. Backhand clear (reverse smash): highest shoulder impingement risk due to awkward shoulder abduction-internal rotation combination at overhead contact."),
                        sciRow(stat: "Knee: patellar tendinopathy in 15–25% of elite",
                               detail: "Lo 2004: patellar tendinopathy ('jumper's knee') prevalence in elite badminton: 15–25%. Risk factors: high jump smash frequency (>200/session), training surface hardness (concrete > synthetic court flooring), and quad-hamstring strength imbalance (ratio <0.75). Prevention and treatment: eccentric decline squat protocol (3 × 15 reps/day on 25° decline board) reduces pain and improves function 60% over 12 weeks in RCT evidence. Playing through tendinopathy acceptable with VAS pain <4/10; >5/10 requires load modification."),
                        sciRow(stat: "Dehydration risk: 1–2.5% BW fluid loss per game",
                               detail: "Girard 2012: elite badminton players lose 1–2.5% body weight per game (45–75 min) through sweat in indoor courts at 24–28°C. Performance impairment threshold: 2% dehydration reduces reaction time 7%, decision accuracy 11%, and movement speed 4%. High sweat rates (1.0–1.8 L/hour) combined with frequent games in tournaments (up to 4/day) require systematic hydration: 400–600 mL 2 hours before, 150–200 mL every 15 min during play, immediate electrolyte replacement post-game."),
                        sciRow(stat: "Training load: 6–8 sessions × 90 min for elite",
                               detail: "Phomsoupha 2015 (training load analysis): Olympic badminton players average 6–8 training sessions per week of 90–120 min each. Distribution: 50% technical training (strokes, footwork drills), 30% match practice (simulated competition), 20% physical conditioning (strength, plyometrics, aerobic). Multi-shuttle drills (feeder delivers rapid succession shuttles to all 6 corners): highest training physiological demand, reaching 95% HRmax — used for conditioning and footwork pattern development simultaneously. Peak preparation: increase multi-shuttle volume 4–6 weeks before major competition.")
                    ]
                )

                scienceCard(
                    title: "Doubles Tactics & Court Science",
                    icon: "chart.bar.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "Doubles rally: 50% shorter than singles",
                               detail: "Laffaye 2015: doubles rallies average 4.5 s vs. 8.5 s for singles — reflecting the attack-dominant doubles structure where offensive opportunities are converted immediately. Mixed doubles rally duration: 5.2 s (intermediate between). Doubles service height limitation: BWF rule (shuttle waist height <1.15 m) has transformed tactical play toward drive and push returns over traditional flick strategies. Side-by-side vs. front-back defensive position: side-by-side for 72% of rally time, front-back for 28% — positional decisions made within 50–80 ms of shuttle direction."),
                        sciRow(stat: "Service: 15 cm over net at regulations",
                               detail: "Lees 2010: legal doubles service requires shuttle to cross at least 15 cm above the net, targeting back tramline for flick serve height advantage, or tight to net (within 30 cm) for low service deception. Serve and return outcome data: low serve + net return wins the rally at 68% frequency vs. 51% for flick service sequences — supporting the dominant low-serve strategy in modern doubles. Service deception (flick with low-serve preparation): successfully deceives opponent 35–50% of attempts at elite level."),
                        sciRow(stat: "Smash angle: 20–30° optimal downward trajectory",
                               detail: "Wan Abas 2002: optimal badminton smash trajectory for court coverage: 20–30° angle from horizontal, targeting side tramlines at mid-court. Steeper angles (>30°) miss the tramline zone; shallower (<20°) are easier to defend with drive returns. Half-smash tactical use: 60–70% of smash speed used intentionally to draw forward movement from defender, enabling deceptive drop or follow-up full smash. Net cord decision: BWF rules allow let (replay) only for service; all net cord shots during rallies are playable — requiring instant adaptation."),
                        sciRow(stat: "Racket string tension: 26–30 lbs in elite",
                               detail: "Tsai 2000 (racket physics): elite players string at 26–30 lbs tension (vs. recreational 18–22 lbs). Higher tension: reduces contact time, increases control, requires higher swing speed for power; lower tension: greater power with less swing speed, more forgiving off-centre hits. Racket head speed at equivalent swing: contributes 65% to shuttle speed; string tension contributes 15%; shuttle quality 20%. Graphite shaft stiffness: medium-stiff optimal for most offensive players; flexible shaft transfers more energy to shuttle at lower swing speeds (recreational players).")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Badminton Science")
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
        let badminton = workouts.filter { $0.workoutActivityType == .badminton }
        let sessions = badminton.count
        let totalHR = badminton.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = badminton.map { $0.duration / 60 }.reduce(0, +)
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
