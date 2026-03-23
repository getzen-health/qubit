import SwiftUI
import Charts
import HealthKit

// MARK: - VO2MaxAgeNormsView

/// Compares Apple Watch VO₂ max estimates against age-stratified fitness percentiles
/// from the HUNT Fitness Study (n=4,631 healthy adults) and Lexell et al. normative data.
///
/// Shows where the user falls relative to their age group and what VO₂ max
/// they would need to reach to match a younger age group's median.
struct VO2MaxAgeNormsView: View {

    // HUNT study norms: [age_group: (poor, below_avg, average, good, excellent, superior)]
    // in ml/kg/min for male adults — approximate percentile anchors
    private let maleNorms: [String: [Double]] = [
        "20–29": [31, 37, 42, 48, 55, 62],
        "30–39": [29, 35, 40, 45, 52, 59],
        "40–49": [26, 32, 37, 42, 48, 55],
        "50–59": [22, 28, 33, 38, 44, 51],
        "60–69": [18, 23, 28, 33, 38, 45],
        "70+":   [14, 19, 23, 28, 33, 40],
    ]
    private let femaleNorms: [String: [Double]] = [
        "20–29": [24, 30, 35, 40, 46, 52],
        "30–39": [22, 28, 33, 38, 43, 49],
        "40–49": [20, 25, 30, 35, 40, 46],
        "50–59": [17, 21, 26, 30, 35, 41],
        "60–69": [14, 17, 21, 25, 30, 36],
        "70+":   [11, 14, 18, 21, 25, 31],
    ]
    private let levelLabels = ["Poor", "Below Avg", "Average", "Good", "Excellent", "Superior"]
    private let levelColors: [Color] = [.red, .orange, .yellow, .teal, .green, .blue]

    struct VO2Sample: Identifiable {
        let id: UUID
        let date: Date
        let value: Double   // ml/kg/min
    }

    @State private var samples: [VO2Sample] = []
    @State private var latestVO2: Double = 0
    @State private var userLevel: Int = 0         // index into levelLabels
    @State private var percentile: String = ""
    @State private var fitnessAge: Int = 0
    @State private var chronologicalAge: Int = 0
    @State private var ageGroup: String = ""
    @State private var norms: [Double] = []
    @State private var isLoading = true

