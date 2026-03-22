// Disc Sports Science — static server component
// Evidence-based guide covering disc throwing biomechanics, Ultimate Frisbee physical demands,
// disc golf performance science, and comparative physiology of disc sports.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Disc Sports Science' }

// ─── CSS Variables & Font ─────────────────────────────────────────────────────
// --disc-dark: #0a1a0a   background
// --disc-lime: #84cc16   lime accent
// --disc-sky:  #38bdf8   sky blue accent
// --disc-white: #f0fdf4  text
// --disc-mid:  #14532d   mid-green surface tones
// Font: DM Sans (weights 400, 500, 700) — imported via @next/font or inline style

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '120 km/h',
    label: 'Elite Throw Speed',
    sub: 'Backhand at elite level; wrist snap 800–1,200°/s',
    accent: '#84cc16',
  },
  {
    value: '600 rpm',
    label: 'Disc Spin Rate',
    sub: 'Gyroscopic stability threshold; 400–800 rpm for elite',
    accent: '#38bdf8',
  },
  {
    value: '8–12 km',
    label: 'Per Game Distance',
    sub: 'Elite Ultimate GPS data; 20–25% high-intensity running',
    accent: '#84cc16',
  },
  {
    value: '85–92%',
    label: 'HRmax Ultimate',
    sub: 'Average HR during active play; VO₂max 60–70 mL/kg/min',
    accent: '#38bdf8',
  },
]

// ─── Chart Data: Disc Flight Distance by Type ─────────────────────────────────

