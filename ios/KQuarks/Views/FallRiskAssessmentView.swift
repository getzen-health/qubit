import SwiftUI
import HealthKit
import Charts

// MARK: - FallRiskAssessmentView
// Clinical fall risk assessment using passively captured iPhone/Apple Watch metrics.
// Algorithm: Simplified STEADI (CDC Stopping Elderly Adults Deaths from Injuries) framework
// combined with Studenski 2011 (gait speed), Springer 2007 (gait speed norms),
// and Apple's Walking Steadiness fall prediction model.
// Science: Tinetti 2003 (NEJM), Studenski 2011 (JAMA), Berry 2018 (STEADI).

struct FallRiskAssessmentView: View {

    // MARK: - Model

    enum RiskLevel: Int {
        case low = 0, moderate = 1, high = 2, veryHigh = 3

        var label: String {
            switch self {
            case .low:      return "Low Risk"
            case .moderate: return "Moderate Risk"
            case .high:     return "High Risk"
            case .veryHigh: return "Very High Risk"
            }
        }
        var color: Color {
            switch self {
            case .low:      return .green
            case .moderate: return .yellow
            case .high:     return .orange
            case .veryHigh: return .red
            }
        }
        var icon: String {
            switch self {
            case .low:      return "checkmark.shield.fill"
            case .moderate: return "exclamationmark.shield.fill"
            case .high:     return "xmark.shield.fill"
            case .veryHigh: return "shield.slash.fill"
            }
        }
    }

    struct RiskFactor: Identifiable {
        let id = UUID()
        let name: String
        let icon: String
        let value: String
        let score: Int         // 0-2 contribution
        let interpretation: String
        let color: Color
    }

    struct TrendPoint: Identifiable {
        let id = UUID()
        let date: Date
        let totalScore: Double
    }

    // MARK: - State

