import SwiftUI
import HealthKit

/// Stream-based list dashboard - minimalistic, AI-first, expandable metrics
struct DashboardListView: View {
    @State private var viewModel = DashboardListViewModel()
    @Environment(ThemeManager.self) private var themeManager
    private let aiService = AIInsightsService.shared

    @State private var showLogWeight = false
    @State private var logWeightText = ""
    @State private var logWeightError: String?

    @State private var showCheckin = false
    @State private var todayCheckin: DailyCheckin?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Sync error banner
                    if let syncErr = viewModel.syncError {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                            Text(syncErr)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                            Spacer()
                            Button {
                                viewModel.syncError = nil
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(12)
                        .background(Color.orange.opacity(0.12))
                        .cornerRadius(10)
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                    }

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
            .navigationBarTitleDisplayMode(.inline)
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

                        if let summary = viewModel.todaySummary {
                            ShareLink(item: dailySummaryShareText(summary: summary)) {
                                Image(systemName: "square.and.arrow.up")
                            }
                        }

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
            .onChange(of: viewModel.isSyncing) { wasSyncing, isSyncing in
                if wasSyncing && !isSyncing {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                }
            }
            .task {
                await viewModel.loadData()
                todayCheckin = try? await SupabaseService.shared.fetchTodayCheckin()
            }
            .sheet(isPresented: $showCheckin, onDismiss: {
                Task { todayCheckin = try? await SupabaseService.shared.fetchTodayCheckin() }
            }) {
                CheckinView()
            }
            .alert("Log Weight", isPresented: $showLogWeight) {
                TextField("Weight in kg", text: $logWeightText)
                    .keyboardType(.decimalPad)
                Button("Save") {
                    guard let kg = Double(logWeightText), kg > 0, kg < 500 else { return }
                    Task {
                        try? await HealthKitService.shared.saveBodyWeight(kg)
                        await viewModel.loadData()
                    }
                    logWeightText = ""
                }
                Button("Cancel", role: .cancel) { logWeightText = "" }
            } message: {
                Text("Enter your current body weight.")
            }
        }
    }

    private func dailySummaryShareText(summary: TodayHealthSummary) -> String {
        let date = Date().formatted(date: .abbreviated, time: .omitted)
        var lines: [String] = ["📊 Health Summary — \(date)"]
        lines.append("🚶 \(summary.steps.formatted()) steps")
        if summary.activeCalories > 0 { lines.append("🔥 \(Int(summary.activeCalories)) cal active") }
        if let sleep = summary.formattedSleep { lines.append("💤 \(sleep) sleep") }
        if let hr = summary.restingHeartRate { lines.append("❤️ \(hr) bpm resting HR") }
        lines.append("⚡ Recovery \(viewModel.recoveryScore)%")
        if viewModel.currentStreak > 1 { lines.append("🔥 \(viewModel.currentStreak)-day step streak") }
        lines.append("\nTracked with KQuarks")
        return lines.joined(separator: "\n")
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

            // Weekly Step Chart
            if !viewModel.weeklyData.isEmpty {
                DashboardWeeklyChartView(
                    weekData: viewModel.weeklyData,
                    stepGoal: GoalService.shared.stepsGoal
                )
                .padding(.horizontal, 16)
            }

            // Primary Metrics Stream
            metricsSection(title: "Today's Metrics", summary: summary)

            // Activity Stream
            activitySection(summary: summary)

            // Wellbeing section: check-in + quick links
            VStack(alignment: .leading, spacing: 8) {
                Text("Wellbeing")
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .padding(.horizontal, 16)
                VStack(spacing: 0) {
                    CheckinDashboardCard(checkin: todayCheckin) {
                        showCheckin = true
                    }
                    Divider().padding(.leading, 16)
                    NavigationLink(destination: WaterView()) {
                        HStack(spacing: 12) {
                            Image(systemName: "drop.fill")
                                .font(.title3)
                                .foregroundStyle(.blue)
                            Text("Hydration")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                    }
                    Divider().padding(.leading, 16)
                    NavigationLink(destination: FastingView()) {
                        HStack(spacing: 12) {
                            Image(systemName: "timer")
                                .font(.title3)
                                .foregroundStyle(.orange)
                            Text("Fasting")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                    }
                    Divider().padding(.leading, 16)
                    NavigationLink(destination: HabitsView()) {
                        HStack(spacing: 12) {
                            Image(systemName: "checklist")
                                .font(.title3)
                                .foregroundStyle(Color.accentColor)
                            Text("Habits")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                    }
                    Divider().padding(.leading, 16)
                    NavigationLink(destination: MindfulnessView()) {
                        HStack(spacing: 12) {
                            Image(systemName: "brain.head.profile")
                                .font(.title3)
                                .foregroundStyle(.teal)
                            Text("Mindfulness")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                    }
                    Divider().padding(.leading, 16)
                    NavigationLink(destination: BreathingView()) {
                        HStack(spacing: 12) {
                            Image(systemName: "wind")
                                .font(.title3)
                                .foregroundStyle(.cyan)
                            Text("Breathing")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                    }
                    Divider().padding(.leading, 16)
                    NavigationLink(destination: NutritionView()) {
                        HStack(spacing: 12) {
                            Image(systemName: "fork.knife")
                                .font(.title3)
                                .foregroundStyle(.orange)
                            Text("Nutrition")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                    }
                    Divider().padding(.leading, 16)
                    NavigationLink(destination: GLP1View()) {
                        HStack(spacing: 12) {
                            Image(systemName: "syringe.fill")
                                .font(.title3)
                                .foregroundStyle(.purple)
                            Text("GLP-1 / Zepbound")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                    }
                }
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal, 16)
            }

            // AI Insights
            InsightsSectionView(insights: viewModel.insights)
                .padding(.horizontal, 16)

            // Last synced footer
            if let last = viewModel.lastSyncDate {
                Label {
                    (Text("Synced ") + Text(last, style: .relative) + Text(" ago"))
                        .font(.caption2)
                } icon: {
                    Image(systemName: "arrow.clockwise")
                        .font(.caption2)
                }
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
            }

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
                    .contextMenu {
                        Button {
                            logWeightText = String(format: "%.1f", weight)
                            showLogWeight = true
                        } label: {
                            Label("Log Today's Weight", systemImage: "scalemass")
                        }
                    }
                } else {
                    MetricRowView(
                        icon: "scalemass.fill",
                        label: "Body Weight",
                        value: "—",
                        color: .hrv
                    )
                    .contextMenu {
                        Button {
                            logWeightText = ""
                            showLogWeight = true
                        } label: {
                            Label("Log Today's Weight", systemImage: "scalemass")
                        }
                    }
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

            StepGoalRingView(
                steps: summary.steps,
                goal: Int(GoalService.shared.stepsGoal),
                calories: Int(summary.activeCalories),
                calorieGoal: Int(GoalService.shared.activeCaloriesGoal)
            )
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
                    color: .activity,
                    destination: AnyView(HealthMetricDetailView(dataType: .distance))
                )

                if summary.floorsClimbed > 0 {
                    MetricRowView(
                        icon: "stairs",
                        label: "Floors Climbed",
                        value: "\(summary.floorsClimbed)",
                        unit: "floors",
                        color: .hrv,
                        destination: AnyView(HealthMetricDetailView(dataType: .floorsClimbed))
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
    var weeklyData: [DaySummaryForAI] = []
    var lastSyncDate: Date?
    var syncError: String?

    private let healthKit = HealthKitService.shared
    private let syncService = SyncService.shared
    private let aiService = AIInsightsService.shared

    init() {
        lastSyncDate = SyncService.shared.lastSyncDate
    }

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
            let yesterday = calendar.date(byAdding: .day, value: -1, to: calendar.startOfDay(for: Date())) ?? Date()
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
                let sleepCtx = AIInsightsService.SleepContext(
                    durationMinutes: deep + rem + core,
                    deepMinutes: deep, remMinutes: rem,
                    coreMinutes: core, awakeMinutes: awake
                )
                await MainActor.run { latestSleepContext = sleepCtx }
            }

            // Fetch latest body weight
            if let weight = try? await healthKit.fetchLatest(for: .bodyMass) {
                await MainActor.run { bodyWeightKg = weight }
            }

            // Count workouts this week
            let weekStart = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
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
            syncError = nil
        }

        await syncService.performFullSync()

        await MainActor.run {
            isSyncing = false
            lastSyncDate = syncService.lastSyncDate
            if let err = syncService.syncError {
                syncError = err.localizedDescription
            }
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
            await MainActor.run { self.weeklyData = weekData }
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
            let capturedStreak = streak
            await MainActor.run { currentStreak = capturedStreak }

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
            let capturedSleepStreak = sleepStreakCount
            await MainActor.run { sleepStreak = capturedSleepStreak }

            // Compute workout streak (consecutive days with ≥1 workout, skip today)
            let wCal = Calendar.current
            let sixtyDaysAgo = wCal.date(byAdding: .day, value: -60, to: Date()) ?? Date()
            let allWorkouts = (try? await healthKit.fetchWorkouts(from: sixtyDaysAgo, to: Date())) ?? []
            var workoutDaySet = Set<String>()
            let isoFmt = ISO8601DateFormatter()
            isoFmt.formatOptions = [.withFullDate]
            for workout in allWorkouts {
                workoutDaySet.insert(isoFmt.string(from: wCal.startOfDay(for: workout.startDate)))
            }
            var workoutStreakCount = 0
            var checkDay = wCal.date(byAdding: .day, value: -1, to: wCal.startOfDay(for: Date())) ?? Date()
            for _ in 0..<60 {
                let key = isoFmt.string(from: checkDay)
                if workoutDaySet.contains(key) {
                    workoutStreakCount += 1
                    checkDay = wCal.date(byAdding: .day, value: -1, to: checkDay) ?? Date()
                } else {
                    break
                }
            }
            let capturedWorkoutStreak = workoutStreakCount
            await MainActor.run { workoutStreak = capturedWorkoutStreak }
        } catch {
            // Trends are non-critical, silently fail
        }
    }

    func generatePrimaryInsight() -> String {
        // Sleep-based insight takes precedence when sleep context is available
        if let sleep = latestSleepContext {
            let totalHrs = Double(sleep.durationMinutes) / 60
            let deepPct = sleep.durationMinutes > 0 ? Double(sleep.deepMinutes) / Double(sleep.durationMinutes) * 100 : 0
            if sleep.durationMinutes < 300 {
                return "You slept under 5 hours last night. Prioritise recovery — avoid high-intensity training today."
            }
            if deepPct < 10 && sleep.durationMinutes > 360 {
                return "Your deep sleep was low last night (\(Int(deepPct))%). Recovery may be impaired — consider lighter activity."
            }
            if totalHrs >= 7.5 && recoveryScore >= 75 {
                return "Great sleep and strong recovery (\(recoveryScore)%). An excellent day for a hard training session."
            }
        }
        // Recovery-based insight
        if recoveryScore >= 80 {
            if currentStreak > 0 {
                return "Excellent recovery with a \(currentStreak)-day step streak. Today is ideal for high-intensity training."
            }
            return "Your recovery is excellent (\(recoveryScore)%). Today is ideal for high-intensity training."
        }
        if recoveryScore >= 60 {
            if weeklyWorkoutCount >= 4 {
                return "You're moderately recovered after \(weeklyWorkoutCount) workouts this week. Consider an active recovery session today."
            }
            return "You're moderately recovered (\(recoveryScore)%). A balanced workout or tempo session works well today."
        }
        if strainScore >= 14 {
            return "High strain score (\(String(format: "%.1f", strainScore))/21) with low recovery. Rest or light movement is recommended."
        }
        return "Your recovery is low (\(recoveryScore)%). Prioritize rest, hydration, and light activity today."
    }

    func generateSecondaryInsight() -> String? {
        if let trend = hrvTrend {
            if trend > 10 {
                return "HRV trending up \(trend)% this week — a positive adaptation sign."
            }
            if trend < -15 {
                return "HRV dropped \(abs(trend))% this week — your body may need more recovery."
            }
        }
        if let trend = stepsTrend {
            if trend > 20 {
                return "You're \(trend)% more active than your weekly average. Great momentum!"
            }
            if trend < -30 {
                return "Activity is down \(abs(trend))% vs. your recent average. Try to move more today."
            }
        }
        if sleepStreak > 2 {
            return "\(sleepStreak)-night sleep streak — consistent sleep is a top recovery driver."
        }
        if workoutStreak > 2 {
            return "\(workoutStreak)-day workout streak — impressive consistency!"
        }
        return nil
    }
}

// MARK: - Step Goal Ring

struct StepGoalRingView: View {
    let steps: Int
    let goal: Int
    let calories: Int
    let calorieGoal: Int

    private var stepProgress: Double {
        min(Double(steps) / Double(max(goal, 1)), 1.0)
    }

    private var calProgress: Double {
        min(Double(calories) / Double(max(calorieGoal, 1)), 1.0)
    }

    var body: some View {
        HStack(spacing: 20) {
            // Concentric rings
            ZStack {
                // Outer ring track (steps)
                Circle()
                    .stroke(Color.activity.opacity(0.15), lineWidth: 12)
                    .frame(width: 110, height: 110)

                // Outer ring progress (steps)
                Circle()
                    .trim(from: 0, to: stepProgress)
                    .stroke(Color.activity, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                    .frame(width: 110, height: 110)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.6), value: stepProgress)

                // Inner ring track (calories)
                Circle()
                    .stroke(Color.strain.opacity(0.15), lineWidth: 10)
                    .frame(width: 80, height: 80)

                // Inner ring progress (calories)
                Circle()
                    .trim(from: 0, to: calProgress)
                    .stroke(Color.strain, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .frame(width: 80, height: 80)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.6), value: calProgress)

                // Center text
                VStack(spacing: 0) {
                    Image(systemName: "figure.walk")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text("\(Int((stepProgress * 100).rounded()))%")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .monospacedDigit()
                }
            }
            .frame(width: 110, height: 110)

            // Labels
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Label {
                        Text("\(steps.formatted()) steps")
                            .font(.subheadline.bold())
                    } icon: {
                        Circle().fill(Color.activity).frame(width: 8, height: 8)
                    }
                    Text("Goal: \(goal.formatted())")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Label {
                        Text("\(calories) cal")
                            .font(.subheadline.bold())
                    } icon: {
                        Circle().fill(Color.strain).frame(width: 8, height: 8)
                    }
                    Text("Goal: \(calorieGoal) cal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    DashboardListView()
        .environment(ThemeManager.shared)
}
