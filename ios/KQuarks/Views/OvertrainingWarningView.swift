import SwiftUI
import HealthKit
import Charts

// MARK: - OvertrainingWarningView
// Detects early overtraining syndrome signals using four biomarkers:
// HRV trend, resting heart rate elevation, ACWR volume spike, and sleep deficit.
// Science: Meeusen et al. 2013 European Consensus Statement on overtraining.

struct OvertrainingWarningView: View {

    // MARK: - Component scores (0-3 each → 0-12 total)

    struct SignalScore: Identifiable {
        let id = UUID()
        let name: String
        let icon: String
        let score: Int          // 0-3
        let value: String
        let baseline: String
        let detail: String
        let color: Color
    }

    enum RiskLevel {
        case normal, monitor, reduce, rest

        var label: String {
            switch self {
            case .normal:  return "No concern"
            case .monitor: return "Monitor closely"
            case .reduce:  return "Reduce load"
            case .rest:    return "Rest recommended"
            }
        }

        var color: Color {
            switch self {
            case .normal:  return .green
            case .monitor: return .yellow
            case .reduce:  return .orange
            case .rest:    return .red
            }
        }

        var icon: String {
            switch self {
            case .normal:  return "checkmark.circle.fill"
            case .monitor: return "eye.fill"
            case .reduce:  return "arrow.down.heart.fill"
            case .rest:    return "exclamationmark.triangle.fill"
            }
        }

        static func from(score: Int) -> RiskLevel {
            switch score {
            case 0...2:  return .normal
            case 3...4:  return .monitor
            case 5...7:  return .reduce
            default:     return .rest
            }
        }
    }

    // MARK: - State

    @State private var signals: [SignalScore] = []
    @State private var totalScore: Int = 0
    @State private var weeklyScores: [(date: Date, score: Int)] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Computed

    private var riskLevel: RiskLevel { .from(score: totalScore) }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Risk gauge
                riskGauge

                // Signal cards
                if !signals.isEmpty {
                    signalGrid
                }

                // History chart
                if weeklyScores.count >= 2 {
                    historyChart
                }

                // Recommendations
                recommendationsCard

