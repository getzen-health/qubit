import SwiftUI
import HealthKit

struct HeartRateRecoveryScienceView: View {
    @State private var latestHRR: Double = 0
    @State private var avgRHR: Double = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                hrrStatsRow
                hrrPhysiologyCard
                hrrMortalityCard
                hrrTrainingCard
                hrrPracticalCard
            }
            .padding()
        }
        .navigationTitle("HRR Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var hrrStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: latestHRR > 0 ? "\(Int(latestHRR)) bpm" : "--", label: "Latest HRR1", color: latestHRR >= 20 ? .green : latestHRR >= 12 ? .orange : .red)
                statCard(value: latestHRR > 0 ? hrrCategory(latestHRR) : "--", label: "HRR Category", color: latestHRR >= 20 ? .green : latestHRR >= 12 ? .orange : .red)
                statCard(value: avgRHR > 0 ? "\(Int(avgRHR)) bpm" : "--", label: "Resting HR", color: avgRHR <= 60 ? .green : avgRHR <= 75 ? .orange : .red)
            }
            Text("Cole 1999 (NEJM): HRR ≤12 bpm at 1 min post-exercise = 4× higher 6-year mortality — a stronger predictor than resting HR, peak HR, or exercise capacity alone")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private func hrrCategory(_ hrr: Double) -> String {
        if hrr >= 25 { return "Excellent" }
        if hrr >= 20 { return "Good" }
        if hrr >= 12 { return "Normal" }
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
    private var hrrPhysiologyCard: some View {
        scienceCard(title: "HRR Physiology & Mechanisms", icon: "💓", color: .red) {
            sciRow(stat: "Imai 1994 (Lancet) — the foundational paper", detail: "HRR defined: heart rate recovery at 1 min (HRR1) = peak exercise HR − HR at 1 min post-exercise in cool-down; first demonstration that HRR is mediated primarily by parasympathetic (vagal) reactivation, not sympathetic withdrawal; vagal reactivation is faster in trained individuals; HRR2 (2-min recovery) reflects both vagal reactivation AND sympathetic withdrawal; HRR1 is the 'pure' vagal marker; the speed of vagal reactivation correlates with overall parasympathetic tone and HRV at rest")
            sciRow(stat: "Hautala 2003 (Am J Physiol)", detail: "HRR and autonomic balance: post-exercise vagal reactivation rate is determined by the balance between parasympathetic reactivation speed and sympathetic withdrawal; high-fit individuals reactivate vagal tone 40% faster than untrained at the same %VO₂max effort; exercise training shifts the autonomic set point toward higher resting parasympathetic tone — the mechanism linking HRR improvement to mortality reduction; HRR improves before VO₂max in early training phases, making it an early adaptaion indicator")
            sciRow(stat: "Daanen 2012 (Sports Med)", detail: "What HRR reflects: HRR1 primarily = parasympathetic reactivation rate; HRR2-5 = combination of vagal recovery, sympathetic withdrawal, and plasma catecholamine clearance; HRR improves with: aerobic training, sleep, hydration, low stress, no recent URTI; HRR is acutely sensitive — a 5+ bpm reduction from personal baseline on any given day indicates incomplete recovery, overreaching, illness, or dehydration; daily HRR tracking predicts performance readiness better than HRV alone in athletes")
            sciRow(stat: "Pierpont 2000 (Am Heart J)", detail: "HRR measurement methods: 'slow recovery' method: passive stand or sit after test; 'active recovery' method: light walking; HRR is 3–8 bpm higher with active vs passive recovery — standardize the method; Apple Watch estimates HRR after outdoor workouts using optical HR sensor; clinical standard: Bruce protocol treadmill → 1 min passive standing recovery; HRR <12 bpm at 1 min (passive) = abnormal; <18 bpm (active) = abnormal per AHA guidelines")
        }
    }

    private var hrrMortalityCard: some View {
        scienceCard(title: "HRR & Cardiovascular Mortality", icon: "📊", color: .orange) {
            sciRow(stat: "Cole 1999 (NEJM)", detail: "Landmark study: 9,454 patients undergoing exercise treadmill testing; HRR ≤12 bpm at 1 min (passive) had 4× higher 6-year all-cause mortality vs HRR >12; after adjusting for VO₂max, exercise workload, and traditional risk factors — HRR remained independently predictive; HRR predicted mortality more strongly than VO₂max alone in patients with known CAD; HRR <12 bpm in an asymptomatic person should trigger cardiac evaluation — a clinical red flag")
            sciRow(stat: "Nishime 2000 (JAMA)", detail: "12-year follow-up of 5,234 patients: HRR ≤18 bpm at 2 min post-exercise = 2.6× higher 12-year all-cause mortality; remains predictive after adjusting for left ventricular function, ST-segment changes, and exercise capacity; HRR risk is linear — every 10 bpm improvement in HRR reduces mortality risk 15–20%; HRR predicts events in populations without known heart disease, not just cardiac patients")
            sciRow(stat: "Morshedi-Meibodi 2002 (Circulation)", detail: "Framingham Heart Study — 3,837 men and women without CVD: poor HRR (≤42 bpm at 2 min) associated with 2× higher 8-year CVD events vs good HRR (>62 bpm); HRR was a better predictor of incident CVD than Framingham Risk Score alone; adding HRR to standard risk models improved C-statistic 0.04 (clinically meaningful reclassification); HRR is now considered an independent CVD risk factor in major cardiology guidelines (AHA/ACC)")
            sciRow(stat: "Shetler 2001 (J Am Coll Cardiol)", detail: "HRR vs ST changes: in 2,428 patients with suspected CAD — HRR provided additional prognostic information beyond ST depression; patients with both abnormal ST and abnormal HRR had 8× higher mortality than those with neither; abnormal HRR identifies autonomic dysfunction, a mechanism distinct from ischemia; the combination of HRR + VO₂max is the most powerful non-invasive cardiac risk stratification tool available without catheterization")
        }
    }

    private var hrrTrainingCard: some View {
        scienceCard(title: "Improving HRR with Training", icon: "📈", color: .green) {
            sciRow(stat: "Pichot 2000 (J Appl Physiol)", detail: "Training-induced HRR improvement: 5-week intensified training followed by 3-week taper in elite runners — HRR1 improved 8 bpm during taper (supercompensation); HRR tracks training adaptation more sensitively than resting HR; in previously sedentary individuals, 8–12 weeks of aerobic training improves HRR1 5–10 bpm; the improvement is mediated by increased vagal tone — measurable as increased HRV during HRR tracking period")
            sciRow(stat: "Jouven 2005 (NEJM)", detail: "Exercise-induced HRR improvement: prospective study of 5,713 asymptomatic working men: baseline HRR predicted 23-year CHD mortality independently; men in the highest HRR quartile had 50% lower CHD mortality vs lowest quartile; the high-HRR group was more aerobically fit, but the association held after VO₂max adjustment — supporting direct autonomous mechanism; improving HRR is a physiologically valid target for cardiovascular risk reduction")
            sciRow(stat: "Lamberts 2011 (Int J Sports Physiol Perf)", detail: "HRR as training readiness marker: daily HRR measurement in elite cyclists — HRR1 below 5-day personal average = 80% sensitivity for detecting overtraining or illness; HRR is more sensitive than resting HR for detecting daily recovery status; combining HRR with morning resting HR provides 91% sensitivity; HRR improves with adequate sleep, hydration, and tapered training — practical daily feedback loop for load management")
            sciRow(stat: "Yamamoto 2001 (Med Sci Sports Exerc)", detail: "HIIT and HRR: high-intensity interval training (4× 4 min at 90% HRmax) improves HRR1 faster than moderate continuous training — 7 bpm improvement in 8 weeks vs 4 bpm for moderate; HIIT maximally stresses the vagal reactivation system, driving faster adaptation; yoga and meditation also improve HRR via direct vagal tone enhancement (Bhattacharya 2022: pranayama improves HRR1 6 bpm in 8 weeks); HRR improvement = cardiac autonomic health improvement")
        }
    }

    private var hrrPracticalCard: some View {
        scienceCard(title: "HRR Monitoring & Clinical Use", icon: "⌚", color: .blue) {
            sciRow(stat: "Apple Watch HRR measurement", detail: "Post-workout HRR tracking: Apple Watch estimates HRR using optical HR sensor in the 1–3 min cool-down after outdoor runs and walks with GPS; accuracy: ±3–5 bpm vs ECG-based measurement; displayed in the Fitness app under 'Heart Rate Recovery'; Apple's algorithm uses 1-min active recovery (walking) post-workout; clinical normal reference: ≥18 bpm at 1 min during active recovery; ≥22 bpm is associated with excellent cardiovascular fitness and low CVD risk")
            sciRow(stat: "Clinical interpretation guidelines", detail: "HRR classification (passive recovery, 1 min): >25 bpm = excellent; 20–25 = good; 12–19 = normal; <12 bpm = abnormal (cardiac evaluation warranted if sustained); HRR classification (active recovery, 1 min): >22 bpm = excellent; 18–22 = good; <18 bpm = suboptimal; factors reducing HRR: heat, dehydration, caffeine withdrawal, sleep deprivation, acute illness, overtraining; factors improving HRR acutely: cool environment, good hydration, full recovery; track trends over weeks, not single values")
            sciRow(stat: "Heart Rate Reserve and Karvonen zones", detail: "Heart rate reserve (HRR) is DIFFERENT from Heart Rate Recovery: reserve = HRmax − RHR (used for training zone calculation via Karvonen formula); recovery = post-exercise drop in HR at 1 min (the mortality predictor); both are abbreviated HRR — Karvonen: target HR = RHR + (HRmax − RHR) × intensity%; Zone 1 = 50–60%, Z2 = 60–70%, Z3 = 70–80%, Z4 = 80–90%, Z5 = 90–100%; higher heart rate reserve = greater aerobic fitness range = more training intensity range available")
            sciRow(stat: "Laukkanen 2018 (JAMA Internal Med)", detail: "Sauna and HRR: 4–7 sauna sessions/week (at 80°C, 20 min) reduces all-cause mortality 40% and CVD mortality 50% in 20-year follow-up (Finnish Sauna study, N=2,315 men); mechanism includes improved autonomic balance, HRR, and reduced arterial stiffness; sauna acutely increases HR to 100–150 bpm (moderate exercise equivalent), followed by rapid HR recovery in cool-down; regular sauna training increases HRR1 similar to aerobic exercise; sauna + aerobic exercise produce additive HRR improvement")
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
        guard let rhrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate),
              let hrrType = HKObjectType.quantityType(forIdentifier: .heartRateRecoveryOneMinute) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [rhrType, hrrType])) != nil else {
            isLoading = false; return
        }

        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let bpm = HKUnit.count().unitDivided(by: .minute())

        let hrrSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: hrrType, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        let rhrSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: rhrType, predicate: nil, limit: 7, sortDescriptors: [sort]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        let latestHRR = hrrSamples.first?.quantity.doubleValue(for: bpm) ?? 0
        let avgRHR = rhrSamples.isEmpty ? 0 : rhrSamples.map { $0.quantity.doubleValue(for: bpm) }.reduce(0, +) / Double(rhrSamples.count)

        await MainActor.run {
            self.latestHRR = latestHRR
            self.avgRHR = avgRHR
            self.isLoading = false
        }
    }
}
