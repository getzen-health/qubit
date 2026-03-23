import SwiftUI
import HealthKit

struct AmericanFootballScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .brown)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .red)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .orange)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Positional Demands & Physical Profiles",
                    icon: "football.fill",
                    color: .brown,
                    rows: [
                        sciRow(stat: "NFL Combine data: position-specific profiles",
                               detail: "Brechue 2010 (NFL Combine analysis): linemen avg 143 kg, 40-yard dash 5.2 s; skill positions (WR/CB) avg 90 kg, 4.4 s. Strength variation: offensive linemen bench press 225 lbs avg 35 reps; DB avg 16 reps. Power, speed, and body composition requirements diverge entirely by position."),
                        sciRow(stat: "Game distance: 1.5–2.5 km per skill position",
                               detail: "Wellman 2016: GPS tracking NFL games — WR/CB cover 1.5–2.5 km per game (46% walking, 31% jogging, 18% running, 5% sprinting). Linemen: 800–1,200 m at much lower velocities but maximal collision force. Aerobic fitness predicts recovery speed between plays (40 s average play clock)."),
                        sciRow(stat: "Sprint frequency: 12–25 sprints per game",
                               detail: "Duthie 2003 extrapolated to football: skill position players average 12–25 efforts > 5.5 m/s (sprint threshold) per game. Each sprint: 5–15 m (routes) or 20–80 m (breakaway). Acceleration from 0 to max speed in 4–5 steps. Power at first step: 800–1,200 W for elite WR."),
                        sciRow(stat: "Collision force: 50–150 G per tackle",
                               detail: "Broglio 2010 (accelerometer helmets): head impact 50–150 G per tackle; linemen receive 1,000+ sub-concussive impacts per season. Impact direction matters: rotational acceleration more injurious than linear. Neck strength reduces head angular acceleration 20–33% per 1 kg muscle mass increase (Mihalik 2011).")
                    ]
                )

                scienceCard(
                    title: "CTE, Concussion & Brain Science",
                    icon: "brain.head.profile",
                    color: .red,
                    rows: [
                        sciRow(stat: "CTE in 110 of 111 donated NFL brains",
                               detail: "McKee 2023 (Boston University CTE Center): 110/111 (99%) of donated post-mortem NFL player brains showed CTE pathology. Tau protein tangles in hippocampus and frontal cortex. Caveat: selection bias — symptomatic players more likely to donate. Estimated true prevalence: 30–50% of NFL career players based on modeling."),
                        sciRow(stat: "Sub-concussive hits: cumulative damage",
                               detail: "Bazarian 2014: sub-concussive impacts (below symptom threshold) accumulate brain white matter damage over a season — DTI MRI shows axonal injury without clinical concussion diagnosis. 1,000+ sub-concussive hits per lineman per season × 10-year career = significant cumulative exposure."),
                        sciRow(stat: "Concussion protocol: graduated return-to-play",
                               detail: "McCrory 2023 (International Consensus): concussion SCAT5 assessment → 7-step return-to-play protocol → minimum 6 days before return. NFL protocol: independent neurological consultant (INC) on sideline since 2011. Player reporting culture: 2016 NFLPA survey — 53% of players said teammates hide concussion symptoms."),
                        sciRow(stat: "Prevention: equipment and rule changes",
                               detail: "Mihalik 2011: neck strength training reduced angular head acceleration 20–33%. Guardian Cap soft helmet shell: reduces linear G-force 11% in practice. Kickoff rule changes (2023): reduced concussions per kickoff 60% vs. previous format. Targeting rule: penalty + ejection reduced helmet-to-helmet impacts 22% (2013–2021).")
                    ]
                )

                scienceCard(
                    title: "Strength, Power & Performance Science",
                    icon: "dumbbell.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Rate of force development: sprint & explosion",
                               detail: "Cormie 2010: rate of force development (RFD) in <250 ms predicts short sprint performance better than peak force. Olympic lifting (power clean, hang clean) trains RFD more effectively than traditional squat alone. NFL combine 10-yard dash best predicted by hang power clean 1RM/BW and vertical jump (r=0.78)."),
                        sciRow(stat: "Strength-to-weight optimization by position",
                               detail: "Sierer 2008: NFL offensive lineman optimal: squat > 225 kg (500 lbs), bench > 136 kg (300 lbs), body fat 23–28%. Skill positions: squat > 180 kg, vertical jump > 85 cm (33 in), body fat < 10%. Weight gain by linemen (avg NFL OL: 143 kg in 2023 vs. 114 kg in 1980) driven by strength demands and cap incentives."),
                        sciRow(stat: "Training camp physiology: 2-a-days",
                               detail: "Stacy 2009: training camp (2-a-days, Aug): players lose 2–4 kg in first week (fluid + glycogen). Core temp reaches 38.5–40°C during afternoon sessions in heat. NFLPA eliminated 2-a-days after 2011 CBA — maximum 1 padded practice/day. Heat illness risk peaks: first 3 days of extreme heat exposure."),
                        sciRow(stat: "Recovery: pre-season to week 17",
                               detail: "Meir 2001 (rugby, applicable to football): contact sport athletes show cumulative fatigue — sprint speed declines 3–5% by Week 10 of season. Performance restoration: 72h post-game recovery priority for skill positions; 96h for linemen post-high-collision game. Cold water immersion, sleep 9+ hours/night, protein 2.2 g/kg/day optimize recovery.")
                    ]
                )

                scienceCard(
                    title: "Aerobic Fitness & Energy Systems",
                    icon: "heart.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "VO₂max by position: 45–60 mL/kg/min",
                               detail: "Davis 2004: NFL linebacker/safety VO₂max 50–58 mL/kg/min; linemen 40–48 mL/kg/min; WR/CB 52–60 mL/kg/min. Aerobic fitness predicts play-to-play recovery speed: 40-second play clock barely allows PCr resynthesis between plays. Higher VO₂max → faster between-play PCr recovery → maintained explosiveness in 4th quarter."),
                        sciRow(stat: "Play duration: 5–8 s average per play",
                               detail: "Rhea 2008: NFL play duration avg 5.8 s, range 2–12 s. Energy: PCr-dominant (creatine phosphate system provides 85–95% of energy for <10 s efforts). Blood lactate: 4–8 mmol/L after a series of plays — moderate glycolytic contribution. Conditioning goal: repeat-sprint ability, not sustained aerobic effort."),
                        sciRow(stat: "4th-quarter performance decline",
                               detail: "Wells 2009: performance analysis shows yards-per-carry declines 8–12% in 4th quarter vs. 1st quarter for RBs. WR drop rate increases 15–25% in 4th quarter. Fatigue mechanism: accumulated glycogen depletion + electrolyte imbalance + heat stress (indoor stadiums 25–30°C). Fitness and nutrition periodization target 4th-quarter performance maintenance."),
                        sciRow(stat: "Off-season conditioning: NFL combine prep",
                               detail: "McGill 2016: 12-week NFL combine prep program (athletes with combine invitations) focuses on: position-specific 40-yard dash (weeks 1–6 mechanics, weeks 7–12 speed), vertical jump plyometrics (depth jumps, reactive training), bench press endurance (225 lbs program), pro agility shuttle. VO₂max testing not part of combine — but predicts 4th-quarter performance.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("American Football Science")
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
        let football = workouts.filter { $0.workoutActivityType == .americanFootball }
        let sessions = football.count
        let totalHR = football.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = football.map { $0.duration / 60 }.reduce(0, +)
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
