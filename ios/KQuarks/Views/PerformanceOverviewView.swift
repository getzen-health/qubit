import SwiftUI
import Charts
import HealthKit

/// Cross-sport year-over-year performance comparison.
/// Compares the last 30 days against the same 30-day window one year ago
/// across all major sports, plus cardio health markers from Supabase.
struct PerformanceOverviewView: View {

    // MARK: - Data structs

    private struct SportSnapshot: Identifiable {
        let id: String
        let icon: String
        let color: Color
        let nowSessions: Int
        let thenSessions: Int
        let nowAvgMetric: Double?    // pace, speed, or duration
        let thenAvgMetric: Double?
        let metricLabel: String
        let metricFormatter: (Double) -> String
        let nowTotalKm: Double
        let thenTotalKm: Double
        let nowTotalMins: Double
        let thenTotalMins: Double
    }

    private enum Direction { case positive, negative, same }

    // MARK: - State

    @State private var snapshots: [SportSnapshot] = []
    @State private var nowRHR: Double? = nil
    @State private var thenRHR: Double? = nil
    @State private var nowHRV: Double? = nil
    @State private var thenHRV: Double? = nil
    @State private var nowWeeklyWorkouts: Double = 0
    @State private var thenWeeklyWorkouts: Double = 0
    @State private var nowWeeklyMins: Double = 0
    @State private var thenWeeklyMins: Double = 0
    @State private var isLoading = true

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else {
                VStack(spacing: 16) {
                    trainingVolumeCard
                    if nowRHR != nil || nowHRV != nil { cardioMarkersCard }
                    sportBreakdown
                    interpretationCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Performance Overview")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Training Volume Card

    private var trainingVolumeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Training Volume (avg/week)")
                .font(.headline)

            HStack(spacing: 0) {
                volumeColumn(label: "Workouts", now: String(format: "%.1f", nowWeeklyWorkouts),
                             then: String(format: "%.1f", thenWeeklyWorkouts),
                             dir: direction(now: nowWeeklyWorkouts, then: thenWeeklyWorkouts, higherIsBetter: true))
                Divider().frame(height: 60)
                volumeColumn(label: "Minutes", now: String(format: "%.0f", nowWeeklyMins),
                             then: String(format: "%.0f", thenWeeklyMins),
                             dir: direction(now: nowWeeklyMins, then: thenWeeklyMins, higherIsBetter: true))
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func volumeColumn(label: String, now: String, then: String, dir: Direction) -> some View {
        VStack(spacing: 4) {
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(now).font(.title2.bold().monospacedDigit())
            HStack(spacing: 2) {
                Text(dirArrow(dir)).foregroundStyle(dirColor(dir))
                Text("vs \(then)").font(.caption2).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Cardio Markers Card

    private var cardioMarkersCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cardiovascular Health")
                .font(.headline)
            Text("90-day averages · now vs 1 year ago")
                .font(.caption)
                .foregroundStyle(.secondary)

            if let now = nowRHR {
                markerRow(label: "Resting Heart Rate", now: "\(Int(now)) bpm",
                          then: thenRHR.map { "\(Int($0)) bpm" } ?? "—",
                          dir: direction(now: now, then: thenRHR ?? now, higherIsBetter: false),
                          icon: "heart.fill", color: .red)
                Divider()
            }
            if let now = nowHRV {
                markerRow(label: "HRV", now: "\(Int(now)) ms",
                          then: thenHRV.map { "\(Int($0)) ms" } ?? "—",
                          dir: direction(now: now, then: thenHRV ?? now, higherIsBetter: true),
                          icon: "waveform.path.ecg", color: .purple)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func markerRow(label: String, now: String, then: String, dir: Direction, icon: String, color: Color) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(color).frame(width: 24)
            Text(label).font(.subheadline)
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                HStack(spacing: 4) {
                    Text(now).font(.subheadline.bold().monospacedDigit())
                    Text(dirArrow(dir)).foregroundStyle(dirColor(dir)).font(.footnote.bold())
                }
                Text("vs \(then)").font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Sport Breakdown

    private var sportBreakdown: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Sport-by-Sport Breakdown")
                .font(.headline)

            if snapshots.isEmpty {
                Text("No workout data found for comparison.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 24)
            } else {
                ForEach(snapshots) { s in
                    sportCard(s)
                }
            }
        }
    }

    private func sportCard(_ s: SportSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(s.icon)
                    .font(.title2)
                Text(s.id)
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Text("Last 30d vs 1yr ago")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            let sessionDir = direction(now: Double(s.nowSessions), then: Double(s.thenSessions), higherIsBetter: true)
            let minsDir    = direction(now: s.nowTotalMins, then: s.thenTotalMins, higherIsBetter: true)

            HStack(spacing: 8) {
                miniCell(label: "Sessions",
                         now: "\(s.nowSessions)", then: "\(s.thenSessions)", dir: sessionDir)

                if let nowM = s.nowAvgMetric {
                    let isPace = s.metricLabel.contains("pace") || s.metricLabel.contains("100m")
                    let metDir = direction(now: nowM, then: s.thenAvgMetric ?? nowM, higherIsBetter: !isPace)
                    miniCell(label: s.metricLabel,
                             now: s.metricFormatter(nowM),
                             then: s.thenAvgMetric.map { s.metricFormatter($0) } ?? "—",
                             dir: metDir)
                }

                miniCell(label: "Minutes",
                         now: String(format: "%.0f", s.nowTotalMins),
                         then: String(format: "%.0f", s.thenTotalMins),
                         dir: minsDir)

                if s.nowTotalKm > 0 || s.thenTotalKm > 0 {
                    let kmDir = direction(now: s.nowTotalKm, then: s.thenTotalKm, higherIsBetter: true)
                    miniCell(label: "km",
                             now: String(format: "%.0f", s.nowTotalKm),
                             then: String(format: "%.0f", s.thenTotalKm),
                             dir: kmDir)
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func miniCell(label: String, now: String, then: String, dir: Direction) -> some View {
        VStack(spacing: 3) {
            Text(label).font(.system(size: 9)).foregroundStyle(.secondary)
            HStack(spacing: 2) {
                Text(now).font(.system(size: 13, weight: .bold, design: .monospaced))
                Text(dirArrow(dir)).font(.system(size: 10, weight: .bold)).foregroundStyle(dirColor(dir))
            }
            Text(then).font(.system(size: 10)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color(.systemFill).opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Interpretation Card

    private var interpretationCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("How to Read This", systemImage: "info.circle.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.blue)
            Text("↑ green = improvement vs last year · ↓ red = decline. For pace metrics, a slower pace is a decline. For resting heart rate, an increase is a decline. Comparison window: last 30 days vs the same 30-day window 12 months ago.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let store = HKHealthStore()
        let workoutType = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType])) != nil else { return }

        let now = Date()
        let cal = Calendar.current

        // "Now" window: last 30 days
        let nowStart  = cal.date(byAdding: .day, value: -30,  to: now) ?? now
        // "Then" window: 12 months ago ±30 days
        let thenEnd   = cal.date(byAdding: .day, value: -335, to: now) ?? now
        let thenStart = cal.date(byAdding: .day, value: -365, to: now) ?? now

        // Fetch all workouts spanning both windows in one query
        let fullStart = thenStart
        let pred = HKQuery.predicateForSamples(withStart: fullStart, end: now)

        let allWorkouts = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred, limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let nowWorkouts  = allWorkouts.filter { $0.startDate >= nowStart }
        let thenWorkouts = allWorkouts.filter { $0.startDate >= thenStart && $0.startDate <= thenEnd }

        // Build sport-specific snapshots
        let sportDefs: [(id: String, icon: String, color: Color, types: Set<HKWorkoutActivityType>, usePace: Bool, useSpeed: Bool)] = [
            ("Running",  "🏃", .orange, [.running], true, false),
            ("Cycling",  "🚴", .blue,   [.cycling], false, true),
            ("Swimming", "🏊", .cyan,   [.swimming], true, false),
            ("Hiking",   "🥾", .green,  [.hiking], true, false),
            ("Strength", "💪", .red,    [.traditionalStrengthTraining, .functionalStrengthTraining, .coreTraining, .crossTraining], false, false),
            ("HIIT",     "⚡", .pink,   [.highIntensityIntervalTraining], false, false),
            ("Rowing",   "🚣", .purple, [.rowing, .paddleSports], false, true),
        ]

        var builtSnapshots: [SportSnapshot] = []

        for def in sportDefs {
            let nowS  = nowWorkouts.filter  { def.types.contains($0.workoutActivityType) }
            let thenS = thenWorkouts.filter { def.types.contains($0.workoutActivityType) }

            guard nowS.count > 0 || thenS.count > 0 else { continue }

            let nowKm   = nowS.compactMap  { $0.totalDistance?.doubleValue(for: .meter()) }.reduce(0, +) / 1000
            let thenKm  = thenS.compactMap { $0.totalDistance?.doubleValue(for: .meter()) }.reduce(0, +) / 1000
            let nowMins  = nowS.map  { $0.duration / 60 }.reduce(0, +)
            let thenMins = thenS.map { $0.duration / 60 }.reduce(0, +)

            var metricLabel = "avg session"
            var nowMetric: Double? = nil
            var thenMetric: Double? = nil
            var formatter: (Double) -> String = { String(format: "%.0f min", $0) }

            if def.usePace {
                // pace = minsPerKm
                let nowPaces = nowS.compactMap { w -> Double? in
                    let distKm = (w.totalDistance?.doubleValue(for: .meter()) ?? 0) / 1000
                    guard distKm > 0.2, w.duration > 60 else { return nil }
                    let minsPerKm = (w.duration / 60) / distKm
                    return (minsPerKm > 2 && minsPerKm < 30) ? minsPerKm : nil
                }
                let thenPaces = thenS.compactMap { w -> Double? in
                    let distKm = (w.totalDistance?.doubleValue(for: .meter()) ?? 0) / 1000
                    guard distKm > 0.2, w.duration > 60 else { return nil }
                    let minsPerKm = (w.duration / 60) / distKm
                    return (minsPerKm > 2 && minsPerKm < 30) ? minsPerKm : nil
                }
                metricLabel = def.id == "Swimming" ? "pace /100m" : "avg pace"
                if def.id == "Swimming" {
                    nowMetric  = nowPaces.isEmpty  ? nil : nowPaces.reduce(0, +) / Double(nowPaces.count) * 6.0
                    thenMetric = thenPaces.isEmpty ? nil : thenPaces.reduce(0, +) / Double(thenPaces.count) * 6.0
                    formatter = { v in
                        let s = Int(v); let m = s / 60; let sec = s % 60
                        return String(format: "%d:%02d /100m", m, sec)
                    }
                } else {
                    nowMetric  = nowPaces.isEmpty  ? nil : nowPaces.reduce(0, +) / Double(nowPaces.count)
                    thenMetric = thenPaces.isEmpty ? nil : thenPaces.reduce(0, +) / Double(thenPaces.count)
                    formatter = { v in
                        let m = Int(v); let s = Int((v - Double(m)) * 60)
                        return String(format: "%d:%02d /km", m, s)
                    }
                }
            } else if def.useSpeed {
                metricLabel = "avg speed"
                let nowSpeeds = nowS.compactMap { w -> Double? in
                    let distKm = (w.totalDistance?.doubleValue(for: .meter()) ?? 0) / 1000
                    let durationH = w.duration / 3600
                    guard distKm > 0.5, durationH > 0 else { return nil }
                    let kph = distKm / durationH
                    return (kph > 5 && kph < 60) ? kph : nil
                }
                let thenSpeeds = thenS.compactMap { w -> Double? in
                    let distKm = (w.totalDistance?.doubleValue(for: .meter()) ?? 0) / 1000
                    let durationH = w.duration / 3600
                    guard distKm > 0.5, durationH > 0 else { return nil }
                    let kph = distKm / durationH
                    return (kph > 5 && kph < 60) ? kph : nil
                }
                nowMetric  = nowSpeeds.isEmpty  ? nil : nowSpeeds.reduce(0, +) / Double(nowSpeeds.count)
                thenMetric = thenSpeeds.isEmpty ? nil : thenSpeeds.reduce(0, +) / Double(thenSpeeds.count)
                formatter = { String(format: "%.1f km/h", $0) }
            } else {
                // Duration-based (Strength, HIIT)
                metricLabel = "avg session"
                let nowDurs  = nowS.map  { $0.duration / 60 }
                let thenDurs = thenS.map { $0.duration / 60 }
                nowMetric  = nowDurs.isEmpty  ? nil : nowDurs.reduce(0, +) / Double(nowDurs.count)
                thenMetric = thenDurs.isEmpty ? nil : thenDurs.reduce(0, +) / Double(thenDurs.count)
                formatter = { String(format: "%.0f min", $0) }
            }

            builtSnapshots.append(SportSnapshot(
                id: def.id, icon: def.icon, color: def.color,
                nowSessions: nowS.count, thenSessions: thenS.count,
                nowAvgMetric: nowMetric, thenAvgMetric: thenMetric,
                metricLabel: metricLabel, metricFormatter: formatter,
                nowTotalKm: nowKm, thenTotalKm: thenKm,
                nowTotalMins: nowMins, thenTotalMins: thenMins
            ))
        }

        snapshots = builtSnapshots
        nowWeeklyWorkouts  = Double(nowWorkouts.count)  / 4.3
        thenWeeklyWorkouts = Double(thenWorkouts.count) / 4.3
        nowWeeklyMins  = nowWorkouts.map  { $0.duration / 60 }.reduce(0, +) / 4.3
        thenWeeklyMins = thenWorkouts.map { $0.duration / 60 }.reduce(0, +) / 4.3

        // Fetch cardio markers from Supabase
        if let dailySums = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 90) {
            let nowCutoff  = nowStart
            let thenCutoff = thenStart
            let thenEndStr = thenEnd

            let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"

            let nowSums  = dailySums.filter { df.date(from: $0.date).map { $0 >= nowCutoff } ?? false }
            let thenSums = dailySums.filter { df.date(from: $0.date).map { $0 >= thenCutoff && $0 <= thenEndStr } ?? false }

            func avgValid(_ vals: [Double?]) -> Double? {
                let v = vals.compactMap { $0 }.filter { $0 > 0 }
                return v.isEmpty ? nil : v.reduce(0, +) / Double(v.count)
            }

            nowRHR  = avgValid(nowSums.map  { $0.resting_heart_rate })
            thenRHR = avgValid(thenSums.map { $0.resting_heart_rate })
            nowHRV  = avgValid(nowSums.map  { $0.avg_hrv })
            thenHRV = avgValid(thenSums.map { $0.avg_hrv })
        }
    }

    // MARK: - Direction helpers

    private func direction(now: Double, then: Double, higherIsBetter: Bool) -> Direction {
        guard then != 0 else { return .same }
        let pct = (now - then) / then * 100
        if abs(pct) < 2 { return .same }
        let improved = higherIsBetter ? (pct > 0) : (pct < 0)
        return improved ? .positive : .negative
    }

    private func dirArrow(now: Double, then: Double) -> String {
        guard then != 0 else { return "→" }
        let pct = (now - then) / then * 100
        if abs(pct) < 2 { return "→" }
        return pct > 0 ? "↑" : "↓"
    }

    private func dirArrow(_ dir: Direction) -> String {
        switch dir { case .positive: return "↑"; case .negative: return "↓"; case .same: return "→" }
    }

    private func dirColor(_ dir: Direction) -> Color {
        switch dir { case .positive: return .green; case .negative: return .red; case .same: return .secondary }
    }
}

#Preview {
    NavigationStack { PerformanceOverviewView() }
}
