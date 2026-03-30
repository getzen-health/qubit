import SwiftUI

// MARK: - Premium Card System

/// Dark elevated card with subtle color tint and gradient border
struct PremiumCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 22
    var tint: Color = .white
    var tintOpacity: Double = 0.04
    var borderGradient: Bool = false

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color.cardSurface)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .fill(tint.opacity(tintOpacity))
                    )
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(
                        borderGradient
                            ? AnyShapeStyle(LinearGradient(
                                colors: [tint.opacity(0.3), tint.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            : AnyShapeStyle(Color.white.opacity(0.08)),
                        lineWidth: borderGradient ? 1 : 0.5
                    )
            )
            .shadow(color: .black.opacity(0.5), radius: 20, x: 0, y: 10)
    }
}

/// Glass-style card (kept for metric sections)
struct GlassCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 20
    var borderOpacity: Double = 0.08
    var shadowRadius: CGFloat = 16
    var shadowY: CGFloat = 8

    func body(content: Content) -> some View {
        content
            .background(Color.cardSurface)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(Color.white.opacity(borderOpacity), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.4), radius: shadowRadius, x: 0, y: shadowY)
    }
}

extension View {
    func premiumCard(
        cornerRadius: CGFloat = 22,
        tint: Color = .white,
        tintOpacity: Double = 0.04,
        gradientBorder: Bool = false
    ) -> some View {
        modifier(PremiumCardModifier(
            cornerRadius: cornerRadius,
            tint: tint,
            tintOpacity: tintOpacity,
            borderGradient: gradientBorder
        ))
    }

    func glassCard(
        cornerRadius: CGFloat = 20,
        borderOpacity: Double = 0.08,
        shadowRadius: CGFloat = 16,
        shadowY: CGFloat = 8
    ) -> some View {
        modifier(GlassCardModifier(
            cornerRadius: cornerRadius,
            borderOpacity: borderOpacity,
            shadowRadius: shadowRadius,
            shadowY: shadowY
        ))
    }
}

// MARK: - Premium Colors

extension Color {
    /// Deep black canvas
    static let premiumBackground = Color(red: 0.05, green: 0.05, blue: 0.07)

    /// Card surface — slightly lighter than background
    static let cardSurface = Color(red: 0.10, green: 0.10, blue: 0.13)

    /// Elevated surface
    static let premiumSurface = Color(red: 0.13, green: 0.13, blue: 0.16)

    /// Subtle divider
    static let premiumDivider = Color.white.opacity(0.06)
}

// MARK: - Glow Effect

struct GlowModifier: ViewModifier {
    let color: Color
    var radius: CGFloat = 30
    var intensity: Double = 0.5

    func body(content: Content) -> some View {
        content
            .shadow(color: color.opacity(intensity), radius: radius, x: 0, y: 0)
            .shadow(color: color.opacity(intensity * 0.4), radius: radius * 0.5, x: 0, y: 0)
    }
}

extension View {
    func glow(color: Color, radius: CGFloat = 30, intensity: Double = 0.5) -> some View {
        modifier(GlowModifier(color: color, radius: radius, intensity: intensity))
    }
}

// MARK: - Gradient Accent Bar

struct AccentBar: View {
    let color: Color
    var height: CGFloat = 3

    var body: some View {
        LinearGradient(
            colors: [color, color.opacity(0.3)],
            startPoint: .leading,
            endPoint: .trailing
        )
        .frame(height: height)
        .clipShape(Capsule())
    }
}

// MARK: - Premium Background View

struct PremiumBackgroundView: View {
    var body: some View {
        ZStack {
            Color.premiumBackground
            // Subtle radial gradient for depth
            RadialGradient(
                colors: [
                    Color(red: 0.08, green: 0.06, blue: 0.18).opacity(0.5),
                    Color.clear
                ],
                center: .top,
                startRadius: 50,
                endRadius: 500
            )
        }
        .ignoresSafeArea()
    }
}

// MARK: - Premium List Wrapper

/// Wraps a List-based view in premium dark styling automatically.
/// Use this on existing List views to upgrade them without rewriting to ScrollView.
struct PremiumListModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .scrollContentBackground(.hidden)
            .background(PremiumBackgroundView())
            .preferredColorScheme(.dark)
            .toolbarColorScheme(.dark, for: .navigationBar)
    }
}

/// Premium Section header for use inside ScrollView-based premium views.
struct PremiumSectionHeader: View {
    let title: String
    let icon: String
    var tint: Color = .cyan

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(tint.opacity(0.5))
            Text(title)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(0.5))
                .textCase(.uppercase)
                .tracking(0.8)
        }
        .padding(.leading, 4)
    }
}

extension View {
    /// Quickly upgrade any List-based view to premium dark styling
    func premiumList() -> some View {
        modifier(PremiumListModifier())
    }
}

#Preview {
    ZStack {
        PremiumBackgroundView()

        VStack(spacing: 16) {
            Text("Premium Card")
                .font(.headline)
                .foregroundStyle(.white)
                .padding(24)
                .frame(maxWidth: .infinity)
                .premiumCard(tint: .blue, gradientBorder: true)

            Text("Glass Card")
                .font(.headline)
                .foregroundStyle(.white)
                .padding(24)
                .frame(maxWidth: .infinity)
                .glassCard()

            Circle()
                .fill(Color.recovery)
                .frame(width: 60, height: 60)
                .glow(color: .recovery)
        }
        .padding()
    }
    .preferredColorScheme(.dark)
}
