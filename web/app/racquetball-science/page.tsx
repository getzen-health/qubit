// Racquetball Science — static server component
// Evidence-based guide covering racquetball physics, biomechanics,
// physical demands, injury, and strategy science.

export const metadata = { title: 'Racquetball Science' }

// ─── Theme ─────────────────────────────────────────────────────────────────────
// Electric blue / neon green / dark court — fast, intense, enclosed
// CSS prefix: rb-
// Font: Saira (weights 400, 600, 800) — fast, condensed athletic

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '240 km/h',
    label: 'Back Wall Speed',
    sub: 'Ball speed off back wall in professional play — fastest in indoor racket sports',
    accent: '#0ea5e9',
  },
  {
    value: '82–92%',
    label: 'HRmax During Play',
    sub: 'Average heart rate intensity during competitive racquetball match',
    accent: '#22c55e',
  },
  {
    value: '4.0 km',
    label: 'Per Match Distance',
    sub: 'Court coverage per match including lateral shuffles and direction changes',
    accent: '#06b6d4',
  },
  {
    value: '#1',
    label: 'Eye Injury Sport Risk',
    sub: 'Racquetball has the highest eye injury rate of any sport — eyewear mandatory in USAR events',
    accent: '#0ea5e9',
  },
]

// ─── Ball Speed Chart Data ──────────────────────────────────────────────────────

const BALL_SPEED_DATA = [
  { surface: 'Off Front Wall (serve)', speed: 200, maxSpeed: 240, fill: '#1e3a5f' },
  { surface: 'Off Side Wall',          speed: 160, maxSpeed: 240, fill: '#0c4a6e' },
  { surface: 'Off Back Wall',          speed: 240, maxSpeed: 240, fill: '#0ea5e9' },
  { surface: 'Ceiling Shot',           speed: 80,  maxSpeed: 240, fill: '#164e63' },
]

