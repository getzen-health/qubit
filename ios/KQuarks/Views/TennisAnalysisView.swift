import SwiftUI
import Charts
import HealthKit

// MARK: - TennisAnalysisView

/// Tracks tennis sessions — session frequency, calorie burn, heart rate
/// (tennis is high-intensity interval-like due to point play), and
/// duration trends. Covers HKWorkoutActivityType.tennis and .tableTennis.
struct TennisAnalysisView: View {

    struct TennisSession: Identifiable {
        let id: UUID
        let date: Date
        let type: HKWorkoutActivityType
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?
        var typeName: String { type == .tennis ? "Tennis" : "Table Tennis" }
        var typeColor: Color { type == .tennis ? .yellow : .orange }
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let tennisCount: Int
        let tableTennisCount: Int
    }

    @State private var sessions: [TennisSession] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalSessions: Int = 0
    @State private var avgDuration: Double = 0
    @State private var avgKcal: Double = 0
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
                    monthlyChart
                    sessionTableCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Tennis")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("12-Month Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.yellow)
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                }
                Spacer()
                Image(systemName: "figure.tennis")
                    .font(.system(size: 44)).foregroundStyle(.yellow)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: .yellow)
                Divider().frame(height: 36)
                statCell(label: "Avg kcal", value: String(format: "%.0f", avgKcal), color: .orange)
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

    // MARK: - Monthly Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Sessions")
                .font(.headline)
            Chart {
                ForEach(monthBuckets) { b in
                    if b.tennisCount > 0 {
                        BarMark(x: .value("Month", b.monthStart, unit: .month),
                                y: .value("Tennis", b.tennisCount))
                        .foregroundStyle(Color.yellow.opacity(0.75))
                    }
                    if b.tableTennisCount > 0 {
                        BarMark(x: .value("Month", b.monthStart, unit: .month),
                                y: .value("Table Tennis", b.tableTennisCount))
                        .foregroundStyle(Color.orange.opacity(0.7))
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 140)

            if sessions.contains(where: { $0.type == .tableTennis }) {
                HStack(spacing: 16) {
                    HStack(spacing: 4) { Circle().fill(Color.yellow.opacity(0.75)).frame(width: 8, height: 8); Text("Tennis").font(.caption2).foregroundStyle(.secondary) }
                    HStack(spacing: 4) { Circle().fill(Color.orange.opacity(0.7)).frame(width: 8, height: 8); Text("Table Tennis").font(.caption2).foregroundStyle(.secondary) }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Session Table

    private var sessionTableCard: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("Type").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(minWidth: 60, alignment: .leading)
                    Spacer()
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 38, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date)).font(.caption).frame(width: 65, alignment: .leading)
                        Text(s.typeName).font(.caption).foregroundStyle(s.typeColor).frame(minWidth: 60, alignment: .leading)
                        Spacer()
                        Text(String(format: "%.0f", s.durationMins)).font(.caption.monospacedDigit()).frame(width: 38, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal)).font(.caption.monospacedDigit()).foregroundStyle(.orange).frame(width: 45, alignment: .trailing)
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
            Image(systemName: "figure.tennis")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Tennis Sessions")
                .font(.title3.bold())
            Text("Track tennis or table tennis matches on your Apple Watch to see session history and fitness data.")
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

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        var allSessions: [TennisSession] = []
        var monthMap: [String: (Date, Int, Int)] = [:]

        for actType in [HKWorkoutActivityType.tennis, .tableTennis] {
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
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
                let key = df.string(from: w.startDate)
                let monthStart = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
                var m = monthMap[key] ?? (monthStart, 0, 0)
                if actType == .tennis { m.1 += 1 } else { m.2 += 1 }
                monthMap[key] = m

                allSessions.append(TennisSession(
                    id: w.uuid, date: w.startDate, type: actType,
                    durationMins: w.duration / 60,
                    kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                    avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)
                ))
            }
        }

        guard !allSessions.isEmpty else { return }
        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count
        avgDuration = allSessions.map(\.durationMins).reduce(0, +) / Double(allSessions.count)
        avgKcal = allSessions.map(\.kcal).reduce(0, +) / Double(allSessions.count)
        let hrs = allSessions.compactMap(\.avgHR)
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)
        monthBuckets = monthMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, tennisCount: val.1, tableTennisCount: val.2)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview { NavigationStack { TennisAnalysisView() } }
