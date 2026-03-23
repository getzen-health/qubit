import SwiftUI
import Charts
import HealthKit

// MARK: - BloodOxygenView

/// Blood Oxygen (SpO₂) trend from Apple Watch, with low-reading alerts.
struct BloodOxygenView: View {
    @State private var samples: [(date: Date, value: Double)] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    private var latest: Double? { samples.last?.value }

    private var avg: Double? {
        guard !samples.isEmpty else { return nil }
        return samples.map(\.value).reduce(0, +) / Double(samples.count)
    }

    private var lowReadings: [(date: Date, value: Double)] {
        samples.filter { $0.value < 94 }
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
                    if !lowReadings.isEmpty {
                        lowReadingsCard
                    }
                    statsCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Blood Oxygen")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: SpO2PatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let zone = latest.map { SpO2Zone.from(percent: $0) }
        return VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Blood Oxygen (SpO₂)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    if let v = latest {
                        HStack(alignment: .firstTextBaseline, spacing: 2) {
                            Text(String(format: "%.0f", v))
                                .font(.system(size: 48, weight: .bold, design: .rounded))
                                .foregroundStyle(zone?.color ?? .primary)
                            Text("%")
                                .font(.title2)
                                .foregroundStyle(.secondary)
                                .padding(.bottom, 6)
                        }
                    }
                    if let zone {
                        Text(zone.label)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(zone.color)
                    }
                }
                Spacer()
                if let v = latest {
                    ZStack {
                        Circle()
                            .stroke(Color(.systemFill), lineWidth: 10)
                            .frame(width: 80, height: 80)
                        Circle()
                            .trim(from: 0, to: CGFloat((v - 85) / 15))
                            .stroke(zone?.color ?? .blue, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                            .frame(width: 80, height: 80)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.6), value: v)
                        Image(systemName: "lungs.fill")
                            .font(.title3)
                            .foregroundStyle(zone?.color ?? .blue)
                    }
                }
            }

            if let a = avg, let l = latest {
                let diff = l - a
                HStack(spacing: 4) {
                    Image(systemName: diff >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                        .foregroundStyle(diff >= 0 ? .green : .orange)
                    Text(String(format: "%+.0f%% vs 30-day avg (%.0f%%)", diff, a))
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
            Text("30-Day Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                // Normal range band
                RectangleMark(
                    yStart: .value("Low", 95),
                    yEnd: .value("High", 100)
                )
                .foregroundStyle(.green.opacity(0.05))

                ForEach(samples, id: \.date) { s in
                    LineMark(
                        x: .value("Date", s.date),
                        y: .value("SpO₂", s.value)
                    )
                    .foregroundStyle(.blue)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("SpO₂", s.value)
                    )
                    .foregroundStyle(s.value >= 95 ? Color.blue : Color.orange)
                    .symbolSize(20)
                }

                RuleMark(y: .value("Normal threshold", 95))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.secondary)
                    .annotation(position: .topLeading) {
                        Text("95%")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
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
        let minVal = (values.min() ?? 90) - 1
        let maxVal = min((values.max() ?? 100) + 1, 100)
        return minVal...maxVal
    }

    // MARK: - Low Readings Alert

    private var lowReadingsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                Text("Low Readings Detected")
                    .font(.subheadline.weight(.semibold))
            }

            Text("\(lowReadings.count) reading\(lowReadings.count == 1 ? "" : "s") below 94% in the last 30 days. Consistently low readings during sleep may indicate a breathing issue. Consider discussing with a healthcare provider if this pattern persists.")
                .font(.caption)
                .foregroundStyle(.secondary)

            let df = DateFormatter()
            let _ = { df.dateStyle = .short; df.timeStyle = .short }()
            ForEach(lowReadings.prefix(5), id: \.date) { r in
                HStack {
                    Text(df.string(from: r.date))
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(String(format: "%.0f%%", r.value))
                        .font(.caption.bold())
                        .foregroundStyle(.orange)
                }
            }
            if lowReadings.count > 5 {
                Text("+ \(lowReadings.count - 5) more")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        let values = samples.map(\.value)
        let minVal = values.min() ?? 0
        let avgVal = values.reduce(0, +) / Double(values.count)
        let pctNormal = Double(values.filter { $0 >= 95 }.count) / Double(values.count) * 100

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Minimum", value: String(format: "%.0f%%", minVal), highlight: minVal < 94)
                Divider().frame(height: 40)
                statBubble(label: "Average", value: String(format: "%.1f%%", avgVal), highlight: false)
                Divider().frame(height: 40)
                statBubble(label: "Normal range", value: String(format: "%.0f%%", pctNormal), highlight: false)
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statBubble(label: String, value: String, highlight: Bool) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(highlight ? .orange : .primary)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.blue)
                Text("About Blood Oxygen")
                    .font(.subheadline.weight(.semibold))
            }
            Text("Blood oxygen saturation (SpO₂) measures the percentage of hemoglobin in your blood that carries oxygen. Normal levels are 95–100%. Readings consistently below 94% may indicate a breathing issue and warrant medical evaluation. Apple Watch measures SpO₂ during sleep and on demand. Results may vary based on skin tone, nail polish, or motion.")
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
            Image(systemName: "lungs")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No SpO₂ Data")
                .font(.title3.bold())
            Text("Apple Watch Series 6 and later measures blood oxygen during sleep and on demand. Make sure Blood Oxygen is enabled in the Health app.")
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
        let raw = (try? await healthKit.fetchSamples(for: .oxygenSaturation, from: start, to: Date())) ?? []
        let unit = HKUnit.percent()
        samples = raw.map { (date: $0.startDate, value: $0.quantity.doubleValue(for: unit) * 100) }
            .sorted { $0.date < $1.date }
    }
}

// MARK: - SpO2 Zone

enum SpO2Zone {
    case normal, lowNormal, concerning

    var label: String {
        switch self {
        case .normal: return "Normal"
        case .lowNormal: return "Low Normal"
        case .concerning: return "Below Normal"
        }
    }

    var color: Color {
        switch self {
        case .normal: return .blue
        case .lowNormal: return .orange
        case .concerning: return .red
        }
    }

    static func from(percent: Double) -> SpO2Zone {
        if percent >= 95 { return .normal }
        if percent >= 90 { return .lowNormal }
        return .concerning
    }
}

#Preview {
    NavigationStack {
        BloodOxygenView()
    }
}
