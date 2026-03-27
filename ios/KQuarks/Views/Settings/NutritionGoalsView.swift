import SwiftUI

struct NutritionGoalsView: View {
    @State private var calorieGoal = 2000
    @State private var proteinGoal = 150
    @State private var carbsGoal = 250
    @State private var fatGoal = 65
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    enum Preset: String, CaseIterable {
        case weightLoss = "Weight Loss"
        case maintenance = "Maintenance"
        case muscleGain = "Muscle Gain"

        var goals: (cal: Int, protein: Int, carbs: Int, fat: Int) {
            switch self {
            case .weightLoss: return (1600, 160, 160, 45)
            case .maintenance: return (2000, 150, 250, 65)
            case .muscleGain: return (2500, 200, 300, 80)
            }
        }
    }

    var body: some View {
        Form {
            Section("Presets") {
                ForEach(Preset.allCases, id: \.self) { preset in
                    Button(action: { applyPreset(preset) }) {
                        HStack {
                            Text(preset.rawValue)
                            Spacer()
                            if isPresetSelected(preset) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.accentColor)
                            }
                        }
                    }
                    .foregroundColor(.primary)
                }
            } footer: {
                Text("Quick presets to get you started. Customize below.")
            }

            Section("Custom Goals") {
                Stepper("Calories: \(calorieGoal) kcal", value: $calorieGoal, in: 1200...4000, step: 50)
                Stepper("Protein: \(proteinGoal)g", value: $proteinGoal, in: 50...300, step: 5)
                Stepper("Carbs: \(carbsGoal)g", value: $carbsGoal, in: 50...500, step: 10)
                Stepper("Fat: \(fatGoal)g", value: $fatGoal, in: 20...150, step: 5)
            }

            Section("Macro Balance") {
                let proteinCals = proteinGoal * 4
                let carbsCals = carbsGoal * 4
                let fatCals = fatGoal * 9
                let totalCals = proteinCals + carbsCals + fatCals

                if totalCals > 0 {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Protein")
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text("\(Int((Double(proteinCals) / Double(totalCals)) * 100))%")
                                .foregroundStyle(.blue)
                        }
                        HStack {
                            Text("Carbs")
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text("\(Int((Double(carbsCals) / Double(totalCals)) * 100))%")
                                .foregroundStyle(.orange)
                        }
                        HStack {
                            Text("Fat")
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text("\(Int((Double(fatCals) / Double(totalCals)) * 100))%")
                                .foregroundStyle(.red)
                        }
                        Divider()
                            .padding(.vertical, 4)
                        HStack {
                            Text("Total Calories")
                                .font(.headline)
                            Spacer()
                            Text("\(totalCals) kcal")
                                .font(.headline)
                        }
                    }
                }
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.caption)
                }
            }

            Section {
                Button(action: saveGoals) {
                    if isSaving {
                        HStack {
                            ProgressView()
                            Spacer()
                            Text("Saving...")
                        }
                    } else {
                        Text("Save Goals")
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
                .disabled(isSaving)
            }
        }
        .navigationTitle("Nutrition Goals")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadGoals() }
    }

    private func loadGoals() async {
        isLoading = true
        do {
            if let goals = try await SupabaseService.shared.fetchNutritionGoals() {
                await MainActor.run {
                    calorieGoal = goals.calories
                    proteinGoal = goals.protein
                    carbsGoal = goals.carbs
                    fatGoal = goals.fat
                    isLoading = false
                }
            } else {
                await MainActor.run {
                    isLoading = false
                }
            }
        } catch {
            await MainActor.run {
                isLoading = false
                errorMessage = "Failed to load goals: \(error.localizedDescription)"
            }
        }
    }

    private func applyPreset(_ preset: Preset) {
        let goals = preset.goals
        calorieGoal = goals.cal
        proteinGoal = goals.protein
        carbsGoal = goals.carbs
        fatGoal = goals.fat
    }

    private func isPresetSelected(_ preset: Preset) -> Bool {
        let goals = preset.goals
        return calorieGoal == goals.cal
            && proteinGoal == goals.protein
            && carbsGoal == goals.carbs
            && fatGoal == goals.fat
    }

    private func saveGoals() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                try await SupabaseService.shared.saveNutritionGoals(
                    calorieGoal: calorieGoal,
                    proteinGoal: proteinGoal,
                    carbsGoal: carbsGoal,
                    fatGoal: fatGoal
                )
                await MainActor.run {
                    isSaving = false
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to save goals: \(error.localizedDescription)"
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        NutritionGoalsView()
    }
}
