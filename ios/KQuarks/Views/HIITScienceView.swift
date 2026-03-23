import SwiftUI
import HealthKit

struct HIITScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDuration: Double = 0
    @State private var avgPeakHR: Double = 0
    @State private var weeklyMinutes: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                hiitStatsRow
                weeklyVolumeChart
                physiologyScienceCard
                adaptationsCard
                protocolsCard
                comparisonCard
            }
            .padding()
        }
        .navigationTitle("HIIT Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var hiitStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSessions > 0 ? "\(totalSessions)" : "--", label: "HIIT Sessions (8 wk)", color: .pink)
                statCard(value: avgDuration > 0 ? "\(Int(avgDuration))min" : "--", label: "Avg Duration", color: .orange)
                statCard(value: avgPeakHR > 0 ? "\(Int(avgPeakHR))" : "--", label: "Avg Peak HR", color: .red)
            }
            HStack {
                Text("Billat 2001: ≥1 HIIT session/week at ≥90% HRmax triggers superior VO₂max adaptations vs continuous training")
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

    // MARK: - Weekly Chart
    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly HIIT Volume (8 Weeks, minutes)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyMinutes.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyMinutes[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyMinutes[i] > 0 {
                            Text("\(Int(weeklyMinutes[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.pink.opacity(0.8))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            Text("ACSM: 75 min/week vigorous-intensity exercise minimum; HIIT can meet this in fewer sessions").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var physiologyScienceCard: some View {
        scienceCard(title: "HIIT Physiology", icon: "⚡", color: .pink) {
            sciRow(stat: "Tabata 1996 (Med Sci Sports Exerc)", detail: "The original HIIT study: 6 weeks of 4-minute Tabata protocol (8×20s all-out / 10s rest at 170% VO₂max) improved aerobic capacity +14% AND anaerobic capacity +28% — dual-system training unachievable with moderate continuous exercise; moderate-intensity group improved VO₂max +10% with zero anaerobic improvement; Tabata = most time-efficient training protocol for dual-system development")
            sciRow(stat: "Laursen 2002 (Sports Med)", detail: "Physiological responses to HIIT: intervals at ≥90% HRmax maximally recruit Type II muscle fibers, spike lactate to 8–15 mmol/L, and create profound oxygen deficit; post-HIIT EPOC of 6–15% of total session energy cost lasts 12–24h; HIIT session at 90%+ HRmax produces greater AMPK activation than continuous exercise at 70% VO₂max — stronger mitochondrial biogenesis signal")
            sciRow(stat: "Gibala 2006 (J Physiol)", detail: "Sprint interval training (SIT) efficiency: 6 sessions of 2.5 min SIT (4–6×30s Wingate / 4 min rest) = 10.5h total time; produced equivalent muscular endurance and oxidative enzyme activity as 10.5h of continuous moderate training; mechanism: 30s all-out sprints activate PGC-1α via AMPK at levels requiring hours of continuous training; minimum effective dose for mitochondrial adaptation")
            sciRow(stat: "Buchheit 2013 (Sports Med)", detail: "Optimal HIIT intensity: intervals at 90–95% HRmax spend the most time at VO₂max per unit fatigue; 'velocity at VO₂max' (vVO₂max) intervals: 4×4 min at 90–95% HRmax with 3 min rest (Norwegian 4×4 protocol); time at VO₂max accumulates 50% faster than 30-15 intervals at same energy cost; HRmax zones 4–5 are the physiological sweet spot for HIIT")
        }
    }

    private var adaptationsCard: some View {
        scienceCard(title: "Adaptations to HIIT Training", icon: "📈", color: .orange) {
            sciRow(stat: "Wisløff 2007 (Circulation)", detail: "4×4 min HIIT vs moderate continuous exercise in post-MI patients: VO₂max improved 46% with HIIT vs 14% with continuous (P<0.01); cardiac function (left ventricular function) improved significantly with HIIT but not continuous; endothelial function improved 2× more with HIIT; cardiac rehabilitation guidelines now recommend HIIT as the preferred protocol")
            sciRow(stat: "Rognmo 2004 (Eur J Cardiovasc Prev Rehab)", detail: "VO₂max improvements by intensity: high-intensity (90–95% HRmax): +5.5 mL/kg/min over 10 weeks; moderate-intensity (70–75% HRmax): +3.5 mL/kg/min; both at matched energy expenditure; mechanism: high-intensity preferentially increases stroke volume via eccentric cardiac hypertrophy; superior LV compliance and filling pressure at peak exercise")
            sciRow(stat: "Boutcher 2011 (J Obes)", detail: "HIIT and fat loss: 15-week HIIT protocol (20 min of 8s sprint/12s rest cycling): reduced visceral fat 17%, subcutaneous abdominal fat 12%, total fat mass −1.7 kg; control group (continuous cycling matched energy): no significant fat change; HIIT's superior fat loss attributed to EPOC, catecholamine-driven lipolysis, and improved insulin sensitivity — not just caloric burn during exercise")
            sciRow(stat: "Jelleyman 2015 (Obes Rev meta-analysis)", detail: "HIIT vs MICT for metabolic health: systematic review of 50 studies; HIIT reduces insulin resistance (HOMA-IR) 0.53 SD more than MICT; HIIT reduces abdominal fat 0.43 SD more; fasting glucose: HIIT superior −1.7 mmol/L vs MICT; effects maintained at ≥12-week follow-up; even 12 min/week HIIT improves metabolic markers in metabolic syndrome")
        }
    }

    private var protocolsCard: some View {
        scienceCard(title: "HIIT Protocols & Programming", icon: "📋", color: .blue) {
            sciRow(stat: "Norwegian 4×4 Protocol", detail: "Helgerud 2007: Gold-standard HIIT protocol — 4 reps × 4 min at 90–95% HRmax, 3 min active recovery at 70% HRmax; 8-week program increases VO₂max +7.2 mL/kg/min vs +3.5 mL/kg/min with continuous; developed by Norwegian Olympic coaches; used by elite rowers, cross-country skiers, and soccer players as primary VO₂max builder; optimal for VO₂max improvement efficiency")
            sciRow(stat: "Tabata Protocol", detail: "Tabata 1996: 4 min total — 8 rounds of 20s max effort / 10s rest; intensity ≈170% VO₂max; designed for speed skaters; proven dual aerobic-anaerobic benefit; applicability: any exercise (cycling, rowing, burpees, sprinting); caution: true Tabata requires maximal intensity — gym 'Tabata' at submaximal effort does not replicate the research protocol; actual intensity is the key variable")
            sciRow(stat: "30-15 Intermittent Fitness Test (Buchheit 2008)", detail: "30-15 IFT: sets of 30s running / 15s walking at increasing speeds until failure — both fitness test and training protocol; VIFT (final speed) used to prescribe HIIT intensity; 30-15 intervals at 95% VIFT are superior to 4×4 intervals for improving repeated sprint ability; widely used in team sports (soccer, rugby, basketball); superior for sport-specific conditioning due to velocity specificity")
            sciRow(stat: "Frequency and Recovery (Billat 2001)", detail: "HIIT frequency: ≥1 VO₂max interval session/week is required to stimulate meaningful VO₂max adaptation; ≤2 HIIT sessions/week optimal for most non-athletes; >3 HIIT sessions/week increases injury risk and diminishing returns without corresponding performance gain; minimum 48h between HIIT sessions for CNS recovery; monitor HRV — acute HRV drop >10% post-HIIT indicates insufficient recovery")
        }
    }

    private var comparisonCard: some View {
        scienceCard(title: "HIIT vs Steady-State: The Science", icon: "⚖️", color: .green) {
            sciRow(stat: "Scharhag-Rosenberger 2012", detail: "HIIT vs MICT — what each does best: HIIT superior for VO₂max improvement (+7–14% vs +5–10%), cardiovascular remodeling, and time efficiency; MICT superior for fat oxidation per session, mitochondrial enzyme density with matched volume, and psychological recovery; optimal combination: 80% MICT + 20% HIIT (Seiler's polarized model) outperforms either alone or 50/50 distribution")
            sciRow(stat: "Milanović 2015 (Sports Med meta-analysis)", detail: "Effect sizes: HIIT vs MICT on VO₂max: HIIT d = 0.98 vs MICT d = 0.84 (both large); HIIT vs MICT on body composition: negligible differences when matched for energy expenditure; HIIT advantage: 1/3 the time for equivalent VO₂max gains; MICT advantage: lower perceived exertion, better sustainable volume, superior for athletes needing high aerobic volume")
            sciRow(stat: "Sperlich 2014 (Int J Sports Physiol Perf)", detail: "HIIT and endocrine stress response: repeated HIIT without adequate recovery elevates resting cortisol 15–30%, suppresses testosterone:cortisol ratio, and down-regulates beta-adrenergic receptors — hallmarks of overreaching; HRV monitoring during HIIT blocks is the most validated non-invasive indicator of recovery status; HRV app trending down across a training week = reduce HIIT frequency")
            sciRow(stat: "Ross 2015 (Ann Intern Med)", detail: "HIIT for clinical populations: adults with cardiovascular disease, T2DM, and metabolic syndrome: HIIT 3×/week for 12 weeks is safe with medical supervision and produces superior outcomes vs MICT; risk of acute cardiac events during HIIT: 1 per 888,000 sessions in stable CAD patients — lower than previously assumed; current ESC, ACC, and AHA guidelines support medically supervised HIIT for most cardiac patients")
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
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let hiitWorkouts = workouts.filter {
            $0.workoutActivityType == .highIntensityIntervalTraining || $0.workoutActivityType == .mixedCardio
        }

        let total = hiitWorkouts.count
        let avgMin = total > 0 ? hiitWorkouts.reduce(0.0) { $0 + $1.duration / 60 } / Double(total) : 0

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for workout in hiitWorkouts {
            let weeksAgo = Int(now.timeIntervalSince(workout.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += workout.duration / 60 }
        }

        await MainActor.run {
            self.totalSessions = total
            self.avgDuration = avgMin
            self.weeklyMinutes = weekly
            self.isLoading = false
        }
    }
}
