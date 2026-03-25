import SwiftUI
import HealthKit

struct CurlingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .cyan)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .gray)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Stone Delivery Biomechanics",
                    icon: "circle.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Hack velocity: stone released at 2.0–2.8 m/s for draw weight",
                               detail: "Delivery mechanics from the hack involve leg drive, hip extension, upper body glide, and release velocity determining end destination (house vs. blank end). Penrose 1996 (curling biomechanics): draw weight 2.2–2.5 m/s; guard 2.0–2.2 m/s; takeout 2.6–3.2 m/s. Precise velocity control at release — within ±0.1 m/s — is the primary determinant of shot outcome in elite play."),
                        sciRow(stat: "Turn (rotation): 2–4 rotations over 28.35 m",
                               detail: "Stone rotation mechanics (curl in-turn and out-turn) create path curvature through the Magnus effect, deflecting the stone 0.3–0.5 m off the centre line. Pebble texture on ice creates asymmetric friction between the leading and trailing edge of the running band. World Curling Federation stone weight maximum: 19.96 kg (44 lbs). Rotation rate decays as stone decelerates; the path curves more sharply in the final 5–8 m of travel."),
                        sciRow(stat: "Slide delivery: 8–12 m glide phase on hack foot",
                               detail: "Curling delivery slide biomechanics require centre of gravity positioned precisely over the sliding foot (slider shoe on non-dominant foot), broom stabilisation in the non-throwing hand, and trunk forward lean of 20–30° for balance and stone release control. Kinesiology studies of hack delivery vs. standing delivery (common in older/adaptive players) show slide delivery improves velocity consistency by 12–18%. Slider surface coefficient of kinetic friction: ~0.02."),
                        sciRow(stat: "Shot accuracy: elite teams achieve 85–95% shot percentage",
                               detail: "Competitive shot percentage metrics are tracked by World Curling Tour scoring systems. Leaders such as Brad Gushue (Canada) and Niklas Edin (Sweden) routinely exceed 88% shot percentage over full seasons. Shot percentage accounts for both weight (velocity) accuracy and line (direction) accuracy, scored 0–4 per shot. Skip shot percentage is weighted most heavily; teams with skip percentages above 90% win >75% of competitive games.")
                    ]
                )

                scienceCard(
                    title: "Sweeping Science",
                    icon: "figure.curling",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Sweeping: can move stone 3–4 feet further; alters curl 1–2 feet",
                               detail: "World Curling Federation research: vigorous sweeping reduces the friction coefficient 15–20%, adding 0.9–1.2 m of distance and reducing curl 0.3–0.6 m. Ice temperature at the surface: −5 to −3°C; sweeping generates localised heat of 5–8°C at the ice-broom interface, transiently melting surface pebble tops to create a thin water film. Sweeper downward force applied: 15–30 kg. Skilled skip communication (hurry hard vs. clean) allows precise trajectory adjustment mid-delivery."),
                        sciRow(stat: "Sweeping intensity: 85–90% HRmax for 8–12 s sweeping burst",
                               detail: "Metabolic demands of vigorous sweeping: heart rate reaches 85–92% HRmax during maximal 8–12 s sweeping bursts. Blood lactate accumulates to 3–5 mmol/L after multiple consecutive sweeping efforts in the same end. Total sweeping distance per game: 2–4 km across 8–10 ends. Despite short burst durations, cumulative sweeping load across a competitive game represents significant cardiovascular and muscular work, particularly for lead and second players who sweep every stone."),
                        sciRow(stat: "Broom technology: directional pad allows asymmetric sweeping",
                               detail: "The 'directional sweeping' controversy emerged in 2016: directional fabric pads allowed elite sweepers to steer the stone's path with unprecedented precision, effectively controlling curl independent of delivery rotation. The WCF banned directional pads after one competitive season, mandating brush-only heads that limit asymmetric friction application. This ruling preserved the strategic balance between delivery precision and sweeping influence, preventing sweeping from dominating shot outcome."),
                        sciRow(stat: "Heart rate response: curling game average 55–70% HRmax",
                               detail: "Overall match HR is substantially lower than sweeping peaks due to extended strategy planning, waiting, and walking phases between deliveries. Skip and vice-skip positions average 55–65% HRmax per game; lead and second positions average 60–70% HRmax due to greater sweeping volume. Walking distance per game: 2–3 km in skip position, 3–4 km for lead. Total caloric expenditure: 300–450 kcal/game. Curling qualifies as moderate aerobic activity punctuated by high-intensity anaerobic sweeping bursts.")
                    ]
                )

                scienceCard(
                    title: "Ice Science & Stone Physics",
                    icon: "thermometer.snowflake",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Ice pebbling: 1–2 mm raised droplets reduce contact area 90%",
                               detail: "Curling ice pebbling technique uses pressurised warm water spray to create 1–2 mm raised hemispherical spots on the ice surface. The running band of the stone (6 mm wide annular contact ring) contacts only the tops of pebbles, reducing the true contact area by approximately 90% compared to flat ice. Friction coefficient: 0.01–0.03 — among the lowest of any sport surface. Ice maker expertise in temperature management (−5 to −3°C surface, −7 to −5°C bulk), humidity control, and pebble height consistency is critical for reproducible stone behaviour."),
                        sciRow(stat: "Curl physics: still debated — 'scratching' hypothesis vs. pressure melting",
                               detail: "Shegelski 2016 (physics of curling curl): two competing physical models explain stone curl direction. The pressure melting model holds that asymmetric pressure on the running band creates a water film differential. The micro-scratching model proposes that the rotating running band scratches pebble tops directionally, creating asymmetric friction that steers the stone. Experimental evidence from high-speed video and force-plate studies supports the scratching model. Critically, stone speed affects curl magnitude: faster stones curl less (velocity-dependent friction) — a key consideration in skip strategy for different weight calls."),
                        sciRow(stat: "Stone material: granite from Ailsa Craig, Scotland",
                               detail: "Ailsa Craig micro-granite from the Scottish island of Ailsa Craig is specifically selected for curling stones due to its exceptionally low water absorption (< 0.1%), hardness sufficient to prevent chipping on pebble contact, and optimal thermal conductivity that maintains stable running band temperature. Approximately 90% of stones used in Olympic curling are made from Ailsa Craig granite. Each stone costs $700–$900 USD and lasts decades with professional maintenance (polishing the running band, replacing the handle). The island's quarry has limited extraction access; stone blanks are stockpiled."),
                        sciRow(stat: "Hog line sensors: electronic detection of stone release",
                               detail: "The WCF hog line violation detection system uses an electronic sensor embedded in the stone handle that detects the precise moment the thrower releases their grip. The stone must be fully released (all fingers off the handle) before the leading edge crosses the near hog line. The electronic system replaced line judges in all world-level competition in 2002. Error rate of the electronic system: < 0.1% per stone delivery. The sensor light: green = legal release, red = hog line violation. Violations result in the stone being immediately removed from play.")
                    ]
                )

                scienceCard(
                    title: "Strategy, Psychology & Fitness",
                    icon: "brain.head.profile",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Shot selection: 50–60 strategic decisions per game",
                               detail: "Curling is widely described as 'chess on ice': the skip makes 50–60 major strategic decisions per game — roughly 5–7 per end. Decision variables include current score, end number, hammer (last rock) advantage, estimated shot percentages for multiple options, ice conditions (delivery path, pebble wear), and opponent tendencies. Monte Carlo probability models are now used in elite coaching programmes to calculate expected-point thresholds for shot selection decisions, particularly blanking ends vs. attempting to score multiple points."),
                        sciRow(stat: "Pressure index: last-rock advantage worth +0.8 end score",
                               detail: "Statistical analysis of international curling outcomes: possessing the hammer (last rock delivery) in an end generates an expected 0.8 additional points compared to the non-hammer team. A steal — scoring one or more points without the hammer — represents a swing of approximately 1.8 expected points. Strategically blanking an end (both teams score 0, hammer retained) is optimal when leading by 1–2 points in the final ends, preserving hammer advantage without risk. Elite teams blank an end intentionally approximately 20–25% of the time."),
                        sciRow(stat: "Fitness evolution: conditioning now standard in elite curling",
                               detail: "Modern elite curling conditioning programmes emphasise leg strength (for hack drive power and slide stability), core stability (delivery balance and rotation control), and cardiovascular fitness (sweeping endurance across 8–10 ends). World-class teams competing at Olympic and World Championship level train 10–15 hours per week in Olympic cycles, combining gym sessions, on-ice technical practice, and conditioning work. This contrasts markedly with recreational curling, which places minimal fitness demands on participants and remains accessible across a wide age range."),
                        sciRow(stat: "Visualization: skip imagery before shot selection",
                               detail: "Pre-shot routine in elite curling: the skip surveys the ice, visualises the intended stone path (accounting for curl and pebble wear), consults with the vice-skip on line and weight call, and delivers the shot instruction within a 15–25 s decision window per delivery. Attentional focus research in closed-skill sports (Wulf 2013) demonstrates that an external focus on the stone's target destination consistently outperforms an internal focus on delivery mechanics. Top skips develop consistent pre-shot rituals over years of competition to manage cognitive load and sustain decision quality across a 2–2.5 hour game.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Curling Science")
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
        let curling = workouts.filter { $0.workoutActivityType == .curling }
        let sessions = curling.count
        let totalHR = curling.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = curling.map { $0.duration / 60 }.reduce(0, +)
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
