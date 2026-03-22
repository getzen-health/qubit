import SwiftUI
import HealthKit

struct MotorSportsScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .red)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .orange)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "G-Force & Physical Demands",
                    icon: "car.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "F1 drivers: 5–6 G in high-speed corners, 5 G under braking",
                               detail: "Formula 1 cornering G-forces: Silverstone Copse corner 5.5 G lateral, braking from 300 km/h to 80 km/h generates 5 G deceleration in 1.5 s. Neck muscles must support a 6 kg helmet experiencing forces up to 30 kg. Neck hypertrophy is the most distinctive physical adaptation in F1 drivers."),
                        sciRow(stat: "Neck strength: F1 drivers 4–5× stronger neck than general population",
                               detail: "Neck extensor and lateral flexor strength requirements, isometric neck holds at 5 G, training protocols (neck harness, cable neck work), Adrian Newey aerodynamics forcing cockpit positions requiring extreme neck angles. Côté 2003 (F1 physiological demands)."),
                        sciRow(stat: "Core temperature: 40–41°C cockpit temperature in mid-summer races",
                               detail: "Thermal stress in F1 cockpits: cockpit temperature 40–50°C in Singapore GP, driver core temperature rising 1.5–2.0°C during 90-minute race. Sweat loss: 2–3 kg (L) per race. Pre-cooling strategies (ice vest) used by F1 teams. Cognitive performance at elevated core temperature."),
                        sciRow(stat: "MotoGP: 6 G under braking from 300 km/h, arms-only support",
                               detail: "Motorcycle racing G-forces without the structural support of a car chassis — riders hanging off the bike in corners. Physical demands: forearm and grip fatigue ('arm pump' — acute compartment syndrome in forearms during races), core engagement for high-G position changes.")
                    ]
                )

                scienceCard(
                    title: "Reaction Time & Cognitive Demands",
                    icon: "brain.head.profile",
                    color: .orange,
                    rows: [
                        sciRow(stat: "F1 reaction time: 0.19–0.22 s lights-out start",
                               detail: "F1 start reaction times (2022–2024 data): optimal window 0.18–0.22 s. False start threshold: <0.10 s. Sensory processing: retinal latency 40 ms + cognitive processing 80 ms + motor execution 60 ms. Visual cortex processing of 5-light sequence. Practice effect: professional reaction time is 15% faster than untrained subjects."),
                        sciRow(stat: "Decision-making: 200+ critical decisions per race lap",
                               detail: "Cognitive load analysis: gear selection (up to 8 gears, 50+ shifts/lap), braking point selection (10+ zones/lap), traction management, fuel saving, radio communication processing, competitor positioning. Mental fatigue over 90-minute race duration."),
                        sciRow(stat: "Spatial awareness: 360° mental model at 300 km/h",
                               detail: "Proprioception and spatial awareness in racing drivers: updating mental model of 20 competitors while managing car balance, calculating closing speeds of 50+ m/s, processing radar/mirror information. Expert drivers perceive effectively 3× more information per second vs. novice drivers."),
                        sciRow(stat: "Dual tasking: managing car physics while executing tactical decisions",
                               detail: "F1 drivers simultaneously manage: optimal racing line, braking points, tyre management, fuel management, competitor responses, team radio information, weather changes. Cognitive resources allocation, sport expertise research (Abernethy 2001) on dual-task performance in expert athletes.")
                    ]
                )

                scienceCard(
                    title: "Physiology of Racing Drivers",
                    icon: "heart.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "VO₂max: 55–65 mL/kg/min for F1 drivers",
                               detail: "F1 driver aerobic fitness: VO₂max 55–65 mL/kg/min required for race endurance. HR during race: 140–180 bpm sustained (70–90% HRmax) due to isometric muscle work and thermal stress — without traditional aerobic locomotion. Michael Schumacher's reported resting HR: 36 bpm (elite endurance athlete level)."),
                        sciRow(stat: "Isometric loading: steering force 25–35 kg at high-speed corners",
                               detail: "Steering force requirements: F1 steering wheel at fast corners requires 25–35 kg force from driver, 8–12 kg through slow corners. Combined with G-force amplification of arm mass, forearm and shoulder endurance becomes critical. Training: steering simulator, cable isometric exercises."),
                        sciRow(stat: "Weight: 80 kg combined driver + seat minimum (FIA regulations)",
                               detail: "FIA weight ballast system, driver body weight and F1 performance, training implications of maintaining racing weight 68–72 kg, dehydration vs. performance in heat environments."),
                        sciRow(stat: "Vibrational stress: back injury risk from chassis vibration",
                               detail: "Road vibration transmission through chassis to spine — rally car drivers particularly affected. Spinal disc degeneration in long-career rally drivers documented. Seat design and damping systems, core stability for vibration absorption.")
                    ]
                )

                scienceCard(
                    title: "Training & Preparation Science",
                    icon: "chart.bar.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "F1 driver conditioning: 3–4 hours/day at peak preparation",
                               detail: "Physical training programme for F1 drivers: neck work (daily), core stability, cardiovascular fitness (cycling, swimming, running), reaction/coordination training, simulator work (2–4 hours), mental preparation. Total preparation: 6–8 hours/day during intensive periods."),
                        sciRow(stat: "Simulator: 95% of F1 testing now virtual",
                               detail: "Formula 1 simulator technology: full motion sim for setup work, static sim for driving style development, validity coefficient 0.87–0.92 correlation with real-lap time. New circuit learning: 50+ laps on simulator before physical track time. Cost: $10–15M per simulator for works teams."),
                        sciRow(stat: "Heat acclimatisation: 10–14 days in hot environment before Singapore/Abu Dhabi",
                               detail: "Pre-race heat adaptation protocol: 10-14 days training in hot conditions increases plasma volume 8–12%, reduces thermal perception and HR response, improves cooling efficiency. F1 teams travel to training camps in Bahrain or UAE before hot-climate races."),
                        sciRow(stat: "Rally: 400–1,000 km per day co-driver navigation and concentration",
                               detail: "Rally driving unique demands: co-driver pace notes delivery at 220 km/h on gravel, 100% concentration across 15–30 stage kilometres, night stage visual adaptation, mental endurance over 14-day rally. Dakar Rally: 8,000 km in 14 days.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Motor Sports Science")
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
        let filtered = workouts.filter { $0.workoutActivityType == .other }
        let sessions = filtered.count
        let totalHR = filtered.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = filtered.map { $0.duration / 60 }.reduce(0, +)
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
