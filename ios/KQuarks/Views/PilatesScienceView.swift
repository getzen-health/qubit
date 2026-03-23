import SwiftUI
import HealthKit

struct PilatesScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var weeklyMinutes: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                pilatesStatsRow
                weeklyChart
                corePhysiologyCard
                backRehabCard
                neuromotorCard
                pilatesVsYogaCard
            }
            .padding()
        }
        .navigationTitle("Pilates Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var pilatesStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSessions > 0 ? "\(totalSessions)" : "--", label: "Sessions (8 wk)", color: .pink)
                statCard(value: avgDurationMin > 0 ? "\(Int(avgDurationMin))min" : "--", label: "Avg Duration", color: avgDurationMin >= 45 ? .green : avgDurationMin >= 30 ? .orange : .red)
                let weeklyAvg = weeklyMinutes.reduce(0, +) / 8
                statCard(value: weeklyAvg > 0 ? "\(Int(weeklyAvg))min" : "--", label: "Avg/Week", color: weeklyAvg >= 90 ? .green : weeklyAvg >= 45 ? .orange : .red)
            }
            Text("Wells 2014 (J Orthop Sports Phys Ther): Pilates reduces chronic LBP 36% at 6 months — improved deep multifidus activation distinguishes it from general exercise")
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
            Text("Weekly Pilates Minutes (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyMinutes.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyMinutes[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyMinutes[i] > 0 {
                            Text("\(Int(weeklyMinutes[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.pink.opacity(0.8))
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
    private var corePhysiologyCard: some View {
        scienceCard(title: "Core Anatomy & Pilates Physiology", icon: "💪", color: .pink) {
            sciRow(stat: "McGill 2001 (J Spinal Disord)", detail: "Core anatomy: the 'inner unit' (transversus abdominis, multifidus, diaphragm, pelvic floor) contracts 30–110 ms BEFORE limb movement in healthy adults — anticipatory postural adjustment protecting the spine; in chronic LBP patients, this feedforward activation is delayed or absent; Pilates specifically retrains this feedforward pattern through slow, controlled movements emphasizing TrA and multifidus co-activation; the 'drawing-in' maneuver (Pilates navel to spine) selectively activates TrA without bracing outer muscles")
            sciRow(stat: "Hodges & Richardson 1996 (Spine)", detail: "Multifidus and spinal stability: deep multifidus is the primary dynamic lumbar stabilizer — its parallel fiber orientation produces pure extension without shear; in acute LBP, multifidus shows segmental muscle atrophy that does NOT spontaneously recover after pain resolution (Hides 1994 Spine); Pilates spinal extension exercises (Swan, Swimming) preferentially target deep multifidus via sustained isometric lumbar extension against gravity; 8 weeks of targeted multifidus exercise recovers segmental volume 20–25% (Hides 2001 Spine)")
            sciRow(stat: "Akuthota 2008 (Sports Health)", detail: "Core endurance vs strength: McGill's 'Big 3' (curl-up, side bridge, bird-dog) assess core endurance, not strength; Pilates develops core endurance through sustained positions (30–60 s holds) and slow concentric/eccentric control; endurance ratios matter — right:left side bridge >0.05 asymmetry predicts LBP; flexion:extension ratio <1.0 predicts injury; Pilates systematically develops these ratios through bilateral progressions; core endurance improvements are seen in 4–6 weeks of consistent Pilates practice")
            sciRow(stat: "Stokes 2010 (Spine)", detail: "Intra-abdominal pressure (IAP) and Pilates: IAP functions as a hydraulic amplifier for the lumbar spine, reducing loads on passive structures; Pilates breathing (exhale on exertion) coordinates diaphragm, TrA, and pelvic floor to maximize IAP during high-demand exercises; 3-dimensional imaging shows Pilates-trained practitioners generate 15–25% higher IAP during dynamic tasks vs untrained controls; the Pilates 'powerhouse' concept of engaging the pelvic floor on exertion has physiological basis in IAP optimization")
        }
    }

    private var backRehabCard: some View {
        scienceCard(title: "Back Rehabilitation & Injury Prevention", icon: "🦴", color: .blue) {
            sciRow(stat: "Wells 2014 (J Orthop Sports Phys Ther meta-analysis)", detail: "Pilates vs control for LBP: 14 RCTs — Pilates reduces pain SMD −0.80 and disability SMD −0.59 at 4–15 weeks vs control; superior to no treatment and general exercise; not clearly superior to other specific exercise (physiotherapy, yoga); best outcomes when exercises target specific deficits (multifidus, TrA) rather than generic Pilates routines; 8+ sessions required before significant clinical improvement; Pilates is now a first-line physiotherapy treatment for chronic non-specific LBP in Australia, UK, and Brazil")
            sciRow(stat: "Rydeard 2006 (J Orthop Sports Phys Ther)", detail: "Pilates in elite athletes: 4-week Pilates intervention in Australian rules football (ALRF) players reduced LBP episodes 67%, disability days 91%, physiotherapy visits 59%; mechanism: improved lumbopelvic control during high-velocity sport movements; posterior pelvic tilt control on the reformer carriage specifically trains the pattern needed for hip extension in running; Pilates is now standard in professional sports physiotherapy — NBA, NFL, Premier League teams employ Pilates instructors for recovery and prevention")
            sciRow(stat: "Gladwell 2006 (Physiotherapy)", detail: "Pilates and posture: 6-week Pilates RCT improved sagittal spinal curvatures — reduced thoracic kyphosis 3.2° and lumbar lordosis 2.8°; improved standing postural balance (anterior-posterior sway −18%); mechanisms: shortened hip flexors and thoracic extensors lengthened; weakened glutes and deep abdominals strengthened; posture training carries over to reduced fatigue during prolonged sitting and standing; office workers show posture improvements within 4 weeks of Pilates practice")
            sciRow(stat: "Kloubec 2010 (J Strength Cond Res)", detail: "Pilates outcomes at 12 weeks: abdominal strength +21%, upper body muscular endurance +19%, flexibility (sit-and-reach) +20%, dynamic balance +21% in sedentary adults; maximal strength improvements are modest (10–15%) vs resistance training (25–40%); Pilates is NOT sufficient as a sole strength training modality for athletes but effectively supplements primary training; the most significant and consistent Pilates benefits are in body awareness, core endurance, and movement quality rather than peak strength")
        }
    }

    private var neuromotorCard: some View {
        scienceCard(title: "Neuromotor Control & Movement Quality", icon: "🧠", color: .green) {
            sciRow(stat: "Phrompaet 2011 (Asian J Sports Med)", detail: "Pilates and proprioception: 8-week Pilates intervention improved proprioceptive acuity — joint position sense error reduced 35% for lumbar spine and 28% for hip joint; proprioception mediates injury prevention by allowing faster motor response to unexpected perturbations; anterior cruciate ligament injuries occur when proprioceptive latency exceeds 65 ms — Pilates training reduces lumbar and hip proprioceptive delay to <45 ms; joint position sense improvement persists 12+ weeks after cessation of training (neuroplastic adaptation)")
            sciRow(stat: "Pata 2014 (J Body Mov Ther)", detail: "Pilates and balance in older adults: 10-week Pilates in adults >65 improved Berg Balance Scale +5.4 points, TUG (timed up and go) −3.2 s, fear of falling −28%; effect size d = 0.82 — large, clinically meaningful; mechanisms: proprioceptive training, hip abductor strengthening, improved ankle strategy and hip strategy for balance; Pilates reformer exercises (footwork series) specifically develop lower limb proprioception and motor control patterns used in everyday balance recovery")
            sciRow(stat: "Tolnai 2016 (Eur J Sport Sci)", detail: "Pilates for posture in musicians: professional orchestral musicians have elevated LBP (86%), shoulder pain (64%), and neck pain (72%) from sustained asymmetric postures; 16-week Pilates intervention reduced pain 45%, improved cervical rotation 12°, improved shoulder symmetry; mechanism: Pilates breathing and axial elongation counteracts respiratory compensation from instrument postures; sports application: musicians as athletes — Pilates bridges physical performance and artistic expression through neuromotor refinement")
            sciRow(stat: "Anderson & Spector 2000", detail: "Pilates principles and contemporary neuroscience: Pilates six principles (Concentration, Control, Centering, Flow, Precision, Breathing) align with modern motor learning principles; Concentration → attentional focus enhances motor cortex activation 15–25% (Wulf 2016); Precision → error-based learning drives greater cerebellar adaptation than practice without feedback; Flow → smooth movements require predictive motor control (cerebellum-based), not reactive; breathing → respiratory-motor coupling improves movement efficiency via phase-locked brainstem control")
        }
    }

    private var pilatesVsYogaCard: some View {
        scienceCard(title: "Pilates vs Other Mind-Body Practices", icon: "⚖️", color: .orange) {
            sciRow(stat: "Pilates vs yoga — key distinctions", detail: "Pilates: originated 1920s by Joseph Pilates; equipment-based (reformer, Cadillac, Wunda chair) or mat; focus on core stability, spinal alignment, and precise movement control; breath exhaled on exertion (concentric phase); sequential progressions based on functional movement quality; primarily rehabilitation and athletic performance origin; typical METs: 2.5–4.0 (mat Pilates, light-moderate); Yoga: 5,000-year tradition; emphasis on flexibility, breath (pranayama), meditation, and spiritual practice; diverse styles from restorative to power yoga (2.5–7 METs); yoga produces greater flexibility and mindfulness benefits; Pilates produces superior core endurance and movement precision benefits")
            sciRow(stat: "Comparing outcomes: Pilates vs yoga (Cruz-Ferreira 2011)", detail: "14-week RCT in healthy adults: Pilates improved core endurance (60% vs 35% for yoga), dynamic balance (45% vs 28%), and back pain (48% vs 38%); yoga improved flexibility (35% vs 18% for Pilates), mindfulness, and self-reported wellbeing; both improved posture similarly; for chronic LBP, Pilates evidence base (14+ RCTs) exceeds yoga (8 RCTs) but effect sizes are similar; for mental health and stress reduction, yoga evidence substantially exceeds Pilates; optimal: combining both maximizes benefits across all domains")
            sciRow(stat: "Pilates vs resistance training (Bird 2012)", detail: "8-week comparison in older adults: resistance training (+35% strength, +10% balance) vs Pilates (+12% strength, +22% balance); Pilates superior for balance and functional movement quality; resistance training superior for maximal strength and bone density; combining Pilates + resistance training produced the best overall outcomes; Pilates as a warm-up protocol before resistance training improves motor pattern quality and reduces injury risk; professional strength athletes use Pilates for movement quality maintenance, not as primary strength training")
            sciRow(stat: "Clinical Pilates in physiotherapy", detail: "Motor control (MC) exercises derived from Pilates are the dominant physiotherapy approach for LBP worldwide; MC exercise involves specific activation of TrA and multifidus with biofeedback (ultrasound imaging or pressure biofeedback unit); 30-session motor control exercise program reduces chronic LBP recurrence from 84% to 35% over 12 months (Hides 2001 Spine); NHS UK, Medicare USA, and Cochrane reviews support specific motor control exercise for chronic LBP; the Polestar and STOTT Pilates professional certifications specifically train instructors in clinical/rehabilitative Pilates principles")
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

        let pilatesTypes: Set<HKWorkoutActivityType> = [.pilates, .flexibility, .barre]
        let sessions = workouts.filter { pilatesTypes.contains($0.workoutActivityType) }
        let total = sessions.count
        let avgDur = total > 0 ? sessions.reduce(0.0) { $0 + $1.duration } / Double(total) / 60 : 0

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for s in sessions {
            let weeksAgo = Int(now.timeIntervalSince(s.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += s.duration / 60 }
        }

        await MainActor.run {
            self.totalSessions = total
            self.avgDurationMin = avgDur
            self.weeklyMinutes = weekly
            self.isLoading = false
        }
    }
}
