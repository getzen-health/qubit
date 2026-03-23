import SwiftUI
import Charts
import HealthKit

// MARK: - SleepChronotypeView
/// Classifies the user's chronotype (Early/Intermediate/Late) based on sleep midpoint
/// and quantifies Social Jet Lag — the shift between weekday and weekend sleep timing.
struct SleepChronotypeView: View {
    @State private var nights: [NightPoint] = []
    @State private var isLoading = false

    private let healthStore = HKHealthStore()

    // MARK: - Model

    struct NightPoint: Identifiable {
        let id = UUID()
        let date: Date
        let midpoint: Double   // fractional hours 0–24
        let durationHours: Double
        let isWeekend: Bool
        let weekday: Int       // 1=Sun, 2=Mon, ..., 7=Sat (Calendar.component)

        var midpointLabel: String { fmtHour(midpoint) }

        private func fmtHour(_ h: Double) -> String {
            let total = h.truncatingRemainder(dividingBy: 24)
            let hh = Int(total)
            let mm = Int((total - Double(hh)) * 60)
            let period = hh < 12 ? "am" : "pm"
            let h12 = hh == 0 ? 12 : hh > 12 ? hh - 12 : hh
            return "\(h12):\(String(format: "%02d", mm)) \(period)"
        }
    }

    // MARK: - Computed

    private var weekdayNights: [NightPoint] { nights.filter { !$0.isWeekend } }
    private var weekendNights: [NightPoint] { nights.filter { $0.isWeekend } }

    private var weekdayMid: Double? {
        let w = weekdayNights.map(\.midpoint)
        return w.isEmpty ? nil : w.reduce(0, +) / Double(w.count)
    }

    private var weekendMid: Double? {
        let w = weekendNights.map(\.midpoint)
        return w.isEmpty ? nil : w.reduce(0, +) / Double(w.count)
    }

    private var socialJetLag: Double? {
        guard let wd = weekdayMid, let we = weekendMid else { return nil }
        return abs(we - wd)
    }

    private var chronotype: Chronotype {
        guard let mid = weekdayMid else { return .unknown }
        if mid <= 2 || mid >= 22 { return .early }
        if mid <= 4 { return .intermediate }
        return .late
    }

    enum Chronotype {
        case early, intermediate, late, unknown

        var emoji: String {
            switch self {
            case .early: return "🐦"
            case .intermediate: return "🦅"
            case .late: return "🦉"
            case .unknown: return "❓"
            }
        }

        var label: String {
            switch self {
            case .early: return "Early Bird"
            case .intermediate: return "Intermediate"
            case .late: return "Night Owl"
            case .unknown: return "Unknown"
            }
        }

        var color: Color {
            switch self {
            case .early: return .yellow
            case .intermediate: return .blue
            case .late: return .purple
            case .unknown: return .secondary
            }
        }

        var optimal: String {
            switch self {
            case .early: return "Aim for 10–11 pm bedtime and 6–7 am wake to match your biology."
            case .intermediate: return "Aim for 11 pm–12 am bedtime and 7–8 am wake time."
            case .late: return "Aim for 12–1 am bedtime and 8–9 am wake time if your schedule allows."
            case .unknown: return "Log more sleep data to determine your chronotype."
            }
        }
    }

