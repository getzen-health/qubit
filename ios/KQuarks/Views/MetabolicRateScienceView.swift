import SwiftUI
import HealthKit

struct MetabolicRateScienceView: View {
    @State private var avgRestingKcal: Double = 0
    @State private var avgActiveKcal: Double = 0
    @State private var weeklyResting: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                metabolicStatsRow
                weeklyRestingChart
                rmrMeasurementCard
                metabolicAdaptationCard
                tdeeComponentsCard
                bodyCompositionCard
            }
            .padding()
        }
        .navigationTitle("Metabolic Rate Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var metabolicStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgRestingKcal > 0 ? "\(Int(avgRestingKcal))" : "--", label: "Avg RMR kcal/day", color: .orange)
                statCard(value: avgActiveKcal > 0 ? "\(Int(avgActiveKcal))" : "--", label: "Avg Active kcal/day", color: .red)
                statCard(value: (avgRestingKcal + avgActiveKcal) > 0 ? "\(Int(avgRestingKcal + avgActiveKcal))" : "--", label: "Est. TDEE", color: .purple)
            }
            HStack {
                Text("RMR = basal energy (Apple Watch) • TDEE = RMR + active energy + TEF (10%)")
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
    private var weeklyRestingChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Resting Energy (8 Weeks, kcal)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyResting.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyResting[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyResting[i] > 0 {
                            Text("\(Int(weeklyResting[i]))").font(.system(size: 7)).foregroundColor(.secondary)
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
    private var rmrMeasurementCard: some View {
        scienceCard(title: "RMR Measurement & Prediction", icon: "🔥", color: .orange) {
            sciRow(stat: "Mifflin 1990 (Mifflin-St Jeor)", detail: "Most accurate predictive equation: RMR (kcal/day) = 10×weight(kg) + 6.25×height(cm) − 5×age + 5 (men) or −161 (women); validated against indirect calorimetry — mean error ±10% vs ±14% for Harris-Benedict (1919); gold standard for clinical RMR estimation in the absence of metabolic cart")
            sciRow(stat: "Schofield 1985", detail: "Doubly Labeled Water (DLW) method: isotope-labeled water (²H₂O + H₂¹⁸O) measures CO₂ production over 2 weeks — considered the gold standard for free-living energy expenditure; RMR accounts for 60–75% of total daily energy expenditure (TDEE) in sedentary individuals; athletes 45–55% due to higher activity")
            sciRow(stat: "Ravussin 1988", detail: "Metabolic rate determinants: fat-free mass (FFM) explains 80% of inter-individual RMR variance; remaining 20% from genetic factors (familial aggregation r = 0.5), thyroid hormones, sympathetic nervous system activity, and sex hormones; RMR decreases ~2% per decade after age 30 primarily due to FFM loss, not aging per se")
            sciRow(stat: "Johnstone 2005", detail: "Apple Watch RMR estimation: uses heart rate, motion, age, height and weight to estimate resting calories via energy expenditure algorithms; accuracy within 8–15% of DLW in free-living conditions; underestimates in sedentary periods, overestimates in high-motion periods — daily averaging reduces error to ~5%")
        }
    }

    private var metabolicAdaptationCard: some View {
        scienceCard(title: "Metabolic Adaptation & Suppression", icon: "📉", color: .red) {
            sciRow(stat: "Rosenbaum 2010", detail: "Adaptive thermogenesis: during sustained caloric restriction, RMR decreases 10–15% beyond what is predicted by FFM loss alone; mechanism: reduced thyroid hormone (T3), sympathetic nervous system activity, and skeletal muscle efficiency; this 'metabolic adaptation' persists ≥6 years after weight loss — explains the 80% weight regain rate after dieting")
            sciRow(stat: "Leibel 1995 (NEJM)", detail: "The 7,700 kcal/kg fat rule: 1 kg body fat ≈ 7,700 kcal; however, as weight is lost, TDEE decreases proportionally — a 10% weight loss decreases TDEE by 20–25% (metabolic adaptation doubles the expected deficit); continuous caloric adjustment required; static calorie targets fail to account for this diminishing return")
            sciRow(stat: "Trexler 2014", detail: "Reverse dieting: gradual caloric increase post-diet (50–100 kcal/week) gradually restores RMR without significant fat regain; allows re-sensitization of leptin and ghrelin signaling; elite physique athletes use refeeds (2–4 day isocaloric high-CHO periods) to temporarily restore T3, leptin, and RMR during prolonged caloric restriction")
            sciRow(stat: "Pontzer 2021 (Science)", detail: "Physical activity and TDEE: total energy expenditure is constrained, not additive; highly active people (≥16,000 steps/day) spend 200–300 kcal/day less at rest than sedentary counterparts via metabolic compensation; exercise still increases TDEE net 150–400 kcal/day — most effective for energy balance when combined with diet rather than alone")
        }
    }

    private var tdeeComponentsCard: some View {
        scienceCard(title: "TDEE Components & Activity Factor", icon: "📊", color: .blue) {
            sciRow(stat: "Ravussin 1988", detail: "Total daily energy expenditure breakdown: BMR/RMR 60–75%; thermic effect of food (TEF) 8–10% of caloric intake (protein 20–30%, carbs 5–10%, fat 0–3%); exercise activity thermogenesis (EAT) 5–20%; non-exercise activity thermogenesis (NEAT) 6–50% — NEAT is the most variable and trainable component")
            sciRow(stat: "Levine 2004 (Science)", detail: "NEAT variation: lean vs. obese individuals differ by 2,000 kcal/day in NEAT — driven by unconscious postural changes, fidgeting, and spontaneous movement; NEAT is suppressed 300–500 kcal/day after overfeeding and increases during caloric restriction; explains why 'metabolic' individuals maintain leanness effortlessly")
            sciRow(stat: "Ainsworth 2011 (Compendium)", detail: "Activity multipliers (Harris 1919 / Mifflin 1990): sedentary ×1.2, lightly active ×1.375, moderately active ×1.55, very active ×1.725, extra active ×1.9; however, self-reported activity level overestimates TDEE by 20–30%; DLW studies show most 'very active' individuals are actually 'moderately active' by objective measure")
            sciRow(stat: "Church 2011", detail: "Compensation effect: adding structured exercise without dietary change produces only 30–40% of expected weight loss; compensatory eating (increased hunger) accounts for 40–60% of the potential deficit; psychological reward eating ('I exercised so I deserve...') accounts for remaining; combining diet + exercise overcomes compensation better than exercise alone")
        }
    }

    private var bodyCompositionCard: some View {
        scienceCard(title: "Body Composition & Metabolic Health", icon: "🧬", color: .green) {
            sciRow(stat: "Gallagher 2000", detail: "BMI vs body fat: BMI fails to distinguish fat mass from lean mass — a muscled athlete at BMI 27 may be <15% body fat while a sedentary person at BMI 23 may be 30%; fat-free mass index (FFMI = FFM/height²) is superior for lean mass assessment; FFMI >25 in men rarely achieved naturally (Hall 2019)")
            sciRow(stat: "Despres 2006", detail: "Visceral fat vs subcutaneous fat: visceral adipose tissue (VAT) is metabolically active — secretes IL-6, TNF-α, resistin; VAT >130 cm² (by CT scan) associated with insulin resistance, dyslipidemia, and CVD independently of BMI; waist circumference >88cm (women) or >102cm (men) predicts MetS; abdominal obesity is the key cardiovascular risk driver")
            sciRow(stat: "Ivy 2004", detail: "Muscle insulin sensitivity: each kg of muscle mass increases glucose disposal capacity ~10 mg/min; type I (slow-twitch) fibers have 2× the glucose transporter density (GLUT4) vs type II; resistance training increases GLUT4 expression 50% in 6 weeks independently of weight loss — most potent non-pharmacological intervention for insulin resistance")
            sciRow(stat: "Jensen 2006", detail: "Fat cell biology: adipocyte hypertrophy (existing cells enlarging) precedes hyperplasia (new cell formation); once created, fat cells never disappear — only shrink; post-weight-loss adipocytes are smaller but more metabolically active, increasing appetite hormones and decreasing satiety hormones; explains the biological drive to regain weight and importance of maintaining muscle during loss")
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
        let restingType = HKObjectType.quantityType(forIdentifier: .basalEnergyBurned)!
        let activeType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!

        guard (try? await store.requestAuthorization(toShare: [], read: [restingType, activeType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let kcalUnit = HKUnit.kilocalorie()

        let restingSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: restingType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let activeSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: activeType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let totalResting = restingSamples.reduce(0) { $0 + $1.quantity.doubleValue(for: kcalUnit) }
        let totalActive = activeSamples.reduce(0) { $0 + $1.quantity.doubleValue(for: kcalUnit) }

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for sample in restingSamples {
            let weeksAgo = Int(now.timeIntervalSince(sample.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += sample.quantity.doubleValue(for: kcalUnit) }
        }

        await MainActor.run {
            self.avgRestingKcal = totalResting / 56
            self.avgActiveKcal = totalActive / 56
            self.weeklyResting = weekly
            self.isLoading = false
        }
    }
}
