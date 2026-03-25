import SwiftUI
import Charts
import HealthKit

// MARK: - HealthScoreView

/// Composite daily health score (0–100) built from Sleep, Activity, and Recovery.
/// Mirrors the web /score page's scoring algorithm.
struct HealthScoreView: View {
    @State private var scoredDays: [ScoredDay] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    struct ScoredDay: Identifiable {
        let id = UUID()
        let date: Date
        let sleepScore: Double?
        let activityScore: Double?
        let recoveryScore: Double?

        var overall: Double? {
            let comps = [sleepScore, activityScore, recoveryScore].compactMap { $0 }
            guard !comps.isEmpty else { return nil }
            return comps.reduce(0, +) / Double(comps.count)
        }
    }

    private var today: ScoredDay? { scoredDays.last }
    private var todayScore: Double { today?.overall ?? 0 }

    private var weekAvg: Double? {
        let week = scoredDays.suffix(7).compactMap(\.overall)
        return week.isEmpty ? nil : week.reduce(0, +) / Double(week.count)
    }

    private var grade: (label: String, color: Color) {
        switch todayScore {
        case 85...: return ("Excellent", .green)
        case 70..<85: return ("Good", Color(red: 0.6, green: 0.9, blue: 0.2))
        case 55..<70: return ("Fair", .yellow)
        case 40..<55: return ("Low", .orange)
        default: return ("Poor", .red)
        }
    }

