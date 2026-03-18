import SwiftUI

// MARK: - ActivityHeatmapView

/// GitHub-style contribution calendar showing daily step intensity over the past year.
struct ActivityHeatmapView: View {
    @State private var dayData: [String: Int] = [:]  // "yyyy-MM-dd" -> steps
    @State private var isLoading = false
    @State private var selectedDay: SelectedDay?

    private let stepGoal: Int = 10_000
    private let columns = 53  // ~52 complete weeks + partial

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else {
                    legendRow
                    heatmapGrid
                    statsCard
                    if let sel = selectedDay {
                        selectedDayCard(sel)
                    }
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Activity Calendar")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Legend

    private var legendRow: some View {
        HStack(spacing: 6) {
            Text("Less")
                .font(.caption2)
                .foregroundStyle(.secondary)
            ForEach(0..<5, id: \.self) { level in
                RoundedRectangle(cornerRadius: 3)
                    .fill(color(for: level))
                    .frame(width: 14, height: 14)
            }
            Text("More")
                .font(.caption2)
                .foregroundStyle(.secondary)
            Spacer()
            Text("Goal: \(stepGoal.formatted()) steps")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Heatmap Grid

    private var heatmapGrid: some View {
        let weeks = buildWeeks()
        return VStack(alignment: .leading, spacing: 4) {
            ScrollView(.horizontal, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 4) {
                    // Month labels
                    HStack(alignment: .top, spacing: 0) {
                        ForEach(Array(weeks.enumerated()), id: \.offset) { idx, week in
                            if let first = week.first, shouldShowMonth(idx, weeks: weeks) {
                                Text(monthLabel(for: first.date))
                                    .font(.system(size: 9))
                                    .foregroundStyle(.secondary)
                                    .frame(width: cellWidth, alignment: .leading)
                            } else {
                                Color.clear.frame(width: cellWidth)
                            }
                        }
                    }

                    // Grid
                    HStack(alignment: .top, spacing: 3) {
                        ForEach(Array(weeks.enumerated()), id: \.offset) { _, week in
                            VStack(spacing: 3) {
                                ForEach(week) { day in
                                    cellView(day)
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private let cellWidth: CGFloat = 14
    private let cellHeight: CGFloat = 14

    private func cellView(_ day: HeatmapDay) -> some View {
        let steps = dayData[day.dateStr] ?? 0
        let level = intensityLevel(steps: steps, hasData: dayData[day.dateStr] != nil)
        return RoundedRectangle(cornerRadius: 3)
            .fill(color(for: level))
            .frame(width: cellWidth, height: cellHeight)
            .onTapGesture {
                selectedDay = SelectedDay(date: day.date, dateStr: day.dateStr, steps: steps)
            }
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        let totalDays = dayData.count
        let activeDays = dayData.values.filter { $0 >= 1000 }.count
        let goalDays = dayData.values.filter { $0 >= stepGoal }.count
        let totalSteps = dayData.values.reduce(0, +)
        let bestDay = dayData.max(by: { $0.value < $1.value })

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Active Days", value: "\(activeDays)")
                Divider().frame(height: 40)
                statBubble(label: "Goal Days", value: "\(goalDays)")
                Divider().frame(height: 40)
                statBubble(label: "Total Steps", value: totalSteps.formatted())
            }
            if let best = bestDay {
                Divider()
                HStack {
                    Image(systemName: "trophy.fill")
                        .foregroundStyle(.yellow)
                        .font(.caption)
                    Text("Best day: \(best.value.formatted()) steps")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    if let date = dateFrom(best.key) {
                        Text(date, style: .date)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statBubble(label: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Selected Day Card

    private func selectedDayCard(_ sel: SelectedDay) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "figure.walk")
                .foregroundStyle(.green)
                .frame(width: 36, height: 36)
                .background(Color.green.opacity(0.12))
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(sel.date, style: .date)
                    .font(.subheadline.weight(.medium))
                if sel.steps > 0 {
                    Text("\(sel.steps.formatted()) steps · \(Int(Double(sel.steps) / Double(stepGoal) * 100))% of goal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Text("No data synced")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            Button {
                selectedDay = nil
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let rows = try? await SupabaseService.shared.fetchAllDailySummaries(days: 365) else { return }
        var data: [String: Int] = [:]
        for row in rows {
            data[row.date] = row.steps
        }
        dayData = data
    }

    // MARK: - Grid Builder

    private func buildWeeks() -> [[HeatmapDay]] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        // Start from 364 days ago, aligned to Sunday (or Monday depending on locale)
        let startOffset = -364
        guard let start = cal.date(byAdding: .day, value: startOffset, to: today) else { return [] }

        // Align start to beginning of week
        let weekday = cal.component(.weekday, from: start) - 1 // 0 = Sunday
        guard let alignedStart = cal.date(byAdding: .day, value: -weekday, to: start) else { return [] }

        var weeks: [[HeatmapDay]] = []
        var current = alignedStart

        while current <= today {
            var week: [HeatmapDay] = []
            for _ in 0..<7 {
                if current <= today {
                    week.append(HeatmapDay(date: current))
                }
                current = cal.date(byAdding: .day, value: 1, to: current)!
            }
            if !week.isEmpty { weeks.append(week) }
        }

        return weeks
    }

    private func shouldShowMonth(_ weekIdx: Int, weeks: [[HeatmapDay]]) -> Bool {
        guard let first = weeks[weekIdx].first else { return false }
        let day = Calendar.current.component(.day, from: first.date)
        return day <= 7
    }

    private func monthLabel(for date: Date) -> String {
        let df = DateFormatter()
        df.dateFormat = "MMM"
        return df.string(from: date)
    }

    // MARK: - Color / Level

    private func intensityLevel(steps: Int, hasData: Bool) -> Int {
        guard hasData && steps > 0 else { return 0 }
        let pct = Double(steps) / Double(stepGoal)
        if pct >= 1.5 { return 4 }
        if pct >= 1.0 { return 3 }
        if pct >= 0.5 { return 2 }
        return 1
    }

    private func color(for level: Int) -> Color {
        switch level {
        case 0: return Color(.systemFill)
        case 1: return Color.green.opacity(0.25)
        case 2: return Color.green.opacity(0.5)
        case 3: return Color.green.opacity(0.75)
        case 4: return Color.green
        default: return Color(.systemFill)
        }
    }

    private func dateFrom(_ str: String) -> Date? {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        return df.date(from: str)
    }
}

// MARK: - Models

private struct HeatmapDay: Identifiable {
    let id: Date
    let date: Date
    let dateStr: String

    init(date: Date) {
        self.date = date
        self.id = date
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        self.dateStr = df.string(from: date)
    }
}

struct SelectedDay {
    let date: Date
    let dateStr: String
    let steps: Int
}

#Preview {
    NavigationStack {
        ActivityHeatmapView()
    }
}
