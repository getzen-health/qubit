import SwiftUI
import Charts
import HealthKit

// MARK: - CardiacDriftView

/// Detects cardiac drift in long running workouts (≥ 45 min) by comparing
/// average heart rate in the first vs second half. High drift indicates
/// insufficient aerobic base, dehydration, or heat fatigue.
///
/// Cardiac Drift % = (secondHalfHR - firstHalfHR) / firstHalfHR × 100
/// < 5%:  Excellent — well-trained aerobic engine
/// 5–10%: Moderate — focus on Zone 2 base building
/// > 10%: Significant — fueling, hydration, or base issue
struct CardiacDriftView: View {

    // MARK: - Models

    struct RunAnalysis: Identifiable {
        let id: UUID = UUID()
        let date: Date
        let durationMins: Double
        let firstHalfHR: Double
        let secondHalfHR: Double
        var driftPct: Double { (secondHalfHR - firstHalfHR) / firstHalfHR * 100 }
        var driftLevel: DriftLevel { DriftLevel.from(pct: driftPct) }
    }

    enum DriftLevel {
        case excellent, moderate, significant

        var color: Color {
            switch self {
            case .excellent:  return .green
            case .moderate:   return .orange
            case .significant: return .red
            }
        }

        var label: String {
            switch self {
            case .excellent:  return "Excellent"
            case .moderate:   return "Moderate Drift"
            case .significant: return "High Drift"
            }
        }

        static func from(pct: Double) -> DriftLevel {
            if pct < 5.0 { return .excellent }
            if pct < 10.0 { return .moderate }
            return .significant
        }
    }

    // MARK: - State

