import SwiftUI
import Charts
import HealthKit

/// 52-week training consistency tracker — session frequency, training days
/// per week, sport mix, and streak analysis.
struct WorkoutConsistencyView: View {

    // MARK: - Models

    private struct WeekSlot: Identifiable {
        let id: String       // ISO Monday
        let weekLabel: String
        var sessions: Int = 0
        var trainingDays: Set<String> = []
        var runSessions: Int = 0
        var cycleSessions: Int = 0
        var swimSessions: Int = 0
        var strengthSessions: Int = 0
        var hiitSessions: Int = 0
        var hikeSessions: Int = 0
        var rowSessions: Int = 0
        var otherSessions: Int = 0
        var dayCount: Int { trainingDays.count }
    }

    private struct SportCount: Identifiable {
        let id: String
        let name: String
        let color: Color
        let count: Int
    }

    // MARK: - State

    @State private var weeks: [WeekSlot] = []
    @State private var sportCounts: [SportCount] = []
    @State private var totalSessions: Int = 0
    @State private var activeWeekCount: Int = 0
    @State private var avgSessionsPerActiveWeek: Double = 0
    @State private var currentStreak: Int = 0
    @State private var longestStreak: Int = 0
    @State private var bestWeekSessions: Int = 0
    @State private var bestWeekLabel: String = "—"
    @State private var isLoading = true

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else {
                VStack(spacing: 16) {
                    summaryCards
                    streakCard
                    sessionFrequencyChart
                    trainingDaysChart
                    sportBreakdownCard
                    recentWeeksTable
                    guidelinesCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Training Consistency")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            summaryCard(label: "Total Sessions", value: "\(totalSessions)",
                        icon: "figure.run.circle", color: .teal)
            summaryCard(label: "Active Weeks",
                        value: String(format: "%d%%", activeWeekCount * 100 / max(1, weeks.count)),
                        icon: "calendar.badge.checkmark", color: .blue)
            summaryCard(label: "Avg/Active Week",
                        value: String(format: "%.1f", avgSessionsPerActiveWeek),
                        icon: "chart.bar.fill", color: .orange)
            summaryCard(label: "Best Week",
                        value: "\(bestWeekSessions) sessions",
                        icon: "trophy.fill", color: .yellow)
        }
    }

    private func summaryCard(label: String, value: String, icon: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.title3).foregroundStyle(color)
            Text(value).font(.title3.bold().monospacedDigit())
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Streak Card

    private var streakCard: some View {
        HStack(spacing: 20) {
            VStack(spacing: 4) {
                HStack(spacing: 4) {
                    if currentStreak >= 4 {
                        Image(systemName: "flame.fill").foregroundStyle(.orange)
                    }
                    Text("\(currentStreak)")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundStyle(currentStreak >= 4 ? .orange : .primary)
                }
                Text("Current streak")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("(consecutive weeks)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Divider().frame(height: 60)
            VStack(spacing: 4) {
                Text("\(longestStreak)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundStyle(.purple)
                Text("Longest streak")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("(past 52 weeks)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Session Frequency Chart

    private var sessionFrequencyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Sessions by Sport")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Target", 3))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5]))
                    .foregroundStyle(.teal.opacity(0.7))
                    .annotation(position: .topLeading) {
                        Text("3/week")
                            .font(.caption2)
                            .foregroundStyle(.teal.opacity(0.7))
                    }

                ForEach(weeks) { w in
                    if w.runSessions > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Running", w.runSessions))
                            .foregroundStyle(Color.orange)
                            .position(by: .value("Sport", "Run"))
                    }
                    if w.cycleSessions > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Cycling", w.cycleSessions))
                            .foregroundStyle(Color.blue)
                            .position(by: .value("Sport", "Ride"))
                    }
                    if w.swimSessions > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Swimming", w.swimSessions))
                            .foregroundStyle(Color.cyan)
                            .position(by: .value("Sport", "Swim"))
                    }
                    if w.strengthSessions > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Strength", w.strengthSessions))
                            .foregroundStyle(Color.red)
                            .position(by: .value("Sport", "Lift"))
                    }
                    if w.hiitSessions > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("HIIT", w.hiitSessions))
                            .foregroundStyle(Color.pink)
                            .position(by: .value("Sport", "HIIT"))
                    }
                    if w.hikeSessions > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Hiking", w.hikeSessions))
                            .foregroundStyle(Color.green)
                            .position(by: .value("Sport", "Hike"))
                    }
                    if w.rowSessions > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Rowing", w.rowSessions))
                            .foregroundStyle(Color.purple)
                            .position(by: .value("Sport", "Row"))
                    }
                    if w.otherSessions > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Other", w.otherSessions))
                            .foregroundStyle(Color.gray)
                            .position(by: .value("Sport", "Other"))
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: 1)) { val in
                    if let s = val.as(String.self), s.contains("W1") {
                        AxisValueLabel { Text(s).font(.system(size: 8)) }
                    }
                }
            }
            .frame(height: 200)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Training Days Chart

    private var trainingDaysChart: some View {
        let daysmax = weeks.map(\.dayCount).max().map { Swift.max($0, 1) } ?? 7
        return VStack(alignment: .leading, spacing: 8) {
            Text("Training Days per Week")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Target", 5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.blue.opacity(0.5))

                ForEach(weeks) { w in
                    BarMark(
                        x: .value("Week", w.weekLabel),
                        y: .value("Days", w.dayCount)
                    )
                    .foregroundStyle(dayColor(w.dayCount).opacity(0.8))
                    .cornerRadius(2)
                }
            }
            .chartYScale(domain: 0...daysmax)
            .chartXAxis {
                AxisMarks(values: .stride(by: 1)) { val in
                    if let s = val.as(String.self), s.contains("W1") {
                        AxisValueLabel { Text(s).font(.system(size: 8)) }
                    }
                }
            }
            .frame(height: 140)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            HStack(spacing: 12) {
                legendDot(color: .red, label: "1–2 days")
                legendDot(color: .orange, label: "3–4 days")
                legendDot(color: .green, label: "5+ days")
            }
            .padding(.horizontal, 4)
        }
    }

    private func dayColor(_ days: Int) -> Color {
        if days == 0 { return .gray.opacity(0.3) }
        if days <= 2 { return .red }
        if days <= 4 { return .orange }
        return .green
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Sport Breakdown

    private var sportBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Sessions by Sport (52 weeks)")
                .font(.headline)

            ForEach(sportCounts) { s in
                HStack(spacing: 8) {
                    Text(s.name)
                        .font(.caption)
                        .frame(width: 68, alignment: .leading)
                    GeometryReader { geo in
                        let pct = totalSessions > 0 ? Double(s.count) / Double(totalSessions) : 0
                        RoundedRectangle(cornerRadius: 4)
                            .fill(s.color)
                            .frame(width: max(4, geo.size.width * pct))
                    }
                    .frame(height: 16)
                    let pct = totalSessions > 0 ? Int(Double(s.count) / Double(totalSessions) * 100) : 0
                    Text("\(s.count) (\(pct)%)")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Recent Weeks Table

    private var recentWeeksTable: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Last 8 Weeks")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Week").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                    Text("Sessions").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .trailing)
                    Text("Days").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                    Text("Level").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 56, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(Array(weeks.suffix(8).reversed().enumerated()), id: \.element.id) { i, w in
                    Divider()
                    HStack {
                        Text(w.weekLabel).font(.caption).frame(maxWidth: .infinity, alignment: .leading)
                        Text(w.sessions > 0 ? "\(w.sessions)" : "—")
                            .font(.caption.monospacedDigit())
                            .frame(width: 60, alignment: .trailing)
                        Text(w.dayCount > 0 ? "\(w.dayCount)" : "—")
                            .font(.caption.monospacedDigit())
                            .frame(width: 40, alignment: .trailing)
                        consistencyBadge(days: w.dayCount)
                            .frame(width: 56, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(i % 2 == 1 ? Color(.systemFill).opacity(0.3) : .clear)
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func consistencyBadge(days: Int) -> some View {
        let (label, color): (String, Color) =
            days >= 5 ? ("High", .green) :
            days >= 3 ? ("Med", .orange) :
            days >= 1 ? ("Low", .red) :
                        ("Rest", .secondary)
        return Text(label)
            .font(.caption2.bold())
            .foregroundStyle(color)
    }

    // MARK: - Guidelines

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Consistency Insights", systemImage: "lightbulb.fill")
                .font(.headline)
                .foregroundStyle(.teal)
            Text("Research shows 3–5 training sessions per week provides optimal stimulus for adaptation. Consistency over intensity — showing up regularly builds lasting fitness more effectively than sporadic intense efforts. Aim for at least 3 active weeks per month to maintain cardiovascular adaptations. A training streak is one of the strongest predictors of long-term fitness.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.teal.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let store = HKHealthStore()
        let type  = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date())

        let allWorkouts = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        // Build 52 Monday buckets
        let cal = Calendar.current
        let now = Date()
        var monday = mondayOf(now)
        var buckets: [WeekSlot] = []
        for _ in 0..<52 {
            let d = monday
            let dayOfMonth = cal.component(.day, from: d)
            let weekOfMonth = (dayOfMonth - 1) / 7 + 1
            let monthStr = d.formatted(.dateTime.month(.abbreviated))
            let isoKey = d.ISO8601Format(.iso8601Date(timeZone: .current))
            buckets.insert(
                WeekSlot(id: isoKey, weekLabel: "\(monthStr) W\(weekOfMonth)"),
                at: 0
            )
            monday = cal.date(byAdding: .day, value: -7, to: monday) ?? Date()
        }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"

        // Accumulate
        for w in allWorkouts where w.duration > 300 {
            let wMonday = mondayOf(w.startDate)
            let key = wMonday.ISO8601Format(.iso8601Date(timeZone: .current))
            guard let idx = buckets.firstIndex(where: { $0.id == key }) else { continue }
            let dayStr = df.string(from: w.startDate)
            buckets[idx].sessions += 1
            buckets[idx].trainingDays.insert(dayStr)
            switch w.workoutActivityType {
            case .running:
                buckets[idx].runSessions += 1
            case .cycling:
                buckets[idx].cycleSessions += 1
            case .swimming:
                buckets[idx].swimSessions += 1
            case .traditionalStrengthTraining, .functionalStrengthTraining, .coreTraining, .crossTraining:
                buckets[idx].strengthSessions += 1
            case .highIntensityIntervalTraining:
                buckets[idx].hiitSessions += 1
            case .hiking:
                buckets[idx].hikeSessions += 1
            case .rowing, .paddleSports:
                buckets[idx].rowSessions += 1
            default:
                buckets[idx].otherSessions += 1
            }
        }

        weeks = buckets

        // Summary stats
        totalSessions = buckets.map(\.sessions).reduce(0, +)
        let activeSlots = buckets.filter { $0.sessions > 0 }
        activeWeekCount = activeSlots.count
        avgSessionsPerActiveWeek = activeSlots.isEmpty ? 0 : Double(totalSessions) / Double(activeSlots.count)

        // Streaks (from most recent week backwards)
        var curStreak = 0
        for slot in buckets.reversed() {
            if slot.sessions > 0 { curStreak += 1 } else { break }
        }
        currentStreak = curStreak

        var maxStreak = 0, streak = 0
        for slot in buckets {
            if slot.sessions > 0 { streak += 1; maxStreak = max(maxStreak, streak) }
            else { streak = 0 }
        }
        longestStreak = maxStreak

        // Best week
        if let peak = buckets.max(by: { $0.sessions < $1.sessions }) {
            bestWeekSessions = peak.sessions
            bestWeekLabel = peak.weekLabel
        }

        // Sport counts
        let sportMap: [(String, Int, Color)] = [
            ("Running", buckets.map(\.runSessions).reduce(0, +), .orange),
            ("Cycling", buckets.map(\.cycleSessions).reduce(0, +), .blue),
            ("Swimming", buckets.map(\.swimSessions).reduce(0, +), .cyan),
            ("Strength", buckets.map(\.strengthSessions).reduce(0, +), .red),
            ("HIIT", buckets.map(\.hiitSessions).reduce(0, +), .pink),
            ("Hiking", buckets.map(\.hikeSessions).reduce(0, +), .green),
            ("Rowing", buckets.map(\.rowSessions).reduce(0, +), .purple),
            ("Other", buckets.map(\.otherSessions).reduce(0, +), .gray),
        ]
        sportCounts = sportMap.filter { $0.1 >= 1 }
            .sorted { $0.1 > $1.1 }
            .map { SportCount(id: $0.0, name: $0.0, color: $0.2, count: $0.1) }
    }

    // MARK: - Helpers

    private func mondayOf(_ date: Date) -> Date {
        let cal = Calendar.current
        var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        comps.weekday = 2
        return cal.date(from: comps) ?? date
    }
}

#Preview {
    NavigationStack { WorkoutConsistencyView() }
}
