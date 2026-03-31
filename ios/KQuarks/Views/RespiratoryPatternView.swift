import SwiftUI
import Charts

// MARK: - Top-level models

struct RespDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgBpm: Double?
    let normalPct: Int?
}

struct RespMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avgBpm: Double
    let minBpm: Double
    let normalPct: Int
    let count: Int
}

struct RespHourBucket: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgBpm: Double?
}

// MARK: - RespiratoryPatternView

struct RespiratoryPatternView: View {
    @State private var readings: [(bpm: Double, date: Date)] = []
    @State private var isLoading = true

    private let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // MARK: - Computed

    private var n: Int { readings.count }
    private var avgBpm: Double { n > 0 ? readings.reduce(0) { $0 + $1.bpm } / Double(n) : 0 }
    private var minBpm: Double { readings.map(\.bpm).min() ?? 0 }
    private var maxBpm: Double { readings.map(\.bpm).max() ?? 20 }
    private var normalCount: Int { readings.filter { $0.bpm >= 12 && $0.bpm <= 20 }.count }
    private var lowCount: Int { readings.filter { $0.bpm < 12 }.count }
    private var highCount: Int { readings.filter { $0.bpm > 20 }.count }

    private var nightReadings: [(bpm: Double, date: Date)] {
        let cal = Calendar.current
        return readings.filter {
            let h = cal.component(.hour, from: $0.date)
            return h >= 22 || h < 6
        }
    }
    private var dayReadings: [(bpm: Double, date: Date)] {
        let cal = Calendar.current
        return readings.filter {
            let h = cal.component(.hour, from: $0.date)
            return h >= 6 && h < 22
        }
    }

    private var nightAvg: Double? {
        nightReadings.isEmpty ? nil : nightReadings.reduce(0) { $0 + $1.bpm } / Double(nightReadings.count)
    }
    private var dayAvg: Double? {
        dayReadings.isEmpty ? nil : dayReadings.reduce(0) { $0 + $1.bpm } / Double(dayReadings.count)
    }

    private var dowStats: [RespDowStat] {
        var buckets: [[Double]] = Array(repeating: [], count: 7)
        let cal = Calendar.current
        for r in readings {
            let d = cal.component(.weekday, from: r.date) - 1
            buckets[d].append(r.bpm)
        }
        return dow.enumerated().map { i, label in
            let b = buckets[i]
            let avg = b.isEmpty ? nil : b.reduce(0, +) / Double(b.count)
            let np = b.isEmpty ? nil : Int(Double(b.filter { $0 >= 12 && $0 <= 20 }.count) / Double(b.count) * 100)
            return RespDowStat(label: label, count: b.count, avgBpm: avg, normalPct: np)
        }
    }

    private var monthStats: [RespMonthStat] {
        var buckets: [String: [Double]] = [:]
        let cal = Calendar.current
        for r in readings {
            let comps = cal.dateComponents([.year, .month], from: r.date)
            let key = String(format: "%04d-%02d", comps.year ?? 0, comps.month ?? 0)
            buckets[key, default: []].append(r.bpm)
        }
        return buckets.sorted { $0.key < $1.key }.suffix(12).compactMap { key, vals in
            guard let monthNum = Int(key.suffix(2)) else { return nil }
            let avg = vals.reduce(0, +) / Double(vals.count)
            let mn = vals.min() ?? avg
            let np = Int(Double(vals.filter { $0 >= 12 && $0 <= 20 }.count) / Double(vals.count) * 100)
            return RespMonthStat(label: months[monthNum - 1], avgBpm: avg, minBpm: mn, normalPct: np, count: vals.count)
        }
    }

    private var hourBuckets: [RespHourBucket] {
        let cal = Calendar.current
        return (0..<8).compactMap { i in
            let h = i * 3
            let bucket = readings.filter {
                let hr = cal.component(.hour, from: $0.date)
                return hr >= h && hr < h + 3
            }
            guard !bucket.isEmpty else { return nil }
            let avg = bucket.reduce(0) { $0 + $1.bpm } / Double(bucket.count)
            let label = String(format: "%02d:00", h)
            return RespHourBucket(label: label, count: bucket.count, avgBpm: avg)
        }
    }

