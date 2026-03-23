import SwiftUI
import HealthKit
import Charts

// MARK: - AlcoholTrackingView
// Analyzes logged alcoholic beverages (HKQuantityType(.numberOfAlcoholicBeverages))
// vs WHO guidelines, with next-day HRV and RHR impact correlation.
// Science: Roehrs & Roth 2001 (sleep), Colrain 2014 (HRV suppression).

struct AlcoholTrackingView: View {

    // MARK: - Model

    struct DrinkDay: Identifiable {
        let id = UUID()
        let date: Date
        let drinks: Double
        let nextDayHRV: Double?    // ms SDNN
        let nextDayRHR: Double?    // bpm
        var riskLevel: RiskLevel {
            switch drinks {
            case 0:      return .none
            case 1...2:  return .low
            case 3...4:  return .moderate
            default:     return .high
            }
        }
    }

    enum RiskLevel: String {
        case none = "Alcohol-free"
        case low = "Low risk"
        case moderate = "Moderate risk"
        case high = "Heavy drinking"

        var color: Color {
            switch self {
            case .none:     return .green
            case .low:      return .blue
            case .moderate: return .orange
            case .high:     return .red
            }
        }
    }

    struct WeekSummary: Identifiable {
        let id = UUID()
        let weekStart: Date
        let totalDrinks: Double
        let daysWithDrinks: Int
    }

    // MARK: - State

    @State private var days: [DrinkDay] = []
    @State private var weekSummaries: [WeekSummary] = []
    @State private var isLoading = true
    @State private var selectedView: ViewMode = .daily

    private let healthStore = HKHealthStore()

    enum ViewMode: String, CaseIterable {
        case daily = "Daily"
        case weekly = "Weekly"
    }

    // MARK: - Computed

    private var avgPerDay: Double {
        let drinkDays = days.filter { $0.drinks > 0 }
        guard !drinkDays.isEmpty else { return 0 }
        return drinkDays.map(\.drinks).reduce(0, +) / Double(drinkDays.count)
    }

    private var daysWithDrinks: Int { days.filter { $0.drinks > 0 }.count }
    private var freeDays: Int { days.filter { $0.drinks == 0 }.count }

    private var weeklyAvg: Double {
        guard !weekSummaries.isEmpty else { return 0 }
        return weekSummaries.map(\.totalDrinks).reduce(0, +) / Double(weekSummaries.count)
    }

    // HRV impact: compare days-after-drinking vs days-after-no-drink
    private var hrvImpact: (drinkDays: Double?, freeDays: Double?) {
        let afterDrink = days.filter { $0.drinks > 0 }.compactMap(\.nextDayHRV)
        let afterFree  = days.filter { $0.drinks == 0 }.compactMap(\.nextDayHRV)
        return (afterDrink.isEmpty ? nil : afterDrink.reduce(0,+)/Double(afterDrink.count),
                afterFree.isEmpty ? nil : afterFree.reduce(0,+)/Double(afterFree.count))
    }

    private var rhrImpact: (drinkDays: Double?, freeDays: Double?) {
        let afterDrink = days.filter { $0.drinks > 0 }.compactMap(\.nextDayRHR)
        let afterFree  = days.filter { $0.drinks == 0 }.compactMap(\.nextDayRHR)
        return (afterDrink.isEmpty ? nil : afterDrink.reduce(0,+)/Double(afterDrink.count),
                afterFree.isEmpty ? nil : afterFree.reduce(0,+)/Double(afterFree.count))
    }

