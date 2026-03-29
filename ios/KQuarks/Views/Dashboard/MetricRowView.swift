import SwiftUI

/// Expandable metric row with clean dark styling
struct MetricRowView: View {
    let icon: String
    let label: String
    let value: String
    var unit: String? = nil
    var sublabel: String? = nil
    var trend: Int? = nil
    var color: Color = .primary
    var expandContent: (() -> AnyView)? = nil
    var destination: AnyView? = nil

    @State private var isExpanded = false

    private var rowLabel: some View {
        HStack(spacing: 12) {
            // Small colored icon
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(color)
                .frame(width: 32, height: 32)

            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white.opacity(0.85))
                if let sublabel = sublabel {
                    Text(sublabel)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.4))
                }
            }

            Spacer()

            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(value)
                    .font(.system(.title3, design: .rounded, weight: .bold))
                    .foregroundStyle(.white)
                if let unit = unit {
                    Text(unit)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.35))
                }
            }

            if let trend = trend {
                TrendBadge(value: trend)
            }

            if destination != nil {
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.2))
            } else if expandContent != nil {
                Image(systemName: "chevron.down")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.2))
                    .rotationEffect(.degrees(isExpanded ? 180 : 0))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
        .contentShape(Rectangle())
    }

    var body: some View {
        VStack(spacing: 0) {
            if let dest = destination {
                NavigationLink(destination: dest) { rowLabel }
                    .buttonStyle(.plain)
            } else {
                Button {
                    if expandContent != nil {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            isExpanded.toggle()
                        }
                    }
                } label: { rowLabel }
                    .buttonStyle(.plain)
            }

            if isExpanded, let content = expandContent {
                VStack(spacing: 0) {
                    Color.premiumDivider
                        .frame(height: 0.5)
                        .padding(.leading, 56)
                    content()
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }

            Color.premiumDivider
                .frame(height: 0.5)
                .padding(.leading, 56)
        }
    }
}

struct MetricRowCompactView: View {
    let icon: String
    let label: String
    let value: String
    var unit: String? = nil
    var color: Color = .primary

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(color)
            Text(label)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.5))
            Spacer()
            HStack(alignment: .firstTextBaseline, spacing: 1) {
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                if let unit = unit {
                    Text(unit)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.35))
                }
            }
        }
    }
}

struct TrendBadge: View {
    let value: Int

    var color: Color {
        if value > 0 { return .recovery }
        if value < 0 { return .error }
        return .secondary
    }

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: value > 0 ? "arrow.up" : value < 0 ? "arrow.down" : "minus")
                .font(.system(size: 8, weight: .bold))
            Text("\(abs(trend))%")
                .font(.caption2)
                .fontWeight(.semibold)
        }
        .foregroundStyle(color)
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(color.opacity(0.12))
        .clipShape(Capsule())
    }

    private var trend: Int { value }
}

struct MetricDetailRow: View {
    let label: String
    let value: String
    var color: Color? = nil

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.5))
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(color ?? .white)
        }
    }
}

#Preview {
    ZStack {
        PremiumBackgroundView()
        VStack(spacing: 0) {
            MetricRowView(icon: "bolt.fill", label: "Recovery", value: "78", unit: "%", sublabel: "Optimal", trend: 5, color: .recovery)
            MetricRowView(icon: "flame.fill", label: "Strain", value: "14.2", unit: "/21", sublabel: "High", trend: -8, color: .strain)
            MetricRowView(icon: "moon.fill", label: "Sleep", value: "7h 42m", sublabel: "85% quality", color: .sleep)
            MetricRowView(icon: "heart.fill", label: "Resting HR", value: "58", unit: "bpm", color: .heart)
        }
        .glassCard()
        .padding()
    }
    .preferredColorScheme(.dark)
}
