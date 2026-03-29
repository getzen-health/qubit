import SwiftUI

/// A tappable card tile used in dashboard grid sections (Wellbeing, AI Features).
struct DashboardTileCard: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var color: Color = .accentColor
    var badge: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(color.opacity(0.14))
                        .frame(width: 42, height: 42)
                    Image(systemName: icon)
                        .font(.system(size: 19, weight: .semibold))
                        .foregroundStyle(color)
                }

                Spacer()

                if let badge = badge {
                    Text(badge)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(color)
                        .clipShape(Capsule())
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.07), radius: 8, x: 0, y: 3)
    }
}

#Preview {
    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
        DashboardTileCard(icon: "drop.fill", title: "Hydration", subtitle: "Log water intake", color: .blue)
        DashboardTileCard(icon: "timer", title: "Fasting", subtitle: "Track window", color: .orange)
        DashboardTileCard(icon: "sparkles", title: "AI Coach", subtitle: "Ask anything", color: .purple, badge: "New")
        DashboardTileCard(icon: "brain.head.profile", title: "Health Chat", subtitle: "Chat with AI", color: .indigo)
    }
    .padding()
    .background(Color(.systemGroupedBackground))
}
