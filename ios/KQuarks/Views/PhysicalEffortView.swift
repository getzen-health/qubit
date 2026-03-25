import SwiftUI
import Charts
import HealthKit

// MARK: - PhysicalEffortView

/// Tracks Apple's workout effort score (HKQuantityType(.physicalEffort), iOS 17+).
/// Recorded automatically during workouts by Apple Watch, correlating heart rate
/// intensity with a 1–10 effort scale (Borg-inspired):
///   1–2  Light — warm-up, cool-down, recovery walk
///   3–4  Moderate — conversational pace, Zone 2
///   5–6  Vigorous — comfortably hard, 10k race pace
///   7–8  Hard — threshold effort, tempo runs, HIIT working sets
///   9–10 Maximum — all-out sprint, VO2max intervals
///
/// The effort score uses heart rate relative to your estimated maximum
/// (220 – age or Apple's personalised max HR estimate).
///
/// Evidence:
/// - Borg's RPE (6–20) and CR10 (0–10) scales correlate with HR, lactate &
///   oxygen uptake (r ≈ 0.80–0.90) — Foster et al., Med Sci Sports Exerc 2001.
/// - Session RPE (workout × effort × duration) predicts overreaching and
///   injury risk with high sensitivity.
@available(iOS 17.0, *)
private struct PhysicalEffortContent: View {

    struct WorkoutEffort: Identifiable {
        let id: UUID
        let date: Date
        let workoutName: String
        let durationMins: Double
        let effortScore: Double        // 1–10
        let avgHRPct: Double?          // % of max HR (optional)

        var effortLevel: EffortLevel { EffortLevel(score: effortScore) }
        var sessionLoad: Double { durationMins * effortScore }
    }

    enum EffortLevel: String {
        case light    = "Light"
        case moderate = "Moderate"
        case vigorous = "Vigorous"
        case hard     = "Hard"
        case maximum  = "Maximum"

        init(score: Double) {
            switch score {
            case ..<3:  self = .light
            case 3..<5: self = .moderate
            case 5..<7: self = .vigorous
            case 7..<9: self = .hard
            default:    self = .maximum
            }
        }

        var color: Color {
            switch self {
            case .light:    return .green
            case .moderate: return .teal
            case .vigorous: return .blue
            case .hard:     return .orange
            case .maximum:  return .red
            }
        }

        var description: String {
            switch self {
            case .light:    return "Light — recovery / easy aerobic"
            case .moderate: return "Moderate — conversational, Zone 2"
            case .vigorous: return "Vigorous — comfortably hard, tempo"
            case .hard:     return "Hard — threshold, near-max intervals"
            case .maximum:  return "Maximum — all-out, VO₂max effort"
            }
        }
    }

    struct ZoneEntry: Identifiable {
        let id: EffortLevel
        let level: EffortLevel
        let count: Int
        let pct: Double
    }

