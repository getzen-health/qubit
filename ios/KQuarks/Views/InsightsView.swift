import SwiftUI

struct InsightsView: View {
    @State private var insights: [InsightItem] = []
    @State private var isLoading = true
    @State private var showPaywall = false
    @State private var subscriptionService = SubscriptionService.shared

    var body: some View {
        NavigationStack {
            ZStack {
                PremiumBackgroundView()
                ScrollView {
                    if !subscriptionService.isPro {
                        InsightsProTeaserView(showPaywall: $showPaywall)
                    } else if isLoading {
                        ProgressView()
                            .padding(.top, 100)
                    } else if insights.isEmpty {
                        InsightsEmptyStateView()
                    } else {
                        LazyVStack(spacing: 16) {
                            ForEach(insights) { insight in
                                InsightCard(insight: insight)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Insights")
            .toolbarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .preferredColorScheme(.dark)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    HStack(spacing: 4) {
                        NavigationLink(destination: HealthTimelineView()) {
                            Image(systemName: "list.bullet.rectangle")
                        }
                        NavigationLink(destination: YearInReviewView()) {
                            Image(systemName: "calendar.badge.clock")
                        }
                        NavigationLink(destination: WeeklyReportView()) {
                            Image(systemName: "calendar.badge.checkmark")
                        }
                        NavigationLink(destination: CorrelationInsightsView()) {
                            Image(systemName: "chart.line.text.clipboard")
                        }
                        NavigationLink(destination: WorkoutSleepImpactView()) {
                            Image(systemName: "figure.run.circle")
                        }
                        NavigationLink(destination: MonthlyHealthSummaryView()) {
                            Image(systemName: "calendar.circle")
                        }
                        NavigationLink(destination: SmartNudgesView()) {
                            Image(systemName: "wand.and.stars")
                        }
                        NavigationLink(destination: HealthHeatmapView()) {
                            Image(systemName: "tablecells.fill")
                        }
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        if subscriptionService.isPro {
                            Task { await generateInsights() }
                        } else {
                            showPaywall = true
                        }
                    } label: {
                        Image(systemName: "sparkles")
                    }
                }
            }
            .task {
                if subscriptionService.isPro {
                    await loadInsights()
                }
            }
            .refreshable {
                if subscriptionService.isPro {
                    await loadInsights()
                }
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView()
            }
        }
    }

    private func loadInsights() async {
        isLoading = true
        do {
            let healthInsights = try await SupabaseService.shared.fetchInsights()
            insights = healthInsights.map { insight in
                InsightItem(
                    date: insight.createdAt,
                    category: InsightCategory.from(string: insight.category),
                    title: insight.title,
                    content: insight.content,
                    priority: insight.priority == "high" ? .high : (insight.priority == "low" ? .low : .normal)
                )
            }
        } catch {
            // Fall back to empty state if not authenticated or no data
            insights = []
        }
        isLoading = false
    }

    private func generateInsights() async {
        isLoading = true
        let result = await AIInsightsService.shared.generateInsights()
        if let result = result {
            insights = result.insights.map { insight in
                InsightItem(
                    date: Date(),
                    category: InsightCategory.from(string: insight.category),
                    title: insight.title,
                    content: insight.content,
                    priority: insight.priority == "high" ? .high : (insight.priority == "low" ? .low : .normal)
                )
            }
        }
        isLoading = false
    }
}

// MARK: - Pro Teaser (non-Pro users)

struct InsightsProTeaserView: View {
    @Binding var showPaywall: Bool

    var body: some View {
        VStack(spacing: 24) {
            // Blurred sample insight card
            InsightCard(insight: InsightItem.samples[0])
                .blur(radius: 6)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.premiumBackground.opacity(0.4))
                )
                .allowsHitTesting(false)

            VStack(spacing: 12) {
                Image(systemName: "crown.fill")
                    .font(.system(size: 40))
                    .foregroundStyle(.yellow)

                Text("AI Insights are a Pro feature")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.85))
                    .multilineTextAlignment(.center)

                Text("Upgrade to KQuarks Pro for daily AI-powered health insights, trend analysis, and more.")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.4))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                Button("Unlock with Pro") {
                    showPaywall = true
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
        }
        .padding(.top, 32)
        .padding(.horizontal)
    }
}

