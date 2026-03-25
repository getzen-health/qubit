import SwiftUI
import Charts

// MARK: - Top-level models

struct DaylightDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgMinutes: Double?
    let goalPct: Int?
}

struct DaylightMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avgMinutes: Double
    let goalPct: Int
    let count: Int
}

struct DaylightZoneStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let pct: Int
    let color: Color
}

// MARK: - DaylightPatternView

struct DaylightPatternView: View {
    @State private var readings: [(date: Date, minutes: Double)] = []
    @State private var isLoading = true

    private let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    private let goalMinutes: Double = 20

    // MARK: - Computed

    private var n: Int { readings.count }
    private var avgMinutes: Double { n > 0 ? readings.reduce(0) { $0 + $1.minutes } / Double(n) : 0 }
    private var goalHitDays: Int { readings.filter { $0.minutes >= goalMinutes }.count }
    private var goalHitPct: Int { n > 0 ? Int(Double(goalHitDays) / Double(n) * 100) : 0 }

    private var currentStreak: Int {
        var streak = 0
        for r in readings.reversed() {
            if r.minutes >= goalMinutes { streak += 1 } else { break }
        }
        return streak
    }

    private var longestStreak: Int {
        var longest = 0, temp = 0
        for r in readings {
            if r.minutes >= goalMinutes { temp += 1; longest = max(longest, temp) } else { temp = 0 }
        }
        return longest
    }

    private var dowStats: [DaylightDowStat] {
        var buckets: [[Double]] = Array(repeating: [], count: 7)
        let cal = Calendar.current
        for r in readings {
            let d = cal.component(.weekday, from: r.date) - 1
            buckets[d].append(r.minutes)
        }
        return dow.enumerated().map { i, label in
            let b = buckets[i]
            let avg = b.isEmpty ? nil : b.reduce(0, +) / Double(b.count)
            let goalPct = b.isEmpty ? nil : Int(Double(b.filter { $0 >= goalMinutes }.count) / Double(b.count) * 100)
            return DaylightDowStat(label: label, count: b.count, avgMinutes: avg, goalPct: goalPct)
        }
    }

    private var monthStats: [DaylightMonthStat] {
        var buckets: [String: [Double]] = [:]
        let cal = Calendar.current
        for r in readings {
            let comps = cal.dateComponents([.year, .month], from: r.date)
            let key = String(format: "%04d-%02d", comps.year ?? 0, comps.month ?? 0)
            buckets[key, default: []].append(r.minutes)
        }
        return buckets.sorted { $0.key < $1.key }.suffix(12).compactMap { key, vals in
            guard let monthNum = Int(key.suffix(2)) else { return nil }
            let avg = vals.reduce(0, +) / Double(vals.count)
            let gp = Int(Double(vals.filter { $0 >= goalMinutes }.count) / Double(vals.count) * 100)
            return DaylightMonthStat(label: months[monthNum - 1], avgMinutes: avg, goalPct: gp, count: vals.count)
        }
    }

    private var zoneStats: [DaylightZoneStat] {
        let defs: [(String, Double, Double, Color)] = [
            ("Very Low (< 5m)", 0, 5, .red),
            ("Below Goal (5–20m)", 5, 20, .yellow),
            ("Goal Met (20–60m)", 20, 60, .green),
            ("Excellent (60m+)", 60, Double.infinity, .orange),
        ]
        return defs.compactMap { label, lo, hi, color in
            let count = readings.filter { $0.minutes >= lo && $0.minutes < hi }.count
            guard count > 0 else { return nil }
            return DaylightZoneStat(label: label, count: count, pct: Int(Double(count) / Double(n) * 100), color: color)
        }
    }

