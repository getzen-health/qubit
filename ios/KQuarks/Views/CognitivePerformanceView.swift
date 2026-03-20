import SwiftUI
import HealthKit
import Charts

// MARK: - CognitivePerformanceView
// Estimates daily cognitive performance from three pillars: sleep, HRV, and training load.
// Science: Killgore 2010 (Neurosci Biobehav Rev): sleep deprivation impairs prefrontal
//   cortex, executive function, and decision-making in a dose-dependent fashion.
//   Harrison & Horne 2000 (Occup Environ Med): 17h wakefulness ≈ 0.05% BAC cognitive impairment.
//   Czeisler 2011 (Science): Chronic 6h/night sleep restriction accumulates cognitive deficit.
//   Boksem 2006 (Brain Res Rev): HRV predicts cognitive performance — lower HRV = worse attention.
// Score formula: 40% sleep duration adequacy + 30% HRV vs 7-day baseline + 30% training form (TSB proxy).

struct CognitivePerformanceView: View {

    // MARK: - Models

    struct DayCognitive: Identifiable {
        let id = UUID()
        let date: Date
        let sleepH: Double       // actual sleep hours
        let hrv: Double?         // morning HRV (SDNN ms)
        let tsbProxy: Double     // simplified training stress balance
        let sleepScore: Double   // 0–100
        let hrvScore: Double     // 0–100
        let loadScore: Double    // 0–100
        var overallScore: Double { sleepScore * 0.40 + hrvScore * 0.30 + loadScore * 0.30 }
        var level: CogLevel {
            switch overallScore {
            case 85...:  return .peak
            case 70..<85: return .high
            case 50..<70: return .moderate
            default:     return .low
            }
        }
    }

    enum CogLevel: String {
        case peak     = "Peak"
        case high     = "High"
        case moderate = "Moderate"
        case low      = "Impaired"
        var color: Color {
            switch self {
            case .peak:     return .cyan
            case .high:     return .green
            case .moderate: return .orange
            case .low:      return .red
            }
        }
        var icon: String {
            switch self {
            case .peak:     return "brain.head.profile"
            case .high:     return "checkmark.circle.fill"
            case .moderate: return "minus.circle"
            case .low:      return "exclamationmark.circle.fill"
            }
        }
        var advice: String {
            switch self {
            case .peak:     return "Excellent day for complex decisions, learning & creativity"
            case .high:     return "Good cognitive capacity — tackle priority tasks"
            case .moderate: return "Moderate focus — avoid high-stakes decisions if possible"
            case .low:      return "Impaired — rest, sleep, and avoid complex problem-solving"
            }
        }
    }

    // MARK: - State

