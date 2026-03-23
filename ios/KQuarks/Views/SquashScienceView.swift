import SwiftUI
import HealthKit

struct SquashScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .orange)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .red)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Physical Demands — The Most Demanding Racket Sport",
                    icon: "sportscourt.fill",
                    color: .orange,
                    rows: [
                        sciRow(
                            stat: "VO₂max: 62–72 mL/kg/min for elite players",
                            detail: "Girard 2005: squash has the highest physiological demands of any racket sport. VO₂max requirements: 62–72 mL/kg/min for elite men; 55–65 mL/kg/min for elite women. Average HR during match: 86–95% HRmax — sustained higher than tennis, badminton, or table tennis. Rally intensity creates blood lactate 4–8 mmol/L. Work:rest ratio: 2:1 to 3:1 (higher than badminton's 1:2), making squash uniquely demanding for both aerobic and anaerobic systems simultaneously."
                        ),
                        sciRow(
                            stat: "Court coverage: 3–5 km per match, 50–100 direction changes/game",
                            detail: "Vuckovic 2013 (GPS squash): elite players cover 3–5 km per match with 50–100 maximal direction changes per game. Sprint frequency: 30–50 high-intensity efforts per game. Total distance varies significantly by playing style: attacking (boast-and-drop) players cover shorter distances at higher sprint intensity; retrieving players cover greater distances at submaximal intensity. Court dimensions: 9.75 m × 6.4 m; total court area 62.4 m² — smaller than badminton, forcing more intense multi-directional movement per unit time."
                        ),
                        sciRow(
                            stat: "Rally duration: 10–20 s with 5–10 s rest",
                            detail: "Girard 2007: typical squash rally: 10–20 s duration; recovery between rallies: 5–10 s; points per game: 9–15 (PAR 11 scoring). The work:rest ratio (2:1 to 3:1) is the highest of any racket sport. Match duration: 35–75 min (best of 5 games). This intermittent high-intensity pattern demands elite O₂ kinetics (fast VO₂ on-kinetics) and lactate clearance capacity between rallies, making aerobic power — not just aerobic capacity — the key physiological discriminator."
                        ),
                        sciRow(
                            stat: "Knee: MCL/meniscus injuries from extreme lunges",
                            detail: "Jayanthi 2005: squash injury profile dominated by lower extremity injuries (55%): knee (25%), ankle (18%), calf (12%). Extreme lunge depth — the 'ghost lunge' to the front court: knee flexion 100–130°, requiring quadriceps forces of 4–5× body weight. Patellar tendinopathy: 18–25% of elite players. Racket-eye injuries: 5–8% of injuries due to confined court space; appropriate protective eyewear reduces risk 95%. Spinal rotation injuries: 12% — from extreme trunk rotation for side-wall shots."
                        )
                    ]
                )

                scienceCard(
                    title: "Biomechanics & Technique",
                    icon: "figure.racketball",
                    color: .red,
                    rows: [
                        sciRow(
                            stat: "Forehand drive: 140–180 km/h ball speed",
                            detail: "Phomsoupha 2014: squash forehand drive generates ball speeds of 140–180 km/h (elite PSA tour); backhand drive: 110–150 km/h. Racket head speed at impact: 30–40 m/s. Kinetic chain: hip rotation → trunk rotation → shoulder adduction → elbow extension → wrist snap. Wrist extension at contact: critical for controlling ball direction on straight vs. cross-court drives. Racket face angle: 5° variation changes ball trajectory 2–3 m at far wall — requiring millimetre-precision motor control under fatigue."
                        ),
                        sciRow(
                            stat: "Drop shot: deceleration to <40 km/h for nick targeting",
                            detail: "The 'nick' (ball landing in the corner junction of wall and floor) is the highest-value shot in squash — the ball dies immediately with minimal rebound. Achieving the nick requires: sub-40 km/h contact speed, hitting within 15 cm of the side-wall, at 0–5 cm above floor level. Technique: open racket face with minimal wrist snap, disguised until final 50 ms. Elite PSA players achieve nicks on 8–15% of front-court attempts. The deceptive preparation (same swing path for drop and drive) is the most trained technical skill distinguishing elite from sub-elite."
                        ),
                        sciRow(
                            stat: "Ghosting drills: 400–600 court touches per session",
                            detail: "Physical conditioning methodology: 'ghosting' (movement training without ball) to all 4 court corners in predetermined patterns is the primary squash-specific conditioning tool. A 20-minute ghosting session includes 400–600 court touch events. Resistance ghosting (weighted vest, parachute) increases training stimulus. Research (Vuckovic 2010): 8-week ghosting programme improved court coverage speed 12%, reduced energy expenditure per court touch 8% — meaning improved movement efficiency at match intensity."
                        ),
                        sciRow(
                            stat: "Swing path: inside-out for deception and power",
                            detail: "Tod 2018: optimal squash swing mechanics combine an inside-out (anterior to posterior) swing path with hitting point contact at hip height for maximum force transfer and directional control. Contact zone: unlike tennis, squash players must contact the ball at varying heights due to court geometry — forehand contact ranges from knee height (boasts, drops) to shoulder height (high cross-courts), requiring 3–4 technically distinct swing variants. Proprioceptive feedback training (practice in variable-lighting conditions) improves contact consistency 18% in controlled studies."
                        )
                    ]
                )

                scienceCard(
                    title: "Mental Performance & Tactical Intelligence",
                    icon: "brain.head.profile",
                    color: .orange,
                    rows: [
                        sciRow(
                            stat: "Anticipation: elite players commit 200 ms before ball contact",
                            detail: "Murray 2013 (decision science in squash): elite squash players commit to movement direction 200–250 ms before opponent racket-ball contact — relying entirely on predictive cues (hip rotation angle, shoulder position, racket trajectory). Novice players begin movement <50 ms after contact. This 200 ms advantage is trainable: video-based anticipation training (watching match footage with occlusion) improved movement initiation timing 60–80 ms in 6-week intervention. Domain-specific anticipation (not transferable from tennis or other racket sports)."
                        ),
                        sciRow(
                            stat: "Shot selection: 70% of errors are tactical, not technical",
                            detail: "Pearson 2017 (error analysis, PSA matches): analysis of unforced errors in professional squash reveals 70% are attributable to tactical decision errors (wrong shot choice for court position or opponent position) rather than technical execution failures. Elite players execute >95% of technically attempted shots successfully; the performance gap between top-50 and top-5 players is primarily tactical (shot choice under pressure, court geometry management) rather than technical. Implication: advanced coaching prioritises scenario-based decision training over technical drilling."
                        ),
                        sciRow(
                            stat: "Pressure: ghosting heart rate matches match HR at 85–92%",
                            detail: "Physiological match for psychological pressure: ghost training at 85–92% HRmax creates a cognitive load environment similar to competitive play — motor programme selection under cardiovascular stress. High-intensity ghosting combined with shot-calling (coach announces shot type mid-lunge) is the gold standard for bridging physical training and decision-making integration. This methodology, borrowed from military cognitive performance research, is used in PSA training academies."
                        ),
                        sciRow(
                            stat: "Pre-competition routine: 15–20 min warm-up optimal",
                            detail: "Hornery 2009: standardised pre-match warm-up (15–20 min: 5 min solo ball-feeding, 5 min cooperative rallying, 5 min conditioned game) improves first-game performance 8–12% compared to cold starts. The 5-minute ball-hitting period required by PSA rules is physiologically insufficient for VO₂ on-kinetics priming — players who complete extended private warm-up maintain lower match-entry HR recovery cost. Temperature priming: wearing thermal top during warm-up maintains muscle temperature through the required on-court warm-up period."
                        )
                    ]
                )

                scienceCard(
                    title: "Training Science & Periodisation",
                    icon: "chart.bar.fill",
                    color: .red,
                    rows: [
                        sciRow(
                            stat: "Elite training: 3–4 court sessions + 2–3 conditioning per week",
                            detail: "Girard 2012: professional squash players average 3–4 on-court sessions (90–120 min) plus 2–3 off-court conditioning sessions (60–75 min) per week during competition phase. Annual periodisation: pre-season (12 weeks) 60% fitness emphasis; competition phase (8 months) 70% on-court tactical/technical emphasis; transition (4 weeks) active recovery. PSA tour demands: 15–25 competitive matches per month at peak schedule requires careful training-to-competition ratio management."
                        ),
                        sciRow(
                            stat: "High-intensity intervals: 30:30 s protocol squash-specific",
                            detail: "Heishman 2016: squash-specific HIIT protocol: 30 s maximal ghosting effort → 30 s active recovery × 20 repetitions. Physiological response: 88–94% HRmax during work intervals; 70–78% during recovery. 8-week intervention: VO₂max improved 6–9%; time to exhaustion improved 18%; first-game performance in matches improved 14% (compared to steady-state training control). The 30:30 ratio closely matches typical squash rally:rest structure, providing sport-specific physiological adaptation stimulus."
                        ),
                        sciRow(
                            stat: "Strength: posterior chain dominates squash-specific demands",
                            detail: "Lees 2010: squash-specific strength assessment: single-leg squat depth (lunge position equivalent), hip external rotation strength, and posterior shoulder strength (ER) are the three strongest predictors of on-court performance. Recommended S&C: split squat progression (0–90° knee flexion), lateral band walks, Romanian deadlift, face pulls, and anti-rotation core exercises. Weekly resistance training: 2 sessions maintaining primary adaptations; >3 sessions risks residual fatigue impairing court performance. Periodise intensity inverse to competition frequency."
                        ),
                        sciRow(
                            stat: "Recovery: 48-hour minimum for complete neuromuscular recovery",
                            detail: "Bottoms 2006: squash match play produces significant neuromuscular fatigue — countermovement jump height decreased 8–12% immediately post-match; recovery to baseline requires 24–48 hours. Biochemical: CK elevation 2.5–3× baseline at 24 hours post-match (muscle damage marker). Match-day recovery protocol: 10 min cool-down ghosting at 60% intensity, ice bath immersion (12°C, 10 min) reduces CK elevation 15%, compression garments reduce perceived soreness 20%. Multi-match tournament recovery (3+ matches/day): prioritise carbohydrate replenishment (1.2 g/kg/hour first 4 hours) and sleep duration."
                        )
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Squash Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: now)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let squash = workouts.filter { $0.workoutActivityType == .squash }
        let sessions = squash.count
        let totalHR = squash.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = squash.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = sessions
            avgHR = sessions > 0 ? totalHR / Double(sessions) : 0
            avgDurationMin = sessions > 0 ? totalDur / Double(sessions) : 0
            isLoading = false
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(.title2, design: .rounded, weight: .bold)).foregroundColor(color)
            Text(label).font(.caption2).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 10)
        .background(Color(.secondarySystemBackground)).cornerRadius(10)
    }

    private func scienceCard(title: String, icon: String, color: Color, rows: [AnyView]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon).font(.headline).foregroundColor(color)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in row }
        }
        .padding().background(Color(.secondarySystemBackground)).cornerRadius(14).padding(.horizontal)
    }

    private func sciRow(stat: String, detail: String) -> AnyView {
        AnyView(VStack(alignment: .leading, spacing: 3) {
            Text(stat).font(.subheadline).fontWeight(.semibold)
            Text(detail).font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
