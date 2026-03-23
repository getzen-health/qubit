import SwiftUI
import HealthKit

struct EquestrianScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .brown)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .green)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .orange)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Rider Biomechanics & Position",
                    icon: "figure.equestrian.sports",
                    color: .brown,
                    rows: [
                        sciRow(stat: "Posting trot: 60–80 rises per minute, rhythmic energy transfer",
                               detail: "The rising (posting) trot requires 60–80 pelvis-lift cycles per minute, matching the horse's two-beat diagonal gait. Biomechanical analysis (Lovett 2005, equestrian biomechanics research) shows hip flexion/extension timing must couple precisely with the horse's footfall sequence — the rider rises as the outside diagonal pair leaves the ground. Energy absorption occurs primarily through the lumbar spine and hip joints during the sitting phase; pelvis neutrality prevents shear loading at L4–L5. Joint angles at the peak of rising: hip ~110–120°, knee ~150°, ankle in slight dorsiflexion to stabilise the heel. Skilled riders reduce peak vertical acceleration to the horse's back by 30–40% compared to novices, protecting the horse's thoracolumbar fascia."),
                        sciRow(stat: "Sitting trot: lumbar spine absorbs 3–5 G vertical force",
                               detail: "In the sitting trot, the rider's lumbar spine bears 3–5 G of vertical impact force per stride as the horse's hindquarters push upward through each beat. This loading pattern activates erector spinae and multifidus muscles eccentrically to decelerate spinal flexion and protect intervertebral discs. Comparatively, rising trot reduces lumbar loading by approximately 50% per stride but doubles the number of muscle activations per minute. Saddle fit critically modulates force transmission: a saddle with incorrect tree angle concentrates pressure asymmetrically under the rider's seat bones, creating lateral pelvic tilt and compensatory scoliotic loading patterns. Back injury prevention in equestrian athletes therefore requires combined attention to rider posture, core conditioning, and equipment fit."),
                        sciRow(stat: "Two-point (jumping position): gluteal and quad isometric hold",
                               detail: "The two-point (jumping) position adopted during the approach to a fence requires sustained isometric contraction of gluteus maximus, vastus lateralis, and rectus femoris to maintain a flexed-hip, weight-forward posture with heels pressed down and lower leg stable on the horse's barrel. Ankle dorsiflexion of 15–25° distributes body weight through the heel, preventing the leg from swinging back on take-off. Rein grip forces during take-off average 15–20 N in trained riders but spike to 60–80 N in novices as they compensate for balance loss through the hands — a major source of inadvertent bit pressure on the horse. Core engagement prevents the rider's upper body from pitching forward over the horse's neck, which would shift the combined centre of mass ahead of the withers and interfere with the horse's jumping arc."),
                        sciRow(stat: "Gallop/canter: rider's mass × 3 G at landing",
                               detail: "During cross-country fence landings at gallop, impact forces transmitted through the rider's body reach 3 G — approximately three times body weight concentrated across the spine, pelvis, and legs within 100–150 ms. Spinal compression is highest at L1–L3 during the initial landing phase before the horse rebalances. Modern air-vest technology (BETA/ASTM-rated) activates within 100 ms of a fall trigger and provides 40–50 mm of foam inflation to distribute thoracic impact across a larger surface area. Fall statistics in cross-country eventing: approximately 1 fall per 350–1,000 riding hours, with the highest-risk discipline (BE100/Novice cross-country) showing roughly 24% of falls resulting in head contact with the ground — underlining the non-negotiable requirement for certified riding helmets at all times.")
                    ]
                )

                scienceCard(
                    title: "Horse-Rider Interaction Physics",
                    icon: "waveform",
                    color: .green,
                    rows: [
                        sciRow(stat: "Combined centre of mass: optimal at withers during lateral movements",
                               detail: "In classical dressage biomechanics, the ideal combined (horse + rider) centre of mass (CoM) sits approximately at the horse's withers — roughly two-thirds of the way along the back from nose to tail. During lateral movements such as shoulder-in, half-pass, and travers, the rider's weight distribution directly influences the horse's ability to cross its legs, engage its hindquarters, and maintain balance. Research in equine biomechanics shows that a rider who sits crookedly — with even 3–5 kg more weight on one seat bone — causes measurable asymmetry in the horse's hindlimb thrust and can gradually develop asymmetric musculature in the horse's back. This biomechanical coupling means that rider straightness is not merely an aesthetic aspiration in dressage but a physical necessity for correct and sustainable horse movement."),
                        sciRow(stat: "Rein tension: 0.5–3.0 kg light contact; 8–12 kg in collection",
                               detail: "Instrumented rein tension research shows that trained dressage riders maintain light contact of 0.5–3.0 kg force during free forward paces. In collection — where the horse is asked to carry more weight on the hindquarters and flex the poll — rein tension rises to 8–12 kg, applied intermittently through half-halts rather than sustained pulling. Bit type and leverage ratio fundamentally alter force transmission: a simple snaffle applies 1:1 rein-to-bit-ring force; a Pelham with two reins can multiply rider hand force 2.5–4× at the bit. Hand position (vertical plane, distance from body) dramatically affects rein tension because each 5 cm of hand movement forward or backward creates 0.5–1.0 kg of tension change through the rein's elastic properties. Proprioceptive feedback through the reins allows skilled riders to sense subtle changes in the horse's balance and rhythm before they become visible to an observer."),
                        sciRow(stat: "Rider EMG: core muscles activate 50–100 ms before horse foot strike",
                               detail: "Electromyographic (EMG) studies comparing skilled and novice riders demonstrate that experienced equestrians pre-activate their core stabiliser muscles (transversus abdominis, internal oblique, multifidus) 50–100 ms before each expected horse foot strike — a feed-forward neuromuscular strategy that stabilises the rider's pelvis and lumbar spine before the impact impulse arrives. Novice riders show reactive muscle activation occurring after foot strike, creating a brief window of spinal instability with each stride. This pre-activation pattern is learned through years of riding and cannot be consciously directed; it emerges from deep proprioceptive integration of the horse's rhythmic movement patterns. Skilled riders also show significantly reduced co-contraction of antagonist muscles compared to novices, reflecting greater neuromuscular efficiency and explaining the 'effortless' appearance of advanced equitation."),
                        sciRow(stat: "Saddle fit: poor fit reduces horse performance 15–25%",
                               detail: "Pressure mat studies measuring under-saddle contact area and force distribution demonstrate that poorly fitting saddles create peak pressures exceeding 40 kPa over localised areas of the horse's longissimus dorsi muscle — well above the 11 kPa threshold at which capillary blood flow is occluded. Horses ridden in ill-fitting saddles show kinematic changes including shortened stride length (8–12% reduction), reduced thoracolumbar range of motion, and altered hindquarter engagement — a cumulative performance loss of 15–25% measurable in objective gait analysis. Chronic poor saddle fit causes progressive muscular atrophy in the saddle-contact region, worsening the fit over time in a self-reinforcing cycle. Qualified saddle fitters and equine physiotherapist assessments are recommended every 6–12 months or whenever the horse's body condition score changes significantly.")
                    ]
                )

                scienceCard(
                    title: "Physical Demands of Equestrian Disciplines",
                    icon: "heart.fill",
                    color: .brown,
                    rows: [
                        sciRow(stat: "Cross-country eventing: HR 75–92% HRmax for 8–12 min course",
                               detail: "Elite three-day eventing cross-country phases last 8–12 minutes at sustained intensity, during which riders maintain 75–92% of their maximal heart rate throughout. VO₂max requirements for elite eventers: 52–62 mL/kg/min, comparable to mid-distance running athletes and reflecting the sustained aerobic demand of the discipline. HR profiles across fence types are non-uniform: approach and landing phases of large technical fences (water complexes, coffin combinations) briefly spike HR to near-maximal, while galloping sections between fences allow partial recovery. The cross-country phase is the most physiologically demanding of the three eventing disciplines (dressage, show jumping, cross-country) and historically accounts for the majority of rider fatalities and serious injuries in the sport. Cardiovascular fitness is therefore not simply a performance variable but a safety-critical factor in eventing."),
                        sciRow(stat: "Dressage: isometric core and leg demands; HR 65–80% HRmax",
                               detail: "Despite appearing static to non-equestrian observers, competitive dressage is a demanding postural endurance sport. Riders maintain isometric contraction of hip adductors throughout (to maintain leg position and apply subtle leg aids), deep core stabilisers (to support the lumbar spine against 3–5 G sitting trot forces), and scapular stabilisers (to keep shoulders down and back while maintaining elastic rein contact). Heart rate during Grand Prix dressage tests reaches 65–80% HRmax — lower than cross-country but sustained for 5–8 minutes with no opportunities for recovery. The proprioceptive and cognitive demands are exceptionally high: riders must memorise and execute complex movement sequences (piaffe, passage, tempi changes) while simultaneously monitoring the horse's balance, rhythm, and engagement with 100+ individual aids per minute. Aerobic fitness, while important, is secondary to neuromuscular skill and proprioceptive acuity in dressage performance."),
                        sciRow(stat: "Show jumping: anaerobic bursts with 35–45 fences/competition day",
                               detail: "At championship level, show jumping riders may compete in 3–4 rounds per day, jumping 35–45 individual fences in a competition day. Individual round duration: 60–90 seconds at 400–450 m/minute canter, producing HR 75–88% HRmax. The primary physiological challenge is not any single round but accumulated fatigue across multiple rounds: research on double-clear combinations and jump-offs shows that coordination and reaction time deteriorate measurably from round 1 to round 4 on the same horse. Between rounds, recovery periods range from 20 minutes to 2 hours — insufficient for complete metabolic recovery when high-intensity efforts are repeated. Concentration and decision-making under pressure (line selection, pace control, reaction to horse's approaching stride) are arguably the primary performance determinants in elite show jumping, making cognitive fatigue management as important as physical conditioning."),
                        sciRow(stat: "Polo: combination of horse aerobics and rider striking demands",
                               detail: "Polo represents a unique multisystem demand combining the cardiovascular requirements of mounted galloping (HR frequently 80–92% HRmax in chukkas) with the upper-body rotational striking demands of mallet play. Polo mallet swing biomechanics require rapid trunk rotation (60–80° of thoracic rotation at 180–220°/s) against the destabilising base of a galloping horse, demanding exceptional core stiffness and hip adductor grip strength. Spatial cognition demands are extreme: riders must track a 7.5 cm ball, four teammates, four opponents, and two umpires while galloping at 40–50 km/h and simultaneously steering a highly trained polo pony. Lateral balance and the ability to lean out of the saddle to reach ground-level shots (90–120° of hip abduction from neutral) distinguish elite polo players biomechanically and present unique hip joint loading patterns not seen in other equestrian disciplines.")
                    ]
                )

                scienceCard(
                    title: "Injury Science & Safety",
                    icon: "bandage.fill",
                    color: .green,
                    rows: [
                        sciRow(stat: "Falls: 1 per 350–1,000 hours of riding",
                               detail: "Fall rates in equestrian sport vary significantly by discipline: cross-country eventing carries the highest risk at approximately 1 fall per 350 riding hours, while flatwork and dressage riding is considerably safer at 1 per 1,000+ hours. Fall severity distribution: the majority of falls (70–75%) result in minor injury or no injury; approximately 20% result in moderate injury (bruising, muscle strain, minor fractures); and 5–10% result in significant injury requiring medical attention. Head injuries occur in approximately 24% of falls involving contact with the ground — underscoring that helmet use is the single most evidence-supported intervention in equestrian safety. Modern certified helmets (ASTM F1163, PAS 015, SNELL E2016) reduce the probability of serious traumatic brain injury by 60–70% compared to no helmet. Air vest deployment in eventing falls has been associated with reduction in thoracic injury severity."),
                        sciRow(stat: "Back pain: 66% of elite equestrian athletes report chronic LBP",
                               detail: "Surveys of elite equestrian athletes consistently find that 60–70% report chronic or recurrent low back pain — one of the highest prevalence rates in any sport. Biomechanical contributors include: repeated lumbar flexion-extension loading in sitting trot (up to 800 cycles per hour), asymmetric rein hand dominance creating lateral pelvic tilt, and prolonged static loading in the saddle compressing intervertebral discs. Disc pressure in the sitting trot position is 30–40% higher than in standing, and the rhythmic vertical loading creates a fatigue-loading pattern on annular fibres. Asymmetric loading from the dominant rein hand is a particularly underappreciated risk factor: most riders carry 15–25% more tension on their dominant rein, which over months and years produces systematic differences in paraspinal muscle development. Targeted core stabilisation programmes (pilates, yoga, functional strength training) reduce LBP incidence and severity in equestrian athletes."),
                        sciRow(stat: "Fractures: collarbone (clavicle) #1 riding fracture",
                               detail: "Clavicle fracture is the most common fracture sustained in equestrian falls, occurring as riders instinctively extend their arms to break their fall — the FOOSH (Fall On OutStretched Hand) mechanism. Impact forces travel up the arm and are concentrated at the clavicle, which lacks the protective muscular coverage of other upper extremity segments. Clavicle fractures account for approximately 22–28% of all equestrian fractures in hospital-based studies. The protective outstretched-arm reflex is difficult to suppress even with training, though some research suggests that judo and martial arts rolling techniques can partially redirect fall forces. Air vest technology protects primarily the thorax and abdomen but does not address upper extremity fracture risk. Wrist fractures (distal radius) are the second most common riding fracture, also from FOOSH mechanisms. Together, upper extremity fractures account for approximately 45–55% of all riding-related fractures."),
                        sciRow(stat: "Rider fitness: core strength training reduces back pain 35–45%",
                               detail: "Evidence-based conditioning for equestrian athletes focuses primarily on core stability, with RCT-level evidence showing 35–45% reduction in chronic LBP severity and frequency following structured core stabilisation programmes in riding populations. Pilates is the most extensively studied modality in equestrian contexts: 8–12 week mat pilates programmes improve rider position, reduce postural asymmetry, and decrease LBP numerical rating scores by 40% on average. Yoga improves hip flexor flexibility and thoracic rotation range — both critical for balanced riding position. Gyrotonic movement systems address the three-dimensional spinal mobility patterns uniquely relevant to equestrian movement. Off-horse functional strength training (single-leg squats, Romanian deadlifts, pallof press anti-rotation) builds the hip stabiliser and core strength that underpins effective riding biomechanics. The ideal equestrian conditioning programme combines cardiovascular fitness, core endurance, hip mobility, and neuromuscular coordination developed in sport-specific movement patterns.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Equestrian Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: now) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let equestrian = workouts.filter { $0.workoutActivityType == .equestrianSports }
        let sessions = equestrian.count
        let totalHR = equestrian.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = equestrian.map { $0.duration / 60 }.reduce(0, +)
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
