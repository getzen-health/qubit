import SwiftUI

/// Screen 2 of 5 — Set nutrition and health goals
struct OnboardingGoalSettingView: View {
    let onNext: () -> Void

    @State private var calorieGoal = 2000
    @State private var proteinGoal = 150
    @State private var carbsGoal = 250
    @State private var fatGoal = 65
    @State private var isLoading = true

    let calorieOptions = [1500, 1800, 2000, 2200, 2500]
    let proteinOptions = [100, 130, 150, 180, 200]
    let carbsOptions = [200, 225, 250, 300, 350]
    let fatOptions = [50, 60, 65, 75, 85]

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer().frame(height: 48)

                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.orange, .orange.opacity(0.25))

                Spacer().frame(height: 24)

                Text("Nutrition Goals")
                    .font(.title2.bold())

                Spacer().frame(height: 8)

                Text("Set your daily macro targets. You can adjust these anytime in settings.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 36)

                // Goal cards
                VStack(spacing: 20) {
                    GoalCard(
                        title: "Calories",
                        icon: "flame.fill",
                        value: $calorieGoal,
                        unit: "kcal",
                        options: calorieOptions,
                        color: .orange
                    )

                    GoalCard(
                        title: "Protein",
                        icon: "bolt.fill",
                        value: $proteinGoal,
                        unit: "g",
                        options: proteinOptions,
                        color: .blue
                    )

                    GoalCard(
                        title: "Carbs",
                        icon: "sparkles",
                        value: $carbsGoal,
                        unit: "g",
                        options: carbsOptions,
                        color: .yellow
                    )

                    GoalCard(
                        title: "Fat",
                        icon: "drop.fill",
                        value: $fatGoal,
                        unit: "g",
                        options: fatOptions,
                        color: .red
                    )
                }
                .padding(.horizontal, 24)

                Spacer().frame(height: 36)

                Button(action: saveAndContinue) {
                    if isLoading {
                        ProgressView()
                            .foregroundStyle(.white)
                    } else {
                        Text("Continue")
                            .font(.headline)
                            .foregroundStyle(.white)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.accentColor)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .disabled(isLoading)
                .padding(.horizontal, 24)

                Button(action: onNext) {
                    Text("Skip")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 12)
                .padding(.bottom, 48)
            }
        }
    }

    private func saveAndContinue() {
        isLoading = true
        Task {
            do {
                try await SupabaseService.shared.saveNutritionGoals(
                    calorieGoal: calorieGoal,
                    proteinGoal: proteinGoal,
                    carbsGoal: carbsGoal,
                    fatGoal: fatGoal
                )
                await MainActor.run {
                    isLoading = false
                    onNext()
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    onNext()
                }
            }
        }
    }
}

// MARK: - Goal Card Component

private struct GoalCard: View {
    let title: String
    let icon: String
    @Binding var value: Int
    let unit: String
    let options: [Int]
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .font(.headline)
                Spacer()
                Text("\(value) \(unit)")
                    .font(.subheadline.bold())
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 8) {
                ForEach(options, id: \.self) { option in
                    Button {
                        value = option
                    } label: {
                        Text("\(option)")
                            .font(.caption2.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(value == option ? color : Color(.systemGray5))
                            .foregroundStyle(value == option ? .white : .primary)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

#Preview {
    OnboardingGoalSettingView(onNext: {})
}
