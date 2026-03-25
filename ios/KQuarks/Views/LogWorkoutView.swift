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

                // Optional stats
                Section("Details (optional)") {
                    HStack {
                        Image(systemName: "flame.fill")
                            .foregroundStyle(.orange)
                            .frame(width: 24)
                        TextField("Active Calories", text: $caloriesText)
                            .keyboardType(.numberPad)
                        Text("kcal")
                            .foregroundStyle(.secondary)
                    }

                    if selectedType.supportsDistance {
                        HStack {
                            Image(systemName: "map")
                                .foregroundStyle(.blue)
                                .frame(width: 24)
                            TextField("Distance", text: $distanceText)
                                .keyboardType(.decimalPad)
                            Text("km")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Log Workout")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
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
        }
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
