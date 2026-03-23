import SwiftUI
import Charts

// MARK: - SleepPatternView
// Day-of-week patterns, seasonal trends, duration histogram, and consistency metrics.

struct SleepPatternView: View {
    @State private var isLoading = false

    // DOW (0=Sun … 6=Sat)
    @State private var dowData: [DayBucket] = []
    // Monthly
    @State private var monthData: [MonthBucket] = []
    // Histogram
    @State private var histogram: [HistBucket] = []
    // Scalar stats
    @State private var totalNights = 0
    @State private var meanMins = 0
    @State private var stddevMins = 0
    @State private var cv: Double = 0
    @State private var goalHitRate = 0
    @State private var goalHitDays = 0
    @State private var sleepGoalMins = 480

    @State private var bestDow: DayBucket?
    @State private var worstDow: DayBucket?
    @State private var weeknightAvg = 0
    @State private var weekendAvg = 0

    // Bedtime & stages from sleep_records
    @State private var avgBedtimeStr: String?
    @State private var avgDeepMins: Int?
    @State private var avgRemMins: Int?

    private static let dowLabels   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private static let monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    struct DayBucket: Identifiable {
        let id: Int            // 0=Sun … 6=Sat
        let label: String
        let avgMins: Int
        let count: Int
        let isWeekend: Bool
    }
    struct MonthBucket: Identifiable {
        let id: Int            // 0-11
        let label: String
        let avgMins: Int
        let count: Int
    }
    struct HistBucket: Identifiable {
        let id: Int
        let label: String
        let count: Int
        let isOptimal: Bool    // 7-9h is optimal
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalNights < 7 {
                    emptyState
                } else {
                    summaryCards
                    dowChart
                    weeknightWeekendCard
                    histogramCard
                    if monthData.filter({ $0.count >= 3 }).count >= 2 { monthlyChart }
                    consistencyCard
                    stagesCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Sleep Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(
                title: "Avg Sleep",
                value: formatMins(meanMins),
                sub: "\(totalNights) nights",
                color: .indigo
            )
            statCard(
                title: "Goal Hit Rate",
                value: "\(goalHitRate)%",
                sub: "\(goalHitDays) nights ≥ \(sleepGoalMins / 60)h",
                color: goalHitRate >= 70 ? .green : goalHitRate >= 50 ? .yellow : .orange
            )
            if let best = bestDow {
                statCard(title: "Best Night", value: best.label, sub: formatMins(best.avgMins) + " avg", color: .green)
            }
            if let worst = worstDow {
                statCard(title: "Shortest Night", value: worst.label, sub: formatMins(worst.avgMins) + " avg", color: .orange)
            }
        }
    }

    private func statCard(title: String, value: String, sub: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2.bold()).foregroundStyle(color)
            Text(sub).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Chart

