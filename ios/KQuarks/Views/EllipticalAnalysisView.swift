import SwiftUI
import Charts
import HealthKit

// MARK: - EllipticalAnalysisView

/// Tracks elliptical trainer sessions — weekly volume, calorie burn rate,
/// heart rate zones, and duration trend. One of the most common indoor
/// cardio machines; low-impact but high calorie burn similar to running.
struct EllipticalAnalysisView: View {

    struct EllipticalSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?
        var kcalPerMin: Double { durationMins > 0 ? kcal / durationMins : 0 }
        var intensity: IntensityLevel { IntensityLevel.from(kcalPerMin: kcalPerMin) }
    }

    enum IntensityLevel: String {
        case low = "Low", moderate = "Moderate", high = "High", veryHigh = "Very High"
        var color: Color {
            switch self {
            case .low:      return .green
            case .moderate: return .yellow
            case .high:     return .orange
            case .veryHigh: return .red
            }
        }
        static func from(kcalPerMin: Double) -> IntensityLevel {
            if kcalPerMin < 6  { return .low }
            if kcalPerMin < 9  { return .moderate }
            if kcalPerMin < 12 { return .high }
            return .veryHigh
        }
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let totalMins: Double
        let totalKcal: Double
        let count: Int
    }

    @State private var sessions: [EllipticalSession] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalHours: Double = 0
    @State private var avgDuration: Double = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

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
                    durationTrendChart
                    recentSessionsCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Elliptical")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("90-Day Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.cyan)
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text(String(format: "%.1f total hours", totalHours))
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.elliptical")
                    .font(.system(size: 44))
                    .foregroundStyle(.cyan)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: .cyan)
                Divider().frame(height: 36)
                statCell(label: "kcal/min", value: String(format: "%.1f", avgKcalPerMin), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Avg HR", value: avgHR > 0 ? "\(Int(avgHR)) bpm" : "—", color: .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Weekly Volume

    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Duration (min)")
                .font(.headline)
            Chart {
                ForEach(weekBuckets) { b in
                    BarMark(
                        x: .value("Week", b.weekStart, unit: .weekOfYear),
                        y: .value("min", b.totalMins)
                    )
                    .foregroundStyle(Color.cyan.opacity(0.75))
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
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Duration Trend

    private var durationTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Session Duration Trend")
                .font(.headline)
            Chart {
                ForEach(sessions) { s in
                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("min", s.durationMins)
                    )
                    .foregroundStyle(s.intensity.color.opacity(0.8))
                    .symbolSize(36)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("min")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 140)

            HStack(spacing: 12) {
                ForEach([IntensityLevel.low, .moderate, .high, .veryHigh], id: \.rawValue) { lvl in
                    HStack(spacing: 4) {
                        Circle().fill(lvl.color.opacity(0.8)).frame(width: 7, height: 7)
                        Text(lvl.rawValue).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Recent Sessions

    private var recentSessionsCard: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("k/min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date)).font(.caption).frame(width: 65, alignment: .leading)
                        Text(String(format: "%.0f", s.durationMins)).font(.caption.monospacedDigit()).frame(width: 40, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal)).font(.caption.monospacedDigit()).foregroundStyle(.orange).frame(width: 45, alignment: .trailing)
                        Text(String(format: "%.1f", s.kcalPerMin)).font(.caption.monospacedDigit()).foregroundStyle(s.intensity.color).frame(width: 45, alignment: .trailing)
                        Text(s.avgHR.map { String(format: "%.0f", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(.red).frame(width: 40, alignment: .trailing)
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
            Image(systemName: "figure.elliptical")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Elliptical Sessions")
                .font(.title3.bold())
            Text("Start an Elliptical workout on your Apple Watch to track your cardio sessions.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
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

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType, hrType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: .elliptical)
            ])
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        let rawSessions: [EllipticalSession] = workouts.map { w in
            EllipticalSession(
                id: w.uuid,
                date: w.startDate,
                durationMins: w.duration / 60,
                kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)
            )
        }

        sessions = rawSessions
        totalSessions = rawSessions.count
        totalHours = rawSessions.map(\.durationMins).reduce(0, +) / 60
        avgDuration = rawSessions.map(\.durationMins).reduce(0, +) / Double(rawSessions.count)
        let kRates = rawSessions.filter { $0.kcalPerMin > 0 }.map(\.kcalPerMin)
        avgKcalPerMin = kRates.isEmpty ? 0 : kRates.reduce(0, +) / Double(kRates.count)
        let hrs = rawSessions.compactMap(\.avgHR)
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)

        var cal = Calendar.current; cal.firstWeekday = 2
        var bucketMap: [String: (Date, Double, Double, Int)] = [:]
        for s in rawSessions {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let weekStart = cal.date(from: comps) ?? s.date
            var cur = bucketMap[key] ?? (weekStart, 0, 0, 0)
            cur.1 += s.durationMins; cur.2 += s.kcal; cur.3 += 1
            bucketMap[key] = cur
        }
        weekBuckets = bucketMap.map { key, val in
            WeekBucket(id: key, weekStart: val.0, totalMins: val.1, totalKcal: val.2, count: val.3)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview { NavigationStack { EllipticalAnalysisView() } }
