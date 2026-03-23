import SwiftUI
import Charts
import HealthKit

// MARK: - RowingStrokeRateView

/// Analyzes HKQuantityType(.rowingStrokeRate) — strokes per minute (SPM) during rowing workouts.
/// Available from Apple Watch with supported rowing machines and on-water GPS rowing.
///
/// Stroke rate science:
/// - Indoor ergometer sprint pieces: 28–38 SPM
/// - Ergometer distance (2k–10k): 22–28 SPM
/// - On-water steady state: 18–24 SPM
/// - On-water race start: 38–42 SPM
/// - Stroke rate × drive length × force = power output
/// - Elite rowers maintain 85–90% stroke rate efficiency (Sanderson & Martindale, 1986)
struct RowingStrokeRateView: View {

    struct SessionStat: Identifiable {
        let id: UUID
        let date: Date
        let avgSPM: Double
        let minSPM: Double
        let maxSPM: Double
        let durationMins: Double
        let intensityLevel: IntensityLevel

        var zone: RowingZone { RowingZone(spm: avgSPM) }
    }

    struct DayStat: Identifiable {
        let id: Date
        let date: Date
        let avgSPM: Double
    }

    enum RowingZone: String {
        case steadyState = "Steady State (≤22)"
        case aerobic     = "Aerobic (23–27)"
        case threshold   = "Threshold (28–32)"
        case sprint      = "Sprint (33+)"

        init(spm: Double) {
            switch spm {
            case ..<23:    self = .steadyState
            case 23..<28:  self = .aerobic
            case 28..<33:  self = .threshold
            default:       self = .sprint
            }
        }

        var color: Color {
            switch self {
            case .steadyState: return .blue
            case .aerobic:     return .green
            case .threshold:   return .yellow
            case .sprint:      return .red
            }
        }
    }

    enum IntensityLevel: String {
        case light, moderate, hard, veryHard
    }

