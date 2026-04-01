import SwiftUI

struct RingsComplicationView: View {
    let steps: Int
    let stepGoal: Int
    let readinessScore: Int
    let activeCalories: Int
    let calorieGoal: Int
    
    var stepsPercent: Double {
        stepGoal > 0 ? Double(steps) / Double(stepGoal) : 0.0
    }
    
    var caloriesPercent: Double {
        calorieGoal > 0 ? Double(activeCalories) / Double(calorieGoal) : 0.0
    }
    
    var readinessPercent: Double {
        Double(readinessScore) / 100.0
    }

    var body: some View {
        ZStack {
            // Outer ring: Steps (red)
            Link(destination: URL(string: "getzen://dashboard")!) {
                Gauge(value: min(stepsPercent, 1.0)) {
                    EmptyView()
                }
                .gaugeStyle(.accessoryCircularCapacity)
                .tint(.red)
            }

            // Middle ring: Calories (green)
            Link(destination: URL(string: "getzen://dashboard")!) {
                Gauge(value: min(caloriesPercent, 1.0)) {
                    EmptyView()
                }
                .gaugeStyle(.accessoryCircularCapacity)
                .tint(.green)
                .scaleEffect(0.67)
            }

            // Inner ring: Readiness (cyan)
            Link(destination: URL(string: "getzen://ready")!) {
                Gauge(value: min(readinessPercent, 1.0)) {
                    EmptyView()
                }
                .gaugeStyle(.accessoryCircularCapacity)
                .tint(.cyan)
                .scaleEffect(0.34)
            }
        }
    }
}

#Preview {
    RingsComplicationView(steps: 7500, stepGoal: 10000, readinessScore: 72, activeCalories: 320, calorieGoal: 500)
}
