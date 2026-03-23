import SwiftUI
import HealthKit
import Charts

// MARK: - WalkingSpeedView
// Tracks habitual walking speed — the "sixth vital sign" in geriatric medicine.
// iPhone/Apple Watch measure this passively during everyday walks (iOS 14+).
//
// Science:
//   Studenski et al. 2011 (JAMA): walking speed predicts 10-year survival better than most
//     clinical tests. Each 0.1 m/s increase associated with ~12% lower mortality risk.
//     0.8 m/s is the clinical "cut point" for poor prognosis in older adults.
//   Fritz & Lusardi 2009 (Phys Ther): <0.6 m/s = community ambulation at risk;
//     0.6–1.0 m/s = limited community access; >1.0 m/s = full community independence.
//   Bohannon & Williams Andrews 2011 (J Strength Cond): gait speed declines ~1% per year
//     after age 60; normative values: 1.25 m/s (young adults), 1.0 m/s (age 65+).
//   Montero-Odasso et al. 2012 (J Am Geriatr Soc): habitual speed <1.0 m/s associated
//     with increased fall risk and mild cognitive impairment.
//
// Normal values (adults): <0.6 = very low, 0.6–0.8 = low, 0.8–1.0 = fair,
//   1.0–1.2 = good, ≥1.2 = excellent.

struct WalkingSpeedView: View {

    // MARK: - Models

