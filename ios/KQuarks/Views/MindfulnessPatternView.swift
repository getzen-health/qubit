import SwiftUI
import Charts

// MARK: - Top-level models

struct MindfulDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgMinutes: Double?
    let totalMinutes: Double
}

struct MindfulMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let sessions: Int
    let totalMinutes: Double
    let avgMinutes: Double
}

struct MindfulDurationBucket: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let pct: Int
}

struct MindfulTimePeriod: Identifiable {
    let id = UUID()
    let label: String
    let icon: String
    let time: String
    let count: Int
    let avgMinutes: Double?
    let pct: Int
}

// MARK: - MindfulnessPatternView

struct MindfulnessPatternView: View {
    @State private var sessions: [(minutes: Double, date: Date)] = []
    @State private var isLoading = true

    private let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // MARK: - Computed

    private var n: Int { sessions.count }
    private var totalMinutes: Double { sessions.reduce(0) { $0 + $1.minutes } }
    private var avgMinutes: Double { n > 0 ? totalMinutes / Double(n) : 0 }

    private var weeksSpan: Int {
        guard n > 0 else { return 1 }
        let sorted = sessions.sorted { $0.date < $1.date }
        guard let firstItem = sorted.first, let lastItem = sorted.last else { return 1 }
        let diff = lastItem.date.timeIntervalSince(firstItem.date)
        return max(1, Int(diff / (7 * 86400)) + 1)
    }

    private var avgPerWeek: Double { Double(n) / Double(weeksSpan) }

    private var dowStats: [MindfulDowStat] {
        var buckets: [[Double]] = Array(repeating: [], count: 7)
        let cal = Calendar.current
        for s in sessions {
            let d = cal.component(.weekday, from: s.date) - 1 // 0=Sun
            buckets[d].append(s.minutes)
        }
        return dow.enumerated().map { i, label in
            let b = buckets[i]
            return MindfulDowStat(
                label: label,
                count: b.count,
                avgMinutes: b.isEmpty ? nil : b.reduce(0, +) / Double(b.count),
                totalMinutes: b.reduce(0, +)
            )
        }
    }

    private var durationDist: [MindfulDurationBucket] {
        let buckets: [(String, Double, Double)] = [
            ("< 5m", 0, 5), ("5–10m", 5, 10), ("10–20m", 10, 20),
            ("20–30m", 20, 30), ("30–60m", 30, 60), ("60m+", 60, Double.infinity),
        ]
        return buckets.compactMap { label, lo, hi in
            let count = sessions.filter { $0.minutes >= lo && $0.minutes < hi }.count
            guard count > 0 else { return nil }
            return MindfulDurationBucket(label: label, count: count, pct: Int(Double(count) / Double(n) * 100))
        }
    }

    private var monthStats: [MindfulMonthStat] {
        var buckets: [String: [Double]] = [:]
        let cal = Calendar.current
        for s in sessions {
            let comps = cal.dateComponents([.year, .month], from: s.date)
            let key = String(format: "%04d-%02d", comps.year ?? 0, comps.month ?? 0)
            buckets[key, default: []].append(s.minutes)
        }
        return buckets.sorted { $0.key < $1.key }.suffix(12).compactMap { key, mins in
            guard let monthNum = Int(key.suffix(2)) else { return nil }
            let total = mins.reduce(0, +)
            return MindfulMonthStat(
                label: months[monthNum - 1],
                sessions: mins.count,
                totalMinutes: total,
                avgMinutes: total / Double(mins.count)
            )
        }
    }

