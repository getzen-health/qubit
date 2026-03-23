import SwiftUI
import Charts
import HealthKit

// MARK: - ReadinessView

/// Computes a daily readiness score (0–100) by combining HRV, resting heart rate, and sleep,
/// each compared to their 30-day personal baselines. Inspired by recovery-focused wearables.
struct ReadinessView: View {
    @State private var score: ReadinessScore?
    @State private var history: [HistoryPoint] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct ReadinessScore {
        let overall: Int
        let hrv: ComponentScore
        let rhr: ComponentScore
        let sleep: ComponentScore
        let recommendation: Recommendation

        struct ComponentScore {
            let label: String
            let value: Int       // 0-100
            let detail: String   // e.g. "68 ms (baseline: 55 ms)"
            let weight: Double   // fractional weight in overall score
        }

        enum Recommendation {
            case peak, ready, moderate, recovery

            var label: String {
                switch self {
                case .peak: return "Peak Day"
                case .ready: return "Ready to Train"
                case .moderate: return "Moderate Effort"
                case .recovery: return "Recovery Day"
                }
            }

            var icon: String {
                switch self {
                case .peak: return "bolt.circle.fill"
                case .ready: return "checkmark.circle.fill"
                case .moderate: return "minus.circle.fill"
                case .recovery: return "tortoise.fill"
                }
            }

            var color: Color {
                switch self {
                case .peak: return .green
                case .ready: return .blue
                case .moderate: return .yellow
                case .recovery: return .red
                }
            }

            var advice: String {
                switch self {
                case .peak:
                    return "Your body is primed — great day for a hard workout, PR attempt, or race."
                case .ready:
                    return "You're well recovered. Push moderately; add intensity where your plan allows."
                case .moderate:
                    return "Slight signs of fatigue. Aim for a steady aerobic session; skip max-effort intervals."
                case .recovery:
                    return "Your body is asking for rest. Prioritize sleep, light movement, and good nutrition."
                }
            }
        }
    }

    struct HistoryPoint: Identifiable {
        let id = UUID()
        let date: Date
        let score: Int
    }

