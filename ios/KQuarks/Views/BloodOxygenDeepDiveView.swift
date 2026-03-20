import SwiftUI
import Charts
import HealthKit

// MARK: - BloodOxygenDeepDiveView

/// Deep-dive into blood oxygen saturation (SpO₂) — 30-day trend, nighttime
/// averages, low-reading alerts, and altitude/illness context.
///
/// HKQuantityType(.oxygenSaturation) — Apple Watch measures SpO₂ via infrared LED
/// photoplethysmography. Background measurements occur during sleep.
///
/// Normal SpO₂: 95–100%. Below 92% (chronic) warrants medical evaluation.
/// Nocturnal dips <92% may indicate sleep apnea or respiratory issues.
struct BloodOxygenDeepDiveView: View {

    struct SpO2Reading: Identifiable {
        let id: UUID
        let date: Date
        let pct: Double   // 0–100
    }

    struct DailySpO2: Identifiable {
        let id: Date
        let date: Date
        let avgPct: Double
        let minPct: Double
        let readingCount: Int

        var status: SpO2Status { SpO2Status(pct: avgPct) }
    }

    enum SpO2Status: String {
        case normal = "Normal"
        case borderline = "Borderline"
        case low = "Low"
        case veryLow = "Very Low"

        init(pct: Double) {
            switch pct {
            case 95...: self = .normal
            case 92..<95: self = .borderline
            case 88..<92: self = .low
            default: self = .veryLow
            }
        }

        var color: Color {
            switch self {
            case .normal: return .blue
            case .borderline: return .yellow
            case .low: return .orange
            case .veryLow: return .red
            }
        }
    }

