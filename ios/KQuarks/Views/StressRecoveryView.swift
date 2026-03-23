import SwiftUI
import Charts
import HealthKit

// MARK: - StressRecoveryView

/// 2D scatter showing training stress (weekly load %) vs recovery quality (HRV vs baseline).
/// Maps each week to one of four quadrants:
///   Peaking  = high stress + high recovery → ideal training response
///   Danger   = high stress + low recovery  → overtraining risk
///   Resting  = low stress  + high recovery → taper / deload
///   Balanced = low stress  + low recovery  → off-season / recovery block
struct StressRecoveryView: View {

    // MARK: - Models

    struct WeekPoint: Identifiable {
        let id: Date
        let monday: Date
        let stressScore: Double    // 0–100, based on load vs 12-week avg
        let recoveryScore: Double  // 0–100, based on HRV vs 28-day baseline
        var quadrant: Quadrant {
            let isHighStress = stressScore >= 50
            let isHighRecovery = recoveryScore >= 50
            if isHighStress && isHighRecovery { return .peaking }
            if isHighStress && !isHighRecovery { return .overreaching }
            if !isHighStress && isHighRecovery { return .recovering }
            return .balanced
        }
    }

    enum Quadrant: String {
        case peaking      = "Peaking"
        case overreaching = "Overreaching"
        case recovering   = "Recovering"
        case balanced     = "Balanced"

        var color: Color {
            switch self {
            case .peaking:      return .green
            case .overreaching: return .red
            case .recovering:   return .teal
            case .balanced:     return .gray
            }
        }

        var icon: String {
            switch self {
            case .peaking:      return "bolt.circle.fill"
            case .overreaching: return "exclamationmark.triangle.fill"
            case .recovering:   return "arrow.clockwise.circle.fill"
            case .balanced:     return "equal.circle.fill"
            }
        }

        var description: String {
            switch self {
            case .peaking:
                return "Optimal zone: you're absorbing training well. Your body is recovering faster than the stress. This is where fitness gains happen."
            case .overreaching:
                return "High stress without enough recovery. If sustained, leads to overtraining. Prioritize sleep, reduce intensity, and add rest days."
            case .recovering:
                return "Low training load with high recovery capacity. Perfect for taper weeks before a race, or deload blocks."
            case .balanced:
                return "Moderate stress and recovery — sustainable long-term training. Gradually increase stimulus to enter the Peaking quadrant."
            }
        }

        var advice: String {
            switch self {
            case .peaking:      return "Stay the course. Maintain load and protect recovery habits."
            case .overreaching: return "Reduce volume 20–30%. Add a rest day. Prioritize 8h+ sleep."
            case .recovering:   return "Begin ramping up training. Your body is ready for more stimulus."
            case .balanced:     return "Add 1 extra workout or extend long session to shift toward Peaking."
            }
        }
    }

    // MARK: - State

    @State private var weekPoints: [WeekPoint] = []
    @State private var currentQuadrant: Quadrant = .balanced
    @State private var currentStress: Double = 0
    @State private var currentRecovery: Double = 0
    @State private var isLoading = true
    @State private var noHRVData = false

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if weekPoints.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    currentStatusCard
                    scatterPlotCard
                    weeklyTimelineCard
                    quadrantGuideCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Stress & Recovery")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Current Status Card

