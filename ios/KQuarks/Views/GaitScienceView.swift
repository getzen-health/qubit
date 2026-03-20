import SwiftUI
import HealthKit

struct GaitScienceView: View {
    @State private var avgDoubleSupportTime: Double = 0
    @State private var avgStrideLength: Double = 0
    @State private var avgWalkingSpeed: Double = 0
    @State private var avgAsymmetry: Double = 0
    @State private var weeklySteps: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    private var walkingSpeedColor: Color {
        if avgWalkingSpeed >= 1.0 { return .green }
        if avgWalkingSpeed >= 0.8 { return .orange }
        return .red
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                gaitStatsRow
                weeklyStepsChart
                gaitAsMortalityCard
                biomechanicsCard
                fallRiskCard
                neurologicalMarkersCard
            }
            .padding()
        }
        .navigationTitle("Gait Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var gaitStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgWalkingSpeed > 0 ? String(format: "%.2f", avgWalkingSpeed) + " m/s" : "--", label: "Walking Speed", color: walkingSpeedColor)
                statCard(value: avgAsymmetry > 0 ? String(format: "%.1f", avgAsymmetry) + "%" : "--", label: "Gait Asymmetry", color: avgAsymmetry > 5 ? .orange : .green)
                statCard(value: avgDoubleSupportTime > 0 ? String(format: "%.0f", avgDoubleSupportTime * 100) + "%" : "--", label: "Double Support", color: .blue)
            }
            HStack {
                Circle().fill(walkingSpeedColor).frame(width: 10, height: 10)
                Text(avgWalkingSpeed >= 1.0 ? "Walking speed: normal range (≥1.0 m/s)" :
                     avgWalkingSpeed >= 0.8 ? "Walking speed: borderline — Studenski 2011 clinical threshold 0.8 m/s" :
                     "Walking speed: below clinical threshold — evaluate fall risk")
                    .font(.caption).foregroundColor(walkingSpeedColor)
            }
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title3).bold().foregroundColor(color)
            Text(label).font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Weekly Steps Chart
    private var weeklyStepsChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Step Count (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklySteps.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklySteps[i] / maxVal) * 80 : 4
                    let steps = weeklySteps[i]
                    VStack(spacing: 2) {
                        if steps > 0 {
                            Text(steps >= 1000 ? "\(Int(steps/1000))k" : "\(Int(steps))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(steps >= 70000 ? Color.green : steps >= 50000 ? Color.orange : Color.red)
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            Text("Green ≥70k/wk • Orange 50–69k • Red <50k (WHO: 150 min moderate activity/week)").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var gaitAsMortalityCard: some View {
        scienceCard(title: "Walking Speed as Vital Sign", icon: "🚶", color: .green) {
            sciRow(stat: "Studenski 2011 (JAMA)", detail: "Walking speed predicts survival as accurately as age, sex, comorbidities and hospitalizations combined; each 0.1 m/s faster → ~12% lower 10-year mortality risk in adults ≥65; clinical threshold 0.8 m/s distinguishes high vs. low risk")
            sciRow(stat: "Fritz 2009", detail: "Minimum clinically important difference (MCID) for walking speed: 0.06–0.10 m/s; <0.8 m/s classifies as 'limited community ambulation'; 1.2 m/s = typical street-crossing speed safely before signal changes")
            sciRow(stat: "Weir 2016", detail: "10,000 steps/day target: cadence ≥100 steps/min defines moderate-intensity walking (3 METs); Tudor-Locke 2011: 7,500–9,999 steps/day = somewhat active; <5,000 steps/day = sedentary lifestyle classification")
            sciRow(stat: "Pamoukdjian 2018", detail: "Gait speed in oncology: <0.8 m/s predicts chemotherapy toxicity (OR 2.56) and 1-year mortality in patients ≥65; gait speed test (4-meter or 6-meter) now recommended as standard frailty screen in geriatric oncology")
        }
    }

    private var biomechanicsCard: some View {
        scienceCard(title: "Gait Biomechanics", icon: "🦴", color: .blue) {
            sciRow(stat: "Perry 1992", detail: "Normal gait cycle: 60% stance (40% loading response + 20% single support + 40% terminal stance) and 40% swing; stride length 1.4–1.6 m, cadence 100–130 steps/min, speed = 0.5 × stride length × cadence")
            sciRow(stat: "Lee 2010", detail: "Ground reaction force (GRF) during walking: first peak ~1.1 BW (loading), valley ~0.7 BW (mid-stance), second peak ~1.1 BW (push-off); reduced push-off peak in elderly is the primary mechanism of slowed gait speed")
            sciRow(stat: "Dingwell 2011", detail: "Gait variability: stride-to-stride variation in timing (CV >3%) and length (CV >4%) predicts fall risk independently of mean speed; irregular gait is driven by central pattern generator dysfunction, not purely mechanical")
            sciRow(stat: "Hreljac 2004", detail: "Walk-to-run transition: occurs at ~2.1 m/s in adults; driven by metabolic efficiency crossover — running becomes more efficient above this speed; oxygen cost of walking increases as (speed)² while running increases linearly above 2.5 m/s")
        }
    }

    private var fallRiskCard: some View {
        scienceCard(title: "Fall Risk & Prevention", icon: "⚠️", color: .orange) {
            sciRow(stat: "Lord 2007", detail: "Falls account for 35–40% of all injury deaths in adults ≥65; fear of falling affects 55% of fallers; gait speed <1.0 m/s + TUG >12 s + history of fall = 78% 1-year fall probability; gait speed alone is the single best predictor")
            sciRow(stat: "Gillespie 2012 (Cochrane)", detail: "Most effective fall prevention: group exercise with balance and strength training reduces falls by 34% (RR 0.66, 29 RCTs); vitamin D reduces falls 17% in deficient adults; home safety interventions reduce 19% in those with fall history")
            sciRow(stat: "Timed Up and Go (TUG)", detail: "Podsiadlo 1991: TUG test (rise from chair, walk 3 m, turn, return, sit) — ≤10 s = normal, 11–20 s = moderate impairment, >20 s = high fall risk; ≤14 s predicts community ambulation; >24 s predicts supervision needed")
            sciRow(stat: "Sherrington 2017", detail: "Exercise prescription for fall prevention: ≥3h/week total exercise including balance challenging activities; Tai Chi reduces fall rate 45%; Nordic walking poles reduce fall incidence 67% in high-risk elderly; dual-tasking training (walking while counting) improves divided attention during gait")
        }
    }

    private var neurologicalMarkersCard: some View {
        scienceCard(title: "Neurological Gait Markers", icon: "🧠", color: .purple) {
            sciRow(stat: "Lord 2013", detail: "Gait asymmetry >5% predicts dementia onset 7–12 years earlier than clinical diagnosis; double support time >30% of gait cycle indicates central nervous system decline; step width variability is the most sensitive marker of cerebellar ataxia")
            sciRow(stat: "Montero-Odasso 2012", detail: "Dual-task gait: measuring gait while counting backward reveals executive function deficits invisible in normal gait; healthy aging causes 5–8% speed reduction dual-task; MCI causes 15–20% reduction — 'stops walking when talking' sign is 83% specific for MCI")
            sciRow(stat: "Verghese 2002", detail: "Parkinson's disease gait markers: step length variability >8%, freezing of gait, festination; freezing triggered by narrow doorways, turns, dual-task; rhythmic auditory stimulation (RAS) at gait cadence reduces freezing episodes 36%")
            sciRow(stat: "Wrisley 2006", detail: "Dynamic Gait Index (DGI): 8-item scale assessing gait with head turns, obstacles, stairs; DGI <19/24 predicts falls in community-dwelling adults; iPhone gyroscope data from Apple Watch correlates r = 0.82 with lab-grade gait analysis (Kluge 2017)")
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

        let speedType = HKObjectType.quantityType(forIdentifier: .walkingSpeed)!
        let asymType = HKObjectType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!
        let dblSupportType = HKObjectType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!
        let stepType = HKObjectType.quantityType(forIdentifier: .stepCount)!

        guard (try? await store.requestAuthorization(toShare: [], read: [speedType, asymType, dblSupportType, stepType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        // Walking speed
        let speed = await fetchLatestQuantity(type: speedType, predicate: predicate, unit: HKUnit.meter().unitDivided(by: .second()))
        let asym = await fetchLatestQuantity(type: asymType, predicate: predicate, unit: .percent())
        let dblSupport = await fetchLatestQuantity(type: dblSupportType, predicate: predicate, unit: .percent())

        // Weekly steps
        var weekly = Array(repeating: 0.0, count: 8)
        let stepSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: stepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }
        let now = Date()
        for sample in stepSamples {
            let weeksAgo = Int(now.timeIntervalSince(sample.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += sample.quantity.doubleValue(for: .count()) }
        }

        await MainActor.run {
            self.avgWalkingSpeed = speed
            self.avgAsymmetry = asym
            self.avgDoubleSupportTime = dblSupport / 100
            self.weeklySteps = weekly
            self.isLoading = false
        }
    }

    private func fetchLatestQuantity(type: HKQuantityType, predicate: NSPredicate, unit: HKUnit) async -> Double {
        await withCheckedContinuation { continuation in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 10, sortDescriptors: [sort]) { _, samples, _ in
                let values = (samples as? [HKQuantitySample])?.map { $0.quantity.doubleValue(for: unit) } ?? []
                continuation.resume(returning: values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count))
            }
            store.execute(query)
        }
    }
}
