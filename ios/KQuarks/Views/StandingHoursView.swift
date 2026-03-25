import SwiftUI
import Charts
import HealthKit

// MARK: - StandingHoursView

/// Tracks Apple Stand Hours from HKCategoryType(.appleStandHour).
///
/// Apple Watch awards one Stand Hour for every clock hour in which the user
/// stood and moved around for at least one minute. The default daily goal is
/// 12 stand hours (the blue Activity ring).
///
/// Sedentary behavior science:
/// - Sitting >8 hrs/day with no physical activity associated with 59% higher
///   mortality risk vs sitting <4 hrs (Biswas et al., Ann. Internal Medicine, 2015)
/// - Breaking sitting every 30 min with light walking reduces blood glucose
///   and insulin by ~30% (Dunstan et al., Diabetes Care, 2012)
/// - Standing 2-4 extra hours per day linked to lower long-term weight gain
///   and improved cardiometabolic markers (Healy et al., 2015)
///
/// Note: HKCategoryValueAppleStandHour.stood = 0, .idle = 1
struct StandingHoursView: View {

    struct DayReading: Identifiable {
        let id: Date
        let date: Date
        let standHours: Int   // 0–24 (usually capped at ≤16 waking hours)
        let metGoal: Bool     // ≥ 12 stand hours
    }

    @State private var days: [DayReading] = []
    @State private var todayStand: Int = 0
    @State private var avg30: Double = 0
    @State private var goalStreak: Int = 0
    @State private var longestStreak: Int = 0
    @State private var daysMetGoal: Int = 0
    @State private var hourlyPattern: [Int] = Array(repeating: 0, count: 24)  // avg stands per hour
    @State private var isLoading = true

    private let dailyGoal = 12
    private let healthStore = HKHealthStore()

