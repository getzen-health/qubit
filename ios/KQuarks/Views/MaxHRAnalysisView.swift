import SwiftUI
import Charts
import HealthKit

// MARK: - MaxHRAnalysisView

/// Analyzes actual peak heart rate from workouts to calibrate true HRmax.
/// Compares observed peaks to population formulas (220−age, Tanaka, Fox)
/// and shows sport-specific max HR distribution.
///
/// Why this matters:
/// - HR zones calibrated on 220−age can be off by ±10–15 bpm
/// - Actual HRmax varies ±20 bpm from formula for any individual
/// - Zone calibration error of 10 bpm moves you an entire zone
///
/// Formulas (all give HRmax estimate):
/// - Fox (1971):   220 − age             (most widely used, highest error ±20)
/// - Tanaka (2001): 208 − (0.7 × age)    (better for adults, r=0.90)
/// - Gellish (2007): 207 − (0.7 × age)   (similar to Tanaka)
/// - Nes (2013):   211 − (0.64 × age)    (Norwegian adults, good all-ages)
///
/// HRmax declines ~1 bpm/year with aging (unrelated to fitness).
/// Elite runners can achieve same HRmax as sedentary — it is not trainable.
struct MaxHRAnalysisView: View {

    struct WorkoutPeak: Identifiable {
        let id: UUID
        let date: Date
        let sport: String
        let maxHR: Double
        let avgHR: Double?
        let durationMins: Double
    }

    struct SportPeak: Identifiable {
        let id: String
        let sport: String
        let maxHR: Double
        let count: Int
        let color: Color
    }

    struct FormulaEstimate: Identifiable {
        let id: String
        let name: String
        let value: Double
        let reference: String
    }