    struct DayReading: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let speed: Double    // m/s
        var level: SpeedLevel {
            switch speed {
            case 1.2...:       return .excellent
            case 1.0..<1.2:   return .good
            case 0.8..<1.0:   return .fair
            case 0.6..<0.8:   return .low
            default:           return .veryLow
            }
        }
    }

    enum SpeedLevel: String {
        case excellent = "Excellent"
        case good      = "Good"
        case fair      = "Fair"
        case low       = "Low"
        case veryLow   = "Very Low"

        var color: Color {
            switch self {
            case .excellent: return .green
            case .good:      return .blue
            case .fair:      return .yellow
            case .low:       return .orange
            case .veryLow:   return .red
            }
        }

        var icon: String {
            switch self {
            case .excellent: return "figure.walk"
            case .good:      return "checkmark.circle.fill"
            case .fair:      return "checkmark.circle"
            case .low:       return "exclamationmark.circle"
            case .veryLow:   return "exclamationmark.triangle.fill"
            }
        }
    }

    // MARK: - State

    @State private var readings: [DayReading] = []
    @State private var avg30: Double = 0
    @State private var trend: Double = 0     // slope m/s per week
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Reading walking speed…")
                        .padding(.top, 60)
                } else if readings.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    speedChart
                    distributionCard
                    longevityCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Walking Speed")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let latest = readings.last
        let level  = latest?.level ?? .fair

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: latest.map { String(format: "%.2f m/s", $0.speed) } ?? "—",
                    label: "Latest",
                    sub: latest?.level.rawValue ?? "—",
                    color: latest?.level.color ?? .secondary
                )
                Divider().frame(height: 44)
                statBox(
                    value: avg30 > 0 ? String(format: "%.2f m/s", avg30) : "—",
                    label: "30-Day Avg",
                    sub: levelForSpeed(avg30).rawValue,
                    color: levelForSpeed(avg30).color
                )
                Divider().frame(height: 44)
                statBox(
                    value: trend != 0 ? String(format: "%+.3f m/s/wk", trend) : "—",
                    label: "Trend",
                    sub: trend > 0.002 ? "Improving" : trend < -0.002 ? "Declining" : "Stable",
                    color: trend > 0.002 ? .green : trend < -0.002 ? .red : .secondary
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: level.icon)
                    .foregroundStyle(level.color)
                Text(statusMessage(avg30))
                    .font(.caption)
                    .foregroundStyle(level.color)
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statusMessage(_ speed: Double) -> String {
        switch levelForSpeed(speed) {
        case .excellent: return "Excellent gait speed — top longevity quartile (Studenski 2011)."
        case .good:      return "Good walking speed — community independence maintained."
        case .fair:      return "Fair speed — borderline zone. Regular walking & leg strengthening recommended."
        case .low:       return "Low walking speed (<0.8 m/s). Consider physiotherapy assessment and progressive walking program."
        case .veryLow:   return "Very low gait speed (<0.6 m/s). Clinical evaluation recommended — fall risk and mobility may be compromised."
        }
    }

    private func levelForSpeed(_ speed: Double) -> SpeedLevel {
        switch speed {
        case 1.2...:     return .excellent
        case 1.0..<1.2: return .good
        case 0.8..<1.0: return .fair
        case 0.6..<0.8: return .low
        default:         return .veryLow
        }
    }

    // MARK: - Speed Chart

    private var speedChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Walking Speed — 90 Days", systemImage: "figure.walk")
                .font(.subheadline).bold()
            Text("Higher is better. Target: ≥1.0 m/s for community independence, ≥1.2 m/s for excellent longevity prognosis.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(readings) { r in
                LineMark(
                    x: .value("Date", r.date),
                    y: .value("Speed (m/s)", r.speed)
                )
                .foregroundStyle(Color.teal.gradient)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Date", r.date),
                    y: .value("Speed (m/s)", r.speed)
                )
                .foregroundStyle(Color.teal.opacity(0.08))
                .interpolationMethod(.catmullRom)

                // 0.8 m/s clinical threshold
                RuleMark(y: .value("Clinical threshold", 0.8))
                    .foregroundStyle(Color.orange.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .annotation(position: .trailing, alignment: .leading) {
                        Text("0.8").font(.caption2).foregroundStyle(.orange)
                    }

                // 1.0 m/s community independence threshold
                RuleMark(y: .value("Community", 1.0))
                    .foregroundStyle(Color.blue.opacity(0.4))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .annotation(position: .trailing, alignment: .leading) {
                        Text("1.0").font(.caption2).foregroundStyle(.blue)
                    }

                // 1.2 m/s excellent threshold
                RuleMark(y: .value("Excellent", 1.2))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .annotation(position: .trailing, alignment: .leading) {
                        Text("1.2").font(.caption2).foregroundStyle(.green)
                    }
            }
            .frame(height: 180)
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear, count: 2)) { _ in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .chartYScale(domain: max(0.3, (readings.map(\.speed).min() ?? 0.6) - 0.1)...max(1.4, (readings.map(\.speed).max() ?? 1.2) + 0.1))
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Distribution Card

    private var distributionCard: some View {
        let bins: [(String, ClosedRange<Double>, Color)] = [
            ("≥1.2 m/s", 1.2...Double.greatestFiniteMagnitude, .green),
            ("1.0–1.2",  1.0...1.2, .blue),
            ("0.8–1.0",  0.8...1.0, .yellow),
            ("0.6–0.8",  0.6...0.8, .orange),
            ("<0.6 m/s", 0.0...0.6, .red),
        ]
        let total = Double(readings.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Speed Distribution", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()

            ForEach(bins, id: \.0) { label, range, color in
                let count = Double(readings.filter { range.contains($0.speed) }.count)
                let pct   = total > 0 ? count / total * 100 : 0

                HStack {
                    Text(label).font(.caption2).frame(width: 60, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 12)
                            Capsule().fill(color.gradient).frame(width: geo.size.width * pct / 100, height: 12)
                        }
                    }
                    .frame(height: 12)
                    Text(String(format: "%.0f%%", pct))
                        .font(.caption2.bold()).foregroundStyle(color).frame(width: 32, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Longevity Card

    private var longevityCard: some View {
        let avgSpeed = avg30 > 0 ? avg30 : (readings.last?.speed ?? 0)
        let survivalBoost = max(0, (avgSpeed - 0.8) / 0.1) * 12  // ~12% per 0.1 m/s above 0.8

        return VStack(alignment: .leading, spacing: 8) {
            Label("Longevity Implication", systemImage: "heart.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.teal)

            if avgSpeed >= 1.2 {
                Text("Your walking speed places you in the top longevity quartile. Studenski 2011 found individuals walking ≥1.2 m/s had the best 10-year survival outcomes.")
                    .font(.caption).foregroundStyle(.secondary)
            } else if avgSpeed >= 1.0 {
                Text("Good walking speed — consistent with community independence. Increasing to ≥1.2 m/s through regular brisk walking may further reduce all-cause mortality risk.")
                    .font(.caption).foregroundStyle(.secondary)
            } else if avgSpeed >= 0.8 {
                Text("Fair gait speed. You are above the clinical concern threshold (0.8 m/s). Improving to ≥1.0 m/s is associated with full community mobility and lower fall risk (Fritz 2009).")
                    .font(.caption).foregroundStyle(.secondary)
            } else if avgSpeed > 0 {
                Text("⚠️ Walking speed is below the 0.8 m/s clinical concern threshold (Studenski 2011). This range is associated with reduced independence, fall risk, and higher mortality. Consider a progressive walking program or physiotherapy referral.")
                    .font(.caption).foregroundStyle(.orange)
            }

            if survivalBoost > 0 {
                HStack {
                    Image(systemName: "arrow.up.heart.fill").foregroundStyle(.green).font(.caption)
                    Text(String(format: "Estimated longevity benefit vs 0.8 m/s baseline: ~%.0f%%", survivalBoost))
                        .font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.teal.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Walking Speed Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Walking speed is considered the \"sixth vital sign\" in clinical medicine. iPhone and Apple Watch measure it passively using the accelerometer during normal daily walking — no special protocol required (iOS 14+, Apple Watch Series 4+).")
                .font(.caption).foregroundStyle(.secondary)
            Text("Studenski et al. 2011 (JAMA): in a pooled study of 34,485 adults aged 65+, each 0.1 m/s increase in gait speed was associated with ~12% lower all-cause mortality over 10 years. Walking speed predicted survival better than sex, age, or BMI alone.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Fritz & Lusardi 2009 (Phys Ther): established the 0.6, 0.8, and 1.0 m/s clinical cut-points. Montero-Odasso et al. 2012 (J Am Geriatr Soc): gait speed <1.0 m/s independently predicted mild cognitive impairment and dementia onset.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.walk")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No walking speed data")
                .font(.headline)
            Text("Walking speed is measured automatically by iPhone and Apple Watch (Series 4+, iOS 14+) during everyday walks. Take regular walks with your device to start collecting data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal)
        }
        .padding(40)
    }

    // MARK: - Helpers

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let speedType = HKQuantityType(.walkingSpeed)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [speedType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .day, value: -90, to: end)!
        let interval = DateComponents(day: 1)
        let anchor = calendar.startOfDay(for: start)

        let collection: HKStatisticsCollection? = await withCheckedContinuation { cont in
            let q = HKStatisticsCollectionQuery(
                quantityType: speedType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: start, end: end),
                options: .discreteAverage,
                anchorDate: anchor, intervalComponents: interval)
            q.initialResultsHandler = { _, results, _ in cont.resume(returning: results) }
            healthStore.execute(q)
        }

        let metersPerSecond = HKUnit.meter().unitDivided(by: .second())
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        var result: [DayReading] = []
        collection?.enumerateStatistics(from: start, to: end) { stat, _ in
            guard let qty = stat.averageQuantity() else { return }
            let speed = qty.doubleValue(for: metersPerSecond)
            guard speed > 0 else { return }
            result.append(DayReading(date: stat.startDate, label: fmt.string(from: stat.startDate), speed: speed))
        }

        let avg = result.isEmpty ? 0.0 : result.map(\.speed).reduce(0, +) / Double(result.count)

        // Linear trend (slope per week)
        let trendPerWeek: Double
        if result.count >= 7 {
            let xs = result.enumerated().map { Double($0.offset) }
            let ys = result.map(\.speed)
            let n  = Double(xs.count)
            let meanX = xs.reduce(0, +) / n; let meanY = ys.reduce(0, +) / n
            let num  = zip(xs, ys).map { ($0 - meanX) * ($1 - meanY) }.reduce(0, +)
            let den  = xs.map { pow($0 - meanX, 2) }.reduce(0, +)
            trendPerWeek = den == 0 ? 0 : (num / den) * 7
        } else { trendPerWeek = 0 }

        DispatchQueue.main.async {
            self.readings  = result
            self.avg30     = avg
            self.trend     = trendPerWeek
            self.isLoading = false
        }
    }
}
