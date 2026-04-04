import SwiftUI
import Charts
import HealthKit

// MARK: - CycleTrainingView

/// Integrates menstrual cycle phase data with workout performance and recommendations.
/// Uses HKCategoryType(.menstrualFlow) to identify cycle days and correlates
/// with workout metrics (HR, intensity) across each phase.
///
/// Phases:
/// - Menstrual (days 1–5): Lower energy, reduce volume — gentle movement
/// - Follicular (days 6–13): Rising estrogen → increasing strength & endurance capacity
/// - Ovulation (days 12–16): Peak power output, coordination; ideal for intense training
/// - Luteal (days 17–28): Progesterone rises → slightly reduced aerobic efficiency;
///                         focus on strength, technique work
///
/// References: Elliott-Sale et al. 2021 (sports performance & menstrual cycle),
/// McNulty et al. 2020 (Meta-analysis, Br J Sports Med).
struct CycleTrainingView: View {

    enum CyclePhase: String, CaseIterable {
        case menstrual = "Menstrual"
        case follicular = "Follicular"
        case ovulation = "Ovulation"
        case luteal = "Luteal"

        var icon: String {
            switch self {
            case .menstrual: return "drop.fill"
            case .follicular: return "arrow.up.heart.fill"
            case .ovulation: return "sparkles"
            case .luteal: return "moon.fill"
            }
        }

        var color: Color {
            switch self {
            case .menstrual: return .red
            case .follicular: return .green
            case .ovulation: return .orange
            case .luteal: return .purple
            }
        }

        var dayRange: String {
            switch self {
            case .menstrual: return "Days 1–5"
            case .follicular: return "Days 6–13"
            case .ovulation: return "Days 12–16"
            case .luteal: return "Days 17–28"
            }
        }

        var trainingTip: String {
            switch self {
            case .menstrual:
                return "Lower prostaglandins, reduced motivation. Prioritize gentle movement: yoga, walking, light swimming. Listen to your body — don't push through pain."
            case .follicular:
                return "Rising estrogen boosts muscle protein synthesis and aerobic capacity. Gradually increase intensity: runs, cycling, strength work. Great time to set PRs."
            case .ovulation:
                return "Estrogen peaks — maximum power, coordination, and agility. Push hard: intervals, heavy lifting, HIIT. Peak performance window lasts 2–3 days."
            case .luteal:
                return "Progesterone rises, core body temp increases slightly, aerobic efficiency dips. Shift to strength, skill, and technique work. Maintain but don't force new PRs."
            }
        }
    }

    struct PhaseStat: Identifiable {
        let id: CyclePhase
        let phase: CyclePhase
        let workoutCount: Int
        let avgHR: Double
        let avgKcalPerMin: Double
    }

    struct WeeklyLoad: Identifiable {
        let id: String
        let weekStart: Date
        let workouts: Int
        let phase: CyclePhase?
    }

