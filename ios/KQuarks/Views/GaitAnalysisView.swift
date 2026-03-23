import SwiftUI
import HealthKit
import Charts

// MARK: - GaitAnalysisView
// Combines walkingSpeed, walkingStepLength, walkingAsymmetryPercentage,
// and walkingDoubleSupportPercentage — passively measured by iPhone & Apple Watch.
// Science: Studenski et al. 2011 (JAMA) — gait speed as a vital sign predicting longevity.

struct GaitAnalysisView: View {

    // MARK: - Model

    struct DailyGait: Identifiable {
        let id = UUID()
        let date: Date
        let speed: Double?          // m/s
        let stepLength: Double?     // m
        let asymmetry: Double?      // % (0–100)
        let doubleSupport: Double?  // % (0–100)
    }

    // MARK: - State

    @State private var dailyPoints: [DailyGait] = []
    @State private var isLoading = true
    @State private var selectedMetric: GaitMetric = .speed

    private let healthStore = HKHealthStore()

    // MARK: - Metric enum

    enum GaitMetric: String, CaseIterable {
        case speed = "Speed"
        case stepLength = "Step Length"
        case asymmetry = "Asymmetry"
        case doubleSupport = "Double Support"

        var unit: String {
            switch self {
            case .speed:         return "m/s"
            case .stepLength:    return "m"
            case .asymmetry:     return "%"
            case .doubleSupport: return "%"
            }
        }

        var color: Color {
            switch self {
            case .speed:         return .blue
            case .stepLength:    return .green
            case .asymmetry:     return .orange
            case .doubleSupport: return .purple
            }
        }

        var icon: String {
            switch self {
            case .speed:         return "figure.walk"
            case .stepLength:    return "ruler"
            case .asymmetry:     return "arrow.left.arrow.right"
            case .doubleSupport: return "figure.stand"
            }
        }

        var healthKitIdentifier: HKQuantityTypeIdentifier {
            switch self {
            case .speed:         return .walkingSpeed
            case .stepLength:    return .walkingStepLength
            case .asymmetry:     return .walkingAsymmetryPercentage
            case .doubleSupport: return .walkingDoubleSupportPercentage
            }
        }

        // Studenski 2011 & normative references
        var normalRange: ClosedRange<Double>? {
            switch self {
            case .speed:         return 1.0...1.4   // m/s
            case .stepLength:    return 0.65...0.80 // m
            case .asymmetry:     return 0...5.0     // %
            case .doubleSupport: return 18...25     // %
            }
        }

        var goodLabel: String {
            switch self {
            case .speed:         return ">1.0 m/s"
            case .stepLength:    return ">0.65 m"
            case .asymmetry:     return "<5%"
            case .doubleSupport: return "<25%"
            }
        }
    }

    // MARK: - Computed

    private var latestSpeed: Double?      { dailyPoints.last?.speed }
    private var latestStepLength: Double? { dailyPoints.last?.stepLength }
    private var latestAsymmetry: Double?  { dailyPoints.last?.asymmetry }
    private var latestDoubleSupport: Double? { dailyPoints.last?.doubleSupport }

    private var speedClassification: (label: String, color: Color) {
        guard let s = latestSpeed else { return ("Unknown", .gray) }
        switch s {
        case 1.2...:    return ("Excellent", .green)
        case 1.0..<1.2: return ("Normal", .blue)
        case 0.8..<1.0: return ("Slow", .yellow)
        default:        return ("Very Slow", .red)
        }
    }

    private var selectedValues: [(date: Date, value: Double)] {
        dailyPoints.compactMap { pt in
            let v: Double?
            switch selectedMetric {
            case .speed:         v = pt.speed
            case .stepLength:    v = pt.stepLength
            case .asymmetry:     v = pt.asymmetry
            case .doubleSupport: v = pt.doubleSupport
            }
            guard let val = v else { return nil }
            return (pt.date, val)
        }
    }

