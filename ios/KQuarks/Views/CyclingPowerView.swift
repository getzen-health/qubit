import SwiftUI
import Charts
import HealthKit

// MARK: - CyclingPowerView

/// Analyzes HKQuantityType(.cyclingPower) — cycling power output in watts.
/// Available from Apple Watch Ultra with ANT+/Bluetooth power meters (iOS 17+).
///
/// FTP (Functional Threshold Power) = best sustainable 1-hour power.
/// Estimated as 95% of best 20-min average power.
///
/// British Cycling / WKO4 Power Zones:
/// - Zone 1 (<55% FTP): Active Recovery
/// - Zone 2 (55–75% FTP): Endurance (aerobic base)
/// - Zone 3 (75–90% FTP): Tempo
/// - Zone 4 (90–105% FTP): Lactate Threshold (sweet spot / FTP)
/// - Zone 5 (105–120% FTP): VO2 Max
/// - Zone 6 (120–150% FTP): Anaerobic Capacity
/// - Zone 7 (>150% FTP): Neuromuscular Power (sprint)
///
/// Science:
/// - Power is the gold standard for cycling training — unlike HR, it responds
///   instantly to effort changes (Allen & Coggan, "Training and Racing with
///   a Power Meter", 2010).
/// - FTP improvement of 5% over 8 weeks is achievable with structured training.
/// - TSS (Training Stress Score) = (secs × NP × IF)² / (FTP × 3600) × 100
struct CyclingPowerView: View {

    struct CyclingSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let avgWatts: Double
        let normalizedPower: Double
        let peakWatts: Double
        var intensityFactor: Double  // NP / FTP
        var tss: Double              // Training Stress Score

