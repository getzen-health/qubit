import SwiftUI

/// Expandable inline metric row for stream-based dashboard
struct MetricRowView: View {
    let icon: String
    let label: String
    let value: String
    var unit: String? = nil
    var sublabel: String? = nil
    var trend: Int? = nil
    var color: Color = .primary
    var expandContent: (() -> AnyView)? = nil
    /// When set, the row acts as a NavigationLink to this view.
    var destination: AnyView? = nil

    @State private var isExpanded = false

    private var rowLabel: some View {
        HStack(spacing: 12) {
            // Neutral icon background — color on symbol only (Apple Health style)
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(.systemFill))
                    .frame(width: 34, height: 34)
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(color)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
                if let sublabel = sublabel {
                    Text(sublabel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundStyle(color)
                if let unit = unit {
                    Text(unit)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if let trend = trend {
                TrendBadge(value: trend)
            }

            if destination != nil {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            } else if expandContent != nil {
                Image(systemName: "chevron.down")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .rotationEffect(.degrees(isExpanded ? 180 : 0))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .contentShape(Rectangle())
    }

    var body: some View {
        VStack(spacing: 0) {
            if let dest = destination {
                NavigationLink(destination: dest) {
                    rowLabel
                }
                .buttonStyle(.plain)
            } else {
                Button {
                    if expandContent != nil {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            isExpanded.toggle()
                        }
                    }
                } label: {
                    rowLabel
                }
                .buttonStyle(.plain)
            }

            if isExpanded, let content = expandContent {
                VStack(spacing: 0) {
                    Divider()
                        .padding(.leading, 62)
                    content()
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }

            Divider()
                .padding(.leading, 62)
        }
        .background(Color(.systemBackground))
    }
}

/// Compact version for smaller displays
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
                .foregroundStyle(.secondary)

            Spacer()

            HStack(alignment: .firstTextBaseline, spacing: 1) {
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(color)

                if let unit = unit {
                    Text(unit)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

/// Trend badge showing percentage change
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
            Text("\(abs(value))%")
                .font(.caption2)
                .fontWeight(.medium)
        }
        .foregroundStyle(color)
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(color.opacity(0.15))
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }
}

/// Detail row for expanded content
struct MetricDetailRow: View {
    let label: String
    let value: String
    var color: Color? = nil

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(color ?? .primary)
        }
    }
}

#Preview {
    List {
        MetricRowView(
            icon: "bolt.fill",
            label: "Recovery",
            value: "78",
            unit: "%",
            sublabel: "Optimal",
            trend: 5,
            color: .recovery
        ) {
            AnyView(
                VStack(spacing: 8) {
                    MetricDetailRow(label: "Sleep Performance", value: "85%")
                    MetricDetailRow(label: "HRV Balance", value: "Balanced")
                    MetricDetailRow(label: "Respiratory Rate", value: "14.5 br/min")
                }
            )
        }

        MetricRowView(
            icon: "flame.fill",
            label: "Strain",
            value: "14.2",
            unit: "/21",
            sublabel: "High",
            trend: -8,
            color: .strain
        )

        MetricRowView(
            icon: "moon.fill",
            label: "Sleep",
            value: "7h 42m",
            sublabel: "85% quality",
            color: .sleep
        )

        MetricRowView(
            icon: "heart.fill",
            label: "Resting HR",
            value: "58",
            unit: "bpm",
            color: .heart
        )
    }
    .listStyle(.plain)
}
