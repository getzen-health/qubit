// Downhill Skiing Science — static server component
// Evidence-based guide covering biomechanics, physiology, injury science,
// and training science for alpine / downhill skiing.

export const metadata = { title: 'Downhill Skiing Science' }

// ─── Fonts ────────────────────────────────────────────────────────────────────

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;600;800&display=swap'

// ─── CSS Variables & Theme ────────────────────────────────────────────────────
// --ski-navy:  #0a1628   (deep navy background panels)
// --ski-ice:   #a8d8ea   (soft ice blue accent)
// --ski-sky:   #00b4ff   (electric sky blue — primary accent)
// --ski-snow:  #f0f7ff   (near-white snow text)
// --ski-dark:  #050d18   (page background)

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '140 km/h',
    label: 'Downhill Top Speed',
    sub: 'Elite downhill racers; Kitzbühel Hahnenkamm peak speed',
    accent: '#00b4ff',
  },
  {
    value: '3–4 G',
    label: 'Turn G-Forces',
    sub: 'Peak centripetal force in GS turns (Müller 2000)',
    accent: '#a8d8ea',
  },
  {
    value: '3.5–4.5×',
    label: 'Leg Press Bodyweight',
    sub: 'Elite alpine skier leg press standard (Neumayr 2003)',
    accent: '#00b4ff',
  },
  {
    value: '35–40%',
    label: 'ACL Share of Injuries',
    sub: 'FIS injury surveillance — alpine competition (Bere 2014)',
    accent: '#a8d8ea',
  },
]

// ─── Race Duration Chart ──────────────────────────────────────────────────────

const RACE_DURATIONS = [
  { discipline: 'Slalom',       seconds: 55,  color: '#00b4ff' },
  { discipline: 'Giant Slalom', seconds: 90,  color: '#0096d6' },
  { discipline: 'Super-G',      seconds: 110, color: '#007aad' },
  { discipline: 'Downhill',     seconds: 125, color: '#005f87' },
]

