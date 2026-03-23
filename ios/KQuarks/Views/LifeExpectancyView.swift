import SwiftUI
import HealthKit
import Charts

// MARK: - LifeExpectancyView
// Translates current biomarkers into estimated life expectancy impact (years gained/lost).
// Each metric compared to population average; delta expressed as years added or subtracted.
// Science: Paluch 2021 (JAMA Network Open, steps vs mortality), Myers 2002 (VO2 max),
// Jouven 2005 (RHR), Dekker 1997 (HRV mortality), Gallicchio 2009 (sleep duration),
// Paffenbarger 1986 (Harvard Alumni, exercise longevity).

struct LifeExpectancyView: View {

    // MARK: - Model

    struct LifeImpact: Identifiable {
        let id = UUID()
        let name: String
        let icon: String
        let color: Color
        let value: String          // formatted current value
        let yearsImpact: Double    // +/- years vs average population
        let comparison: String     // vs population average
        let citation: String
    }

    struct ImpactBar: Identifiable {
        let id = UUID()
        let name: String
        let years: Double
        let color: Color
    }

    // MARK: - State

    @State private var impacts: [LifeImpact] = []
    @State private var totalYears: Double?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let baselineAge: Int = 35
    private let populationLifeExpectancy: Double = 79.1  // US CDC 2022

    // MARK: - Computed

    private var projectedLifeExpectancy: Double? {
        guard let t = totalYears else { return nil }
        return populationLifeExpectancy + t
    }

    private var netColor: Color {
        guard let t = totalYears else { return .gray }
        return t > 3 ? .green : t > 0 ? .mint : t > -3 ? .orange : .red
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                summaryCard
                waterfallCard
                impactGrid
                limitationsCard
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Life Expectancy")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Calculating impact…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var summaryCard: some View {
        VStack(spacing: 16) {
            HStack(alignment: .center, spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(Color(.tertiarySystemBackground), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    if let proj = projectedLifeExpectancy {
                        let pct = min(1.0, max(0.0, (proj - 65) / 30))
                        Circle()
                            .trim(from: 0, to: CGFloat(pct))
                            .stroke(netColor.gradient,
                                    style: StrokeStyle(lineWidth: 14, lineCap: .round))
                            .frame(width: 110, height: 110)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.8), value: proj)
                        VStack(spacing: 1) {
                            Text(String(format: "%.0f", proj))
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundStyle(netColor)
                            Text("proj. yrs").font(.caption2).foregroundStyle(.secondary)
                        }
                    } else {
                        Text("—").font(.title).bold().foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Projected Longevity").font(.headline)
                        if let t = totalYears {
                            let sign = t >= 0 ? "+" : ""
                            Text("\(sign)\(String(format: "%.1f", t)) years")
                                .font(.subheadline).bold()
                                .foregroundStyle(netColor)
                            Text("vs. US average (\(String(format: "%.0f", populationLifeExpectancy)) yrs)")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Text("Based on your current biomarkers")
                        .font(.caption2).foregroundStyle(.tertiary)
                }
                Spacer()
            }

            Text("⚠️ Estimate only — based on population-level associations, not individual prediction. Many factors affecting longevity are not captured by HealthKit data.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var waterfallCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Years Impact by Metric", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Estimated years gained (+) or lost (−) vs. average adult. Sum = net life expectancy impact.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(impacts) { impact in
                BarMark(
                    x: .value("Years", impact.yearsImpact),
                    y: .value("Metric", impact.name)
                )
                .foregroundStyle(impact.yearsImpact >= 0 ? Color.green.gradient : Color.red.gradient)
                .cornerRadius(4)
                .annotation(position: impact.yearsImpact >= 0 ? .trailing : .leading) {
                    let sign = impact.yearsImpact >= 0 ? "+" : ""
                    Text("\(sign)\(String(format: "%.1f", impact.yearsImpact))")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(impact.yearsImpact >= 0 ? .green : .red)
                }
            }
            .frame(height: CGFloat(impacts.count) * 38 + 20)
            .chartXAxis {
                AxisMarks { v in
                    AxisValueLabel { Text(v.as(Double.self).map { "\($0 >= 0 ? "+" : "")\(String(format: "%.0f", $0))yr" } ?? "") }
                    AxisGridLine()
                }
            }
            .chartXScale(domain: -5...8)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var impactGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(impacts) { impact in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: impact.icon).foregroundStyle(impact.color)
                        Spacer()
                        let sign = impact.yearsImpact >= 0 ? "+" : ""
                        Text("\(sign)\(String(format: "%.1f", impact.yearsImpact)) yr")
                            .font(.caption2).bold()
                            .foregroundStyle(impact.yearsImpact >= 0 ? .green : .red)
                    }
                    Text(impact.name).font(.caption).foregroundStyle(.secondary)
                    Text(impact.value)
                        .font(.title2).bold()
                        .foregroundStyle(impact.color)
                    Text(impact.comparison).font(.caption2).foregroundStyle(.secondary)
                    Text(impact.citation).font(.caption2).foregroundStyle(.tertiary).lineLimit(1)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal)
    }

