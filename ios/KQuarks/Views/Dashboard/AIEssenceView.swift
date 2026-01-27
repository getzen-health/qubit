import SwiftUI

/// AI Essence - Prominent AI summary header showing recovery, strain, and key insight
struct AIEssenceView: View {
    let recoveryScore: Int
    let strainScore: Double
    let primaryInsight: String
    var secondaryInsight: String? = nil
    var recoveryTrend: Int? = nil
    var strainTrend: Int? = nil

    var recoveryLevel: RecoveryLevel {
        RecoveryLevel.from(score: recoveryScore)
    }

    var strainLevel: StrainLevel {
        StrainLevel.from(score: strainScore)
    }

    var body: some View {
        VStack(spacing: 16) {
            // Score badges
            HStack(spacing: 16) {
                ScoreBadge(
                    label: "Recovery",
                    value: "\(recoveryScore)%",
                    sublabel: recoveryLevel.label,
                    trend: recoveryTrend,
                    color: recoveryLevel.color,
                    progress: Double(recoveryScore) / 100
                )

                ScoreBadge(
                    label: "Strain",
                    value: String(format: "%.1f", strainScore),
                    sublabel: strainLevel.label,
                    trend: strainTrend,
                    color: strainLevel.color,
                    progress: strainScore / 21
                )
            }

            // AI Insight
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.caption)
                        .foregroundStyle(.accent)
                    Text("AI Insight")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)
                }

                Text(primaryInsight)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .lineLimit(2)

                if let secondary = secondaryInsight {
                    Text(secondary)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(Color.accent.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }
}

/// Individual score badge with ring progress
struct ScoreBadge: View {
    let label: String
    let value: String
    let sublabel: String
    var trend: Int? = nil
    let color: Color
    let progress: Double

    var body: some View {
        VStack(spacing: 8) {
            // Ring with value
            ZStack {
                Circle()
                    .stroke(color.opacity(0.2), lineWidth: 8)

                Circle()
                    .trim(from: 0, to: min(progress, 1.0))
                    .stroke(color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.5), value: progress)

                VStack(spacing: 2) {
                    Text(value)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(color)
                }
            }
            .frame(width: 72, height: 72)

            // Label and trend
            VStack(spacing: 4) {
                Text(label)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)

                HStack(spacing: 4) {
                    Text(sublabel)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundStyle(color)

                    if let trend = trend {
                        HStack(spacing: 1) {
                            Image(systemName: trend > 0 ? "arrow.up" : trend < 0 ? "arrow.down" : "minus")
                                .font(.system(size: 8, weight: .bold))
                            Text("\(abs(trend))%")
                                .font(.system(size: 9, weight: .medium))
                        }
                        .foregroundStyle(trend > 0 ? Color.recovery : trend < 0 ? Color.error : .secondary)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

/// Recovery level classification
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

/// Strain level classification
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
        case .light: .secondary
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
    VStack {
        AIEssenceView(
            recoveryScore: 78,
            strainScore: 14.2,
            primaryInsight: "Your recovery is excellent. Today is ideal for high-intensity training.",
            secondaryInsight: "HRV trending up 12% this week - a positive adaptation sign.",
            recoveryTrend: 5,
            strainTrend: -8
        )
        .padding()

        Spacer()
    }
    .background(Color(.systemGroupedBackground))
}
