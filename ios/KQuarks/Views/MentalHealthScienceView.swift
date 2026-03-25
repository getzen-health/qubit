import SwiftUI
import HealthKit

struct MentalHealthScienceView: View {
    @State private var totalMindfulMinutes: Double = 0
    @State private var avgSessionMin: Double = 0
    @State private var weeklyMindfulMin: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                mindfulStatsRow
                weeklyMindfulChart
                exerciseAndDepressionCard
                cognitiveHealthCard
                stressAndCortisoolCard
                meditationScienceCard
            }
            .padding()
        }
        .navigationTitle("Mental Health Science")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var mindfulStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalMindfulMinutes > 0 ? "\(Int(totalMindfulMinutes / 60))h \(Int(totalMindfulMinutes.truncatingRemainder(dividingBy: 60)))m" : "--", label: "Mindful Minutes (8 wk)", color: .purple)
                statCard(value: avgSessionMin > 0 ? "\(Int(avgSessionMin))min" : "--", label: "Avg Session", color: .indigo)
                statCard(value: totalMindfulMinutes > 0 ? "\(Int(totalMindfulMinutes / 56))min/day" : "--", label: "Daily Average", color: totalMindfulMinutes / 56 >= 10 ? .green : .orange)
            }
            HStack {
                Text("Hofmann 2010: 8 weeks of mindfulness-based stress reduction (MBSR) reduces anxiety 0.97 SD — effect size comparable to antidepressants")
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
    private var weeklyMindfulChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Mindful Minutes (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyMindfulMin.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyMindfulMin[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyMindfulMin[i] > 0 {
                            Text("\(Int(weeklyMindfulMin[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(weeklyMindfulMin[i] >= 70 ? Color.green : weeklyMindfulMin[i] >= 35 ? Color.orange : Color.purple.opacity(0.6))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            Text("Green ≥70 min/wk (10 min/day) • Orange 35–69 min • Purple <35 min").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var exerciseAndDepressionCard: some View {
        scienceCard(title: "Exercise & Mental Health", icon: "🧠", color: .blue) {
            sciRow(stat: "Blumenthal 1999 (JAMA Internal Med)", detail: "Exercise vs antidepressants: 10-week RCT in MDD patients — exercise (aerobic, 45 min × 3/week) was as effective as sertraline at reducing depression; 16-month follow-up: exercise group had lower relapse rate (30% vs 52%); exercise increases hippocampal BDNF (brain-derived neurotrophic factor) — same mechanism as SSRIs — without medication side effects")
            sciRow(stat: "Kvam 2016 (J Affect Disord meta-analysis)", detail: "Effect size of exercise on depression: meta-analysis of 23 RCTs; standardized mean difference d = 0.68 (moderate-to-large); exercise reduces depression symptoms equivalent to psychological therapies; aerobic exercise most studied; ≥3 sessions/week for ≥8 weeks most effective; supervised group exercise has added social benefit; baseline severity does not predict response")
            sciRow(stat: "Josefsson 2014", detail: "Exercise and anxiety: aerobic exercise acutely reduces state anxiety by 20–40% (within 5 min post-exercise); chronic exercise reduces trait anxiety d = 0.48 (meta-analysis); mechanism: increased GABAergic inhibition, reduced amygdala reactivity, increased serotonin and norepinephrine; exercise-induced hyperthermia reduces muscle tension via thermostatic hypothesis (deVries 1981)")
            sciRow(stat: "Hamer 2009 (Brit J Sports Med)", detail: "Protective dose: 5+ years of regular exercise reduces new-onset depression 30%, new-onset anxiety 48%; even 1–2 sessions/week provides significant protection; effect is dose-dependent up to 5 sessions/week (diminishing returns above); protective effect strongest for moderate-intensity exercise, not extreme intensities; sedentary individuals with MDD: exercise reduces symptoms as effectively as CBT")
        }
    }

    private var cognitiveHealthCard: some View {
        scienceCard(title: "Cognitive Health & Neuroplasticity", icon: "🧬", color: .green) {
            sciRow(stat: "Erickson 2011 (PNAS)", detail: "Exercise and hippocampus: 1-year aerobic exercise (walking 3×/week) increased hippocampal volume 2% in older adults vs control group (−1.4%); hippocampus typically shrinks with aging; larger hippocampus correlated with better spatial memory and recall; mechanism: increased BDNF → neurogenesis in dentate gyrus; effect is exercise-dose-dependent — more VO₂max increase = greater hippocampal volume increase")
            sciRow(stat: "Hillman 2008 (Nat Rev Neurosci)", detail: "Acute exercise and cognitive performance: 20 min moderate aerobic exercise immediately improves inhibitory control, attention, processing speed, and memory for 30–60 min post-exercise; mechanism: increased prefrontal cortex blood flow and dopamine/norepinephrine; school children who exercised 20 min before testing scored 15% higher on academic tests; aerobic fitness correlates r = 0.4 with academic achievement")
            sciRow(stat: "Lautenschlager 2008 (JAMA)", detail: "Exercise and dementia prevention: 24-week aerobic exercise program in adults with memory complaints: improved Alzheimer's Disease Assessment Scale cognitive subscale 1.3 points vs control; 18-month follow-up: benefit maintained; Cunnane 2020: exercise improves brain ketone metabolism — alternate fuel for insulin-resistant neurons; lifetime exercise reduces Alzheimer's risk 45–50% (Norton 2014 meta-analysis)")
            sciRow(stat: "Kramer 2006", detail: "Mechanisms of exercise on the brain: BDNF (the 'Miracle-Gro of the brain') — aerobic exercise doubles BDNF in hippocampus; IGF-1 crosses BBB and promotes neuronal survival; VEGF (vascular endothelial growth factor) drives angiogenesis increasing cerebral blood flow; endorphins reduce pain perception; endocannabinoids (anandamide) produce runner's high and anxiolysis — NOT endorphins, as endorphins don't cross BBB")
        }
    }

    private var stressAndCortisoolCard: some View {
        scienceCard(title: "Stress, Cortisol & Resilience", icon: "⚡", color: .orange) {
            sciRow(stat: "Foley 2008", detail: "Exercise and cortisol: acute moderate exercise raises cortisol; chronic aerobic training blunts the cortisol response to psychological stressors — trained individuals show 20–40% attenuated cortisol spike to same stressor vs untrained; cross-stressor adaptation hypothesis: physical stress training builds stress resilience to non-physical stressors (Sothmann 1996); perceived stress scale scores 30% lower in regularly active adults")
            sciRow(stat: "Salmon 2001", detail: "HPA axis and exercise: trained individuals have improved negative feedback sensitivity of the HPA axis — cortisol returns to baseline faster after stress; resting cortisol awakening response (CAR) is larger and more phasic in fit individuals (appropriate morning alertness); high-volume exercise without adequate recovery elevates baseline cortisol and suppresses immune function (overtraining syndrome)")
            sciRow(stat: "Greenwood 2003 (Neurosci)", detail: "Exercise-induced anxiety buffering: physically active animals exposed to uncontrollable stressors show less HPA activation and less anxiety behavior than sedentary animals; mechanism: physical activity increases serotonin (5-HT) synthesis and turnover in dorsal raphe nucleus, which inhibits stress-induced activation of the locus coeruleus (fear/anxiety circuit); exercise also increases GABA in the dorsal raphe")
            sciRow(stat: "Tang 2015 (Nat Rev Neurosci)", detail: "Mindfulness and HPA axis: MBSR (8 weeks) reduces cortisol awakening response, reduces CRP 43%, reduces amygdala gray matter density (less reactive fear response), and increases prefrontal-amygdala connectivity (better emotional regulation); cortisol reduction correlates directly with gray matter changes; mindfulness + exercise together show additive effects on stress biomarkers (Pascoe 2017)")
        }
    }

    private var meditationScienceCard: some View {
        scienceCard(title: "Meditation & Mindfulness Science", icon: "🧘", color: .purple) {
            sciRow(stat: "Hofmann 2010 (Cog Therapy Res meta-analysis)", detail: "MBSR effectiveness: meta-analysis of 39 studies — MBSR reduces anxiety d = 0.97, depression d = 0.95, stress d = 1.23; effect sizes comparable to pharmacological treatment; 8-week MBSR (2.5h/week group + 45 min daily home practice) is the gold standard protocol; once-daily 10-min mindfulness sessions show 60% of benefit of formal MBSR in real-world conditions")
            sciRow(stat: "Lazar 2005 (Neuroreport)", detail: "Structural brain changes from meditation: long-term meditators have greater cortical thickness in right anterior insula (interoception), right prefrontal cortex (attention), and right middle/superior frontal gyrus; insular thickness correlates with meditation experience; cortical thinning with age is attenuated by meditation; experienced meditators show 40–50% less age-related cortical thinning than age-matched non-meditators")
            sciRow(stat: "Davidson 2003 (Psychosom Med)", detail: "Meditation and immune function: 8-week MBSR in biotech employees: increased left-sided anterior brain activation (positive affect), produced greater antibody titers after influenza vaccine; magnitude of left-sided activation shift correlated with antibody response; meditation trained immune response shows greater 'natural killer' cell activity; meditators have telomerase activity 30% higher than non-meditators (Jacobs 2011)")
            sciRow(stat: "Goyal 2014 (JAMA Internal Med)", detail: "Mindfulness meta-analysis (47 RCTs): moderate evidence for improvement in anxiety (d = 0.38), depression (d = 0.30), and pain (d = 0.33); insufficient evidence that meditation is better than active controls (exercise, other treatments); Khoury 2015: MBSR most evidence-based; apps (Headspace, Calm) effective for reducing stress — 10 min/day for 10 days reduces mind-wandering 15% (Mrazek 2013)")
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
        guard let mindfulType = HKObjectType.categoryType(forIdentifier: .mindfulSession) else {
            isLoading = false; return
        }

        guard (try? await store.requestAuthorization(toShare: [], read: [mindfulType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let samples: [HKCategorySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: mindfulType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKCategorySample]) ?? [])
            }
            store.execute(query)
        }

        let totalMin = samples.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 }
        let count = samples.count

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for sample in samples {
            let weeksAgo = Int(now.timeIntervalSince(sample.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += sample.endDate.timeIntervalSince(sample.startDate) / 60 }
        }

        await MainActor.run {
            self.totalMindfulMinutes = totalMin
            self.avgSessionMin = count > 0 ? totalMin / Double(count) : 0
            self.weeklyMindfulMin = weekly
            self.isLoading = false
        }
    }
}
