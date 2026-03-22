// Padel Science — static server component
// Evidence-based guide covering padel court physics, physical demands,
// technique, tactics, and the fastest growing sport in the world.

export const metadata = { title: 'Padel Science' }

// ─── Theme ─────────────────────────────────────────────────────────────────────
// Vibrant padel green / white / accent gold — Spanish/Argentine energy
// CSS prefix: pdl-
// Font: Raleway (weights 400, 600, 800) — elegant yet sporty, popular in European sports

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '25M+',
    label: 'Global Players',
    sub: 'Worldwide padel player base as of 2022; 35M projected by 2025',
    accent: '#16a34a',
  },
  {
    value: '88%',
    label: 'Doubles-Only Format',
    sub: 'The vast majority of padel is played as doubles — unique among major racket sports',
    accent: '#ca8a04',
  },
  {
    value: '120 km/h',
    label: 'Elite Smash Speed',
    sub: 'Peak smash velocity in elite padel — lower than tennis due to underhand serve rules',
    accent: '#65a30d',
  },
  {
    value: '3 Sessions',
    label: 'To Competitive Level',
    sub: 'Novices achieve competitive rally ability in 3–4 sessions vs. 10–15 for tennis',
    accent: '#16a34a',
  },
]

// ─── Player Growth Chart Data ───────────────────────────────────────────────────

const GROWTH_DATA = [
  { year: '2010', players: 4,  projected: false },
  { year: '2014', players: 8,  projected: false },
  { year: '2018', players: 15, projected: false },
  { year: '2022', players: 25, projected: false },
  { year: '2025', players: 35, projected: true  },
]

