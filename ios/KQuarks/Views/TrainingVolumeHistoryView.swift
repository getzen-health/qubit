import SwiftUI
import Charts
import HealthKit

/// 52-week stacked training volume chart broken down by sport,
/// plus a rolling 4-week average, sport-mix breakdown, and recent weekly table.
struct TrainingVolumeHistoryView: View {

    // MARK: - Data

    private struct WeekPoint: Identifiable {
        let id: String        // ISO date of Monday
        let weekLabel: String // e.g. "Jan W1"
        let running: Double
        let cycling: Double
        let swimming: Double
        let strength: Double
        let hiit: Double
        let hiking: Double
        let rowing: Double
        let other: Double
        var total: Double { running + cycling + swimming + strength + hiit + hiking + rowing + other }
    }

    private struct SportTotal: Identifiable {
        let id: String
        let name: String
        let color: Color
        let totalMins: Double
    }

    // MARK: - State

    @State private var weeks: [WeekPoint] = []
    @State private var sportTotals: [SportTotal] = []
    @State private var totalHours: Double = 0
    @State private var avgWeeklyHours: Double = 0
    @State private var peakWeekMins: Double = 0
    @State private var peakWeekLabel: String = "—"
    @State private var isLoading = true

    // MARK: - Sport definitions

    private let sportColor: [String: Color] = [
        "Running": .orange, "Cycling": .blue, "Swimming": .cyan,
        "Strength": .red, "HIIT": .pink, "Hiking": .green,
        "Rowing": .purple, "Other": .gray
    ]

    private let sportOrder = ["Running", "Cycling", "Swimming", "Strength", "HIIT", "Hiking", "Rowing", "Other"]

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else {
                VStack(spacing: 16) {
                    summaryCards
                    sportMixCard
                    stackedVolumeChart
                    totalVolumeChart
                    recentWeeksTable
                    guidelinesCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Volume History")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        HStack(spacing: 12) {
            summaryCard(label: "Total", value: String(format: "%.0fh", totalHours), icon: "timer", color: .orange)
            summaryCard(label: "Avg/week", value: String(format: "%.1fh", avgWeeklyHours), icon: "calendar", color: .blue)
            summaryCard(label: "Peak week", value: String(format: "%.0fh", peakWeekMins / 60), icon: "trophy.fill", color: .yellow)
        }
    }

    private func summaryCard(label: String, value: String, icon: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.title3).foregroundStyle(color)
            Text(value).font(.title3.bold().monospacedDigit())
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Sport Mix Card

    private var sportMixCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Sport Mix (52 weeks)")
                .font(.headline)

