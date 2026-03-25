import SwiftUI
import Charts

// MARK: - Top-level models

struct WSDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgPct: Double?
    let okPct: Int?
}

struct WSMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avgPct: Double
    let minPct: Double
    let okPct: Int
    let count: Int
}

// MARK: - WalkingSteadinessPatternView

struct WalkingSteadinessPatternView: View {
    @State private var readings: [(pct: Double, date: String)] = []
    @State private var isLoading = true

    private let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // MARK: - Computed

    private var n: Int { readings.count }
    private var avgPct: Double { n > 0 ? readings.reduce(0) { $0 + $1.pct } / Double(n) : 0 }
    private var minPct: Double { readings.map(\.pct).min() ?? 0 }
    private var okCount: Int { readings.filter { $0.pct >= 60 }.count }
    private var lowCount: Int { readings.filter { $0.pct >= 40 && $0.pct < 60 }.count }
    private var veryLowCount: Int { readings.filter { $0.pct < 40 }.count }

    private var trendDelta: Double? {
        guard readings.count >= 14 else { return nil }
        let first = readings.prefix(30)
        let last = readings.suffix(30)
        let firstAvg = first.reduce(0) { $0 + $1.pct } / Double(first.count)
        let lastAvg = last.reduce(0) { $0 + $1.pct } / Double(last.count)
        return lastAvg - firstAvg
    }

    private var dowStats: [WSDowStat] {
        var buckets: [[Double]] = Array(repeating: [], count: 7)
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let cal = Calendar.current
        for r in readings {
            if let d = df.date(from: r.date) {
                let weekday = cal.component(.weekday, from: d) - 1
                buckets[weekday].append(r.pct)
            }
        }
        return dow.enumerated().map { i, label in
            let b = buckets[i]
            let avg = b.isEmpty ? nil : b.reduce(0, +) / Double(b.count)
            let ok = b.isEmpty ? nil : Int(Double(b.filter { $0 >= 60 }.count) / Double(b.count) * 100)
            return WSDowStat(label: label, count: b.count, avgPct: avg, okPct: ok)
        }
    }

    private var monthStats: [WSMonthStat] {
        var buckets: [String: [Double]] = [:]
        for r in readings {
            let key = String(r.date.prefix(7))
            buckets[key, default: []].append(r.pct)
        }
        return buckets.sorted { $0.key < $1.key }.suffix(12).compactMap { key, vals in
            guard let monthNum = Int(key.suffix(2)) else { return nil }
            let avg = vals.reduce(0, +) / Double(vals.count)
            let mn = vals.min() ?? avg
            let ok = Int(Double(vals.filter { $0 >= 60 }.count) / Double(vals.count) * 100)
            return WSMonthStat(label: months[monthNum - 1], avgPct: avg, minPct: mn, okPct: ok, count: vals.count)
        }
    }

