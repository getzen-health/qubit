import SwiftUI
import HealthKit

struct WorkoutDetailView: View {
    let workout: HKWorkout

    var body: some View {
        List {
            // Header section
            Section {
                HStack(spacing: 16) {
                    Image(systemName: workout.workoutActivityType.icon)
                        .font(.system(size: 36))
                        .foregroundStyle(workout.workoutActivityType.color)
                        .frame(width: 64, height: 64)
                        .background(workout.workoutActivityType.color.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 14))

                    VStack(alignment: .leading, spacing: 4) {
                        Text(workout.workoutActivityType.name)
                            .font(.title2.bold())
                        Text(workout.startDate.formatted(date: .complete, time: .omitted))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("\(workout.startDate.formatted(date: .omitted, time: .shortened)) – \(workout.endDate.formatted(date: .omitted, time: .shortened))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            // Stats section
            Section("Stats") {
                WorkoutStatRow(
                    icon: "clock",
                    label: "Duration",
                    value: formatDuration(workout.duration),
                    color: .blue
                )

                if let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()), calories > 0 {
                    WorkoutStatRow(
                        icon: "flame.fill",
                        label: "Active Calories",
                        value: "\(Int(calories)) kcal",
                        color: .orange
                    )
                }

                if let distance = workout.totalDistance?.doubleValue(for: .meter()), distance > 0 {
                    let km = distance / 1000
                    WorkoutStatRow(
                        icon: "map",
                        label: "Distance",
                        value: String(format: "%.2f km", km),
                        color: .green
                    )

                    // Pace (min/km) only for running/walking/hiking/cycling
                    let paceTypes: [HKWorkoutActivityType] = [.running, .walking, .hiking, .cycling]
                    if paceTypes.contains(workout.workoutActivityType) && workout.duration > 0 {
                        let paceSecsPerKm = workout.duration / km
                        let paceMin = Int(paceSecsPerKm) / 60
                        let paceSec = Int(paceSecsPerKm) % 60
                        WorkoutStatRow(
                            icon: "speedometer",
                            label: workout.workoutActivityType == .cycling ? "Speed" : "Pace",
                            value: workout.workoutActivityType == .cycling
                                ? String(format: "%.1f km/h", km / (workout.duration / 3600))
                                : "\(paceMin):\(String(format: "%02d", paceSec)) /km",
                            color: .purple
                        )
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(workout.workoutActivityType.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        let s = Int(seconds) % 60
        if h > 0 {
            return "\(h)h \(m)m"
        }
        return "\(m)m \(s)s"
    }
}

struct WorkoutStatRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 24)
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.headline)
        }
    }
}

#Preview {
    NavigationStack {
        Text("WorkoutDetailView preview")
    }
}
