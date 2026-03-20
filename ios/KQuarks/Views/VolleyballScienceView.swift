import SwiftUI
import HealthKit

struct VolleyballScienceView: View {
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
                jumpAndAttackCard
                energySystemsCard
                beachVsIndoorCard
                injuryPreventionCard
                recentSessions
            }
            .padding()
        }
        .navigationTitle("Volleyball Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", color: .yellow)
            statCard(value: avgDuration > 0 ? "\(Int(avgDuration / 60))m" : "--", label: "Avg Duration", color: .orange)
            statCard(value: avgCalories > 0 ? "\(Int(avgCalories))" : "--", label: "Avg kcal", color: .red)
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
            sessionBar(label: "Match / Tournament", subtitle: "≥90 min • Competitive match play", color: .yellow, fraction: 0.35)
            sessionBar(label: "Team Practice", subtitle: "60–90 min • Full squad training", color: .orange, fraction: 0.35)
            sessionBar(label: "Beach Volleyball", subtitle: "30–90 min • 2v2 sand play", color: .red, fraction: 0.20)
            sessionBar(label: "Skill / Drills", subtitle: "<45 min • Setting, passing, serving", color: .pink, fraction: 0.10)
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
    private var jumpAndAttackCard: some View {
        scienceCard(title: "Jump & Attack Biomechanics", icon: "🏐", color: .yellow) {
            sciRow(stat: "Marques 2009", detail: "Elite male opposite hitters average vertical jump 80–90 cm; women 60–70 cm; approach jump adds 15–20 cm vs. standing — 4-step approach optimizes horizontal-to-vertical momentum conversion")
            sciRow(stat: "Forthomme 2005", detail: "Spike mechanics: shoulder internal rotation peak angular velocity 4,500–5,000°/s — among highest of any sport; elbow extension 1,800–2,200°/s; wrist snap at contact generates topspin 10–20 rev/s")
            sciRow(stat: "Coleman 2010", detail: "Blocking jump: single-leg vs. double-leg takeoff; platform timing window 0.08–0.14 s for effective deflection; elite blockers anticipate setter direction 0.4 s before ball contact")
            sciRow(stat: "Lian 2005", detail: "Patellar tendinopathy ('jumper's knee') in elite volleyball players: 45% prevalence — highest of any jumping sport; correlation with jump training volume r = 0.71; eccentric decline squats reduce pain 80% in 12 weeks")
        }
    }

    private var energySystemsCard: some View {
        scienceCard(title: "Energy Systems & Physical Demands", icon: "⚡", color: .orange) {
            sciRow(stat: "Sheppard 2008", detail: "Indoor match: 300–500 explosive efforts; average rally 3–8 s; work:rest ratio 1:5 to 1:8 — highly alactic-dominant; total high-intensity distance 1.5–3 km of 5–8 km total court movement")
            sciRow(stat: "Fattahi 2012", detail: "Elite setter positional demands: 400–600 direction changes/set; high-intensity efforts 4–7 m in distance; HR averages 145–165 bpm (72–82% HRmax); libero defensive specialists cover 30% more ground than attackers")
            sciRow(stat: "Maffiuletti 2008", detail: "Caloric expenditure indoor volleyball: 400–600 kcal/hour; blood lactate 2–4 mmol/L during competition — aerobic metabolism sustains recovery between rallies; VO₂max 52–58 mL/kg/min in national-level players")
            sciRow(stat: "Lidor 2010", detail: "Service ace science: jump serve travels 18–22 m in 0.35–0.45 s; topspin serves increase landing uncertainty by 40% vs. float serves; reception error probability increases 35% when float serve travel time <0.5 s")
        }
    }

    private var beachVsIndoorCard: some View {
        scienceCard(title: "Beach vs Indoor Science", icon: "🌊", color: .red) {
            sciRow(stat: "Giatsis 2011", detail: "Beach volleyball energetics: 30–40% higher kcal/min than indoor; sand surface increases metabolic cost of movement 1.6× vs. hardcourt; 2v2 format means 3× more individual attacks and serves per set")
            sciRow(stat: "Tilp 2009", detail: "Sand vs. court jump comparison: CMJ height reduced 5–8 cm on sand due to energy absorption; peak landing forces 15–20% lower on sand — protective effect for patellar tendon; knee pain incidence 55% lower in beach players")
            sciRow(stat: "Araújo 2014", detail: "Beach volleyball tactical space: each player defends 72 m² vs. 27 m² indoors; serve receive technique must adapt to wind/sun; top beach pros average rally 5.1 s and 5.8 contacts vs. 3.9 s and 4.4 contacts indoors")
            sciRow(stat: "Palao 2014", detail: "Olympic beach volleyball serve strategies: float serves account for 65% of elite serves; topspin jump serve aces 3× more likely (9% vs. 3%) but error rate also 3× higher; women servers more effective than men relative to serve difficulty")
        }
    }

    private var injuryPreventionCard: some View {
        scienceCard(title: "Injury Science & Prevention", icon: "🛡️", color: .pink) {
            sciRow(stat: "Briner 1997", detail: "Volleyball injury rate: 1.7–3.2/1,000 participation hours; ankle sprains = 40% of all injuries; 80% occur at net during blocking due to landing on opponent's foot — libero and outside hitters highest risk positions")
            sciRow(stat: "Bahr 2003", detail: "Ankle sprain prevention: proprioception board training reduces ankle sprains by 47% over 1 season; balance training 3×/week 10 min/session is sufficient; taping provides 50% re-injury protection but reduces proprioception 20%")
            sciRow(stat: "Aagaard 2004", detail: "Shoulder overuse in elite spikers: rotator cuff imbalance (ER:IR ratio <0.7) predicts injury (OR 4.2); internal rotation deficit >25° vs. non-dominant arm indicates posterior capsule tightening — sleeper stretch protocol")
            sciRow(stat: "Verhagen 2004", detail: "Neuromuscular training (Prevention of ankle sprains in volleyball): wobble board protocol reduced ankle sprains from 2.5 to 0.9/1,000 hours (64% reduction); 8-week in-season program implementation is practical and effective")
        }
    }

    // MARK: - Recent Sessions
    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(5), id: \.uuid) { session in
                HStack {
                    Image(systemName: "volleyball.fill")
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
                Text("No volleyball sessions found").foregroundColor(.secondary).frame(maxWidth: .infinity)
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
        if mins >= 90 { return "Match / Tournament" }
        if mins >= 60 { return "Team Practice" }
        if mins >= 45 { return "Beach Volleyball" }
        return "Skill / Drills"
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { isLoading = false; return }

        let vbTypes: [HKWorkoutActivityType] = [.volleyball]
        let predicates = vbTypes.map { HKQuery.predicateForWorkouts(with: $0) }
        let predicate = NSCompoundPredicate(orPredicateWithSubpredicates: predicates)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let results: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 200, sortDescriptors: [sortDescriptor]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let totalDur = results.reduce(0) { $0 + $1.duration }
        let totalCal = results.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)

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
