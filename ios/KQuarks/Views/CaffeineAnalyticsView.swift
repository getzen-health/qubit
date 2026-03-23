import SwiftUI
import HealthKit
import Charts

// MARK: - CaffeineAnalyticsView
// Analyzes manually-logged caffeine intake (HKQuantityType(.dietaryCaffeine), mg).
// Shows daily intake trend, half-life model (active caffeine at bedtime),
// and correlation with sleep quality. Science: Drake et al. 2013, Spriet 2014.

struct CaffeineAnalyticsView: View {

    // MARK: - Model

    struct DailyIntake: Identifiable {
        let id = UUID()
        let date: Date
        let totalMg: Double
        let lastDoseMg: Double?
        let lastDoseTime: Date?
        // Active caffeine at ~10pm (typical bedtime) using 5.5h half-life
        var activeAtBedtime: Double? {
            guard let time = lastDoseTime else { return nil }
            let bedtime = Calendar.current.date(bySettingHour: 22, minute: 0, second: 0, of: date) ?? date
            let elapsedHours = bedtime.timeIntervalSince(time) / 3600
            guard elapsedHours >= 0, let mg = lastDoseMg else { return nil }
            // Exponential decay: remaining = dose × 0.5^(t/half-life)
            return mg * pow(0.5, elapsedHours / 5.5) + (totalMg - mg) * pow(0.5, max(0, elapsedHours + 4) / 5.5)
        }
    }

    struct CaffeineLog: Identifiable {
        let id = UUID()
        let date: Date
        let mg: Double
    }

    // MARK: - State

    @State private var days: [DailyIntake] = []
    @State private var allLogs: [CaffeineLog] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    private let fdaLimit: Double = 400
    private let performanceMin: Double = 3 // mg/kg, typical 70kg → 210mg
    private let safetyBedtimeLimit: Double = 50 // mg active caffeine at sleep = meaningful disruption

    // MARK: - Computed

    private var avgDaily: Double? {
        guard !days.isEmpty else { return nil }
        return days.map(\.totalMg).reduce(0, +) / Double(days.count)
    }

    private var daysOverLimit: Int {
        days.filter { $0.totalMg > fdaLimit }.count
    }

    private var lateMg: Int {
        let afternoonHour = 14
        return allLogs.filter {
            Calendar.current.component(.hour, from: $0.date) >= afternoonHour
        }.count
    }

    private var hourOfDayDistribution: [(hour: Int, count: Int)] {
        var freq: [Int: Int] = [:]
        for log in allLogs {
            let hr = Calendar.current.component(.hour, from: log.date)
            freq[hr, default: 0] += 1
        }
        return (6..<24).map { (hour: $0, count: freq[$0] ?? 0) }
    }

    private var peakHour: Int? {
        hourOfDayDistribution.max(by: { $0.count < $1.count })?.hour
    }

    private var avgActiveAtBedtime: Double? {
        let vals = days.compactMap(\.activeAtBedtime).filter { $0 > 0 }
        guard !vals.isEmpty else { return nil }
        return vals.reduce(0, +) / Double(vals.count)
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Banner
                infoBanner

                // Summary stats
                summaryCards

                // 30-day trend
                if !days.isEmpty {
                    intakeTrendChart
                }

                // Bedtime caffeine model
                if avgActiveAtBedtime != nil {
                    bedtimeCard
                }

                // Time-of-day distribution
                if !allLogs.isEmpty {
                    hourDistributionChart
                }

                // Science
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Caffeine Analytics")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Loading caffeine data…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var infoBanner: some View {
        VStack(spacing: 6) {
            HStack {
                Text("☕")
                Text("Caffeine Intake Log")
                    .font(.headline)
                Spacer()
                Text("Log in Health app")
                    .font(.caption2)
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(.brown.opacity(0.15))
                    .foregroundStyle(.brown)
                    .clipShape(Capsule())
            }
            Text("Track caffeine via Health app → Nutrition → Caffeine, or apps like Cronometer & MyFitnessPal that sync to Apple Health. Analyzes timing impact on sleep.")
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

            CafCard(title: "Daily Average",
                    value: avgDaily.map { String(format: "%.0f", $0) } ?? "—",
                    unit: "mg",
                    icon: "cup.and.saucer.fill",
                    color: avgDaily.map { $0 > fdaLimit ? .red : $0 > 300 ? .orange : .green } ?? .gray,
                    badge: avgDaily.map { $0 > fdaLimit ? "Over limit" : $0 > 300 ? "Near limit" : "Safe" } ?? "—",
                    badgeColor: avgDaily.map { $0 > fdaLimit ? .red : $0 > 300 ? .orange : .green } ?? .gray)

            CafCard(title: "Days Over 400mg",
                    value: "\(daysOverLimit)",
                    unit: "of \(days.count) days",
                    icon: "exclamationmark.circle.fill",
                    color: daysOverLimit == 0 ? .green : daysOverLimit < 3 ? .yellow : .red,
                    badge: daysOverLimit == 0 ? "None" : "\(daysOverLimit) days",
                    badgeColor: daysOverLimit == 0 ? .green : .red)

            CafCard(title: "Avg at Bedtime",
                    value: avgActiveAtBedtime.map { String(format: "%.0f", $0) } ?? "—",
                    unit: "mg active (10pm)",
                    icon: "moon.fill",
                    color: avgActiveAtBedtime.map { $0 < 30 ? .green : $0 < 80 ? .orange : .red } ?? .gray,
                    badge: avgActiveAtBedtime.map { $0 < 30 ? "Sleep-safe" : $0 < 80 ? "Caution" : "High" } ?? "—",
                    badgeColor: avgActiveAtBedtime.map { $0 < 30 ? .green : $0 < 80 ? .orange : .red } ?? .gray)

            CafCard(title: "Late Doses",
                    value: "\(lateMg)",
                    unit: "logs after 2pm",
                    icon: "clock.badge.exclamationmark.fill",
                    color: lateMg == 0 ? .green : lateMg < 5 ? .yellow : .red,
                    badge: lateMg == 0 ? "Good timing" : "After 2pm",
                    badgeColor: lateMg == 0 ? .green : .orange)
        }
        .padding(.horizontal)
    }

