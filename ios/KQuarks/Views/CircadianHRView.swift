import SwiftUI
import Charts
import HealthKit

// MARK: - CircadianHRView

/// 24-hour heart rate rhythm pattern averaged across the last 14 days.
/// Reveals circadian HR trends: sleep dip, morning cortisol rise, workout peaks.
struct CircadianHRView: View {
    @State private var hourlyData: [HourSlot] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    // MARK: - Models

    struct HourSlot: Identifiable {
        let id: Int   // 0-23
        let hour: Int
        let avg: Double?
        let min: Double?
        let max: Double?
        let count: Int

        var label: String {
            switch hour {
            case 0: return "12am"
            case 12: return "12pm"
            default: return hour < 12 ? "\(hour)am" : "\(hour - 12)pm"
            }
        }

        var zoneColor: Color {
            guard let avg else { return Color(.tertiaryLabel) }
            if avg < 60 { return .blue }        // sleep / deep rest
            if avg < 75 { return .green }       // resting
            if avg < 95 { return .yellow }      // light activity
            if avg < 120 { return .orange }     // moderate
            return .red                          // intense
        }
    }

    // MARK: - Computed properties

    private var sleepSlots: [HourSlot] {
        hourlyData.filter { $0.hour <= 5 && $0.avg != nil }
    }
    private var avgSleepHR: Double? {
        guard !sleepSlots.isEmpty else { return nil }
        return sleepSlots.compactMap(\.avg).reduce(0, +) / Double(sleepSlots.count)
    }

    private var lowestSlot: HourSlot? {
        hourlyData.filter { $0.avg != nil && $0.count >= 2 }
            .min(by: { $0.avg! < $1.avg! })
    }

    private var peakSlot: HourSlot? {
        hourlyData.filter { s in s.hour >= 8 && s.hour <= 20 && s.avg != nil }
            .max(by: { $0.avg! < $1.avg! })
    }

    private var totalReadings: Int {
        hourlyData.reduce(0) { $0 + $1.count }
    }

