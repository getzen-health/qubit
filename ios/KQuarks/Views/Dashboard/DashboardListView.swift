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
    @State private var appearAnimations: [Bool] = Array(repeating: false, count: 8)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Sync error banner
                    if let syncErr = viewModel.syncError {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                            Text(LocalizedStringKey(syncErr))
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
                        DashboardSkeletonView()
                    } else if let summary = viewModel.todaySummary {
                        dashboardContent(summary: summary)
                            .transition(.opacity.combined(with: .move(edge: .bottom)))
                    } else if let error = viewModel.error {
                        errorView(error: error)
                    } else {
                        ContentUnavailableView(
                            "No Health Data Yet",
                            systemImage: "heart.text.square",
                            description: Text("Open the app and sync your Apple Health data to get started.")
                        )
                        .padding(.top, 60)
                    }
                }
            }
            .background(PremiumBackgroundView())
            .animation(.easeOut(duration: 0.35), value: viewModel.isLoading)
            .refreshable {
                await viewModel.loadData()
            }
            .navigationTitle("")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
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
                    #if os(iOS)
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    #endif
                }
            }
            .task {
                await viewModel.loadData()
                todayCheckin = try? await SupabaseService.shared.fetchTodayCheckin()
                triggerEntranceAnimations()
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
        if hour < 12 { return NSLocalizedString("Good morning", comment: "Greeting") }
        if hour < 17 { return NSLocalizedString("Good afternoon", comment: "Greeting") }
        return NSLocalizedString("Good evening", comment: "Greeting")
    }

    private var greetingEmoji: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 6 { return "🌙" }
        if hour < 12 { return "☀️" }
        if hour < 17 { return "🌤️" }
        if hour < 21 { return "🌅" }
        return "🌙"
    }

    @ViewBuilder
    private var greetingHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("\(greetingEmoji) \(greeting)")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.white, .white.opacity(0.7)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )

            Text(Date(), format: .dateTime.weekday(.wide).month(.wide).day())
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func triggerEntranceAnimations() {
        for i in 0..<appearAnimations.count {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(Double(i) * 0.08)) {
                appearAnimations[i] = true
            }
        }
    }

    /// Premium section header with accent line
    @ViewBuilder
    private func sectionHeader(_ title: LocalizedStringKey) -> some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 2)
                .fill(Color.accentColor)
                .frame(width: 3, height: 14)
            Text(title)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white.opacity(0.55))
                .kerning(1.2)
                .textCase(.uppercase)
        }
        .padding(.horizontal, 16)
    }

    @ViewBuilder
    private func dashboardContent(summary: TodayHealthSummary) -> some View {
        VStack(spacing: 24) {
            // Premium Greeting Header
            greetingHeader
                .padding(.horizontal, 16)
                .opacity(appearAnimations[0] ? 1 : 0)
                .offset(y: appearAnimations[0] ? 0 : 20)

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
            .opacity(appearAnimations[1] ? 1 : 0)
            .offset(y: appearAnimations[1] ? 0 : 30)

            // Quick Stats Grid
            QuickStatsView(
                stats: buildQuickStats(summary: summary)
            )
            .padding(.horizontal, 16)
            .opacity(appearAnimations[2] ? 1 : 0)
            .offset(y: appearAnimations[2] ? 0 : 30)

            // Weekly Step Chart
            if !viewModel.weeklyData.isEmpty {
                DashboardWeeklyChartView(
                    weekData: viewModel.weeklyData,
                    stepGoal: GoalService.shared.stepsGoal
                )
                .padding(.horizontal, 16)
                .opacity(appearAnimations[3] ? 1 : 0)
                .offset(y: appearAnimations[3] ? 0 : 30)
            }

            // Primary Metrics Stream
            metricsSection(title: "Today's Metrics", summary: summary)
                .opacity(appearAnimations[4] ? 1 : 0)
                .offset(y: appearAnimations[4] ? 0 : 30)

            // Activity Stream
            activitySection(summary: summary)
                .opacity(appearAnimations[5] ? 1 : 0)
                .offset(y: appearAnimations[5] ? 0 : 30)

            // Wellbeing section: check-in card + 2-column tile grid
            VStack(alignment: .leading, spacing: 10) {
                sectionHeader("Wellbeing")

                // Check-in stays as a full-width card
                CheckinDashboardCard(checkin: todayCheckin) {
                    showCheckin = true
                }
                .padding(.horizontal, 16)

                // Tile grid — curated color palette by health category
                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                    spacing: 12
                ) {
                    // Hydration & Nutrition
                    NavigationLink(destination: WaterTrackingView()) {
                        DashboardTileCard(icon: "drop.fill", title: "Hydration", subtitle: "Log water intake", color: .cyan)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: FastingView()) {
                        DashboardTileCard(icon: "timer", title: "Fasting", subtitle: "Track your window", color: .orange)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: FoodScannerView()) {
                        DashboardTileCard(icon: "barcode.viewfinder", title: "Food Scanner", subtitle: "QuarkScore™", color: .green)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: NutritionView()) {
                        DashboardTileCard(icon: "fork.knife", title: "Nutrition", subtitle: "Macros & meals", color: .orange)
                    }.buttonStyle(.plain)

                    // Mind & Wellness
                    NavigationLink(destination: MoodView()) {
                        DashboardTileCard(icon: "face.smiling", title: "Mood", subtitle: "Track feelings", color: Color(red: 1.0, green: 0.8, blue: 0.3))
                    }.buttonStyle(.plain)

                    NavigationLink(destination: MindfulnessView()) {
                        DashboardTileCard(icon: "brain.head.profile", title: "Mindfulness", subtitle: "Meditate & reflect", color: .teal)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: BreathingView()) {
                        DashboardTileCard(icon: "wind", title: "Breathing", subtitle: "Calm your mind", color: .mint)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: StressView()) {
                        DashboardTileCard(icon: "waveform.path.ecg", title: "Stress", subtitle: "HRV analysis", color: Color(red: 1.0, green: 0.55, blue: 0.4))
                    }.buttonStyle(.plain)

                    // Activity & Fitness
                    NavigationLink(destination: HabitsView()) {
                        DashboardTileCard(icon: "checklist", title: "Habits", subtitle: "Daily streaks", color: .green)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: RunningView()) {
                        DashboardTileCard(icon: "figure.run", title: "Running", subtitle: "Pace & cadence", color: Color(red: 0.35, green: 0.85, blue: 0.45))
                    }.buttonStyle(.plain)

                    NavigationLink(destination: RecoveryView()) {
                        DashboardTileCard(icon: "bolt.heart.fill", title: "Recovery", subtitle: "HRV & readiness", color: Color(red: 0.4, green: 0.8, blue: 1.0))
                    }.buttonStyle(.plain)

                    NavigationLink(destination: LeaderboardView()) {
                        DashboardTileCard(icon: "flame.fill", title: "Leaderboard", subtitle: "Step streaks", color: .orange)
                    }.buttonStyle(.plain)

                    // Body & Health
                    NavigationLink(destination: BodyMeasurementsView()) {
                        DashboardTileCard(icon: "ruler", title: "Measurements", subtitle: "Body metrics", color: .mint)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: SupplementsView()) {
                        DashboardTileCard(icon: "pills.fill", title: "Supplements", subtitle: "Daily stack", color: Color(red: 0.45, green: 0.85, blue: 0.65))
                    }.buttonStyle(.plain)

                    NavigationLink(destination: CycleView()) {
                        DashboardTileCard(icon: "calendar", title: "Cycle", subtitle: "Period tracking", color: .pink)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: GLP1View()) {
                        DashboardTileCard(icon: "syringe.fill", title: "GLP-1", subtitle: "Zepbound tracker", color: .teal)
                    }.buttonStyle(.plain)

                    // Tools & Reports
                    NavigationLink(destination: WeeklyBalanceView()) {
                        DashboardTileCard(icon: "chart.bar.xaxis", title: "Weekly Balance", subtitle: "Cardio · Strength", color: Color(red: 0.4, green: 0.7, blue: 1.0))
                    }.buttonStyle(.plain)

                    NavigationLink(destination: ReportView()) {
                        DashboardTileCard(icon: "doc.text.magnifyingglass", title: "Doctor Report", subtitle: "Share as PDF", color: .cyan)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: CorrelationsView()) {
                        DashboardTileCard(icon: "chart.dots.scatter", title: "Correlations", subtitle: "Find patterns", color: Color(red: 0.5, green: 0.7, blue: 0.95))
                    }.buttonStyle(.plain)

                    NavigationLink(destination: ImportView()) {
                        DashboardTileCard(icon: "square.and.arrow.down.on.square", title: "Import Data", subtitle: "Garmin · Oura", color: Color(red: 0.6, green: 0.6, blue: 0.65))
                    }.buttonStyle(.plain)

                    NavigationLink(destination: InsightsView()) {
                        DashboardTileCard(icon: "sparkles", title: "Insights", subtitle: "AI analysis", color: .teal)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: SettingsView()) {
                        DashboardTileCard(icon: "gearshape", title: "Settings", subtitle: "Preferences", color: Color(red: 0.55, green: 0.55, blue: 0.6))
                    }.buttonStyle(.plain)
                }
                .padding(.horizontal, 16)
            }
            .opacity(appearAnimations[6] ? 1 : 0)
            .offset(y: appearAnimations[6] ? 0 : 30)

            // AI Insights
            InsightsSectionView(insights: viewModel.insights)
                .padding(.horizontal, 16)
                .opacity(appearAnimations[7] ? 1 : 0)
                .offset(y: appearAnimations[7] ? 0 : 30)

            // AI Features — tile grid
            VStack(alignment: .leading, spacing: 10) {
                sectionHeader("AI Features")
                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                    spacing: 12
                ) {
                    NavigationLink(destination: BriefingHistoryView()) {
                        DashboardTileCard(icon: "sun.horizon.fill", title: "Morning Briefing", subtitle: "Daily AI summary", color: .orange)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: AnomalyAlertView()) {
                        DashboardTileCard(icon: "exclamationmark.triangle.fill", title: "Health Alerts", subtitle: "Anomaly detection", color: Color(red: 1.0, green: 0.45, blue: 0.40))
                    }.buttonStyle(.plain)

                    NavigationLink(destination: HealthChatView()) {
                        DashboardTileCard(icon: "bubble.left.and.bubble.right.fill", title: "Health Coach", subtitle: "Ask your data", color: .teal)
                    }.buttonStyle(.plain)

                    NavigationLink(destination: CoachingView()) {
                        DashboardTileCard(icon: "brain.head.profile", title: "AI Coach", subtitle: "Personalized plans", color: .mint, badge: "AI")
                    }.buttonStyle(.plain)

                    NavigationLink(destination: PredictiveInsightsView()) {
                        DashboardTileCard(icon: "calendar.badge.clock", title: "Week Ahead", subtitle: "Predicted trends", color: .cyan)
                    }.buttonStyle(.plain)
                }
                .padding(.horizontal, 16)
            }

            // Last synced footer
            if let last = viewModel.lastSyncDate {
                Label {
                    Text(String(format: NSLocalizedString("Synced %@ ago", comment: "Last sync time"), last.formatted(.relative(presentation: .named))))
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
        // Always return exactly 4 stats for a clean 2×2 grid
        let sleepValue = summary.formattedSleep ?? "--"
        let hrvValue: String
        let hrvUnit: String?
        let hrvTrendValue: Int?
        if let hrv = summary.hrv {
            hrvValue = "\(Int(hrv))"
            hrvUnit = "ms"
            hrvTrendValue = viewModel.hrvTrend
        } else {
            hrvValue = "\(viewModel.recoveryScore)"
            hrvUnit = "%"
            hrvTrendValue = viewModel.recoveryTrend
        }

        return [
            QuickStat(
                label: "Steps",
                value: summary.steps.formatted(),
                trend: viewModel.stepsTrend,
                color: .activity,
                icon: "figure.walk"
            ),
            QuickStat(
                label: "Sleep",
                value: sleepValue,
                color: .sleep,
                icon: "moon.fill"
            ),
            QuickStat(
                label: "Calories",
                value: "\(Int(summary.activeCalories))",
                unit: "kcal",
                color: .strain,
                icon: "flame.fill"
            ),
            QuickStat(
                label: summary.hrv != nil ? "HRV" : "Recovery",
                value: hrvValue,
                unit: hrvUnit,
                trend: hrvTrendValue,
                color: .heart,
                icon: summary.hrv != nil ? "waveform.path.ecg" : "bolt.fill"
            ),
        ]
    }

    @ViewBuilder
    private func metricsSection(title: LocalizedStringKey, summary: TodayHealthSummary) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionHeader(title)

            VStack(spacing: 0) {
                // Recovery
                MetricRowView(
                    icon: "bolt.fill",
                    label: "Recovery",
                    value: "\(viewModel.recoveryScore)",
                    unit: "%",
                    sublabel: LocalizedStringKey(RecoveryLevel.from(score: viewModel.recoveryScore).label),
                    trend: viewModel.recoveryTrend,
                    color: .recovery
                )

                // Body Battery
                MetricRowView(
                    icon: "battery.75percent",
                    label: "Body Battery",
                    value: "\(viewModel.bodyBatteryScore)",
                    unit: "%",
                    sublabel: LocalizedStringKey(viewModel.bodyBatteryLabel),
                    color: .recovery
                )

                // Stress Score (HRV-based, WHOOP/Bevel research)
                NavigationLink(destination: StressView()) {
                    MetricRowView(
                        icon: "waveform.path.ecg",
                        label: "Stress",
                        value: "\(viewModel.stressScore)",
                        unit: "%",
                        sublabel: LocalizedStringKey(viewModel.stressLabel),
                        color: viewModel.stressScore >= 50 ? .strain : .recovery
                    )
                }

                // Strain
                MetricRowView(
                    icon: "flame.fill",
                    label: "Strain",
                    value: String(format: "%.1f", viewModel.strainScore),
                    unit: "/21",
                    sublabel: LocalizedStringKey(StrainLevel.from(score: viewModel.strainScore).label),
                    trend: viewModel.strainTrend,
                    color: .strain
                )

                // Sleep
                if let formattedSleep = summary.formattedSleep {
                    let sleepSublabel: String = {
                        guard let ctx = viewModel.latestSleepContext, ctx.durationMinutes > 0 else { return "" }
                        let deepPct = Int(Double(ctx.deepMinutes) / Double(ctx.durationMinutes) * 100)
                        return String(format: NSLocalizedString("%d%% deep sleep", comment: "Sleep sublabel"), deepPct)
                    }()

                    MetricRowView(
                        icon: "moon.fill",
                        label: "Sleep",
                        value: formattedSleep,
                        sublabel: sleepSublabel.isEmpty ? nil : LocalizedStringKey(sleepSublabel),
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
                        unit: viewModel.sleepStreak == 1 ? NSLocalizedString("night", comment: "") : NSLocalizedString("nights", comment: ""),
                        sublabel: LocalizedStringKey(NSLocalizedString("consecutive nights of 7+ hours", comment: "Sleep streak")),
                        color: .sleep
                    )
                }

                // Sleep debt (Walker methodology)
                let debtH = viewModel.sleepDebtMinutes / 60
                let debtM = viewModel.sleepDebtMinutes % 60
                if viewModel.sleepDebtMinutes > 0 {
                    MetricRowView(
                        icon: "bed.double.fill",
                        label: "Sleep Debt",
                        value: debtH > 0 ? "\(debtH)h \(debtM)m" : "\(debtM)m",
                        unit: NSLocalizedString("this week", comment: "Sleep debt period"),
                        sublabel: debtH >= 5
                            ? LocalizedStringKey(NSLocalizedString("High — prioritize rest", comment: "Sleep debt"))
                            : debtH >= 2
                                ? LocalizedStringKey(NSLocalizedString("Moderate debt", comment: "Sleep debt"))
                                : LocalizedStringKey(NSLocalizedString("Minor deficit", comment: "Sleep debt")),
                        color: debtH >= 5 ? .strain : .sleep
                    )
                }

                // Sleep regularity
                if let consistency = viewModel.sleepConsistencyScore {
                    MetricRowView(
                        icon: "clock.badge.checkmark.fill",
                        label: "Sleep Regularity",
                        value: "\(consistency)",
                        unit: "%",
                        sublabel: consistency >= 80
                            ? LocalizedStringKey(NSLocalizedString("Consistent schedule", comment: "Sleep regularity"))
                            : consistency >= 60
                                ? LocalizedStringKey(NSLocalizedString("Moderate variation", comment: "Sleep regularity"))
                                : LocalizedStringKey(NSLocalizedString("High variation", comment: "Sleep regularity")),
                        color: consistency >= 80 ? .recovery : .sleep
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
            .glassCard(cornerRadius: 16, shadowRadius: 12, shadowY: 6)
            .padding(.horizontal, 16)
        }
    }

    @ViewBuilder
    private func activitySection(summary: TodayHealthSummary) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionHeader("Activity")

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
                    sublabel: LocalizedStringKey(String(format: NSLocalizedString("%d%% of goal", comment: "Goal percentage"), Int(Double(summary.steps) / GoalService.shared.stepsGoal * 100))),
                    trend: viewModel.stepsTrend,
                    color: .activity,
                    destination: AnyView(HealthMetricDetailView(dataType: .steps))
                )

                MetricRowView(
                    icon: "flame.fill",
                    label: "Active Calories",
                    value: "\(Int(summary.activeCalories))",
                    unit: "cal",
                    sublabel: LocalizedStringKey(String(format: NSLocalizedString("%d cal goal", comment: "Calorie goal"), Int(GoalService.shared.activeCaloriesGoal))),
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
                        unit: viewModel.currentStreak == 1 ? NSLocalizedString("day", comment: "") : NSLocalizedString("days", comment: ""),
                        sublabel: LocalizedStringKey(NSLocalizedString("consecutive days at goal", comment: "Step streak")),
                        color: .orange
                    )
                }

                if viewModel.weeklyWorkoutCount > 0 {
                    MetricRowView(
                        icon: "figure.mixed.cardio",
                        label: "Workouts This Week",
                        value: "\(viewModel.weeklyWorkoutCount)",
                        unit: viewModel.weeklyWorkoutCount == 1 ? NSLocalizedString("session", comment: "") : NSLocalizedString("sessions", comment: ""),
                        color: .activity
                    )
                }

                if viewModel.workoutStreak > 0 {
                    MetricRowView(
                        icon: "figure.run",
                        label: "Workout Streak",
                        value: "\(viewModel.workoutStreak)",
                        unit: viewModel.workoutStreak == 1 ? NSLocalizedString("day", comment: "") : NSLocalizedString("days", comment: ""),
                        sublabel: LocalizedStringKey(NSLocalizedString("consecutive days with a workout", comment: "Workout streak")),
                        color: .activity
                    )
                }
            }
            .glassCard(cornerRadius: 16, shadowRadius: 12, shadowY: 6)
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

            Text(LocalizedStringKey(error))
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
@MainActor
class DashboardListViewModel {
    var todaySummary: TodayHealthSummary?
    var insights: [HealthInsight] = []
    var isLoading = true
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

