import SwiftUI
import Charts
import HealthKit

// MARK: - StepPatternView

/// Reveals when during the day you accumulate steps, averaged across the last 14 days.
/// Helps identify if you're a morning mover, lunchtime walker, or evening stepper.
struct StepPatternView: View {
    @State private var hourlyData: [HourBucket] = []
    @State private var weekdayData: [DayBucket] = []
    @State private var isLoading = false

    private let healthStore = HKHealthStore()

    struct HourBucket: Identifiable {
        let id: Int  // 0-23
        let hour: Int
        let avgSteps: Double
        let dayCount: Int

        var label: String {
            switch hour {
            case 0: return "12am"
            case 12: return "12pm"
            default: return hour < 12 ? "\(hour)am" : "\(hour - 12)pm"
            }
        }

        var intensity: Color {
            if avgSteps < 200 { return .green.opacity(0.3) }
            if avgSteps < 500 { return .green }
            if avgSteps < 1000 { return .yellow }
            if avgSteps < 2000 { return .orange }
            return .red
        }
    }

    struct DayBucket: Identifiable {
        let id: Int  // 1=Sunday … 7=Saturday
        let weekday: Int
        let avgSteps: Double

        var label: String {
            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday - 1]
        }

        var isWeekend: Bool { weekday == 1 || weekday == 7 }
    }

    // MARK: - Computed

    private var totalAvgSteps: Int {
        guard !hourlyData.isEmpty else { return 0 }
        return Int(hourlyData.map(\.avgSteps).reduce(0, +))
    }

    private var peakHour: HourBucket? {
        hourlyData.max(by: { $0.avgSteps < $1.avgSteps })
    }

    private var morningSteps: Double {
        hourlyData.filter { $0.hour >= 6 && $0.hour < 12 }.map(\.avgSteps).reduce(0, +)
    }
    private var afternoonSteps: Double {
        hourlyData.filter { $0.hour >= 12 && $0.hour < 18 }.map(\.avgSteps).reduce(0, +)
    }
    private var eveningSteps: Double {
        hourlyData.filter { $0.hour >= 18 && $0.hour <= 22 }.map(\.avgSteps).reduce(0, +)
    }

    private var dominantPeriod: String {
        let vals = [("Morning", morningSteps), ("Afternoon", afternoonSteps), ("Evening", eveningSteps)]
        return vals.max(by: { $0.1 < $1.1 })?.0 ?? "—"
    }

    private var weekdayAvg: Double {
        let weekdays = weekdayData.filter { !$0.isWeekend }
        guard !weekdays.isEmpty else { return 0 }
        return weekdays.map(\.avgSteps).reduce(0, +) / Double(weekdays.count)
    }

    private var weekendAvg: Double {
        let weekends = weekdayData.filter(\.isWeekend)
        guard !weekends.isEmpty else { return 0 }
        return weekends.map(\.avgSteps).reduce(0, +) / Double(weekends.count)
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if hourlyData.isEmpty || totalAvgSteps == 0 {
                    emptyState
                } else {
                    summaryCards
                    hourlyChart
                    weekdayChart
                    periodBreakdownCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Step Pattern")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.walk.circle")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("No step data")
                .font(.headline)
            Text("Walk with your iPhone or Apple Watch to see your daily step pattern.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }

    // MARK: - Summary cards

    private var summaryCards: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
            StepPatternCard(value: totalAvgSteps.formatted(), label: "Avg Daily Steps", sub: "Last 14 days", color: .green)
            StepPatternCard(value: peakHour?.label ?? "—", label: "Most Active Hour",
                sub: peakHour.map { "\(Int($0.avgSteps)) avg steps" } ?? "—", color: .orange)
            StepPatternCard(value: dominantPeriod, label: "Dominant Period", sub: "Morning/Afternoon/Evening", color: .blue)
            StepPatternCard(value: weekdayAvg > weekendAvg ? "Weekday" : "Weekend",
                label: "More Active", sub: "vs \(weekdayAvg > weekendAvg ? "weekend" : "weekday")", color: .purple)
        }
    }

    // MARK: - Hourly chart

    private var hourlyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Steps by Hour of Day")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Chart(hourlyData) { bucket in
                BarMark(
                    x: .value("Hour", bucket.label),
                    y: .value("Steps", bucket.avgSteps)
                )
                .foregroundStyle(bucket.intensity)
                .cornerRadius(2)
            }
            .chartXAxis {
                AxisMarks(values: stride(from: 0, through: 23, by: 3).map { hourlyData[$0].label }) { val in
                    AxisValueLabel {
                        if let label = val.as(String.self) {
                            Text(label).font(.system(size: 9))
                        }
                    }
                    AxisTick()
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisGridLine()
                    AxisValueLabel { Text("\(val.as(Int.self) ?? 0)") }
                }
            }
            .frame(height: 180)

            // Legend
            HStack(spacing: 16) {
                ForEach([
                    (Color.green.opacity(0.3), "< 200"),
                    (Color.green, "200-499"),
                    (Color.yellow, "500-999"),
                    (Color.orange, "1k-2k"),
                    (Color.red, "> 2k"),
                ], id: \.1) { color, label in
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 10, height: 10)
                        Text(label).font(.system(size: 9)).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Weekday chart

    private var weekdayChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Average Steps by Day of Week")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Chart(weekdayData) { bucket in
                BarMark(
                    x: .value("Day", bucket.label),
                    y: .value("Steps", bucket.avgSteps)
                )
                .foregroundStyle(bucket.isWeekend ? Color.blue : Color.green)
                .cornerRadius(4)
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisGridLine()
                    AxisValueLabel { Text("\(val.as(Int.self) ?? 0)") }
                }
            }
            .frame(height: 140)

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.green).frame(width: 10, height: 10)
                    Text("Weekday").font(.caption2).foregroundStyle(.secondary)
                }
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.blue).frame(width: 10, height: 10)
                    Text("Weekend").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Period breakdown

    private var periodBreakdownCard: some View {
        let totalWaking = morningSteps + afternoonSteps + eveningSteps
        func pct(_ v: Double) -> String {
            totalWaking > 0 ? "\(Int((v / totalWaking * 100).rounded()))%" : "—"
        }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Time-of-Day Breakdown")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)

            ForEach([
                ("sunrise", "Morning (6am–12pm)", morningSteps, pct(morningSteps), Color.yellow),
                ("sun.max.fill", "Afternoon (12pm–6pm)", afternoonSteps, pct(afternoonSteps), Color.orange),
                ("moon.stars.fill", "Evening (6pm–11pm)", eveningSteps, pct(eveningSteps), Color.indigo),
            ], id: \.1) { icon, label, steps, percent, color in
                HStack {
                    Image(systemName: icon)
                        .foregroundStyle(color)
                        .frame(width: 20)
                    Text(label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(Int(steps)) steps")
                        .font(.caption.weight(.medium))
                    Text(percent)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 32, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Info card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Why Step Timing Matters")
                .font(.subheadline.weight(.semibold))
            VStack(alignment: .leading, spacing: 6) {
                InfoBullet(color: .yellow, title: "Morning movement",
                    text: "Steps before 10am support circadian regulation, cortisol rhythm, and metabolic function.")
                InfoBullet(color: .orange, title: "Post-meal walks",
                    text: "A 10-min walk after each meal blunts blood glucose spikes by up to 30%.")
                InfoBullet(color: .indigo, title: "Evening activity",
                    text: "Light walking in the evening reduces stress hormones but intense exercise may delay sleep.")
            }
            .padding(.top, 2)
            Text("Averaged across the last 14 days.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Data loading

    private func loadData() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -14, to: end)!
        let stepType = HKQuantityType(.stepCount)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let anchorDate = Calendar.current.startOfDay(for: end)

        do {
            // Hourly step buckets
            let hourlyResults = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<HKStatisticsCollection, Error>) in
                let query = HKStatisticsCollectionQuery(
                    quantityType: stepType,
                    quantitySamplePredicate: predicate,
                    options: .cumulativeSum,
                    anchorDate: anchorDate,
                    intervalComponents: DateComponents(hour: 1)
                )
                query.initialResultsHandler = { _, results, error in
                    if let error { continuation.resume(throwing: error); return }
                    guard let results else { continuation.resume(throwing: HKError(.errorNoData)); return }
                    continuation.resume(returning: results)
                }
                healthStore.execute(query)
            }

            // Sum all samples for each hour-of-day slot
            var hourSums: [Int: (sum: Double, days: Set<String>)] = [:]
            hourlyResults.enumerateStatistics(from: start, to: end) { stats, _ in
                guard let steps = stats.sumQuantity()?.doubleValue(for: .count()), steps > 0 else { return }
                let hour = Calendar.current.component(.hour, from: stats.startDate)
                let dayKey = stats.startDate.formatted(.dateTime.year().month().day())
                if hourSums[hour] == nil { hourSums[hour] = (0, []) }
                hourSums[hour]!.sum += steps
                hourSums[hour]!.days.insert(dayKey)
            }

            // Build 24-hour slots (average per day for each hour)
            let slots = (0..<24).map { hour -> HourBucket in
                if let data = hourSums[hour], !data.days.isEmpty {
                    let avg = data.sum / Double(data.days.count)
                    return HourBucket(id: hour, hour: hour, avgSteps: avg, dayCount: data.days.count)
                }
                return HourBucket(id: hour, hour: hour, avgSteps: 0, dayCount: 0)
            }

            // Weekday totals: sum daily steps per day-of-week slot
            var daySums: [Int: (sum: Double, count: Int)] = [:]
            hourlyResults.enumerateStatistics(from: start, to: end) { stats, _ in
                guard let steps = stats.sumQuantity()?.doubleValue(for: .count()), steps > 0 else { return }
                let weekday = Calendar.current.component(.weekday, from: stats.startDate)
                daySums[weekday, default: (0, 0)].sum += steps
            }
            // We accumulated hourly, need daily per weekday
            // Reset and do daily query for weekday breakdown
            let weekdayBuckets = await loadWeekdayData(start: start, end: end)

            await MainActor.run {
                hourlyData = slots
                weekdayData = weekdayBuckets
            }
        } catch {
            // HealthKit unavailable (simulator) — leave empty
        }
    }

    private func loadWeekdayData(start: Date, end: Date) async -> [DayBucket] {
        let stepType = HKQuantityType(.stepCount)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let anchorDate = Calendar.current.startOfDay(for: end)

        do {
            let dailyResults = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<HKStatisticsCollection, Error>) in
                let query = HKStatisticsCollectionQuery(
                    quantityType: stepType,
                    quantitySamplePredicate: predicate,
                    options: .cumulativeSum,
                    anchorDate: anchorDate,
                    intervalComponents: DateComponents(day: 1)
                )
                query.initialResultsHandler = { _, results, error in
                    if let error { continuation.resume(throwing: error); return }
                    guard let results else { continuation.resume(throwing: HKError(.errorNoData)); return }
                    continuation.resume(returning: results)
                }
                healthStore.execute(query)
            }

            var wdSums: [Int: (sum: Double, count: Int)] = [:]
            dailyResults.enumerateStatistics(from: start, to: end) { stats, _ in
                guard let steps = stats.sumQuantity()?.doubleValue(for: .count()), steps > 0 else { return }
                let wd = Calendar.current.component(.weekday, from: stats.startDate)
                wdSums[wd, default: (0, 0)].sum += steps
                wdSums[wd]!.count += 1
            }

            return (1...7).map { wd in
                let data = wdSums[wd]
                let avg = data.map { $0.sum / Double(max(1, $0.count)) } ?? 0
                return DayBucket(id: wd, weekday: wd, avgSteps: avg)
            }
        } catch {
            return []
        }
    }
}

// MARK: - Supporting views

struct StepPatternCard: View {
    let value: String
    let label: String
    let sub: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(color)
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
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct InfoBullet: View {
    let color: Color
    let title: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle().fill(color).frame(width: 7, height: 7).padding(.top, 4)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption.weight(.semibold))
                Text(text).font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}
