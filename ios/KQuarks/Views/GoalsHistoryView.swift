import SwiftUI
import Charts
import HealthKit

// MARK: - Models

private struct GoalDay: Identifiable {
    let id = UUID()
    let date: Date
    let achieved: Bool
    let value: Double    // actual value that day
    let goal: Double
}

private struct GoalTrack {
    let name: String
    let icon: String
    let color: Color
    let unit: String
    let days: [GoalDay]

    var hitRate: Double {
        guard !days.isEmpty else { return 0 }
        let hits = days.filter(\.achieved).count
        return Double(hits) / Double(days.count) * 100
    }

    var currentStreak: Int {
        var streak = 0
        for day in days.reversed() {
            guard day.achieved else { break }
            streak += 1
        }
        return streak
    }

    var longestStreak: Int {
        var longest = 0, current = 0
        for day in days {
            if day.achieved { current += 1; longest = max(longest, current) }
            else { current = 0 }
        }
        return longest
    }
}

// MARK: - GoalsHistoryView

struct GoalsHistoryView: View {
    @State private var tracks: [GoalTrack] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared
    private let goals     = GoalService.shared
    private let cal       = Calendar.current

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 80)
                } else if tracks.isEmpty {
                    emptyState
                } else {
                    summaryRow
                    ForEach(tracks, id: \.name) { track in
                        trackCard(track)
                    }
                    footerNote
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Goals History")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Row

    private var summaryRow: some View {
        HStack(spacing: 12) {
            ForEach(tracks, id: \.name) { track in
                VStack(spacing: 4) {
                    Text(String(format: "%.0f%%", track.hitRate))
                        .font(.title3.bold().monospacedDigit())
                        .foregroundStyle(track.color)
                    Text(track.name)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(track.color.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    // MARK: - Track Card

    private func trackCard(_ track: GoalTrack) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            // Header
            HStack(spacing: 8) {
                Image(systemName: track.icon)
                    .font(.subheadline.bold())
                    .foregroundStyle(track.color)
                    .frame(width: 32, height: 32)
                    .background(track.color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 2) {
                    Text(track.name + " Goal")
                        .font(.headline)
                    Text(goalLabel(track))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(String(format: "%.0f%%", track.hitRate))
                        .font(.title3.bold().monospacedDigit())
                        .foregroundStyle(track.color)
                    Text("hit rate")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            // 30-day dot calendar
            goalCalendar(track)

            // Streak stats
            HStack(spacing: 0) {
                streakStat(label: "Current Streak",
                           value: "\(track.currentStreak)d",
                           color: track.currentStreak > 0 ? track.color : .secondary)
                Divider().frame(height: 36)
                streakStat(label: "Best Streak",
                           value: "\(track.longestStreak)d",
                           color: track.longestStreak >= 7 ? .yellow : track.color)
                Divider().frame(height: 36)
                streakStat(label: "Days Hit",
                           value: "\(track.days.filter(\.achieved).count)/\(track.days.count)",
                           color: .primary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func goalLabel(_ track: GoalTrack) -> String {
        switch track.name {
        case "Steps":    return "\(Int(goals.stepsGoal).formatted()) steps/day"
        case "Calories": return "\(Int(goals.activeCaloriesGoal)) kcal/day"
        case "Sleep":    return fmtDuration(Int(goals.sleepGoalMinutes)) + "/night"
        default:         return ""
        }
    }

    // MARK: - Goal Calendar (5-week dot grid, most recent at bottom-right)

    private func goalCalendar(_ track: GoalTrack) -> some View {
        let days = track.days.suffix(35)   // show up to 5 weeks
        let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
        let weekdays = ["S", "M", "T", "W", "T", "F", "S"]

        return VStack(spacing: 4) {
            // Weekday headers
            HStack(spacing: 4) {
                ForEach(weekdays, id: \.self) { wd in
                    Text(wd)
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(Array(days.enumerated()), id: \.offset) { _, day in
                    Circle()
                        .fill(day.achieved ? track.color : Color(.systemFill))
                        .frame(height: 22)
                        .overlay(
                            Circle()
                                .stroke(cal.isDateInToday(day.date) ? track.color : .clear, lineWidth: 2)
                        )
                }
            }

            // Legend
            HStack(spacing: 12) {
                legendItem(color: track.color, label: "Achieved")
                legendItem(color: Color(.systemFill), label: "Missed")
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
    }

    private func streakStat(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "target")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Goal Data Yet")
                .font(.title3.bold())
            Text("Sync at least a week of health data to see your goal achievement history.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    private var footerNote: some View {
        Text("Last 30 days · Goals from your settings")
            .font(.caption2)
            .foregroundStyle(.tertiary)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.bottom, 8)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let today = Date()
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: today) ?? Date()

        async let stepsData   = try? healthKit.fetchDailyStats(for: .stepCount, from: thirtyDaysAgo, to: today, isDiscrete: false)
        async let calsData    = try? healthKit.fetchDailyStats(for: .activeEnergyBurned, from: thirtyDaysAgo, to: today, isDiscrete: false)
        async let sleepRaw    = try? healthKit.fetchSleepAnalysis(from: thirtyDaysAgo, to: today)

        let steps    = await stepsData ?? [:]
        let calories = await calsData  ?? [:]
        let sleepSamples = await sleepRaw ?? []

        // Build 30-day date sequence
        let dateSeq = (0..<30).compactMap { offset -> Date? in
            cal.date(byAdding: .day, value: offset - 29, to: today)
        }.map { cal.startOfDay(for: $0) }

        // Steps track
        let stepGoal = goals.stepsGoal
        let stepDays: [GoalDay] = dateSeq.map { d in
            let v = closestValue(in: steps, for: d) ?? 0
            return GoalDay(date: d, achieved: v >= stepGoal, value: v, goal: stepGoal)
        }

        // Calories track
        let calGoal = goals.activeCaloriesGoal
        let calDays: [GoalDay] = dateSeq.map { d in
            let v = closestValue(in: calories, for: d) ?? 0
            return GoalDay(date: d, achieved: v >= calGoal, value: v, goal: calGoal)
        }

        // Sleep track — group samples by wake day
        let sleepByDay = groupSleepByDay(sleepSamples)
        let sleepGoal  = goals.sleepGoalMinutes
        let sleepDays: [GoalDay] = dateSeq.map { d in
            let v = Double(sleepByDay[cal.dateComponents([.year, .month, .day], from: d)] ?? 0)
            return GoalDay(date: d, achieved: v >= sleepGoal && v > 0, value: v, goal: sleepGoal)
        }

        tracks = [
            GoalTrack(name: "Steps",    icon: "figure.walk",  color: .green,  unit: "steps", days: stepDays),
            GoalTrack(name: "Calories", icon: "flame.fill",   color: .orange, unit: "kcal",  days: calDays),
            GoalTrack(name: "Sleep",    icon: "moon.fill",    color: .indigo, unit: "min",   days: sleepDays),
        ]
    }

    // MARK: - Helpers

    private func closestValue(in dict: [Date: Double], for day: Date) -> Double? {
        dict.first { cal.isDate($0.key, inSameDayAs: day) }?.value
    }

    private func groupSleepByDay(_ samples: [HKCategorySample]) -> [DateComponents: Int] {
        var byDay: [DateComponents: [HKCategorySample]] = [:]
        for s in samples {
            let key = cal.dateComponents([.year, .month, .day], from: s.endDate)
            byDay[key, default: []].append(s)
        }
        var result: [DateComponents: Int] = [:]
        for (comps, daySamples) in byDay {
            var total = 0
            for sample in daySamples {
                let mins = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                switch HKCategoryValueSleepAnalysis(rawValue: sample.value) {
                case .asleepDeep, .asleepREM, .asleepCore, .asleepUnspecified:
                    total += mins
                default:
                    break
                }
            }
            if total > 60 { result[comps] = total }
        }
        return result
    }

    private func fmtDuration(_ minutes: Int) -> String {
        let h = minutes / 60, m = minutes % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }
}

#Preview {
    NavigationStack {
        GoalsHistoryView()
    }
}
