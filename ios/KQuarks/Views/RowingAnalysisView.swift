import SwiftUI
import Charts
import HealthKit

// MARK: - RowingAnalysisView

/// Analyses rowing workouts: 500m split trend, distance, heart rate, and weekly volume.
struct RowingAnalysisView: View {
    @State private var sessions: [RowingSession] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    struct RowingSession: Identifiable {
        let id: UUID
        let date: Date
        let durationSecs: TimeInterval
        let distanceMeters: Double?
        let calories: Double?
        let avgHR: Double?
        let maxHR: Double?

        var durationMins: Double { durationSecs / 60 }

        /// 500m split in seconds
        var split500m: Double? {
            guard let dist = distanceMeters, dist > 100 else { return nil }
            return (durationSecs / dist) * 500
        }

        var formattedSplit: String {
            guard let split = split500m else { return "—" }
            let mins = Int(split) / 60
            let secs = Int(split) % 60
            return String(format: "%d:%02d /500m", mins, secs)
        }

        var distanceKm: Double? {
            guard let d = distanceMeters else { return nil }
            return d / 1000
        }

        var formattedDuration: String {
            let h = Int(durationSecs) / 3600
            let m = (Int(durationSecs) % 3600) / 60
            return h > 0 ? "\(h)h \(m)m" : "\(m)m"
        }

        /// Performance tier based on 500m split
        var tierLabel: String {
            guard let split = split500m else { return "Unknown" }
            if split < 120 { return "Elite" }      // sub 2:00
            if split < 150 { return "Competitive" } // sub 2:30
            if split < 180 { return "Recreational" } // sub 3:00
            return "Beginner"
        }

        var tierColor: Color {
            guard let split = split500m else { return .secondary }
            if split < 120 { return .yellow }
            if split < 150 { return .green }
            if split < 180 { return .blue }
            return .teal
        }
    }

    // MARK: - Computed Properties

    private var totalDistanceKm: Double {
        sessions.compactMap(\.distanceKm).reduce(0, +)
    }

    private var avgSplit: Double? {
        let splits = sessions.compactMap(\.split500m)
        return splits.isEmpty ? nil : splits.reduce(0, +) / Double(splits.count)
    }

    private var bestSplit: RowingSession? {
        sessions.filter { $0.split500m != nil }.min(by: { $0.split500m! < $1.split500m! })
    }

