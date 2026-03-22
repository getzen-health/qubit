// Curling Science — static server component
// Evidence-based guide covering stone delivery biomechanics, sweeping science,
// ice physics, and strategy/psychology for curling.

export const metadata = { title: 'Curling Science' }

// ─── Fonts ────────────────────────────────────────────────────────────────────

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'

// ─── CSS Variables & Theme ────────────────────────────────────────────────────
// --curl-dark:    #050d1a   (page background)
// --curl-ice:     #e0f2fe   (near-white ice text)
// --curl-blue:    #0284c7   (primary accent)
// --curl-granite: #64748b   (muted granite grey)
// --curl-glow:    #38bdf8   (bright cyan accent)

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '85–95%',
    label: 'Elite Shot Accuracy',
    sub: 'World Curling Tour top skips (Gushue, Edin) — full season percentage',
    accent: '#38bdf8',
  },
  {
    value: '3–4 ft',
    label: 'Sweeping Stone Gain',
    sub: 'Distance added by vigorous sweeping — WCF research (0.9–1.2 m)',
    accent: '#0284c7',
  },
  {
    value: '0.01',
    label: 'Friction Coefficient',
    sub: 'Stone on pebbled ice — among the lowest of any sport surface',
    accent: '#38bdf8',
  },
  {
    value: '50–60',
    label: 'Strategic Decisions/Game',
    sub: 'Major skip decisions per game — shot selection, weight, line',
    accent: '#0284c7',
  },
]

// ─── Delivery Velocity Chart ──────────────────────────────────────────────────

const SHOT_VELOCITIES = [
  { shot: 'Guard weight',   velocity: 2.1, color: '#0284c7' },
  { shot: 'Draw weight',    velocity: 2.3, color: '#0ea5e9' },
  { shot: 'Hit weight',     velocity: 2.8, color: '#38bdf8' },
  { shot: 'Peel weight',    velocity: 3.1, color: '#7dd3fc' },
]

