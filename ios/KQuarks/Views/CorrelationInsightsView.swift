import SwiftUI
import Charts

// MARK: - CorrelationInsightsView

/// Computes simple Pearson correlations from the last 60 days of synced data
/// and presents actionable health insights.
struct CorrelationInsightsView: View {
    @State private var insights: [CorrelationInsight] = []
    @State private var isLoading = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 40)
                } else if insights.isEmpty {
                    emptyState
                } else {
                    header
                    ForEach(insights) { insight in
                        CorrelationInsightCard(insight: insight)
                    }
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Correlations")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("How your metrics influence each other")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("Based on last 60 days of data")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "chart.line.text.clipboard")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Sync at least 2 weeks of health data to see correlations between your metrics.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Analysis

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let summaries = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 60),
              summaries.count >= 14 else {
            return
        }

        var results: [CorrelationInsight] = []

        // Sleep → HRV
        let sleepHRV = paired(summaries, x: \.sleepHours, y: \.avgHrv)
        if sleepHRV.count >= 10 {
            let r = pearson(sleepHRV.map(\.0), sleepHRV.map(\.1))
            if abs(r) >= 0.2 {
                let highSleepHRV = sleepHRV.filter { $0.0 >= 7 }.map(\.1).average
                let lowSleepHRV = sleepHRV.filter { $0.0 < 7 }.map(\.1).average
                results.append(CorrelationInsight(
                    id: "sleep-hrv",
                    icon: "moon.stars.fill",
                    color: .indigo,
                    title: "Sleep & HRV",
                    body: r > 0
                        ? "On nights with 7+ hours of sleep, your HRV averages \(format(highSleepHRV)) ms vs \(format(lowSleepHRV)) ms on shorter nights."
                        : "Longer sleep correlates with lower HRV — this may indicate overtraining or inconsistent sleep schedule.",
                    correlation: r,
                    takeaway: r > 0.3 ? "Prioritise 7–9 hours of sleep to maintain HRV baseline." : nil
                ))
            }
        }

        // Sleep → Recovery
        let sleepRec = paired(summaries, x: \.sleepHours, y: { Double($0.recoveryScore ?? 0) })
        if sleepRec.count >= 10 {
            let r = pearson(sleepRec.map(\.0), sleepRec.map(\.1))
            if abs(r) >= 0.2 {
                results.append(CorrelationInsight(
                    id: "sleep-recovery",
                    icon: "bolt.fill",
                    color: .teal,
                    title: "Sleep & Recovery",
                    body: r > 0
                        ? "More sleep reliably improves next-day recovery score."
                        : "Sleep length isn't the primary driver of your recovery — look at sleep quality instead.",
                    correlation: r,
                    takeaway: r > 0.3 ? "Consistent sleep schedules improve recovery more than total hours alone." : nil
                ))
            }
        }

        // Steps → Recovery (day after)
        let stepRec = pairedLagged(summaries, x: \.steps, y: \.recoveryScore, lagDays: 1)
        if stepRec.count >= 10 {
            let r = pearson(stepRec.map { Double($0.0) }, stepRec.map { Double($0.1) })
            if abs(r) >= 0.15 {
                results.append(CorrelationInsight(
                    id: "steps-recovery",
                    icon: "figure.walk",
                    color: .green,
                    title: "Activity & Next-Day Recovery",
                    body: r > 0
                        ? "Higher step days are associated with better recovery the following day."
                        : "High activity correlates with slightly lower next-day recovery — be mindful of overtraining.",
                    correlation: r,
                    takeaway: r < -0.25 ? "Consider active recovery on high-step days to maintain recovery quality." : nil
                ))
            }
        }

        // HRV → Steps (same day)
        let hrvSteps = paired(summaries, x: \.avgHrv, y: { Double($0.steps) })
        if hrvSteps.count >= 10 {
            let r = pearson(hrvSteps.map(\.0), hrvSteps.map(\.1))
            if abs(r) >= 0.2 {
                results.append(CorrelationInsight(
                    id: "hrv-steps",
                    icon: "waveform.path.ecg",
                    color: .purple,
                    title: "HRV & Activity Output",
                    body: r > 0
                        ? "On days with higher HRV, you tend to take more steps."
                        : "High HRV doesn't translate to more movement for you — try adding light activity on recovery days.",
                    correlation: r,
                    takeaway: nil
                ))
            }
        }

        // Recovery → Steps (same day)
        let recSteps = paired(summaries, x: { Double($0.recoveryScore ?? 0) }, y: { Double($0.steps) })
        if recSteps.count >= 10 {
            let r = pearson(recSteps.map(\.0), recSteps.map(\.1))
            if abs(r) >= 0.2 {
                results.append(CorrelationInsight(
                    id: "recovery-steps",
                    icon: "arrow.counterclockwise",
                    color: .teal,
                    title: "Recovery & Activity Level",
                    body: r > 0
                        ? "Your activity output closely follows your recovery score — you move more when well-rested."
                        : "Interestingly, higher recovery days don't translate to higher activity for you.",
                    correlation: r,
                    takeaway: nil
                ))
            }
        }

        insights = results.sorted { abs($0.correlation) > abs($1.correlation) }
    }

    // MARK: - Math

    private func pearson(_ xs: [Double], _ ys: [Double]) -> Double {
        let n = xs.count
        guard n >= 5 else { return 0 }
        let mx = xs.reduce(0, +) / Double(n)
        let my = ys.reduce(0, +) / Double(n)
        let num = zip(xs, ys).reduce(0.0) { $0 + ($1.0 - mx) * ($1.1 - my) }
        let denX = xs.reduce(0.0) { $0 + ($1 - mx) * ($1 - mx) }
        let denY = ys.reduce(0.0) { $0 + ($1 - my) * ($1 - my) }
        let den = sqrt(denX * denY)
        return den == 0 ? 0 : num / den
    }

    private func paired<X: BinaryFloatingPoint, Y: BinaryFloatingPoint>(
        _ summaries: [SupabaseService.DailySummaryRow],
        x: (SupabaseService.DailySummaryRow) -> X?,
        y: (SupabaseService.DailySummaryRow) -> Y?
    ) -> [(Double, Double)] {
        summaries.compactMap { s in
            guard let xv = x(s), let yv = y(s), Double(xv) > 0, Double(yv) > 0 else { return nil }
            return (Double(xv), Double(yv))
        }
    }

    private func pairedLagged(
        _ summaries: [SupabaseService.DailySummaryRow],
        x: (SupabaseService.DailySummaryRow) -> Int?,
        y: (SupabaseService.DailySummaryRow) -> Int?,
        lagDays: Int
    ) -> [(Int, Int)] {
        guard summaries.count > lagDays else { return [] }
        var result: [(Int, Int)] = []
        for i in 0..<(summaries.count - lagDays) {
            if let xv = x(summaries[i + lagDays]),
               let yv = y(summaries[i]),
               xv > 0, yv > 0 {
                result.append((xv, yv))
            }
        }
        return result
    }

    private func format(_ val: Double?) -> String {
        guard let v = val else { return "—" }
        return String(format: "%.0f", v)
    }
}

