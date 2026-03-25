import SwiftUI
import HealthKit
import Charts

// MARK: - EPOCView
// Estimates Excess Post-Exercise Oxygen Consumption (the metabolic "afterburn" effect).
// Science: Borsheim & Bahr 2003 (Sports Med): EPOC depends on exercise intensity and duration.
//   LaForgia et al. 2006 (J Sports Sci): HIIT produces ~6× more EPOC than steady-state.
//   Katch et al. 1992: EPOC magnitude correlates with exercise intensity above resting.
// Estimation method: EPOC_kcal ≈ totalEnergyBurned × intensity_factor
//   where intensity_factor is derived from kcal/min rate (proxy for metabolic intensity).
//   Light (<5 kcal/min) = 5%, Moderate (5–10) = 10%, Vigorous (10–15) = 15%, Max (>15) = 20%.
// Total post-workout calorie burn = workout kcal + EPOC kcal (can last 12–24h for HIIT).

struct EPOCView: View {

    // MARK: - Models

    struct WorkoutEPOC: Identifiable {
        let id = UUID()
        let date: Date
        let sport: String
        let durationMins: Double
        let workoutKcal: Double
        let epocKcal: Double
        let kcalPerMin: Double
        var intensity: IntensityLevel {
            switch kcalPerMin {
            case ..<5:  return .light
            case 5..<10: return .moderate
            case 10..<15: return .vigorous
            default:     return .maximal
            }
        }
        var totalBurn: Double { workoutKcal + epocKcal }
    }

    enum IntensityLevel: String, CaseIterable {
        case light    = "Light"
        case moderate = "Moderate"
        case vigorous = "Vigorous"
        case maximal  = "Maximal"
        var color: Color {
            switch self {
            case .light:    return .blue
            case .moderate: return .green
            case .vigorous: return .orange
            case .maximal:  return .red
            }
        }
        var epocFactor: Double {
            switch self {
            case .light:    return 0.05
            case .moderate: return 0.10
            case .vigorous: return 0.15
            case .maximal:  return 0.20
            }
        }
        var label: String {
            switch self {
            case .light:    return "< 5 kcal/min — 5% EPOC"
            case .moderate: return "5–10 kcal/min — 10% EPOC"
            case .vigorous: return "10–15 kcal/min — 15% EPOC"
            case .maximal:  return "> 15 kcal/min — 20% EPOC"
            }
        }
    }

    struct WeekEPOC: Identifiable {
        let id = UUID()
        let weekLabel: String
        let totalEPOC: Double
        let workoutCount: Int
    }

    // MARK: - State

