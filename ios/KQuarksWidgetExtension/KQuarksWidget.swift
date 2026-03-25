import WidgetKit
import SwiftUI
import HealthKit

// MARK: - Entry

struct KQuarksEntry: TimelineEntry {
    let date: Date
    let steps: Int
    let stepGoal: Int
    let sleepHours: Double
    let recoveryScore: Int
    let activeCalories: Int
    let calorieGoal: Int
    let restingHR: Int
    let weekSteps: [Int] // last 7 days
}

// MARK: - Provider

struct KQuarksProvider: TimelineProvider {
    private let store = HKHealthStore()

    func placeholder(in context: Context) -> KQuarksEntry {
        KQuarksEntry(date: .now, steps: 6842, stepGoal: 10000, sleepHours: 7.5, recoveryScore: 72,
                     activeCalories: 340, calorieGoal: 500, restingHR: 58,
                     weekSteps: [9200, 7400, 11200, 6800, 8500, 10100, 6842])
    }

    func getSnapshot(in context: Context, completion: @escaping (KQuarksEntry) -> Void) {
        Task { completion(await fetchEntry()) }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<KQuarksEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }

    private func fetchEntry() async -> KQuarksEntry {
        let sharedDefaults = UserDefaults(suiteName: "group.com.qxlsz.kquarks") ?? .standard
        let storedGoal = sharedDefaults.double(forKey: "goal_steps")
        let stepGoal = storedGoal > 0 ? Int(storedGoal) : 10000
        let cachedRecovery = sharedDefaults.integer(forKey: "cached_recovery_score")
        let recoveryScore = cachedRecovery > 0 ? cachedRecovery : 50

        guard HKHealthStore.isHealthDataAvailable() else {
            return KQuarksEntry(date: .now, steps: 0, stepGoal: stepGoal, sleepHours: 0,
                                recoveryScore: recoveryScore, activeCalories: 0, calorieGoal: 500,
                                restingHR: 0, weekSteps: Array(repeating: 0, count: 7))
        }

        let steps = await fetchSteps()
        let sleep = await fetchSleep()
        let calories = await fetchActiveCalories()
        let rhr = await fetchRestingHR()
        let weekSteps = await fetchWeekSteps()
        let calorieGoal = Int(sharedDefaults.double(forKey: "goal_calories") > 0
            ? sharedDefaults.double(forKey: "goal_calories") : 500)

        return KQuarksEntry(date: .now, steps: steps, stepGoal: stepGoal, sleepHours: sleep,
                            recoveryScore: recoveryScore, activeCalories: Int(calories),
                            calorieGoal: calorieGoal, restingHR: Int(rhr), weekSteps: weekSteps)
    }

    private func fetchSteps() async -> Int {
        let type = HKQuantityType(.stepCount)
        guard store.authorizationStatus(for: type) != .notDetermined else { return 0 }
        let start = Calendar.current.startOfDay(for: .now)
        let pred = HKQuery.predicateForSamples(withStart: start, end: .now, options: .strictStartDate)
        return await withCheckedContinuation { cont in
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
                cont.resume(returning: Int(stats?.sumQuantity()?.doubleValue(for: .count()) ?? 0))
            }
            store.execute(q)
        }
    }

    private func fetchSleep() async -> Double {
        let type = HKCategoryType(.sleepAnalysis)
        guard store.authorizationStatus(for: type) != .notDetermined else { return 0 }
        let cal = Calendar.current
        let yesterday = cal.date(byAdding: .day, value: -1, to: cal.startOfDay(for: .now))!
        let pred = HKQuery.predicateForSamples(withStart: yesterday, end: .now, options: .strictStartDate)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                let mins = (samples as? [HKCategorySample])?.filter {
                    let v = HKCategoryValueSleepAnalysis(rawValue: $0.value)
                    return v == .asleepDeep || v == .asleepREM || v == .asleepCore || v == .asleepUnspecified
                }.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 60 } ?? 0
                cont.resume(returning: mins / 60)
            }
            store.execute(q)
        }
    }

    private func fetchActiveCalories() async -> Double {
        let type = HKQuantityType(.activeEnergyBurned)
        guard store.authorizationStatus(for: type) != .notDetermined else { return 0 }
        let start = Calendar.current.startOfDay(for: .now)
        let pred = HKQuery.predicateForSamples(withStart: start, end: .now, options: .strictStartDate)
        return await withCheckedContinuation { cont in
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
                cont.resume(returning: stats?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0)
            }
            store.execute(q)
        }
    }

    private func fetchRestingHR() async -> Double {
        let type = HKQuantityType(.restingHeartRate)
        guard store.authorizationStatus(for: type) != .notDetermined else { return 0 }
        let pred = HKQuery.predicateForSamples(withStart: Calendar.current.date(byAdding: .day, value: -1, to: .now), end: .now, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                let val = (samples?.first as? HKQuantitySample)?.quantity.doubleValue(for: HKUnit(from: "count/min")) ?? 0
                cont.resume(returning: val)
            }
            store.execute(q)
        }
    }

    private func fetchWeekSteps() async -> [Int] {
        let type = HKQuantityType(.stepCount)
        guard store.authorizationStatus(for: type) != .notDetermined else { return Array(repeating: 0, count: 7) }
        let cal = Calendar.current
        var result: [Int] = []
        for offset in (0..<7).reversed() {
            let dayStart = cal.date(byAdding: .day, value: -offset, to: cal.startOfDay(for: .now))!
            let dayEnd = cal.date(byAdding: .day, value: 1, to: dayStart)!
            let pred = HKQuery.predicateForSamples(withStart: dayStart, end: dayEnd, options: .strictStartDate)
            let steps = await withCheckedContinuation { (cont: CheckedContinuation<Int, Never>) in
                let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
                    cont.resume(returning: Int(stats?.sumQuantity()?.doubleValue(for: .count()) ?? 0))
                }
                store.execute(q)
            }
            result.append(steps)
        }
        return result
    }
}

