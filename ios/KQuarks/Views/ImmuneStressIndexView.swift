import SwiftUI
import HealthKit
import Charts

// MARK: - ImmuneStressIndexView
// Detects potential illness/immune activation signals from passively captured biometrics.
// Distinguishes training fatigue (HRV drop + high training load) from illness signals
// (HRV drop + RHR elevation + temperature deviation + activity reduction).
// Science: Nieman 2019 (Sports Medicine), Bonnar 2018 (SJMS),
// Warby 2022 (wrist temp + illness), Apple WWDC21 (sleeping wrist temperature).

@available(iOS 16.0, *)
private struct ImmuneStressContent: View {

    // MARK: - Model

    struct ImmuneSignal: Identifiable {
        let id = UUID()
        let name: String
        let icon: String
        let value: String
        let deviation: Double     // current vs baseline (+ = worse)
        let score: Int            // 0-3 (0=normal, 3=significant alert)
        let color: Color
        let detail: String
    }

    struct DayAlert: Identifiable {
        let id = UUID()
        let date: Date
        let totalScore: Int
        var alertLevel: AlertLevel {
            switch totalScore {
            case 0..<3: return .normal
            case 3..<5: return .caution
            case 5..<7: return .alert
            default:    return .warning
            }
        }
    }

    enum AlertLevel {
        case normal, caution, alert, warning
        var color: Color {
            switch self {
            case .normal:  return .green
            case .caution: return .yellow
            case .alert:   return .orange
            case .warning: return .red
            }
        }
        var label: String {
            switch self {
            case .normal:  return "Normal"
            case .caution: return "Caution"
            case .alert:   return "Alert"
            case .warning: return "Warning"
            }
        }
    }

    struct DayPoint: Identifiable {
        let id = UUID()
        let date: Date
        let value: Double
    }

    // MARK: - State

