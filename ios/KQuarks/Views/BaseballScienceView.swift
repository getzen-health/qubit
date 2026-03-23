import SwiftUI
import HealthKit

struct BaseballScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .blue)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .red)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .orange)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Pitching Biomechanics",
                    icon: "baseball.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "Shoulder internal rotation: 6,000–7,000°/s",
                               detail: "Fleisig 1999 (ASMI classic study): elite pitchers generate shoulder internal rotation angular velocity of 6,000–7,000°/s — the fastest recorded voluntary human movement. Elbow valgus stress during late arm cocking: 64–82 N·m, approaching ulnar collateral ligament (UCL) failure threshold of ~35 N·m (net, after flexor-pronator muscle bridging). Efficient pitching mechanics (kinetic chain from ground reaction → hip-shoulder separation → arm action) reduces elbow stress 20–30% vs mechanical inefficiencies."),
                        sciRow(stat: "Tommy John (UCL reconstruction): 12–18 months recovery",
                               detail: "Koh 2020 (ASMI outcomes data): UCL reconstruction ('Tommy John surgery') has been performed in 25–30% of current MLB pitchers at some point in their career. Return-to-pitch at pre-injury level: 73–83% of pitchers; timeline: 12–18 months. Risk factors for UCL injury: high pitch count, fastball-heavy repertoire, 'inverted-W' arm action (early arm elevation), and 12-month relative workload spike >130% of prior baseline."),
                        sciRow(stat: "Pitch velocity and arm stress: 95 mph threshold",
                               detail: "Whiteside 2016 (MLB Statcast): elbow valgus torque increases 2.5 N·m per mph of pitch velocity above 85 mph, creating a non-linear stress increase at >95 mph. The MLB average fastball velocity has risen from 89.0 mph (2008) to 93.6 mph (2023), representing a 40% elbow stress increase. Hip-shoulder separation (measured by lead hip internal rotation at foot strike to max shoulder ER) is the primary velocity predictor and also the key stress-reduction mechanism."),
                        sciRow(stat: "Spin rate and pitch movement physics",
                               detail: "Higuchi 2013 (baseball aerodynamics): 4-seam fastball backspin (2,200–2,600 rpm) creates Magnus effect upward lift force of 0.4–0.6 N, producing 8–12 inches of 'carry' vs. a spinless ball. Curveball topspin (2,400–3,000 rpm): downward deflection 12–18 inches. Slider sideward spin: 2–8 inches horizontal break. Changeup: identical arm action to fastball but 8–12 mph slower via grip-induced spin reduction — timing disruption of 50–80 ms confuses batter's predictive mechanism.")
                    ]
                )

                scienceCard(
                    title: "Hitting Biomechanics & Bat Speed Science",
                    icon: "figure.baseball",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Elite bat speed: 70–85 mph at contact",
                               detail: "Fleisig 2010: MLB hitter bat speed at contact: 70–85 mph for power hitters; 60–70 mph for contact hitters. Bat-ball contact duration: 1–2 ms at 90+ mph pitch. Coefficient of restitution (COR) of bat-ball collision: 0.45–0.55 for wood bats. Launch angle optimisation (Statcast era): 10–30° maximises expected weighted on-base average (xwOBA) for pull-heavy power hitters; 0–15° for contact hitters seeking gap production."),
                        sciRow(stat: "Hip-shoulder separation: 30–45° at contact",
                               detail: "Welch 1995: the most powerful MLB hitters achieve 30–45° of hip-shoulder separation — measured as the angle between the hip line and shoulder line at the initiation of the forward swing. This coiling creates rotational elastic energy in the trunk musculature (QL, obliques, LS). Hip rotation leads shoulder rotation by 80–120 ms, acting as the proximal driver of the kinetic chain. Loss of separation (simultaneous rotation) reduces bat speed 10–18%."),
                        sciRow(stat: "Reaction time: 400 ms for 95 mph fastball",
                               detail: "Gray 2002: a 95 mph fastball reaches home plate in ~400 ms; batters must initiate swing by 150–175 ms after release. This leaves only 250 ms for pitch identification and motor-program commitment — insufficient for conscious deliberation. Elite batters rely on pattern recognition and probabilistic prediction (pitch count, arm angle, pitcher tendencies) rather than real-time reactive responses. Swing decisions are committed before the ball reaches halfway."),
                        sciRow(stat: "Exit velocity: 100+ mph in elite MLB hitting",
                               detail: "MLB Statcast data 2023: median exit velocity for MLB home runs = 103.5 mph; median hard-hit rate (>95 mph EV) threshold separates top 25% hitters. Physics: batted ball exit velocity ≈ (1+e) × pitch speed + e × bat speed, where e = COR. Maximum theoretical EV at given bat speed: 1.2× bat speed for head-on collision. xwOBA correlation with EV: r=0.72. Strength training translating to hitting: rotational power (med ball throws, cable chops) shows stronger EV correlation than isolated upper-body strength.")
                    ]
                )

                scienceCard(
                    title: "Athletic Demands & Position Science",
                    icon: "figure.run",
                    color: .green,
                    rows: [
                        sciRow(stat: "Sprint to first base: 3.8–4.2 s for elite speed",
                               detail: "Coleman 2012: sprint time from home plate to first base for elite MLB batters: 3.8–4.2 s (27.4 m/90 ft). Fastest time recorded (Statcast era): 3.69 s. Baserunning mechanics: initial acceleration (0–10 m) is force-production-dominant; maximum velocity phase (10–27 m) requires stride frequency maintenance. Outfield sprint coverage: centre fielders cover 6–9 m/s peak sprint for ball pursuit, combining reaction to crack of bat with route efficiency."),
                        sciRow(stat: "Throwing velocity: 90–105 mph for MLB infielders",
                               detail: "Freeston 2015 (applied to baseball): MLB shortstop-to-first throwing velocity: 85–90 mph (arm strength measure); catcher pop time to 2B: 1.85–2.00 s (combines catch-to-release, throw velocity, and accuracy). Centre field cannon throws: 90–105 mph. Arm strength develops primarily through long toss programmes (progressive distance from 60–300 ft), not flat-ground short throws. Grip strength and forearm rotator strength are the limiting factors in non-elite throwers."),
                        sciRow(stat: "Catcher: most physically demanding position",
                               detail: "Kypson 2013: catchers perform 40–100 squat-to-stand transitions per game, plus explosive jumps for pop-time throws to second. Catcher squat mechanics: bimodal stance (feet wide, weight forward) allows quicker transitions but accumulates knee/hip flexion stress. Common injuries: knee (medial collateral ligament, patellar tendinopathy), wrist (hamate fractures from foul tips), and thumb UCL sprains from thrown balls. Blocking technique (dropping to knees, angling glove) is a trainable injury prevention skill."),
                        sciRow(stat: "Outfield: 5–7 km covered per game in modern analytics",
                               detail: "Baseball Savant sprint data 2023: outfielders (CF dominant) sprint to cover 5–7 km per 9-inning game when counting all effort runs. Sprints >85% max velocity: 4–8 per game for centre fielders. Route efficiency (out-of-route running rate): best CF route-runners deviate <8% from optimal path vs league average of 15–20%. Dive-catch injury mechanism: shoulder labrum tears from landing on outstretched arm; instruct diving to glove side to reduce rotator cuff impingement on impact.")
                    ]
                )

                scienceCard(
                    title: "Pitcher Load Management & Arm Care",
                    icon: "waveform.path.ecg",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Pitch count limits: 100 per game, 120 max",
                               detail: "Olsen 2006: injury risk increases significantly above 100 pitches per outing; 120-pitch games correlate with 3× next-start injury incidence vs. <80-pitch outings. MLB average 5-day rotation: ~100 pitches per start. Youth baseball: Little League pitch count rules (≤85/day for ages 11–12; ≤80 for 9–10) based on ASMI research showing growth plate (proximal humeral epiphysis) vulnerability in skeletally immature pitchers. Specialisation before age 14 increases UCL surgery risk 5× vs multi-sport athletes."),
                        sciRow(stat: "Velocity as injury predictor: within-session decline",
                               detail: "Fleisig 2011: within-game velocity decline >3 mph from peak (measured by in-game radar gun tracking) predicts mechanical breakdown and significantly elevated injury risk — used by MLB pitching coaches as early removal signal alongside real-time biomechanics from PitchingNinja AI systems. External cue: 'stuff' (spin rate, break) declines before velocity — bullpen catchers trained to identify movement change as earliest fatigue indicator."),
                        sciRow(stat: "Off-season arm care: the Jobes/Throwers Ten programme",
                               detail: "Wilk 1993 (original Jobes programme): the Throwers Ten exercises (side-lying ER, prone horizontal abduction, diagonal ER/IR, serratus anterior push-up, prone W, T, Y raises) address the 5 kinematic deficits most associated with shoulder injuries in overhead athletes. 6-week pre-season programme reduces shoulder injury incidence 40%. Posterior shoulder tightness correction: sleeper stretch + cross-body stretch × 30 s, 3 sets/day throughout season. Scapular dyskinesis correction precedes any throwing velocity programme."),
                        sciRow(stat: "Spin rate: genetic and trainable components",
                               detail: "Lively 2022 (MLB Statcast research): approximately 60% of spin rate is determined by finger grip and wrist angle (trainable); 40% is correlated with forearm structure and grip strength (partially genetic). Spider tack and sticky substances illegally increased spin rate 200–400 rpm in MLB (2020–2021) before enforcement crackdown; subsequent universal decrease confirmed the mechanical basis. Legal spin rate training: towel drills for wrist flexion-supination at release, progressive long-toss with intent to maximise spin.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Baseball Science")
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
        let baseball = workouts.filter { $0.workoutActivityType == .baseball }
        let sessions = baseball.count
        let totalHR = baseball.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = baseball.map { $0.duration / 60 }.reduce(0, +)
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
