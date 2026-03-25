import SwiftUI
import Charts
import HealthKit

// MARK: - LongevityView

/// Vitality Score — a composite health index from six longevity-linked metrics:
/// VO2 Max, HRV, Resting Heart Rate, Walking Speed, Daily Steps, Sleep Duration.
struct LongevityView: View {
    @State private var metricData = LongevityMetrics()
    @State private var weeklyScores: [(week: Date, score: Double)] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if !metricData.hasAny {
                    emptyState
                } else {
                    scoreCard
                    metricGrid
                    strengthsCard
                    if weeklyScores.count >= 3 { trendCard }
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Vitality Score")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Score Card

    private var scoreCard: some View {
        let score = metricData.vitalityScore
        let zone = VitalityZone.from(score: score ?? 0)
        return VStack(spacing: 0) {
            HStack(alignment: .center, spacing: 20) {
                // Circular gauge
                ZStack {
                    Circle()
                        .stroke(Color(.systemFill), lineWidth: 12)
                        .frame(width: 110, height: 110)
                    if let s = score {
                        Circle()
                            .trim(from: 0, to: CGFloat(s) / 100)
                            .stroke(zone.color, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                            .frame(width: 110, height: 110)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.7), value: s)
                        Text("\(Int(s))")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                    } else {
                        Text("—")
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text(zone.label)
                        .font(.title3.bold())
                        .foregroundStyle(zone.color)
                    Text(zone.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("\(metricData.availableCount) of 6 metrics available")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .opacity(0.6)
                }
            }
            .padding()
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Metric Grid

    private var metricGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(metricData.metricScores, id: \.key) { m in
                metricCell(m)
            }
        }
    }

    private func metricCell(_ m: MetricScore) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(m.label)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                if let s = m.score {
                    Text("\(Int(s))")
                        .font(.caption.bold())
                        .foregroundStyle(m.swiftColor)
                } else {
                    Text("—").font(.caption).foregroundStyle(.secondary)
                }
            }
            if let val = m.value {
                Text(m.format(val))
                    .font(.title3.bold().monospacedDigit())
            } else {
                Text("No data")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .opacity(0.4)
            }
            Text(m.unit)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .opacity(0.5)
            // Score bar
            if let s = m.score {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color(.systemFill))
                            .frame(height: 4)
                        RoundedRectangle(cornerRadius: 2)
                            .fill(m.swiftColor)
                            .frame(width: geo.size.width * CGFloat(s / 100), height: 4)
                            .animation(.easeInOut(duration: 0.6), value: s)
                    }
                }
                .frame(height: 4)
            }
        }
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Strengths Card

    private var strengthsCard: some View {
        let available = metricData.metricScores.filter { $0.score != nil }.sorted { ($0.score ?? 0) > ($1.score ?? 0) }
        let strengths = Array(available.prefix(2))
        let improvements = Array(available.reversed().prefix(2))
        return HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 8) {
                Label("Strengths", systemImage: "checkmark.seal.fill")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.green)
                ForEach(strengths, id: \.key) { m in
                    HStack {
                        Text(m.label).font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        Text("\(Int(m.score ?? 0))").font(.caption.bold()).foregroundStyle(.green)
                    }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 8) {
                Label("To Improve", systemImage: "arrow.up.circle.fill")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.orange)
                ForEach(improvements, id: \.key) { m in
                    HStack {
                        Text(m.label).font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        Text("\(Int(m.score ?? 0))").font(.caption.bold()).foregroundStyle(.orange)
                    }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Trend Chart

    private var trendCard: some View {
        let scoremax = weeklyScores.map(\.score).max().map { Swift.max($0, 10) } ?? 100
        return VStack(alignment: .leading, spacing: 8) {
            Text("Vitality Trend").font(.headline).padding(.horizontal, 4)
            Chart(weeklyScores, id: \.week) { point in
                LineMark(x: .value("Week", point.week, unit: .weekOfYear),
                         y: .value("Score", point.score))
                .foregroundStyle(Color.purple)
                .interpolationMethod(.catmullRom)
                PointMark(x: .value("Week", point.week, unit: .weekOfYear),
                          y: .value("Score", point.score))
                .foregroundStyle(Color.purple)
                .symbolSize(30)
            }
            .chartYScale(domain: 0...scoremax)
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear, count: 2)) { _ in
                    AxisValueLabel(format: .dateTime.month().day())
                    AxisTick()
                }
            }
            .frame(height: 150)
            .padding(.horizontal, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("How it's calculated", systemImage: "info.circle.fill")
                .font(.subheadline.weight(.semibold))
            VStack(alignment: .leading, spacing: 8) {
                ForEach([
                    ("VO₂ Max (30%)", "The strongest longevity predictor. Elite is ≥50 mL/kg/min."),
                    ("HRV (22%)", "Autonomic nervous system health. Higher values indicate resilience and recovery."),
                    ("Resting HR (20%)", "Lower resting heart rate = greater cardiovascular efficiency."),
                    ("Walking Speed (13%)", "Speeds above 1.3 m/s correlate with significantly better health outcomes."),
                    ("Daily Steps (10%)", "Total daily movement reduces all-cause mortality risk."),
                    ("Sleep (5%)", "7–9 hours supports recovery, hormones, and metabolic health."),
                ], id: \.0) { (title, detail) in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title).font(.caption.weight(.semibold))
                        Text(detail).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            Text("For informational purposes only — not medical advice.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .opacity(0.5)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Data Yet")
                .font(.title3.bold())
            Text("Sync Apple Health data from your iPhone to compute your Vitality Score. Needs at least one metric: VO₂ Max, HRV, resting heart rate, walking speed, steps, or sleep.")
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

        let now = Date()
        let start30 = Calendar.current.date(byAdding: .day, value: -30, to: now) ?? Date()
        let start90 = Calendar.current.date(byAdding: .day, value: -90, to: now) ?? Date()

        // Fetch all metrics concurrently
        async let vo2Samples = try? healthKit.fetchSamples(for: .vo2Max, from: start90, to: now, limit: 10)
        async let rhrData = try? healthKit.fetchWeekData(for: .restingHeartRate, isDiscrete: true, days: 30)
        async let hrvData = try? healthKit.fetchWeekData(for: .heartRateVariabilitySDNN, isDiscrete: true, days: 30)
        async let walkData = try? healthKit.fetchSamples(for: .walkingSpeed, from: start30, to: now)
        async let stepData = try? healthKit.fetchWeekData(for: .stepCount, isDiscrete: false, days: 30)
        async let sleepHours = try? healthKit.fetchLastNightSleep()

        let (vo2, rhr, hrv, walk, steps, sleep) = await (vo2Samples, rhrData, hrvData, walkData, stepData, sleepHours)

        // Latest VO2 max
        let latestVO2 = vo2?.max(by: { $0.startDate < $1.startDate }).map { $0.quantity.doubleValue(for: HKUnit(from: "mL/kg/min")) }

        // 30-day averages
        func mean(_ arr: [(date: Date, value: Double)]?) -> Double? {
            guard let arr, !arr.isEmpty else { return nil }
            return arr.map(\.value).reduce(0, +) / Double(arr.count)
        }

        let avgRHR = mean(rhr)
        let avgHRV = mean(hrv)

        // Average walking speed
        let avgWalk: Double?
        if let walkSamples = walk, !walkSamples.isEmpty {
            let sum = walkSamples.reduce(0.0) { $0 + $1.quantity.doubleValue(for: .init(from: "m/s")) }
            avgWalk = sum / Double(walkSamples.count)
        } else {
            avgWalk = nil
        }

        // Average daily steps
        let avgSteps = mean(steps)

        // Sleep — use fetchLastNightSleep as proxy (returns hours)
        // Convert to minutes
        let avgSleepMin: Double? = sleep.map { $0 * 60 }

        metricData = LongevityMetrics(
            vo2Max: latestVO2,
            rhr: avgRHR,
            hrv: avgHRV,
            walkingSpeed: avgWalk,
            dailySteps: avgSteps,
            sleepMinutes: avgSleepMin
        )

        // Compute weekly scores for trend (last 12 weeks)
        await computeWeeklyTrend(start: start90)
    }

    private func computeWeeklyTrend(start: Date) async {
        // Use resting HR and HRV weekly data as proxies for the trend
        guard let rhrWeekly = try? await healthKit.fetchWeekData(for: .restingHeartRate, isDiscrete: true, days: 90),
              let hrvWeekly = try? await healthKit.fetchWeekData(for: .heartRateVariabilitySDNN, isDiscrete: true, days: 90),
              let stepWeekly = try? await healthKit.fetchWeekData(for: .stepCount, isDiscrete: false, days: 90)
        else { return }

        // Group by week
        let cal = Calendar.current
        func weekStart(_ d: Date) -> Date {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d)
            return cal.date(from: comps) ?? d
        }

        var rhrByWeek: [Date: [Double]] = [:]
        for item in rhrWeekly { rhrByWeek[weekStart(item.date), default: []].append(item.value) }
        var hrvByWeek: [Date: [Double]] = [:]
        for item in hrvWeekly { hrvByWeek[weekStart(item.date), default: []].append(item.value) }
        var stepByWeek: [Date: [Double]] = [:]
        for item in stepWeekly { stepByWeek[weekStart(item.date), default: []].append(item.value) }

        let allWeeks = Set(rhrByWeek.keys).union(hrvByWeek.keys).union(stepByWeek.keys)
        func meanArr(_ arr: [Double]?) -> Double? {
            guard let arr, !arr.isEmpty else { return nil }
            return arr.reduce(0, +) / Double(arr.count)
        }

        let scores: [(week: Date, score: Double)] = allWeeks.compactMap { week in
            let m = LongevityMetrics(
                vo2Max: metricData.vo2Max,
                rhr: meanArr(rhrByWeek[week]),
                hrv: meanArr(hrvByWeek[week]),
                walkingSpeed: metricData.walkingSpeed,
                dailySteps: meanArr(stepByWeek[week]),
                sleepMinutes: metricData.sleepMinutes
            )
            guard let score = m.vitalityScore else { return nil }
            return (week: week, score: score)
        }.sorted { $0.week < $1.week }

        weeklyScores = scores
    }
}

