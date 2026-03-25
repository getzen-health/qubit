import SwiftUI
import HealthKit
import Charts

// MARK: - StepAerobicsView
// Analyzes step training and aerobics sessions recorded via Apple Watch.
// Step aerobics (step training) uses a raised platform (typically 4–12 inches)
// with choreographed movement patterns to create effective cardiovascular
// and lower-body conditioning with joint-friendly impact.
//
// Science:
//   Olson et al. 1996 (J Strength Cond Res): step aerobics at 8" step height
//     produces VO₂ 65–75% VO₂max, HR 75–85% HRmax — equivalent to running
//     at 5–6 mph. Higher step = higher metabolic demand (approx. +10% per 2" height).
//   Reebok Int'l / Olson & Williford 1993: choreographic complexity (basic vs
//     propulsion moves vs directional changes) increases oxygen cost 10–20%
//     independent of step height. Complex patterns require greater motor unit
//     recruitment and stability demands.
//   Macfarlane & Wong 2012 (J Sci Med Sport): 8-week step aerobics class
//     (3×/week, 50 min) improved VO₂max 9%, reduced resting HR 5 bpm,
//     and improved functional balance scores 15% in previously sedentary adults.
//   Lossing et al. 1997: step aerobics is lower-impact than floor aerobics —
//     peak tibial force 1.5–1.8× bodyweight vs 2–3× for floor aerobics/jogging.
//     Suitable for users with shin splints or knee sensitivity to running.
//   Segal et al. 2004 (Med Sci Sports Exerc): balance board step training
//     enhances ankle proprioception 25% vs standard step; combined cardio +
//     proprioception benefit makes step training particularly valuable for
//     fall prevention in older adults.
//
// Step height and metabolic impact:
//   4" (10 cm):  Light — comparable to brisk walking
//   6" (15 cm):  Moderate — 55–65% VO₂max
//   8" (20 cm):  Vigorous — 65–75% VO₂max (most common class height)
//   10" (25 cm): High — 75–85% VO₂max
//   12" (30 cm): Elite — only for advanced, high fitness levels

struct StepAerobicsView: View {

    // MARK: - Models

