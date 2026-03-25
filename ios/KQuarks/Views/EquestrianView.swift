import SwiftUI
import Charts
import HealthKit

// MARK: - EquestrianView

/// Tracks equestrian sports workouts — horseback riding, dressage, show jumping,
/// and trail riding tracked via HKWorkoutActivityType.equestrianSports.
/// Key metrics: session duration, calorie burn, HR, and 6-month session history.
struct EquestrianView: View {

    struct EqSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?
        let maxHR: Double?
        var kcalPerMin: Double { durationMins > 0 ? kcal / durationMins : 0 }
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let sessions: Int
        let totalMins: Double
    }

    @State private var sessions: [EqSession] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalHours: Double = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var avgDuration: Double = 0
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
                    durationChart
                    recentSessionsCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Equestrian Sports")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("6-Month Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.5, green: 0.3, blue: 0.1))
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text(String(format: "%.1f hrs total", totalHours))
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.equestrian.sports")
                    .font(.system(size: 44))
                    .foregroundStyle(Color(red: 0.5, green: 0.3, blue: 0.1))
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: Color(red: 0.5, green: 0.3, blue: 0.1))
                Divider().frame(height: 36)
                statCell(label: "kcal/min", value: String(format: "%.1f", avgKcalPerMin), color: .brown)
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

    // MARK: - Monthly Sessions Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Sessions").font(.headline)
            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(x: .value("Month", b.monthStart, unit: .month),
                            y: .value("Sessions", b.sessions))
                    .foregroundStyle(Color(red: 0.5, green: 0.3, blue: 0.1).opacity(0.75))
                    .cornerRadius(4)
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

    // MARK: - Session Duration Chart

    private var durationChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Session Duration (min)").font(.headline)
            Chart {
                ForEach(sessions.suffix(20)) { s in
                    BarMark(x: .value("Date", s.date, unit: .day),
                            y: .value("Min", s.durationMins))
                    .foregroundStyle(s.durationMins >= 120 ? Color.brown :
                                     s.durationMins >= 60 ? Color(red: 0.5, green: 0.3, blue: 0.1).opacity(0.8) :
                                     Color(red: 0.7, green: 0.5, blue: 0.2).opacity(0.6))
                    .cornerRadius(2)
                }
                if avgDuration > 0 {
                    RuleMark(y: .value("Avg", avgDuration))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("min")
            .frame(height: 120)
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
                        Text(String(format: "%.0f", s.kcal)).font(.caption.monospacedDigit()).foregroundStyle(Color(red: 0.5, green: 0.3, blue: 0.1)).frame(width: 45, alignment: .trailing)
                        Text(String(format: "%.1f", s.kcalPerMin)).font(.caption.monospacedDigit()).foregroundStyle(.brown).frame(width: 45, alignment: .trailing)
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
            Image(systemName: "figure.equestrian.sports")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Equestrian Sessions")
                .font(.title3.bold())
            Text("Track horseback riding, dressage, show jumping, or trail riding on Apple Watch using the Equestrian Sports workout type.")
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

        let sixMonthsAgo = Calendar.current.date(byAdding: .month, value: -6, to: Date()) ?? Date()
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: sixMonthsAgo, end: Date()),
            HKQuery.predicateForWorkouts(with: .equestrianSports)
        ])

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        var allSessions: [EqSession] = []
        var mMap: [String: (Date, Int, Double)] = [:]

        for w in workouts {
            let s = EqSession(
                id: w.uuid, date: w.startDate,
                durationMins: w.duration / 60,
                kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit),
                maxHR: w.statistics(for: hrType)?.maximumQuantity()?.doubleValue(for: hrUnit)
            )
            allSessions.append(s)

            let mk = df.string(from: w.startDate)
            let ms = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
            var m = mMap[mk] ?? (ms, 0, 0)
            m.1 += 1; m.2 += s.durationMins
            mMap[mk] = m
        }

        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count
        totalHours = allSessions.map(\.durationMins).reduce(0, +) / 60
        let durations = allSessions.filter { $0.durationMins > 0 }.map(\.durationMins)
        avgDuration = durations.isEmpty ? 0 : durations.reduce(0, +) / Double(durations.count)
        let kRates = allSessions.filter { $0.kcalPerMin > 0 }.map(\.kcalPerMin)
        avgKcalPerMin = kRates.isEmpty ? 0 : kRates.reduce(0, +) / Double(kRates.count)
        let hrs = allSessions.compactMap(\.avgHR)
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)

        monthBuckets = mMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, sessions: val.1, totalMins: val.2)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview { NavigationStack { EquestrianView() } }
