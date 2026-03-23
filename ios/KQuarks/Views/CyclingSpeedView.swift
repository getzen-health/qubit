import SwiftUI
import Charts
import HealthKit

// MARK: - CyclingSpeedView

/// Tracks cycling speed from HKQuantityType(.cyclingSpeed) — iOS 17+.
/// Measured in metres per second (m/s); converted to km/h for display.
/// Captured by iPhone GPS during outdoor rides or by compatible sensors.
///
/// Speed categories (road cycling on flat terrain):
/// - Recovery:   <20 km/h — active recovery spin, warm-up
/// - Endurance:  20–28 km/h — base aerobic / Zone 2
/// - Tempo:      28–35 km/h — comfortably hard, steady-state
/// - Race pace:  >35 km/h — criterium, TT, group ride intensity
///
/// Context: Category 4/5 amateur road cyclists average 28–33 km/h in races;
/// Tour de France stages average 40–43 km/h. Indoor speed is virtual.
struct CyclingSpeedView: View {

    struct Session: Identifiable {
        let id: UUID
        let date: Date
        let avgKMH: Double
        let maxKMH: Double
        let durationMins: Double

        var speedZone: SpeedZone { SpeedZone(kmh: avgKMH) }
    }

    enum SpeedZone: String {
        case recovery  = "Recovery"
        case endurance = "Endurance"
        case tempo     = "Tempo"
        case race      = "Race Pace"

        init(kmh: Double) {
            switch kmh {
            case ..<20:  self = .recovery
            case 20..<28: self = .endurance
            case 28..<35: self = .tempo
            default:     self = .race
            }
        }

        var color: Color {
            switch self {
            case .recovery:  return .green
            case .endurance: return .blue
            case .tempo:     return .orange
            case .race:      return .red
            }
        }

        var description: String {
            switch self {
            case .recovery:  return "Active recovery — easy spin, no training stress"
            case .endurance: return "Aerobic base — sustainable Zone 2 effort, efficient fat oxidation"
            case .tempo:     return "Comfortably hard — improves lactate threshold, sustainable ~1 hour"
            case .race:      return "High intensity — criterium or TT pace, requires significant recovery"
            }
        }
    }

    struct ZoneEntry: Identifiable {
        let id: SpeedZone
        let zone: SpeedZone
        let count: Int
        let pct: Double
    }

