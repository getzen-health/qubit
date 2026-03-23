import SwiftUI
import Charts

// MARK: - Top-level models

struct FloorsDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgFloors: Double?
    let goalPct: Int?
}

struct FloorsMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avgFloors: Double
    let maxFloors: Int
    let goalPct: Int
    let count: Int
}

struct FloorsDistBucket: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
}

// MARK: - FloorsPatternView

struct FloorsPatternView: View {
    @State private var days: [(floors: Int, date: String)] = []
    @State private var isLoading = false

    private let goal = 10
    private let dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // MARK: - Computed

    private var n: Int { days.count }
    private var avgFloors: Double { n > 0 ? Double(days.reduce(0) { $0 + $1.floors }) / Double(n) : 0 }
    private var maxFloors: Int { days.map(\.floors).max() ?? 0 }
    private var totalFloors: Int { days.reduce(0) { $0 + $1.floors } }
    private var goalDays: Int { days.filter { $0.floors >= goal }.count }

    private var currentStreak: Int {
        var count = 0
        for d in days.reversed() {
            if d.floors >= goal { count += 1 } else { break }
        }
        return count
    }

    private var longestStreak: Int {
        var max = 0
        var cur = 0
        for d in days {
            if d.floors >= goal { cur += 1; max = Swift.max(max, cur) } else { cur = 0 }
        }
        return max
    }

    private var distBuckets: [FloorsDistBucket] {
        let defs: [(label: String, min: Int, max: Int)] = [
            ("1–4", 1, 4), ("5–9", 5, 9), ("10–14", 10, 14),
            ("15–19", 15, 19), ("20–29", 20, 29), ("30+", 30, Int.max)
        ]
        return defs.compactMap { def in
            let count = days.filter { $0.floors >= def.min && $0.floors <= def.max }.count
            return count > 0 ? FloorsDistBucket(label: def.label, count: count) : nil
        }
    }

    private var dowStats: [FloorsDowStat] {
        var buckets: [[Int]] = Array(repeating: [], count: 7)
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let cal = Calendar.current
        for d in days {
            if let date = df.date(from: d.date) {
                let weekday = cal.component(.weekday, from: date) - 1
                buckets[weekday].append(d.floors)
            }
        }
        return dow.enumerated().map { i, label in
            let b = buckets[i]
            let avg = b.isEmpty ? nil : Double(b.reduce(0, +)) / Double(b.count)
            let gp = b.isEmpty ? nil : Int(Double(b.filter { $0 >= goal }.count) / Double(b.count) * 100)
            return FloorsDowStat(label: label, count: b.count, avgFloors: avg, goalPct: gp)
        }
    }

