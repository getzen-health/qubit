import SwiftUI
import HealthKit
import Charts

// MARK: - TrackAndFieldView
// Analyzes track and field sessions recorded via Apple Watch.
// Track & field encompasses sprinting, middle-distance, hurdles, steeplechase,
// and combined events — each with distinct physiological demands.
//
// Science:
//   Haugen et al. 2019 (Int J Sports Physiol Perform): elite 100m sprinters
//     reach peak velocity at 60–80 m; ground contact time ≤ 80 ms distinguishes
//     world-class from good sprinters. Stride frequency 4.5–5.0 Hz at top speed.
//   Billat 2001 (Sports Med): VO₂max sessions at 100% vVO₂max improve
//     running economy 2–5% over 4–6 weeks. Middle distance athletes benefit most
//     from 60-s intervals at vVO₂max with 60-s recovery.
//   Weyand et al. 2000 (J Appl Physiol): maximum sprinting speed is primarily
//     limited by ground force application, not stride frequency — mass-specific
//     ground forces 2.5× bodyweight distinguish sprinters from distance runners.
//   Jones & Carter 2000 (Sports Med): aerobic to anaerobic transition in track
//     disciplines: 100m ≈ 30% aerobic / 70% anaerobic; 400m ≈ 45/55; 800m ≈ 60/40;
//     1500m ≈ 75/25; 5000m ≈ 92/8.
//   Bompa & Haff 2009 (Periodization): sprint athletes peak with 6–8 week
//     competition phase after 16–20 weeks of GPP + SPP; middle distance athletes
//     use 4-week mesocycles of base → threshold → speed → taper.
//
// Energy systems by event:
//   ATP-PCr (0–10 s): 100m, shot put, long jump
//   Glycolytic (10–90 s): 200m, 400m
//   Aerobic (>90 s): 800m through marathon

struct TrackAndFieldView: View {

    // MARK: - Models

