import SwiftUI
import Charts

// MARK: - Models

private struct CardioSnapshot {
    // HRV
    let hrv7Day: Double?         // ms, last 7-day average
    let hrv28Day: Double?        // ms, 28-day baseline
    let hrvDevPct: Double?       // % deviation

    // Resting Heart Rate
    let rhr7Day: Double?         // bpm, last 7-day average
    let rhrTrend: Double?        // bpm/day (negative = improving)

    // VO2 Max
    let vo2Max: Double?          // ml/kg/min, latest
    let vo2MaxTrend: Double?     // change over 90 days

    // HR Recovery (from first available recent recovery data)
    let hrr1: Double?            // bpm, recent average HRR1

    // Trend chart (last 14 days HRV)
    let hrv14Days: [(date: Date, hrv: Double)]
}

private struct CardioComponent: Identifiable {
    let id = UUID()
    let name: String
    let value: String
    let detail: String
    let status: Status
    let icon: String

    enum Status {
        case excellent, good, fair, poor, unknown
        var color: Color {
            switch self {
            case .excellent: return .green
            case .good:      return .blue
            case .fair:      return .orange
            case .poor:      return .red
            case .unknown:   return .secondary
            }
        }
        var label: String {
            switch self {
            case .excellent: return "Excellent"
            case .good:      return "Good"
            case .fair:      return "Fair"
            case .poor:      return "Poor"
            case .unknown:   return "No data"
            }
        }
    }
}

// MARK: - CardioHealthSummaryView

struct CardioHealthSummaryView: View {
    @State private var snapshot: CardioSnapshot?
    @State private var isLoading = true

    private var components: [CardioComponent] {
        guard let s = snapshot else { return [] }
        var result: [CardioComponent] = []

        // HRV component
        if let hrv = s.hrv7Day {
            let dev = s.hrvDevPct ?? 0
            let status: CardioComponent.Status = dev > 10 ? .excellent : dev > 0 ? .good : dev > -10 ? .fair : .poor
            let devStr = String(format: "%+.0f%%", dev)
            result.append(CardioComponent(
                name: "HRV",
                value: "\(Int(hrv)) ms",
                detail: "\(devStr) vs 28-day baseline",
                status: status,
                icon: "waveform.path.ecg"
            ))
        } else {
            result.append(CardioComponent(name: "HRV", value: "—", detail: "No recent data", status: .unknown, icon: "waveform.path.ecg"))
        }

        // RHR component
        if let rhr = s.rhr7Day {
            let status: CardioComponent.Status = rhr < 50 ? .excellent : rhr < 60 ? .good : rhr < 70 ? .fair : .poor
            let trend = s.rhrTrend.map { $0 < -0.1 ? "↓ improving" : $0 > 0.1 ? "↑ rising" : "→ stable" } ?? "—"
            result.append(CardioComponent(
                name: "Resting HR",
                value: "\(Int(rhr)) bpm",
                detail: "\(trend) · \(classifyRHR(rhr))",
                status: status,
                icon: "heart.fill"
            ))
        } else {
            result.append(CardioComponent(name: "Resting HR", value: "—", detail: "No recent data", status: .unknown, icon: "heart.fill"))
        }

        // VO2 Max component
        if let vo2 = s.vo2Max {
            let status: CardioComponent.Status = vo2 >= 50 ? .excellent : vo2 >= 40 ? .good : vo2 >= 30 ? .fair : .poor
            let trendStr = s.vo2MaxTrend.map { $0 > 0.5 ? "↑ improving" : $0 < -0.5 ? "↓ declining" : "→ stable" } ?? ""
            result.append(CardioComponent(
                name: "VO₂ Max",
                value: String(format: "%.1f ml/kg/min", vo2),
                detail: "\(classifyVO2(vo2))\(trendStr.isEmpty ? "" : " · \(trendStr)")",
                status: status,
                icon: "lungs.fill"
            ))
        } else {
            result.append(CardioComponent(name: "VO₂ Max", value: "—", detail: "No recent data", status: .unknown, icon: "lungs.fill"))
        }

        // HR Recovery component
        if let hrr = s.hrr1 {
            let status: CardioComponent.Status = hrr >= 25 ? .excellent : hrr >= 18 ? .good : hrr >= 12 ? .fair : .poor
            let label = hrr >= 25 ? "Excellent" : hrr >= 18 ? "Good" : hrr >= 12 ? "Normal" : "Poor"
            result.append(CardioComponent(
                name: "HR Recovery",
                value: "\(Int(hrr)) bpm",
                detail: "\(label) · 1-min post-workout drop",
                status: status,
                icon: "arrow.down.heart.fill"
            ))
        } else {
            result.append(CardioComponent(name: "HR Recovery", value: "—", detail: "No workout data", status: .unknown, icon: "arrow.down.heart.fill"))
        }

        return result
    }

