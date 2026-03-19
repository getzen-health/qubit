import SwiftUI
import Charts
import HealthKit

/// Running-specific pattern analysis: day-of-week distribution, time-of-day
/// preference, weekly km volume, monthly distance, and pace trend.
struct RunningPatternView: View {

    // MARK: - Models

    private struct DayBucket: Identifiable {
        let id: Int           // 1=Mon … 7=Sun
        let label: String
        let runs: Int
        let totalKm: Double
    }

    private struct WeekVolume: Identifiable {
        let id: String        // ISO week label "Wk N"
        let weekStart: Date
        let km: Double
        let runs: Int
    }

    private struct MonthStat: Identifiable {
        let id: String        // "YYYY-MM"
        let label: String     // "Jan", "Feb", …
        let km: Double
        let runs: Int
        let avgPaceSecs: Double?  // secs/km, nil if no pace data
    }

    private struct HourBucket: Identifiable {
        let id: Int
        let sessions: Int
    }

    // MARK: - State

    @State private var dayBuckets: [DayBucket] = []
    @State private var weekVolumes: [WeekVolume] = []
    @State private var monthStats: [MonthStat] = []
    @State private var hourBuckets: [HourBucket] = []
    @State private var totalRuns: Int = 0
    @State private var totalKm: Double = 0
    @State private var avgKmPerRun: Double = 0
    @State private var avgPaceStr: String = ""
    @State private var bestPaceStr: String = ""
    @State private var longestRunKm: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var busiestDay: String = ""
    @State private var preferredTimeLabel: String = ""
    @State private var isLoading = true

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if totalRuns < 3 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCards
                    dowChart
                    timeOfDaySection
                    weeklyKmChart
                    if monthStats.count >= 2 { monthlyDistanceChart }
                    if monthStats.filter({ $0.avgPaceSecs != nil }).count >= 2 { monthlyPaceChart }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Running Patterns")
        .navigationBarTitleDisplayMode(.large)
        .task { await load() }
    }

    // MARK: - Summary cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Runs (1yr)", value: "\(totalRuns)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .green)
            statCard(label: "Total km", value: String(format: "%.1f", totalKm), sub: String(format: "%.1f km avg", avgKmPerRun), color: .mint)
            statCard(label: "Avg Pace", value: avgPaceStr.isEmpty ? "—" : avgPaceStr, sub: "min/km", color: .teal)
            statCard(label: "Longest Run", value: String(format: "%.1f km", longestRunKm), sub: bestPaceStr.isEmpty ? "" : "best \(bestPaceStr) /km", color: .cyan)
        }
    }

    private func statCard(label: String, value: String, sub: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            if !sub.isEmpty {
                Text(sub)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW chart

    private var dowChart: some View {
        let maxRuns = dayBuckets.map(\.runs).max() ?? 1
        return VStack(alignment: .leading, spacing: 10) {
            Text("Day-of-Week Distribution")
                .font(.subheadline.weight(.semibold))
            Text("Which days you run most")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(dayBuckets) { b in
                    BarMark(
                        x: .value("Day", b.label),
                        y: .value("Runs", b.runs)
                    )
                    .foregroundStyle(b.runs == maxRuns ? Color.green : Color.green.opacity(0.4))
                    .cornerRadius(4)
                    .annotation(position: .top, alignment: .center) {
                        if b.runs > 0 {
                            Text("\(b.runs)")
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
            .frame(height: 140)

            HStack(spacing: 16) {
                if !busiestDay.isEmpty {
                    Label("Favorite: \(busiestDay)", systemImage: "star.fill")
                        .font(.caption2)
                        .foregroundStyle(.green)
                }
                let restDays = dayBuckets.filter { $0.runs == 0 }.map(\.label).joined(separator: ", ")
                if !restDays.isEmpty {
                    Label("Rest days: \(restDays)", systemImage: "moon.zzz.fill")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Time of day

    private var timeOfDaySection: some View {
        let morningTotal = hourBuckets.filter { (5...11).contains($0.id) }.reduce(0) { $0 + $1.sessions }
        let afternoonTotal = hourBuckets.filter { (12...17).contains($0.id) }.reduce(0) { $0 + $1.sessions }
        let eveningTotal = hourBuckets.filter { (18...22).contains($0.id) }.reduce(0) { $0 + $1.sessions }
        let total = max(1, morningTotal + afternoonTotal + eveningTotal)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Time of Day")
                .font(.subheadline.weight(.semibold))
            Text("When you prefer to run")
                .font(.caption)
                .foregroundStyle(.secondary)

            VStack(spacing: 8) {
                timeBar(label: "🌅 Morning (5–11am)", sessions: morningTotal, total: total, color: .yellow)
                timeBar(label: "☀️ Afternoon (12–5pm)", sessions: afternoonTotal, total: total, color: .orange)
                timeBar(label: "🌙 Evening (6–10pm)", sessions: eveningTotal, total: total, color: .indigo)
            }

            if !preferredTimeLabel.isEmpty {
                Text("You mostly run in the \(preferredTimeLabel).")
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

    // MARK: - Weekly km chart

    private var weeklyKmChart: some View {
        let maxKm = weekVolumes.map(\.km).max() ?? 1
        let avgKm = weekVolumes.isEmpty ? 0 : weekVolumes.map(\.km).reduce(0, +) / Double(weekVolumes.count)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Weekly Distance")
                .font(.subheadline.weight(.semibold))
            Text("Kilometers per week · last 16 weeks")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(weekVolumes) { w in
                    BarMark(
                        x: .value("Week", w.id),
                        y: .value("km", w.km)
                    )
                    .foregroundStyle(w.km >= maxKm * 0.85 ? Color.green : Color.green.opacity(0.45))
                    .cornerRadius(4)
                }
                if avgKm > 0 {
                    RuleMark(y: .value("Avg", avgKm))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                        .annotation(position: .top, alignment: .trailing) {
                            Text(String(format: "avg %.1f km", avgKm))
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
                    AxisValueLabel { Text(String(format: "%.0f", v.as(Double.self) ?? 0)).font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 150)

            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Avg/week").font(.caption2).foregroundStyle(.secondary)
                    Text(String(format: "%.1f km", avgKm)).font(.caption.weight(.semibold)).foregroundStyle(.mint)
                }
                if let peak = weekVolumes.max(by: { $0.km < $1.km }) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Peak week").font(.caption2).foregroundStyle(.secondary)
                        Text(String(format: "%.1f km", peak.km)).font(.caption.weight(.semibold))
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly distance chart

    private var monthlyDistanceChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Distance")
                .font(.subheadline.weight(.semibold))
            Text("Kilometers logged per month")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(monthStats) { m in
                    BarMark(
                        x: .value("Month", m.label),
                        y: .value("km", m.km)
                    )
                    .foregroundStyle(Color.green.opacity(0.7))
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic) { _ in
                    AxisValueLabel().font(.caption2)
                }
            }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel { Text(String(format: "%.0f", v.as(Double.self) ?? 0)).font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly pace chart

    private var monthlyPaceChart: some View {
        let paceMonths = monthStats.filter { $0.avgPaceSecs != nil }
        let bestPace = paceMonths.map { $0.avgPaceSecs! }.min() ?? 0
        let improving = paceMonths.count >= 2 &&
            (paceMonths.last?.avgPaceSecs ?? .infinity) < (paceMonths.first?.avgPaceSecs ?? 0)

        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Monthly Avg Pace")
                        .font(.subheadline.weight(.semibold))
                    Text("Lower = faster · min/km")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text(improving ? "📉 Improving" : "📈 Check trend")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Chart {
                ForEach(paceMonths) { m in
                    LineMark(
                        x: .value("Month", m.label),
                        y: .value("Pace", m.avgPaceSecs ?? 0)
                    )
                    .foregroundStyle(Color.green)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                    PointMark(
                        x: .value("Month", m.label),
                        y: .value("Pace", m.avgPaceSecs ?? 0)
                    )
                    .foregroundStyle(Color.green)
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic) { _ in
                    AxisValueLabel().font(.caption2)
                }
            }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { v in
                    AxisValueLabel {
                        let secs = Int(v.as(Double.self) ?? 0)
                        Text("\(secs / 60):\(String(format: "%02d", secs % 60))").font(.caption2)
                    }
                    AxisGridLine()
                }
            }
            .chartYScale(range: .plotDimension(padding: 10))
            .frame(height: 150)

            if bestPace > 0 {
                let bm = Int(bestPace) / 60
                let bs = Int(bestPace) % 60
                Text("Best month avg: \(bm):\(String(format: "%02d", bs)) min/km")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Guidelines card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Running Guidelines", systemImage: "figure.run")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.green)

            let tips: [(String, String)] = [
                ("Volume increase", "Add no more than 10% per week to avoid injury"),
                ("80/20 rule", "80% easy conversational pace + 20% quality work"),
                ("Consistency", "3–5 runs/week builds aerobic base more than occasional long runs"),
                ("Pace improvement", "Expect 1–2% gain per training block with consistent load"),
            ]
            ForEach(tips, id: \.0) { title, desc in
                HStack(alignment: .top, spacing: 8) {
                    Circle()
                        .fill(Color.green.opacity(0.6))
                        .frame(width: 6, height: 6)
                        .padding(.top, 5)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(title).font(.caption.weight(.semibold)).foregroundStyle(.green)
                        Text(desc).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.run")
                .font(.system(size: 60))
                .foregroundStyle(.green.opacity(0.4))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Log at least 3 runs to see your running patterns.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
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
        let runs = allWorkouts.filter {
            $0.workoutActivityType == .running &&
            $0.duration > 180 &&
            ($0.totalDistance?.doubleValue(for: .meterUnit(with: .kilo)) ?? 0) > 0.5
        }

        guard runs.count >= 3 else { return }

        // ── DOW (1=Mon … 7=Sun) ─────────────────────────────────────────────
        let dowLabels = [1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"]
        var dowRuns = [Int: Int]()
        var dowKm = [Int: Double]()

        // ── Hour of day ──────────────────────────────────────────────────────
        var hourMap = [Int: Int]()

        // ── Monthly map ──────────────────────────────────────────────────────
        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, km: Double, count: Int, paces: [Double])] = [:]

        // ── Weekly map ───────────────────────────────────────────────────────
        var weekMap: [String: (km: Double, count: Int, start: Date)] = [:]

        var runTotalKm = 0.0
        var longestKm = 0.0
        var bestPaceSecs: Double? = nil
        var totalPaceSecs = 0.0
        var paceCount = 0

        for w in runs {
            let km = w.totalDistance?.doubleValue(for: .meterUnit(with: .kilo)) ?? 0
            let secs = w.duration
            runTotalKm += km
            if km > longestKm { longestKm = km }

            let paceSecsPerKm = km > 0.1 ? secs / km : nil
            if let p = paceSecsPerKm, p > 120, p < 900 {
                totalPaceSecs += p
                paceCount += 1
                if bestPaceSecs == nil || p < bestPaceSecs! { bestPaceSecs = p }
            }

            // DOW
            var comps = cal.dateComponents([.weekday], from: w.startDate)
            let wd = ((comps.weekday ?? 1) + 5) % 7 + 1
            dowRuns[wd, default: 0] += 1
            dowKm[wd, default: 0.0] += km

            // Hour
            let h = cal.component(.hour, from: w.startDate)
            hourMap[h, default: 0] += 1

            // Month key e.g. "2025-03"
            let monthComps = cal.dateComponents([.year, .month], from: w.startDate)
            let monthKey = String(format: "%04d-%02d", monthComps.year ?? 0, monthComps.month ?? 0)
            let label = monthFmt.string(from: w.startDate)
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0, []) }
            monthMap[monthKey]!.km += km
            monthMap[monthKey]!.count += 1
            if let p = paceSecsPerKm, p > 120, p < 900 {
                monthMap[monthKey]!.paces.append(p)
            }

            // ISO week
            let weekComps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.startDate)
            let weekKey = String(format: "W%02d", weekComps.weekOfYear ?? 0)
            let weekStart = cal.date(from: weekComps) ?? w.startDate
            if weekMap[weekKey] == nil { weekMap[weekKey] = (0, 0, weekStart) }
            weekMap[weekKey]!.km += km
            weekMap[weekKey]!.count += 1
        }

        // Build sorted arrays
        let days: [DayBucket] = (1...7).map { i in
            DayBucket(id: i, label: dowLabels[i] ?? "?", runs: dowRuns[i] ?? 0, totalKm: dowKm[i] ?? 0)
        }

        let hours: [HourBucket] = (0...23).map { h in
            HourBucket(id: h, sessions: hourMap[h] ?? 0)
        }

        let months: [MonthStat] = monthMap
            .sorted { $0.key < $1.key }
            .suffix(12)
            .map { key, val in
                let avgPace = val.paces.isEmpty ? nil : val.paces.reduce(0, +) / Double(val.paces.count)
                return MonthStat(id: key, label: val.label, km: val.km, runs: val.count, avgPaceSecs: avgPace)
            }

        let weeks: [WeekVolume] = weekMap
            .sorted { $0.value.start < $1.value.start }
            .suffix(16)
            .map { k, v in WeekVolume(id: k, weekStart: v.start, km: v.km, runs: v.count) }

        // Summary stats
        let total = runs.count
        let avgKm = total > 0 ? runTotalKm / Double(total) : 0
        let avgPerWeekCalc = Double(total) / (365.0 / 7.0)
        let avgPaceSecs = paceCount > 0 ? totalPaceSecs / Double(paceCount) : nil

        // Preferred time
        let morningS = hourMap.filter { (5...11).contains($0.key) }.values.reduce(0, +)
        let afternoonS = hourMap.filter { (12...17).contains($0.key) }.values.reduce(0, +)
        let eveningS = hourMap.filter { (18...22).contains($0.key) }.values.reduce(0, +)
        let timeLabel: String
        if morningS >= afternoonS && morningS >= eveningS { timeLabel = "morning" }
        else if afternoonS >= eveningS { timeLabel = "afternoon" }
        else { timeLabel = "evening" }

        let busiestDayLabel = days.max(by: { $0.runs < $1.runs })?.label ?? ""

        func paceStr(_ secs: Double) -> String {
            let m = Int(secs) / 60
            let s = Int(secs) % 60
            return "\(m):\(String(format: "%02d", s))"
        }

        await MainActor.run {
            self.dayBuckets = days
            self.hourBuckets = hours
            self.weekVolumes = weeks
            self.monthStats = months
            self.totalRuns = total
            self.totalKm = runTotalKm
            self.avgKmPerRun = avgKm
            self.longestRunKm = longestKm
            self.avgPerWeek = avgPerWeekCalc
            self.avgPaceStr = avgPaceSecs.map { paceStr($0) } ?? ""
            self.bestPaceStr = bestPaceSecs.map { paceStr($0) } ?? ""
            self.busiestDay = busiestDayLabel
            self.preferredTimeLabel = timeLabel
        }
    }
}

#Preview {
    NavigationStack {
        RunningPatternView()
    }
}
