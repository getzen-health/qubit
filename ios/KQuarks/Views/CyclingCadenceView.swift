import SwiftUI
import Charts
import HealthKit

// MARK: - CyclingCadenceView

/// Analyzes HKQuantityType(.cyclingCadence) — pedaling cadence in RPM.
/// Available from Apple Watch Ultra (with compatible power meters) and
/// iPhone with cycling accessories (iOS 17+ / watchOS 10+).
///
/// Evidence-based optimal cadence targets:
/// - Road cycling: 85–100 RPM for efficiency and reduced muscle strain
///   (Faria et al., Sports Medicine, 2005)
/// - Higher cadence (≥90 RPM) shifts load from muscle to cardiovascular
///   system, protecting against muscle fatigue on long rides
/// - Cadence <60 RPM significantly increases metabolic cost (Böning et al., 1984)
/// - Tour de France cyclists average 90–100 RPM; recreational average 60–75 RPM
struct CyclingCadenceView: View {

    struct SessionStat: Identifiable {
        let id: UUID
        let date: Date
        let workoutType: String
        let avgCadence: Double
        let minCadence: Double
        let maxCadence: Double
        let durationMins: Double

        var zone: CadenceZone { CadenceZone(rpm: avgCadence) }
    }

    struct DayAvg: Identifiable {
        let id: Date
        let date: Date
        let avgRPM: Double
        var zone: CadenceZone { CadenceZone(rpm: avgRPM) }
    }

    enum CadenceZone: String {
        case low      = "Low (<70)"
        case moderate = "Moderate (70–84)"
        case optimal  = "Optimal (85–100)"
        case high     = "High (>100)"

        init(rpm: Double) {
            switch rpm {
            case ..<70:    self = .low
            case 70..<85:  self = .moderate
            case 85...100: self = .optimal
            default:       self = .high
            }
        }

        var color: Color {
            switch self {
            case .low:      return .orange
            case .moderate: return .yellow
            case .optimal:  return .green
            case .high:     return .blue
            }
        }

        var advice: String {
            switch self {
            case .low:      return "Cadence below 70 RPM significantly increases muscular strain. Try spinning in an easier gear to elevate cadence."
            case .moderate: return "Approaching optimal range. Aim to increase cadence to 85+ RPM to improve efficiency and reduce leg fatigue."
            case .optimal:  return "Excellent cadence. This range maximises cardiovascular efficiency and minimises muscle damage per kilometre."
            case .high:     return "High cadence indicates strong aerobic base and neuromuscular efficiency — common in trained cyclists."
            }
        }
    }

