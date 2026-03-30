import SwiftUI
import HealthKit

// MARK: - Models

enum TimelineEventKind {
    case workout, sleep, hrvHigh, hrvLow, stepPR, stepGoal, calorieHigh
}

private struct TimelineEvent: Identifiable {
    let id = UUID()
    let kind: TimelineEventKind
    let date: Date
    let title: String
    let subtitle: String
    let detail: String?
    let icon: String
    let color: Color
}

// MARK: - HealthTimelineView

struct HealthTimelineView: View {
    @State private var events: [TimelineEvent] = []
    @State private var isLoading = true
    @State private var filter: EventFilter = .all

    private let healthKit = HealthKitService.shared
    private let stepGoal  = 7500

    enum EventFilter: String, CaseIterable {
        case all       = "All"
        case workouts  = "Workouts"
        case sleep     = "Sleep"
        case metrics   = "Metrics"
    }

    private var filteredEvents: [TimelineEvent] {
        switch filter {
        case .all:      return events
        case .workouts: return events.filter { $0.kind == .workout }
        case .sleep:    return events.filter { $0.kind == .sleep }
        case .metrics:  return events.filter {
            [.hrvHigh, .hrvLow, .stepPR, .stepGoal, .calorieHigh].contains($0.kind)
        }
        }
    }

    private var groupedEvents: [(String, [TimelineEvent])] {
        let cal = Calendar.current
        var map: [String: [TimelineEvent]] = [:]
        var order: [String] = []
        for e in filteredEvents {
            let key: String
            if cal.isDateInToday(e.date)          { key = "Today" }
            else if cal.isDateInYesterday(e.date)  { key = "Yesterday" }
            else { key = e.date.formatted(.dateTime.weekday(.wide).month(.wide).day()) }
            if !order.contains(key) { order.append(key) }
            map[key, default: []].append(e)
        }
        return order.map { ($0, map[$0]!) }
    }

