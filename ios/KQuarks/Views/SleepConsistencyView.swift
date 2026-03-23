import SwiftUI
import Charts
import HealthKit

// MARK: - SleepConsistencyView

/// Tracks bedtime and wake-time consistency over the last 14 nights.
/// Regular sleep timing is as important as duration for circadian health.
struct SleepConsistencyView: View {
    @State private var nights: [ConsSleepNight] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct ConsSleepNight: Identifiable {
        let id = UUID()
        let date: Date          // wake date
        let bedtime: Date       // when sleep started
        let wakeTime: Date      // when sleep ended
        let totalMinutes: Int

        var bedtimeMinutesSinceMidnight: Double {
            let cal = Calendar.current
            let h = cal.component(.hour, from: bedtime)
            let m = cal.component(.minute, from: bedtime)
            // Normalize: treat anything before 6am as "late night" (add 24h if < 6am)
            let mins = Double(h * 60 + m)
            return mins < 6 * 60 ? mins + 24 * 60 : mins
        }

        var wakeMinutesSinceMidnight: Double {
            let cal = Calendar.current
            let h = cal.component(.hour, from: wakeTime)
            let m = cal.component(.minute, from: wakeTime)
            return Double(h * 60 + m)
        }
    }

    private var consistencyScore: Int {
        guard nights.count >= 5 else { return 0 }
        let bedtimes = nights.map(\.bedtimeMinutesSinceMidnight)
        let waketimes = nights.map(\.wakeMinutesSinceMidnight)
        let bedSD = standardDeviation(bedtimes)
        let wakeSD = standardDeviation(waketimes)

        // Score: 100 points if SD < 15 min, 0 points at SD >= 90 min
        let bedScore = max(0, min(100, Int((90 - bedSD) / 75 * 100)))
        let wakeScore = max(0, min(100, Int((90 - wakeSD) / 75 * 100)))
        return (bedScore + wakeScore) / 2
    }

    private var avgBedtimeFormatted: String? {
        guard !nights.isEmpty else { return nil }
        let avgMins = nights.map(\.bedtimeMinutesSinceMidnight).reduce(0, +) / Double(nights.count)
        return formatMinutes(avgMins)
    }

    private var avgWakeFormatted: String? {
        guard !nights.isEmpty else { return nil }
        let avgMins = nights.map(\.wakeMinutesSinceMidnight).reduce(0, +) / Double(nights.count)
        return formatMinutes(avgMins)
    }

    private var bedtimeSD: Double {
        standardDeviation(nights.map(\.bedtimeMinutesSinceMidnight))
    }

    private var wakeSD: Double {
        standardDeviation(nights.map(\.wakeMinutesSinceMidnight))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if nights.count < 3 {
                    emptyState
                } else {
                    scoreCard
                    timingChart
                    statsCard
                    adviceCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Sleep Consistency")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Score Card

    private var scoreCard: some View {
        let zone = ConsistencyZone.from(score: consistencyScore)
        return VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Consistency Score")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(consistencyScore)")
                        .font(.system(size: 56, weight: .bold, design: .rounded))
                        .foregroundStyle(zone.color)
                    Text(zone.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(zone.color)
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(Color(.systemFill), lineWidth: 10)
                        .frame(width: 80, height: 80)
                    Circle()
                        .trim(from: 0, to: CGFloat(consistencyScore) / 100)
                        .stroke(zone.color, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.6), value: consistencyScore)
                    Image(systemName: "moon.stars.fill")
                        .font(.title3)
                        .foregroundStyle(zone.color)
                }
            }

