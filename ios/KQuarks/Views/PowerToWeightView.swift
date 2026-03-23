import SwiftUI
import HealthKit
import Charts

// MARK: - PowerToWeightView
// Tracks cycling W/kg ratio from Apple Watch FTP estimates + body mass.
// iOS 17+ required for HKQuantityType(.cyclingFunctionalThresholdPower).
// Cycling classification: British Cycling / TrainingPeaks W/kg tiers.

@available(iOS 17.0, *)
private struct PowerToWeightContent: View {

    // MARK: - Model

    struct DataPoint: Identifiable {
        let id = UUID()
        let date: Date
        let ftpWatts: Double?
        let massKg: Double?
        var wPerKg: Double? {
            guard let w = ftpWatts, let kg = massKg, kg > 0 else { return nil }
            return w / kg
        }
    }

    // MARK: - Classification

    struct WKgTier {
        let label: String
        let min: Double
        let max: Double
        let color: Color
        let description: String
    }

    private let tiers: [WKgTier] = [
        WKgTier(label: "Pro",          min: 6.0,  max: 9.0,  color: .yellow,  description: "WorldTour professional level"),
        WKgTier(label: "Elite",        min: 5.0,  max: 6.0,  color: .red,     description: "Category 1-2 racer / elite amateur"),
        WKgTier(label: "Highly Trained", min: 4.0, max: 5.0, color: .orange,  description: "Serious club racer / age group competitor"),
        WKgTier(label: "Trained",      min: 3.0,  max: 4.0,  color: .blue,    description: "Regular competitive cyclist"),
        WKgTier(label: "Recreational", min: 2.0,  max: 3.0,  color: .green,   description: "Regular fitness cyclist"),
        WKgTier(label: "Beginner",     min: 1.0,  max: 2.0,  color: .teal,    description: "New to structured training"),
        WKgTier(label: "Untrained",    min: 0,    max: 1.0,  color: .gray,    description: "Minimal cycling fitness"),
    ]

    // MARK: - State

    @State private var points: [DataPoint] = []
    @State private var latestFTP: Double?
    @State private var latestMass: Double?
    @State private var isLoading = true
    @State private var hypotheticalMass: Double = 75

    private let healthStore = HKHealthStore()

    // MARK: - Computed

    private var latestWKg: Double? {
        guard let w = latestFTP, let kg = latestMass, kg > 0 else { return nil }
        return w / kg
    }

    private var currentTier: WKgTier? {
        guard let ratio = latestWKg else { return nil }
        return tiers.first { ratio >= $0.min && ratio < $0.max }
    }

    private var hypotheticalWKg: Double? {
        guard let w = latestFTP, hypotheticalMass > 0 else { return nil }
        return w / hypotheticalMass
    }

