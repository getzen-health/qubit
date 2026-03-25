import SwiftUI
import Charts
import HealthKit

// MARK: - Models

private struct ImpactSleepNight: Identifiable {
    let id = UUID()
    let date: Date
    let sleepHours: Double
    let nextDayHrv: Double?
    let nextDaySteps: Int?
    let nextDayRhr: Double?
}

private struct HourBucket: Identifiable {
    let id = UUID()
    let hours: Double
    let avgHrv: Double
    let count: Int
}

// MARK: - SleepImpactView

struct SleepImpactView: View {
    @State private var nights: [ImpactSleepNight] = []
    @State private var isLoading = true

    private var hrvScatter: [ImpactSleepNight] { nights.filter { $0.nextDayHrv != nil } }
    private var stepsScatter: [ImpactSleepNight] { nights.filter { $0.nextDaySteps != nil } }

    private var avgSleepHours: Double {
        guard !nights.isEmpty else { return 0 }
        return nights.map(\.sleepHours).reduce(0, +) / Double(nights.count)
    }

    private var optimalBuckets: [HourBucket] {
        var buckets: [Double: [Double]] = [:]
        for n in hrvScatter {
            let b = (n.sleepHours * 2).rounded() / 2  // 0.5h buckets
            if let hrv = n.nextDayHrv { buckets[b, default: []].append(hrv) }
        }
        return buckets
            .filter { $0.value.count >= 2 }
            .map { hours, vals in
                HourBucket(hours: hours, avgHrv: vals.reduce(0, +) / Double(vals.count), count: vals.count)
            }
            .sorted { $0.hours < $1.hours }
    }

    private var bestBucket: HourBucket? {
        optimalBuckets.max(by: { $0.avgHrv < $1.avgHrv })
    }