const MAX_VELOCITY = 3.5

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'delivery',
    title: 'Stone Delivery Biomechanics',
    accent: '#38bdf8',
    accentBg: 'rgba(56,189,248,0.07)',
    accentBorder: 'rgba(56,189,248,0.22)',
    accentPill: 'rgba(56,189,248,0.14)',
    iconSymbol: '◉',
    iconColor: '#7dd3fc',
    findings: [
      {
        citation: 'Penrose 1996 — curling biomechanics (hack delivery velocity)',
        detail:
          'Delivery mechanics from the hack involve leg drive from the dominant foot, hip extension, upper body glide phase, and a precisely timed release that determines where the stone finishes (house vs. blank end). Release velocity is the primary determinant of shot outcome: draw weight 2.2–2.5 m/s for reaching the house; guard weight 2.0–2.2 m/s for placement short of the house; takeout weight 2.6–3.2 m/s for removing opponent stones. Elite players control release velocity within ±0.1 m/s — a window of approximately 4% — through developed kinaesthetic sensitivity over thousands of deliveries.',
        stat: 'Draw: 2.2–2.5 m/s · Guard: 2.0–2.2 m/s · Takeout: 2.6–3.2 m/s',
      },
      {
        citation: 'World Curling Federation — stone specifications + Magnus effect (rotation physics)',
        detail:
          'Stone rotation mechanics (in-turn and out-turn) create path curvature through the Magnus effect — differential air pressure across the rotating stone interacts with directional friction from the pebbled ice to deflect the path 0.3–0.5 m off the centre line over 28.35 m of travel. The stone completes 2–4 full rotations across the sheet. Pebble texture on ice creates asymmetric friction between the leading and trailing edges of the 6 mm wide running band. WCF maximum stone weight: 19.96 kg (44 lbs). Path curves most sharply in the final 5–8 m as the stone decelerates and velocity-dependent friction increases.',
        stat: 'Path curl: 0.3–0.5 m off centre line; 2–4 rotations over 28.35 m; stone max 19.96 kg',
      },
      {
        citation: 'Biomechanics of curling delivery — slide mechanics (kinesiology studies)',
        detail:
          'The slide delivery requires centre of gravity precisely over the sliding foot (slider shoe on non-dominant foot with friction coefficient ~0.02), broom stabilisation in the non-throwing hand, and trunk forward lean of 20–30° to maintain balance and control the stone release. The glide phase extends 8–12 m from the hack foot to the release point near the hog line. Studies comparing slide delivery to standing delivery (common in adaptive and older players) show slide delivery improves release velocity consistency by 12–18% due to reduced vertical movement during the release window.',
        stat: 'Slide glide: 8–12 m; trunk lean 20–30°; slider friction ~0.02; +12–18% velocity consistency vs standing',
      },
      {
        citation: 'World Curling Tour — shot percentage statistics (Gushue, Edin, multiple seasons)',
        detail:
          'Shot percentage is the gold standard competitive metric in curling, tracked by WCT scoring officials. Each shot is scored 0–4: 4 = perfect execution, 0 = complete miss. Elite skips Brad Gushue (Canada) and Niklas Edin (Sweden) routinely exceed 88% shot percentage across full competitive seasons. Teams with skip percentages above 90% win more than 75% of competitive games. Shot percentage accounts for both weight accuracy (velocity at release) and line accuracy (handle angle and direction); both components contribute equally to missed shots at the top level.',
        stat: 'Elite shot %: 85–95%; Gushue/Edin routinely >88%; teams >90% skip % win >75% of games',
      },
    ],
  },
  {
    id: 'sweeping',
    title: 'Sweeping Science',
    accent: '#0284c7',
    accentBg: 'rgba(2,132,199,0.07)',
    accentBorder: 'rgba(2,132,199,0.22)',
    accentPill: 'rgba(2,132,199,0.14)',
    iconSymbol: '〰',
    iconColor: '#38bdf8',
    findings: [
      {
        citation: 'World Curling Federation research — sweeping friction and stone trajectory',
        detail:
          'Vigorous sweeping reduces the friction coefficient between the stone running band and ice pebble tops by 15–20%, generating sufficient heat (5–8°C locally above ambient ice temperature of −5 to −3°C) to transiently melt pebble surfaces into a thin water film. This reduction adds 0.9–1.2 m of distance (approximately 3–4 feet) and reduces curl deviation by 0.3–0.6 m (approximately 1–2 feet). Sweeper downward force: 15–30 kg applied through the broom head. Skilled skip communication — "hurry hard" (maximum intensity) vs. "clean" (light sweeping) vs. "off" (no sweeping) — allows trajectory correction during the final 15 m of stone travel.',
        stat: 'Sweeping: +0.9–1.2 m distance, −0.3–0.6 m curl; friction reduced 15–20%; 15–30 kg downward force',
      },
      {
        citation: 'Exercise physiology of competitive curling — sweeping metabolic demands',
        detail:
          'Vigorous sweeping bursts push heart rate to 85–92% HRmax in 8–12 s of maximum effort. Blood lactate accumulates to 3–5 mmol/L after multiple consecutive sweeping efforts within a single end — approaching the lactate threshold for many recreational players. Total sweeping distance per game: 2–4 km across 8–10 ends for lead and second players who sweep every stone. Muscular demands are primarily on the anterior deltoid, trapezius, and erector spinae. Recovery between sweeping bursts (30–90 s) is generally sufficient to allow partial lactate clearance, preventing severe fatigue accumulation across a game.',
        stat: 'Peak sweeping: 85–92% HRmax in 8–12 s; blood lactate 3–5 mmol/L; 2–4 km total sweeping distance',
      },
      {
        citation: 'WCF equipment ruling 2016 — directional broom controversy and ban',
        detail:
          'In the 2015–2016 competitive season, directional fabric broom pads — broom heads with a smooth, oriented fabric surface — emerged among elite teams. These pads allowed sweepers to steer the stone\'s path with unprecedented precision by applying asymmetric friction regardless of the delivery rotation, effectively making curl a sweeping decision rather than a delivery decision. The WCF banned directional pads after one season, mandating brush-only heads with natural or manufactured hair that limits asymmetric friction application. The ruling preserved the fundamental balance between delivery precision and sweeping influence that defines curling strategy.',
        stat: 'Directional pads banned 2016 — too precisely controlled curl; brush-only heads mandatory for competition',
      },
      {
        citation: 'Caloric expenditure and HR monitoring in competitive curling (game physiology)',
        detail:
          'Overall match heart rate averages 55–70% HRmax across a full game, substantially below sweeping peaks, due to extended strategy, communication, and walking phases between deliveries. Skip and vice-skip positions average 55–65% HRmax; lead and second 60–70% HRmax. Walking distance: 2–3 km per game in skip position, 3–4 km for lead. Total caloric expenditure: 300–450 kcal/game. These values classify curling as moderate-intensity aerobic activity overall, with meaningful cardiovascular and caloric benefit despite its reputation as a low-exertion sport — primarily due to the cumulative sweeping load across 8–10 ends.',
        stat: 'Match avg: 55–70% HRmax; 300–450 kcal/game; 2–4 km walking; skip 55–65%, lead 60–70% HRmax',
      },
    ],
  },
  {
    id: 'ice-physics',
    title: 'Ice Science & Stone Physics',
    accent: '#38bdf8',
    accentBg: 'rgba(56,189,248,0.07)',
    accentBorder: 'rgba(56,189,248,0.22)',
    accentPill: 'rgba(56,189,248,0.14)',
    iconSymbol: '❄',
    iconColor: '#bae6fd',
    findings: [
      {
        citation: 'Curling ice preparation science — pebbling technique and tribology',
        detail:
          'Curling ice pebbling creates 1–2 mm raised hemispherical water droplets on the ice surface using pressurised warm water spray in controlled passes by the ice technician. The stone\'s running band (6 mm wide annular contact ring on the bottom of the stone) contacts only the tops of these pebbles, reducing true contact area by approximately 90% compared to flat ice. This produces an extremely low friction coefficient of 0.01–0.03. Consistent pebble height across the full 42.07 m sheet is the central challenge in ice preparation; temperature variations of ±0.5°C at surface level alter pebble melt rate and stone behaviour measurably.',
        stat: 'Pebbles: 1–2 mm height; contact area reduced ~90%; friction coefficient 0.01–0.03',
      },
      {
        citation: 'Shegelski 2016 — physics of curling stone curl (scratching vs pressure melting)',
        detail:
          'Two competing physical models have been proposed to explain why rotating curling stones curl in the direction of rotation (counter to intuitive expectations from classical mechanics). The pressure melting model argues asymmetric pressure on the running band creates a water film that lubricates the front of the stone more than the back. The micro-scratching model proposes the rotating running band scratches tiny grooves into the pebble tops in a directional pattern, creating asymmetric friction that steers the stone. Experimental evidence from high-speed video, force measurement, and surface analysis supports the scratching model. A key observable prediction: stone speed affects curl magnitude (faster stones curl less) — consistent with the scratching but not pressure-melting model.',
        stat: 'Scratching model supported: faster stones curl less (velocity-dependent friction); scratches steer path',
      },
      {
        citation: 'Ailsa Craig granite — material science and stone manufacturing',
        detail:
          'Ailsa Craig micro-granite from the eponymous volcanic plug island off the Ayrshire coast of Scotland is the defining stone material for competition curling. Its properties: water absorption < 0.1% (minimising ice adhesion), Mohs hardness 6–7 (preventing chipping on pebble contacts), and thermal conductivity that maintains stable running band temperature during play. Approximately 90% of stones used at Olympic and World Championship level come from Ailsa Craig granite. Each finished stone costs $700–$900 USD and lasts decades with professional maintenance — periodic running band polishing and handle replacement. The island\'s quarry is periodically closed; international stockpiles buffer supply.',
        stat: '90% of Olympic stones: Ailsa Craig granite; water absorption <0.1%; $700–$900/stone; decades lifespan',
      },
      {
        citation: 'WCF hog line violation detection — electronic sensor system (implemented 2002)',
        detail:
          'The WCF hog line violation detection system embeds a piezoelectric sensor in the stone handle that detects the precise moment all fingers leave the handle. The rules require the stone to be fully released before its leading edge crosses the near hog line (6.401 m from the centre line). The electronic system — displaying green (legal) or red (violation) on an LED in the handle — replaced line judges in all world-level competition in 2002. Error rate is less than 0.1% per stone delivery. A violation results in immediate removal of the stone from play. The system eliminated contentious judgment calls that previously affected high-stakes game outcomes.',
        stat: 'Electronic hog sensors since 2002; <0.1% error rate; green = legal, red = violation → stone removed',
      },
    ],
  },
  {
    id: 'strategy',
    title: 'Strategy, Psychology & Fitness',
    accent: '#0284c7',
    accentBg: 'rgba(2,132,199,0.07)',
    accentBorder: 'rgba(2,132,199,0.22)',
    accentPill: 'rgba(2,132,199,0.14)',
    iconSymbol: '⬡',
    iconColor: '#38bdf8',
    findings: [
      {
        citation: 'Strategic decision-making in curling — Monte Carlo probability models in elite coaching',
        detail:
          'Curling is widely characterised as chess on ice: the skip makes 50–60 major strategic decisions per game, averaging 5–7 per end. Decision variables include current score differential, end number (of 8–10 total), hammer possession, estimated shot percentage for each option, prevailing ice conditions (pebble wear patterns, sheet curl variation), and opponent tendencies. Monte Carlo probability simulations are now used in elite Canadian and European coaching programmes to calculate expected-point values for competing shot options — particularly for decisions at score margins of ±1 or ±2 with multiple ends remaining.',
        stat: '50–60 strategic decisions/game; Monte Carlo modelling for shot selection at elite level',
      },
      {
        citation: 'Hammer advantage statistics — last-rock value in international curling',
        detail:
          'Quantitative analysis of international competition outcomes demonstrates that possessing the hammer (last rock) in an end generates an expected scoring advantage of 0.8 points compared to the non-hammer team. A steal — the non-hammer team scoring one or more points — represents a swing of approximately 1.8 expected points, making steal prevention the primary defensive objective when playing without the hammer. Blanking an end (deliberate zero score by both teams, hammer retained) is optimal when leading by 1–2 points in the final ends. Elite teams blank intentionally approximately 20–25% of ends during the last third of a game.',
        stat: 'Hammer worth +0.8 expected pts/end; steal = 1.8-pt swing; intentional blank optimal at lead of 1–2',
      },
      {
        citation: 'Elite curling conditioning — World Championship and Olympic programme design',
        detail:
          'Contemporary elite curling conditioning programmes address leg strength for hack drive power and slide stability, core stability for delivery balance and controlled rotation, and cardiovascular fitness for sweeping endurance across full 8–10 end games. World Championship and Olympic-level teams train 10–15 hours per week during Olympic preparation cycles — a substantial evolution from the sport\'s amateur-only past. Conditioning components include leg press and squat progressions, lateral movement drills for lead and second players, and aerobic base work (running, cycling) to support sweeping recovery. Recreational curling remains highly accessible and requires minimal baseline fitness.',
        stat: 'Olympic teams: 10–15 hrs/week training; leg strength, core stability, aerobic base for sweeping endurance',
      },
      {
        citation: 'Attentional focus in closed-skill sports — Wulf 2013 + pre-shot routine research',
        detail:
          'Pre-shot routine in elite curling: the skip surveys ice conditions, visualises the stone\'s intended path including curl and pebble wear adjustment, consults with the vice-skip on line and weight, and communicates the shot call within a 15–25 s window per delivery. Attentional focus research in closed-skill precision sports (Wulf 2013, J Motor Behav) consistently demonstrates that external focus on the target destination (the skip\'s broom at the release point, the intended resting position) outperforms internal focus on delivery mechanics. Top skips develop individually calibrated pre-shot routines over years of competition that sustain decision quality and maintain consistent delivery mechanics under high-pressure game conditions.',
        stat: 'External focus (target) > internal focus (mechanics); 15–25 s decision window; routine sustains accuracy',
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
        background: '#0b1a2e',
        border: '1px solid #0f2a44',
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
          fontWeight: 700,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: "'Poppins', ui-sans-serif, sans-serif",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe', margin: '8px 0 4px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#334f6a', margin: 0, lineHeight: 1.45 }}>{sub}</p>
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
    <div style={{ padding: '16px 18px', borderBottom: '1px solid #0f2036' }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#3a6080',
          margin: '0 0 7px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontFamily: "'Poppins', ui-monospace, monospace",
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#93c5d8', margin: '0 0 11px', lineHeight: 1.65 }}>{detail}</p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: accent,
          margin: 0,
          fontFamily: "'Poppins', ui-monospace, monospace",
          background: '#060e1c',
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
        background: '#0b1a2e',
        border: '1px solid #0f2a44',
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
              fontWeight: 700,
              color: iconColor,
              lineHeight: 1,
            }}
          >
            {iconSymbol}
          </span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e0f2fe', margin: 0 }}>{title}</h2>
      </div>

      {/* Findings */}
      {findings.map((f, i) => (
        <FindingRow key={i} {...f} accent={accent} />
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CurlingSciencePage() {
  return (
    <>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_URL} rel="stylesheet" />

      <div
        style={{
          minHeight: '100vh',
          background: '#050d1a',
          color: '#e0f2fe',
          fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(160deg, #071830 0%, #050d1a 65%)',
            borderBottom: '1px solid #0f2a44',
            padding: '48px 24px 36px',
            overflow: 'hidden',
          }}
        >
          {/* Curling house SVG — top-down view */}
          <svg
            viewBox="0 0 260 260"
            style={{
              position: 'absolute',
              bottom: -20,
              right: 20,
              width: 220,
              maxWidth: '38%',
              opacity: 0.22,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {/* Ice sheet background circle */}
            <circle cx="130" cy="130" r="124" fill="#0a1e38" stroke="#1a3a5a" strokeWidth="1" />
            {/* 12-foot ring (outermost — blue) */}
            <circle cx="130" cy="130" r="110" fill="none" stroke="#1e5a9a" strokeWidth="14" opacity="0.7" />
            {/* 8-foot ring (white) */}
            <circle cx="130" cy="130" r="82" fill="none" stroke="#d0e8f8" strokeWidth="14" opacity="0.6" />
            {/* 4-foot ring (red) */}
            <circle cx="130" cy="130" r="55" fill="none" stroke="#b91c1c" strokeWidth="14" opacity="0.75" />
            {/* Button (white centre) */}
            <circle cx="130" cy="130" r="28" fill="#e0f2fe" opacity="0.55" />
            {/* Centre dot */}
            <circle cx="130" cy="130" r="6" fill="#38bdf8" opacity="0.9" />
            {/* Tee line */}
            <line x1="6" y1="130" x2="254" y2="130" stroke="#3a6080" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />
            {/* Centre line */}
            <line x1="130" y1="6" x2="130" y2="254" stroke="#3a6080" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />
            {/* Curling stone in the button */}
            <circle cx="130" cy="130" r="16" fill="#1e3a5a" stroke="#38bdf8" strokeWidth="2.5" opacity="0.95" />
            {/* Stone handle */}
            <rect x="124" y="110" width="12" height="8" rx="3" fill="#38bdf8" opacity="0.9" />
            {/* Stone curl path arrow */}
            <path
              d="M 60 30 C 85 50 100 80 118 115"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="5 3"
              strokeLinecap="round"
              opacity="0.7"
            />
            {/* Arrow head */}
            <polygon points="113,108 125,112 116,120" fill="#38bdf8" opacity="0.7" />
          </svg>

          {/* Back link */}
          <a
            href="/workouts"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#3a6080',
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
                color: '#38bdf8',
                margin: '0 0 10px',
                textTransform: 'uppercase',
              }}
            >
              Sports Science
            </p>
            <h1
              style={{
                fontSize: 'clamp(34px, 6vw, 52px)',
                fontWeight: 700,
                color: '#e0f2fe',
                margin: '0 0 14px',
                lineHeight: 1.08,
                letterSpacing: '-0.5px',
              }}
            >
              Curling
              <br />
              <span style={{ color: '#38bdf8' }}>Science</span>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#4a7a9a',
                margin: 0,
                lineHeight: 1.6,
                maxWidth: 460,
              }}
            >
              Stone delivery biomechanics, sweeping physics, ice tribology, and the
              strategic psychology behind the sport of precision and patience.
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

        {/* ── Delivery Velocity Chart ───────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '28px 20px 0',
          }}
        >
          <div
            style={{
              background: '#0b1a2e',
              border: '1px solid #0f2a44',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Chart header */}
            <div
              style={{
                borderBottom: '1px solid #0f2a44',
                borderLeft: '3px solid #38bdf8',
                background: 'rgba(56,189,248,0.06)',
                padding: '14px 20px',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e0f2fe', margin: 0 }}>
                Release Velocity by Shot Type
              </h2>
              <p style={{ fontSize: 12, color: '#2a4a62', margin: '3px 0 0' }}>
                Hack release velocity (m/s) — elite delivery; higher velocity = greater distance
              </p>
            </div>

            {/* Horizontal bar chart */}
            <div style={{ padding: '20px 22px' }}>
              {SHOT_VELOCITIES.map((row) => {
                const pct = (row.velocity / MAX_VELOCITY) * 100
                return (
                  <div key={row.shot} style={{ marginBottom: 16 }}>
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
                          color: '#b0d4e8',
                          letterSpacing: '0.2px',
                        }}
                      >
                        {row.shot}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: row.color,
                          fontFamily: "'Poppins', ui-monospace, monospace",
                          letterSpacing: '0.2px',
                        }}
                      >
                        {row.velocity.toFixed(1)} m/s
                      </span>
                    </div>

                    {/* Bar track */}
                    <div
                      style={{
                        height: 18,
                        background: '#060e1c',
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #0f2036',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${row.color}bb, ${row.color})`,
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
                {[0, 0.7, 1.4, 2.1, 2.8, 3.5].map((v) => (
                  <span
                    key={v}
                    style={{
                      fontSize: 10,
                      color: '#1e3a52',
                      fontFamily: "'Poppins', ui-monospace, monospace",
                    }}
                  >
                    {v.toFixed(1)}
                  </span>
                ))}
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: '#1e3a52',
                  margin: '6px 0 0',
                  textAlign: 'right',
                  fontFamily: "'Poppins', ui-monospace, monospace",
                }}
              >
                m/s
              </p>
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
            borderTop: '1px solid #0f2a44',
            padding: '24px 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 11, color: '#1e3a52', margin: 0, lineHeight: 1.6 }}>
            References: Penrose 1996 (curling biomechanics) · Shegelski 2016 (physics of curling curl) ·
            World Curling Federation equipment regulations · WCF sweeping research · Wulf 2013
            J Motor Behav (attentional focus) · World Curling Tour shot percentage statistics ·
            Ailsa Craig granite material science · WCF hog line electronic detection system (2002)
          </p>
        </div>
      </div>
    </>
  )
}
