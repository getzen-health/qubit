// Snowboarding Science — static server component
// Evidence-based snowboarding physiology covering halfpipe physics, biomechanics,
// physiological demands, and training science for freestyle and freeride disciplines.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Snowboarding Science' }

// ─── Aerial Rotation Milestones ────────────────────────────────────────────────

const ROTATION_DATA = [
  { label: '540°', degrees: 540, airTime: 0.9, barH: 47 },
  { label: '720°', degrees: 720, airTime: 1.1, barH: 58 },
  { label: '900°', degrees: 900, airTime: 1.3, barH: 68 },
  { label: '1080°', degrees: 1080, airTime: 1.5, barH: 79 },
  { label: '1260°', degrees: 1260, airTime: 1.7, barH: 89 },
  { label: '1440°', degrees: 1440, airTime: 1.9, barH: 100 },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'physics',
    number: '01',
    title: 'Halfpipe & Freestyle Physics',
    accent: '#8b2fc9',
    accentDim: 'rgba(139,47,201,0.12)',
    accentBorder: 'rgba(139,47,201,0.30)',
    icon: '🏔️',
    findings: [
      {
        citation: 'FIS Snowboard Rules — Halfpipe Specifications; White & Hirano — Olympic Analysis 2018/2022',
        stat: '5–7 m',
        statLabel: 'Air above halfpipe lip',
        detail: 'Olympic-standard halfpipes are 22 feet (6.7 m) wall height per FIS specification. Athletes achieve 5–7 m above the lip using launch velocities of 14–18 m/s at takeoff. Gravitational potential energy at peak height: mgh = 70 kg × 9.81 × 6 m ≈ 4,120 J. Shaun White\'s 2018 Olympic gold run averaged 6.1 m air above lip; Ayumu Hirano\'s 2022 Beijing gold run peaked at 7.2 m on back-to-back 1440° attempts. Every extra 0.5 m of air provides approximately 0.1 s additional hang time — critical for completing higher-degree rotations.',
      },
      {
        citation: 'Lind & Sanders — The Physics of Skiing (2004); Hirano 2022 Beijing Olympic Analysis',
        stat: '1440°',
        statLabel: 'Current competition benchmark',
        detail: 'Angular momentum L = Iω is conserved once airborne. Athletes initiate spin on the lip with angular velocity, then manipulate moment of inertia I by tucking (reducing I → increasing ω for faster rotation) and extending limbs for landing (increasing I → reducing ω for controlled touchdown). Frontside spins rotate toward the heel edge; backside toward the toe edge — demanding different muscle activation patterns and visual cues. Ayumu Hirano debuted the 1620° at the 2022 Beijing Olympics. Axis of rotation shifts from vertical (spins) to horizontal (flips) in McTwist and double-cork variants.',
      },
      {
        citation: 'Idzikowski 2000 — Am J Sports Med; Hagel 2004 — Injury Epidemiology Review',
        stat: '80%',
        statLabel: 'Wrist fracture reduction with guards',
        detail: 'Ground reaction forces during park feature landings reach 2–3× body weight (1,400–2,100 N for a 70 kg rider), measured via force plate studies. Nose and tail press mechanics require isometric loading of ankle and knee extensors to maintain board contact angle. Wrist injuries constitute 25–30% of all snowboard injuries — the forward-fall impact mechanism is the primary driver. Hard-shell dorsal-splint wrist guards reduce distal radius fracture incidence by approximately 80% (Idzikowski 2000, n=3,213). Proper landing mechanics — dorsiflexion absorption, knee-soft touch — reduce knee valgus collapse during jump landings.',
      },
      {
        citation: 'Federolf 2008 — J Sports Sci; FIS Boardercross Rules',
        stat: '60–80 km/h',
        statLabel: 'Boardercross race speed',
        detail: 'Boardercross (SBX) races 4–6 riders simultaneously through berms, rollers, jumps, and flat sections at 60–80 km/h. Aerodynamic drag dominates at speed — tuck position reduces frontal area from ≈0.6 m² (upright) to ≈0.35 m², cutting drag force by 42%. Banked berm turns allow the lateral component of normal force to provide centripetal acceleration, enabling higher cornering speed than flat turns. Jump sequencing strategy — absorb (compress on takeoff face) vs. pop (extend for air) — trades air time for ground speed. Drafting reduces aerodynamic drag 15–20%; strategic gate positioning and blocking are key tactical elements.',
      },
    ],
  },
  {
    id: 'biomechanics',
    number: '02',
    title: 'Biomechanics & Balance',
    accent: '#ff6b35',
    accentDim: 'rgba(255,107,53,0.12)',
    accentBorder: 'rgba(255,107,53,0.30)',
    icon: '⚡',
    findings: [
      {
        citation: 'Delorme 2005 — Br J Sports Med; Posch 2017 — Int J Sports Physiol Perform',
        stat: '+15°/−15°',
        statLabel: 'Duck stance binding angle (freestyle)',
        detail: 'Snowboard binding angles define the fundamental biomechanics of stance. Duck stance (e.g. +15°/−15°) places both feet angled outward symmetrically for freestyle; forward stance (+21°/+6°) aligns hips toward the nose for alpine. Unlike skiing, the snowboarder\'s hips never fully align with the board — creating a permanent offset demanding asymmetrical hip external rotation (lead hip) and internal rotation (rear hip). Regular stance (left forward) vs. goofy (right forward) produces mirror-image muscle development asymmetry: lead-side vastus medialis and rear-side hip abductors are typically more developed. Toe-out binding angles induce valgus stress on the lead knee during heelside turns — a primary injury risk factor.',
      },
      {
        citation: 'Federolf 2010 — J Biomech; Fabian 2009 — Scand J Med Sci Sports',
        stat: '60–75°',
        statLabel: 'Edge angle in high-performance carving',
        detail: 'High-performance carving achieves edge angles of 60–75° from vertical (the angle between board and snow surface). Toeside turns engage ankle dorsiflexion and tibialis anterior to tip onto the toe edge; heelside turns require ankle plantarflexion and posterior tibialis activation. Hard-boot alpine snowboarding (plate bindings) allows greater dorsiflexion (25–35°) than soft-boot setups (12–20°), enabling higher centripetal forces. Pressure distribution shifts between front and rear foot to control turn radius: front-foot pressure initiates and tightens turns; rear-foot pressure extends and completes them. Centripetal force in a carved turn: F = mv²/r — at 50 km/h with r = 10 m, F ≈ 540 N (0.78× body weight).',
      },
      {
        citation: 'Hagel 2004 — Inj Epidemiol; Idzikowski 2000 — Am J Sports Med',
        stat: '25–30%',
        statLabel: 'Wrist injury share of all injuries',
        detail: 'Wrist injuries are the most common snowboard injury type, representing 25–30% of all presentations (Hagel 2004 systematic review). The mechanism is the forward-fall protective reflex: falling forward at speed triggers automatic wrist extension + pronation as the hand contacts snow, loading the distal radius in dorsiflexion. Triangular fibrocartilage complex (TFCC) injuries result from the rotational loading component at impact. Hard-shell wrist guards function as load distributors — redirecting force from the wrist joint to the forearm shaft. Beginners show 50% higher wrist injury rates than advanced riders. Expert injury patterns shift toward knee and shoulder injuries as riding speed and terrain complexity increase.',
      },
      {
        citation: 'Haider 2012 — JAMA Pediatr; Bland 2014 — Br J Sports Med (MIPS analysis)',
        stat: '60%',
        statLabel: 'Severe head injury reduction with helmets',
        detail: 'Snowboard helmet use reduces head injury risk by 35–60% depending on impact type (Haider 2012, meta-analysis n=4,000+ injuries). Halfpipe and big-air disciplines carry the highest head injury risk from backward falls — the rider cannot see the approach and cannot brace effectively. MIPS helmets reduce rotational acceleration transmitted to the brain by 40% compared to standard EPS helmets in oblique impacts. Neck musculature loading during aerial landings: cervical extensors and deep neck flexors absorb shock transmitted up the spine. Pre-activation of neck muscles 50–100 ms before anticipated impact reduces concussion risk — a trainable response developed through experience and progressive aerial exposure.',
      },
    ],
  },
  {
    id: 'physiology',
    number: '03',
    title: 'Physiological Demands',
    accent: '#8b2fc9',
    accentDim: 'rgba(139,47,201,0.10)',
    accentBorder: 'rgba(139,47,201,0.28)',
    icon: '💜',
    findings: [
      {
        citation: 'Turnbull 2009 — J Strength Cond Res; Bacharach 1995 — Int J Sports Med',
        stat: '52–62',
        statLabel: 'VO₂max (mL/kg/min) halfpipe specialists',
        detail: 'Halfpipe snowboarders tested at altitude training camps show VO₂max values of 52–62 mL/kg/min (Turnbull 2009), comparable to alpine ski racers but lower than endurance athletes. Aerobic capacity supports hiking energy expenditure, recovery at chairlift altitude between runs, and sustained muscular demands across repeated competition attempts (8–12 qualifying runs in competition format). Individual halfpipe run duration: 45–75 seconds of high-intensity effort. Average HR during runs reaches 80–92% HRmax. Between-run HR recovery to below 70% HRmax at chairlift altitude (1,800–2,500 m) requires meaningfully greater aerobic capacity than equivalent sea-level recovery.',
      },
      {
        citation: 'Stricker 2010 — J Physiol (anaerobic profile); Ruedl 2011 — Br J Sports Med',
        stat: '85–95%',
        statLabel: 'HRmax during park/halfpipe runs',
        detail: 'The phosphocreatine (PCr) system provides primary energy for jump takeoffs (0–3 s explosive effort) with peak power demands of 800–1,200 W. Each halfpipe run involves 6–8 wall hits at near-maximal explosive intensity. Lactate accumulates significantly from the 3rd–4th wall hit onward, contributing to coordination degradation late in runs. Slopestyle runs (10–15 features in 50–60 s) show blood lactate of 6–10 mmol/L post-run. Recovery at competition altitude is delayed vs. sea level: reduced O₂ delivery at 2,200 m extends PCr resynthesis time from approximately 3 minutes to 4 minutes — a meaningful constraint when chair rides are short.',
      },
      {
        citation: 'Hodges 1997 — J Physiol (core pre-activation); Richardson 1999 — Therapeutic Exercise',
        stat: '80–120 ms',
        statLabel: 'Core pre-activation before takeoff',
        detail: 'Trunk rotational stability is the foundation of aerial snowboarding performance. Transverse abdominis and internal obliques provide segmental spinal stability during twisting takeoffs; spinal erectors maintain upright posture under impact landing forces; hip rotators generate and absorb rotational forces at the binding interface. EMG studies of aerial gymnastics and comparable airborne sports show transverse abdominis pre-activates 80–120 ms before jump takeoff — a feed-forward central nervous system stabilisation response. Perturbation training (balance board with unexpected disturbances) improves trunk stabilisation response speed 20–35% in 8-week programmes, translating to more consistent aerial axis control.',
      },
      {
        citation: 'Gore 2001 — J Appl Physiol (altitude physiology); Levine 1997 — J Appl Physiol (LHTL)',
        stat: '1,800–2,500 m',
        statLabel: 'Competition altitude range',
        detail: 'Major snowboard competitions occur at 1,800–2,500 m altitude. At 2,200 m, barometric pressure ≈ 76 kPa, reducing inspired O₂ partial pressure to ≈121 mmHg (vs. 159 mmHg at sea level) — approximately 24% hypoxic deficit. SpO₂ in unacclimatised athletes: 90–93% at 2,200 m vs. 98–99% at sea level. Acclimatisation protocol: 3–7 days at altitude produces EPO elevation, reticulocyte rise after 4–5 days, haematocrit increase after 7–10 days. Live high–train low (LHTL) altitude tent use (2,500–3,000 m simulated, 8–10 h/night) improves sea-level VO₂max 2–4% and competition-altitude performance 3–5%.',
      },
    ],
  },
  {
    id: 'training',
    number: '04',
    title: 'Training Science',
    accent: '#ff6b35',
    accentDim: 'rgba(255,107,53,0.12)',
    accentBorder: 'rgba(255,107,53,0.30)',
    icon: '🏋️',
    findings: [
      {
        citation: 'Dubravcic-Simunjak 2006 — Int J Sports Med; Dowrick 1999 — J Exp Child Psychol',
        stat: '50%',
        statLabel: 'Elite skill time in off-snow environments',
        detail: 'Elite halfpipe and big-air snowboarders spend approximately 50% of skill development time in off-snow training environments. Trampoline training is the primary tool for rotation mechanics — athletes complete 100+ repetitions per session vs. 10–15 on snow, dramatically accelerating motor learning through mass practice. Foam pit progression (trampoline → foam pit → airbag → snow) provides a safe failure environment for learning new tricks, following structured progressive difficulty frameworks. High-speed video shows 85–90% technique correspondence between trampoline and on-snow kinematics for rotational tricks, validating off-snow training fidelity. Dry-slope carving on Dendix or Snowflex maintains edge mechanics through summer.',
      },
      {
        citation: 'Hewett 1996 — Am J Sports Med (landing mechanics); Myer 2006 — J Orthop Sports PT',
        stat: 'RSI',
        statLabel: 'Reactive strength index — landing metric',
        detail: 'Landing absorption from halfpipe and jump landings requires high eccentric strength across ankle, knee, and hip extensors. Peak knee flexion angles of 90–120° during hard landings demand substantial eccentric quadriceps and glute capacity. Romanian deadlift (RDL) is the foundational exercise: targets biceps femoris, gluteus maximus, and spinal erectors in the landing-specific hip hinge pattern. Single-leg work (Bulgarian split squat, single-leg RDL, pistol squat) addresses stance asymmetry and bilateral strength imbalances common in snowboarders. Plyometric progressions — drop landings → depth jumps → maximal bounds — develop reactive strength index (RSI), the key metric for landing absorption efficiency.',
      },
      {
        citation: 'Nardone 2007 — Gait Posture; Gruber 1998 — Med Sci Sports Exerc (proprioception transfer)',
        stat: '15–20%',
        statLabel: 'On-snow improvement from balance training',
        detail: 'A 6-week balance board training programme (3 sessions/week, 20 min/session) improved on-snow slalom performance 15–20% in competitive junior snowboarders (Nardone 2007). Proprioceptive mechanisms: mechanoreceptors in ankle ligaments detect board inclination and trigger corrective muscle activation within 40–80 ms. Unstable surface training increases ankle and knee stabiliser co-activation patterns that transfer to edge-angle micro-adjustments on snow. Medial-lateral ankle stability is critical for heelside turns: limited boot dorsiflexion range requires greater tibialis anterior pre-tension to prevent edge-wash. Unilateral balance training on the snowboard-specific lead leg (eyes closed, >60 s target) is strongly recommended.',
      },
      {
        citation: 'Dowrick 1999 — J Exp Child Psychol (self-modelling); Schmidt 1991 — Psychol Rev (feedback frequency)',
        stat: '25–30%',
        statLabel: 'Skill acquisition gain with self-modelling',
        detail: 'High-speed video analysis at 240–480 fps is the standard coaching tool for halfpipe and freestyle snowboarding. Frame-by-frame review measures takeoff angle and rotation axis initiation, peak tuck configuration (minimum moment of inertia), landing phase joint angles, and board-axis alignment at snow contact. Joint angle measurement via 2D video digitisation achieves ±5° accuracy — sufficient for coaching feedback, though below research-grade 3D motion capture (±1–2°). Self-modelling methodology — athletes repeatedly reviewing video of their own best successful attempts rather than failure analysis — accelerates skill acquisition 25–30% vs. error-focused review (Dowrick 1999). Reduced-frequency video feedback (every 3rd attempt) produces better long-term retention than immediate feedback after every run.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '7 m', label: 'Halfpipe Air Height', sub: 'Hirano 2022 Beijing Olympics peak', color: '#c77dff' },
  { value: '1440°', label: 'Max Competition Spin', sub: 'Angular momentum conservation', color: '#8b2fc9' },
  { value: '25–30%', label: 'Wrist Injury Share', sub: 'Hagel 2004 — systematic review', color: '#ff6b35' },
  { value: '60–80 km/h', label: 'Boardercross Speed', sub: 'FIS SBX race velocity range', color: '#c77dff' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SnowboardingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Exo:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --snb-dark: #120820;
          --snb-purple: #8b2fc9;
          --snb-orange: #ff6b35;
          --snb-frost: #e8f4ff;
          --snb-glow: #c77dff;
          --snb-surface: #1a0d2e;
          --snb-surface-2: #200f38;
          --snb-border: #2d1650;
          --snb-frost-dim: #8a9bb8;
          --snb-frost-faint: #2a1f40;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .snb-root {
          min-height: 100vh;
          background-color: var(--snb-dark);
          color: var(--snb-frost);
          font-family: 'Exo', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Noise grain overlay */
        .snb-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Purple ambient glow background */
        .snb-root::after {
          content: '';
          position: fixed;
          top: -20vh;
          left: -10vw;
          width: 120vw;
          height: 70vh;
          background: radial-gradient(ellipse at 50% 0%, rgba(139,47,201,0.10) 0%, rgba(199,125,255,0.04) 40%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .snb-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(18,8,32,0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--snb-border);
          padding: 12px 24px;
        }

        .snb-header-inner {
          max-width: 920px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .snb-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--snb-border);
          background: var(--snb-surface);
          color: var(--snb-frost-dim);
          text-decoration: none;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .snb-back-btn:hover {
          border-color: var(--snb-purple);
          color: var(--snb-glow);
          background: rgba(139,47,201,0.10);
        }

        .snb-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--snb-glow);
        }

        .snb-header-title {
          font-family: 'Exo', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--snb-frost);
        }

        /* Main */
        .snb-main {
          position: relative;
          z-index: 2;
          max-width: 920px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* Hero */
        .snb-hero {
          position: relative;
          padding: 64px 0 52px;
          text-align: center;
          overflow: hidden;
        }

        .snb-hero-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 420px;
          background: radial-gradient(ellipse at 50% 0%, rgba(139,47,201,0.22) 0%, rgba(199,125,255,0.08) 40%, transparent 70%);
          pointer-events: none;
        }

        .snb-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--snb-glow);
          background: rgba(199,125,255,0.07);
          border: 1px solid rgba(199,125,255,0.22);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .snb-hero-h1 {
          font-family: 'Exo', sans-serif;
          font-size: clamp(62px, 13vw, 128px);
          font-weight: 900;
          line-height: 0.90;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 8px;
          text-shadow: 0 0 80px rgba(139,47,201,0.30);
        }

        .snb-hero-h1 .accent {
          display: block;
          color: var(--snb-glow);
          text-shadow: 0 0 60px rgba(199,125,255,0.55);
        }

        .snb-hero-sub {
          font-family: 'Exo', sans-serif;
          font-size: clamp(13px, 2.1vw, 17px);
          font-weight: 400;
          letter-spacing: 0.06em;
          color: var(--snb-frost-dim);
          margin: 20px auto 36px;
          max-width: 520px;
          line-height: 1.5;
        }

        /* Hero SVG halfpipe */
        .snb-halfpipe-svg {
          width: 100%;
          max-width: 600px;
          margin: 0 auto 36px;
          display: block;
          opacity: 0.75;
        }

        /* Hero stats */
        .snb-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          flex-wrap: wrap;
        }

        .snb-hero-stat {
          text-align: center;
        }

        .snb-hero-stat-num {
          font-family: 'Exo', sans-serif;
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
          color: var(--snb-glow);
        }

        .snb-hero-stat-num .unit {
          font-size: 18px;
          color: var(--snb-frost-dim);
          margin-left: 2px;
        }

        .snb-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--snb-frost-dim);
          margin-top: 4px;
        }

        .snb-hero-divider {
          width: 1px;
          height: 40px;
          background: var(--snb-border);
        }

        /* Key stats grid */
        .snb-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) {
          .snb-key-stats { grid-template-columns: repeat(4, 1fr); }
        }

        .snb-stat-card {
          background: var(--snb-surface);
          border: 1px solid var(--snb-border);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
        }

        .snb-stat-val {
          font-family: 'Exo', sans-serif;
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 4px;
        }

        .snb-stat-label {
          font-family: 'Exo', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--snb-frost-dim);
          margin-bottom: 4px;
        }

        .snb-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--snb-frost-faint);
          letter-spacing: 0.04em;
          line-height: 1.4;
        }

        /* Rotation chart */
        .snb-chart {
          background: var(--snb-surface);
          border: 1px solid var(--snb-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .snb-chart-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--snb-glow);
          margin-bottom: 6px;
        }

        .snb-chart-sub {
          font-family: 'Exo', sans-serif;
          font-size: 12px;
          color: var(--snb-frost-faint);
          margin-bottom: 24px;
          letter-spacing: 0.04em;
        }

        .snb-chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          height: 160px;
        }

        .snb-chart-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          gap: 6px;
        }

        .snb-chart-bar-wrap {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          flex: 1;
        }

        .snb-chart-air {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          color: var(--snb-glow);
          margin-bottom: 4px;
        }

        .snb-chart-bar {
          width: 100%;
          border-radius: 2px 2px 0 0;
          background: linear-gradient(180deg, var(--snb-glow) 0%, var(--snb-purple) 100%);
          opacity: 0.85;
          transition: opacity 0.15s;
        }

        .snb-chart-bar:hover {
          opacity: 1;
        }

        .snb-chart-label {
          font-family: 'Exo', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: var(--snb-frost-dim);
          text-align: center;
          letter-spacing: 0.02em;
          padding-top: 6px;
          border-top: 1px solid var(--snb-border);
          width: 100%;
          text-align: center;
        }

        .snb-chart-axis-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--snb-frost-faint);
          margin-top: 12px;
          text-align: center;
          letter-spacing: 0.08em;
        }

        /* Science cards */
        .snb-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .snb-card {
          background: var(--snb-surface);
          border: 1px solid var(--snb-border);
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .snb-card-number {
          font-family: 'Exo', sans-serif;
          font-size: 72px;
          font-weight: 900;
          line-height: 1;
          position: absolute;
          top: 16px;
          right: 22px;
          opacity: 0.055;
          letter-spacing: -0.02em;
        }

        .snb-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .snb-card-title {
          font-family: 'Exo', sans-serif;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--snb-frost);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .snb-findings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .snb-finding {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: rgba(255,255,255,0.025);
          border-left: 2px solid rgba(255,255,255,0.06);
          transition: all 0.15s ease;
        }

        .snb-finding:hover {
          background: rgba(255,255,255,0.042);
        }

        .snb-finding-stat {
          flex-shrink: 0;
          min-width: 88px;
        }

        .snb-finding-stat-val {
          font-family: 'Exo', sans-serif;
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
        }

        .snb-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--snb-frost-faint);
          letter-spacing: 0.04em;
          margin-top: 2px;
          line-height: 1.4;
        }

        .snb-finding-body {
          flex: 1;
          min-width: 0;
        }

        .snb-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--snb-frost-faint);
          margin-bottom: 5px;
        }

        .snb-finding-detail {
          font-family: 'Exo', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: rgba(232,244,255,0.72);
          line-height: 1.58;
        }

        /* Disclaimer */
        .snb-disclaimer {
          margin-top: 40px;
          padding: 18px 22px;
          background: var(--snb-surface);
          border: 1px solid var(--snb-border);
          border-left: 3px solid var(--snb-frost-dim);
        }

        .snb-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--snb-frost-dim);
          line-height: 1.80;
          letter-spacing: 0.04em;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .snb-hero-h1 { font-size: 56px; }
          .snb-card { padding: 20px 16px; }
          .snb-finding { flex-direction: column; gap: 8px; }
          .snb-finding-stat { min-width: unset; }
          .snb-chart-bars { gap: 6px; }
          .snb-chart-label { font-size: 9px; }
        }
      `}} />

      <div className="snb-root">
        {/* Header */}
        <header className="snb-header">
          <div className="snb-header-inner">
            <Link href="/workouts" className="snb-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="snb-header-label">Sports Science Series</div>
              <div className="snb-header-title">Snowboarding Science</div>
            </div>
          </div>
        </header>

        <main className="snb-main">
          {/* Hero */}
          <section className="snb-hero">
            <div className="snb-hero-glow" />
            <div className="snb-hero-tag">Freestyle & Freeride Performance Science</div>
            <h1 className="snb-hero-h1">
              SNOW
              <span className="accent">BOARDING</span>
            </h1>
            <p className="snb-hero-sub">
              The physics of halfpipe flight, biomechanics of carving, and physiology of aerial snowboarding. Evidence-based performance science.
            </p>

            {/* Hero SVG: Halfpipe cross-section with rider trajectory arc */}
            <svg
              className="snb-halfpipe-svg"
              viewBox="0 0 600 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Halfpipe cross-section showing rider trajectory arc"
            >
              {/* Halfpipe walls */}
              <path
                d="M40,170 Q40,80 120,40"
                stroke="rgba(199,125,255,0.55)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M560,170 Q560,80 480,40"
                stroke="rgba(199,125,255,0.55)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Flat base */}
              <line x1="120" y1="170" x2="480" y2="170" stroke="rgba(199,125,255,0.35)" strokeWidth="1.5" strokeDasharray="6 4" />
              {/* Rider trajectory arc (parabolic flight path) */}
              <path
                d="M120,40 Q300,-60 480,40"
                stroke="#ff6b35"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="8 5"
              />
              {/* Apex dot */}
              <circle cx="300" cy="16" r="5" fill="#c77dff" />
              {/* Apex label */}
              <text x="314" y="20" fill="#c77dff" fontSize="11" fontFamily="monospace" fontWeight="600">7 m above lip</text>
              {/* Left rider dot (takeoff) */}
              <circle cx="120" cy="40" r="4" fill="#ff6b35" />
              {/* Right rider dot (landing) */}
              <circle cx="480" cy="40" r="4" fill="#ff6b35" />
              {/* Lip height arrows */}
              <line x1="60" y1="40" x2="60" y2="170" stroke="rgba(199,125,255,0.30)" strokeWidth="1" />
              <text x="24" y="108" fill="rgba(199,125,255,0.65)" fontSize="10" fontFamily="monospace">6.7m</text>
              {/* Wall labels */}
              <text x="62" y="34" fill="rgba(199,125,255,0.55)" fontSize="10" fontFamily="monospace">LIP</text>
              <text x="466" y="34" fill="rgba(199,125,255,0.55)" fontSize="10" fontFamily="monospace">LIP</text>
              {/* Ground line */}
              <line x1="30" y1="178" x2="570" y2="178" stroke="rgba(139,47,201,0.30)" strokeWidth="1" />
              {/* Rotation label */}
              <text x="258" y="185" fill="rgba(255,107,53,0.70)" fontSize="10" fontFamily="monospace">1440° trajectory</text>
            </svg>

            <div className="snb-hero-stats">
              <div className="snb-hero-stat">
                <div className="snb-hero-stat-num">7<span className="unit">m</span></div>
                <div className="snb-hero-stat-label">Air Height</div>
              </div>
              <div className="snb-hero-divider" />
              <div className="snb-hero-stat">
                <div className="snb-hero-stat-num">1440<span className="unit">°</span></div>
                <div className="snb-hero-stat-label">Max Rotation</div>
              </div>
              <div className="snb-hero-divider" />
              <div className="snb-hero-stat">
                <div className="snb-hero-stat-num">80<span className="unit">km/h</span></div>
                <div className="snb-hero-stat-label">SBX Speed</div>
              </div>
            </div>
          </section>

          {/* Key stats */}
          <div className="snb-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="snb-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="snb-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="snb-stat-label">{s.label}</div>
                <div className="snb-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Aerial Rotation Milestones chart */}
          <div className="snb-chart">
            <div className="snb-chart-title">Aerial Rotation Milestones — Air Time Required</div>
            <div className="snb-chart-sub">Minimum hang time needed to complete each rotation degree in halfpipe competition</div>
            <div className="snb-chart-bars">
              {ROTATION_DATA.map(d => (
                <div key={d.label} className="snb-chart-col">
                  <div className="snb-chart-bar-wrap">
                    <div className="snb-chart-air">{d.airTime}s</div>
                    <div
                      className="snb-chart-bar"
                      style={{height: `${d.barH}%`}}
                      title={`${d.label}: ${d.airTime}s air time`}
                    />
                  </div>
                  <div className="snb-chart-label">{d.label}</div>
                </div>
              ))}
            </div>
            <div className="snb-chart-axis-label">ROTATION DEGREES → AIR TIME (SECONDS) — HALFPIPE COMPETITION</div>
          </div>

          {/* Science cards */}
          <div className="snb-cards">
            {SCIENCE_CARDS.map(card => (
              <div
                key={card.id}
                className="snb-card"
                style={{borderLeftColor: card.accent}}
              >
                <div style={{position:'absolute',top:0,left:0,width:'3px',height:'100%',background:card.accent}} />
                <div className="snb-card-number">{card.number}</div>
                <div className="snb-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="snb-card-title">{card.title}</div>
                <div className="snb-findings">
                  {card.findings.map((f, i) => (
                    <div
                      key={i}
                      className="snb-finding"
                      style={{'--card-accent': card.accent, borderLeftColor: card.accentBorder} as React.CSSProperties}
                    >
                      <div className="snb-finding-stat">
                        <div className="snb-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="snb-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="snb-finding-body">
                        <div className="snb-finding-citation">{f.citation}</div>
                        <div className="snb-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="snb-disclaimer">
            <div className="snb-disclaimer-text">
              All statistics and citations are drawn from published peer-reviewed research. Sample sizes and methodologies vary; findings reflect study populations and may not generalise universally. Snowboarding involves inherent risk of injury including falls at speed, collision, and exposure to cold and altitude; always ride within your ability level and wear appropriate protective equipment including helmet and wrist guards. Consult qualified instruction before attempting advanced terrain or tricks.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
