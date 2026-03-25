import SwiftUI
import HealthKit
import Charts

// MARK: - TrainingAgeView
// Estimates training age from HealthKit workout history — how many years of consistent training.
// Maps to Bompa & Buzzichelli 2015 training age classifications:
//   Novice 0–2 yr, Intermediate 3–5 yr, Advanced 6–10 yr, Elite 10+ yr
// Also shows yearly volume trend, preferred sport, and training consistency score.
// Distinct from FitnessAgeView (VO₂-based biological fitness) and BiologicalAgeView (biomarkers).

struct TrainingAgeView: View {

    // MARK: - Models

    enum TrainingLevel: String, CaseIterable {
        case novice       = "Novice"
        case intermediate = "Intermediate"
        case advanced     = "Advanced"
        case elite        = "Elite"

        var years: String {
            switch self {
            case .novice:       return "0–2 years"
            case .intermediate: return "3–5 years"
            case .advanced:     return "6–10 years"
            case .elite:        return "10+ years"
            }
        }
        var color: Color {
            switch self {
            case .novice:       return .blue
            case .intermediate: return .green
            case .advanced:     return .orange
            case .elite:        return .purple
            }
        }
        var icon: String {
            switch self {
            case .novice:       return "figure.walk"
            case .intermediate: return "figure.run"
            case .advanced:     return "figure.run.circle.fill"
            case .elite:        return "star.circle.fill"
            }
        }
        var description: String {
            switch self {
            case .novice:
                return "Building base fitness. Focus on consistency and habit formation. Body is still developing aerobic efficiency and neuromuscular coordination."
            case .intermediate:
                return "Training adaptations are well established. Can tolerate progressive overload. Ready for periodized training and sport-specific development."
            case .advanced:
                return "High training tolerance. Well-adapted cardiovascular and musculoskeletal systems. Benefits from advanced periodization and polarized training."
            case .elite:
                return "Maximally adapted physiology. Training gains are marginal and require highly individualized programming. Focus on maintaining peak performance."
            }
        }
        var trainingRecommendation: String {
            switch self {
            case .novice:
                return "3–4 sessions/week · Build to 150 min moderate activity · Prioritize form and consistency"
            case .intermediate:
                return "4–5 sessions/week · Introduce periodization · Add sport-specific sessions · Monitor HRV"
            case .advanced:
                return "5–6 sessions/week · Polarized 80/20 distribution · Structured mesocycles · Race-specific prep"
            case .elite:
                return "6–10+ sessions/week · Fully individualized · Double periodization · Performance monitoring"
            }
        }
    }

    struct YearlyVolume: Identifiable {
        let id = UUID()
        let year: Int
        let totalSessions: Int
        let totalMinutes: Int
        let topSport: String
    }

    struct SportBreakdown: Identifiable {
        let id = UUID()
        let name: String
        let sessions: Int
        let totalHours: Double
        let color: Color
    }

    // MARK: - State

