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
}

// MARK: - Provider

struct KQuarksProvider: TimelineProvider {
    private let store = HKHealthStore()

    func placeholder(in context: Context) -> KQuarksEntry {
        KQuarksEntry(date: .now, steps: 6842, stepGoal: 10000, sleepHours: 7.5, recoveryScore: 72)
    }

    func getSnapshot(in context: Context, completion: @escaping (KQuarksEntry) -> Void) {
        Task { completion(await fetchEntry()) }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<KQuarksEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(next)))
        }
    }

    private func fetchEntry() async -> KQuarksEntry {
        let stepGoal = 10000
        let cachedRecovery = UserDefaults.standard.integer(forKey: "cached_recovery_score")
        let recoveryScore = cachedRecovery > 0 ? cachedRecovery : 50

        guard HKHealthStore.isHealthDataAvailable() else {
            return KQuarksEntry(date: .now, steps: 0, stepGoal: stepGoal, sleepHours: 0, recoveryScore: recoveryScore)
        }

        let steps = await fetchSteps()
        let sleep = await fetchSleep()

        return KQuarksEntry(date: .now, steps: steps, stepGoal: stepGoal, sleepHours: sleep, recoveryScore: recoveryScore)
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
