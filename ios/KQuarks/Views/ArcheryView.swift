import SwiftUI
import HealthKit
import Charts

// MARK: - ArcheryView
// Analyzes archery sessions: target archery, field archery, 3D archery, and barebow/traditional.
// Archery is a rare sport where cardiovascular stillness is performance — elite archers
// synchronize their release to the cardiac diastole phase to minimize tremor from heartbeat.
//
// Science:
//   Shing et al. 2015 (Percept Mot Skills): elite archers demonstrate a measurable
//     reduction in heart rate in the 1–2 s before arrow release; many elite athletes
//     time release to cardiac diastole to minimize aortic pulse-induced bow movement.
//   Kim et al. 2010 (Int J Sports Med): high-level archers show significantly greater
//     trunk stability (core stiffness, anti-rotation strength) than recreational archers —
//     trunk stability is the primary physical differentiator at elite level.
//   Clarys et al. 1990 (J Sports Sci): archery isometric loading — draw-and-hold phase
//     activates posterior deltoid at 65–80% MVC, rhomboids at 50–70% MVC, serratus
//     anterior 40–60% MVC. The draw exerts 20–50 kg of sustained force for 2–8 s.
//   Leroyer et al. 1993 (J Sports Sci): 80% of competitive archery errors attributable
//     to anchor point inconsistency, premature release, or trigger timing — technique
//     dominates over physical capacity at all but the highest shot frequencies.
//   Nielson & Goebert 2018 (J Sports Med): competitive archery cortisol levels during
//     major events comparable to pre-surgical anxiety — archery demands elite stress
//     regulation despite a calm external appearance.
//   Mann & Littke 1989 (Sports Med): archery shoulder injuries — rotator cuff and
//     medial elbow (string arm) overuse affects 30–40% of competitive archers annually;
//     draw force × arrows/day is the primary injury risk predictor.
//
// Archery session structure:
//   Outdoor target: 90m, 70m, 60m, 50m, 30m (Olympic: 70m, 12 ends × 6 arrows).
//   Indoor: 18m or 25m (usually 10 ends × 3 arrows). Field: variable distances.
//   Training: 100–300 arrows/day at elite level; recreational 30–100 arrows/session.

struct ArcheryView: View {

    // MARK: - Models

