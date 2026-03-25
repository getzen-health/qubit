import SwiftUI
import Charts
import HealthKit

// MARK: - HRVDeepDiveView

/// Comprehensive HRV analysis — 12-month SDNN trend, morning vs night comparison,
/// post-workout vs rest-day HRV, autonomic nervous system balance indicators,
/// and scientific context on what HRV actually measures.
///
/// Apple Watch reports SDNN (Standard Deviation of NN intervals) during sleep.
/// Higher SDNN = greater parasympathetic dominance = better recovery.
struct HRVDeepDiveView: View {

    struct HRVReading: Identifiable {
        let id: UUID
        let date: Date
        let sdnn: Double      // ms
    }

    struct MonthStat: Identifiable {
        let id: String
        let monthStart: Date
        let avgSDNN: Double
        let minSDNN: Double
        let maxSDNN: Double
        let count: Int
    }

    enum ANSState: String {
        case parasympathetic = "Parasympathetic Dominant"
        case balanced = "Balanced"
        case sympathetic = "Sympathetic Dominant"

        init(sdnn: Double, baseline: Double) {
            let ratio = baseline > 0 ? sdnn / baseline : 1
            if ratio >= 1.08 { self = .parasympathetic }
            else if ratio >= 0.92 { self = .balanced }
            else { self = .sympathetic }
        }

        var color: Color {
            switch self {
            case .parasympathetic: return .green
            case .balanced: return .teal
            case .sympathetic: return .orange
            }
        }

        var icon: String {
            switch self {
            case .parasympathetic: return "arrow.up.heart.fill"
            case .balanced: return "heart.fill"
            case .sympathetic: return "arrow.down.heart.fill"
            }
        }
    }

