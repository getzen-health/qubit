import SwiftUI
import HealthKit

struct HandballScienceView: View {
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
                    title: "Physical Demands & Running Profile",
                    icon: "figure.handball",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Elite players: 5–8 km per match",
                               detail: "Povoas 2012 (GPS, Champions League handball): elite handball players cover 5–8 km per match with 150–200 intense movement changes. High-intensity running >17 km/h: 1,200–1,800 m per match for backcourt players. Goalkeeper: minimal running but 30–50 high-intensity lateral shuffles and jump-dives per match. Positional demands: wings most aerobically demanding (highest sprint frequency); pivots most physically demanding from contact events; backcourt players highest absolute sprint distances."),
                        sciRow(stat: "Match intensity: 85–92% HRmax sustained",
                               detail: "Chelly 2011: heart rate during elite handball matches sustained at 85–92% HRmax, with blood lactate 5–9 mmol/L. VO₂max requirements: backcourt players 55–62 mL/kg/min; wings 58–65 mL/kg/min; goalkeepers 48–55 mL/kg/min. Time-motion profile: 65% aerobic base activities, 35% high-intensity actions. The 60-minute match (two 30-minute halves) with 18 players per side (7 + GK, 6 subs) creates continuous high-load demand for first-line players."),
                        sciRow(stat: "Sprint distances: 25–40 high-intensity efforts per match",
                               detail: "Michalsik 2013: elite handball players complete 25–40 high-intensity efforts per match. Sprint duration: 2–5 s. Acceleration-deceleration patterns: 8–12 maximal acceleration efforts per half. Physical fitness test battery: 30 m sprint <4.0 s, countermovement jump >38 cm, 5-minute run >1,400 m for national team standard. Attacking vs. defensive intensity: slightly higher HR (2–3%) during attacking phases due to higher sprint and cognitive load vs. defensive positioning."),
                        sciRow(stat: "Shoulder: 40–55% of handball injuries",
                               detail: "Edouard 2015 (EHF injury study): shoulder injuries account for 40–55% of all handball injuries — highest shoulder injury rate of any team sport. Repeated overhead throwing (40–80 throws/training session at elite level) creates glenohumeral internal rotation deficit (GIRD) averaging 18–24° in dominant arm. Rotator cuff tendinopathy: 22–30% of elite players report significant shoulder pain during season. Prevention: pre-season and in-season strengthening of ER/IR ratio (targeting >0.75), posterior capsule stretching.")
                    ]
                )

                scienceCard(
                    title: "Throwing Biomechanics & Ball Speed",
                    icon: "bolt.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "Jump shot: 85–110 km/h ball release speed",
                               detail: "Van den Tillaar 2004: elite male handball players achieve ball release velocities of 85–110 km/h (24–31 m/s) for jump shots. The kinetic chain: run-up → jump phase (peak at 50–60 cm height) → shoulder external rotation (loading phase) → shoulder internal rotation → elbow extension → wrist snap. Hip-to-shoulder velocity sequencing contributes 60–65% of total ball speed. Elite female players: 75–90 km/h. Jump shot (vs. standing throw) adds 5–8 km/h through aerial stabilisation and reduced ground reaction force at release."),
                        sciRow(stat: "Shoulder internal rotation velocity: 3,500–4,800°/s",
                               detail: "Wagner 2010 (3D biomechanics): handball throwing generates shoulder internal rotation angular velocity of 3,500–4,800°/s — comparable to baseball pitching, with elbow valgus torque reaching 55–70 N·m. Wrist flexion velocity at release: 600–900°/s. Ball grip: the size-3 handball (58–60 cm circumference) allows full hand grip, enabling wrist flexion contribution — differentiated from baseball (fingertip control). Rosin use: legal in handball, increases grip friction 15–25% enabling shorter contact time and higher accelerations."),
                        sciRow(stat: "Penalty shot accuracy: 75–85% conversion at elite level",
                               detail: "Rivilla-Garcia 2011: elite handball penalty shots (7m, direct on goalkeeper) convert at 75–85%. Goalkeeper save rate: 12–25%. Shot placement analysis: upper corners 65% lower conversion rate but higher total frequency (paradox of elite scouting). Deception strategies: run-up direction change in final 2 steps reduces goalkeeper anticipation by 120–150 ms. Body feinting: 35% of elite penalty attempts include a body feint, increasing conversion rate 8–12% vs. direct approach."),
                        sciRow(stat: "Warm-up throwing loads: progressive 100-throw protocol",
                               detail: "Achenbach 2017: structured pre-training warm-up throwing protocol (progressive: 30 throws at 50%, 30 at 70%, 20 at 85%, 20 at full intensity) reduces in-session shoulder injury risk 35% vs. immediate full-intensity throwing. Season-long throwing workload monitoring: >300 high-intensity throws/week correlates with 3× increased rotator cuff injury risk. Modern elite programs limit jump shot volume to 150–200/session with mandatory recovery days between high-volume sessions.")
                    ]
                )

                scienceCard(
                    title: "Goalkeeper Science",
                    icon: "shield.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "Reaction time: 150–250 ms to first movement",
                               detail: "Schorer 2007 (handball goalkeeper anticipation): ball-in-flight time from 7m: 350–400 ms at competition speed. Goalkeeper first movement initiation: 150–250 ms — meaning goalkeepers cannot react to the ball alone and must anticipate from pre-release cues. Experts read 5–8 kinematic cues (arm angle, body lean, run-up angle, shooting shoulder position) collectively, not individually. Novice goalkeepers rely on ball tracking post-release — providing 50–100 ms less effective reaction time than expert anticipators."),
                        sciRow(stat: "Save types: 35% upper body, 65% leg/foot",
                               detail: "Hatzimanouil 2017 (EHF Championships analysis): handball saves by technique: upper body (hand/forearm blocks): 35%; leg and foot saves: 40%; diving saves: 25%. Diving save lateral reach: 2.2–2.8 m (total goalkeeper reach across goal); 3m goal width means 15–40 cm of each goal post sector is physically unreachable at full extension. Save success rate by body region: corner shots 22–28% save rate; central body-height shots 45–55% (higher dwell time enables reaction)."),
                        sciRow(stat: "Jump training: goalkeepers 150–200 jumps/session",
                               detail: "Santos 2019: handball goalkeeper training includes 150–200 explosive jump actions per session (lateral jumps, diving recoveries, vertical blocks). Vertical jump: elite goalkeepers average 42–52 cm CMJ — comparable to backcourt players. Lateral movement speed: fastest side-shuffle from post to post (3m): <0.8 s for elite. Goalkeeper-specific plyometric programme (lateral hurdle jumps, reactive medicine ball throws, dive-and-recover sequences) improves save rate 8–12% over 8-week intervention."),
                        sciRow(stat: "Gaze behaviour: 3 fixation points vs. single focus",
                               detail: "Savelsbergh 2005: expert handball goalkeepers distribute visual attention across 3 simultaneous fixation areas — shooter's shoulder, hip, and ball — vs. novice goalkeepers who use single sequential fixation (shoulder → ball). Multi-fixation strategy provides 80–100 ms earlier movement initiation. Visual training interventions using video simulation (goalkeeper specifically trained on reading kinematics) improve save rate 10–18% vs. physical training alone. Goalkeeper coaching: point-of-contact simulation video drills 3× weekly is evidence-based.")
                    ]
                )

                scienceCard(
                    title: "Training Periodisation & Team Tactics",
                    icon: "chart.bar.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Elite training: 5–6 sessions, 90–120 min per week",
                               detail: "Michalsik 2015: professional handball clubs average 5–6 training sessions per week of 90–120 min each, plus 1–2 competitive matches. Season structure: 25–35 matches over 9-month season. In-season training load: 3–4 technical/tactical sessions + 1–2 physical conditioning sessions. Weekly PlayerLoad targets: mid-season 60–75% of pre-season peak; maintenance approach rather than continued development. Player GPS thresholds: wingers 5,500 m high-intensity/week; backcourt 4,800 m; goalkeepers 1,200 m."),
                        sciRow(stat: "Fast break: 3-second window after turnover",
                               detail: "Taborsky 2011 (IHF technical analysis): handball fast breaks develop within 3 seconds of ball possession change. Successful fast breaks convert at 78–85% vs. organised defence conversion of 38–45%. Transition speed: ball moved from defensive half to shooting position in <4 passes (ideal: 2–3 passes). Physical prerequisites for fast break success: first-step acceleration, communication, and lane-running patterns trained as set tactical sequences (not improvised). 28% of elite level goals scored in transition — making transition conditioning the highest-ROI tactical investment."),
                        sciRow(stat: "7v6 attacking: +18% scoring probability",
                               detail: "Foretić 2013: pulling the goalkeeper for a 7th field player increases offensive scoring probability by 18% per possession in man-advantage situations. Risk: immediate counter-attack if ball lost (6v0 → 6v6 in <3 s if defending team retrieves quickly). Modern tactical trend: 7v6 used 15–25% of attacking possessions in top European leagues (Bundesliga, SEHA), compared to <5% in 2010. Physical demand: goalkeeper replacement player (typically a powerful backcourt player) must sprint 40m from bench area to court position in <8 s."),
                        sciRow(stat: "Creatine supplementation: +4–8% throwing velocity",
                               detail: "Gorostiaga 1999: 4-week creatine monohydrate supplementation (20g/day loading × 5 days, then 5g/day) increased handball throwing velocity 4–8% and repeated sprint performance in a placebo-controlled trial. Creatine's PCr-restoring role is particularly relevant in handball where 25–40 sub-maximal and maximal throws per match demand repeated explosive shoulder output. Combined with resistance training: strength gains 12–15% greater than training alone over 12-week periods. Considered the highest-evidence single ergogenic supplement for handball performance.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Handball Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
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
        let handball = workouts.filter { $0.workoutActivityType == .handball }
        let sessions = handball.count
        let totalHR = handball.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = handball.map { $0.duration / 60 }.reduce(0, +)
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
