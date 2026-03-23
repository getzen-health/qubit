import SwiftUI
import HealthKit
import Charts

// MARK: - SocialJetLagView
// Computes Social Jet Lag (SJL) — the discrepancy between biological and social clocks.
// SJL = |MSFsc − MSW| where MSF = midpoint of sleep on free days (corrected for duration),
// MSW = midpoint of sleep on work days.
// Science: Roenneberg et al. 2012 (Current Biology): each hour SJL = 33% higher obesity risk,
// Rutters 2014 (Chronobiology Int.), Wong 2015 (Nutr. Metab. Cardiovasc. Dis.).
// Distinct from SleepConsistencyView (timing SD) and SleepChronotypeView (chronotype).

struct SocialJetLagView: View {

    // MARK: - Model

    struct SleepMidpoint: Identifiable {
        let id = UUID()
        let date: Date
        let midpointHour: Double    // 0-24 (e.g., 3.5 = 3:30 AM)
        let durationHours: Double
        let isWeekend: Bool
    }

    struct DowPoint: Identifiable {
        let id = UUID()
        let dayLabel: String
        let avgMidpointHour: Double
        let count: Int
    }

    enum SJLSeverity {
        case minimal, mild, moderate, severe
        var label: String {
            switch self {
            case .minimal:  return "Minimal"
            case .mild:     return "Mild"
            case .moderate: return "Moderate"
            case .severe:   return "Severe"
            }
        }
        var color: Color {
            switch self {
            case .minimal:  return .green
            case .mild:     return .yellow
            case .moderate: return .orange
            case .severe:   return .red
            }
        }
        var detail: String {
            switch self {
            case .minimal:  return "Excellent alignment between biological and social clock."
            case .mild:     return "Minor mismatch — typical for modern lifestyles. Low metabolic impact."
            case .moderate: return "1-2 hours mismatch. Associated with 30-50% higher obesity risk."
            case .severe:   return ">2 hours mismatch. Significantly disrupted circadian alignment."
            }
        }
    }

    // MARK: - State

    @State private var sjl: Double?           // hours
    @State private var msw: Double?           // midpoint of sleep on work days (hr since midnight)
    @State private var msf: Double?           // midpoint of sleep on free days (corrected)
    @State private var avgWeekdaySleep: Double = 0
    @State private var avgWeekendSleep: Double = 0
    @State private var dowPoints: [DowPoint] = []
    @State private var recentNights: [SleepMidpoint] = []
    @State private var severity: SJLSeverity = .minimal
    @State private var nightCount: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                sjlCard
                sleepTimingCard
                dowChartCard
                comparisonCard
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Social Jet Lag")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Computing sleep timing…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var sjlCard: some View {
        VStack(spacing: 16) {
            HStack(alignment: .center, spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(Color(.tertiarySystemBackground), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    if let s = sjl {
                        Circle()
                            .trim(from: 0, to: CGFloat(min(s, 4)) / 4.0)
                            .stroke(severity.color.gradient,
                                    style: StrokeStyle(lineWidth: 14, lineCap: .round))
                            .frame(width: 110, height: 110)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.8), value: s)
                        VStack(spacing: 2) {
                            Text(String(format: "%.1f", s))
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundStyle(severity.color)
                            Text("hrs SJL").font(.caption2).foregroundStyle(.secondary)
                        }
                    } else {
                        Text("—").font(.title).bold().foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Social Jet Lag").font(.headline)
                        Text(severity.label)
                            .font(.subheadline).bold()
                            .foregroundStyle(severity.color)
                        Text(severity.detail)
                            .font(.caption).foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Text("\(nightCount) nights analyzed (90 days)")
                        .font(.caption2).foregroundStyle(.tertiary)
                }
                Spacer()
            }

