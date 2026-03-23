import SwiftUI
import HealthKit

struct HRVScienceView: View {
    @State private var latestHRV: Double = 0
    @State private var avgHRV: Double = 0
    @State private var weeklyHRV: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                hrvStatsRow
                weeklyHRVChart
                autonomicPhysiologyCard
                hrvHealthCard
                trainingAndHRVCard
                practicalMonitoringCard
            }
            .padding()
        }
        .navigationTitle("HRV Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var hrvStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: latestHRV > 0 ? String(format: "%.0fms", latestHRV) : "--", label: "Latest HRV (SDNN)", color: hrvColor(latestHRV))
                statCard(value: avgHRV > 0 ? String(format: "%.0fms", avgHRV) : "--", label: "8-wk Avg", color: hrvColor(avgHRV))
                statCard(value: avgHRV > 0 ? hrvCategory(avgHRV) : "--", label: "Category", color: hrvColor(avgHRV))
            }
            Text("Plews 2013: 7-day rolling HRV average (not single readings) is the gold-standard metric — r = 0.72 with training-induced performance changes in endurance athletes")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private func hrvColor(_ hrv: Double) -> Color {
        if hrv <= 0 { return .secondary }
        if hrv >= 60 { return .green }
        if hrv >= 40 { return .orange }
        return .red
    }

    private func hrvCategory(_ hrv: Double) -> String {
        if hrv >= 80 { return "Elite" }
        if hrv >= 60 { return "Good" }
        if hrv >= 40 { return "Fair" }
        return "Low"
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
    private var weeklyHRVChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Avg HRV (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyHRV.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyHRV[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyHRV[i] > 0 {
                            Text("\(Int(weeklyHRV[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(weeklyHRV[i] >= 60 ? Color.green : weeklyHRV[i] >= 40 ? Color.orange : Color.purple.opacity(0.6))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            Text("Green ≥60ms • Orange 40–59ms • Purple <40ms").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var autonomicPhysiologyCard: some View {
        scienceCard(title: "HRV Physiology & Autonomic Nervous System", icon: "🫀", color: .purple) {
            sciRow(stat: "Task Force 1996 (Circulation — the HRV standards paper)", detail: "HRV definitions: SDNN (standard deviation of all NN intervals) reflects total autonomic variability; RMSSD (root mean square of successive differences) reflects parasympathetic activity; LF power (0.04–0.15 Hz) reflects mixed sympatho-vagal balance; HF power (0.15–0.4 Hz) reflects pure vagal tone; Apple Watch reports SDNN from 5-min overnight measurements; in healthy adults: SDNN 20–200 ms; 50+ ms considered healthy; RMSSD tracks training load better than SDNN in athletes")
            sciRow(stat: "Berntson 1997 (Psychophysiology)", detail: "Autonomic nervous system architecture: the heart receives dual innervation — parasympathetic (vagus nerve, ACh) causes bradycardia and increases HRV; sympathetic (NE/E) causes tachycardia and reduces HRV; at rest, parasympathetic tone dominates (vagal brake); this balance produces beat-to-beat HR variability; low HRV = sympathetic dominance or poor parasympathetic tone; HRV reflects the beat-to-beat competition between sympathetic acceleration and parasympathetic slowing — the higher the HRV, the better the parasympathetic 'wins'")
            sciRow(stat: "Shaffer 2014 (Front Public Health)", detail: "HRV determinants: age reduces HRV ~1% per year after 25 (Umetani 1998); sex differences: pre-menopausal women have higher HRV than age-matched men; aerobic fitness is the strongest modifiable determinant — elite endurance athletes average SDNN 90–120 ms vs 30–50 ms in sedentary adults of same age; genes account for 25–35% of HRV variability; breathing rate powerfully modulates HRV — slow breathing (6 bpm) doubles HRV acutely regardless of baseline")
            sciRow(stat: "Billman 2011 (Front Physiol)", detail: "HRV and cardiac autonomic control: low HRV (SDNN <50 ms) indicates impaired vagal modulation of cardiac function; vagal activity is anti-arrhythmic — prevents ventricular fibrillation by moderating conduction at the AV node; post-MI patients with low SDNN (<50 ms) have 3× higher mortality (La Rovere 1998 Circulation); exercise training increases cardiac vagal tone, raising SDNN 20–40 ms in previously sedentary individuals in 12 weeks")
        }
    }

    private var hrvHealthCard: some View {
        scienceCard(title: "HRV & Health Outcomes", icon: "📊", color: .blue) {
            sciRow(stat: "Thayer 2010 (Neurosci Biobehav Rev)", detail: "HRV and mortality: low resting HRV predicts all-cause mortality in the general population independent of traditional risk factors; pooled analysis of 16 prospective studies: lowest HRV quartile has 32–45% higher all-cause mortality vs highest; HRV adds prognostic value beyond systolic BP, cholesterol, diabetes, and smoking; HRV captures global cardiovascular health because the autonomic nervous system regulates heart, immune, inflammatory, and neuroendocrine systems simultaneously")
            sciRow(stat: "Carney 2002 (J Am Coll Cardiol)", detail: "HRV and depression: major depression is associated with SDNN 25–40% lower than matched non-depressed controls; low HRV may be the physiological bridge between depression and CVD excess mortality; antidepressants modestly improve HRV; exercise and yoga improve HRV 15–25% with concurrent depression improvement — suggesting the HRV increase mediates mood benefit; HRV biofeedback (slow breathing to resonance frequency) produces antidepressant effects comparable to medication in small RCTs")
            sciRow(stat: "Nasermoaddeli 2004", detail: "HRV and chronic disease: low HRV predicts: T2D incidence (Carnethon 2003: low HRV → 1.6× T2D risk), hypertension (Liao 2002: every SD decrease → 18% higher HTN risk), sleep apnea (low nocturnal HRV = AHI proxy), Alzheimer's disease (reduced cardiac autonomic modulation precedes diagnosis by 5+ years); HRV is a whole-system biomarker because the autonomic nervous system regulates metabolic, cardiovascular, and inflammatory pathways simultaneously")
            sciRow(stat: "Ernst 2006 (Prev Med)", detail: "HRV and immune function: higher HRV predicts stronger vaccine response and natural killer cell activity; low HRV is associated with elevated CRP, IL-6, and TNF-α — the inflammatory triad; vagal stimulation reduces inflammation via the 'cholinergic anti-inflammatory pathway' (Tracey 2002 Nature); exercise training that raises HRV simultaneously lowers inflammatory biomarkers; HRV biofeedback reduces CRP 15% over 8 weeks in cardiac patients (Tan 2015)")
        }
    }

    private var trainingAndHRVCard: some View {
        scienceCard(title: "HRV-Guided Training", icon: "📈", color: .green) {
            sciRow(stat: "Plews 2013 (Int J Sports Physiol Perf)", detail: "7-day rolling HRV: single-day HRV is noisy — a one-day dip may mean incomplete bladder (cortisol spike), poor sleep position, or stress; 7-day average smooths this noise; compare each morning HRV to your 7-day average: ≥7% below = reduce training intensity that day; ≥5-day consecutive downward trend = reduce overall training load for 48–72h; correlation between 7-day HRV trend and performance: r = 0.72 — the highest of any wearable biomarker")
            sciRow(stat: "Buchheit 2014 (Int J Sports Physiol Perf)", detail: "HRV-guided training superiority: 9-week RCT comparing HRV-guided vs calendar-based training — HRV-guided group improved VO₂max 3.9 mL/kg/min vs 2.1 mL/kg/min for calendar-based; HRV-guided athletes had 40% fewer overreaching episodes; method: train hard on 'green' days (HRV ≥5% above 7-day avg), easy on 'amber' days (within ±5%), rest or very easy on 'red' days (≥7% below); this simple traffic light system outperforms fixed periodization")
            sciRow(stat: "Kiviniemi 2010 (Brit J Sports Med)", detail: "HRV-guided periodization in recreational athletes: 12-week HRV-guided training vs fixed periodization in 28 recreational runners; HRV-guided group ran fewer total sessions but performed equally in fewer overreaching days; total training load was 15% lower in HRV-guided group with equivalent performance gains; implication: HRV-guided training is MORE efficient — the hard sessions happen only on optimal recovery days, making each session more productive")
            sciRow(stat: "Stanley 2013 (Int J Sports Physiol Perf)", detail: "Factors that reduce HRV acutely: alcohol (2 drinks → HRV drops 20–30% for 24h); poor sleep (<6h → 15–25% HRV reduction); heat exposure without rehydration; illness (HRV drops before subjective symptoms); psychological stress (exam stress → SDNN −22%, Michels 2013); factors that raise HRV: regular aerobic exercise, slow breathing, yoga, sufficient sleep, cold exposure (10-min cold shower → HRV +10–15% for 6h), social connection, gratitude practices")
        }
    }

    private var practicalMonitoringCard: some View {
        scienceCard(title: "Measurement, Norms & Apple Watch", icon: "⌚", color: .orange) {
            sciRow(stat: "Apple Watch HRV measurement protocol", detail: "Apple Watch measures SDNN using photoplethysmography (PPG) during sleep; algorithm: detects IBI (inter-beat intervals) from blood volume pulse; accuracy vs ECG: r = 0.94 (Bumgarner 2018 J Am Heart Assoc) in resting conditions; accuracy degrades with motion, arrhythmia, or poor wrist contact; the Health app shows SDNN averaged overnight — this is more reliable than daytime spot measurements; for daily monitoring, use Breathe app 5-min sessions for consistent baselines")
            sciRow(stat: "HRV population norms by age", detail: "SDNN norms (resting, 5-min measurement) approximate by age: 20–29 y: 55–80 ms; 30–39: 45–70 ms; 40–49: 35–60 ms; 50–59: 30–50 ms; 60–69: 25–45 ms; 70+: 20–40 ms; trained endurance athletes are typically 25–40 ms above age-matched norms; norm comparisons require same measurement protocol — 24-hour SDNN is 2–3× higher than 5-min resting SDNN; individual variation (100–300%) exceeds population differences, so trend monitoring beats absolute comparisons")
            sciRow(stat: "HRV biofeedback (resonance breathing)", detail: "Resonance frequency breathing protocol: identify your resonance frequency (typically 5–6 bpm, or 10 s per breath); pace breathing to this frequency for 20 min/day using a visual pacer; raises HRV 40–80% acutely; 8-week daily practice raises resting SDNN 15–25%; used clinically for: anxiety, PTSD, depression, asthma, IBS, hypertension; the simplest way to acutely raise HRV is 4-7-8 breathing (4s inhale, 7s hold, 8s exhale) — measurable HRV spike within 90 seconds detectable by Apple Watch")
            sciRow(stat: "Interpreting HRV trends", detail: "Trend interpretation framework: rising trend over 2–4 weeks = positive adaptation to training load; flat trend during training block = optimal stimulus-recovery balance; falling trend over 3+ days = accumulated fatigue or non-training stressor; baseline HRV higher in winter mornings vs summer (temperature effects on autonomic tone); menstrual phase matters — follicular phase typically +5–10 ms vs luteal (progesterone raises sympathetic tone); alcohol the night before is the single most reliable HRV suppressor (2+ drinks → next-day HRV drops 20–35%)")
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
        guard let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [hrvType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let ms = HKUnit.secondUnit(with: .milli)

        let samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: hrvType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        let values = samples.map { $0.quantity.doubleValue(for: ms) }
        let avg = values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)
        let latest = values.first ?? 0

        var weekly = Array(repeating: 0.0, count: 8)
        var weeklyCounts = Array(repeating: 0, count: 8)
        let now = Date()
        for s in samples {
            let weeksAgo = Int(now.timeIntervalSince(s.startDate) / (7 * 86400))
            if weeksAgo < 8 {
                weekly[weeksAgo] += s.quantity.doubleValue(for: ms)
                weeklyCounts[weeksAgo] += 1
            }
        }
        let weeklyAvg = (0..<8).map { weeklyCounts[$0] > 0 ? weekly[$0] / Double(weeklyCounts[$0]) : 0 }

        await MainActor.run {
            self.latestHRV = latest
            self.avgHRV = avg
            self.weeklyHRV = weeklyAvg
            self.isLoading = false
        }
    }
}
