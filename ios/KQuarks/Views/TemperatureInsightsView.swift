import SwiftUI
import Charts

// MARK: - Top-level models

struct TempNight: Identifiable {
    let id = UUID()
    let date: String
    let deviation: Double      // °C deviation from baseline
    let nextDayHrv: Double?
    let sleepHours: Double?
    var category: TempCategory {
        if deviation > 0.3 { return .elevated }
        if deviation < -0.3 { return .low }
        return .normal
    }
}

enum TempCategory {
    case elevated, normal, low
    var label: String {
        switch self {
        case .elevated: return "Elevated"
        case .normal: return "Normal"
        case .low: return "Low"
        }
    }
    var color: Color {
        switch self {
        case .elevated: return .orange
        case .normal: return .green
        case .low: return .blue
        }
    }
}

// MARK: - TemperatureInsightsView

struct TemperatureInsightsView: View {
    @State private var nights: [TempNight] = []
    @State private var isLoading = false

    // MARK: - Computed

    private var elevatedNights: [TempNight] { nights.filter { $0.category == .elevated } }
    private var normalNights: [TempNight] { nights.filter { $0.category == .normal } }
    private var lowNights: [TempNight] { nights.filter { $0.category == .low } }

    private var maxConsecElevated: Int {
        var max = 0
        var cur = 0
        for n in nights {
            if n.category == .elevated { cur += 1; max = Swift.max(max, cur) } else { cur = 0 }
        }
        return max
    }

    private var currentConsecElevated: Int {
        var count = 0
        for n in nights.reversed() {
            if n.category == .elevated { count += 1 } else { break }
        }
        return count
    }

    private var avgHrvByCategory: (elevated: Int?, normal: Int?, low: Int?) {
        let calc: ([TempNight]) -> Int? = { ns in
            let vals = ns.compactMap(\.nextDayHrv)
            guard !vals.isEmpty else { return nil }
            return Int(vals.reduce(0, +) / Double(vals.count))
        }
        return (calc(elevatedNights), calc(normalNights), calc(lowNights))
    }

    private var avgDeviation: Double {
        nights.isEmpty ? 0 : nights.reduce(0) { $0 + $1.deviation } / Double(nights.count)
    }

