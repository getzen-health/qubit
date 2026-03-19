import SwiftUI

// MARK: - Models

private struct Nudge: Identifiable {
    let id = UUID()
    let icon: String
    let color: Color
    let category: String
    let title: String
    let body: String
    let action: String?
    let priority: Int  // 0=low 1=normal 2=urgent
}

// MARK: - SmartNudgesView

/// Algorithmically generated, data-driven daily health recommendations.
/// Rule-based — no AI API required. Refreshes whenever you open the view.
struct SmartNudgesView: View {
    @State private var nudges: [Nudge] = []
    @State private var isLoading = false
    @State private var lastUpdated: Date?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading && nudges.isEmpty {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 80)
                } else if nudges.isEmpty {
                    emptyState
                } else {
                    headerBanner
                    urgentSection
                    normalSection
                    footerNote
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Smart Nudges")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await load() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(isLoading)
            }
        }
        .task { await load() }
    }

    // MARK: - Sections

    private var headerBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "wand.and.stars")
                .font(.title2)
                .foregroundStyle(.purple)
            VStack(alignment: .leading, spacing: 2) {
                Text("Today's Recommendations")
                    .font(.headline)
                if let t = lastUpdated {
                    Text("Updated \(t.formatted(date: .omitted, time: .shortened))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            Text("\(nudges.count)")
                .font(.title3.bold())
                .foregroundStyle(.purple)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    @ViewBuilder
    private var urgentSection: some View {
        let urgent = nudges.filter { $0.priority == 2 }
        if !urgent.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Needs Attention", systemImage: "exclamationmark.triangle.fill")
                    .font(.caption.bold())
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 4)
                ForEach(urgent) { nudge in
                    NudgeCard(nudge: nudge)
                }
            }
        }
    }

    @ViewBuilder
    private var normalSection: some View {
        let normal = nudges.filter { $0.priority < 2 }
        if !normal.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                if nudges.contains(where: { $0.priority == 2 }) {
                    Label("Tips for Today", systemImage: "lightbulb.fill")
                        .font(.caption.bold())
                        .foregroundStyle(.yellow)
                        .padding(.horizontal, 4)
                }
                ForEach(normal) { nudge in
                    NudgeCard(nudge: nudge)
                }
            }
        }
    }

    private var footerNote: some View {
        Text("Based on your last 14 days of synced health data · Updated on open")
            .font(.caption2)
            .foregroundStyle(.tertiary)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.bottom, 8)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "wand.and.stars.inverse")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Nudges Yet")
                .font(.title3.bold())
            Text("Sync at least 5 days of health data and we'll start generating personalised recommendations.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load & Analyse

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let rows = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 14),
              rows.count >= 3 else { return }

        // Sorted oldest → newest; exclude today if very early
        let sorted = rows.sorted { $0.date < $1.date }
        nudges = analyse(sorted)
        lastUpdated = Date()
    }

    // MARK: - Rule Engine

    private func analyse(_ rows: [SupabaseService.DailySummaryRow]) -> [Nudge] {
        var results: [Nudge] = []

        // ── HRV ─────────────────────────────────────────────────────────────
        let hrvValues = rows.compactMap(\.avg_hrv).filter { $0 > 0 }
        if hrvValues.count >= 5 {
            let baseline = average(hrvValues.dropLast(3))
            let recent3  = average(Array(hrvValues.suffix(3)))
            let ratio    = recent3 / baseline

            if ratio <= 0.80 {
                results.append(Nudge(
                    icon: "waveform.path.ecg.rectangle.fill",
                    color: .red,
                    category: "HRV",
                    title: "HRV Significantly Below Baseline",
                    body: String(format: "Your 3-day HRV average (%.0f ms) is %.0f%% below your baseline (%.0f ms). This often signals accumulated fatigue or early illness.", recent3, (1 - ratio) * 100, baseline),
                    action: "Prioritise sleep and avoid intense training today.",
                    priority: 2
                ))
            } else if ratio <= 0.90 {
                results.append(Nudge(
                    icon: "waveform.path.ecg",
                    color: .orange,
                    category: "Recovery",
                    title: "HRV Trending Down",
                    body: String(format: "Your recent HRV (%.0f ms) is %.0f%% under your %.0f ms baseline.", recent3, (1 - ratio) * 100, baseline),
                    action: "Consider an easy day — a walk, yoga, or extra sleep.",
                    priority: 1
                ))
            } else if ratio >= 1.15 {
                results.append(Nudge(
                    icon: "waveform.path.ecg",
                    color: .green,
                    category: "Fitness",
                    title: "Great Recovery!",
                    body: String(format: "Your HRV (%.0f ms) is %.0f%% above baseline — your body is well-rested and ready to perform.", recent3, (ratio - 1) * 100),
                    action: "A quality workout session today could be very productive.",
                    priority: 0
                ))
            }
        }

        // ── Sleep ────────────────────────────────────────────────────────────
        let sleepMins = rows.compactMap { $0.sleep_duration_minutes }.filter { $0 > 60 }
        if sleepMins.count >= 5 {
            let avgSleepH = Double(sleepMins.reduce(0, +)) / Double(sleepMins.count) / 60.0
            let last3Avg  = Double(sleepMins.suffix(3).reduce(0, +)) / Double(min(3, sleepMins.count)) / 60.0

            if avgSleepH < 6.5 {
                results.append(Nudge(
                    icon: "moon.fill",
                    color: .indigo,
                    category: "Sleep",
                    title: "Chronic Sleep Deficit Detected",
                    body: String(format: "You're averaging %.1f hours of sleep — well below the 7–9 hour target. Chronic under-sleep raises cortisol and suppresses recovery.", avgSleepH),
                    action: "Aim for an earlier bedtime by 30–45 minutes this week.",
                    priority: 2
                ))
            } else if last3Avg < 6.5 && avgSleepH >= 6.5 {
                results.append(Nudge(
                    icon: "moon.fill",
                    color: .indigo,
                    category: "Sleep",
                    title: "Short Sleep the Last 3 Nights",
                    body: String(format: "You've averaged %.1f hours over the last 3 nights. Even short-term deficits affect next-day mood, focus, and workout performance.", last3Avg),
                    action: "Try to get to bed 30 minutes earlier tonight.",
                    priority: 1
                ))
            }
        }

        // ── Steps ────────────────────────────────────────────────────────────
        let steps = rows.map { $0.steps }.filter { $0 > 0 }
        let stepGoal = GoalService.shared.stepsGoal
        if steps.count >= 5 {
            let weekAvg = Double(steps.suffix(7).reduce(0, +)) / Double(min(7, steps.count))
            let goalPct = weekAvg / stepGoal

            if goalPct < 0.60 {
                results.append(Nudge(
                    icon: "figure.walk",
                    color: .green,
                    category: "Activity",
                    title: "Steps Goal Far Below Target",
                    body: String(format: "Your 7-day step average (%.0f) is %.0f%% of your %@ goal. Low daily steps are linked to increased cardiovascular risk.", weekAvg, goalPct * 100, Int(stepGoal).formatted()),
                    action: "Add a 15-minute walk after lunch or dinner to close the gap.",
                    priority: 1
                ))
            } else if goalPct >= 1.30 {
                results.append(Nudge(
                    icon: "figure.walk",
                    color: .green,
                    category: "Activity",
                    title: "Crushing Your Step Goal!",
                    body: String(format: "Your 7-day average (%.0f steps) is %.0f%% above your goal of %@. Keep the momentum going!", weekAvg, (goalPct - 1) * 100, Int(stepGoal).formatted()),
                    action: nil,
                    priority: 0
                ))
            }

            // Consistency streak check
            let recentStepGoalDays = steps.suffix(7).filter { Double($0) >= stepGoal }.count
            if recentStepGoalDays >= 7 {
                results.append(Nudge(
                    icon: "flame.fill",
                    color: .orange,
                    category: "Streak",
                    title: "7-Day Steps Streak!",
                    body: "You've hit your step goal every day this week. Consistency like this compounds into real fitness gains over time.",
                    action: nil,
                    priority: 0
                ))
            }
        }

        // ── Calories ─────────────────────────────────────────────────────────
        let calories = rows.compactMap(\.active_calories).filter { $0 > 0 }
        let calGoal = GoalService.shared.activeCaloriesGoal
        if calories.count >= 5 {
            let recent7Avg = calories.suffix(7).reduce(0.0, +) / Double(min(7, calories.count))
            if recent7Avg < calGoal * 0.50 {
                results.append(Nudge(
                    icon: "flame",
                    color: .red,
                    category: "Activity",
                    title: "Active Calories Well Below Goal",
                    body: String(format: "Your 7-day calorie average (%.0f kcal) is only %.0f%% of your %.0f kcal target.", recent7Avg, (recent7Avg / calGoal) * 100, calGoal),
                    action: "A 20-minute moderate workout would add roughly 150–250 kcal.",
                    priority: 1
                ))
            }
        }

        // ── Recovery Score ───────────────────────────────────────────────────
        let recovery = rows.compactMap(\.recovery_score).filter { $0 > 0 }
        if recovery.count >= 3 {
            let avgRecovery = Double(recovery.suffix(3).reduce(0, +)) / Double(min(3, recovery.count))
            if avgRecovery < 40 {
                results.append(Nudge(
                    icon: "arrow.counterclockwise.circle.fill",
                    color: .red,
                    category: "Recovery",
                    title: "Low Recovery Score",
                    body: String(format: "Your 3-day average recovery score is %.0f%%  — indicating high physiological stress or poor adaptation.", avgRecovery),
                    action: "Skip or significantly reduce training intensity. Prioritise nutrition and sleep.",
                    priority: 2
                ))
            } else if avgRecovery >= 80 {
                results.append(Nudge(
                    icon: "arrow.counterclockwise.circle.fill",
                    color: .green,
                    category: "Recovery",
                    title: "Excellent Recovery",
                    body: String(format: "Your recovery score averages %.0f%% over the last 3 days — your body is primed for hard training.", avgRecovery),
                    action: "A challenging workout today will yield great adaptation.",
                    priority: 0
                ))
            }
        }

        // ── Training Monotony ─────────────────────────────────────────────────
        if steps.count >= 7 {
            let mean = Double(steps.suffix(7).reduce(0, +)) / 7.0
            let variance = steps.suffix(7).map { pow(Double($0) - mean, 2) }.reduce(0, +) / 7.0
            let sd = variance.squareRoot()
            let monotony = mean / max(sd, 1)  // high = low variety
            if monotony > 2.0 && mean > 4000 {
                results.append(Nudge(
                    icon: "arrow.triangle.2.circlepath",
                    color: .blue,
                    category: "Training",
                    title: "Very Consistent Activity Pattern",
                    body: "Your step counts have been very similar day after day. While consistency is positive, building in planned rest days or high-activity days improves overall adaptation.",
                    action: "Try a long walk or hike this weekend to create productive variation.",
                    priority: 0
                ))
            }
        }

        // ── Distance trend ───────────────────────────────────────────────────
        let distances = rows.compactMap(\.distance_meters).filter { $0 > 500 }
        if distances.count >= 6 {
            let firstHalf  = Double(distances.prefix(distances.count / 2).reduce(0, +)) / Double(distances.count / 2)
            let secondHalf = Double(distances.suffix(distances.count / 2).reduce(0, +)) / Double(distances.count / 2)
            if secondHalf > firstHalf * 1.25 {
                results.append(Nudge(
                    icon: "map.fill",
                    color: .teal,
                    category: "Fitness",
                    title: "Distance Is Ramping Up",
                    body: String(format: "Your recent activity distance (avg %.1f km/day) is up 25%%+ vs the start of this period. Be mindful of increasing volume too quickly.", secondHalf / 1000),
                    action: "Follow the 10% rule — don't increase weekly distance by more than 10% per week.",
                    priority: 1
                ))
            }
        }

        // Sort: urgent → normal → positive
        results.sort { $0.priority > $1.priority }

        // Cap at 7 nudges to avoid overwhelming
        return Array(results.prefix(7))
    }

    private func average(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / Double(values.count)
    }

    private func average(_ values: ArraySlice<Double>) -> Double {
        average(Array(values))
    }
}

// MARK: - NudgeCard

private struct NudgeCard: View {
    let nudge: Nudge

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: nudge.icon)
                    .font(.title3)
                    .foregroundStyle(nudge.color)
                    .frame(width: 36, height: 36)
                    .background(nudge.color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 9))

                VStack(alignment: .leading, spacing: 2) {
                    Text(nudge.category.uppercased())
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(nudge.color)
                        .tracking(0.5)
                    Text(nudge.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                }

                if nudge.priority == 2 {
                    Spacer()
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundStyle(.orange)
                        .font(.caption)
                }
            }

            Text(nudge.body)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            if let action = nudge.action {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.caption)
                        .foregroundStyle(nudge.color)
                    Text(action)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(nudge.color)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(nudge.color.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

#Preview {
    NavigationStack {
        SmartNudgesView()
    }
}
