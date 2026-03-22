import SwiftUI
import HealthKit

struct LacrosseScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .purple)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .red)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .orange)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Running Profile & Physical Demands",
                    icon: "figure.run",
                    color: .purple,
                    rows: [
                        sciRow(stat: "GPS data: 7–10 km per match, all positions",
                               detail: "Vescovi 2011 (J Strength Cond Res): GPS tracking of elite NCAA women's lacrosse players showed total match distances of 7.1–9.8 km. Midfielders covered the greatest distance (avg 9.2 km), followed by attackers (7.8 km) and defenders (7.1 km). Goalkeepers covered only 2.4 km. Field coverage is non-uniform — players at all positions spend significant time (38–44%) at high metabolic load zones but with intermittent recovery bouts."),
                        sciRow(stat: "High-intensity running: 1,500–2,500 m per match",
                               detail: "Muir 2017: high-intensity running (>18 km/h) accounted for 1,500–2,500 m of total match distance in elite men's field lacrosse. Midfielders perform the greatest high-speed running volume due to end-to-end transition responsibilities. Sprint frequency averaged 35–55 maximal-effort sprints per match (>90% Vmax), predominantly lasting 2–4 s over 15–30 m distances. Repeated sprint ability (RSA) is the primary physical determinant of midfield performance."),
                        sciRow(stat: "VO₂max: 55–65 mL/kg/min required at elite level",
                               detail: "Hoffman 1992 and subsequent NSCA position data: elite male lacrosse players show VO₂max 57–65 mL/kg/min; elite women 52–60 mL/kg/min. These values approach field hockey and soccer benchmarks. HR during active play reaches 80–92% HRmax (157–183 bpm for a 25-year-old). Aerobic capacity underpins rapid lactate clearance between sprint efforts — midfielders with higher VO₂max maintain sprint quality 15–22% longer into the second half."),
                        sciRow(stat: "Positional sprint frequency: 35–55 sprints per match",
                               detail: "Scott 2019 (Int J Sports Physiol Perform): attack players performed 38 ± 8 maximal sprints per match; midfielders 52 ± 11; defenders 36 ± 7. Sprints were defined as efforts >95% individual maximum velocity. Work:rest ratios averaged 1:3 for attackers and 1:2.5 for midfielders — confirming the predominantly alactic-aerobic hybrid energy demand. Sprint peak velocities reached 28–31 km/h for elite male attackers during fast breaks.")
                    ]
                )

                scienceCard(
                    title: "Shooting Biomechanics & Stick Skills",
                    icon: "bolt.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "Overhand shot velocity: 120–145 km/h at elite level",
                               detail: "Knapp 2016 (Sports Biomech): radar-gun measurements of elite NCAA men's lacrosse players recorded overhand shot velocities of 120–145 km/h (74–90 mph). The overhand shot relies on a kinetic chain sequence: hip-shoulder separation (40–55° of separation at stride foot contact), core rotation (peak angular velocity 700–900°/s), and terminal wrist snap generating final 15–25% of ball velocity. Elite shooters achieve ball release within 0.18–0.22 s of loading position — critical against advanced goalies."),
                        sciRow(stat: "Cradling mechanics: centripetal force in the pocket",
                               detail: "Cradling biomechanics exploit centripetal acceleration to retain the ball in the mesh pocket without requiring a closed hand. At typical cradling speed (2–3 cycles/s), the ball experiences ~4–6 m/s² centripetal acceleration directed toward the pocket centre. Wrist supination-pronation and elbow flexion-extension co-activate at 60–80 cycles/min during evasive movement. Ball-retention failure increases when centripetal acceleration drops below the critical threshold (~3 m/s²), which occurs at very low cradling speeds or during stick-checking contact."),
                        sciRow(stat: "Cross-body vs overhand throwing mechanics",
                               detail: "Lapinski 2018: overhand throws produce significantly higher velocity (avg +18 km/h) and accuracy over 15–40 m ranges compared to cross-body or sidearm releases. However, cross-body mechanics offer faster release (<0.15 s) in tight traffic situations. Hip-shoulder separation contributes 28–35% of total throwing velocity in overhand mechanics; trunk rotation contributes 35–45%; arm mechanics (elbow extension + wrist roll) contribute 25–30%. Asymmetric development is common — dominant-side shoulder IR strength exceeds non-dominant by 15–25% in collegiate players."),
                        sciRow(stat: "Goalie reaction time: 7 m+ shooting distance",
                               detail: "From a 7 m shooting distance, an elite shot at 140 km/h reaches the goal in approximately 0.18 s. Average simple visual reaction time is 0.18–0.22 s, meaning goalies must begin movement initiation before ball release based on anticipatory cues (body kinematics, eyes, stick loading). Lacrosse goalies exhibit anticipatory saccades toward likely release zones 80–110 ms before stick contact — trained pattern recognition accounts for 60–70% of successful saves, raw reaction speed only 30–40%.")
                    ]
                )

                scienceCard(
                    title: "Collision Demands & Injury Science",
                    icon: "shield.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Concussion rates: 3–5 per 1,000 athlete-exposures",
                               detail: "Covassin 2012 (Am J Sports Med): concussion incidence in NCAA men's lacrosse was 3.1–4.9 per 1,000 athlete-exposures (AEs), placing it among the highest contact sports. Women's lacrosse — despite minimal checking rules — showed 2.5–3.6 per 1,000 AEs, attributed primarily to stick contact with the head and ball impacts. Helmet design improvements from 2016 NOCSAE standard (reduced peak linear acceleration by 18% in lab testing) correlate with a modest 8–12% concussion incidence reduction in field studies."),
                        sciRow(stat: "Body checking: field vs box lacrosse biomechanics",
                               detail: "Body checking is permitted in men's field lacrosse (contact within 5-yard rule) and extensively used in box lacrosse (indoor). Accelerometer data from men's NCAA field lacrosse: average body check produces 18–45 G head linear acceleration. Box lacrosse players execute 2–3× more body checks per minute due to smaller playing surface (60 × 27 m vs 100 × 55 m) and board-contact mechanics analogous to ice hockey. Shoulder injuries account for 14–18% of all lacrosse injuries — most from checking contact."),
                        sciRow(stat: "ACL injury: women's lacrosse disproportionate risk",
                               detail: "Joseph 2013 (Sports Health): ACL injury rate in women's lacrosse was 0.18 per 1,000 AEs — 2.6× higher than men's lacrosse (0.07/1,000 AEs). Risk factors include non-contact cutting and landing mechanics, knee valgus collapse during deceleration, and lower hamstring-to-quadriceps strength ratios in female athletes. Neuromuscular prevention programs (FIFA 11+, KLIPS) reduce ACL incidence 50–65% when implemented 3×/week pre-season. Turf vs grass surface did not significantly alter ACL rates in lacrosse-specific studies."),
                        sciRow(stat: "Return-to-play: graduated protocols post-concussion",
                               detail: "McCrory 2023 (Br J Sports Med, 6th Consensus): minimum 6-day graduated return-to-play (GRTP) for lacrosse as per all contact sports. Day 1: symptom-limited cognitive rest; Day 2: light aerobic (walking); Day 3: sport-specific movement; Day 4: non-contact drills; Day 5: full-contact practice; Day 6: return to competition. Vestibulo-ocular rehabilitation is increasingly included for lacrosse-specific concussions due to high visual-tracking and ball-pursuit demands — impaired smooth pursuit eye movement correlates with prolonged recovery (>14 days) in lacrosse athletes.")
                    ]
                )

                scienceCard(
                    title: "Box vs Field Lacrosse Science",
                    icon: "chart.bar.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Court dimensions: 60 × 27 m (box) vs 100 × 55 m (field)",
                               detail: "Box lacrosse (indoor) is played on a hockey-rink-sized surface with boards (60 × 27 m), while field lacrosse uses a 100 × 55 m natural or synthetic turf field. The 3.6× smaller box surface compresses time-space demands dramatically: average ball possession time drops from 8–12 s (field) to 3–5 s (box). Box teams must shoot within a 30-second shot clock (no shot clock in traditional field lacrosse), forcing faster transition and higher-pressure offensive decision-making."),
                        sciRow(stat: "Physiological intensity: box >90% HRmax sustained",
                               detail: "Petersen 2009 (NSCA position): box lacrosse players maintain >90% HRmax for 65–75% of playing time — comparable to ice hockey and far exceeding field lacrosse (~80–92% HRmax, 40–55% of time). Blood lactate peaks of 10–14 mmol/L in box lacrosse vs 6–9 mmol/L in field lacrosse confirm the predominantly anaerobic glycolytic energy demand in the indoor game. VO₂max requirements for elite box players: 60–68 mL/kg/min; field lacrosse: 55–65 mL/kg/min."),
                        sciRow(stat: "Scoring: box 10–20 goals/game vs field 8–15 goals/game",
                               detail: "Box lacrosse averages 10–20 combined goals per game (NLL data, 2019–2023) vs 8–15 in field lacrosse (NCAA D1 data, 2018–2023). The higher scoring rate in box reflects smaller goalie areas, closer shooting distances (avg 8–10 m vs 12–18 m), and constant fast-break opportunities from the compact surface. Box goalies face 35–55 shots per game vs field goalies 18–30. Shot-save percentage is consequently lower in box (~68% vs ~78% field), and goalie positional training fundamentally differs."),
                        sciRow(stat: "Positional specialisation: transition speed requirements",
                               detail: "Field lacrosse has strict positional boundaries — 3 attackers, 3 midfielders, 3 defenders must alternate across midfield, creating clear role specialisation. Box lacrosse uses a 5-player rotation with no positional restrictions and continuous line changes (similar to hockey), demanding that all players possess both offensive and defensive competencies. Transition speed requirements differ: field lacrosse fastbreaks span 60–80 m and require sustained sprint endurance; box transitions span only 20–30 m but require maximum acceleration and board-contact physicality within 3–5 s of turnover.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Lacrosse Science")
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
        let lacrosse = workouts.filter { $0.workoutActivityType == .lacrosse }
        let sessions = lacrosse.count
        let totalHR = lacrosse.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = lacrosse.map { $0.duration / 60 }.reduce(0, +)
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