    // For chart: use last 60 nights max
    private var chartNights: [TempNight] { Array(nights.suffix(60)) }

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if nights.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryGrid
                    zoneCard
                    if currentConsecElevated >= 2 { elevatedAlert }
                    trendChart
                    if avgHrvByCategory.elevated != nil || avgHrvByCategory.normal != nil {
                        hrvCorrelationCard
                    }
                    infoCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Temperature Insights")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let avgStr = String(format: "%+.2f°C", avgDeviation)
        let avgColor: Color = avgDeviation > 0.3 ? .orange : avgDeviation < -0.3 ? .blue : .green
        let elevPct = nights.isEmpty ? 0 : Int(Double(elevatedNights.count) / Double(nights.count) * 100)
        return HStack(spacing: 0) {
            statCell(value: avgStr, label: "Avg Deviation", color: avgColor)
            Divider().frame(height: 50)
            statCell(value: "\(elevatedNights.count)", label: "Elevated Nights", sub: "> +0.3°C", color: .orange)
            Divider().frame(height: 50)
            statCell(value: "\(elevPct)%", label: "Normal Nights", sub: "±0.3°C", color: .green)
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
        let total = nights.count
        return VStack(alignment: .leading, spacing: 10) {
            Text("Nightly Temperature Distribution").font(.headline)
            zoneRow(label: "Elevated (> +0.3°C)", count: elevatedNights.count, total: total, color: .orange)
            zoneRow(label: "Normal (±0.3°C)", count: normalNights.count, total: total, color: .green)
            if lowNights.count > 0 {
                zoneRow(label: "Low (< -0.3°C)", count: lowNights.count, total: total, color: .blue)
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

    // MARK: - Elevated Alert

    private var elevatedAlert: some View {
        HStack(spacing: 10) {
            Image(systemName: "thermometer.sun.fill")
                .font(.title2).foregroundStyle(.orange)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(currentConsecElevated) consecutive elevated nights")
                    .font(.subheadline.bold()).foregroundStyle(.orange)
                Text("Consistent elevation may signal illness, ovulation, or elevated stress. Max streak: \(maxConsecElevated) nights.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.3), lineWidth: 1))
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Nightly Temperature Deviation").font(.headline)
            Chart(chartNights) { night in
                BarMark(x: .value("Date", night.date), y: .value("°C", night.deviation))
                    .foregroundStyle(night.category.color.opacity(0.7))
                    .cornerRadius(2)
            }
            .chartYAxis {
                AxisMarks(values: [-1, -0.5, 0, 0.5, 1]) { val in
                    AxisGridLine()
                    AxisValueLabel { if let d = val.as(Double.self) { Text(String(format: "%+.1f", d)) } }
                }
            }
            .chartXAxis(.hidden)
            .frame(height: 160)
            HStack(spacing: 16) {
                legendDot(.orange, "Elevated")
                legendDot(.green, "Normal")
                legendDot(.blue, "Low")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func legendDot(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color.opacity(0.7)).frame(width: 8, height: 8)
            Text(label)
        }
    }

    // MARK: - HRV Correlation Card

    private var hrvCorrelationCard: some View {
        let hrv = avgHrvByCategory
        return VStack(alignment: .leading, spacing: 10) {
            Text("HRV Correlation").font(.headline)
            Text("Average next-day HRV by temperature category")
                .font(.caption).foregroundStyle(.secondary)
            HStack(spacing: 8) {
                if let elev = hrv.elevated {
                    hrvBubble(label: "Elevated", ms: elev, color: .orange)
                }
                if let norm = hrv.normal {
                    hrvBubble(label: "Normal", ms: norm, color: .green)
                }
                if let low = hrv.low {
                    hrvBubble(label: "Low", ms: low, color: .blue)
                }
            }
            if let elev = hrv.elevated, let norm = hrv.normal, norm > 0 {
                let diff = norm - elev
                if diff > 0 {
                    Text("HRV is \(diff) ms higher on normal-temp nights vs elevated — suggesting elevated temp correlates with stress or illness.")
                        .font(.caption2).foregroundStyle(.secondary).padding(.top, 2)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func hrvBubble(label: String, ms: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            Text("\(ms) ms").font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Understanding Wrist Temperature").font(.subheadline.weight(.semibold))
            Label("> +0.3°C — May indicate illness, fever, ovulation, or stress", systemImage: "thermometer.sun.fill").foregroundStyle(.orange)
            Label("±0.3°C — Normal overnight variation", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
            Label("< -0.3°C — Common after intense exercise or in cold environments", systemImage: "snowflake").foregroundStyle(.blue)
            Text("Apple Watch Series 8 and later measure wrist temperature every second during sleep. Values shown are deviations from your personal baseline, not absolute temperature.")
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
            Image(systemName: "thermometer.medium")
                .font(.system(size: 48)).foregroundStyle(.orange.opacity(0.6))
            Text("No Temperature Data").font(.title3.bold())
            Text("Wrist temperature requires Apple Watch Series 8 or later with sleep tracking enabled.")
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

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let iso = ISO8601DateFormatter()
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let sinceDate = df.string(from: ninetyDaysAgo)

        // Fetch temp records
        struct TempRow: Decodable { let value: Double; let start_time: String }
        let tempRows: [TempRow] = (try? await SupabaseService.shared.client
            .from("health_records")
            .select("value, start_time")
            .eq("user_id", value: userId.uuidString)
            .eq("type", value: "wrist_temperature")
            .gte("start_time", value: iso.string(from: ninetyDaysAgo))
            .order("start_time", ascending: true)
            .execute()
            .value) ?? []

        // Fetch daily summaries for HRV and sleep
        struct SumRow: Decodable { let date: String; let avg_hrv: Double?; let sleep_duration_minutes: Int? }
        let sumRows: [SumRow] = (try? await SupabaseService.shared.client
            .from("daily_summaries")
            .select("date, avg_hrv, sleep_duration_minutes")
            .eq("user_id", value: userId.uuidString)
            .gte("date", value: sinceDate)
            .order("date", ascending: true)
            .execute()
            .value) ?? []

        // Deduplicate temp to one reading per night (first reading of the day)
        var tempByDay: [String: Double] = [:]
        for row in tempRows {
            let day = String(row.start_time.prefix(10))
            if tempByDay[day] == nil { tempByDay[day] = row.value }
        }

        // Index summaries by date
        var summaryByDate: [String: SumRow] = [:]
        for row in sumRows { summaryByDate[row.date] = row }

        // Build TempNight points
        nights = tempByDay.sorted { $0.key < $1.key }.map { date, dev in
            let nextDay = Calendar.current.date(byAdding: .day, value: 1, to: df.date(from: date) ?? Date()) ?? Date()
            let nextDayStr = df.string(from: nextDay)
            let todaySummary = summaryByDate[date]
            let nextDaySummary = summaryByDate[nextDayStr]
            return TempNight(
                date: date,
                deviation: dev,
                nextDayHrv: nextDaySummary?.avg_hrv,
                sleepHours: todaySummary?.sleep_duration_minutes.map { Double($0) / 60.0 }
            )
        }
    }
}

#Preview {
    NavigationStack { TemperatureInsightsView() }
}
