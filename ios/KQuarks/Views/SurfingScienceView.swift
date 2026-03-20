import SwiftUI
import HealthKit

struct SurfingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .cyan)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .blue)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .teal)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Session Structure & Paddling Physiology",
                    icon: "wave.3.forward",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Paddling = 54% of session time",
                               detail: "Farley 2012 (surfing time-motion): paddling out and repositioning = 54% of total surf time; waiting = 28%; surfing waves = 8%; other = 10%. Despite majority paddling, peak physiological stress occurs during brief wave riding (burst sprint effort). Apple Watch surf session = predominantly paddling data."),
                        sciRow(stat: "Paddling VO₂: 70–78% of peak",
                               detail: "Mendez-Villanueva 2006: continuous paddling sustains 70–78% VO₂max. Aerobic base critical for paddle-out endurance and session longevity. Prone paddling: primarily shoulder flexion, scapular stabilization, trunk rotation. Catches fatigue before wave riding — poor paddling fitness = missed waves."),
                        sciRow(stat: "Pop-up: 0.4–0.7 s explosive movement",
                               detail: "Sheppard 2012: surfing pop-up (prone to standing on board) occurs in 0.4–0.7 s. Requires explosive push-up strength + hip flexor power. Muscle activation sequence: triceps → anterior deltoid → hip extensors → knee extensors. Lower limb power (jump height) predicts pop-up speed better than upper-body strength."),
                        sciRow(stat: "Wave riding: 35–65 m/s² board acceleration",
                               detail: "Farley 2015: high-performance surfing maneuvers (cutback, snap, tube) generate 35–65 m/s² board acceleration measured via gyroscope. Turn G-force: 3–5 G during powerful snaps. Knee flexion 90–130° during bottom turns. Ankle proprioception = critical performance discriminator.")
                    ]
                )

                scienceCard(
                    title: "Injury Epidemiology & Safety",
                    icon: "cross.case.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Board impact = 55% of all injuries",
                               detail: "Nathanson 2002 (largest surfing injury study, n=1,348): own board contact causes 55% of injuries; reef/sand = 18%; other surfer's board = 5%. Leash use reduces drowning risk but increases board rebound impact. Soft-top boards for beginners reduces lacerations 70%."),
                        sciRow(stat: "Head & neck: most common injury site",
                               detail: "Taylor 2004: head and neck = 27% of all acute surfing injuries. Skull impact with board during wipeout most dangerous. Holistic prevention: helmet use (only 2% adoption), reef avoidance, shallow-water surfing discipline. Cervical spine fractures: 0.2 per 1,000 surf sessions at point breaks."),
                        sciRow(stat: "Exostosis ('surfer's ear'): cold water risk",
                               detail: "Rinaldi 2014: surfer's ear (bony growth in external auditory canal) develops after years of cold water (< 19°C) and wind exposure. Prevalence: 48–80% of surfers surfing in cold water > 5 years. Custom ear plugs reduce risk 85%. Surgical removal requires drilling — prevention essential."),
                        sciRow(stat: "Drowning & rip current risk",
                               detail: "Peirson 2019: rip currents cause 80% of surf lifesaving rescues. Survival strategy: don't fight rip — swim parallel to shore × 50 m, then return. Wipeout breath-hold capacity: trained surfers 1–3 min; big wave surfers 4–6 min after CO₂ tolerance training. Two-wave hold-down: critical survival scenario.")
                    ]
                )

                scienceCard(
                    title: "Biomechanics of Wave Riding",
                    icon: "figure.surfing",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Stance & balance: surfer CoM control",
                               detail: "Nessler 2013: elite surfers maintain center of mass ±2–3 cm lateral deviation vs. ±8–12 cm in recreational surfers during carving turns. Balance board training transfers to surfing posture stability. Single-leg balance time (eyes closed) > 45 s correlates with elite-level surf performance."),
                        sciRow(stat: "Bottom turn mechanics: power generation",
                               detail: "Moreira 2014: bottom turn is the foundation of all surfing maneuvers — generates centripetal acceleration for subsequent snap or cutback. Optimal entry angle: 30–45° to wave face. Hip and knee flexion depth correlates with turn radius control. Ground reaction force at base of turn: 2.2–3.5× body weight."),
                        sciRow(stat: "Tube riding: body position and pitch control",
                               detail: "Hatchell 2012: tube riding requires maintaining position in the 'pocket' — wave lip curls overhead. Critical speed regulation: too fast exits tube prematurely; too slow = lip impact. Board angle adjustment: subtle rear-foot pressure shifts 5–15° tail angle. Elite tube riders process wave face curvature 60–80 ms faster than recreational surfers."),
                        sciRow(stat: "Equipment: board volume and rocker",
                               detail: "Hutt 2001: surfboard volume determines paddling speed (higher volume = more buoyancy = easier paddle) vs. maneuverability trade-off. Optimal shortboard volume ≈ body weight (kg) × 0.30–0.35 L. Rocker (board curvature): flat rocker → speed; high rocker → tighter turns. Fin configuration affects drag and pivotability.")
                    ]
                )

                scienceCard(
                    title: "Training for Surf Fitness",
                    icon: "dumbbell.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Dry-land training: surf-specific exercise",
                               detail: "Secomb 2015: dry-land surf-specific resistance program (8 weeks, 2×/week) improved paddle speed 6.3%, pop-up time 12%, and 400m paddle time 4.8%. Key exercises: prone paddle simulation (cable pull-down), pop-up burpees, single-leg squats, rotational med ball throws. Shoulder external rotation strengthening reduces rotator cuff injury 40%."),
                        sciRow(stat: "Paddling fitness test: 400m paddle",
                               detail: "Sheppard 2013 (ASP WCT testing): 400m prone paddling time discriminates elite (5:45–6:15) from recreational (7:30+) surfers. Predictors: swim VO₂max, pull-up max reps, vertical jump. Professional surfers complete 4–8 km paddle per 2-hour session in onshore conditions; much less in offshore."),
                        sciRow(stat: "Breath-hold training for wipeout tolerance",
                               detail: "Dujić 2006: CO₂ tolerance training (O2 tables, CO₂ tables) extends breath-hold duration 40–60% in 4 weeks. Static apnea for surfers: 2–3 min target. Danger: hyperventilation before breath-hold causes shallow water blackout (SpO₂ drops without CO₂ signal). Never train breath-holding alone in water."),
                        sciRow(stat: "Surf-specific yoga and flexibility",
                               detail: "García 2018: 6-week surf-specific yoga program improved hip flexor flexibility 28%, spinal rotation 22%, and subjective wave-catching rating by 34% (n=34 recreational surfers). Key areas: thoracic rotation (for duck-diving), hip flexors (pop-up efficiency), shoulder mobility (paddle reach and power).")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Surfing Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
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
        let surfing = workouts.filter { $0.workoutActivityType == .surfingSports }
        let sessions = surfing.count
        let totalHR = surfing.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = surfing.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = sessions
            avgHR = sessions > 0 ? totalHR / Double(sessions) : 0
            avgDurationMin = sessions > 0 ? totalDur / Double(sessions) : 0
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
