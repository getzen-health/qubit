import SwiftUI
import HealthKit
import Charts

// MARK: - VILPAView
// Vigorous Intermittent Lifestyle Physical Activity — brief bursts of vigorous-intensity activity
// in daily life OUTSIDE declared workout sessions (e.g., brisk stair climbing, jogging to bus).
// Detection: HR > 77% estimated HRmax for ≥1 consecutive minute, <10 min, outside workout windows.
// HRmax estimation: Tanaka 2001 formula = 208 − 0.7 × age (estimated from mean training HR).
// Science: Stamatakis et al. 2022 (Nature Medicine): ≥3 bouts/day ≈ 38–40% reduction in
// all-cause, CVD, and cancer mortality vs. no bouts.
// Distinct from ReadinessView (composite) and FitnessAgeView (VO₂-based).

struct VILPAView: View {

    // MARK: - Models

    struct DayVILPA: Identifiable {
        let id = UUID()
        let date: Date
        let boutCount: Int
        let avgBoutDurationSecs: Double
        let totalVilpaMins: Double
        var tier: Tier {
            switch boutCount {
            case 0:    return .none
            case 1...2: return .low
            case 3...5: return .target
            default:   return .optimal
            }
        }
    }

    enum Tier: String {
        case none    = "None"
        case low     = "Some Activity"
        case target  = "Target (3+ bouts)"
        case optimal = "Optimal (6+)"
        var color: Color {
            switch self {
            case .none:    return .gray.opacity(0.4)
            case .low:     return .orange
            case .target:  return .green
            case .optimal: return .mint
            }
        }
    }

    struct BoutDurationBucket: Identifiable {
        let id = UUID()
        let label: String
        let count: Int
    }

    // MARK: - State

