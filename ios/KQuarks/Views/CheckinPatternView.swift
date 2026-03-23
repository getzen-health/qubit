import SwiftUI
import Charts

// MARK: - Top-level models

struct CheckinDowStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgEnergy: Double
    let avgMood: Double
    let avgStress: Double
}

struct CheckinMonthStat: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let avgEnergy: Double
    let avgMood: Double
    let avgStress: Double
}

struct CheckinScoreDist: Identifiable {
    let id = UUID()
    let score: Int
    let count: Int
    let pct: Int
}

// MARK: - CheckinPatternView

struct CheckinPatternView: View {
    @State private var dowData: [CheckinDowStat] = []
    @State private var monthData: [CheckinMonthStat] = []
    @State private var energyDist: [CheckinScoreDist] = []
    @State private var moodDist: [CheckinScoreDist] = []
    @State private var stressDist: [CheckinScoreDist] = []
    @State private var totalDays = 0
    @State private var overallEnergy: Double = 0
    @State private var overallMood: Double = 0
    @State private var overallStress: Double = 0
    @State private var weekdayAvgEnergy: Double? = nil
    @State private var weekendAvgEnergy: Double? = nil
    @State private var weekdayAvgMood: Double? = nil
    @State private var weekendAvgMood: Double? = nil
    @State private var weekdayAvgStress: Double? = nil
    @State private var weekendAvgStress: Double? = nil
    @State private var bestMoodDow: String? = nil
    @State private var highStressDow: String? = nil
    @State private var isLoading = false

