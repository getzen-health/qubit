import SwiftUI
import Charts
import HealthKit

// MARK: - OpenWaterSwimmingView

/// Tracks open water swimming sessions — ocean, lake, and river swims tracked
/// on Apple Watch Ultra or newer Apple Watch models in open water mode.
/// HKWorkoutActivityType.openWaterSwimming.
///
/// Open water swimming demands navigation skills, sighting technique, and
/// temperature adaptation — very different from pool swimming. Key metrics
/// are distance, pace per 100m, and HR given the environmental variability.
struct OpenWaterSwimmingView: View {

    struct OWSession: Identifiable {
        let id: UUID
        let date: Date
        let durationMins: Double
        let distanceM: Double          // meters
        let kcal: Double
        let avgHR: Double?
        var pace: Double {             // min per 100m
            distanceM > 0 ? (durationMins / distanceM) * 100 : 0
        }
    }

    struct MonthBucket: Identifiable {
        let id: String
        let monthStart: Date
        let sessions: Int
        let totalKm: Double
    }

    @State private var sessions: [OWSession] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalSessions: Int = 0
    @State private var totalKm: Double = 0
    @State private var avgPace: Double = 0     // min/100m
    @State private var avgHR: Double = 0
    @State private var bestPace: Double = 0    // min/100m (lowest = fastest)
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
                    paceChart
                    monthlyChart
                    sessionTableCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Open Water Swimming")
        .navigationBarTitleDisplayMode(.inline)
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
                        Text(String(format: "%.1f", totalKm))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.cyan)
                        Text("km")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text("\(totalSessions) sessions")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.pool.swim")
                    .font(.system(size: 44)).foregroundStyle(.cyan)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Pace", value: avgPace > 0 ? paceString(avgPace) : "—", color: .cyan)
                Divider().frame(height: 36)
                statCell(label: "Best Pace", value: bestPace > 0 ? paceString(bestPace) : "—", color: .teal)
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

    private func paceString(_ minPer100m: Double) -> String {
        let mins = Int(minPer100m)
        let secs = Int((minPer100m - Double(mins)) * 60)
        return String(format: "%d:%02d/100m", mins, secs)
    }

    // MARK: - Pace Trend Chart

    private var paceChart: some View {
        let withPace = sessions.filter { $0.pace > 0 && $0.pace < 10 }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Pace Trend (min/100m)")
                .font(.headline)
            Text("Lower = faster")
                .font(.caption).foregroundStyle(.secondary)

            Chart {
                ForEach(withPace) { s in
                    LineMark(x: .value("Date", s.date),
                             y: .value("Pace", s.pace))
                    .foregroundStyle(Color.cyan.opacity(0.6))
                    .interpolationMethod(.catmullRom)
                }
                ForEach(withPace) { s in
                    PointMark(x: .value("Date", s.date),
                              y: .value("Pace", s.pace))
                    .foregroundStyle(.cyan)
                    .symbolSize(30)
                }
                if avgPace > 0 {
                    RuleMark(y: .value("Avg", avgPace))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.5))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("min/100m")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Distance Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Distance (km)")
                .font(.headline)
            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(x: .value("Month", b.monthStart, unit: .month),
                            y: .value("km", b.totalKm))
                    .foregroundStyle(Color.cyan.opacity(0.7))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("km")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Session Table

    private var sessionTableCard: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("km").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                    Text("Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 38, alignment: .trailing)
                    Text("Pace").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .trailing)
                    Text("HR").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 40, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(sessions.suffix(12).reversed()) { s in
                    Divider()
                    HStack {
                        Text(df.string(from: s.date)).font(.caption).frame(width: 65, alignment: .leading)
                        Text(String(format: "%.2f", s.distanceM / 1000)).font(.caption.monospacedDigit()).foregroundStyle(.cyan).frame(width: 40, alignment: .trailing)
                        Text(String(format: "%.0f", s.durationMins)).font(.caption.monospacedDigit()).frame(width: 38, alignment: .trailing)
                        Text(s.pace > 0 && s.pace < 10 ? paceString(s.pace) : "—").font(.caption.monospacedDigit()).foregroundStyle(.teal).frame(width: 60, alignment: .trailing)
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
            Image(systemName: "figure.pool.swim")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Open Water Swim Data")
                .font(.title3.bold())
            Text("Track open water swims in the ocean, lake, or river on Apple Watch using the Open Water Swim workout type to see pace and distance here.")
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
        let distType = HKQuantityType(.distanceSwimming)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, kcalType, hrType, distType])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date())!
        let kcalUnit = HKUnit.kilocalorie()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let mUnit = HKUnit.meter()
        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date()),
            HKQuery.predicateForWorkouts(with: .swimming)
        ])

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        // Filter to likely outdoor swims: distance > 200m (pool laps are shorter per session)
        let filteredWorkouts = workouts.filter { w in
            let dist = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: mUnit) ?? 0
            return dist > 200
        }

        guard !filteredWorkouts.isEmpty else { return }

        var allSessions: [OWSession] = []
        var mMap: [String: (Date, Int, Double)] = [:]

        for w in filteredWorkouts {
            let dist = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: mUnit) ?? 0
            let session = OWSession(
                id: w.uuid, date: w.startDate,
                durationMins: w.duration / 60,
                distanceM: dist,
                kcal: w.statistics(for: kcalType)?.sumQuantity()?.doubleValue(for: kcalUnit) ?? 0,
                avgHR: w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit)
            )
            allSessions.append(session)

            let mk = df.string(from: w.startDate)
            let ms = cal.date(from: cal.dateComponents([.year, .month], from: w.startDate)) ?? w.startDate
            var m = mMap[mk] ?? (ms, 0, 0)
            m.1 += 1; m.2 += dist / 1000
            mMap[mk] = m
        }

        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count
        totalKm = allSessions.map { $0.distanceM / 1000 }.reduce(0, +)
        let paces = allSessions.filter { $0.pace > 0 && $0.pace < 10 }.map(\.pace)
        avgPace = paces.isEmpty ? 0 : paces.reduce(0, +) / Double(paces.count)
        bestPace = paces.min() ?? 0
        let hrs = allSessions.compactMap(\.avgHR)
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)
        monthBuckets = mMap.map { key, val in
            MonthBucket(id: key, monthStart: val.0, sessions: val.1, totalKm: val.2)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview { NavigationStack { OpenWaterSwimmingView() } }
