import SwiftUI
import HealthKit

// MARK: - CardioFitnessTrajectoryView

/// Analyzes the *rate of change* in Apple Watch VO₂ max estimates over time.
/// Shows ΔVO₂ max/month (slope via least-squares), forward projection, and
/// comparison against typical training adaptation research benchmarks.
struct CardioFitnessTrajectoryView: View {

    // MARK: - Models

    struct MonthlyVO2: Identifiable {
        let id = UUID()
        let month: Date         // first day of month
        let avgVO2: Double      // mL/kg/min
        let sampleCount: Int
    }

    enum TrajectoryClass {
        case rapidlyImproving   // >+0.5/month
        case improving          // 0..+0.5/month
        case stable             // ±0 within noise
        case declining          // -0.5..0
        case rapidlyDeclining   // <-0.5/month

        var label: String {
            switch self {
            case .rapidlyImproving:  return "Rapidly Improving"
            case .improving:         return "Improving"
            case .stable:            return "Stable"
            case .declining:         return "Declining"
            case .rapidlyDeclining:  return "Rapidly Declining"
            }
        }
        var color: Color {
            switch self {
            case .rapidlyImproving:  return .green
            case .improving:         return .teal
            case .stable:            return .blue
            case .declining:         return .orange
            case .rapidlyDeclining:  return .red
            }
        }
        var icon: String {
            switch self {
            case .rapidlyImproving:  return "arrow.up.forward.circle.fill"
            case .improving:         return "arrow.up.right.circle.fill"
            case .stable:            return "minus.circle.fill"
            case .declining:         return "arrow.down.right.circle.fill"
            case .rapidlyDeclining:  return "arrow.down.forward.circle.fill"
            }
        }
    }

    // MARK: - State

    @State private var monthly: [MonthlyVO2] = []
    @State private var slope: Double = 0           // ΔVO₂/month
    @State private var intercept: Double = 0       // regression intercept
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let hkStore = HKHealthStore()
    private let vo2Type = HKQuantityType(.vo2Max)

    // MARK: - Computed

    private var currentVO2: Double? { monthly.last?.avgVO2 }

    private var trajectoryClass: TrajectoryClass {
        switch slope {
        case ..<(-0.5): return .rapidlyDeclining
        case -0.5..<(-0.05): return .declining
        case -0.05...0.05: return .stable
        case 0.05...0.5:  return .improving
        default:          return .rapidlyImproving
        }
    }

    // Project VO₂ max N months ahead using trend line
    private func projected(in months: Int) -> Double? {
        guard !monthly.isEmpty else { return nil }
        let last = Double(monthly.count - 1)
        return intercept + slope * (last + Double(months))
    }

