import SwiftUI
import Charts
import HealthKit

// MARK: - RunningPaceZonesView

/// Analyzes training intensity distribution across running workouts.
/// Classifies each run by pace zone relative to the user's fastest recent effort
/// and shows whether the 80/20 (easy/hard) principle is being followed.
struct RunningPaceZonesView: View {
    @State private var runs: [PaceRun] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Model

    struct PaceRun: Identifiable {
        let id: UUID
        let date: Date
        let distanceKm: Double
        let durationSecs: Double
        let zone: Int  // 1-5

        var paceSecsPerKm: Double { distanceKm > 0 ? durationSecs / distanceKm : 0 }

        var formattedPace: String {
            let s = Int(paceSecsPerKm)
            return "\(s / 60):\(String(format: "%02d", s % 60)) /km"
        }
    }

    // MARK: - Computed

    private var threshold: Double? { runs.filter { $0.distanceKm >= 3 }.map(\.paceSecsPerKm).min() }

    private var zoneTotals: [(zone: Int, secs: Double, count: Int)] {
        (1...5).map { z in
            let zRuns = runs.filter { $0.zone == z }
            return (zone: z, secs: zRuns.reduce(0) { $0 + $1.durationSecs }, count: zRuns.count)
        }
    }

    private var totalSecs: Double { zoneTotals.reduce(0) { $0 + $1.secs } }

    private var easyPct: Int {
        let easy = zoneTotals.filter { $0.zone <= 2 }.reduce(0.0) { $0 + $1.secs }
        return totalSecs > 0 ? Int((easy / totalSecs * 100).rounded()) : 0
    }

    private var hardPct: Int { 100 - easyPct }

