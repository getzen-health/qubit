import SwiftUI
import Charts
import HealthKit

// MARK: - StairClimbingView

/// Analyzes stair climbing workouts alongside passive stair data (flights climbed).
/// Shows session trends, calorie burn rate, and weekly floor-climb history.
struct StairClimbingView: View {

    // MARK: - Models

    struct ClimbSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?
        var kcalPerMin: Double { durationMins > 0 ? kcal / durationMins : 0 }
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let totalMins: Double
        let sessionCount: Int
        let totalFlights: Double
    }

    // MARK: - State

    @State private var sessions: [ClimbSession] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalMins: Double = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var weeklyFlightAvg: Double = 0
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
                    intensityCard
                    sessionTableCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Stair Climbing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("90-Day Summary")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.orange)
                        Text("sessions")
                            .font(.title3)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    Text(String(format: "%.1f total hours of climbing", totalMins / 60))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.stair.stepper")
                    .font(.system(size: 44))
                    .foregroundStyle(.orange)
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "kcal/min", value: String(format: "%.1f", avgKcalPerMin), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Avg HR", value: avgHR > 0 ? "\(Int(avgHR)) bpm" : "—", color: .red)
                Divider().frame(height: 36)
                statCell(label: "Avg Duration", value: String(format: "%.0f min", totalMins / max(1, Double(totalSessions))), color: .yellow)
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

    // MARK: - Weekly Volume Chart

    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Climbing Time (min)")
                .font(.headline)

            Chart {
                ForEach(weekBuckets) { b in
                    BarMark(
                        x: .value("Week", b.weekStart, unit: .weekOfYear),
                        y: .value("min", b.totalMins)
                    )
                    .foregroundStyle(Color.orange.opacity(0.75))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("min")
            .frame(height: 160)

            let sessionsPerWeek = weekBuckets.isEmpty ? 0 : Double(totalSessions) / Double(weekBuckets.count)
            Text(String(format: "Avg %.1f sessions/week", sessionsPerWeek))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Intensity Card

    private var intensityCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Calorie Burn Intensity")
                .font(.headline)

            let recentSessions = sessions.suffix(20).filter { $0.kcalPerMin > 0 }

            if recentSessions.isEmpty {
                Text("No calorie data available")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(height: 120)
            } else {
                Chart {
                    ForEach(recentSessions) { s in
                        BarMark(
                            x: .value("Session", s.date, unit: .day),
                            y: .value("kcal/min", s.kcalPerMin)
                        )
                        .foregroundStyle(intensityColor(s.kcalPerMin).opacity(0.8))
                        .cornerRadius(2)
                    }

                    if avgKcalPerMin > 0 {
                        RuleMark(y: .value("Avg", avgKcalPerMin))
                            .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                            .foregroundStyle(.orange.opacity(0.6))
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .month)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated))
                    }
                }
                .chartYAxisLabel("kcal/min")
                .frame(height: 140)

                Text("Stair climbing burns 8–12 kcal/min — one of the highest calorie-per-minute cardio activities.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func intensityColor(_ kcalPerMin: Double) -> Color {
        if kcalPerMin >= 10 { return .red }
        if kcalPerMin >= 8  { return .orange }
        if kcalPerMin >= 6  { return .yellow }
        return .green
    }

    // MARK: - Session Table

    private var sessionTableCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 70, alignment: .leading)
                    Text("Duration").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("k/min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                let df = DateFormatter()
                let _ = { df.dateFormat = "MMM d" }()

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date))
                            .font(.caption)
                            .frame(width: 70, alignment: .leading)
                        Text(String(format: "%.0f min", s.durationMins))
                            .font(.caption.monospacedDigit())
                            .frame(width: 60, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.orange)
                            .frame(width: 45, alignment: .trailing)
                        Text(String(format: "%.1f", s.kcalPerMin))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(intensityColor(s.kcalPerMin))
                            .frame(width: 45, alignment: .trailing)
                        Text(s.avgHR.map { String(format: "%.0f", $0) } ?? "—")
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.red)
                            .frame(width: 40, alignment: .trailing)
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
            Image(systemName: "figure.stair.stepper")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Stair Climbing Workouts")
                .font(.title3.bold())
            Text("Start a Stair Climbing workout on your Apple Watch to track your climbing sessions.")
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
        let kcalType = HKQuantityType(.activeEnergyBurned)
        let hrType = HKQuantityType(.heartRate)
        let flightsType = HKQuantityType(.flightsClimbed)

        guard (try? await healthStore.requestAuthorization(
            toShare: [],
            read: [workoutType, kcalType, hrType, flightsType]
        )) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: .stairClimbing)
            ])
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        var rawSessions: [ClimbSession] = []

        for w in workouts {
            let kcal = w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0
            let avgHR = w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)
            rawSessions.append(ClimbSession(
                id: w.uuid,
                date: w.startDate,
                durationMins: w.duration / 60,
                kcal: kcal,
                avgHR: avgHR
            ))
        }

        sessions = rawSessions
        totalSessions = rawSessions.count
        totalMins = rawSessions.map(\.durationMins).reduce(0, +)
        let kRates = rawSessions.filter { $0.kcalPerMin > 0 }.map(\.kcalPerMin)
        avgKcalPerMin = kRates.isEmpty ? 0 : kRates.reduce(0, +) / Double(kRates.count)
        let hrValues = rawSessions.compactMap(\.avgHR)
        avgHR = hrValues.isEmpty ? 0 : hrValues.reduce(0, +) / Double(hrValues.count)

        // Weekly buckets
        var cal = Calendar.current
        cal.firstWeekday = 2
        var bucketMap: [String: (Date, Double, Int)] = [:]

        for s in rawSessions {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let weekStart = cal.date(from: comps) ?? s.date
            var cur = bucketMap[key] ?? (weekStart, 0, 0)
            cur.1 += s.durationMins
            cur.2 += 1
            bucketMap[key] = cur
        }

        weekBuckets = bucketMap.map { key, val in
            WeekBucket(id: key, weekStart: val.0, totalMins: val.1, sessionCount: val.2, totalFlights: 0)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview {
    NavigationStack {
        StairClimbingView()
    }
}
