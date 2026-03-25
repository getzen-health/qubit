import SwiftUI
import Charts
import HealthKit

// MARK: - SleepEfficiencyView
// Analyzes sleep efficiency (TST / TIB × 100%) — a clinical marker of sleep quality.

struct SleepEfficiencyView: View {
    @State private var nights: [EfficiencyNight] = []
    @State private var isLoading = true

    private var efficiencyDomain: ClosedRange<Double> {
        let lo = validNights.map(\.efficiency).min().map { max(0.0, $0 - 5) } ?? 60.0
        return lo...100.0
    }

    private let healthKit = HealthKitService.shared

    struct EfficiencyNight: Identifiable {
        let id = UUID()
        let date: Date
        let tibMinutes: Int   // Time in Bed
        let tst: Int          // Total Sleep Time
        let awakeMinutes: Int
        var efficiency: Double { tibMinutes > 0 ? min(100.0, Double(tst) / Double(tibMinutes) * 100) : 0 }
        var solEstimate: Int { tibMinutes > tst ? (tibMinutes - tst) / 2 : 0 }
    }

    private var validNights: [EfficiencyNight] { nights.filter { $0.efficiency > 0 && $0.tibMinutes > 60 } }

    private var avgEfficiency: Double? {
        guard !validNights.isEmpty else { return nil }
        return validNights.map(\.efficiency).reduce(0, +) / Double(validNights.count)
    }

    private var avgTIB: Int {
        guard !validNights.isEmpty else { return 0 }
        return validNights.map(\.tibMinutes).reduce(0, +) / validNights.count
    }

    private var avgTST: Int {
        guard !validNights.isEmpty else { return 0 }
        return validNights.map(\.tst).reduce(0, +) / validNights.count
    }

    private var avgSOL: Int {
        guard !validNights.isEmpty else { return 0 }
        return validNights.map(\.solEstimate).reduce(0, +) / validNights.count
    }

    private func efficiencyColor(_ e: Double) -> Color {
        if e >= 85 && e <= 95 { return .green }
        if e >= 80 { return .yellow }
        return .red
    }

