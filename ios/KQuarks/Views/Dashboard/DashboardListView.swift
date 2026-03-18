import SwiftUI

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
                ) {
                    AnyView(recoveryDetails)
                }

                // Strain
                MetricRowView(
                    icon: "flame.fill",
                    label: "Strain",
                    value: String(format: "%.1f", viewModel.strainScore),
                    unit: "/21",
                    sublabel: StrainLevel.from(score: viewModel.strainScore).label,
                    trend: viewModel.strainTrend,
                    color: .strain
                ) {
                    AnyView(strainDetails)
                }

                // Sleep
                if let formattedSleep = summary.formattedSleep {
                    MetricRowView(
                        icon: "moon.fill",
                        label: "Sleep",
                        value: formattedSleep,
                        sublabel: "85% quality",
                        color: .sleep
                    ) {
                        AnyView(sleepDetails)
                    }
                }

                // Heart Rate
                if let rhr = summary.restingHeartRate {
                    MetricRowView(
                        icon: "heart.fill",
                        label: "Resting Heart Rate",
                        value: "\(rhr)",
                        unit: "bpm",
                        color: .heart
                    ) {
                        AnyView(heartDetails(summary: summary))
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

            VStack(spacing: 0) {
                MetricRowView(
                    icon: "figure.walk",
                    label: "Steps",
                    value: summary.steps.formatted(),
                    unit: "/ 10,000",
                    sublabel: "\(Int(Double(summary.steps) / 10000.0 * 100))% of goal",
                    trend: viewModel.stepsTrend,
                    color: .activity
                )

                MetricRowView(
                    icon: "flame.fill",
                    label: "Active Calories",
                    value: "\(Int(summary.activeCalories))",
                    unit: "cal",
                    sublabel: "500 cal goal",
                    color: .strain
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
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 16)
        }
    }

    private var recoveryDetails: some View {
        VStack(spacing: 8) {
            MetricDetailRow(label: "Sleep Performance", value: "85%")
            MetricDetailRow(label: "Sleep Consistency", value: "92%")
            MetricDetailRow(label: "Respiratory Rate", value: "14.5 br/min")
            MetricDetailRow(label: "Skin Temperature", value: "+0.2°C")
        }
    }

    private var strainDetails: some View {
        VStack(spacing: 8) {
            MetricDetailRow(label: "Cardiovascular", value: "12.8")
            MetricDetailRow(label: "Muscular", value: "8.5")
            MetricDetailRow(label: "Peak HR", value: "172 bpm")
            MetricDetailRow(label: "Active Minutes", value: "127 min")
        }
    }

    private var sleepDetails: some View {
        VStack(spacing: 8) {
            MetricDetailRow(label: "Deep Sleep", value: "1h 23m", color: .sleep)
            MetricDetailRow(label: "REM", value: "1h 45m", color: .hrv)
            MetricDetailRow(label: "Light", value: "3h 52m", color: .secondary)
            MetricDetailRow(label: "Awake", value: "22m", color: .warning)
        }
    }

    private func heartDetails(summary: TodayHealthSummary) -> some View {
        VStack(spacing: 8) {
            if let hrv = summary.hrv {
                MetricDetailRow(label: "HRV", value: "\(Int(hrv)) ms")
            }
            MetricDetailRow(label: "Max HR Today", value: "142 bpm")
            MetricDetailRow(label: "7-day Average", value: "59 bpm")
        }
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
