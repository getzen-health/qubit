import SwiftUI
import Charts
import HealthKit

/// 12-month HIIT progression: session frequency, duration trend, calorie burn, first vs last 30 days, quarterly breakdown.
struct HIITProgressionView: View {

    // MARK: - Data structs

    private struct SessionPoint: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let calories: Double
        let maxHR: Double
        let avgHR: Double
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let totalMins: Double
        let totalCalories: Double
    }

    private struct QuarterRow: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let totalMins: Double
        let avgDurationMins: Double
        let avgCalories: Double
    }

    // MARK: - State

    @State private var sessions: [SessionPoint] = []
    @State private var monthStats: [MonthStat] = []
    @State private var quarterRows: [QuarterRow] = []
    @State private var isLoading = true

    @State private var totalSessions: Int = 0
    @State private var totalMins: Double = 0
    @State private var totalCalories: Double = 0
    @State private var avgDurationMins: Double = 0
    @State private var avgCaloriesPerSession: Double = 0
    @State private var peakHR: Double = 0

    @State private var firstCount: Int = 0
    @State private var firstAvgDuration: Double = 0
    @State private var firstAvgCalories: Double = 0
    @State private var lastCount: Int = 0
    @State private var lastAvgDuration: Double = 0
    @State private var lastAvgCalories: Double = 0

    @State private var durationSlope: Double = 0
    @State private var durationIntercept: Double = 0

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.count < 3 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryGrid
                    firstLastCard
                    monthlyFrequencyChart
                    sessionDurationTrendChart
                    monthlyCaloriesChart
                    quarterlyTable
                    guidelinesCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("HIIT Progression")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(label: "Sessions", value: "\(totalSessions)", icon: "bolt.heart.fill", color: .pink)
            statCard(label: "Total Mins", value: String(format: "%.0f", totalMins), icon: "clock.fill", color: .orange)
            statCard(label: "Total kcal", value: String(format: "%.0f", totalCalories), icon: "flame.fill", color: .red)
            statCard(label: "Avg Duration", value: String(format: "%.0f min", avgDurationMins), icon: "timer", color: .yellow)
            statCard(label: "Avg kcal", value: String(format: "%.0f", avgCaloriesPerSession), icon: "bolt.fill", color: .orange)
            statCard(label: "Peak HR", value: peakHR > 0 ? String(format: "%.0f bpm", peakHR) : "—", icon: "heart.fill", color: .red)
        }
    }

    private func statCard(label: String, value: String, icon: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - First vs Last Card

    private var firstLastCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("First vs Last 30 Days")
                .font(.headline)

            HStack(spacing: 0) {
                periodColumn(label: "First 30 Days", count: firstCount,
                             avgDuration: firstAvgDuration, avgCalories: firstAvgCalories, color: .orange)
                Divider().frame(height: 80)
                periodColumn(label: "Last 30 Days", count: lastCount,
                             avgDuration: lastAvgDuration, avgCalories: lastAvgCalories, color: .pink)
            }

            Text(firstLastMessage)
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.top, 2)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func periodColumn(label: String, count: Int, avgDuration: Double, avgCalories: Double, color: Color) -> some View {
        VStack(spacing: 6) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text("\(count) sessions")
                .font(.title3.bold())
                .foregroundStyle(color)
            Text(String(format: "%.0f min avg", avgDuration))
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(String(format: "%.0f kcal avg", avgCalories))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var firstLastMessage: String {
        let durDiff = lastAvgDuration - firstAvgDuration
        let calDiff = lastAvgCalories - firstAvgCalories
        if lastCount > firstCount && calDiff > 20 {
            return "More frequent sessions with higher calorie burn — great HIIT progression."
        } else if durDiff > 3 {
            return "Sessions are getting longer — building aerobic capacity."
        } else if calDiff > 30 {
            return "Burning more calories per session — intensity is increasing."
        } else if lastCount < firstCount {
            return "Fewer sessions recently — consider ramping up frequency."
        }
        return "Consistent HIIT training over the year."
    }

    // MARK: - Monthly Frequency Chart

    private var monthlyFrequencyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Sessions")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart(monthStats) { m in
                BarMark(
                    x: .value("Month", m.label),
                    y: .value("Sessions", m.sessions)
                )
                .foregroundStyle(
                    LinearGradient(colors: [.pink, .orange], startPoint: .bottom, endPoint: .top)
                )
                .cornerRadius(4)
            }
            .chartXAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let s = val.as(String.self) {
                            Text(s).font(.system(size: 8))
                        }
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Session Duration Trend

    private var sessionDurationTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Session Duration (12 months)")
                .font(.headline)
                .padding(.horizontal, 4)

            let trendPoints = trendLine(sessions.map { (x: $0.date.timeIntervalSince1970, y: $0.durationMins) },
                                        slope: durationSlope, intercept: durationIntercept)

            Chart {
                ForEach(sessions) { s in
                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("Duration (min)", s.durationMins)
                    )
                    .foregroundStyle(.pink.opacity(0.6))
                    .symbolSize(25)
                }
                ForEach(trendPoints, id: \.0) { pt in
                    LineMark(
                        x: .value("Date", Date(timeIntervalSince1970: pt.0)),
                        y: .value("Trend", pt.1)
                    )
                    .foregroundStyle(.orange)
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5]))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .frame(height: 180)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))

            Text(durationSlope > 0.00003 ? "Sessions are getting longer — building work capacity." :
                 durationSlope < -0.00003 ? "Sessions are getting shorter — consider progressive overload." :
                 "Session duration is consistent.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)
        }
    }

    // MARK: - Monthly Calories Chart

    private var monthlyCaloriesChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Calorie Burn")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart(monthStats) { m in
                BarMark(
                    x: .value("Month", m.label),
                    y: .value("kcal", m.totalCalories)
                )
                .foregroundStyle(
                    LinearGradient(colors: [.red, .orange], startPoint: .bottom, endPoint: .top)
                )
                .cornerRadius(4)
            }
            .chartXAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let s = val.as(String.self) {
                            Text(s).font(.system(size: 8))
                        }
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Quarterly Table

    private var quarterlyTable: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Quarterly Breakdown")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Quarter").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                    Text("Sessions").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 56, alignment: .trailing)
                    Text("Mins").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 48, alignment: .trailing)
                    Text("Avg Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                    Text("Avg kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)

                ForEach(Array(quarterRows.enumerated()), id: \.element.id) { i, row in
                    Divider()
                    HStack {
                        Text(row.label).font(.caption).frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(row.sessions)").font(.caption.monospacedDigit()).frame(width: 56, alignment: .trailing)
                        Text(String(format: "%.0f", row.totalMins)).font(.caption.monospacedDigit()).frame(width: 48, alignment: .trailing)
                        Text(String(format: "%.0f", row.avgDurationMins)).font(.caption.monospacedDigit()).frame(width: 52, alignment: .trailing)
                        Text(String(format: "%.0f", row.avgCalories)).font(.caption.monospacedDigit()).frame(width: 52, alignment: .trailing)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(i % 2 == 1 ? Color(.systemFill).opacity(0.3) : .clear)
                }
            }
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("HIIT Guidelines", systemImage: "lightbulb.fill")
                .font(.headline)
                .foregroundStyle(.pink)
            Text("Limit HIIT to 2–3 sessions per week to allow adequate recovery. Track your peak heart rate to ensure you're reaching 85–95% of max HR for true high-intensity effort. Sessions of 20–45 minutes are optimal — HIIT should be hard but efficient. Monitor HRV the morning after to gauge recovery quality.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.pink.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "bolt.heart.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Complete at least 3 HIIT sessions to view progression analytics.")
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

        let store = HKHealthStore()
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date())

        let workouts = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let filtered = workouts.filter {
            $0.workoutActivityType == .highIntensityIntervalTraining && $0.duration > 300
        }

        let pts: [SessionPoint] = filtered.map { w in
            let durationMins = w.duration / 60.0
            let calories = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            let maxHR = (w.statistics(for: HKQuantityType(.heartRate))?.maximumQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))) ?? 0
            let avgHR = (w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))) ?? 0
            return SessionPoint(id: w.uuid, date: w.startDate, durationMins: durationMins, calories: calories, maxHR: maxHR, avgHR: avgHR)
        }

        sessions = pts
        totalSessions = pts.count
        totalMins = pts.map(\.durationMins).reduce(0, +)
        totalCalories = pts.map(\.calories).reduce(0, +)
        avgDurationMins = pts.isEmpty ? 0 : totalMins / Double(pts.count)
        avgCaloriesPerSession = pts.isEmpty ? 0 : totalCalories / Double(pts.count)
        peakHR = pts.map(\.maxHR).max() ?? 0

        // First vs last 30 days
        let now = Date()
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: now) ?? now
        let sixtyDaysAgo = Calendar.current.date(byAdding: .day, value: -60, to: now) ?? now

        let lastSessions: [SessionPoint] = pts.filter { $0.date >= thirtyDaysAgo }
        let firstSessions: [SessionPoint] = pts.filter { $0.date < thirtyDaysAgo && $0.date >= sixtyDaysAgo }

        lastCount = lastSessions.count
        lastAvgDuration = lastSessions.isEmpty ? 0 : lastSessions.map(\.durationMins).reduce(0, +) / Double(lastSessions.count)
        lastAvgCalories = lastSessions.isEmpty ? 0 : lastSessions.map(\.calories).reduce(0, +) / Double(lastSessions.count)
        firstCount = firstSessions.count
        firstAvgDuration = firstSessions.isEmpty ? 0 : firstSessions.map(\.durationMins).reduce(0, +) / Double(firstSessions.count)
        firstAvgCalories = firstSessions.isEmpty ? 0 : firstSessions.map(\.calories).reduce(0, +) / Double(firstSessions.count)

        // Monthly stats
        let mf = DateFormatter(); mf.dateFormat = "MMM yy"
        var monthBuckets: [String: (sessions: Int, mins: Double, calories: Double)] = [:]
        for pt in pts {
            let key = mf.string(from: pt.date)
            var b = monthBuckets[key] ?? (sessions: 0, mins: 0, calories: 0)
            b.sessions += 1; b.mins += pt.durationMins; b.calories += pt.calories
            monthBuckets[key] = b
        }
        let sortedMonthKeys = monthBuckets.keys.sorted { a, b in
            (mf.date(from: a) ?? .distantPast) < (mf.date(from: b) ?? .distantPast)
        }
        monthStats = sortedMonthKeys.map { k in
            let v = monthBuckets[k]!
            return MonthStat(id: k, label: k, sessions: v.sessions, totalMins: v.mins, totalCalories: v.calories)
        }

        // Quarterly breakdown
        let cal = Calendar.current
        var qBuckets: [String: (sessions: Int, mins: Double, calories: Double)] = [:]
        for pt in pts {
            let comps = cal.dateComponents([.year, .month], from: pt.date)
            let y = comps.year ?? 2024
            let q = ((comps.month ?? 1) - 1) / 3 + 1
            let key = "\(y) Q\(q)"
            var b = qBuckets[key] ?? (sessions: 0, mins: 0, calories: 0)
            b.sessions += 1; b.mins += pt.durationMins; b.calories += pt.calories
            qBuckets[key] = b
        }
        quarterRows = qBuckets.keys.sorted().map { k in
            let v = qBuckets[k]!
            let avgDur = v.sessions > 0 ? v.mins / Double(v.sessions) : 0
            let avgCal = v.sessions > 0 ? v.calories / Double(v.sessions) : 0
            return QuarterRow(id: k, label: k, sessions: v.sessions, totalMins: v.mins, avgDurationMins: avgDur, avgCalories: avgCal)
        }

        // Linear regression on duration
        let xs = pts.map(\.date.timeIntervalSince1970)
        let ys = pts.map(\.durationMins)
        (durationSlope, durationIntercept) = linearRegression(xs: xs, ys: ys)
    }

    // MARK: - Helpers

    private func linearRegression(xs: [Double], ys: [Double]) -> (slope: Double, intercept: Double) {
        let n = Double(xs.count)
        guard n > 1 else { return (0, 0) }
        let mx = xs.reduce(0, +) / n
        let my = ys.reduce(0, +) / n
        let ssxy = zip(xs, ys).map { ($0 - mx) * ($1 - my) }.reduce(0, +)
        let ssxx = xs.map { ($0 - mx) * ($0 - mx) }.reduce(0, +)
        guard ssxx != 0 else { return (0, my) }
        let slope = ssxy / ssxx
        return (slope, my - slope * mx)
    }

    private func trendLine(_ pts: [(x: Double, y: Double)], slope: Double, intercept: Double) -> [(Double, Double)] {
        guard let first = pts.first, let last = pts.last else { return [] }
        return [(first.x, slope * first.x + intercept), (last.x, slope * last.x + intercept)]
    }
}

#Preview {
    NavigationStack { HIITProgressionView() }
}