    var body: some View {
        Group {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filteredEvents.isEmpty {
                emptyState
            } else {
                scrollView
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Timeline")
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Menu {
                    ForEach(EventFilter.allCases, id: \.self) { f in
                        Button(f.rawValue) { filter = f }
                    }
                } label: {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Scroll Content

    private var scrollView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Picker("Filter", selection: $filter) {
                    ForEach(EventFilter.allCases, id: \.self) { f in
                        Text(f.rawValue).tag(f)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.vertical, 12)

                // Summary pills
                HStack(spacing: 10) {
                    summaryPill(count: events.filter { $0.kind == .workout }.count,
                                label: "Workouts", color: .orange)
                    summaryPill(count: events.filter { $0.kind == .sleep }.count,
                                label: "Nights", color: .indigo)
                    summaryPill(count: events.filter { $0.kind == .stepPR }.count,
                                label: "PRs", color: .yellow)
                }
                .padding(.horizontal)
                .padding(.bottom, 12)

                // Events grouped by date
                ForEach(groupedEvents, id: \.0) { (dateLabel, dayEvents) in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(dateLabel)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .padding(.horizontal)
                            .padding(.top, 8)

                        ForEach(dayEvents) { event in
                            EventRow(event: event)
                                .padding(.horizontal)
                        }
                    }
                }
                .padding(.bottom, 32)
            }
        }
    }

    private func summaryPill(count: Int, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text("\(count)")
                .font(.headline.bold())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Picker("Filter", selection: $filter) {
                ForEach(EventFilter.allCases, id: \.self) { f in
                    Text(f.rawValue).tag(f)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            Spacer()
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No events in the last 30 days")
                .font(.title3.bold())
            Text("Make sure HealthKit access is enabled to populate your health timeline.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let cal = Calendar.current
        let today = Date()
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: today) ?? Date()
        let twoYearsAgo   = cal.date(byAdding: .year, value: -2, to: today) ?? Date()

        async let wkts = try? healthKit.fetchWorkouts(from: thirtyDaysAgo, to: today)
        async let stepsCur = try? healthKit.fetchDailyStats(for: .stepCount,
                                from: thirtyDaysAgo, to: today, isDiscrete: false)
        async let calsData = try? healthKit.fetchDailyStats(for: .activeEnergyBurned,
                                from: thirtyDaysAgo, to: today, isDiscrete: false)
        async let hrvData  = try? healthKit.fetchDailyStats(for: .heartRateVariabilitySDNN,
                                from: thirtyDaysAgo, to: today, isDiscrete: true)
        async let sleepSamples = try? healthKit.fetchSleepAnalysis(from: thirtyDaysAgo, to: today)
        async let allSteps = try? healthKit.fetchDailyStats(for: .stepCount,
                                from: twoYearsAgo, to: today, isDiscrete: false)

        let workouts     = await wkts ?? []
        let stepsData    = await stepsCur ?? [:]
        let calData      = await calsData ?? [:]
        let hrv          = await hrvData ?? [:]
        let sleepRaw     = await sleepSamples ?? []
        let historicSteps = await allSteps ?? [:]

        let allTimePR = historicSteps.values.max() ?? 0

        // HRV baseline: all-but-last-7 days
        let hrvSorted = hrv.sorted { $0.key < $1.key }
        let baseSlice = hrvSorted.dropLast(7)
        let baseline  = baseSlice.isEmpty ? 0.0
            : baseSlice.reduce(0.0) { $0 + $1.value } / Double(baseSlice.count)

        var newEvents: [TimelineEvent] = []

        // ── Workouts ────────────────────────────────────────────────────
        for w in workouts {
            var parts: [String] = []
            let dur = Int(w.duration / 60)
            let h = dur / 60; let m = dur % 60
            parts.append(h > 0 ? "\(h)h \(m)m" : "\(m)m")
            if let dist = w.totalDistance?.doubleValue(for: .meter()), dist > 0 {
                parts.append(String(format: "%.2f km", dist / 1000))
            }
            if let cals = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()), cals > 0 {
                parts.append("\(Int(cals)) cal")
            }
            let wt = w.workoutActivityType
            newEvents.append(TimelineEvent(
                kind: .workout,
                date: w.startDate,
                title: wt.name,
                subtitle: parts.joined(separator: " · "),
                detail: nil,
                icon: wt.icon,
                color: wt.color
            ))
        }

        // ── Sleep ───────────────────────────────────────────────────────
        let sleepSessions = groupSleepSamples(sleepRaw)
        for session in sleepSessions {
            let h = session.totalMinutes / 60, m = session.totalMinutes % 60
            let durStr = h > 0 ? "\(h)h \(m)m" : "\(m)m"
            let score = computeSleepScore(session: session)
            let grade = score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 50 ? "Fair" : "Poor"
            var stageParts: [String] = []
            if session.deepMinutes > 0 { stageParts.append("\(session.deepMinutes)m deep") }
            if session.remMinutes  > 0 { stageParts.append("\(session.remMinutes)m REM") }
            newEvents.append(TimelineEvent(
                kind: .sleep,
                date: session.date,
                title: "\(durStr) Sleep",
                subtitle: "\(grade) · Score \(score)/100",
                detail: stageParts.isEmpty ? nil : stageParts.joined(separator: " · "),
                icon: "😴",
                color: .indigo
            ))
        }

        // ── Daily metric events ────────────────────────────────────────
        var seenDates = Set<String>()
        for (date, steps) in stepsData {
            let dayKey = cal.dateComponents([.year, .month, .day], from: date)
            let dayStr = "\(dayKey.year ?? 0)-\(dayKey.month ?? 0)-\(dayKey.day ?? 0)"
            if seenDates.contains(dayStr) { continue }
            seenDates.insert(dayStr)

            let s = Int(steps)

            // Step PR
            if s > 0 && Double(s) >= allTimePR * 0.99 && allTimePR > 0 {
                newEvents.append(TimelineEvent(
                    kind: .stepPR, date: date,
                    title: "Step Personal Record!",
                    subtitle: "\(fmt(s)) steps — all-time best",
                    detail: nil, icon: "🏆", color: .yellow
                ))
            } else if s >= stepGoal {
                newEvents.append(TimelineEvent(
                    kind: .stepGoal, date: date,
                    title: "Step Goal Hit",
                    subtitle: "\(fmt(s)) steps",
                    detail: nil, icon: "✅", color: .green
                ))
            }

            // High calorie day
            if let cals = closestValue(in: calData, to: date, cal: cal), cals >= 700 {
                newEvents.append(TimelineEvent(
                    kind: .calorieHigh, date: date,
                    title: "High Activity Day",
                    subtitle: "\(Int(cals)) active calories burned",
                    detail: nil, icon: "🔥", color: .orange
                ))
            }
        }

        // ── HRV notable days ────────────────────────────────────────────
        for (date, hrvVal) in hrv {
            guard baseline > 0 else { continue }
            let devPct = ((hrvVal - baseline) / baseline) * 100
            if devPct >= 20 {
                newEvents.append(TimelineEvent(
                    kind: .hrvHigh, date: date,
                    title: "HRV High Day",
                    subtitle: "\(Int(hrvVal)) ms · +\(Int(devPct))% above baseline",
                    detail: nil, icon: "💚", color: .green
                ))
            } else if devPct <= -20 {
                newEvents.append(TimelineEvent(
                    kind: .hrvLow, date: date,
                    title: "HRV Low Day",
                    subtitle: "\(Int(hrvVal)) ms · \(Int(devPct))% below baseline",
                    detail: nil, icon: "⚠️", color: .red
                ))
            }
        }

        events = newEvents.sorted { $0.date > $1.date }
    }

    // MARK: - Sleep Grouping (mirrors SleepView logic)

    private func groupSleepSamples(_ samples: [HKCategorySample]) -> [SleepSession] {
        guard !samples.isEmpty else { return [] }
        let cal = Calendar.current
        var byDay: [DateComponents: [HKCategorySample]] = [:]
        for s in samples {
            let wakeDay = cal.dateComponents([.year, .month, .day], from: s.endDate)
            byDay[wakeDay, default: []].append(s)
        }
        return byDay.compactMap { (dayComps, daySamples) -> SleepSession? in
            guard let date = cal.date(from: dayComps) else { return nil }
            var deep = 0, rem = 0, core = 0, awake = 0
            for sample in daySamples {
                let mins = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                switch HKCategoryValueSleepAnalysis(rawValue: sample.value) {
                case .asleepDeep: deep += mins
                case .asleepREM:  rem  += mins
                case .asleepCore, .asleepUnspecified: core += mins
                case .awake, .inBed: awake += mins
                default: break
                }
            }
            let total = deep + rem + core
            guard total > 60 else { return nil }
            return SleepSession(date: date, totalMinutes: total,
                                deepMinutes: deep, remMinutes: rem,
                                coreMinutes: core, awakeMinutes: awake)
        }
        .sorted { $0.date > $1.date }
    }

    private func computeSleepScore(session: SleepSession) -> Int {
        let dur = session.totalMinutes
        let durScore = Double(min(100, max(0, Int((Double(dur - 300) / 180.0) * 100))))
        let awake = session.awakeMinutes
        let eff = dur > 0 ? min(100.0, (Double(dur - awake) / Double(dur + awake)) * 100) : 50.0
        let stageMins = session.deepMinutes + session.remMinutes
        let stageScore = dur > 0 ? min(100.0, (Double(stageMins) / Double(dur)) * 200) : 50.0
        return Int(durScore * 0.4 + stageScore * 0.3 + eff * 0.3)
    }

    // MARK: - Utilities

    private func closestValue(in dict: [Date: Double], to date: Date, cal: Calendar) -> Double? {
        dict.first { cal.isDate($0.key, inSameDayAs: date) }?.value
    }

    private func fmt(_ n: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: n)) ?? "\(n)"
    }
}

// MARK: - Event Row

private struct EventRow: View {
    let event: TimelineEvent

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(event.color.opacity(0.12))
                    .frame(width: 40, height: 40)
                Text(event.icon).font(.title3)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(event.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                Text(event.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let detail = event.detail, !detail.isEmpty {
                    Text(detail)
                        .font(.caption2)
                        .foregroundStyle(.secondary.opacity(0.7))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text(kindLabel)
                .font(.caption2.weight(.medium))
                .foregroundStyle(event.color)
                .padding(.top, 2)
        }
        .padding(12)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var kindLabel: String {
        switch event.kind {
        case .workout:     "Workout"
        case .sleep:       "Sleep"
        case .hrvHigh:     "HRV"
        case .hrvLow:      "HRV"
        case .stepPR:      "PR"
        case .stepGoal:    "Steps"
        case .calorieHigh: "Activity"
        }
    }
}

#Preview {
    NavigationStack { HealthTimelineView() }
}
