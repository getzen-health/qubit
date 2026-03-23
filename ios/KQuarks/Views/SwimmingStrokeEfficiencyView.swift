import SwiftUI
import Charts
import HealthKit

// MARK: - SwimmingStrokeEfficiencyView

/// Analyzes swimming stroke efficiency using HKQuantityType(.swimmingStrokeCount).
///
/// SWOLF Score = strokes per length + seconds per length.
/// Lower SWOLF = greater swimming efficiency. Named after "Swimming Golf."
///
/// SWOLF benchmarks (25m pool):
/// - Elite swimmers: 28–35 (sprint freestyle), 35–42 (distance)
/// - Competitive age-group: 38–48
/// - Recreational fit swimmers: 45–60
/// - Beginner/inefficient: 60+
///
/// Science:
/// - SWOLF is a validated proxy for swimming economy (Costill et al., 1985)
/// - Stroke count reduction of 2–3 per length via technique coaching predicts
///   ~5% pace improvement without additional fitness (Chatard et al., 1990)
/// - Stroke rate (SPM) and distance-per-stroke (DPS) are primary levers
struct SwimmingStrokeEfficiencyView: View {

    struct SessionStat: Identifiable {
        let id: UUID
        let date: Date
        let distanceM: Double
        let durationSecs: Double
        let strokeCount: Int
        let isPool: Bool
        let poolLengthM: Double   // 25m or 50m

        var lengths: Double { poolLengthM > 0 ? distanceM / poolLengthM : 0 }
        var strokesPerLength: Double { lengths > 0 ? Double(strokeCount) / lengths : 0 }
        var secsPerLength: Double { lengths > 0 ? durationSecs / lengths : 0 }
        var swolf: Double { strokesPerLength + secsPerLength }
        var distancePerStroke: Double { strokeCount > 0 ? distanceM / Double(strokeCount) : 0 }
        var strokeRate: Double {
            // strokes per minute
            durationSecs > 0 ? Double(strokeCount) / durationSecs * 60 : 0
        }

        var swolfLevel: SWOLFLevel { SWOLFLevel(swolf: swolf, poolLength: poolLengthM) }
    }

    enum SWOLFLevel: String {
        case elite        = "Elite"
        case competitive  = "Competitive"
        case recreational = "Recreational"
        case developing   = "Developing"

        // Thresholds tuned for 25m pool; 50m pool values are roughly 2× higher
        init(swolf: Double, poolLength: Double) {
            let scale = poolLength >= 45 ? 2.0 : 1.0  // 50m pool scaling
            let s = swolf / scale
            if s < 38      { self = .elite }
            else if s < 50 { self = .competitive }
            else if s < 62 { self = .recreational }
            else           { self = .developing }
        }

        var color: Color {
            switch self {
            case .elite:        return .blue
            case .competitive:  return .green
            case .recreational: return .yellow
            case .developing:   return .orange
            }
        }

        var advice: String {
            switch self {
            case .elite:        return "Excellent stroke efficiency — consistent with competitive or elite swimmers."
            case .competitive:  return "Strong technique. Focus on reducing stroke count per length by 1–2 to reach elite range."
            case .recreational: return "Good progress. Technique drills (catch-up, fingertip drag) can meaningfully improve SWOLF."
            case .developing:   return "Consider technique coaching. A small stroke count reduction delivers outsized SWOLF and pace improvement."
            }
        }
    }

