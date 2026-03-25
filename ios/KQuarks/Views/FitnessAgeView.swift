import SwiftUI
import Charts
import HealthKit

// MARK: - FitnessAgeView

/// Computes a "fitness age" based on VO2 max using ACSM age/sex norms.
/// Compares biological fitness age against chronological age.
struct FitnessAgeView: View {

    // MARK: - Models

    private struct AgeNorm {
        let ageGroup: String  // e.g. "20s", "30s"
        let midAge: Int       // midpoint for chart
        let male50th: Double  // VO2 max at 50th percentile for males
        let female50th: Double
    }

    private enum BiologicalSex {
        case male, female, notSet
    }

    private struct ChartPoint: Identifiable {
        let id: String
        let ageGroup: String
        let midAge: Int
        let vo2Avg: Double  // 50th percentile for user's sex
        let isFitnessAge: Bool
        let isChronologicalAge: Bool
    }

    // MARK: - ACSM VO2 Max Norms (50th percentile, mL/kg/min)
    // Source: ACSM's Guidelines for Exercise Testing and Prescription, 11th edition

    private let norms: [AgeNorm] = [
        AgeNorm(ageGroup: "20s", midAge: 25, male50th: 44.2, female50th: 38.1),
        AgeNorm(ageGroup: "30s", midAge: 35, male50th: 42.5, female50th: 36.7),
        AgeNorm(ageGroup: "40s", midAge: 45, male50th: 39.9, female50th: 34.6),
        AgeNorm(ageGroup: "50s", midAge: 55, male50th: 36.4, female50th: 31.9),
        AgeNorm(ageGroup: "60s", midAge: 65, male50th: 32.3, female50th: 28.4),
        AgeNorm(ageGroup: "70+", midAge: 73, male50th: 27.0, female50th: 23.9),
    ]

    // MARK: - State

