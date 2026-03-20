import SwiftUI
import Charts
import HealthKit

// MARK: - SoccerAnalysisView

/// Analyzes soccer (football) sessions tracked on Apple Watch.
/// Covers HKWorkoutActivityType.soccer including indoor soccer variants.
/// Soccer is a high-intensity intermittent sport — distance, HR peaks, and
/// calorie burn per session are key performance indicators.
struct SoccerAnalysisView: View {

    struct SoccerSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?
        let maxHR: Double?
        let distance: Double?  // km
        var kcalPerMin: Double { durationMins > 0 ? kcal / durationMins : 0 }
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let sessions: Int
        let totalKm: Double
    }

    // MARK: - State

    @State private var sessions: [SoccerSession] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalSessions: Int = 0
    @State private var avgDuration: Double = 0
    @State private var avgKcal: Double = 0
    @State private var avgHR: Double = 0
    @State private var maxHRPeak: Double = 0
    @State private var totalKm: Double = 0
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
                    monthlyChart
                    intensityChart
                    sessionTableCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Soccer")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("12-Month Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.green)
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    if totalKm > 0 {
                        Text(String(format: "%.1f km total distance", totalKm))
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                }
                Spacer()
                Image(systemName: "soccerball")
                    .font(.system(size: 44)).foregroundStyle(.green)
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Avg kcal", value: String(format: "%.0f", avgKcal), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Avg HR", value: avgHR > 0 ? "\(Int(avgHR)) bpm" : "—", color: .red)
                Divider().frame(height: 36)
                statCell(label: "Peak HR", value: maxHRPeak > 0 ? "\(Int(maxHRPeak)) bpm" : "—", color: .pink)
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
                    BarMark(x: .value("Month", b.monthStart, unit: .month),
                            y: .value("Sessions", b.sessions))
                    .foregroundStyle(Color.green.opacity(0.75))
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

    // MARK: - Intensity Chart (kcal/min per session)

    private var intensityChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Calorie Burn Intensity")
                .font(.headline)
            Text("kcal per minute — higher is more intense")
                .font(.caption).foregroundStyle(.secondary)

            Chart {
                ForEach(sessions.suffix(20)) { s in
                    BarMark(x: .value("Date", s.date, unit: .day),
                            y: .value("kcal/min", s.kcalPerMin))
                    .foregroundStyle(intensityColor(s.kcalPerMin).opacity(0.8))
                    .cornerRadius(2)
                }
                let avg = sessions.filter { $0.kcalPerMin > 0 }.map(\.kcalPerMin).reduce(0, +)
                let cnt = sessions.filter { $0.kcalPerMin > 0 }.count
                if cnt > 0 {
                    RuleMark(y: .value("Avg", avg / Double(cnt)))
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

            HStack(spacing: 12) {
                ForEach([("Low <6", Color.green), ("Med 6–9", .yellow), ("High 9–12", .orange), ("Max >12", .red)], id: \.0) { item in
                    HStack(spacing: 3) {
                        Circle().fill(item.1).frame(width: 7, height: 7)
                        Text(item.0).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
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

    // MARK: - Session Table

    private var sessionTableCard: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .leading)
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 38, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("km").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 38, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                    Text("PkHR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 42, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date)).font(.caption).frame(width: 60, alignment: .leading)
                        Text(String(format: "%.0f", s.durationMins)).font(.caption.monospacedDigit()).frame(width: 38, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal)).font(.caption.monospacedDigit()).foregroundStyle(.orange).frame(width: 45, alignment: .trailing)
                        Text(s.distance.map { String(format: "%.1f", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(.green).frame(width: 38, alignment: .trailing)
                        Text(s.avgHR.map { String(format: "%.0f", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(.red).frame(width: 40, alignment: .trailing)
                        Text(s.maxHR.map { String(format: "%.0f", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(.pink).frame(width: 42, alignment: .trailing)
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
            Image(systemName: "soccerball")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Soccer Sessions")
                .font(.title3.bold())
            Text("Track soccer matches and training sessions on Apple Watch using the Soccer workout type to see your performance data here.")
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
        let distanceType = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType, hrType, distanceType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let kmUnit = HKUnit.meterUnit(with: .kilo)
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
            HKQuery.predicateForWorkouts(with: .soccer)
        ])

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        var allSessions: [SoccerSession] = []
        var mMap: [String: (Date, Int, Double)] = [:]

        for w in workouts {
            let key = df.string(from: w.startDate)
            let ms = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
            var m = mMap[key] ?? (ms, 0, 0)
            m.1 += 1

            let dist = w.statistics(for: distanceType)?.sumQuantity()?.doubleValue(for: kmUnit)
            m.2 += dist ?? 0
            mMap[key] = m

            allSessions.append(SoccerSession(
                id: w.uuid, date: w.startDate,
                durationMins: w.duration / 60,
                kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit),
                maxHR: w.statistics(for: hrType)?.maximumQuantity()?.doubleValue(for: hrUnit),
                distance: dist
            ))
        }

        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count
        totalKm = allSessions.compactMap(\.distance).reduce(0, +)
        avgDuration = allSessions.map(\.durationMins).reduce(0, +) / Double(allSessions.count)
        avgKcal = allSessions.map(\.kcal).reduce(0, +) / Double(allSessions.count)
        let hrs = allSessions.compactMap(\.avgHR)
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)
        maxHRPeak = allSessions.compactMap(\.maxHR).max() ?? 0

        monthBuckets = mMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, sessions: val.1, totalKm: val.2)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview { NavigationStack { SoccerAnalysisView() } }
