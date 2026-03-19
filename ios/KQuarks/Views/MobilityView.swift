import SwiftUI
import Charts
import HealthKit

// MARK: - MobilityView

/// Shows walking-quality metrics captured by iPhone accelerometer and gyroscope.
/// Walking speed, step length, asymmetry, and double-support percentage are
/// validated indicators of musculoskeletal health and fall risk.
struct MobilityView: View {
    @State private var speedDays: [(date: Date, value: Double)] = []
    @State private var stepLengthDays: [(date: Date, value: Double)] = []
    @State private var asymmetryDays: [(date: Date, value: Double)] = []
    @State private var doubleSupportDays: [(date: Date, value: Double)] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    private var latestSpeed: Double? { speedDays.last?.value }
    private var latestStepLength: Double? { stepLengthDays.last?.value }
    private var latestAsymmetry: Double? { asymmetryDays.last?.value }
    private var latestDoubleSupport: Double? { doubleSupportDays.last?.value }

    private var avgSpeed: Double? {
        guard !speedDays.isEmpty else { return nil }
        return speedDays.map(\.value).reduce(0, +) / Double(speedDays.count)
    }

    private var hasData: Bool {
        !speedDays.isEmpty || !stepLengthDays.isEmpty
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if !hasData {
                    emptyState
                } else {
                    summaryCard
                    if speedDays.count >= 5 { speedChart }
                    if stepLengthDays.count >= 5 { stepLengthChart }
                    if asymmetryDays.count >= 5 { asymmetryChart }
                    metricsCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Mobility")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: WalkingSteadinessView()) {
                    Image(systemName: "figure.walk.motion")
                }
            }
        }
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let speedZone = SpeedZone.from(mps: latestSpeed ?? 0)

        return VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Walking Speed")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    if let s = latestSpeed {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(String(format: "%.2f", s))
                                .font(.system(size: 48, weight: .bold, design: .rounded))
                                .foregroundStyle(speedZone.color)
                            Text("m/s")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .padding(.bottom, 8)
                        }
                        Text(speedZone.label)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(speedZone.color)
                    } else {
                        Text("No data")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 10) {
                    if let avg = avgSpeed {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.2f m/s", avg))
                                .font(.title3.bold().monospacedDigit())
                            Text("30-day avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if let sl = latestStepLength {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f cm", sl * 100))
                                .font(.title3.bold().monospacedDigit())
                            Text("step length")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            // Mini metrics row
            HStack(spacing: 8) {
                if let asym = latestAsymmetry {
                    miniMetric(
                        label: "Asymmetry",
                        value: String(format: "%.1f%%", asym),
                        color: asym > 10 ? .orange : .green
                    )
                }
                if latestAsymmetry != nil && latestDoubleSupport != nil {
                    Divider().frame(height: 28)
                }
                if let ds = latestDoubleSupport {
                    miniMetric(
                        label: "Dbl Support",
                        value: String(format: "%.1f%%", ds),
                        color: ds > 30 ? .orange : .green
                    )
                }
            }
            .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func miniMetric(label: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
        }
    }

    // MARK: - Speed Chart

    private var speedChart: some View {
        trendChart(
            title: "Walking Speed",
            data: speedDays,
            unit: "m/s",
            color: .teal,
            referenceValue: 1.2,
            referenceLabel: "Avg healthy"
        )
    }

    // MARK: - Step Length Chart

    private var stepLengthChart: some View {
        trendChart(
            title: "Step Length",
            data: stepLengthDays.map { (date: $0.date, value: $0.value * 100) }, // convert m → cm
            unit: "cm",
            color: .indigo,
            referenceValue: nil,
            referenceLabel: nil
        )
    }

    // MARK: - Asymmetry Chart

    private var asymmetryChart: some View {
        trendChart(
            title: "Walking Asymmetry",
            data: asymmetryDays,
            unit: "%",
            color: .orange,
            referenceValue: 10.0,
            referenceLabel: "10% threshold"
        )
    }

    private func trendChart(
        title: String,
        data: [(date: Date, value: Double)],
        unit: String,
        color: Color,
        referenceValue: Double?,
        referenceLabel: String?
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .padding(.horizontal, 4)

            let vals = data.map(\.value)
            let minV = (vals.min() ?? 0) * 0.95
            let maxV = (vals.max() ?? 1) * 1.05

            Chart {
                if let ref = referenceValue {
                    RuleMark(y: .value("Reference", ref))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                        .foregroundStyle(color.opacity(0.5))
                        .annotation(position: .topLeading) {
                            Text(referenceLabel ?? "")
                                .font(.caption2)
                                .foregroundStyle(color.opacity(0.7))
                        }
                }
                ForEach(Array(data.enumerated()), id: \.offset) { _, point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value(unit, point.value)
                    )
                    .foregroundStyle(color)
                    .interpolationMethod(.catmullRom)
                    PointMark(
                        x: .value("Date", point.date),
                        y: .value(unit, point.value)
                    )
                    .foregroundStyle(color)
                    .symbolSize(20)
                }
            }
            .chartYAxisLabel(unit)
            .chartYScale(domain: minV...maxV)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 150)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Metrics Card

    private var metricsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Understanding Your Metrics")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                metricRow(
                    icon: "figure.walk",
                    label: "Walking Speed",
                    normal: "> 1.2 m/s",
                    current: latestSpeed.map { String(format: "%.2f m/s", $0) } ?? "—",
                    color: latestSpeed.map { $0 >= 1.2 ? Color.green : .orange } ?? .secondary
                )
                Divider().padding(.leading, 56)
                metricRow(
                    icon: "ruler",
                    label: "Step Length",
                    normal: "> 65 cm typical",
                    current: latestStepLength.map { String(format: "%.0f cm", $0 * 100) } ?? "—",
                    color: .primary
                )
                Divider().padding(.leading, 56)
                metricRow(
                    icon: "arrow.left.and.right",
                    label: "Asymmetry",
                    normal: "< 10% (balanced)",
                    current: latestAsymmetry.map { String(format: "%.1f%%", $0) } ?? "—",
                    color: latestAsymmetry.map { $0 < 10 ? Color.green : .orange } ?? .secondary
                )
                Divider().padding(.leading, 56)
                metricRow(
                    icon: "figure.walk.motion",
                    label: "Double Support",
                    normal: "< 25% (steady gait)",
                    current: latestDoubleSupport.map { String(format: "%.1f%%", $0) } ?? "—",
                    color: latestDoubleSupport.map { $0 < 25 ? Color.green : .orange } ?? .secondary
                )
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    private func metricRow(icon: String, label: String, normal: String, current: String, color: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.teal)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.subheadline)
                Text("Normal: \(normal)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(current)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.teal)
                Text("About Mobility Metrics")
                    .font(.subheadline.weight(.semibold))
            }
            Text("Your iPhone measures these metrics automatically using its motion sensors during walks. Walking speed, step length, and symmetry are validated clinical markers for fall risk, musculoskeletal health, and aging. Carry your iPhone in your pocket for accurate readings.")
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
            Image(systemName: "figure.walk.motion")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Mobility Data")
                .font(.title3.bold())
            Text("Walking metrics are measured by your iPhone's motion sensors during outdoor walks. Carry your iPhone in your pocket while walking to record data.")
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

        async let speed = (try? await healthKit.fetchSamples(for: .walkingSpeed, from: start, to: Date())) ?? []
        async let stepLen = (try? await healthKit.fetchSamples(for: .walkingStepLength, from: start, to: Date())) ?? []
        async let asym = (try? await healthKit.fetchSamples(for: .walkingAsymmetryPercentage, from: start, to: Date())) ?? []
        async let ds = (try? await healthKit.fetchSamples(for: .walkingDoubleSupportPercentage, from: start, to: Date())) ?? []

        let (speedRaw, stepLenRaw, asymRaw, dsRaw) = await (speed, stepLen, asym, ds)

        let cal = Calendar.current
        speedDays = dailyAverage(speedRaw, unit: HKUnit(from: "m/s"), cal: cal)
        stepLengthDays = dailyAverage(stepLenRaw, unit: HKUnit(from: "m"), cal: cal)
        asymmetryDays = dailyAverage(asymRaw, unit: HKUnit.percent(), cal: cal).map {
            (date: $0.date, value: $0.value * 100)
        }
        doubleSupportDays = dailyAverage(dsRaw, unit: HKUnit.percent(), cal: cal).map {
            (date: $0.date, value: $0.value * 100)
        }
    }

    private func dailyAverage(_ samples: [HKQuantitySample], unit: HKUnit, cal: Calendar) -> [(date: Date, value: Double)] {
        var byDay: [DateComponents: [Double]] = [:]
        for s in samples {
            let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
            byDay[key, default: []].append(s.quantity.doubleValue(for: unit))
        }
        return byDay.compactMap { comps, vals in
            cal.date(from: comps).map { (date: $0, value: vals.reduce(0, +) / Double(vals.count)) }
        }.sorted { $0.date < $1.date }
    }
}

// MARK: - Speed Zone

enum SpeedZone {
    case excellent, good, fair, low

    var label: String {
        switch self {
        case .excellent: return "Excellent"
        case .good: return "Good"
        case .fair: return "Fair"
        case .low: return "Low"
        }
    }

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .teal
        case .fair: return .yellow
        case .low: return .red
        }
    }

    static func from(mps: Double) -> SpeedZone {
        if mps >= 1.4 { return .excellent }
        if mps >= 1.2 { return .good }
        if mps >= 0.8 { return .fair }
        return .low
    }
}

#Preview {
    NavigationStack {
        MobilityView()
    }
}