    private var overallStatus: CardioComponent.Status {
        let statuses = components.map { $0.status }.filter { $0 != .unknown }
        guard !statuses.isEmpty else { return .unknown }
        let score = statuses.reduce(0) { $0 + statusScore($1) }
        let avg = score / statuses.count
        if avg >= 3 { return .excellent }
        if avg >= 2 { return .good }
        if avg >= 1 { return .fair }
        return .poor
    }

    private func statusScore(_ s: CardioComponent.Status) -> Int {
        switch s {
        case .excellent: return 3
        case .good:      return 2
        case .fair:      return 1
        case .poor:      return 0
        case .unknown:   return 0
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                } else if snapshot == nil {
                    emptyState
                } else {
                    overallCard
                    componentList
                    if let s = snapshot, s.hrv14Days.count >= 5 { hrvMiniChart(s) }
                    navigationLinks
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cardio Health")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Overall Card

    private var overallCard: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "heart.text.square.fill")
                    .font(.title)
                    .foregroundStyle(overallStatus.color)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Cardio Health")
                        .font(.headline)
                    Text(overallStatus.label)
                        .font(.subheadline)
                        .foregroundStyle(overallStatus.color)
                }
                Spacer()
                // Status ring
                ZStack {
                    Circle().stroke(Color(.systemGray5), lineWidth: 6)
                    let score = Double(statusScore(overallStatus)) / 3.0
                    Circle()
                        .trim(from: 0, to: score)
                        .stroke(overallStatus.color, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                .frame(width: 44, height: 44)
            }
            Text(overallStatusTagline)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(overallStatus.color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var overallStatusTagline: String {
        switch overallStatus {
        case .excellent: return "All cardio metrics are in great shape. Keep up the excellent work!"
        case .good:      return "Your cardio health looks solid with room for improvement in a few areas."
        case .fair:      return "Some cardio metrics need attention. Consider adjusting training and recovery."
        case .poor:      return "Multiple cardio markers are below optimal. Prioritize rest and recovery."
        case .unknown:   return "Sync your health data to see your cardio health overview."
        }
    }

    // MARK: - Component List

    private var componentList: some View {
        VStack(spacing: 1) {
            ForEach(components) { comp in
                HStack(spacing: 14) {
                    Image(systemName: comp.icon)
                        .foregroundStyle(comp.status.color)
                        .frame(width: 28)
                        .font(.body)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(comp.name)
                            .font(.subheadline.weight(.medium))
                        Text(comp.detail)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(comp.value)
                            .font(.subheadline.bold().monospacedDigit())
                        Text(comp.status.label)
                            .font(.caption2)
                            .foregroundStyle(comp.status.color)
                    }
                }
                .padding(.vertical, 10)
                .padding(.horizontal, 14)
                .background(Color(.systemBackground))
                if comp.id != components.last?.id { Divider().padding(.leading, 56) }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - HRV Mini Chart

    private func hrvMiniChart(_ s: CardioSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("HRV — Last 14 Days")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                if let baseline = s.hrv28Day {
                    RuleMark(y: .value("Baseline", baseline))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5]))
                        .foregroundStyle(Color.secondary.opacity(0.5))
                }
                ForEach(s.hrv14Days, id: \.date) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("HRV", point.hrv)
                    )
                    .foregroundStyle(Color.indigo)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", point.date),
                        y: .value("HRV", point.hrv)
                    )
                    .foregroundStyle(point.hrv >= (s.hrv28Day ?? 0) ? Color.green : Color.red)
                    .symbolSize(18)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { val in
                    if let d = val.as(Date.self) {
                        AxisValueLabel { Text(d, format: .dateTime.month(.abbreviated).day()).font(.caption2) }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    if let v = val.as(Double.self) { AxisValueLabel { Text("\(Int(v))") } }
                }
            }
            .frame(height: 140)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Deep Dive Links