    private var monthStats: [FloorsMonthStat] {
        var buckets: [String: [Int]] = [:]
        for d in days {
            let key = String(d.date.prefix(7))
            buckets[key, default: []].append(d.floors)
        }
        return buckets.sorted { $0.key < $1.key }.suffix(12).compactMap { key, vals in
            guard let monthNum = Int(key.suffix(2)) else { return nil }
            let avg = Double(vals.reduce(0, +)) / Double(vals.count)
            let mx = vals.max() ?? 0
            let gp = Int(Double(vals.filter { $0 >= goal }.count) / Double(vals.count) * 100)
            return FloorsMonthStat(label: months[monthNum - 1], avgFloors: avg, maxFloors: mx, goalPct: gp, count: vals.count)
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
                    streakCard
                    if distBuckets.count >= 3 { distributionChart }
                    if dowStats.filter({ $0.count > 0 }).count >= 4 { dowChart }
                    if monthStats.count >= 2 { monthChart }
                    infoCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Floors Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let avgStr = String(format: "%.1f", avgFloors)
        let goalPctInt = n > 0 ? Int(Double(goalDays) / Double(n) * 100) : 0
        let goalColor: Color = goalPctInt >= 70 ? .green : goalPctInt >= 40 ? .yellow : .orange
        return HStack(spacing: 0) {
            statCell(value: avgStr, label: "Avg Floors/Day", color: .purple)
            Divider().frame(height: 50)
            statCell(value: "\(goalPctInt)%", label: "Goal Days", sub: "≥ \(goal) floors", color: goalColor)
            Divider().frame(height: 50)
            statCell(value: "\(maxFloors)", label: "Best Day", color: .purple)
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

    // MARK: - Streak Card

    private var streakCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Goal Streaks").font(.headline)
            HStack(spacing: 12) {
                VStack(spacing: 4) {
                    Text("\(currentStreak)").font(.title2.bold()).foregroundStyle(.purple)
                    Text("Current streak").font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))

                VStack(spacing: 4) {
                    Text("\(longestStreak)").font(.title2.bold()).foregroundStyle(.purple)
                    Text("Longest streak").font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            let goalPctInt = n > 0 ? Int(Double(goalDays) / Double(n) * 100) : 0
            VStack(spacing: 4) {
                HStack {
                    Text("Goal achievement: \(goalPctInt)%").font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    Text("\(goalDays)/\(n) days").font(.caption2).foregroundStyle(.secondary)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 6).fill(Color(.systemFill)).frame(height: 12)
                        RoundedRectangle(cornerRadius: 6).fill(Color.purple.opacity(0.7))
                            .frame(width: geo.size.width * CGFloat(goalPctInt) / 100, height: 12)
                    }
                }
                .frame(height: 12)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Distribution Chart

    private var distributionChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Daily Floors Distribution").font(.headline)
            Chart(distBuckets) { b in
                BarMark(x: .value("Range", b.label), y: .value("Days", b.count))
                    .foregroundStyle(Color.purple.opacity(0.75))
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
            Text("Avg Floors by Day").font(.headline)
            Chart(dowStats.filter { $0.count > 0 }) { d in
                if let avg = d.avgFloors {
                    BarMark(x: .value("Day", d.label), y: .value("Floors", avg))
                        .foregroundStyle(Color.purple.opacity(0.75))
                        .cornerRadius(4)
                }
            }
            .chartYScale(domain: 0...Double(maxFloors + 3))
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Avg Floors").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Avg", m.avgFloors))
                        .foregroundStyle(.purple)
                        .symbol(.circle)
                        .interpolationMethod(.catmullRom)
                }
                RuleMark(y: .value("Goal", Double(goal)))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.purple.opacity(0.5))
            }
            .chartYScale(domain: 0...Double(maxFloors + 3))
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("About Floors Climbed").font(.subheadline.weight(.semibold))
            Text("Apple Watch detects stair climbing using the barometric altimeter and accelerometer.")
            Text("1 floor ≈ 3 meters of elevation gain")
            Text("\(goal) floors/day is the Apple Watch default goal (~30m elevation)")
            Text("Stair climbing burns more calories per minute than jogging and is excellent for cardiovascular health.")
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
            Image(systemName: "figure.stairs")
                .font(.system(size: 48)).foregroundStyle(.purple.opacity(0.6))
            Text("No Floors Data").font(.title3.bold())
            Text("Floors climbed data requires Apple Watch with barometric altimeter (Series 3 or later).")
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

        struct Row: Decodable { let date: String; let floors_climbed: Int? }
        let rows: [Row] = (try? await SupabaseService.shared.client
            .from("daily_summaries")
            .select("date, floors_climbed")
            .eq("user_id", value: userId.uuidString)
            .gte("date", value: df.string(from: oneYearAgo))
            .gt("floors_climbed", value: 0)
            .order("date", ascending: true)
            .execute()
            .value) ?? []

        days = rows.compactMap { row in
            guard let f = row.floors_climbed else { return nil }
            return (floors: f, date: row.date)
        }
    }
}

#Preview {
    NavigationStack { FloorsPatternView() }
}
