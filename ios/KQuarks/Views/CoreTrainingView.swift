import SwiftUI
import HealthKit
import Charts

// MARK: - CoreTrainingView
// Analyzes core training sessions: planks, McGill Big 3, ab circuits, stability work.
// Core training is one of the most misunderstood areas of exercise science — most people
// train the "mirror muscles" (rectus abdominis) while neglecting the true stabilizers
// (multifidus, transverse abdominis, quadratus lumborum) that protect the spine.
//
// Science:
//   McGill et al. 2009 (Clin Biomech): The "Big 3" (curl-up, side plank, bird-dog)
//     provides maximum lumbar spine stability with minimum compression; McGill argues
//     these three exercises alone can address most core training needs safely.
//   Hides et al. 1996 (Spine): lumbar multifidus cross-sectional area decreases
//     rapidly (within 2 weeks) after a first episode of back pain and does NOT
//     spontaneously recover — specific rehabilitation training is required.
//   Willardson 2007 (J Strength Cond Res): unstable surface training (BOSU balls,
//     stability discs) increases muscle EMG activation but reduces maximal force output
//     by 20–30% — trade-off between stability challenge and strength development.
//   Schoenfeld & Kolber 2016 (JSCR): abdominal training frequency — daily core
//     training is effective since core muscles are predominantly slow-twitch and
//     recover faster than prime movers (24 h vs 48–72 h for large muscle groups).
//   Reed et al. 2012 (J Orthop Sports Phys Ther): 12-week specific core stabilization
//     training reduced chronic low back pain intensity 35% and disability score 28%;
//     general exercise produced 18% and 15% respectively — targeted work wins.
//   Stokes et al. 2010 (Scand J Med Sci Sports): 6-week core training program
//     improved 3000 m running performance 4.6% through improved trunk stiffness
//     reducing energy leakage between ground contact and forward propulsion.
//
// Core anatomy:
//   Inner unit (stabilizers): transverse abdominis, multifidus, pelvic floor, diaphragm.
//   Outer unit (global movers): rectus abdominis, obliques, erector spinae, glutes.
//   Optimal training: develop inner unit first (breathing, bracing), then outer unit.

struct CoreTrainingView: View {

    // MARK: - Models

    struct CoreSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let duration: TimeInterval
        let kcal: Double
        var durationMin: Double { duration / 60 }
        var kcalPerMin: Double { duration > 0 ? kcal / durationMin : 0 }

