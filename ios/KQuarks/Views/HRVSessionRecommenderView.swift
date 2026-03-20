import SwiftUI
import Charts
import HealthKit

// MARK: - HRVSessionRecommenderView

/// Uses today's HRV relative to the user's personal 30-day baseline to
/// recommend today's training intensity and suggest specific session types.
/// Based on HRV4Training and TrainingPeaks HRV-guided periodisation research.
struct HRVSessionRecommenderView: View {

    // MARK: - Models

    enum ReadinessZone: String {
        case highReadiness  = "High Readiness"
        case normalReadiness = "Normal Readiness"
        case reducedReadiness = "Reduced Readiness"
        case lowReadiness   = "Low Readiness"

        var color: Color {
            switch self {
            case .highReadiness:    return .green
            case .normalReadiness:  return .mint
            case .reducedReadiness: return .orange
            case .lowReadiness:     return .red
            }
        }

        var icon: String {
            switch self {
            case .highReadiness:    return "bolt.heart.fill"
            case .normalReadiness:  return "heart.fill"
            case .reducedReadiness: return "heart.slash.fill"
            case .lowReadiness:     return "zzz"
            }
        }

        var intensityLabel: String {
            switch self {
            case .highReadiness:    return "Hard Training Day"
            case .normalReadiness:  return "Moderate Training Day"
            case .reducedReadiness: return "Easy Training Day"
            case .lowReadiness:     return "Rest or Recovery Day"
            }
        }

        var advice: String {
            switch self {
            case .highReadiness:
                return "Your HRV is elevated above baseline — your nervous system is well-recovered. This is your green light for high-intensity intervals, tempo runs, strength PRs, or race efforts."
            case .normalReadiness:
                return "HRV is within your normal range. Today is suitable for moderate training: threshold work, steady-state cardio, or standard strength sessions."
            case .reducedReadiness:
                return "HRV is below baseline. Stick to Zone 2 aerobic work, yoga, or an easy sport session. Avoid intensity — you'll get more adaptation from an easy day than pushing through."
            case .lowReadiness:
                return "HRV is significantly below baseline. Your body is signalling that it needs recovery. Consider rest, gentle walking, or yoga only. Adding intensity today risks injury and overtraining."
            }
        }

        var sessionSuggestions: [(String, String)] {  // (type, duration)
            switch self {
            case .highReadiness:
                return [
                    ("Interval Run", "30–45 min with 6×4 min at 5K pace"),
                    ("Tempo Run", "45–60 min with 20 min at threshold"),
                    ("Strength PR", "45–60 min compound lifts, heavy"),
                    ("Long Ride", "60–90 min with climbs or sprints")
                ]
            case .normalReadiness:
                return [
                    ("Aerobic Run", "40–60 min easy to moderate effort"),
                    ("Strength Training", "45 min moderate load, good form"),
                    ("Swim", "30–45 min steady-state"),
                    ("Cycling", "60 min Zone 2–3 effort")
                ]
            case .reducedReadiness:
                return [
                    ("Zone 2 Run/Walk", "30–40 min easy pace, HR < 75% max"),
                    ("Yoga", "30–45 min restorative or hatha"),
                    ("Easy Swim", "20–30 min gentle laps"),
                    ("Light Strength", "20–30 min bodyweight or very light load")
                ]
            case .lowReadiness:
                return [
                    ("Rest", "Full rest day — prioritise sleep"),
                    ("Gentle Walk", "20–30 min easy stroll"),
                    ("Yin Yoga", "30 min stretching & breathing"),
                    ("Sauna/Bath", "Recovery modalities only")
                ]
            }
        }

        static func from(ratio: Double) -> ReadinessZone {
            if ratio >= 1.08  { return .highReadiness }
            if ratio >= 0.95  { return .normalReadiness }
            if ratio >= 0.85  { return .reducedReadiness }
            return .lowReadiness
        }
    }

    struct HRVDay: Identifiable {
        let id = UUID()
        let date: Date
        let hrv: Double
    }

    // MARK: - State

