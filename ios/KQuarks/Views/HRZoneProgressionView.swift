import SwiftUI
import HealthKit
import Charts

// MARK: - HRZoneProgressionView
// Shows monthly evolution of heart rate zone distribution across all workouts.
// Distinct from HeartRateZonesView (overall) and Zone2TrainingView (Z2 only).
// Science: Seiler's 80/20 polarized training — track if Z1+Z2 is trending toward 80%.

struct HRZoneProgressionView: View {

    // MARK: - Model

    struct ZoneMinutes {
        var z1: Double = 0
        var z2: Double = 0
        var z3: Double = 0
        var z4: Double = 0
        var z5: Double = 0
        var total: Double { z1 + z2 + z3 + z4 + z5 }
        var lowPct: Double   { total > 0 ? (z1 + z2) / total * 100 : 0 }
        var highPct: Double  { total > 0 ? (z4 + z5) / total * 100 : 0 }
        var polarIndex: Double { total > 0 ? lowPct - highPct : 0 } // positive = polarized
    }

    struct MonthBucket: Identifiable {
        let id = UUID()
        let date: Date
        var zones: ZoneMinutes
        var label: String {
            let fmt = DateFormatter()
            fmt.dateFormat = "MMM"
            return fmt.string(from: date)
        }
    }

    // MARK: - Constants

    private let age: Double = 35
    private var hrmax: Double { 208 - 0.7 * age }
    private let zoneColors: [Color] = [.blue, .green, .yellow, .orange, .red]
    private let zoneNames = ["Z1", "Z2", "Z3", "Z4", "Z5"]
    private let zoneLabels = ["Z1 Recovery", "Z2 Aerobic", "Z3 Tempo", "Z4 Threshold", "Z5 VO₂ Max"]

    // MARK: - State

    @State private var months: [MonthBucket] = []
    @State private var isLoading = true
    @State private var selectedView: DisplayMode = .stacked

    private let healthStore = HKHealthStore()

    enum DisplayMode: String, CaseIterable {
        case stacked = "Volume"
        case percentage = "Share"
    }

    // MARK: - Computed

    private var latestMonth: ZoneMinutes? { months.last?.zones }
    private var firstMonth: ZoneMinutes? { months.first?.zones }

    private var overallZones: ZoneMinutes {
        months.reduce(ZoneMinutes()) { acc, m in
            var r = acc
            r.z1 += m.zones.z1; r.z2 += m.zones.z2; r.z3 += m.zones.z3
            r.z4 += m.zones.z4; r.z5 += m.zones.z5
            return r
        }
    }

    private var polarizationTrend: String {
        guard let first = firstMonth, let last = latestMonth,
              first.total > 0, last.total > 0 else { return "Insufficient data" }
        let delta = last.lowPct - first.lowPct
        if delta > 5 { return "Trending toward aerobic base ↗" }
        if delta < -5 { return "Trending toward intensity ↘" }
        return "Zone distribution stable →"
    }