        var sessionType: SessionType {
            if durationMin >= 35 { return .dedicated }
            if durationMin >= 20 { return .standard }
            if durationMin >= 10 { return .quickBlast }
            return .activation
        }
    }

    enum SessionType: String, CaseIterable {
        case dedicated  = "Dedicated Session (35+ min)"
        case standard   = "Standard Core (20–35 min)"
        case quickBlast = "Quick Core Blast (10–20 min)"
        case activation = "Activation / Warm-Up"

        var color: Color {
            switch self {
            case .dedicated:  return .blue
            case .standard:   return .green
            case .quickBlast: return .orange
            case .activation: return .teal
            }
        }

        var icon: String {
            switch self {
            case .dedicated:  return "figure.core.training"
            case .standard:   return "figure.core.training"
            case .quickBlast: return "bolt.fill"
            case .activation: return "flame"
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

    @State private var sessions: [CoreSession] = []
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
                    ProgressView("Loading core training data…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    sessionTypeCard
                    weeklyLoadChart
                    recentSessionsCard
                    mcGillBig3Card
                    anatomyCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Core Training")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let totalSessions = sessions.count
        let thisMonthSessions = sessions.filter {
            Calendar.current.isDate($0.date, equalTo: Date(), toGranularity: .month)
        }.count

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(value: "\(totalSessions)", label: "Sessions",
                        sub: "past 12 months", color: .blue)
                Divider().frame(height: 44)
                statBox(value: "\(thisMonthSessions)", label: "This Month",
                        sub: "sessions", color: .green)
                Divider().frame(height: 44)
                statBox(
                    value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "—",
                    label: "kcal/min",
                    sub: intensityLabel,
                    color: .orange
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: "figure.core.training")
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
        if avgKcalPerMin > 6  { return "High intensity circuit" }
        if avgKcalPerMin > 4  { return "Active core work" }
        if avgKcalPerMin > 2  { return "Moderate stability" }
        return "Isometric / slow"
    }

    private var intensityContext: String {
        if avgKcalPerMin > 5 {
            return "High-intensity core circuits. Schoenfeld 2016: core muscles are predominantly slow-twitch and recover in ~24 h — daily training is effective and safe unlike large prime movers."
        }
        if avgKcalPerMin > 3 {
            return "Moderate core work. Reed 2012: targeted core stabilization training reduced chronic LBP intensity 35% vs 18% for general exercise — specificity matters."
        }
        return "Isometric stability focus. McGill 2009: curl-up, side plank, bird-dog (the Big 3) provides maximum lumbar stability with minimum spinal compression — optimal for spine health."
    }

    // MARK: - Session Type Card

    private var sessionTypeCard: some View {
        let total = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Breakdown", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Dedicated core sessions (35+ min) allow progressive overload of stabilizers. Standard sessions maintain strength during busy weeks. Quick blasts (10–20 min) appended to other workouts provide cumulative benefit. Activation work pre-session fires the inner unit before loading.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach(SessionType.allCases, id: \.rawValue) { type in
                let count = sessions.filter { $0.sessionType == type }.count
                let pct   = total > 0 ? Double(count) / total * 100 : 0
                HStack(spacing: 8) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color).frame(width: 18)
                    Text(type.rawValue)
                        .font(.caption2).frame(width: 150, alignment: .leading)
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
            Label("Weekly Volume (kcal)", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Core muscles (primarily slow-twitch type I fibers) tolerate daily training — unlike larger prime movers that need 48–72 h recovery. Stokes 2010: 6 weeks of core training improved 3000 m running performance 4.6% through reduced energy leakage.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(weekLoads) { w in
                BarMark(
                    x: .value("Week", w.label),
                    y: .value("kcal", w.kcal)
                )
                .foregroundStyle(w.sessions >= 4 ? Color.blue.gradient : Color.green.opacity(0.7).gradient)
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

    // MARK: - McGill Big 3 Card

    private var mcGillBig3Card: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("McGill's Big 3: Evidence-Based Core", systemImage: "3.circle.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.blue)
            Text("McGill et al. 2009 (Clin Biomech): these three exercises provide maximum lumbar spine stability with minimum compressive load — safer and more effective than crunches, sit-ups, or unstable surface work for spine health.")
                .font(.caption).foregroundStyle(.secondary)

            let rows: [(String, String, String, Color)] = [
                ("1", "McGill Curl-Up", "Hands under lordosis, one knee bent; lift head/shoulders only — protects lumbar discs; targets rectus abdominis without hip flexors", .blue),
                ("2", "Side Plank",     "Lateral chain: quadratus lumborum + obliques; most important anti-lateral-flexion exercise; regress to knee version if needed", .green),
                ("3", "Bird-Dog",       "Opposite arm + leg extension from all-fours; trains anti-rotation while co-contracting extensors; hold 8–10 s per rep", .orange),
            ]

            VStack(spacing: 8) {
                ForEach(rows, id: \.0) { num, name, desc, color in
                    HStack(alignment: .top, spacing: 10) {
                        Text(num)
                            .font(.caption.bold()).foregroundStyle(.white)
                            .frame(width: 20, height: 20)
                            .background(color)
                            .clipShape(Circle())
                        VStack(alignment: .leading, spacing: 2) {
                            Text(name).font(.caption.bold()).foregroundStyle(color)
                            Text(desc).font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    if num != "3" { Divider() }
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Anatomy Card

    private var anatomyCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Inner Unit vs Outer Unit", systemImage: "circle.grid.2x2.fill")
                .font(.subheadline).bold()
                .foregroundStyle(.orange)
            Text("Hides et al. 1996 (Spine): lumbar multifidus atrophies within 2 weeks of back pain and does NOT spontaneously recover — it requires specific training. The inner unit (stabilizers) must be developed before outer unit (movers) loading.")
                .font(.caption).foregroundStyle(.secondary)

            let units: [(String, String, String, Color)] = [
                ("Inner Unit",  "Transverse abdominis, multifidus, pelvic floor, diaphragm",
                 "Stabilize the spine before limb movement; train with breathing, bracing, dead bugs", .blue),
                ("Outer Unit",  "Rectus abdominis, obliques, erector spinae, glutes",
                 "Generate and transfer force; train with planks, carries, loaded movements", .orange),
            ]

            VStack(spacing: 8) {
                ForEach(units, id: \.0) { title, muscles, training, color in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(title).font(.caption.bold()).foregroundStyle(color)
                        Text(muscles).font(.caption2).foregroundStyle(.secondary)
                        Text(training).font(.caption2).foregroundStyle(.tertiary)
                    }
                    if title == "Inner Unit" { Divider() }
                }
            }

            Text("Willardson 2007 (JSCR): unstable surface training (BOSU) increases EMG activation but reduces force output 20–30% — use for rehab/early training; return to stable surfaces for strength development.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Core Training Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("The core is not just the abs — it is the entire cylinder of muscles (anterior, posterior, lateral, superior, inferior) that pressurize the torso during loading. Training the visible rectus abdominis while ignoring the deep stabilizers creates an aesthetic core with poor structural support.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Reed 2012 (JOSPT): targeted stabilization training reduced chronic LBP intensity 35% and disability 28% vs 18%/15% for general exercise. Stokes 2010: 6-week core training improved 3000 m run 4.6% — trunk stiffness prevents energy leakage between each footstrike and propulsion phase.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Daily training is safe (core muscles are slow-twitch, recover in ~24 h). Frequency > volume: 3 sets of McGill Big 3 daily produces greater adaptation than 1 session/week of high-volume ab circuits.")
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
            Image(systemName: "figure.core.training")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No core training sessions")
                .font(.headline)
            Text("Record core training workouts with your Apple Watch to see session history, weekly frequency, and spinal health science here.")
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
                    $0.workoutActivityType == .coreTraining
                }
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [CoreSession] = rawWorkouts.map { w in
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return CoreSession(date: w.startDate, label: fmt.string(from: w.startDate),
                               duration: w.duration, kcal: kcal)
        }

        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weekMap: [Date: (kcal: Double, sessions: Int)] = [:]
        for s in sessions {
            let ws  = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: s.date))!
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
            self.sessions      = sessions
            self.weekLoads     = weekLoads
            self.avgKcalPerMin = avgKpm
            self.isLoading     = false
        }
    }
}
