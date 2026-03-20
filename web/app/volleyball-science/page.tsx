'use client'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '67', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '74 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '528 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Match / Tournament', desc: '≥90 min', pct: 28, color: '#ca8a04' },
  { name: 'Team Practice', desc: '60–90 min', pct: 38, color: '#d97706' },
  { name: 'Beach Volleyball', desc: '30–90 min', pct: 24, color: '#f59e0b' },
  { name: 'Skills / Drills', desc: '<45 min', pct: 10, color: '#fcd34d' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 1620 },
  { week: 'Wk 2', kcal: 2180 },
  { week: 'Wk 3', kcal: 1440 },
  { week: 'Wk 4', kcal: 2540 },
  { week: 'Wk 5', kcal: 1980 },
  { week: 'Wk 6', kcal: 2290 },
  { week: 'Wk 7', kcal: 1710 },
  { week: 'Wk 8', kcal: 2860 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

// Beach vs indoor split
const BEACH_PCT = 24
const INDOOR_PCT = 76

const RECENT_SESSIONS = [
  { id: '1', date: 'Thu, Mar 13', type: 'Match / Tournament', duration: '112 min', kcal: 874 },
  { id: '2', date: 'Sun, Mar 9', type: 'Beach Volleyball', duration: '68 min', kcal: 596 },
  { id: '3', date: 'Wed, Mar 5', type: 'Team Practice', duration: '82 min', kcal: 641 },
  { id: '4', date: 'Sat, Mar 1', type: 'Beach Volleyball', duration: '54 min', kcal: 512 },
  { id: '5', date: 'Tue, Feb 25', type: 'Skills / Drills', duration: '38 min', kcal: 298 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '🦘',
    title: 'Jump & Attack Biomechanics',
    accent: '#ca8a04',
    accentBg: 'rgba(202,138,4,0.12)',
    accentBorder: 'rgba(202,138,4,0.3)',
    facts: [
      {
        label: 'Marques 2009: elite male opposite hitters vs. women countermovement jump height',
        value: '80–90 cm / 60–70 cm',
      },
      {
        label: 'Approach run adds vs. standing block jump; wrist snap generates topspin (Forthomme 2005)',
        value: '+15–20 cm · 10–20 rev/s',
      },
      {
        label: 'Coleman 2010: available blocking window at the net',
        value: '0.08–0.14 s',
      },
      {
        label: 'Lian 2005: patellar tendinopathy prevalence — highest of any jumping sport',
        value: '45% of athletes',
      },
    ],
  },
  {
    emoji: '⚡',
    title: 'Energy Systems & Physical Demands',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.3)',
    facts: [
      {
        label: 'Sheppard 2008: explosive efforts per match with typical work-to-rest ratio',
        value: '300–500 · 1:5–1:8',
      },
      {
        label: 'Fattahi 2012: libero covers 30% more ground than attackers; average heart rate',
        value: '+30% dist · 145–165 bpm',
      },
      {
        label: 'Maffiuletti 2008: caloric expenditure per hour; blood lactate range',
        value: '400–600 kcal/hr · 2–4 mmol/L',
      },
      {
        label: 'Lidor 2010: jump serve travel distance and time in flight',
        value: '18–22 m in 0.35–0.45 s',
      },
    ],
  },
  {
    emoji: '🏖️',
    title: 'Beach vs Indoor Science',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.3)',
    facts: [
      {
        label: 'Giatsis 2011: beach burns more kcal/min; sand movement energy cost multiplier',
        value: '+30–40% · 1.6× hardcourt',
      },
      {
        label: 'Tilp 2009: CMJ height reduction on sand; landing force reduction',
        value: '−5–8 cm · −15–20%',
      },
      {
        label: 'Araújo 2014: court area defended per player — beach vs. indoor',
        value: '72 m² vs. 27 m²',
      },
      {
        label: 'Palao 2014: float serve share at elite level; jump serve ace likelihood multiplier',
        value: '65% float · 3× more aces',
      },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Injury Prevention',
    accent: '#ec4899',
    accentBg: 'rgba(236,72,153,0.12)',
    accentBorder: 'rgba(236,72,153,0.3)',
    facts: [
      {
        label: 'Briner 1997: ankle sprains share of all volleyball injuries; most occur during blocking',
        value: '40% · 80% at net',
      },
      {
        label: 'Bahr 2003: proprioception training reduces ankle sprain incidence',
        value: '−47%',
      },
      {
        label: 'Aagaard 2004: shoulder ER:IR ratio threshold predicting injury odds ratio',
        value: '<0.7 → OR 4.2',
      },
      {
        label: 'Verhagen 2004: wobble board protocol reduced ankle sprains (from → to per 1,000 h)',
        value: '2.5 → 0.9 / 1,000 h (−64%)',
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionTypeColor(type: string): string {
  if (type === 'Match / Tournament') return '#ca8a04'
  if (type === 'Team Practice') return '#d97706'
  if (type === 'Beach Volleyball') return '#f59e0b'
  return '#fcd34d'
}

function sessionTypeFg(type: string): string {
  // All yellow shades look better with dark text
  return '#0a0a0a'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        padding: '20px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <p style={{ fontSize: 26, fontWeight: 800, color: '#ca8a04', margin: 0, letterSpacing: '-0.5px' }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', margin: '4px 0 2px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{sub}</p>
    </div>
  )
}

function ScienceCard({
  emoji,
  title,
  accent,
  accentBg,
  accentBorder,
  facts,
}: {
  emoji: string
  title: string
  accent: string
  accentBg: string
  accentBorder: string
  facts: { label: string; value: string }[]
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
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
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#f1f5f9',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h3>
      </div>

      {/* Fact rows */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {facts.map((fact, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, flex: 1 }}>
              {fact.label}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: accent,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                textAlign: 'right',
                maxWidth: 180,
                lineHeight: 1.4,
              }}
            >
              {fact.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VolleyballSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Hero Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1200 0%, #0f0900 40%, #0a0a0a 100%)',
          borderBottom: '1px solid #1f1f1f',
          padding: '48px 24px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 340,
            height: 340,
            background: 'radial-gradient(circle, rgba(202,138,4,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(202,138,4,0.15)',
              border: '1px solid rgba(202,138,4,0.35)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            🏐
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #ca8a04, #d97706, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Volleyball Science
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              margin: 0,
              maxWidth: 540,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            Jump biomechanics · energy system demands · beach vs. indoor physiology ·
            spike mechanics and injury prevention research
          </p>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 880,
          margin: '0 auto',
          padding: '32px 16px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {STATS.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
          ))}
        </div>

        {/* ── Session type breakdown ─────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '20px 20px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
            Session Type Breakdown
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Distribution of session formats over the past 90 days
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SESSION_TYPES.map((s) => (
              <div key={s.name}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: s.color,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{s.desc}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.pct}%</span>
                </div>
                {/* Bar track */}
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    background: '#1f1f1f',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${s.pct}%`,
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Beach vs Indoor split indicator ───────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '20px 20px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
            Beach vs Indoor Split
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Session volume distribution by court surface
          </p>

          {/* Split bar */}
          <div
            style={{
              height: 20,
              borderRadius: 99,
              overflow: 'hidden',
              display: 'flex',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: `${BEACH_PCT}%`,
                background: 'linear-gradient(90deg, #ca8a04, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {BEACH_PCT >= 12 && (
                <span style={{ fontSize: 10, fontWeight: 800, color: '#0a0a0a' }}>
                  {BEACH_PCT}%
                </span>
              )}
            </div>
            <div
              style={{
                flex: 1,
                background: 'linear-gradient(90deg, #334155, #1e293b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>
                {INDOOR_PCT}%
              </span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: '#ca8a04',
                  flexShrink: 0,
                }}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#ca8a04', margin: 0 }}>
                  Beach — {BEACH_PCT}%
                </p>
                <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>Sand surface · 2v2 format</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: '#334155',
                  flexShrink: 0,
                  border: '1px solid #475569',
                }}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: 0 }}>
                  Indoor — {INDOOR_PCT}%
                </p>
                <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>Hardcourt · 6v6 format</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Weekly calorie chart ──────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '20px 20px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
            Weekly Calories Burned — Last 8 Weeks
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Active calories from all volleyball sessions per week
          </p>

          {/* Chart area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              height: 160,
            }}
          >
            {WEEKLY_CALORIES.map((w) => {
              const heightPct = (w.kcal / MAX_WEEKLY_KCAL) * 100
              return (
                <div
                  key={w.week}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  {/* Kcal label */}
                  <span
                    style={{
                      fontSize: 10,
                      color: '#ca8a04',
                      fontWeight: 600,
                      letterSpacing: '-0.2px',
                      marginBottom: 2,
                    }}
                  >
                    {(w.kcal / 1000).toFixed(1)}k
                  </span>
                  {/* Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      minHeight: 4,
                      background: 'linear-gradient(180deg, #ca8a04, #92400e)',
                      borderRadius: '4px 4px 2px 2px',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  {/* Week label */}
                  <span style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{w.week}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science cards grid ────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard
              key={card.title}
              emoji={card.emoji}
              title={card.title}
              accent={card.accent}
              accentBg={card.accentBg}
              accentBorder={card.accentBorder}
              facts={card.facts}
            />
          ))}
        </div>

        {/* ── Recent sessions ───────────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #1f1f1f',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              Recent Sessions
            </h3>
            <span style={{ fontSize: 11, color: '#475569' }}>Mock data</span>
          </div>

          {/* Session rows */}
          <div>
            {RECENT_SESSIONS.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: i < RECENT_SESSIONS.length - 1 ? '1px solid #161616' : 'none',
                  gap: 12,
                }}
              >
                {/* Color dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: sessionTypeColor(s.type),
                    flexShrink: 0,
                  }}
                />

                {/* Date */}
                <span
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    flexShrink: 0,
                    width: 108,
                  }}
                >
                  {s.date}
                </span>

                {/* Type badge */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: sessionTypeFg(s.type),
                    background: sessionTypeColor(s.type),
                    padding: '3px 8px',
                    borderRadius: 99,
                    flexShrink: 0,
                  }}
                >
                  {s.type}
                </span>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Duration */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{s.duration}</span>
                </div>

                {/* Calories */}
                <div
                  style={{
                    textAlign: 'right',
                    flexShrink: 0,
                    minWidth: 72,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ca8a04' }}>
                    {s.kcal} kcal
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Citation footer ───────────────────────────────────────────────── */}
        <p
          style={{
            fontSize: 11,
            color: '#334155',
            textAlign: 'center',
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Research references: Marques et al. 2009 · Forthomme et al. 2005 · Coleman 2010 ·
          Lian et al. 2005 · Sheppard et al. 2008 · Fattahi et al. 2012 · Maffiuletti et al. 2008 ·
          Lidor 2010 · Giatsis et al. 2011 · Tilp et al. 2009 · Araújo et al. 2014 ·
          Palao et al. 2014 · Briner 1997 · Bahr et al. 2003 · Aagaard et al. 2004 · Verhagen et al. 2004
        </p>
      </main>
    </div>
  )
}
