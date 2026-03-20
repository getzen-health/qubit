import SwiftUI
import HealthKit
import Charts

// MARK: - ExerciseSnacksView
// Tracks "exercise snacks" — short (≤15 min) workout sessions logged in HealthKit.
// Science: Gillen et al. 2016 (MSSE): 3 × 20-sec sprint interval "snacks" (10 min total)
//   = equivalent VO₂ max gains to 45 min moderate continuous exercise over 12 weeks.
// Batacan et al. 2017 (J Sports Sci): Brief intense bouts throughout the day improve
//   glucose tolerance, lipid profiles and blood pressure vs single longer session.
// Jenkins et al. 2019 (Appl Physiol Nutr Metab): 3 × 10-min walks after meals reduce
//   postprandial glucose by 22% vs one 30-min walk.
// Distinct from WorkoutEfficiencyView (kcal/min) and IntervalDetectorView (within-session intervals).

struct ExerciseSnacksView: View {

    // MARK: - Models

    struct Snack: Identifiable {
        let id = UUID()
        let date: Date
        let sport: String
        let durationMins: Int
        let calories: Int
        let avgHR: Double
        var intensity: SnackIntensity {
            switch avgHR {
            case 140...: return .vigorous
            case 110..<140: return .moderate
            default: return .light
            }
        }
    }

    enum SnackIntensity: String {
        case vigorous = "Vigorous"
        case moderate = "Moderate"
        case light    = "Light"
        var color: Color {
            switch self {
            case .vigorous: return .red
            case .moderate: return .orange
            case .light:    return .blue
            }
        }
    }

    struct WeeklyBucket: Identifiable {
        let id = UUID()
        let weekStart: Date
        let count: Int
        let totalCalories: Int
    }

    // MARK: - State

