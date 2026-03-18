import SwiftUI
import Charts

// MARK: - SleepDebtView

/// Shows cumulative sleep debt vs target (8h/night) over the last 28 days.
struct SleepDebtView: View {
    private let targetHours: Double = 8.0

    @State private var nights: [SleepNight] = []
    @State private var isLoading = false

    private var cumulativeDebt: Double {
        nights.reduce(0) { $0 + $1.deficit }
    }

    private var avgSleep: Double? {
        let valid = nights.filter { $0.hours > 0 }
        guard !valid.isEmpty else { return nil }
        return valid.map(\.hours).reduce(0, +) / Double(valid.count)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if nights.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    debtChart
                    adviceCard
                    historyList
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Sleep Debt")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 16) {
            HStack(spacing: 24) {
                VStack(spacing: 4) {
                    Text(formatDebt(abs(cumulativeDebt)))
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundStyle(cumulativeDebt > 0 ? .red : .green)
                    Text(cumulativeDebt > 0 ? "hours in debt" : "hours surplus")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Divider().frame(height: 50)

                VStack(spacing: 4) {
                    if let avg = avgSleep {
                        Text(String(format: "%.1fh", avg))
                            .font(.title2.bold())
                    } else {
                        Text("—")
                            .font(.title2.bold())
                    }
                    Text("avg/night")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Divider().frame(height: 50)

                VStack(spacing: 4) {
                    let good = nights.filter { $0.hours >= targetHours }.count
                    Text("\(good)/\(nights.count)")
                        .font(.title2.bold())
                    Text("at target")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity)

            // Debt progress bar
            let clamped = min(abs(cumulativeDebt) / 20.0, 1.0) // scale 0–20h to 0–1
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6).fill(Color(.systemFill)).frame(height: 12)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(cumulativeDebt > 0 ? Color.red : Color.green)
                        .frame(width: geo.size.width * clamped, height: 12)
                        .animation(.easeInOut(duration: 0.5), value: clamped)
                }
            }
            .frame(height: 12)

            Text(cumulativeDebt > 0
                 ? "You're \(formatDebt(cumulativeDebt)) short of your \(Int(targetHours))h/night goal over the last \(nights.count) days."
                 : "You're meeting your sleep target. Keep it up!")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Debt Chart

    private var debtChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Nightly Surplus / Deficit")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(nights) { night in
                    BarMark(
                        x: .value("Date", night.date, unit: .day),
                        y: .value("Hours", night.deficit * -1) // positive = surplus, negative = deficit
                    )
                    .foregroundStyle(night.deficit > 0 ? Color.red.opacity(0.8) : Color.green.opacity(0.8))
                    .cornerRadius(3)
                }
                RuleMark(y: .value("Target", 0))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.secondary)
            }
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisValueLabel {
                        if let h = value.as(Double.self) {
                            Text(String(format: "%+.0fh", h))
                                .font(.caption2)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { value in
                    AxisValueLabel(format: .dateTime.day().month(.abbreviated))
                }
            }
            .frame(height: 180)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Advice Card

    private var adviceCard: some View {
        let (icon, color, title, body) = adviceContent
        return HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.title3)
                .frame(width: 36, height: 36)
                .background(color.opacity(0.12))
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.bold())
                Text(body)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var adviceContent: (String, Color, String, String) {
        if cumulativeDebt > 15 {
            return ("exclamationmark.triangle.fill", .red, "Significant Sleep Debt",
                    "You've accumulated over 15 hours of sleep debt. Prioritise earlier bedtimes and avoid high-intensity workouts until your debt is reduced.")
        } else if cumulativeDebt > 8 {
            return ("moon.zzz.fill", .orange, "Moderate Sleep Debt",
                    "Consider adding 30–60 extra minutes of sleep per night to gradually repay your debt. Consistent sleep schedules help more than occasional long sleeps.")
        } else if cumulativeDebt > 2 {
            return ("moon.fill", .yellow, "Mild Sleep Debt",
                    "You're slightly behind on sleep. A few early nights will bring you back to baseline quickly.")
        } else if cumulativeDebt <= 0 {
            return ("checkmark.circle.fill", .green, "Well Rested",
                    "You're meeting your sleep target. Consistent sleep is one of the most powerful levers for health and performance.")
        } else {
            return ("moon.fill", .teal, "On Track",
                    "Your sleep is close to target. Keep maintaining a consistent bedtime routine.")
        }
    }

    // MARK: - History List

    private var historyList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Nightly Log")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(Array(nights.enumerated()), id: \.offset) { idx, night in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(night.date, style: .date)
                                .font(.subheadline)
                            Text(night.hours > 0 ? fmtH(night.hours) : "No data")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if night.hours > 0 {
                            Text(night.deficit > 0
                                 ? String(format: "−%.1fh", night.deficit)
                                 : String(format: "+%.1fh", abs(night.deficit)))
                                .font(.caption.bold())
                                .foregroundStyle(night.deficit > 0 ? .red : .green)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)

                    if idx < nights.count - 1 {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "moon.zzz")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Sleep Data")
                .font(.title3.bold())
            Text("Sync sleep data from Apple Health to see your sleep debt tracker.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let rows = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 28) else { return }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"

        nights = rows.sorted { $0.date > $1.date }.compactMap { row in
            guard let date = df.date(from: row.date) else { return nil }
            let hours = row.sleepHours ?? 0
            let deficit = targetHours - hours  // positive = debt, negative = surplus
            return SleepNight(date: date, hours: hours, deficit: hours > 0 ? deficit : 0)
        }
    }

    // MARK: - Helpers

    private func formatDebt(_ h: Double) -> String {
        let hours = Int(h)
        let mins = Int((h - Double(hours)) * 60)
        if hours == 0 { return "\(mins)m" }
        return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
    }

    private func fmtH(_ h: Double) -> String {
        let hours = Int(h)
        let mins = Int((h - Double(hours)) * 60)
        return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
    }
}

// MARK: - Model

struct SleepNight: Identifiable {
    var id: Date { date }
    let date: Date
    let hours: Double
    let deficit: Double  // positive = behind target, negative = surplus
}

#Preview {
    NavigationStack {
        SleepDebtView()
    }
}
