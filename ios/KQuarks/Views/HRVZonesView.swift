import SwiftUI
import Charts

// MARK: - Models

private struct ZoneDay: Identifiable {
    let id: String      // date string
    let date: Date
    let hrv: Double
    let zone: Zone
    let hadWorkout: Bool
    let rolling7: Double

    enum Zone: String {
        case green, yellow, orange

        var label: String {
            switch self {
            case .green:  return "Optimal"
            case .yellow: return "Normal"
            case .orange: return "Reduced"
            }
        }

        var color: Color {
            switch self {
            case .green:  return .green
            case .yellow: return .yellow
            case .orange: return .orange
            }
        }
    }
}

// MARK: - HRVZonesView

/// Classifies each day's HRV into personal recovery zones based on the 90-day
/// median (yellow threshold) and 75th percentile (green threshold).
struct HRVZonesView: View {
    @State private var days:      [ZoneDay] = []
    @State private var isLoading  = false

    // Computed from days
    private var baseline:          Double { percentile(days.map(\.hrv), p: 0.50) }
    private var optimalThreshold:  Double { percentile(days.map(\.hrv), p: 0.75) }

    private var greenDays:  Int { days.filter { $0.zone == .green  }.count }
    private var yellowDays: Int { days.filter { $0.zone == .yellow }.count }
    private var orangeDays: Int { days.filter { $0.zone == .orange }.count }

    private var currentZone:   ZoneDay.Zone? { days.last?.zone }
    private var currentStreak: Int {
        guard let zone = currentZone else { return 0 }
        var n = 0
        for d in days.reversed() { if d.zone == zone { n += 1 } else { break } }
        return n
    }

    private var bestGreenStreak: Int {
        var best = 0; var run = 0
        for d in days { if d.zone == .green { run += 1; best = max(best, run) } else { run = 0 } }
        return best
    }

    private var avgHrvAfterWorkout: Double? {
        let targets = days.enumerated().filter { $0.offset > 0 && days[$0.offset - 1].hadWorkout }.map(\.element.hrv)
        return targets.isEmpty ? nil : targets.reduce(0, +) / Double(targets.count)
    }

