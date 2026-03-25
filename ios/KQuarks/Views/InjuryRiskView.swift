import SwiftUI
import Charts
import HealthKit

// MARK: - Models

struct DayLoad: Identifiable {
    let id: Date
    let date: Date
    let minutes: Double
}

// MARK: - RiskLevel

enum RiskLevel {
    case low, elevated, high

    var color: Color {
        switch self {
        case .low: return .green
        case .elevated: return .orange
        case .high: return .red
        }
    }

    var label: String {
        switch self {
        case .low: return "Low Risk"
        case .elevated: return "Elevated Risk"
        case .high: return "High Risk"
        }
    }

    var icon: String {
        switch self {
        case .low: return "checkmark.shield.fill"
        case .elevated: return "exclamationmark.triangle.fill"
        case .high: return "xmark.octagon.fill"
        }
    }

    var recommendations: [String] {
        switch self {
        case .low:
            return [
                "Excellent training balance",
                "Continue your current plan",
                "Focus on recovery quality"
            ]
        case .elevated:
            return [
                "Consider adding a rest day this week",
                "Prioritize 8h sleep tonight",
                "Lower intensity if HRV remains suppressed",
                "Avoid back-to-back hard sessions"
            ]
        case .high:
            return [
                "Take a complete rest day today",
                "Check HRV again tomorrow before training",
                "Reduce weekly volume by 20-30%",
                "Prioritize sleep and nutrition recovery"
            ]
        }
    }
}

// MARK: - InjuryRiskView

