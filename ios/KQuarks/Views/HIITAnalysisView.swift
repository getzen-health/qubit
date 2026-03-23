import SwiftUI
import Charts
import HealthKit

// MARK: - HIITAnalysisView

/// Analyses High Intensity Interval Training workouts: session history, average max HR,
/// calorie burn rate, and weekly volume trends.
struct HIITAnalysisView: View {
    @State private var sessions: [HIITSession] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct HIITSession: Identifiable {
        let id: UUID
        let date: Date
        let durationSecs: TimeInterval
        let calories: Double?
        let avgHR: Double?
        let maxHR: Double?

        var durationMins: Double { durationSecs / 60 }
        var calPerMin: Double? {
            guard let cal = calories, durationMins > 0 else { return nil }
            return cal / durationMins
        }

        var formattedDuration: String {
            let h = Int(durationSecs) / 3600
            let m = (Int(durationSecs) % 3600) / 60
            return h > 0 ? "\(h)h \(m)m" : "\(m)m"
        }

        var intensityLabel: String {
            guard let hr = maxHR else { return "Unknown" }
            if hr >= 180 { return "Max Effort" }
            if hr >= 160 { return "High" }
            if hr >= 140 { return "Moderate" }
            return "Light"
        }

        var intensityColor: Color {
            guard let hr = maxHR else { return .secondary }
            if hr >= 180 { return .red }
            if hr >= 160 { return .orange }
            if hr >= 140 { return .yellow }
            return .green
        }
    }

    private var recentSessions: [HIITSession] { sessions.suffix(20).map { $0 } }
    private var avgCalPerMin: Double? {
        let vals = sessions.compactMap(\.calPerMin)
        return vals.isEmpty ? nil : vals.reduce(0, +) / Double(vals.count)
    }
    private var avgMaxHR: Double? {
        let vals = sessions.compactMap(\.maxHR)
        return vals.isEmpty ? nil : vals.reduce(0, +) / Double(vals.count)
    }
    private var totalCalories: Double { sessions.compactMap(\.calories).reduce(0, +) }

    private var weeklyData: [(week: Date, count: Int, totalMins: Double)] {
        let cal = Calendar.current
        var byWeek: [Date: (count: Int, mins: Double)] = [:]
        for s in sessions {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            if let monday = cal.date(from: comps) {
                let prev = byWeek[monday] ?? (0, 0)
                byWeek[monday] = (prev.count + 1, prev.mins + s.durationMins)
            }
        }
        return byWeek.sorted { $0.key < $1.key }.map { (week: $0.key, count: $0.value.count, totalMins: $0.value.mins) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if sessions.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    if weeklyData.count >= 3 { weeklyVolumeChart }
                    if sessions.count >= 4 { maxHRTrendChart }
                    if sessions.count >= 4 { calBurnChart }
                    recentSessionsList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("HIIT")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("HIIT Sessions")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(sessions.count)")
                        .font(.system(size: 52, weight: .bold, design: .rounded))
                        .foregroundStyle(.red)
                    Text("last 90 days")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    if let cpm = avgCalPerMin {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f cal/min", cpm))
                                .font(.title3.bold())
                                .foregroundStyle(.orange)
                            Text("avg burn rate")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if let mhr = avgMaxHR {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f bpm", mhr))
                                .font(.title3.bold())
                                .foregroundStyle(.red)
                            Text("avg peak HR")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            HStack(spacing: 0) {
                statBubble(label: "Sessions", value: "\(sessions.count)", color: .red)
                Divider().frame(height: 40)
                statBubble(label: "Total Calories", value: "\(Int(totalCalories)) kcal", color: .orange)
                Divider().frame(height: 40)
                statBubble(
                    label: "Avg Duration",
                    value: formatMins(sessions.map(\.durationMins).reduce(0, +) / Double(max(1, sessions.count))),
                    color: .purple
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
            Text("Sessions per Week")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeklyData, id: \.week) { d in
                    BarMark(
                        x: .value("Week", d.week),
                        y: .value("Sessions", d.count)
                    )
                    .foregroundStyle(Color.red.opacity(0.75))
                    .cornerRadius(4)
                }
                RuleMark(y: .value("Target", 2))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.5))
                    .annotation(position: .topLeading) {
                        Text("2×/week")
                            .font(.caption2)
                            .foregroundStyle(.orange.opacity(0.7))
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYScale(domain: 0...max(5, (weeklyData.map(\.count).max() ?? 3) + 1))
            .frame(height: 140)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Max HR Trend Chart

    private var maxHRTrendChart: some View {
        let hrSessions = sessions.filter { $0.maxHR != nil }
        guard hrSessions.count >= 3 else { return AnyView(EmptyView()) }
        let hrs = hrSessions.compactMap(\.maxHR)

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Peak Heart Rate Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Max effort", 180))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.red.opacity(0.4))
                    .annotation(position: .topLeading) {
                        Text("Max effort ≥180")
                            .font(.caption2)
                            .foregroundStyle(.red.opacity(0.6))
                    }

                ForEach(Array(hrSessions.enumerated()), id: \.offset) { _, s in
                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("bpm", s.maxHR!)
                    )
                    .foregroundStyle(s.intensityColor)
                    .symbolSize(35)
                }

                ForEach(Array(hrSessions.enumerated()), id: \.offset) { _, s in
                    LineMark(
                        x: .value("Date", s.date),
                        y: .value("bpm", s.maxHR!)
                    )
                    .foregroundStyle(.red.opacity(0.4))
                    .interpolationMethod(.catmullRom)
                }
            }
            .chartYScale(domain: max(100, (hrs.min() ?? 130) - 10)...(hrs.max() ?? 190) + 10)
            .chartYAxisLabel("bpm")
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 150)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Calorie Burn Chart

    private var calBurnChart: some View {
        let cpmSessions = sessions.filter { $0.calPerMin != nil }
        guard cpmSessions.count >= 3 else { return AnyView(EmptyView()) }

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Calorie Burn Rate")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(Array(cpmSessions.enumerated()), id: \.offset) { _, s in
                    BarMark(
                        x: .value("Date", s.date),
                        y: .value("cal/min", s.calPerMin!)
                    )
                    .foregroundStyle(Color.orange.opacity(0.75))
                    .cornerRadius(4)
                }
                if let avg = avgCalPerMin {
                    RuleMark(y: .value("Avg", avg))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                        .foregroundStyle(.orange.opacity(0.7))
                        .annotation(position: .topLeading) {
                            Text("avg \(Int(avg)) cal/min")
                                .font(.caption2)
                                .foregroundStyle(.orange.opacity(0.8))
                        }
                }
            }
            .chartYAxisLabel("cal/min")
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 140)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Recent Sessions List

