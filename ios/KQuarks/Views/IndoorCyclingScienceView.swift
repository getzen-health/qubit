import SwiftUI
import HealthKit

struct IndoorCyclingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .orange)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .red)
                    statCard(value: avgHR > 0 ? String(format: "%.0f bpm", avgHR) : "--", label: "Avg HR", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Spin Class & Group Cycling Science",
                    icon: "figure.indoor.cycle",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Energy expenditure: 400–600 kcal / 45 min session",
                               detail: "Chavarrias 2019: structured spin classes elicit HR 75–92% HRmax and blood lactate 3–7 mmol/L during interval phases. Indoor classes deliver higher average intensity than equivalent outdoor rides because the absence of downhills removes passive recovery periods — every pedal stroke is loaded. Energy expenditure equivalent to outdoor rides at 35–40 km/h in flat-course terms."),
                        sciRow(stat: "Cadence: 80–110 RPM optimal for endurance, 60–80 for climbs",
                               detail: "Cadence-resistance interaction determines neuromuscular demand. At 90–100 RPM with moderate resistance, type I fibre recruitment dominates and per-rep force is low. At 60–70 RPM with heavy resistance, type II fibres are recruited and each contraction mimics hill-climbing mechanics. High-cadence drills at 120+ RPM train neuromuscular rate coding and pedalling smoothness; low-cadence 50–60 RPM work builds on-bike strength endurance."),
                        sciRow(stat: "Music tempo: 120–140 BPM increases output 15–20%",
                               detail: "Karageorghis 2008: synchronous music at 120–140 BPM increases cycling power output 15–20% compared to no-music control in time-trial trials. The dissociation effect attenuates perceived exertion — music redirects attentional focus away from physiological signals. Motivational music delayed time to exhaustion by 10–15 min in max tests. Effect size decreases above 85% VO₂max as internal cues override external stimuli."),
                        sciRow(stat: "Group dynamics: collective effort increases power 8–12%",
                               detail: "Social facilitation in group spin classes increases self-selected power output 8–12% vs. solo riding at equivalent RPE. Instructor motivation and competitive behaviour with visible riders elevates effort. The Köhler effect is notable: less-fit riders improve disproportionately more in group settings — awareness of being the weakest link motivates above-average effort relative to individual capacity.")
                    ]
                )

                scienceCard(
                    title: "Smart Trainer & Zwift Science",
                    icon: "bolt.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "Virtual cycling: power output matches outdoor within 2–3%",
                               detail: "Direct-drive smart trainers (Wahoo KICKR, Tacx NEO) measure power with ±2% accuracy — equivalent to mid-range power meter pedals used outdoors. ERG mode maintains constant wattage regardless of cadence, enabling precise physiological targeting. Zwift racing physiological demands (sustained threshold with sprint efforts) are equivalent to outdoor criterium racing at equivalent power outputs; sweat rate and cardiac strain are higher indoors due to heat buildup."),
                        sciRow(stat: "FTP: 20-min power × 0.95 = Functional Threshold Power",
                               detail: "FTP approximates one-hour sustainable power. The 20-min test yields slightly elevated values corrected by the 0.95 factor. Average recreational cyclists: 200–250 W (2.5–3.0 W/kg); competitive amateurs: 280–320 W (3.5–4.5 W/kg); elite amateurs: 320–380 W (4.5–5.5 W/kg); professional road riders: 400–450 W (5.5–6.5 W/kg). The critical power (CP) model (Monod 1965) provides a more biologically precise asymptote than FTP but requires three exhaustive trials to calculate."),
                        sciRow(stat: "Indoor heat stress: core temperature 1–2°C higher than outdoor",
                               detail: "The absence of wind chill during indoor training allows core temperature to rise 1–2°C above equivalent outdoor efforts. Sweat rate indoors: 1.5–2.5 L/hour vs. 0.8–1.5 L/hour outdoors. Research recommends >20 km/h airflow from a fan to replicate outdoor convective cooling. Without active cooling, performance drops 5–8% over 60-min sessions as blood is diverted to skin for thermoregulation at the expense of working muscle perfusion."),
                        sciRow(stat: "Training zones: 6–7 power-based models anchor to LT1 and LT2",
                               detail: "Coggan 6-zone and British Cycling 7-zone models define training at physiological anchors: LT1 (first lactate threshold, approximately 55–65% FTP) separates Z2 from Z3; LT2 (MLSS, approximately 95–105% FTP) separates Z4 from Z5. Seiler's polarised model recommends 80% of training below LT1 and 20% above LT2 with minimal time in between — associated with superior VO₂max gains vs. pyramidal or threshold-heavy distributions in elite cyclists.")
                    ]
                )

                scienceCard(
                    title: "Track Cycling Science (Velodrome)",
                    icon: "figure.cycling",
                    color: .orange,
                    rows: [
                        sciRow(stat: "Sprint: 70–75 km/h peak velocity, 2,500+ W peak power",
                               detail: "Track sprint biomechanics revolve around explosive fixed-gear acceleration from a standing or rolling start. Peak power outputs of 2,500–3,000 W are reached in approximately 0.3 s at triple extension. Gear selection balances maximum speed against ability to accelerate out of slow tactical phases: typical keirin gear 90–95 inches. Aerodynamic position optimisation (low handlebar, tucked elbows, aero helmet) reduces CdA by 15–20% versus upright position at 70 km/h."),
                        sciRow(stat: "Team pursuit: 25–30% drafting savings, 62+ km/h average",
                               detail: "Team pursuit (4 riders × 4 km): following riders save 25–30% of aerodynamic energy cost while drafting 0.3–0.5 m behind. Lead rider bears 30–35% higher energy cost than followers. Optimal rotation strategy every 1–1.5 laps prevents lead rider from accumulating lactate above clearance capacity. World record pace (Ganna, 2022): 62.5 km/h average — requiring sustained power approximately 460–480 W for lead rider and 380–400 W for following positions."),
                        sciRow(stat: "Track banking: 42–45° in velodrome corners",
                               detail: "Velodrome banking angle is calculated from centripetal force requirements at design speed: tan(θ) = v² / (r × g). At 50 km/h through a 20 m radius turn, 42–45° banking allows the resultant force to pass through the tyre contact patch without lateral sliding. Fixed gear eliminates coasting: the drivetrain applies a constant mechanical demand preventing unpowered recovery. This creates a fundamentally different neuromuscular pattern than freewheel cycling — hip flexors must actively manage the upstroke against pedal resistance."),
                        sciRow(stat: "Aerodynamics: 70–90% of total resistance at 50 km/h",
                               detail: "At velocities above 40 km/h, aerodynamic drag dominates — comprising 70–90% of total resistance on a velodrome. CdA (drag coefficient × frontal area) for pursuit specialists: 0.20–0.22 m²; sprinters in more upright positions: 0.22–0.28 m². Skin suits reduce CdA 5–8%, aero helmets 3–5%, disc rear wheel 2–3% vs. spoked wheel. Wind tunnel testing costs £3,000–8,000 per day; field-based CdA estimation using power meters and speed (chung method) provides 80% of the accuracy at minimal cost.")
                    ]
                )

                scienceCard(
                    title: "Physiology & Training",
                    icon: "heart.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "VO₂max: 72–88 mL/kg/min for world-class track endurance cyclists",
                               detail: "Elite track endurance cyclists (pursuers, points race specialists) possess VO₂max values comparable to road grand tour contenders: 72–88 mL/kg/min. Cardiac stroke volumes of 200–220 mL/beat are typical. Left ventricular hypertrophy from years of high-volume cycling produces Athlete's Heart — enlarged cavity volume with normal wall thickness distinguishing it from pathological hypertrophy. VO₂max alone explains only ~70% of performance variance; FTP:VO₂max ratio and cycling economy complete the picture."),
                        sciRow(stat: "Power-to-weight: 6.0 W/kg required for professional racing",
                               detail: "Professional road racing requires FTP ≥6.0 W/kg to be competitive; elite amateur level 4.5–5.5 W/kg; competitive recreational 3.0–4.0 W/kg. Sprint W/kg (peak 5-sec power) and FTP W/kg measure different qualities: track sprinters peak at 20–25 W/kg; climbers optimise FTP W/kg at 6.0–7.0. Cycling climbing velocity scales linearly with W/kg on grades above 5% — each 0.1 W/kg improvement at 6% grade reduces 20 min climb time approximately 45 seconds for a 70 kg rider."),
                        sciRow(stat: "Altitude: 3-week block at 2,500 m increases EPO 20–30%",
                               detail: "Haematological adaptation to altitude training: hypoxic exposure stimulates HIF-1α → erythropoietin (EPO) release from the kidneys → reticulocyte increase within 5–7 days → elevated haemoglobin mass after 3+ weeks. Live-high-train-low (LHTL) methodology maximises both the haematological stimulus (from living at altitude) and training quality (from higher-intensity sessions at sea-level PaO₂). Performance benefit of 1–3% in time trials peaks 2–4 weeks post-return to sea level before haemoglobin mass begins declining."),
                        sciRow(stat: "Recovery: compression + ice bath post-spin reduces DOMS 25–30%",
                               detail: "Cold water immersion at 10–15°C for 10 minutes post-session reduces CK (creatine kinase) 20% and perceived DOMS 25–30% vs. passive recovery (Bleakley 2012). Mechanism: vasoconstriction limits inflammatory oedema; tissue cooling reduces nerve conduction velocity and pain signalling. Compression tights improve venous return and interstitial fluid clearance. Active recovery rides the following day at 50–55% FTP enhance metabolite clearance without adding training stress — preferred over complete rest for professional-level training blocks.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Indoor Cycling Science")
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
        let cycling = workouts.filter { $0.workoutActivityType == .cycling }
        let sessions = cycling.count
        let totalHR = cycling.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = cycling.map { $0.duration / 60 }.reduce(0, +)
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
