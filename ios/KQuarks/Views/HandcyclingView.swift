import SwiftUI
import HealthKit
import Charts

// MARK: - HandcyclingView
// Analyzes handcycling sessions tracked via Apple Watch.
// Handcycling is both an adaptive sport (for wheelchair users / lower-limb
// impairment) and a recreational activity for able-bodied athletes.
// Upper-body cycling physiology differs significantly from leg cycling.
//
// Science:
//   Hettinga et al. 2010 (Med Sci Sports Exerc): handcyclists' VO₂peak
//     20–30 ml/kg/min for untrained vs 35–50+ for elite para-athletes;
//     recumbent handcycling achieves 85–95% of upright cycling VO₂ at same
//     power output due to improved position (recumbent reduces drag & allows
//     higher torque application).
//   Fischer et al. 2014 (Spinal Cord): regular handcycling training improves
//     cardiovascular fitness in SCI users comparably to leg-cycling in able-bodied;
//     12 weeks handcycling → VO₂peak +16%, max power output +24%.
//   Abel et al. 2010 (J Sci Med Sport): arm cranking cadence optimum 70–90 rpm
//     for efficiency; at <60 rpm efficiency drops 15–20%; elite recumbent
//     handcyclists reach 300–400 W at threshold.
//   Tolfrey et al. 2010 (Disabil Rehabil Assist Technol): handcycling at
//     40% VO₂max provides sufficient stimulus for lipid and cardiovascular
//     adaptation in SCI; recommended 3–5 sessions/week, 20–40 min each.
//   Lovell et al. 2012 (Eur J Appl Physiol): shoulder muscle activation
//     during handcycling differs from wheelchair propulsion — lower peak forces,
//     more rhythmic loading, reduced impingement risk. Preferred for cardio
//     training in users with shoulder pain from propulsion.
//
// Handcycling types:
//   Upright (arm-powered): seated upright, hand-cranks at side — common adaptive
//   Recumbent (prone): lying prone on racing bike — elite para-cycling competition
//   Attachment (add-on): front-wheel handcycle attached to wheelchair

struct HandcyclingView: View {

    // MARK: - Models

