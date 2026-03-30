import SwiftUI
import Charts
import HealthKit

// MARK: - PeriodizationView

/// Automatically detects training phases (Base, Build, Peak, Taper, Off-Season)
/// from 52 weeks of workout history using volume trend analysis.
struct PeriodizationView: View {

    // MARK: - Models

    enum Phase: CaseIterable {
        case base, build, peak, taper, offSeason

        var label: String {
            switch self {
            case .base: return "Base Building"
            case .build: return "Build Phase"
            case .peak: return "Peak Phase"
            case .taper: return "Taper"
            case .offSeason: return "Off-Season"
            }
        }

        var shortLabel: String {
            switch self {
            case .base: return "Base"
            case .build: return "Build"
            case .peak: return "Peak"
            case .taper: return "Taper"
            case .offSeason: return "Off"
            }
        }

        var color: Color {
            switch self {
            case .base: return .blue
            case .build: return .orange
            case .peak: return .red
            case .taper: return .purple
            case .offSeason: return .gray
            }
        }

        var icon: String {
            switch self {
            case .base: return "figure.walk"
            case .build: return "figure.run"
            case .peak: return "bolt.fill"
            case .taper: return "arrow.down.circle"
            case .offSeason: return "moon.zzz"
            }
        }

        var description: String {
            switch self {
            case .base:
                return "You're in base-building mode — steady, aerobic volume at moderate intensity. This phase builds your aerobic engine. Keep easy efforts easy (Zone 2)."
            case .build:
                return "Your training is ramping up in volume and intensity. Add structured quality workouts (intervals, tempo) but protect recovery days."
            case .peak:
                return "Peak training — highest load of the cycle. Race-specific workouts, maintained volume. Listen to your body; prioritize sleep and nutrition."
            case .taper:
                return "Tapering — volume is dropping to let your body consolidate fitness. Maintain intensity, reduce volume 20–40%. You should start feeling sharper."
            case .offSeason:
                return "Off-season or recovery block. Low activity is intentional — rest and reset. Cross-train, build strength, and recharge mentally."
            }
        }

        var advice: [String] {
            switch self {
            case .base:
                return ["80% of sessions at easy/Zone 2 pace", "Gradually add 10% volume per week", "Focus on consistency over intensity"]
            case .build:
                return ["Add 1–2 quality sessions per week", "Monitor HRV for recovery signals", "Don't skip long easy runs/rides"]
            case .peak:
                return ["Race-pace work 2x/week max", "Protect 8+ hours of sleep nightly", "Fuel properly — carb needs are highest"]
            case .taper:
                return ["Cut volume 30–50% but keep effort", "Trust the process — fatigue will lift", "Stay sharp with short strides or openers"]
            case .offSeason:
                return ["Enjoy unstructured movement", "Strength train 2–3x/week", "Set goals for the next training cycle"]
            }
        }
    }

    struct WeekBucket: Identifiable {
        let id: Date      // Monday
        let monday: Date
        let totalMinutes: Double
        let phase: Phase
    }

    struct PhaseBlock: Identifiable {
        let id: UUID = UUID()
        let phase: Phase
        let startDate: Date
        let endDate: Date
        let weekCount: Int
        var label: String { "\(weekCount)w" }
    }

    // MARK: - State

    @State private var buckets: [WeekBucket] = []
    @State private var phaseBlocks: [PhaseBlock] = []
    @State private var currentPhase: Phase = .offSeason
    @State private var peakVolume: Double = 0       // highest week in minutes
    @State private var currentVolume: Double = 0    // last 2-week avg
    @State private var avgVolume: Double = 0        // 52-week avg
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if buckets.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    currentPhaseCard
                    volumeChartCard
                    phaseTimelineCard
                    phaseBlocksCard
                    adviceCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Periodization")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Current Phase Card

