import SwiftUI
import HealthKit
import Charts

// MARK: - SleepRegularityIndexView
// Computes the Sleep Regularity Index (SRI) — the probability that sleep/wake
// state matches exactly 24 hours apart across 60 nights.
// Science: Phillips et al. 2017 (J Biol Rhythms), Phillips et al. 2021 (Scientific Reports).
// Higher SRI = more regular circadian rhythm.
// SRI <87 in large cohorts associated with 48% higher all-cause mortality risk.

struct SleepRegularityIndexView: View {

    // MARK: - Model

    struct NightData: Identifiable {
        let id = UUID()
        let date: Date
        let sriContribution: Double   // 0–1 match rate vs previous night
    }

    struct WeekBucket: Identifiable {
        let id = UUID()
        let weekStart: Date
        let avgSRI: Double
    }

    // MARK: - State

    @State private var sri: Double?
    @State private var nights: [NightData] = []
    @State private var weekBuckets: [WeekBucket] = []
    @State private var isLoading = true
    @State private var nightCount: Int = 0

    private let healthStore = HKHealthStore()

    // MARK: - Computed

    private var sriClassification: (label: String, color: Color, desc: String) {
        guard let s = sri else { return ("Unknown", .gray, "Not enough data") }
        switch s {
        case 87...:   return ("Regular",    .green,  "Highly consistent sleep/wake pattern")
        case 70..<87: return ("Moderate",   .yellow, "Some day-to-day variability")
        case 50..<70: return ("Irregular",  .orange, "High variability — potential health impact")
        default:      return ("Very Irregular", .red, "Severely disrupted circadian rhythm")
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                sriScoreCard
                if nights.count >= 7 { weeklyTrendCard }
                nightHeatmapCard
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Sleep Regularity")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Analyzing sleep patterns…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var sriScoreCard: some View {
        VStack(spacing: 16) {
            HStack(alignment: .center, spacing: 20) {
                // SRI gauge
                ZStack {
                    Circle()
                        .stroke(Color(.tertiarySystemBackground), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    if let s = sri {
                        Circle()
                            .trim(from: 0, to: CGFloat(s) / 100)
                            .stroke(sriClassification.color.gradient,
                                    style: StrokeStyle(lineWidth: 14, lineCap: .round))
                            .frame(width: 110, height: 110)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.8), value: s)
                        Text(String(format: "%.0f", s))
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(sriClassification.color)
                    } else {
                        Text("—").font(.title).bold().foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Sleep Regularity Index")
                            .font(.headline)
                        Text(sriClassification.label)
                            .font(.subheadline).bold()
                            .foregroundStyle(sriClassification.color)
                        Text(sriClassification.desc)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Text("\(nightCount) nights analyzed")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                Spacer()
            }

            // Reference band
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("0")
                        .font(.caption2).foregroundStyle(.secondary)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            LinearGradient(
                                colors: [.red, .orange, .yellow, .green],
                                startPoint: .leading, endPoint: .trailing
                            )
                            .frame(height: 8)
                            .clipShape(Capsule())

                            if let s = sri {
                                Capsule()
                                    .fill(.white)
                                    .frame(width: 3, height: 14)
                                    .offset(x: geo.size.width * CGFloat(s / 100) - 1.5)
                                    .shadow(radius: 2)
                            }
                        }
                    }
                    .frame(height: 14)
                    Text("100")
                        .font(.caption2).foregroundStyle(.secondary)
                }
                HStack {
                    Spacer()
                    Text("Very Irregular")
                        .font(.caption2).foregroundStyle(.red)
                    Spacer()
                    Text("Moderate")
                        .font(.caption2).foregroundStyle(.yellow)
                    Spacer()
                    Text("Regular")
                        .font(.caption2).foregroundStyle(.green)
                    Spacer()
                }
            }
            .padding(.top, 4)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var weeklyTrendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly SRI Trend", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()

            Chart(weekBuckets) { bucket in
                LineMark(
                    x: .value("Week", bucket.weekStart),
                    y: .value("SRI", bucket.avgSRI)
                )
                .foregroundStyle(Color.indigo.gradient)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Week", bucket.weekStart),
                    y: .value("SRI", bucket.avgSRI)
                )
                .foregroundStyle(Color.indigo.opacity(0.1))

