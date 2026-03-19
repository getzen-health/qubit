import SwiftUI
import Charts
import HealthKit

// MARK: - BloodGlucoseView

/// Displays blood glucose readings from HealthKit — compatible with CGM devices
/// (Dexcom, FreeStyle Libre, Stelo) and manual logging.
/// Standard targets: fasting 70–99 mg/dL, post-meal <180 mg/dL.
struct BloodGlucoseView: View {
    @State private var readings: [GlucoseReading] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared
    private let unit = HKUnit(from: "mg/dL")

    // Time-in-range boundaries (mg/dL)
    private let low: Double = 70
    private let targetHigh: Double = 140   // post-meal target (less strict than medical TIR)
    private let high: Double = 180         // clinical TIR upper bound

    struct GlucoseReading: Identifiable {
        let id = UUID()
        let date: Date
        let mgdl: Double

        var zone: GlucoseZone { GlucoseZone.from(mgdl: mgdl) }
    }

    private var latest: GlucoseReading? { readings.last }

    private var timeInRange: Double {
        guard !readings.isEmpty else { return 0 }
        let inRange = readings.filter { $0.mgdl >= low && $0.mgdl <= high }.count
        return Double(inRange) / Double(readings.count) * 100
    }

    private var avgGlucose: Double? {
        guard !readings.isEmpty else { return nil }
        return readings.map(\.mgdl).reduce(0, +) / Double(readings.count)
    }

    /// Estimated A1C from average glucose: (average mg/dL + 46.7) / 28.7
    private var estimatedA1C: Double? {
        guard let avg = avgGlucose else { return nil }
        return (avg + 46.7) / 28.7
    }

