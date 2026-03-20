import SwiftUI
import HealthKit

struct StairClimbingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgCalPerMin: Double = 0
    @State private var weeklyFlights: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                stairStatsRow
                weeklyChart
                cardiovascularCard
                muscleMechanicsCard
                longevityCard
                stairMasterCard
            }
            .padding()
        }
        .navigationTitle("Stair Climbing Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var stairStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSessions > 0 ? "\(totalSessions)" : "--", label: "Sessions (8 wk)", color: .orange)
                statCard(value: avgCalPerMin > 0 ? String(format: "%.1f", avgCalPerMin) : "--", label: "kcal/min Avg", color: avgCalPerMin >= 8 ? .green : avgCalPerMin >= 5 ? .orange : .red)
                let weeklyAvg = weeklyFlights.reduce(0, +) / 8
                statCard(value: weeklyAvg > 0 ? "\(Int(weeklyAvg))" : "--", label: "Flights/Week Avg", color: weeklyAvg >= 70 ? .green : weeklyAvg >= 40 ? .orange : .red)
            }
            Text("Ekelund 2019 (BMJ): Every 4 flights of stairs climbed daily reduces cardiovascular mortality 17% — among the highest per-minute exercise ROI available")
                .font(.caption2).foregroundColor(.secondary)
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

    // MARK: - Weekly Chart
    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Stair Sessions (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyFlights.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyFlights[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyFlights[i] > 0 {
                            Text("\(Int(weeklyFlights[i]))").font(.system(size: 7)).foregroundColor(.secondary)
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
    private var cardiovascularCard: some View {
        scienceCard(title: "Cardiovascular Demand & Efficiency", icon: "🫀", color: .red) {
            sciRow(stat: "Teh & Aziz 2002 (Ergonomics)", detail: "Stair climbing metabolic demand: ascending stairs requires 8–14 METs depending on pace — one of the highest-intensity weight-bearing activities achievable without equipment; average caloric cost: 0.15–0.20 kcal per step for a 70 kg person; descending stairs: 3–4 METs — still 30–40% of maximum aerobic effort; stair climbing at self-selected pace generates 85–90% HRmax in most individuals within 60 seconds — making even brief bouts meaningful cardiovascular stimuli")
            sciRow(stat: "Boreham 2005 (J Sports Sci)", detail: "Short stair bouts and cardiorespiratory fitness: 12-week intervention — three 1-minute stair bouts/day (separated by 1–2h, 5 days/week) improved VO₂max 8.6% in sedentary women; shorter bouts yield equivalent cardiorespiratory benefit to longer continuous stair exercise; total dose was only 15 min/week — among the most time-efficient fitness improvements documented; accumulated short bouts throughout the day are dose-equivalent to one longer bout (Murphy 2009 Prev Med)")
            sciRow(stat: "Stairs vs elevator: metabolic comparison", detail: "10-flight stair climb requires: 60–90 s of effort, 8–12 kcal, reaches 85–90% HRmax; elevator equivalent: 0 kcal, 0 cardiovascular stimulus; over 1 year of choosing stairs instead of elevator (10 floors, twice/day): ~4,000–6,000 kcal expended = 0.5–0.7 kg fat equivalence; stair substitution for elevator is the classic 'environmental design' intervention — NICE guidelines recommend 'stair prompts' (signage) to increase population physical activity with no barrier to access")
            sciRow(stat: "Allender 2006 (Obes Rev)", detail: "Stair climbing as lifestyle PA: walking promotes health at 3 METs; stair climbing at 9+ METs provides 3× the stimulus per minute; WHO classifies stair climbing as vigorous-intensity activity (≥6 METs) during sustained effort; stair substitution programs in workplaces increased stair climbing 50–190% (Engbers 2005 Am J Prev Med); each flight climbed = approximately 14 steps, gaining 3 m of vertical height; Apple Watch counts 'flights climbed' via barometric pressure sensor — accurate to ±1 floor")
        }
    }

    private var muscleMechanicsCard: some View {
        scienceCard(title: "Muscle Mechanics & Biomechanics", icon: "🦵", color: .blue) {
            sciRow(stat: "Nadeau 2003 (Gait Posture)", detail: "Stair climbing biomechanics: ascending stair phase — push phase (ankle plantarflexion, knee extension) generates 40% of propulsive force; pull phase (hip flexion, knee flexion at landing) generates 60%; quadriceps peak torque = 100–140% of body weight at the knee during stair ascent; gluteus maximus and medius provide hip extension and stabilization; descending stairs: quadriceps work eccentrically to control knee flexion — generating 80–120% BW eccentric force; DOMS more common in descending stairs than ascending due to eccentric loading")
            sciRow(stat: "Reeves 2009 (Med Sci Sports Exerc)", detail: "Lower limb muscle activation pattern: EMG studies show vastus lateralis and gastrocnemius are the primary engines of stair ascent; stair climbing activates gluteus maximus 30% more than level walking; vastus medialis (VMO) activation is 40% higher on stairs vs flat walking — clinically important for patellofemoral syndrome rehabilitation; stair training improves quadriceps strength 12–18% in 8 weeks (vs 6–8% for flat walking) due to increased external hip/knee moments per step")
            sciRow(stat: "Simoneau 2001", detail: "Stair descent and eccentric conditioning: descending stairs is one of the most accessible forms of eccentric exercise; eccentric loading during stair descent reduces DOMS in subsequent exercise (repeated bout effect); controlled stair descent programs (3 sets × 5 flights, 3×/week) increase eccentric quadriceps strength 22% in 6 weeks; particularly valuable for older adults who need eccentric conditioning for fall prevention without the impact of downhill running; stair descent is the 'poor person's eccentric hamstring training'")
            sciRow(stat: "Brunner-La Rocca 2000", detail: "Stair test in cardiac patients: 60-step stair climb test (4 flights, self-paced) — patients taking >90 s have poor cardiac prognosis; patients completing <5 METs on treadmill cannot safely climb 3 flights; stair test correlates r = 0.92 with treadmill exercise capacity; used in low-resource settings as a free, reproducible functional capacity test; 'flight of stairs' rule: if patient cannot climb 3 flights briskly (3–4 METs), they are high perioperative risk for elective surgery")
        }
    }

    private var longevityCard: some View {
        scienceCard(title: "Stair Climbing & Longevity", icon: "🧬", color: .green) {
            sciRow(stat: "Meyer 2020 (Eur J Prev Cardiol)", detail: "Stair climbing and all-cause mortality: pooled analysis of 3 large cohorts — each additional flight of stairs climbed per day associated with 3% lower all-cause mortality risk; climbing 5+ flights/day = 20% lower mortality vs sedentary; effect independent of other exercise habits — daily stair climbing as incidental PA provides additive mortality benefit beyond structured exercise; building occupants who take stairs daily show cardiovascular fitness levels 15–20% higher than matched elevator users")
            sciRow(stat: "Ekelund 2019 (BMJ)", detail: "Stair climbing among best per-minute exercises: analysis of 36,383 adults (UK Biobank) — vigorous-intensity activity including stair climbing at >6 METs provides 3–5× more mortality benefit per minute than moderate activity; even 10 minutes of vigorous PA per week provides significant mortality benefit; stair climbing 4 flights/day ≡ 30 min walking per cardiovascular benefit; at the same time cost, stair climbing delivers 3× the cardiovascular stimulus of brisk walking")
            sciRow(stat: "Hamer 2012 (Eur J Cardiovasc Prev Rehab)", detail: "Flights climbed and CVD: Scottish Health Survey follow-up — subjects climbing ≥5 floors/day had 18% lower CVD risk vs non-climbers; after controlling for socioeconomic status, BMI, and other exercise; the association was strongest in previously sedentary individuals — suggesting stair climbing uniquely benefits those who otherwise do little exercise; public health modeling: increasing stair climbing 2 flights/day in all adults would reduce CVD incidence 3–5% at population level")
            sciRow(stat: "Stairs vs running for metabolic syndrome", detail: "Kang 2018 (J Exerc Nutr Biochem): 12-week stair climbing (3 days/week, 50 min) in metabolic syndrome patients reduced fasting glucose 12%, triglycerides 18%, waist circumference 3.2 cm, and improved VO₂max 11% — comparable to moderate-intensity continuous running; stair climbing may be more accessible: requires no special equipment, no weather dependence, integrates into daily commute; 3 min of stair climbing (self-selected pace) achieves aerobic target intensity in most adults")
        }
    }

    private var stairMasterCard: some View {
        scienceCard(title: "Training Protocols & Practical Applications", icon: "✅", color: .orange) {
            sciRow(stat: "Murtagh 2005 (Preventive Medicine)", detail: "Stair climbing for sedentary beginners: 8-week intervention — 2-minute stair climbing bouts (3 flights, 5×/day, 5 days/week) improved VO₂max 6.2%, reduced LDL cholesterol 8%, reduced waist circumference 1.8 cm; no knee pain or adverse events despite 100% DOMS in week 1; stair training is safe for beginners with BMI up to 35 at self-selected pace; prescription: start with 1 flight 3–4×/day, add 1 flight every 2 weeks; goal: 5+ floors twice daily")
            sciRow(stat: "Stair climbing intensity targets", detail: "Pace and METs: slow ascent (1 step/second) = 8–9 METs; moderate (1.5 steps/s) = 10–11 METs; fast (2+ steps/s) = 12–14 METs; two-at-a-time stair climbing increases stride length, engages gluteus maximus 35% more, and increases cardiovascular demand 15% vs single-step; HIIT stair protocol: 20 s maximum-effort stair sprint, 40 s walk down recovery, 8–10 rounds; produces EPOC (excess post-exercise oxygen consumption) 22% above baseline for 2h")
            sciRow(stat: "Stair descent for eccentric training", detail: "Descent protocol for quadriceps: 3 sets of 10 flights descended slowly (3–4 s per step) → eccentric quadriceps conditioning equivalent to Nordic hamstring curls; reduces knee OA pain by strengthening VMO (Fransen 2015 Cochrane: exercise therapy reduces knee OA pain 40%); walk up (concentric) and slow walk down (eccentric) combines both phases for complete lower limb conditioning; knee angle during descent should be controlled at <90° to limit patellofemoral compressive force")
            sciRow(stat: "Apple Watch and flights climbed", detail: "Apple Watch barometric altimeter counts 'Flights Climbed': each flight ≈ 3 m (10 feet) of vertical gain detected by pressure change; steps alone do not count — must include vertical ascent; passive flights (escalators, elevators) not counted accurately; stairs in buildings, hills, treadmill at incline all count; Apple Health historical data: compare flights per day over 30/90 days — a declining trend may indicate lifestyle changes (remote work, elevator use); 10 flights/day is a reasonable evidence-based step goal")
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
        guard let flightsType = HKObjectType.quantityType(forIdentifier: .flightsClimbed) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType, flightsType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let stairTypes: Set<HKWorkoutActivityType> = [.stairClimbing, .stairs]
        let stairWorkouts = workouts.filter { stairTypes.contains($0.workoutActivityType) }
        let total = stairWorkouts.count
        let calPerMin: Double
        if total > 0 {
            let totalCal = stairWorkouts.reduce(0.0) { $0 + ($1.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0) }
            let totalMin = stairWorkouts.reduce(0.0) { $0 + $1.duration } / 60
            calPerMin = totalMin > 0 ? totalCal / totalMin : 0
        } else {
            calPerMin = 0
        }

        let flightSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: flightsType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for s in flightSamples {
            let weeksAgo = Int(now.timeIntervalSince(s.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += s.quantity.doubleValue(for: .count()) }
        }

        await MainActor.run {
            self.totalSessions = total
            self.avgCalPerMin = calPerMin
            self.weeklyFlights = weekly
            self.isLoading = false
        }
    }
}
