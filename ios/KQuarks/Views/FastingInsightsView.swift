import SwiftUI
import Charts

// MARK: - Models

struct FastProtocolStat: Identifiable {
    let id = UUID()
    let name: String
    let count: Int
    let completed: Int
    let completionRate: Double // 0–1
    let avgHours: Double
    let pct: Double // 0–1 of total
}

struct FastDowStat: Identifiable {
    let id = UUID()
    let label: String
    let dow: Int
    let count: Int
}

struct FastMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let total: Int
    let completed: Int
    let completionRate: Double // 0–1
}

struct FastDurBucket: Identifiable {
    let id = UUID()
    let label: String
    let minH: Double
    let maxH: Double
    let count: Int
    let pct: Double
}

// MARK: - FastingInsightsView

struct FastingInsightsView: View {
    @State private var protocols: [FastProtocolStat] = []
    @State private var dowData: [FastDowStat] = []
    @State private var monthTrend: [FastMonthStat] = []
    @State private var durBuckets: [FastDurBucket] = []
    @State private var totalFasts: Int = 0
    @State private var completedFasts: Int = 0
    @State private var completionRate: Double = 0
    @State private var avgActualHours: Double = 0
    @State private var currentStreak: Int = 0
    @State private var longestStreak: Int = 0
    @State private var longestFastHours: Double = 0
    @State private var longestFastDate: Date? = nil
    @State private var isLoading = true

    private let dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    private func fmtHours(_ h: Double) -> String {
        let hrs = Int(h)
        let mins = Int((h - Double(hrs)) * 60)
        if mins == 0 { return "\(hrs)h" }
        return "\(hrs)h \(mins)m"
    }

    private func protocolColor(_ name: String) -> Color {
        switch name {
        case "16:8": return .blue
        case "18:6": return .purple
        case "20:4": return .orange
        case "OMAD": return .red
        default: return .gray
        }
    }

