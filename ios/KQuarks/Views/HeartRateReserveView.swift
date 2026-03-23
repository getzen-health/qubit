import SwiftUI
import HealthKit

// MARK: - HeartRateReserveView

struct HeartRateReserveView: View {

    // MARK: - Data Models

    struct DailyHRR: Identifiable {
        let id = UUID()
        let date: Date
        let rhr: Double        // bpm
        let hrmax: Double      // bpm (formula-based)
        let hrr: Double        // hrmax - rhr
    }

    struct KarvonenZone: Identifiable {
        let id = UUID()
        let name: String
        let pctLow: Double
        let pctHigh: Double
        let color: Color
        let description: String
    }

    // MARK: - State

    @State private var dailyPoints: [DailyHRR] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    // Hardcoded age (HealthKit DOB requires special entitlement)
    private let age: Double = 35

    private let hkStore = HKHealthStore()

    // MARK: - Karvonen Zones (% of HRR)

    private let zones: [KarvonenZone] = [
        KarvonenZone(name: "Z1 Recovery", pctLow: 0.50, pctHigh: 0.60, color: .blue, description: "Active recovery, very easy"),
        KarvonenZone(name: "Z2 Aerobic", pctLow: 0.60, pctHigh: 0.70, color: .green, description: "Aerobic base, fat burning"),
        KarvonenZone(name: "Z3 Tempo", pctLow: 0.70, pctHigh: 0.80, color: .yellow, description: "Aerobic threshold, conversation pace"),
        KarvonenZone(name: "Z4 Threshold", pctLow: 0.80, pctHigh: 0.90, color: .orange, description: "Lactate threshold, comfortably hard"),
        KarvonenZone(name: "Z5 VO₂ Max", pctLow: 0.90, pctHigh: 1.00, color: .red, description: "Maximum effort, anaerobic"),
    ]

    // MARK: - Computed

    private var latestRHR: Double? { dailyPoints.last?.rhr }
    private var latestHRmax: Double? { dailyPoints.last?.hrmax }
    private var latestHRR: Double? { dailyPoints.last?.hrr }

    private var rhrTrend: Double? {
        guard dailyPoints.count >= 14 else { return nil }
        let recent = dailyPoints.suffix(7).map(\.rhr).reduce(0, +) / 7
        let prior  = dailyPoints.dropLast(7).suffix(7).map(\.rhr).reduce(0, +) / 7
        return recent - prior
    }

    private var hrrTrend: Double? {
        guard dailyPoints.count >= 14 else { return nil }
        let recent = dailyPoints.suffix(7).map(\.hrr).reduce(0, +) / 7
        let prior  = dailyPoints.dropLast(7).suffix(7).map(\.hrr).reduce(0, +) / 7
        return recent - prior
    }

    private var minHRR: Double { dailyPoints.map(\.hrr).min() ?? 0 }
    private var maxHRR: Double { dailyPoints.map(\.hrr).max() ?? 100 }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Loading HRR data…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if let err = errorMessage {
                    ContentUnavailableView(err, systemImage: "heart.slash")
                } else if dailyPoints.isEmpty {
                    ContentUnavailableView(
                        "No Resting HR Data",
                        systemImage: "heart.circle",
                        description: Text("Wear your Apple Watch daily to collect resting heart rate.")
                    )
                } else {
                    summaryCards
                    trendChart
                    karvonenZonesCard
                    hrrProgressCard
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("Heart Rate Reserve")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        HStack(spacing: 12) {
            metricTile(
                title: "Resting HR",
                value: latestRHR.map { "\(Int($0))" } ?? "--",
                unit: "bpm",
                icon: "heart.fill",
                color: .red,
                trend: rhrTrend.map { $0 > 0 ? "+\(Int($0))" : "\(Int($0))" },
                trendColor: (rhrTrend ?? 0) > 0 ? .red : .green
            )
            metricTile(
                title: "Est. HRmax",
                value: latestHRmax.map { "\(Int($0))" } ?? "--",
                unit: "bpm",
                icon: "waveform.path.ecg",
                color: .orange,
                trend: "208−0.7×age",
                trendColor: .secondary
            )
            metricTile(
                title: "HR Reserve",
                value: latestHRR.map { "\(Int($0))" } ?? "--",
                unit: "bpm",
                icon: "arrow.up.arrow.down.heart",
                color: .purple,
                trend: hrrTrend.map { $0 > 0 ? "+\(Int($0)) vs prior wk" : "\(Int($0)) vs prior wk" },
                trendColor: (hrrTrend ?? 0) >= 0 ? .green : .red
            )
        }
    }

