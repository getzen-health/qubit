import SwiftUI
import Charts

// MARK: - Models

struct NutDowStat: Identifiable {
    let id = UUID()
    let label: String
    let dow: Int
    let count: Int
    let avgCals: Double
    let avgProtein: Double
    let avgCarbs: Double
    let avgFat: Double
}

struct NutMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let avgCals: Double
    let avgProtein: Double
    let avgCarbs: Double
    let avgFat: Double
    let count: Int
}

struct NutCalBucket: Identifiable {
    let id = UUID()
    let label: String
    let minKcal: Double
    let maxKcal: Double
    let count: Int
    let pct: Double
    let isTarget: Bool
}

// MARK: - NutritionPatternView

struct NutritionPatternView: View {
    @State private var dowData: [NutDowStat] = []
    @State private var monthData: [NutMonthStat] = []
    @State private var calBuckets: [NutCalBucket] = []
    @State private var overallCals: Double = 0
    @State private var overallProtein: Double = 0
    @State private var overallCarbs: Double = 0
    @State private var overallFat: Double = 0
    @State private var overallFiber: Double = 0
    @State private var calTarget: Double = 2000
    @State private var protTarget: Double = 150
    @State private var carbTarget: Double = 250
    @State private var fatTarget: Double = 65
    @State private var totalDays: Int = 0
    @State private var weekdayAvgCals: Double? = nil
    @State private var weekendAvgCals: Double? = nil
    @State private var isLoading = true

    private let dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    private func calColor(_ cals: Double) -> Color {
        let ratio = cals / calTarget
        if ratio >= 0.85 && ratio <= 1.15 { return .green }
        if ratio >= 0.7 && ratio <= 1.3 { return .orange }
        return .red
    }

    private var highestDay: NutDowStat? { dowData.filter { $0.count > 0 }.max(by: { $0.avgCals < $1.avgCals }) }
    private var lowestDay: NutDowStat? { dowData.filter { $0.count > 0 }.min(by: { $0.avgCals < $1.avgCals }) }