    private var bestDow: FastDowStat? { dowData.max(by: { $0.count < $1.count }) }
    private var maxDowCount: Int { dowData.map(\.count).max() ?? 1 }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalFasts < 3 {
                    emptyState
                } else {
                    summaryRow
                    if longestFastHours > 0 { bestFastCard }
                    protocolCard
                    if durBuckets.count > 1 { durationCard }
                    dowCard
                    if monthTrend.count >= 3 { monthTrendCard }
                    tipsCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Fasting Insights")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary

    private var summaryRow: some View {
        HStack(spacing: 10) {
            summaryBubble(title: "Total Fasts", value: "\(totalFasts)",
                          sub: "\(completedFasts) completed", color: .blue)
            summaryBubble(title: "Completion", value: "\(Int(completionRate * 100))%",
                          sub: "\(completedFasts)/\(totalFasts)",
                          color: completionRate >= 0.8 ? .green : completionRate >= 0.6 ? .orange : .red)
            summaryBubble(title: "Avg Duration", value: fmtHours(avgActualHours),
                          sub: "completed", color: .purple)
        }
    }

    private func summaryBubble(title: String, value: String, sub: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(color)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Best Fast

    private var bestFastCard: some View {
        HStack(spacing: 16) {
            Text("🏆").font(.title)
            VStack(alignment: .leading, spacing: 2) {
                Text("Personal Best Fast")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(fmtHours(longestFastHours))
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.orange)
                if let d = longestFastDate {
                    Text(d.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("Streak")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text("\(longestStreak)d")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.yellow)
                Text("Current: \(currentStreak)d")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.2), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Protocol Card

    private var protocolCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Protocol Breakdown")
                .font(.subheadline.weight(.semibold))
            Text("Which fasting windows you use most")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(protocols) { proto in
                VStack(spacing: 4) {
                    HStack {
                        Circle()
                            .fill(protocolColor(proto.name))
                            .frame(width: 10, height: 10)
                        Text(proto.name)
                            .font(.subheadline.weight(.medium))
                        Spacer()
                        Text("\(proto.count) fasts · \(Int(proto.pct * 100))%")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("\(Int(proto.completionRate * 100))% done")
                            .font(.caption)
                            .foregroundStyle(proto.completionRate >= 0.8 ? .green : proto.completionRate >= 0.6 ? .orange : .red)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color(.systemFill)).frame(height: 6)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(protocolColor(proto.name))
                                .frame(width: geo.size.width * proto.pct, height: 6)
                                .opacity(0.8)
                        }
                    }
                    .frame(height: 6)
                    if proto.avgHours > 0 {
                        Text("Avg completed: \(fmtHours(proto.avgHours))")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Duration Distribution

    private var durationCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Duration Distribution")
                .font(.subheadline.weight(.semibold))
            Text("How long your completed fasts run")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart(durBuckets) { bucket in
                BarMark(
                    x: .value("Range", bucket.label),
                    y: .value("Fasts", bucket.count)
                )
                .foregroundStyle(bucket.minH >= 16 ? Color.green : bucket.minH >= 12 ? Color.orange : Color.gray)
                .cornerRadius(4)
            }
            .frame(height: 140)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Day of Week

    private var dowCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("By Day of Week")
                .font(.subheadline.weight(.semibold))
            if let best = bestDow, best.count > 0 {
                Text("You fast most on \(best.label)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            ForEach(dowData) { stat in
                HStack(spacing: 8) {
                    Text(stat.label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color(.systemFill)).frame(height: 8)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(stat.count == maxDowCount ? Color.green : Color.blue)
                                .frame(width: geo.size.width * (maxDowCount > 0 ? Double(stat.count) / Double(maxDowCount) : 0), height: 8)
                                .opacity(0.8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(stat.count)")
                        .font(.caption)
                        .foregroundStyle(.primary)
                        .frame(width: 24, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Trend

    private var monthTrendCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Trend")
                .font(.subheadline.weight(.semibold))
            Text("Fasts completed and consistency per month")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(monthTrend) { stat in
                    BarMark(
                        x: .value("Month", stat.label),
                        y: .value("Completed", stat.completed)
                    )
                    .foregroundStyle(Color.blue.opacity(0.7))
                    .cornerRadius(3)
                }
                ForEach(monthTrend) { stat in
                    LineMark(
                        x: .value("Month", stat.label),
                        y: .value("Rate", stat.completionRate * 100)
                    )
                    .foregroundStyle(Color.green)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                    .symbol(.circle)
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            Text(v > 1 ? "\(Int(v))" : "")
                                .font(.caption2)
                        }
                    }
                    AxisGridLine()
                }
            }
            .frame(height: 150)

            HStack(spacing: 16) {
                Label("Completed fasts", systemImage: "square.fill")
                    .foregroundStyle(Color.blue.opacity(0.7))
                    .font(.caption)
                Label("Completion %", systemImage: "line.diagonal")
                    .foregroundStyle(.green)
                    .font(.caption)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Tips

    private var tipsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Fasting Tips", systemImage: "lightbulb.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.purple)

            let tips = [
                "Start your fast in the evening so overnight hours count",
                "HRV may improve 1–2 days after a successful longer fast",
                "Water, black coffee, and plain tea are fine during fasting",
                "Consistency with 16:8 daily beats occasional long fasts",
            ]
            VStack(alignment: .leading, spacing: 6) {
                ForEach(tips, id: \.self) { tip in
                    HStack(alignment: .top, spacing: 6) {
                        Text("•").foregroundStyle(.secondary)
                        Text(tip).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.purple.opacity(0.08))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.purple.opacity(0.2), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("⏳").font(.system(size: 48))
            Text("Not Enough Data")
                .font(.headline)
            Text("Complete at least 3 fasting sessions to see insights.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let userId = SupabaseService.shared.currentSession?.user.id else { return }

        let cal = Calendar.current
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.locale = Locale(identifier: "en_US_POSIX")
        let isoFull = ISO8601DateFormatter()
        isoFull.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        let oneYearAgoDate = cal.date(byAdding: .year, value: -1, to: Date()) ?? Date()

        do {
            struct SessionRow: Decodable {
                let `protocol`: String?
                let target_hours: Int
                let started_at: String
                let ended_at: String?
                let completed: Bool?
                let actual_hours: Double?
            }

            let allRows: [SessionRow] = try await SupabaseService.shared.client
                .from("fasting_sessions")
                .select("protocol, target_hours, started_at, ended_at, completed, actual_hours")
                .eq("user_id", value: userId.uuidString)
                .gte("started_at", value: isoFull.string(from: oneYearAgoDate))
                .order("started_at", ascending: true)
                .execute()
                .value

            // Only keep finished sessions (ended_at not nil)
            let rows = allRows.filter { $0.ended_at != nil }

            let completed = rows.filter { $0.completed == true }
            totalFasts = rows.count
            completedFasts = completed.count
            completionRate = totalFasts > 0 ? Double(completedFasts) / Double(totalFasts) : 0
            avgActualHours = completedFasts > 0
                ? completed.map { $0.actual_hours ?? 0 }.reduce(0, +) / Double(completedFasts)
                : 0

            // Best fast
            if let best = completed.max(by: { ($0.actual_hours ?? 0) < ($1.actual_hours ?? 0) }) {
                longestFastHours = best.actual_hours ?? 0
                longestFastDate = isoFull.date(from: best.started_at)
            }

            // Streaks
            let fastDates = Set(completed.map { String($0.started_at.prefix(10)) })
            let sortedDates = fastDates.sorted()
            var longest = 0
            var temp = 0
            for i in sortedDates.indices {
                if i == 0 { temp = 1 }
                else if let prev = df.date(from: sortedDates[i - 1]),
                        let curr = df.date(from: sortedDates[i]) {
                    let diff = cal.dateComponents([.day], from: prev, to: curr).day ?? 0
                    if diff == 1 { temp += 1 } else { temp = 1 }
                }
                longest = max(longest, temp)
            }
            longestStreak = longest

            var current = 0
            for i in 1...365 {
                guard let d = cal.date(byAdding: .day, value: -i, to: Date()) else { break }
                let ds = df.string(from: d)
                if fastDates.contains(ds) { current += 1 } else { break }
            }
            currentStreak = current

            // Protocol breakdown
            var protoCounts: [String: (total: Int, completed: Int, hours: Double)] = [:]
            for r in rows {
                let key = r.protocol ?? "16:8"
                let existing = protoCounts[key] ?? (0, 0, 0)
                let addHours = (r.completed == true) ? (r.actual_hours ?? 0) : 0
                let addCompleted = (r.completed == true) ? 1 : 0
                protoCounts[key] = (existing.total + 1, existing.completed + addCompleted, existing.hours + addHours)
            }
            protocols = protoCounts.map { key, val in
                FastProtocolStat(
                    name: key,
                    count: val.total,
                    completed: val.completed,
                    completionRate: val.total > 0 ? Double(val.completed) / Double(val.total) : 0,
                    avgHours: val.completed > 0 ? val.hours / Double(val.completed) : 0,
                    pct: totalFasts > 0 ? Double(val.total) / Double(totalFasts) : 0
                )
            }.sorted { $0.count > $1.count }

            // DOW
            var dowCounts = Array(repeating: 0, count: 7)
            for r in completed {
                if let d = isoFull.date(from: r.started_at) {
                    let dow = cal.component(.weekday, from: d) - 1
                    if dow >= 0 && dow < 7 { dowCounts[dow] += 1 }
                }
            }
            dowData = (0..<7).map { i in
                FastDowStat(label: dowLabels[i], dow: i, count: dowCounts[i])
            }

            // Monthly
            var monthBuckets: [String: (total: Int, completed: Int)] = [:]
            for r in rows {
                let key = String(r.started_at.prefix(7))
                let existing = monthBuckets[key] ?? (0, 0)
                monthBuckets[key] = (existing.total + 1, existing.completed + ((r.completed == true) ? 1 : 0))
            }
            monthTrend = monthBuckets.keys.sorted().suffix(12).compactMap { key in
                guard let val = monthBuckets[key] else { return nil }
                let parts = key.split(separator: "-")
                guard parts.count == 2, let m = Int(parts[1]), m >= 1, m <= 12 else { return nil }
                let yr = String(parts[0].suffix(2))
                return FastMonthStat(
                    label: "\(monthLabels[m - 1]) \(yr)",
                    total: val.total,
                    completed: val.completed,
                    completionRate: val.total > 0 ? Double(val.completed) / Double(val.total) : 0
                )
            }

            // Duration buckets
            let bucketDefs: [(label: String, min: Double, max: Double)] = [
                ("<12h", 0, 12), ("12–16h", 12, 16), ("16–18h", 16, 18),
                ("18–20h", 18, 20), ("20–22h", 20, 22), ("22–24h", 22, 24), ("24h+", 24, 999)
            ]
            durBuckets = bucketDefs.compactMap { bucket in
                let count = completed.filter { r in
                    let h = r.actual_hours ?? 0
                    return h >= bucket.min && h < bucket.max
                }.count
                guard count > 0 else { return nil }
                return FastDurBucket(
                    label: bucket.label, minH: bucket.min, maxH: bucket.max,
                    count: count, pct: completedFasts > 0 ? Double(count) / Double(completedFasts) * 100 : 0
                )
            }

        } catch {
            // Leave empty
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        FastingInsightsView()
    }
}
