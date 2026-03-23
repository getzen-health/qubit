import SwiftUI
import HealthKit
import Charts

// MARK: - SportSpecificLoadView
// Tracks Chronic Training Load (CTL) separately per sport category for multi-sport athletes.
// Aggregate CTL masks sport-specific fatigue — a cyclist may be undertrained in running
// even if overall CTL looks adequate.
//
// Science:
//   Impellizzeri et al. 2004 (Int J Sports Med): sport-specific internal load should be tracked
//     independently. Pooling across sports inflates perceived readiness.
//   Soligard et al. 2016 (Br J Sports Med): sport-specific load distributions predict injury better
//     than aggregate training load (BIS Consensus Statement).
//   Bannister 1991 fitness-fatigue model: CTL = 42-day EWA, ATL = 7-day EWA, TSB = CTL − ATL.
//     Applied here per sport category using kcal/500 as TSS proxy.

struct SportSpecificLoadView: View {

    // MARK: - Models

    enum SportCategory: String, CaseIterable, Identifiable {
        var id: String { rawValue }
        case running   = "Running"
        case cycling   = "Cycling"
        case swimming  = "Swimming"
        case strength  = "Strength"
        case cardio    = "Cardio"      // HIIT, elliptical, rowing, etc.
        case other     = "Other"

        var icon: String {
            switch self {
            case .running:  return "figure.run"
            case .cycling:  return "figure.outdoor.cycle"
            case .swimming: return "figure.pool.swim"
            case .strength: return "figure.strengthtraining.traditional"
            case .cardio:   return "bolt.heart.fill"
            case .other:    return "figure.mixed.cardio"
            }
        }

        var color: Color {
            switch self {
            case .running:  return .orange
            case .cycling:  return .blue
            case .swimming: return .cyan
            case .strength: return .red
            case .cardio:   return .pink
            case .other:    return .purple
            }
        }

        static func classify(_ type: HKWorkoutActivityType) -> SportCategory {
            switch type {
            case .running:                       return .running
            case .cycling:                       return .cycling
            case .swimming, .waterFitness:       return .swimming
            case .traditionalStrengthTraining,
                 .functionalStrengthTraining,
                 .crossTraining:                 return .strength
            case .highIntensityIntervalTraining,
                 .elliptical,
                 .rowing,
                 .jumpRope,
                 .boxing,
                 .kickboxing,
                 .martialArts,
                 .stairClimbing:                 return .cardio
            default:                             return .other
            }
        }
    }

    struct SportLoad {
        let sport: SportCategory
        var ctl: Double    // 42-day EWA of TSS
        var atl: Double    // 7-day EWA of TSS
        var tsb: Double    // CTL − ATL (form)
        var last7DaysTSS: Double

        var tsbStatus: TSBStatus {
            switch tsb {
            case 10...:   return .fresh
            case 0..<10:  return .neutral
            case -20..<0: return .fatigued
            default:      return .overreaching
            }
        }
    }

    enum TSBStatus: String {
        case fresh       = "Fresh"
        case neutral     = "Neutral"
        case fatigued    = "Fatigued"
        case overreaching = "Overreaching"

        var color: Color {
            switch self {
            case .fresh:        return .green
            case .neutral:      return .blue
            case .fatigued:     return .orange
            case .overreaching: return .red
            }
        }
    }

    struct SportTSS: Identifiable {
        let id = UUID()
        let date: Date
        let sport: SportCategory
        let tss: Double
    }

    // MARK: - State