    private var hrvCorrelation: Double? {
        pearson(
            xs: hrvScatter.map(\.sleepHours),
            ys: hrvScatter.compactMap(\.nextDayHrv)
        )
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                } else if nights.isEmpty {
                    emptyState
                } else {
                    if let b = bestBucket { optimalBanner(b) }
                    summaryCards
                    if optimalBuckets.count >= 3 { optimalChart }
                    if hrvScatter.count >= 5 { hrvScatterChart }
                    if stepsScatter.count >= 5 { stepsScatterSection }
                    explanationCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Sleep Impact")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Optimal Banner

    private func optimalBanner(_ bucket: HourBucket) -> some View {
        HStack(spacing: 12) {
            Text("✨")
                .font(.title2)
            VStack(alignment: .leading, spacing: 2) {
                Text("Your HRV peaks after \(fmtHours(bucket.hours))–\(fmtHours(bucket.hours + 0.5)) of sleep")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.blue)
                Text("Avg next-day HRV: \(Int(bucket.avgHrv)) ms · based on \(bucket.count) nights")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.blue.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        let corr = hrvCorrelation
        let corrLabel: String
        let corrColor: Color
        if let r = corr {
            let abs = Swift.abs(r)
            let dir = r > 0 ? "positive" : "negative"
            if abs >= 0.5 { corrLabel = "Strong \(dir)"; corrColor = r > 0 ? .green : .red }
            else if abs >= 0.25 { corrLabel = "Moderate \(dir)"; corrColor = r > 0 ? .yellow : .orange }
            else { corrLabel = "Weak"; corrColor = .secondary }
        } else {
            corrLabel = "—"; corrColor = .secondary
        }

        return HStack(spacing: 12) {
            calCard(label: "Nights", value: "\(nights.count)", color: .primary)
            calCard(label: "Avg Sleep", value: fmtHours(avgSleepHours), color: .primary)
            calCard(label: "Sleep→HRV", value: corrLabel, color: corrColor)
        }
    }

    private func calCard(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Optimal HRV by Sleep Bucket Chart

    private var optimalChart: some View {
        let best = bestBucket
        return VStack(alignment: .leading, spacing: 8) {
            Text("Avg HRV by Sleep Duration")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(optimalBuckets) { b in
                    BarMark(
                        x: .value("Hours", String(format: "%.1fh", b.hours)),
                        y: .value("HRV", b.avgHrv)
                    )
                    .foregroundStyle(b.id == best?.id ? Color.green : Color.indigo.opacity(0.6))
                    .cornerRadius(4)
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    if let v = val.as(Double.self) {
                        AxisValueLabel { Text("\(Int(v))") }
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            if let best = best {
                Text("✅ Green = your optimal window (\(fmtHours(best.hours))–\(fmtHours(best.hours + 0.5)))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }
        }
    }

    // MARK: - HRV Scatter

    private var hrvScatterChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sleep Hours vs Next-Day HRV")
                .font(.headline)
                .padding(.horizontal, 4)

            if let r = hrvCorrelation {
                let absR = Swift.abs(r)
                let dir = r > 0 ? "positive" : "negative"
                let label = absR >= 0.5 ? "Strong \(dir)" : absR >= 0.25 ? "Moderate \(dir)" : "Weak"
                Text("\(label) correlation (r=\(String(format: "%.2f", r)))")
                    .font(.caption)
                    .foregroundStyle(r > 0 && absR >= 0.25 ? Color.green : Color.secondary)
                    .padding(.horizontal, 4)
            }

            Chart {
                RuleMark(x: .value("7h", 7))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.white.opacity(0.2))
                RuleMark(x: .value("8h", 8))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.white.opacity(0.2))

                ForEach(hrvScatter) { n in
                    if let hrv = n.nextDayHrv {
                        PointMark(
                            x: .value("Sleep", n.sleepHours),
                            y: .value("HRV", hrv)
                        )
                        .foregroundStyle(Color.indigo.opacity(0.7))
                        .symbolSize(25)
                    }
                }
            }
            .chartXAxis {
                AxisMarks { val in
                    if let v = val.as(Double.self) {
                        AxisValueLabel { Text(String(format: "%.0fh", v)) }
                    }
                }
            }
            .frame(height: 200)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Steps Scatter (compact)

    private var stepsScatterSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sleep Hours vs Next-Day Steps")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(stepsScatter) { n in
                    if let steps = n.nextDaySteps {
                        PointMark(
                            x: .value("Sleep", n.sleepHours),
                            y: .value("Steps", steps)
                        )
                        .foregroundStyle(Color.yellow.opacity(0.7))
                        .symbolSize(25)
                    }
                }
            }
            .chartXAxis {
                AxisMarks { val in
                    if let v = val.as(Double.self) {
                        AxisValueLabel { Text(String(format: "%.0fh", v)) }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    if let v = val.as(Int.self) {
                        AxisValueLabel { Text("\(v / 1000)k") }
                    }
                }
            }
            .frame(height: 150)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Explanation Card

    private var explanationCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("How to Read This")
                .font(.headline)
            VStack(alignment: .leading, spacing: 6) {
                Text("The optimal window shows which sleep duration produces your highest next-day HRV — this is YOUR personal sweet spot, not a one-size-fits-all number.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("A strong positive correlation between sleep and HRV means you should prioritize getting enough sleep before important training or performance days.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "moon.zzz.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not enough data")
                .font(.title3.bold())
            Text("Need at least a few nights of sleep data with next-day HRV readings. Sync your health data to get started.")
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
        guard let rows = try? await SupabaseService.shared.fetchAllDailySummaries(days: 90) else { return }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let sorted = rows.sorted { $0.date < $1.date }
        let byDate = Dictionary(sorted.map { ($0.date, $0) }, uniquingKeysWith: { f, _ in f })

        var result: [ImpactSleepNight] = []
        for (_, row) in sorted.enumerated() {
            guard let sleepMin = row.sleep_duration_minutes, sleepMin > 60,
                  let date = df.date(from: row.date) else { continue }

            // Next day
            let nextDate = Calendar.current.date(byAdding: .day, value: 1, to: date) ?? Date()
            let nextKey = df.string(from: nextDate)
            let nextRow = byDate[nextKey]

            result.append(ImpactSleepNight(
                date: date,
                sleepHours: Double(sleepMin) / 60,
                nextDayHrv: nextRow?.avg_hrv,
                nextDaySteps: nextRow != nil ? nextRow!.steps : nil,
                nextDayRhr: nextRow?.avg_hrv != nil ? nil : nil  // RHR not in DailySummaryRow
            ))
        }
        nights = result
    }

    // MARK: - Helpers

    private func fmtHours(_ h: Double) -> String {
        let hrs = Int(h)
        let min = Int((h - Double(hrs)) * 60)
        return min > 0 ? "\(hrs)h \(min)m" : "\(hrs)h"
    }

    private func pearson(xs: [Double], ys: [Double]) -> Double? {
        let n = xs.count
        guard n >= 5 else { return nil }
        let mx = xs.reduce(0, +) / Double(n)
        let my = ys.reduce(0, +) / Double(n)
        let num = zip(xs, ys).reduce(0.0) { $0 + ($1.0 - mx) * ($1.1 - my) }
        let denX = sqrt(xs.reduce(0.0) { $0 + ($1 - mx) * ($1 - mx) })
        let denY = sqrt(ys.reduce(0.0) { $0 + ($1 - my) * ($1 - my) })
        guard denX > 0 && denY > 0 else { return nil }
        return num / (denX * denY)
    }
}

#Preview {
    NavigationStack {
        SleepImpactView()
    }
}
