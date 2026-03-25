import SwiftUI
import HealthKit
import Charts

// MARK: - RunningBiomechanicsView (iOS 16+)
// Analyses Apple Watch running form metrics: ground contact time, vertical oscillation, stride length.
// Science: Morin et al. 2011 (J Exp Biol): GCT is the primary determinant of running speed.
// Folland et al. 2017 (Med Sci Sports Exerc): Short GCT (< 240ms) correlates with economy.
// Tartaruga et al. 2012 (J Strength Cond Res): Vertical oscillation > 10 cm = 15% worse economy.
// Heiderscheit 2011: Shorter strides + higher cadence reduces overstriding injury risk.
// Requires Apple Watch Series 8 or Ultra running metrics, iOS 16+.
// Distinct from RunningCadenceView (cadence only) and RunningFormView (qualitative form tips).

struct RunningBiomechanicsView: View {
    var body: some View {
        if #available(iOS 16.0, *) {
            RunningBiomechanicsContent()
        } else {
            ContentUnavailableView(
                "iOS 16 Required",
                systemImage: "applewatch",
                description: Text("Running biomechanics metrics require iOS 16.0+ and Apple Watch Series 8 or Ultra.")
            )
            .navigationTitle("Running Biomechanics")
            .toolbarTitleDisplayMode(.inline)
        }
    }
}

@available(iOS 16.0, *)
private struct RunningBiomechanicsContent: View {

    // MARK: - Models

    struct BiomechanicsPoint: Identifiable {
        let id = UUID()
        let date: Date
        let gct: Double?          // ground contact time, ms
        let vertOsc: Double?      // vertical oscillation, cm
        let strideLen: Double?    // stride length, m
        let power: Double?        // running power, W
    }

    struct MetricSummary {
        let name: String
        let avg: Double
        let unit: String
        let icon: String
        let optimal: String
        let score: Double          // 0–100 (100 = optimal)
        let color: Color
        let trend: Double?         // delta vs 4 weeks ago
    }

    // MARK: - State

