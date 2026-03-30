import SwiftUI
import Charts
import HealthKit

/// Strength-training-specific pattern analysis: day-of-week distribution,
/// time-of-day preference, weekly volume, monthly sessions, and duration trend.
struct StrengthPatternView: View {

    // MARK: - Models

    private struct DayBucket: Identifiable {
        let id: Int
        let label: String
        let sessions: Int
        let totalMins: Double
    }

    private struct WeekVolume: Identifiable {
        let id: String
        let weekStart: Date
        let mins: Double
        let sessions: Int
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let mins: Double
        let cals: Double
    }

    private struct HourBucket: Identifiable {
        let id: Int
        let count: Int
    }

    private struct DurationPoint: Identifiable {
        let id: Date
        let mins: Double
    }

    // MARK: - State

    @State private var dayBuckets: [DayBucket] = []
    @State private var weekVolumes: [WeekVolume] = []
    @State private var monthStats: [MonthStat] = []
    @State private var hourBuckets: [HourBucket] = []
    @State private var durationTrend: [DurationPoint] = []
    @State private var totalSessions: Int = 0
    @State private var totalHours: Double = 0
    @State private var avgDurationMins: Double = 0
    @State private var longestSessionMins: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var busiestDay: String = ""
    @State private var preferredTimeLabel: String = ""
    @State private var isLoading = true

    private let strengthTypes: Set<HKWorkoutActivityType> = [
        .traditionalStrengthTraining, .functionalStrengthTraining, .coreTraining,
        .crossTraining, .flexibility, .mixedCardio
    ]

