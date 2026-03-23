import SwiftUI
import Charts
import HealthKit

// MARK: - YearInReviewView

/// A "wrapped"-style summary of the past 365 days:
/// total steps, workouts, sleep, personal bests, and monthly activity breakdown.
struct YearInReviewView: View {
    @State private var stats: YearStats?
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct YearStats {
        // Activity
        let totalSteps: Int
        let totalDistanceKm: Double
        let totalActiveCalories: Double
        // Workouts
        let totalWorkouts: Int
        let totalWorkoutMinutes: Double
        let mostCommonWorkoutType: String
        // Sleep
        let avgSleepHours: Double
        let totalSleepNights: Int
        // Records
        let bestStepDay: (date: Date, steps: Int)?
        let longestWorkout: (date: Date, type: String, mins: Double)?
        let highestHRV: (date: Date, value: Double)?
        let lowestRHR: (date: Date, value: Double)?
        // Monthly breakdown (12 months)
        let monthlySteps: [(month: Date, steps: Int)]
        let monthlyWorkouts: [(month: Date, count: Int)]
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Building your year...").padding(.top, 60)
                } else if let stats = stats {
                    heroHeader
                    activitySummaryCard(stats)
                    workoutSummaryCard(stats)
                    sleepSummaryCard(stats)
                    if stats.monthlySteps.count >= 6 { monthlyStepsChart(stats) }
                    if stats.monthlyWorkouts.count >= 6 { monthlyWorkoutsChart(stats) }
                    personalBestsCard(stats)
                } else {
                    emptyState
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Year in Review")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Hero Header

    private var heroHeader: some View {
        VStack(spacing: 8) {
            Text("Your Last 365 Days")
                .font(.title2.bold())
            Text("A look back at your health journey")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(
            LinearGradient(
                colors: [.green.opacity(0.3), .blue.opacity(0.2)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Activity Summary

    private func activitySummaryCard(_ s: YearStats) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionTitle(icon: "figure.walk", color: .green, title: "Activity")

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                BigStat(value: s.totalSteps.formatted(), label: "Total Steps", color: .green)
                BigStat(value: String(format: "%.0f km", s.totalDistanceKm), label: "Distance", color: .blue)
                BigStat(value: String(format: "%.0f k kcal", s.totalActiveCalories / 1000), label: "Active Calories", color: .orange)
                BigStat(value: String(format: "%.0f/day", Double(s.totalSteps) / 365), label: "Daily Average", color: .teal)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Workout Summary

    private func workoutSummaryCard(_ s: YearStats) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionTitle(icon: "figure.run", color: .red, title: "Workouts")

            HStack(spacing: 0) {
                VStack(spacing: 4) {
                    Text("\(s.totalWorkouts)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(.red)
                    Text("workouts")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                Divider().frame(height: 50)

                VStack(spacing: 4) {
                    Text(formatHours(s.totalWorkoutMinutes * 60))
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundStyle(.orange)
                    Text("total time")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                Divider().frame(height: 50)

                VStack(spacing: 4) {
                    Text(String(format: "%.1f/wk", Double(s.totalWorkouts) / 52))
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(.purple)
                    Text("per week")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }

            if !s.mostCommonWorkoutType.isEmpty {
                HStack {
                    Image(systemName: "crown.fill")
                        .foregroundStyle(.yellow)
                    Text("Most common: ")
                        .foregroundStyle(.secondary)
                    + Text(s.mostCommonWorkoutType)
                        .fontWeight(.semibold)
                }
                .font(.subheadline)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Sleep Summary

    private func sleepSummaryCard(_ s: YearStats) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionTitle(icon: "moon.fill", color: .indigo, title: "Sleep")

            HStack(spacing: 0) {
                VStack(spacing: 4) {
                    let h = Int(s.avgSleepHours)
                    let m = Int((s.avgSleepHours - Double(h)) * 60)
                    Text(m > 0 ? "\(h)h \(m)m" : "\(h)h")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundStyle(.indigo)
                    Text("avg per night")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                Divider().frame(height: 50)

                VStack(spacing: 4) {
                    Text("\(s.totalSleepNights)")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundStyle(.purple)
                    Text("nights tracked")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }

            let goal = GoalService.shared.sleepGoalMinutes / 60
            let pct = Int(s.avgSleepHours / goal * 100)
            HStack {
                Image(systemName: pct >= 90 ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                    .foregroundStyle(pct >= 90 ? .green : .orange)
                Text(pct >= 90
                     ? "Hitting your \(Int(goal))h goal — great work"
                     : "Averaging \(pct)% of your \(Int(goal))h sleep goal")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Monthly Steps Chart

    private func monthlyStepsChart(_ s: YearStats) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Steps")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(s.monthlySteps, id: \.month) { d in
                    BarMark(
                        x: .value("Month", d.month, unit: .month),
                        y: .value("Steps", d.steps)
                    )
                    .foregroundStyle(Color.green.gradient)
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 1)) { _ in
                    AxisValueLabel(format: .dateTime.month(.narrow))
                }
            }
            .chartYAxisLabel("steps")
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Monthly Workouts Chart

    private func monthlyWorkoutsChart(_ s: YearStats) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Workouts")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(s.monthlyWorkouts, id: \.month) { d in
                    BarMark(
                        x: .value("Month", d.month, unit: .month),
                        y: .value("Workouts", d.count)
                    )
                    .foregroundStyle(Color.red.gradient)
                    .cornerRadius(4)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 1)) { _ in
                    AxisValueLabel(format: .dateTime.month(.narrow))
                }
            }
            .chartYAxisLabel("workouts")
            .frame(height: 140)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Personal Bests Card

    private func personalBestsCard(_ s: YearStats) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "star.fill")
                    .foregroundStyle(.yellow)
                Text("Highlights")
                    .font(.subheadline.weight(.semibold))
            }

            if let best = s.bestStepDay {
                PRRow(icon: "shoeprints.fill", label: "Best Step Day",
                      value: best.steps.formatted() + " steps",
                      sub: best.date.formatted(date: .long, time: .omitted), color: .green)
            }
            if let lw = s.longestWorkout {
                PRRow(icon: "trophy.fill", label: "Longest Workout",
                      value: String(format: "%.0f min — %@", lw.mins, lw.type),
                      sub: lw.date.formatted(date: .long, time: .omitted), color: .red)
            }
            if let hrv = s.highestHRV {
                PRRow(icon: "waveform.path.ecg", label: "Best HRV",
                      value: String(format: "%.0f ms", hrv.value),
                      sub: hrv.date.formatted(date: .long, time: .omitted), color: .purple)
            }
            if let rhr = s.lowestRHR {
                PRRow(icon: "heart.fill", label: "Lowest Resting HR",
                      value: String(format: "%.0f bpm", rhr.value),
                      sub: rhr.date.formatted(date: .long, time: .omitted), color: .pink)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Year in Review requires at least 90 days of health data to generate your summary.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func formatHours(_ secs: Double) -> String {
        let h = Int(secs) / 3600
        let m = (Int(secs) % 3600) / 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let cal = Calendar.current
        let end = Date()
        let start = cal.date(byAdding: .day, value: -365, to: end)!

        // Concurrent fetches
        async let stepRaw = (try? await healthKit.fetchSamples(for: .stepCount, from: start, to: end)) ?? []
        async let distRaw = (try? await healthKit.fetchSamples(for: .distanceWalkingRunning, from: start, to: end)) ?? []
        async let calRaw = (try? await healthKit.fetchSamples(for: .activeEnergyBurned, from: start, to: end)) ?? []
        async let sleepRaw = (try? await healthKit.fetchSleepAnalysis(from: start, to: end)) ?? []
        async let workoutRaw = (try? await healthKit.fetchWorkouts(from: start, to: end)) ?? []
        async let hrvRaw = (try? await healthKit.fetchSamples(for: .heartRateVariabilitySDNN, from: start, to: end)) ?? []
        async let rhrRaw = (try? await healthKit.fetchSamples(for: .restingHeartRate, from: start, to: end)) ?? []

        let (steps, dist, cals, sleep, workouts, hrv, rhr) = await (stepRaw, distRaw, calRaw, sleepRaw, workoutRaw, hrvRaw, rhrRaw)

        // Aggregate steps by day
        var stepsByDay: [DateComponents: Double] = [:]
        for s in steps {
            let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
            stepsByDay[key, default: 0] += s.quantity.doubleValue(for: .count())
        }

        // Monthly steps
        var stepsByMonth: [DateComponents: Int] = [:]
        for (dc, v) in stepsByDay {
            var mdc = DateComponents()
            mdc.year = dc.year; mdc.month = dc.month; mdc.day = 1
            stepsByMonth[mdc, default: 0] += Int(v)
        }
        let monthlySteps = stepsByMonth.compactMap { dc, s -> (month: Date, steps: Int)? in
            cal.date(from: dc).map { (month: $0, steps: s) }
        }.sorted { $0.month < $1.month }

        // Monthly workouts
        var workoutsByMonth: [DateComponents: Int] = [:]
        for w in workouts {
            var dc = DateComponents()
            dc.year = cal.component(.year, from: w.startDate)
            dc.month = cal.component(.month, from: w.startDate)
            dc.day = 1
            workoutsByMonth[dc, default: 0] += 1
        }
        let monthlyWorkouts = workoutsByMonth.compactMap { dc, c -> (month: Date, count: Int)? in
            cal.date(from: dc).map { (month: $0, count: c) }
        }.sorted { $0.month < $1.month }

        // Best step day
        let bestStepEntry = stepsByDay.max(by: { $0.value < $1.value })
        let bestStepDay: (date: Date, steps: Int)? = bestStepEntry.flatMap { dc, v in
            cal.date(from: dc).map { (date: $0, steps: Int(v)) }
        }

        // Workout stats
        var typeCounts: [HKWorkoutActivityType: Int] = [:]
        for w in workouts { typeCounts[w.workoutActivityType, default: 0] += 1 }
        let topType = typeCounts.max(by: { $0.value < $1.value })?.key.name ?? ""
        let longestWorkoutRaw = workouts.max(by: { $0.duration < $1.duration })
        let longestWorkout: (date: Date, type: String, mins: Double)? = longestWorkoutRaw.map {
            (date: $0.startDate, type: $0.workoutActivityType.name, mins: $0.duration / 60)
        }
        let totalWorkoutMins = workouts.reduce(0.0) { $0 + $1.duration / 60 }

        // Sleep stats
        let sleepMins = sleep.map { $0.endDate.timeIntervalSince($0.startDate) / 60 }
        var sleepByDay: [DateComponents: Double] = [:]
        for s in sleep {
            let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
            sleepByDay[key, default: 0] += s.endDate.timeIntervalSince(s.startDate) / 60
        }
        let avgSleepHours = sleepMins.isEmpty ? 0.0 : sleepMins.reduce(0, +) / Double(max(1, sleepByDay.count)) / 60

        // HRV & RHR bests
        let highestHRV: (date: Date, value: Double)? = hrv
            .max(by: { $0.quantity.doubleValue(for: HKUnit(from: "ms")) < $1.quantity.doubleValue(for: HKUnit(from: "ms")) })
            .map { (date: $0.startDate, value: $0.quantity.doubleValue(for: HKUnit(from: "ms"))) }
        let lowestRHR: (date: Date, value: Double)? = rhr
            .filter { $0.quantity.doubleValue(for: .count().unitDivided(by: .minute())) > 30 }
            .min(by: { $0.quantity.doubleValue(for: .count().unitDivided(by: .minute())) < $1.quantity.doubleValue(for: .count().unitDivided(by: .minute())) })
            .map { (date: $0.startDate, value: $0.quantity.doubleValue(for: .count().unitDivided(by: .minute()))) }

        let totalSteps = Int(stepsByDay.values.reduce(0, +))
        let totalDist = dist.reduce(0.0) { $0 + $1.quantity.doubleValue(for: HKUnit(from: "m")) } / 1000
        let totalCals = cals.reduce(0.0) { $0 + $1.quantity.doubleValue(for: .kilocalorie()) }

        let s = YearStats(
            totalSteps: totalSteps,
            totalDistanceKm: totalDist,
            totalActiveCalories: totalCals,
            totalWorkouts: workouts.count,
            totalWorkoutMinutes: totalWorkoutMins,
            mostCommonWorkoutType: topType,
            avgSleepHours: avgSleepHours,
            totalSleepNights: sleepByDay.count,
            bestStepDay: bestStepDay,
            longestWorkout: longestWorkout,
            highestHRV: highestHRV,
            lowestRHR: lowestRHR,
            monthlySteps: monthlySteps,
            monthlyWorkouts: monthlyWorkouts
        )

        if totalSteps > 0 || workouts.count > 0 {
            stats = s
        }
    }
}

// MARK: - Supporting Views

private struct SectionTitle: View {
    let icon: String
    let color: Color
    let title: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(color)
            Text(title)
                .font(.headline)
        }
    }
}

private struct BigStat: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.bold().monospacedDigit())
                .foregroundStyle(color)
                .minimumScaleFactor(0.7)
                .lineLimit(1)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

#Preview {
    NavigationStack {
        YearInReviewView()
    }
}
