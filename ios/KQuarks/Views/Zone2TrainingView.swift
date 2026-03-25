import SwiftUI
import Charts
import HealthKit

/// Zone 2 Training Tracker — shows 52-week Zone 2 aerobic base volume
/// classified from avg heart rate per workout (60–70% of 190 bpm max HR).
struct Zone2TrainingView: View {

    // MARK: - Models

    private struct WeekBucket: Identifiable {
        let id: String          // ISO Monday date
        let weekLabel: String   // "Jan W1"
        var z2Running:  Double = 0
        var z2Cycling:  Double = 0
        var z2Walking:  Double = 0
        var z2Hiking:   Double = 0
        var z2Swimming: Double = 0
        var z2Other:    Double = 0
        var total: Double { z2Running + z2Cycling + z2Walking + z2Hiking + z2Swimming + z2Other }
    }

    private struct SportZ2: Identifiable {
        let id: String
        let name: String
        let color: Color
        let totalMins: Double
    }

    // MARK: - Zone 2 parameters

    private let maxHR: Double = 190
    private var z2Low:  Double { maxHR * 0.60 }   // 114 bpm
    private var z2High: Double { maxHR * 0.70 }   // 133 bpm

    // MARK: - State

    @State private var weeks: [WeekBucket] = []
    @State private var sportTotals: [SportZ2] = []
    @State private var totalZ2Hours: Double = 0
    @State private var avgZ2HoursPerWeek: Double = 0
    @State private var peakWeekMins: Double = 0
    @State private var peakWeekLabel: String = "—"
    @State private var currentWeekMins: Double = 0
    @State private var isLoading = true

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else {
                VStack(spacing: 16) {
                    weeklyStatusCard
                    summaryCards
                    weeklyChart
                    sportMixCard
                    recentWeeksTable
                    z2ExplainerCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Zone 2 Training")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Weekly Status Card

    private var weeklyStatusCard: some View {
        let targetMins: Double = 180 // 3 hours
        let pct = min(1.0, currentWeekMins / targetMins)
        let reached = currentWeekMins >= targetMins

        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("This Week")
                        .font(.headline)
                    Text(reached
                         ? "Zone 2 target reached!"
                         : "\(Int(currentWeekMins)) / 180 min (3h target)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if reached {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundStyle(.green)
                        .font(.title2)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.systemFill))
                        .frame(height: 12)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(reached ? Color.green : Color.green.opacity(0.7))
                        .frame(width: max(8, geo.size.width * pct), height: 12)
                }
            }
            .frame(height: 12)

