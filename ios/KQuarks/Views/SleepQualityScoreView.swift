import SwiftUI
import Charts
import HealthKit

// MARK: - Models

private struct ScoredNight: Identifiable {
    let id = UUID()
    let date: Date
    let sleepHours: Double
    let deepPct: Double?
    let remPct: Double?
    let efficiency: Double?   // 0–100
    let durationScore: Int    // 0–100
    let stagesScore: Int      // 0–100
    let efficiencyScore: Int  // 0–100
    let totalScore: Int       // 0–100
    let grade: Grade

    enum Grade: String {
        case excellent = "Excellent"
        case good      = "Good"
        case fair      = "Fair"
        case poor      = "Poor"

        var color: Color {
            switch self {
            case .excellent: return .green
            case .good:      return .blue
            case .fair:      return .orange
            case .poor:      return .red
            }
        }

        var threshold: Int {
            switch self {
            case .excellent: return 80
            case .good:      return 65
            case .fair:      return 50
            case .poor:      return 0
            }
        }

        static func from(score: Int) -> Grade {
            if score >= 80 { return .excellent }
            if score >= 65 { return .good }
            if score >= 50 { return .fair }
            return .poor
        }
    }
}

// MARK: - SleepQualityScoreView

struct SleepQualityScoreView: View {
    @State private var nights: [ScoredNight] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    private var latest: ScoredNight? { nights.last }
    private var avgScore: Int {
        guard !nights.isEmpty else { return 0 }
        return nights.reduce(0) { $0 + $1.totalScore } / nights.count
    }
    private var bestNight: ScoredNight? { nights.max(by: { $0.totalScore < $1.totalScore }) }
    private var excellentCount: Int { nights.filter { $0.grade == .excellent }.count }
    private var poorCount: Int { nights.filter { $0.grade == .poor }.count }

    private var avgDurationScore: Int {
        guard !nights.isEmpty else { return 0 }
        return nights.reduce(0) { $0 + $1.durationScore } / nights.count
    }
    private var avgStagesScore: Int {
        guard !nights.isEmpty else { return 0 }
        return nights.reduce(0) { $0 + $1.stagesScore } / nights.count
    }
    private var avgEffScore: Int {
        guard !nights.isEmpty else { return 0 }
        return nights.reduce(0) { $0 + $1.efficiencyScore } / nights.count
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                } else if nights.isEmpty {
                    emptyState
                } else {
                    if let n = latest { scoreCard(n) }
                    summaryCards
                    if nights.count >= 5 { trendChart }
                    componentBreakdown
                    if nights.count >= 7 { dowChart }
                    gradeGuide
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Sleep Quality Score")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Score Card

    private func scoreCard(_ night: ScoredNight) -> some View {
        VStack(spacing: 12) {
            Text("Most Recent Night")
                .font(.caption.uppercaseSmallCaps())
                .foregroundStyle(.secondary)

            HStack(alignment: .bottom, spacing: 4) {
                Text("\(night.totalScore)")
                    .font(.system(size: 72, weight: .black, design: .rounded))
                    .foregroundStyle(night.grade.color)
                Text("/100")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 10)
            }

            Text(night.grade.rawValue)
                .font(.headline)
                .foregroundStyle(night.grade.color)

            Text(night.date, style: .date)
                .font(.caption)
                .foregroundStyle(.secondary)

            // Component bars
            HStack(spacing: 12) {
                componentMini(label: "Duration", score: night.durationScore, color: night.grade.color)
                componentMini(label: "Stages",   score: night.stagesScore,   color: night.grade.color)
                componentMini(label: "Efficiency",score: night.efficiencyScore,color: night.grade.color)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func componentMini(label: String, score: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            Text("\(score)")
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.white.opacity(0.08)).frame(height: 4)
                    RoundedRectangle(cornerRadius: 2).fill(color)
                        .frame(width: geo.size.width * CGFloat(score) / 100, height: 4)
                }
            }
            .frame(height: 4)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        HStack(spacing: 10) {
            miniCard(label: "Avg Score", value: "\(avgScore)", color: grade(avgScore).color)
            miniCard(label: "Excellent", value: "\(excellentCount)", color: .green)
            miniCard(label: "Poor", value: "\(poorCount)", color: .red)
            if let b = bestNight {
                miniCard(label: "Best", value: "\(b.totalScore)", color: .yellow)
            }
        }
    }

