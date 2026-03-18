import SwiftUI
import HealthKit

/// Stream-based list dashboard - minimalistic, AI-first, expandable metrics
struct DashboardListView: View {
    @State private var viewModel = DashboardListViewModel()
    @Environment(ThemeManager.self) private var themeManager
    private let aiService = AIInsightsService.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    if viewModel.isLoading {
                        ProgressView()
                            .padding(.top, 80)
                    } else if let summary = viewModel.todaySummary {
                        dashboardContent(summary: summary)
                    } else if let error = viewModel.error {
                        errorView(error: error)
                    }
                }
            }
            .background(Color(.systemGroupedBackground))
            .refreshable {
                await viewModel.loadData()
            }
            .navigationTitle(greeting)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 12) {
                        Button {
                            Task {
                                await viewModel.refreshAIInsights()
                            }
                        } label: {
                            Image(systemName: "sparkles")
                                .symbolEffect(.pulse, isActive: aiService.isGenerating)
                        }
                        .disabled(aiService.isGenerating)

                        Button {
                            Task {
                                await viewModel.sync()
                            }
                        } label: {
                            Image(systemName: viewModel.isSyncing ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                                .rotationEffect(.degrees(viewModel.isSyncing ? 360 : 0))
                                .animation(
                                    viewModel.isSyncing
                                        ? .linear(duration: 1).repeatForever(autoreverses: false)
                                        : .default,
                                    value: viewModel.isSyncing
                                )
                        }
                        .disabled(viewModel.isSyncing)
                    }
                }
            }
            .task {
                await viewModel.loadData()
            }
        }
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 12 { return "Good morning" }
        if hour < 17 { return "Good afternoon" }
        return "Good evening"
    }

    @ViewBuilder
    private func dashboardContent(summary: TodayHealthSummary) -> some View {
        VStack(spacing: 20) {
            // AI Essence - Recovery + Strain + AI Insight
            AIEssenceView(
                recoveryScore: viewModel.recoveryScore,
                strainScore: viewModel.strainScore,
                primaryInsight: viewModel.generatePrimaryInsight(),
                secondaryInsight: viewModel.generateSecondaryInsight(),
                recoveryTrend: viewModel.recoveryTrend,
                strainTrend: viewModel.strainTrend
            )
            .padding(.horizontal, 16)

            // Quick Stats Grid
            QuickStatsView(
                stats: buildQuickStats(summary: summary)
            )
            .padding(.horizontal, 16)

            // Primary Metrics Stream
            metricsSection(title: "Today's Metrics", summary: summary)

            // Activity Stream
            activitySection(summary: summary)

            // AI Insights
            InsightsSectionView(insights: viewModel.insights)
                .padding(.horizontal, 16)

            Spacer(minLength: 100)
        }
        .padding(.top, 8)
    }

    private func buildQuickStats(summary: TodayHealthSummary) -> [QuickStat] {
        var stats: [QuickStat] = []

        stats.append(QuickStat(
            label: "Steps",
            value: summary.steps.formatted(),
            trend: viewModel.stepsTrend,
            color: .activity
        ))

        stats.append(QuickStat(
            label: "Calories",
            value: "\(Int(summary.activeCalories))",
            unit: "cal",
            color: .strain
        ))

        if let formattedSleep = summary.formattedSleep {
            stats.append(QuickStat(
                label: "Sleep",
                value: formattedSleep,
                color: .sleep
            ))
        }

        if let hrv = summary.hrv {
            stats.append(QuickStat(
                label: "HRV",
                value: "\(Int(hrv))",
                unit: "ms",
                trend: viewModel.hrvTrend,
                color: .heart
            ))
        }

        return stats
    }

    @ViewBuilder
    private func metricsSection(title: String, summary: TodayHealthSummary) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundStyle(.primary)
                .padding(.horizontal, 16)

            VStack(spacing: 0) {
                // Recovery
                MetricRowView(
                    icon: "bolt.fill",
                    label: "Recovery",
                    value: "\(viewModel.recoveryScore)",
                    unit: "%",
                    sublabel: RecoveryLevel.from(score: viewModel.recoveryScore).label,
                    trend: viewModel.recoveryTrend,
                    color: .recovery
                )

                // Strain
                MetricRowView(
                    icon: "flame.fill",
                    label: "Strain",
                    value: String(format: "%.1f", viewModel.strainScore),
                    unit: "/21",
                    sublabel: StrainLevel.from(score: viewModel.strainScore).label,
                    trend: viewModel.strainTrend,
                    color: .strain
                )

                // Sleep
                if let formattedSleep = summary.formattedSleep {
                    let sleepSublabel: String = {
                        guard let ctx = viewModel.latestSleepContext, ctx.durationMinutes > 0 else { return "" }
                        let deepPct = Int(Double(ctx.deepMinutes) / Double(ctx.durationMinutes) * 100)
                        return "\(deepPct)% deep sleep"
                    }()

                    MetricRowView(
                        icon: "moon.fill",
                        label: "Sleep",
                        value: formattedSleep,
                        sublabel: sleepSublabel,
                        color: .sleep
                    ) {
                        AnyView(sleepDetails(summary: summary))
                    }
                }

                // HRV
                if let hrv = summary.hrv {
                    MetricRowView(
                        icon: "waveform.path.ecg",
                        label: "HRV",
                        value: "\(Int(hrv))",
                        unit: "ms",
                        trend: viewModel.hrvTrend,
                        color: .hrv,
                        destination: AnyView(HealthMetricDetailView(dataType: .hrv))
                    )
                }

                // Sleep Streak
                if viewModel.sleepStreak > 0 {
                    MetricRowView(
                        icon: "moon.stars.fill",
                        label: "Sleep Streak",
                        value: "\(viewModel.sleepStreak)",
                        unit: viewModel.sleepStreak == 1 ? "night" : "nights",
                        sublabel: "consecutive nights of 7+ hours",
                        color: .sleep
                    )
                }

                // Heart Rate
                if let rhr = summary.restingHeartRate {
                    MetricRowView(
                        icon: "heart.fill",
                        label: "Resting Heart Rate",
                        value: "\(rhr)",
                        unit: "bpm",
                        color: .heart,
                        destination: AnyView(HealthMetricDetailView(dataType: .restingHeartRate))
                    )
                }

                // Body Weight
                if let weight = viewModel.bodyWeightKg {
                    MetricRowView(
                        icon: "scalemass.fill",
                        label: "Body Weight",
                        value: String(format: "%.1f", weight),
                        unit: "kg",
                        color: .hrv,
                        destination: AnyView(HealthMetricDetailView(dataType: .weight))
                    )
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 16)
        }
    }

    @ViewBuilder
    private func activitySection(summary: TodayHealthSummary) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Activity")
                .font(.headline)
                .foregroundStyle(.primary)
                .padding(.horizontal, 16)

            VStack(spacing: 0) {
                MetricRowView(
                    icon: "figure.walk",
                    label: "Steps",
                    value: summary.steps.formatted(),
                    unit: "/ \(Int(GoalService.shared.stepsGoal).formatted())",
                    sublabel: "\(Int(Double(summary.steps) / GoalService.shared.stepsGoal * 100))% of goal",
                    trend: viewModel.stepsTrend,
                    color: .activity,
                    destination: AnyView(HealthMetricDetailView(dataType: .steps))
                )

                MetricRowView(
                    icon: "flame.fill",
                    label: "Active Calories",
                    value: "\(Int(summary.activeCalories))",
                    unit: "cal",
                    sublabel: "\(Int(GoalService.shared.activeCaloriesGoal)) cal goal",
                    color: .strain,
                    destination: AnyView(HealthMetricDetailView(dataType: .activeCalories))
                )

                MetricRowView(
                    icon: "map",
                    label: "Distance",
                    value: String(format: "%.1f", summary.distanceKm),
                    unit: "km",
                    color: .activity
                )

                if summary.floorsClimbed > 0 {
                    MetricRowView(
                        icon: "stairs",
                        label: "Floors Climbed",
                        value: "\(summary.floorsClimbed)",
                        unit: "floors",
                        color: .hrv
                    )
                }

                if viewModel.currentStreak > 0 {
                    MetricRowView(
                        icon: "rosette",
                        label: "Step Streak",
                        value: "\(viewModel.currentStreak)",
                        unit: viewModel.currentStreak == 1 ? "day" : "days",
                        sublabel: "consecutive days at goal",
                        color: .orange
                    )
                }

                if viewModel.weeklyWorkoutCount > 0 {
                    MetricRowView(
                        icon: "figure.mixed.cardio",
                        label: "Workouts This Week",
                        value: "\(viewModel.weeklyWorkoutCount)",
                        unit: viewModel.weeklyWorkoutCount == 1 ? "session" : "sessions",
                        color: .activity
                    )
                }

                if viewModel.workoutStreak > 0 {
                    MetricRowView(
                        icon: "figure.run",
                        label: "Workout Streak",
                        value: "\(viewModel.workoutStreak)",
                        unit: viewModel.workoutStreak == 1 ? "day" : "days",
                        sublabel: "consecutive days with a workout",
                        color: .activity
                    )
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 16)
        }
    }

    private func sleepDetails(summary: TodayHealthSummary) -> some View {
        VStack(spacing: 8) {
            if let sleepContext = viewModel.latestSleepContext {
                MetricDetailRow(label: "Deep Sleep", value: formatMinutes(sleepContext.deepMinutes), color: .sleep)
                MetricDetailRow(label: "REM", value: formatMinutes(sleepContext.remMinutes), color: .hrv)
                MetricDetailRow(label: "Light", value: formatMinutes(sleepContext.coreMinutes), color: .secondary)
                MetricDetailRow(label: "Awake", value: formatMinutes(sleepContext.awakeMinutes), color: .warning)
            } else {
                Text("No sleep data available")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            NavigationLink(destination: SleepView()) {
                Text("Sleep History")
                    .font(.caption.bold())
                    .foregroundStyle(Color.sleep)
            }
        }
    }

    private func formatMinutes(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        if h > 0 {
            return "\(h)h \(m)m"
        }
        return "\(m)m"
    }

    @ViewBuilder
    private func errorView(error: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(Color.warning)

            Text(error)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button("Try Again") {
                Task {
                    await viewModel.loadData()
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .padding(.top, 50)
    }
}

// MARK: - View Model

@Observable
class DashboardListViewModel {
    var todaySummary: TodayHealthSummary?
    var insights: [HealthInsight] = []
    var isLoading = false
    var isSyncing = false
    var error: String?

    // Real scores from AI analysis (with sensible defaults)
    var recoveryScore: Int = 70
    var strainScore: Double = 8.0
    var recoveryTrend: Int? = nil
    var strainTrend: Int? = nil
    var stepsTrend: Int? = nil
    var hrvTrend: Int? = nil
    var currentStreak: Int = 0
    var sleepStreak: Int = 0
    var workoutStreak: Int = 0
    var latestSleepContext: AIInsightsService.SleepContext? = nil
    var bodyWeightKg: Double? = nil
    var weeklyWorkoutCount: Int = 0

    private let healthKit = HealthKitService.shared
    private let syncService = SyncService.shared
    private let aiService = AIInsightsService.shared

    func loadData() async {
        await MainActor.run {
            isLoading = true
            error = nil
        }

        do {
            let summary = try await healthKit.fetchTodaySummary()
            await MainActor.run {
                todaySummary = summary
                isLoading = false
            }

            // Fetch last night's sleep breakdown
            let calendar = Calendar.current
            let yesterday = calendar.date(byAdding: .day, value: -1, to: calendar.startOfDay(for: Date()))!
            let sleepSamples = try? await healthKit.fetchSleepAnalysis(from: yesterday, to: Date())
            if let samples = sleepSamples, !samples.isEmpty {
                var deep = 0, rem = 0, core = 0, awake = 0
                for sample in samples {
                    let mins = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                    switch HKCategoryValueSleepAnalysis(rawValue: sample.value) {
                    case .asleepDeep: deep += mins
                    case .asleepREM: rem += mins
                    case .asleepCore, .asleepUnspecified: core += mins
                    case .awake, .inBed: awake += mins
                    default: break
                    }
                }
                await MainActor.run {
                    latestSleepContext = AIInsightsService.SleepContext(
                        durationMinutes: deep + rem + core,
                        deepMinutes: deep, remMinutes: rem,
                        coreMinutes: core, awakeMinutes: awake
                    )
                }
            }

            // Fetch latest body weight
            if let weight = try? await healthKit.fetchLatest(for: .bodyMass) {
                await MainActor.run { bodyWeightKg = weight }
            }

            // Count workouts this week
            let weekStart = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
            let weekWorkouts = (try? await healthKit.fetchWorkouts(from: weekStart, to: Date())) ?? []
            await MainActor.run { weeklyWorkoutCount = weekWorkouts.count }

            // Load cached AI scores if available
            if let cachedRecovery = aiService.latestRecoveryScore {
                await MainActor.run { recoveryScore = cachedRecovery }
            }
            if let cachedStrain = aiService.latestStrainScore {
                await MainActor.run { strainScore = cachedStrain }
            }

            // Load insights from Supabase
            if let fetchedInsights = try? await SupabaseService.shared.fetchInsights() {
                await MainActor.run { insights = fetchedInsights }
            }

            // Calculate trends from week data
            await calculateTrends()

        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                isLoading = false
            }
        }
    }

    func sync() async {
        await MainActor.run {
            isSyncing = true
        }

        await syncService.performFullSync()

        await MainActor.run {
            isSyncing = false
        }

        await loadData()
    }

    func refreshAIInsights() async {
        let result = await aiService.generateInsights()
        if let result = result {
            await MainActor.run {
                recoveryScore = result.recoveryScore
                strainScore = result.strainScore
            }
            // Reload insights from DB
            if let fetchedInsights = try? await SupabaseService.shared.fetchInsights() {
                await MainActor.run { insights = fetchedInsights }
            }
        }
    }

    private func calculateTrends() async {
        do {
            let weekData = try await healthKit.fetchWeekSummaries(days: 7)
            guard weekData.count >= 2 else { return }

            let todaySteps = weekData.first?.steps ?? 0
            let avgSteps = weekData.dropFirst().reduce(0) { $0 + $1.steps } / max(weekData.count - 1, 1)
            if avgSteps > 0 {
                await MainActor.run {
                    stepsTrend = Int(((Double(todaySteps) - Double(avgSteps)) / Double(avgSteps)) * 100)
                }
            }

            let todayHrv = weekData.first?.avgHrv
            let hrvValues = weekData.dropFirst().compactMap { $0.avgHrv }
            if let todayHrv = todayHrv, !hrvValues.isEmpty {
                let avgHrv = hrvValues.reduce(0, +) / Double(hrvValues.count)
                if avgHrv > 0 {
                    await MainActor.run {
                        hrvTrend = Int(((todayHrv - avgHrv) / avgHrv) * 100)
                    }
                }
            }

            // Compute step goal streak (60 days, newest first)
            let streakData = try await healthKit.fetchWeekSummaries(days: 60)
            let stepGoal = GoalService.shared.stepsGoal
            var streak = 0
            for day in streakData.dropFirst() { // skip today — still accumulating
                if Double(day.steps) >= stepGoal {
                    streak += 1
                } else {
                    break
                }
            }
            await MainActor.run {
                currentStreak = streak
            }

            // Compute sleep streak (7h = 420 min goal, newest first, skip today)
            let sleepGoalMinutes = 420
            var sleepStreakCount = 0
            for day in streakData.dropFirst() {
                if (day.sleepDurationMinutes ?? 0) >= sleepGoalMinutes {
                    sleepStreakCount += 1
                } else {
                    break
                }
            }
            await MainActor.run { sleepStreak = sleepStreakCount }

            // Compute workout streak (consecutive days with ≥1 workout, skip today)
            let wCal = Calendar.current
            let sixtyDaysAgo = wCal.date(byAdding: .day, value: -60, to: Date())!
            let allWorkouts = (try? await healthKit.fetchWorkouts(from: sixtyDaysAgo, to: Date())) ?? []
            var workoutDaySet = Set<String>()
            let isoFmt = ISO8601DateFormatter()
            isoFmt.formatOptions = [.withFullDate]
            for workout in allWorkouts {
                workoutDaySet.insert(isoFmt.string(from: wCal.startOfDay(for: workout.startDate)))
            }
            var workoutStreakCount = 0
            var checkDay = wCal.date(byAdding: .day, value: -1, to: wCal.startOfDay(for: Date()))!
            for _ in 0..<60 {
                let key = isoFmt.string(from: checkDay)
                if workoutDaySet.contains(key) {
                    workoutStreakCount += 1
                    checkDay = wCal.date(byAdding: .day, value: -1, to: checkDay)!
                } else {
                    break
                }
            }
            await MainActor.run { workoutStreak = workoutStreakCount }
        } catch {
            // Trends are non-critical, silently fail
        }
    }

    func generatePrimaryInsight() -> String {
        if recoveryScore >= 80 {
            return "Your recovery is excellent. Today is ideal for high-intensity training."
        }
        if recoveryScore >= 60 {
            return "You're moderately recovered. Consider a balanced workout today."
        }
        return "Your recovery is low. Prioritize rest and light activity today."
    }

    func generateSecondaryInsight() -> String? {
        if let trend = hrvTrend, trend > 10 {
            return "HRV trending up \(trend)% this week — a positive adaptation sign."
        }
        if let trend = stepsTrend, trend > 20 {
            return "You're \(trend)% more active than your weekly average. Great momentum!"
        }
        return nil
    }
}

#Preview {
    DashboardListView()
        .environment(ThemeManager.shared)
}
