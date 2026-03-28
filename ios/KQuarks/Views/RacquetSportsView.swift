import SwiftUI
import Charts
import HealthKit

// MARK: - RacquetSportsView

/// Covers the full racquet sports family: pickleball, badminton, racquetball,
/// and squash. These are high-intensity intermittent sports with short explosive
/// rallies and active rest periods — similar cardiovascular profile to tennis.
/// HKWorkoutActivityType: .pickleball, .badminton, .racquetball, .squash.
struct RacquetSportsView: View {

    struct RacquetSession: Identifiable {
        let id: UUID
        let date: Date
        let sport: HKWorkoutActivityType
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?
        let maxHR: Double?

        var sportName: String {
            switch sport {
            case .pickleball:  return "Pickleball"
            case .badminton:   return "Badminton"
            case .racquetball: return "Racquetball"
            case .squash:      return "Squash"
            default:           return "Racquet Sport"
            }
        }

        var sportColor: Color {
            switch sport {
            case .pickleball:  return .green
            case .badminton:   return .yellow
            case .racquetball: return .blue
            case .squash:      return .orange
            default:           return .teal
            }
        }
    }

    struct SportCount: Identifiable {
        let id: String
        let name: String
        let count: Int
        let color: Color
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let sessions: Int
    }

    @State private var sessions: [RacquetSession] = []
    @State private var sportCounts: [SportCount] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalSessions: Int = 0
    @State private var avgDuration: Double = 0
    @State private var avgKcal: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let sports: [HKWorkoutActivityType] = [.pickleball, .badminton, .racquetball, .squash]

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    sportMixCard
                    monthlyChart
                    sessionTableCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Racquet Sports")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("12-Month Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.green)
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text(topSportSummary).font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.badminton")
                    .font(.system(size: 44)).foregroundStyle(.green)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Avg kcal", value: String(format: "%.0f", avgKcal), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Avg HR", value: avgHR > 0 ? "\(Int(avgHR)) bpm" : "—", color: .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var topSportSummary: String {
        guard let top = sportCounts.first else { return "" }
        return "\(top.name) is your most played sport"
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Sport Mix Card

    private var sportMixCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Sport Breakdown")
                .font(.headline)

            ForEach(sportCounts) { sc in
                let fraction = Double(sc.count) / Double(totalSessions)
                HStack(spacing: 10) {
                    Circle().fill(sc.color).frame(width: 8, height: 8)
                    Text(sc.name).font(.subheadline)
                    Spacer()
                    Text("\(sc.count)").font(.caption.bold()).foregroundStyle(sc.color)
                    Text(String(format: "(%.0f%%)", fraction * 100)).font(.caption).foregroundStyle(.secondary)
                }
                GeometryReader { geo in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(sc.color.opacity(0.15))
                        .overlay(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(sc.color.opacity(0.75))
                                .frame(width: geo.size.width * fraction)
                        }
                }
                .frame(height: 7)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Sessions")
                .font(.headline)
            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(x: .value("Month", b.monthStart, unit: .month),
                            y: .value("Sessions", b.sessions))
                    .foregroundStyle(Color.green.opacity(0.75))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Session Table

    private var sessionTableCard: some View {

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .leading)
                    Text("Sport").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(minWidth: 70, alignment: .leading)
                    Spacer()
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 38, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(s.date.kqFormat("MMM d")).font(.caption).frame(width: 60, alignment: .leading)
                        Text(s.sportName).font(.caption).foregroundStyle(s.sportColor).frame(minWidth: 70, alignment: .leading)
                        Spacer()
                        Text(String(format: "%.0f", s.durationMins)).font(.caption.monospacedDigit()).frame(width: 38, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal)).font(.caption.monospacedDigit()).foregroundStyle(.orange).frame(width: 45, alignment: .trailing)
                        Text(s.avgHR.map { String(format: "%.0f", $0) } ?? "—").font(.caption.monospacedDigit()).foregroundStyle(.red).frame(width: 40, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 7)
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
            Image(systemName: "figure.badminton")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Racquet Sport Sessions")
                .font(.title3.bold())
            Text("Track pickleball, badminton, racquetball, or squash on Apple Watch using the appropriate sport type to see your session history here.")
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
        let kcalType = HKQuantityType(.activeEnergyBurned)
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType, hrType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let cal = Calendar.current

        var allSessions: [RacquetSession] = []
        var mMap: [String: (Date, Int)] = [:]
        var countMap: [String: (Int, Color)] = [:]

        for sport in sports {
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: sport)
            ])
            let workouts: [HKWorkout] = await withCheckedContinuation { cont in
                let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                    limit: HKObjectQueryNoLimit,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
                ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
                healthStore.execute(q)
            }
            for w in workouts {
                let session = RacquetSession(
                    id: w.uuid, date: w.startDate, sport: sport,
                    durationMins: w.duration / 60,
                    kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                    avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit),
                    maxHR: w.statistics(for: hrType)?.maximumQuantity()?.doubleValue(for: hrUnit)
                )
                allSessions.append(session)

                let monthKey = w.startDate.kqFormat("yyyy-MM")
                let ms = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
                var m = mMap[monthKey] ?? (ms, 0)
                m.1 += 1
                mMap[monthKey] = m

                var cur = countMap[session.sportName] ?? (0, session.sportColor)
                cur.0 += 1
                countMap[session.sportName] = cur
            }
        }

        guard !allSessions.isEmpty else { return }
        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count
        avgDuration = allSessions.map(\.durationMins).reduce(0, +) / Double(allSessions.count)
        avgKcal = allSessions.map(\.kcal).reduce(0, +) / Double(allSessions.count)
        let hrs = allSessions.compactMap(\.avgHR)
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)
        sportCounts = countMap.map { name, val in
            SportCount(id: name, name: name, count: val.0, color: val.1)
        }.sorted { $0.count > $1.count }
        monthBuckets = mMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, sessions: val.1)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview { NavigationStack { RacquetSportsView() } }
