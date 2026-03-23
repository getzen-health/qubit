import SwiftUI
import HealthKit

struct RunningScienceView: View {
    @State private var totalDistance: Double = 0
    @State private var avgPaceSecPerKm: Double = 0
    @State private var weeklyDistances: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                runningStatsRow
                weeklyDistanceChart
                biomechanicsCard
                trainingAdaptationsCard
                racePhysiologyCard
                injuryPreventionCard
            }
            .padding()
        }
        .navigationTitle("Running Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var runningStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                let distKm = totalDistance / 1000
                statCard(value: distKm > 0 ? String(format: "%.0f km", distKm) : "--", label: "Total (8 wk)", color: .orange)
                statCard(value: avgPaceSecPerKm > 0 ? formatPace(avgPaceSecPerKm) : "--", label: "Avg Pace /km", color: avgPaceSecPerKm > 0 && avgPaceSecPerKm < 300 ? .green : avgPaceSecPerKm < 360 ? .orange : .red)
                let weeklyAvg = weeklyDistances.reduce(0, +) / 8000
                statCard(value: weeklyAvg > 0 ? String(format: "%.1f km/wk", weeklyAvg) : "--", label: "Weekly Avg", color: weeklyAvg >= 40 ? .green : weeklyAvg >= 20 ? .orange : .red)
            }
            Text("Wen 2011 (Lancet): 5–10 min/day of slow running reduces all-cause mortality 30% and CVD mortality 45% — same benefit as longer moderate walking")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private func formatPace(_ secPerKm: Double) -> String {
        let min = Int(secPerKm) / 60
        let sec = Int(secPerKm) % 60
        return String(format: "%d:%02d", min, sec)
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

    // MARK: - Weekly Chart
    private var weeklyDistanceChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Distance (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyDistances.max() ?? 1
                    let km = weeklyDistances[i] / 1000
                    let height = maxVal > 0 ? CGFloat(weeklyDistances[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if km > 0 {
                            Text(String(format: "%.0f", km)).font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.orange.opacity(0.8))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var biomechanicsCard: some View {
        scienceCard(title: "Running Biomechanics & Economy", icon: "⚙️", color: .orange) {
            sciRow(stat: "Saunders 2004 (Sports Med)", detail: "Running economy (RE): oxygen cost at a given speed; varies 20–30% between runners of equal VO₂max; a 5% improvement in RE = same performance gain as 5% VO₂max increase; key determinants: leg stiffness, tendon energy storage (Achilles/plantar fascia), cadence, vertical oscillation, arm swing coordination; trained runners have superior neuromuscular efficiency at all speeds")
            sciRow(stat: "Heiderscheit 2011 (Med Sci Sports Exerc)", detail: "Cadence and injury: recreational runners average 162–168 spm; increasing cadence 5–10% reduces ground contact time 8%, hip adduction 10%, knee flexion moment 20%; higher cadence shortens stride, reducing tibial impact and knee loading; optimal: 170–180 spm; overstriding (footstrike ahead of COM) increases braking impulse and injury risk — the single most correctable biomechanical fault")
            sciRow(stat: "Morin 2011 (Med Sci Sports Exerc)", detail: "Leg stiffness and performance: spring-mass model — leg stiffness (kleg) determines ground contact time and running speed ceiling; elite sprinters kleg 3–5× higher than recreational runners; vertical stiffness correlates r = 0.72 with 5 km performance; plyometric training increases kleg 15–25% and improves RE 2–5% without structural changes; barefoot/minimalist training transiently increases forefoot contact, improving energy return")
            sciRow(stat: "Tartaruga 2012", detail: "Vertical oscillation and efficiency: every 1 cm reduction in vertical oscillation = ~1% improvement in RE; elite runners: 5–8 cm oscillation; recreational: 8–12 cm; Apple Watch Ultra measures oscillation via IMU; cues: 'run tall', imagine ceiling 2 cm above head; excessive oscillation wastes energy on vertical displacement rather than forward propulsion; hip drop (Trendelenburg gait) increases oscillation and ITB tension")
        }
    }

    private var trainingAdaptationsCard: some View {
        scienceCard(title: "Training Adaptations & VO₂max", icon: "📈", color: .blue) {
            sciRow(stat: "Holloszy 1967 (J Biol Chem)", detail: "Foundational endurance adaptation: first demonstration that endurance training doubles mitochondrial density in skeletal muscle; increased cytochrome oxidase activity improves oxidative phosphorylation capacity; this work established that trained muscles burn fat more efficiently and produce less lactate at the same absolute workload — the cellular basis of endurance performance still studied today")
            sciRow(stat: "Bassett & Howley 2000 (Med Sci Sports Exerc)", detail: "VO₂max determinants: cardiac output (stroke volume × HR) × arteriovenous oxygen difference; training increases SV 20–40% via plasma volume expansion and cardiac remodeling (athlete's heart); O2 extraction (a-vO2 diff) increases with mitochondrial density; VO₂max trainability: 10–25% over 6 months of structured training; untrained adults average 35–45 mL/kg/min; elite marathon runners: 70–85 mL/kg/min")
            sciRow(stat: "Seiler 2010 (Scand J Med Sci Sports)", detail: "Polarized training in runners: analysis of elite distance runners shows ~80% of sessions at low intensity (Zone 1, <75% HRmax), ~20% high intensity (Zone 3, >85% HRmax); less than 5% at lactate threshold (Zone 2 'moderate'); this 80/20 split maximizes mitochondrial enzyme expression while managing stress hormones; runners training 'too moderate' plateau — threshold work feels productive but blunts adaptation")
            sciRow(stat: "Midgley 2006 (Sports Med)", detail: "Training at VO₂max: intervals at vVO₂max (velocity at VO₂max) are the most potent stimulus for VO₂max improvement; Billat protocol: 30–40 min/session at vVO₂max in 30-60s on/off intervals; VO₂max improves 2.5–3.5 mL/kg/min per 10-week block; VO₂max plateaus after ~2 years of structured training — further performance gains come from improved running economy and lactate threshold elevation")
        }
    }

    private var racePhysiologyCard: some View {
        scienceCard(title: "Race Physiology & Pacing", icon: "🏃", color: .green) {
            sciRow(stat: "Coyle 2007 (J Appl Physiol)", detail: "Lactate threshold and marathon performance: LT (the highest workload at which lactate doesn't accumulate) is the strongest predictor of marathon time — r = 0.97 in trained runners; elite marathoners run at 87–92% VO₂max; sub-elite at 82–86%; for every 1% increase in %VO₂max at LT, marathon pace improves ~30 s/mile; LT training (tempo runs, cruise intervals) is the cornerstone of marathon-specific preparation")
            sciRow(stat: "Tucker 2006 (Brit J Sports Med)", detail: "Optimal pacing strategy: even pacing or slight negative split (second half faster) produces best race outcomes; positive split (going out too fast) causes glycogen depletion, lactate accumulation, and performance collapse; Maughan 1984: even-paced runners 4% faster than positive-split runners over marathon; Physiological reason: early excess pace commits to high glycolytic rate, depleting hepatic glycogen before 32 km ('wall')")
            sciRow(stat: "Noakes 2012 (Brit J Sports Med)", detail: "Central governor model: brain regulates effort via perceived exertion to prevent catastrophic physiological failure; peripheral afferent feedback (muscle fatigue, core temperature, blood glucose, muscle damage) updates the 'safe' effort ceiling in real time; explains: faster races in cool weather, better performance with familiar courses, late-race kick (reserves held back); Smits 2014: psychological interventions (if-then planning) improve race pacing accuracy 12%")
            sciRow(stat: "Gonzalez-Alonso 2008 (J Physiol)", detail: "Heat stress and running: core temp >40°C reduces maximal force production 10–15% via direct heat impairment of muscle contractility; cerebral hyperthermia reduces motor output — the brain protects itself; in 30°C heat, marathon performance declines 4–8% vs 10°C; pre-cooling (cold vest/ice slurry) delays critical core temp by 20–30 min; acclimatization (7–14 days) increases plasma volume 10–12% and sweat rate, improving performance 5–8% in heat")
        }
    }

    private var injuryPreventionCard: some View {
        scienceCard(title: "Running Injury Prevention", icon: "🛡️", color: .red) {
            sciRow(stat: "Hreljac 2004 (Med Sci Sports Exerc)", detail: "Running injury epidemiology: 37–56% of recreational runners injured each year; most common: patellofemoral pain (PFPS) 16–25%, ITB syndrome 12%, medial tibial stress syndrome (shin splints) 10%, plantar fasciitis 8%, Achilles tendinopathy 6%; the #1 risk factor: abrupt mileage increase (>30% in one week); shoe type accounts for <10% of injury variance — training error is 60–70% of all running injuries")
            sciRow(stat: "Blagrove 2018 (Sports Med)", detail: "Strength training for runners: heavy strength training (≥70% 1RM) improves running economy 2–8% without mass gain; mechanism: neural adaptations increase muscle co-activation efficiency and ground force production; 3×/week for 6+ weeks required; key exercises: deadlift, Bulgarian split squat, RDL; strength training does NOT slow down elite runners — Storen 2008: 8-week heavy squats improved RE 5% and 5 km time-trial 38 s in well-trained runners")
            sciRow(stat: "van der Worp 2012 (Brit J Sports Med)", detail: "Running surface and injury: contrary to popular belief, harder surfaces (asphalt) do NOT increase injury rate vs softer (grass/dirt) when runners are adapted; novice runners on concrete show higher tibial stress fracture risk; surface variety (vary routes) reduces repetitive stress at fixed anatomical locations; downhill running: quadriceps eccentric demand 2–3× greater than flat, increases DOMS and patellar tendon stress; limit to <15% of weekly volume")
            sciRow(stat: "Nielsen 2012 (BMJ Open)", detail: "Running shoes and pronation: controversial; 2-year prospective study of 1988 military recruits: matching shoe type to foot arch type (neutral/stability/motion control) did NOT reduce injury rate vs random assignment; recent evidence: novice runners in light, flexible shoes with higher cadence have equal or lower injury risk vs motion-control shoes; barefoot running reduces foot-strike index (heel striking) but requires 6+ month gradual transition to prevent stress fractures")
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
        guard let distType = HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning) else {
            isLoading = false; return
        }
        let workoutType = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [distType, workoutType])) != nil else {
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

        let runs = workouts.filter { $0.workoutActivityType == .running }
        let totalDist = runs.reduce(0.0) { $0 + ($1.totalDistance?.doubleValue(for: .meter()) ?? 0) }
        let totalDuration = runs.reduce(0.0) { $0 + $1.duration }
        let avgPace = totalDist > 0 ? (totalDuration / (totalDist / 1000)) : 0

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for run in runs {
            let weeksAgo = Int(now.timeIntervalSince(run.startDate) / (7 * 86400))
            if weeksAgo < 8 {
                weekly[weeksAgo] += run.totalDistance?.doubleValue(for: .meter()) ?? 0
            }
        }

        await MainActor.run {
            self.totalDistance = totalDist
            self.avgPaceSecPerKm = avgPace
            self.weeklyDistances = weekly
            self.isLoading = false
        }
    }
}
