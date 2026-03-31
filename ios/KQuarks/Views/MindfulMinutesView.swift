import SwiftUI
import Charts
import HealthKit

// MARK: - MindfulMinutesView

/// Tracks mindful/meditation sessions logged to HealthKit via apps such as
/// Headspace, Calm, Apple Breathe, or manual entries. Shows session frequency,
/// daily streak, time-of-day pattern, and weekly trend.
struct MindfulMinutesView: View {

    // MARK: - Models

    struct MindfulSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        var hour: Int { Calendar.current.component(.hour, from: date) }
        var weekday: Int { Calendar.current.component(.weekday, from: date) }  // 1=Sun
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let sessions: Int
        let totalMins: Double
    }

    enum PracticeConsistency: String {
        case dedicated    = "Dedicated Practitioner"
        case regular      = "Regular Practice"
        case occasional   = "Occasional"
        case beginner     = "Getting Started"

        var color: Color {
            switch self {
            case .dedicated:  return .purple
            case .regular:    return .green
            case .occasional: return .orange
            case .beginner:   return .blue
            }
        }

        var icon: String {
            switch self {
            case .dedicated:  return "sparkles"
            case .regular:    return "leaf.fill"
            case .occasional: return "moon.fill"
            case .beginner:   return "star.fill"
            }
        }

        static func from(weeklyAvg: Double) -> PracticeConsistency {
            if weeklyAvg >= 5 { return .dedicated }
            if weeklyAvg >= 3 { return .regular }
            if weeklyAvg >= 1 { return .occasional }
            return .beginner
        }
    }

    // MARK: - State

    @State private var sessions: [MindfulSession] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalMins: Double = 0
    @State private var avgDuration: Double = 0
    @State private var currentStreak: Int = 0
    @State private var longestStreak: Int = 0
    @State private var weeklyAvg: Double = 0
    @State private var consistency: PracticeConsistency = .beginner
    @State private var dowCounts: [Int] = Array(repeating: 0, count: 7)  // Sun–Sat
    @State private var hourCounts: [Int] = Array(repeating: 0, count: 24)
    @State private var isLoading = true
    @State private var hasNoData = false

    private let healthStore = HKHealthStore()
    private let dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if hasNoData {
                noDataState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    weeklyChart
                    dowChart
                    timeOfDayChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Mindful Minutes")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("90-Day Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(consistency.color)
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Image(systemName: consistency.icon).foregroundStyle(consistency.color)
                        Text(consistency.rawValue).font(.subheadline.bold()).foregroundStyle(consistency.color)
                    }
                }
                Spacer()
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 44)).foregroundStyle(consistency.color)
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: consistency.color)
                Divider().frame(height: 36)
                statCell(label: "Total Hours", value: String(format: "%.1f h", totalMins / 60), color: .secondary)
                Divider().frame(height: 36)
                statCell(label: "Weekly Avg", value: String(format: "%.1f", weeklyAvg), color: .mint)
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Current Streak", value: "\(currentStreak) days", color: currentStreak >= 7 ? .green : .orange)
                Divider().frame(height: 36)
                statCell(label: "Longest Streak", value: "\(longestStreak) days", color: .purple)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Sessions")
                .font(.headline)

            Chart {
                ForEach(weekBuckets) { b in
                    BarMark(x: .value("Week", b.weekStart, unit: .weekOfYear),
                            y: .value("Sessions", b.sessions))
                    .foregroundStyle(consistency.color.opacity(0.75))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 140)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Day of Week Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Practice by Day of Week")
                .font(.headline)

            Chart {
                ForEach(0..<7, id: \.self) { i in
                    BarMark(x: .value("Day", dowLabels[i]),
                            y: .value("Sessions", dowCounts[i]))
                    .foregroundStyle(consistency.color.opacity(dowCounts[i] == dowCounts.max() ? 1.0 : 0.55))
                    .cornerRadius(4)
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 130)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Time of Day Chart

    private var timeOfDayChart: some View {
        let maxHour = hourCounts.max() ?? 1
        let bins: [(String, Int)] = [
            ("Morning\n(5–9)", (5...8).map { hourCounts[$0] }.reduce(0, +)),
            ("Mid-AM\n(9–12)", (9...11).map { hourCounts[$0] }.reduce(0, +)),
            ("Afternoon\n(12–17)", (12...16).map { hourCounts[$0] }.reduce(0, +)),
            ("Evening\n(17–21)", (17...20).map { hourCounts[$0] }.reduce(0, +)),
            ("Night\n(21–24)", (21...23).map { hourCounts[$0] }.reduce(0, +))
        ]
        let _ = maxHour  // suppress unused warning

        return VStack(alignment: .leading, spacing: 8) {
            Text("When You Meditate")
                .font(.headline)

            Chart {
                ForEach(bins, id: \.0) { bin in
                    BarMark(x: .value("Time", bin.0),
                            y: .value("Sessions", bin.1))
                    .foregroundStyle(binColor(bin.0).opacity(0.8))
                    .cornerRadius(4)
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 130)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func binColor(_ label: String) -> Color {
        if label.hasPrefix("Morning") { return .yellow }
        if label.hasPrefix("Mid-AM") { return .orange }
        if label.hasPrefix("Afternoon") { return .red }
        if label.hasPrefix("Evening") { return .indigo }
        return .purple
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Mindfulness & Health Science", systemImage: "brain.head.profile")
                .font(.headline).foregroundStyle(.purple)

            Text("Regular mindfulness meditation activates the parasympathetic nervous system, reducing cortisol and increasing HRV. This directly complements training — better recovery, lower resting HR, and improved sleep quality.")
                .font(.caption).foregroundStyle(.secondary)

            Text("A meta-analysis by Goyal et al. (2014, JAMA Internal Medicine) found mindfulness meditation produced moderate-to-strong reductions in stress, anxiety, and depression — comparable to antidepressant effect sizes.")
                .font(.caption).foregroundStyle(.secondary)

            Text("Even 10 minutes daily shows significant neuroplastic changes in 8 weeks (MBSR research). Morning practice tends to set lower cortisol peaks; evening practice improves sleep onset latency.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.purple.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - No Data State

    private var noDataState: some View {
        VStack(spacing: 16) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Mindfulness Data")
                .font(.title3.bold())
            Text("Mindfulness sessions recorded by apps like Headspace, Calm, or Apple's Mindfulness app appear here. Sessions are stored as Mindful Minutes in Apple Health.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let mindfulType = HKObjectType.categoryType(forIdentifier: .mindfulSession) else {
            hasNoData = true; return
        }
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [mindfulType])) != nil else {
            hasNoData = true; return
        }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()

        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date())
            let q = HKSampleQuery(
                sampleType: mindfulType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { hasNoData = true; return }

        sessions = samples.map { s in
            MindfulSession(id: s.uuid, date: s.startDate,
                           durationMins: s.endDate.timeIntervalSince(s.startDate) / 60)
        }

        totalSessions = sessions.count
        totalMins = sessions.map(\.durationMins).reduce(0, +)
        avgDuration = totalMins / Double(sessions.count)

        let weeksInRange = 90.0 / 7.0
        weeklyAvg = Double(totalSessions) / weeksInRange
        consistency = PracticeConsistency.from(weeklyAvg: weeklyAvg)

        // DOW + hour distributions
        for s in sessions {
            let wd = s.weekday - 1  // 0=Sun
            if wd >= 0 && wd < 7 { dowCounts[wd] += 1 }
            if s.hour >= 0 && s.hour < 24 { hourCounts[s.hour] += 1 }
        }

        // Streaks
        let cal = Calendar.current
        let uniqueDays = Set(sessions.map { cal.startOfDay(for: $0.date) })
        var streakDate = cal.startOfDay(for: Date())
        var streak = 0
        while uniqueDays.contains(streakDate) {
            streak += 1
            streakDate = cal.date(byAdding: .day, value: -1, to: streakDate) ?? Date()
        }
        currentStreak = streak

        let sorted = uniqueDays.sorted()
        var best = 0, run = 1
        for i in 1..<sorted.count {
            let diff = cal.dateComponents([.day], from: sorted[i-1], to: sorted[i]).day ?? 0
            if diff == 1 { run += 1 } else { best = max(best, run); run = 1 }
        }
        longestStreak = max(best, run)

        // Week buckets
        var cal2 = Calendar.current; cal2.firstWeekday = 2
        var bMap: [String: (Date, Int, Double)] = [:]
        for s in sessions {
            let comps = cal2.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = cal2.date(from: comps) ?? s.date
            var cur = bMap[key] ?? (ws, 0, 0)
            cur.1 += 1; cur.2 += s.durationMins
            bMap[key] = cur
        }
        weekBuckets = bMap.map { key, val in
            WeekBucket(id: key, weekStart: val.0, sessions: val.1, totalMins: val.2)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview { NavigationStack { MindfulMinutesView() } }
