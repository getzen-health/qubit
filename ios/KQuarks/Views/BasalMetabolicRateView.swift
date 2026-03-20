import SwiftUI
import HealthKit

// MARK: - BasalMetabolicRateView

/// Shows Apple Watch's daily basal energy burned (resting metabolic rate) alongside
/// the Mifflin-St Jeor formula estimate and TDEE (BMR + active calories).
struct BasalMetabolicRateView: View {

    // MARK: - Models

    struct DailyEnergy: Identifiable {
        let id = UUID()
        let date: Date
        let basal: Double       // kcal — Apple Watch BMR
        let active: Double      // kcal — HKQuantityType(.activeEnergyBurned)
        var tdee: Double { basal + active }
    }

    enum ActivityMultiplier: String, CaseIterable {
        case sedentary = "Sedentary"
        case light = "Lightly Active"
        case moderate = "Moderately Active"
        case active = "Very Active"
        case athlete = "Extra Active"

        var factor: Double {
            switch self {
            case .sedentary: return 1.2
            case .light:     return 1.375
            case .moderate:  return 1.55
            case .active:    return 1.725
            case .athlete:   return 1.9
            }
        }
        var description: String {
            switch self {
            case .sedentary: return "Desk job, little exercise"
            case .light:     return "Light exercise 1-3 days/wk"
            case .moderate:  return "Moderate exercise 3-5 days/wk"
            case .active:    return "Hard training 6-7 days/wk"
            case .athlete:   return "Very hard daily training"
            }
        }
    }

    // MARK: - State

    @State private var dailyPoints: [DailyEnergy] = []
    @State private var latestBodyMass: Double?       // kg
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var selectedMultiplier: ActivityMultiplier = .moderate

    // Fixed demographic (HealthKit DOB/sex require special entitlements)
    private let age: Double = 35
    private let heightCm: Double = 178
    private let isMale: Bool = true

    private let hkStore = HKHealthStore()

    // MARK: - Computed

    private var mifflinBMR: Double? {
        guard let kg = latestBodyMass else { return nil }
        // Mifflin-St Jeor: BMR = 10×kg + 6.25×cm − 5×age + (5 for male, -161 for female)
        return 10 * kg + 6.25 * heightCm - 5 * age + (isMale ? 5 : -161)
    }

    private var mifflinTDEE: Double? {
        mifflinBMR.map { $0 * selectedMultiplier.factor }
    }

    private var avgAppleWatchBMR: Double? {
        guard !dailyPoints.isEmpty else { return nil }
        return dailyPoints.suffix(30).map(\.basal).reduce(0, +) / Double(min(dailyPoints.count, 30))
    }

    private var avgTDEE: Double? {
        guard !dailyPoints.isEmpty else { return nil }
        return dailyPoints.suffix(30).map(\.tdee).reduce(0, +) / Double(min(dailyPoints.count, 30))
    }

