import SwiftUI
import HealthKit

// MARK: - MuscleRecoveryView
// Estimates recovery status per muscle group by inferring muscles trained from workout type.
// Science:
//   Damas et al. 2016 (J Physiol): DOMS peaks 24–48h post exercise; SFR resolves by 72h.
//   Schoenfeld 2010 (NSCA): muscle protein synthesis elevated 24–48h post moderate-heavy resistance.
//   Nosaka & Newton 2002 (J Sci Med Sport): repeated bout effect reduces recovery time by ~50%.
//   Recovery model: linear interpolation from 0% (just trained) to 100% at muscle-specific recovery hours.
//
// Muscle groups inferred from workout type (conservative overestimation for safety):
//   Running/Hiking → Quads, Hamstrings, Calves, Glutes (moderate load)
//   Cycling → Quads, Glutes, Calves (low eccentric, faster recovery)
//   Swimming → Shoulders, Back, Arms (upper pull/push)
//   Rowing → Back, Arms, Core, Legs (full body)
//   Strength → Upper Push, Upper Pull, Core (general)
//   HIIT/CrossFit → Full Body, Core
//   Yoga/Mindfulness → very low load → minimal recovery debt

struct MuscleRecoveryView: View {

    // MARK: - Models

    enum MuscleGroup: String, CaseIterable, Identifiable {
        var id: String { rawValue }

        case quads    = "Quadriceps"
        case hamstrings = "Hamstrings"
        case glutes   = "Glutes"
        case calves   = "Calves"
        case chest    = "Chest"
        case shoulders = "Shoulders"
        case back     = "Back"
        case biceps   = "Biceps & Forearms"
        case triceps  = "Triceps"
        case core     = "Core & Abs"

        var icon: String {
            switch self {
            case .quads:      return "figure.run"
            case .hamstrings: return "figure.run"
            case .glutes:     return "figure.cycling"
            case .calves:     return "figure.walk"
            case .chest:      return "figure.strengthtraining.functional"
            case .shoulders:  return "figure.pool.swim"
            case .back:       return "figure.rowing"
            case .biceps:     return "figure.strengthtraining.traditional"
            case .triceps:    return "figure.strengthtraining.functional"
            case .core:       return "figure.core.training"
            }
        }

        var region: String {
            switch self {
            case .quads, .hamstrings, .glutes, .calves: return "Lower Body"
            case .chest, .shoulders, .back, .biceps, .triceps: return "Upper Body"
            case .core: return "Core"
            }
        }

        // Full recovery time (hours) at high intensity
        var recoveryHours: Double {
            switch self {
            case .quads:      return 72
            case .hamstrings: return 72
            case .glutes:     return 60
            case .calves:     return 48
            case .chest:      return 60
            case .shoulders:  return 48
            case .back:       return 60
            case .biceps:     return 48
            case .triceps:    return 48
            case .core:       return 36
            }
        }
    }

    struct MuscleLoad {
        let muscle: MuscleGroup
        let intensity: Double  // 0.0–1.0 (low=0.3, mod=0.6, high=1.0)
        let workoutDate: Date
    }

    struct MuscleStatus: Identifiable {
        let id = UUID()
        let muscle: MuscleGroup
        let lastTrained: Date?
        let recoveryPct: Double     // 0–100
        let lastIntensity: Double   // 0.0–1.0
        var isRecovered: Bool { recoveryPct >= 85 }
        var status: RecoveryStatus {
            switch recoveryPct {
            case 90...:    return .fresh
            case 70..<90:  return .recovered
            case 45..<70:  return .moderate
            case 20..<45:  return .fatigued
            default:       return .needsRest
            }
        }
    }

    enum RecoveryStatus: String {
        case fresh     = "Fresh"
        case recovered = "Recovered"
        case moderate  = "Moderate"
        case fatigued  = "Fatigued"
        case needsRest = "Needs Rest"

