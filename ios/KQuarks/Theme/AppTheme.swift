import SwiftUI

/// App-wide theme configuration and styling
struct AppTheme {
    // MARK: - Spacing

    struct Spacing {
        /// Extra small spacing (4pt)
        static let xs: CGFloat = 4
        /// Small spacing (8pt)
        static let sm: CGFloat = 8
        /// Medium spacing (12pt)
        static let md: CGFloat = 12
        /// Large spacing (16pt)
        static let lg: CGFloat = 16
        /// Extra large spacing (24pt)
        static let xl: CGFloat = 24
        /// Double extra large spacing (32pt)
        static let xxl: CGFloat = 32
        /// Section padding
        static let section: CGFloat = 24
        /// Card padding
        static let card: CGFloat = 16
    }

    // MARK: - Corner Radius

    struct Radius {
        /// Small radius (6pt)
        static let sm: CGFloat = 6
        /// Medium radius (8pt)
        static let md: CGFloat = 8
        /// Large radius (12pt)
        static let lg: CGFloat = 12
        /// Extra large radius (16pt)
        static let xl: CGFloat = 16
        /// Full radius (capsule)
        static let full: CGFloat = 9999
    }

    // MARK: - Typography

    struct Typography {
        /// Large title
        static let largeTitle: Font = .largeTitle.weight(.bold)
        /// Title 1
        static let title1: Font = .title.weight(.bold)
        /// Title 2
        static let title2: Font = .title2.weight(.semibold)
        /// Title 3
        static let title3: Font = .title3.weight(.semibold)
        /// Headline
        static let headline: Font = .headline
        /// Body
        static let body: Font = .body
        /// Callout
        static let callout: Font = .callout
        /// Subheadline
        static let subheadline: Font = .subheadline
        /// Footnote
        static let footnote: Font = .footnote
        /// Caption 1
        static let caption1: Font = .caption
        /// Caption 2
        static let caption2: Font = .caption2

        /// Metric value - large bold number
        static let metricValue: Font = .system(size: 34, weight: .bold, design: .rounded)
        /// Metric value medium
        static let metricValueMedium: Font = .system(size: 24, weight: .bold, design: .rounded)
        /// Metric value small
        static let metricValueSmall: Font = .system(size: 18, weight: .semibold, design: .rounded)
        /// Metric label
        static let metricLabel: Font = .subheadline.weight(.medium)
        /// Metric unit
        static let metricUnit: Font = .caption.weight(.medium)
    }

    // MARK: - Shadows

    struct Shadow {
        /// Small shadow
        static func sm(for scheme: ColorScheme) -> some View {
            scheme == .dark
                ? AnyView(Color.black.opacity(0.3).blur(radius: 2))
                : AnyView(Color.black.opacity(0.05).blur(radius: 2))
        }

        /// Medium shadow
        static func md(for scheme: ColorScheme) -> some View {
            scheme == .dark
                ? AnyView(Color.black.opacity(0.4).blur(radius: 4))
                : AnyView(Color.black.opacity(0.1).blur(radius: 4))
        }
    }

    // MARK: - Animation

    struct Animation {
        /// Standard animation
        static let standard = SwiftUI.Animation.spring(response: 0.3, dampingFraction: 0.7)
        /// Fast animation
        static let fast = SwiftUI.Animation.spring(response: 0.2, dampingFraction: 0.8)
        /// Slow animation
        static let slow = SwiftUI.Animation.spring(response: 0.4, dampingFraction: 0.7)
        /// Bounce animation
        static let bounce = SwiftUI.Animation.spring(response: 0.35, dampingFraction: 0.6)
    }
}

// MARK: - View Modifiers

/// Standard card style modifier
struct CardStyle: ViewModifier {
    @Environment(\.colorScheme) var colorScheme

    func body(content: Content) -> some View {
        content
            .padding(AppTheme.Spacing.card)
            .background(Color.surfaceSecondary)
            .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.lg))
    }
}

/// Subtle border style modifier
struct BorderStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.lg)
                    .stroke(Color.borderDefault.opacity(0.5), lineWidth: 1)
            )
    }
}

/// Metric row style modifier
struct MetricRowStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, AppTheme.Spacing.lg)
            .padding(.vertical, AppTheme.Spacing.md)
            .background(Color.surfacePrimary)
    }
}

extension View {
    /// Apply standard card styling
    func cardStyle() -> some View {
        modifier(CardStyle())
    }

    /// Apply subtle border
    func borderStyle() -> some View {
        modifier(BorderStyle())
    }

    /// Apply metric row styling
    func metricRowStyle() -> some View {
        modifier(MetricRowStyle())
    }
}
