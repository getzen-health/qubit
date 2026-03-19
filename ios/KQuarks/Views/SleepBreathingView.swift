import SwiftUI
import Charts
import HealthKit

// MARK: - SleepBreathingView
// Tracks respiratory rate during sleep as a proxy for sleep-disordered breathing.
// Normal sleep: 12–18 breaths/min. Elevated (>18) may indicate snoring/apnea.

struct SleepBreathingView: View {
    @State private var nights: [BreathingNight] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct BreathingNight: Identifiable {
        let id = UUID()
        let date: Date
        let avgBpm: Double
        let minBpm: Double
        let maxBpm: Double
        let sampleCount: Int

        var category: Category {
            if avgBpm < 12  { return .low }
            if avgBpm <= 18 { return .normal }
            if avgBpm <= 22 { return .elevated }
            return .high
        }

        enum Category {
            case low, normal, elevated, high
            var label: String {
                switch self {
                case .low:      return "Low"
                case .normal:   return "Normal"
                case .elevated: return "Elevated"
                case .high:     return "High"
                }
            }
            var color: Color {
                switch self {
                case .low:      return .blue
                case .normal:   return .green
                case .elevated: return .yellow
                case .high:     return .red
                }
            }
        }
    }

    private var latest: BreathingNight? { nights.last }
    private var avgBpm: Double? {
        guard !nights.isEmpty else { return nil }
        return nights.map(\.avgBpm).reduce(0, +) / Double(nights.count)
    }
    private var normalNights: Int { nights.filter { $0.category == .normal }.count }
    private var elevatedNights: Int { nights.filter { $0.category == .elevated || $0.category == .high }.count }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if nights.isEmpty {
                    emptyState
                } else {
                    heroCard
                    trendChart
                    statsGrid
                    nightList
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Sleep Breathing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let cat = latest?.category ?? .normal
        return VStack(spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Last Night")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(latest.map { String(format: "%.1f", $0.avgBpm) } ?? "—")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(cat.color)
                        Text("br/min")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    Text(cat.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(cat.color)
                }
                Spacer()
                if let avg = avgBpm {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.1f", avg))
                            .font(.title3.bold())
                        Text("\(nights.count)-night avg")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if let n = latest {
                HStack(spacing: 16) {
                    Label(String(format: "%.0f min", n.minBpm), systemImage: "arrow.down")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Label(String(format: "%.0f max", n.maxBpm), systemImage: "arrow.up")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(n.sampleCount) samples")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        let data = nights.suffix(30)
        return VStack(alignment: .leading, spacing: 8) {
            Text("30-Night Trend").font(.headline).padding(.horizontal, 4)
            Chart {
                RuleMark(y: .value("Normal Min", 12)).foregroundStyle(.green.opacity(0.3))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                RuleMark(y: .value("Normal Max", 18)).foregroundStyle(.yellow.opacity(0.4))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                ForEach(data) { night in
                    AreaMark(
                        x: .value("Date", night.date),
                        yStart: .value("Min", night.minBpm),
                        yEnd: .value("Max", night.maxBpm)
                    )
                    .foregroundStyle(.blue.opacity(0.08))
                    LineMark(
                        x: .value("Date", night.date),
                        y: .value("Avg br/min", night.avgBpm)
                    )
                    .foregroundStyle(.blue)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                    .symbol(Circle().strokeBorder(lineWidth: 1.5))
                    .symbolSize(20)
                }
            }
            .chartYScale(domain: 8...28)
            .chartYAxis {
                AxisMarks(values: [12, 15, 18, 21, 24]) { val in
                    AxisValueLabel { if let v = val.as(Int.self) { Text("\(v)") } }
                    AxisGridLine()
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 160)
            .padding(.horizontal, 4)

            HStack(spacing: 12) {
                legendDot(.green, "Normal (12–18)")
                legendDot(.yellow, "Elevated (>18)")
            }
            .font(.caption2).foregroundStyle(.secondary).padding(.horizontal, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func legendDot(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
        }
    }

    // MARK: - Stats Grid

    private var statsGrid: some View {
        let pctNormal = nights.isEmpty ? 0.0 : Double(normalNights) / Double(nights.count) * 100
        let items: [(String, String, Color)] = [
            ("Avg Rate", avgBpm.map { String(format: "%.1f", $0) } ?? "—", .primary),
            ("Normal Nights", "\(normalNights)", .green),
            ("Elevated Nights", "\(elevatedNights)", elevatedNights > 3 ? .red : .orange),
            ("% Normal", String(format: "%.0f%%", pctNormal), pctNormal >= 85 ? .green : .orange),
        ]
        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(items, id: \.0) { label, value, color in
                VStack(spacing: 4) {
                    Text(value).font(.title3.bold()).foregroundStyle(color)
                    Text(label).font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    // MARK: - Night List

    private var nightList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Nights").font(.headline).padding(.horizontal, 4)
            VStack(spacing: 1) {
                ForEach(nights.suffix(14).reversed()) { night in
                    HStack {
                        Text(night.date, format: .dateTime.month(.abbreviated).day())
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 52, alignment: .leading)
                        Spacer()
                        HStack(spacing: 4) {
                            Circle().fill(night.category.color).frame(width: 6, height: 6)
                            Text(String(format: "%.1f br/min", night.avgBpm))
                                .font(.caption.bold())
                                .foregroundStyle(night.category.color)
                        }
                        Text(night.category.label)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .frame(width: 56, alignment: .trailing)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("About Sleep Breathing Rate", systemImage: "info.circle")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 6) {
                ForEach([
                    ("< 12 br/min", "Low — uncommon during sleep; check sensor placement.", Color.blue),
                    ("12–18 br/min", "Normal adult sleep breathing range.", Color.green),
                    ("18–22 br/min", "Elevated — may reflect snoring, restlessness, or mild sleep apnea.", Color.yellow),
                    ("> 22 br/min", "High — consider discussing with a physician. Could indicate sleep-disordered breathing.", Color.red),
                ], id: \.0) { range, desc, color in
                    HStack(alignment: .top, spacing: 8) {
                        Text(range).font(.caption2.bold()).foregroundStyle(color).frame(width: 90, alignment: .leading)
                        Text(desc).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }

            Text("Respiratory rate is measured by Apple Watch while you sleep. Consistent elevation above 18 br/min warrants attention. This is not a medical diagnosis.")
                .font(.caption2)
                .foregroundStyle(.secondary.opacity(0.7))
                .padding(.top, 2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "lungs").font(.system(size: 48)).foregroundStyle(.secondary)
            Text("No Breathing Data").font(.title3.bold())
            Text("Apple Watch measures your breathing rate while you sleep. Make sure to wear your watch to bed with sleep tracking enabled.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }.padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let sixtyDaysAgo = Calendar.current.date(byAdding: .day, value: -60, to: Date())!
        guard let samples = try? await healthKit.fetchSamples(
            for: .respiratoryRate,
            from: sixtyDaysAgo,
            to: Date()
        ) else { return }

        // Group by calendar date of the reading.
        // Sleep respiratory rate readings are taken during sleep hours — aggregate by the
        // calendar date they belong to (the morning wake date).
        let calendar = Calendar.current
        var byDate: [Date: [Double]] = [:]

        for sample in samples {
            // Use the "wake morning" date: samples taken after midnight belong to that day,
            // samples taken before midnight belong to the next day (since sleep starts previous evening).
            let sampleDate = sample.startDate
            let hour = calendar.component(.hour, from: sampleDate)
            // Normalize: samples between 6pm–midnight → use next calendar day
            let keyDate: Date
            if hour >= 18 {
                keyDate = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: sampleDate)!)
            } else {
                keyDate = calendar.startOfDay(for: sampleDate)
            }
            let bpm = sample.quantity.doubleValue(for: HKUnit(from: "count/min"))
            guard bpm > 5 && bpm < 40 else { continue } // filter outliers
            byDate[keyDate, default: []].append(bpm)
        }

        nights = byDate.compactMap { date, values in
            guard values.count >= 3 else { return nil } // need enough samples for reliability
            let avg = values.reduce(0, +) / Double(values.count)
            let minVal = values.min() ?? avg
            let maxVal = values.max() ?? avg
            return BreathingNight(
                date: date,
                avgBpm: avg,
                minBpm: minVal,
                maxBpm: maxVal,
                sampleCount: values.count
            )
        }
        .sorted { $0.date < $1.date }
    }
}

#Preview {
    NavigationStack { SleepBreathingView() }
}
