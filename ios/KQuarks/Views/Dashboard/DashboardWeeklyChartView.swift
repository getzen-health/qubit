import SwiftUI
import Charts

struct DashboardWeeklyChartView: View {
    let weekData: [DaySummaryForAI]
    let stepGoal: Double

    private var chartData: [(label: String, steps: Int, isToday: Bool)] {
        weekData.enumerated().map { i, day in
            let date = ISO8601DateFormatter().date(from: day.date) ?? Date()
            let label = date.formatted(.dateTime.weekday(.abbreviated))
            return (label: label, steps: day.steps, isToday: i == 0)
        }.reversed()
    }

    private var maxSteps: Int {
        max(weekData.map(\.steps).max() ?? 0, Int(stepGoal))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("7-Day Steps")
                    .font(.headline)
                Spacer()
                if let avg = weeklyAvg {
                    Text("Avg \(avg.formatted())")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Chart {
                ForEach(chartData, id: \.label) { item in
                    BarMark(
                        x: .value("Day", item.label),
                        y: .value("Steps", item.steps)
                    )
                    .foregroundStyle(item.isToday ? Color.activity : Color.activity.opacity(0.5))
                    .cornerRadius(4)
                }

                RuleMark(y: .value("Goal", stepGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.secondary.opacity(0.5))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Goal")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
            }
            .frame(height: 120)
            .chartYScale(domain: 0...Double(maxSteps) * 1.15)
            .chartYAxis(.hidden)
            .chartXAxis {
                AxisMarks { _ in
                    AxisValueLabel()
                        .font(.caption2)
                }
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var weeklyAvg: Int? {
        let completeDays = weekData.dropFirst().filter { $0.steps > 0 }
        guard !completeDays.isEmpty else { return nil }
        return completeDays.reduce(0) { $0 + $1.steps } / completeDays.count
    }
}