                // Target line at 87
                RuleMark(y: .value("Target", 87))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .annotation(position: .top, alignment: .leading) {
                        Text("Regular ≥87")
                            .font(.caption2)
                            .foregroundStyle(.green)
                    }
            }
            .frame(height: 140)
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYScale(domain: max(0, (weekBuckets.map(\.avgSRI).min() ?? 40) - 5)...100)
            .chartYAxis {
                AxisMarks(values: [40, 60, 80, 100]) { v in
                    AxisValueLabel { Text("\(Int(v.as(Double.self) ?? 0))") }
                    AxisGridLine()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var nightHeatmapCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Night-to-Night Match Rate", systemImage: "calendar.badge.clock")
                .font(.subheadline).bold()
            Text("Probability that sleep/wake status at each hour matches the same hour 24 hours earlier.")
                .font(.caption2)
                .foregroundStyle(.secondary)

            let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(nights.suffix(42)) { night in
                    let pct = night.sriContribution
                    let color: Color = pct >= 0.87 ? .green : pct >= 0.70 ? .yellow : pct >= 0.50 ? .orange : .red
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color.opacity(0.7))
                        .frame(height: 28)
                        .overlay(
                            Text(night.date.formatted(.dateTime.day()))
                                .font(.system(size: 9))
                                .foregroundStyle(.white)
                        )
                }
            }

            HStack(spacing: 10) {
                ForEach([
                    ("≥87 Regular", Color.green),
                    ("70-87 Mod", Color.yellow),
                    ("50-70 Irreg", Color.orange),
                    ("<50 V.Irreg", Color.red)
                ], id: \.0) { label, color in
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2).fill(color.opacity(0.7)).frame(width: 10, height: 10)
                        Text(label).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Science", systemImage: "book.closed.fill")
                .font(.subheadline).bold()
            scienceItem("Sleep Regularity Index (Phillips et al. 2017)", detail: "The SRI measures the probability that sleep/wake state at time T matches the state at time T+24h. Computed across pairs of consecutive days and expressed 0–100. A score of 100 means perfectly identical sleep/wake timing every day.")
            scienceItem("Mortality Risk (Phillips et al. 2021)", detail: "In 60,000+ UK Biobank participants, those with the lowest SRI quartile had 48% higher all-cause mortality risk. Effect was independent of sleep duration — timing consistency matters as much as sleep length.")
            scienceItem("SRI vs Traditional Metrics", detail: "Unlike standard deviation of bedtime (used in social jet lag research), SRI captures regularity of the entire 24-hour sleep/wake profile, including napping and fragmented sleep.")
            scienceItem("Improving Your SRI", detail: "Wake at the same time every day (including weekends). Avoid long naps. Limit alcohol near bedtime. Morning light exposure anchors your circadian clock — 10 min of bright light within 1 hour of wake time.")
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

    // MARK: - Data Loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable(),
              let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            await MainActor.run { isLoading = false }
            return
        }

        do {
            try await healthStore.requestAuthorization(toShare: [], read: [sleepType])
        } catch {
            await MainActor.run { isLoading = false }
            return
        }

        // Fetch 61 days of sleep to have 60 pairs
        let since = Calendar.current.date(byAdding: .day, value: -61, to: Date()) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: since, end: Date())
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: sleepType, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKCategorySample]) ?? [])
            }
            healthStore.execute(q)
        }

        // Filter to actual sleep (not inBed) — iOS 16+ stages or asleepUnspecified
        let sleepSamples = samples.filter { s in
            switch HKCategoryValueSleepAnalysis(rawValue: s.value) {
            case .asleepCore, .asleepDeep, .asleepREM, .asleepUnspecified: return true
            default: return false
            }
        }

        // Build minute-resolution sleep map per day
        // Key: days since reference. Value: set of minutes (0..<1440) that are sleep
        let calendar = Calendar.current
        let refDate = calendar.startOfDay(for: since)

        var sleepMinutesByDay: [Int: Set<Int>] = [:]

        for sample in sleepSamples {
            let startDay = calendar.dateComponents([.day], from: refDate, to: sample.startDate).day ?? 0
            let endDay   = calendar.dateComponents([.day], from: refDate, to: sample.endDate).day ?? 0

            for day in startDay...max(startDay, endDay) {
                let dayStart = calendar.date(byAdding: .day, value: day, to: refDate) ?? refDate
                let dayEnd   = calendar.date(byAdding: .day, value: day + 1, to: refDate) ?? refDate

                let overlapStart = max(sample.startDate, dayStart)
                let overlapEnd   = min(sample.endDate, dayEnd)
                guard overlapStart < overlapEnd else { continue }

                let startMin = Int(overlapStart.timeIntervalSince(dayStart) / 60)
                let endMin   = Int(overlapEnd.timeIntervalSince(dayStart) / 60)
                for m in max(0, startMin)..<min(1440, endMin) {
                    sleepMinutesByDay[day, default: []].insert(m)
                }
            }
        }

        let allDays = sleepMinutesByDay.keys.sorted()
        guard allDays.count >= 2 else {
            await MainActor.run { isLoading = false }
            return
        }

        // Compute SRI for each consecutive day pair
        var nightData: [NightData] = []
        for i in 1..<allDays.count {
            let prevDay = allDays[i - 1]
            let curDay  = allDays[i]
            guard curDay == prevDay + 1 else { continue }  // skip non-consecutive

            let prev = sleepMinutesByDay[prevDay] ?? []
            let cur  = sleepMinutesByDay[curDay]  ?? []

            // SRI contribution = fraction of 1440 minutes with matching state
            var matches = 0
            for m in 0..<1440 {
                let prevAsleep = prev.contains(m)
                let curAsleep  = cur.contains(m)
                if prevAsleep == curAsleep { matches += 1 }
            }
            let matchRate = Double(matches) / 1440.0

            let dayDate = calendar.date(byAdding: .day, value: curDay, to: refDate) ?? refDate
            nightData.append(NightData(date: dayDate, sriContribution: matchRate))
        }

        let overallSRI = nightData.isEmpty ? nil : nightData.map(\.sriContribution).reduce(0,+) / Double(nightData.count) * 100

        // Build weekly buckets
        var weekMap: [Date: [Double]] = [:]
        for n in nightData {
            let weekStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: n.date)) ?? n.date
            weekMap[weekStart, default: []].append(n.sriContribution * 100)
        }
        let buckets = weekMap.sorted { $0.key < $1.key }.map { k, v in
            WeekBucket(weekStart: k, avgSRI: v.reduce(0,+) / Double(v.count))
        }

        await MainActor.run {
            sri = overallSRI
            nights = nightData
            weekBuckets = buckets
            nightCount = nightData.count
            isLoading = false
        }
    }
}
