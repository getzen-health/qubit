import SwiftUI
import Charts
import HealthKit

// MARK: - HearingHealthView

/// Tracks environmental and headphone audio exposure over the last 30 days.
/// Loud noise is a leading cause of preventable hearing loss — WHO recommends keeping
/// average exposure below 70 dB(A) over 24 hours, and avoiding >85 dB(A) sustained.
struct HearingHealthView: View {
    @State private var envDays: [AudioDay] = []
    @State private var headphoneDays: [AudioDay] = []
    @State private var loudEvents: [LoudEvent] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    private var envChartDomain: ClosedRange<Double> {
        let lo = envDays.map(\.avgDb).min().map { max(40.0, $0 - 5) } ?? 40.0
        let hi = envDays.map(\.avgDb).max().map { max(100.0, $0 + 5) } ?? 100.0
        return lo...hi
    }
    private var headphoneChartDomain: ClosedRange<Double> {
        let lo = headphoneDays.map(\.avgDb).min().map { max(40.0, $0 - 5) } ?? 40.0
        let hi = headphoneDays.map(\.avgDb).max().map { max(100.0, $0 + 5) } ?? 100.0
        return lo...hi
    }
    private let loudThreshold: Double = 80 // dB — warn above this
    private let dangerThreshold: Double = 90 // dB — WHO 8-hour danger zone

    struct AudioDay: Identifiable {
        let id = UUID()
        let date: Date
        let avgDb: Double
        let peakDb: Double
    }

    struct LoudEvent: Identifiable {
        let id = UUID()
        let date: Date
        let db: Double
        let type: EventType

        enum EventType { case environment, headphone }
    }

    private var latestEnv: AudioDay? { envDays.last }
    private var latestHeadphone: AudioDay? { headphoneDays.last }

    private var sevenDayAvgEnv: Double? {
        let recent = envDays.suffix(7)
        guard !recent.isEmpty else { return nil }
        return recent.map(\.avgDb).reduce(0, +) / Double(recent.count)
    }

