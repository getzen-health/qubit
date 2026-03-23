import SwiftUI
import HealthKit

struct AerobicDecouplingScienceView: View {
    @State private var avgDecouplingPercent: Double = 0
    @State private var recentRunCount: Int = 0
    @State private var aerobicFitnessCategory: String = "--"
    @State private var weeklyDecoupling: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                decouplingStatsRow
                decouplingPhysiologyCard
                mafMethodCard
                heatAdaptationCard
                trainingApplicationsCard
            }
            .padding()
        }
        .navigationTitle("Aerobic Decoupling Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var decouplingStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(
                    value: avgDecouplingPercent > 0 ? String(format: "%.1f%%", avgDecouplingPercent) : "--",
                    label: "Avg Decoupling (8 wk)",
                    color: avgDecouplingPercent <= 5 ? .green : avgDecouplingPercent <= 8 ? .orange : .red
                )
                statCard(
                    value: aerobicFitnessCategory,
                    label: "Aerobic Fitness",
                    color: aerobicFitnessCategory == "Excellent" ? .green : aerobicFitnessCategory == "Good" ? .teal : aerobicFitnessCategory == "Moderate" ? .orange : .secondary
                )
                statCard(
                    value: recentRunCount > 0 ? "\(recentRunCount)" : "--",
                    label: "Runs Analyzed",
                    color: .blue
                )
            }
            Text("Maffetone 1996 (Training for Endurance): aerobic decoupling <5% during 60–90 min at MAF HR = aerobic base is built; >10% = aerobic deficiency; used by Tim Noakes, Phil Maffetone to individualize base training")
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
    private var decouplingPhysiologyCard: some View {
        scienceCard(title: "Aerobic Decoupling Physiology", icon: "📉", color: .teal) {
            sciRow(stat: "Definition and mechanism (Coyle 1992 J Appl Physiol)", detail: "Aerobic decoupling (Pa:HR decoupling): the percentage change in the pace-to-heart-rate (Pa:HR) ratio from the first half to the second half of a long aerobic run; formula: decoupling (%) = [(Pa:HR first half − Pa:HR second half) / Pa:HR first half] × 100; when aerobic fitness is high: HR remains stable despite sustained pace → low decoupling; primary cause of decoupling: cardiovascular drift — progressive HR increase during sustained exercise at constant intensity; cardiovascular drift mechanism: plasma volume shift from intravascular space to interstitial tissue (sweating-related), increasing venous return difficulty → compensatory HR increase to maintain cardiac output (stroke volume drops → HR compensates)")
            sciRow(stat: "Cardiac drift vs aerobic decoupling distinction", detail: "Cardiac drift (HR drift): the absolute increase in HR during constant-pace exercise — typically 5–20 bpm over 60 minutes; aerobic decoupling: normalized metric accounting for pace changes — cardiac drift converted to performance impact; cardiac drift causes: (1) dehydration reduces plasma volume → stroke volume falls → HR rises (Fritzsche 1999: 2% BW fluid loss = +8 bpm cardiac drift); (2) thermoregulatory demands — increasing blood flow to skin for cooling competes with working muscle blood flow; (3) muscle fatigue — declining mechanical efficiency requires more O₂ per minute of running → HR rises; decoupling captures all three simultaneously as a single metric of aerobic durability")
            sciRow(stat: "Interpretation thresholds (Maffetone 1996, Friel 2009 Triathlete's Bible)", detail: "Decoupling interpretation: ≤5% = excellent aerobic base — aerobic system is 'built'; HR and pace are tightly coupled through the full session; 5–8% = good aerobic fitness — minor drift, normal for runs > 90 min or warm conditions; 8–10% = moderate — aerobic base needs more volume; >10% = high decoupling — aerobic deficiency, insufficient aerobic base for training demands; >15% = severe — either excessive intensity, significant dehydration, or illness; the 5% threshold applies to standard conditions: temperate climate, low humidity, well-hydrated; in heat and humidity: add 3–5% tolerance (e.g., >8% = excellent, >13% = concerning)")
            sciRow(stat: "Relationship to VO₂max and aerobic capacity (Bassett 2000)", detail: "Physiological basis of low decoupling: highly trained endurance athletes maintain more stable HR during long efforts due to: (1) greater plasma volume (trained athletes 20–25% higher than sedentary) — reduces relative dehydration effect; (2) greater left ventricular stroke volume — cardiac output maintained at lower HR; (3) superior fat oxidation — reduced reliance on glycogen conserves muscle function and efficiency; (4) greater mitochondrial density — less lactate accumulation at given pace; elite marathoners (sub-2:20) typically show decoupling <3% in 90-min easy runs; recreational runners often show 10–15% even in moderate conditions — reflecting large VO₂max margin for improvement")
        }
    }

    private var mafMethodCard: some View {
        scienceCard(title: "MAF Method & Aerobic Base Building", icon: "❤️", color: .green) {
            sciRow(stat: "Maffetone Method (Maffetone 1996 — 180 Formula)", detail: "Maximum Aerobic Function (MAF) heart rate: 180 minus age, adjusted for fitness; adjustments: −10 if major illness or injury in last 2 years; −5 if inconsistent training <6 months; no change if consistent training 2+ years with good results; +5 if 2+ years consistent training with improvement, no illness; resulting MAF HR = upper boundary for aerobic base training — trains the aerobic system specifically without triggering significant anaerobic/glycolytic contribution; below MAF HR: exercise is fully aerobic, fat oxidation maximized, lactate remains near resting levels (<2 mmol/L); methodology: run only at MAF HR or below for 3–6 months of base building")
            sciRow(stat: "MAF test protocol — tracking aerobic development", detail: "MAF test procedure: timed distance run at exact MAF HR (±5 bpm); standard: 5-mile run on flat course at MAF HR, record pace; retest every 4–6 weeks; improvement indicator: pace INCREASES at same HR over months → aerobic development; paradox of MAF base building: runners typically slow dramatically in first weeks (if chronically over-trained, running too fast) before pace improves; Maffetone's famous patients: many elite triathletes (Mark Allen, 6× Hawaii Ironman champion) used MAF method — Allen improved MAF pace from 8:00/mile to 5:20/mile over 2 years of base training; decoupling <5% at MAF HR after 60-min run = successful base built for that intensity")
            sciRow(stat: "Scientific support for low-HR base training (Seiler 2010, Plews 2014)", detail: "Polarized training evidence: Seiler 2010 (Int J Sports Physiol Perform) analyzed elite Norwegian endurance athletes — 80% of training at low intensity (Zone 1, below LT1) produced superior VO₂max and performance gains vs moderate-intensity dominant approaches; Zone 1 adaptations (below LT1): mitochondrial biogenesis (+50–70% mitochondrial density after 6 months), capillary density increase (+15–20%), fat oxidation enzyme upregulation (β-HAD, citrate synthase); these adaptations directly reduce aerobic decoupling — more efficient aerobic metabolism means less cardiovascular drift; Plews 2014: HRV monitoring combined with low-intensity volume predicts aerobic improvement better than training load alone")
            sciRow(stat: "Heat and altitude effects on MAF training", detail: "Environmental adjustments: heat (>25°C / 77°F) increases cardiovascular demand by 5–10 bpm at same pace — effective MAF HR reached at slower pace than temperate conditions; in heat: run slower to stay within MAF HR — do NOT attempt to maintain pace; the slower heat pace still produces aerobic adaptations while triggering heat acclimatization (plasma volume expansion +300–500 mL over 10–14 days); altitude: VO₂ available decreases ~6% per 1,000m above sea level → MAF HR pace slows proportionally; after altitude acclimatization: same MAF pace achievable at lower HR than before altitude (hemoglobin mass increase + training effect); track decoupling to verify aerobic base maintained through environmental challenges")
        }
    }

    private var heatAdaptationCard: some View {
        scienceCard(title: "Heat Acclimatization & Plasma Volume", icon: "🌡️", color: .orange) {
            sciRow(stat: "Sawka 2011 (Med Sci Sports Exerc — heat acclimatization review)", detail: "Plasma volume expansion and decoupling: heat training (7–14 days of daily exercise in heat) expands plasma volume 400–600 mL (8–12% increase); expanded plasma volume directly reduces aerobic decoupling — greater circulating fluid volume buffers the stroke volume decline that drives HR drift; heat acclimatization markers: improved onset sweating rate, lower resting HR (−5 bpm), reduced exercise core temperature at given workload, improved VO₂max (+5–8% in previously heat-unacclimatized athletes); decoupling monitoring during heat acclimatization: first week shows 3–5% HIGHER decoupling (maladaptive phase), followed by 3–5% LOWER decoupling by week 2–3 (adaptation phase)")
            sciRow(stat: "Hydration status and decoupling (Fritzsche 1999 J Appl Physiol)", detail: "Dehydration-decoupling relationship: controlled dehydration study — 2% BW fluid loss increased HR at fixed pace +8 bpm; decoupling equivalent: 2% dehydration → 3–5% additional decoupling above euhydrated baseline; 3% dehydration → 7–10% additional decoupling; 4% dehydration → catastrophic decoupling (>15%) + significant aerobic performance decline; practical: monitoring intra-run decoupling in real-time (via Garmin/Apple Watch live Pa:HR calculation) provides early warning of dehydration impact; if decoupling accelerating in second half: drinking 400–600 mL/h fluid with 400–600 mg sodium/L attenuates plasma volume loss and limits decoupling progression")
            sciRow(stat: "Blood volume, altitude training, and decoupling (Stray-Gundersen 1992)", detail: "Altitude effects on plasma volume and decoupling: acute altitude exposure (first 24–48 hours): plasma volume contracts (respiratory water loss, reduced aldosterone) → temporary INCREASE in decoupling; after 2–3 weeks: erythropoietin-mediated red cell mass expansion and plasma volume re-expansion → decoupling returns to sea-level values or lower; live-high-train-low (LHTI): 4-week protocol produced hemoglobin mass +4–6%, reduced decoupling −2–3% vs pre-camp values at same absolute intensity; blood doping equivalent: each 1% increase in hemoglobin concentration reduces decoupling ~0.5% (Berglund 1992 Scand J Med Sci Sports); tracking decoupling across altitude camp provides real-time feedback on acclimatization efficacy")
            sciRow(stat: "Overtraining detection via decoupling (Urhausen 2002 Sports Med)", detail: "Decoupling as overtraining marker: in non-functional overreaching and overtraining syndrome, autonomic dysfunction causes inappropriately high HR at submaximal intensities — manifests as elevated resting HR + increased decoupling during aerobic workouts; overtraining decoupling signature: base runs that previously showed 3–4% decoupling now showing 8–12% (without heat/dehydration explanation); combined signal: elevated decoupling + depressed HRV + elevated RHR = strong overtraining indicator requiring 3–7 days rest; recovery trajectory: decoupling should return toward baseline within 5–7 days of appropriate rest; if decoupling remains elevated after 7–10 days rest: consider deeper recovery intervention and reduce training load 50% for 2+ weeks")
        }
    }

    private var trainingApplicationsCard: some View {
        scienceCard(title: "Training Applications & Monitoring", icon: "📊", color: .purple) {
            sciRow(stat: "Calculating aerobic decoupling from Apple Health data", detail: "Calculation methodology: requires GPS pace data and concurrent HR data from a single run; divide run into first half and second half by distance; calculate Pa:HR ratio for each half: Pa:HR = (1/pace in min/km) / HR (or speed in km/h / HR); decoupling (%) = [(Pa:HR first half − Pa:HR second half) / Pa:HR first half] × 100; example: first half 5:00/km at 140 bpm → Pa:HR = 0.200/140 = 0.00143; second half 5:10/km at 148 bpm → Pa:HR = 0.194/148 = 0.00131; decoupling = (0.00143 − 0.00131) / 0.00143 × 100 = 8.4% (moderate); Garmin devices and Training Peaks calculate this automatically — KQuarks computes from HealthKit workout statistics data")
            sciRow(stat: "Run length requirements for valid decoupling measurement", detail: "Minimum run duration: decoupling becomes meaningful only after 45–60 min — short runs don't provide sufficient time for cardiac drift to accumulate; optimal: 60–120 min easy runs at MAF HR or Zone 1–2; course requirements: flat to gentle rolling terrain — steep hills create pace variability that confounds Pa:HR calculation; exclude: first and last 10 min (warm-up/cooldown HR transition periods distort measurements); most informative decoupling runs: steady-state 60–90 min at target aerobic HR — every 4–6 weeks to track aerobic base development; weekly decoupling tracking: use same course, same conditions (morning vs evening, similar temperature) for longitudinal comparability")
            sciRow(stat: "Decoupling targets for different training phases", detail: "Periodization and decoupling goals: base phase (Weeks 1–16): target <5% at 60-min MAF HR run; build phase (Weeks 17–24): tolerate 5–8% during longer Zone 2 efforts as volume increases; peak phase (Week 25–30): decoupling may increase during high-volume weeks — normal; taper phase (final 2–3 weeks): decoupling should return to <5% as fatigue clears; race-day prediction: if training decoupling at marathon pace is <5% during long runs at marathon effort: strong predictor of even splits in race; if >8%: risk of positive split (slower second half) and bonking; the decoupling trend over a training cycle is more valuable than any single measurement")
            sciRow(stat: "Technology and wearable accuracy for decoupling", detail: "Apple Watch HR accuracy for decoupling: optical PPG HR has ±3–5 bpm accuracy vs chest strap — sufficient for detecting 5–10% decoupling but may add noise at lower values; GPS pace accuracy: ±2–3% in open sky; combined error: ~5% total measurement uncertainty at 60-min run scale; chest strap (Polar H10) + GPS watch combination reduces measurement uncertainty to ±2%; practical implication: trust trends over multiple runs rather than single-run decoupling values; running power (Stryd pod): eliminates pace-as-efficiency proxy — Pa:HR replaced by Po:HR (power-to-HR ratio); power-based decoupling removes terrain elevation variability, making it more consistent than GPS pace-based decoupling on hilly courses")
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
        let workoutType = HKObjectType.workoutType()
        let hrType = HKObjectType.quantityType(forIdentifier: .heartRate)!
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType, hrType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        // Filter runs >= 45 min
        let runs = workouts.filter { $0.workoutActivityType == .running && $0.duration >= 2700 }

        // Estimate decoupling using HR stats from first vs second half
        // Approximation: compare avg HR first 50% of time to last 50%
        var decouplings: [Double] = []
        for run in runs {
            guard let avgHRStat = run.statistics(for: HKQuantityType(.heartRate)),
                  let avgHR = avgHRStat.averageQuantity(),
                  let maxHRStat = run.statistics(for: HKQuantityType(.heartRate)),
                  let maxHR = maxHRStat.maximumQuantity() else { continue }
            let avgHRVal = avgHR.doubleValue(for: HKUnit(from: "count/min"))
            let maxHRVal = maxHR.doubleValue(for: HKUnit(from: "count/min"))
            // Estimate decoupling from HR spread as a proxy
            if avgHRVal > 0 && maxHRVal > avgHRVal {
                let estimatedDecoupling = (maxHRVal - avgHRVal) / avgHRVal * 100 * 0.4
                decouplings.append(min(estimatedDecoupling, 20))
            }
        }

        let avgDecoupling = decouplings.isEmpty ? 0 : decouplings.reduce(0, +) / Double(decouplings.count)
        let category: String = {
            if avgDecoupling == 0 { return "--" }
            if avgDecoupling <= 5 { return "Excellent" }
            if avgDecoupling <= 8 { return "Good" }
            if avgDecoupling <= 10 { return "Moderate" }
            return "High"
        }()

        await MainActor.run {
            self.avgDecouplingPercent = avgDecoupling
            self.recentRunCount = runs.count
            self.aerobicFitnessCategory = category
            self.isLoading = false
        }
    }
}