const FLIGHT_CHART = [
  { label: 'Elite Drive',    meters: 175, pct: 100, color: '#84cc16' },
  { label: 'Average Drive',  meters: 120, pct: 69,  color: '#65a30d' },
  { label: 'Fairway Driver', meters: 90,  pct: 51,  color: '#38bdf8' },
  { label: 'Mid-range',      meters: 60,  pct: 34,  color: '#0ea5e9' },
  { label: 'Putter',         meters: 30,  pct: 17,  color: '#7dd3fc' },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'throwing-biomechanics',
    title: 'Frisbee Throwing Biomechanics',
    accent: '#84cc16',
    accentBg: 'rgba(132,204,22,0.07)',
    accentBorder: 'rgba(132,204,22,0.22)',
    accentPill: 'rgba(132,204,22,0.14)',
    iconSymbol: '○',
    iconColor: '#bef264',
    findings: [
      {
        citation: 'Hubbard 2000 — Sports Engineering (disc flight dynamics)',
        stat: 'Backhand throw: 80–120 km/h at elite level; wrist snap 800–1,200°/s; disc spin 400–800 rpm',
        detail:
          'Wrist snap angular velocity reaches 800–1,200°/s at disc release; elbow extension contributes 30–40% of total arm velocity through the proximal-to-distal kinetic chain. The follow-through arc dissipates angular momentum and reduces shoulder injury risk. Elite players impart 400–800 rpm of disc spin, generating gyroscopic stability that resists perturbation during flight. Aerodynamic lift arises from the Bernoulli effect: faster airflow over the disc\'s upper cambered surface reduces pressure, producing upward force proportional to velocity squared. Hubbard 2000 modeled disc flight dynamics comprehensively, establishing the aerodynamic coefficients underlying these parameters.',
      },
      {
        citation: 'Potts & Crowther 2002 — AIAA Paper (frisbee aerodynamics)',
        stat: 'Disc stability: gyroscopic precession at 600+ rpm; CL 0.3–0.9, CD 0.1–0.2 at 60–120 km/h',
        detail:
          'A flying disc generates lift and drag according to coefficients that vary with angle of attack — typical CL 0.3–0.9 and CD 0.1–0.2 for a 175 g Ultimate disc at 60–120 km/h. The Magnus effect from disc spin creates a lateral force perpendicular to both the spin axis and velocity vector. At spin rates above ~600 rpm, gyroscopic precession strongly resists changes to the disc\'s tilt, damping nutation (wobble) and stabilizing the flight path. Below 300 rpm, aerodynamic instability dominates and the disc tumbles. The 175 g Discraft Ultrastar used in elite Ultimate is engineered to maximize these stability properties across a range of throwing velocities.',
      },
      {
        citation: 'Disc flight mechanics — overhead throwing biomechanics literature',
        stat: 'Hammer throw: overhead inverted release, 45–60° angle of attack; shoulder external rotation loading phase',
        detail:
          'The hammer is an inverted overhead release with the disc tilted 45–60° off horizontal, exploiting the disc\'s symmetric aerodynamics for a steep arcing trajectory over defenders. Biomechanically, the throw requires shoulder external rotation in the loading phase (60–90° abduction), wrist pronation through release, and a modified follow-through arc. At release the disc is nearly vertical, and gyroscopic stability maintains the inverted flight path. Aerodynamic forces in inverted flight produce lateral drift that experienced throwers can predict and compensate for with aiming adjustments. The hammer is most effective in tight coverage situations where high-arc flight clears the marker\'s reach.',
      },
      {
        citation: 'Ultimate throwing kinematics — sport biomechanics studies',
        stat: 'Forehand (flick): forearm pronation dominant, 700–1,000°/s; shorter lever arm, tighter spaces',
        detail:
          'The forehand differs fundamentally from the backhand in its kinetic chain: power originates in the forearm and wrist rather than the shoulder and torso. Forearm pronation velocity peaks at 700–1,000°/s through release, while the index and middle fingers impart spin via a snap against the disc rim. The shorter lever arm sacrifices some maximum velocity compared to the backhand — typically 15–25 km/h slower in matched players — but enables throws from tighter spaces and different body positions under coverage. Accuracy at distance requires deliberate wrist stiffness in the initial release phase followed by an explosive snap, representing a classic accuracy–power trade-off in biomechanical skill execution.',
      },
    ],
  },
  {
    id: 'ultimate-demands',
    title: 'Ultimate Frisbee Physical Demands',
    accent: '#38bdf8',
    accentBg: 'rgba(56,189,248,0.07)',
    accentBorder: 'rgba(56,189,248,0.22)',
    accentPill: 'rgba(56,189,248,0.14)',
    iconSymbol: '↗',
    iconColor: '#7dd3fc',
    findings: [
      {
        citation: 'AUDL/UPA GPS tracking data — elite Ultimate player demands',
        stat: 'Elite Ultimate: 8–12 km per game, 85–92% HRmax; 40–60 directional changes per game',
        detail:
          'GPS tracking data from AUDL and UPA elite Ultimate players shows 8–12 km total distance per game with average heart rate at 85–92% HRmax during active play. High-intensity running above 18 km/h constitutes 20–25% of total distance covered, reflecting the repeated-sprint nature of field play. Players execute 40–60 directional changes per game — cuts, defensive pivots, and force adjustments — placing high demands on reactive neuromuscular control. Aerobic capacity with VO₂max 60–70 mL/kg/min in elite cutters drives recovery between high-intensity efforts and sustains performance across multiple points.',
      },
      {
        citation: 'Duthie 2003 (cutting sports) + ACL injury biomechanics literature',
        stat: 'Cutting: acceleration-deceleration over 10–15 m; 3–5× body weight at plant foot; ACL risk sport',
        detail:
          'The "cut" — a sudden directional change to create disc-reception separation — is the defining movement pattern of Ultimate offense. Cuts span 10–15 m of acceleration followed by abrupt deceleration and reacceleration in a new direction. Biomechanically, the plant foot absorbs 3–5× body weight during the change of direction, with high valgus and shear stress at the knee. ACL loading during planting on lateral cuts is substantial; cutting sports have 4–8× higher ACL injury rates than non-cutting sports. First-step acceleration from 0 to 5 m involves maximal neuromuscular recruitment in under 0.5 seconds. Ankle dorsiflexion range of motion strongly predicts cutting efficiency.',
      },
      {
        citation: 'Ultimate injury epidemiology — tournament and league data',
        stat: 'Layout: full-body dive catch generates 3–5× body weight impact; shoulder labrum injury risk',
        detail:
          'The layout — a full-extension diving catch — is a hallmark of Ultimate and produces ground contact forces of 3–5× body weight on landing. Shoulder labrum and rotator cuff structures absorb impact during outstretched dives; shoulder labrum tears are among the most common serious injuries in Ultimate. Wrist dorsiflexion stress on landing contributes to scaphoid and distal radius fracture risk. Epidemiological data from Ultimate tournaments shows forearm and elbow bruising (from disc contact) is the most prevalent minor injury category. Experienced players instinctively tuck and roll to distribute impact forces, reducing peak loading at any single joint.',
      },
      {
        citation: 'Positional GPS analysis — handler vs. cutter demands in elite Ultimate',
        stat: 'Handler-cutter energy demands differ 30–40%; cutters 2–3× more sprint efforts per game',
        detail:
          'GPS data reveals significant positional differences in Ultimate: cutters cover 30–40% greater total distance and execute 2–3× more sprint efforts per game compared to handlers. Handlers maintain lower average velocities, focus on disc possession and decision-making, and spend more time in stationary or slow-movement states — managing flow through high-percentage short passes. Cutters are reactive-movement specialists with high lactate exposure (4–7 mmol/L during sustained pressure sequences). Training should be periodized by position: cutters require repeat-sprint capacity and reactive agility work; handlers benefit from sustained aerobic base and throwing endurance under physical fatigue.',
      },
    ],
  },
  {
    id: 'disc-golf-science',
    title: 'Disc Golf Performance Science',
    accent: '#84cc16',
    accentBg: 'rgba(132,204,22,0.07)',
    accentBorder: 'rgba(132,204,22,0.22)',
    accentPill: 'rgba(132,204,22,0.14)',
    iconSymbol: '◎',
    iconColor: '#bef264',
    findings: [
      {
        citation: 'PDGA flight physics data — Paul McBeth, Ricky Wysocki elite drive analysis',
        stat: 'Disc golf drive: 130–180 km/h; 400–600 ft for elite; overstable vs. understable flight paths',
        detail:
          'Elite disc golf players consistently throw 500–600+ ft (152–183 m) with driver discs at 130–180 km/h release velocity. Disc flight physics differ by disc type: overstable drivers (high fade rating) resist turn and finish left for a right-hand backhand (RHBH) thrower; understable drivers turn right before fading left at lower speeds, maximizing distance with an S-curve flight path. Hyzer angle (tilted toward the throwing arm) increases stability and control; anhyzer angle increases turn. Disc weight (150–176 g) and PDGA-approved diameter (21–30 cm) are tightly regulated. Aerodynamic lift is maximized with a slightly nose-down release angle of 5–10° below horizontal.',
      },
      {
        citation: 'Disc golf biomechanics — X-step power generation kinetics',
        stat: 'Biomechanics: X-step footwork; hip rotation 500–700°/s; shoulder-to-hip X-factor stretch 35–50°',
        detail:
          'The X-step approach — a cross-step followed by a planted pivot foot — is the foundation of disc golf power generation. Hip rotation velocity peaks at 500–700°/s through the downswing, with a shoulder-to-hip separation ("X-factor stretch") of 35–50° at the top of the backswing that stores elastic energy in the thoracolumbar fascia and oblique musculature. Wrist snap contributes 800–1,000°/s angular velocity at the moment of release, accounting for 20–30% of disc speed. Reaching the disc back to maximum extension and driving the lead hip forward first (proximal-to-distal sequencing) is the single most important power determinant in high-level disc golf throwing mechanics.',
      },
      {
        citation: 'PDGA scoring analysis — rating distributions and stroke contribution data',
        stat: 'Accuracy vs. power: 70–80% of strokes are approach/putt (<150 ft); Pareto principle in scoring',
        detail:
          'Scoring analysis across PDGA amateur and professional divisions consistently shows that approach shots and putts inside 150 ft (46 m) of the basket account for 70–80% of all strokes in a round — the sport\'s Pareto principle. Players improving from 900 to 1000 rated gain more from scramble accuracy and putting than from adding 30 ft of driving distance. Power game improvements reduce strokes on long open holes but have diminishing returns on overall scoring. At elite amateur level (approximately 1000 rated), inside-the-circle C1 putting percentage (within 10 m) is the strongest single predictor of competitive round scores.',
      },
      {
        citation: 'PDGA flight rating system — disc engineering and selection science',
        stat: 'Disc selection: flight ratings (Speed, Glide, Turn, Fade); 15–25 discs per advanced player bag',
        detail:
          'The PDGA flight rating system quantifies four parameters: Speed (1–14, force required for optimal flight), Glide (1–7, lift efficiency and hang time), Turn (−5 to +1, high-speed tendency to turn right RHBH), and Fade (0–5, low-speed finish left RHBH). A beginner overstable disc (7/5/−1/3) provides predictable flight. An understable distance driver (13/6/−3/1) maximizes distance but requires high arm speed and precise release angle. Wind conditions fundamentally alter disc behavior — headwinds increase effective overstability; tailwinds increase understability. Advanced players carry 15–25 discs to match trajectory demands across all course layouts and environmental conditions.',
      },
    ],
  },
  {
    id: 'physiology-spirit',
    title: 'Ultimate vs. Disc Golf Physiology & Spirit',
    accent: '#38bdf8',
    accentBg: 'rgba(56,189,248,0.07)',
    accentBorder: 'rgba(56,189,248,0.22)',
    accentPill: 'rgba(56,189,248,0.14)',
    iconSymbol: '♡',
    iconColor: '#7dd3fc',
    findings: [
      {
        citation: 'Elite Ultimate physiology — aerobic capacity and lactate profiling',
        stat: 'VO₂max: 60–70 mL/kg/min for elite Ultimate players; lactate 4–7 mmol/L in pressure sequences',
        detail:
          'Elite Ultimate players demonstrate aerobic profiles comparable to soccer midfielders: VO₂max 60–70 mL/kg/min for open/elite cutters, 55–63 mL/kg/min for handlers. Blood lactate accumulates to 4–7 mmol/L during sustained defensive pressure sequences and end-zone cutting combinations. The energy system profile resembles soccer: predominantly aerobic (~80%) with repeated glycolytic bursts during sprints and cuts. Unlike soccer, Ultimate\'s self-officiating structure introduces unique physiological stressors during disputes — cortisol elevation, attentional demands, and heart rate spikes outside of physical exertion — that have no equivalent in referee-controlled sports.',
      },
      {
        citation: 'Sport psychology — self-officiation, Spirit of the Game, cognitive load research',
        stat: 'Spirit of the Game: no referees; conflict resolution under fatigue; executive function demand under arousal',
        detail:
          'Ultimate frisbee is globally unique as a competitive field sport with no referees below elite competition — the Spirit of the Game (SOTG) principle requires players to call their own fouls honestly under physical fatigue and competitive pressure. Sport psychology research indicates that self-officiation under competitive stress increases executive function demand (cognitive load), activates anterior cingulate conflict-monitoring circuits, and requires inhibition of aggressive responses while in physiological high-arousal states (HR >85% HRmax). SOTG scores at tournaments formally assess team fairness, communication, and positive attitude, creating a psychosocial accountability structure that distinguishes Ultimate culture from all mainstream referee-dependent team sports.',
      },
      {
        citation: 'Disc golf physical activity assessment — walking demands and caloric expenditure',
        stat: 'Disc golf walking: 8–12 km per 18-hole round; 400–700 kcal; moderate cardiovascular intensity',
        detail:
          'An 18-hole disc golf round on a standard course requires 8–12 km of walking, with elevation gain of 100–400 m on hilly championship courses. Cardiovascular intensity is moderate (50–65% HRmax average) — substantially lower than Ultimate but meaningful for daily movement accumulation. Caloric expenditure is estimated at 400–700 kcal per round depending on course difficulty, body mass, and terrain gradient. The low-impact nature makes disc golf accessible to older adults and individuals in rehabilitation; the cognitive demands of course management and shot selection provide mental engagement that correlates with improved mood and reduced state anxiety in recreational players across all age groups.',
      },
      {
        citation: 'Throwing injury prevention — overhead sport rotator cuff literature',
        stat: 'Warm-up: rotator cuff pre-activation reduces throwing injury 25–35%; progressive disc throwing progression',
        detail:
          'Overhead and lateral throwing sports share rotator cuff loading patterns with baseball and tennis. Evidence from throwing sport injury prevention literature indicates that rotator cuff pre-activation — internal/external rotation with resistance bands, 2 sets × 15 reps each direction — before throwing sessions reduces shoulder injury incidence by 25–35%. For disc sports, a progressive warm-up protocol includes wrist and forearm flexibility exercises, dynamic catching and easy throws progressing from 20 ft to full distance over 10–15 minutes, shoulder circles, and forearm pronation/supination mobility work. Elbow medial collateral ligament stress from the forehand throw warrants specific valgus-loading tolerance training in players who throw high volumes.',
      },
    ],
  },
]