    private var morningRiseSlot: HourSlot? {
        guard let sleep = avgSleepHR else { return nil }
        return hourlyData.first { s in
            s.hour >= 5 && s.hour <= 9 && (s.avg ?? 0) > sleep + 5
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalReadings == 0 {
                    emptyState
                } else {
                    summaryCards
                    barChartCard
                    legendCard
                    interpretationCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Daily HR Pattern")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.slash")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("No heart rate data")
                .font(.headline)
            Text("Enable background heart rate monitoring on your Apple Watch and sync your iPhone.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }

    // MARK: - Summary cards

    private var summaryCards: some View {
        let sleepVal = avgSleepHR.map { "\(Int($0.rounded())) bpm" } ?? "—"
        let lowestVal = lowestSlot?.avg.map { "\(Int($0.rounded())) bpm" } ?? "—"
        let lowestSub = lowestSlot?.label ?? "—"
        let peakVal = peakSlot?.avg.map { "\(Int($0.rounded())) bpm" } ?? "—"
        let peakSub = peakSlot?.label ?? "—"

        return LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
            CircadianStatCard(value: sleepVal, label: "Sleep HR", sub: "12am–5am avg", color: .blue)
            CircadianStatCard(value: lowestVal, label: "Lowest Hour", sub: lowestSub, color: .green)
            CircadianStatCard(value: peakVal, label: "Peak Hour", sub: peakSub, color: .red)
            CircadianStatCard(value: "\(totalReadings.formatted())", label: "Total Readings", sub: "Last 14 days", color: .primary)
        }
    }

    // MARK: - Bar chart

    private var barChartCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Average HR by Hour of Day")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Chart(hourlyData) { slot in
                if let avg = slot.avg {
                    BarMark(
                        x: .value("Hour", slot.label),
                        y: .value("Avg HR", avg)
                    )
                    .foregroundStyle(slot.zoneColor.opacity(slot.count < 2 ? 0.2 : 1))
                    .cornerRadius(2)
                } else {
                    BarMark(
                        x: .value("Hour", slot.label),
                        y: .value("Avg HR", 0)
                    )
                    .foregroundStyle(Color(.tertiaryLabel).opacity(0.1))
                }

                if let sleepAvg = avgSleepHR {
                    RuleMark(y: .value("Sleep avg", sleepAvg))
                        .foregroundStyle(.blue.opacity(0.4))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .annotation(position: .top, alignment: .leading) {
                            Text("Sleep avg \(Int(sleepAvg.rounded()))")
                                .font(.system(size: 9))
                                .foregroundStyle(.blue)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: stride(from: 0, through: 23, by: 3).map { hourlyData[$0].label }) { val in
                    AxisValueLabel {
                        if let label = val.as(String.self) {
                            Text(label).font(.system(size: 9))
                        }
                    }
                    AxisTick()
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisGridLine()
                    AxisValueLabel { Text("\(val.as(Int.self) ?? 0)") }
                }
            }
            .frame(height: 200)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Legend

    private var legendCard: some View {
        let zones: [(Color, String)] = [
            (.blue, "< 60 bpm — sleep/deep rest"),
            (.green, "60–74 — resting"),
            (.yellow, "75–94 — light activity"),
            (.orange, "95–119 — moderate"),
            (.red, "≥ 120 — intense"),
        ]
        return VStack(alignment: .leading, spacing: 8) {
            ForEach(zones, id: \.1) { color, label in
                HStack(spacing: 8) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(color)
                        .frame(width: 12, height: 12)
                    Text(label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Interpretation

    private var interpretationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Reading Your Pattern")
                .font(.subheadline.weight(.semibold))

            VStack(alignment: .leading, spacing: 6) {
                InterpretationRow(dot: .blue, title: "Sleep dip",
                    text: "The blue zone (12am–5am) shows parasympathetic activity during sleep. A lower sleeping HR than resting HR is a healthy sign.")
                InterpretationRow(dot: .yellow, title: "Morning rise",
                    text: "HR naturally climbs as cortisol peaks (6–9am). A sharp spike may indicate poor sleep or high stress.")
                if let rise = morningRiseSlot {
                    InterpretationRow(dot: .green, title: "Your rise",
                        text: "Your HR begins climbing around \(rise.label), suggesting your natural wake time aligns with this window.")
                }
                InterpretationRow(dot: .orange, title: "Workout peaks",
                    text: "Orange/red spikes during the day typically correspond to exercise sessions.")
            }

            Text("Averaged across the last 14 days. Hours with fewer than 2 readings shown at reduced opacity.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Data loading

    private func loadData() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -14, to: end)!

        let type = HKQuantityType(.heartRate)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.quantitySample(type: type, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate)]
        )

        do {
            let samples = try await descriptor.result(for: HKHealthStore())
            let unit = HKUnit.count().unitDivided(by: .minute())

            // Group by hour of day
            var buckets: [[Double]] = Array(repeating: [], count: 24)
            for sample in samples {
                let bpm = sample.quantity.doubleValue(for: unit)
                guard bpm >= 30, bpm <= 220 else { continue }
                let hour = Calendar.current.component(.hour, from: sample.startDate)
                buckets[hour].append(bpm)
            }

            let slots = buckets.enumerated().map { (hour, vals) -> HourSlot in
                let avg = vals.isEmpty ? nil : vals.reduce(0, +) / Double(vals.count)
                let min = vals.isEmpty ? nil : vals.min()
                let max = vals.isEmpty ? nil : vals.max()
                return HourSlot(id: hour, hour: hour, avg: avg, min: min, max: max, count: vals.count)
            }

            await MainActor.run { hourlyData = slots }
        } catch {
            // HealthKit not available (e.g. Simulator) — leave empty
        }
    }
}

// MARK: - Supporting views

struct CircadianStatCard: View {
    let value: String
    let label: String
    let sub: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(color == .primary ? Color.primary : color)
            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(.primary)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct InterpretationRow: View {
    let dot: Color
    let title: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(dot)
                .frame(width: 8, height: 8)
                .padding(.top, 4)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.primary)
                Text(text)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
