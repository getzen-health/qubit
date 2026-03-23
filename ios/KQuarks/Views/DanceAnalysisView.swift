import SwiftUI
import Charts
import HealthKit

// MARK: - DanceAnalysisView

/// Analyzes dance and aerobics workouts — covers HKWorkoutActivityType.dance,
/// .socialDance, .stepTraining, and .aerobics. Popular with people who do
/// Zumba, dance fitness classes, step aerobics, or social dancing (salsa, swing).
struct DanceAnalysisView: View {

    struct DanceSession: Identifiable {
        let id: UUID
        let date: Date
        let type: HKWorkoutActivityType
        let durationMins: Double
        let kcal: Double
        let avgHR: Double?

        var typeName: String {
            switch type {
            case .dance:        return "Dance"
            case .socialDance:  return "Social Dance"
            case .stepTraining: return "Step"
            default:            return "Aerobics"
            }
        }

        var typeColor: Color {
            switch type {
            case .dance:        return .pink
            case .socialDance:  return .purple
            case .stepTraining: return .orange
            default:            return .red
            }
        }
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let sessions: Int
        let totalMins: Double
    }

    @State private var sessions: [DanceSession] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalSessions: Int = 0
    @State private var avgDuration: Double = 0
    @State private var avgKcal: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let activityTypes: [HKWorkoutActivityType] = [.cardioDance, .socialDance, .stepTraining]

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    monthlyChart
                    typeBreakdownCard
                    sessionTableCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Dance & Aerobics")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("12-Month Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.pink)
                        Text("sessions")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                }
                Spacer()
                Image(systemName: "music.note")
                    .font(.system(size: 44)).foregroundStyle(.pink)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: .pink)
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

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Sessions")
                .font(.headline)
            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(x: .value("Month", b.monthStart, unit: .month),
                            y: .value("Sessions", b.sessions))
                    .foregroundStyle(Color.pink.opacity(0.75))
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

    private var typeBreakdownCard: some View {
        let typeCounts = Dictionary(grouping: sessions, by: \.typeName)
            .mapValues(\.count)
            .sorted { $0.value > $1.value }

        return VStack(alignment: .leading, spacing: 10) {
            Text("Activity Breakdown")
                .font(.headline)

            ForEach(typeCounts, id: \.key) { name, count in
                let color: Color = name == "Dance" ? .pink : name == "Social Dance" ? .purple : name == "Step" ? .orange : .red
                let fraction = Double(count) / Double(totalSessions)
                HStack(spacing: 10) {
                    Circle().fill(color).frame(width: 8, height: 8)
                    Text(name).font(.subheadline)
                    Spacer()
                    Text("\(count) sessions").font(.caption).foregroundStyle(.secondary)
                    Text(String(format: "%.0f%%", fraction * 100)).font(.caption.bold()).foregroundStyle(color)
                }
                GeometryReader { geo in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(color.opacity(0.2))
                        .overlay(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(color.opacity(0.7))
                                .frame(width: geo.size.width * fraction)
                        }
                }
                .frame(height: 6)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var sessionTableCard: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .leading)
                    Text("Type").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(minWidth: 55, alignment: .leading)
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
                        Text(s.typeName).font(.caption).foregroundStyle(s.typeColor).frame(minWidth: 55, alignment: .leading)
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

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "music.note")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Dance Sessions")
                .font(.title3.bold())
            Text("Track Zumba, dance fitness classes, step aerobics, or social dancing on Apple Watch using the Dance or Social Dance workout types.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let kcalType = HKQuantityType(.activeEnergyBurned)
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType, hrType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        var allSessions: [DanceSession] = []
        var mMap: [String: (Date, Int, Double)] = [:]

        for actType in activityTypes {
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: actType)
            ])
            let workouts: [HKWorkout] = await withCheckedContinuation { cont in
                let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                    limit: HKObjectQueryNoLimit,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
                ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
                healthStore.execute(q)
            }
            for w in workouts {
                let key = df.string(from: w.startDate)
                let ms = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
                var m = mMap[key] ?? (ms, 0, 0)
                m.1 += 1; m.2 += w.duration / 60
                mMap[key] = m

                allSessions.append(DanceSession(
                    id: w.uuid, date: w.startDate, type: actType,
                    durationMins: w.duration / 60,
                    kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                    avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)
                ))
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
        monthBuckets = mMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, sessions: val.1, totalMins: val.2)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview { NavigationStack { DanceAnalysisView() } }
