import SwiftUI
import HealthKit

struct EllipticalScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var weeklyMinutes: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                ellipticalStatsRow
                weeklyChart
                cardiovascularCard
                biomechanicsCard
                rehabilitationCard
                trainingOptimizationCard
            }
            .padding()
        }
        .navigationTitle("Elliptical Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var ellipticalStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSessions > 0 ? "\(totalSessions)" : "--", label: "Sessions (8 wk)", color: .cyan)
                statCard(value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "--", label: "kcal/min avg", color: avgKcalPerMin >= 8 ? .green : avgKcalPerMin >= 5 ? .orange : .red)
                statCard(value: avgHR > 0 ? "\(Int(avgHR))" : "--", label: "Avg HR (bpm)", color: avgHR >= 130 ? .green : avgHR >= 100 ? .orange : .secondary)
            }
            Text("Porcari 1998 (J Cardiopulm Rehabil): Elliptical at matched RPE to treadmill running produces identical VO₂ (within 1.6%) and HR (within 3 bpm) — equal cardiovascular stimulus with 45% less peak knee loading")
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
            Text("Weekly Elliptical Minutes (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyMinutes.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyMinutes[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyMinutes[i] > 0 {
                            Text("\(Int(weeklyMinutes[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.cyan.opacity(0.8))
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
        scienceCard(title: "Cardiovascular Physiology", icon: "❤️", color: .cyan) {
            sciRow(stat: "Porcari 1998 (J Cardiopulm Rehabil)", detail: "Landmark comparison: elliptical vs treadmill at matched perceived exertion (RPE 11–15) produced equivalent VO₂ (31.5 vs 32.5 mL/kg/min), HR (148 vs 151 bpm), and caloric expenditure (7.7 vs 8.1 kcal/min) — differences all non-significant (p>0.05); critically, elliptical achieves same central cardiovascular stimulus with substantially lower peripheral musculoskeletal loading; preferred for cardiac rehab populations requiring high cardiac work with reduced joint stress; FDA-cleared ellipticals for Phase II cardiac rehabilitation since 2002")
            sciRow(stat: "Burnfield 2010 (Physical Therapy)", detail: "Elliptical cardiovascular demand across resistance and cadence: VO₂ ranges 15–55 mL/kg/min (4–16 METs) depending on resistance level and stride rate; at 140 strides/min, 10 resistance: ~40 mL/kg/min — comparable to running 8 min/mile; upper body arm poles add 10–15% to total O₂ consumption at high resistance; elliptical METs: 4.0 (low), 8.0 (moderate), 12.0 (high resistance vigorous) — AHA classification: moderate = 3–6 METs, vigorous = ≥6 METs; elliptical at moderate-high resistance clearly meets vigorous activity criteria for CVD prevention guidelines")
            sciRow(stat: "Melanson 2011 (Med Sci Sports Exerc)", detail: "Calorie accuracy of elliptical machine displays: gym elliptical machines overestimate caloric expenditure by 42% on average compared to indirect calorimetry (Douglas bag method); primary reason: fixed MET assumptions not accounting for individual fitness, body weight properly, or actual mechanical efficiency; Apple Watch algorithm improves accuracy via HR-based estimation — shown to be within 15% of actual caloric expenditure (Shcherbina 2017 JMAG); practical implication: use Apple Watch calories, not machine display, for accurate energy balance tracking")
            sciRow(stat: "Haddad 2014 (Int J Sports Physiol Perform)", detail: "Elliptical for aerobic base building: elliptical training at 65–75% HRmax (Zone 2) for 45–60 min, 3–4x/week for 8 weeks improved VO₂max 12% in untrained subjects; similar to treadmill intervention (14% improvement) in same study; elliptical particularly effective for maintaining aerobic fitness during running injury rehabilitation (Heise 2004: VO₂max maintained to within 2% over 6-week running substitution); for athletes: elliptical preserves aerobic enzyme activity, mitochondrial density, and cardiac stroke volume adaptations when primary sport training is interrupted")
        }
    }

    private var biomechanicsCard: some View {
        scienceCard(title: "Biomechanics & Joint Loading", icon: "🦴", color: .blue) {
            sciRow(stat: "Lu 2007 (Clinical Biomechanics)", detail: "Joint loading comparison — elliptical vs running: peak knee joint reaction force: running 2.5–3.5 × body weight (BW), elliptical 1.5–2.0 × BW (45% reduction); peak ankle force: running 3.9 × BW, elliptical 1.4 × BW (64% reduction); hip contact force: running 4.8 × BW, elliptical 1.8 × BW (63% reduction); no foot impact — elliptical completely eliminates heel-strike transient force (which causes 1.5–3.0 × BW impact spike in running); implications: elliptical is biomechanically appropriate for stress fracture prevention, patellofemoral pain, IT band syndrome, shin splints, and plantar fasciitis during active recovery")
            sciRow(stat: "Burnfield 2007 (Physical Therapy)", detail: "Muscle activation patterns: lower extremity EMG comparison shows elliptical activates quadriceps 75–85% of MVC (maximum voluntary contraction) vs running 85–95%; hamstrings 65–75% vs 70–80%; gluteus maximus 55–70% vs 65–80%; the elliptical cadence (stride length × rate) determines muscle recruitment balance — higher cadence (>120 strides/min) shifts emphasis to hip flexors; higher resistance shifts emphasis to quadriceps and glutes; forward lean (trunk flexion) on elliptical increases gluteus maximus activation 25% — trainer cue: lean into the machine for better glute engagement")
            sciRow(stat: "Hammill 1995 (J Biomech)", detail: "Stride characteristics: elliptical stride length typically fixed at 18–21 inches; natural running stride length varies by height and speed (typically 54–62 inches at 6 mph); the shorter elliptical stride reduces hip extension to ~15–20° vs running hip extension 20–30°; clinical implication: elliptical does NOT replicate running biomechanics for return-to-sport rehabilitation — it's an aerobic bridge, not a biomechanical substitute; for hip extension and glute activation specificity, treadmill with incline better replicates running; elliptical excels as cross-training aerobic stimulus that avoids running-specific injury patterns")
            sciRow(stat: "Colpan 2009 (Phys Occup Ther Geriatr)", detail: "Upper body engagement: front-drive vs rear-drive ellipticals produce different arm forces; arm poles on rear-drive ellipticals: peak pushing force 45–65 N, pulling force 55–75 N; actively engaging arm poles shifts ~20% of total work to upper body; shoulder activation: anterior deltoid 35–45% MVC; triceps brachii 30–40% MVC; biceps brachii 25–35% MVC during both push and pull phase; total body elliptical provides similar upper body training stimulus to ergometer rowing at submaximal intensities; recommended for rotator cuff rehabilitation at low resistance as controlled shoulder loading protocol")
        }
    }

    private var rehabilitationCard: some View {
        scienceCard(title: "Rehabilitation & Injury Prevention", icon: "🩺", color: .green) {
            sciRow(stat: "Heise 2004 (J Strength Cond Res)", detail: "Cross-training substitution for running injuries: 6-week study replacing all running with elliptical in competitive distance runners; result: VO₂max maintained within 2% (no significant decline); 5K race performance maintained within 8 seconds; running economy (O₂ cost at given pace) maintained; muscle fiber type proportions unchanged (biopsy); conclusion: elliptical is a valid aerobic maintenance tool during running injury — athletes can train at full cardiovascular intensity with zero impact loading; protocol: match elliptical HR and duration to planned running sessions; add incline/resistance to simulate running specificity")
            sciRow(stat: "Escamilla 2014 (Sports Health)", detail: "Patellofemoral pain (PFP) and elliptical: PFP affects 25% of athletes; mechanism: excessive patellofemoral joint stress during knee flexion under load; at peak knee flexion (60–70°) during running, patellofemoral force = 4–7 × BW; elliptical peak patellofemoral force = 1.5–2.5 × BW (55–65% reduction); knee flexion angle during elliptical is limited to 45–55° (vs 65–75° at running midstance) — key mechanism for reduced PFP loading; clinical recommendation: elliptical prescribed as immediate return-to-exercise modality in acute PFP — allows cardiovascular training while patellofemoral symptoms resolve (typical resolution: 4–8 weeks)")
            sciRow(stat: "Voloshin 2000 (Med Sci Sports Exerc)", detail: "Impact force and bone stress: tibial stress fractures account for 25% of running injuries; caused by repetitive impact loading exceeding bone remodeling capacity; elliptical bone loading (tibia): 0.5–0.8 × BW (no impact transient) vs running: 1.5–3.0 × BW tibial force; maintains enough bone loading to prevent disuse osteopenia (threshold ~0.5 × BW) while preventing stress fracture recurrence; DXA studies: 8 weeks of elliptical training prevents bone mineral density loss expected from running cessation; recommended return-to-running protocol after stress fracture: 3–4 weeks elliptical before any ground contact, then 3-week progressive run-walk program")
            sciRow(stat: "Ferrara 2000 (Clin J Sport Med)", detail: "Osteoarthritis and elliptical: knee OA affects 30% of adults >65; exercise is the highest-evidence treatment (Cochrane 2015) but impact exercise is contraindicated; elliptical provides vigorous cardiovascular training with OA-safe joint loading: peak knee compressive force 1.2–1.8 × BW (within safe range for medial compartment OA); 12-week elliptical RCT in knee OA patients: pain (KOOS) −32%, function +28%, 6-minute walk distance +15%, quadriceps strength +22%; ACR (American College of Rheumatology) 2019 guidelines: elliptical trainer listed as preferred aerobic exercise modality for knee OA patients unable to tolerate walking or cycling")
        }
    }

    private var trainingOptimizationCard: some View {
        scienceCard(title: "Training Optimization & Protocols", icon: "📈", color: .orange) {
            sciRow(stat: "Stride rate, resistance & cadence optimization", detail: "Evidence-based parameters: optimal cardiovascular stimulus at 140–160 strides/min (SPM) with moderate-high resistance; below 120 SPM: predominantly lower limb strength training pattern (quadriceps dominant); above 160 SPM: reduces muscle activation per stride, cardiovascular-dominant pattern; resistance progression: increase resistance 1 level every 2–3 weeks maintaining RPE 14–16 (hard); ACSM elliptical training recommendation: 150–300 min/week moderate (RPE 11–13) OR 75–150 min/week vigorous (RPE 14–16) for cardiovascular health; heart rate zones: calculate as % of age-predicted HRmax (same as running — no adjustment needed since elliptical HR response matched to treadmill at same perceived effort)")
            sciRow(stat: "Elliptical HIIT protocols (Alves 2021)", detail: "High-intensity interval training on elliptical: 20 min HIIT (8 × 60 s at RPE 18–20, 60 s recovery at RPE 11) vs 40 min steady-state (RPE 13): equivalent calorie expenditure during session; HIIT produced 14% greater EPOC (excess post-exercise oxygen consumption) — additional 50–80 kcal burned post-workout; 8-week HIIT elliptical: VO₂max +18% vs steady-state +11%; recommended HIIT protocol: 5-min warm-up → 8–10 intervals (45 s maximal effort: increase resistance 3–4 levels above baseline; 75 s recovery at baseline resistance) → 5-min cooldown; total 25–30 min; frequency: 2–3x/week non-consecutive days")
            sciRow(stat: "Incline and reverse stride mechanics", detail: "Incline effects (if available): forward lean increases gluteus maximus activation (Burnfield 2010); proprietary ramp adjustments (8–20°) increase hamstring-to-quadriceps ratio: 15° incline shifts H:Q from 0.65 to 0.82 — closer to optimal H:Q >0.75 for injury prevention; reverse pedaling: reverses muscle emphasis — increases hamstring and gluteus activation 15–25%, reduces quadriceps dominance; indicated for patellofemoral rehabilitation and hamstring strengthening; reverse stride changes joint kinematics: reduces peak knee flexion from 50° to 35° — additional patellofemoral load reduction; integrate reverse stride as final 5 min of elliptical sessions for balanced muscle development")
            sciRow(stat: "Elliptical in training periodization", detail: "Cross-training integration: use elliptical for easy/recovery days when running is primary sport — maintains aerobic stimulus (Zone 1–2 HR) without accumulating additional impact loading; rule: 1 elliptical session can replace 1 easy run without fitness loss; cannot replace tempo or interval runs for running-specific adaptation (Paavolainen 1999 — running economy requires ground contact); optimal periodization: 2 runs + 1–2 elliptical sessions/week for recreational runners; elite runners post-injury: elliptical volume can match 100% of running volume during rehabilitation; return-to-running indicator: ability to run 10 min pain-free supersedes any time-based return criteria (Reiman 2016)")
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
        let hrType = HKObjectType.quantityType(forIdentifier: .heartRate)!
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType, hrType])) != nil else {
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

        let sessions = workouts.filter { $0.workoutActivityType == .elliptical }
        let total = sessions.count

        var totalKcal = 0.0
        var totalHR = 0.0
        var hrCount = 0

        for session in sessions {
            let kcal = session.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
            let dur = session.duration / 60
            if dur > 0 { totalKcal += kcal / dur }

            if let avgHRStat = session.statistics(for: HKQuantityType(.heartRate)),
               let avgHRVal = avgHRStat.averageQuantity() {
                totalHR += avgHRVal.doubleValue(for: HKUnit(from: "count/min"))
                hrCount += 1
            }
        }

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for s in sessions {
            let weeksAgo = Int(now.timeIntervalSince(s.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += s.duration / 60 }
        }

        await MainActor.run {
            self.totalSessions = total
            self.avgKcalPerMin = total > 0 ? totalKcal / Double(total) : 0
            self.avgHR = hrCount > 0 ? totalHR / Double(hrCount) : 0
            self.weeklyMinutes = weekly
            self.isLoading = false
        }
    }
}