// MARK: - Data Models

struct LongevityMetrics {
    var vo2Max: Double?
    var rhr: Double?
    var hrv: Double?
    var walkingSpeed: Double?
    var dailySteps: Double?
    var sleepMinutes: Double?

    var hasAny: Bool {
        vo2Max != nil || rhr != nil || hrv != nil || walkingSpeed != nil || dailySteps != nil || sleepMinutes != nil
    }

    var availableCount: Int {
        [vo2Max, rhr, hrv, walkingSpeed, dailySteps, sleepMinutes].filter { $0 != nil }.count
    }

    var vitalityScore: Double? {
        let scored = metricScores.filter { $0.score != nil }
        guard !scored.isEmpty else { return nil }
        let totalWeight = scored.reduce(0.0) { $0 + $1.weight }
        let weighted = scored.reduce(0.0) { $0 + (($1.score ?? 0) * $1.weight) }
        return (weighted / totalWeight).rounded()
    }

    var metricScores: [MetricScore] {
        [
            MetricScore(key: "vo2", label: "VO₂ Max", value: vo2Max, unit: "mL/kg/min", weight: 0.30,
                        scoreFn: MetricScore.scoreVO2, formatFn: { String(format: "%.1f", $0) },
                        hexColor: "#f59e0b"),
            MetricScore(key: "hrv", label: "HRV", value: hrv, unit: "ms SDNN", weight: 0.22,
                        scoreFn: MetricScore.scoreHRV, formatFn: { String(format: "%.0f ms", $0) },
                        hexColor: "#8b5cf6"),
            MetricScore(key: "rhr", label: "Resting HR", value: rhr, unit: "bpm", weight: 0.20,
                        scoreFn: MetricScore.scoreRHR, formatFn: { String(format: "%.0f bpm", $0) },
                        hexColor: "#ef4444"),
            MetricScore(key: "walk", label: "Walking Speed", value: walkingSpeed, unit: "m/s", weight: 0.13,
                        scoreFn: MetricScore.scoreWalk, formatFn: { String(format: "%.2f m/s", $0) },
                        hexColor: "#06b6d4"),
            MetricScore(key: "steps", label: "Daily Steps", value: dailySteps, unit: "steps/day", weight: 0.10,
                        scoreFn: MetricScore.scoreSteps, formatFn: { String(format: "%.0f", $0) },
                        hexColor: "#4ade80"),
            MetricScore(key: "sleep", label: "Sleep", value: sleepMinutes, unit: "per night", weight: 0.05,
                        scoreFn: MetricScore.scoreSleep, formatFn: {
                            let h = Int($0) / 60; let m = Int($0) % 60; return "\(h)h \(m)m"
                        },
                        hexColor: "#60a5fa"),
        ]
    }
}