    private var intakeTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Daily Caffeine Intake — 30 Days", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()

            Chart {
                // FDA limit
                RuleMark(y: .value("FDA Limit", fdaLimit))
                    .lineStyle(StrokeStyle(dash: [5]))
                    .foregroundStyle(.red.opacity(0.7))
                    .annotation(position: .trailing) {
                        Text("400mg").font(.caption2).foregroundStyle(.red)
                    }

                // Moderate limit
                RuleMark(y: .value("Moderate", 300))
                    .lineStyle(StrokeStyle(dash: [3]))
                    .foregroundStyle(.orange.opacity(0.5))

                ForEach(days) { day in
                    BarMark(x: .value("Date", day.date, unit: .day),
                            y: .value("mg", day.totalMg))
                        .foregroundStyle(day.totalMg > fdaLimit ? Color.red.gradient :
                                         day.totalMg > 300 ? Color.orange.gradient : Color.brown.gradient)
                        .cornerRadius(2)
                }
            }
            .frame(height: 180)
            .chartXAxis { AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                AxisValueLabel(format: .dateTime.month(.abbreviated).day())
            }}

            HStack {
                Circle().fill(.brown).frame(width: 8, height: 8)
                Text("Safe (<300mg)").font(.caption2)
                Spacer()
                Circle().fill(.orange).frame(width: 8, height: 8)
                Text("Moderate").font(.caption2)
                Spacer()
                Circle().fill(.red).frame(width: 8, height: 8)
                Text("Over limit").font(.caption2)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var bedtimeCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Active Caffeine at Bedtime", systemImage: "moon.zzz.fill")
                .font(.subheadline).bold()

            Text("5.5-hour half-life model: estimated active caffeine at 10pm based on last dose timing.")
                .font(.caption2).foregroundStyle(.secondary)

            if let avg = avgActiveAtBedtime {
                HStack(spacing: 20) {
                    VStack(spacing: 4) {
                        Text(String(format: "%.0f mg", avg))
                            .font(.largeTitle).bold()
                            .foregroundStyle(avg < 30 ? .green : avg < 80 ? .orange : .red)
                        Text("avg active at 10pm")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .leading, spacing: 8) {
                        sleepImpactRow(mg: avg)
                    }
                }

                // Drake (2013) reference bars
                Divider()
                Text("Drake et al. 2013: caffeine 6h before sleep reduces duration by 1h")
                    .font(.caption2).foregroundStyle(.secondary)

                HStack {
                    ForEach([
                        (label: "Negligible", max: 30.0, color: Color.green),
                        (label: "Mild", max: 80.0, color: Color.yellow),
                        (label: "Moderate", max: 150.0, color: Color.orange),
                        (label: "Significant", max: Double.infinity, color: Color.red),
                    ], id: \.label) { tier in
                        VStack(spacing: 2) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(avg < tier.max ? tier.color : tier.color.opacity(0.2))
                                .frame(height: 6)
                            Text(tier.label).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func sleepImpactRow(mg: Double) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            let impacts: [(label: String, met: Bool)] = [
                ("No impact on sleep onset", mg < 30),
                ("Minimal sleep disruption", mg < 80),
                ("≥1h sleep loss (Drake 2013)", mg < 150),
                ("Significant insomnia risk", mg < 50),
            ]
            ForEach(impacts, id: \.label) { item in
                HStack(spacing: 6) {
                    Image(systemName: item.met ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundStyle(item.met ? .green : .red)
                        .font(.caption)
                    Text(item.label).font(.caption2)
                }
            }
        }
    }

    private var hourDistributionChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Time-of-Day Pattern", systemImage: "clock.fill")
                    .font(.subheadline).bold()
                Spacer()
                if let peak = peakHour {
                    Text("Peak: \(peak > 12 ? "\(peak - 12)pm" : peak == 12 ? "12pm" : "\(peak)am")")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            Chart(hourOfDayDistribution, id: \.hour) { item in
                BarMark(x: .value("Hour", item.hour),
                        y: .value("Count", item.count))
                    .foregroundStyle(item.hour >= 14 ? Color.orange.gradient : Color.brown.gradient)
                    .cornerRadius(3)
            }
            .frame(height: 120)
            .chartXAxis {
                AxisMarks(values: [6, 9, 12, 14, 18, 21]) { val in
                    AxisValueLabel {
                        if let h = val.as(Int.self) {
                            Text(h > 12 ? "\(h-12)p" : "\(h)a")
                                .font(.caption2)
                        }
                    }
                }
            }

            HStack {
                Circle().fill(.brown).frame(width: 8, height: 8)
                Text("Before 2pm").font(.caption2)
                Spacer()
                Circle().fill(.orange).frame(width: 8, height: 8)
                Text("After 2pm (sleep impact risk)").font(.caption2)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Caffeine Science", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            scienceItem("Half-life (Nehlig 2010)", detail: "Caffeine's half-life averages 5.5 hours (range: 3-10h, varies with genetics, liver enzymes, medications). Coffee drunk at noon still has ~50% active at 5:30pm.")
            scienceItem("Sleep Impact (Drake et al. 2013)", detail: "200mg caffeine consumed 6 hours before bedtime reduced sleep duration by over 1 hour in controlled study. Even 'no sleep disturbance' reported didn't prevent objective sleep loss.")
            scienceItem("Performance (Spriet 2014)", detail: "3-6 mg/kg caffeine 45-60 min before exercise consistently improves endurance performance by 2-5%. Beneficial effects kick in as low as 1-2 mg/kg.")
            scienceItem("FDA Guideline", detail: "400mg/day is considered safe for healthy adults. Sensitivity varies widely — genetics, tolerance, body mass, and medications all influence response. Start low if sensitive.")
            scienceItem("Optimal Timing", detail: "Delay first caffeine 90-120 min after waking to avoid blunting cortisol awakening response. Cut off caffeine 8-10h before target bedtime for sensitive individuals.")
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
              let cafType = HKQuantityType.quantityType(forIdentifier: .dietaryCaffeine) else {
            isLoading = false; return
        }

        do {
            try await healthStore.requestAuthorization(toShare: [], read: [cafType])
        } catch {
            isLoading = false; return
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -30, to: end) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        let rawSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: cafType, predicate: pred,
                limit: HKObjectQueryNoLimit, sortDescriptors: [sort]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample]) ?? []) }
            healthStore.execute(q)
        }

        let logs = rawSamples.map { s in
            CaffeineLog(date: s.startDate, mg: s.quantity.doubleValue(for: .gramUnit(with: .milli)))
        }

        // Group by day
        var cal = Calendar.current
        cal.timeZone = .current
        var dayMap: [Date: [CaffeineLog]] = [:]
        for log in logs {
            let key = cal.startOfDay(for: log.date)
            dayMap[key, default: []].append(log)
        }

        let dailies = dayMap.map { (date, dayLogs) -> DailyIntake in
            let total = dayLogs.map(\.mg).reduce(0, +)
            let lastLog = dayLogs.max(by: { $0.date < $1.date })
            return DailyIntake(
                date: date,
                totalMg: total,
                lastDoseMg: lastLog?.mg,
                lastDoseTime: lastLog?.date
            )
        }.sorted { $0.date < $1.date }

        await MainActor.run {
            allLogs = logs
            days = dailies
            isLoading = false
        }
    }
}

// MARK: - CafCard

private struct CafCard: View {
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
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
