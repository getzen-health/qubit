import SwiftUI

struct MetricTileView: View {
    let icon: String
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: icon)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
                .minimumScaleFactor(0.7)
                .lineLimit(1)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    HStack {
        MetricTileView(icon: "figure.walk", value: "8,423", label: "Steps")
        MetricTileView(icon: "bed.double", value: "7.2h", label: "Sleep")
    }
    .containerBackground(.black.gradient, for: .watch)
}
