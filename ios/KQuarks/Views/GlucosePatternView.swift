import SwiftUI
import Charts

// MARK: - Top-level models

struct GlucoseDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgMgdl: Double?
    let inRangePct: Double?
}

struct GlucoseMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgMgdl: Double
    let inRangePct: Double
}

struct GlucoseRangeDist: Identifiable {
    let id = UUID()
    let label: String
    let range: String
    let count: Int
    let pct: Int
}

struct GlucoseTimePeriod: Identifiable {
    let id = UUID()
    let label: String
    let icon: String
    let time: String
    let avgMgdl: Double?
    let count: Int
}

// MARK: - GlucosePatternView

struct GlucosePatternView: View {
    @State private var totalReadings = 0
    @State private var avgMgdl: Double = 0
    @State private var minMgdl: Double = 0
    @State private var maxMgdl: Double = 0
    @State private var estA1c: Double = 0
    @State private var inRangePct: Double = 0
    @State private var rangeDist: [GlucoseRangeDist] = []
    @State private var dowData: [GlucoseDowStat] = []
    @State private var timePeriods: [GlucoseTimePeriod] = []
    @State private var monthData: [GlucoseMonthStat] = []
    @State private var isLoading = true

    private let targetLow: Double = 70
    private let targetHigh: Double = 140
    private let dowLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
    private let monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalReadings < 5 {
                    emptyState
                } else {
                    summaryCard
                    timeInRangeCard
                    if timePeriods.count >= 3 { timeOfDayCard }
                    if dowData.filter({ $0.count > 0 }).count >= 4 { dowChart }
                    if dowData.filter({ $0.count > 0 }).count >= 4 { inRangeByDowCard }
                    if monthData.count >= 2 { monthChart }
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Glucose Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Text("🩸").font(.system(size: 60))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Log at least 5 glucose readings to see patterns.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    // MARK: - Summary

    private var summaryCard: some View {
        HStack(spacing: 0) {
            VStack(spacing: 4) {
                Text(String(format: "%.0f", avgMgdl))
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(glucoseColor(avgMgdl))
                Text("Avg mg/dL")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Rectangle().fill(Color(.separator)).frame(width: 1, height: 50)

            VStack(spacing: 4) {
                Text(String(format: "%.0f%%", inRangePct))
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(inRangePct >= 70 ? .green : inRangePct >= 50 ? .yellow : .red)
                Text("In Range")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Rectangle().fill(Color(.separator)).frame(width: 1, height: 50)

            VStack(spacing: 4) {
                Text(String(format: "%.1f%%", estA1c))
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(a1cColor)
                Text("Est. A1C")
                    .font(.caption2).foregroundStyle(.secondary)
                Text(a1cLabel)
                    .font(.caption2).foregroundStyle(.tertiary)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var a1cColor: Color {
        if estA1c < 5.7 { return .green }
        if estA1c < 6.5 { return .yellow }
        return .red
    }

    private var a1cLabel: String {
        if estA1c < 5.7 { return "Normal" }
        if estA1c < 6.5 { return "Pre-diabetic" }
        return "High"
    }

    // MARK: - Time in range

    private var timeInRangeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Time in Range")
                .font(.headline)
            Text("ADA target: ≥70% in \(Int(targetLow))–\(Int(targetHigh)) mg/dL")
                .font(.caption)
                .foregroundStyle(.secondary)

            // Stacked visual bar
            GeometryReader { geo in
                HStack(spacing: 2) {
                    ForEach(rangeDist) { r in
                        if r.pct > 0 {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(rangeColor(r.label).opacity(0.8))
                                .frame(width: geo.size.width * CGFloat(r.pct) / 100, height: 20)
                        }
                    }
                }
            }
            .frame(height: 20)

            ForEach(rangeDist) { r in
                HStack(spacing: 10) {
                    Circle().fill(rangeColor(r.label)).frame(width: 10, height: 10)
                    Text(r.label)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(rangeColor(r.label))
                    Text(r.range + " mg/dL")
                        .font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    Text("\(r.pct)%").font(.caption.bold())
                    Text("(\(r.count))").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Time of day

    private var timeOfDayCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Time of Day Averages")
                .font(.headline)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 8) {
                ForEach(timePeriods) { p in
                    VStack(spacing: 4) {
                        Text(p.icon).font(.title3)
                        Text(p.label).font(.caption2).foregroundStyle(.secondary)
                        if let avg = p.avgMgdl {
                            Text(String(format: "%.0f", avg))
                                .font(.subheadline.bold())
                                .foregroundStyle(glucoseColor(avg))
                            Text("mg/dL").font(.caption2).foregroundStyle(.tertiary)
                        } else {
                            Text("—").font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - DOW chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Avg Glucose by Day of Week")
                .font(.headline)

            let withData = dowData.filter { $0.count > 0 && $0.avgMgdl != nil }
            Chart(withData) { d in
                if let avg = d.avgMgdl {
                    BarMark(x: .value("Day", d.label), y: .value("Glucose", avg))
                        .foregroundStyle(glucoseColor(avg).opacity(0.8))
                }
                RuleMark(y: .value("Target", targetHigh))
                    .foregroundStyle(.yellow.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 2]))
            }
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - In-range by DOW

    private var inRangeByDowCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("In-Range % by Day")
                .font(.headline)
            Text("Target ≥70%")
                .font(.caption).foregroundStyle(.secondary)

            ForEach(dowData.filter { $0.count > 0 }) { d in
                HStack(spacing: 8) {
                    Text(d.label)
                        .font(.caption).foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .leading)
                    GeometryReader { geo in
                        let pct = d.inRangePct ?? 0
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color(.tertiarySystemBackground)).frame(height: 8)
                            Capsule()
                                .fill(pct >= 70 ? Color.green : pct >= 50 ? Color.yellow : Color.red)
                                .frame(width: geo.size.width * pct / 100, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text(d.inRangePct.map { String(format: "%.0f%%", $0) } ?? "—")
                        .font(.caption2.bold())
                        .frame(width: 32, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Monthly Glucose Trend")
                .font(.headline)

            Chart(monthData) { m in
                LineMark(x: .value("Month", m.label), y: .value("Glucose", m.avgMgdl))
                    .foregroundStyle(.blue)
                    .interpolationMethod(.catmullRom)
                PointMark(x: .value("Month", m.label), y: .value("Glucose", m.avgMgdl))
                    .foregroundStyle(.blue)
                RuleMark(y: .value("Target High", targetHigh))
                    .foregroundStyle(.yellow.opacity(0.4))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 2]))
            }
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Helpers

    private func glucoseColor(_ mgdl: Double) -> Color {
        if mgdl < targetLow { return .red }
        if mgdl <= targetHigh { return .green }
        if mgdl <= 180 { return .yellow }
        return .red
    }

    private func rangeColor(_ label: String) -> Color {
        switch label {
        case "Low": return .red
        case "In Range": return .green
        case "Elevated": return .yellow
        case "High": return Color.red.opacity(0.8)
        default: return .secondary
        }
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            guard let userId = SupabaseService.shared.currentSession?.user.id else { return }
            let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
            let startStr = ISO8601DateFormatter().string(from: oneYearAgo)

            struct GlucoseRow: Decodable {
                let value: Double
                let start_time: String
            }

            let rows: [GlucoseRow] = try await SupabaseService.shared.client
                .from("health_records")
                .select("value, start_time")
                .eq("user_id", value: userId.uuidString)
                .eq("type", value: "blood_glucose")
                .gte("start_time", value: startStr)
                .gt("value", value: 30)
                .lt("value", value: 600)
                .order("start_time", ascending: true)
                .execute()
                .value

            struct GlucoseReading {
                let mgdl: Double
                let date: String
                let dow: Int
                let hour: Int
                let month: String
            }

            let fmt = ISO8601DateFormatter()
            var readings: [GlucoseReading] = []
            for r in rows {
                guard let dt = fmt.date(from: r.start_time) else { continue }
                readings.append(GlucoseReading(
                    mgdl: r.value,
                    date: String(r.start_time.prefix(10)),
                    dow: Calendar.current.component(.weekday, from: dt) - 1,
                    hour: Calendar.current.component(.hour, from: dt),
                    month: String(r.start_time.prefix(7))
                ))
            }

            totalReadings = readings.count
            guard totalReadings >= 5 else { return }

            let n = Double(readings.count)
            let allMgdl = readings.map(\.mgdl)
            avgMgdl = allMgdl.reduce(0, +) / n
            minMgdl = allMgdl.min() ?? 0
            maxMgdl = allMgdl.max() ?? 0
            estA1c = (avgMgdl + 46.7) / 28.7

            let inRangeCount = readings.filter { $0.mgdl >= targetLow && $0.mgdl <= targetHigh }.count
            inRangePct = Double(inRangeCount) / n * 100

            // Range distribution
            let lowCount = readings.filter { $0.mgdl < targetLow }.count
            let elevCount = readings.filter { $0.mgdl > targetHigh && $0.mgdl <= 180 }.count
            let highCount = readings.filter { $0.mgdl > 180 }.count
            rangeDist = [
                GlucoseRangeDist(label: "Low", range: "<\(Int(targetLow))", count: lowCount, pct: Int(Double(lowCount)/n*100)),
                GlucoseRangeDist(label: "In Range", range: "\(Int(targetLow))–\(Int(targetHigh))", count: inRangeCount, pct: Int(Double(inRangeCount)/n*100)),
                GlucoseRangeDist(label: "Elevated", range: "\(Int(targetHigh)+1)–180", count: elevCount, pct: Int(Double(elevCount)/n*100)),
                GlucoseRangeDist(label: "High", range: ">180", count: highCount, pct: Int(Double(highCount)/n*100)),
            ]

            // DOW
            var dowBuckets: [[GlucoseReading]] = Array(repeating: [], count: 7)
            for r in readings { if r.dow >= 0 && r.dow < 7 { dowBuckets[r.dow].append(r) } }
            dowData = dowBuckets.enumerated().map { i, bucket in
                let bn = Double(bucket.count)
                let avg = bucket.isEmpty ? nil : bucket.reduce(0) { $0 + $1.mgdl } / bn
                let inR = bucket.isEmpty ? nil : Double(bucket.filter { $0.mgdl >= targetLow && $0.mgdl <= targetHigh }.count) / bn * 100
                return GlucoseDowStat(label: dowLabels[i], count: bucket.count, avgMgdl: avg, inRangePct: inR)
            }

            // Time periods
            func period(_ label: String, _ icon: String, _ time: String, _ filter: (GlucoseReading) -> Bool) -> GlucoseTimePeriod {
                let rds = readings.filter(filter)
                let avg = rds.isEmpty ? nil : rds.reduce(0) { $0 + $1.mgdl } / Double(rds.count)
                return GlucoseTimePeriod(label: label, icon: icon, time: time, avgMgdl: avg, count: rds.count)
            }
            timePeriods = [
                period("Fasting", "🌅", "5–9am", { $0.hour >= 5 && $0.hour < 9 }),
                period("Morning", "☀️", "9–12pm", { $0.hour >= 9 && $0.hour < 12 }),
                period("Afternoon", "🌤️", "12–5pm", { $0.hour >= 12 && $0.hour < 17 }),
                period("Evening", "🌆", "5–10pm", { $0.hour >= 17 && $0.hour < 22 }),
                period("Night", "🌙", "10pm+", { $0.hour >= 22 || $0.hour < 5 }),
            ].filter { $0.count > 0 }

            // Monthly
            var monthBuckets: [String: [GlucoseReading]] = [:]
            for r in readings { monthBuckets[r.month, default: []].append(r) }
            monthData = monthBuckets.keys.sorted().suffix(12).compactMap { key -> GlucoseMonthStat? in
                guard let bucket = monthBuckets[key] else { return nil }
                let parts = key.split(separator: "-")
                guard parts.count == 2, let m = Int(parts[1]), m >= 1, m <= 12 else { return nil }
                let bn = Double(bucket.count)
                let avg = bucket.reduce(0) { $0 + $1.mgdl } / bn
                let inR = Double(bucket.filter { $0.mgdl >= targetLow && $0.mgdl <= targetHigh }.count) / bn * 100
                return GlucoseMonthStat(label: monthLabels[m-1], count: bucket.count, avgMgdl: avg, inRangePct: inR)
            }
        } catch {
            print("[GlucosePatternView] loadData failed: \(error)")
        }
    }
}

#Preview {
    NavigationStack { GlucosePatternView() }
}
