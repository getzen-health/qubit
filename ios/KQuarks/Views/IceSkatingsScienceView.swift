import SwiftUI
import HealthKit

struct IceSkatingScienceView: View {
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
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .purple)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Figure Skating Biomechanics",
                    icon: "figure.skating",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Triple Axel: 3.5 rotations in 0.65 s",
                               detail: "The triple Axel is figure skating's most technically demanding jump, requiring 3.5 full rotations in approximately 0.65 seconds of air time. Entry is forward-facing on the left outside edge (for counter-clockwise jumpers), generating angular momentum at takeoff. Peak rotation rate reaches 5–6 revolutions per second in the tightly tucked air position, achieved by drawing arms and free leg close to the body's longitudinal axis — minimising moment of inertia. At takeoff, entry velocity is approximately 8–9 m/s; the skater converts linear momentum into angular momentum via the toe pick and edge drive. Landing occurs on the right back outside edge with ground reaction forces of 3–8× body weight absorbed through >90° knee flexion, reducing peak force 30–40%. The triple Axel remained the preserve of men for decades; in women's skating, Midori Ito (1988 NHK Trophy) was the first to land it in competition. Tonya Harding repeated the feat at 1991 US Championships; in the modern era, Elizaveta Tuktamysheva and Kaori Sakamoto have both executed clean triple Axels in international competition. The four-revolution quad Axel was landed in competition by Ilia Malinin (2022)."),
                        sciRow(stat: "Spin: 4–6 rev/s in layback/camel position",
                               detail: "Figure skating spins exploit conservation of angular momentum: as a skater draws arms and free leg inward, moment of inertia I decreases, increasing angular velocity ω proportionally (L = Iω = constant once spinning). A layback spin in a wide, arched position has moment of inertia ≈ 3–4 kg·m²; when transitioning to a scratch spin (arms overhead, one leg wrapped), I drops to ≈0.8–1.2 kg·m², producing a 3–4× increase in rotation rate. Typical spin rotation speeds: camel spin ≈1–2 rev/s (extended position), layback spin ≈3–4 rev/s (arched), scratch spin ≈4–6 rev/s (fully tucked). Centripetal acceleration at the extended free leg during a 5 rev/s scratch spin (limb at 0.4 m radius): a = ω²r = (31.4)² × 0.4 ≈ 395 m/s² — approximately 40 g. The death drop (flying camel to back sit spin) involves a jump entry to spin, combining aerial rotation physics with on-ice spin mechanics."),
                        sciRow(stat: "Edge work: inside/outside edge pressure control",
                               detail: "Figure skating blades are 3–4 mm wide with a hollow ground concave base, creating two distinct edges — inside (medial) and outside (lateral). The hollow radius (typically 5/16\" to 1\") determines edge grip vs. glide: a deeper hollow (smaller radius) bites more aggressively into ice for spins and jumps; a shallower hollow reduces friction for faster stroking. Blade rocker (curvature along the blade length) is typically 200 cm radius; the toe pick (saw-toothed projection at front) is used for Lutz, Flip, and Axel jump takeoffs. Each jump type has a specific entry edge: Lutz — left back outside; Flip — left back inside; Loop — right back outside; Salchow — left back inside; Toe loop — right back outside (with toe pick assist); Axel — left forward outside. Forward skating uses a full-blade push against ice; backward crossovers generate propulsion via inside edge push of the crossing foot, creating the power build-up used before jumps."),
                        sciRow(stat: "IJS scoring: components + GOE — biomechanical demands",
                               detail: "The International Judging System (IJS) replaced the 6.0 system in 2004, separating technical score (TES) from program components score (PCS). Each jump has a base value (triple Axel: 8.00 points; quad Lutz: 13.60 points); Grade of Execution (GOE) modifies this by ±5 increments, translating to ±4.62 points for a triple Axel. GOE criteria for jumps include: clear edge on takeoff, height and distance, air position quality, landing quality (balance, controlled exit), and flow. Rotation quality is scrutinised: under-rotations of more than ¼ revolution receive a 'q' notation (30% base value reduction) or 'e' for edge errors. Short program (men: 4 min 30 s, women: 2 min 50 s) requires specific mandatory elements including a combination spin, step sequence, and designated jumps. Free skating allows greater compositional latitude but demands more elements — up to 12 jumping passes for men, 7 for women.")
                    ]
                )

                scienceCard(
                    title: "Speed Skating Physics & Physiology",
                    icon: "bolt.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "500m sprint: world record 33.61 s — 15 m/s peak",
                               detail: "Long-track speed skating on a 400m oval demands exceptional power-to-drag efficiency. The 500m world record of 33.61 s (set in the era defined by post-clap skate technique refinements) corresponds to an average speed of 14.9 m/s (53.7 km/h). Peak speeds in the first straight reach 15 m/s. Biomechanical determinants: push angle is 80–90° to the direction of travel (lateral push), maximising propulsive force per stroke; stride length for elite 500m specialists reaches 7–8 m; stroke frequency: 1.8–2.2 Hz. The aerodynamic tuck position — back near-horizontal, arms held behind the back — reduces frontal area from ≈0.58 m² (upright) to ≈0.26 m², cutting aerodynamic drag by 55%. At 14 m/s, drag force in tuck ≈ 85 N vs. upright ≈ 185 N, making the aerodynamic advantage worth several seconds over 500m. The indoor Thialf Arena in Heerenveen, Netherlands (sea level, temperature-controlled ice) holds most world records due to optimal ice hardness and minimal altitude penalty."),
                        sciRow(stat: "Clap skate: 15–17% power increase vs. traditional blade",
                               detail: "The clap skate revolution was introduced in competitive speed skating at the 1998 Nagano Olympics, following decades of research by Gerrit Jan van Ingen Schenau and colleagues (1987 publication). The clap skate features a hinged blade attachment at the toe, allowing the heel to lift while the toe remains on ice — enabling complete ankle plantarflexion (30–40° range vs. 5–10° in traditional fixed blade). This adds the gastrocnemius and soleus as major contributors to each push stroke, increasing total push force 15–17% compared to the traditional fixed-blade skate where the ankle was effectively braced. The 'clap' sound occurs when the spring-loaded hinge snaps the blade back to the boot heel at the end of each push. By 2000, virtually all long-track speed skaters had transitioned to clap skates. Biomechanical analysis confirms longer push phase duration, greater peak force, and improved push impulse compared to traditional blades, with consistent advantage across 500m through 10,000m distances."),
                        sciRow(stat: "VO₂max: 72–82 mL/kg/min for 5000m/10000m specialists",
                               detail: "Long-distance speed skating (5,000m and 10,000m) is among the most aerobically demanding sports in the Olympic programme. Elite male 5,000m/10,000m specialists have VO₂max values of 72–82 mL/kg/min, comparable to cross-country skiers and elite rowers. The aerodynamic tuck position imposes ventilatory restriction by compressing the thorax — minute ventilation in tuck is ≈10–15% lower than in upright cycling at matched power output, making respiratory efficiency a key performance factor. Energy system contributions: 10,000m is ≈95% aerobic; 5,000m ≈90% aerobic; 1,500m ≈70% aerobic / 30% anaerobic; 1,000m ≈55% aerobic; 500m ≈80% anaerobic alactic/lactic. The Dutch dominance in long-track speed skating reflects a deeply embedded culture: natural ice skating in winter, purpose-built oval facilities (Thialf, Heerenveen), and structured national development programmes from age 8 onward. Netherlands has won the majority of Olympic long-track medals since the clap skate era."),
                        sciRow(stat: "Short track: contact sport dynamics, pack racing tactics",
                               detail: "Short track speed skating uses a 111.12 m oval (compared to 400m long track), with 4–6 skaters competing simultaneously around tight 8 m radius corners. Unlike long track, physical contact between skaters is permitted and frequent — shoulder-to-shoulder racing, drafting in single file, and strategic blocking all occur within ISU rules. Drafting reduces aerodynamic drag by 20–30% for following skaters, making tactical positioning critical: the lead skater does the most work while trailing competitors conserve energy for decisive passes. Corner skating requires deep lean angles (up to 30–40° from vertical) maintained through centripetal force generation. Disqualification criteria include: impeding an opponent with arms or hands, causing a fall through blocking, overtaking by cutting inside the cones. Sprint events (500m, 1000m) favour explosive power; the 1500m blends anaerobic capacity with tactical awareness. South Korea and China have dominated Olympic short track through highly technical, system-level coaching programmes.")
                    ]
                )

                scienceCard(
                    title: "Joint Loading & Injury",
                    icon: "bandage.fill",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Figure skating: landing forces 3–8× body weight on one leg",
                               detail: "Every triple jump in figure skating produces a single-leg landing impact of 3–8× body weight (210–560 kg force for a 70 kg skater), concentrated through the right leg (for counter-clockwise jumpers) at the moment of ice contact. Competitive skaters execute 100–200 jumps per on-ice session during heavy training phases, generating substantial cumulative joint loading. Primary vulnerable structures: hip (femoroacetabular impingement from the turned-out landing position), knee (patellar tendinopathy from repeated eccentric quadriceps loading), ankle (posterior impingement from plantar flexion at landing), and tibial shaft (stress fractures from cyclical impact). Knee flexion angle at landing is the most important modifiable technique variable: angles >90° at contact reduce peak ground reaction force by 30–40% through eccentric muscle absorption. Single-leg landing mechanics coaching (avoiding knee valgus collapse, maintaining trunk upright) is a cornerstone of injury prevention in elite figure skating training programmes."),
                        sciRow(stat: "Stress fractures: 20–25% of elite figure skaters",
                               detail: "Tibial and metatarsal stress fractures affect approximately 20–25% of competitive figure skaters during their careers, driven by high jump volume, low bone mineral density (BMD) concerns, and the repetitive eccentric impact pattern. The Female Athlete Triad — the interplay between low energy availability, menstrual dysfunction, and low BMD — is particularly prevalent in figure skating due to aesthetic judging standards creating pressure around body composition. Low energy availability (LEA) at <30 kcal/kg fat-free mass/day suppresses oestrogen, directly impairing bone remodelling and increasing bone stress injury risk. Prevention strategies include: optimising calcium intake (1,000–1,500 mg/day) and vitamin D status (target serum 25(OH)D >40 ng/mL), structured jump volume periodisation (load management), dual-energy X-ray absorptiometry (DEXA) monitoring of BMD, and nutrition education with registered dietitian support. Male figure skaters also show elevated stress fracture risk, primarily from tibial loading during landing."),
                        sciRow(stat: "Ice hockey vs. figure skating blade differences",
                               detail: "Ice skate blade specifications vary dramatically by discipline, reflecting vastly different biomechanical demands. Figure skating blade: 3–4 mm wide, with a prominent toe pick (multiple serrations) for jump takeoffs and spin stops; hollow ground with ¼\" rocker radius; total blade length 28–30 cm. Speed skating (long track) blade: 1.0–1.2 mm wide, completely flat (no hollow), 380–450 mm long — up to 16× longer than figure skating blades. The extreme length provides stability and glide efficiency; the flat grind maximises glide over grip. Short track blades: 1.2 mm wide, slightly offset to the inside (allowing deeper lean angles), 375–400 mm long. Ice hockey blades: 3 mm wide, moderate hollow (7/8\" typical), shorter rockered profile for manoeuvrability and quick directional changes. Blade sharpening frequency: figure skaters typically sharpen every 10–15 hours of ice time; speed skaters sharpen less frequently (every 15–20 hours) due to flat grind; hollow depth profoundly affects edge bite vs. glide balance."),
                        sciRow(stat: "Ankle: figure skater's syndrome — bony impingement",
                               detail: "Posterior ankle impingement — colloquially 'figure skater's ankle' or os trigonum syndrome — results from repetitive extreme plantar flexion compressing the posterior talus between the tibia and calcaneus. The os trigonum is an accessory ossicle present in approximately 10–25% of the population; in figure skaters, the repetitive impingement from jump landings (plantarflexed ankle at ice contact) and Ina Bauer/spiral positions causes synovial inflammation, bone marrow oedema, and — in chronic cases — stress fracture of the posterior talocalcaneal interface. Approximately 15–20% of elite figure skaters experience clinically significant posterior ankle impingement during their careers. Boot stiffness is a key modifiable risk factor: excessively stiff boots restrict dorsiflexion but also provide reduced posterior ankle cushioning. Custom-moulded boot fitting with strategic padding and strategic lace tension adjustment can redistribute boot-foot pressure. Conservative management: activity modification, ultrasound-guided corticosteroid injection; surgical intervention (arthroscopic os trigonum removal) in refractory cases, with return-to-skating in 8–12 weeks.")
                    ]
                )

                scienceCard(
                    title: "Training Science & Artistic Performance",
                    icon: "chart.bar.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Elite figure skating: 4–6 hours on-ice + 2 hours off-ice per day",
                               detail: "Olympic-calibre figure skaters accumulate 1,200–1,500 on-ice hours per year, representing approximately 4–6 hours of ice time per day across 300+ training days. Off-ice training adds 2–3 hours daily: jump harness work (allows skaters to practise rotational mechanics without ice impact, enabling 3× more triple and quad jump repetitions per session), ballet and dance training for artistry and body awareness, strength and conditioning (Olympic lifting derivatives, plyometrics, single-leg stability), and off-ice spin training on spinning platforms. The highest injury risk period is the transition to triple jumps, typically occurring at ages 12–16 in girls and 14–18 in boys, when jump training volume spikes while skaters have not yet fully developed neuromuscular control for the landing demands. This developmental window sees the highest incidence of tibial stress fractures and knee overuse injuries. Periodisation structures training into on-season (competition September–April) and off-season (technique building, new element development May–August)."),
                        sciRow(stat: "Mental performance: figure skating as combined physical-artistic sport",
                               detail: "Figure skating is unique among Olympic sports in combining extreme physical difficulty (quad jumps, high-speed spins) with subjectively judged artistic performance — requiring athletes to simultaneously execute near-limit biomechanical skills while projecting musicality, emotional expression, and aesthetic grace. This dual demand creates distinctive psychological challenges: performance anxiety disrupts the fine motor control required for consistent jump landings; the awareness of being aesthetically judged (body, expression, presentation) amplifies pre-competitive pressure. Comparison with artistic gymnastics is apt — both sports impose appearance standards, involve subjective judging, and require young athletes to master skills at the intersection of athletics and artistry. Psychological interventions used in elite figure skating include: sport psychologist-guided attentional focus training (pre-jump routine standardisation), imagery rehearsal (mental run-throughs of complete programs), self-talk protocols, and acceptance and commitment therapy (ACT) approaches for managing judging anxiety. Mental training is increasingly embedded in elite skating academies as a formal programme component."),
                        sciRow(stat: "Speed skating periodisation: base aerobic → race-specific → competition",
                               detail: "Elite long-track speed skaters follow a structured annual periodisation cycle. May–September (general preparation phase): extensive aerobic endurance development via cycling (road and velodrome), running, and in-line skating on 400m ovals — maintaining skating-specific muscular patterns in the absence of ice. In-line skating is the primary off-season tool for speed skaters, transferring clap-skate push mechanics almost perfectly to inline boot mechanics. October–November (on-ice general preparation): transitioning to ice, rebuilding on-ice technical precision, developing basic endurance on ice. December–March (competition phase): race-specific interval training; 500m specialists emphasise phosphocreatine/lactate development; 5,000m/10,000m specialists focus on lactate threshold intervals and maximal aerobic sessions. Heart rate monitoring in tuck position underestimates relative intensity by 5–10 bpm compared to upright exercise due to thoracic compression effects on cardiac output — power-based monitoring (force instrumented clap skates) is increasingly used at elite level."),
                        sciRow(stat: "Team pursuit: drafting reduces energy expenditure 25–30%",
                               detail: "The speed skating team pursuit involves 3 skaters completing 8 laps (3,200m for women, 4,000m for men) with the finish time determined by the third skater crossing the line. Aerodynamic drafting provides a quantifiable advantage: computational fluid dynamics (CFD) modelling of 3-skater formations shows the lead skater expends 25–30% more aerodynamic power than the 2nd skater, who expends approximately 10% more than the 3rd. The standard rotation strategy has the lead skater peeling off to the back of the formation every 1–2 laps, equalising cumulative fatigue across the team. Optimal formation spacing: 0.3–0.5 m gap between skaters maximises drafting benefit while avoiding collision risk. Formation geometry matters on corners: the trailing skater must lean further (greater centripetal force requirement at the same speed on a tighter inside line). Elite teams use CFD modelling and wind tunnel testing (using cycling teams' facilities) to optimise formation positioning. World record team pursuit performances require sub-26 s individual laps — averaging over 15 m/s sustained for the full distance.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Ice Skating Science")
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
        let skating = workouts.filter { $0.workoutActivityType == .skatingSports }
        let sessions = skating.count
        let totalHR = skating.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = skating.map { $0.duration / 60 }.reduce(0, +)
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
