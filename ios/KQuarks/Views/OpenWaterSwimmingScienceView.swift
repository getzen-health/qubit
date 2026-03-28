import SwiftUI
import HealthKit

struct OpenWaterSwimmingScienceView: View {
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
                    statCard(value: String(format: "%.0f bpm", avgHR), label: "Avg HR", color: .teal)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .cyan)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Cold Water Physiology",
                    icon: "thermometer.snowflake",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Cold shock: gasp reflex and hyperventilation at <15°C immersion",
                               detail: "Initial cold water immersion triggers an involuntary gasp reflex (1–2 L inhalation), hyperventilation 2–3× resting rate sustained for approximately 90 seconds, cardiac stress of 10–30 bpm heart rate increase, and significant swimming failure risk. Tipton 2003 (cold water immersion physiology) identified this as the primary risk mechanism — not hypothermia — in the critical first minutes of immersion. Controlled, gradual entry is essential: entering quickly with breath held and acclimatising before relaxing suppresses the shock response. Many open water drowning deaths occur within the first 3 minutes of immersion from cold shock-induced panic and inhalation."),
                        sciRow(stat: "Hypothermia timeline: 15°C water — functional impairment in 30 min",
                               detail: "Swim failure — not hypothermia — is the primary cold water drowning cause for recreational swimmers. Neuromuscular cooling begins peripherally: hand and arm function deteriorates before core temperature drops below the hypothermia threshold of 35°C. At 15°C water temperature, untrained individuals can expect functional impairment (inability to swim effectively) within 30 minutes and incapacitation within 60–90 minutes. Swimming distance: approximately 1–2 km before functional impairment at 15°C for untrained individuals; 0.5–1 km at 10°C. Elite open water swimmers with cold acclimatisation and protective body fat extend this substantially."),
                        sciRow(stat: "Cold water adaptation: 'cold habituation' reduces shock response 40%",
                               detail: "Repeated cold water immersion produces cold habituation — a 40% reduction in the cold shock response (hyperventilation magnitude and duration) without changing the rate of heat loss. Progressive thermal acclimatisation protocols over 5–10 sessions of cold water exposure produce measurable adaptation. Elite cold water marathon swimmers develop enhanced capacity for peripheral vasoconstriction maintenance, reducing heat loss from extremities while preserving core temperature. The adaptation is highly specific to the temperature experienced — habituation at 12°C does not fully transfer to 8°C. This is a neurological rather than metabolic adaptation."),
                        sciRow(stat: "Wetsuits: +0.5 km/h speed, +6–8% buoyancy benefit",
                               detail: "Wetsuits provide multiple performance benefits: thermoregulation by trapping a thin water layer, buoyancy benefit of 6–8% through hip elevation improving body position (reducing drag), and reduced frontal area through improved horizontal alignment. The speed benefit is approximately +0.5 km/h compared to skin swimming at equivalent effort. World Aquatics (formerly FINA) wetsuit regulations for competition: maximum thickness 5 mm at torso, 3 mm at limbs, no coverage above neck or below ankles, no zip or fastener on front. In wetsuit-legal events (typically water <18°C or >24.6°C), athletes gain meaningful performance benefits, making wetsuit thermal strategy a significant race consideration.")
                    ]
                )

                scienceCard(
                    title: "Navigation & Tactical Science",
                    icon: "location.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Sighting: every 8–12 strokes adds 2–3% distance overhead",
                               detail: "Head-lift sighting mechanics — the 'crocodile eye' technique where only the eyes clear the water — must be timed within the stroke cycle to minimise energy cost. Optimal sighting frequency of every 8–12 strokes represents the minimum necessary for course correction in calm conditions; choppier water demands more frequent sighting. The energy cost of repetitive sighting is real: neck extension increases active drag and disrupts hip position temporarily. Without any sighting, directional deviation is 5–15° per minute depending on conditions — this compounds to 8–20% excess total distance swum. Bilateral breathing provides an inherent navigation advantage by allowing more visual reference points across a 180° arc."),
                        sciRow(stat: "Drafting: 18–25% reduced oxygen cost behind lead swimmer",
                               detail: "Hydrodynamic drafting in open water swimming reduces oxygen cost by 18–25% when positioned 0.5–1.5 m directly behind the lead swimmer's feet — the primary wake pocket. Hip-side drafting (alongside the lead swimmer) yields a smaller but measurable 10–15% benefit. Pack swimming tactics in Olympic 10 km events involve staying embedded in the lead group through feeding stations, conserving energy for the decisive sprint in the final 500 m. Breaking away from a pack requires significantly higher oxygen cost and is only strategically warranted when the athlete has a superior sprint or if the pack falls into unfavourable current positioning. The psychological demand of maintaining proximity — swimming over other athletes' feet — is considerable."),
                        sciRow(stat: "Current and tidal management: expert navigation = 5–15 min advantage",
                               detail: "Reading water current patterns is a learned skill central to elite open water performance. Experts use visible surface texture, flotsam movement, buoy line angles, and pre-race reconnaissance to identify current assistance zones. Cross-current tactics employ ferry gliding: angling the body at 10–30° to the desired course to compensate for lateral drift, minimising total distance while using current velocity. In ocean events, tidal window timing is critical — the English Channel crossing of 21–23 nautical miles (34 km) must be timed for a 6-hour tidal window that reverses twice: swimmers who miss the window may be swept off course and forced to abandon attempts hours from the French coast. Current management advantages of 5–15 minutes are common in competitive events."),
                        sciRow(stat: "English Channel: 34 km, 7–16°C, average 13–15 hours",
                               detail: "Marathon swimming physiology at the English Channel scale requires caloric expenditure of 500–600 kcal per hour at race pace, necessitating feeding every 30–45 minutes to prevent glycogen depletion and hypoglycaemia. Channel Swimming Association rules mandate liquid feeds only, passed on a pole from support boat to swimmer without touching the boat (which would invalidate the attempt). Nutrition logistics involve liquid carbohydrate concentrates, electrolyte supplementation, sodium management (sea water ingestion is inevitable), and glycerol for thermoregulation. Crew support structure is critical: experienced support swimmers, navigator, feeding coordinator, medic. Mental strategies must address 13–15 hours of continuous swimming — cognitive disengagement, goal segmentation by landmark, and crew communication protocols are systematically planned.")
                    ]
                )

                scienceCard(
                    title: "Performance Physiology",
                    icon: "heart.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "VO₂max: 65–75 mL/kg/min for Olympic 10 km elite",
                               detail: "The Olympic open water 10 km event takes elite athletes approximately 118–125 minutes, with aerobic energy contribution exceeding 95%. VO₂max requirements are similar to elite pool swimmers (65–75 mL/kg/min for men, 55–65 mL/kg/min for women), but race performance additionally depends on navigation skill, physical contact management during pack swimming, feeding proficiency, and tactical intelligence about current and positioning — variables absent from pool events. Race pacing strategy involves conserving energy in the main pack through the middle 7 km, positioning for drafting advantage, and executing a sprint finish in the final 500 m where 30–40% of overall finishing positions are determined."),
                        sciRow(stat: "Body fat: 14–20% (higher than pool) for thermal insulation",
                               detail: "Subcutaneous fat plays a genuine thermoregulatory role in open water swimming by insulating against heat loss in cold water. Elite Olympic 10 km open water racers typically carry 2–5% more body fat than their pool swimming counterparts at equivalent performance levels — this is a physiologically rational adaptation, not a training deficit. Marathon Channel swimmers (who swim in 7–16°C water for 13+ hours) may carry 20–25% body fat specifically for thermal protection; Diana Nyad and other ultra-marathon swimmers have documented the thermal benefit systematically. The performance vs. thermal protection trade-off means optimal open water body composition is event-specific: 10 km racing in 20°C water requires less fat insulation than a Channel attempt."),
                        sciRow(stat: "Jellyfish and hazards: immune and stress response physiology",
                               detail: "Environmental stress responses during open water competition include jellyfish sting-induced cortisol and adrenaline release, which acutely elevates heart rate 10–20 bpm and may impair stroke mechanics through pain-induced tension. Sun exposure triggers UV-mediated melanin production and inflammatory cascades; long-duration events risk photokeratitis and UV-B skin damage (applying sunscreen is prohibited in some Channel rules due to water contamination concerns). Salt water aspiration risks electrolyte imbalance and pulmonary irritation in rough conditions. Swimmer's ear (external otitis) from fungal colonisation in the ear canal is common with high open water volume. The psychological and physiological response to marine life contact — particularly the startle response to jellyfish, sea lice, or seagrass — can disrupt stroke rhythm significantly."),
                        sciRow(stat: "Pacing strategy: negative split improves finishing position",
                               detail: "GPS pacing data from FINA World Championship 10 km events consistently shows that athletes using a negative split strategy — second half of the race swum 2–4% faster than the first half — finish an average of 5–8 positions higher compared to athletes who go out hard and degrade. Pack dynamics complicate individual pacing: being dropped from the leading pack in the first 3 km incurs a 15–20% oxygen cost penalty from losing drafting benefit. Optimal strategy is to embed in the lead pack conserving 8–12% energy via drafting, then execute a tactical surge at the final feeding station (typically 500–800 m to finish) when pack cohesion breaks and sprint capacity is the decisive variable.")
                    ]
                )

                scienceCard(
                    title: "Training Science",
                    icon: "chart.bar.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Elite volume: 60–80 km per week, 50% open water",
                               detail: "Elite open water swimmer training distribution typically involves 60–80 km per week total swimming volume, with approximately 50% completed in open water. Open water time is irreplaceable for developing navigation skill under realistic conditions, thermal acclimatisation, tactical racing instincts, and the psychological comfort with deep, dark, or rough water that pool training cannot replicate. Pool training remains essential for stroke mechanics development, high-intensity interval work at precise physiological targets (critical velocity, VO₂max intervals), and monitoring via pace clocks. National programme structures typically periodise the open water component to peak during the competitive season (May–September in the Northern Hemisphere), with more pool-heavy training through winter months."),
                        sciRow(stat: "Cold acclimatisation protocol: 3× weekly cold exposure over 4 weeks",
                               detail: "Evidence-based cold water acclimatisation for competitive open water swimming involves progressive cold exposure 3 times weekly over 4 weeks, beginning at a manageable temperature (typically 14–16°C for swimmers accustomed to warmer water) and progressively decreasing by 0.5–1°C per week. Cold shower protocols (3–5 minutes at maximum cold domestic water temperature, typically 8–12°C) complement open water exposure when natural cold water access is limited. Thermoregulation monitoring includes pre- and post-session rectal or oesophageal temperature, subjective comfort scales, and shivering onset time. Performance outcomes include: reduced cold shock magnitude, earlier onset of peripheral vasoconstriction, improved comfort in target race temperatures, and approximately 10–15% extension of functional swimming time before impairment."),
                        sciRow(stat: "Nutrition: 200–400 kcal/hour during ultra-marathon swims",
                               detail: "Feeding logistics in marathon swimming events (Channel attempts and ultra-marathon races) require liquid feeds only per Channel Swimming Association and Marathon Swimmers Federation rules. Carbohydrate concentration targets of 60–80 g per hour prevent glycogen depletion across multi-hour efforts. Electrolyte supplementation addresses sodium and potassium losses elevated by cold-induced diuresis. Sodium management is critical: sea water ingestion during rough conditions or wave-breaking increases sodium load, and hyponatraemia risk is paradoxically elevated in athletes drinking excessive plain water. GI tolerance at race intensity requires individual validation — high-intensity swimming with water ingestion creates significant nausea risk in some athletes, necessitating practicing feeding protocols in training to identify optimal formula, concentration, and timing."),
                        sciRow(stat: "Psychological preparation: isolation tank and dark water management",
                               detail: "Mental training for open water addresses a distinct psychological challenge set absent from pool competition: managing fear of deep water (thalassophobia), discomfort in water with limited visibility, darkness during night Channel crossings (some attempts last beyond sunset), physical isolation from any stable support surface, and the very long duration cognitive demands of 10+ hour swims. Hallucination risk in extreme ultra-swims exceeding 20 hours has been documented — visual hallucinations of obstacles, finish lines, or familiar people are reported by experienced marathon swimmers. Systematic psychological preparation includes: open water graduated exposure therapy for deep water anxiety, visualisation of key race moments (first cold plunge, rough patch management, feeding stations), motivational strategy planning with crew, and cognitive strategies for managing boredom and maintaining stroke focus across hours of monotonous effort.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Open Water Science")
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
        let ow = workouts.filter { $0.workoutActivityType == .swimming }
        let sessions = ow.count
        let totalHR = ow.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = ow.map { $0.duration / 60 }.reduce(0, +)
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
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
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
                .foregroundStyle(color)
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
            Text(detail).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
