import SwiftUI
import Charts
import HealthKit

// MARK: - SleepStagesView
// Aggregate sleep stage analysis — deep, REM, core, and awake percentages over 60 nights.

struct SleepStagesView: View {
    @State private var nights: [SleepSession] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    // Optimal stage ranges (% of total sleep)
    private let deepTarget = (13.0, 23.0)
    private let remTarget  = (20.0, 25.0)
    private let coreTarget = (45.0, 60.0)
    private let awakeTarget = (0.0, 7.0)

    // Nights with stage data (Apple Watch stages, not just asleepUnspecified)
    private var stagedNights: [SleepSession] {
        nights.filter { $0.deepMinutes + $0.remMinutes > 0 }
    }

    private func avgPct(_ key: KeyPath<SleepSession, Int>) -> Double {
        guard !stagedNights.isEmpty else { return 0 }
        return stagedNights.map { Double($0[keyPath: key]) / Double($0.totalMinutes) * 100 }
                           .reduce(0, +) / Double(stagedNights.count)
    }

    private func avgMin(_ key: KeyPath<SleepSession, Int>) -> Double {
        guard !stagedNights.isEmpty else { return 0 }
        return Double(stagedNights.map { $0[keyPath: key] }.reduce(0, +)) / Double(stagedNights.count)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if stagedNights.isEmpty {
                    emptyState
                } else {
                    averagesGrid
                    qualityBanner
                    if stagedNights.count >= 4 { trendChart }
                    bestWorstCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Sleep Stages")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Averages Grid

    private var averagesGrid: some View {
        let deepPct = avgPct(\.deepMinutes)
        let remPct  = avgPct(\.remMinutes)
        let corePct = avgPct(\.coreMinutes)
        let awakePct = avgPct(\.awakeMinutes)
        let deepMin = avgMin(\.deepMinutes)
        let remMin  = avgMin(\.remMinutes)

        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            stageCell(label: "Deep Sleep", pct: deepPct, min: deepMin, color: .indigo, target: deepTarget)
            stageCell(label: "REM Sleep", pct: remPct, min: remMin, color: .purple, target: remTarget)
            stageCell(label: "Core / Light", pct: corePct, min: nil, color: .cyan, target: coreTarget)
            stageCell(label: "Awake", pct: awakePct, min: nil, color: .red, target: awakeTarget)
        }
    }

    private func stageCell(label: String, pct: Double, min: Double?, color: Color, target: (Double, Double)) -> some View {
        let onTarget = pct >= target.0 && pct <= target.1
        let scoreColor: Color = onTarget ? .green : (abs(pct - (target.0 + target.1) / 2) < 10 ? .yellow : .red)
        return VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(String(format: "%.0f%%", pct))
                .font(.title2.bold().monospacedDigit())
                .foregroundStyle(scoreColor)
            if let m = min {
                Text(formatMin(m))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Text("Target \(Int(target.0))–\(Int(target.1))%")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .opacity(0.6)
            // Score bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2).fill(Color(.systemFill)).frame(height: 4)
                    RoundedRectangle(cornerRadius: 2).fill(color)
                        .frame(width: geo.size.width * CGFloat(Swift.min(pct, 100) / 100), height: 4)
                }
            }.frame(height: 4)
        }
        .padding(14)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Quality Banner

