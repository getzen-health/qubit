import SwiftUI
import Charts
import HealthKit

// MARK: - StrengthAnalysisView

/// Aggregates strength training workouts (traditional + functional) to show frequency,
/// volume trends, average heart rate per session, and personal bests.
struct StrengthAnalysisView: View {
    @State private var sessions: [StrengthSession] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct StrengthSession: Identifiable {
        let id: UUID
        let date: Date
        let durationSecs: TimeInterval
        let calories: Double?
        let avgHR: Double?
        let type: HKWorkoutActivityType

        var durationMins: Double { durationSecs / 60 }

        var formattedDuration: String {
            let h = Int(durationSecs) / 3600
            let m = (Int(durationSecs) % 3600) / 60
            return h > 0 ? "\(h)h \(m)m" : "\(m)m"
        }

        var typeName: String {
            switch type {
            case .traditionalStrengthTraining: return "Weight Training"
            case .functionalStrengthTraining: return "Functional Strength"
            case .crossTraining: return "Cross Training"
            default: return type.name
            }
        }

        var typeColor: Color {
            switch type {
            case .traditionalStrengthTraining: return .red
            case .functionalStrengthTraining: return .orange
            default: return .purple
            }
        }
    }

    private var recentSessions: [StrengthSession] { sessions.suffix(20).map { $0 } }

    private var longestSession: StrengthSession? {
        sessions.max(by: { $0.durationSecs < $1.durationSecs })
    }

    private var mostSessionsWeek: Int {
        guard !sessions.isEmpty else { return 0 }
        let cal = Calendar.current
        var byWeek: [Int: Int] = [:]
        for s in sessions {
            let week = cal.component(.weekOfYear, from: s.date)
            byWeek[week, default: 0] += 1
        }
        return byWeek.values.max() ?? 0
    }

