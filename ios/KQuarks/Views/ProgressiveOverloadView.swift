import SwiftUI
import HealthKit
import Charts

// MARK: - ProgressiveOverloadView
// Tracks whether training volume is progressively increasing week-over-week.
// Progressive overload is the fundamental adaptation principle (Matveyev 1965).
// Science: Progression rule: volume should increase ≤10% per week (the "10% Rule").
//   Overload >20%/week significantly raises injury risk (Hreljac 2004, Br J Sports Med).
//   Supercompensation: Yakovlev 1955; optimal overload window 5–10% week.
//   Deload weeks (volume -20% or more) every 4th week improve long-term adaptation (Issurin 2010).

struct ProgressiveOverloadView: View {

    // MARK: - Models

    struct WeekVolume: Identifiable {
        let id = UUID()
        let weekStart: Date
        let weekLabel: String
        let durationMins: Double     // total training minutes this week
        let workoutCount: Int
        let wowChangePct: Double?    // week-over-week % change (nil for first week)
        var loadStatus: LoadStatus {
            guard let pct = wowChangePct else { return .base }
            switch pct {
            case ..<(-20): return .deload
            case -20..<0:  return .recovery
            case 0..<10:   return .good
            case 10..<20:  return .caution
            default:       return .spike
            }
        }
    }

    enum LoadStatus: String {
        case base     = "Baseline"
        case deload   = "Deload"
        case recovery = "Recovery"
        case good     = "On Track"
        case caution  = "Caution"
        case spike    = "Spike"
        var color: Color {
            switch self {
            case .base:     return .secondary
            case .deload:   return .cyan
            case .recovery: return .blue
            case .good:     return .green
            case .caution:  return .orange
            case .spike:    return .red
            }
        }
        var icon: String {
            switch self {
            case .base:     return "minus.circle"
            case .deload:   return "arrow.down.circle.fill"
            case .recovery: return "arrow.down.right.circle"
            case .good:     return "checkmark.circle.fill"
            case .caution:  return "exclamationmark.circle"
            case .spike:    return "exclamationmark.triangle.fill"
            }
        }
    }

    struct SportWeek: Identifiable {
        let id = UUID()
        let sport: String
        let icon: String
        let weeks: [WeekVolume]
        var recentWoW: Double? { weeks.last?.wowChangePct }
        var totalWeeks: Int { weeks.count }
        var avgWeeklyMins: Double {
            weeks.isEmpty ? 0 : weeks.map(\.durationMins).reduce(0, +) / Double(weeks.count)
        }
    }

    // MARK: - State

