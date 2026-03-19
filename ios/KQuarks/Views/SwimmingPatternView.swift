import SwiftUI
import Charts
import HealthKit

/// Swimming-specific pattern analysis: day-of-week distribution, time-of-day
/// preference, weekly meters, monthly sessions, and pace-per-100m trend.
struct SwimmingPatternView: View {

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
        let avgPace100Secs: Double   // seconds per 100m (0 = no data)
    }

    private struct HourBucket: Identifiable {
        let id: Int
        let count: Int
    }

    private struct PacePoint: Identifiable {
        let id: Date
        let pace100Secs: Double     // seconds per 100m
    }

    @State private var dayBuckets: [DayBucket] = []
    @State private var weekVolumes: [WeekVolume] = []
    @State private var monthStats: [MonthStat] = []
    @State private var hourBuckets: [HourBucket] = []
    @State private var paceTrend: [PacePoint] = []
    @State private var totalSessions: Int = 0
    @State private var totalMeters: Double = 0
    @State private var avgMetersPerSession: Double = 0
    @State private var avgDurationMins: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var avgPace100Str: String = ""
    @State private var bestPace100Str: String = ""
    @State private var longestMeters: Double = 0
    @State private var busiestDay: String = ""
    @State private var preferredTimeLabel: String = ""
    @State private var isLoading = true

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
                    if paceTrend.count >= 3 { paceTrendChart }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Swimming Patterns")
        .navigationBarTitleDisplayMode(.large)
        .task { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Sessions (1yr)", value: "\(totalSessions)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .cyan)
            statCard(label: "Avg Distance", value: "\(Int(avgMetersPerSession)) m", sub: "Longest: \(Int(longestMeters))m", color: .teal)
            statCard(label: "Avg Pace/100m", value: avgPace100Str.isEmpty ? "—" : avgPace100Str, sub: "Best: \(bestPace100Str)", color: .blue)
            statCard(label: "Peak Day", value: busiestDay.isEmpty ? "—" : busiestDay, sub: "most sessions", color: .blue)
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
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        let maxSessions = dayBuckets.map(\.sessions).max() ?? 1
        return VStack(alignment: .leading, spacing: 10) {
            Text("Training Days").font(.subheadline.weight(.semibold))
            Text("Which days you swim").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(dayBuckets) { b in
                    BarMark(x: .value("Day", b.label), y: .value("Sessions", b.sessions))
                        .foregroundStyle(b.sessions == maxSessions ? Color.cyan : Color.cyan.opacity(0.4))
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
                Label("Peak day: \(busiestDay)", systemImage: "drop.fill").font(.caption2).foregroundStyle(.cyan)
            }
        }
        .padding()
        .background(Color(.systemBackground))
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
            Text("When you swim").font(.caption).foregroundStyle(.secondary)
            VStack(spacing: 8) {
                timeBar(label: "🌅 Morning", sessions: morningTotal, total: total, color: .cyan)
                timeBar(label: "☀️ Afternoon", sessions: afternoonTotal, total: total, color: .teal)
                timeBar(label: "🌙 Evening", sessions: eveningTotal, total: total, color: .blue)
            }
            if !preferredTimeLabel.isEmpty {
                Text("You mostly swim in the \(preferredTimeLabel).").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
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
                        .foregroundStyle(w.meters >= maxM * 0.85 ? Color.cyan : Color.teal.opacity(0.5))
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
        .background(Color(.systemBackground))
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
                        .foregroundStyle(Color.cyan.opacity(0.7)).cornerRadius(4)
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
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Pace Trend Chart (reversed Y-axis: lower = faster = better at top)

    private var paceTrendChart: some View {
        let validPaces = paceTrend.map(\.pace100Secs)
        let minPace = validPaces.min() ?? 60
        let maxPace = validPaces.max() ?? 120
        let pad = max(5.0, (maxPace - minPace) * 0.15)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Pace Trend (per 100m)").font(.subheadline.weight(.semibold))
            Text("Lower is faster · seconds per 100m").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(paceTrend) { p in
                    LineMark(x: .value("Date", p.id), y: .value("Pace", p.pace100Secs))
                        .foregroundStyle(Color.cyan)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Date", p.id), y: .value("Pace", p.pace100Secs))
                        .foregroundStyle(Color.teal)
                        .symbolSize(30)
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
            .frame(height: 160)
            Label("Reversed axis — faster swims appear higher", systemImage: "arrow.up").font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Swimming Guidelines", systemImage: "drop.fill")
                .font(.subheadline.weight(.semibold)).foregroundStyle(.cyan)
            let tips: [(String, String)] = [
                ("Frequency", "3–5 sessions/week optimal for aerobic gains"),
                ("Volume", "Beginners: 1,000–2,000m/session; intermediate: 2,000–3,500m"),
                ("Pace", "80% of training at Zone 2 (conversational effort)"),
                ("Technique", "Drill sets improve efficiency — catch + pull phase critical"),
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
            Image(systemName: "drop.fill").font(.system(size: 60)).foregroundStyle(.cyan.opacity(0.4))
            Text("Not Enough Data").font(.title3.bold())
            Text("Log at least 3 swims to see your patterns.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }

    // MARK: - Helpers

    private func pace100Str(secs: Double) -> String {
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
            $0.workoutActivityType == .swimming && $0.duration > 180
        }

        guard sessions.count >= 3 else { return }

        let dowLabels = [1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"]
        var dowSessions = [Int: Int]()
        var hourMap = [Int: Int]()
        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, count: Int, meters: Double, paces: [Double])] = [:]
        var weekMap: [String: (meters: Double, count: Int, start: Date)] = [:]
        var totalMins = 0.0
        var longestSessionMeters = 0.0
        var totalMetersAccum = 0.0
        var pacePoints: [PacePoint] = []

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
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0, []) }
            monthMap[monthKey]!.count += 1
            monthMap[monthKey]!.meters += distM

            // Pace per 100m in seconds: (mins / distKm) / 10 * 60 = mins_per_km * 6
            if distM > 200 && mins > 0 {
                let minsPerKm = mins / (distM / 1000.0)
                let secs100 = minsPerKm * 60.0 / 10.0  // secs per 100m
                if secs100 > 50 && secs100 < 300 {
                    monthMap[monthKey]!.paces.append(secs100)
                    pacePoints.append(PacePoint(id: w.startDate, pace100Secs: secs100))
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
            let avg = val.paces.isEmpty ? 0 : val.paces.reduce(0, +) / Double(val.paces.count)
            return MonthStat(id: key, label: val.label, sessions: val.count, meters: val.meters, avgPace100Secs: avg)
        }
        let weeks: [WeekVolume] = weekMap.sorted { $0.value.start < $1.value.start }.suffix(12).map { k, v in
            WeekVolume(id: k, weekStart: v.start, meters: v.meters, sessions: v.count)
        }
        let sortedPaceTrend = pacePoints.sorted { $0.id < $1.id }

        let total = sessions.count
        let avgMins = total > 0 ? totalMins / Double(total) : 0
        let avgMeters = total > 0 ? totalMetersAccum / Double(total) : 0
        let avgPerWeekCalc = Double(total) / (365.0 / 7.0)

        let allPaces = pacePoints.map(\.pace100Secs)
        let avgPace = allPaces.isEmpty ? 0 : allPaces.reduce(0, +) / Double(allPaces.count)
        let bestPace = allPaces.min() ?? 0

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
            self.paceTrend = sortedPaceTrend
            self.totalSessions = total
            self.avgDurationMins = avgMins
            self.avgPerWeek = avgPerWeekCalc
            self.totalMeters = totalMetersAccum
            self.avgMetersPerSession = avgMeters
            self.longestMeters = longestSessionMeters
            self.avgPace100Str = avgPace > 0 ? pace100Str(secs: avgPace) : ""
            self.bestPace100Str = bestPace > 0 ? pace100Str(secs: bestPace) : ""
            self.busiestDay = busiestDayLabel
            self.preferredTimeLabel = timeLabel
        }
    }
}

#Preview {
    NavigationStack { SwimmingPatternView() }
}