    @State private var days: [DayCognitive] = []
    @State private var today: DayCognitive?
    @State private var avgScore: Double?
    @State private var bestDay: DayCognitive?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    private let eAtl = exp(-1.0 / 7.0)
    private let eCtl = exp(-1.0 / 42.0)
    private let kCalScale = 0.20  // TSB proxy scale

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Computing cognitive score…")
                        .padding(.top, 60)
                } else if days.isEmpty {
                    ContentUnavailableView("Insufficient Data",
                        systemImage: "brain.head.profile",
                        description: Text("Enable sleep tracking and HRV recording in Apple Health for cognitive performance scoring."))
                } else {
                    if let t = today { todayCard(t) }
                    componentCard
                    historyChart
                    peakDaysCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Cognitive Performance")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Today Card

    private func todayCard(_ day: DayCognitive) -> some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: day.level.icon)
                    .font(.largeTitle)
                    .foregroundStyle(day.level.color)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's Cognitive Score")
                        .font(.subheadline).foregroundStyle(.secondary)
                    HStack(alignment: .lastTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", day.overallScore))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(day.level.color)
                        Text("/ 100")
                            .font(.title3).foregroundStyle(.secondary)
                    }
                }
                Spacer()
                Text(day.level.rawValue)
                    .font(.headline.bold())
                    .foregroundStyle(day.level.color)
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(day.level.color.opacity(0.15))
                    .clipShape(Capsule())
            }
            .padding(.horizontal)

            Text(day.level.advice)
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
                .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Component Breakdown

    private var componentCard: some View {
        guard let day = today else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(alignment: .leading, spacing: 10) {
                Label("Score Components", systemImage: "square.grid.3x3")
                    .font(.subheadline).bold()

                componentRow(
                    label: "Sleep Quality",
                    value: day.sleepScore,
                    detail: String(format: "%.1f hrs (target: 8 hrs) · 40%% weight", day.sleepH),
                    color: day.sleepH >= 7 ? .green : day.sleepH >= 6 ? .orange : .red
                )
                Divider()
                componentRow(
                    label: "HRV Baseline",
                    value: day.hrvScore,
                    detail: day.hrv.map { String(format: "%.0f ms vs 7-day avg · 30%% weight", $0) } ?? "No HRV data · 30% weight",
                    color: day.hrvScore >= 80 ? .green : day.hrvScore >= 60 ? .orange : .red
                )
                Divider()
                componentRow(
                    label: "Training Load",
                    value: day.loadScore,
                    detail: "TSB form proxy (positive = fresher) · 30% weight",
                    color: day.loadScore >= 70 ? .green : day.loadScore >= 50 ? .orange : .red
                )
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
        )
    }

    private func componentRow(label: String, value: Double, detail: String, color: Color) -> some View {
        VStack(spacing: 4) {
            HStack {
                Text(label).font(.caption.bold())
                Spacer()
                Text(String(format: "%.0f", value)).font(.caption.bold()).foregroundStyle(color)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(Color(.tertiarySystemBackground))
                    RoundedRectangle(cornerRadius: 3).fill(color.opacity(0.7))
                        .frame(width: geo.size.width * min(value / 100, 1))
                }
            }
            .frame(height: 6)
            Text(detail).font(.caption2).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - History Chart

    private var historyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Cognitive Score — 30 Days", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("Daily estimated cognitive performance. Peaks with good sleep, high HRV, and training freshness.")
                .font(.caption2).foregroundStyle(.secondary)

            let recent = Array(days.suffix(30))
            Chart(recent) { day in
                AreaMark(
                    x: .value("Date", day.date, unit: .day),
                    y: .value("Score", day.overallScore)
                )
                .foregroundStyle(LinearGradient(
                    colors: [Color.cyan.opacity(0.4), Color.cyan.opacity(0.05)],
                    startPoint: .top, endPoint: .bottom
                ))
                LineMark(
                    x: .value("Date", day.date, unit: .day),
                    y: .value("Score", day.overallScore)
                )
                .foregroundStyle(Color.cyan)
                .lineStyle(StrokeStyle(lineWidth: 2))
            }
            .chartYScale(domain: 0...105)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 140)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Peak Days

    private var peakDaysCard: some View {
        let topDays = days.sorted { $0.overallScore > $1.overallScore }.prefix(5)
        return VStack(alignment: .leading, spacing: 8) {
            Label("Best Days (Last 30)", systemImage: "star.fill")
                .font(.subheadline).bold()

            ForEach(Array(topDays.enumerated()), id: \.offset) { i, day in
                HStack {
                    Text("\(i + 1)").font(.caption.bold()).foregroundStyle(.secondary).frame(width: 16)
                    Text(day.date, format: .dateTime.weekday(.abbreviated).month(.abbreviated).day())
                        .font(.caption)
                    Spacer()
                    Text(String(format: "%.0f", day.overallScore))
                        .font(.caption.bold())
                        .foregroundStyle(day.level.color)
                    Text(day.level.rawValue)
                        .font(.caption2)
                        .padding(.horizontal, 5).padding(.vertical, 1)
                        .background(day.level.color.opacity(0.15))
                        .foregroundStyle(day.level.color)
                        .clipShape(Capsule())
                }
                if i < topDays.count - 1 { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Cognitive Performance Science", systemImage: "brain")
                .font(.subheadline).bold()
            Text("Killgore 2010 (Neurosci Biobehav Rev): Sleep deprivation impairs prefrontal cortex function — executive decisions, working memory, and creative thinking. Effect is dose-dependent and cumulative across nights.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Harrison & Horne 2000 (Occup Environ Med): 17 hours of wakefulness produces cognitive impairment equivalent to 0.05% blood alcohol. Czeisler 2011 (Science): Chronic 6h/night produces deficits indistinguishable from total sleep deprivation.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Boksem et al. 2006 (Brain Res Rev): Reduced HRV predicts sustained attention failures. Training load (TSB): positive form = well-rested nervous system, improved reaction time and processing speed.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Score model: 40% sleep duration adequacy + 30% HRV vs 7-day baseline + 30% training stress balance. This is an estimation — individual variation is significant.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.cyan.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let sleepType = HKCategoryType(.sleepAnalysis)
        let hrvType   = HKQuantityType(.heartRateVariabilitySDNN)
        let workoutType = HKObjectType.workoutType()

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [sleepType, hrvType, workoutType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start60 = calendar.date(byAdding: .day, value: -60, to: end)!
        let start30 = calendar.date(byAdding: .day, value: -30, to: end)!

        // Sleep
        var sleepSamples: [HKCategorySample] = []
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: sleepType,
                                   predicate: HKQuery.predicateForSamples(withStart: start60, end: end),
                                   limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                sleepSamples = (s as? [HKCategorySample]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        // HRV
        var hrvSamples: [HKQuantitySample] = []
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: hrvType,
                                   predicate: HKQuery.predicateForSamples(withStart: start60, end: end),
                                   limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                hrvSamples = (s as? [HKQuantitySample]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        // Workouts for TSB proxy
        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType,
                                   predicate: HKQuery.predicateForSamples(withStart: start60, end: end),
                                   limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        processSamples(sleep: sleepSamples, hrv: hrvSamples, workouts: rawWorkouts, start: start30, end: end)
        isLoading = false
    }

    private func processSamples(sleep: [HKCategorySample], hrv: [HKQuantitySample],
                                  workouts: [HKWorkout], start: Date, end: Date) {
        // Daily sleep hours (asleep/REM/Core/Deep)
        let asleepValues = [
            HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
            HKCategoryValueSleepAnalysis.asleepREM.rawValue,
            HKCategoryValueSleepAnalysis.asleepCore.rawValue,
            HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
        ]
        var dailySleepH: [Date: Double] = [:]
        for s in sleep where asleepValues.contains(s.value) {
            let day = calendar.startOfDay(for: s.endDate)
            dailySleepH[day, default: 0] += s.endDate.timeIntervalSince(s.startDate) / 3600
        }

        // Daily HRV (morning average)
        var dailyHRV: [Date: [Double]] = [:]
        for s in hrv {
            let hour = calendar.component(.hour, from: s.startDate)
            if hour >= 4 && hour <= 10 {  // morning readings
                let day = calendar.startOfDay(for: s.startDate)
                dailyHRV[day, default: []].append(s.quantity.doubleValue(for: .init(from: "ms")))
            }
        }

        // 7-day rolling HRV average for baseline comparison
        func hrv7DayAvg(before date: Date) -> Double? {
            let week = (0..<7).compactMap { i -> [Double]? in
                guard let d = calendar.date(byAdding: .day, value: -i, to: date) else { return nil }
                return dailyHRV[calendar.startOfDay(for: d)]
            }.flatMap { $0 }
            return week.isEmpty ? nil : week.reduce(0, +) / Double(week.count)
        }

        // TSB proxy from workout energy
        var dailyKcal: [Date: Double] = [:]
        for w in workouts {
            let day = calendar.startOfDay(for: w.startDate)
            dailyKcal[day, default: 0] += (w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0) * kCalScale
        }
        var atl = 0.0, ctl = 0.0

        // Walk 60-day window to warm up TSB
        var cursor60 = calendar.startOfDay(for: calendar.date(byAdding: .day, value: -60, to: Date())!)
        while cursor60 < start {
            let t = dailyKcal[cursor60] ?? 0
            atl = atl * eAtl + t * (1 - eAtl)
            ctl = ctl * eCtl + t * (1 - eCtl)
            cursor60 = calendar.date(byAdding: .day, value: 1, to: cursor60)!
        }

        // Build day results
        var results: [DayCognitive] = []
        var cursor = calendar.startOfDay(for: start)
        while cursor <= calendar.startOfDay(for: end) {
            let t = dailyKcal[cursor] ?? 0
            atl = atl * eAtl + t * (1 - eAtl)
            ctl = ctl * eCtl + t * (1 - eCtl)
            let tsb = ctl - atl

            let sleepH = dailySleepH[cursor] ?? 0
            let sleepScore = min(100, sleepH / 8.0 * 100)

            let todayHRV = dailyHRV[cursor].map { vals in vals.reduce(0, +) / Double(vals.count) }
            let baselineHRV = hrv7DayAvg(before: cursor)
            let hrvScore: Double
            if let h = todayHRV, let b = baselineHRV, b > 0 {
                hrvScore = min(100, (h / b) * 80)  // 80 = perfect, scale down so >baseline isn't unreachable
            } else {
                hrvScore = 65  // neutral if no data
            }

            // TSB score: -30 → 0, 0 → 50, +25 → 100
            let tsbScore = max(0, min(100, (tsb + 30) / 55.0 * 100))

            results.append(DayCognitive(
                date: cursor,
                sleepH: sleepH,
                hrv: todayHRV,
                tsbProxy: tsb,
                sleepScore: sleepScore,
                hrvScore: hrvScore,
                loadScore: tsbScore
            ))
            cursor = calendar.date(byAdding: .day, value: 1, to: cursor)!
        }

        let todayKey = calendar.startOfDay(for: Date())
        let todayResult = results.first { calendar.startOfDay(for: $0.date) == todayKey }
        let avg = results.isEmpty ? nil : results.map(\.overallScore).reduce(0, +) / Double(results.count)

        DispatchQueue.main.async {
            self.days = results
            self.today = todayResult
            self.avgScore = avg
            self.isLoading = false
        }
    }
}
