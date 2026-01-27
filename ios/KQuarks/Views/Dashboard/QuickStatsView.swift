import SwiftUI

/// Quick stats grid for glanceable metrics
struct QuickStatsView: View {
    let stats: [QuickStat]
    var columns: Int = 4

    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 12), count: min(columns, 4))
    }

    var body: some View {
        LazyVGrid(columns: gridColumns, spacing: 12) {
            ForEach(stats) { stat in
                QuickStatView(stat: stat)
            }
        }
    }
}

/// Individual quick stat item
struct QuickStatView: View {
    let stat: QuickStat

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(stat.label)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)

            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(stat.value)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(stat.color)

                if let unit = stat.unit {
                    Text(unit)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            if let trend = stat.trend {
                HStack(spacing: 2) {
                    Image(systemName: trend > 0 ? "arrow.up" : trend < 0 ? "arrow.down" : "minus")
                        .font(.system(size: 8, weight: .bold))
                    Text("\(abs(trend))%")
                        .font(.caption2)
                        .fontWeight(.medium)
                }
                .foregroundStyle(trend > 0 ? Color.recovery : trend < 0 ? Color.error : .secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
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
}

#Preview {
    VStack {
        QuickStatsView(
            stats: [
                QuickStat(label: "Steps", value: "8,432", trend: 12, color: .activity),
                QuickStat(label: "Calories", value: "423", unit: "cal", color: .strain),
                QuickStat(label: "Sleep", value: "7h 42m", color: .sleep),
                QuickStat(label: "HRV", value: "52", unit: "ms", trend: 8, color: .heart),
            ]
        )
        .padding()
    }
    .background(Color(.systemGroupedBackground))
}
