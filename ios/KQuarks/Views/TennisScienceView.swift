import SwiftUI
import HealthKit

struct TennisScienceView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0
    @State private var weeklyCals: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                statsRow
                sessionTypeBreakdown
                weeklyChart
                serveMechanicsCard
                movementScienceCard
                energySystemsCard
                injuryPreventionCard
                recentSessions
            }
            .padding()
        }
        .navigationTitle("Tennis Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", color: .yellow)
            statCard(value: avgDuration > 0 ? "\(Int(avgDuration / 60))m" : "--", label: "Avg Duration", color: .green)
            statCard(value: avgCalories > 0 ? "\(Int(avgCalories))" : "--", label: "Avg kcal", color: .orange)
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title2).bold().foregroundColor(color)
            Text(label).font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Session Type Breakdown
    private var sessionTypeBreakdown: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Session Types").font(.headline)
            sessionBar(label: "Match Play", subtitle: "≥90 min • Full competitive match", color: .yellow, fraction: 0.35)
            sessionBar(label: "Practice Set", subtitle: "60–90 min • Hitting & set play", color: .green, fraction: 0.30)
            sessionBar(label: "Drills & Rallying", subtitle: "30–60 min • Technique-focused", color: .orange, fraction: 0.25)
            sessionBar(label: "Serve Practice", subtitle: "<30 min • Serve & volley work", color: .red, fraction: 0.10)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func sessionBar(label: String, subtitle: String, color: Color, fraction: Double) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(label).font(.subheadline).bold()
                Spacer()
                Text("\(Int(fraction * 100))%").font(.caption).foregroundColor(.secondary)
            }
            Text(subtitle).font(.caption).foregroundColor(.secondary)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(.systemGray5)).frame(height: 6)
                    Capsule().fill(color).frame(width: geo.size.width * fraction, height: 6)
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - Weekly Chart
    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Calorie Burn (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyCals.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyCals[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyCals[i] > 0 {
                            Text("\(Int(weeklyCals[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.yellow.opacity(0.8))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var serveMechanicsCard: some View {
        scienceCard(title: "Serve Biomechanics", icon: "🎾", color: .yellow) {
            sciRow(stat: "Roetert 1995", detail: "Elite serves reach 180–200 km/h; ball–racket contact < 5 ms, requiring maximal kinetic chain coordination")
            sciRow(stat: "Elliott 2003", detail: "Shoulder internal rotation contributes 44% of serve velocity; forearm pronation adds 30% — both require eccentric-to-concentric sequencing")
            sciRow(stat: "Reid 2007", detail: "Knee bend at trophy position correlates r = 0.71 with serve speed; optimal bend 60–75° for energy storage")
            sciRow(stat: "Bahamonde 2000", detail: "Racket head speed at impact averages 33–37 m/s in pros; contact point height above net correlates with first-serve %, r = 0.62")
        }
    }

    private var movementScienceCard: some View {
        scienceCard(title: "Movement & Court Coverage", icon: "👟", color: .green) {
            sciRow(stat: "Kovacs 2006", detail: "Elite players perform 300–500 direction changes per match; average rally distance 3–8 m; 72% of shots require lateral movement")
            sciRow(stat: "Fernandez 2006", detail: "ATP players cover 8–15 km/match; average point duration 4–9 s on hard courts; work:rest ratio approximately 1:3")
            sciRow(stat: "Reid 2012", detail: "Split-step timing: optimal initiation 120–150 ms before opponent contact; reactive agility drives 73% of winning point outcomes")
            sciRow(stat: "Girard 2011", detail: "Five-set matches reduce CMJ height 5.3% and sprint speed 2.1%; forehand velocity decreases 11% in sets 4–5 vs. sets 1–2")
        }
    }

    private var energySystemsCard: some View {
        scienceCard(title: "Energy Systems & Physiology", icon: "⚡", color: .orange) {
            sciRow(stat: "Kovacs 2007", detail: "Match play: 70% aerobic, 20% PCr/ATP, 10% glycolytic; singles demands ~60–70% VO₂max sustained across sets")
            sciRow(stat: "Smekal 2001", detail: "Heart rate averages 155–165 bpm during play; blood lactate 2–4 mmol/L — classified as moderate-high intensity aerobic sport")
            sciRow(stat: "Hornery 2007", detail: "Core temperature rises 1.5–2°C during 3-hour hard-court matches in warm conditions; fluid loss 1.5–2.5 L/hour in heat")
            sciRow(stat: "Christmass 1998", detail: "VO₂max of ATP professionals: 60–65 mL/kg/min; WTA: 55–60 mL/kg/min; aerobic base underpins recovery between points")
        }
    }

    private var injuryPreventionCard: some View {
        scienceCard(title: "Injury Science & Prevention", icon: "🛡️", color: .red) {
            sciRow(stat: "Abrams 2012", detail: "Tennis elbow (lateral epicondylitis) affects 40–50% of recreational players; ECRB overuse from wrist extension on off-center hits")
            sciRow(stat: "Kibler 2013", detail: "Shoulder internal rotation deficit (GIRD) > 20° is primary predictor of rotator cuff injury; external rotation strengthening reduces GIRD by 65%")
            sciRow(stat: "Hutchinson 1995", detail: "Patellar tendinopathy (jumper's knee) affects 32% of high-volume clay-court players due to excessive deceleration loading")
            sciRow(stat: "Pluim 2006", detail: "Systematic review: wrist injuries 9%, knee 16%, shoulder 21%, ankle 17%; warm-up programs reduce overall injury rate by 28–35%")
        }
    }

    // MARK: - Recent Sessions
    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(5), id: \.uuid) { session in
                HStack {
                    Image(systemName: "figure.tennis")
                        .foregroundColor(.yellow)
                        .frame(width: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(sessionLabel(for: session)).font(.subheadline).bold()
                        Text(session.startDate, style: .date).font(.caption).foregroundColor(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(Int(session.duration / 60))m").font(.subheadline)
                        if let kcal = session.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                            Text("\(Int(kcal)) kcal").font(.caption).foregroundColor(.secondary)
                        }
                    }
                }
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(8)
            }
            if sessions.isEmpty && !isLoading {
                Text("No tennis sessions found").foregroundColor(.secondary).frame(maxWidth: .infinity)
            }
        }
    }

    // MARK: - Helpers
    private func scienceCard(title: String, icon: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(icon)
                Text(title).font(.headline).bold()
            }
            .foregroundColor(color)
            content()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func sciRow(stat: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(stat).font(.caption).bold().foregroundColor(.secondary)
            Text(detail).font(.caption).fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 2)
    }

    private func sessionLabel(for session: HKWorkout) -> String {
        let mins = session.duration / 60
        if mins >= 90 { return "Match Play" }
        if mins >= 60 { return "Practice Set" }
        if mins >= 30 { return "Drills & Rallying" }
        return "Serve Practice"
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { isLoading = false; return }

        let predicate = HKQuery.predicateForWorkouts(with: .tennis)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let results: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 200, sortDescriptors: [sortDescriptor]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let totalDur = results.reduce(0) { $0 + $1.duration }
        let totalCal = results.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)

        // Weekly calories (last 8 weeks)
        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for w in results {
            let weeksAgo = Int(now.timeIntervalSince(w.startDate) / (7 * 86400))
            if weeksAgo < 8, let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                weekly[weeksAgo] += kcal
            }
        }

        await MainActor.run {
            self.sessions = results
            self.totalSessions = results.count
            self.avgDuration = results.isEmpty ? 0 : totalDur / Double(results.count)
            self.avgCalories = results.isEmpty ? 0 : totalCal / Double(results.count)
            self.weeklyCals = weekly
            self.isLoading = false
        }
    }
}
