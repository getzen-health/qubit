import SwiftUI
import Charts

// MARK: - Models

private enum WeekType: String, CaseIterable {
    case recovery = "Recovery"
    case easy     = "Easy"
    case base     = "Base"
    case build    = "Build"
    case peak     = "Peak"

    var color: Color {
        switch self {
        case .recovery: return .red
        case .easy:     return .orange
        case .base:     return .blue
        case .build:    return .green
        case .peak:     return .purple
        }
    }

    var emoji: String {
        switch self {
        case .recovery: return "🛌"
        case .easy:     return "🚶"
        case .base:     return "🏃"
        case .build:    return "⚡"
        case .peak:     return "🔥"
        }
    }

    var tagline: String {
        switch self {
        case .recovery: return "Your body is signaling it needs recovery. Prioritize sleep and gentle movement."
        case .easy:     return "Slightly below baseline — keep intensity low and let your body bounce back."
        case .base:     return "HRV is stable. A solid week for building aerobic base and consistency."
        case .build:    return "HRV is elevated — your body is responding well. Good time for harder sessions."
        case .peak:     return "HRV is significantly above baseline. Leverage this window for peak-effort training."
        }
    }
}

private enum SessionType: String {
    case rest     = "Rest"
    case easy     = "Easy"
    case moderate = "Moderate"
    case hard     = "Hard"
    case long     = "Long"
    case active   = "Active Recovery"

    var color: Color {
        switch self {
        case .rest:     return Color.white.opacity(0.12)
        case .easy:     return .blue
        case .active:   return .teal
        case .moderate: return .green
        case .long:     return .indigo
        case .hard:     return .orange
        }
    }

    var icon: String {
        switch self {
        case .rest:     return "moon.zzz.fill"
        case .easy:     return "figure.walk"
        case .active:   return "figure.yoga"
        case .moderate: return "figure.run"
        case .long:     return "map.fill"
        case .hard:     return "bolt.fill"
        }
    }
}

private struct DayPlan: Identifiable {
    let id = UUID()
    let weekday: String
    let date: Date
    let session: SessionType
    let suggestion: String
    let zoneHint: String
    let durationHint: String
    let isToday: Bool
}

private struct HRVPoint: Identifiable {
    let id = UUID()
    let date: Date
    let hrv: Double
    let label: String
}

// MARK: - TrainingAdvisorView

struct TrainingAdvisorView: View {
    @State private var weekType: WeekType?
    @State private var plan: [DayPlan] = []
    @State private var hrvPoints: [HRVPoint] = []
    @State private var baseline28: Double = 0
    @State private var currentHRVAvg: Double = 0
    @State private var currentSleepAvg: Double = 0
    @State private var hrvDevPct: Double = 0
    @State private var isLoading = true

