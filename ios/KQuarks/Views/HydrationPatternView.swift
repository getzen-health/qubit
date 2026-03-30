import SwiftUI
import Charts

// MARK: - Models

struct HydDowStat: Identifiable {
    let id = UUID()
    let label: String
    let dow: Int
    let avg: Double
    let hitRate: Double // 0–1
    let count: Int
}

struct HydMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avg: Double
    let hitRate: Double
    let count: Int
}

struct HydDistBucket: Identifiable {
    let id = UUID()
    let label: String
    let minMl: Double
    let maxMl: Double
    let count: Int
    let pct: Double
    let isGoal: Bool
}

// MARK: - HydrationPatternView

struct HydrationPatternView: View {
    @State private var dowStats: [HydDowStat] = []
    @State private var monthStats: [HydMonthStat] = []
    @State private var distBuckets: [HydDistBucket] = []
    @State private var targetMl: Double = 2500
    @State private var avgDaily: Double = 0
    @State private var goalRate: Double = 0
    @State private var totalDays: Int = 0
    @State private var goalDays: Int = 0
    @State private var currentStreak: Int = 0
    @State private var longestStreak: Int = 0
    @State private var bestDayMl: Double = 0
    @State private var bestDayDate: Date? = nil
    @State private var avgWorkoutDay: Double? = nil
    @State private var avgRestDay: Double? = nil
    @State private var isLoading = true

    private let dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    private func fmt(_ ml: Double) -> String {
        if ml >= 1000 { return String(format: "%.1fL", ml / 1000) }
        return String(format: "%.0fml", ml)
    }

    private func goalColor(_ ml: Double) -> Color {
        let pct = ml / targetMl
        if pct >= 1.0 { return .green }
        if pct >= 0.75 { return .blue }
        if pct >= 0.5 { return .orange }
        return .red
    }