    @State private var sportLoads: [SportLoad] = []
    @State private var totalCTL: Double = 0
    @State private var totalATL: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Calculating per-sport load…")
                        .padding(.top, 60)
                } else {
                    overviewCard
                    ForEach(sportLoads.filter { $0.ctl > 0.5 }, id: \.sport.rawValue) { load in
                        sportCard(load)
                    }
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Sport-Specific Load")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Overview Card

    private var overviewCard: some View {
        let activeSports = sportLoads.filter { $0.ctl > 0.5 }
        let dominantSport = activeSports.max(by: { $0.ctl < $1.ctl })

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: String(format: "%.0f", totalCTL),
                    label: "Total CTL",
                    sub: "42-day fitness",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.0f", totalATL),
                    label: "Total ATL",
                    sub: "7-day fatigue",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%+.0f", totalCTL - totalATL),
                    label: "TSB Form",
                    sub: totalCTL - totalATL > 5 ? "Peaking" : totalCTL - totalATL < -10 ? "Building" : "Neutral",
                    color: (totalCTL - totalATL) > 5 ? .green : (totalCTL - totalATL) < -10 ? .orange : .blue
                )
            }
            .padding(.vertical, 12)

            if let primary = dominantSport {
                HStack(spacing: 6) {
                    Image(systemName: primary.sport.icon).foregroundStyle(primary.sport.color)
                    Text("Primary sport: \(primary.sport.rawValue) (\(String(format: "%.0f", primary.ctl)) CTL)")
                        .font(.caption).foregroundStyle(.secondary)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Sport Card

    private func sportCard(_ load: SportLoad) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: load.sport.icon)
                    .font(.title3)
                    .foregroundStyle(load.sport.color)
                    .frame(width: 36, height: 36)
                    .background(load.sport.color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 2) {
                    Text(load.sport.rawValue).font(.subheadline.bold())
                    Text("TSB: \(String(format: "%+.0f", load.tsb)) — \(load.tsbStatus.rawValue)")
                        .font(.caption2)
                        .foregroundStyle(load.tsbStatus.color)
                }
                Spacer()
            }

            HStack(spacing: 0) {
                metricPill(label: "CTL", value: String(format: "%.0f", load.ctl), color: .blue)
                metricPill(label: "ATL", value: String(format: "%.0f", load.atl), color: .orange)
                metricPill(label: "Last 7d TSS", value: String(format: "%.0f", load.last7DaysTSS), color: load.sport.color)
            }

            // CTL bar (relative to dominant sport)
            let maxCTL = sportLoads.map(\.ctl).max() ?? 1
            VStack(spacing: 3) {
                HStack {
                    Text("Fitness base").font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    Text(String(format: "CTL %.0f", load.ctl)).font(.caption2.bold()).foregroundStyle(load.sport.color)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.secondary.opacity(0.12)).frame(height: 6)
                        Capsule()
                            .fill(load.sport.color.gradient)
                            .frame(width: geo.size.width * (load.ctl / maxCTL), height: 6)
                    }
                }
                .frame(height: 6)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func metricPill(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Why Track Per-Sport Load?", systemImage: "chart.bar.doc.horizontal")
                .font(.subheadline).bold()
            Text("Impellizzeri et al. 2004 (Int J Sports Med): pooling training load across sports can mask sport-specific fatigue and underpreparedness. A triathlete with high cycling CTL may have very low running CTL — making their overall average misleading.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Soligard et al. 2016 (Br J Sports Med): sport-specific load distributions predict injury risk better than aggregate load. The BIS Consensus Statement recommends tracking individual sport contributions for multi-sport athletes.")
                .font(.caption).foregroundStyle(.secondary)
            Text("TSS proxy used here: kcal / 500 per session. For precise CTL, use power meter (cyclists) or pace-based TRIMP (runners). Bannister 1991 decay constants: CTL 42-day, ATL 7-day.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Helpers

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .day, value: -180, to: end)!  // 6 months for CTL warmup

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: HKObjectQueryNoLimit,
                                   sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        computeLoads(workouts: rawWorkouts, end: end)
        isLoading = false
    }

    private func computeLoads(workouts: [HKWorkout], end: Date) {
        let eCtl = exp(-1.0 / 42.0)
        let eAtl = exp(-1.0 / 7.0)
        let kCalScale = 1.0 / 500.0  // 500 kcal ≈ 100 TSS

        // Per-sport EWA accumulators
        var ctlMap: [SportCategory: Double] = [:]
        var atlMap: [SportCategory: Double] = [:]
        SportCategory.allCases.forEach { ctlMap[$0] = 0; atlMap[$0] = 0 }

        // Group workouts by day
        let grouped = Dictionary(grouping: workouts) { w in
            calendar.startOfDay(for: w.startDate)
        }

        // Walk each day in the range
        var cursor = calendar.startOfDay(for: workouts.first?.startDate ?? end)
        while cursor <= end {
            let dayWorkouts = grouped[cursor] ?? []

            // Per-sport TSS this day
            var dayTSS: [SportCategory: Double] = [:]
            for w in dayWorkouts {
                let cat = SportCategory.classify(w.workoutActivityType)
                let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
                dayTSS[cat, default: 0] += kcal * kCalScale
            }

            // Update EWA for each sport
            for cat in SportCategory.allCases {
                let tss = dayTSS[cat] ?? 0
                ctlMap[cat] = eCtl * (ctlMap[cat] ?? 0) + (1 - eCtl) * tss
                atlMap[cat] = eAtl * (atlMap[cat] ?? 0) + (1 - eAtl) * tss
            }

            cursor = calendar.date(byAdding: .day, value: 1, to: cursor)!
        }

        // Last-7-days TSS per sport
        let last7Start = calendar.date(byAdding: .day, value: -7, to: end)!
        var last7: [SportCategory: Double] = [:]
        for w in workouts where w.startDate >= last7Start {
            let cat = SportCategory.classify(w.workoutActivityType)
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            last7[cat, default: 0] += kcal * kCalScale
        }

        let loads = SportCategory.allCases.map { cat in
            SportLoad(sport: cat,
                      ctl: ctlMap[cat] ?? 0,
                      atl: atlMap[cat] ?? 0,
                      tsb: (ctlMap[cat] ?? 0) - (atlMap[cat] ?? 0),
                      last7DaysTSS: last7[cat] ?? 0)
        }.sorted { $0.ctl > $1.ctl }

        let aggCTL = loads.map(\.ctl).reduce(0, +)
        let aggATL = loads.map(\.atl).reduce(0, +)

        DispatchQueue.main.async {
            self.sportLoads = loads
            self.totalCTL   = aggCTL
            self.totalATL   = aggATL
        }
    }
}