    struct StepSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var intensity: Intensity {
            switch kcalPerMin {
            case ..<4:   return .light
            case 4..<6:  return .moderate
            case 6..<9:  return .vigorous
            default:     return .highIntensity
            }
        }
    }

    enum Intensity: String, CaseIterable {
        case light        = "Light (4\" step / basic)"
        case moderate     = "Moderate (6\" step)"
        case vigorous     = "Vigorous (8\" step)"
        case highIntensity = "High Intensity (10–12\" step)"

        var color: Color {
            switch self {
            case .light:         return .blue
            case .moderate:      return .green
            case .vigorous:      return .orange
            case .highIntensity: return .red
            }
        }

        var vo2Pct: String {
            switch self {
            case .light:         return "45–55% VO₂max"
            case .moderate:      return "55–65% VO₂max"
            case .vigorous:      return "65–75% VO₂max"
            case .highIntensity: return "75–85% VO₂max"
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

    @State private var sessions: [StepSession] = []
    @State private var weekLoads: [WeekLoad] = []
    @State private var avgKcalPerMin: Double = 0
    @State private var totalMinutes: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading step training data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    intensityBreakdownCard
                    weeklyLoadChart
                    recentSessionsCard
                    benefitsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Step Aerobics")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let vigorousSessions = sessions.filter { $0.intensity == .vigorous || $0.intensity == .highIntensity }.count
        let totalHours = totalMinutes / 60

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: "\(sessions.count)",
                    label: "Sessions",
                    sub: "past 12 months",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.0f h", totalHours),
                    label: "Total Time",
                    sub: "step training",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: "\(vigorousSessions)",
                    label: "Vigorous",
                    sub: "≥6 kcal/min",
                    color: vigorousSessions > sessions.count / 2 ? .orange : .green
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.step.training")
                    .foregroundStyle(.orange)
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
        if avgKcalPerMin > 7 { return "High-intensity step training — Olson 1996: vigorous step (8\") equals running 5–6 mph. Strong cardiovascular stimulus." }
        if avgKcalPerMin > 5 { return "Solid aerobic zone. Macfarlane 2012: 8-week step aerobics 3×/week → VO₂max +9%, resting HR -5 bpm." }
        if avgKcalPerMin > 3 { return "Moderate step activity. Lossing 1997: step aerobics is lower-impact than floor aerobics — peak tibial force 1.5–1.8× BW vs 2–3× for running." }
        return "Light step training — great for beginners and recovery. Segal 2004: step training improves ankle proprioception 25% — valuable for fall prevention."
    }

    // MARK: - Intensity Breakdown

    private var intensityBreakdownCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Intensity Distribution", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Classified by kcal/min as proxy for step height and choreography complexity. Olson 1996: choreographic complexity adds 10–20% oxygen cost beyond step height alone.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(Intensity.allCases, id: \.rawValue) { lvl in
                let count = sessions.filter { $0.intensity == lvl }.count
                let pct = total > 0 ? Double(count) / total * 100 : 0
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(lvl.rawValue).font(.caption2.bold()).foregroundStyle(lvl.color)
                        Spacer()
                        Text(lvl.vo2Pct).font(.caption2).foregroundStyle(.secondary)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 8)
                            Capsule().fill(lvl.color.gradient).frame(width: geo.size.width * pct / 100, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(count) sessions").font(.caption2).foregroundStyle(.tertiary)
                }
                .padding(.vertical, 2)
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
            Label("Weekly Step Training Load (kcal)", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Target 3 sessions/week for cardiovascular benefit (Macfarlane 2012). WHO guideline: 150 min/week moderate or 75 min/week vigorous aerobic activity — step training counts fully.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 600 ? Color.orange.gradient : Color.orange.opacity(0.5).gradient)
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
                    Image(systemName: "figure.step.training")
                        .foregroundStyle(s.intensity.color)
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.intensity.rawValue)
                            .font(.caption.bold()).foregroundStyle(s.intensity.color)
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

    // MARK: - Benefits Card

    private var benefitsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Why Step Training Works", systemImage: "checkmark.seal.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)

            let benefits: [(String, String, Color)] = [
                ("Lower impact", "Peak tibial force 1.5–1.8× BW vs 2–3× for running (Lossing 1997)", .green),
                ("VO₂max gains", "9% improvement in 8 weeks at 3×/week, 50 min (Macfarlane 2012)", .blue),
                ("Heart rate", "75–85% HRmax at 8\" height — full aerobic training zone", .red),
                ("Balance", "Step training improves proprioception 25% (Segal 2004)", .purple),
                ("Joint-friendly", "No jumping required — suitable for knee/shin sensitivity", .teal),
            ]

            VStack(spacing: 6) {
                ForEach(benefits, id: \.0) { benefit, detail, color in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(color).frame(width: 16)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(benefit).font(.caption2.bold())
                            Text(detail).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Step Training Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Step aerobics emerged in the 1980s from cardiac rehabilitation and has been validated as effective cardiovascular conditioning across multiple decades of research. It uniquely combines aerobic intensity with low joint loading and coordination demands.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Olson et al. 1996 (J Strength Cond Res): 8\" step training at 122 bpm music tempo produces VO₂ 65–75% VO₂max — equivalent to running 5–6 mph. Choreographic complexity (propulsion moves, directional changes) adds 10–20% oxygen cost independently.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Segal et al. 2004 (Med Sci Sports Exerc): step training's proprioceptive benefits make it particularly valuable for older adults — 25% improvement in ankle proprioception reduces fall risk. Apple Watch tracks HR and calorie burn throughout each session for accurate load monitoring.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.step.training")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No step training sessions")
                .font(.headline)
            Text("Record step aerobics or step training workouts with your Apple Watch to see intensity analysis, cardiovascular load, and balance benefits here.")
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
                    $0.workoutActivityType == .stepTraining
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [StepSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return StepSession(date: w.startDate, label: fmt.string(from: w.startDate),
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
        let totalMin  = sessions.map(\.durationMin).reduce(0, +)

        DispatchQueue.main.async {
            self.sessions      = sessions
            self.weekLoads     = weekLoads
            self.avgKcalPerMin = avgKpm
            self.totalMinutes  = totalMin
            self.isLoading     = false
        }
    }
}
