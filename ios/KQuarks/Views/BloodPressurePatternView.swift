import SwiftUI
import Charts

// MARK: - Top-level models

struct BPDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgSys: Double?
    let avgDia: Double?
}

struct BPMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgSys: Double
    let avgDia: Double
}

struct BPCategoryDist: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let pct: Int
}

struct BPTimePeriod: Identifiable {
    let id = UUID()
    let label: String
    let icon: String
    let count: Int
    let avgSys: Double
    let avgDia: Double
}

// MARK: - BloodPressurePatternView

struct BloodPressurePatternView: View {
    @State private var totalReadings = 0
    @State private var avgSys: Double = 0
    @State private var avgDia: Double = 0
    @State private var avgPulse: Double = 0
    @State private var latestCategory = ""
    @State private var dowData: [BPDowStat] = []
    @State private var timePeriods: [BPTimePeriod] = []
    @State private var monthData: [BPMonthStat] = []
    @State private var categoryDist: [BPCategoryDist] = []
    @State private var isLoading = true

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
                    categoryCard
                    if timePeriods.count >= 2 { timeOfDayCard }
                    if dowData.filter({ $0.count > 0 }).count >= 4 { dowChart }
                    if monthData.count >= 2 { monthChart }
                    if monthData.count >= 2 { monthTable }
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("BP Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Text("🩺").font(.system(size: 60))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Log at least 5 blood pressure readings to see patterns.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    // MARK: - Summary

    private var summaryCard: some View {
        HStack(spacing: 12) {
            VStack(spacing: 4) {
                Text(String(format: "%.0f", avgSys))
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(.red)
                Text("Systolic")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Text("/").font(.title.bold()).foregroundStyle(.secondary)

            VStack(spacing: 4) {
                Text(String(format: "%.0f", avgDia))
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(.orange)
                Text("Diastolic")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Divider().frame(height: 50)

            VStack(spacing: 4) {
                Text(latestCategory)
                    .font(.subheadline.bold())
                    .foregroundStyle(categoryColor(latestCategory))
                Text("Latest stage")
                    .font(.caption2).foregroundStyle(.secondary)
                Text("\(totalReadings) readings")
                    .font(.caption2).foregroundStyle(.tertiary)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Category distribution

    private var categoryCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Reading Classification")
                .font(.headline)

            ForEach(categoryDist) { cat in
                HStack(spacing: 10) {
                    Text(cat.label)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(categoryColor(cat.label))
                        .frame(width: 55, alignment: .leading)

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color(.tertiarySystemBackground)).frame(height: 10)
                            Capsule()
                                .fill(categoryColor(cat.label).opacity(0.7))
                                .frame(width: geo.size.width * CGFloat(cat.pct) / 100, height: 10)
                        }
                    }
                    .frame(height: 10)

                    Text("\(cat.pct)%")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .trailing)
                    Text("\(cat.count)")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .frame(width: 20, alignment: .trailing)
                }
            }

            Text("Normal <120/80 · Elevated 120–129 · Stage 1 130–139 · Stage 2 ≥140")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Time of day

    private var timeOfDayCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Time of Day Patterns")
                .font(.headline)

            HStack(spacing: 12) {
                ForEach(timePeriods) { p in
                    VStack(spacing: 6) {
                        Text(p.icon).font(.title2)
                        Text(p.label).font(.caption2).foregroundStyle(.secondary)
                        Text(String(format: "%.0f/%.0f", p.avgSys, p.avgDia))
                            .font(.subheadline.bold())
                            .foregroundStyle(categoryColor(classifyBP(p.avgSys, p.avgDia)))
                        Text("\(p.count)").font(.caption2).foregroundStyle(.tertiary)
                    }
                    .frame(maxWidth: .infinity)
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
            Text("Average BP by Day of Week")
                .font(.headline)

            Chart {
                ForEach(dowData.filter { $0.count > 0 }) { d in
                    if let sys = d.avgSys {
                        BarMark(x: .value("Day", d.label), y: .value("Systolic", sys))
                            .foregroundStyle(.red.opacity(0.7))
                            .position(by: .value("Metric", "Systolic"))
                    }
                    if let dia = d.avgDia {
                        BarMark(x: .value("Day", d.label), y: .value("Diastolic", dia))
                            .foregroundStyle(.orange.opacity(0.7))
                            .position(by: .value("Metric", "Diastolic"))
                    }
                }
            }
            .frame(height: 160)
            .chartYScale(domain: { () -> ClosedRange<Double> in
                let allSys = dowData.compactMap(\.avgSys)
                let allDia = dowData.compactMap(\.avgDia)
                let minVal = min((allDia.min() ?? 60) - 5, 60.0)
                let maxVal = max((allSys.max() ?? 140) + 5, 140.0)
                return minVal...maxVal
            }())

            HStack(spacing: 16) {
                Label("Systolic", systemImage: "circle.fill").foregroundStyle(.red.opacity(0.8)).font(.caption)
                Label("Diastolic", systemImage: "circle.fill").foregroundStyle(.orange.opacity(0.8)).font(.caption)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Monthly BP Trend")
                .font(.headline)

            Chart(monthData) { m in
                LineMark(x: .value("Month", m.label), y: .value("Systolic", m.avgSys))
                    .foregroundStyle(.red)
                    .interpolationMethod(.catmullRom)
                PointMark(x: .value("Month", m.label), y: .value("Systolic", m.avgSys))
                    .foregroundStyle(.red)

                LineMark(x: .value("Month", m.label), y: .value("Diastolic", m.avgDia))
                    .foregroundStyle(.orange)
                    .interpolationMethod(.catmullRom)
                PointMark(x: .value("Month", m.label), y: .value("Diastolic", m.avgDia))
                    .foregroundStyle(.orange)
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
                            Text(String(format: "%.0f/%.0f mmHg", m.avgSys, m.avgDia))
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(categoryColor(classifyBP(m.avgSys, m.avgDia)))
                        }
                        Spacer()
                        Text(classifyBP(m.avgSys, m.avgDia))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(categoryColor(classifyBP(m.avgSys, m.avgDia)))
                        Text("\(m.count) readings")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .padding(.leading, 8)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 10)
                    if i < monthData.count - 1 { Divider().padding(.leading) }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    // MARK: - Helpers

    private func classifyBP(_ sys: Double, _ dia: Double) -> String {
        if sys < 120 && dia < 80 { return "Normal" }
        if sys < 130 && dia < 80 { return "Elevated" }
        if sys < 140 || dia < 90 { return "Stage 1" }
        return "Stage 2"
    }

    private func categoryColor(_ cat: String) -> Color {
        switch cat {
        case "Normal":  return .green
        case "Elevated":return .yellow
        case "Stage 1": return .orange
        case "Stage 2": return .red
        default:        return .secondary
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

            struct BPRow: Decodable {
                let type: String
                let value: Double
                let start_time: String
            }

            let rows: [BPRow] = try await SupabaseService.shared.client
                .from("health_records")
                .select("type, value, start_time")
                .eq("user_id", value: userId.uuidString)
                .in("type", values: ["blood_pressure_systolic", "blood_pressure_diastolic"])
                .gte("start_time", value: startStr)
                .gt("value", value: 0)
                .order("start_time", ascending: true)
                .execute()
                .value

            let sysRows = rows.filter { $0.type == "blood_pressure_systolic" && $0.value > 60 && $0.value < 250 }
            let diaRows = rows.filter { $0.type == "blood_pressure_diastolic" && $0.value > 30 && $0.value < 150 }

            struct BPReading {
                let timestamp: Date
                let date: String
                let sys: Double
                let dia: Double
                let dow: Int
                let hour: Int
            }

            let fmt = ISO8601DateFormatter()
            var readings: [BPReading] = []
            for s in sysRows {
                guard let st = fmt.date(from: s.start_time) else { continue }
                guard let match = diaRows.first(where: { r in
                    guard let dt = fmt.date(from: r.start_time) else { return false }
                    return abs(st.timeIntervalSince(dt)) < 90
                }) else { continue }
                let dow = Calendar.current.component(.weekday, from: st) - 1
                let hour = Calendar.current.component(.hour, from: st)
                readings.append(BPReading(
                    timestamp: st,
                    date: s.start_time.prefix(10).description,
                    sys: s.value,
                    dia: match.value,
                    dow: dow,
                    hour: hour
                ))
            }

            totalReadings = readings.count
            guard totalReadings >= 5 else { return }

            let n = Double(readings.count)
            avgSys = readings.reduce(0) { $0 + $1.sys } / n
            avgDia = readings.reduce(0) { $0 + $1.dia } / n
            avgPulse = avgSys - avgDia

            if let last = readings.last {
                latestCategory = classifyBP(last.sys, last.dia)
            }

            // DOW
            var dowBuckets: [[BPReading]] = Array(repeating: [], count: 7)
            for r in readings { if r.dow >= 0 && r.dow < 7 { dowBuckets[r.dow].append(r) } }
            dowData = dowBuckets.enumerated().map { i, bucket in
                let bn = Double(bucket.count)
                return BPDowStat(
                    label: dowLabels[i],
                    count: bucket.count,
                    avgSys: bucket.isEmpty ? nil : bucket.reduce(0) { $0 + $1.sys } / bn,
                    avgDia: bucket.isEmpty ? nil : bucket.reduce(0) { $0 + $1.dia } / bn
                )
            }

            // Time of day
            func period(_ label: String, _ icon: String, _ filter: (BPReading) -> Bool) -> BPTimePeriod? {
                let rds = readings.filter(filter)
                guard !rds.isEmpty else { return nil }
                let nn = Double(rds.count)
                return BPTimePeriod(
                    label: label, icon: icon, count: rds.count,
                    avgSys: rds.reduce(0) { $0 + $1.sys } / nn,
                    avgDia: rds.reduce(0) { $0 + $1.dia } / nn
                )
            }
            timePeriods = [
                period("Morning", "🌅", { $0.hour >= 6 && $0.hour < 12 }),
                period("Afternoon", "☀️", { $0.hour >= 12 && $0.hour < 18 }),
                period("Evening", "🌆", { $0.hour >= 18 && $0.hour < 23 }),
                period("Night", "🌙", { $0.hour < 6 || $0.hour >= 23 }),
            ].compactMap { $0 }

            // Monthly
            var monthBuckets: [String: [BPReading]] = [:]
            for r in readings {
                let key = String(r.date.prefix(7))
                monthBuckets[key, default: []].append(r)
            }
            monthData = monthBuckets.keys.sorted().suffix(12).compactMap { key -> BPMonthStat? in
                guard let bucket = monthBuckets[key] else { return nil }
                let parts = key.split(separator: "-")
                guard parts.count == 2, let m = Int(parts[1]), m >= 1, m <= 12 else { return nil }
                let bn = Double(bucket.count)
                return BPMonthStat(
                    label: monthLabels[m - 1],
                    count: bucket.count,
                    avgSys: bucket.reduce(0) { $0 + $1.sys } / bn,
                    avgDia: bucket.reduce(0) { $0 + $1.dia } / bn
                )
            }

            // Categories
            let categories = ["Normal", "Elevated", "Stage 1", "Stage 2"]
            categoryDist = categories.map { cat in
                let count = readings.filter { classifyBP($0.sys, $0.dia) == cat }.count
                return BPCategoryDist(
                    label: cat,
                    count: count,
                    pct: Int(Double(count) / n * 100)
                )
            }
        } catch {
            print("[BloodPressurePatternView] loadData failed: \(error)")
        }
    }
}

#Preview {
    NavigationStack { BloodPressurePatternView() }
}
