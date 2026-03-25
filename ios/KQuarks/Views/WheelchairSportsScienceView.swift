import SwiftUI
import HealthKit

struct WheelchairSportsScienceView: View {
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
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .orange)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .red)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Wheelchair Racing Biomechanics",
                    icon: "figure.roll",
                    color: .blue,
                    rows: [
                        sciRow(stat: "T54 100m world record: 13.63 s (Marcel Hug)",
                               detail: "Paralympic sprint wheelchair racing demands push frequencies of 2.5–3.5 Hz during sprint events, with propulsive force per stroke ranging 150–300 N. The aerodynamic tuck position is critical for reducing drag at peak velocity. Carbon fiber racing chairs weigh 7–9 kg. Veeger 1992 established foundational wheelchair propulsion biomechanics, showing shoulder internal rotation and elbow extension as primary force generators. Racing chairs use rigid frames, cambered rear wheels, and low-set seating to minimise centre of mass height during cornering at competition speed."),
                        sciRow(stat: "Push mechanics: shoulder internal rotation and elbow extension",
                               detail: "The propulsive arc spans 10°–80° behind the wheel axle, with hand contact duration of 50–80 ms per stroke. Wrist supination during hand placement facilitates optimal grip and force transfer. Shoulder girdle biomechanics are under extreme repetitive load — estimated cumulative shoulder forces in a T54 marathon exceed those in any able-bodied overhead sport. The recovery phase (non-contact) represents approximately 70% of the stroke cycle; shoulder impingement risk is highest during this phase due to the abducted, elevated return trajectory. Seating position affects trunk contribution — higher seating allows more trunk flexion-extension contribution."),
                        sciRow(stat: "Marathon wheelchair: 42.195 km in under 1:20:00 elite",
                               detail: "T54 marathon pacing demands sustained aerobic output at 85–92% VO₂peak. Aerodynamic drafting behind another racing chair provides approximately 30% drag reduction — comparable to cycling — making tactical positioning critical in mass-start marathons. Gear ratio selection (via wheel size and push frequency modulation) is adapted for uphill gradients where push frequency increases and stroke force decreases, and flat sections where athletes optimise propulsion efficiency. Elite T54 athletes sustain average speeds > 30 km/h across full marathon distance with sub-2 min/km pace."),
                        sciRow(stat: "Glove biomechanics: friction coefficient optimisation",
                               detail: "Push glove materials range from leather to synthetic composites, with optimal coefficient of friction 0.3–0.6 for effective energy transfer from hand to push rim. Too low a friction coefficient causes hand slip and energy loss; too high increases blister risk and skin shear forces. Blister prevention and pressure distribution over the thenar eminence and fingertip contact zones are primary design drivers. Elite athletes customise glove thickness and palm padding based on event distance — sprint events favour thinner gloves for feel, marathon events favour more padding for sustained contact protection across 3,000+ push strokes.")
                    ]
                )

                scienceCard(
                    title: "Wheelchair Basketball & Court Sports",
                    icon: "figure.basketball",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Wheelchair basketball: 4–6 km court distance per game",
                               detail: "Wheelchair basketball movement demands include sprint velocities of 12–15 km/h, rapid turning within a minimum turning radius determined by chair configuration, and high-frequency direction changes. Vanlandewijck 2004 established that wheelchair basketball performance is determined by the functional classification system (1.0–4.5 points, based on trunk control and upper limb function) — higher-classified players exhibit greater mobility and chair manoeuvrability. Team configurations must sum to ≤14 classification points per five players on court, ensuring mixed functional groups play simultaneously and creating strategic team composition decisions."),
                        sciRow(stat: "Shooting mechanics: trunk stability replaces lower body base",
                               detail: "Wheelchair basketball shooting biomechanics differ fundamentally from standing basketball — trunk extension and shoulder elevation during the shooting motion replace the lower body drive phase that generates force in ambulatory players. Elbow guide alignment remains critical for accuracy. Chair position relative to the basket is optimised pre-shot: players must brake, position, and stabilise the chair before shot release, adding a chair-control skill component absent in ambulatory shooting. Seating classification directly affects shooting arc — lower-classified players with reduced trunk stability adopt compensatory shooting styles with reduced arc height and altered release points."),
                        sciRow(stat: "Wheelchair tennis: 2.5–4 km per set",
                               detail: "Court coverage demands in wheelchair tennis include lateral chair drives, forward sprints to the net, and backward recovery — all performed during active ball-striking. The two-bounce rule (the ball may bounce twice before the return) fundamentally alters court positioning strategy compared to standing tennis. Top spin generation without leg drive requires compensatory shoulder internal rotation velocity and wrist flexion rate. Serve mechanics from a seated position alter trunk rotation range and reduce serve velocity compared to standing serves — elite wheelchair tennis serve velocities average 120–145 km/h versus 180–200 km/h for standing players. Chair positioning for groundstrokes prioritises perpendicular approach angles."),
                        sciRow(stat: "Wheelchair rugby: quad classification 0.5–3.5 points",
                               detail: "Wheelchair rugby is a mixed impairment sport for athletes with impairment affecting all four limbs — the only Paralympic team sport with this classification criterion. Chair-to-chair contact mechanics involve deliberate blocking and picking actions; rugby wheelchairs are purpose-built with wing guards and bumpers designed for impact. Ball-handling capability varies enormously across the 0.5–3.5 classification range, with low-classified athletes relying on chair-to-chair blocks while high-classified players are primary ball carriers. The physiology of impact wheelchair sport introduces upper-body collision deceleration loads not encountered in court sports, requiring neck and shoulder stabilisation training.")
                    ]
                )

                scienceCard(
                    title: "Physiological Demands",
                    icon: "heart.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "VO₂peak: 30–55 mL/kg/min (smaller muscle mass = lower absolute)",
                               detail: "Upper-body aerobic limitation in wheelchair athletes is a function of active muscle mass — the arms and shoulder girdle provide a substantially smaller aerobic engine than the legs plus trunk of ambulatory athletes. When VO₂peak is expressed per kilogram of estimated active muscle mass rather than total body mass, values in elite wheelchair athletes approach or equal those of elite able-bodied endurance athletes. Brachial cardiovascular adaptations — increased cardiac output via stroke volume, elevated arm capillarisation, and elevated oxidative enzyme capacity in shoulder musculature — are the training targets for wheelchair endurance performance."),
                        sciRow(stat: "HR max: 110–145 bpm in high-level spinal cord injury",
                               detail: "Autonomic dysreflexia risk in high-level SCI athletes (T6 and above) is a key safety concern during maximal exercise. HR max is substantially reduced from sympathetic innervation loss below the level of injury — athletes with complete C5–T5 injuries typically cannot achieve HR above 130–145 bpm via volitional exercise alone, compared to age-predicted maxima of 185–200 bpm. Classification of autonomic nervous system function (AIS grade) directly predicts the degree of cardiac response limitation. During thermoregulatory stress, these athletes cannot increase heart rate as a compensatory mechanism, making cardiac output increases dependent entirely on stroke volume responses."),
                        sciRow(stat: "Thermoregulation: impaired below level of injury",
                               detail: "Absent sweating below the SCI level eliminates evaporative cooling from the majority of body surface area, creating severe heat illness risk during outdoor competition in warm conditions. Cooling strategies for wheelchair athletes include pre-cooling ice vests targeting the upper body and neck, cold water immersion of functioning upper extremities, head and neck cooling towels, and aggressive shade and microclimate control. Environmental modification (scheduled competition during cooler parts of day, WBGT limits) is enshrined in Paralympic competition guidelines. Core temperature monitoring via ingestible thermistors is used in elite para sport heat management protocols."),
                        sciRow(stat: "Pressure injury: prevention during prolonged sports activity",
                               detail: "Ischial tuberosity weight distribution during competition is affected by seating position, chair tilt angle, and activity intensity. Sustained static seated posture during long competition events (marathon, tennis matches) increases pressure injury risk at bony prominences. Sports-specific seat cushion design uses pressure mapping technology to identify peak pressure zones and distribute load across wider surface areas. Transfer protocols between sport chair and everyday wheelchair minimise cumulative tissue loading. Prevalence of pressure injuries in Paralympic athletes is estimated at 15–30% annually, with competition-related injuries concentrated in multi-hour events. Regular weight relief lifts (every 15–30 min when not competing) are standard athlete education.")
                    ]
                )

                scienceCard(
                    title: "Classification Science & Para Sport",
                    icon: "chart.bar.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Paralympic classification: evidence-based sport class assignment",
                               detail: "Tweedy 2011 established the modern framework for Paralympic classification research: sport class assignment is based on activity limitation testing specific to each sport's movement demands, minimum disability criteria exclude athletes with insufficient impairment, and within-class performance variance should be minimised. Classification error rates — incorrect placement of athletes into sport classes — have measurable impacts on competition fairness. The IPC Classification Code (2015) mandated that all Paralympic sports develop evidence-based classification systems by 2024, replacing historical clinician-judgement approaches with sport-specific field testing of activity limitation."),
                        sciRow(stat: "Technology: carbon frame materials reduce rolling resistance 30–40%",
                               detail: "Racing wheelchair materials science has evolved from aluminium to aerospace-grade carbon fibre, reducing frame weight and increasing stiffness-to-weight ratio. Spoke tension optimisation minimises lateral wheel flex during cornering. Cambered wheel angles of 15–20° widen the base of support for lateral stability without excessively increasing chair width on course. Anti-tip wheels prevent backward tipping during steep ascents. Sports chairs versus everyday wheelchairs differ in rigidity, camber, seating angle, and wheel specification — everyday chairs are designed for multi-surface versatility; sports chairs sacrifice versatility for peak performance in a specific event type."),
                        sciRow(stat: "Boosting: induced autonomic dysreflexia for performance — banned",
                               detail: "Autonomic dysreflexia (AD) — a dangerous hypertensive response to noxious stimuli below the SCI level — can transiently increase HR, blood pressure, and performance in high-level SCI athletes. Deliberate induction through tight strapping, leg compression, or bladder distension is known as 'boosting' and is a banned practice under IPC strict liability. Physiological mechanism: noxious stimulus triggers mass sympathetic discharge below the injury level, elevating systolic blood pressure to 250+ mmHg — creating severe stroke risk. Detection methods include resting blood pressure measurement before competition (>20 mmHg above baseline = investigation trigger). Up to 15% of high-level SCI Paralympic athletes have reported historical boosting use in anonymous surveys."),
                        sciRow(stat: "Integration of para athletes: training science bridging gap",
                               detail: "Evidence increasingly demonstrates that para athletes' periodisation, strength training, and tapering principles mirror able-bodied sport science when appropriately adjusted for active muscle mass, classification constraints, and impairment-specific physiological responses. Progressive overload, supercompensation, and peaking protocols apply directly. The primary adaptations required are: scaling training volume to active muscle mass (not total body mass), accounting for reduced maximal HR in HRV-based readiness monitoring, modifying plyometric and power training to upper-body equivalents, and integrating pressure injury prevention into recovery protocols. The gap between para and able-bodied sports science evidence bases is narrowing rapidly, driven by International Paralympic Committee research investment.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Wheelchair Sports Science")
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
        // HealthKit does not have a dedicated wheelchair sports HKWorkoutActivityType.
        // Wheelchair-specific activities (racing, basketball, tennis, rugby) are typically
        // logged as .other by athletes or via third-party apps. Filter by .other here.
        let wheelchairSports = workouts.filter { $0.workoutActivityType == .other }
        let sessions = wheelchairSports.count
        let totalHR = wheelchairSports.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = wheelchairSports.map { $0.duration / 60 }.reduce(0, +)
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
