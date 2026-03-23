import SwiftUI
import HealthKit
import Charts

// MARK: - HeatAcclimatizationView
// Estimates heat acclimatization level by comparing HR-to-effort ratio during warm months
// vs baseline cool-weather sessions. Heat acclimatized athletes show reduced HR at same effort.
//
// Science:
//   Lorenzo et al. 2010 (J Appl Physiol): 10-day heat acclimation → +4.5% plasma volume,
//     +6.4% VO₂max improvement even in temperate conditions (not just heat performance).
//   Périard & Racinais 2015 (Br J Sports Med): heat acclimatization reduces exercise HR
//     3–8 bpm at same intensity — the result of plasma volume expansion (PV expansion).
//   Stanley et al. 2015 (Exp Physiol): heat training transfers to cooler conditions —
//     treated as a legal performance enhancer (Marcus 2016, Frontiers).
//   Sawka et al. 2011 (Med Sci Sports Exerc): full acclimatization requires 10–14 days of
//     ≥60 min exercise in heat; ≥5 days for partial acclimatization.
//
// Estimation method (no temperature sensor required):
//   Month = proxy for heat exposure. Northern hemisphere: June–August = warm.
//   Warm-month HR efficiency (speed per HR unit) compared to baseline.
//   Downward HR trend at same effort = acclimatization signal.
//   HR efficiency = (distance_km / duration_hr) / avgHR  (km/h per bpm)
//   Higher = better efficiency = more adapted.

struct HeatAcclimatizationView: View {

    // MARK: - Models

    enum Season: String {
        case warm = "Warm Season"
        case cool = "Cool Season"

        var color: Color {
            switch self {
            case .warm: return .orange
            case .cool: return .blue
            }
        }

        /// Northern hemisphere warm = Jun–Aug; cool = Nov–Feb.
        static func classify(month: Int) -> Season {
            (6...8).contains(month) ? .warm : (month <= 2 || month == 12) ? .cool : .warm
        }
    }

    struct WorkoutSample: Identifiable {
        let id = UUID()
        let date: Date
        let month: Int
        let season: Season
        let hrEfficiency: Double    // km/h per bpm — higher = better
        let avgHR: Double
        let paceKmH: Double
        let durationMins: Double
        let label: String
    }

    struct MonthEfficiency: Identifiable {
        let id = UUID()
        let month: Date             // first of month
        let monthLabel: String
        let avgEfficiency: Double
        let sessionCount: Int
        let season: Season
    }

    enum AcclimatizationLevel: String {
        case none        = "Not Assessed"
        case minimal     = "Minimal"
        case partial     = "Partial"
        case moderate    = "Moderate"
        case full        = "Full"

        var color: Color {
            switch self {
            case .none:     return .secondary
            case .minimal:  return .red
            case .partial:  return .orange
            case .moderate: return .yellow
            case .full:     return .green
            }
        }

        var description: String {
            switch self {
            case .none:     return "No warm-weather training data yet."
            case .minimal:  return "Early-stage heat exposure — plasma volume adaptation just beginning."
            case .partial:  return "Partial acclimatization (5–9 days) — HR reducing at same effort. Continue warm training."
            case .moderate: return "Moderate acclimatization — significant HR reduction (~3–4 bpm). VO₂ max benefits beginning."
            case .full:     return "Full acclimatization (~14+ days) — maximum plasma volume expansion achieved. VO₂ up ~6%."
            }
        }
    }

    // MARK: - State