    private var dowChart: some View {
        let maxVal = dowData.map(\.avgMins).max().map { Double($0) } ?? 1
        let meanVal = Double(meanMins)

        return VStack(alignment: .leading, spacing: 8) {
            Text("By Day of Week").font(.headline).padding(.horizontal, 4)
            Text("Average sleep duration on each night of the week")
                .font(.caption).foregroundStyle(.secondary).padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Mean", meanVal))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.indigo.opacity(0.5))
                    .annotation(position: .topTrailing) {
                        Text("avg").font(.caption2).foregroundStyle(.secondary)
                    }
                ForEach(dowData) { d in
                    if d.count > 0 {
                        BarMark(
                            x: .value("Day", d.label),
                            y: .value("Mins", Double(d.avgMins))
                        )
                        .foregroundStyle(d.isWeekend ? Color.purple.opacity(0.8) : Color.indigo.opacity(0.7))
                        .cornerRadius(4)
                    }
                }
            }
            .chartYScale(domain: 0...(maxVal * 1.2))
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) { Text(formatMins(Int(v))).font(.caption2) }
                    }
                }
            }
            .frame(height: 160)

            HStack(spacing: 16) {
                Label("Weekday", systemImage: "circle.fill").foregroundStyle(Color.indigo.opacity(0.7))
                Label("Weekend", systemImage: "circle.fill").foregroundStyle(Color.purple.opacity(0.8))
            }
            .font(.caption2).foregroundStyle(.secondary).padding(.horizontal, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Weeknight vs Weekend

    private var weeknightWeekendCard: some View {
        guard weeknightAvg > 0 || weekendAvg > 0 else { return AnyView(EmptyView()) }
        let maxVal = max(weeknightAvg, weekendAvg)
        let diff = weekendAvg - weeknightAvg

        return AnyView(VStack(alignment: .leading, spacing: 12) {
            Text("Weeknight vs Weekend").font(.headline)

            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Weeknights").font(.caption).foregroundStyle(.secondary)
                    Text(formatMins(weeknightAvg)).font(.title2.bold()).foregroundStyle(.indigo)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.indigo.opacity(0.1)).frame(height: 8)
                            Capsule().fill(Color.indigo).frame(
                                width: geo.size.width * CGFloat(weeknightAvg) / CGFloat(maxVal),
                                height: 8
                            )
                        }
                    }.frame(height: 8)
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text("Weekends").font(.caption).foregroundStyle(.secondary)
                    Text(formatMins(weekendAvg)).font(.title2.bold()).foregroundStyle(.purple)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.purple.opacity(0.1)).frame(height: 8)
                            Capsule().fill(Color.purple).frame(
                                width: geo.size.width * CGFloat(weekendAvg) / CGFloat(maxVal),
                                height: 8
                            )
                        }
                    }.frame(height: 8)
                }
            }

            if diff != 0 {
                let absDiff = abs(diff)
                Text("\(diff > 0 ? "You sleep" : "You sleep") \(formatMins(absDiff)) \(diff > 0 ? "more" : "less") on weekends")
                    .font(.caption)
                    .foregroundStyle(abs(diff) > 60 ? .orange : .secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16)))
    }

    // MARK: - Histogram

    private var histogramCard: some View {
        let maxCount = histogram.map(\.count).max() ?? 1

        return VStack(alignment: .leading, spacing: 8) {
            Text("Sleep Duration Distribution").font(.headline).padding(.horizontal, 4)
            Text("How often you sleep in each duration range").font(.caption).foregroundStyle(.secondary).padding(.horizontal, 4)

            Chart {
                ForEach(histogram) { b in
                    if b.count > 0 {
                        BarMark(
                            x: .value("Range", b.label),
                            y: .value("Nights", b.count)
                        )
                        .foregroundStyle(b.isOptimal ? Color.green.opacity(0.8) : Color.indigo.opacity(0.5))
                        .cornerRadius(4)
                    }
                }
            }
            .chartYScale(domain: 0...(Double(maxCount) * 1.2))
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Int.self) { Text("\(v)").font(.caption2) }
                    }
                }
            }
            .frame(height: 140)

            HStack(spacing: 16) {
                Label("Optimal (7–9h)", systemImage: "circle.fill").foregroundStyle(Color.green.opacity(0.8))
                Label("Other", systemImage: "circle.fill").foregroundStyle(Color.indigo.opacity(0.5))
            }
            .font(.caption2).foregroundStyle(.secondary).padding(.horizontal, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly Chart

    private var monthlyChart: some View {
        let validMonths = monthData.filter { $0.count >= 3 }
        let maxVal = validMonths.map(\.avgMins).max().map { Double($0) } ?? 1

        return VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Average").font(.headline).padding(.horizontal, 4)
            Text("How sleep duration changes by month").font(.caption).foregroundStyle(.secondary).padding(.horizontal, 4)

            Chart {
                ForEach(validMonths) { m in
                    BarMark(
                        x: .value("Month", m.label),
                        y: .value("Mins", Double(m.avgMins))
                    )
                    .foregroundStyle(Color.indigo.opacity(0.7))
                    .cornerRadius(4)
                }
            }
            .chartYScale(domain: 0...(maxVal * 1.2))
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) { Text(formatMins(Int(v))).font(.caption2) }
                    }
                }
            }
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Consistency Card

    private var consistencyCard: some View {
        let consistencyScore = max(0, min(100, Int((1.0 - cv / 0.5) * 100)))
        let scoreColor: Color = consistencyScore >= 70 ? .green : consistencyScore >= 40 ? .yellow : .orange

        return VStack(alignment: .leading, spacing: 12) {
            Text("Sleep Consistency").font(.headline)

            HStack(alignment: .top, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Consistency Score").font(.caption).foregroundStyle(.secondary)
                    Text("\(consistencyScore)").font(.system(size: 44, weight: .bold, design: .rounded)).foregroundStyle(scoreColor)
                    Text("out of 100").font(.caption2).foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 8) {
                    statRow(label: "Mean duration", value: formatMins(meanMins))
                    statRow(label: "Std deviation", value: formatMins(stddevMins))
                    statRow(label: "Variability (CV)", value: String(format: "%.0f%%", cv * 100))
                    if let bt = avgBedtimeStr {
                        statRow(label: "Avg bedtime", value: bt)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(scoreColor.opacity(0.15)).frame(height: 10)
                    Capsule().fill(scoreColor).frame(width: geo.size.width * CGFloat(consistencyScore) / 100, height: 10)
                }
            }.frame(height: 10)

            Text("Consistency score is based on night-to-night duration variability. Lower variability = higher score.")
                .font(.caption2).foregroundStyle(.secondary.opacity(0.7))
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statRow(label: String, value: String) -> some View {
        HStack {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Spacer()
            Text(value).font(.caption.monospacedDigit().bold())
        }
    }

    // MARK: - Stages Card

    private var stagesCard: some View {
        guard avgDeepMins != nil || avgRemMins != nil else { return AnyView(EmptyView()) }
        return AnyView(VStack(alignment: .leading, spacing: 12) {
            Text("Average Sleep Stages").font(.headline)
            Text("Based on recorded nightly data")
                .font(.caption).foregroundStyle(.secondary)

            HStack(spacing: 12) {
                if let deep = avgDeepMins {
                    stageChip(label: "Deep", value: formatMins(deep), color: .blue)
                }
                if let rem = avgRemMins {
                    stageChip(label: "REM", value: formatMins(rem), color: .purple)
                }
                if let deep = avgDeepMins, let rem = avgRemMins {
                    stageChip(label: "Deep+REM", value: formatMins(deep + rem), color: .indigo)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16)))
    }

    private func stageChip(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "moon.stars.fill")
                .font(.system(size: 48))
                .foregroundStyle(.indigo.opacity(0.7))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Log at least 7 nights of sleep data to see your patterns, consistency analysis, and day-of-week trends.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        // Fetch 180 days of daily summaries (6 months)
        guard let allRows = try? await SupabaseService.shared.fetchAllDailySummaries(days: 180) else { return }
        let rows = allRows.filter { ($0.sleep_duration_minutes ?? 0) > 60 }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let cal = Calendar.current

        // DOW buckets
        var dowBuckets: [(sum: Int, count: Int)] = Array(repeating: (0, 0), count: 7)
        for r in rows {
            guard let d = df.date(from: r.date) else { continue }
            let dow = cal.component(.weekday, from: d) - 1  // 0=Sun
            let mins = r.sleep_duration_minutes ?? 0
            dowBuckets[dow].sum += mins
            dowBuckets[dow].count += 1
        }
        dowData = (0..<7).map { i in
            let b = dowBuckets[i]
            return DayBucket(
                id: i,
                label: Self.dowLabels[i],
                avgMins: b.count > 0 ? b.sum / b.count : 0,
                count: b.count,
                isWeekend: i == 0 || i == 6
            )
        }

        // Monthly buckets
        var monthBuckets: [(sum: Int, count: Int)] = Array(repeating: (0, 0), count: 12)
        for r in rows {
            guard let d = df.date(from: r.date) else { continue }
            let month = cal.component(.month, from: d) - 1  // 0-11
            monthBuckets[month].sum += r.sleep_duration_minutes ?? 0
            monthBuckets[month].count += 1
        }
        monthData = (0..<12).map { i in
            let b = monthBuckets[i]
            return MonthBucket(id: i, label: Self.monthLabels[i], avgMins: b.count > 0 ? b.sum / b.count : 0, count: b.count)
        }

        // Histogram
        struct HistDef { let label: String; let min: Int; let max: Int; let isOptimal: Bool }
        let histDefs: [HistDef] = [
            .init(label: "<5h",   min: 0,   max: 300,    isOptimal: false),
            .init(label: "5–6h",  min: 300, max: 360,    isOptimal: false),
            .init(label: "6–7h",  min: 360, max: 420,    isOptimal: false),
            .init(label: "7–8h",  min: 420, max: 480,    isOptimal: true),
            .init(label: "8–9h",  min: 480, max: 540,    isOptimal: true),
            .init(label: "9–10h", min: 540, max: 600,    isOptimal: false),
            .init(label: ">10h",  min: 600, max: Int.max, isOptimal: false),
        ]
        histogram = histDefs.enumerated().map { i, d in
            HistBucket(
                id: i,
                label: d.label,
                count: rows.filter { ($0.sleep_duration_minutes ?? 0) >= d.min && ($0.sleep_duration_minutes ?? 0) < d.max }.count,
                isOptimal: d.isOptimal
            )
        }

        // Scalar stats
        let vals = rows.compactMap { $0.sleep_duration_minutes }.filter { $0 > 60 }
        totalNights = vals.count
        let meanD = totalNights > 0 ? Double(vals.reduce(0, +)) / Double(totalNights) : 0
        meanMins = Int(meanD)
        let variance = totalNights > 1 ? vals.reduce(0.0) { $0 + pow(Double($1) - meanD, 2) } / Double(totalNights) : 0
        stddevMins = Int(sqrt(variance))
        cv = meanD > 0 ? sqrt(variance) / meanD : 0
        sleepGoalMins = 480
        goalHitDays = vals.filter { $0 >= sleepGoalMins }.count
        goalHitRate = totalNights > 0 ? Int(Double(goalHitDays) / Double(totalNights) * 100) : 0

        // Best/worst DOW
        let validDow = dowData.filter { $0.count >= 3 && $0.avgMins > 0 }
        bestDow  = validDow.max(by: { $0.avgMins < $1.avgMins })
        worstDow = validDow.min(by: { $0.avgMins < $1.avgMins })

        // Weeknight vs weekend
        let weeknightVals = dowData.filter { !$0.isWeekend && $0.avgMins > 0 }.map(\.avgMins)
        let weekendVals   = dowData.filter {  $0.isWeekend && $0.avgMins > 0 }.map(\.avgMins)
        weeknightAvg = weeknightVals.isEmpty ? 0 : weeknightVals.reduce(0, +) / weeknightVals.count
        weekendAvg   = weekendVals.isEmpty   ? 0 : weekendVals.reduce(0, +)   / weekendVals.count

        // Sleep records: bedtime & stages
        let sleepRecs = (try? await SupabaseService.shared.fetchSleepRecords(days: 180)) ?? []
        let validRecs = sleepRecs.filter { $0.durationMinutes > 60 }

        // Avg bedtime
        var bedtimeMins: [Int] = []
        for r in validRecs {
            let h = cal.component(.hour, from: r.startTime)
            let m = cal.component(.minute, from: r.startTime)
            var mins = h * 60 + m
            if mins < 360 { mins += 24 * 60 }  // before 6am → next-day offset
            bedtimeMins.append(mins)
        }
        if !bedtimeMins.isEmpty {
            let avgBt = bedtimeMins.reduce(0, +) / bedtimeMins.count
            let bh = (avgBt / 60) % 24
            let bm = avgBt % 60
            let hour12 = bh % 12 == 0 ? 12 : bh % 12
            let ampm = bh < 12 ? "am" : "pm"
            avgBedtimeStr = String(format: "%d:%02d %@", hour12, bm, ampm)
        }

        // Avg deep & REM
        let deepVals = validRecs.compactMap(\.deepMinutes).filter { $0 > 0 }
        let remVals  = validRecs.compactMap(\.remMinutes).filter  { $0 > 0 }
        avgDeepMins = deepVals.isEmpty ? nil : deepVals.reduce(0, +) / deepVals.count
        avgRemMins  = remVals.isEmpty  ? nil : remVals.reduce(0, +)  / remVals.count
    }

    // MARK: - Helpers

    private func formatMins(_ mins: Int) -> String {
        guard mins > 0 else { return "—" }
        let h = mins / 60
        let m = mins % 60
        if h == 0 { return "\(m)m" }
        return m == 0 ? "\(h)h" : "\(h)h \(m)m"
    }
}

#Preview {
    NavigationStack { SleepPatternView() }
}
