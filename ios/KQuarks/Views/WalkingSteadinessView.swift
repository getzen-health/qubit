import SwiftUI
import Charts
import HealthKit

// MARK: - WalkingSteadinessView

/// Displays Apple Walking Steadiness — the iPhone's measure of fall risk derived from
/// gait analysis. A score below 60% indicates increased risk and warrants attention.
struct WalkingSteadinessView: View {
    @State private var samples: [HKQuantitySample] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    private var dailyReadings: [(date: Date, pct: Double)] {
        let cal = Calendar.current
        var byDay: [DateComponents: [Double]] = [:]
        for s in samples {
            let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
            byDay[key, default: []].append(s.quantity.doubleValue(for: .percent()) * 100)
        }
        return byDay.compactMap { comps, vals in
            cal.date(from: comps).map { (date: $0, pct: vals.reduce(0, +) / Double(vals.count)) }
        }.sorted { $0.date < $1.date }
    }

    private var latest: Double? { dailyReadings.last?.pct }
    private var trend30: Double? {
        guard dailyReadings.count >= 7 else { return nil }
        let recent = dailyReadings.suffix(7).map(\.pct)
        let older = dailyReadings.prefix(max(1, dailyReadings.count - 7)).map(\.pct)
        guard !older.isEmpty else { return nil }
        let recentAvg = recent.reduce(0, +) / Double(recent.count)
        let olderAvg = older.reduce(0, +) / Double(older.count)
        return recentAvg - olderAvg
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if dailyReadings.isEmpty {
                    emptyState
                } else {
                    heroCard
                    if dailyReadings.count >= 5 { trendChart }
                    dayOfWeekCard
                    classificationCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Walking Steadiness")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: WalkingSteadinessPatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let zone = SteadinessZone.from(pct: latest ?? 0)

        return VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Steadiness")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text(latest.map { String(format: "%.0f", $0) } ?? "—")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                        if latest != nil {
                            Text("%")
                                .font(.title2.bold())
                                .foregroundStyle(zone.color)
                                .padding(.bottom, 8)
                        }
                    }
                    Text(zone.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(zone.color)
                }
                Spacer()