    @State private var snacks: [Snack] = []
    @State private var weeklyBuckets: [WeeklyBucket] = []
    @State private var avgSnacksPerWeek: Double?
    @State private var avgDurationMins: Double?
    @State private var snackCalorieFraction: Double?  // snack calories / total calories
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Finding exercise snacks…")
                        .padding(.top, 60)
                } else if snacks.isEmpty {
                    ContentUnavailableView("No Exercise Snacks",
                        systemImage: "bolt.circle",
                        description: Text("Log short workouts (≤15 min) in the Fitness or Health app to track exercise snacks."))
                } else {
                    summaryCard
                    weeklyChart
                    intensityCard
                    recentSnacks
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Exercise Snacks")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Cards

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(value: "\(snacks.count)", label: "Total Snacks", sub: "past 90 days", color: .orange)
                Divider().frame(height: 44)
                statBox(value: avgSnacksPerWeek.map { String(format: "%.1f", $0) } ?? "—",
                        label: "Per Week", sub: "avg frequency", color: .green)
                Divider().frame(height: 44)
                statBox(value: avgDurationMins.map { String(format: "%.0f min", $0) } ?? "—",
                        label: "Avg Duration", sub: "per snack", color: .blue)
            }
            .padding(.vertical, 12)

            if let frac = snackCalorieFraction {
                HStack {
                    Image(systemName: "flame.fill").foregroundStyle(.orange)
                    Text(String(format: "%.0f%% of your active calories come from snack sessions", frac * 100))
                        .font(.caption).foregroundStyle(.secondary)
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
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Snack Frequency", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Number of exercise snacks (≤15 min workouts) per week. 3+ per week maximises metabolic benefit.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weeklyBuckets) { bucket in
                BarMark(
                    x: .value("Week", bucket.weekStart, unit: .weekOfYear),
                    y: .value("Snacks", bucket.count)
                )
                .foregroundStyle(Color.orange.gradient)
                .cornerRadius(3)

                RuleMark(y: .value("Target", 3))
                    .foregroundStyle(Color.green.opacity(0.6))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("3/wk target").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear, count: 2)) { _ in
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

    private var intensityCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Snack Intensity Breakdown", systemImage: "figure.highintensity.intervaltraining")
                .font(.subheadline).bold()

            let vigorousCount = snacks.filter { $0.intensity == .vigorous }.count
            let moderateCount = snacks.filter { $0.intensity == .moderate }.count
            let lightCount = snacks.filter { $0.intensity == .light }.count
            let total = max(1, snacks.count)

            VStack(spacing: 8) {
                ForEach([(SnackIntensity.vigorous, vigorousCount), (.moderate, moderateCount), (.light, lightCount)], id: \.0.rawValue) { intensity, count in
                    HStack(spacing: 10) {
                        Text(intensity.rawValue)
                            .font(.caption.weight(.semibold))
                            .frame(width: 65, alignment: .leading)
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(intensity.color.opacity(0.2))
                                .overlay(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(intensity.color.gradient)
                                        .frame(width: geo.size.width * CGFloat(count) / CGFloat(total))
                                }
                        }
                        .frame(height: 16)
                        Text("\(count) sessions")
                            .font(.caption2).foregroundStyle(.secondary)
                            .frame(width: 65, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var recentSnacks: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recent Snacks", systemImage: "list.bullet")
                .font(.subheadline).bold()

            ForEach(snacks.prefix(8)) { snack in
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(snack.date, format: .dateTime.weekday(.abbreviated).month().day())
                            .font(.caption.weight(.semibold))
                        Text(snack.sport)
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("\(snack.durationMins) min")
                        .font(.caption2).foregroundStyle(.secondary)
                    Text(String(format: "%.0f bpm", snack.avgHR))
                        .font(.caption2).foregroundStyle(.secondary)
                    Text(snack.intensity.rawValue)
                        .font(.caption2.weight(.semibold))
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(snack.intensity.color.opacity(0.15))
                        .foregroundStyle(snack.intensity.color)
                        .clipShape(Capsule())
                }
                if snack.id != snacks.prefix(8).last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Exercise Snack Science", systemImage: "bolt.heart.fill")
                .font(.subheadline).bold()
            Text("Exercise snacks are short (1–15 min) vigorous or moderate activity bouts distributed throughout the day. Research shows they provide metabolic benefits independent of their brevity.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Gillen et al. 2016 (MSSE): 3 × 20-second all-out cycle sprints (10 min total with warm-up) = equivalent VO₂ max gains to 45 min moderate cycling over 12 weeks in healthy adults.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Jenkins et al. 2019: 3 × 10-min walks after meals reduced postprandial glucose by 22% vs one 30-min walk — timing around meals matters. Batacan et al. 2017: Repeated brief intense bouts improve blood lipids, blood pressure and insulin sensitivity.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Detection: workouts ≤15 minutes with heart rate data from Apple Watch.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.green.opacity(0.08))
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
        let start = calendar.date(byAdding: .day, value: -90, to: end)!
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

        let unit = HKUnit(from: "count/min")
        let snackMaxDuration: TimeInterval = 15 * 60  // 15 minutes

        // All workouts for calorie fraction
        let totalCalories = allWorkouts.reduce(0.0) { acc, w in
            acc + (w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0)
        }

        let snacks: [Snack] = allWorkouts
            .filter { $0.duration <= snackMaxDuration && $0.duration >= 60 }
            .compactMap { w in
                let avgHR = w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: unit) ?? 0
                let kcal = Int(w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0)
                guard avgHR > 0 else { return nil }
                return Snack(
                    date: w.startDate,
                    sport: workoutTypeName(w.workoutActivityType),
                    durationMins: max(1, Int(w.duration / 60)),
                    calories: kcal,
                    avgHR: avgHR
                )
            }

        // Weekly buckets
        var byWeek: [Date: [Snack]] = [:]
        for s in snacks {
            let weekComp = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)
            let weekStart = calendar.date(from: weekComp)!
            byWeek[weekStart, default: []].append(s)
        }
        let weeklyBuckets = byWeek.sorted { $0.key < $1.key }.map { date, weekSnacks in
            WeeklyBucket(weekStart: date, count: weekSnacks.count,
                         totalCalories: weekSnacks.map(\.calories).reduce(0, +))
        }

        let weeks = max(1, (calendar.dateComponents([.weekOfYear], from: start, to: end).weekOfYear ?? 12))
        let avgPerWeek = Double(snacks.count) / Double(weeks)
        let avgDuration = snacks.isEmpty ? nil : snacks.map { Double($0.durationMins) }.reduce(0, +) / Double(snacks.count)
        let snackCalories = Double(snacks.map(\.calories).reduce(0, +))
        let fraction = totalCalories > 0 ? snackCalories / totalCalories : nil

        DispatchQueue.main.async {
            self.snacks = snacks
            self.weeklyBuckets = weeklyBuckets
            self.avgSnacksPerWeek = avgPerWeek
            self.avgDurationMins = avgDuration
            self.snackCalorieFraction = fraction
            self.isLoading = false
        }
        isLoading = false
    }

    private func workoutTypeName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running:   return "Running"
        case .cycling:   return "Cycling"
        case .highIntensityIntervalTraining: return "HIIT"
        case .walking:   return "Walking"
        case .rowing:    return "Rowing"
        case .yoga:      return "Yoga"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength"
        case .stairClimbing: return "Stairs"
        case .jumpRope:  return "Jump Rope"
        case .elliptical: return "Elliptical"
        default:         return "Workout"
        }
    }
}