    // Months until VO₂ crosses a target, negative = already past
    private func monthsUntil(target: Double) -> Int? {
        guard abs(slope) > 0.01, let curr = currentVO2 else { return nil }
        return Int(ceil((target - curr) / slope))
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Analyzing VO₂ max trend…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if let err = errorMessage {
                    ContentUnavailableView(err, systemImage: "lungs.fill")
                } else if monthly.count < 3 {
                    ContentUnavailableView(
                        "Not Enough VO₂ Max Data",
                        systemImage: "lungs.fill",
                        description: Text("Apple Watch needs at least 3 months of outdoor runs or walks to estimate trajectory. Record regular outdoor workouts.")
                    )
                } else {
                    trajectoryStatusCard
                    trendChart
                    projectionCard
                    adaptationBenchmarks
                    fitnessThresholdsCard
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("Cardio Fitness Trajectory")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Trajectory Status

    private var trajectoryStatusCard: some View {
        HStack(spacing: 16) {
            Image(systemName: trajectoryClass.icon)
                .font(.system(size: 44))
                .foregroundStyle(trajectoryClass.color)

            VStack(alignment: .leading, spacing: 6) {
                Text(trajectoryClass.label)
                    .font(.title2.bold())
                    .foregroundStyle(trajectoryClass.color)

                let slopeStr = slope >= 0
                    ? "+\(String(format: "%.2f", slope))"
                    : String(format: "%.2f", slope)
                Text("\(slopeStr) mL/kg/min per month")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if let curr = currentVO2 {
                    Text("Current: \(String(format: "%.1f", curr)) mL/kg/min")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
        }
        .padding()
        .background(trajectoryClass.color.opacity(0.1))
        .cornerRadius(16)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("VO₂ Max History + Trend")
                .font(.headline)

            let allVals = monthly.map(\.avgVO2)
            let yMin = (allVals.min() ?? 30) - 2
            let yMax = (allVals.max() ?? 55) + 2

            GeometryReader { geo in
                ZStack(alignment: .bottomLeading) {
                    // Grid
                    ForEach([0.25, 0.50, 0.75, 1.0], id: \.self) { frac in
                        let y = geo.size.height * (1 - frac)
                        Path { p in
                            p.move(to: CGPoint(x: 0, y: y))
                            p.addLine(to: CGPoint(x: geo.size.width, y: y))
                        }
                        .stroke(Color.secondary.opacity(0.12), lineWidth: 1)
                    }

                    let xStep = geo.size.width / CGFloat(max(monthly.count - 1, 1))
                    let yFor: (Double) -> CGFloat = { val in
                        geo.size.height * (1 - CGFloat((val - yMin) / (yMax - yMin)))
                    }

                    // Actual data area
                    Path { p in
                        guard let first = monthly.first else { return }
                        p.move(to: CGPoint(x: 0, y: geo.size.height))
                        p.addLine(to: CGPoint(x: 0, y: yFor(first.avgVO2)))
                        for (i, m) in monthly.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(m.avgVO2)))
                        }
                        p.addLine(to: CGPoint(x: CGFloat(monthly.count - 1) * xStep, y: geo.size.height))
                        p.closeSubpath()
                    }
                    .fill(Color.purple.opacity(0.15))

                    // Data line
                    Path { p in
                        guard let first = monthly.first else { return }
                        p.move(to: CGPoint(x: 0, y: yFor(first.avgVO2)))
                        for (i, m) in monthly.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(m.avgVO2)))
                        }
                    }
                    .stroke(Color.purple, lineWidth: 2.5)

                    // Trend line (extended forward 3 months)
                    let totalPoints = monthly.count + 3
                    Path { p in
                        let startY = yFor(intercept)
                        let endX   = geo.size.width * CGFloat(totalPoints - 1) / CGFloat(max(totalPoints - 1, 1))
                        let endVO2 = intercept + slope * Double(totalPoints - 1)
                        let endY   = yFor(endVO2)
                        p.move(to: CGPoint(x: 0, y: startY))
                        p.addLine(to: CGPoint(x: endX, y: endY))
                    }
                    .stroke(trajectoryClass.color, style: StrokeStyle(lineWidth: 1.5, dash: [6, 4]))

                    // Dots
                    ForEach(Array(monthly.enumerated()), id: \.1.id) { i, m in
                        Circle()
                            .fill(Color.purple)
                            .frame(width: 6, height: 6)
                            .position(x: CGFloat(i) * xStep, y: yFor(m.avgVO2))
                    }
                }
            }
            .frame(height: 160)

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    Circle().fill(Color.purple).frame(width: 8, height: 8)
                    Text("Monthly VO₂ Max")
                }
                HStack(spacing: 4) {
                    Text("- -").foregroundStyle(trajectoryClass.color).font(.caption.bold())
                    Text("Trend line (projected)")
                }
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Projection Card

    private var projectionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("6-Month Projection")
                .font(.headline)

            Text("If current trend continues:")
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(spacing: 0) {
                ForEach([1, 3, 6], id: \.self) { months in
                    let proj = projected(in: months)
                    VStack(spacing: 4) {
                        Text(proj.map { String(format: "%.1f", $0) } ?? "--")
                            .font(.title3.bold())
                            .foregroundStyle(projectionColor(months: months))
                        Text("+\(months)mo")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)

                    if months != 6 {
                        Divider().frame(height: 40)
                    }
                }
            }

            Text("mL/kg/min — projection assumes constant rate of change")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private func projectionColor(months: Int) -> Color {
        guard let curr = currentVO2, let proj = projected(in: months) else { return .primary }
        let delta = proj - curr
        if delta > 0.5 { return .green }
        if delta > 0   { return .teal }
        if delta > -1  { return .orange }
        return .red
    }

    // MARK: - Adaptation Benchmarks

    private var adaptationBenchmarks: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Research Adaptation Benchmarks")
                .font(.headline)

            let benchmarks: [(String, String, Color)] = [
                ("+5–10 mL/kg/min", "Untrained beginner (first 3–6 months)", .green),
                ("+2–4 mL/kg/min", "Recreationally fit (per training year)", .teal),
                ("+0.5–1.5 mL/kg/min", "Well-trained athlete (per year)", .blue),
                ("−0.5–1.0 mL/kg/min", "Expected annual decline without training", .orange),
                ("Maintained", "Consistent Zone 2 training preserves VO₂ max", .purple),
            ]

            ForEach(benchmarks, id: \.0) { benchmark in
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(benchmark.2)
                        .frame(width: 4, height: 36)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(benchmark.0)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(benchmark.2)
                        Text(benchmark.1)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
            }

            let slopeAnnual = slope * 12
            let annualStr = slopeAnnual >= 0 ? "+\(String(format: "%.1f", slopeAnnual))" : String(format: "%.1f", slopeAnnual)
            Text("Your annualized rate: \(annualStr) mL/kg/min/year")
                .font(.subheadline.bold())
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Fitness Threshold Card

    private var fitnessThresholdsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Threshold Crossings (age 35, male)")
                .font(.headline)

            let thresholds: [(String, Double, Color)] = [
                ("Low fitness", 35.0, .red),
                ("Below average", 40.0, .orange),
                ("Average", 44.0, .yellow),
                ("Above average", 48.0, .teal),
                ("Excellent", 52.0, .green),
            ]

            ForEach(thresholds, id: \.0) { (label, target, color) in
                HStack {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(color)
                        .frame(width: 4, height: 28)
                    VStack(alignment: .leading, spacing: 0) {
                        Text("\(label) (\(String(format: "%.0f", target))+ mL/kg/min)")
                            .font(.caption.weight(.medium))
                        if let curr = currentVO2 {
                            if curr >= target {
                                Text("Already achieved")
                                    .font(.caption2)
                                    .foregroundStyle(.green)
                            } else if abs(slope) > 0.01,
                                      let m = monthsUntil(target: target), m > 0, m < 120 {
                                Text("~\(m) months at current rate")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            } else {
                                Text("Requires increased training load")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    Spacer()
                    Text(String(format: "%.0f", target))
                        .font(.subheadline.bold())
                        .foregroundStyle(color)
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
            Label("Trajectory Science", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.purple)

            Text("VO₂ max (maximal oxygen uptake) is the gold standard measure of cardiorespiratory fitness and one of the strongest predictors of all-cause mortality. Apple Watch estimates VO₂ max using heart rate response during outdoor runs and walks.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Trajectory is computed using ordinary least-squares linear regression on monthly averages. This minimizes noise from day-to-day variation and captures the true long-term adaptation trend.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Research (Saltin & Astrand 1967; Bassett & Howley 2000) shows VO₂ max is highly trainable: untrained individuals gain 15–25% with 3–6 months of aerobic training, while elite athletes improve <5% per year.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.purple.opacity(0.07))
        .cornerRadius(14)
    }

    // MARK: - Loading

    @MainActor
    private func load() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit not available"
            isLoading = false
            return
        }

        do {
            try await hkStore.requestAuthorization(toShare: [], read: [vo2Type])
        } catch {
            errorMessage = "Authorization failed"
            isLoading = false
            return
        }

        let end   = Date()
        let start = Calendar.current.date(byAdding: .month, value: -18, to: end)!
        let pred  = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort  = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            let q = HKSampleQuery(sampleType: vo2Type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                let vo2Samples = (samples as? [HKQuantitySample]) ?? []
                let unit = HKUnit(from: "ml/kg*min")
                let cal = Calendar.current

                // Group by year-month
                var buckets: [String: [Double]] = [:]
                var bucketDates: [String: Date] = [:]
                let fmt = DateFormatter()
                fmt.dateFormat = "yyyy-MM"
                for s in vo2Samples {
                    let key = fmt.string(from: s.startDate)
                    let val = s.quantity.doubleValue(for: unit)
                    buckets[key, default: []].append(val)
                    if bucketDates[key] == nil {
                        bucketDates[key] = cal.date(from: cal.dateComponents([.year, .month], from: s.startDate))
                    }
                }

                var points: [MonthlyVO2] = []
                for key in buckets.keys.sorted() {
                    guard let vals = buckets[key], !vals.isEmpty,
                          let date = bucketDates[key] else { continue }
                    let avg = vals.reduce(0, +) / Double(vals.count)
                    points.append(MonthlyVO2(month: date, avgVO2: avg, sampleCount: vals.count))
                }

                // Linear regression (OLS)
                var (m, b) = (0.0, 0.0)
                if points.count >= 2 {
                    let n = Double(points.count)
                    let xs = (0..<points.count).map { Double($0) }
                    let ys = points.map(\.avgVO2)
                    let sumX  = xs.reduce(0, +)
                    let sumY  = ys.reduce(0, +)
                    let sumXY = zip(xs, ys).map(*).reduce(0, +)
                    let sumXX = xs.map { $0 * $0 }.reduce(0, +)
                    let denom = n * sumXX - sumX * sumX
                    if abs(denom) > 0.001 {
                        m = (n * sumXY - sumX * sumY) / denom
                        b = (sumY - m * sumX) / n
                    }
                }

                Task { @MainActor in
                    self.monthly   = points
                    self.slope     = m
                    self.intercept = b
                    self.isLoading = false
                }
                cont.resume()
            }
            hkStore.execute(q)
        }
    }
}

#Preview {
    NavigationStack { CardioFitnessTrajectoryView() }
}
