import SwiftUI
import Charts
import HealthKit

// MARK: - TrainingMonotonyView

/// Training Monotony & Strain Index — Andrew Coggan's training science metrics.
///
/// Monotony = mean daily load / std deviation of daily load.
///   High monotony means the same load day after day → no rest → higher injury risk.
///   Target: < 2.0 (below 1.5 is excellent, above 2.5 is dangerous).
///
/// Strain = weekly load × monotony.
///   Tracks cumulative stress. Spikes in strain correlate with illness and injury.
struct TrainingMonotonyView: View {

    // MARK: - Models

    struct WeekMetrics: Identifiable {
        let id: Date         // Monday
        let monday: Date
        let weeklyLoad: Double   // total minutes that week
        let avgDailyLoad: Double
        let monotony: Double     // mean / SD
        let strain: Double       // weeklyLoad × monotony
        let phase: MonotonyZone
    }

    enum MonotonyZone {
        case excellent, good, elevated, high

        var label: String {
            switch self {
            case .excellent: return "Excellent"
            case .good: return "Good"
            case .elevated: return "Elevated"
            case .high: return "High Risk"
            }
        }

        var color: Color {
            switch self {
            case .excellent: return .green
            case .good: return .teal
            case .elevated: return .orange
            case .high: return .red
            }
        }

        static func from(_ m: Double) -> MonotonyZone {
            if m < 1.5 { return .excellent }
            if m < 2.0 { return .good }
            if m < 2.5 { return .elevated }
            return .high
        }
    }

    // MARK: - State