    // Personal baselines (14-day rolling, computed in calculateTrends)
    // Inspired by WHOOP (30-day) and Oura (14/60-day) personalized baseline approach
    var baselineHrv: Double? = nil
    var baselineRhr: Double? = nil
    var baselineSleepMinutes: Double? = nil
    var todayRhr: Double? = nil

    /// 7-day sleep debt in minutes (Walker 2017 methodology: sum of daily deficits vs personal goal)
    var sleepDebtMinutes: Int {
        let goal = Int(GoalService.shared.sleepGoalMinutes)
        return weeklyData.prefix(7).reduce(0) { debt, day in
            debt + max(0, goal - (day.sleepDurationMinutes ?? goal))
        }
    }

    /// Sleep regularity score 0–100 (Oura methodology: stddev of 7-day durations)
    var sleepConsistencyScore: Int? {
        let durations = weeklyData.prefix(7).compactMap { $0.sleepDurationMinutes }.map { Double($0) }
        guard durations.count >= 3 else { return nil }
        let avg = durations.reduce(0, +) / Double(durations.count)
        let variance = durations.reduce(0) { $0 + pow($1 - avg, 2) } / Double(durations.count)
        let stddev = sqrt(variance)
        return max(0, Int(100 - (stddev / 90) * 100))
    }

