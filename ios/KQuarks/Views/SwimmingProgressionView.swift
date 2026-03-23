import SwiftUI
import Charts
import HealthKit

/// 12-month swimming progression: distance trend, pace per 100m trend,
/// monthly breakdown, and first vs last 30 days comparison.
struct SwimmingProgressionView: View {

    private struct SwimPoint: Identifiable {
        let id: Date
        let distM: Double
        let pace100Secs: Double
        let trend: Double
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let totalM: Double
        let avgPace100Secs: Double
    }

    @State private var swimPoints: [SwimPoint] = []
    @State private var monthStats: [MonthStat] = []
    @State private var totalSwims: Int = 0
    @State private var totalMeters: Double = 0
    @State private var avgMeters: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var avgPace100Str: String = ""
    @State private var bestPace100Str: String = ""
    @State private var paceTrend: Double = 0
    @State private var firstAvgPace: Double = 0
    @State private var lastAvgPace: Double = 0
    @State private var firstAvgDist: Double = 0
    @State private var lastAvgDist: Double = 0
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if totalSwims < 4 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCards
                    if firstAvgPace > 0 && lastAvgPace > 0 { firstLastCard }
                    if monthStats.count >= 2 { monthlyDistanceChart }
                    if swimPoints.count >= 4 { paceTrendChart }
                    if monthStats.filter({ $0.avgPace100Secs > 0 }).count >= 2 { monthlyPaceChart }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Swimming Progression")
        .navigationBarTitleDisplayMode(.large)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Swims (1yr)", value: "\(totalSwims)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .cyan)
            statCard(label: "Total Distance", value: String(format: "%.1f km", totalMeters / 1000), sub: "\(Int(avgMeters)) m avg/swim", color: .teal)
            statCard(label: "Avg Pace/100m", value: avgPace100Str.isEmpty ? "—" : avgPace100Str, sub: "Best: \(bestPace100Str)", color: .blue)
            statCard(label: "Pace Trend", value: trendStr, sub: trendSubtext, color: trendColor)
        }
    }

    private var trendStr: String {
        // Negative pace trend = getting faster (improvement)
        let sign = paceTrend < 0 ? "" : "+"
        return String(format: "%@%ds", sign, Int(paceTrend))
    }

    private var trendSubtext: String {
        if paceTrend < -1 { return "Getting faster ↑" }
        if paceTrend > 1 { return "Getting slower ↓" }
        return "Stable pace"
    }

    private var trendColor: Color {
        if paceTrend < -1 { return .green }
        if paceTrend > 1 { return .red }
        return .secondary
    }

    private func statCard(label: String, value: String, sub: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.system(size: 20, weight: .bold, design: .rounded)).foregroundStyle(color)
            if !sub.isEmpty { Text(sub).font(.caption2).foregroundStyle(.secondary) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - First vs Last Card

    private var firstLastCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("First vs. Last 30 Days").font(.subheadline.weight(.semibold))
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("First 30 days").font(.caption).foregroundStyle(.secondary)
                    Text(pace100Str(secs: firstAvgPace)).font(.title3.bold())
                    Text("\(Int(firstAvgDist)) m avg").font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Divider().frame(height: 50)
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Last 30 days").font(.caption).foregroundStyle(.secondary)
                    Text(pace100Str(secs: lastAvgPace)).font(.title3.bold())
                    Text("\(Int(lastAvgDist)) m avg").font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
            }
            Text(firstLastMessage).font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var firstLastMessage: String {
        let diff = firstAvgPace - lastAvgPace  // positive = got faster
        if diff > 1 { return String(format: "%.0f sec/100m faster — solid technique gains.", diff) }
        if diff < -1 { return String(format: "%.0f sec/100m slower — review technique and fatigue.", -diff) }
        return "Pace is consistent year-over-year."
    }

    // MARK: - Monthly Distance Chart

    private var monthlyDistanceChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Distance").font(.subheadline.weight(.semibold))
            Text("Total meters per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Meters", m.totalM))
                        .foregroundStyle(Color.cyan.opacity(0.8)).cornerRadius(4)
                }
            }
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)m").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 150)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Pace Trend Chart (reversed Y: lower = faster = higher on screen)

    private var paceTrendChart: some View {
        let paces = swimPoints.map(\.pace100Secs)
        let minPace = paces.min() ?? 60
        let maxPace = paces.max() ?? 120
        let pad = max(5.0, (maxPace - minPace) * 0.15)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Pace Trend (per 100m)").font(.subheadline.weight(.semibold))
            Text("Each swim · reversed axis · dashed = trend").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(swimPoints) { p in
                    LineMark(x: .value("Date", p.id), y: .value("Pace", p.pace100Secs))
                        .foregroundStyle(Color.cyan.opacity(0.5))
                        .interpolationMethod(.linear)
                    PointMark(x: .value("Date", p.id), y: .value("Pace", p.pace100Secs))
                        .foregroundStyle(Color.cyan.opacity(0.6))
                        .symbolSize(20)
                    LineMark(x: .value("Date", p.id), y: .value("Trend", p.trend))
                        .foregroundStyle(Color.yellow)
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [6, 3]))
                }
            }
            .chartYScale(domain: (maxPace + pad)...(minPace - pad))
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { v in
                    if let d = v.as(Date.self) {
                        AxisValueLabel { Text(d, format: .dateTime.month(.abbreviated)).font(.system(size: 9)) }
                    }
                }
            }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    if let secs = v.as(Double.self) {
                        AxisValueLabel { Text(pace100Str(secs: secs)).font(.caption2) }
                    }
                    AxisGridLine()
                }
            }
            .frame(height: 200)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly Pace Chart (reversed)

    private var monthlyPaceChart: some View {
        let validMonths = monthStats.filter { $0.avgPace100Secs > 0 }
        let minPace = validMonths.map(\.avgPace100Secs).min() ?? 60
        let maxPace = validMonths.map(\.avgPace100Secs).max() ?? 120
        let pad = max(3.0, (maxPace - minPace) * 0.15)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Avg Pace/100m").font(.subheadline.weight(.semibold))
            Text("Reversed axis: faster = higher").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(validMonths) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Pace", m.avgPace100Secs))
                        .foregroundStyle(Color.teal)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Month", m.label), y: .value("Pace", m.avgPace100Secs))
                        .foregroundStyle(Color.teal)
                        .symbolSize(30)
                }
            }
            .chartYScale(domain: (maxPace + pad)...(minPace - pad))
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    if let secs = v.as(Double.self) {
                        AxisValueLabel { Text(pace100Str(secs: secs)).font(.caption2) }
                    }
                    AxisGridLine()
                }
            }
            .frame(height: 150)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Guidelines

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Swimming Training Principles", systemImage: "drop.fill")
                .font(.subheadline.weight(.semibold)).foregroundStyle(.cyan)
            let tips: [(String, String)] = [
                ("Progression", "1–2 sec/100m improvement per month is realistic with focused drill work."),
                ("Volume", "Build by 10–15%/week. 3–5 sessions/week is optimal for most swimmers."),
                ("Intensity", "80% aerobic (Zone 2) + 20% threshold (e.g., 4×100m at race pace)."),
                ("Recovery", "Swimming is low-impact; still allow 24–48h between hard sessions."),
            ]
            ForEach(tips, id: \.0) { title, desc in
                HStack(alignment: .top, spacing: 8) {
                    Circle().fill(Color.cyan.opacity(0.6)).frame(width: 6, height: 6).padding(.top, 5)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(title).font(.caption.weight(.semibold)).foregroundStyle(.cyan)
                        Text(desc).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.pool.swim").font(.system(size: 60)).foregroundStyle(.cyan.opacity(0.4))
            Text("Not Enough Data").font(.title3.bold())
            Text("Log at least 4 swims to see your progression.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }

    // MARK: - Helpers

    private func pace100Str(secs: Double) -> String {
        let s = Int(secs)
        return "\(s / 60):\(String(format: "%02d", s % 60))"
    }

    private func linearRegression(_ ys: [Double]) -> (slope: Double, intercept: Double) {
        let n = ys.count
        guard n >= 2 else { return (0, ys.first ?? 0) }
        let mx = Double(n - 1) / 2.0
        let my = ys.reduce(0, +) / Double(n)
        let ssxx = (0..<n).reduce(0.0) { $0 + pow(Double($1) - mx, 2) }
        let ssxy = ys.enumerated().reduce(0.0) { $0 + (Double($1.offset) - mx) * ($1.element - my) }
        let slope = ssxx > 0 ? ssxy / ssxx : 0
        return (slope, my - slope * mx)
    }

    // MARK: - Load

    private func load() async {
        defer { isLoading = false }

        let cal = Calendar.current
        let now = Date()
        let oneYearAgo = cal.date(byAdding: .year, value: -1, to: now) ?? now

        let allWorkouts = (try? await HealthKitService.shared.fetchWorkouts(from: oneYearAgo, to: now)) ?? []
        let swims = allWorkouts.filter {
            $0.workoutActivityType == .swimming && $0.duration > 180
        }.sorted { $0.startDate < $1.startDate }

        guard swims.count >= 4 else { return }

        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, count: Int, totalM: Double, paces: [Double])] = [:]
        var totalMAccum = 0.0
        var allPacePoints: [SwimPoint] = []

        for w in swims {
            let mins = w.duration / 60
            let distM = w.totalDistance?.doubleValue(for: .meter()) ?? 0
            guard distM > 200 && mins > 0 else { continue }

            totalMAccum += distM
            let minsPerKm = mins / (distM / 1000.0)
            let pace100 = (minsPerKm * 60.0) / 10.0  // secs per 100m
            guard pace100 > 50 && pace100 < 300 else { continue }

            allPacePoints.append(SwimPoint(id: w.startDate, distM: distM, pace100Secs: pace100, trend: 0))

            let monthComps = cal.dateComponents([.year, .month], from: w.startDate)
            let monthKey = String(format: "%04d-%02d", monthComps.year ?? 0, monthComps.month ?? 0)
            let label = monthFmt.string(from: w.startDate)
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0, []) }
            monthMap[monthKey]!.count += 1
            monthMap[monthKey]!.totalM += distM
            monthMap[monthKey]!.paces.append(pace100)
        }

        let paceSeries = allPacePoints.map(\.pace100Secs)
        let (slope, intercept) = linearRegression(paceSeries)
        let finalPoints: [SwimPoint] = allPacePoints.enumerated().map { i, p in
            SwimPoint(id: p.id, distM: p.distM, pace100Secs: p.pace100Secs, trend: intercept + slope * Double(i))
        }
        let overallTrend = paceSeries.count >= 2 ? slope * Double(paceSeries.count - 1) : 0

        let months: [MonthStat] = monthMap.sorted { $0.key < $1.key }.suffix(12).map { key, val in
            let avg = val.paces.isEmpty ? 0 : val.paces.reduce(0, +) / Double(val.paces.count)
            return MonthStat(id: key, label: val.label, sessions: val.count, totalM: val.totalM, avgPace100Secs: avg)
        }

        let firstCutoff = cal.date(byAdding: .day, value: 30, to: oneYearAgo) ?? oneYearAgo
        let lastCutoff = cal.date(byAdding: .day, value: -30, to: now) ?? now
        let firstPts: [SwimPoint] = finalPoints.filter { $0.id <= firstCutoff }
        let lastPts: [SwimPoint] = finalPoints.filter { $0.id >= lastCutoff }

        let fAvgPace = firstPts.isEmpty ? 0 : firstPts.map(\.pace100Secs).reduce(0, +) / Double(firstPts.count)
        let lAvgPace = lastPts.isEmpty ? 0 : lastPts.map(\.pace100Secs).reduce(0, +) / Double(lastPts.count)
        let fAvgDist = firstPts.isEmpty ? 0 : firstPts.map(\.distM).reduce(0, +) / Double(firstPts.count)
        let lAvgDist = lastPts.isEmpty ? 0 : lastPts.map(\.distM).reduce(0, +) / Double(lastPts.count)

        let total = allPacePoints.count
        let avgM = total > 0 ? totalMAccum / Double(total) : 0
        let avgPace = paceSeries.isEmpty ? 0 : paceSeries.reduce(0, +) / Double(paceSeries.count)
        let bestPace = paceSeries.min() ?? 0
        let avgPerWeekCalc = Double(total) / (365.0 / 7.0)

        await MainActor.run {
            self.swimPoints = finalPoints
            self.monthStats = months
            self.totalSwims = total
            self.totalMeters = totalMAccum
            self.avgMeters = avgM
            self.avgPerWeek = avgPerWeekCalc
            self.avgPace100Str = avgPace > 0 ? pace100Str(secs: avgPace) : ""
            self.bestPace100Str = bestPace > 0 ? pace100Str(secs: bestPace) : ""
            self.paceTrend = overallTrend
            self.firstAvgPace = fAvgPace
            self.lastAvgPace = lAvgPace
            self.firstAvgDist = fAvgDist
            self.lastAvgDist = lAvgDist
        }
    }
}

#Preview {
    NavigationStack { SwimmingProgressionView() }
}
