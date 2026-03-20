import SwiftUI
import Charts
import HealthKit

// MARK: - GolfAnalysisView

/// Tracks golf rounds recorded on Apple Watch. Golf workouts capture
/// steps, distance walked, active calories, and duration — plus Apple Watch
/// Golf app can record shot data. This view focuses on fitness aspects:
/// distance walked per round, calories, heart rate, and consistency.
struct GolfAnalysisView: View {

    struct GolfRound: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let distanceKm: Double       // distance walked on course
        let kcal: Double
        let avgHR: Double?
        let steps: Double
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let roundCount: Int
        let totalDistanceKm: Double
        let totalKcal: Double
    }

    @State private var rounds: [GolfRound] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalRounds: Int = 0
    @State private var avgDistanceKm: Double = 0
    @State private var avgKcal: Double = 0
    @State private var avgDuration: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if rounds.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    monthlyRoundsChart
                    distancePerRoundCard
                    roundTableCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Golf")
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
                        Text("\(totalRounds)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.green)
                        Text("rounds")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text(String(format: "Avg %.1f km walked per round", avgDistanceKm))
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.golf")
                    .font(.system(size: 44)).foregroundStyle(.green)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Avg kcal", value: String(format: "%.0f", avgKcal), color: .orange)
                statCell(label: "Rounds/mo", value: String(format: "%.1f", monthBuckets.isEmpty ? 0 : Double(totalRounds) / Double(monthBuckets.count)), color: .teal)
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

    // MARK: - Monthly Rounds

    private var monthlyRoundsChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Rounds Per Month")
                .font(.headline)
            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(
                        x: .value("Month", b.monthStart, unit: .month),
                        y: .value("Rounds", b.roundCount)
                    )
                    .foregroundStyle(Color.green.opacity(0.75))
                    .cornerRadius(4)
                    .annotation(position: .top) {
                        if b.roundCount > 0 {
                            Text("\(b.roundCount)").font(.caption2.bold()).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Rounds")
            .chartYScale(domain: 0...max(8, (monthBuckets.map(\.roundCount).max() ?? 4) + 1))
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Distance Per Round

    private var distancePerRoundCard: some View {
        let withDist = rounds.filter { $0.distanceKm > 0.5 }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Distance Walked Per Round")
                .font(.headline)

            if withDist.isEmpty {
                Text("No GPS distance data available")
                    .font(.caption).foregroundStyle(.secondary).frame(height: 80)
            } else {
                Chart {
                    ForEach(withDist) { r in
                        BarMark(
                            x: .value("Round", r.date, unit: .day),
                            y: .value("km", r.distanceKm)
                        )
                        .foregroundStyle(distanceColor(r.distanceKm).opacity(0.75))
                        .cornerRadius(3)
                    }

                    if avgDistanceKm > 0 {
                        RuleMark(y: .value("Avg", avgDistanceKm))
                            .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                            .foregroundStyle(.secondary.opacity(0.6))
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .month)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated))
                    }
                }
                .chartYAxisLabel("km")
                .frame(height: 140)

                Text("A typical 18-hole round = 6–8 km walking. 9 holes = 3–4 km.")
                    .font(.caption2).foregroundStyle(.tertiary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func distanceColor(_ km: Double) -> Color {
        if km >= 7 { return .green }
        if km >= 5 { return .mint }
        if km >= 3 { return .yellow }
        return .orange
    }

    // MARK: - Round Table

    private var roundTableCard: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Rounds").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("Dur").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                    Text("km").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(rounds.suffix(12).reversed()) { r in
                    Divider()
                    HStack {
                        Text(df.string(from: r.date)).font(.caption).frame(width: 65, alignment: .leading)
                        Text(String(format: "%.0f", r.durationMins)).font(.caption.monospacedDigit()).frame(width: 40, alignment: .trailing)
                        Text(r.distanceKm > 0 ? String(format: "%.1f", r.distanceKm) : "—").font(.caption.monospacedDigit()).foregroundStyle(.green).frame(width: 40, alignment: .trailing)
                        Text(String(format: "%.0f", r.kcal)).font(.caption.monospacedDigit()).foregroundStyle(.orange).frame(width: 45, alignment: .trailing)
                        Text(r.avgHR.map { String(format: "%.0f", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(.red).frame(width: 40, alignment: .trailing)
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
            Image(systemName: "figure.golf")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Golf Rounds")
                .font(.title3.bold())
            Text("Track your golf rounds on Apple Watch to see distance walked, calories, and round history.")
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
        let distType = HKQuantityType(.distanceWalkingRunning)
        let kcalType = HKQuantityType(.activeEnergyBurned)
        let hrType = HKQuantityType(.heartRate)
        let stepsType = HKQuantityType(.stepCount)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, distType, kcalType, hrType, stepsType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: .golf)
            ])
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        let kmUnit = HKUnit.meterUnit(with: .kilo)
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let stepsUnit = HKUnit.count()
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        var rawRounds: [GolfRound] = []
        var monthMap: [String: (Date, Int, Double, Double)] = [:]

        for w in workouts {
            let dist = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: kmUnit) ?? 0
            let kcal = w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0
            let avgHR = w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)
            let steps = w.statistics(for: stepsType)?.sumQuantity()?.doubleValue(for: stepsUnit) ?? 0

            rawRounds.append(GolfRound(id: w.uuid, date: w.startDate, durationMins: w.duration / 60,
                                        distanceKm: dist, kcal: kcal, avgHR: avgHR, steps: steps))

            let key = df.string(from: w.startDate)
            let monthStart = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
            var m = monthMap[key] ?? (monthStart, 0, 0, 0)
            m.1 += 1; m.2 += dist; m.3 += kcal
            monthMap[key] = m
        }

        rounds = rawRounds
        totalRounds = rawRounds.count
        avgDuration = rawRounds.map(\.durationMins).reduce(0, +) / Double(rawRounds.count)
        avgKcal = rawRounds.map(\.kcal).reduce(0, +) / Double(rawRounds.count)
        let withDist = rawRounds.filter { $0.distanceKm > 0.5 }
        avgDistanceKm = withDist.isEmpty ? 0 : withDist.map(\.distanceKm).reduce(0, +) / Double(withDist.count)

        monthBuckets = monthMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, roundCount: val.1, totalDistanceKm: val.2, totalKcal: val.3)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview { NavigationStack { GolfAnalysisView() } }