    private var avgSessionMins: Double {
        guard !sessions.isEmpty else { return 0 }
        return sessions.map(\.durationMins).reduce(0, +) / Double(sessions.count)
    }

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
                    if weeklyData.count >= 3 { weeklyFrequencyChart }
                    if weeklyData.count >= 3 { weeklyVolumeChart }
                    if sessions.count >= 5 { hrTrendChart }
                    personalBestsCard
                    recentSessionsList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Strength Training")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Strength Sessions")
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
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f min", avgSessionMins))
                            .font(.title3.bold())
                        Text("avg session")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.1f/wk", Double(sessions.count) / 13.0))
                            .font(.title3.bold())
                            .foregroundStyle(.orange)
                        Text("avg frequency")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            HStack(spacing: 0) {
                statBubble(label: "Total Sessions", value: "\(sessions.count)", color: .red)
                Divider().frame(height: 40)
                statBubble(
                    label: "Total Volume",
                    value: formatHours(sessions.map(\.durationSecs).reduce(0, +)),
                    color: .orange
                )
                Divider().frame(height: 40)
                statBubble(label: "Best Week", value: "\(mostSessionsWeek) sessions", color: .purple)
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
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    // MARK: - Weekly Frequency Chart

    private var weeklyFrequencyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sessions per Week")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Target", 3))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                    .foregroundStyle(.red.opacity(0.5))
                    .annotation(position: .topLeading) {
                        Text("3×/week goal")
                            .font(.caption2)
                            .foregroundStyle(.red.opacity(0.7))
                    }

                ForEach(weeklyData, id: \.week) { d in
                    BarMark(
                        x: .value("Week", d.week),
                        y: .value("Sessions", d.count)
                    )
                    .foregroundStyle(d.count >= 3 ? Color.red : Color.red.opacity(0.5))
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxis {
                AxisMarks(values: .stride(by: 1)) { _ in
                    AxisValueLabel()
                    AxisGridLine()
                }
            }
            .chartYScale(domain: 0...max(7, (weeklyData.map(\.count).max() ?? 5) + 1))
            .frame(height: 150)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Weekly Volume Chart

    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Volume (minutes)")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeklyData, id: \.week) { d in
                    BarMark(
                        x: .value("Week", d.week),
                        y: .value("Minutes", d.totalMins)
                    )
                    .foregroundStyle(Color.orange.opacity(0.75))
                    .cornerRadius(4)
                }
                if weeklyData.count >= 4 {
                    let avg = weeklyData.map(\.totalMins).reduce(0, +) / Double(weeklyData.count)
                    RuleMark(y: .value("Avg", avg))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                        .foregroundStyle(.orange.opacity(0.6))
                        .annotation(position: .topLeading) {
                            Text("avg \(Int(avg))m")
                                .font(.caption2)
                                .foregroundStyle(.orange.opacity(0.8))
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("min")
            .frame(height: 150)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - HR Trend Chart

    private var hrTrendChart: some View {
        let hrSessions = sessions.filter { $0.avgHR != nil }
        guard hrSessions.count >= 3 else { return AnyView(EmptyView()) }

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Avg Heart Rate per Session")
                .font(.headline)
                .padding(.horizontal, 4)

            let hrs = hrSessions.map { $0.avgHR! }
            let minHR = (hrs.min() ?? 100) - 5
            let maxHR = (hrs.max() ?? 160) + 5

            Chart {
                ForEach(Array(hrSessions.enumerated()), id: \.offset) { _, s in
                    LineMark(
                        x: .value("Date", s.date),
                        y: .value("HR", s.avgHR!)
                    )
                    .foregroundStyle(.pink)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("HR", s.avgHR!)
                    )
                    .foregroundStyle(.pink)
                    .symbolSize(25)
                }
            }
            .chartYScale(domain: minHR...maxHR)
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

    // MARK: - Personal Bests Card

    private var personalBestsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "trophy.fill")
                    .foregroundStyle(.yellow)
                Text("Personal Bests")
                    .font(.subheadline.weight(.semibold))
            }

            if let longest = longestSession {
                PRRow(icon: "clock.fill", label: "Longest Session",
                      value: longest.formattedDuration,
                      sub: longest.date.formatted(date: .abbreviated, time: .omitted),
                      color: .red)
            }

            PRRow(icon: "flame.fill", label: "Best Week",
                  value: "\(mostSessionsWeek) sessions", sub: "most in any single week", color: .orange)

            PRRow(icon: "figure.strengthtraining.traditional", label: "90-Day Total",
                  value: formatHours(sessions.map(\.durationSecs).reduce(0, +)),
                  sub: "\(sessions.count) sessions", color: .purple)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
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
                            Text(s.typeName)
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(s.typeColor)
                            Text(s.date.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text(s.formattedDuration)
                                .font(.subheadline.bold().monospacedDigit())
                            if let hr = s.avgHR {
                                Text("\(Int(hr)) bpm")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
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
            Image(systemName: "figure.strengthtraining.traditional")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Strength Workouts")
                .font(.title3.bold())
            Text("Strength training workouts logged via Apple Health, Fitness, or compatible apps will appear here.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func formatHours(_ seconds: TimeInterval) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        let start = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let all = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []

        let strengthTypes: Set<HKWorkoutActivityType> = [
            .traditionalStrengthTraining,
            .functionalStrengthTraining,
            .crossTraining,
        ]

        sessions = all
            .filter { strengthTypes.contains($0.workoutActivityType) }
            .map { w in
                let avgHR: Double? = w.statistics(for: HKQuantityType(.heartRate))
                    .flatMap { stats in
                        stats.averageQuantity().map { $0.doubleValue(for: HKUnit(from: "count/min")) }
                    }
                let cal = w.statistics(for: HKQuantityType(.activeEnergyBurned))
                    .flatMap { $0.sumQuantity() }
                    .map { $0.doubleValue(for: .kilocalorie()) }

                return StrengthSession(
                    id: w.uuid,
                    date: w.startDate,
                    durationSecs: w.duration,
                    calories: cal,
                    avgHR: avgHR,
                    type: w.workoutActivityType
                )
            }
            .sorted { $0.date < $1.date }
    }
}

#Preview {
    NavigationStack {
        StrengthAnalysisView()
    }
}