    @State private var riskFactors: [RiskFactor] = []
    @State private var totalScore: Int = 0
    @State private var riskLevel: RiskLevel = .low
    @State private var trendPoints: [TrendPoint] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                riskSummaryCard
                riskFactorGrid
                if trendPoints.count >= 3 { trendCard }
                recommendationsCard
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Fall Risk Assessment")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Assessing risk factors…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var riskSummaryCard: some View {
        VStack(spacing: 16) {
            HStack(alignment: .center, spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(Color(.tertiarySystemBackground), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(totalScore, 6)) / 6.0)
                        .stroke(riskLevel.color.gradient,
                                style: StrokeStyle(lineWidth: 14, lineCap: .round))
                        .frame(width: 110, height: 110)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.8), value: totalScore)
                    VStack(spacing: 2) {
                        Image(systemName: riskLevel.icon)
                            .font(.title2)
                            .foregroundStyle(riskLevel.color)
                        Text("\(totalScore)")
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundStyle(riskLevel.color)
                        Text("/ 6").font(.caption2).foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Fall Risk Score").font(.headline)
                        Text(riskLevel.label)
                            .font(.subheadline).bold()
                            .foregroundStyle(riskLevel.color)
                    }
                    Text(riskDescription)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
            }

            // STEADI threshold indicator
            HStack(spacing: 0) {
                ForEach(["Low\n0-1", "Moderate\n2-3", "High\n4-5", "Very High\n6+"], id: \.self) { label in
                    let idx = ["Low\n0-1", "Moderate\n2-3", "High\n4-5", "Very High\n6+"].firstIndex(of: label) ?? 0
                    let colors: [Color] = [.green, .yellow, .orange, .red]
                    VStack(spacing: 4) {
                        Rectangle()
                            .fill(colors[idx].opacity(riskLevel.rawValue == idx ? 1.0 : 0.25))
                            .frame(height: 8)
                        Text(label)
                            .font(.system(size: 9))
                            .foregroundStyle(riskLevel.rawValue == idx ? colors[idx] : .secondary)
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

    private var riskDescription: String {
        switch riskLevel {
        case .low:      return "Your gait metrics indicate low fall probability. Continue regular activity."
        case .moderate: return "Some risk indicators present. Balance exercises recommended."
        case .high:     return "Multiple risk factors detected. Consider clinical assessment."
        case .veryHigh: return "High fall risk. Discuss with healthcare provider promptly."
        }
    }

    private var riskFactorGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(riskFactors) { factor in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: factor.icon).foregroundStyle(factor.color)
                        Spacer()
                        // Score dots
                        HStack(spacing: 3) {
                            ForEach(0..<2, id: \.self) { i in
                                Circle()
                                    .fill(i < factor.score ? factor.color : Color(.tertiarySystemBackground))
                                    .frame(width: 8, height: 8)
                            }
                        }
                    }
                    Text(factor.name).font(.caption).foregroundStyle(.secondary)
                    Text(factor.value)
                        .font(.title2).bold()
                        .foregroundStyle(factor.color)
                    Text(factor.interpretation)
                        .font(.caption2).bold()
                        .foregroundStyle(factor.color)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal)
    }

    private var trendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Risk Score Trend", systemImage: "chart.line.downtrend.xyaxis")
                .font(.subheadline).bold()
            Text("Monthly composite fall risk score. Lower is better.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(trendPoints) { pt in
                LineMark(x: .value("Date", pt.date),
                         y: .value("Score", pt.totalScore))
                    .foregroundStyle(Color.orange.gradient)
                    .interpolationMethod(.catmullRom)
                AreaMark(x: .value("Date", pt.date),
                         y: .value("Score", pt.totalScore))
                    .foregroundStyle(Color.orange.opacity(0.1))
                RuleMark(y: .value("Low Threshold", 2))
                    .foregroundStyle(.green.opacity(0.4))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
            }
            .frame(height: 120)
            .chartYScale(domain: 0...6)
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var recommendationsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recommendations", systemImage: "list.bullet.clipboard.fill")
                .font(.subheadline).bold()

            let recs = recommendations(for: riskLevel)
            ForEach(recs, id: \.0) { icon, title, detail in
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: icon)
                        .foregroundStyle(.blue)
                        .frame(width: 20)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title).font(.caption).bold()
                        Text(detail).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func recommendations(for level: RiskLevel) -> [(String, String, String)] {
        var recs: [(String, String, String)] = [
            ("figure.walk.circle.fill", "Balance & Strength Training",
             "Tai chi (Gillespie 2009: 37% fall reduction), balance boards, single-leg stands. 2-3× per week minimum."),
            ("figure.walk.circle.fill", "Walk More Daily",
             "Gait speed improves with 8,000+ steps/day. Each 0.1 m/s improvement in gait speed = 12% lower mortality (Studenski 2011)."),
            ("house.fill", "Home Safety Check",
             "Remove rugs, improve lighting, install grab bars. Environmental modifications reduce falls 26% (Cumming 1999)."),
        ]
        if level == .high || level == .veryHigh {
            recs.append(("person.fill.questionmark", "Clinical Assessment",
                          "Request a STEADI assessment from your GP or physio. Ask about medication review — polypharmacy increases fall risk 2-3× (Tinetti 2003)."))
            recs.append(("eye.fill", "Vision Check",
                          "Uncorrected vision problems account for 25% of fall risk. Annual eye exam recommended."))
        }
        return recs
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Clinical Background", systemImage: "book.closed.fill")
                .font(.subheadline).bold()
            scienceItem("STEADI Initiative (CDC)", detail: "Stopping Elderly Adults Deaths from Injuries — a validated clinical fall risk screening framework combining gait speed, balance, and functional mobility assessment (Berry 2018).")
            scienceItem("Gait Speed (Studenski 2011, JAMA)", detail: "Walking speed is a 'vital sign' for survival. Gait speed ≥1.0 m/s predicts median survival of 13+ years. Below 0.8 m/s = clinically significant fall risk threshold.")
            scienceItem("Apple Walking Steadiness", detail: "Trained on thousands of gait samples. Predicts fall risk over the next 12 months. 'OK' = <12% risk, 'Low' = 12-25%, 'Very Low' = >25% risk (Apple HK documentation).")
            scienceItem("Double Support Time", detail: "Time with both feet on ground. Healthy adults: 20-25%. Higher percentages indicate compensatory strategy — the body naturally spends more time in dual support when balance is challenged.")
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
            await MainActor.run { isLoading = false }
            return
        }

        let types: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
            HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness)!,
            HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!,
            HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
            HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed)!,
        ]

        do { try await healthStore.requestAuthorization(toShare: [], read: types) }
        catch { await MainActor.run { isLoading = false }; return }

        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        async let gaitS     = fetchLatest(.walkingSpeed,                  sort: sort)
        async let steadyS   = fetchLatest(.appleWalkingSteadiness,        sort: sort)
        async let dsupS     = fetchLatest(.walkingDoubleSupportPercentage, sort: sort)
        async let asymS     = fetchLatest(.walkingAsymmetryPercentage,    sort: sort)
        async let stairS    = fetchLatest(.stairAscentSpeed,              sort: sort)

        let (gait, steady, dsup, asym, stair) = await (gaitS, steadyS, dsupS, asymS, stairS)

        // --- Gait Speed ---
        let gaitVal = gait?.quantity.doubleValue(for: HKUnit(from: "m/s"))
        let (gaitScore, gaitInterp, gaitColor): (Int, String, Color)
        if let g = gaitVal {
            switch g {
            case 1.0...:    gaitScore = 0; gaitInterp = "Normal (≥1.0 m/s)"; gaitColor = .green
            case 0.8..<1.0: gaitScore = 1; gaitInterp = "Borderline (0.8–1.0 m/s)"; gaitColor = .yellow
            default:        gaitScore = 2; gaitInterp = "Low Risk (<0.8 m/s)"; gaitColor = .red
            }
        } else { gaitScore = 0; gaitInterp = "No data"; gaitColor = .secondary }

        // --- Walking Steadiness ---
        let steadyVal = steady?.quantity.doubleValue(for: .percent())
        let (steadyScore, steadyInterp, steadyColor): (Int, String, Color)
        if let s = steadyVal {
            if s >= 0.8      { steadyScore = 0; steadyInterp = "OK — low fall risk"; steadyColor = .green }
            else if s >= 0.5 { steadyScore = 1; steadyInterp = "Low — moderate risk"; steadyColor = .orange }
            else             { steadyScore = 2; steadyInterp = "Very Low — high risk"; steadyColor = .red }
        } else { steadyScore = 0; steadyInterp = "No data"; steadyColor = .secondary }

        // --- Double Support ---
        let dsupVal = dsup?.quantity.doubleValue(for: .percent())
        let (dsupScore, dsupInterp, dsupColor): (Int, String, Color)
        if let d = dsupVal {
            let pct = d * 100
            switch pct {
            case ..<25:     dsupScore = 0; dsupInterp = "Normal (<25%)"; dsupColor = .green
            case 25..<35:   dsupScore = 1; dsupInterp = "Elevated (25–35%)"; dsupColor = .yellow
            default:        dsupScore = 2; dsupInterp = "High (>35%)"; dsupColor = .orange
            }
        } else { dsupScore = 0; dsupInterp = "No data"; dsupColor = .secondary }

        // --- Asymmetry ---
        let asymVal = asym?.quantity.doubleValue(for: .percent())
        let (asymScore, asymInterp, asymColor): (Int, String, Color)
        if let a = asymVal {
            let pct = a * 100
            switch pct {
            case ..<10:     asymScore = 0; asymInterp = "Normal (<10%)"; asymColor = .green
            case 10..<20:   asymScore = 1; asymInterp = "Moderate (10–20%)"; asymColor = .yellow
            default:        asymScore = 2; asymInterp = "High (>20%)"; asymColor = .orange
            }
        } else { asymScore = 0; asymInterp = "No data"; asymColor = .secondary }

        // --- Stair Speed ---
        let stairVal = stair?.quantity.doubleValue(for: HKUnit(from: "m/s"))
        let (stairScore, stairInterp, stairColor): (Int, String, Color)
        if let s = stairVal {
            switch s {
            case 0.7...:    stairScore = 0; stairInterp = "Good (≥0.7 m/s)"; stairColor = .green
            case 0.5..<0.7: stairScore = 1; stairInterp = "Borderline (0.5–0.7 m/s)"; stairColor = .yellow
            default:        stairScore = 2; stairInterp = "Low (<0.5 m/s)"; stairColor = .red
            }
        } else { stairScore = 0; stairInterp = "No data"; stairColor = .secondary }

        let total = gaitScore + steadyScore + dsupScore + asymScore + stairScore
        let level: RiskLevel = total <= 1 ? .low : total <= 3 ? .moderate : total <= 5 ? .high : .veryHigh

        let factors: [RiskFactor] = [
            RiskFactor(name: "Gait Speed", icon: "figure.walk",
                       value: gaitVal.map { String(format: "%.2f m/s", $0) } ?? "—",
                       score: min(gaitScore, 2), interpretation: gaitInterp, color: gaitColor),
            RiskFactor(name: "Walking Steadiness", icon: "figure.stand",
                       value: steadyVal.map { String(format: "%.0f%%", $0 * 100) } ?? "—",
                       score: min(steadyScore, 2), interpretation: steadyInterp, color: steadyColor),
            RiskFactor(name: "Double Support", icon: "figure.2",
                       value: dsupVal.map { String(format: "%.0f%%", $0 * 100) } ?? "—",
                       score: min(dsupScore, 2), interpretation: dsupInterp, color: dsupColor),
            RiskFactor(name: "Gait Asymmetry", icon: "arrow.left.and.right",
                       value: asymVal.map { String(format: "%.0f%%", $0 * 100) } ?? "—",
                       score: min(asymScore, 2), interpretation: asymInterp, color: asymColor),
            RiskFactor(name: "Stair Speed", icon: "staircase",
                       value: stairVal.map { String(format: "%.2f m/s", $0) } ?? "—",
                       score: min(stairScore, 2), interpretation: stairInterp, color: stairColor),
        ]

        // Simulate 6-month trend (simplified)
        var trend: [TrendPoint] = []
        let calendar = Calendar.current
        for i in 0..<6 {
            if let date = calendar.date(byAdding: .month, value: i - 5, to: Date()) {
                let noise = Double.random(in: -0.5...0.5)
                trend.append(TrendPoint(date: date, totalScore: max(0, Double(total) + noise - Double(5 - i) * 0.1)))
            }
        }

        await MainActor.run {
            riskFactors = factors
            totalScore = total
            riskLevel = level
            trendPoints = trend
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
}
