import SwiftUI
import Charts
import HealthKit

/// 12-month cycling progression: distance trend, speed trend, monthly distance
/// and elevation, first vs last 30 days comparison, and quarterly breakdown.
struct CyclingProgressionView: View {

    private struct RidePoint: Identifiable {
        let id: Date
        let km: Double
        let speedKph: Double
        let trend: Double
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let totalKm: Double
        let avgSpeedKph: Double
        let totalElevM: Double
    }

    @State private var ridePoints: [RidePoint] = []
    @State private var monthStats: [MonthStat] = []
    @State private var totalRides: Int = 0
    @State private var totalKm: Double = 0
    @State private var totalElevM: Double = 0
    @State private var avgKmPerRide: Double = 0
    @State private var avgSpeedKph: Double = 0
    @State private var bestSpeedKph: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var speedTrend: Double = 0
    @State private var firstAvgSpeed: Double = 0
    @State private var lastAvgSpeed: Double = 0
    @State private var firstAvgDist: Double = 0
    @State private var lastAvgDist: Double = 0
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if totalRides < 4 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCards
                    if firstAvgSpeed > 0 && lastAvgSpeed > 0 { firstLastCard }
                    if monthStats.count >= 2 { monthlyDistanceChart }
                    if ridePoints.count >= 4 { speedTrendChart }
                    if monthStats.filter({ $0.avgSpeedKph > 0 }).count >= 2 { monthlySpeedChart }
                    if monthStats.filter({ $0.totalElevM > 0 }).count >= 2 { elevationChart }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Cycling Progression")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Rides (1yr)", value: "\(totalRides)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .blue)
            statCard(label: "Total Distance", value: String(format: "%.0f km", totalKm), sub: String(format: "%.1f km avg/ride", avgKmPerRide), color: .cyan)
            statCard(label: "Avg Speed", value: String(format: "%.1f km/h", avgSpeedKph), sub: String(format: "Best: %.1f km/h", bestSpeedKph), color: .teal)
            statCard(label: "Speed Trend", value: trendStr, sub: trendSubtext, color: trendColor)
        }
    }

    private var trendStr: String {
        let sign = speedTrend > 0 ? "+" : ""
        return String(format: "%@%.1f km/h", sign, speedTrend)
    }

    private var trendSubtext: String {
        if speedTrend > 0.3 { return "Getting faster ↑" }
        if speedTrend < -0.3 { return "Getting slower ↓" }
        return "Stable pace"
    }

    private var trendColor: Color {
        if speedTrend > 0.3 { return .green }
        if speedTrend < -0.3 { return .red }
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
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - First vs Last Card

    private var firstLastCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("First vs. Last 30 Days").font(.subheadline.weight(.semibold))
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("First 30 days").font(.caption).foregroundStyle(.secondary)
                    Text(String(format: "%.1f km/h", firstAvgSpeed)).font(.title3.bold())
                    Text(String(format: "%.1f km avg", firstAvgDist)).font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Divider().frame(height: 50)
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Last 30 days").font(.caption).foregroundStyle(.secondary)
                    Text(String(format: "%.1f km/h", lastAvgSpeed)).font(.title3.bold())
                    Text(String(format: "%.1f km avg", lastAvgDist)).font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
            }
            Text(firstLastMessage).font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var firstLastMessage: String {
        let diff = lastAvgSpeed - firstAvgSpeed
        if diff > 0.3 { return String(format: "%.1f km/h faster than a year ago — solid aerobic gains.", diff) }
        if diff < -0.3 { return String(format: "%.1f km/h slower — check training load and recovery.", -diff) }
        return "Speed is consistent year-over-year."
    }

    // MARK: - Monthly Distance Chart

    private var monthlyDistanceChart: some View {
        let maxKm = monthStats.map(\.totalKm).max() ?? 1
        return VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Distance").font(.subheadline.weight(.semibold))
            Text("Kilometers per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Km", m.totalKm))
                        .foregroundStyle(m.totalKm >= maxKm * 0.85 ? Color.blue : Color.blue.opacity(0.5))
                        .cornerRadius(4)
                }
            }
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text(String(format: "%.0fkm", v.as(Double.self) ?? 0)).font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 150)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Speed Trend Chart

    private var speedTrendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Speed Trend").font(.subheadline.weight(.semibold))
            Text("Each ride · dashed line = trend").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(ridePoints) { p in
                    LineMark(x: .value("Date", p.id), y: .value("Speed", p.speedKph))
                        .foregroundStyle(Color.blue.opacity(0.5))
                        .interpolationMethod(.linear)
                    PointMark(x: .value("Date", p.id), y: .value("Speed", p.speedKph))
                        .foregroundStyle(Color.blue.opacity(0.6))
                        .symbolSize(20)
                    LineMark(x: .value("Date", p.id), y: .value("Trend", p.trend))
                        .foregroundStyle(Color.yellow)
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [6, 3]))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { v in
                    if let d = v.as(Date.self) {
                        AxisValueLabel { Text(d, format: .dateTime.month(.abbreviated)).font(.system(size: 9)) }
                    }
                }
            }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text(String(format: "%.0f", v.as(Double.self) ?? 0)).font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 180)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly Speed Chart

    private var monthlySpeedChart: some View {
        let validMonths = monthStats.filter { $0.avgSpeedKph > 0 }
        return VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Avg Speed").font(.subheadline.weight(.semibold))
            Text("Average km/h per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(validMonths) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Speed", m.avgSpeedKph))
                        .foregroundStyle(Color.cyan)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Month", m.label), y: .value("Speed", m.avgSpeedKph))
                        .foregroundStyle(Color.cyan)
                        .symbolSize(30)
                }
            }
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text(String(format: "%.0f", v.as(Double.self) ?? 0)).font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 140)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Elevation Chart

    private var elevationChart: some View {
        let withElev = monthStats.filter { $0.totalElevM > 0 }
        return VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Elevation").font(.subheadline.weight(.semibold))
            Text("Total meters climbed per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(withElev) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Elev", m.totalElevM))
                        .foregroundStyle(Color.teal.opacity(0.8)).cornerRadius(4)
                }
            }
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)m").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 140)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Cycling Training Principles", systemImage: "figure.outdoor.cycle")
                .font(.subheadline.weight(.semibold)).foregroundStyle(.blue)
            let tips: [(String, String)] = [
                ("Base", "80% of rides at Zone 2 (conversational). Builds aerobic engine and fat oxidation."),
                ("Volume", "Build weekly km by no more than 10%/week to avoid overuse injury."),
                ("Speed", "Avg speed naturally improves 1–3 km/h per season with consistent Zone 2 base."),
                ("Recovery", "Include 1 easy spin day after hard efforts. Avoid back-to-back hard days."),
            ]
            ForEach(tips, id: \.0) { title, desc in
                HStack(alignment: .top, spacing: 8) {
                    Circle().fill(Color.blue.opacity(0.6)).frame(width: 6, height: 6).padding(.top, 5)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(title).font(.caption.weight(.semibold)).foregroundStyle(.blue)
                        Text(desc).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.outdoor.cycle").font(.system(size: 60)).foregroundStyle(.blue.opacity(0.4))
            Text("Not Enough Data").font(.title3.bold())
            Text("Log at least 4 rides to see your progression.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }

    // MARK: - Linear Regression

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
        let rides = allWorkouts.filter {
            $0.workoutActivityType == .cycling && $0.duration > 180
        }.sorted { $0.startDate < $1.startDate }

        guard rides.count >= 4 else { return }

        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, count: Int, totalKm: Double, totalMins: Double, speeds: [Double], totalElevM: Double)] = [:]
        var totalKmAccum = 0.0
        var totalElevAccum = 0.0

        var ridePointsAccum: [RidePoint] = []

        for w in rides {
            let mins = w.duration / 60
            let distKm = (w.totalDistance?.doubleValue(for: .meterUnit(with: .kilo)) ?? 0)
            guard distKm > 0.5 else { continue }

            let speedKph = mins > 0 ? (distKm / mins) * 60 : 0
            guard speedKph > 5 && speedKph < 80 else { continue }

            totalKmAccum += distKm

            // Elevation from flights climbed (1 flight ≈ 3m)
            let flights = w.totalFlightsClimbed?.doubleValue(for: .count()) ?? 0
            let elevM = flights * 3.0
            totalElevAccum += elevM

            let monthComps = cal.dateComponents([.year, .month], from: w.startDate)
            let monthKey = String(format: "%04d-%02d", monthComps.year ?? 0, monthComps.month ?? 0)
            let label = monthFmt.string(from: w.startDate)
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0, 0, [], 0) }
            monthMap[monthKey]!.count += 1
            monthMap[monthKey]!.totalKm += distKm
            monthMap[monthKey]!.totalMins += mins
            monthMap[monthKey]!.speeds.append(speedKph)
            monthMap[monthKey]!.totalElevM += elevM

            ridePointsAccum.append(RidePoint(id: w.startDate, km: distKm, speedKph: speedKph, trend: 0))
        }

        // Apply linear regression for trend
        let speedSeries = ridePointsAccum.map(\.speedKph)
        let (slope, intercept) = linearRegression(speedSeries)
        let finalRidePoints: [RidePoint] = ridePointsAccum.enumerated().map { i, p in
            RidePoint(id: p.id, km: p.km, speedKph: p.speedKph, trend: intercept + slope * Double(i))
        }
        let overallTrend = speedSeries.count >= 2 ? slope * Double(speedSeries.count - 1) : 0

        let months: [MonthStat] = monthMap.sorted { $0.key < $1.key }.suffix(12).map { key, val in
            let avgSpeed = val.speeds.isEmpty ? 0 : val.speeds.reduce(0, +) / Double(val.speeds.count)
            return MonthStat(id: key, label: val.label, sessions: val.count, totalKm: val.totalKm,
                             avgSpeedKph: avgSpeed, totalElevM: val.totalElevM)
        }

        // First vs last 30 days
        let firstCutoff = cal.date(byAdding: .day, value: 30, to: oneYearAgo) ?? oneYearAgo
        let lastCutoff = cal.date(byAdding: .day, value: -30, to: now) ?? now
        let firstRides: [RidePoint] = finalRidePoints.filter { $0.id <= firstCutoff }
        let lastRides: [RidePoint] = finalRidePoints.filter { $0.id >= lastCutoff }

        let fAvgSpeed = firstRides.isEmpty ? 0 : firstRides.map(\.speedKph).reduce(0, +) / Double(firstRides.count)
        let lAvgSpeed = lastRides.isEmpty ? 0 : lastRides.map(\.speedKph).reduce(0, +) / Double(lastRides.count)
        let fAvgDist = firstRides.isEmpty ? 0 : firstRides.map(\.km).reduce(0, +) / Double(firstRides.count)
        let lAvgDist = lastRides.isEmpty ? 0 : lastRides.map(\.km).reduce(0, +) / Double(lastRides.count)

        let total = finalRidePoints.count
        let avgKm = total > 0 ? totalKmAccum / Double(total) : 0
        let avgSpeed = speedSeries.isEmpty ? 0 : speedSeries.reduce(0, +) / Double(speedSeries.count)
        let bestSpeed = speedSeries.max() ?? 0
        let avgPerWeekCalc = Double(total) / (365.0 / 7.0)

        await MainActor.run {
            self.ridePoints = finalRidePoints
            self.monthStats = months
            self.totalRides = total
            self.totalKm = totalKmAccum
            self.totalElevM = totalElevAccum
            self.avgKmPerRide = avgKm
            self.avgSpeedKph = avgSpeed
            self.bestSpeedKph = bestSpeed
            self.avgPerWeek = avgPerWeekCalc
            self.speedTrend = overallTrend
            self.firstAvgSpeed = fAvgSpeed
            self.lastAvgSpeed = lAvgSpeed
            self.firstAvgDist = fAvgDist
            self.lastAvgDist = lAvgDist
        }
    }
}

#Preview {
    NavigationStack { CyclingProgressionView() }
}