    struct TrackSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var discipline: Discipline {
            switch durationMin {
            case ..<4:    return .sprint
            case 4..<12:  return .middleDistance
            case 12..<30: return .distance
            default:      return .endurance
            }
        }
    }

    enum Discipline: String, CaseIterable {
        case sprint        = "Sprint (<4 min)"
        case middleDistance = "Middle Distance"
        case distance      = "Distance"
        case endurance     = "Long Endurance"

        var color: Color {
            switch self {
            case .sprint:        return .red
            case .middleDistance: return .orange
            case .distance:      return .blue
            case .endurance:     return .green
            }
        }

        var energySystem: String {
            switch self {
            case .sprint:        return "ATP-PCr + glycolytic"
            case .middleDistance: return "Glycolytic + aerobic"
            case .distance:      return "Primarily aerobic"
            case .endurance:     return "Fully aerobic"
            }
        }

        var vo2Pct: String {
            switch self {
            case .sprint:        return "30–45% aerobic"
            case .middleDistance: return "45–75% aerobic"
            case .distance:      return "75–90% aerobic"
            case .endurance:     return ">90% aerobic"
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

    @State private var sessions: [TrackSession] = []
    @State private var weekLoads: [WeekLoad] = []
    @State private var vo2MaxSamples: [(date: Date, val: Double)] = []
    @State private var avgKcalPerMin: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading track sessions…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    disciplineBreakdownCard
                    weeklyLoadChart
                    if !vo2MaxSamples.isEmpty { vo2MaxCard }
                    recentSessionsCard
                    energySystemsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Track & Field")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let sprints   = sessions.filter { $0.discipline == .sprint }.count
        let midDist   = sessions.filter { $0.discipline == .middleDistance }.count

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
                    value: "\(sprints)",
                    label: "Sprint",
                    sub: "\(midDist) mid-dist",
                    color: .red
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: avgKcalPerMin > 12 ? .red : .orange
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.run")
                    .foregroundStyle(.orange)
                Text(sessionContext)
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

    private var intensityLabel: String {
        if avgKcalPerMin > 14 { return "Elite sprint" }
        if avgKcalPerMin > 10 { return "High intensity" }
        if avgKcalPerMin > 7  { return "Moderate-high" }
        return "Moderate"
    }

    private var sessionContext: String {
        let sprints = sessions.filter { $0.discipline == .sprint }.count
        let pct = sessions.isEmpty ? 0 : Double(sprints) / Double(sessions.count) * 100
        if pct > 50 { return "Sprint-dominant training. Jones & Carter 2000: 100m sessions ≈ 70% anaerobic; prioritize ATP-PCr recovery (3–10 min between reps)." }
        if pct > 25 { return "Mixed track training. Blend sprint power development with aerobic base for mid-distance performance." }
        return "Distance-dominant. Billat 2001: 4–6 weeks at vVO₂max pace improves running economy 2–5%."
    }

    // MARK: - Discipline Breakdown

    private var disciplineBreakdownCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Duration-based discipline classification. Sprint (<4 min) targets ATP-PCr + lactate systems; middle distance (4–12 min) bridges glycolytic and aerobic; distance (>12 min) develops VO₂max base.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(Discipline.allCases, id: \.rawValue) { disc in
                let count = sessions.filter { $0.discipline == disc }.count
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Text(disc.rawValue)
                        .font(.caption2)
                        .frame(width: 100, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 10)
                            Capsule().fill(disc.color.gradient).frame(width: geo.size.width * pct / 100, height: 10)
                        }
                    }
                    .frame(height: 10)
                    Text("\(count)")
                        .font(.caption2.bold()).foregroundStyle(disc.color)
                        .frame(width: 28, alignment: .trailing)
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
            Text("Track training load by week. Bompa & Haff 2009: periodize in 3–4 week mesocycles with progressive overload, followed by a deload week at 60% volume to consolidate adaptation.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 1000 ? Color.orange.gradient : Color.red.opacity(0.6).gradient)
                .cornerRadius(3)
            }
            .frame(height: 120)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - VO2 Max Card

    private var vo2MaxCard: some View {
        let latest = vo2MaxSamples.last?.val ?? 0
        let vo2Class: String = {
            switch latest {
            case ..<30: return "Low"
            case 30..<40: return "Fair"
            case 40..<50: return "Good"
            case 50..<60: return "Excellent"
            default:     return "Elite"
            }
        }()
        let vo2Color: Color = latest >= 55 ? .green : latest >= 45 ? .blue : latest >= 35 ? .orange : .red

        return VStack(alignment: .leading, spacing: 10) {
            Label("VO₂ Max Trend", systemImage: "lungs.fill")
                .font(.subheadline).bold()

            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(String(format: "%.1f", latest))
                        .font(.title2.bold()).foregroundStyle(vo2Color)
                    Text("ml/kg/min — \(vo2Class)")
                        .font(.caption2).foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("MAS ≈ \(String(format: "%.1f", latest / 3.5)) km/h")
                        .font(.caption.bold()).foregroundStyle(.orange)
                    Text("vVO₂max (minimum speed at VO₂max)")
                        .font(.caption2).foregroundStyle(.secondary)
                }
            }

            Chart(vo2MaxSamples.suffix(12), id: \.date) { s in
                LineMark(
                    x: .value("Date", s.date),
                    y: .value("VO₂max", s.val)
                )
                .foregroundStyle(Color.orange.gradient)
                .symbol(.circle)
            }
            .frame(height: 100)
            .chartYAxisLabel("ml/kg/min")

            Text("Billat 2001 (Sports Med): interval sessions at 100% vVO₂max for 60 s (work:rest 1:1) are most effective at increasing VO₂max in middle-distance athletes. Target 4–6 sessions over 3 weeks.")
                .font(.caption2).foregroundStyle(.tertiary)
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
                    Image(systemName: discIcon(s.discipline))
                        .foregroundStyle(s.discipline.color)
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.discipline.rawValue)
                            .font(.caption.bold()).foregroundStyle(s.discipline.color)
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

    private func discIcon(_ d: Discipline) -> String {
        switch d {
        case .sprint:         return "hare.fill"
        case .middleDistance: return "figure.run"
        case .distance:       return "figure.walk"
        case .endurance:      return "arrow.clockwise.circle"
        }
    }

    // MARK: - Energy Systems Card

    private var energySystemsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Energy Systems by Event", systemImage: "bolt.circle.fill")
                .font(.subheadline).bold()
            Text("Jones & Carter 2000 (Sports Med): energy contribution by event type.")
                .font(.caption2).foregroundStyle(.secondary)

            let rows: [(String, String, String, Color)] = [
                ("100–200m", "Sprint", "~30% aerobic / 70% anaerobic", .red),
                ("400m", "Glycolytic", "~45% aerobic / 55% anaerobic", .orange),
                ("800–1500m", "Mixed", "60–75% aerobic", .yellow),
                ("5000m+", "Distance", ">90% aerobic", .blue),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { event, type, split, color in
                    HStack(spacing: 8) {
                        Text(event)
                            .font(.caption2.bold()).foregroundStyle(color)
                            .frame(width: 70, alignment: .leading)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(type).font(.caption2.bold())
                            Text(split).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    if event != "5000m+" { Divider() }
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
            Label("Track & Field Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Track & field demands are unique: sprint events are almost entirely anaerobic with ATP-PCr and glycolytic systems, while distance events rely on aerobic machinery. Each discipline requires distinct training emphasis.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Haugen et al. 2019 (IJSPP): elite 100m sprinters reach peak velocity at 60–80 m with ground contact time ≤80 ms. Weyand et al. 2000 (J Appl Physiol): maximum sprint speed is limited by ground force application (2.5× bodyweight) — not stride frequency.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Bompa & Haff 2009 (Periodization): 4-week mesocycles with progressive overload, followed by deload week. Sprint athletes: 6–8 week competition phase after 16–20 weeks base + specific preparation.")
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
            Image(systemName: "figure.run.circle")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No track & field sessions")
                .font(.headline)
            Text("Record track workouts with your Apple Watch to see sprint vs. distance breakdown, energy system analysis, and periodization tracking here.")
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
        let vo2Type     = HKQuantityType(.vo2Max)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, vo2Type])) != nil else {
            isLoading = false; return
        }

        let end   = Date()
        let start = calendar.date(byAdding: .month, value: -12, to: end) ?? Date()

        // Load track workouts
        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    $0.workoutActivityType == .trackAndField
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        // Load VO2max samples
        var vo2Samples: [(date: Date, val: Double)] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: vo2Type, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                vo2Samples = ((s as? [HKQuantitySample]) ?? []).map {
                    (date: $0.startDate, val: $0.quantity.doubleValue(for: HKUnit(from: "ml/kg/min")))
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [TrackSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return TrackSession(date: w.startDate, label: fmt.string(from: w.startDate),
                                duration: w.duration, kcal: kcal)
        }

        // Weekly load (3-month window)
        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            let ws = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date))!
            let cur = weekMap[ws] ?? (0, 0)
            weekMap[ws] = (cur.kcal + s.kcal, cur.sessions + 1)
        }
        var wCursor = calendar.date(byAdding: .month, value: -3, to: end) ?? Date()
        wCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: wCursor))!
        var weekLoads: [WeekLoad] = []
        while wCursor <= end {
            let d = weekMap[wCursor] ?? (0, 0)
            weekLoads.append(WeekLoad(label: weekFmt.string(from: wCursor), date: wCursor,
                                      kcal: d.kcal, sessions: d.sessions))
            wCursor = calendar.date(byAdding: .weekOfYear, value: 1, to: wCursor) ?? Date()
        }

        let avgKpm = sessions.isEmpty ? 0.0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)

        DispatchQueue.main.async {
            self.sessions       = sessions
            self.weekLoads      = weekLoads
            self.vo2MaxSamples  = vo2Samples
            self.avgKcalPerMin  = avgKpm
            self.isLoading      = false
        }
    }
}
