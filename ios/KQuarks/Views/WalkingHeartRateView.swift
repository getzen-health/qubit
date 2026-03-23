import SwiftUI
import Charts
import HealthKit

// MARK: - WalkingHeartRateView

/// Trends the Apple Watch passive walking heart rate metric — average HR
/// while walking day-to-day (not during formal workouts). As aerobic fitness
/// improves, walking HR drops. This is distinct from resting HR (measured
/// while completely still) and is a sensitive marker of cardiovascular fitness.
///
/// HealthKit type: HKQuantityTypeIdentifier.walkingHeartRateAverage
/// Available: Apple Watch Series 4+, iOS 13+
struct WalkingHeartRateView: View {

    // MARK: - Models

    struct DayPoint: Identifiable {
        let id: UUID = UUID()
        let date: Date
        let bpm: Double

        var fitnessLevel: FitnessLevel { FitnessLevel.from(bpm: bpm) }
    }

    struct WeekAvg: Identifiable {
        let id: String
        let weekStart: Date
        let avgBpm: Double
    }

    enum FitnessLevel {
        case excellent, good, average, belowAverage

        var color: Color {
            switch self {
            case .excellent:    return .green
            case .good:         return .mint
            case .average:      return .orange
            case .belowAverage: return .red
            }
        }

        var label: String {
            switch self {
            case .excellent:    return "Excellent"
            case .good:         return "Good"
            case .average:      return "Average"
            case .belowAverage: return "Below Avg"
            }
        }

        /// Walking HR fitness categories (general population norms)
        static func from(bpm: Double) -> FitnessLevel {
            if bpm < 70  { return .excellent }
            if bpm < 85  { return .good }
            if bpm < 100 { return .average }
            return .belowAverage
        }
    }

    // MARK: - State