    @State private var sportWeeks: [SportWeek] = []
    @State private var overallWeeks: [WeekVolume] = []
    @State private var complianceScore: Double?
    @State private var spikeCount: Int = 0
    @State private var deloadCount: Int = 0
    @State private var isLoading = true
    @State private var selectedSport: String = "All"

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing training progression…")
                        .padding(.top, 60)
                } else if overallWeeks.isEmpty {
                    ContentUnavailableView("No Workout Data",
                        systemImage: "arrow.up.bar.chart",
                        description: Text("Log workouts in Apple Health to track progressive overload."))
                } else {
                    summaryCard
                    overallChart
                    weekTableCard
                    if !sportWeeks.isEmpty { sportBreakdownCard }
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Progressive Overload")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: complianceScore.map { String(format: "%.0f%%", $0) } ?? "—",
                    label: "Compliance",
                    sub: "weeks ≤10% jump",
                    color: complianceScore.map { $0 >= 80 ? .green : $0 >= 60 ? .orange : .red } ?? .secondary
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(spikeCount)",
                    label: "Load Spikes",
                    sub: ">10% jump",
                    color: spikeCount == 0 ? .green : spikeCount <= 2 ? .orange : .red
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(deloadCount)",
                    label: "Deloads",
                    sub: ">20% drop",
                    color: deloadCount > 0 ? .blue : .secondary
                )
            }
            .padding(.vertical, 12)

            if let score = complianceScore {
                HStack {
                    Image(systemName: score >= 80 ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .foregroundStyle(score >= 80 ? .green : .orange)
                    Text(score >= 80
                         ? "Good progression — staying within the 10% weekly increase limit"
                         : "Some weeks exceeded 10% jump — monitor for fatigue or injury risk")
                        .font(.caption)
                        .foregroundStyle(score >= 80 ? .green : .orange)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Overall Volume Chart

    private var overallChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Volume — 12 Weeks", systemImage: "arrow.up.bar.chart")
                .font(.subheadline).bold()
            Text("Total training minutes per week. Colour = week-over-week change rate. Target: < 10% increase per week.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(overallWeeks) { week in
                BarMark(
                    x: .value("Week", week.weekLabel),
                    y: .value("Minutes", week.durationMins)
                )
                .foregroundStyle(week.loadStatus.color.gradient)
                .cornerRadius(3)
            }
            .frame(height: 140)
            .chartXAxis {
                AxisMarks(values: .stride(by: 2)) { _ in
                    AxisValueLabel()
                }
            }

            HStack(spacing: 10) {
                legendDot(color: .green,  label: "On Track (<10%)")
                legendDot(color: .orange, label: "Caution (10-20%)")
                legendDot(color: .red,    label: "Spike (>20%)")
                legendDot(color: .cyan,   label: "Deload")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Week Table

    private var weekTableCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Week-by-Week Detail", systemImage: "list.bullet.rectangle")
                .font(.subheadline).bold()

            ForEach(overallWeeks.suffix(8).reversed()) { week in
                HStack {
                    Image(systemName: week.loadStatus.icon)
                        .foregroundStyle(week.loadStatus.color)
                        .frame(width: 20)
                    Text(week.weekLabel)
                        .font(.caption.monospaced())
                        .frame(width: 72, alignment: .leading)
                    Text(String(format: "%.0f min", week.durationMins))
                        .font(.caption.bold())
                        .frame(width: 60, alignment: .trailing)
                    Spacer()
                    if let pct = week.wowChangePct {
                        Text(String(format: "%+.0f%%", pct))
                            .font(.caption.bold())
                            .foregroundStyle(week.loadStatus.color)
                    } else {
                        Text("baseline")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                if week.id != overallWeeks.suffix(8).reversed().last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Sport Breakdown

    private var sportBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("By Sport (Last 4 Weeks)", systemImage: "figure.mixed.cardio")
                .font(.subheadline).bold()
            Text("Average weekly volume and current week-over-week trend per sport.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(sportWeeks.prefix(6)) { sport in
                HStack(spacing: 10) {
                    Text(sport.icon)
                        .font(.title3)
                        .frame(width: 32)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(sport.sport).font(.subheadline.bold())
                        Text(String(format: "Avg %.0f min/wk", sport.avgWeeklyMins))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    if let wow = sport.recentWoW {
                        Text(String(format: "%+.0f%%", wow))
                            .font(.caption.bold())
                            .foregroundStyle(wow > 10 ? .red : wow > 0 ? .green : .orange)
                    }
                }
                .padding(.vertical, 2)
                if sport.id != sportWeeks.prefix(6).last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Progressive Overload Science", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("Matveyev 1965 (periodization theory): Progressive overload — systematically increasing training stress — is the primary driver of adaptation. The \"10% Rule\" (Hreljac 2004, Br J Sports Med): increasing weekly running volume >10% sharply raises injury risk.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Issurin 2010 (Sports Med): Planned deload weeks every 3–4 weeks (volume -20 to -30%) allow supercompensation and extend the adaptation curve. Yakovlev 1955 supercompensation model: overload → fatigue → restoration → supercompensation.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Volume proxy: total workout duration per week. Intensity modulation (HR zones) is tracked separately in Heart Rate Zones and Interval Detector views.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.green.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .weekOfYear, value: -12, to: end) ?? Date()

        var workouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let sort = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            let q = HKSampleQuery(
                sampleType: workoutType,
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: sort
            ) { _, samples, _ in
                workouts = (samples as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        processWorkouts(workouts, start: start, end: end)
        isLoading = false
    }

    private func processWorkouts(_ workouts: [HKWorkout], start: Date, end: Date) {
        // Build week-start keys (Monday-anchored)
        var weekComponents = DateComponents()
        weekComponents.weekday = 2 // Monday

        func weekStart(for date: Date) -> Date {
            calendar.nextDate(after: date, matching: DateComponents(weekday: 2),
                              matchingPolicy: .previousTimePreservingSmallerComponents,
                              direction: .backward) ?? calendar.startOfDay(for: date)
        }

        // Aggregate by week
        var weeklyMins: [Date: Double] = [:]
        var weeklyBySport: [Date: [String: Double]] = [:]
        var sportIconMap: [String: String] = [:]

        for w in workouts {
            let ws = weekStart(for: w.startDate)
            let mins = w.duration / 60
            weeklyMins[ws, default: 0] += mins

            let sportName = w.workoutActivityType.overloadDisplayName
            weeklyBySport[ws, default: [:]][sportName, default: 0] += mins
            if sportIconMap[sportName] == nil {
                sportIconMap[sportName] = w.workoutActivityType.emoji
            }
        }

        // Build sorted week list covering last 12 weeks
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        var ws = weekStart(for: start)
        var weekList: [WeekVolume] = []
        var prevMins: Double? = nil

        while ws <= weekStart(for: end) {
            let mins = weeklyMins[ws] ?? 0
            let count = workouts.filter { weekStart(for: $0.startDate) == ws }.count
            let wow: Double? = prevMins.map { prev in
                prev > 0 ? (mins - prev) / prev * 100 : nil
            } ?? nil
            weekList.append(WeekVolume(
                weekStart: ws,
                weekLabel: formatter.string(from: ws),
                durationMins: mins,
                workoutCount: count,
                wowChangePct: wow
            ))
            prevMins = mins
            ws = calendar.date(byAdding: .weekOfYear, value: 1, to: ws) ?? Date()
        }

        // Compliance: % of non-first weeks with WoW ≤ 10%
        let nonBaseWeeks = weekList.compactMap { $0.wowChangePct }
        let compliantWeeks = nonBaseWeeks.filter { $0 <= 10 }.count
        let compliance = nonBaseWeeks.isEmpty ? nil : Double(compliantWeeks) / Double(nonBaseWeeks.count) * 100
        let spikes = weekList.filter { ($0.wowChangePct ?? 0) > 10 }.count
        let deloads = weekList.filter { ($0.wowChangePct ?? 0) < -20 }.count

        // Per-sport breakdown (last 4 weeks only)
        let last4Weeks = weekList.suffix(4).map(\.weekStart)
        var sportAgg: [String: [Date: Double]] = [:]
        for ws in last4Weeks {
            let sports = weeklyBySport[ws] ?? [:]
            for (sport, mins) in sports {
                sportAgg[sport, default: [:]][ws] = mins
            }
        }

        var sportList: [SportWeek] = []
        for (sport, wkData) in sportAgg {
            var wkList: [WeekVolume] = []
            var prev: Double? = nil
            for wk in last4Weeks.sorted() {
                let mins = wkData[wk] ?? 0
                let wow: Double? = prev.map { p in p > 0 ? (mins - p) / p * 100 : nil } ?? nil
                wkList.append(WeekVolume(weekStart: wk, weekLabel: formatter.string(from: wk),
                                         durationMins: mins, workoutCount: 0, wowChangePct: wow))
                prev = mins
            }
            sportList.append(SportWeek(sport: sport, icon: sportIconMap[sport] ?? "🏃",
                                        weeks: wkList))
        }
        sportList.sort { $0.avgWeeklyMins > $1.avgWeeklyMins }

        DispatchQueue.main.async {
            self.overallWeeks = weekList
            self.sportWeeks = sportList
            self.complianceScore = compliance
            self.spikeCount = spikes
            self.deloadCount = deloads
            self.isLoading = false
        }
    }
}

// MARK: - HKWorkoutActivityType helpers

private extension HKWorkoutActivityType {
    var overloadDisplayName: String {
        switch self {
        case .running:        return "Running"
        case .cycling:        return "Cycling"
        case .swimming:       return "Swimming"
        case .walking:        return "Walking"
        case .hiking:         return "Hiking"
        case .rowing:         return "Rowing"
        case .yoga:           return "Yoga"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength"
        case .highIntensityIntervalTraining: return "HIIT"
        case .crossTraining:  return "Cross Training"
        default:              return "Other"
        }
    }
    var emoji: String {
        switch self {
        case .running:        return "🏃"
        case .cycling:        return "🚴"
        case .swimming:       return "🏊"
        case .walking:        return "🚶"
        case .hiking:         return "🥾"
        case .rowing:         return "🚣"
        case .yoga:           return "🧘"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "🏋️"
        case .highIntensityIntervalTraining: return "⚡"
        case .crossTraining:  return "🔀"
        default:              return "🏅"
        }
    }
}
