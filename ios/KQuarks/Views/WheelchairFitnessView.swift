import SwiftUI
import HealthKit
import Charts

// MARK: - WheelchairFitnessView
// Analyzes wheelchair fitness data from Apple Watch — push rate, distance,
// and caloric expenditure for both wheelchair walking pace and wheelchair
// run pace activities. Apple Watch (Series 3+) has dedicated wheelchair tracking
// with push-detection algorithms calibrated for wheelchair users.
//
// Science:
//   de Groot et al. 2008 (Arch Phys Med Rehabil): wheelchair users with spinal
//     cord injury have significantly elevated cardiovascular disease risk due to
//     reduced upper-body cardiorespiratory capacity; VO₂peak 15–25 ml/kg/min
//     vs 30–50 ml/kg/min in able-bodied peers. Regular wheeling exercise is
//     cardioprotective.
//   Janssen et al. 2002 (Arch Phys Med Rehabil): wheelchair propulsion at
//     recreational pace ≈ 3–5 METs; wheelchair sport (basketball, tennis) ≈ 6–8 METs.
//     Upper-body aerobic training at ≥50% VO₂peak provides cardiovascular benefit.
//   Goosey-Tolfrey et al. 2010 (Int J Sports Med): wheelchair sports improve
//     muscle strength, shoulder stability, and reduce injury risk from daily
//     propulsion; 8-week training increases VO₂peak 12–15%.
//   Bhambhani 2002 (Sports Med): wheelchair racing is among the most
//     physiologically demanding para-sports — elite racers achieve VO₂peak
//     30–45 ml/kg/min; marathon pace pushes lactate to 6–8 mmol/L.
//   van der Woude et al. 2006 (Med Sci Sports Exerc): optimal propulsion mechanics
//     reduce shoulder injury risk; long push strokes at low cadence preferred
//     over short rapid strokes — reduces peak shoulder forces 30–40%.
//
// Apple Watch wheelchair modes:
//   Wheelchair Walk Pace: recreational propulsion, step/push detection
//   Wheelchair Run Pace: faster propulsion, sport and racing

struct WheelchairFitnessView: View {

    // MARK: - Models