// ─── Key Principles ───────────────────────────────────────────────────────────

const KEY_PRINCIPLES = [
  'Elite backhand throws reach 80–120 km/h with wrist snap at 800–1,200°/s; disc spin above 600 rpm creates gyroscopic stability that dominates flight path control.',
  'The Bernoulli effect on the disc\'s cambered upper surface generates aerodynamic lift; Magnus effect from spin adds a lateral force component to the flight trajectory.',
  'Ultimate Frisbee elite players cover 8–12 km per game at 85–92% HRmax, with 40–60 directional changes requiring ACL-loading plant-and-cut mechanics.',
  'Cutters cover 30–40% more distance than handlers per game and execute 2–3× more sprint efforts; positional training periodization should reflect these differences.',
  'The layout (full-extension dive) generates 3–5× body weight ground contact force; shoulder labrum and wrist scaphoid are the primary injury risks.',
  'Elite disc golf drives reach 130–180 km/h with hip rotation at 500–700°/s; the X-factor thoracolumbar stretch drives the proximal-to-distal power chain.',
  '70–80% of disc golf strokes occur within 150 ft of the basket — approach accuracy and putting are higher-value improvement targets than distance for most players.',
  'Spirit of the Game self-officiation creates unique cognitive and physiological demands absent from referee-controlled sports; conflict resolution under high arousal requires active executive function.',
  'Rotator cuff pre-activation before throwing sessions reduces disc sport shoulder injuries by 25–35%; progressive warm-up over 10–15 minutes is evidence-based.',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  sub,
  accent,
}: {
  value: string
  label: string
  sub: string
  accent: string
}) {
  return (
    <div
      style={{
        background: 'rgba(20,83,45,0.18)',
        border: '1px solid rgba(132,204,22,0.14)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '18px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 160,
      }}
    >
      <p
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#f0fdf4', margin: '8px 0 4px', fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif' }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: '#4ade80', margin: 0, lineHeight: 1.45, opacity: 0.7 }}>{sub}</p>
    </div>
  )
}

