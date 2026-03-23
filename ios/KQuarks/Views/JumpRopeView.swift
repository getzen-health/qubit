import SwiftUI
import Charts
import HealthKit

// MARK: - JumpRopeView

/// Analyzes jump rope / skipping sessions tracked on Apple Watch.
/// HKWorkoutActivityType.jumpRope. Jump rope is one of the highest-efficiency
/// cardio workouts — burning ~12–15 kcal/min at moderate speed, comparable to
/// running at 8 mph. Popular for HIIT, boxing conditioning, and general cardio.
struct JumpRopeView: View {

    struct RopeSession: Identifiable {
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
        let sessions: Int
        let totalMins: Double
    }

    @State private var sessions: [RopeSession] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var totalSessions: Int = 0
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
                    weeklyChart
                    intensityChart
                    recentSessionsCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Jump Rope")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

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
                }
                Spacer()
                Image(systemName: "figure.jumprope")
                    .font(.system(size: 44)).foregroundStyle(.cyan)
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

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Sessions").font(.headline)
            Chart {
                ForEach(weekBuckets) { b in
                    BarMark(x: .value("Week", b.weekStart, unit: .weekOfYear),
                            y: .value("Sessions", b.sessions))
                    .foregroundStyle(Color.cyan.opacity(0.7))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var intensityChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Calorie Intensity Per Session").font(.headline)
            Chart {
                ForEach(sessions.suffix(20)) { s in
                    BarMark(x: .value("Date", s.date, unit: .day),
                            y: .value("kcal/min", s.kcalPerMin))
                    .foregroundStyle(Color.cyan.opacity(0.75))
                    .cornerRadius(2)
                }
                if avgKcalPerMin > 0 {
                    RuleMark(y: .value("Avg", avgKcalPerMin))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("kcal/min")
            .frame(height: 120)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var recentSessionsCard: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 38, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("k/min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(sessions.suffix(10).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date)).font(.caption).frame(width: 65, alignment: .leading)
                        Text(String(format: "%.0f", s.durationMins)).font(.caption.monospacedDigit()).frame(width: 38, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal)).font(.caption.monospacedDigit()).foregroundStyle(.orange).frame(width: 45, alignment: .trailing)
                        Text(String(format: "%.1f", s.kcalPerMin)).font(.caption.monospacedDigit()).foregroundStyle(.cyan).frame(width: 45, alignment: .trailing)
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

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.jumprope")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Jump Rope Sessions")
                .font(.title3.bold())
            Text("Track jump rope / skipping workouts on Apple Watch using the Jump Rope workout type to see session history and calorie burn data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let kcalType = HKQuantityType(.activeEnergyBurned)
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType, hrType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
            HKQuery.predicateForWorkouts(with: .jumpRope)
        ])

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        let allSessions = workouts.map { w in
            RopeSession(
                id: w.uuid, date: w.startDate,
                durationMins: w.duration / 60,
                kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)
            )
        }.sorted { $0.date < $1.date }

        sessions = allSessions
        totalSessions = allSessions.count
        avgDuration = allSessions.map(\.durationMins).reduce(0, +) / Double(allSessions.count)
        let kRates = allSessions.filter { $0.kcalPerMin > 0 }.map(\.kcalPerMin)
        avgKcalPerMin = kRates.isEmpty ? 0 : kRates.reduce(0, +) / Double(kRates.count)
        let hrs = allSessions.compactMap(\.avgHR)
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)

        var cal = Calendar.current; cal.firstWeekday = 2
        var bMap: [String: (Date, Int, Double)] = [:]
        for s in allSessions {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = cal.date(from: comps) ?? s.date
            var cur = bMap[key] ?? (ws, 0, 0)
            cur.1 += 1; cur.2 += s.durationMins
            bMap[key] = cur
        }
        weekBuckets = bMap.map { key, val in
            WeekBucket(id: key, weekStart: val.0, sessions: val.1, totalMins: val.2)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview { NavigationStack { JumpRopeView() } }