// MARK: - Empty State

struct InsightsEmptyStateView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 60))
                .foregroundStyle(.orange)

            Text("No Insights Yet")
                .font(.title2.bold())
                .foregroundStyle(.white.opacity(0.85))

            Text("Once you have enough health data, AI-powered insights will appear here.")
                .font(.body)
                .foregroundStyle(.white.opacity(0.4))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 100)
    }
}

// MARK: - Insight Card

struct InsightCard: View {
    let insight: InsightItem

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: insight.category.icon)
                    .foregroundStyle(insight.category.color)

                Text(insight.category.title)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.4))

                Spacer()

                Text(insight.date, style: .date)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.4))
            }

            Text(insight.title)
                .font(.headline)
                .foregroundStyle(.white.opacity(0.85))

            Text(insight.content)
                .font(.body)
                .foregroundStyle(.white.opacity(0.5))

            if insight.priority == .high {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                    Text("Important")
                        .font(.caption.bold())
                        .foregroundStyle(.orange)
                }
            }
        }
        .padding()
        .premiumCard(cornerRadius: 16, tint: insight.category.color, tintOpacity: 0.03)
    }
}

// MARK: - Models

struct InsightItem: Identifiable {
    let id = UUID()
    let date: Date
    let category: InsightCategory
    let title: String
    let content: String
    let priority: InsightPriority

    static var samples: [InsightItem] {
        [
            InsightItem(
                date: Date(),
                category: .sleep,
                title: "Great Sleep Last Night!",
                content: "You got 8 hours of sleep with 2 hours of deep sleep. This is above your weekly average.",
                priority: .normal
            ),
            InsightItem(
                date: Date(),
                category: .activity,
                title: "Step Goal Streak",
                content: "You've hit your 10,000 step goal 5 days in a row. Keep it up!",
                priority: .normal
            ),
            InsightItem(
                date: Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date(),
                category: .heart,
                title: "HRV Trending Up",
                content: "Your heart rate variability has increased by 15% over the past week, indicating improved recovery.",
                priority: .normal
            ),
            InsightItem(
                date: Calendar.current.date(byAdding: .day, value: -2, to: Date()) ?? Date(),
                category: .recovery,
                title: "Consider a Rest Day",
                content: "Your resting heart rate is elevated and HRV is lower than usual. Your body might need extra recovery today.",
                priority: .high
            )
        ]
    }
}

enum InsightCategory {
    case sleep
    case activity
    case heart
    case recovery
    case nutrition
    case strain
    case wellbeing

    var title: String {
        switch self {
        case .sleep: return "Sleep"
        case .activity: return "Activity"
        case .heart: return "Heart"
        case .recovery: return "Recovery"
        case .nutrition: return "Nutrition"
        case .strain: return "Strain"
        case .wellbeing: return "Wellbeing"
        }
    }

    var icon: String {
        switch self {
        case .sleep: return "moon.fill"
        case .activity: return "figure.walk"
        case .heart: return "heart.fill"
        case .recovery: return "arrow.counterclockwise"
        case .nutrition: return "fork.knife"
        case .strain: return "flame.fill"
        case .wellbeing: return "face.smiling.fill"
        }
    }

    var color: Color {
        switch self {
        case .sleep: return .indigo
        case .activity: return .green
        case .heart: return .red
        case .recovery: return .orange
        case .nutrition: return .yellow
        case .strain: return .pink
        case .wellbeing: return .teal
        }
    }

    static func from(string: String) -> InsightCategory {
        switch string.lowercased() {
        case "sleep": return .sleep
        case "activity": return .activity
        case "heart": return .heart
        case "recovery": return .recovery
        case "nutrition": return .nutrition
        case "strain": return .strain
        case "wellbeing": return .wellbeing
        default: return .recovery
        }
    }
}

enum InsightPriority {
    case low
    case normal
    case high
}

#Preview {
    InsightsView()
}
