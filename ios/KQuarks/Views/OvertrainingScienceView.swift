import SwiftUI
import HealthKit

struct OvertrainingScienceView: View {
    @State private var avgHRV: Double = 0
    @State private var avgRHR: Double = 0
    @State private var weeklyWorkouts: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                recoveryStatsRow
                weeklyVolumeChart
                otsDiagnosisCard
                mechanismsCard
                monitoringCard
                recoveryProtocolCard
            }
            .padding()
        }
        .navigationTitle("Overtraining Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var recoveryStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgHRV > 0 ? String(format: "%.0f", avgHRV) + "ms" : "--", label: "Avg HRV (SDNN)", color: avgHRV >= 50 ? .green : avgHRV >= 30 ? .orange : .red)
                statCard(value: avgRHR > 0 ? "\(Int(avgRHR))" : "--", label: "Resting HR", color: avgRHR <= 60 ? .green : avgRHR <= 75 ? .orange : .red)
                let recentVsPast = weeklyWorkouts.isEmpty ? 0.0 : weeklyWorkouts.prefix(1).reduce(0, +) / max(weeklyWorkouts.dropFirst().prefix(4).reduce(0, +) / 4.0, 1)
                statCard(value: recentVsPast > 0 ? String(format: "%.1f", recentVsPast) + "×" : "--", label: "Recent vs 4-wk Avg", color: recentVsPast > 1.5 ? .red : recentVsPast > 1.2 ? .orange : .green)
            }
            HStack {
                Text("Meeusen 2013 (ECSS/ACSM): HRV decrease >5% and RHR increase >7 bpm sustained for 3+ days = early overreaching indicator")
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
    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Workout Count (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyWorkouts.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyWorkouts[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyWorkouts[i] > 0 {
                            Text("\(Int(weeklyWorkouts[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.red.opacity(0.8))
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
    private var otsDiagnosisCard: some View {
        scienceCard(title: "Overtraining Syndrome (OTS) Diagnosis", icon: "⚠️", color: .red) {
            sciRow(stat: "Meeusen 2013 (Med Sci Sports Exerc — ECSS/ACSM consensus)", detail: "OTS diagnostic criteria: unexplained performance decrement lasting ≥2 weeks despite maintained or reduced training + mood disturbance; distinct from functional overreaching (FOR, recovery in days–weeks) and non-functional overreaching (NFOR, recovery in weeks–months); OTS requires months to fully recover; key diagnostic test: hormonal response to two maximal exercise tests 4h apart — blunted GH and cortisol in OTS but not FOR")
            sciRow(stat: "Kreher 2012 (Sports Health)", detail: "Prevalence and timeline: 60–65% of elite endurance athletes experience NFOR or OTS at some point in career; incubation period typically 3–4 weeks of excessive load before symptoms manifest; performance decrements: VO₂max unchanged but submaximal efficiency drops 5–10%; resting HRV decreases 15–25% over weeks before subjective fatigue is apparent — HRV is an early warning system")
            sciRow(stat: "Halson 2004 (Sports Med)", detail: "Subjective indicators (valid diagnostic measures): POMS (Profile of Mood States) total mood disturbance score increases; vigor decreases, fatigue/confusion/depression increase; fatigue:vigor ratio the most sensitive single indicator; RESTQ-Sport questionnaire detects NFOR 1–2 weeks earlier than performance tests; WHY? stress+recovery imbalance precedes cellular dysfunction")
            sciRow(stat: "Petibois 2002", detail: "Biochemical markers: no single biomarker is diagnostic for OTS; panel approach required — sustained ↓HRV, ↑RHR (>5 bpm resting), ↑CK (>3× normal for ≥3 days), ↑cortisol:testosterone ratio (>2 SD from personal baseline), ↑IL-6, ↓ferritin; testosterone:cortisol ratio <30% of baseline is the most discriminating biochemical indicator of symptomatic overtraining")
        }
    }

    private var mechanismsCard: some View {
        scienceCard(title: "Mechanisms of Overtraining", icon: "🔬", color: .orange) {
            sciRow(stat: "Urhausen 2002 (Brit J Sports Med)", detail: "Sympathetic vs parasympathetic OTS: Endurance sports: parasympathetic OTS — bradycardia, low NE at rest, blunted exercise HR response; strength/speed sports: sympathetic OTS — elevated RHR, insomnia, irritability, hyperexcitability; most OTS is parasympathetic in endurance athletes (>80% of cases); these represent distinct neuroendocrine failure patterns requiring different recovery approaches")
            sciRow(stat: "Smith 2000", detail: "Cytokine hypothesis of OTS: repeated muscle damage elevates pro-inflammatory cytokines (IL-1β, IL-6, TNF-α); sustained elevation drives HPA axis dysregulation, reduces insulin-like growth factor signaling, and impairs mood via cytokine action on the brain; training camp cytokine spikes predict 'staleness' syndrome; anti-inflammatory nutrition (omega-3, polyphenols) may blunt this pathway")
            sciRow(stat: "Meeusen 2010", detail: "Central fatigue hypothesis: prolonged training increases brain serotonin (5-HT) relative to dopamine; high 5-HT:DA ratio causes central fatigue, mood depression, and reduced motivation; branched-chain amino acids (BCAA) compete with tryptophan (5-HT precursor) for brain entry — supplementation during ultraendurance delays central fatigue 20–30%; paradoxically, carbohydrate feeding also delays central fatigue by reducing plasma NEFA and free tryptophan")
            sciRow(stat: "Pyne 2014 (Int J Sports Physiol Perf)", detail: "Immune suppression window: intense prolonged exercise causes 'open window' of reduced immunity lasting 3–72h; NK cells and sIgA (mucosal immunity) both suppressed; incidence of upper respiratory tract infection (URTI) increases 2–5× in elite endurance athletes during peak training; preventing OTS requires immunological recovery — adequate sleep + carbohydrate intake + probiotic supplementation (200–300% URTI reduction in athletes)")
        }
    }

    private var monitoringCard: some View {
        scienceCard(title: "Monitoring & Early Detection", icon: "📊", color: .blue) {
            sciRow(stat: "Plews 2013 (Int J Sports Physiol Perf)", detail: "HRV monitoring protocol: measure every morning upon waking (5-min supine or 60-s ultra-short); compare to rolling 7-day average; ≥7% reduction from 7-day average = reduce training intensity that day; downward trend over 5+ consecutive days = reduce load for 48–72h; correlation between HRV7-day trend and performance is r = 0.72 in trained endurance athletes (stronger than single-day HRV)")
            sciRow(stat: "Buchheit 2014 (Int J Sports Physiol Perf)", detail: "HRV4Training concept: smartphone camera photoplethysmography HRV is valid vs chest strap ECG (r = 0.97); practical daily monitoring reduces subjective overreaching episodes 40%; HRV-guided training (train hard on high-HRV days, easy on low-HRV days) produces superior VO₂max gains vs calendar-based training in 9-week RCT; individualized HRV-guided training = the gold standard of personalized load management")
            sciRow(stat: "Foster 1998 (J Strength Cond Res)", detail: "Session RPE method (sRPE): Borg CR-10 scale × session duration (min) = training load in arbitrary units (AU); weekly sRPE load validates well against heart rate-derived TRIMP; monotony = week average load / SD of daily loads (>2.0 = high monotony = injury risk); strain = week load × monotony; these simple calculations predict illness better than HR zones alone in athletes")
            sciRow(stat: "Rønnestad 2022", detail: "Athlete monitoring dashboard: combining HRV + resting HR + sleep quality + sRPE provides 85% sensitivity for detecting upcoming illness/injury/OTS; any 2 of: HRV >7% below baseline, RHR >5 bpm above baseline, sleep <6h, sRPE >20% above planned = implement rest/recovery day; elite coaches consistently outperform algorithms for long-term load management — technology augments, not replaces, coach judgment")
        }
    }

    private var recoveryProtocolCard: some View {
        scienceCard(title: "Recovery & Prevention Protocols", icon: "✅", color: .green) {
            sciRow(stat: "Kellmann 2002", detail: "Recovery definition: multi-dimensional restoration process — physical (sleep, nutrition, rest), psychological (mood, motivation, stress), and social (team dynamics, relationships); recovery rate must equal or exceed training stress; formal periodization must include micro (within-week), meso (block-level), and macro (seasonal) recovery; neglecting any level creates accumulating deficits")
            sciRow(stat: "Hausswirth 2011 (Med Sci Sports Exerc)", detail: "Optimal recovery interventions ranked by evidence: (1) sleep extension (most effective, free); (2) cold water immersion 10–15°C × 10–15 min; (3) active recovery at <50% HRmax for 20 min; (4) massage; (5) compression garments; (6) contrast therapy; evidence for cryotherapy: reduces CK 30%, muscle soreness 20%; BUT may blunt hypertrophy adaptations if used after strength training — context matters")
            sciRow(stat: "Peake 2017 (Front Physiol)", detail: "Recovery nutrition science: protein 0.4 g/kg within 2h post-exercise; carbohydrate 1.0–1.2 g/kg/h for first 4h post-exercise; avoid anti-inflammatory supplements (ibuprofen, high-dose antioxidants) post-training — they blunt training adaptations by inhibiting PGC-1α and satellite cell activation; strategic inflammation is part of the adaptation signal; save NSAIDs for acute injury management")
            sciRow(stat: "Stöggl 2014 (Brit J Sports Med)", detail: "Polarized vs pyramidal training in prevention: polarized (80% easy/20% hard) produces superior performance AND reduces OTS risk vs pyramidal (50% easy/25% moderate/25% hard) in 9-week RCT in elite cross-country skiers; threshold-dominated training (high moderate-intensity volume) is the highest-risk approach for OTS; maintaining ≥60% of total volume in Zone 1 prevents HPA axis and autonomic dysfunction")
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
              let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            isLoading = false; return
        }
        let workoutType = HKObjectType.workoutType()

        guard (try? await store.requestAuthorization(toShare: [], read: [rhrType, hrvType, workoutType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let rhrSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: rhrType, predicate: predicate, limit: 30, sortDescriptors: [sort]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let hrvSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: hrvType, predicate: predicate, limit: 30, sortDescriptors: [sort]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let avgRHR = rhrSamples.isEmpty ? 0 : rhrSamples.map { $0.quantity.doubleValue(for: .count().unitDivided(by: .minute())) }.reduce(0, +) / Double(rhrSamples.count)
        let avgHRV = hrvSamples.isEmpty ? 0 : hrvSamples.map { $0.quantity.doubleValue(for: .secondUnit(with: .milli)) }.reduce(0, +) / Double(hrvSamples.count)

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for workout in workouts {
            let weeksAgo = Int(now.timeIntervalSince(workout.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += 1 }
        }

        await MainActor.run {
            self.avgRHR = avgRHR
            self.avgHRV = avgHRV
            self.weeklyWorkouts = weekly
            self.isLoading = false
        }
    }
}
