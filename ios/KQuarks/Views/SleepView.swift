import SwiftUI
import HealthKit
import Charts

struct SleepView: View {
    @State private var sessions: [SleepSession] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Sleep Data",
                        systemImage: "moon.zzz",
                        description: Text("No sleep data found for the past 30 days. Enable sleep tracking in your Apple Watch or iPhone.")
                    )
                } else {
                    List {
                        if sessions.count >= 2 {
                            Section {
                                SleepBarChart(sessions: sessions)
                            }
                        }

                        if sessions.count >= 3 {
                            Section {
                                SleepWeeklyAverageRow(sessions: sessions)
                            }
                        }

                        Section("Recent Nights") {
                            ForEach(sessions) { session in
                                SleepSessionRow(session: session)
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Sleep")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 4) {
                        NavigationLink(destination: SleepPatternView()) {
                            Image(systemName: "chart.bar.doc.horizontal")
                        }
                        NavigationLink(destination: SleepConsistencyView()) {
                            Image(systemName: "clock.badge.checkmark")
                        }
                        NavigationLink(destination: SleepDebtView()) {
                            Image(systemName: "moon.zzz.fill")
                        }
                        NavigationLink(destination: SleepStagesView()) {
                            Image(systemName: "chart.bar.fill")
                        }
                        NavigationLink(destination: SleepEfficiencyView()) {
                            Image(systemName: "percent")
                        }
                        NavigationLink(destination: SleepBreathingView()) {
                            Image(systemName: "lungs")
                        }
                        NavigationLink(destination: SleepImpactView()) {
                            Image(systemName: "bolt.heart.fill")
                        }
                        NavigationLink(destination: SleepQualityScoreView()) {
                            Image(systemName: "star.fill")
                        }
                    }
                }
            }
            .task {
                await loadSleep()
            }
            .refreshable { await loadSleep() }
        }
    }

    private func loadSleep() async {
        isLoading = true
        let calendar = Calendar.current
        let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let samples = (try? await healthKit.fetchSleepAnalysis(from: thirtyDaysAgo, to: Date())) ?? []
        sessions = groupSamplesIntoSessions(samples)
        isLoading = false
    }

    private func groupSamplesIntoSessions(_ samples: [HKCategorySample]) -> [SleepSession] {
        guard !samples.isEmpty else { return [] }

        let calendar = Calendar.current
        var byDay: [DateComponents: [HKCategorySample]] = [:]

        for sample in samples {
            let wakeDay = calendar.dateComponents([.year, .month, .day], from: sample.endDate)
            byDay[wakeDay, default: []].append(sample)
        }

        return byDay.compactMap { (dayComponents, daySamples) -> SleepSession? in
            guard let date = calendar.date(from: dayComponents) else { return nil }

            var deep = 0, rem = 0, core = 0, awake = 0
            for sample in daySamples {
                let mins = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                switch HKCategoryValueSleepAnalysis(rawValue: sample.value) {
                case .asleepDeep: deep += mins
                case .asleepREM: rem += mins
                case .asleepCore, .asleepUnspecified: core += mins
                case .awake, .inBed: awake += mins
                default: break
                }
            }

            let total = deep + rem + core
            guard total > 60 else { return nil }

            return SleepSession(
                date: date,
                totalMinutes: total,
                deepMinutes: deep,
                remMinutes: rem,
                coreMinutes: core,
                awakeMinutes: awake
            )
        }
        .sorted { $0.date > $1.date }
    }
}

// MARK: - Sleep Session Model

struct SleepSession: Identifiable {
    let id = UUID()
    let date: Date
    let totalMinutes: Int
    let deepMinutes: Int
    let remMinutes: Int
    let coreMinutes: Int
    let awakeMinutes: Int

    var formattedTotal: String {
        let h = totalMinutes / 60
        let m = totalMinutes % 60
        return "\(h)h \(m)m"
    }
}

// MARK: - Weekly Average Row

struct SleepWeeklyAverageRow: View {
    let sessions: [SleepSession]

    private var avgMinutes: Int {
        let slice = sessions.prefix(7)
        return slice.reduce(0) { $0 + $1.totalMinutes } / max(slice.count, 1)
    }

    private var avgDeep: Int {
        let slice = sessions.prefix(7)
        return slice.reduce(0) { $0 + $1.deepMinutes } / max(slice.count, 1)
    }