    @State private var dailyPoints: [DayPoint] = []
    @State private var weekAvgs: [WeekAvg] = []
    @State private var latest: Double = 0
    @State private var thirtyDayAvg: Double = 0
    @State private var trend: Double = 0     // bpm change over period (negative = improving)
    @State private var isLoading = true
    @State private var isUnsupported = false

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if isUnsupported {
                unsupportedState
            } else if dailyPoints.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    weeklyAverageChart
                    fitnessContextCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Walking Heart Rate")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let level = FitnessLevel.from(bpm: thirtyDayAvg)

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("30-Day Avg Walking HR")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", thirtyDayAvg))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(level.color)
                        Text("bpm")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(level.color).frame(width: 8, height: 8)
                        Text(level.label)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(level.color)
                    }
                }

                Spacer()

                VStack(spacing: 8) {
                    if trend != 0 {
                        let improving = trend < 0
                        VStack(spacing: 2) {
                            Label(String(format: "%+.1f bpm", trend),
                                  systemImage: improving ? "arrow.down.right.circle.fill" : "arrow.up.right.circle.fill")
                                .font(.caption.bold())
                                .foregroundStyle(improving ? .green : .orange)
                            Text("vs 90 days ago")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Text(String(format: "Latest: %.0f bpm", latest))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "< 70 bpm", value: "Excellent", color: .green)
                Divider().frame(height: 36)
                statCell(label: "70–85 bpm", value: "Good", color: .mint)
                Divider().frame(height: 36)
                statCell(label: "85–100 bpm", value: "Average", color: .orange)
                Divider().frame(height: 36)
                statCell(label: "> 100 bpm", value: "Below Avg", color: .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.caption2.bold())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
    }

    // MARK: - Daily Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Daily Walking HR (90 days)")
                .font(.headline)

            Chart {
                ForEach(dailyPoints) { p in
                    PointMark(
                        x: .value("Date", p.date),
                        y: .value("bpm", p.bpm)
                    )
                    .foregroundStyle(p.fitnessLevel.color.opacity(0.7))
                    .symbolSize(24)
                }

                // 7-day rolling average line
                let rolling = rollingAverage(points: dailyPoints, window: 7)
                ForEach(rolling, id: \.id) { p in
                    LineMark(
                        x: .value("Date", p.date),
                        y: .value("7d avg", p.bpm)
                    )
                    .foregroundStyle(Color.secondary.opacity(0.7))
                    .lineStyle(StrokeStyle(lineWidth: 2))
                    .interpolationMethod(.monotone)
                }

                if thirtyDayAvg > 0 {
                    RuleMark(y: .value("Avg", thirtyDayAvg))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("bpm")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 180)

            Text("7-day rolling average shown as line. Lower = better aerobic fitness.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func rollingAverage(points: [DayPoint], window: Int) -> [DayPoint] {
        guard points.count >= window else { return [] }
        return (window - 1 ..< points.count).map { i in
            let slice = points[(i - window + 1)...i]
            let avg = slice.map(\.bpm).reduce(0, +) / Double(window)
            return DayPoint(date: points[i].date, bpm: avg)
        }
    }

    // MARK: - Weekly Average Chart

    private var weeklyAverageChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Average Trend")
                .font(.headline)

            Chart {
                ForEach(weekAvgs) { w in
                    BarMark(
                        x: .value("Week", w.weekStart, unit: .weekOfYear),
                        y: .value("bpm", w.avgBpm)
                    )
                    .foregroundStyle(FitnessLevel.from(bpm: w.avgBpm).color.opacity(0.75))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("avg bpm")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Fitness Context Card

    private var fitnessContextCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("What Is Walking Heart Rate?", systemImage: "figure.walk.circle.fill")
                .font(.headline)
                .foregroundStyle(.teal)

            Text("Apple Watch measures your average heart rate while you walk throughout the day — distinct from resting HR (lying still) and workout HR. It's captured passively without you starting a workout.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("As your aerobic fitness improves from regular cardio training, your walking HR decreases. Athletes often see walking HRs below 70 bpm. A drop of even 5–10 bpm over months signals meaningful cardiovascular improvement.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Walking HR tends to be higher in summer (heat/humidity) and lower in cooler months — seasonal patterns are normal.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Available on Apple Watch Series 4+ running watchOS 7+.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .italic()
        }
        .padding()
        .background(Color.teal.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty / Unsupported States

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.walk.circle")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Walking Heart Rate Data")
                .font(.title3.bold())
            Text("Walking heart rate is measured passively by Apple Watch Series 4+ while you walk throughout the day.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    private var unsupportedState: some View {
        VStack(spacing: 16) {
            Image(systemName: "applewatch.slash")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("Not Available")
                .font(.title3.bold())
            Text("Walking heart rate requires Apple Watch Series 4 or later with watchOS 7+.")
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

        guard HKHealthStore.isHealthDataAvailable() else { isUnsupported = true; return }

        guard let walkingHRType = HKQuantityType.quantityType(forIdentifier: .walkingHeartRateAverage) else {
            isUnsupported = true; return
        }

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [walkingHRType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date())
            let q = HKSampleQuery(
                sampleType: walkingHRType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        // Group by day (average per day)
        let cal = Calendar.current
        var dayMap: [String: (Date, [Double])] = [:]
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"

        for s in samples {
            let bpm = s.quantity.doubleValue(for: hrUnit)
            let key = df.string(from: s.startDate)
            let dayStart = cal.startOfDay(for: s.startDate)
            var cur = dayMap[key] ?? (dayStart, [])
            cur.1.append(bpm)
            dayMap[key] = cur
        }

        let days = dayMap.map { _, val in
            DayPoint(date: val.0, bpm: val.1.reduce(0, +) / Double(val.1.count))
        }.sorted { $0.date < $1.date }

        dailyPoints = days
        latest = days.last?.bpm ?? 0
        thirtyDayAvg = days.isEmpty ? 0 : days.map(\.bpm).reduce(0, +) / Double(days.count)

        // Trend: first 30 days avg vs last 30 days avg
        if days.count >= 20 {
            let half = days.count / 2
            let firstAvg = days.prefix(half).map(\.bpm).reduce(0, +) / Double(half)
            let lastAvg = days.suffix(half).map(\.bpm).reduce(0, +) / Double(half)
            trend = lastAvg - firstAvg
        }

        // Weekly averages
        var weekMap: [String: (Date, [Double])] = [:]
        var wcal = Calendar.current
        wcal.firstWeekday = 2
        for p in days {
            let comps = wcal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: p.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let weekStart = wcal.date(from: comps) ?? p.date
            var cur = weekMap[key] ?? (weekStart, [])
            cur.1.append(p.bpm)
            weekMap[key] = cur
        }
        weekAvgs = weekMap.map { key, val in
            WeekAvg(id: key, weekStart: val.0, avgBpm: val.1.reduce(0, +) / Double(val.1.count))
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview {
    NavigationStack {
        WalkingHeartRateView()
    }
}
