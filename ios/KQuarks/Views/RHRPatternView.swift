import SwiftUI
import Charts

// MARK: - RHRDowStat

struct RHRDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgRHR: Double?
}

// MARK: - RHRMonthStat

struct RHRMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avgRHR: Double
    let minRHR: Int
    let count: Int
}

// MARK: - RHRDistBucket

struct RHRDistBucket: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
}

// MARK: - RHRPatternView

struct RHRPatternView: View {
    @State private var days: [(rhr: Int, date: String)] = []
    @State private var isLoading = false

    private let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // MARK: - Computed

    private var n: Int { days.count }
    private var avgRHR: Double { n > 0 ? Double(days.reduce(0) { $0 + $1.rhr }) / Double(n) : 0 }
    private var minRHR: Int { days.map(\.rhr).min() ?? 0 }
    private var maxRHR: Int { days.map(\.rhr).max() ?? 0 }
    private var latestRHR: Int? { days.last?.rhr }

    private var fitnessClass: (label: String, color: Color) {
        guard let r = latestRHR else { return ("Unknown", .secondary) }
        if r < 45 { return ("Athlete", .purple) }
        if r < 54 { return ("Excellent", .green) }
        if r < 62 { return ("Good", .mint) }
        if r < 70 { return ("Above Avg", .yellow) }
        if r < 80 { return ("Average", .orange) }
        return ("Below Avg", .red)
    }

    private func rhrColor(_ rhr: Double) -> Color {
        if rhr < 45 { return .purple }
        if rhr < 54 { return .green }
        if rhr < 62 { return .mint }
        if rhr < 70 { return .yellow }
        if rhr < 80 { return .orange }
        return .red
    }

    private var trendDelta: Double? {
        guard days.count >= 60 else { return nil }
        let last30 = days.suffix(30)
        let prior30 = days.dropLast(30).suffix(30)
        let lastAvg = Double(last30.reduce(0) { $0 + $1.rhr }) / Double(last30.count)
        let priorAvg = Double(prior30.reduce(0) { $0 + $1.rhr }) / Double(prior30.count)
        return lastAvg - priorAvg
    }

    private var distBuckets: [RHRDistBucket] {
        let defs: [(label: String, min: Int, max: Int)] = [
            ("< 45", 0, 44), ("45–53", 45, 53), ("54–61", 54, 61),
            ("62–69", 62, 69), ("70–79", 70, 79), ("80+", 80, 999)
        ]
        return defs.compactMap { def in
            let count = days.filter { $0.rhr >= def.min && $0.rhr <= def.max }.count
            return count > 0 ? RHRDistBucket(label: def.label, count: count) : nil
        }
    }

    private var dowStats: [RHRDowStat] {
        var buckets: [[Int]] = Array(repeating: [], count: 7)
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let cal = Calendar.current
        for d in days {
            if let date = df.date(from: d.date) {
                let weekday = cal.component(.weekday, from: date) - 1
                buckets[weekday].append(d.rhr)
            }
        }
        return dow.enumerated().map { i, label in
            let b = buckets[i]
            let avg = b.isEmpty ? nil : Double(b.reduce(0, +)) / Double(b.count)
            return RHRDowStat(label: label, count: b.count, avgRHR: avg)
        }
    }