    private var recentSessionsList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(recentSessions.reversed()) { s in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(s.intensityLabel)
                                    .font(.caption.bold())
                                    .foregroundStyle(s.intensityColor)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(s.intensityColor.opacity(0.12))
                                    .clipShape(Capsule())
                            }
                            Text(s.date.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text(s.formattedDuration)
                                .font(.subheadline.bold().monospacedDigit())
                            if let mhr = s.maxHR {
                                Text("↑\(Int(mhr)) bpm")
                                    .font(.caption2)
                                    .foregroundStyle(.red)
                            }
                            if let cal = s.calories {
                                Text("\(Int(cal)) kcal")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal)

                    if s.id != recentSessions.reversed().last?.id {
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
            Image(systemName: "bolt.heart.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No HIIT Workouts")
                .font(.title3.bold())
            Text("HIIT workouts logged as 'High Intensity Interval Training' in Apple Health or compatible apps will appear here.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func formatMins(_ mins: Double) -> String {
        let m = Int(mins)
        return m >= 60 ? "\(m / 60)h \(m % 60)m" : "\(m)m"
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let start = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let all = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []
        let hiitWorkouts = all.filter { $0.workoutActivityType == .highIntensityIntervalTraining }

        sessions = hiitWorkouts
            .compactMap { w -> HIITSession? in
                guard w.duration >= 300 else { return nil } // ≥ 5 min

                let cal = w.statistics(for: HKQuantityType(.activeEnergyBurned))
                    .flatMap { $0.sumQuantity() }
                    .map { $0.doubleValue(for: .kilocalorie()) }
                let avgHR = w.statistics(for: HKQuantityType(.heartRate))
                    .flatMap { $0.averageQuantity() }
                    .map { $0.doubleValue(for: HKUnit(from: "count/min")) }
                let maxHR = w.statistics(for: HKQuantityType(.heartRate))
                    .flatMap { $0.maximumQuantity() }
                    .map { $0.doubleValue(for: HKUnit(from: "count/min")) }

                return HIITSession(
                    id: w.uuid,
                    date: w.startDate,
                    durationSecs: w.duration,
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
        HIITAnalysisView()
    }
}
