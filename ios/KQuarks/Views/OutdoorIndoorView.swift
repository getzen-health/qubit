import SwiftUI
import Charts
import HealthKit

// MARK: - OutdoorIndoorView

/// Cross-sport analysis of outdoor vs indoor workout split.
/// Apple Watch records workouts with outdoor/indoor metadata — this view
/// shows environment preference, seasonal patterns, and volume by environment.
struct OutdoorIndoorView: View {

    // MARK: - Models

    struct EnvironmentSession: Identifiable {
        let id: UUID
        let date: Date
        let sport: String
        let isOutdoor: Bool
        let durationMins: Double
        let kcal: Double
    }

    struct SportSplit: Identifiable {
        let id: String
        let sport: String
        let outdoorCount: Int
        let indoorCount: Int
        var totalCount: Int { outdoorCount + indoorCount }
        var outdoorPct: Double { totalCount > 0 ? Double(outdoorCount) / Double(totalCount) : 0 }
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let outdoorMins: Double
        let indoorMins: Double
    }

    // MARK: - State

    @State private var sessions: [EnvironmentSession] = []
    @State private var sportSplits: [SportSplit] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalOutdoor: Int = 0
    @State private var totalIndoor: Int = 0
    @State private var outdoorPct: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    monthlyTrendChart
                    sportSplitCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Outdoor vs Indoor")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 20) {
                VStack(spacing: 6) {
                    Image(systemName: "sun.max.fill")
                        .font(.title)
                        .foregroundStyle(.yellow)
                    Text("\(totalOutdoor)")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundStyle(.yellow)
                    Text("Outdoor")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                VStack(spacing: 4) {
                    ZStack {
                        Circle()
                            .stroke(Color.secondary.opacity(0.2), lineWidth: 12)
                            .frame(width: 80, height: 80)
                        Circle()
                            .trim(from: 0, to: CGFloat(outdoorPct / 100))
                            .stroke(Color.yellow, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                            .frame(width: 80, height: 80)
                        Text(String(format: "%.0f%%", outdoorPct))
                            .font(.headline.bold())
                            .foregroundStyle(.yellow)
                    }
                    Text("outdoors")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 6) {
                    Image(systemName: "building.2.fill")
                        .font(.title)
                        .foregroundStyle(.blue)
                    Text("\(totalIndoor)")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundStyle(.blue)
                    Text("Indoor")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 4)

            Divider()

            Text(outdoorAdvice)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var outdoorAdvice: String {
        if outdoorPct > 70 {
            return "You prefer the outdoors. Outdoor workouts boost vitamin D, mood, and mental well-being beyond what indoor training provides."
        } else if outdoorPct > 40 {
            return "Good balance of outdoor and indoor training. Mix of environments keeps motivation high and provides varied stimuli."
        } else {
            return "Mostly indoor training. Even 1–2 outdoor sessions per week can significantly improve mood and reduce cortisol levels."
        }
    }

    // MARK: - Monthly Trend Chart

    private var monthlyTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Environment Split")
                .font(.headline)

            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(
                        x: .value("Month", b.monthStart, unit: .month),
                        y: .value("Outdoor", b.outdoorMins)
                    )
                    .foregroundStyle(Color.yellow.opacity(0.75))

                    BarMark(
                        x: .value("Month", b.monthStart, unit: .month),
                        y: .value("Indoor", b.indoorMins)
                    )
                    .foregroundStyle(Color.blue.opacity(0.6))
                }
            }
            .chartForegroundStyleScale([
                "Outdoor": Color.yellow.opacity(0.75),
                "Indoor": Color.blue.opacity(0.6)
            ])
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("min")
            .frame(height: 180)

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    Circle().fill(Color.yellow.opacity(0.75)).frame(width: 8, height: 8)
                    Text("Outdoor").foregroundStyle(.secondary)
                }
                HStack(spacing: 4) {
                    Circle().fill(Color.blue.opacity(0.6)).frame(width: 8, height: 8)
                    Text("Indoor").foregroundStyle(.secondary)
                }
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Sport Split Card

    private var sportSplitCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Outdoor % by Sport")
                .font(.headline)

            ForEach(sportSplits.filter { $0.totalCount >= 2 }) { split in
                VStack(spacing: 4) {
                    HStack {
                        Text(split.sport)
                            .font(.subheadline)
                        Spacer()
                        Text(String(format: "%.0f%% outdoor", split.outdoorPct * 100))
                            .font(.caption.bold())
                            .foregroundStyle(split.outdoorPct > 0.5 ? .yellow : .blue)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.blue.opacity(0.25))
                                .frame(height: 8)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.yellow.opacity(0.8))
                                .frame(width: geo.size.width * split.outdoorPct, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(split.outdoorCount) outdoor / \(split.indoorCount) indoor")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "sun.and.horizon.fill")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Workout Data")
                .font(.title3.bold())
            Text("Track workouts with your Apple Watch to see your outdoor vs indoor training split.")
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

        let workoutType = HKObjectType.workoutType()
        let kcalType = HKQuantityType(.activeEnergyBurned)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType])) != nil else { return }

        let sixMonthsAgo = Calendar.current.date(byAdding: .month, value: -6, to: Date())!

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: sixMonthsAgo, end: Date())
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        let kcalUnit = HKUnit.kilocalorie()
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        var rawSessions: [EnvironmentSession] = []
        var sportMap: [String: (Int, Int)] = [:]      // sport → (outdoor, indoor)
        var monthMap: [String: (Date, Double, Double)] = [:]  // key → (monthStart, outdoorMins, indoorMins)

        for w in workouts {
            let isOutdoor = w.workoutActivityType.isOutdoor
            let sport = w.workoutActivityType.outdoorDisplayName
            let kcal = w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0
            let durationMins = w.duration / 60

            rawSessions.append(EnvironmentSession(
                id: w.uuid,
                date: w.startDate,
                sport: sport,
                isOutdoor: isOutdoor,
                durationMins: durationMins,
                kcal: kcal
            ))

            var cur = sportMap[sport] ?? (0, 0)
            if isOutdoor { cur.0 += 1 } else { cur.1 += 1 }
            sportMap[sport] = cur

            let key = df.string(from: w.startDate)
            let monthStart = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
            var m = monthMap[key] ?? (monthStart, 0, 0)
            if isOutdoor { m.1 += durationMins } else { m.2 += durationMins }
            monthMap[key] = m
        }

        sessions = rawSessions
        totalOutdoor = rawSessions.filter(\.isOutdoor).count
        totalIndoor = rawSessions.filter { !$0.isOutdoor }.count
        let total = rawSessions.count
        outdoorPct = total > 0 ? Double(totalOutdoor) / Double(total) * 100 : 0

        sportSplits = sportMap.map { sport, counts in
            SportSplit(id: sport, sport: sport, outdoorCount: counts.0, indoorCount: counts.1)
        }.sorted { $0.totalCount > $1.totalCount }

        monthBuckets = monthMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, outdoorMins: val.1, indoorMins: val.2)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