    @State private var sessions: [SessionStat] = []
    @State private var latestSWOLF: Double = 0
    @State private var avgSWOLF: Double = 0
    @State private var bestSWOLF: Double = 0
    @State private var avgDPS: Double = 0      // distance per stroke (m)
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
                    swolfTrendChart
                    dpsChart
                    recentSessionsCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Stroke Efficiency")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let level = sessions.first?.swolfLevel ?? .recreational
        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latest SWOLF Score")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", latestSWOLF))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(level.color)
                        Text("(lower = better)")
                            .font(.caption).foregroundStyle(.secondary).padding(.bottom, 4)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(level.color).frame(width: 8, height: 8)
                        Text(level.rawValue).font(.subheadline).foregroundStyle(level.color)
                    }
                }
                Spacer()
                Image(systemName: "figure.pool.swim")
                    .font(.system(size: 44)).foregroundStyle(level.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg SWOLF", value: String(format: "%.1f", avgSWOLF), color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Best SWOLF", value: String(format: "%.1f", bestSWOLF), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Avg DPS", value: String(format: "%.2f m", avgDPS), color: .teal)
                Divider().frame(height: 36)
                statCell(label: "Sessions", value: "\(sessions.count)", color: .secondary)
            }
            Divider()
            Text(level.advice)
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
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

    // MARK: - SWOLF Trend

    private var swolfTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SWOLF Score History").font(.headline)
            Text("Lower scores = better stroke efficiency").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(sessions.sorted(by: { $0.date < $1.date })) { s in
                    LineMark(x: .value("Date", s.date),
                             y: .value("SWOLF", s.swolf))
                    .foregroundStyle(Color.blue.opacity(0.4))
                    .interpolationMethod(.monotone)
                    PointMark(x: .value("Date", s.date),
                              y: .value("SWOLF", s.swolf))
                    .foregroundStyle(s.swolfLevel.color)
                    .symbolSize(35)
                }
                // Reference lines for levels
                RuleMark(y: .value("Competitive", 50))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("50").font(.caption2).foregroundStyle(.green)
                    }
                RuleMark(y: .value("Recreational", 62))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.yellow.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("62").font(.caption2).foregroundStyle(.yellow)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("SWOLF (lower = better)")
            .chartYAxis { AxisMarks(position: .leading) }
            .frame(height: 200)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Distance Per Stroke Chart

    private var dpsChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Distance Per Stroke").font(.headline)
            Text("Meters traveled per stroke cycle — key efficiency indicator").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(sessions.sorted(by: { $0.date < $1.date })) { s in
                    BarMark(x: .value("Date", s.date, unit: .day),
                            y: .value("DPS", s.distancePerStroke))
                    .foregroundStyle(s.distancePerStroke >= 1.5 ? Color.teal.opacity(0.8) :
                                     s.distancePerStroke >= 1.2 ? Color.teal.opacity(0.5) :
                                     Color.teal.opacity(0.3))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Good", 1.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("1.5m").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("m/stroke")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Recent Sessions

    private var recentSessionsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(6)) { s in
                HStack {
                    Circle().fill(s.swolfLevel.color).frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(s.date, style: .date).font(.caption).foregroundStyle(.secondary)
                        Text(String(format: "%.0fm • %d strokes", s.distanceM, s.strokeCount))
                            .font(.caption2).foregroundStyle(.tertiary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 1) {
                        HStack(spacing: 4) {
                            Text("SWOLF")
                                .font(.caption2).foregroundStyle(.secondary)
                            Text(String(format: "%.1f", s.swolf))
                                .font(.caption.bold().monospacedDigit())
                                .foregroundStyle(s.swolfLevel.color)
                        }
                        Text(String(format: "DPS %.2fm", s.distancePerStroke))
                            .font(.caption2.monospacedDigit()).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
                if s.id != sessions.prefix(6).last?.id { Divider() }
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
                Image(systemName: "figure.pool.swim").foregroundStyle(.blue)
                Text("SWOLF Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "SWOLF formula", body: "SWOLF = strokes per length + seconds per length. Invented by researchers as a composite efficiency metric — balancing stroke count reduction with pace maintenance.")
                sciRow(title: "Validated proxy", body: "SWOLF strongly correlates with swimming economy measured by oxygen cost per metre. Elite swimmers achieve SWOLF <38 in 25m pools (Costill et al., 1985).")
                sciRow(title: "Technique impact", body: "Reducing stroke count by 2–3 per length via drills predicts ~5% pace improvement without additional cardiovascular fitness (Chatard et al., 1990).")
                sciRow(title: "Two levers", body: "Distance Per Stroke (DPS) measures propulsive efficiency. Stroke Rate (SPM) × DPS = swimming velocity. Optimise DPS first, then rate.")
            }
            Divider()
            HStack {
                VStack(spacing: 2) {
                    Text(String(format: "%.1f", avgDPS)).font(.title3.bold().monospacedDigit()).foregroundStyle(.teal)
                    Text("Avg DPS (m)").font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                Divider().frame(height: 40)
                VStack(spacing: 2) {
                    if let sr = sessions.first?.strokeRate {
                        Text(String(format: "%.0f", sr)).font(.title3.bold().monospacedDigit()).foregroundStyle(.blue)
                        Text("Stroke Rate (SPM)").font(.caption2).foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.blue.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.blue)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.pool.swim")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Stroke Data")
                .font(.title3.bold())
            Text("Stroke count data is recorded automatically when you use Apple Watch for pool swimming workouts. Complete at least one pool swim to see your SWOLF score.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let strokeType = HKQuantityType(.swimmingStrokeCount)
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(
            toShare: [], read: [strokeType, workoutType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!

        // Fetch swimming workouts
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                HKQuery.predicateForWorkouts(with: .swimming)
            ])
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        guard !workouts.isEmpty else { return }

        var result: [SessionStat] = []

        for workout in workouts {
            let distanceM = workout.totalDistance?.doubleValue(for: .meter()) ?? 0
            guard distanceM > 0 else { continue }

            // Fetch stroke count for this workout
            let strokeSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
                let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
                    HKQuery.predicateForSamples(withStart: workout.startDate, end: workout.endDate),
                    HKQuery.predicateForObjects(from: workout)
                ])
                let q = HKSampleQuery(sampleType: strokeType, predicate: pred,
                                      limit: HKObjectQueryNoLimit, sortDescriptors: nil
                ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
                healthStore.execute(q)
            }

            let totalStrokes = Int(strokeSamples.reduce(0.0) {
                $0 + $1.quantity.doubleValue(for: .count())
            })
            guard totalStrokes > 0 else { continue }

            let duration = workout.duration
            let poolLen: Double = {
                if let meta = workout.metadata?[HKMetadataKeyLapLength] as? HKQuantity {
                    return meta.doubleValue(for: .meter())
                }
                return 25.0
            }()

            result.append(SessionStat(
                id: workout.uuid,
                date: workout.startDate,
                distanceM: distanceM,
                durationSecs: duration,
                strokeCount: totalStrokes,
                isPool: true,
                poolLengthM: poolLen
            ))
        }

        guard !result.isEmpty else { return }

        sessions = result
        latestSWOLF = result.first?.swolf ?? 0
        let swolfs = result.map(\.swolf)
        avgSWOLF = swolfs.reduce(0, +) / Double(swolfs.count)
        bestSWOLF = swolfs.min() ?? 0  // lower is better
        let dpsList = result.map(\.distancePerStroke)
        avgDPS = dpsList.reduce(0, +) / Double(dpsList.count)
    }
}

#Preview { NavigationStack { SwimmingStrokeEfficiencyView() } }