    private var bestDow: String? {
        dowStats.filter { $0.avgMinutes != nil && $0.count >= 2 }
            .max { ($0.avgMinutes ?? 0) < ($1.avgMinutes ?? 0) }?.label
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if readings.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryGrid
                    goalProgressCard
                    zoneCard
                    if dowStats.filter({ $0.count > 0 }).count >= 4 { dowCharts }
                    if monthStats.count >= 2 { monthlyChart }
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Daylight Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        HStack(spacing: 0) {
            statCell(value: fmtMin(avgMinutes), label: "Daily Avg", sub: "Goal: 20m", color: .orange)
            Divider().frame(height: 50)
            statCell(value: "\(goalHitPct)%", label: "Goal Days",
                     sub: "\(goalHitDays) of \(n)",
                     color: goalHitPct >= 70 ? .green : goalHitPct >= 40 ? .yellow : .red)
            Divider().frame(height: 50)
            statCell(value: "\(currentStreak)", label: "Streak", sub: "Best \(longestStreak)d", color: .green)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statCell(value: String, label: String, sub: String, color: Color = .orange) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.secondary).opacity(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Goal Progress

    private var goalProgressCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Goal Achievement").font(.headline)
                Spacer()
                Text("\(goalHitPct)%")
                    .font(.subheadline.bold())
                    .foregroundStyle(goalHitPct >= 70 ? .green : goalHitPct >= 40 ? .yellow : .red)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6).fill(Color(.tertiarySystemFill)).frame(height: 10)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.orange.opacity(0.7))
                        .frame(width: geo.size.width * CGFloat(goalHitPct) / 100, height: 10)
                }
            }
            .frame(height: 10)
            Text("\(goalHitDays) days reached 20 min outdoor light")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Zone Card

    private var zoneCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Exposure Levels").font(.headline)
            ForEach(zoneStats) { z in
                HStack(spacing: 8) {
                    Circle().fill(z.color.opacity(0.7)).frame(width: 10, height: 10)
                    Text(z.label).font(.caption).foregroundStyle(.primary)
                    Spacer()
                    Text("\(z.pct)%").font(.caption.bold()).foregroundStyle(z.color)
                    Text("(\(z.count)d)").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Charts

    private var dowCharts: some View {
        VStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Average by Day of Week").font(.headline)
                Chart(dowStats.filter { $0.count > 0 }) { d in
                    BarMark(x: .value("Day", d.label), y: .value("Min", d.avgMinutes ?? 0))
                        .foregroundStyle(Color.orange.opacity(0.75))
                        .cornerRadius(4)
                }
                .chartYAxisLabel("min")
                .frame(height: 140)
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 12) {
                Text("Goal Rate by Day").font(.headline)
                Text("% days reaching 20 min")
                    .font(.caption2).foregroundStyle(.secondary)
                ForEach(dowStats) { d in
                    if let gp = d.goalPct {
                        HStack(spacing: 8) {
                            Text(d.label).font(.caption).frame(width: 30, alignment: .trailing)
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 4).fill(Color(.tertiarySystemFill))
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(gp >= 70 ? Color.green.opacity(0.6) : gp >= 40 ? Color.yellow.opacity(0.6) : Color.red.opacity(0.6))
                                        .frame(width: geo.size.width * CGFloat(gp) / 100)
                                }
                            }
                            .frame(height: 18)
                            Text("\(gp)%").font(.caption2).frame(width: 30, alignment: .trailing)
                        }
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Monthly Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Trend").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Avg Min", m.avgMinutes))
                        .foregroundStyle(.orange)
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                    AreaMark(x: .value("Month", m.label), y: .value("Avg Min", m.avgMinutes))
                        .foregroundStyle(.orange.opacity(0.1))
                        .interpolationMethod(.catmullRom)
                }
                RuleMark(y: .value("Goal", goalMinutes))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.green.opacity(0.6))
                    .annotation(position: .topLeading) {
                        Text("Goal").font(.caption2).foregroundStyle(.green.opacity(0.8))
                    }
            }
            .chartYAxisLabel("min/day")
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "sun.max.fill")
                .font(.system(size: 48))
                .foregroundStyle(.orange.opacity(0.6))
            Text("No Daylight Data")
                .font(.title3.bold())
            Text("Requires iPhone outdoors with iOS 17+. Your ambient light sensor measures time in bright outdoor light.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
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
            .eq("type", value: "time_in_daylight")
            .gte("start_time", value: iso.string(from: oneYearAgo))
            .gte("value", value: 0)
            .order("start_time", ascending: true)
            .execute()
            .value) ?? []

        // Aggregate by day
        var byDay: [String: Double] = [:]
        for row in rows {
            let day = String(row.start_time.prefix(10))
            byDay[day, default: 0] += row.value
        }

        let dateParser = ISO8601DateFormatter()
        dateParser.formatOptions = [.withFullDate]
        readings = byDay.compactMap { day, mins in
            guard let date = dateParser.date(from: day) else { return nil }
            return (date: date, minutes: mins)
        }.sorted { $0.date < $1.date }
    }

    // MARK: - Helpers

    private func fmtMin(_ m: Double) -> String {
        let mins = Int(m.rounded())
        if mins < 60 { return "\(mins)m" }
        let rem = mins % 60
        return rem > 0 ? "\(mins / 60)h \(rem)m" : "\(mins / 60)h"
    }
}

#Preview {
    NavigationStack {
        DaylightPatternView()
    }
}