struct MetricScore: Identifiable {
    let id = UUID()
    let key: String
    let label: String
    let value: Double?
    let unit: String
    let weight: Double
    let scoreFn: (Double) -> Double
    let formatFn: (Double) -> String
    let hexColor: String

    var score: Double? { value.map { scoreFn($0) } }
    func format(_ v: Double) -> String { formatFn(v) }

    var swiftColor: Color {
        switch hexColor {
        case "#f59e0b": return .orange
        case "#8b5cf6": return .purple
        case "#ef4444": return .red
        case "#06b6d4": return .cyan
        case "#4ade80": return .green
        case "#60a5fa": return .blue
        default: return .gray
        }
    }

    // MARK: - Piecewise scoring

    private static func piecewise(_ v: Double, _ pts: [(Double, Double)]) -> Double {
        if v <= pts.first!.0 { return pts.first!.1 }
        if v >= pts.last!.0 { return pts.last!.1 }
        for i in 0..<(pts.count - 1) {
            let (v0, s0) = pts[i]
            let (v1, s1) = pts[i + 1]
            if v >= v0 && v <= v1 {
                return s0 + (s1 - s0) * (v - v0) / (v1 - v0)
            }
        }
        return 50
    }

    static func scoreVO2(_ v: Double) -> Double {
        piecewise(v, [(18, 5), (28, 25), (35, 50), (42, 70), (50, 88), (60, 100)])
    }
    static func scoreRHR(_ v: Double) -> Double {
        piecewise(v, [(44, 100), (55, 88), (63, 72), (70, 55), (78, 35), (90, 10)])
    }
    static func scoreHRV(_ v: Double) -> Double {
        piecewise(v, [(8, 5), (18, 25), (30, 50), (45, 72), (60, 88), (80, 100)])
    }
    static func scoreWalk(_ v: Double) -> Double {
        piecewise(v, [(0.5, 5), (0.8, 25), (1.0, 50), (1.2, 70), (1.4, 88), (1.6, 100)])
    }
    static func scoreSteps(_ v: Double) -> Double {
        piecewise(v, [(1500, 5), (3500, 25), (6000, 55), (9000, 78), (11000, 92), (14000, 100)])
    }
    static func scoreSleep(_ v: Double) -> Double {
        let hrs = v / 60
        if hrs >= 7 && hrs <= 9 { return 100 }
        if hrs >= 6.5 && hrs < 7 { return 75 + (hrs - 6.5) / 0.5 * 25 }
        if hrs > 9 && hrs <= 9.5 { return 75 + (9.5 - hrs) / 0.5 * 25 }
        if hrs >= 6 && hrs < 6.5 { return 50 + (hrs - 6) / 0.5 * 25 }
        if hrs > 9.5 && hrs <= 10.5 { return 50 + (10.5 - hrs) / 1.0 * 25 }
        if hrs >= 5 && hrs < 6 { return 20 + (hrs - 5) * 30 }
        if hrs > 10.5 && hrs <= 12 { return 20 + (12 - hrs) / 1.5 * 30 }
        return 10
    }
}

