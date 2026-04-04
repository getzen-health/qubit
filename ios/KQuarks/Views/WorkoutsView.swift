import SwiftUI
import HealthKit

struct WorkoutsView: View {
    // MARK: - Live Activity Integration
    // Inject WorkoutLiveActivityService as @State or via environment
    // Call service.startActivity(workoutType: selectedWorkout) when starting
    // Call service.update(elapsedSeconds:heartRate:calories:pace:) every 15 seconds from a Timer
    // Call service.stop() when workout ends
    // Use @available(iOS 16.1, *) guard around any Live Activity usage

    @State private var workouts: [HKWorkout] = []
    @State private var isLoading = true
    @State private var selectedPeriod: WorkoutPeriod = .month
    @State private var searchText = ""
    @State private var showLogWorkout = false

    private let healthKit = HealthKitService.shared

    private var filtered: [HKWorkout] {
        guard !searchText.isEmpty else { return workouts }
        return workouts.filter { $0.workoutActivityType.name.localizedCaseInsensitiveContains(searchText) }
    }

    struct TypeStat: Identifiable {
        let id: String
        let name: String
        let icon: String
        let color: Color
        let count: Int
        let totalSeconds: TimeInterval
    }

    private var typeBreakdown: [TypeStat] {
        var counts: [HKWorkoutActivityType: (count: Int, seconds: TimeInterval)] = [:]
        for w in filtered {
            let t = w.workoutActivityType
            let prev = counts[t] ?? (0, 0)
            counts[t] = (prev.count + 1, prev.seconds + w.duration)
        }
        return counts.map { (type, stat) in
            TypeStat(
                id: type.name,
                name: type.name,
                icon: type.icon,
                color: type.color,
                count: stat.count,
                totalSeconds: stat.seconds
            )
        }.sorted { $0.count > $1.count }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                PremiumBackgroundView()

                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.green)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else if workouts.isEmpty {
                        ContentUnavailableView(
                            "No Workouts",
                            systemImage: "figure.run",
                            description: Text("No workouts found for this period. Start tracking workouts in the Apple Health app.")
                        )
                    } else {
                        ScrollView(.vertical, showsIndicators: false) {
                            VStack(spacing: 20) {
                                VStack(alignment: .leading, spacing: 10) {
                                    workoutSectionHeader("Summary", icon: "chart.pie.fill")
                                    WorkoutSummaryRow(workouts: filtered)
                                        .premiumCard(cornerRadius: 18, tint: .green, tintOpacity: 0.03)
                                }

                                if typeBreakdown.count > 1 {
                                    VStack(alignment: .leading, spacing: 10) {
                                        workoutSectionHeader("By Type", icon: "square.grid.2x2.fill")
                                        WorkoutTypeBreakdownView(breakdown: typeBreakdown)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 12)
                                            .premiumCard(cornerRadius: 18, tint: .green, tintOpacity: 0.02)
                                    }
                                }

                                VStack(alignment: .leading, spacing: 10) {
                                    workoutSectionHeader("Workouts", icon: "figure.run")
                                    VStack(spacing: 0) {
                                        ForEach(Array(filtered.enumerated()), id: \.element.uuid) { index, workout in
                                            NavigationLink(destination: WorkoutDetailView(workout: workout)) {
                                                WorkoutRow(workout: workout)
                                            }
                                            .buttonStyle(.plain)
                                            if index < filtered.count - 1 {
                                                Color.premiumDivider
                                                    .frame(height: 0.5)
                                                    .padding(.leading, 68)
                                            }
                                        }
                                    }
                                    .premiumCard(cornerRadius: 18, tint: .green, tintOpacity: 0.02)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.bottom, 100)
                        }
                    }
                }
            }
            .navigationTitle("Workouts")
            .toolbarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .searchable(text: $searchText, prompt: "Filter by type")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    HStack(spacing: 4) {
                        NavigationLink(destination: ExerciseLibraryView()) {
                            Image(systemName: "books.vertical")
                        }
                        NavigationLink(destination: WorkoutCalendarView()) {
                            Image(systemName: "calendar.badge.clock")
                        }
                        NavigationLink(destination: WorkoutAnalyticsView()) {
                            Image(systemName: "chart.xyaxis.line")
                        }
                        NavigationLink(destination: HRZonesView()) {
                            Image(systemName: "heart.fill")
                        }
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    HStack(spacing: 4) {
                        Button {
                            showLogWorkout = true
                        } label: {
                            Image(systemName: "plus")
                        }
                        Picker("Period", selection: $selectedPeriod) {
                            ForEach(WorkoutPeriod.allCases, id: \.self) { period in
                                Text(period.label).tag(period)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                }
            }
            .sheet(isPresented: $showLogWorkout, onDismiss: {
                Task { await loadWorkouts() }
            }) {
                WorkoutLogView()
            }
            .task(id: selectedPeriod) {
                await loadWorkouts()
            }
        }
        .preferredColorScheme(.dark)
    }

    private func workoutSectionHeader(_ title: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.green.opacity(0.5))
            Text(LocalizedStringKey(title))
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(0.5))
                .textCase(.uppercase)
                .tracking(0.8)
        }
        .padding(.leading, 4)
    }

    private func loadWorkouts() async {
        isLoading = true
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: selectedPeriod.dateComponent, value: -selectedPeriod.value, to: Date()) ?? Date()
        workouts = (try? await healthKit.fetchWorkouts(from: startDate, to: Date())) ?? []
        isLoading = false
    }
}