    private var timePeriods: [MindfulTimePeriod] {
        let defs: [(String, String, String, [Int])] = [
            ("Morning", "🌅", "5–12am", Array(5...11)),
            ("Afternoon", "☀️", "12–5pm", Array(12...16)),
            ("Evening", "🌆", "5–10pm", Array(17...21)),
            ("Night", "🌙", "10pm–5am", [22, 23, 0, 1, 2, 3, 4]),
        ]
        let cal = Calendar.current
        return defs.compactMap { label, icon, time, hours in
            let bucket = sessions.filter { hours.contains(cal.component(.hour, from: $0.date)) }
            guard !bucket.isEmpty else { return nil }
            let avg = bucket.reduce(0) { $0 + $1.minutes } / Double(bucket.count)
            return MindfulTimePeriod(
                label: label, icon: icon, time: time,
                count: bucket.count,
                avgMinutes: avg,
                pct: Int(Double(bucket.count) / Double(n) * 100)
            )
        }
    }

    private var currentStreak: Int {
        let dates = Set(sessions.map { Calendar.current.startOfDay(for: $0.date) }).sorted()
        guard !dates.isEmpty else { return 0 }
        let today = Calendar.current.startOfDay(for: Date())
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today) ?? Date()
        guard let last = dates.last, last == today || last == yesterday else { return 0 }
        var streak = 1
        for i in stride(from: dates.count - 2, through: 0, by: -1) {
            let diff = Calendar.current.dateComponents([.day], from: dates[i], to: dates[i + 1]).day ?? 0
            if diff == 1 { streak += 1 } else { break }
        }
        return streak
    }

    private var longestStreak: Int {
        let dates = Set(sessions.map { Calendar.current.startOfDay(for: $0.date) }).sorted()
        guard dates.count > 0 else { return 0 }
        var longest = 1, temp = 1
        for i in 1..<dates.count {
            let diff = Calendar.current.dateComponents([.day], from: dates[i - 1], to: dates[i]).day ?? 0
            if diff == 1 { temp += 1; longest = max(longest, temp) } else { temp = 1 }
        }
        return longest
    }

    private var consistencyPct: Int {
        let cal = Calendar.current
        let dates = Set(sessions.map { cal.startOfDay(for: $0.date) })
        var weekSet = Set<Date>()
        for d in dates {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d)
            if let weekStart = cal.date(from: comps) { weekSet.insert(weekStart) }
        }
        return Int(Double(weekSet.count) / Double(weeksSpan) * 100)
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryGrid
                    consistencyCard
                    if timePeriods.count >= 2 { timeOfDayCard }
                    if durationDist.count >= 2 { durationCard }
                    if dowStats.filter({ $0.count > 0 }).count >= 4 { dowSessionsChart }
                    if dowStats.filter({ $0.avgMinutes != nil }).count >= 4 { dowDurationCard }
                    if monthStats.count >= 2 { monthlyChart }
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Mindfulness Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        HStack(spacing: 0) {
            statCell(value: "\(n)", label: "Sessions", sub: String(format: "%.1f/wk", avgPerWeek))
            Divider().frame(height: 50)
            statCell(value: fmtMin(totalMinutes), label: "Total", sub: "\(fmtMin(avgMinutes)) avg")
            Divider().frame(height: 50)
            statCell(value: "\(currentStreak)", label: "Streak", sub: "Best \(longestStreak)d")
            Divider().frame(height: 50)
            statCell(value: "\(consistencyPct)%", label: "Consistent",
                     sub: "weeks with sessions",
                     color: consistencyPct >= 70 ? .green : consistencyPct >= 40 ? .yellow : .red)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statCell(value: String, label: String, sub: String, color: Color = .teal) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.secondary).opacity(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Consistency Card

    private var consistencyCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Weekly Consistency")
                    .font(.headline)
                Spacer()
                Text("\(consistencyPct)%")
                    .font(.subheadline.bold())
                    .foregroundStyle(consistencyPct >= 70 ? .green : consistencyPct >= 40 ? .yellow : .red)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6).fill(Color(.tertiarySystemFill)).frame(height: 10)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.teal.opacity(0.7))
                        .frame(width: geo.size.width * CGFloat(consistencyPct) / 100, height: 10)
                }
            }
            .frame(height: 10)
            Text("Practised in \(consistencyPct)% of weeks")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Time of Day

    private var timeOfDayCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Preferred Time of Day").font(.headline)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(timePeriods) { p in
                    VStack(spacing: 4) {
                        Text(p.icon).font(.title2)
                        Text(p.label).font(.caption.weight(.semibold))
                        Text(p.time).font(.caption2).foregroundStyle(.secondary)
                        Text("\(p.pct)%").font(.subheadline.bold()).foregroundStyle(.teal)
                        Text("\(p.count) sessions").font(.caption2).foregroundStyle(.secondary)
                        if let avg = p.avgMinutes {
                            Text(fmtMin(avg)).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(10)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Duration Distribution

    private var durationCard: some View {
        let maxCount = durationDist.map(\.count).max() ?? 1
        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Duration").font(.headline)
            ForEach(durationDist) { b in
                HStack(spacing: 8) {
                    Text(b.label).font(.caption).frame(width: 52, alignment: .trailing)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color(.tertiarySystemFill))
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.teal.opacity(0.6))
                                .frame(width: geo.size.width * CGFloat(b.count) / CGFloat(maxCount))
                        }
                    }
                    .frame(height: 20)
                    Text("\(b.pct)%").font(.caption2).frame(width: 30, alignment: .trailing)
                    Text("(\(b.count))").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Sessions Chart

    private var dowSessionsChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sessions by Day of Week").font(.headline)
            Chart(dowStats) { d in
                BarMark(x: .value("Day", d.label), y: .value("Sessions", d.count))
                    .foregroundStyle(Color.teal.opacity(0.75))
                    .cornerRadius(4)
            }
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Duration Card

    private var dowDurationCard: some View {
        let maxAvg = dowStats.compactMap(\.avgMinutes).max() ?? 1
        return VStack(alignment: .leading, spacing: 12) {
            Text("Avg Duration by Day").font(.headline)
            ForEach(dowStats) { d in
                if let avg = d.avgMinutes {
                    HStack(spacing: 8) {
                        Text(d.label).font(.caption).frame(width: 30, alignment: .trailing)
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4).fill(Color(.tertiarySystemFill))
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.teal.opacity(0.5))
                                    .frame(width: geo.size.width * CGFloat(avg) / CGFloat(maxAvg))
                            }
                        }
                        .frame(height: 18)
                        Text(fmtMin(avg)).font(.caption2).frame(width: 38, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Trend").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Sessions", m.sessions))
                        .foregroundStyle(.teal)
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                    AreaMark(x: .value("Month", m.label), y: .value("Sessions", m.sessions))
                        .foregroundStyle(.teal.opacity(0.1))
                        .interpolationMethod(.catmullRom)
                }
            }
            .frame(height: 160)
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 6)) { _ in
                    AxisValueLabel()
                    AxisGridLine()
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 48))
                .foregroundStyle(.teal.opacity(0.6))
            Text("No Mindfulness Data")
                .font(.title3.bold())
            Text("Log at least 3 sessions using the Apple Watch Mindfulness app or any meditation app that syncs with Apple Health.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        guard let userId = SupabaseService.shared.currentSession?.user.id else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let iso = ISO8601DateFormatter()

        struct Row: Decodable { let value: Double; let start_time: String }
        let rows: [Row] = (try? await SupabaseService.shared.client
            .from("health_records")
            .select("value, start_time")
            .eq("user_id", value: userId.uuidString)
            .eq("type", value: "mindfulness")
            .gte("start_time", value: iso.string(from: oneYearAgo))
            .gt("value", value: 0)
            .order("start_time", ascending: true)
            .execute()
            .value) ?? []

        sessions = rows.compactMap { row in
            guard let date = iso.date(from: row.start_time) else { return nil }
            return (minutes: row.value, date: date)
        }
    }

    // MARK: - Helpers

    private func fmtMin(_ m: Double) -> String {
        let mins = Int(m.rounded())
        if mins < 60 { return "\(mins)m" }
        let h = mins / 60
        let rem = mins % 60
        return rem > 0 ? "\(h)h \(rem)m" : "\(h)h"
    }
}

#Preview {
    NavigationStack {
        MindfulnessPatternView()
    }
}