    private var insights: [(icon: String, color: Color, text: String)] {
        guard let day = today else { return [] }
        var list: [(String, Color, String)] = []
        if let s = day.sleepScore {
            if s < 60 { list.append(("moon.zzz.fill", .indigo, "Sleep is your biggest opportunity — aim for 7–9 hours")) }
            else if s >= 90 { list.append(("moon.stars.fill", .indigo, "Great sleep last night — recovery is optimised")) }
        }
        if let a = day.activityScore {
            if a < 50 { list.append(("figure.walk", .green, "Activity is below your goal — a short walk helps")) }
            else if a >= 90 { list.append(("figure.run", .green, "Crushing your activity goal today")) }
        }
        if let r = day.recoveryScore {
            if r < 50 { list.append(("heart.fill", .red, "Recovery is low — consider a lighter training day")) }
            else if r >= 85 { list.append(("bolt.heart.fill", .pink, "High HRV and low resting HR — green light to push hard")) }
        }
        if list.isEmpty {
            list.append(("checkmark.circle.fill", .green, "Solid overall balance across sleep, activity and recovery"))
        }
        return list
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if scoredDays.isEmpty {
                    emptyState
                } else {
                    heroCard
                    componentBreakdownCard
                    if scoredDays.count >= 5 { trendChart }
                    insightsCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Health Score")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Today")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text(grade.label)
                        .font(.title.bold())
                        .foregroundStyle(grade.color)
                    if let wa = weekAvg {
                        Text(String(format: "7-day avg: %.0f", wa))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(grade.color.opacity(0.15), lineWidth: 12)
                        .frame(width: 100, height: 100)
                    Circle()
                        .trim(from: 0, to: todayScore / 100)
                        .stroke(grade.color, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 100, height: 100)
                        .animation(.easeOut(duration: 0.6), value: todayScore)
                    VStack(spacing: 0) {
                        Text("\(Int(todayScore))")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundStyle(grade.color)
                        Text("/ 100")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Component Breakdown

    private var componentBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Score Breakdown")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 10) {
                if let s = today?.sleepScore {
                    ScoreBar(label: "Sleep", icon: "moon.fill", score: s, color: .indigo)
                }
                if let a = today?.activityScore {
                    ScoreBar(label: "Activity", icon: "figure.walk", score: a, color: .green)
                }
                if let r = today?.recoveryScore {
                    ScoreBar(label: "Recovery", icon: "heart.fill", score: r, color: .pink)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Trend Chart

    private var trendChartDomainMax: Double {
        let maxScore = scoredDays.compactMap(\.overall).max() ?? 0
        return max(100.0, maxScore + 5)
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            let chartDays = scoredDays.compactMap { d -> (date: Date, score: Double)? in
                guard let s = d.overall else { return nil }
                return (d.date, s)
            }

            Chart {
                RuleMark(y: .value("Good", 70))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.green.opacity(0.4))
                    .annotation(position: .topLeading) {
                        Text("Good")
                            .font(.caption2)
                            .foregroundStyle(.green.opacity(0.6))
                    }

                ForEach(Array(chartDays.enumerated()), id: \.offset) { _, pt in
                    AreaMark(
                        x: .value("Date", pt.date),
                        y: .value("Score", pt.score)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [scoreColor(pt.score).opacity(0.3), .clear],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .interpolationMethod(.catmullRom)

                    LineMark(
                        x: .value("Date", pt.date),
                        y: .value("Score", pt.score)
                    )
                    .foregroundStyle(scoreColor(pt.score))
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                }
            }
            .chartYScale(domain: 0...trendChartDomainMax)
            .chartYAxisLabel("score")
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Insights Card

    private var insightsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(.yellow)
                Text("Insights")
                    .font(.subheadline.weight(.semibold))
            }
            ForEach(insights, id: \.text) { insight in
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: insight.icon)
                        .foregroundStyle(insight.color)
                        .frame(width: 20)
                    Text(insight.text)
                        .font(.caption)
                        .foregroundStyle(.primary)
                }
            }

            Text("Score weights: Sleep 33%, Activity 33%, Recovery 33%. Recovery uses HRV and resting heart rate relative to your 30-day median baseline.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "chart.bar.doc.horizontal")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Score Yet")
                .font(.title3.bold())
            Text("At least 3 days of health data (sleep, steps, or HRV) are required to compute your score.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func scoreColor(_ score: Double) -> Color {
        switch score {
        case 85...: return .green
        case 70..<85: return Color(red: 0.6, green: 0.9, blue: 0.2)
        case 55..<70: return .yellow
        case 40..<55: return .orange
        default: return .red
        }
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let cal = Calendar.current
        let end = Date()
        let start = cal.date(byAdding: .day, value: -30, to: end) ?? Date()

        // Fetch raw data concurrently
        async let sleepRaw = (try? await healthKit.fetchSleepAnalysis(from: start, to: end)) ?? []
        async let stepRaw = (try? await healthKit.fetchSamples(for: .stepCount, from: start, to: end)) ?? []
        async let hrvRaw = (try? await healthKit.fetchSamples(for: .heartRateVariabilitySDNN, from: start, to: end)) ?? []
        async let rhrRaw = (try? await healthKit.fetchSamples(for: .restingHeartRate, from: start, to: end)) ?? []
        async let calRaw = (try? await healthKit.fetchSamples(for: .activeEnergyBurned, from: start, to: end)) ?? []

        let (sleep, steps, hrv, rhr, calories) = await (sleepRaw, stepRaw, hrvRaw, rhrRaw, calRaw)

        // HRV baseline (30-day median)
        let hrvVals = hrv.map { $0.quantity.doubleValue(for: HKUnit(from: "ms")) }.sorted()
        let baseHrv = hrvVals.isEmpty ? 0.0 : hrvVals[hrvVals.count / 2]

        // RHR baseline (30-day median)
        let rhrVals = rhr.map { $0.quantity.doubleValue(for: .count().unitDivided(by: .minute())) }.sorted()
        let baseRhr = rhrVals.isEmpty ? 0.0 : rhrVals[rhrVals.count / 2]

        // Goals from GoalService
        let stepGoal = Double(GoalService.shared.stepsGoal)
        let calGoal = GoalService.shared.activeCaloriesGoal
        let sleepGoalMins = GoalService.shared.sleepGoalMinutes

        // Aggregate by day
        var dayMap: [DateComponents: (sleepMins: Double, steps: Double, cals: Double, hrv: Double?, rhrVal: Double?)] = [:]

        for s in sleep {
            let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
            let mins = s.endDate.timeIntervalSince(s.startDate) / 60
            dayMap[key, default: (0, 0, 0, nil, nil)].sleepMins += mins
        }
        func sumByDay(_ samples: [HKQuantitySample], unit: HKUnit) -> [DateComponents: Double] {
            var result: [DateComponents: Double] = [:]
            for s in samples {
                let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
                result[key, default: 0] += s.quantity.doubleValue(for: unit)
            }
            return result
        }
        func avgByDay(_ samples: [HKQuantitySample], unit: HKUnit) -> [DateComponents: Double] {
            var sums: [DateComponents: (Double, Int)] = [:]
            for s in samples {
                let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
                let prev = sums[key] ?? (0, 0)
                sums[key] = (prev.0 + s.quantity.doubleValue(for: unit), prev.1 + 1)
            }
            return sums.mapValues { $0.0 / Double($0.1) }
        }

        let stepsByDay = sumByDay(steps, unit: .count())
        let calsByDay = sumByDay(calories, unit: .kilocalorie())
        let hrvByDay = avgByDay(hrv, unit: HKUnit(from: "ms"))
        let rhrByDay = avgByDay(rhr, unit: .count().unitDivided(by: .minute()))

        // Build all keys (last 30 days)
        var results: [ScoredDay] = []
        for offset in (0..<30).reversed() {
            guard let date = cal.date(byAdding: .day, value: -offset, to: end) else { continue }
            let key = cal.dateComponents([.year, .month, .day], from: date)

            let sleepMins = dayMap[key]?.sleepMins ?? 0
            let stepCount = stepsByDay[key] ?? 0
            let calCount = calsByDay[key] ?? 0
            let hrvVal = hrvByDay[key]
            let rhrVal = rhrByDay[key]

            // Sleep score
            let sleepScore: Double? = sleepMins > 60 ? {
                let pct = sleepMins / sleepGoalMins
                if pct >= 1.0 { return min(100, 100 - (pct - 1) * 50) }
                return min(90, pct * 100)
            }() : nil

            // Activity score
            let activityScore: Double? = (stepCount > 0 || calCount > 0) ? {
                let stepS = stepGoal > 0 ? min(100, stepCount / stepGoal * 100) : 0
                let calS = calGoal > 0 ? min(100, calCount / calGoal * 100) : 0
                if stepCount > 0 && calCount > 0 { return (stepS + calS) / 2 }
                return stepCount > 0 ? stepS : calS
            }() : nil

            // Recovery score
            let recoveryScore: Double? = (hrvVal != nil || rhrVal != nil) ? {
                var score = 50.0
                if let hv = hrvVal, baseHrv > 0 {
                    let ratio = hv / baseHrv
                    score += min(50, max(-25, (ratio - 0.7) / 0.6 * 50))
                }
                if let rv = rhrVal, baseRhr > 0 {
                    let diff = baseRhr - rv
                    score += min(20, max(-20, diff * 2))
                }
                return min(100, max(0, score))
            }() : nil

            results.append(ScoredDay(date: date, sleepScore: sleepScore, activityScore: activityScore, recoveryScore: recoveryScore))
        }

        let validDays = results.filter { $0.overall != nil }
        scoredDays = validDays.count >= 3 ? results : []
    }
}

// MARK: - ScoreBar

private struct ScoreBar: View {
    let label: String
    let icon: String
    let score: Double
    let color: Color

    private var grade: String {
        switch score {
        case 85...: return "Excellent"
        case 70..<85: return "Good"
        case 55..<70: return "Fair"
        case 40..<55: return "Low"
        default: return "Poor"
        }
    }

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                    .frame(width: 20)
                Text(label)
                    .font(.subheadline)
                Spacer()
                Text(grade)
                    .font(.caption.bold())
                    .foregroundStyle(color)
                Text("\(Int(score))")
                    .font(.subheadline.bold().monospacedDigit())
                    .frame(width: 32, alignment: .trailing)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color.opacity(0.15))
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geo.size.width * score / 100, height: 8)
                }
            }
            .frame(height: 8)
        }
    }
}

#Preview {
    NavigationStack {
        HealthScoreView()
    }
}
