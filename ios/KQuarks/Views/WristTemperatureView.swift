import SwiftUI
import Charts
import HealthKit

// MARK: - WristTemperatureView

/// Nightly wrist temperature deviation from Apple Watch Series 8+.
/// Values represent deviation from the user's personal baseline — positive = warmer, negative = cooler.
struct WristTemperatureView: View {
    @State private var samples: [(date: Date, value: Double)] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    private var latest: Double? { samples.last?.value }

    private var thirtyDayAvg: Double? {
        guard !samples.isEmpty else { return nil }
        return samples.map(\.value).reduce(0, +) / Double(samples.count)
    }

    private var elevatedReadings: [(date: Date, value: Double)] {
        samples.filter { $0.value > 0.5 }
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
                    if !elevatedReadings.isEmpty {
                        elevatedCard
                    }
                    statsCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Wrist Temperature")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: TemperatureInsightsView()) {
                    Image(systemName: "waveform.path.ecg")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let zone = latest.map { TempZone.from(deviation: $0) }
        return VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Last Night's Deviation")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    if let v = latest {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(String(format: "%+.2f", v))
                                .font(.system(size: 44, weight: .bold, design: .rounded))
                                .foregroundStyle(zone?.color ?? .primary)
                            Text("°C")
                                .font(.title3)
                                .foregroundStyle(.secondary)
                                .padding(.bottom, 4)
                        }
                    }
                    if let zone {
                        Text(zone.label)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(zone.color)
                    }
                }
                Spacer()
                Image(systemName: "thermometer.medium")
                    .font(.system(size: 44))
                    .foregroundStyle(zone?.color ?? .orange)
            }

            // Deviation scale bar
            VStack(alignment: .leading, spacing: 4) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        // Background gradient
                        LinearGradient(
                            colors: [.blue, .cyan, .green, .yellow, .orange, .red],
                            startPoint: .leading, endPoint: .trailing
                        )
                        .frame(height: 8)
                        .clipShape(RoundedRectangle(cornerRadius: 4))

                        // Baseline marker
                        Rectangle()
                            .fill(Color.primary)
                            .frame(width: 2, height: 14)
                            .offset(x: geo.size.width / 2 - 1)

                        // Current marker
                        if let v = latest {
                            let clamped = min(max(v, -1.5), 1.5)
                            let pos = CGFloat((clamped + 1.5) / 3.0)
                            Circle()
                                .fill(.white)
                                .frame(width: 14, height: 14)
                                .shadow(radius: 2)
                                .offset(x: geo.size.width * pos - 7)
                        }
                    }
                }
                .frame(height: 14)

                HStack {
                    Text("−1.5°C")
                    Spacer()
                    Text("Baseline")
                    Spacer()
                    Text("+1.5°C")
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
            Text("30-Night Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Baseline", 0))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.secondary.opacity(0.5))

                RuleMark(y: .value("Alert threshold", 0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3]))
                    .foregroundStyle(.orange.opacity(0.5))
                    .annotation(position: .topLeading) {
                        Text("+0.5°C")
                            .font(.caption2)
                            .foregroundStyle(.orange.opacity(0.7))
                    }

                ForEach(samples, id: \.date) { s in
                    BarMark(
                        x: .value("Date", s.date),
                        yStart: .value("Start", 0),
                        yEnd: .value("Deviation", s.value)
                    )
                    .foregroundStyle(tempBarColor(s.value))
                    .cornerRadius(2)
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

    private func tempBarColor(_ value: Double) -> Color {
        if value > 0.5 { return Color.red.opacity(0.7) }
        if value > 0.1 { return Color.orange.opacity(0.7) }
        if value < -0.5 { return Color.blue.opacity(0.7) }
        if value < -0.1 { return Color.cyan.opacity(0.7) }
        return Color.green.opacity(0.7)
    }

    private var chartYDomain: ClosedRange<Double> {
        let values = samples.map(\.value)
        let absMax = max(abs(values.min() ?? -1), abs(values.max() ?? 1), 0.5)
        return -(absMax + 0.3)...(absMax + 0.3)
    }

    // MARK: - Elevated Readings Card

    private var elevatedCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "thermometer.high")
                    .foregroundStyle(.orange)
                Text("Elevated Nights Detected")
                    .font(.subheadline.weight(.semibold))
            }
            Text("\(elevatedReadings.count) night\(elevatedReadings.count == 1 ? "" : "s") above +0.5°C in the last 30 days. Elevated wrist temperature can indicate illness, hormonal changes, or metabolic stress — sometimes 1–2 days before symptoms appear.")
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

    // MARK: - Stats Card

    private var statsCard: some View {
        let values = samples.map(\.value)
        let minVal = values.min() ?? 0
        let maxVal = values.max() ?? 0
        let avgVal = values.reduce(0, +) / Double(values.count)

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Lowest", value: String(format: "%+.2f°C", minVal), color: minVal < -0.5 ? .blue : .primary)
                Divider().frame(height: 40)
                statBubble(label: "Avg deviation", value: String(format: "%+.2f°C", avgVal), color: .primary)
                Divider().frame(height: 40)
                statBubble(label: "Highest", value: String(format: "%+.2f°C", maxVal), color: maxVal > 0.5 ? .red : .primary)
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statBubble(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
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
                    .foregroundStyle(.orange)
                Text("About Wrist Temperature")
                    .font(.subheadline.weight(.semibold))
            }
            Text("Apple Watch Series 8 and later measures wrist skin temperature every 5 seconds during sleep. The values shown are deviations from your personal baseline (established over multiple nights), not absolute temperature. A deviation above +0.5°C may indicate illness, ovulation, or metabolic changes. A deviation below −0.5°C is less common and may reflect environmental cold.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "thermometer.medium")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Temperature Data")
                .font(.title3.bold())
            Text("Wrist temperature during sleep requires Apple Watch Series 8, Ultra, or later running iOS 16 or later.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            VStack(alignment: .leading, spacing: 6) {
                Label("Apple Watch Series 8, Ultra, or later", systemImage: "applewatch")
                Label("iOS 16.0 or later", systemImage: "iphone")
                Label("Sleep tracking enabled in Health", systemImage: "moon.fill")
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding(.top, 40)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        if #available(iOS 16.0, *) {
            let start = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
            let raw = (try? await healthKit.fetchSamples(for: .appleSleepingWristTemperature, from: start, to: Date())) ?? []
            let unit = HKUnit.degreeCelsius()
            // Apple provides nightly averages; take one per date (latest per night)
            let mapped = raw.map { (date: $0.startDate, value: $0.quantity.doubleValue(for: unit)) }
            // Deduplicate: one value per day
            let cal = Calendar.current
            var byDay: [DateComponents: Double] = [:]
            for s in mapped {
                let key = cal.dateComponents([.year, .month, .day], from: s.date)
                byDay[key] = s.value
            }
            samples = byDay.compactMap { (comps, val) in
                cal.date(from: comps).map { (date: $0, value: val) }
            }.sorted { $0.date < $1.date }
        }
    }
}

// MARK: - Temperature Zone

enum TempZone {
    case veryElevated, elevated, normal, cool, veryCool

    var label: String {
        switch self {
        case .veryElevated: return "Very Elevated — possible fever"
        case .elevated: return "Elevated — check for illness"
        case .normal: return "Normal"
        case .cool: return "Slightly Cool"
        case .veryCool: return "Very Cool"
        }
    }

    var color: Color {
        switch self {
        case .veryElevated: return .red
        case .elevated: return .orange
        case .normal: return .green
        case .cool: return .cyan
        case .veryCool: return .blue
        }
    }

    static func from(deviation: Double) -> TempZone {
        if deviation > 1.0 { return .veryElevated }
        if deviation > 0.5 { return .elevated }
        if deviation < -1.0 { return .veryCool }
        if deviation < -0.5 { return .cool }
        return .normal
    }
}

#Preview {
    NavigationStack {
        WristTemperatureView()
    }
}
