import SwiftUI
import HealthKit
import Charts

// MARK: - ActivityFragmentationView
// Measures how broken-up movement is throughout the day using 15-min step-count intervals.
// FragmentationIndex = (active→sedentary transitions) / (active intervals)
// High fragmentation indicates brief, interrupted bouts of activity rather than sustained movement.
// Science: Diaz et al. 2017 (JAMA Network Open): PA fragmentation as mortality predictor independent of total activity.
// Bellettiere et al. 2021 (JAMA Network Open): Fragmentation predicts incident CVD in older women.
// Distinct from StepPatternView (when you walk) and ReadinessView (composite score).

struct ActivityFragmentationView: View {

    // MARK: - Models

    struct DayFragment: Identifiable {
        let id = UUID()
        let date: Date
        let fragmentationIndex: Double   // 0–1 (transitions / active intervals)
        let avgBoutMins: Double          // mean active bout length in minutes
        let activeBouts: Int             // number of discrete active bouts
        let totalActiveMins: Int         // sum of active 15-min windows × 15
        var quality: FragQuality {
            switch fragmentationIndex {
            case ..<0.35: return .sustained
            case 0.35..<0.55: return .moderate
            default: return .fragmented
            }
        }
    }

    enum FragQuality: String {
        case sustained  = "Sustained"
        case moderate   = "Moderate"
        case fragmented = "Fragmented"
        var color: Color {
            switch self {
            case .sustained:  return .green
            case .moderate:   return .orange
            case .fragmented: return .red
            }
        }
        var icon: String {
            switch self {
            case .sustained:  return "arrow.right.circle.fill"
            case .moderate:   return "minus.circle.fill"
            case .fragmented: return "exclamationmark.circle.fill"
            }
        }
    }

    struct BoutBucket: Identifiable {
        let id = UUID()
        let label: String    // "1–5 min", "6–15 min", etc.
        let count: Int
        let order: Int
    }

    // MARK: - State