// ─── Science Cards ──────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    icon: 'C',
    iconBg: 'rgba(14,165,233,0.15)',
    iconBorder: 'rgba(14,165,233,0.35)',
    iconColor: '#7dd3fc',
    title: 'The Fastest Indoor Racket Sport',
    accent: '#0ea5e9',
    accentBg: 'rgba(14,165,233,0.08)',
    accentBorder: 'rgba(14,165,233,0.22)',
    facts: [
      {
        citation: 'Ball Physics & Court Geometry',
        text: 'Racquetball ball physics: pressurised rubber ball, coefficient of restitution 0.95+, speed off front wall up to 200 km/h, off back wall 240+ km/h. Court dimensions 9.75×6.1×6.1 m (same width as squash but shorter). Professional player serve speed: 180–220 km/h.',
        stat: '240+ km/h off back wall',
      },
      {
        citation: '3D Court Geometry — All Surfaces Active',
        text: 'Unique racquetball court geometry enabling shots off all surfaces — back wall kills, ceiling shots (defensive lobs), pinch shots (front wall + side wall), Z-shots (front wall + far side wall). 3D spatial reasoning demands distinguish racquetball from every other indoor racket sport.',
        stat: 'All 4 walls + ceiling + floor in play',
      },
      {
        citation: 'Physiological Demands — Aerobic & Anaerobic',
        text: 'Aerobic demands of racquetball: HR 82–92% HRmax during match play, blood lactate 4–7 mmol/L, match duration 30–60 min, work:rest ratio 1:1 to 2:1. Less extreme than squash but more demanding than tennis. VO₂max requirement: 55–68 mL/kg/min for competitive play.',
        stat: 'VO₂max 55–68 mL/kg/min',
      },
      {
        citation: 'Movement Analysis — Court Coverage',
        text: 'Movement pattern analysis reveals 2.5–4.0 km per match with lateral shuffles, forward/backward explosiveness, ceiling ball defensive retreating, and drop-and-recover movement patterns. Direction changes every 2–4 seconds during rally play.',
        stat: '2.5–4.0 km per match',
      },
    ],
  },
  {
    icon: 'B',
    iconBg: 'rgba(6,182,212,0.15)',
    iconBorder: 'rgba(6,182,212,0.35)',
    iconColor: '#67e8f9',
    title: 'Biomechanics & Technique',
    accent: '#06b6d4',
    accentBg: 'rgba(6,182,212,0.08)',
    accentBorder: 'rgba(6,182,212,0.22)',
    facts: [
      {
        citation: 'Forehand Drive Mechanics',
        text: 'Racquetball forehand mechanics: contact at waist height for maximum power and control, wrist snap at 900–1,200°/s, backswing length, follow-through path. Lower contact point vs. squash due to lower court walls. Wrist snap contribution is proportionally higher than in tennis or squash due to the compact swing.',
        stat: 'Wrist snap: 900–1,200°/s',
      },
      {
        citation: 'Serve Biomechanics — Drive vs. Lob',
        text: 'Drive serve: explosive serve to Z-zone, jam serve to body — deception through similar preparation. Lob serve: high arc hitting side wall, pace change tactical use. Server\'s box positioning rules constrain body angles. Elite serve deception relies on delayed wrist pronation to disguise direction until 80–100 ms before contact.',
        stat: 'Serve speed: 180–220 km/h',
      },
      {
        citation: 'Kill Shot — The Ultimate Weapon',
        text: 'The kill shot — ball contacted low enough to roll out (not bounce, just roll) — is the ultimate offensive weapon. Requires precise contact at 15–18 cm height, steep downward swing plane, timing at apex of bounce or on-the-fly. Success rate: 40–60% even for experts. An ideal kill shot rolls 2–4 m before stopping.',
        stat: 'Contact height: 15–18 cm',
      },
      {
        citation: 'Back Wall Shot — Elite Differentiator',
        text: 'Back wall play — ball off back wall presenting as offensive opportunity — is the skill most differentiating intermediate from advanced racquetball players. Approach timing, court position, reading ball trajectory off rubber wall. Advanced players convert 70–80% of back wall set-ups into offensive attacks; intermediates convert only 25–35%.',
        stat: 'Expert conversion: 70–80%',
      },
    ],
  },
  {
    icon: 'P',
    iconBg: 'rgba(14,165,233,0.15)',
    iconBorder: 'rgba(14,165,233,0.35)',
    iconColor: '#7dd3fc',
    title: 'Physical Demands & Injury',
    accent: '#0ea5e9',
    accentBg: 'rgba(14,165,233,0.08)',
    accentBorder: 'rgba(14,165,233,0.22)',
    facts: [
      {
        citation: 'Eye Injuries — Mandatory Protective Eyewear',
        text: 'Protective eyewear is mandatory in USAR sanctioned events: racquetball ball can pass through eye socket (unlike the squash ball, which is too large to fit). Eye injury rate 75× higher in non-eyewear users. Polycarbonate lens requirement (rated to ASTM F803). History of serious injuries driving mandatory eyewear rules from the 1980s.',
        stat: 'Eye injury rate 75× without eyewear',
      },
      {
        citation: 'Shoulder — Rotator Cuff Loading Across Heights',
        text: 'Racquetball requires shots from floor level to above head — extreme range shoulder demands. Supraspinatus and infraspinatus loading, shoulder impingement risk in repetitive ceiling ball play, eccentric loading in overhead shots. Ceiling ball volume (10–20 per match) creates cumulative rotator cuff stress comparable to volleyball spiking.',
        stat: 'Full shoulder height range: floor to overhead',
      },
      {
        citation: 'Ankle Sprains — Lateral Cut on Hardwood',
        text: 'Ankle injury rate 18–25% in racquetball — sudden direction changes on polished hardwood surface create inversion-supination loading. Court shoes and their shock absorption ratings directly affect injury rate. Proprioceptive training for ankle stability reduces racquetball ankle injury recurrence by 40–55% in intervention studies.',
        stat: 'Ankle injury rate: 18–25%',
      },
      {
        citation: 'Thermal Regulation — Enclosed Court Environment',
        text: 'Indoor racquetball court thermal environment: temperature 20–26°C, humidity 40–60%, limited air movement. Sweat rate 1.2–1.8 L/hour, dehydration risk in multi-game sessions. Heat illness awareness particularly relevant in older recreational players who represent a large proportion of the racquetball population.',
        stat: 'Sweat rate: 1.2–1.8 L/hour',
      },
    ],
  },
  {
    icon: 'S',
    iconBg: 'rgba(6,182,212,0.15)',
    iconBorder: 'rgba(6,182,212,0.35)',
    iconColor: '#67e8f9',
    title: 'Strategy & Tactics',
    accent: '#06b6d4',
    accentBg: 'rgba(6,182,212,0.08)',
    accentBorder: 'rgba(6,182,212,0.22)',
    facts: [
      {
        citation: 'Centre Court Control — T-Zone Dominance',
        text: 'Centre court (T-zone) positioning in racquetball: controlling the middle of the court for maximum shot reach, court coverage, and forcing opponent to shoot from unfavourable positions. Rally outcome correlates strongly with T-zone occupancy time. Elite players spend 65–75% of rally time within 2 m of centre court.',
        stat: 'Elite T-zone occupancy: 65–75% of rally',
      },
      {
        citation: 'Passing Shots — Down-Line vs. Crosscourt',
        text: 'Passing shot trajectories in racquetball: down-the-line (parallel to side wall, hardest to intercept) vs. crosscourt V-pass (wider angle, lower recovery probability). Shot selection based on opponent\'s court position and ability to reach side wall. In rally play, crosscourt passes generate 55–60% lower opponent retrieval rate.',
        stat: 'V-pass: 55–60% lower retrieval rate',
      },
      {
        citation: 'Mental Game — Enclosed Environment Psychology',
        text: 'Psychological factors in racquetball\'s intimate court environment — auditory cues from ball/wall (a high-pitched whip indicating kill shot vs. low thud indicating ceiling ball), proximity to opponent, spatial awareness in small enclosure. Focus and visual tracking skills are trained explicitly at elite level through video-based anticipation drills.',
        stat: 'Enclosed court: unique auditory-visual demands',
      },
      {
        citation: 'Doubles Racquetball — Positioning & Communication',
        text: 'Doubles racquetball: I-formation (front/back) vs. side-by-side positioning, communication timing for avoiding partner collisions (verbal "mine/yours" calls within 0.3–0.5 s), shot selection responsibility by court position. Doubles hinders (interference rulings) require precise spatial awareness of 4-body court positioning.',
        stat: 'Communication window: 0.3–0.5 s',
      },
    ],
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div
      style={{
        background: '#081818',
        border: `1px solid ${accent}28`,
        borderRadius: 14,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <p
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: '"Saira", ui-sans-serif, system-ui, sans-serif',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '6px 0 2px', fontFamily: '"Saira", ui-sans-serif, system-ui, sans-serif' }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.4 }}>{sub}</p>
    </div>
  )
}