            Text(reached
                 ? "Excellent aerobic base work this week!"
                 : "\(Int((targetMins - currentWeekMins) / 60 * 10) / 10)h remaining to hit 3h Zone 2 goal")
                .font(.caption2)
                .foregroundStyle(reached ? .green : .secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        HStack(spacing: 12) {
            summaryCard(label: "Total Z2",
                        value: String(format: "%.0fh", totalZ2Hours),
                        icon: "heart.circle.fill", color: .green)
            summaryCard(label: "Avg/week",
                        value: String(format: "%.1fh", avgZ2HoursPerWeek),
                        icon: "calendar", color: .teal)
            summaryCard(label: "Peak week",
                        value: String(format: "%.0fh", peakWeekMins / 60),
                        icon: "trophy.fill", color: .yellow)
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

    // MARK: - Weekly Zone 2 Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Zone 2 Minutes")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                // 3h target line
                RuleMark(y: .value("Target", 180))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5]))
                    .foregroundStyle(.green.opacity(0.7))
                    .annotation(position: .topLeading) {
                        Text("3h target")
                            .font(.caption2)
                            .foregroundStyle(.green.opacity(0.7))
                    }

                ForEach(weeks) { w in
                    if w.z2Running > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Running", w.z2Running))
                            .foregroundStyle(Color.orange)
                            .position(by: .value("Sport", "Running"))
                    }
                    if w.z2Cycling > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Cycling", w.z2Cycling))
                            .foregroundStyle(Color.blue)
                            .position(by: .value("Sport", "Cycling"))
                    }
                    if w.z2Walking > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Walking", w.z2Walking))
                            .foregroundStyle(Color.yellow)
                            .position(by: .value("Sport", "Walking"))
                    }
                    if w.z2Hiking > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Hiking", w.z2Hiking))
                            .foregroundStyle(Color.green)
                            .position(by: .value("Sport", "Hiking"))
                    }
                    if w.z2Swimming > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Swimming", w.z2Swimming))
                            .foregroundStyle(Color.cyan)
                            .position(by: .value("Sport", "Swimming"))
                    }
                    if w.z2Other > 0 {
                        BarMark(x: .value("Week", w.weekLabel), y: .value("Other", w.z2Other))
                            .foregroundStyle(Color.gray)
                            .position(by: .value("Sport", "Other"))
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

    // MARK: - Sport Mix Card

    private var sportMixCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Zone 2 by Sport (52 weeks)")
                .font(.headline)

            ForEach(sportTotals) { s in
                HStack(spacing: 8) {
                    Text(s.name)
                        .font(.caption)
                        .frame(width: 68, alignment: .leading)
                    GeometryReader { geo in
                        let pct = totalZ2Hours > 0 ? (s.totalMins / 60) / totalZ2Hours : 0
                        RoundedRectangle(cornerRadius: 4)
                            .fill(s.color)
                            .frame(width: max(4, geo.size.width * pct))
                    }
                    .frame(height: 16)
                    Text(String(format: "%.0fh (%.0f%%)",
                                s.totalMins / 60,
                                totalZ2Hours > 0 ? (s.totalMins / 60) / totalZ2Hours * 100 : 0))
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Recent Weeks Table

    private var recentWeeksTable: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Last 8 Weeks")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Week").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                    Text("Z2 Min").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 56, alignment: .trailing)
                    Text("Z2 Hrs").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 52, alignment: .trailing)
                    Text("Status").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 56, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(Array(weeks.suffix(8).reversed().enumerated()), id: \.element.id) { i, w in
                    Divider()
                    HStack {
                        Text(w.weekLabel)
                            .font(.caption)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Text(w.total > 0 ? "\(Int(w.total))" : "—")
                            .font(.caption.monospacedDigit())
                            .frame(width: 56, alignment: .trailing)
                        Text(w.total > 0 ? String(format: "%.1f", w.total / 60) : "—")
                            .font(.caption.monospacedDigit())
                            .frame(width: 52, alignment: .trailing)
                        statusBadge(mins: w.total)
                            .frame(width: 56, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(i % 2 == 1 ? Color(.systemFill).opacity(0.3) : .clear)
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func statusBadge(mins: Double) -> some View {
        let (label, color): (String, Color) =
            mins >= 180 ? ("✓ Goal", .green) :
            mins >= 90  ? ("~Half", .orange) :
            mins > 0    ? ("Low", .red) :
                          ("—", .secondary)
        return Text(label)
            .font(.caption2.bold())
            .foregroundStyle(color)
    }

    // MARK: - Explainer Card

    private var z2ExplainerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("What is Zone 2?", systemImage: "heart.circle.fill")
                .font(.headline)
                .foregroundStyle(.green)
            Text("Zone 2 is 60–70% of your max heart rate (~114–133 bpm for a 190 bpm max). It's the intensity where you can hold a conversation but are working steadily. Most endurance coaches recommend 3–4 hours per week for recreational athletes building aerobic base.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.green.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Zone 2 Benefits", systemImage: "lightbulb.fill")
                .font(.headline)
                .foregroundStyle(.green)
            VStack(alignment: .leading, spacing: 4) {
                bulletLine("Increases mitochondrial density and efficiency")
                bulletLine("Improves fat oxidation for sustained energy")
                bulletLine("Enhances aerobic capacity with minimal recovery cost")
                bulletLine("Promotes faster recovery between hard sessions")
                bulletLine("Lowers resting heart rate and improves HRV over time")
            }
        }
        .padding()
        .background(Color.teal.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func bulletLine(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•").font(.caption).foregroundStyle(.green)
            Text(text).font(.caption).foregroundStyle(.secondary)
        }
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
            let q = HKSampleQuery(
                sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        // Build 52 Monday buckets
        let cal = Calendar.current
        let now = Date()
        var monday = mondayOf(now)
        var buckets: [WeekBucket] = []
        for _ in 0..<52 {
            let d = monday
            let dayOfMonth = cal.component(.day, from: d)
            let weekOfMonth = (dayOfMonth - 1) / 7 + 1
            let monthStr = d.formatted(.dateTime.month(.abbreviated))
            let isoKey = d.ISO8601Format(.iso8601Date(timeZone: .current))
            buckets.insert(
                WeekBucket(id: isoKey, weekLabel: "\(monthStr) W\(weekOfMonth)"),
                at: 0
            )
            monday = cal.date(byAdding: .day, value: -7, to: monday) ?? Date()
        }

        // Classify each workout's Z2 contribution
        for w in allWorkouts where w.duration > 300 {
            let hrUnit = HKUnit.count().unitDivided(by: .minute())
            guard let avgHR = w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: hrUnit),
                  avgHR > 0 else { continue }
            let wMonday = mondayOf(w.startDate)
            guard let idx = buckets.firstIndex(where: { sameDay($0.id, wMonday) }) else { continue }
            let mins = w.duration / 60
            let z2Factor = zone2Factor(avgHR: avgHR)
            guard z2Factor > 0 else { continue }
            let z2Mins = mins * z2Factor
            switch w.workoutActivityType {
            case .running:                               buckets[idx].z2Running  += z2Mins
            case .cycling:                               buckets[idx].z2Cycling  += z2Mins
            case .walking:                               buckets[idx].z2Walking  += z2Mins
            case .hiking:                                buckets[idx].z2Hiking   += z2Mins
            case .swimming:                              buckets[idx].z2Swimming += z2Mins
            default:                                     buckets[idx].z2Other    += z2Mins
            }
        }

        weeks = buckets

        // Sport totals
        var sportMap: [String: (Double, Color)] = [
            "Running":  (0, .orange), "Cycling": (0, .blue), "Walking": (0, .yellow),
            "Hiking":   (0, .green),  "Swimming": (0, .cyan), "Other":  (0, .gray)
        ]
        for w in weeks {
            sportMap["Running",  default: (0, .orange)].0 += w.z2Running
            sportMap["Cycling",  default: (0, .blue)].0   += w.z2Cycling
            sportMap["Walking",  default: (0, .yellow)].0 += w.z2Walking
            sportMap["Hiking",   default: (0, .green)].0  += w.z2Hiking
            sportMap["Swimming", default: (0, .cyan)].0   += w.z2Swimming
            sportMap["Other",    default: (0, .gray)].0   += w.z2Other
        }
        sportTotals = sportMap.compactMap { name, tuple in
            guard tuple.0 >= 10 else { return nil }
            return SportZ2(id: name, name: name, color: tuple.1, totalMins: tuple.0)
        }.sorted { $0.totalMins > $1.totalMins }

        let allZ2Mins = weeks.map(\.total).reduce(0, +)
        totalZ2Hours = allZ2Mins / 60
        let activeWeeks = weeks.filter { $0.total > 0 }
        avgZ2HoursPerWeek = activeWeeks.isEmpty ? 0 : (allZ2Mins / Double(activeWeeks.count)) / 60
        let peak = weeks.max(by: { $0.total < $1.total })
        peakWeekMins  = peak?.total ?? 0
        peakWeekLabel = peak?.weekLabel ?? "—"
        currentWeekMins = weeks.last?.total ?? 0
    }

    // MARK: - Helpers

    /// Returns 0.0–1.0 fraction of workout duration that counts as Zone 2.
    private func zone2Factor(avgHR: Double) -> Double {
        let nearFloor = z2Low - 9  // 105 bpm
        if avgHR >= z2Low && avgHR <= z2High { return 0.80 }   // squarely in Z2
        if avgHR >= nearFloor && avgHR < z2Low { return 0.40 } // slightly below Z2 (easy runs drift into Z2)
        return 0.0
    }

    private func mondayOf(_ date: Date) -> Date {
        let cal = Calendar.current
        var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        comps.weekday = 2
        return cal.date(from: comps) ?? date
    }

    private func sameDay(_ isoString: String, _ date: Date) -> Bool {
        let iso = date.ISO8601Format(.iso8601Date(timeZone: .current))
        return isoString == iso
    }

}

#Preview {
    NavigationStack { Zone2TrainingView() }
}