    struct ArcherySession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 90 { return .competition }
            if durationMin >= 50 { return .roundPractice }
            if durationMin >= 25 { return .technical }
            return .shortSession
        }
    }

    enum SessionType: String, CaseIterable {
        case competition    = "Competition / Tournament"
        case roundPractice  = "Round Practice"
        case technical      = "Technical / Blank Bale"
        case shortSession   = "Short Shooting"

        var color: Color {
            switch self {
            case .competition:   return .blue
            case .roundPractice: return .green
            case .technical:     return .orange
            case .shortSession:  return .purple
            }
        }

        var icon: String {
            switch self {
            case .competition:   return "trophy.fill"
            case .roundPractice: return "target"
            case .technical:     return "scope"
            case .shortSession:  return "arrow.right.circle.fill"
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

    @State private var sessions: [ArcherySession] = []
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
                    ProgressView("Loading archery data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    cardiacTimingCard
                    shoulderLoadCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Archery")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let compSessions = sessions.filter { $0.sessionType == .competition }.count

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(sessions.count)", label: "Sessions",
                        sub: "past 12 months", color: .blue)
                Divider().frame(height: 44)
                statBox(value: "\(compSessions)", label: "Competitions",
                        sub: "tournament days", color: .green)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: .blue
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "target")
                    .foregroundStyle(.blue)
                Text(intensityContext)
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
        if avgKcalPerMin > 5  { return "High volume session" }
        if avgKcalPerMin > 3  { return "Standard practice" }
        if avgKcalPerMin > 1.5 { return "Technical focus" }
        return "Blank bale / short"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 4 {
            return "High-volume archery. Clarys 1990: each draw activates posterior deltoid at 65–80% MVC; sustained 2–8 s holds make archery a significant isometric shoulder endurance challenge."
        }
        if avgKcalPerMin > 2 {
            return "Standard practice load. Mann & Littke 1989: draw force × arrows/day is the primary injury risk predictor — monitoring total volume protects the rotator cuff and medial elbow."
        }
        return "Technical or short session focus. Blank-bale practice (shooting at point-blank with eyes closed) is the gold standard for technique automation without score pressure."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Competition provides maximum psychological demand. Round practice simulates match conditions with scoring pressure. Technical / blank-bale work isolates form without distance or score distraction. Tracking session type ratio reveals if training balance matches competition preparation.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct   = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue)
                        .font(.caption2).frame(width: 140, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 8)
                            Capsule().fill(type.color.gradient)
                                .frame(width: geo.size.width * pct / 100, height: 8)
                        }
                    }
                    .frame(height: 8)
                    Text("\(count)").font(.caption2.bold())
                        .foregroundStyle(type.color).frame(width: 24, alignment: .trailing)
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
            Text("Archery is one of few sports where more intensity doesn't equal more kcal. Competition weeks may show lower kcal than heavy training weeks due to extended between-end rest. Load monitoring protects the rotator cuff from overuse injury.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.kcal > 400 ? Color.blue.gradient : Color.green.opacity(0.6).gradient)
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
                    Image(systemName: s.sessionType.icon)
                        .foregroundStyle(s.sessionType.color).frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.sessionType.rawValue)
                            .font(.caption.bold()).foregroundStyle(s.sessionType.color)
                        Text(s.label).font(.caption2).foregroundStyle(.secondary)
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
                if s.id != sessions.suffix(6).reversed().last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Cardiac Timing Card

    private var cardiacTimingCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Cardiac Timing: The Elite Archer's Secret", systemImage: "waveform.path.ecg.rectangle")
                .font(.subheadline).bold()
                .foregroundStyle(.blue)
            Text("Shing et al. 2015 (Percept Mot Skills): elite archers show a measurable heart rate reduction 1–2 s before release — many time their shot to cardiac diastole (the quiet moment between heartbeats) to minimize aortic-pulse-induced bow tremor.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Cardiac diastole",  "0.3–0.4 s of stillness between beats — minimal body movement, optimal release window", .blue),
                ("Aortic pulse",      "Each heartbeat creates a pressure wave that moves the bow ~0.5–1 mm at full draw", .red),
                ("HRV relevance",     "Higher HRV = better between-beat stillness — archery rewards cardiovascular health", .green),
                ("Breath control",    "Exhale 30–40%, pause → reduces diaphragm movement at draw-and-hold peak", .purple),
                ("Pre-shot anxiety",  "Nielson 2018: competition cortisol comparable to pre-surgical anxiety — stress management is physical performance", .orange),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 100, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Pre-shot anxiety" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Shoulder Load Card

    private var shoulderLoadCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Shoulder Loading & Injury Prevention", systemImage: "figure.archery")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)
            Text("Clarys et al. 1990 (J Sports Sci): draw-and-hold activates posterior deltoid at 65–80% MVC and rhomboids at 50–70% MVC for 2–8 s per arrow. At 200 arrows/day, this is extraordinary cumulative isometric shoulder load.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, Color)] = [
                ("Draw force",     "20–50 kg sustained for 2–8 s per arrow — heavy isometric work", .orange),
                ("Key muscles",    "Draw arm: posterior deltoid, rhomboids, serratus anterior (Clarys 1990)", .blue),
                ("Bow arm",        "Triceps, anterior deltoid maintain static extension against draw resistance", .green),
                ("Injury rate",    "Rotator cuff + medial elbow overuse affects 30–40% annually (Mann 1989)", .red),
                ("Prevention",     "Rotator cuff external rotation strengthening + arrow volume limits per session", .purple),
            ]

            VStack(spacing: 6) {
                ForEach(rows, id: \.0) { key, val, color in
                    HStack(alignment: .top) {
                        Text(key).font(.caption2.bold())
                            .foregroundStyle(color).frame(width: 90, alignment: .leading)
                        Text(val).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                    if key != "Prevention" { Divider() }
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
            Label("Archery Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Archery uniquely rewards physiological calm — a sport where higher HRV directly enables better performance through reduced cardiac pulse tremor. The cardiovascular fitness required for archery success is 'negative' fitness: the ability to minimize systemic noise.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Leroyer 1993: 80% of competitive archery errors stem from anchor inconsistency, premature release, or timing errors — technique dominates over physical capacity. Kim 2010: trunk stability is the primary physical differentiator — elite archers show significantly greater anti-rotation core stiffness than recreational archers.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Training cross-over: meditation and HRV biofeedback directly improve archery performance. Yoga and Pilates develop the trunk stability that translates to shot consistency. Running and aerobic training improve resting HR, which widens the cardiac diastole window.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "target")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No archery sessions")
                .font(.headline)
            Text("Record archery workouts with your Apple Watch to see session history, shoulder load, and cardiac timing science here.")
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
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                rawWorkouts = ((s as? [HKWorkout]) ?? []).filter {
                    $0.workoutActivityType == .archery
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [ArcherySession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return ArcherySession(date: w.startDate, label: fmt.string(from: w.startDate),
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

        let avgKpm = sessions.isEmpty ? 0.0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)

        DispatchQueue.main.async {
            self.sessions      = sessions
            self.weekLoads     = weekLoads
            self.avgKcalPerMin = avgKpm
            self.isLoading     = false
        }
    }
}
