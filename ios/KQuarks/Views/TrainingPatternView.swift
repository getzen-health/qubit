import SwiftUI
import Charts
import HealthKit

/// Analyzes when, how often, and how hard the user trains across the week.
/// Shows day-of-week patterns, time-of-day distribution, week-over-week
/// volume, and typical "training week signature".
struct TrainingPatternView: View {

    // MARK: - Models

    private struct DayBucket: Identifiable {
        let id: Int          // 1=Mon … 7=Sun
        let label: String
        let sessions: Int
        let totalMins: Double
        let avgCals: Double
        let isRestDay: Bool  // fewer than average sessions
    }

    private struct HourBucket: Identifiable {
        let id: Int          // 0–23
        let label: String
        let sessions: Int
    }

    private struct WeekVolume: Identifiable {
        let id: String       // ISO week label "Wk 1"
        let weekStart: Date
        let totalMins: Double
        let sessions: Int
        let calories: Double
    }

    // MARK: - State

    @State private var dayBuckets: [DayBucket] = []
    @State private var hourBuckets: [HourBucket] = []
    @State private var weekVolumes: [WeekVolume] = []
    @State private var totalSessions: Int = 0
    @State private var avgSessionMins: Double = 0
    @State private var avgSessionsPerWeek: Double = 0
    @State private var preferredDayLabel: String = ""
    @State private var preferredTimeLabel: String = ""
    @State private var longestStreakDays: Int = 0
    @State private var isLoading = true

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if totalSessions < 4 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCards
                    dowChart
                    timeOfDayChart
                    weeklyVolumeChart
                    patternCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Training Patterns")
        .navigationBarTitleDisplayMode(.large)
        .task { await load() }
    }

    // MARK: - Summary cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Total Sessions", value: "\(totalSessions)", sub: "last 90 days", color: .orange)
            statCard(label: "Avg/Week", value: String(format: "%.1f", avgSessionsPerWeek), sub: "sessions", color: .blue)
            statCard(label: "Avg Duration", value: "\(Int(avgSessionMins)) min", sub: "per session", color: .green)
            if !preferredDayLabel.isEmpty {
                statCard(label: "Busiest Day", value: preferredDayLabel, sub: "most sessions", color: .purple)
            }
        }
    }

    private func statCard(label: String, value: String, sub: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Day-of-week chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Day-of-Week Distribution")
                .font(.subheadline.weight(.semibold))
            Text("Which days you train most often")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(dayBuckets) { b in
                    BarMark(
                        x: .value("Day", b.label),
                        y: .value("Sessions", b.sessions)
                    )
                    .foregroundStyle(b.sessions == dayBuckets.map(\.sessions).max() ? Color.orange : Color.orange.opacity(0.45))
                    .cornerRadius(4)
                    .annotation(position: .top, alignment: .center) {
                        if b.sessions > 0 {
                            Text("\(b.sessions)")
                                .font(.system(size: 9))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic) { _ in
                    AxisValueLabel().font(.caption2)
                }
            }
            .chartYAxis {
                AxisMarks(values: .automatic) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 150)

            // Summary
            let busiest = dayBuckets.max(by: { $0.sessions < $1.sessions })
            let quietest = dayBuckets.filter { $0.sessions > 0 }.min(by: { $0.sessions < $1.sessions })
            HStack(spacing: 16) {
                if let b = busiest, b.sessions > 0 {
                    Label("\(b.label): \(b.sessions) sessions", systemImage: "flame.fill")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                }
                if let q = quietest {
                    Label("\(q.label): fewest", systemImage: "moon.zzz.fill")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Time of day chart

    private var timeOfDayChart: some View {
        let morningTotal = hourBuckets.filter { (5...11).contains($0.id) }.reduce(0) { $0 + $1.sessions }
        let afternoonTotal = hourBuckets.filter { (12...17).contains($0.id) }.reduce(0) { $0 + $1.sessions }
        let eveningTotal = hourBuckets.filter { (18...22).contains($0.id) }.reduce(0) { $0 + $1.sessions }
        let total = max(1, morningTotal + afternoonTotal + eveningTotal)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Time of Day")
                .font(.subheadline.weight(.semibold))
            Text("When you prefer to train")
                .font(.caption)
                .foregroundStyle(.secondary)

            // Condensed: Morning / Afternoon / Evening bars
            VStack(spacing: 8) {
                timeBar(label: "🌅 Morning (5–11am)", sessions: morningTotal, total: total, color: .yellow)
                timeBar(label: "☀️ Afternoon (12–5pm)", sessions: afternoonTotal, total: total, color: .orange)
                timeBar(label: "🌙 Evening (6–10pm)", sessions: eveningTotal, total: total, color: .indigo)
            }

            // Hourly distribution sparkline
            if hourBuckets.contains(where: { $0.sessions > 0 }) {
                Divider().padding(.vertical, 4)
                Text("Hourly distribution")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Chart {
                    ForEach(hourBuckets.filter { (5...23).contains($0.id) }) { b in
                        BarMark(
                            x: .value("Hour", b.label),
                            y: .value("Sessions", b.sessions)
                        )
                        .foregroundStyle(Color.blue.opacity(0.6))
                    }
                }
                .chartXAxis {
                    AxisMarks(preset: .aligned, values: [5, 9, 12, 15, 18, 21]) { v in
                        if let h = v.as(Int.self) {
                            AxisValueLabel { Text("\(h)h").font(.system(size: 8)) }
                        }
                    }
                }
                .chartYAxis(.hidden)
                .frame(height: 60)
            }

            if !preferredTimeLabel.isEmpty {
                Text("You mostly train in the \(preferredTimeLabel).")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func timeBar(label: String, sessions: Int, total: Int, color: Color) -> some View {
        let pct = Double(sessions) / Double(total)
        return HStack(spacing: 8) {
            Text(label)
                .font(.caption)
                .frame(width: 150, alignment: .leading)
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemFill))
                        .frame(height: 18)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color.opacity(0.7))
                        .frame(width: g.size.width * pct, height: 18)
                }
            }
            .frame(height: 18)
            Text("\(sessions)")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 28, alignment: .trailing)
        }
    }

    // MARK: - Weekly volume chart

    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Weekly Training Volume")
                .font(.subheadline.weight(.semibold))
            Text("Minutes trained per week · last 12 weeks")
                .font(.caption)
                .foregroundStyle(.secondary)

            let maxMins = weekVolumes.map(\.totalMins).max() ?? 1
            let avgMins = weekVolumes.isEmpty ? 0 : weekVolumes.map(\.totalMins).reduce(0, +) / Double(weekVolumes.count)

            Chart {
                ForEach(weekVolumes) { w in
                    BarMark(
                        x: .value("Week", w.id),
                        y: .value("Minutes", w.totalMins)
                    )
                    .foregroundStyle(w.totalMins >= maxMins * 0.85 ? Color.orange : Color.blue.opacity(0.55))
                    .cornerRadius(4)
                }
                if avgMins > 0 {
                    RuleMark(y: .value("Avg", avgMins))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("avg \(Int(avgMins))m")
                                .font(.system(size: 9))
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: 2)) { v in
                    if let s = v.as(String.self) {
                        AxisValueLabel { Text(s).font(.system(size: 9)) }
                    }
                }
            }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)m").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 160)

            // Best / current week comparison
            if let best = weekVolumes.max(by: { $0.totalMins < $1.totalMins }),
               let curr = weekVolumes.last {
                HStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Best week").font(.caption2).foregroundStyle(.secondary)
                        Text("\(Int(best.totalMins)) min").font(.caption.weight(.semibold)).foregroundStyle(.orange)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("This week").font(.caption2).foregroundStyle(.secondary)
                        Text("\(Int(curr.totalMins)) min").font(.caption.weight(.semibold))
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Avg/week").font(.caption2).foregroundStyle(.secondary)
                        Text("\(Int(avgMins)) min").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Pattern insight card

    private var patternCard: some View {
        let insights = buildInsights()
        guard !insights.isEmpty else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(alignment: .leading, spacing: 10) {
                Label("Training Pattern Insights", systemImage: "lightbulb.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.yellow)
                ForEach(insights, id: \.self) { insight in
                    HStack(alignment: .top, spacing: 8) {
                        Circle()
                            .fill(Color.yellow.opacity(0.6))
                            .frame(width: 6, height: 6)
                            .padding(.top, 5)
                        Text(insight)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        )
    }

    private func buildInsights() -> [String] {
        var insights: [String] = []

        // Consistency
        let weeksWithSessions = weekVolumes.filter { $0.sessions > 0 }.count
        let consistency = weekVolumes.isEmpty ? 0 : Double(weeksWithSessions) / Double(weekVolumes.count) * 100
        if consistency >= 85 {
            insights.append("You're highly consistent — training \(Int(consistency))% of weeks. Great habit!")
        } else if consistency < 60 {
            insights.append("Your training consistency is \(Int(consistency))%. Try to build a more regular schedule.")
        }

        // Rest days
        let restDays = dayBuckets.filter { $0.sessions == 0 }
        if restDays.isEmpty {
            insights.append("You train every day of the week. Consider scheduling a dedicated rest day for recovery.")
        } else if restDays.count >= 3 {
            let names = restDays.map { $0.label }.joined(separator: ", ")
            insights.append("Your natural rest days are \(names). This allows good weekly recovery.")
        }

        // Preferred time
        if !preferredTimeLabel.isEmpty {
            let times = ["morning", "afternoon", "evening"]
            if let idx = times.firstIndex(of: preferredTimeLabel) {
                let benefits = ["morning training can improve energy and mood throughout the day",
                                "afternoon training often aligns with peak physiological performance",
                                "evening training may improve sleep quality if finished 2+ hours before bed"]
                insights.append("You prefer \(preferredTimeLabel) workouts. \(benefits[idx].capitalized).")
            }
        }

        // Volume trend
        if weekVolumes.count >= 4 {
            let last4 = weekVolumes.suffix(4).map(\.totalMins)
            let first4 = Array(weekVolumes.prefix(4).map(\.totalMins))
            let recentAvg = last4.reduce(0, +) / Double(last4.count)
            let earlierAvg = first4.reduce(0, +) / Double(first4.count)
            if recentAvg > earlierAvg * 1.2 {
                insights.append("Your weekly volume has increased by \(Int((recentAvg - earlierAvg) / earlierAvg * 100))% recently. Monitor for overtraining signs.")
            } else if recentAvg < earlierAvg * 0.7 {
                insights.append("Your recent training volume is lower than earlier — consider whether this is intentional recovery or reduced motivation.")
            }
        }

        return insights
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 60))
                .foregroundStyle(.blue.opacity(0.4))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Log at least 4 workouts to see your training patterns.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Data loading

    private func load() async {
        defer { isLoading = false }

        let now = Date()
        let cal = Calendar.current
        let ninetyDaysAgo = cal.date(byAdding: .day, value: -90, to: now) ?? now

        let workouts = (try? await HealthKitService.shared.fetchWorkouts(from: ninetyDaysAgo, to: now)) ?? []

        guard !workouts.isEmpty else { return }

        // ── Day-of-week buckets (1=Mon … 7=Sun) ──────────────────────────────
        var dowSessions = [Int: Int]()        // weekday → count
        var dowMins    = [Int: Double]()
        var dowCals    = [Int: Double]()
        let dowLabels  = [1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"]

        for w in workouts {
            var comps = cal.dateComponents([.weekday], from: w.startDate)
            // Convert from 1=Sun to 1=Mon
            let wd = ((comps.weekday ?? 1) + 5) % 7 + 1
            dowSessions[wd, default: 0] += 1
            dowMins[wd, default: 0] += w.duration / 60
            dowCals[wd, default: 0] += w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
        }
        let avgSessions = dowSessions.values.isEmpty ? 0 : dowSessions.values.reduce(0, +) / 7
        let days: [DayBucket] = (1...7).map { i in
            DayBucket(
                id: i,
                label: dowLabels[i] ?? "?",
                sessions: dowSessions[i] ?? 0,
                totalMins: dowMins[i] ?? 0,
                avgCals: dowCals[i] ?? 0,
                isRestDay: (dowSessions[i] ?? 0) < avgSessions
            )
        }

        // ── Hour-of-day buckets ────────────────────────────────────────────────
        var hourSessions = [Int: Int]()
        for w in workouts {
            let h = cal.component(.hour, from: w.startDate)
            hourSessions[h, default: 0] += 1
        }
        let hours: [HourBucket] = (0...23).map { h in
            HourBucket(id: h, label: h < 12 ? "\(h)am" : h == 12 ? "12pm" : "\(h-12)pm",
                       sessions: hourSessions[h] ?? 0)
        }

        // ── Weekly volume (last 12 ISO weeks) ─────────────────────────────────
        var weekMap: [String: (mins: Double, sessions: Int, cals: Double, start: Date)] = [:]
        for w in workouts {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.startDate)
            let label = "W\(comps.weekOfYear ?? 0)"
            let weekStart = cal.date(from: comps) ?? w.startDate
            if weekMap[label] == nil { weekMap[label] = (0, 0, 0, weekStart) }
            weekMap[label]!.mins += w.duration / 60
            weekMap[label]!.sessions += 1
            weekMap[label]!.cals += w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
        }
        let weeks: [WeekVolume] = weekMap
            .sorted { $0.value.start < $1.value.start }
            .suffix(12)
            .map { k, v in WeekVolume(id: k, weekStart: v.start, totalMins: v.mins, sessions: v.sessions, calories: v.cals) }

        // ── Summary stats ─────────────────────────────────────────────────────
        let total = workouts.count
        let avgMins = total > 0 ? workouts.map { $0.duration / 60 }.reduce(0, +) / Double(total) : 0
        let weekCount = max(1, Double(weeks.count))
        let avgPerWeek = Double(total) / (90.0 / 7.0)

        // Preferred day and time
        let busiestDay = days.max(by: { $0.sessions < $1.sessions })
        let morningS = hourSessions.filter { (5...11).contains($0.key) }.values.reduce(0, +)
        let afternoonS = hourSessions.filter { (12...17).contains($0.key) }.values.reduce(0, +)
        let eveningS = hourSessions.filter { (18...22).contains($0.key) }.values.reduce(0, +)
        let timeLabel: String
        if morningS >= afternoonS && morningS >= eveningS { timeLabel = "morning" }
        else if afternoonS >= eveningS { timeLabel = "afternoon" }
        else { timeLabel = "evening" }

        await MainActor.run {
            self.dayBuckets = days
            self.hourBuckets = hours
            self.weekVolumes = weeks
            self.totalSessions = total
            self.avgSessionMins = avgMins
            self.avgSessionsPerWeek = avgPerWeek
            self.preferredDayLabel = busiestDay?.label ?? ""
            self.preferredTimeLabel = timeLabel
        }
    }
}


#Preview {
    NavigationStack {
        TrainingPatternView()
    }
}