    private var weeklyData: [(week: Date, count: Int, totalKm: Double)] {
        let cal = Calendar.current
        var byWeek: [Date: (count: Int, km: Double)] = [:]
        for s in sessions {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            if let monday = cal.date(from: comps) {
                let prev = byWeek[monday] ?? (0, 0)
                byWeek[monday] = (prev.count + 1, prev.km + (s.distanceKm ?? 0))
            }
        }
        return byWeek.sorted { $0.key < $1.key }.map {
            (week: $0.key, count: $0.value.count, totalKm: $0.value.km)
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if sessions.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    if weeklyData.count >= 2 { weeklyVolumeChart }
                    if sessions.filter({ $0.split500m != nil }).count >= 3 { splitTrendChart }
                    if sessions.filter({ $0.distanceKm != nil }).count >= 3 { distanceChart }
                    if sessions.filter({ $0.avgHR != nil }).count >= 3 { hrTrendChart }
                    recentSessionsList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Rowing")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Rowing Sessions")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(sessions.count)")
                        .font(.system(size: 52, weight: .bold, design: .rounded))
                        .foregroundStyle(.cyan)
                    Text("last 90 days")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    if let avg = avgSplit {
                        let mins = Int(avg) / 60
                        let secs = Int(avg) % 60
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%d:%02d", mins, secs))
                                .font(.title3.bold().monospacedDigit())
                                .foregroundStyle(.cyan)
                            Text("avg 500m split")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if totalDistanceKm > 0 {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.1f km", totalDistanceKm))
                                .font(.title3.bold().monospacedDigit())
                            Text("total distance")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            HStack(spacing: 0) {
                statBubble(
                    label: "Sessions",
                    value: "\(sessions.count)",
                    color: .cyan
                )
                Divider().frame(height: 40)
                statBubble(
                    label: "Best Split",
                    value: bestSplit?.formattedSplit.replacingOccurrences(of: " /500m", with: "") ?? "—",
                    color: .yellow
                )
                Divider().frame(height: 40)
                statBubble(
                    label: "Total Distance",
                    value: String(format: "%.1f km", totalDistanceKm),
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statBubble(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
                .multilineTextAlignment(.center)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    // MARK: - Weekly Volume Chart

    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Sessions")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeklyData, id: \.week) { d in
                    BarMark(
                        x: .value("Week", d.week),
                        y: .value("Sessions", d.count)
                    )
                    .foregroundStyle(Color.cyan.opacity(0.75))
                    .cornerRadius(4)
                }
                RuleMark(y: .value("Target", 2))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.blue.opacity(0.5))
                    .annotation(position: .topLeading) {
                        Text("2×/week")
                            .font(.caption2)
                            .foregroundStyle(.blue.opacity(0.7))
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYScale(domain: 0...max(5, (weeklyData.map(\.count).max() ?? 3) + 1))
            .frame(height: 130)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - 500m Split Trend

    private var splitTrendChart: some View {
        let splitSessions = sessions.filter { $0.split500m != nil }
        let splits = splitSessions.compactMap(\.split500m)
        let minSplit = max(60, (splits.min() ?? 120) - 15)
        let maxSplit = (splits.max() ?? 200) + 15

        return VStack(alignment: .leading, spacing: 8) {
            Text("500m Split Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Text("Lower is faster")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            Chart {
                if let avg = avgSplit {
                    RuleMark(y: .value("Avg", avg))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                        .foregroundStyle(.cyan.opacity(0.5))
                        .annotation(position: .topLeading) {
                            let m = Int(avg) / 60
                            let s = Int(avg) % 60
                            Text(String(format: "avg %d:%02d", m, s))
                                .font(.caption2)
                                .foregroundStyle(.cyan.opacity(0.8))
                        }
                }

                ForEach(Array(splitSessions.enumerated()), id: \.offset) { _, s in
                    LineMark(
                        x: .value("Date", s.date),
                        y: .value("Split (s)", s.split500m!)
                    )
                    .foregroundStyle(.cyan.opacity(0.5))
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("Split (s)", s.split500m!)
                    )
                    .foregroundStyle(s.tierColor)
                    .symbolSize(35)
                }
            }
            .chartYScale(domain: minSplit...maxSplit)
            .chartYAxis {
                AxisMarks { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            let m = Int(v) / 60
                            let s = Int(v) % 60
                            Text(String(format: "%d:%02d", m, s))
                                .font(.caption2)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Distance Chart

    private var distanceChart: some View {
        let distSessions = sessions.filter { $0.distanceKm != nil }
        let distVals = distSessions.compactMap(\.distanceKm)
        let avgDist = distVals.isEmpty ? 0 : distVals.reduce(0, +) / Double(distVals.count)

        return VStack(alignment: .leading, spacing: 8) {
            Text("Distance per Session")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(Array(distSessions.enumerated()), id: \.offset) { _, s in
                    BarMark(
                        x: .value("Date", s.date),
                        y: .value("km", s.distanceKm!)
                    )
                    .foregroundStyle(Color.blue.opacity(0.75))
                    .cornerRadius(4)
                }
                RuleMark(y: .value("Avg", avgDist))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                    .foregroundStyle(.blue.opacity(0.6))
                    .annotation(position: .topLeading) {
                        Text(String(format: "avg %.1f km", avgDist))
                            .font(.caption2)
                            .foregroundStyle(.blue.opacity(0.8))
                    }
            }
            .chartYAxisLabel("km")
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 130)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - HR Trend Chart

    private var hrTrendChart: some View {
        let hrSessions = sessions.filter { $0.avgHR != nil }
        let hrs = hrSessions.compactMap(\.avgHR)
        let avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)

        return VStack(alignment: .leading, spacing: 8) {
            Text("Average Heart Rate")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(Array(hrSessions.enumerated()), id: \.offset) { _, s in
                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("bpm", s.avgHR!)
                    )
                    .foregroundStyle(.red.opacity(0.7))
                    .symbolSize(30)
                }
                ForEach(Array(hrSessions.enumerated()), id: \.offset) { _, s in
                    LineMark(
                        x: .value("Date", s.date),
                        y: .value("bpm", s.avgHR!)
                    )
                    .foregroundStyle(.red.opacity(0.35))
                    .interpolationMethod(.catmullRom)
                }
                RuleMark(y: .value("Avg", avgHR))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.red.opacity(0.4))
                    .annotation(position: .topLeading) {
                        Text(String(format: "avg %.0f bpm", avgHR))
                            .font(.caption2)
                            .foregroundStyle(.red.opacity(0.7))
                    }
            }
            .chartYScale(domain: max(80, (hrs.min() ?? 120) - 10)...(hrs.max() ?? 180) + 10)
            .chartYAxisLabel("bpm")
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 140)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Recent Sessions List

    private var recentSessionsList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                let recent = sessions.suffix(15).reversed()
                ForEach(Array(recent.enumerated()), id: \.element.id) { idx, s in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(s.tierLabel)
                                    .font(.caption.bold())
                                    .foregroundStyle(s.tierColor)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(s.tierColor.opacity(0.12))
                                    .clipShape(Capsule())
                                if let dist = s.distanceKm {
                                    Text(String(format: "%.2f km", dist))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            Text(s.date.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text(s.formattedDuration)
                                .font(.subheadline.bold().monospacedDigit())
                            Text(s.formattedSplit)
                                .font(.caption2)
                                .foregroundStyle(.cyan)
                                .monospacedDigit()
                            if let cal = s.calories {
                                Text("\(Int(cal)) kcal")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal)

                    if idx < recent.count - 1 {
                        Divider().padding(.leading)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.rowing")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Rowing Workouts")
                .font(.title3.bold())
            Text("Rowing workouts logged in Apple Health or on a connected ergometer will appear here.")
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

        let start = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let all = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []
        let rowingWorkouts = all.filter { $0.workoutActivityType == .rowing }

        sessions = rowingWorkouts
            .compactMap { w -> RowingSession? in
                guard w.duration >= 120 else { return nil } // ≥ 2 min

                let dist = w.statistics(for: HKQuantityType(.distanceWalkingRunning))
                    .flatMap { $0.sumQuantity() }
                    .map { $0.doubleValue(for: .meter()) }
                let cal = w.statistics(for: HKQuantityType(.activeEnergyBurned))
                    .flatMap { $0.sumQuantity() }
                    .map { $0.doubleValue(for: .kilocalorie()) }
                let avgHR = w.statistics(for: HKQuantityType(.heartRate))
                    .flatMap { $0.averageQuantity() }
                    .map { $0.doubleValue(for: HKUnit(from: "count/min")) }
                let maxHR = w.statistics(for: HKQuantityType(.heartRate))
                    .flatMap { $0.maximumQuantity() }
                    .map { $0.doubleValue(for: HKUnit(from: "count/min")) }

                return RowingSession(
                    id: w.uuid,
                    date: w.startDate,
                    durationSecs: w.duration,
                    distanceMeters: dist,
                    calories: cal,
                    avgHR: avgHR,
                    maxHR: maxHR
                )
            }
            .sorted { $0.date < $1.date }
    }
}

#Preview {
    NavigationStack {
        RowingAnalysisView()
    }
}