function FindingRow({
  citation,
  detail,
  stat,
  accent,
}: {
  citation: string
  detail: string
  stat: string
  accent: string
}) {
  return (
    <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(132,204,22,0.07)' }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#4ade80',
          margin: '0 0 7px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontFamily: '"DM Sans", ui-monospace, monospace',
          opacity: 0.75,
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#d1fae5', margin: '0 0 11px', lineHeight: 1.65, fontFamily: '"DM Sans", ui-sans-serif, sans-serif' }}>
        {detail}
      </p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: '"DM Sans", ui-monospace, monospace',
          background: 'rgba(10,26,10,0.6)',
          border: `1px solid ${accent}33`,
          borderRadius: 6,
          padding: '4px 10px',
          display: 'inline-block',
          lineHeight: 1.4,
        }}
      >
        {stat}
      </p>
    </div>
  )
}

function ScienceCard({
  iconSymbol,
  iconColor,
  title,
  accent,
  accentBg,
  accentBorder,
  accentPill,
  findings,
}: (typeof SCIENCE_CARDS)[number]) {
  return (
    <div
      style={{
        background: 'rgba(14,30,14,0.85)',
        border: '1px solid rgba(132,204,22,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: accentPill,
            border: `1px solid ${accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: iconColor,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              lineHeight: 1,
            }}
          >
            {iconSymbol}
          </span>
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#f0fdf4',
            margin: 0,
            fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
          }}
        >
          {title}
        </h2>
      </div>

      {/* Findings */}
      {findings.map((f, i) => (
        <FindingRow key={i} {...f} accent={accent} />
      ))}
    </div>
  )
}

// ─── Hero SVG: Spinning Disc with Flight Arc ──────────────────────────────────

function DiscHeroSVG() {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto' }}
      aria-hidden="true"
    >
      {/* Flight arc path */}
      <path
        d="M 20 130 Q 160 20 300 80"
        stroke="url(#discArcGrad)"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        opacity="0.6"
      />

      {/* Motion blur lines behind disc */}
      <line x1="160" y1="72" x2="120" y2="68" stroke="#84cc16" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      <line x1="160" y1="76" x2="115" y2="74" stroke="#84cc16" strokeWidth="1" opacity="0.18" strokeLinecap="round" />
      <line x1="160" y1="80" x2="118" y2="82" stroke="#38bdf8" strokeWidth="1" opacity="0.18" strokeLinecap="round" />
      <line x1="160" y1="84" x2="122" y2="88" stroke="#38bdf8" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />

      {/* Disc body (ellipse for 3D perspective) */}
      <ellipse cx="175" cy="78" rx="28" ry="11" fill="url(#discBodyGrad)" />
      {/* Disc rim highlight */}
      <ellipse cx="175" cy="78" rx="28" ry="11" fill="none" stroke="#bef264" strokeWidth="1.2" opacity="0.8" />
      {/* Disc dome (upper surface bulge) */}
      <ellipse cx="175" cy="75" rx="20" ry="7" fill="url(#discDomeGrad)" opacity="0.7" />
      {/* Disc center ring */}
      <ellipse cx="175" cy="78" rx="7" ry="3" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
      {/* Spin indicator lines */}
      <line x1="168" y1="75" x2="182" y2="75" stroke="#84cc16" strokeWidth="0.8" opacity="0.5" />
      <line x1="175" y1="70" x2="175" y2="80" stroke="#84cc16" strokeWidth="0.8" opacity="0.5" />

      {/* Ground shadow */}
      <ellipse cx="175" cy="148" rx="22" ry="4" fill="#84cc16" opacity="0.08" />

      {/* Speed annotation */}
      <text x="195" y="68" fill="#84cc16" fontSize="9" fontWeight="700" fontFamily="ui-monospace, monospace" opacity="0.85">
        120 km/h
      </text>
      <text x="195" y="79" fill="#38bdf8" fontSize="8" fontFamily="ui-monospace, monospace" opacity="0.7">
        600 rpm
      </text>

      {/* Start position marker */}
      <circle cx="20" cy="130" r="3.5" fill="#84cc16" opacity="0.7" />
      <text x="26" y="134" fill="#84cc16" fontSize="8" fontFamily="ui-monospace, monospace" opacity="0.6">
        Release
      </text>

      {/* End position marker */}
      <circle cx="300" cy="80" r="3.5" fill="#38bdf8" opacity="0.7" />
      <text x="260" y="96" fill="#38bdf8" fontSize="8" fontFamily="ui-monospace, monospace" opacity="0.6">
        Catch zone
      </text>

      {/* Bernoulli lift arrow */}
      <line x1="175" y1="64" x2="175" y2="55" stroke="#bef264" strokeWidth="1.2" opacity="0.5" />
      <polygon points="175,52 172,58 178,58" fill="#bef264" opacity="0.5" />
      <text x="178" y="57" fill="#bef264" fontSize="7" fontFamily="ui-monospace, monospace" opacity="0.55">
        Lift
      </text>

      {/* Gradients */}
      <defs>
        <linearGradient id="discArcGrad" x1="20" y1="130" x2="300" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#84cc16" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#84cc16" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="discBodyGrad" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#365314" />
          <stop offset="60%" stopColor="#1a2e08" />
          <stop offset="100%" stopColor="#0a1a0a" />
        </radialGradient>
        <radialGradient id="discDomeGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#84cc16" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// ─── Flight Distance Chart ────────────────────────────────────────────────────

function FlightDistanceChart() {
  return (
    <div
      style={{
        background: 'rgba(14,30,14,0.85)',
        border: '1px solid rgba(132,204,22,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(132,204,22,0.07)',
          borderBottom: '1px solid rgba(132,204,22,0.18)',
          borderLeft: '3px solid #84cc16',
          padding: '14px 18px',
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#f0fdf4',
            margin: 0,
            fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
          }}
        >
          Disc Flight Distance by Type
        </h2>
        <p style={{ fontSize: 12, color: '#4ade80', margin: '3px 0 0', opacity: 0.7 }}>
          PDGA disc classifications — typical maximum flight distance by disc category
        </p>
      </div>

      {/* Chart */}
      <div style={{ padding: '20px 22px' }}>
        {FLIGHT_CHART.map((row) => (
          <div key={row.label} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#d1fae5',
                  fontFamily: '"DM Sans", ui-sans-serif, sans-serif',
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: row.color,
                  fontFamily: '"DM Sans", ui-monospace, monospace',
                }}
              >
                {row.meters} m
              </span>
            </div>
            <div
              style={{
                height: 10,
                background: 'rgba(132,204,22,0.08)',
                borderRadius: 5,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${row.pct}%`,
                  background: `linear-gradient(90deg, ${row.color}cc, ${row.color})`,
                  borderRadius: 5,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        ))}

        <p
          style={{
            fontSize: 11,
            color: '#4ade80',
            margin: '8px 0 0',
            opacity: 0.6,
            fontStyle: 'italic',
          }}
        >
          Elite drive distances reflect professional-level players (Paul McBeth 600+ ft ≈ 183 m). Recreational averages 20–40% lower.
        </p>
      </div>
    </div>
  )
}