    private var currentStatusCard: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: currentQuadrant.icon)
                    .font(.title)
                    .foregroundStyle(currentQuadrant.color)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Current Status")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(currentQuadrant.rawValue)
                        .font(.title2.bold())
                        .foregroundStyle(currentQuadrant.color)
                }
                Spacer()
            }

            Divider()

            HStack(spacing: 20) {
                scorePill(label: "Training Stress", value: currentStress, color: stressColor(currentStress))
                Divider().frame(height: 40)
                scorePill(label: "Recovery Score", value: currentRecovery, color: recoveryColor(currentRecovery))
            }

            Text(currentQuadrant.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            Text(currentQuadrant.advice)
                .font(.caption.bold())
                .foregroundStyle(currentQuadrant.color)
                .frame(maxWidth: .infinity, alignment: .leading)

            if noHRVData {
                Label("Recovery score uses resting HR only (no HRV data)", systemImage: "info.circle")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(currentQuadrant.color.opacity(0.25), lineWidth: 1.5))
    }

    private func scorePill(label: String, value: Double, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(String(format: "%.0f", value))
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Scatter Plot

    private var scatterPlotCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Stress vs Recovery — 12 Weeks")
                .font(.headline)

            // Custom scatter with quadrant background
            GeometryReader { geo in
                let w = geo.size.width
                let h = geo.size.height

                ZStack {
                    // Quadrant backgrounds
                    Group {
                        Rectangle().fill(Color.green.opacity(0.06))    // top-right: Peaking
                            .frame(width: w / 2, height: h / 2)
                            .offset(x: w / 4, y: -h / 4)
                        Rectangle().fill(Color.red.opacity(0.06))      // top-left: Overreaching (high stress = right)
                            .frame(width: w / 2, height: h / 2)
                            .offset(x: w / 4, y: h / 4)
                        Rectangle().fill(Color.teal.opacity(0.06))     // bottom-left: Recovering
                            .frame(width: w / 2, height: h / 2)
                            .offset(x: -w / 4, y: -h / 4)
                        Rectangle().fill(Color.gray.opacity(0.06))     // bottom-right: Balanced
                            .frame(width: w / 2, height: h / 2)
                            .offset(x: -w / 4, y: h / 4)
                    }
                    .offset(x: w / 2, y: h / 2)

                    // Axis lines
                    Path { p in
                        p.move(to: CGPoint(x: w / 2, y: 0))
                        p.addLine(to: CGPoint(x: w / 2, y: h))
                    }
                    .stroke(Color.secondary.opacity(0.3), lineWidth: 1)

                    Path { p in
                        p.move(to: CGPoint(x: 0, y: h / 2))
                        p.addLine(to: CGPoint(x: w, y: h / 2))
                    }
                    .stroke(Color.secondary.opacity(0.3), lineWidth: 1)

                    // Quadrant labels
                    Text("Recovering").font(.system(size: 9)).foregroundStyle(.teal.opacity(0.6))
                        .position(x: w * 0.2, y: h * 0.15)
                    Text("Peaking").font(.system(size: 9)).foregroundStyle(.green.opacity(0.6))
                        .position(x: w * 0.8, y: h * 0.15)
                    Text("Balanced").font(.system(size: 9)).foregroundStyle(.secondary.opacity(0.5))
                        .position(x: w * 0.2, y: h * 0.85)
                    Text("Overreaching").font(.system(size: 9)).foregroundStyle(.red.opacity(0.6))
                        .position(x: w * 0.8, y: h * 0.85)

                    // Axis labels
                    Text("←  Low Stress  ·  High Stress  →")
                        .font(.system(size: 8)).foregroundStyle(.secondary)
                        .position(x: w / 2, y: h - 6)
                    Text("↑ High\nRecovery")
                        .font(.system(size: 8)).foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .position(x: 20, y: h * 0.25)
                    Text("Low\nRecovery ↓")
                        .font(.system(size: 8)).foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .position(x: 20, y: h * 0.75)

                    // Data points
                    ForEach(weekPoints) { pt in
                        let x = (pt.stressScore / 100.0) * (w - 32) + 16
                        let y = h - (pt.recoveryScore / 100.0) * (h - 32) - 16
                        Circle()
                            .fill(pt.quadrant.color.opacity(0.7))
                            .frame(width: pt.id == weekPoints.last?.id ? 14 : 9,
                                   height: pt.id == weekPoints.last?.id ? 14 : 9)
                            .overlay(
                                Circle().stroke(Color.white, lineWidth: pt.id == weekPoints.last?.id ? 2 : 0)
                            )
                            .position(x: x, y: y)
                    }
                }
            }
            .frame(height: 240)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.secondary.opacity(0.15), lineWidth: 1))

            Text("Each dot = one week. Larger dot = current week. x-axis: training stress, y-axis: recovery capacity.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Weekly Timeline

    private var weeklyTimelineCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("12-Week Timeline")
                .font(.headline)

            let df = DateFormatter()
            let _ = { df.dateFormat = "MMM d" }()

            Chart {
                ForEach(weekPoints) { w in
                    BarMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("Stress", w.stressScore),
                        width: .ratio(0.4)
                    )
                    .foregroundStyle(stressColor(w.stressScore).opacity(0.7))
                    .offset(x: -6)

                    BarMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("Recovery", w.recoveryScore),
                        width: .ratio(0.4)
                    )
                    .foregroundStyle(recoveryColor(w.recoveryScore).opacity(0.7))
                    .offset(x: 6)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYScale(domain: 0...100)
            .chartYAxisLabel("Score (0–100)")
            .frame(height: 140)

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    Rectangle().fill(Color.orange.opacity(0.7)).frame(width: 12, height: 8).cornerRadius(2)
                    Text("Training Stress").font(.caption2).foregroundStyle(.secondary)
                }
                HStack(spacing: 4) {
                    Rectangle().fill(Color.teal.opacity(0.7)).frame(width: 12, height: 8).cornerRadius(2)
                    Text("Recovery").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Quadrant Guide

    private var quadrantGuideCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Quadrant Guide", systemImage: "chart.scatter")
                .font(.headline)
                .foregroundStyle(.indigo)

            ForEach([Quadrant.peaking, .recovering, .overreaching, .balanced], id: \.rawValue) { q in
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: q.icon)
                        .foregroundStyle(q.color)
                        .frame(width: 20)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(q.rawValue).font(.caption.bold()).foregroundStyle(q.color)
                        Text(q.description).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.indigo.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.scatter")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("This view requires at least 4 weeks of workout history and heart rate data. Keep training and check back.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func stressColor(_ score: Double) -> Color {
        if score < 30 { return .blue }
        if score < 60 { return .orange }
        return .red
    }

    private func recoveryColor(_ score: Double) -> Color {
        if score >= 65 { return .green }
        if score >= 40 { return .teal }
        return .orange
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let typesToRead: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKQuantityType(.heartRateVariabilitySDNN),
            HKQuantityType(.restingHeartRate)
        ]
        guard (try? await healthStore.requestAuthorization(toShare: [], read: typesToRead)) != nil else { return }

        let cal = Calendar.current
        let twelveWeeksAgo = cal.date(byAdding: .weekOfYear, value: -12, to: Date()) ?? Date()

        // Fetch workouts
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: HKObjectType.workoutType(),
                predicate: HKQuery.predicateForSamples(withStart: twelveWeeksAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        // Weekly workout minutes
        var weeklyMins: [Date: Double] = [:]
        for w in workouts where w.duration > 180 {
            let monday = mondayOf(date: w.startDate, cal: cal)
            weeklyMins[monday, default: 0] += w.duration / 60.0
        }

        guard !weeklyMins.isEmpty else { return }

        // All 12-week bucket list
        var allWeeks: [Date] = []
        for i in 0..<12 {
            allWeeks.append(mondayOf(date: cal.date(byAdding: .weekOfYear, value: -(11 - i), to: Date()) ?? Date(), cal: cal))
        }
        let allLoads = allWeeks.map { weeklyMins[$0] ?? 0 }
        let maxLoad = allLoads.max() ?? 1

        // Fetch HRV samples (last 28 days for baseline + 12-week for tracking)
        let extendedStart = cal.date(byAdding: .day, value: -28, to: twelveWeeksAgo) ?? Date()
        let hrvSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: HKQuantityType(.heartRateVariabilitySDNN),
                predicate: HKQuery.predicateForSamples(withStart: extendedStart, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        // Fetch resting HR
        let rhrSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: HKQuantityType(.restingHeartRate),
                predicate: HKQuery.predicateForSamples(withStart: extendedStart, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        noHRVData = hrvSamples.isEmpty

        // Compute 28-day HRV baseline (from the first 28-day window)
        let hrvUnit = HKUnit.secondUnit(with: .milli)
        let allHRVVals = hrvSamples.map { $0.quantity.doubleValue(for: hrvUnit) }
        let hrvBaseline = allHRVVals.isEmpty ? 0 : allHRVVals.reduce(0, +) / Double(allHRVVals.count)

        // Compute 28-day RHR baseline
        let rhrUnit = HKUnit.count().unitDivided(by: .minute())
        let allRHRVals = rhrSamples.map { $0.quantity.doubleValue(for: rhrUnit) }
        let rhrBaseline = allRHRVals.isEmpty ? 0 : allRHRVals.reduce(0, +) / Double(allRHRVals.count)

        // Build weekly points
        var points: [WeekPoint] = []
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"

        for (idx, monday) in allWeeks.enumerated() {
            let load = allLoads[idx]
            let weekEnd = cal.date(byAdding: .day, value: 7, to: monday) ?? Date()

            // Stress score: % of max weekly load, normalized 0-100
            let stressScore = maxLoad > 0 ? min(load / maxLoad * 100, 100) : 0

            // Recovery score: from HRV + RHR for this week
            let weekHRV = hrvSamples
                .filter { $0.startDate >= monday && $0.startDate < weekEnd }
                .map { $0.quantity.doubleValue(for: hrvUnit) }
            let weekRHR = rhrSamples
                .filter { $0.startDate >= monday && $0.startDate < weekEnd }
                .map { $0.quantity.doubleValue(for: rhrUnit) }

            let recoveryScore = computeRecoveryScore(
                weekHRV: weekHRV, hrvBaseline: hrvBaseline,
                weekRHR: weekRHR, rhrBaseline: rhrBaseline
            )

            points.append(WeekPoint(
                id: monday, monday: monday,
                stressScore: stressScore,
                recoveryScore: recoveryScore
            ))
        }

        weekPoints = points
        currentStress = points.last?.stressScore ?? 0
        currentRecovery = points.last?.recoveryScore ?? 0
        currentQuadrant = points.last?.quadrant ?? .balanced
    }

    private func computeRecoveryScore(
        weekHRV: [Double], hrvBaseline: Double,
        weekRHR: [Double], rhrBaseline: Double
    ) -> Double {
        var score = 50.0  // neutral baseline

        // HRV component (weight: 60%)
        if !weekHRV.isEmpty && hrvBaseline > 0 {
            let weekAvgHRV = weekHRV.reduce(0, +) / Double(weekHRV.count)
            let ratio = weekAvgHRV / hrvBaseline
            // Ratio 1.15+ = excellent (+30), 1.0 = neutral, 0.85- = poor (-30)
            let hrvScore = (ratio - 0.85) / 0.30 * 30  // maps [0.85, 1.15] → [0, 30]
            score += min(max(hrvScore, -30), 30) * 0.6
        }

        // RHR component (weight: 40%)
        if !weekRHR.isEmpty && rhrBaseline > 0 {
            let weekAvgRHR = weekRHR.reduce(0, +) / Double(weekRHR.count)
            let ratio = weekAvgRHR / rhrBaseline
            // Lower RHR = better recovery; ratio 0.90- = great, 1.10+ = poor
            let rhrScore = (1.10 - ratio) / 0.20 * 20  // maps [0.90, 1.10] → [20, -20]
            score += min(max(rhrScore, -20), 20) * 0.4
        }

        return min(max(score, 0), 100)
    }

    private func mondayOf(date: Date, cal: Calendar) -> Date {
        var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        comps.weekday = 2
        return cal.date(from: comps) ?? date
    }
}

#Preview {
    NavigationStack {
        StressRecoveryView()
    }
}