    private var weeklyZones: [(week: String, easy: Double, hard: Double)] {
        let cal = Calendar.current
        var map: [Date: (easy: Double, hard: Double)] = [:]
        for r in runs {
            guard let monday = cal.date(from: cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: r.date)) else { continue }
            if map[monday] == nil { map[monday] = (0, 0) }
            if r.zone <= 2 { map[monday]!.easy += r.durationSecs / 60 }
            else { map[monday]!.hard += r.durationSecs / 60 }
        }
        return map.sorted { $0.key < $1.key }.suffix(12).map { (key, val) in
            let label = key.formatted(.dateTime.month(.abbreviated).day())
            return (week: label, easy: val.easy, hard: val.hard)
        }
    }

    // MARK: - Zone config

    static let zoneColors: [Int: Color] = [1: .blue, 2: .green, 3: .yellow, 4: .orange, 5: .red]
    static let zoneNames: [Int: String] = [1: "Easy", 2: "Steady", 3: "Tempo", 4: "Threshold", 5: "Race"]

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if runs.count < 3 {
                    emptyState
                } else {
                    summaryCards
                    balanceBanner
                    zonePieSection
                    weeklyChart
                    zoneTableCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Pace Zones")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.run.circle")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("Not enough run data")
                .font(.headline)
            Text("Log at least 3 outdoor runs to see your pace zone distribution.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }

    // MARK: - Summary cards

    private var summaryCards: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
            PaceZoneCard(value: "\(runs.count)", label: "Runs Analyzed", sub: "Last 90 days", color: .primary)
            PaceZoneCard(value: "\(easyPct)%", label: "Easy/Steady", sub: "Z1 + Z2", color: easyPct >= 75 ? .green : .yellow)
            PaceZoneCard(value: "\(hardPct)%", label: "Hard (Z3-5)", sub: "Tempo, threshold, race", color: hardPct <= 25 ? .green : .orange)
            PaceZoneCard(
                value: threshold.map { s in
                    let sInt = Int(s)
                    return "\(sInt / 60):\(String(format: "%02d", sInt % 60))"
                } ?? "—",
                label: "Threshold Pace",
                sub: "Fastest recorded /km",
                color: .red
            )
        }
    }

    // MARK: - 80/20 banner

    private var balanceBanner: some View {
        let isGood = easyPct >= 75
        return HStack(alignment: .top, spacing: 12) {
            Image(systemName: isGood ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                .font(.title2)
                .foregroundStyle(isGood ? .green : .orange)
            VStack(alignment: .leading, spacing: 4) {
                Text(isGood ? "\(easyPct)% easy — great 80/20 balance" : "\(easyPct)% easy — aim for ≥ 75–80%")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(isGood ? .green : .orange)
                Text(isGood
                    ? "You're building aerobic base efficiently with a good mix of easy and quality work."
                    : "Too much hard running without recovery. Add more easy/conversational-pace runs.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(isGood ? Color.green.opacity(0.08) : Color.orange.opacity(0.08))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(isGood ? Color.green.opacity(0.2) : Color.orange.opacity(0.2))
        )
        .cornerRadius(14)
    }

    // MARK: - Zone pie

    private var zonePieSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Zone Distribution")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack(spacing: 16) {
                Chart(zoneTotals, id: \.zone) { entry in
                    SectorMark(
                        angle: .value("Minutes", entry.secs / 60),
                        innerRadius: .ratio(0.55),
                        angularInset: 1.5
                    )
                    .foregroundStyle(Self.zoneColors[entry.zone] ?? .gray)
                    .opacity(entry.secs > 0 ? 1 : 0.1)
                }
                .frame(width: 160, height: 160)

                VStack(alignment: .leading, spacing: 6) {
                    ForEach(zoneTotals, id: \.zone) { entry in
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Self.zoneColors[entry.zone] ?? .gray)
                                .frame(width: 10, height: 10)
                            Text("Z\(entry.zone) \(Self.zoneNames[entry.zone]!)")
                                .font(.caption.weight(.medium))
                            Spacer()
                            Text(totalSecs > 0 ? "\(Int((entry.secs / totalSecs * 100).rounded()))%" : "—")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .cornerRadius(16)
    }

    // MARK: - Weekly chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weekly Volume by Zone (min)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(weeklyZones, id: \.week) { w in
                    BarMark(x: .value("Week", w.week), y: .value("Min", w.easy))
                        .foregroundStyle(Color.blue.opacity(0.8))
                        .cornerRadius(2)
                    BarMark(x: .value("Week", w.week), y: .value("Min", w.hard))
                        .foregroundStyle(Color.orange.opacity(0.8))
                        .cornerRadius(2)
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 6)) { val in
                    AxisValueLabel { if let s = val.as(String.self) { Text(s).font(.system(size: 9)) } }
                    AxisTick()
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisGridLine()
                    AxisValueLabel { Text("\(val.as(Int.self) ?? 0)") }
                }
            }
            .frame(height: 160)

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.blue.opacity(0.8)).frame(width: 10, height: 10)
                    Text("Easy/Steady").font(.caption2).foregroundStyle(.secondary)
                }
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.orange.opacity(0.8)).frame(width: 10, height: 10)
                    Text("Tempo/Hard").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.cardSurface)
        .cornerRadius(16)
    }

    // MARK: - Zone table

    private var zoneTableCard: some View {
        let zoneDescs: [Int: String] = [
            1: "> 125% of threshold",
            2: "110–125% of threshold",
            3: "103–110% of threshold",
            4: "98–103% of threshold",
            5: "At or near threshold",
        ]
        return VStack(alignment: .leading, spacing: 10) {
            Text("Zone Breakdown")
                .font(.subheadline.weight(.semibold))

            ForEach(zoneTotals, id: \.zone) { entry in
                HStack {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Self.zoneColors[entry.zone] ?? .gray)
                        .frame(width: 8, height: 24)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Z\(entry.zone) \(Self.zoneNames[entry.zone]!)")
                            .font(.caption.weight(.medium))
                        Text(zoneDescs[entry.zone]!)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 1) {
                        let mins = Int(entry.secs / 60)
                        Text(mins >= 60 ? "\(mins / 60)h \(mins % 60)m" : "\(mins)m")
                            .font(.caption.weight(.medium))
                        Text("\(entry.count) runs")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                if entry.zone < 5 {
                    Divider()
                }
            }

            if let t = threshold {
                let s = Int(t)
                Text("Based on threshold pace: \(s / 60):\(String(format: "%02d", s % 60)) /km")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .padding(.top, 4)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .cornerRadius(16)
    }

    // MARK: - Info card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("The 80/20 Rule")
                .font(.subheadline.weight(.semibold))
            Text("Research by Dr. Stephen Seiler shows elite endurance athletes spend ~80% of training time at low intensity (Z1–Z2) and only 20% at higher intensity. This polarized approach builds aerobic base while allowing full recovery between hard sessions.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Zones are calculated relative to your fastest recorded pace, not heart rate. For HR-based zones, see Heart Rate Zones.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color.cardSurface)
        .cornerRadius(16)
    }

    // MARK: - Data loading

    private func loadData() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let workoutPredicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            predicate,
            HKQuery.predicateForWorkouts(with: .running),
        ])

        let descriptor = HKSampleQueryDescriptor(
            predicates: [.workout(workoutPredicate)],
            sortDescriptors: [SortDescriptor(\.startDate)]
        )

        do {
            let workouts = try await descriptor.result(for: HKHealthStore())

            let runEntries: [PaceRun] = workouts.compactMap { workout in
                let distanceKm = (workout.totalDistance?.doubleValue(for: .meter()) ?? 0) / 1000
                guard distanceKm >= 0.4 else { return nil }
                let duration = workout.duration
                guard duration > 180 else { return nil }
                return PaceRun(
                    id: workout.uuid,
                    date: workout.startDate,
                    distanceKm: distanceKm,
                    durationSecs: duration,
                    zone: 1
                )
            }

            // Find fastest pace for threshold
            let threshold = runEntries.filter { $0.distanceKm >= 3 }.map(\.paceSecsPerKm).min()

            func zone(for pace: Double, threshold: Double) -> Int {
                let ratio = pace / threshold
                if ratio > 1.25 { return 1 }
                if ratio > 1.10 { return 2 }
                if ratio > 1.03 { return 3 }
                if ratio > 0.98 { return 4 }
                return 5
            }

            let classified = runEntries.map { r -> PaceRun in
                let z = threshold.map { zone(for: r.paceSecsPerKm, threshold: $0) } ?? 1
                return PaceRun(id: r.id, date: r.date, distanceKm: r.distanceKm, durationSecs: r.durationSecs, zone: z)
            }

            await MainActor.run { runs = classified }
        } catch {
            // HealthKit not available — leave empty
        }
    }
}

// MARK: - Supporting view

struct PaceZoneCard: View {
    let value: String
    let label: String
    let sub: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(color == .primary ? Color.primary : color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(.primary)
                .multilineTextAlignment(.center)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color.cardSurface)
        .cornerRadius(12)
    }
}
