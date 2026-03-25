import SwiftUI
import Charts
import HealthKit

// MARK: - DailyReadinessView

/// Composite daily readiness score (0–100) modeled on WHOOP / Garmin Body Battery.
///
/// Score components (weighted):
///   HRV ratio (40%)  — today's HRV vs 30-day rolling average. Ratio ≥1.05 = top marks
///   RHR delta (30%)  — today's resting HR vs 30-day baseline. Lower = better
///   Sleep score (30%)— last night's sleep duration mapped to 0–100
///
/// Readiness zones:
///   80–100  Optimal (green)   — push hard, peak performance window
///   60–79   Good (yellow)     — normal training, moderate intensity
///   40–59   Moderate (orange) — reduce volume, prioritize recovery
///   0–39    Low (red)         — active recovery only, monitor for illness
///
/// This view does NOT upload data — it is a local analytics computation only.
struct DailyReadinessView: View {

    struct DayScore: Identifiable {
        let id: Date
        let date: Date
        let score: Int          // 0–100
        let hrvRatio: Double    // today's HRV / 30d avg
        let rhrDelta: Double    // today's RHR - baseline
        let sleepHours: Double
        let zone: ReadinessZone
    }

    enum ReadinessZone: String {
        case optimal  = "Optimal"
        case good     = "Good"
        case moderate = "Moderate"
        case low      = "Low"

        init(score: Int) {
            if score >= 80      { self = .optimal }
            else if score >= 60 { self = .good }
            else if score >= 40 { self = .moderate }
            else                { self = .low }
        }

        var color: Color {
            switch self {
            case .optimal:  return .green
            case .good:     return .yellow
            case .moderate: return .orange
            case .low:      return .red
            }
        }

        var recommendation: String {
            switch self {
            case .optimal:
                return "Your body is primed for peak effort. Great day for a hard workout, race, or high-intensity session."
            case .good:
                return "Solid recovery. Normal training intensity is appropriate. Avoid a second consecutive hard day."
            case .moderate:
                return "Partially recovered. Consider reducing volume or intensity by 20–30%. Prioritize sleep tonight."
            case .low:
                return "Low recovery. Active recovery, light movement, or rest day. Investigate sleep quality or illness."
            }
        }

        var trainingGuidance: [(String, Color)] {
            switch self {
            case .optimal:
                return [("✅ Race or max effort", .green), ("✅ HIIT / intervals", .green), ("✅ Long run", .green), ("✅ Heavy strength", .green)]
            case .good:
                return [("✅ Tempo run or threshold", .green), ("✅ Moderate strength", .green), ("⚠️ Delay hard intervals", .orange), ("✅ Long easy aerobic", .green)]
            case .moderate:
                return [("✅ Zone 2 / easy run", .green), ("✅ Yoga or stretching", .green), ("❌ Avoid HIIT", .red), ("⚠️ Light strength only", .orange)]
            case .low:
                return [("✅ Walk or light mobility", .green), ("✅ Meditation / breathwork", .green), ("❌ Avoid hard workouts", .red), ("❌ Skip strength session", .red)]
            }
        }
    }

    @State private var history: [DayScore] = []
    @State private var todayScore: Int = 0
    @State private var todayZone: ReadinessZone = .good
    @State private var todayHRVRatio: Double = 1.0
    @State private var todayRHRDelta: Double = 0
    @State private var todaySleepHours: Double = 0
    @State private var daysOptimal: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if history.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    todayCard
                    guidanceCard
                    trendChart
                    componentBreakdownCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Daily Readiness")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Today Card