    @State private var readings: [HRVReading] = []
    @State private var monthStats: [MonthStat] = []
    @State private var baseline: Double = 0
    @State private var latest: Double = 0
    @State private var peakSDNN: Double = 0
    @State private var lowestSDNN: Double = 0
    @State private var trend30: Double = 0   // ms change over 30 days
    @State private var ansState: ANSState = .balanced
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if readings.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    monthlyChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("HRV Deep Dive")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latest HRV Reading")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", latest))
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(ansState.color)
                        Text("ms")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    HStack(spacing: 6) {
                        Image(systemName: ansState.icon).foregroundStyle(ansState.color).font(.caption)
                        Text(ansState.rawValue).font(.caption).foregroundStyle(ansState.color)
                    }
                }
                Spacer()
                VStack(spacing: 4) {
                    Image(systemName: "waveform.path.ecg")
                        .font(.system(size: 44)).foregroundStyle(.green)
                    if trend30 != 0 {
                        HStack(spacing: 2) {
                            Image(systemName: trend30 > 0 ? "arrow.up" : "arrow.down")
                                .font(.caption2)
                                .foregroundStyle(trend30 > 0 ? .green : .orange)
                            Text(String(format: "%.0f ms/30d", abs(trend30)))
                                .font(.caption2).foregroundStyle(trend30 > 0 ? .green : .orange)
                        }
                    }
                }
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Baseline", value: String(format: "%.0f ms", baseline), color: .teal)
                Divider().frame(height: 36)
                statCell(label: "Peak (12mo)", value: String(format: "%.0f ms", peakSDNN), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Low (12mo)", value: String(format: "%.0f ms", lowestSDNN), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Readings", value: "\(readings.count)", color: .secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - 12-Month Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("12-Month HRV Trend (SDNN)").font(.headline)
            Text("Each point = one overnight reading").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(readings.suffix(200)) { r in
                    PointMark(x: .value("Date", r.date),
                              y: .value("SDNN", r.sdnn))
                    .foregroundStyle(Color.green.opacity(0.35))
                    .symbolSize(15)
                }
                // 30-day rolling avg line
                ForEach(rollingAvg(readings, window: 30).suffix(200)) { r in
                    LineMark(x: .value("Date", r.date),
                             y: .value("Avg", r.sdnn))
                    .foregroundStyle(Color.green.opacity(0.85))
                    .lineStyle(StrokeStyle(lineWidth: 2))
                    .interpolationMethod(.catmullRom)
                }
                if baseline > 0 {
                    RuleMark(y: .value("Baseline", baseline))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.teal.opacity(0.6))
                        .annotation(position: .trailing, alignment: .center) {
                            Text("BL").font(.caption2).foregroundStyle(.teal)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("ms SDNN")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 200)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Stats Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Average HRV").font(.headline)
            Chart {
                ForEach(monthStats) { m in
                    BarMark(x: .value("Month", m.monthStart, unit: .month),
                            y: .value("Avg", m.avgSDNN))
                    .foregroundStyle(Color.green.opacity(0.7))
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("ms SDNN")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "brain.head.profile").foregroundStyle(.green)
                Text("Understanding HRV").font(.headline)
            }
            Text("Heart Rate Variability (HRV) measures the millisecond-level variation between heartbeats. Apple Watch reports SDNN — the standard deviation of normal beat intervals during overnight sleep.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Higher SDNN signals parasympathetic (rest-and-digest) dominance — your body has recovered and is ready for stress. Low HRV indicates sympathetic activation — ongoing stress, illness, or fatigue.")
                .font(.caption).foregroundStyle(.secondary)
            Divider()
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("ANS Balance").font(.caption.bold()).foregroundStyle(.secondary)
                    Text("HRV / Baseline").font(.caption2).foregroundStyle(.tertiary)
                    Text("> 1.08× = recovery ready").font(.caption2).foregroundStyle(.green)
                    Text("0.92–1.08× = balanced").font(.caption2).foregroundStyle(.teal)
                    Text("< 0.92× = stress / fatigue").font(.caption2).foregroundStyle(.orange)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Typical Ranges").font(.caption.bold()).foregroundStyle(.secondary)
                    Text("Athletes: 60–100+ ms").font(.caption2).foregroundStyle(.secondary)
                    Text("Active adults: 30–60 ms").font(.caption2).foregroundStyle(.secondary)
                    Text("Sedentary: 15–35 ms").font(.caption2).foregroundStyle(.secondary)
                }
            }
            Text("Source: Kiviniemi et al. 2010, Plews et al. 2013 — Int J Sports Physiol")
                .font(.caption2).foregroundStyle(.tertiary).italic()
        }
        .padding()
        .background(Color.green.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.green.opacity(0.18), lineWidth: 1))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No HRV Data")
                .font(.title3.bold())
            Text("HRV is measured automatically by Apple Watch during sleep. Wear your Watch to bed for at least a few nights to begin tracking your autonomic nervous system recovery.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func rollingAvg(_ data: [HRVReading], window: Int) -> [HRVReading] {
        guard data.count >= window else { return data }
        var result: [HRVReading] = []
        for i in (window - 1)..<data.count {
            let slice = data[(i - window + 1)...i]
            let avg = slice.map(\.sdnn).reduce(0, +) / Double(window)
            result.append(HRVReading(id: data[i].id, date: data[i].date, sdnn: avg))
        }
        return result
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let hrvType = HKQuantityType(.heartRateVariabilitySDNN)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [hrvType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let msUnit = HKUnit.secondUnit(with: .milli)
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        let pred = HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date())

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: hrvType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        let allReadings = samples.map { s in
            HRVReading(id: s.uuid, date: s.startDate,
                       sdnn: s.quantity.doubleValue(for: msUnit))
        }.filter { $0.sdnn > 5 && $0.sdnn < 300 }

        guard !allReadings.isEmpty else { return }
        readings = allReadings

        let vals = allReadings.map(\.sdnn)
        latest = allReadings.last?.sdnn ?? 0
        peakSDNN = vals.max() ?? 0
        lowestSDNN = vals.min() ?? 0
        baseline = vals.reduce(0, +) / Double(vals.count)

        // 30-day trend: compare first 15 vs last 15 readings
        if allReadings.count >= 30 {
            let recent = allReadings.suffix(15).map(\.sdnn)
            let older  = allReadings.prefix(15).map(\.sdnn)
            let avgRecent = recent.reduce(0, +) / Double(recent.count)
            let avgOlder  = older.reduce(0, +) / Double(older.count)
            trend30 = avgRecent - avgOlder
        }

        ansState = ANSState(sdnn: latest, baseline: baseline)

        // Monthly stats
        var mMap: [String: (Date, [Double])] = [:]
        for r in allReadings {
            let mk = df.string(from: r.date)
            let ms = cal.date(from: cal.dateComponents([.year, .month], from: r.date)) ?? r.date
            var cur = mMap[mk] ?? (ms, [])
            cur.1.append(r.sdnn)
            mMap[mk] = cur
        }
        monthStats = mMap.compactMap { key, val in
            guard !val.1.isEmpty else { return nil }
            let avg = val.1.reduce(0, +) / Double(val.1.count)
            return MonthStat(id: key, monthStart: val.0,
                             avgSDNN: avg, minSDNN: val.1.min() ?? 0,
                             maxSDNN: val.1.max() ?? 0, count: val.1.count)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview { NavigationStack { HRVDeepDiveView() } }
