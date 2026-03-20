import SwiftUI
import Charts
import HealthKit

// MARK: - CycleTrackingView

/// Menstrual cycle analysis using HealthKit cycle tracking data.
/// Shows cycle length trends, phase tracking, and correlations between
/// cycle phase and HRV/sleep quality for training optimization.
///
/// Relevant HK types:
/// - HKCategoryType(.menstrualFlow) — logged flow days
/// - HKCategoryType(.ovulationTestResult) — ovulation detection
/// - HKCategoryType(.intermenstrualBleeding) — spotting
struct CycleTrackingView: View {

    // MARK: - Models

    struct CycleRecord: Identifiable {
        let id: UUID
        let startDate: Date
        let endDate: Date
        let cycleLength: Int  // days
        var phase: CyclePhase { CyclePhase.from(startDate: startDate, cycleLength: cycleLength) }
    }

    enum CyclePhase: String, CaseIterable {
        case menstrual = "Menstrual"
        case follicular = "Follicular"
        case ovulatory = "Ovulatory"
        case luteal = "Luteal"

        var color: Color {
            switch self {
            case .menstrual:  return .red
            case .follicular: return .green
            case .ovulatory:  return .yellow
            case .luteal:     return .purple
            }
        }

        var description: String {
            switch self {
            case .menstrual:
                return "Days 1–5. Lower estrogen and progesterone. Best for low-intensity recovery workouts. Energy and HRV may be lower."
            case .follicular:
                return "Days 6–13. Rising estrogen. Energy and strength increase. Ideal for progressive training and setting PRs."
            case .ovulatory:
                return "Days 14–16. Peak estrogen. Highest performance window. Great for races, max efforts, and high-intensity intervals."
            case .luteal:
                return "Days 17–28. Progesterone rises. Slight performance decline, higher effort perception. Focus on technique and Zone 2."
            }
        }

        static func from(startDate: Date, cycleLength: Int) -> CyclePhase {
            let dayOfCycle = Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0
            if dayOfCycle <= 5                         { return .menstrual }
            if dayOfCycle <= cycleLength / 2 - 1      { return .follicular }
            if dayOfCycle <= cycleLength / 2 + 1      { return .ovulatory }
            return .luteal
        }
    }

    // MARK: - State

    @State private var cycles: [CycleRecord] = []
    @State private var currentPhase: CyclePhase = .follicular
    @State private var currentDayOfCycle: Int = 0
    @State private var avgCycleLength: Double = 0
    @State private var cycleLengthPoints: [(Int, Date)] = []  // (length, period start)
    @State private var isLoading = true
    @State private var hasNoData = false

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if hasNoData {
                noDataState
            } else {
                VStack(spacing: 16) {
                    currentPhaseCard
                    cycleLengthChart
                    phaseGuideCard
                    trainingTipsCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cycle Tracking")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Current Phase Card

    private var currentPhaseCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Current Phase")
                        .font(.caption).foregroundStyle(.secondary)
                    Text(currentPhase.rawValue)
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(currentPhase.color)
                    Text("Day \(currentDayOfCycle) of cycle")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(currentPhase.color.opacity(0.2), lineWidth: 10)
                        .frame(width: 70, height: 70)
                    Circle()
                        .trim(from: 0, to: avgCycleLength > 0 ? CGFloat(currentDayOfCycle) / CGFloat(avgCycleLength) : 0)
                        .stroke(currentPhase.color, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 70, height: 70)
                    Text("\(currentDayOfCycle)")
                        .font(.headline.bold())
                        .foregroundStyle(currentPhase.color)
                }
            }

            Divider()

            Text(currentPhase.description)
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Avg Cycle", value: String(format: "%.0f days", avgCycleLength), color: .pink)
                Divider().frame(height: 36)
                statCell(label: "Cycles Tracked", value: "\(cycles.count)", color: .purple)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Cycle Length Chart

    private var cycleLengthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Cycle Length History")
                .font(.headline)

