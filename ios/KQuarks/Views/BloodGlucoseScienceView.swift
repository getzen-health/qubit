import SwiftUI
import HealthKit

struct BloodGlucoseScienceView: View {
    @State private var avgGlucose: Double = 0
    @State private var minGlucose: Double = 0
    @State private var maxGlucose: Double = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                glucoseStatsRow
                glucoseRangesCard
                insulinResistanceCard
                exerciseGlucoseCard
                cgmScienceCard
            }
            .padding()
        }
        .navigationTitle("Blood Glucose Science")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var glucoseStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgGlucose > 0 ? String(format: "%.0f", avgGlucose) : "--", label: "Avg mg/dL", color: avgGlucose > 0 && avgGlucose < 100 ? .green : avgGlucose < 125 ? .orange : .red)
                statCard(value: minGlucose > 0 ? String(format: "%.0f", minGlucose) : "--", label: "Min mg/dL", color: minGlucose > 0 && minGlucose >= 70 ? .green : .orange)
                statCard(value: maxGlucose > 0 ? String(format: "%.0f", maxGlucose) : "--", label: "Max mg/dL", color: maxGlucose > 0 && maxGlucose < 140 ? .green : maxGlucose < 180 ? .orange : .red)
            }
            Text("ADA 2023: Time in Range (TIR) 70–180 mg/dL >70% is the primary CGM management target — each 10% TIR increase reduces HbA1c ~0.5%")
                .font(.caption2).foregroundColor(.secondary)
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

    // MARK: - Science Cards
    private var glucoseRangesCard: some View {
        scienceCard(title: "Glucose Physiology & Ranges", icon: "🩸", color: .red) {
            sciRow(stat: "ADA Standards of Care 2023 (Diabetes Care)", detail: "Clinical glucose targets: fasting 80–130 mg/dL, 2-hour post-meal <180 mg/dL, HbA1c <7% (eAG ~154 mg/dL) for most adults with diabetes; non-diabetic: fasting 70–100 mg/dL, post-meal <140 mg/dL; prediabetes: fasting 100–125 mg/dL (IFG) or HbA1c 5.7–6.4%; TIR (Time in Range 70–180 mg/dL) goal ≥70% = primary CGM metric; each 10% TIR improvement → ~0.5% HbA1c reduction and 35% lower risk of retinopathy")
            sciRow(stat: "Derr 2003 (Diabetes Technol Ther)", detail: "eAG to HbA1c conversion: HbA1c reflects 2–3 month average glucose; eAG formula: (28.7 × HbA1c) − 46.7 = average mg/dL; HbA1c 5% ≈ 97 mg/dL, 6% ≈ 126, 7% ≈ 154, 8% ≈ 183, 9% ≈ 212; limitations: HbA1c inaccurate in hemolytic anemia, iron deficiency, hemoglobin variants; CGM-derived average glucose is more accurate than HbA1c in these populations")
            sciRow(stat: "Glucose variability: GV measures (Danne 2017 Diabetes Care)", detail: "Glucose variability beyond averages: coefficient of variation (CV%) = SD/mean × 100; CV >36% = high variability, independently increases CVD risk; MAGE (mean amplitude of glycemic excursions) >100 mg/dL predicts complications; time below range (<70 mg/dL) even brief episodes trigger cardiovascular stress responses; 15-min hypoglycemia episodes impair cognitive function for 45+ min after glucose normalizes")
            sciRow(stat: "UKPDS 1998 (Lancet)", detail: "Landmark glucose control evidence: intensive glycemic control in T2D reduces microvascular complications 25% (retinopathy, nephropathy, neuropathy) vs conventional; each 1% HbA1c reduction → 37% reduced risk of microvascular complications, 21% reduction in diabetes-related deaths; benefit persists decades after the trial ends ('metabolic memory' or 'legacy effect'); cardiovascular benefit of tight control requires 10+ years to manifest — early, aggressive control matters most")
        }
    }

    private var insulinResistanceCard: some View {
        scienceCard(title: "Insulin Resistance & Metabolic Health", icon: "🔬", color: .orange) {
            sciRow(stat: "DeFronzo 2009 (Diabetes)", detail: "Ominous octet of T2D: insulin resistance in muscle, liver, and adipose; impaired insulin secretion; increased glucagon secretion; enhanced glucose reabsorption by kidneys; reduced incretin effect; neurotransmitter dysfunction; insulin resistance in muscle drives postprandial hyperglycemia — the most common first defect; progressive beta-cell loss (50% at T2D diagnosis, 0% per year thereafter) determines disease progression")
            sciRow(stat: "Boden 2002 (Am J Physiol)", detail: "Free fatty acid and insulin resistance: elevated circulating FFAs (from adipose tissue lipolysis) impair insulin signaling via diacylglycerol → PKC pathway; ceramide accumulation in muscle disrupts GLUT4 translocation; visceral adipose tissue releases 3× more FFAs than subcutaneous; even one 24-hour high-fat feeding raises skeletal muscle insulin resistance 50%; omega-3 fatty acids (EPA/DHA) reduce ceramide and improve insulin sensitivity")
            sciRow(stat: "Knowler 2002 (NEJM — DPP trial)", detail: "Lifestyle prevention of T2D: Diabetes Prevention Program — lifestyle intervention (7% body weight loss + 150 min/week moderate exercise) reduced T2D incidence 58% in prediabetic adults vs placebo; 71% reduction in adults >60; metformin reduced by 31%; 10-year follow-up: lifestyle group maintained lower rates despite weight regain; walking alone (without weight loss) reduces T2D risk 30%")
            sciRow(stat: "Cusi 2010 (Diabetes Care)", detail: "Exercise and insulin sensitivity: single bout of aerobic exercise increases skeletal muscle glucose uptake 2–10× during exercise; post-exercise insulin sensitivity remains elevated 12–48h; mechanism: AMPK activation → GLUT4 translocation independent of insulin; resistance training increases muscle glucose storage capacity; HIIT improves insulin sensitivity 20–35% in 2 weeks (vs 6 weeks for moderate continuous exercise); exercise is the most potent non-pharmacologic insulin sensitizer")
        }
    }

    private var exerciseGlucoseCard: some View {
        scienceCard(title: "Exercise & Blood Glucose", icon: "⚡", color: .blue) {
            sciRow(stat: "Sigal 2006 (Ann Intern Med — DARE trial)", detail: "Aerobic + resistance training: combined aerobic + resistance training reduces HbA1c 0.97% vs aerobic alone (−0.51%) or resistance alone (−0.38%) in T2D — synergistic effect; 6-month supervised RCT in 251 T2D adults; aerobic exercise = fuel for glucose oxidation; resistance training = increases muscle glycogen capacity and resting GLUT4 content; the combination is optimal for blood glucose management")
            sciRow(stat: "van Dijk 2012 (Diabetes Care)", detail: "Walking after meals: 15-min light walking after each meal reduces postprandial glucose 22% vs one 45-min continuous walk — same total duration, superior effect; mechanism: postprandial exercise timing matches peak glucose appearance from meal digestion; post-dinner walking most effective (largest postprandial glucose spike); practical for T2D self-management: 'walk after every meal' is more effective than front-loaded exercise")
            sciRow(stat: "Chimen 2012 (Obes Rev)", detail: "Exercise timing and hypoglycemia risk in T1D: aerobic exercise during day raises hypoglycemia risk; resistance exercise raises glucose acutely (catecholamine response); exercise at night increases nocturnal hypoglycemia risk; eating pre-exercise (15–30g carb) if glucose <126 mg/dL; CGM reduces hypoglycemia events during exercise 40% vs self-monitoring alone; T1D athletes using CGM can optimize insulin reduction before prolonged aerobic sessions")
            sciRow(stat: "Marliss 2002 (Diabetes)", detail: "Catecholamine response to exercise: intense exercise (>80% VO₂max) raises blood glucose despite insulin via: (1) hepatic glucose output driven by epinephrine/glucagon surge; (2) reduced glucose uptake due to vasoconstriction; marathon runners without diabetes can reach 180–250 mg/dL during race; post-exercise: continued catecholamine elevation maintains glucose 1–2h post-sprint; HIIT in T1D typically raises glucose acutely then drops 2–4h later — delayed hypoglycemia risk")
        }
    }

    private var cgmScienceCard: some View {
        scienceCard(title: "CGM Technology & Metabolic Flexibility", icon: "📡", color: .green) {
            sciRow(stat: "Danne 2017 (Diabetes Care — CGM consensus)", detail: "CGM metrics standardized: TIR (70–180) ≥70%; Time Below Range (TBR <70) <4%, TBR <54 <1%; Time Above Range (TAR >180) <25%, TAR >250 <5%; these CGM targets replace HbA1c as primary T1D outcomes in clinical trials; CGM reduces severe hypoglycemia 38% vs self-monitoring in T1D (Battelino 2012 NEJM); real-time CGM is superior to intermittent scanning in reducing TBR")
            sciRow(stat: "Hall 2021 (Nat Med)", detail: "Non-diabetic CGM variability: wearable CGM in 1,000 healthy adults reveals 30–40% of time spent above 140 mg/dL postprandially; individual glycemic response to identical meals varies 300% (Zeevi 2015 Cell) — driven by gut microbiome composition, not food alone; highly personalized: a food that spikes glucose in one person may not in another; CGM-guided nutrition coaching reduces 2h postprandial glucose 30% more than standard dietary advice")
            sciRow(stat: "Volek 2009 (Nutr Metab)", detail: "Carbohydrate restriction and metabolic flexibility: metabolic flexibility = ability to shift fuel oxidation based on substrate availability; insulin resistance impairs this transition (glucose-fatty acid cycle); low-carbohydrate diets (≤130g CHO/day) reduce HbA1c 0.8–1.5% in T2D over 6 months (meta-analysis Sainsbury 2018 Lancet Diabetes); mechanism: reduces glucose flux, reduces insulin secretion, increases fat oxidation; fat adaptation improves glucose stability even without weight loss")
            sciRow(stat: "Attia 2023 (Outlive)", detail: "Glucose as longevity biomarker: glucose spikes (>180 mg/dL) activate protein glycation → advanced glycation end-products (AGEs) accumulating in arteries, neurons, kidneys; AGEs are irreversible — prevention is essential; mitochondrial dysfunction correlates with insulin resistance decades before T2D diagnosis; fasting glucose ≥95 mg/dL (high-normal) associated with 45% higher CVD risk; optimal: fasting 70–90 mg/dL, postprandial <140 mg/dL, HbA1c <5.4% for longevity optimization")
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
        guard let glucoseType = HKObjectType.quantityType(forIdentifier: .bloodGlucose) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [glucoseType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let unit = HKUnit(from: "mg/dL")

        let samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: glucoseType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let values = samples.map { $0.quantity.doubleValue(for: unit) }
        let avg = values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)
        let minVal = values.min() ?? 0
        let maxVal = values.max() ?? 0

        await MainActor.run {
            self.avgGlucose = avg
            self.minGlucose = minVal
            self.maxGlucose = maxVal
            self.isLoading = false
        }
    }
}