    @State private var days: [DayFragment] = []
    @State private var boutBuckets: [BoutBucket] = []
    @State private var avgFragIndex: Double?
    @State private var avgBoutLength: Double?
    @State private var bestDay: String?
    @State private var worstDay: String?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    private let stepThreshold = 20  // steps per 15-min window to count as "active"

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing movement patterns…")
                        .padding(.top, 60)
                } else if days.isEmpty {
                    ContentUnavailableView("No Step Data",
                        systemImage: "figure.walk.circle",
                        description: Text("90 days of step data needed. Ensure Apple Health step counting is enabled."))
                } else {
                    summaryCard
                    trendCard
                    boutCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Activity Fragmentation")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Cards

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 20) {
                statBox(value: avgFragIndex.map { String(format: "%.2f", $0) } ?? "—",
                        label: "Avg Frag Index",
                        sublabel: avgFragIndex.map { fragLabel($0) } ?? "",
                        color: avgFragIndex.map { fragColor($0) } ?? .secondary)
                Divider().frame(height: 50)
                statBox(value: avgBoutLength.map { String(format: "%.0f min", $0) } ?? "—",
                        label: "Avg Bout Length",
                        sublabel: "sustained activity",
                        color: .blue)
                Divider().frame(height: 50)
                statBox(value: "\(days.count)",
                        label: "Days Analysed",
                        sublabel: "last 90 days",
                        color: .secondary)
            }
            .padding()

            if let best = bestDay, let worst = worstDay {
                HStack {
                    Label("Best: \(best)", systemImage: "checkmark.circle.fill")
                        .font(.caption).foregroundStyle(.green)
                    Spacer()
                    Label("Most fragmented: \(worst)", systemImage: "exclamationmark.circle.fill")
                        .font(.caption).foregroundStyle(.red)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statBox(value: String, label: String, sublabel: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.title2.weight(.bold))
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(sublabel)
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private var trendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("30-Day Fragmentation Trend", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Lower is better — values below 0.35 indicate sustained, uninterrupted activity bouts.")
                .font(.caption2).foregroundStyle(.secondary)

            let recent = Array(days.suffix(30))
            Chart(recent) { day in
                BarMark(
                    x: .value("Date", day.date, unit: .day),
                    y: .value("Index", day.fragmentationIndex)
                )
                .foregroundStyle(fragColor(day.fragmentationIndex).gradient)
                .cornerRadius(2)
            }
            .chartYScale(domain: 0...1)
            .chartYAxis {
                AxisMarks(values: [0, 0.35, 0.55, 1.0]) { val in
                    AxisGridLine()
                    AxisValueLabel(format: FloatingPointFormatStyle<Double>.number.precision(.fractionLength(2)))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .frame(height: 160)

            HStack(spacing: 12) {
                legendDot(color: .green, label: "Sustained (<0.35)")
                legendDot(color: .orange, label: "Moderate (0.35–0.55)")
                legendDot(color: .red, label: "Fragmented (>0.55)")
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

    private var boutCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Active Bout Length Distribution", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Distribution of continuous activity windows over the last 30 days. Longer bouts = better metabolic health.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(boutBuckets) { bucket in
                BarMark(
                    x: .value("Duration", bucket.label),
                    y: .value("Bouts", bucket.count)
                )
                .foregroundStyle(Color.blue.gradient)
                .cornerRadius(4)
            }
            .chartXAxis {
                AxisMarks { val in
                    AxisValueLabel()
                }
            }
            .frame(height: 140)

            // Top 5 days table
            VStack(spacing: 6) {
                HStack {
                    Text("Best recent days").font(.caption.weight(.semibold))
                    Spacer()
                    Text("Frag index").font(.caption2).foregroundStyle(.secondary)
                }
                ForEach(days.sorted { $0.fragmentationIndex < $1.fragmentationIndex }.prefix(5)) { day in
                    HStack {
                        Text(day.date, format: .dateTime.weekday(.abbreviated).month().day())
                            .font(.caption)
                        Spacer()
                        Text(String(format: "%.2f", day.fragmentationIndex))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(fragColor(day.fragmentationIndex))
                        Text("·")
                        Text("\(day.activeBouts) bouts")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("What is Activity Fragmentation?", systemImage: "info.circle.fill")
                .font(.subheadline).bold()
            Text("The Fragmentation Index (FI) measures how often your active periods are interrupted. It equals the ratio of active→sedentary transitions to total active 15-minute windows.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Diaz et al. 2017 (JAMA Network Open) showed that higher PA fragmentation was associated with greater all-cause mortality risk, independent of total activity volume. Bellettiere et al. 2021 found similar patterns for cardiovascular disease risk in older women.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Aim for FI < 0.35 — fewer, longer uninterrupted active bouts rather than many brief interruptions to sitting.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Helpers

    private func fragLabel(_ fi: Double) -> String {
        fi < 0.35 ? "Sustained" : fi < 0.55 ? "Moderate" : "Fragmented"
    }

    private func fragColor(_ fi: Double) -> Color {
        fi < 0.35 ? .green : fi < 0.55 ? .orange : .red
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let stepType = HKQuantityType(.stepCount)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [stepType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .day, value: -90, to: end)!
        let interval = DateComponents(minute: 15)
        let anchor = calendar.startOfDay(for: start)

        var collection: HKStatisticsCollection?
        await withCheckedContinuation { continuation in
            let query = HKStatisticsCollectionQuery(
                quantityType: stepType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: end),
                options: .cumulativeSum,
                anchorDate: anchor,
                intervalComponents: interval
            )
            query.initialResultsHandler = { _, results, _ in
                collection = results
                continuation.resume()
            }
            healthStore.execute(query)
        }
        if let results = collection {
            processResults(results, start: start, end: end)
        }

        isLoading = false
    }

    private func processResults(_ results: HKStatisticsCollection, start: Date, end: Date) {
        // Group 15-min buckets by calendar day
        var byDay: [Date: [Int]] = [:]
        results.enumerateStatistics(from: start, to: end) { stat, _ in
            let steps = Int(stat.sumQuantity()?.doubleValue(for: .count()) ?? 0)
            let dayKey = calendar.startOfDay(for: stat.startDate)
            byDay[dayKey, default: []].append(steps)
        }

        var computed: [DayFragment] = []
        var allBoutLengths: [Int] = []  // in number of 15-min windows

        for (date, buckets) in byDay {
            guard buckets.count >= 4 else { continue }
            let active = buckets.map { $0 >= stepThreshold }
            var transitions = 0
            var activeBouts = 0
            var currentBoutLen = 0
            var boutLengths: [Int] = []

            for i in 0..<active.count {
                if active[i] {
                    currentBoutLen += 1
                    if i == active.count - 1 || !active[i + 1] {
                        boutLengths.append(currentBoutLen)
                        allBoutLengths.append(currentBoutLen)
                        activeBouts += 1
                        currentBoutLen = 0
                    }
                    if i > 0 && !active[i - 1] {
                        // no transition counted here; transitions are active→sedentary
                    }
                } else {
                    if i > 0 && active[i - 1] {
                        transitions += 1  // active→sedentary
                    }
                }
            }

            let totalActive = buckets.filter { $0 >= stepThreshold }.count
            guard totalActive > 0 else { continue }
            let fi = Double(transitions) / Double(totalActive)
            let avgBout = boutLengths.isEmpty ? 0.0 : Double(boutLengths.reduce(0, +)) / Double(boutLengths.count) * 15.0
            let totalActiveMins = totalActive * 15

            computed.append(DayFragment(
                date: date,
                fragmentationIndex: min(fi, 1.0),
                avgBoutMins: avgBout,
                activeBouts: activeBouts,
                totalActiveMins: totalActiveMins
            ))
        }

        computed.sort { $0.date < $1.date }

        // Build bout bucket histogram (in 15-min windows → minutes)
        let bucketLabels = ["1–15 min", "16–30 min", "31–60 min", "61–120 min", "120+ min"]
        var counts = [0, 0, 0, 0, 0]
        for len in allBoutLengths {
            let mins = len * 15
            switch mins {
            case 1...15:   counts[0] += 1
            case 16...30:  counts[1] += 1
            case 31...60:  counts[2] += 1
            case 61...120: counts[3] += 1
            default:       counts[4] += 1
            }
        }
        let boutBuckets = zip(bucketLabels, counts).enumerated().map { i, pair in
            BoutBucket(label: pair.0, count: pair.1, order: i)
        }

        let avgFI = computed.isEmpty ? nil : computed.map(\.fragmentationIndex).reduce(0, +) / Double(computed.count)
        let avgBout = computed.isEmpty ? nil : computed.map(\.avgBoutMins).reduce(0, +) / Double(computed.count)

        let dateFormatter: (Date) -> String = { date in
            let f = DateFormatter(); f.dateFormat = "EEE MMM d"; return f.string(from: date)
        }
        let bestDay = computed.min(by: { $0.fragmentationIndex < $1.fragmentationIndex }).map { dateFormatter($0.date) }
        let worstDay = computed.max(by: { $0.fragmentationIndex < $1.fragmentationIndex }).map { dateFormatter($0.date) }

        DispatchQueue.main.async {
            self.days = computed
            self.boutBuckets = boutBuckets
            self.avgFragIndex = avgFI
            self.avgBoutLength = avgBout
            self.bestDay = bestDay
            self.worstDay = worstDay
        }
    }
}