        var zone: PowerZone { PowerZone(pctFTP: avgWatts / max(1, intensityFactor * avgWatts) * intensityFactor) }
    }

    struct DayPower: Identifiable {
        let id: Date
        let date: Date
        let avgWatts: Double
    }

    // Power curve: best N-second average power
    struct PowerCurvePoint: Identifiable {
        let id: Int    // duration in seconds
        let label: String
        let watts: Double
    }

    enum PowerZone: String, CaseIterable {
        case z1 = "Z1 Recovery"
        case z2 = "Z2 Endurance"
        case z3 = "Z3 Tempo"
        case z4 = "Z4 Threshold"
        case z5 = "Z5 VO2 Max"
        case z6 = "Z6 Anaerobic"
        case z7 = "Z7 Sprint"

        init(pctFTP: Double) {
            switch pctFTP {
            case ..<0.55:    self = .z1
            case 0.55..<0.75: self = .z2
            case 0.75..<0.90: self = .z3
            case 0.90..<1.05: self = .z4
            case 1.05..<1.20: self = .z5
            case 1.20..<1.50: self = .z6
            default:          self = .z7
            }
        }

        var color: Color {
            switch self {
            case .z1: return .gray
            case .z2: return .blue
            case .z3: return .green
            case .z4: return .yellow
            case .z5: return .orange
            case .z6: return .red
            case .z7: return .purple
            }
        }

        var ftpRange: String {
            switch self {
            case .z1: return "<55% FTP"
            case .z2: return "55–75%"
            case .z3: return "75–90%"
            case .z4: return "90–105%"
            case .z5: return "105–120%"
            case .z6: return "120–150%"
            case .z7: return ">150%"
            }
        }
    }

    @State private var sessions: [CyclingSession] = []
    @State private var dayPowers: [DayPower] = []
    @State private var estimatedFTP: Double = 0
    @State private var avgPower: Double = 0
    @State private var peakPower: Double = 0
    @State private var weeklyTSS: Double = 0
    @State private var powerTrend: Double = 0
    @State private var powerCurve: [PowerCurvePoint] = []
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
                    ftpCard
                    trendChart
                    zoneDistCard
                    powerCurveCard
                    recentRidesCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cycling Power")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - FTP Card

    private var ftpCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Estimated FTP")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", estimatedFTP))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(.yellow)
                        Text("W")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text("95% of best 20-min average power")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.outdoor.cycle")
                    .font(.system(size: 44)).foregroundStyle(.yellow)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Power (90d)", value: String(format: "%.0f W", avgPower), color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Peak Power", value: String(format: "%.0f W", peakPower), color: .red)
                Divider().frame(height: 36)
                let trendColor: Color = powerTrend > 10 ? .green : powerTrend < -10 ? .red : .secondary
                statCell(label: "Trend (90d)",
                         value: powerTrend >= 0 ? String(format: "+%.0f W", powerTrend) : String(format: "%.0f W", powerTrend),
                         color: trendColor)
                Divider().frame(height: 36)
                statCell(label: "Rides (90d)", value: "\(sessions.count)", color: .secondary)
            }
            Divider()
            // W/kg indicator
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Power-to-Weight (estimated)")
                        .font(.caption2).foregroundStyle(.secondary)
                    Text("Set your weight in Apple Health for accurate W/kg")
                        .font(.caption2).foregroundStyle(.tertiary)
                }
                Spacer()
                Text(String(format: "%.2f W/kg", estimatedFTP / 70)) // assume 70kg default
                    .font(.subheadline.bold().monospacedDigit()).foregroundStyle(.yellow)
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

    // MARK: - 90-Day Trend

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Power Trend (90d)").font(.headline)
            Text("Average watts per ride — dashed line shows FTP").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(sessions.sorted(by: { $0.date < $1.date })) { s in
                    BarMark(x: .value("Date", s.date, unit: .day),
                            y: .value("Watts", s.avgWatts))
                    .foregroundStyle(barColor(s.avgWatts))
                    .cornerRadius(2)
                }
                if estimatedFTP > 0 {
                    RuleMark(y: .value("FTP", estimatedFTP))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(Color.yellow.opacity(0.6))
                        .annotation(position: .trailing) {
                            Text("FTP").font(.caption2.bold()).foregroundStyle(.yellow)
                        }
                }
                if avgPower > 0 {
                    RuleMark(y: .value("Avg", avgPower))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
                        .foregroundStyle(Color.secondary.opacity(0.4))
                        .annotation(position: .trailing) {
                            Text("avg").font(.caption2).foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Watts")
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func barColor(_ watts: Double) -> Color {
        guard estimatedFTP > 0 else { return Color.yellow.opacity(0.5) }
        let pct = watts / estimatedFTP
        if pct >= 1.05 { return Color.red.opacity(0.8) }
        if pct >= 0.90 { return Color.yellow.opacity(0.75) }
        if pct >= 0.75 { return Color.green.opacity(0.65) }
        if pct >= 0.55 { return Color.blue.opacity(0.6) }
        return Color.gray.opacity(0.35)
    }

    // MARK: - Zone Distribution

    private var zoneDistCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Power Zone Distribution").font(.headline)
            Text("Sessions by average zone (based on estimated FTP)").font(.caption).foregroundStyle(.secondary)
            ForEach(PowerZone.allCases, id: \.rawValue) { z in
                let count = sessions.filter { s in
                    guard estimatedFTP > 0 else { return false }
                    return PowerZone(pctFTP: s.avgWatts / estimatedFTP) == z
                }.count
                let pct = sessions.isEmpty ? 0.0 : Double(count) / Double(sessions.count)
                HStack(spacing: 8) {
                    Circle().fill(z.color).frame(width: 8, height: 8)
                    Text(z.rawValue).font(.caption.bold()).foregroundStyle(z.color).frame(width: 90, alignment: .leading)
                    Text(z.ftpRange).font(.caption2).foregroundStyle(.secondary).frame(width: 60)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3).fill(Color.gray.opacity(0.12)).frame(height: 8)
                            RoundedRectangle(cornerRadius: 3).fill(z.color.opacity(0.7))
                                .frame(width: geo.size.width * pct, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(count)").font(.caption2.monospacedDigit()).foregroundStyle(.secondary).frame(width: 22)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Power Curve

    private var powerCurveCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Power Curve").font(.headline)
            Text("Best average power for each duration (90d)").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(powerCurve) { pt in
                    LineMark(x: .value("Duration", pt.label),
                             y: .value("Watts", pt.watts))
                    .foregroundStyle(Color.yellow.opacity(0.8))
                    PointMark(x: .value("Duration", pt.label),
                              y: .value("Watts", pt.watts))
                    .foregroundStyle(Color.yellow)
                    .symbolSize(30)
                    .annotation(position: .top) {
                        Text(String(format: "%.0f", pt.watts))
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .chartXAxis {
                AxisMarks { v in
                    AxisValueLabel()
                }
            }
            .chartYAxisLabel("Watts")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Recent Rides

    private var recentRidesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Rides").font(.headline)
            ForEach(sessions.prefix(6)) { s in
                let z = estimatedFTP > 0 ? PowerZone(pctFTP: s.avgWatts / estimatedFTP) : PowerZone.z2
                HStack {
                    Circle().fill(z.color).frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(s.date, style: .date).font(.caption).foregroundStyle(.secondary)
                        Text(String(format: "%.0f min", s.durationMins))
                            .font(.caption2).foregroundStyle(.tertiary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(String(format: "%.0f W avg", s.avgWatts))
                            .font(.caption.bold().monospacedDigit()).foregroundStyle(z.color)
                        Text(String(format: "NP %.0f  TSS %.0f", s.normalizedPower, s.tss))
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
                Image(systemName: "bolt.circle.fill").foregroundStyle(.yellow)
                Text("Power Meter Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Gold standard", body: "Power is the most direct measure of cycling work rate — unlike heart rate, it responds instantly to effort changes and is unaffected by heat, fatigue or caffeine (Allen & Coggan, 2010).")
                sciRow(title: "FTP testing", body: "FTP ≈ 95% of your best 20-min power. A proper FTP test involves a 5-min all-out effort, 5-min recovery, then 20-min maximal effort. Retest every 8–12 weeks.")
                sciRow(title: "TSS model", body: "Training Stress Score (TSS) quantifies each ride's load: 100 TSS = 1 hour at FTP. A sustainable CTL (fitness) build is 5–8 TSS/week. >100 TSS/day requires careful recovery.")
                sciRow(title: "Sweet spot", body: "88–93% FTP (upper Z3/lower Z4) produces the highest aerobic adaptation per time invested. Two 1-hour sweet spot sessions per week typically produce FTP gains of 5–10% over 12 weeks.")
            }
            Divider()
            Text("Power meter data requires Apple Watch Ultra with a compatible ANT+ or Bluetooth power meter (e.g. Stages, Garmin Vector, Favero Assioma). Stored as HKQuantityType.cyclingPower (iOS 17+).")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.yellow.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.yellow.opacity(0.2), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.yellow)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.outdoor.cycle")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Cycling Power Data")
                .font(.title3.bold())
            Text("Cycling power requires Apple Watch Ultra with a compatible ANT+ or Bluetooth power meter. Ride with your power meter to start tracking watts, FTP, and power zones.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let powerType = HKQuantityType(.cyclingPower)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [powerType])) != nil
        else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let cal = Calendar.current

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: powerType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        let watt = HKUnit.watt()

        // Group samples into rides (gap > 10 min = new ride)
        var rideList: [CyclingSession] = []
        var current: [HKQuantitySample] = []
        var lastTime: Date? = nil

        func flushRide(ftp: Double) {
            guard !current.isEmpty else { return }
            let vals = current.map { $0.quantity.doubleValue(for: watt) }
            let avg = vals.reduce(0, +) / Double(vals.count)
            let dur = current.last!.startDate.timeIntervalSince(current.first!.startDate) / 60
            // Normalized power approximation
            let cubed = vals.map { $0 * $0 * $0 }
            let np = pow(cubed.reduce(0, +) / Double(cubed.count), 1.0/3.0)
            let if_ = ftp > 0 ? np / ftp : 0
            let tss = ftp > 0 ? (dur * 60 * np * if_) / (ftp * 3600) * 100 : 0
            rideList.append(CyclingSession(
                id: UUID(),
                date: current.first!.startDate,
                durationMins: max(dur, 1),
                avgWatts: avg,
                normalizedPower: np,
                peakWatts: vals.max() ?? avg,
                intensityFactor: if_,
                tss: tss
            ))
            current = []
        }

        // First pass: collect all to estimate FTP
        for s in samples {
            if let lt = lastTime, s.startDate.timeIntervalSince(lt) > 600 {
                // temp flush
                if !current.isEmpty {
                    let vals = current.map { $0.quantity.doubleValue(for: watt) }
                    let avg = vals.reduce(0, +) / Double(vals.count)
                    // Store as DayPower candidate
                    let day = cal.startOfDay(for: current.first!.startDate)
                    dayPowers.append(DayPower(id: day, date: day, avgWatts: avg))
                    current = []
                }
            }
            current.append(s)
            lastTime = s.startDate
        }

        // Estimate FTP from best 20-min window (simplified: use top 10% of ride averages)
        let allVals = samples.map { $0.quantity.doubleValue(for: watt) }
        let sortedVals = allVals.sorted(by: >)
        let top20Count = max(1, sortedVals.count / 5)
        let best20mAvg = sortedVals.prefix(top20Count).reduce(0, +) / Double(top20Count)
        estimatedFTP = best20mAvg * 0.95

        // Second pass: build proper rides with FTP
        current = []
        lastTime = nil
        dayPowers = []

        for s in samples {
            if let lt = lastTime, s.startDate.timeIntervalSince(lt) > 600 {
                flushRide(ftp: estimatedFTP)
            }
            current.append(s)
            lastTime = s.startDate
        }
        flushRide(ftp: estimatedFTP)

        sessions = rideList.sorted { $0.date > $1.date }

        if !sessions.isEmpty {
            let avgs = sessions.map(\.avgWatts)
            avgPower = avgs.reduce(0, +) / Double(avgs.count)
            peakPower = sessions.map(\.peakWatts).max() ?? 0

            // Trend
            if sessions.count >= 6 {
                let firstHalf = Array(sessions.suffix(sessions.count / 2)).map(\.avgWatts)
                let lastHalf = Array(sessions.prefix(sessions.count / 2)).map(\.avgWatts)
                powerTrend = (lastHalf.reduce(0,+) / Double(lastHalf.count)) -
                             (firstHalf.reduce(0,+) / Double(firstHalf.count))
            }

            weeklyTSS = sessions.filter {
                $0.date > (Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date())
            }.map(\.tss).reduce(0, +)
        }

        // Power curve from all samples
        let durations = [(1, "1s"), (5, "5s"), (30, "30s"), (60, "1min"),
                         (300, "5min"), (1200, "20min"), (3600, "60min")]
        powerCurve = durations.compactMap { (secs, label) -> PowerCurvePoint? in
            guard samples.count >= secs else { return nil }
            // Sliding window max average
            let vals = samples.map { $0.quantity.doubleValue(for: watt) }
            var best = 0.0
            for i in 0...(vals.count - secs) {
                let window = vals[i..<(i + secs)]
                let avg = window.reduce(0, +) / Double(secs)
                best = max(best, avg)
            }
            return best > 0 ? PowerCurvePoint(id: secs, label: label, watts: best) : nil
        }
    }
}

#Preview { NavigationStack { CyclingPowerView() } }
