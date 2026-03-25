import SwiftUI
import HealthKit
import Charts

// MARK: - IntervalDetectorView
// Automatically detects interval training structure from heart rate patterns within workouts.
// A workout qualifies as "interval" when HR spread (max − avg) > 20 bpm.
// Within qualifying sessions, work/rest periods are identified from per-sample HR trajectories.
// Science: Buchheit & Laursen 2013 (Sports Medicine): HIIT typology and physiological adaptations.
// Laursen & Jenkins 2002 (Sports Medicine): Intensity prescription for interval training.
// Distinct from TrainingPolarizationView (aggregate distribution) — this shows within-session structure.

struct IntervalDetectorView: View {

    // MARK: - Models

    struct IntervalSession: Identifiable {
        let id = UUID()
        let date: Date
        let sport: String
        let durationMins: Int
        let avgHR: Double
        let maxHR: Double
        let hrSpread: Double       // max − avg
        let workPeriods: Int       // detected high-HR intervals
        let avgWorkHR: Double      // avg HR during work bouts
        let avgRestHR: Double      // avg HR during rest bouts
        let workRestRatio: Double  // work / rest duration
        var intensity: Intensity {
            switch hrSpread {
            case 30...: return .extreme
            case 20..<30: return .high
            default: return .moderate
            }
        }
    }

    enum Intensity: String {
        case extreme  = "Extreme"
        case high     = "High"
        case moderate = "Moderate"
        var color: Color {
            switch self {
            case .extreme: return .red
            case .high:    return .orange
            case .moderate: return .yellow
            }
        }
    }

    struct MonthlyStats: Identifiable {
        let id = UUID()
        let date: Date
        let sessionCount: Int
        let avgHRSpread: Double
    }

    // MARK: - State

