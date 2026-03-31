import SwiftUI
import Charts

// MARK: - HRVDetailView

/// Deep-dive HRV analysis: trend, personal baseline, day-of-week patterns.
struct HRVDetailView: View {
    @State private var rows: [SupabaseService.DailySummaryRow] = []
    @State private var isLoading = true

    private var validRows: [SupabaseService.DailySummaryRow] {
        rows.filter { ($0.avg_hrv ?? 0) > 0 }
    }

    private var latest: Double? { validRows.last?.avg_hrv }

    private var baseline: Double? {
        guard !validRows.isEmpty else { return nil }
        let values = validRows.compactMap(\.avg_hrv)
        return values.reduce(0, +) / Double(values.count)
    }

    private var sevenDayAvg: Double? {
        let recent = validRows.suffix(7)
        guard !recent.isEmpty else { return nil }
        return recent.compactMap(\.avg_hrv).reduce(0, +) / Double(recent.count)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if validRows.isEmpty {
                    emptyState
                } else {
                    heroCard
                    trendChart
                    dayOfWeekCard
                    sleepCorrelationCard
                    statsCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("HRV Analysis")
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            NavigationLink(destination: HRVCalendarView()) {
                Image(systemName: "calendar.badge.checkmark")
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let zone = hrvZone
        return VStack(spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latest HRV")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(latest.map { String(format: "%.0f", $0) } ?? "—")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                        Text("ms")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    Text(zone.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(zone.color)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    if let b = baseline {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f ms", b))
                                .font(.title3.bold())
                            Text("60-day avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if let s = sevenDayAvg {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f ms", s))
                                .font(.subheadline.bold())
                            Text("7-day avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            if let b = baseline, let l = latest {
                let diff = l - b
                HStack(spacing: 4) {
                    Image(systemName: diff >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                        .foregroundStyle(diff >= 0 ? .green : .red)
                    Text(String(format: "%+.0f ms vs your baseline", diff))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var hrvZone: HRVZone {
        guard let l = latest, let b = baseline else { return .normal }
        let ratio = l / b
        if ratio >= 1.15 { return .elevated }
        if ratio <= 0.85 { return .low }
        return .normal
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("60-Day Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            let df: DateFormatter = {
                let f = DateFormatter()
                f.dateFormat = "yyyy-MM-dd"
                return f
            }()

            Chart {
                if let b = baseline {
                    RuleMark(y: .value("Baseline", b))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                        .foregroundStyle(.secondary)
                        .annotation(position: .topLeading) {
                            Text("Baseline")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                }

                ForEach(validRows, id: \.date) { row in
                    if let hrv = row.avg_hrv, let date = df.date(from: row.date) {
                        LineMark(
                            x: .value("Date", date),
                            y: .value("HRV", hrv)
                        )
                        .foregroundStyle(.purple.opacity(0.6))
                        .interpolationMethod(.catmullRom)

                        AreaMark(
                            x: .value("Date", date),
                            y: .value("HRV", hrv)
                        )
                        .foregroundStyle(.purple.opacity(0.08))
                        .interpolationMethod(.catmullRom)

                        PointMark(
                            x: .value("Date", date),
                            y: .value("HRV", hrv)
                        )
                        .foregroundStyle(hrv >= (baseline ?? hrv) ? Color.green : Color.red)
                        .symbolSize(20)
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 200)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Day of Week Card

    private var dayOfWeekCard: some View {
        let byDay = computeDayOfWeekAverages()
        guard !byDay.isEmpty else { return AnyView(EmptyView()) }

        let dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        let maxVal = byDay.values.max() ?? 1

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("By Day of Week")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(0..<7, id: \.self) { dayIdx in
                    if let val = byDay[dayIdx] {
                        BarMark(
                            x: .value("Day", dayLabels[dayIdx]),
                            y: .value("HRV", val)
                        )
                        .foregroundStyle(val == byDay.values.max() ? Color.purple : Color.purple.opacity(0.5))
                        .cornerRadius(4)
                    }
                }
            }
            .chartYScale(domain: 0...(maxVal * 1.2))
            .frame(height: 140)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Sleep Correlation Card

    private var sleepCorrelationCard: some View {
        let pairs = validRows.compactMap { r -> (Double, Double)? in
            guard let hrv = r.avg_hrv, let sleep = r.sleepHours, sleep > 0 else { return nil }
            return (sleep, hrv)
        }
        guard pairs.count >= 5 else { return AnyView(EmptyView()) }

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Sleep vs HRV")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(Array(pairs.enumerated()), id: \.offset) { _, pair in
                    PointMark(
                        x: .value("Sleep (h)", pair.0),
                        y: .value("HRV (ms)", pair.1)
                    )
                    .foregroundStyle(.purple.opacity(0.6))
                }
            }
            .chartXAxis {
                AxisMarks { val in
                    AxisValueLabel { if let h = val.as(Double.self) { Text("\(Int(h))h") } }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        let values = validRows.compactMap(\.avg_hrv)
        let min = values.min() ?? 0
        let max = values.max() ?? 0

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Lowest", value: "\(Int(min)) ms")
                Divider().frame(height: 40)
                statBubble(label: "Highest", value: "\(Int(max)) ms")
                Divider().frame(height: 40)
                statBubble(label: "Range", value: "\(Int(max - min)) ms")
            }
        }
        .background(Color.premiumBackground)
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

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No HRV Data")
                .font(.title3.bold())
            Text("Apple Watch measures HRV during sleep. Sync your health data to see your analysis.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load & Helpers

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        guard let fetched = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 60) else { return }
        rows = fetched.sorted { $0.date < $1.date }
    }

    private func computeDayOfWeekAverages() -> [Int: Double] {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        var buckets: [Int: [Double]] = [:]
        for row in validRows {
            guard let hrv = row.avg_hrv,
                  let date = df.date(from: row.date) else { continue }
            let weekday = Calendar.current.component(.weekday, from: date) - 1  // 0=Sun
            buckets[weekday, default: []].append(hrv)
        }
        return buckets.mapValues { vals in vals.isEmpty ? 0 : vals.reduce(0, +) / Double(vals.count) }
    }
}

// MARK: - HRV Zone

private enum HRVZone {
    case low, normal, elevated

    var label: String {
        switch self {
        case .low: return "Below Baseline"
        case .normal: return "Near Baseline"
        case .elevated: return "Above Baseline"
        }
    }

    var color: Color {
        switch self {
        case .low: return .red
        case .normal: return .green
        case .elevated: return .purple
        }
    }
}

#Preview {
    NavigationStack {
        HRVDetailView()
    }
}