    private var navigationLinks: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Deep Dives")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 8) {
                deepDiveRow(
                    icon: "waveform.path.ecg", color: .indigo,
                    title: "HRV Analysis", subtitle: "Trends, calendar, and recovery heatmap",
                    destination: AnyView(HRVDetailView())
                )
                deepDiveRow(
                    icon: "heart.fill", color: .red,
                    title: "Resting HR Trends", subtitle: "6-month RHR trend and fitness classification",
                    destination: AnyView(RHRTrendView())
                )
                deepDiveRow(
                    icon: "lungs.fill", color: .teal,
                    title: "VO₂ Max History", subtitle: "Cardiorespiratory fitness trend",
                    destination: AnyView(VO2MaxView())
                )
                deepDiveRow(
                    icon: "arrow.down.heart.fill", color: .orange,
                    title: "HR Recovery", subtitle: "Post-workout parasympathetic reactivation",
                    destination: AnyView(HeartRateRecoveryView())
                )
            }
        }
    }

    private func deepDiveRow(icon: String, color: Color, title: String, subtitle: String, destination: AnyView) -> some View {
        NavigationLink(destination: destination) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                    .frame(width: 32, height: 32)
                    .background(color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 12)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Understanding Cardio Health")
                .font(.headline)
            VStack(alignment: .leading, spacing: 6) {
                infoRow("💗", "HRV", "Heart Rate Variability reflects your autonomic nervous system. Higher = better recovery and resilience.")
                infoRow("❤️", "Resting HR", "Lower resting HR generally indicates stronger cardiovascular fitness. Athletes often have RHR < 50.")
                infoRow("🫁", "VO₂ Max", "Maximal oxygen uptake — the gold standard for aerobic fitness. Higher = better endurance capacity.")
                infoRow("📉", "HR Recovery", "How fast your HR drops 1 minute after exercise. Faster = stronger parasympathetic nervous system.")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func infoRow(_ emoji: String, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(emoji)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption.bold())
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.text.square")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No cardio data yet")
                .font(.title3.bold())
            Text("Sync your health data from your Apple Watch to see your cardio health overview.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let rows = try? await SupabaseService.shared.fetchAllDailySummaries(days: 90) else { return }
        let sorted = rows.sorted { $0.date < $1.date }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"

        let withHRV = sorted.filter { ($0.avg_hrv ?? 0) > 0 }
        let withRHR = sorted.filter { _ in false }
        _ = withRHR // suppress warning

        // HRV: last 7 days vs 28-day baseline
        let hrv7Vals  = withHRV.suffix(7).compactMap { $0.avg_hrv }
        let hrv28Vals = withHRV.dropLast(min(7, withHRV.count)).compactMap { $0.avg_hrv }

        let hrv7  = hrv7Vals.isEmpty  ? nil : hrv7Vals.reduce(0, +)  / Double(hrv7Vals.count)
        let hrv28 = hrv28Vals.isEmpty ? nil : hrv28Vals.reduce(0, +) / Double(hrv28Vals.count)
        let hrvDev: Double? = (hrv7 != nil && hrv28 != nil && hrv28! > 0)
            ? ((hrv7! - hrv28!) / hrv28!) * 100 : nil

        // HRV 14-day chart
        let hrv14 = withHRV.suffix(14).compactMap { row -> (date: Date, hrv: Double)? in
            guard let hrv = row.avg_hrv, let d = df.date(from: row.date) else { return nil }
            return (date: d, hrv: hrv)
        }

        // Steps as proxy for activity — no dedicated RHR in DailySummaryRow
        // For RHR trend we'd need a separate query; use recovery_score trend instead
        // VO2 Max: from health_records via a separate fetch is ideal; skip for now unless available in summaries
        // Approximate VO2 Max from recovery_score (0-100 → 30-60 ml/kg/min scale, rough)
        let recoveryScores = sorted.compactMap { $0.recovery_score }
        let latestRecovery = recoveryScores.last.map { Double($0) }
        _ = latestRecovery.map { 30.0 + ($0 / 100.0) * 30.0 }  // rough proxy; not yet wired to snapshot

        // HRR: not in daily_summaries; mark as unavailable
        let snapshot = CardioSnapshot(
            hrv7Day: hrv7,
            hrv28Day: hrv28,
            hrvDevPct: hrvDev,
            rhr7Day: nil,    // needs separate health_records fetch
            rhrTrend: nil,
            vo2Max: nil,     // needs health_records fetch
            vo2MaxTrend: nil,
            hrr1: nil,       // needs workout HR data
            hrv14Days: hrv14
        )

        // Try fetching VO2 Max and RHR from health_records separately
        if let (vo2, rhr, hrr) = await fetchAdditionalMetrics() {
            self.snapshot = CardioSnapshot(
                hrv7Day: hrv7,
                hrv28Day: hrv28,
                hrvDevPct: hrvDev,
                rhr7Day: rhr?.avg,
                rhrTrend: rhr?.slope,
                vo2Max: vo2?.latest,
                vo2MaxTrend: vo2?.change,
                hrr1: hrr,
                hrv14Days: hrv14
            )
        } else {
            self.snapshot = snapshot
        }
    }

    private struct VO2Metrics { let latest: Double; let change: Double }
    private struct RHRMetrics  { let avg: Double;   let slope: Double }

    private func fetchAdditionalMetrics() async -> (VO2Metrics?, RHRMetrics?, Double?)? {
        guard let client = SupabaseService.shared.currentSession != nil ? SupabaseService.shared : nil else { return nil }
        _ = client
        // Additional queries would go here; for now return nil so fallback data is used
        return nil
    }

    // MARK: - Classification Helpers

    private func classifyRHR(_ rhr: Double) -> String {
        if rhr < 50 { return "Athlete" }
        if rhr < 60 { return "Excellent" }
        if rhr < 70 { return "Good" }
        if rhr < 80 { return "Average" }
        return "High"
    }

    private func classifyVO2(_ vo2: Double) -> String {
        if vo2 >= 55 { return "Superior" }
        if vo2 >= 45 { return "Excellent" }
        if vo2 >= 38 { return "Good" }
        if vo2 >= 30 { return "Fair" }
        return "Poor"
    }
}

#Preview {
    NavigationStack { CardioHealthSummaryView() }
}