    // Day-of-week distribution
    private var dowCounts: [(dow: String, avg: Double)] {
        let dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return dows.enumerated().map { (i, label) in
            let matching = days.filter { Calendar.current.component(.weekday, from: $0.date) == i + 1 }
            let avg = matching.isEmpty ? 0 : matching.map(\.drinks).reduce(0,+) / Double(matching.count)
            return (label, avg)
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Info banner
                infoBanner

                // Summary stats
                summaryCards

                // Chart picker
                Picker("View", selection: $selectedView) {
                    ForEach(ViewMode.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                // Trend chart
                if !days.isEmpty {
                    trendChart
                }

                // Day-of-week
                dowChart

                // Impact cards
                if hrvImpact.drinkDays != nil || rhrImpact.drinkDays != nil {
                    biometricImpactCard
                }

                // Science
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Alcohol Tracker")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Loading beverage data…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var infoBanner: some View {
        VStack(spacing: 6) {
            HStack {
                Text("🍷")
                Text("Alcoholic Beverage Tracking")
                    .font(.headline)
                Spacer()
                Text("Log in Health app")
                    .font(.caption2)
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(.purple.opacity(0.15))
                    .foregroundStyle(.purple)
                    .clipShape(Capsule())
            }
            Text("Log drinks in Health app → Nutrition → Alcoholic Beverages, or via apps like Drink Control, MyFitnessPal & Drinkio that sync to Apple Health.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {

            AlcCard(title: "Weekly Average",
                    value: String(format: "%.1f", weeklyAvg),
                    unit: "drinks/week",
                    color: weeklyAvg <= 7 ? .green : weeklyAvg <= 14 ? .orange : .red,
                    badge: weeklyAvg <= 7 ? "Low risk" : weeklyAvg <= 14 ? "Moderate" : "Heavy",
                    badgeColor: weeklyAvg <= 7 ? .green : weeklyAvg <= 14 ? .orange : .red)

            AlcCard(title: "Days with Drinks",
                    value: "\(daysWithDrinks)",
                    unit: "of \(days.count) days",
                    color: daysWithDrinks <= days.count / 2 ? .green : .orange,
                    badge: "\(freeDays) alcohol-free days",
                    badgeColor: .green)

            AlcCard(title: "Avg on Drink Days",
                    value: String(format: "%.1f", avgPerDay),
                    unit: "drinks/session",
                    color: avgPerDay <= 2 ? .green : avgPerDay <= 3 ? .orange : .red,
                    badge: avgPerDay <= 2 ? "Moderate" : "Heavy session",
                    badgeColor: avgPerDay <= 2 ? .green : .red)

            AlcCard(title: "WHO Guideline",
                    value: weeklyAvg <= 14 ? "Within" : "Exceeds",
                    unit: "14 units/week limit",
                    color: weeklyAvg <= 14 ? .green : .red,
                    badge: weeklyAvg <= 14 ? "Compliant" : "Over limit",
                    badgeColor: weeklyAvg <= 14 ? .green : .red)
        }
        .padding(.horizontal)
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(selectedView == .daily ? "Daily Drinks — 90 Days" : "Weekly Totals")
                .font(.subheadline).bold()

            if selectedView == .daily {
                Chart {
                    // Low risk threshold
                    RuleMark(y: .value("Low risk", 2))
                        .lineStyle(StrokeStyle(dash: [4]))
                        .foregroundStyle(.orange.opacity(0.5))
                    RuleMark(y: .value("Heavy", 4))
                        .lineStyle(StrokeStyle(dash: [4]))
                        .foregroundStyle(.red.opacity(0.5))

                    ForEach(days) { day in
                        BarMark(x: .value("Date", day.date, unit: .day),
                                y: .value("Drinks", day.drinks))
                            .foregroundStyle(day.riskLevel.color.gradient)
                            .cornerRadius(2)
                    }
                }
                .frame(height: 160)
                .chartXAxis { AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }}
            } else {
                Chart(weekSummaries) { week in
                    BarMark(x: .value("Week", week.weekStart, unit: .weekOfYear),
                            y: .value("Total", week.totalDrinks))
                        .foregroundStyle(week.totalDrinks <= 7 ? Color.green.gradient :
                                         week.totalDrinks <= 14 ? Color.orange.gradient : Color.red.gradient)
                        .cornerRadius(4)
                }
                .frame(height: 160)
                .chartXAxis { AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }}
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var dowChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Day-of-Week Pattern", systemImage: "calendar")
                .font(.subheadline).bold()

            Chart(dowCounts, id: \.dow) { item in
                BarMark(x: .value("Day", item.dow),
                        y: .value("Avg drinks", item.avg))
                    .foregroundStyle(item.dow == "Fri" || item.dow == "Sat" ? Color.orange.gradient : Color.blue.gradient)
                    .cornerRadius(4)
            }
            .frame(height: 120)
            .chartYAxisLabel("avg drinks")
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var biometricImpactCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Next-Day Biomarker Impact", systemImage: "waveform.path.ecg.rectangle.fill")
                .font(.subheadline).bold()

            Text("Comparing HRV and resting HR on mornings after drinking vs alcohol-free nights.")
                .font(.caption2).foregroundStyle(.secondary)

            let hrv = hrvImpact
            let rhr = rhrImpact

            if let drinkHRV = hrv.drinkDays, let freeHRV = hrv.freeDays {
                impactRow(
                    label: "Morning HRV",
                    icon: "waveform.path.ecg",
                    drinkValue: String(format: "%.0f ms", drinkHRV),
                    freeValue: String(format: "%.0f ms", freeHRV),
                    delta: drinkHRV - freeHRV,
                    lowerIsBad: false
                )
            }
            if let drinkRHR = rhr.drinkDays, let freeRHR = rhr.freeDays {
                Divider()
                impactRow(
                    label: "Resting HR",
                    icon: "heart.fill",
                    drinkValue: String(format: "%.0f bpm", drinkRHR),
                    freeValue: String(format: "%.0f bpm", freeRHR),
                    delta: drinkRHR - freeRHR,
                    lowerIsBad: true
                )
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func impactRow(label: String, icon: String, drinkValue: String, freeValue: String,
                           delta: Double, lowerIsBad: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: icon).foregroundStyle(.secondary).frame(width: 20)
                Text(label).font(.caption).bold()
                Spacer()
                let deltaColor: Color = (delta < 0) == lowerIsBad ? .red : .green
                let sign = delta >= 0 ? "+" : ""
                Text("\(sign)\(String(format: "%.1f", delta))")
                    .font(.caption).bold().foregroundStyle(deltaColor)
            }
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("After drinking").font(.caption2).foregroundStyle(.secondary)
                    Text(drinkValue).font(.subheadline).bold().foregroundStyle(.red)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Alcohol-free nights").font(.caption2).foregroundStyle(.secondary)
                    Text(freeValue).font(.subheadline).bold().foregroundStyle(.green)
                }
            }
        }
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Research", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            scienceItem("WHO Guidelines (2023)", detail: "No level of alcohol is safe for health. However, low-risk drinking is defined as ≤2 standard drinks/day and ≤10 (women) or ≤15 (men) drinks/week with ≥2 alcohol-free days.")
            scienceItem("HRV Suppression (Colrain et al. 2014)", detail: "Even moderate alcohol consumption significantly reduces HRV, particularly RMSSD. A single episode of moderate drinking reduces HRV for 12-24 hours post-consumption.")
            scienceItem("Sleep Architecture (Roehrs & Roth 2001)", detail: "Alcohol consolidates sleep in the first half of the night but disrupts REM and deep sleep in the second half. Dose-dependent — more drinks = more disruption.")
            scienceItem("Resting HR elevation", detail: "Alcohol increases heart rate during sleep and the following morning. Each standard drink raises overnight mean HR by ~1-2 bpm. Visible clearly in Apple Watch heart rate data.")
        }
        .padding()
        .background(Color(.tertiarySystemBackground))
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
        guard HKHealthStore.isHealthDataAvailable(),
              let drinkType = HKQuantityType.quantityType(forIdentifier: .numberOfAlcoholicBeverages),
              let hrvType   = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
              let rhrType   = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) else {
            isLoading = false; return
        }

        let readTypes: Set<HKObjectType> = [drinkType, hrvType, rhrType]
        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        } catch { isLoading = false; return }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -91, to: end) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        async let drinkSamples = fetchSamples(type: drinkType, pred: pred, sort: sort)
        async let hrvSamples   = fetchSamples(type: hrvType,   pred: pred, sort: sort)
        async let rhrSamples   = fetchSamples(type: rhrType,   pred: pred, sort: sort)
        let (drinks, hrvAll, rhrAll) = await (drinkSamples, hrvSamples, rhrSamples)

        var cal = Calendar.current
        cal.timeZone = .current

        // Daily drink map
        var drinkMap: [Date: Double] = [:]
        for s in drinks {
            let key = cal.startOfDay(for: s.startDate)
            drinkMap[key, default: 0] += s.quantity.doubleValue(for: .count())
        }

        // Daily HRV/RHR maps
        var hrvMap: [Date: [Double]] = [:]
        for s in hrvAll {
            let key = cal.startOfDay(for: s.startDate)
            hrvMap[key, default: []].append(s.quantity.doubleValue(for: HKUnit(from: "ms")))
        }
        var rhrMap: [Date: [Double]] = [:]
        for s in rhrAll {
            let key = cal.startOfDay(for: s.startDate)
            rhrMap[key, default: []].append(s.quantity.doubleValue(for: HKUnit(from: "count/min")))
        }

        // Build daily points for 90 days
        var current = cal.date(byAdding: .day, value: 1, to: start) ?? Date()
        var drinkDays: [DrinkDay] = []
        while current <= end {
            let key = cal.startOfDay(for: current)
            let nextKey = cal.startOfDay(for: cal.date(byAdding: .day, value: 1, to: key) ?? Date())
            let nextHRV = hrvMap[nextKey].map { $0.reduce(0,+) / Double($0.count) }
            let nextRHR = rhrMap[nextKey].map { $0.reduce(0,+) / Double($0.count) }
            drinkDays.append(DrinkDay(
                date: key,
                drinks: drinkMap[key] ?? 0,
                nextDayHRV: nextHRV,
                nextDayRHR: nextRHR
            ))
            current = cal.date(byAdding: .day, value: 1, to: current) ?? Date()
        }

        // Weekly summaries
        var weeklyMap: [Date: Double] = [:]
        for day in drinkDays {
            guard let weekStart = cal.dateInterval(of: .weekOfYear, for: day.date)?.start else { continue }
            weeklyMap[weekStart, default: 0] += day.drinks
        }
        let weeks = weeklyMap.map { (date, total) in
            let inWeek = drinkDays.filter { day in
                guard let ws = cal.dateInterval(of: .weekOfYear, for: day.date)?.start else { return false }
                return ws == date && day.drinks > 0
            }.count
            return WeekSummary(weekStart: date, totalDrinks: total, daysWithDrinks: inWeek)
        }.sorted { $0.weekStart < $1.weekStart }

        await MainActor.run {
            days = drinkDays.filter { $0.drinks > 0 || drinkDays.count < 30 }
            weekSummaries = weeks
            isLoading = false
        }
    }

    private func fetchSamples(type: HKQuantityType, pred: NSPredicate, sort: NSSortDescriptor) async -> [HKQuantitySample] {
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred,
                                   limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            healthStore.execute(q)
        }
    }
}

// MARK: - AlcCard

private struct AlcCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color
    let badge: String
    let badgeColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2).bold().foregroundStyle(color)
            Text(unit).font(.caption2).foregroundStyle(.secondary)
            Text(badge)
                .font(.caption2).bold()
                .padding(.horizontal, 6).padding(.vertical, 2)
                .background(badgeColor.opacity(0.15))
                .foregroundStyle(badgeColor)
                .clipShape(Capsule())
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
