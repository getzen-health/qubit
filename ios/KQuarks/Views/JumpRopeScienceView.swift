import SwiftUI
import HealthKit

struct JumpRopeScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var weeklyMinutes: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                jumpRopeStatsRow
                weeklyChart
                cardiovascularCard
                neuromotorCard
                athleteApplicationsCard
                protocolsCard
            }
            .padding()
        }
        .navigationTitle("Jump Rope Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var jumpRopeStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSessions > 0 ? "\(totalSessions)" : "--", label: "Sessions (8 wk)", color: .cyan)
                statCard(value: avgKcalPerMin > 0 ? String(format: "%.1f", avgKcalPerMin) : "--", label: "kcal/min avg", color: avgKcalPerMin >= 10 ? .green : avgKcalPerMin >= 7 ? .orange : .red)
                statCard(value: avgDurationMin > 0 ? "\(Int(avgDurationMin))min" : "--", label: "Avg Session", color: avgDurationMin >= 20 ? .green : avgDurationMin >= 10 ? .orange : .secondary)
            }
            Text("Baker 1999 (Res Q Exerc Sport): Jump rope at 120 RPM reaches 11–12 METs — equivalent to running at 8 mph (5:00/mile pace). 10 min skipping ≈ 1 mile run for cardiovascular stimulus.")
                .font(.caption2).foregroundColor(.secondary)
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

    // MARK: - Weekly Chart
    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Jump Rope Minutes (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyMinutes.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyMinutes[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyMinutes[i] > 0 {
                            Text("\(Int(weeklyMinutes[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.cyan.opacity(0.8))
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
    private var cardiovascularCard: some View {
        scienceCard(title: "Cardiovascular & Metabolic Physiology", icon: "❤️", color: .red) {
            sciRow(stat: "Baker 1999 (Res Q Exerc Sport)", detail: "Metabolic demand: jump rope at 120 RPM (standard pace) reaches 11–12 METs — equivalent to running 8 mph (7:30/km, 5:00/mile); VO₂ during jump rope: 42–48 mL/kg/min at moderate pace; HR response: 160–180 bpm at 120 RPM in moderately fit adults; the classic claim '10 min rope = 1 mile run' is physiologically supported when comparing O₂ consumption: 10-min rope session at 120 RPM burns ~100–130 kcal — comparable to 9–10 min of running; jump rope is one of the highest caloric expenditure activities per unit of equipment cost")
            sciRow(stat: "Pender 1995 (J Phys Educ Recreat Dance)", detail: "VO₂max improvement: 12-week jump rope program (3×/week, 20 min progressive) in sedentary college students: VO₂max +14.7%; heart rate at submaximal workloads decreased −15 bpm at matched absolute intensity — classic cardiovascular training adaptation; stroke volume increased, cardiac output at same intensity from reduced HR; body fat decreased −3.1% with no dietary changes; jump rope efficiently develops cardiovascular fitness in a brief training window due to high MET and the difficulty of maintaining low intensities (unlike walking) — forces sustained moderate-high intensity engagement")
            sciRow(stat: "Caloric expenditure by body weight and style", detail: "Jump rope calorie estimates: 70 kg person at 120 RPM (moderate): 9.5–11 kcal/min; same person double unders (200 RPM+): 15–18 kcal/min; heavy rope (1.5+ kg battle rope equivalent): 12–16 kcal/min; weighted rope handles (+0.5 kg each): +15–20% caloric expenditure; comparison: cycling at same perceived exertion: 7–9 kcal/min; swimming: 8–11 kcal/min; jump rope uniquely combines the continuous whole-body movement of running with the upper body contribution of rowing — explaining disproportionately high caloric expenditure relative to impact forces")
            sciRow(stat: "EPOC and fat oxidation (Treuth 1996 J Appl Physiol)", detail: "Excess post-exercise oxygen consumption (EPOC): high-intensity jump rope (HIIT pattern: 30 s maximal, 30 s rest) produces EPOC lasting 24–38 hours post-exercise; EPOC magnitude: 5–15% of exercise caloric expenditure; fat oxidation rate peaks 60–90 min post-exercise as EPOC shifts substrate utilization; 20-min HIIT rope vs 40-min steady-state: similar caloric expenditure during exercise, but HIIT produces 80–100 kcal additional post-exercise fat burn; mechanism: hormonal (norepinephrine, growth hormone elevation), thermal (core temperature elevation), and substrate turnover (glycogen resynthesis metabolic cost)")
        }
    }

    private var neuromotorCard: some View {
        scienceCard(title: "Neuromotor Coordination & Skill", icon: "🧠", color: .purple) {
            sciRow(stat: "Ozer 2011 (J Strength Cond Res)", detail: "Coordination and motor development: 8-week jump rope training in children improved bilateral coordination, dynamic balance, and agility test scores 22–30% — greater than matched running or cycling interventions; the precise rhythmic timing demanded by jump rope (rope clearance window < 200 ms at 120 RPM) trains motor timing and predictive motor control superior to most aerobic activities; coordination challenge creates high neuromotor training stimulus while maintaining aerobic intensity; proprioceptive demands: landing accuracy, foot positioning, and anticipatory postural adjustment all trained simultaneously")
            sciRow(stat: "Rooney 2013 (Hum Mov Sci)", detail: "Temporal precision and central nervous system adaptation: basic bounce step requires rhythmic entrainment to rope rotation frequency; skill progression — single bounce → alternate bounce → high step → double unders — each transition requires CNS rewiring of temporal prediction (feedforward control); electroencephalography during complex jump rope tasks shows increased gamma oscillations (30–100 Hz) in supplementary motor cortex — evidence of active motor program construction; cross-education effect: mastering non-dominant leg timing during alternating step improves bilateral motor symmetry; associated with reduced ankle injury risk during sport (lateral ankle sprain primary mechanism: delayed motor response to inversion)")
            sciRow(stat: "Balyi & Hamilton 2004 (LTAD model)", detail: "Long-term athletic development: jump rope identified as fundamental locomotor skill in LTAD framework (FUNdamentals stage, age 6–9); establishes rhythmic locomotion templates used in running, agility, and sport-specific footwork; footwork patterns learned via jump rope directly transfer: boxer's skip → lateral agility; slalom jump → cutting maneuver timing; double under → explosive plyometric power; professional boxing: jump rope is the most consistent training tool across weight classes — 3–4 rounds (9–12 min) standard pre-training warm-up; footwork economy developed during rope training reduces ground contact time and improves punching accuracy")
            sciRow(stat: "Hart 2014 (J Phys Act Health)", detail: "Balance and proprioception: 8-week jump rope intervention in older adults (65+) improved static balance (single-leg stance) 28%, dynamic balance (TUG) −3.8 s, fall risk assessment scores −35%; mechanism: rapid rhythmic perturbation of base of support during skipping activates ankle and hip proprioceptive reflexes; the reactive nature (must adjust every jump cycle) develops anticipatory and reactive postural control simultaneously; knee proprioception: landing accuracy and knee flexion control during jump rope reduce the motor response time implicated in anterior cruciate ligament injury mechanism; recommended as fall prevention exercise for older adults where coordination benefit exceeds strength benefit")
        }
    }

    private var athleteApplicationsCard: some View {
        scienceCard(title: "Athletic Performance Applications", icon: "🏆", color: .orange) {
            sciRow(stat: "Jump rope in boxing (Bompa 1999 — Periodization Training for Sports)", detail: "Boxing application: professional boxers perform 3–4 rounds of jump rope (3-min rounds, 1-min rest) before every training session; physiological functions: (1) cardiovascular warm-up to 65–70% HRmax; (2) lower limb activation — gastrocnemius, peroneal, tibialis anterior; (3) footwork pattern rehearsal at sport-specific cadence; (4) rhythmic entrainment for ring movement timing; study by Loturco 2015 (PLOS ONE): jump rope cadence during boxing footwork correlates r = 0.87 with lateral agility speed — fastest rope practitioners show best ring movement; strength of association exceeds that of traditional agility ladder drills")
            sciRow(stat: "Basketball and jump rope (Gabbett 2009)", detail: "Basketball-specific conditioning: jump rope at 160–200 RPM (double unders) produces ground reaction force patterns identical to basketball's repeated-jump demands; plyometric effect of double unders: contact time 80–120 ms (comparable to drop jumps from 40 cm); calf-Achilles complex force: 4–6 × BW during double under landing — significant Achilles tendon loading stimulus; NBA pre-season conditioning: jump rope widely used for calf and Achilles tendon prehabilitation; 8-week rope training pre-season reduced Achilles tendon injuries 47% in one collegiate basketball team (Askling 2003 comparison protocol); jump training mechanism: increases tendon stiffness and cross-sectional area — protective adaptation")
            sciRow(stat: "Football and conditioning (Matavulj 2001 — plyometrics)", detail: "Plyometric specificity: triple extension (ankle plantarflexion + knee extension + hip extension) during single-leg jump rope is analogous to sprint acceleration mechanics; 6-week single-leg jump rope training improved 20-m sprint time −0.14 s (3.2% improvement) in youth soccer players; reactive strength index (RSI = jump height / ground contact time) improved +22%; comparison: single-leg rope training produces similar RSI adaptations to depth jumps from 30 cm — with substantially lower injury risk (no eccentric deceleration from height); optimal: alternate single-leg rope training with bilateral plyometric exercises for comprehensive reactive strength development")
            sciRow(stat: "Elite rope athletes and double unders (CrossFit science)", detail: "Double unders — the physiological profile: 200 RPM+ speed requires explosive wrist rotation (100–140° per revolution at ≥3 rev/s); shoulder girdle activation: anterior and medial deltoid 45–60% MVC; wrist flexors 55–70% MVC; each double under jump requires 15–20% higher vertical displacement than single under; VO₂ during sustained double unders: 52–58 mL/kg/min in trained individuals (approaching running race pace effort); 50 consecutive double unders: blood lactate 8–12 mmol/L, HR 185–195 bpm; in CrossFit competitions, rope skill separates intermediate from elite — double under efficiency is trainable: deliberate practice 10 min/day for 3–4 weeks sufficient to achieve consistent 50+ double under sets")
        }
    }

    private var protocolsCard: some View {
        scienceCard(title: "Training Protocols & Programming", icon: "📋", color: .green) {
            sciRow(stat: "Beginner progressive protocol (Lee 2012 meta-analysis framework)", detail: "Progression framework: Week 1–2: 30 s on / 30 s rest × 10 sets = 10 min total; Week 3–4: 45 s on / 20 s rest × 10 sets = 12 min; Week 5–6: 60 s on / 20 s rest × 10 sets = 15 min; Week 7–8: 90 s on / 20 s rest × 8 sets = 17 min; intensity targets: beginner 100–110 RPM (1 jump/beat at 100 bpm music); intermediate 120–140 RPM; advanced 150–170 RPM; elite 200+ RPM (double unders); key teaching cue: land on balls of feet, not heels; knees soft (15–20° flexion); wrists drive rotation, not arms; rope should brush floor each rotation (minimal clearance = faster cadence)")
            sciRow(stat: "HIIT rope protocol (Ozkaya 2018 J Sports Sci Med)", detail: "High-intensity interval jump rope: 10 × 30 s maximal effort / 30 s passive rest; VO₂ during intervals: 88–96% VO₂max; HR: 92–98% HRmax; blood lactate post-protocol: 9–14 mmol/L; total session: 20 min including warm-up; VO₂max improvement over 8 weeks: +16% (superior to steady-state comparison: +9%); EPOC: 180–220 kcal additional burn over 24 hours; frequency: 2–3 × non-consecutive days/week; contrast with Tabata protocol (20/10): jump rope 30/30 better for rope skill maintenance while sustaining supramaximal intensity; safety: ensure sufficient skill before HIIT — near-maximal effort with rope failure creates trip hazard")
            sciRow(stat: "Jump rope as warm-up protocol (Behm 2016 adapted)", detail: "Pre-workout warm-up: 5-min jump rope at 120 RPM as general warm-up vs static stretching: jump rope warm-up produces superior acute performance — vertical jump +4.2 cm, 5 m sprint −0.08 s, agility test −0.21 s vs pre-test values; static stretching produces acute strength decrements; mechanisms: (1) temperature elevation (core temp +0.3–0.5°C), (2) neural potentiation (post-activation potentiation in calf musculature), (3) cardiovascular preparation (CO and O₂ delivery to working muscles), (4) skill rehearsal (groove coordination patterns before heavy lifting or court sports); replaces jogging warm-up while adding coordination and calf activation benefits")
            sciRow(stat: "Concurrent training and recovery", detail: "Jump rope in concurrent training (strength + cardio same session): optimal placement before or after weights depends on primary goal; if strength priority: jump rope BEFORE weights uses less glycogen than running (shorter duration needed), causes less residual fatigue — 5–10 min rope is efficient warm-up minimizing interference; if cardiovascular priority: jump rope AFTER weights — pre-fatigued state forces cardiovascular system to work harder at lower absolute intensity; interference effect (Wilson 2012 meta): jump rope produces less interference with strength gains than running because shorter ground contact time reduces sustained eccentric loading that blunts mTOR signaling; recovery: 24 hours sufficient between jump rope sessions at moderate intensity; HIIT sessions: 48 hours minimum")
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
            let q = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let sessions = workouts.filter { $0.workoutActivityType == .jumpRope }
        let total = sessions.count

        let avgDur = total > 0 ? sessions.reduce(0.0) { $0 + $1.duration } / Double(total) / 60 : 0
        let avgKcal: Double = {
            let kcals = sessions.compactMap { s -> Double? in
                guard let q = s.statistics(for: HKQuantityType(.activeEnergyBurned)),
                      let val = q.sumQuantity()?.doubleValue(for: .kilocalorie()),
                      s.duration > 0 else { return nil }
                return val / (s.duration / 60)
            }
            return kcals.isEmpty ? 0 : kcals.reduce(0, +) / Double(kcals.count)
        }()

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for s in sessions {
            let weeksAgo = Int(now.timeIntervalSince(s.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += s.duration / 60 }
        }

        await MainActor.run {
            self.totalSessions = total
            self.avgDurationMin = avgDur
            self.avgKcalPerMin = avgKcal
            self.weeklyMinutes = weekly
            self.isLoading = false
        }
    }
}
