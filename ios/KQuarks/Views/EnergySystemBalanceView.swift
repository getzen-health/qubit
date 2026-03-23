import SwiftUI
import Charts
import HealthKit

// MARK: - EnergySystemBalanceView

/// Radar chart showing how balanced training is across the five energy
/// system dimensions: Aerobic Base, Threshold, VO₂ Max, Strength, and
/// Recovery Quality. Distinct from WorkoutVarietyView (sport-type mix);
/// this measures ENERGY SYSTEM balance, not activity-type balance.
struct EnergySystemBalanceView: View {

    // MARK: - Models

    struct Dimension: Identifiable {
        let id: String
        let name: String
        let shortName: String
        let score: Double     // 0–100
        let color: Color
        let icon: String
        let description: String
        let targetLabel: String
    }

    struct WeekTrend: Identifiable {
        let id: Date
        let monday: Date
        let aerobicMins: Double
        let thresholdMins: Double
        let vo2maxMins: Double
        let strengthSessions: Int
        let restDays: Int
    }

    // MARK: - State

    @State private var dimensions: [Dimension] = []
    @State private var weekTrends: [WeekTrend] = []
    @State private var overallBalance: Double = 0  // 0-100, how close to ideal
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Ideal targets per week
    private let targetAerobicMins: Double = 150   // 2.5h Zone 2 (WHO guideline)
    private let targetThresholdMins: Double = 40  // ~35-45 min threshold
    private let targetVO2MaxMins: Double = 15     // 2×6-8 min intervals
    private let targetStrengthSessions: Int = 2   // 2 sessions/week
    private let targetRestDays: Int = 1           // 1 true rest day

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if dimensions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    balanceCard
                    radarCard
                    dimensionBreakdownCard
                    weeklyStackedChartCard
                    guidelinesCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Energy Balance")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Balance Card