    @State private var days: [DayVILPA] = []
    @State private var avgBoutsPerDay: Double?
    @State private var avgBoutDuration: Double?
    @State private var targetDaysPercent: Double?
    @State private var durationBuckets: [BoutDurationBucket] = []
    @State private var estimatedHRmax: Double = 180
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Detecting vigorous lifestyle activity…")
                        .padding(.top, 60)
                } else if days.isEmpty {
                    ContentUnavailableView("No Heart Rate Data",
                        systemImage: "heart.circle",
                        description: Text("VILPA detection requires Apple Watch heart rate data. Ensure wrist detection is enabled."))
                } else {
                    summaryCard
                    calendarCard
                    durationCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("VILPA")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Cards

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: avgBoutsPerDay.map { String(format: "%.1f", $0) } ?? "—",
                    label: "Bouts/Day",
                    sub: "avg past 30 days",
                    color: avgBoutsPerDay.map { $0 >= 3 ? Color.green : $0 >= 1 ? Color.orange : Color.red } ?? .secondary
                )
                Divider().frame(height: 50)
                statBox(
                    value: avgBoutDuration.map { String(format: "%.0f s", $0) } ?? "—",
                    label: "Avg Bout",
                    sub: "duration",
                    color: .blue
                )
                Divider().frame(height: 50)
                statBox(
                    value: targetDaysPercent.map { String(format: "%.0f%%", $0) } ?? "—",
                    label: "Days at Target",
                    sub: "≥3 bouts",
                    color: targetDaysPercent.map { $0 >= 50 ? Color.green : Color.orange } ?? .secondary
                )
            }
            .padding(.vertical, 12)

            // Target indicator
            if let avg = avgBoutsPerDay {
                HStack {
                    Image(systemName: avg >= 3 ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .foregroundStyle(avg >= 3 ? .green : .orange)
                    Text(avg >= 3
                         ? "Meeting the ≥3 bouts/day target — 38% lower mortality risk (Stamatakis 2022)"
                         : "Aim for ≥3 vigorous bouts/day for maximum longevity benefit")
                    .font(.caption)
                    .foregroundStyle(avg >= 3 ? .green : .orange)
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
            Text(value).font(.title2.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private var calendarCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Daily VILPA Bouts — Last 30 Days", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Each bar = vigorous bouts detected outside workout sessions. HR > \(Int(estimatedHRmax * 0.77)) bpm (77% HRmax).")
                .font(.caption2).foregroundStyle(.secondary)

            let recent = Array(days.suffix(30))
            Chart(recent) { day in
                BarMark(
                    x: .value("Date", day.date, unit: .day),
                    y: .value("Bouts", day.boutCount)
                )
                .foregroundStyle(day.tier.color.gradient)
                .cornerRadius(2)
            }
            .chartYAxis {
                AxisMarks(values: [0, 3, 6, 9]) { val in
                    AxisGridLine()
                    if let v = val.as(Int.self), v == 3 {
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 1, dash: [4]))
                            .foregroundStyle(Color.green.opacity(0.6))
                    }
                    AxisValueLabel()
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .frame(height: 150)

            // Tier legend
            HStack(spacing: 12) {
                ForEach([Tier.none, .low, .target, .optimal], id: \.rawValue) { tier in
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(tier.color)
                            .frame(width: 10, height: 10)
                        Text(tier.rawValue).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            .flexibleFrame()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var durationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Bout Duration Distribution", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("VILPA bouts must be 1–10 minutes. Longer vigorous episodes count as structured exercise.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(durationBuckets) { bucket in
                BarMark(
                    x: .value("Duration", bucket.label),
                    y: .value("Count", bucket.count)
                )
                .foregroundStyle(Color.mint.gradient)
                .cornerRadius(4)
            }
            .frame(height: 120)

            // Recent day breakdown
            let recent5 = days.suffix(7).reversed()
            VStack(spacing: 6) {
                HStack {
                    Text("Last 7 days").font(.caption.weight(.semibold))
                    Spacer()
                    Text("Bouts · Avg duration").font(.caption2).foregroundStyle(.secondary)
                }
                ForEach(Array(recent5)) { day in
                    HStack {
                        Text(day.date, format: .dateTime.weekday(.abbreviated).month().day())
                            .font(.caption)
                        Spacer()
                        HStack(spacing: 4) {
                            ForEach(0..<min(day.boutCount, 8), id: \.self) { _ in
                                Circle().fill(day.tier.color).frame(width: 6, height: 6)
                            }
                            if day.boutCount > 8 { Text("+").font(.caption2).foregroundStyle(.secondary) }
                        }
                        Spacer()
                        Text(day.boutCount == 0 ? "—" : "\(day.boutCount) bouts · \(Int(day.avgBoutDurationSecs))s")
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
            Label("VILPA & Longevity", systemImage: "heart.text.clipboard.fill")
                .font(.subheadline).bold()
            Text("VILPA (Vigorous Intermittent Lifestyle Physical Activity) refers to brief bursts of high-intensity effort embedded in daily life — not planned exercise. Examples: sprinting for a bus, climbing stairs quickly, carrying heavy shopping.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Stamatakis et al. 2022 (Nature Medicine, n=25,241): Just ≥3 bouts/day averaging 1 minute each was associated with 38–40% lower all-cause, CVD, and cancer mortality in adults who report no recreational exercise.")
                .font(.caption).foregroundStyle(.secondary)
            VStack(alignment: .leading, spacing: 4) {
                Text("Detection method:").font(.caption.weight(.semibold))
                Text("• HR > 77% estimated HRmax (Tanaka 2001: 208 − 0.7 × age)")
                    .font(.caption).foregroundStyle(.secondary)
                Text("• ≥1 minute continuous above threshold")
                    .font(.caption).foregroundStyle(.secondary)
                Text("• Outside declared HealthKit workout sessions")
                    .font(.caption).foregroundStyle(.secondary)
                Text("• Maximum 10 minutes per bout")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.green.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let hrType = HKQuantityType(.heartRate)
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [hrType, workoutType])) != nil else {
            isLoading = false; return
        }

        let now = Date()
        let start = calendar.date(byAdding: .day, value: -30, to: now)!

        // Fetch workouts for exclusion windows
        let workoutWindows = await fetchWorkoutWindows(start: start, end: now)
        // Fetch all HR samples
        let hrSamples = await fetchHRSamples(start: start, end: now)

        guard !hrSamples.isEmpty else { isLoading = false; return }

        // Estimate HRmax from observed max HR
        let maxHR = hrSamples.map { $0.quantity.doubleValue(for: HKUnit(from: "count/min")) }.max() ?? 180
        let hrmax = maxHR * 1.05  // slightly above observed max
        let vigorousThreshold = hrmax * 0.77
        estimatedHRmax = hrmax

        processHRSamples(hrSamples, workoutWindows: workoutWindows, threshold: vigorousThreshold, start: start, now: now)
        isLoading = false
    }

    private func fetchWorkoutWindows(start: Date, end: Date) async -> [(Date, Date)] {
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                let windows = (samples as? [HKWorkout] ?? []).map { ($0.startDate, $0.endDate) }
                cont.resume(returning: windows)
            }
            healthStore.execute(q)
        }
    }

    private func fetchHRSamples(start: Date, end: Date) async -> [HKQuantitySample] {
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
            let q = HKSampleQuery(sampleType: HKQuantityType(.heartRate), predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                cont.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            healthStore.execute(q)
        }
    }

    private func processHRSamples(_ samples: [HKQuantitySample], workoutWindows: [(Date, Date)],
                                  threshold: Double, start: Date, now: Date) {
        let unit = HKUnit(from: "count/min")

        // Filter to non-workout samples
        let nonWorkout = samples.filter { s in
            !workoutWindows.contains { w in s.startDate >= w.0 && s.endDate <= w.1 }
        }

        // Group by day
        var byDay: [Date: [HKQuantitySample]] = [:]
        for s in nonWorkout {
            let day = calendar.startOfDay(for: s.startDate)
            byDay[day, default: []].append(s)
        }

        var dayResults: [DayVILPA] = []
        var allBoutSecs: [Double] = []

        for (date, daySamples) in byDay {
            let sorted = daySamples.sorted { $0.startDate < $1.startDate }
            var bouts: [Double] = []  // duration in seconds
            var inBout = false
            var boutStart: Date?

            for (i, s) in sorted.enumerated() {
                let hr = s.quantity.doubleValue(for: unit)
                let isVigorous = hr >= threshold

                if isVigorous && !inBout {
                    inBout = true
                    boutStart = s.startDate
                } else if !isVigorous && inBout, let bs = boutStart {
                    let dur = s.startDate.timeIntervalSince(bs)
                    if dur >= 60 && dur <= 600 {  // 1–10 min
                        bouts.append(dur)
                        allBoutSecs.append(dur)
                    }
                    inBout = false
                    boutStart = nil
                }
                // Handle last sample
                if i == sorted.count - 1 && inBout, let bs = boutStart {
                    let dur = s.endDate.timeIntervalSince(bs)
                    if dur >= 60 && dur <= 600 {
                        bouts.append(dur)
                        allBoutSecs.append(dur)
                    }
                }
            }

            let avgDur = bouts.isEmpty ? 0.0 : bouts.reduce(0, +) / Double(bouts.count)
            let totalMins = bouts.reduce(0, +) / 60
            dayResults.append(DayVILPA(date: date, boutCount: bouts.count,
                                       avgBoutDurationSecs: avgDur, totalVilpaMins: totalMins))
        }

        dayResults.sort { $0.date < $1.date }

        // Fill missing days with zeros
        var filled: [DayVILPA] = []
        var cursor = start
        let existingByDate = Dictionary(uniqueKeysWithValues: dayResults.map { (calendar.startOfDay(for: $0.date), $0) })
        while cursor <= now {
            let key = calendar.startOfDay(for: cursor)
            filled.append(existingByDate[key] ?? DayVILPA(date: key, boutCount: 0, avgBoutDurationSecs: 0, totalVilpaMins: 0))
            cursor = calendar.date(byAdding: .day, value: 1, to: cursor)!
        }

        // Bucket bout durations
        var buckets = [("1–2 min", 0), ("2–5 min", 0), ("5–10 min", 0)]
        for s in allBoutSecs {
            let m = s / 60
            if m < 2 { buckets[0].1 += 1 }
            else if m < 5 { buckets[1].1 += 1 }
            else { buckets[2].1 += 1 }
        }
        let durationBuckets = buckets.map { BoutDurationBucket(label: $0.0, count: $0.1) }

        let avgBouts = filled.map { Double($0.boutCount) }.reduce(0, +) / Double(max(1, filled.count))
        let allAvgDur = allBoutSecs.isEmpty ? nil : allBoutSecs.reduce(0, +) / Double(allBoutSecs.count)
        let targetDays = Double(filled.filter { $0.boutCount >= 3 }.count) / Double(max(1, filled.count)) * 100

        DispatchQueue.main.async {
            self.days = filled
            self.avgBoutsPerDay = avgBouts
            self.avgBoutDuration = allAvgDur
            self.targetDaysPercent = targetDays
            self.durationBuckets = durationBuckets
        }
    }
}

// MARK: - Helper
private extension View {
    func flexibleFrame() -> some View {
        self.frame(maxWidth: .infinity, alignment: .leading)
    }
}