    private var standDomain: ClosedRange<Double> {
        let hi = days.map(\.standHours).max().map { max(16, $0 + 1) } ?? 16
        return 0...Double(hi)
    }

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if days.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    historyGrid
                    trendChart
                    hourlyCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Standing Hours")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(todayStand)")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(todayStand >= dailyGoal ? .blue : .secondary)
                        Text("/ 12")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    Text(todayStand >= dailyGoal ? "Stand goal met" :
                         "\(dailyGoal - todayStand) hours left")
                        .font(.subheadline)
                        .foregroundStyle(todayStand >= dailyGoal ? .green : .secondary)
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(Color.blue.opacity(0.15), lineWidth: 10)
                        .frame(width: 88, height: 88)
                    Circle()
                        .trim(from: 0, to: min(1.0, Double(todayStand) / Double(dailyGoal)))
                        .stroke(todayStand >= dailyGoal ? Color.blue : Color.blue.opacity(0.7),
                                style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 88, height: 88)
                    Image(systemName: "figure.stand")
                        .font(.title2).foregroundStyle(.blue)
                }
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "30d Average", value: String(format: "%.1f hrs", avg30), color: avg30 >= Double(dailyGoal) ? .green : .blue)
                Divider().frame(height: 36)
                statCell(label: "Days Met Goal", value: "\(daysMetGoal)", color: daysMetGoal >= 20 ? .green : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Goal Streak", value: "\(goalStreak)d", color: goalStreak >= 7 ? .green : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Longest Streak", value: "\(longestStreak)d", color: .blue)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - 30-Day History Grid

    private var historyGrid: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day History").font(.headline)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 10), spacing: 4) {
                ForEach(days) { d in
                    VStack(spacing: 2) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(tileColor(d.standHours))
                            .frame(height: 28)
                        Text("\(d.standHours)")
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            HStack(spacing: 8) {
                legendSquare(color: .blue.opacity(0.85), label: "≥12 hrs")
                legendSquare(color: .blue.opacity(0.5), label: "8-11")
                legendSquare(color: .blue.opacity(0.25), label: "4-7")
                legendSquare(color: .gray.opacity(0.2), label: "<4 hrs")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func tileColor(_ hours: Int) -> Color {
        if hours >= 12 { return Color.blue.opacity(0.85) }
        if hours >= 8  { return Color.blue.opacity(0.5) }
        if hours >= 4  { return Color.blue.opacity(0.25) }
        return Color.gray.opacity(0.2)
    }

    private func legendSquare(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 12, height: 12)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - 30-Day Trend

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Stand Hours Trend").font(.headline)
            Chart {
                ForEach(days) { d in
                    BarMark(x: .value("Date", d.date),
                            y: .value("Hours", d.standHours))
                    .foregroundStyle(tileColor(d.standHours))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Goal", dailyGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("12").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYScale(domain: standDomain)
            .chartYAxisLabel("hrs/day")
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private struct HourEntry: Identifiable {
        let id: Int
        let hour: Int
        let pct: Double
    }

    private func hourlyEntries() -> [HourEntry] {
        (6...22).map { h in HourEntry(id: h, hour: h, pct: Double(hourlyPattern[h]) / 30.0) }
    }

    private func hourBarColor(_ pct: Double) -> Color {
        if pct >= 0.7 { return Color.blue.opacity(0.8) }
        if pct >= 0.4 { return Color.blue.opacity(0.5) }
        return Color.blue.opacity(0.25)
    }

    // MARK: - Hourly Pattern

    private var hourlyCard: some View {
        let standmax = hourlyEntries().map(\.pct).max().map { Swift.max($0, 0.1) } ?? 1.0
        return VStack(alignment: .leading, spacing: 8) {
            Text("When You Stand — Hourly Pattern").font(.headline)
            Text("Hours when you most often have a stand (averaged over 30 days)")
                .font(.caption).foregroundStyle(.secondary)

            Chart {
                ForEach(hourlyEntries()) { entry in
                    BarMark(x: .value("Hour", entry.hour),
                            y: .value("Stand Rate", entry.pct))
                    .foregroundStyle(hourBarColor(entry.pct))
                    .cornerRadius(3)
                }
            }
            .chartXAxis {
                AxisMarks(values: [6, 9, 12, 15, 18, 21]) { v in
                    AxisValueLabel {
                        if let h = v.as(Int.self) {
                            Text(h < 12 ? "\(h)am" : h == 12 ? "12pm" : "\(h-12)pm")
                                .font(.caption2)
                        }
                    }
                }
            }
            .chartYAxisLabel("stand rate")
            .chartYScale(domain: 0...standmax)
            .frame(height: 110)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "figure.stand").foregroundStyle(.blue)
                Text("Why Standing Matters").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                evidenceRow(stat: "59% higher risk", detail: "Sitting ≥8 hrs/day with no activity vs <4 hrs — all-cause mortality increase (Biswas et al., 2015)")
                evidenceRow(stat: "30% glucose drop", detail: "Breaking sedentary time every 30 min with 2-min walks reduces post-meal blood glucose and insulin (Dunstan et al., 2012)")
                evidenceRow(stat: "12 hrs = optimal", detail: "Apple's 12 stand-hour daily goal maps to breaking sedentary behavior at least once per waking hour")
                evidenceRow(stat: "Any move counts", detail: "Even 1 minute of movement per hour reduces cardiometabolic risk. Intensity less important than frequency.")
            }
            Divider()
            Text("💡 Set Apple Watch reminders to stand: Settings → Activity. The watch reminds you at 10 minutes to the hour if you haven't stood yet.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.blue.opacity(0.18), lineWidth: 1))
    }

    private func evidenceRow(stat: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(stat).font(.caption.bold()).foregroundStyle(.blue).frame(width: 90, alignment: .leading)
            Text(detail).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.stand")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Stand Hour Data")
                .font(.title3.bold())
            Text("Stand hours are tracked automatically by Apple Watch. Wear your Watch throughout the day to capture standing patterns and work toward the 12-hour daily goal.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let standType = HKCategoryType(.appleStandHour)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [standType])) != nil else { return }

        let cal = Calendar.current
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: Date()) ?? Date()

        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: standType,
                predicate: HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        // Group by day — count stood hours
        var dayMap: [Date: Int] = [:]
        var hourlyStands = Array(repeating: 0, count: 24)

        for s in samples {
            let stood = s.value == HKCategoryValueAppleStandHour.stood.rawValue
            if stood {
                let day = cal.startOfDay(for: s.startDate)
                dayMap[day, default: 0] += 1
                let hour = cal.component(.hour, from: s.startDate)
                hourlyStands[hour] += 1
            }
        }

        let allDays = dayMap.map { date, count in
            DayReading(id: date, date: date, standHours: count, metGoal: count >= dailyGoal)
        }.sorted { $0.date < $1.date }

        guard !allDays.isEmpty else { return }

        days = allDays
        todayStand = allDays.last?.standHours ?? 0
        avg30 = Double(allDays.map(\.standHours).reduce(0, +)) / Double(allDays.count)
        daysMetGoal = allDays.filter(\.metGoal).count
        hourlyPattern = hourlyStands

        // Streaks
        let past = allDays.filter { $0.date < cal.startOfDay(for: Date()) }.reversed()
        var streak = 0
        for d in past {
            if d.metGoal { streak += 1 } else { break }
        }
        goalStreak = streak

        var longest = 0, cur = 0
        for d in allDays {
            if d.metGoal { cur += 1; longest = max(longest, cur) } else { cur = 0 }
        }
        longestStreak = longest
    }
}

#Preview { NavigationStack { StandingHoursView() } }
