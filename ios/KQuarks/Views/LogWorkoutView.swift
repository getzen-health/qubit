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
            List {
                Section {
                    TextField("Exercise name", text: $newExerciseName)
                        .autocorrectionDisabled()
                }

                ForEach(ExerciseLibrary.categories, id: \.name) { category in
                    Section(category.name) {
                        let filtered = newExerciseName.isEmpty
                            ? category.exercises
                            : category.exercises.filter { $0.localizedCaseInsensitiveContains(newExerciseName) }
                        ForEach(filtered, id: \.self) { name in
                            Button {
                                exercises.append(StrengthExercise(name: name))
                                showAddExercise = false
                            } label: {
                                Text(name).foregroundStyle(.primary)
                            }
                        }
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
        .presentationDetents([.large])
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

            // Persist strength sets to Supabase for strength workouts
            if selectedType == .strengthTraining && !exercises.isEmpty {
                await saveStrengthSets()
            }

            #if os(iOS)
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            #endif
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }

    private func saveStrengthSets() async {
        let service = SupabaseService.shared
        guard let userId = service.currentSession?.user.id else { return }

        // Create a strength session row
        let sessionDate = Calendar.current.startOfDay(for: startDate)
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let isoDate = formatter.string(from: sessionDate)

        struct SessionRow: Encodable {
            let user_id: String
            let session_date: String
        }
        struct SessionResult: Decodable {
            let id: String
        }

        guard let sessionResult: SessionResult = try? await service.client
            .from("strength_sessions")
            .insert(SessionRow(user_id: userId.uuidString, session_date: isoDate))
            .select("id")
            .single()
            .execute()
            .value else { return }

        struct SetRow: Encodable {
            let session_id: String
            let user_id: String
            let exercise_name: String
            let set_number: Int
            let reps: Int
            let weight_kg: Double
        }

        let rows: [SetRow] = exercises.flatMap { exercise in
            exercise.sets.enumerated().map { idx, set in
                SetRow(
                    session_id: sessionResult.id,
                    user_id: userId.uuidString,
                    exercise_name: exercise.name,
                    set_number: idx + 1,
                    reps: set.reps,
                    weight_kg: set.weightKg
                )
            }
        }

        _ = try? await service.client
            .from("strength_sets")
            .insert(rows)
            .execute()
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

// MARK: - Exercise Library (100+ movements across 8 categories)

enum ExerciseLibrary {
    struct Category {
        let name: String
        let exercises: [String]
    }

    static let categories: [Category] = [
        Category(name: "Compound Lifts", exercises: [
            "Squat", "Back Squat", "Front Squat", "Goblet Squat",
            "Deadlift", "Romanian Deadlift", "Sumo Deadlift", "Trap Bar Deadlift",
            "Bench Press", "Incline Bench Press", "Decline Bench Press",
            "Overhead Press", "Push Press", "Barbell Row", "T-Bar Row",
            "Pull-up", "Chin-up", "Weighted Pull-up",
        ]),
        Category(name: "Upper — Push", exercises: [
            "Dumbbell Press", "Dumbbell Incline Press", "Dumbbell Fly",
            "Cable Fly", "Cable Crossover", "Pec Deck",
            "Lateral Raise", "Front Raise", "Arnold Press",
            "Tricep Dip", "Close-Grip Bench", "Skull Crushers",
            "Tricep Pushdown", "Overhead Tricep Extension",
            "Pike Push-up", "Push-up", "Diamond Push-up",
        ]),
        Category(name: "Upper — Pull", exercises: [
            "Lat Pulldown", "Seated Cable Row", "Single-Arm Dumbbell Row",
            "Face Pull", "Rear Delt Fly", "Band Pull-Apart",
            "Shrug", "Upright Row", "EZ Bar Curl", "Barbell Curl",
            "Dumbbell Curl", "Hammer Curl", "Preacher Curl",
            "Cable Curl", "Incline Dumbbell Curl", "Concentration Curl",
        ]),
        Category(name: "Lower Body", exercises: [
            "Leg Press", "Hack Squat", "Lunge", "Walking Lunge",
            "Bulgarian Split Squat", "Step-Up", "Box Jump",
            "Hip Thrust", "Glute Bridge", "Cable Kickback",
            "Leg Extension", "Leg Curl", "Nordic Curl",
            "Calf Raise", "Seated Calf Raise", "Donkey Calf Raise",
            "Good Morning", "Hyperextension",
        ]),
        Category(name: "Core & Abs", exercises: [
            "Plank", "Side Plank", "Hollow Hold", "Ab Wheel",
            "Cable Crunch", "Crunch", "Reverse Crunch",
            "Leg Raise", "Hanging Leg Raise", "Dragon Flag",
            "Russian Twist", "Woodchop", "Pallof Press",
            "Dead Bug", "Bird Dog", "McGill Big 3",
        ]),
        Category(name: "Olympic & Power", exercises: [
            "Power Clean", "Hang Power Clean", "Clean & Jerk",
            "Snatch", "Hang Snatch", "Power Snatch",
            "Kettlebell Swing", "Kettlebell Clean", "Kettlebell Snatch",
            "Box Jump", "Broad Jump", "Medicine Ball Slam",
        ]),
        Category(name: "Machines & Cables", exercises: [
            "Chest Press Machine", "Shoulder Press Machine", "Row Machine",
            "Lat Pulldown Machine", "Leg Press Machine",
            "Leg Extension Machine", "Leg Curl Machine", "Calf Raise Machine",
            "Cable Lateral Raise", "Cable Row", "Cable Fly",
            "Assisted Pull-up", "Smith Machine Squat", "Smith Machine Bench",
        ]),
        Category(name: "Functional & Mobility", exercises: [
            "Turkish Get-Up", "Farmer Carry", "Suitcase Carry", "Overhead Carry",
            "Sled Push", "Sled Pull", "Battle Ropes",
            "Jump Squat", "Plyometric Push-up", "Burpee",
            "Thruster", "Wall Ball", "Box Step-up",
            "Hip 90/90", "World's Greatest Stretch", "Couch Stretch",
        ]),
    ]
}

#Preview {
    LogWorkoutView()
}