    private var monthStats: [RHRMonthStat] {
        var buckets: [String: [Int]] = [:]
        for d in days {
            let key = String(d.date.prefix(7))
            buckets[key, default: []].append(d.rhr)
        }
        return buckets.sorted { $0.key < $1.key }.suffix(12).compactMap { key, vals in
            guard let monthNum = Int(key.suffix(2)) else { return nil }
            let avg = Double(vals.reduce(0, +)) / Double(vals.count)
            return RHRMonthStat(label: months[monthNum - 1], avgRHR: avg, minRHR: vals.min() ?? 0, count: vals.count)
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if days.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryGrid
                    if distBuckets.count >= 2 { classDistCard }
                    if distBuckets.count >= 2 { distributionChart }
                    if dowStats.filter({ $0.count > 0 }).count >= 4 { dowChart }
                    if monthStats.count >= 2 { monthChart }
                    infoCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("RHR Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let cls = fitnessClass
        let trendStr = trendDelta.map { String(format: "%+.1f", $0) } ?? "—"
        let trendColor: Color = (trendDelta ?? 0) <= -1 ? .green : (trendDelta ?? 0) >= 1 ? .red : .secondary
        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statCell(value: "\(latestRHR ?? 0)", label: "Latest", sub: cls.label, color: cls.color)
                Divider().frame(height: 50)
                statCell(value: String(format: "%.1f", avgRHR), label: "Year Avg", color: rhrColor(avgRHR))
                Divider().frame(height: 50)
                statCell(value: trendStr + " bpm", label: "30d Trend", sub: "vs prior 30d", color: trendColor)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(value: "\(minRHR)", label: "Best Day", color: .green)
                Divider().frame(height: 50)
                statCell(value: "\(maxRHR)", label: "Highest Day", color: .red)
                Divider().frame(height: 50)
                statCell(value: "\(n)", label: "Days Tracked", color: .secondary)
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statCell(value: String, label: String, sub: String = "", color: Color = .primary) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            if !sub.isEmpty {
                Text(sub).font(.caption2).foregroundStyle(color).opacity(0.7)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Fitness Class Distribution Card

    private func classRow(label: String, minBpm: Int, maxBpm: Int, color: Color) -> some View {
        let count = days.filter { $0.rhr >= minBpm && $0.rhr <= maxBpm }.count
        guard count > 0 else { return AnyView(EmptyView()) }
        let pct = Int(Double(count) / Double(Swift.max(n, 1)) * 100)
        return AnyView(HStack(spacing: 8) {
            Circle().fill(color.opacity(0.7)).frame(width: 10, height: 10)
            Text(label).font(.caption)
            Spacer()
            Text("\(pct)%").font(.caption.bold()).foregroundStyle(color)
            Text("(\(count))").font(.caption2).foregroundStyle(.secondary)
        })
    }

    private var classDistCard: some View {
        return VStack(alignment: .leading, spacing: 10) {
            Text("Fitness Classification").font(.headline)
            classRow(label: "Athlete", minBpm: 0, maxBpm: 44, color: .purple)
            classRow(label: "Excellent", minBpm: 45, maxBpm: 53, color: .green)
            classRow(label: "Good", minBpm: 54, maxBpm: 61, color: .mint)
            classRow(label: "Above Avg", minBpm: 62, maxBpm: 69, color: .yellow)
            classRow(label: "Average", minBpm: 70, maxBpm: 79, color: .orange)
            classRow(label: "Below Avg", minBpm: 80, maxBpm: 999, color: .red)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Distribution Chart

    private var distributionChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("RHR Distribution").font(.headline)
            Chart(distBuckets) { b in
                BarMark(x: .value("Range", b.label), y: .value("Days", b.count))
                    .foregroundStyle(Color.red.opacity(0.7))
                    .cornerRadius(4)
            }
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Avg RHR by Day").font(.headline)
            Chart(dowStats.filter { $0.count > 0 }) { d in
                if let avg = d.avgRHR {
                    BarMark(x: .value("Day", d.label), y: .value("RHR", avg))
                        .foregroundStyle(rhrColor(avg).opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: Double(max(30, minRHR - 3))...Double(min(120, maxRHR + 3)))
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Avg RHR").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Avg", m.avgRHR))
                        .foregroundStyle(rhrColor(m.avgRHR))
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                }
            }
            .chartYScale(domain: Double(max(30, minRHR - 3))...Double(min(120, maxRHR + 3)))
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Resting HR Reference").font(.subheadline.weight(.semibold))
            Label("< 45 bpm — Athlete", systemImage: "circle.fill").foregroundStyle(.purple)
            Label("45–53 bpm — Excellent", systemImage: "circle.fill").foregroundStyle(.green)
            Label("54–61 bpm — Good", systemImage: "circle.fill").foregroundStyle(.mint)
            Label("62–69 bpm — Above Average", systemImage: "circle.fill").foregroundStyle(.yellow)
            Label("70–79 bpm — Average", systemImage: "circle.fill").foregroundStyle(.orange)
            Label("≥ 80 bpm — Below Average", systemImage: "circle.fill").foregroundStyle(.red)
            Text("Apple Watch measures RHR when you're still. Lower values indicate better cardiovascular fitness. Temporary elevation may indicate illness or inadequate recovery.")
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
            Image(systemName: "heart.fill")
                .font(.system(size: 48)).foregroundStyle(.red.opacity(0.6))
            Text("No Resting HR Data").font(.title3.bold())
            Text("Apple Watch measures resting heart rate automatically. Make sure you're wearing your watch regularly.")
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
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"

        struct Row: Decodable { let date: String; let resting_heart_rate: Int? }
        let rows: [Row] = (try? await SupabaseService.shared.client
            .from("daily_summaries")
            .select("date, resting_heart_rate")
            .eq("user_id", value: userId.uuidString)
            .gte("date", value: df.string(from: oneYearAgo))
            .gt("resting_heart_rate", value: 30)
            .lt("resting_heart_rate", value: 120)
            .order("date", ascending: true)
            .execute()
            .value) ?? []

        days = rows.compactMap { row in
            guard let rhr = row.resting_heart_rate else { return nil }
            return (rhr: rhr, date: row.date)
        }
    }
}

#Preview {
    NavigationStack { RHRPatternView() }
}