// MARK: - Home Screen: Small Widget

struct SmallWidgetView: View {
    let entry: KQuarksEntry

    private var progress: Double {
        min(Double(entry.steps) / Double(max(entry.stepGoal, 1)), 1.0)
    }

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .stroke(Color.green.opacity(0.2), lineWidth: 10)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(Color.green, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 1) {
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(.green)
                    Image(systemName: "figure.walk")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 80, height: 80)

            Text(entry.steps.formatted())
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.primary)
        }
        .padding(12)
        .containerBackground(Color(.systemBackground), for: .widget)
    }
}

// MARK: - Home Screen: Medium Widget

struct MediumWidgetView: View {
    let entry: KQuarksEntry

    private var progress: Double {
        min(Double(entry.steps) / Double(max(entry.stepGoal, 1)), 1.0)
    }

    private var recoveryColor: Color {
        if entry.recoveryScore >= 67 { return .green }
        if entry.recoveryScore >= 34 { return .yellow }
        return .red
    }

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(Color.green.opacity(0.2), lineWidth: 12)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(Color.green, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 1) {
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(.green)
                    Image(systemName: "figure.walk")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 90, height: 90)

            VStack(alignment: .leading, spacing: 8) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.steps.formatted())
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .monospacedDigit()
                    Text("of \(entry.stepGoal.formatted()) steps")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                HStack(spacing: 5) {
                    Image(systemName: "bolt.fill")
                        .font(.caption)
                        .foregroundStyle(recoveryColor)
                    Text("\(entry.recoveryScore)% recovery")
                        .font(.caption)
                }

                if entry.sleepHours > 0 {
                    let h = Int(entry.sleepHours)
                    let m = Int((entry.sleepHours - Double(h)) * 60)
                    HStack(spacing: 5) {
                        Image(systemName: "moon.fill")
                            .font(.caption)
                            .foregroundStyle(.indigo)
                        Text(m > 0 ? "\(h)h \(m)m sleep" : "\(h)h sleep")
                            .font(.caption)
                    }
                }
            }

            Spacer()
        }
        .padding(16)
        .containerBackground(Color(.systemBackground), for: .widget)
    }
}

// MARK: - Lock Screen: Circular (step progress gauge)

struct AccessoryCircularView: View {
    let entry: KQuarksEntry

    private var progress: Double {
        min(Double(entry.steps) / Double(max(entry.stepGoal, 1)), 1.0)
    }

    var body: some View {
        Gauge(value: progress) {
            Image(systemName: "figure.walk")
        } currentValueLabel: {
            Text(entry.steps >= 1000
                 ? "\(entry.steps / 1000)k"
                 : "\(entry.steps)")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
        }
        .gaugeStyle(.accessoryCircular)
        .widgetAccentable()
        .containerBackground(.clear, for: .widget)
    }
}

// MARK: - Lock Screen: Rectangular

struct AccessoryRectangularView: View {
    let entry: KQuarksEntry

    private var progress: Double {
        min(Double(entry.steps) / Double(max(entry.stepGoal, 1)), 1.0)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 6) {
                Image(systemName: "figure.walk")
                    .font(.caption2)
                    .widgetAccentable()
                Text("\(entry.steps.formatted()) steps")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .monospacedDigit()
            }

            ProgressView(value: progress)
                .tint(.green)
                .scaleEffect(x: 1, y: 1.4)

            if entry.sleepHours > 0 {
                let h = Int(entry.sleepHours)
                let m = Int((entry.sleepHours - Double(h)) * 60)
                HStack(spacing: 4) {
                    Image(systemName: "moon.fill")
                        .font(.caption2)
                    Text(m > 0 ? "\(h)h \(m)m" : "\(h)h sleep")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .containerBackground(.clear, for: .widget)
    }
}

// MARK: - Lock Screen: Inline

struct AccessoryInlineView: View {
    let entry: KQuarksEntry

