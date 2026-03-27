import SwiftUI

struct WorkoutHistoryView: View {
    @State private var workouts: [WorkoutRecord] = []
    @State private var selectedType: String = "All"
    @State private var isLoading = true

    let types = ["All", "Running", "Cycling", "Swimming", "Walking", "Strength", "HIIT"]

    struct WorkoutRecord: Identifiable, Decodable {
        let id: String
        let type: String
        let workout_date: String
        let duration_minutes: Int
        let calories: Int?
        let notes: String?
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(types, id: ".self") { type in
                        Button(type) { selectedType = type }
                            .font(.caption.weight(.medium))
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(selectedType == type ? Color.purple : Color(.systemGray6))
                            .foregroundColor(selectedType == type ? .white : .secondary)
                            .cornerRadius(20)
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
            }

            if isLoading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if workouts.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "figure.run").font(.largeTitle).foregroundColor(.secondary)
                    Text("No workouts yet").foregroundColor(.secondary)
                }.frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(filteredWorkouts) { workout in
                    WorkoutHistoryRow(workout: workout)
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Workout History")
        .task { await loadWorkouts() }
        .onChange(of: selectedType) { _, _ in Task { await loadWorkouts() } }
    }

    var filteredWorkouts: [WorkoutRecord] {
        selectedType == "All" ? workouts : workouts.filter { $0.type == selectedType }
    }

    func loadWorkouts() async {
        isLoading = true
        // Fetch from API — placeholder
        isLoading = false
    }
}

struct WorkoutHistoryRow: View {
    let workout: WorkoutHistoryView.WorkoutRecord

    var icon: String {
        switch workout.type {
        case "Running": return "figure.run"
        case "Cycling": return "figure.outdoor.cycle"
        case "Swimming": return "figure.pool.swim"
        case "Walking": return "figure.walk"
        default: return "figure.strengthtraining.traditional"
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.purple)
                .frame(width: 36, height: 36)
                .background(Color.purple.opacity(0.1))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 3) {
                Text(workout.type).font(.subheadline.bold())
                HStack(spacing: 10) {
                    Label("\(workout.duration_minutes)m", systemImage: "clock")
                    if let cal = workout.calories { Label("\(cal)", systemImage: "flame") }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
