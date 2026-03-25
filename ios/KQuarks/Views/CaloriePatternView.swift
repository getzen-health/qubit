import SwiftUI
import Charts

// MARK: - Models

private struct DayBucket: Identifiable {
    let id: Int          // 0 = Sun … 6 = Sat
    let label: String
    let avg: Double
    let count: Int
    var isWeekend: Bool { id == 0 || id == 6 }
}

private struct MonthBucket: Identifiable {
    let id: Int          // 0 = Jan … 11 = Dec
    let label: String
    let avg: Double
    let count: Int
}

private struct HistBucket: Identifiable {
    let id: Int
    let label: String
    let count: Int
    let isGoal: Bool   // at or above calorie goal
}

// MARK: - CaloriePatternView

struct CaloriePatternView: View {
    @State private var isLoading   = true
    @State private var dowData:    [DayBucket]   = []
    @State private var monthData:  [MonthBucket] = []
    @State private var histogram:  [HistBucket]  = []
    @State private var mean:       Double = 0
    @State private var stddev:     Double = 0
    @State private var cv:         Double = 0
    @State private var totalDays:  Int    = 0
    @State private var calorieGoal: Int?  = nil

    private let dowLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
    private let monLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    // MARK: - Computed

    private var weekdayAvg: Double {
        let wd = dowData.filter { !$0.isWeekend && $0.avg > 0 }
        guard !wd.isEmpty else { return 0 }
        return wd.map(\.avg).reduce(0,+) / Double(wd.count)
    }

    private var weekendAvg: Double {
        let we = dowData.filter { $0.isWeekend && $0.avg > 0 }
        guard !we.isEmpty else { return 0 }
        return we.map(\.avg).reduce(0,+) / Double(we.count)
    }

    private var bestDow: DayBucket? {
        dowData.filter { $0.count >= 3 }.max(by: { $0.avg < $1.avg })
    }
    private var worstDow: DayBucket? {
        dowData.filter { $0.count >= 3 }.min(by: { $0.avg < $1.avg })
    }

    private var consistencyScore: Int {
        guard mean > 0 else { return 0 }
        return max(0, min(100, Int((1 - cv / 0.8) * 100)))
    }

    private var consistencyLabel: String {
        switch consistencyScore {
        case 80...: return "Very Consistent"
        case 60..<80: return "Consistent"
        case 40..<60: return "Moderate"
        case 20..<40: return "Variable"
        default: return "Highly Variable"
        }
    }