    private var avgValue: Double? {
        let vals = selectedValues.map(\.value)
        guard !vals.isEmpty else { return nil }
        return vals.reduce(0, +) / Double(vals.count)
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Vital sign headline
                vitalSignBanner

                // Summary cards
                summaryCards

                // Metric picker
                Picker("Metric", selection: $selectedMetric) {
                    ForEach(GaitMetric.allCases, id: \.self) { m in
                        Text(m.rawValue).tag(m)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                // Trend chart
                if !selectedValues.isEmpty {
                    trendChart
                }

                // Interpretation
                interpretationCard

                // Science card
                scienceCard

                // Age norms
                ageNormsCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Gait Analysis")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Loading gait data…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var vitalSignBanner: some View {
        VStack(spacing: 6) {
            HStack {
                Image(systemName: "figure.walk.circle.fill")
                    .foregroundStyle(.blue)
                Text("Gait Speed — A Vital Sign")
                    .font(.headline)
                Spacer()
            }
            Text("Walking speed predicts longevity better than age alone. Passively measured by iPhone & Apple Watch while you walk normally.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {

            GaitCard(
                title: "Walking Speed",
                value: latestSpeed.map { String(format: "%.2f", $0) } ?? "—",
                unit: "m/s",
                icon: "figure.walk",
                color: .blue,
                badge: speedClassification.label,
                badgeColor: speedClassification.color
            )

            GaitCard(
                title: "Step Length",
                value: latestStepLength.map { String(format: "%.2f", $0) } ?? "—",
                unit: "m",
                icon: "ruler",
                color: .green,
                badge: latestStepLength.map { $0 >= 0.65 ? "Normal" : "Short" } ?? "—",
                badgeColor: latestStepLength.map { $0 >= 0.65 ? .green : .orange } ?? .gray
            )

            GaitCard(
                title: "Asymmetry",
                value: latestAsymmetry.map { String(format: "%.1f", $0) } ?? "—",
                unit: "%",
                icon: "arrow.left.arrow.right",
                color: .orange,
                badge: latestAsymmetry.map { $0 < 5 ? "Balanced" : $0 < 10 ? "Mild" : "High" } ?? "—",
                badgeColor: latestAsymmetry.map { $0 < 5 ? .green : $0 < 10 ? .orange : .red } ?? .gray
            )

            GaitCard(
                title: "Double Support",
                value: latestDoubleSupport.map { String(format: "%.1f", $0) } ?? "—",
                unit: "%",
                icon: "figure.stand",
                color: .purple,
                badge: latestDoubleSupport.map { $0 < 25 ? "Normal" : $0 < 30 ? "Elevated" : "High" } ?? "—",
                badgeColor: latestDoubleSupport.map { $0 < 25 ? .green : $0 < 30 ? .yellow : .red } ?? .gray
            )
        }
        .padding(.horizontal)
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: selectedMetric.icon)
                    .foregroundStyle(selectedMetric.color)
                Text("\(selectedMetric.rawValue) — 90 Days")
                    .font(.subheadline).bold()
                Spacer()
                if let avg = avgValue {
                    Text(String(format: "Avg: %.2f \(selectedMetric.unit)", avg))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Chart {
                // Normal range band
                if let range = selectedMetric.normalRange {
                    RectangleMark(
                        xStart: .value("Start", selectedValues.first?.date ?? Date()),
                        xEnd:   .value("End",   selectedValues.last?.date  ?? Date()),
                        yStart: .value("Low",   range.lowerBound),
                        yEnd:   .value("High",  range.upperBound)
                    )
                    .foregroundStyle(selectedMetric.color.opacity(0.08))
                }

                ForEach(selectedValues, id: \.date) { pt in
                    LineMark(x: .value("Date", pt.date),
                             y: .value(selectedMetric.unit, pt.value))
                        .foregroundStyle(selectedMetric.color)
                        .interpolationMethod(.catmullRom)
                    AreaMark(x: .value("Date", pt.date),
                             y: .value(selectedMetric.unit, pt.value))
                        .foregroundStyle(selectedMetric.color.opacity(0.12))
                        .interpolationMethod(.catmullRom)
                }

                if let avg = avgValue {
                    RuleMark(y: .value("Avg", avg))
                        .lineStyle(StrokeStyle(dash: [4]))
                        .foregroundStyle(.secondary)
                        .annotation(position: .trailing) {
                            Text("avg").font(.caption2).foregroundStyle(.secondary)
                        }
                }
            }
            .frame(height: 180)
            .chartXAxis { AxisMarks(values: .stride(by: .month)) { _ in
                AxisValueLabel(format: .dateTime.month(.abbreviated))
            }}
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var interpretationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("What Your Gait Reveals", systemImage: "brain.head.profile")
                .font(.subheadline).bold()

            interpretationRow(
                icon: "figure.walk",
                color: .blue,
                title: "Speed",
                detail: speedClassification.label,
                detailColor: speedClassification.color,
                description: "≥1.0 m/s: normal longevity risk. ≥1.2 m/s: excellent. <0.8 m/s: elevated fall & mortality risk (Studenski 2011)."
            )

            Divider()

            interpretationRow(
                icon: "ruler",
                color: .green,
                title: "Step Length",
                detail: latestStepLength.map { $0 >= 0.65 ? "Normal" : "Short" } ?? "—",
                detailColor: latestStepLength.map { $0 >= 0.65 ? .green : .orange } ?? .gray,
                description: "Normal 0.65–0.80 m. Shorter steps indicate compensatory gait — may signal balance concern, fatigue, or injury."
            )

            Divider()

            interpretationRow(
                icon: "arrow.left.arrow.right",
                color: .orange,
                title: "Asymmetry",
                detail: latestAsymmetry.map { $0 < 5 ? "Balanced" : "Asymmetric" } ?? "—",
                detailColor: latestAsymmetry.map { $0 < 5 ? .green : .orange } ?? .gray,
                description: "<5% normal. Higher values may indicate leg length discrepancy, previous injury, or neuromuscular imbalance — injury risk marker."
            )

            Divider()

            interpretationRow(
                icon: "figure.stand",
                color: .purple,
                title: "Double Support",
                detail: latestDoubleSupport.map { $0 < 25 ? "Normal" : "Elevated" } ?? "—",
                detailColor: latestDoubleSupport.map { $0 < 25 ? .green : .yellow } ?? .gray,
                description: "Time both feet contact ground simultaneously. <25% normal. Increases with age, balance issues, and caution — reduces at faster speeds."
            )
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func interpretationRow(icon: String, color: Color, title: String,
                                   detail: String, detailColor: Color, description: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: icon).foregroundStyle(color).frame(width: 20)
                Text(title).font(.caption).bold()
                Spacer()
                Text(detail).font(.caption).bold().foregroundStyle(detailColor)
            }
            Text(description)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Research Foundation", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            VStack(alignment: .leading, spacing: 6) {
                scienceItem("Studenski et al. (JAMA 2011)", detail: "Gait speed is a powerful predictor of survival in older adults — as predictive as age, sex, and chronic conditions.")
                scienceItem("Middleton et al. (2015)", detail: "Walking speed >1.4 m/s in older adults associated with exceptional longevity.")
                scienceItem("Apple Health (2021)", detail: "iPhone passively estimates walking speed, step length, asymmetry & double support using accelerometer & barometer during normal walking — no setup required.")
                scienceItem("Lord & Menz (2004)", detail: "Gait asymmetry >10% significantly associated with fall history and balance disorders.")
            }
        }
        .padding()
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func scienceItem(_ title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption).bold().foregroundStyle(.primary)
            Text(detail).font(.caption2).foregroundStyle(.secondary)
        }
    }

    private var ageNormsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Age-Group Walking Speed Norms", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()

            let norms: [(age: String, speed: String, color: Color)] = [
                ("20–29", "1.34 m/s", .blue),
                ("30–39", "1.34 m/s", .blue),
                ("40–49", "1.32 m/s", .blue),
                ("50–59", "1.28 m/s", .green),
                ("60–69", "1.24 m/s", .yellow),
                ("70–79", "1.13 m/s", .orange),
                ("80+",   "0.94 m/s", .red),
            ]

            ForEach(norms, id: \.age) { norm in
                HStack {
                    Text(norm.age)
                        .font(.caption)
                        .frame(width: 60, alignment: .leading)
                    GeometryReader { geo in
                        let val = Double(norm.speed.dropLast(4)) ?? 1.0
                        let width = geo.size.width * (val / 1.4)
                        RoundedRectangle(cornerRadius: 3)
                            .fill(norm.color.opacity(0.7))
                            .frame(width: width, height: 16)
                    }
                    .frame(height: 16)
                    Text(norm.speed)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 60, alignment: .trailing)
                }
                .overlay(alignment: .leading) {
                    EmptyView()
                }
            }

            Text("Source: Bohannon & Andrews, 2011 meta-analysis (n=23,407)")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let types: [HKQuantityTypeIdentifier] = [
            .walkingSpeed,
            .walkingStepLength,
            .walkingAsymmetryPercentage,
            .walkingDoubleSupportPercentage
        ]

        let quantityTypes = types.compactMap { HKQuantityType.quantityType(forIdentifier: $0) }
        let readTypes = Set(quantityTypes.map { $0 as HKObjectType })

        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        } catch {
            isLoading = false
            return
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end)!
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let interval = DateComponents(day: 1)

        async let speedData    = fetchDailyAvg(typeId: .walkingSpeed,                  unit: HKUnit(from: "m/s"),   pred: pred, interval: interval, start: start, end: end)
        async let stepData     = fetchDailyAvg(typeId: .walkingStepLength,             unit: HKUnit(from: "m"),     pred: pred, interval: interval, start: start, end: end)
        async let asymData     = fetchDailyAvg(typeId: .walkingAsymmetryPercentage,    unit: .percent(),            pred: pred, interval: interval, start: start, end: end)
        async let dblSupData   = fetchDailyAvg(typeId: .walkingDoubleSupportPercentage, unit: .percent(),           pred: pred, interval: interval, start: start, end: end)

        let (speedMap, stepMap, asymMap, dblMap) = await (speedData, stepData, asymData, dblSupData)

        // Merge into daily points
        var calendar = Calendar.current
        calendar.timeZone = .current
        var current = start
        var points: [DailyGait] = []

        while current <= end {
            let key = calendar.startOfDay(for: current)
            points.append(DailyGait(
                date:          key,
                speed:         speedMap[key],
                stepLength:    stepMap[key],
                asymmetry:     asymMap[key].map { $0 * 100 },     // fraction → %
                doubleSupport: dblMap[key].map  { $0 * 100 }      // fraction → %
            ))
            current = calendar.date(byAdding: .day, value: 1, to: current)!
        }

        await MainActor.run {
            dailyPoints = points.filter { $0.speed != nil || $0.stepLength != nil }
            isLoading = false
        }
    }

    private func fetchDailyAvg(
        typeId: HKQuantityTypeIdentifier,
        unit: HKUnit,
        pred: NSPredicate,
        interval: DateComponents,
        start: Date,
        end: Date
    ) async -> [Date: Double] {
        guard let type = HKQuantityType.quantityType(forIdentifier: typeId) else { return [:] }
        return await withCheckedContinuation { cont in
            let query = HKStatisticsCollectionQuery(
                quantityType: type,
                quantitySamplePredicate: pred,
                options: .discreteAverage,
                anchorDate: start,
                intervalComponents: interval
            )
            query.initialResultsHandler = { _, collection, _ in
                var localResult: [Date: Double] = [:]
                collection?.enumerateStatistics(from: start, to: end) { stats, _ in
                    if let q = stats.averageQuantity() {
                        localResult[stats.startDate] = q.doubleValue(for: unit)
                    }
                }
                cont.resume(returning: localResult)
            }
            healthStore.execute(query)
        }
    }
}

// MARK: - GaitCard

private struct GaitCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color
    let badge: String
    let badgeColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Spacer()
                Text(badge)
                    .font(.caption2).bold()
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(badgeColor.opacity(0.15))
                    .foregroundStyle(badgeColor)
                    .clipShape(Capsule())
            }
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack(alignment: .lastTextBaseline, spacing: 3) {
                Text(value)
                    .font(.title2).bold()
                Text(unit)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
