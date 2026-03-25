import SwiftUI
import Charts

// MARK: - VO2MonthStat

struct VO2MonthStat: Identifiable {
    let id = UUID()
    let label: String
    let year: Int
    let month: Int
    let avgVO2: Double
    let minVO2: Double
    let maxVO2: Double
    let count: Int
}

// MARK: - VO2PatternView

struct VO2PatternView: View {
    @State private var readings: [(value: Double, date: String)] = []
    @State private var isLoading = true

    private let monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // MARK: - Computed

    private var n: Int { readings.count }
    private var avgVO2: Double { n > 0 ? readings.reduce(0) { $0 + $1.value } / Double(n) : 0 }
    private var minVO2: Double { readings.map(\.value).min() ?? 0 }
    private var maxVO2: Double { readings.map(\.value).max() ?? 0 }
    private var latestVO2: Double? { readings.last?.value }

    private var trendDelta: Double? {
        guard readings.count >= 4 else { return nil }
        let half = readings.count / 2
        let firstAvg = readings.prefix(half).reduce(0) { $0 + $1.value } / Double(half)
        let lastAvg = readings.suffix(half).reduce(0) { $0 + $1.value } / Double(half)
        return lastAvg - firstAvg
    }

    private var monthStats: [VO2MonthStat] {
        var buckets: [String: [Double]] = [:]
        for r in readings {
            let key = String(r.date.prefix(7))
            buckets[key, default: []].append(r.value)
        }
        return buckets.sorted { $0.key < $1.key }.compactMap { key, vals in
            guard let monthNum = Int(key.suffix(2)),
                  let yearNum = Int(key.prefix(4)) else { return nil }
            let avg = vals.reduce(0, +) / Double(vals.count)
            return VO2MonthStat(
                label: monthLabels[monthNum - 1],
                year: yearNum,
                month: monthNum,
                avgVO2: avg,
                minVO2: vals.min() ?? avg,
                maxVO2: vals.max() ?? avg,
                count: vals.count
            )
        }
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
                    if monthStats.count >= 2 { monthChart }
                    levelTimeline
                    infoCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("VO₂ Max History")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let latestLevel = latestVO2.map { FitnessLevel.from(vo2Max: $0) }
        let avgStr = String(format: "%.1f", avgVO2)
        let trendStr = trendDelta.map { String(format: "%+.1f", $0) } ?? "—"
        let trendColor: Color = (trendDelta ?? 0) >= 1 ? .green : (trendDelta ?? 0) <= -1 ? .red : .secondary

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statCell(value: String(format: "%.1f", latestVO2 ?? 0),
                         label: "Latest",
                         sub: latestLevel?.label ?? "",
                         color: latestLevel?.color ?? .secondary)
                Divider().frame(height: 50)
                statCell(value: avgStr, label: "2-Year Avg", color: .purple)
                Divider().frame(height: 50)
                statCell(value: trendStr, label: "Trend", sub: "first→last half", color: trendColor)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(value: String(format: "%.1f", minVO2), label: "All-Time Low", color: .orange)
                Divider().frame(height: 50)
                statCell(value: String(format: "%.1f", maxVO2), label: "All-Time High", color: .green)
                Divider().frame(height: 50)
                statCell(value: "\(n)", label: "Readings", color: .secondary)
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

    // MARK: - Month Chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly VO₂ Max").font(.headline)
            Chart(monthStats) { m in
                LineMark(x: .value("Month", "\(m.label) \(m.year)"),
                         y: .value("Avg", m.avgVO2))
                    .foregroundStyle(FitnessLevel.from(vo2Max: m.avgVO2).color)
                    .symbol(.circle)
                    .interpolationMethod(.catmullRom)

                AreaMark(x: .value("Month", "\(m.label) \(m.year)"),
                         y: .value("Avg", m.avgVO2))
                    .foregroundStyle(FitnessLevel.from(vo2Max: m.avgVO2).color.opacity(0.08))
                    .interpolationMethod(.catmullRom)
            }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 6)) { _ in
                    AxisValueLabel()
                }
            }
            .chartYScale(domain: max(20, minVO2 - 3)...(maxVO2 + 3))
            .frame(height: 180)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Level Timeline

    private var levelTimeline: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Fitness Level History").font(.headline)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 4), spacing: 6) {
                ForEach(monthStats) { m in
                    let level = FitnessLevel.from(vo2Max: m.avgVO2)
                    VStack(spacing: 3) {
                        Text(String(format: "%.0f", m.avgVO2))
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(level.color.opacity(0.7))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        Text("\(m.label)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            // Legend
            HStack(spacing: 8) {
                ForEach([FitnessLevel.poor, .belowAverage, .average, .good, .excellent, .superior], id: \.label) { lvl in
                    HStack(spacing: 3) {
                        Circle().fill(lvl.color.opacity(0.7)).frame(width: 8, height: 8)
                        Text(lvl.label == "Below Average" ? "Below Avg" : lvl.label)
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.top, 2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("About VO₂ Max").font(.subheadline.weight(.semibold))
            Text("VO₂ Max (ml/kg/min) measures how much oxygen your body can use during intense exercise — a key marker of cardiovascular fitness and longevity.")
            Text("Apple Watch estimates VO₂ Max from heart rate and GPS pace during outdoor runs and walks.")
            Text("Higher VO₂ Max is associated with reduced cardiovascular disease risk and slower biological aging.")
                .padding(.top, 2)
        }
        .font(.caption)
        .foregroundStyle(.secondary)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "lungs.fill")
                .font(.system(size: 48)).foregroundStyle(.green.opacity(0.6))
            Text("No VO₂ Max History").font(.title3.bold())
            Text("Apple Watch estimates VO₂ Max during outdoor runs and hikes. Enable cardio fitness tracking and sync your data.")
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

        let twoYearsAgo = Calendar.current.date(byAdding: .year, value: -2, to: Date()) ?? Date()
        let iso = ISO8601DateFormatter()
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"

        struct Row: Decodable { let value: Double; let start_time: String }
        let rows: [Row] = (try? await SupabaseService.shared.client
            .from("health_records")
            .select("value, start_time")
            .eq("user_id", value: userId.uuidString)
            .eq("type", value: "vo2_max")
            .gte("start_time", value: iso.string(from: twoYearsAgo))
            .gt("value", value: 10)
            .lte("value", value: 80)
            .order("start_time", ascending: true)
            .execute()
            .value) ?? []

        // Weekly deduplicate
        var weekBuckets: [String: [Double]] = [:]
        for row in rows {
            if let d = iso.date(from: row.start_time) {
                let cal = Calendar.current
                let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d)
                let key = "\(comps.yearForWeekOfYear ?? 0)-W\(comps.weekOfYear ?? 0)"
                weekBuckets[key, default: []].append(row.value)
            }
        }
        // Get representative date for each week bucket
        var weeklyReadings: [(value: Double, date: String)] = []
        for row in rows {
            if let d = iso.date(from: row.start_time) {
                let cal = Calendar.current
                let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d)
                let key = "\(comps.yearForWeekOfYear ?? 0)-W\(comps.weekOfYear ?? 0)"
                if let bucket = weekBuckets[key] {
                    let avg = bucket.reduce(0, +) / Double(bucket.count)
                    weeklyReadings.append((value: avg, date: df.string(from: d)))
                    weekBuckets.removeValue(forKey: key)
                }
            }
        }
        readings = weeklyReadings.sorted { $0.date < $1.date }
    }
}

#Preview {
    NavigationStack { VO2PatternView() }
}