    private var todayCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's Readiness")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(todayScore)")
                            .font(.system(size: 72, weight: .bold, design: .rounded))
                            .foregroundStyle(todayZone.color)
                        Text("/ 100")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 12)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(todayZone.color).frame(width: 8, height: 8)
                        Text(todayZone.rawValue)
                            .font(.headline).foregroundStyle(todayZone.color)
                    }
                }
                Spacer()
                // Circular gauge
                ZStack {
                    Circle()
                        .stroke(todayZone.color.opacity(0.15), lineWidth: 10)
                        .frame(width: 90, height: 90)
                    Circle()
                        .trim(from: 0, to: CGFloat(todayScore) / 100)
                        .stroke(todayZone.color, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 90, height: 90)
                    Text("\(todayScore)")
                        .font(.title2.bold().monospacedDigit())
                        .foregroundStyle(todayZone.color)
                }
            }
            Divider()
            Text(todayZone.recommendation)
                .font(.subheadline).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Training Guidance Card

    private var guidanceCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Training Guidance").font(.headline)
            let guidance = todayZone.trainingGuidance
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(guidance, id: \.0) { item in
                    HStack(spacing: 6) {
                        Text(item.0).font(.caption).foregroundStyle(item.1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 10).padding(.vertical, 7)
                    .background(item.1.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - 30-Day Trend Chart

    private var trendChart: some View {
        let scoremax = history.map(\.score).max().map { Swift.max($0, 10) } ?? 100
        return VStack(alignment: .leading, spacing: 8) {
            Text("30-Day Readiness Trend").font(.headline)
            Chart {
                ForEach(history) { d in
                    LineMark(x: .value("Date", d.date), y: .value("Score", d.score))
                        .foregroundStyle(Color.blue.opacity(0.5))
                        .interpolationMethod(.catmullRom)
                    AreaMark(x: .value("Date", d.date), y: .value("Score", d.score))
                        .foregroundStyle(Color.blue.opacity(0.08))
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Date", d.date), y: .value("Score", d.score))
                        .foregroundStyle(d.zone.color)
                        .symbolSize(20)
                }
                RuleMark(y: .value("Optimal", 80))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("80").font(.caption2).foregroundStyle(.green)
                    }
                RuleMark(y: .value("Low", 40))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
                    .foregroundStyle(Color.red.opacity(0.3))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("40").font(.caption2).foregroundStyle(.red)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYScale(domain: 0...scoremax)
            .frame(height: 170)

            // Zone legend
            HStack(spacing: 12) {
                ForEach([ReadinessZone.optimal, .good, .moderate, .low], id: \.rawValue) { z in
                    HStack(spacing: 4) {
                        Circle().fill(z.color).frame(width: 7, height: 7)
                        Text(z.rawValue).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Component Breakdown Card

    private var componentBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Score Components (Today)").font(.headline)

            // HRV component
            componentRow(
                icon: "waveform.path.ecg",
                label: "HRV (40%)",
                detail: todayHRVRatio >= 1 ? String(format: "+%.0f%% vs baseline", (todayHRVRatio - 1) * 100) :
                                             String(format: "%.0f%% vs baseline", (todayHRVRatio - 1) * 100),
                score: min(100, max(0, Int((todayHRVRatio - 0.7) / 0.6 * 100))),
                color: todayHRVRatio >= 1.05 ? .green : todayHRVRatio >= 0.95 ? .yellow : .orange
            )

            // RHR component
            let rhrScore = min(100, max(0, Int(100 - (todayRHRDelta + 5) * 10)))
            componentRow(
                icon: "heart.fill",
                label: "Resting HR (30%)",
                detail: todayRHRDelta >= 0 ? String(format: "+%.0f bpm vs baseline", todayRHRDelta) :
                                             String(format: "%.0f bpm vs baseline", todayRHRDelta),
                score: rhrScore,
                color: todayRHRDelta <= -2 ? .green : todayRHRDelta <= 2 ? .yellow : .orange
            )

            // Sleep component
            let sleepScore = sleepDurationScore(todaySleepHours)
            componentRow(
                icon: "moon.fill",
                label: "Sleep (30%)",
                detail: String(format: "%.1f hours last night", todaySleepHours),
                score: sleepScore,
                color: sleepScore >= 80 ? .green : sleepScore >= 60 ? .yellow : .orange
            )

            HStack(spacing: 0) {
                statCell(label: "Optimal Days", value: "\(daysOptimal)", color: .green)
                Divider().frame(height: 36)
                statCell(label: "Avg Score (30d)", value: "\(history.map(\.score).reduce(0, +) / max(1, history.count))", color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Best Score", value: "\(history.map(\.score).max() ?? 0)", color: .green)
                Divider().frame(height: 36)
                statCell(label: "Lowest Score", value: "\(history.map(\.score).min() ?? 0)", color: .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func componentRow(icon: String, label: String, detail: String, score: Int, color: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).foregroundStyle(color).frame(width: 22)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.caption.bold())
                Text(detail).font(.caption2).foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(score)").font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3).fill(color.opacity(0.1)).frame(width: 60, height: 8)
                RoundedRectangle(cornerRadius: 3).fill(color).frame(width: CGFloat(score) / 100 * 60, height: 8)
            }
        }
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "brain.head.profile").foregroundStyle(.blue)
                Text("How Readiness Is Calculated").font(.headline)
            }
            VStack(alignment: .leading, spacing: 6) {
                sciRow(label: "HRV (40%)", body: "High HRV relative to your baseline signals the parasympathetic system is dominant — rest & recovery mode. Low HRV indicates sympathetic stress or incomplete recovery.")
                sciRow(label: "Resting HR (30%)", body: "Your resting HR naturally fluctuates ±5 bpm. Elevation above your baseline (especially at night) often precedes illness, overtraining, or alcohol effects by 12–24 hours.")
                sciRow(label: "Sleep (30%)", body: "7–9 hours drives optimal recovery for most adults (Walker, 2017). Each 30-min deficit below 7h reduces cognitive performance and physical output by ~5%.")
            }
            Divider()
            Text("This is a simplified model. For clinical-grade readiness, devices like WHOOP, Garmin, and Polar H10 use multi-night algorithms with skin temperature and blood oxygen weighting.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.blue.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(label: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption.bold()).foregroundStyle(.blue)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "gauge.with.dots.needle.67percent")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("Building Your Baseline…")
                .font(.title3.bold())
            Text("Readiness score requires at least 5 days of HRV, resting heart rate, and sleep data from Apple Watch. Keep wearing your Watch overnight and check back soon.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Scoring Helpers

    private func sleepDurationScore(_ hours: Double) -> Int {
        if hours <= 0 { return 0 }
        if hours < 5  { return 20 }
        if hours < 6  { return 50 }
        if hours < 7  { return 70 }
        if hours <= 9 { return 100 }
        return 85 // slight penalty for very long sleep (possible illness)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let hrvType = HKQuantityType(.heartRateVariabilitySDNN)
        let rhrType = HKQuantityType(.restingHeartRate)
        let sleepType = HKCategoryType(.sleepAnalysis)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [hrvType, rhrType, sleepType])) != nil else { return }

        let cal = Calendar.current
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let msUnit = HKUnit.secondUnit(with: .milli)

        // Fetch HRV samples
        let hrvSamples: [HKQuantitySample] = await fetchSamples(type: hrvType, start: thirtyDaysAgo)
        let rhrSamples: [HKQuantitySample] = await fetchSamples(type: rhrType, start: thirtyDaysAgo)
        let sleepSamples: [HKCategorySample] = await fetchCategorySamples(type: sleepType, start: thirtyDaysAgo)

        guard !hrvSamples.isEmpty || !rhrSamples.isEmpty else { return }

        // Group HRV by day
        var hrvByDay: [Date: [Double]] = [:]
        for s in hrvSamples {
            let day = cal.startOfDay(for: s.startDate)
            hrvByDay[day, default: []].append(s.quantity.doubleValue(for: msUnit))
        }

        // Group RHR by day
        var rhrByDay: [Date: [Double]] = [:]
        for s in rhrSamples {
            let day = cal.startOfDay(for: s.startDate)
            rhrByDay[day, default: []].append(s.quantity.doubleValue(for: hrUnit))
        }

        // Group sleep by night (day sample ends in morning)
        var sleepByDay: [Date: Double] = [:]
        for s in sleepSamples {
            guard let val = HKCategoryValueSleepAnalysis(rawValue: s.value),
                  val != .inBed else { continue }
            let day = cal.startOfDay(for: s.endDate)
            sleepByDay[day, default: 0] += s.endDate.timeIntervalSince(s.startDate) / 3600
        }

        // Compute 30-day baselines
        let allHRVs = hrvSamples.map { $0.quantity.doubleValue(for: msUnit) }
        let allRHRs = rhrSamples.map { $0.quantity.doubleValue(for: hrUnit) }
        let baselineHRV = allHRVs.isEmpty ? 50.0 : allHRVs.reduce(0, +) / Double(allHRVs.count)
        let baselineRHR = allRHRs.isEmpty ? 60.0 : allRHRs.reduce(0, +) / Double(allRHRs.count)

        // Build daily scores
        var days: Set<Date> = []
        hrvByDay.keys.forEach { days.insert($0) }
        rhrByDay.keys.forEach { days.insert($0) }

        var scores: [DayScore] = []
        for day in days.sorted() {
            let dayHRV = hrvByDay[day].map { $0.reduce(0, +) / Double($0.count) } ?? baselineHRV
            let dayRHR = rhrByDay[day].map { $0.reduce(0, +) / Double($0.count) } ?? baselineRHR
            let dayHours = sleepByDay[day] ?? 6.5

            let hrvRatio = dayHRV / baselineHRV
            let rhrDelta = dayRHR - baselineRHR

            // Score components
            let hrvScore = min(100, max(0, Int((hrvRatio - 0.7) / 0.6 * 100)))
            let rhrScore = min(100, max(0, Int(100 - (rhrDelta + 5) * 10)))
            let sleepScore = sleepDurationScore(dayHours)

            let total = Int(Double(hrvScore) * 0.40 + Double(rhrScore) * 0.30 + Double(sleepScore) * 0.30)
            let zone = ReadinessZone(score: total)

            scores.append(DayScore(id: day, date: day, score: total,
                                   hrvRatio: hrvRatio, rhrDelta: rhrDelta,
                                   sleepHours: dayHours, zone: zone))
        }

        guard !scores.isEmpty else { return }

        history = scores.suffix(30)
        let latest = scores.last!
        todayScore = latest.score
        todayZone = latest.zone
        todayHRVRatio = latest.hrvRatio
        todayRHRDelta = latest.rhrDelta
        todaySleepHours = latest.sleepHours
        daysOptimal = scores.filter { $0.zone == .optimal }.count
    }

    private func fetchSamples(type: HKQuantityType, start: Date) async -> [HKQuantitySample] {
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type,
                predicate: HKQuery.predicateForSamples(withStart: start, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }
    }

    private func fetchCategorySamples(type: HKCategoryType, start: Date) async -> [HKCategorySample] {
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type,
                predicate: HKQuery.predicateForSamples(withStart: start, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
            healthStore.execute(q)
        }
    }
}

#Preview { NavigationStack { DailyReadinessView() } }