    private var avgHrvAfterRest: Double? {
        let targets = days.enumerated().filter { $0.offset > 0 && !days[$0.offset - 1].hadWorkout }.map(\.element.hrv)
        return targets.isEmpty ? nil : targets.reduce(0, +) / Double(targets.count)
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading && days.isEmpty {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 80)
            } else if days.count < 7 {
                emptyState
            } else {
                VStack(spacing: 16) {
                    introCard
                    currentZoneBanner
                    distributionCard
                    timelineCard
                    if avgHrvAfterWorkout != nil { workoutImpactCard }
                    historyStrip
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("HRV Zones")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Sub-views

    private var introCard: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Personal Recovery Zones")
                .font(.headline)
            Text("Green = top 25% of your HRV range. Orange = below your median. Zones are relative to your own data, not fixed numbers.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var currentZoneBanner: some View {
        guard let zone = currentZone else { return AnyView(EmptyView()) }
        return AnyView(
            HStack(spacing: 12) {
                Circle()
                    .fill(zone.color)
                    .frame(width: 12, height: 12)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Current Zone · \(zone.label)")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(zone.color)
                    Text("\(currentStreak) consecutive \(zone.label.lowercased()) day\(currentStreak == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if bestGreenStreak > 0 {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Best green streak")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text("\(bestGreenStreak)d")
                            .font(.subheadline.bold())
                            .foregroundStyle(.green)
                    }
                }
            }
            .padding()
            .background(zone.color.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        )
    }

    private var distributionCard: some View {
        let total = Double(days.count)
        let pctGreen  = Int((Double(greenDays)  / total * 100).rounded())
        let pctYellow = Int((Double(yellowDays) / total * 100).rounded())
        let pctOrange = Int((Double(orangeDays) / total * 100).rounded())

        return VStack(alignment: .leading, spacing: 12) {
            Text("Zone Distribution")
                .font(.headline)

            // Stacked progress bar
            GeometryReader { geo in
                HStack(spacing: 0) {
                    RoundedRectangle(cornerRadius: 0)
                        .fill(Color.green)
                        .frame(width: geo.size.width * Double(greenDays)  / total)
                    RoundedRectangle(cornerRadius: 0)
                        .fill(Color.yellow)
                        .frame(width: geo.size.width * Double(yellowDays) / total)
                    RoundedRectangle(cornerRadius: 0)
                        .fill(Color.orange)
                }
                .clipShape(RoundedRectangle(cornerRadius: 6))
            }
            .frame(height: 16)

            HStack(spacing: 0) {
                ForEach([
                    (ZoneDay.Zone.green,  pctGreen,  greenDays),
                    (ZoneDay.Zone.yellow, pctYellow, yellowDays),
                    (ZoneDay.Zone.orange, pctOrange, orangeDays),
                ], id: \.0.rawValue) { zone, pct, cnt in
                    VStack(spacing: 4) {
                        Circle().fill(zone.color).frame(width: 8, height: 8)
                        Text("\(pct)%")
                            .font(.title3.bold())
                        Text(zone.label)
                            .font(.caption)
                            .foregroundStyle(zone.color)
                        Text("\(cnt)d")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            HStack {
                Text("Baseline: \(Int(baseline.rounded())) ms")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("Optimal: \(Int(optimalThreshold.rounded())) ms")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var timelineCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("HRV Timeline")
                .font(.headline)
            Text("Bars coloured by zone · curve = 7-day rolling average")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(days) { d in
                    BarMark(
                        x: .value("Date", d.date, unit: .day),
                        y: .value("HRV", d.hrv)
                    )
                    .foregroundStyle(d.zone.color.opacity(0.75))
                }
                ForEach(days) { d in
                    LineMark(
                        x: .value("Date", d.date, unit: .day),
                        y: .value("7d avg", d.rolling7)
                    )
                    .foregroundStyle(Color.white.opacity(0.7))
                    .lineStyle(StrokeStyle(lineWidth: 1.5))
                    .interpolationMethod(.catmullRom)
                }
                RuleMark(y: .value("Optimal", optimalThreshold))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
                RuleMark(y: .value("Baseline", baseline))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.yellow.opacity(0.4))
            }
            .frame(height: 200)
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                        .font(.system(size: 9))
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { val in
                    AxisValueLabel {
                        if let v = val.as(Double.self) {
                            Text("\(Int(v))").font(.caption2)
                        }
                    }
                }
            }

            HStack(spacing: 16) {
                ForEach([ZoneDay.Zone.green, .yellow, .orange], id: \.rawValue) { zone in
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2).fill(zone.color).frame(width: 12, height: 8)
                        Text(zone.label).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var workoutImpactCard: some View {
        let aw = avgHrvAfterWorkout.map { Int($0.rounded()) }
        let ar = avgHrvAfterRest.map    { Int($0.rounded()) }

        return VStack(alignment: .leading, spacing: 10) {
            Text("Workout Impact on HRV")
                .font(.headline)
            Text("Average HRV the day after a workout vs the day after rest")
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack {
                VStack(spacing: 4) {
                    Text(aw.map { "\($0) ms" } ?? "—")
                        .font(.title2.bold())
                        .foregroundStyle(.purple)
                    Text("After workout")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                Divider().frame(height: 48)

                VStack(spacing: 4) {
                    Text(ar.map { "\($0) ms" } ?? "—")
                        .font(.title2.bold())
                    Text("After rest")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }

            if let aw = avgHrvAfterWorkout, let ar = avgHrvAfterRest {
                Text(aw >= ar
                     ? "Your HRV is higher after workout days — you recover well from training."
                     : "Your HRV dips after workout days — ensure adequate recovery between sessions.")
                    .font(.caption)
                    .foregroundStyle(aw >= ar ? .green : .orange)
                    .padding(.top, 2)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var historyStrip: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Zone History")
                .font(.headline)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 3) {
                    ForEach(days) { d in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(d.zone.color.opacity(0.8))
                            .frame(width: 14, height: 32)
                    }
                }
                .padding(.horizontal, 2)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Sync at least a week of HRV data to see your recovery zones.")
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

        guard let summaries = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 90) else { return }
        let workouts = (try? await SupabaseService.shared.fetchWorkoutRecords(days: 90)) ?? []
        let workoutDays = Set(workouts.map { Calendar.current.startOfDay(for: $0.startTime) })

        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let validRows = summaries.compactMap { r -> (date: Date, hrv: Double)? in
            guard let hrv = r.avg_hrv, hrv > 0, let date = df.date(from: r.date) else { return nil }
            return (date, hrv)
        }
        guard !validRows.isEmpty else { return }

        // Compute zone thresholds from all HRV values
        let sorted = validRows.map { $0.hrv }.sorted()
        let p50 = sorted[Int(Double(sorted.count) * 0.50)]
        let p75 = sorted[Int(Double(sorted.count) * 0.75)]

        // Build days with 7-day rolling average
        let zonedays: [ZoneDay] = validRows.enumerated().map { i, row in
            let window = validRows[max(0, i-6)...i].map { $0.hrv }
            let roll7  = window.reduce(0,+) / Double(window.count)
            let zone: ZoneDay.Zone = row.hrv >= p75 ? .green : row.hrv >= p50 ? .yellow : .orange
            let had = workoutDays.contains(Calendar.current.startOfDay(for: row.date))
            let df2 = DateFormatter(); df2.dateFormat = "yyyy-MM-dd"
            return ZoneDay(
                id: df2.string(from: row.date),
                date: row.date,
                hrv: row.hrv,
                zone: zone,
                hadWorkout: had,
                rolling7: roll7
            )
        }

        await MainActor.run { days = zonedays }
    }

    // MARK: - Helpers

    private func percentile(_ vals: [Double], p: Double) -> Double {
        guard !vals.isEmpty else { return 0 }
        let sorted = vals.sorted()
        return sorted[min(sorted.count - 1, Int((Double(sorted.count) * p).rounded()))]
    }
}

#Preview {
    NavigationStack {
        HRVZonesView()
    }
}
