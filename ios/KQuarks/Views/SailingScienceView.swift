import SwiftUI
import HealthKit

struct SailingScienceView: View {
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
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .teal)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .cyan)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Hiking Biomechanics & Core Demands",
                    icon: "wind",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Hiking position: 40–70° body angle over water, isometric quad hold",
                               detail: "Dinghy hiking mechanics require the sailor to suspend their body outboard at 40–70° from vertical, with feet locked under the hiking strap. The quadriceps sustain an isometric contraction at approximately 90° knee flexion, generating forces 2–3× body weight transmitted through the ankles and hiking strap. Core stabilisation is continuously active to control trunk angle against wave motion and wind variation. Olympic Laser and Finn class sailors can sustain continuous hiking for 20–40 minutes per upwind leg without repositioning. Cunningham 2009 biomechanical analysis quantified ankle-strap contact forces and trunk stabilisation demands across wind conditions."),
                        sciRow(stat: "Quad endurance: primary discriminator in dinghy sailing performance",
                               detail: "Vogiatzis 2002 research on Laser class hiking intensity confirmed that isokinetic quadriceps strength and endurance are the primary physiological predictors of dinghy sailing performance. Strength-to-weight ratio governs hiking efficiency — lighter sailors with proportionally greater quad strength maintain longer and more stable hiking angles in stronger winds. Training protocols validated in elite programmes include wall-sit endurance (target: 4–6 min continuous), leg-press endurance sets, and purpose-built hiking ergometers that replicate the exact joint angles and force vectors of on-water hiking."),
                        sciRow(stat: "Trapeze sailing: whole-body horizontal suspension",
                               detail: "Trapeze sailing (49er, 470, Nacra 17) demands whole-body horizontal suspension from a wire attached to the mast, with the sailor standing on the gunwale at near-horizontal body angle. Shoulder and arm loading is substantial as the sailor adjusts body angle and fore-aft position in response to boat speed and wave action. Hip flexor and abdominal demands are markedly higher than in conventional hiking — the sailor must maintain horizontal posture against gravitational forces while dynamically controlling lateral balance. Wire tension and optimal body angle are continuously adjusted to maximise righting moment and boat speed across all points of sail."),
                        sciRow(stat: "Windsurfing: upper body pulling forces 200–400 N",
                               detail: "Windsurfing rig control in planing conditions generates sail sheeting forces of 200–400 Newtons through the boom and harness. Grip and forearm endurance are primary fatigue sites, with extensor carpi radialis and flexor digitorum superficialis showing early electromyographic fatigue signatures in extended racing. Core rotation is continuously recruited for pumping in light-air and freestyle conditions. At higher wind speeds (20+ knots), harness hook load transfers force to the trunk, reducing arm demand but increasing spinal loading. Rig-control forces scale with wind speed squared, making high-wind racing disproportionately demanding on the upper body.")
                    ]
                )

                scienceCard(
                    title: "Cardiovascular & Physical Demands",
                    icon: "heart.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "VO₂max: 55–68 mL/kg/min for Olympic dinghy sailors",
                               detail: "Castagna 2007 physiological profiling of Olympic dinghy sailors confirmed VO₂max values of 55–68 mL/kg/min, reflecting substantial aerobic capacity demands. Heart rate during upwind hiking work reaches 75–90% HRmax, and blood lactate accumulates to 3–6 mmol/L during extended hiking sequences at the upper end of the wind range. Aerobic fitness enables sustained hiking power output across long upwind legs and supports cognitive function under physical fatigue — a critical interaction in tactical racing. Dinghy classes with more downwind sailing (470, 49er) have lower average HR but higher peak demands during spinnaker manoeuvres."),
                        sciRow(stat: "Keelboat crews: 4–8 kg excess body weight as ballast advantage",
                               detail: "Crewed keelboat racing (Volvo Ocean Race, IMOCA 60s, TP52) confers a performance advantage on physically larger crew members, who provide additional ballast righting moment when hiking on deck. Strength demands for running rigging (trimming sheets, handling halyards) favour muscle mass and grip endurance. Grinding operations on large racing yachts impose cardiovascular demands of 60–75% VO₂max for 90-second grinding sequences, with peak HR of 85–95% HRmax. Teams often rotate grinders to prevent premature fatigue during extended manoeuvres such as sail changes and tacks in heavy weather."),
                        sciRow(stat: "Cognitive load: 60–80% of performance determined by tactical decisions",
                               detail: "Expert analysis across multiple sailing disciplines consistently attributes 60–80% of race outcome variance to tactical and strategic decision-making — wind shift reading, current analysis, fleet positioning, and rule application — rather than physical performance. Sailing is frequently described as 'chess on water.' Physical fitness enables cognitive bandwidth by reducing the attentional cost of physical effort: a fatigued sailor invests more neural resources in maintaining hiking position, leaving less capacity for tactical processing. This physiology-cognition interaction is a central rationale for sailing-specific fitness programmes."),
                        sciRow(stat: "Thermal regulation: cold water immersion risk",
                               detail: "Capsize recovery in cold water triggers the cold shock response — involuntary hyperventilation, cardiovascular strain, and rapid loss of swimming ability. Swimming failure occurs within minutes at water temperatures below 15°C due to peripheral neuromuscular impairment. Wetsuit thermodynamics govern survival time: a 3mm wetsuit extends safe immersion from <15 minutes to 45–90 minutes at 10°C. Hypothermia timelines are critically temperature-dependent: unconsciousness can occur in 30–90 minutes at 10°C water temperature without thermal protection. Cold water immersion safety drills are mandatory in offshore racing qualification requirements.")
                    ]
                )

                scienceCard(
                    title: "Tactical Intelligence & Decision Science",
                    icon: "brain.head.profile",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Wind shift advantage: 5° header = 2–3 boat length gain",
                               detail: "Velocity made good (VMG) calculations demonstrate that tacking on a 5° wind header — sailing away from the favoured side — yields a 2–3 boat length gain per tack in a fleet of similar boats. Recognising headers and lifts from pressure bands, wave patterns, and cloud formations is a core tactical skill. Layline discipline (approaching the mark without overstood or understood approach) directly determines final leg efficiency. In oscillating breeze, the frequency and amplitude of wind shifts determines optimal tacking angle — elite sailors internalise wind oscillation periods and phase relative to the course."),
                        sciRow(stat: "Start line: 0.2 s early = disqualification; timing to within 1 s",
                               detail: "The pre-start sequence involves significant physiological stress, with cortisol elevation and HR elevation consistent with high-stakes competitive preparation. Line bias analysis (determining which end of the start line is advantaged by wind angle) is calculated in the minutes before the gun. Reaction to the start signal must be calibrated to within ±1 second — 0.2 seconds early results in disqualification under racing rules. Transoms vs. bow-out start strategies involve different risk-reward profiles for different fleet positions and wind conditions. Elite starters develop precise internal timing from thousands of practice starts."),
                        sciRow(stat: "Mark rounding: 15–30% of race positions change at leeward mark",
                               detail: "Tactical concentration zones around marks account for 15–30% of all race position changes in Olympic-class fleet racing. The overlap rule (requiring boats to grant room to overlapping boats at the mark) and the zone (three boat lengths from the mark) create high-intensity decision windows. Physical demands of spinnaker hoists and drops during leeward mark roundings require coordination of multiple crew roles, with grip, core, and cardiovascular demands peaking during these brief manoeuvres. Mistakes in tactical positioning on the final approach are the primary source of position losses at mark roundings."),
                        sciRow(stat: "Pattern recognition: elite sailors process wind data 3× faster",
                               detail: "Expertise research in sailing demonstrates that elite sailors process wind pressure and direction data from surface observations approximately 3 times faster than novice sailors on equivalent recognition tests. This superiority emerges from years of deliberate on-water practice building perceptual-cognitive templates for local meteorological patterns, sea state signatures, and fleet dynamics. Simulator training and video analysis have been validated as effective supplements to on-water practice for developing pattern recognition in tactical scenarios — particularly valuable during winter training periods or for regattas in unfamiliar venues.")
                    ]
                )

                scienceCard(
                    title: "Training Science & Conditioning",
                    icon: "chart.bar.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Strength-to-weight: 1.5–2.0 W/kg hiking power ratio target",
                               detail: "Laser sailing performance research has established hiking ergometer power-to-weight ratio as the strongest single predictor of competitive results, with elite sailors targeting 1.5–2.0 W/kg sustained hiking power. Training periodisation for regatta season peaks strength development in early pre-season, transitions to hiking endurance specificity in late pre-season, and maintains hiking capacity with reduced volume during the competitive season. Deloading weeks prior to major regattas are scheduled to allow neuromuscular freshness without detraining of the specific quad endurance adaptations."),
                        sciRow(stat: "Flexibility: hip flexors and lumbar mobility critical for hiking comfort",
                               detail: "Prolonged hiking position imposes a sustained hip flexion load that progressively tightens the hip flexor complex (psoas major, iliacus, rectus femoris) over the course of a sailing season. Lower back injury — particularly lumbar facet irritation and disc loading — is the most common chronic injury in dinghy sailors and is strongly associated with hip flexor inflexibility and reduced lumbar mobility. Hip mobility exercises (90/90 stretching, dynamic leg swings, couch stretches) and yoga integration are standard in elite sailing conditioning programmes. Weekly hip mobility work reduces low back symptom incidence significantly across a racing season."),
                        sciRow(stat: "Olympic cycle: 180–220 days on-water per year for medal contenders",
                               detail: "Training volume analysis of Olympic sailing medal contenders consistently shows 180–220 on-water training days per year across a four-year Olympic cycle, supplemented by 3–5 land conditioning sessions per week. Regatta scheduling (World Championships, continental championships, Olympic qualifier events) structures the annual plan into preparation phases and competition phases. The on-water to land conditioning split is approximately 55:45 in the pre-season and 70:30 during the competitive season. Cross-training sports (cycling, rowing ergometer, swimming) maintain aerobic base during periods of limited water access."),
                        sciRow(stat: "Nutrition at sea: energy balance in offshore racing",
                               detail: "Caloric requirements during active offshore racing conditions reach 400–600 kcal per hour, driven by sustained physical effort, thermoregulatory demand in cold and wet conditions, and extended wakefulness during night watches. Freeze-dried food logistics govern energy provision on offshore passages — caloric density and preparation simplicity (hot water only) are primary selection criteria. Carbohydrate periodisation supports energy availability during high-intensity watch periods. Hydration in salt-spray environments is complicated by insensible fluid loss underestimation — sailors frequently arrive in port with significant dehydration despite believing they have drunk adequate fluid volume during the passage.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Sailing Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: now)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let sailing = workouts.filter { $0.workoutActivityType == .sailing }
        let sessions = sailing.count
        let totalHR = sailing.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = sailing.map { $0.duration / 60 }.reduce(0, +)
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