    @State private var signals: [ImmuneSignal] = []
    @State private var totalScore: Int = 0
    @State private var alertLevel: AlertLevel = .normal
    @State private var recentAlerts: [DayAlert] = []
    @State private var tempPoints: [DayPoint] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                statusCard
                signalGrid
                if tempPoints.count >= 5 { tempTrendCard }
                historyCard
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Immune Stress Index")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Analyzing immune signals…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var statusCard: some View {
        VStack(spacing: 14) {
            HStack(alignment: .center, spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(Color(.tertiarySystemBackground), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(totalScore, 10)) / 10.0)
                        .stroke(alertLevel.color.gradient,
                                style: StrokeStyle(lineWidth: 14, lineCap: .round))
                        .frame(width: 110, height: 110)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.8), value: totalScore)
                    VStack(spacing: 2) {
                        Image(systemName: alertLevel == .normal ? "checkmark.shield.fill" : "exclamationmark.shield.fill")
                            .font(.title2)
                            .foregroundStyle(alertLevel.color)
                        Text("\(totalScore)/10")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundStyle(alertLevel.color)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Immune Stress Index").font(.headline)
                        Text(alertLevel.label)
                            .font(.subheadline).bold()
                            .foregroundStyle(alertLevel.color)
                        Text(alertDescription).font(.caption).foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer()
            }

            // Signal level band
            HStack(spacing: 0) {
                ForEach(["Normal\n0-2", "Caution\n3-4", "Alert\n5-6", "Warning\n7+"], id: \.self) { label in
                    let idx = ["Normal\n0-2", "Caution\n3-4", "Alert\n5-6", "Warning\n7+"].firstIndex(of: label) ?? 0
                    let colors: [Color] = [.green, .yellow, .orange, .red]
                    let levels: [AlertLevel] = [.normal, .caution, .alert, .warning]
                    VStack(spacing: 4) {
                        Rectangle()
                            .fill(colors[idx].opacity(alertLevel == levels[idx] ? 1.0 : 0.2))
                            .frame(height: 8)
                        Text(label)
                            .font(.system(size: 9))
                            .foregroundStyle(alertLevel == levels[idx] ? colors[idx] : .secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var alertDescription: String {
        switch alertLevel {
        case .normal:  return "All signals within normal range. Immune system appears unstressed."
        case .caution: return "Mild signal deviation. Monitor over next 24-48 hours. Prioritize sleep."
        case .alert:   return "Multiple signals elevated. Possible immune activation — rest is recommended."
        case .warning: return "Strong immune stress signals. Reduce training load. Consider medical assessment."
        }
    }

    private var signalGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(signals) { signal in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: signal.icon).foregroundStyle(signal.color)
                        Spacer()
                        // Score dots (0-3)
                        HStack(spacing: 2) {
                            ForEach(0..<3, id: \.self) { i in
                                Circle()
                                    .fill(i < signal.score ? signal.color : Color(.tertiarySystemBackground))
                                    .frame(width: 7, height: 7)
                            }
                        }
                    }
                    Text(signal.name).font(.caption).foregroundStyle(.secondary)
                    Text(signal.value)
                        .font(.title2).bold()
                        .foregroundStyle(signal.color)
                    let pct = signal.deviation > 0 ? "+\(Int(signal.deviation))% ↑" : "\(Int(signal.deviation))% ↓"
                    Text(pct)
                        .font(.caption2).bold()
                        .foregroundStyle(signal.deviation > 5 ? .red : signal.deviation < -5 ? .green : .secondary)
                    Text(signal.detail)
                        .font(.caption2).foregroundStyle(.tertiary)
                        .lineLimit(1)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal)
    }

    private var tempTrendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Wrist Temperature Deviation", systemImage: "thermometer.medium")
                .font(.subheadline).bold()
            Text("Deviation from personal 30-day baseline. Values >0.5°C may indicate early illness signal.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(tempPoints) { pt in
                BarMark(x: .value("Date", pt.date, unit: .day),
                        y: .value("Deviation", pt.value))
                    .foregroundStyle(pt.value > 0.5 ? Color.red.gradient : pt.value > 0 ? Color.orange.gradient : Color.blue.gradient)
                RuleMark(y: .value("Threshold", 0.5))
                    .foregroundStyle(.red.opacity(0.4))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .annotation(position: .top, alignment: .leading) {
                        Text("+0.5°C").font(.caption2).foregroundStyle(.red)
                    }
                RuleMark(y: .value("Baseline", 0))
                    .foregroundStyle(.secondary.opacity(0.3))
            }
            .frame(height: 120)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 5)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { v in
                    AxisValueLabel { Text(String(format: "%.1f°", v.as(Double.self) ?? 0)) }
                    AxisGridLine()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var historyCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("30-Day Alert History", systemImage: "calendar.badge.exclamationmark")
                .font(.subheadline).bold()

            let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(recentAlerts.suffix(28)) { alert in
                    RoundedRectangle(cornerRadius: 4)
                        .fill(alert.alertLevel.color.opacity(0.7))
                        .frame(height: 28)
                        .overlay(
                            Text(alert.date.formatted(.dateTime.day()))
                                .font(.system(size: 9))
                                .foregroundStyle(.white)
                        )
                }
            }
            HStack(spacing: 10) {
                ForEach([("Normal", Color.green), ("Caution", Color.yellow),
                         ("Alert", Color.orange), ("Warning", Color.red)], id: \.0) { label, color in
                    HStack(spacing: 3) {
                        RoundedRectangle(cornerRadius: 2).fill(color.opacity(0.7)).frame(width: 10, height: 10)
                        Text(label).font(.caption2).foregroundStyle(.secondary)
                    }
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
            Label("Science", systemImage: "cross.fill")
                .font(.subheadline).bold()
            scienceItem("HRV & Illness (Nieman 2019, Sports Medicine)", detail: "HRV drops 10-20% before clinical illness symptoms appear. Morning resting HRV is the most sensitive early indicator of immune system activation — often 24-48 hours before feeling unwell.")
            scienceItem("Resting HR Elevation as Illness Signal", detail: "RHR increases 5-10 bpm during acute illness due to inflammatory cytokines (Bonnar 2018). Distinguishing training fatigue (high load + HR elevation) from illness (low load + HR elevation) is key.")
            scienceItem("Wrist Temperature (Warby 2022)", detail: "Apple Watch sleeping wrist temperature detects deviations as small as 0.1°C from baseline. Fever early warning: >0.5°C sustained increase over 2+ nights. Apple uses this for menstrual cycle and illness detection.")
            scienceItem("Activity Reduction as Symptom", detail: "Involuntary step count reduction >30% from personal average is a strong illness indicator — people naturally reduce activity when unwell. Daily step variance can detect illness 2-3 days before self-report.")
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

        let wristTempType = HKQuantityType.quantityType(forIdentifier: .appleSleepingWristTemperature)!
        let types: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!,
            wristTempType,
        ]
        do { try await healthStore.requestAuthorization(toShare: [], read: types) }
        catch { await MainActor.run { isLoading = false }; return }

        let cal = Calendar.current
        let now = Date()
        let since30 = cal.date(byAdding: .day, value: -30, to: now) ?? now
        let since7  = cal.date(byAdding: .day, value: -7,  to: now) ?? now

        async let hrv30  = fetchDailyAvg(.heartRateVariabilitySDNN, since: since30, unit: HKUnit(from: "ms"))
        async let rhr30  = fetchDailyAvg(.restingHeartRate, since: since30, unit: .count().unitDivided(by: .minute()))
        async let step30 = fetchDailySum(.stepCount, since: since30, unit: .count())
        async let tempS  = fetchSamples(wristTempType, since: since30)

        let (hrvDaily, rhrDaily, stepDaily, tempSamples) = await (hrv30, rhr30, step30, tempS)

        func avg(_ d: [Date: Double]) -> Double {
            d.isEmpty ? 0 : d.values.reduce(0,+) / Double(d.count)
        }
        func recentAvg(_ d: [Date: Double], days: Int) -> Double {
            let cutoff = cal.date(byAdding: .day, value: -days, to: now) ?? now
            let recent = d.filter { $0.key >= cutoff }
            return recent.isEmpty ? avg(d) : recent.values.reduce(0,+) / Double(recent.count)
        }

        let hrvBaseline = avg(hrvDaily)
        let hrv7 = recentAvg(hrvDaily, days: 7)
        let rhrBaseline = avg(rhrDaily)
        let rhr7 = recentAvg(rhrDaily, days: 7)
        let stepBaseline = avg(stepDaily)
        let step7 = recentAvg(stepDaily, days: 7)

        // Wrist temperature deviations
        var tempDevByDay: [Date: Double] = [:]
        var tempValues: [Double] = []
        for s in tempSamples {
            if let q = s as? HKQuantitySample {
                let v = q.quantity.doubleValue(for: .degreeCelsius())
                tempValues.append(v)
                let day = cal.startOfDay(for: q.startDate)
                tempDevByDay[day] = v
            }
        }
        let tempBaseline = tempValues.isEmpty ? 0.0 : tempValues.prefix(max(1, tempValues.count - 7)).reduce(0,+) / Double(max(1, tempValues.count - 7))
        let temp7 = tempValues.suffix(7).isEmpty ? 0.0 : tempValues.suffix(7).reduce(0,+) / Double(tempValues.suffix(7).count)
        let tempDeviation = tempBaseline == 0 ? 0 : temp7 - tempBaseline

        // Compute HRV deviation %
        let hrvDev = hrvBaseline > 0 ? (hrv7 - hrvBaseline) / hrvBaseline * 100 : 0
        // Compute RHR deviation %
        let rhrDev = rhrBaseline > 0 ? (rhr7 - rhrBaseline) / rhrBaseline * 100 : 0
        // Step deviation %
        let stepDev = stepBaseline > 0 ? (step7 - stepBaseline) / stepBaseline * 100 : 0

        // Score each signal (0-3)
        let hrvScore: Int = hrvDev < -20 ? 3 : hrvDev < -10 ? 2 : hrvDev < -5 ? 1 : 0
        let rhrScore: Int = rhrDev > 10 ? 3 : rhrDev > 5 ? 2 : rhrDev > 2 ? 1 : 0
        let stepScore: Int = stepDev < -40 ? 3 : stepDev < -20 ? 2 : stepDev < -10 ? 1 : 0
        let tempScore: Int = tempDeviation > 1.0 ? 3 : tempDeviation > 0.5 ? 2 : tempDeviation > 0.2 ? 1 : 0

        let total = hrvScore + rhrScore + stepScore + tempScore
        let level: AlertLevel = total < 3 ? .normal : total < 5 ? .caution : total < 7 ? .alert : .warning

        let builtSignals: [ImmuneSignal] = [
            ImmuneSignal(name: "HRV (7-day avg)", icon: "waveform.path.ecg",
                         value: hrv7 > 0 ? String(format: "%.0f ms", hrv7) : "—",
                         deviation: hrvDev, score: hrvScore,
                         color: hrvScore == 0 ? .green : hrvScore == 1 ? .yellow : .red,
                         detail: "Baseline: \(Int(hrvBaseline)) ms"),
            ImmuneSignal(name: "Resting HR (7-day)", icon: "heart.fill",
                         value: rhr7 > 0 ? String(format: "%.0f bpm", rhr7) : "—",
                         deviation: rhrDev, score: rhrScore,
                         color: rhrScore == 0 ? .green : rhrScore == 1 ? .yellow : .red,
                         detail: "Baseline: \(Int(rhrBaseline)) bpm"),
            ImmuneSignal(name: "Daily Steps (7-day)", icon: "figure.walk",
                         value: step7 > 0 ? String(format: "%.0f", step7) : "—",
                         deviation: stepDev, score: stepScore,
                         color: stepScore == 0 ? .green : stepScore == 1 ? .yellow : .red,
                         detail: "Baseline: \(Int(stepBaseline)) steps"),
            ImmuneSignal(name: "Wrist Temp (7-day)", icon: "thermometer.medium",
                         value: tempDeviation != 0 ? String(format: "%+.2f°C", tempDeviation) : "—",
                         deviation: tempDeviation * 100, score: tempScore,
                         color: tempScore == 0 ? .green : tempScore == 1 ? .yellow : .red,
                         detail: tempValues.isEmpty ? "No temp data (iOS 16+)" : "vs 30-day baseline"),
        ]

        // Build 30-day temperature deviation points
        let sortedDays = tempDevByDay.keys.sorted()
        let tempPts = sortedDays.map { day in
            DayPoint(date: day, value: tempDevByDay[day]! - tempBaseline)
        }

        // Build 30-day history (simplified composite from HRV + RHR daily)
        var alertHistory: [DayAlert] = []
        let allDays = Set(hrvDaily.keys).union(rhrDaily.keys).union(stepDaily.keys)
        for day in allDays.sorted() {
            let dayHRV  = hrvDaily[day]  ?? hrvBaseline
            let dayRHR  = rhrDaily[day]  ?? rhrBaseline
            let dayStep = stepDaily[day] ?? stepBaseline
            let dHRV = hrvBaseline > 0 ? (dayHRV - hrvBaseline) / hrvBaseline * 100 : 0
            let dRHR = rhrBaseline > 0 ? (dayRHR - rhrBaseline) / rhrBaseline * 100 : 0
            let dStep = stepBaseline > 0 ? (dayStep - stepBaseline) / stepBaseline * 100 : 0
            let dayHrvScore = dHRV < -20 ? 3 : dHRV < -10 ? 2 : dHRV < -5 ? 1 : 0
            let dayRhrScore = dRHR > 10 ? 3 : dRHR > 5 ? 2 : dRHR > 2 ? 1 : 0
            let dayStepScore = dStep < -40 ? 3 : dStep < -20 ? 2 : dStep < -10 ? 1 : 0
            alertHistory.append(DayAlert(date: day, totalScore: dayHrvScore + dayRhrScore + dayStepScore))
        }

        await MainActor.run {
            signals = builtSignals
            totalScore = total
            alertLevel = level
            tempPoints = tempPts
            recentAlerts = alertHistory
            isLoading = false
        }
    }

    private func fetchDailyAvg(_ id: HKQuantityTypeIdentifier, since: Date, unit: HKUnit) async -> [Date: Double] {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return [:] }
        let anchor = Calendar.current.startOfDay(for: since)
        var comps = DateComponents(); comps.day = 1
        return await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(quantityType: type, quantitySamplePredicate: nil,
                                                options: .discreteAverage, anchorDate: anchor,
                                                intervalComponents: comps)
            q.initialResultsHandler = { _, results, _ in
                var map: [Date: Double] = [:]
                results?.enumerateStatistics(from: since, to: Date()) { stat, _ in
                    if let v = stat.averageQuantity()?.doubleValue(for: unit) {
                        map[stat.startDate] = v
                    }
                }
                cont.resume(returning: map)
            }
            healthStore.execute(q)
        }
    }

    private func fetchDailySum(_ id: HKQuantityTypeIdentifier, since: Date, unit: HKUnit) async -> [Date: Double] {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return [:] }
        let anchor = Calendar.current.startOfDay(for: since)
        var comps = DateComponents(); comps.day = 1
        return await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(quantityType: type, quantitySamplePredicate: nil,
                                                options: .cumulativeSum, anchorDate: anchor,
                                                intervalComponents: comps)
            q.initialResultsHandler = { _, results, _ in
                var map: [Date: Double] = [:]
                results?.enumerateStatistics(from: since, to: Date()) { stat, _ in
                    if let v = stat.sumQuantity()?.doubleValue(for: unit) {
                        map[stat.startDate] = v
                    }
                }
                cont.resume(returning: map)
            }
            healthStore.execute(q)
        }
    }

    private func fetchSamples(_ type: HKQuantityType, since: Date) async -> [HKSample] {
        let pred = HKQuery.predicateForSamples(withStart: since, end: Date())
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: s ?? [])
            }
            healthStore.execute(q)
        }
    }
}

// MARK: - Public wrapper

struct ImmuneStressIndexView: View {
    var body: some View {
        if #available(iOS 16.0, *) {
            ImmuneStressContent()
        } else {
            VStack(spacing: 16) {
                Image(systemName: "cross.circle.fill").font(.system(size: 44)).foregroundStyle(.mint)
                Text("iOS 16 Required")
                    .font(.headline)
                Text("Immune Stress Index uses sleeping wrist temperature (iOS 16+). Update your device to access this feature.")
                    .font(.subheadline).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .navigationTitle("Immune Stress Index")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}
