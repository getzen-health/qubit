import SwiftUI
import HealthKit

struct EnergySystemScienceView: View {
    @State private var totalActiveKcal: Double = 0
    @State private var totalRestingKcal: Double = 0
    @State private var avgActiveKcal: Double = 0
    @State private var weeklyActiveKcal: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                energyStatsRow
                weeklyChart
                aTPPCrCard
                glycolyticCard
                aerobicCard
                substratePartitioningCard
            }
            .padding()
        }
        .navigationTitle("Energy Systems Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var energyStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalActiveKcal > 0 ? "\(Int(totalActiveKcal / 1000))k" : "--", label: "Active kcal (8wk)", color: .orange)
                statCard(value: totalRestingKcal > 0 ? "\(Int(totalRestingKcal / 1000))k" : "--", label: "Resting kcal (8wk)", color: .blue)
                statCard(value: avgActiveKcal > 0 ? "\(Int(avgActiveKcal))" : "--", label: "Avg Daily Active", color: .red)
            }
            HStack {
                Text("Total daily energy = RMR + TEF + EAT + NEAT")
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
    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Active Energy (8 Weeks, kcal)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyActiveKcal.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyActiveKcal[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyActiveKcal[i] > 0 {
                            Text("\(Int(weeklyActiveKcal[i]))").font(.system(size: 7)).foregroundColor(.secondary)
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
    private var aTPPCrCard: some View {
        scienceCard(title: "ATP-PCr System (0–10 seconds)", icon: "⚡", color: .red) {
            sciRow(stat: "Hultman 1986", detail: "Phosphocreatine (PCr) stores: 14–26 mmol/kg dry muscle; depletes in 5–10 s of maximal effort; ATP production rate 9× faster than aerobic but total yield minimal (3–4 mmol ATP/kg/s); creatine kinase (CK) reaction is the only reaction that can sustain maximal power")
            sciRow(stat: "Greenhaff 2001", detail: "Creatine supplementation (20g/day × 5 days, then 3g/day): increases muscle PCr 15–20%; improves repeat sprint performance 5–10%; most effective for efforts 5–30 s at maximal intensity; evidence strongest for high-intensity intermittent exercise")
            sciRow(stat: "Harris 1992", detail: "PCr resynthesis kinetics: 50% restored in 30 s rest, 95% in 3–5 min; explains why repeated short maximal efforts require ≥3 min rest for full recovery; warm-up accelerates PCr resynthesis rate by improving muscle temperature and blood flow")
            sciRow(stat: "Gastin 2001", detail: "Power contribution by duration: 0–1 s = 99% ATP-PCr; 5 s = 85% ATP-PCr; 10 s = 70% ATP-PCr / 25% glycolytic; 30 s = 50%/40%/10% split — even 'pure' power events have significant aerobic contribution due to enzymatic kinetics")
        }
    }

    private var glycolyticCard: some View {
        scienceCard(title: "Glycolytic System (10s–2 min)", icon: "🔥", color: .orange) {
            sciRow(stat: "Spriet 1990", detail: "Glycolysis rate: peak flux 3 mmol glucose/kg/min at maximal intensity; 13 enzymes, 10 steps from glucose-6-phosphate to pyruvate; phosphofructokinase (PFK) is the rate-limiting enzyme — activated by AMP, ADP, Pi and inhibited by ATP, citrate, H⁺")
            sciRow(stat: "Robergs 2004", detail: "Lactate paradox: lactate is NOT the cause of fatigue; H⁺ accumulation from ATP hydrolysis (not lactic acid dissociation) causes acidosis; lactate itself is a fuel — cardiac muscle and type I fibers preferentially oxidize lactate via MCT1 transporters (Brooks 2018)")
            sciRow(stat: "Weston 2014", detail: "Glycogen depletion threshold: performance degrades when muscle glycogen falls below 200 mmol/kg dm; CHO ingestion during exercise >60 min at >70% VO₂max improves performance 2–3%; multiple transportable carbohydrates (glucose + fructose) increase oxidation rate to 1.8 g/min vs. 1.0 g/min glucose alone")
            sciRow(stat: "Hargreaves 2020", detail: "Training adaptations to the glycolytic system: HIIT increases muscle buffering capacity (bicarbonate, carnosine, phosphate) by 20–30%; beta-alanine supplementation increases muscle carnosine 64% in 4 weeks — improves repeat high-intensity effort by 2.85% (Hobson 2012)")
        }
    }

    private var aerobicCard: some View {
        scienceCard(title: "Aerobic System (>2 min)", icon: "🫁", color: .blue) {
            sciRow(stat: "Holloszy 1967", detail: "Mitochondrial biogenesis: endurance training doubles muscle mitochondrial density over 3–6 months; driven by PGC-1α (master regulator) activated by AMPK and p38-MAPK during exercise; mitochondrial adaptations explain most of the improvement in oxidative capacity with training")
            sciRow(stat: "Bassett 2000", detail: "VO₂max determinants: cardiac output (Q) is the primary limiter (accounts for 70–80% of variance); Q = heart rate × stroke volume; training increases max stroke volume 20–40% via eccentric cardiac hypertrophy; peripheral O₂ extraction contributes remaining 20–30%")
            sciRow(stat: "Seiler 2010", detail: "Polarized training model: 80% of training below LT1 (Zone 1–2), 20% above LT2 (Zone 4–5); optimizes mitochondrial volume density AND oxidative enzyme activity simultaneously; produces greater VO₂max gains than threshold-dominated (50% Z3) or HVT approaches")
            sciRow(stat: "Brooks 2018", detail: "Intracellular lactate shuttle: active muscle exports lactate via MCT4 → blood → adjacent Type I fibers oxidize via MCT1 → mitochondrial LDH; during Zone 2 training, this shuttle is maximally active; Zone 2 is the intensity that maximizes lactate clearance rate while producing peak mitochondrial adaptation stimulus")
        }
    }

    private var substratePartitioningCard: some View {
        scienceCard(title: "Substrate Use & Crossover Point", icon: "📊", color: .green) {
            sciRow(stat: "Brooks 1994", detail: "Crossover concept: below ~65% VO₂max, fat is primary fuel; above 65%, CHO dominates; elite endurance athletes cross over at higher intensities due to greater fat oxidation capacity — fat max (FatMax) at 45–65% VO₂max (Achten 2002)")
            sciRow(stat: "Volek 2015", detail: "Metabolic flexibility: keto-adapted athletes oxidize 2.3× more fat per minute than CHO-adapted at same intensity; fat oxidation rate peaks 1.5 g/min vs. 0.6 g/min control; requires 3–6 months full adaptation — acute ketogenic diet impairs high-intensity performance within 48h")
            sciRow(stat: "Gollnick 1985", detail: "Glycogen sparing via fat oxidation: trained muscle preferentially oxidizes fat at submaximal intensities, sparing glycogen for high-intensity bouts; mechanism: higher mitochondrial density → more NADH from β-oxidation → increased acetyl-CoA → allosteric PFK inhibition reducing glycolytic rate")
            sciRow(stat: "EPOC Science", detail: "Excess Post-Exercise Oxygen Consumption (EPOC): repays PCr stores (60% of EPOC), oxidizes lactate (25%), elevates temperature/catecholamines (15%); HIIT EPOC lasts 12–48h contributing 6–15% to total exercise energy cost; steady-state EPOC resolves in <60 min (LaForgia 2006)")
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
        let activeType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
        let restingType = HKObjectType.quantityType(forIdentifier: .basalEnergyBurned)!

        guard (try? await store.requestAuthorization(toShare: [], read: [activeType, restingType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let activeSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: activeType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let restingSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: restingType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let kcalUnit = HKUnit.kilocalorie()
        let totalActive = activeSamples.reduce(0) { $0 + $1.quantity.doubleValue(for: kcalUnit) }
        let totalResting = restingSamples.reduce(0) { $0 + $1.quantity.doubleValue(for: kcalUnit) }

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for sample in activeSamples {
            let weeksAgo = Int(now.timeIntervalSince(sample.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += sample.quantity.doubleValue(for: kcalUnit) }
        }

        await MainActor.run {
            self.totalActiveKcal = totalActive
            self.totalRestingKcal = totalResting
            self.avgActiveKcal = totalActive / 56
            self.weeklyActiveKcal = weekly
            self.isLoading = false
        }
    }
}