    private func efficiencyLabel(_ e: Double) -> String {
        if e >= 95 { return "High" }
        if e >= 85 { return "Optimal" }
        if e >= 80 { return "Below Target" }
        if e >= 70 { return "Low" }
        return "Poor"
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if validNights.isEmpty {
                    emptyState
                } else {
                    summaryGrid
                    statusBanner
                    if validNights.count >= 4 { trendChart }
                    nightByNightChart
                    bestWorstCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Sleep Efficiency")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Grid

    private var summaryGrid: some View {
        let eff = avgEfficiency ?? 0
        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            MetricCell(
                label: "Avg Efficiency",
                value: String(format: "%.1f%%", eff),
                sub: "Target 85–95%",
                color: efficiencyColor(eff)
            )
            MetricCell(
                label: "Time in Bed",
                value: formatMin(avgTIB),
                sub: "avg per night",
                color: .primary
            )
            MetricCell(
                label: "Sleep Time",
                value: formatMin(avgTST),
                sub: "avg per night",
                color: .primary
            )
            MetricCell(
                label: "Awake in Bed",
                value: "~\(avgSOL)m",
                sub: "estimate",
                color: avgSOL > 30 ? .red : avgSOL > 15 ? .yellow : .green
            )
        }
    }

    private struct MetricCell: View {
        let label: String
        let value: String
        let sub: String
        let color: Color

        var body: some View {
            VStack(alignment: .leading, spacing: 4) {
                Text(label).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                Text(value)
                    .font(.title2.bold().monospacedDigit())
                    .foregroundStyle(color == .primary ? Color.primary : color)
                Text(sub).font(.caption2).foregroundStyle(.secondary).opacity(0.6)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Status Banner

    private var statusBanner: some View {
        let eff = avgEfficiency ?? 0
        let color = efficiencyColor(eff)
        let label = efficiencyLabel(eff)
        let message = statusMessage(eff)

        return VStack(alignment: .leading, spacing: 6) {
            Label("\(label) — \(String(format: "%.1f", eff))% efficiency",
                  systemImage: eff >= 85 && eff <= 95 ? "checkmark.seal.fill" : "exclamationmark.circle.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(color)
            Text(message)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statusMessage(_ eff: Double) -> String {
        if eff > 95 { return "Very high efficiency can mean you need more sleep. Consider an earlier bedtime to increase total sleep time." }
        if eff >= 85 { return "Your sleep is efficient — you spend most of your time in bed actually sleeping. Keep up the consistent schedule." }
        if eff >= 80 { return "Slightly below optimal. Reducing time in bed before you feel sleepy and a consistent wake time can help raise this." }
        if eff >= 70 { return "Low efficiency. Avoid lying in bed awake — get up if you can't sleep within 20 minutes (stimulus control therapy)." }
        return "Poor sleep efficiency. Consider speaking with a sleep specialist about CBT-I or screening for sleep apnea."
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        let data = validNights.suffix(30).reversed().map { $0 }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Efficiency Trend (Last 30 nights)")
                .font(.headline).padding(.horizontal, 4)

            Chart {
                ForEach(data) { n in
                    LineMark(
                        x: .value("Date", n.date, unit: .day),
                        y: .value("Efficiency", n.efficiency)
                    )
                    .foregroundStyle(Color.indigo)
                    .interpolationMethod(.catmullRom)
                }
                RuleMark(y: .value("Min target", 85))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .lineStyle(StrokeStyle(dash: [4, 3]))
                RuleMark(y: .value("Max target", 95))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .lineStyle(StrokeStyle(dash: [4, 3]))
            }
            .chartYScale(domain: efficiencyDomain)
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear, count: 1)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    AxisTick()
                }
            }
            .frame(height: 150)
            .padding(.horizontal, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Night-by-night

    private var nightByNightChart: some View {
        let data = validNights.suffix(20).reversed().map { $0 }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Nights")
                .font(.headline).padding(.horizontal, 4)

            Chart {
                ForEach(data) { n in
                    BarMark(
                        x: .value("Date", n.date, unit: .day),
                        y: .value("Efficiency", n.efficiency)
                    )
                    .foregroundStyle(efficiencyColor(n.efficiency))
                    .cornerRadius(3)
                }
                RuleMark(y: .value("Target", 85))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .lineStyle(StrokeStyle(dash: [3, 3]))
            }
            .chartYScale(domain: efficiencyDomain)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 5)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 140)
            .padding(.horizontal, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Best / Worst

    private var bestWorstCard: some View {
        let sorted = validNights.sorted { $0.efficiency > $1.efficiency }
        guard let best = sorted.first, let worst = sorted.last, best.date != worst.date else { return AnyView(EmptyView()) }

        let df = DateFormatter()
        df.dateFormat = "EEE, MMM d"

        return AnyView(HStack(spacing: 12) {
            nightSummary(night: best, label: "Most Efficient", emoji: "⭐", borderColor: .green)
            nightSummary(night: worst, label: "Least Efficient", emoji: "😴", borderColor: .red)
        })
    }

    private func nightSummary(night: EfficiencyNight, label: String, emoji: String, borderColor: Color) -> some View {
        let df = DateFormatter(); df.dateFormat = "EEE, MMM d"
        return VStack(alignment: .leading, spacing: 6) {
            Text("\(emoji) \(label)").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(df.string(from: night.date)).font(.subheadline.bold())
            VStack(alignment: .leading, spacing: 2) {
                Text(String(format: "Efficiency: %.1f%%", night.efficiency))
                    .font(.caption)
                    .foregroundStyle(efficiencyColor(night.efficiency))
                Text("In bed: \(formatMin(night.tibMinutes))").font(.caption).foregroundStyle(.secondary)
                Text("Asleep: \(formatMin(night.tst))").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(borderColor.opacity(0.4), lineWidth: 1))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("About Sleep Efficiency", systemImage: "info.circle.fill")
                .font(.subheadline.weight(.semibold))
            VStack(alignment: .leading, spacing: 8) {
                infoRow("What is it?", "Sleep Efficiency = Total Sleep Time ÷ Time in Bed × 100%. It measures what fraction of your time in bed is spent asleep. 85–95% is optimal.")
                infoRow("Why it matters", "Low efficiency is a hallmark of insomnia. CBT-I (Cognitive Behavioral Therapy for Insomnia) treats it with sleep restriction and stimulus control.")
                infoRow("High efficiency (>95%)", "Falling asleep immediately every night may indicate sleep deprivation. Try going to bed earlier to accumulate more total sleep.")
                infoRow("Improving it", "Keep a consistent wake time 7 days a week. Avoid lying in bed awake — get up and return only when sleepy.")
            }
            Text("Calculated from Apple Health sleep start/end times vs sleep duration from Apple Watch.")
                .font(.caption2).foregroundStyle(.secondary).opacity(0.5).padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func infoRow(_ title: String, _ body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.weight(.semibold)).foregroundStyle(.primary)
            Text(body).font(.caption).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "bed.double.fill").font(.system(size: 48)).foregroundStyle(.secondary)
            Text("No Data").font(.title3.bold())
            Text("Sleep efficiency requires Apple Watch sleep tracking with recorded bedtime and wake time over at least one night.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }.padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let start = Calendar.current.date(byAdding: .day, value: -60, to: Date()) ?? Date()
        guard let samples = try? await healthKit.fetchSleepAnalysis(from: start, to: Date()) else { return }

        let cal = Calendar.current
        var byDay: [DateComponents: [HKCategorySample]] = [:]
        for s in samples {
            let key = cal.dateComponents([.year, .month, .day], from: s.endDate)
            byDay[key, default: []].append(s)
        }

        nights = byDay.compactMap { (comps, daySamples) -> EfficiencyNight? in
            guard let date = cal.date(from: comps) else { return nil }
            // Time in Bed: span from earliest start to latest end
            guard let earliest = daySamples.map(\.startDate).min(),
                  let latest = daySamples.map(\.endDate).max() else { return nil }
            let tibMinutes = Int(latest.timeIntervalSince(earliest) / 60)
            guard tibMinutes > 60 && tibMinutes < 720 else { return nil }

            var asleep = 0, awake = 0
            for s in daySamples {
                let mins = Int(s.endDate.timeIntervalSince(s.startDate) / 60)
                switch HKCategoryValueSleepAnalysis(rawValue: s.value) {
                case .asleepDeep, .asleepREM, .asleepCore, .asleepUnspecified: asleep += mins
                case .awake, .inBed: awake += mins
                default: break
                }
            }
            guard asleep > 30 else { return nil }
            return EfficiencyNight(date: date, tibMinutes: tibMinutes, tst: asleep, awakeMinutes: awake)
        }
        .sorted { $0.date > $1.date }
    }

    // MARK: - Helpers

    private func formatMin(_ min: Int) -> String {
        let h = min / 60; let m = min % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }
}

#Preview {
    NavigationStack { SleepEfficiencyView() }
}
