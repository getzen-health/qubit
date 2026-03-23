import SwiftUI
import Charts

// MARK: - MoodHistoryView

struct MoodHistoryView: View {
    @State private var checkins: [DailyCheckin] = []
    @State private var isLoading = false

    private let energyEmojis = ["", "😴", "😑", "😐", "🙂", "😄"]
    private let moodEmojis   = ["", "😞", "😕", "😐", "🙂", "😁"]
    private let stressEmojis = ["", "😌", "🙂", "😐", "😟", "😰"]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView().padding(.top, 40)
                } else if checkins.isEmpty {
                    emptyState
                } else {
                    averagesCard
                    trendChart
                    historyList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Mood History")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Averages

    private var averagesCard: some View {
        HStack(spacing: 0) {
            averageBubble(
                label: "Energy",
                average: average(\.energy),
                emojis: energyEmojis,
                color: .yellow
            )
            Divider().frame(height: 50)
            averageBubble(
                label: "Mood",
                average: average(\.mood),
                emojis: moodEmojis,
                color: .blue
            )
            Divider().frame(height: 50)
            averageBubble(
                label: "Stress",
                average: average(\.stress),
                emojis: stressEmojis,
                color: .orange
            )
        }
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func averageBubble(label: String, average: Double?, emojis: [String], color: Color) -> some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            if let avg = average {
                let idx = min(max(Int(avg.rounded()), 1), 5)
                Text(emojis[idx])
                    .font(.title2)
                Text(String(format: "%.1f", avg))
                    .font(.caption.bold())
                    .foregroundStyle(color)
            } else {
                Text("—")
                    .font(.title2)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
    }

    // MARK: - Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Last 14 Days")
                .font(.headline)

            Chart {
                ForEach(checkins.reversed()) { checkin in
                    if let date = parsedDate(checkin.date) {
                        if let energy = checkin.energy {
                            LineMark(
                                x: .value("Date", date),
                                y: .value("Score", Double(energy))
                            )
                            .foregroundStyle(.yellow)
                            .symbol(.circle)
                            .symbolSize(24)
                            .lineStyle(StrokeStyle(lineWidth: 2))
                        }
                        if let mood = checkin.mood {
                            LineMark(
                                x: .value("Date", date),
                                y: .value("Score", Double(mood))
                            )
                            .foregroundStyle(.blue)
                            .symbol(.circle)
                            .symbolSize(24)
                            .lineStyle(StrokeStyle(lineWidth: 2))
                        }
                        if let stress = checkin.stress {
                            LineMark(
                                x: .value("Date", date),
                                y: .value("Score", Double(stress))
                            )
                            .foregroundStyle(.orange)
                            .symbol(.circle)
                            .symbolSize(24)
                            .lineStyle(StrokeStyle(lineWidth: 2, dash: [4]))
                        }
                    }
                }
            }
            .chartYScale(domain: 1...5)
            .chartYAxis {
                AxisMarks(values: [1, 2, 3, 4, 5]) { v in
                    AxisGridLine()
                    AxisValueLabel {
                        if let val = v.as(Int.self) {
                            Text("\(val)")
                                .font(.caption2)
                        }
                    }
                }
            }
            .frame(height: 180)

            HStack(spacing: 16) {
                LegendDot(color: .yellow, label: "Energy")
                LegendDot(color: .blue, label: "Mood")
                LegendDot(color: .orange, label: "Stress")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - History List

    private var historyList: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Recent")
                .font(.headline)
                .padding(.horizontal)
                .padding(.bottom, 8)

            VStack(spacing: 0) {
                ForEach(Array(checkins.enumerated()), id: \.offset) { idx, c in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(formattedDate(c.date))
                                .font(.subheadline.weight(.medium))
                            Spacer()
                            HStack(spacing: 4) {
                                if let e = c.energy  { Text(energyEmojis[e]) }
                                if let m = c.mood    { Text(moodEmojis[m]) }
                                if let s = c.stress  { Text(stressEmojis[s]) }
                            }
                            .font(.body)
                        }
                        if let notes = c.notes, !notes.isEmpty {
                            Text(notes)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                        }
                    }
                    .padding()
                    if idx < checkins.count - 1 {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "face.smiling")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Check-ins Yet")
                .font(.title3.bold())
            Text("Start logging daily check-ins to see your mood and energy trends over time.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func load() async {
        isLoading = true
        checkins = (try? await SupabaseService.shared.fetchRecentCheckins(days: 14)) ?? []
        isLoading = false
    }

    private func average(_ keyPath: KeyPath<DailyCheckin, Int?>) -> Double? {
        let values = checkins.compactMap { $0[keyPath: keyPath] }
        guard !values.isEmpty else { return nil }
        return Double(values.reduce(0, +)) / Double(values.count)
    }

    private func parsedDate(_ dateString: String) -> Date? {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        return df.date(from: dateString)
    }

    private func formattedDate(_ dateString: String) -> String {
        guard let date = parsedDate(dateString) else { return dateString }
        if Calendar.current.isDateInToday(date) { return "Today" }
        if Calendar.current.isDateInYesterday(date) { return "Yesterday" }
        return date.formatted(date: .abbreviated, time: .omitted)
    }
}

private struct LegendDot: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    NavigationStack {
        MoodHistoryView()
    }
}