    @State private var weekMetrics: [WeekMetrics] = []
    @State private var currentMonotony: Double = 0
    @State private var currentStrain: Double = 0
    @State private var currentZone: MonotonyZone = .good
    @State private var avgMonotony: Double = 0
    @State private var peakStrain: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if weekMetrics.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    monotonyChartCard
                    strainChartCard
                    weeklyTableCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Monotony & Strain")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 20) {
                metricGauge(
                    value: currentMonotony,
                    label: "Monotony",
                    unit: "",
                    color: currentZone.color,
                    target: "< 2.0"
                )
                Divider().frame(height: 80)
                metricGauge(
                    value: currentStrain,
                    label: "Strain",
                    unit: "",
                    color: strainColor(),
                    target: "Trend ↓"
                )
            }

            Divider()

            HStack {
                Image(systemName: currentZone.color == .green || currentZone.color == .teal ? "checkmark.shield.fill" : "exclamationmark.triangle.fill")
                    .foregroundStyle(currentZone.color)
                Text(summaryText())
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            HStack(spacing: 0) {
                zoneLegendItem(zone: .excellent)
                zoneLegendItem(zone: .good)
                zoneLegendItem(zone: .elevated)
                zoneLegendItem(zone: .high)
            }
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func metricGauge(value: Double, label: String, unit: String, color: Color, target: String) -> some View {
        VStack(spacing: 4) {
            Text(String(format: "%.2f", value))
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.subheadline.weight(.medium))
            Text("Target: \(target)")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func zoneLegendItem(zone: MonotonyZone) -> some View {
        VStack(spacing: 2) {
            Rectangle()
                .fill(zone.color.opacity(0.8))
                .frame(height: 6)
            Text(zone.label)
                .font(.system(size: 8))
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
    }

    private func summaryText() -> String {
        switch currentZone {
        case .excellent:
            return "Great variety in daily training load — your body is getting the stress and recovery variation it needs."
        case .good:
            return "Monotony is in the healthy zone. Keep mixing hard and easy days to maintain this balance."
        case .elevated:
            return "Training is becoming repetitive. Add deliberate rest days or vary session intensity."
        case .high:
            return "Dangerously monotonous training load — high injury and overtraining risk. Schedule rest days immediately."
        }
    }

    // MARK: - Monotony Chart

    private var monotonyChartCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Monotony — 12 Weeks")
                .font(.headline)

            let recent = weekMetrics.suffix(12)

            Chart {
                ForEach(recent) { w in
                    BarMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("Monotony", w.monotony)
                    )
                    .foregroundStyle(MonotonyZone.from(w.monotony).color.opacity(0.8))
                    .cornerRadius(4)
                }

                RuleMark(y: .value("Good", 2.0))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 3]))
                    .foregroundStyle(.orange)
                    .annotation(position: .topTrailing) {
                        Text("2.0 — target max")
                            .font(.caption2)
                            .foregroundStyle(.orange)
                    }

                RuleMark(y: .value("Danger", 2.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    .foregroundStyle(.red.opacity(0.6))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYScale(domain: 0...max(3.0, (weekMetrics.suffix(12).map(\.monotony).max() ?? 3) * 1.1))
            .frame(height: 160)

            Text("Monotony = avg daily load ÷ std deviation. Measures how similar each day's training is.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Strain Chart

    private var strainChartCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Strain Index — 12 Weeks")
                .font(.headline)

            let recent = weekMetrics.suffix(12)

            Chart {
                ForEach(recent) { w in
                    LineMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("Strain", w.strain)
                    )
                    .foregroundStyle(.purple.opacity(0.7))
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("Strain", w.strain)
                    )
                    .foregroundStyle(.purple.opacity(0.1))
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("Strain", w.strain)
                    )
                    .foregroundStyle(.purple)
                    .symbolSize(24)
                }

                if peakStrain > 0 {
                    RuleMark(y: .value("Avg", weekMetrics.suffix(12).map(\.strain).reduce(0, +) / Double(min(weekMetrics.count, 12))))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                        .foregroundStyle(.secondary)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .frame(height: 140)

            Text("Strain = weekly load × monotony. High strain spikes correlate with illness and injury onset.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Weekly Table

    private var weeklyTableCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Last 8 Weeks")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Week").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 70, alignment: .leading)
                    Text("Load (min)").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .trailing)
                    Text("Monotony").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 70, alignment: .trailing)
                    Text("Strain").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                let df = DateFormatter()
                let _ = { df.dateFormat = "MMM d" }()

                ForEach(weekMetrics.suffix(8).reversed()) { w in
                    let zone = MonotonyZone.from(w.monotony)
                    Divider()
                    HStack {
                        Text(df.string(from: w.monday))
                            .font(.caption)
                            .frame(width: 70, alignment: .leading)
                        Text(String(format: "%.0f", w.weeklyLoad))
                            .font(.caption.monospacedDigit())
                            .frame(maxWidth: .infinity, alignment: .trailing)
                        Text(String(format: "%.2f", w.monotony))
                            .font(.caption.bold().monospacedDigit())
                            .foregroundStyle(zone.color)
                            .frame(width: 70, alignment: .trailing)
                        Text(String(format: "%.0f", w.strain))
                            .font(.caption.monospacedDigit())
                            .frame(width: 55, alignment: .trailing)
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
            Label("The Science", systemImage: "atom")
                .font(.headline)
                .foregroundStyle(.indigo)

            VStack(alignment: .leading, spacing: 6) {
                scienceFact("Monotony < 1.5: Excellent variety — mixing hard and easy days protects against overtraining.")
                scienceFact("Monotony 1.5–2.0: Acceptable. Your training has enough variation for adaptation.")
                scienceFact("Monotony > 2.0: Too similar day-to-day. Systematic rest days or intensity variation are needed.")
                scienceFact("Strain spikes → illness. Studies show spikes in the strain index precede illness and overuse injury by 3–7 days.")
            }

            Text("Based on Coggan & Foster's training load research (1996) and subsequent validation studies in endurance sport.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .italic()
        }
        .padding()
        .background(Color.indigo.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func scienceFact(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•").font(.caption).foregroundStyle(.indigo)
            Text(text).font(.caption).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Training monotony analysis requires at least 2 weeks of workout history. Keep training and check back.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func strainColor() -> Color {
        guard let recentPeak = weekMetrics.suffix(4).map(\.strain).max(),
              peakStrain > 0 else { return .purple }
        let pct = recentPeak / peakStrain
        if pct > 0.9 { return .red }
        if pct > 0.7 { return .orange }
        return .purple
    }

    // MARK: - Data Loading

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else { return }

        let twelveWeeksAgo = Calendar.current.date(byAdding: .weekOfYear, value: -12, to: Date()) ?? Date()
        let allWorkouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: workoutType,
                predicate: HKQuery.predicateForSamples(withStart: twelveWeeksAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            healthStore.execute(q)
        }

        guard !allWorkouts.isEmpty else { return }

        let cal = Calendar.current
        // Build day-level map: date → total minutes
        var dayMap: [Date: Double] = [:]
        for w in allWorkouts where w.duration > 180 {
            let dayStart = cal.startOfDay(for: w.startDate)
            dayMap[dayStart, default: 0] += w.duration / 60.0
        }

        // Build weekly buckets with monotony/strain
        var metrics: [WeekMetrics] = []
        for weekOffset in 0..<12 {
            let monday = mondayOf(date: cal.date(byAdding: .weekOfYear, value: -(11 - weekOffset), to: Date()) ?? Date(), cal: cal)

            // Get all 7 days of this week
            var dailyLoads: [Double] = []
            for dayOffset in 0..<7 {
                let day = cal.date(byAdding: .day, value: dayOffset, to: monday) ?? Date()
                dailyLoads.append(dayMap[day] ?? 0)
            }

            let weeklyLoad = dailyLoads.reduce(0, +)
            let mean = weeklyLoad / 7.0

            // Standard deviation
            let variance = dailyLoads.map { pow($0 - mean, 2) }.reduce(0, +) / 7.0
            let sd = sqrt(variance)

            let monotony = sd > 0 ? mean / sd : (mean > 0 ? 2.5 : 0)  // if SD=0 and training, monotony is very high
            let strain = weeklyLoad * monotony

            metrics.append(WeekMetrics(
                id: monday,
                monday: monday,
                weeklyLoad: weeklyLoad,
                avgDailyLoad: mean,
                monotony: monotony,
                strain: strain,
                phase: MonotonyZone.from(monotony)
            ))
        }

        weekMetrics = metrics
        peakStrain = metrics.map(\.strain).max() ?? 0
        avgMonotony = metrics.filter { $0.weeklyLoad > 0 }.map(\.monotony).reduce(0, +) / Double(max(1, metrics.filter { $0.weeklyLoad > 0 }.count))

        if let current = metrics.last {
            currentMonotony = current.monotony
            currentStrain = current.strain
            currentZone = MonotonyZone.from(currentMonotony)
        }
    }

    private func mondayOf(date: Date, cal: Calendar) -> Date {
        var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        comps.weekday = 2
        return cal.date(from: comps) ?? date
    }
}

#Preview {
    NavigationStack {
        TrainingMonotonyView()
    }
}
