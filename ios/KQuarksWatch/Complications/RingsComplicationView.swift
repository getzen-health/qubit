import SwiftUI

struct RingsComplicationView: View {
    var movePercent: Double  // 0.0 to 1.0+
    var exercisePercent: Double
    var standPercent: Double

    var body: some View {
        ZStack {
            Gauge(value: min(movePercent, 1.0)) {
                Image(systemName: "figure.walk")
                    .foregroundStyle(.red)
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .tint(.red)
        }
    }
}

#Preview {
    RingsComplicationView(movePercent: 0.75, exercisePercent: 0.5, standPercent: 1.0)
}