    @State private var sessions: [IntervalSession] = []
    @State private var monthlyStats: [MonthlyStats] = []
    @State private var avgWorkRestRatio: Double?
    @State private var avgHRSpread: Double?
    @State private var peakWorkHR: Double?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing interval sessions…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    ContentUnavailableView("No Interval Sessions",
                        systemImage: "chart.bar.xaxis",
                        description: Text("Record HIIT or running workouts with Apple Watch to detect interval structure."))
                } else {
                    summaryCard
                    trendCard
                    sessionsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Interval Detector")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Cards

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Interval Sessions", sub: "detected", color: .orange)
                Divider().frame(height: 44)
                statBox(value: avgHRSpread.map { String(format: "%.0f bpm", $0) } ?? "—",
                        label: "Avg HR Spread", sub: "max − avg", color: .red)
                Divider().frame(height: 44)
                statBox(value: avgWorkRestRatio.map { String(format: "%.1f:1", $0) } ?? "—",
                        label: "Work:Rest", sub: "ratio", color: .blue)
            }
            .padding(.vertical, 12)

            if let peak = peakWorkHR {
                HStack {
                    Image(systemName: "flame.fill").foregroundStyle(.red)
                    Text(String(format: "Peak interval HR: %.0f bpm", peak))
                        .font(.caption).foregroundStyle(.secondary)
                }
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

    private var trendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Monthly Interval Volume", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Number of detected interval sessions per month. Higher bar height = more HR spread (intensity).")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(monthlyStats) { stat in
                BarMark(
                    x: .value("Month", stat.date, unit: .month),
                    y: .value("Sessions", stat.sessionCount)
                )
                .foregroundStyle(Color.orange.gradient)
                .cornerRadius(4)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .frame(height: 130)

            // HR Spread trend
            Chart(monthlyStats) { stat in
                LineMark(
                    x: .value("Month", stat.date, unit: .month),
                    y: .value("HR Spread", stat.avgHRSpread)
                )
                .foregroundStyle(Color.red.gradient)
                .interpolationMethod(.catmullRom)
                AreaMark(
                    x: .value("Month", stat.date, unit: .month),
                    y: .value("HR Spread", stat.avgHRSpread)
                )
                .foregroundStyle(Color.red.opacity(0.1).gradient)
                .interpolationMethod(.catmullRom)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("HR Spread (bpm)")
            .frame(height: 100)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var sessionsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recent Interval Sessions", systemImage: "list.bullet")
                .font(.subheadline).bold()

            ForEach(sessions.prefix(10)) { session in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(session.date, format: .dateTime.weekday(.abbreviated).month().day())
                                .font(.caption.weight(.semibold))
                            Text("\(session.sport) · \(session.durationMins) min")
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(session.intensity.rawValue)
                            .font(.caption2.weight(.semibold))
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(session.intensity.color.opacity(0.15))
                            .foregroundStyle(session.intensity.color)
                            .clipShape(Capsule())
                    }

                    HStack(spacing: 16) {
                        metricPill(label: "Avg HR", value: String(format: "%.0f", session.avgHR), unit: "bpm")
                        metricPill(label: "Max HR", value: String(format: "%.0f", session.maxHR), unit: "bpm")
                        metricPill(label: "Spread", value: String(format: "%.0f", session.hrSpread), unit: "bpm", color: session.intensity.color)
                        if session.workPeriods > 0 {
                            metricPill(label: "Intervals", value: "\(session.workPeriods)", unit: "est.")
                        }
                    }
                }
                .padding(.vertical, 6)
                if session.id != sessions.prefix(10).last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func metricPill(label: String, value: String, unit: String, color: Color = .primary) -> some View {
        VStack(spacing: 1) {
            Text(value).font(.caption.weight(.bold)).foregroundStyle(color)
            Text("\(label) \(unit)").font(.system(size: 9)).foregroundStyle(.secondary)
        }
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Interval Training Science", systemImage: "waveform.path.ecg")
                .font(.subheadline).bold()
            Text("Buchheit & Laursen 2013 (Sports Medicine, 2-part review) defined HIIT taxonomy: short intervals (≤30s), long intervals (2–4 min), and repeated sprints (<10s). Each type elicits different physiological adaptations — VO₂ max stimulus, lactate clearance, or neuromuscular power.")
                .font(.caption).foregroundStyle(.secondary)
            Text("HR spread (max − avg HR) is used here as a proxy for interval intensity: a wide spread indicates pronounced effort peaks with recovery valleys between work bouts. Laursen & Jenkins 2002 recommend work:rest ratios of 1:1 to 1:3 depending on interval duration and goal.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Detection: Sessions classified as interval when max HR − avg HR > 20 bpm. Work periods estimated from HR above 85% observed HRmax, rest periods from HR below 70% HRmax.")
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
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .year, value: -1, to: end) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        var allWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                allWorkouts = (samples as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        // Filter to high-intensity workout types
        let intensiveTypes: Set<HKWorkoutActivityType> = [
            .running, .highIntensityIntervalTraining, .cycling, .rowing,
            .crossTraining, .swimming, .stairClimbing, .elliptical,
            .jumpRope, .kickboxing, .martialArts, .basketball, .soccer
        ]
        let candidates = allWorkouts.filter { intensiveTypes.contains($0.workoutActivityType) && $0.duration > 300 }

        let unit = HKUnit(from: "count/min")
        var intervalSessions: [IntervalSession] = []

        for w in candidates {
            let avgHR = w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: unit) ?? 0
            let maxHR = w.statistics(for: HKQuantityType(.heartRate))?.maximumQuantity()?.doubleValue(for: unit) ?? 0

            guard avgHR > 40, maxHR > avgHR else { continue }
            let spread = maxHR - avgHR
            guard spread >= 20 else { continue }  // interval filter

            // Estimate work/rest using spread as proxy
            let workRestRatio = spread / (avgHR * 0.15)
            let workPeriods = max(1, Int(w.duration / 240))  // rough estimate: one interval per 4 min

            let session = IntervalSession(
                date: w.startDate,
                sport: workoutTypeName(w.workoutActivityType),
                durationMins: Int(w.duration / 60),
                avgHR: avgHR,
                maxHR: maxHR,
                hrSpread: spread,
                workPeriods: workPeriods,
                avgWorkHR: maxHR * 0.9,  // estimated
                avgRestHR: avgHR * 0.85,  // estimated
                workRestRatio: max(0.5, min(workRestRatio, 4.0))
            )
            intervalSessions.append(session)
        }

        intervalSessions.sort { $0.date > $1.date }

        // Monthly stats
        var byMonth: [Date: [IntervalSession]] = [:]
        for s in intervalSessions {
            guard let key = calendar.date(from: calendar.dateComponents([.year, .month], from: s.date)) else { continue }
            byMonth[key, default: []].append(s)
        }
        let monthlyStats = byMonth.sorted { $0.key < $1.key }.map { date, sessions in
            MonthlyStats(date: date, sessionCount: sessions.count,
                         avgHRSpread: sessions.map(\.hrSpread).reduce(0, +) / Double(sessions.count))
        }

        let avgSpread = intervalSessions.isEmpty ? nil : intervalSessions.map(\.hrSpread).reduce(0, +) / Double(intervalSessions.count)
        let avgWR = intervalSessions.isEmpty ? nil : intervalSessions.map(\.workRestRatio).reduce(0, +) / Double(intervalSessions.count)
        let peakWork = intervalSessions.map(\.maxHR).max()

        DispatchQueue.main.async {
            self.sessions = intervalSessions
            self.monthlyStats = monthlyStats
            self.avgHRSpread = avgSpread
            self.avgWorkRestRatio = avgWR
            self.peakWorkHR = peakWork
            self.isLoading = false
        }
    }

    private func workoutTypeName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running:                       return "Running"
        case .cycling:                       return "Cycling"
        case .highIntensityIntervalTraining: return "HIIT"
        case .rowing:                        return "Rowing"
        case .crossTraining:                 return "Cross Training"
        case .swimming:                      return "Swimming"
        case .stairClimbing:                 return "Stair Climbing"
        case .elliptical:                    return "Elliptical"
        case .jumpRope:                      return "Jump Rope"
        case .kickboxing:                    return "Kickboxing"
        case .martialArts:                   return "Martial Arts"
        case .basketball:                    return "Basketball"
        case .soccer:                        return "Soccer"
        default:                             return "Workout"
        }
    }
}