    @State private var currentPhase: CyclePhase? = nil
    @State private var cycleDay: Int = 0
    @State private var phaseStats: [PhaseStat] = []
    @State private var weeklyLoads: [WeeklyLoad] = []
    @State private var lastPeriodStart: Date? = nil
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else {
                VStack(spacing: 16) {
                    if let phase = currentPhase {
                        currentPhaseCard(phase: phase)
                    }
                    phaseGuideCard
                    if !phaseStats.isEmpty { phaseStatsCard }
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Cycle-Synced Training")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Current Phase Card

    private func currentPhaseCard(phase: CyclePhase) -> some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's Phase")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Image(systemName: phase.icon).font(.title).foregroundStyle(phase.color)
                        Text(LocalizedStringKey(phase.rawValue))
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(phase.color)
                    }
                    if cycleDay > 0 {
                        Text("Cycle Day \(cycleDay) · \(phase.dayRange)")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                }
                Spacer()
                phaseRing(phase: phase)
            }
            Divider()
            Text(phase.trainingTip)
                .font(.subheadline).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(phase.color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(phase.color.opacity(0.2), lineWidth: 1))
    }

    private func phaseRing(phase: CyclePhase) -> some View {
        ZStack {
            Circle().stroke(Color.gray.opacity(0.12), lineWidth: 6).frame(width: 64, height: 64)
            // Draw 4 arcs for the 4 phases
            phaseArc(from: 0, to: 0.18, color: CyclePhase.menstrual.color, active: phase == .menstrual)
            phaseArc(from: 0.18, to: 0.46, color: CyclePhase.follicular.color, active: phase == .follicular)
            phaseArc(from: 0.46, to: 0.57, color: CyclePhase.ovulation.color, active: phase == .ovulation)
            phaseArc(from: 0.57, to: 1.0, color: CyclePhase.luteal.color, active: phase == .luteal)
            Image(systemName: phase.icon).font(.title3).foregroundStyle(phase.color)
        }
    }

    private func phaseArc(from start: Double, to end: Double, color: Color, active: Bool) -> some View {
        Circle()
            .trim(from: start, to: end)
            .stroke(color.opacity(active ? 1 : 0.2), style: StrokeStyle(lineWidth: active ? 6 : 4, lineCap: .butt))
            .frame(width: 64, height: 64)
            .rotationEffect(.degrees(-90))
    }

    // MARK: - Phase Guide Card

    private var phaseGuideCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Phase Training Guide").font(.headline)
            ForEach(CyclePhase.allCases, id: \.rawValue) { phase in
                HStack(alignment: .top, spacing: 10) {
                    VStack(spacing: 2) {
                        Image(systemName: phase.icon).foregroundStyle(phase.color).font(.subheadline)
                        Text(phase.dayRange).font(.system(size: 9)).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }
                    .frame(width: 48)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(LocalizedStringKey(phase.rawValue)).font(.caption.bold()).foregroundStyle(phase.color)
                        Text(phase.trainingTip).font(.caption2).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(.vertical, 6)
                if phase != CyclePhase.allCases.last { Divider() }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Phase Stats Card

    private var phaseStatsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Workout Performance by Phase").font(.headline)
            Text("Average HR and intensity across recent workouts").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(phaseStats) { s in
                    BarMark(x: .value("Phase", s.phase.rawValue),
                            y: .value("Avg HR", s.avgHR))
                    .foregroundStyle(s.phase.color.opacity(0.75))
                    .cornerRadius(4)
                }
            }
            .chartYAxisLabel("Avg HR (bpm)")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 130)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "brain.head.profile").foregroundStyle(.purple)
                Text("Research Basis").font(.headline)
            }
            Text("Estrogen promotes muscle protein synthesis, improves fat utilization, and increases ligament laxity. Peak estrogen at ovulation correlates with peak power output in most studies.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Progesterone in the luteal phase elevates resting core temperature by ~0.3–0.5°C, slightly reducing aerobic efficiency and increasing perceived exertion at the same workload.")
                .font(.caption).foregroundStyle(.secondary)
            Text("⚠️ ACL injury risk is elevated during the follicular and ovulatory phases due to increased ligament laxity. Consider extra warm-up and neuromuscular prep before cutting movements.")
                .font(.caption).foregroundStyle(.orange)
            Text("McNulty et al. 2020 (meta-analysis, n=1,200) — Br J Sports Med | Elliott-Sale et al. 2021 — Sports Med")
                .font(.caption2).foregroundStyle(.tertiary).italic()
        }
        .padding()
        .background(Color.purple.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.purple.opacity(0.18), lineWidth: 1))
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard let flowType = HKObjectType.categoryType(forIdentifier: .menstrualFlow) else { return }
        let workoutType = HKObjectType.workoutType()
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [flowType, workoutType, hrType])) != nil else { return }

        let threeMonthsAgo = Calendar.current.date(byAdding: .month, value: -3, to: Date()) ?? Date()
        let cal = Calendar.current

        // Fetch menstrual flow events
        let flowSamples: [HKCategorySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: flowType,
                predicate: HKQuery.predicateForSamples(withStart: threeMonthsAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
            healthStore.execute(q)
        }

        // Find most recent period start
        let periodStarts = flowSamples
            .filter { $0.value != HKCategoryValueMenstrualFlow.none.rawValue }
            .map { cal.startOfDay(for: $0.startDate) }
            .sorted()

        guard !periodStarts.isEmpty else {
            // No cycle data — still show the guide
            isLoading = false
            return
        }

        // Find most recent period cluster start
        guard let firstStart = periodStarts.first else { return }
        var lastStart = firstStart
        for date in periodStarts {
            if date.timeIntervalSince(lastStart) > 7 * 24 * 3600 {
                lastStart = date
            }
        }
        lastPeriodStart = lastStart

        let today = cal.startOfDay(for: Date())
        let daysSinceStart = cal.dateComponents([.day], from: lastStart, to: today).day ?? 0
        cycleDay = daysSinceStart + 1

        // Determine current phase
        switch cycleDay {
        case 1...5: currentPhase = .menstrual
        case 6...11: currentPhase = .follicular
        case 12...16: currentPhase = .ovulation
        default: currentPhase = .luteal
        }

        // Fetch workouts and correlate with phases
        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType,
                predicate: HKQuery.predicateForSamples(withStart: threeMonthsAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        // Map each workout to a phase based on its position in the cycle
        // We use a simplified 28-day cycle model from the last period start
        var phaseHRMap: [CyclePhase: [Double]] = [:]
        for w in workouts {
            let wDay = cal.dateComponents([.day], from: lastStart, to: cal.startOfDay(for: w.startDate)).day ?? 0
            let cyclePos = ((wDay % 28) + 28) % 28 + 1
            let phase: CyclePhase
            switch cyclePos {
            case 1...5: phase = .menstrual
            case 6...11: phase = .follicular
            case 12...16: phase = .ovulation
            default: phase = .luteal
            }
            if let hr = w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit), hr > 60 {
                phaseHRMap[phase, default: []].append(hr)
            }
        }

        phaseStats = CyclePhase.allCases.compactMap { phase in
            guard let hrs = phaseHRMap[phase], !hrs.isEmpty else { return nil }
            let avgHR = hrs.reduce(0, +) / Double(hrs.count)
            return PhaseStat(id: phase, phase: phase, workoutCount: hrs.count, avgHR: avgHR, avgKcalPerMin: 0)
        }
    }
}

#Preview { NavigationStack { CycleTrainingView() } }