    private func miniCard(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Score Trend — Last 60 Days")
                .font(.headline)
                .padding(.horizontal, 4)

            let last30 = nights.suffix(30)
            Chart {
                RuleMark(y: .value("Excellent", 80))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.green.opacity(0.4))
                RuleMark(y: .value("Good", 65))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.blue.opacity(0.3))
                RuleMark(y: .value("Fair", 50))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.orange.opacity(0.3))

                ForEach(last30) { n in
                    BarMark(
                        x: .value("Date", n.date, unit: .day),
                        y: .value("Score", n.totalScore)
                    )
                    .foregroundStyle(n.grade.color.opacity(0.8))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { val in
                    if let d = val.as(Date.self) {
                        AxisValueLabel {
                            Text(d, format: .dateTime.month(.abbreviated).day())
                                .font(.caption2)
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks(values: [0, 50, 65, 80, 100]) { val in
                    if let v = val.as(Int.self) {
                        AxisValueLabel { Text("\(v)") }
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Component Breakdown

    private var componentBreakdown: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Component Averages")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 10) {
                componentRow(label: "Duration (40%)", score: avgDurationScore, desc: "7–9h scores 90–100")
                componentRow(label: "Stages (30%)",   score: avgStagesScore,   desc: "≥15% deep + ≥20% REM")
                componentRow(label: "Efficiency (30%)",score: avgEffScore,     desc: "Sleep time / time in bed")
            }
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    private func componentRow(label: String, score: Int, desc: String) -> some View {
        VStack(spacing: 6) {
            HStack {
                Text(label).font(.subheadline.weight(.medium))
                Spacer()
                Text("\(score)").font(.subheadline.bold()).foregroundStyle(grade(score).color)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(Color.white.opacity(0.08)).frame(height: 6)
                    RoundedRectangle(cornerRadius: 3).fill(grade(score).color)
                        .frame(width: geo.size.width * CGFloat(score) / 100, height: 6)
                }
            }
            .frame(height: 6)
            Text(desc).font(.caption2).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Day of Week Chart

    private var dowChart: some View {
        let weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        let cal = Calendar.current
        let dowData: [(String, Double)] = weekdays.enumerated().map { (i, day) in
            let dayNights = nights.filter { cal.component(.weekday, from: $0.date) == i + 1 }
            let avg = dayNights.isEmpty ? 0.0 : Double(dayNights.reduce(0) { $0 + $1.totalScore }) / Double(dayNights.count)
            return (day, avg)
        }
        let dowmax = dowData.map { $0.1 }.max().map { Swift.max($0, 10) } ?? 100

        return VStack(alignment: .leading, spacing: 8) {
            Text("Average Score by Day of Week")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(dowData, id: \.0) { (day, score) in
                    if score > 0 {
                        BarMark(
                            x: .value("Day", day),
                            y: .value("Score", score)
                        )
                        .foregroundStyle(score == dowmax ? Color.green : Color.indigo.opacity(0.6))
                        .cornerRadius(4)
                    }
                }
            }
            .chartYScale(domain: 0...dowmax)
            .frame(height: 120)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))

            if let best = dowData.max(by: { $0.1 < $1.1 }), best.1 > 0 {
                Text("✅ Your best sleep tends to be on \(best.0)nights")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }
        }
    }

    // MARK: - Grade Guide

    private var gradeGuide: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Score Guide")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach([
                    ("Excellent", "80–100", "Optimal recovery · Hard training day ideal", Color.green),
                    ("Good",      "65–79",  "Solid sleep · Moderate training OK",         Color.blue),
                    ("Fair",      "50–64",  "Some deficits · Stick to easy effort",        Color.orange),
                    ("Poor",      "0–49",   "Poor recovery · Prioritize rest today",       Color.red),
                ], id: \.0) { name, range, tip, color in
                    HStack(spacing: 12) {
                        Circle().fill(color).frame(width: 10, height: 10)
                        VStack(alignment: .leading, spacing: 1) {
                            HStack {
                                Text(name).font(.subheadline.weight(.semibold)).foregroundStyle(color)
                                Text(range).font(.caption).foregroundStyle(.secondary)
                            }
                            Text(tip).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
                    if name != "Poor" { Divider().padding(.leading, 34) }
                }
            }
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))

            Text("Score = 40% duration + 30% sleep stages + 30% efficiency. Stages score is neutral (50) when stage data is unavailable.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "star.slash.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No sleep data found")
                .font(.title3.bold())
            Text("Enable sleep tracking with your Apple Watch to see nightly quality scores.")
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

        let start = Calendar.current.date(byAdding: .day, value: -60, to: Date()) ?? Date()
        guard let samples = try? await healthKit.fetchSleepAnalysis(from: start, to: Date()) else { return }

        // Group into nightly sessions (same logic as SleepView)
        let cal = Calendar.current
        var byDay: [DateComponents: [HKCategorySample]] = [:]
        for s in samples {
            let wakeDay = cal.dateComponents([.year, .month, .day], from: s.endDate)
            byDay[wakeDay, default: []].append(s)
        }

        nights = byDay.compactMap { entry -> ScoredNight? in
            scoredNight(dc: entry.key, daySamples: entry.value, cal: cal)
        }
        .sorted { $0.date < $1.date }
    }

    // MARK: - Scoring Helpers

    private func scoredNight(dc: DateComponents, daySamples: [HKCategorySample], cal: Calendar) -> ScoredNight? {
        guard let date = cal.date(from: dc) else { return nil }
        var deep = 0, rem = 0, core = 0, awake = 0
        for s in daySamples {
            let mins = Int(s.endDate.timeIntervalSince(s.startDate) / 60)
            switch HKCategoryValueSleepAnalysis(rawValue: s.value) {
            case .asleepDeep: deep += mins
            case .asleepREM: rem += mins
            case .asleepCore: core += mins
            case .asleepUnspecified: core += mins
            case .awake: awake += mins
            case .inBed: awake += mins
            default: break
            }
        }
        let totalSleep = deep + rem + core
        guard totalSleep > 60 else { return nil }
        let hours = Double(totalSleep) / 60.0
        let deepPct = deep > 0 ? Double(deep) / Double(totalSleep) : nil
        let remPct  = rem  > 0 ? Double(rem)  / Double(totalSleep) : nil
        let totalInBed = totalSleep + awake
        let eff: Double? = totalInBed > 0 ? min(100.0, Double(totalSleep) / Double(totalInBed) * 100.0) : nil
        let dScore = scoreDuration(hours)
        let sScore = scoreStages(deepPct: deepPct, remPct: remPct)
        let eScore = scoreEfficiency(eff)
        let total  = Int(Double(dScore) * 0.4 + Double(sScore) * 0.3 + Double(eScore) * 0.3)
        return ScoredNight(date: date, sleepHours: hours, deepPct: deepPct.map { $0 * 100 },
                           remPct: remPct.map { $0 * 100 }, efficiency: eff,
                           durationScore: dScore, stagesScore: sScore, efficiencyScore: eScore,
                           totalScore: total, grade: ScoredNight.Grade.from(score: total))
    }

    private func scoreDuration(_ h: Double) -> Int {
        if h >= 8 && h <= 9 { return 100 }
        if h >= 7 { return 90 }
        if h > 9 && h <= 10 { return 80 }
        if h >= 6 { return 60 }
        if h > 10 { return 55 }
        if h >= 5 { return 35 }
        return 15
    }

    private func scoreStages(deepPct: Double?, remPct: Double?) -> Int {
        guard deepPct != nil || remPct != nil else { return 50 }
        var total = 0.0; var count = 0
        if let d = deepPct { total += min(d / 0.20, 1.0) * 100; count += 1 }
        if let r = remPct  { total += min(r / 0.25, 1.0) * 100; count += 1 }
        return count > 0 ? Int(total / Double(count)) : 50
    }

    private func scoreEfficiency(_ eff: Double?) -> Int {
        guard let e = eff else { return 50 }
        if e >= 90 { return 100 }
        if e >= 85 { return 90 }
        if e >= 75 { return 70 }
        if e >= 65 { return 45 }
        return 25
    }

    private func grade(_ score: Int) -> ScoredNight.Grade { ScoredNight.Grade.from(score: score) }
}

#Preview {
    NavigationStack { SleepQualityScoreView() }
}
