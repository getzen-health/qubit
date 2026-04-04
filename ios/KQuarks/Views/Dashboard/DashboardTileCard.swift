import SwiftUI

/// Premium tile card — icon in a tinted circle, subtle card with color accent
struct DashboardTileCard: View {
    let icon: String
    let title: LocalizedStringKey
    var subtitle: LocalizedStringKey? = nil
    var color: Color = .accentColor
    var badge: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                // Icon in colored circle
                ZStack {
                    Circle()
                        .fill(color.opacity(0.15))
                        .frame(width: 38, height: 38)
                    Image(systemName: icon)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(color)
                }

                Spacer()

                if let badge = badge {
                    Text(badge)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(color)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(color.opacity(0.15))
                        .clipShape(Capsule())
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.88))
                    .lineLimit(1)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(.white.opacity(0.38))
                        .lineLimit(2)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.cardSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
        )
    }
}

#Preview {
    ZStack {
        PremiumBackgroundView()
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            DashboardTileCard(icon: "drop.fill", title: "Hydration", subtitle: "Log water intake", color: .cyan)
            DashboardTileCard(icon: "timer", title: "Fasting", subtitle: "Track window", color: .orange)
            DashboardTileCard(icon: "sparkles", title: "AI Coach", subtitle: "Ask anything", color: .teal, badge: "AI")
            DashboardTileCard(icon: "brain.head.profile", title: "Health Chat", subtitle: "Chat with AI", color: .mint)
        }
        .padding()
    }
    .preferredColorScheme(.dark)
}
