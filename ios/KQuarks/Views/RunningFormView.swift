import SwiftUI
import Charts
import HealthKit

// MARK: - RunningFormView

/// Shows Apple Watch running form metrics from outdoor runs: cadence, stride length,
/// vertical oscillation, ground contact time, and running power.
/// Available on Apple Watch Series 6+ with iOS 16+.
@available(iOS 16.0, *)
private struct RunningFormContent: View {
    @State private var cadenceDays: [(date: Date, value: Double)] = []
    @State private var strideLenDays: [(date: Date, value: Double)] = []
    @State private var vertOscDays: [(date: Date, value: Double)] = []
    @State private var groundContactDays: [(date: Date, value: Double)] = []
    @State private var powerDays: [(date: Date, value: Double)] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    private var latestCadence: Double? { cadenceDays.last?.value }
    private var latestStrideLen: Double? { strideLenDays.last?.value }
    private var latestVertOsc: Double? { vertOscDays.last?.value }
    private var latestGroundContact: Double? { groundContactDays.last?.value }
    private var latestPower: Double? { powerDays.last?.value }

    private var hasData: Bool { !cadenceDays.isEmpty || !strideLenDays.isEmpty }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if !hasData {
                    emptyState
                } else {
                    summaryCard
                    if cadenceDays.count >= 3 { metricChart(title: "Cadence", data: cadenceDays, unit: "spm", color: .green, idealMin: 170, idealMax: 190) }
                    if strideLenDays.count >= 3 { metricChart(title: "Stride Length", data: strideLenDays.map { (date: $0.date, value: $0.value * 100) }, unit: "cm", color: .blue, idealMin: nil, idealMax: nil) }
                    if vertOscDays.count >= 3 { metricChart(title: "Vertical Oscillation", data: vertOscDays.map { (date: $0.date, value: $0.value * 100) }, unit: "cm", color: .orange, idealMin: nil, idealMax: 9.0) }
                    if groundContactDays.count >= 3 { metricChart(title: "Ground Contact Time", data: groundContactDays.map { (date: $0.date, value: $0.value * 1000) }, unit: "ms", color: .purple, idealMin: nil, idealMax: 250) }
                    if powerDays.count >= 3 { metricChart(title: "Running Power", data: powerDays, unit: "W", color: .red, idealMin: nil, idealMax: nil) }
                    formGuideCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Running Form")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Running Biomechanics")
                    .font(.headline)
                Spacer()
                Text("30-day avg")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                if let c = latestCadence {
                    FormMetricCell(
                        label: "Cadence",
                        value: String(format: "%.0f spm", c),
                        icon: "metronome.fill",
                        color: .green,
                        status: c >= 170 && c <= 190 ? .good : c >= 160 ? .fair : .improve
                    )
                }
                if let s = latestStrideLen {
                    FormMetricCell(
                        label: "Stride Length",
                        value: String(format: "%.0f cm", s * 100),
                        icon: "ruler.fill",
                        color: .blue,
                        status: .neutral
                    )
                }
                if let v = latestVertOsc {
                    FormMetricCell(
                        label: "Vertical Osc.",
                        value: String(format: "%.1f cm", v * 100),
                        icon: "arrow.up.arrow.down",
                        color: .orange,
                        status: v * 100 <= 9.0 ? .good : v * 100 <= 12.0 ? .fair : .improve
                    )
                }
                if let g = latestGroundContact {
                    FormMetricCell(
                        label: "Ground Contact",
                        value: String(format: "%.0f ms", g * 1000),
                        icon: "figure.run",
                        color: .purple,
                        status: g * 1000 <= 250 ? .good : g * 1000 <= 300 ? .fair : .improve
                    )
                }
                if let p = latestPower {
                    FormMetricCell(
                        label: "Running Power",
                        value: String(format: "%.0f W", p),
                        icon: "bolt.fill",
                        color: .red,
                        status: .neutral
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Metric Chart (reusable)

    private func metricChart(
        title: String,
        data: [(date: Date, value: Double)],
        unit: String,
        color: Color,
        idealMin: Double?,
        idealMax: Double?
    ) -> some View {
        let vals = data.map(\.value)
        let minV = (vals.min() ?? 0) * 0.95
        let maxV = (vals.max() ?? 1) * 1.05

        return VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                if let min = idealMin, let max = idealMax {
                    RectangleMark(yStart: .value("Min", min), yEnd: .value("Max", max))
                        .foregroundStyle(Color.green.opacity(0.08))
                } else if let max = idealMax {
                    RectangleMark(yStart: .value("Min", 0), yEnd: .value("Max", max))
                        .foregroundStyle(Color.green.opacity(0.08))
                    RuleMark(y: .value("Target", max))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                        .foregroundStyle(.green.opacity(0.6))
                        .annotation(position: .topLeading) {
                            Text("Target ≤\(Int(max))")
                                .font(.caption2)
                                .foregroundStyle(.green.opacity(0.7))
                        }
                } else if let min = idealMin {
                    RuleMark(y: .value("Target", min))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                        .foregroundStyle(.green.opacity(0.6))
                        .annotation(position: .topLeading) {
                            Text("Target ≥\(Int(min))")
                                .font(.caption2)
                                .foregroundStyle(.green.opacity(0.7))
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
                    .symbolSize(25)
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

    // MARK: - Form Guide Card

    private var formGuideCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.green)
                Text("Elite Runner Benchmarks")
                    .font(.subheadline.weight(.semibold))
            }

            let guides: [(metric: String, target: String, why: String)] = [
                ("Cadence", "170–190 spm", "Higher cadence reduces impact force and injury risk"),
                ("Vertical Oscillation", "≤ 9 cm", "Less bounce = more forward momentum"),
                ("Ground Contact", "< 250 ms", "Quick turnover minimises breaking forces"),
                ("Running Power", "Varies by pace", "Tracks mechanical output like cycling power"),
            ]

            ForEach(guides, id: \.metric) { g in
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(g.metric)
                            .font(.caption.weight(.semibold))
                        Spacer()
                        Text(g.target)
                            .font(.caption.bold())
                            .foregroundStyle(.green)
                    }
                    Text(g.why)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Text("Data requires Apple Watch Series 6 or later with GPS running workouts. Metrics are averaged across all outdoor runs for each day.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.run.circle")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Form Metrics")
                .font(.title3.bold())
            Text("Running form metrics require Apple Watch Series 6 or later during outdoor GPS runs. Make sure your workout type is set to Outdoor Run.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Text("Requires iOS 16 and Apple Watch.")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        let start = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let cal = Calendar.current

        let cadRaw: [HKQuantitySample] = [] // runningCadence not available in this SDK
        async let strideRaw = (try? await healthKit.fetchSamples(for: .runningStrideLength, from: start, to: Date())) ?? []
        async let vertRaw = (try? await healthKit.fetchSamples(for: .runningVerticalOscillation, from: start, to: Date())) ?? []
        async let groundRaw = (try? await healthKit.fetchSamples(for: .runningGroundContactTime, from: start, to: Date())) ?? []
        async let powerRaw = (try? await healthKit.fetchSamples(for: .runningPower, from: start, to: Date())) ?? []

        let (cad, stride, vert, ground, power) = await (cadRaw, strideRaw, vertRaw, groundRaw, powerRaw)

        func avg(_ samples: [HKQuantitySample], unit: HKUnit) -> [(date: Date, value: Double)] {
            var byDay: [DateComponents: [Double]] = [:]
            for s in samples {
                let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
                byDay[key, default: []].append(s.quantity.doubleValue(for: unit))
            }
            return byDay.compactMap { comps, vals in
                cal.date(from: comps).map { (date: $0, value: vals.reduce(0,+)/Double(vals.count)) }
            }.sorted { $0.date < $1.date }
        }

        cadenceDays = avg(cad, unit: HKUnit.count().unitDivided(by: .minute()))
        strideLenDays = avg(stride, unit: HKUnit(from: "m"))
        vertOscDays = avg(vert, unit: HKUnit(from: "m"))
        groundContactDays = avg(ground, unit: HKUnit.secondUnit(with: .milli).unitDivided(by: .count()))
        powerDays = avg(power, unit: HKUnit.watt())
    }
}

// MARK: - Form Metric Cell

enum FormStatus { case good, fair, improve, neutral }

struct FormMetricCell: View {
    let label: String
    let value: String
    let icon: String
    let color: Color
    let status: FormStatus

    private var statusIcon: String {
        switch status {
        case .good: return "checkmark.circle.fill"
        case .fair: return "minus.circle.fill"
        case .improve: return "arrow.up.circle.fill"
        case .neutral: return "circle.fill"
        }
    }

    private var statusColor: Color {
        switch status {
        case .good: return .green
        case .fair: return .yellow
        case .improve: return .orange
        case .neutral: return .secondary
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Spacer()
                Image(systemName: statusIcon)
                    .foregroundStyle(statusColor)
                    .font(.caption)
            }
            Text(value)
                .font(.title3.bold().monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Wrapper for older iOS

struct RunningFormView: View {
    var body: some View {
        if #available(iOS 16.0, *) {
            RunningFormContent()
        } else {
            VStack(spacing: 12) {
                Image(systemName: "figure.run.circle")
                    .font(.system(size: 48))
                    .foregroundStyle(.secondary)
                Text("iOS 16 Required")
                    .font(.title3.bold())
                Text("Running form metrics require iOS 16 or later.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            .navigationTitle("Running Form")
            .toolbarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    NavigationStack {
        RunningFormView()
    }
}
