import SwiftUI
import HealthKit

struct WalkingScienceView: View {
    @State private var totalSteps: Int = 0
    @State private var avgDailySteps: Double = 0
    @State private var weeklySteps: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                walkingStatsRow
                weeklyStepsChart
                stepCountHealthCard
                walkingBiomechanicsCard
                cognitiveWalkingCard
                dailyWalkingProtocolCard
            }
            .padding()
        }
        .navigationTitle("Walking Science")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var walkingStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSteps > 0 ? formatSteps(totalSteps) : "--", label: "Steps (8 wk)", color: .green)
                statCard(value: avgDailySteps > 0 ? "\(Int(avgDailySteps))" : "--", label: "Daily Avg", color: avgDailySteps >= 8000 ? .green : avgDailySteps >= 5000 ? .orange : .red)
                let weeklyAvg = weeklySteps.reduce(0, +) / 8
                statCard(value: weeklyAvg > 0 ? "\(Int(weeklyAvg / 1000))k/wk" : "--", label: "Weekly Avg", color: weeklyAvg >= 56000 ? .green : weeklyAvg >= 35000 ? .orange : .red)
            }
            Text("Paluch 2021 (JAMA Neurology): 7,000–9,999 steps/day reduces all-cause mortality 50–70% vs <5,000 — 10,000 steps not required for major benefit")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private func formatSteps(_ steps: Int) -> String {
        if steps >= 1_000_000 { return String(format: "%.1fM", Double(steps) / 1_000_000) }
        if steps >= 1000 { return String(format: "%.0fk", Double(steps) / 1000) }
        return "\(steps)"
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
    private var weeklyStepsChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Steps (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklySteps.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklySteps[i] / maxVal) * 80 : 4
                    let k = weeklySteps[i] / 1000
                    VStack(spacing: 2) {
                        if k > 0 {
                            Text(String(format: "%.0fk", k)).font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(weeklySteps[i] >= 56000 ? Color.green : weeklySteps[i] >= 35000 ? Color.orange : Color.green.opacity(0.4))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            Text("Green ≥56k/wk (8k/day) • Orange 35–56k • Light <35k").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var stepCountHealthCard: some View {
        scienceCard(title: "Step Count & Health Outcomes", icon: "👣", color: .green) {
            sciRow(stat: "Paluch 2021 (JAMA Neurology)", detail: "Dose-response of steps: analysis of 15 cohort studies (N=47,471); 7,000 steps/day = 50–70% lower all-cause mortality vs <5,000; benefit plateaus ~10,000 steps in adults; in adults >60: 6,000–8,000 steps/day is optimal; the '10,000 steps' goal originated from a 1960s Japanese pedometer marketing campaign, not clinical research; any increase from sedentary baseline produces measurable mortality benefit")
            sciRow(stat: "Saint-Maurice 2020 (JAMA Internal Med)", detail: "Step intensity matters: 2-year follow-up of 4,840 US adults — stepping pace (steps/min) independently predicts mortality after controlling for total steps; achieving ≥100 steps/min (brisk walking) even in short bouts significantly reduces CVD risk; cadence classification: <60 spm = slow, 60–99 = purposeful, ≥100 = moderate-to-vigorous; 'incidental steps' at slow cadence provide less cardiovascular stimulus than intentional brisk walking")
            sciRow(stat: "Tudor-Locke 2011 (Int J Behav Nutr Phys Act)", detail: "Pedometer indices by population: healthy adults typically accumulate 7,000–13,000 steps/day without intentional exercise; sedentary individuals <5,000; active individuals 10,000–12,499; highly active ≥12,500; step accumulation is NOT exclusively from structured exercise — household/occupational activity contributes 60–75% of daily steps; office workers average 3,000–5,000 steps/day on workdays — standing desks increase steps 700–900/day")
            sciRow(stat: "Spartano 2017 (Am Heart J)", detail: "Walking and cardiovascular biomarkers: walking ≥2 h/week reduces 10-year CVD risk 31% in the Framingham Heart Study; each additional hour of walking/week associated with lower BP by 1.5 mmHg, lower triglycerides 8%, higher HDL 3%; walking produces these benefits via improved insulin sensitivity, reduced visceral adipose tissue, and reduced sympathetic nervous system tone; benefits independent of body weight changes")
        }
    }

    private var walkingBiomechanicsCard: some View {
        scienceCard(title: "Walking Biomechanics & Gait", icon: "🦴", color: .blue) {
            sciRow(stat: "Kirtley 2006 (Clinical Gait Analysis)", detail: "Walking gait cycle: stance phase 60% (initial contact, loading response, mid-stance, terminal stance, pre-swing) + swing phase 40%; double support (both feet on ground) occurs twice per cycle (~10% each); walking speed = stride length × cadence; optimal self-selected cadence: 100–120 spm for healthy adults; leg pendulum model — walking is 60–70% passive, unlike running which is nearly all active")
            sciRow(stat: "Studenski 2011 (JAMA)", detail: "Gait speed as vital sign: usual gait speed in adults ≥65 predicts 10-year survival with 80% accuracy; speed <0.6 m/s = severely limited; 0.6–0.99 = impaired; ≥1.0 m/s = within normal range; each 0.1 m/s increase in gait speed associated with 12% reduced mortality risk; gait speed is the 'sixth vital sign' — simpler, more predictive than many laboratory tests for older adults")
            sciRow(stat: "Callisaya 2010 (Stroke)", detail: "Gait variability and falls: step-to-step variability (coefficient of variation >2%) is a sensitive fall predictor in older adults; dual-task walking (walking while talking/counting) increases gait variability 15–35% — impaired cognitive-motor integration; gait variability increases with: peripheral neuropathy, vestibular dysfunction, cerebellar disorders; training improves gait variability — tai chi reduces falls 35–47% (Li 2005 NEJM)")
            sciRow(stat: "Menz 2003 (J Biomech)", detail: "Age-related gait changes: healthy aging reduces gait speed 1–2%/year after 70; stride length decreases (shorter steps), cadence relatively maintained; double support duration increases — conserving stability; foot clearance (toe raise during swing) decreases, raising trip risk; age-related changes are NOT inevitable — active older adults maintain gait speed comparable to sedentary adults 15–20 years younger")
        }
    }

    private var cognitiveWalkingCard: some View {
        scienceCard(title: "Walking & Cognitive Health", icon: "🧠", color: .purple) {
            sciRow(stat: "Erickson 2011 (PNAS)", detail: "Walking and hippocampal volume: 1-year RCT in adults ≥55 — walking 3×/week (40 min) increased hippocampal volume 2% vs control group (−1.4%); larger volume correlated with better spatial memory; walking increased serum BDNF 18%; effect mediated by BDNF → neurogenesis in the dentate gyrus; the hippocampus is the primary memory structure — this was the first proof that aerobic exercise reverses brain aging")
            sciRow(stat: "Zheng 2016 (Neuroscience)", detail: "Acute walking and cognition: 30 min of walking at moderate intensity improves executive function, attention, and processing speed for 30–60 min post-exercise; prefrontal cortex blood flow increases 14% during walking; catecholamine release (dopamine, norepinephrine) from the locus coeruleus improves signal-to-noise ratio in prefrontal networks; even 10-min walks improve mood and cognitive function — practical for workplace mental performance")
            sciRow(stat: "Meng 2020 (BMJ Open)", detail: "Walking and dementia prevention: meta-analysis of 11 prospective studies — regular walking reduces dementia risk 21% (OR 0.79); dose-response: 5+ days/week vs <1 day/week = greatest protection; mechanism: walking improves vascular health (reduces white matter lesions), promotes neuroplasticity (BDNF), and reduces inflammation; walking is the most accessible, sustainable form of dementia-preventive exercise — requires no equipment, feasible at any age")
            sciRow(stat: "Chaddock 2010 (Neuropsychologia)", detail: "Fitness, gait, and childhood cognition: children with higher aerobic fitness have larger hippocampal volume (12%), better relational memory, and faster cognitive processing; association between walking fitness and academic performance strongest in 9–10 year olds; schools that implemented 20 min daily walking improved standardized test scores 10–15%; aerobic fitness in childhood predicts executive function 25 years later")
        }
    }

    private var dailyWalkingProtocolCard: some View {
        scienceCard(title: "Practical Walking Protocols", icon: "✅", color: .teal) {
            sciRow(stat: "Wahid 2016 (JAMA Intern Med meta-analysis)", detail: "Walking dose for health: analysis of 280,000 participants — walking 150 min/week at moderate intensity (WHO recommendation) reduces all-cause mortality 31%, CVD 35%, T2D 26%, depression 19%; walking >300 min/week provides additional 20% mortality reduction; equivalent to MVPA via other modalities — walking is dose-equivalent to cycling, swimming, running at same intensity; adding ≥30 min brisk walking daily achieves most of the benefit with minimal injury risk")
            sciRow(stat: "Dempsey 2016 (Diabetologia)", detail: "Walking breaks for sedentary health: sitting continuously for ≥8h/day raises T2D risk 90% independent of structured exercise; 3-min light walking every 30 min of sitting reduces postprandial blood glucose 24% and insulin 22% vs continuous sitting (Dunstan 2012 Diabetes Care); hourly 2-min walking breaks reduce serum triglycerides 11%; these 'activity snacks' prevent the metabolic derangement of prolonged sitting even in active individuals")
            sciRow(stat: "Lee 2019 (JAMA Intern Med)", detail: "10,000 steps myth debunked: Harvard Women's Health Study (N=16,741 women, avg age 72) — mortality steeply decreased from 2,700 to 7,500 steps/day; beyond 7,500, no additional mortality reduction; step intensity was NOT an independent predictor after step volume in this older population; key message: moving more matters most — even low-intensity step accumulation provides benefit vs sitting; the Japanese '10,000 steps' (manpo-kei) goal doubled the optimal prescription")
            sciRow(stat: "Morris 1953 (Lancet — the original)", detail: "The founding study: London busmen study — conductors (walking 600–700 steps/h on double-decker buses) had 50% lower CHD rate than sedentary drivers; established physical activity as a heart disease risk factor; Morris & Hardman 1997: brisk walking 30–45 min/day 5 days/week reduces CHD risk 30–35% in prospective studies; walking is the most evidence-based, lowest-barrier, highest-adherence physical activity available across all ages and fitness levels")
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
        guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [stepType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: stepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let total = samples.reduce(0.0) { $0 + $1.quantity.doubleValue(for: .count()) }
        let avgDaily = total / 56.0

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for sample in samples {
            let weeksAgo = Int(now.timeIntervalSince(sample.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += sample.quantity.doubleValue(for: .count()) }
        }

        await MainActor.run {
            self.totalSteps = Int(total)
            self.avgDailySteps = avgDaily
            self.weeklySteps = weekly
            self.isLoading = false
        }
    }
}
