import SwiftUI
import HealthKit

struct BoxingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Stats Row
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .red)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .orange)
                    statCard(value: String(format: "%.1f", avgKcalPerMin), label: "kcal/min", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Punch Biomechanics & Force Generation",
                    icon: "figure.boxing",
                    color: .red,
                    rows: [
                        sciRow(stat: "Elite punch force: 2.4–4.8 kN",
                               detail: "Turner 2011: elite heavyweights generate 4,800 N (4.8 kN) straight punches; hook/uppercut 2,400–3,600 N. Kinetic chain from floor-ground reaction through hip rotation to fist. Compare: amateur boxers 1,200–2,400 N."),
                        sciRow(stat: "Cross-jab-hook-uppercut energy cascade",
                               detail: "Lenetsky 2013: cross punch transfers 75–82% of total body KE to fist. Hip and trunk rotation contribute 30–40% of punch power (Filimonov 1985). Core strength × rotation velocity = punch power ceiling."),
                        sciRow(stat: "Glove mass & brain acceleration",
                               detail: "Viano 2005: 8 oz vs 16 oz gloves — heavier gloves reduce peak acceleration 25–35% but increase impulse. Punch acceleration to head: 80–110 g (g-force). CTE risk: rotational acceleration >60 rad/s² triggers neuronal injury (Greenwald 2008)."),
                        sciRow(stat: "Head movement & defense biomechanics",
                               detail: "Walilko 2005: slipping 5–10 cm reduces effective punch force 40–60%. Bob-and-weave shifts center of mass 20–30 cm — requires eccentric quad strength. Elite boxers process and initiate defense response in 150–200 ms (reaction + motor time).")
                    ]
                )

                scienceCard(
                    title: "Round Energy Systems & Metabolic Demand",
                    icon: "bolt.heart.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "PCr + glycolytic = 90% early-round energy",
                               detail: "Davis 2002: first 30 s of a boxing round is 80–90% phosphocreatine (PCr) + anaerobic glycolysis. Blood lactate peaks at 8–12 mmol/L post-round. Aerobic system becomes dominant only by round 4+ as PCr resynthesis occurs between rounds."),
                        sciRow(stat: "HR 175–185 bpm throughout bouts",
                               detail: "Dunn 2016: elite amateur boxing maintains avg HR 175–185 bpm per round — close to maximal. Work:rest ratio 3:1 (3 min round, 1 min rest) prevents full PCr resynthesis. VO₂ during rounds: 80–90% VO₂max."),
                        sciRow(stat: "Caloric cost: 10–14 kcal/min",
                               detail: "Smith 2001: boxing training (bag work, sparring) averages 10–14 kcal/min — comparable to 8–10 mph running. Sparring vs. bag: sparring 15–20% higher metabolic cost due to reactive defensive movements and cognitive load."),
                        sciRow(stat: "EPOC: 15–25% additional post-exercise burn",
                               detail: "Scott 2011: 1-hour boxing training elevates VO₂ 12–18% above resting for 30–90 min post-session (EPOC). Anaerobic glycolysis byproduct clearance and PCr resynthesis drive the excess oxygen consumption. Total caloric cost 20–25% higher than during-session calculation.")
                    ]
                )

                scienceCard(
                    title: "Brain Health, Concussion & CTE Science",
                    icon: "brain.head.profile",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Chronic traumatic encephalopathy (CTE)",
                               detail: "McKee 2015: CTE found in 68/85 (80%) of deceased boxers examined post-mortem. Tau protein accumulation in neurons — same pathology as Alzheimer's. Risk factor: total punch exposure > single severe KO. Headguards do NOT prevent CTE (only reduce cuts)."),
                        sciRow(stat: "Concussion threshold: 80–100 g rotational",
                               detail: "Greenwald 2008: rotational acceleration >6,000 rad/s² strongly associated with concussion. Neck strength is key modifier — 1 kg more neck mass reduces head acceleration by ~6 g (Mihalik 2011). Chin tuck and bracing reduce concussion risk 20–33%."),
                        sciRow(stat: "Cognitive reserve & professional boxing",
                               detail: "Heilbronner 2009 (American Academy of Clinical Neuropsychology): professional boxers show measurable neuropsychological deficits after 150+ amateur bouts. Amateur boxers with <50 bouts: no detectable cognitive differences vs controls (Jordan 1996). Bout count matters more than individual KOs."),
                        sciRow(stat: "Protective equipment effectiveness",
                               detail: "Zazryn 2003 comparative boxing vs. kickboxing: headguard use reduces facial lacerations 65% and eye injuries 55% but does not reduce concussion rate. Rule changes impact: standing 8-count, mandatory rest days after KO — reduces career CTE accumulation but not acute injury risk.")
                    ]
                )

                scienceCard(
                    title: "Training Physiology & Athletic Development",
                    icon: "figure.highintensity.intervaltraining",
                    color: .red,
                    rows: [
                        sciRow(stat: "VO₂max: 55–70 mL/kg/min elite",
                               detail: "Khanna 2006: elite amateur boxers VO₂max 58–68 mL/kg/min. Olympic-level lightweights average 65–70. Surprisingly aerobic sport — aerobic system provides 60–70% of total bout energy. Road work (running) remains cornerstone of boxing conditioning for aerobic base."),
                        sciRow(stat: "Punch speed: 10–14 m/s for elite",
                               detail: "Whiting 1988: elite boxers reach 14 m/s (50 km/h) for cross punch. Speed emerges from motor learning, not strength alone. Fast-twitch fiber recruitment (Type IIx) peaks at unconstrained velocity. Speed bag trains motor timing; double-end bag trains reaction + precision."),
                        sciRow(stat: "Weight cutting physiological risks",
                               detail: "Fogelholm 1993: dehydration to make weight (common in boxing) reduces aerobic power 8–10% and anaerobic capacity 5–15% if not fully rehydrated. 24h rehydration insufficient for full restoration (Barr 1999). Rapid weight cycling impairs long-term metabolic health."),
                        sciRow(stat: "Periodization: 12-week fight camp",
                               detail: "Bompa 2009: boxing fight camp structure: Weeks 1–4 general conditioning (volume); Weeks 5–8 sport-specific intensity (sparring volume ↑); Weeks 9–11 peak (max intensity, min volume); Week 12 taper (-50% volume). VO₂max peaks 10–14 days after last intense session.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Boxing Science")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -16, to: now) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let boxing = workouts.filter { $0.workoutActivityType == .boxing }
        let sessions = boxing.count
        let totalHR = boxing.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalKcal = boxing.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
        let totalDur = boxing.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = sessions
            avgHR = sessions > 0 ? totalHR / Double(sessions) : 0
            avgDurationMin = sessions > 0 ? totalDur / Double(sessions) : 0
            avgKcalPerMin = totalDur > 0 ? totalKcal / totalDur : 0
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
