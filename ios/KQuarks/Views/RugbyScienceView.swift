import SwiftUI
import HealthKit

struct RugbyScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .green)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .red)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .orange)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Physical Demands by Position",
                    icon: "figure.rugby",
                    color: .green,
                    rows: [
                        sciRow(stat: "Backs: 7–9 km per match; forwards: 5–7 km",
                               detail: "Roberts 2008 (GPS study, Super Rugby): backs cover 7–9 km per match with significantly more high-intensity running (>5.5 m/s); forwards cover 5–7 km with significantly more high-intensity collisions. Loose forwards (flankers, No. 8) present hybrid profiles: 7–8 km distance with both high collision frequency AND high running demands. VO₂max norms: backs 55–62 mL/kg/min; tight forwards 48–54 mL/kg/min; loose forwards 52–58 mL/kg/min."),
                        sciRow(stat: "Tackle frequency: 15–25 collisions per forward per match",
                               detail: "Quarrie 2007: forwards complete 15–25 tackles per match; backs 8–14. Each tackle involves mean collision force 2.5–4.5 G for ball carrier, 2.0–3.5 G for tackler. Body mass × velocity (momentum) predicts tackle outcome better than isolated strength measures. Low centre of mass at tackle initiation (hip-knee flexion) reduces injury risk 35% — a key technique focus in rugby coaching."),
                        sciRow(stat: "Scrum: 800–1200 N peak force per prop",
                               detail: "Milburn 1990 (classic biomechanics study, still referenced): scrum engagement generates 800–1,200 N peak compressive force per front-row prop, with spinal compressive loads of 3,000–5,000 N at lumbar L4/L5. Modern scrum engagement sequence (crouch-bind-set) reduced cervical neck injuries 40% vs older engagement calls. Scrum technique training must address thoracic extension, hip-knee drive synchronisation, and horizontal force application."),
                        sciRow(stat: "Sprint profiles: 20–30 efforts per match",
                               detail: "Austin 2011: rugby union players complete 20–30 high-speed efforts per match (>5 m/s), with sprints lasting 2–8 s. Acceleration from standing to top speed: 0–20 m in 3.0–3.5 s for elite backs. Top speed reached by elite wingers: 9–10 m/s (32–36 km/h). Position-specific sprint demands: wings 30+ sprint efforts; tightheads 8–12. Training prescription must reflect these positional ranges.")
                    ]
                )

                scienceCard(
                    title: "Collision Science & Injury Prevention",
                    icon: "cross.case.fill",
                    color: .red,
                    rows: [
                        sciRow(stat: "Concussion: most reported injury in rugby",
                               detail: "Fuller 2015 (World Rugby epidemiology): concussion is the most commonly reported injury in professional rugby union at 4.7 per 1,000 player-hours, with tackles causing 76% of concussions. Rugby World Cup data shows concussion incidence 4–5× higher than in training. World Rugby mandatory return-to-play: graduated 6-step HIA (Head Injury Assessment) protocol; minimum 7 days symptom-free. Under-19 law modifications (reduced contact training time) target cumulative sub-concussive exposure."),
                        sciRow(stat: "Shoulder: 22–28% of time-loss injuries",
                               detail: "Headey 2007: shoulder injuries account for 22–28% of time-loss injuries in professional rugby, with glenohumeral dislocation (anterior) most common from tackle/ruck contact. First-time dislocation in young rugby players: 70–90% recurrence rate without surgical stabilisation. Acromioclavicular joint sprains: prevalent in front-row from scrum contact. Prevention: posterior shoulder strength balance (ER:IR ratio >0.75), rotator cuff pre-activation protocols."),
                        sciRow(stat: "ACL: 12–18 months lost; tackle is mechanism",
                               detail: "King 2010: ACL injury incidence in rugby union 0.7–1.5 per 1,000 player-hours; tackle is the mechanism in 60–65% of cases. Return-to-play: 10–16 months post-surgical reconstruction. Prevention: FIFA 11+ adapted for rugby (Copenhagen adductor, Nordic hamstring curl, single-leg balance) reduces lower extremity injury rate 30–40% in RCT evidence. Prop and loose forward positions show highest ACL incidence due to combined torsional load and acceleration demands."),
                        sciRow(stat: "Neck injury: scrummaging risk",
                               detail: "Quarrie 2014 (New Zealand RugbySmart programme): cervical spine injuries in scrummaging reduced 40% after introduction of mandatory front-row technique coaching, referee education on crouch-bind-set, and props\' certification requirement for under-age rugby. Sustained neck strengthening programme (neck extension, flexion, lateral flexion isometrics: 3×/week) reduces injury risk in high-contact positions. Neck girth > 40 cm associated with 45% lower concussion incidence in epidemiological studies.")
                    ]
                )

                scienceCard(
                    title: "Energy Systems & Recovery Science",
                    icon: "bolt.heart.fill",
                    color: .orange,
                    rows: [
                        sciRow(stat: "75–85% aerobic contribution in rugby union",
                               detail: "Deutsch 1998: energy system analysis shows rugby union is 75–85% aerobic by total energy contribution across a match. However, the critical moments — tackles, scrums, sprint breaks — are 100% anaerobic (PCr-dependent). Blood lactate during play: 4–7 mmol/L. Backs at 70–85% HRmax for extended periods; forwards spending more time at 75–90% HRmax. Dual energy system conditioning (aerobic base + repeat-sprint capacity) is essential."),
                        sciRow(stat: "Post-match recovery: 72–96 hours for full restoration",
                               detail: "McLellan 2011: creatine kinase (CK) marker of muscle damage peaks 24–36 hours post-match in professional rugby players, returning to baseline by 72–96 hours. CK values post-match: 2,000–8,000 IU/L (significantly above baseline of <200 IU/L). Recovery interventions: cold water immersion (10–15°C, 10 min) reduces CK 22% vs passive recovery at 24h; compression garments reduce perceived soreness 30%; sleep extension to 9+ hours/night accelerates glycogen restoration."),
                        sciRow(stat: "Weekly periodisation: load management in competition phase",
                               detail: "Gabbett 2014 (adapted from rugby league data applicable to union): acute:chronic workload ratio (ACWR) management in rugby. Season structure: 2-day block post-match (passive + active recovery), 3-day preparation block (increasing intensity), 1-day pre-match taper. GPS PlayerLoad targets: 75–85% of peak week during competition to maintain fitness without accumulating injury risk. Studies show 45–60% of rugby injuries occur during the highest-load training weeks."),
                        sciRow(stat: "Nutrition: protein needs 1.8–2.4 g/kg/day",
                               detail: "Burke 2011 (applied to rugby): forward positions require 1.8–2.4 g/kg/day protein for muscle mass maintenance under high collision training stimulus. Pre-match CHO loading: 7–10 g/kg BW 24 hours before; 1–2 g/kg in 3–4h before match. During match: 30–60 g/hr CHO (gels, sports drinks) for matches exceeding 60 min. Creatine supplementation: 5 g/day maintenance dose increases PCr stores 15–20%, benefiting repeated sprint performance in forwards.")
                    ]
                )

                scienceCard(
                    title: "Rugby League vs Union vs Sevens Physiology",
                    icon: "chart.bar.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Rugby League: higher intensity but shorter match",
                               detail: "King 2012 (GPS comparison): Rugby League players cover 8–11 km per match with significantly higher high-intensity running distance than Union (2.5–3.5 km vs 1.8–2.5 km). NRL players average 30–40 high-intensity efforts per match vs 20–30 in Rugby Union — reflecting league's continuous play structure without rucks. Blood lactate: 6–10 mmol/L during NRL matches — higher than union. VO₂max requirements: NRL backs 56–64 mL/kg/min."),
                        sciRow(stat: "Rugby Sevens: extreme aerobic-anaerobic hybrid",
                               detail: "Higham 2012 (World Rugby Sevens): 7-a-side players cover 1.5–2.0 km per 7-minute half (14-minute game), with high-intensity running proportion of 35–45% — far exceeding both codes of 15-a-side. Heart rate: 90–95% HRmax sustained nearly throughout a game. Oxygen uptake: 88–92% VO₂max during play. Sevens tournaments (3–4 games/day) impose cumulative fatigue — nutrition and rapid recovery between games is the dominant performance differentiator."),
                        sciRow(stat: "Scrum vs lineout: anaerobic demands quantified",
                               detail: "Deutsch 2007: set-piece analysis — scrum engagement + sustained pushing phase (3–8 s): 90–95% anaerobic. PCr is the primary fuel. Blood lactate post-scrum sequence: 3–5 mmol/L. Lineout: primarily technical/skill (lifting, timing) with brief anaerobic demand at jump execution. Front-row training should include weighted sled push intervals, isometric wall-push circuits, and scrum machine repetitions to develop set-piece-specific power."),
                        sciRow(stat: "Growth: women's rugby fastest growing rugby variant",
                               detail: "World Rugby 2023 data: women's rugby is the fastest-growing team sport globally, with 15-a-side and Sevens formats. Physiological profiles: elite women's rugby union backs VO₂max 50–58 mL/kg/min; forwards 44–52 mL/kg/min. Tackle frequency: similar to men's game but lower collision impact forces due to mass differences. ACL injury rates 3–4× higher than men's rugby — hip abductor and ACL prevention protocols are especially critical in the women's pathway.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Rugby Science")
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
        let rugby = workouts.filter { $0.workoutActivityType == .rugby }
        let sessions = rugby.count
        let totalHR = rugby.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = rugby.map { $0.duration / 60 }.reduce(0, +)
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
