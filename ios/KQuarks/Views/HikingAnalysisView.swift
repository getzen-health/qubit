import SwiftUI
import Charts
import HealthKit

// MARK: - HikingAnalysisView

/// Aggregates hiking workouts to show distance trends, elevation (floors proxy),
/// personal bests, and recent hike log.
struct HikingAnalysisView: View {
    @State private var hikes: [HikeEntry] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct HikeEntry: Identifiable {
        let id: UUID
        let date: Date
        let distanceKm: Double
        let durationSecs: TimeInterval
        let calories: Double?
        let avgHR: Double?
        let floors: Double?       // flights climbed during hike (elevation proxy)

        var paceMinPerKm: Double { distanceKm > 0 ? durationSecs / 60 / distanceKm : 0 }

        var formattedPace: String {
            let total = Int(paceMinPerKm)
            return "\(total / 60 > 0 ? "\(total / 60)h " : "")\(total % 60):\(String(format: "%02d", Int((paceMinPerKm - Double(total)) * 60))) /km"
        }

        var formattedDuration: String {
            let h = Int(durationSecs) / 3600
            let m = (Int(durationSecs) % 3600) / 60
            return h > 0 ? "\(h)h \(m)m" : "\(m)m"
        }

        var formattedDistance: String {
            String(format: "%.1f km", distanceKm)
        }
    }

    private var recentHikes: [HikeEntry] { hikes.suffix(15).map { $0 } }
    private var longestHike: HikeEntry? { hikes.max(by: { $0.distanceKm < $1.distanceKm }) }
    private var highestElevationHike: HikeEntry? { hikes.filter { $0.floors != nil }.max(by: { ($0.floors ?? 0) < ($1.floors ?? 0) }) }
    private var totalDistanceKm: Double { hikes.map(\.distanceKm).reduce(0, +) }

