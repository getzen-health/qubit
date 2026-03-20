import SwiftUI
import HealthKit

// MARK: - AthletesHeartView

/// Shows how RHR, HRV, and VO₂ max adapt together over 12 months of training —
/// the physiological signature of the "athlete's heart" phenomenon.
struct AthletesHeartView: View {

    // MARK: - Models

    struct MonthlyCardiac: Identifiable {
        let id = UUID()
        let month: Date
        let rhr: Double?          // bpm (lower = better)
        let hrv: Double?          // ms SDNN (higher = better)
        let vo2Max: Double?       // mL/kg/min (higher = better)
    }

    struct AdaptationScore {
        let label: String
        let score: Double         // 0–100
        let delta: Double         // change from first to last month
        let unit: String
        let direction: String     // "lower is better" or "higher is better"
        var isImproved: Bool {
            direction == "lower is better" ? delta < 0 : delta > 0
        }
    }

    // MARK: - State

    @State private var monthly: [MonthlyCardiac] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var adaptations: [AdaptationScore] = []

    private let hkStore = HKHealthStore()

    // MARK: - Computed

    private var rhrMonths: [(Date, Double)] {
        monthly.compactMap { m in m.rhr.map { (m.month, $0) } }
    }
    private var hrvMonths: [(Date, Double)] {
        monthly.compactMap { m in m.hrv.map { (m.month, $0) } }
    }
    private var vo2Months: [(Date, Double)] {
        monthly.compactMap { m in m.vo2Max.map { (m.month, $0) } }
    }

    private var hasEnoughData: Bool {
        monthly.filter { $0.rhr != nil || $0.hrv != nil || $0.vo2Max != nil }.count >= 3
    }

