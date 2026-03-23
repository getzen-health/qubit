import SwiftUI
import Charts
import HealthKit

// MARK: - AudioExposureView

/// Deep-dive into environmental audio exposure and headphone audio levels.
/// HKQuantityType(.environmentalAudioExposure) — ambient sound levels (dB).
/// HKQuantityType(.headphoneAudioExposure) — headphone output levels (dB).
///
/// WHO/NIOSH guidelines: 70 dB safe for continuous exposure; 85 dB limit for 8h;
/// 100 dB limit for 15 min. Apple Watch monitors both continuously.
struct AudioExposureView: View {

    struct DailyExposure: Identifiable {
        let id: Date
        let date: Date
        let envAvgDB: Double?
        let envPeakDB: Double?
        let headphoneAvgDB: Double?
        let headphonePeakDB: Double?
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let avgEnvDB: Double
        let avgHeadphoneDB: Double
    }

    enum ExposureRisk: String {
        case safe = "Safe"
        case moderate = "Moderate"
        case high = "High"
        case veryHigh = "Very High"

        init(db: Double) {
            switch db {
            case ..<70: self = .safe
            case 70..<80: self = .moderate
            case 80..<90: self = .high
            default: self = .veryHigh
            }
        }

        var color: Color {
            switch self {
            case .safe: return .green
            case .moderate: return .yellow
            case .high: return .orange
            case .veryHigh: return .red
            }
        }
    }

