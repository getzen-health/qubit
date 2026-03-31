import SwiftUI
import Charts
import HealthKit

/// Rowing-specific pattern analysis: day-of-week distribution, time-of-day
/// preference, weekly meters, monthly sessions, and 500m split trend.
struct RowingPatternView: View {

    private struct DayBucket: Identifiable {
        let id: Int
        let label: String
        let sessions: Int
    }

    private struct WeekVolume: Identifiable {
        let id: String
        let weekStart: Date
        let meters: Double
        let sessions: Int
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let meters: Double
    }

    private struct HourBucket: Identifiable {
        let id: Int
        let count: Int
    }

    private struct SplitPoint: Identifiable {
        let id: Date
        let split500Secs: Double    // seconds per 500m
    }

    @State private var dayBuckets: [DayBucket] = []
    @State private var weekVolumes: [WeekVolume] = []
    @State private var monthStats: [MonthStat] = []
    @State private var hourBuckets: [HourBucket] = []
    @State private var splitTrend: [SplitPoint] = []
    @State private var totalSessions: Int = 0
    @State private var totalMeters: Double = 0
    @State private var avgMetersPerSession: Double = 0
    @State private var avgDurationMins: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var avgSplit500Str: String = ""
    @State private var bestSplit500Str: String = ""
    @State private var longestMeters: Double = 0
    @State private var busiestDay: String = ""
    @State private var preferredTimeLabel: String = ""
    @State private var isLoading = true