    var body: some View {
        let stepsText = entry.steps.formatted()
        if entry.sleepHours > 0 {
            let h = Int(entry.sleepHours)
            let m = Int((entry.sleepHours - Double(h)) * 60)
            let sleepText = m > 0 ? "\(h)h\(m)m" : "\(h)h"
            Label("\(stepsText) steps · \(sleepText) sleep", systemImage: "figure.walk")
        } else {
            Label("\(stepsText) steps", systemImage: "figure.walk")
        }
    }
}

// MARK: - Home Screen: Large Widget

struct LargeWidgetView: View {
    let entry: KQuarksEntry

    private var stepProgress: Double {
        min(Double(entry.steps) / Double(max(entry.stepGoal, 1)), 1.0)
    }

    private var calProgress: Double {
        min(Double(entry.activeCalories) / Double(max(entry.calorieGoal, 1)), 1.0)
    }

    private var recoveryColor: Color {
        if entry.recoveryScore >= 67 { return .green }
        if entry.recoveryScore >= 34 { return .yellow }
        return .red
    }

    private var maxWeekSteps: Int {
        max(entry.weekSteps.max() ?? 1, 1)
    }

    var body: some View {
        VStack(spacing: 14) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("KQuarks")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.secondary)
                    Text("Today")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                }
                Spacer()
                Text(entry.date, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            // Metrics row
            HStack(spacing: 12) {
                // Steps ring
                VStack(spacing: 4) {
                    ZStack {
                        Circle()
                            .stroke(Color.green.opacity(0.2), lineWidth: 10)
                        Circle()
                            .trim(from: 0, to: stepProgress)
                            .stroke(Color.green, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                        VStack(spacing: 0) {
                            Text(entry.steps >= 1000 ? "\(entry.steps / 1000)k" : "\(entry.steps)")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .monospacedDigit()
                                .foregroundStyle(.green)
                            Image(systemName: "figure.walk")
                                .font(.system(size: 8))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(width: 70, height: 70)
                    Text("Steps")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                // Stats column
                VStack(alignment: .leading, spacing: 8) {
                    // Calories
                    HStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .stroke(Color.orange.opacity(0.2), lineWidth: 6)
                            Circle()
                                .trim(from: 0, to: calProgress)
                                .stroke(Color.orange, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                                .rotationEffect(.degrees(-90))
                        }
                        .frame(width: 28, height: 28)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("\(entry.activeCalories) kcal")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .monospacedDigit()
                            Text("Active calories")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }

                    // Recovery
                    HStack(spacing: 6) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(recoveryColor)
                            .frame(width: 28)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("\(entry.recoveryScore)% recovery")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                            Text(entry.recoveryScore >= 67 ? "Good" : entry.recoveryScore >= 34 ? "Moderate" : "Low")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }

                    // Sleep
                    if entry.sleepHours > 0 {
                        HStack(spacing: 6) {
                            Image(systemName: "moon.fill")
                                .font(.system(size: 14))
                                .foregroundStyle(.indigo)
                                .frame(width: 28)
                            let h = Int(entry.sleepHours)
                            let m = Int((entry.sleepHours - Double(h)) * 60)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(m > 0 ? "\(h)h \(m)m" : "\(h)h")
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                Text("Last night")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    // Resting HR
                    if entry.restingHR > 0 {
                        HStack(spacing: 6) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 14))
                                .foregroundStyle(.red)
                                .frame(width: 28)
                            VStack(alignment: .leading, spacing: 1) {
                                Text("\(entry.restingHR) bpm")
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                Text("Resting HR")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                Spacer()
            }

            Divider()
                .background(Color.secondary.opacity(0.3))

            // 7-day step sparkline
            VStack(alignment: .leading, spacing: 6) {
                Text("7-Day Steps")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HStack(alignment: .bottom, spacing: 4) {
                    let days = ["M", "T", "W", "T", "F", "S", "S"]
                    ForEach(Array(entry.weekSteps.enumerated()), id: \.offset) { i, steps in
                        VStack(spacing: 3) {
                            let barHeight = max(4.0, Double(steps) / Double(maxWeekSteps) * 50.0)
                            RoundedRectangle(cornerRadius: 3)
                                .fill(i == 6 ? Color.green : Color.green.opacity(0.4))
                                .frame(height: barHeight)
                            Text(days[i])
                                .font(.system(size: 9))
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 60)
            }
        }
        .padding(16)
        .containerBackground(Color(.systemBackground), for: .widget)
    }
}

// MARK: - Entry View

struct KQuarksWidgetEntryView: View {
    let entry: KQuarksEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        case .accessoryCircular:
            AccessoryCircularView(entry: entry)
        case .accessoryRectangular:
            AccessoryRectangularView(entry: entry)
        case .accessoryInline:
            AccessoryInlineView(entry: entry)
        default:
            MediumWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget

struct KQuarksWidget: Widget {
    let kind: String = "KQuarksWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KQuarksProvider()) { entry in
            KQuarksWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("KQuarks")
        .description("Today's steps, recovery, and sleep at a glance.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}

// MARK: - Bundle

@main
struct KQuarksWidgetBundle: WidgetBundle {
    var body: some Widget {
        KQuarksWidget()
    }
}
