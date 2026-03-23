import SwiftUI
import HealthKit

struct StrengthScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDuration: Double = 0
    @State private var weeklyMinutes: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                strengthStatsRow
                weeklyVolumeChart
                hypertrophyScienceCard
                neuralAdaptationsCard
                powerAndStrengthCard
                recoveryAndPeriodizationCard
            }
            .padding()
        }
        .navigationTitle("Strength Training Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var strengthStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSessions > 0 ? "\(totalSessions)" : "--", label: "Sessions (8 wk)", color: .red)
                statCard(value: avgDuration > 0 ? "\(Int(avgDuration))min" : "--", label: "Avg Duration", color: .orange)
                statCard(value: totalSessions > 0 ? "\(Int(Double(totalSessions) / 8.0 * 10) / 10)" : "--", label: "Sessions/Week", color: weeklyFrequencyColor)
            }
            HStack {
                Text("ACSM: ≥2 sessions/week for health benefit • ≥3 sessions/week for hypertrophy stimulus")
                    .font(.caption2).foregroundColor(.secondary)
            }
        }
    }

    private var weeklyFrequencyColor: Color {
        let freq = totalSessions > 0 ? Double(totalSessions) / 8.0 : 0
        if freq >= 3 { return .green }
        if freq >= 2 { return .orange }
        return .red
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

    // MARK: - Weekly Chart
    private var weeklyVolumeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Strength Training Volume (8 Weeks, minutes)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyMinutes.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyMinutes[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyMinutes[i] > 0 {
                            Text("\(Int(weeklyMinutes[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(weeklyMinutes[i] >= 120 ? Color.green : weeklyMinutes[i] >= 60 ? Color.orange : Color.red)
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            Text("Green ≥120 min/wk • Orange 60–119 min • Red <60 min (WHO: 75–150 min vigorous activity/week)").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var hypertrophyScienceCard: some View {
        scienceCard(title: "Muscle Hypertrophy Science", icon: "💪", color: .red) {
            sciRow(stat: "Schoenfeld 2010 (J Strength Cond Res)", detail: "Mechanisms of hypertrophy: three primary pathways — (1) mechanical tension: load × time under tension activates mTORC1 directly via titin mechanosensing; (2) metabolic stress: metabolite accumulation (lactate, H⁺, Pi) during higher-rep sets triggers anabolic signaling; (3) muscle damage: eccentric contractions induce satellite cell activation, contributing ~10% of total growth response")
            sciRow(stat: "Morton 2016 (J Appl Physiol)", detail: "Load and hypertrophy: sets taken to failure with loads 30–80% 1RM produce equivalent hypertrophy — the key is proximity to failure, not absolute load; high-load protocols (>70% 1RM) are superior for strength (myofibrillar hypertrophy); moderate loads (40–70%) favor sarcoplasmic hypertrophy; 30% 1RM is the lower threshold for meaningful muscle growth stimulus")
            sciRow(stat: "Krieger 2010 (J Strength Cond Res)", detail: "Volume dose-response: multi-set protocols (3–6 sets per exercise) produce 40% greater hypertrophy than single-set protocols; weekly sets per muscle group: ≤5 sets = insufficient, 10–20 sets = optimal hypertrophy range, >20 sets = diminishing returns; maximum adaptive volume (MAV) varies by individual and muscle group — calves require 20–25+ sets, arms 10–14 sets")
            sciRow(stat: "Figueiredo 2018", detail: "Muscle fiber type and hypertrophy: Type I (slow-twitch): higher oxidative capacity, resist fatigue, respond to higher rep ranges (15–30), comprise 50–80% of postural muscles; Type II (fast-twitch): 2–4× greater cross-sectional hypertrophy potential, respond to low-to-moderate loads (6–12 reps), reduced by endurance training via AMPK-mTOR interference (Atherton 2009: concurrent training blunts hypertrophy 17%)")
        }
    }

    private var neuralAdaptationsCard: some View {
        scienceCard(title: "Neural Adaptations & Strength Gains", icon: "🧠", color: .purple) {
            sciRow(stat: "Moritani 1979", detail: "Neural vs structural strength gains: initial 4–8 weeks of resistance training: 80–90% of strength gains are neural — improved motor unit recruitment, firing rate (rate coding), inter-muscular coordination, and reduced antagonist co-activation; structural (hypertrophy) gains dominate after 8 weeks; explains why beginners gain strength rapidly despite minimal muscle mass increase")
            sciRow(stat: "Aagaard 2002", detail: "Rate of force development (RFD): neural training (heavy loads, ballistic intent) increases RFD 15–25%; RFD in first 50–100 ms determines sports performance (time of ground contact, catching balance); heavy slow resistance: RFD −10% despite strength gains; maximal strength + explosive training both required for complete neuromuscular development")
            sciRow(stat: "Sale 1988", detail: "Motor unit recruitment: maximal voluntary contraction requires recruitment of all motor units; untrained individuals recruit 70–80% of motor units maximally; trained individuals 90–95%; deficit is closed through neural training; Desmedt 1977: Henneman size principle — smallest motor units (Type I) recruited first, largest (Type II) last, during progressive intensity increases")
            sciRow(stat: "Carroll 2011", detail: "Skill specificity of strength: strength gains are highly specific to the movement pattern, velocity, and contraction type trained; transfer to untrained exercises is 15–30% maximum; 3/4 of strength gains from training at 3.5 m/s do not transfer to 0.5 m/s movements; training slow makes you strong slowly, training fast makes you strong fast — sport-specific velocity training essential")
        }
    }

    private var powerAndStrengthCard: some View {
        scienceCard(title: "Power, Explosiveness & Functional Strength", icon: "⚡", color: .orange) {
            sciRow(stat: "Wilson 1993", detail: "Power = force × velocity; the force-velocity curve is a hyperbolic relationship — maximum velocity occurs with zero load, maximum force occurs at zero velocity; power peaks at ~30% 1RM for most muscles; training at different points on the F-V curve transfers best to adjacent but not distant points; concurrent strength + plyometric training (complex training) peaks power output above either alone")
            sciRow(stat: "Suchomel 2016 (Sports Med)", detail: "Force plate metrics: peak force, peak power, and impulse are the most trainable markers; rate of force development (RFD) predicts injury risk and athletic performance in contact sports; jump height (CMJ, SJ) predicts sprint performance with r = 0.77; weekly CMJ monitoring detects accumulated fatigue 2–3 days before performance decrement becomes subjectively apparent")
            sciRow(stat: "McBride 2002", detail: "Optimal load for peak power: weightlifting movements (power clean, snatch): 70–90% 1RM; jump squats: 0–30% 1RM; bench press throws: 30–50% 1RM; these differ from hypertrophy loading (6–12 RM) — periodization must address specific F-V curve zones to develop complete athletic profile; never train only one part of the F-V curve")
            sciRow(stat: "Kraemer 2002 (ACSM)", detail: "Functional strength and aging: muscle mass peaks at age 25 (men) and 18 (women), then declines 3–5% per decade; after age 60 accelerates to 1–2% per year (sarcopenia); strength training preserves power, balance, and bone density — each year of resistance training reduces all-cause mortality risk 15% independently (Stamatakis 2018: 10,700 adults, 6.5 year follow-up)")
        }
    }

    private var recoveryAndPeriodizationCard: some View {
        scienceCard(title: "Recovery, Periodization & Programming", icon: "📈", color: .blue) {
            sciRow(stat: "Schoenfeld 2016", detail: "Training frequency: each muscle group needs 48–72h recovery; training each muscle 2× per week produces 30% greater hypertrophy than 1× per week at equal weekly volume; full-body 3×/week is superior to body-part splits for beginners and intermediates; advanced athletes may benefit from 4–5× per week per muscle group with lower per-session volume (daily undulating periodization)")
            sciRow(stat: "Zourdos 2016", detail: "Repetitions in reserve (RIR) and training proximity to failure: RIR 0 (failure): maximum MPS stimulus but ×2 recovery time needed; RIR 2–3: 85–90% of maximum stimulus with dramatically lower fatigue accumulation; most effective long-term programming uses RIR 3–4 in foundational periods, progressing to RIR 0–1 in peaking phases (Helms 2018: autoregulation model)")
            sciRow(stat: "Rhea 2003 (J Strength Cond Res)", detail: "Periodization: non-linear (undulating) periodization produces superior strength gains over linear periodization in trained individuals — 29% vs 14% strength increase in 12 weeks; daily undulating periodization (DUP): Monday heavy (3×5), Wednesday moderate (4×8), Friday light (5×15) — varied stimulus prevents accommodation; linear periodization still superior for beginners")
            sciRow(stat: "Damas 2016", detail: "Muscle damage and repeated bout effect: first training session causes severe delayed-onset muscle soreness (DOMS), peak at 24–72h; subsequent identical sessions: muscle damage 10–50% of initial; DOMS does not indicate hypertrophy stimulus — advanced athletes rarely experience DOMS yet continue gaining muscle; progressive overload (adding weight, reps, or sets) is the only reliable hypertrophy driver")
        }
    }

    // MARK: - Helpers
    private func scienceCard(title: String, icon: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack { Text(icon); Text(title).font(.headline).bold() }
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

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let workoutType = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let strengthTypes: Set<HKWorkoutActivityType> = [
            .traditionalStrengthTraining, .functionalStrengthTraining,
            .coreTraining, .highIntensityIntervalTraining
        ]
        let strengthWorkouts = workouts.filter { strengthTypes.contains($0.workoutActivityType) }

        let total = strengthWorkouts.count
        let avgMin = total > 0 ? strengthWorkouts.reduce(0.0) { $0 + $1.duration / 60 } / Double(total) : 0

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for workout in strengthWorkouts {
            let weeksAgo = Int(now.timeIntervalSince(workout.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += workout.duration / 60 }
        }

        await MainActor.run {
            self.totalSessions = total
            self.avgDuration = avgMin
            self.weeklyMinutes = weekly
            self.isLoading = false
        }
    }
}
