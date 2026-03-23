import SwiftUI
import HealthKit

struct NutritionScienceView: View {
    @State private var avgDailyKcal: Double = 0
    @State private var avgProtein: Double = 0
    @State private var avgCarbs: Double = 0
    @State private var avgFat: Double = 0
    @State private var weeklyKcal: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                nutritionStatsRow
                weeklyKcalChart
                proteinSynthesisCard
                carbohydrateScienceCard
                fatAdaptationCard
                nutrientTimingCard
            }
            .padding()
        }
        .navigationTitle("Nutrition Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var nutritionStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgDailyKcal > 0 ? "\(Int(avgDailyKcal))" : "--", label: "Avg kcal/day", color: .orange)
                statCard(value: avgProtein > 0 ? "\(Int(avgProtein))g" : "--", label: "Avg Protein", color: .red)
                statCard(value: avgCarbs > 0 ? "\(Int(avgCarbs))g" : "--", label: "Avg Carbs", color: .blue)
            }
            HStack {
                Text("Dietary data from Apple Health — logged meals & nutrition tracking")
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
    private var weeklyKcalChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Dietary Energy (8 Weeks, kcal)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyKcal.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyKcal[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyKcal[i] > 0 {
                            Text("\(Int(weeklyKcal[i]))").font(.system(size: 7)).foregroundColor(.secondary)
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
    private var proteinSynthesisCard: some View {
        scienceCard(title: "Protein Synthesis & Muscle Building", icon: "🥩", color: .red) {
            sciRow(stat: "Moore 2009", detail: "Muscle protein synthesis (MPS) dose-response: 20g high-quality protein maximally stimulates MPS in young adults; leucine is the key anabolic trigger — minimum 2–3 g leucine per serving activates mTORC1; additional protein above ~0.4 g/kg per meal is oxidized, not incorporated into muscle")
            sciRow(stat: "Stokes 2018", detail: "Protein distribution matters: spreading 1.6 g/kg/day across 4 meals (0.4 g/kg each) produces 25% more MPS than bolus dosing; muscle is a 'pulse-sensitive' system — MPS returns to baseline within 3–4h even if amino acids remain elevated (muscle-full effect)")
            sciRow(stat: "Morton 2018 (meta-analysis)", detail: "Optimal daily protein for hypertrophy: 1.62 g/kg/day (95% CI: 1.03–2.20) from meta-analysis of 49 studies; beyond 2.2 g/kg/day, no additional hypertrophy; resistance-trained individuals need more (≥1.8 g/kg) than untrained due to higher contractile protein turnover rates")
            sciRow(stat: "Churchward-Venne 2012", detail: "Protein quality hierarchy: leucine content > PDCAAS > biological value; whey > casein > soy for acute MPS; casein superior for overnight recovery (slow-digesting); plant proteins require ~20% more total protein to match leucine delivery of animal sources — combine rice + pea to approach whey BCAA profile")
        }
    }

    private var carbohydrateScienceCard: some View {
        scienceCard(title: "Carbohydrate Metabolism & Performance", icon: "🍞", color: .blue) {
            sciRow(stat: "Bergström 1967", detail: "Muscle glycogen and exercise performance: glycogen stores 300–700 g in muscle + 75–100 g in liver; depletion causes fatigue at any intensity above 60% VO₂max; glycogen super-compensation via 3-day depletion + 3-day CHO loading raises stores 150–200% above normal — improves endurance performance 2–3%")
            sciRow(stat: "Jentjens 2004", detail: "Multiple transportable carbohydrates (glucose + fructose): SGLT1 glucose transporter saturates at 1.0 g/min; adding fructose (GLUT5 transporter) increases total oxidation to 1.75–1.8 g/min — 75% improvement; practical target: 2:1 glucose:fructose ratio during prolonged exercise >2.5h; maltodextrin + fructose gels achieve this")
            sciRow(stat: "Thomas 2016 (ACSM/DC/AND)", detail: "Carbohydrate periodization: train-low/compete-high manipulates metabolic flexibility; low-CHO training sessions upregulate fat oxidation enzymes and AMPK signaling; key metric: carbohydrate availability matched to session intensity — high-quality intervals need glycogen; Zone 2 sessions benefit from fasted or low-CHO state")
            sciRow(stat: "Ivy 2002", detail: "Post-exercise glycogen resynthesis: rate fastest in first 30–45 min post-exercise (150% normal); optimized by 1.0–1.2 g/kg/h CHO + co-ingestion of 0.3 g/kg/h protein (insulin synergy); full glycogen restoration takes 20–24h with adequate CHO; caffeine + CHO post-exercise increases resynthesis 66% vs CHO alone (Pedersen 2008)")
        }
    }

    private var fatAdaptationCard: some View {
        scienceCard(title: "Fat Oxidation & Metabolic Flexibility", icon: "🫀", color: .green) {
            sciRow(stat: "Achten 2002", detail: "Fat oxidation kinetics: FatMax — the intensity of maximal absolute fat oxidation — occurs at 45–65% VO₂max; increases with training; measured via indirect calorimetry as respiratory exchange ratio (RER); elite endurance athletes oxidize 0.6–0.9 g/min fat vs. sedentary 0.3–0.4 g/min; training doubles fat oxidation capacity")
            sciRow(stat: "Burke 2020", detail: "Dietary fat and athletic performance: chronic high-fat diet (>60% energy) impairs high-intensity exercise due to reduced muscle glycolytic capacity — PDH activity down-regulated; however, fat adaptation + CHO restoration (FACO protocol) preserves fat oxidation while restoring glycogen; duration of adaptation >3 weeks required for meaningful enzymatic changes")
            sciRow(stat: "Volek 2016", detail: "Keto-adapted athletes (FASTER study): elite ultra-runners adapted to LCHF diet for 20 months oxidized 2.3× more fat (1.54 vs 0.67 g/min) at race pace vs. high-CHO athletes; VO₂max identical between groups; however, glycogen utilization rate unchanged — LCHF athletes used same glycogen percentage, just had larger total fat pool; high-intensity power not impaired after full adaptation")
            sciRow(stat: "Spriet 2014", detail: "Caffeine and fat oxidation: 3–6 mg/kg caffeine 60 min pre-exercise increases fat oxidation 15% and spares glycogen; mechanism: adenosine receptor blockade + direct stimulation of hormone-sensitive lipase; most effective in fed state vs. fasted; tolerance develops in chronic users — 7-day washout period restores ergogenic effect")
        }
    }

    private var nutrientTimingCard: some View {
        scienceCard(title: "Nutrient Timing & Recovery", icon: "⏱️", color: .purple) {
            sciRow(stat: "Aragon 2013 (meta-analysis)", detail: "Protein timing: post-exercise anabolic window is real but wide — 3–6h window for protein-feeding benefits, not 30 min as once believed; if protein intake is adequate throughout day (1.6+ g/kg), timing matters less; pre-sleep protein (casein 40g) increases overnight MPS by 22% (Res 2012) and improves training adaptations over 12 weeks")
            sciRow(stat: "Thomas 2016", detail: "Hydration and performance: even 2% body mass loss from dehydration impairs aerobic exercise performance and cognitive function; sweat rate 0.5–2.5 L/h depending on intensity/heat; sodium co-ingestion (≥500 mg/L) maintains plasma volume better than water alone and stimulates thirst; hyperhydration with glycerol 1.2 g/kg pre-exercise expands plasma volume 10% in heat")
            sciRow(stat: "Maughan 2018 (IOC Consensus)", detail: "Dietary supplements with strong evidence: caffeine (3–6 mg/kg), creatine (3–5 g/day after loading), nitrates (0.5–1 L beetroot juice = 8.2 mmol NO₃⁻, 6.5% performance improvement at 5000m), beta-alanine (3.2–6.4 g/day for ≥4 wks); supplements with insufficient evidence or harm: most amino acid blends, antioxidant megadoses (blunt training adaptations)")
            sciRow(stat: "Howatson 2012", detail: "Anti-inflammatory nutrition: tart cherry juice (480 mL twice daily for 5 days pre + 2 days post) reduces DOMS 23% and CK 18% vs placebo; blueberry supplementation improves recovery of muscle function 60h post-exercise; omega-3 (2–3 g EPA+DHA/day) reduces DOMS and accelerates strength recovery — possible mechanism: membrane fluidity and reduced inflammation")
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

        guard let kcalType = HKObjectType.quantityType(forIdentifier: .dietaryEnergyConsumed),
              let proteinType = HKObjectType.quantityType(forIdentifier: .dietaryProtein),
              let carbType = HKObjectType.quantityType(forIdentifier: .dietaryCarbohydrates),
              let fatType = HKObjectType.quantityType(forIdentifier: .dietaryFatTotal) else {
            isLoading = false; return
        }

        guard (try? await store.requestAuthorization(toShare: [], read: [kcalType, proteinType, carbType, fatType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        async let kcalSamples = fetchSamples(type: kcalType, predicate: predicate)
        async let proteinSamples = fetchSamples(type: proteinType, predicate: predicate)
        async let carbSamples = fetchSamples(type: carbType, predicate: predicate)
        async let fatSamples = fetchSamples(type: fatType, predicate: predicate)

        let (kcal, protein, carbs, fat) = await (kcalSamples, proteinSamples, carbSamples, fatSamples)

        let kcalUnit = HKUnit.kilocalorie()
        let gramUnit = HKUnit.gram()

        let totalKcal = kcal.reduce(0) { $0 + $1.quantity.doubleValue(for: kcalUnit) }
        let totalProtein = protein.reduce(0) { $0 + $1.quantity.doubleValue(for: gramUnit) }
        let totalCarbs = carbs.reduce(0) { $0 + $1.quantity.doubleValue(for: gramUnit) }
        let totalFat = fat.reduce(0) { $0 + $1.quantity.doubleValue(for: gramUnit) }

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for sample in kcal {
            let weeksAgo = Int(now.timeIntervalSince(sample.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += sample.quantity.doubleValue(for: kcalUnit) }
        }

        let days = max(totalKcal > 0 ? 56.0 : 1, 1.0)
        await MainActor.run {
            self.avgDailyKcal = totalKcal / days
            self.avgProtein = totalProtein / days
            self.avgCarbs = totalCarbs / days
            self.avgFat = totalFat / days
            self.weeklyKcal = weekly
            self.isLoading = false
        }
    }

    private func fetchSamples(type: HKQuantityType, predicate: NSPredicate) async -> [HKQuantitySample] {
        await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }
    }
}