                // Science
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Overtraining Warning")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Analyzing biomarker trends…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var riskGauge: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: riskLevel.icon)
                    .foregroundStyle(riskLevel.color)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Overtraining Risk")
                        .font(.headline)
                    Text(riskLevel.label)
                        .font(.subheadline)
                        .foregroundStyle(riskLevel.color)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(totalScore)/12")
                        .font(.largeTitle).bold()
                        .foregroundStyle(riskLevel.color)
                    Text("risk score")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            // Score bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.tertiarySystemBackground))
                        .frame(height: 12)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(riskLevel.color.gradient)
                        .frame(width: geo.size.width * min(CGFloat(totalScore) / 12.0, 1.0), height: 12)
                        .animation(.easeInOut(duration: 0.6), value: totalScore)
                }
            }
            .frame(height: 12)

            // Threshold markers
            HStack {
                Text("OK").font(.caption2).foregroundStyle(.green)
                Spacer()
                Text("Monitor").font(.caption2).foregroundStyle(.yellow)
                Spacer()
                Text("Reduce").font(.caption2).foregroundStyle(.orange)
                Spacer()
                Text("Rest").font(.caption2).foregroundStyle(.red)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var signalGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(signals) { signal in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: signal.icon).foregroundStyle(signal.color)
                        Spacer()
                        HStack(spacing: 2) {
                            ForEach(0..<3) { i in
                                Circle()
                                    .fill(i < signal.score ? signal.color : Color(.tertiarySystemBackground))
                                    .frame(width: 8, height: 8)
                            }
                        }
                    }
                    Text(signal.name)
                        .font(.caption).foregroundStyle(.secondary)
                    Text(signal.value)
                        .font(.subheadline).bold()
                    Text("vs \(signal.baseline)")
                        .font(.caption2).foregroundStyle(.secondary)
                    Text(signal.detail)
                        .font(.caption2).foregroundStyle(signal.color)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal)
    }

    private var historyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("7-Week Trend", systemImage: "waveform.path.ecg")
                .font(.subheadline).bold()

            Chart {
                // Risk zones
                RectangleMark(xStart: .value("", weeklyScores.first?.date ?? Date()),
                              xEnd:   .value("", weeklyScores.last?.date  ?? Date()),
                              yStart: .value("", 5), yEnd: .value("", 7))
                    .foregroundStyle(Color.orange.opacity(0.06))
                RectangleMark(xStart: .value("", weeklyScores.first?.date ?? Date()),
                              xEnd:   .value("", weeklyScores.last?.date  ?? Date()),
                              yStart: .value("", 8), yEnd: .value("", 12))
                    .foregroundStyle(Color.red.opacity(0.06))

                // Threshold lines
                RuleMark(y: .value("Reduce", 5))
                    .lineStyle(StrokeStyle(dash: [4]))
                    .foregroundStyle(.orange.opacity(0.5))
                RuleMark(y: .value("Rest", 8))
                    .lineStyle(StrokeStyle(dash: [4]))
                    .foregroundStyle(.red.opacity(0.5))

                ForEach(weeklyScores, id: \.date) { pt in
                    LineMark(x: .value("Week", pt.date), y: .value("Score", pt.score))
                        .foregroundStyle(RiskLevel.from(score: pt.score).color)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Week", pt.date), y: .value("Score", pt.score))
                        .foregroundStyle(RiskLevel.from(score: pt.score).color)
                        .symbolSize(30)
                }
            }
            .frame(height: 160)
            .chartYScale(domain: 0...12)
            .chartXAxis { AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                AxisValueLabel(format: .dateTime.month(.abbreviated).day())
            }}
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var recommendationsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recommendations", systemImage: "checklist")
                .font(.subheadline).bold()

            let recs: [(icon: String, text: String)] = {
                switch riskLevel {
                case .normal:
                    return [
                        ("checkmark.circle", "All biomarkers within normal range"),
                        ("arrow.up.heart.fill", "Continue current training plan"),
                        ("moon.fill", "Maintain 7-9h sleep for continued adaptation"),
                    ]
                case .monitor:
                    return [
                        ("eye.fill", "One or more signals showing early stress"),
                        ("arrow.down.circle", "Consider adding one extra easy day this week"),
                        ("moon.fill", "Prioritize 8+ hours of sleep"),
                        ("magnifyingglass.circle", "Monitor for 3-5 more days before intensifying"),
                    ]
                case .reduce:
                    return [
                        ("exclamationmark.circle", "Multiple overtraining signals detected"),
                        ("arrow.down.heart.fill", "Reduce total training volume by 30-50%"),
                        ("figure.walk", "Replace hard sessions with Z1-Z2 only"),
                        ("bed.double.fill", "Prioritize sleep — target 9h if possible"),
                        ("fork.knife", "Increase carbohydrate and protein intake"),
                    ]
                case .rest:
                    return [
                        ("exclamationmark.triangle.fill", "Strong overtraining syndrome indicators"),
                        ("xmark.circle.fill", "Take 2-5 complete rest days"),
                        ("bed.double.fill", "Maximum sleep priority — 9-10h if possible"),
                        ("figure.walk", "Light walking only — no structured training"),
                        ("person.fill.questionmark", "Consider consulting a sports physician if symptoms persist 2+ weeks"),
                    ]
                }
            }()

            ForEach(recs, id: \.text) { rec in
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: rec.icon)
                        .foregroundStyle(riskLevel.color)
                        .frame(width: 20)
                    Text(rec.text)
                        .font(.caption)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Science", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            scienceItem("Meeusen et al. 2013 (European Consensus)", detail: "Overtraining syndrome (OTS) results from monotonous excessive training without adequate recovery. Early symptoms: HRV decline, elevated RHR, sleep disruption, mood changes.")
            scienceItem("Functional vs Non-Functional Overreaching", detail: "Short-term overreaching (days-weeks) is normal — it leads to supercompensation. Non-functional overreaching (weeks-months) requires extended recovery. Full OTS can take months to resolve.")
            scienceItem("HRV as Early Warning (Plews et al. 2013)", detail: "HRV decline >15% from rolling baseline is a validated early indicator of non-functional overreaching. Weekly HRV monitoring is more sensitive than resting HR alone.")
            scienceItem("ACWR (Gabbett 2016)", detail: "Acute:Chronic Workload Ratio >1.5 significantly increases injury risk. The 'sweet spot' is 0.8-1.3. Avoid >10% weekly volume increases.")
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

    // MARK: - Data loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let hrvType  = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!
        let rhrType  = HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!
        let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!
        let workType = HKObjectType.workoutType()
        let readTypes: Set<HKObjectType> = [hrvType, rhrType, sleepType, workType]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        } catch {
            isLoading = false; return
        }

        let now = Date()
        let cal = Calendar.current

        // Fetch 35 days of data (7 recent + 28 baseline) + 7-week weekly aggregates for history chart
        let start35 = cal.date(byAdding: .day, value: -35, to: now)!
        let start7  = cal.date(byAdding: .day, value: -7,  to: now)!
        let start28 = cal.date(byAdding: .day, value: -28, to: now)!
        let start7w = cal.date(byAdding: .weekOfYear, value: -7, to: now)!

        async let recentHRV   = fetchDailyAvg(type: hrvType, unit: HKUnit(from: "ms"),           from: start7, to: now)
        async let baseHRV     = fetchDailyAvg(type: hrvType, unit: HKUnit(from: "ms"),           from: start35, to: now)
        async let recentRHR   = fetchDailyAvg(type: rhrType, unit: HKUnit(from: "count/min"),    from: start7, to: now)
        async let baseRHR     = fetchDailyAvg(type: rhrType, unit: HKUnit(from: "count/min"),    from: start35, to: now)
        async let recent7WOs  = fetchWorkoutMinutes(from: start7,  to: now)
        async let chronic28   = fetchWorkoutMinutes(from: start28, to: now)
        async let recentSleep = fetchSleepHours(from: start7, to: now)
        async let baseSleep   = fetchSleepHours(from: start35, to: now)
        async let weeklyHRV   = fetchWeeklyAvg(type: hrvType, unit: HKUnit(from: "ms"),          from: start7w, to: now)
        async let weeklyRHR   = fetchWeeklyAvg(type: rhrType, unit: HKUnit(from: "count/min"),   from: start7w, to: now)

        let (rHRV, bHRV, rRHR, bRHR, acute, chronic, rSleep, bSleep, wHRV, wRHR) =
            await (recentHRV, baseHRV, recentRHR, baseRHR, recent7WOs, chronic28, recentSleep, baseSleep, weeklyHRV, weeklyRHR)

        // --- HRV Signal ---
        let hrv7avg = avg(rHRV)
        let hrv30avg = avg(bHRV)
        let (hrvScore, hrvDetail): (Int, String)
        if let r7 = hrv7avg, let b30 = hrv30avg, b30 > 0 {
            let pctDrop = (b30 - r7) / b30
            switch pctDrop {
            case ..<0.05:  hrvScore = 0; hrvDetail = "Within normal range"
            case 0.05..<0.10: hrvScore = 1; hrvDetail = String(format: "%.0f%% below baseline", pctDrop * 100)
            case 0.10..<0.20: hrvScore = 2; hrvDetail = String(format: "%.0f%% below baseline — caution", pctDrop * 100)
            default:       hrvScore = 3; hrvDetail = String(format: "%.0f%% below baseline — significant", pctDrop * 100)
            }
        } else { hrvScore = 0; hrvDetail = "No data" }

        // --- RHR Signal ---
        let rhr7avg  = avg(rRHR)
        let rhr30avg = avg(bRHR)
        let (rhrScore, rhrDetail): (Int, String)
        if let r7 = rhr7avg, let b30 = rhr30avg {
            let delta = r7 - b30
            switch delta {
            case ..<3:   rhrScore = 0; rhrDetail = "Normal"
            case 3..<5:  rhrScore = 1; rhrDetail = String(format: "+%.0f bpm above baseline", delta)
            case 5..<10: rhrScore = 2; rhrDetail = String(format: "+%.0f bpm — elevated", delta)
            default:     rhrScore = 3; rhrDetail = String(format: "+%.0f bpm — significantly elevated", delta)
            }
        } else { rhrScore = 0; rhrDetail = "No data" }

        // --- ACWR ---
        let acuteLoad  = acute
        let chronicDay = chronic / 4.0  // 28 days → weekly chronic
        let acwr       = chronicDay > 0 ? acuteLoad / chronicDay : 1.0
        let (acwrScore, acwrDetail): (Int, String)
        switch acwr {
        case ..<0.8:    acwrScore = 0; acwrDetail = String(format: "ACWR %.2f — undertraining", acwr)
        case 0.8..<1.3: acwrScore = 0; acwrDetail = String(format: "ACWR %.2f — optimal zone", acwr)
        case 1.3..<1.5: acwrScore = 1; acwrDetail = String(format: "ACWR %.2f — caution zone", acwr)
        case 1.5..<2.0: acwrScore = 2; acwrDetail = String(format: "ACWR %.2f — high risk", acwr)
        default:        acwrScore = 3; acwrDetail = String(format: "ACWR %.2f — very high risk", acwr)
        }

        // --- Sleep ---
        let sleep7avg  = rSleep
        let sleep30avg = bSleep
        let sleepDelta = sleep30avg - sleep7avg  // positive = sleeping less recently
        let (sleepScore, sleepDetail): (Int, String)
        switch sleepDelta {
        case ..<0.25:   sleepScore = 0; sleepDetail = "Sleep maintained"
        case 0.25..<0.5: sleepScore = 1; sleepDetail = String(format: "-%.0f min recent avg", sleepDelta * 60)
        case 0.5..<1.0: sleepScore = 2; sleepDetail = String(format: "-%.0f min — sleep deficit", sleepDelta * 60)
        default:        sleepScore = 3; sleepDetail = String(format: "-%.0f min — significant deficit", sleepDelta * 60)
        }

        let computed: [SignalScore] = [
            SignalScore(name: "HRV Trend", icon: "waveform.path.ecg",
                        score: hrvScore,
                        value: hrv7avg.map { String(format: "%.0f ms", $0) } ?? "—",
                        baseline: hrv30avg.map { String(format: "%.0f ms 30d avg", $0) } ?? "—",
                        detail: hrvDetail,
                        color: scoreColor(hrvScore)),

            SignalScore(name: "Resting HR", icon: "heart.fill",
                        score: rhrScore,
                        value: rhr7avg.map { String(format: "%.0f bpm", $0) } ?? "—",
                        baseline: rhr30avg.map { String(format: "%.0f bpm 30d avg", $0) } ?? "—",
                        detail: rhrDetail,
                        color: scoreColor(rhrScore)),

            SignalScore(name: "ACWR", icon: "chart.bar.fill",
                        score: acwrScore,
                        value: String(format: "%.2f", acwr),
                        baseline: "0.8–1.3 optimal",
                        detail: acwrDetail,
                        color: scoreColor(acwrScore)),

            SignalScore(name: "Sleep Duration", icon: "moon.fill",
                        score: sleepScore,
                        value: rSleep > 0 ? String(format: "%.1f h", rSleep) : "—",
                        baseline: bSleep > 0 ? String(format: "%.1f h 30d avg", bSleep) : "—",
                        detail: sleepDetail,
                        color: scoreColor(sleepScore)),
        ]
        let total = computed.reduce(0) { $0 + $1.score }

        // Build weekly score history using real HealthKit weekly HRV + RHR averages
        var weekly: [(date: Date, score: Int)] = []
        for (i, wPt) in wHRV.enumerated() {
            let weekRHRVal = i < wRHR.count ? wRHR[i].value : nil
            var weekScore = 0
            if let b30 = hrv30avg, b30 > 0 {
                let pctDrop = (b30 - wPt.value) / b30
                if pctDrop >= 0.20 { weekScore += 3 }
                else if pctDrop >= 0.10 { weekScore += 2 }
                else if pctDrop >= 0.05 { weekScore += 1 }
            }
            if let rhrVal = weekRHRVal, let b30 = rhr30avg {
                let delta = rhrVal - b30
                if delta >= 10 { weekScore += 3 }
                else if delta >= 5 { weekScore += 2 }
                else if delta >= 3 { weekScore += 1 }
            }
            let isCurrentWeek = (i == wHRV.count - 1)
            weekly.append((date: wPt.date, score: isCurrentWeek ? total : min(weekScore, 12)))
        }
        if weekly.isEmpty { weekly.append((date: now, score: total)) }

        await MainActor.run {
            signals = computed
            totalScore = total
            weeklyScores = weekly
            isLoading = false
        }
    }

    private func scoreColor(_ score: Int) -> Color {
        switch score {
        case 0: return .green
        case 1: return .yellow
        case 2: return .orange
        default: return .red
        }
    }

    private func avg(_ values: [Double]) -> Double? {
        guard !values.isEmpty else { return nil }
        return values.reduce(0, +) / Double(values.count)
    }

    private func fetchDailyAvg(type: HKQuantityType, unit: HKUnit, from start: Date, to end: Date) async -> [Double] {
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let interval = DateComponents(day: 1)
            let q = HKStatisticsCollectionQuery(
                quantityType: type,
                quantitySamplePredicate: pred,
                options: .discreteAverage,
                anchorDate: start,
                intervalComponents: interval
            )
            q.initialResultsHandler = { _, coll, _ in
                var result: [Double] = []
                coll?.enumerateStatistics(from: start, to: end) { stats, _ in
                    if let q = stats.averageQuantity() {
                        result.append(q.doubleValue(for: unit))
                    }
                }
                cont.resume(returning: result)
            }
            healthStore.execute(q)
        }
    }

    private func fetchWorkoutMinutes(from start: Date, to end: Date) async -> Double {
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(
                sampleType: HKObjectType.workoutType(),
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, _ in
                let total = (samples as? [HKWorkout])?.reduce(0.0) { $0 + $1.duration / 60.0 } ?? 0
                cont.resume(returning: total)
            }
            healthStore.execute(q)
        }
    }

    private func fetchWeeklyAvg(type: HKQuantityType, unit: HKUnit, from start: Date, to end: Date) async -> [(date: Date, value: Double)] {
        await withCheckedContinuation { cont in
            let anchorDate = Calendar.current.dateInterval(of: .weekOfYear, for: end)?.start ?? start
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKStatisticsCollectionQuery(
                quantityType: type,
                quantitySamplePredicate: pred,
                options: .discreteAverage,
                anchorDate: anchorDate,
                intervalComponents: DateComponents(weekOfYear: 1)
            )
            q.initialResultsHandler = { _, coll, _ in
                var result: [(date: Date, value: Double)] = []
                coll?.enumerateStatistics(from: start, to: end) { stats, _ in
                    if let qty = stats.averageQuantity() {
                        result.append((date: stats.startDate, value: qty.doubleValue(for: unit)))
                    }
                }
                cont.resume(returning: result)
            }
            healthStore.execute(q)
        }
    }

    private func fetchSleepHours(from start: Date, to end: Date) async -> Double {
        await withCheckedContinuation { cont in
            guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else {
                cont.resume(returning: 0); return
            }
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(
                sampleType: sleepType,
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, _ in
                let asleep = (samples as? [HKCategorySample])?.filter { $0.value != HKCategoryValueSleepAnalysis.inBed.rawValue }
                let totalSecs = asleep?.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) } ?? 0
                let days = max(1, end.timeIntervalSince(start) / 86400)
                cont.resume(returning: (totalSecs / 3600) / days)
            }
            healthStore.execute(q)
        }
    }
}