    private var qualityBanner: some View {
        let deepPct = avgPct(\.deepMinutes)
        let remPct  = avgPct(\.remMinutes)
        let deepOK = deepPct >= deepTarget.0 && deepPct <= deepTarget.1
        let remOK  = remPct >= remTarget.0 && remPct <= remTarget.1
        let bothOK = deepOK && remOK
        let color: Color = bothOK ? .green : (deepOK || remOK ? .yellow : .orange)

        return VStack(alignment: .leading, spacing: 6) {
            Label("Stage Quality", systemImage: bothOK ? "checkmark.seal.fill" : "exclamationmark.circle.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(color)
            Text(qualityMessage(deepPct: deepPct, remPct: remPct, deepOK: deepOK, remOK: remOK))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func qualityMessage(deepPct: Double, remPct: Double, deepOK: Bool, remOK: Bool) -> String {
        switch (deepOK, remOK) {
        case (true, true):
            return "Both deep and REM sleep are within optimal ranges. Your sleep architecture is healthy."
        case (false, true):
            let diff = deepPct < deepTarget.0 ? "low" : "high"
            return "REM is on target, but deep sleep is \(diff) at \(Int(deepPct))% (target \(Int(deepTarget.0))–\(Int(deepTarget.1))%). Try keeping a consistent bedtime and avoiding alcohol before bed."
        case (true, false):
            let diff = remPct < remTarget.0 ? "low" : "high"
            return "Deep sleep is on target, but REM is \(diff) at \(Int(remPct))% (target \(Int(remTarget.0))–\(Int(remTarget.1))%). Longer total sleep and a consistent wake time help maximize REM."
        default:
            return "Both deep (\(Int(deepPct))%) and REM (\(Int(remPct))%) could be improved. Focus on 7–9 hours of consistent sleep and a cool, dark room."
        }
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        struct StagePct: Identifiable {
            let id: Date
            let date: Date
            let deep: Double
            let rem: Double
        }
        let data: [StagePct] = stagedNights.suffix(30).reversed().map { n in
            let total = Double(n.totalMinutes)
            let deep = total > 0 ? Double(n.deepMinutes) / total * 100 : 0
            let rem  = total > 0 ? Double(n.remMinutes)  / total * 100 : 0
            return StagePct(id: n.date, date: n.date, deep: deep, rem: rem)
        }
        let stageDomainMax = (data.flatMap { [$0.deep, $0.rem] }.max() ?? 25.0) + 5.0

        return VStack(alignment: .leading, spacing: 8) {
            Text("Deep & REM Trend (Last 30 nights)")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(data) { point in
                    LineMark(x: .value("Date", point.date, unit: .day),
                             y: .value("Deep %", point.deep))
                    .foregroundStyle(Color.indigo)
                    .interpolationMethod(.catmullRom)

                    LineMark(x: .value("Date", point.date, unit: .day),
                             y: .value("REM %", point.rem))
                    .foregroundStyle(Color.purple)
                    .interpolationMethod(.catmullRom)
                }

                // Target range marks
                RuleMark(y: .value("Deep min", deepTarget.0)).foregroundStyle(Color.indigo.opacity(0.3)).lineStyle(StrokeStyle(dash: [4, 3]))
                RuleMark(y: .value("REM min", remTarget.0)).foregroundStyle(Color.purple.opacity(0.3)).lineStyle(StrokeStyle(dash: [4, 3]))
            }
            .chartYScale(domain: 0...max(45.0, stageDomainMax))
            .chartXAxis { AxisMarks(values: .stride(by: .weekOfYear, count: 1)) { _ in
                AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                AxisTick()
            }}
            .frame(height: 160)
            .padding(.horizontal, 4)

            HStack(spacing: 16) {
                Label("Deep SWS", systemImage: "circle.fill").foregroundStyle(.indigo)
                Label("REM", systemImage: "circle.fill").foregroundStyle(.purple)
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 4)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Best / Worst Nights

    private var bestWorstCard: some View {
        let sorted = stagedNights.sorted {
            let aScore = Double($0.deepMinutes + $0.remMinutes) / Double($0.totalMinutes)
            let bScore = Double($1.deepMinutes + $1.remMinutes) / Double($1.totalMinutes)
            return aScore > bScore
        }
        guard let best = sorted.first, let worst = sorted.last else { return AnyView(EmptyView()) }

        return AnyView(HStack(spacing: 12) {
            nightCard(night: best, label: "Best Night", emoji: "⭐", borderColor: .green)
            nightCard(night: worst, label: "Lightest Night", emoji: "💤", borderColor: .orange)
        })
    }

    private func nightCard(night: SleepSession, label: String, emoji: String, borderColor: Color) -> some View {
        let deepPct = night.totalMinutes > 0 ? Int(Double(night.deepMinutes) / Double(night.totalMinutes) * 100) : 0
        let remPct  = night.totalMinutes > 0 ? Int(Double(night.remMinutes)  / Double(night.totalMinutes) * 100) : 0

        return VStack(alignment: .leading, spacing: 6) {
            Text("\(emoji) \(label)").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(night.date.kqFormat("EEE, MMM d")).font(.subheadline.bold())
            VStack(alignment: .leading, spacing: 2) {
                Text("Deep: \(deepPct)%").font(.caption).foregroundStyle(.indigo)
                Text("REM: \(remPct)%").font(.caption).foregroundStyle(.purple)
                Text("Total: \(night.formattedTotal)").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(borderColor.opacity(0.4), lineWidth: 1))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Understanding Stages", systemImage: "info.circle.fill").font(.subheadline.weight(.semibold))
            VStack(alignment: .leading, spacing: 8) {
                stageInfoRow(title: "Deep Sleep (SWS)", color: .indigo,
                    text: "Slow-wave sleep is the most physically restorative stage — muscle repair, immune function, and declarative memory all peak here. Target 13–23%.")
                stageInfoRow(title: "REM Sleep", color: .purple,
                    text: "REM supports emotional regulation, creativity, and memory integration. More REM occurs in the second half of the night. Target 20–25%.")
                stageInfoRow(title: "Core / Light Sleep", color: .cyan,
                    text: "NREM light sleep acts as a transition and still plays a role in motor learning. Makes up 45–60% of healthy sleep architecture.")
                stageInfoRow(title: "Awake Time", color: .red,
                    text: "Brief awakenings are normal. Under 7% is typical. Consistently high awake time may indicate sleep fragmentation or apnea.")
            }
            Text("Requires Apple Watch with watchOS 9+ sleep stages enabled.")
                .font(.caption2).foregroundStyle(.secondary).opacity(0.5).padding(.top, 4)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func stageInfoRow(title: String, color: Color, text: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.weight(.semibold)).foregroundStyle(color)
            Text(text).font(.caption).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "moon.stars.fill").font(.system(size: 48)).foregroundStyle(.secondary)
            Text("No Stage Data").font(.title3.bold())
            Text("Sleep stage analysis (deep, REM, core) requires Apple Watch with watchOS 9+ and Sleep Focus enabled.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        let start = Calendar.current.date(byAdding: .day, value: -60, to: Date()) ?? Date()
        let samples = (try? await healthKit.fetchSleepAnalysis(from: start, to: Date())) ?? []

        // Group by wake date
        let cal = Calendar.current
        var byDay: [DateComponents: [HKCategorySample]] = [:]
        for s in samples {
            let key = cal.dateComponents([.year, .month, .day], from: s.endDate)
            byDay[key, default: []].append(s)
        }

        nights = byDay.compactMap { (comps, daySamples) -> SleepSession? in
            guard let date = cal.date(from: comps) else { return nil }
            var deep = 0, rem = 0, core = 0, awake = 0
            for s in daySamples {
                let mins = Int(s.endDate.timeIntervalSince(s.startDate) / 60)
                switch HKCategoryValueSleepAnalysis(rawValue: s.value) {
                case .asleepDeep: deep += mins
                case .asleepREM: rem += mins
                case .asleepCore, .asleepUnspecified: core += mins
                case .awake, .inBed: awake += mins
                default: break
                }
            }
            let total = deep + rem + core
            guard total > 60 else { return nil }
            return SleepSession(date: date, totalMinutes: total, deepMinutes: deep, remMinutes: rem, coreMinutes: core, awakeMinutes: awake)
        }
        .sorted { $0.date > $1.date }
    }

    // MARK: - Helpers

    private func formatMin(_ min: Double) -> String {
        let h = Int(min) / 60; let m = Int(min) % 60
        return h > 0 ? "\(h)h \(m)m avg" : "\(m)m avg"
    }
}

#Preview {
    NavigationStack { SleepStagesView() }
}