    private var trendSlope: Double? {
        let pts = points.compactMap { p -> (x: Double, y: Double)? in
            guard let r = p.wPerKg else { return nil }
            return (x: p.date.timeIntervalSince1970, y: r)
        }
        guard pts.count >= 3 else { return nil }
        let n = Double(pts.count)
        let sumX = pts.map(\.x).reduce(0, +)
        let sumY = pts.map(\.y).reduce(0, +)
        let sumXY = pts.map { $0.x * $0.y }.reduce(0, +)
        let sumX2 = pts.map { $0.x * $0.x }.reduce(0, +)
        let denom = n * sumX2 - sumX * sumX
        guard denom != 0 else { return nil }
        let slopePerSec = (n * sumXY - sumX * sumY) / denom
        return slopePerSec * 86400 * 30  // per month
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Hero card
                heroCard

                // W/kg trend chart
                if !points.isEmpty {
                    trendChart
                }

                // Classification ladder
                classificationCard

                // Weight simulator
                weightSimulatorCard

                // Science
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Power-to-Weight")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Loading FTP & weight data…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var heroCard: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Current W/kg").font(.caption).foregroundStyle(.secondary)
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text(latestWKg.map { String(format: "%.2f", $0) } ?? "—")
                        .font(.largeTitle).bold()
                    Text("W/kg").font(.subheadline).foregroundStyle(.secondary)
                }
                if let tier = currentTier {
                    Text(tier.label)
                        .font(.caption).bold()
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(tier.color.opacity(0.15))
                        .foregroundStyle(tier.color)
                        .clipShape(Capsule())
                }
                if let slope = trendSlope {
                    let sign = slope >= 0 ? "+" : ""
                    Text("\(sign)\(String(format: "%.3f", slope)) W/kg/month")
                        .font(.caption2).foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 10) {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(latestFTP.map { String(format: "%.0f W", $0) } ?? "—")
                        .font(.title2).bold()
                    Text("FTP").font(.caption).foregroundStyle(.secondary)
                }
                VStack(alignment: .trailing, spacing: 2) {
                    Text(latestMass.map { String(format: "%.1f kg", $0) } ?? "—")
                        .font(.title2).bold()
                    Text("Body mass").font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("W/kg — 12 Month Trend", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()

            Chart {
                if let tier = currentTier {
                    RectangleMark(
                        xStart: .value("", points.first?.date ?? Date()),
                        xEnd:   .value("", points.last?.date  ?? Date()),
                        yStart: .value("", tier.min),
                        yEnd:   .value("", tier.max)
                    )
                    .foregroundStyle(tier.color.opacity(0.08))
                }

                ForEach(points.compactMap { p -> (date: Date, ratio: Double)? in
                    guard let r = p.wPerKg else { return nil }
                    return (p.date, r)
                }, id: \.date) { pt in
                    LineMark(x: .value("Date", pt.date), y: .value("W/kg", pt.ratio))
                        .foregroundStyle(.blue)
                        .interpolationMethod(.catmullRom)
                    AreaMark(x: .value("Date", pt.date), y: .value("W/kg", pt.ratio))
                        .foregroundStyle(.blue.opacity(0.12))
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Date", pt.date), y: .value("W/kg", pt.ratio))
                        .foregroundStyle(.blue)
                        .symbolSize(25)
                }
            }
            .frame(height: 180)
            .chartXAxis { AxisMarks(values: .stride(by: .month)) { _ in
                AxisValueLabel(format: .dateTime.month(.abbreviated))
            }}
            .chartYAxisLabel("W/kg")
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var classificationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("British Cycling W/kg Tiers", systemImage: "list.star")
                .font(.subheadline).bold()

            let currentRatio = latestWKg ?? 0

            ForEach(tiers.reversed(), id: \.label) { tier in
                let isCurrentTier = currentRatio >= tier.min && currentRatio < tier.max
                HStack(spacing: 8) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(tier.color)
                        .frame(width: 4, height: 36)
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(tier.label).font(.caption).bold()
                            if isCurrentTier {
                                Image(systemName: "location.fill")
                                    .font(.caption2)
                                    .foregroundStyle(tier.color)
                            }
                        }
                        Text("\(String(format: "%.0f", tier.min))–\(tier.max < 9 ? String(format: "%.0f", tier.max) : "∞") W/kg")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    if isCurrentTier {
                        let progress = tier.max - tier.min > 0 ? (currentRatio - tier.min) / (tier.max - tier.min) : 0
                        Text(String(format: "%.0f%%", progress * 100))
                            .font(.caption2).foregroundStyle(tier.color)
                    }
                }
                .padding(.vertical, 4)
                .background(isCurrentTier ? tier.color.opacity(0.06) : .clear)
                .clipShape(RoundedRectangle(cornerRadius: 6))
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var weightSimulatorCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weight Impact Simulator", systemImage: "scalemass.fill")
                .font(.subheadline).bold()

            Text("How does body mass change your W/kg ratio at current FTP?")
                .font(.caption).foregroundStyle(.secondary)

            if latestFTP != nil, let currentKg = latestMass {
                HStack {
                    Text(String(format: "%.1f kg", hypotheticalMass))
                        .font(.subheadline).bold()
                        .frame(width: 70)
                    Slider(value: $hypotheticalMass, in: max(40, currentKg - 15)...min(150, currentKg + 15), step: 0.5)
                    if let hyp = hypotheticalWKg {
                        Text(String(format: "%.2f", hyp))
                            .font(.subheadline).bold()
                            .foregroundStyle(hyp >= (latestWKg ?? 0) ? .green : .red)
                            .frame(width: 55)
                    }
                }

                let delta = (hypotheticalWKg ?? 0) - (latestWKg ?? 0)
                let deltaKg = hypotheticalMass - currentKg

                HStack {
                    let kgSign = deltaKg >= 0 ? "+" : ""
                    Text("\(kgSign)\(String(format: "%.1f", deltaKg)) kg → \(delta >= 0 ? "+" : "")\(String(format: "%.2f", delta)) W/kg")
                        .font(.caption)
                        .foregroundStyle(delta >= 0 ? .green : .red)
                    Spacer()
                    if let hyp = hypotheticalWKg,
                       let tier = tiers.first(where: { hyp >= $0.min && hyp < $0.max }) {
                        Text(tier.label)
                            .font(.caption2).bold()
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(tier.color.opacity(0.15))
                            .foregroundStyle(tier.color)
                            .clipShape(Capsule())
                    }
                }
                .padding(.top, 4)

                Text("Note: FTP also increases with training — weight loss alone rarely improves performance without maintained or improved power.")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Text("No FTP or body mass data available. Wear Apple Watch during cycling workouts to generate FTP estimates.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("The Science of W/kg", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            scienceItem("Why W/kg matters",
                        detail: "On climbs and accelerations, power output per unit mass determines performance. A lighter rider with the same FTP outraces a heavier one on any gradient >3%.")
            scienceItem("Apple Watch FTP (iOS 17+)",
                        detail: "Apple Watch Series 9 / Ultra 2 estimates Functional Threshold Power from outdoor cycling workouts. It updates automatically when a new FTP is detected — no manual testing required.")
            scienceItem("Training vs Weight Loss",
                        detail: "Increasing FTP by 10W (training) is physiologically equivalent to losing ~2kg at equal weight. Sustainable performance comes from both — but prioritize FTP training over extreme restriction.")
            scienceItem("Seasonal variation",
                        detail: "FTP typically peaks mid-season and drops 10-15% in off-season. W/kg fluctuates with training block and body composition changes. Track both metrics independently.")
        }
        .padding()
        .background(Color(.tertiarySystemBackground))
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

        guard let ftpType   = HKQuantityType.quantityType(forIdentifier: .cyclingFunctionalThresholdPower),
              let massType  = HKQuantityType.quantityType(forIdentifier: .bodyMass) else {
            isLoading = false; return
        }

        let readTypes: Set<HKObjectType> = [ftpType, massType]
        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        } catch {
            isLoading = false; return
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .month, value: -12, to: end) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sortAsc = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let sortDesc = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        async let ftpSamples  = fetchSamples(type: ftpType,  pred: pred, sort: sortAsc)
        async let massSamples = fetchSamples(type: massType, pred: pred, sort: sortAsc)
        async let latestMassS = fetchSamples(type: massType, pred: nil,  sort: sortDesc, limit: 1)
        async let latestFTPS  = fetchSamples(type: ftpType,  pred: nil,  sort: sortDesc, limit: 1)

        let (ftpAll, massAll, latestMassArr, latestFTPArr) = await (ftpSamples, massSamples, latestMassS, latestFTPS)

        // Build monthly points — pair FTP with nearest mass reading
        var calendar = Calendar.current
        calendar.timeZone = .current

        var monthPoints: [DataPoint] = []
        var currentDate = start
        while currentDate <= end {
            let monthEnd = calendar.date(byAdding: .month, value: 1, to: currentDate) ?? Date()
            let monthFTP  = ftpAll.filter  { $0.startDate >= currentDate && $0.startDate < monthEnd }.last
            let monthMass = massAll.filter { $0.startDate >= currentDate && $0.startDate < monthEnd }.last

            if monthFTP != nil || monthMass != nil {
                monthPoints.append(DataPoint(
                    date: monthFTP?.startDate ?? monthMass?.startDate ?? currentDate,
                    ftpWatts: monthFTP?.quantity.doubleValue(for: .watt()),
                    massKg: monthMass?.quantity.doubleValue(for: .gramUnit(with: .kilo))
                ))
            }
            currentDate = monthEnd
        }

        // Fill forward mass / FTP for months that have one but not the other
        var lastFTP: Double?
        var lastMass: Double?
        var filled: [DataPoint] = []
        for var pt in monthPoints {
            if pt.ftpWatts != nil  { lastFTP  = pt.ftpWatts  }
            if pt.massKg != nil    { lastMass = pt.massKg    }
            if pt.ftpWatts  == nil { pt = DataPoint(date: pt.date, ftpWatts: lastFTP,  massKg: pt.massKg)  }
            if pt.massKg    == nil { pt = DataPoint(date: pt.date, ftpWatts: pt.ftpWatts, massKg: lastMass) }
            filled.append(pt)
        }

        let latestF = latestFTPArr.first?.quantity.doubleValue(for: .watt())
        let latestM = latestMassArr.first?.quantity.doubleValue(for: .gramUnit(with: .kilo))
        let initMass = latestM ?? latestMassArr.first?.quantity.doubleValue(for: .gramUnit(with: .kilo)) ?? 75

        await MainActor.run {
            points = filled.filter { $0.wPerKg != nil }
            latestFTP  = latestF
            latestMass = latestM
            hypotheticalMass = initMass
            isLoading = false
        }
    }

    private func fetchSamples(type: HKQuantityType, pred: NSPredicate?, sort: NSSortDescriptor, limit: Int = HKObjectQueryNoLimit) async -> [HKQuantitySample] {
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: type,
                predicate: pred,
                limit: limit,
                sortDescriptors: [sort]
            ) { _, samples, _ in
                cont.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            healthStore.execute(q)
        }
    }
}

// MARK: - Public wrapper

struct PowerToWeightView: View {
    var body: some View {
        if #available(iOS 17.0, *) {
            PowerToWeightContent()
        } else {
            ContentUnavailableView {
                Label("iOS 17 Required", systemImage: "bolt.fill")
            } description: {
                Text("Power-to-weight ratio tracking requires iOS 17+ and Apple Watch Series 9 or Ultra 2 for FTP estimation.")
            }
        }
    }
}
