import SwiftUI
import Charts
import HealthKit

// MARK: - HandwashingView

/// Tracks handwashing events detected by Apple Watch (Series 6+).
/// Apple Watch uses the motion coprocessor and microphone to detect the motion
/// and sound of handwashing and prompts a 20-second countdown if it detects
/// handwashing. Each detected event is logged to HealthKit.
///
/// WHO recommends handwashing at 5 key moments: before eating, after using
/// the toilet, after blowing nose/coughing, after handling animals, and after
/// touching garbage. Apple Watch can help track adherence.
struct HandwashingView: View {

    struct DayBucket: Identifiable {
        let id: String
        let date: Date
        let count: Int
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekStart: Date
        let sessions: Int
        let avgPerDay: Double
    }

    enum HygieneLevel: String {
        case excellent  = "Excellent Hygiene"
        case good       = "Good Hygiene"
        case fair       = "Fair Hygiene"
        case low        = "Track More"

        var color: Color {
            switch self {
            case .excellent: return .green
            case .good:      return .teal
            case .fair:      return .orange
            case .low:       return .red
            }
        }

        var icon: String {
            switch self {
            case .excellent: return "hands.sparkles.fill"
            case .good:      return "hands.clap.fill"
            case .fair:      return "hand.raised.fill"
            case .low:       return "hand.raised.slash.fill"
            }
        }

        static func from(dailyAvg: Double) -> HygieneLevel {
            if dailyAvg >= 8  { return .excellent }
            if dailyAvg >= 5  { return .good }
            if dailyAvg >= 2  { return .fair }
            return .low
        }
    }

    // MARK: - State

    @State private var dayBuckets: [DayBucket] = []
    @State private var totalEvents: Int = 0
    @State private var dailyAvg: Double = 0
    @State private var currentStreak: Int = 0
    @State private var level: HygieneLevel = .good
    @State private var hourCounts: [Int] = Array(repeating: 0, count: 24)
    @State private var isLoading = true
    @State private var hasNoData = false

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if hasNoData {
                noDataState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    dailyChart
                    timeOfDayChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Handwashing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Last 30 Days")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalEvents)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(level.color)
                        Text("washes")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Image(systemName: level.icon).foregroundStyle(level.color)
                        Text(level.rawValue).font(.subheadline.bold()).foregroundStyle(level.color)
                    }
                }
                Spacer()
                Image(systemName: "hands.sparkles.fill")
                    .font(.system(size: 44)).foregroundStyle(level.color)
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Daily Average", value: String(format: "%.1f", dailyAvg), color: level.color)
                Divider().frame(height: 36)
                statCell(label: "WHO Target", value: "≥8/day", color: .secondary)
                Divider().frame(height: 36)
                statCell(label: "Active Streak", value: "\(currentStreak) days", color: currentStreak >= 7 ? .green : .orange)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Daily Chart

    private var dailyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Daily Handwashing Events")
                .font(.headline)

            Chart {
                ForEach(dayBuckets) { b in
                    BarMark(x: .value("Date", b.date, unit: .day),
                            y: .value("Washes", b.count))
                    .foregroundStyle(hygieneColor(b.count).opacity(0.8))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("WHO Target", 8))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .annotation(position: .topTrailing) {
                        Text("WHO target").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("Washes")
            .frame(height: 150)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func hygieneColor(_ count: Int) -> Color {
        if count >= 8  { return .green }
        if count >= 5  { return .teal }
        if count >= 2  { return .orange }
        return .red
    }

    // MARK: - Time of Day Chart

    private var timeOfDayChart: some View {
        let bins: [(String, Int)] = [
            ("Morning\n5–9am", (5...8).map { hourCounts[$0] }.reduce(0, +)),
            ("Mid-AM\n9–12", (9...11).map { hourCounts[$0] }.reduce(0, +)),
            ("Afternoon\n12–5", (12...16).map { hourCounts[$0] }.reduce(0, +)),
            ("Evening\n5–9pm", (17...20).map { hourCounts[$0] }.reduce(0, +)),
            ("Night\n9–12", (21...23).map { hourCounts[$0] }.reduce(0, +))
        ]

        return VStack(alignment: .leading, spacing: 8) {
            Text("When You Wash Hands")
                .font(.headline)

            Chart {
                ForEach(bins, id: \.0) { label, count in
                    BarMark(x: .value("Time", label),
                            y: .value("Events", count))
                    .foregroundStyle(Color.teal.opacity(0.75))
                    .cornerRadius(4)
                }
            }
            .chartYAxisLabel("Events")
            .frame(height: 120)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Handwashing & Health Science", systemImage: "hands.sparkles.fill")
                .font(.headline).foregroundStyle(.teal)

            Text("Handwashing with soap is the single most effective personal hygiene intervention for preventing infectious disease — more effective than any vaccine for common illnesses like the flu and gastroenteritis.")
                .font(.caption).foregroundStyle(.secondary)

            Text("The CDC estimates proper handwashing could prevent 1 in 3 diarrhea-related illnesses and 1 in 5 respiratory infections. Apple Watch detects handwashing events using accelerometer and microphone data to identify the distinctive motion and sound.")
                .font(.caption).foregroundStyle(.secondary)

            Text("WHO recommends washing at 5 key moments: before eating, before/after food preparation, after using the toilet, after blowing your nose or coughing, and after touching animals or waste.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.teal.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - No Data State

    private var noDataState: some View {
        VStack(spacing: 16) {
            Image(systemName: "hands.sparkles.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Handwashing Data")
                .font(.title3.bold())
            Text("Apple Watch Series 6 or later automatically detects handwashing events. Enable Handwashing in the Apple Watch app → Health → Hand Washing to start tracking.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let hwType = HKObjectType.categoryType(forIdentifier: .handwashingEvent) else {
            hasNoData = true; return
        }
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [hwType])) != nil else {
            hasNoData = true; return
        }

        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date(timeIntervalSinceNow: -30 * 86400)

        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date())
            let q = HKSampleQuery(
                sampleType: hwType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { hasNoData = true; return }

        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        var dayMap: [String: (Date, Int)] = [:]

        for s in samples {
            let key = df.string(from: s.startDate)
            let dayStart = cal.startOfDay(for: s.startDate)
            var cur = dayMap[key] ?? (dayStart, 0)
            cur.1 += 1
            dayMap[key] = cur

            let hour = cal.component(.hour, from: s.startDate)
            if hour >= 0 && hour < 24 { hourCounts[hour] += 1 }
        }

        totalEvents = samples.count
        let days = dayMap.count
        dailyAvg = days > 0 ? Double(totalEvents) / Double(days) : 0
        level = HygieneLevel.from(dailyAvg: dailyAvg)

        dayBuckets = dayMap.map { key, val in
            DayBucket(id: key, date: val.0, count: val.1)
        }.sorted { $0.date < $1.date }

        // Streak: consecutive days with at least 1 wash
        let uniqueDays = Set(dayBuckets.map { cal.startOfDay(for: $0.date) })
        var streakDate = cal.startOfDay(for: Date())
        var streak = 0
        while uniqueDays.contains(streakDate) {
            streak += 1
            guard let prev = cal.date(byAdding: .day, value: -1, to: streakDate) else { break }
            streakDate = prev
        }
        currentStreak = streak
    }
}

#Preview { NavigationStack { HandwashingView() } }
