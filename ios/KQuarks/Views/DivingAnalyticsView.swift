import SwiftUI
import Charts
import HealthKit

// MARK: - DivingAnalyticsView

/// Tracks underwater depth and water temperature from Apple Watch Ultra
/// (watchOS 9+ / iOS 16+) during diving activities.
///
/// HKQuantityType(.underwaterDepth)   — depth in metres below surface
/// HKQuantityType(.waterTemperature)  — water temperature in °C
///
/// Depth categories (recreational diving):
/// - Snorkelling:   0–5 m    — accessible without certification
/// - Open Water:    5–18 m   — PADI Open Water limit
/// - Advanced:      18–30 m  — PADI Advanced limit (no-decompression)
/// - Deep:          30–40 m  — PADI Deep Diver limit (technical starts here)
///
/// No-decompression limits (NDL) using PADI tables:
/// - 10 m: unlimited (practical limit ~219 min on air)
/// - 18 m: 56 min
/// - 30 m: 20 min
/// - 40 m: 9 min
///
/// Apple Watch Ultra is depth-rated to 100 m (EN13319 compliant) and
/// supports Open Water and Freediving workout types in the Workout app,
/// as well as the Oceanic+ dive app.
struct DivingAnalyticsView: View {

    struct DiveSession: Identifiable {
        let id: UUID
        let date: Date
        let maxDepthM: Double
        let avgDepthM: Double
        let waterTempC: Double?
        let durationMins: Double

        var depthCategory: DepthCategory { DepthCategory(metres: maxDepthM) }
        var ndlStatus: String { DepthCategory(metres: maxDepthM).ndl }
    }

    enum DepthCategory: String {
        case snorkel  = "Snorkelling"
        case openWater = "Open Water"
        case advanced = "Advanced"
        case deep     = "Deep"

        init(metres: Double) {
            switch metres {
            case ..<5:   self = .snorkel
            case 5..<18: self = .openWater
            case 18..<30: self = .advanced
            default:     self = .deep
            }
        }

        var color: Color {
            switch self {
            case .snorkel:   return .cyan
            case .openWater: return .blue
            case .advanced:  return .indigo
            case .deep:      return .purple
            }
        }

        var ndl: String {
            switch self {
            case .snorkel:   return "No limit (surface swim)"
            case .openWater: return "56 min at 18 m (no deco)"
            case .advanced:  return "20 min at 30 m (no deco)"
            case .deep:      return "9 min at 40 m — decompression risk"
            }
        }
    }