// MARK: - Insight Card

private struct CorrelationInsightCard: View {
    let insight: CorrelationInsight

    private var strengthText: String {
        let abs = Swift.abs(insight.correlation)
        if abs >= 0.5 { return "Strong" }
        if abs >= 0.3 { return "Moderate" }
        return "Weak"
    }

    private var directionText: String {
        insight.correlation > 0 ? "positive" : "negative"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: insight.icon)
                    .font(.title3)
                    .foregroundStyle(insight.color)
                    .frame(width: 36, height: 36)
                    .background(insight.color.opacity(0.12))
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(insight.title)
                        .font(.headline)
                    Text("\(strengthText) \(directionText) correlation")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                // Correlation badge
                Text(String(format: "r = %.2f", insight.correlation))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(insight.color)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(insight.color.opacity(0.1))
                    .clipShape(Capsule())
            }

            Text(insight.body)
                .font(.subheadline)
                .foregroundStyle(.primary)

            if let takeaway = insight.takeaway {
                Label(takeaway, systemImage: "lightbulb.fill")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.orange)
                    .padding(10)
                    .background(Color.orange.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Data Model

struct CorrelationInsight: Identifiable {
    let id: String
    let icon: String
    let color: Color
    let title: String
    let body: String
    let correlation: Double
    let takeaway: String?
}

// MARK: - Extensions

private extension Array where Element == Double {
    var average: Double? {
        isEmpty ? nil : reduce(0, +) / Double(count)
    }
}

#Preview {
    NavigationStack {
        CorrelationInsightsView()
    }
}