function ScienceCard({
  icon,
  iconBg,
  iconBorder,
  iconColor,
  title,
  accent,
  accentBg,
  accentBorder,
  facts,
}: {
  icon: string
  iconBg: string
  iconBorder: string
  iconColor: string
  title: string
  accent: string
  accentBg: string
  accentBorder: string
  facts: { citation: string; text: string; stat: string }[]
}) {
  return (
    <div
      style={{
        background: '#0a1a1a',
        border: '1px solid #0f2a2a',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: iconBg,
            border: `1px solid ${iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: iconColor,
              fontFamily: '"Saira", ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {icon}
          </span>
        </div>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#f0ffff',
            margin: 0,
            letterSpacing: '0.01em',
            fontFamily: '"Saira", ui-sans-serif, system-ui, sans-serif',
          }}
        >
          {title}
        </h3>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {facts.map((fact, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: accent,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  letterSpacing: '0.03em',
                  flexShrink: 0,
                  marginTop: 1,
                  background: `${accent}18`,
                  border: `1px solid ${accent}35`,
                  borderRadius: 4,
                  padding: '2px 6px',
                }}
              >
                {fact.citation}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: accent,
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  textAlign: 'right',
                  maxWidth: 180,
                }}
              >
                {fact.stat}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
              {fact.text}
            </p>
            {i < facts.length - 1 && (
              <div style={{ height: 1, background: '#0f2a2a', marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BallSpeedChart() {
  const max = 240
  return (
    <div
      style={{
        background: '#0a1a1a',
        border: '1px solid #0f2a2a',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(14,165,233,0.08)',
          borderBottom: '1px solid rgba(14,165,233,0.2)',
          borderLeft: '3px solid #0ea5e9',
          padding: '14px 20px',
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#f0ffff',
            margin: 0,
            fontFamily: '"Saira", ui-sans-serif, system-ui, sans-serif',
          }}
        >
          Ball Speed by Surface Contact
        </h3>
        <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
          Peak ball velocity by court surface — professional racquetball play
        </p>
      </div>
      <div style={{ padding: '20px 20px 16px' }}>
        {BALL_SPEED_DATA.map((row) => (
          <div key={row.surface} style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  fontFamily: '"Saira", ui-sans-serif, system-ui, sans-serif',
                }}
              >
                {row.surface}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: row.speed === max ? '#0ea5e9' : '#64748b',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {row.speed} km/h
              </span>
            </div>
            <div
              style={{
                height: 10,
                background: '#0d2020',
                borderRadius: 5,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(row.speed / max) * 100}%`,
                  background: row.speed === max
                    ? 'linear-gradient(90deg, #0369a1, #0ea5e9)'
                    : row.fill,
                  borderRadius: 5,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        ))}
        <p
          style={{
            fontSize: 10,
            color: '#334155',
            margin: '6px 0 0',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          Back wall rebounds generate the highest peak velocities due to compounded wall energy transfer
        </p>
      </div>
    </div>
  )
}

// ─── Hero SVG — Racquetball Court Cross-Section ─────────────────────────────────

function CourtHeroSVG() {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #020d0d 0%, #041818 100%)',
        border: '1px solid #0f2a2a',
        borderRadius: 16,
        padding: '24px 20px 16px',
        overflow: 'hidden',
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#0ea5e9',
          margin: '0 0 14px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        Racquetball Court — Ball Trajectory Off Back Wall
      </p>
      <svg
        viewBox="0 0 480 200"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Racquetball court cross-section showing ball bouncing off back wall with trajectory lines"
      >
        {/* Court outline */}
        <rect x="20" y="20" width="440" height="160" fill="none" stroke="#0f2a2a" strokeWidth="2" />
        {/* Front wall */}
        <rect x="20" y="20" width="6" height="160" fill="#1e4060" />
        <text x="26" y="104" fill="#0ea5e9" fontSize="8" fontFamily="ui-monospace, monospace">FRONT</text>
        <text x="26" y="113" fill="#0ea5e9" fontSize="8" fontFamily="ui-monospace, monospace">WALL</text>
        {/* Back wall */}
        <rect x="454" y="20" width="6" height="160" fill="#1e4060" />
        <text x="410" y="104" fill="#06b6d4" fontSize="8" fontFamily="ui-monospace, monospace">BACK</text>
        <text x="410" y="113" fill="#06b6d4" fontSize="8" fontFamily="ui-monospace, monospace">WALL</text>
        {/* Floor */}
        <rect x="20" y="174" width="440" height="6" fill="#0c3030" />
        {/* Ceiling */}
        <rect x="20" y="20" width="440" height="5" fill="#0c3030" />
        {/* Short line */}
        <line x1="230" y1="20" x2="230" y2="180" stroke="#0f2a2a" strokeWidth="1" strokeDasharray="4,3" />
        <text x="195" y="16" fill="#334155" fontSize="7" fontFamily="ui-monospace, monospace">SERVICE ZONE</text>
        {/* Service box */}
        <line x1="230" y1="60" x2="230" y2="120" stroke="#0f2a2a" strokeWidth="1" />
        {/* Player silhouette */}
        <circle cx="280" cy="120" r="6" fill="#22c55e" opacity="0.8" />
        <rect x="277" y="126" width="6" height="18" rx="2" fill="#22c55e" opacity="0.8" />
        <line x1="274" y1="132" x2="286" y2="132" stroke="#22c55e" strokeWidth="1.5" opacity="0.8" />
        <line x1="283" y1="132" x2="295" y2="126" stroke="#22c55e" strokeWidth="2" opacity="0.9" />
        {/* Ball at back wall */}
        <circle cx="450" cy="100" r="5" fill="#0ea5e9" opacity="0.95" />
        {/* Ball trajectory — incoming to back wall */}
        <path
          d="M 290 130 Q 380 70 450 100"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeDasharray="5,3"
          opacity="0.7"
        />
        <text x="310" y="88" fill="#22c55e" fontSize="7" fontFamily="ui-monospace, monospace" opacity="0.8">incoming</text>
        {/* Ball trajectory — off back wall toward front */}
        <path
          d="M 450 100 Q 360 130 200 90"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2"
          opacity="0.9"
        />
        <text x="310" y="125" fill="#0ea5e9" fontSize="7" fontFamily="ui-monospace, monospace" opacity="0.9">240 km/h rebound</text>
        {/* Velocity arrow */}
        <polygon points="200,90 212,85 212,95" fill="#0ea5e9" opacity="0.9" />
        {/* Speed annotation */}
        <rect x="60" y="55" width="110" height="32" rx="5" fill="#041818" stroke="#0ea5e9" strokeWidth="1" opacity="0.9" />
        <text x="115" y="69" fill="#0ea5e9" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight="700">240+ km/h</text>
        <text x="115" y="80" fill="#64748b" fontSize="7" fontFamily="ui-monospace, monospace" textAnchor="middle">back wall rebound</text>
        {/* Kill zone annotation */}
        <rect x="26" y="155" width="80" height="18" rx="4" fill="#041818" stroke="#22c55e" strokeWidth="1" opacity="0.8" />
        <text x="66" y="167" fill="#22c55e" fontSize="7" fontFamily="ui-monospace, monospace" textAnchor="middle">KILL ZONE &lt;18&quot;</text>
        {/* Ceiling shot dashed arc */}
        <path
          d="M 290 115 Q 330 30 380 90"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity="0.5"
        />
        <text x="335" y="45" fill="#06b6d4" fontSize="6" fontFamily="ui-monospace, monospace" opacity="0.7">ceiling shot</text>
      </svg>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RacquetballSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020d0d',
        color: '#f0ffff',
        fontFamily: '"Saira", ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Saira:wght@400;600;800&display=swap');
        :root {
          --rb-dark: #020d0d;
          --rb-blue: #0ea5e9;
          --rb-neon: #22c55e;
          --rb-cyan: #06b6d4;
          --rb-text: #f0ffff;
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(14,165,233,0.15)',
                border: '1px solid rgba(14,165,233,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 18, color: '#7dd3fc' }}>&#9632;</span>
            </div>
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#f0ffff',
                  margin: 0,
                  letterSpacing: '-0.3px',
                  fontFamily: '"Saira", ui-sans-serif, system-ui, sans-serif',
                }}
              >
                Racquetball Science
              </h1>
              <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                Physics, biomechanics, injury, and strategy — evidence-based
              </p>
            </div>
          </div>
        </div>

        {/* Court Hero SVG */}
        <div style={{ marginBottom: 20 }}>
          <CourtHeroSVG />
        </div>

        {/* Key Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {KEY_STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Ball Speed Chart */}
        <div style={{ marginBottom: 20 }}>
          <BallSpeedChart />
        </div>

        {/* Science Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.title} {...card} />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            padding: '16px',
            background: '#0a1a1a',
            border: '1px solid #0f2a2a',
            borderRadius: 12,
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: '#334155',
              margin: 0,
              lineHeight: 1.6,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            SOURCES: USAR (USA Racquetball) rule book and physiological data; sports science literature on
            racquetball aerobic demands, injury epidemiology, and biomechanical analysis. Protective eyewear
            standards per ASTM F803. This content is educational; not a substitute for professional coaching
            or medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}
