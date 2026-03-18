import SwiftUI

struct GoalsSettingsView: View {
    @Bindable var goalService = GoalService.shared

    var body: some View {
        Form {
            Section("Daily Activity") {
                HStack {
                    Label("Steps", systemImage: "figure.walk")
                    Spacer()
                    Stepper(
                        "\(Int(goalService.stepsGoal).formatted()) steps",
                        value: $goalService.stepsGoal,
                        in: 1_000...30_000,
                        step: 500
                    )
                }

                HStack {
                    Label("Active Calories", systemImage: "flame")
                    Spacer()
                    Stepper(
                        "\(Int(goalService.activeCaloriesGoal)) kcal",
                        value: $goalService.activeCaloriesGoal,
                        in: 100...2_000,
                        step: 50
                    )
                }
            }

            Section {
                Button("Reset to Defaults", role: .destructive) {
                    goalService.reset()
                }
            }
        }
        .navigationTitle("Health Goals")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        GoalsSettingsView()
    }
}
