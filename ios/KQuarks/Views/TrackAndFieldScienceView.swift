import SwiftUI
import HealthKit

struct TrackAndFieldScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var sprintSessions: Int = 0
    @State private var distanceSessions: Int = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    private var dominantType: String {
        if sprintSessions > distanceSessions { return "Sprinter" }
        if distanceSessions > sprintSessions { return "Distance" }
        return "Mixed"
    }

    private var typeColor: Color {
        switch dominantType {
        case "Sprinter": return .red
        case "Distance": return .blue
        default: return .orange
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .orange)
                    statCard(value: dominantType, label: "Profile", color: typeColor)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .red)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Sprint Biomechanics & Speed Science",
                    icon: "figure.run.circle",
                    color: .red,
                    rows: [
                        sciRow(stat: "Elite 100m ground contact: ≤80 ms",
                               detail: "Haugen 2019: world-class sprinters (9.8x 100m) achieve ground contact times <80 ms at top speed (60–80 m). Usain Bolt's peak: 9.3 m/s, stride length 2.44 m, stride frequency 4.28 Hz. Ground contact shortening via increased stiffness is THE key mechanism of speed improvement."),
                        sciRow(stat: "Force application: horizontal > vertical",
                               detail: "Morin 2011: sprint acceleration requires horizontal force at 40–45° below horizontal — not vertical jumping force. 'Mechanical effectiveness' (ratio of horizontal to total force): elite sprinters 50–55%; recreational 30–35%. Hip extension power and hamstring late swing phase are critical."),
                        sciRow(stat: "Reaction time: 0.100–0.140 s elite",
                               detail: "Pain 2011: false start threshold (IAAF): <0.100 s reaction time = false start (below human physiological minimum). Elite 100m finalists: 0.100–0.140 s. Female athletes average 15–20 ms longer than male. Block clearance force: 1,500–2,500 N in first step."),
                        sciRow(stat: "Muscle fibers: 60–80% Type II in sprinters",
                               detail: "Mero 1983: world-class sprinters show 60–80% Type IIa/IIx fibers in vastus lateralis (vs. 25–35% in distance runners). Type IIx velocity: 8–12 m/s max shortening; Type I: 1.5–2 m/s. Training shifts IIx → IIa (slower but more fatigue-resistant) — sprint training maintains IIx % better than endurance.")
                    ]
                )

                scienceCard(
                    title: "Energy Systems by Event",
                    icon: "bolt.circle.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "100m: 100% anaerobic (PCr-dominant)",
                               detail: "Jones & Carter 2000: 100m sprint energy: 96–100% anaerobic — primarily phosphocreatine (PCr) in first 6–8 s, then glycolysis dominates final 2–4 s. No meaningful aerobic contribution in <12 s events. Lactate rises to 8–12 mmol/L post-race despite no aerobic contribution during race."),
                        sciRow(stat: "400m: 60% anaerobic / 40% aerobic",
                               detail: "Hirvonen 1987: 400m energy split is 60% anaerobic glycolytic + 40% aerobic. Blood lactate peaks 14–22 mmol/L — highest of any track event. 'Rigor' in final 80 m is PCr depletion + H+ accumulation (pH drops to 6.8). VO₂max largely determines if athlete can sustain form."),
                        sciRow(stat: "800m: 50/50 split at world-class",
                               detail: "Spencer & Gastin 2001: 800m energy is ~50% aerobic / 50% anaerobic at elite level. VO₂ reaches maximum by lap 1 in 1:42–1:45 runners. First lap pace critical: 1:42 WR runners run first lap 50.9 s (26.7 m/s) — impossible without extraordinary lactate tolerance."),
                        sciRow(stat: "5000m+: 90–100% aerobic",
                               detail: "Lacour 1991: 5000m race at 95–98% VO₂max sustainable for ~13–14 min. Final sprint draws on remaining PCr reserves. Marathon runners sustain 75–85% VO₂max for 2+ hours via extraordinary fat oxidation capacity and glycogen conservation. Blood lactate at marathon pace: 2–4 mmol/L.")
                    ]
                )

                scienceCard(
                    title: "Field Events: Throws & Jumps",
                    icon: "arrow.up.right.circle.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Javelin: 80–100 m/s release velocity at 30–36°",
                               detail: "Gregor 1988: javelin release velocity 28–30 m/s for elite male (80–90 m throwers). Optimal angle 28–32° with +/- 5° attack angle for aerodynamic stability. Shoulder internal rotation generates 4,500–6,000°/s angular velocity at release — highest recorded joint angular velocity in sport."),
                        sciRow(stat: "High jump: Fosbury Flop physics",
                               detail: "Dapena 1988: Flop technique allows center of mass to remain 15–20 cm below bar at peak — arch creates concave shape so each body segment crosses below the bar height. Back layout lowers effective CG by 15 cm vs. straddle. World record (2.45 m) requires vertical takeoff velocity of 4.5 m/s."),
                        sciRow(stat: "Long jump: speed × technique × takeoff",
                               detail: "Hay 1993: long jump distance = takeoff velocity × sin(2θ). Elite approach speed 10.5–11.0 m/s at takeoff. Effective takeoff angle: 18–22° (less than theoretical 45°) due to limited eccentric loading time. Top-5 WR holders all sub-10.1 s sprinters — approach velocity is the primary discriminator."),
                        sciRow(stat: "Shot put: rotational power application",
                               detail: "Young 2004: shot put release velocity for 22 m throw: 14.5 m/s. Angular momentum from rotational approach (glide or spin): contributes 70–75% of total release velocity. Elite rotational throwers (Discus, Hammer) achieve 470–550°/s hip rotation. Strength: 4× bodyweight squat correlates with elite throw distance.")
                    ]
                )

                scienceCard(
                    title: "Training Periodization & Elite Development",
                    icon: "chart.line.uptrend.xyaxis",
                    color: .green,
                    rows: [
                        sciRow(stat: "USATF sprint periodization: 4 phases",
                               detail: "Pfaff 2015: elite sprint periodization — Phase 1 (Oct–Dec): general strength, aerobic base, sprint technique; Phase 2 (Jan–Feb): specific conditioning, speed endurance; Phase 3 (Mar–Apr): competition preparation, peak velocity work; Phase 4 (May–Sep): competition season with maintenance training."),
                        sciRow(stat: "Altitude training: Eldoret, Font Romeu, Flagstaff",
                               detail: "Daniels & Oldridge 1970: altitude training at 2,000–2,800 m increases erythropoiesis +20–30 IU/L over 3–4 weeks. Kenyan dominance (Eldoret 2,100 m) partly explained by lifetime altitude adaptation + running culture. Sea-level performance peaks 2–4 weeks post-altitude return."),
                        sciRow(stat: "Speed development: CNS requires 48–72h recovery",
                               detail: "Siff 2003: maximal speed (>95% effort) training requires 48–72h CNS recovery. Elite sprinters: 2–3 speed sessions/week max during competition phase. Volume paradox: too many sprint reps → speed reduction (glycolytic fatigue); too few → insufficient neural adaptation. Sweet spot: 4–6 × 30–60 m at true max."),
                        sciRow(stat: "Long-term athlete development: 10-year rule",
                               detail: "Balyi 2004 LTAD model: top-5 world performance requires 8–12 years of progressive training. Sprint specialization before age 12 is counter-productive — multi-sport through adolescence develops better athletes. Peak sprint performance: 23–27 years (vs. distance: 26–32). Throwback to plyometrics and technical foundation ages 9–12.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Track & Field Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -16, to: now)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let trackWorkouts = workouts.filter { $0.workoutActivityType == .trackAndField || $0.workoutActivityType == .running }
        let sessions = trackWorkouts.count
        let totalHR = trackWorkouts.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        // Estimate sprint vs distance: short/high-intensity runs (< 20 min avg, high kcal/min) = sprint
        let sprints = trackWorkouts.filter { w in
            let dur = w.duration / 60
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            return dur < 25 && (kcal / max(dur, 1)) > 8
        }.count
        let distance = max(0, sessions - sprints)
        await MainActor.run {
            totalSessions = sessions
            avgHR = sessions > 0 ? totalHR / Double(sessions) : 0
            sprintSessions = sprints
            distanceSessions = distance
            isLoading = false
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(.title2, design: .rounded, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    private func scienceCard(title: String, icon: String, color: Color, rows: [AnyView]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundColor(color)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in row }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    private func sciRow(stat: String, detail: String) -> AnyView {
        AnyView(VStack(alignment: .leading, spacing: 3) {
            Text(stat).font(.subheadline).fontWeight(.semibold)
            Text(detail).font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