    // MARK: - Body

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
                    weeklyVolumeChart
                    if monthStats.count >= 2 { monthlyChart }
                    if durationTrend.count >= 5 { durationTrendChart }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Strength Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Sessions (1yr)", value: "\(totalSessions)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .red)
            statCard(label: "Avg Duration", value: "\(Int(avgDurationMins)) min", sub: "Longest: \(Int(longestSessionMins))m", color: .orange)
            statCard(label: "Total Training", value: String(format: "%.1f h", totalHours), sub: "past year", color: .yellow)
            statCard(label: "Peak Day", value: busiestDay.isEmpty ? "—" : busiestDay, sub: "most sessions", color: .pink)
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

    // MARK: - DOW chart

    private var dowChart: some View {
        let maxSessions = dayBuckets.map(\.sessions).max() ?? 1
        return VStack(alignment: .leading, spacing: 10) {
            Text("Training Days").font(.subheadline.weight(.semibold))
            Text("Which days you lift most").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(dayBuckets) { b in
                    BarMark(x: .value("Day", b.label), y: .value("Sessions", b.sessions))
                        .foregroundStyle(b.sessions == maxSessions ? Color.red : Color.red.opacity(0.4))
                        .cornerRadius(4)
                        .annotation(position: .top, alignment: .center) {
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
            HStack(spacing: 16) {
                if !busiestDay.isEmpty {
                    Label("Peak: \(busiestDay)", systemImage: "flame.fill").font(.caption2).foregroundStyle(.red)
                }
                let restDays = dayBuckets.filter { $0.sessions == 0 }.map(\.label).joined(separator: ", ")
                if !restDays.isEmpty {
                    Label("Rest: \(restDays)", systemImage: "moon.zzz.fill").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Time of day

    private var timeOfDaySection: some View {
        let morningTotal = hourBuckets.filter { (5...11).contains($0.id) }.reduce(0) { $0 + $1.count }
        let afternoonTotal = hourBuckets.filter { (12...17).contains($0.id) }.reduce(0) { $0 + $1.count }
        let eveningTotal = hourBuckets.filter { (18...22).contains($0.id) }.reduce(0) { $0 + $1.count }
        let total = max(1, morningTotal + afternoonTotal + eveningTotal)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Time of Day").font(.subheadline.weight(.semibold))
            Text("When you prefer to train").font(.caption).foregroundStyle(.secondary)
            VStack(spacing: 8) {
                timeBar(label: "🌅 Morning (5–11am)", sessions: morningTotal, total: total, color: .yellow)
                timeBar(label: "☀️ Afternoon (12–5pm)", sessions: afternoonTotal, total: total, color: .orange)
                timeBar(label: "🌙 Evening (6–10pm)", sessions: eveningTotal, total: total, color: .indigo)
            }
            if !preferredTimeLabel.isEmpty {
                Text("You mostly train in the \(preferredTimeLabel).").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func timeBar(label: String, sessions: Int, total: Int, color: Color) -> some View {
        let pct = Double(sessions) / Double(total)
        return HStack(spacing: 8) {
            Text(label).font(.caption).frame(width: 150, alignment: .leading)
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

    // MARK: - Weekly volume chart

    private var weeklyVolumeChart: some View {
        let maxMins = weekVolumes.map(\.mins).max() ?? 1
        let avgMins = weekVolumes.isEmpty ? 0 : weekVolumes.map(\.mins).reduce(0, +) / Double(weekVolumes.count)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Weekly Volume").font(.subheadline.weight(.semibold))
            Text("Minutes per week · last 12 weeks").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(weekVolumes) { w in
                    BarMark(x: .value("Week", w.id), y: .value("Mins", w.mins))
                        .foregroundStyle(w.mins >= maxMins * 0.85 ? Color.red : Color.orange.opacity(0.55))
                        .cornerRadius(4)
                }
                if avgMins > 0 {
                    RuleMark(y: .value("Avg", avgMins))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("avg \(Int(avgMins))m").font(.system(size: 9)).foregroundStyle(.secondary)
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
            .frame(height: 150)
            HStack(spacing: 20) {
                if let best = weekVolumes.max(by: { $0.mins < $1.mins }) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Best week").font(.caption2).foregroundStyle(.secondary)
                        Text("\(Int(best.mins)) min").font(.caption.weight(.semibold)).foregroundStyle(.red)
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Avg/week").font(.caption2).foregroundStyle(.secondary)
                    Text("\(Int(avgMins)) min").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Sessions").font(.subheadline.weight(.semibold))
            Text("Sessions and volume per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Sessions", m.sessions))
                        .foregroundStyle(Color.red.opacity(0.7))
                        .cornerRadius(4)
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
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Duration trend chart

    private var durationTrendChart: some View {
        let avgDur = durationTrend.map(\.mins).reduce(0, +) / Double(durationTrend.count)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Session Duration Trend").font(.subheadline.weight(.semibold))
            Text("Are sessions getting longer or shorter?").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(durationTrend) { p in
                    LineMark(x: .value("Date", p.id), y: .value("Mins", p.mins))
                        .foregroundStyle(Color.red.opacity(0.8))
                        .lineStyle(StrokeStyle(lineWidth: 1.5))
                    PointMark(x: .value("Date", p.id), y: .value("Mins", p.mins))
                        .foregroundStyle(Color.red)
                        .symbolSize(25)
                }
                if avgDur > 0 {
                    RuleMark(y: .value("Avg", avgDur))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .foregroundStyle(.secondary.opacity(0.4))
                }
            }
            .chartXAxis(.hidden)
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)m").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 130)
            Text("Average: \(Int(avgDur)) min/session").font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Guidelines card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Strength Guidelines", systemImage: "figure.strengthtraining.traditional")
                .font(.subheadline.weight(.semibold)).foregroundStyle(.red)
            let tips: [(String, String)] = [
                ("Frequency", "2–4 sessions/week with 48h rest per muscle group"),
                ("Duration", "45–75 min is optimal; beyond 90 min reduces hormonal benefits"),
                ("Consistency", "Training the same days each week improves recovery adaptation"),
                ("Progressive overload", "Increase volume (sets × reps × weight) 5–10% per week"),
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
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.strengthtraining.traditional")
                .font(.system(size: 60)).foregroundStyle(.red.opacity(0.4))
            Text("Not Enough Data").font(.title3.bold())
            Text("Log at least 3 strength sessions to see your patterns.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }

    // MARK: - Data loading

    private func load() async {
        defer { isLoading = false }

        let cal = Calendar.current
        let now = Date()
        let oneYearAgo = cal.date(byAdding: .year, value: -1, to: now) ?? now

        let allWorkouts = (try? await HealthKitService.shared.fetchWorkouts(from: oneYearAgo, to: now)) ?? []
        let sessions = allWorkouts.filter {
            strengthTypes.contains($0.workoutActivityType) && $0.duration > 300
        }

        guard sessions.count >= 3 else { return }

        let dowLabels = [1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"]
        var dowSessions = [Int: Int]()
        var dowMins = [Int: Double]()
        var hourMap = [Int: Int]()
        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, count: Int, mins: Double, cals: Double)] = [:]
        var weekMap: [String: (mins: Double, count: Int, start: Date)] = [:]
        var durationPoints: [DurationPoint] = []
        var totalMins = 0.0
        var longestMins = 0.0
        var totalCals = 0.0

        for w in sessions {
            let mins = w.duration / 60
            totalMins += mins
            totalCals += w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            if mins > longestMins { longestMins = mins }
            durationPoints.append(DurationPoint(id: w.startDate, mins: mins))

            let comps = cal.dateComponents([.weekday], from: w.startDate)
            let wd = ((comps.weekday ?? 1) + 5) % 7 + 1
            dowSessions[wd, default: 0] += 1
            dowMins[wd, default: 0.0] += mins

            let h = cal.component(.hour, from: w.startDate)
            hourMap[h, default: 0] += 1

            let monthComps = cal.dateComponents([.year, .month], from: w.startDate)
            let monthKey = String(format: "%04d-%02d", monthComps.year ?? 0, monthComps.month ?? 0)
            let label = monthFmt.string(from: w.startDate)
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0, 0) }
            monthMap[monthKey]!.count += 1
            monthMap[monthKey]!.mins += mins
            monthMap[monthKey]!.cals += w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0

            let weekComps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.startDate)
            let weekKey = String(format: "W%02d", weekComps.weekOfYear ?? 0)
            let weekStart = cal.date(from: weekComps) ?? w.startDate
            if weekMap[weekKey] == nil { weekMap[weekKey] = (0, 0, weekStart) }
            weekMap[weekKey]!.mins += mins
            weekMap[weekKey]!.count += 1
        }

        let days: [DayBucket] = (1...7).map { i in
            DayBucket(id: i, label: dowLabels[i] ?? "?", sessions: dowSessions[i] ?? 0, totalMins: dowMins[i] ?? 0)
        }
        let hours: [HourBucket] = (0...23).map { h in HourBucket(id: h, count: hourMap[h] ?? 0) }
        let months: [MonthStat] = monthMap.sorted { $0.key < $1.key }.suffix(12).map { key, val in
            MonthStat(id: key, label: val.label, sessions: val.count, mins: val.mins, cals: val.cals)
        }
        let weeks: [WeekVolume] = weekMap.sorted { $0.value.start < $1.value.start }.suffix(12).map { k, v in
            WeekVolume(id: k, weekStart: v.start, mins: v.mins, sessions: v.count)
        }

        let total = sessions.count
        let avgMins = total > 0 ? totalMins / Double(total) : 0
        let avgPerWeekCalc = Double(total) / (365.0 / 7.0)

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
            self.durationTrend = durationPoints
            self.totalSessions = total
            self.totalHours = totalMins / 60
            self.avgDurationMins = avgMins
            self.longestSessionMins = longestMins
            self.avgPerWeek = avgPerWeekCalc
            self.busiestDay = busiestDayLabel
            self.preferredTimeLabel = timeLabel
        }
    }
}

#Preview {
    NavigationStack { StrengthPatternView() }
}
