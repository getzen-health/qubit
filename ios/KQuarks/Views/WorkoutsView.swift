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
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if workouts.isEmpty {
                    ContentUnavailableView(
                        "No Workouts",
                        systemImage: "figure.run",
                        description: Text("No workouts found for this period. Start tracking workouts in the Apple Health app.")
                    )
                } else {
                    List {
                        Section {
                            WorkoutSummaryRow(workouts: filtered)
                        }

                        if typeBreakdown.count > 1 {
                            Section("By Type") {
                                WorkoutTypeBreakdownView(breakdown: typeBreakdown)
                            }
                        }

                        ForEach(filtered, id: \.uuid) { workout in
                            NavigationLink(destination: WorkoutDetailView(workout: workout)) {
                                WorkoutRow(workout: workout)
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Workouts")
            .toolbarTitleDisplayMode(.inline)
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
                            Image(systemName: "chart.xyaxis.line")
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
            .refreshable { await loadWorkouts() }
        }
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
                            Text(stat.name)
                                .font(.subheadline)
                            Spacer()
                            Text("\(stat.count) · \(fmt(stat.totalSeconds))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .monospacedDigit()
                        }
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(stat.color.opacity(0.25))
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
                .foregroundColor(workout.workoutActivityType.color)
                .frame(width: 44, height: 44)
                .background(workout.workoutActivityType.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 3) {
                Text(workout.workoutActivityType.name)
                    .font(.headline)

                Text(workout.startDate, style: .date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                Text(formatDuration(workout.duration))
                    .font(.subheadline.monospacedDigit())

                if let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                    Text("\(Int(calories)) cal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
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
            SummaryBubble(label: "Sessions", value: "\(workouts.count)")
            Divider().frame(height: 40)
            SummaryBubble(label: "Total Time", value: fmt(totalSeconds))
            Divider().frame(height: 40)
            SummaryBubble(label: "Calories", value: totalCalories > 0 ? "\(totalCalories)" : "—")
        }
        .frame(maxWidth: .infinity)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

struct SummaryBubble: View {
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(.primary)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
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
        case .week: return "1W"
        case .month: return "1M"
        case .threeMonths: return "3M"
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
