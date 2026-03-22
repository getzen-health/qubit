import SwiftUI
import HealthKit

struct FishingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var avgHR: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .green)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .blue)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .teal)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Casting Biomechanics",
                    icon: "figure.fishing",
                    color: .green,
                    rows: [
                        sciRow(stat: "Fly casting: rod tip speed 180–250 km/h at haul completion",
                               detail: "Fly casting generates extraordinary rod-tip velocities through the single and double haul technique. Joan Wulff's casting research and subsequent high-speed cinematography studies show rod tip speeds of 180–250 km/h at the completion of a double haul. Loop formation physics depend on the stop-and-go mechanics of the rod: the caster accelerates the rod through a defined arc, then stops abruptly — the stored energy releases into the fly line as a tight loop. Line speed is generated through a combination of wrist extension, forearm rotation, and the haul (pulling the running line downward with the off hand to increase line tension). A tight loop minimises aerodynamic drag; a wide loop dissipates energy and shortens cast distance. The wrist contributes approximately 15–20% of total tip speed; forearm and elbow drive provide the remaining 80–85%."),
                        sciRow(stat: "Overhead cast: shoulder abduction/adduction with elbow pivot",
                               detail: "The overhead cast is the foundational casting stroke in both fly and spin fishing. Biomechanical analysis identifies a proximal-to-distal kinetic chain: shoulder abduction on the backcast and adduction on the forward cast drive the primary power arc, with the elbow acting as the pivot fulcrum and the wrist delivering the final acceleration snap at the stop point. The rotator cuff — particularly supraspinatus (abduction) and subscapularis (internal rotation on forward cast) — sustains the highest loading during high-volume casting days. Timing of the rod stop is critical: stopping too early opens the loop; stopping too late collapses it. Competitive casters develop precise neuromuscular timing that reduces inter-trial rod-tip deviation to under 5 cm at distances exceeding 30 m."),
                        sciRow(stat: "Spin casting: centrifugal force release point",
                               detail: "Spinning and baitcast mechanics differ fundamentally from fly casting. In a pendulum or side-arm spin cast, the lure acts as the projectile mass; centrifugal force during the swing stores kinetic energy that is released at the optimal release point (approximately 45–60° forward of vertical for maximum distance). Wrist snap contributes 20–30% of terminal lure velocity. Accuracy casting (shorter distances to precise targets) favours a later release point and reduced wrist contribution; distance casting uses an earlier release and maximum wrist snap. Baitcasting reels require precise thumb pressure during release to prevent backlash — elite casters modulate thumb brake force within 50–100 ms of spool engagement, a fine motor skill requiring 100–200 hours of deliberate practice to master consistently."),
                        sciRow(stat: "Repetitive casting fatigue: forearm extensor tendinopathy",
                               detail: "Lateral epicondylitis — 'fisherman's elbow' — arises from chronic overload of the wrist extensor group (extensor carpi radialis brevis most commonly) during repetitive casting. A day of fly fishing may involve 500–1,500 casting strokes; tournament casters accumulate 2,000–4,000 repetitions in training. High rod-loading during double-haul stops creates eccentric load spikes on the common extensor origin at the lateral epicondyle. Prevention centres on eccentric wrist extension strengthening (Tyler twist, Theraband FlexBar protocol), progressive casting volume increases, and maintaining forearm flexibility. Grip tightness amplifies extensor tendon load — a relaxed grip during the casting stroke reduces tendon stress 30–40% compared to a clenched grip.")
                    ]
                )

                scienceCard(
                    title: "Sensory & Perception Science",
                    icon: "eye.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Bite detection: haptic feedback through rod as primary sense",
                               detail: "Strike detection in fishing is fundamentally a haptic perception task. Fishing line transmits vibration from hook to angler through the rod blank, and the sensitivity of this signal pathway depends on rod modulus (stiffness), line diameter and material, and finger placement on the grip. High-modulus graphite rods transmit vibration with minimal damping, allowing detection of forces as low as 2–5 g — sufficient to detect a perch mouthing a soft lure without moving. Carbon fibre lines (e.g., fluorocarbon, braid) transmit vibration more efficiently than monofilament due to lower stretch. Expert anglers train their index fingertip sensitivity by maintaining direct line contact against the rod blank, supplementing visual line-watch with continuous haptic monitoring. Ultralight rod configurations using 1–3 g jig heads heighten bite sensitivity by increasing the signal-to-noise ratio of small bites against water pressure."),
                        sciRow(stat: "Vision: polarised sunglasses reveal sub-surface fish at 4–6 m depth",
                               detail: "Polarised lens technology eliminates horizontally-polarised reflected light from the water surface — the dominant source of glare that obscures sub-surface visibility. By blocking this reflected component, polarised glasses allow anglers to see fish holding structure, individual fish, and bottom features at depths of 4–6 m under optimal (low sun angle, calm water, clear conditions) circumstances. Fish detection angles are constrained by Snell's window: fish can see through the surface in a 97° cone; anglers must position themselves outside this window (low sun angle behind them) to avoid spooking visible fish. Chromatic adaptation is also important — underwater, water absorbs red wavelengths first (red effectively disappears at 5 m), then orange and yellow, leaving blue-green as the dominant visible spectrum at depth. Expert sight-fishers learn to identify the subtle shadow cast by a trout on a riverbed rather than the fish body itself."),
                        sciRow(stat: "Pattern recognition: reading water for fish holding structure",
                               detail: "Expert angler decision-making about where to cast is a sophisticated cognitive skill built on accumulated heuristics about fish behaviour and habitat. Experienced anglers identify current seams (boundaries between fast and slow water where fish ambush drifting prey without expending energy holding in fast flow), temperature gradients (thermoclines in still water where oxygenated, cooler water meets warmer surface layers), dissolved oxygen levels (wind-mixed shallows carry more O₂ than stagnant deep water in summer), and feeding behaviour cues (surface rises, boils, jumping baitfish). Research on expert angler decision-making (Arlinghaus et al., sport fishing cognition literature) suggests experienced anglers develop a mental map of probable fish location that allows 3–4× higher catch rates than novices on the same water — a gap that narrows only after 500–1,000+ hours of targeted on-water practice. This pattern recognition is sport-specific and does not generalise readily from one water type to another."),
                        sciRow(stat: "Weather pattern integration: barometric pressure and fish activity",
                               detail: "Fish respond to barometric pressure changes through their swim bladder — a gas-filled organ used for buoyancy regulation. When pressure drops rapidly (approaching weather front), fish must adjust their swim bladder gas volume to maintain neutral buoyancy, causing temporary discomfort and reduced feeding activity. Fish typically feed aggressively 6–12 hours before a cold front arrives (stable high pressure transitioning downward), then become inactive during and 12–24 hours after the front passes. Solunar theory (John Knight, 1926) proposed that major lunar/solar gravitational positions create feeding peaks throughout the day; modern review of fishing catch data shows weak but non-zero correlations with lunar position, with larger effects on nocturnal species. The most practically validated weather correlation is rising or stable barometric pressure (1013–1025 hPa) combined with moderate temperatures as a predictor of good feeding activity.")
                    ]
                )

                scienceCard(
                    title: "Physical & Cognitive Demands",
                    icon: "heart.fill",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Wading: increased metabolic cost 30–40% vs. land walking",
                               detail: "River wading presents a uniquely demanding locomotion environment. The combination of water resistance against forward movement, unstable substrate (rounded cobbles, slippery bedrock), uneven bottom topography, and the dampening effect of water on normal gait mechanics increases energy expenditure 30–40% above equivalent-speed land walking. Current velocity amplifies this: wading in a 0.5 m/s current requires continuous isometric and dynamic lower limb bracing; in 1.0 m/s currents, the drag force approaches 30–50% of body weight. Active stream wading (covering water by walking upstream and across) expends 350–500 kcal/hour compared to 250–350 kcal/hour during equivalent land walking. Hip waders reduce ankle freedom and alter normal gait kinematics, increasing metabolic cost a further 5–8% and elevating tripping risk on rough substrate. Wading boots with felt or carbide-tipped soles reduce slip incidents significantly."),
                        sciRow(stat: "Fly fishing: 6–8 km walking per day in stream fishing",
                               detail: "Stream fly fishing is substantially more ambulatory than most recreational activities. A full day of active stream fishing typically covers 6–8 km on foot, with significant elevation change on mountain streams (200–400 m cumulative gain) and frequent wading in and out of the river. Water temperature affects metabolic demand: cold water (5–10°C) increases heat loss through the lower body significantly even with waders, elevating caloric burn by 15–20% above warm-water wading. Hip waders create a thermodynamically insulated lower body but impair evaporative cooling, leading to core temperature elevation during warm-weather fishing — a hydration and heat management challenge often underestimated by anglers. Daily step counts from GPS tracking of serious stream anglers consistently exceed 12,000–15,000 steps, with elevation gain comparable to a moderate hiking day."),
                        sciRow(stat: "Deep sea fishing: upper body isometric demands in fighting fish",
                               detail: "Big-game fishing (marlin, tuna, swordfish) involves extreme sustained isometric upper body loading during the 'fight' — the period after hook-up during which the angler attempts to tire the fish using the rod and reel drag. Fighting a large billfish involves pressing the rod butt into the fighting belt or chair gimbal while maintaining continuous tension: shoulder external rotation, latissimus dorsi activation, biceps sustained contraction, and core anti-extension bracing can be maintained for 20 minutes to over 4 hours for very large fish (> 400 kg). Surface EMG studies of stand-up big-game fishing show near-maximal activation of trapezius, rhomboids, and posterior deltoid throughout a fight — an isometric endurance challenge comparable to sustained heavy rowing. Fatigue-related rod drops are the primary cause of fish loss in big-game tournaments. Physical training for offshore game fishing emphasises heavy rowing, deadlifts, and sustained isometric grip and hold exercises."),
                        sciRow(stat: "Mental health benefits: fishing reduces cortisol 20–30%",
                               detail: "Maller et al. (2006) and subsequent nature-based recreation research have documented that time spent in natural environments — particularly near water — reduces salivary cortisol concentrations 20–30% over 2–4 hour exposures. Fishing in particular combines several evidence-based stress-reduction mechanisms: natural environment exposure, sustained attentional focus (a form of mindfulness-in-action), rhythmic physical activity (casting), and the anticipatory reward cycle of the hunt. Flow state — as described by Csikszentmihályi — is readily achieved in fishing when task difficulty (fish difficulty, conditions) is well-matched to skill level, creating a state of focused effortless attention incompatible with rumination. Social fishing provides additional benefits: group cohesion, intergenerational knowledge transfer, and shared positive experience. Veterans' programmes using fishing as therapeutic intervention (e.g., Project Healing Waters) have demonstrated significant reductions in PTSD symptom severity, depression scores, and anxiety measures.")
                    ]
                )

                scienceCard(
                    title: "Fish Physiology & Catch Science",
                    icon: "water.waves",
                    color: .green,
                    rows: [
                        sciRow(stat: "Fish predatory strike: 0–100 km/h in 15 ms (pike)",
                               detail: "Northern pike possess one of the fastest predatory strikes of any freshwater fish, accelerating from stationary to 100 km/h within approximately 15 milliseconds — generating accelerations exceeding 40 G at the jaw. This ambush strike is powered by a large proportion of fast-twitch white muscle (> 60% of body mass) and uses a 'S-curve' body posture to maximise launch distance. Largemouth bass (Micropterus salmoides) use a different mechanism — ram-suction feeding — generating a rapid negative pressure wave in the buccal cavity to draw prey into the mouth over 5–10 ms. Lure retrieve optimisation must account for species-specific strike triggers: pike respond most strongly to irregular, wounded-prey movement at 0.5–1.5 m/s; perch respond to high-frequency vibration at shorter distances. Reaction distance (the range at which predatory response is triggered) is approximately 2–4 body lengths for ambush predators in clear water and shortens dramatically in turbid conditions."),
                        sciRow(stat: "Water temperature: 10°C change alters fish metabolism 2×",
                               detail: "The Q10 metabolic coefficient describes how ectotherm (cold-blooded) metabolic rate changes with temperature: for most freshwater fish, a 10°C rise approximately doubles metabolic rate and thus feeding demand. Trout (salmonids) have a narrow optimal feeding temperature range of 10–16°C — below 5°C they become torpid with minimal feeding; above 20°C their oxygen demand exceeds what cold water can supply and they seek cold refugia or die. Bass have a wider thermal tolerance and optimal feeding window of 18–24°C, explaining their dominance in warm lowland waters where trout cannot survive. Carp actively feed at 15–25°C, can tolerate up to 35°C, and are essentially dormant below 8°C. Seasonal fish movement follows these thermal preferences: spring warm-up triggers aggressive feeding to recover weight lost over winter; early summer surface warm-up drives fish into cooler depth or shaded areas; autumn cooling triggers a pre-winter feeding binge. Temperature loggers integrated into fishing electronics allow anglers to target the thermocline layer directly."),
                        sciRow(stat: "Lure colour: contrast and UV reflection matter in low light",
                               detail: "Fish visual systems differ fundamentally from human vision. Many freshwater species (pike, perch, trout) are tetrachromatic, possessing four types of cone photoreceptors including UV-sensitive cones (sensitive to wavelengths 300–380 nm) invisible to human eyes. UV-reflective lure coatings and natural baitfish scales (which reflect UV strongly) are visible to predatory fish even in near-darkness — explaining why UV-pattern lures consistently outperform colour-matched lures without UV under low-light conditions. Colour depth absorption follows a predictable sequence: red wavelengths disappear at approximately 5 m depth (appearing grey-black to fish below); orange vanishes at 7–8 m; yellow at 10–12 m; green and blue persist deepest. In clear, deep water, high-contrast patterns (black/white, black/chartreuse) and UV-reflective coatings outperform red-pattern lures. In turbid or coloured water (tannin-stained), bright chartreuse, orange, and white provide maximum contrast against the ambient light scatter. Lure vibration frequency (measured in Hz of blade or body oscillation) is often more important than colour in zero-visibility conditions, as lateral line detection supplements or replaces visual predation."),
                        sciRow(stat: "Catch-and-release: 95% survival with proper handling",
                               detail: "Catch-and-release (C&R) is the primary conservation tool in recreational fishing, with overall survival rates of 90–98% when practiced correctly — dropping to 50–70% with poor handling. During a fight, fish experience dramatic physiological stress: cortisol rises to 5–10× baseline values within minutes; lactic acid accumulates in muscle from anaerobic effort (particularly in powerful fish fighting hard); blood pH drops (respiratory and metabolic acidosis); and gill function may be temporarily impaired. Post-release mortality risk is highest when: water temperature is above 20°C (O₂ solubility falls and metabolic demand rises simultaneously), fight duration exceeds 3–5 minutes, and fish are held out of water for more than 30 seconds. Best-practice C&R protocols include barbless hooks (reduces handling time 40–60%), wet hands before contact, horizontal hold supporting body weight, revival by holding upright in current until the fish swims away under its own power, and avoiding fishing when water temperature exceeds species-specific thermal stress thresholds.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Fishing Science")
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
        let fishing = workouts.filter { $0.workoutActivityType == .fishing }
        let sessions = fishing.count
        let totalHR = fishing.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = fishing.map { $0.duration / 60 }.reduce(0, +)
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
