import SwiftUI
import Charts
import HealthKit

// MARK: - CyclingAnalysisView

/// Aggregates cycling workouts to show speed trends, mileage, and personal bests.
struct CyclingAnalysisView: View {
    @State private var rides: [RideEntry] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    struct RideEntry: Identifiable {
        let id: UUID
        let date: Date
        let distanceKm: Double
        let durationSecs: TimeInterval
        let calories: Double?
        let avgHeartRate: Double?

        var speedKmh: Double { durationSecs > 0 ? distanceKm / (durationSecs / 3600) : 0 }

        var formattedSpeed: String { String(format: "%.1f km/h", speedKmh) }
        var formattedDistance: String { String(format: "%.1f km", distanceKm) }

        var formattedDuration: String {
            let h = Int(durationSecs) / 3600
            let m = (Int(durationSecs) % 3600) / 60
            return h > 0 ? "\(h)h \(m)m" : "\(m)m"
        }
    }

    private var recentRides: [RideEntry] { rides.suffix(30).map { $0 } }

    private var fastestRide: RideEntry? {
        rides.filter { $0.distanceKm >= 5 }.max(by: { $0.speedKmh < $1.speedKmh })
    }

    private var longestRide: RideEntry? {
        rides.max(by: { $0.distanceKm < $1.distanceKm })
    }

    private var weeklyKm: [(weekStart: Date, km: Double)] {
        guard !rides.isEmpty else { return [] }
        let cal = Calendar.current
        var weekMap: [Date: Double] = [:]
        for ride in rides {
            let weekStart = cal.dateInterval(of: .weekOfYear, for: ride.date)?.start ?? ride.date
            weekMap[weekStart, default: 0] += ride.distanceKm
        }
        return weekMap.sorted { $0.key < $1.key }.map { (weekStart: $0.key, km: $0.value) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if rides.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    speedTrendChart
                    weeklyDistanceChart
                    personalBestsCard
                    recentRidesList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cycling")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let totalKm = rides.reduce(0) { $0 + $1.distanceKm }
        let avgSpeed = rides.isEmpty ? 0 : rides.map(\.speedKmh).reduce(0, +) / Double(rides.count)

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total Rides")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(rides.count)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(.orange)
                    Text("last 90 days")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 12) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.1f km", totalKm))
                            .font(.title2.bold())
                        Text("total distance")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if avgSpeed > 0 {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.1f km/h", avgSpeed))
                                .font(.title3.bold().monospacedDigit())
                            Text("avg speed")
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

    // MARK: - Speed Trend Chart

    private var speedTrendChart: some View {
        let data = recentRides
        guard data.count >= 2 else { return AnyView(EmptyView()) }

        let speedData = data.map { (date: $0.date, kmh: $0.speedKmh) }
        let minSpeed = speedData.map(\.kmh).min() ?? 15
        let maxSpeed = speedData.map(\.kmh).max() ?? 35

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Speed Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(Array(speedData.enumerated()), id: \.offset) { _, point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Speed", point.kmh)
                    )
                    .foregroundStyle(.orange)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", point.date),
                        y: .value("Speed", point.kmh)
                    )
                    .foregroundStyle(.orange)
                    .symbolSize(30)
                }
            }
            .chartYScale(domain: max(0, minSpeed - 3)...(maxSpeed + 3))
            .chartYAxis {
                AxisMarks { v in
                    AxisValueLabel {
                        if let kmh = v.as(Double.self) {
                            Text(String(format: "%.0f", kmh))
                                .font(.caption2)
                        }
                    }
                    AxisGridLine()
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("km/h")
            .frame(height: 180)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Weekly Distance Chart

    private var weeklyDistanceChart: some View {
        guard weeklyKm.count >= 2 else { return AnyView(EmptyView()) }
        let maxKm = weeklyKm.map(\.km).max() ?? 50

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Distance")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeklyKm, id: \.weekStart) { week in
                    BarMark(
                        x: .value("Week", week.weekStart, unit: .weekOfYear),
                        y: .value("km", week.km)
                    )
                    .foregroundStyle(.orange.opacity(0.7))
                    .cornerRadius(4)
                }
            }
            .chartYAxisLabel("km")
            .chartYScale(domain: 0...(maxKm * 1.2))
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 140)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Personal Bests Card

    private var personalBestsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Personal Bests")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                if let fastest = fastestRide {
                    PRRow(
                        icon: "bolt.fill",
                        label: "Fastest avg speed",
                        value: fastest.formattedSpeed,
                        sub: fastest.date.formatted(date: .abbreviated, time: .omitted),
                        color: .yellow
                    )
                    Divider().padding(.leading, 48)
                }
                if let longest = longestRide {
                    PRRow(
                        icon: "map.fill",
                        label: "Longest ride",
                        value: longest.formattedDistance,
                        sub: longest.date.formatted(date: .abbreviated, time: .omitted),
                        color: .blue
                    )
                    if let best100 = rides.filter({ $0.distanceKm >= 90 }).max(by: { $0.speedKmh < $1.speedKmh }) {
                        Divider().padding(.leading, 48)
                        PRRow(
                            icon: "100.circle.fill",
                            label: "Best century speed",
                            value: best100.formattedSpeed,
                            sub: String(format: "%.0f km ride", best100.distanceKm),
                            color: .purple
                        )
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Recent Rides List

    private var recentRidesList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Rides")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(rides.reversed().prefix(10)) { ride in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(ride.date.formatted(date: .abbreviated, time: .omitted))
                                .font(.subheadline.weight(.medium))
                            Text("\(ride.formattedDistance) · \(ride.formattedDuration)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(ride.formattedSpeed)
                                .font(.subheadline.bold().monospacedDigit())
                                .foregroundStyle(.orange)
                            if let cal = ride.calories {
                                Text("\(Int(cal)) cal")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if ride.id != rides.reversed().prefix(10).last?.id {
                        Divider().padding(.leading, 16)
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
            Image(systemName: "figure.outdoor.cycle")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Cycling Data")
                .font(.title3.bold())
            Text("Start logging outdoor or indoor cycling workouts in the Apple Health app or via Apple Watch to see your performance trends.")
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
        let start = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let allWorkouts = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []
        rides = allWorkouts
            .filter { $0.workoutActivityType == .cycling }
            .compactMap { w -> RideEntry? in
                guard let dist = w.totalDistance?.doubleValue(for: .meter()),
                      dist > 1000 else { return nil } // skip < 1 km
                let km = dist / 1000
                return RideEntry(
                    id: w.uuid,
                    date: w.startDate,
                    distanceKm: km,
                    durationSecs: w.duration,
                    calories: w.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                    avgHeartRate: nil
                )
            }
            .sorted { $0.date < $1.date }
    }
}

#Preview {
    NavigationStack {
        CyclingAnalysisView()
    }
}