    struct HandcycleSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionZone: Zone {
            switch kcalPerMin {
            case ..<4:   return .recovery
            case 4..<6:  return .aerobic
            case 6..<9:  return .threshold
            default:     return .race
            }
        }
    }

    enum Zone: String, CaseIterable {
        case recovery  = "Recovery"
        case aerobic   = "Aerobic Base"
        case threshold = "Threshold"
        case race      = "Race Intensity"

        var color: Color {
            switch self {
            case .recovery:  return .blue
            case .aerobic:   return .green
            case .threshold: return .orange
            case .race:      return .red
            }
        }

        var pctVO2: String {
            switch self {
            case .recovery:  return "<55% VO₂peak"
            case .aerobic:   return "55–75% VO₂peak"
            case .threshold: return "75–90% VO₂peak"
            case .race:      return ">90% VO₂peak"
            }
        }
    }

    struct WeekLoad: Identifiable {
        let id = UUID()
        let label: String
        let date: Date
        let kcal: Double
        let sessions: Int
    }

    // MARK: - State

    @State private var sessions: [HandcycleSession] = []
    @State private var weekLoads: [WeekLoad] = []
    @State private var totalKcal: Double = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading handcycling data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    zoneBreakdownCard
                    weeklyLoadChart
                    recentSessionsCard
                    comparisonCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Handcycling")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let thresholdSessions = sessions.filter { $0.sessionZone == .threshold || $0.sessionZone == .race }.count
        let thresholdPct = sessions.isEmpty ? 0.0 : Double(thresholdSessions) / Double(sessions.count) * 100

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(sessions.count)",
                    label: "Sessions",
                    sub: "past 12 months",
                    color: .cyan
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.0f", totalKcal),
                    label: "Total kcal",
                    sub: "all sessions",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.0f%%", thresholdPct),
                    label: "Threshold+",
                    sub: "≥6 kcal/min",
                    color: thresholdPct > 30 ? .orange : .green
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.hand.cycling")
                    .foregroundStyle(.cyan)
                Text(fitnessContext)
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

    private var fitnessContext: String {
        let avgKpm = avgKcalPerMin
        if avgKpm > 7 { return "High-intensity handcycling. Abel 2010: elite recumbent cyclists reach 300–400 W at threshold. Strong upper aerobic capacity." }
        if avgKpm > 5 { return "Good aerobic stimulus. Fischer 2014: 12-week handcycling → VO₂peak +16%, max power +24%. Keep building." }
        if avgKpm > 3 { return "Solid aerobic base. Tolfrey 2010: 40% VO₂max handcycling provides sufficient cardiovascular adaptation. Add some threshold work." }
        return "Light handcycling. Valuable for recovery and base building. Progress toward 3+ sessions/week at moderate intensity."
    }

    // MARK: - Zone Breakdown

    private var zoneBreakdownCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Training Zone Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Classified by kcal/min as % VO₂peak proxy. Abel 2010: optimum cadence 70–90 rpm for handcycling efficiency. Tolfrey 2010: 3–5 sessions/week at aerobic zone sufficient for cardiovascular adaptation in SCI.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(Zone.allCases, id: \.rawValue) { zone in
                let count = sessions.filter { $0.sessionZone == zone }.count
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Text(zone.rawValue).font(.caption2).frame(width: 80, alignment: .leading)
                    Text(zone.pctVO2).font(.caption2).foregroundStyle(.secondary).frame(width: 90, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 8)
                            Capsule().fill(zone.color.gradient).frame(width: geo.size.width * pct / 100, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(count)").font(.caption2.bold()).foregroundStyle(zone.color).frame(width: 24, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Weekly Load Chart

    private var weeklyLoadChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Load (kcal)", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Aim for progressive overload week-over-week. Hettinga 2010: recumbent handcycling achieves 85–95% of upright cycling VO₂ at same power output — highly efficient training modality.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 700 ? Color.cyan.gradient : Color.cyan.opacity(0.5).gradient)
                .cornerRadius(3)
            }
            .frame(height: 120)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recent Sessions

    private var recentSessionsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recent Sessions", systemImage: "list.bullet")
                .font(.subheadline).bold()

            ForEach(sessions.suffix(6).reversed()) { s in
                HStack {
                    Image(systemName: "figure.hand.cycling")
                        .foregroundStyle(s.sessionZone.color)
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.sessionZone.rawValue)
                            .font(.caption.bold()).foregroundStyle(s.sessionZone.color)
                        Text(s.label)
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f min", s.durationMin))
                            .font(.caption.bold())
                        Text(String(format: "%.0f kcal  ·  %.1f/min", s.kcal, s.kcalPerMin))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
                if s.id != sessions.suffix(6).reversed().last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Comparison Card

    private var comparisonCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Handcycling vs. Other Upper-Body Cardio", systemImage: "arrow.left.arrow.right")
                .font(.subheadline).bold()
                .foregroundStyle(.cyan)

            let rows: [(String, String, String)] = [
                ("Recumbent handcycling", "High efficiency", "85–95% of upright cycling VO₂"),
                ("Upright handcycling", "Moderate efficiency", "Common adaptive/rehab use"),
                ("Wheelchair propulsion", "Lower cadence", "Peak shoulder forces higher"),
                ("Arm ergometer", "Lab standard", "Used in VO₂peak testing for SCI"),
                ("Para rowing", "Full upper body", "Seated rowing ergometer"),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { mode, efficiency, note in
                    HStack(alignment: .top) {
                        Text(mode).font(.caption2.bold()).frame(width: 130, alignment: .leading)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(efficiency).font(.caption2.bold()).foregroundStyle(.cyan)
                            Text(note).font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    if mode != "Para rowing" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.cyan.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Handcycling Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Handcycling provides rhythmic, bilateral upper-body aerobic exercise — significantly different from wheelchair propulsion (asymmetric, high peak forces). The cranking motion reduces shoulder impingement risk while delivering high cardiovascular stimulus.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Hettinga et al. 2010 (Med Sci Sports Exerc): recumbent handcycling achieves 85–95% of upright cycling VO₂ at same power — highly efficient. Fischer et al. 2014 (Spinal Cord): 12-week handcycling training → VO₂peak +16%, max power +24% in SCI participants.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Lovell et al. 2012 (Eur J Appl Physiol): handcycling muscle activation pattern shows lower peak shoulder forces vs wheelchair propulsion — preferred cardiovascular exercise for users with shoulder pain. Abel 2010: optimal cadence 70–90 rpm for peak mechanical efficiency.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.cyan.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.hand.cycling")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No handcycling sessions")
                .font(.headline)
            Text("Record handcycling workouts with your Apple Watch to see aerobic zone tracking, session load, and shoulder-friendly cardio insights here.")
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

        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .month, value: -12, to: end) ?? Date()

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    $0.workoutActivityType == .handCycling
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [HandcycleSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return HandcycleSession(date: w.startDate, label: fmt.string(from: w.startDate),
                                    duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            guard let ws = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date)) else { continue }
            let cur = weekMap[ws] ?? (0, 0)
            weekMap[ws] = (cur.kcal + s.kcal, cur.sessions + 1)
        }
        var wCursor = calendar.date(byAdding: .month, value: -3, to: end) ?? Date()
        wCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: wCursor)) ?? wCursor
        var weekLoads: [WeekLoad] = []
        while wCursor <= end {
            let d = weekMap[wCursor] ?? (0, 0)
            weekLoads.append(WeekLoad(label: weekFmt.string(from: wCursor), date: wCursor,
                                      kcal: d.kcal, sessions: d.sessions))
            wCursor = calendar.date(byAdding: .weekOfYear, value: 1, to: wCursor) ?? Date()
        }

        let avgKpm    = sessions.isEmpty ? 0.0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)
        let totalKcal = sessions.map(\.kcal).reduce(0, +)

        DispatchQueue.main.async {
            self.sessions      = sessions
            self.weekLoads     = weekLoads
            self.avgKcalPerMin = avgKpm
            self.totalKcal     = totalKcal
            self.isLoading     = false
        }
    }
}
