import SwiftUI
import Charts
import HealthKit

/// 12-month rowing progression: distance trend, 500m split trend,
/// monthly breakdown, and first vs last 30 days comparison.
struct RowingProgressionView: View {

    private struct RowPoint: Identifiable {
        let id: Date
        let distM: Double
        let split500Secs: Double
        let trend: Double
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let totalM: Double
        let avgSplit500Secs: Double
    }

    private let rowingTypes: Set<HKWorkoutActivityType> = [.rowing, .paddleSports]

    @State private var rowPoints: [RowPoint] = []
    @State private var monthStats: [MonthStat] = []
    @State private var totalSessions: Int = 0
    @State private var totalMeters: Double = 0
    @State private var avgMeters: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var avgSplit500Str: String = ""
    @State private var bestSplit500Str: String = ""
    @State private var splitTrend: Double = 0
    @State private var firstAvgSplit: Double = 0
    @State private var lastAvgSplit: Double = 0
    @State private var firstAvgDist: Double = 0
    @State private var lastAvgDist: Double = 0
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if totalSessions < 4 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCards
                    if firstAvgSplit > 0 && lastAvgSplit > 0 { firstLastCard }
                    if monthStats.count >= 2 { monthlyDistanceChart }
                    if rowPoints.count >= 4 { splitTrendChart }
                    if monthStats.filter({ $0.avgSplit500Secs > 0 }).count >= 2 { monthlySplitChart }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Rowing Progression")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Sessions (1yr)", value: "\(totalSessions)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .pink)
            statCard(label: "Total Distance", value: String(format: "%.1f km", totalMeters / 1000), sub: "\(Int(avgMeters)) m avg/session", color: .pink)
            statCard(label: "Avg 500m Split", value: avgSplit500Str.isEmpty ? "—" : avgSplit500Str, sub: "Best: \(bestSplit500Str)", color: .purple)
            statCard(label: "Split Trend", value: trendStr, sub: trendSubtext, color: trendColor)
        }
    }

    private var trendStr: String {
        let sign = splitTrend < 0 ? "" : "+"
        return String(format: "%@%ds", sign, Int(splitTrend))
    }

    private var trendSubtext: String {
        if splitTrend < -1 { return "Getting faster ↑" }
        if splitTrend > 1 { return "Getting slower ↓" }
        return "Stable split"
    }

    private var trendColor: Color {
        if splitTrend < -1 { return .green }
        if splitTrend > 1 { return .red }
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
                    Text(splitStr(secs: firstAvgSplit)).font(.title3.bold())
                    Text("\(Int(firstAvgDist)) m avg").font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Divider().frame(height: 50)
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Last 30 days").font(.caption).foregroundStyle(.secondary)
                    Text(splitStr(secs: lastAvgSplit)).font(.title3.bold())
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
        let diff = firstAvgSplit - lastAvgSplit  // positive = got faster
        if diff > 1 { return String(format: "%.0fs/500m faster — consistent aerobic gains.", diff) }
        if diff < -1 { return String(format: "%.0fs/500m slower — review technique and recovery.", -diff) }
        return "500m split is consistent year-over-year."
    }

    // MARK: - Monthly Distance Chart

    private var monthlyDistanceChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Distance").font(.subheadline.weight(.semibold))
            Text("Total meters per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Meters", m.totalM))
                        .foregroundStyle(Color.pink.opacity(0.8)).cornerRadius(4)
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

    // MARK: - Split Trend Chart (reversed Y: lower = faster = higher on screen)

    private var splitTrendChart: some View {
        let splits = rowPoints.map(\.split500Secs)
        let minSplit = splits.min() ?? 90
        let maxSplit = splits.max() ?? 150
        let pad = max(5.0, (maxSplit - minSplit) * 0.15)

        return VStack(alignment: .leading, spacing: 10) {
            Text("500m Split Trend").font(.subheadline.weight(.semibold))
            Text("Each session · reversed axis · dashed = trend").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(rowPoints) { p in
                    LineMark(x: .value("Date", p.id), y: .value("Split", p.split500Secs))
                        .foregroundStyle(Color.pink.opacity(0.5))
                        .interpolationMethod(.linear)
                    PointMark(x: .value("Date", p.id), y: .value("Split", p.split500Secs))
                        .foregroundStyle(Color.pink.opacity(0.6))
                        .symbolSize(20)
                    LineMark(x: .value("Date", p.id), y: .value("Trend", p.trend))
                        .foregroundStyle(Color.yellow)
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [6, 3]))
                }
            }
            .chartYScale(domain: (maxSplit + pad)...(minSplit - pad))
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
                        AxisValueLabel { Text(splitStr(secs: secs)).font(.caption2) }
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

    // MARK: - Monthly Split Chart (reversed)

    private var monthlySplitChart: some View {
        let validMonths = monthStats.filter { $0.avgSplit500Secs > 0 }
        let minSplit = validMonths.map(\.avgSplit500Secs).min() ?? 90
        let maxSplit = validMonths.map(\.avgSplit500Secs).max() ?? 150
        let pad = max(3.0, (maxSplit - minSplit) * 0.15)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Avg 500m Split").font(.subheadline.weight(.semibold))
            Text("Reversed axis: faster = higher").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(validMonths) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Split", m.avgSplit500Secs))
                        .foregroundStyle(Color.purple)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Month", m.label), y: .value("Split", m.avgSplit500Secs))
                        .foregroundStyle(Color.purple)
                        .symbolSize(30)
                }
            }
            .chartYScale(domain: (maxSplit + pad)...(minSplit - pad))
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    if let secs = v.as(Double.self) {
                        AxisValueLabel { Text(splitStr(secs: secs)).font(.caption2) }
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
            Label("Rowing Training Principles", systemImage: "figure.rowing")
                .font(.subheadline.weight(.semibold)).foregroundStyle(.pink)
            let tips: [(String, String)] = [
                ("Progression", "Aim to improve 500m split by 1–2 sec/month with consistent training."),
                ("Technique", "Drive sequence: legs (60%) → back swing (20%) → arm pull (20%)."),
                ("Intensity", "80% steady-state (18–22 spm) + 20% interval work (5×2min hard/easy)."),
                ("Recovery", "Indoor rowing is low-impact; allow 48h after hard interval sessions."),
            ]
            ForEach(tips, id: \.0) { title, desc in
                HStack(alignment: .top, spacing: 8) {
                    Circle().fill(Color.pink.opacity(0.6)).frame(width: 6, height: 6).padding(.top, 5)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(title).font(.caption.weight(.semibold)).foregroundStyle(.pink)
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
            Image(systemName: "figure.rowing").font(.system(size: 60)).foregroundStyle(.pink.opacity(0.4))
            Text("Not Enough Data").font(.title3.bold())
            Text("Log at least 4 rowing sessions to see your progression.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }

    // MARK: - Helpers

    private func splitStr(secs: Double) -> String {
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
        let rows = allWorkouts.filter {
            rowingTypes.contains($0.workoutActivityType) && $0.duration > 180
        }.sorted { $0.startDate < $1.startDate }

        guard rows.count >= 4 else { return }

        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, count: Int, totalM: Double, splits: [Double])] = [:]
        var totalMAccum = 0.0
        var allRowPoints: [RowPoint] = []

        for w in rows {
            let mins = w.duration / 60
            let distM = w.totalDistance?.doubleValue(for: .meter()) ?? 0
            guard distM > 500 && mins > 0 else { continue }

            totalMAccum += distM
            let minsPerKm = mins / (distM / 1000.0)
            let split500 = (minsPerKm / 2.0) * 60.0  // secs per 500m
            guard split500 > 60 && split500 < 600 else { continue }

            allRowPoints.append(RowPoint(id: w.startDate, distM: distM, split500Secs: split500, trend: 0))

            let monthComps = cal.dateComponents([.year, .month], from: w.startDate)
            let monthKey = String(format: "%04d-%02d", monthComps.year ?? 0, monthComps.month ?? 0)
            let label = monthFmt.string(from: w.startDate)
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0, []) }
            monthMap[monthKey]!.count += 1
            monthMap[monthKey]!.totalM += distM
            monthMap[monthKey]!.splits.append(split500)
        }

        let splitSeries = allRowPoints.map(\.split500Secs)
        let (slope, intercept) = linearRegression(splitSeries)
        let finalPoints: [RowPoint] = allRowPoints.enumerated().map { i, p in
            RowPoint(id: p.id, distM: p.distM, split500Secs: p.split500Secs, trend: intercept + slope * Double(i))
        }
        let overallTrend = splitSeries.count >= 2 ? slope * Double(splitSeries.count - 1) : 0

        let months: [MonthStat] = monthMap.sorted { $0.key < $1.key }.suffix(12).map { key, val in
            let avg = val.splits.isEmpty ? 0 : val.splits.reduce(0, +) / Double(val.splits.count)
            return MonthStat(id: key, label: val.label, sessions: val.count, totalM: val.totalM, avgSplit500Secs: avg)
        }

        let firstCutoff = cal.date(byAdding: .day, value: 30, to: oneYearAgo) ?? oneYearAgo
        let lastCutoff = cal.date(byAdding: .day, value: -30, to: now) ?? now
        let firstPts: [RowPoint] = finalPoints.filter { $0.id <= firstCutoff }
        let lastPts: [RowPoint] = finalPoints.filter { $0.id >= lastCutoff }

        let fAvgSplit = firstPts.isEmpty ? 0 : firstPts.map(\.split500Secs).reduce(0, +) / Double(firstPts.count)
        let lAvgSplit = lastPts.isEmpty ? 0 : lastPts.map(\.split500Secs).reduce(0, +) / Double(lastPts.count)
        let fAvgDist = firstPts.isEmpty ? 0 : firstPts.map(\.distM).reduce(0, +) / Double(firstPts.count)
        let lAvgDist = lastPts.isEmpty ? 0 : lastPts.map(\.distM).reduce(0, +) / Double(lastPts.count)

        let total = allRowPoints.count
        let avgM = total > 0 ? totalMAccum / Double(total) : 0
        let avgSplit = splitSeries.isEmpty ? 0 : splitSeries.reduce(0, +) / Double(splitSeries.count)
        let bestSplit = splitSeries.min() ?? 0
        let avgPerWeekCalc = Double(total) / (365.0 / 7.0)

        await MainActor.run {
            self.rowPoints = finalPoints
            self.monthStats = months
            self.totalSessions = total
            self.totalMeters = totalMAccum
            self.avgMeters = avgM
            self.avgPerWeek = avgPerWeekCalc
            self.avgSplit500Str = avgSplit > 0 ? splitStr(secs: avgSplit) : ""
            self.bestSplit500Str = bestSplit > 0 ? splitStr(secs: bestSplit) : ""
            self.splitTrend = overallTrend
            self.firstAvgSplit = fAvgSplit
            self.lastAvgSplit = lAvgSplit
            self.firstAvgDist = fAvgDist
            self.lastAvgDist = lAvgDist
        }
    }
}

#Preview {
    NavigationStack { RowingProgressionView() }
}