    // By-weekday averages (1=Sun … 7=Sat in Calendar)
    private var byWeekday: [(label: String, avg: Double?, isWeekend: Bool)] {
        let labels = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return (1...7).map { d in
            let pts = nights.filter { $0.weekday == d }.map(\.midpoint)
            let avg = pts.isEmpty ? nil : pts.reduce(0, +) / Double(pts.count)
            return (label: labels[d], avg: avg, isWeekend: d == 1 || d == 7)
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if nights.count < 5 {
                    emptyState
                } else {
                    chronotypeCard
                    summaryCards
                    if let sjl = socialJetLag { socialJetLagBanner(sjl: sjl) }
                    midpointChart
                    weekdayCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Chronotype")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Chronotype Card

    private var chronotypeCard: some View {
        let ct = chronotype
        return VStack(spacing: 12) {
            HStack(alignment: .top, spacing: 16) {
                Text(ct.emoji)
                    .font(.system(size: 44))
                VStack(alignment: .leading, spacing: 6) {
                    Text(ct.label)
                        .font(.title2.bold())
                        .foregroundStyle(ct.color)
                    Text("Based on your weekday sleep midpoint")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            if ct != .unknown {
                HStack(spacing: 8) {
                    Image(systemName: "lightbulb.fill")
                        .foregroundStyle(.yellow)
                        .font(.caption)
                    Text(ct.optimal)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(10)
                .background(Color.yellow.opacity(0.06))
                .cornerRadius(10)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        let sjl = socialJetLag
        let sjlLabel: String = sjl.map { h in
            let hi = Int(h); let mi = Int((h - Double(hi)) * 60)
            return hi > 0 ? "\(hi)h \(mi)m" : "\(mi)m"
        } ?? "—"
        let sjlColor: Color = sjl.map { $0 < 0.5 ? .green : $0 < 1.5 ? .yellow : .red } ?? .secondary

        return LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
            ChronoCard(value: weekdayMid.map { midLabel($0) } ?? "—", label: "Weekday Midpoint", sub: "Mon–Fri avg", color: .blue)
            ChronoCard(value: weekendMid.map { midLabel($0) } ?? "—", label: "Weekend Midpoint", sub: "Sat–Sun avg", color: .indigo)
            ChronoCard(value: sjlLabel, label: "Social Jet Lag", sub: "weekday vs weekend", color: sjlColor)
            ChronoCard(value: "\(nights.count) nights", label: "Nights Analyzed", sub: "last 90 days", color: .secondary)
        }
    }

    private func midLabel(_ h: Double) -> String {
        let total = h.truncatingRemainder(dividingBy: 24)
        let hh = Int(total)
        let mm = Int((total - Double(hh)) * 60)
        let period = hh < 12 ? "am" : "pm"
        let h12 = hh == 0 ? 12 : hh > 12 ? hh - 12 : hh
        return "\(h12):\(String(format: "%02d", mm)) \(period)"
    }

    // MARK: - Social Jet Lag Banner

    @ViewBuilder
    private func socialJetLagBanner(sjl: Double) -> some View {
        let severity = sjl < 0.5 ? "Low" : sjl < 1.5 ? "Moderate" : "High"
        let color: Color = sjl < 0.5 ? .green : sjl < 1.5 ? .yellow : .red
        let icon = sjl < 0.5 ? "checkmark.circle.fill" : sjl < 1.5 ? "exclamationmark.triangle.fill" : "xmark.circle.fill"
        let message: String = sjl < 0.5
            ? "Your weekday and weekend sleep are well-aligned. Minimal circadian disruption."
            : sjl < 1.5
                ? "You sleep later on weekends — like flying 1–1.5 time zones each week. Affects energy and metabolism."
                : "High social jet lag is linked to fatigue, metabolic risk, and mood issues. Align your sleep schedule across all days."

        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            VStack(alignment: .leading, spacing: 4) {
                Text("Social Jet Lag: \(severity)")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(color)
                Text(message)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(color.opacity(0.08))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(color.opacity(0.2)))
        .cornerRadius(14)
    }

    // MARK: - Midpoint Chart

    private var midpointChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sleep Midpoint Over Time")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Chart(nights) { n in
                PointMark(
                    x: .value("Date", n.date),
                    y: .value("Midpoint", n.midpoint)
                )
                .foregroundStyle(n.isWeekend ? Color.indigo.opacity(0.7) : Color.blue.opacity(0.7))
                .symbolSize(20)
            }
            .chartYAxis {
                AxisMarks(values: [0, 1, 2, 3, 4, 5, 6]) { val in
                    AxisGridLine()
                    AxisValueLabel { if let h = val.as(Double.self) { Text(midLabel(h)).font(.caption2) } }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 21)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    AxisTick()
                }
            }
            .frame(height: 180)

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    Circle().fill(Color.blue.opacity(0.7)).frame(width: 8, height: 8)
                    Text("Weekday").font(.caption2).foregroundStyle(.secondary)
                }
                HStack(spacing: 4) {
                    Circle().fill(Color.indigo.opacity(0.7)).frame(width: 8, height: 8)
                    Text("Weekend").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Day of Week Card

    private var weekdayCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Average Midpoint by Day")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            ForEach(byWeekday, id: \.label) { entry in
                if let avg = entry.avg {
                    HStack {
                        Text(entry.label)
                            .font(.caption.weight(.medium))
                            .foregroundStyle(entry.isWeekend ? .indigo : .secondary)
                            .frame(width: 32, alignment: .leading)
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(entry.isWeekend ? Color.indigo.opacity(0.5) : Color.blue.opacity(0.5))
                                .frame(width: geo.size.width * CGFloat(min(avg / 6.0, 1.0)), height: 14)
                        }
                        .frame(height: 14)
                        Text(midLabel(avg))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .frame(width: 72, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Info

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("About Chronotype & Social Jet Lag")
                .font(.subheadline.weight(.semibold))
            Text("Your chronotype is your biological clock's natural preference — largely genetic, shifting later in teens and earlier in older adults. Sleep Midpoint (halfway between sleep onset and wake) is a robust chronotype marker less distorted by social schedules.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Social Jet Lag is the difference between your weekday and weekend sleep midpoints. Even 1 hour of SJL has measurable metabolic and mood effects — try to keep your schedule consistent across all days.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 2)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("🦉").font(.system(size: 44))
            Text("Not enough sleep data")
                .font(.headline)
            Text("Log at least 5 full nights of sleep to see your chronotype.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!

        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\HKCategorySample.startDate)]
        )

        do {
            let samples = try await descriptor.result(for: HKHealthStore())
            // Filter to actual sleep stages (not inBed)
            let sleepSamples = samples.filter { s in
                guard let v = HKCategoryValueSleepAnalysis(rawValue: s.value) else { return false }
                return v == .asleepUnspecified || v == .asleepCore || v == .asleepDeep || v == .asleepREM
            }

            // Group into nights by calendar day of the START of the session
            // A "night" starts in the evening (after 6pm of previous day) and ends in the morning
            let cal = Calendar.current
            var nightGroups: [String: (start: Date, end: Date)] = [:]

            for sample in sleepSamples {
                // Use the "night key" = date string of the morning wake day
                let wakeDate = sample.endDate
                let wakeCal = cal.dateComponents([.year, .month, .day], from: wakeDate)
                let key = "\(wakeCal.year!)-\(String(format: "%02d", wakeCal.month!))-\(String(format: "%02d", wakeCal.day!))"

                if let existing = nightGroups[key] {
                    nightGroups[key] = (
                        start: min(existing.start, sample.startDate),
                        end: max(existing.end, sample.endDate)
                    )
                } else {
                    nightGroups[key] = (start: sample.startDate, end: sample.endDate)
                }
            }

            let computed: [NightPoint] = nightGroups.compactMap { (key, session) -> NightPoint? in
                let duration = session.end.timeIntervalSince(session.start) / 3600
                guard duration >= 2 else { return nil }  // exclude naps

                let midDate = Date(timeInterval: session.end.timeIntervalSince(session.start) / 2, since: session.start)
                let midHour = Double(cal.component(.hour, from: midDate)) + Double(cal.component(.minute, from: midDate)) / 60

                let weekday = cal.component(.weekday, from: session.start)  // 1=Sun
                let isWeekend = weekday == 1 || weekday == 7

                return NightPoint(
                    date: session.start,
                    midpoint: midHour,
                    durationHours: duration,
                    isWeekend: isWeekend,
                    weekday: weekday
                )
            }.sorted { $0.date < $1.date }

            await MainActor.run { nights = computed }
        } catch {
            // HealthKit not available
        }
    }
}

// MARK: - Supporting view

struct ChronoCard: View {
    let value: String
    let label: String
    let sub: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold())
                .foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(label)
                .font(.caption.weight(.medium))
                .multilineTextAlignment(.center)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack { SleepChronotypeView() }
}
