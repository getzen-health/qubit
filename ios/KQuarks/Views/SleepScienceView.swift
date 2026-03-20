import SwiftUI
import HealthKit

struct SleepScienceView: View {
    @State private var avgSleepHours: Double = 0
    @State private var avgBedtime: Date? = nil
    @State private var avgWakeTime: Date? = nil
    @State private var weeklySleepHours: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    private var sleepQualityColor: Color {
        if avgSleepHours >= 7.5 { return .green }
        if avgSleepHours >= 6.0 { return .orange }
        return .red
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                sleepStatsRow
                weeklySleepChart
                stagesAndArchitectureCard
                sleepAndPerformanceCard
                deprivationScienceCard
                chronobiologyCard
            }
            .padding()
        }
        .navigationTitle("Sleep Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var sleepStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgSleepHours > 0 ? String(format: "%.1f", avgSleepHours) + "h" : "--", label: "Avg Sleep/Night", color: sleepQualityColor)
                statCard(value: avgSleepHours > 0 ? sleepLabel : "--", label: "Sleep Status", color: sleepQualityColor)
                statCard(value: avgSleepHours > 0 ? "\(Int(avgSleepHours * 7))h" : "--", label: "Weekly Total", color: .indigo)
            }
            HStack {
                Circle().fill(sleepQualityColor).frame(width: 8, height: 8)
                Text(avgSleepHours >= 7.5 ? "Sleep meets NSF/AASM 7–9h adult recommendation" :
                     avgSleepHours >= 6.0 ? "Below optimal — Carskadon 2011: 7–9h target for adults" :
                     "Chronically insufficient — Van Dongen 2003: <6h/night impairs like 24h deprivation")
                    .font(.caption).foregroundColor(sleepQualityColor)
            }
        }
    }

    private var sleepLabel: String {
        if avgSleepHours >= 8.0 { return "Optimal" }
        if avgSleepHours >= 7.0 { return "Good" }
        if avgSleepHours >= 6.0 { return "Borderline" }
        return "Insufficient"
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
    private var weeklySleepChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Sleep Duration (8 Weeks, hours/night)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = max(weeklySleepHours.max() ?? 1, 9)
                    let height = maxVal > 0 ? CGFloat(weeklySleepHours[i] / maxVal) * 80 : 4
                    let h = weeklySleepHours[i]
                    VStack(spacing: 2) {
                        if h > 0 {
                            Text(String(format: "%.1f", h)).font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(h >= 7.5 ? Color.green : h >= 6.0 ? Color.orange : Color.red)
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            Text("Green ≥7.5h • Orange 6–7.5h • Red <6h (AASM/SRS: adults need 7–9h)").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var stagesAndArchitectureCard: some View {
        scienceCard(title: "Sleep Stages & Architecture", icon: "🌙", color: .indigo) {
            sciRow(stat: "Walker 2017 (Why We Sleep)", detail: "NREM-REM cycle: 90-min cycles, 4–5 per night; early night = mostly NREM Stage 3 (slow-wave, SWS) for physical restoration; late night = mostly REM for emotional memory and learning consolidation; missing the last 2h of an 8h night cuts REM by 20–25% disproportionately — explains why 6h sleep impairs emotional regulation more than simple memory")
            sciRow(stat: "Dijk 2010", detail: "Slow-wave sleep (SWS) physiology: SWS characterized by delta waves (0.5–4 Hz); growth hormone (GH) secretion is 80% coupled to first SWS bout — GH is essential for tissue repair, muscle protein synthesis, and fat mobilization; SWS declines ~2% per decade after age 30; exercise (particularly resistance training) acutely increases SWS 12–20%")
            sciRow(stat: "Tononi 2006 (Synaptic Homeostasis Hypothesis)", detail: "Why we need sleep: during wakefulness, synaptic potentiation accumulates metabolic byproducts (adenosine, lactate, reactive oxygen species); SWS restores synaptic weights via downscaling, reduces synaptic energy demand, and clears waste via the glymphatic system (Xie 2013: brain waste clearance 10× faster during sleep vs waking — Alzheimer's plaques cleared nightly)")
            sciRow(stat: "Carskadon 2011", detail: "Sleep need across life: newborns 14–17h; teenagers 8–10h (circadian phase delay of 2–3h = biological cause of morning difficulty, not laziness); adults 7–9h; elderly 7–8h but fragmented; sleep debt is cumulative (Banks 2007: 14 days of 6h/night accumulates equivalent of 48h total deprivation) — humans cannot accurately self-assess their level of impairment")
        }
    }

    private var sleepAndPerformanceCard: some View {
        scienceCard(title: "Sleep & Athletic Performance", icon: "🏃", color: .blue) {
            sciRow(stat: "Mah 2011 (Sleep)", detail: "Sleep extension in elite athletes: Stanford basketball players sleeping 10h/night for 5–7 weeks improved sprint speed +5%, free throw accuracy +9%, 3-point shooting +9.2%, reaction time −9.2%, and reported better physical/mental wellbeing; same results in football, tennis, and swimming — sleep extension is a legal performance enhancer")
            sciRow(stat: "Halson 2014", detail: "Sleep and recovery: during sleep, GH, testosterone, and IGF-1 peak; cortisol nadirs; muscle glycogen synthesis accelerates; 1 night of sleep deprivation reduces glycogen synthesis 25% even with adequate CHO intake; protein synthesis rate during sleep is 2× higher than during day — skipping sleep after training cancels much of the anabolic stimulus")
            sciRow(stat: "Simpson 2017 (BJSM)", detail: "Sleep deprivation and injury risk: athletes sleeping <8h/night have 1.7× higher injury risk (Milewski 2014); poor sleep increases cortisol and reduces testosterone:cortisol ratio; reaction time impairment at 21h wakefulness equals BAC 0.08% — Czeisler 2011: driving while sleepy is more dangerous per hour than driving drunk")
            sciRow(stat: "Fullagar 2015", detail: "Consequences of one poor night: 30% reduction in perceived exertion, 10–30% reduction in time-to-exhaustion, impaired decision-making in team sports, 20% reduction in maximal strength; aerobic capacity (VO₂max) is relatively preserved but submaximal effort perception increases dramatically — athletes unconsciously self-pace downward")
        }
    }

    private var deprivationScienceCard: some View {
        scienceCard(title: "Sleep Deprivation Effects", icon: "⚠️", color: .orange) {
            sciRow(stat: "Van Dongen 2003 (Sleep)", detail: "Chronic sleep restriction: 14 days of 6h/night produces cognitive impairment equivalent to 24h total sleep deprivation; subjects cannot detect their own impairment after 6+ days (Psychomotor Vigilance Task); 4h/night for 6 days = 48h total deprivation impairment; one recovery night insufficient — requires 2 full weeks to restore cognitive baseline")
            sciRow(stat: "Leproult 2010 (JAMA)", detail: "Sleep deprivation and testosterone: 1 week of 5h/night sleep reduces daytime testosterone by 10–15% in young healthy men — equivalent to 10–15 years of aging; testosterone is lowest after ≤5h sleep; each additional hour of sleep increases testosterone ~15%; well-established dose-response relationship in healthy males 18–55 years")
            sciRow(stat: "Spiegel 1999 (Lancet)", detail: "Sleep and metabolic health: 6 days of sleep restriction to 4h/night reduces insulin sensitivity 30%, glucose clearance 40%, and cortisol peak by 37%; leptin decreased 18%, ghrelin increased 28% — drives increased appetite and preference for high-calorie foods; Taheri 2004: each hour less sleep correlates with 3.7 lb higher body weight in adults")
            sciRow(stat: "Irwin 2015 (Sleep Med Reviews)", detail: "Sleep and immune function: 1 night of 4h sleep reduces NK cell activity 72%, increases IL-6 and TNF-α; Cohen 2009 (Archives Internal Medicine): sleeping <7h/night = 3× higher cold susceptibility vs ≥8h; vaccinations produce 50% lower antibody titers in sleep-deprived individuals; poor sleep accelerates telomere shortening — epigenetic aging marker")
        }
    }

    private var chronobiologyCard: some View {
        scienceCard(title: "Chronobiology & Circadian Rhythm", icon: "🕐", color: .purple) {
            sciRow(stat: "Czeisler 1999", detail: "Human circadian clock: master clock in suprachiasmatic nucleus (SCN) of hypothalamus runs on 24.18h intrinsic period; entrained to 24h by light (via retinohypothalamic tract) and social cues; blue light (480 nm) is the primary zeitgeber — suppresses melatonin via intrinsically photosensitive retinal ganglion cells (ipRGCs); light exposure within 2h of bedtime delays sleep onset by 90–120 min")
            sciRow(stat: "Zeitzer 2000", detail: "Circadian phase and performance: chronotype affects peak physical performance time — morning types peak at 09:00–12:00, evening types peak at 17:00–21:00; reaction time, muscle strength, and cardiovascular efficiency peak in early evening for most adults; athletes competing outside their peak phase perform 3–7% below their potential; jet lag = 1 day adaptation per time zone crossed")
            sciRow(stat: "Saper 2005 (Nature)", detail: "Two-process model of sleep regulation: Process C (circadian drive for wakefulness from SCN) and Process S (homeostatic sleep pressure from adenosine accumulation); adenosine builds from waking onwards, antagonized by caffeine (competitive adenosine receptor blocker); adenosine half-life ~5h — caffeine at 15:00 halves sleep drive by midnight; optimal caffeine cut-off: 14:00 for most adults")
            sciRow(stat: "Potter 2016", detail: "Social jet lag: difference between circadian phase on workdays vs weekends >1h affects 87% of adults; associated with 33% higher obesity risk, impaired insulin sensitivity, increased depression, and 1.4× increased cardiovascular disease risk; each hour of social jet lag increases obesity odds ratio by 33%; regular sleep/wake timing (including weekends) is more important than total sleep duration alone")
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
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            isLoading = false; return
        }

        guard (try? await store.requestAuthorization(toShare: [], read: [sleepType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let samples: [HKCategorySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKCategorySample]) ?? [])
            }
            store.execute(query)
        }

        // Count asleep samples (inBed, asleepCore, asleepDeep, asleepREM, asleepUnspecified)
        let asleepValues: Set<Int> = [
            HKCategoryValueSleepAnalysis.asleepCore.rawValue,
            HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
            HKCategoryValueSleepAnalysis.asleepREM.rawValue,
            HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue
        ]
        let asleepSamples = samples.filter { asleepValues.contains($0.value) }

        // Group by night (using startDate)
        var nightDurations: [String: Double] = [:]
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        for sample in asleepSamples {
            // Attribute to the night based on the adjusted date (subtract 12h to group post-midnight samples)
            let adjustedDate = sample.startDate.addingTimeInterval(-12 * 3600)
            let key = fmt.string(from: adjustedDate)
            nightDurations[key, default: 0] += sample.endDate.timeIntervalSince(sample.startDate) / 3600
        }

        let totalNights = max(nightDurations.count, 1)
        let totalHours = nightDurations.values.reduce(0, +)

        // Weekly aggregation (avg hours per night per week)
        var weeklyTotals = Array(repeating: 0.0, count: 8)
        var weeklyCounts = Array(repeating: 0, count: 8)
        let now = Date()
        for (key, hours) in nightDurations {
            if let date = fmt.date(from: key) {
                let weeksAgo = Int(now.timeIntervalSince(date) / (7 * 86400))
                if weeksAgo < 8 {
                    weeklyTotals[weeksAgo] += hours
                    weeklyCounts[weeksAgo] += 1
                }
            }
        }
        let weeklyAvg = (0..<8).map { i in weeklyCounts[i] > 0 ? weeklyTotals[i] / Double(weeklyCounts[i]) : 0 }

        await MainActor.run {
            self.avgSleepHours = totalHours / Double(totalNights)
            self.weeklySleepHours = weeklyAvg
            self.isLoading = false
        }
    }
}