    private var weeklyData: [(week: Date, km: Double, count: Int)] {
        let cal = Calendar.current
        var byWeek: [Date: (km: Double, count: Int)] = [:]
        for h in hikes {
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: h.date)
            if let monday = cal.date(from: comps) {
                let prev = byWeek[monday] ?? (0, 0)
                byWeek[monday] = (prev.km + h.distanceKm, prev.count + 1)
            }
        }
        return byWeek.sorted { $0.key < $1.key }.map { (week: $0.key, km: $0.value.km, count: $0.value.count) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if hikes.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    if weeklyData.count >= 3 { weeklyDistanceChart }
                    if hikes.count >= 3 { distanceTrendChart }
                    personalBestsCard
                    recentHikesList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Hiking")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Hiking Sessions")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(hikes.count)")
                        .font(.system(size: 52, weight: .bold, design: .rounded))
                        .foregroundStyle(.green)
                    Text("last 90 days")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f km", totalDistanceKm))
                            .font(.title2.bold())
                        Text("total distance")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if let avg = hikes.map(\.distanceKm).reduce(0, +) / Double(max(1, hikes.count)) as Double? {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.1f km", avg))
                                .font(.title3.bold())
                                .foregroundStyle(.teal)
                            Text("avg distance")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Weekly Distance Chart

    private var weeklyDistanceChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Distance (km)")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeklyData, id: \.week) { d in
                    BarMark(
                        x: .value("Week", d.week),
                        y: .value("km", d.km)
                    )
                    .foregroundStyle(Color.green.opacity(0.75))
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("km")
            .frame(height: 150)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Distance Trend Chart

    private var distanceTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Hike Distance Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            let dists = hikes.map(\.distanceKm)
            let minD = (dists.min() ?? 0) * 0.9
            let maxD = (dists.max() ?? 10) * 1.1

            Chart {
                ForEach(Array(hikes.enumerated()), id: \.offset) { _, h in
                    LineMark(
                        x: .value("Date", h.date),
                        y: .value("km", h.distanceKm)
                    )
                    .foregroundStyle(.green)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", h.date),
                        y: .value("km", h.distanceKm)
                    )
                    .foregroundStyle(.green)
                    .symbolSize(30)
                }
            }
            .chartYScale(domain: max(0, minD)...maxD)
            .chartYAxisLabel("km")
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 150)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Personal Bests Card

    private var personalBestsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "trophy.fill")
                    .foregroundStyle(.yellow)
                Text("Personal Bests")
                    .font(.subheadline.weight(.semibold))
            }
            if let longest = longestHike {
                PRRow(icon: "map.fill", color: .green, label: "Longest Hike",
                      value: longest.formattedDistance,
                      subtitle: longest.date.formatted(date: .abbreviated, time: .omitted) + " · " + longest.formattedDuration)
            }
            if let highEl = highestElevationHike, let floors = highEl.floors {
                PRRow(icon: "mountain.2.fill", color: .teal, label: "Most Elevation",
                      value: String(format: "%.0f floors", floors),
                      subtitle: highEl.date.formatted(date: .abbreviated, time: .omitted))
            }
            PRRow(icon: "figure.hiking", color: .brown, label: "90-Day Total",
                  value: String(format: "%.0f km", totalDistanceKm),
                  subtitle: "\(hikes.count) hikes")
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Recent Hikes List

    private var recentHikesList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Hikes")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(recentHikes.reversed()) { h in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(h.date.formatted(date: .abbreviated, time: .omitted))
                                .font(.subheadline.weight(.medium))
                            HStack(spacing: 8) {
                                if let fl = h.floors {
                                    Label(String(format: "%.0f floors", fl), systemImage: "mountain.2")
                                        .foregroundStyle(.teal)
                                }
                                if let hr = h.avgHR {
                                    Label("\(Int(hr)) bpm", systemImage: "heart.fill")
                                        .foregroundStyle(.pink)
                                }
                            }
                            .font(.caption2)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text(h.formattedDistance)
                                .font(.subheadline.bold().monospacedDigit())
                                .foregroundStyle(.green)
                            Text(h.formattedDuration)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            if let cal = h.calories {
                                Text("\(Int(cal)) kcal")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal)

                    if h.id != recentHikes.reversed().last?.id {
                        Divider().padding(.leading)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.hiking")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Hikes Found")
                .font(.title3.bold())
            Text("Hiking workouts from Apple Health, Apple Fitness, or compatible apps will appear here. Make sure to log hikes as 'Hiking' in your workout app.")
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

        let start = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let all = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []
        let hikingWorkouts = all.filter { $0.workoutActivityType == .hiking }

        // For each hike, also fetch flights climbed in that window as elevation proxy
        hikes = await withTaskGroup(of: HikeEntry?.self) { group in
            for w in hikingWorkouts {
                group.addTask {
                    let distM = w.statistics(for: HKQuantityType(.distanceWalkingRunning))
                        .flatMap { $0.sumQuantity() }
                        .map { $0.doubleValue(for: HKUnit(from: "m")) }
                    let distKm = (distM ?? 0) / 1000

                    guard distKm >= 0.5 else { return nil }

                    let cal = w.statistics(for: HKQuantityType(.activeEnergyBurned))
                        .flatMap { $0.sumQuantity() }
                        .map { $0.doubleValue(for: .kilocalorie()) }

                    let avgHR = w.statistics(for: HKQuantityType(.heartRate))
                        .flatMap { $0.averageQuantity() }
                        .map { $0.doubleValue(for: HKUnit(from: "count/min")) }

                    let floors = w.statistics(for: HKQuantityType(.flightsClimbed))
                        .flatMap { $0.sumQuantity() }
                        .map { $0.doubleValue(for: .count()) }

                    return HikeEntry(
                        id: w.uuid,
                        date: w.startDate,
                        distanceKm: distKm,
                        durationSecs: w.duration,
                        calories: cal,
                        avgHR: avgHR,
                        floors: floors
                    )
                }
            }
            var result: [HikeEntry] = []
            for await entry in group {
                if let e = entry { result.append(e) }
            }
            return result.sorted { $0.date < $1.date }
        }
    }
}

#Preview {
    NavigationStack {
        HikingAnalysisView()
    }
}
