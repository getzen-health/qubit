import SwiftUI
import HealthKit

struct AustralianFootballScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .red)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .orange)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "The World's Most Demanding Team Sport",
                    icon: "soccerball.inverse",
                    color: .red,
                    rows: [
                        sciRow(stat: "Midfielders run 16–18 km per game",
                               detail: "Coutts 2010 (GPS analysis, AFL): midfielders cover 16–18 km per game with 72 direction changes (>45°) per km — highest multidirectional demand of any field sport. Defenders: 12–14 km; forwards: 10–13 km. Total game time: 100+ min of physical effort over 4 x 20-min quarters."),
                        sciRow(stat: "88–90% aerobic: highest aerobic proportion in team sport",
                               detail: "Gastin 2013: energy expenditure analysis shows AFL is 88–90% aerobic by total energy contribution — higher than soccer (90%), rugby (75–85%), basketball (80%). VO₂max elite AFL: 55–65 mL/kg/min. Pre-season testing: 2-km time trial < 6:30 or yo-yo IR2 level 18+ for senior list."),
                        sciRow(stat: "Sprint frequency: 60–80 high-speed efforts",
                               detail: "Johnston 2012: AFL players complete 60–80 high-speed running efforts (> 5.5 m/s) and 20–30 sprints (> 7 m/s) per game. Sprint duration: 2–4 s. Recovery between sprint efforts: 3–8 s at high intensity, creating extreme aerobic-anaerobic interplay. Central midfielders have highest sprint frequency."),
                        sciRow(stat: "Contested marking: 3.5 m vertical jump requirement",
                               detail: "Ball 2008: contested marking requires peak vertical jump 70–90 cm for senior AFL players. Hip extension and dorsiflexion velocity in gather predict mark success. Ruck contests: 300–400 N of force during aerial collision at peak. Marking success rate: elite contested mark % = 45–55%.")
                    ]
                )

                scienceCard(
                    title: "Kick Biomechanics & Ball Skills",
                    icon: "sportscourt.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Punt kick: hip rotation 570–620°/s",
                               detail: "Ball 2008: AFL punt kick hip internal rotation angular velocity 570–620°/s — among the fastest rotational movements in sport (similar to baseball pitching). Approach: 3–5 step run-up. Ball-foot contact: 5–8 ms. Ball velocity elite: 25–30 m/s (90–108 km/h). Accuracy within 30 m: 85%; 50 m: 62% under match pressure."),
                        sciRow(stat: "Drop punt mechanics: proximal-distal sequencing",
                               detail: "Peacock 2017: optimal drop punt uses proximal-to-distal sequencing — pelvis rotates first (50°), then hip flexion, knee extension, ankle plantarflexion. Each segment accelerates in sequence to maximize distal velocity. Shank angular velocity at foot contact: 900–1,200°/s for elite kicks."),
                        sciRow(stat: "Handball: 80–120 km/h effective tool",
                               detail: "Wheeler 2011: AFL handball velocity elite: 80–120 km/h (22–33 m/s). Dominant hand advantage: 15–25 km/h faster than non-dominant. Handball accuracy under pressure: declines 30–40% vs. uncontested. Hand-ball training: non-dominant hand development reduces total skill loss under fatigue."),
                        sciRow(stat: "Marking: vertical jump and timing",
                               detail: "Robertson 2019: marking performance predicted by: (1) vertical jump height, (2) timing accuracy (within ±50 ms of optimal), (3) body position for aerial contests. Contested marking: 40–60% of defensive pressure marks lost. High-marking training: jump timing + shoulder brace mechanics critical for injury prevention.")
                    ]
                )

                scienceCard(
                    title: "Injury Epidemiology & Prevention",
                    icon: "cross.case.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "Hamstring = most common: 7.4 injuries/club/season",
                               detail: "Orchard 2013 (25-year AFL injury registry): hamstring strain = most common injury (7.4 per club per season), causing 32–40 missed games per club per year. Risk factors: prior hamstring injury (3× increased risk), ≥30 years age, wet conditions, high pre-season sprint volume. Nordic hamstring curl reduces incidence 51% (Petersen 2011)."),
                        sciRow(stat: "ACL tears: 2–3 per season per club",
                               detail: "Walden 2011 adapted for AFL: ACL tears occur 2–3 per club per season. Return-to-play: 10–12 months. Re-injury rate: 20–25% in first season back. Prevention: FIFA 11+ adapted protocol reduces ACL incidence 30–50% in prospective trials. Landing mechanics training and hip abductor strengthening are key."),
                        sciRow(stat: "Concussion: 60–70 per season league-wide",
                               detail: "Makdissi 2016 (AFL concussion policy evolution): AFL reports 60–70 concussions per season league-wide (18 clubs × 22-player lists). Return to play: minimum 12 days after concussion symptoms resolve (AFL protocol since 2021). Sub-concussive exposure: estimated 200–500 impacts > 10 G per player per season."),
                        sciRow(stat: "Heat stress in summer training",
                               detail: "Aughey 2014: AFL pre-season training in 30–42°C heat (Australian summers). Core temp can exceed 39.5°C in summer sessions. Wet bulb globe temperature (WBGT) > 28°C = heat modification protocol (rest extensions, cooling vests). Sweat rate elite AFL: 1.5–2.5 L/hour in heat; fluid replacement critical.")
                    ]
                )

                scienceCard(
                    title: "Physical Development & Position Demands",
                    icon: "chart.bar.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Draft combine standards: key physical benchmarks",
                               detail: "Keogh 2013 (AFL Draft Combine): draft-rated players benchmark: 20 m sprint < 3.0 s, vertical jump > 75 cm, 2-km time trial < 6:15, agility 5-0-5 < 2.65 s. International Scholarship players (USAFL pipeline): raw athleticism evaluated against normative AFL percentile tables. Draft age: 17–25 years."),
                        sciRow(stat: "Ruck position: unique physical demands",
                               detail: "Russell 2016: AFL ruckmen cover 11–14 km/game with higher intensity aerial contest frequency. Physical profile: height 195–210 cm, mass 100–115 kg, vertical jump 65–80 cm. Unique energy system demands: repeated maximal aerobic jumps + ruck craft (leverage, timing, spoiling). Ruckmen most frequently trained position in gym."),
                        sciRow(stat: "Female AFL (AFLW): emerging physiology data",
                               detail: "Clarke 2020 (AFLW inaugural seasons): AFLW players cover 8–12 km/game; top-speed 7.5 m/s (vs. 9.5 m/s AFL men). VO₂max elite AFLW: 48–55 mL/kg/min. Injury patterns similar to AFL men with ACL and hamstring dominant. Growing research base — AFLW game physiology distinct from AFL; cannot simply apply male norms."),
                        sciRow(stat: "GPS monitoring: training load management",
                               detail: "Gabbett 2016 (athlete workload research largely from AFL context): acute:chronic workload ratio (ACWR) > 1.5 associated with 2–4× injury risk increase. AFL clubs use GPS vests in all training sessions. Key metrics: PlayerLoad, distance, high-speed running distance. 10% weekly volume increase rule → maximum safe load progression.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("AFL Science")
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
        let afl = workouts.filter { $0.workoutActivityType == .australianFootball }
        let sessions = afl.count
        let totalHR = afl.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = afl.map { $0.duration / 60 }.reduce(0, +)
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