    @State private var sessions: [WorkoutEffort] = []
    @State private var avgEffort: Double = 0
    @State private var avgLoad: Double = 0
    @State private var weeklyLoad: Double = 0
    @State private var hardPct: Double = 0
    @State private var zoneData: [ZoneEntry] = []
    @State private var trendSlope: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    zoneCard
                    loadCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Workout Effort")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let level = EffortLevel(score: avgEffort)
        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Avg Effort Score (90d)")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", avgEffort))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(level.color)
                        Text("/ 10")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(level.color).frame(width: 8, height: 8)
                        Text(level.rawValue).font(.subheadline).foregroundStyle(level.color)
                    }
                }
                Spacer()
                Image(systemName: "flame.fill")
                    .font(.system(size: 44)).foregroundStyle(level.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Sessions", value: "\(sessions.count)", color: .blue)
                Divider().frame(height: 36)
                statCell(label: "7d Load", value: String(format: "%.0f", weeklyLoad), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Hard+ %", value: String(format: "%.0f%%", hardPct),
                         color: hardPct > 40 ? .red : hardPct > 25 ? .orange : .green)
                Divider().frame(height: 36)
                let trendColor: Color = trendSlope > 0.05 ? .orange : trendSlope < -0.05 ? .green : .secondary
                statCell(label: "Trend",
                         value: trendSlope >= 0 ? String(format: "+%.2f/wk", trendSlope) : String(format: "%.2f/wk", trendSlope),
                         color: trendColor)
            }
            Divider()
            Text(level.description)
                .font(.caption).foregroundStyle(.secondary)
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

    // MARK: - Trend Chart

    private var trendChart: some View {
        let yMax = max(sessions.map(\.effortScore).max() ?? 10, 10)
        return VStack(alignment: .leading, spacing: 8) {
            Text("90-Day Effort History").font(.headline)
            Text("Workout effort score per session — colored by intensity level")
                .font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(sessions) { s in
                    BarMark(x: .value("Date", s.date),
                            y: .value("Effort", s.effortScore))
                    .foregroundStyle(s.effortLevel.color.opacity(0.8))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Hard", 7))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.orange.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("Hard").font(.caption2).foregroundStyle(.orange)
                    }
                RuleMark(y: .value("Avg", avgEffort))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 3]))
                    .foregroundStyle(Color.blue.opacity(0.5))
                    .annotation(position: .leading) {
                        Text("Avg").font(.caption2).foregroundStyle(.blue)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Effort (1–10)")
            .chartYScale(domain: 0...yMax)
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Zone Distribution Card

    private var zoneCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Effort Zone Distribution").font(.headline)
            Text("Sessions by intensity — optimal 80:20 = 80% moderate/vigorous, 20% hard+")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(zoneData) { zone in
                VStack(spacing: 3) {
                    HStack {
                        Circle().fill(zone.level.color).frame(width: 8, height: 8)
                        Text(zone.level.rawValue).font(.caption.bold()).foregroundStyle(zone.level.color)
                        Spacer()
                        Text("\(zone.count) sessions · \(String(format: "%.0f%%", zone.pct))")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3).fill(Color(.systemFill)).frame(height: 6)
                            RoundedRectangle(cornerRadius: 3).fill(zone.level.color)
                                .frame(width: geo.size.width * zone.pct / 100, height: 6)
                        }
                    }
                    .frame(height: 6)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Load Card

    private var loadCard: some View {
        let sorted = sessions.suffix(10)
        return VStack(alignment: .leading, spacing: 8) {
            Text("Session Load (RPE × Minutes)").font(.headline)
            Text("Recent 10 sessions — higher = more training stress")
                .font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(Array(sorted)) { s in
                    BarMark(x: .value("Date", s.date),
                            y: .value("Load", s.sessionLoad))
                    .foregroundStyle(s.effortLevel.color.opacity(0.7))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks { _ in AxisValueLabel(format: .dateTime.month(.abbreviated).day()) }
            }
            .chartYAxisLabel("Load (RPE·min)")
            .frame(height: 120)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "flame.fill").foregroundStyle(.orange)
                Text("Effort Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "RPE validity", body: "Session RPE (0–10) correlates strongly with HR (r=0.87), blood lactate, and oxygen uptake. Borg CR10 is the gold standard for prescribing intensity without a HR monitor (Foster et al., Med Sci Sports Exerc, 2001).")
                sciRow(title: "Session load (RPE × duration)", body: "Multiplying effort (1–10) by workout duration gives a session load score. Weekly load sum predicts injury risk when it increases >10% week-over-week (Gabbett, Br J Sports Med, 2016).")
                sciRow(title: "80:20 training balance", body: "Elite endurance athletes spend ~80% of sessions at low-moderate effort (score ≤5) and 20% at hard–maximum effort. Exceeding 30% hard sessions correlates with overreaching.")
                sciRow(title: "Apple's effort score", body: "Apple Watch calculates the effort score using heart rate relative to your estimated max HR. Score reflects physiological strain, updated in real-time during the workout.")
            }
            Divider()
            Text("💡 If weekly session load spikes >15%, consider an easy recovery day or rest day to avoid overreaching.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.orange)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "flame.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Effort Score Data").font(.title3.bold())
            Text("Workout effort scores require Apple Watch and iOS 17+. Effort is recorded automatically for workouts started from the Workout app and reflects heart-rate-based intensity (1–10 scale).")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let effortType = HKQuantityType(.physicalEffort)
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [effortType, workoutType])) != nil
        else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()

        // Fetch workouts
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: workoutType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        // Fetch all effort samples
        let effortSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: effortType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !effortSamples.isEmpty else { return }

        // Average effort per workout by matching time windows
        var result: [WorkoutEffort] = []
        for w in workouts {
            let wEnd = w.endDate
            let wEfforts = effortSamples.filter { $0.startDate >= w.startDate && $0.endDate <= wEnd }
            guard !wEfforts.isEmpty else { continue }
            let vals = wEfforts.map { $0.quantity.doubleValue(for: HKUnit(from: "")) }
            let avg = vals.reduce(0, +) / Double(vals.count)
            guard avg > 0 else { continue }
            let dur = wEnd.timeIntervalSince(w.startDate) / 60
            let sportName: String
            switch w.workoutActivityType {
            case .running:       sportName = "Run"
            case .cycling:       sportName = "Cycle"
            case .swimming:      sportName = "Swim"
            case .hiking:        sportName = "Hike"
            case .walking:       sportName = "Walk"
            case .traditionalStrengthTraining: sportName = "Strength"
            case .highIntensityIntervalTraining: sportName = "HIIT"
            default:             sportName = "Workout"
            }
            result.append(WorkoutEffort(
                id: w.uuid,
                date: w.startDate,
                workoutName: sportName,
                durationMins: dur,
                effortScore: avg,
                avgHRPct: nil
            ))
        }

        // If no effort matched workouts, use raw effort samples grouped by day
        if result.isEmpty {
            var dayMap: [Date: [Double]] = [:]
            let cal = Calendar.current
            for s in effortSamples {
                let day = cal.startOfDay(for: s.startDate)
                let v = s.quantity.doubleValue(for: HKUnit(from: ""))
                if v > 0 { dayMap[day, default: []].append(v) }
            }
            result = dayMap.sorted { $0.key < $1.key }.map { day, vals in
                WorkoutEffort(id: UUID(), date: day, workoutName: "Workout",
                              durationMins: 45, effortScore: vals.reduce(0,+) / Double(vals.count),
                              avgHRPct: nil)
            }
        }

        guard !result.isEmpty else { return }
        sessions = result

        let scores = result.map(\.effortScore)
        avgEffort = scores.reduce(0,+) / Double(scores.count)

        let recentSessions = result.filter { $0.date >= sevenDaysAgo }
        weeklyLoad = recentSessions.map(\.sessionLoad).reduce(0,+)
        avgLoad = result.map(\.sessionLoad).reduce(0,+) / Double(result.count)

        hardPct = Double(result.filter { $0.effortScore >= 7 }.count) / Double(result.count) * 100

        // Zone distribution
        let levels: [EffortLevel] = [.light, .moderate, .vigorous, .hard, .maximum]
        zoneData = levels.map { level in
            let count = result.filter { $0.effortLevel == level }.count
            let pct = Double(count) / Double(result.count) * 100
            return ZoneEntry(id: level, level: level, count: count, pct: pct)
        }.filter { $0.count > 0 }

        // Trend: slope of effort over weeks
        if result.count >= 4 {
            let half = result.count / 2
            let first = Array(result.prefix(half)).map(\.effortScore).reduce(0,+) / Double(half)
            let last = Array(result.suffix(half)).map(\.effortScore).reduce(0,+) / Double(half)
            trendSlope = (last - first) / max(1, Double(result.count) / 7)
        }
    }
}

struct PhysicalEffortView: View {
    var body: some View {
        if #available(iOS 17.0, *) {
            PhysicalEffortContent()
        } else {
            VStack(spacing: 16) {
                Image(systemName: "flame.fill").font(.system(size: 52)).foregroundStyle(.secondary)
                Text("Requires iOS 17+").font(.title3.bold())
                Text("Workout effort score tracking requires iOS 17 or later.")
                    .font(.subheadline).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center).padding(.horizontal, 32)
            }.padding(.top, 60)
        }
    }
}

#Preview { NavigationStack { PhysicalEffortView() } }