            // SJL classification bar
            HStack(spacing: 0) {
                ForEach(["Minimal\n<0.5h", "Mild\n0.5-1h", "Moderate\n1-2h", "Severe\n>2h"], id: \.self) { label in
                    let idx = ["Minimal\n<0.5h", "Mild\n0.5-1h", "Moderate\n1-2h", "Severe\n>2h"].firstIndex(of: label) ?? 0
                    let colors: [Color] = [.green, .yellow, .orange, .red]
                    let levels: [SJLSeverity] = [.minimal, .mild, .moderate, .severe]
                    VStack(spacing: 4) {
                        Rectangle()
                            .fill(colors[idx].opacity(severity == levels[idx] ? 1.0 : 0.2))
                            .frame(height: 8)
                        Text(label)
                            .font(.system(size: 9))
                            .foregroundStyle(severity == levels[idx] ? colors[idx] : .secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var sleepTimingCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Sleep Midpoints", systemImage: "moon.stars.fill")
                .font(.subheadline).bold()

            HStack(spacing: 16) {
                timingStatBox(title: "Weekday Midpoint (MSW)", hour: msw, color: .blue,
                              duration: avgWeekdaySleep, note: "Mon–Fri")
                timingStatBox(title: "Weekend Midpoint (MSFsc)", hour: msf, color: .purple,
                              duration: avgWeekendSleep, note: "Sat–Sun")
            }

            if let s = sjl {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.left.and.right")
                        .foregroundStyle(.secondary)
                    Text("SJL = |\(formatHour(msf ?? 0)) − \(formatHour(msw ?? 0))| = \(String(format: "%.1f", s)) hours")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func timingStatBox(title: String, hour: Double?, color: Color, duration: Double, note: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption2).foregroundStyle(.secondary)
            Text(hour.map { formatHour($0) } ?? "—")
                .font(.title2).bold()
                .foregroundStyle(color)
            HStack(spacing: 4) {
                Image(systemName: "moon.fill").font(.caption2).foregroundStyle(color)
                Text(note).font(.caption2).foregroundStyle(.secondary)
            }
            if duration > 0 {
                Text(String(format: "%.1f hrs avg sleep", duration))
                    .font(.caption2).foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private var dowChartCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Sleep Midpoint by Day of Week", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Average sleep midpoint hour for each day. Weekend shift = social jet lag.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(dowPoints) { pt in
                BarMark(x: .value("Day", pt.dayLabel),
                        y: .value("Hour", pt.avgMidpointHour))
                    .foregroundStyle(["Sat", "Sun"].contains(pt.dayLabel) ? Color.purple.gradient : Color.blue.gradient)
                    .annotation(position: .top) {
                        Text(formatHour(pt.avgMidpointHour))
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                    }
            }
            .frame(height: 160)
            .chartYAxis {
                AxisMarks(values: [0, 1, 2, 3, 4, 5]) { v in
                    AxisValueLabel { Text(formatHour(v.as(Double.self) ?? 0)).font(.caption2) }
                    AxisGridLine()
                }
            }
            .chartYScale(domain: 0...6)

            HStack(spacing: 12) {
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.blue.opacity(0.7)).frame(width: 10, height: 10)
                    Text("Weekday").font(.caption2).foregroundStyle(.secondary)
                }
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.purple.opacity(0.7)).frame(width: 10, height: 10)
                    Text("Weekend").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var comparisonCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("How to Reduce Social Jet Lag", systemImage: "lightbulb.fill")
                .font(.subheadline).bold()
            VStack(alignment: .leading, spacing: 8) {
                tipRow("alarm.fill", "Same wake time", "Wake at the same time every day — including weekends. This is the most powerful SJL reducer.")
                tipRow("sun.horizon.fill", "Morning light first", "Get 10+ minutes of bright light within 1 hour of waking. Anchors your circadian clock.")
                tipRow("moon.fill", "Avoid late bedtimes", "Gradually shift weekend bedtime earlier — aim for <30 min difference from weekday.")
                tipRow("bed.double.fill", "No 'social napping'", "Sleeping in on weekends to compensate causes social jet lag. Better to go to bed 30 min earlier.")
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func tipRow(_ icon: String, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).foregroundStyle(.blue).frame(width: 20)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption).bold()
                Text(detail).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Science", systemImage: "book.closed.fill")
                .font(.subheadline).bold()
            scienceItem("Roenneberg et al. 2012 (Current Biology)", detail: "In 65,000+ people, each additional hour of social jet lag was associated with 33% higher odds of being overweight or obese, after controlling for sleep duration and physical activity.")
            scienceItem("MSFsc Calculation", detail: "MSFsc = MSF − 0.5 × (SD_free − SD_work), where SD = sleep duration. The correction adjusts for sleep debt repayment on weekends, isolating pure circadian misalignment from sleep duration effects.")
            scienceItem("Health Consequences", detail: "Social jet lag ≥2 hours associated with higher CRP (inflammation), insulin resistance (Rutters 2014), depression risk (Levandovski 2011), poor academic and work performance, and 11% higher likelihood of heart disease (Wong 2015).")
            scienceItem("Chronotype vs Social Jet Lag", detail: "Chronotype (early bird vs night owl) is your natural circadian phase — largely genetic (Duffy 2011). SJL measures the mismatch between that natural phase and the timing forced by social obligations. Evening types suffer most.")
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

    // MARK: - Helpers

    private func formatHour(_ h: Double) -> String {
        // Convert decimal hour to AM/PM string
        let hrs = Int(h) % 24
        let mins = Int((h - Double(Int(h))) * 60)
        let period = hrs < 12 ? "AM" : "PM"
        let displayHr = hrs == 0 ? 12 : hrs > 12 ? hrs - 12 : hrs
        return String(format: "%d:%02d %@", displayHr, mins, period)
    }

    // MARK: - Data Loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable(),
              let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            await MainActor.run { isLoading = false }; return
        }
        do { try await healthStore.requestAuthorization(toShare: [], read: [sleepType]) }
        catch { await MainActor.run { isLoading = false }; return }

        let since90 = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: since90, end: Date())
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: sleepType, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKCategorySample]) ?? [])
            }
            healthStore.execute(q)
        }

        // Filter to actual sleep stages
        let sleepSamples = samples.filter { s in
            switch HKCategoryValueSleepAnalysis(rawValue: s.value) {
            case .asleepCore, .asleepDeep, .asleepREM, .asleepUnspecified: return true
            default: return false
            }
        }

        let cal = Calendar.current
        // Group samples by "night" (use startDate's day or previous day if before 6am)
        var nightMap: [Date: (start: Date, end: Date)] = [:]
        for s in sleepSamples {
            let startHour = cal.component(.hour, from: s.startDate)
            // If starting before 6am, assign to previous day's night
            let nightDate: Date
            if startHour < 6 {
                nightDate = cal.startOfDay(for: cal.date(byAdding: .day, value: -1, to: s.startDate) ?? s.startDate)
            } else {
                nightDate = cal.startOfDay(for: s.startDate)
            }
            if let existing = nightMap[nightDate] {
                nightMap[nightDate] = (
                    start: min(existing.start, s.startDate),
                    end: max(existing.end, s.endDate)
                )
            } else {
                nightMap[nightDate] = (start: s.startDate, end: s.endDate)
            }
        }

        var midpoints: [SleepMidpoint] = []
        for (nightDate, period) in nightMap {
            let duration = period.end.timeIntervalSince(period.start) / 3600
            guard duration > 2 else { continue }  // skip implausible nights
            let midTime = period.start.addingTimeInterval(period.end.timeIntervalSince(period.start) / 2)
            let midHour = cal.component(.hour, from: midTime)
            let midMin  = cal.component(.minute, from: midTime)
            var midHourDecimal = Double(midHour) + Double(midMin) / 60
            // Normalize: midnight = 24 for sorting (e.g., 1.5am → 25.5)
            if midHourDecimal < 6 { midHourDecimal += 24 }

            let weekday = cal.component(.weekday, from: nightDate)
            // Use only Sat (7) and Sun (1) as "free days" for MSFsc
            let isTrulyFreeDay = weekday == 1 || weekday == 7

            midpoints.append(SleepMidpoint(date: nightDate, midpointHour: midHourDecimal - 24,
                                           durationHours: duration, isWeekend: isTrulyFreeDay))
        }

        let weekdayMidpoints = midpoints.filter { !$0.isWeekend }
        let weekendMidpoints = midpoints.filter { $0.isWeekend }

        func avg(_ pts: [SleepMidpoint], key: KeyPath<SleepMidpoint, Double>) -> Double? {
            pts.isEmpty ? nil : pts.map { $0[keyPath: key] }.reduce(0,+) / Double(pts.count)
        }

        let mswVal = avg(weekdayMidpoints, key: \.midpointHour)
        let sdFreeAvg = avg(weekendMidpoints, key: \.durationHours) ?? 0
        let sdWorkAvg = avg(weekdayMidpoints, key: \.durationHours) ?? 0
        let msfRaw = avg(weekendMidpoints, key: \.midpointHour)

        // MSFsc correction: MSF - 0.5*(SD_free - SD_work)
        var msfsc: Double? = nil
        if let msfR = msfRaw {
            msfsc = msfR - 0.5 * (sdFreeAvg - sdWorkAvg)
        }

        let sjlVal = mswVal.flatMap { w in msfsc.map { f in abs(f - w) } }

        let sev: SJLSeverity
        if let s = sjlVal {
            sev = s < 0.5 ? .minimal : s < 1.0 ? .mild : s < 2.0 ? .moderate : .severe
        } else {
            sev = .minimal
        }

        // Day-of-week chart
        let dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        var dowMap: [Int: [Double]] = [:]  // 1=Sun, 2=Mon, ..., 7=Sat → normalize to 0=Mon
        for mp in midpoints {
            let wd = cal.component(.weekday, from: mp.date)  // 1=Sun
            let idx = (wd + 5) % 7  // Mon=0..Sun=6
            dowMap[idx, default: []].append(mp.midpointHour)
        }
        var dows: [DowPoint] = []
        for (i, label) in dayLabels.enumerated() {
            let vals = dowMap[i] ?? []
            if !vals.isEmpty {
                let avg = vals.reduce(0,+) / Double(vals.count)
                // Normalize to 0-6 for chart (actual hours around midnight)
                let normalizedAvg = max(0, min(6, avg + (avg < 0 ? 24 : 0)))
                dows.append(DowPoint(dayLabel: label, avgMidpointHour: normalizedAvg, count: vals.count))
            }
        }

        await MainActor.run {
            sjl = sjlVal
            msw = mswVal
            msf = msfsc
            avgWeekdaySleep = sdWorkAvg
            avgWeekendSleep = sdFreeAvg
            severity = sev
            dowPoints = dows
            recentNights = midpoints.sorted { $0.date < $1.date }
            nightCount = midpoints.count
            isLoading = false
        }
    }
}
