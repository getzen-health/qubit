import SwiftUI
import Charts
import HealthKit

// MARK: - RespiratoryRateView

/// Respiratory rate trend from Apple Watch sleep tracking, with normal-range guidance.
struct RespiratoryRateView: View {
    @State private var samples: [(date: Date, value: Double)] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    private var latest: Double? { samples.last?.value }

    private var thirtyDayAvg: Double? {
        guard !samples.isEmpty else { return nil }
        return samples.map(\.value).reduce(0, +) / Double(samples.count)
    }

    private var outOfRangeReadings: [(date: Date, value: Double)] {
        samples.filter { $0.value < 12 || $0.value > 20 }
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
                    if !outOfRangeReadings.isEmpty {
                        outOfRangeCard
                    }
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Respiratory Rate")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: RespiratoryPatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let zone = latest.map { RespZone.from(bpm: $0) }
        return VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Breathing Rate")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    if let v = latest {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(String(format: "%.1f", v))
                                .font(.system(size: 48, weight: .bold, design: .rounded))
                                .foregroundStyle(zone?.color ?? .primary)
                            Text("br/min")
                                .font(.subheadline)
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
                            Text(String(format: "%.1f", avg))
                                .font(.title3.bold())
                            Text("30-day avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Image(systemName: "wind")
                        .font(.system(size: 36))
                        .foregroundStyle(zone?.color ?? .teal)
                }
            }

            // Normal range indicator
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Normal range: 12–20 br/min")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Spacer()
                    if let v = latest {
                        let inRange = v >= 12 && v <= 20
                        Label(inRange ? "In range" : "Out of range",
                              systemImage: inRange ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                            .font(.caption2.bold())
                            .foregroundStyle(inRange ? .green : .orange)
                    }
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color(.systemFill))
                            .frame(height: 6)

                        // Normal range highlight (12-20 out of 8-24 scale)
                        let scale = 24.0 - 8.0
                        let normalStart = CGFloat((12.0 - 8.0) / scale)
                        let normalWidth = CGFloat((20.0 - 12.0) / scale)
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.green.opacity(0.3))
                            .frame(width: geo.size.width * normalWidth, height: 6)
                            .offset(x: geo.size.width * normalStart)

                        // Current marker
                        if let v = latest {
                            let pos = CGFloat((min(max(v, 8), 24) - 8) / scale)
                            Circle()
                                .fill(zone?.color ?? .teal)
                                .frame(width: 12, height: 12)
                                .offset(x: geo.size.width * pos - 6)
                        }
                    }
                }
                .frame(height: 12)

                HStack {
                    Text("8")
                    Spacer()
                    Text("12")
                    Spacer()
                    Text("16")
                    Spacer()
                    Text("20")
                    Spacer()
                    Text("24")
                }
                .font(.caption2)
                .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                // Normal range band
                RectangleMark(yStart: .value("Low", 12), yEnd: .value("High", 20))
                    .foregroundStyle(.green.opacity(0.06))

                RuleMark(y: .value("Min normal", 12))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3]))
                    .foregroundStyle(.secondary.opacity(0.5))

                RuleMark(y: .value("Max normal", 20))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3]))
                    .foregroundStyle(.secondary.opacity(0.5))

                ForEach(samples, id: \.date) { s in
                    LineMark(
                        x: .value("Date", s.date),
                        y: .value("Rate", s.value)
                    )
                    .foregroundStyle(.teal)
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Date", s.date),
                        y: .value("Rate", s.value)
                    )
                    .foregroundStyle(.teal.opacity(0.07))
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("Rate", s.value)
                    )
                    .foregroundStyle(s.value >= 12 && s.value <= 20 ? Color.teal : Color.orange)
                    .symbolSize(20)
                }
            }
            .chartYScale(domain: chartYDomain)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
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
        let min = (values.min() ?? 12) - 2
        let max = (values.max() ?? 20) + 2
        return min...max
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        let values = samples.map(\.value)
        let minVal = values.min() ?? 0
        let maxVal = values.max() ?? 0
        let avgVal = values.reduce(0, +) / Double(values.count)
        let pctNormal = Double(values.filter { $0 >= 12 && $0 <= 20 }.count) / Double(values.count) * 100

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Min", value: String(format: "%.1f", minVal))
                Divider().frame(height: 40)
                statBubble(label: "Avg", value: String(format: "%.1f", avgVal))
                Divider().frame(height: 40)
                statBubble(label: "Max", value: String(format: "%.1f", maxVal))
                Divider().frame(height: 40)
                statBubble(label: "In range", value: String(format: "%.0f%%", pctNormal))
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

    // MARK: - Out of Range Card

    private var outOfRangeCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                Text("Readings Outside Normal Range")
                    .font(.subheadline.weight(.semibold))
            }
            Text("\(outOfRangeReadings.count) reading\(outOfRangeReadings.count == 1 ? "" : "s") outside 12–20 br/min. Occasional variation is normal, but persistent deviation may indicate illness, stress, or medication effects.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.teal)
                Text("About Respiratory Rate")
                    .font(.subheadline.weight(.semibold))
            }
            Text("Respiratory rate is how many breaths you take per minute. Apple Watch measures it automatically during sleep. Normal adult resting respiratory rate is 12–20 breaths per minute. Rates below 12 (bradypnea) or above 20 (tachypnea) can indicate health issues. An elevated rate during sleep can be a sign of illness, stress, or poor recovery.")
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
            Image(systemName: "wind")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Respiratory Data")
                .font(.title3.bold())
            Text("Apple Watch measures your breathing rate during sleep. Make sure your watch is worn while sleeping to capture this metric.")
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
        let start = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let raw = (try? await healthKit.fetchSamples(for: .respiratoryRate, from: start, to: Date())) ?? []
        let unit = HKUnit.count().unitDivided(by: .minute())
        samples = raw.map { (date: $0.startDate, value: $0.quantity.doubleValue(for: unit)) }
            .sorted { $0.date < $1.date }
    }
}

// MARK: - Respiratory Zone

enum RespZone {
    case low, normal, elevated

    var label: String {
        switch self {
        case .low: return "Low (Bradypnea)"
        case .normal: return "Normal"
        case .elevated: return "Elevated (Tachypnea)"
        }
    }

    var color: Color {
        switch self {
        case .low: return .orange
        case .normal: return .teal
        case .elevated: return .orange
        }
    }

    static func from(bpm: Double) -> RespZone {
        if bpm < 12 { return .low }
        if bpm <= 20 { return .normal }
        return .elevated
    }
}

#Preview {
    NavigationStack {
        RespiratoryRateView()
    }
}