    @State private var todayHRV: Double = 0
    @State private var baseline: Double = 0
    @State private var ratio: Double = 0
    @State private var zone: ReadinessZone = .normalReadiness
    @State private var recentDays: [HRVDay] = []
    @State private var isLoading = true
    @State private var hasNoHRV = false

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if hasNoHRV {
                noHRVState
            } else {
                VStack(spacing: 16) {
                    readinessCard
                    hrvContextChart
                    suggestionsCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Today's Recommendation")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Readiness Card

    private var readinessCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Today's Training")
                        .font(.caption).foregroundStyle(.secondary)
                    Text(zone.intensityLabel)
                        .font(.title3.bold())
                        .foregroundStyle(zone.color)
                    HStack(spacing: 6) {
                        Circle().fill(zone.color).frame(width: 8, height: 8)
                        Text(zone.rawValue).font(.subheadline).foregroundStyle(zone.color)
                    }
                }
                Spacer()
                Image(systemName: zone.icon)
                    .font(.system(size: 44))
                    .foregroundStyle(zone.color)
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Today's HRV", value: todayHRV > 0 ? String(format: "%.0f ms", todayHRV) : "—", color: zone.color)
                Divider().frame(height: 36)
                statCell(label: "30-Day Baseline", value: baseline > 0 ? String(format: "%.0f ms", baseline) : "—", color: .secondary)
                Divider().frame(height: 36)
                statCell(label: "vs Baseline", value: ratio > 0 ? String(format: "%+.0f%%", (ratio - 1.0) * 100) : "—",
                         color: ratio >= 0.95 ? .green : .orange)
            }

            Divider()

            Text(zone.advice)
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
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

    // MARK: - HRV Context Chart

    private var hrvContextChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("HRV — Last 30 Days")
                .font(.headline)

            Chart {
                ForEach(recentDays) { d in
                    BarMark(x: .value("Date", d.date, unit: .day),
                            y: .value("ms", d.hrv))
                    .foregroundStyle(d.hrv >= baseline * 0.95 ? Color.teal.opacity(0.6) : Color.orange.opacity(0.6))
                    .cornerRadius(2)
                }

                if baseline > 0 {
                    RuleMark(y: .value("Baseline", baseline))
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.7))
                        .annotation(position: .topTrailing) {
                            Text("baseline").font(.caption2).foregroundStyle(.secondary)
                        }
                }

                if todayHRV > 0 {
                    if let lastDay = recentDays.last {
                        PointMark(x: .value("Date", lastDay.date, unit: .day),
                                  y: .value("Today", todayHRV))
                        .foregroundStyle(zone.color)
                        .symbolSize(80)
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .week)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("ms")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Suggestions Card

    private var suggestionsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Suggested Sessions")
                .font(.headline)

            ForEach(zone.sessionSuggestions, id: \.0) { suggestion in
                HStack(spacing: 12) {
                    Circle().fill(zone.color).frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(suggestion.0).font(.subheadline.bold())
                        Text(suggestion.1).font(.caption).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
                if suggestion.0 != zone.sessionSuggestions.last?.0 { Divider() }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("HRV-Guided Training Science", systemImage: "brain.head.profile")
                .font(.headline).foregroundStyle(.teal)

            Text("Heart Rate Variability reflects the balance between your sympathetic (fight-or-flight) and parasympathetic (rest-and-digest) nervous systems. Higher HRV = better recovered and more capacity for hard training.")
                .font(.caption).foregroundStyle(.secondary)

            Text("Research by Kiviniemi et al. (2010) showed HRV-guided training improved VO₂ max by 19% vs. a fixed plan — the adaptive approach reduces overtraining while increasing training volume on high-readiness days.")
                .font(.caption).foregroundStyle(.secondary)

            Text("Your personal baseline is your 30-day rolling average. A reading within ±5% is 'normal'; +8% or more is high readiness; -15% or more is a clear rest signal.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.teal.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - No HRV State

    private var noHRVState: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.slash.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No HRV Data")
                .font(.title3.bold())
            Text("HRV-guided recommendations require Apple Watch to record Heart Rate Variability (SDNN) overnight for at least 7 days.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let hrvType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            hasNoHRV = true; return
        }
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [hrvType])) != nil else {
            hasNoHRV = true; return
        }

        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let msUnit = HKUnit.secondUnit(with: .milli)

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date())
            let q = HKSampleQuery(sampleType: hrvType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { hasNoHRV = true; return }

        let cal = Calendar.current
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        var dayMap: [String: (Date, [Double])] = [:]

        for s in samples {
            let val = s.quantity.doubleValue(for: msUnit)
            let key = df.string(from: s.startDate)
            let dayStart = cal.startOfDay(for: s.startDate)
            var cur = dayMap[key] ?? (dayStart, [])
            cur.1.append(val)
            dayMap[key] = cur
        }

        let days = dayMap.map { _, val in
            HRVDay(date: val.0, hrv: val.1.reduce(0, +) / Double(val.1.count))
        }.sorted { $0.date < $1.date }

        recentDays = days
        todayHRV = days.last?.hrv ?? 0
        baseline = days.isEmpty ? 0 : days.map(\.hrv).reduce(0, +) / Double(days.count)
        ratio = baseline > 0 ? todayHRV / baseline : 1.0
        zone = ReadinessZone.from(ratio: ratio)
    }
}

#Preview { NavigationStack { HRVSessionRecommenderView() } }