    private var consistencyColor: Color {
        switch consistencyScore {
        case 80...: return .green
        case 60..<80: return Color(red:0.53, green:0.93, blue:0.67)
        case 40..<60: return .yellow
        case 20..<40: return .orange
        default: return .red
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading && dowData.isEmpty {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 80)
            } else if totalDays < 7 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    statCards
                    dowChart
                    weekdayWeekendCard
                    monthlyChart
                    histogramCard
                    consistencyCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Calorie Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Sub-views

    private var statCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            CalorieStatCard(value: "\(Int(mean).formatted())", label: "Daily Average", sub: "kcal active burn", color: .orange)
            CalorieStatCard(value: "\(consistencyScore)", label: consistencyLabel, sub: "consistency score", color: consistencyColor)

            if weekdayAvg > weekendAvg {
                CalorieStatCard(value: "+\(Int(weekdayAvg - weekendAvg).formatted())", label: "Weekdays higher", sub: "vs weekends", color: .orange)
            } else if weekendAvg > weekdayAvg {
                CalorieStatCard(value: "+\(Int(weekendAvg - weekdayAvg).formatted())", label: "Weekends higher", sub: "vs weekdays", color: .orange)
            } else {
                CalorieStatCard(value: "±\(Int(stddev).formatted())", label: "Variability", sub: "std dev (kcal)", color: .secondary)
            }

            CalorieStatCard(value: "\(totalDays)", label: "Days Analysed", sub: "last 12 months", color: .blue)
        }
    }

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Burn by Day of Week")
                .font(.headline)
            Text("Average active calories · dashed line = overall mean")
                .font(.caption)
                .foregroundStyle(.secondary)

            if let best = bestDow, let worst = worstDow {
                HStack(spacing: 12) {
                    HStack(spacing: 6) {
                        Circle().fill(Color.orange).frame(width: 8, height: 8)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Most Active").font(.caption2).foregroundStyle(.secondary)
                            Text("\(best.label) · \(Int(best.avg)) kcal").font(.caption.weight(.semibold))
                        }
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        Circle().fill(Color.secondary).frame(width: 8, height: 8)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Least Active").font(.caption2).foregroundStyle(.secondary)
                            Text("\(worst.label) · \(Int(worst.avg)) kcal").font(.caption.weight(.semibold))
                        }
                    }
                }
                .padding(.horizontal, 4)
            }

            Chart {
                ForEach(dowData) { d in
                    BarMark(
                        x: .value("Day", d.label),
                        y: .value("kcal", d.avg)
                    )
                    .foregroundStyle(d.avg >= mean ? Color.orange.opacity(0.8) : Color.secondary.opacity(0.45))
                    .cornerRadius(4)
                }
                if mean > 0 {
                    RuleMark(y: .value("Mean", mean))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .foregroundStyle(Color.orange.opacity(0.45))
                }
            }
            .frame(height: 180)
            .chartYAxis {
                AxisMarks(position: .leading) { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            Text(v >= 1000 ? "\(Int(v/1000))k" : "\(Int(v))")
                                .font(.caption2)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var weekdayWeekendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Weekdays vs Weekends")
                .font(.headline)

            let maxVal = max(weekdayAvg, weekendAvg, 1)
            ForEach([("Weekdays", weekdayAvg, Color.orange), ("Weekends", weekendAvg, Color.yellow)],
                    id: \.0) { label, val, color in
                VStack(spacing: 4) {
                    HStack {
                        Text(label).font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        Text("\(Int(val)) kcal").font(.caption.weight(.semibold))
                    }
                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(color.opacity(0.2))
                            .overlay(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(color.opacity(0.75))
                                    .frame(width: geo.size.width * val / maxVal)
                            }
                    }
                    .frame(height: 10)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var monthlyChart: some View {
        let filtered = monthData.filter { $0.count >= 3 }
        guard !filtered.isEmpty else { return AnyView(EmptyView()) }

        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                Text("Monthly Averages")
                    .font(.headline)
                Text("Seasonal calorie burn trends")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Chart(filtered) { m in
                    BarMark(
                        x: .value("Month", m.label),
                        y: .value("kcal", m.avg)
                    )
                    .foregroundStyle(Color.orange.opacity(0.65))
                    .cornerRadius(4)
                }
                .frame(height: 160)
                .chartYAxis {
                    AxisMarks(position: .leading) { val in
                        AxisValueLabel {
                            if let v = val.as(Double.self) {
                                Text(v >= 1000 ? "\(Int(v/1000))k" : "\(Int(v))")
                                    .font(.caption2)
                            }
                        }
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        )
    }

    private var histogramCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Calorie Distribution")
                .font(.headline)
            Text("How often you hit each range")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart(histogram) { bucket in
                BarMark(
                    x: .value("Range", bucket.label),
                    y: .value("Days", bucket.count)
                )
                .foregroundStyle(bucket.isGoal ? Color.orange.opacity(0.80) : Color.orange.opacity(0.35))
                .cornerRadius(3)
            }
            .frame(height: 150)
            .chartYAxis {
                AxisMarks(position: .leading) { val in
                    AxisValueLabel {
                        if let v = val.as(Int.self) {
                            Text("\(v)d").font(.caption2)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks { _ in
                    AxisValueLabel().font(.system(size: 9))
                }
            }

            if let goal = calorieGoal {
                Text("Darker bars = at or above your \(goal) kcal goal")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var consistencyCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Consistency Analysis")
                .font(.headline)

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Score: \(consistencyScore) / 100")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(consistencyColor)
                    Text(consistencyLabel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    ProgressView(value: Double(consistencyScore), total: 100)
                        .tint(consistencyColor)
                }
            }

            Divider()

            HStack(spacing: 0) {
                ForEach([
                    ("Mean", "\(Int(mean)) kcal"),
                    ("Std Dev", "±\(Int(stddev)) kcal"),
                    ("CV", "\(Int(cv * 100))%"),
                ], id: \.0) { label, value in
                    VStack(spacing: 2) {
                        Text(value).font(.subheadline.weight(.semibold))
                        Text(label).font(.caption2).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            Text("High variability often reflects workout-day spikes vs rest days — a healthy pattern.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .padding(.top, 2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "flame.fill")
                .font(.system(size: 48))
                .foregroundStyle(.orange.opacity(0.5))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Sync at least a week of activity data to see calorie burn patterns.")
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

        guard let rows = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 365) else { return }
        let validRows = rows.filter { ($0.active_calories ?? 0) > 0 }

        // Calorie goal from user profile (optional)
        let profile = try? await SupabaseService.shared.fetchCurrentUser()
        let goal = profile?.calorieGoal

        // Day-of-week buckets
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        var dowBuckets = Array(repeating: (sum: 0.0, count: 0), count: 7)
        var monBuckets = Array(repeating: (sum: 0.0, count: 0), count: 12)
        var calValues: [Double] = []

        for row in validRows {
            let cal = Double(row.active_calories ?? 0)
            guard cal > 0 else { continue }
            calValues.append(cal)

            if let date = df.date(from: row.date) {
                let comps = Calendar.current.dateComponents([.weekday, .month], from: date)
                let wd = (comps.weekday ?? 1) - 1  // 0=Sun
                let mo = (comps.month ?? 1) - 1    // 0=Jan
                dowBuckets[wd].sum += cal
                dowBuckets[wd].count += 1
                monBuckets[mo].sum += cal
                monBuckets[mo].count += 1
            }
        }

        let n = Double(calValues.count)
        let m = n > 0 ? calValues.reduce(0,+) / n : 0
        let v = n > 1 ? calValues.reduce(0.0) { $0 + pow($1 - m, 2) } / n : 0
        let sd = v.squareRoot()

        // Histogram
        let histBuckets: [(String, Double, Double)] = [
            ("<100",    0,    100),
            ("100–200", 100,  200),
            ("200–350", 200,  350),
            ("350–500", 350,  500),
            ("500–700", 500,  700),
            ("700–900", 700,  900),
            ("900–1.2K",900,  1200),
            ("1.2K+",   1200, .infinity),
        ]
        let histResult = histBuckets.enumerated().map { i, bucket in
            HistBucket(
                id: i,
                label: bucket.0,
                count: calValues.filter { $0 >= bucket.1 && $0 < bucket.2 }.count,
                isGoal: goal != nil && bucket.1 >= Double(goal!)
            )
        }

        await MainActor.run {
            dowData = dowBuckets.enumerated().map { i, b in
                DayBucket(id: i, label: dowLabels[i], avg: b.count > 0 ? b.sum / Double(b.count) : 0, count: b.count)
            }
            monthData = monBuckets.enumerated().map { i, b in
                MonthBucket(id: i, label: monLabels[i], avg: b.count > 0 ? b.sum / Double(b.count) : 0, count: b.count)
            }
            histogram   = histResult
            mean        = m
            stddev      = sd
            cv          = m > 0 ? sd / m : 0
            totalDays   = calValues.count
            calorieGoal = goal
        }
    }
}

// MARK: - Stat Card

private struct CalorieStatCard: View {
    let value: String
    let label: String
    let sub: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.caption.weight(.medium))
                .multilineTextAlignment(.center)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack {
        CaloriePatternView()
    }
}
