import SwiftUI
import Charts

// MARK: - Top-level models

struct HearingDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgDb: Double?
    let safePct: Int?
}

struct HearingMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avgDb: Double
    let maxDb: Double
    let loudPct: Int
    let count: Int
}

struct HearingHourBucket: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgDb: Double?
}

// MARK: - HearingPatternView

struct HearingPatternView: View {
    @State private var readings: [(db: Double, type: String, date: Date)] = []
    @State private var isLoading = true

    private let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // MARK: - Computed

    private var n: Int { readings.count }
    private var avgDb: Double { n > 0 ? readings.reduce(0) { $0 + $1.db } / Double(n) : 0 }
    private var maxDb: Double { readings.map(\.db).max() ?? 0 }
    private var safeCount: Int { readings.filter { $0.db < 70 }.count }
    private var moderateCount: Int { readings.filter { $0.db >= 70 && $0.db < 80 }.count }
    private var loudCount: Int { readings.filter { $0.db >= 80 && $0.db < 90 }.count }
    private var dangerousCount: Int { readings.filter { $0.db >= 90 }.count }

    private var headphoneReadings: [(db: Double, type: String, date: Date)] {
        readings.filter { $0.type == "headphone_audio_exposure" }
    }
    private var environmentalReadings: [(db: Double, type: String, date: Date)] {
        readings.filter { $0.type == "environmental_audio_exposure" }
    }

    private var headphoneAvg: Double? {
        headphoneReadings.isEmpty ? nil : headphoneReadings.reduce(0) { $0 + $1.db } / Double(headphoneReadings.count)
    }
    private var environmentalAvg: Double? {
        environmentalReadings.isEmpty ? nil : environmentalReadings.reduce(0) { $0 + $1.db } / Double(environmentalReadings.count)
    }

    private var dowStats: [HearingDowStat] {
        var buckets: [[Double]] = Array(repeating: [], count: 7)
        let cal = Calendar.current
        for r in readings {
            let d = cal.component(.weekday, from: r.date) - 1
            buckets[d].append(r.db)
        }
        return dow.enumerated().map { i, label in
            let b = buckets[i]
            let avg = b.isEmpty ? nil : b.reduce(0, +) / Double(b.count)
            let sp = b.isEmpty ? nil : Int(Double(b.filter { $0 < 70 }.count) / Double(b.count) * 100)
            return HearingDowStat(label: label, count: b.count, avgDb: avg, safePct: sp)
        }
    }

    private var monthStats: [HearingMonthStat] {
        var buckets: [String: [Double]] = [:]
        let cal = Calendar.current
        for r in readings {
            let comps = cal.dateComponents([.year, .month], from: r.date)
            let key = String(format: "%04d-%02d", comps.year ?? 0, comps.month ?? 0)
            buckets[key, default: []].append(r.db)
        }
        return buckets.sorted { $0.key < $1.key }.suffix(12).compactMap { key, vals in
            guard let monthNum = Int(key.suffix(2)) else { return nil }
            let avg = vals.reduce(0, +) / Double(vals.count)
            let mx = vals.max() ?? avg
            let lp = Int(Double(vals.filter { $0 >= 80 }.count) / Double(vals.count) * 100)
            return HearingMonthStat(label: months[monthNum - 1], avgDb: avg, maxDb: mx, loudPct: lp, count: vals.count)
        }
    }

    private var hourBuckets: [HearingHourBucket] {
        let cal = Calendar.current
        return (0..<8).compactMap { i in
            let h = i * 3
            let bucket = readings.filter {
                let hr = cal.component(.hour, from: $0.date)
                return hr >= h && hr < h + 3
            }
            guard !bucket.isEmpty else { return nil }
            let avg = bucket.reduce(0) { $0 + $1.db } / Double(bucket.count)
            return HearingHourBucket(label: String(format: "%02d:00", h), count: bucket.count, avgDb: avg)
        }
    }

