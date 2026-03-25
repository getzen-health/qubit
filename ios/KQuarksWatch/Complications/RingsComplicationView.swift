import SwiftUI

struct RingsComplicationView: View {
    var movePercent: Double  // 0.0 to 1.0+
    var exercisePercent: Double
    var standPercent: Double

    var body: some View {
        ZStack {
            // Outer ring: Move (red)
            Gauge(value: min(movePercent, 1.0)) {
                EmptyView()
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .tint(.red)

            // Middle ring: Exercise (green)
            Gauge(value: min(exercisePercent, 1.0)) {
                EmptyView()
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .tint(.green)
            .scaleEffect(0.67)

            // Inner ring: Stand (cyan)
            Gauge(value: min(standPercent, 1.0)) {
                EmptyView()
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .tint(.cyan)
            .scaleEffect(0.34)
        }
    }
}

#Preview {
    RingsComplicationView(movePercent: 0.75, exercisePercent: 0.5, standPercent: 1.0)
}
