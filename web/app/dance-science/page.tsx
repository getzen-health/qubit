'use client'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '84', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '62 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '487 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Performance / Rehearsal', desc: '≥ 90 min', pct: 18, color: '#ec4899' },
  { name: 'Dance Class', desc: '60 – 90 min', pct: 42, color: '#f472b6' },
  { name: 'Social Dancing', desc: '30 – 60 min', pct: 28, color: '#f9a8d4' },
  { name: 'Cardio Dance', desc: '< 30 min', pct: 12, color: '#fce7f3' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 2840 },
  { week: 'Wk 2', kcal: 3760 },
  { week: 'Wk 3', kcal: 1920 },
  { week: 'Wk 4', kcal: 4510 },
  { week: 'Wk 5', kcal: 3280 },
  { week: 'Wk 6', kcal: 2650 },
  { week: 'Wk 7', kcal: 4120 },
  { week: 'Wk 8', kcal: 3490 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const RECENT_SESSIONS = [
  { id: '1', date: 'Fri, Mar 14', type: 'Dance Class', duration: '75 min', kcal: 512 },
  { id: '2', date: 'Tue, Mar 11', type: 'Social Dancing', duration: '48 min', kcal: 344 },
  { id: '3', date: 'Sat, Mar 8', type: 'Performance / Rehearsal', duration: '110 min', kcal: 798 },
  { id: '4', date: 'Thu, Mar 6', type: 'Cardio Dance', duration: '25 min', kcal: 218 },
  { id: '5', date: 'Mon, Mar 3', type: 'Dance Class', duration: '68 min', kcal: 481 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '🩰',
    title: 'Movement Science & Biomechanics',
    accent: '#ec4899',
    accentBg: 'rgba(236,72,153,0.12)',
    accentBorder: 'rgba(236,72,153,0.3)',
    facts: [
      {
        label: 'Laws 2002: ballet pirouette spotting reduces angular deceleration via visual stabilisation',
        value: '−30% decel',
      },
      {
        label: 'Bronner 2010: elite dancers show greater hip range of motion vs. non-dancer athletes',
        value: '+15–25% ROM',
      },
      {
        label: 'Hackney 2009: tango partner coordination reduces postural sway vs. solo balance training',
        value: '−40% sway',
      },
      {
        label: 'Leanderson 1996: ground reaction forces during pointe work',
        value: '2.5–3.5× BW GRF',
      },
    ],
  },
  {
    emoji: '🔥',
    title: 'Metabolic Demands & Fitness',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.12)',
    accentBorder: 'rgba(168,85,247,0.3)',
    facts: [
      {
        label: 'Wyon 2004: aerobic capacity in professional ballet dancers',
        value: 'VO₂max 48–54 mL/kg/min',
      },
      {
        label: 'Cohen 1982: allegro combinations reach high-intensity metabolic zones',
        value: '8–10 METs',
      },
      {
        label: 'Rodrigues-Krause 2015: Zumba improves cardiorespiratory fitness over 12 weeks',
        value: '6.1–8.5 METs · +7% VO₂',
      },
      {
        label: 'Angioi 2009: plyometric supplementary training improves explosive power in dancers',
        value: '+9% jump height',
      },
    ],
  },
  {
    emoji: '🧠',
    title: 'Rhythm, Cognition & Brain Health',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.3)',
    facts: [
      {
        label: 'Verghese 2003: frequent dancing reduces dementia risk — highest protective effect of any activity tested in 21-year study',
        value: '−76% dementia risk',
      },
      {
        label: 'Müller 2017: dance training shows greater hippocampal volume growth vs. endurance cycling',
        value: '+hippocampal growth',
      },
      {
        label: 'Brown 2006: dance simultaneously activates cerebellum, basal ganglia, and prefrontal cortex',
        value: '3-region activation',
      },
      {
        label: 'Coubard 2011: Argentine tango reduces motor symptom severity in Parkinson\'s patients',
        value: '−20% UPDRS score',
      },
    ],
  },
  {
    emoji: '🩺',
    title: 'Injury Prevention',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.3)',
    facts: [
      {
        label: 'Bronner 2006: professional dancers injury rate; ankle 28%, back 22%, knee 18% of all injuries',
        value: '1.24 / 1,000 h',
      },
      {
        label: 'Smith 2015: stress fractures in dancers linked to Relative Energy Deficiency in Sport (RED-S)',
        value: '60% energy deficient',
      },
      {
        label: 'Koutedakis 2009: off-season strength & conditioning programme reduces in-season injury incidence',
        value: '−31% injury rate',
      },
      {
        label: 'Liederbach 2012: ACL injury rate in dancers vs. soccer players — dance-specific mechanics protective',
        value: '0.12 vs. 0.8 / 1,000 h',
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
      <p style={{ fontSize: 26, fontWeight: 800, color: '#ec4899', margin: 0, letterSpacing: '-0.5px' }}>
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
  if (type === 'Performance / Rehearsal') return '#ec4899'
  if (type === 'Dance Class') return '#f472b6'
  if (type === 'Social Dancing') return '#f9a8d4'
  return '#fce7f3'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DanceSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Hero Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a0010 0%, #0f0008 40%, #0a0a0a 100%)',
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
            background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)',
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
              background: 'rgba(236,72,153,0.15)',
              border: '1px solid rgba(236,72,153,0.3)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            💃
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #ec4899, #f472b6, #f9a8d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Dance Science
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
            Movement biomechanics · metabolic demands &amp; fitness · rhythm, cognition &amp; brain health ·
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
            Distribution of dance session formats over the past 90 days
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
                      background: 'linear-gradient(180deg, #f472b6 0%, #ec4899 100%)',
                      borderRadius: '5px 5px 3px 3px',
                      minHeight: 4,
                      boxShadow: '0 0 8px rgba(236,72,153,0.3)',
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
            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Last 5 dance sessions</p>
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
                        color: '#ec4899',
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