    private var limitationsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Important Limitations", systemImage: "info.circle.fill")
                .font(.subheadline).bold()
            Text("This is a simplified educational tool based on **relative risk associations** from population studies — not a clinical prediction tool. Individual longevity depends on genetics, environment, healthcare access, accident risk, and many unmeasured factors. Use this to motivate healthy habits, not as a medical forecast.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color.blue.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Research Basis", systemImage: "book.closed.fill")
                .font(.subheadline).bold()
            scienceItem("Steps & Mortality (Paluch 2021, JAMA Network Open)", detail: "7,000–9,000 steps/day associated with 50-70% lower all-cause mortality vs <4,000 steps. Dose-response relationship. Each 1,000 step increment = ~10-15% lower mortality below 8,000 steps.")
            scienceItem("VO₂ Max & Longevity (Myers 2002, NEJM)", detail: "Cardiorespiratory fitness is the strongest independent predictor of all-cause mortality. Top 20% fitness vs bottom quintile: 5.9 year survival advantage. 1 MET improvement = 12% mortality risk reduction.")
            scienceItem("Resting Heart Rate & Survival (Jouven 2005)", detail: "RHR >75 bpm associated with 3.8× higher all-cause mortality vs RHR <55 bpm. Each 10 bpm increase in resting HR = ~16% higher all-cause mortality (Saxena 2013).")
            scienceItem("Sleep Duration & Mortality (Gallicchio 2009)", detail: "Both short (<6h) and long (>9h) sleep associated with higher all-cause mortality. 7-8 hours optimal across most meta-analyses. Short sleep: 10-13% higher risk; long sleep: 17-34% higher risk.")
        }
        .padding()
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func scienceItem(_ title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption).bold()
            Text(detail).font(.caption2).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Data Loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            await MainActor.run { isLoading = false }; return
        }

        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        let types: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .vo2Max)!,
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!,
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            sleepType,
        ]
        do { try await healthStore.requestAuthorization(toShare: [], read: types) }
        catch { await MainActor.run { isLoading = false }; return }

        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        async let vo2S  = fetchLatest(.vo2Max,                sort: sort)
        async let rhrS  = fetchLatest(.restingHeartRate,      sort: sort)
        async let stepS = fetchDailyStepAvg()
        async let hrvS  = fetchLatest(.heartRateVariabilitySDNN, sort: sort)
        async let sleepS = fetchAvgSleepHours()

        let (vo2, rhr, avgSteps, hrv, avgSleepHours) = await (vo2S, rhrS, stepS, hrvS, sleepS)

        // --- VO2 Max impact ---
        let vo2Val = vo2?.quantity.doubleValue(for: HKUnit(from: "ml/kg/min"))
        let (vo2Years, vo2Interp): (Double, String)
        if let v = vo2Val {
            // Myers 2002: top quintile ~5.9yr advantage; linear interpolation
            switch v {
            case 56...:   vo2Years = 5.5;  vo2Interp = "Top 20% — elite aerobic fitness"
            case 49..<56: vo2Years = 3.0;  vo2Interp = "Above average fitness"
            case 43..<49: vo2Years = 0.5;  vo2Interp = "Average fitness"
            case 37..<43: vo2Years = -1.5; vo2Interp = "Below average — room to improve"
            default:      vo2Years = -4.0; vo2Interp = "Low fitness — high priority to address"
            }
        } else { vo2Years = 0; vo2Interp = "No VO₂ data" }

        // --- RHR impact ---
        let rhrVal = rhr?.quantity.doubleValue(for: .count().unitDivided(by: .minute()))
        let (rhrYears, rhrInterp): (Double, String)
        if let r = rhrVal {
            // Jouven 2005, Saxena 2013: each 10bpm ~16% mortality change
            switch r {
            case ..<55:  rhrYears = 2.5;  rhrInterp = "Excellent — very low cardiovascular risk"
            case 55..<60: rhrYears = 1.5; rhrInterp = "Good — well-trained heart"
            case 60..<70: rhrYears = 0.0; rhrInterp = "Average (population median ~70 bpm)"
            case 70..<80: rhrYears = -1.0; rhrInterp = "Above average — slight increased risk"
            default:     rhrYears = -3.0; rhrInterp = "High — consider cardiovascular assessment"
            }
        } else { rhrYears = 0; rhrInterp = "No RHR data" }

        // --- Steps impact ---
        let (stepsYears, stepsInterp): (Double, String)
        if avgSteps > 0 {
            // Paluch 2021: vs <4000 steps baseline
            switch avgSteps {
            case 10000...: stepsYears = 4.5; stepsInterp = "Highly active — optimal mortality reduction"
            case 8000..<10000: stepsYears = 3.5; stepsInterp = "Active — ~65% lower mortality vs sedentary"
            case 6000..<8000:  stepsYears = 2.0; stepsInterp = "Moderately active"
            case 4000..<6000:  stepsYears = 0.5; stepsInterp = "Below goal — aim for 7,000+ steps"
            default:           stepsYears = -1.5; stepsInterp = "Sedentary — significant mortality risk"
            }
        } else { stepsYears = 0; stepsInterp = "No step data" }

        // --- HRV impact ---
        let hrvVal = hrv?.quantity.doubleValue(for: HKUnit(from: "ms"))
        let (hrvYears, hrvInterp): (Double, String)
        if let h = hrvVal {
            // Dekker 1997: low HRV strong predictor; Kleiger 1987
            switch h {
            case 60...:   hrvYears = 2.0;  hrvInterp = "High HRV — excellent autonomic health"
            case 45..<60: hrvYears = 1.0;  hrvInterp = "Good HRV for your age"
            case 30..<45: hrvYears = 0.0;  hrvInterp = "Average HRV (age 35 population)"
            case 20..<30: hrvYears = -1.0; hrvInterp = "Low HRV — elevated autonomic risk"
            default:      hrvYears = -2.0; hrvInterp = "Very Low HRV — priority metric to improve"
            }
        } else { hrvYears = 0; hrvInterp = "No HRV data" }

        // --- Sleep impact ---
        let (sleepYears, sleepInterp): (Double, String)
        if avgSleepHours > 0 {
            // Gallicchio 2009, Cappuccio 2010 meta-analysis
            switch avgSleepHours {
            case 7..<8.5: sleepYears = 1.5;  sleepInterp = "Optimal sleep duration (7–8.5h)"
            case 6..<7:   sleepYears = 0.0;  sleepInterp = "Slightly short — marginal risk"
            case 8.5..<10: sleepYears = -0.5; sleepInterp = "Slightly long — modest risk"
            case 5..<6:   sleepYears = -1.5; sleepInterp = "Short sleep — 10-13% higher mortality"
            default:      sleepYears = -2.5; sleepInterp = "Very short or very long — significant risk"
            }
        } else { sleepYears = 0; sleepInterp = "No sleep data" }

        let impactList: [LifeImpact] = [
            LifeImpact(name: "VO₂ Max", icon: "lungs.fill", color: .purple,
                       value: vo2Val.map { String(format: "%.1f ml/kg/min", $0) } ?? "—",
                       yearsImpact: vo2Years, comparison: vo2Interp, citation: "Myers 2002 (NEJM)"),
            LifeImpact(name: "Daily Steps", icon: "figure.walk", color: .green,
                       value: avgSteps > 0 ? String(format: "%.0f steps/day", avgSteps) : "—",
                       yearsImpact: stepsYears, comparison: stepsInterp, citation: "Paluch 2021 (JAMA)"),
            LifeImpact(name: "Resting HR", icon: "heart.fill", color: .red,
                       value: rhrVal.map { String(format: "%.0f bpm", $0) } ?? "—",
                       yearsImpact: rhrYears, comparison: rhrInterp, citation: "Jouven 2005"),
            LifeImpact(name: "HRV", icon: "waveform.path.ecg", color: .blue,
                       value: hrvVal.map { String(format: "%.0f ms", $0) } ?? "—",
                       yearsImpact: hrvYears, comparison: hrvInterp, citation: "Dekker 1997 (Circulation)"),
            LifeImpact(name: "Sleep Duration", icon: "moon.fill", color: .indigo,
                       value: avgSleepHours > 0 ? String(format: "%.1f hrs/night", avgSleepHours) : "—",
                       yearsImpact: sleepYears, comparison: sleepInterp, citation: "Gallicchio 2009"),
        ]

        let netImpact = [vo2Years, rhrYears, stepsYears, hrvYears, sleepYears]
            .filter { $0 != 0 }.reduce(0, +)

        await MainActor.run {
            impacts = impactList
            totalYears = netImpact != 0 ? netImpact : nil
            isLoading = false
        }
    }

    private func fetchLatest(_ id: HKQuantityTypeIdentifier, sort: NSSortDescriptor) async -> HKQuantitySample? {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return nil }
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample])?.first)
            }
            healthStore.execute(q)
        }
    }

    private func fetchDailyStepAvg() async -> Double {
        guard let type = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return 0 }
        let since = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let anchor = Calendar.current.startOfDay(for: since)
        var comps = DateComponents(); comps.day = 1
        return await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(quantityType: type, quantitySamplePredicate: nil,
                                                options: .cumulativeSum, anchorDate: anchor,
                                                intervalComponents: comps)
            q.initialResultsHandler = { _, results, _ in
                var totals: [Double] = []
                results?.enumerateStatistics(from: since, to: Date()) { stat, _ in
                    if let v = stat.sumQuantity()?.doubleValue(for: .count()) { totals.append(v) }
                }
                cont.resume(returning: totals.isEmpty ? 0 : totals.reduce(0,+) / Double(totals.count))
            }
            healthStore.execute(q)
        }
    }

    private func fetchAvgSleepHours() async -> Double {
        guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return 0 }
        let since = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: since, end: Date())
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKCategorySample]) ?? [])
            }
            healthStore.execute(q)
        }
        let sleepSamples = samples.filter { s in
            switch HKCategoryValueSleepAnalysis(rawValue: s.value) {
            case .asleepCore, .asleepDeep, .asleepREM, .asleepUnspecified: return true
            default: return false
            }
        }
        // Group by night and compute daily total
        let cal = Calendar.current
        var byDay: [Date: Double] = [:]
        for s in sleepSamples {
            let day = cal.startOfDay(for: s.startDate)
            byDay[day, default: 0] += s.endDate.timeIntervalSince(s.startDate) / 3600
        }
        return byDay.values.isEmpty ? 0 : byDay.values.reduce(0,+) / Double(byDay.count)
    }
}
