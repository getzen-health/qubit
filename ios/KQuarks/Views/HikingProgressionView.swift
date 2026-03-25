import SwiftUI
import Charts
import HealthKit

/// 12-month hiking progression: distance trend, elevation gain, first vs last 30 days, quarterly breakdown.
struct HikingProgressionView: View {

    // MARK: - Data structs

    private struct SessionPoint: Identifiable {
        let id: UUID
        let date: Date
        let distKm: Double
        let elevationM: Double
        let durationMins: Double
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let totalKm: Double
        let totalElevationM: Double
        let sessions: Int
    }

    private struct QuarterRow: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let totalKm: Double
        let avgKm: Double
        let totalElevationM: Double
    }

    // MARK: - State

    @State private var sessions: [SessionPoint] = []
    @State private var monthStats: [MonthStat] = []
    @State private var quarterRows: [QuarterRow] = []
    @State private var isLoading = true

    // Derived summaries
    @State private var totalSessions: Int = 0
    @State private var totalKm: Double = 0
    @State private var totalElevationM: Double = 0
    @State private var avgDistKm: Double = 0
    @State private var longestKm: Double = 0
    @State private var highestClimbM: Double = 0

    // First vs last 30 days
    @State private var firstCount: Int = 0
    @State private var firstAvgKm: Double = 0
    @State private var firstAvgElev: Double = 0
    @State private var lastCount: Int = 0
    @State private var lastAvgKm: Double = 0
    @State private var lastAvgElev: Double = 0

    // Trend
    @State private var distSlope: Double = 0
    @State private var distIntercept: Double = 0
    @State private var elevSlope: Double = 0
    @State private var elevIntercept: Double = 0

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
                    monthlyDistanceChart
                    sessionDistanceTrendChart
                    sessionElevationTrendChart
                    quarterlyTable
                    guidelinesCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Hiking Progression")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(label: "Hikes", value: "\(totalSessions)", icon: "figure.hiking", color: .green)
            statCard(label: "Total km", value: String(format: "%.0f", totalKm), icon: "map", color: .mint)
            statCard(label: "Total Climb", value: String(format: "%.0f m", totalElevationM), icon: "mountain.2.fill", color: .teal)
            statCard(label: "Avg Distance", value: String(format: "%.1f km", avgDistKm), icon: "arrow.left.and.right", color: .green)
            statCard(label: "Longest Hike", value: String(format: "%.1f km", longestKm), icon: "trophy.fill", color: .yellow)
            statCard(label: "Best Climb", value: String(format: "%.0f m", highestClimbM), icon: "arrow.up.circle.fill", color: .orange)
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
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - First vs Last Card

    private var firstLastCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("First vs Last 30 Days")
                .font(.headline)

            HStack(spacing: 0) {
                periodColumn(label: "First 30 Days", count: firstCount,
                             avgKm: firstAvgKm, avgElev: firstAvgElev, color: .mint)
                Divider().frame(height: 80)
                periodColumn(label: "Last 30 Days", count: lastCount,
                             avgKm: lastAvgKm, avgElev: lastAvgElev, color: .green)
            }

            Text(firstLastMessage)
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.top, 2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func periodColumn(label: String, count: Int, avgKm: Double, avgElev: Double, color: Color) -> some View {
        VStack(spacing: 6) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text("\(count) hikes")
                .font(.title3.bold())
                .foregroundStyle(color)
            Text(String(format: "%.1f km avg", avgKm))
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(String(format: "%.0f m climb avg", avgElev))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var firstLastMessage: String {
        let distDiff = lastAvgKm - firstAvgKm
        let elevDiff = lastAvgElev - firstAvgElev
        if distDiff > 0.5 && elevDiff > 50 {
            return "Hikes are longer and climbing more — great progression."
        } else if distDiff > 0.5 {
            return "Covering more distance per hike — endurance is building."
        } else if elevDiff > 100 {
            return "Taking on more elevation — strength is improving."
        } else if distDiff < -0.5 {
            return "Shorter hikes recently — consider building back up."
        }
        return "Consistent hiking pattern over the year."
    }

    // MARK: - Monthly Distance Chart

    private var monthlyDistanceChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Distance")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart(monthStats) { m in
                BarMark(
                    x: .value("Month", m.label),
                    y: .value("km", m.totalKm)
                )
                .foregroundStyle(
                    LinearGradient(colors: [.green, .mint], startPoint: .bottom, endPoint: .top)
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
            .frame(height: 180)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Session Distance Trend

    private var sessionDistanceTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Distance per Hike (12 months)")
                .font(.headline)
                .padding(.horizontal, 4)

            let trendPoints = trendLine(sessions.map { (x: $0.date.timeIntervalSince1970, y: $0.distKm) },
                                        slope: distSlope, intercept: distIntercept)

            Chart {
                ForEach(sessions) { s in
                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("km", s.distKm)
                    )
                    .foregroundStyle(.green.opacity(0.6))
                    .symbolSize(25)
                }
                ForEach(trendPoints, id: \.0) { pt in
                    LineMark(
                        x: .value("Date", Date(timeIntervalSince1970: pt.0)),
                        y: .value("Trend", pt.1)
                    )
                    .foregroundStyle(.mint)
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
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            Text(distSlope > 0.00005 ? "Distance per hike is trending up." :
                 distSlope < -0.00005 ? "Distance per hike is trending down." :
                 "Distance per hike is stable.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)
        }
    }

    // MARK: - Session Elevation Trend

    private var sessionElevationTrendChart: some View {
        let hasSomeElevation = sessions.contains { $0.elevationM > 0 }
        guard hasSomeElevation else { return AnyView(EmptyView()) }

        let elevSessions = sessions.filter { $0.elevationM > 0 }
        let trendPoints = trendLine(elevSessions.map { (x: $0.date.timeIntervalSince1970, y: $0.elevationM) },
                                    slope: elevSlope, intercept: elevIntercept)

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Elevation Gain per Hike")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(elevSessions) { s in
                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("Elevation (m)", s.elevationM)
                    )
                    .foregroundStyle(.teal.opacity(0.6))
                    .symbolSize(25)
                }
                ForEach(trendPoints, id: \.0) { pt in
                    LineMark(
                        x: .value("Date", Date(timeIntervalSince1970: pt.0)),
                        y: .value("Trend", pt.1)
                    )
                    .foregroundStyle(.green)
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
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            Text(elevSlope > 0.0001 ? "Taking on more elevation over time — great strength gains." :
                 elevSlope < -0.0001 ? "Elevation per hike is declining — try more challenging terrain." :
                 "Elevation per hike is consistent.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)
        })
    }

    // MARK: - Quarterly Table

    private var quarterlyTable: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Quarterly Breakdown")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Quarter").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                    Text("Hikes").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 44, alignment: .trailing)
                    Text("km").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                    Text("Avg km").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                    Text("Climb").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)

                ForEach(Array(quarterRows.enumerated()), id: \.element.id) { i, row in
                    Divider()
                    HStack {
                        Text(row.label).font(.caption).frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(row.sessions)").font(.caption.monospacedDigit()).frame(width: 44, alignment: .trailing)
                        Text(String(format: "%.0f", row.totalKm)).font(.caption.monospacedDigit()).frame(width: 52, alignment: .trailing)
                        Text(String(format: "%.1f", row.avgKm)).font(.caption.monospacedDigit()).frame(width: 52, alignment: .trailing)
                        Text(String(format: "%.0fm", row.totalElevationM)).font(.caption.monospacedDigit()).frame(width: 52, alignment: .trailing)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(i % 2 == 1 ? Color(.systemFill).opacity(0.3) : .clear)
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Hiking Tips", systemImage: "lightbulb.fill")
                .font(.headline)
                .foregroundStyle(.green)
            Text("Aim for at least 2–3 hikes per month for steady cardiovascular and strength benefits. Progressively increasing elevation gain builds leg strength and aerobic capacity. Longer hikes on weekends complement shorter mid-week activity. Elevation accumulation over a season is a great fitness marker.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.green.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.hiking")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Complete at least 3 hikes to view progression analytics.")
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

        let hikeTypes: Set<HKWorkoutActivityType> = [.hiking]
        let filtered = workouts.filter { w in
            hikeTypes.contains(w.workoutActivityType) &&
            w.duration > 300 &&
            (w.totalDistance?.doubleValue(for: .meter()) ?? 0) > 200
        }

        // Build session points
        let pts: [SessionPoint] = filtered.map { w in
            let distM = w.totalDistance?.doubleValue(for: .meter()) ?? 0
            let distKm = distM / 1000.0
            let elevM = (w.totalFlightsClimbed?.doubleValue(for: .count()) ?? 0) * 3.0
            let durationMins = w.duration / 60.0
            return SessionPoint(id: w.uuid, date: w.startDate, distKm: distKm, elevationM: elevM, durationMins: durationMins)
        }

        sessions = pts
        totalSessions = pts.count
        totalKm = pts.map(\.distKm).reduce(0, +)
        totalElevationM = pts.map(\.elevationM).reduce(0, +)
        avgDistKm = pts.isEmpty ? 0 : totalKm / Double(pts.count)
        longestKm = pts.map(\.distKm).max() ?? 0
        highestClimbM = pts.map(\.elevationM).max() ?? 0

        // First vs last 30 days
        let now = Date()
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: now) ?? now
        let sixtyDaysAgo = Calendar.current.date(byAdding: .day, value: -60, to: now) ?? now

        let lastSessions: [SessionPoint] = pts.filter { $0.date >= thirtyDaysAgo }
        let firstSessions: [SessionPoint] = pts.filter { $0.date < thirtyDaysAgo && $0.date >= sixtyDaysAgo }

        lastCount = lastSessions.count
        lastAvgKm = lastSessions.isEmpty ? 0 : lastSessions.map(\.distKm).reduce(0, +) / Double(lastSessions.count)
        lastAvgElev = lastSessions.isEmpty ? 0 : lastSessions.map(\.elevationM).reduce(0, +) / Double(lastSessions.count)
        firstCount = firstSessions.count
        firstAvgKm = firstSessions.isEmpty ? 0 : firstSessions.map(\.distKm).reduce(0, +) / Double(firstSessions.count)
        firstAvgElev = firstSessions.isEmpty ? 0 : firstSessions.map(\.elevationM).reduce(0, +) / Double(firstSessions.count)

        // Monthly stats
        let cal = Calendar.current
        var monthBuckets: [String: (km: Double, elevM: Double, count: Int)] = [:]
        let mf = DateFormatter(); mf.dateFormat = "MMM yy"
        for pt in pts {
            let key = mf.string(from: pt.date)
            var b = monthBuckets[key] ?? (km: 0, elevM: 0, count: 0)
            b.km += pt.distKm; b.elevM += pt.elevationM; b.count += 1
            monthBuckets[key] = b
        }

        let sortedMonthKeys = monthBuckets.keys.sorted { a, b in
            (mf.date(from: a) ?? .distantPast) < (mf.date(from: b) ?? .distantPast)
        }
        monthStats = sortedMonthKeys.map { k in
            let v = monthBuckets[k]!
            return MonthStat(id: k, label: k, totalKm: v.km, totalElevationM: v.elevM, sessions: v.count)
        }

        // Quarterly breakdown
        var qBuckets: [String: (sessions: Int, km: Double, elevM: Double)] = [:]
        for pt in pts {
            let comps = cal.dateComponents([.year, .month], from: pt.date)
            let y = comps.year ?? 2024
            let q = ((comps.month ?? 1) - 1) / 3 + 1
            let key = "\(y) Q\(q)"
            var b = qBuckets[key] ?? (sessions: 0, km: 0, elevM: 0)
            b.sessions += 1; b.km += pt.distKm; b.elevM += pt.elevationM
            qBuckets[key] = b
        }
        quarterRows = qBuckets.keys.sorted().map { k in
            let v = qBuckets[k]!
            return QuarterRow(id: k, label: k, sessions: v.sessions, totalKm: v.km,
                              avgKm: v.sessions > 0 ? v.km / Double(v.sessions) : 0,
                              totalElevationM: v.elevM)
        }

        // Linear regression on distance
        let xDist = pts.map(\.date.timeIntervalSince1970)
        let yDist = pts.map(\.distKm)
        (distSlope, distIntercept) = linearRegression(xs: xDist, ys: yDist)

        // Linear regression on elevation (using sessions with elevation)
        let elevPts = pts.filter { $0.elevationM > 0 }
        let xElev = elevPts.map(\.date.timeIntervalSince1970)
        let yElev = elevPts.map(\.elevationM)
        (elevSlope, elevIntercept) = linearRegression(xs: xElev, ys: yElev)
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
    NavigationStack { HikingProgressionView() }
}
