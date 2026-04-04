import SwiftUI

/// AI Essence — Premium hero card with gradient background and dramatic glowing rings
struct AIEssenceView: View {
    let recoveryScore: Int
    let strainScore: Double
    let primaryInsight: String
    var secondaryInsight: String? = nil
    var recoveryTrend: Int? = nil
    var strainTrend: Int? = nil

    var recoveryLevel: RecoveryLevel { RecoveryLevel.from(score: recoveryScore) }
    var strainLevel: StrainLevel { StrainLevel.from(score: strainScore) }

    var body: some View {
        VStack(spacing: 24) {
            // Score rings
            HStack(spacing: 32) {
                ScoreRing(
                    label: "RECOVERY",
                    value: "\(recoveryScore)%",
                    sublabel: LocalizedStringKey(recoveryLevel.label),
                    trend: recoveryTrend,
                    color: recoveryLevel.color,
                    progress: Double(recoveryScore) / 100
                )

                // Divider line
                Rectangle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 1, height: 80)

                ScoreRing(
                    label: "STRAIN",
                    value: String(format: "%.1f", strainScore),
                    sublabel: LocalizedStringKey(strainLevel.label),
                    trend: strainTrend,
                    color: strainLevel.color,
                    progress: strainScore / 21
                )
            }
            .padding(.top, 8)

            // AI Insight strip
            HStack(spacing: 10) {
                // Gradient accent dot
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.purple, .blue],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 8, height: 8)

                VStack(alignment: .leading, spacing: 3) {
                    Text(primaryInsight)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.white.opacity(0.9))
                        .lineLimit(2)

                    if let secondary = secondaryInsight {
                        Text(secondary)
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.45))
                            .lineLimit(1)
                    }
                }

                Spacer(minLength: 0)

                Image(systemName: "sparkles")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.purple, .cyan],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
            }
            .padding(14)
            .background(Color.white.opacity(0.04))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .padding(22)
        .background(
            ZStack {
                // Deep gradient background
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.10, green: 0.08, blue: 0.22),
                                Color(red: 0.08, green: 0.10, blue: 0.18),
                                Color.cardSurface
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.15),
                            Color.white.opacity(0.03)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .shadow(color: Color(red: 0.15, green: 0.10, blue: 0.35).opacity(0.5), radius: 30, x: 0, y: 12)
    }
}

/// Glowing score ring with bold number
struct ScoreRing: View {
    let label: LocalizedStringKey
    let value: String
    let sublabel: LocalizedStringKey
    var trend: Int? = nil
    let color: Color
    let progress: Double

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                // Track
                Circle()
                    .stroke(color.opacity(0.10), lineWidth: 8)

                // Progress arc
                Circle()
                    .trim(from: 0, to: min(progress, 1.0))
                    .stroke(
                        LinearGradient(
                            colors: [color, color.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.8, dampingFraction: 0.7), value: progress)

                // Score value
                Text(value)
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
            }
            .frame(width: 88, height: 88)
            .background(
                Circle()
                    .fill(color.opacity(0.15))
                    .blur(radius: 18)
            )

            VStack(spacing: 3) {
                Text(label)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.45))
                    .kerning(1.2)

                HStack(spacing: 4) {
                    Text(sublabel)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(color)

                    if let trend = trend {
                        HStack(spacing: 1) {
                            Image(systemName: trend > 0 ? "arrow.up" : trend < 0 ? "arrow.down" : "minus")
                                .font(.system(size: 7, weight: .bold))
                            Text("\(abs(trend))%")
                                .font(.system(size: 9, weight: .semibold))
                        }
                        .foregroundStyle(trend > 0 ? Color.recovery : trend < 0 ? Color.error : .secondary)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Level Enums

enum RecoveryLevel {
    case optimal, moderate, low

    var label: String {
        switch self {
        case .optimal: "Optimal"
        case .moderate: "Moderate"
        case .low: "Low"
        }
    }

    var color: Color {
        switch self {
        case .optimal: .recovery
        case .moderate: .warning
        case .low: .error
        }
    }

    static func from(score: Int) -> RecoveryLevel {
        if score >= 67 { return .optimal }
        if score >= 34 { return .moderate }
        return .low
    }
}

enum StrainLevel {
    case allOut, high, moderate, light

    var label: String {
        switch self {
        case .allOut: "All Out"
        case .high: "High"
        case .moderate: "Moderate"
        case .light: "Light"
        }
    }

    var color: Color {
        switch self {
        case .allOut: .strain
        case .high: .strain
        case .moderate: .activity
        case .light: Color(hue: 0.52, saturation: 0.60, brightness: 0.85)
        }
    }

    static func from(score: Double) -> StrainLevel {
        if score >= 18 { return .allOut }
        if score >= 14 { return .high }
        if score >= 10 { return .moderate }
        return .light
    }
}

#Preview {
    ZStack {
        PremiumBackgroundView()
        AIEssenceView(
            recoveryScore: 78,
            strainScore: 14.2,
            primaryInsight: "Your recovery is excellent. Today is ideal for high-intensity training.",
            secondaryInsight: "HRV trending up 12% this week",
            recoveryTrend: 5,
            strainTrend: -8
        )
        .padding()
    }
    .preferredColorScheme(.dark)
}