            HStack(spacing: 12) {
                if let bed = avgBedtimeFormatted {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Typical bedtime")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text(bed)
                            .font(.subheadline.bold())
                    }
                }
                if nights.count >= 5 {
                    Divider().frame(height: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Bedtime variation")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text("±\(Int(bedtimeSD)) min")
                            .font(.subheadline.bold())
                            .foregroundStyle(bedtimeSD < 30 ? .green : .orange)
                    }
                }
                if let wake = avgWakeFormatted {
                    Divider().frame(height: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Typical wake")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text(wake)
                            .font(.subheadline.bold())
                    }
                }
            }
            .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Timing Chart

    private var timingChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Nightly Sleep Window")
                .font(.headline)
                .padding(.horizontal, 4)

            let df = DateFormatter()
            let _ = { df.dateFormat = "EEE" }()

            VStack(spacing: 0) {
                ForEach(nights.suffix(14)) { night in
                    HStack(spacing: 12) {
                        Text(df.string(from: night.wakeTime))
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 30, alignment: .leading)

                        GeometryReader { geo in
                            let totalRange = 16.0 * 60 // 10pm to 10am = 12h window shown as 16h
                            let bedMins = night.bedtimeMinutesSinceMidnight - 22 * 60 // offset from 10pm
                            let wakeMins = night.wakeMinutesSinceMidnight + (24 - 22) * 60 // add wrap

                            let startFrac = max(0, min(1, bedMins / totalRange))
                            let endFrac = max(0, min(1, wakeMins / totalRange))

                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color(.systemFill))
                                    .frame(height: 8)
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.indigo.opacity(0.7))
                                    .frame(width: max(4, geo.size.width * CGFloat(endFrac - startFrac)), height: 8)
                                    .offset(x: geo.size.width * CGFloat(startFrac))
                            }
                        }
                        .frame(height: 8)

                        Text(formatDuration(night.totalMinutes))
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 40, alignment: .trailing)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 5)
                }

                // X axis labels
                HStack {
                    Text("10pm")
                    Spacer()
                    Text("2am")
                    Spacer()
                    Text("6am")
                    Spacer()
                    Text("10am")
                }
                .font(.caption2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 58)
                .padding(.top, 4)
                .padding(.bottom, 8)
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Stats Card

    private var statsCard: some View {
        let durations = nights.map { Double($0.totalMinutes) }
        let durationSD = standardDeviation(durations)

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                statBubble(label: "Bedtime ±", value: "±\(Int(bedtimeSD))m",
                           color: bedtimeSD < 20 ? .green : bedtimeSD < 45 ? .yellow : .red)
                Divider().frame(height: 40)
                statBubble(label: "Wake ±", value: "±\(Int(wakeSD))m",
                           color: wakeSD < 20 ? .green : wakeSD < 45 ? .yellow : .red)
                Divider().frame(height: 40)
                statBubble(label: "Duration ±", value: "±\(Int(durationSD))m", color: .primary)
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func statBubble(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Advice Card

    private var adviceCard: some View {
        let zone = ConsistencyZone.from(score: consistencyScore)
        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(.yellow)
                Text("What This Means")
                    .font(.subheadline.weight(.semibold))
            }
            Text(zone.advice)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Research shows that irregular sleep timing (\"social jetlag\") — even with the same total hours — disrupts circadian rhythms, impairs glucose metabolism, and increases fatigue. Keeping bedtime and wake time within 30 minutes each day is recommended.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "moon.zzz.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Sleep consistency analysis needs at least 5 nights of Apple Watch sleep tracking data.")
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
        let start = Calendar.current.date(byAdding: .day, value: -14, to: Date()) ?? Date()
        let samples = (try? await healthKit.fetchSleepAnalysis(from: start, to: Date())) ?? []
        nights = groupSamplesToNights(samples)
    }

    private func groupSamplesToNights(_ samples: [HKCategorySample]) -> [ConsSleepNight] {
        let cal = Calendar.current
        var byDay: [DateComponents: [HKCategorySample]] = [:]
        for s in samples {
            let key = cal.dateComponents([.year, .month, .day], from: s.endDate)
            byDay[key, default: []].append(s)
        }
        return byDay.compactMap { (comps, daySamples) -> ConsSleepNight? in
            guard let wakeDate = cal.date(from: comps) else { return nil }
            let sleepSamples = daySamples.filter {
                switch HKCategoryValueSleepAnalysis(rawValue: $0.value) {
                case .asleepDeep, .asleepREM, .asleepCore, .asleepUnspecified: return true
                default: return false
                }
            }
            guard !sleepSamples.isEmpty else { return nil }
            let earliest = sleepSamples.min(by: { $0.startDate < $1.startDate })!
            let latest = sleepSamples.max(by: { $0.endDate < $1.endDate })!
            let totalMins = sleepSamples.reduce(0) { $0 + Int($1.endDate.timeIntervalSince($1.startDate) / 60) }
            guard totalMins > 60 else { return nil }
            return ConsSleepNight(date: wakeDate, bedtime: earliest.startDate, wakeTime: latest.endDate, totalMinutes: totalMins)
        }
        .sorted { $0.date < $1.date }
    }

    // MARK: - Helpers

    private func standardDeviation(_ values: [Double]) -> Double {
        guard values.count > 1 else { return 0 }
        let mean = values.reduce(0, +) / Double(values.count)
        let variance = values.reduce(0) { $0 + pow($1 - mean, 2) } / Double(values.count)
        return sqrt(variance)
    }

    private func formatMinutes(_ totalMins: Double) -> String {
        let normalized = totalMins.truncatingRemainder(dividingBy: 24 * 60)
        let h = Int(normalized) / 60
        let m = Int(normalized) % 60
        let ampm = h >= 12 ? "PM" : "AM"
        let displayH = h == 0 ? 12 : h > 12 ? h - 12 : h
        return String(format: "%d:%02d %@", displayH, m, ampm)
    }

    private func formatDuration(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        return "\(h)h\(m)m"
    }
}

// MARK: - Consistency Zone

enum ConsistencyZone {
    case excellent, good, fair, poor

    var label: String {
        switch self {
        case .excellent: return "Very Consistent"
        case .good: return "Consistent"
        case .fair: return "Somewhat Irregular"
        case .poor: return "Irregular"
        }
    }

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .yellow
        case .poor: return .red
        }
    }

    var advice: String {
        switch self {
        case .excellent:
            return "Your sleep timing is very regular — great for your circadian clock. Keep maintaining consistent bedtime and wake time, even on weekends."
        case .good:
            return "Your sleep is reasonably consistent. Small improvements — like keeping wake time within 30 minutes on weekends — could boost this further."
        case .fair:
            return "Your sleep timing varies moderately. Try setting a consistent alarm for the same wake time every day, including weekends."
        case .poor:
            return "Your sleep timing is irregular, which can disrupt your circadian rhythm. Aim for the same bedtime and wake time (±30 minutes) every day this week."
        }
    }

    static func from(score: Int) -> ConsistencyZone {
        if score >= 80 { return .excellent }
        if score >= 60 { return .good }
        if score >= 40 { return .fair }
        return .poor
    }
}

#Preview {
    NavigationStack {
        SleepConsistencyView()
    }
}
