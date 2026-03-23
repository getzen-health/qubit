import SwiftUI
import Charts
import HealthKit

// MARK: - YogaAnalysisView

/// Analysis of yoga and mind-body workouts (yoga, pilates, tai chi).
/// Tracks session frequency, duration, average HR, and the well-documented
/// correlation between yoga practice and next-day HRV recovery.
struct YogaAnalysisView: View {

    // MARK: - Models

    struct YogaSession: Identifiable {
        let id: UUID
        let date: Date
        let workoutType: HKWorkoutActivityType
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?

        var typeName: String {
            switch workoutType {
            case .yoga:         return "Yoga"
            case .mindAndBody:  return "Mind & Body"
            case .pilates:      return "Pilates"
            case .taiChi:       return "Tai Chi"
            default:            return "Mind-Body"
            }
        }

        var typeColor: Color {
            switch workoutType {
            case .yoga:         return .purple
            case .mindAndBody:  return .indigo
            case .pilates:      return .pink
            case .taiChi:       return .teal
            default:            return .purple
            }
        }
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let sessionCount: Int
        let totalMins: Double
    }

    // MARK: - State

    @State private var sessions: [YogaSession] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalHours: Double = 0
    @State private var avgDurationMins: Double = 0
    @State private var avgHR: Double = 0
    @State private var typeCounts: [(name: String, count: Int, color: Color)] = []
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
                    weeklySessionChart
                    if typeCounts.count > 1 { typeBreakdownCard }
                    sessionTableCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Yoga & Mind-Body")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("90-Day Practice")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.purple)
                        Text("sessions")
                            .font(.title3)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    Text(String(format: "%.1f hrs total practice time", totalHours))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.mind.and.body")
                    .font(.system(size: 44))
                    .foregroundStyle(.purple)
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDurationMins), color: .purple)
                Divider().frame(height: 36)
                statCell(label: "Avg HR", value: avgHR > 0 ? String(format: "%.0f bpm", avgHR) : "—", color: .pink)
                Divider().frame(height: 36)
                statCell(label: "Per week", value: String(format: "%.1f", Double(totalSessions) / max(1, Double(weekBuckets.count))), color: .indigo)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Weekly Sessions Chart

    private var weeklySessionChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Practice Sessions")
                .font(.headline)

            Chart {
                ForEach(weekBuckets) { b in
                    BarMark(
                        x: .value("Week", b.weekStart, unit: .weekOfYear),
                        y: .value("Sessions", b.sessionCount)
                    )
                    .foregroundStyle(Color.purple.opacity(0.7))
                    .cornerRadius(3)
                }

                RuleMark(y: .value("Target", 3))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.purple.opacity(0.4))
                    .annotation(position: .topTrailing) {
                        Text("3/wk goal")
                            .font(.caption2)
                            .foregroundStyle(.purple.opacity(0.7))
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Sessions")
            .chartYScale(domain: 0...max(7, (weekBuckets.map(\.sessionCount).max() ?? 5) + 1))
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Type Breakdown

    private var typeBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Practice Types")
                .font(.headline)

            Chart {
                ForEach(typeCounts, id: \.name) { item in
                    BarMark(
                        x: .value("Count", item.count),
                        y: .value("Type", item.name)
                    )
                    .foregroundStyle(item.color.opacity(0.75))
                    .cornerRadius(4)
                    .annotation(position: .trailing) {
                        Text("\(item.count)")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .chartXAxis(.hidden)
            .frame(height: max(Double(typeCounts.count) * 44, 80))
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Session Table

    private var sessionTableCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("Type").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(minWidth: 60, alignment: .leading)
                    Spacer()
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 35, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 45, alignment: .trailing)
                    Text("kcal").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                let df = DateFormatter()
                let _ = { df.dateFormat = "MMM d" }()

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date))
                            .font(.caption)
                            .frame(width: 65, alignment: .leading)
                        Text(s.typeName)
                            .font(.caption)
                            .foregroundStyle(s.typeColor)
                            .frame(minWidth: 60, alignment: .leading)
                        Spacer()
                        Text(String(format: "%.0f", s.durationMins))
                            .font(.caption.monospacedDigit())
                            .frame(width: 35, alignment: .trailing)
                        Text(s.avgHR.map { String(format: "%.0f", $0) } ?? "—")
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.pink)
                            .frame(width: 45, alignment: .trailing)
                        Text(String(format: "%.0f", s.kcal))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.orange)
                            .frame(width: 40, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 7)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Yoga & Recovery Science", systemImage: "brain.head.profile")
                .font(.headline)
                .foregroundStyle(.purple)

            Text("Regular yoga practice activates the parasympathetic nervous system, increasing HRV and reducing resting heart rate over time. Studies show 8–12 weeks of consistent yoga can improve HRV by 5–15%.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Low heart rate during yoga (60–80 bpm) indicates good parasympathetic activation — your body entering a restorative state that accelerates recovery.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Aim for 2–3 sessions per week to see measurable HRV improvements within 4–6 weeks.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.purple.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.mind.and.body")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Yoga Sessions")
                .font(.title3.bold())
            Text("Start a Yoga, Pilates, or Mind & Body workout on your Apple Watch to track your practice.")
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
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType, hrType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!

        // Fetch yoga, mindAndBody, pilates, tai chi
        let mindBodyTypes: [HKWorkoutActivityType] = [.yoga, .mindAndBody, .pilates, .taiChi]

        var allSessions: [YogaSession] = []
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        for actType in mindBodyTypes {
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: actType)
            ])
            let workouts: [HKWorkout] = await withCheckedContinuation { cont in
                let q = HKSampleQuery(
                    sampleType: workoutType, predicate: pred,
                    limit: HKObjectQueryNoLimit,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
                ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
                healthStore.execute(q)
            }

            for w in workouts {
                let kcal = w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0
                let avgHR = w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)
                allSessions.append(YogaSession(
                    id: w.uuid,
                    date: w.startDate,
                    workoutType: actType,
                    durationMins: w.duration / 60,
                    kcal: kcal,
                    avgHR: avgHR
                ))
            }
        }

        guard !allSessions.isEmpty else { return }

        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count
        totalHours = allSessions.map(\.durationMins).reduce(0, +) / 60
        avgDurationMins = allSessions.map(\.durationMins).reduce(0, +) / Double(allSessions.count)
        let hrValues = allSessions.compactMap(\.avgHR)
        avgHR = hrValues.isEmpty ? 0 : hrValues.reduce(0, +) / Double(hrValues.count)

        // Type breakdown
        let typeMap = Dictionary(grouping: allSessions, by: \.typeName).mapValues(\.count)
        typeCounts = typeMap.map { key, count in
            let color = allSessions.first(where: { $0.typeName == key })?.typeColor ?? .purple
            return (name: key, count: count, color: color)
        }.sorted { $0.count > $1.count }

        // Weekly buckets (Monday-anchored)
        var cal = Calendar.current
        cal.firstWeekday = 2
        var bucketMap: [String: (Date, Int, Double)] = [:]

        for s in allSessions {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            let key = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let weekStart = cal.date(from: comps) ?? s.date
            var cur = bucketMap[key] ?? (weekStart, 0, 0)
            cur.1 += 1
            cur.2 += s.durationMins
            bucketMap[key] = cur
        }

        weekBuckets = bucketMap.map { key, val in
            WeekBucket(id: key, weekStart: val.0, sessionCount: val.1, totalMins: val.2)
        }.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview {
    NavigationStack {
        YogaAnalysisView()
    }
}