    // Macro % split
    private var protKcal: Double { overallProtein * 4 }
    private var carbKcal: Double { overallCarbs * 4 }
    private var fatKcal: Double { overallFat * 9 }
    private var totalMacroKcal: Double { protKcal + carbKcal + fatKcal }
    private var protPct: Int { totalMacroKcal > 0 ? Int(protKcal / totalMacroKcal * 100) : 0 }
    private var carbPct: Int { totalMacroKcal > 0 ? Int(carbKcal / totalMacroKcal * 100) : 0 }
    private var fatPct: Int { totalMacroKcal > 0 ? Int(fatKcal / totalMacroKcal * 100) : 0 }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalDays < 5 {
                    emptyState
                } else {
                    summaryRow
                    macroSplitCard
                    dowCalsChart
                    proteinByDowCard
                    if weekdayAvgCals != nil { weekdayVsWeekendCard }
                    if monthData.count >= 3 { monthTrendChart }
                    if calBuckets.count > 2 { distributionCard }
                    tipsCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Nutrition Patterns")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary

    private var summaryRow: some View {
        HStack(spacing: 10) {
            summaryBubble(title: "Avg Calories", value: "\(Int(overallCals))",
                          unit: "kcal", color: calColor(overallCals))
            summaryBubble(title: "Avg Protein", value: "\(Int(overallProtein))",
                          unit: "g", color: .blue)
            summaryBubble(title: "Avg Carbs", value: "\(Int(overallCarbs))",
                          unit: "g", color: .orange)
        }
    }

    private func summaryBubble(title: String, value: String, unit: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(title)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(color)
                Text(unit)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Macro Split

    private var macroSplitCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Macro Split")
                .font(.subheadline.weight(.semibold))

            macroRow(label: "Protein", grams: overallProtein, target: protTarget,
                     pct: protPct, color: .blue)
            macroRow(label: "Carbohydrates", grams: overallCarbs, target: carbTarget,
                     pct: carbPct, color: .orange)
            macroRow(label: "Fat", grams: overallFat, target: fatTarget,
                     pct: fatPct, color: .red)

            if overallFiber > 0 {
                Divider()
                HStack {
                    Text("Fiber")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(Int(overallFiber))g/day")
                        .font(.caption)
                        .foregroundStyle(overallFiber >= 25 ? .green : .orange)
                    Text("· target: 25–35g")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func macroRow(label: String, grams: Double, target: Double,
                           pct: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            HStack {
                Circle().fill(color).frame(width: 8, height: 8)
                Text(label)
                    .font(.subheadline)
                Spacer()
                Text("\(Int(grams))g · \(pct)% of cals")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("\(Int(grams / target * 100))%")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(grams >= target * 0.85 ? .green : .orange)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4).fill(Color(.systemFill)).frame(height: 6)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geo.size.width * min(Double(pct) / 50, 1.0), height: 6)
                        .opacity(0.8)
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - DOW Calories Chart

    private var dowCalsChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Calories by Day of Week")
                .font(.subheadline.weight(.semibold))
            Text("Average calorie intake per weekday")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart(dowData) { stat in
                BarMark(
                    x: .value("Day", stat.label),
                    y: .value("Cals", stat.avgCals)
                )
                .foregroundStyle(calColor(stat.avgCals))
                .cornerRadius(4)

                RuleMark(y: .value("Target", calTarget))
                    .foregroundStyle(.green.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Target").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            Text("\(Int(v))").font(.caption2)
                        }
                    }
                    AxisGridLine()
                }
            }
            .frame(height: 180)

            if let high = highestDay, let low = lowestDay {
                HStack(spacing: 12) {
                    HStack(spacing: 6) {
                        Text("🍔").font(.caption)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Most: \(high.label)")
                                .font(.caption.weight(.medium))
                            Text("\(Int(high.avgCals)) kcal")
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        VStack(alignment: .trailing, spacing: 1) {
                            Text("Least: \(low.label)")
                                .font(.caption.weight(.medium))
                            Text("\(Int(low.avgCals)) kcal")
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                        Text("🥗").font(.caption)
                    }
                }
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Protein by DOW

    private var proteinByDowCard: some View {
        let maxProt = dowData.map(\.avgProtein).max() ?? 1

        return VStack(alignment: .leading, spacing: 8) {
            Text("Protein by Day of Week")
                .font(.subheadline.weight(.semibold))
            Text("Which days you eat the most protein")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(dowData.filter { $0.count > 0 }) { stat in
                HStack(spacing: 8) {
                    Text(stat.label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color(.systemFill)).frame(height: 8)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(stat.avgProtein >= protTarget * 0.85 ? Color.green : Color.blue)
                                .frame(width: geo.size.width * (stat.avgProtein / maxProt), height: 8)
                                .opacity(0.8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(Int(stat.avgProtein))g")
                        .font(.caption)
                        .foregroundStyle(.primary)
                        .frame(width: 36, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Weekday vs Weekend

    private var weekdayVsWeekendCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weekday vs Weekend")
                .font(.subheadline.weight(.semibold))

            HStack(spacing: 16) {
                if let wd = weekdayAvgCals {
                    comparisonBubble(emoji: "💼", label: "Weekdays", cals: wd)
                }
                if let we = weekendAvgCals {
                    comparisonBubble(emoji: "🎉", label: "Weekends", cals: we)
                }
            }

            if let wd = weekdayAvgCals, let we = weekendAvgCals, abs(we - wd) > 100 {
                let diff = abs(Int(we - wd))
                let more = we > wd ? "weekends" : "weekdays"
                Text("You eat \(diff) kcal more on \(more)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func comparisonBubble(emoji: String, label: String, cals: Double) -> some View {
        VStack(spacing: 4) {
            Text(emoji).font(.title2)
            Text("\(Int(cals))")
                .font(.title3.weight(.bold))
                .foregroundStyle(calColor(cals))
            Text("\(label)")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("kcal")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color.premiumSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Monthly Trend

    private var monthTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Trend")
                .font(.subheadline.weight(.semibold))
            Text("Average daily calories per month")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(monthData) { stat in
                    LineMark(
                        x: .value("Month", stat.label),
                        y: .value("Cals", stat.avgCals)
                    )
                    .foregroundStyle(Color.purple)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Month", stat.label),
                        y: .value("Cals", stat.avgCals)
                    )
                    .foregroundStyle(calColor(stat.avgCals))
                    .symbolSize(40)

                    BarMark(
                        x: .value("Month", stat.label),
                        y: .value("Protein", stat.avgProtein * 4)
                    )
                    .foregroundStyle(Color.blue.opacity(0.3))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Target", calTarget))
                    .foregroundStyle(.green.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
            }
            .frame(height: 160)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Distribution

    private var distributionCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Calorie Distribution")
                .font(.subheadline.weight(.semibold))
            Text("How your daily intake is spread")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(calBuckets) { bucket in
                HStack(spacing: 8) {
                    Text(bucket.label)
                        .font(.caption)
                        .foregroundStyle(bucket.isTarget ? Color.green : Color.secondary)
                        .frame(width: 70, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color(.systemFill)).frame(height: 10)
                            let barColor: Color = bucket.isTarget ? .green
                                : bucket.minKcal < calTarget * 0.5 ? .gray
                                : bucket.minKcal < calTarget ? .orange : .red
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
                        .frame(width: 28, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Tips

    private var tipsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Nutrition Tips", systemImage: "lightbulb.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.green)

            let tips = [
                "Protein: aim for 1.6–2.2g per kg bodyweight if active",
                "Fiber target of 25–35g/day supports gut health and satiety",
                "Calorie consistency matters more than daily perfection",
                "Weekend surplus often explains slow progress even on weekday deficits",
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
        .background(Color.green.opacity(0.08))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.green.opacity(0.2), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("🥗").font(.system(size: 48))
            Text("Not Enough Data")
                .font(.headline)
            Text("Log meals for at least 5 days to see nutrition patterns.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let userId = SupabaseService.shared.currentSession?.user.id else { return }

        let cal = Calendar.current
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.locale = Locale(identifier: "en_US_POSIX")
        let oneYearAgoDate = cal.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let isoFull = ISO8601DateFormatter()

        do {
            // Fetch nutrition settings
            struct NutSettings: Decodable {
                let calorie_target: Double?
                let protein_target_g: Double?
                let carbs_target_g: Double?
                let fat_target_g: Double?
            }
            if let settings: NutSettings = (try? await SupabaseService.shared.client
                .from("user_nutrition_settings")
                .select("calorie_target, protein_target_g, carbs_target_g, fat_target_g")
                .eq("user_id", value: userId.uuidString)
                .limit(1)
                .execute()
                .value as [NutSettings])?.first {
                calTarget = settings.calorie_target ?? 2000
                protTarget = settings.protein_target_g ?? 150
                carbTarget = settings.carbs_target_g ?? 250
                fatTarget = settings.fat_target_g ?? 65
            }

            // Fetch nutrition records
            struct NutRecord: Decodable {
                let type: String
                let value: Double
                let start_time: String
            }

            let records: [NutRecord] = try await SupabaseService.shared.client
                .from("health_records")
                .select("type, value, start_time")
                .eq("user_id", value: userId.uuidString)
                .in("type", values: ["dietary_energy", "dietary_protein", "dietary_carbs", "dietary_fat", "dietary_fiber"])
                .gte("start_time", value: isoFull.string(from: oneYearAgoDate))
                .gt("value", value: 0)
                .order("start_time", ascending: true)
                .execute()
                .value

            // Group by day
            struct DayData {
                var energy: Double = 0
                var protein: Double = 0
                var carbs: Double = 0
                var fat: Double = 0
                var fiber: Double = 0
                var count: Int = 0
            }
            var byDay: [String: DayData] = [:]
            for r in records {
                let date = String(r.start_time.prefix(10))
                var d = byDay[date] ?? DayData()
                d.count += 1
                switch r.type {
                case "dietary_energy": d.energy += r.value
                case "dietary_protein": d.protein += r.value
                case "dietary_carbs": d.carbs += r.value
                case "dietary_fat": d.fat += r.value
                case "dietary_fiber": d.fiber += r.value
                default: break
                }
                byDay[date] = d
            }

            // Filter days with sufficient calorie data (> 100 kcal)
            let validDays = byDay.filter { $0.value.energy > 100 }
            totalDays = validDays.count

            guard totalDays >= 5 else { return }

            // Compute overall averages
            let total = validDays.values
            overallCals = total.map(\.energy).reduce(0, +) / Double(totalDays)
            overallProtein = total.map(\.protein).reduce(0, +) / Double(totalDays)
            overallCarbs = total.map(\.carbs).reduce(0, +) / Double(totalDays)
            overallFat = total.map(\.fat).reduce(0, +) / Double(totalDays)
            overallFiber = total.map(\.fiber).reduce(0, +) / Double(totalDays)

            // DOW
            var dowBuckets: [[DayData]] = Array(repeating: [], count: 7)
            for (date, data) in validDays {
                if let d = df.date(from: date) {
                    let dow = cal.component(.weekday, from: d) - 1
                    if dow >= 0 && dow < 7 { dowBuckets[dow].append(data) }
                }
            }
            dowData = (0..<7).map { i in
                let bucket = dowBuckets[i]
                let n = Double(bucket.count)
                return NutDowStat(
                    label: dowLabels[i], dow: i, count: bucket.count,
                    avgCals: n > 0 ? bucket.map(\.energy).reduce(0, +) / n : 0,
                    avgProtein: n > 0 ? bucket.map(\.protein).reduce(0, +) / n : 0,
                    avgCarbs: n > 0 ? bucket.map(\.carbs).reduce(0, +) / n : 0,
                    avgFat: n > 0 ? bucket.map(\.fat).reduce(0, +) / n : 0
                )
            }

            // Monthly
            var monthBuckets: [String: [DayData]] = [:]
            for (date, data) in validDays {
                let key = String(date.prefix(7))
                monthBuckets[key, default: []].append(data)
            }
            monthData = monthBuckets.keys.sorted().suffix(12).compactMap { key in
                guard let bucket = monthBuckets[key], !bucket.isEmpty else { return nil }
                let parts = key.split(separator: "-")
                guard parts.count == 2, let m = Int(parts[1]), m >= 1, m <= 12 else { return nil }
                let n = Double(bucket.count)
                return NutMonthStat(
                    label: "\(monthLabels[m - 1]) \(String(parts[0].suffix(2)))",
                    avgCals: bucket.map(\.energy).reduce(0, +) / n,
                    avgProtein: bucket.map(\.protein).reduce(0, +) / n,
                    avgCarbs: bucket.map(\.carbs).reduce(0, +) / n,
                    avgFat: bucket.map(\.fat).reduce(0, +) / n,
                    count: bucket.count
                )
            }

            // Weekday vs Weekend
            var wdCals: [Double] = []
            var weCals: [Double] = []
            for (date, data) in validDays {
                if let d = df.date(from: date) {
                    let dow = cal.component(.weekday, from: d) - 1
                    if dow >= 1 && dow <= 5 { wdCals.append(data.energy) }
                    else { weCals.append(data.energy) }
                }
            }
            weekdayAvgCals = wdCals.isEmpty ? nil : wdCals.reduce(0, +) / Double(wdCals.count)
            weekendAvgCals = weCals.isEmpty ? nil : weCals.reduce(0, +) / Double(weCals.count)

            // Distribution
            var buckets: [NutCalBucket] = []
            var minBucket = 0
            while minBucket < 4000 {
                let maxBucket = minBucket + 200
                let count = validDays.values.filter { $0.energy >= Double(minBucket) && $0.energy < Double(maxBucket) }.count
                if count > 0 {
                    let isTarget = Double(minBucket) <= calTarget && Double(maxBucket) > calTarget
                    buckets.append(NutCalBucket(
                        label: "\(minBucket)–\(maxBucket)", minKcal: Double(minBucket), maxKcal: Double(maxBucket),
                        count: count, pct: Double(count) / Double(totalDays) * 100, isTarget: isTarget
                    ))
                }
                minBucket += 200
            }
            let over4k = validDays.values.filter { $0.energy >= 4000 }.count
            if over4k > 0 {
                buckets.append(NutCalBucket(label: "4000+", minKcal: 4000, maxKcal: 99999,
                                            count: over4k, pct: Double(over4k) / Double(totalDays) * 100, isTarget: false))
            }
            calBuckets = buckets

        } catch {
            // leave empty
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        NutritionPatternView()
    }
}
