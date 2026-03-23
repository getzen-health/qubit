import SwiftUI
import Charts
import HealthKit

// MARK: - RunningAnalysisView

/// Aggregates running workouts to show pace trends, mileage, and personal bests.
struct RunningAnalysisView: View {
    @State private var runs: [RunEntry] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct RunEntry: Identifiable {
        let id: UUID
        let date: Date
        let distanceKm: Double
        let durationSecs: TimeInterval
        let calories: Double?

        var paceSecsPerKm: Double { distanceKm > 0 ? durationSecs / distanceKm : 0 }

        var formattedPace: String {
            let secs = Int(paceSecsPerKm)
            return "\(secs / 60):\(String(format: "%02d", secs % 60)) /km"
        }

        var formattedDistance: String {
            String(format: "%.2f km", distanceKm)
        }

        var formattedDuration: String {
            let h = Int(durationSecs) / 3600
            let m = (Int(durationSecs) % 3600) / 60
            return h > 0 ? "\(h)h \(m)m" : "\(m)m"
        }
    }

    private var recentRuns: [RunEntry] { runs.suffix(30).map { $0 } }

    private var bestPace: RunEntry? {
        runs.filter { $0.distanceKm >= 1 }.min(by: { $0.paceSecsPerKm < $1.paceSecsPerKm })
    }

    private var longestRun: RunEntry? {
        runs.max(by: { $0.distanceKm < $1.distanceKm })
    }

    private var best5k: RunEntry? {
        runs.filter { $0.distanceKm >= 4.9 }.min(by: { $0.paceSecsPerKm < $1.paceSecsPerKm })
    }

    private var best10k: RunEntry? {
        runs.filter { $0.distanceKm >= 9.9 }.min(by: { $0.paceSecsPerKm < $1.paceSecsPerKm })
    }

    private var weeklyKm: [(weekStart: Date, km: Double)] {
        guard !runs.isEmpty else { return [] }
        let cal = Calendar.current
        var weekMap: [Date: Double] = [:]
        for run in runs {
            let weekStart = cal.dateInterval(of: .weekOfYear, for: run.date)?.start ?? run.date
            weekMap[weekStart, default: 0] += run.distanceKm
        }
        return weekMap.sorted { $0.key < $1.key }.map { (weekStart: $0.key, km: $0.value) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if runs.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    paceTrendChart
                    weeklyMileageChart
                    personalBestsCard
                    recentRunsList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Running")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: RunningFormView()) {
                    Image(systemName: "figure.run.motion")
                }
            }
        }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let totalKm = runs.reduce(0) { $0 + $1.distanceKm }
        let avgPace = runs.isEmpty ? 0 : runs.map(\.paceSecsPerKm).reduce(0, +) / Double(runs.count)

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total Runs")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(runs.count)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(.green)
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
                    if avgPace > 0 {
                        VStack(alignment: .trailing, spacing: 2) {
                            let secs = Int(avgPace)
                            Text("\(secs / 60):\(String(format: "%02d", secs % 60)) /km")
                                .font(.title3.bold().monospacedDigit())
                            Text("avg pace")
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

    // MARK: - Pace Trend Chart

    private var paceTrendChart: some View {
        let data = recentRuns
        guard data.count >= 2 else { return AnyView(EmptyView()) }

        let paceData = data.map { (date: $0.date, secsPerKm: $0.paceSecsPerKm) }
        let minPace = paceData.map(\.secsPerKm).min() ?? 240
        let maxPace = paceData.map(\.secsPerKm).max() ?? 400

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Pace Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(Array(paceData.enumerated()), id: \.offset) { _, point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Pace", point.secsPerKm)
                    )
                    .foregroundStyle(.green)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", point.date),
                        y: .value("Pace", point.secsPerKm)
                    )
                    .foregroundStyle(.green)
                    .symbolSize(30)
                }
            }
            // Inverted domain: lower pace (seconds/km) = faster
            .chartYScale(domain: (maxPace + 30)...(minPace - 30))
            .chartYAxis {
                AxisMarks { v in
                    AxisValueLabel {
                        if let secs = v.as(Double.self) {
                            let m = Int(secs) / 60
                            let s = Int(secs) % 60
                            Text("\(m):\(String(format: "%02d", s))")
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
            .frame(height: 180)
            .overlay(alignment: .bottomLeading) {
                Text("Lower = faster")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(8)
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Weekly Mileage

    private var weeklyMileageChart: some View {
        guard weeklyKm.count >= 2 else { return AnyView(EmptyView()) }
        let maxKm = weeklyKm.map(\.km).max() ?? 10
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
                    .foregroundStyle(.green.opacity(0.7))
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
                if let best = bestPace {
                    PRRow(icon: "bolt.fill", label: "Fastest pace", value: best.formattedPace,
                          sub: best.date.formatted(date: .abbreviated, time: .omitted), color: .yellow)
                    Divider().padding(.leading, 48)
                }
                if let longest = longestRun {
                    PRRow(icon: "map.fill", label: "Longest run", value: longest.formattedDistance,
                          sub: longest.date.formatted(date: .abbreviated, time: .omitted), color: .blue)
                    Divider().padding(.leading, 48)
                }
                if let b5 = best5k {
                    PRRow(icon: "5.circle.fill", label: "Best 5km pace", value: b5.formattedPace,
                          sub: "\(String(format: "%.1f km", b5.distanceKm)) run", color: .purple)
                    Divider().padding(.leading, 48)
                }
                if let b10 = best10k {
                    PRRow(icon: "10.circle.fill", label: "Best 10km pace", value: b10.formattedPace,
                          sub: "\(String(format: "%.1f km", b10.distanceKm)) run", color: .orange)
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Recent Runs List

    private var recentRunsList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Runs")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(runs.reversed().prefix(10)) { run in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(run.date.formatted(date: .abbreviated, time: .omitted))
                                .font(.subheadline.weight(.medium))
                            Text("\(run.formattedDistance) · \(run.formattedDuration)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(run.formattedPace)
                            .font(.subheadline.bold().monospacedDigit())
                            .foregroundStyle(.green)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if run.id != runs.reversed().prefix(10).last?.id {
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
            Image(systemName: "figure.run")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Running Data")
                .font(.title3.bold())
            Text("Start logging outdoor or treadmill runs in the Apple Health app or via Apple Watch to see your performance trends.")
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
        let allWorkouts = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []
        runs = allWorkouts
            .filter { $0.workoutActivityType == .running }
            .compactMap { w -> RunEntry? in
                guard let dist = w.totalDistance?.doubleValue(for: .meter()),
                      dist > 500 else { return nil } // skip very short runs
                let km = dist / 1000
                return RunEntry(
                    id: w.uuid,
                    date: w.startDate,
                    distanceKm: km,
                    durationSecs: w.duration,
                    calories: w.totalEnergyBurned?.doubleValue(for: .kilocalorie())
                )
            }
            .sorted { $0.date < $1.date }
    }
}

// MARK: - PR Row

struct PRRow: View {
    let icon: String
    let label: String
    let value: String
    let sub: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(sub)
                    .font(.caption2)
                    .foregroundStyle(.secondary.opacity(0.7))
            }
            Spacer()
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(.primary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}

#Preview {
    NavigationStack {
        RunningAnalysisView()
    }
}