// ─── Key Principles Footer ────────────────────────────────────────────────────

function KeyPrinciplesSection() {
  return (
    <div
      style={{
        background: 'rgba(10,26,10,0.9)',
        border: '1px solid rgba(132,204,22,0.1)',
        borderRadius: 14,
        padding: '18px 20px',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#4ade80',
          margin: '0 0 12px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontFamily: '"DM Sans", ui-monospace, monospace',
          opacity: 0.8,
        }}
      >
        Key Principles
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {KEY_PRINCIPLES.map((point, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: i % 2 === 0 ? '#84cc16' : '#38bdf8',
                fontFamily: '"DM Sans", ui-monospace, monospace',
                flexShrink: 0,
                marginTop: 2,
                letterSpacing: '0.5px',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <p
              style={{
                fontSize: 12,
                color: '#6ee7b7',
                margin: 0,
                lineHeight: 1.55,
                fontFamily: '"DM Sans", ui-sans-serif, sans-serif',
                opacity: 0.85,
              }}
            >
              {point}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscSportsSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a1a0a',
        fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Google Font: DM Sans */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10,26,10,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(132,204,22,0.15)',
        }}
      >
        <div
          style={{
            maxWidth: 768,
            margin: '0 auto',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Link
            href="/disc-sports"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'rgba(132,204,22,0.1)',
              border: '1px solid rgba(132,204,22,0.2)',
              color: '#84cc16',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            aria-label="Back to Disc Sports"
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#f0fdf4',
                  margin: 0,
                  fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
                }}
              >
                Disc Sports Science
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  background: 'rgba(132,204,22,0.12)',
                  border: '1px solid rgba(132,204,22,0.3)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#84cc16',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Biomechanics
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: '#4ade80',
                margin: '2px 0 0',
                opacity: 0.7,
                fontFamily: '"DM Sans", ui-sans-serif, sans-serif',
              }}
            >
              Ultimate Frisbee &amp; Disc Golf — physics, physiology &amp; performance
            </p>
          </div>

          {/* Disc icon */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(132,204,22,0.12)',
              border: '2px solid rgba(132,204,22,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: '#84cc16',
                fontWeight: 900,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              ○
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 768, margin: '0 auto', padding: '24px 16px 96px' }}>

        {/* Hero section */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(132,204,22,0.10) 0%, rgba(56,189,248,0.07) 50%, rgba(132,204,22,0.05) 100%)',
            border: '1px solid rgba(132,204,22,0.18)',
            borderRadius: 18,
            padding: '24px 22px 20px',
            marginBottom: 28,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Background grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(132,204,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(132,204,22,0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <DiscHeroSVG />

            <p
              style={{
                fontSize: 13,
                color: '#a7f3d0',
                margin: '16px 0 0',
                lineHeight: 1.75,
                fontFamily: '"DM Sans", ui-sans-serif, sans-serif',
                opacity: 0.9,
              }}
            >
              Disc sports span two radically different physical disciplines: Ultimate Frisbee — a continuous high-intensity field sport with GPS demands matching elite soccer — and disc golf, a precision throwing game covering 8–12 km per round at moderate intensity. Both rely on the same fundamental aerodynamic and biomechanical principles: gyroscopic stability, Bernoulli-driven lift, and wrist-snap power generation. This guide synthesizes the physics, physiology, and performance science underpinning elite disc sport.
            </p>
          </div>
        </div>

        {/* Key Stats */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          {KEY_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Flight Distance Chart */}
        <div style={{ marginBottom: 20 }}>
          <FlightDistanceChart />
        </div>

        {/* Science Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* Key Principles */}
        <KeyPrinciplesSection />

      </main>

      <BottomNav />
    </div>
  )
}