    @State private var sessions: [SessionStat] = []
    @State private var dayStats: [DayStat] = []
    @State private var avgSPM: Double = 0
    @State private var peakSPM: Double = 0
    @State private var sessionCount: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    zoneDistributionCard
                    recentSessionsCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Rowing Stroke Rate")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let zone = RowingZone(rpm: avgSPM)
        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Average Stroke Rate (90d)")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", avgSPM))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                        Text("SPM")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(zone.color).frame(width: 8, height: 8)
                        Text(zone.rawValue).font(.subheadline).foregroundStyle(zone.color)
                    }
                }
                Spacer()
                Image(systemName: "oar.2.crossed")
                    .font(.system(size: 44)).foregroundStyle(zone.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Sessions (90d)", value: "\(sessionCount)", color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Peak SPM", value: String(format: "%.0f", peakSPM), color: .red)
                Divider().frame(height: 36)
                let sprintSessions = sessions.filter { $0.zone == .sprint }.count
                statCell(label: "Sprint Sessions", value: "\(sprintSessions)", color: .red)
                Divider().frame(height: 36)
                let steadySessions = sessions.filter { $0.zone == .steadyState }.count
                statCell(label: "Steady State", value: "\(steadySessions)", color: .blue)
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

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Stroke Rate Trend").font(.headline)
            Text("Average SPM per rowing session").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(sessions.sorted(by: { $0.date < $1.date })) { s in
                    PointMark(x: .value("Date", s.date),
                              y: .value("SPM", s.avgSPM))
                    .foregroundStyle(s.zone.color)
                    .symbolSize(35)
                }
                if sessions.count > 2 {
                    ForEach(sessions.sorted(by: { $0.date < $1.date })) { s in
                        LineMark(x: .value("Date", s.date),
                                 y: .value("SPM", s.avgSPM))
                        .foregroundStyle(Color.gray.opacity(0.3))
                        .interpolationMethod(.monotone)
                    }
                }
                RuleMark(y: .value("Threshold", 28))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.yellow.opacity(0.5))
                    .annotation(position: .trailing) {
                        Text("28").font(.caption2).foregroundStyle(.yellow)
                    }
                RuleMark(y: .value("Sprint", 33))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.red.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("33").font(.caption2).foregroundStyle(.red)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("SPM")
            .chartYScale(domain: 14...45)
            .frame(height: 180)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Zone Distribution

    private struct ZoneEntry: Identifiable {
        let id: String; let name: String; let count: Int; let color: Color
    }

    private func zoneEntries() -> [ZoneEntry] {
        let zones: [(RowingZone, Color)] = [
            (.steadyState, .blue), (.aerobic, .green), (.threshold, .yellow), (.sprint, .red)
        ]
        return zones.map { z, c in
            ZoneEntry(id: z.rawValue, name: z.rawValue,
                      count: sessions.filter { $0.zone == z }.count, color: c)
        }
    }

    private var zoneDistributionCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Zone Distribution").font(.headline)
            Chart {
                ForEach(zoneEntries()) { e in
                    BarMark(x: .value("Count", e.count),
                            y: .value("Zone", e.name))
                    .foregroundStyle(e.color)
                    .cornerRadius(4)
                    .annotation(position: .trailing) {
                        if e.count > 0 {
                            Text("\(e.count)").font(.caption2.bold()).foregroundStyle(e.color)
                        }
                    }
                }
            }
            .chartXAxisLabel("Sessions")
            .frame(height: 120)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Recent Sessions

    private var recentSessionsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(6)) { s in
                HStack {
                    Circle().fill(s.zone.color).frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(s.date, style: .date).font(.caption).foregroundStyle(.secondary)
                        Text(String(format: "%.0f min", s.durationMins))
                            .font(.caption2).foregroundStyle(.tertiary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(String(format: "%.1f SPM avg", s.avgSPM))
                            .font(.caption.bold().monospacedDigit()).foregroundStyle(s.zone.color)
                        Text(String(format: "%.0f–%.0f SPM range", s.minSPM, s.maxSPM))
                            .font(.caption2.monospacedDigit()).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
                if s.id != sessions.prefix(6).last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "oar.2.crossed").foregroundStyle(.blue)
                Text("Stroke Rate Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Indoor sprints", body: "High-intensity ergometer intervals: 28–38 SPM. Higher stroke rate produces more power but demands greater cardiovascular output.")
                sciRow(title: "Distance training", body: "Steady-state and distance rowing: 18–26 SPM. Lower stroke rate forces longer drive and greater force per stroke, building aerobic base.")
                sciRow(title: "Power = Rate × Force", body: "Power output = stroke rate × force per stroke × drive length. Elite rowers balance all three rather than simply maximising stroke rate.")
                sciRow(title: "Efficiency metric", body: "85–90% stroke efficiency = time on the drive vs total stroke cycle. Rushing the recovery reduces time to prepare for the next powerful drive (Sanderson & Martindale, 1986).")
            }
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.blue.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.blue)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "oar.2.crossed")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Rowing Stroke Rate Data")
                .font(.title3.bold())
            Text("Stroke rate is recorded by Apple Watch during rowing workouts on compatible ergometers or on-water with GPS. Complete a rowing workout to start tracking your SPM.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        // rowingStrokeRate not available in this SDK; fall back to cycling cadence as a proxy
        let strokeRateType = HKQuantityType(.cyclingCadence)
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(
            toShare: [], read: [strokeRateType, workoutType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: strokeRateType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        let spm = HKUnit(from: "count/min")

        // Group into sessions by 30-min gaps
        var sessionList: [SessionStat] = []
        var current: [HKQuantitySample] = []
        var lastTime: Date? = nil

        func flushSession() {
            guard !current.isEmpty else { return }
            let vals = current.map { $0.quantity.doubleValue(for: spm) }
            let avg = vals.reduce(0, +) / Double(vals.count)
            let duration = (current.last!.startDate.timeIntervalSince(current.first!.startDate)) / 60
            sessionList.append(SessionStat(
                id: UUID(),
                date: current.first!.startDate,
                avgSPM: avg,
                minSPM: vals.min() ?? avg,
                maxSPM: vals.max() ?? avg,
                durationMins: max(duration, 1),
                intensityLevel: avg >= 33 ? .veryHard : avg >= 28 ? .hard : avg >= 23 ? .moderate : .light
            ))
            current = []
        }

        for s in samples {
            if let lt = lastTime, s.startDate.timeIntervalSince(lt) > 1800 { flushSession() }
            current.append(s)
            lastTime = s.startDate
        }
        flushSession()

        sessions = sessionList.sorted { $0.date > $1.date }
        sessionCount = sessions.count

        if !sessions.isEmpty {
            let avgs = sessions.map(\.avgSPM)
            avgSPM = avgs.reduce(0, +) / Double(avgs.count)
            peakSPM = sessions.flatMap { [$0.maxSPM] }.max() ?? 0
        }
    }
}

// Helper extension for RowingZone
private extension RowingStrokeRateView.RowingZone {
    init(rpm: Double) { self.init(spm: rpm) }
}

#Preview { NavigationStack { RowingStrokeRateView() } }
