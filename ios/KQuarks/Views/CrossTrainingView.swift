import SwiftUI
import Charts
import HealthKit

// MARK: - CrossTrainingView

/// Analyzes cross-training and mixed cardio workouts — covers HKWorkoutActivityType
/// .crossTraining and .mixedCardio, popular with CrossFit athletes and people
/// who do varied gym sessions not fitting a single category.
struct CrossTrainingView: View {

    struct CTSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?
        let maxHR: Double?
        var intensity: Double { maxHR.map { ($0 > 0 ? $0 : 180) / 195 } ?? 0.7 }
        var kcalPerMin: Double { durationMins > 0 ? kcal / durationMins : 0 }
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let sessions: Int
        let totalMins: Double
        let avgKcalPerMin: Double
    }

    @State private var sessions: [CTSession] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalHours: Double = 0
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
                    intensityHistogram
                    recentSessionsCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cross-Training")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
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
                            .foregroundStyle(.red)
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text(String(format: "%.1f hrs total", totalHours))
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.cross.training")
                    .font(.system(size: 44)).foregroundStyle(.red)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "kcal/min", value: String(format: "%.1f", avgKcalPerMin), color: .red)
                Divider().frame(height: 36)
                statCell(label: "Avg HR", value: avgHR > 0 ? "\(Int(avgHR)) bpm" : "—", color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Avg Duration", value: String(format: "%.0f min", sessions.isEmpty ? 0 : sessions.map(\.durationMins).reduce(0, +) / Double(sessions.count)), color: .yellow)
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

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Sessions")
                .font(.headline)
            Chart {
                ForEach(weekBuckets) { b in
                    BarMark(x: .value("Week", b.weekStart, unit: .weekOfYear),
                            y: .value("Sessions", b.sessions))
                    .foregroundStyle(Color.red.opacity(0.7))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Intensity Histogram

    private var intensityHistogram: some View {
        let withKcal = sessions.filter { $0.kcalPerMin > 0 }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Calorie Intensity Per Session")
                .font(.headline)
            Chart {
                ForEach(withKcal.suffix(20)) { s in
                    BarMark(x: .value("Date", s.date, unit: .day),
                            y: .value("kcal/min", s.kcalPerMin))
                    .foregroundStyle(intensityColor(s.kcalPerMin).opacity(0.8))
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
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func intensityColor(_ k: Double) -> Color {
        if k >= 12 { return .red }
        if k >= 9  { return .orange }
        if k >= 6  { return .yellow }
        return .green
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
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 38, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("k/min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date)).font(.caption).frame(width: 65, alignment: .leading)
                        Text(String(format: "%.0f", s.durationMins)).font(.caption.monospacedDigit()).frame(width: 38, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal)).font(.caption.monospacedDigit()).foregroundStyle(.orange).frame(width: 45, alignment: .trailing)
                        Text(String(format: "%.1f", s.kcalPerMin)).font(.caption.monospacedDigit()).foregroundStyle(intensityColor(s.kcalPerMin)).frame(width: 45, alignment: .trailing)
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
            Image(systemName: "figure.cross.training")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Cross-Training Sessions")
                .font(.title3.bold())
            Text("Track CrossFit, circuit training, or mixed cardio sessions on Apple Watch using the Cross Training workout type.")
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

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        var allSessions: [CTSession] = []
        for actType in [HKWorkoutActivityType.crossTraining, .mixedCardio] {
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: actType)
            ])
            let workouts: [HKWorkout] = await withCheckedContinuation { cont in
                let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                    limit: HKObjectQueryNoLimit,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
                ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
                healthStore.execute(q)
            }
            for w in workouts {
                allSessions.append(CTSession(
                    id: w.uuid, date: w.startDate, durationMins: w.duration / 60,
                    kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                    avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit),
                    maxHR: w.statistics(for: hrType)?.maximumQuantity()?.doubleValue(for: hrUnit)
                ))
            }
        }

        guard !allSessions.isEmpty else { return }
        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count
        totalHours = allSessions.map(\.durationMins).reduce(0, +) / 60
        let kRates = allSessions.filter { $0.kcalPerMin > 0 }.map(\.kcalPerMin)
        avgKcalPerMin = kRates.isEmpty ? 0 : kRates.reduce(0, +) / Double(kRates.count)
        let hrs = allSessions.compactMap(\.avgHR)
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)

        var cal = Calendar.current; cal.firstWeekday = 2
        var bMap: [String: (Date, Int, Double, Double)] = [:]
        for s in allSessions {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = cal.date(from: comps) ?? s.date
            var cur = bMap[key] ?? (ws, 0, 0, 0)
            cur.1 += 1; cur.2 += s.durationMins; cur.3 += s.kcalPerMin
            bMap[key] = cur
        }
        weekBuckets = bMap.map { key, val in
            WeekBucket(id: key, weekStart: val.0, sessions: val.1, totalMins: val.2,
                       avgKcalPerMin: val.1 > 0 ? val.3 / Double(val.1) : 0)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview { NavigationStack { CrossTrainingView() } }
