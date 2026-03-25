import SwiftUI
import HealthKit

struct CricketScienceView: View {
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
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .cyan)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Fast Bowling Biomechanics",
                    icon: "figure.cricket",
                    color: .red,
                    rows: [
                        sciRow(stat: "Ball release speed: 140–150 km/h elite",
                               detail: "Portus 2004 (Cricket Australia biomechanics lab): elite fast bowlers achieve ball release velocities of 140–150 km/h. Shoulder internal rotation angular velocity at release: 6,500–7,500°/s — comparable to baseball pitching. Front-foot landing force: 7–9× body weight per delivery. Energy chain: run-up kinetic energy → hip-shoulder separation → shoulder internal rotation → elbow extension → wrist snap. Back-knee drive contributes 18–22% of total ball velocity."),
                        sciRow(stat: "Counter-rotation: injury mechanism",
                               detail: "Burnett 1996: 'mixed bowling action' (front-on vs side-on discordance) creates spinal counter-rotation of 40–50° between pelvis and shoulders at front-foot landing — primary mechanism for lumbar stress fractures (spondylolysis). Prevalence of lumbar stress fracture in fast bowlers: 20–40% (highest of any sport). Mixed action: 5–6× greater injury risk than pure side-on or front-on action."),
                        sciRow(stat: "Workload: 4–6 spells of 5–6 overs",
                               detail: "Duffield 2009: fast bowlers in Test cricket deliver 4–6 spells per day of 5–6 overs (30–36 balls), with active time between deliveries used for passive recovery. Total daily bowling load: 25–35 overs for front-line bowlers. Heart rate during bowling spell: 80–88% HRmax. Blood lactate post-spell: 4–6 mmol/L. ECB and Cricket Australia impose over-limit protocols to manage cumulative workload and lumbar stress fracture risk."),
                        sciRow(stat: "Shoulder: 30–35% of bowler injuries",
                               detail: "Orchard 2015 (ICC global cricket injury study): shoulder injuries account for 30–35% of fast bowler time-loss injuries. Glenohumeral internal rotation deficit (GIRD) averaging 20–25° in elite bowlers — protective adaptation but risk factor for SLAP tears. Prevention: posterior shoulder stretching (sleeper stretch), rotator cuff eccentric strengthening (ER at 90° abduction), and load monitoring.")
                    ]
                )

                scienceCard(
                    title: "Batting Biomechanics & Reaction Time",
                    icon: "sportscar.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "Reaction window: 200–300 ms for 90 mph delivery",
                               detail: "Land 2013: a 90 mph (145 km/h) delivery from 20 m reaches the bat in approximately 480 ms — but batsmen initiate movement 200–300 ms before ball release based on bowler cues (grip, run-up, arm position). Elite batsmen have pre-movement neural decision windows as low as 100 ms. This means batting against pace is almost entirely predictive, not reactive — batsmen forecast, they do not react."),
                        sciRow(stat: "Front-foot drive: 250–350 N·m hip torque",
                               detail: "Elliott 2005 (University of WA biomechanics): forward defensive and drive shots generate 250–350 N·m of lead hip internal rotation torque. Weight transfer from back to front foot: 85–95% of body weight at contact. Bat velocity at impact: 25–35 m/s for attacking shots. Head position stability (minimal lateral movement) is the strongest predictor of batting average in elite analysis — 'still head, still batting'."),
                        sciRow(stat: "Eye movement: fixation on release point",
                               detail: "Mann 2013 (quiet eye in cricket batting): skilled batsmen fixate the ball release point for 200–300 ms before ball delivery (the 'quiet eye' period), maintaining 'gaze anchoring' on the predicted ball flight path. Gaze anchoring increases batting success rate 15–25% vs. early or late fixation. Expert batsmen generate predictive eye movement (saccade ahead of ball trajectory) in as little as 150 ms of flight."),
                        sciRow(stat: "T20 vs Test adaptation",
                               detail: "James 2016: T20 batting demands higher risk tolerance and faster scoring rate (required run rate 7–15 per over) vs Test (2–5 per over). Physiological: T20 innings average 25–35 balls (vs. 100+ in Test); cognitive load of shot selection is compressed. Physical: fielders cover 150–250 m at sprint speeds per T20 innings. Wicket-keeping squat repetitions: 90–120 per T20 innings — significant lower-limb demand.")
                    ]
                )

                scienceCard(
                    title: "Fielding Physiology & Cricket Fitness",
                    icon: "figure.run",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Fielders: 7–12 km per day in Test cricket",
                               detail: "Petersen 2009 (GPS study, international Test cricket): fielders cover 7–12 km per day spread over 6+ hours of play. However, intensities are highly intermittent — 85% at low intensity with 15–25 high-intensity sprint bursts per day averaging 15–20 m. VO₂max requirements: <45 mL/kg/min for specialist batsmen; >55 mL/kg/min for fast bowlers and athletic fielders. Fatigue in fielding: diving, throwing, and sprint frequency decline 18–25% in the final session of a Test day."),
                        sciRow(stat: "Throwing velocity: 25–35 m/s from outfield",
                               detail: "Freeston 2010: elite cricket outfield throws achieve ball velocities of 25–35 m/s. Throwing mechanics share 80% kinematic similarity with baseball outfield throwing: stride, hip-shoulder separation, shoulder external rotation, arm acceleration. Elbow medial collateral ligament stress during cricket throw: comparable to baseball (UCL valgus torque 60–80 N·m). Direct throws vs. relay systems: cost-benefit in run-out probability × throwing injury risk."),
                        sciRow(stat: "Wicket-keeping: 90–120 squats per T20",
                               detail: "Christie 2008: wicket-keepers complete 90–120 squat positions per T20 innings, 200–280 per ODI, and up to 600+ per Test match day. Quadriceps EMG during wicket-keeping stance: 25–35% MVC sustained — equivalent to a prolonged isometric quad exercise. Knee flexion angle maintained: 90–120°. Prevention of 'keeper's knee' (infrapatellar tendinopathy): quad strengthening, patellofemoral taping, and graduated stance-time exposure protocols."),
                        sciRow(stat: "Concussion in cricket: helmet evolution",
                               detail: "Stretch 2014 + ICC data: cricket ball impact on unprotected skull at 80 mph generates 150–200 G head acceleration. Modern cricket helmets (AS/NZS standard, steel grill guards): reduce peak G by 55–65%. Concussion incidence in professional cricket: 1.4–2.0 per 1,000 player-days. Concussion subtype: 90% from batting (ball impact on helmet). ICC concussion substitute protocol (2019) allows 'like-for-like' replacement — first protocol in any bat-and-ball sport.")
                    ]
                )

                scienceCard(
                    title: "Mental Performance & Game Intelligence",
                    icon: "brain.head.profile",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Decision-making: 10,000+ hours of deliberate practice",
                               detail: "Abernethy 2012 (sport expertise research applied to cricket): expert batsmen acquire superior probabilistic prediction of delivery type from 10,000+ hours of deliberate batting practice. Crucially, perceptual skill — reading bowler kinematic cues — is more strongly correlated with batting performance than physical reaction time. Elite batsmen have average or below-average reaction times on laboratory tests but vastly superior anticipation from contextual cues."),
                        sciRow(stat: "Pressure performance: pre-shot routine",
                               detail: "Mesagno 2008: batsmen with established pre-ball 'trigger movements' (forward press, back-and-across step) show 15–22% less performance decline under tournament pressure than those without routines. Trigger movements reduce cortical over-activation (measured by EEG alpha/theta ratio) and narrow attentional focus to task-relevant cues. The pre-ball routine acts as a performance anchor — disrupting it correlates with over-thinking and technical breakdown under pressure."),
                        sciRow(stat: "Flow states: 4th-Test-session phenomenon",
                               detail: "Cricket folklore of 'getting in' represents documented neurophysiology: after 30–50 deliveries, batsmen report reduced decision burden, automatic shot execution, and enhanced time perception — hallmarks of 'flow' states. EEG studies in batting simulators show reduced prefrontal cortex activation and increased motor-cortex efficiency after sustained practice sessions. The 4th-session 'concentration lapses' in Test cricket (40–60% of wickets fall in sessions 3–4) reflect adenosine-mediated attentional fatigue accumulating over 3–6 hours."),
                        sciRow(stat: "Fast bowler psychology: aggression and arousal",
                               detail: "Bawden 2015 (ICC performance coaching data): elite fast bowlers operate optimally at arousal levels 6–8/10 — above optimal for finesse but ideal for aggression and intent. Pre-delivery arousal management (controlled breathing, purposeful walk-in) predicts bowling economy by more than physical fitness measures in IPL data analysis. Mental fatigue — accumulated across a Test — increases no-ball and wide incidence by 30–40% in the 5th day.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Cricket Science")
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
        let cricket = workouts.filter { $0.workoutActivityType == .cricket }
        let sessions = cricket.count
        let totalHR = cricket.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = cricket.map { $0.duration / 60 }.reduce(0, +)
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
