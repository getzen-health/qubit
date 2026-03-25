import SwiftUI
import HealthKit
import Charts

// MARK: - MASTrainingView
// Maximal Aerobic Speed (MAS / vVO2max) training calculator.
// MAS is the minimum running speed that fully elicits VO2max — the gold standard
// pace reference for structuring all running training zones.
//
// Science:
//   Billat & Koralsztein 1996 (Int J Sports Med): introduced MAS as the "velocity
//     at VO2max" (vVO2max). Time to exhaustion at MAS averages 6 min for elites.
//   Billat et al. 2001 (Eur J Appl Physiol): interval training at 100% MAS (vVO2max)
//     is the most potent stimulus for improving VO2max. Recommended: 6–10 reps ×
//     60-second intervals at MAS pace with equal recovery.
//   Dupont et al. 2002 (Med Sci Sports Exerc): 15s at 120% MAS / 15s rest
//     (Tabata-type) produces greater VO2max improvements than longer intervals.
//   Véronique Billat 2001: MAS training zones used by French federation coaches —
//     threshold is 82–87% MAS, VO2max training 95–105%, supramax 110–130% MAS.
//
// Formula: MAS (m/min) = VO2max / (O2 cost of running)
//   O2 cost of running ≈ 3.5 ml/kg/min per km/h ≈ 3.5 / 16.67 per m/min
//   Simplified: MAS (km/h) ≈ VO2max / 3.5
//   Example: VO2max 50 ml/kg/min → MAS ≈ 14.3 km/h → MAS pace ≈ 4:12/km

struct MASTrainingView: View {

    // MARK: - Models

    struct MASZone: Identifiable {
        let id = UUID()
        let name: String
        let pctRange: ClosedRange<Double>   // % of MAS
        let description: String
        let color: Color

        func speedRange(mas: Double) -> ClosedRange<Double> {
            (mas * pctRange.lowerBound / 100)...(mas * pctRange.upperBound / 100)
        }

        func paceRange(mas: Double) -> String {
            let hi = mas * pctRange.lowerBound / 100   // slower speed = faster pace in min/km
            let lo = mas * pctRange.upperBound / 100
            guard hi > 0, lo > 0 else { return "—" }
            let slowPace = 60 / hi     // min/km
            let fastPace = 60 / lo
            return "\(formatPace(fastPace))–\(formatPace(slowPace))/km"
        }

        private func formatPace(_ paceMinPerKm: Double) -> String {
            let mins = Int(paceMinPerKm)
            let secs = Int((paceMinPerKm - Double(mins)) * 60)
            return String(format: "%d:%02d", mins, secs)
        }
    }

