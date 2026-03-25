import SwiftUI
import HealthKit

struct DiscSportsScienceView: View {
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
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .yellow)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .blue)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Frisbee Throwing Biomechanics",
                    icon: "circle.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "Backhand throw: 80–120 km/h at elite level",
                               detail: "Wrist snap angular velocity reaches 800–1,200°/s at release; elbow extension contributes 30–40% of total arm velocity through the kinetic chain. The follow-through arc dissipates angular momentum and reduces injury risk. Elite players impart 400–800 rpm disc spin, generating gyroscopic stability that resists perturbation during flight. Aerodynamic lift arises from Bernoulli effect: faster airflow over the disc's upper cambered surface reduces pressure, producing upward force proportional to velocity squared. Hubbard 2000 (disc flight dynamics) modeled these parameters in detail."),
                        sciRow(stat: "Disc stability: gyroscopic precession at 600+ rpm",
                               detail: "A flying disc generates lift and drag according to coefficients that vary with angle of attack — typical CL 0.3–0.9 and CD 0.1–0.2 for a 175 g Ultimate disc at 60–120 km/h. The Magnus effect from disc spin creates a side force perpendicular to both the spin axis and velocity vector. At spin rates above ~600 rpm, gyroscopic precession strongly resists changes to the disc's tilt, damping nutation (wobble) and stabilising the flight path. Below 300 rpm, aerodynamic instability dominates and the disc tumbles. The 175 g Discraft Ultrastar used in elite Ultimate is engineered for these flight characteristics."),
                        sciRow(stat: "Hammer throw: overhead disc release, 45–60° angle of attack",
                               detail: "The hammer is an inverted overhead release with the disc tilted 45–60° off horizontal, exploiting the disc's symmetric aerodynamics for a steep arcing trajectory over defenders. Biomechanically, the throw requires shoulder external rotation in the loading phase (60–90° abduction), wrist pronation through release, and a modified follow-through. At release the disc is nearly vertical, and gyroscopic stability maintains the inverted flight path. Aerodynamic forces in inverted flight produce lateral drift that experienced throwers can predict and aim with."),
                        sciRow(stat: "Forehand (flick): forearm pronation dominant, 700–1,000°/s",
                               detail: "The forehand differs fundamentally from the backhand in its kinetic chain: power originates in the forearm and wrist rather than the shoulder and torso. Forearm pronation velocity peaks at 700–1,000°/s through release, while the index and middle fingers impart spin via a snap against the disc rim. The shorter lever arm sacrifices some maximum velocity vs. the backhand (typically 15–25 km/h slower in matched players) but enables throws from tighter spaces and different body positions. Accuracy at distance requires deliberate wrist stiffness in the initial release phase, then explosive snap, representing a classic accuracy–power trade-off. Forehand hyzer/anhyzer angles control lateral flight path."),
                    ]
                )

                scienceCard(
                    title: "Ultimate Frisbee Physical Demands",
                    icon: "figure.run",
                    color: .yellow,
                    rows: [
                        sciRow(stat: "Elite Ultimate: 8–12 km per game, 85–92% HRmax",
                               detail: "GPS tracking data from AUDL/UPA elite Ultimate players shows 8–12 km total distance per game with average heart rate at 85–92% HRmax during active play. High-intensity running (>18 km/h) constitutes 20–25% of total distance covered, reflecting the repeated-sprint nature of field play. Players execute 40–60 directional changes per game (cuts, defensive pivots), placing high demands on reactive neuromuscular control. Aerobic capacity (VO₂max 60–70 mL/kg/min in elite cutters) drives recovery between efforts."),
                        sciRow(stat: "Cutting: acceleration-deceleration over 10–15 m",
                               detail: "The 'cut' — a sudden directional change to create disc-reception separation — is the defining movement pattern of Ultimate offense. Cuts span 10–15 m of acceleration followed by abrupt deceleration and reacceleration in a new direction. Biomechanically, the plant foot absorbs 3–5× body weight during the change of direction, with high valgus and shear stress at the knee. ACL loading during planting on lateral cuts is substantial; cutting sports have 4–8× higher ACL injury rates than non-cutting sports. First-step acceleration from 0 to 5 m involves maximal neuromuscular recruitment in <0.5 s. Ankle dorsiflexion range of motion strongly predicts cutting efficiency."),
                        sciRow(stat: "Layout: full-body dive catch generates 3–5× body weight impact",
                               detail: "The layout — a full-extension diving catch — is a hallmark of Ultimate and produces ground contact forces of 3–5× body weight on landing. Shoulder labrum and rotator cuff structures absorb impact during outstretched dives; shoulder labrum tears are among the most common serious injuries in Ultimate. Wrist dorsiflexion stress on landing contributes to scaphoid and distal radius fracture risk. Epidemiological data from Ultimate tournaments shows forearm and elbow bruising (from disc contact) is the most common minor injury. Experienced players instinctively tuck and roll to distribute impact forces, reducing peak loading at any single joint."),
                        sciRow(stat: "Handler-cutter energy demands differ 30–40%",
                               detail: "GPS data reveals significant positional differences in Ultimate: cutters cover 30–40% greater total distance and execute 2–3× more sprint efforts per game compared to handlers. Handlers maintain lower average velocities, focus on disc possession and decision-making, and spend more time in stationary or slow-movement states — occupying the disc for high-percentage short passes. Cutters are reactive-movement specialists with high lactate exposure (4–7 mmol/L during pressure sequences). Training should be periodised by position: cutters require repeat-sprint capacity and reactive agility training; handlers benefit from sustained aerobic base and throwing endurance under physical fatigue."),
                    ]
                )

                scienceCard(
                    title: "Disc Golf Performance Science",
                    icon: "sportscourt.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "Disc golf drive: 130–180 km/h, 400–600 ft for elite",
                               detail: "Elite disc golf drivers (e.g., Paul McBeth, Ricky Wysocki) consistently throw 500–600+ ft (152–183 m) with driver discs at 130–180 km/h release velocity. Disc flight physics differ by disc type: overstable drivers (high fade rating) resist turn and finish left (RHBH); understable drivers turn right before fading left at lower speeds. Hyzer angle (tilted towards throwing arm) increases stability and reduces distance; anhyzer angle increases turn. Disc weight (150–176 g) and PDGA-approved diameter (21–30 cm) are tightly regulated. Aerodynamic lift is maximised with a slightly nose-down release angle."),
                        sciRow(stat: "Biomechanics: X-step footwork generates rotational power",
                               detail: "The X-step approach (cross-step followed by a planted pivot foot) is the foundation of disc golf power generation. Hip rotation velocity peaks at 500–700°/s through the downswing, with a shoulder-to-hip separation ('X-factor stretch') of 35–50° at the top of the backswing that stores elastic energy in the thoracolumbar fascia. Wrist snap contributes 800–1,000°/s angular velocity at the moment of release, accounting for 20–30% of disc speed. Reaching the disc back to maximum extension and driving the lead hip forward first (proximal-to-distal sequencing) is the single most important power determinant in high-level disc golf."),
                        sciRow(stat: "Accuracy vs. power: Pareto principle in disc golf scoring",
                               detail: "Scoring analysis across PDGA amateur and professional divisions consistently shows that approach shots and putts (<150 ft / 46 m from the basket) account for 70–80% of all strokes in a round — the sport's Pareto principle. Players improving from 900 to 1000 rated gain more from scramble accuracy than from adding 30 ft of driving distance. Power game improvements reduce par-5 and 'reachable' par-4 equivalents but have diminishing returns on overall scoring. At elite amateur level (~1000 rated), inside-the-circle (C1, <10 m) putting percentage is the strongest single predictor of competitive round scores."),
                        sciRow(stat: "Disc selection: 21 disc types with different flight ratings",
                               detail: "The PDGA flight rating system quantifies four parameters: Speed (1–14, how much force required), Glide (1–7, lift efficiency), Turn (−5 to +1, high-speed tendency to turn right RHBH), and Fade (0–5, low-speed hook left RHBH). A beginner overstable disc (Speed 7 / Glide 5 / Turn −1 / Fade 3) provides predictable, stable flight. An understable driver (Speed 13 / Glide 6 / Turn −3 / Fade 1) maximises distance but requires high arm speed and precise release. Wind conditions fundamentally alter disc flight — headwinds increase effective overstability; tailwinds increase understability. Advanced players carry 15–25 discs to match trajectory demands across all course layouts."),
                    ]
                )

                scienceCard(
                    title: "Ultimate vs. Disc Golf Physiology & Spirit",
                    icon: "heart.fill",
                    color: .yellow,
                    rows: [
                        sciRow(stat: "VO₂max: 60–70 mL/kg/min for elite Ultimate players",
                               detail: "Elite Ultimate players demonstrate aerobic profiles comparable to soccer midfielders: VO₂max 60–70 mL/kg/min for open/elite cutters, 55–63 mL/kg/min for handlers. Blood lactate accumulates to 4–7 mmol/L during sustained defensive pressure sequences and end-zone cutting. The energy system profile resembles soccer: predominantly aerobic (~80%) with repeated glycolytic bursts during sprints and cuts. Unlike soccer, Ultimate's self-officiating structure introduces unique physiological stressors during disputes — cortisol elevation, attentional demands, and heart rate spikes outside of physical exertion."),
                        sciRow(stat: "Spirit of the Game: self-officiated sport affects psychological demands",
                               detail: "Ultimate frisbee is globally unique as a full-contact field sport with no referees below elite competition — the Spirit of the Game (SOTG) principle requires players to call their own fouls honestly under physical fatigue. Research in sports psychology suggests that self-officiation under competitive stress increases executive function demand (cognitive load), activates anterior cingulate conflict-monitoring circuits, and requires inhibition of aggressive responses while in physiological high-arousal states. SOTG scoring at tournaments assesses team fairness, communication, and positive attitude, creating a psychosocial accountability system that distinguishes Ultimate culture from referee-dependent sports."),
                        sciRow(stat: "Disc golf walking: 8–12 km per 18-hole round",
                               detail: "An 18-hole disc golf round on a standard course requires 8–12 km of walking, with elevation gain of 100–400 m on hilly championship courses. Cardiovascular intensity is moderate (50–65% HRmax average) — substantially lower than Ultimate but contributing to daily movement targets. Caloric expenditure is estimated at 400–700 kcal per round depending on course difficulty, body mass, and terrain. The low-impact nature makes disc golf accessible to older adults and individuals in rehabilitation; the cognitive demands of course management and shot selection provide mental engagement that correlates with improved mood and reduced anxiety in recreational players."),
                        sciRow(stat: "Warm-up: rotator cuff pre-activation reduces throwing injury 25–35%",
                               detail: "Overhead and lateral throwing sports share rotator cuff loading patterns with baseball and tennis. Evidence from throwing sport injury prevention literature indicates that rotator cuff pre-activation (internal/external rotation with resistance bands, 2 sets × 15 reps each direction) before throwing sessions reduces shoulder injury incidence by 25–35%. For disc sports, a progressive warm-up protocol includes wrist/forearm flexibility exercises, dynamic disc catching and easy throws progressing from 20 ft to full-distance over 10–15 minutes, shoulder circles, and forearm pronation/supination mobility. Elbow medial collateral ligament stress from the forehand throw warrants specific valgus-loading tolerance training in players who throw extensively."),
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Disc Sports Science")
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
        let discSports = workouts.filter { $0.workoutActivityType == .discSports }
        let sessions = discSports.count
        let totalHR = discSports.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = discSports.map { $0.duration / 60 }.reduce(0, +)
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
