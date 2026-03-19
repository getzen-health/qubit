import SwiftUI
import Charts
import HealthKit

// MARK: - DaylightExposureView

/// Daily outdoor daylight exposure from iPhone ambient light sensor (iOS 17+).
/// Helps track circadian health — recommended target is 20–30 minutes of bright outdoor light per day.
struct DaylightExposureView: View {
    @State private var days: [DaylightDay] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared
    private let targetMinutes: Double = 20

    private var latest: DaylightDay? { days.last }

    private var sevenDayAvg: Double? {
        let recent = days.suffix(7)
        guard !recent.isEmpty else { return nil }
        return recent.map(\.minutes).reduce(0, +) / Double(recent.count)
    }

    private var goalStreak: Int {
        var streak = 0
        for day in days.reversed() {
            if day.minutes >= targetMinutes { streak += 1 } else { break }
        }
        return streak
    }

    private var daysAtGoal: Int {
        days.filter { $0.minutes >= targetMinutes }.count
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if days.isEmpty {
                    emptyState
                } else {
                    heroCard
                    barChart
                    statsCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Daylight Exposure")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: DaylightPatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
        }
        .task { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let mins = latest?.minutes ?? 0
        let zone = DaylightZone.from(minutes: mins)
        return VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's Daylight")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", mins))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                        Text("min")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    Text(zone.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(zone.color)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    if let avg = sevenDayAvg {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f min", avg))
                                .font(.title3.bold())
                            Text("7-day avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if goalStreak > 0 {
                        VStack(alignment: .trailing, spacing: 2) {
                            HStack(spacing: 4) {
                                Image(systemName: "flame.fill")
                                    .foregroundStyle(.orange)
                                Text("\(goalStreak)")
                                    .font(.subheadline.bold())
                            }
                            Text("day streak")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            // Progress bar toward daily goal
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Daily goal: \(Int(targetMinutes)) min")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(mins >= targetMinutes ? "Goal met!" : "\(Int(max(targetMinutes - mins, 0))) min to go")
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(mins >= targetMinutes ? .green : .secondary)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(.systemFill))
                            .frame(height: 8)
                        RoundedRectangle(cornerRadius: 4)
                            .fill(LinearGradient(colors: [.yellow, .orange], startPoint: .leading, endPoint: .trailing))
                            .frame(width: min(geo.size.width * CGFloat(mins / targetMinutes), geo.size.width), height: 8)
                            .animation(.easeOut(duration: 0.5), value: mins)
                    }
                }
                .frame(height: 8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Bar Chart

    private var barChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day History")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Goal", targetMinutes))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.5))
                    .annotation(position: .topLeading) {
                        Text("Goal")
                            .font(.caption2)
                            .foregroundStyle(.orange.opacity(0.7))
                    }

                ForEach(days) { day in
                    BarMark(
                        x: .value("Date", day.date, unit: .day),
                        y: .value("Minutes", day.minutes)
                    )
                    .foregroundStyle(day.minutes >= targetMinutes
                                     ? LinearGradient(colors: [.yellow, .orange], startPoint: .bottom, endPoint: .top)
                                     : LinearGradient(colors: [.yellow.opacity(0.3), .orange.opacity(0.3)], startPoint: .bottom, endPoint: .top))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    AxisGridLine()
                }
            }
            .chartYAxis {
                AxisMarks { v in
                    AxisValueLabel { if let m = v.as(Double.self) { Text("\(Int(m))m") } }
                    AxisGridLine()
                }
            }
            .frame(height: 200)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        let minutes = days.map(\.minutes)
        let best = minutes.max() ?? 0
        let pctGoal = days.isEmpty ? 0 : Double(daysAtGoal) / Double(days.count) * 100

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Best day", value: "\(Int(best)) min")
                Divider().frame(height: 40)
                statBubble(label: "Days at goal", value: "\(daysAtGoal)")
                Divider().frame(height: 40)
                statBubble(label: "Goal rate", value: String(format: "%.0f%%", pctGoal))
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

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.orange)
                Text("About Daylight Exposure")
                    .font(.subheadline.weight(.semibold))
            }
            Text("Outdoor light exposure measured by your iPhone's ambient light sensor. Getting bright outdoor light — especially in the morning — helps set your circadian rhythm, improves sleep quality, boosts mood, and supports vitamin D production. Apple recommends at least 20 minutes of outdoor time daily. This requires iOS 17 or later.")
                .font(.caption)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 6) {
                Label("Morning light resets circadian rhythm", systemImage: "sunrise.fill")
                    .foregroundStyle(.orange)
                Label("Reduces evening melatonin suppression", systemImage: "moon.fill")
                    .foregroundStyle(.indigo)
                Label("Linked to improved sleep and mood", systemImage: "heart.fill")
                    .foregroundStyle(.red)
            }
            .font(.caption)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "sun.max.fill")
                .font(.system(size: 48))
                .foregroundStyle(.orange)
            Text("No Daylight Data")
                .font(.title3.bold())
            Text("Daylight exposure tracking uses your iPhone's ambient light sensor and requires iOS 17 or later. Carry your iPhone outdoors to record sunlight exposure.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            HStack(spacing: 6) {
                Image(systemName: "iphone")
                    .foregroundStyle(.secondary)
                Text("iPhone with iOS 17+")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.top, 40)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        if #available(iOS 17.0, *) {
            let start = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
            let raw = (try? await healthKit.fetchSamples(for: .timeInDaylight, from: start, to: Date())) ?? []
            let unit = HKUnit.minute()
            let cal = Calendar.current
            var byDay: [DateComponents: Double] = [:]
            for s in raw {
                let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
                byDay[key, default: 0] += s.quantity.doubleValue(for: unit)
            }
            days = byDay.compactMap { (comps, mins) in
                cal.date(from: comps).map { DaylightDay(date: $0, minutes: mins) }
            }.sorted { $0.date < $1.date }
        }
    }
}

// MARK: - Supporting Types

struct DaylightDay: Identifiable {
    let id = UUID()
    let date: Date
    let minutes: Double
}

enum DaylightZone {
    case excellent, good, low, veryLow

    var label: String {
        switch self {
        case .excellent: return "Excellent"
        case .good: return "Goal Met"
        case .low: return "Below Goal"
        case .veryLow: return "Very Low"
        }
    }

    var color: Color {
        switch self {
        case .excellent: return .orange
        case .good: return .green
        case .low: return .yellow
        case .veryLow: return .red
        }
    }

    static func from(minutes: Double) -> DaylightZone {
        if minutes >= 60 { return .excellent }
        if minutes >= 20 { return .good }
        if minutes >= 5 { return .low }
        return .veryLow
    }
}

#Preview {
    NavigationStack {
        DaylightExposureView()
    }
}
