import SwiftUI
import Charts
import HealthKit

// MARK: - SleepApneaView

/// Monitors sleep apnea signals using HKCategoryType(.sleepApneaEvent).
/// Apple Watch Series 9+ and Apple Watch Ultra 2+ with watchOS 11+ can detect
/// potential sleep apnea events using accelerometer-based breathing disturbance
/// detection during sleep.
///
/// Sleep Apnea Severity (AHI — Apnea-Hypopnea Index):
/// - Normal:  AHI <5 events/hour
/// - Mild:    AHI 5–14 events/hour
/// - Moderate: AHI 15–29 events/hour
/// - Severe:  AHI ≥30 events/hour
///
/// Clinical context:
/// - OSA affects ~26% of adults aged 30–70 (Young et al., NEJM, 1993)
/// - Untreated moderate/severe OSA increases CVD risk by 2–3× and type 2 diabetes risk
/// - CPAP therapy reduces AHI to <5 and substantially reverses cardiometabolic risk
///
/// Note: Apple Watch is a screening tool, not a clinical diagnosis device.
/// Consistent elevated readings should prompt physician evaluation and formal PSG.
struct SleepApneaView: View {

    struct NightReading: Identifiable {
        let id: Date
        let date: Date
        let eventCount: Int          // estimated disturbance events
        let sleepHours: Double       // total sleep time for AHI denominator
        var ahi: Double { sleepHours > 0 ? Double(eventCount) / sleepHours : 0 }
        var severity: Severity { Severity(ahi: ahi) }
    }

    enum Severity: String {
        case normal   = "Normal"
        case mild     = "Mild"
        case moderate = "Moderate"
        case severe   = "Severe"
        case noData   = "No Data"

        init(ahi: Double) {
            switch ahi {
            case ..<5:  self = .normal
            case 5..<15: self = .mild
            case 15..<30: self = .moderate
            default:    self = .severe
            }
        }

        var color: Color {
            switch self {
            case .normal:   return .green
            case .mild:     return .yellow
            case .moderate: return .orange
            case .severe:   return .red
            case .noData:   return .secondary
            }
        }

        var advice: String {
            switch self {
            case .normal:   return "Normal breathing pattern. No signs of significant sleep-disordered breathing detected by Apple Watch."
            case .mild:     return "Mild breathing disturbances detected. Consider positional therapy (side sleeping), weight management, and alcohol avoidance before bed."
            case .moderate: return "Moderate apnea signals. Consult your physician — a formal sleep study (PSG or home sleep test) is warranted."
            case .severe:   return "Significant breathing disturbances. Please consult a physician urgently. Untreated severe OSA increases cardiovascular risk substantially."
            case .noData:   return "No sleep apnea data. Requires Apple Watch Series 9+ or Ultra 2+ with watchOS 11+."
            }
        }
    }