    // Note: In a real app these would come from user profile/HealthKit BiologicalSex/DateOfBirth
    // For demo purposes we use hardcoded representative values
    private let userAgeYears: Int = 38
    private let userIsMale: Bool = true

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if samples.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    normsComparisonCard
                    trendChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("VO₂ Max & Age Norms")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let levelColor = userLevel < levelColors.count ? levelColors[userLevel] : .gray
        let levelLabel = userLevel < levelLabels.count ? levelLabels[userLevel] : "—"

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latest VO₂ Max")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", latestVO2))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(levelColor)
                        Text("ml/kg/min")
                            .font(.subheadline).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(levelColor).frame(width: 8, height: 8)
                        Text("\(levelLabel) for age \(userAgeYears)")
                            .font(.subheadline).foregroundStyle(levelColor)
                    }
                }
                Spacer()
                Image(systemName: "lungs.fill")
                    .font(.system(size: 44)).foregroundStyle(levelColor)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Age Group", value: ageGroup, color: .secondary)
                Divider().frame(height: 36)
                statCell(label: "Percentile", value: percentile, color: levelColor)
                Divider().frame(height: 36)
                statCell(label: "Fitness Age", value: fitnessAge > 0 ? "\(fitnessAge) yrs" : "—", color: fitnessAge < chronologicalAge ? .green : .orange)
                Divider().frame(height: 36)
                statCell(label: "Readings", value: "\(samples.count)", color: .secondary)
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

    // MARK: - Norms Comparison Card

    private var normsComparisonCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your Age Group: \(ageGroup)").font(.headline)
            Text("Fitness level thresholds — where do you fall?").font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 6) {
                ForEach(Array(zip(levelLabels.indices, levelLabels)), id: \.0) { idx, label in
                    let threshold = idx < norms.count ? norms[idx] : 0
                    let isUserLevel = idx == userLevel
                    let isAboveUser = latestVO2 >= threshold
                    HStack(spacing: 10) {
                        Circle()
                            .fill(levelColors[idx])
                            .frame(width: 10, height: 10)
                        Text(label)
                            .font(.caption.bold())
                            .foregroundStyle(levelColors[idx])
                            .frame(width: 72, alignment: .leading)
                        Text(String(format: "≥ %.0f ml/kg/min", threshold))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(isAboveUser ? levelColors[idx] : .secondary)
                        Spacer()
                        if isUserLevel {
                            HStack(spacing: 3) {
                                Image(systemName: "chevron.left").font(.caption2)
                                Text("You").font(.caption2.bold())
                            }
                            .foregroundStyle(levelColors[idx])
                        }
                    }
                    .padding(.vertical, 3)
                    .padding(.horizontal, 8)
                    .background(isUserLevel ? levelColors[idx].opacity(0.12) : Color.clear)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("VO₂ Max Trend").font(.headline)
            Chart {
                ForEach(samples) { s in
                    LineMark(x: .value("Date", s.date),
                             y: .value("VO2", s.value))
                    .foregroundStyle(Color.purple.opacity(0.6))
                    .interpolationMethod(.catmullRom)
                }
                ForEach(samples) { s in
                    PointMark(x: .value("Date", s.date),
                              y: .value("VO2", s.value))
                    .foregroundStyle(.purple)
                    .symbolSize(25)
                }
                // Show current age group "average" norm line
                if norms.count >= 3 {
                    RuleMark(y: .value("Avg for Age", norms[2]))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                        .annotation(position: .trailing, alignment: .center) {
                            Text("Avg").font(.caption2).foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("ml/kg/min")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "flask.fill").foregroundStyle(.purple)
                Text("VO₂ Max Fundamentals").font(.headline)
            }
            Text("VO₂ max (maximal oxygen uptake) is the gold standard measure of cardiovascular fitness — the maximum rate your body can consume oxygen during exhaustive exercise.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Apple Watch estimates VO₂ max from GPS running data using heart rate and pace. Estimates are within ±3.5 ml/kg/min of laboratory measurement (Wahl et al. 2022).")
                .font(.caption).foregroundStyle(.secondary)
            Text("VO₂ max declines ~1% per year after age 25 without training. Consistent aerobic training can maintain or improve it at any age. JAMA Network Open 2018 found low VO₂ max associated with 5× higher all-cause mortality risk.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Norms: HUNT Fitness Study (n=4,631) — Edvardsen et al. 2013")
                .font(.caption2).foregroundStyle(.tertiary).italic()
        }
        .padding()
        .background(Color.purple.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.purple.opacity(0.18), lineWidth: 1))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "lungs.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No VO₂ Max Data")
                .font(.title3.bold())
            Text("Apple Watch estimates VO₂ max during outdoor runs with GPS. Run outdoors without headphones for the most accurate estimates.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func ageGroupFor(_ age: Int) -> String {
        switch age {
        case ..<30: return "20–29"
        case 30..<40: return "30–39"
        case 40..<50: return "40–49"
        case 50..<60: return "50–59"
        case 60..<70: return "60–69"
        default: return "70+"
        }
    }

    // Estimate fitness age: find the youngest age group whose "average" norm the user meets or exceeds
    private func computeFitnessAge(vo2: Double, isMale: Bool) -> Int {
        let normTable = isMale ? maleNorms : femaleNorms
        let ageGroups = ["20–29", "30–39", "40–49", "50–59", "60–69", "70+"]
        let ageGroupMidpoints = [25, 35, 45, 55, 65, 75]

        for (i, group) in ageGroups.enumerated() {
            if let groupNorms = normTable[group], groupNorms.count >= 3 {
                if vo2 >= groupNorms[2] {  // meets or exceeds average for this age group
                    return ageGroupMidpoints[i]
                }
            }
        }
        return ageGroupMidpoints.last ?? 75
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let vo2Type = HKQuantityType.quantityType(forIdentifier: .vo2Max) else { return }
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [vo2Type])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!
        let unit = HKUnit(from: "ml/kg/min")

        let raw: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: vo2Type,
                predicate: HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !raw.isEmpty else { return }

        samples = raw.map { s in
            VO2Sample(id: s.uuid, date: s.startDate,
                      value: s.quantity.doubleValue(for: unit))
        }.filter { $0.value > 15 && $0.value < 90 }

        guard !samples.isEmpty else { return }

        latestVO2 = samples.last?.value ?? 0
        chronologicalAge = userAgeYears
        ageGroup = ageGroupFor(userAgeYears)
        norms = (userIsMale ? maleNorms : femaleNorms)[ageGroup] ?? []

        // Find level
        userLevel = 0
        for (i, threshold) in norms.enumerated() {
            if latestVO2 >= threshold { userLevel = i }
        }

        // Percentile estimate
        let pctStrings = ["<20th", "20th–40th", "40th–60th", "60th–80th", "80th–95th", ">95th"]
        percentile = userLevel < pctStrings.count ? pctStrings[userLevel] : "—"

        fitnessAge = computeFitnessAge(vo2: latestVO2, isMale: userIsMale)
    }

    private let healthStore = HKHealthStore()
}

#Preview { NavigationStack { VO2MaxAgeNormsView() } }