struct InjuryRiskView: View {
    @State private var riskScore: Int = 0
    @State private var riskLevel: RiskLevel = .low
    @State private var acwr: Double = 0
    @State private var acuteLoad: Double = 0
    @State private var chronicLoad: Double = 0
    @State private var consecutiveDays: Int = 0
    @State private var hrvDropPts: Int = 0
    @State private var hrElevPts: Int = 0
    @State private var monotonyPts: Int = 0
    @State private var acwrPts: Int = 0
    @State private var consecutivePts: Int = 0
    @State private var dailyMinutes: [DayLoad] = []
    @State private var chronicBaseline: Double = 0
    @State private var hasHRVData: Bool = false
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView()
                        .padding(.top, 60)
                } else {
                    riskGaugeCard
                    factorsCard
                    acwrChartCard
                    if hasHRVData {
                        hrvTrendCard
                    }
                    recommendationsCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Injury Risk")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Risk Gauge Card

    private var riskGaugeCard: some View {
        let subtitleText = gaugeSubtitle()
        return VStack(spacing: 16) {
            ZStack {
                Circle()
                    .trim(from: 0, to: 0.75)
                    .stroke(Color.gray.opacity(0.15), style: StrokeStyle(lineWidth: 18, lineCap: .round))
                    .rotationEffect(.degrees(135))

                Circle()
                    .trim(from: 0, to: min(Double(riskScore) / 100.0 * 0.75, 0.75))
                    .stroke(riskLevel.color, style: StrokeStyle(lineWidth: 18, lineCap: .round))
                    .rotationEffect(.degrees(135))
                    .animation(.easeOut(duration: 0.8), value: riskScore)

                VStack(spacing: 4) {
                    Text("\(riskScore)")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(riskLevel.color)
                    Text(riskLevel.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(riskLevel.color)
                }
            }
            .frame(width: 180, height: 180)

            Text(subtitleText)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(riskLevel.color.opacity(0.08))
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func gaugeSubtitle() -> String {
        var parts: [String] = []
        if acwr > 0 {
            parts.append(String(format: "ACWR %.2f", acwr))
        }
        if consecutiveDays > 0 {
            parts.append("\(consecutiveDays) consecutive day\(consecutiveDays == 1 ? "" : "s")")
        }
        return parts.isEmpty ? "No recent training data" : parts.joined(separator: " · ")
    }

    // MARK: - Factors Card

    private var factorsCard: some View {
        let factors = buildFactors()
        return VStack(alignment: .leading, spacing: 12) {
            Text("Risk Factors")
                .font(.headline)

            if factors.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("No issues detected")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(factors.enumerated()), id: \.offset) { (idx, factor) in
                        HStack(spacing: 12) {
                            Image(systemName: factor.icon)
                                .font(.body)
                                .foregroundStyle(factor.color)
                                .frame(width: 24)
                            Text(factor.name)
                                .font(.subheadline)
                            Spacer()
                            Text("+\(factor.points) pts")
                                .font(.caption.bold().monospacedDigit())
                                .foregroundStyle(factor.color)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(factor.color.opacity(0.12))
                                .clipShape(Capsule())
                        }
                        .padding(.vertical, 10)
                        if idx < factors.count - 1 {
                            Divider()
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private struct RiskFactor {
        let icon: String
        let name: String
        let points: Int
        let color: Color
    }

    private func buildFactors() -> [RiskFactor] {
        var factors: [RiskFactor] = []
        if acwrPts > 0 {
            let name = acwr < 0.8 ? "Undertraining Detected" : "Training Spike"
            factors.append(RiskFactor(icon: "arrow.up.forward.circle.fill", name: name, points: acwrPts, color: .orange))
        }
        if consecutivePts > 0 {
            factors.append(RiskFactor(icon: "calendar.badge.exclamationmark", name: "No Rest Day (\(consecutiveDays) days)", points: consecutivePts, color: .orange))
        }
        if hrvDropPts > 0 {
            factors.append(RiskFactor(icon: "waveform.path.ecg", name: "Low HRV", points: hrvDropPts, color: .red))
        }
        if hrElevPts > 0 {
            factors.append(RiskFactor(icon: "heart.fill", name: "Elevated Resting HR", points: hrElevPts, color: .red))
        }
        if monotonyPts > 0 {
            factors.append(RiskFactor(icon: "repeat.circle.fill", name: "Lack of Variety", points: monotonyPts, color: .yellow))
        }
        return factors
    }

    // MARK: - ACWR Chart Card

    private var acwrChartCard: some View {
        let subtitleStr = acwrChartSubtitle()
        return VStack(alignment: .leading, spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text("28-Day Workload")
                    .font(.headline)
                Text(subtitleStr)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 4)

            Chart {
                ForEach(dailyMinutes) { day in
                    BarMark(
                        x: .value("Date", day.date, unit: .day),
                        y: .value("Minutes", day.minutes)
                    )
                    .foregroundStyle(Color.blue.opacity(0.7))
                    .cornerRadius(2)
                }

                if chronicLoad > 0 {
                    RuleMark(y: .value("Chronic", chronicLoad))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary)
                        .annotation(position: .topTrailing) {
                            Text("Chronic")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) {
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    private func acwrChartSubtitle() -> String {
        String(format: "Acute: %.0f min/day · Chronic: %.0f min/day · ACWR: %.2f", acuteLoad, chronicLoad, acwr)
    }

    // MARK: - HRV Trend Card

    private var hrvTrendCard: some View {
        HStack(spacing: 12) {
            Image(systemName: "waveform.path.ecg")
                .font(.title2)
                .foregroundStyle(hrvDropPts > 0 ? .red : .green)
            VStack(alignment: .leading, spacing: 3) {
                Text("HRV Status")
                    .font(.subheadline.weight(.semibold))
                Text(hrvDropPts > 0 ? "HRV suppressed vs 28-day baseline" : "HRV within normal range")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Circle()
                .fill(hrvDropPts > 0 ? Color.red : Color.green)
                .frame(width: 10, height: 10)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Recommendations Card

    private var recommendationsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "brain.head.profile")
                    .foregroundStyle(.purple)
                Text("Recommendations")
                    .font(.headline)
            }
            VStack(alignment: .leading, spacing: 8) {
                ForEach(riskLevel.recommendations, id: \.self) { rec in
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "circle.fill")
                            .font(.system(size: 6))
                            .foregroundStyle(riskLevel.color)
                            .padding(.top, 5)
                        Text(rec)
                            .font(.subheadline)
                            .foregroundStyle(.primary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Data Loading

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        // Request authorization
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKQuantityType(.heartRateVariabilitySDNN),
            HKQuantityType(.restingHeartRate)
        ]
        try? await healthStore.requestAuthorization(toShare: [], read: typesToRead)

        let cal = Calendar.current
        let now = Date()
        let twentyEightDaysAgo = cal.date(byAdding: .day, value: -28, to: now) ?? Date()

        // Fetch workouts
        let workouts = (try? await fetchWorkouts(from: twentyEightDaysAgo, to: now)) ?? []

        // Build day-by-day map of total minutes
        var dayMinutesMap: [Date: Double] = [:]
        for workout in workouts {
            let dayStart = cal.startOfDay(for: workout.startDate)
            let mins = workout.duration / 60.0
            dayMinutesMap[dayStart, default: 0] += mins
        }

        // Generate DayLoad array for all 28 days
        var loads: [DayLoad] = []
        for offset in 0..<28 {
            let dayStart = cal.startOfDay(for: cal.date(byAdding: .day, value: -(27 - offset), to: now) ?? Date())
            let mins = dayMinutesMap[dayStart] ?? 0
            loads.append(DayLoad(id: dayStart, date: dayStart, minutes: mins))
        }
        dailyMinutes = loads

        // Compute loads
        // last 7 days = indices 21..<28 (days 0-6 from today, most recent)
        let last7 = loads.suffix(7)
        let prev21 = loads.prefix(21)

        acuteLoad = last7.map(\.minutes).reduce(0, +) / 7.0
        chronicLoad = prev21.map(\.minutes).reduce(0, +) / 21.0
        chronicBaseline = chronicLoad

        acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0

        // ACWR points
        if acwr > 1.5 {
            acwrPts = 40
        } else if acwr >= 1.3 {
            acwrPts = 25
        } else if acwr >= 0.8 {
            acwrPts = 0
        } else {
            // Undertraining — only penalise if there's some load at all
            acwrPts = acuteLoad > 0 ? 10 : 0
        }

        // Consecutive training days
        var streak = 0
        for offset in 0..<28 {
            let dayStart = cal.startOfDay(for: cal.date(byAdding: .day, value: -offset, to: now) ?? Date())
            if (dayMinutesMap[dayStart] ?? 0) > 0 {
                streak += 1
            } else {
                break
            }
        }
        consecutiveDays = streak
        if streak >= 4 {
            consecutivePts = 20
        } else if streak == 3 {
            consecutivePts = 10
        } else {
            consecutivePts = 0
        }

        // HRV
        let hrvSamples = (try? await fetchQuantitySamples(.heartRateVariabilitySDNN, from: twentyEightDaysAgo, to: now)) ?? []
        if !hrvSamples.isEmpty {
            let ms = HKUnit.secondUnit(with: .milli)
            let allHRV = hrvSamples.map { $0.quantity.doubleValue(for: ms) }
            let baseline28 = allHRV.reduce(0, +) / Double(allHRV.count)
            let last3HRV = Array(allHRV.suffix(3))
            let last3Avg = last3HRV.isEmpty ? baseline28 : last3HRV.reduce(0, +) / Double(last3HRV.count)
            if last3Avg < baseline28 * 0.85 {
                hrvDropPts = 20
            } else if last3Avg < baseline28 * 0.90 {
                hrvDropPts = 10
            } else {
                hrvDropPts = 0
            }
            hasHRVData = true
        } else {
            hrvDropPts = 0
            hasHRVData = false
        }

        // Resting HR
        let rhrSamples = (try? await fetchQuantitySamples(.restingHeartRate, from: twentyEightDaysAgo, to: now)) ?? []
        if !rhrSamples.isEmpty {
            let bpm = HKUnit.count().unitDivided(by: .minute())
            let allRHR = rhrSamples.map { $0.quantity.doubleValue(for: bpm) }
            let baseline28 = allRHR.reduce(0, +) / Double(allRHR.count)
            let last3 = Array(allRHR.suffix(3))
            let last3Avg = last3.isEmpty ? baseline28 : last3.reduce(0, +) / Double(last3.count)
            if last3Avg > baseline28 * 1.10 {
                hrElevPts = 15
            } else if last3Avg > baseline28 * 1.05 {
                hrElevPts = 8
            } else {
                hrElevPts = 0
            }
        } else {
            hrElevPts = 0
        }

        // Monotony: last 7 workouts same sport type?
        let last7Workouts = Array(workouts.sorted { $0.startDate < $1.startDate }.suffix(7))
        if last7Workouts.count >= 2 {
            let types = Set(last7Workouts.map { $0.workoutActivityType.rawValue })
            monotonyPts = types.count == 1 ? 5 : 0
        } else {
            monotonyPts = 0
        }

        // Compute total
        let total = acwrPts + consecutivePts + hrvDropPts + hrElevPts + monotonyPts
        riskScore = min(max(total, 0), 100)

        if riskScore <= 30 {
            riskLevel = .low
        } else if riskScore <= 60 {
            riskLevel = .elevated
        } else {
            riskLevel = .high
        }
    }

    // MARK: - HealthKit Helpers

    private func fetchWorkouts(from startDate: Date, to endDate: Date) async throws -> [HKWorkout] {
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: .workoutType(),
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            healthStore.execute(query)
        }
    }

    private func fetchQuantitySamples(_ identifier: HKQuantityTypeIdentifier, from startDate: Date, to endDate: Date) async throws -> [HKQuantitySample] {
        let quantityType = HKQuantityType(identifier)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: quantityType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            healthStore.execute(query)
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        InjuryRiskView()
    }
}