    struct RunSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let avgSpeedKmh: Double
        let distanceKm: Double
        let zone: Int                  // which MAS zone (1–6)
        let pctMAS: Double
    }

    struct VO2MaxPoint: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let vo2max: Double
        var masKmh: Double { vo2max / 3.5 }
    }

    static let zones: [MASZone] = [
        MASZone(name: "Recovery", pctRange: 0...60, description: "Active recovery — blood flow without fatigue. 10–20 min post-workout.", color: .gray),
        MASZone(name: "Easy", pctRange: 60...75, description: "Aerobic base building. The majority of training volume (70–80% Seiler model). Develops fat oxidation and capillarization.", color: .green),
        MASZone(name: "Threshold", pctRange: 75...87, description: "Lactate threshold pace — sustainable 'comfortably hard' effort. Tempo runs, marathon pace.", color: .blue),
        MASZone(name: "VO₂max", pctRange: 87...105, description: "Elicits maximal oxygen uptake. 6×1 min intervals at MAS pace most effective (Billat 2001).", color: .orange),
        MASZone(name: "Speed", pctRange: 105...120, description: "Supramaximal — anaerobic contribution required. 15s/15s Dupont repeats, strides, hill sprints.", color: .red),
        MASZone(name: "Neuromuscular", pctRange: 120...200, description: "Pure speed development. Short sprints, plyometrics. Very limited volume.", color: .purple),
    ]

    // MARK: - State

    @State private var currentMAS: Double = 0         // km/h
    @State private var currentVO2Max: Double = 0      // ml/kg/min
    @State private var vo2maxHistory: [VO2MaxPoint] = []
    @State private var recentRuns: [RunSession] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Computed

    private var masFormatted: String {
        currentMAS > 0 ? String(format: "%.1f km/h", currentMAS) : "—"
    }

    private var masKmLabel: String {
        guard currentMAS > 0 else { return "—" }
        let paceMinKm = 60 / currentMAS
        let mins = Int(paceMinKm); let secs = Int((paceMinKm - Double(mins)) * 60)
        return String(format: "%d:%02d/km", mins, secs)
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Reading VO₂max history…")
                        .padding(.top, 60)
                } else if currentVO2Max == 0 {
                    noVO2MaxCard
                } else {
                    summaryCard
                    masZonesCard
                    if !vo2maxHistory.isEmpty {
                        vo2maxTrendChart
                    }
                    if !recentRuns.isEmpty {
                        recentRunsCard
                    }
                    intervalProtocolCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("MAS Training Zones")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: String(format: "%.0f", currentVO2Max),
                    label: "VO₂max",
                    sub: "ml/kg/min",
                    color: vo2maxColor
                )
                Divider().frame(height: 44)
                statBox(
                    value: masFormatted,
                    label: "MAS (vVO₂max)",
                    sub: masKmLabel,
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: currentVO2Max > 0 ? vo2maxFitnessLabel : "—",
                    label: "Fitness Level",
                    sub: "ACSM norm",
                    color: vo2maxColor
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "gauge.open.with.lines.needle.67percent")
                    .foregroundStyle(.orange)
                Text("MAS = VO₂max ÷ 3.5. This is your personalized pace reference for structuring all running workouts.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var vo2maxColor: Color {
        switch currentVO2Max {
        case 55...: return .green
        case 45..<55: return .blue
        case 35..<45: return .yellow
        default: return .orange
        }
    }

    private var vo2maxFitnessLabel: String {
        switch currentVO2Max {
        case 60...: return "Elite"
        case 52..<60: return "Excellent"
        case 43..<52: return "Good"
        case 35..<43: return "Fair"
        default: return "Poor"
        }
    }

    // MARK: - MAS Zones Card

    private var masZonesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("MAS Training Zones", systemImage: "dial.high.fill")
                .font(.subheadline).bold()
            Text("All zones derived from your VO₂max. MAS = \(masFormatted). These are personalized paces for each training type.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(Self.zones) { zone in
                HStack(alignment: .center) {
                    Circle()
                        .fill(zone.color)
                        .frame(width: 10, height: 10)
                    VStack(alignment: .leading, spacing: 1) {
                        HStack {
                            Text(zone.name)
                                .font(.caption.bold())
                            Text("(\(Int(zone.pctRange.lowerBound))–\(Int(zone.pctRange.upperBound))% MAS)")
                                .font(.caption2).foregroundStyle(.secondary)
                            Spacer()
                            if currentMAS > 0 {
                                Text(zone.paceRange(mas: currentMAS))
                                    .font(.caption.bold())
                                    .foregroundStyle(zone.color)
                            }
                        }
                        Text(zone.description)
                            .font(.caption2).foregroundStyle(.tertiary)
                            .lineLimit(2)
                    }
                }
                if zone.id != Self.zones.last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - VO2Max Trend Chart

    private var vo2maxTrendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("VO₂max Trend (MAS follows)", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("As VO₂max improves, MAS increases — your training paces should update accordingly. Each 1 ml/kg/min gain in VO₂max = +0.29 km/h MAS.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(vo2maxHistory) { p in
                LineMark(
                    x: .value("Date", p.date),
                    y: .value("VO₂max", p.vo2max)
                )
                .foregroundStyle(Color.orange.gradient)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Date", p.date),
                    y: .value("VO₂max", p.vo2max)
                )
                .foregroundStyle(Color.orange.opacity(0.08))
                .interpolationMethod(.catmullRom)
            }
            .frame(height: 140)
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel(format: .dateTime.month())
                }
            }
            .chartYAxisLabel("VO₂max (ml/kg/min)")
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recent Runs Card

    private var recentRunsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recent Runs — MAS Zone", systemImage: "figure.run")
                .font(.subheadline).bold()

            ForEach(recentRuns.suffix(6).reversed()) { r in
                let zone = r.zone <= Self.zones.count ? Self.zones[r.zone - 1] : Self.zones[0]
                HStack {
                    Circle().fill(zone.color).frame(width: 10, height: 10)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(r.label).font(.caption2).foregroundStyle(.secondary)
                        Text(zone.name).font(.caption.bold()).foregroundStyle(zone.color)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f%% MAS", r.pctMAS))
                            .font(.caption.bold()).foregroundStyle(zone.color)
                        Text(String(format: "%.1f km  ·  %.1f km/h", r.distanceKm, r.avgSpeedKmh))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
                if r.id != recentRuns.suffix(6).reversed().last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Interval Protocol Card

    private var intervalProtocolCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Optimal MAS Interval Protocols", systemImage: "timer")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)

            if currentMAS > 0 {
                let mas = currentMAS
                let masPace = 60 / mas
                let masMin = Int(masPace); let masSec = Int((masPace - Double(masMin)) * 60)
                let supraMax = mas * 1.20
                let supraMaxPace = 60 / supraMax
                let supraMin = Int(supraMaxPace); let supraSec = Int((supraMaxPace - Double(supraMin)) * 60)

                Group {
                    Text("• **Billat Protocol (best VO₂max gains):** 6–10 × 1 min at \(masMin):\(String(format: "%02d", masSec))/km with 1 min rest")
                    Text("• **Dupont 15/15 (Tabata-type):** 30 min alternating 15s at \(supraMin):\(String(format: "%02d", supraSec))/km / 15s walk-jog")
                    Text("• **Cruise Intervals (threshold):** 4 × 2 km at threshold pace \(Self.zones[2].paceRange(mas: mas))")
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }

            Text("Do VO₂max intervals (100% MAS) max 2×/week. Recovery between sessions: 48–72h. Progression: add 1 rep every 2 weeks when last rep feels controlled.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("MAS Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Maximal Aerobic Speed (MAS), also called velocity at VO₂max (vVO₂max), is the minimum running speed that fully elicits oxygen consumption capacity. It is the most scientifically validated reference for structuring running training across all ability levels.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Billat & Koralsztein 1996 (Int J Sports Med): MAS time to exhaustion averages 6 min in well-trained runners. Training at exactly 100% MAS maximally stresses the aerobic system without excessive anaerobic accumulation — the ideal stimulus for VO₂max improvement.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Dupont et al. 2002 (Med Sci Sports Exerc): 15s at 120% MAS / 15s at 40% MAS produced the greatest VO₂max improvement in 5-week training study, surpassing continuous and longer-interval protocols. MAS = VO₂max ÷ 3.5 (based on ~3.5 ml/kg/min O₂ cost per km/h).")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No VO2Max Card

    private var noVO2MaxCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "gauge.open.with.lines.needle.67percent")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("VO₂max data not available")
                .font(.headline)
            Text("MAS training zones require VO₂max data, which Apple Watch (Series 3+) estimates automatically from outdoor runs. Complete a 20-minute outdoor run with Apple Watch to generate your first estimate.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal)
        }
        .padding(40)
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

        let vo2Type      = HKQuantityType(.vo2Max)
        let workoutType  = HKObjectType.workoutType()
        let distType     = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [vo2Type, workoutType, distType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .month, value: -12, to: end) ?? Date()

        // Fetch VO2Max samples
        var vo2Samples: [HKQuantitySample] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: vo2Type, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                vo2Samples = (s as? [HKQuantitySample]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        let vo2Unit = HKUnit(from: "ml/kg/min")
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let history = vo2Samples.map { s in
            VO2MaxPoint(date: s.startDate, label: fmt.string(from: s.startDate),
                        vo2max: s.quantity.doubleValue(for: vo2Unit))
        }

        let currentVO2 = history.last?.vo2max ?? 0
        let currentMASVal = currentVO2 > 0 ? currentVO2 / 3.5 : 0

        // Fetch recent running workouts
        let start90 = calendar.date(byAdding: .day, value: -90, to: end) ?? Date()
        var runWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start90, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, s, _ in
                runWorkouts = ((s as? [HKWorkout]) ?? []).filter { $0.workoutActivityType == .running }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let recentRuns: [RunSession] = runWorkouts.prefix(20).compactMap { w in
            let dist = w.totalDistance?.doubleValue(for: .meter()) ?? 0
            let distKm = dist / 1000
            guard distKm > 0.5, w.duration > 60, currentMASVal > 0 else { return nil }
            let speedKmh = distKm / (w.duration / 3600)
            let pctMAS = (speedKmh / currentMASVal) * 100
            let zoneIdx = Self.zones.firstIndex { pctMAS >= $0.pctRange.lowerBound && pctMAS < $0.pctRange.upperBound } ?? 0
            return RunSession(date: w.startDate, label: fmt.string(from: w.startDate),
                              avgSpeedKmh: speedKmh, distanceKm: distKm,
                              zone: zoneIdx + 1, pctMAS: pctMAS)
        }

        DispatchQueue.main.async {
            self.currentVO2Max   = currentVO2
            self.currentMAS      = currentMASVal
            self.vo2maxHistory   = history
            self.recentRuns      = recentRuns.reversed()
            self.isLoading       = false
        }
    }
}
