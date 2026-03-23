import SwiftUI
import Charts
import HealthKit

/// 12-month strength training volume progression: session duration trend,
/// monthly frequency, type mix, and quarterly breakdown.
struct StrengthProgressionView: View {

    private struct SessionPoint: Identifiable {
        let id: Date
        let mins: Double
        let trend: Double
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let totalMins: Double
        let avgMins: Double
    }

    private struct TypeBucket: Identifiable {
        let id: String
        let count: Int
    }

    private let strengthTypes: Set<HKWorkoutActivityType> = [
        .traditionalStrengthTraining,
        .functionalStrengthTraining,
        .coreTraining,
        .crossTraining,
        .flexibility,
        .mixedCardio,
    ]

    @State private var sessionPoints: [SessionPoint] = []
    @State private var monthStats: [MonthStat] = []
    @State private var typeBuckets: [TypeBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalHours: Double = 0
    @State private var avgDurationMins: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var durationTrendMins: Double = 0
    @State private var firstAvgDuration: Double = 0
    @State private var lastAvgDuration: Double = 0
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
                    if firstAvgDuration > 0 && lastAvgDuration > 0 { firstLastCard }
                    if monthStats.count >= 2 { monthlyVolumeChart }
                    if sessionPoints.count >= 4 { durationTrendChart }
                    if monthStats.count >= 2 { monthlyFrequencyChart }
                    if typeBuckets.count > 1 { typeMixSection }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Strength Progression")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Sessions (1yr)", value: "\(totalSessions)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .red)
            statCard(label: "Total Volume", value: String(format: "%.1fh", totalHours), sub: "\(Int(avgDurationMins)) min avg/session", color: .orange)
            statCard(label: "Duration Trend", value: trendStr, sub: trendSubtext, color: trendColor)
            statCard(label: "Peak Month", value: peakMonthLabel, sub: "most sessions", color: .yellow)
        }
    }

    private var trendStr: String {
        let sign = durationTrendMins > 0 ? "+" : ""
        return "\(sign)\(Int(durationTrendMins))m"
    }

    private var trendSubtext: String {
        if durationTrendMins > 2 { return "Sessions getting longer ↑" }
        if durationTrendMins < -2 { return "Sessions getting shorter ↓" }
        return "Stable session length"
    }

    private var trendColor: Color {
        if durationTrendMins > 2 { return .green }
        if durationTrendMins < -2 { return .red }
        return .secondary
    }

    private var peakMonthLabel: String {
        monthStats.max(by: { $0.sessions < $1.sessions })?.label ?? "—"
    }

    private var firstLastMessage: String {
        let diff = lastAvgDuration - firstAvgDuration
        if diff > 2 { return "Sessions are \(Int(diff))m longer — volume progression." }
        if diff < -2 { return "Sessions are \(Int(-diff))m shorter — review intensity." }
        return "Session duration is consistent year-over-year."
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
                    Text("\(Int(firstAvgDuration)) min").font(.title3.bold())
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Divider().frame(height: 40)
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Last 30 days").font(.caption).foregroundStyle(.secondary)
                    Text("\(Int(lastAvgDuration)) min").font(.title3.bold())
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
            }
            Text(firstLastMessage).font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly Volume Chart

    private var monthlyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Volume").font(.subheadline.weight(.semibold))
            Text("Total minutes per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Mins", m.totalMins))
                        .foregroundStyle(Color.red.opacity(0.8)).cornerRadius(4)
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

    // MARK: - Duration Trend Chart

    private var durationTrendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Session Duration Trend").font(.subheadline.weight(.semibold))
            Text("Each session · dashed line = trend").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(sessionPoints) { p in
                    LineMark(x: .value("Date", p.id), y: .value("Mins", p.mins))
                        .foregroundStyle(Color.red.opacity(0.5))
                        .interpolationMethod(.linear)
                    PointMark(x: .value("Date", p.id), y: .value("Mins", p.mins))
                        .foregroundStyle(Color.red.opacity(0.6))
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
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)m").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 180)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly Frequency Chart

    private var monthlyFrequencyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Frequency").font(.subheadline.weight(.semibold))
            Text("Sessions per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Sessions", m.sessions))
                        .foregroundStyle(Color.orange.opacity(0.8)).cornerRadius(4)
                        .annotation(position: .top) {
                            Text("\(m.sessions)").font(.system(size: 9)).foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Type Mix

    private var typeMixSection: some View {
        let total = typeBuckets.map(\.count).reduce(0, +)
        return VStack(alignment: .leading, spacing: 10) {
            Text("Workout Type Mix").font(.subheadline.weight(.semibold))
            ForEach(typeBuckets) { b in
                let pct = total > 0 ? Double(b.count) / Double(total) : 0
                HStack(spacing: 8) {
                    Text(b.id).font(.caption).frame(width: 160, alignment: .leading).lineLimit(1)
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color(.systemFill)).frame(height: 16)
                            RoundedRectangle(cornerRadius: 4).fill(Color.red.opacity(0.7)).frame(width: g.size.width * pct, height: 16)
                        }
                    }
                    .frame(height: 16)
                    Text("\(b.count)").font(.caption2).foregroundStyle(.secondary).frame(width: 28, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Progressive Overload Principles", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline.weight(.semibold)).foregroundStyle(.red)
            let tips: [(String, String)] = [
                ("Volume", "Increase total sets × reps × weight by 5–10%/week for continued adaptation"),
                ("Frequency", "2–4 sessions/week optimal; each muscle group needs 48–72h recovery"),
                ("Deload", "Every 4–6 weeks reduce volume by 40–50% to allow supercompensation"),
                ("Duration", "45–75 min is optimal; beyond 90 min cortisol rises, synthesis diminishes"),
            ]
            ForEach(tips, id: \.0) { title, desc in
                HStack(alignment: .top, spacing: 8) {
                    Circle().fill(Color.red.opacity(0.6)).frame(width: 6, height: 6).padding(.top, 5)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(title).font(.caption.weight(.semibold)).foregroundStyle(.red)
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
            Image(systemName: "chart.line.uptrend.xyaxis").font(.system(size: 60)).foregroundStyle(.red.opacity(0.4))
            Text("Not Enough Data").font(.title3.bold())
            Text("Log at least 4 strength sessions to see your progression.")
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
        let sessions = allWorkouts.filter {
            strengthTypes.contains($0.workoutActivityType) && $0.duration > 300
        }.sorted { $0.startDate < $1.startDate }

        guard sessions.count >= 4 else { return }

        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, count: Int, totalMins: Double)] = [:]
        var typeMap: [String: Int] = [:]
        var totalMinsAccum = 0.0

        for w in sessions {
            let mins = w.duration / 60
            totalMinsAccum += mins

            let monthComps = cal.dateComponents([.year, .month], from: w.startDate)
            let monthKey = String(format: "%04d-%02d", monthComps.year ?? 0, monthComps.month ?? 0)
            let label = monthFmt.string(from: w.startDate)
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0) }
            monthMap[monthKey]!.count += 1
            monthMap[monthKey]!.totalMins += mins

            let typeName: String
            switch w.workoutActivityType {
            case .traditionalStrengthTraining: typeName = "Strength Training"
            case .functionalStrengthTraining: typeName = "Functional Strength"
            case .coreTraining: typeName = "Core Training"
            case .crossTraining: typeName = "Cross Training"
            case .flexibility: typeName = "Flexibility"
            case .mixedCardio: typeName = "Mixed Cardio"
            default: typeName = "Other"
            }
            typeMap[typeName, default: 0] += 1
        }

        let months: [MonthStat] = monthMap.sorted { $0.key < $1.key }.suffix(12).map { key, val in
            MonthStat(id: key, label: val.label, sessions: val.count, totalMins: val.totalMins,
                      avgMins: val.count > 0 ? val.totalMins / Double(val.count) : 0)
        }

        let types: [TypeBucket] = typeMap.sorted { $0.value > $1.value }.map { TypeBucket(id: $0.key, count: $0.value) }

        // Linear regression on duration
        let durSeries = sessions.map { $0.duration / 60 }
        let (slope, intercept) = linearRegression(durSeries)
        let trendPoints: [SessionPoint] = sessions.enumerated().map { i, w in
            SessionPoint(id: w.startDate, mins: w.duration / 60, trend: intercept + slope * Double(i))
        }
        let overallTrend = durSeries.count >= 2 ? slope * Double(durSeries.count - 1) : 0

        // First vs last 30 days
        let firstCutoff = cal.date(byAdding: .day, value: 30, to: oneYearAgo) ?? oneYearAgo
        let lastCutoff = cal.date(byAdding: .day, value: -30, to: now) ?? now
        let firstSessions: [HKWorkout] = sessions.filter { $0.startDate <= firstCutoff }
        let lastSessions: [HKWorkout] = sessions.filter { $0.startDate >= lastCutoff }
        let firstAvg = firstSessions.isEmpty ? 0 : firstSessions.map { $0.duration / 60 }.reduce(0, +) / Double(firstSessions.count)
        let lastAvg = lastSessions.isEmpty ? 0 : lastSessions.map { $0.duration / 60 }.reduce(0, +) / Double(lastSessions.count)

        let total = sessions.count
        let avgMins = total > 0 ? totalMinsAccum / Double(total) : 0
        let avgPerWeekCalc = Double(total) / (365.0 / 7.0)

        await MainActor.run {
            self.sessionPoints = trendPoints
            self.monthStats = months
            self.typeBuckets = types
            self.totalSessions = total
            self.totalHours = totalMinsAccum / 60
            self.avgDurationMins = avgMins
            self.avgPerWeek = avgPerWeekCalc
            self.durationTrendMins = overallTrend
            self.firstAvgDuration = firstAvg
            self.lastAvgDuration = lastAvg
        }
    }
}

#Preview {
    NavigationStack { StrengthProgressionView() }
}