                // Gauge
                if let pct = latest {
                    ZStack {
                        Circle()
                            .stroke(Color(.systemGray5), lineWidth: 10)
                        Circle()
                            .trim(from: 0, to: min(1, CGFloat(pct) / 100))
                            .stroke(
                                zone.color,
                                style: StrokeStyle(lineWidth: 10, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.8), value: pct)
                    }
                    .frame(width: 72, height: 72)
                }
            }

            if let trend = trend30 {
                HStack(spacing: 4) {
                    Image(systemName: trend >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                        .foregroundStyle(trend >= 0 ? .green : .orange)
                    Text(String(format: "%+.1f%% vs last week", trend))
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
            Text("60-Day Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            let values = dailyReadings.map(\.pct)
            let minV = max(0, (values.min() ?? 40) - 10)
            let maxV = min(100, (values.max() ?? 100) + 5)

            Chart {
                // Zone bands
                RuleMark(y: .value("OK threshold", 60))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.green.opacity(0.4))
                    .annotation(position: .topLeading) {
                        Text("OK ≥ 60%")
                            .font(.caption2)
                            .foregroundStyle(.green.opacity(0.7))
                    }

                RuleMark(y: .value("Low threshold", 40))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.4))
                    .annotation(position: .topLeading) {
                        Text("Low ≥ 40%")
                            .font(.caption2)
                            .foregroundStyle(.orange.opacity(0.7))
                    }

                ForEach(dailyReadings, id: \.date) { reading in
                    AreaMark(
                        x: .value("Date", reading.date),
                        y: .value("Steadiness", reading.pct)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [SteadinessZone.from(pct: reading.pct).color.opacity(0.2), .clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .interpolationMethod(.catmullRom)

                    LineMark(
                        x: .value("Date", reading.date),
                        y: .value("Steadiness", reading.pct)
                    )
                    .foregroundStyle(SteadinessZone.from(pct: reading.pct).color)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", reading.date),
                        y: .value("Steadiness", reading.pct)
                    )
                    .foregroundStyle(SteadinessZone.from(pct: reading.pct).color)
                    .symbolSize(22)
                }
            }
            .chartYScale(domain: minV...maxV)
            .chartYAxisLabel("%")
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 200)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Day of Week Card

    private var dayOfWeekCard: some View {
        let dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        let cal = Calendar.current
        var byDay: [Int: [Double]] = [:]
        for reading in dailyReadings {
            let weekday = cal.component(.weekday, from: reading.date) - 1
            byDay[weekday, default: []].append(reading.pct)
        }
        let avgByDay = byDay.mapValues { vals in vals.reduce(0, +) / Double(vals.count) }
        guard avgByDay.count >= 3 else { return AnyView(EmptyView()) }
        let maxVal = avgByDay.values.max() ?? 100

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("By Day of Week")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(0..<7, id: \.self) { dayIdx in
                    if let val = avgByDay[dayIdx] {
                        BarMark(
                            x: .value("Day", dayLabels[dayIdx]),
                            y: .value("%", val)
                        )
                        .foregroundStyle(SteadinessZone.from(pct: val).color.opacity(0.8))
                        .cornerRadius(4)
                    }
                }
            }
            .chartYScale(domain: 0...min(100, maxVal * 1.15))
            .chartYAxisLabel("%")
            .frame(height: 130)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Classification Card

    private var classificationCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Your Range")
                .font(.headline)
                .padding(.horizontal, 4)

            let values = dailyReadings.map(\.pct)
            let min = values.min() ?? 0
            let max = values.max() ?? 100
            let avg = values.reduce(0, +) / Double(values.count)

            HStack(spacing: 0) {
                statBubble(label: "Lowest", value: String(format: "%.0f%%", min), color: SteadinessZone.from(pct: min).color)
                Divider().frame(height: 40)
                statBubble(label: "Average", value: String(format: "%.0f%%", avg), color: SteadinessZone.from(pct: avg).color)
                Divider().frame(height: 40)
                statBubble(label: "Highest", value: String(format: "%.0f%%", max), color: SteadinessZone.from(pct: max).color)
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
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
        VStack(alignment: .leading, spacing: 10) {
            Text("Understanding Walking Steadiness")
                .font(.subheadline.bold())

            VStack(spacing: 6) {
                ForEach([
                    SteadinessZone.ok,
                    SteadinessZone.low,
                    SteadinessZone.veryLow,
                ], id: \.label) { zone in
                    HStack(spacing: 10) {
                        Circle()
                            .fill(zone.color)
                            .frame(width: 10, height: 10)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(zone.label)
                                .font(.caption.bold())
                                .foregroundStyle(zone.color)
                            Text(zone.description)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }

            Text("Measured automatically by your iPhone's accelerometers and gyroscopes during daily walks. Carry your iPhone in your pocket while walking for accurate readings.")
                .font(.caption2)
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
            Image(systemName: "figure.walk.motion")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Walking Steadiness Data")
                .font(.title3.bold())
            Text("iPhone measures walking steadiness automatically during walks. Carry your iPhone in your pocket while walking to record data.")
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

        let start = Calendar.current.date(byAdding: .day, value: -60, to: Date())!
        samples = (try? await healthKit.fetchSamples(for: .appleWalkingSteadiness, from: start, to: Date())) ?? []
    }
}

// MARK: - Steadiness Zone

enum SteadinessZone: CaseIterable {
    case ok, low, veryLow

    var label: String {
        switch self {
        case .ok: return "OK"
        case .low: return "Low"
        case .veryLow: return "Very Low"
        }
    }

    var description: String {
        switch self {
        case .ok: return "≥ 60% — Normal fall risk"
        case .low: return "40–59% — Increased fall risk"
        case .veryLow: return "< 40% — High fall risk, consult a clinician"
        }
    }

    var color: Color {
        switch self {
        case .ok: return .green
        case .low: return .orange
        case .veryLow: return .red
        }
    }

    static func from(pct: Double) -> SteadinessZone {
        if pct >= 60 { return .ok }
        if pct >= 40 { return .low }
        return .veryLow
    }
}

#Preview {
    NavigationStack {
        WalkingSteadinessView()
    }
}