    private var lowCount: Int { readings.filter { $0.mgdl < low }.count }
    private var highCount: Int { readings.filter { $0.mgdl > high }.count }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if readings.isEmpty {
                    emptyState
                } else {
                    heroCard
                    trendChart
                    tirCard
                    statsCard
                    if readings.count >= 3 { dailyPatternChart }
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Blood Glucose")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            NavigationLink(destination: GlucosePatternView()) {
                Image(systemName: "chart.bar.xaxis")
            }
        }
        .task { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let zone = latest?.zone ?? .normal
        return VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latest Reading")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(latest.map { String(format: "%.0f", $0.mgdl) } ?? "--")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                        Text("mg/dL")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 10)
                    }
                    Text(zone.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(zone.color)
                    if let t = latest?.date {
                        Text(t.formatted(date: .omitted, time: .shortened))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 10) {
                    if let avg = avgGlucose {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f mg/dL", avg))
                                .font(.title3.bold())
                            Text("30-day avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if let a1c = estimatedA1C {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "~%.1f%%", a1c))
                                .font(.title3.bold())
                                .foregroundStyle(a1c < 5.7 ? .green : a1c < 6.5 ? .yellow : .red)
                            Text("est. A1C")
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

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            let vals = readings.map(\.mgdl)
            let minV = (vals.min() ?? 60) - 10
            let maxV = (vals.max() ?? 200) + 10

            Chart {
                // Target range band
                RectangleMark(
                    yStart: .value("Low", low),
                    yEnd: .value("High", high)
                )
                .foregroundStyle(Color.green.opacity(0.06))

                RuleMark(y: .value("Low", low))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.yellow.opacity(0.7))
                RuleMark(y: .value("High", high))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.7))

                ForEach(readings) { r in
                    PointMark(
                        x: .value("Date", r.date),
                        y: .value("mg/dL", r.mgdl)
                    )
                    .foregroundStyle(r.zone.color.opacity(0.8))
                    .symbolSize(20)
                }

                if readings.count >= 3 {
                    ForEach(Array(readings.enumerated()), id: \.offset) { _, r in
                        LineMark(
                            x: .value("Date", r.date),
                            y: .value("mg/dL", r.mgdl)
                        )
                        .foregroundStyle(.gray.opacity(0.3))
                        .interpolationMethod(.monotone)
                    }
                }
            }
            .chartYScale(domain: max(50, minV)...min(300, maxV))
            .chartYAxisLabel("mg/dL")
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

    // MARK: - Time in Range Card

    private var tirCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Time in Range")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 10) {
                // TIR bar
                GeometryReader { geo in
                    let total = Double(readings.count)
                    let inR = Double(readings.filter { $0.mgdl >= low && $0.mgdl <= high }.count)
                    let low_ = Double(lowCount)
                    let high_ = Double(highCount)
                    HStack(spacing: 2) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.blue.opacity(0.7))
                            .frame(width: geo.size.width * low_ / max(total, 1))
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.green.opacity(0.8))
                            .frame(width: geo.size.width * inR / max(total, 1))
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.orange.opacity(0.7))
                            .frame(width: geo.size.width * high_ / max(total, 1))
                    }
                }
                .frame(height: 20)

                HStack {
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2).fill(.blue.opacity(0.7)).frame(width: 12, height: 12)
                        Text("Low (\(lowCount))")
                    }
                    Spacer()
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2).fill(.green.opacity(0.8)).frame(width: 12, height: 12)
                        Text("In Range (\(readings.count - lowCount - highCount))")
                    }
                    Spacer()
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2).fill(.orange.opacity(0.7)).frame(width: 12, height: 12)
                        Text("High (\(highCount))")
                    }
                }
                .font(.caption2)
                .foregroundStyle(.secondary)

                HStack {
                    Text(String(format: "Time in range: %.0f%%", timeInRange))
                        .font(.subheadline.bold())
                        .foregroundStyle(timeInRange >= 70 ? .green : timeInRange >= 50 ? .yellow : .red)
                    Spacer()
                    Text("Target: ≥70%")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Readings", value: "\(readings.count)")
                Divider().frame(height: 40)
                statBubble(
                    label: "In Range",
                    value: String(format: "%.0f%%", timeInRange),
                    color: timeInRange >= 70 ? .green : .orange
                )
                Divider().frame(height: 40)
                if let a1c = estimatedA1C {
                    statBubble(
                        label: "Est. A1C",
                        value: String(format: "%.1f%%", a1c),
                        color: a1c < 5.7 ? .green : a1c < 6.5 ? .yellow : .red
                    )
                }
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statBubble(label: String, value: String, color: Color = .primary) -> some View {
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

    // MARK: - Daily Pattern Chart (hourly averages)

    private var dailyPatternChart: some View {
        let cal = Calendar.current
        var hourlySum: [Int: (sum: Double, count: Int)] = [:]
        for r in readings {
            let h = cal.component(.hour, from: r.date)
            let current = hourlySum[h] ?? (0, 0)
            hourlySum[h] = (current.sum + r.mgdl, current.count + 1)
        }
        let hourlyAvgs = hourlySum.sorted { $0.key < $1.key }.map { h, v in
            (hour: h, avg: v.sum / Double(v.count))
        }
        guard hourlyAvgs.count >= 3 else { return AnyView(EmptyView()) }

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Daily Pattern (Hourly Avg)")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RectangleMark(yStart: .value("Low", low), yEnd: .value("High", high))
                    .foregroundStyle(Color.green.opacity(0.06))
                RuleMark(y: .value("High", high))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.5))

                ForEach(hourlyAvgs, id: \.hour) { point in
                    LineMark(
                        x: .value("Hour", point.hour),
                        y: .value("mg/dL", point.avg)
                    )
                    .foregroundStyle(.indigo)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Hour", point.hour),
                        y: .value("mg/dL", point.avg)
                    )
                    .foregroundStyle(.indigo)
                    .symbolSize(25)
                }
            }
            .chartXAxis {
                AxisMarks(values: [0, 6, 12, 18]) { v in
                    AxisValueLabel {
                        if let h = v.as(Int.self) {
                            let ampm = h >= 12 ? "pm" : "am"
                            let disp = h == 0 ? "12am" : h > 12 ? "\(h-12)\(ampm)" : "\(h)\(ampm)"
                            Text(disp).font(.caption2)
                        }
                    }
                    AxisGridLine()
                }
            }
            .chartYAxisLabel("mg/dL")
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.indigo)
                Text("About Blood Glucose")
                    .font(.subheadline.weight(.semibold))
            }
            VStack(alignment: .leading, spacing: 4) {
                Label("Normal fasting: 70–99 mg/dL", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
                Label("Pre-diabetic: 100–125 mg/dL fasting", systemImage: "exclamationmark.triangle.fill").foregroundStyle(.yellow)
                Label("Diabetic: ≥126 mg/dL fasting", systemImage: "xmark.circle.fill").foregroundStyle(.red)
            }
            .font(.caption)
            Text("Data synced from CGM devices (Dexcom, FreeStyle Libre, Stelo) or manual entries via Apple Health. Estimated A1C = (avg + 46.7) / 28.7. Always consult your doctor for medical decisions.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "drop.fill")
                .font(.system(size: 48))
                .foregroundStyle(.red.opacity(0.6))
            Text("No Glucose Data")
                .font(.title3.bold())
            Text("Blood glucose data is synced from CGM devices (Dexcom, FreeStyle Libre, Stelo) or can be manually logged in Apple Health.")
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
        let raw = (try? await healthKit.fetchSamples(for: .bloodGlucose, from: start, to: Date())) ?? []
        readings = raw
            .map { GlucoseReading(date: $0.startDate, mgdl: $0.quantity.doubleValue(for: unit)) }
            .filter { $0.mgdl > 20 && $0.mgdl < 600 } // sanity filter
            .sorted { $0.date < $1.date }
    }
}

// MARK: - Glucose Zone

enum GlucoseZone {
    case low, normal, elevated, high, veryHigh

    var label: String {
        switch self {
        case .low: return "Low"
        case .normal: return "Normal"
        case .elevated: return "Elevated"
        case .high: return "High"
        case .veryHigh: return "Very High"
        }
    }

    var color: Color {
        switch self {
        case .low: return .blue
        case .normal: return .green
        case .elevated: return .yellow
        case .high: return .orange
        case .veryHigh: return .red
        }
    }

    static func from(mgdl: Double) -> GlucoseZone {
        if mgdl < 70 { return .low }
        if mgdl < 100 { return .normal }
        if mgdl < 140 { return .elevated }
        if mgdl < 180 { return .high }
        return .veryHigh
    }
}

#Preview {
    NavigationStack {
        BloodGlucoseView()
    }
}
