import SwiftUI
import HealthKit
import Charts

// MARK: - OralHygieneView
// Analyzes Apple Watch toothbrushing detection (Series 5+).
// HKCategoryType(.toothbrushingEvent) records brushing sessions automatically.
// ADA recommends: 2× daily, ≥2 minutes each session.

struct OralHygieneView: View {

    // MARK: - Model

    struct BrushingDay: Identifiable {
        let id = UUID()
        let date: Date
        let count: Int               // sessions that day
        let totalDurationSecs: Double
        let avgDurationSecs: Double
        var meetsGoal: Bool { count >= 2 && avgDurationSecs >= 90 } // 90s minimum per ADA
    }

    struct BrushingSession: Identifiable {
        let id = UUID()
        let start: Date
        let durationSecs: Double
        var isLong: Bool { durationSecs >= 120 } // ≥2 min
    }

    // MARK: - State

    @State private var days: [BrushingDay] = []
    @State private var sessions: [BrushingSession] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Computed

    private var currentStreak: Int {
        let cal = Calendar.current
        var streak = 0
        var check = cal.startOfDay(for: Date())
        for _ in 0..<90 {
            if let day = days.first(where: { cal.isDate($0.date, inSameDayAs: check) }) {
                if day.meetsGoal { streak += 1 }
                else { break }
            } else { break }
            guard let prev = cal.date(byAdding: .day, value: -1, to: check) else { break }
            check = prev
        }
        return streak
    }

    private var goalDays: Int { days.filter { $0.meetsGoal }.count }
    private var goalPct: Double { days.isEmpty ? 0 : Double(goalDays) / Double(days.count) * 100 }

    private var avgSessions: Double {
        guard !days.isEmpty else { return 0 }
        return Double(days.map(\.count).reduce(0, +)) / Double(days.count)
    }

    private var avgDuration: Double {
        let s = sessions.map(\.durationSecs)
        guard !s.isEmpty else { return 0 }
        return s.reduce(0, +) / Double(s.count)
    }

    private var morningPct: Double {
        guard !sessions.isEmpty else { return 0 }
        let morning = sessions.filter {
            let hour = Calendar.current.component(.hour, from: $0.start)
            return hour >= 5 && hour < 12
        }.count
        return Double(morning) / Double(sessions.count) * 100
    }

