import SwiftUI

/// Container for AI insights stream
struct InsightsSectionView: View {
    let insights: [HealthInsight]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("AI Insights")
                .font(.headline)
                .foregroundStyle(.primary)
                .padding(.horizontal, 16)

            if insights.isEmpty {
                EmptyInsightsView()
            } else {
                VStack(spacing: 0) {
                    ForEach(insights.prefix(5)) { insight in
                        InsightRowView(insight: insight)

                        if insight.id != insights.prefix(5).last?.id {
                            Divider()
                                .padding(.leading, 56)
                        }
                    }
                }
                .background(Color.cardSurface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}

/// Individual insight row
struct InsightRowView: View {
    let insight: HealthInsight

    var categoryConfig: (icon: String, color: Color) {
        switch insight.category.lowercased() {
        case "sleep": ("moon.fill", .sleep)
        case "activity": ("figure.run", .activity)
        case "heart": ("heart.fill", .heart)
        case "recovery": ("bolt.fill", .recovery)
        case "strain": ("flame.fill", .strain)
        default: ("sparkles", .accent)
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Category icon
            Image(systemName: categoryConfig.icon)
                .font(.system(size: 16))
                .foregroundStyle(categoryConfig.color)
                .frame(width: 32, height: 32)
                .background(categoryConfig.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 4) {
                Text(insight.category.uppercased())
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Text(insight.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                Text(insight.content)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            Spacer()
        }
        .padding(16)
        .contentShape(Rectangle())
    }
}

/// Empty state for no insights
struct EmptyInsightsView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.title)
                .foregroundStyle(.tertiary)
                .frame(width: 48, height: 48)
                .background(Color.cardSurface)
                .clipShape(Circle())

            Text("No insights yet")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.primary)

            Text("As we learn more about your health patterns, personalized insights will appear here.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(3)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    ScrollView {
        VStack(spacing: 24) {
            InsightsSectionView(insights: [
                HealthInsight(
                    id: UUID(),
                    userId: UUID(),
                    category: "sleep",
                    title: "Great sleep consistency",
                    content: "You've maintained a consistent bedtime for 5 days straight.",
                    priority: "medium",
                    isRead: false,
                    createdAt: Date()
                ),
                HealthInsight(
                    id: UUID(),
                    userId: UUID(),
                    category: "activity",
                    title: "Activity goal streak",
                    content: "You've hit your step goal 3 days in a row!",
                    priority: "low",
                    isRead: false,
                    createdAt: Date()
                ),
            ])

            InsightsSectionView(insights: [])
        }
        .padding()
    }
    .background(Color.premiumBackground)
}
