import SwiftUI

struct RingsComplicationView: View {
    let moveRingPercent: Double

    private var clamped: Double { min(max(moveRingPercent, 0), 1) }

    var body: some View {
        Gauge(value: clamped) {
            Image(systemName: "figure.run")
                .foregroundStyle(.red)
        } currentValueLabel: {
            Text(String(format: "%.0f%%", clamped * 100))
                .font(.system(size: 10, weight: .semibold))
                .minimumScaleFactor(0.5)
        }
        .gaugeStyle(.circularCapacity)
        .tint(.red)
    }
}

#Preview {
    RingsComplicationView(moveRingPercent: 0.72)
        .frame(width: 40, height: 40)
        .containerBackground(.black.gradient, for: .watch)
}