    @State private var sessions: [SessionStat] = []
    @State private var dayAverages: [DayAvg] = []
    @State private var overallAvg: Double = 0
    @State private var best: Double = 0
    @State private var lowest: Double = 0
    @State private var sessionCount: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let optimalMin: Double = 85
    private let optimalMax: Double = 100

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
        .navigationTitle("Cycling Cadence")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let zone = CadenceZone(rpm: overallAvg)
        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Average Cadence (90d)")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", overallAvg))
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                        Text("RPM")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(zone.color).frame(width: 8, height: 8)
                        Text(zone.rawValue).font(.subheadline).foregroundStyle(zone.color)
                    }
                }
                Spacer()
                Image(systemName: "figure.outdoor.cycle")
                    .font(.system(size: 44)).foregroundStyle(zone.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Sessions (90d)", value: "\(sessionCount)", color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Best Session", value: String(format: "%.0f RPM", best), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Lowest Session", value: String(format: "%.0f RPM", lowest), color: .orange)
                Divider().frame(height: 36)
                let inOptimal = sessions.filter { $0.zone == .optimal }.count
                statCell(label: "In Optimal Zone",
                         value: "\(inOptimal)",
                         color: inOptimal > sessionCount / 2 ? .green : .secondary)
            }
            Divider()
            Text(zone.advice)
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
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
            Text("90-Day Cadence Trend").font(.headline)
            Text("Average RPM per cycling day").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(dayAverages) { d in
                    PointMark(x: .value("Date", d.date),
                              y: .value("RPM", d.avgRPM))
                    .foregroundStyle(d.zone.color)
                    .symbolSize(30)
                }
                if dayAverages.count > 2 {
                    ForEach(dayAverages) { d in
                        LineMark(x: .value("Date", d.date),
                                 y: .value("RPM", d.avgRPM))
                        .foregroundStyle(Color.gray.opacity(0.3))
                        .interpolationMethod(.monotone)
                    }
                }
                RuleMark(y: .value("Optimal Min", optimalMin))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("85").font(.caption2).foregroundStyle(.green)
                    }
                RuleMark(y: .value("Optimal Max", optimalMax))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("100").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("RPM")
            .chartYScale(domain: 40...130)
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
        let zones: [(CadenceZone, Color)] = [
            (.low, .orange), (.moderate, .yellow), (.optimal, .green), (.high, .blue)
        ]
        return zones.map { zone, color in
            ZoneEntry(id: zone.rawValue, name: zone.rawValue,
                      count: sessions.filter { $0.zone == zone }.count,
                      color: color)
        }
    }

    private var zoneDistributionCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Zone Distribution").font(.headline)
            Text("Sessions by cadence zone").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(zoneEntries()) { e in
                    BarMark(x: .value("Zone", e.name),
                            y: .value("Sessions", e.count))
                    .foregroundStyle(e.color)
                    .cornerRadius(4)
                    .annotation(position: .top) {
                        if e.count > 0 {
                            Text("\(e.count)").font(.caption2.bold()).foregroundStyle(e.color)
                        }
                    }
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Recent Sessions

    private var recentSessionsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(8)) { s in
                HStack {
                    Circle().fill(s.zone.color).frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(s.date, style: .date).font(.caption).foregroundStyle(.secondary)
                        Text(s.workoutType).font(.caption2).foregroundStyle(.tertiary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(String(format: "%.0f RPM avg", s.avgCadence))
                            .font(.caption.bold().monospacedDigit()).foregroundStyle(s.zone.color)
                        Text(String(format: "%.0f–%.0f RPM", s.minCadence, s.maxCadence))
                            .font(.caption2.monospacedDigit()).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
                if s.id != sessions.prefix(8).last?.id { Divider() }
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
                Image(systemName: "figure.outdoor.cycle").foregroundStyle(.green)
                Text("Cadence Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Optimal range: 85–100 RPM",
                       body: "Studies of elite and recreational cyclists consistently show metabolic efficiency peaks at 85–100 RPM (Faria et al., Sports Medicine, 2005).")
                sciRow(title: "Higher cadence = less fatigue",
                       body: "Higher cadence shifts load from slow-twitch muscles to the cardiovascular system, delaying muscle glycogen depletion and neuromuscular fatigue on long rides.")
                sciRow(title: "Low cadence consequences",
                       body: "Cadence <60 RPM increases metabolic cost by 5–10% and elevates peak knee torque, raising injury risk especially for climbers (Böning et al., 1984).")
                sciRow(title: "Tour de France benchmark",
                       body: "Professional cyclists average 90–100 RPM in races. Lance Armstrong popularised high-cadence riding (~110 RPM) to protect muscle strength for mountain stages.")
            }
            Divider()
            Text("📡 Cadence data requires Apple Watch Ultra with a compatible Bluetooth power meter, or iPhone with a cadence sensor. Data is stored as HKQuantityType.cyclingCadence (iOS 17+).")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.green.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.green.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.green)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.outdoor.cycle")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Cadence Data")
                .font(.title3.bold())
            Text("Cycling cadence requires Apple Watch Ultra with a compatible Bluetooth power meter or cadence sensor. This data is captured automatically when you record a cycling workout with compatible equipment (iOS 17+, watchOS 10+).")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let cadenceType = HKQuantityType(.cyclingCadence)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [cadenceType])) != nil
        else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!

        // Query cycling cadence samples
        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: cadenceType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        let cal = Calendar.current
        let rpm = HKUnit(from: "count/min")

        // Group by workout (using workoutUUID metadata or by date proximity)
        // Group by day for day averages
        var dayMap: [Date: [Double]] = [:]
        for s in samples {
            let day = cal.startOfDay(for: s.startDate)
            let val = s.quantity.doubleValue(for: rpm)
            dayMap[day, default: []].append(val)
        }

        dayAverages = dayMap.map { date, vals in
            DayAvg(id: date, date: date, avgRPM: vals.reduce(0, +) / Double(vals.count))
        }.sorted { $0.date < $1.date }

        // Build session stats from workout associations
        // Use workout type from HKSource or metadata; group by date proximity (30-min gap)
        var sessionList: [SessionStat] = []
        var current: [HKQuantitySample] = []
        var lastTime: Date? = nil

        for s in samples {
            if let lt = lastTime, s.startDate.timeIntervalSince(lt) > 1800 {
                // New session
                if !current.isEmpty {
                    if let stat = makeStat(from: current, rpm: rpm) {
                        sessionList.append(stat)
                    }
                    current = []
                }
            }
            current.append(s)
            lastTime = s.startDate
        }
        if !current.isEmpty, let stat = makeStat(from: current, rpm: rpm) {
            sessionList.append(stat)
        }

        sessions = sessionList.sorted { $0.date > $1.date }
        sessionCount = sessions.count

        let allAvgs = sessions.map(\.avgCadence)
        if !allAvgs.isEmpty {
            overallAvg = allAvgs.reduce(0, +) / Double(allAvgs.count)
            best = allAvgs.max() ?? 0
            lowest = allAvgs.min() ?? 0
        }
    }

    private func makeStat(from samples: [HKQuantitySample], rpm: HKUnit) -> SessionStat? {
        guard !samples.isEmpty else { return nil }
        let vals = samples.map { $0.quantity.doubleValue(for: rpm) }
        let avg = vals.reduce(0, +) / Double(vals.count)
        let duration = (samples.last?.startDate.timeIntervalSince(samples.first!.startDate) ?? 0) / 60
        return SessionStat(
            id: UUID(),
            date: samples.first!.startDate,
            workoutType: "Cycling",
            avgCadence: avg,
            minCadence: vals.min() ?? avg,
            maxCadence: vals.max() ?? avg,
            durationMins: max(duration, 1)
        )
    }
}

#Preview { NavigationStack { CyclingCadenceView() } }