    @State private var dailyData: [DailyExposure] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var avgEnvDB: Double = 0
    @State private var peakEnvDB: Double = 0
    @State private var avgHeadphoneDB: Double = 0
    @State private var peakHeadphoneDB: Double = 0
    @State private var daysAbove85: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if dailyData.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    envChart
                    headphoneChart
                    exposureLog
                    guidelinesCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Audio Exposure")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let envRisk = ExposureRisk(db: avgEnvDB)

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("30-Day Audio Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", avgEnvDB))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(envRisk.color)
                        Text("dB avg")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(envRisk.color).frame(width: 8, height: 8)
                        Text("Environment: \(envRisk.rawValue)")
                            .font(.subheadline).foregroundStyle(envRisk.color)
                    }
                }
                Spacer()
                Image(systemName: "ear.fill")
                    .font(.system(size: 44)).foregroundStyle(envRisk.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Env Peak", value: String(format: "%.0f dB", peakEnvDB), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Headphone Avg", value: avgHeadphoneDB > 0 ? String(format: "%.0f dB", avgHeadphoneDB) : "—", color: .purple)
                Divider().frame(height: 36)
                statCell(label: "HP Peak", value: peakHeadphoneDB > 0 ? String(format: "%.0f dB", peakHeadphoneDB) : "—", color: .red)
                Divider().frame(height: 36)
                statCell(label: "Days >85 dB", value: "\(daysAbove85)", color: daysAbove85 > 5 ? .red : .secondary)
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

    // MARK: - Environmental Noise Chart

    private var envChart: some View {
        let withEnv = dailyData.filter { $0.envAvgDB != nil }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Environmental Noise (dB)").font(.headline)
            Text("Daily average — lower is better for hearing health").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(withEnv) { d in
                    if let avg = d.envAvgDB {
                        BarMark(x: .value("Date", d.date, unit: .day),
                                y: .value("dB", avg))
                        .foregroundStyle(ExposureRisk(db: avg).color.opacity(0.7))
                        .cornerRadius(2)
                    }
                }
                RuleMark(y: .value("Safe", 70))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.6))
                    .annotation(position: .leading, alignment: .center) {
                        Text("70").font(.system(size: 9)).foregroundStyle(.green)
                    }
                RuleMark(y: .value("Caution", 85))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.orange.opacity(0.6))
                    .annotation(position: .leading, alignment: .center) {
                        Text("85").font(.system(size: 9)).foregroundStyle(.orange)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("dB SPL")
            .chartYScale(domain: 50...100)
            .frame(height: 150)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Headphone Exposure Chart

    private var headphoneChart: some View {
        let withHP = dailyData.filter { $0.headphoneAvgDB != nil }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Headphone Audio Level (dB)").font(.headline)
            Chart {
                ForEach(withHP) { d in
                    if let avg = d.headphoneAvgDB {
                        LineMark(x: .value("Date", d.date),
                                 y: .value("dB", avg))
                        .foregroundStyle(Color.purple.opacity(0.6))
                        .interpolationMethod(.catmullRom)
                    }
                }
                ForEach(withHP) { d in
                    if let avg = d.headphoneAvgDB {
                        PointMark(x: .value("Date", d.date),
                                  y: .value("dB", avg))
                        .foregroundStyle(ExposureRisk(db: avg).color)
                        .symbolSize(20)
                    }
                }
                RuleMark(y: .value("Safe Limit", 75))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.6))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("dB SPL")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Exposure Log

    private var exposureLog: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Daily Log").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("Env avg").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                    Text("Peak").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HP avg").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 50, alignment: .trailing)
                    Spacer()
                    Text("Risk").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(dailyData.suffix(14).reversed()) { d in
                    let envAvg = d.envAvgDB ?? 0
                    let risk = envAvg > 0 ? ExposureRisk(db: envAvg) : ExposureRisk(db: 60)
                    Divider()
                    HStack {
                        Text(df.string(from: d.date)).font(.caption).frame(width: 65, alignment: .leading)
                        Text(d.envAvgDB.map { String(format: "%.0f dB", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(risk.color).frame(width: 55, alignment: .trailing)
                        Text(d.envPeakDB.map { String(format: "%.0f", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                        Text(d.headphoneAvgDB.map { String(format: "%.0f", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(.purple).frame(width: 50, alignment: .trailing)
                        Spacer()
                        Text(envAvg > 0 ? risk.rawValue : "—").font(.caption2.bold()).foregroundStyle(risk.color).frame(width: 55, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 7)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "ear.trianglebadge.exclamationmark").foregroundStyle(.orange)
                Text("WHO / NIOSH Guidelines").font(.headline)
            }
            VStack(alignment: .leading, spacing: 4) {
                guidelineRow(db: "<70 dB", desc: "Safe for continuous exposure (library, office)", color: .green)
                guidelineRow(db: "70–80 dB", desc: "Moderate — city traffic, restaurants", color: .yellow)
                guidelineRow(db: "80–90 dB", desc: "High — limit to 2h/day (lawnmower, busy cafe)", color: .orange)
                guidelineRow(db: ">90 dB", desc: "Very High — limit to 30 min (concerts, machinery)", color: .red)
            }
            Text("Apple Watch measures sound pressure level (SPL) via its microphone continuously. Headphone levels are monitored via Bluetooth/Lightning connection.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.2), lineWidth: 1))
    }

    private func guidelineRow(db: String, desc: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Text(db).font(.caption.bold().monospacedDigit()).foregroundStyle(color).frame(width: 65, alignment: .leading)
            Text(desc).font(.caption).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "ear.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Audio Exposure Data")
                .font(.title3.bold())
            Text("Apple Watch Series 4+ measures environmental sound levels automatically. Ensure Noise app is enabled and your Watch is running watchOS 6 or later.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let envType = HKQuantityType(.environmentalAudioExposure)
        let hpType = HKQuantityType(.headphoneAudioExposure)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [envType, hpType])) != nil else { return }

        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let dbUnit = HKUnit.decibelAWeightedSoundPressureLevel()
        let cal = Calendar.current

        // Fetch environmental audio — daily statistics
        let envDailyStats = await fetchDailyStats(type: envType, start: thirtyDaysAgo, unit: dbUnit)
        let hpDailyStats = await fetchDailyStats(type: hpType, start: thirtyDaysAgo, unit: dbUnit)

        guard !envDailyStats.isEmpty else { return }

        // Build daily data
        var envMap: [Date: (avg: Double, peak: Double)] = [:]
        for (day, stats) in envDailyStats {
            let avg = stats.averageQuantity()?.doubleValue(for: dbUnit) ?? 0
            let peak = stats.maximumQuantity()?.doubleValue(for: dbUnit) ?? 0
            if avg > 0 { envMap[day] = (avg, peak) }
        }
        var hpMap: [Date: Double] = [:]
        for (day, stats) in hpDailyStats {
            let avg = stats.averageQuantity()?.doubleValue(for: dbUnit) ?? 0
            if avg > 0 { hpMap[day] = avg }
        }

        var allDays: [DailyExposure] = []
        var d = thirtyDaysAgo
        let today = cal.startOfDay(for: Date())
        while d <= today {
            let e = envMap[d]
            allDays.append(DailyExposure(
                id: d, date: d,
                envAvgDB: e?.avg,
                envPeakDB: e?.peak,
                headphoneAvgDB: hpMap[d],
                headphonePeakDB: nil
            ))
            d = cal.date(byAdding: .day, value: 1, to: d)!
        }
        dailyData = allDays.filter { $0.envAvgDB != nil || $0.headphoneAvgDB != nil }

        let envVals = dailyData.compactMap(\.envAvgDB)
        avgEnvDB = envVals.isEmpty ? 0 : envVals.reduce(0, +) / Double(envVals.count)
        peakEnvDB = dailyData.compactMap(\.envPeakDB).max() ?? 0
        let hpVals = dailyData.compactMap(\.headphoneAvgDB)
        avgHeadphoneDB = hpVals.isEmpty ? 0 : hpVals.reduce(0, +) / Double(hpVals.count)
        peakHeadphoneDB = hpVals.max() ?? 0
        daysAbove85 = envVals.filter { $0 > 85 }.count
    }

    private func fetchDailyStats(type: HKQuantityType, start: Date, unit: HKUnit) async -> [(Date, HKStatistics)] {
        let interval = DateComponents(day: 1)
        let anchorDate = Calendar.current.startOfDay(for: start)
        let pred = HKQuery.predicateForSamples(withStart: start, end: Date())

        return await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(
                quantityType: type,
                quantitySamplePredicate: pred,
                options: [.discreteAverage, .discreteMax],
                anchorDate: anchorDate,
                intervalComponents: interval
            )
            q.initialResultsHandler = { _, results, _ in
                var out: [(Date, HKStatistics)] = []
                results?.enumerateStatistics(from: start, to: Date()) { stats, _ in
                    let dayStart = Calendar.current.startOfDay(for: stats.startDate)
                    out.append((dayStart, stats))
                }
                cont.resume(returning: out)
            }
            healthStore.execute(q)
        }
    }
}

#Preview { NavigationStack { AudioExposureView() } }
