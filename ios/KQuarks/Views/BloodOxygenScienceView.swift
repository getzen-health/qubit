import SwiftUI
import HealthKit

struct BloodOxygenScienceView: View {
    @State private var latestSpO2: Double = 0
    @State private var avgSpO2: Double = 0
    @State private var minSpO2: Double = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                spO2StatsRow
                oxygenPhysiologyCard
                hypoxiaCard
                altitudeTrainingCard
                sleepApneaCard
            }
            .padding()
        }
        .navigationTitle("Blood Oxygen Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var spO2StatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: latestSpO2 > 0 ? String(format: "%.1f%%", latestSpO2) : "--", label: "Latest SpO₂", color: spO2Color(latestSpO2))
                statCard(value: avgSpO2 > 0 ? String(format: "%.1f%%", avgSpO2) : "--", label: "30-Day Avg", color: spO2Color(avgSpO2))
                statCard(value: minSpO2 > 0 ? String(format: "%.1f%%", minSpO2) : "--", label: "30-Day Min", color: spO2Color(minSpO2))
            }
            Text("Normal SpO₂: 95–100%. Below 90% = hypoxemia requiring medical evaluation. Apple Watch detects via reflective photoplethysmography at 4 wavelengths (red, infrared, green, blue)")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private func spO2Color(_ spo2: Double) -> Color {
        if spo2 <= 0 { return .secondary }
        if spo2 >= 95 { return .green }
        if spo2 >= 90 { return .orange }
        return .red
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
    private var oxygenPhysiologyCard: some View {
        scienceCard(title: "Oxygen Transport Physiology", icon: "🫁", color: .blue) {
            sciRow(stat: "West 2012 (Respiratory Physiology)", detail: "SpO₂ physiology: pulse oximetry measures the fraction of hemoglobin bound to O₂ (oxygenated vs deoxygenated); normal arterial SpO₂: 95–100%; at sea level (PaO₂ ~100 mmHg), hemoglobin is ~98% saturated; the oxyhemoglobin dissociation curve is sigmoid: SpO₂ stays above 90% until PaO₂ drops below ~60 mmHg; this buffer zone means small SpO₂ drops reflect substantial O₂ delivery compromise; SpO₂ of 88% = PaO₂ ~55 mmHg = significant hypoxemia")
            sciRow(stat: "Jubran 2004 (Crit Care Med)", detail: "Pulse oximetry accuracy: Apple Watch uses reflective PPG at multiple wavelengths; laboratory-grade devices use Beer-Lambert law; consumer-grade accuracy: ±2–3% for SpO₂ >90%; less accurate in motion, dark skin tones, cold fingers, nail polish; validated accuracy decreases below 80% SpO₂; Apple Watch Series 6+ specifically validated by FDA for SpO₂ measurement; individual readings less important than trends — significant change from personal baseline matters more than absolute value")
            sciRow(stat: "Severinghaus 1992 (Anesthesiology)", detail: "SpO₂ and oxygen content: O₂ content (CaO₂) = (Hgb × 1.34 × SpO₂/100) + (PaO₂ × 0.003); in anemia, SpO₂ can be normal (hemoglobin fully saturated) while total O₂ content is low; this is why SpO₂ alone doesn't detect anemia; exercise increases cardiac output to compensate for tissue O₂ demand; trained athletes maintain SpO₂ during submaximal exercise; some elite athletes experience exercise-induced arterial hypoxemia (EIAH) at VO₂max — SpO₂ drops to 92–95%")
            sciRow(stat: "Neff 2018 (J Appl Physiol)", detail: "SpO₂ during sleep: normal nocturnal SpO₂ dips slightly with body position and deeper sleep stages; 4% nocturnal desaturation index (ODI4 — number of times SpO₂ drops ≥4% per hour) is the primary diagnostic metric for sleep apnea severity; ODI4 <5 = normal; 5–15 = mild; 15–30 = moderate; >30 = severe; Apple Watch's Background Readings mode monitors SpO₂ during sleep to detect potential sleep apnea patterns (FDA-cleared in watchOS 11)")
        }
    }

    private var hypoxiaCard: some View {
        scienceCard(title: "Hypoxia: Causes & Effects", icon: "⚠️", color: .orange) {
            sciRow(stat: "Bhatt 2019 (Chest)", detail: "SpO₂ thresholds and clinical significance: 95–100% = normal; 91–94% = mild hypoxemia — supplemental O₂ may be needed during exertion; 86–90% = moderate — supplemental O₂ at rest; <85% = severe hypoxemia — medical emergency; brief transient dips during sleep (2–3%) are normal; sustained SpO₂ <88% during sleep = sleep-disordered breathing; sustained SpO₂ <90% at rest at sea level = respiratory or cardiac pathology requiring evaluation; COVID-19 'happy hypoxemia' — SpO₂ as low as 70% with minimal breathlessness was a distinctive feature")
            sciRow(stat: "Dempsey 1982 (J Appl Physiol)", detail: "Exercise-induced arterial hypoxemia (EIAH): ~50% of elite athletes with VO₂max >60 mL/kg/min experience SpO₂ drops to 92–95% at maximal exercise; mechanism: insufficient pulmonary transit time at high cardiac outputs (blood moves through capillaries faster than O₂ can diffuse); NOT trainable — pulmonary diffusing capacity is fixed; supplemental O₂ at 60% FiO₂ improves maximal performance 5–8% in athletes with EIAH; untrained individuals do NOT typically experience EIAH")
            sciRow(stat: "Tsai 2010", detail: "Causes of low SpO₂: altitude (every 1,000 m reduces SpO₂ ~1%); sleep apnea; COPD; asthma; heart failure; pulmonary embolism; pneumonia; anemia (low hgb content, not saturation); smoking (carboxyhemoglobin falsely elevates pulse ox reading by 1–5%); false causes: probe position, motion, vasoconstriction, nail polish (especially dark colors), skin pigmentation (darker skin tones show 3× more pulse ox errors in critical ranges); Apple Watch now includes melanin-aware algorithms")
            sciRow(stat: "Vyas 2021 (N Engl J Med)", detail: "Racial bias in pulse oximetry: landmark study showing pulse oximeters overestimated SpO₂ by ~3% more in Black patients than white patients; this hidden hypoxemia led to delayed treatment and higher rates of adverse outcomes; mechanism: darker skin melanin absorbs infrared light differently, reducing signal quality; Apple Watch and major manufacturers now use multi-wavelength sensors (including green light) and machine learning to improve accuracy across all skin tones")
        }
    }

    private var altitudeTrainingCard: some View {
        scienceCard(title: "Altitude Training & Acclimatization", icon: "⛰️", color: .green) {
            sciRow(stat: "Levine & Stray-Gundersen 1997 (J Appl Physiol)", detail: "Live High, Train Low (LHTI) protocol: the gold standard altitude training strategy; live at 2,000–3,000 m altitude (SpO₂ ~90–94%) for 4+ weeks; train at lower altitude for quality workouts; stimulates EPO production (↑20–30%), increases red blood cell mass (↑5–10%), raises hemoglobin mass; net effect: sea-level VO₂max improves 1–3 mL/kg/min; performance benefit persists 2–3 weeks after return to sea level; SpO₂ monitoring guides the altitude prescription — target SpO₂ 90–93% during overnight altitude exposure")
            sciRow(stat: "Chapman 1998 (J Appl Physiol)", detail: "Altitude acclimatization timeline: SpO₂ recovers from initial altitude drop via: (1) immediate hyperventilation (within minutes); (2) renal bicarbonate excretion restoring pH (days 1–3); (3) EPO surge → reticulocytosis → new red blood cells (days 4–14); (4) full hematological adaptation (3–4 weeks); initial SpO₂ at 3,000 m: ~85–88%; after 2 weeks: ~91–93%; the AMS (acute mountain sickness) risk window is days 1–3 — Lake Louise Score guides evaluation: headache + any 2 of fatigue, dizziness, GI symptoms, insomnia = AMS")
            sciRow(stat: "Weil 1986 (Ann Rev Med)", detail: "Ventilatory acclimatization: the hypoxic ventilatory response (HVR) is genetically variable — low HVR responders are more prone to altitude sickness and less responsive to altitude training; SpO₂ at 3,000 m after acclimatization predicts EPO response magnitude; SpO₂ <90% during sleep at altitude = inadequate acclimatization; use of SpO₂ monitoring at altitude: significant dip during sleep ≥4% below waking value = consider descending 300–500 m; never continue ascending if resting SpO₂ <80%")
            sciRow(stat: "Gore 2013 (J Appl Physiol)", detail: "Altitude alternatives — hypoxic tents: simulated altitude via normobaric hypoxia (IHT) tents; 8–10h/night at FiO₂ 15.4% (≈3,000 m equivalent); SpO₂ during tent: 88–93%; IHT produces smaller EPO response than terrestrial altitude (≈60% of real altitude effect); not all studies show performance benefit; combining IHT sleeping with sea-level training provides logistical convenience; detection in sport: IHT raises reticulocyte% and hemoglobin — now monitored by World Athletics Athlete Biological Passport")
        }
    }

    private var sleepApneaCard: some View {
        scienceCard(title: "SpO₂ & Sleep Apnea Detection", icon: "😴", color: .purple) {
            sciRow(stat: "Young 1993 (NEJM — Sleep Heart Health Study)", detail: "Sleep apnea prevalence: 24% of middle-aged men and 9% of women have AHI ≥5 events/hour (AASM definition); 4% of men and 2% of women have symptomatic OSA; prevalence doubles every decade after 35; risk factors: BMI >30 (2–4× risk), male sex (2×), neck circumference >43 cm men (40 cm women), retrognathia, alcohol, sedatives; 80% of moderate-to-severe OSA is undiagnosed — nocturnal SpO₂ monitoring is the key screening tool")
            sciRow(stat: "Punjabi 2009 (Proc Am Thorac Soc)", detail: "OSA consequences: untreated OSA raises all-cause mortality risk 3× (Young 2008); CVD risk doubles independent of obesity; T2D risk increases 2–3× (intermittent hypoxia causes insulin resistance); depression risk doubles; untreated moderate-severe OSA reduces life expectancy 5–10 years; nightly SpO₂ <90% for >5 min = strongly predictive of moderate-to-severe OSA; CPAP treatment normalizes SpO₂, reduces CVD events 20–30% (McEvoy 2016 NEJM — SAVE trial)")
            sciRow(stat: "Mencar 2018 (Artif Intell Med)", detail: "Wearable SpO₂ for OSA screening: Apple Watch SpO₂ + machine learning algorithm: sensitivity 87%, specificity 73% for moderate-to-severe OSA detection (AHI ≥15) in validation studies; Apple's Sleep Apnea Notification feature (watchOS 11) uses accelerometer breathing pattern + SpO₂ trend analysis; FDA cleared as Class II medical device for OSA screening; persistent high SpO₂ variability during sleep (coefficient of variation >2%) = screening flag; confirmatory testing requires lab polysomnography or home sleep test")
            sciRow(stat: "Weaver 2007 (Proc Am Thorac Soc)", detail: "CPAP efficacy and adherence: CPAP therapy normalizes SpO₂ to >95% throughout sleep; reduces AHI from 35+ events/h to <5; ESS (Epworth Sleepiness Scale) improves 4–6 points; blood pressure reduces 2–3 mmHg (modest but consistent); cognitive performance improves significantly; adherence is the limiting factor — average CPAP use is 4.5h/night vs recommended ≥7h; behavioral interventions improve adherence 30–40%; oral appliance therapy is alternative for mild-moderate OSA with 60–70% efficacy of CPAP")
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
        guard let spo2Type = HKObjectType.quantityType(forIdentifier: .oxygenSaturation) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [spo2Type])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: endDate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let pct = HKUnit.percent()

        let samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: spo2Type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        let values = samples.map { $0.quantity.doubleValue(for: pct) * 100 }
        let avg = values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)
        let latest = values.first ?? 0
        let minVal = values.min() ?? 0

        await MainActor.run {
            self.latestSpO2 = latest
            self.avgSpO2 = avg
            self.minSpO2 = minVal
            self.isLoading = false
        }
    }
}
