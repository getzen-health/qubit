import SwiftUI
import HealthKit

struct CrossTrainingScienceView: View {
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
                crossfitPhysiologyCard
                metabolicConditioningCard
                recoveryAdaptationCard
                injuryPreventionCard
                recentSessions
            }
            .padding()
        }
        .navigationTitle("Cross-Training Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", color: .red)
            statCard(value: avgDuration > 0 ? "\(Int(avgDuration / 60))m" : "--", label: "Avg Duration", color: .orange)
            statCard(value: avgCalories > 0 ? "\(Int(avgCalories))" : "--", label: "Avg kcal", color: .yellow)
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
            sessionBar(label: "CrossFit / HIIT", subtitle: "20–60 min • WOD, AMRAP, EMOM", color: .red, fraction: 0.40)
            sessionBar(label: "Functional Strength", subtitle: "45–75 min • Olympic lifts & gymnastics", color: .orange, fraction: 0.30)
            sessionBar(label: "Circuit Training", subtitle: "30–50 min • Multi-modal metabolic", color: .yellow, fraction: 0.20)
            sessionBar(label: "Recovery / Mobility", subtitle: "<30 min • Active recovery session", color: .green, fraction: 0.10)
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
                            .fill(Color.red.opacity(0.8))
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
    private var crossfitPhysiologyCard: some View {
        scienceCard(title: "CrossFit & HIIT Physiology", icon: "🏋️", color: .red) {
            sciRow(stat: "Glassman 2002", detail: "CrossFit defined as 'constantly varied functional movements at high intensity'; WOD design targets 10 physical skills: cardiovascular endurance, stamina, strength, flexibility, power, speed, coordination, agility, balance, accuracy")
            sciRow(stat: "Smith 2013", detail: "CrossFit Fran (21-15-9 thrusters + pull-ups): HR reaches 98% HRmax; blood lactate 12–18 mmol/L; VO₂ hits 90–95% VO₂max — among highest metabolic demands of any standardized workout")
            sciRow(stat: "Heinrich 2014", detail: "10-week CrossFit program: VO₂max +9.1%, body fat −1.6 kg, 1RM back squat +22%; effect sizes 0.7–1.1 (large) across all fitness markers in previously trained adults")
            sciRow(stat: "Mangine 2015", detail: "Concurrent training interference (strength + endurance) reduced by 48-hour separation; CrossFit's metabolic conditioning interferes minimally with strength gains when session order is strength-first")
        }
    }

    private var metabolicConditioningCard: some View {
        scienceCard(title: "Metabolic Conditioning Science", icon: "⚡", color: .orange) {
            sciRow(stat: "Tabata 1996", detail: "Tabata protocol (20s max/10s rest × 8): increases VO₂max 14% and anaerobic capacity 28% in 6 weeks — superior to moderate-intensity cardio for simultaneous aerobic/anaerobic adaptation")
            sciRow(stat: "Burpee WOD data", detail: "100 burpees: avg kcal expenditure 7–10 kcal/minute; EPOC (excess post-exercise O₂ consumption) elevated 14–16% for 24–48 hours post-HIIT — total caloric cost ~140% of exercise-only value")
            sciRow(stat: "Boutcher 2011", detail: "HIIT 3×/week produces equivalent fat loss to 5×/week steady-state cardio in 12 weeks; visceral fat reduction 17% vs. 8% — intermittent high-intensity preferentially targets abdominal adiposity")
            sciRow(stat: "Laursen 2002", detail: "Repeated sprint ability (RSA) improves 12% with HIIT vs. 3% with continuous training; PCr resynthesis rate during rest intervals determines bout quality — 30–60 s optimal recovery window")
        }
    }

    private var recoveryAdaptationCard: some View {
        scienceCard(title: "Recovery & Adaptation", icon: "🔄", color: .yellow) {
            sciRow(stat: "Kellmann 2002", detail: "Overreaching distinguishable from overtraining by response to 48-hour full rest: 90% recovery = overreaching, <50% recovery = overtraining; HRV suppression >15% from baseline predicts performance decrement")
            sciRow(stat: "Peake 2017", detail: "Post-HIIT muscle damage peaks 24–48h; CK elevation 300–1,200 U/L; eccentric-dominant movements (pull-ups, box jumps) generate 3–5× more DOMS than concentric-only; cold water immersion accelerates recovery 31%")
            sciRow(stat: "Stöggl 2014", detail: "Polarized training model (80% low / 20% high intensity) outperforms high-volume and threshold models for VO₂max gains (+11.7% vs. +8.2%); cross-training preserves aerobic adaptations during sport-specific breaks")
            sciRow(stat: "Helms 2014", detail: "Natural strength athletes: protein needs 1.6–2.2 g/kg/day during caloric restriction; leucine threshold 2.5–3 g/meal triggers maximal MPS; carbohydrate timing (30g within 30 min) accelerates glycogen resynthesis 50%")
        }
    }

    private var injuryPreventionCard: some View {
        scienceCard(title: "Injury Science & Prevention", icon: "🛡️", color: .green) {
            sciRow(stat: "Hak 2013", detail: "CrossFit injury rate: 3.1 injuries/1,000 training hours — comparable to Olympic weightlifting (3.3) and lower than contact sports; shoulder 25%, lower back 22%, knee 14% of total injuries")
            sciRow(stat: "Summitt 2016", detail: "Rhabdomyolysis risk in novel exercisers attempting benchmark WODs: 'Crossfit-induced rhabdo' most common in first 2 weeks — scale volume to ≤60% max effort; CK >10,000 U/L indicates ER evaluation")
            sciRow(stat: "Moran 2017", detail: "Functional Movement Screen (FMS) scores ≤14 predict injury risk (OR 3.8); corrective exercise addressing movement asymmetries reduces injury rate 47% in a 6-month CrossFit prospective study")
            sciRow(stat: "Weisenthal 2014", detail: "Survey of 386 CrossFitters: injury rates decrease with coaching experience level; coached athletes 25% fewer injuries than self-programmed; Olympic lift coaching reduces shoulder injury by 38% vs. self-taught")
        }
    }

    // MARK: - Recent Sessions
    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(5), id: \.uuid) { session in
                HStack {
                    Image(systemName: "figure.cross.training")
                        .foregroundColor(.red)
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
                Text("No cross-training sessions found").foregroundColor(.secondary).frame(maxWidth: .infinity)
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
        if mins >= 60 { return "Functional Strength" }
        if mins >= 40 { return "CrossFit / HIIT" }
        if mins >= 30 { return "Circuit Training" }
        return "Recovery / Mobility"
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { isLoading = false; return }

        let crossTypes: [HKWorkoutActivityType] = [.crossTraining, .functionalStrengthTraining, .highIntensityIntervalTraining, .mixedCardio]
        let predicates = crossTypes.map { HKQuery.predicateForWorkouts(with: $0) }
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