    private var bestDow: HydDowStat? { dowStats.filter { $0.count > 0 }.max(by: { $0.avg < $1.avg }) }
    private var worstDow: HydDowStat? { dowStats.filter { $0.count > 0 }.min(by: { $0.avg < $1.avg }) }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalDays < 5 {
                    emptyState
                } else {
                    summaryRow
                    dowChart
                    goalRateBars
                    if monthStats.count >= 3 { monthTrendChart }
                    if avgWorkoutDay != nil { workoutVsRestCard }
                    distributionCard
                    tipsCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Hydration Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary

    private var summaryRow: some View {
        HStack(spacing: 12) {
            statBubble(title: "Daily Avg", value: fmt(avgDaily),
                       sub: "Goal: \(fmt(targetMl))", color: goalColor(avgDaily))
            statBubble(title: "Goal Rate", value: "\(Int(goalRate * 100))%",
                       sub: "\(goalDays)/\(totalDays) days",
                       color: goalRate >= 0.7 ? .green : goalRate >= 0.5 ? .orange : .red)
            statBubble(title: "Streak", value: "\(currentStreak)d",
                       sub: "Longest: \(longestStreak)d", color: .blue)
        }
    }

    private func statBubble(title: String, value: String, sub: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(color)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("By Day of Week")
                .font(.subheadline.weight(.semibold))
            Text("Average intake for each weekday")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart(dowStats) { stat in
                BarMark(
                    x: .value("Day", stat.label),
                    y: .value("ml", stat.avg)
                )
                .foregroundStyle(goalColor(stat.avg))
                .cornerRadius(4)

                RuleMark(y: .value("Goal", targetMl))
                    .foregroundStyle(.green.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Goal")
                            .font(.caption2)
                            .foregroundStyle(.green)
                    }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            Text(v >= 1000 ? String(format: "%.1fL", v / 1000) : String(format: "%.0f", v))
                                .font(.caption2)
                        }
                    }
                    AxisGridLine()
                }
            }
            .frame(height: 180)

            if let best = bestDow, let worst = worstDow {
                HStack(spacing: 12) {
                    bestWorstChip(label: "Best", day: best.label,
                                  ml: best.avg, rate: best.hitRate, color: .green)
                    bestWorstChip(label: "Worst", day: worst.label,
                                  ml: worst.avg, rate: worst.hitRate, color: .red)
                }
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func bestWorstChip(label: String, day: String,
                                ml: Double, rate: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(day)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(color)
            Text("\(fmt(ml)) · \(Int(rate * 100))% hit rate")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Goal Rate Bars

    private var goalRateBars: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Goal Achievement by Day")
                .font(.subheadline.weight(.semibold))
            Text("% of days reaching the \(fmt(targetMl)) target")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(dowStats.filter { $0.count > 0 }) { stat in
                HStack(spacing: 8) {
                    Text(stat.label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(.systemFill))
                                .frame(height: 8)
                            let barColor: Color = stat.hitRate >= 0.7 ? .green
                                : stat.hitRate >= 0.5 ? .blue
                                : stat.hitRate >= 0.3 ? .orange : .red
                            RoundedRectangle(cornerRadius: 4)
                                .fill(barColor)
                                .frame(width: geo.size.width * stat.hitRate, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(Int(stat.hitRate * 100))%")
                        .font(.caption)
                        .foregroundStyle(.primary)
                        .frame(width: 34, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Trend

    private var monthTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Trend")
                .font(.subheadline.weight(.semibold))
            Text("Average daily intake per month")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart(monthStats) { stat in
                LineMark(
                    x: .value("Month", stat.label),
                    y: .value("ml", stat.avg)
                )
                .interpolationMethod(.catmullRom)
                .foregroundStyle(Color.blue)

                PointMark(
                    x: .value("Month", stat.label),
                    y: .value("ml", stat.avg)
                )
                .foregroundStyle(goalColor(stat.avg))
                .symbolSize(50)

                RuleMark(y: .value("Goal", targetMl))
                    .foregroundStyle(.green.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Goal").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            Text(v >= 1000 ? String(format: "%.1fL", v / 1000) : String(format: "%.0f", v))
                                .font(.caption2)
                        }
                    }
                    AxisGridLine()
                }
            }
            .frame(height: 160)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Workout vs Rest

    private var workoutVsRestCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Workout Days vs Rest Days")
                .font(.subheadline.weight(.semibold))

            HStack(spacing: 16) {
                if let wd = avgWorkoutDay {
                    comparisonBubble(emoji: "🏋️", label: "Workout Days", ml: wd)
                }
                if let rd = avgRestDay {
                    comparisonBubble(emoji: "🛋️", label: "Rest Days", ml: rd)
                }
            }

            if let wd = avgWorkoutDay, let rd = avgRestDay {
                let diff = abs(wd - rd)
                let more = wd > rd ? "workout days" : "rest days"
                Text("You drink \(fmt(diff)) more on \(more)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.top, 2)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func comparisonBubble(emoji: String, label: String, ml: Double) -> some View {
        VStack(spacing: 6) {
            Text(emoji).font(.title2)
            Text(fmt(ml))
                .font(.title3.weight(.bold))
                .foregroundStyle(goalColor(ml))
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color.premiumSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Distribution

    private var distributionCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Intake Distribution")
                .font(.subheadline.weight(.semibold))
            Text("How your daily intake is spread across ranges")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(distBuckets) { bucket in
                HStack(spacing: 8) {
                    Text(bucket.label)
                        .font(.caption)
                        .foregroundStyle(bucket.isGoal ? Color.green : Color.secondary)
                        .frame(width: 62, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(.systemFill))
                                .frame(height: 10)
                            let barColor: Color = bucket.isGoal ? .green
                                : bucket.maxMl <= targetMl * 0.5 ? .red
                                : bucket.maxMl <= targetMl ? .orange : .green
                            RoundedRectangle(cornerRadius: 4)
                                .fill(barColor)
                                .frame(width: geo.size.width * bucket.pct / 100, height: 10)
                                .opacity(0.8)
                        }
                    }
                    .frame(height: 10)
                    Text("\(bucket.count)d")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .trailing)
                }
            }

            if let date = bestDayDate {
                Text("Best day: \(fmt(bestDayMl)) on \(date.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.top, 4)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Tips

    private var tipsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Hydration Tips", systemImage: "lightbulb.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.blue)

            let tips = [
                "Spread intake evenly through the day rather than large amounts at once",
                "Add ~500ml extra on workout days to replace sweat losses",
                "Pale yellow urine is a simple indicator of good hydration",
                "500ml of water first thing in the morning helps kickstart your metabolism",
            ]
            VStack(alignment: .leading, spacing: 6) {
                ForEach(tips, id: \.self) { tip in
                    HStack(alignment: .top, spacing: 6) {
                        Text("•").foregroundStyle(.secondary)
                        Text(tip).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.08))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.blue.opacity(0.2), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("💧").font(.system(size: 48))
            Text("Not Enough Data")
                .font(.headline)
            Text("Log water intake for at least 5 days to see patterns.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    // MARK: - Data Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let userId = SupabaseService.shared.currentSession?.user.id else { return }

        let cal = Calendar.current
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let oneYearAgoDate = cal.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let oneYearAgo = df.string(from: oneYearAgoDate)

        do {
            // Fetch water target
            struct NutRow: Decodable { let water_target_ml: Int? }
            if let nutRow: NutRow = (try? await SupabaseService.shared.client
                .from("user_nutrition_settings")
                .select("water_target_ml")
                .eq("user_id", value: userId.uuidString)
                .limit(1)
                .execute()
                .value as [NutRow])?.first {
                targetMl = Double(nutRow.water_target_ml ?? 2500)
            }

            // Fetch year of water data
            struct WaterRow: Decodable { let date: String; let total_ml: Int }
            let rows: [WaterRow] = try await SupabaseService.shared.client
                .from("daily_water")
                .select("date, total_ml")
                .eq("user_id", value: userId.uuidString)
                .gte("date", value: oneYearAgo)
                .gt("total_ml", value: 0)
                .order("date", ascending: true)
                .execute()
                .value

            // Fetch workout dates
            struct WorkoutRow: Decodable { let start_time: String }
            let workoutRows: [WorkoutRow] = (try? await SupabaseService.shared.client
                .from("workout_records")
                .select("start_time")
                .eq("user_id", value: userId.uuidString)
                .gte("start_time", value: oneYearAgo + "T00:00:00")
                .execute()
                .value) ?? []

            let workoutDates = Set(workoutRows.map { String($0.start_time.prefix(10)) })

            // ── Compute stats ──────────────────────────────────────────────
            let entries = rows.map { (date: $0.date, ml: Double($0.total_ml)) }
            totalDays = entries.count
            goalDays = entries.filter { $0.ml >= targetMl }.count
            goalRate = totalDays > 0 ? Double(goalDays) / Double(totalDays) : 0
            avgDaily = totalDays > 0 ? entries.map(\.ml).reduce(0, +) / Double(totalDays) : 0

            // Best day
            if let best = entries.max(by: { $0.ml < $1.ml }) {
                bestDayMl = best.ml
                bestDayDate = df.date(from: best.date)
            }

            // Streaks
            var longest = 0
            var temp = 0
            for entry in entries {
                if entry.ml >= targetMl { temp += 1; longest = max(longest, temp) }
                else { temp = 0 }
            }
            longestStreak = longest

            var current = 0
            let waterByDate = Dictionary(uniqueKeysWithValues: entries.map { ($0.date, $0.ml) })
            for i in 1...365 {
                guard let d = cal.date(byAdding: .day, value: -i, to: Date()) else { break }
                let ds = df.string(from: d)
                let ml = waterByDate[ds] ?? 0
                if ml >= targetMl { current += 1 } else { break }
            }
            currentStreak = current

            // DOW
            var dowBuckets: [[Double]] = Array(repeating: [], count: 7)
            for entry in entries {
                if let d = df.date(from: entry.date) {
                    let dow = cal.component(.weekday, from: d) - 1 // 0=Sun
                    dowBuckets[dow].append(entry.ml)
                }
            }
            dowStats = (0..<7).map { i in
                let vals = dowBuckets[i]
                let avg = vals.isEmpty ? 0 : vals.reduce(0, +) / Double(vals.count)
                let hits = vals.filter { $0 >= targetMl }.count
                return HydDowStat(
                    label: dowLabels[i], dow: i,
                    avg: avg,
                    hitRate: vals.isEmpty ? 0 : Double(hits) / Double(vals.count),
                    count: vals.count
                )
            }

            // Monthly
            var monthBuckets: [String: [Double]] = [:]
            for entry in entries {
                let key = String(entry.date.prefix(7)) // YYYY-MM
                monthBuckets[key, default: []].append(entry.ml)
            }
            let sortedMonths = monthBuckets.keys.sorted()
            monthStats = sortedMonths.suffix(12).compactMap { key -> HydMonthStat? in
                guard let vals = monthBuckets[key] else { return nil }
                let parts = key.split(separator: "-")
                guard parts.count == 2,
                      let monthNum = Int(parts[1]), monthNum >= 1, monthNum <= 12 else { return nil }
                let year = String(parts[0].suffix(2))
                let label = "\(monthLabels[monthNum - 1]) \(year)"
                let avg = vals.reduce(0, +) / Double(vals.count)
                let hits = vals.filter { $0 >= targetMl }.count
                return HydMonthStat(
                    label: label, avg: avg,
                    hitRate: Double(hits) / Double(vals.count),
                    count: vals.count
                )
            }

            // Distribution (500ml buckets)
            let maxVal = entries.map(\.ml).max() ?? targetMl
            let numBuckets = Int(ceil(max(maxVal, targetMl * 1.5) / 500))
            var buckets: [HydDistBucket] = []
            for i in 0..<numBuckets {
                let minMl = Double(i) * 500
                let maxMl = Double(i + 1) * 500
                let count = entries.filter { $0.ml >= minMl && $0.ml < maxMl }.count
                if count == 0 && !(targetMl >= minMl && targetMl < maxMl) { continue }
                let pct = totalDays > 0 ? Double(count) / Double(totalDays) * 100 : 0
                let label = minMl >= 1000 ? "\(Int(minMl/1000))–\(Int(maxMl/1000))L" : "\(Int(minMl))–\(Int(maxMl))"
                buckets.append(HydDistBucket(
                    label: label, minMl: minMl, maxMl: maxMl,
                    count: count, pct: pct,
                    isGoal: targetMl >= minMl && targetMl < maxMl
                ))
            }
            distBuckets = buckets

            // Workout vs rest day
            var wdVals: [Double] = []
            var rdVals: [Double] = []
            for entry in entries {
                if workoutDates.contains(entry.date) { wdVals.append(entry.ml) }
                else { rdVals.append(entry.ml) }
            }
            avgWorkoutDay = wdVals.isEmpty ? nil : wdVals.reduce(0, +) / Double(wdVals.count)
            avgRestDay = rdVals.isEmpty ? nil : rdVals.reduce(0, +) / Double(rdVals.count)

        } catch {
            // Leave empty state on error
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        HydrationPatternView()
    }
}
