import SwiftUI
import HealthKit

struct VO2MaxScienceView: View {
    @State private var currentVO2Max: Double = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                vo2StatsRow
                physiologyCard
                longevityCard
                trainingCard
                measurementCard
            }
            .padding()
        }
        .navigationTitle("VO₂max Science")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var vo2StatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: currentVO2Max > 0 ? String(format: "%.1f", currentVO2Max) : "--", label: "VO₂max mL/kg/min", color: fitnessColor(currentVO2Max))
                statCard(value: currentVO2Max > 0 ? fitnessCategory(currentVO2Max) : "--", label: "Fitness Category", color: fitnessColor(currentVO2Max))
                let metsEquiv = currentVO2Max > 0 ? currentVO2Max / 3.5 : 0
                statCard(value: metsEquiv > 0 ? String(format: "%.1f METs", metsEquiv) : "--", label: "MET Equivalent", color: metsEquiv >= 10 ? .green : metsEquiv >= 7 ? .orange : .red)
            }
            Text("Mandsager 2018 (JAMA Network Open): Elite fitness vs sedentary = 5× lower all-cause mortality — the largest mortality predictor in medicine")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private func fitnessColor(_ vo2: Double) -> Color {
        if vo2 <= 0 { return .secondary }
        if vo2 >= 55 { return .green }
        if vo2 >= 45 { return .mint }
        if vo2 >= 35 { return .orange }
        return .red
    }

    private func fitnessCategory(_ vo2: Double) -> String {
        if vo2 >= 55 { return "Superior" }
        if vo2 >= 47 { return "Excellent" }
        if vo2 >= 42 { return "Good" }
        if vo2 >= 34 { return "Fair" }
        return "Low" }

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
    private var physiologyCard: some View {
        scienceCard(title: "VO₂max Physiology & Determinants", icon: "🫁", color: .blue) {
            sciRow(stat: "Bassett & Howley 2000 (Med Sci Sports Exerc)", detail: "VO₂max = maximal oxygen uptake = cardiac output × arteriovenous O₂ difference; central limitation: cardiac output (stroke volume × max HR); peripheral limitation: muscle O₂ extraction via mitochondrial density and capillary-to-fiber ratio; in highly trained athletes, CO = 40 L/min (vs 20 L/min untrained); SV increases from ~70 mL (untrained) to 200 mL (Tour de France cyclists) due to eccentric cardiac hypertrophy and plasma volume expansion")
            sciRow(stat: "Dempsey 2006 (J Physiol)", detail: "Respiratory limitation: in athletes with VO₂max >60 mL/kg/min, the lung becomes a limiting factor — exercise-induced arterial hypoxemia (EIAH) occurs in ~50% of elite endurance athletes; arterial O₂ saturation drops 3–5% at maximal effort; pulmonary diffusion capacity is fixed at birth and not trainable; supplemental O₂ improves performance in elite athletes but not untrained individuals — confirming respiratory limits at high fitness")
            sciRow(stat: "Saltin 1985 (Acta Physiol Scand)", detail: "Muscle mass and VO₂max: local endurance of individual muscles shows 'local' oxygen uptake can equal central delivery when isolated; trained leg muscles extract O₂ more completely (higher a-vO₂ diff); mitochondrial volume density doubles with training; capillary density increases 20–40%; myoglobin content increases 15–20%; these peripheral adaptations account for 50% of VO₂max improvement in untrained individuals in the first 6 months of training")
            sciRow(stat: "Coyle 1995 (J Appl Physiol)", detail: "Detraining kinetics: VO₂max declines 6–20% within 3 weeks of stopping training; the fastest loss occurs in the first 2 weeks (plasma volume loss, reduced SV); continued detraining over months causes slower loss of mitochondrial enzymes and muscle capillarity; 50% of VO₂max gains lost after 12 weeks of inactivity; 10 years of elite training shows minimal loss if detraining is gradual; cardiac chamber remodeling takes 3–11 months to fully reverse after cessation")
        }
    }

    private var longevityCard: some View {
        scienceCard(title: "VO₂max & Longevity", icon: "❤️", color: .red) {
            sciRow(stat: "Mandsager 2018 (JAMA Network Open)", detail: "Landmark mortality study: 122,007 patients undergoing exercise treadmill testing; low VO₂max (lowest 25%) vs elite (top 2.3%) = 5× higher all-cause mortality — comparable to smoking; low fit vs high fit = 3× higher mortality; each 1 MET (3.5 mL/kg/min) increase in exercise capacity → 13% mortality reduction; fitness was the strongest predictor of mortality, stronger than diabetes, smoking, hypertension, or coronary artery disease")
            sciRow(stat: "Kodama 2009 (JAMA)", detail: "Meta-analysis 33 studies (N=102,980): each 1 MET increase in cardiorespiratory fitness reduces CVD mortality 15% and all-cause mortality 13%; high CRF vs low CRF = 50–60% lower CVD and all-cause mortality; this dose-response extends across men and women, healthy and diseased populations; no upper limit of benefit identified — the highest-fit individuals have the lowest mortality at every age studied")
            sciRow(stat: "Erikssen 1998 (Lancet)", detail: "16-year follow-up of 2,014 men: every 1 mL/kg/min increase in VO₂max = 9% reduction in 16-year CVD mortality; the effect held after controlling for traditional risk factors; the 'physical fitness paradox' — even sedentary individuals who improved fitness by 20% reduced mortality risk equivalent to quitting smoking; VO₂max is a modifiable risk factor, unlike age or genetics")
            sciRow(stat: "Strand 2016 (Eur J Prev Cardiol)", detail: "VO₂max by decade: population norms decline ~10% per decade after 30 in sedentary individuals; 1% decline per year vs 0.5% in active individuals; trained masters athletes maintain VO₂max 30–40 mL/kg/min at age 70+ (vs 25 for sedentary age-matched peers); the age-related VO₂max decline is 50% attributable to lifestyle (trainable) and 50% to physiological aging; exercising adults maintain 10–20% higher VO₂max than sedentary peers at any age")
        }
    }

    private var trainingCard: some View {
        scienceCard(title: "Training for VO₂max Improvement", icon: "📈", color: .green) {
            sciRow(stat: "Helgerud 2007 (Med Sci Sports Exerc)", detail: "Optimal HIIT protocol: 4×4 min at 90–95% HRmax with 3 min active recovery (Norwegian 4×4); 8-week RCT — 4×4 HIIT improved VO₂max 7.2 mL/kg/min vs 0.8 for long slow distance; SV increased 10% more in HIIT group; 4×4 HIIT represents the most efficient evidence-based protocol for VO₂max improvement in trained athletes; requires just 3 sessions/week; clinical populations improve VO₂max 10–20% in 12 weeks with supervised HIIT")
            sciRow(stat: "Midgley 2006 (Sports Med)", detail: "Volume vs intensity: ≥20 min continuous at ≥90% VO₂max per session provides the strongest VO₂max stimulus; short interval protocols (30-30s, Tabata 20-10s) provide a lower VO₂max stimulus despite high perceived effort; the Billat vVO₂max protocol (repetitions at the velocity at VO₂max) is optimal for already-trained runners; untrained individuals respond to almost any aerobic stimulus — intensity matters more as fitness improves")
            sciRow(stat: "Rønnestad 2014 (Scand J Med Sci Sports)", detail: "Periodization of VO₂max training: 'block periodization' — concentrated VO₂max blocks (3 weeks high intensity, 1 week recovery) improves VO₂max 4.6% more than traditional training in cyclists; block periodization preserves accumulated mitochondrial adaptations while allowing peak supercompensation; most improvement occurs weeks 3–4 of a VO₂max block; 6-week blocks without recovery diminish returns due to overreaching")
            sciRow(stat: "Wisloff 2007 (Circulation)", detail: "Clinical applications: VO₂max training in heart failure patients — 4×4 HIIT improved VO₂max 46% in post-MI patients vs 14% for moderate training; SV increased 12%, EF improved 35%; 3×/week supervised HIIT safe in stable heart failure and post-MI; cardiac rehabilitation programs using HIIT show 30% fewer cardiac events vs standard walking programs; VO₂max improvement in clinical populations is a direct proxy for cardiac pump function improvement")
        }
    }

    private var measurementCard: some View {
        scienceCard(title: "Measurement & Apple Watch Estimation", icon: "⌚", color: .purple) {
            sciRow(stat: "Cao 2022 (JAMA Cardiol) — Apple Watch validation", detail: "Apple Watch VO₂max algorithm: heart rate during an outdoor walk/run + GPS speed + user demographics (age, weight, height, sex); validated against laboratory metabolic carts; accuracy: mean absolute error 4.8–5.6 mL/kg/min (12–15% relative error); most accurate when measured during outdoor running ≥20 min at sustained effort; less accurate during walking or short bouts; requires GPS signal and Location Services")
            sciRow(stat: "Bassett & Howley 2000 (non-lab estimation methods)", detail: "Submaximal estimation protocols: VO₂max can be estimated from submaximal HR at a given workload using Astrand nomogram (1954); 12-min Cooper test (distance run): VO₂max ≈ (d − 504.9) / 44.73; 1-mile walk test (Rockport): validated ±10%; beep test (20-m shuttle run) error ±3.5 mL/kg/min in youth; all non-lab methods underestimate in elite athletes and overestimate in unfit individuals vs gold standard")
            sciRow(stat: "Arena 2007 (Circulation)", detail: "VO₂max norms and clinical thresholds: VO₂peak <14 mL/kg/min = Class D heart failure, poor prognosis, transplant consideration; <17.5 = severe functional limitation; 17.5–25 = moderate limitation; >25 = mild to no limitation; healthy male aged 40: average 38–42 mL/kg/min; female: 32–36; 'superior' fitness (>97th percentile): men >52, women >44 at age 40; competitive endurance athlete benchmark: men ≥60, women ≥55")
            sciRow(stat: "Scharhag-Rosenberger 2012 (J Sports Sci)", detail: "Trainability genetics: VO₂max trainability varies 3–10× between individuals with identical training; HERITAGE Family Study found 10-25% improvement in some subjects vs <5% in others on the same 20-week aerobic program; heritability of VO₂max ~50%; ACTN3, ACE gene variants partially explain response; 'high responders' are NOT identifiable from baseline VO₂max — low baseline performers can be high responders; genetics explains variability but does NOT excuse low fitness levels")
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
        guard let vo2Type = HKObjectType.quantityType(forIdentifier: .vo2Max) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [vo2Type])) != nil else {
            isLoading = false; return
        }

        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: vo2Type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let unit = HKUnit(from: "ml/kg*min")
        let latest = samples.first?.quantity.doubleValue(for: unit) ?? 0

        await MainActor.run {
            self.currentVO2Max = latest
            self.isLoading = false
        }
    }
}