    /// Body Battery: personalized energy estimate (0–100).
    /// Algorithm based on WHOOP/Oura research:
    ///   HRV vs personal 14-day baseline: 60%
    ///   RHR vs personal 14-day baseline (inverse): 20%
    ///   Sleep performance vs personal baseline: 20%
    var bodyBatteryScore: Int {
        var score: Double = 50 // default if no baseline data

        let todayHrv = weeklyData.first?.avgHrv

        if let todayHrv, let baseline = baselineHrv, baseline > 0 {
            // HRV above baseline = good recovery. Range: -40% to +40% maps to 0–100
            let deviation = (todayHrv - baseline) / baseline
            let hrvScore = max(0, min(100, 50 + deviation * 125))

            var rhrScore: Double = 50
            if let rhr = todayRhr, let rhrBaseline = baselineRhr, rhrBaseline > 0 {
                // Lower RHR than baseline = better recovery
                let rhrDev = (rhrBaseline - rhr) / rhrBaseline
                rhrScore = max(0, min(100, 50 + rhrDev * 200))
            }

            var sleepScore: Double = 50
            if let ctx = latestSleepContext, ctx.durationMinutes > 0,
               let sleepBaseline = baselineSleepMinutes, sleepBaseline > 0 {
                // Sleep vs personal norm (not hard 8h target)
                let sleepPerf = Double(ctx.durationMinutes) / sleepBaseline
                let deepPct = Double(ctx.deepMinutes) / Double(ctx.durationMinutes)
                let remPct = Double(ctx.remMinutes) / Double(ctx.durationMinutes)
                let qualityBonus = (deepPct * 0.2) + (remPct * 0.1)
                sleepScore = max(0, min(100, (min(sleepPerf, 1.2) * 80) + qualityBonus * 100))
            } else if let ctx = latestSleepContext, ctx.durationMinutes > 0 {
                // Fallback: use 7h as soft target when no baseline
                let hours = Double(ctx.durationMinutes) / 60.0
                sleepScore = max(0, min(100, (hours / 7.0) * 100))
            }

            score = hrvScore * 0.6 + rhrScore * 0.2 + sleepScore * 0.2
        } else {
            // No HRV data: fall back to recovery score + sleep
            let sleepScore: Double = {
                guard let ctx = latestSleepContext, ctx.durationMinutes > 0 else { return Double(recoveryScore) }
                let hours = Double(ctx.durationMinutes) / 60.0
                return min(100, max(0, (hours / 7.5) * 100))
            }()
            score = Double(recoveryScore) * 0.6 + sleepScore * 0.4
        }

        return max(0, min(100, Int(score)))
    }