    private var currentPhaseCard: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: currentPhase.icon)
                    .font(.title)
                    .foregroundStyle(currentPhase.color)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Current Phase")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(currentPhase.label)
                        .font(.title2.bold())
                        .foregroundStyle(currentPhase.color)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text(String(format: "%.0f min/wk", currentVolume))
                        .font(.subheadline.bold().monospacedDigit())
                    Text("current avg")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Divider()

            Text(currentPhase.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 20) {
                volumeStat(label: "Peak Week", value: String(format: "%.0f min", peakVolume))
                volumeStat(label: "52-Wk Avg", value: String(format: "%.0f min", avgVolume))
                let pctOfPeak = peakVolume > 0 ? currentVolume / peakVolume * 100 : 0
                volumeStat(label: "% of Peak", value: String(format: "%.0f%%", pctOfPeak))
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(currentPhase.color.opacity(0.25), lineWidth: 1.5))
    }

    private func volumeStat(label: String, value: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Volume Chart

    private var volumeChartCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("52-Week Volume & Phase")
                .font(.headline)

            Chart {
                ForEach(buckets) { b in
                    BarMark(
                        x: .value("Week", b.monday, unit: .weekOfYear),
                        y: .value("Minutes", b.totalMinutes)
                    )
                    .foregroundStyle(b.phase.color.opacity(0.75))
                    .cornerRadius(2)
                }

                if avgVolume > 0 {
                    RuleMark(y: .value("Avg", avgVolume))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 3]))
                        .foregroundStyle(.secondary)
                        .annotation(position: .topLeading) {
                            Text("52-wk avg")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("min/week")
            .frame(height: 180)

            // Phase legend
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                ForEach(Phase.allCases, id: \.label) { p in
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(p.color.opacity(0.75))
                            .frame(width: 12, height: 8)
                        Text(p.shortLabel)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Phase Timeline Card

    private var phaseTimelineCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Training Phases")
                .font(.headline)

            if phaseBlocks.isEmpty {
                Text("Not enough data to detect phases")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                // Compact horizontal phase blocks
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 2) {
                        ForEach(phaseBlocks) { block in
                            VStack(spacing: 4) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(block.phase.color.opacity(0.75))
                                    .frame(width: max(CGFloat(block.weekCount) * 14, 28), height: 32)
                                    .overlay(
                                        Text(block.weekCount > 2 ? block.phase.shortLabel : "")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundStyle(.white)
                                    )
                                Text(block.label)
                                    .font(.system(size: 9))
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }

                // Most recent phase summary
                if let lastBlock = phaseBlocks.last {
                    HStack {
                        Circle().fill(lastBlock.phase.color).frame(width: 8, height: 8)
                        Text("Currently: \(lastBlock.phase.label) (\(lastBlock.weekCount) weeks)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Phase Blocks Summary

    private var phaseBlocksCard: some View {
        let recentBlocks = phaseBlocks.suffix(6)
        guard !recentBlocks.isEmpty else { return AnyView(EmptyView()) }


        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Recent Training Blocks")
                .font(.headline)

            VStack(spacing: 0) {
                ForEach(Array(recentBlocks.enumerated()), id: \.element.id) { i, block in
                    if i > 0 { Divider() }
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(block.phase.color)
                            .frame(width: 4, height: 36)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(block.phase.label)
                                .font(.subheadline.weight(.medium))
                            Text("\(block.startDate.kqFormat("MMM d")) – \(block.endDate.kqFormat("MMM d"))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        Text("\(block.weekCount)w")
                            .font(.caption.bold())
                            .foregroundStyle(block.phase.color)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(block.phase.color.opacity(0.12))
                            .clipShape(Capsule())
                    }
                    .padding(.vertical, 8)
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14)))
    }

    // MARK: - Advice Card

    private var adviceCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundStyle(currentPhase.color)
                Text("\(currentPhase.label) Tips")
                    .font(.headline)
            }

            ForEach(currentPhase.advice, id: \.self) { tip in
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(currentPhase.color)
                        .font(.caption)
                        .padding(.top, 2)
                    Text(tip)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding()
        .background(currentPhase.color.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Phase detection requires at least 8 weeks of workout history. Keep logging your training and come back soon.")
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

        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else { return }

        let fiftyTwoWeeksAgo = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: Date()) ?? Date()
        let allWorkouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: workoutType,
                predicate: HKQuery.predicateForSamples(withStart: fiftyTwoWeeksAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            healthStore.execute(q)
        }

        guard allWorkouts.count >= 3 else { return }

        // Build weekly buckets (Monday-anchored)
        var weekMap: [Date: Double] = [:]
        let cal = Calendar.current
        for w in allWorkouts where w.duration > 180 {
            let monday = mondayOf(date: w.startDate, cal: cal)
            weekMap[monday, default: 0] += w.duration / 60.0
        }

        // Generate all 52 week buckets
        var allBuckets: [WeekBucket] = []
        for offset in 0..<52 {
            let monday = mondayOf(date: cal.date(byAdding: .weekOfYear, value: -(51 - offset), to: Date()) ?? Date(), cal: cal)
            let mins = weekMap[monday] ?? 0
            allBuckets.append(WeekBucket(id: monday, monday: monday, totalMinutes: mins, phase: .offSeason))
        }

        // Compute volume stats
        let allMins = allBuckets.map(\.totalMinutes)
        peakVolume = allMins.max() ?? 0
        avgVolume = allMins.isEmpty ? 0 : allMins.reduce(0, +) / Double(allMins.count)
        let recentAvg = allBuckets.suffix(2).map(\.totalMinutes).reduce(0, +) / 2.0
        currentVolume = recentAvg

        // Detect phase for each week using 4-week rolling average
        var labeledBuckets = allBuckets.map { $0 }
        for i in 0..<labeledBuckets.count {
            let startIdx = max(0, i - 3)
            let window = allBuckets[startIdx...i].map(\.totalMinutes)
            let windowAvg = window.reduce(0, +) / Double(window.count)
            let prevWindow = i >= 4 ? allBuckets[(i-4)...(i-1)].map(\.totalMinutes).reduce(0, +) / 4.0 : nil
            labeledBuckets[i] = WeekBucket(
                id: labeledBuckets[i].monday,
                monday: labeledBuckets[i].monday,
                totalMinutes: labeledBuckets[i].totalMinutes,
                phase: classifyPhase(
                    currentAvg: windowAvg,
                    prevAvg: prevWindow,
                    peakVolume: peakVolume,
                    avgVolume: avgVolume
                )
            )
        }

        buckets = labeledBuckets

        // Determine current phase
        currentPhase = labeledBuckets.suffix(2).last?.phase ?? .offSeason

        // Build phase blocks (consecutive same-phase weeks)
        phaseBlocks = buildPhaseBlocks(from: labeledBuckets)
    }

    private func mondayOf(date: Date, cal: Calendar) -> Date {
        var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        comps.weekday = 2  // Monday
        return cal.date(from: comps) ?? date
    }

    private func classifyPhase(
        currentAvg: Double,
        prevAvg: Double?,
        peakVolume: Double,
        avgVolume: Double
    ) -> Phase {
        guard peakVolume > 0 else { return .offSeason }
        let pctOfPeak = currentAvg / peakVolume

        if pctOfPeak < 0.25 {
            return .offSeason
        }

        if let prev = prevAvg {
            let trend = prev > 0 ? (currentAvg - prev) / prev : 0
            // Tapering: significant drop from higher base
            if trend < -0.25 && currentAvg > avgVolume * 0.4 && pctOfPeak > 0.3 {
                return .taper
            }
            // Peak: high volume (>75% of peak)
            if pctOfPeak >= 0.75 {
                return .peak
            }
            // Build: rising trend + medium-high volume
            if trend > 0.08 && pctOfPeak >= 0.4 {
                return .build
            }
        }

        // Base: moderate, stable volume
        if pctOfPeak >= 0.35 {
            return .base
        }

        return .offSeason
    }

    private func buildPhaseBlocks(from buckets: [WeekBucket]) -> [PhaseBlock] {
        var blocks: [PhaseBlock] = []
        var i = 0
        while i < buckets.count {
            let phase = buckets[i].phase
            let start = buckets[i].monday
            var j = i + 1
            while j < buckets.count && buckets[j].phase == phase {
                j += 1
            }
            let end = buckets[j - 1].monday
            let weekCount = j - i
            blocks.append(PhaseBlock(phase: phase, startDate: start, endDate: end, weekCount: weekCount))
            i = j
        }
        return blocks
    }
}

#Preview {
    NavigationStack {
        PeriodizationView()
    }
}
