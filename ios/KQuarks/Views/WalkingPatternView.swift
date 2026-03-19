import SwiftUI
import Charts
import HealthKit

// MARK: - WalkingPatternView

/// Day-of-week distribution, time-of-day heatmap, and monthly distance trend
/// for walking workouts — mirrors pattern views for other sports.
struct WalkingPatternView: View {

    struct DowBucket: Identifiable {
        let id: Int
        let name: String
        let totalKm: Double
        let count: Int
    }

    struct HourBucket: Identifiable {
        let id: Int          // 0–23
        let totalKm: Double
        let count: Int
    }

    struct MonthBucket: Identifiable {
        let id: String       // "YYYY-MM"
        let monthStart: Date
        let totalKm: Double
        let count: Int
    }

    @State private var dowBuckets: [DowBucket] = []
    @State private var hourBuckets: [HourBucket] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if dowBuckets.allSatisfy({ $0.count == 0 }) {
                emptyState
            } else {
                VStack(spacing: 16) {
                    dowChart
                    hourChart
                    monthChart
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Walking Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Day of Week Distribution")
                .font(.headline)
            Text("Which days you walk most")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(dowBuckets) { b in
                    BarMark(
                        x: .value("Day", b.name),
                        y: .value("km", b.totalKm)
                    )
                    .foregroundStyle(Color.green.opacity(0.75))
                    .cornerRadius(4)
                }
            }
            .chartYAxisLabel("Total km")
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Hour Chart

    private var hourChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Time of Day")
                .font(.headline)
            Text("When you typically walk")
                .font(.caption)
                .foregroundStyle(.secondary)

            let filtered = hourBuckets.filter { $0.count > 0 }

            Chart {
                ForEach(filtered) { h in
                    BarMark(
                        x: .value("Hour", h.id),
                        y: .value("Sessions", h.count)
                    )
                    .foregroundStyle(Color.mint.opacity(0.75))
                    .cornerRadius(2)
                }
            }
            .chartXAxis {
                AxisMarks(values: [6, 9, 12, 15, 18, 21]) { val in
                    AxisGridLine()
                    if let hour = val.as(Int.self) {
                        AxisValueLabel {
                            Text(hourLabel(hour))
                                .font(.caption2)
                        }
                    }
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func hourLabel(_ h: Int) -> String {
        if h == 0 { return "12am" }
        if h < 12 { return "\(h)am" }
        if h == 12 { return "12pm" }
        return "\(h - 12)pm"
    }

    // MARK: - Monthly Chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Distance")
                .font(.headline)

            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(
                        x: .value("Month", b.monthStart, unit: .month),
                        y: .value("km", b.totalKm)
                    )
                    .foregroundStyle(Color.green.opacity(0.7))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("km")
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.walk.circle")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Walking Workouts")
                .font(.title3.bold())
            Text("Track walking workouts on your Apple Watch to see day-of-week and time-of-day patterns.")
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
        let distType = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, distType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: .walking)
            ])
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else {
            dowBuckets = buildEmptyDow()
            return
        }

        let kmUnit = HKUnit.meterUnit(with: .kilo)
        let cal = Calendar.current
        let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

        var dowMap: [Int: (Double, Int)] = [:]
        var hourMap: [Int: (Double, Int)] = [:]
        var monthMap: [String: (Date, Double, Int)] = [:]
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        for w in workouts {
            let km = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: kmUnit) ?? 0
            let dow = cal.component(.weekday, from: w.startDate)  // 1=Sun
            let hour = cal.component(.hour, from: w.startDate)
            let monthKey = df.string(from: w.startDate)
            let monthStart = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate

            var d = dowMap[dow] ?? (0, 0)
            d.0 += km; d.1 += 1; dowMap[dow] = d

            var h = hourMap[hour] ?? (0, 0)
            h.0 += km; h.1 += 1; hourMap[hour] = h

            var m = monthMap[monthKey] ?? (monthStart, 0, 0)
            m.1 += km; m.2 += 1; monthMap[monthKey] = m
        }

        dowBuckets = (1...7).map { idx in
            let val = dowMap[idx] ?? (0, 0)
            return DowBucket(id: idx, name: dayNames[idx - 1], totalKm: val.0, count: val.1)
        }

        hourBuckets = (0...23).map { h in
            let val = hourMap[h] ?? (0, 0)
            return HourBucket(id: h, totalKm: val.0, count: val.1)
        }

        monthBuckets = monthMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, totalKm: val.1, count: val.2)
        }.sorted { $0.monthStart < $1.monthStart }
    }

    private func buildEmptyDow() -> [DowBucket] {
        let names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return (0...6).map { DowBucket(id: $0, name: names[$0], totalKm: 0, count: 0) }
    }
}

#Preview {
    NavigationStack {
        WalkingPatternView()
    }
}