    @State private var peaks: [WorkoutPeak] = []
    @State private var sportPeaks: [SportPeak] = []
    @State private var formulaEstimates: [FormulaEstimate] = []
    @State private var truePeak: Double = 0
    @State private var recentPeak: Double = 0     // last 90 days
    @State private var foxEstimate: Double = 0
    @State private var tanakaEstimate: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if peaks.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    if !sportPeaks.isEmpty { sportCard }
                    formulaCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Max HR Analysis")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let diff = truePeak - foxEstimate
        let diffStr = diff >= 0 ? String(format: "+%.0f", diff) : String(format: "%.0f", diff)
        let diffColor: Color = abs(diff) > 10 ? .orange : .green

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Observed HRmax (1yr)").font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", truePeak))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(.red)
                        Text("bpm").font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Image(systemName: "waveform.path.ecg").foregroundStyle(.red)
                        Text("vs 220−age: \(String(format: "%.0f", foxEstimate)) bpm (\(diffStr))")
                            .font(.subheadline).foregroundStyle(diffColor)
                    }
                }
                Spacer()
                Image(systemName: "heart.fill").font(.system(size: 44)).foregroundStyle(.red)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Recent Peak\n(90d)", value: String(format: "%.0f bpm", recentPeak),
                         color: recentPeak >= truePeak * 0.97 ? .red : .orange)
                Divider().frame(height: 36)
                statCell(label: "Tanaka\nEstimate", value: String(format: "%.0f bpm", tanakaEstimate),
                         color: abs(truePeak - tanakaEstimate) < 8 ? .green : .orange)
                Divider().frame(height: 36)
                statCell(label: "Workouts\nAnalyzed", value: "\(peaks.count)", color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Sports\nTracked", value: "\(sportPeaks.count)", color: .teal)
            }
            Divider()
            let calibrationAdvice: String = abs(diff) > 10 ?
                "Your actual HRmax differs significantly from the 220−age formula. Use your observed peak (\(String(format: "%.0f", truePeak)) bpm) for zone calibration — it will be much more accurate." :
                "Your observed HRmax aligns well with the 220−age formula. Your zones are likely well calibrated."
            Text(calibrationAdvice).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Peak HR by Workout").font(.headline)
            Text("Peak heart rate recorded per session — last 12 months").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(peaks.suffix(60)) { p in
                    PointMark(x: .value("Date", p.date),
                              y: .value("Peak HR", p.maxHR))
                    .foregroundStyle(Color.red.opacity(0.6))
                    .symbolSize(18)
                }
                RuleMark(y: .value("HRmax", truePeak))
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 3]))
                    .foregroundStyle(Color.red.opacity(0.5))
                    .annotation(position: .trailing) {
                        Text("Peak").font(.caption2).foregroundStyle(.red)
                    }
                RuleMark(y: .value("Formula", foxEstimate))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    .foregroundStyle(Color.orange.opacity(0.5))
                    .annotation(position: .leading) {
                        Text("220-age").font(.caption2).foregroundStyle(.orange)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("bpm")
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Sport Card

    private var sportCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Max HR by Sport").font(.headline)
            Text("Peak recorded — different sports elicit different HRmax")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(sportPeaks) { sp in
                HStack(spacing: 12) {
                    Circle().fill(sp.color).frame(width: 8, height: 8)
                    Text(sp.sport).font(.caption.bold()).foregroundStyle(.primary).frame(width: 100, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3).fill(Color(.systemFill)).frame(height: 6)
                            RoundedRectangle(cornerRadius: 3).fill(sp.color)
                                .frame(width: geo.size.width * (sp.maxHR / (truePeak + 5)), height: 6)
                        }
                    }
                    .frame(height: 6)
                    Text(String(format: "%.0f bpm", sp.maxHR))
                        .font(.caption.monospacedDigit().bold()).foregroundStyle(sp.color)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Formula Card

    private var formulaCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Formula Comparison").font(.headline)
            Text("Your observed HRmax vs. published equations")
                .font(.caption).foregroundStyle(.secondary)
            HStack {
                Text("Observed peak").font(.caption.bold()).frame(maxWidth: .infinity, alignment: .leading)
                Spacer()
                Text(String(format: "%.0f bpm", truePeak)).font(.caption.bold().monospacedDigit()).foregroundStyle(.red)
            }
            .padding(.vertical, 4)
            .overlay(alignment: .bottom) { Divider() }
            ForEach(formulaEstimates) { f in
                let diff = truePeak - f.value
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(f.name).font(.caption).frame(maxWidth: .infinity, alignment: .leading)
                        Text(f.reference).font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f bpm", f.value)).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        let dc: Color = abs(diff) < 5 ? .green : abs(diff) < 10 ? .orange : .red
                        Text(diff >= 0 ? String(format: "−%.0f vs you", abs(diff)) : String(format: "+%.0f vs you", abs(diff)))
                            .font(.caption2).foregroundStyle(dc)
                    }
                }
                .padding(.vertical, 3)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "waveform.path.ecg").foregroundStyle(.red)
                Text("Max HR Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Formula accuracy", body: "220−age has ±10–20 bpm error for individuals (sd=11.4 bpm, Robergs & Landwehr, 2002). Tanaka (2001) is more accurate: 208−(0.7×age), derived from 351 studies of 18,712 participants.")
                sciRow(title: "HRmax is not trainable", body: "Aerobic training does not raise HRmax — it is genetically and age-determined. An 80-year-old endurance runner and a sedentary peer of same age have similar HRmax. Fitness lowers resting HR, not maximum HR.")
                sciRow(title: "Age-related decline", body: "HRmax declines ~1 bpm per year from age 20, regardless of fitness level. A 30-year-old and a 60-year-old top athlete will have ~30 bpm difference in HRmax.")
                sciRow(title: "Zone calibration impact", body: "Using 220−age when your true max is 10 bpm higher shifts every zone boundary by 10 bpm. This can place you in Zone 3 when you believe you're in Zone 2 — sabotaging polarized training.")
                sciRow(title: "How to find true HRmax", body: "Best method: all-out sprint after a thorough warm-up. In practice, a max graded treadmill test or final sprint in a race reliably elicits HRmax. Apple Watch captures these peaks automatically.")
            }
        }
        .padding()
        .background(Color.red.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.red.opacity(0.15), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.red)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.fill").font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Workout HR Data").font(.title3.bold())
            Text("Max HR analysis requires Apple Watch workout data with heart rate recording. Complete several workouts with high-intensity efforts to capture peak heart rate readings.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let hrType = HKQuantityType(.heartRate)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, hrType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!
        let bpm = HKUnit(from: "count/min")

        // Fetch workouts
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType,
                predicate: HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        // For each workout, fetch peak HR
        var allPeaks: [WorkoutPeak] = []
        await withTaskGroup(of: WorkoutPeak?.self) { group in
            for w in workouts.suffix(200) { // limit to 200 most recent for performance
                group.addTask {
                    let hrSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
                        let q = HKSampleQuery(sampleType: hrType,
                            predicate: HKQuery.predicateForObjects(from: w),
                            limit: HKObjectQueryNoLimit,
                            sortDescriptors: nil
                        ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
                        self.healthStore.execute(q)
                    }
                    guard !hrSamples.isEmpty else { return nil }
                    let vals = hrSamples.map { $0.quantity.doubleValue(for: bpm) }
                    let maxHR = vals.max() ?? 0
                    let avgHR = vals.reduce(0,+) / Double(vals.count)
                    guard maxHR > 100 else { return nil }
                    let dur = w.endDate.timeIntervalSince(w.startDate) / 60
                    let sport: String
                    switch w.workoutActivityType {
                    case .running:  sport = "Running"
                    case .cycling:  sport = "Cycling"
                    case .swimming: sport = "Swimming"
                    case .hiking:   sport = "Hiking"
                    case .highIntensityIntervalTraining: sport = "HIIT"
                    case .walking:  sport = "Walking"
                    default:        sport = "Other"
                    }
                    return WorkoutPeak(id: w.uuid, date: w.startDate, sport: sport,
                                      maxHR: maxHR, avgHR: avgHR, durationMins: dur)
                }
            }
            for await peak in group {
                if let p = peak { allPeaks.append(p) }
            }
        }

        guard !allPeaks.isEmpty else { return }
        peaks = allPeaks.sorted { $0.date < $1.date }

        truePeak = peaks.map(\.maxHR).max() ?? 0

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        recentPeak = peaks.filter { $0.date >= ninetyDaysAgo }.map(\.maxHR).max() ?? truePeak

        // Estimate age from typical range — default 35 if unknown
        let estimatedAge: Double = 35
        foxEstimate = 220 - estimatedAge
        tanakaEstimate = 208 - (0.7 * estimatedAge)

        formulaEstimates = [
            FormulaEstimate(id: "fox",     name: "Fox (1971)",    value: 220 - estimatedAge, reference: "220 − age"),
            FormulaEstimate(id: "tanaka",  name: "Tanaka (2001)", value: 208 - (0.7 * estimatedAge), reference: "208 − (0.7 × age)"),
            FormulaEstimate(id: "gellish", name: "Gellish (2007)", value: 207 - (0.7 * estimatedAge), reference: "207 − (0.7 × age)"),
            FormulaEstimate(id: "nes",     name: "Nes (2013)",    value: 211 - (0.64 * estimatedAge), reference: "211 − (0.64 × age)"),
        ]

        // Sport peaks
        let sportColors: [String: Color] = [
            "Running": .orange, "Cycling": .blue, "Swimming": .cyan,
            "HIIT": .red, "Hiking": .green, "Walking": .teal, "Other": .gray
        ]
        var bySpecies: [String: Double] = [:]
        var countBySport: [String: Int] = [:]
        for p in peaks {
            bySpecies[p.sport] = max(bySpecies[p.sport] ?? 0, p.maxHR)
            countBySport[p.sport, default: 0] += 1
        }
        sportPeaks = bySpecies.map { sport, maxHR in
            SportPeak(id: sport, sport: sport, maxHR: maxHR,
                      count: countBySport[sport] ?? 0,
                      color: sportColors[sport] ?? .gray)
        }.sorted { $0.maxHR > $1.maxHR }
    }
}

#Preview { NavigationStack { MaxHRAnalysisView() } }