    private func metricTile(title: String, value: String, unit: String, icon: String, color: Color, trend: String?, trendColor: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            Text(value)
                .font(.title2.bold())
            Text(unit)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(title)
                .font(.caption2.weight(.medium))
                .foregroundStyle(.secondary)
            if let trend {
                Text(trend)
                    .font(.caption2)
                    .foregroundStyle(trendColor)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("90-Day HRR Trend")
                .font(.headline)

            let displayed = dailyPoints.suffix(90)
            let hrrRange = (minHRR - 5)...(maxHRR + 5)
            let rhrRange = (displayed.map(\.rhr).min() ?? 40) - 3...(displayed.map(\.rhr).max() ?? 80) + 3

            GeometryReader { geo in
                ZStack(alignment: .bottomLeading) {
                    // Grid lines
                    ForEach([0.25, 0.50, 0.75, 1.0], id: \.self) { frac in
                        let y = geo.size.height * (1 - frac)
                        Path { p in
                            p.move(to: CGPoint(x: 0, y: y))
                            p.addLine(to: CGPoint(x: geo.size.width, y: y))
                        }
                        .stroke(Color.secondary.opacity(0.15), lineWidth: 1)
                    }

                    // HRR fill area
                    Path { p in
                        guard let first = displayed.first else { return }
                        let xStep = geo.size.width / CGFloat(max(displayed.count - 1, 1))
                        let yFor: (Double) -> CGFloat = { val in
                            let range = hrrRange.upperBound - hrrRange.lowerBound
                            return geo.size.height * (1 - (val - hrrRange.lowerBound) / range)
                        }
                        p.move(to: CGPoint(x: 0, y: geo.size.height))
                        p.addLine(to: CGPoint(x: 0, y: yFor(first.hrr)))
                        for (i, pt) in displayed.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(pt.hrr)))
                        }
                        p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height))
                        p.closeSubpath()
                    }
                    .fill(Color.purple.opacity(0.15))

                    // HRR line
                    Path { p in
                        guard let first = displayed.first else { return }
                        let xStep = geo.size.width / CGFloat(max(displayed.count - 1, 1))
                        let yFor: (Double) -> CGFloat = { val in
                            let range = hrrRange.upperBound - hrrRange.lowerBound
                            return geo.size.height * (1 - (val - hrrRange.lowerBound) / range)
                        }
                        p.move(to: CGPoint(x: 0, y: yFor(first.hrr)))
                        for (i, pt) in displayed.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(pt.hrr)))
                        }
                    }
                    .stroke(Color.purple, lineWidth: 2)

                    // RHR line (secondary, gray)
                    Path { p in
                        guard let first = displayed.first else { return }
                        let xStep = geo.size.width / CGFloat(max(displayed.count - 1, 1))
                        let yFor: (Double) -> CGFloat = { val in
                            let range = rhrRange.upperBound - rhrRange.lowerBound
                            return geo.size.height * (1 - (val - rhrRange.lowerBound) / range)
                        }
                        p.move(to: CGPoint(x: 0, y: yFor(first.rhr)))
                        for (i, pt) in displayed.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(pt.rhr)))
                        }
                    }
                    .stroke(Color.red.opacity(0.5), style: StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
                }
            }
            .frame(height: 140)

            HStack(spacing: 16) {
                legendDot(color: .purple, label: "HR Reserve (HRmax − RHR)")
                legendDot(color: .red.opacity(0.6), label: "Resting HR", dashed: true)
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private func legendDot(color: Color, label: String, dashed: Bool = false) -> some View {
        HStack(spacing: 4) {
            if dashed {
                Text("---")
                    .font(.caption2.bold())
                    .foregroundStyle(color)
            } else {
                Circle().fill(color).frame(width: 8, height: 8)
            }
            Text(label)
        }
    }

    // MARK: - Karvonen Zones Card

    private var karvonenZonesCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Karvonen Target Zones")
                .font(.headline)

            if let rhr = latestRHR, let hrmax = latestHRmax {
                Text("Based on RHR \(Int(rhr)) bpm, HRmax \(Int(hrmax)) bpm")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                ForEach(zones) { zone in
                    let lo = rhr + zone.pctLow  * (hrmax - rhr)
                    let hi = rhr + zone.pctHigh * (hrmax - rhr)
                    HStack(spacing: 10) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(zone.color)
                            .frame(width: 6, height: 40)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(zone.name).font(.subheadline.weight(.medium))
                            Text(zone.description).font(.caption).foregroundStyle(.secondary)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text("\(Int(lo))–\(Int(hi)) bpm")
                                .font(.subheadline.bold())
                            Text("\(Int(zone.pctLow * 100))–\(Int(zone.pctHigh * 100))%")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - HRR Progress Card

    private var hrrProgressCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("HRR as a Fitness Indicator")
                .font(.headline)

            if let hrr = latestHRR {
                let category: (String, Color, String) = hrrCategory(hrr)
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Your HRR: \(Int(hrr)) bpm")
                            .font(.title3.bold())
                        Text(category.0)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(category.1)
                        Text(category.2)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "heart.circle.fill")
                        .font(.largeTitle)
                        .foregroundStyle(category.1)
                }

                // Progress bar context
                let scale: [(String, Color, ClosedRange<Double>)] = [
                    ("Needs Work", .gray, 0...49),
                    ("Average", .blue, 50...64),
                    ("Good", .green, 65...79),
                    ("Excellent", .orange, 80...94),
                    ("Elite", .red, 95...120),
                ]
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        HStack(spacing: 2) {
                            ForEach(scale, id: \.0) { seg in
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(seg.1.opacity(0.3))
                                    .frame(width: geo.size.width / CGFloat(scale.count))
                            }
                        }
                        let clamped = min(max(hrr, 0), 120)
                        let pos = CGFloat(clamped / 120) * geo.size.width
                        Circle()
                            .fill(category.1)
                            .frame(width: 14, height: 14)
                            .offset(x: pos - 7)
                    }
                }
                .frame(height: 14)

                HStack {
                    Text("0")
                    Spacer()
                    Text("60")
                    Spacer()
                    Text("120+ bpm")
                }
                .font(.caption2)
                .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private func hrrCategory(_ hrr: Double) -> (String, Color, String) {
        switch hrr {
        case ..<50: return ("Needs Work", .gray, "RHR is close to HRmax — focus on aerobic base")
        case 50..<65: return ("Average", .blue, "Moderate fitness — consistent Zone 2 work helps")
        case 65..<80: return ("Good", .green, "Above-average aerobic fitness")
        case 80..<95: return ("Excellent", .orange, "Strong cardiovascular reserve")
        default:     return ("Elite", .red, "Outstanding — athlete-level cardiac efficiency")
        }
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("About Heart Rate Reserve", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.blue)

            Text("Heart Rate Reserve (HRR) = HRmax − RHR. Introduced by Karvonen (1957), it's a more personalised basis for training zones than raw % HRmax because it accounts for cardiovascular efficiency gained through training.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("As fitness improves: RHR drops (vagal tone rises), widening HRR. A rising HRR trend — even with stable HRmax — signals aerobic adaptation.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("This view uses the Tanaka formula (208 − 0.7 × age) for HRmax estimation, which has lower bias than Fox's 220 − age.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .cornerRadius(14)
    }

    // MARK: - Data Loading

    @MainActor
    private func load() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit not available"
            isLoading = false
            return
        }

        let rhrType = HKQuantityType(.restingHeartRate)

        do {
            try await hkStore.requestAuthorization(toShare: [], read: [rhrType])
        } catch {
            errorMessage = "Authorization failed"
            isLoading = false
            return
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end)!
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            let q = HKSampleQuery(sampleType: rhrType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                let rhrSamples = (samples as? [HKQuantitySample]) ?? []
                let bpmUnit = HKUnit.count().unitDivided(by: .minute())
                let hrmaxFormula = 208.0 - 0.7 * self.age

                // Group by day, take daily median
                var dayBuckets: [String: [Double]] = [:]
                let fmt = DateFormatter()
                fmt.dateFormat = "yyyy-MM-dd"
                for s in rhrSamples {
                    let key = fmt.string(from: s.startDate)
                    let val = s.quantity.doubleValue(for: bpmUnit)
                    dayBuckets[key, default: []].append(val)
                }

                var points: [DailyHRR] = []
                for (key, vals) in dayBuckets.sorted(by: { $0.key < $1.key }) {
                    guard let date = fmt.date(from: key), !vals.isEmpty else { continue }
                    let sorted = vals.sorted()
                    let median = sorted[sorted.count / 2]
                    let hrr = hrmaxFormula - median
                    points.append(DailyHRR(date: date, rhr: median, hrmax: hrmaxFormula, hrr: hrr))
                }

                Task { @MainActor in
                    self.dailyPoints = points
                    self.isLoading = false
                }
                continuation.resume()
            }
            hkStore.execute(q)
        }
    }
}

#Preview {
    NavigationStack { HeartRateReserveView() }
}
