import SwiftUI
import HealthKit
import Charts

// MARK: - SedentaryBreakView
// Tracks prolonged sedentary periods and how frequently they are broken throughout the day.
// A sedentary period = ≥ 2 consecutive 15-min intervals with < 100 steps each.
// Science: Biswas et al. 2015 (Ann Intern Med): Prolonged sitting increases mortality risk
//   independent of leisure-time physical activity. >11 hrs/day sitting = 40% increased risk.
// WHO 2020 PA Guidelines: Interrupt prolonged sedentary time frequently throughout the day.
// Dunstan et al. 2012 (Diabetes Care): 3-min breaks every 30 min improve blood glucose 24%.
// Distinct from ActivityFragmentationView (active bout fragmentation) — this focuses on SEDENTARY
//   streaks and breaking them, not on the quality of active bouts.

struct SedentaryBreakView: View {

    // MARK: - Models

    struct DaySedentary: Identifiable {
        let id = UUID()
        let date: Date
        let longestStreakMins: Int  // longest unbroken sedentary streak in minutes
        let sedentaryHours: Double  // total sedentary hours
        let breakCount: Int         // number of times a sedentary streak > 30 min was broken
        var riskLevel: Risk {
            switch longestStreakMins {
            case ..<60:  return .low
            case 60..<120: return .moderate
            default:     return .high
            }
        }
    }

    enum Risk: String {
        case low      = "Active"
        case moderate = "Moderate"
        case high     = "High Sedentary"
        var color: Color {
            switch self {
            case .low:      return .green
            case .moderate: return .orange
            case .high:     return .red
            }
        }
    }

    struct HourBucket: Identifiable {
        let id = UUID()
        let hour: Int
        let avgSteps: Double
    }

    // MARK: - State