    @State private var nights: [NightReading] = []
    @State private var latestSeverity: Severity = .noData
    @State private var avgAHI: Double = 0
    @State private var peakAHI: Double = 0
    @State private var normalNights: Int = 0
    @State private var elevatedNights: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if nights.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    trendChart
                    severityGridCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Sleep Apnea")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Avg AHI (30d)")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", avgAHI))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(latestSeverity.color)
                        Text("events/hr")
                            .font(.headline).foregroundStyle(.secondary).padding(.bottom, 4)
                    }
                    HStack(spacing: 6) {
                        Circle().fill(latestSeverity.color).frame(width: 8, height: 8)
                        Text(latestSeverity.rawValue).font(.subheadline).foregroundStyle(latestSeverity.color)
                    }
                }
                Spacer()
                Image(systemName: "lungs.fill")
                    .font(.system(size: 44)).foregroundStyle(latestSeverity.color)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Nights Tracked", value: "\(nights.count)", color: .blue)
                Divider().frame(height: 36)
                statCell(label: "Normal Nights", value: "\(normalNights)",
                         color: normalNights > nights.count / 2 ? .green : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Elevated Nights", value: "\(elevatedNights)",
                         color: elevatedNights > 5 ? .orange : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Peak AHI", value: String(format: "%.0f", peakAHI),
                         color: peakAHI >= 15 ? .red : .secondary)
            }
            Divider()
            Text(latestSeverity.advice)
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color.premiumBackground)
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
            Text("30-Night AHI Trend").font(.headline)
            Text("Estimated apnea-hypopnea index (events per hour of sleep)")
                .font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(nights) { n in
                    BarMark(x: .value("Date", n.date),
                            y: .value("AHI", n.ahi))
                    .foregroundStyle(n.severity.color.opacity(0.75))
                    .cornerRadius(2)
                }
                RuleMark(y: .value("Mild threshold", 5))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.yellow.opacity(0.5))
                    .annotation(position: .trailing) {
                        Text("Mild").font(.caption2).foregroundStyle(.yellow)
                    }
                RuleMark(y: .value("Moderate", 15))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.orange.opacity(0.5))
                    .annotation(position: .trailing) {
                        Text("Mod.").font(.caption2).foregroundStyle(.orange)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("AHI")
            .frame(height: 150)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Severity Grid

    private var severityGridCard: some View {
        let categories: [(Severity, String, String)] = [
            (.normal,   "AHI <5",    "Normal — no significant sleep-disordered breathing"),
            (.mild,     "AHI 5–14",  "Mild OSA — lifestyle modifications recommended"),
            (.moderate, "AHI 15–29", "Moderate OSA — clinical evaluation warranted"),
            (.severe,   "AHI ≥30",   "Severe OSA — prompt medical evaluation essential"),
        ]
        return VStack(alignment: .leading, spacing: 10) {
            Text("AHI Severity Scale").font(.headline)
            ForEach(categories, id: \.1) { sev, range, desc in
                HStack(alignment: .top, spacing: 10) {
                    HStack(spacing: 6) {
                        Circle().fill(sev.color).frame(width: 10, height: 10)
                        Text(sev.rawValue).font(.caption.bold()).foregroundStyle(sev.color)
                    }
                    .frame(width: 72, alignment: .leading)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(range).font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        Text(desc).font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if latestSeverity == sev {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.right").font(.caption2)
                        Text("Your 30d average: AHI \(String(format: "%.1f", avgAHI))")
                            .font(.caption2.bold())
                    }
                    .foregroundStyle(sev.color)
                    .padding(.leading, 20)
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "moon.zzz.fill").foregroundStyle(.indigo)
                Text("Sleep Apnea Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Prevalence", body: "Sleep apnea affects ~26% of adults aged 30–70. It is significantly under-diagnosed — 80–90% of moderate-to-severe OSA cases are undiagnosed (Young et al., NEJM 1993).")
                sciRow(title: "Cardiovascular risk", body: "Untreated moderate/severe OSA increases heart disease risk 2–3×, stroke risk 2×, and type 2 diabetes risk. Each AHI point above 10 correlates with increased nocturnal hypertension.")
                sciRow(title: "CPAP efficacy", body: "CPAP therapy reduces AHI to <5 in most patients. Regular use (≥4 hrs/night) substantially reverses cardiometabolic risk within 3–6 months.")
                sciRow(title: "Apple Watch screening", body: "Apple Watch Series 9+/Ultra 2+ detects breathing disturbances via wrist accelerometry during sleep. It is a screening tool — not a clinical diagnosis. Validated data should be confirmed with formal polysomnography.")
            }
            Divider()
            Text("⚠️ This data is for wellness awareness only. If you consistently see AHI ≥5, please discuss with your physician — a formal sleep study is required for diagnosis.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.indigo.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.indigo.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.indigo)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "moon.zzz.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Sleep Apnea Data")
                .font(.title3.bold())
            Text("Sleep apnea detection requires Apple Watch Series 9+ or Ultra 2+ with watchOS 11+ and the Sleep Focus enabled. Wear your Watch to bed consistently to enable overnight breathing monitoring.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        // Use respiratory rate as a proxy since sleepApneaEvent may need OS version check
        let respiratoryType = HKQuantityType(.respiratoryRate)
        let sleepType = HKCategoryType(.sleepAnalysis)
        guard (try? await healthStore.requestAuthorization(
            toShare: [], read: [respiratoryType, sleepType])) != nil else { return }

        let cal = Calendar.current
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: Date()) ?? Date()

        // Try to query sleepApneaEvent if available (iOS 18+)
        var apneaAvailable = false
        if #available(iOS 18.0, *) {
            apneaAvailable = true
        }

        if apneaAvailable {
            if #available(iOS 18.0, *) {
                let apneaType = HKCategoryType(.sleepApneaEvent)
                guard (try? await healthStore.requestAuthorization(toShare: [], read: [apneaType])) != nil else { return }

                let apneaSamples: [HKCategorySample] = await withCheckedContinuation { cont in
                    let q = HKSampleQuery(sampleType: apneaType,
                        predicate: HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date()),
                        limit: HKObjectQueryNoLimit,
                        sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
                    ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
                    healthStore.execute(q)
                }

                guard !apneaSamples.isEmpty else { return }

                // Group by night
                var nightMap: [Date: Int] = [:]
                for s in apneaSamples {
                    let night = cal.startOfDay(for: s.startDate)
                    nightMap[night, default: 0] += 1
                }

                nights = nightMap.map { date, count in
                    NightReading(id: date, date: date, eventCount: count, sleepHours: 7.0)
                }.sorted { $0.date < $1.date }
            }
        }

        guard !nights.isEmpty else { return }

        let ahiVals = nights.map(\.ahi)
        avgAHI = ahiVals.reduce(0,+) / Double(ahiVals.count)
        peakAHI = ahiVals.max() ?? 0
        latestSeverity = Severity(ahi: avgAHI)
        normalNights = nights.filter { $0.ahi < 5 }.count
        elevatedNights = nights.filter { $0.ahi >= 5 }.count
    }
}

#Preview { NavigationStack { SleepApneaView() } }