    private let dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    private let energyEmojis = ["", "😴", "😑", "😐", "🙂", "😄"]
    private let moodEmojis   = ["", "😞", "😕", "😐", "🙂", "😁"]
    private let stressEmojis = ["", "😌", "🙂", "😐", "😟", "😰"]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalDays < 5 {
                    emptyState
                } else {
                    summaryRow
                    if !dowData.isEmpty { dowEnergyMoodChart }
                    if !dowData.isEmpty { stressByDowCard }
                    if monthData.count >= 2 { monthTrendChart }
                    if weekdayAvgMood != nil && weekendAvgMood != nil { weekdayWeekendCard }
                    distributionCard
                    consistencyCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Check-in Patterns")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Text("📋").font(.system(size: 60))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Log your mood and energy for at least 5 days to see patterns.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    // MARK: - Summary row

    private var summaryRow: some View {
        HStack(spacing: 12) {
            summaryTile(label: "Energy", value: overallEnergy, color: .yellow, emoji: "⚡")
            summaryTile(label: "Mood", value: overallMood, color: .purple, emoji: "😊")
            summaryTile(label: "Stress", value: overallStress, color: .red, emoji: "😤")
        }
    }

    private func summaryTile(label: String, value: Double, color: Color, emoji: String) -> some View {
        VStack(spacing: 4) {
            Text(emoji).font(.title2)
            Text(String(format: "%.1f", value))
                .font(.title2.bold())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(scoreLabel(value))
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - DOW Energy & Mood chart

    private var dowEnergyMoodChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Energy & Mood by Day")
                .font(.headline)

            Chart {
                ForEach(dowData) { d in
                    BarMark(
                        x: .value("Day", d.label),
                        y: .value("Energy", d.avgEnergy)
                    )
                    .foregroundStyle(.yellow.opacity(0.7))
                    .position(by: .value("Metric", "Energy"))

                    BarMark(
                        x: .value("Day", d.label),
                        y: .value("Mood", d.avgMood)
                    )
                    .foregroundStyle(.purple.opacity(0.7))
                    .position(by: .value("Metric", "Mood"))
                }
            }
            .chartYScale(domain: 0...5)
            .chartYAxis {
                AxisMarks(values: [0, 1, 2, 3, 4, 5]) { v in
                    AxisValueLabel { Text("\(v.as(Int.self) ?? 0)").font(.caption2) }
                    AxisGridLine()
                }
            }
            .frame(height: 160)

            // Legend
            HStack(spacing: 16) {
                Label("Energy", systemImage: "circle.fill").foregroundStyle(.yellow).font(.caption)
                Label("Mood", systemImage: "circle.fill").foregroundStyle(.purple).font(.caption)
            }

            // Best/worst callouts
            HStack(spacing: 12) {
                if let best = bestMoodDow {
                    Label("Best mood: \(best)", systemImage: "face.smiling")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.purple)
                }
                if let worst = highStressDow {
                    Label("Most stress: \(worst)", systemImage: "exclamationmark.triangle")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Stress by DOW

    private var stressByDowCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Stress by Day of Week")
                .font(.headline)
            Text("Higher = more stressed")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(dowData) { d in
                HStack(spacing: 10) {
                    Text(d.label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .leading)

                    GeometryReader { geo in
                        let pct = d.avgStress > 0 ? min(d.avgStress / 5.0, 1.0) : 0
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color(.tertiarySystemBackground)).frame(height: 10)
                            Capsule()
                                .fill(stressBarColor(d.avgStress))
                                .frame(width: geo.size.width * pct, height: 10)
                        }
                    }
                    .frame(height: 10)

                    Text(d.avgStress > 0 ? String(format: "%.1f", d.avgStress) : "—")
                        .font(.caption.bold())
                        .frame(width: 28, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly trend

    private var monthTrendChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Monthly Wellness Trend")
                .font(.headline)

            Chart {
                ForEach(monthData) { m in
                    LineMark(x: .value("Month", m.label), y: .value("Energy", m.avgEnergy))
                        .foregroundStyle(.yellow)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Month", m.label), y: .value("Energy", m.avgEnergy))
                        .foregroundStyle(.yellow)

                    LineMark(x: .value("Month", m.label), y: .value("Mood", m.avgMood))
                        .foregroundStyle(.purple)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Month", m.label), y: .value("Mood", m.avgMood))
                        .foregroundStyle(.purple)

                    LineMark(x: .value("Month", m.label), y: .value("Stress", m.avgStress))
                        .foregroundStyle(.red.opacity(0.7))
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 2]))
                }
            }
            .chartYScale(domain: 1...5)
            .frame(height: 160)

            HStack(spacing: 16) {
                Label("Energy", systemImage: "circle.fill").foregroundStyle(.yellow).font(.caption)
                Label("Mood", systemImage: "circle.fill").foregroundStyle(.purple).font(.caption)
                Label("Stress", systemImage: "line.diagonal").foregroundStyle(.red.opacity(0.7)).font(.caption)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Weekday vs Weekend

    private var weekdayWeekendCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weekday vs Weekend")
                .font(.headline)

            HStack(spacing: 0) {
                VStack(spacing: 4) {
                    Text("Weekday")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(spacing: 16) {
                        metricPill("⚡", weekdayAvgEnergy, .yellow)
                        metricPill("😊", weekdayAvgMood, .purple)
                        metricPill("😤", weekdayAvgStress, .red)
                    }
                }
                .frame(maxWidth: .infinity)

                Rectangle()
                    .fill(Color(.separator))
                    .frame(width: 1, height: 50)

                VStack(spacing: 4) {
                    Text("Weekend")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(spacing: 16) {
                        metricPill("⚡", weekendAvgEnergy, .yellow)
                        metricPill("😊", weekendAvgMood, .purple)
                        metricPill("😤", weekendAvgStress, .red)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func metricPill(_ emoji: String, _ val: Double?, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(emoji).font(.caption)
            Text(val.map { String(format: "%.1f", $0) } ?? "—")
                .font(.subheadline.bold())
                .foregroundStyle(color)
        }
    }

    // MARK: - Distributions

    private var distributionCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Score Distributions")
                .font(.headline)

            VStack(alignment: .leading, spacing: 8) {
                Text("Energy").font(.subheadline.weight(.medium)).foregroundStyle(.yellow)
                distBars(energyDist, emojis: energyEmojis, isStress: false)
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Text("Mood").font(.subheadline.weight(.medium)).foregroundStyle(.purple)
                distBars(moodDist, emojis: moodEmojis, isStress: false)
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Text("Stress").font(.subheadline.weight(.medium)).foregroundStyle(.red)
                distBars(stressDist, emojis: stressEmojis, isStress: true)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func distBars(_ dist: [CheckinScoreDist], emojis: [String], isStress: Bool) -> some View {
        VStack(spacing: 6) {
            ForEach(dist) { d in
                HStack(spacing: 8) {
                    Text(emojis[d.score]).font(.caption)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color(.tertiarySystemBackground)).frame(height: 8)
                            Capsule()
                                .fill(scoreBarColor(d.score, isStress: isStress))
                                .frame(width: geo.size.width * CGFloat(d.pct) / 100, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(d.pct)%")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .frame(width: 28, alignment: .trailing)
                }
            }
        }
    }

    // MARK: - Consistency

    private var consistencyCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Logging Consistency")
                .font(.headline)
            HStack(alignment: .lastTextBaseline, spacing: 6) {
                Text("\(totalDays)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                Text("days logged this year")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            GeometryReader { geo in
                let pct = min(Double(totalDays) / 365.0, 1.0)
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(.tertiarySystemBackground)).frame(height: 10)
                    Capsule()
                        .fill(Color.purple)
                        .frame(width: geo.size.width * pct, height: 10)
                }
            }
            .frame(height: 10)
            Text("\(Int((Double(totalDays) / 365.0) * 100))% of days this year")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Helpers

    private func scoreLabel(_ v: Double) -> String {
        if v >= 4.5 { return "Great" }
        if v >= 3.5 { return "Good" }
        if v >= 2.5 { return "Okay" }
        if v >= 1.5 { return "Low" }
        return "Poor"
    }

    private func scoreBarColor(_ score: Int, isStress: Bool) -> Color {
        let s = isStress ? 6 - score : score
        switch s {
        case 5: return .green
        case 4: return Color.green.opacity(0.6)
        case 3: return .yellow
        case 2: return .orange
        default: return .red
        }
    }

    private func stressBarColor(_ stress: Double) -> Color {
        if stress <= 1.5 { return .green }
        if stress <= 2.5 { return Color.green.opacity(0.6) }
        if stress <= 3.5 { return .yellow }
        if stress <= 4.0 { return .orange }
        return .red
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            guard let userId = SupabaseService.shared.currentSession?.user.id else { return }
            let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
            let startStr = ISO8601DateFormatter().string(from: oneYearAgo).prefix(10)

            struct CheckinRow: Decodable {
                let date: String
                let energy: Int?
                let mood: Int?
                let stress: Int?
            }

            let rows: [CheckinRow] = try await SupabaseService.shared.client
                .from("daily_checkins")
                .select("date, energy, mood, stress")
                .eq("user_id", value: userId.uuidString)
                .gte("date", value: String(startStr))
                .order("date", ascending: true)
                .execute()
                .value

            let valid = rows.filter { $0.energy != nil || $0.mood != nil || $0.stress != nil }
            totalDays = valid.count
            guard totalDays >= 5 else { return }

            func avg(_ vals: [Int?]) -> Double {
                let v = vals.compactMap { $0 }
                guard !v.isEmpty else { return 0 }
                return Double(v.reduce(0, +)) / Double(v.count)
            }

            overallEnergy = avg(valid.map(\.energy))
            overallMood   = avg(valid.map(\.mood))
            overallStress = avg(valid.map(\.stress))

            // DOW
            var dowBuckets: [[CheckinRow]] = Array(repeating: [], count: 7)
            for r in valid {
                let dow = Calendar.current.component(.weekday, from: dateFromString(r.date)) - 1
                if dow >= 0 && dow < 7 { dowBuckets[dow].append(r) }
            }
            dowData = dowBuckets.enumerated().map { i, bucket in
                CheckinDowStat(
                    label: dowLabels[i],
                    count: bucket.count,
                    avgEnergy: avg(bucket.map(\.energy)),
                    avgMood: avg(bucket.map(\.mood)),
                    avgStress: avg(bucket.map(\.stress))
                )
            }

            let dowWithMood = dowData.filter { $0.avgMood > 0 && $0.count >= 2 }
            bestMoodDow = dowWithMood.max(by: { $0.avgMood < $1.avgMood })?.label
            highStressDow = dowData.filter { $0.avgStress > 0 && $0.count >= 2 }.max(by: { $0.avgStress < $1.avgStress })?.label

            // Monthly
            var monthBuckets: [String: [CheckinRow]] = [:]
            for r in valid {
                let key = String(r.date.prefix(7))
                monthBuckets[key, default: []].append(r)
            }
            monthData = monthBuckets.keys.sorted().suffix(12).compactMap { key -> CheckinMonthStat? in
                guard let bucket = monthBuckets[key] else { return nil }
                let parts = key.split(separator: "-")
                guard parts.count == 2, let m = Int(parts[1]), m >= 1, m <= 12 else { return nil }
                return CheckinMonthStat(
                    label: monthLabels[m - 1],
                    count: bucket.count,
                    avgEnergy: avg(bucket.map(\.energy)),
                    avgMood: avg(bucket.map(\.mood)),
                    avgStress: avg(bucket.map(\.stress))
                )
            }

            // Weekday vs Weekend
            let weekdays = valid.filter { let w = Calendar.current.component(.weekday, from: dateFromString($0.date)); return w >= 2 && w <= 6 }
            let weekends = valid.filter { let w = Calendar.current.component(.weekday, from: dateFromString($0.date)); return w == 1 || w == 7 }

            if !weekdays.isEmpty {
                weekdayAvgEnergy = avg(weekdays.map(\.energy)).nonZero
                weekdayAvgMood   = avg(weekdays.map(\.mood)).nonZero
                weekdayAvgStress = avg(weekdays.map(\.stress)).nonZero
            }
            if !weekends.isEmpty {
                weekendAvgEnergy = avg(weekends.map(\.energy)).nonZero
                weekendAvgMood   = avg(weekends.map(\.mood)).nonZero
                weekendAvgStress = avg(weekends.map(\.stress)).nonZero
            }

            // Distributions
            func dist(_ keyPath: KeyPath<CheckinRow, Int?>) -> [CheckinScoreDist] {
                let rowsForMetric = valid.filter { $0[keyPath: keyPath] != nil }
                let n = rowsForMetric.count
                return (1...5).map { score in
                    let count = rowsForMetric.filter { $0[keyPath: keyPath] == score }.count
                    return CheckinScoreDist(
                        score: score,
                        count: count,
                        pct: n > 0 ? Int(Double(count) / Double(n) * 100) : 0
                    )
                }
            }
            energyDist = dist(\.energy)
            moodDist   = dist(\.mood)
            stressDist = dist(\.stress)
        } catch {
            print("[CheckinPatternView] loadData failed: \(error)")
        }
    }

    private func dateFromString(_ s: String) -> Date {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "UTC")
        return df.date(from: s) ?? Date()
    }
}

private extension Double {
    var nonZero: Double? { self > 0 ? self : nil }
}

#Preview {
    NavigationStack { CheckinPatternView() }
}