    // Readiness zone
    private func zone(score: Int) -> (label: String, color: Color) {
        if score >= 80 { return ("Optimal", .green) }
        if score >= 60 { return ("Good", .blue) }
        if score >= 40 { return ("Moderate", .yellow) }
        return ("Low", .red)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 80)
                } else if let s = score {
                    heroCard(s)
                    factorsCard(s)
                    recommendationCard(s)
                    if history.count >= 5 { historyChart }
                    methodologyCard
                } else {
                    emptyState
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Daily Readiness")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private func heroCard(_ s: ReadinessScore) -> some View {
        let z = zone(score: s.overall)
        return VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's Readiness")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(s.overall)")
                        .font(.system(size: 64, weight: .heavy, design: .rounded))
                        .foregroundStyle(z.color)
                    Text(z.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(z.color)
                }
                Spacer()

                // Circular gauge
                ZStack {
                    Circle()
                        .stroke(Color(.systemFill), lineWidth: 12)
                        .frame(width: 90, height: 90)
                    Circle()
                        .trim(from: 0, to: CGFloat(s.overall) / 100)
                        .stroke(z.color, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .frame(width: 90, height: 90)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.8), value: s.overall)
                    Image(systemName: s.recommendation.icon)
                        .font(.title2)
                        .foregroundStyle(z.color)
                }
            }

            // Mini factor bars
            HStack(spacing: 8) {
                factorPill(label: "HRV", value: s.hrv.value, color: .purple)
                factorPill(label: "RHR", value: s.rhr.value, color: .red)
                factorPill(label: "Sleep", value: s.sleep.value, color: .indigo)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func factorPill(label: String, value: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3).fill(Color(.systemFill)).frame(height: 6)
                RoundedRectangle(cornerRadius: 3).fill(color)
                    .frame(width: max(4, CGFloat(value) / 100 * 80), height: 6)
            }
            .frame(width: 80)
            HStack(spacing: 4) {
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text("\(value)")
                    .font(.caption2.bold())
                    .foregroundStyle(color)
            }
        }
    }

    // MARK: - Factors Card

    private func factorsCard(_ s: ReadinessScore) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Score Breakdown")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach([s.hrv, s.rhr, s.sleep], id: \.label) { comp in
                    HStack(spacing: 12) {
                        // Score ring
                        ZStack {
                            Circle()
                                .stroke(Color(.systemFill), lineWidth: 4)
                                .frame(width: 36, height: 36)
                            Circle()
                                .trim(from: 0, to: CGFloat(comp.value) / 100)
                                .stroke(scoreColor(comp.value), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                                .frame(width: 36, height: 36)
                                .rotationEffect(.degrees(-90))
                            Text("\(comp.value)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(scoreColor(comp.value))
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(comp.label)
                                .font(.subheadline.weight(.medium))
                            Text(comp.detail)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        Text(String(format: "%.0f%%", comp.weight * 100) + " weight")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if comp.label != s.sleep.label {
                        Divider().padding(.leading, 64)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    private func scoreColor(_ v: Int) -> Color {
        v >= 80 ? .green : v >= 60 ? .blue : v >= 40 ? .yellow : .red
    }

    // MARK: - Recommendation Card

    private func recommendationCard(_ s: ReadinessScore) -> some View {
        HStack(spacing: 14) {
            Image(systemName: s.recommendation.icon)
                .font(.system(size: 32))
                .foregroundStyle(s.recommendation.color)

            VStack(alignment: .leading, spacing: 6) {
                Text(s.recommendation.label)
                    .font(.headline)
                    .foregroundStyle(s.recommendation.color)
                Text(s.recommendation.advice)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(s.recommendation.color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(s.recommendation.color.opacity(0.25), lineWidth: 1))
    }

    // MARK: - History Chart

    private var historyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("7-Day Readiness History")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Optimal", 80))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.green.opacity(0.4))
                RuleMark(y: .value("Good", 60))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.blue.opacity(0.4))

                ForEach(history) { point in
                    AreaMark(
                        x: .value("Date", point.date),
                        y: .value("Score", point.score)
                    )
                    .foregroundStyle(.linearGradient(
                        colors: [scoreColor(point.score).opacity(0.3), .clear],
                        startPoint: .top, endPoint: .bottom
                    ))
                    .interpolationMethod(.catmullRom)

                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Score", point.score)
                    )
                    .foregroundStyle(scoreColor(point.score))
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", point.date),
                        y: .value("Score", point.score)
                    )
                    .foregroundStyle(scoreColor(point.score))
                    .symbolSize(40)
                }
            }
            .chartYScale(domain: 0...100)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { _ in
                    AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Methodology Card

    private var methodologyCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.blue)
                Text("How Readiness Is Calculated")
                    .font(.subheadline.weight(.semibold))
            }
            VStack(alignment: .leading, spacing: 4) {
                Text("• HRV (40%): Today's HRV vs your 30-day baseline. Higher-than-normal HRV signals good recovery.")
                Text("• Resting HR (30%): Lower-than-baseline RHR means your heart is recovering well.")
                Text("• Sleep (30%): Duration scored against an 8-hour target. More sleep = higher component score.")
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "gauge.with.dots.needle.67percent")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Readiness Data")
                .font(.title3.bold())
            Text("Readiness requires Apple Watch data for HRV and resting heart rate, plus sleep tracking. Make sure you're wearing your Watch at night.")
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

        let today = Date()
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: today)!

        // Fetch 30 days of HRV, RHR, and sleep
        let hrv30 = (try? await healthKit.fetchSamples(for: .heartRateVariabilitySDNN, from: thirtyDaysAgo, to: today)) ?? []
        let rhr30 = (try? await healthKit.fetchSamples(for: .restingHeartRate, from: thirtyDaysAgo, to: today)) ?? []
        let sleep30 = (try? await healthKit.fetchSleepAnalysis(from: thirtyDaysAgo, to: today)) ?? []

        let cal = Calendar.current
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let msUnit = HKUnit.secondUnit(with: .milli)

        // --- HRV ---
        let todayStart = cal.startOfDay(for: today)
        func dailyAvg(samples: [HKQuantitySample], unit: HKUnit) -> [(date: Date, value: Double)] {
            var byDay: [DateComponents: [Double]] = [:]
            for s in samples {
                let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
                byDay[key, default: []].append(s.quantity.doubleValue(for: unit))
            }
            return byDay.compactMap { comps, vals in
                cal.date(from: comps).map { (date: $0, value: vals.reduce(0,+)/Double(vals.count)) }
            }.sorted { $0.date < $1.date }
        }

        let hrvDays = dailyAvg(samples: hrv30, unit: msUnit)
        let rhrDays = dailyAvg(samples: rhr30, unit: hrUnit)

        let baseline30HRV = hrvDays.dropLast().map(\.value).reduce(0,+) / max(1, Double(max(1, hrvDays.count - 1)))
        let baseline30RHR = rhrDays.dropLast().map(\.value).reduce(0,+) / max(1, Double(max(1, rhrDays.count - 1)))

        let todayHRV = hrvDays.filter { cal.isDate($0.date, inSameDayAs: today) }.last?.value
            ?? hrvDays.last?.value
        let todayRHR = rhrDays.filter { cal.isDate($0.date, inSameDayAs: today) }.last?.value
            ?? rhrDays.last?.value

        // HRV score: 100 if at/above baseline, decays below
        let hrvScore: Int
        if baseline30HRV > 0, let hv = todayHRV {
            let ratio = hv / baseline30HRV
            hrvScore = Int(min(100, max(0, ratio * 70 + 30)))
        } else { hrvScore = 50 }

        // RHR score: 100 if at/below baseline, decays above
        let rhrScore: Int
        if baseline30RHR > 0, let rr = todayRHR {
            let ratio = baseline30RHR / rr // high ratio = RHR lower than baseline = good
            rhrScore = Int(min(100, max(0, ratio * 70 + 30)))
        } else { rhrScore = 50 }

        // Sleep score: hours vs 8h goal
        let sleepGoalMins = 480.0
        let lastNightStart = Calendar.current.date(byAdding: .hour, value: -18, to: today)!
        let lastNightSamples = sleep30.filter { $0.endDate >= lastNightStart && $0.endDate <= today }
        let sleepSamples = lastNightSamples.filter {
            switch HKCategoryValueSleepAnalysis(rawValue: $0.value) {
            case .asleepDeep, .asleepREM, .asleepCore, .asleepUnspecified: return true
            default: return false
            }
        }
        let sleepMins = sleepSamples.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 }
        let sleepScore = Int(min(100, max(0, sleepMins / sleepGoalMins * 100)))

        // Overall score (weighted average)
        let overall = Int(Double(hrvScore) * 0.40 + Double(rhrScore) * 0.30 + Double(sleepScore) * 0.30)

        let recommendation: ReadinessScore.Recommendation
        switch overall {
        case 80...: recommendation = .peak
        case 60..<80: recommendation = .ready
        case 40..<60: recommendation = .moderate
        default: recommendation = .recovery
        }

        score = ReadinessScore(
            overall: overall,
            hrv: .init(
                label: "Heart Rate Variability",
                value: hrvScore,
                detail: todayHRV.map { String(format: "%.0f ms (baseline: %.0f ms)", $0, baseline30HRV) } ?? "No data",
                weight: 0.40
            ),
            rhr: .init(
                label: "Resting Heart Rate",
                value: rhrScore,
                detail: todayRHR.map { String(format: "%.0f bpm (baseline: %.0f bpm)", $0, baseline30RHR) } ?? "No data",
                weight: 0.30
            ),
            sleep: .init(
                label: "Sleep Duration",
                value: sleepScore,
                detail: String(format: "%.1f h (goal: %.0f h)", sleepMins / 60, sleepGoalMins / 60),
                weight: 0.30
            ),
            recommendation: recommendation
        )

        // Compute 7-day history
        var pts: [HistoryPoint] = []
        for dayOffset in -6...0 {
            guard let day = cal.date(byAdding: .day, value: dayOffset, to: todayStart) else { continue }
            let dayEnd = cal.date(byAdding: .day, value: 1, to: day)!

            let dHRV = hrvDays.filter { $0.date >= day && $0.date < dayEnd }.last?.value
            let dRHR = rhrDays.filter { $0.date >= day && $0.date < dayEnd }.last?.value

            let nightStart = cal.date(byAdding: .hour, value: -18, to: day)!
            let dSleepSamples = sleep30.filter {
                $0.endDate >= nightStart && $0.endDate <= dayEnd
            }.filter {
                switch HKCategoryValueSleepAnalysis(rawValue: $0.value) {
                case .asleepDeep, .asleepREM, .asleepCore, .asleepUnspecified: return true
                default: return false
                }
            }
            let dSleepMins = dSleepSamples.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 }

            let dHRVScore: Int = {
                guard baseline30HRV > 0, let h = dHRV else { return 50 }
                return Int(min(100, max(0, (h / baseline30HRV) * 70 + 30)))
            }()
            let dRHRScore: Int = {
                guard baseline30RHR > 0, let r = dRHR else { return 50 }
                return Int(min(100, max(0, (baseline30RHR / r) * 70 + 30)))
            }()
            let dSleepScore = Int(min(100, max(0, dSleepMins / sleepGoalMins * 100)))
            let dOverall = Int(Double(dHRVScore) * 0.40 + Double(dRHRScore) * 0.30 + Double(dSleepScore) * 0.30)
            pts.append(HistoryPoint(date: day, score: dOverall))
        }
        history = pts
    }
}

#Preview {
    NavigationStack {
        ReadinessView()
    }
}