// MARK: - HKWorkoutActivityType Extensions

private extension HKWorkoutActivityType {
    var isOutdoor: Bool {
        switch self {
        case .running, .cycling, .hiking, .walking, .swimming,
             .rowing, .crossCountrySkiing, .downhillSkiing,
             .snowSports, .surfingSports, .paddleSports,
             .golf, .soccer, .tennis, .baseball, .softball,
             .basketball, .americanFootball, .rugby, .hockey:
            return true
        default:
            return false
        }
    }

    var outdoorDisplayName: String {
        switch self {
        case .running:                      return "Running"
        case .cycling:                      return "Cycling"
        case .hiking:                       return "Hiking"
        case .walking:                      return "Walking"
        case .swimming:                     return "Swimming"
        case .rowing:                       return "Rowing"
        case .yoga:                         return "Yoga"
        case .mindAndBody:                  return "Mind & Body"
        case .pilates:                      return "Pilates"
        case .functionalStrengthTraining:   return "Strength"
        case .traditionalStrengthTraining:  return "Strength"
        case .highIntensityIntervalTraining: return "HIIT"
        case .mixedMetabolicCardioTraining: return "HIIT"
        case .stairClimbing:               return "Stair Climbing"
        case .crossCountrySkiing:          return "Cross-Country Ski"
        case .downhillSkiing:              return "Downhill Ski"
        case .soccer:                      return "Soccer"
        case .tennis:                      return "Tennis"
        case .golf:                        return "Golf"
        case .basketball:                  return "Basketball"
        case .elliptical:                  return "Elliptical"
        case .crossTraining:               return "Cross Training"
        default:                           return "Other"
        }
    }
}

#Preview {
    NavigationStack {
        OutdoorIndoorView()
    }
}