    private func dbColor(_ db: Double) -> Color {
        if db < 70 { return .green }
        if db < 80 { return .yellow }
        if db < 90 { return .orange }
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
                    if headphoneAvg != nil && environmentalAvg != nil { sourceComparisonCard }
                    if hourBuckets.count >= 3 { hourChart }
                    if dowStats.filter({ $0.count > 0 }).count >= 4 { dowChart }
                    if monthStats.count >= 2 { monthChart }
                    infoCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Hearing Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let avgStr = String(format: "%.1f dB", avgDb)
        let safePctInt = n > 0 ? Int(Double(safeCount) / Double(n) * 100) : 0
        let loudColor: Color = loudCount + dangerousCount > 0 ? .orange : .secondary
        return HStack(spacing: 0) {
            statCell(value: avgStr, label: "Avg Exposure", color: dbColor(avgDb))
            Divider().frame(height: 50)
            statCell(value: "\(safePctInt)%", label: "Safe Readings", sub: "< 70 dB", color: .green)
            Divider().frame(height: 50)
            statCell(value: "\(loudCount + dangerousCount)", label: "Loud Events", sub: "≥ 80 dB", color: loudColor)
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
        let total = n
        return VStack(alignment: .leading, spacing: 10) {
            Text("Noise Zone Breakdown").font(.headline)
            if safeCount > 0 {
                zoneRow(label: "Safe (< 70 dB)", count: safeCount, total: total, color: .green)
            }
            if moderateCount > 0 {
                zoneRow(label: "Moderate (70–79 dB)", count: moderateCount, total: total, color: .yellow)
            }
            if loudCount > 0 {
                zoneRow(label: "Loud (80–89 dB)", count: loudCount, total: total, color: .orange)
            }
            if dangerousCount > 0 {
                zoneRow(label: "Dangerous (≥ 90 dB)", count: dangerousCount, total: total, color: .red)
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

    // MARK: - Source Comparison

    private var sourceComparisonCard: some View {
        HStack(spacing: 12) {
            if let hp = headphoneAvg {
                VStack(spacing: 6) {
                    Text("🎧").font(.title2)
                    Text(String(format: "%.1f dB", hp))
                        .font(.title3.bold()).foregroundStyle(dbColor(hp))
                    Text("Headphone").font(.caption2).foregroundStyle(.secondary)
                    Text("\(headphoneReadings.count) readings").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.cardSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            if let env = environmentalAvg {
                VStack(spacing: 6) {
                    Text("🌍").font(.title2)
                    Text(String(format: "%.1f dB", env))
                        .font(.title3.bold()).foregroundStyle(dbColor(env))
                    Text("Environmental").font(.caption2).foregroundStyle(.secondary)
                    Text("\(environmentalReadings.count) readings").font(.caption2).foregroundStyle(.secondary).opacity(0.7)
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

    // MARK: - Hour Chart

    private var hourChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("3-Hour Avg Exposure").font(.headline)
            Chart(hourBuckets) { b in
                if let avg = b.avgDb {
                    BarMark(x: .value("Hour", b.label), y: .value("dB", avg))
                        .foregroundStyle(dbColor(avg).opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: 50...max(110, maxDb + 5))
            .frame(height: 140)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Avg Exposure by Day").font(.headline)
            Chart(dowStats.filter { $0.count > 0 }) { d in
                if let avg = d.avgDb {
                    BarMark(x: .value("Day", d.label), y: .value("dB", avg))
                        .foregroundStyle(dbColor(avg).opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: 50...max(110, maxDb + 5))
            .frame(height: 140)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Avg Exposure").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Avg", m.avgDb))
                        .foregroundStyle(.green)
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                    LineMark(x: .value("Month", m.label), y: .value("Max", m.maxDb))
                        .foregroundStyle(.orange.opacity(0.6))
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                }
                RuleMark(y: .value("Loud", 80))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.5))
                RuleMark(y: .value("Safe", 70))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.yellow.opacity(0.5))
            }
            .chartYScale(domain: 50...max(110, maxDb + 5))
            .frame(height: 160)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("WHO Noise Guidelines").font(.subheadline.weight(.semibold))
            Label("< 70 dB — Safe for unlimited exposure", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
            Label("70–79 dB — Moderate; safe for extended periods", systemImage: "exclamationmark.circle.fill").foregroundStyle(.yellow)
            Label("80–89 dB — Loud; limit to 2 hours/day", systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange)
            Label("≥ 90 dB — Dangerous; limit to 30 min or use protection", systemImage: "xmark.circle.fill").foregroundStyle(.red)
            Text("Noise-induced hearing loss is permanent and cumulative. Readings represent dB(A) weighted averages tracked by Apple Watch or AirPods.")
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
            Image(systemName: "ear.fill")
                .font(.system(size: 48)).foregroundStyle(.green.opacity(0.6))
            Text("No Audio Exposure Data").font(.title3.bold())
            Text("Hearing health data requires Apple Watch with noise monitoring or AirPods. Enable noise notifications in the Health app.")
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

        struct Row: Decodable { let value: Double; let type: String; let start_time: String }
        let rows: [Row] = (try? await SupabaseService.shared.client
            .from("health_records")
            .select("value, type, start_time")
            .eq("user_id", value: userId.uuidString)
            .in("type", values: ["headphone_audio_exposure", "environmental_audio_exposure"])
            .gte("start_time", value: iso.string(from: oneYearAgo))
            .order("start_time", ascending: true)
            .execute()
            .value) ?? []

        readings = rows.compactMap { row in
            guard let date = iso.date(from: row.start_time) else { return nil }
            return (db: row.value, type: row.type, date: date)
        }
    }
}

#Preview {
    NavigationStack { HearingPatternView() }
}