    @State private var workouts: [WorkoutEPOC] = []
    @State private var weeklyEPOC: [WeekEPOC] = []
    @State private var avgEPOCPerWorkout: Double?
    @State private var totalWeeklyEPOC: Double?
    @State private var bestWorkout: WorkoutEPOC?
    @State private var sportTotals: [(sport: String, epoc: Double)] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Estimating EPOC…")
                        .padding(.top, 60)
                } else if workouts.isEmpty {
                    ContentUnavailableView("No Workout Data",
                        systemImage: "flame.fill",
                        description: Text("Log workouts in Apple Health to estimate EPOC afterburn."))
                } else {
                    summaryCard
                    weeklyChart
                    recentWorkoutsCard
                    if !sportTotals.isEmpty { sportCard }
                    epocGuideCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("EPOC — Afterburn Effect")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: totalWeeklyEPOC.map { String(format: "%.0f kcal", $0) } ?? "—",
                    label: "Weekly EPOC",
                    sub: "7-day total",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgEPOCPerWorkout.map { String(format: "%.0f kcal", $0) } ?? "—",
                    label: "Avg EPOC",
                    sub: "per workout",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: bestWorkout.map { String(format: "%.0f kcal", $0.epocKcal) } ?? "—",
                    label: "Best Session",
                    sub: "most afterburn",
                    color: .red
                )
            }
            .padding(.vertical, 12)

            if let best = bestWorkout {
                HStack {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(.orange)
                    Text("\(best.sport) on \(best.date, format: .dateTime.month(.abbreviated).day()) generated the most EPOC (\(String(format: "%.0f kcal", best.epocKcal)) afterburn, \(best.intensity.rawValue.lowercased()) intensity)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
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

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly EPOC — 8 Weeks", systemImage: "flame.circle.fill")
                .font(.subheadline).bold()
            Text("Total estimated afterburn calories per week. Higher intensity workouts generate disproportionately more EPOC.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weeklyEPOC) { week in
                BarMark(
                    x: .value("Week", week.weekLabel),
                    y: .value("EPOC", week.totalEPOC)
                )
                .foregroundStyle(Color.orange.gradient)
                .cornerRadius(3)
            }
            .frame(height: 130)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recent Workouts

    private var recentWorkoutsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Recent Sessions — EPOC Breakdown", systemImage: "list.bullet.rectangle")
                .font(.subheadline).bold()
            Text("Workout kcal + estimated EPOC = total metabolic impact of each session.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(workouts.prefix(8)) { w in
                VStack(spacing: 4) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(w.sport).font(.caption.bold())
                                Text(w.intensity.rawValue)
                                    .font(.caption2)
                                    .padding(.horizontal, 5).padding(.vertical, 1)
                                    .background(w.intensity.color.opacity(0.18))
                                    .foregroundStyle(w.intensity.color)
                                    .clipShape(Capsule())
                            }
                            Text(w.date, format: .dateTime.month(.abbreviated).day())
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "+%.0f kcal EPOC", w.epocKcal))
                                .font(.caption.bold())
                                .foregroundStyle(.orange)
                            Text(String(format: "%.0f min · %.0f kcal workout", w.durationMins, w.workoutKcal))
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    // Mini stacked bar: workout + EPOC
                    GeometryReader { geo in
                        let total = w.totalBurn
                        let workoutFraction = total > 0 ? w.workoutKcal / total : 1
                        HStack(spacing: 0) {
                            Rectangle()
                                .fill(w.intensity.color.opacity(0.7))
                                .frame(width: geo.size.width * workoutFraction)
                            Rectangle()
                                .fill(Color.orange.opacity(0.5))
                        }
                    }
                    .frame(height: 4)
                    .clipShape(Capsule())
                }
                if w.id != workouts.prefix(8).last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - By Sport

    private var sportCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("EPOC by Sport (30 Days)", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()

            let maxEPOC = sportTotals.map(\.epoc).max() ?? 1
            ForEach(sportTotals.prefix(6), id: \.sport) { item in
                HStack(spacing: 10) {
                    Text(item.sport)
                        .font(.caption)
                        .frame(width: 90, alignment: .leading)
                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.orange.opacity(0.7))
                            .frame(width: geo.size.width * (item.epoc / maxEPOC))
                    }
                    .frame(height: 14)
                    Text(String(format: "%.0f kcal", item.epoc))
                        .font(.caption2).foregroundStyle(.secondary)
                        .frame(width: 56, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - EPOC Guide

    private var epocGuideCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("EPOC by Intensity Level", systemImage: "flame")
                .font(.subheadline).bold()
            ForEach(IntensityLevel.allCases, id: \.self) { level in
                HStack(spacing: 10) {
                    Circle().fill(level.color).frame(width: 8, height: 8)
                    Text(level.rawValue).font(.caption.bold()).frame(width: 68, alignment: .leading)
                    Text(level.label).font(.caption2).foregroundStyle(.secondary)
                }
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
            Label("EPOC Science", systemImage: "lungs.fill")
                .font(.subheadline).bold()
            Text("Borsheim & Bahr 2003 (Sports Med): EPOC — elevated O₂ consumption after exercise to restore ATP, creatine phosphate, oxygen stores, and remove lactate — is proportional to exercise intensity and duration.")
                .font(.caption).foregroundStyle(.secondary)
            Text("LaForgia et al. 2006 (J Sports Sci): High-intensity interval training produces approximately 6× more EPOC than steady-state aerobic exercise of equal duration. EPOC from HIIT can persist 12–24 hours post-exercise.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Estimation: EPOC kcal ≈ workout kcal × intensity factor (5–20% based on kcal/min rate). This is a proxy — actual EPOC requires laboratory calorimetry.")
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
        let start = calendar.date(byAdding: .day, value: -60, to: end) ?? Date()

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let sort = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            let q = HKSampleQuery(
                sampleType: workoutType,
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: sort
            ) { _, samples, _ in
                rawWorkouts = (samples as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        processWorkouts(rawWorkouts, start: start, end: end)
        isLoading = false
    }

    private func processWorkouts(_ rawWorkouts: [HKWorkout], start: Date, end: Date) {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        var epocWorkouts: [WorkoutEPOC] = []
        var sportEPOC: [String: Double] = [:]

        for w in rawWorkouts {
            let durationMins = w.duration / 60
            guard durationMins > 2 else { continue }
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            guard kcal > 10 else { continue }

            let kcalPerMin = kcal / durationMins
            let level: IntensityLevel
            switch kcalPerMin {
            case ..<5:  level = .light
            case 5..<10: level = .moderate
            case 10..<15: level = .vigorous
            default:     level = .maximal
            }
            let epoc = kcal * level.epocFactor
            let sport = w.workoutActivityType.shortName

            epocWorkouts.append(WorkoutEPOC(
                date: w.startDate,
                sport: sport,
                durationMins: durationMins,
                workoutKcal: kcal,
                epocKcal: epoc,
                kcalPerMin: kcalPerMin
            ))
            sportEPOC[sport, default: 0] += epoc
        }

        // Weekly EPOC (last 8 weeks)
        func weekStart(for date: Date) -> Date {
            calendar.nextDate(after: date, matching: DateComponents(weekday: 2),
                              matchingPolicy: .previousTimePreservingSmallerComponents,
                              direction: .backward) ?? calendar.startOfDay(for: date)
        }
        var weekMap: [Date: Double] = [:]
        for w in epocWorkouts {
            weekMap[weekStart(for: w.date), default: 0] += w.epocKcal
        }
        let weeklyList = weekMap.sorted { $0.key < $1.key }.suffix(8).map { k, v in
            WeekEPOC(weekLabel: formatter.string(from: k), totalEPOC: v,
                      workoutCount: epocWorkouts.filter { weekStart(for: $0.date) == k }.count)
        }

        let recent7 = epocWorkouts.filter { $0.date >= calendar.date(byAdding: .day, value: -7, to: Date()) ?? Date() }
        let weekTotal = recent7.map(\.epocKcal).reduce(0, +)
        let avgEPOC = epocWorkouts.isEmpty ? nil : epocWorkouts.map(\.epocKcal).reduce(0, +) / Double(epocWorkouts.count)
        let best = epocWorkouts.max { $0.epocKcal < $1.epocKcal }
        let sportList = sportEPOC.sorted { $0.value > $1.value }.map { (sport: $0.key, epoc: $0.value) }

        DispatchQueue.main.async {
            self.workouts = epocWorkouts
            self.weeklyEPOC = weeklyList
            self.totalWeeklyEPOC = weekTotal > 0 ? weekTotal : nil
            self.avgEPOCPerWorkout = avgEPOC
            self.bestWorkout = best
            self.sportTotals = sportList
            self.isLoading = false
        }
    }
}

private extension HKWorkoutActivityType {
    var shortName: String {
        switch self {
        case .running:        return "Running"
        case .cycling:        return "Cycling"
        case .swimming:       return "Swimming"
        case .walking:        return "Walking"
        case .hiking:         return "Hiking"
        case .rowing:         return "Rowing"
        case .yoga:           return "Yoga"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength"
        case .highIntensityIntervalTraining: return "HIIT"
        case .crossTraining:  return "Cross Training"
        case .elliptical:     return "Elliptical"
        case .stairClimbing:  return "Stair Climb"
        default:              return "Workout"
        }
    }
}