    private var selectedDay: DayPlan? { plan.first { $0.isToday } }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                } else if weekType == nil {
                    emptyState
                } else if let wt = weekType {
                    weekTypeBanner(wt)
                    statsRow
                    if hrvPoints.count >= 5 { hrvTrendChart }
                    weekPlanGrid
                    todayHighlight
                    educationCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Training Advisor")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Week Type Banner

    private func weekTypeBanner(_ wt: WeekType) -> some View {
        VStack(spacing: 10) {
            HStack(spacing: 12) {
                Text(wt.emoji)
                    .font(.system(size: 40))
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(wt.rawValue) Week")
                        .font(.title2.bold())
                        .foregroundStyle(wt.color)
                    Text("Recommended for the next 7 days")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            Text(wt.tagline)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(wt.color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 10) {
            statCell(
                label: "7-Day HRV",
                value: currentHRVAvg > 0 ? "\(Int(currentHRVAvg)) ms" : "—",
                sub: devLabel,
                color: devColor
            )
            statCell(
                label: "28-Day Baseline",
                value: baseline28 > 0 ? "\(Int(baseline28)) ms" : "—",
                sub: "HRV avg",
                color: .secondary
            )
            statCell(
                label: "Avg Sleep",
                value: currentSleepAvg > 0 ? fmtH(currentSleepAvg) : "—",
                sub: "last 7 nights",
                color: currentSleepAvg > 0 && currentSleepAvg < 6.5 ? .orange : .secondary
            )
        }
    }

    private var devLabel: String {
        guard currentHRVAvg > 0 && baseline28 > 0 else { return "—" }
        let pct = hrvDevPct
        let sign = pct >= 0 ? "+" : ""
        return "\(sign)\(Int(pct))% vs baseline"
    }

    private var devColor: Color {
        if hrvDevPct > 5 { return .green }
        if hrvDevPct < -5 { return .red }
        return .secondary
    }

    private func statCell(label: String, value: String, sub: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(.primary)
            Text(label)
                .font(.caption2.bold())
                .foregroundStyle(.secondary)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - HRV Trend Chart

    private var hrvTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("HRV — Last 14 Days")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                if baseline28 > 0 {
                    RuleMark(y: .value("Baseline", baseline28))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5]))
                        .foregroundStyle(Color.secondary.opacity(0.5))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("baseline")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                }
                ForEach(hrvPoints) { p in
                    LineMark(
                        x: .value("Date", p.date),
                        y: .value("HRV", p.hrv)
                    )
                    .foregroundStyle(Color.indigo)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", p.date),
                        y: .value("HRV", p.hrv)
                    )
                    .foregroundStyle(p.hrv >= baseline28 ? Color.green : Color.red)
                    .symbolSize(20)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { val in
                    if let d = val.as(Date.self) {
                        AxisValueLabel {
                            Text(d, format: .dateTime.month(.abbreviated).day())
                                .font(.caption2)
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    if let v = val.as(Double.self) {
                        AxisValueLabel { Text("\(Int(v))") }
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    Circle().fill(Color.green).frame(width: 8, height: 8)
                    Text("Above baseline").font(.caption2).foregroundStyle(.secondary)
                }
                HStack(spacing: 4) {
                    Circle().fill(Color.red).frame(width: 8, height: 8)
                    Text("Below baseline").font(.caption2).foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 4)
        }
    }

    // MARK: - Week Plan Grid

    private var weekPlanGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your Week")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 8) {
                ForEach(plan) { day in
                    dayRow(day)
                }
            }
        }
    }

    private func dayRow(_ day: DayPlan) -> some View {
        HStack(spacing: 12) {
            VStack(spacing: 2) {
                Text(day.weekday.prefix(3))
                    .font(.caption2.bold())
                    .foregroundStyle(.secondary)
                Text(day.date, format: .dateTime.day())
                    .font(.subheadline.bold())
                    .foregroundStyle(day.isToday ? day.session.color : .primary)
            }
            .frame(width: 36)

            HStack(spacing: 8) {
                Image(systemName: day.session.icon)
                    .foregroundStyle(day.session.color)
                    .frame(width: 20)

                VStack(alignment: .leading, spacing: 2) {
                    Text(day.session.rawValue)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(day.session.color)
                    Text(day.suggestion)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(day.durationHint)
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                    Text(day.zoneHint)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 12)
            .background(
                day.isToday
                    ? day.session.color.opacity(0.12)
                    : Color.premiumBackground
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                day.isToday ? RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(day.session.color.opacity(0.4), lineWidth: 1.5) : nil
            )
        }
    }

    // MARK: - Today Highlight

    private var todayHighlight: some View {
        Group {
            if let today = selectedDay {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Today's Focus", systemImage: "star.fill")
                        .font(.headline)
                        .foregroundStyle(.yellow)

                    Text(today.suggestion)
                        .font(.body)
                    Text("Zone: \(today.zoneHint) · \(today.durationHint)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding()
                .background(Color.yellow.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
        }
    }

    // MARK: - Education Card

    private var educationCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("How This Works")
                .font(.headline)
            VStack(alignment: .leading, spacing: 6) {
                educationRow("🫀", "HRV Baseline", "Your 28-day personal average is your baseline. Deviations show recovery status.")
                educationRow("📈", "Week Classification", "HRV >5% above baseline = Build/Peak. Near baseline = Base. Below = Easy/Recovery.")
                educationRow("😴", "Sleep Factor", "Poor sleep (< 6.5h average) shifts recommendations toward recovery regardless of HRV.")
                educationRow("⚡", "Zone 2 Foundation", "Easy sessions are in Zone 2 (50–65% max HR) — the cornerstone of aerobic fitness.")
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func educationRow(_ emoji: String, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(emoji).font(.body)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not enough data")
                .font(.title3.bold())
            Text("Need at least 7 days of HRV data to generate training recommendations.")
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

        guard let rows = try? await SupabaseService.shared.fetchAllDailySummaries(days: 35) else { return }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"

        let sorted = rows.sorted { $0.date < $1.date }
        let withHRV = sorted.filter { ($0.avg_hrv ?? 0) > 0 }

        guard withHRV.count >= 7 else { return }

        // 28-day HRV baseline (all available data up to 28 days ago excluding last 7)
        let cutoff = withHRV.count >= 14 ? withHRV.dropLast(7) : withHRV.dropLast(min(7, withHRV.count))
        let baselineVals = cutoff.compactMap { $0.avg_hrv }
        baseline28 = baselineVals.isEmpty ? 0 : baselineVals.reduce(0, +) / Double(baselineVals.count)

        // Last 7 days of HRV
        let last7HRV = withHRV.suffix(7).compactMap { $0.avg_hrv }
        currentHRVAvg = last7HRV.isEmpty ? 0 : last7HRV.reduce(0, +) / Double(last7HRV.count)

        // Last 7 days of sleep
        let last7Sleep = sorted.suffix(7).compactMap { $0.sleepHours }
        currentSleepAvg = last7Sleep.isEmpty ? 0 : last7Sleep.reduce(0, +) / Double(last7Sleep.count)

        // HRV deviation %
        hrvDevPct = baseline28 > 0 ? ((currentHRVAvg - baseline28) / baseline28) * 100 : 0

        // HRV trend points (last 14 days)
        let last14 = sorted.suffix(14).filter { ($0.avg_hrv ?? 0) > 0 }
        hrvPoints = last14.compactMap { row -> HRVPoint? in
            guard let hrv = row.avg_hrv, let date = df.date(from: row.date) else { return nil }
            return HRVPoint(date: date, hrv: hrv, label: row.date)
        }

        // Classify week type
        var wt: WeekType
        if currentSleepAvg > 0 && currentSleepAvg < 6.5 {
            wt = hrvDevPct < -5 ? .recovery : .easy
        } else if hrvDevPct > 15 {
            wt = .peak
        } else if hrvDevPct > 5 {
            wt = .build
        } else if hrvDevPct > -5 {
            wt = .base
        } else if hrvDevPct > -15 {
            wt = .easy
        } else {
            wt = .recovery
        }
        weekType = wt

        // Build 7-day plan starting from Monday of current week
        plan = buildPlan(for: wt)
    }

    private func buildPlan(for wt: WeekType) -> [DayPlan] {
        let cal = Calendar.current
        let today = Date()
        // Find the Monday of the current week
        var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: today)
        comps.weekday = 2 // Monday
        let monday = cal.date(from: comps) ?? today

        let schedule: [(SessionType, String, String, String)] = {
            switch wt {
            case .recovery:
                return [
                    (.easy,   "Easy 20 min walk or gentle yoga", "Zone 1 (50–60% HRmax)", "15–20 min"),
                    (.rest,   "Full rest day — prioritize sleep", "—", "0 min"),
                    (.active, "Light stretching or 15 min walk", "Zone 1", "15 min"),
                    (.rest,   "Full rest day", "—", "0 min"),
                    (.easy,   "Easy effort jog or walk", "Zone 1–2 (50–65%)", "20–25 min"),
                    (.active, "Gentle long walk or mobility work", "Zone 1", "30 min"),
                    (.rest,   "Rest day — recharge for next week", "—", "0 min"),
                ]
            case .easy:
                return [
                    (.easy,   "Easy 30 min run or brisk walk", "Zone 2 (60–65%)", "25–30 min"),
                    (.rest,   "Rest day", "—", "0 min"),
                    (.easy,   "Easy 30 min aerobic session", "Zone 2", "30 min"),
                    (.easy,   "Light 20 min run + drills", "Zone 1–2", "20 min"),
                    (.rest,   "Rest day", "—", "0 min"),
                    (.long,   "Easy long run or hike", "Zone 2 (60–65%)", "45–60 min"),
                    (.rest,   "Rest and recovery", "—", "0 min"),
                ]
            case .base:
                return [
                    (.easy,   "Easy 30 min run", "Zone 2 (60–65%)", "30 min"),
                    (.moderate,"Aerobic threshold 4×8 min @ Zone 3", "Zone 3 (70–80%)", "35–40 min"),
                    (.rest,   "Rest day", "—", "0 min"),
                    (.moderate,"Tempo intervals or steady 40 min", "Zone 3–4", "35–45 min"),
                    (.easy,   "Easy flush run", "Zone 2", "30 min"),
                    (.long,   "Long easy run or cycle", "Zone 2", "60–80 min"),
                    (.rest,   "Rest and recover", "—", "0 min"),
                ]
            case .build:
                return [
                    (.moderate,"Aerobic 40 min with strides", "Zone 2–3", "40 min"),
                    (.hard,   "Interval session: 6×3 min @ Zone 4–5", "Zone 4–5 (80–90%)", "45–50 min"),
                    (.rest,   "Rest day", "—", "0 min"),
                    (.moderate,"Threshold run 30 min @ Zone 3–4", "Zone 3–4 (70–85%)", "40 min"),
                    (.hard,   "Hill repeats or short intervals", "Zone 4–5", "40 min"),
                    (.long,   "Long aerobic run — push the distance", "Zone 2", "75–90 min"),
                    (.rest,   "Rest — good job this week!", "—", "0 min"),
                ]
            case .peak:
                return [
                    (.easy,   "Short easy run — fresh legs", "Zone 2", "25 min"),
                    (.hard,   "Race-pace session 8×90 sec @ Zone 5", "Zone 5 (>90%)", "40–45 min"),
                    (.rest,   "Full rest day", "—", "0 min"),
                    (.moderate,"Threshold 4 mile run @ comfortably hard", "Zone 3–4", "35 min"),
                    (.easy,   "Very easy shakeout", "Zone 1–2", "20 min"),
                    (.long,   "Longest run of cycle — push your limits", "Zone 2–3", "90–120 min"),
                    (.rest,   "Rest — outstanding week!", "—", "0 min"),
                ]
            }
        }()

        let weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        return zip(0..<7, schedule).map { (offset, entry) in
            let date = cal.date(byAdding: .day, value: offset, to: monday) ?? monday
            let (session, suggestion, zone, duration) = entry
            return DayPlan(
                weekday: weekdays[offset],
                date: date,
                session: session,
                suggestion: suggestion,
                zoneHint: zone,
                durationHint: duration,
                isToday: cal.isDateInToday(date)
            )
        }
    }

    // MARK: - Helpers

    private func fmtH(_ h: Double) -> String {
        let hrs = Int(h)
        let min = Int((h - Double(hrs)) * 60)
        return min > 0 ? "\(hrs)h \(min)m" : "\(hrs)h"
    }
}

#Preview {
    NavigationStack {
        TrainingAdvisorView()
    }
}
