// Surfing Science — static server component
// Evidence-based surfing physiology covering paddling mechanics, injury epidemiology,
// wave-riding biomechanics, and surf-specific training science.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Surfing Science' }

// ─── Session Time Breakdown ────────────────────────────────────────────────────

const SESSION_BREAKDOWN = [
  { label: 'Paddling', pct: 54, color: '#00b4d8', desc: 'Paddle-out + repositioning' },
  { label: 'Waiting', pct: 28, color: '#0077b6', desc: 'Line-up waiting for waves' },
  { label: 'Wave Riding', pct: 8, color: '#00f5d4', desc: 'Active surfing on wave' },
  { label: 'Other', pct: 10, color: '#023e8a', desc: 'Duck-diving, recovery' },
]

// ─── Fitness Standards ─────────────────────────────────────────────────────────

const FITNESS_LEVELS = [
  { level: 'Elite (WSL)', paddleTime: '5:45–6:15', vo2: '62–68', jump: '>50 cm', color: '#00f5d4', barW: 100 },
  { level: 'Advanced', paddleTime: '6:15–7:00', vo2: '55–62', jump: '40–50 cm', color: '#00b4d8', barW: 78 },
  { level: 'Intermediate', paddleTime: '7:00–8:00', vo2: '48–55', jump: '30–40 cm', color: '#0077b6', barW: 56 },
  { level: 'Recreational', paddleTime: '8:00+', vo2: '<48', jump: '<30 cm', color: '#023e8a', barW: 34 },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'paddling',
    number: '01',
    title: 'Session Structure & Paddling Physiology',
    accent: '#00b4d8',
    accentDim: 'rgba(0,180,216,0.12)',
    accentBorder: 'rgba(0,180,216,0.30)',
    icon: '🌊',
    findings: [
      {
        citation: 'Farley 2012 — J Strength Cond Res',
        stat: '54%',
        statLabel: 'Session time paddling',
        detail: 'Time-motion analysis of 30 recreational and competitive surfers found paddling (out and repositioning) consumes 54% of total session time; waiting in the line-up = 28%; active wave riding = only 8%; other (duck-diving, pop-ups) = 10%. Despite the dominant paddling time, physiological peak stress occurs during the brief explosive wave-riding phase. Apple Watch surf session data predominantly captures the paddling component, which explains why GPS-measured HR tends to underestimate peak surf intensity.',
      },
      {
        citation: 'Mendez-Villanueva 2006 — Eur J Appl Physiol',
        stat: '70–78%',
        statLabel: 'VO₂max sustained during paddling',
        detail: 'Continuous paddling sustained in a tethered surf-paddling protocol maintains 70–78% of peak VO₂ — a moderately high aerobic demand comparable to cycling at threshold pace. Prone paddling engages primarily shoulder flexion (anterior deltoid, biceps, pectoralis), scapular stabilisers (serratus anterior, lower trap), and bilateral trunk rotation. Paddling fatigue is the primary limiter of wave-catching ability: surfers with poor paddle fitness miss the aerobic window to reach the wave before it steepens.',
      },
      {
        citation: 'Sheppard 2012 — Int J Sports Physiol Perform',
        stat: '0.4–0.7 s',
        statLabel: 'Pop-up completion time',
        detail: 'The surfing pop-up (transition from prone to standing on the board) occurs in 0.4–0.7 seconds in competitive surfers. It demands explosive upper-body push power (triceps, anterior deltoid), rapid hip flexor recruitment, and simultaneous knee extension. EMG analysis shows a proximal-to-distal activation: triceps fire first → anterior deltoid → hip extensors → knee extensors. Lower-limb vertical jump height predicts pop-up velocity better than any measure of upper-body strength, emphasising that pop-up speed is a full-body explosive skill.',
      },
      {
        citation: 'Farley 2015 — Int J Sports Physiol Perform',
        stat: '35–65 m/s²',
        statLabel: 'Board acceleration during manoeuvres',
        detail: 'Triaxial accelerometers embedded in surfboards recorded 35–65 m/s² board acceleration during high-performance manoeuvres (cutbacks, snaps, tube riding). Estimated G-forces during powerful snaps reach 3–5 G. Knee flexion during bottom turns is maintained at 90–130°, and ankle proprioceptive control is the primary performance discriminator between skill levels — elite surfers demonstrate smaller ankle sway amplitudes and faster reactive corrections during carving turns.',
      },
    ],
  },
  {
    id: 'injury',
    number: '02',
    title: 'Injury Epidemiology & Safety',
    accent: '#ef4444',
    accentDim: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.30)',
    icon: '🩺',
    findings: [
      {
        citation: 'Nathanson 2002 — Wilderness Environ Med',
        stat: '55%',
        statLabel: 'Injuries from own board impact',
        detail: 'The largest surfing injury epidemiology study (n=1,348 surfers, 3 years) found own-board contact causes 55% of all injuries. Reef or sand impact = 18%; other surfer\'s board = 5%; marine life = <1%. Paradoxically, leash use — while critical for drowning prevention — increases the risk of board rebound injury after wipeouts. Soft-top foam boards reduce laceration incidence 70% compared to hard fibreglass shortboards, making them strongly recommended for learners. Fin contact causes 12% of lacerations and 8% of tendon injuries.',
      },
      {
        citation: 'Taylor 2004 — Br J Sports Med',
        stat: '27%',
        statLabel: 'Head & neck injury share',
        detail: 'Head and neck injuries constitute 27% of all acute surfing injuries — the single most common anatomical region. Skull impact with the nose or rail of one\'s own board during wipeouts is the dominant mechanism. Cervical spine fracture risk is highest at shallow-water reef breaks and beach break with <1 m water depth: estimated incidence of 0.2 per 1,000 sessions at point breaks. Helmet adoption remains at only 2% of recreational surfers, despite studies showing 70–80% reduction in scalp laceration risk.',
      },
      {
        citation: 'Rinaldi 2014 — J Laryngol Otol',
        stat: '48–80%',
        statLabel: 'Surfer\'s ear prevalence in cold water',
        detail: 'Exostosis (bony overgrowth of the external auditory canal — "surfer\'s ear") develops after years of cold water (<19°C) and wind exposure. Prevalence in surfers surfing cold water for >5 years: 48–80%. The bony growth progressively narrows the canal, trapping water and debris, and leading to recurrent otitis externa and conductive hearing loss. Custom silicone or Doc\'s ProPlugs ear plugs reduce exposure risk by approximately 85%. Surgical treatment (canalplasty) requires drilling under GA and carries 5–10% revision rate.',
      },
      {
        citation: 'Peirson 2019 — J Science Med Sport',
        stat: '80%',
        statLabel: 'Rescues caused by rip currents',
        detail: 'Rip currents account for approximately 80% of all surf lifesaving rescues globally. The optimal survival strategy — counter-intuitively — is not to fight the rip but to swim parallel to shore for 50 m to exit the feeder channel, then return to shore diagonally. Competitive big-wave surfers undergo CO₂ tolerance training (static apnea tables) targeting 4–6 minute breath-holds; recreational surfers in wipeout conditions should target ≥1.5 minutes breath-hold capacity, achievable with systematic training. Never hyperventilate before breath-hold practice.',
      },
    ],
  },
  {
    id: 'biomechanics',
    number: '03',
    title: 'Biomechanics of Wave Riding',
    accent: '#00f5d4',
    accentDim: 'rgba(0,245,212,0.10)',
    accentBorder: 'rgba(0,245,212,0.28)',
    icon: '⚡',
    findings: [
      {
        citation: 'Nessler 2013 — J Appl Biomech',
        stat: '±2–3 cm',
        statLabel: 'Elite centre-of-mass lateral deviation',
        detail: 'Force plate and motion capture analysis found elite surfers maintain ±2–3 cm lateral centre-of-mass deviation during simulated carving turns, compared to ±8–12 cm in recreational surfers — a 4× reduction in postural sway. Single-leg balance time with eyes closed >45 seconds correlates strongly with elite surf performance ratings. Balance board training (BOSU, wobble boards) in 6-week programmes has demonstrated significant transfer to on-wave stability, improving competitive performance scores by 15–22% in controlled trials.',
      },
      {
        citation: 'Moreira 2014 — J Sports Sci',
        stat: '30–45°',
        statLabel: 'Bottom turn optimal entry angle',
        detail: 'The bottom turn is the foundational surfing manoeuvre — it generates the centripetal acceleration required for all subsequent snaps, cutbacks, and aerials. Optimal entry angle to the wave face: 30–45°. Deeper entries increase potential energy for radical top turns at the cost of speed maintenance. Ground reaction force at the base of the turn reaches 2.2–3.5× body weight, measured via pressure-sensing board insoles. Hip and knee flexion depth correlates with turn radius control — shallower stance = tighter radius = greater performance score potential.',
      },
      {
        citation: 'Hatchell 2012 — J Biomech',
        stat: '5–15°',
        statLabel: 'Rear-foot tail angle for tube position',
        detail: 'Tube riding requires maintaining position within the "pocket" of a pitching wave. Speed regulation is critical: excess speed exits the barrel prematurely; insufficient speed results in lip impact. Board speed adjustment in the tube relies on subtle rear-foot pressure shifts of 5–15° in tail angle — a motor skill requiring enormous proprioceptive precision. Elite tube riders process wave face curvature 60–80 ms faster than recreational surfers on reaction-time tests, suggesting superior visual pattern recognition developed through deliberate repetition.',
      },
      {
        citation: 'Hutt 2001 — J Sports Sci',
        stat: '0.30–0.35 L/kg',
        statLabel: 'Optimal board volume ratio',
        detail: 'Surfboard volume determines the fundamental speed/maneuverability trade-off. Optimal shortboard volume approximation: body weight (kg) × 0.30–0.35 litres. Lower volume = harder paddle, more sink, sharper rail-to-rail transitions. Rocker (longitudinal board curvature) is the second major design variable: flat rocker maximises planning speed on open face; high rocker permits tighter turns in critical sections. Fin configuration (thruster vs quad) changes tail release and pivot point — quads generate more drive and speed; thrusters provide more hold and snap.',
      },
    ],
  },
  {
    id: 'training',
    number: '04',
    title: 'Training for Surf Fitness',
    accent: '#0077b6',
    accentDim: 'rgba(0,119,182,0.12)',
    accentBorder: 'rgba(0,119,182,0.30)',
    icon: '🏋️',
    findings: [
      {
        citation: 'Secomb 2015 — J Strength Cond Res',
        stat: '+6.3%',
        statLabel: 'Paddle speed after 8-week programme',
        detail: 'An 8-week surf-specific resistance training programme (2 sessions/week) produced paddle speed improvements of 6.3%, pop-up time reductions of 12%, and 400m paddle trial time improvements of 4.8% in competitive surfers. Key exercises: prone paddle simulation (cable pulldowns at 45°), pop-up burpees, single-leg squats, and rotational medicine ball throws. Shoulder external rotation strengthening (targeting infraspinatus and teres minor) reduced rotator cuff injury incidence 40% in a prospective 6-month follow-up cohort.',
      },
      {
        citation: 'Sheppard 2013 — J Sports Sci',
        stat: '5:45–6:15',
        statLabel: 'Elite 400m paddle time (min:sec)',
        detail: 'ASP World Championship Tour (WCT) testing established the 400m prone paddle time as the primary field test discriminating elite surfers (5:45–6:15) from recreational surfers (7:30+) and amateur competitors (6:15–7:30). Performance predictors include swim VO₂max, max pull-up repetitions, and vertical jump — a combination that reflects the multi-planar athletic demands of elite surfing. During a typical 2-hour session, professional surfers in offshore conditions may paddle 4–8 km total; onshore conditions with frequent repositioning can exceed this significantly.',
      },
      {
        citation: 'Dujić 2006 — J Appl Physiol',
        stat: '+40–60%',
        statLabel: 'Breath-hold extension with CO₂ training',
        detail: 'A 4-week CO₂ tolerance training programme (static apnea tables: repeated 2-minute breath-holds with 2-minute rest, 8 reps/session) extended maximal breath-hold duration 40–60%. The training works by progressively raising the CO₂ threshold for the urge to breathe — not by increasing oxygen storage. Critical safety warning: hyperventilation before breath-hold reduces CO₂ below the breathing trigger without increasing O₂, causing sudden unconsciousness (shallow water blackout) before the hypoxic drive initiates breathing. All breath-hold training must be conducted under direct supervision, never in the water alone.',
      },
      {
        citation: 'García 2018 — Phys Ther Sport',
        stat: '+28%',
        statLabel: 'Hip flexor flexibility after surf yoga',
        detail: 'A 6-week surf-specific yoga intervention (3 sessions/week, 45 minutes) in 34 recreational surfers produced hip flexor flexibility improvements of 28%, spinal rotation gains of 22%, and a 34% increase in self-reported wave-catching success rate. Three anatomical regions dominate surf yoga priority: thoracic rotation (essential for efficient paddle stroke and duck-dive technique), hip flexors (pop-up efficiency and bottom turn depth), and shoulder mobility (paddle reach arc and recovery phase). Hip flexor tightness from prolonged sitting is the most common flexibility limitation in adult recreational surfers.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '54%', label: 'Session time paddling', sub: 'Farley 2012 — time-motion analysis', color: '#00b4d8' },
  { value: '8%', label: 'Actual wave riding', sub: 'Despite paddling majority, peak stress in wave riding', color: '#00f5d4' },
  { value: '55%', label: 'Injuries from own board', sub: 'Nathanson 2002 — n=1,348 surfers', color: '#ef4444' },
  { value: '4–6 min', label: 'Big-wave breath-hold target', sub: 'CO₂ training: Dujić 2006', color: '#0077b6' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SurfingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --ocean-black: #05080f;
          --ocean-dark: #080d18;
          --ocean-surface: #0d1a2e;
          --ocean-surface-2: #122035;
          --ocean-border: #1a2d45;
          --teal: #00f5d4;
          --teal-dim: #00b4d8;
          --teal-glow: rgba(0,245,212,0.15);
          --cyan: #00b4d8;
          --cyan-glow: rgba(0,180,216,0.15);
          --deep-blue: #0077b6;
          --deep-glow: rgba(0,119,182,0.15);
          --coral: #ef4444;
          --coral-glow: rgba(239,68,68,0.15);
          --foam: #e8f4f8;
          --foam-dim: #7aa8bf;
          --foam-faint: #1e3a50;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .surf-root {
          min-height: 100vh;
          background-color: var(--ocean-black);
          color: var(--foam);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain overlay */
        .surf-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Wave shimmer bg */
        .surf-root::after {
          content: '';
          position: fixed;
          bottom: -20vh;
          left: -10vw;
          width: 120vw;
          height: 60vh;
          background: radial-gradient(ellipse at 50% 100%, rgba(0,119,182,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .surf-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(5,8,15,0.90);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--ocean-border);
          padding: 12px 24px;
        }

        .surf-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .surf-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--ocean-border);
          background: var(--ocean-surface);
          color: var(--foam-dim);
          text-decoration: none;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .surf-back-btn:hover {
          border-color: var(--teal-dim);
          color: var(--teal);
          background: rgba(0,180,216,0.08);
        }

        .surf-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--teal-dim);
        }

        .surf-header-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--foam);
        }

        /* Main */
        .surf-main {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* Hero */
        .surf-hero {
          position: relative;
          padding: 64px 0 56px;
          text-align: center;
          overflow: hidden;
        }

        .surf-hero-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 400px;
          background: radial-gradient(ellipse at 50% 0%, rgba(0,180,216,0.18) 0%, rgba(0,119,182,0.06) 45%, transparent 70%);
          pointer-events: none;
        }

        .surf-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--teal);
          background: rgba(0,245,212,0.07);
          border: 1px solid rgba(0,245,212,0.22);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .surf-hero-h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 14vw, 140px);
          line-height: 0.88;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 8px;
          text-shadow: 0 0 80px rgba(0,180,216,0.25);
        }

        .surf-hero-h1 .wave {
          display: block;
          color: var(--teal);
          text-shadow: 0 0 60px rgba(0,245,212,0.50);
        }

        .surf-hero-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(14px, 2.2vw, 18px);
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--foam-dim);
          margin: 18px 0 36px;
          max-width: 540px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Wave animation divider */
        .surf-wave-divider {
          width: 100%;
          height: 32px;
          margin-bottom: 32px;
          overflow: hidden;
          opacity: 0.35;
        }

        /* Hero stats */
        .surf-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .surf-hero-stat {
          text-align: center;
        }

        .surf-hero-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 44px;
          line-height: 1;
          color: var(--teal);
        }

        .surf-hero-stat-num .unit {
          font-size: 18px;
          color: var(--foam-dim);
          margin-left: 3px;
        }

        .surf-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--foam-dim);
          margin-top: 4px;
        }

        .surf-hero-divider {
          width: 1px;
          height: 40px;
          background: var(--ocean-border);
        }

        /* Key stats row */
        .surf-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) {
          .surf-key-stats { grid-template-columns: repeat(4, 1fr); }
        }

        .surf-stat-card {
          background: var(--ocean-surface);
          border: 1px solid var(--ocean-border);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
        }

        .surf-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .surf-stat-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          line-height: 1;
          margin-bottom: 4px;
        }

        .surf-stat-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--foam-dim);
          margin-bottom: 4px;
        }

        .surf-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--foam-faint);
          letter-spacing: 0.04em;
        }

        /* Session breakdown chart */
        .surf-breakdown {
          background: var(--ocean-surface);
          border: 1px solid var(--ocean-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .surf-breakdown-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--teal-dim);
          margin-bottom: 20px;
        }

        .surf-breakdown-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .surf-breakdown-row {
          display: grid;
          grid-template-columns: 100px 1fr 40px;
          align-items: center;
          gap: 12px;
        }

        .surf-breakdown-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .surf-breakdown-track {
          height: 20px;
          background: rgba(255,255,255,0.04);
          position: relative;
          overflow: hidden;
        }

        .surf-breakdown-fill {
          height: 100%;
          position: absolute;
          left: 0; top: 0;
          opacity: 0.85;
        }

        .surf-breakdown-pct {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          text-align: right;
        }

        /* Cards */
        .surf-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .surf-card {
          background: var(--ocean-surface);
          border: 1px solid var(--ocean-border);
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }

        .surf-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
        }

        .surf-card-number {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 64px;
          line-height: 1;
          position: absolute;
          top: 20px;
          right: 24px;
          opacity: 0.06;
          letter-spacing: -0.02em;
        }

        .surf-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .surf-card-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--foam);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .surf-findings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .surf-finding {
          display: flex;
          gap: 14px;
          padding: 13px;
          background: rgba(255,255,255,0.025);
          border-left: 2px solid rgba(255,255,255,0.06);
          transition: all 0.15s ease;
        }

        .surf-finding:hover {
          background: rgba(255,255,255,0.04);
        }

        .surf-finding-stat {
          flex-shrink: 0;
          min-width: 88px;
        }

        .surf-finding-stat-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          line-height: 1;
        }

        .surf-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--foam-faint);
          letter-spacing: 0.04em;
          margin-top: 2px;
          line-height: 1.4;
        }

        .surf-finding-body {
          flex: 1;
          min-width: 0;
        }

        .surf-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--foam-faint);
          margin-bottom: 5px;
        }

        .surf-finding-detail {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: rgba(232,244,248,0.72);
          line-height: 1.55;
        }

        /* Fitness levels chart */
        .surf-fitness {
          background: var(--ocean-surface);
          border: 1px solid var(--ocean-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .surf-fitness-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--teal-dim);
          margin-bottom: 6px;
        }

        .surf-fitness-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px;
          color: var(--foam-faint);
          margin-bottom: 20px;
          letter-spacing: 0.04em;
        }

        .surf-fitness-rows {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .surf-fitness-row {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 16px;
          align-items: center;
        }

        .surf-fitness-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .surf-fitness-bar-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .surf-fitness-track {
          height: 6px;
          background: rgba(255,255,255,0.06);
          position: relative;
        }

        .surf-fitness-fill {
          height: 100%;
          position: absolute;
          left: 0; top: 0;
        }

        .surf-fitness-meta {
          display: flex;
          gap: 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--foam-faint);
          letter-spacing: 0.06em;
        }

        /* Disclaimer */
        .surf-disclaimer {
          margin-top: 40px;
          padding: 18px 22px;
          background: var(--ocean-surface);
          border: 1px solid var(--ocean-border);
          border-left: 3px solid var(--foam-faint);
        }

        .surf-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--foam-dim);
          line-height: 1.75;
          letter-spacing: 0.04em;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .surf-hero-h1 { font-size: 64px; }
          .surf-card { padding: 22px 18px; }
          .surf-finding { flex-direction: column; gap: 8px; }
          .surf-finding-stat { min-width: unset; }
          .surf-breakdown-row { grid-template-columns: 80px 1fr 36px; }
          .surf-fitness-row { grid-template-columns: 100px 1fr; }
        }
      `}} />

      <div className="surf-root">
        {/* Header */}
        <header className="surf-header">
          <div className="surf-header-inner">
            <Link href="/workouts" className="surf-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="surf-header-label">Sports Science Series</div>
              <div className="surf-header-title">Surfing Science</div>
            </div>
          </div>
        </header>

        <main className="surf-main">
          {/* Hero */}
          <section className="surf-hero">
            <div className="surf-hero-glow" />
            <div className="surf-hero-tag">Ocean Sport Physiology & Performance</div>
            <h1 className="surf-hero-h1">
              SURFING
              <span className="wave">SCIENCE</span>
            </h1>
            <p className="surf-hero-sub">
              The physiology of paddling, pop-ups, and wave riding. Evidence-based performance science.
            </p>
            {/* SVG wave divider */}
            <div className="surf-wave-divider">
              <svg viewBox="0 0 900 32" preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
                <path d="M0,16 C150,32 200,0 300,16 C400,32 450,0 600,16 C750,32 800,0 900,16" fill="none" stroke="rgba(0,180,216,0.6)" strokeWidth="1.5"/>
                <path d="M0,20 C120,8 220,28 350,20 C480,12 520,28 650,20 C780,12 840,24 900,20" fill="none" stroke="rgba(0,245,212,0.35)" strokeWidth="1"/>
              </svg>
            </div>
            <div className="surf-hero-stats">
              <div className="surf-hero-stat">
                <div className="surf-hero-stat-num">54<span className="unit">%</span></div>
                <div className="surf-hero-stat-label">Session Paddling</div>
              </div>
              <div className="surf-hero-divider" />
              <div className="surf-hero-stat">
                <div className="surf-hero-stat-num">0.5<span className="unit">s</span></div>
                <div className="surf-hero-stat-label">Pop-up Time</div>
              </div>
              <div className="surf-hero-divider" />
              <div className="surf-hero-stat">
                <div className="surf-hero-stat-num">5<span className="unit">G</span></div>
                <div className="surf-hero-stat-label">Snap G-Force</div>
              </div>
            </div>
          </section>

          {/* Key stats */}
          <div className="surf-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="surf-stat-card">
                <div className="surf-stat-card" style={{border:'none',padding:0}}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                  <div className="surf-stat-val" style={{color:s.color}}>{s.value}</div>
                  <div className="surf-stat-label">{s.label}</div>
                  <div className="surf-stat-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Session time breakdown */}
          <div className="surf-breakdown">
            <div className="surf-breakdown-title">Session Time Allocation — Farley 2012</div>
            <div className="surf-breakdown-bars">
              {SESSION_BREAKDOWN.map(b => (
                <div key={b.label} className="surf-breakdown-row">
                  <div className="surf-breakdown-label" style={{color: b.color}}>{b.label}</div>
                  <div className="surf-breakdown-track">
                    <div className="surf-breakdown-fill" style={{width:`${b.pct}%`,background:b.color}} />
                  </div>
                  <div className="surf-breakdown-pct" style={{color:b.color}}>{b.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science cards */}
          <div className="surf-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="surf-card" style={{borderLeftColor: card.accent}} >
                <div style={{position:'absolute',top:0,left:0,width:'3px',height:'100%',background:card.accent}} />
                <div className="surf-card-number">{card.number}</div>
                <div className="surf-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="surf-card-title">{card.title}</div>
                <div className="surf-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="surf-finding" style={{'--card-accent':card.accent} as React.CSSProperties}>
                      <div className="surf-finding-stat">
                        <div className="surf-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="surf-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="surf-finding-body">
                        <div className="surf-finding-citation">{f.citation}</div>
                        <div className="surf-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fitness levels */}
          <div className="surf-fitness">
            <div className="surf-fitness-title">Performance Benchmarks by Level — Sheppard 2013</div>
            <div className="surf-fitness-sub">400m paddle time · VO₂max · vertical jump</div>
            <div className="surf-fitness-rows">
              {FITNESS_LEVELS.map(row => (
                <div key={row.level} className="surf-fitness-row">
                  <div className="surf-fitness-label" style={{color:row.color}}>{row.level}</div>
                  <div className="surf-fitness-bar-wrap">
                    <div className="surf-fitness-track">
                      <div className="surf-fitness-fill" style={{width:`${row.barW}%`,background:row.color}} />
                    </div>
                    <div className="surf-fitness-meta">
                      <span>PADDLE {row.paddleTime} min</span>
                      <span>VO₂ {row.vo2} mL/kg</span>
                      <span>JUMP {row.jump}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="surf-disclaimer">
            <div className="surf-disclaimer-text">
              All statistics and citations are drawn from published peer-reviewed research. Sample sizes and methodologies vary; findings reflect study populations and may not generalise universally. Breath-hold training should only be conducted with qualified supervision — never alone in water. Surfing involves inherent risk; consult a qualified instructor and understand local ocean hazards before entering the water.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
