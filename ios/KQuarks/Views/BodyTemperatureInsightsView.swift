import SwiftUI
import Charts
import HealthKit

// MARK: - BodyTemperatureInsightsView

/// Wrist temperature deviation analysis — Apple Watch Series 8+ and Ultra.
///
/// HKQuantityType(.appleSleepingWristTemperature) captures nightly skin temperature
/// deviation from the user's personal baseline (in °C). Baseline is computed by
/// Apple over ~5 nights. Values are typically −0.5 to +2.0 °C.
///
/// Clinical relevance:
/// - Persistent deviation ≥ 1.0 °C for 2+ nights: possible illness or fever
/// - Consistent +0.3–0.5 °C in luteal phase: normal ovulation signal (biphasic)
/// - Deviation < −0.5 °C: alcohol, ambient cold, or peripheral vasoconstriction
///
/// Note: wrist temperature ≠ core body temperature. It correlates directionally.
struct BodyTemperatureInsightsView: View {

    struct NightReading: Identifiable {
        let id: Date
        let date: Date
        let deviationC: Double  // deviation from personal baseline

        var signal: TemperatureSignal { TemperatureSignal(deviation: deviationC) }
    }

    enum TemperatureSignal: String {
        case elevated = "Elevated"
        case normal   = "Normal"
        case low      = "Low"

        init(deviation: Double) {
            if deviation >= 1.0      { self = .elevated }
            else if deviation <= -0.5 { self = .low }
            else                      { self = .normal }
        }

        var color: Color {
            switch self {
            case .elevated: return .orange
            case .normal:   return .blue
            case .low:      return .cyan
            }
        }

        var icon: String {
            switch self {
            case .elevated: return "thermometer.high"
            case .normal:   return "thermometer.medium"
            case .low:      return "thermometer.low"
            }
        }
    }

