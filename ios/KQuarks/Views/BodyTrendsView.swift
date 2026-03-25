import SwiftUI
import Charts

// MARK: - Top-level models

struct BodyDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgWeight: Double?
    let diffFromAvg: Double?
}

struct BodyMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgWeight: Double
    let minWeight: Double
    let maxWeight: Double
    let avgBf: Double?
}

// MARK: - BodyTrendsView

struct BodyTrendsView: View {
    @State private var totalMeasurements = 0
    @State private var latestWeight: Double = 0
    @State private var earliestWeight: Double = 0
    @State private var minWeight: Double = 0
    @State private var maxWeight: Double = 0
    @State private var avgWeight: Double = 0
    @State private var totalChange: Double = 0
    @State private var weeklyChange: Double? = nil
    @State private var change30: Double? = nil
    @State private var weeklySlope: Double = 0
    @State private var trendDir: String = "maintaining"
    @State private var latestBf: Double? = nil
    @State private var earliestBf: Double? = nil
    @State private var bfChange: Double? = nil
    @State private var dowData: [BodyDowStat] = []
    @State private var monthData: [BodyMonthStat] = []
    @State private var isLoading = true

    private let dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalMeasurements < 5 {
                    emptyState
                } else {
                    summaryCard
                    rateCard
                    if latestBf != nil { bodyFatCard }
                    if dowData.filter({ $0.count > 0 }).count >= 5 { dowCard }
                    if monthData.count >= 2 { monthTrendChart }
                    if monthData.count >= 2 { monthTable }
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Body Weight Trends")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Text("⚖️").font(.system(size: 60))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Log at least 5 weight measurements to see trends.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    // MARK: - Summary

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                metricTile("Current", "\(String(format: "%.1f", latestWeight)) kg", .blue)
                metricTile("Change", signedStr(totalChange, unit: "kg"), totalChange <= 0 ? .green : .red)
            }
            HStack(spacing: 12) {
                metricTile("Average", "\(String(format: "%.1f", avgWeight)) kg", .primary)
                metricTile("Range", "\(String(format: "%.1f", minWeight))–\(String(format: "%.1f", maxWeight))", .secondary)
            }
        }
    }

    private func metricTile(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title3.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Rate of change

    private var rateCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Rate of Change")
                .font(.headline)

            HStack(spacing: 0) {
                VStack(spacing: 4) {
                    Text("Last 7 days").font(.caption2).foregroundStyle(.secondary)
                    if let wc = weeklyChange {
                        Text(signedStr(wc, unit: "kg"))
                            .font(.title3.bold())
                            .foregroundStyle(wc > 0 ? .red : .green)
                    } else {
                        Text("—").font(.title3.bold()).foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)

                Rectangle().fill(Color(.separator)).frame(width: 1, height: 40)

                VStack(spacing: 4) {
                    Text("Last 30 days").font(.caption2).foregroundStyle(.secondary)
                    if let c30 = change30 {
                        Text(signedStr(c30, unit: "kg"))
                            .font(.title3.bold())
                            .foregroundStyle(c30 > 0 ? .red : .green)
                    } else {
                        Text("—").font(.title3.bold()).foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)

                Rectangle().fill(Color(.separator)).frame(width: 1, height: 40)

                VStack(spacing: 4) {
                    Text("Trend").font(.caption2).foregroundStyle(.secondary)
                    Text(trendDir.capitalized)
                        .font(.subheadline.bold())
                        .foregroundStyle(trendColor)
                    Text(String(format: "%.2f kg/wk", weeklySlope))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var trendColor: Color {
        switch trendDir {
        case "gaining": return .red
        case "losing": return .green
        default: return .blue
        }
    }

    // MARK: - Body fat

    private var bodyFatCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Body Fat %")
                .font(.headline)
            HStack(spacing: 0) {
                if let bf = latestBf {
                    VStack(spacing: 4) {
                        Text("Current").font(.caption2).foregroundStyle(.secondary)
                        Text(String(format: "%.1f%%", bf)).font(.title3.bold()).foregroundStyle(.purple)
                    }
                    .frame(maxWidth: .infinity)
                }
                if let bf0 = earliestBf, latestBf != nil {
                    Rectangle().fill(Color(.separator)).frame(width: 1, height: 40)
                    VStack(spacing: 4) {
                        Text("Started").font(.caption2).foregroundStyle(.secondary)
                        Text(String(format: "%.1f%%", bf0)).font(.title3.bold()).foregroundStyle(.primary)
                    }
                    .frame(maxWidth: .infinity)
                }
                if let bfc = bfChange {
                    Rectangle().fill(Color(.separator)).frame(width: 1, height: 40)
                    VStack(spacing: 4) {
                        Text("Change").font(.caption2).foregroundStyle(.secondary)
                        Text((bfc >= 0 ? "+" : "") + String(format: "%.1f%%", bfc))
                            .font(.title3.bold())
                            .foregroundStyle(bfc <= 0 ? .green : .red)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - DOW patterns

    private var dowCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Weight by Day of Week")
                .font(.headline)
            Text("Deviation from your \(String(format: "%.1f", avgWeight)) kg average")
                .font(.caption)
                .foregroundStyle(.secondary)

            let maxDiff = dowData.compactMap(\.diffFromAvg).map(abs).max() ?? 0.1
            ForEach(dowData.filter { $0.count > 0 }) { d in
                HStack(spacing: 8) {
                    Text(d.label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .leading)

                    GeometryReader { geo in
                        let diff = d.diffFromAvg ?? 0
                        let pct = abs(diff) / maxDiff
                        let barW = geo.size.width * CGFloat(pct) / 2
                        let isPos = diff > 0

                        ZStack {
                            // Center line
                            Rectangle()
                                .fill(Color(.separator))
                                .frame(width: 1, height: 12)
                                .frame(maxWidth: .infinity, alignment: .center)

                            if isPos {
                                Rectangle()
                                    .fill(Color.red.opacity(0.7))
                                    .frame(width: barW, height: 12)
                                    .frame(maxWidth: .infinity, alignment: .center)
                                    .offset(x: barW / 2)
                            } else if diff < 0 {
                                Rectangle()
                                    .fill(Color.green.opacity(0.7))
                                    .frame(width: barW, height: 12)
                                    .frame(maxWidth: .infinity, alignment: .center)
                                    .offset(x: -barW / 2)
                            }
                        }
                    }
                    .frame(height: 12)

                    let diff = d.diffFromAvg ?? 0
                    Text((diff >= 0 ? "+" : "") + String(format: "%.2f", diff))
                        .font(.caption.bold())
                        .foregroundStyle(diff > 0 ? .red : diff < 0 ? .green : .secondary)
                        .frame(width: 40, alignment: .trailing)
                }
            }
            Text("Green = lighter · Red = heavier than average")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly trend chart

    private var monthTrendChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Monthly Average Weight")
                .font(.headline)

            Chart(monthData) { m in
                LineMark(x: .value("Month", m.label), y: .value("Weight", m.avgWeight))
                    .foregroundStyle(.blue)
                    .interpolationMethod(.catmullRom)
                PointMark(x: .value("Month", m.label), y: .value("Weight", m.avgWeight))
                    .foregroundStyle(.blue)

                if let bf = m.avgBf {
                    LineMark(x: .value("Month", m.label), y: .value("Body Fat", bf))
                        .foregroundStyle(.purple)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 2]))
                    PointMark(x: .value("Month", m.label), y: .value("Body Fat", bf))
                        .foregroundStyle(.purple)
                }
            }
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly table

    private var monthTable: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Monthly Summary")
                .font(.headline)
                .padding(.horizontal)
                .padding(.top, 16)
                .padding(.bottom, 12)

            VStack(spacing: 0) {
                ForEach(Array(monthData.reversed().enumerated()), id: \.offset) { i, m in
                    HStack {
                        Text(m.label)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .frame(width: 36, alignment: .leading)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(String(format: "%.1f kg avg", m.avgWeight))
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.blue)
                            Text(String(format: "%.1f–%.1f kg", m.minWeight, m.maxWeight))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 1) {
                            if let bf = m.avgBf {
                                Text(String(format: "%.1f%% fat", bf))
                                    .font(.caption)
                                    .foregroundStyle(.purple)
                            }
                            Text("\(m.count) readings")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 10)
                    if i < monthData.count - 1 {
                        Divider().padding(.leading)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    // MARK: - Helpers

    private func signedStr(_ val: Double, unit: String) -> String {
        let sign = val >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", val)) \(unit)"
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            guard let userId = SupabaseService.shared.currentSession?.user.id else { return }
            let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
            let startStr = ISO8601DateFormatter().string(from: oneYearAgo).prefix(10)

            struct SummaryRow: Decodable {
                let date: String
                let weight_kg: Double?
                let body_fat_percent: Double?
            }

            let rows: [SummaryRow] = try await SupabaseService.shared.client
                .from("daily_summaries")
                .select("date, weight_kg, body_fat_percent")
                .eq("user_id", value: userId.uuidString)
                .gte("date", value: String(startStr))
                .order("date", ascending: true)
                .execute()
                .value

            let valid = rows.filter { ($0.weight_kg ?? 0) > 0 }
            totalMeasurements = valid.count
            guard totalMeasurements >= 5 else { return }

            let weights = valid.compactMap(\.weight_kg)
            latestWeight  = weights.last ?? 0
            earliestWeight = weights.first ?? 0
            minWeight = weights.min() ?? 0
            maxWeight = weights.max() ?? 0
            avgWeight = weights.isEmpty ? 0 : weights.reduce(0, +) / Double(weights.count)
            totalChange = latestWeight - earliestWeight

            // Weekly change
            let last7 = Array(valid.suffix(7))
            let prev7 = valid.count >= 14 ? Array(valid.suffix(14).prefix(7)) : []
            let last7Avg = last7.compactMap(\.weight_kg).reduce(0, +) / Double(max(last7.count, 1))
            if !prev7.isEmpty {
                let prev7Avg = prev7.compactMap(\.weight_kg).reduce(0, +) / Double(prev7.count)
                weeklyChange = last7Avg - prev7Avg
            }

            // 30-day change
            if valid.count >= 2 {
                let last30 = Array(valid.suffix(30))
                if let first30W = last30.first?.weight_kg {
                    change30 = latestWeight - first30W
                }
            }

            // Linear regression for slope
            let n = weights.count
            var sumX = 0.0, sumY = 0.0, sumXY = 0.0, sumX2 = 0.0
            for (i, w) in weights.enumerated() {
                let xi = Double(i)
                sumX += xi; sumY += w; sumXY += xi * w; sumX2 += xi * xi
            }
            let denom = Double(n) * sumX2 - sumX * sumX
            let slope = denom != 0 ? (Double(n) * sumXY - sumX * sumY) / denom : 0
            weeklySlope = slope * 7
            trendDir = weeklySlope > 0.05 ? "gaining" : weeklySlope < -0.05 ? "losing" : "maintaining"

            // Body fat
            let bfRows = valid.filter { ($0.body_fat_percent ?? 0) > 0 }
            latestBf   = bfRows.last?.body_fat_percent
            earliestBf = bfRows.first?.body_fat_percent
            if let lb = latestBf, let eb = earliestBf {
                bfChange = lb - eb
            }

            // DOW patterns
            var dowBuckets: [[Double]] = Array(repeating: [], count: 7)
            for r in valid {
                let dow = Calendar.current.component(.weekday, from: dateFromString(r.date)) - 1
                if dow >= 0 && dow < 7, let w = r.weight_kg { dowBuckets[dow].append(w) }
            }
            _ = dowBuckets.compactMap { b -> Double? in
                guard !b.isEmpty else { return nil }
                return abs(b.reduce(0, +) / Double(b.count) - avgWeight)
            }.max() ?? 0.1

            dowData = dowBuckets.enumerated().map { i, bucket in
                let avg = bucket.isEmpty ? nil : bucket.reduce(0, +) / Double(bucket.count)
                return BodyDowStat(
                    label: dowLabels[i],
                    count: bucket.count,
                    avgWeight: avg,
                    diffFromAvg: avg.map { $0 - avgWeight }
                )
            }

            // Monthly
            var monthBuckets: [String: [Double]] = [:]
            var monthBfBuckets: [String: [Double]] = [:]
            for r in valid {
                let key = String(r.date.prefix(7))
                if let w = r.weight_kg { monthBuckets[key, default: []].append(w) }
                if let bf = r.body_fat_percent, bf > 0 { monthBfBuckets[key, default: []].append(bf) }
            }
            monthData = monthBuckets.keys.sorted().suffix(12).compactMap { key -> BodyMonthStat? in
                guard let bucket = monthBuckets[key] else { return nil }
                let parts = key.split(separator: "-")
                guard parts.count == 2, let m = Int(parts[1]), m >= 1, m <= 12 else { return nil }
                let bfBucket = monthBfBuckets[key] ?? []
                return BodyMonthStat(
                    label: monthLabels[m - 1],
                    count: bucket.count,
                    avgWeight: bucket.reduce(0, +) / Double(bucket.count),
                    minWeight: bucket.min() ?? 0,
                    maxWeight: bucket.max() ?? 0,
                    avgBf: bfBucket.isEmpty ? nil : bfBucket.reduce(0, +) / Double(bfBucket.count)
                )
            }
        } catch {
            print("[BodyTrendsView] loadData failed: \(error)")
        }
    }

    private func dateFromString(_ s: String) -> Date {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "UTC")
        return df.date(from: s) ?? Date()
    }
}

#Preview {
    NavigationStack { BodyTrendsView() }
}