    @State private var trainingAge: Double?          // estimated years of consistent training
    @State private var level: TrainingLevel?
    @State private var firstWorkoutDate: Date?
    @State private var consistencyScore: Int?        // 0–100
    @State private var yearlyVolumes: [YearlyVolume] = []
    @State private var sportBreakdown: [SportBreakdown] = []
    @State private var totalSessions: Int = 0
    @State private var totalHours: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    private static let sportColors: [Color] = [.blue, .orange, .green, .pink, .purple, .cyan, .red, .yellow]

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing training history…")
                        .padding(.top, 60)
                } else if yearlyVolumes.isEmpty {
                    ContentUnavailableView("No Workout History",
                        systemImage: "figure.run.circle",
                        description: Text("Record workouts in the Health app or Apple Fitness to estimate training age."))
                } else {
                    levelCard
                    statsCard
                    volumeChart
                    sportsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Training Age")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Cards

    private var levelCard: some View {
        VStack(spacing: 14) {
            if let lvl = level {
                Image(systemName: lvl.icon)
                    .font(.system(size: 48))
                    .foregroundStyle(lvl.color)

                VStack(spacing: 4) {
                    Text(lvl.rawValue)
                        .font(.title.weight(.bold))
                        .foregroundStyle(lvl.color)
                    if let ta = trainingAge {
                        Text(String(format: "~%.1f years of training", ta))
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    Text(lvl.years)
                        .font(.caption).foregroundStyle(.tertiary)
                        .padding(.horizontal, 12).padding(.vertical, 4)
                        .background(lvl.color.opacity(0.12))
                        .clipShape(Capsule())
                }

                if let first = firstWorkoutDate {
                    Label("First workout: \(first, format: .dateTime.month(.wide).year())",
                          systemImage: "calendar.badge.clock")
                        .font(.caption).foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(lvl.description)
                        .font(.caption).foregroundStyle(.secondary)
                    Divider()
                    Label(lvl.trainingRecommendation, systemImage: "checkmark.circle.fill")
                        .font(.caption).foregroundStyle(.primary)
                }
                .padding(10)
                .background(Color(.tertiarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var statsCard: some View {
        HStack(spacing: 0) {
            statBox(value: "\(totalSessions)", label: "Total Sessions", color: .blue)
            Divider().frame(height: 44)
            statBox(value: String(format: "%.0f", totalHours), label: "Total Hours", color: .orange)
            Divider().frame(height: 44)
            statBox(value: consistencyScore.map { "\($0)%" } ?? "—", label: "Consistency", color: .green)
        }
        .padding(.vertical, 12)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statBox(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title2.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private var volumeChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Yearly Training Volume", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Total workout sessions per calendar year. A consistent upward or sustained trend indicates established training.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(yearlyVolumes) { yr in
                BarMark(
                    x: .value("Year", "\(yr.year)"),
                    y: .value("Sessions", yr.totalSessions)
                )
                .foregroundStyle(Color.blue.gradient)
                .cornerRadius(4)
                .annotation(position: .top, alignment: .center) {
                    Text("\(yr.totalSessions)")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
            }
            .frame(height: 160)
            .chartYAxis {
                AxisMarks(position: .leading)
            }

            // Yearly summary rows
            VStack(spacing: 4) {
                ForEach(yearlyVolumes.reversed()) { yr in
                    HStack {
                        Text("\(yr.year)").font(.caption.weight(.semibold)).frame(width: 40, alignment: .leading)
                        Text("\(yr.totalSessions) sessions")
                            .font(.caption).foregroundStyle(.primary).frame(width: 90, alignment: .leading)
                        Text(String(format: "%.0f h", Double(yr.totalMinutes) / 60))
                            .font(.caption).foregroundStyle(.secondary).frame(width: 40, alignment: .leading)
                        Text(yr.topSport).font(.caption2).foregroundStyle(.tertiary)
                        Spacer()
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var sportsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Sport History", systemImage: "figure.mixed.cardio")
                .font(.subheadline).bold()
            Text("Lifetime sessions and hours by workout type.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(sportBreakdown.prefix(8)) { sport in
                HStack(spacing: 8) {
                    Circle()
                        .fill(sport.color)
                        .frame(width: 8, height: 8)
                    Text(sport.name)
                        .font(.caption)
                        .frame(width: 130, alignment: .leading)
                    GeometryReader { geo in
                        let maxSessions = sportBreakdown.map(\.sessions).max() ?? 1
                        RoundedRectangle(cornerRadius: 3)
                            .fill(sport.color.opacity(0.3))
                            .overlay(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(sport.color.gradient)
                                    .frame(width: geo.size.width * CGFloat(sport.sessions) / CGFloat(maxSessions))
                            }
                            .frame(height: 12)
                    }
                    .frame(height: 12)
                    Text("\(sport.sessions)")
                        .font(.caption2).foregroundStyle(.secondary)
                        .frame(width: 30, alignment: .trailing)
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
            Label("Training Age Science", systemImage: "book.fill")
                .font(.subheadline).bold()
            Text("Bompa & Buzzichelli (2015, Periodization) define training age as the number of years of systematic training. It determines appropriate training loads, recovery needs, and adaptation expectations.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Novice athletes adapt quickly to almost any stimulus. Advanced athletes require carefully structured periodization and higher specificity. Elite athletes see diminishing returns and require individualized programming (Kiely 2012).")
                .font(.caption).foregroundStyle(.secondary)
            Text("Consistency score is calculated as the percentage of months with ≥4 workout sessions over your training history.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.purple.opacity(0.08))
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

        let sortDesc = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let pred = HKQuery.predicateForSamples(withStart: Date.distantPast, end: Date())

        await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                      limit: HKObjectQueryNoLimit, sortDescriptors: [sortDesc]) { _, samples, _ in
                let workouts = (samples as? [HKWorkout]) ?? []
                self.compute(from: workouts)
                continuation.resume()
            }
            healthStore.execute(query)
        }

        isLoading = false
    }

    private func compute(from workouts: [HKWorkout]) {
        guard !workouts.isEmpty else { return }

        guard let firstDate = workouts.first?.startDate else { return }
        let now = Date()

        // Yearly buckets
        var byYear: [Int: (sessions: Int, minutes: Int, sports: [String: Int])] = [:]
        var sportSessionMap: [String: (sessions: Int, minutes: Int)] = [:]

        for w in workouts {
            let yr = calendar.component(.year, from: w.startDate)
            let mins = Int(w.duration / 60)
            let sportName = workoutTypeName(w.workoutActivityType)
            byYear[yr, default: (0, 0, [:])].sessions += 1
            byYear[yr, default: (0, 0, [:])].minutes += mins
            byYear[yr, default: (0, 0, [:])].sports[sportName, default: 0] += 1
            sportSessionMap[sportName, default: (0, 0)].sessions += 1
            sportSessionMap[sportName, default: (0, 0)].minutes += mins
        }

        let yearlyVolumes = byYear.sorted { $0.key < $1.key }.map { yr, data in
            let topSport = data.sports.max(by: { $0.value < $1.value })?.key ?? ""
            return YearlyVolume(year: yr, totalSessions: data.sessions, totalMinutes: data.minutes, topSport: topSport)
        }

        let sportColors = TrainingAgeView.sportColors
        let sportBreakdown = sportSessionMap
            .sorted { $0.value.sessions > $1.value.sessions }
            .enumerated()
            .map { i, pair in
                SportBreakdown(name: pair.key, sessions: pair.value.sessions,
                               totalHours: Double(pair.value.minutes) / 60,
                               color: sportColors[i % sportColors.count])
            }

        // Consistency score: % of months with ≥4 sessions
        var byMonth: [String: Int] = [:]
        let fmt = DateFormatter(); fmt.dateFormat = "yyyy-MM"
        for w in workouts {
            let key = fmt.string(from: w.startDate)
            byMonth[key, default: 0] += 1
        }
        let totalMonths = max(1, calendar.dateComponents([.month], from: firstDate, to: now).month ?? 1)
        let activeMonths = byMonth.values.filter { $0 >= 4 }.count
        let consistencyScore = min(100, Int(Double(activeMonths) / Double(totalMonths) * 100))

        // Training age estimate: years since first workout × consistency modifier
        let rawYears = calendar.dateComponents([.month], from: firstDate, to: now).month.map { Double($0) / 12 } ?? 0
        let trainingAge = rawYears * (Double(consistencyScore) / 100)

        let level: TrainingLevel
        switch trainingAge {
        case ..<2:  level = .novice
        case 2..<5: level = .intermediate
        case 5..<9: level = .advanced
        default:    level = .elite
        }

        let totalSessions = workouts.count
        let totalHours = workouts.reduce(0.0) { $0 + $1.duration } / 3600

        DispatchQueue.main.async {
            self.firstWorkoutDate = firstDate
            self.trainingAge = trainingAge
            self.level = level
            self.consistencyScore = consistencyScore
            self.yearlyVolumes = yearlyVolumes
            self.sportBreakdown = sportBreakdown
            self.totalSessions = totalSessions
            self.totalHours = totalHours
        }
    }

    private func workoutTypeName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running:          return "Running"
        case .cycling:          return "Cycling"
        case .swimming:         return "Swimming"
        case .hiking:           return "Hiking"
        case .walking:          return "Walking"
        case .yoga:             return "Yoga"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength"
        case .highIntensityIntervalTraining: return "HIIT"
        case .rowing:           return "Rowing"
        case .crossTraining:    return "Cross Training"
        case .pilates:          return "Pilates"
        case .martialArts:      return "Martial Arts"
        case .soccer:           return "Soccer"
        case .tennis:           return "Tennis"
        case .golf:             return "Golf"
        case .basketball:       return "Basketball"
        case .dance:            return "Dance"
        case .elliptical:       return "Elliptical"
        case .stairClimbing:    return "Stair Climbing"
        case .mindAndBody:      return "Mind & Body"
        default:                return "Other"
        }
    }
}
