import SwiftUI
import Charts
import HealthKit

// MARK: - SwimmingAnalysisView

/// Aggregates swimming workouts to show pace trends, pool/open-water volume, and personal bests.
struct SwimmingAnalysisView: View {
    @State private var swims: [SwimEntry] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct SwimEntry: Identifiable {
        let id: UUID
        let date: Date
        let distanceM: Double       // meters
        let durationSecs: TimeInterval
        let calories: Double?
        let isPoolSwim: Bool

        /// Seconds per 100 meters
        var pace100m: Double { distanceM > 0 ? durationSecs / distanceM * 100 : 0 }

        var formattedPace: String {
            let s = Int(pace100m)
            return "\(s / 60):\(String(format: "%02d", s % 60)) /100m"
        }

        var formattedDistance: String {
            distanceM >= 1000
                ? String(format: "%.2f km", distanceM / 1000)
                : String(format: "%.0f m", distanceM)
        }

        var formattedDuration: String {
            let h = Int(durationSecs) / 3600
            let m = (Int(durationSecs) % 3600) / 60
            return h > 0 ? "\(h)h \(m)m" : "\(m)m"
        }
    }

    private var recentSwims: [SwimEntry] { swims.suffix(30).map { $0 } }

    private var fastestPace: SwimEntry? {
        swims.filter { $0.distanceM >= 200 }.min(by: { $0.pace100m < $1.pace100m })
    }

    private var longestSwim: SwimEntry? {
        swims.max(by: { $0.distanceM < $1.distanceM })
    }

    private var weeklyMeters: [(weekStart: Date, meters: Double)] {
        guard !swims.isEmpty else { return [] }
        let cal = Calendar.current
        var weekMap: [Date: Double] = [:]
        for swim in swims {
            let weekStart = cal.dateInterval(of: .weekOfYear, for: swim.date)?.start ?? swim.date
            weekMap[weekStart, default: 0] += swim.distanceM
        }
        return weekMap.sorted { $0.key < $1.key }.map { (weekStart: $0.key, meters: $0.value) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if swims.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    if recentSwims.count >= 3 { paceTrendChart }
                    if weeklyMeters.count >= 2 { weeklyVolumeChart }
                    personalBestsCard
                    recentSwimsList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Swimming")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let totalM = swims.reduce(0) { $0 + $1.distanceM }
        let avgPace = swims.isEmpty ? 0 : swims.map(\.pace100m).reduce(0, +) / Double(swims.count)

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total Swims")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(swims.count)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(.blue)
                    Text("last 90 days")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 12) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(totalM >= 1000
                             ? String(format: "%.1f km", totalM / 1000)
                             : String(format: "%.0f m", totalM))
                            .font(.title2.bold())
                        Text("total distance")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if avgPace > 0 {
                        VStack(alignment: .trailing, spacing: 2) {
                            let s = Int(avgPace)
                            Text("\(s / 60):\(String(format: "%02d", s % 60)) /100m")
                                .font(.title3.bold().monospacedDigit())
                            Text("avg pace")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Pace Trend Chart

    private var paceTrendChart: some View {
        let data = recentSwims
        let paceData = data.map { (date: $0.date, pace: $0.pace100m) }
        let minP = paceData.map(\.pace).min() ?? 80
        let maxP = paceData.map(\.pace).max() ?? 180

        return VStack(alignment: .leading, spacing: 8) {
            Text("Pace Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(Array(paceData.enumerated()), id: \.offset) { _, point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Pace", point.pace)
                    )
                    .foregroundStyle(.blue)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", point.date),
                        y: .value("Pace", point.pace)
                    )
                    .foregroundStyle(.blue)
                    .symbolSize(30)
                }
            }
            // Inverted: lower pace = faster
            .chartYScale(domain: (maxP + 10)...(max(0, minP - 10)))
            .chartYAxis {
                AxisMarks { v in
                    AxisValueLabel {
                        if let secs = v.as(Double.self) {
                            let m = Int(secs) / 60
                            let s = Int(secs) % 60
                            Text("\(m):\(String(format: "%02d", s))")
                                .font(.caption2)
                        }
                    }
                    AxisGridLine()
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("/100m")
            .frame(height: 180)
            .overlay(alignment: .bottomLeading) {
                Text("Lower = faster")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(8)
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Weekly Volume Chart

    private var weeklyVolumeChart: some View {
        let maxM = weeklyMeters.map(\.meters).max() ?? 2000

        return VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Distance")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeklyMeters, id: \.weekStart) { week in
                    BarMark(
                        x: .value("Week", week.weekStart, unit: .weekOfYear),
                        y: .value("m", week.meters)
                    )
                    .foregroundStyle(.blue.opacity(0.7))
                    .cornerRadius(4)
                }
            }
            .chartYAxisLabel("m")
            .chartYScale(domain: 0...(maxM * 1.2))
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 140)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Personal Bests Card

    private var personalBestsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Personal Bests")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                if let fastest = fastestPace {
                    PRRow(
                        icon: "bolt.fill",
                        label: "Fastest pace",
                        value: fastest.formattedPace,
                        sub: fastest.date.formatted(date: .abbreviated, time: .omitted),
                        color: .yellow
                    )
                    Divider().padding(.leading, 48)
                }
                if let longest = longestSwim {
                    PRRow(
                        icon: "map.fill",
                        label: "Longest swim",
                        value: longest.formattedDistance,
                        sub: longest.date.formatted(date: .abbreviated, time: .omitted),
                        color: .blue
                    )
                    if let best1k = swims.filter({ $0.distanceM >= 950 }).min(by: { $0.pace100m < $1.pace100m }) {
                        Divider().padding(.leading, 48)
                        PRRow(
                            icon: "1.circle.fill",
                            label: "Best 1K pace",
                            value: best1k.formattedPace,
                            sub: String(format: "%.0f m swim", best1k.distanceM),
                            color: .purple
                        )
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Recent Swims List

    private var recentSwimsList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Swims")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(swims.reversed().prefix(10)) { swim in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(swim.date.formatted(date: .abbreviated, time: .omitted))
                                .font(.subheadline.weight(.medium))
                            Text("\(swim.formattedDistance) · \(swim.formattedDuration)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(swim.formattedPace)
                                .font(.subheadline.bold().monospacedDigit())
                                .foregroundStyle(.blue)
                            if let cal = swim.calories {
                                Text("\(Int(cal)) cal")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if swim.id != swims.reversed().prefix(10).last?.id {
                        Divider().padding(.leading, 16)
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
            Image(systemName: "figure.pool.swim")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Swimming Data")
                .font(.title3.bold())
            Text("Start logging pool or open-water swimming workouts in the Apple Health app or via Apple Watch to see your performance trends.")
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
        let start = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let allWorkouts = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []
        swims = allWorkouts
            .filter { $0.workoutActivityType == .swimming }
            .compactMap { w -> SwimEntry? in
                guard let dist = w.totalDistance?.doubleValue(for: .meter()),
                      dist > 50 else { return nil }
                return SwimEntry(
                    id: w.uuid,
                    date: w.startDate,
                    distanceM: dist,
                    durationSecs: w.duration,
                    calories: w.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                    isPoolSwim: true
                )
            }
            .sorted { $0.date < $1.date }
    }
}

#Preview {
    NavigationStack {
        SwimmingAnalysisView()
    }
}