// MARK: - Type Breakdown

struct WorkoutTypeBreakdownView: View {
    let breakdown: [WorkoutsView.TypeStat]

    private func fmt(_ seconds: TimeInterval) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    private var maxCount: Int { breakdown.first?.count ?? 1 }

    var body: some View {
        VStack(spacing: 10) {
            ForEach(breakdown) { stat in
                HStack(spacing: 10) {
                    Image(systemName: stat.icon)
                        .font(.subheadline)
                        .foregroundStyle(stat.color)
                        .frame(width: 28)

                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(LocalizedStringKey(stat.name))
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(.white.opacity(0.75))
                            Spacer()
                            Text("\(stat.count) · \(fmt(stat.totalSeconds))")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.white.opacity(0.35))
                                .monospacedDigit()
                        }
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(
                                    LinearGradient(
                                        colors: [stat.color.opacity(0.4), stat.color.opacity(0.15)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(
                                    width: geo.size.width * CGFloat(stat.count) / CGFloat(maxCount),
                                    height: 6
                                )
                        }
                        .frame(height: 6)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Workout Row

struct WorkoutRow: View {
    let workout: HKWorkout

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: workout.workoutActivityType.icon)
                .font(.title2)
                .foregroundStyle(workout.workoutActivityType.color)
                .frame(width: 44, height: 44)
                .background(workout.workoutActivityType.color.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 3) {
                Text(LocalizedStringKey(workout.workoutActivityType.name))
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.85))

                Text(workout.startDate, style: .date)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.35))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                Text(formatDuration(workout.duration))
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.7))

                if let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                    Text("\(Int(calories)) cal")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.orange.opacity(0.6))
                }
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white.opacity(0.15))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        if h > 0 {
            return "\(h)h \(m)m"
        }
        return "\(m)m"
    }
}

// MARK: - Workout Summary Row

struct WorkoutSummaryRow: View {
    let workouts: [HKWorkout]

    private var totalSeconds: TimeInterval {
        workouts.reduce(0) { $0 + $1.duration }
    }

    private var totalCalories: Int {
        workouts.reduce(0) { sum, w in
            sum + Int(w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0)
        }
    }

    private func fmt(_ seconds: TimeInterval) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    var body: some View {
        HStack(spacing: 0) {
            SummaryBubble(label: "Sessions", value: "\(workouts.count)", color: .green)
            Color.premiumDivider.frame(width: 0.5, height: 40)
            SummaryBubble(label: "Total Time", value: fmt(totalSeconds), color: .cyan)
            Color.premiumDivider.frame(width: 0.5, height: 40)
            SummaryBubble(label: "Calories", value: totalCalories > 0 ? "\(totalCalories)" : "—", color: .orange)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
    }
}

struct SummaryBubble: View {
    let label: String
    let value: String
    var color: Color = .primary

    var body: some View {
        VStack(spacing: 3) {
            Text(LocalizedStringKey(value))
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            Text(LocalizedStringKey(label))
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.white.opacity(0.35))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }
}

// MARK: - Period Picker

enum WorkoutPeriod: CaseIterable {
    case week, month, threeMonths

    var label: String {
        switch self {
        case .week: return NSLocalizedString("1W", comment: "Period label")
        case .month: return NSLocalizedString("1M", comment: "Period label")
        case .threeMonths: return NSLocalizedString("3M", comment: "Period label")
        }
    }

    var dateComponent: Calendar.Component { .day }

    var value: Int {
        switch self {
        case .week: return 7
        case .month: return 30
        case .threeMonths: return 90
        }
    }
}

// MARK: - HKWorkoutActivityType Extensions

extension HKWorkoutActivityType {
    var icon: String {
        switch self {
        case .running: return "figure.run"
        case .cycling: return "figure.outdoor.cycle"
        case .walking: return "figure.walk"
        case .swimming: return "figure.pool.swim"
        case .yoga: return "figure.mind.and.body"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "dumbbell"
        case .highIntensityIntervalTraining: return "bolt.heart"
        case .hiking: return "figure.hiking"
        case .elliptical: return "figure.elliptical"
        case .rowing: return "figure.rowing"
        case .stairClimbing: return "figure.stair.stepper"
        case .pilates: return "figure.pilates"
        case .dance: return "figure.dance"
        default: return "figure.mixed.cardio"
        }
    }

    var color: Color {
        switch self {
        case .running, .walking, .hiking: return .green
        case .cycling: return .orange
        case .swimming: return .blue
        case .yoga, .pilates: return .purple
        case .functionalStrengthTraining, .traditionalStrengthTraining: return .red
        case .highIntensityIntervalTraining: return .orange
        default: return .teal
        }
    }
}

#Preview {
    WorkoutsView()
}