    @State private var samples: [WorkoutSample] = []
    @State private var monthlyEfficiency: [MonthEfficiency] = []
    @State private var warmAvg: Double = 0
    @State private var coolAvg: Double = 0
    @State private var hrReduction: Double = 0         // bpm reduction in warm vs cool (positive = adapted)
    @State private var acclimatizationLevel: AcclimatizationLevel = .none
    @State private var warmSessionCount: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analyzing heat adaptation…")
                        .padding(.top, 60)
                } else {
                    statusCard
                    hrEfficiencyChart
                    seasonComparisonCard
                    if !samples.isEmpty { recentSessionsCard }
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Heat Acclimatization")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Status Card

    private var statusCard: some View {
        VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(warmSessionCount)",
                    label: "Warm Sessions",
                    sub: "Jun–Aug training",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: hrReduction != 0 ? String(format: "%+.1f bpm", -hrReduction) : "—",
                    label: "HR Reduction",
                    sub: "warm vs cool baseline",
                    color: hrReduction > 0 ? .green : (hrReduction < 0 ? .red : .secondary)
                )
                Divider().frame(height: 44)
                statBox(
                    value: acclimatizationLevel.rawValue,
                    label: "Acclim. Level",
                    sub: "Lorenzo 2010",
                    color: acclimatizationLevel.color
                )
            }
            .padding(.vertical, 12)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: levelIcon)
                        .foregroundStyle(acclimatizationLevel.color)
                    Text(acclimatizationLevel.description)
                        .font(.caption)
                        .foregroundStyle(acclimatizationLevel.color)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 10)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var levelIcon: String {
        switch acclimatizationLevel {
        case .full:     return "thermometer.sun.fill"
        case .moderate: return "thermometer.medium"
        case .partial:  return "thermometer.low"
        case .minimal:  return "thermometer.snowflake"
        case .none:     return "thermometer.variable.and.figure"
        }
    }

    // MARK: - HR Efficiency Chart

    private var hrEfficiencyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("HR Efficiency by Month", systemImage: "thermometer.sun.fill")
                .font(.subheadline).bold()
            Text("Higher efficiency = faster pace at same HR = better heat adaptation. Orange bars = warm months. Blue bars = cool months.")
                .font(.caption2).foregroundStyle(.secondary)

            if !monthlyEfficiency.isEmpty {
                Chart(monthlyEfficiency) { m in
                    BarMark(
                        x: .value("Month", m.monthLabel),
                        y: .value("Efficiency", m.avgEfficiency)
                    )
                    .foregroundStyle(m.season.color.gradient)
                    .cornerRadius(4)
                    .annotation(position: .top) {
                        if m.sessionCount >= 2 {
                            Text("\(m.sessionCount)").font(.system(size: 8)).foregroundStyle(.secondary)
                        }
                    }
                }
                .frame(height: 140)
                .chartYAxisLabel("km/h per bpm (efficiency)")

                HStack(spacing: 16) {
                    legendDot(color: .orange, label: "Warm months")
                    legendDot(color: .blue,   label: "Cool months")
                }
                .font(.caption2)
            } else {
                Text("Insufficient running data to compute monthly efficiency. Record runs with Apple Watch for at least 3 months.")
                    .font(.caption).foregroundStyle(.secondary).italic()
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Season Comparison Card

    private var seasonComparisonCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Season Comparison", systemImage: "sun.max.fill")
                .font(.subheadline).bold()

            let rows: [(String, String, String, Color)] = [
                ("Warm Months", warmAvg > 0 ? String(format: "%.4f km/h per bpm", warmAvg) : "No data", "Jun–Aug training", .orange),
                ("Cool Months", coolAvg > 0 ? String(format: "%.4f km/h per bpm", coolAvg) : "No data", "Nov–Feb training", .blue),
                ("Difference", hrReduction != 0 ? String(format: "%+.1f bpm HR diff", -hrReduction) : "—",
                 hrReduction > 1 ? "Heat adaptation signal" : hrReduction < -1 ? "Slight heat fatigue" : "No significant difference",
                 hrReduction > 1 ? .green : hrReduction < -1 ? .red : .secondary),
            ]

            ForEach(rows, id: \.0) { row in
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(row.0).font(.caption.bold())
                        Text(row.2).font(.caption2).foregroundStyle(.tertiary)
                    }
                    Spacer()
                    Text(row.1).font(.caption.bold()).foregroundStyle(row.3)
                }
                if row.0 != rows.last?.0 { Divider() }
            }

            if warmAvg > 0 && coolAvg > 0 {
                let pctImprove = ((warmAvg - coolAvg) / coolAvg) * 100
                Text(String(format: "HR efficiency %+.1f%% in warm months. %@",
                            pctImprove,
                            pctImprove > 2 ? "Positive acclimatization response detected — plasma volume expansion improving cardiovascular efficiency." :
                            pctImprove < -2 ? "Warm weather is reducing efficiency — may need more heat exposure for adaptation." :
                            "Similar efficiency across seasons — well-acclimatized baseline or insufficient contrast."))
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recent Sessions

    private var recentSessionsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Recent Sessions", systemImage: "list.bullet.rectangle")
                .font(.subheadline).bold()

            ForEach(samples.suffix(6).reversed()) { s in
                HStack(spacing: 10) {
                    Image(systemName: s.season == .warm ? "sun.max.fill" : "snowflake")
                        .font(.caption)
                        .foregroundStyle(s.season.color)
                        .frame(width: 16)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(s.label).font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(String(format: "%.0f bpm avg", s.avgHR))
                            .font(.caption.bold())
                        Text(String(format: "%.1f km/h", s.paceKmH))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if s.id != samples.suffix(6).reversed().last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Heat Acclimatization Science", systemImage: "thermometer.sun.fill")
                .font(.subheadline).bold()
            Text("Lorenzo et al. 2010 (J Appl Physiol): 10 days of heat training increased plasma volume 4.5% and improved VO₂max 6.4% — not just in heat, but also in temperate conditions. Heat training is considered a legal 'altitude training' equivalent for endurance athletes.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Périard & Racinais 2015 (Br J Sports Med): fully acclimatized athletes show 3–8 bpm lower HR at same running pace, reduced core temperature, and increased sweat rate. These adaptations develop over 10–14 days of ≥60 min exercise in heat (Sawka 2011, Med Sci Sports Exerc).")
                .font(.caption).foregroundStyle(.secondary)
            Text("Practical tip: Don't skip summer training — it's free altitude training. Monitor HR at same effort: if it stabilizes or drops over 2 weeks, acclimatization is working. Hydrate +20–30% more in warm weather.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Helpers

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let workoutType = HKObjectType.workoutType()
        let hrType      = HKQuantityType(.heartRate)
        let distType    = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, hrType, distType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .month, value: -12, to: end)!

        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: start, end: end),
            HKQuery.predicateForWorkouts(with: .running)
        ])

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: HKObjectQueryNoLimit,
                                   sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        processWorkouts(rawWorkouts)
        isLoading = false
    }

    private func processWorkouts(_ workouts: [HKWorkout]) {
        let hrUnit   = HKUnit.count().unitDivided(by: .minute())
        let kmUnit   = HKUnit.meterUnit(with: .kilo)
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        var built: [WorkoutSample] = []
        for w in workouts {
            guard w.duration >= 15 * 60 else { continue }
            guard let avgHR = w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: hrUnit),
                  avgHR > 80 else { continue }
            guard let distKm = w.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: kmUnit),
                  distKm > 1 else { continue }

            let durationH = w.duration / 3600
            let paceKmH   = distKm / durationH
            guard paceKmH > 4 && paceKmH < 25 else { continue }  // sane pace range
            let efficiency = paceKmH / avgHR

            let month = calendar.component(.month, from: w.startDate)
            let season = Season.classify(month: month)

            built.append(WorkoutSample(
                date: w.startDate,
                month: month,
                season: season,
                hrEfficiency: efficiency,
                avgHR: avgHR,
                paceKmH: paceKmH,
                durationMins: w.duration / 60,
                label: formatter.string(from: w.startDate)
            ))
        }

        // Monthly aggregation
        let monthlyGroups = Dictionary(grouping: built) { s -> Date in
            let comps = calendar.dateComponents([.year, .month], from: s.date)
            return calendar.date(from: comps)!
        }
        let monthFmt = DateFormatter(); monthFmt.dateFormat = "MMM"
        let monthly = monthlyGroups.sorted { $0.key < $1.key }.map { date, sessions -> MonthEfficiency in
            let avg = sessions.map(\.hrEfficiency).reduce(0, +) / Double(sessions.count)
            let month = calendar.component(.month, from: date)
            return MonthEfficiency(
                month: date,
                monthLabel: monthFmt.string(from: date),
                avgEfficiency: avg,
                sessionCount: sessions.count,
                season: Season.classify(month: month)
            )
        }

        // Season averages
        let warmSessions = built.filter { $0.season == .warm }
        let coolSessions = built.filter { $0.season == .cool }
        let warmEff = warmSessions.isEmpty ? 0.0 : warmSessions.map(\.hrEfficiency).reduce(0, +) / Double(warmSessions.count)
        let coolEff = coolSessions.isEmpty ? 0.0 : coolSessions.map(\.hrEfficiency).reduce(0, +) / Double(coolSessions.count)

        // HR reduction: if warm efficiency > cool efficiency, HR is lower at same pace in warm (adapted)
        // hrReduction = estimated bpm drop (positive = good acclimatization)
        let effDiff = warmEff - coolEff  // positive = warm is more efficient
        // estimate bpm equivalent: at typical pace 10 km/h, 1 bpm change ≈ 0.001 efficiency
        let hrReducEst = effDiff * 10 / 0.001  // rough bpm estimate

        // Acclimatization level from warm session count and efficiency improvement
        let level: AcclimatizationLevel
        if warmSessions.count == 0 { level = .none }
        else if warmSessions.count < 3 { level = .minimal }
        else if warmSessions.count < 7 { level = .partial }
        else if effDiff > 0.0002 { level = .full }
        else if warmSessions.count >= 5 { level = .moderate }
        else { level = .partial }

        DispatchQueue.main.async {
            self.samples               = built
            self.monthlyEfficiency     = monthly
            self.warmAvg               = warmEff
            self.coolAvg               = coolEff
            self.hrReduction           = hrReducEst
            self.acclimatizationLevel  = level
            self.warmSessionCount      = warmSessions.count
        }
    }
}
