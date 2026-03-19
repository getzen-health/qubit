import SwiftUI
import Charts

// MARK: - Top-level models

struct SpO2DowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgPct: Double?
    let normalPct: Int?
}

struct SpO2MonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avgPct: Double
    let minPct: Double
    let normalPct: Int
    let count: Int
}

struct SpO2HourBucket: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgPct: Double?
}

// MARK: - SpO2PatternView

struct SpO2PatternView: View {
    @State private var readings: [(pct: Double, date: Date)] = []
    @State private var isLoading = false

    private let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // MARK: - Computed

    private var n: Int { readings.count }
    private var avgPct: Double { n > 0 ? readings.reduce(0) { $0 + $1.pct } / Double(n) : 0 }
    private var minPct: Double { readings.map(\.pct).min() ?? 0 }
    private var normalCount: Int { readings.filter { $0.pct >= 95 }.count }
    private var mildCount: Int { readings.filter { $0.pct >= 90 && $0.pct < 95 }.count }
    private var lowCount: Int { readings.filter { $0.pct < 90 }.count }

    private var nightReadings: [(pct: Double, date: Date)] {
        let cal = Calendar.current
        return readings.filter {
            let h = cal.component(.hour, from: $0.date)
            return h >= 22 || h < 6
        }
    }
    private var dayReadings: [(pct: Double, date: Date)] {
        let cal = Calendar.current
        return readings.filter {
            let h = cal.component(.hour, from: $0.date)
            return h >= 6 && h < 22
        }
    }

    private var nightAvg: Double? {
        nightReadings.isEmpty ? nil : nightReadings.reduce(0) { $0 + $1.pct } / Double(nightReadings.count)
    }
    private var dayAvg: Double? {
        dayReadings.isEmpty ? nil : dayReadings.reduce(0) { $0 + $1.pct } / Double(dayReadings.count)
    }

    private var dowStats: [SpO2DowStat] {
        var buckets: [[Double]] = Array(repeating: [], count: 7)
        let cal = Calendar.current
        for r in readings {
            let d = cal.component(.weekday, from: r.date) - 1
            buckets[d].append(r.pct)
        }
        return dow.enumerated().map { i, label in
            let b = buckets[i]
            let avg = b.isEmpty ? nil : b.reduce(0, +) / Double(b.count)
            let np = b.isEmpty ? nil : Int(Double(b.filter { $0 >= 95 }.count) / Double(b.count) * 100)
            return SpO2DowStat(label: label, count: b.count, avgPct: avg, normalPct: np)
        }
    }

    private var monthStats: [SpO2MonthStat] {
        var buckets: [String: [Double]] = [:]
        let cal = Calendar.current
        for r in readings {
            let comps = cal.dateComponents([.year, .month], from: r.date)
            let key = String(format: "%04d-%02d", comps.year ?? 0, comps.month ?? 0)
            buckets[key, default: []].append(r.pct)
        }
        return buckets.sorted { $0.key < $1.key }.suffix(12).compactMap { key, vals in
            guard let monthNum = Int(key.suffix(2)) else { return nil }
            let avg = vals.reduce(0, +) / Double(vals.count)
            let mn = vals.min() ?? avg
            let np = Int(Double(vals.filter { $0 >= 95 }.count) / Double(vals.count) * 100)
            return SpO2MonthStat(label: months[monthNum - 1], avgPct: avg, minPct: mn, normalPct: np, count: vals.count)
        }
    }

    private var hourBuckets: [SpO2HourBucket] {
        let cal = Calendar.current
        return (0..<8).compactMap { i in
            let h = i * 3
            let bucket = readings.filter {
                let hr = cal.component(.hour, from: $0.date)
                return hr >= h && hr < h + 3
            }
            guard !bucket.isEmpty else { return nil }
            let avg = bucket.reduce(0) { $0 + $1.pct } / Double(bucket.count)
            let label = String(format: "%02d:00", h)
            return SpO2HourBucket(label: label, count: bucket.count, avgPct: avg)
        }
    }

