import SwiftUI

/// Quick stats grid — 2-column color-tinted premium cards
struct QuickStatsView: View {
    let stats: [QuickStat]

    var body: some View {
        LazyVGrid(
            columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
            spacing: 12
        ) {
            ForEach(stats) { stat in
                QuickStatCard(stat: stat)
            }
        }
    }
}

/// Individual stat card with color tint and accent bar
struct QuickStatCard: View {
    let stat: QuickStat

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Top row: icon + trend
            HStack {
                Image(systemName: stat.icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(stat.color)

                Spacer()

                if let trend = stat.trend {
                    HStack(spacing: 2) {
                        Image(systemName: trend > 0 ? "arrow.up.right" : trend < 0 ? "arrow.down.right" : "minus")
                            .font(.system(size: 9, weight: .bold))
                        Text("\(abs(trend))%")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundStyle(trend > 0 ? Color.recovery : trend < 0 ? Color.error : .secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(
                        (trend > 0 ? Color.recovery : trend < 0 ? Color.error : Color.secondary)
                            .opacity(0.12)
                    )
                    .clipShape(Capsule())
                }
            }

            // Value
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(stat.value)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)

                if let unit = stat.unit {
                    Text(LocalizedStringKey(unit))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.4))
                }
            }

            // Label
            Text(LocalizedStringKey(stat.label))
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .premiumCard(tint: stat.color, tintOpacity: 0.10, gradientBorder: false)
    }
}

/// Quick stat model
struct QuickStat: Identifiable {
    let id = UUID()
    let label: String
    let value: String
    var unit: String? = nil
    var trend: Int? = nil
    var color: Color = .primary
    var icon: String = "bolt.fill"
}

#Preview {
    ZStack {
        PremiumBackgroundView()
        QuickStatsView(
            stats: [
                QuickStat(label: "Steps", value: "8,432", trend: 12, color: .activity, icon: "figure.walk"),
                QuickStat(label: "Calories", value: "423", unit: "kcal", color: .strain, icon: "flame.fill"),
                QuickStat(label: "Sleep", value: "7h 42m", color: .sleep, icon: "moon.fill"),
                QuickStat(label: "HRV", value: "52", unit: "ms", trend: 8, color: .heart, icon: "waveform.path.ecg"),
            ]
        )
        .padding()
    }
    .preferredColorScheme(.dark)
}
