'use client'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '112', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '48 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '534 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'CrossFit / HIIT', desc: '20 – 60 min', pct: 38, color: '#dc2626' },
  { name: 'Functional Strength', desc: '45 – 75 min', pct: 31, color: '#ef4444' },
  { name: 'Circuit Training', desc: '30 – 50 min', pct: 22, color: '#f87171' },
  { name: 'Recovery / Mobility', desc: '< 30 min', pct: 9, color: '#fca5a5' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 3240 },
  { week: 'Wk 2', kcal: 4810 },
  { week: 'Wk 3', kcal: 2760 },
  { week: 'Wk 4', kcal: 5390 },
  { week: 'Wk 5', kcal: 4120 },
  { week: 'Wk 6', kcal: 3580 },
  { week: 'Wk 7', kcal: 5040 },
  { week: 'Wk 8', kcal: 4430 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const RECENT_SESSIONS = [
  { id: '1', date: 'Thu, Mar 19', type: 'CrossFit WOD', duration: '42 min', kcal: 618 },
  { id: '2', date: 'Tue, Mar 17', type: 'Functional Strength', duration: '58 min', kcal: 487 },
  { id: '3', date: 'Sun, Mar 15', type: 'Circuit Training', duration: '35 min', kcal: 512 },
  { id: '4', date: 'Fri, Mar 13', type: 'HIIT', duration: '28 min', kcal: 441 },
  { id: '5', date: 'Wed, Mar 11', type: 'Recovery / Mobility', duration: '22 min', kcal: 148 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '🏋️',
    title: 'CrossFit & HIIT Physiology',
    accent: '#dc2626',
    accentBg: 'rgba(220,38,38,0.12)',
    accentBorder: 'rgba(220,38,38,0.3)',
    facts: [
      {
        label: 'Glassman 2002: CrossFit targets 10 physical skills — cardiovascular, stamina, strength, flexibility, power, speed, coordination, agility, balance, accuracy',
        value: '10 physical skills',
      },
      {
        label: 'Smith 2013: Fran WOD (21-15-9 thrusters / pull-ups) elicits near-maximal cardiovascular response with high blood lactate accumulation',
        value: '98% HRmax · 12–18 mmol/L',
      },
      {
        label: 'Heinrich 2014: 10-week CrossFit program significantly improves aerobic capacity and reduces fat mass in previously untrained individuals',
        value: '+9.1% VO₂max · −1.6 kg fat',
      },
      {
        label: 'Mangine 2015: concurrent strength + MetCon training interference minimized by performing strength movements before metabolic conditioning in same session',
        value: 'strength-first order',
      },
    ],
  },
  {
    emoji: '⚡',
    title: 'Metabolic Conditioning Science',
    accent: '#ea580c',
    accentBg: 'rgba(234,88,12,0.12)',
    accentBorder: 'rgba(234,88,12,0.3)',
    facts: [
      {
        label: 'Tabata 1996: 20-sec on / 10-sec off protocol performed 8 rounds, 5 days/week for 6 weeks, produces superior aerobic and anaerobic adaptations vs. moderate-intensity training',
        value: '+14% VO₂max · +28% AnCap',
      },
      {
        label: 'Burpee WOD: excess post-exercise oxygen consumption (EPOC) remains significantly elevated well into the next day following high-intensity bouts',
        value: 'EPOC +14–16% for 24–48h',
      },
      {
        label: 'Boutcher 2011: HIIT protocol reduces visceral adipose tissue more effectively than volume-matched steady-state cardio over 12 weeks',
        value: '−17% visceral fat vs. −8%',
      },
      {
        label: 'Laursen 2002: repeated sprint ability improves substantially more with HIIT than with continuous moderate-intensity training in well-trained cyclists',
        value: 'RSA +12% vs. +3% continuous',
      },
    ],
  },
  {
    emoji: '🔄',
    title: 'Recovery & Adaptation',
    accent: '#ca8a04',
    accentBg: 'rgba(202,138,4,0.12)',
    accentBorder: 'rgba(202,138,4,0.3)',
    facts: [
      {
        label: 'Kellmann 2002: HRV suppression greater than 15% from individual baseline reliably predicts measurable performance decrement and should trigger a recovery day',
        value: 'HRV drop >15% = warning',
      },
      {
        label: 'Peake 2017: post-HIIT creatine kinase (muscle damage marker) peaks 24–48 hours after strenuous cross-training bouts; elevated CK correlates with soreness and performance reduction',
        value: 'CK 300–1,200 U/L at 24–48h',
      },
      {
        label: 'Stöggl 2014: polarized 80/20 training (80% low-intensity, 20% high-intensity) produces greater VO₂max gains vs. threshold or HIT-only approaches over 9 weeks',
        value: '+11.7% VO₂max vs. +8.2%',
      },
      {
        label: 'Helms 2014: for muscle retention and hypertrophy during concurrent training, protein intake of 1.6–2.2 g/kg/day with leucine threshold per meal is required',
        value: '1.6–2.2 g/kg/day · 2.5–3 g leu/meal',
      },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Injury Prevention',
    accent: '#16a34a',
    accentBg: 'rgba(22,163,74,0.12)',
    accentBorder: 'rgba(22,163,74,0.3)',
    facts: [
      {
        label: 'Hak 2013: CrossFit injury rate of 3.1 per 1,000 training hours is comparable to Olympic weightlifting and gymnastics; shoulder 25%, lower back 22%, knee 14% of all injuries',
        value: '3.1 / 1,000 h training',
      },
      {
        label: 'Summitt 2016: rhabdomyolysis risk is highest in the first 2 weeks of starting CrossFit — beginners should scale loads to ≤60% of prescribed volume during onboarding',
        value: 'scale to ≤60% in wks 1–2',
      },
      {
        label: 'Moran 2017: Functional Movement Screen score of 14 or below predicts injury with an odds ratio of 3.8 in recreational CrossFit athletes across a 12-month follow-up period',
        value: 'FMS ≤14 → OR 3.8 injury',
      },
      {
        label: 'Weisenthal 2014: athletes who trained under qualified coaches sustained significantly fewer injuries than those who self-programmed or trained without supervision',
        value: 'coached athletes −25% injuries',
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
      <p style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', margin: 0, letterSpacing: '-0.5px' }}>
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
  if (type === 'CrossFit WOD' || type === 'CrossFit / HIIT') return '#dc2626'
  if (type === 'Functional Strength') return '#ef4444'
  if (type === 'Circuit Training') return '#f87171'
  if (type === 'HIIT') return '#ef4444'
  return '#fca5a5'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CrossTrainingSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Hero Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a0000 0%, #0f0000 40%, #0a0a0a 100%)',
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
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(220,38,38,0.16) 0%, transparent 70%)',
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
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.35)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            🔥
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #dc2626, #ef4444, #f87171)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Cross-Training Science
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              margin: '0 auto',
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            CrossFit physiology &amp; WOD analysis · metabolic conditioning &amp; EPOC · recovery adaptation
            &amp; injury prevention research
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
            Distribution of cross-training formats over the past 90 days
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
            Total active energy across all cross-training sessions per week
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
                      background: 'linear-gradient(to top, #dc2626, #ef4444)',
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
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', margin: 0 }}>
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
