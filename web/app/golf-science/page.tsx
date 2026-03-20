'use client'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Rounds / Sessions', value: '62', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '187 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '1,340 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Full 18-Hole Round', desc: '≥ 3.5 h', pct: 44, color: '#16a34a' },
  { name: '9-Hole Round', desc: '1.5 – 3.5 h', pct: 28, color: '#22c55e' },
  { name: 'Range / Practice', desc: '30 – 90 min', pct: 19, color: '#4ade80' },
  { name: 'Short Game', desc: '< 30 min', pct: 9, color: '#86efac' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 4820 },
  { week: 'Wk 2', kcal: 6340 },
  { week: 'Wk 3', kcal: 3910 },
  { week: 'Wk 4', kcal: 7150 },
  { week: 'Wk 5', kcal: 5680 },
  { week: 'Wk 6', kcal: 4430 },
  { week: 'Wk 7', kcal: 6890 },
  { week: 'Wk 8', kcal: 5210 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const RECENT_SESSIONS = [
  { id: '1', date: 'Fri, Mar 14', type: 'Full 18-Hole Round', duration: '4 h 12 min', kcal: 2140 },
  { id: '2', date: 'Tue, Mar 11', type: 'Range / Practice', duration: '65 min', kcal: 410 },
  { id: '3', date: 'Sat, Mar 8', type: 'Full 18-Hole Round', duration: '3 h 58 min', kcal: 1980 },
  { id: '4', date: 'Thu, Mar 6', type: '9-Hole Round', duration: '2 h 05 min', kcal: 980 },
  { id: '5', date: 'Sun, Mar 2', type: 'Short Game', duration: '22 min', kcal: 185 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '⛳',
    title: 'Swing Biomechanics',
    accent: '#16a34a',
    accentBg: 'rgba(22,163,74,0.12)',
    accentBorder: 'rgba(22,163,74,0.3)',
    facts: [
      {
        label: 'Hume 2005: X-factor 45–55° drives clubhead speed via sequential hip-to-shoulder rotation',
        value: '160–180 km/h',
      },
      {
        label: 'McTeigue 1994: Tour players show more X-factor stretch at downswing vs. amateurs',
        value: '+40–50%',
      },
      {
        label: 'Coleman 2004: shoulder internal-rotation angular velocity at impact',
        value: '550–700°/s',
      },
      {
        label: 'Wheat 2007: ground reaction force peaks at impact',
        value: '1.5–2.0× BW',
      },
    ],
  },
  {
    emoji: '🚶',
    title: 'Walking Load & Fitness Benefits',
    accent: '#0d9488',
    accentBg: 'rgba(13,148,136,0.12)',
    accentBorder: 'rgba(13,148,136,0.3)',
    facts: [
      {
        label: 'Murray 2017: 18 holes walking distance; walkers burn 40% more calories than cart riders',
        value: '8–12 km',
      },
      {
        label: 'Stenner 2016: 18-hole walk caloric expenditure at 4–5 METs',
        value: '1,200–2,200 kcal',
      },
      {
        label: 'Farahmand 2009: golfers live longer with lower cardiovascular mortality',
        value: '+5 yr · −40% CVD',
      },
      {
        label: 'Guo 2020: golf improves balance and dual-task gait in adults 65+',
        value: '+18% · +22%',
      },
    ],
  },
  {
    emoji: '🧠',
    title: 'Mental Performance & Focus',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.3)',
    facts: [
      {
        label: 'Bois 2009: pre-shot routine reduces variance 35%; elite spend 12–18 s in routine',
        value: '−35% variance',
      },
      {
        label: 'Rotella 2004: HRV coherence correlation with putting accuracy',
        value: 'r = 0.68',
      },
      {
        label: 'Beauchamp 2012: self-talk improves driving accuracy and handicap',
        value: '+24% · −1.8 hcp',
      },
      {
        label: 'Cooke 2011: quiet eye duration — strongest putter differentiator',
        value: '200–400 ms',
      },
    ],
  },
  {
    emoji: '🩺',
    title: 'Injury Science & Prevention',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.3)',
    facts: [
      {
        label: 'McHardy 2007: lower back accounts for 35% of all golf injuries; lumbar compression amateurs vs. pros',
        value: '6–8 kN vs. 4–5 kN',
      },
      {
        label: 'Metz 1999: golfer\'s elbow prevalence in recreational players',
        value: '7–10%',
      },
      {
        label: 'Gosheger 2003: core strengthening reduces LBP and improves driving distance',
        value: '−43% LBP · +4%',
      },
      {
        label: 'Finch 2009: rotator cuff pathology in golfers over 50',
        value: '16% prevalence',
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
      <p style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', margin: 0, letterSpacing: '-0.5px' }}>
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
  if (type === 'Full 18-Hole Round') return '#16a34a'
  if (type === '9-Hole Round') return '#22c55e'
  if (type === 'Range / Practice') return '#4ade80'
  return '#86efac'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GolfSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Hero Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #031a09 0%, #020f05 40%, #0a0a0a 100%)',
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
            width: 360,
            height: 360,
            background: 'radial-gradient(circle, rgba(22,163,74,0.13) 0%, transparent 70%)',
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
              background: 'rgba(22,163,74,0.15)',
              border: '1px solid rgba(22,163,74,0.3)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            ⛳
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #16a34a, #22c55e, #4ade80)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Golf Science
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              margin: '0 auto',
              maxWidth: 540,
              lineHeight: 1.6,
            }}
          >
            Swing biomechanics · walking fitness benefits · mental performance &amp; focus ·
            injury prevention research
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
            Distribution of round formats over the past 90 days
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: s.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#475569',
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: 4,
                        padding: '1px 6px',
                      }}
                    >
                      {s.desc}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.pct}%</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: '#1a1a1a',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${s.pct}%`,
                      background: s.color,
                      borderRadius: 999,
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
            Weekly Calorie Output
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Total active calories burned per week — last 8 weeks
          </p>

          {/* Bar chart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              height: 140,
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
                      background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                      borderRadius: '5px 5px 3px 3px',
                      minHeight: 4,
                      boxShadow: '0 0 8px rgba(34,197,94,0.25)',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#64748b' }}>{w.week}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science cards ──────────────────────────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#e2e8f0',
              margin: '0 0 16px',
              letterSpacing: '-0.2px',
            }}
          >
            The Science
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
          <div style={{ padding: '16px 20px 12px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 2px' }}>
              Recent Sessions
            </h3>
            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Last 5 rounds and practice sessions</p>
          </div>

          <div>
            {RECENT_SESSIONS.map((session, idx) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderTop: idx === 0 ? '1px solid #1a1a1a' : '1px solid #161616',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
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
                        margin: '0 0 2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.type}
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{session.date}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 1px' }}>{session.duration}</p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>duration</p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 64 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#16a34a',
                        margin: '0 0 1px',
                      }}
                    >
                      {session.kcal.toLocaleString()} kcal
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>burned</p>
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