    private var loudEventCount: Int { loudEvents.count }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if envDays.isEmpty && headphoneDays.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    if !envDays.isEmpty { envChart }
                    if !headphoneDays.isEmpty { headphoneCard }
                    if !loudEvents.isEmpty { loudEventsCard }
                    infoCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Hearing Health")
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                NavigationLink(destination: HearingPatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let avgDb = sevenDayAvgEnv ?? latestEnv?.avgDb ?? 0
        let zone = AudioZone.from(db: avgDb)

        return VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Avg Environment")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.0f", avgDb))
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                        Text("dB")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 8)
                    }
                    Text(zone.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(zone.color)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 12) {
                    // Noise level meter
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Exposure level")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        NoiseGauge(db: avgDb)
                            .frame(width: 120, height: 12)
                    }
                    if loudEventCount > 0 {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("\(loudEventCount)")
                                .font(.title3.bold())
                                .foregroundStyle(.orange)
                            Text("loud events (30d)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            HStack(spacing: 12) {
                if let env = latestEnv {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Today ambient")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text(String(format: "%.0f dB", env.avgDb))
                            .font(.subheadline.bold().monospacedDigit())
                    }
                }
                if let hp = latestHeadphone {
                    Divider().frame(height: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Headphone avg")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text(String(format: "%.0f dB", hp.avgDb))
                            .font(.subheadline.bold().monospacedDigit())
                            .foregroundStyle(hp.avgDb > loudThreshold ? .orange : .primary)
                    }
                }
                if let avg = sevenDayAvgEnv {
                    Divider().frame(height: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("7-day avg")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text(String(format: "%.0f dB", avg))
                            .font(.subheadline.bold().monospacedDigit())
                    }
                }
            }
            .padding(.top, 4)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Environment Chart

    private var envChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Environmental Noise — 30 Days")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                // Safe zone band (below 70 dB)
                RectangleMark(
                    yStart: .value("Min", 0),
                    yEnd: .value("Safe", 70)
                )
                .foregroundStyle(Color.green.opacity(0.05))

                // Warning zone (70-85 dB)
                RectangleMark(
                    yStart: .value("Safe", 70),
                    yEnd: .value("Loud", 85)
                )
                .foregroundStyle(Color.orange.opacity(0.05))

                RuleMark(y: .value("Recommended limit", 70))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                    .foregroundStyle(.green.opacity(0.6))
                    .annotation(position: .topLeading) {
                        Text("70 dB limit")
                            .font(.caption2)
                            .foregroundStyle(.green.opacity(0.8))
                    }

                ForEach(envDays) { day in
                    BarMark(
                        x: .value("Date", day.date, unit: .day),
                        y: .value("dB", day.avgDb)
                    )
                    .foregroundStyle(
                        day.avgDb >= dangerThreshold ? Color.red.opacity(0.8) :
                        day.avgDb >= loudThreshold ? Color.orange.opacity(0.7) :
                        Color.teal.opacity(0.7)
                    )
                    .cornerRadius(2)
                }
            }
            .chartYAxisLabel("dB(A)")
            .chartYScale(domain: envChartDomain)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    AxisGridLine()
                }
            }
            .frame(height: 180)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Headphone Card

    private var headphoneCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Headphone Audio")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Recommended", 75))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4]))
                    .foregroundStyle(.orange.opacity(0.6))
                    .annotation(position: .topLeading) {
                        Text("75 dB max")
                            .font(.caption2)
                            .foregroundStyle(.orange.opacity(0.8))
                    }

                ForEach(headphoneDays) { day in
                    LineMark(
                        x: .value("Date", day.date),
                        y: .value("dB", day.avgDb)
                    )
                    .foregroundStyle(.purple)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", day.date),
                        y: .value("dB", day.avgDb)
                    )
                    .foregroundStyle(day.avgDb > 75 ? .orange : .purple)
                    .symbolSize(25)
                }
            }
            .chartYAxisLabel("dB(A)")
            .chartYScale(domain: headphoneChartDomain)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Loud Events Card

    private var loudEventsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "ear.trianglebadge.exclamationmark")
                    .foregroundStyle(.orange)
                Text("Loud Exposure Events")
                    .font(.headline)
            }
            .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(loudEvents.sorted { $0.db > $1.db }.prefix(5)) { event in
                    HStack {
                        Image(systemName: event.type == .headphone ? "headphones" : "ear")
                            .foregroundStyle(event.db >= dangerThreshold ? .red : .orange)
                            .frame(width: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(event.type == .headphone ? "Headphone" : "Environment")
                                .font(.subheadline)
                            Text(event.date.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(String(format: "%.0f dB", event.db))
                            .font(.subheadline.bold().monospacedDigit())
                            .foregroundStyle(event.db >= dangerThreshold ? .red : .orange)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if event.id != loudEvents.sorted(by: { $0.db > $1.db }).prefix(5).last?.id {
                        Divider().padding(.leading, 52)
                    }
                }
            }
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.teal)
                Text("Hearing Health Guidelines")
                    .font(.subheadline.weight(.semibold))
            }
            Text("Prolonged exposure to sounds above 85 dB can permanently damage hearing. The WHO recommends keeping average daily exposure below 70 dB. Apple Watch notifies you when headphone volume is too loud.")
                .font(.caption)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 6) {
                Label("Below 70 dB — Safe for extended exposure", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                Label("70–85 dB — Use caution; limit duration", systemImage: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                Label("Above 85 dB — Hearing risk; reduce immediately", systemImage: "xmark.circle.fill")
                    .foregroundStyle(.red)
            }
            .font(.caption)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "ear")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Audio Data")
                .font(.title3.bold())
            Text("Hearing health data is recorded by your iPhone and Apple Watch. Ensure Noise notifications are enabled in Settings → Health → Headphone Notifications.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let start = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let unit = HKUnit.decibelAWeightedSoundPressureLevel()
        let cal = Calendar.current

        async let envRaw = (try? await healthKit.fetchSamples(for: .environmentalAudioExposure, from: start, to: Date())) ?? []
        async let hpRaw = (try? await healthKit.fetchSamples(for: .headphoneAudioExposure, from: start, to: Date())) ?? []

        let (envSamples, hpSamples) = await (envRaw, hpRaw)

        // Group env by day
        var envByDay: [DateComponents: [Double]] = [:]
        for s in envSamples {
            let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
            envByDay[key, default: []].append(s.quantity.doubleValue(for: unit))
        }
        envDays = envByDay.compactMap { comps, vals in
            cal.date(from: comps).map { AudioDay(date: $0, avgDb: vals.reduce(0,+)/Double(vals.count), peakDb: vals.max() ?? 0) }
        }.sorted { $0.date < $1.date }

        // Group headphone by day
        var hpByDay: [DateComponents: [Double]] = [:]
        for s in hpSamples {
            let key = cal.dateComponents([.year, .month, .day], from: s.startDate)
            hpByDay[key, default: []].append(s.quantity.doubleValue(for: unit))
        }
        headphoneDays = hpByDay.compactMap { comps, vals in
            cal.date(from: comps).map { AudioDay(date: $0, avgDb: vals.reduce(0,+)/Double(vals.count), peakDb: vals.max() ?? 0) }
        }.sorted { $0.date < $1.date }

        // Loud events: any daily peak > 80 dB
        var events: [LoudEvent] = []
        for day in envDays where day.peakDb >= loudThreshold {
            events.append(LoudEvent(date: day.date, db: day.peakDb, type: .environment))
        }
        for day in headphoneDays where day.peakDb >= loudThreshold {
            events.append(LoudEvent(date: day.date, db: day.peakDb, type: .headphone))
        }
        loudEvents = events.sorted { $0.date > $1.date }
    }
}

// MARK: - Noise Gauge

struct NoiseGauge: View {
    let db: Double

    private var fraction: CGFloat {
        CGFloat(max(0, min(1, (db - 40) / 60))) // 40–100 dB range
    }

    private var gaugeColor: Color {
        db >= 90 ? .red : db >= 70 ? .orange : .green
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(.systemFill))
                RoundedRectangle(cornerRadius: 4)
                    .fill(LinearGradient(
                        colors: [.green, .yellow, .orange, .red],
                        startPoint: .leading, endPoint: .trailing
                    ))
                    .frame(width: geo.size.width * fraction)
            }
        }
    }
}

// MARK: - Audio Zone

enum AudioZone {
    case safe, caution, loud, danger

    var label: String {
        switch self {
        case .safe: return NSLocalizedString("Safe Level", comment: "Hearing health level")
        case .caution: return NSLocalizedString("Caution", comment: "Hearing health level")
        case .loud: return NSLocalizedString("Loud", comment: "Hearing health level")
        case .danger: return NSLocalizedString("Dangerous", comment: "Hearing health level")
        }
    }

    var color: Color {
        switch self {
        case .safe: return .green
        case .caution: return .yellow
        case .loud: return .orange
        case .danger: return .red
        }
    }

    static func from(db: Double) -> AudioZone {
        if db >= 90 { return .danger }
        if db >= 80 { return .loud }
        if db >= 70 { return .caution }
        return .safe
    }
}

#Preview {
    NavigationStack {
        HearingHealthView()
    }
}
