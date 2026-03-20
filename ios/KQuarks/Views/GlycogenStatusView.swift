import SwiftUI
import HealthKit
import Charts

// MARK: - GlycogenStatusView
// Estimates muscle glycogen depletion from workout energy output and intensity.
// Science: Bergström & Hultman 1967 (Scand J Clin Lab Invest): First demonstration of
//   muscle glycogen depletion as the primary cause of fatigue in prolonged exercise.
//   Coyle et al. 1986 (J Appl Physiol): Glycogen depletion causes fatigue at same VO₂.
//   Burke 2011 (J Sports Sci): Glycogen replenishment rate = ~10g/hr with adequate carbs.
// Carbohydrate fraction of energy use scales with intensity:
//   Light (<5 kcal/min)=40%, Moderate(5-10)=60%, Vigorous(10-15)=70%, Maximal(>15)=80%.
// Total muscle glycogen capacity ≈ 8 g/kg lean body mass (~560g for 70kg person).
// Full replenishment = 24h with 8-10g/kg/day carbohydrate intake.

struct GlycogenStatusView: View {

    // MARK: - Models

    struct WorkoutGlycogen: Identifiable {
        let id = UUID()
        let date: Date
        let sport: String
        let durationMins: Double
        let workoutKcal: Double
        let kcalPerMin: Double
        var carbFraction: Double {
            switch kcalPerMin {
            case ..<5:  return 0.40
            case 5..<10: return 0.60
            case 10..<15: return 0.70
            default:     return 0.80
            }
        }
        var glycogenUsedG: Double { workoutKcal * carbFraction / 4.0 } // 4 kcal/g carb
        var intensity: String {
            switch kcalPerMin {
            case ..<5:  return "Light"
            case 5..<10: return "Moderate"
            case 10..<15: return "Vigorous"
            default:     return "Maximal"
            }
        }
        var intensityColor: Color {
            switch kcalPerMin {
            case ..<5:  return .blue
            case 5..<10: return .green
            case 10..<15: return .orange
            default:     return .red
            }
        }
    }

