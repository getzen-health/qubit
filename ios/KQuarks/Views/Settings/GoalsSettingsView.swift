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

            Section("Sleep") {
                HStack {
                    Label("Sleep Duration", systemImage: "moon.fill")
                    Spacer()
                    Stepper(
                        fmtSleepGoal(goalService.sleepGoalMinutes),
                        value: $goalService.sleepGoalMinutes,
                        in: 240...600,
                        step: 30
                    )
                }
            }

            Section("Heart Health") {
                HStack {
                    Label("HRV Target", systemImage: "heart.text.square")
                    Spacer()
                    Stepper(
                        "\(Int(goalService.hrvTarget)) ms",
                        value: $goalService.hrvTarget,
                        in: 20...100,
                        step: 5
                    )
                }
            } footer: {
                Text("Target heart rate variability in milliseconds. Higher values indicate better recovery.")
            }

            Section {
                Button("Reset to Defaults", role: .destructive) {
                    goalService.reset()
                }
            }
        }
        .navigationTitle("Health Goals")
        .toolbarTitleDisplayMode(.inline)
        .onChange(of: goalService.stepsGoal) { goalService.saveToSupabase() }
        .onChange(of: goalService.activeCaloriesGoal) { goalService.saveToSupabase() }
        .onChange(of: goalService.sleepGoalMinutes) { goalService.saveToSupabase() }
        .onChange(of: goalService.hrvTarget) { goalService.saveToSupabase() }
    }

    private func fmtSleepGoal(_ minutes: Double) -> String {
        let h = Int(minutes) / 60
        let m = Int(minutes) % 60
        return m == 0 ? "\(h)h" : "\(h)h \(m)m"
    }
}

#Preview {
    NavigationStack {
        GoalsSettingsView()
    }
}