    private func spo2Color(_ pct: Double) -> Color {
        if pct >= 95 { return .green }
        if pct >= 90 { return .orange }
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
                    if hourBuckets.count >= 4 { hourChart }
                    if dowStats.filter({ $0.count > 0 }).count >= 4 { dowChart }
                    if monthStats.count >= 2 { monthChart }
                    infoCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("SpO₂ Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let avgStr = String(format: "%.1f%%", avgPct)
        let normalPctInt = n > 0 ? Int(Double(normalCount) / Double(n) * 100) : 0
        let lowColor: Color = lowCount > 0 ? .red : .secondary
        return HStack(spacing: 0) {
            statCell(value: avgStr, label: "Avg SpO₂", color: spo2Color(avgPct))
            Divider().frame(height: 50)
            statCell(value: "\(normalPctInt)%", label: "Normal Range", sub: "≥ 95%", color: .green)
            Divider().frame(height: 50)
            statCell(value: "\(lowCount)", label: "Low Events", sub: "< 90%", color: lowColor)
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
        let total = normalCount + mildCount + lowCount
        return VStack(alignment: .leading, spacing: 10) {
            Text("Zone Breakdown").font(.headline)
            if normalCount > 0 {
                zoneRow(label: "Normal (≥ 95%)", count: normalCount, total: total, color: .green)
            }
            if mildCount > 0 {
                zoneRow(label: "Mild (90–94%)", count: mildCount, total: total, color: .orange)
            }
            if lowCount > 0 {
                zoneRow(label: "Low (< 90%)", count: lowCount, total: total, color: .red)
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

    // MARK: - Night vs Day

    private var nightDayCard: some View {
        HStack(spacing: 12) {
            if let night = nightAvg {
                VStack(spacing: 6) {
                    Text("🌙").font(.title2)
                    Text(String(format: "%.1f%%", night))
                        .font(.title3.bold()).foregroundStyle(spo2Color(night))
                    Text("Overnight").font(.caption2).foregroundStyle(.secondary)
                    Text("10pm–6am").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                    Text("\(nightReadings.count) readings").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            if let day = dayAvg {
                VStack(spacing: 6) {
                    Text("☀️").font(.title2)
                    Text(String(format: "%.1f%%", day))
                        .font(.title3.bold()).foregroundStyle(spo2Color(day))
                    Text("Daytime").font(.caption2).foregroundStyle(.secondary)
                    Text("6am–10pm").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                    Text("\(dayReadings.count) readings").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Hourly Chart

    private var hourChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("3-Hour Avg SpO₂").font(.headline)
            Chart(hourBuckets) { b in
                if let avg = b.avgPct {
                    BarMark(x: .value("Hour", b.label), y: .value("%", avg))
                        .foregroundStyle(spo2Color(avg).opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: max(85, minPct - 2)...100)
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Avg SpO₂ by Day").font(.headline)
            Chart(dowStats.filter { $0.count > 0 }) { d in
                if let avg = d.avgPct {
                    BarMark(x: .value("Day", d.label), y: .value("%", avg))
                        .foregroundStyle(Color.blue.opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: max(85, minPct - 2)...100)
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Avg SpO₂").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Avg %", m.avgPct))
                        .foregroundStyle(.blue)
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                    LineMark(x: .value("Month", m.label), y: .value("Min %", m.minPct))
                        .foregroundStyle(.orange.opacity(0.6))
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                }
                RuleMark(y: .value("Normal", 95))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.green.opacity(0.6))
            }
            .chartYScale(domain: max(85, minPct - 2)...100)
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SpO₂ Reference").font(.subheadline.weight(.semibold))
            Label("≥ 95% — Normal oxygen saturation", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
            Label("90–94% — Mild hypoxemia", systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange)
            Label("< 90% — Seek medical attention", systemImage: "xmark.circle.fill").foregroundStyle(.red)
            Text("Apple Watch background readings may be lower at night. Single readings may not indicate a clinical issue — look for consistent patterns.")
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
            Image(systemName: "lungs.fill")
                .font(.system(size: 48)).foregroundStyle(.blue.opacity(0.6))
            Text("No SpO₂ Data").font(.title3.bold())
            Text("Blood oxygen data requires Apple Watch Series 6 or later with background SpO₂ monitoring enabled.")
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
            .eq("type", value: "oxygen_saturation")
            .gte("start_time", value: iso.string(from: oneYearAgo))
            .gt("value", value: 50)
            .lte("value", value: 100)
            .order("start_time", ascending: true)
            .execute()
            .value) ?? []

        readings = rows.compactMap { row in
            guard let date = iso.date(from: row.start_time) else { return nil }
            return (pct: row.value, date: date)
        }
    }
}

#Preview {
    NavigationStack { SpO2PatternView() }
}
