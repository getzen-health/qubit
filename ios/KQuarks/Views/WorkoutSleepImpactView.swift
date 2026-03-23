import SwiftUI
import Charts

// MARK: - WorkoutSleepImpactView
// Analyzes how workout timing (morning/afternoon/evening) and type
// affect next-day HRV — a proxy for sleep quality and recovery.

struct WorkoutSleepImpactView: View {
    @State private var insights: [TimingInsight] = []
    @State private var typeInsights: [TypeInsight] = []
    @State private var scatterPoints: [ScatterPoint] = []
    @State private var bestTiming: String?
    @State private var isLoading = false

    // A group of workouts at a given time-of-day slot
    struct TimingInsight: Identifiable {
        let id = UUID()
        let slot: String
        let avgNextHRV: Double
        let count: Int
        let color: Color
    }

    // A group of workouts by workout category
    struct TypeInsight: Identifiable {
        let id = UUID()
        let category: String
        let avgNextHRV: Double
        let count: Int
    }

    // Individual workout → next-day HRV point for scatter
    struct ScatterPoint: Identifiable {
        let id = UUID()
        let endHour: Double   // 0–23
        let nextHRV: Double
        let workoutType: String
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if insights.isEmpty {
                    emptyState
                } else {
                    if let best = bestTiming { recommendationCard(best) }
                    timingChart
                    if !typeInsights.isEmpty { typeCard }
                    if scatterPoints.count >= 5 { scatterCard }
                    methodologyCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Workout & Recovery")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Recommendation

    private func recommendationCard(_ best: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: "star.circle.fill")
                .font(.system(size: 36))
                .foregroundStyle(.yellow)
            VStack(alignment: .leading, spacing: 4) {
                Text("Best Workout Time For You")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(best)
                    .font(.headline)
                Text("Based on next-day HRV — your body recovers best after \(best.lowercased()) workouts.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Timing Chart

    private var timingChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Next-Day HRV by Workout Time")
                .font(.headline)
                .padding(.horizontal, 4)
            Text("Average HRV the morning after workouts at different times of day")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            Chart(insights) { insight in
                BarMark(
                    x: .value("Time", insight.slot),
                    y: .value("Avg HRV", insight.avgNextHRV)
                )
                .foregroundStyle(insight.color)
                .cornerRadius(6)
                .annotation(position: .top) {
                    VStack(spacing: 2) {
                        Text(String(format: "%.0f", insight.avgNextHRV))
                            .font(.caption2.bold())
                            .foregroundStyle(.primary)
                        Text("n=\(insight.count)")
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .frame(height: 180)
            .chartYAxis {
                AxisMarks(position: .leading) { val in
                    AxisValueLabel { if let v = val.as(Double.self) { Text(String(format: "%.0f", v)) } }
                    AxisGridLine()
                }
            }
            .chartYScale(domain: {
                let minVal = (insights.map(\.avgNextHRV).min() ?? 30) * 0.85
                let maxVal = (insights.map(\.avgNextHRV).max() ?? 80) * 1.10
                return minVal...maxVal
            }())

            if insights.count >= 2 {
                let sorted = insights.sorted { $0.avgNextHRV > $1.avgNextHRV }
                if let top = sorted.first, let bottom = sorted.last,
                   top.avgNextHRV - bottom.avgNextHRV >= 1 {
                    Text(String(format: "%@ workouts lead to %.0f%% higher HRV than %@ workouts",
                                top.slot, (top.avgNextHRV / bottom.avgNextHRV - 1) * 100, bottom.slot))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Workout Type Card

    private var typeCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Next-Day HRV by Workout Type")
                .font(.headline)
                .padding(.horizontal, 0)

            ForEach(typeInsights.sorted { $0.avgNextHRV > $1.avgNextHRV }) { t in
                HStack {
                    Text(t.category)
                        .font(.subheadline)
                        .frame(width: 90, alignment: .leading)
                    GeometryReader { geo in
                        let maxHRV = typeInsights.map(\.avgNextHRV).max() ?? 80
                        let width = geo.size.width * CGFloat(t.avgNextHRV / maxHRV)
                        Capsule()
                            .fill(Color.blue.opacity(0.15))
                            .frame(height: 20)
                            .overlay(alignment: .leading) {
                                Capsule()
                                    .fill(Color.blue)
                                    .frame(width: width, height: 20)
                            }
                    }
                    .frame(height: 20)
                    Text(String(format: "%.0f ms", t.avgNextHRV))
                        .font(.caption.monospacedDigit().bold())
                        .foregroundStyle(.blue)
                        .frame(width: 48, alignment: .trailing)
                    Text("n=\(t.count)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .frame(width: 32, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Scatter Chart

    private var scatterCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Workout End Time vs Next-Day HRV")
                .font(.headline)
                .padding(.horizontal, 4)
            Text("Does exercising closer to bedtime hurt your HRV?")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            Chart(scatterPoints) { pt in
                PointMark(
                    x: .value("End Hour", pt.endHour),
                    y: .value("Next HRV", pt.nextHRV)
                )
                .foregroundStyle(.blue.opacity(0.6))
                .symbolSize(30)
            }
            .frame(height: 160)
            .chartXScale(domain: 4...24)
            .chartXAxis {
                AxisMarks(values: [6, 9, 12, 15, 18, 21]) { val in
                    AxisValueLabel {
                        if let h = val.as(Int.self) {
                            Text(h < 12 ? "\(h)am" : (h == 12 ? "12pm" : "\(h-12)pm"))
                        }
                    }
                    AxisGridLine()
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { val in
                    AxisValueLabel { if let v = val.as(Double.self) { Text(String(format: "%.0f", v)) } }
                }
            }
            .padding(.horizontal, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Methodology

    private var methodologyCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("How This Works", systemImage: "info.circle")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text("For each workout over the past 90 days, the following morning's HRV is used as a recovery proxy. HRV is measured during sleep by Apple Watch. Morning HRV correlates with sleep quality and the body's readiness to train again.")
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text("Time slots: Morning 5–11am · Afternoon 11am–5pm · Evening 5pm–10pm · Night 10pm+")
                .font(.caption2)
                .foregroundStyle(.secondary.opacity(0.7))
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "chart.bar.xaxis.ascending")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not Enough Data Yet").font(.title3.bold())
            Text("Log at least 10 workouts with HRV data to see how workout timing affects your recovery. Make sure to wear your Apple Watch at night.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }.padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let workouts = try? await SupabaseService.shared.fetchWorkoutRecords(days: 90),
              let summaries = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 91)
        else { return }

        // Build a date → next-morning HRV map
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let hrvByDate: [String: Double] = summaries.reduce(into: [:]) { dict, s in
            if let hrv = s.avg_hrv, hrv > 0 { dict[s.date] = hrv }
        }

        // Only use workouts >10 min with valid next-day HRV
        let calendar = Calendar.current
        var slotData: [String: [Double]] = [:]
        var typeData: [String: [Double]] = [:]
        var scatter: [ScatterPoint] = []

        for w in workouts where w.durationMinutes >= 10 {
            let endDate = w.endTime
            let endHour = calendar.component(.hour, from: endDate)
            let nextDay = calendar.date(byAdding: .day, value: 1, to: endDate) ?? Date()
            let nextDayStr = df.string(from: nextDay)
            guard let hrv = hrvByDate[nextDayStr] else { continue }

            // Time slot
            let slot: String
            switch endHour {
            case 5..<11:  slot = "Morning"
            case 11..<17: slot = "Afternoon"
            case 17..<22: slot = "Evening"
            default:      slot = "Night"
            }
            slotData[slot, default: []].append(hrv)

            // Workout category
            let category = workoutCategory(w.workoutType)
            typeData[category, default: []].append(hrv)

            // Scatter
            scatter.append(ScatterPoint(
                endHour: Double(endHour) + Double(calendar.component(.minute, from: endDate)) / 60,
                nextHRV: hrv,
                workoutType: category
            ))
        }

        let slotColors: [String: Color] = [
            "Morning": .blue, "Afternoon": .green, "Evening": .orange, "Night": .red
        ]

        insights = slotData
            .compactMap { slot, values in
                guard values.count >= 3 else { return nil }
                let avg = values.reduce(0, +) / Double(values.count)
                return TimingInsight(
                    slot: slot, avgNextHRV: avg, count: values.count,
                    color: slotColors[slot] ?? .gray
                )
            }
            .sorted { $0.slot < $1.slot }

        typeInsights = typeData
            .compactMap { category, values in
                guard values.count >= 3 else { return nil }
                let avg = values.reduce(0, +) / Double(values.count)
                return TypeInsight(category: category, avgNextHRV: avg, count: values.count)
            }

        scatterPoints = scatter
        bestTiming = insights.max(by: { $0.avgNextHRV < $1.avgNextHRV }).map { "\($0.slot) workouts" }
    }

    private func workoutCategory(_ type: String) -> String {
        let lower = type.lowercased()
        if lower.contains("run") || lower.contains("walk") || lower.contains("cycl") ||
           lower.contains("swim") || lower.contains("row") || lower.contains("hik") {
            return "Cardio"
        }
        if lower.contains("strength") || lower.contains("weight") || lower.contains("lift") {
            return "Strength"
        }
        if lower.contains("hiit") || lower.contains("interval") || lower.contains("crossfit") {
            return "HIIT"
        }
        if lower.contains("yoga") || lower.contains("pilates") || lower.contains("stretch") {
            return "Mind-Body"
        }
        return "Other"
    }
}

#Preview {
    NavigationStack { WorkoutSleepImpactView() }
}