    private var avgRem: Int {
        let slice = sessions.prefix(7)
        return slice.reduce(0) { $0 + $1.remMinutes } / max(slice.count, 1)
    }

    private func fmt(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("7-Day Average")
                .font(.headline)

            HStack(spacing: 0) {
                StatBubble(label: "Total", value: fmt(avgMinutes), color: .indigo)
                Divider().frame(height: 40)
                StatBubble(label: "Deep", value: fmt(avgDeep), color: .blue)
                Divider().frame(height: 40)
                StatBubble(label: "REM", value: fmt(avgRem), color: .purple)
            }
            .frame(maxWidth: .infinity)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .padding(.vertical, 4)
    }
}

struct StatBubble: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
}

// MARK: - Sleep Bar Chart

struct SleepBarChart: View {
    let sessions: [SleepSession] // newest-first

    private var chartData: [(label: String, hours: Double)] {
        let fmt = DateFormatter()
        fmt.dateFormat = "EEE"
        return sessions.prefix(7).reversed().map { session in
            (label: fmt.string(from: session.date), hours: Double(session.totalMinutes) / 60.0)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Last 7 Nights")
                .font(.headline)

            Chart {
                RuleMark(y: .value("Goal", 8.0))
                    .foregroundStyle(.indigo.opacity(0.35))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("8h goal")
                            .font(.caption2)
                            .foregroundStyle(.indigo.opacity(0.6))
                    }

                ForEach(chartData, id: \.label) { item in
                    BarMark(
                        x: .value("Day", item.label),
                        y: .value("Hours", item.hours)
                    )
                    .foregroundStyle(.indigo.gradient)
                    .cornerRadius(4)
                }
            }
            .chartYScale(domain: 0...10)
            .chartYAxis {
                AxisMarks(values: [0, 4, 6, 8, 10]) { value in
                    AxisGridLine()
                    AxisValueLabel {
                        if let h = value.as(Double.self) {
                            Text("\(Int(h))h")
                                .font(.caption2)
                        }
                    }
                }
            }
            .frame(height: 160)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Sleep Session Row

struct SleepSessionRow: View {
    let session: SleepSession

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(session.date, style: .date)
                    .font(.headline)
                Spacer()
                Text(session.formattedTotal)
                    .font(.subheadline.monospacedDigit().bold())
                    .foregroundStyle(.indigo)
            }

            SleepStagesBar(session: session)

            HStack(spacing: 16) {
                SleepStagePill(label: "Deep", minutes: session.deepMinutes, color: .blue)
                SleepStagePill(label: "REM", minutes: session.remMinutes, color: .purple)
                SleepStagePill(label: "Light", minutes: session.coreMinutes, color: .indigo.opacity(0.5))
                if session.awakeMinutes > 0 {
                    SleepStagePill(label: "Awake", minutes: session.awakeMinutes, color: .orange)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct SleepStagesBar: View {
    let session: SleepSession

    var total: Int { session.totalMinutes + session.awakeMinutes }

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: 1) {
                let w = geo.size.width
                if session.deepMinutes > 0 {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.blue)
                        .frame(width: w * CGFloat(session.deepMinutes) / CGFloat(max(total, 1)))
                }
                if session.remMinutes > 0 {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.purple)
                        .frame(width: w * CGFloat(session.remMinutes) / CGFloat(max(total, 1)))
                }
                if session.coreMinutes > 0 {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.indigo.opacity(0.5))
                        .frame(width: w * CGFloat(session.coreMinutes) / CGFloat(max(total, 1)))
                }
                if session.awakeMinutes > 0 {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.orange.opacity(0.4))
                        .frame(width: w * CGFloat(session.awakeMinutes) / CGFloat(max(total, 1)))
                }
            }
        }
        .frame(height: 8)
        .clipShape(RoundedRectangle(cornerRadius: 4))
    }
}

struct SleepStagePill: View {
    let label: String
    let minutes: Int
    let color: Color

    private func fmt(_ m: Int) -> String {
        let h = m / 60
        let min = m % 60
        return h > 0 ? "\(h)h\(min)m" : "\(min)m"
    }

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text("\(label) \(fmt(minutes))")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    SleepView()
}