    private var eveningPct: Double {
        guard !sessions.isEmpty else { return 0 }
        let evening = sessions.filter {
            let hour = Calendar.current.component(.hour, from: $0.start)
            return hour >= 18 && hour < 24
        }.count
        return Double(evening) / Double(sessions.count) * 100
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Info banner
                infoBanner

                // Summary stats
                summaryStats

                // 90-day goal chart
                if !days.isEmpty {
                    goalChart
                }

                // Duration analysis
                if avgDuration > 0 {
                    durationCard
                }

                // Time-of-day
                if !sessions.isEmpty {
                    timeOfDayCard
                }

                // Science
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Oral Hygiene")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Loading brushing data…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var infoBanner: some View {
        VStack(spacing: 6) {
            HStack {
                Text("🦷")
                Text("Apple Watch Toothbrushing Detection")
                    .font(.headline)
                Spacer()
                Text("Series 5+")
                    .font(.caption2)
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(.mint.opacity(0.15))
                    .foregroundStyle(.mint)
                    .clipShape(Capsule())
            }
            Text("Apple Watch Series 5+ automatically detects toothbrushing sessions via accelerometer. No app required — just brush normally. Sessions appear in the Health app.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var summaryStats: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {

            OralStatCard(title: "Current Streak",
                     value: "\(currentStreak)",
                     unit: "days",
                     icon: "flame.fill",
                     color: currentStreak >= 7 ? .orange : .yellow,
                     badge: currentStreak >= 7 ? "On fire!" : currentStreak >= 3 ? "Good" : "Keep going",
                     badgeColor: currentStreak >= 7 ? .orange : .yellow)

            OralStatCard(title: "Goal Rate",
                     value: String(format: "%.0f%%", goalPct),
                     unit: "days met 2× goal",
                     icon: "checkmark.circle.fill",
                     color: goalPct >= 80 ? .green : goalPct >= 50 ? .yellow : .red,
                     badge: goalPct >= 80 ? "Excellent" : goalPct >= 50 ? "Good" : "Needs work",
                     badgeColor: goalPct >= 80 ? .green : goalPct >= 50 ? .yellow : .red)

            OralStatCard(title: "Avg Sessions/Day",
                     value: String(format: "%.1f", avgSessions),
                     unit: "of 2 recommended",
                     icon: "clock.fill",
                     color: avgSessions >= 1.8 ? .green : avgSessions >= 1.0 ? .yellow : .red,
                     badge: avgSessions >= 1.8 ? "On target" : "Below ADA",
                     badgeColor: avgSessions >= 1.8 ? .green : .orange)

            OralStatCard(title: "Avg Duration",
                     value: String(format: "%.0f", avgDuration),
                     unit: "seconds (120s goal)",
                     icon: "timer",
                     color: avgDuration >= 120 ? .green : avgDuration >= 90 ? .yellow : .red,
                     badge: avgDuration >= 120 ? "Full 2 min" : avgDuration >= 90 ? "Close" : "Too short",
                     badgeColor: avgDuration >= 120 ? .green : avgDuration >= 90 ? .yellow : .red)
        }
        .padding(.horizontal)
    }

    private var goalChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("90-Day Brushing Frequency", systemImage: "calendar")
                .font(.subheadline).bold()

            Text("Daily session count. Goal line = 2 sessions/day (ADA recommendation).")
                .font(.caption2).foregroundStyle(.secondary)

            Chart {
                RuleMark(y: .value("Goal", 2))
                    .lineStyle(StrokeStyle(dash: [4]))
                    .foregroundStyle(.green)
                    .annotation(position: .trailing) {
                        Text("goal").font(.caption2).foregroundStyle(.green)
                    }

                ForEach(days) { day in
                    BarMark(x: .value("Date", day.date, unit: .day),
                            y: .value("Sessions", day.count))
                        .foregroundStyle(day.meetsGoal ? Color.mint.gradient : Color.orange.gradient)
                        .cornerRadius(2)
                }
            }
            .frame(height: 160)
            .chartXAxis { AxisMarks(values: .stride(by: .month)) { _ in
                AxisValueLabel(format: .dateTime.month(.abbreviated))
            }}

            HStack {
                Circle().fill(.mint).frame(width: 8, height: 8)
                Text("Goal met (2×/day)").font(.caption2)
                Spacer()
                Circle().fill(.orange).frame(width: 8, height: 8)
                Text("Below goal").font(.caption2)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var durationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Brushing Duration Analysis", systemImage: "timer")
                .font(.subheadline).bold()

            let short = sessions.filter { $0.durationSecs < 90 }.count
            let medium = sessions.filter { $0.durationSecs >= 90 && $0.durationSecs < 120 }.count
            let full = sessions.filter { $0.durationSecs >= 120 }.count
            let total = sessions.count

            HStack {
                durationBar(label: "<90s", count: short, total: total, color: .red)
                durationBar(label: "90-120s", count: medium, total: total, color: .yellow)
                durationBar(label: "≥120s", count: full, total: total, color: .green)
            }

            Text("ADA recommendation: ≥2 minutes (120 seconds) per session, twice daily.")
                .font(.caption2).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func durationBar(label: String, count: Int, total: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            let pct = total > 0 ? Double(count) / Double(total) : 0
            Text(String(format: "%.0f%%", pct * 100))
                .font(.title2).bold().foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text("\(count) sessions").font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    private var timeOfDayCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("When You Brush", systemImage: "clock.fill")
                .font(.subheadline).bold()

            HStack(spacing: 16) {
                timeBlock(icon: "sun.horizon.fill", label: "Morning",
                          pct: morningPct, color: .yellow,
                          detail: "5 AM – 12 PM")
                Divider()
                timeBlock(icon: "moon.fill", label: "Evening",
                          pct: eveningPct, color: .indigo,
                          detail: "6 PM – 12 AM")
                Divider()
                timeBlock(icon: "clock", label: "Other",
                          pct: max(0, 100 - morningPct - eveningPct), color: .gray,
                          detail: "Midday etc.")
            }

            let both = morningPct > 20 && eveningPct > 20
            Text(both ? "You brush at both morning and evening — consistent with optimal dental hygiene timing." :
                        "Try to brush once in the morning after breakfast and once before bed for maximum benefit.")
                .font(.caption2).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func timeBlock(icon: String, label: String, pct: Double, color: Color, detail: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).foregroundStyle(color).font(.title3)
            Text(String(format: "%.0f%%", max(0, pct))).font(.title3).bold()
            Text(label).font(.caption2).bold()
            Text(detail).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Why It Matters", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            scienceItem("ADA Recommendation", detail: "The American Dental Association recommends brushing twice daily for 2 minutes with fluoride toothpaste. Only 45% of US adults meet this target (ADA Health Policy Institute, 2019).")
            scienceItem("Cardiovascular Link", detail: "Inadequate oral hygiene is associated with increased risk of infective endocarditis and cardiovascular disease. Gum disease bacteria can enter the bloodstream and trigger inflammation (Dietrich et al. 2013).")
            scienceItem("Duration Matters Most (Claydon 2008)", detail: "Brushing for 2 minutes removes 26% more plaque than 45 seconds. Technique and duration outweigh frequency as the key variable for plaque control.")
            scienceItem("Apple Watch Detection", detail: "Apple Watch Series 5+ uses accelerometer data to automatically detect brushing events — no special app needed. Sessions appear in Health app under Other Data → Toothbrushing.")
        }
        .padding()
        .background(Color.premiumSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func scienceItem(_ title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption).bold()
            Text(detail).font(.caption2).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Data loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        guard let brushType = HKCategoryType.categoryType(forIdentifier: .toothbrushingEvent) else {
            isLoading = false; return
        }

        do {
            try await healthStore.requestAuthorization(toShare: [], read: [brushType])
        } catch {
            isLoading = false; return
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end) ?? Date(timeIntervalSinceNow: -90 * 86400)
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        let rawSamples: [HKCategorySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: brushType,
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sort]
            ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
            healthStore.execute(q)
        }

        let fetchedSessions = rawSamples.map { s in
            BrushingSession(
                start: s.startDate,
                durationSecs: s.endDate.timeIntervalSince(s.startDate)
            )
        }

        // Group by day
        var cal = Calendar.current
        cal.timeZone = .current
        var dayMap: [Date: (count: Int, totalSecs: Double)] = [:]
        for session in fetchedSessions {
            let key = cal.startOfDay(for: session.start)
            var entry = dayMap[key] ?? (0, 0)
            entry.count += 1
            entry.totalSecs += session.durationSecs
            dayMap[key] = entry
        }

        let brushingDays = dayMap.map { (date, entry) in
            BrushingDay(
                date: date,
                count: entry.count,
                totalDurationSecs: entry.totalSecs,
                avgDurationSecs: entry.count > 0 ? entry.totalSecs / Double(entry.count) : 0
            )
        }.sorted { $0.date < $1.date }

        await MainActor.run {
            sessions = fetchedSessions
            days = brushingDays
            isLoading = false
        }
    }
}

// MARK: - StatCard helper

private struct OralStatCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color
    let badge: String
    let badgeColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: icon).foregroundStyle(color)
                Spacer()
                Text(badge)
                    .font(.caption2).bold()
                    .padding(.horizontal, 5).padding(.vertical, 2)
                    .background(badgeColor.opacity(0.15))
                    .foregroundStyle(badgeColor)
                    .clipShape(Capsule())
            }
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2).bold()
            Text(unit).font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
