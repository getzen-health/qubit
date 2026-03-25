import SwiftUI
import HealthKit

// MARK: - LogWorkoutView

struct LogWorkoutView: View {
    @Environment(\.dismiss) private var dismiss

    // Workout type
    @State private var selectedType: WorkoutType = .running

    // Time
    @State private var startDate = Date().addingTimeInterval(-3600)
    @State private var durationHours = 0
    @State private var durationMinutes = 30

    // Optional details
    @State private var caloriesText = ""
    @State private var distanceText = ""

    // Strength training sets
    @State private var exercises: [StrengthExercise] = []
    @State private var showAddExercise = false
    @State private var newExerciseName = ""

    // State
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showError = false

    var endDate: Date {
        startDate.addingTimeInterval(TimeInterval(durationHours * 3600 + durationMinutes * 60))
    }

    var body: some View {
        NavigationStack {
            Form {
                // Workout type picker
                Section("Type") {
                    Picker("Activity", selection: $selectedType) {
                        ForEach(WorkoutType.allCases, id: \.self) { type in
                            Label(type.displayName, systemImage: type.icon)
                                .tag(type)
                        }
                    }
                    .pickerStyle(.navigationLink)
                }

                // When
                Section("When") {
                    DatePicker("Start", selection: $startDate, in: ...Date(), displayedComponents: [.date, .hourAndMinute])
                }

                // Duration
                Section("Duration") {
                    HStack {
                        Stepper("\(durationHours)h", value: $durationHours, in: 0...23)
                        Divider()
                        Stepper("\(durationMinutes)m", value: $durationMinutes, in: 0...59, step: 5)
                    }

                    if durationHours == 0 && durationMinutes == 0 {
                        Text("Set a duration greater than 0 minutes")
                            .font(.caption)
                            .foregroundStyle(.red)
                    } else {
                        Text("Ends: \(endDate.formatted(date: .omitted, time: .shortened))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                // Strength training: sets/reps/weight
                if selectedType == .strengthTraining {
                    strengthSection
                }

                // Optional stats
                Section("Details (optional)") {
                    HStack {
                        Image(systemName: "flame.fill")
                            .foregroundStyle(.orange)
                            .frame(width: 24)
                        TextField("Active Calories", text: $caloriesText)
                            #if os(iOS)
                            .keyboardType(.numberPad)
                            #endif
                        Text("kcal")
                            .foregroundStyle(.secondary)
                    }

                    if selectedType.supportsDistance {
                        HStack {
                            Image(systemName: "map")
                                .foregroundStyle(.blue)
                                .frame(width: 24)
                            TextField("Distance", text: $distanceText)
                                #if os(iOS)
                                .keyboardType(.decimalPad)
                                #endif
                            Text("km")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Log Workout")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text("Save").bold()
                        }
                    }
                    .disabled(isSaving || (durationHours == 0 && durationMinutes == 0))
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "Failed to save workout")
            }
            .sheet(isPresented: $showAddExercise) {
                addExerciseSheet
            }
        }
    }

    // MARK: - Strength Section

    @ViewBuilder
    private var strengthSection: some View {
        Section {
            ForEach($exercises) { $exercise in
                DisclosureGroup {
                    ForEach($exercise.sets) { $set in
                        StrengthSetRow(set: $set)
                    }
                    .onDelete { exercise.sets.remove(atOffsets: $0) }

                    Button {
                        exercise.sets.append(StrengthSet())
                    } label: {
                        Label("Add Set", systemImage: "plus")
                            .font(.caption)
                    }
                } label: {
                    HStack {
                        Image(systemName: "dumbbell.fill")
                            .foregroundStyle(.purple)
                        VStack(alignment: .leading) {
                            Text(exercise.name).font(.body)
                            Text("\(exercise.sets.count) set\(exercise.sets.count == 1 ? "" : "s")")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                }
            }
            .onDelete { exercises.remove(atOffsets: $0) }

            Button {
                newExerciseName = ""
                showAddExercise = true
            } label: {
                Label("Add Exercise", systemImage: "plus.circle.fill")
            }
        } header: {
            Text("Exercises")
        } footer: {
            if !exercises.isEmpty {
                let totalSets = exercises.reduce(0) { $0 + $1.sets.count }
                let totalVolume = exercises.flatMap(\.sets).reduce(0.0) { $0 + (Double($1.reps) * $1.weightKg) }
                Text("\(totalSets) sets · \(Int(totalVolume)) kg total volume")
            }
        }
    }

    private var addExerciseSheet: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Exercise name", text: $newExerciseName)
                }

                Section("Quick add") {
                    let common = ["Squat", "Deadlift", "Bench Press", "Overhead Press",
                                  "Pull-up", "Row", "Lunge", "Hip Thrust", "Plank"]
                    ForEach(common, id: \.self) { name in
                        Button(name) {
                            newExerciseName = name
                        }
                        .foregroundStyle(.primary)
                    }
                }
            }
            .navigationTitle("Add Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showAddExercise = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        let name = newExerciseName.trimmingCharacters(in: .whitespaces)
                        guard !name.isEmpty else { return }
                        exercises.append(StrengthExercise(name: name))
                        showAddExercise = false
                    }
                    .disabled(newExerciseName.trimmingCharacters(in: .whitespaces).isEmpty)
                    .bold()
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }

        let calories = Double(caloriesText)
        let distanceKm = Double(distanceText)
        let distanceMeters = distanceKm.map { $0 * 1000 }

        do {
            try await HealthKitService.shared.saveWorkout(
                activityType: selectedType.hkType,
                startDate: startDate,
                endDate: endDate,
                activeCalories: calories,
                distanceMeters: distanceMeters
            )
            #if os(iOS)
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            #endif
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}

// MARK: - Strength Data Models

struct StrengthExercise: Identifiable {
    let id = UUID()
    var name: String
    var sets: [StrengthSet] = [StrengthSet()]
}

struct StrengthSet: Identifiable {
    let id = UUID()
    var reps: Int = 10
    var weightKg: Double = 20
    var isCompleted: Bool = false
}

// MARK: - StrengthSetRow

private struct StrengthSetRow: View {
    @Binding var set: StrengthSet

    var body: some View {
        HStack(spacing: 12) {
            Button {
                set.isCompleted.toggle()
            } label: {
                Image(systemName: set.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(set.isCompleted ? .green : .secondary)
                    .font(.title3)
            }
            .buttonStyle(.plain)

            Stepper("\(set.reps) reps", value: $set.reps, in: 1...100)
                .labelsHidden()
            Text("\(set.reps) reps")
                .font(.subheadline)
                .frame(minWidth: 55)

            Stepper(String(format: "%.1f kg", set.weightKg), value: $set.weightKg, in: 0...500, step: 2.5)
                .labelsHidden()
            Text(String(format: "%.1f kg", set.weightKg))
                .font(.subheadline)
                .frame(minWidth: 60)
        }
    }
}


// MARK: - WorkoutType

enum WorkoutType: CaseIterable {
    case running, walking, cycling, swimming, strengthTraining, hiit,
         yoga, pilates, hiking, elliptical, rowing, dance, other

    var displayName: String {
        switch self {
        case .running: return "Running"
        case .walking: return "Walking"
        case .cycling: return "Cycling"
        case .swimming: return "Swimming"
        case .strengthTraining: return "Strength Training"
        case .hiit: return "HIIT"
        case .yoga: return "Yoga"
        case .pilates: return "Pilates"
        case .hiking: return "Hiking"
        case .elliptical: return "Elliptical"
        case .rowing: return "Rowing"
        case .dance: return "Dance"
        case .other: return "Other"
        }
    }

    var icon: String {
        switch self {
        case .running: return "figure.run"
        case .walking: return "figure.walk"
        case .cycling: return "figure.outdoor.cycle"
        case .swimming: return "figure.pool.swim"
        case .strengthTraining: return "dumbbell"
        case .hiit: return "bolt.heart"
        case .yoga: return "figure.mind.and.body"
        case .pilates: return "figure.pilates"
        case .hiking: return "figure.hiking"
        case .elliptical: return "figure.elliptical"
        case .rowing: return "figure.rowing"
        case .dance: return "figure.dance"
        case .other: return "figure.mixed.cardio"
        }
    }

    var hkType: HKWorkoutActivityType {
        switch self {
        case .running: return .running
        case .walking: return .walking
        case .cycling: return .cycling
        case .swimming: return .swimming
        case .strengthTraining: return .traditionalStrengthTraining
        case .hiit: return .highIntensityIntervalTraining
        case .yoga: return .yoga
        case .pilates: return .pilates
        case .hiking: return .hiking
        case .elliptical: return .elliptical
        case .rowing: return .rowing
        case .dance: return .cardioDance
        case .other: return .functionalStrengthTraining
        }
    }

    var supportsDistance: Bool {
        switch self {
        case .running, .walking, .cycling, .swimming, .hiking, .rowing: return true
        default: return false
        }
    }
}

#Preview {
    LogWorkoutView()
}