    @State private var points: [BiomechanicsPoint] = []
    @State private var metrics: [MetricSummary] = []
    @State private var hasPower = false
    @State private var noData = false
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading running metrics…")
                        .padding(.top, 60)
                } else if noData {
                    ContentUnavailableView("No Biomechanics Data",
                        systemImage: "applewatch",
                        description: Text("Requires Apple Watch Series 8 or Ultra with running form metrics enabled (iOS 16+)."))
                } else {
                    metricsGrid
                    gctChart
                    vertOscChart
                    strideLenChart
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Running Biomechanics")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Cards

    private var metricsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(metrics, id: \.name) { m in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: m.icon).foregroundStyle(m.color)
                        Text(m.name).font(.caption.weight(.semibold))
                    }
                    Text(String(format: "%.1f %@", m.avg, m.unit))
                        .font(.title3.weight(.bold)).foregroundStyle(m.color)
                    Text("Optimal: \(m.optimal)").font(.caption2).foregroundStyle(.secondary)

                    // Mini gauge
                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 3)
                            .fill(m.color.opacity(0.15))
                            .overlay(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(m.color.gradient)
                                    .frame(width: geo.size.width * min(m.score / 100, 1.0))
                            }
                    }
                    .frame(height: 8)

                    if let t = m.trend {
                        HStack(spacing: 2) {
                            Image(systemName: t > 0 ? "arrow.up" : t < 0 ? "arrow.down" : "minus")
                                .font(.system(size: 9))
                            Text(String(format: "%.1f %@", abs(t), m.unit))
                        }
                        .font(.caption2)
                        .foregroundStyle(m.score >= 70 ? .green : .orange)
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(.horizontal)
    }

    private var gctChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Ground Contact Time", systemImage: "shoe.2.fill")
                .font(.subheadline).bold()
            Text("Time each foot is on the ground per step. Target: < 240ms. Lower = faster, more efficient stride.")
                .font(.caption2).foregroundStyle(.secondary)

            let gctPoints = points.compactMap { p in p.gct.map { (p.date, $0) } }
            if gctPoints.isEmpty {
                Text("No ground contact time data").font(.caption).foregroundStyle(.secondary)
            } else {
                Chart {
                    RuleMark(y: .value("Target", 240.0))
                        .foregroundStyle(Color.green.opacity(0.5))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("240ms target").font(.caption2).foregroundStyle(.green)
                        }
                    ForEach(points.filter { $0.gct != nil }) { p in
                        LineMark(x: .value("Date", p.date), y: .value("GCT", p.gct!))
                            .foregroundStyle(Color.orange.gradient).interpolationMethod(.catmullRom)
                        PointMark(x: .value("Date", p.date), y: .value("GCT", p.gct!))
                            .foregroundStyle(p.gct! < 240 ? Color.green : Color.orange)
                            .symbolSize(30)
                    }
                }
                .frame(height: 120)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var vertOscChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Vertical Oscillation", systemImage: "arrow.up.and.down.circle.fill")
                .font(.subheadline).bold()
            Text("Vertical bounce per stride. Target: < 8 cm. > 10 cm wastes energy and increases injury risk.")
                .font(.caption2).foregroundStyle(.secondary)

            if points.filter({ $0.vertOsc != nil }).isEmpty {
                Text("No vertical oscillation data").font(.caption).foregroundStyle(.secondary)
            } else {
                Chart {
                    RuleMark(y: .value("Target", 8.0))
                        .foregroundStyle(Color.green.opacity(0.5))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("8cm target").font(.caption2).foregroundStyle(.green)
                        }
                    ForEach(points.filter { $0.vertOsc != nil }) { p in
                        LineMark(x: .value("Date", p.date), y: .value("VO", p.vertOsc!))
                            .foregroundStyle(Color.blue.gradient).interpolationMethod(.catmullRom)
                        PointMark(x: .value("Date", p.date), y: .value("VO", p.vertOsc!))
                            .foregroundStyle(p.vertOsc! < 8 ? Color.green : Color.blue)
                            .symbolSize(30)
                    }
                }
                .frame(height: 120)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var strideLenChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Stride Length", systemImage: "ruler.fill")
                .font(.subheadline).bold()
            Text("Distance per stride. Varies by speed — key is consistent stride at a given pace without overstriding.")
                .font(.caption2).foregroundStyle(.secondary)

            if points.filter({ $0.strideLen != nil }).isEmpty {
                Text("No stride length data").font(.caption).foregroundStyle(.secondary)
            } else {
                Chart(points.filter { $0.strideLen != nil }) { p in
                    LineMark(x: .value("Date", p.date), y: .value("Stride", p.strideLen!))
                        .foregroundStyle(Color.purple.gradient).interpolationMethod(.catmullRom)
                    PointMark(x: .value("Date", p.date), y: .value("Stride", p.strideLen!))
                        .foregroundStyle(Color.purple)
                        .symbolSize(30)
                }
                .frame(height: 100)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Running Biomechanics Science", systemImage: "figure.run.square.stack.fill")
                .font(.subheadline).bold()
            Text("Ground contact time (GCT) is inversely related to running speed — elite runners spend < 200ms on the ground, recreational runners average 220–280ms. Morin et al. 2011 (J Exp Biol) demonstrated GCT as the primary determinant of maximal running speed.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Vertical oscillation > 10 cm indicates wasted energy moving vertically rather than horizontally. Tartaruga et al. 2012 found high oscillation associated with 15% worse running economy. Heiderscheit 2011 showed increasing step rate (cadence) reduces both GCT and vertical oscillation simultaneously.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Requires Apple Watch Series 8, Ultra, or Series 9+ with outdoor running metrics. Data is captured automatically during outdoor runs.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; noData = true; return }

        let gctType = HKQuantityType(.runningGroundContactTime)
        let voType  = HKQuantityType(.runningVerticalOscillation)
        let slType  = HKQuantityType(.runningStrideLength)
        let pwType  = HKQuantityType(.runningPower)

        let readTypes: Set<HKObjectType> = [gctType, voType, slType, pwType]
        guard (try? await healthStore.requestAuthorization(toShare: [], read: readTypes)) != nil else {
            isLoading = false; noData = true; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .day, value: -90, to: end) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        async let gctSamples = fetchSamples(type: gctType, pred: pred, sort: sort)
        async let voSamples  = fetchSamples(type: voType,  pred: pred, sort: sort)
        async let slSamples  = fetchSamples(type: slType,  pred: pred, sort: sort)
        async let pwSamples  = fetchSamples(type: pwType,  pred: pred, sort: sort)

        let (gcts, vos, sls, pws) = await (gctSamples, voSamples, slSamples, pwSamples)

        if gcts.isEmpty && vos.isEmpty && sls.isEmpty { isLoading = false; noData = true; return }

        // Group by day — take daily averages
        var byDay: [Date: (gcts: [Double], vos: [Double], sls: [Double], pws: [Double])] = [:]
        let ms = HKUnit.secondUnit(with: .milli)
        let cm = HKUnit.meterUnit(with: .centi)
        let m  = HKUnit.meter()
        let w  = HKUnit.watt()

        for s in gcts { let d = calendar.startOfDay(for: s.startDate); byDay[d, default: ([], [], [], [])].gcts.append(s.quantity.doubleValue(for: ms)) }
        for s in vos  { let d = calendar.startOfDay(for: s.startDate); byDay[d, default: ([], [], [], [])].vos.append(s.quantity.doubleValue(for: cm)) }
        for s in sls  { let d = calendar.startOfDay(for: s.startDate); byDay[d, default: ([], [], [], [])].sls.append(s.quantity.doubleValue(for: m)) }
        for s in pws  { let d = calendar.startOfDay(for: s.startDate); byDay[d, default: ([], [], [], [])].pws.append(s.quantity.doubleValue(for: w)) }

        let points = byDay.sorted { $0.key < $1.key }.map { day, data in
            BiomechanicsPoint(
                date: day,
                gct: data.gcts.isEmpty ? nil : data.gcts.reduce(0, +) / Double(data.gcts.count),
                vertOsc: data.vos.isEmpty ? nil : data.vos.reduce(0, +) / Double(data.vos.count),
                strideLen: data.sls.isEmpty ? nil : data.sls.reduce(0, +) / Double(data.sls.count),
                power: data.pws.isEmpty ? nil : data.pws.reduce(0, +) / Double(data.pws.count)
            )
        }

        let avgGCT = avg(points.compactMap(\.gct))
        let avgVO  = avg(points.compactMap(\.vertOsc))
        let avgSL  = avg(points.compactMap(\.strideLen))
        let avgPW  = avg(points.compactMap(\.power))

        var metricList: [MetricSummary] = []
        if let g = avgGCT { metricList.append(MetricSummary(name: "Ground Contact", avg: g, unit: "ms", icon: "shoe.2.fill", optimal: "< 240ms", score: max(0, min(100, (300-g)/(300-200)*100)), color: .orange, trend: trendDelta(points.compactMap(\.gct)))) }
        if let v = avgVO  { metricList.append(MetricSummary(name: "Vert Oscillation", avg: v, unit: "cm", icon: "arrow.up.arrow.down", optimal: "< 8cm", score: max(0, min(100, (12-v)/(12-6)*100)), color: .blue, trend: trendDelta(points.compactMap(\.vertOsc)))) }
        if let s = avgSL  { metricList.append(MetricSummary(name: "Stride Length", avg: s, unit: "m", icon: "ruler", optimal: "Varies by pace", score: 70, color: .purple, trend: trendDelta(points.compactMap(\.strideLen)))) }
        if let p = avgPW  { metricList.append(MetricSummary(name: "Running Power", avg: p, unit: "W", icon: "bolt.fill", optimal: "Per zones", score: 75, color: .yellow, trend: trendDelta(points.compactMap(\.power)))) }

        DispatchQueue.main.async {
            self.points = points
            self.metrics = metricList
            self.hasPower = avgPW != nil
            self.noData = points.isEmpty
            self.isLoading = false
        }
    }

    private func fetchSamples(type: HKQuantityType, pred: NSPredicate, sort: NSSortDescriptor) async -> [HKQuantitySample] {
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                cont.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            healthStore.execute(q)
        }
    }

    private func avg(_ vals: [Double]) -> Double? {
        vals.isEmpty ? nil : vals.reduce(0, +) / Double(vals.count)
    }

    private func trendDelta(_ vals: [Double]) -> Double? {
        guard vals.count >= 4 else { return nil }
        let half = vals.count / 2
        let firstAvg = vals.prefix(half).reduce(0, +) / Double(half)
        let lastAvg = vals.suffix(half).reduce(0, +) / Double(half)
        return lastAvg - firstAvg
    }
}