    var bodyBatteryLabel: String {
        switch bodyBatteryScore {
        case 75...100: return NSLocalizedString("Fully charged", comment: "Body battery label")
        case 50..<75:  return NSLocalizedString("Good energy", comment: "Body battery label")
        case 25..<50:  return NSLocalizedString("Draining", comment: "Body battery label")
        default:       return NSLocalizedString("Depleted", comment: "Body battery label")
        }
    }

    /// HRV-based stress score (0–100): WHOOP/Bevel physiological stress signal
    /// 0 = no stress (HRV at or above baseline); 100 = high stress (HRV >40% below baseline)
    var stressScore: Int {
        guard let todayHrv = weeklyData.first?.avgHrv,
              let baseline = baselineHrv, baseline > 0 else { return 30 }
        let deficit = max(0, baseline - todayHrv) / baseline
        return max(0, min(100, Int(deficit * 250)))
    }

    var stressLabel: String {
        switch stressScore {
        case 0..<25:  return NSLocalizedString("Low", comment: "Stress label")
        case 25..<50: return NSLocalizedString("Moderate", comment: "Stress label")
        case 50..<75: return NSLocalizedString("Elevated", comment: "Stress label")
        default:      return NSLocalizedString("High", comment: "Stress label")
        }
    }

    private let healthKit = HealthKitService.shared
    private let syncService = SyncService.shared
    private let aiService = AIInsightsService.shared

