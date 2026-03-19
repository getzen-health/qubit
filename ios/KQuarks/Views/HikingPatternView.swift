import SwiftUI
import Charts
import HealthKit

/// Hiking-specific pattern analysis: day-of-week distribution, time-of-day
/// preference, weekly km, monthly sessions, and elevation gain trend.
struct HikingPatternView: View {

    private struct DayBucket: Identifiable {
        let id: Int
        let label: String
        let sessions: Int
    }

    private struct WeekVolume: Identifiable {
        let id: String
        let weekStart: Date
        let km: Double
        let sessions: Int
    }

    private struct MonthStat: Identifiable {
        let id: String
        let label: String
        let sessions: Int
        let km: Double
        let elevationM: Double
    }

    private struct HourBucket: Identifiable {
        let id: Int
        let count: Int
    }

    @State private var dayBuckets: [DayBucket] = []
    @State private var weekVolumes: [WeekVolume] = []
    @State private var monthStats: [MonthStat] = []
    @State private var hourBuckets: [HourBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalKm: Double = 0
    @State private var avgKmPerHike: Double = 0
    @State private var avgDurationMins: Double = 0
    @State private var avgPerWeek: Double = 0
    @State private var totalElevationM: Double = 0
    @State private var longestHikeKm: Double = 0
    @State private var highestClimbM: Double = 0
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
                    weeklyKmChart
                    if monthStats.count >= 2 { monthlySessionsChart }
                    if monthStats.filter({ $0.elevationM > 0 }).count >= 2 { monthlyElevationChart }
                    guidelinesCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Hiking Patterns")
        .navigationBarTitleDisplayMode(.large)
        .task { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(label: "Hikes (1yr)", value: "\(totalSessions)", sub: String(format: "%.1f/week avg", avgPerWeek), color: .green)
            statCard(label: "Avg Distance", value: String(format: "%.1f km", avgKmPerHike), sub: "Longest: \(String(format: "%.1f", longestHikeKm)) km", color: .mint)
            statCard(label: "Total Elevation", value: "\(Int(totalElevationM)) m", sub: "Best climb: \(Int(highestClimbM))m", color: .teal)
            statCard(label: "Peak Day", value: busiestDay.isEmpty ? "—" : busiestDay, sub: "most hikes", color: .green)
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
            Text("Hiking Days").font(.subheadline.weight(.semibold))
            Text("Which days you hike").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(dayBuckets) { b in
                    BarMark(x: .value("Day", b.label), y: .value("Sessions", b.sessions))
                        .foregroundStyle(b.sessions == maxSessions ? Color.green : Color.green.opacity(0.4))
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
                Label("Peak day: \(busiestDay)", systemImage: "mountain.2.fill").font(.caption2).foregroundStyle(.green)
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
            Text("When you start hiking").font(.caption).foregroundStyle(.secondary)
            VStack(spacing: 8) {
                timeBar(label: "🌅 Morning", sessions: morningTotal, total: total, color: .green)
                timeBar(label: "☀️ Afternoon", sessions: afternoonTotal, total: total, color: .mint)
                timeBar(label: "🌙 Evening", sessions: eveningTotal, total: total, color: .teal)
            }
            if !preferredTimeLabel.isEmpty {
                Text("You mostly hike in the \(preferredTimeLabel).").font(.caption).foregroundStyle(.secondary)
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

    // MARK: - Weekly Km Chart

    private var weeklyKmChart: some View {
        let maxKm = weekVolumes.map(\.km).max() ?? 1
        let avgKm = weekVolumes.isEmpty ? 0 : weekVolumes.map(\.km).reduce(0, +) / Double(weekVolumes.count)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Weekly Distance").font(.subheadline.weight(.semibold))
            Text("Kilometers per week · last 12 weeks").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(weekVolumes) { w in
                    BarMark(x: .value("Week", w.id), y: .value("Km", w.km))
                        .foregroundStyle(w.km >= maxKm * 0.85 ? Color.green : Color.mint.opacity(0.5))
                        .cornerRadius(4)
                }
                if avgKm > 0 {
                    RuleMark(y: .value("Avg", avgKm))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                        .annotation(position: .top, alignment: .trailing) {
                            Text(String(format: "avg %.1fkm", avgKm)).font(.system(size: 9)).foregroundStyle(.secondary)
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
                    AxisValueLabel { Text(String(format: "%.0fkm", v.as(Double.self) ?? 0)).font(.caption2) }
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

    private var monthlySessionsChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Hikes").font(.subheadline.weight(.semibold))
            Text("Sessions per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Sessions", m.sessions))
                        .foregroundStyle(Color.green.opacity(0.7)).cornerRadius(4)
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

    // MARK: - Monthly Elevation Chart

    private var monthlyElevationChart: some View {
        let withElev = monthStats.filter { $0.elevationM > 0 }
        return VStack(alignment: .leading, spacing: 10) {
            Text("Monthly Elevation Gain").font(.subheadline.weight(.semibold))
            Text("Meters climbed per month").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(withElev) { m in
                    BarMark(x: .value("Month", m.label), y: .value("Elevation", m.elevationM))
                        .foregroundStyle(Color.teal.opacity(0.7)).cornerRadius(4)
                        .annotation(position: .top) {
                            if m.elevationM > 0 {
                                Text("\(Int(m.elevationM))m").font(.system(size: 9)).foregroundStyle(.secondary)
                            }
                        }
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
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Hiking Guidelines", systemImage: "mountain.2.fill")
                .font(.subheadline.weight(.semibold)).foregroundStyle(.green)
            let tips: [(String, String)] = [
                ("Frequency", "1–3 hikes/week; hiking is low-impact and recovers quickly"),
                ("Elevation", "Naismith's Rule: 1h per 5km + 1h per 600m ascent"),
                ("Hydration", "Drink 500ml/h in moderate conditions; more in heat or high elevation"),
                ("Gear", "Layer appropriately — conditions change rapidly above treeline"),
            ]
            ForEach(tips, id: \.0) { title, desc in
                HStack(alignment: .top, spacing: 8) {
                    Circle().fill(Color.green.opacity(0.6)).frame(width: 6, height: 6).padding(.top, 5)
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

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "mountain.2.fill").font(.system(size: 60)).foregroundStyle(.green.opacity(0.4))
            Text("Not Enough Data").font(.title3.bold())
            Text("Log at least 3 hikes to see your patterns.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }

    // MARK: - Load

    private func load() async {
        defer { isLoading = false }

        let cal = Calendar.current
        let now = Date()
        let oneYearAgo = cal.date(byAdding: .year, value: -1, to: now) ?? now

        let allWorkouts = (try? await HealthKitService.shared.fetchWorkouts(from: oneYearAgo, to: now)) ?? []
        let sessions = allWorkouts.filter {
            $0.workoutActivityType == .hiking && $0.duration > 300
        }

        guard sessions.count >= 3 else { return }

        let dowLabels = [1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"]
        var dowSessions = [Int: Int]()
        var hourMap = [Int: Int]()
        let monthFmt = DateFormatter()
        monthFmt.dateFormat = "MMM"
        var monthMap: [String: (label: String, count: Int, km: Double, elevM: Double)] = [:]
        var weekMap: [String: (km: Double, count: Int, start: Date)] = [:]
        var totalMins = 0.0
        var longestHikeKmVal = 0.0
        var totalKmAccum = 0.0
        var totalElevAccum = 0.0
        var highestClimb = 0.0

        for w in sessions {
            let mins = w.duration / 60
            totalMins += mins

            let distKm = (w.totalDistance?.doubleValue(for: .meterUnit(with: .kilo)) ?? 0)
            totalKmAccum += distKm
            if distKm > longestHikeKmVal { longestHikeKmVal = distKm }

            // HealthKit flightsClimbed: 1 flight ≈ 3m elevation
            let elevM = w.totalFlightsClimbed?.doubleValue(for: .count()) ?? 0
            let elevMeters = elevM * 3.0
            totalElevAccum += elevMeters
            if elevMeters > highestClimb { highestClimb = elevMeters }

            let comps = cal.dateComponents([.weekday], from: w.startDate)
            let wd = ((comps.weekday ?? 1) + 5) % 7 + 1
            dowSessions[wd, default: 0] += 1

            let h = cal.component(.hour, from: w.startDate)
            hourMap[h, default: 0] += 1

            let monthComps = cal.dateComponents([.year, .month], from: w.startDate)
            let monthKey = String(format: "%04d-%02d", monthComps.year ?? 0, monthComps.month ?? 0)
            let label = monthFmt.string(from: w.startDate)
            if monthMap[monthKey] == nil { monthMap[monthKey] = (label, 0, 0, 0) }
            monthMap[monthKey]!.count += 1
            monthMap[monthKey]!.km += distKm
            monthMap[monthKey]!.elevM += elevMeters

            let weekComps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.startDate)
            let weekKey = String(format: "W%02d", weekComps.weekOfYear ?? 0)
            let weekStart = cal.date(from: weekComps) ?? w.startDate
            if weekMap[weekKey] == nil { weekMap[weekKey] = (0, 0, weekStart) }
            weekMap[weekKey]!.km += distKm
            weekMap[weekKey]!.count += 1
        }

        let days: [DayBucket] = (1...7).map { i in
            DayBucket(id: i, label: dowLabels[i] ?? "?", sessions: dowSessions[i] ?? 0)
        }
        let hours: [HourBucket] = (0...23).map { h in HourBucket(id: h, count: hourMap[h] ?? 0) }
        let months: [MonthStat] = monthMap.sorted { $0.key < $1.key }.suffix(12).map { key, val in
            MonthStat(id: key, label: val.label, sessions: val.count, km: val.km, elevationM: val.elevM)
        }
        let weeks: [WeekVolume] = weekMap.sorted { $0.value.start < $1.value.start }.suffix(12).map { k, v in
            WeekVolume(id: k, weekStart: v.start, km: v.km, sessions: v.count)
        }

        let total = sessions.count
        let avgMins = total > 0 ? totalMins / Double(total) : 0
        let avgKm = total > 0 ? totalKmAccum / Double(total) : 0
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
            self.totalSessions = total
            self.avgDurationMins = avgMins
            self.avgPerWeek = avgPerWeekCalc
            self.totalKm = totalKmAccum
            self.avgKmPerHike = avgKm
            self.longestHikeKm = longestHikeKmVal
            self.totalElevationM = totalElevAccum
            self.highestClimbM = highestClimb
            self.busiestDay = busiestDayLabel
            self.preferredTimeLabel = timeLabel
        }
    }
}

#Preview {
    NavigationStack { HikingPatternView() }
}
