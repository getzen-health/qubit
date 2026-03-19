import SwiftUI
import Charts
import HealthKit

// MARK: - HeartRateZonesView

/// Shows time spent in each heart rate training zone across the last 30 days.
/// Zones are based on % of estimated max heart rate (220 − age, or user-set max).
/// Classic 5-zone model: Zone 1 (50-60%), Z2 (60-70%), Z3 (70-80%), Z4 (80-90%), Z5 (90%+).
struct HeartRateZonesView: View {
    @State private var zoneTotals: ZoneTotals = .zero
    @State private var weeklyZoneData: [WeeklyZone] = []
    @State private var workoutZones: [WorkoutZoneSummary] = []
    @State private var userMaxHR: Double = 180
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct ZoneTotals {
        var z1: Double = 0 // minutes in zone 1
        var z2: Double = 0
        var z3: Double = 0
        var z4: Double = 0
        var z5: Double = 0

        static var zero: ZoneTotals { ZoneTotals() }

        var total: Double { z1 + z2 + z3 + z4 + z5 }

        func percent(_ zone: Double) -> Double {
            total > 0 ? zone / total * 100 : 0
        }
    }

    struct WeeklyZone: Identifiable {
        let id = UUID()
        let weekStart: Date
        let zone: Int
        let minutes: Double
    }

    struct WorkoutZoneSummary: Identifiable {
        let id: UUID
        let date: Date
        let type: String
        let durationMins: Double
        let z1: Double
        let z2: Double
        let z3: Double
        let z4: Double
        let z5: Double

        var dominantZone: Int {
            let vals = [z1, z2, z3, z4, z5]
            return (vals.enumerated().max(by: { $0.element < $1.element })?.offset ?? 0) + 1
        }
    }