    private var seilerScore: (pct: Double, label: String, color: Color) {
        let all = overallZones
        guard all.total > 0 else { return (0, "No data", .gray) }
        let low = all.lowPct
        switch low {
        case 80...:    return (low, "Polarized", .green)
        case 70..<80:  return (low, "Near ideal", .yellow)
        case 60..<70:  return (low, "Pyramidal", .orange)
        default:       return (low, "High intensity", .red)
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Summary banner
                summaryBanner

                // Seiler 80/20 card
                seilerCard

                // Display mode picker
                Picker("View", selection: $selectedView) {
                    ForEach(DisplayMode.allCases, id: \.self) { Text(LocalizedStringKey($0.rawValue)).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                // Monthly chart
                if !months.isEmpty {
                    monthlyChart
                }

                // Latest vs overall breakdown
                breakdownCard

                // Trend card
                trendCard

                // Science
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Zone Progression")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Analyzing 12 months of workouts…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var summaryBanner: some View {
        VStack(spacing: 6) {
            HStack {
                Image(systemName: "chart.bar.fill")
                    .foregroundStyle(.purple)
                Text("Heart Rate Zone Evolution")
                    .font(.headline)
                Spacer()
            }
            Text("Track how your Z1–Z5 distribution shifts month over month. Building aerobic base = more Z2 volume over time.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var seilerCard: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Polarization Score")
                    .font(.caption).foregroundStyle(.secondary)
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text(String(format: "%.0f%%", seilerScore.pct))
                        .font(.largeTitle).bold()
                    Text("low intensity")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Text(seilerScore.label)
                    .font(.caption).bold()
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(seilerScore.color.opacity(0.15))
                    .foregroundStyle(seilerScore.color)
                    .clipShape(Capsule())
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 8) {
                VStack(alignment: .trailing, spacing: 2) {
                    Text("80%").font(.title2).bold().foregroundStyle(.green)
                    Text("Seiler target").font(.caption2).foregroundStyle(.secondary)
                }
                Text(polarizationTrend)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.trailing)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var monthlyChartTitle: String {
        selectedView == .stacked ? "Zone Minutes per Month" : "Zone Share per Month"
    }

    @ViewBuilder
    private func zoneLegend() -> some View {
        HStack(spacing: 12) {
            ForEach(0..<zoneNames.count, id: \.self) { i in
                HStack(spacing: 4) {
                    Circle().fill(zoneColors[i]).frame(width: 8, height: 8)
                    Text(zoneNames[i]).font(.caption2)
                }
            }
        }
    }

    @ViewBuilder
    private func monthlyChartContent(isPct: Bool) -> some View {
        Chart {
            ForEach(months) { bucket in
                ForEach(monthlyBars(bucket: bucket, pct: isPct), id: \.zone) { bar in
                    BarMark(x: .value("Month", bucket.label), y: .value("Minutes", bar.value))
                        .foregroundStyle(zoneColors[bar.idx].gradient)
                }
            }
        }
        .chartYAxisLabel(isPct ? "%" : "Minutes")
        .frame(height: 220)
    }

    private var monthlyChart: some View {
        let isPct = selectedView == .percentage
        return VStack(alignment: .leading, spacing: 8) {
            Text(monthlyChartTitle).font(.subheadline).bold()
            zoneLegend()
            monthlyChartContent(isPct: isPct)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private struct MonthlyBar: Identifiable {
        let id = UUID()
        let zone: String
        let idx: Int
        let value: Double
    }

    private func monthlyBars(bucket: MonthBucket, pct: Bool) -> [MonthlyBar] {
        let vals = zoneValues(bucket.zones, pct: pct)
        return vals.enumerated().map { MonthlyBar(zone: zoneNames[$0.offset], idx: $0.offset, value: $0.element) }
    }

    private func zoneValues(_ z: ZoneMinutes, pct: Bool) -> [Double] {
        if pct && z.total > 0 {
            return [z.z1, z.z2, z.z3, z.z4, z.z5].map { $0 / z.total * 100 }
        }
        return [z.z1, z.z2, z.z3, z.z4, z.z5]
    }

    private var breakdownCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Overall Zone Breakdown", systemImage: "pie.chart.fill")
                .font(.subheadline).bold()

            let all = overallZones
            if all.total > 0 {
                ForEach(Array(zip(zoneLabels, zoneColors).enumerated()), id: \.offset) { (idx, pair) in
                    let (label, color) = pair
                    let mins: Double = idx == 0 ? all.z1 : idx == 1 ? all.z2 : idx == 2 ? all.z3 : idx == 3 ? all.z4 : all.z5
                    let pct = mins / all.total * 100

                    HStack(spacing: 8) {
                        Circle().fill(color).frame(width: 8, height: 8)
                        Text(label).font(.caption).frame(width: 110, alignment: .leading)
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(color.opacity(0.7))
                                .frame(width: geo.size.width * (pct / 100), height: 14)
                        }
                        .frame(height: 14)
                        Text(String(format: "%.0f%%", pct))
                            .font(.caption).foregroundStyle(.secondary)
                            .frame(width: 36, alignment: .trailing)
                        Text(String(format: "%.0fh", mins / 60))
                            .font(.caption2).foregroundStyle(.tertiary)
                    }
                }
            } else {
                Text("No workout heart rate data available")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var trendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Trends", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()

            if let first = firstMonth, let last = latestMonth,
               first.total > 0, last.total > 0 {

                trendRow(zone: "Z1+Z2 (Low)",
                         color: .blue,
                         from: first.lowPct,
                         to: last.lowPct,
                         higherIsBetter: true,
                         detail: "Aerobic base volume")

                Divider()

                trendRow(zone: "Z3 (Tempo)",
                         color: .yellow,
                         from: first.total > 0 ? first.z3 / first.total * 100 : 0,
                         to: last.total > 0 ? last.z3 / last.total * 100 : 0,
                         higherIsBetter: false,
                         detail: "Junk miles territory")

                Divider()

                trendRow(zone: "Z4+Z5 (High)",
                         color: .red,
                         from: first.highPct,
                         to: last.highPct,
                         higherIsBetter: nil,
                         detail: "Intensity/quality work")
            } else {
                Text("Need at least 2 months of data to show trends")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func trendRow(zone: String, color: Color, from: Double, to: Double,
                          higherIsBetter: Bool?, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Circle().fill(color).frame(width: 8, height: 8)
                Text(zone).font(.caption).bold()
                Spacer()
                let delta = to - from
                let sign = delta >= 0 ? "+" : ""
                let arrowColor: Color = {
                    guard let better = higherIsBetter else { return .secondary }
                    return (delta >= 0) == better ? .green : .red
                }()
                Text("\(sign)\(String(format: "%.0f", delta))%")
                    .font(.caption).bold().foregroundStyle(arrowColor)
            }
            Text(detail).font(.caption2).foregroundStyle(.secondary)
        }
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Training Science", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            scienceItem("Seiler's 80/20 Rule", detail: "Stephen Seiler (2010) studied elite endurance athletes and found ~80% of training volume in low intensity (Z1-Z2) and ~20% high intensity (Z4-Z5). Zone 3 'junk miles' provide fatigue without commensurate adaptation.")
            scienceItem("Zone 2 Training (Coggan)", detail: "Sustained Zone 2 (60-70% HRmax) builds mitochondrial density, fat oxidation efficiency, and lactate clearance — the true aerobic base.")
            scienceItem("Progressive Overload via Zone Shift", detail: "As fitness improves, the same pace shifts to lower HR zones. Tracking zone evolution reveals this adaptation — your Z2 pace gets faster over months.")
            scienceItem("Polarization vs Pyramidal", detail: "Polarized (mostly easy + some very hard) outperforms pyramidal (lots of moderate) for aerobic performance gains. High Z3 time may indicate insufficient easy recovery.")
        }
        .padding()
        .background(Color.premiumSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func scienceItem(_ title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption).bold()
            Text(detail).font(.caption2).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Data loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let workoutType = HKObjectType.workoutType()
        let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let readTypes: Set<HKObjectType> = [workoutType, hrType]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        } catch {
            isLoading = false
            return
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .month, value: -12, to: end) ?? Date()

        // 1. Fetch all workouts in the last 12 months
        let workouts = await fetchWorkouts(from: start, to: end)

        // 2. For each workout, fetch HR samples and classify into zones
        var calendar = Calendar.current
        calendar.timeZone = .current

        // Build monthly buckets
        var bucketMap: [Date: ZoneMinutes] = [:]
        var current = start
        while current <= end {
            guard let interval = calendar.dateInterval(of: .month, for: current) else { continue }
            let monthStart = calendar.startOfDay(for: interval.start)
            bucketMap[monthStart] = ZoneMinutes()
            current = calendar.date(byAdding: .month, value: 1, to: current) ?? Date()
        }

        // 3. Process workouts concurrently (batching to avoid overload)
        for workout in workouts {
            let hrSamples = await fetchHRSamples(for: workout)
            guard let workoutInterval = calendar.dateInterval(of: .month, for: workout.startDate) else { continue }
            let monthKey = calendar.startOfDay(for: workoutInterval.start)
            guard bucketMap[monthKey] != nil else { continue }

            for sample in hrSamples {
                let hr = sample.quantity.doubleValue(for: HKUnit(from: "count/min"))
                let pctMax = hr / hrmax
                let minutesFraction = sample.endDate.timeIntervalSince(sample.startDate) / 60.0

                switch pctMax {
                case ..<0.60:    bucketMap[monthKey, default: ZoneMinutes()].z1 += minutesFraction
                case 0.60..<0.70: bucketMap[monthKey, default: ZoneMinutes()].z2 += minutesFraction
                case 0.70..<0.80: bucketMap[monthKey, default: ZoneMinutes()].z3 += minutesFraction
                case 0.80..<0.90: bucketMap[monthKey, default: ZoneMinutes()].z4 += minutesFraction
                default:          bucketMap[monthKey, default: ZoneMinutes()].z5 += minutesFraction
                }
            }
        }

        let buckets = bucketMap
            .filter { $0.value.total > 0 }
            .sorted { $0.key < $1.key }
            .map { MonthBucket(date: $0.key, zones: $0.value) }

        await MainActor.run {
            months = buckets
            isLoading = false
        }
    }

    private func fetchWorkouts(from start: Date, to end: Date) async -> [HKWorkout] {
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: HKObjectType.workoutType(),
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sort]
            ) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            healthStore.execute(q)
        }
    }

    private func fetchHRSamples(for workout: HKWorkout) async -> [HKQuantitySample] {
        guard let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return [] }
        let pred = HKQuery.predicateForSamples(withStart: workout.startDate, end: workout.endDate)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: hrType,
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, _ in
                cont.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            healthStore.execute(q)
        }
    }
}