    @State private var readings: [NightReading] = []
    @State private var latestDeviation: Double = 0
    @State private var avgDeviation: Double = 0
    @State private var maxDeviation: Double = 0
    @State private var minDeviation: Double = 0
    @State private var consecutiveElevated: Int = 0
    @State private var signal: TemperatureSignal = .normal
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if readings.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    streakCard
                    referenceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Temperature Insights")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Last Night")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(latestDeviation >= 0 ? "+" : "")
                        + Text(String(format: "%.2f", latestDeviation))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(signal.color)
                        Text("°C")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Image(systemName: signal.icon).foregroundStyle(signal.color)
                        Text(signal.rawValue)
                            .font(.subheadline).foregroundStyle(signal.color)
                    }
                }
                Spacer()
                Image(systemName: "thermometer.medium")
                    .font(.system(size: 44)).foregroundStyle(signal.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "30d Avg", value: String(format: "%+.2f°C", avgDeviation), color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Peak (30d)", value: String(format: "+%.2f°C", maxDeviation), color: maxDeviation >= 1.0 ? .orange : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Nights > 1°C", value: "\(readings.filter { $0.deviationC >= 1.0 }.count)", color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Consecutive ↑", value: consecutiveElevated > 0 ? "\(consecutiveElevated)d" : "—", color: consecutiveElevated >= 2 ? .orange : .secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("30-Day Temperature Trend").font(.headline)
            Text("Nightly deviation from personal baseline — positive = warmer than usual")
                .font(.caption).foregroundStyle(.secondary)

            Chart {
                ForEach(readings) { r in
                    BarMark(
                        x: .value("Date", r.date),
                        y: .value("Deviation", r.deviationC)
                    )
                    .foregroundStyle(r.signal.color.opacity(0.7))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Baseline", 0))
                    .lineStyle(StrokeStyle(lineWidth: 1.5))
                    .foregroundStyle(.secondary.opacity(0.4))
                RuleMark(y: .value("Elevated", 1.0))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.orange.opacity(0.5))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("+1°").font(.caption2).foregroundStyle(.orange)
                    }
                RuleMark(y: .value("Low", -0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
                    .foregroundStyle(Color.cyan.opacity(0.4))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("−0.5°").font(.caption2).foregroundStyle(.cyan)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("°C vs baseline")
            .chartYScale(domain: min(-1.5, minDeviation - 0.2)...max(2.5, maxDeviation + 0.2))
            .frame(height: 180)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Illness Signal Card

    private var streakCard: some View {
        let elevatedNights = readings.reversed().prefix(while: { $0.deviationC >= 0.5 }).count
        let signalLevel: (label: String, desc: String, color: Color) = {
            if consecutiveElevated >= 3 {
                return ("Possible Illness Signal", "Wrist temperature elevated ≥ 1°C for \(consecutiveElevated) consecutive nights. Consider monitoring for symptoms: fatigue, sore throat, or chills.", .red)
            } else if consecutiveElevated == 2 {
                return ("Watch & Wait", "Two consecutive elevated nights. Stay hydrated and monitor. One more elevated night warrants attention.", .orange)
            } else if elevatedNights == 1 || latestDeviation >= 0.3 {
                return ("Mildly Warm", "Last night was slightly above baseline. This may be from exercise, alcohol, a warm room, or the start of a mild illness.", .yellow)
            } else {
                return ("Baseline — All Clear", "Your recent wrist temperature is within normal variation. No illness signal detected.", .green)
            }
        }()

        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "stethoscope").foregroundStyle(signalLevel.color)
                Text("Illness Signal Detector").font(.headline)
            }
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 4).fill(signalLevel.color).frame(width: 4, height: 50)
                VStack(alignment: .leading, spacing: 4) {
                    Text(signalLevel.label).font(.subheadline.bold()).foregroundStyle(signalLevel.color)
                    Text(signalLevel.desc).font(.caption).foregroundStyle(.secondary)
                }
            }
            Divider()

            Text("Cycle note: In the luteal phase (after ovulation), it's normal to see a consistent +0.3–0.5°C elevation that resolves at menstruation. This is NOT an illness signal.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Reference Card

    private var referenceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "info.circle.fill").foregroundStyle(.blue)
                Text("How to Read Wrist Temperature").font(.headline)
            }
            VStack(spacing: 5) {
                refRow(range: "≥ +1.0°C", label: "Elevated", detail: "Possible infection, fever, inflammatory response, or post-exercise heat retention", color: .orange)
                refRow(range: "+0.3–1.0°C", label: "Slightly Warm", detail: "Mild elevation — alcohol, hot bath before bed, luteal phase, or light illness onset", color: .yellow)
                refRow(range: "−0.5 to +0.3°C", label: "Normal", detail: "Within your typical night-to-night variation — baseline range", color: .blue)
                refRow(range: "< −0.5°C", label: "Low", detail: "Peripheral cooling from cold environment, vasoconstriction, or blood flow redistribution", color: .cyan)
            }
            Divider()
            Text("⚠️ Wrist temperature is not core body temperature. A clinical fever is ≥38°C (100.4°F) oral. Apple Watch measures skin surface temperature at the wrist and is designed for trend detection, not diagnosis.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.18), lineWidth: 1))
    }

    private func refRow(range: String, label: String, detail: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(range).font(.caption.bold().monospacedDigit()).foregroundStyle(color).frame(width: 70, alignment: .leading)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.caption.bold()).foregroundStyle(color)
                Text(detail).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "thermometer.medium")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Wrist Temperature Data")
                .font(.title3.bold())
            Text("Wrist temperature is measured during sleep by Apple Watch Series 8, Ultra, and later. Wear your Watch to bed for at least 5 nights to establish a baseline.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let tempType = HKQuantityType(.appleSleepingWristTemperature)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [tempType])) != nil else { return }

        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let cal = Calendar.current

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: tempType,
                predicate: HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        // Group by calendar date (night = morning sample date)
        var dayMap: [Date: [Double]] = [:]
        for s in samples {
            let day = cal.startOfDay(for: s.endDate)
            // HKQuantityTypeIdentifier.appleSleepingWristTemperature stores deviation in Celsius
            let devC = s.quantity.doubleValue(for: HKUnit.degreeCelsius())
            dayMap[day, default: []].append(devC)
        }

        let allReadings = dayMap.map { date, vals in
            NightReading(id: date, date: date,
                         deviationC: vals.reduce(0, +) / Double(vals.count))
        }.sorted { $0.date < $1.date }

        readings = allReadings

        latestDeviation = allReadings.last?.deviationC ?? 0
        signal = TemperatureSignal(deviation: latestDeviation)
        let devs = allReadings.map(\.deviationC)
        avgDeviation = devs.reduce(0, +) / Double(devs.count)
        maxDeviation = devs.max() ?? 0
        minDeviation = devs.min() ?? 0

        // Count consecutive nights ≥ 1°C ending at most recent
        consecutiveElevated = allReadings.reversed().prefix(while: { $0.deviationC >= 1.0 }).count
    }
}

#Preview { NavigationStack { BodyTemperatureInsightsView() } }