    init() {
        lastSyncDate = SyncService.shared.lastSyncDate
    }

    func loadData() async {
                isLoading = true
        error = nil
    

        do {
            let summary = try await healthKit.fetchTodaySummary()
                        todaySummary = summary
            isLoading = false
        

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
                 latestSleepContext = sleepCtx 
            }

            // Fetch latest body weight
            if let weight = try? await healthKit.fetchLatest(for: .bodyMass) {
                 bodyWeightKg = weight 
            }

            // Count workouts this week
            let weekStart = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
            let weekWorkouts = (try? await healthKit.fetchWorkouts(from: weekStart, to: Date())) ?? []
             weeklyWorkoutCount = weekWorkouts.count 

            // Load cached AI scores if available
            if let cachedRecovery = aiService.latestRecoveryScore {
                 recoveryScore = cachedRecovery 
            }
            if let cachedStrain = aiService.latestStrainScore {
                 strainScore = cachedStrain 
            }

            // Load insights from Supabase
            if let fetchedInsights = try? await SupabaseService.shared.fetchInsights() {
                 insights = fetchedInsights 
            }

            // Calculate trends from week data
            await calculateTrends()

        } catch {
                        self.error = error.localizedDescription
            isLoading = false
        
        }
    }

    func sync() async {
                isSyncing = true
        syncError = nil
    

        await syncService.performFullSync()

                isSyncing = false
        lastSyncDate = syncService.lastSyncDate
        if let err = syncService.syncError {
            syncError = err.localizedDescription
        
        }

        await loadData()
    }

    func refreshAIInsights() async {
        let result = await aiService.generateInsights()
        if let result = result {
                        recoveryScore = result.recoveryScore
            strainScore = result.strainScore
        
            // Reload insights from DB
            if let fetchedInsights = try? await SupabaseService.shared.fetchInsights() {
                 insights = fetchedInsights 
            }
        }
    }

    private func calculateTrends() async {
        do {
            // Fetch 14 days for personalized baseline (WHOOP/Oura approach)
            let weekData = try await healthKit.fetchWeekSummaries(days: 14)
            self.weeklyData = weekData
            guard weekData.count >= 2 else { return }

            let todaySteps = weekData.first?.steps ?? 0
            let avgSteps = weekData.dropFirst().reduce(0) { $0 + $1.steps } / max(weekData.count - 1, 1)
            if avgSteps > 0 {
                stepsTrend = Int(((Double(todaySteps) - Double(avgSteps)) / Double(avgSteps)) * 100)
            }

            // HRV: compare today vs 14-day personal baseline (WHOOP methodology)
            let todayHrv = weekData.first?.avgHrv
            let hrvValues = weekData.dropFirst().compactMap { $0.avgHrv }
            if let todayHrv, !hrvValues.isEmpty {
                let baselineHrv = hrvValues.reduce(0, +) / Double(hrvValues.count)
                if baselineHrv > 0 {
                    hrvTrend = Int(((todayHrv - baselineHrv) / baselineHrv) * 100)
                }
                // Store baseline HRV for body battery calculation
                self.baselineHrv = baselineHrv
            }

            // RHR: compare today vs 14-day personal baseline
            let todayRhr = weekData.first?.restingHeartRate
            let rhrValues = weekData.dropFirst().compactMap { $0.restingHeartRate }
            if let todayRhr, !rhrValues.isEmpty {
                let baselineRhr = Double(rhrValues.reduce(0, +)) / Double(rhrValues.count)
                if baselineRhr > 0 {
                    self.baselineRhr = baselineRhr
                    self.todayRhr = Double(todayRhr)
                }
            }

            // Sleep baseline: personal avg from last 14 days
            let sleepValues = weekData.dropFirst().compactMap { $0.sleepDurationMinutes }
            if !sleepValues.isEmpty {
                self.baselineSleepMinutes = Double(sleepValues.reduce(0, +)) / Double(sleepValues.count)
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
             currentStreak = capturedStreak 

            // Compute sleep streak (newest first, skip today)
            let sleepGoalMinutes = Int(GoalService.shared.sleepGoalMinutes)
            var sleepStreakCount = 0
            for day in streakData.dropFirst() {
                if (day.sleepDurationMinutes ?? 0) >= sleepGoalMinutes {
                    sleepStreakCount += 1
                } else {
                    break
                }
            }
            let capturedSleepStreak = sleepStreakCount
             sleepStreak = capturedSleepStreak 

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
             workoutStreak = capturedWorkoutStreak 
        } catch {
            // Trends are non-critical, silently fail
        }
    }

    func generatePrimaryInsight() -> String {
        if let sleep = latestSleepContext {
            let totalHrs = Double(sleep.durationMinutes) / 60
            let deepPct = sleep.durationMinutes > 0 ? Double(sleep.deepMinutes) / Double(sleep.durationMinutes) * 100 : 0
            if sleep.durationMinutes < 300 {
                return NSLocalizedString("You slept under 5 hours last night. Prioritise recovery — avoid high-intensity training today.", comment: "Insight")
            }
            if deepPct < 10 && sleep.durationMinutes > 360 {
                return String(format: NSLocalizedString("Your deep sleep was low last night (%d%%). Recovery may be impaired — consider lighter activity.", comment: "Insight"), Int(deepPct))
            }
            if totalHrs >= 7.5 && recoveryScore >= 75 {
                return String(format: NSLocalizedString("Great sleep and strong recovery (%d%%). An excellent day for a hard training session.", comment: "Insight"), recoveryScore)
            }
        }
        if recoveryScore >= 80 {
            if currentStreak > 0 {
                return String(format: NSLocalizedString("Excellent recovery with a %d-day step streak. Today is ideal for high-intensity training.", comment: "Insight"), currentStreak)
            }
            return String(format: NSLocalizedString("Your recovery is excellent (%d%%). Today is ideal for high-intensity training.", comment: "Insight"), recoveryScore)
        }
        if recoveryScore >= 60 {
            if weeklyWorkoutCount >= 4 {
                return String(format: NSLocalizedString("You're moderately recovered after %d workouts this week. Consider an active recovery session today.", comment: "Insight"), weeklyWorkoutCount)
            }
            return String(format: NSLocalizedString("You're moderately recovered (%d%%). A balanced workout or tempo session works well today.", comment: "Insight"), recoveryScore)
        }
        if strainScore >= 14 {
            return String(format: NSLocalizedString("High strain score (%@/21) with low recovery. Rest or light movement is recommended.", comment: "Insight"), String(format: "%.1f", strainScore))
        }
        return String(format: NSLocalizedString("Your recovery is low (%d%%). Prioritize rest, hydration, and light activity today.", comment: "Insight"), recoveryScore)
    }

    func generateSecondaryInsight() -> String? {
        if let trend = hrvTrend {
            if trend > 10 {
                return String(format: NSLocalizedString("HRV trending up %d%% this week — a positive adaptation sign.", comment: "Insight"), trend)
            }
            if trend < -15 {
                return String(format: NSLocalizedString("HRV dropped %d%% this week — your body may need more recovery.", comment: "Insight"), abs(trend))
            }
        }
        if let trend = stepsTrend {
            if trend > 20 {
                return String(format: NSLocalizedString("You're %d%% more active than your weekly average. Great momentum!", comment: "Insight"), trend)
            }
            if trend < -30 {
                return String(format: NSLocalizedString("Activity is down %d%% vs. your recent average. Try to move more today.", comment: "Insight"), abs(trend))
            }
        }
        if sleepStreak > 2 {
            return String(format: NSLocalizedString("%d-night sleep streak — consistent sleep is a top recovery driver.", comment: "Insight"), sleepStreak)
        }
        if workoutStreak > 2 {
            return String(format: NSLocalizedString("%d-day workout streak — impressive consistency!", comment: "Insight"), workoutStreak)
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
                        Text(String(format: NSLocalizedString("%@ steps", comment: "Step count"), steps.formatted()))
                            .font(.subheadline.bold())
                    } icon: {
                        Circle().fill(Color.activity).frame(width: 8, height: 8)
                    }
                    Text(String(format: NSLocalizedString("Goal: %@", comment: "Goal format"), goal.formatted()))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Label {
                        Text(String(format: NSLocalizedString("%d cal", comment: "Calorie count"), calories))
                            .font(.subheadline.bold())
                    } icon: {
                        Circle().fill(Color.strain).frame(width: 8, height: 8)
                    }
                    Text(String(format: NSLocalizedString("Goal: %d cal", comment: "Calorie goal"), calorieGoal))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding(16)
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    DashboardListView()
        .environment(ThemeManager.shared)
}