    // Normalize a value 0–100 given a range, direction
    private func normalize(_ val: Double, min: Double, max: Double, lowerIsBetter: Bool) -> Double {
        guard max > min else { return 50 }
        let clamped = Swift.min(Swift.max(val, min), max)
        let raw = (clamped - min) / (max - min) * 100
        return lowerIsBetter ? (100 - raw) : raw
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Analyzing cardiac adaptation…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if let err = errorMessage {
                    ContentUnavailableView(err, systemImage: "heart.circle.fill")
                } else if !hasEnoughData {
                    ContentUnavailableView(
                        "Need More Data",
                        systemImage: "heart.circle",
                        description: Text("Wear Apple Watch for 3+ months with regular outdoor workouts to track cardiac adaptation.")
                    )
                } else {
                    adaptationSummary
                    tripleAxisChart
                    adaptationProgressCards
                    physiologyTimelineCard
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("Athlete's Heart")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Adaptation Summary Banner

    private var adaptationSummary: some View {
        let improved = adaptations.filter(\.isImproved).count
        let total    = adaptations.filter { $0.delta != 0 }.count
        let pct      = total > 0 ? Double(improved) / Double(total) * 100 : 0

        let (headline, color, icon): (String, Color, String) = {
            switch pct {
            case 100: return ("Full Cardiac Adaptation", .green, "heart.fill")
            case 67..<100: return ("Strong Adaptation", .teal, "heart.circle.fill")
            case 33..<67: return ("Partial Adaptation", .orange, "heart.circle")
            default: return ("Early Stage", .gray, "heart")
            }
        }()

        return HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundStyle(color)
            VStack(alignment: .leading, spacing: 4) {
                Text(headline)
                    .font(.title3.bold())
                    .foregroundStyle(color)
                Text("\(improved)/\(total) markers improving over \(monthly.count) months")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(16)
    }

    // MARK: - Triple-Axis Normalized Chart

    private var tripleAxisChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Cardiac Markers — 12-Month Normalized")
                .font(.headline)

            Text("All metrics normalized to 0–100 where 100 = best. RHR and HRV are inverted accordingly.")
                .font(.caption)
                .foregroundStyle(.secondary)

            // Compute normalized series
            let rhrVals   = rhrMonths.map(\.1)
            let hrvVals   = hrvMonths.map(\.1)
            let vo2Vals   = vo2Months.map(\.1)

            let rhrMin = (rhrVals.min() ?? 40) - 2
            let rhrMax = (rhrVals.max() ?? 80) + 2
            let hrvMin = (hrvVals.min() ?? 20) - 5
            let hrvMax = (hrvVals.max() ?? 80) + 5
            let vo2Min = (vo2Vals.min() ?? 30) - 2
            let vo2Max = (vo2Vals.max() ?? 60) + 2

            GeometryReader { geo in
                let count = monthly.count
                let xStep = count > 1 ? geo.size.width / CGFloat(count - 1) : geo.size.width
                let yFor: (Double) -> CGFloat = { norm in
                    geo.size.height * (1 - CGFloat(norm / 100.0))
                }

                ZStack {
                    // Grid lines
                    ForEach([0.25, 0.50, 0.75, 1.0], id: \.self) { frac in
                        let y = geo.size.height * (1 - frac)
                        Path { p in
                            p.move(to: CGPoint(x: 0, y: y))
                            p.addLine(to: CGPoint(x: geo.size.width, y: y))
                        }
                        .stroke(Color.secondary.opacity(0.1), lineWidth: 1)
                    }

                    // RHR line (red, lower is better → inverted)
                    if rhrVals.count >= 2 {
                        let normVals = rhrMonths.map { normalize($0.1, min: rhrMin, max: rhrMax, lowerIsBetter: true) }
                        metricLine(normVals: normVals, allMonths: monthly, xStep: xStep, yFor: yFor, color: .red)
                    }

                    // HRV line (green)
                    if hrvVals.count >= 2 {
                        let normVals = hrvMonths.map { normalize($0.1, min: hrvMin, max: hrvMax, lowerIsBetter: false) }
                        metricLine(normVals: normVals, allMonths: monthly, xStep: xStep, yFor: yFor, color: .green)
                    }

                    // VO2 line (blue)
                    if vo2Vals.count >= 2 {
                        let normVals = vo2Months.map { normalize($0.1, min: vo2Min, max: vo2Max, lowerIsBetter: false) }
                        metricLine(normVals: normVals, allMonths: monthly, xStep: xStep, yFor: yFor, color: .blue)
                    }
                }
            }
            .frame(height: 160)

            HStack(spacing: 14) {
                legendDot(.red,   "RHR (↓ better)")
                legendDot(.green, "HRV (↑ better)")
                legendDot(.blue,  "VO₂ Max (↑ better)")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private func metricLine(normVals: [Double], allMonths: [MonthlyCardiac], xStep: CGFloat, yFor: (Double) -> CGFloat, color: Color) -> some View {
        var indices: [(Int, Double)] = []
        var normIdx = 0
        for (i, _) in allMonths.enumerated() {
            if normIdx < normVals.count {
                indices.append((i, normVals[normIdx]))
                normIdx += 1
            }
        }

        return Path { p in
            guard let first = indices.first else { return }
            p.move(to: CGPoint(x: CGFloat(first.0) * xStep, y: yFor(first.1)))
            for (i, v) in indices.dropFirst() {
                p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(v)))
            }
        }
        .stroke(color, lineWidth: 2)
    }

    private func legendDot(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
        }
    }

    // MARK: - Adaptation Progress Cards

    private var adaptationProgressCards: some View {
        VStack(spacing: 10) {
            ForEach(adaptations.indices, id: \.self) { idx in
                let a = adaptations[idx]
                let (color, icon): (Color, String) = a.isImproved
                    ? (.green,  "arrow.up.circle.fill")
                    : a.delta == 0 ? (.blue, "minus.circle.fill")
                    : (.orange, "arrow.down.circle.fill")

                HStack(spacing: 12) {
                    Image(systemName: icon)
                        .font(.title3)
                        .foregroundStyle(color)
                        .frame(width: 32)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(a.label).font(.subheadline.weight(.medium))
                        Text(a.direction).font(.caption2).foregroundStyle(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        let deltaStr = String(format: "%+.1f %@", a.delta, a.unit)
                        Text(deltaStr)
                            .font(.subheadline.bold())
                            .foregroundStyle(color)
                        Text("over \(monthly.count) months")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(12)
                .background(color.opacity(0.08))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Physiology Timeline Card

    private var physiologyTimelineCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Expected Adaptation Timeline")
                .font(.headline)

            let phases: [(String, String, Color)] = [
                ("Weeks 1–4", "RHR begins dropping (plasma volume expansion, stroke volume ↑)", .red),
                ("Weeks 4–12", "HRV increases as parasympathetic tone improves (vagal upregulation)", .green),
                ("Months 3–6", "VO₂ max gains from mitochondrial biogenesis & capillary density", .blue),
                ("Months 6–12+", "Structural cardiac remodeling: larger stroke volume, efficient heart", .purple),
            ]

            ForEach(phases, id: \.0) { phase in
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 3).fill(phase.2)
                        .frame(width: 4, height: 42)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(phase.0).font(.caption.weight(.bold)).foregroundStyle(phase.2)
                        Text(phase.1).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("The Athlete's Heart", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.red)

            Text("'Athlete's heart' describes the physiological cardiac adaptations to endurance training — a constellation of changes that are benign, reversible, and improve cardiovascular efficiency. First documented by Henschen (1899) in cross-country skiers via cardiac percussion.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Key adaptations: (1) RHR decreases due to increased stroke volume — the heart pumps more blood per beat. (2) HRV rises as vagal tone increases (parasympathetic dominance). (3) VO₂ max improves from greater O₂ extraction at mitochondria, capillary density, and cardiac output.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Research (Pelliccia et al. 2018) shows cardiac chambers enlarge proportionally in endurance athletes. These adaptations typically detraining within 3–6 months if training stops.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.red.opacity(0.07))
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
        let hrvType = HKQuantityType(.heartRateVariabilitySDNN)
        let vo2Type = HKQuantityType(.vo2Max)

        do {
            try await hkStore.requestAuthorization(toShare: [], read: [rhrType, hrvType, vo2Type])
        } catch {
            errorMessage = "Authorization failed"
            isLoading = false
            return
        }

        let end   = Date()
        let start = Calendar.current.date(byAdding: .month, value: -12, to: end)!
        let pred  = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort  = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        async let rhrRaw  = fetchSamples(type: rhrType, pred: pred, sort: sort)
        async let hrvRaw  = fetchSamples(type: hrvType, pred: pred, sort: sort)
        async let vo2Raw  = fetchSamples(type: vo2Type, pred: pred, sort: sort)

        let (rhrSamples, hrvSamples, vo2Samples) = await (rhrRaw, hrvRaw, vo2Raw)

        let bpmUnit = HKUnit.count().unitDivided(by: .minute())
        let msUnit  = HKUnit.secondUnit(with: .milli)
        let vo2Unit = HKUnit(from: "ml/kg*min")
        let fmt     = DateFormatter(); fmt.dateFormat = "yyyy-MM"
        let cal     = Calendar.current

        // Build monthly buckets
        var rhrByMonth: [String: [Double]] = [:]
        var hrvByMonth: [String: [Double]] = [:]
        var vo2ByMonth: [String: [Double]] = [:]
        var monthDates: [String: Date]     = [:]

        for s in rhrSamples {
            let key = fmt.string(from: s.startDate)
            rhrByMonth[key, default: []].append(s.quantity.doubleValue(for: bpmUnit))
            if monthDates[key] == nil { monthDates[key] = cal.date(from: cal.dateComponents([.year, .month], from: s.startDate)) }
        }
        for s in hrvSamples {
            let key = fmt.string(from: s.startDate)
            hrvByMonth[key, default: []].append(s.quantity.doubleValue(for: msUnit))
            if monthDates[key] == nil { monthDates[key] = cal.date(from: cal.dateComponents([.year, .month], from: s.startDate)) }
        }
        for s in vo2Samples {
            let key = fmt.string(from: s.startDate)
            vo2ByMonth[key, default: []].append(s.quantity.doubleValue(for: vo2Unit))
            if monthDates[key] == nil { monthDates[key] = cal.date(from: cal.dateComponents([.year, .month], from: s.startDate)) }
        }

        let allKeys = Set(rhrByMonth.keys).union(Set(hrvByMonth.keys)).union(Set(vo2ByMonth.keys))
        var points: [MonthlyCardiac] = []
        for key in allKeys.sorted() {
            guard let date = monthDates[key] else { continue }
            let rhr = rhrByMonth[key].map { vals in vals.reduce(0, +) / Double(vals.count) }
            let hrv = hrvByMonth[key].map { vals in vals.reduce(0, +) / Double(vals.count) }
            let vo2 = vo2ByMonth[key].map { vals in vals.reduce(0, +) / Double(vals.count) }
            points.append(MonthlyCardiac(month: date, rhr: rhr, hrv: hrv, vo2Max: vo2))
        }

        // Compute adaptation scores
        var scores: [AdaptationScore] = []
        if let first = points.first, let last = points.last {
            if let rhrF = first.rhr, let rhrL = last.rhr {
                scores.append(AdaptationScore(label: "Resting Heart Rate", score: 0, delta: rhrL - rhrF, unit: "bpm", direction: "lower is better"))
            }
            if let hrvF = first.hrv, let hrvL = last.hrv {
                scores.append(AdaptationScore(label: "HRV (SDNN)", score: 0, delta: hrvL - hrvF, unit: "ms", direction: "higher is better"))
            }
            if let vo2F = first.vo2Max, let vo2L = last.vo2Max {
                scores.append(AdaptationScore(label: "VO₂ Max", score: 0, delta: vo2L - vo2F, unit: "mL/kg/min", direction: "higher is better"))
            }
        }

        self.monthly     = points
        self.adaptations = scores
        self.isLoading   = false
    }

    private func fetchSamples(type: HKQuantityType, pred: NSPredicate, sort: NSSortDescriptor) async -> [HKQuantitySample] {
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            hkStore.execute(q)
        }
    }
}

#Preview {
    NavigationStack { AthletesHeartView() }
}