    @State private var dailyData: [DailySpO2] = []
    @State private var latest: Double = 0
    @State private var avgPct: Double = 0
    @State private var minPct: Double = 0
    @State private var daysBelow95: Int = 0
    @State private var nighttimeAvg: Double = 0
    @State private var status: SpO2Status = .normal
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if dailyData.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    dailyLogCard
                    referenceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Blood Oxygen (SpO₂)")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("30-Day SpO₂ Summary")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f%%", avgPct))
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(status.color)
                        Text("avg")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(status.color).frame(width: 8, height: 8)
                        Text(status.rawValue)
                            .font(.subheadline).foregroundStyle(status.color)
                    }
                }
                Spacer()
                Image(systemName: "lungs.fill")
                    .font(.system(size: 44)).foregroundStyle(status.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Latest", value: String(format: "%.0f%%", latest), color: SpO2Status(pct: latest).color)
                Divider().frame(height: 36)
                statCell(label: "Lowest (30d)", value: String(format: "%.0f%%", minPct), color: minPct < 92 ? .red : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Sleep Avg", value: nighttimeAvg > 0 ? String(format: "%.0f%%", nighttimeAvg) : "—", color: .indigo)
                Divider().frame(height: 36)
                statCell(label: "Days <95%", value: "\(daysBelow95)", color: daysBelow95 > 5 ? .orange : .secondary)
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
            Text("30-Day SpO₂ Trend").font(.headline)
            Chart {
                ForEach(dailyData) { d in
                    LineMark(x: .value("Date", d.date),
                             y: .value("SpO2", d.avgPct))
                    .foregroundStyle(Color.blue.opacity(0.6))
                    .interpolationMethod(.catmullRom)
                }
                ForEach(dailyData) { d in
                    PointMark(x: .value("Date", d.date),
                              y: .value("SpO2", d.avgPct))
                    .foregroundStyle(d.status.color)
                    .symbolSize(20)
                }
                RuleMark(y: .value("Normal", 95))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("95%").font(.caption2).foregroundStyle(.green)
                    }
                RuleMark(y: .value("Caution", 92))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
                    .foregroundStyle(Color.orange.opacity(0.4))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("92%").font(.caption2).foregroundStyle(.orange)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("%")
            .chartYScale(domain: 85...100)
            .frame(height: 170)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Daily Log Card

    private var dailyLogCard: some View {
        let df = DateFormatter()
        let _ = { df.dateFormat = "MMM d" }()

        return VStack(alignment: .leading, spacing: 8) {
            Text("Daily Summary").font(.headline)
            VStack(spacing: 0) {
                HStack {
                    Text("Date").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .leading)
                    Text("Avg %").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 50, alignment: .trailing)
                    Text("Min %").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 50, alignment: .trailing)
                    Text("Readings").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                    Spacer()
                    Text("Status").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 65, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(dailyData.suffix(14).reversed()) { d in
                    Divider()
                    HStack {
                        Text(df.string(from: d.date)).font(.caption).frame(width: 65, alignment: .leading)
                        Text(String(format: "%.0f%%", d.avgPct)).font(.caption.monospacedDigit()).foregroundStyle(d.status.color).frame(width: 50, alignment: .trailing)
                        Text(String(format: "%.0f%%", d.minPct)).font(.caption.monospacedDigit()).foregroundStyle(d.minPct < 92 ? .red : .secondary).frame(width: 50, alignment: .trailing)
                        Text("\(d.readingCount)").font(.caption.monospacedDigit()).foregroundStyle(.secondary).frame(width: 55, alignment: .trailing)
                        Spacer()
                        Text(d.status.rawValue).font(.caption2.bold()).foregroundStyle(d.status.color).frame(width: 65, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 7)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Reference Card

    private var referenceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "lungs.fill").foregroundStyle(.blue)
                Text("SpO₂ Reference Ranges").font(.headline)
            }
            VStack(spacing: 5) {
                refRow(range: "≥ 95%", label: "Normal", detail: "Healthy oxygen saturation — no concern", color: .blue)
                refRow(range: "92–94%", label: "Borderline", detail: "Monitor for symptoms: shortness of breath, fatigue", color: .yellow)
                refRow(range: "88–91%", label: "Low", detail: "Consult healthcare provider if persistent", color: .orange)
                refRow(range: "< 88%", label: "Very Low", detail: "Seek medical evaluation", color: .red)
            }
            Divider()
            Text("⚠️ Nocturnal SpO₂ dips <92% on repeated nights may indicate obstructive sleep apnea. Apple Watch SpO₂ is for wellness monitoring — not a medical device. Motion and skin tone can affect accuracy.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.blue.opacity(0.18), lineWidth: 1))
    }

    private func refRow(range: String, label: String, detail: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(range).font(.caption.bold().monospacedDigit()).foregroundStyle(color).frame(width: 55, alignment: .leading)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.caption.bold()).foregroundStyle(color)
                Text(detail).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "lungs.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No SpO₂ Data")
                .font(.title3.bold())
            Text("Blood oxygen is measured by Apple Watch Series 6+ during sleep and on-demand. Enable Blood Oxygen in the Health app to start collecting data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let spo2Type = HKQuantityType(.oxygenSaturation)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [spo2Type])) != nil else { return }

        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let pctUnit = HKUnit.percent()
        let cal = Calendar.current

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: spo2Type,
                predicate: HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        let readings = samples.map { s in
            SpO2Reading(id: s.uuid, date: s.startDate,
                        pct: s.quantity.doubleValue(for: pctUnit) * 100)
        }.filter { $0.pct >= 70 && $0.pct <= 100 }

        guard !readings.isEmpty else { return }

        // Group by day
        var dayMap: [Date: [Double]] = [:]
        for r in readings {
            let day = cal.startOfDay(for: r.date)
            dayMap[day, default: []].append(r.pct)
        }

        let allDays = dayMap.map { date, vals in
            DailySpO2(id: date, date: date,
                      avgPct: vals.reduce(0, +) / Double(vals.count),
                      minPct: vals.min() ?? 0,
                      readingCount: vals.count)
        }.sorted { $0.date < $1.date }

        dailyData = allDays
        latest = allDays.last?.avgPct ?? 0
        let avgs = allDays.map(\.avgPct)
        avgPct = avgs.reduce(0, +) / Double(avgs.count)
        minPct = allDays.map(\.minPct).min() ?? 0
        status = SpO2Status(pct: avgPct)
        daysBelow95 = allDays.filter { $0.avgPct < 95 }.count

        // Nighttime avg: readings between 10pm–6am
        let nightReadings = readings.filter { r in
            let hour = cal.component(.hour, from: r.date)
            return hour >= 22 || hour < 6
        }
        if !nightReadings.isEmpty {
            nighttimeAvg = nightReadings.map(\.pct).reduce(0, +) / Double(nightReadings.count)
        }
    }
}

#Preview { NavigationStack { BloodOxygenDeepDiveView() } }
