import SwiftUI

/// Premium tile card with color tint for dashboard feature grids
struct DashboardTileCard: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var color: Color = .accentColor
    var badge: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                // Colored icon
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(color)

                Spacer()

                if let badge = badge {
                    Text(badge)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(
                            LinearGradient(
                                colors: [color, color.opacity(0.7)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(Capsule())
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white.opacity(0.9))
                    .lineLimit(1)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.4))
                        .lineLimit(2)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .premiumCard(cornerRadius: 18, tint: color, tintOpacity: 0.05)
    }
}

#Preview {
    ZStack {
        PremiumBackgroundView()
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            DashboardTileCard(icon: "drop.fill", title: "Hydration", subtitle: "Log water intake", color: .blue)
            DashboardTileCard(icon: "timer", title: "Fasting", subtitle: "Track window", color: .orange)
            DashboardTileCard(icon: "sparkles", title: "AI Coach", subtitle: "Ask anything", color: .purple, badge: "AI")
            DashboardTileCard(icon: "brain.head.profile", title: "Health Chat", subtitle: "Chat with AI", color: .indigo)
        }
        .padding()
    }
    .preferredColorScheme(.dark)
}