    struct WheelSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let mode: WheelMode
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var intensity: IntensityLevel {
            switch kcalPerMin {
            case ..<3:   return .light
            case 3..<5:  return .moderate
            case 5..<8:  return .vigorous
            default:     return .sport
            }
        }
    }

    enum WheelMode: String {
        case walk = "Wheelchair Walk"
        case run  = "Wheelchair Run"

        var color: Color {
            switch self {
            case .walk: return .blue
            case .run:  return .orange
            }
        }

        var icon: String {
            switch self {
            case .walk: return "figure.roll"
            case .run:  return "figure.roll.runningpace"
            }
        }
    }

    enum IntensityLevel: String, CaseIterable {
        case light    = "Light propulsion"
        case moderate = "Moderate wheeling"
        case vigorous = "Vigorous / sport"
        case sport    = "Racing intensity"

        var color: Color {
            switch self {
            case .light:    return .blue
            case .moderate: return .green
            case .vigorous: return .orange
            case .sport:    return .red
            }
        }

        var metRange: String {
            switch self {
            case .light:    return "2–3 METs"
            case .moderate: return "3–5 METs"
            case .vigorous: return "5–8 METs"
            case .sport:    return ">8 METs"
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

    @State private var sessions: [WheelSession] = []
    @State private var weekLoads: [WeekLoad] = []
    @State private var avgKcalPerMin: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading wheelchair data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    modeBreakdownCard
                    weeklyLoadChart
                    recentSessionsCard
                    shoulderHealthCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Wheelchair Fitness")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let runSessions  = sessions.filter { $0.mode == .run }.count
        let walkSessions = sessions.filter { $0.mode == .walk }.count

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(sessions.count)",
                    label: "Sessions",
                    sub: "past 12 months",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(runSessions)",
                    label: "Run Pace",
                    sub: "\(walkSessions) walk pace",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: cardioLabel,
                    color: avgKcalPerMin > 5 ? .orange : .blue
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.roll")
                    .foregroundStyle(.blue)
                Text(cardioContext)
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

    private var cardioLabel: String {
        if avgKcalPerMin > 6 { return "Sport intensity" }
        if avgKcalPerMin > 4 { return "Vigorous cardio" }
        if avgKcalPerMin > 2 { return "Moderate cardio" }
        return "Light activity"
    }

    private var cardioContext: String {
        if avgKcalPerMin > 5 { return "Sport-level intensity. Bhambhani 2002: elite wheelchair racers achieve VO₂peak 30–45 ml/kg/min — comparable to able-bodied recreational athletes." }
        if avgKcalPerMin > 3 { return "Good aerobic stimulus. Goosey-Tolfrey 2010: 8-week training improves VO₂peak 12–15%. Keep building consistency." }
        return "Regular wheelchair propulsion is cardioprotective. de Groot 2008: wheeling exercise reduces CVD risk in SCI users significantly."
    }

    // MARK: - Mode Breakdown

    private var modeBreakdownCard: some View {
        let total = Double(sessions.count)
        let runPct  = total > 0 ? Double(sessions.filter { $0.mode == .run }.count) / total * 100 : 0
        let walkPct = 100 - runPct

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Mode Breakdown", systemImage: "chart.pie.fill")
                .font(.subheadline).bold()

            HStack(spacing: 12) {
                VStack(spacing: 4) {
                    Text(String(format: "%.0f%%", walkPct))
                        .font(.title2.bold()).foregroundStyle(.blue)
                    Text("Walk Pace")
                        .font(.caption2).foregroundStyle(.secondary)
                    Text("Recreation / rehab")
                        .font(.caption2).foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity)

                Divider().frame(height: 60)

                VStack(spacing: 4) {
                    Text(String(format: "%.0f%%", runPct))
                        .font(.title2.bold()).foregroundStyle(.orange)
                    Text("Run Pace")
                        .font(.caption2).foregroundStyle(.secondary)
                    Text("Sport / racing")
                        .font(.caption2).foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 4)

            Text("Janssen 2002: wheelchair sport (basketball, tennis) reaches 6–8 METs — equivalent to vigorous-intensity exercise meeting ACSM guidelines for cardiovascular benefit.")
                .font(.caption2).foregroundStyle(.tertiary)
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
            Text("Consistent weekly propulsion load builds upper-body aerobic capacity and protects against secondary conditions. Goosey-Tolfrey 2010: 8-week intervention shows 12–15% VO₂peak improvement.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 600 ? Color.orange.gradient : Color.blue.opacity(0.7).gradient)
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
                    Image(systemName: s.mode.icon)
                        .foregroundStyle(s.mode.color)
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.mode.rawValue)
                            .font(.caption.bold()).foregroundStyle(s.mode.color)
                        Text("\(s.label) · \(s.intensity.rawValue)")
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

    // MARK: - Shoulder Health Card

    private var shoulderHealthCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Shoulder Health & Propulsion Technique", systemImage: "figure.roll")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)
            Text("Shoulder injury is the most common overuse condition in manual wheelchair users — affecting 50–73% of long-term users (Paralyzed Veterans of America guidelines). Propulsion technique directly impacts risk.")
                .font(.caption).foregroundStyle(.secondary)
            Text("van der Woude et al. 2006 (Med Sci Sports Exerc): long push strokes at low cadence reduce peak shoulder forces 30–40% vs short rapid strokes. Optimal catch angle: 80–90° elbow flexion at top of stroke.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 4) {
                techniqueRow("Long, smooth strokes", "Reduces shoulder load 30–40%", .green)
                techniqueRow("Push-and-glide pattern", "Allows passive shoulder recovery", .green)
                techniqueRow("Avoid short rapid strokes", "Increases joint force, injury risk", .red)
                techniqueRow("Strengthen rotator cuff", "Prevents impingement & instability", .blue)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func techniqueRow(_ tip: String, _ detail: String, _ color: Color) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: color == .red ? "xmark.circle" : "checkmark.circle")
                .foregroundStyle(color).frame(width: 16)
            VStack(alignment: .leading, spacing: 1) {
                Text(tip).font(.caption2.bold())
                Text(detail).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Wheelchair Fitness Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Manual wheelchair users face unique cardiovascular challenges: upper-body muscles (smaller mass than legs) are the primary aerobic engine, limiting VO₂peak relative to able-bodied individuals. Regular wheeling exercise is critical for long-term health.")
                .font(.caption).foregroundStyle(.secondary)
            Text("de Groot et al. 2008 (Arch Phys Med Rehabil): SCI wheelchair users have VO₂peak 15–25 ml/kg/min vs 30–50 in able-bodied; CVD risk significantly elevated. Wheeling at ≥50% VO₂peak is cardioprotective. Janssen 2002: wheelchair sport reaches 6–8 METs — full aerobic training stimulus.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Apple Watch Series 3+: dedicated wheelchair mode uses gyroscope/accelerometer push detection, calibrated step/push counting, and fall detection optimized for wheelchair users. Enables accurate calorie and activity tracking previously unavailable.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.roll")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No wheelchair fitness data")
                .font(.headline)
            Text("Record wheelchair walk or run pace activities with your Apple Watch (Series 3+) to track propulsion load, intensity, and cardiovascular fitness here.")
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
        let start = calendar.date(byAdding: .month, value: -12, to: end)!

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    $0.workoutActivityType == .wheelchairWalkPace ||
                    $0.workoutActivityType == .wheelchairRunPace
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [WheelSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            let mode: WheelMode = w.workoutActivityType == .wheelchairRunPace ? .run : .walk
            return WheelSession(date: w.startDate, label: fmt.string(from: w.startDate),
                                mode: mode, duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            let ws = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date))!
            let cur = weekMap[ws] ?? (0, 0)
            weekMap[ws] = (cur.kcal + s.kcal, cur.sessions + 1)
        }
        var wCursor = calendar.date(byAdding: .month, value: -3, to: end)!
        wCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: wCursor))!
        var weekLoads: [WeekLoad] = []
        while wCursor <= end {
            let d = weekMap[wCursor] ?? (0, 0)
            weekLoads.append(WeekLoad(label: weekFmt.string(from: wCursor), date: wCursor,
                                      kcal: d.kcal, sessions: d.sessions))
            wCursor = calendar.date(byAdding: .weekOfYear, value: 1, to: wCursor)!
        }

        let avgKpm = sessions.isEmpty ? 0.0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)

        DispatchQueue.main.async {
            self.sessions      = sessions
            self.weekLoads     = weekLoads
            self.avgKcalPerMin = avgKpm
            self.isLoading     = false
        }
    }
}
