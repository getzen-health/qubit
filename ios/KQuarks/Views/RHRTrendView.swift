import SwiftUI
import Charts
import HealthKit

// MARK: - RHRTrendView

/// Resting Heart Rate trend: 6-month history, fitness zone classification, and key stats.
struct RHRTrendView: View {
    @State private var samples: [(date: Date, value: Double)] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    private var latest: Double? { samples.last?.value }

    private var thirtyDayAvg: Double? {
        let cutoff = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let recent = samples.filter { $0.date >= cutoff }
        guard !recent.isEmpty else { return nil }
        return recent.map(\.value).reduce(0, +) / Double(recent.count)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if samples.isEmpty {
                    emptyState
                } else {
                    heroCard
                    trendChart
                    statsCard
                    classificationTable
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Resting Heart Rate")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: RHRPatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let zone = latest.map { RHRZone.from(bpm: $0) }
        return VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Resting HR")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    if let v = latest {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(String(format: "%.0f", v))
                                .font(.system(size: 48, weight: .bold, design: .rounded))
                                .foregroundStyle(zone?.color ?? .primary)
                            Text("bpm")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .padding(.bottom, 8)
                        }
                    }
                    if let zone {
                        Text(zone.label)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(zone.color)
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    if let avg = thirtyDayAvg {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f bpm", avg))
                                .font(.title3.bold())
                            Text("30-day avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if samples.count >= 2 {
                        let first = samples.first!.value
                        let last = latest!
                        let diff = last - first
                        VStack(alignment: .trailing, spacing: 2) {
                            HStack(spacing: 4) {
                                Image(systemName: diff <= 0 ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                                    .foregroundStyle(diff <= 0 ? .green : .red)
                                Text(String(format: "%+.0f bpm", diff))
                                    .font(.subheadline.bold())
                            }
                            Text("vs 6 months ago")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            if samples.count >= 2 {
                let first = samples.first!.value
                let last = latest!
                let diff = last - first
                let isImprovement = diff <= 0
                HStack(spacing: 4) {
                    Image(systemName: isImprovement ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .foregroundStyle(isImprovement ? .green : .orange)
                    Text(isImprovement
                         ? String(format: "Down %.0f bpm — your cardiovascular fitness is improving", abs(diff))
                         : String(format: "Up %.0f bpm over the tracked period", diff))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("6-Month Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(samples, id: \.date) { s in
                    LineMark(
                        x: .value("Date", s.date),
                        y: .value("RHR", s.value)
                    )
                    .foregroundStyle(.red)
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Date", s.date),
                        y: .value("RHR", s.value)
                    )
                    .foregroundStyle(.red.opacity(0.08))
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("RHR", s.value)
                    )
                    .foregroundStyle(s.value <= (thirtyDayAvg ?? s.value) ? Color.green : Color.red)
                    .symbolSize(25)
                }

                if let avg = thirtyDayAvg {
                    RuleMark(y: .value("30-day avg", avg))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                        .foregroundStyle(.secondary)
                        .annotation(position: .topLeading) {
                            Text("30d avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .chartYScale(domain: chartYDomain)
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                    AxisGridLine()
                }
            }
            .frame(height: 200)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    private var chartYDomain: ClosedRange<Double> {
        let values = samples.map(\.value)
        let min = (values.min() ?? 40) - 5
        let max = (values.max() ?? 90) + 5
        return min...max
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        let values = samples.map(\.value)
        let minVal = values.min() ?? 0
        let maxVal = values.max() ?? 0
        let avg = values.reduce(0, +) / Double(values.count)

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Best", value: "\(Int(minVal)) bpm")
                Divider().frame(height: 40)
                statBubble(label: "Worst", value: "\(Int(maxVal)) bpm")
                Divider().frame(height: 40)
                statBubble(label: "All-time avg", value: "\(Int(avg)) bpm")
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statBubble(label: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Classification Table

    private var classificationTable: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Fitness Zones")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(RHRZone.allCases, id: \.label) { zone in
                    let isCurrent = latest.map { RHRZone.from(bpm: $0) } == zone
                    HStack {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(zone.color)
                            .frame(width: 6, height: 24)
                        Text(zone.label)
                            .font(.subheadline)
                            .foregroundStyle(isCurrent ? zone.color : .primary)
                            .fontWeight(isCurrent ? .bold : .regular)
                        Spacer()
                        Text(zone.range)
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                        if isCurrent {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(zone.color)
                                .font(.caption)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if zone != RHRZone.allCases.last {
                        Divider().padding(.leading, 28)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.red)
                Text("About Resting Heart Rate")
                    .font(.subheadline.weight(.semibold))
            }
            Text("Your resting heart rate is the number of times your heart beats per minute at rest. A lower RHR generally indicates better cardiovascular fitness. As aerobic fitness improves, the heart becomes more efficient and needs fewer beats to pump the same amount of blood. Apple Watch measures RHR during periods of rest throughout the day.")
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
            Image(systemName: "heart.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No RHR Data")
                .font(.title3.bold())
            Text("Apple Watch measures your resting heart rate throughout the day. Wear your watch regularly to see your trend.")
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
        let start = Calendar.current.date(byAdding: .month, value: -6, to: Date()) ?? Date()
        let raw = (try? await healthKit.fetchSamples(for: .restingHeartRate, from: start, to: Date())) ?? []
        let unit = HKUnit.count().unitDivided(by: .minute())
        samples = raw.map { (date: $0.startDate, value: $0.quantity.doubleValue(for: unit)) }
            .sorted { $0.date < $1.date }
    }
}

// MARK: - RHR Zone

enum RHRZone: CaseIterable, Equatable {
    case athlete, excellent, good, average, high

    var label: String {
        switch self {
        case .athlete: return "Athlete"
        case .excellent: return "Excellent"
        case .good: return "Good"
        case .average: return "Average"
        case .high: return "High"
        }
    }

    var range: String {
        switch self {
        case .athlete: return "< 50 bpm"
        case .excellent: return "50–60 bpm"
        case .good: return "61–70 bpm"
        case .average: return "71–80 bpm"
        case .high: return "> 80 bpm"
        }
    }

    var color: Color {
        switch self {
        case .athlete: return .purple
        case .excellent: return .blue
        case .good: return .green
        case .average: return .yellow
        case .high: return .red
        }
    }

    static func from(bpm: Double) -> RHRZone {
        if bpm < 50 { return .athlete }
        if bpm < 61 { return .excellent }
        if bpm < 71 { return .good }
        if bpm < 81 { return .average }
        return .high
    }
}

#Preview {
    NavigationStack {
        RHRTrendView()
    }
}