const MAX_DURATION = 125

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'biomechanics',
    title: 'Biomechanics & Force Production',
    accent: '#00b4ff',
    accentBg: 'rgba(0,180,255,0.07)',
    accentBorder: 'rgba(0,180,255,0.22)',
    accentPill: 'rgba(0,180,255,0.14)',
    iconSymbol: '⛷',
    iconColor: '#7dd3fc',
    findings: [
      {
        citation: 'Müller 2000 — J Appl Biomech + Raschner 2013 — Scand J Med Sci Sports',
        detail:
          'Carving turns in giant slalom generate peak centripetal forces of 3–4 G at maximum loading. Skiers maintain edge angles of 65–75° to maximise lateral force production. Speed ranges vary widely by discipline: 80–140 km/h in downhill, 40–60 km/h in slalom. Knee joint loading reaches 5–7× body weight during high-speed carved turns, making this one of the highest joint-load sports in recreational and competitive settings. Elite slalom racers complete gate-to-gate cycles in 0.3–0.5 s — pole timing initiates upper-body counter-rotation while hip angulation keeps CoM inside the arc. Edge-to-edge transition time < 0.15 s discriminates elite from sub-elite racers.',
        stat: 'GS turns: 3–4 G centripetal; knee load 5–7× BW; edge transition < 0.15 s in elite slalom',
      },
      {
        citation: 'Hintermeister 1997 — Med Sci Sports Exerc',
        detail:
          'VMO and VL (vastus medialis oblique and vastus lateralis) demonstrate highest activation during edge control and turn initiation — up to 80–100% MVC during dynamic carving. The tuck position requires sustained isometric contraction at 30–60% MVC, generating muscular fatigue across a run through glycolytic demand. The hip-knee-ankle kinetic chain requires coordinated eccentric control from gluteus maximus through tibialis anterior. Fatigue-driven technique breakdown in the final gates of a slalom run is a primary mechanism for ACL-loading falls, as eccentric quad capacity is depleted.',
        stat: 'VMO/VL: 80–100% MVC during carving; tuck: sustained 30–60% MVC isometric',
      },
      {
        citation: 'Raschner 2013 — Scand J Med Sci Sports (elite slalom kinematics)',
        detail:
          'Hip counter-rotation — the separation between upper body (facing downhill) and lower body (facing across slope) — reduces rotational inertia and is a key discriminator of elite technique. Body angulation (lateral inclination toward the slope) maintains balance during high-speed turns by keeping the combined CoM-to-ski vector aligned with resultant force. At 50 km/h in GS, a 1° reduction in edge angle reduces centripetal force by ~8%, directly slowing the turn arc and adding time. Video analysis of hip and knee joint angles during course inspection previews is now standard in elite programmes.',
        stat: 'Hip counter-rotation reduces rotational inertia; 1° edge angle loss = ~8% centripetal force reduction',
      },
      {
        citation: 'Brodie 2008 — Sports Technol (aerodynamic analysis of alpine skiing)',
        detail:
          'A fully crouched downhill tuck reduces the drag coefficient area (CdA) by 40–50% compared to upright skiing. At 130 km/h, drag force in tuck ≈ 30–40 N versus 60–80 N upright, translating directly to a 10–15 km/h speed differential over a flat section. Optimal tuck geometry: arms extended forward parallel to skis, back flat and horizontal, knees at approximately 90°, helmet chin resting on hands. Micro-variations in tuck posture — hand position, helmet chin-bar angle, suit compression — produce measurable time differences over a 2-minute downhill course. Aerodynamic testing in wind tunnels is now routine for World Cup downhill equipment.',
        stat: 'Full tuck vs upright: CdA reduced 40–50%; equivalent to 10–15 km/h speed gain at 130 km/h',
      },
    ],
  },
  {
    id: 'physiology',
    title: 'Physiological Demands',
    accent: '#a8d8ea',
    accentBg: 'rgba(168,216,234,0.07)',
    accentBorder: 'rgba(168,216,234,0.22)',
    accentPill: 'rgba(168,216,234,0.14)',
    iconSymbol: '♥',
    iconColor: '#bae6fd',
    findings: [
      {
        citation: 'Hydren 2013 — J Strength Cond Res (alpine ski racer physiology review)',
        detail:
          'World Cup alpine skiers average VO₂max 58–68 mL/kg/min (male) and 52–60 mL/kg/min (female). Aerobic demands are highest not in single races but across the repetitive training volume of 60–90 s runs. Blood lactate peaks at 8–12 mmol/L post-slalom and 5–8 mmol/L post-downhill, reflecting higher glycolytic demand in technical disciplines due to repeated high-intensity muscular contractions with limited recovery. Aerobic base fitness (VO₂max) determines capacity for high-volume training and influences lactate clearance between training gates.',
        stat: 'Elite VO₂max: 58–68 mL/kg/min; blood lactate post-slalom 8–12 mmol/L vs 5–8 mmol/L downhill',
      },
      {
        citation: 'Ferguson 2014 — Int J Sports Physiol Perform (alpine race HR kinetics)',
        detail:
          'Race HR reaches 85–95% HRmax within the first 10 seconds of slalom (total race duration 45–60 s) and remains elevated throughout. Anaerobic contribution dominates slalom: PCr + glycolytic pathways supply approximately 65% of total energy. Downhill (100–125 s) shifts toward ~50% aerobic contribution as duration increases. Super-G (100–115 s) and GS (70–90 s) fall between these extremes. Post-race phosphocreatine depletion occurs within 10 s of maximal muscular effort; glycolytic rate then determines whether maximal force can be sustained across the full run.',
        stat: 'Slalom HR: 85–95% HRmax in 45–60 s; PCr + glycolytic ~65% of energy in slalom',
      },
      {
        citation: 'Castellani 2006 — Compr Physiol (cold exposure physiology)',
        detail:
          'Sustained exposure to temperatures of −5°C to −20°C on alpine courses increases resting metabolic rate 10–20% via shivering thermogenesis, competing with exercise metabolism for substrate. Muscle temperature at the start gate may be 2–4°C below the functional optimum of 37°C, reducing maximal force output 5–10% and slowing cross-bridge cycling rate. Cold-induced vasoconstriction reduces blood flow to active muscle, impairing lactate clearance and accelerating local fatigue. A race-ready warm-up protocol in cold conditions requires 25–35 min to achieve adequate muscle temperatures — far longer than warm-weather sport.',
        stat: 'Cold: metabolic rate +10–20%; muscle Temp −2–4°C at start gate → −5–10% max force output',
      },
      {
        citation: 'Gore 2001 — J Appl Physiol (altitude and aerobic performance)',
        detail:
          'Most FIS World Cup alpine venues sit at 1,500–2,500 m above sea level — Kitzbühel 800 m, Val Gardena 2,250 m, Bormio 2,230 m, Wengen 1,274 m. VO₂max is reduced approximately 5–10% per 1,000 m elevation gain above 1,500 m. Anaerobic power is relatively preserved at these altitudes, but aerobic recovery between training runs is impaired. SpO₂ typically falls to 93–96% at 2,000 m during rest, lower during maximal effort. Full acclimatisation takes 2–3 weeks; meaningful functional adaptation occurs in 5–7 days. World Cup teams schedule altitude training camps in summer to gain acclimatisation advantage.',
        stat: 'Venues at 1,500–2,500 m: VO₂max reduced ~5–10% per 1,000 m; SpO₂ 93–96% at 2,000 m',
      },
    ],
  },
  {
    id: 'injury',
    title: 'Injury Science & Prevention',
    accent: '#00b4ff',
    accentBg: 'rgba(0,180,255,0.07)',
    accentBorder: 'rgba(0,180,255,0.22)',
    accentPill: 'rgba(0,180,255,0.14)',
    iconSymbol: '✚',
    iconColor: '#7dd3fc',
    findings: [
      {
        citation: 'Bere 2014 — Br J Sports Med (FIS injury surveillance, alpine competition)',
        detail:
          'ACL rupture represents 35–40% of all competitive alpine skiing injuries in FIS longitudinal surveillance data. Two primary mechanisms dominate: the "phantom foot" (boot-induced ACL mechanism — hip flexed, knee twisted inward as ski tip catches snow during backward fall, creating combined anterior tibial shear and internal rotation) and catching an inside edge (sudden dynamic valgus during course exit). Standard binding release systems are calibrated for lateral edge-catch forces but may not release in the phantom-foot mechanism. ACL incidence: 8–10 per 1,000 ski-days in alpine competition — 3–5× higher than recreational skiing.',
        stat: 'ACL = 35–40% of alpine competition injuries; 8–10 per 1,000 ski-days; phantom foot primary mechanism',
      },
      {
        citation: 'Sulheim 2006 — JAMA (helmet use in alpine skiing and snowboarding)',
        detail:
          'Helmet use in skiing reduces head injury risk by 60% and severe head injury risk by 72% in this JAMA study of 3,277 injured skiers and snowboarders. MIPS (Multi-directional Impact Protection System) technology reduces rotational acceleration transmitted to the brain by 25–40% in oblique impacts — the most common vector in ski falls. Gate contact forces in slalom can reach up to 3 kN; impact velocities in high-speed falls: 15–25 m/s. FIS mandated helmet use across all alpine disciplines from 2000, reducing head injury incidence by approximately 50% in the following decade.',
        stat: 'Helmet: −60% head injury risk; MIPS reduces rotational acceleration 25–40%; gate contact up to 3 kN',
      },
      {
        citation: 'Ettlinger 1995 — Am J Sports Med + Deibert 1998 (boot and alignment)',
        detail:
          'Dynamic knee valgus during skiing emerges from boot stiffness mismatches, footbed alignment deficits, and fatigue-related technique breakdown. Custom orthotics and precision insole alignment correct hindfoot pronation, which contributes to valgus collapse inside the ski boot shell. Proprioceptive training using ski-specific balance boards and wobble discs improves joint position sense in ski boot conditions. Skiers with > 5° resting valgus alignment have 2.3× higher ACL injury risk. Boot flex stiffness that is too high for a skier\'s body weight and strength profile increases proximal tibial forces transmitted to the knee.',
        stat: 'Resting valgus >5°: 2.3× ACL risk; custom orthotics correct hindfoot pronation; boot stiffness critical',
      },
      {
        citation: 'Spörri 2012 — Br J Sports Med (dryland training injury in alpine skiers)',
        detail:
          'Injury incidence during pre-season off-snow dryland training is 3.0–3.5× higher than during the on-snow competition season. High-intensity plyometric protocols (box jumps, depth jumps), maximal gym strength sessions, and early-season agility drills carry disproportionate ACL and lower-limb injury risk when sport-specific neuromuscular patterns have not yet been reactivated after off-season. Progressive gym-to-snow transfer — starting with low-impact movement patterns (slide board, lateral hops, slalom simulation) before adding plyometric loads — substantially reduces this elevated pre-season injury rate. Adequate recovery time between plyometric sessions (48–72 h) is critical during the high-volume pre-season block.',
        stat: 'Pre-season dryland: 3–3.5× higher injury incidence than on-snow season; phased loading essential',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training Science & Performance',
    accent: '#a8d8ea',
    accentBg: 'rgba(168,216,234,0.07)',
    accentBorder: 'rgba(168,216,234,0.22)',
    accentPill: 'rgba(168,216,234,0.14)',
    iconSymbol: '◈',
    iconColor: '#bae6fd',
    findings: [
      {
        citation: 'Neumayr 2003 — J Strength Cond Res (strength profiling in alpine skiing)',
        detail:
          'Elite alpine skiers demonstrate leg press 1RM of 3.5–4.5× body weight; recreational skiers average 1.5–2.5×. Eccentric strength — specifically the quad eccentric-to-concentric ratio > 1.3 — is more predictive of slalom performance than concentric strength alone, reflecting the dominant eccentric loading pattern of turns. Inter-limb asymmetry greater than 15% between dominant and non-dominant legs predicts significantly elevated injury risk. Hip abductor and lateral core strength are underappreciated determinants of edge control and lateral force production during carved turns — often neglected relative to quadriceps-focused training.',
        stat: 'Elite leg press: 3.5–4.5× BW; eccentric:concentric ratio >1.3; asymmetry >15% → injury risk↑',
      },
      {
        citation: 'Behm 2005 — Can J Appl Physiol + FIS athlete conditioning guidelines',
        detail:
          'World Cup alpine programmes prescribe 200–250 hours of structured dryland conditioning before first on-snow contact of the season. Key training components: plyometric lateral hops simulating slalom edge-to-edge transitions (developed through progressive loading over 8 weeks), slide board training for lateral power and movement coordination, slalom pole simulation runs in dryland, multi-angle video analysis sessions reviewing prior-season race footage, and progressive strength loading targeting eccentric quad strength. The 6-month pre-season is typically structured in three phases: general fitness and aerobic base (months 1–2), sport-specific strength and eccentric development (months 3–4), and power and speed conversion (months 5–6).',
        stat: '200–250 hours dryland before snow; 3-phase programme: aerobic base → strength → power/speed',
      },
      {
        citation: 'Vealey 2007 — Adv Sport Psychol + Gallwey 2003 mental skills research',
        detail:
          'Systematic mental rehearsal reduces technical error rate during alpine races by 12–18%. Course inspection and mental imagery — where skiers physically walk the course pre-race while mentally rehearsing every gate, turn radius, and terrain feature — allows pre-programming of movement sequences in motor cortex prior to execution. Arousal management in the start gate using controlled breathing (4-7-8 pattern: 4 s inhale, 7 s hold, 8 s exhale) reduces pre-race cortisol surge by approximately 15%, preserving optimal arousal for performance. Elite World Cup skiers spend 10–15 minutes in structured active imagery before race starts; pre-race routines are individually calibrated over years of competition.',
        stat: 'Visualization: −12–18% error rate; start-gate breathing routine reduces pre-race cortisol ~15%',
      },
      {
        citation: 'Nachbauer 2016 — Procedia Eng (ski preparation and wax science)',
        detail:
          'Ski preparation science produces measurable speed differentials of 0.5–1.5% from base preparation and waxing alone — translating to 0.3–1.8 seconds over a 2-minute downhill course, the difference between medal and no-points finishes. Temperature-specific fluorocarbon wax selection is critical: cold wax (< −10°C), warm wax (> −4°C), or universal (−4° to −10°C). Base structure — the micro-groove pattern pressed or ground into the ski base — optimises the water film management at the ski-snow interface by managing suction in wet snow and reducing friction in dry snow. Edge sharpness (1°–3° side bevel angle) determines carving precision and grip on hard-packed FIS course surfaces. Each World Cup team employs 3–6 dedicated servicemen per athlete.',
        stat: 'Wax/prep: 0.5–1.5% speed differential = 0.3–1.8 s per run; temperature-specific wax critical',
      },
    ],
  },
]

// ─── Component Functions ──────────────────────────────────────────────────────

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
        background: '#0a1628',
        border: '1px solid #0d2040',
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
          fontWeight: 800,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: "'Saira Condensed', ui-sans-serif, sans-serif",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e0f0ff', margin: '8px 0 4px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#3a5a7a', margin: 0, lineHeight: 1.45 }}>{sub}</p>
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
    <div style={{ padding: '16px 18px', borderBottom: '1px solid #0d1e33' }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#4a7a9b',
          margin: '0 0 7px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontFamily: "'Saira Condensed', ui-monospace, monospace",
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#b8d4e8', margin: '0 0 11px', lineHeight: 1.65 }}>{detail}</p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: "'Saira Condensed', ui-monospace, monospace",
          background: '#060f1c',
          border: `1px solid ${accent}22`,
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
        background: '#0a1628',
        border: '1px solid #0d2040',
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
              lineHeight: 1,
            }}
          >
            {iconSymbol}
          </span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f7ff', margin: 0 }}>{title}</h2>
      </div>

      {/* Findings */}
      {findings.map((f, i) => (
        <FindingRow key={i} {...f} accent={accent} />
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DownhillSkiingSciencePage() {
  return (
    <>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_URL} rel="stylesheet" />

      <div
        style={{
          minHeight: '100vh',
          background: '#050d18',
          color: '#f0f7ff',
          fontFamily: "'Saira Condensed', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(160deg, #0a1e3a 0%, #050d18 60%)',
            borderBottom: '1px solid #0d2040',
            padding: '48px 24px 36px',
            overflow: 'hidden',
          }}
        >
          {/* Mountain SVG decoration */}
          <svg
            viewBox="0 0 600 200"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '55%',
              maxWidth: 420,
              opacity: 0.18,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {/* Mountain range silhouette */}
            <polyline
              points="0,200 80,110 160,155 260,40 340,95 420,20 500,80 600,60 600,200"
              fill="none"
              stroke="#a8d8ea"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Snow caps */}
            <polyline
              points="220,65 260,40 300,62"
              fill="none"
              stroke="#f0f7ff"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polyline
              points="395,36 420,20 448,42"
              fill="none"
              stroke="#f0f7ff"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Ski run line cutting down the main peak */}
            <path
              d="M 262 42 C 275 58 285 72 292 95 C 298 115 295 130 310 155 C 320 172 335 182 350 196"
              fill="none"
              stroke="#00b4ff"
              strokeWidth="2"
              strokeDasharray="6 3"
              strokeLinecap="round"
            />
            {/* Skier dot at top of run */}
            <circle cx="262" cy="42" r="4" fill="#00b4ff" opacity="0.9" />
          </svg>

          {/* Back link */}
          <a
            href="/workouts"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#4a7a9b',
              textDecoration: 'none',
              marginBottom: 20,
              fontWeight: 600,
              letterSpacing: '0.2px',
            }}
          >
            <span style={{ fontSize: 16 }}>←</span> Workouts
          </a>

          {/* Title block */}
          <div style={{ maxWidth: 560, position: 'relative' }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '2px',
                color: '#00b4ff',
                margin: '0 0 10px',
                textTransform: 'uppercase',
              }}
            >
              Sports Science
            </p>
            <h1
              style={{
                fontSize: 'clamp(34px, 6vw, 52px)',
                fontWeight: 800,
                color: '#f0f7ff',
                margin: '0 0 14px',
                lineHeight: 1.08,
                letterSpacing: '-0.5px',
              }}
            >
              Downhill Skiing
              <br />
              <span style={{ color: '#00b4ff' }}>Science</span>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#6a9ab8',
                margin: 0,
                lineHeight: 1.6,
                maxWidth: 460,
              }}
            >
              Alpine skiing biomechanics, force production, physiological demands, injury
              epidemiology, and evidence-based training science for all disciplines.
            </p>
          </div>
        </div>

        {/* ── Key Stats Grid ────────────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '32px 20px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {KEY_STATS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </div>

        {/* ── Race Duration Chart ───────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '28px 20px 0',
          }}
        >
          <div
            style={{
              background: '#0a1628',
              border: '1px solid #0d2040',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Chart header */}
            <div
              style={{
                borderBottom: '1px solid #0d2040',
                borderLeft: '3px solid #00b4ff',
                background: 'rgba(0,180,255,0.06)',
                padding: '14px 20px',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f7ff', margin: 0 }}>
                Race Duration by Discipline
              </h2>
              <p style={{ fontSize: 12, color: '#3a5a7a', margin: '3px 0 0' }}>
                Approximate single-run race durations — FIS World Cup competition
              </p>
            </div>

            {/* Horizontal bar chart */}
            <div style={{ padding: '20px 22px' }}>
              {RACE_DURATIONS.map((row) => {
                const pct = (row.seconds / MAX_DURATION) * 100
                return (
                  <div key={row.discipline} style={{ marginBottom: 16 }}>
                    {/* Label row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                        alignItems: 'baseline',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#c8e4f4',
                          letterSpacing: '0.3px',
                        }}
                      >
                        {row.discipline}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: row.color,
                          fontFamily: "'Saira Condensed', ui-monospace, monospace",
                          letterSpacing: '0.2px',
                        }}
                      >
                        {row.seconds} s
                      </span>
                    </div>

                    {/* Bar track */}
                    <div
                      style={{
                        height: 18,
                        background: '#060f1c',
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #0d1e33',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${row.color}cc, ${row.color})`,
                          borderRadius: 4,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* X-axis labels */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                {[0, 25, 50, 75, 100, 125].map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 10,
                      color: '#2a4a62',
                      fontFamily: "'Saira Condensed', ui-monospace, monospace",
                    }}
                  >
                    {s}s
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Science Cards ─────────────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '28px 20px 60px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid #0d2040',
            padding: '24px 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 11, color: '#243d54', margin: 0, lineHeight: 1.6 }}>
            References: Müller 2000 J Appl Biomech · Hintermeister 1997 Med Sci Sports Exerc ·
            Raschner 2013 Scand J Med Sci Sports · Brodie 2008 Sports Technol · Hydren 2013 J
            Strength Cond Res · Ferguson 2014 Int J Sports Physiol Perform · Castellani 2006 Compr
            Physiol · Gore 2001 J Appl Physiol · Bere 2014 Br J Sports Med · Sulheim 2006 JAMA ·
            Ettlinger 1995 Am J Sports Med · Spörri 2012 Br J Sports Med · Neumayr 2003 J Strength
            Cond Res · Behm 2005 Can J Appl Physiol · Vealey 2007 · Nachbauer 2016 Procedia Eng
          </p>
        </div>
      </div>
    </>
  )
}