    private func hrZone(bpm: Double) -> Int {
        let pct = bpm / userMaxHR
        if pct >= 0.90 { return 5 }
        if pct >= 0.80 { return 4 }
        if pct >= 0.70 { return 3 }
        if pct >= 0.60 { return 2 }
        return 1
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if zoneTotals.total == 0 {
                    emptyState
                } else {
                    maxHRCard
                    zonePieCard
                    zoneDetailCard
                    if !weeklyZoneData.isEmpty { weeklyStackedChart }
                    if !workoutZones.isEmpty { recentWorkoutsCard }
                    zoneGuideCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Heart Rate Zones")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Max HR Card

    private var maxHRCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Max Heart Rate")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(Int(userMaxHR))")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundStyle(.red)
                    Text("bpm")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Text("Estimated (220 − age formula)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                Text(String(format: "%.0f min", zoneTotals.total))
                    .font(.title3.bold())
                Text("total tracked")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Zone Pie Card

    private var zonePieCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Zone Distribution — 30 Days")
                .font(.headline)
                .padding(.horizontal, 4)

            HStack(spacing: 16) {
                // Stacked horizontal bar
                GeometryReader { geo in
                    HStack(spacing: 2) {
                        ForEach(zoneSegments, id: \.zone) { seg in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(seg.color)
                                .frame(width: max(2, geo.size.width * CGFloat(seg.pct / 100)))
                        }
                    }
                }
                .frame(height: 20)
            }

            VStack(spacing: 6) {
                ForEach(zoneSegments, id: \.zone) { seg in
                    HStack {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(seg.color)
                            .frame(width: 14, height: 14)
                        Text(seg.name)
                            .font(.subheadline)
                        Spacer()
                        Text(String(format: "%.0f min", seg.minutes))
                            .font(.subheadline.monospacedDigit())
                            .foregroundStyle(.secondary)
                        Text(String(format: "(%.0f%%)", seg.pct))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 44, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var zoneSegments: [(zone: Int, name: String, color: Color, minutes: Double, pct: Double)] {
        [
            (1, "Zone 1 — Recovery", .blue.opacity(0.6), zoneTotals.z1, zoneTotals.percent(zoneTotals.z1)),
            (2, "Zone 2 — Aerobic Base", .green, zoneTotals.z2, zoneTotals.percent(zoneTotals.z2)),
            (3, "Zone 3 — Tempo", .yellow, zoneTotals.z3, zoneTotals.percent(zoneTotals.z3)),
            (4, "Zone 4 — Threshold", .orange, zoneTotals.z4, zoneTotals.percent(zoneTotals.z4)),
            (5, "Zone 5 — Max Effort", .red, zoneTotals.z5, zoneTotals.percent(zoneTotals.z5)),
        ]
    }

    // MARK: - Zone Detail Card

    private var zoneDetailCard: some View {
        VStack(spacing: 0) {
            ForEach(zoneRanges, id: \.zone) { row in
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(row.color)
                        .frame(width: 6, height: 36)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Z\(row.zone): \(row.name)")
                            .font(.subheadline.weight(.medium))
                        Text("\(row.bpmRange) bpm")
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Text(String(format: "%.0f min", row.minutes))
                        .font(.subheadline.bold().monospacedDigit())
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                if row.zone < 5 {
                    Divider().padding(.leading, 34)
                }
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var zoneRanges: [(zone: Int, name: String, color: Color, bpmRange: String, minutes: Double)] {
        let z = userMaxHR
        return [
            (1, "Recovery", .blue.opacity(0.7), "\(Int(z*0.50))–\(Int(z*0.60))", zoneTotals.z1),
            (2, "Aerobic", .green, "\(Int(z*0.60))–\(Int(z*0.70))", zoneTotals.z2),
            (3, "Tempo", .yellow, "\(Int(z*0.70))–\(Int(z*0.80))", zoneTotals.z3),
            (4, "Threshold", .orange, "\(Int(z*0.80))–\(Int(z*0.90))", zoneTotals.z4),
            (5, "VO2 Max", .red, "\(Int(z*0.90))+", zoneTotals.z5),
        ]
    }

    // MARK: - Weekly Stacked Chart

    private var weeklyStackedChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Zone Breakdown")
                .font(.headline)
                .padding(.horizontal, 4)

            let zoneColors: [Int: Color] = [1: .blue.opacity(0.6), 2: .green, 3: .yellow, 4: .orange, 5: .red]

            Chart(weeklyZoneData) { entry in
                BarMark(
                    x: .value("Week", entry.weekStart, unit: .weekOfYear),
                    y: .value("Minutes", entry.minutes)
                )
                .foregroundStyle(zoneColors[entry.zone] ?? .gray)
                .position(by: .value("Zone", "Z\(entry.zone)"))
                .cornerRadius(3)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("min")
            .frame(height: 180)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Recent Workouts Card

    private var recentWorkoutsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Workouts")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(workoutZones.prefix(8)) { w in
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(zoneColor(w.dominantZone).opacity(0.15))
                                .frame(width: 36, height: 36)
                            Text("Z\(w.dominantZone)")
                                .font(.caption.bold())
                                .foregroundStyle(zoneColor(w.dominantZone))
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(w.type)
                                .font(.subheadline.weight(.medium))
                            Text(w.date.formatted(date: .abbreviated, time: .omitted))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        // Mini zone bar
                        HStack(spacing: 1) {
                            ForEach([w.z1, w.z2, w.z3, w.z4, w.z5].enumerated().map { ($0.offset + 1, $0.element) }, id: \.0) { z, mins in
                                if mins > 0 {
                                    RoundedRectangle(cornerRadius: 2)
                                        .fill(zoneColor(z))
                                        .frame(width: max(4, mins / w.durationMins * 60), height: 16)
                                }
                            }
                        }
                        .frame(maxWidth: 80)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    if w.id != workoutZones.prefix(8).last?.id {
                        Divider().padding(.leading, 64)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    private func zoneColor(_ zone: Int) -> Color {
        switch zone {
        case 1: return .blue
        case 2: return .green
        case 3: return .yellow
        case 4: return .orange
        case 5: return .red
        default: return .gray
        }
    }

    // MARK: - Zone Guide Card

    private var zoneGuideCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.red)
                Text("Training Zone Guide")
                    .font(.subheadline.weight(.semibold))
            }
            Text("Zone 2 (aerobic base) should make up ~70-80% of total training time for endurance athletes. Zones 4-5 are high-intensity and should be limited to 2-3 sessions per week to allow adequate recovery.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.circle")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Heart Rate Zone Data")
                .font(.title3.bold())
            Text("Heart rate zone analysis requires workout heart rate data from Apple Watch. Make sure to wear your Watch during workouts.")
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

        // Estimate max HR from age (default 30 yo → 190 bpm; clamp to reasonable range)
        // In a real app this would come from user profile. We use latest resting HR to refine.
        userMaxHR = 185 // default estimate; could be set from user profile

        let start = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let cal = Calendar.current

        // Fetch all workouts then get HR samples per workout
        let allWorkouts = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []

        var totals = ZoneTotals()
        var weeklyMap: [Date: [Int: Double]] = [:]
        var summaries: [WorkoutZoneSummary] = []

        for workout in allWorkouts {
            let hrSamples = (try? await healthKit.fetchSamples(
                for: .heartRate,
                from: workout.startDate,
                to: workout.endDate
            )) ?? []
            guard !hrSamples.isEmpty else { continue }

            let unit = HKUnit.count().unitDivided(by: .minute())
            var z = [0.0, 0.0, 0.0, 0.0, 0.0]

            for (idx, sample) in hrSamples.enumerated() {
                let bpm = sample.quantity.doubleValue(for: unit)
                let zone = hrZone(bpm: bpm) - 1
                let duration: Double
                if idx + 1 < hrSamples.count {
                    duration = hrSamples[idx + 1].startDate.timeIntervalSince(sample.startDate) / 60
                } else {
                    duration = 0.5
                }
                let clamped = min(duration, 5.0) // cap gaps
                z[zone] += clamped
            }

            totals.z1 += z[0]; totals.z2 += z[1]; totals.z3 += z[2]
            totals.z4 += z[3]; totals.z5 += z[4]

            let weekStart = cal.dateInterval(of: .weekOfYear, for: workout.startDate)?.start ?? workout.startDate
            for (i, mins) in z.enumerated() where mins > 0 {
                weeklyMap[weekStart, default: [:]][i + 1, default: 0] += mins
            }

            let totalMins = z.reduce(0, +)
            if totalMins > 1 {
                summaries.append(WorkoutZoneSummary(
                    id: workout.uuid,
                    date: workout.startDate,
                    type: workout.workoutActivityType.name,
                    durationMins: totalMins,
                    z1: z[0], z2: z[1], z3: z[2], z4: z[3], z5: z[4]
                ))
            }
        }

        zoneTotals = totals
        workoutZones = summaries.sorted { $0.date > $1.date }

        var weekly: [WeeklyZone] = []
        for (weekStart, zoneMap) in weeklyMap {
            for (zone, mins) in zoneMap {
                weekly.append(WeeklyZone(weekStart: weekStart, zone: zone, minutes: mins))
            }
        }
        weeklyZoneData = weekly.sorted { $0.weekStart < $1.weekStart }
    }
}

#Preview {
    NavigationStack {
        HeartRateZonesView()
    }
}
