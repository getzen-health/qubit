import SwiftUI
import Charts
import HealthKit

// MARK: - UVExposureView

/// Tracks ultraviolet radiation exposure from HKQuantityType(.uvExposure).
/// Measured in joules per square metre (J/m²). Captured by Apple Watch Ultra
/// ambient light sensor during outdoor activities (watchOS 10+).
///
/// WHO UV Index categories:
/// - Low (UVI 0–2):      <25 J/m²  — minimal risk
/// - Moderate (UVI 3–5): 25–50 J/m² — some protection recommended
/// - High (UVI 6–7):     50–100 J/m² — protection essential
/// - Very High (8–10):   100–200 J/m² — extra protection needed
/// - Extreme (11+):      >200 J/m² — stay indoors during peak hours
///
/// Vitamin D synthesis requires 15–20 min of UVI 3+ without sunscreen.
/// SED (Standard Erythema Dose) for skin burning: 100–300 J/m² depending on skin type.
struct UVExposureView: View {

    struct DayReading: Identifiable {
        let id: Date
        let date: Date
        let totalJoules: Double         // cumulative daily UV exposure
        let peakJoulesPerHour: Double   // peak exposure rate

        var uvCategory: UVCategory { UVCategory(joulesPerDay: totalJoules) }
    }

    enum UVCategory: String {
        case low      = "Low"
        case moderate = "Moderate"
        case high     = "High"
        case veryHigh = "Very High"
        case extreme  = "Extreme"

        init(joulesPerDay: Double) {
            switch joulesPerDay {
            case ..<25:      self = .low
            case 25..<50:    self = .moderate
            case 50..<100:   self = .high
            case 100..<200:  self = .veryHigh
            default:         self = .extreme
            }
        }

        var color: Color {
            switch self {
            case .low:      return .green
            case .moderate: return .yellow
            case .high:     return .orange
            case .veryHigh: return .red
            case .extreme:  return .purple
            }
        }

        var recommendation: String {
            switch self {
            case .low:      return "Minimal UV risk. No sun protection needed. Great for outdoor activity."
            case .moderate: return "Consider sunscreen (SPF 30+) for extended outdoor time. Good conditions for Vitamin D synthesis."
            case .high:     return "Sunscreen, hat and protective clothing recommended. Limit unprotected outdoor time to 30 min."
            case .veryHigh: return "Extra protection essential. Reduce outdoor exposure during 10am–4pm peak hours."
            case .extreme:  return "Dangerous UV levels. Avoid outdoor exposure during peak hours. Seek shade."
            }
        }
    }

