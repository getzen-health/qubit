import SwiftUI
import HealthKit

struct WaterPoloScienceView: View {
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
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .cyan)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .teal)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Swimming Demands & Physical Profile",
                    icon: "figure.water.fitness",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Elite players swim 1.5–3.0 km per match",
                               detail: "Smith 2004 (motion analysis, elite water polo): players cover 1.5–3.0 km per match depending on position, with field players averaging 2.0–2.5 km and goalkeepers performing 50–80 explosive lateral movements per match instead of distance swimming. Attackers accumulate greater sprint volumes; defenders more sustained moderate-intensity swimming. Positional demands create distinct physiological profiles: centre-backs highest anaerobic load, wingers highest aerobic demand, hole set (2m player) highest strength-contact demand per unit distance."),
                        sciRow(stat: "Eggbeater kick: 40–60% of match time",
                               detail: "Sanders 1999 (eggbeater biomechanics): the eggbeater kick occupies 40–60% of total match time in elite water polo. The kick requires alternating hip abduction/adduction cycles (60–90 cycles/min at full intensity), generating vertical propulsion to elevate the body 10–25 cm above the water surface for throwing actions. Energy cost of eggbeater treading water: approximately 60–80% of VO₂max — significantly higher than freestyle swimming at the same heart rate. Hip abductor and adductor strength are key determinants of vertical elevation and sustained performance across four quarters."),
                        sciRow(stat: "VO₂max: 58–68 mL/kg/min for elite players",
                               detail: "Platanou 2005: elite water polo players demonstrate VO₂max of 58–68 mL/kg/min, with heart rate reaching 85–95% HRmax during sprint phases. The sport's aerobic-anaerobic mix — continuous swimming base punctuated by 2–5 second explosive sprints — demands both high aerobic capacity and rapid PCr replenishment. Blood lactate during competition: 6–10 mmol/L across four 8-minute quarters. Quarter-by-quarter intensity increases as fatigue accumulates: fourth quarter shows highest sprint frequency and lactate production."),
                        sciRow(stat: "Body composition: 10–14% body fat optimal",
                               detail: "Konstantaki 1998: optimal body fat for elite water polo players is 10–14%, balancing buoyancy advantage (higher fat aids flotation, reducing eggbeater energy cost) with lean mass requirements for upper body throwing power and sprint velocity. Higher lean muscle mass improves sprint propulsion and throwing velocity but increases body density, raising eggbeater energy cost. Elite players typically carry 5–8 kg more upper body lean mass than competitive swimmers, reflecting the sport's throwing and contact demands. Body composition assessment underwater weighing vs. DXA: strong correlation (r=0.94).")
                    ]
                )

                scienceCard(
                    title: "Throwing Biomechanics & Shooting",
                    icon: "bolt.fill",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Throwing velocity: 60–80 km/h from water",
                               detail: "Van den Tillaar 2014: water polo throwing from water achieves 60–80 km/h — 12–18% lower than equivalent land-based throwing due to absence of ground reaction force and stable base of support. The kinetic chain begins with eggbeater-generated vertical elevation, followed by trunk rotation (hip-to-shoulder sequencing contributing ~55% of total ball velocity), shoulder internal rotation (2,800–3,800°/s), elbow extension, and wrist snap. Dominant-side shoulder internal rotation contributes ~30% of total velocity. The unstable aquatic base increases reliance on core rotational power and shoulder strength compared to land throwing sports."),
                        sciRow(stat: "Jump throw: 10–25 cm above water surface",
                               detail: "Platanou 2009 (aerial throwing mechanics): the jump throw (standard water polo shot) elevates the player 10–25 cm above water via explosive eggbeater transition. The eggbeater-to-jump transition takes 0.3–0.6 s: athlete accelerates kick frequency, shifts weight back, then drives upward. During the aerial phase (0.4–0.7 s), the shooting arm loads into external rotation while the opposite arm stabilises. Without a stable ground base, trunk angular momentum must be generated entirely from the aquatic propulsion phase. Elite players achieve jump-throw velocities within 8% of their standing land throws — indicating high technical adaptation to aquatic mechanics."),
                        sciRow(stat: "Shooting accuracy: 35–55% conversion rates",
                               detail: "Lupo 2012 (World Championships shooting analysis): overall shot conversion rates range 35–55% depending on shooting zone, body position, and defensive pressure. Upper corner placement: 48–55% conversion (highest scoring zone, hardest for goalkeeper to reach). Lower corner: 30–38%. Cross-cage power shots: 40–48%. Shooting from penalty mark (5m): 72–82% — reflecting reduced reaction time for goalkeeper. Video analysis of 2012 World Championships: 62% of successful goals scored from within 4m of goal; long-range shots (>6m) convert at 18–25% and are used primarily as tactical deception."),
                        sciRow(stat: "Shoulder injury: 40–60% of elite water polo injuries",
                               detail: "Mountjoy 2010 (FINA injury surveillance): shoulder injuries account for 40–60% of all elite water polo injuries, the highest proportion of any water sport. Overhead throwing volume in elite training: 200–400 throws per session (including warm-up, tactical drills, and competitive play). Glenohumeral internal rotation deficit (GIRD) of 15–22° in dominant arm is prevalent in 65–75% of elite players. Rotator cuff impingement and labral pathology most common diagnoses. Prevention protocol: pre-season shoulder ER/IR ratio testing (target >0.75), posterior capsule stretching, and progressive throwing load monitoring limits injury incidence 30–40%.")
                    ]
                )

                scienceCard(
                    title: "Tactical & Positional Science",
                    icon: "chart.bar.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Power play (6v5): 35–45% conversion rate",
                               detail: "Argudo 2007 (FINA analysis): man-up power plays (6v5) convert at 35–45% in elite competition — significantly higher than even-strength attacks (22–30%). The goalkeeper faces an extra attacker and must cover additional shooting lanes, reducing save probability by 18–25%. Offensive strategy during 6v5: rapid ball rotation (4–6 passes in 10–15 s) to create shooting angles; cross-cage passing speed 8–12 m/s forces goalkeeper lateral movement. Teams use designated power play units trained in specific 6v5 spatial patterns. Defensive 5v6: goalkeepers instructed to cheat toward the cross-cage player — the highest-probability scoring location in 6v5."),
                        sciRow(stat: "Goalkeeper: 50–80 saves attempted per match",
                               detail: "Platanou 2004: elite water polo goalkeepers face 50–80 shot attempts per match, saving 45–65%. Reaction time to penalty shots from 5m: ball-in-flight time approximately 220–300 ms at 60–70 km/h — at or beyond simple reaction time limits (180–200 ms). Goalkeepers must anticipate shooter direction from pre-release cues: arm angle, body lean, and eye direction. Lateral reach from post-to-post (3m goal width): elite goalkeepers achieve full-extension save reach of 2.0–2.6 m per side. Save technique: butterfly block for low shots (legs spread, arms out), vertical jump for upper corner saves (vertical jump height 40–55 cm from water)."),
                        sciRow(stat: "Sprint durations: 2–5 s at 95–100% effort",
                               detail: "Polo 2011 (time-motion analysis): water polo match play includes 18–28 sprints per player per match, each lasting 2–5 seconds at 95–100% maximal swimming effort. Sprint-to-recovery ratios: approximately 1:6 to 1:10 (sprint 3 s, recovery 18–30 s via moderate swimming or eggbeater). Alactic anaerobic (PCr) system dominates sprint efforts; glycolytic contribution increases when sprint frequency rises in the fourth quarter. PCr recovery in water is slightly slower than land due to sustained partial-intensity effort during 'recovery' intervals — full PCr restoration requires 5–8 minutes of low-intensity movement."),
                        sciRow(stat: "Hole set (2m player): highest physical contact position",
                               detail: "Lupo 2014: the hole set (2-metre player, equivalent to a post player in basketball) experiences the highest physical contact forces in water polo. Upper body contact forces during defensive holds are estimated at 80–150 N continuous resistance force while the player works to maintain position. Foul rate at the 2m position: 3–6 exclusion fouls drawn per match vs. 0.8–1.5 for perimeter players. Strength requirements: hole set players have the highest bench press (120–140 kg 1RM) and lat pulldown strength of any position, enabling them to hold position against defensive pressure. Defensive holding techniques (pressing, submerging) are technically illegal but pervasive, requiring the 2m player to have exceptional core stability and positional strength.")
                    ]
                )

                scienceCard(
                    title: "Energy Systems & Conditioning",
                    icon: "heart.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Blood lactate: 6–10 mmol/L during match play",
                               detail: "Platanou 2005: blood lactate during elite water polo competition averages 6–10 mmol/L across all quarters, confirming substantial glycolytic contribution layered on a high aerobic base. Quarter-by-quarter intensity escalates: first quarter 5.8 mmol/L average, fourth quarter 9.2 mmol/L — reflecting progressive glycogen depletion and reduced lactate clearance capacity. Mixed aerobic-anaerobic demands mean both mitochondrial density (aerobic base) and glycolytic enzyme activity (sprint capacity) are critical training targets. Zone 2 (65–75% HRmax) swimming: 40–50% of total training volume at elite level, providing mitochondrial and lactate clearance adaptations for sustained competition performance."),
                        sciRow(stat: "Dehydration: players lose 1–2 L/hour despite being in water",
                               detail: "Maughan 2010 (aquatic sport fluid loss): water polo players lose 1.0–2.0 litres of sweat per hour during competition, despite full aqueous immersion. Sweat rate is driven by core temperature — vigorous swimming raises core temperature 1.5–2.5°C over a match — and is unrelated to the aquatic environment (skin does not rehydrate during swimming). Players cannot drink during play except at quarter breaks (4 × 8-minute quarters). At 2% body mass dehydration, cognitive performance (decision-making accuracy, reaction time) decreases 5–8%. Pre-match hyperhydration (500 mL 2 hours before) and electrolyte replacement at breaks is standard elite practice. Tournament dehydration: 2–3 matches per day at major competitions compounds fluid loss."),
                        sciRow(stat: "Strength training: upper body pull movements dominate",
                               detail: "Stirn 2011: water polo strength and conditioning programmes emphasise upper body pull movements — lat pulldown, pull-up (target: 15–20 BW reps for elite players), seated cable row — reflecting the dominant role of shoulder adductors and lat muscles in both swimming propulsion and eggbeater support. Throwing-specific resistance work: medicine ball rotational throws (3–5 kg, 3×15), cable shoulder IR at simulated throwing angles. Shoulder ER strengthening: prone dumbbell ER, side-lying ER (target ER/IR ratio >0.75 for injury prevention). Lower body: eggbeater-specific hip abductor/adductor strengthening (cable machine, resistance band work), squat and power clean for jump throw height. Periodisation: 3–4 strength sessions/week in pre-season; 2 sessions/week in-season maintenance."),
                        sciRow(stat: "Recovery: 12–24 hours minimum between matches",
                               detail: "Mountjoy 2010 (FINA tournament physiology): elite water polo tournaments schedule 2–3 matches per day at World Championships and Olympics — compressing recovery windows to 2–4 hours between games in preliminary rounds. Fatigue accumulation: shoulder throwing velocity declines 8–15% from first to third match in a day; sprint velocity declines 6–10%. Acute recovery strategies: cold water immersion (14–16°C, 10–12 min post-match) reduces shoulder inflammation markers 20–30%; compression garments worn between matches. 12–24 hours is the evidence-based minimum for full metabolic recovery between high-intensity matches. Teams at World Championships typically field different starting lines for successive same-day matches to manage cumulative shoulder fatigue.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Water Polo Science")
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
        let waterPolo = workouts.filter { $0.workoutActivityType == .waterPolo }
        let sessions = waterPolo.count
        let totalHR = waterPolo.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = waterPolo.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = sessions
            avgHR = sessions > 0 ? totalHR / Double(sessions) : 0
            avgDurationMin = sessions > 0 ? totalDur / Double(sessions) : 0
            isLoading = false
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(.title2, design: .rounded, weight: .bold)).foregroundColor(color)
            Text(label).font(.caption2).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 10)
        .background(Color(.secondarySystemBackground)).cornerRadius(10)
    }

    private func scienceCard(title: String, icon: String, color: Color, rows: [AnyView]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon).font(.headline).foregroundColor(color)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in row }
        }
        .padding().background(Color(.secondarySystemBackground)).cornerRadius(14).padding(.horizontal)
    }

    private func sciRow(stat: String, detail: String) -> AnyView {
        AnyView(VStack(alignment: .leading, spacing: 3) {
            Text(stat).font(.subheadline).fontWeight(.semibold)
            Text(detail).font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