            ForEach(sportTotals) { s in
                HStack(spacing: 8) {
                    Text(s.name)
                        .font(.caption)
                        .frame(width: 64, alignment: .leading)
                    GeometryReader { geo in
                        let pct = totalHours > 0 ? (s.totalMins / 60) / totalHours : 0
                        RoundedRectangle(cornerRadius: 4)
                            .fill(s.color)
                            .frame(width: max(4, geo.size.width * pct))
                    }
                    .frame(height: 16)
                    Text(String(format: "%.0fh (%.0f%%)", s.totalMins / 60,
                                totalHours > 0 ? (s.totalMins / 60) / totalHours * 100 : 0))
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Stacked Volume Chart

    private var stackedVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Volume by Sport (minutes)")
                .font(.headline)
                .padding(.horizontal, 4)

            // Recharts-equivalent: stacked BarChart in Swift Charts
            Chart {
                ForEach(weeks) { w in
                    if w.running > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Running", w.running))
                            .foregroundStyle(Color.orange).position(by: .value("Sport", "Running"))
                    }
                    if w.cycling > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Cycling", w.cycling))
                            .foregroundStyle(Color.blue).position(by: .value("Sport", "Cycling"))
                    }
                    if w.swimming > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Swimming", w.swimming))
                            .foregroundStyle(Color.cyan).position(by: .value("Sport", "Swimming"))
                    }
                    if w.strength > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Strength", w.strength))
                            .foregroundStyle(Color.red).position(by: .value("Sport", "Strength"))
                    }
                    if w.hiit > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("HIIT", w.hiit))
                            .foregroundStyle(Color.pink).position(by: .value("Sport", "HIIT"))
                    }
                    if w.hiking > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Hiking", w.hiking))
                            .foregroundStyle(Color.green).position(by: .value("Sport", "Hiking"))
                    }
                    if w.rowing > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Rowing", w.rowing))
                            .foregroundStyle(Color.purple).position(by: .value("Sport", "Rowing"))
                    }
                    if w.other > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Other", w.other))
                            .foregroundStyle(Color.gray).position(by: .value("Sport", "Other"))
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: 1)) { val in
                    if let s = val.as(String.self), s.contains("W1") {
                        AxisValueLabel { Text(s).font(.system(size: 8)) }
                    }
                }
            }
            .frame(height: 220)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Total Volume + Rolling Average

    private var totalVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Total + 4-Week Average")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeks) { w in
                    BarMark(x: .value("Week", w.weekLabel), y: .value("Total", w.total))
                        .foregroundStyle(.secondary.opacity(0.4))
                }

                // Rolling 4-week average as a line
                let rolling = rollingAvg(weeks: weeks)
                ForEach(Array(rolling.enumerated()), id: \.0) { _, pt in
                    LineMark(x: .value("Week", pt.0), y: .value("4w avg", pt.1))
                        .foregroundStyle(.orange)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        .interpolationMethod(.monotone)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: 1)) { val in
                    if let s = val.as(String.self), s.contains("W1") {
                        AxisValueLabel { Text(s).font(.system(size: 8)) }
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Recent Weeks Table

    private var recentWeeksTable: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Last 12 Weeks")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Week").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                    Text("Running").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                    Text("Cycling").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                    Text("Total").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(Array(weeks.suffix(12).reversed().enumerated()), id: \.element.id) { i, w in
                    Divider()
                    HStack {
                        Text(w.weekLabel).font(.caption).frame(maxWidth: .infinity, alignment: .leading)
                        Text(w.running > 0 ? "\(Int(w.running))m" : "—").font(.caption.monospacedDigit()).frame(width: 52, alignment: .trailing)
                        Text(w.cycling > 0 ? "\(Int(w.cycling))m" : "—").font(.caption.monospacedDigit()).frame(width: 52, alignment: .trailing)
                        Text(w.total > 0 ? "\(Int(w.total))m" : "—").font(.caption.monospacedDigit().bold()).frame(width: 52, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(i % 2 == 1 ? Color(.systemFill).opacity(0.3) : .clear)
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Guidelines Card

    private var guidelinesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Volume Guidelines", systemImage: "lightbulb.fill")
                .font(.headline).foregroundStyle(.orange)
            Text("Most endurance athletes aim for 6–12 hours/week during base building. Apply the 10% rule — increase weekly volume by no more than 10% week-over-week. Include a recovery week every 3–4 weeks (reduce volume by 20–30%). Consistent training volume is more important than occasional peak weeks.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let store = HKHealthStore()
        let type  = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { return }

        let oneYearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: oneYearAgo, end: Date())

        let allWorkouts = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        // Build 52 Mondays
        let cal = Calendar.current
        let now = Date()
        var monday = mondayOf(now)

        var weekBuckets: [(monday: Date, running: Double, cycling: Double, swimming: Double,
                           strength: Double, hiit: Double, hiking: Double, rowing: Double, other: Double)] = []
        for _ in 0..<52 {
            weekBuckets.insert((monday: monday, running: 0, cycling: 0, swimming: 0,
                                 strength: 0, hiit: 0, hiking: 0, rowing: 0, other: 0), at: 0)
            monday = cal.date(byAdding: .day, value: -7, to: monday) ?? Date()
        }

        // Map workout types to groups
        for w in allWorkouts where w.duration > 180 {
            let wMonday = mondayOf(w.startDate)
            guard let idx = weekBuckets.firstIndex(where: { sameDay($0.monday, wMonday) }) else { continue }
            let mins = w.duration / 60
            switch w.workoutActivityType {
            case .running:                            weekBuckets[idx].running  += mins
            case .cycling:                            weekBuckets[idx].cycling  += mins
            case .swimming:                           weekBuckets[idx].swimming += mins
            case .traditionalStrengthTraining, .functionalStrengthTraining, .coreTraining, .crossTraining:
                weekBuckets[idx].strength += mins
            case .highIntensityIntervalTraining:     weekBuckets[idx].hiit     += mins
            case .hiking:                            weekBuckets[idx].hiking   += mins
            case .rowing, .paddleSports:             weekBuckets[idx].rowing   += mins
            default:                                 weekBuckets[idx].other    += mins
            }
        }

        // Build WeekPoint array
        let mf = DateFormatter(); mf.dateFormat = "MMM d"
        weeks = weekBuckets.enumerated().map { _, b in
            let d = b.monday
            let dayOfMonth = cal.component(.day, from: d)
            let weekOfMonth = (dayOfMonth - 1) / 7 + 1
            let monthStr = d.formatted(.dateTime.month(.abbreviated))
            return WeekPoint(id: d.ISO8601Format(.iso8601Date(timeZone: .current)),
                             weekLabel: "\(monthStr) W\(weekOfMonth)",
                             running: b.running, cycling: b.cycling, swimming: b.swimming,
                             strength: b.strength, hiit: b.hiit, hiking: b.hiking,
                             rowing: b.rowing, other: b.other)
        }

        // Sport totals
        var groupMins: [String: Double] = [:]
        for w in weeks {
            groupMins["Running", default: 0]  += w.running
            groupMins["Cycling", default: 0]  += w.cycling
            groupMins["Swimming", default: 0] += w.swimming
            groupMins["Strength", default: 0] += w.strength
            groupMins["HIIT", default: 0]     += w.hiit
            groupMins["Hiking", default: 0]   += w.hiking
            groupMins["Rowing", default: 0]   += w.rowing
            groupMins["Other", default: 0]    += w.other
        }
        sportTotals = sportOrder.compactMap { name in
            let mins = groupMins[name] ?? 0
            guard mins >= 10 else { return nil }
            return SportTotal(id: name, name: name, color: sportColor[name] ?? .gray, totalMins: mins)
        }.sorted { $0.totalMins > $1.totalMins }

        let allMins = weeks.map(\.total).reduce(0, +)
        totalHours = allMins / 60
        let activeWeeksCount = weeks.filter { $0.total > 0 }.count
        avgWeeklyHours = activeWeeksCount > 0 ? (allMins / Double(activeWeeksCount)) / 60 : 0
        let peak = weeks.max(by: { $0.total < $1.total })
        peakWeekMins = peak?.total ?? 0
        peakWeekLabel = peak?.weekLabel ?? "—"
    }

    // MARK: - Helpers

    private func mondayOf(_ date: Date) -> Date {
        let cal = Calendar.current
        var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        comps.weekday = 2  // Monday
        return cal.date(from: comps) ?? date
    }

    private func sameDay(_ a: Date, _ b: Date) -> Bool {
        Calendar.current.isDate(a, inSameDayAs: b)
    }

    private func rollingAvg(weeks: [WeekPoint]) -> [(String, Double)] {
        weeks.enumerated().map { i, w in
            let slice = weeks[max(0, i - 3)...i]
            let avg = slice.map(\.total).reduce(0, +) / Double(slice.count)
            return (w.weekLabel, avg)
        }
    }
}

#Preview {
    NavigationStack { TrainingVolumeHistoryView() }
}