    private var balanceCard: some View {
        let color = balanceColor()

        return VStack(spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Training Balance Score")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", overallBalance))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(color)
                        Text("/ 100")
                            .font(.title3)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 10)
                    }
                    Text(balanceLabel())
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(color)
                }
                Spacer()

                // Mini radar preview
                ZStack {
                    ForEach(0..<5, id: \.self) { i in
                        let angle = Double(i) / 5.0 * 2 * .pi - .pi / 2
                        let score = dimensions.count > i ? dimensions[i].score / 100 : 0
                        let r = score * 40
                        Circle()
                            .fill(dimensions.count > i ? dimensions[i].color.opacity(0.3) : Color.clear)
                            .frame(width: 6, height: 6)
                            .offset(x: cos(angle) * r, y: sin(angle) * r)
                    }
                    radarPath(size: 80)
                        .fill(Color.teal.opacity(0.15))
                    radarPath(size: 80)
                        .stroke(Color.teal.opacity(0.5), lineWidth: 1.5)
                }
                .frame(width: 80, height: 80)
            }

            Text(balanceDescription())
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func balanceColor() -> Color {
        if overallBalance >= 75 { return .green }
        if overallBalance >= 50 { return .teal }
        if overallBalance >= 30 { return .orange }
        return .red
    }

    private func balanceLabel() -> String {
        if overallBalance >= 75 { return "Well Balanced" }
        if overallBalance >= 50 { return "Mostly Balanced" }
        if overallBalance >= 30 { return "Needs Attention" }
        return "Imbalanced"
    }

    private func balanceDescription() -> String {
        let weakest = dimensions.min(by: { $0.score < $1.score })
        let strongest = dimensions.max(by: { $0.score < $1.score })
        if let w = weakest, let s = strongest, w.id != s.id {
            return "Strongest: \(s.name) (\(Int(s.score))). Biggest gap: \(w.name) (\(Int(w.score))). \(w.targetLabel)"
        }
        return "Based on last 4 weeks. Scores reflect proximity to research-backed training targets."
    }

    // MARK: - Radar Chart

    private func radarPolygonPath(center: CGPoint, r: CGFloat) -> Path {
        var p = Path()
        for (i, d) in dimensions.enumerated() {
            let angle = angleFor(index: i)
            let val = Double(r) * d.score / 100.0
            let pt = CGPoint(x: Double(center.x) + Darwin.cos(angle) * val, y: Double(center.y) + Darwin.sin(angle) * val)
            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
        }
        p.closeSubpath()
        return p
    }

    @ViewBuilder
    private func radarDots(center: CGPoint, r: CGFloat) -> some View {
        ForEach(Array(dimensions.enumerated()), id: \.element.id) { i, d in
            let angle = angleFor(index: i)
            let val = Double(r) * d.score / 100.0
            let rDouble = Double(r)
            let cx = Double(center.x); let cy = Double(center.y)
            let pt = CGPoint(x: cx + Darwin.cos(angle) * val, y: cy + Darwin.sin(angle) * val)
            let labelPt = CGPoint(x: cx + Darwin.cos(angle) * (rDouble + 20), y: cy + Darwin.sin(angle) * (rDouble + 20))
            Circle().fill(d.color).frame(width: 8, height: 8).position(pt)
            Text(d.shortName).font(.caption2.bold()).foregroundStyle(d.color).position(labelPt)
        }
    }

    private var radarCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Energy System Radar").font(.headline)
            GeometryReader { geo in
                let size = min(geo.size.width, geo.size.height)
                let center = CGPoint(x: size / 2, y: size / 2)
                let r = size / 2 - 32
                ZStack {
                    ForEach([0.25, 0.50, 0.75, 1.0], id: \.self) { pct in
                        Circle().stroke(Color.secondary.opacity(0.15), lineWidth: 1)
                            .frame(width: r * 2 * pct, height: r * 2 * pct).position(center)
                    }
                    ForEach(0..<5, id: \.self) { i in
                        Path { p in
                            let a = angleFor(index: i)
                            p.move(to: center)
                            p.addLine(to: CGPoint(x: Double(center.x) + Darwin.cos(a) * Double(r), y: Double(center.y) + Darwin.sin(a) * Double(r)))
                        }.stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                    }
                    if dimensions.count == 5 {
                        radarPolygonPath(center: center, r: r).fill(Color.teal.opacity(0.25))
                        radarPolygonPath(center: center, r: r).stroke(Color.teal, lineWidth: 2)
                        radarDots(center: center, r: r)
                    }
                }
            }
            .frame(height: 260)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func angleFor(index: Int) -> Double {
        Double(index) / 5.0 * 2 * .pi - .pi / 2
    }

    private func radarPath(size: Double) -> Path {
        guard dimensions.count == 5 else { return Path() }
        var p = Path()
        let center = CGPoint(x: size / 2, y: size / 2)
        let r = size / 2 - 4
        for (i, d) in dimensions.enumerated() {
            let angle = angleFor(index: i)
            let val = d.score / 100.0 * r
            let pt = CGPoint(x: center.x + cos(angle) * val, y: center.y + sin(angle) * val)
            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
        }
        p.closeSubpath()
        return p
    }

    // MARK: - Dimension Breakdown

    private var dimensionBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Dimension Scores (4-week avg)")
                .font(.headline)

            ForEach(dimensions) { d in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: d.icon)
                            .foregroundStyle(d.color)
                            .frame(width: 20)
                        Text(d.name)
                            .font(.subheadline.weight(.medium))
                        Spacer()
                        Text("\(Int(d.score))")
                            .font(.subheadline.bold())
                            .foregroundStyle(d.color)
                    }
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color.secondary.opacity(0.1)).frame(height: 6)
                            RoundedRectangle(cornerRadius: 4).fill(d.color.opacity(0.8))
                                .frame(width: g.size.width * d.score / 100, height: 6)
                        }
                    }
                    .frame(height: 6)
                    Text(d.description)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                .padding(.vertical, 4)
                if d.id != dimensions.last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Weekly Stacked Chart

    private var weeklyStackedChartCard: some View {
        guard weekTrends.count > 1 else { return AnyView(EmptyView()) }

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("4-Week Load Distribution")
                .font(.headline)

            Chart {
                ForEach(weekTrends) { w in
                    BarMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("Aerobic", w.aerobicMins),
                        width: .ratio(0.6)
                    )
                    .foregroundStyle(Color.blue.opacity(0.7))
                    .position(by: .value("Type", "Aerobic"))

                    BarMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("Threshold", w.thresholdMins),
                        width: .ratio(0.6)
                    )
                    .foregroundStyle(Color.orange.opacity(0.7))
                    .position(by: .value("Type", "Threshold"))

                    BarMark(
                        x: .value("Week", w.monday, unit: .weekOfYear),
                        y: .value("VO₂Max", w.vo2maxMins),
                        width: .ratio(0.6)
                    )
                    .foregroundStyle(Color.red.opacity(0.7))
                    .position(by: .value("Type", "VO₂Max"))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear, count: 1)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("Minutes")
            .frame(height: 140)

            HStack(spacing: 16) {
                legendBar(color: .blue, label: "Aerobic (Z1–Z2)")
                legendBar(color: .orange, label: "Threshold (Z3–Z4)")
                legendBar(color: .red, label: "VO₂Max (Z5)")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14)))
    }

    private func legendBar(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 2).fill(color.opacity(0.8)).frame(width: 12, height: 8)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Optimal Balance Targets", systemImage: "target")
                .font(.headline)
                .foregroundStyle(.indigo)

            guideline("Aerobic Base (Zone 1–2)", target: "150 min/week", icon: "wind")
            guideline("Threshold (Zone 3–4)", target: "30–45 min/week", icon: "flame")
            guideline("VO₂ Max (Zone 5)", target: "10–20 min/week", icon: "bolt")
            guideline("Strength Training", target: "2 sessions/week", icon: "dumbbell")
            guideline("Recovery", target: "≥1 rest day/week", icon: "moon.zzz")

            Text("The 80/20 rule: ~80% aerobic base + ~20% higher intensity. These targets follow polarized training research (Seiler, 2010) and WHO physical activity guidelines.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .italic()
        }
        .padding()
        .background(Color.indigo.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func guideline(_ label: String, target: String, icon: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).foregroundStyle(.indigo).frame(width: 16)
            Text(label).font(.caption)
            Spacer()
            Text(target).font(.caption.bold()).foregroundStyle(.indigo)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "pentagon")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Energy system balance requires at least 2 weeks of workout data. Keep training and check back.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let typesToRead: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKQuantityType(.heartRate),
            HKQuantityType(.heartRateVariabilitySDNN)
        ]
        guard (try? await healthStore.requestAuthorization(toShare: [], read: typesToRead)) != nil else { return }

        let cal = Calendar.current
        let fourWeeksAgo = cal.date(byAdding: .weekOfYear, value: -4, to: Date())!

        let allWorkouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: HKObjectType.workoutType(),
                predicate: HKQuery.predicateForSamples(withStart: fourWeeksAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !allWorkouts.isEmpty else { return }

        // For each workout, estimate zone from avg HR
        // Using simple % of assumed max HR = 190 for classification
        let maxHR = 190.0
        var aerobicMins = 0.0   // Z1-Z2: < 70% = < 133 bpm
        var thresholdMins = 0.0 // Z3-Z4: 70-90% = 133-171 bpm
        var vo2maxMins = 0.0    // Z5: > 90% = > 171 bpm
        var strengthSessions = 0
        var workingDays = Set<String>()

        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"

        for w in allWorkouts where w.duration > 180 {
            let mins = w.duration / 60.0
            workingDays.insert(df.string(from: w.startDate))

            // Classify by workout type first
            switch w.workoutActivityType {
            case .traditionalStrengthTraining, .functionalStrengthTraining, .crossTraining, .coreTraining:
                strengthSessions += 1
            default:
                // Classify by avg HR zone
                let avgHR = w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: hrUnit) ?? 0
                if avgHR > 0 {
                    let pct = avgHR / maxHR
                    if pct < 0.70 { aerobicMins += mins }
                    else if pct < 0.90 { thresholdMins += mins }
                    else { vo2maxMins += mins }
                } else {
                    // No HR data — estimate from workout type
                    switch w.workoutActivityType {
                    case .running, .cycling, .swimming, .hiking, .rowing:
                        aerobicMins += mins * 0.7  // assume mostly aerobic
                        thresholdMins += mins * 0.3
                    case .highIntensityIntervalTraining:
                        vo2maxMins += mins * 0.5
                        thresholdMins += mins * 0.5
                    default:
                        aerobicMins += mins
                    }
                }
            }
        }

        // Total days in window vs working days
        let totalDays = 28.0
        let restDays = totalDays - Double(workingDays.count)

        // Compute per-week averages
        let weeksCount = 4.0
        let weeklyAerobic = aerobicMins / weeksCount
        let weeklyThreshold = thresholdMins / weeksCount
        let weeklyVO2Max = vo2maxMins / weeksCount
        let weeklyStrength = Double(strengthSessions) / weeksCount
        let weeklyRest = restDays / weeksCount

        // Score each dimension 0-100 relative to target
        // Over-training the same thing doesn't give bonus — score peaks at 100 then stays
        func score(_ actual: Double, target: Double, tolerance: Double = 0.3) -> Double {
            let ratio = actual / target
            if ratio >= 1.0 { return min(100, 100 * (2 - ratio) / 1.0) }  // peaks at 100 when at target, decreases slightly if way over
            return min(100, ratio * 100)
        }

        let aerobicScore  = score(weeklyAerobic, target: targetAerobicMins)
        let threshScore   = score(weeklyThreshold, target: targetThresholdMins)
        let vo2maxScore   = score(weeklyVO2Max, target: targetVO2MaxMins)
        let strengthScore = score(weeklyStrength, target: Double(targetStrengthSessions))
        let restScore     = score(min(weeklyRest, Double(targetRestDays) * 2), target: Double(targetRestDays))

        dimensions = [
            Dimension(id: "aerobic", name: "Aerobic Base", shortName: "Z1-2", score: aerobicScore,
                      color: .blue, icon: "wind",
                      description: "Low-intensity (Zone 1–2) work: \(Int(weeklyAerobic)) min/wk (target: 150)",
                      targetLabel: "Add more easy Zone 2 sessions."),
            Dimension(id: "threshold", name: "Threshold", shortName: "Z3-4", score: threshScore,
                      color: .orange, icon: "flame",
                      description: "Moderate-high intensity: \(Int(weeklyThreshold)) min/wk (target: 40)",
                      targetLabel: "Add tempo or lactate threshold intervals."),
            Dimension(id: "vo2max", name: "VO₂ Max Work", shortName: "Z5", score: vo2maxScore,
                      color: .red, icon: "bolt",
                      description: "High intensity intervals: \(Int(weeklyVO2Max)) min/wk (target: 15)",
                      targetLabel: "Try 2×8 min VO₂max intervals per week."),
            Dimension(id: "strength", name: "Strength", shortName: "Str", score: strengthScore,
                      color: .purple, icon: "dumbbell",
                      description: "\(Int(weeklyStrength)) strength sessions/wk (target: 2)",
                      targetLabel: "Add 1–2 strength sessions per week."),
            Dimension(id: "recovery", name: "Recovery", shortName: "Rest", score: restScore,
                      color: .green, icon: "moon.zzz",
                      description: "~\(Int(weeklyRest)) rest days/wk (target: ≥1)",
                      targetLabel: "Schedule at least 1 complete rest day per week."),
        ]

        // Overall balance = harmonic mean (penalizes extreme imbalance)
        let scores = dimensions.map(\.score)
        let harmonic = Double(scores.count) / scores.map { 1.0 / max($0, 1) }.reduce(0, +)
        overallBalance = min(harmonic, 100)

        // Build weekly trend buckets
        var trends: [WeekTrend] = []
        for weekOffset in 0..<4 {
            let monday = mondayOf(date: cal.date(byAdding: .weekOfYear, value: -(3 - weekOffset), to: Date())!, cal: cal)
            let weekEnd = cal.date(byAdding: .day, value: 7, to: monday)!
            let weekWorkouts = allWorkouts.filter { $0.startDate >= monday && $0.startDate < weekEnd }

            var wAerobic = 0.0, wThreshold = 0.0, wVO2 = 0.0, wStrength = 0, wRest = 0
            var wDays = Set<String>()
            for w in weekWorkouts where w.duration > 180 {
                let mins = w.duration / 60.0
                wDays.insert(df.string(from: w.startDate))
                switch w.workoutActivityType {
                case .traditionalStrengthTraining, .functionalStrengthTraining, .crossTraining, .coreTraining:
                    wStrength += 1
                default:
                    let avgHR = w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: hrUnit) ?? 0
                    if avgHR > 0 {
                        let pct = avgHR / maxHR
                        if pct < 0.70 { wAerobic += mins }
                        else if pct < 0.90 { wThreshold += mins }
                        else { wVO2 += mins }
                    } else { wAerobic += mins }
                }
            }
            wRest = 7 - wDays.count
            trends.append(WeekTrend(id: monday, monday: monday, aerobicMins: wAerobic,
                                    thresholdMins: wThreshold, vo2maxMins: wVO2,
                                    strengthSessions: wStrength, restDays: wRest))
        }
        weekTrends = trends
    }

    private func mondayOf(date: Date, cal: Calendar) -> Date {
        var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        comps.weekday = 2
        return cal.date(from: comps) ?? date
    }
}

#Preview {
    NavigationStack {
        EnergySystemBalanceView()
    }
}