    @State private var days: [DaySedentary] = []
    @State private var hourBuckets: [HourBucket] = []
    @State private var avgLongestStreak: Double?
    @State private var avgBreaksPerDay: Double?
    @State private var pctHighRisk: Double?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    private let stepThreshold = 100   // steps per 15-min = "active" window
    private let sedentaryMinutes = 30  // consecutive minutes to flag as prolonged

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing sedentary patterns…")
                        .padding(.top, 60)
                } else if days.isEmpty {
                    ContentUnavailableView("No Step Data",
                        systemImage: "figure.seated.seatbelt",
                        description: Text("Enable step count in Apple Health to track sedentary patterns."))
                } else {
                    summaryCard
                    streakChart
                    dayHoursCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Sedentary Breaks")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Cards

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: avgLongestStreak.map { String(format: "%.0f min", $0) } ?? "—",
                    label: "Avg Longest Sit",
                    sub: "target: < 60 min",
                    color: avgLongestStreak.map { $0 < 60 ? Color.green : $0 < 120 ? Color.orange : Color.red } ?? .secondary
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgBreaksPerDay.map { String(format: "%.1f", $0) } ?? "—",
                    label: "Breaks/Day",
                    sub: "interruptions",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: pctHighRisk.map { String(format: "%.0f%%", $0) } ?? "—",
                    label: "High Risk Days",
                    sub: "> 2hr streak",
                    color: pctHighRisk.map { $0 > 40 ? Color.red : $0 > 20 ? Color.orange : Color.green } ?? .secondary
                )
            }
            .padding(.vertical, 12)

            if let streak = avgLongestStreak {
                HStack {
                    Image(systemName: streak < 60 ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .foregroundStyle(streak < 60 ? .green : .orange)
                    Text(streak < 60
                         ? "Meeting the < 60 min sitting target (WHO 2020)"
                         : "Average longest sit exceeds 60 min — try standing more frequently")
                    .font(.caption)
                    .foregroundStyle(streak < 60 ? .green : .orange)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private var streakChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Longest Daily Sedentary Streak — 30 Days", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Longest continuous sitting period per day (waking hours). Target: < 60 min. Red = high risk (> 120 min).")
                .font(.caption2).foregroundStyle(.secondary)

            let recent = Array(days.suffix(30))
            Chart {
                RuleMark(y: .value("Target", 60.0))
                    .foregroundStyle(Color.orange.opacity(0.6))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("60min target").font(.caption2).foregroundStyle(.orange)
                    }
                ForEach(recent) { day in
                    BarMark(
                        x: .value("Date", day.date, unit: .day),
                        y: .value("Streak", day.longestStreakMins)
                    )
                    .foregroundStyle(day.riskLevel.color.gradient)
                    .cornerRadius(2)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .frame(height: 150)

            HStack(spacing: 12) {
                legendDot(color: .green, label: "Active (<60 min)")
                legendDot(color: .orange, label: "Moderate (60-120)")
                legendDot(color: .red, label: "High Risk (>120)")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).foregroundStyle(.secondary)
        }
    }

    private var dayHoursCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Most Sedentary Hours of Day", systemImage: "clock.fill")
                .font(.subheadline).bold()
            Text("Average steps per 15-min interval by hour. Low bars indicate typically sedentary periods.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(hourBuckets.filter { $0.hour >= 7 && $0.hour <= 22 }) { bucket in
                BarMark(
                    x: .value("Hour", "\(bucket.hour < 12 ? "\(bucket.hour) AM" : bucket.hour == 12 ? "12 PM" : "\(bucket.hour - 12) PM")"),
                    y: .value("Steps", bucket.avgSteps)
                )
                .foregroundStyle(bucket.avgSteps < Double(stepThreshold) ? Color.red.opacity(0.6).gradient : Color.blue.gradient)
                .cornerRadius(2)
            }
            .frame(height: 110)
            .chartXAxis {
                AxisMarks(values: .stride(by: 2)) { val in
                    AxisValueLabel()
                }
            }

            Text("Red bars = typically sedentary periods (< \(stepThreshold) steps/15 min avg).")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Sedentary Behaviour Science", systemImage: "chair.fill")
                .font(.subheadline).bold()
            Text("Biswas et al. 2015 (Ann Intern Med, meta-analysis): Prolonged sedentary time ≥11 hrs/day increased all-cause mortality risk by 40%, independent of leisure-time physical activity. Sitting can't be \"out-exercised\" — it's a separate health risk.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Dunstan et al. 2012 (Diabetes Care): Breaking sitting with 3-min light-intensity walks every 30 min reduced post-meal blood glucose by 24% in adults with Type 2 diabetes. WHO 2020 PA Guidelines: Interrupt prolonged sedentary time frequently throughout the day.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Measurement: Sedentary = < \(stepThreshold) steps per 15-min interval. A streak is broken when an interval exceeds this threshold.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let stepType = HKQuantityType(.stepCount)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [stepType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .day, value: -30, to: end) ?? Date()
        let interval = DateComponents(minute: 15)
        let anchor = calendar.startOfDay(for: start)

        let collection: HKStatisticsCollection? = await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(
                quantityType: stepType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: end),
                options: .cumulativeSum,
                anchorDate: anchor,
                intervalComponents: interval
            )
            q.initialResultsHandler = { _, results, _ in cont.resume(returning: results) }
            healthStore.execute(q)
        }

        guard let results = collection else { isLoading = false; return }
        processResults(results, start: start, end: end)
        isLoading = false
    }

    private func processResults(_ results: HKStatisticsCollection, start: Date, end: Date) {
        // Group 15-min buckets by day
        var byDay: [Date: [(hour: Int, steps: Int)]] = [:]
        results.enumerateStatistics(from: start, to: end) { stat, _ in
            let steps = Int(stat.sumQuantity()?.doubleValue(for: .count()) ?? 0)
            let dayKey = calendar.startOfDay(for: stat.startDate)
            let hour = calendar.component(.hour, from: stat.startDate)
            byDay[dayKey, default: []].append((hour: hour, steps: steps))
        }

        // Hour buckets (avg steps per 15-min across all days)
        var hourSums: [Int: [Int]] = [:]
        for (_, intervals) in byDay {
            for interval in intervals {
                hourSums[interval.hour, default: []].append(interval.steps)
            }
        }
        let hourBuckets = (0..<24).map { h in
            let vals = hourSums[h] ?? []
            let avg = vals.isEmpty ? 0.0 : Double(vals.reduce(0, +)) / Double(vals.count)
            return HourBucket(hour: h, avgSteps: avg)
        }

        // Per-day analysis
        var dayResults: [DaySedentary] = []
        for (date, intervals) in byDay {
            // Only waking hours: 7am–10pm (28 15-min intervals)
            let wakingIntervals = intervals.filter { $0.hour >= 7 && $0.hour <= 21 }
            guard !wakingIntervals.isEmpty else { continue }

            let sorted = wakingIntervals.sorted { $0.hour < $1.hour }
            var currentStreakCount = 0
            var maxStreakCount = 0
            var breakCount = 0
            var inSedentary = false

            for interval in sorted {
                if interval.steps < stepThreshold {
                    currentStreakCount += 1
                    maxStreakCount = max(maxStreakCount, currentStreakCount)
                    if !inSedentary && currentStreakCount * 15 >= sedentaryMinutes {
                        inSedentary = true
                    }
                } else {
                    if inSedentary { breakCount += 1 }
                    currentStreakCount = 0
                    inSedentary = false
                }
            }

            let sedentaryIntervals = sorted.filter { $0.steps < stepThreshold }.count
            let sedentaryHours = Double(sedentaryIntervals) * 15 / 60

            dayResults.append(DaySedentary(
                date: date,
                longestStreakMins: maxStreakCount * 15,
                sedentaryHours: sedentaryHours,
                breakCount: breakCount
            ))
        }

        dayResults.sort { $0.date < $1.date }

        let avgStreak = dayResults.isEmpty ? nil : Double(dayResults.map(\.longestStreakMins).reduce(0, +)) / Double(dayResults.count)
        let avgBreaks = dayResults.isEmpty ? nil : Double(dayResults.map(\.breakCount).reduce(0, +)) / Double(dayResults.count)
        let pctHigh = dayResults.isEmpty ? nil : Double(dayResults.filter { $0.riskLevel == .high }.count) / Double(dayResults.count) * 100

        DispatchQueue.main.async {
            self.days = dayResults
            self.hourBuckets = hourBuckets
            self.avgLongestStreak = avgStreak
            self.avgBreaksPerDay = avgBreaks
            self.pctHighRisk = pctHigh
            self.isLoading = false
        }
    }
}