    @State private var days: [DayReading] = []
    @State private var latestCategory: UVCategory = .low
    @State private var todayTotal: Double = 0
    @State private var avg30: Double = 0
    @State private var highDays: Int = 0
    @State private var peakDay: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if days.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    categoryCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("UV Exposure")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's UV Exposure")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", todayTotal))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(latestCategory.color)
                        Text("J/m²")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(latestCategory.color).frame(width: 8, height: 8)
                        Text(latestCategory.rawValue).font(.subheadline).foregroundStyle(latestCategory.color)
                    }
                }
                Spacer()
                Image(systemName: "sun.max.fill")
                    .font(.system(size: 44)).foregroundStyle(latestCategory.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "30d Avg", value: String(format: "%.0f J/m²", avg30),
                         color: UVCategory(joulesPerDay: avg30).color)
                Divider().frame(height: 36)
                statCell(label: "Peak Day (30d)", value: String(format: "%.0f J/m²", peakDay), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "High+ Days", value: "\(highDays)",
                         color: highDays > 10 ? .red : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Days Tracked", value: "\(days.count)", color: .secondary)
            }
            Divider()
            Text(latestCategory.recommendation)
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
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
            Text("30-Day UV Exposure").font(.headline)
            Text("Daily total UV radiation (J/m²) — higher on sunny outdoor days")
                .font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(days) { d in
                    BarMark(x: .value("Date", d.date),
                            y: .value("UV", d.totalJoules))
                    .foregroundStyle(d.uvCategory.color.opacity(0.75))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("High threshold", 50))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                    .foregroundStyle(Color.orange.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("High").font(.caption2).foregroundStyle(.orange)
                    }
                RuleMark(y: .value("Vitamin D minimum", 15))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("Vit D").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("J/m²")
            .frame(height: 150)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Category Reference

    private var categoryCard: some View {
        let categories: [(UVCategory, String, String)] = [
            (.low,      "<25 J/m²",     "No sunscreen needed — safe for extended outdoor time"),
            (.moderate, "25–50 J/m²",   "SPF 30+ for >1 hr; ideal for Vitamin D synthesis"),
            (.high,     "50–100 J/m²",  "Sunscreen + hat; limit unprotected exposure to 30 min"),
            (.veryHigh, "100–200 J/m²", "Extra protection; avoid peak hours 10am–4pm"),
            (.extreme,  ">200 J/m²",    "Dangerous; seek shade, stay indoors at peak"),
        ]
        return VStack(alignment: .leading, spacing: 10) {
            Text("WHO UV Categories").font(.headline)
            ForEach(categories, id: \.1) { cat, range, rec in
                HStack(alignment: .top, spacing: 10) {
                    HStack(spacing: 6) {
                        RoundedRectangle(cornerRadius: 3).fill(cat.color).frame(width: 12, height: 12)
                        Text(cat.rawValue).font(.caption.bold()).foregroundStyle(cat.color)
                    }
                    .frame(width: 80, alignment: .leading)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(range).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        Text(rec).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "sun.max.trianglebadge.exclamationmark").foregroundStyle(.orange)
                Text("UV & Health Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Vitamin D synthesis", body: "15–20 minutes of midday sun at UVI 3+ produces ~1000 IU Vitamin D. Longer exposure doesn't produce more — melanin and angle of the sun limit synthesis.")
                sciRow(title: "Skin cancer risk", body: "Cumulative UV exposure is the primary environmental risk factor for all types of skin cancer. Sunscreen (SPF 30+) blocks ~97% of UVB radiation.")
                sciRow(title: "Sunburn dose (SED)", body: "1 SED = 100 J/m². Minimum erythema dose (sunburn threshold) ranges from 200 J/m² (fair skin, type I) to 800+ J/m² (dark skin, type VI).")
                sciRow(title: "Time of day", body: "~80% of daily UV exposure occurs between 10am–4pm. UV is highest at solar noon and increases with altitude (~10% per 1000m elevation gain).")
            }
            Divider()
            Text("☀️ UV exposure data requires Apple Watch Ultra with ambient light sensor (watchOS 10+). Data is captured automatically during outdoor activities.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.orange)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "sun.max.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No UV Exposure Data")
                .font(.title3.bold())
            Text("UV exposure tracking requires Apple Watch Ultra with the ambient light sensor (watchOS 10+). Wear your Watch during outdoor activities to start monitoring UV radiation.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let uvType = HKQuantityType(.uvExposure)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [uvType])) != nil
        else { return }

        let cal = Calendar.current
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let joulesPerM2 = HKUnit(from: "J/m^2")

        // Daily cumulative sums
        let stats: HKStatisticsCollection? = await withCheckedContinuation { cont in
            var comps = DateComponents(); comps.day = 1
            let q = HKStatisticsCollectionQuery(
                quantityType: uvType,
                quantitySamplePredicate: HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date()),
                options: .cumulativeSum,
                anchorDate: cal.startOfDay(for: thirtyDaysAgo),
                intervalComponents: comps
            )
            q.initialResultsHandler = { _, result, _ in cont.resume(returning: result) }
            healthStore.execute(q)
        }

        guard let stats else { return }

        var readings: [DayReading] = []
        stats.enumerateStatistics(from: thirtyDaysAgo, to: Date()) { stat, _ in
            let val = stat.sumQuantity()?.doubleValue(for: joulesPerM2) ?? 0
            if val > 0 {
                readings.append(DayReading(
                    id: stat.startDate, date: stat.startDate,
                    totalJoules: val, peakJoulesPerHour: val / 8 // rough estimate
                ))
            }
        }

        guard !readings.isEmpty else { return }

        days = readings
        todayTotal = readings.last?.totalJoules ?? 0
        latestCategory = UVCategory(joulesPerDay: todayTotal)

        let vals = readings.map(\.totalJoules)
        avg30 = vals.reduce(0,+) / Double(vals.count)
        peakDay = vals.max() ?? 0
        highDays = readings.filter { $0.uvCategory == .high || $0.uvCategory == .veryHigh || $0.uvCategory == .extreme }.count
    }
}

#Preview { NavigationStack { UVExposureView() } }
