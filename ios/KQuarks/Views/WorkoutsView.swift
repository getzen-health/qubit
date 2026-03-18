import SwiftUI
import HealthKit

struct WorkoutsView: View {
    @State private var workouts: [HKWorkout] = []
    @State private var isLoading = false
    @State private var selectedPeriod: WorkoutPeriod = .month

    private let healthKit = HealthKitService.shared

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
                            WorkoutSummaryRow(workouts: workouts)
                        }

                        ForEach(workouts, id: \.uuid) { workout in
                            NavigationLink(destination: WorkoutDetailView(workout: workout)) {
                                WorkoutRow(workout: workout)
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Workouts")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Picker("Period", selection: $selectedPeriod) {
                        ForEach(WorkoutPeriod.allCases, id: \.self) { period in
                            Text(period.label).tag(period)
                        }
                    }
                    .pickerStyle(.menu)
                }
            }
            .task(id: selectedPeriod) {
                await loadWorkouts()
            }
        }
    }

    private func loadWorkouts() async {
        isLoading = true
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: selectedPeriod.dateComponent, value: -selectedPeriod.value, to: Date())!
        workouts = (try? await healthKit.fetchWorkouts(from: startDate, to: Date())) ?? []
        isLoading = false
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
