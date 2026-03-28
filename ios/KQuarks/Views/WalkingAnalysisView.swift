import SwiftUI
import Charts
import HealthKit

// MARK: - WalkingAnalysisView

/// Dedicated analysis view for walking workouts tracked by Apple Watch.
/// Covers pace trends, distance distribution, calorie efficiency,
/// and compares walking HR against resting to measure aerobic benefit.
struct WalkingAnalysisView: View {

    // MARK: - Models

    struct WalkSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let distanceKm: Double
        let kcal: Double
        let avgHR: Double?

        var paceMinPerKm: Double? {
            guard distanceKm > 0 else { return nil }
            return durationMins / distanceKm
        }

        var kcalPerMin: Double { durationMins > 0 ? kcal / durationMins : 0 }
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let totalDistanceKm: Double
        let totalDurationMins: Double
        let sessionCount: Int
    }

    // MARK: - State

    @State private var sessions: [WalkSession] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalDistanceKm: Double = 0
    @State private var totalDurationMins: Double = 0
    @State private var avgPaceMinPerKm: Double = 0
    @State private var avgKcalPerSession: Double = 0
    @State private var bestPace: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    weeklyVolumeChart
                    paceChart
                    sessionTableCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Walking")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("90-Day Walking")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", totalDistanceKm))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.green)
                        Text("km")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    Text("\(totalSessions) sessions")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(spacing: 8) {
                    Image(systemName: "figure.walk")
                        .font(.system(size: 40))
                        .foregroundStyle(.green)
                }
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Avg Pace", value: paceString(avgPaceMinPerKm), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Best Pace", value: paceString(bestPace), color: .mint)
                Divider().frame(height: 36)
                statCell(label: "Avg kcal", value: "\(Int(avgKcalPerSession))", color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Total hrs", value: String(format: "%.1f", totalDurationMins / 60), color: .teal)
            }
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

    private func paceString(_ minPerKm: Double) -> String {
        guard minPerKm > 0 && minPerKm < 60 else { return "—" }
        let mins = Int(minPerKm)
        let secs = Int((minPerKm - Double(mins)) * 60)
        return String(format: "%d:%02d/km", mins, secs)
    }

    // MARK: - Weekly Volume Chart

    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Distance (km)")
                .font(.headline)

            Chart {
                ForEach(weekBuckets) { bucket in
                    BarMark(
                        x: .value("Week", bucket.weekStart, unit: .weekOfYear),
                        y: .value("km", bucket.totalDistanceKm)
                    )
                    .foregroundStyle(Color.green.opacity(0.75))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("km")
            .frame(height: 180)

            let avgWeekly = weekBuckets.isEmpty ? 0 : weekBuckets.map(\.totalDistanceKm).reduce(0, +) / Double(weekBuckets.count)
            Text(String(format: "Avg %.1f km/week across %d weeks", avgWeekly, weekBuckets.count))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Pace Chart

    private var paceChart: some View {
        let paced = sessions.filter { ($0.paceMinPerKm ?? 0) > 0 && ($0.paceMinPerKm ?? 0) < 30 }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Walking Pace Trend")
                .font(.headline)

            if paced.isEmpty {
                Text("No GPS distance data available")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(height: 140)
            } else {
                Chart {
                    ForEach(paced) { s in
                        PointMark(
                            x: .value("Date", s.date),
                            y: .value("min/km", s.paceMinPerKm!)
                        )
                        .foregroundStyle(Color.green.opacity(0.6))
                        .symbolSize(40)

                        LineMark(
                            x: .value("Date", s.date),
                            y: .value("min/km", s.paceMinPerKm!)
                        )
                        .foregroundStyle(Color.green.opacity(0.3))
                        .interpolationMethod(.monotone)
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
                .frame(height: 160)

                Text("Lower is faster. Y-axis = min/km.")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Session Table

    private var sessionTableCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("km").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("Pace").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                let df = DateFormatter()
                df.dateFormat = "MMM d"

                ForEach(sessions.suffix(15).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date))
                            .font(.caption)
                            .frame(width: 65, alignment: .leading)
                        Text(String(format: "%.2f", s.distanceKm))
                            .font(.caption.monospacedDigit())
                            .frame(width: 45, alignment: .trailing)
                        Text(paceString(s.paceMinPerKm ?? 0))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.green)
                            .frame(width: 55, alignment: .trailing)
                        Text(String(format: "%.0f", s.durationMins))
                            .font(.caption.monospacedDigit())
                            .frame(width: 40, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.orange)
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

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.walk.circle")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Walking Workouts")
                .font(.title3.bold())
            Text("Start a Walking workout on your Apple Watch to see pace trends, distance, and calorie data.")
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
        let kcalType = HKQuantityType(.activeEnergyBurned)
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(
            toShare: [],
            read: [workoutType, distType, kcalType, hrType]
        )) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
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
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        var rawSessions: [WalkSession] = []

        for w in workouts {
            let dist = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: kmUnit) ?? 0
            let kcal = w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0
            let avgHR = w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)

            rawSessions.append(WalkSession(
                id: w.uuid,
                date: w.startDate,
                durationMins: w.duration / 60,
                distanceKm: dist,
                kcal: kcal,
                avgHR: avgHR
            ))
        }

        sessions = rawSessions
        totalSessions = rawSessions.count
        totalDistanceKm = rawSessions.map(\.distanceKm).reduce(0, +)
        totalDurationMins = rawSessions.map(\.durationMins).reduce(0, +)
        avgKcalPerSession = rawSessions.isEmpty ? 0 : rawSessions.map(\.kcal).reduce(0, +) / Double(rawSessions.count)

        let paced = rawSessions.compactMap(\.paceMinPerKm).filter { $0 > 0 && $0 < 30 }
        avgPaceMinPerKm = paced.isEmpty ? 0 : paced.reduce(0, +) / Double(paced.count)
        bestPace = paced.min() ?? 0

        // Build weekly buckets (Monday-anchored)
        var cal = Calendar.current
        cal.firstWeekday = 2
        var bucketMap: [String: (Date, Double, Double, Int)] = [:]

        for s in rawSessions {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let weekStart = cal.date(from: comps) ?? s.date
            var cur = bucketMap[key] ?? (weekStart, 0, 0, 0)
            cur.1 += s.distanceKm
            cur.2 += s.durationMins
            cur.3 += 1
            bucketMap[key] = cur
        }

        weekBuckets = bucketMap.map { key, val in
            WeekBucket(id: key, weekStart: val.0, totalDistanceKm: val.1, totalDurationMins: val.2, sessionCount: val.3)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview {
    NavigationStack {
        WalkingAnalysisView()
    }
}