    private var bmrDelta: Double? {
        guard let avg = avgAppleWatchBMR, let formula = mifflinBMR else { return nil }
        return avg - formula
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Loading metabolic data…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if let err = errorMessage {
                    ContentUnavailableView(err, systemImage: "flame.slash")
                } else if dailyPoints.isEmpty {
                    ContentUnavailableView(
                        "No Basal Energy Data",
                        systemImage: "flame",
                        description: Text("Wear your Apple Watch daily for resting metabolic rate estimates.")
                    )
                } else {
                    summaryCards
                    trendChart
                    formulaComparisonCard
                    activityMultiplierCard
                    tdeeCard
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("Basal Metabolic Rate")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                statTile(
                    icon: "flame.fill",
                    color: .orange,
                    title: "Apple Watch BMR",
                    value: avgAppleWatchBMR.map { "\(Int($0))" } ?? "--",
                    unit: "kcal/day",
                    subtitle: "30-day avg"
                )
                statTile(
                    icon: "bolt.fill",
                    color: .yellow,
                    title: "Avg TDEE",
                    value: avgTDEE.map { "\(Int($0))" } ?? "--",
                    unit: "kcal/day",
                    subtitle: "BMR + active"
                )
            }
            HStack(spacing: 10) {
                statTile(
                    icon: "scalemass.fill",
                    color: .mint,
                    title: "Body Weight",
                    value: latestBodyMass.map { String(format: "%.1f", $0) } ?? "--",
                    unit: "kg",
                    subtitle: "latest logged"
                )
                statTile(
                    icon: "function",
                    color: .blue,
                    title: "Mifflin-St Jeor",
                    value: mifflinBMR.map { "\(Int($0))" } ?? "N/A",
                    unit: "kcal/day",
                    subtitle: latestBodyMass == nil ? "needs weight entry" : "formula estimate"
                )
            }
        }
    }

    private func statTile(icon: String, color: Color, title: String, value: String, unit: String, subtitle: String) -> some View {
        VStack(spacing: 6) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                    .font(.title3)
                Spacer()
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            HStack(alignment: .lastTextBaseline, spacing: 3) {
                Text(value)
                    .font(.title2.bold())
                Text(unit)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            Text(title)
                .font(.caption2.weight(.medium))
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("30-Day Energy Trend")
                .font(.headline)

            let displayed = Array(dailyPoints.suffix(30))
            let allBasal  = displayed.map(\.basal)
            let allTDEE   = displayed.map(\.tdee)
            let yMin = (allBasal.min() ?? 1400) - 100
            let yMax = (allTDEE.max() ?? 2800) + 100

            GeometryReader { geo in
                ZStack(alignment: .bottomLeading) {
                    // Grid lines
                    ForEach([0.25, 0.5, 0.75, 1.0], id: \.self) { frac in
                        let y = geo.size.height * (1 - frac)
                        Path { p in
                            p.move(to: CGPoint(x: 0, y: y))
                            p.addLine(to: CGPoint(x: geo.size.width, y: y))
                        }
                        .stroke(Color.secondary.opacity(0.12), lineWidth: 1)
                    }

                    let xStep = geo.size.width / CGFloat(max(displayed.count - 1, 1))
                    let yFor: (Double) -> CGFloat = { val in
                        geo.size.height * (1 - (val - yMin) / (yMax - yMin))
                    }

                    // TDEE area fill (orange, behind)
                    Path { p in
                        guard let first = displayed.first else { return }
                        p.move(to: CGPoint(x: 0, y: geo.size.height))
                        p.addLine(to: CGPoint(x: 0, y: yFor(first.tdee)))
                        for (i, pt) in displayed.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(pt.tdee)))
                        }
                        p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height))
                        p.closeSubpath()
                    }
                    .fill(Color.orange.opacity(0.12))

                    // BMR area fill (green)
                    Path { p in
                        guard let first = displayed.first else { return }
                        p.move(to: CGPoint(x: 0, y: geo.size.height))
                        p.addLine(to: CGPoint(x: 0, y: yFor(first.basal)))
                        for (i, pt) in displayed.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(pt.basal)))
                        }
                        p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height))
                        p.closeSubpath()
                    }
                    .fill(Color.green.opacity(0.18))

                    // TDEE line
                    Path { p in
                        guard let first = displayed.first else { return }
                        p.move(to: CGPoint(x: 0, y: yFor(first.tdee)))
                        for (i, pt) in displayed.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(pt.tdee)))
                        }
                    }
                    .stroke(Color.orange, lineWidth: 2)

                    // BMR line
                    Path { p in
                        guard let first = displayed.first else { return }
                        p.move(to: CGPoint(x: 0, y: yFor(first.basal)))
                        for (i, pt) in displayed.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(pt.basal)))
                        }
                    }
                    .stroke(Color.green, lineWidth: 2)

                    // Mifflin reference line
                    if let bmr = mifflinBMR {
                        let y = yFor(bmr)
                        Path { p in
                            p.move(to: CGPoint(x: 0, y: y))
                            p.addLine(to: CGPoint(x: geo.size.width, y: y))
                        }
                        .stroke(Color.blue.opacity(0.6), style: StrokeStyle(lineWidth: 1.5, dash: [6, 4]))
                    }
                }
            }
            .frame(height: 150)

            HStack(spacing: 16) {
                legendItem(color: .green, label: "Apple Watch BMR")
                legendItem(color: .orange, label: "TDEE (BMR + Active)")
                if mifflinBMR != nil {
                    legendItem(color: .blue, label: "Mifflin formula", dashed: true)
                }
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private func legendItem(color: Color, label: String, dashed: Bool = false) -> some View {
        HStack(spacing: 4) {
            if dashed {
                Text("- -").foregroundStyle(color).font(.caption2.bold())
            } else {
                Circle().fill(color).frame(width: 8, height: 8)
            }
            Text(label)
        }
    }

    // MARK: - Formula Comparison Card

    private var formulaComparisonCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Formula Comparison")
                .font(.headline)

            if let avg = avgAppleWatchBMR, let formula = mifflinBMR, let delta = bmrDelta {
                HStack(spacing: 16) {
                    VStack(spacing: 4) {
                        Text("\(Int(avg))")
                            .font(.title2.bold())
                            .foregroundStyle(.green)
                        Text("Apple Watch")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text("kcal/day").font(.caption2).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)

                    VStack(spacing: 4) {
                        let absD = abs(Int(delta))
                        let sign = delta > 0 ? "+" : "-"
                        Text("\(sign)\(absD)")
                            .font(.title2.bold())
                            .foregroundStyle(abs(delta) < 100 ? .green : .orange)
                        Text("difference")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text("kcal/day").font(.caption2).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)

                    VStack(spacing: 4) {
                        Text("\(Int(formula))")
                            .font(.title2.bold())
                            .foregroundStyle(.blue)
                        Text("Mifflin-St Jeor")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text("kcal/day").font(.caption2).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }

                let interpretation: String
                if abs(delta) < 50 {
                    interpretation = "Excellent agreement — Apple Watch estimate closely matches the formula."
                } else if abs(delta) < 150 {
                    interpretation = delta > 0
                        ? "Apple Watch estimates slightly higher BMR — possibly from detected fidgeting or NEAT."
                        : "Apple Watch estimates slightly lower — common in athletes with efficient metabolisms."
                } else {
                    interpretation = delta > 0
                        ? "Apple Watch BMR significantly higher — check body weight entry accuracy."
                        : "Apple Watch BMR lower than formula — update weight in Health app for accuracy."
                }
                Text(interpretation)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else if latestBodyMass == nil {
                Text("Log your body weight in the Health app to enable Mifflin-St Jeor comparison.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Activity Multiplier Card

    private var activityMultiplierCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("TDEE Activity Factor")
                .font(.headline)

            Text("Select your lifestyle to compute estimated Total Daily Energy Expenditure using the Harris-Benedict–Katch-McArdle model.")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(ActivityMultiplier.allCases, id: \.rawValue) { mult in
                Button {
                    selectedMultiplier = mult
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(mult.rawValue).font(.subheadline.weight(.medium))
                            Text(mult.description).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if mult == selectedMultiplier {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.orange)
                        } else {
                            Text("×\(String(format: "%.3f", mult.factor))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(10)
                    .background(mult == selectedMultiplier ? Color.orange.opacity(0.12) : Color(.tertiarySystemBackground))
                    .cornerRadius(10)
                }
                .buttonStyle(.plain)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - TDEE Summary Card

    private var tdeeCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Estimated TDEE")
                .font(.headline)

            if let bmr = mifflinBMR {
                let tdee = bmr * selectedMultiplier.factor
                HStack(alignment: .firstTextBaseline) {
                    Text("\(Int(tdee))")
                        .font(.system(size: 52, weight: .bold, design: .rounded))
                        .foregroundStyle(.orange)
                    Text("kcal/day")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .offset(y: -6)
                }

                Text("Mifflin-St Jeor BMR (\(Int(bmr)) kcal) × \(selectedMultiplier.rawValue) (\(String(format: "%.3f", selectedMultiplier.factor)))")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                // Macronutrient targets
                let protein  = Int(tdee * 0.30 / 4) // 30% protein, 4kcal/g
                let carbs    = Int(tdee * 0.40 / 4) // 40% carbs, 4kcal/g
                let fat      = Int(tdee * 0.30 / 9) // 30% fat, 9kcal/g
                HStack(spacing: 12) {
                    macroChip(label: "Protein", value: "\(protein)g", color: .red)
                    macroChip(label: "Carbs",   value: "\(carbs)g",   color: .blue)
                    macroChip(label: "Fat",     value: "\(fat)g",     color: .yellow)
                }
            } else {
                Text("Log your body weight in the Health app to calculate TDEE.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private func macroChip(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(8)
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("About BMR & TDEE", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.orange)

            Text("Basal Metabolic Rate (BMR) is the energy your body burns at complete rest — powering your heart, lungs, brain, and thermoregulation. It accounts for ~60–70% of total energy expenditure in sedentary individuals.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Apple Watch estimates BMR from your age, height, weight, and heart rate data throughout the day. The Mifflin-St Jeor equation (1990) is the gold standard for clinical BMR estimation (±10% accuracy).")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("TDEE = BMR × Activity Factor. Muscle mass is the largest determinant of BMR — every kg of muscle burns ~13 kcal/day at rest, vs ~4.5 kcal/kg for fat tissue.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.07))
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

        let basalType  = HKQuantityType(.basalEnergyBurned)
        let activeType = HKQuantityType(.activeEnergyBurned)
        let massType   = HKQuantityType(.bodyMass)

        do {
            try await hkStore.requestAuthorization(toShare: [], read: [basalType, activeType, massType])
        } catch {
            errorMessage = "Authorization failed"
            isLoading = false
            return
        }

        let end   = Date()
        let start = Calendar.current.date(byAdding: .day, value: -30, to: end)!
        let pred  = HKQuery.predicateForSamples(withStart: start, end: end)

        // Fetch latest body mass
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            let q = HKSampleQuery(sampleType: massType, predicate: nil, limit: 1,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, _ in
                if let s = (samples as? [HKQuantitySample])?.first {
                    Task { @MainActor in self.latestBodyMass = s.quantity.doubleValue(for: .gramUnit(with: .kilo)) }
                }
                cont.resume()
            }
            hkStore.execute(q)
        }

        // Fetch basal + active energy by day using statistics collection
        let interval = DateComponents(day: 1)
        let cal = Calendar.current
        let anchorDate = cal.startOfDay(for: start)

        let basalQuery = HKStatisticsCollectionQuery(
            quantityType: basalType,
            quantitySamplePredicate: pred,
            options: .cumulativeSum,
            anchorDate: anchorDate,
            intervalComponents: interval
        )

        var basalByDay: [String: Double] = [:]
        var activeByDay: [String: Double] = [:]
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            basalQuery.initialResultsHandler = { _, results, _ in
                results?.enumerateStatistics(from: start, to: end) { stat, _ in
                    if let sum = stat.sumQuantity() {
                        let key = fmt.string(from: stat.startDate)
                        basalByDay[key] = sum.doubleValue(for: .kilocalorie())
                    }
                }
                cont.resume()
            }
            hkStore.execute(basalQuery)
        }

        let activeQuery = HKStatisticsCollectionQuery(
            quantityType: activeType,
            quantitySamplePredicate: pred,
            options: .cumulativeSum,
            anchorDate: anchorDate,
            intervalComponents: interval
        )

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            activeQuery.initialResultsHandler = { _, results, _ in
                results?.enumerateStatistics(from: start, to: end) { stat, _ in
                    if let sum = stat.sumQuantity() {
                        let key = fmt.string(from: stat.startDate)
                        activeByDay[key] = sum.doubleValue(for: .kilocalorie())
                    }
                }
                cont.resume()
            }
            hkStore.execute(activeQuery)
        }

        var points: [DailyEnergy] = []
        for key in basalByDay.keys.sorted() {
            guard let date = fmt.date(from: key) else { continue }
            let basal  = basalByDay[key]  ?? 0
            let active = activeByDay[key] ?? 0
            guard basal > 0 else { continue }
            points.append(DailyEnergy(date: date, basal: basal, active: active))
        }

        self.dailyPoints = points
        self.isLoading = false
    }
}

#Preview {
    NavigationStack { BasalMetabolicRateView() }
}
