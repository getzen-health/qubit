import SwiftUI
import Charts
import HealthKit

// MARK: - WalkingProgressionView

/// 12-month distance trend, monthly pace progression, and quarterly breakdown
/// for walking workouts — mirrors progression views for other sports.
struct WalkingProgressionView: View {

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let totalKm: Double
        let sessionCount: Int
        let avgPaceMinPerKm: Double?
    }

    struct QuarterBucket: Identifiable {
        let id: String
        let label: String
        let totalKm: Double
        let sessionCount: Int
    }

    @State private var monthBuckets: [MonthBucket] = []
    @State private var quarterBuckets: [QuarterBucket] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if monthBuckets.allSatisfy({ $0.sessionCount == 0 }) {
                emptyState
            } else {
                VStack(spacing: 16) {
                    monthlyDistanceChart
                    paceProgressionChart
                    quarterlyBreakdownCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Walking Progression")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Monthly Distance

    private var monthlyDistanceChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("12-Month Distance")
                .font(.headline)

            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(
                        x: .value("Month", b.monthStart, unit: .month),
                        y: .value("km", b.totalKm)
                    )
                    .foregroundStyle(Color.green.opacity(0.75))
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("km")
            .frame(height: 180)

            if let b = monthBuckets.max(by: { $0.totalKm < $1.totalKm }), b.totalKm > 0 {
                Text("Best month: \(monthName(b.monthStart)) — \(String(format: "%.1f", b.totalKm)) km")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Pace Progression

    private var paceProgressionChart: some View {
        let paced = monthBuckets.filter { ($0.avgPaceMinPerKm ?? 0) > 0 && ($0.avgPaceMinPerKm ?? 0) < 30 }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Avg Pace")
                .font(.headline)

            if paced.count < 2 {
                Text("Not enough GPS pace data yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(height: 140)
            } else {
                Chart {
                    ForEach(paced) { b in
                        if let pace = b.avgPaceMinPerKm {
                            LineMark(
                                x: .value("Month", b.monthStart, unit: .month),
                                y: .value("min/km", pace)
                            )
                            .foregroundStyle(Color.mint)
                            .interpolationMethod(.monotone)

                            PointMark(
                                x: .value("Month", b.monthStart, unit: .month),
                                y: .value("min/km", pace)
                            )
                            .foregroundStyle(Color.mint)
                            .symbolSize(48)
                        }
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .month)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated))
                    }
                }
                .chartYAxis {
                    AxisMarks { val in
                        AxisGridLine()
                        if let v = val.as(Double.self) {
                            AxisValueLabel {
                                let mins = Int(v)
                                let secs = Int((v - Double(mins)) * 60)
                                Text(String(format: "%d:%02d", mins, secs))
                                    .font(.caption2)
                            }
                        }
                    }
                }
                .chartYScale(domain: .automatic(includesZero: false))
                .frame(height: 150)

                Text("Lower = faster walking pace")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Quarterly Breakdown

    private var quarterlyBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Quarterly Breakdown")
                .font(.headline)

            if quarterBuckets.isEmpty {
                Text("No data")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Chart {
                    ForEach(quarterBuckets) { q in
                        BarMark(
                            x: .value("Quarter", q.label),
                            y: .value("km", q.totalKm)
                        )
                        .foregroundStyle(Color.green.opacity(0.7))
                        .cornerRadius(4)
                        .annotation(position: .top) {
                            Text(String(format: "%.0f", q.totalKm))
                                .font(.caption2.bold())
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .chartYAxisLabel("km")
                .frame(height: 160)

                VStack(spacing: 4) {
                    ForEach(quarterBuckets) { q in
                        HStack {
                            Text(q.label)
                                .font(.caption)
                                .frame(width: 40, alignment: .leading)
                            Text("\(q.sessionCount) sessions")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(String(format: "%.1f km", q.totalKm))
                                .font(.caption.bold())
                        }
                        Divider()
                    }
                }
                .padding(.top, 4)
            }
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
            Text("No Walking History")
                .font(.title3.bold())
            Text("Track walking workouts over time to see 12-month distance trends and pace progression.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    private func monthName(_ date: Date) -> String {
        return date.kqFormat("MMMM")
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let distType = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, distType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()

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

        guard !workouts.isEmpty else { return }

        let kmUnit = HKUnit.meterUnit(with: .kilo)
        let cal = Calendar.current

        var monthMap: [String: (Date, Double, Double, Int)] = [:]  // key → (monthStart, totalKm, totalPaceSum, count)

        for w in workouts {
            let km = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: kmUnit) ?? 0
            let durationMins = w.duration / 60
            let key = w.startDate.kqFormat("yyyy-MM")
            let monthStart = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
            var cur = monthMap[key] ?? (monthStart, 0, 0, 0)
            cur.1 += km
            if km > 0 {
                cur.2 += durationMins / km  // pace in min/km
            }
            cur.3 += 1
            monthMap[key] = cur
        }

        monthBuckets = monthMap.map { key, val in
            let count = val.3
            let avg = count > 0 && val.2 > 0 ? val.2 / Double(count) : nil
            return MonthBucket(id: key, monthStart: val.0, totalKm: val.1, sessionCount: count, avgPaceMinPerKm: avg)
        }.sorted { $0.monthStart < $1.monthStart }

        // Build quarterly buckets from month data
        var qMap: [String: (Double, Int)] = [:]
        for b in monthBuckets {
            let month = cal.component(.month, from: b.monthStart)
            let year = cal.component(.year, from: b.monthStart)
            let q: Int
            switch month {
            case 1...3:  q = 1
            case 4...6:  q = 2
            case 7...9:  q = 3
            default:     q = 4
            }
            let key = "Q\(q) \(year)"
            var cur = qMap[key] ?? (0, 0)
            cur.0 += b.totalKm
            cur.1 += b.sessionCount
            qMap[key] = cur
        }

        quarterBuckets = qMap.map { key, val in
            QuarterBucket(id: key, label: key, totalKm: val.0, sessionCount: val.1)
        }.sorted { $0.id < $1.id }
    }
}

#Preview {
    NavigationStack {
        WalkingProgressionView()
    }
}
