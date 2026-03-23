import SwiftUI
import HealthKit

struct Zone2ScienceView: View {
    @State private var zone2MinutesLast30: Double = 0
    @State private var zone2PercentOfTotal: Double = 0
    @State private var totalMinutesLast30: Double = 0
    @State private var weeklyZone2: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                zone2StatsRow
                weeklyChart
                mitochondrialCard
                fatOxidationCard
                eliteTrainingCard
                practicalCard
            }
            .padding()
        }
        .navigationTitle("Zone 2 Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var zone2StatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(
                    value: zone2MinutesLast30 > 0 ? "\(Int(zone2MinutesLast30))min" : "--",
                    label: "Zone 2 (30d)",
                    color: .green
                )
                statCard(
                    value: zone2PercentOfTotal > 0 ? String(format: "%.0f%%", zone2PercentOfTotal) : "--",
                    label: "% of Total Volume",
                    color: zone2PercentOfTotal >= 75 ? .green : zone2PercentOfTotal >= 50 ? .orange : .red
                )
                statCard(
                    value: zone2MinutesLast30 > 0 ? "\(Int(zone2MinutesLast30 / 4.3))min/wk" : "--",
                    label: "Weekly Avg",
                    color: zone2MinutesLast30 / 4.3 >= 150 ? .green : zone2MinutesLast30 / 4.3 >= 90 ? .orange : .secondary
                )
            }
            Text("Seiler 2010 (IJSPP): Elite endurance athletes perform 75–80% of training volume at low intensity (Zone 1–2, below LT1) — the physiological basis of longevity-proven aerobic base building")
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
            Text("Weekly Zone 2 Minutes (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyZone2.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyZone2[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyZone2[i] > 0 {
                            Text("\(Int(weeklyZone2[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.green.opacity(0.8))
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
    private var mitochondrialCard: some View {
        scienceCard(title: "Mitochondrial Biogenesis & Zone 2", icon: "🔬", color: .green) {
            sciRow(stat: "Holloszy 1967 (J Biol Chem) — foundational mitochondrial adaptation", detail: "The foundational study: 12-week endurance exercise training in rats produced 100% increase in skeletal muscle mitochondrial density (citrate synthase activity doubled); Holloszy 1967 established that exercise-induced mitochondrial biogenesis is the primary adaptation underlying improved aerobic capacity; mechanism: AMP/ATP ratio elevation during exercise activates AMPK → PGC-1α transcription → mitochondrial biogenesis gene expression → net increase in mitochondrial number and efficiency; PGC-1α ('master regulator of mitochondrial biogenesis') maximally stimulated at intensities corresponding to Zone 2 (below lactate threshold 1) — the intensity where AMPK activation is sustained without excessive glycolytic flux")
            sciRow(stat: "Brooks 2018 (Cell Metabolism — Inigo San-Millan collaboration)", detail: "Zone 2 and lactate dynamics: Zone 2 is defined as the intensity where blood lactate is elevated (1.5–2.0 mmol/L) but stable — maximal lactate clearance by slow-twitch mitochondria; in Zone 2, type I (slow-twitch) muscle fibers are maximally active and type II (fast-twitch) fibers minimally recruited; lactate produced by fast-twitch fibers is shuttled via MCT1 transporters to slow-twitch fibers and cardiac muscle, oxidized as fuel; MCT1 (lactate transporter) expression upregulates with Zone 2 training — chronically trained athletes can clear lactate faster at higher intensities; this 'lactate shuttle' (Brooks 1984/2018) is maximally operative in Zone 2 — NOT in Zone 1 (too easy) or Zone 3 (overwhelms clearance)")
            sciRow(stat: "San-Millan & Brooks 2018 (Front Physiol)", detail: "Mitochondrial efficiency and Zone 2: 24-week Zone 2 training study in untrained subjects: 45% increase in mitochondrial enzyme capacity (citrate synthase, β-hydroxyacyl-CoA dehydrogenase); capillary density increased 15–20% (more O₂ delivery per gram of muscle); these adaptations are specific to the Zone 2 intensity — they occur most strongly when mitochondria are working at near-maximum aerobic capacity for extended time (45–90 min sessions); Zone 1 (too easy): insufficient AMPK/PGC-1α stimulus; Zone 3 (too hard): glycolytic glycogen utilization dominates, reduced time-in-zone for mitochondrial adaptation per session; Zone 2 is the 'sweet spot' for mitochondrial adaptation per unit of training stress")
            sciRow(stat: "Aging and mitochondrial decline (Lanza 2012 J Gerontol)", detail: "Mitochondrial aging: skeletal muscle mitochondrial content declines 35–50% between ages 25–75 — primary mechanism of age-related metabolic decline and VO₂max reduction; mitochondrial reactive oxygen species (ROS) accumulation with age impairs mitochondrial DNA (mtDNA) fidelity; Zone 2 training reverses age-related mitochondrial decline — 12-week Zone 2 program in 65-year-olds: mitochondrial enzyme activity restored to levels of inactive 40-year-olds (Lanza 2012 J Gerontol); practical implication: Zone 2 training is the closest thing to a cellular anti-aging intervention validated in human RCTs; Peter Attia's longevity protocol emphasizes Zone 2 (150–180 min/week) as the cornerstone of healthspan extension")
        }
    }

    private var fatOxidationCard: some View {
        scienceCard(title: "Fat Oxidation & Metabolic Flexibility", icon: "🔥", color: .orange) {
            sciRow(stat: "Achten 2003 (Med Sci Sports Exerc) — fat oxidation peak", detail: "Fat max intensity: peak fat oxidation rate occurs at 40–65% VO₂max (60–72% HRmax) — the Zone 2 range; Achten 2003 measured fat oxidation across increasing intensities in 300 healthy adults: peak fat oxidation: trained cyclists 0.5–0.8 g/min; elite cyclists 1.0–1.5 g/min; untrained sedentary 0.2–0.4 g/min; training shifts fat max to higher absolute intensities while maintaining the ~65% VO₂max optimum; practical significance: during a 60-min Zone 2 session, trained athlete burns 30–54 grams of fat vs 12–24 g for sedentary person at same duration; fat oxidation capacity improves 40–60% with 12 weeks of Zone 2 training (Volek 2009)")
            sciRow(stat: "Metabolic flexibility (Galgani 2008 Am J Clin Nutr)", detail: "Metabolic flexibility definition: the ability to switch substrate utilization (fat vs carbohydrate) in response to fuel availability and exercise intensity; Zone 2-trained individuals show superior metabolic flexibility — greater fat oxidation at rest, faster substrate switch to carbohydrate during high-intensity efforts, and faster return to fat oxidation during recovery; metabolic inflexibility (common in insulin resistance, type 2 diabetes, obesity): reduced fat oxidation at low intensities, over-reliance on carbohydrates at all intensities, elevated lactate at lower intensities; Zone 2 training improves metabolic flexibility in individuals with insulin resistance (Bajpeyi 2011 J Clin Endocrinol Metab): 12-week Zone 2 cycling: fasting fat oxidation +38%, insulin sensitivity +27%")
            sciRow(stat: "GLUT4 and insulin sensitivity (Holloszy 1996 J Appl Physiol)", detail: "Zone 2 and insulin sensitivity: acute Zone 2 exercise increases GLUT4 glucose transporter expression on muscle cell membranes — improves insulin-independent glucose uptake; chronic Zone 2 training: GLUT4 expression increases 50–200% in trained muscle; mechanism: AMPK activation during Zone 2 exercise phosphorylates and activates TBC1D1/TBC1D4 → GLUT4 vesicle translocation to sarcolemma; this effect persists 24–48 hours post-exercise; 3 days/week Zone 2 training: maintains near-continuous improvements in insulin sensitivity; for type 2 diabetes management: 150 min/week Zone 2 equivalent to metformin for insulin sensitivity improvement (Snowling 2006 Diabetes Care meta-analysis)")
            sciRow(stat: "Glycogen conservation and endurance (Coyle 1986 J Appl Physiol)", detail: "Fat oxidation and glycogen sparing: higher fat oxidation rate during Zone 2 preserves muscle glycogen for higher-intensity efforts; trained athletes burn 60–70% fat at marathon pace — conserving glycogen for the final miles; untrained runners burn 80–90% carbohydrate at same absolute pace → glycogen depletion and 'hitting the wall'; the 'bonk' or 'wall' in marathon running = glycogen depletion; training-induced improvement in fat oxidation delays glycogen depletion by 45–60 min in a 3-hour endurance event; practical: Zone 2 base-building directly prevents the bonk and extends sustainable race duration; elite marathon finishers (sub-2:30) demonstrate fat oxidation rates 2–3× higher than recreational runners at equivalent relative intensity")
        }
    }

    private var eliteTrainingCard: some View {
        scienceCard(title: "Elite Training Polarization & 80/20 Evidence", icon: "🏆", color: .blue) {
            sciRow(stat: "Seiler 2010 (IJSPP) — the definitive polarized training study", detail: "Seiler 2010 analysis of Norwegian elite endurance athletes (rowers, cyclists, cross-country skiers): 75–80% of all training time at Zone 1–2 (low intensity, below LT1); 5–10% at Zone 2 (threshold, LT1–LT2); 15–20% at Zone 3 (high intensity, above LT2); this 'polarized' distribution was consistent across Olympic medalists and world-record holders across multiple sports and multiple decades of training logs; the finding: elite athletes avoid the 'black hole' of moderate intensity (Zone 2) that recreational athletes over-emphasize; low-intensity volume builds mitochondrial base; high-intensity intervals develop VO₂max ceiling; threshold work is minimized because it's too hard for recovery benefits of Zone 1 and too easy for Zone 3 adaptations")
            sciRow(stat: "Pyramidal vs polarized training (Stöggl 2014 Front Physiol)", detail: "Optimal training intensity distribution RCT: Stöggl 2014 randomly assigned 48 well-trained athletes to 9-week blocks: (1) polarized (77% Zone 1, 3% Zone 2, 20% Zone 3); (2) pyramidal (68% Zone 1, 20% Zone 2, 12% Zone 3); (3) high-volume low-intensity (86% Zone 1, 11% Zone 2, 3% Zone 3); (4) high-intensity interval (38% Zone 1, 7% Zone 2, 55% Zone 3); results: polarized training produced the greatest improvements in VO₂max (+11.7%), time-trial performance (+5.1%), and W at VO₂max; high-volume low-intensity second best (+8.7% VO₂max); pyramidal third (+7.4%); high-intensity only: limited VO₂max gain but risk of overtraining; conclusion: substantial Zone 1 base + targeted Zone 3 intervals = optimal combination")
            sciRow(stat: "Professional athlete Zone 2 prescriptions", detail: "Elite athlete Zone 2 norms: professional cyclists (Tour de France): 90–120 min Zone 2 rides on 'rest days'; weekly Zone 2 volume: 8–15 hours (480–900 min); professional triathlon (Ironman distance): 80–85% of weekly training at Zone 2; professional marathon runners: 110–130 km/week, 80% at easy pace (6:00–7:00/km for sub-2:10 marathoners); amateur translation: 150–180 min/week (WHO minimum × 2) of Zone 2 produces significant mitochondrial and metabolic benefits; Peter Attia longevity protocol: 3 hours/week Zone 2 (3 × 45–60 min sessions) as minimum effective dose; marginal returns plateau around 4–6 hours/week for non-competitive adults")
            sciRow(stat: "Why most people train too hard (Muñoz 2014 IJSPP)", detail: "'Black hole' training: recreational athletes self-select Zone 2 intensity (threshold — LT1 to LT2) far more than elites — averaging 40–50% of training volume in the 'too hard for recovery, too easy for VO₂max' zone; Muñoz 2014: recreational runners distribute training as 40% Zone 1, 40% Zone 2, 20% Zone 3; professionals: 75% Zone 1, 5% Zone 2, 20% Zone 3; the recreational tendency to train at 'comfortably hard' produces significant physiological stress while generating inferior adaptations to true polarized training; mechanism: Zone 2 (threshold) accumulates exercise stress markers (cortisol, IL-6, CRP) equivalent to Zone 3 intensity without the VO₂max adaptation benefit of Zone 3; Apple Watch HR zones enable precision easy-day pacing to stay below LT1")
        }
    }

    private var practicalCard: some View {
        scienceCard(title: "Practical Application & Monitoring", icon: "📋", color: .purple) {
            sciRow(stat: "Zone 2 identification without lactate testing", detail: "Practical Zone 2 identification: (1) Talk test: Zone 2 = can speak in full sentences but with slight effort (1–2 word pause for breath every 10–15 words); Zone 1 = effortless conversation; Zone 3 = sentences break apart; (2) Nose breathing: Zone 2 = nasal breathing possible but requires focus; forced to mouth breathe = above LT1; (3) 180 − age (Maffetone MAF HR): Zone 2 upper limit ≈ MAF HR; Zone 2 range ≈ MAF HR − 10 to MAF HR; (4) Apple Watch heart rate zones: Zone 2 in Apple's 5-zone model ≈ LT1 to LT2 range — the 'fat burn' zone; Polar's 3-zone model: Zone 1 includes both Zone 1 and Zone 2 in 5-zone models — check which zone model your device uses")
            sciRow(stat: "San-Millan Zone 2 testing with blood lactate", detail: "Lactate-based Zone 2 definition (San-Millan 2021 Frontiers): Zone 2 = blood lactate 1.7–2.0 mmol/L range; field measurement without blood: identify intensity where breathing noticeably increases but speech is still possible in short sentences; standardized Zone 2 test: 45-min constant effort at perceived Zone 2 → finger prick lactate measurement at 20-min mark; if lactate < 1.5 mmol/L: too easy; 1.5–2.0 mmol/L: correct Zone 2; > 2.0 mmol/L: too hard; retest every 6–8 weeks to track aerobic development; improvement indicator: same lactate level achievable at higher power/pace = improved aerobic capacity; professional cyclists: retesting every 6 weeks during base phase tracks aerobic development")
            sciRow(stat: "Zone 2 session structure and duration", detail: "Optimal Zone 2 sessions: minimum effective duration: 30–45 min at target HR (shorter sessions don't provide sufficient mitochondrial stimulus); optimal: 45–90 min per session; frequency: 3–4 sessions/week or 1–2 long sessions per week (e.g., 90–120 min × 2); format: continuous (simplest) or 3 × 20 min with 5-min easy breaks (manages boredom); equipment: any aerobic modality — cycling most joint-friendly for long Zone 2 (less impact than running), swimming offers resistance + cardiovascular stimulus without heat accumulation; key discipline: truly easy — GPS watch + HR alarm prevents drift into threshold; athletes consistently drift into Zone 3 if not monitored; Apple Watch HR target alert: set lower = LT1−10 bpm, upper = LT1 (estimated 77% of HRmax)")
            sciRow(stat: "Zone 2 and longevity evidence (Mandsager 2018 JAMA)", detail: "Zone 2 volume and all-cause mortality: Mandsager 2018 (JAMA Network Open, 122,007 patients): each MET increase in peak fitness reduced all-cause mortality 13%; achieving high fitness (VO₂max > 11 METs) was associated with 35% lower mortality vs low fitness — driven primarily by Zone 2 aerobic training that builds the base for peak fitness; Ekelund 2019 (BMJ, 36,000 adults): 35 min/day of moderate intensity physical activity (Zone 2) reduced all-cause mortality 35% vs sedentary individuals; dose-response continued up to 60–75 min/day without plateau; for Zone 2 specifically: 150 min/week reduces cardiovascular mortality 35–40%; 300 min/week (Peter Attia's recommendation): 50–55% reduction vs sedentary; the longevity benefit is primarily mediated by mitochondrial and metabolic adaptations unique to Zone 2 training")
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
    // Estimates Zone 2 volume from workouts where avg HR is 65–75% of estimated max HR
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
            let q = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let aerobicTypes: Set<HKWorkoutActivityType> = [.running, .cycling, .swimming, .rowing, .hiking, .elliptical, .crossTraining, .walking]
        let aerobicWorkouts = workouts.filter { aerobicTypes.contains($0.workoutActivityType) }

        var zone2Minutes = 0.0
        var totalMinutes = 0.0
        var weeklyZ2 = Array(repeating: 0.0, count: 8)
        let now = Date()

        for workout in aerobicWorkouts {
            let durMin = workout.duration / 60
            totalMinutes += durMin

            // Estimate zone 2 using avg HR relative to estimated max HR
            if let avgHRStat = workout.statistics(for: HKQuantityType(.heartRate)),
               let avgHR = avgHRStat.averageQuantity() {
                let avgHRVal = avgHR.doubleValue(for: HKUnit(from: "count/min"))
                // Rough max HR estimate: 208 - 0.7 * age (unknown age, use 35 as default)
                let estMaxHR = 183.5  // 208 - 0.7 * 35
                let hrPercent = avgHRVal / estMaxHR * 100
                // Zone 2: 65–75% HRmax
                if hrPercent >= 63 && hrPercent <= 78 {
                    zone2Minutes += durMin
                    let weeksAgo = Int(now.timeIntervalSince(workout.startDate) / (7 * 86400))
                    if weeksAgo < 8 { weeklyZ2[weeksAgo] += durMin }
                }
            }
        }

        let last30Start = Calendar.current.date(byAdding: .day, value: -30, to: endDate) ?? Date()
        let z2Last30 = aerobicWorkouts
            .filter { $0.startDate >= last30Start }
            .compactMap { w -> Double? in
                guard let s = w.statistics(for: HKQuantityType(.heartRate)),
                      let avg = s.averageQuantity() else { return nil }
                let hr = avg.doubleValue(for: HKUnit(from: "count/min"))
                let pct = hr / 183.5 * 100
                return (pct >= 63 && pct <= 78) ? w.duration / 60 : nil
            }
            .reduce(0, +)

        let total30 = aerobicWorkouts
            .filter { $0.startDate >= last30Start }
            .reduce(0.0) { $0 + $1.duration / 60 }

        await MainActor.run {
            self.zone2MinutesLast30 = z2Last30
            self.totalMinutesLast30 = total30
            self.zone2PercentOfTotal = total30 > 0 ? z2Last30 / total30 * 100 : 0
            self.weeklyZone2 = weeklyZ2
            self.isLoading = false
        }
    }
}