    @State private var dives: [DiveSession] = []
    @State private var maxDepth: Double = 0
    @State private var avgMaxDepth: Double = 0
    @State private var avgTemp: Double = 0
    @State private var totalDives: Int = 0
    @State private var deepestCategory: DepthCategory = .snorkel
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if dives.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    depthChart
                    diveLog
                    referenceCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Diving Analytics")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Deepest Dive (90d)")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", maxDepth))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(deepestCategory.color)
                        Text("m")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(deepestCategory.color).frame(width: 8, height: 8)
                        Text(deepestCategory.rawValue).font(.subheadline).foregroundStyle(deepestCategory.color)
                    }
                }
                Spacer()
                Image(systemName: "water.waves")
                    .font(.system(size: 44)).foregroundStyle(deepestCategory.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Total Dives", value: "\(totalDives)", color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Avg Max Depth", value: String(format: "%.1f m", avgMaxDepth),
                         color: DepthCategory(metres: avgMaxDepth).color)
                Divider().frame(height: 36)
                statCell(label: "Avg Water Temp",
                         value: avgTemp > 0 ? String(format: "%.1f°C", avgTemp) : "—",
                         color: avgTemp > 0 ? (avgTemp > 20 ? .green : avgTemp > 15 ? .blue : .indigo) : .secondary)
                Divider().frame(height: 36)
                statCell(label: "NDL at Max", value: deepestCategory.ndl.components(separatedBy: " (").first ?? "—",
                         color: deepestCategory.color)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color).minimumScaleFactor(0.7)
            Text(label).font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Depth Chart

    private var depthChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Dive Depth History").font(.headline)
            Text("Max depth per dive — lower values on chart = deeper (inverted Y)")
                .font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(dives) { d in
                    BarMark(x: .value("Date", d.date),
                            y: .value("Depth", d.maxDepthM))
                    .foregroundStyle(d.depthCategory.color.opacity(0.8))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Open Water", 18))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.blue.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("18 m").font(.caption2).foregroundStyle(.blue)
                    }
                RuleMark(y: .value("Advanced", 30))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.indigo.opacity(0.4))
                    .annotation(position: .trailing) {
                        Text("30 m").font(.caption2).foregroundStyle(.indigo)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Depth (m)")
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Dive Log

    private var diveLog: some View {
        let df = DateFormatter()
        let _ = { df.dateStyle = .medium }()
        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Dives").font(.headline)
            VStack(spacing: 0) {
                ForEach(dives.prefix(10)) { dive in
                    if dive.id != dives.prefix(10).first?.id { Divider() }
                    HStack(spacing: 12) {
                        Circle().fill(dive.depthCategory.color).frame(width: 10, height: 10)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(df.string(from: dive.date)).font(.subheadline.bold())
                            Text(dive.depthCategory.rawValue).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.1f m max", dive.maxDepthM)).font(.caption.bold().monospacedDigit()).foregroundStyle(dive.depthCategory.color)
                            if let t = dive.waterTempC {
                                Text(String(format: "%.0f°C", t)).font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Reference Card

    private var referenceCard: some View {
        let levels: [(DepthCategory, String, String)] = [
            (.snorkel,   "0–5 m",   "Snorkelling — no certification required"),
            (.openWater, "5–18 m",  "PADI Open Water limit — NDL ~56 min at 18 m"),
            (.advanced,  "18–30 m", "PADI Advanced limit — NDL ~20 min at 30 m"),
            (.deep,      "30–40 m", "PADI Deep Diver — NDL 9 min; decompression risk"),
        ]
        return VStack(alignment: .leading, spacing: 10) {
            Text("Depth Reference Guide").font(.headline)
            Text("Recreational diving limits — no-decompression times (air, PADI tables)")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(levels, id: \.1) { cat, range, desc in
                HStack(alignment: .top, spacing: 10) {
                    HStack(spacing: 6) {
                        Circle().fill(cat.color).frame(width: 8, height: 8)
                        Text(cat.rawValue).font(.caption.bold()).foregroundStyle(cat.color)
                    }
                    .frame(width: 90, alignment: .leading)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(range).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        Text(desc).font(.caption2).foregroundStyle(.secondary)
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
                Image(systemName: "water.waves").foregroundStyle(.blue)
                Text("Diving Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Pressure & nitrogen narcosis", body: "Water pressure increases 1 atm per 10 m depth. Nitrogen narcosis (\"rapture of the deep\") typically onset at 30–40 m, causing impaired judgment — a key reason recreational limits are 40 m.")
                sciRow(title: "No-decompression limits (NDL)", body: "NDL is the maximum bottom time at a given depth without mandatory decompression stops. Violating NDL risks decompression sickness (DCS / \"the bends\") — nitrogen bubbles forming in tissues.")
                sciRow(title: "Water temperature & thermoregulation", body: "Water conducts heat 25× faster than air. At 20°C water a diver without wetsuit loses core temperature in minutes. ≥7mm wetsuit recommended for sustained diving in water <18°C.")
                sciRow(title: "Apple Watch Ultra", body: "Apple Watch Ultra is EN13319 compliant — rated to 100 m / 10 atm. With the Oceanic+ app it functions as a dive computer, recording depth profiles, water temp, and dive time to HealthKit.")
            }
            Divider()
            Text("⚠️ Never dive beyond your certification level. Always dive with a buddy and within NDL limits. This data is for reference only — consult a certified dive master for safety guidance.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.blue.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.blue)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "water.waves")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Diving Data").font(.title3.bold())
            Text("Underwater depth and water temperature require Apple Watch Ultra with watchOS 9+ (iOS 16+). Use the Workout app's Open Water Swim or Freediving mode, or the Oceanic+ app for dive-computer functionality.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard #available(iOS 16.0, *) else { return }

        let depthType = HKQuantityType(.underwaterDepth)
        let tempType = HKQuantityType(.waterTemperature)
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [depthType, tempType])) != nil else { return }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let metres = HKUnit.meter()
        let celsius = HKUnit.degreeCelsius()

        async let depthRaw: [HKQuantitySample] = withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: depthType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        async let tempRaw: [HKQuantitySample] = withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: tempType,
                predicate: HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        let (depthSamples, tempSamples) = await (depthRaw, tempRaw)
        guard !depthSamples.isEmpty else { return }

        // Group depth samples into dives by 15-min gap
        var sessGroups: [[HKQuantitySample]] = []
        var curr: [HKQuantitySample] = []
        var lastT = depthSamples[0].startDate
        for s in depthSamples {
            if s.startDate.timeIntervalSince(lastT) > 900 { sessGroups.append(curr); curr = [] }
            curr.append(s)
            lastT = s.endDate
        }
        if !curr.isEmpty { sessGroups.append(curr) }

        dives = sessGroups.compactMap { group -> DiveSession? in
            guard !group.isEmpty else { return nil }
            let depths = group.map { $0.quantity.doubleValue(for: metres) }
            let maxD = depths.max() ?? 0
            guard maxD > 0.5 else { return nil }
            let avgD = depths.reduce(0,+) / Double(depths.count)
            let dur = group.last!.endDate.timeIntervalSince(group.first!.startDate) / 60

            // Find matching water temp
            let diveStart = group.first!.startDate
            let diveEnd = group.last!.endDate
            let matchTemp = tempSamples.filter { $0.startDate >= diveStart && $0.endDate <= diveEnd }
            let tempC: Double? = matchTemp.isEmpty ? nil : matchTemp.map { $0.quantity.doubleValue(for: celsius) }.reduce(0,+) / Double(matchTemp.count)

            return DiveSession(id: UUID(), date: diveStart,
                               maxDepthM: maxD, avgDepthM: avgD,
                               waterTempC: tempC, durationMins: dur)
        }.sorted { $0.date > $1.date }

        guard !dives.isEmpty else { return }

        totalDives = dives.count
        maxDepth = dives.map(\.maxDepthM).max() ?? 0
        avgMaxDepth = dives.map(\.maxDepthM).reduce(0,+) / Double(dives.count)
        deepestCategory = DepthCategory(metres: maxDepth)
        let temps = dives.compactMap(\.waterTempC)
        avgTemp = temps.isEmpty ? 0 : temps.reduce(0,+) / Double(temps.count)
    }
}

#Preview { NavigationStack { DivingAnalyticsView() } }