    @State private var sessions: [Session] = []
    @State private var latestAvgKMH: Double = 0
    @State private var avgKMH90d: Double = 0
    @State private var peakKMH: Double = 0
    @State private var trendKMH: Double = 0
    @State private var zoneData: [ZoneEntry] = []
    @State private var latestZone: SpeedZone = .endurance
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        Group {
            if #available(iOS 17.0, *) {
                content
            } else {
                unavailableState
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cycling Speed")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Content

    @available(iOS 17.0, *)
    private var content: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    zoneCard
                    referenceCard
                    scienceCard
                }
                .padding()
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latest Avg Speed").font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", latestAvgKMH))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(latestZone.color)
                        Text("km/h")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(latestZone.color).frame(width: 8, height: 8)
                        Text(latestZone.rawValue).font(.subheadline).foregroundStyle(latestZone.color)
                    }
                }
                Spacer()
                Image(systemName: "bicycle")
                    .font(.system(size: 44)).foregroundStyle(latestZone.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "90d Avg", value: String(format: "%.1f km/h", avgKMH90d), color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Peak Speed", value: String(format: "%.1f km/h", peakKMH),
                         color: SpeedZone(kmh: peakKMH).color)
                Divider().frame(height: 36)
                let trendColor: Color = trendKMH > 0.5 ? .green : trendKMH < -0.5 ? .red : .secondary
                statCell(label: "Trend (90d)",
                         value: trendKMH >= 0 ? String(format: "+%.1f km/h", trendKMH) : String(format: "%.1f km/h", trendKMH),
                         color: trendColor)
                Divider().frame(height: 36)
                statCell(label: "Sessions", value: "\(sessions.count)", color: .secondary)
            }
            Divider()
            Text(latestZone.description)
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
            Text("90-Day Speed Trend").font(.headline)
            Text("Session average speed — colored by intensity zone")
                .font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(sessions) { s in
                    BarMark(x: .value("Date", s.date),
                            y: .value("Speed", s.avgKMH))
                    .foregroundStyle(s.speedZone.color.opacity(0.8))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Endurance", 20))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.blue.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("20").font(.caption2).foregroundStyle(.blue)
                    }
                RuleMark(y: .value("Tempo", 28))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.orange.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("28").font(.caption2).foregroundStyle(.orange)
                    }
                RuleMark(y: .value("Race", 35))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.red.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("35").font(.caption2).foregroundStyle(.red)
                    }
                RuleMark(y: .value("Avg", avgKMH90d))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 3]))
                    .foregroundStyle(Color.gray.opacity(0.5))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("km/h")
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Zone Card

    private var zoneCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Speed Zone Distribution").font(.headline)
            Text("Session frequency across cycling intensity zones")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(zoneData) { entry in
                VStack(spacing: 3) {
                    HStack {
                        Circle().fill(entry.zone.color).frame(width: 8, height: 8)
                        Text(entry.zone.rawValue).font(.caption.bold()).foregroundStyle(entry.zone.color)
                        Spacer()
                        Text("\(entry.count) sessions · \(String(format: "%.0f%%", entry.pct))")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3).fill(Color(.systemFill)).frame(height: 6)
                            RoundedRectangle(cornerRadius: 3).fill(entry.zone.color)
                                .frame(width: geo.size.width * entry.pct / 100, height: 6)
                        }
                    }
                    .frame(height: 6)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Reference Card

    private var referenceCard: some View {
        let refs: [(SpeedZone, String, String)] = [
            (.recovery,  "<20 km/h",   "Easy spin — active recovery, commuter cycling"),
            (.endurance, "20–28 km/h", "Recreational group rides, base training"),
            (.tempo,     "28–35 km/h", "Competitive amateur racing, Cat 4/5 crits"),
            (.race,      ">35 km/h",   "Cat 1–3 racing, club TT, pro peloton"),
        ]
        return VStack(alignment: .leading, spacing: 10) {
            Text("Speed Reference Ranges").font(.headline)
            Text("Road cycling — flat terrain, no significant wind")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(refs, id: \.1) { zone, range, desc in
                HStack(alignment: .top, spacing: 10) {
                    HStack(spacing: 6) {
                        Circle().fill(zone.color).frame(width: 8, height: 8)
                        Text(zone.rawValue).font(.caption.bold()).foregroundStyle(zone.color)
                    }
                    .frame(width: 80, alignment: .leading)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(range).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        Text(desc).font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if latestZone == zone {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.right").font(.caption2)
                        Text(String(format: "Your latest: %.1f km/h", latestAvgKMH)).font(.caption2.bold())
                    }
                    .foregroundStyle(zone.color).padding(.leading, 18)
                }
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
                Image(systemName: "bicycle").foregroundStyle(.blue)
                Text("Cycling Speed Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Speed vs. power", body: "Speed reflects performance in context — wind, gradient, and drafting all affect it independently of fitness. Power (watts) is the training metric; speed is the outcome. Both combined give the fullest picture.")
                sciRow(title: "Speed and aerodynamics", body: "Air resistance scales with v³ — doubling speed requires 8× the power to overcome drag. At >30 km/h, ~80–85% of a cyclist's effort goes to fighting aerodynamic drag (Kyle, Cycling Sci, 1989).")
                sciRow(title: "Improvement rate", body: "Amateur cyclists improve average speed 2–4 km/h per season with structured training. The biggest gains come from Zone 2 base building and weekly tempo intervals (Jeukendrup & Martin, 2001).")
                sciRow(title: "iOS 17+ tracking", body: "Apple Watch and iPhone GPS calculate cycling speed in real-time during outdoor rides. Speed is stored as a discrete sample stream and aggregated to per-second intervals.")
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

    // MARK: - Empty / Unavailable States

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bicycle").font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Cycling Speed Data").font(.title3.bold())
            Text("Cycling speed (iOS 17+) is recorded during outdoor rides with iPhone GPS or Apple Watch. Start an Outdoor Cycling workout to begin tracking speed data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    private var unavailableState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bicycle").font(.system(size: 52)).foregroundStyle(.secondary)
            Text("Requires iOS 17+").font(.title3.bold())
            Text("Cycling speed tracking requires iOS 17 or later.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        guard #available(iOS 17.0, *) else { return }
        isLoading = true
        defer { isLoading = false }

        let speedType = HKQuantityType(.cyclingSpeed)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [speedType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let mps = HKUnit.meter().unitDivided(by: .second())

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: speedType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        // Group into sessions by 30-min gaps
        var sessionSamples: [[HKQuantitySample]] = []
        var current: [HKQuantitySample] = []
        var lastTime = samples[0].startDate

        func flush() {
            if !current.isEmpty { sessionSamples.append(current); current = [] }
        }

        for s in samples {
            if s.startDate.timeIntervalSince(lastTime) > 1800 { flush() }
            current.append(s)
            lastTime = s.endDate
        }
        flush()

        sessions = sessionSamples.compactMap { group -> Session? in
            guard !group.isEmpty else { return nil }
            let vals = group.map { $0.quantity.doubleValue(for: mps) * 3.6 } // m/s → km/h
            let avg = vals.reduce(0,+) / Double(vals.count)
            guard avg > 1 else { return nil }
            let dur = group.last!.endDate.timeIntervalSince(group.first!.startDate) / 60
            return Session(id: UUID(), date: group.first!.startDate,
                           avgKMH: avg, maxKMH: vals.max() ?? avg, durationMins: dur)
        }

        guard !sessions.isEmpty else { return }

        let avgs = sessions.map(\.avgKMH)
        latestAvgKMH = avgs.last ?? 0
        avgKMH90d = avgs.reduce(0,+) / Double(avgs.count)
        peakKMH = sessions.map(\.maxKMH).max() ?? 0
        latestZone = SpeedZone(kmh: latestAvgKMH)

        if avgs.count >= 4 {
            let half = avgs.count / 2
            let first = Array(avgs.prefix(half)).reduce(0,+) / Double(half)
            let last = Array(avgs.suffix(half)).reduce(0,+) / Double(half)
            trendKMH = last - first
        }

        let zones: [SpeedZone] = [.recovery, .endurance, .tempo, .race]
        zoneData = zones.map { z in
            let count = sessions.filter { $0.speedZone == z }.count
            let pct = Double(count) / Double(sessions.count) * 100
            return ZoneEntry(id: z, zone: z, count: count, pct: pct)
        }.filter { $0.count > 0 }
    }
}

#Preview { NavigationStack { CyclingSpeedView() } }