    @State private var analyses: [RunAnalysis] = []
    @State private var avgDrift: Double = 0
    @State private var bestDrift: Double = 0
    @State private var worstDrift: Double = 0
    @State private var trendImproving: Bool? = nil
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if analyses.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    driftTrendChart
                    runTableCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cardiac Drift")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let currentLevel = DriftLevel.from(pct: avgDrift)

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Average Drift")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", avgDrift))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(currentLevel.color)
                        Text("%")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(currentLevel.color).frame(width: 8, height: 8)
                        Text(currentLevel.label)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(currentLevel.color)
                    }
                }

                Spacer()

                VStack(spacing: 8) {
                    if let improving = trendImproving {
                        Label(improving ? "Improving" : "Worsening", systemImage: improving ? "arrow.down.right.circle.fill" : "arrow.up.right.circle.fill")
                            .font(.caption.bold())
                            .foregroundStyle(improving ? .green : .orange)
                    }
                    Text("\(analyses.count) long runs")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Best Drift", value: String(format: "%.1f%%", bestDrift), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Avg Drift", value: String(format: "%.1f%%", avgDrift), color: currentLevel.color)
                Divider().frame(height: 36)
                statCell(label: "Worst Drift", value: String(format: "%.1f%%", worstDrift), color: .red)
            }

            Text(explanationText(drift: avgDrift))
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private func explanationText(drift: Double) -> String {
        switch DriftLevel.from(pct: drift) {
        case .excellent:
            return "Great aerobic base. Your HR stays steady even in the second half of long runs — a hallmark of well-trained endurance."
        case .moderate:
            return "Moderate cardiac drift. Adding more Zone 2 volume (easy runs at 60–70% max HR) will improve your aerobic engine over the next 6–8 weeks."
        case .significant:
            return "High drift suggests fueling, hydration, or aerobic base issues. Check your nutrition strategy for runs > 60 min, and prioritize easy aerobic runs."
        }
    }

    // MARK: - Drift Trend Chart

    private var driftTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Cardiac Drift per Long Run")
                .font(.headline)

            Chart {
                ForEach(analyses) { run in
                    PointMark(
                        x: .value("Date", run.date),
                        y: .value("Drift %", run.driftPct)
                    )
                    .foregroundStyle(run.driftLevel.color)
                    .symbolSize(64)

                    LineMark(
                        x: .value("Date", run.date),
                        y: .value("Drift %", run.driftPct)
                    )
                    .foregroundStyle(Color.secondary.opacity(0.3))
                    .interpolationMethod(.linear)
                }

                RuleMark(y: .value("Target", 5.0))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 3]))
                    .foregroundStyle(.orange)
                    .annotation(position: .topTrailing) {
                        Text("5% — target max")
                            .font(.caption2)
                            .foregroundStyle(.orange)
                    }

                RuleMark(y: .value("High", 10.0))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    .foregroundStyle(.red.opacity(0.6))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Drift %")
            .chartYScale(domain: 0...max(15, (analyses.map(\.driftPct).max() ?? 15) * 1.1))
            .frame(height: 200)

            HStack(spacing: 16) {
                driftLegendDot(level: .excellent)
                driftLegendDot(level: .moderate)
                driftLegendDot(level: .significant)
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func driftLegendDot(level: DriftLevel) -> some View {
        HStack(spacing: 4) {
            Circle().fill(level.color).frame(width: 8, height: 8)
            Text(level.label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Run Table

    private var runTableCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Long Run Breakdown")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 70, alignment: .leading)
                    Text("Duration").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .trailing)
                    Text("1st Half").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                    Text("2nd Half").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                    Text("Drift").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                let df = DateFormatter()
                let _ = { df.dateFormat = "MMM d" }()

                ForEach(analyses.suffix(12).reversed()) { run in
                    Divider()
                    HStack {
                        Text(df.string(from: run.date))
                            .font(.caption)
                            .frame(width: 70, alignment: .leading)
                        Text(String(format: "%.0fm", run.durationMins))
                            .font(.caption.monospacedDigit())
                            .frame(width: 60, alignment: .trailing)
                        Text(String(format: "%.0f", run.firstHalfHR))
                            .font(.caption.monospacedDigit())
                            .frame(width: 55, alignment: .trailing)
                        Text(String(format: "%.0f", run.secondHalfHR))
                            .font(.caption.monospacedDigit())
                            .frame(width: 55, alignment: .trailing)
                        Text(String(format: "%.1f%%", run.driftPct))
                            .font(.caption.bold().monospacedDigit())
                            .foregroundStyle(run.driftLevel.color)
                            .frame(width: 45, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 7)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("What Is Cardiac Drift?", systemImage: "heart.text.clipboard.fill")
                .font(.headline)
                .foregroundStyle(.indigo)

            Text("Cardiac drift is the natural rise in heart rate during prolonged exercise, even at constant pace/effort. It occurs because the heart beats faster to compensate for plasma volume loss (sweat) and blood redistribution to the skin for cooling.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Athletes with strong aerobic bases show minimal drift (< 5%) because their cardiovascular system is more efficient. High drift (> 10%) suggests the aerobic engine needs more Zone 2 training, or points to inadequate fueling/hydration.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("This analysis uses HR samples recorded by Apple Watch during running workouts ≥ 45 minutes.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .italic()
        }
        .padding()
        .background(Color.indigo.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.run.circle")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Long Runs Found")
                .font(.title3.bold())
            Text("Cardiac drift analysis requires Apple Watch heart rate data from running workouts of at least 45 minutes. Complete a few long runs to see your drift trend.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, hrType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()

        // Fetch running workouts ≥ 45 minutes
        let longRuns: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: .running)
            ])
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        let eligibleRuns = longRuns.filter { $0.duration >= 45 * 60 }
        guard !eligibleRuns.isEmpty else { return }

        var results: [RunAnalysis] = []
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        for run in eligibleRuns {
            let mid = run.startDate.addingTimeInterval(run.duration / 2)

            // Fetch HR samples for this run
            let hrSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
                let pred = HKQuery.predicateForSamples(withStart: run.startDate, end: run.endDate)
                let q = HKSampleQuery(
                    sampleType: hrType, predicate: pred,
                    limit: HKObjectQueryNoLimit,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
                ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
                healthStore.execute(q)
            }

            guard hrSamples.count >= 10 else { continue }

            let firstHalf = hrSamples.filter { $0.startDate < mid }
            let secondHalf = hrSamples.filter { $0.startDate >= mid }

            guard !firstHalf.isEmpty && !secondHalf.isEmpty else { continue }

            let avgFirst = firstHalf.map { $0.quantity.doubleValue(for: hrUnit) }.reduce(0, +) / Double(firstHalf.count)
            let avgSecond = secondHalf.map { $0.quantity.doubleValue(for: hrUnit) }.reduce(0, +) / Double(secondHalf.count)

            guard avgFirst > 0 else { continue }

            results.append(RunAnalysis(
                date: run.startDate,
                durationMins: run.duration / 60,
                firstHalfHR: avgFirst,
                secondHalfHR: avgSecond
            ))
        }

        guard !results.isEmpty else { return }

        analyses = results

        let driftValues = results.map(\.driftPct)
        avgDrift = driftValues.reduce(0, +) / Double(driftValues.count)
        bestDrift = driftValues.min() ?? 0
        worstDrift = driftValues.max() ?? 0

        // Trend: compare first half vs second half of all runs (linear)
        if results.count >= 4 {
            let firstAvg = results.prefix(results.count / 2).map(\.driftPct).reduce(0, +) / Double(results.count / 2)
            let secondAvg = results.suffix(results.count / 2).map(\.driftPct).reduce(0, +) / Double(results.count / 2)
            trendImproving = secondAvg < firstAvg
        }
    }
}

#Preview {
    NavigationStack {
        CardiacDriftView()
    }
}