// ─── Science Cards ──────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    icon: 'C',
    iconBg: 'rgba(22,163,74,0.15)',
    iconBorder: 'rgba(22,163,74,0.35)',
    iconColor: '#86efac',
    title: 'Padel Physics & Court Science',
    accent: '#16a34a',
    accentBg: 'rgba(22,163,74,0.08)',
    accentBorder: 'rgba(22,163,74,0.22)',
    facts: [
      {
        citation: 'Court Dimensions & Surface Science',
        text: 'Padel court: 10×20 m enclosed with glass back walls and metal mesh side fences. Ball rebound angles off glass are highly predictable at slow speeds but become unpredictable at oblique angles >60°. Net height: 88 cm at centre, 92 cm at sides. Court surface: artificial grass (padelgrass) with sand infill providing 8–12 mm pile height. Padel ball: 56–59.4 mm diameter, 10–15% lower pressure than tennis ball.',
        stat: 'Court: 10×20 m; net: 88 cm centre',
      },
      {
        citation: 'Serve Mechanics — Unique Underhand Bounce Rule',
        text: 'Padel serve mechanics: must bounce in service box before striking, contact below waist height, no smash/jump serve allowed. This rule keeps the serve less dominant than tennis — no ace-driven point structure. Serve speed: 80–120 km/h vs. 200+ km/h in professional tennis. Rally-based sport design forces tactical play from the very first shot of every point.',
        stat: 'Serve speed: 80–120 km/h vs. 200+ in tennis',
      },
      {
        citation: 'Glass Wall Technique — Sport-Specific Motor Skills',
        text: 'Padel-specific shots using glass walls: vibora (sidespin lob off back glass creating unpredictable bounce), bajada (controlled drop after ball returns off back glass — requires precise timing and positioning), bandeja (defensive overhead off back glass keeping opponents at baseline). These shots require motor programmes that transfer from no other racket sport — neural adaptation time: 10–15 hours of deliberate wall-play practice.',
        stat: 'Vibora, bandeja, bajada — zero transfer from tennis',
      },
      {
        citation: 'Ball Speed Profile — High Frequency, Moderate Velocity',
        text: 'Padel smash: 120–160 km/h for elite players. Rally ball speeds: 40–80 km/h — lower than tennis, squash, or badminton. However, shot frequency is very high (short court, fast exchanges at net): 80–120 shots per game vs. 40–60 in tennis. Reactive time demands are actually greater than tennis at net due to proximity and shot frequency.',
        stat: 'Rally speed: 40–80 km/h; frequency: 80–120/game',
      },
    ],
  },
  {
    icon: 'P',
    iconBg: 'rgba(101,163,13,0.15)',
    iconBorder: 'rgba(101,163,13,0.35)',
    iconColor: '#bef264',
    title: 'Physical Demands',
    accent: '#65a30d',
    accentBg: 'rgba(101,163,13,0.08)',
    accentBorder: 'rgba(101,163,13,0.22)',
    facts: [
      {
        citation: 'GPS Match Analysis — WPT/FIP Circuit',
        text: 'GPS data from elite padel matches (World Padel Tour / FIP circuit): doubles players cover 6–9 km per match, with high-intensity actions (>18 km/h) representing 15–20% of total distance. Match duration: 60–90 min for a best-of-3 format. Sprint distance per match: 0.8–1.4 km. Direction changes: 200–400 per match — comparable to squash.',
        stat: '6–9 km per match (doubles GPS)',
      },
      {
        citation: 'Cardiovascular Demands — Doubles vs. Singles',
        text: 'Heart rate monitoring in competitive padel: doubles HR 75–88% HRmax; singles padel HR 80–92% HRmax. Blood lactate: 3–5 mmol/L — moderately glycolytic. VO₂max for elite padel players: 55–65 mL/kg/min. The work:rest ratio in padel doubles (1:1 to 1.5:1) is lower than squash but higher than recreational tennis.',
        stat: 'HR: 75–88% HRmax doubles; VO₂max 55–65 mL/kg/min',
      },
      {
        citation: 'Shoulder Loading — Defensive Overhead Volume',
        text: 'Padel overhead technique volume: 50–80 defensive overheads (bandeja/vibora) per match. Shoulder ER/IR demands similar to tennis but with more defensive loading pattern — lower arm speed, higher repetition count. Rotator cuff adaptation required particularly for supraspinatus (deceleration role in defensive overhead). 3D motion capture studies: shoulder internal rotation angular velocity 650–900°/s in vibora.',
        stat: '50–80 defensive overheads per match',
      },
      {
        citation: 'Wrist Injury — Unpredictable Rebound Physics',
        text: 'Wrist injuries represent 15–20% of padel injuries — primarily from unexpected ball rebound angles off glass and mesh creating reactive loading events. TFCC (triangular fibrocartilage complex) strain and extensor tendinopathy are the most common wrist pathologies. Beginner-phase injury risk is elevated as players underestimate glass-rebound unpredictability in their first 20–50 hours of play.',
        stat: 'Wrist injuries: 15–20% of all padel injuries',
      },
    ],
  },
  {
    icon: 'T',
    iconBg: 'rgba(22,163,74,0.15)',
    iconBorder: 'rgba(22,163,74,0.35)',
    iconColor: '#86efac',
    title: 'Technique & Tactics',
    accent: '#16a34a',
    accentBg: 'rgba(22,163,74,0.08)',
    accentBorder: 'rgba(22,163,74,0.22)',
    facts: [
      {
        citation: 'Net Position — The Dominant Tactical Principle',
        text: 'Tactical analysis of professional padel: 80% of winning shots are played from net position (1–2 m from net). Padel strategy revolves around moving opponents back with lobs and taking net position. From net: parallel shots (down the line) vs. cross-court winners. Points lost from net are nearly always errors in net positioning angle rather than technical failures.',
        stat: '80% of winners from net position',
      },
      {
        citation: 'The Lob — Most Important Shot in Padel',
        text: 'The lob is padel\'s most tactically important shot — used defensively (to escape net pressure and regain baseline position) and offensively (to send opponents back for awkward wall shots). Optimal lob height: 5–7 m — above opponents\' reach but below the 10 m effective limit for court length. Topspin lob bounces into the back glass at steeper angle, creating a harder bajada situation for opponents.',
        stat: 'Lob height: 5–7 m for optimal tactical effect',
      },
      {
        citation: 'Back Wall Return — Expert Rebound Reading',
        text: 'Player must read ball trajectory off glass, move to intercept, and execute return shot — all within 0.8–1.2 s from ball hitting glass. Expert-novice difference in rebound prediction timing: 200–300 ms advantage for experienced players (measured by eye-tracking studies). This prediction advantage is the single strongest discriminator between 3rd and 1st category padel players.',
        stat: 'Expert rebound prediction: +200–300 ms advantage',
      },
      {
        citation: 'Mixed Doubles Tactics — Spatial Strategy',
        text: 'Padel mixed doubles strategy: attack weaker player\'s side consistently, exploit forehand-backhand asymmetry (most players\' backhand side is weaker for wall play), serve to body to limit return options. 4-player court spatial awareness: rotational vs. fixed-role positioning models, covering lob recovery when partner at net.',
        stat: '4-player court requires constant spatial recalculation',
      },
    ],
  },
  {
    icon: 'G',
    iconBg: 'rgba(202,138,4,0.15)',
    iconBorder: 'rgba(202,138,4,0.35)',
    iconColor: '#fde047',
    title: 'Growth Science & Development',
    accent: '#ca8a04',
    accentBg: 'rgba(202,138,4,0.08)',
    accentBorder: 'rgba(202,138,4,0.22)',
    facts: [
      {
        citation: 'World Padel Tour Growth Statistics',
        text: 'Padel has grown from approximately 4 million players in 2010 to 25 million+ by 2022 — the fastest growth of any sport globally over that decade. 90,000+ courts worldwide (60% in Spain/Latin America, 40% rapidly expanding across Europe, Middle East, and North America). Olympic inclusion discussions ongoing. Major investment from tennis infrastructure — same venues, different enclosure.',
        stat: '4M to 25M players in 10 years; 90,000+ courts',
      },
      {
        citation: 'Learning Curve — Skill Acquisition Research',
        text: 'Padel\'s lower technical barrier versus tennis: shorter solid racket (no string tension variation), enclosed court (ball always in play — fewer lost balls), underhand serve (no complex toss-and-contact coordination). Research: novices achieve competitive rally ability (5+ shot rallies) in 3–4 sessions vs. 10–15 for tennis equivalence. Lower beginner injury rate compared to tennis (no overhead serve loading in first hours).',
        stat: 'Competitive rally: 3–4 sessions vs. 10–15 for tennis',
      },
      {
        citation: 'Transfer from Tennis — Motor Learning Evidence',
        text: 'Tennis players transitioning to padel: groundstroke mechanics applicable (65–75% positive transfer based on kinematics studies), net volley timing partially transfers (50–60%). However, wall play, soft hands at net (controlled deceleration volleys), and defensive overheads require entirely new motor programmes. Critical finding: overlearned tennis instincts — particularly the reflex to smash hard from the back court — are actively counterproductive in padel and must be suppressed.',
        stat: '65–75% groundstroke transfer; wall play = new learning',
      },
      {
        citation: 'Social & Mental Health — Padel\'s Wellbeing Design',
        text: 'Social sport by design: doubles-only format on an intimate 20×10 m court creates unavoidable interpersonal engagement. Community building and social bonding are measurably stronger in padel clubs vs. gym environments. Doubles sports show higher adherence rates than singles sports (lower anxiety, shared responsibility). Padel represents the ideal entry point for sedentary adults: low injury risk, fast competence, social reward, and aerobic conditioning benefit of 75–88% HRmax sustained exercise.',
        stat: 'Doubles adherence > singles; ideal sedentary adult entry',
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
        background: '#0d200c',
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
          fontFamily: '"Raleway", ui-sans-serif, system-ui, sans-serif',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#f0fff4',
          margin: '6px 0 2px',
          fontFamily: '"Raleway", ui-sans-serif, system-ui, sans-serif',
        }}
      >
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
        background: '#0d200c',
        border: '1px solid #162e14',
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
              fontFamily: '"Raleway", ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {icon}
          </span>
        </div>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#f0fff4',
            margin: 0,
            letterSpacing: '0.01em',
            fontFamily: '"Raleway", ui-sans-serif, system-ui, sans-serif',
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
                  maxWidth: 190,
                }}
              >
                {fact.stat}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#86a888', lineHeight: 1.65, margin: 0 }}>
              {fact.text}
            </p>
            {i < facts.length - 1 && (
              <div style={{ height: 1, background: '#162e14', marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function GrowthChart() {
  const maxPlayers = 35
  return (
    <div
      style={{
        background: '#0d200c',
        border: '1px solid #162e14',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(22,163,74,0.08)',
          borderBottom: '1px solid rgba(22,163,74,0.2)',
          borderLeft: '3px solid #16a34a',
          padding: '14px 20px',
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#f0fff4',
            margin: 0,
            fontFamily: '"Raleway", ui-sans-serif, system-ui, sans-serif',
          }}
        >
          Fastest Growing Sport — Global Player Count
        </h3>
        <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
          World Padel Tour / FIP data — millions of registered players worldwide
        </p>
      </div>
      <div style={{ padding: '24px 20px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            height: 140,
            borderBottom: '1px solid #162e14',
            paddingBottom: 0,
          }}
        >
          {GROWTH_DATA.map((row) => {
            const heightPct = (row.players / maxPlayers) * 100
            return (
              <div
                key={row.year}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: row.projected ? '#ca8a04' : '#16a34a',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    marginBottom: 4,
                  }}
                >
                  {row.players}M
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    background: row.projected
                      ? 'linear-gradient(180deg, #ca8a04 0%, #78350f 100%)'
                      : 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)',
                    borderRadius: '4px 4px 0 0',
                    opacity: row.projected ? 0.75 : 1,
                    border: row.projected ? '1px dashed #ca8a04' : 'none',
                    borderBottom: 'none',
                  }}
                />
              </div>
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 8,
          }}
        >
          {GROWTH_DATA.map((row) => (
            <div
              key={row.year}
              style={{
                flex: 1,
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: row.projected ? '#ca8a04' : '#64748b',
                  fontFamily: '"Raleway", ui-sans-serif, system-ui, sans-serif',
                  fontWeight: row.projected ? 700 : 400,
                }}
              >
                {row.year}
                {row.projected ? '*' : ''}
              </span>
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: 10,
            color: '#334155',
            margin: '10px 0 0',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          * 2025 projected — fastest-growing sport globally by player count over the 2010–2025 period
        </p>
      </div>
    </div>
  )
}

// ─── Hero SVG — Padel Court Overhead View ──────────────────────────────────────

function CourtHeroSVG() {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0a1a08 0%, #0d200c 100%)',
        border: '1px solid #162e14',
        borderRadius: 16,
        padding: '24px 20px 16px',
        overflow: 'hidden',
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#16a34a',
          margin: '0 0 14px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        Padel Court — Overhead View with Player Positions
      </p>
      <svg
        viewBox="0 0 480 260"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Padel court from above showing glass walls, net, and 4 player positions"
      >
        {/* Court fill */}
        <rect x="40" y="20" width="400" height="220" fill="#0d280b" rx="2" />

        {/* Glass back walls */}
        <rect x="40" y="20" width="400" height="8" fill="#1a4a3a" stroke="#16a34a" strokeWidth="1.5" opacity="0.9" />
        <rect x="40" y="232" width="400" height="8" fill="#1a4a3a" stroke="#16a34a" strokeWidth="1.5" opacity="0.9" />
        {/* Metal mesh side walls */}
        <rect x="40" y="20" width="8" height="220" fill="#1a3a20" stroke="#65a30d" strokeWidth="1" opacity="0.8" />
        <rect x="432" y="20" width="8" height="220" fill="#1a3a20" stroke="#65a30d" strokeWidth="1" opacity="0.8" />

        {/* Side wall mesh pattern */}
        {[28, 38, 48, 58, 68, 78, 88, 98, 108, 118, 128, 138, 148, 158, 168, 178, 188, 198, 208, 218].map(y => (
          <line key={y} x1="40" y1={y} x2="48" y2={y} stroke="#65a30d" strokeWidth="0.5" opacity="0.4" />
        ))}
        {[28, 38, 48, 58, 68, 78, 88, 98, 108, 118, 128, 138, 148, 158, 168, 178, 188, 198, 208, 218].map(y => (
          <line key={y} x1="432" y1={y} x2="440" y2={y} stroke="#65a30d" strokeWidth="0.5" opacity="0.4" />
        ))}

        {/* Court lines */}
        {/* Service lines */}
        <line x1="40" y1="130" x2="440" y2="130" stroke="#1e4a1e" strokeWidth="1.5" />
        {/* Service box dividers */}
        <line x1="240" y1="28" x2="240" y2="130" stroke="#1e4a1e" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="240" y1="130" x2="240" y2="232" stroke="#1e4a1e" strokeWidth="1" strokeDasharray="3,3" />

        {/* Net */}
        <rect x="40" y="126" width="400" height="8" fill="#ca8a04" opacity="0.9" rx="1" />
        <text x="240" y="133" fill="#fde047" fontSize="7" fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight="700">NET 88cm</text>

        {/* Player positions — team 1 (top, baseline) */}
        {/* Player A */}
        <circle cx="160" cy="60" r="10" fill="#16a34a" opacity="0.9" />
        <text x="160" y="64" fill="#f0fff4" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight="700">A</text>
        <circle cx="160" cy="60" r="14" fill="none" stroke="#16a34a" strokeWidth="1" opacity="0.4" />
        {/* Player B */}
        <circle cx="320" cy="60" r="10" fill="#16a34a" opacity="0.9" />
        <text x="320" y="64" fill="#f0fff4" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight="700">B</text>
        <circle cx="320" cy="60" r="14" fill="none" stroke="#16a34a" strokeWidth="1" opacity="0.4" />

        {/* Player positions — team 2 (bottom, net) */}
        {/* Player C */}
        <circle cx="160" cy="185" r="10" fill="#ca8a04" opacity="0.9" />
        <text x="160" y="189" fill="#f0fff4" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight="700">C</text>
        <circle cx="160" cy="185" r="14" fill="none" stroke="#ca8a04" strokeWidth="1" opacity="0.4" />
        {/* Player D */}
        <circle cx="320" cy="185" r="10" fill="#ca8a04" opacity="0.9" />
        <text x="320" y="189" fill="#f0fff4" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight="700">D</text>
        <circle cx="320" cy="185" r="14" fill="none" stroke="#ca8a04" strokeWidth="1" opacity="0.4" />

        {/* Lob trajectory */}
        <path
          d="M 160 185 Q 160 60 200 50"
          fill="none"
          stroke="#86efac"
          strokeWidth="1.5"
          strokeDasharray="4,3"
          opacity="0.6"
        />
        <text x="125" y="120" fill="#86efac" fontSize="7" fontFamily="ui-monospace, monospace" opacity="0.8">lob</text>

        {/* Labels */}
        <text x="240" y="16" fill="#16a34a" fontSize="7" fontFamily="ui-monospace, monospace" textAnchor="middle" opacity="0.7">GLASS BACK WALL</text>
        <text x="240" y="252" fill="#16a34a" fontSize="7" fontFamily="ui-monospace, monospace" textAnchor="middle" opacity="0.7">GLASS BACK WALL</text>
        <text x="28" y="135" fill="#65a30d" fontSize="6" fontFamily="ui-monospace, monospace" textAnchor="middle" opacity="0.7" transform="rotate(-90 28 135)">MESH SIDE</text>
        <text x="452" y="135" fill="#65a30d" fontSize="6" fontFamily="ui-monospace, monospace" textAnchor="middle" opacity="0.7" transform="rotate(90 452 135)">MESH SIDE</text>

        {/* Dimensions */}
        <text x="240" y="90" fill="#334155" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="middle">10 m</text>
        <text x="475" y="135" fill="#334155" fontSize="7" fontFamily="ui-monospace, monospace" textAnchor="middle" transform="rotate(90 475 135)">20 m</text>

        {/* Team labels */}
        <rect x="48" y="35" width="44" height="14" rx="3" fill="#0d280b" stroke="#16a34a" strokeWidth="0.5" />
        <text x="70" y="45" fill="#86efac" fontSize="7" fontFamily="ui-monospace, monospace" textAnchor="middle">TEAM 1</text>
        <rect x="48" y="200" width="48" height="14" rx="3" fill="#0d280b" stroke="#ca8a04" strokeWidth="0.5" />
        <text x="72" y="210" fill="#fde047" fontSize="7" fontFamily="ui-monospace, monospace" textAnchor="middle">TEAM 2</text>
      </svg>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PadelSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a1a08',
        color: '#f0fff4',
        fontFamily: '"Raleway", ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;800&display=swap');
        :root {
          --pdl-dark: #0a1a08;
          --pdl-green: #16a34a;
          --pdl-lime: #65a30d;
          --pdl-gold: #ca8a04;
          --pdl-text: #f0fff4;
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
                background: 'rgba(22,163,74,0.15)',
                border: '1px solid rgba(22,163,74,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 18, color: '#86efac' }}>&#9632;</span>
            </div>
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#f0fff4',
                  margin: 0,
                  letterSpacing: '-0.3px',
                  fontFamily: '"Raleway", ui-sans-serif, system-ui, sans-serif',
                }}
              >
                Padel Science
              </h1>
              <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                The world&apos;s fastest growing sport — physics, physiology, tactics, and development
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

        {/* Growth Chart */}
        <div style={{ marginBottom: 20 }}>
          <GrowthChart />
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
            background: '#0d200c',
            border: '1px solid #162e14',
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
            SOURCES: World Padel Tour (WPT) and Federación Internacional de Pádel (FIP) statistical data;
            sports science literature on padel physiological demands, injury epidemiology, GPS match analysis,
            and motor learning research. Player count projections based on FIP growth trend data.
            This content is educational; not a substitute for professional coaching or medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}
