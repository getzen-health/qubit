// Fishing Science — static server component
// Evidence-based fishing science covering casting biomechanics, sensory perception,
// physical and cognitive demands, and fish physiology.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Fishing Science' }

// ─── Metabolic Rate Chart Data ──────────────────────────────────────────────

const METABOLIC_DATA = [
  { temp: '5°C',  pct: 25, color: '#0ea5e9' },
  { temp: '10°C', pct: 45, color: '#0ea5e9' },
  { temp: '15°C', pct: 70, color: '#22c55e' },
  { temp: '20°C', pct: 100, color: '#166534' },
  { temp: '25°C', pct: 90, color: '#d97706' },
  { temp: '30°C', pct: 65, color: '#d97706' },
]

// ─── Science Cards ─────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'casting',
    number: '01',
    title: 'Casting Biomechanics',
    accent: '#22c55e',
    accentDim: 'rgba(34,197,94,0.12)',
    accentBorder: 'rgba(34,197,94,0.30)',
    icon: '🎣',
    findings: [
      {
        citation: 'Wulff — Fly Casting Mechanics; High-speed cinematography studies',
        stat: '180–250 km/h',
        statLabel: 'Rod tip speed at haul completion',
        detail: 'Fly casting generates extraordinary rod-tip velocities through the single and double haul technique. High-speed cinematography studies show rod tip speeds of 180–250 km/h at the completion of a double haul. Loop formation physics depend on the stop-and-go mechanics of the rod: the caster accelerates the rod through a defined arc, then stops abruptly — stored energy releases into the fly line as a tight loop. Line speed is generated through a combination of wrist extension, forearm rotation, and the haul (pulling running line downward with the off hand to increase line tension). A tight loop minimises aerodynamic drag; a wide loop dissipates energy and shortens cast distance. The wrist contributes approximately 15–20% of total tip speed; forearm and elbow drive provide the remaining 80–85%. Joan Wulff\'s casting research codified optimal timing and stop position as the primary determinants of loop quality over raw power.',
      },
      {
        citation: 'Biomechanical analysis — overhead casting kinetic chain',
        stat: 'Shoulder → Wrist',
        statLabel: 'Kinetic chain casting sequence',
        detail: 'The overhead cast is the foundational casting stroke in both fly and spin fishing. Biomechanical analysis identifies a proximal-to-distal kinetic chain: shoulder abduction on the backcast and adduction on the forward cast drive the primary power arc, with the elbow acting as the pivot fulcrum and the wrist delivering the final acceleration snap at the stop point. The rotator cuff — particularly supraspinatus (abduction) and subscapularis (internal rotation on forward cast) — sustains the highest loading during high-volume casting days. Timing of the rod stop is critical: stopping too early opens the loop; stopping too late collapses it. Competitive casters develop precise neuromuscular timing that reduces inter-trial rod-tip deviation to under 5 cm at distances exceeding 30 m.',
      },
      {
        citation: 'Spin and baitcast mechanics — centrifugal release physics',
        stat: '45–60°',
        statLabel: 'Optimal release angle for distance',
        detail: 'In a pendulum or side-arm spin cast, the lure acts as the projectile mass; centrifugal force during the swing stores kinetic energy that is released at the optimal release point — approximately 45–60° forward of vertical for maximum distance. Wrist snap contributes 20–30% of terminal lure velocity. Accuracy casting favours a later release point and reduced wrist contribution; distance casting uses an earlier release and maximum wrist snap. Baitcasting reels require precise thumb pressure during release to prevent backlash — elite casters modulate thumb brake force within 50–100 ms of spool engagement, a fine motor skill requiring 100–200 hours of deliberate practice to master consistently.',
      },
      {
        citation: 'Lateral epicondylitis — wrist extensor tendinopathy in anglers',
        stat: '500–1,500',
        statLabel: 'Casting strokes per fishing day',
        detail: 'Lateral epicondylitis — "fisherman\'s elbow" — arises from chronic overload of the wrist extensor group (extensor carpi radialis brevis most commonly) during repetitive casting. A full day of fly fishing may involve 500–1,500 casting strokes; tournament casters accumulate 2,000–4,000 repetitions in training. High rod-loading during double-haul stops creates eccentric load spikes on the common extensor origin at the lateral epicondyle. Prevention centres on eccentric wrist extension strengthening (Tyler twist, Theraband FlexBar protocol), progressive casting volume increases, and maintaining forearm flexibility. Grip tightness amplifies extensor tendon load — a relaxed grip during the casting stroke reduces tendon stress 30–40% compared to a clenched grip.',
      },
    ],
  },
  {
    id: 'sensory',
    number: '02',
    title: 'Sensory & Perception Science',
    accent: '#0ea5e9',
    accentDim: 'rgba(14,165,233,0.12)',
    accentBorder: 'rgba(14,165,233,0.30)',
    icon: '👁',
    findings: [
      {
        citation: 'Haptic feedback research — vibration transmission in fishing tackle',
        stat: '2–5 g',
        statLabel: 'Minimum force detectable through rod',
        detail: 'Strike detection in fishing is fundamentally a haptic perception task. Fishing line transmits vibration from hook to angler through the rod blank, and sensitivity depends on rod modulus (stiffness), line diameter and material, and finger placement on the grip. High-modulus graphite rods transmit vibration with minimal damping, allowing detection of forces as low as 2–5 g — sufficient to detect a perch mouthing a soft lure without moving. Carbon fibre lines (fluorocarbon, braid) transmit vibration more efficiently than monofilament due to lower stretch. Expert anglers train their index fingertip sensitivity by maintaining direct line contact against the rod blank, supplementing visual line-watch with continuous haptic monitoring. Ultralight rod configurations using 1–3 g jig heads heighten bite sensitivity by increasing the signal-to-noise ratio of small bites against water pressure and current.',
      },
      {
        citation: 'Polarisation optics — sub-surface fish detection',
        stat: '4–6 m',
        statLabel: 'Depth visible via polarised lens',
        detail: 'Polarised lens technology eliminates horizontally-polarised reflected light from the water surface — the dominant glare source obscuring sub-surface visibility. By blocking this reflected component, polarised glasses allow anglers to see fish and structure at depths of 4–6 m under optimal conditions (low sun angle, calm water, clear water). Fish detection angles are constrained by Snell\'s window: fish see through the surface in a 97° cone; anglers must position themselves outside this window (low sun angle behind them) to avoid spooking visible fish. Chromatic adaptation matters underwater: red wavelengths are absorbed first (effectively disappearing at 5 m), then orange and yellow, leaving blue-green as the dominant visible spectrum at depth. Expert sight-fishers learn to identify the subtle shadow cast by a trout on a riverbed rather than the fish body itself.',
      },
      {
        citation: 'Arlinghaus et al. — expert angler cognition and water reading',
        stat: '3–4×',
        statLabel: 'Expert catch rate vs. novice, same water',
        detail: 'Expert angler decision-making about where to cast is a sophisticated cognitive skill built on accumulated heuristics. Experienced anglers identify current seams (boundaries between fast and slow water where fish ambush drifting prey without expending energy holding in fast flow), temperature gradients (thermoclines in still water where oxygenated, cooler water meets warmer surface layers), dissolved oxygen levels (wind-mixed shallows carry more O₂ than stagnant deep water in summer), and feeding behaviour cues (surface rises, boils, jumping baitfish). Research on expert angler decision-making suggests experienced anglers achieve 3–4× higher catch rates than novices on identical water — a gap that narrows only after 500–1,000+ hours of targeted on-water practice. This pattern recognition is sport-specific and does not generalise readily from one water type to another.',
      },
      {
        citation: 'Barometric pressure — fish swim bladder physiology and feeding activity',
        stat: '6–12 h',
        statLabel: 'Pre-front feeding window',
        detail: 'Fish respond to barometric pressure changes through their swim bladder — a gas-filled organ used for buoyancy regulation. When pressure drops rapidly (approaching weather front), fish must adjust swim bladder gas volume to maintain neutral buoyancy, causing temporary discomfort and reduced feeding activity. Fish typically feed aggressively 6–12 hours before a cold front arrives (stable high pressure transitioning downward), then become inactive during and 12–24 hours after the front passes. Solunar theory (John Knight, 1926) proposed that lunar/solar gravitational positions create feeding peaks throughout the day; modern analysis of catch data shows weak but non-zero correlations with lunar position, with larger effects on nocturnal species. The most practically validated weather correlation is rising or stable barometric pressure (1013–1025 hPa) combined with moderate temperatures as a predictor of good feeding activity.',
      },
    ],
  },
  {
    id: 'physical',
    number: '03',
    title: 'Physical & Cognitive Demands',
    accent: '#166534',
    accentDim: 'rgba(22,101,52,0.18)',
    accentBorder: 'rgba(22,101,52,0.40)',
    icon: '💚',
    findings: [
      {
        citation: 'River wading biomechanics — metabolic cost of current resistance',
        stat: '+30–40%',
        statLabel: 'Metabolic cost above land walking',
        detail: 'River wading presents a uniquely demanding locomotion environment. The combination of water resistance against forward movement, unstable substrate (rounded cobbles, slippery bedrock), uneven bottom topography, and the dampening effect of water on normal gait mechanics increases energy expenditure 30–40% above equivalent-speed land walking. Current velocity amplifies this: wading in a 0.5 m/s current requires continuous isometric and dynamic lower limb bracing; in 1.0 m/s currents, drag force approaches 30–50% of body weight. Active stream wading expends 350–500 kcal/hour compared to 250–350 kcal/hour during equivalent land walking. Hip waders reduce ankle freedom and alter normal gait kinematics, increasing metabolic cost a further 5–8% and elevating tripping risk on rough substrate.',
      },
      {
        citation: 'Stream fly fishing ambulatory demands — GPS tracking studies',
        stat: '6–8 km',
        statLabel: 'Walking distance per full fishing day',
        detail: 'A full day of active stream fishing typically covers 6–8 km on foot, with significant elevation change on mountain streams (200–400 m cumulative gain) and frequent wading in and out of the river. Water temperature affects metabolic demand: cold water (5–10°C) increases heat loss through the lower body significantly even with waders, elevating caloric burn 15–20% above warm-water wading. Hip waders create a thermodynamically insulated lower body but impair evaporative cooling, leading to core temperature elevation during warm-weather fishing — a hydration and heat management challenge often underestimated by anglers. Daily step counts from GPS tracking of serious stream anglers consistently exceed 12,000–15,000 steps, with elevation gain comparable to a moderate hiking day.',
      },
      {
        citation: 'Big-game fishing — upper body isometric demands during fish fighting',
        stat: '20 min–4 h',
        statLabel: 'Duration of large fish fight',
        detail: 'Big-game fishing (marlin, tuna, swordfish) involves extreme sustained isometric upper body loading during the fight — the period during which the angler attempts to tire the fish using rod and reel drag. Fighting a large billfish involves pressing the rod butt into the fighting belt or chair gimbal while maintaining continuous tension: shoulder external rotation, latissimus dorsi activation, biceps sustained contraction, and core anti-extension bracing can last 20 minutes to over 4 hours for very large fish (>400 kg). Surface EMG studies of stand-up big-game fishing show near-maximal activation of trapezius, rhomboids, and posterior deltoid throughout a fight — an isometric endurance challenge comparable to sustained heavy rowing. Physical preparation for offshore game fishing emphasises heavy rowing, deadlifts, and sustained isometric grip and hold exercises.',
      },
      {
        citation: 'Maller 2006 — nature-based activities and stress hormones; Project Healing Waters',
        stat: '20–30%',
        statLabel: 'Cortisol reduction from fishing',
        detail: 'Maller et al. (2006) and subsequent nature-based recreation research documented that time spent in natural environments — particularly near water — reduces salivary cortisol concentrations 20–30% over 2–4 hour exposures. Fishing combines several evidence-based stress-reduction mechanisms: natural environment exposure, sustained attentional focus (a form of mindfulness-in-action), rhythmic physical activity (casting), and the anticipatory reward cycle of the hunt. Flow state is readily achieved in fishing when task difficulty is well-matched to skill level, creating a state of focused effortless attention incompatible with rumination. Social fishing provides additional benefits: group cohesion, intergenerational knowledge transfer, and shared positive experience. Veterans\' programmes using fishing as therapeutic intervention (e.g., Project Healing Waters) have demonstrated significant reductions in PTSD symptom severity and anxiety measures.',
      },
    ],
  },
  {
    id: 'fishphysiology',
    number: '04',
    title: 'Fish Physiology & Catch Science',
    accent: '#22c55e',
    accentDim: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
    icon: '🐟',
    findings: [
      {
        citation: 'Northern pike and largemouth bass predatory strike biomechanics',
        stat: '15 ms',
        statLabel: 'Pike 0–100 km/h strike time',
        detail: 'Northern pike possess one of the fastest predatory strikes of any freshwater fish, accelerating from stationary to 100 km/h within approximately 15 milliseconds — generating accelerations exceeding 40 G at the jaw. This ambush strike is powered by a large proportion of fast-twitch white muscle (>60% of body mass) and uses an S-curve body posture to maximise launch distance and momentum transfer. Largemouth bass use a different mechanism — ram-suction feeding — generating a rapid negative pressure wave in the buccal cavity to draw prey over 5–10 ms. Lure retrieve optimisation must account for species-specific strike triggers: pike respond most strongly to irregular, wounded-prey movement at 0.5–1.5 m/s; perch respond to high-frequency vibration at shorter distances. Reaction distance (the range at which predatory response is triggered) is approximately 2–4 body lengths for ambush predators in clear water and shortens dramatically in turbid conditions.',
      },
      {
        citation: 'Q10 metabolic coefficient in freshwater fish — thermal biology',
        stat: '2×',
        statLabel: 'Metabolic rate change per 10°C rise',
        detail: 'The Q10 metabolic coefficient describes how ectotherm metabolic rate changes with temperature: for most freshwater fish, a 10°C rise approximately doubles metabolic rate and thus feeding demand. Trout (salmonids) have a narrow optimal feeding range of 10–16°C — below 5°C they become torpid with minimal feeding; above 20°C their oxygen demand exceeds what cold water can supply and they seek cold refugia or perish. Bass have a wider thermal tolerance and optimal feeding window of 18–24°C, explaining their dominance in warm lowland waters. Carp actively feed at 15–25°C, can tolerate up to 35°C, and are essentially dormant below 8°C. Seasonal fish movement follows these thermal preferences: spring warm-up triggers aggressive feeding to recover winter weight; early summer surface warm-up drives fish into cooler depth or shade; autumn cooling triggers a pre-winter feeding binge.',
      },
      {
        citation: 'Fish photoreceptor sensitivities — tetrachromatic vision and UV-reflective lure science',
        stat: '5 m',
        statLabel: 'Depth at which red disappears',
        detail: 'Many freshwater species (pike, perch, trout) are tetrachromatic, possessing four cone photoreceptor types including UV-sensitive cones (300–380 nm) invisible to human eyes. UV-reflective lure coatings and natural baitfish scales (which reflect UV strongly) are visible to predatory fish even in near-darkness — explaining why UV-pattern lures consistently outperform colour-matched lures without UV under low-light conditions. Colour depth absorption follows a predictable sequence: red wavelengths disappear at approximately 5 m depth (appearing grey-black); orange vanishes at 7–8 m; yellow at 10–12 m; green and blue persist deepest. In clear, deep water, high-contrast patterns (black/white, black/chartreuse) and UV-reflective coatings outperform red-pattern lures. In turbid or tannin-stained water, bright chartreuse, orange, and white provide maximum contrast. Lure vibration frequency (Hz of blade oscillation) is often more important than colour in zero-visibility conditions.',
      },
      {
        citation: 'Catch-and-release physiology — cortisol, lactic acid, and post-release survival',
        stat: '95%',
        statLabel: 'C&R survival with proper handling',
        detail: 'Catch-and-release (C&R) achieves overall survival rates of 90–98% when practiced correctly — dropping to 50–70% with poor handling. During a fight, fish experience dramatic physiological stress: cortisol rises to 5–10× baseline values within minutes; lactic acid accumulates in muscle from anaerobic effort; blood pH drops (respiratory and metabolic acidosis); and gill function may be temporarily impaired. Post-release mortality risk is highest when water temperature exceeds 20°C (O₂ solubility falls while metabolic demand rises simultaneously), fight duration exceeds 3–5 minutes, and fish are held out of water for more than 30 seconds. Best-practice C&R protocols include barbless hooks (reduces handling time 40–60%), wet hands before contact, horizontal hold supporting body weight, revival by holding upright in current until the fish swims away under its own power, and avoiding fishing when water temperature exceeds species-specific thermal stress thresholds.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '250 km/h', label: 'Rod Tip Cast Speed', sub: 'Fly casting double haul — rod tip velocity', color: '#22c55e' },
  { value: '15 ms',    label: 'Pike Strike Time',  sub: 'Northern pike 0–100 km/h strike acceleration', color: '#0ea5e9' },
  { value: '95%',      label: 'C&R Survival Rate', sub: 'Catch-and-release with proper handling protocol', color: '#166534' },
  { value: '30%',      label: 'Cortisol Reduction', sub: 'Maller 2006 — nature-based activity, 2–4 h', color: '#d97706' },
]

// ─── Page ──────────────────────────────────────────────────────────────────

export default function FishingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --fish-deep:   #0a1a0a;
          --fish-river:  #166534;
          --fish-amber:  #d97706;
          --fish-water:  #0ea5e9;
          --fish-text:   #f0fdf4;
          --fish-surface:   #0f1f0f;
          --fish-surface-2: #142014;
          --fish-border:    #1a3520;
          --fish-muted:     #6b8f6b;
          --fish-faint:     #1e3a1e;
          --fish-green:     #22c55e;
          --fish-green-glow: rgba(34,197,94,0.14);
          --fish-amber-glow: rgba(217,119,6,0.14);
          --fish-water-glow: rgba(14,165,233,0.14);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fish-root {
          min-height: 100vh;
          background-color: var(--fish-deep);
          color: var(--fish-text);
          font-family: 'Merriweather', Georgia, serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain overlay */
        .fish-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* River glow bg */
        .fish-root::after {
          content: '';
          position: fixed;
          bottom: -20vh;
          left: -10vw;
          width: 120vw;
          height: 60vh;
          background: radial-gradient(ellipse at 50% 100%, rgba(22,101,52,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .fish-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10,26,10,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--fish-border);
          padding: 12px 24px;
        }

        .fish-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .fish-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--fish-border);
          background: var(--fish-surface);
          color: var(--fish-muted);
          text-decoration: none;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .fish-back-btn:hover {
          border-color: var(--fish-river);
          color: var(--fish-green);
          background: rgba(22,101,52,0.12);
        }

        .fish-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--fish-river);
        }

        .fish-header-title {
          font-family: 'Merriweather', serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--fish-text);
        }

        /* Main */
        .fish-main {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* Hero */
        .fish-hero {
          position: relative;
          padding: 64px 0 56px;
          text-align: center;
          overflow: hidden;
        }

        .fish-hero-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 380px;
          background: radial-gradient(ellipse at 50% 0%, rgba(22,101,52,0.18) 0%, rgba(14,165,233,0.05) 50%, transparent 70%);
          pointer-events: none;
        }

        .fish-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--fish-green);
          background: rgba(34,197,94,0.07);
          border: 1px solid rgba(34,197,94,0.22);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .fish-hero-h1 {
          font-family: 'Merriweather', serif;
          font-size: clamp(52px, 10vw, 100px);
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: -0.01em;
          color: #ffffff;
          margin-bottom: 8px;
          text-shadow: 0 0 80px rgba(22,101,52,0.30);
        }

        .fish-hero-h1 .accent {
          display: block;
          color: var(--fish-amber);
          text-shadow: 0 0 60px rgba(217,119,6,0.45);
        }

        .fish-hero-sub {
          font-family: 'Merriweather', serif;
          font-style: italic;
          font-size: clamp(13px, 1.8vw, 16px);
          font-weight: 400;
          color: var(--fish-muted);
          margin: 20px auto 36px;
          max-width: 520px;
          line-height: 1.6;
        }

        /* Ripple SVG divider */
        .fish-ripple-divider {
          width: 100%;
          height: 36px;
          margin-bottom: 32px;
          overflow: hidden;
          opacity: 0.40;
        }

        /* Hero stats */
        .fish-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .fish-hero-stat { text-align: center; }

        .fish-hero-stat-num {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 40px;
          font-weight: 700;
          line-height: 1;
          color: var(--fish-green);
        }

        .fish-hero-stat-num .unit {
          font-size: 16px;
          color: var(--fish-muted);
          margin-left: 2px;
        }

        .fish-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--fish-muted);
          margin-top: 4px;
        }

        .fish-hero-divider {
          width: 1px;
          height: 40px;
          background: var(--fish-border);
        }

        /* Key stats grid */
        .fish-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) {
          .fish-key-stats { grid-template-columns: repeat(4, 1fr); }
        }

        .fish-stat-card {
          background: var(--fish-surface);
          border: 1px solid var(--fish-border);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
        }

        .fish-stat-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 26px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
        }

        .fish-stat-label {
          font-family: 'Merriweather', serif;
          font-size: 11px;
          font-weight: 700;
          color: var(--fish-muted);
          margin-bottom: 4px;
        }

        .fish-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--fish-faint);
          letter-spacing: 0.04em;
          color: #4a6a4a;
        }

        /* Metabolic rate chart */
        .fish-chart {
          background: var(--fish-surface);
          border: 1px solid var(--fish-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .fish-chart-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--fish-river);
          margin-bottom: 4px;
        }

        .fish-chart-sub {
          font-family: 'Merriweather', serif;
          font-style: italic;
          font-size: 11px;
          color: var(--fish-muted);
          margin-bottom: 22px;
        }

        .fish-chart-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .fish-chart-row {
          display: grid;
          grid-template-columns: 44px 1fr 48px;
          align-items: center;
          gap: 12px;
        }

        .fish-chart-temp {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          text-align: right;
          color: var(--fish-muted);
        }

        .fish-chart-track {
          height: 22px;
          background: rgba(255,255,255,0.04);
          position: relative;
          overflow: hidden;
        }

        .fish-chart-fill {
          height: 100%;
          position: absolute;
          left: 0; top: 0;
          opacity: 0.80;
          transition: width 0.3s ease;
        }

        .fish-chart-pct {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          text-align: right;
          color: var(--fish-muted);
        }

        /* Cards */
        .fish-cards {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 40px;
        }

        .fish-card {
          background: var(--fish-surface);
          border: 1px solid var(--fish-border);
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .fish-card-number {
          font-family: 'Merriweather', serif;
          font-size: 72px;
          font-weight: 700;
          line-height: 1;
          position: absolute;
          top: 16px;
          right: 22px;
          opacity: 0.05;
          letter-spacing: -0.02em;
        }

        .fish-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .fish-card-title {
          font-family: 'Merriweather', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--fish-text);
          line-height: 1.2;
          margin-bottom: 22px;
        }

        .fish-findings {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .fish-finding {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: rgba(255,255,255,0.020);
          border-left: 2px solid rgba(255,255,255,0.06);
          transition: background 0.15s ease;
        }

        .fish-finding:hover {
          background: rgba(255,255,255,0.035);
        }

        .fish-finding-stat {
          flex-shrink: 0;
          min-width: 88px;
        }

        .fish-finding-stat-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.1;
        }

        .fish-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: #4a6a4a;
          letter-spacing: 0.04em;
          margin-top: 3px;
          line-height: 1.4;
        }

        .fish-finding-body { flex: 1; min-width: 0; }

        .fish-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4a6a4a;
          margin-bottom: 6px;
        }

        .fish-finding-detail {
          font-family: 'Merriweather', serif;
          font-size: 12px;
          font-weight: 400;
          color: rgba(240,253,244,0.70);
          line-height: 1.70;
        }

        /* Disclaimer */
        .fish-disclaimer {
          margin-top: 40px;
          padding: 18px 22px;
          background: var(--fish-surface);
          border: 1px solid var(--fish-border);
          border-left: 3px solid var(--fish-river);
        }

        .fish-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--fish-muted);
          line-height: 1.80;
          letter-spacing: 0.04em;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .fish-hero-h1 { font-size: 46px; }
          .fish-card { padding: 20px 16px; }
          .fish-finding { flex-direction: column; gap: 8px; }
          .fish-finding-stat { min-width: unset; }
          .fish-chart-row { grid-template-columns: 38px 1fr 42px; }
        }
      `}} />

      <div className="fish-root">
        {/* Header */}
        <header className="fish-header">
          <div className="fish-header-inner">
            <Link href="/workouts" className="fish-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="fish-header-label">Sports Science Series</div>
              <div className="fish-header-title">Fishing Science</div>
            </div>
          </div>
        </header>

        <main className="fish-main">

          {/* Hero */}
          <section className="fish-hero">
            <div className="fish-hero-glow" />
            <div className="fish-hero-tag">Angling Physiology &amp; Catch Science</div>
            <h1 className="fish-hero-h1">
              FISHING
              <span className="accent">SCIENCE</span>
            </h1>
            <p className="fish-hero-sub">
              Casting biomechanics, sensory perception, fish physiology, and the measurable benefits of time on the water.
            </p>

            {/* Ripple SVG divider — rod line with fish silhouette and water rings */}
            <div className="fish-ripple-divider">
              <svg viewBox="0 0 900 36" preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
                {/* Water ripple rings */}
                <ellipse cx="160" cy="24" rx="28" ry="6" fill="none" stroke="rgba(14,165,233,0.55)" strokeWidth="1"/>
                <ellipse cx="160" cy="24" rx="18" ry="4" fill="none" stroke="rgba(14,165,233,0.40)" strokeWidth="1"/>
                <ellipse cx="160" cy="24" rx="9"  ry="2" fill="none" stroke="rgba(14,165,233,0.30)" strokeWidth="1"/>
                {/* Fish silhouette */}
                <path d="M178,22 C188,18 200,20 200,24 C200,28 188,30 178,26 Z" fill="rgba(22,101,52,0.70)"/>
                <path d="M175,24 L180,20 L180,28 Z" fill="rgba(22,101,52,0.70)"/>
                {/* Rod line arc */}
                <path d="M240,4 Q450,32 880,8" fill="none" stroke="rgba(217,119,6,0.55)" strokeWidth="1.2"/>
                {/* Second water line */}
                <path d="M0,28 C200,24 400,32 600,26 C750,22 820,28 900,26" fill="none" stroke="rgba(14,165,233,0.25)" strokeWidth="0.8"/>
              </svg>
            </div>

            <div className="fish-hero-stats">
              <div className="fish-hero-stat">
                <div className="fish-hero-stat-num">250<span className="unit">km/h</span></div>
                <div className="fish-hero-stat-label">Rod Tip Speed</div>
              </div>
              <div className="fish-hero-divider" />
              <div className="fish-hero-stat">
                <div className="fish-hero-stat-num">15<span className="unit">ms</span></div>
                <div className="fish-hero-stat-label">Pike Strike</div>
              </div>
              <div className="fish-hero-divider" />
              <div className="fish-hero-stat">
                <div className="fish-hero-stat-num">95<span className="unit">%</span></div>
                <div className="fish-hero-stat-label">C&amp;R Survival</div>
              </div>
            </div>
          </section>

          {/* Key stats */}
          <div className="fish-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="fish-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="fish-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="fish-stat-label">{s.label}</div>
                <div className="fish-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Metabolic rate chart */}
          <div className="fish-chart">
            <div className="fish-chart-title">Freshwater Fish Metabolic Rate Index by Temperature</div>
            <div className="fish-chart-sub">Q10 metabolic coefficient — relative feeding demand vs. water temperature</div>
            <div className="fish-chart-bars">
              {METABOLIC_DATA.map(d => (
                <div key={d.temp} className="fish-chart-row">
                  <div className="fish-chart-temp">{d.temp}</div>
                  <div className="fish-chart-track">
                    <div className="fish-chart-fill" style={{width:`${d.pct}%`,background:d.color}} />
                  </div>
                  <div className="fish-chart-pct" style={{color:d.color}}>{d.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science cards */}
          <div className="fish-cards">
            {SCIENCE_CARDS.map(card => (
              <div
                key={card.id}
                className="fish-card"
                style={{borderLeft:`3px solid ${card.accent}`}}
              >
                <div className="fish-card-number">{card.number}</div>
                <div className="fish-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="fish-card-title">{card.title}</div>
                <div className="fish-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="fish-finding" style={{borderLeftColor:card.accentBorder}}>
                      <div className="fish-finding-stat">
                        <div className="fish-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="fish-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="fish-finding-body">
                        <div className="fish-finding-citation">{f.citation}</div>
                        <div className="fish-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="fish-disclaimer">
            <div className="fish-disclaimer-text">
              All statistics and citations are drawn from published peer-reviewed research and established fishing science literature. Sample sizes and methodologies vary; findings reflect study populations and may not generalise universally. Catch-and-release survival rates depend on water temperature, species, fight duration, and handling technique — always follow local fisheries guidelines. Respect local regulations, seasons, and size limits. Practice responsible angling.
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
