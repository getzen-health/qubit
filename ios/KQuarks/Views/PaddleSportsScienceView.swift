import SwiftUI
import HealthKit

struct PaddleSportsScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .blue)
                    statCard(value: avgHR > 0 ? String(format: "%.0f", avgHR) : "--", label: "Avg HR bpm", color: .teal)
                    statCard(value: avgDurationMin > 0 ? String(format: "%.0f min", avgDurationMin) : "--", label: "Avg Duration", color: .green)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Paddling Biomechanics",
                    icon: "figure.water.fitness",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Kayak stroke: catch-to-exit 0.4–0.6 s, 60–80 strokes/min",
                               detail: "Kendal 1992 (kayak biomechanics): sprint kayak stroke mechanics follow a distinct catch, pull, and exit sequence lasting 0.4–0.6 s per stroke at race pace. Blade entry angle during the catch phase is 70–80° from horizontal to maximise early propulsive force. Pull phase generates 200–400 N of blade force in elite paddlers. Exit timing is critical — late exit increases drag without additional propulsion. Trunk rotation contributes 60–65% of total propulsive force, making kayaking fundamentally a core sport with the arms acting primarily as force transmitters."),
                        sciRow(stat: "Trunk rotation: core generates 60–65% of paddle force",
                               detail: "Elite kayak paddling relies on the obliques and thoracic erector spinae as primary force generators rather than the arms. The kinetic chain runs from hip rotation through the torso to the blade: elite paddlers exhibit 45–55° of trunk rotation per stroke, with the contralateral hip driving the initiation. This coordination protects the shoulder joint from bearing full propulsive load and explains why rotator cuff injuries correlate strongly with inadequate trunk engagement. Coaches use on-water video and force sensors to assess trunk contribution; athletes deficient in trunk rotation show increased shoulder injury risk."),
                        sciRow(stat: "SUP stroke: high kneeling vs. standing stability demands",
                               detail: "Stand-up paddleboard (SUP) stroke mechanics differ substantially from seated kayak: paddle length is optimised at approximately 20–25 cm above head height for standing paddling. Blade angle at water entry: 10–15° from vertical for efficient catch. The unstable surface of a SUP board increases gluteal and hip stabiliser activation 30–45% compared to seated kayak, adding significant co-contraction overhead. High kneeling SUP (as used in outrigger canoe training crossover) reduces balance demands while maintaining trunk rotation requirements. Balance demands add 8–12% metabolic overhead compared to equivalent seated paddling power output."),
                        sciRow(stat: "Canoe OC-1 sprint: asymmetric J-stroke biomechanics",
                               detail: "Outrigger canoe single (OC-1) paddling is inherently asymmetric — the paddle is held on one side and a J-stroke correction manoeuvre is required at the end of each stroke to maintain course. This creates unilateral dominance in the obliques, latissimus dorsi, and contralateral hip flexors of the paddling side. Sprint OC-1 stroke rate: 75–90 strokes/min in Olympic-style sprint events. Long-distance OC-1 paddling (Molokai 2 Oahu: 52 km) requires highly efficient aerobic mechanics with minimal wasted correction force, demanding years of technique refinement to overcome inherent asymmetric loading patterns.")
                    ]
                )

                scienceCard(
                    title: "Physiological Demands",
                    icon: "heart.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Sprint kayaking VO₂max: 65–75 mL/kg/min for K1 500m",
                               detail: "K1 500m sprint kayaking represents the highest aerobic demand of all paddle sports. Race duration: 90–105 s in elite competition. Athletes sustain 85–92% VO₂max throughout the race with a brief supramaximal start. Post-race blood lactate reaches 12–16 mmol/L — among the highest values recorded in Olympic sports, exceeding rowing (8–14 mmol/L) and cycling time trials (10–14 mmol/L). Elite male K1 500m paddlers demonstrate absolute VO₂max values of 5.5–6.5 L/min. The short race duration forces near-maximal anaerobic and aerobic contribution simultaneously, making training across both energy systems essential."),
                        sciRow(stat: "K1 1000m: 4:15–4:30 min race, 88–95% HRmax",
                               detail: "The K1 1000m Olympic event demands a sophisticated pacing strategy: the first 250m involves an aggressive anaerobic establishment phase to claim water position, the middle 500m represents aerobic steady-state at ~88–92% HRmax, and the final 250m sprint taxes both the lactate-buffering capacity and remaining anaerobic reserves. Oxygen debt accumulates progressively through the middle section; elite paddlers rely on aerobic training volumes of 800–1,000 km/year to sustain this pacing model. Recovery between race-pace training sets requires 8–12 minutes for full lactate clearance to training-relevant levels."),
                        sciRow(stat: "Flatwater vs. whitewater: continuous vs. intermittent demands",
                               detail: "Slalom kayaking (course time: 90–110 s, 18–25 gate manoeuvres) requires VO₂max of 60–68 mL/kg/min — approximately 10% lower than sprint kayak — reflecting the intermittent gate-holding and eddy-catch demands that interrupt continuous propulsion. Whitewater slalom demands include anticipation of hydraulic features, reactive steering with the lower body via boat lean, and upper body isometric holds against current at gate negotiations. Sprint flatwater kayaking (K1, K2, K4) requires purely continuous propulsion with bilateral symmetrical mechanics — a fundamentally different physiological and technical profile from slalom despite similar race duration."),
                        sciRow(stat: "SUP racing: VO₂max 58–66 mL/kg/min",
                               detail: "SUP race physiology spans a wide spectrum: SUP 200m sprint events (approximately 50–55 s duration) demand near-maximal anaerobic effort with blood lactate 8–12 mmol/L post-race. Long-distance SUP racing — exemplified by the Molokai 2 Oahu crossing (52 km in open ocean) — is almost purely aerobic at 65–72% VO₂max sustained over 4–5+ hours. The balance demands inherent to standing paddling on a moving board add a continuous stabilisation overhead of 8–12% metabolic cost, elevating caloric expenditure and proprioceptive fatigue beyond what the paddling power output alone would predict. Core endurance therefore limits SUP performance across both sprint and endurance formats.")
                    ]
                )

                scienceCard(
                    title: "Upper Body Demands & Injury",
                    icon: "bandage.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Shoulder: 50–60% of elite kayak injuries",
                               detail: "The shoulder is the primary injury site in competitive kayaking, accounting for 50–60% of all injuries in elite flatwater paddlers. Elite training volumes of 60,000–100,000 strokes per week create substantial cumulative rotator cuff loading. Supraspinatus impingement is the most common diagnosis, exacerbated by a high catch angle that requires maximum glenohumeral elevation at maximal force output. AC joint stress occurs during powerful pull-through. Dislocation risk is elevated in whitewater kayaking due to bracing and rolling mechanics that place the shoulder in the vulnerable 90°-abduction, externally-rotated position — identical to the mechanism of anterior shoulder dislocation in contact sports."),
                        sciRow(stat: "Lower back: 25–35% injury rate in kayak/canoe",
                               detail: "Lumbar injury accounts for 25–35% of chronic complaints in kayak and canoe athletes. The seated kayak posture creates sustained lumbar flexion, increasing disc pressure substantially compared to standing or neutral spine positions. In sprint kayaking, repetitive trunk rotation at 60–80 strokes/min over training sessions lasting 90+ minutes creates continuous torsional disc and facet loading. Disc injury risk is highest during high-volume base training phases. Interventions include adjustable seat and footrest positioning to increase lumbar lordosis, core stability programming targeting multifidus and deep abdominals, and periodised volume management to limit cumulative lumbar load."),
                        sciRow(stat: "Wrist tendinopathy: grip loading in high stroke rate",
                               detail: "Wrist and forearm tendinopathy — particularly extensor carpi ulnaris stress and intersection syndrome — is the third most common injury in kayaking. High stroke rates (60–80/min) maintained for hours during training load the wrist extensors continuously with grip cycling at the paddle shaft. Paddle grip pressure and handle diameter are key modifiable risk factors: ergonomic grip diameter of 28–34 mm reduces extensor loading compared to smaller circumference shafts. De Quervain tenosynovitis arises from incorrect grip technique — primarily failure to relax the trailing hand during the swing phase. Paddling gloves reduce friction and grip effort, lowering forearm extensor activation 15–20% during long sessions."),
                        sciRow(stat: "Haemolysis: foot pump paddling causes mechanical haemolysis",
                               detail: "Mechanical haemolysis from repetitive foot pressure during the kayak power phase — paddlers brace against footrests with each stroke to transmit leg force — causes red blood cell destruction analogous to foot-strike haemolysis in runners. Elite kayakers performing high weekly training volumes show elevated serum lactate dehydrogenase (LDH), reduced haptoglobin, and haemoglobinuria consistent with clinically significant haemolysis. This creates a chronic iron loss pathway that, combined with high training demands, places elite paddlers at moderate risk of iron deficiency anaemia. Monitoring via serum ferritin every 3–4 months and dietary iron optimisation are standard practice in high-performance kayak programmes.")
                    ]
                )

                scienceCard(
                    title: "Training Science & Performance",
                    icon: "chart.bar.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Elite kayak: 800–1,000 km paddling volume per year",
                               detail: "Olympic sprint kayak athletes typically accumulate 800–1,000 km of on-water paddling per competitive year, distributed across a periodised annual training plan. The aerobic base phase (October–January) emphasises high volume at low intensity (UT2: < 2 mmol/L lactate), building the aerobic engine and technical foundation. As competition season approaches (May–August), volume reduces while intensity increases toward race-specific intervals. This polarised volume/intensity distribution — approximately 70% low intensity, 15% moderate, 15% high — is consistent with periodisation models from other Olympic endurance sports and is supported by lactate testing conducted 4–6 times annually to track training adaptation."),
                        sciRow(stat: "Ergometer training: paddling ergometer replicates 85% of on-water demands",
                               detail: "The kayak ergometer (paddle ergometer) provides indoor training that replicates approximately 85% of on-water biomechanical and physiological demands, making it a valid tool for VO₂max testing, interval training, and monitoring in adverse weather. Standard ergometer VO₂max test protocol: 4-minute stages with 1 mmol/L lactate increments from 2 mmol/L baseline. The primary limitation vs. on-water is reduced boat balance stimulus and the absence of stroke-rate-dependent drag (water provides quadratic resistance vs. ergometer's programmable load). Cross-training on ergometers during high-volume land phases contributes meaningfully to cardiovascular maintenance while reducing on-water accumulated volume and technical fatigue."),
                        sciRow(stat: "Strength training: lat-dominant pulling power for catch force",
                               detail: "Paddle sports strength programming centres on lat-dominant pulling movements: lat pulldown, single-arm cable row, and bent-over row develop the primary propulsive musculature for the pull phase. Trunk rotation cable exercises and anti-rotation press progressions build the core rotational power that contributes 60–65% of stroke force. Posterior shoulder health exercises — face pulls, band external rotation, and Y-T-W scapular stability work — are prescribed to offset the anterior dominance of high-volume paddling and protect the rotator cuff. Olympic lifting derivatives (hang clean, landmine press) develop the explosive force transmission capacity needed for race starts and acceleration paddle phases."),
                        sciRow(stat: "Taper: 3-week taper maintains fitness while reducing fatigue 25–30%",
                               detail: "Pre-competition taper for sprint kayak racing follows a 3-week model: week 1 reduces training volume 40–50% while maintaining intensity and frequency; week 2 reduces volume a further 20%; week 3 focuses on race-pace activation and recovery. This progressive taper reduces accumulated training fatigue 25–30% as measured by HRV restoration and subjective well-being scores, while preserving peak aerobic fitness (VO₂max and lactate threshold) for 2–3 weeks of reduced volume before significant detraining occurs. Properly executed taper protocols produce performance enhancements of 2–4% — meaningful at Olympic competition margins of 0.5–1.5% between medal positions.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Paddle Sports Science")
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
        let paddle = workouts.filter { $0.workoutActivityType == .paddleSports }
        let sessions = paddle.count
        let totalHR = paddle.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = paddle.map { $0.duration / 60 }.reduce(0, +)
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