// MARK: - Vitality Zone

enum VitalityZone {
    case elite, excellent, good, average, belowAverage

    var label: String {
        switch self {
        case .elite: return "Elite Vitality"
        case .excellent: return "Excellent"
        case .good: return "Good"
        case .average: return "Average"
        case .belowAverage: return "Below Average"
        }
    }

    var description: String {
        switch self {
        case .elite: return "Top-tier health markers. Outstanding cardiovascular and metabolic fitness."
        case .excellent: return "Well above average across key longevity metrics. Keep it up."
        case .good: return "Solid health foundation with room to push further."
        case .average: return "Some metrics need attention. Focus on your weakest areas first."
        case .belowAverage: return "Significant opportunity to improve. Small consistent changes compound fast."
        }
    }

    var color: Color {
        switch self {
        case .elite: return .green
        case .excellent: return Color(red: 0.27, green: 0.86, blue: 0.5)
        case .good: return .yellow
        case .average: return .orange
        case .belowAverage: return .red
        }
    }

    static func from(score: Double) -> VitalityZone {
        if score >= 90 { return .elite }
        if score >= 75 { return .excellent }
        if score >= 60 { return .good }
        if score >= 45 { return .average }
        return .belowAverage
    }
}

#Preview {
    NavigationStack {
        LongevityView()
    }
}
