'use client'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '94', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '42 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '487 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Distance / Endurance', desc: '≥ 60 min', pct: 28, color: '#2563eb' },
  { name: 'Technique / Drill', desc: '30 – 60 min', pct: 35, color: '#3b82f6' },
  { name: 'Interval / Speed', desc: '30 – 50 min', pct: 27, color: '#60a5fa' },
  { name: 'Open Water', desc: 'variable duration', pct: 10, color: '#93c5fd' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 3120 },
  { week: 'Wk 2', kcal: 4380 },
  { week: 'Wk 3', kcal: 2210 },
  { week: 'Wk 4', kcal: 4950 },
  { week: 'Wk 5', kcal: 3740 },
  { week: 'Wk 6', kcal: 2890 },
  { week: 'Wk 7', kcal: 5310 },
  { week: 'Wk 8', kcal: 4160 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const RECENT_SESSIONS = [
  { id: '1', date: 'Thu, Mar 19', type: 'Interval / Speed', duration: '38 min', kcal: 521 },
  { id: '2', date: 'Mon, Mar 16', type: 'Technique / Drill', duration: '45 min', kcal: 463 },
  { id: '3', date: 'Sat, Mar 14', type: 'Distance / Endurance', duration: '68 min', kcal: 784 },
  { id: '4', date: 'Wed, Mar 11', type: 'Open Water', duration: '55 min', kcal: 612 },
  { id: '5', date: 'Sun, Mar 8', type: 'Technique / Drill', duration: '40 min', kcal: 448 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '🏊',
    title: 'Stroke Biomechanics',
    accent: '#2563eb',
    accentBg: 'rgba(37,99,235,0.12)',
    accentBorder: 'rgba(37,99,235,0.3)',
    facts: [
      {
        label:
          'Toussaint 1988: propulsive force in elite freestyle swimmers measured at 60–80 N; sculling motion creates both lift and drag components that together generate net forward thrust',
        value: 'propulsive force 60–80 N elite',
      },
      {
        label:
          'Chollet 2000: overlap phase (positive Index of Coordination, IdC) characteristic of elite swimmers vs. glide phase (negative IdC) in novices; each 10% IdC improvement yields 3–5% velocity gain',
        value: '+10% IdC → +3–5% velocity',
      },
      {
        label:
          'Counsilman 1968 / Maglischo 2003: straight back-pull with high elbow position (EVF — early vertical forearm) is the mechanically optimal catch for maximising propulsive surface area',
        value: 'EVF high-elbow catch',
      },
      {
        label:
          'Kjendlie 2004: SWOLF score (strokes per length + time in seconds) of 25–35 is optimal for competitive freestyle; lower SWOLF correlates strongly with economy and race performance',
        value: 'SWOLF 25–35 optimal',
      },
    ],
  },
  {
    emoji: '💧',
    title: 'Hydrodynamics & Drag Science',
    accent: '#0891b2',
    accentBg: 'rgba(8,145,178,0.12)',
    accentBorder: 'rgba(8,145,178,0.3)',
    facts: [
      {
        label:
          'Pendergast 1977: active drag during swimming is 5–10× greater than passive drag measured in tow tests; a 10° body angle error increases frontal drag by approximately 30%',
        value: 'active drag 5–10× passive',
      },
      {
        label:
          'Toussaint 2002: maintaining horizontal body alignment reduces total drag by 25%; optimal hip rotation of 35–45° about the long axis reduces projected frontal area without sacrificing propulsion',
        value: 'horizontal alignment −25% drag',
      },
      {
        label:
          'Marinho 2010: CFD simulations show a 45° hand pitch angle generates approximately 30% more hydrodynamic lift than a flat-palm orientation during the underwater pull phase',
        value: '45° hand pitch +30% lift',
      },
      {
        label:
          'Lyttle 1999: underwater dolphin kick (UDK) velocities up to 2.5 m/s exceed surface swimming speed; post-turn underwater streamline phase reduces drag by up to 40% compared to surface swimming',
        value: 'UDK up to 2.5 m/s · −40% drag',
      },
    ],
  },
  {
    emoji: '🫁',
    title: 'Swimming Physiology',
    accent: '#0d9488',
    accentBg: 'rgba(13,148,136,0.12)',
    accentBorder: 'rgba(13,148,136,0.3)',
    facts: [
      {
        label:
          'Holmér 1974: elite swimmers achieve 90–100% of treadmill VO₂max during pool testing; elite male swimmers demonstrate VO₂max values of 65–75 mL/kg/min for world-class performance',
        value: 'swim VO₂max 90–100% treadmill',
      },
      {
        label:
          'Maglischo 2003: the 50 m sprint is approximately 85% anaerobic; the 1,500 m freestyle is approximately 90% aerobic — event duration dictates metabolic pathway dominance',
        value: '50m 85% anaerobic · 1500m 90% aerobic',
      },
      {
        label:
          'Pöyhönen 1999: swimming energy expenditure ranges from 400–700 kcal/hour; cold water exposure (18°C vs. 26°C) increases energy cost by 12–18% due to thermogenesis and elevated muscle viscosity',
        value: '400–700 kcal/h · +12–18% cold water',
      },
      {
        label:
          'Troup 1991: critical velocity and lactate threshold 2 (LT2) occur at 88–95% VO₂max in elite swimmers; training above critical velocity is key for improving both aerobic capacity and race pace',
        value: 'LT2 at 88–95% VO₂max',
      },
    ],
  },
  {
    emoji: '📋',
    title: 'Training Systems',
    accent: '#059669',
    accentBg: 'rgba(5,150,105,0.12)',
    accentBorder: 'rgba(5,150,105,0.3)',
    facts: [
      {
        label:
          'Costill 1991: optimal weekly training volume for competitive swimmers is 10,000–20,000 m/week; overtraining indicators include resting HR elevation of +5 bpm sustained across multiple days',
        value: '10,000–20,000 m/wk optimal',
      },
      {
        label:
          'Mujika 1995: a 2–3 week taper with volume reduction of 50–75% while maintaining intensity allows elite swimmers to gain 1–3% race velocity through neuromuscular and hormonal adaptations',
        value: '2–3 wk taper → +1–3% velocity',
      },
      {
        label:
          'Toubekis 2008: active recovery swimming (low intensity, 200–400 m) clears blood lactate approximately 40% faster than passive rest; optimal for interval sets and multi-race competition days',
        value: 'active recovery −40% lactate',
      },
      {
        label:
          'Pyne 2001: resisted-cord tethered swimming training over 8 weeks improved peak swimming velocity by 3.2% in competitive swimmers compared to a matched unresisted training group',
        value: 'resisted cord +3.2% peak velocity',
      },
    ],
  },
]

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
      <p style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', margin: 0, letterSpacing: '-0.5px' }}>
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

function sessionTypeColor(type: string): string {
  if (type === 'Distance / Endurance') return '#2563eb'
  if (type === 'Technique / Drill') return '#3b82f6'
  if (type === 'Interval / Speed') return '#60a5fa'
  if (type === 'Open Water') return '#93c5fd'
  return '#2563eb'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SwimmingSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Hero Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #00061a 0%, #00030f 40%, #0a0a0a 100%)',
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
            width: 420,
            height: 420,
            background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
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
              background: 'rgba(37,99,235,0.15)',
              border: '1px solid rgba(37,99,235,0.35)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            🏊
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Swimming Science
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              margin: '0 auto 16px',
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            Stroke biomechanics &amp; hydrodynamics · swimming physiology &amp; VO₂ demands ·
            training systems &amp; performance research
          </p>

          {/* SWOLF reference note */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.25)',
              borderRadius: 20,
              padding: '6px 14px',
            }}
          >
            <span style={{ fontSize: 13 }}>📊</span>
            <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 500 }}>
              SWOLF (strokes + seconds per length) is the gold standard efficiency metric for competitive swimming
            </span>
          </div>
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
            Distribution of swimming training formats over the past 90 days
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SESSION_TYPES.map((s) => (
              <div key={s.name}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>{s.desc}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.pct}%</span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: '#1e1e1e',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${s.pct}%`,
                      background: s.color,
                      borderRadius: 4,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly calorie chart ───────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '20px 20px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
            Weekly Calories Burned
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Total active energy across all swimming sessions per week
          </p>

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
                  <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
                    {w.kcal >= 1000 ? `${(w.kcal / 1000).toFixed(1)}k` : w.kcal}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(to top, #1d4ed8, #3b82f6)',
                      borderRadius: '4px 4px 2px 2px',
                      minHeight: 4,
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#475569' }}>{w.week}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science cards ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#f1f5f9',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Research Deep-Dive
          </h2>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.title} {...card} />
          ))}
        </div>

        {/* ── Recent sessions ────────────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              Recent Sessions
            </h3>
            <span style={{ fontSize: 11, color: '#475569' }}>last 5 workouts</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {RECENT_SESSIONS.map((session, i) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < RECENT_SESSIONS.length - 1 ? '1px solid #141414' : 'none',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: sessionTypeColor(session.type),
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#e2e8f0',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.type}
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>{session.date}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                      {session.duration}
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>duration</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', margin: 0 }}>
                      {session.kcal} kcal
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>burned</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