    private let rowingTypes: Set<HKWorkoutActivityType> = [
        .rowing, .paddleSports
    ]

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if totalSessions < 3 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCards
                    dowChart
                    timeOfDaySection
                    weeklyMetersChart
                    if monthStats.count >= 2 { monthlyChart }
                    if splitTrend.count >= 3 { splitTrendChart }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Rowing Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Sessions (1yr)", value: "\(totalSessions)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .pink)
            statCard(label: "Avg Distance", value: "\(Int(avgMetersPerSession)) m", sub: "Longest: \(Int(longestMeters))m", color: .red)
            statCard(label: "Avg 500m Split", value: avgSplit500Str.isEmpty ? "—" : avgSplit500Str, sub: "Best: \(bestSplit500Str)", color: .purple)
            statCard(label: "Peak Day", value: busiestDay.isEmpty ? "—" : busiestDay, sub: "most sessions", color: .purple)
        }
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

    // MARK: - DOW Chart

    private var dowChart: some View {
        let maxSessions = dayBuckets.map(\.sessions).max() ?? 1
        return VStack(alignment: .leading, spacing: 10) {
            Text("Training Days").font(.subheadline.weight(.semibold))
            Text("Which days you row").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(dayBuckets) { b in
                    BarMark(x: .value("Day", b.label), y: .value("Sessions", b.sessions))
                        .foregroundStyle(b.sessions == maxSessions ? Color.pink : Color.pink.opacity(0.4))
                        .cornerRadius(4)
                        .annotation(position: .top) {
                            if b.sessions > 0 { Text("\(b.sessions)").font(.system(size: 9)).foregroundStyle(.secondary) }
                        }
                }
            }
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 140)
            if !busiestDay.isEmpty {
                Label("Peak day: \(busiestDay)", systemImage: "figure.rowing").font(.caption2).foregroundStyle(.pink)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Time of Day

    private var timeOfDaySection: some View {
        let morningTotal = hourBuckets.filter { (5...11).contains($0.id) }.reduce(0) { $0 + $1.count }
        let afternoonTotal = hourBuckets.filter { (12...17).contains($0.id) }.reduce(0) { $0 + $1.count }
        let eveningTotal = hourBuckets.filter { (18...22).contains($0.id) }.reduce(0) { $0 + $1.count }
        let total = max(1, morningTotal + afternoonTotal + eveningTotal)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Time of Day").font(.subheadline.weight(.semibold))
            Text("When you row").font(.caption).foregroundStyle(.secondary)
            VStack(spacing: 8) {
                timeBar(label: "🌅 Morning", sessions: morningTotal, total: total, color: .pink)
                timeBar(label: "☀️ Afternoon", sessions: afternoonTotal, total: total, color: .purple)
                timeBar(label: "🌙 Evening", sessions: eveningTotal, total: total, color: .purple)
            }
            if !preferredTimeLabel.isEmpty {
                Text("You mostly row in the \(preferredTimeLabel).").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func timeBar(label: String, sessions: Int, total: Int, color: Color) -> some View {
        let pct = Double(sessions) / Double(total)
        return HStack(spacing: 8) {
            Text(label).font(.caption).frame(width: 120, alignment: .leading)
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4).fill(Color(.systemFill)).frame(height: 18)
                    RoundedRectangle(cornerRadius: 4).fill(color.opacity(0.7)).frame(width: g.size.width * pct, height: 18)
                }
            }
            .frame(height: 18)
            Text("\(sessions)").font(.caption2).foregroundStyle(.secondary).frame(width: 28, alignment: .trailing)
        }
    }

    // MARK: - Weekly Meters Chart

    private var weeklyMetersChart: some View {
        let maxM = weekVolumes.map(\.meters).max() ?? 1
        let avgM = weekVolumes.isEmpty ? 0 : weekVolumes.map(\.meters).reduce(0, +) / Double(weekVolumes.count)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Weekly Distance").font(.subheadline.weight(.semibold))
            Text("Meters per week · last 12 weeks").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(weekVolumes) { w in
                    BarMark(x: .value("Week", w.id), y: .value("Meters", w.meters))
                        .foregroundStyle(w.meters >= maxM * 0.85 ? Color.pink : Color.pink.opacity(0.5))
                        .cornerRadius(4)
                }
                if avgM > 0 {
                    RuleMark(y: .value("Avg", avgM))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("avg \(Int(avgM))m").font(.system(size: 9)).foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: 2)) { v in
                    if let s = v.as(String.self) { AxisValueLabel { Text(s).font(.system(size: 9)) } }
                }
            }
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

    // MARK: - Monthly Sessions Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Sessions").font(.subheadline.weight(.semibold))
            Text("Sessions per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Sessions", m.sessions))
                        .foregroundStyle(Color.pink.opacity(0.7)).cornerRadius(4)
                }
            }
            .chartXAxis { AxisMarks(values: .automatic) { _ in AxisValueLabel().font(.caption2) } }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 130)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - 500m Split Trend Chart (reversed Y-axis: lower = faster = better at top)

    private var splitTrendChart: some View {
        let splits = splitTrend.map(\.split500Secs)
        let minSplit = splits.min() ?? 90
        let maxSplit = splits.max() ?? 150
        let pad = max(5.0, (maxSplit - minSplit) * 0.15)

        return VStack(alignment: .leading, spacing: 10) {
            Text("500m Split Trend").font(.subheadline.weight(.semibold))
            Text("Lower is faster · seconds per 500m").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(splitTrend) { p in
                    LineMark(x: .value("Date", p.id), y: .value("Split", p.split500Secs))
                        .foregroundStyle(Color.pink)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Date", p.id), y: .value("Split", p.split500Secs))
                        .foregroundStyle(Color.purple)
                        .symbolSize(30)
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
            .frame(height: 160)
            Label("Reversed axis — faster splits appear higher", systemImage: "arrow.up").font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Rowing Guidelines", systemImage: "figure.rowing")
                .font(.subheadline.weight(.semibold)).foregroundStyle(.pink)
            let tips: [(String, String)] = [
                ("Frequency", "3–5 sessions/week; indoor rowing is low-impact and recovers quickly"),
                ("Volume", "Beginners: 20–30 min/session; build to 45–60 min for aerobic base"),
                ("Split", "Aim to improve 500m split by 1–2 sec/month with consistent training"),
                ("Technique", "Drive with legs first (60%), then swing back (20%), then arm pull (20%)"),
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
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.rowing").font(.system(size: 60)).foregroundStyle(.pink.opacity(0.4))
            Text("Not Enough Data").font(.title3.bold())
            Text("Log at least 3 rowing sessions to see your patterns.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }

    // MARK: - Helpers

    private func splitStr(secs: Double) -> String {
        let totalSecs = Int(secs)
        return "\(totalSecs / 60):\(String(format: "%02d", totalSecs % 60))"
    }

    // MARK: - Load

    private func load() async {
        defer { isLoading = false }

        let cal = Calendar.current
        let now = Date()
        let oneYearAgo = cal.date(byAdding: .year, value: -1, to: now) ?? now

        let allWorkouts = (try? await HealthKitService.shared.fetchWorkouts(from: oneYearAgo, to: now)) ?? []
        let sessions = allWorkouts.filter {
            rowingTypes.contains($0.workoutActivityType) && $0.duration > 180
        }

        guard sessions.count >= 3 else { return }

        let dowLabels = [1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"]
        var dowSessions = [Int: Int]()
        var hourMap = [Int: Int]()
        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, count: Int, meters: Double)] = [:]
        var weekMap: [String: (meters: Double, count: Int, start: Date)] = [:]
        var totalMins = 0.0
        var longestSessionMeters = 0.0
        var totalMetersAccum = 0.0
        var splitPoints: [SplitPoint] = []

        for w in sessions {
            let mins = w.duration / 60
            totalMins += mins

            let distM = w.totalDistance?.doubleValue(for: .meter()) ?? 0
            totalMetersAccum += distM
            if distM > longestSessionMeters { longestSessionMeters = distM }

            let comps = cal.dateComponents([.weekday], from: w.startDate)
            let wd = ((comps.weekday ?? 1) + 5) % 7 + 1
            dowSessions[wd, default: 0] += 1

            let h = cal.component(.hour, from: w.startDate)
            hourMap[h, default: 0] += 1

            let monthComps = cal.dateComponents([.year, .month], from: w.startDate)
            let monthKey = String(format: "%04d-%02d", monthComps.year ?? 0, monthComps.month ?? 0)
            let label = monthFmt.string(from: w.startDate)
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0) }
            monthMap[monthKey]!.count += 1
            monthMap[monthKey]!.meters += distM

            // 500m split in seconds: pacePerKm (min/km) / 2 → min/500m → * 60 → secs/500m
            if distM > 500 && mins > 0 {
                let minsPerKm = mins / (distM / 1000.0)
                let split500Secs = (minsPerKm / 2.0) * 60.0
                if split500Secs > 60 && split500Secs < 600 {
                    splitPoints.append(SplitPoint(id: w.startDate, split500Secs: split500Secs))
                }
            }

            let weekComps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.startDate)
            let weekKey = String(format: "W%02d", weekComps.weekOfYear ?? 0)
            let weekStart = cal.date(from: weekComps) ?? w.startDate
            if weekMap[weekKey] == nil { weekMap[weekKey] = (0, 0, weekStart) }
            weekMap[weekKey]!.meters += distM
            weekMap[weekKey]!.count += 1
        }

        let days: [DayBucket] = (1...7).map { i in
            DayBucket(id: i, label: dowLabels[i] ?? "?", sessions: dowSessions[i] ?? 0)
        }
        let hours: [HourBucket] = (0...23).map { h in HourBucket(id: h, count: hourMap[h] ?? 0) }
        let months: [MonthStat] = monthMap.sorted { $0.key < $1.key }.suffix(12).map { key, val in
            MonthStat(id: key, label: val.label, sessions: val.count, meters: val.meters)
        }
        let weeks: [WeekVolume] = weekMap.sorted { $0.value.start < $1.value.start }.suffix(12).map { k, v in
            WeekVolume(id: k, weekStart: v.start, meters: v.meters, sessions: v.count)
        }
        let sortedSplits = splitPoints.sorted { $0.id < $1.id }

        let total = sessions.count
        let avgMins = total > 0 ? totalMins / Double(total) : 0
        let avgMeters = total > 0 ? totalMetersAccum / Double(total) : 0
        let avgPerWeekCalc = Double(total) / (365.0 / 7.0)

        let allSplits = splitPoints.map(\.split500Secs)
        let avgSplit = allSplits.isEmpty ? 0 : allSplits.reduce(0, +) / Double(allSplits.count)
        let bestSplit = allSplits.min() ?? 0

        let morningS = hourMap.filter { (5...11).contains($0.key) }.values.reduce(0, +)
        let afternoonS = hourMap.filter { (12...17).contains($0.key) }.values.reduce(0, +)
        let eveningS = hourMap.filter { (18...22).contains($0.key) }.values.reduce(0, +)
        let timeLabel: String
        if morningS >= afternoonS && morningS >= eveningS { timeLabel = "morning" }
        else if afternoonS >= eveningS { timeLabel = "afternoon" }
        else { timeLabel = "evening" }

        let busiestDayLabel = days.max(by: { $0.sessions < $1.sessions })?.label ?? ""

        await MainActor.run {
            self.dayBuckets = days
            self.hourBuckets = hours
            self.weekVolumes = weeks
            self.monthStats = months
            self.splitTrend = sortedSplits
            self.totalSessions = total
            self.avgDurationMins = avgMins
            self.avgPerWeek = avgPerWeekCalc
            self.totalMeters = totalMetersAccum
            self.avgMetersPerSession = avgMeters
            self.longestMeters = longestSessionMeters
            self.avgSplit500Str = avgSplit > 0 ? splitStr(secs: avgSplit) : ""
            self.bestSplit500Str = bestSplit > 0 ? splitStr(secs: bestSplit) : ""
            self.busiestDay = busiestDayLabel
            self.preferredTimeLabel = timeLabel
        }
    }
}

#Preview {
    NavigationStack { RowingPatternView() }
}
