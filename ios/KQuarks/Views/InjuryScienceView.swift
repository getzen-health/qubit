import SwiftUI
import HealthKit

struct InjuryScienceView: View {
    @State private var totalWorkouts: Int = 0
    @State private var avgWeeklyLoad: Double = 0
    @State private var weeklyWorkouts: [Int] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                loadStatsRow
                acwrCard
                tissueAdaptationCard
                overuseInjuryCard
                returnToPlayCard
            }
            .padding()
        }
        .navigationTitle("Injury Prevention Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var loadStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalWorkouts > 0 ? "\(totalWorkouts)" : "--", label: "Workouts (8 wk)", color: .orange)
                statCard(value: avgWeeklyLoad > 0 ? "\(Int(avgWeeklyLoad))/wk" : "--", label: "Avg Sessions/Week", color: .red)
                let acwr = weeklyWorkouts.prefix(1).reduce(0, +) > 0 && weeklyWorkouts.dropFirst().prefix(4).reduce(0, +) > 0 ?
                    Double(weeklyWorkouts.prefix(1).reduce(0, +)) / (Double(weeklyWorkouts.dropFirst().prefix(4).reduce(0, +)) / 4.0) : 0
                statCard(value: acwr > 0 ? String(format: "%.2f", acwr) : "--", label: "ACWR (1:4 wk)", color: acwr > 1.5 ? .red : acwr > 1.3 ? .orange : .green)
            }
            HStack {
                Text("Gabbett 2016: ACWR 0.8–1.3 = 'sweet spot' — below = deconditioning risk, above 1.5 = spike zone injury risk")
                    .font(.caption2).foregroundColor(.secondary)
            }
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title2).bold().foregroundColor(color)
            Text(label).font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Science Cards
    private var acwrCard: some View {
        scienceCard(title: "Acute:Chronic Workload Ratio (ACWR)", icon: "⚖️", color: .orange) {
            sciRow(stat: "Gabbett 2016 (Brit J Sports Med)", detail: "ACWR = acute load (past 7 days) / chronic load (rolling 4-week average); validated injury risk metric across rugby, cricket, AFL, soccer, and distance running; ACWR 0.8–1.3 = 'sweet spot' — optimal adaptation without excessive injury risk; ACWR >1.5 = 'spike zone' — injury risk increases 2–6× vs baseline; sudden load spikes (>15% weekly volume increase) are a stronger injury predictor than absolute training volume")
            sciRow(stat: "Hulin 2016 (Brit J Sports Med)", detail: "The 10% rule reconsidered: traditional 10% weekly volume increase rule was never empirically validated; Hulin: risk occurs at >15% acute increase AND when chronic load is low; trained athletes with high chronic fitness can tolerate larger weekly spikes (>30%) than untrained individuals; the ratio matters more than absolute increases — fitness is protective, not just gradual progression alone")
            sciRow(stat: "Malone 2017", detail: "Banked fitness as injury protection: high chronic workload (high '4-week average') reduces injury risk at any ACWR; 'fitness-fatigue' model: high-fit athletes withstand same load spikes with lower injury risk because their tissues are more adapted; implication: consistent training year-round (preventing deconditioning) is as important as avoiding spikes; rest periods reset chronic load to low levels, raising subsequent injury risk")
            sciRow(stat: "Soligard 2016 (Brit J Sports Med)", detail: "ACWR and team sports: GPS-derived training load (PlayerLoad, sRPE) enables ACWR monitoring in team sport athletes; satellite-sport practice outside team training (skills sessions, weight training) often unmeasured and contributes to uncounted ACWR spike; GPS + RPE monitoring combined provides most accurate load picture; well-managed ACWR programs reduce time-loss injuries 35% in elite squads")
        }
    }

    private var tissueAdaptationCard: some View {
        scienceCard(title: "Tissue Adaptation & Remodeling", icon: "🦴", color: .blue) {
            sciRow(stat: "Magnusson 2010 (Nat Rev Rheumatol)", detail: "Tendon adaptation rate: tendons adapt slower than muscle — weeks to months vs days to weeks; collagen synthesis peaks 24–72h after mechanical loading; turnover rate of tendon collagen: half-life 50–100 days; implication: muscle strength gains far outpace tendon adaptation, creating a 'muscle-tendon mismatch' in aggressive strength programs — the most common overuse injury mechanism")
            sciRow(stat: "Cook 2009 (Brit J Sports Med)", detail: "Continuum model of tendinopathy: reactive tendinopathy (acute overload) → tendon disrepair → degenerative tendinopathy; each stage has different structural and cellular changes; reactive tendinopathy is reversible with load management; degenerative tendinopathy shows collagen disorganization and neovascularization that is permanent but manageable; compressive loads (achilles bending around heel) worsen all stages")
            sciRow(stat: "McBain 2012", detail: "Muscle strain epidemiology: hamstring strains = 12–16% of all sports injuries (most common time-loss injury in sprint sports); recurrence rate 14–63% without proper rehabilitation; mechanisms: eccentric overload during high-speed running (proximal free tendon); Nordic hamstring exercise reduces recurrence 51% (van der Horst 2015); single-leg hamstring strength asymmetry >10% predicts strain risk")
            sciRow(stat: "Frost 2003", detail: "Wolff's Law and bone adaptation: bone remodels in response to mechanical loading — Mechanostat model; above minimum effective strain (MES): bone deposition; below MES: bone resorption; impact activities (running, jumping) are the most potent stimulus for bone mineral density; high-impact vs non-impact: impact training produces BMD 1.5–3× greater; menopausal women lose 1–2% BMD/year — resistance training prevents most of this loss")
        }
    }

    private var overuseInjuryCard: some View {
        scienceCard(title: "Overuse Injuries & Prevention", icon: "⚠️", color: .red) {
            sciRow(stat: "Meeuwisse 1994 (predisposing factors)", detail: "Overuse injury model: repetitive subthreshold loading exceeds tissue repair capacity → cumulative microtrauma; predisposing factors (intrinsic): anatomical alignment, flexibility, muscle imbalance, previous injury; predisposing factors (extrinsic): training errors (60–70% of overuse injuries), footwear, surface, equipment; training error is the #1 modifiable risk factor for overuse injury across all sports")
            sciRow(stat: "Hreljac 2004 (Med Sci Sports Exerc)", detail: "Running injury risk: 37–56% of recreational runners sustain injury each year; most common: patellofemoral pain (17%), ITB syndrome (12%), shin splints (MTSS 10%), plantar fasciitis (8%), patellar tendinopathy (7%); abrupt mileage increase, hard surfaces, and high training frequency are strongest modifiable predictors; increasing cadence by 5–10% reduces tibial stress fracture risk 50% by shortening stride and reducing impact peak")
            sciRow(stat: "Soligard 2016 (FIFA 11+ programme)", detail: "FIFA 11+ injury prevention programme: structured 20-min warm-up (running, strength, balance, plyometrics); reduces overall injury rate 30–50%, ACL injury 50%, overuse injury 30%; compliance >90% of training sessions required for full effect; generalizable to other team sports; injury prevention programs consistently show 10:1 ROI (cost of program vs cost of time-loss injuries)")
            sciRow(stat: "Hespanhol Junior 2015", detail: "Sleep and injury risk: athletes sleeping <8h/night have 1.7× higher injury risk (Milewski 2014); sleep deprivation impairs proprioception 3–5 ms reaction time delay and reduces trunk muscle activation — key injury prevention mechanism; post-training cold water immersion (CWI) at 10–15°C for 10–15 min reduces DOMS 20% and inflammatory markers, accelerating recovery before next session")
        }
    }

    private var returnToPlayCard: some View {
        scienceCard(title: "Return to Sport & Load Management", icon: "🔄", color: .green) {
            sciRow(stat: "Shrier 2015 (Brit J Sports Med)", detail: "Return-to-sport decision criteria: pain-free full ROM, symmetrical strength (limb symmetry index >90%), psychological readiness (ACL-RSI ≥65/100), sport-specific functional tests; re-injury risk after ACL reconstruction: 15× higher in first year vs general population; returning at 9+ months vs <9 months reduces re-injury risk from 40% to 10%; 'when to return' is empirically driven, not timeline-driven")
            sciRow(stat: "Ardern 2014 (Brit J Sports Med)", detail: "Psychological readiness: fear of re-injury predicts failure to return to sport after ACLR (OR 2.8); kinesiophobia (fear-avoidance) is the single strongest predictor of long-term disability after sports injury; ACL-RSI questionnaire scores >65/100 = green light for return; addressing psychological factors as formally as physical factors reduces re-injury and improves long-term outcomes")
            sciRow(stat: "Nielsen 2014", detail: "Progressive loading protocol: stage 1: pain-free range of motion + isometric; stage 2: dynamic loading at low intensity; stage 3: sport-specific movement at controlled speed; stage 4: agility + change of direction; stage 5: full competition; each stage requires 48–72h symptom assessment before progression; no stage should be rushed — the '3-stage pain monitoring model' (Silbernagel 2007) guides progression based on exercise-related pain <5/10 VAS")
            sciRow(stat: "Gabbett 2020", detail: "Injury prevention investment: athletes who complete injury prevention programs have 30–50% fewer injuries; average time-loss injury in team sports costs 25 training days and US$30,000–$60,000 in medical/performance costs; pre-season screening identifies 70–80% of athletes at high risk; GPS monitoring + HRV + sleep quality together provide 85% sensitivity for predicting upcoming injury or illness in elite athletes")
        }
    }

    // MARK: - Helpers
    private func scienceCard(title: String, icon: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack { Text(icon); Text(title).font(.headline).bold() }
                .foregroundColor(color)
            content()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func sciRow(stat: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(stat).font(.caption).bold().foregroundColor(.secondary)
            Text(detail).font(.caption).fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 2)
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        var weekly = Array(repeating: 0, count: 8)
        let now = Date()
        for workout in workouts {
            let weeksAgo = Int(now.timeIntervalSince(workout.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += 1 }
        }

        let total = workouts.count
        let avgPerWeek = Double(total) / 8.0

        await MainActor.run {
            self.totalWorkouts = total
            self.avgWeeklyLoad = avgPerWeek
            self.weeklyWorkouts = weekly
            self.isLoading = false
        }
    }
}