    private func wsColor(_ pct: Double) -> Color {
        if pct >= 60 { return .green }
        if pct >= 40 { return .orange }
        return .red
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
                    zoneCard
                    if let delta = trendDelta { trendCard(delta: delta) }
                    if dowStats.filter({ $0.count > 0 }).count >= 4 { dowChart }
                    if monthStats.count >= 2 { monthChart }
                    infoCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Steadiness Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let avgStr = String(format: "%.1f%%", avgPct)
        let okPctInt = n > 0 ? Int(Double(okCount) / Double(n) * 100) : 0
        let riskColor: Color = veryLowCount > 0 ? .red : lowCount > 0 ? .orange : .secondary
        return HStack(spacing: 0) {
            statCell(value: avgStr, label: "Avg Steadiness", color: wsColor(avgPct))
            Divider().frame(height: 50)
            statCell(value: "\(okPctInt)%", label: "OK Range", sub: "≥ 60%", color: .green)
            Divider().frame(height: 50)
            statCell(value: "\(veryLowCount + lowCount)", label: "At-Risk Days", sub: "< 60%", color: riskColor)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statCell(value: String, label: String, sub: String = "", color: Color = .primary) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            if !sub.isEmpty {
                Text(sub).font(.caption2).foregroundStyle(.secondary).opacity(0.7)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Zone Card

    private var zoneCard: some View {
        let total = n
        return VStack(alignment: .leading, spacing: 10) {
            Text("Zone Distribution").font(.headline)
            if okCount > 0 {
                zoneRow(label: "OK (≥ 60%)", count: okCount, total: total, color: .green)
            }
            if lowCount > 0 {
                zoneRow(label: "Low (40–59%)", count: lowCount, total: total, color: .orange)
            }
            if veryLowCount > 0 {
                zoneRow(label: "Very Low (< 40%)", count: veryLowCount, total: total, color: .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func zoneRow(label: String, count: Int, total: Int, color: Color) -> some View {
        HStack(spacing: 8) {
            Circle().fill(color.opacity(0.7)).frame(width: 10, height: 10)
            Text(label).font(.caption)
            Spacer()
            Text("\(Int(Double(count) / Double(max(total, 1)) * 100))%").font(.caption.bold()).foregroundStyle(color)
            Text("(\(count))").font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Trend Card

    private func trendCard(delta: Double) -> some View {
        let isImproving = delta >= 2
        let isDeclining = delta <= -2
        let color: Color = isImproving ? .green : isDeclining ? .red : .secondary
        let icon = isImproving ? "arrow.up.circle.fill" : isDeclining ? "arrow.down.circle.fill" : "minus.circle.fill"
        let text = isImproving ? "Improving (+\(String(format: "%.1f", delta))% vs first 30 days)"
            : isDeclining ? "Declining (\(String(format: "%.1f", delta))% vs first 30 days)"
            : "Stable trend (±\(String(format: "%.1f", abs(delta)))%)"

        return HStack(spacing: 10) {
            Image(systemName: icon).font(.title2).foregroundStyle(color)
            VStack(alignment: .leading, spacing: 2) {
                Text(text).font(.subheadline.bold()).foregroundStyle(color)
                Text("Comparing your first 30 days to your most recent 30 days.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(color.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(color.opacity(0.2), lineWidth: 1))
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Avg Steadiness by Day").font(.headline)
            Chart(dowStats.filter { $0.count > 0 }) { d in
                if let avg = d.avgPct {
                    BarMark(x: .value("Day", d.label), y: .value("%", avg))
                        .foregroundStyle(wsColor(avg).opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: max(0, minPct - 5)...100)
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Avg Steadiness").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Avg", m.avgPct))
                        .foregroundStyle(.green)
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                    LineMark(x: .value("Month", m.label), y: .value("Min", m.minPct))
                        .foregroundStyle(.orange.opacity(0.6))
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                }
                RuleMark(y: .value("OK", 60))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.green.opacity(0.5))
                RuleMark(y: .value("Low", 40))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.4))
            }
            .chartYScale(domain: max(0, minPct - 5)...100)
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Walking Steadiness Reference").font(.subheadline.weight(.semibold))
            Label("≥ 60% — OK, normal fall risk", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
            Label("40–59% — Low, increased fall risk", systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange)
            Label("< 40% — Very Low, high fall risk", systemImage: "xmark.circle.fill").foregroundStyle(.red)
            Text("Measured by iPhone accelerometer during walks. Requires iOS 15+ on iPhone 8 or later. Score reflects gait stability over 30 days of walking data.")
                .font(.caption2).foregroundStyle(.secondary).padding(.top, 4)
        }
        .font(.caption)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.walk.motion")
                .font(.system(size: 48)).foregroundStyle(.green.opacity(0.6))
            Text("No Steadiness Data").font(.title3.bold())
            Text("Walking Steadiness requires iPhone 8 or later running iOS 15 or later.")
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
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"

        struct Row: Decodable { let value: Double; let start_time: String }
        let rows: [Row] = (try? await SupabaseService.shared.client
            .from("health_records")
            .select("value, start_time")
            .eq("user_id", value: userId.uuidString)
            .eq("type", value: "walking_steadiness")
            .gte("start_time", value: iso.string(from: oneYearAgo))
            .gte("value", value: 0)
            .lte("value", value: 100)
            .order("start_time", ascending: true)
            .execute()
            .value) ?? []

        // Deduplicate to daily averages
        var byDay: [String: [Double]] = [:]
        for row in rows {
            let day = String(row.start_time.prefix(10))
            byDay[day, default: []].append(row.value)
        }

        readings = byDay.sorted { $0.key < $1.key }.map { date, vals in
            let avg = vals.reduce(0, +) / Double(vals.count)
            return (pct: avg, date: date)
        }
    }
}

#Preview {
    NavigationStack { WalkingSteadinessPatternView() }
}
