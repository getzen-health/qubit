import SwiftUI
import HealthKit
import Charts

// MARK: - BaseballSoftballView
// Analyzes baseball and softball workout sessions tracked via Apple Watch.
// These are intermittent burst sports — bursts of high-intensity activity
// (sprinting, pitching, fielding) punctuated by long standing/resting periods.
//
// Science:
//   Escamilla & Andrews 2009 (Sports Med): overhead throwing generates elbow
//     valgus stress up to 64 Nm — the highest load of any athletic movement.
//     Pitch count management is the primary evidence-based arm injury prevention strategy.
//   Spurway 2007 (J Sports Sci): intermittent sports require dual conditioning —
//     aerobic base for repeated sprint recovery, plus peak-power development.
//   Casa et al. 2015 (JSCR): baseball in heat is a leading cause of exertional
//     heat illness in youth sports — HR monitoring is a key safety intervention.
//   Dillman et al. 1993 (J Sports Sci): pitch mechanics analysis shows
//     arm deceleration phase produces forces exceeding 1.5× the limb's own weight.
//
// Physiological profile: average HR during baseball ~90–110 bpm but spikes
//   to 150–175 bpm during sprinting/pitching bursts.

struct BaseballSoftballView: View {

    // MARK: - Models

    struct GameSession: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let sport: Sport
        let duration: TimeInterval    // seconds
        let kcal: Double
        let avgHR: Double             // 0 if unknown
        var kcalPerMin: Double { duration > 0 ? kcal / (duration / 60) : 0 }
        var durationMin: Double { duration / 60 }
    }

    enum Sport: String {
        case baseball = "Baseball"
        case softball = "Softball"
        case mixed    = "Mixed"

        var color: Color {
            switch self {
            case .baseball: return .blue
            case .softball: return .yellow
            case .mixed:    return .orange
            }
        }

        var icon: String {
            switch self {
            case .baseball: return "figure.baseball"
            case .softball: return "figure.softball"
            case .mixed:    return "sportscourt.fill"
            }
        }
    }

    struct MonthBucket: Identifiable {
        let id = UUID()
        let label: String
        let date: Date
        let baseballSessions: Int
        let softballSessions: Int
        let totalKcal: Double
    }

    // MARK: - State

    @State private var sessions: [GameSession] = []
    @State private var months: [MonthBucket] = []
    @State private var totalKcal: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading game history…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    monthlyChart
                    intensityCard
                    recentSessionsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Baseball & Softball")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let baseballCount = sessions.filter { $0.sport == .baseball }.count
        let softballCount = sessions.filter { $0.sport == .softball }.count

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
                    value: String(format: "%.0f min", avgDurationMin),
                    label: "Avg Duration",
                    sub: avgDurationMin > 90 ? "Full game" : avgDurationMin > 45 ? "Practice" : "Short",
                    color: avgDurationMin > 90 ? .green : .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: String(format: "%.1f", avgKcalPerMin),
                    label: "kcal/min",
                    sub: "avg intensity",
                    color: avgKcalPerMin > 5 ? .orange : .blue
                )
            }
            .padding(.vertical, 12)

            if baseballCount > 0 || softballCount > 0 {
                HStack(spacing: 16) {
                    if baseballCount > 0 {
                        Label("\(baseballCount) baseball", systemImage: "figure.baseball")
                            .font(.caption2).foregroundStyle(.blue)
                    }
                    if softballCount > 0 {
                        Label("\(softballCount) softball", systemImage: "figure.softball")
                            .font(.caption2).foregroundStyle(.yellow)
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Monthly Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Monthly Game Volume", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()
            Text("Sessions per month, split by baseball (blue) vs softball (yellow). Baseball season: April–September. Off-season training reduces injury risk (Dun et al. 2011).")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(months) { m in
                BarMark(
                    x: .value("Month", m.label),
                    y: .value("Baseball", m.baseballSessions)
                )
                .foregroundStyle(Color.blue.gradient)
                .position(by: .value("Sport", "Baseball"))

                BarMark(
                    x: .value("Month", m.label),
                    y: .value("Softball", m.softballSessions)
                )
                .foregroundStyle(Color.yellow.gradient)
                .position(by: .value("Sport", "Softball"))
            }
            .frame(height: 150)
            .chartXAxis {
                AxisMarks { _ in
                    AxisValueLabel()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Intensity Card

    private var intensityCard: some View {
        let highIntensitySessions = sessions.filter { $0.kcalPerMin > 6 }.count
        let moderateSessions     = sessions.filter { $0.kcalPerMin >= 4 && $0.kcalPerMin <= 6 }.count
        let lowSessions          = sessions.filter { $0.kcalPerMin < 4 }.count
        let total                = Double(sessions.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Session Intensity Distribution", systemImage: "bolt.heart.fill")
                .font(.subheadline).bold()
            Text("Baseball/softball sessions vary widely by role and game situation. Pitchers, catchers, and base runners experience significantly higher loads than fielders.")
                .font(.caption2).foregroundStyle(.secondary)

            ForEach([
                ("High (>6 kcal/min)", highIntensitySessions, Color.orange),
                ("Moderate (4–6 kcal/min)", moderateSessions, Color.blue),
                ("Low (<4 kcal/min)", lowSessions, Color.secondary),
            ], id: \.0) { label, count, color in
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack {
                    Text(label).font(.caption2).frame(width: 140, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 10)
                            Capsule().fill(color.gradient).frame(width: geo.size.width * pct / 100, height: 10)
                        }
                    }
                    .frame(height: 10)
                    Text(String(format: "%.0f%%", pct))
                        .font(.caption2.bold()).foregroundStyle(color).frame(width: 32, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recent Sessions Card

    private var recentSessionsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Recent Sessions", systemImage: "list.bullet")
                .font(.subheadline).bold()

            ForEach(sessions.suffix(8).reversed()) { s in
                HStack {
                    Image(systemName: s.sport == .softball ? "figure.softball" : "figure.baseball")
                        .foregroundStyle(s.sport.color)
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(s.sport.rawValue)
                            .font(.caption.bold())
                        Text(s.label)
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f min", s.durationMin))
                            .font(.caption.bold())
                        Text(String(format: "%.0f kcal", s.kcal))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
                if s.id != sessions.suffix(8).reversed().last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Baseball & Softball Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Baseball and softball are intermittent burst sports requiring both explosive power and aerobic recovery capacity. Apple Watch tracks these sessions via heart rate and motion sensors, capturing calorie expenditure and session duration.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Escamilla & Andrews 2009 (Sports Med): overhead throwing is the fastest human movement tracked by Apple Watch, generating elbow forces up to 64 Nm — higher than any other athletic movement. Pitch count management is the primary evidence-based strategy to prevent UCL injury (Tommy John surgery).")
                .font(.caption).foregroundStyle(.secondary)
            Text("Casa et al. 2015 (JSCR): baseball players are at elevated heat illness risk due to heavy equipment, field sun exposure, and intermittent exertion that delays heat perception. HR monitoring during games provides early warning of thermal stress.")
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
            Image(systemName: "figure.baseball")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No baseball or softball sessions")
                .font(.headline)
            Text("Start recording baseball or softball workouts with your Apple Watch to see game history, intensity analysis, and training science insights here.")
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
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        let baseballWorkouts = rawWorkouts.filter {
            $0.workoutActivityType == .baseball || $0.workoutActivityType == .softball
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        let sessions: [GameSession] = baseballWorkouts.map { w in
            let sport: Sport = w.workoutActivityType == .softball ? .softball : .baseball
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return GameSession(
                date: w.startDate,
                label: fmt.string(from: w.startDate),
                sport: sport,
                duration: w.duration,
                kcal: kcal,
                avgHR: 0
            )
        }

        // Monthly buckets
        let monthFmt = DateFormatter(); monthFmt.dateFormat = "MMM"
        var bucketMap: [Date: (baseball: Int, softball: Int, kcal: Double)] = [:]
        for s in sessions {
            let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: s.date))!
            var cur = bucketMap[monthStart] ?? (0, 0, 0)
            if s.sport == .baseball { cur.baseball += 1 } else { cur.softball += 1 }
            cur.kcal += s.kcal
            bucketMap[monthStart] = cur
        }

        var cursor = calendar.date(from: calendar.dateComponents([.year, .month], from: start))!
        var months: [MonthBucket] = []
        while cursor <= end {
            let data = bucketMap[cursor] ?? (0, 0, 0)
            months.append(MonthBucket(
                label: monthFmt.string(from: cursor),
                date: cursor,
                baseballSessions: data.baseball,
                softballSessions: data.softball,
                totalKcal: data.kcal
            ))
            cursor = calendar.date(byAdding: .month, value: 1, to: cursor) ?? Date()
        }

        let total   = sessions.map(\.kcal).reduce(0, +)
        let avgDur  = sessions.isEmpty ? 0.0 : sessions.map(\.durationMin).reduce(0, +) / Double(sessions.count)
        let avgKpm  = sessions.isEmpty ? 0.0 : sessions.map(\.kcalPerMin).reduce(0, +) / Double(sessions.count)

        DispatchQueue.main.async {
            self.sessions      = sessions
            self.months        = months
            self.totalKcal     = total
            self.avgDurationMin = avgDur
            self.avgKcalPerMin  = avgKpm
            self.isLoading     = false
        }
    }
}