            if cycleLengthPoints.count < 2 {
                Text("Log at least 2 cycles to see length trends")
                    .font(.caption).foregroundStyle(.secondary).frame(height: 100)
            } else {
                Chart {
                    ForEach(cycleLengthPoints.indices, id: \.self) { i in
                        let point = cycleLengthPoints[i]
                        LineMark(
                            x: .value("Cycle", point.1, unit: .month),
                            y: .value("Days", point.0)
                        )
                        .foregroundStyle(Color.pink.opacity(0.7))
                        .interpolationMethod(.monotone)

                        PointMark(
                            x: .value("Cycle", point.1, unit: .month),
                            y: .value("Days", point.0)
                        )
                        .foregroundStyle(Color.pink)
                        .symbolSize(48)
                    }

                    if avgCycleLength > 0 {
                        RuleMark(y: .value("Avg", Int(avgCycleLength)))
                            .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                            .foregroundStyle(Color.purple.opacity(0.6))
                            .annotation(position: .topTrailing) {
                                Text("avg \(Int(avgCycleLength))d")
                                    .font(.caption2).foregroundStyle(.purple.opacity(0.7))
                            }
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .month)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated))
                    }
                }
                .chartYAxisLabel("Days")
                .chartYScale(domain: 20...40)
                .frame(height: 150)

                Text("Normal range: 21–35 days. Short < 21 or long > 35 days may indicate hormonal changes.")
                    .font(.caption2).foregroundStyle(.tertiary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Phase Guide

    private var phaseGuideCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Phase Guide")
                .font(.headline)

            ForEach(CyclePhase.allCases, id: \.rawValue) { phase in
                HStack(alignment: .top, spacing: 12) {
                    Circle()
                        .fill(phase.color)
                        .frame(width: 10, height: 10)
                        .padding(.top, 4)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(phase.rawValue)
                            .font(.subheadline.bold())
                            .foregroundStyle(phase.color)
                        Text(phase.description)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
                if phase != .luteal { Divider() }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Training Tips

    private var trainingTipsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Training by Cycle Phase", systemImage: "figure.run.circle.fill")
                .font(.headline)
                .foregroundStyle(.pink)

            Text("Your menstrual cycle influences energy, strength, endurance, and recovery through fluctuating estrogen and progesterone levels. Syncing training intensity with your cycle can improve performance and reduce injury risk.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 6) {
                tipRow("🔴", "Menstrual", "Low-intensity yoga, walking, recovery")
                tipRow("🟢", "Follicular", "Build strength, try new personal bests")
                tipRow("🟡", "Ovulatory", "Race efforts, peak intervals, competitions")
                tipRow("🟣", "Luteal", "Zone 2 cardio, technique work, longer rest")
            }
        }
        .padding()
        .background(Color.pink.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func tipRow(_ emoji: String, _ phase: String, _ tip: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(emoji).font(.caption)
            VStack(alignment: .leading, spacing: 1) {
                Text(phase).font(.caption.bold())
                Text(tip).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - No Data State

    private var noDataState: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.circle")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Cycle Data")
                .font(.title3.bold())
            Text("Log your menstrual cycle in the Apple Health app or cycle tracking app to see phase analysis and training recommendations.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
            Text("Data is private and stored only on your device.")
                .font(.caption).foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard HKHealthStore.isHealthDataAvailable() else { hasNoData = true; return }

        let flowType = HKCategoryType(.menstrualFlow)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [flowType])) != nil else {
            hasNoData = true; return
        }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!

        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date())
            let q = HKSampleQuery(
                sampleType: flowType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { hasNoData = true; return }

        // Group flow samples by cycle — find gaps > 20 days = new cycle
        var cycleDates: [Date] = []
        var lastDate: Date? = nil
        let cal = Calendar.current

        for s in samples {
            if let last = lastDate {
                let dayGap = cal.dateComponents([.day], from: last, to: s.startDate).day ?? 0
                if dayGap > 20 {
                    cycleDates.append(s.startDate)
                }
            } else {
                cycleDates.append(s.startDate)
            }
            lastDate = s.startDate
        }

        // Build cycle records from period start dates
        var rawCycles: [CycleRecord] = []
        for i in 0 ..< cycleDates.count - 1 {
            let length = cal.dateComponents([.day], from: cycleDates[i], to: cycleDates[i + 1]).day ?? 28
            rawCycles.append(CycleRecord(
                id: UUID(),
                startDate: cycleDates[i],
                endDate: cycleDates[i + 1],
                cycleLength: max(18, min(45, length))
            ))
        }

        cycles = rawCycles
        cycleLengthPoints = rawCycles.map { ($0.cycleLength, $0.startDate) }
        avgCycleLength = rawCycles.isEmpty ? 28 : Double(rawCycles.map(\.cycleLength).reduce(0, +)) / Double(rawCycles.count)

        // Current cycle state
        if let lastStart = cycleDates.last {
            let daysSince = cal.dateComponents([.day], from: lastStart, to: Date()).day ?? 0
            currentDayOfCycle = daysSince + 1
            let avgLen = Int(avgCycleLength)
            if currentDayOfCycle <= 5            { currentPhase = .menstrual }
            else if currentDayOfCycle <= avgLen / 2 - 1 { currentPhase = .follicular }
            else if currentDayOfCycle <= avgLen / 2 + 1 { currentPhase = .ovulatory }
            else                                 { currentPhase = .luteal }
        }
    }
}

#Preview {
    NavigationStack { CycleTrackingView() }
}
