import SwiftUI
import Charts
import HealthKit

// MARK: - WaterSportsView

/// Tracks water and paddle sports: surfing, paddleboarding (SUP), kayaking,
/// canoeing, and sailing. HKWorkoutActivityType: .surfingSports, .paddleSports,
/// .waterFitness, .waterSports, .waterPolo (separate).
/// These are popular coastal and lake activities increasingly tracked on
/// Apple Watch Ultra and standard models.
struct WaterSportsView: View {

    struct WaterSession: Identifiable {
        let id: UUID
        let date: Date
        let sport: HKWorkoutActivityType
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?
        let distance: Double?  // km

        var sportName: String {
            switch sport {
            case .surfingSports:  return "Surfing"
            case .paddleSports:   return "Paddleboarding"
            case .waterFitness:   return "Water Fitness"
            case .waterSports:    return "Water Sports"
            default:              return "Water Sport"
            }
        }

        var sportColor: Color {
            switch sport {
            case .surfingSports:  return .blue
            case .paddleSports:   return .teal
            case .waterFitness:   return .cyan
            case .waterSports:    return .indigo
            default:              return .mint
            }
        }
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let sessions: Int
    }

    struct SportCount: Identifiable {
        let id: String
        let name: String
        let count: Int
        let color: Color
    }

    @State private var sessions: [WaterSession] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var sportCounts: [SportCount] = []
    @State private var totalSessions: Int = 0
    @State private var avgDuration: Double = 0
    @State private var avgKcal: Double = 0
    @State private var avgHR: Double = 0
    @State private var totalKm: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let sports: [HKWorkoutActivityType] = [.surfingSports, .paddleSports, .waterFitness, .waterSports]

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
        .navigationTitle("Water & Paddle Sports")
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
                            .foregroundStyle(.blue)
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    if totalKm > 0 {
                        Text(String(format: "%.1f km total distance", totalKm))
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                }
                Spacer()
                Image(systemName: "figure.surfing")
                    .font(.system(size: 44)).foregroundStyle(.blue)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: .blue)
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
                    .foregroundStyle(Color.blue.opacity(0.7))
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
        let df = DateFormatter()
        df.dateFormat = "MMM d"

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .leading)
                    Text("Sport").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(minWidth: 75, alignment: .leading)
                    Spacer()
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 38, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date)).font(.caption).frame(width: 60, alignment: .leading)
                        Text(s.sportName).font(.caption).foregroundStyle(s.sportColor).frame(minWidth: 75, alignment: .leading)
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
            Image(systemName: "figure.surfing")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Water Sport Sessions")
                .font(.title3.bold())
            Text("Track surfing, paddleboarding (SUP), kayaking, or water fitness on Apple Watch to see your water sport history here.")
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
        let distType = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType, hrType, distType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let kmUnit = HKUnit.meterUnit(with: .kilo)
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        var allSessions: [WaterSession] = []
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
                let session = WaterSession(
                    id: w.uuid, date: w.startDate, sport: sport,
                    durationMins: w.duration / 60,
                    kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                    avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit),
                    distance: w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: kmUnit)
                )
                allSessions.append(session)

                let mk = df.string(from: w.startDate)
                let ms = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
                var m = mMap[mk] ?? (ms, 0)
                m.1 += 1
                mMap[mk] = m

                var cur = countMap[session.sportName] ?? (0, session.sportColor)
                cur.0 += 1
                countMap[session.sportName] = cur
            }
        }

        guard !allSessions.isEmpty else { return }
        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count
        totalKm = allSessions.compactMap(\.distance).reduce(0, +)
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

#Preview { NavigationStack { WaterSportsView() } }
