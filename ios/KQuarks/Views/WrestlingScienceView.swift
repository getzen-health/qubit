import SwiftUI
import HealthKit

struct WrestlingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .indigo)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .red)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .orange)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Match Physiology & Energy Systems",
                    icon: "figure.wrestling",
                    color: .indigo,
                    rows: [
                        sciRow(stat: "Match HR: 175–190 bpm throughout",
                               detail: "Yoon 2002: elite wrestling match sustains avg HR 175–190 bpm — close to maximum. Blood lactate peaks 8–14 mmol/L post-match (Barbas 2011). Explosive takedowns generate maximal PCr demand; brief recovery between attempts allows partial resynthesis."),
                        sciRow(stat: "Anaerobic power: 65–70% of total energy",
                               detail: "Horswill 1992: freestyle wrestling match energy: 65–70% anaerobic (PCr + glycolytic), 30–35% aerobic. Superior to boxing in anaerobic share due to maximal-effort wrestling exchanges lasting 2–10 s. VO₂max testing: 55–65 mL/kg/min in elite wrestlers."),
                        sciRow(stat: "Grip & upper-body demand",
                               detail: "Ratamess 2011: wrestling requires sustained grip force at 80–95% maximal voluntary contraction during clinches and takedown attempts. Forearm flexor endurance is a critical performance discriminator between elite and sub-elite. Grip fatigue = 30–50% increased pin risk."),
                        sciRow(stat: "Recovery between periods",
                               detail: "Vardar 2007: 30-s rest between periods insufficient for full PCr resynthesis (requires ~3 min for 100% recovery). Wrestlers enter period 2 and 3 with 40–60% PCr depletion from period 1. Aerobic base accelerates PCr resynthesis during low-intensity wrestling phases.")
                    ]
                )

                scienceCard(
                    title: "Takedown Biomechanics & Technical Skill",
                    icon: "hand.raised.fingers.spread.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "Double-leg: maximal ground reaction force",
                               detail: "Funk 2004: double-leg takedown generates 2.5–3.5× bodyweight ground reaction force in the penetration step. Hip drive contributes 55–65% of takedown power. Ankle dorsiflexion angle in penetration step correlates with takedown success rate (Mirzaei 2009)."),
                        sciRow(stat: "Level change: 0.15–0.25 s execution window",
                               detail: "Elko 2013: elite wrestlers complete level change (stand to shot) in 0.15–0.25 s. Reaction time advantage of elite vs. collegiate: 40–60 ms. Visual processing of opponent's movement precedes motor response — cognitive training accelerates this pathway."),
                        sciRow(stat: "Sprawl defense: hip drive vs. penetration",
                               detail: "Onate 2006: effective sprawl requires hip-to-floor contact within 0.3 s of sensing takedown attempt. Hip extension force >150% bodyweight in successful sprawl. Counter-attack from sprawl (guillotine choke, cement mixer) requires immediate transition from defensive to offensive motor program."),
                        sciRow(stat: "Pinning: back-pressure biomechanics",
                               detail: "Utter 2002: pinning an opponent generates 85–95% maximal isometric force in shoulder press and hip thrust simultaneously. Near-fall position (back exposure ≥45°) achieved via tilt series, gut wrench, and turk (greco). Maintaining pin vs. bridge defense: trunk rotational strength key differentiator.")
                    ]
                )

                scienceCard(
                    title: "Weight Management & Cutting Science",
                    icon: "scalemass.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "5% BW dehydration: −9.5% anaerobic power",
                               detail: "Fogelholm 1994: 5% bodyweight dehydration (cutting for weigh-in) reduces anaerobic power 9.5% and aerobic power 5%. Maughan 1996: cognitive function impairs at >2% dehydration. Standard collegiate weigh-in 24–36h before competition is insufficient for full rehydration."),
                        sciRow(stat: "Rapid weight loss: harmful cycling",
                               detail: "Oppliger 1998 NCAA study: 40% of wrestlers lose >5 kg per season; repeated cutting reduces muscle mass and increases fat percentage over career. Minimum Wrestling Weight (MWW) programs reduce severe cutting. Gradual weight loss (0.5–1 kg/week) preserves muscle glycogen and LBM."),
                        sciRow(stat: "Rehydration: 24h insufficient for PCr restoration",
                               detail: "Barr 1999: after 5% dehydration, 24h rehydration restores plasma volume but not full intracellular water content. Muscle glycogen restoration requires carbohydrate intake + water: 8–12 g CHO/kg over 24h. Salt and electrolyte replacement critical for fluid retention."),
                        sciRow(stat: "Cutting without heat: safer strategies",
                               detail: "Timpmann 2008: water restriction + salt restriction cuts 3–4% BW safely with <2% performance decrement. Sauna (passive dehydration) cuts deeper but impairs temperature regulation in subsequent match. IOC 2018 consensus: recommend no rapid weight loss < 3% BW in 24h.")
                    ]
                )

                scienceCard(
                    title: "Injury Prevention & Cauliflower Ear",
                    icon: "cross.case.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Most common injury: knee ligament 28%",
                               detail: "Wroble 1996 (epidemiological study): knee injuries = 28% of all wrestling injuries; shoulder = 21%; head/neck = 16%. ACL tear risk during single-leg attacks and defensive sprawl. Knee brace wearing reduces MCL injury risk 40% in high-school wrestlers (Sitler 1994)."),
                        sciRow(stat: "Cauliflower ear: auricular hematoma",
                               detail: "Schuller 1989: cauliflower ear from repeated auricular friction and compression causing subperichondrial hematoma. Without drainage within 48–72h, fibrocartilage replaces hematoma → permanent deformity. Ear guards (mandatory in collegiate USA) reduce incidence 60–75%. Aspiration + compression bandage is treatment."),
                        sciRow(stat: "Skin infections: 24% of high school wrestlers",
                               detail: "Adams 2002: herpes simplex (Herpes gladiatorum), ringworm, and impetigo — the 'wrestling skin triad'. H. gladiatorum seroprevalence 73% in collegiate wrestlers. Prevention: showering immediately post-practice, benzalkonium chloride mat cleaning, and daily antiviral medication in outbreak."),
                        sciRow(stat: "Head & neck: stacking and suplexes",
                               detail: "Pasque 2000: cervical spine injury risk in suplexes (bridge opponent overhead) and stacking maneuvers. Rugby tackling comparison: wrestling has 5× lower cervical spine injury per contact event. Neck strengthening protocol reduces axial load during bridging — neutral spine maintained prevents disc herniation.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Wrestling Science")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -16, to: now) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let wrestling = workouts.filter { $0.workoutActivityType == .wrestling }
        let sessions = wrestling.count
        let totalHR = wrestling.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = wrestling.map { $0.duration / 60 }.reduce(0, +)
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
