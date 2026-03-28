'use client'

import { SummaryCard } from '@/components/ui/summary-card'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '87', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '38 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '412 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Long Steady State', desc: '≥ 60 min', pct: 32, color: '#2563eb' },
  { name: 'Threshold Piece', desc: '30 – 60 min', pct: 38, color: '#3b82f6' },
  { name: 'Interval Training', desc: '20 – 45 min', pct: 22, color: '#60a5fa' },
  { name: 'Race Piece', desc: '< 20 min', pct: 8, color: '#93c5fd' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 2840 },
  { week: 'Wk 2', kcal: 3610 },
  { week: 'Wk 3', kcal: 1980 },
  { week: 'Wk 4', kcal: 4220 },
  { week: 'Wk 5', kcal: 3450 },
  { week: 'Wk 6', kcal: 2760 },
  { week: 'Wk 7', kcal: 4870 },
  { week: 'Wk 8', kcal: 3930 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const RECENT_SESSIONS = [
  { id: '1', date: 'Thu, Mar 19', type: 'Threshold Piece', duration: '35 min', kcal: 478 },
  { id: '2', date: 'Mon, Mar 16', type: 'Interval Training', duration: '28 min', kcal: 394 },
  { id: '3', date: 'Sat, Mar 14', type: 'Long Steady State', duration: '65 min', kcal: 712 },
  { id: '4', date: 'Wed, Mar 11', type: 'Race Piece', duration: '12 min', kcal: 241 },
  { id: '5', date: 'Sun, Mar 8', type: 'Threshold Piece', duration: '42 min', kcal: 531 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '🚣',
    title: 'Stroke Biomechanics',
    accent: '#2563eb',
    accentBg: 'rgba(37,99,235,0.12)',
    accentBorder: 'rgba(37,99,235,0.3)',
    facts: [
      {
        label:
          'Kleshnev 2016: optimal catch angle −55° to −60° from vertical; legs produce 55–65% of stroke power with the remainder shared between trunk and arms',
        value: 'legs 55–65% of power',
      },
      {
        label:
          'Soper 2004: blade efficiency (propulsive force / total force applied) measured at 0.72–0.78 in elite scullers; novices average 0.55–0.62 indicating significant slip loss',
        value: 'blade eff. 0.72–0.78 elite',
      },
      {
        label:
          'Baudouin 2002: elite crews reduce boat velocity fluctuation within the stroke cycle by approximately 40% compared to novices, indicating superior timing and coordination',
        value: '−40% velocity fluctuation',
      },
      {
        label:
          'Yoshiga 2000: Olympic-level ergometer stroke rate 36–40 spm; leg press force at catch averages 800–1,200 N in heavyweight men across competitive race simulations',
        value: '36–40 spm · 800–1,200 N',
      },
    ],
  },
  {
    emoji: '🫁',
    title: 'Physiology & VO₂ Demands',
    accent: '#0891b2',
    accentBg: 'rgba(8,145,178,0.12)',
    accentBorder: 'rgba(8,145,178,0.3)',
    facts: [
      {
        label:
          'Hagerman 1984: 2,000m rowing race reaches 98–100% VO₂max; elite male rowers demonstrate absolute VO₂max values of 6.0–7.5 L/min, among the highest recorded in any sport',
        value: '98–100% VO₂max · 6.0–7.5 L/min',
      },
      {
        label:
          'Ingham 2002: lactate threshold 2 (LT2) occurs at 85–92% VO₂max in elite rowers; blood lactate at race pace is 4–6 mmol/L indicating predominantly aerobic with significant anaerobic contribution',
        value: 'LT2 at 85–92% VO₂max',
      },
      {
        label:
          'Steinacker 1993: rowing engages approximately 86% of total muscle mass, more than any other Olympic sport; cardiac output peaks at 35–40 L/min during maximal efforts',
        value: '86% muscle mass · 35–40 L/min CO',
      },
      {
        label:
          'Secher 1983: optimal power contribution ratio between upper and lower body found to be 37:63 (upper:lower); deviation from this ratio significantly reduces rowing efficiency',
        value: 'upper/lower power ratio 37:63',
      },
    ],
  },
  {
    emoji: '🖥️',
    title: 'Ergometer Training Science',
    accent: '#0d9488',
    accentBg: 'rgba(13,148,136,0.12)',
    accentBorder: 'rgba(13,148,136,0.3)',
    facts: [
      {
        label:
          'Concept2: drag factor 100–130 correlates most closely with on-water resistance for standard rowing shells; elite rowers typically train at drag factor 110–125 for specificity',
        value: 'drag factor 100–130 optimal',
      },
      {
        label:
          'Bourgois 2000: elite junior rowers accumulate 900–1,200 km/year on the ergometer with polarized distribution — 70% low intensity, 15% threshold, 15% high intensity',
        value: '70/15/15% polarized distribution',
      },
      {
        label:
          'Volianitis 2001: 11 weeks of inspiratory muscle training adding +10 cmH₂O pressure improved 2,000m ergometer performance by 1.5% in well-trained competitive rowers',
        value: 'IMT +10 cmH₂O → 2k −1.5%',
      },
      {
        label:
          'Maestu 2005: 2–3 week pre-competition taper reducing volume by 50% while maintaining intensity preserved power output and improved 2k time trial performance in national-level rowers',
        value: '2–3 wk taper, −50% volume',
      },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Injury Prevention',
    accent: '#dc2626',
    accentBg: 'rgba(220,38,38,0.12)',
    accentBorder: 'rgba(220,38,38,0.3)',
    facts: [
      {
        label:
          'Hosea 1990: low back pain reported in 72% of elite rowers; L4–L5 spinal compression forces reach 6,000–8,000 N at the catch position, exceeding NIOSH maximum recommended limits',
        value: '72% LBP · 6,000–8,000 N L4–L5',
      },
      {
        label:
          'Rumball 2005: rib stress fractures cluster at the serratus anterior insertion (ribs 5–9); female rowers face 2× higher fracture risk than males, linked to lower bone density and higher stroke volume',
        value: 'women 2× rib stress fracture risk',
      },
      {
        label:
          'Smoljanovic 2009: overall rowing injury rate of 3.7 injuries per 1,000 training hours; overuse injuries account for 75% of all cases with lower back (39%) and knee (18%) most prevalent',
        value: '3.7 / 1,000 h · 75% overuse',
      },
      {
        label:
          'Karlson 2000: wrist extensor tendinopathy (intersection syndrome) reported in 14% of competitive scullers annually; attributed to repetitive wrist motion during feathering of the blade',
        value: '14% scullers/year wrist tendinopathy',
      },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  if (type === 'Long Steady State') return '#2563eb'
  if (type === 'Threshold Piece') return '#3b82f6'
  if (type === 'Interval Training') return '#60a5fa'
  if (type === 'Race Piece') return '#93c5fd'
  return '#2563eb'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RowingSciencePage() {
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
            🚣
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
            Rowing Science
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
            Stroke biomechanics &amp; blade efficiency · VO₂ demands &amp; lactate physiology · ergometer
            training science &amp; injury prevention research
          </p>

          {/* Concept2 note */}
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
            <span style={{ fontSize: 13 }}>🖥️</span>
            <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 500 }}>
              The Concept2 ergometer is the gold standard for rowing training and performance measurement worldwide
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
            <SummaryCard key={s.label} title={s.label} value={s.value} subtitle={s.sub} />
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
            Distribution of rowing training formats over the past 90 days
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
            Total active energy across all rowing sessions per week
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
