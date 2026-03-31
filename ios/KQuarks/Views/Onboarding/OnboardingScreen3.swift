import SwiftUI

/// Screen 3 — Daily goal setup with steppers. Completes onboarding on save.
struct OnboardingScreen3: View {
    @Environment(AppState.self) private var appState

    @AppStorage("kquarks_step_goal") private var stepGoal: Int = 10000
    @AppStorage("kquarks_calorie_goal") private var calorieGoal: Int = 500
    // Stored as minutes; 8 h = 480 min default
    @AppStorage("kquarks_sleep_goal_minutes") private var sleepGoalMinutes: Int = 480

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer().frame(height: 60)

                Image(systemName: "target")
                    .font(.system(size: 72))
                    .foregroundStyle(.blue)
                    .padding(.bottom, 28)

                Text("Set Your Goals")
                    .font(.largeTitle.bold())
                    .multilineTextAlignment(.center)

                Spacer().frame(height: 12)

                Text("Personalise your daily targets. You can change these anytime in settings.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 40)

                VStack(spacing: 16) {
                    // Daily Steps: 1 000–20 000, step 500
                    GoalStepperRow(
                        icon: "figure.walk",
                        color: .green,
                        title: "Daily Steps",
                        valueLabel: "\(stepGoal)",
                        onDecrement: { stepGoal = max(1000, stepGoal - 500) },
                        onIncrement: { stepGoal = min(20000, stepGoal + 500) }
                    )

                    // Active Calories: 100–1 000, step 50
                    GoalStepperRow(
                        icon: "flame.fill",
                        color: .orange,
                        title: "Active Calories",
                        valueLabel: "\(calorieGoal) kcal",
                        onDecrement: { calorieGoal = max(100, calorieGoal - 50) },
                        onIncrement: { calorieGoal = min(1000, calorieGoal + 50) }
                    )

                    // Sleep: 5–10 h (300–600 min), step 0.5 h (30 min)
                    GoalStepperRow(
                        icon: "moon.fill",
                        color: .indigo,
                        title: "Sleep",
                        valueLabel: String(format: "%.1f hrs", Double(sleepGoalMinutes) / 60.0),
                        onDecrement: { sleepGoalMinutes = max(300, sleepGoalMinutes - 30) },
                        onIncrement: { sleepGoalMinutes = min(600, sleepGoalMinutes + 30) }
                    )
                }
                .padding(.horizontal, 24)

                Spacer().frame(height: 40)

                Button {
                    appState.completeOnboarding()
                } label: {
                    Text("Start Tracking 🎉")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(.blue)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 80)
            }
        }
    }
}

// MARK: - Goal stepper row

private struct GoalStepperRow: View {
    let icon: String
    let color: Color
    let title: String
    let valueLabel: String
    let onDecrement: () -> Void
    let onIncrement: () -> Void

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(valueLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            HStack(spacing: 0) {
                Button(action: onDecrement) {
                    Image(systemName: "minus")
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.bordered)

                Button(action: onIncrement) {
                    Image(systemName: "plus")
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

#Preview {
    OnboardingScreen3()
        .environment(AppState())
}
