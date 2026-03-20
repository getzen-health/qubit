import SwiftUI
import HealthKit

struct HydrationScienceView: View {
    @State private var avgDailyWaterL: Double = 0
    @State private var totalWaterL: Double = 0
    @State private var weeklyWater: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                hydrationStatsRow
                weeklyWaterChart
                performanceHydrationCard
                cellularPhysiologyCard
                electrolyteScienceCard
                practicalGuidanceCard
            }
            .padding()
        }
        .navigationTitle("Hydration Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var hydrationStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgDailyWaterL > 0 ? String(format: "%.1f", avgDailyWaterL) + "L" : "--", label: "Avg Daily Intake", color: .blue)
                statCard(value: avgDailyWaterL > 0 ? "\(Int((avgDailyWaterL / 2.5) * 100))%" : "--", label: "% of 2.5L Goal", color: avgDailyWaterL >= 2.5 ? .green : .orange)
                statCard(value: totalWaterL > 0 ? String(format: "%.0f", totalWaterL) + "L" : "--", label: "Total (8 weeks)", color: .teal)
            }
            HStack {
                Text("Water intake logged via Apple Health. Target: 35 mL/kg/day + sweat losses during exercise")
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
    private var weeklyWaterChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Water Intake (8 Weeks, liters)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyWater.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyWater[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyWater[i] > 0 {
                            Text(String(format: "%.0f", weeklyWater[i])).font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.blue.opacity(0.8))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            Text("Green ≥17.5L/wk (2.5L/day) • Orange 14–17.5L • Red <14L").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var performanceHydrationCard: some View {
        scienceCard(title: "Hydration & Exercise Performance", icon: "💧", color: .blue) {
            sciRow(stat: "Sawka 2007 (ACSM Position Stand)", detail: "Dehydration dose-response: 1% body mass loss → marginal aerobic impairment; 2% → 2–4% reduction in aerobic performance; 3% → 6–8% reduction; 5% → heat exhaustion risk; cognitive impairment (reaction time, executive function) detectable at 1.5% dehydration — lower threshold than physical impairment")
            sciRow(stat: "Cheuvront 2003", detail: "Sweat rate variability: 0.5–2.5 L/h depending on intensity, environment, and fitness; heat-acclimatized athletes produce more dilute sweat (lower sodium) but at higher volumes; sweat electrolyte losses: sodium 460–1,840 mg/L, potassium 160–480 mg/L, chloride 380–1,610 mg/L — significant in events >2h")
            sciRow(stat: "Kenefick 2012", detail: "Thirst as a hydration guide: thirst sensation lags actual deficit by ~30 min and underestimates fluid need by 20–40% during exercise; older adults have blunted thirst response — programmed drinking superior to ad-lib drinking for maintaining performance in heat; thirst is adequate for daily hydration but insufficient for athletic performance")
            sciRow(stat: "Montain 1992", detail: "Pre-exercise hyperhydration: glycerol 1.2 g/kg + 26 mL/kg fluid 2h before exercise expands plasma volume 10% and reduces core temperature rise 0.3°C; sodium loading (0.5–1 g/kg) also retains fluid and delays dehydration onset; however, hyperhydration benefits diminish in cool conditions and for efforts <60 min")
        }
    }

    private var cellularPhysiologyCard: some View {
        scienceCard(title: "Cellular Physiology of Hydration", icon: "🔬", color: .cyan) {
            sciRow(stat: "Acker 2012", detail: "Total body water: 60% of body weight in men, 55% in women (less muscle mass); distributed as intracellular fluid (ICF, 65%) and extracellular fluid (ECF, 35% = plasma 7% + interstitial 28%); plasma volume is most rapidly affected by dehydration — decreases within 15 min of exercise onset, reducing cardiac stroke volume and muscle perfusion")
            sciRow(stat: "Nose 1988", detail: "Plasma volume restoration: 60% of fluid deficit is restored in 30 min post-exercise with water + food; full restoration requires 24–48h without specific rehydration; plasma volume decrease of 10% (moderate dehydration) reduces cardiac output 1 L/min and peak aerobic power 5–8% via Frank-Starling mechanism limitations")
            sciRow(stat: "Mohr 2010", detail: "Muscle cell volume and protein synthesis: cell swelling (hydration) acts as anabolic signal — promotes protein synthesis and inhibits proteolysis via mTOR pathway; dehydrated muscle cells activate catabolic pathways; adequate hydration status (not just performance) matters for body composition and recovery")
            sciRow(stat: "Popkin 2010", detail: "Chronic mild dehydration: urine osmolality >500 mOsm/kg (euhydration <300 mOsm/kg) associated with kidney stone risk, UTIs, and impaired renal function over years; 8 cups/day (2L) recommendation lacks strong evidence — individual requirement is 1.5× urine output + ~300 mL insensible loss; morning urine color chart (pale straw = 1–3 = optimal)")
        }
    }

    private var electrolyteScienceCard: some View {
        scienceCard(title: "Electrolytes & Osmotic Balance", icon: "⚗️", color: .purple) {
            sciRow(stat: "Hew-Butler 2015 (IOC)", detail: "Exercise-associated hyponatremia (EAH): sodium <135 mmol/L caused by excessive hypotonic fluid intake (>1L/h) in events >4h; risk factors: low sweat sodium, high fluid intake, low body weight, slow pace; symptoms: nausea, headache, confusion, seizure; treatment is fluid restriction + hypertonic saline, NOT water; water alone is dangerous in EAH")
            sciRow(stat: "Coyle 2004", detail: "Sodium's role in rehydration: co-ingestion of sodium (≥500 mg/L) with fluid stimulates thirst 40% more than plain water, reduces urine output 50%, and retains 60% more fluid in extracellular space; ORS (oral rehydration solution) with 75–90 mmol/L sodium optimized for diarrheal rehydration — athlete formulas use 20–30 mmol/L")
            sciRow(stat: "Maughan 2004", detail: "Potassium and cramps: exercise-associated muscle cramps (EAMC) are NOT simply from potassium depletion (sweat K⁺ is relatively low); EAMC caused by altered neuromuscular control from fatigue, not electrolyte deficit alone (Miller 2010: pickle juice works in 85 seconds — faster than osmotic change, so neural mechanism via pharyngeal receptors); however, K⁺ essential for membrane repolarization and glycogen storage")
            sciRow(stat: "Sawka 2012", detail: "Sports drink optimization: 6–8% CHO concentration maximizes gastric emptying and intestinal absorption simultaneously; below 6% = less energy per mL; above 8% = slowed gastric emptying and potential GI distress; adding sodium 0.5–0.7 g/L maintains plasma osmolality and stimulates fluid absorption via sodium-glucose cotransporter (SGLT1) — basis of sports drink formulation")
        }
    }

    private var practicalGuidanceCard: some View {
        scienceCard(title: "Evidence-Based Hydration Protocols", icon: "📋", color: .green) {
            sciRow(stat: "McDermott 2017 (NATA)", detail: "Pre-exercise hydration: consume 5–7 mL/kg of fluid 4h before exercise; if urine is dark (>3 on 8-point scale), add 3–5 mL/kg 2h before; this two-stage protocol allows full absorption and renal adjustment before exercise; avoid excessive caffeine or alcohol ≥12h before prolonged exercise in heat")
            sciRow(stat: "Thomas 2016 (ACSM/DC/AND)", detail: "During-exercise guidance: drink 150–250 mL every 15–20 min to replace sweat losses; for events >1h, use sports drink with CHO (30–60 g/h) + sodium (0.5–0.7 g/L); personalize based on sweat rate test (pre vs post weigh-in: 1 kg loss = 1L fluid deficit); aim to keep dehydration <2% body mass")
            sciRow(stat: "Shirreffs 2004", detail: "Post-exercise rehydration: restore 150% of fluid deficit over 4h; include sodium (500–700 mg/L) to stimulate thirst and reduce urine losses; food co-ingestion provides electrolytes — a meal with normal salt restores plasma volume as effectively as commercial sports drinks; milk (animal or soy) is superior to water or sports drink for rehydration due to electrolytes + protein")
            sciRow(stat: "Armstrong 2012", detail: "Caffeine and hydration: moderate caffeine (≤400 mg/day = ~4 cups coffee) does NOT cause dehydration; habitual caffeine users have complete tolerance to diuretic effect; acute large doses (>6 mg/kg) increase urine output 25% for 1–2h but net fluid balance remains neutral; coffee and tea count toward daily fluid intake")
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
        guard let waterType = HKObjectType.quantityType(forIdentifier: .dietaryWater) else {
            isLoading = false; return
        }

        guard (try? await store.requestAuthorization(toShare: [], read: [waterType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let literUnit = HKUnit.liter()

        let samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: waterType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let total = samples.reduce(0) { $0 + $1.quantity.doubleValue(for: literUnit) }

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for sample in samples {
            let weeksAgo = Int(now.timeIntervalSince(sample.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += sample.quantity.doubleValue(for: literUnit) }
        }

        await MainActor.run {
            self.totalWaterL = total
            self.avgDailyWaterL = total / 56
            self.weeklyWater = weekly
            self.isLoading = false
        }
    }
}