    private func respColor(_ bpm: Double) -> Color {
        if bpm >= 12 && bpm <= 20 { return .cyan }
        if bpm < 12 { return .indigo }
        if bpm <= 24 { return .orange }
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
                    if nightAvg != nil && dayAvg != nil { nightDayCard }
                    if hourBuckets.count >= 3 { hourChart }
                    if dowStats.filter({ $0.count > 0 }).count >= 4 { dowChart }
                    if monthStats.count >= 2 { monthChart }
                    infoCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Respiratory Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let avgStr = String(format: "%.1f", avgBpm)
        let normalPctInt = n > 0 ? Int(Double(normalCount) / Double(n) * 100) : 0
        let highColor: Color = highCount > 0 ? .orange : .secondary
        return HStack(spacing: 0) {
            statCell(value: avgStr, label: "Avg br/min", color: respColor(avgBpm))
            Divider().frame(height: 50)
            statCell(value: "\(normalPctInt)%", label: "Normal Range", sub: "12–20 br/min", color: .cyan)
            Divider().frame(height: 50)
            statCell(value: "\(highCount)", label: "Elevated", sub: "> 20 br/min", color: highColor)
        }
        .background(Color.premiumBackground)
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
        let total = normalCount + lowCount + highCount
        return VStack(alignment: .leading, spacing: 10) {
            Text("Zone Breakdown").font(.headline)
            if normalCount > 0 {
                zoneRow(label: "Normal (12–20 br/min)", count: normalCount, total: total, color: .cyan)
            }
            if lowCount > 0 {
                zoneRow(label: "Low (< 12 br/min)", count: lowCount, total: total, color: .indigo)
            }
            if highCount > 0 {
                zoneRow(label: "Elevated (> 20 br/min)", count: highCount, total: total, color: .orange)
            }
        }
        .padding()
        .background(Color.premiumBackground)
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

    // MARK: - Night vs Day

    private var nightDayCard: some View {
        HStack(spacing: 12) {
            if let night = nightAvg {
                VStack(spacing: 6) {
                    Text("🌙").font(.title2)
                    Text(String(format: "%.1f", night))
                        .font(.title3.bold()).foregroundStyle(respColor(night))
                    Text("Overnight").font(.caption2).foregroundStyle(.secondary)
                    Text("10pm–6am").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                    Text("\(nightReadings.count) readings").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.cardSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            if let day = dayAvg {
                VStack(spacing: 6) {
                    Text("☀️").font(.title2)
                    Text(String(format: "%.1f", day))
                        .font(.title3.bold()).foregroundStyle(respColor(day))
                    Text("Daytime").font(.caption2).foregroundStyle(.secondary)
                    Text("6am–10pm").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                    Text("\(dayReadings.count) readings").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.cardSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Hourly Chart

    private var hourChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("3-Hour Avg Rate").font(.headline)
            Chart(hourBuckets) { b in
                if let avg = b.avgBpm {
                    BarMark(x: .value("Hour", b.label), y: .value("br/min", avg))
                        .foregroundStyle(respColor(avg).opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: max(8, minBpm - 1)...max(30, maxBpm + 1))
            .frame(height: 140)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Avg Rate by Day").font(.headline)
            Chart(dowStats.filter { $0.count > 0 }) { d in
                if let avg = d.avgBpm {
                    BarMark(x: .value("Day", d.label), y: .value("br/min", avg))
                        .foregroundStyle(Color.cyan.opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: max(8, minBpm - 1)...max(30, maxBpm + 1))
            .frame(height: 140)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Avg Rate").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Avg", m.avgBpm))
                        .foregroundStyle(.cyan)
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                    LineMark(x: .value("Month", m.label), y: .value("Min", m.minBpm))
                        .foregroundStyle(.indigo.opacity(0.6))
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                }
                RuleMark(y: .value("Upper", 20))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.5))
                RuleMark(y: .value("Lower", 12))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.indigo.opacity(0.5))
            }
            .chartYScale(domain: max(8, minBpm - 1)...max(30, maxBpm + 1))
            .frame(height: 160)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Respiratory Rate Reference").font(.subheadline.weight(.semibold))
            Label("< 12 — Low (bradypnea)", systemImage: "arrow.down.circle.fill").foregroundStyle(.indigo)
            Label("12–20 — Normal resting rate", systemImage: "checkmark.circle.fill").foregroundStyle(.cyan)
            Label("20–24 — Slightly elevated", systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange)
            Label("> 24 — Elevated; seek advice if persistent", systemImage: "xmark.circle.fill").foregroundStyle(.red)
            Text("Apple Watch measures respiratory rate primarily during sleep using accelerometer data. Consistently elevated rates may indicate illness, cardiovascular stress, or poor sleep quality.")
                .font(.caption2).foregroundStyle(.secondary).padding(.top, 4)
        }
        .font(.caption)
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "lungs.fill")
                .font(.system(size: 48)).foregroundStyle(.cyan.opacity(0.6))
            Text("No Respiratory Data").font(.title3.bold())
            Text("Respiratory rate is measured during sleep. Enable sleep tracking with Apple Watch Series 3 or later.")
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
            .eq("type", value: "respiratory_rate")
            .gte("start_time", value: iso.string(from: oneYearAgo))
            .gt("value", value: 4)
            .lt("value", value: 40)
            .order("start_time", ascending: true)
            .execute()
            .value) ?? []

        readings = rows.compactMap { row in
            guard let date = iso.date(from: row.start_time) else { return nil }
            return (bpm: row.value, date: date)
        }
    }
}

#Preview {
    NavigationStack { RespiratoryPatternView() }
}
