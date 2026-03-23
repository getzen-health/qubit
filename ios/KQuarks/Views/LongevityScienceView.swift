import SwiftUI
import HealthKit

struct LongevityScienceView: View {
    @State private var avgVO2Max: Double = 0
    @State private var avgWalkingSpeed: Double = 0
    @State private var avgRHR: Double = 0
    @State private var avgHRV: Double = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                longevityStatsRow
                exerciseAndMortalityCard
                biomarkersCard
                cellularAgingCard
                practicalLongevityCard
            }
            .padding()
        }
        .navigationTitle("Longevity Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var longevityStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgVO2Max > 0 ? String(format: "%.0f", avgVO2Max) : "--", label: "VO₂ Max (mL/kg/min)", color: vo2MaxColor)
                statCard(value: avgRHR > 0 ? "\(Int(avgRHR))" : "--", label: "Resting HR", color: avgRHR <= 60 ? .green : avgRHR <= 75 ? .orange : .red)
                statCard(value: avgHRV > 0 ? String(format: "%.0f", avgHRV) + "ms" : "--", label: "HRV (SDNN)", color: avgHRV >= 50 ? .green : avgHRV >= 30 ? .orange : .red)
            }
            HStack {
                Text("Karvonen 2018: VO₂ max is the single strongest predictor of longevity — each 1 MET increase reduces mortality 13%")
                    .font(.caption2).foregroundColor(.secondary)
            }
        }
    }

    private var vo2MaxColor: Color {
        if avgVO2Max >= 50 { return .green }
        if avgVO2Max >= 40 { return .orange }
        if avgVO2Max > 0 { return .red }
        return .secondary
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
    private var exerciseAndMortalityCard: some View {
        scienceCard(title: "Exercise & Mortality Reduction", icon: "🏃", color: .green) {
            sciRow(stat: "Wen 2011 (Lancet)", detail: "Minimum effective dose: 15 min/day moderate exercise (75 min/week) reduces all-cause mortality 14% and life expectancy +3 years vs inactive; dose-response continues to ~100 min/day; beyond 150 min/day, gains plateau but no mortality increase even at very high volumes (Schnohr 2015: extreme exercisers still outlive sedentary individuals)")
            sciRow(stat: "Kodama 2009 (JAMA)", detail: "Cardiorespiratory fitness (CRF) and mortality: each 1 MET increase in CRF = 13% reduction in all-cause mortality, 15% reduction in CVD mortality; men in top CRF quintile vs bottom: 70% lower mortality risk over 8.4 years; CRF is a stronger predictor than BMI, blood pressure, or cholesterol in prospective studies")
            sciRow(stat: "Stamatakis 2018", detail: "Strength training and longevity: 2 strength sessions/week independently reduces all-cause mortality 23% and cancer mortality 31%; effect is additive with aerobic exercise — combined: 29% lower all-cause mortality; survival benefit appears even with just 1h/week of resistance training; grip strength is the most predictive single measure of all-cause mortality in older adults")
            sciRow(stat: "Mandsager 2018 (JAMA Network Open)", detail: "Fitness as strongest longevity predictor: low CRF = >500% higher all-cause mortality vs elite fitness; low CRF is worse than smoking, diabetes, or hypertension for mortality risk; going from 'low' to 'below average' fitness reduces mortality by more than any known pharmacological intervention — exercise is the most potent longevity drug available")
        }
    }

    private var biomarkersCard: some View {
        scienceCard(title: "Longevity Biomarkers", icon: "🧪", color: .blue) {
            sciRow(stat: "Levine 2018 (Aging)", detail: "PhenoAge: multi-biomarker biological age using albumin, creatinine, glucose, CRP, lymphocyte%, mean cell volume, RDW, alkaline phosphatase, and WBC; PhenoAge predicts 10-year mortality better than chronological age; exercise reduces PhenoAge 1–5 years; sedentary lifestyle ages PhenoAge 8–10 years beyond chronological age")
            sciRow(stat: "Studenski 2011 (JAMA)", detail: "Gait speed as vital sign: walking speed predicts survival as accurately as age, sex, comorbidities, and hospitalizations combined; each 0.1 m/s faster = 12% lower 10-year mortality risk; clinical threshold 0.8 m/s; grip strength <26 kg (men) or <16 kg (women) predicts disability, hospitalization, and mortality independently in 50+ populations worldwide")
            sciRow(stat: "Seals 2016", detail: "Heart rate variability and longevity: higher HRV correlates with greater parasympathetic tone, reduced inflammation, and better metabolic health; HRV decreases ~3% per decade with aging; endurance-trained master athletes maintain HRV 30–50% higher than sedentary age-matched peers; vagal tone (high-frequency HRV) is independently associated with 15–20% lower cardiovascular mortality")
            sciRow(stat: "Blair 2009", detail: "CRF reference values: VO₂max age norms by sex — men 40–49: low <34, below avg 34–39.9, avg 40–43.9, good 44–52.4, elite ≥52.5 mL/kg/min; elite CRF (>2 SD above mean for age): 80% lower CVD mortality; 10 mL/kg/min higher VO₂max = 45% reduction in CVD events; preserving VO₂max with age via training is one of the highest-value health investments")
        }
    }

    private var cellularAgingCard: some View {
        scienceCard(title: "Cellular Aging & Exercise", icon: "🔬", color: .purple) {
            sciRow(stat: "Werner 2019", detail: "Telomeres and exercise: endurance athletes have telomeres 5–14 years longer than sedentary age-matched controls; Werner 2009: 6 months of endurance training increases telomerase activity 2-fold and reduces telomere shortening; mechanism: exercise reduces oxidative stress (main telomere disruptor) by upregulating antioxidant enzymes (SOD, catalase, GPx); Cherkas 2008: leisure-time exercisers have biologically younger telomeres 9 years vs sedentary")
            sciRow(stat: "Rowe 2016", detail: "Mitochondrial function and aging: mitochondrial dysfunction is the hallmark of aging — reduced ATP production, increased reactive oxygen species, impaired calcium handling; exercise (especially HIIT and zone 2 training) is the most potent stimulus for mitochondrial biogenesis via PGC-1α; Lanza 2012: aerobically trained 65-year-olds have mitochondrial function equivalent to untrained 25-year-olds")
            sciRow(stat: "Fontana 2010", detail: "Caloric restriction and longevity: 30% CR extends lifespan 30–40% in rodents via SIRT1/FOXO/mTOR pathways; in humans, CALERIE trial: 2-year 25% CR improves all aging biomarkers; intermittent fasting (16:8, 5:2) produces similar metabolic benefits with better adherence; fasting-mimicking diet (Valter Longo) 5 days/month: reduces biological age 2.5 years over 3 cycles")
            sciRow(stat: "Kirkland 2017 (Science)", detail: "Senescence and senolytics: senescent cells (permanently growth-arrested) accumulate with age and drive chronic inflammation (inflammaging) via SASP (senescence-associated secretory phenotype); exercise reduces senescent cell burden 40–70% in mice; emerging senolytics (dasatinib+quercetin, fisetin) clear senescent cells in clinical trials; 30 min/day exercise is the most established anti-senescence intervention in humans")
        }
    }

    private var practicalLongevityCard: some View {
        scienceCard(title: "Practical Longevity Protocols", icon: "📋", color: .orange) {
            sciRow(stat: "Attia 2023 (Outlive)", detail: "Exercise for the centenarian decathlon: train backwards from desired performance at 90+; target VO₂max at 75 = 25th percentile for 30-year-olds (>37.5 mL/kg/min); requires adding 1–2% VO₂max annually through age 50+; zone 2 training (3–4h/week) + VO₂max intervals (1–2×/week) + strength (3×/week) + mobility as the longevity exercise stack")
            sciRow(stat: "Laukkanen 2018 (JAMA Internal Med)", detail: "Sauna and cardiovascular health (Kuopio study, n=2,315): 4–7 sauna sessions/week reduces CVD mortality 50%, all-cause mortality 40%, Alzheimer's risk 65%; mechanism: heat shock proteins, improved endothelial function, plasma volume expansion; 19–27 min sessions at 80°C; effect size comparable to vigorous exercise — synergistic with exercise, not a replacement")
            sciRow(stat: "Nguyen 2016 (Preventive Medicine)", detail: "Zone 2 training and longevity: training at the crossover point maximizing fat oxidation while maintaining lactate clearance (typically 60–70% HRmax); 3+ hours/week of zone 2 reduces type 2 diabetes risk 58%, reduces metabolic syndrome 32%, and is the strongest predictor of 10-year survival in the HUNT study (age-adjusted, n=33,000)")
            sciRow(stat: "Lee 2022 (British Journal of Sports Medicine)", detail: "Comprehensive exercise dose: 150–300 min/week moderate or 75–150 min/week vigorous activity reduces all-cause mortality 35%; each 25 min added to vigorous exercise above guidelines reduces mortality additional 15%; concurrent aerobic + strength provides additive 50% mortality reduction; muscle mass is independently protective — each kg of appendicular lean mass reduces mortality risk ~5% at age 65+")
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
        guard let vo2Type = HKObjectType.quantityType(forIdentifier: .vo2Max),
              let rhrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate),
              let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
              let speedType = HKObjectType.quantityType(forIdentifier: .walkingSpeed) else {
            isLoading = false; return
        }

        guard (try? await store.requestAuthorization(toShare: [], read: [vo2Type, rhrType, hrvType, speedType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        async let vo2 = fetchAvg(type: vo2Type, predicate: predicate, unit: HKUnit(from: "mL/kg/min"))
        async let rhr = fetchAvg(type: rhrType, predicate: predicate, unit: .count().unitDivided(by: .minute()))
        async let hrv = fetchAvg(type: hrvType, predicate: predicate, unit: .secondUnit(with: .milli))
        async let speed = fetchAvg(type: speedType, predicate: predicate, unit: HKUnit.meter().unitDivided(by: .second()))

        let (v, r, h, s) = await (vo2, rhr, hrv, speed)

        await MainActor.run {
            self.avgVO2Max = v
            self.avgRHR = r
            self.avgHRV = h
            self.avgWalkingSpeed = s
            self.isLoading = false
        }
    }

    private func fetchAvg(type: HKQuantityType, predicate: NSPredicate, unit: HKUnit) async -> Double {
        await withCheckedContinuation { continuation in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 30, sortDescriptors: [sort]) { _, samples, _ in
                let values = (samples as? [HKQuantitySample])?.map { $0.quantity.doubleValue(for: unit) } ?? []
                continuation.resume(returning: values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count))
            }
            store.execute(query)
        }
    }
}