        var color: Color {
            switch self {
            case .fresh:     return .green
            case .recovered: return Color(red: 0.4, green: 0.8, blue: 0.4)
            case .moderate:  return .yellow
            case .fatigued:  return .orange
            case .needsRest: return .red
            }
        }
    }

    // MARK: - State

    @State private var muscleStatuses: [MuscleStatus] = []
    @State private var isLoading = true
    @State private var recommendedWorkout: String = ""

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Calculating muscle recovery…")
                        .padding(.top, 60)
                } else {
                    overviewCard
                    muscleGroupsCard(region: "Lower Body")
                    muscleGroupsCard(region: "Upper Body")
                    muscleGroupsCard(region: "Core")
                    recommendationCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Muscle Recovery")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Overview Card

    private var overviewCard: some View {
        let recovered = muscleStatuses.filter { $0.isRecovered }.count
        let total = muscleStatuses.count
        let avgPct = muscleStatuses.isEmpty ? 0.0 : muscleStatuses.map(\.recoveryPct).reduce(0, +) / Double(total)

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(recovered)/\(total)",
                    label: "Groups Ready",
                    sub: "≥85% recovered",
                    color: recovered == total ? .green : (recovered >= total / 2 ? .yellow : .red)
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.0f%%", avgPct),
                    label: "Avg Recovery",
                    sub: "across all groups",
                    color: avgPct >= 80 ? .green : (avgPct >= 50 ? .yellow : .orange)
                )
                Divider().frame(height: 44)
                statBox(
                    value: muscleStatuses.filter { $0.status == .needsRest || $0.status == .fatigued }.count.description,
                    label: "Avoid Today",
                    sub: "fatigue / needs rest",
                    color: .red
                )
            }
            .padding(.vertical, 12)

            // Progress bar
            VStack(spacing: 4) {
                HStack {
                    Text("Overall muscle readiness").font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    Text(String(format: "%.0f%%", avgPct)).font(.caption2.bold()).foregroundStyle(avgPct >= 80 ? .green : .orange)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.secondary.opacity(0.15)).frame(height: 8)
                        Capsule()
                            .fill(avgPct >= 80 ? Color.green.gradient : Color.orange.gradient)
                            .frame(width: geo.size.width * min(1, avgPct / 100), height: 8)
                    }
                }
                .frame(height: 8)
            }
            .padding(.horizontal)
            .padding(.bottom, 10)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Muscle Groups Card

    private func muscleGroupsCard(region: String) -> some View {
        let groups = muscleStatuses.filter { $0.muscle.region == region }
        guard !groups.isEmpty else { return AnyView(EmptyView()) }

        return AnyView(
            VStack(alignment: .leading, spacing: 10) {
                Label(region, systemImage: regionIcon(region))
                    .font(.subheadline).bold()

                ForEach(groups) { status in
                    muscleRow(status)
                    if status.id != groups.last?.id { Divider() }
                }
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
        )
    }

    private func regionIcon(_ region: String) -> String {
        switch region {
        case "Lower Body": return "figure.run"
        case "Upper Body": return "figure.strengthtraining.traditional"
        default:           return "figure.core.training"
        }
    }

    private func muscleRow(_ status: MuscleStatus) -> some View {
        VStack(spacing: 6) {
            HStack {
                Image(systemName: status.muscle.icon)
                    .font(.caption)
                    .foregroundStyle(status.status.color)
                    .frame(width: 20)
                Text(status.muscle.rawValue).font(.caption.bold())
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text(status.status.rawValue)
                        .font(.caption2.bold())
                        .foregroundStyle(status.status.color)
                    if let last = status.lastTrained {
                        Text(timeAgoString(last))
                            .font(.caption2).foregroundStyle(.tertiary)
                    } else {
                        Text("No recent training").font(.caption2).foregroundStyle(.tertiary)
                    }
                }
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.12)).frame(height: 5)
                    Capsule()
                        .fill(status.status.color.gradient)
                        .frame(width: geo.size.width * min(1, status.recoveryPct / 100), height: 5)
                }
            }
            .frame(height: 5)
        }
    }

    // MARK: - Recommendation Card

    private var recommendationCard: some View {
        let readyGroups = muscleStatuses.filter { $0.isRecovered }.map { $0.muscle }
        let fatigued    = muscleStatuses.filter { !$0.isRecovered }.map { $0.muscle }

        return VStack(alignment: .leading, spacing: 10) {
            Label("Today's Training Recommendation", systemImage: "lightbulb.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.yellow)

            if !readyGroups.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Ready to train:").font(.caption.bold()).foregroundStyle(.green)
                    Text(readyGroups.map(\.rawValue).joined(separator: " · "))
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            if !fatigued.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Allow more recovery:").font(.caption.bold()).foregroundStyle(.orange)
                    Text(fatigued.map(\.rawValue).joined(separator: " · "))
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            Divider()

            Text(recommendedWorkout)
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.yellow.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Muscle Recovery Science", systemImage: "flask.fill")
                .font(.subheadline).bold()
            Text("Damas et al. 2016 (J Physiol): DOMS (delayed onset muscle soreness) peaks 24–48 hours post exercise; structural muscle repair is complete by ~72h for high-intensity work. The repeated bout effect (Nosaka & Newton 2002) means recovery becomes faster as adaptation occurs.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Schoenfeld 2010 (NSCA J Strength Cond Res): muscle protein synthesis (MPS) is elevated for 24–48h after resistance training. Training again before MPS resolves may interfere with adaptation in beginners but can be strategic for advanced athletes (frequency programming).")
                .font(.caption).foregroundStyle(.secondary)
            Text("These estimates are inferred from workout type and duration — they are not physiological measurements. For precision, track subjective fatigue, HRV, and sleep quality alongside this tracker.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Helpers

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private func timeAgoString(_ date: Date) -> String {
        let hours = Date().timeIntervalSince(date) / 3600
        if hours < 24 { return String(format: "%.0fh ago", hours) }
        let days = hours / 24
        return String(format: "%.1fd ago", days)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .day, value: -7, to: end) ?? Date()  // last 7 days enough for recovery tracking

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: 50, sortDescriptors: [sort]) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        computeRecovery(workouts: rawWorkouts)
        isLoading = false
    }

    private func computeRecovery(workouts: [HKWorkout]) {
        let now = Date()

        // Build a dict: muscle → most recent load
        var lastLoad: [MuscleGroup: MuscleLoad] = [:]

        for w in workouts {
            let loads = muscleLoads(for: w)
            for load in loads {
                let existing = lastLoad[load.muscle]
                // Keep highest-intensity / most recent (workouts are sorted newest-first)
                if existing == nil {
                    lastLoad[load.muscle] = load
                }
            }
        }

        // Compute recovery % for each muscle group
        var statuses: [MuscleStatus] = []
        for muscle in MuscleGroup.allCases {
            if let load = lastLoad[muscle] {
                let hoursSince = now.timeIntervalSince(load.workoutDate) / 3600
                let fullRecoveryH = muscle.recoveryHours * load.intensity  // scale by intensity
                let pct = min(100, (hoursSince / fullRecoveryH) * 100)
                statuses.append(MuscleStatus(muscle: muscle, lastTrained: load.workoutDate,
                                              recoveryPct: pct, lastIntensity: load.intensity))
            } else {
                // Never trained / no data → fully recovered
                statuses.append(MuscleStatus(muscle: muscle, lastTrained: nil,
                                              recoveryPct: 100, lastIntensity: 0))
            }
        }

        // Sort: lower recovery first (most fatigued at top)
        statuses.sort { $0.recoveryPct < $1.recoveryPct }

        // Build recommendation
        let ready    = statuses.filter { $0.isRecovered }.map(\.muscle)
        let notReady = statuses.filter { !$0.isRecovered }
        let rec = buildRecommendation(ready: ready, fatigued: notReady)

        DispatchQueue.main.async {
            self.muscleStatuses   = statuses
            self.recommendedWorkout = rec
        }
    }

    /// Maps workout type → muscle loads it creates
    private func muscleLoads(for workout: HKWorkout) -> [MuscleLoad] {
        let date = workout.startDate
        let duration = workout.duration / 60  // minutes
        let kcalPerMin = (workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0) / max(1, duration)
        // Intensity from kcal/min: <5 = low, 5-10 = moderate, >10 = high
        let intensity: Double = kcalPerMin < 5 ? 0.3 : (kcalPerMin < 10 ? 0.6 : 1.0)

        switch workout.workoutActivityType {
        case .running:
            return [.quads, .hamstrings, .glutes, .calves].map { MuscleLoad(muscle: $0, intensity: intensity, workoutDate: date) }
        case .cycling:
            return [.quads, .glutes, .calves].map { MuscleLoad(muscle: $0, intensity: intensity * 0.7, workoutDate: date) }
        case .swimming:
            return [.shoulders, .back, .biceps, .core].map { MuscleLoad(muscle: $0, intensity: intensity, workoutDate: date) }
        case .rowing:
            return [.back, .biceps, .core, .quads, .hamstrings].map { MuscleLoad(muscle: $0, intensity: intensity, workoutDate: date) }
        case .traditionalStrengthTraining:
            return [.chest, .shoulders, .back, .biceps, .triceps, .core].map { MuscleLoad(muscle: $0, intensity: intensity, workoutDate: date) }
        case .highIntensityIntervalTraining, .crossTraining:
            return MuscleGroup.allCases.map { MuscleLoad(muscle: $0, intensity: intensity * 0.8, workoutDate: date) }
        case .hiking, .walking:
            return [.quads, .hamstrings, .glutes, .calves].map { MuscleLoad(muscle: $0, intensity: intensity * 0.5, workoutDate: date) }
        case .stairClimbing:
            return [.quads, .glutes, .calves, .core].map { MuscleLoad(muscle: $0, intensity: intensity, workoutDate: date) }
        case .yoga, .mindAndBody:
            return [.core].map { MuscleLoad(muscle: $0, intensity: 0.2, workoutDate: date) }
        case .jumpRope:
            return [.calves, .core, .shoulders].map { MuscleLoad(muscle: $0, intensity: intensity, workoutDate: date) }
        case .boxing, .kickboxing, .martialArts:
            return [.shoulders, .back, .biceps, .triceps, .core, .quads].map { MuscleLoad(muscle: $0, intensity: intensity, workoutDate: date) }
        default:
            return [.core].map { MuscleLoad(muscle: $0, intensity: 0.3, workoutDate: date) }
        }
    }

    private func buildRecommendation(ready: [MuscleGroup], fatigued: [MuscleStatus]) -> String {
        let lowerReady  = ready.filter { $0.region == "Lower Body" }
        let upperReady  = ready.filter { $0.region == "Upper Body" }

        if ready.isEmpty {
            return "All muscle groups have significant fatigue. Consider an active recovery day — light walking, stretching, or yoga. Your body adapts during recovery, not during training."
        }
        if !lowerReady.isEmpty && upperReady.isEmpty {
            return "Lower body is recovered — ideal for a run, cycling session, or leg-focused workout. Upper body needs more recovery time; avoid overhead pressing or rowing today."
        }
        if lowerReady.isEmpty && !upperReady.isEmpty {
            return "Upper body is recovered — great day for swimming, rowing, or upper body strength work. Lower body needs more recovery; consider an easy active day or rest."
        }
        if fatigued.isEmpty {
            return "Full body is well recovered — great day for a hard workout, long run, or competition. Make the most of this fresh state!"
        }
        return "Mixed recovery state. Focus on the recovered muscle groups and keep intensity moderate for any fatigued groups. Alternating push/pull patterns today would be effective."
    }
}