    @State private var latestVO2Max: Double? = nil
    @State private var chronologicalAge: Int? = nil
    @State private var biologicalSex: BiologicalSex = .notSet
    @State private var fitnessAge: Int? = nil
    @State private var fitnessAgeGroup: String = ""
    @State private var percentileInOwnGroup: String = ""
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if latestVO2Max == nil {
                emptyState
            } else {
                VStack(spacing: 16) {
                    heroCard
                    comparisonChartCard
                    interpretationCard
                    normTableCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Fitness Age")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let ageColor = ageColor()
        return VStack(spacing: 4) {
            Text("Your Fitness Age")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if let fa = fitnessAge {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("\(fa)")
                        .font(.system(size: 72, weight: .bold, design: .rounded))
                        .foregroundStyle(ageColor)
                    Text("years")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                        .padding(.bottom, 12)
                }
            }

            if let ca = chronologicalAge, let fa = fitnessAge {
                let diff = ca - fa
                HStack(spacing: 6) {
                    Image(systemName: diff >= 0 ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                        .foregroundStyle(diff >= 0 ? .green : .orange)
                    Text(ageDiffLabel(diff: diff, chronAge: ca))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(diff >= 0 ? .green : .orange)
                }
            }

            Divider().padding(.vertical, 8)

            HStack(spacing: 24) {
                statPill(label: "VO₂ Max", value: latestVO2Max.map { String(format: "%.1f", $0) } ?? "—", unit: "mL/kg/min")
                if let ca = chronologicalAge {
                    statPill(label: "Actual Age", value: "\(ca)", unit: "years")
                }
            }

            if !percentileInOwnGroup.isEmpty {
                Text(percentileInOwnGroup)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.top, 2)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statPill(label: String, value: String, unit: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.title3.bold().monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(unit)
                .font(.system(size: 9))
                .foregroundStyle(.tertiary)
        }
    }

    // MARK: - Comparison Chart Card

    private var comparisonChartCard: some View {
        let points = chartPoints()
        guard !points.isEmpty else { return AnyView(EmptyView()) }
        let userVO2 = latestVO2Max ?? 0

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("VO₂ Max vs Age Group Averages")
                .font(.headline)

            Chart {
                ForEach(points) { p in
                    BarMark(
                        x: .value("Age Group", p.ageGroup),
                        y: .value("VO₂ Max", p.vo2Avg)
                    )
                    .foregroundStyle(
                        p.isFitnessAge ? Color.teal :
                        p.isChronologicalAge ? Color.blue.opacity(0.4) :
                        Color.gray.opacity(0.2)
                    )
                    .cornerRadius(6)
                }

                if userVO2 > 0 {
                    RuleMark(y: .value("Your VO₂ Max", userVO2))
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [6, 3]))
                        .foregroundStyle(.orange)
                        .annotation(position: .topTrailing) {
                            Text("You: \(String(format: "%.1f", userVO2))")
                                .font(.caption2.bold())
                                .foregroundStyle(.orange)
                        }
                }
            }
            .chartXAxis {
                AxisMarks { v in
                    AxisValueLabel()
                }
            }
            .chartYAxisLabel("mL/kg/min")
            .frame(height: 180)

            HStack(spacing: 16) {
                legendDot(color: .teal, label: "Your fitness age group")
                legendDot(color: .blue.opacity(0.5), label: "Your actual age group")
                legendDot(color: .orange, label: "Your VO₂ max")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14)))
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Interpretation Card

    private var interpretationCard: some View {
        let ageColor = ageColor()
        let diff = (chronologicalAge ?? 0) - (fitnessAge ?? 0)

        return VStack(alignment: .leading, spacing: 10) {
            Label("What This Means", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(ageColor)

            Text(interpretationText(diff: diff))
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            if let ca = chronologicalAge, let fa = fitnessAge, fa < ca {
                Text("A fitness age younger than your actual age is associated with reduced risk of cardiovascular disease, longer health span, and better quality of life in later years.")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding()
        .background(ageColor.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Norm Table Card

    private var normTableCard: some View {
        let isMale = biologicalSex == .male

        return VStack(alignment: .leading, spacing: 8) {
            Text("VO₂ Max Norms (\(isMale ? "Male" : biologicalSex == .female ? "Female" : "General"))")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Age Group").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                    Text("Poor").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 50, alignment: .trailing)
                    Text("Avg").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 50, alignment: .trailing)
                    Text("Excellent").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(normRows(isMale: isMale), id: \.0) { row in
                    let isUserGroup = row.0 == fitnessAgeGroup
                    Divider()
                    HStack {
                        Text(row.0)
                            .font(.caption)
                            .fontWeight(isUserGroup ? .bold : .regular)
                            .foregroundStyle(isUserGroup ? Color.teal : .primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Text(row.1).font(.caption).frame(width: 50, alignment: .trailing)
                        Text(row.2).font(.caption.bold()).frame(width: 50, alignment: .trailing)
                        Text(row.3).font(.caption).frame(width: 65, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 7)
                    .background(isUserGroup ? Color.teal.opacity(0.06) : Color.clear)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func normRows(isMale: Bool) -> [(String, String, String, String)] {
        if isMale {
            return [
                ("20s", "<33", "42–44", ">52"),
                ("30s", "<31", "41–43", ">50"),
                ("40s", "<28", "38–40", ">48"),
                ("50s", "<25", "34–36", ">44"),
                ("60s", "<21", "30–33", ">40"),
                ("70+", "<17", "26–28", ">36"),
            ]
        } else {
            return [
                ("20s", "<28", "37–39", ">46"),
                ("30s", "<26", "34–36", ">44"),
                ("40s", "<23", "31–33", ">41"),
                ("50s", "<21", "28–30", ">38"),
                ("60s", "<18", "25–27", ">34"),
                ("70+", "<15", "22–24", ">30"),
            ]
        }
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("About Fitness Age", systemImage: "books.vertical.fill")
                .font(.headline)
                .foregroundStyle(.indigo)

            Text("Fitness age is calculated by comparing your VO₂ max against population norms from ACSM (American College of Sports Medicine) guidelines. Your VO₂ max is the maximum rate at which your body can consume oxygen during exercise — the gold standard for aerobic fitness.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("VO₂ max is measured by Apple Watch during outdoor runs. Regular aerobic exercise, especially Zone 2 training, is the most effective way to improve it.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.indigo.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.bar.xaxis.ascending")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No VO₂ Max Data")
                .font(.title3.bold())
            Text("Apple Watch estimates VO₂ max during outdoor runs and walks. Complete a few outdoor workouts to see your fitness age.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func ageColor() -> Color {
        guard let ca = chronologicalAge, let fa = fitnessAge else { return .teal }
        let diff = ca - fa
        if diff >= 10 { return .green }
        if diff >= 0 { return .teal }
        if diff >= -5 { return .orange }
        return .red
    }

    private func ageDiffLabel(diff: Int, chronAge: Int) -> String {
        if diff == 0 { return "Same as your actual age" }
        let absDiff = abs(diff)
        let yr = absDiff == 1 ? "year" : "years"
        if diff > 0 { return "\(absDiff) \(yr) younger than your actual age" }
        return "\(absDiff) \(yr) older than your actual age"
    }

    private func interpretationText(diff: Int) -> String {
        if diff >= 15 {
            return "Outstanding! Your aerobic fitness is in the top tier — comparable to someone 15+ years younger. This level of VO₂ max is associated with elite cardiovascular health."
        } else if diff >= 10 {
            return "Excellent! Your fitness significantly outpaces your chronological age. Sustained aerobic training has clearly paid off."
        } else if diff >= 5 {
            return "Great work. Your aerobic fitness is noticeably younger than your calendar age, indicating consistent cardiovascular training."
        } else if diff >= 0 {
            return "Your fitness is aligned with your age. You're maintaining a healthy baseline — moderate aerobic training can push this younger."
        } else if diff >= -5 {
            return "Your fitness age is slightly above your actual age. Incorporating more consistent aerobic exercise — especially Zone 2 runs or rides — can reverse this trend."
        } else {
            return "Your fitness age is higher than your chronological age. This is common with sedentary periods or overtraining without adequate recovery. Regular aerobic base work is the most effective intervention."
        }
    }

    private func chartPoints() -> [ChartPoint] {
        guard latestVO2Max != nil else { return [] }
        let isMale = biologicalSex == .male
        let chronGroup = ageGroup(for: chronologicalAge ?? 0)

        return norms.map { n in
            let avg = isMale ? n.male50th : n.female50th
            return ChartPoint(
                id: n.ageGroup,
                ageGroup: n.ageGroup,
                midAge: n.midAge,
                vo2Avg: avg,
                isFitnessAge: n.ageGroup == fitnessAgeGroup,
                isChronologicalAge: n.ageGroup == chronGroup
            )
        }
    }

    private func ageGroup(for age: Int) -> String {
        switch age {
        case 0..<30: return "20s"
        case 30..<40: return "30s"
        case 40..<50: return "40s"
        case 50..<60: return "50s"
        case 60..<70: return "60s"
        default: return "70+"
        }
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        // Request VO2 Max auth
        let vo2Type = HKQuantityType(.vo2Max)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [vo2Type])) != nil else { return }

        // Fetch latest VO2 Max
        let pred = HKQuery.predicateForSamples(withStart: Calendar.current.date(byAdding: .year, value: -2, to: Date()) ?? Date(), end: Date())
        let vo2Samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: vo2Type, predicate: pred, limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            healthStore.execute(q)
        }

        guard let latestSample = vo2Samples.first else { return }
        let vo2 = latestSample.quantity.doubleValue(for: HKUnit(from: "mL/kg·min"))
        latestVO2Max = vo2

        // Get age + sex from HealthKit characteristics
        if let dateOfBirth = try? healthStore.dateOfBirthComponents(),
           let year = dateOfBirth.year {
            let currentYear = Calendar.current.component(.year, from: Date())
            chronologicalAge = currentYear - year
        }

        if let sexChar = try? healthStore.biologicalSex() {
            switch sexChar.biologicalSex {
            case .male: biologicalSex = .male
            case .female: biologicalSex = .female
            default: biologicalSex = .notSet
            }
        }

        // Compute fitness age
        let isMale = biologicalSex != .female  // default male norms if not set
        computeFitnessAge(vo2: vo2, isMale: isMale)
    }

    private func computeFitnessAge(vo2: Double, isMale: Bool) {
        // Find which age group's 50th percentile is closest to the user's VO2 max
        var closestDiff = Double.infinity
        var bestNorm = norms[0]

        for norm in norms {
            let avg = isMale ? norm.male50th : norm.female50th
            let diff = abs(avg - vo2)
            if diff < closestDiff {
                closestDiff = diff
                bestNorm = norm
            }
        }

        fitnessAgeGroup = bestNorm.ageGroup
        fitnessAge = bestNorm.midAge

        // Compute percentile description within own age group
        if let ca = chronologicalAge {
            let ownGroup = ageGroup(for: ca)
            if let ownNorm = norms.first(where: { $0.ageGroup == ownGroup }) {
                let norm50 = isMale ? ownNorm.male50th : ownNorm.female50th
                if vo2 > norm50 * 1.25 { percentileInOwnGroup = "Top 10% for your age group" }
                else if vo2 > norm50 * 1.10 { percentileInOwnGroup = "Top 25% for your age group" }
                else if vo2 > norm50 { percentileInOwnGroup = "Above average for your age group" }
                else if vo2 > norm50 * 0.90 { percentileInOwnGroup = "Average for your age group" }
                else { percentileInOwnGroup = "Below average for your age group" }
            }
        }
    }
}

#Preview {
    NavigationStack {
        FitnessAgeView()
    }
}
