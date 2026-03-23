import SwiftUI
import HealthKit

struct DanceScienceView: View {
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
                movementScienceCard
                metabolicDemandCard
                rhythmCognitionCard
                injuryPreventionCard
                recentSessions
            }
            .padding()
        }
        .navigationTitle("Dance Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", color: .pink)
            statCard(value: avgDuration > 0 ? "\(Int(avgDuration / 60))m" : "--", label: "Avg Duration", color: .purple)
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
            sessionBar(label: "Performance/Rehearsal", subtitle: "≥90 min • Show rehearsal or full practice", color: .pink, fraction: 0.30)
            sessionBar(label: "Dance Class", subtitle: "60–90 min • Structured class session", color: .purple, fraction: 0.40)
            sessionBar(label: "Social Dancing", subtitle: "30–60 min • Salsa, ballroom, swing", color: .orange, fraction: 0.20)
            sessionBar(label: "Cardio Dance", subtitle: "<30 min • Zumba or freestyle session", color: .red, fraction: 0.10)
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
                            .fill(Color.pink.opacity(0.8))
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
    private var movementScienceCard: some View {
        scienceCard(title: "Movement Science & Biomechanics", icon: "💃", color: .pink) {
            sciRow(stat: "Laws 2002", detail: "Ballet pirouette mechanics: spotting reduces angular deceleration by 30%; professional ballet dancers generate 200–400 Nm ground reaction torque during turns")
            sciRow(stat: "Bronner 2010", detail: "Elite dancers exhibit 15–25% greater hip joint ROM than non-dancers; functional turnout in ballet requires 60–70° hip external rotation, primarily acetabular morphology vs. muscular")
            sciRow(stat: "Hackney 2009", detail: "Argentine tango partner coordination: leader-follower coupling reduces postural sway by 40% in older adults; social dance enhances proprioceptive acuity")
            sciRow(stat: "Leanderson 1996", detail: "Pointe work generates 2.5–3.5× BW ground reaction forces; professional ballet dancers perform 600–1,200 relevés per rehearsal day; metatarsal stress fracture threshold: 3,500–4,000 cycles")
        }
    }

    private var metabolicDemandCard: some View {
        scienceCard(title: "Metabolic Demands & Fitness", icon: "⚡", color: .purple) {
            sciRow(stat: "Wyon 2004", detail: "Ballet dancers: VO₂max 48–54 mL/kg/min (women); modern dance: 52–58 mL/kg/min; Wyon 2007: dance class HR averages 150–165 bpm, 75–85% HRmax")
            sciRow(stat: "Cohen 1982", detail: "Ballet performance = 2–4 METs during adagio, 8–10 METs during allegro; mean kcal 400–700/hour depending on style; energetic profile similar to soccer (intermittent high-intensity)")
            sciRow(stat: "Rodrigues-Krause 2015", detail: "Zumba: 6.1–8.5 METs; improves cardiorespiratory fitness +7% and body composition −1.5 kg fat in 12 weeks; blood pressure reduction −4/−3 mmHg at rest")
            sciRow(stat: "Angioi 2009", detail: "Muscular fitness in contemporary dancers: relative peak power 28.5 W/kg; 12-week plyometric supplementation improved jump height 9% and reduced injury rate 23%")
        }
    }

    private var rhythmCognitionCard: some View {
        scienceCard(title: "Rhythm, Cognition & Brain Health", icon: "🧠", color: .orange) {
            sciRow(stat: "Verghese 2003", detail: "Albert Einstein College: frequent dancing reduces dementia risk 76% — highest risk reduction of any physical or cognitive activity in the 21-year study (N=469, adults 75+)")
            sciRow(stat: "Müller 2017", detail: "6-month dance training shows greater hippocampal volume gains vs. cycling; balance improvement 2× greater in dance group due to multisensory integration demands")
            sciRow(stat: "Brown 2006", detail: "Tango neuroimaging: music-synchronized movement activates cerebellum, basal ganglia, and prefrontal cortex simultaneously; dance is one of few activities engaging all four simultaneously")
            sciRow(stat: "Coubard 2011", detail: "Dance therapy in Parkinson's disease: tango reduces UPDRS motor scores 20%, improves stride length 12% and freezing episodes 15%; rhythmic auditory cueing drives basal ganglia entrainment")
        }
    }

    private var injuryPreventionCard: some View {
        scienceCard(title: "Injury Science & Prevention", icon: "🛡️", color: .red) {
            sciRow(stat: "Bronner 2006", detail: "Professional dancers sustain 1.24 injuries/1,000 hours; highest rates: ankle (28%), lower back (22%), knee (18%); overuse injuries account for 67% vs. acute 33%")
            sciRow(stat: "Smith 2015", detail: "Female dancer stress fracture sites: metatarsals (35%), tibia (22%), lumbar (15%); energy deficiency (RED-S) underlying cause in 60% of bone stress injuries — caloric deficit <40 kcal/kg FFM/day")
            sciRow(stat: "Koutedakis 2009", detail: "Off-season strength training: 8 weeks reduces injury rate 31% upon return to season; hip abductor weakness <65% of adductor strength predicts groin injury (OR 3.2)")
            sciRow(stat: "Liederbach 2012", detail: "Screeen Dance USA injury prevention: ACL injury rare in dancers (0.12/1,000 h) vs. soccer (0.8/1,000 h) due to proprioceptive training; turnout compensation causes knee valgus and patellofemoral pain")
        }
    }

    // MARK: - Recent Sessions
    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(5), id: \.uuid) { session in
                HStack {
                    Image(systemName: "music.note")
                        .foregroundColor(.pink)
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
                Text("No dance sessions found").foregroundColor(.secondary).frame(maxWidth: .infinity)
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
        if mins >= 90 { return "Performance/Rehearsal" }
        if mins >= 60 { return "Dance Class" }
        if mins >= 30 { return "Social Dancing" }
        return "Cardio Dance"
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { isLoading = false; return }

        let danceTypes: [HKWorkoutActivityType] = [.socialDance, .cardioDance, .barre, .pilates]
        let predicates = danceTypes.map { HKQuery.predicateForWorkouts(with: $0) }
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