    struct DayGlycogen: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let usedG: Double
        let replenishedG: Double   // estimated replenishment since last workout
        let netG: Double           // remaining relative to capacity
        let pctFull: Double        // 0–100
    }

    enum GlycogenState: String {
        case full      = "Full"
        case ready     = "Race Ready"
        case moderate  = "Moderate"
        case depleted  = "Low"
        case empty     = "Depleted"
        var color: Color {
            switch self {
            case .full:     return .green
            case .ready:    return .mint
            case .moderate: return .yellow
            case .depleted: return .orange
            case .empty:    return .red
            }
        }
        static func from(pct: Double) -> GlycogenState {
            switch pct {
            case 85...:   return .full
            case 65..<85: return .ready
            case 40..<65: return .moderate
            case 20..<40: return .depleted
            default:      return .empty
            }
        }
    }

    // MARK: - State

    @State private var workouts: [WorkoutGlycogen] = []
    @State private var dayGlycogen: [DayGlycogen] = []
    @State private var currentPct: Double?
    @State private var currentState: GlycogenState = .full
    @State private var hoursToFull: Double?
    @State private var capacityG: Double = 480  // default for ~70kg person
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    // Replenishment rate with adequate carb intake (Burke 2011)
    private let replenishRateGPerHour = 10.0
    // Spontaneous turnover: body replenishes ~half capacity per rest day even without optimal carbs
    private let restReplenishRateGPerHour = 4.0

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Estimating glycogen status…")
                        .padding(.top, 60)
                } else if workouts.isEmpty {
                    ContentUnavailableView("No Workout Data",
                        systemImage: "bolt.heart.fill",
                        description: Text("Log workouts with energy data in Apple Health to track glycogen status."))
                } else {
                    statusCard
                    glycogenChart
                    workoutCostCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Glycogen Status")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Status Card

    private var statusCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: currentPct.map { String(format: "%.0f%%", $0) } ?? "—",
                    label: "Glycogen Level",
                    sub: "estimated",
                    color: currentState.color
                )
                Divider().frame(height: 44)
                statBox(
                    value: hoursToFull.map { $0 <= 0 ? "Full" : String(format: "%.0f hrs", $0) } ?? "—",
                    label: "To Full",
                    sub: "with carb intake",
                    color: hoursToFull.map { $0 < 4 ? .green : $0 < 12 ? .orange : .red } ?? .secondary
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.0fg", capacityG),
                    label: "Capacity",
                    sub: "muscle glycogen",
                    color: .secondary
                )
            }
            .padding(.vertical, 12)

            // Progress bar
            VStack(spacing: 6) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color(.tertiarySystemBackground))
                        RoundedRectangle(cornerRadius: 6)
                            .fill(currentState.color.gradient)
                            .frame(width: geo.size.width * ((currentPct ?? 0) / 100))
                    }
                }
                .frame(height: 18)

                HStack {
                    Text(currentState.rawValue)
                        .font(.caption.bold())
                        .foregroundStyle(currentState.color)
                    Spacer()
                    Text(stateAdvice(currentState))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func stateAdvice(_ state: GlycogenState) -> String {
        switch state {
        case .full:     return "Peak energy stores — ready for any session"
        case .ready:    return "Good reserves — ideal for race or hard session"
        case .moderate: return "Moderate — fuel well before your next workout"
        case .depleted: return "Low — prioritise carbohydrate replenishment"
        case .empty:    return "Depleted — rest and eat carbs before training"
        }
    }

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Glycogen Chart (14-day history)

    private var glycogenChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Glycogen Level — 14 Days", systemImage: "waveform.path.ecg")
                .font(.subheadline).bold()
            Text("Estimated % of muscle glycogen remaining at end of each day. Drops after workouts, recovers with rest & nutrition.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(dayGlycogen.suffix(14)) { day in
                AreaMark(
                    x: .value("Date", day.date, unit: .day),
                    y: .value("Level %", day.pctFull)
                )
                .foregroundStyle(Color.green.opacity(0.25))
                LineMark(
                    x: .value("Date", day.date, unit: .day),
                    y: .value("Level %", day.pctFull)
                )
                .foregroundStyle(Color.green)
                .lineStyle(StrokeStyle(lineWidth: 2))
            }
            .chartYScale(domain: 0...105)
            .chartYAxis {
                AxisMarks(values: [0, 25, 50, 75, 100]) { val in
                    AxisValueLabel { if let v = val.as(Double.self) { Text("\(Int(v))%") } }
                    AxisGridLine()
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 3)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 140)

            HStack(spacing: 16) {
                stateBar(color: .green,  label: "Ready (>65%)")
                stateBar(color: .orange, label: "Low (20–65%)")
                stateBar(color: .red,    label: "Depleted (<20%)")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func stateBar(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 12, height: 6)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Workout Cost Card

    private var workoutCostCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Glycogen Cost by Session (30 Days)", systemImage: "list.bullet")
                .font(.subheadline).bold()
            Text("Estimated glycogen used (g) per workout based on energy output and intensity.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(workouts.prefix(8)) { w in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text(w.sport).font(.caption.bold())
                            Text(w.intensity)
                                .font(.caption2)
                                .padding(.horizontal, 5).padding(.vertical, 1)
                                .background(w.intensityColor.opacity(0.18))
                                .foregroundStyle(w.intensityColor)
                                .clipShape(Capsule())
                        }
                        Text(w.date, format: .dateTime.month(.abbreviated).day())
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0fg glycogen", w.glycogenUsedG))
                            .font(.caption.bold()).foregroundStyle(.orange)
                        Text(String(format: "%.0f kcal · %.0f min", w.workoutKcal, w.durationMins))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if w.id != workouts.prefix(8).last?.id { Divider() }
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
            Label("Glycogen Science", systemImage: "cross.case.fill")
                .font(.subheadline).bold()
            Text("Bergström & Hultman 1967 (Scand J Clin Lab Invest): First muscle biopsy demonstration that glycogen depletion causes exhaustion in endurance exercise, establishing the foundation of sports nutrition. Total muscle glycogen ≈ 8g/kg lean mass.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Burke 2011 (J Sports Sci): Optimal replenishment = 1.2g carbohydrate/kg/hr for first 4 hours post-exercise (~10g/hr for a 70kg athlete). Full replenishment takes 24h. Low-glycogen training (\"train low\") can enhance fat adaptation but impairs performance.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Estimate: Carb fraction of energy = 40–80% depending on intensity. 4 kcal/g carbohydrate. This is a model-based estimate — actual glycogen varies by diet, body composition, and adaptation.")
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
        let massType = HKQuantityType(.bodyMass)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, massType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .day, value: -30, to: end)!

        // Fetch recent body mass for capacity estimate
        var massSamples: [HKQuantitySample] = []
        await withCheckedContinuation { cont in
            let sort = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            let q = HKSampleQuery(sampleType: massType, predicate: nil,
                                   limit: 1, sortDescriptors: sort) { _, s, _ in
                massSamples = (s as? [HKQuantitySample]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let sort = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: HKObjectQueryNoLimit, sortDescriptors: sort) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        // Capacity from body mass (8g/kg lean mass, assume 75% lean)
        let bodyMassKg = massSamples.first?.quantity.doubleValue(for: .gramUnit(with: .kilo)) ?? 70.0
        let capacity = bodyMassKg * 0.75 * 8.0

        processWorkouts(rawWorkouts, capacity: capacity, end: end)
        isLoading = false
    }

    private func processWorkouts(_ rawWorkouts: [HKWorkout], capacity: Double, end: Date) {
        var wkList: [WorkoutGlycogen] = []
        for w in rawWorkouts {
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            guard kcal > 10 else { continue }
            let mins = w.duration / 60
            guard mins > 5 else { continue }
            wkList.append(WorkoutGlycogen(
                date: w.startDate,
                sport: w.workoutActivityType.glycoName,
                durationMins: mins,
                workoutKcal: kcal,
                kcalPerMin: kcal / mins
            ))
        }
        wkList.sort { $0.date < $1.date }

        // Simulate glycogen over 14 days
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        var glycogenG = capacity  // start full
        var dayList: [DayGlycogen] = []
        var cursor = calendar.date(byAdding: .day, value: -14, to: end)!

        while cursor <= end {
            let dayStart = calendar.startOfDay(for: cursor)
            let dayEnd   = calendar.date(byAdding: .day, value: 1, to: dayStart)!

            let dayWorkouts = wkList.filter { $0.date >= dayStart && $0.date < dayEnd }
            let usedG = dayWorkouts.map(\.glycogenUsedG).reduce(0, +)

            // Hours awake (~16hr) for replenishment
            let replenish = min(capacity - (glycogenG - usedG), replenishRateGPerHour * 16)
            glycogenG = min(capacity, max(0, glycogenG - usedG + replenish))

            dayList.append(DayGlycogen(
                date: dayStart,
                label: formatter.string(from: dayStart),
                usedG: usedG,
                replenishedG: replenish,
                netG: glycogenG,
                pctFull: glycogenG / capacity * 100
            ))
            cursor = calendar.date(byAdding: .day, value: 1, to: cursor)!
        }

        let currentPctVal = dayList.last?.pctFull ?? 100
        let remaining = dayList.last.map { $0.netG } ?? capacity
        let deficit = capacity - remaining
        let toFull = deficit / replenishRateGPerHour

        DispatchQueue.main.async {
            self.workouts = wkList.reversed()
            self.dayGlycogen = dayList
            self.currentPct = currentPctVal
            self.currentState = GlycogenState.from(pct: currentPctVal)
            self.hoursToFull = max(0, toFull)
            self.capacityG = capacity
            self.isLoading = false
        }
    }
}

private extension HKWorkoutActivityType {
    var glycoName: String {
        switch self {
        case .running:         return "Running"
        case .cycling:         return "Cycling"
        case .swimming:        return "Swimming"
        case .walking:         return "Walking"
        case .hiking:          return "Hiking"
        case .rowing:          return "Rowing"
        case .highIntensityIntervalTraining: return "HIIT"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength"
        case .crossTraining:   return "Cross Training"
        default:               return "Workout"
        }
    }
}
