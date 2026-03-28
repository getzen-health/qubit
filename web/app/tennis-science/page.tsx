'use client'

import { SummaryCard } from '@/components/ui/summary-card'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '62', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '74 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '584 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Match Play', desc: '≥90 min', pct: 28, color: '#EAB308' },
  { name: 'Practice Set', desc: '60–90 min', pct: 34, color: '#facc15' },
  { name: 'Drills & Rallying', desc: '30–60 min', pct: 27, color: '#fde047' },
  { name: 'Serve Practice', desc: '<30 min', pct: 11, color: '#fef08a' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 1620 },
  { week: 'Wk 2', kcal: 2140 },
  { week: 'Wk 3', kcal: 1480 },
  { week: 'Wk 4', kcal: 2390 },
  { week: 'Wk 5', kcal: 1970 },
  { week: 'Wk 6', kcal: 2210 },
  { week: 'Wk 7', kcal: 2680 },
  { week: 'Wk 8', kcal: 2050 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const RECENT_SESSIONS = [
  { id: '1', date: 'Fri, Mar 14', type: 'Match Play', duration: '96 min', kcal: 712 },
  { id: '2', date: 'Tue, Mar 11', type: 'Practice Set', duration: '72 min', kcal: 541 },
  { id: '3', date: 'Sat, Mar 8', type: 'Match Play', duration: '104 min', kcal: 768 },
  { id: '4', date: 'Wed, Mar 5', type: 'Drills & Rallying', duration: '45 min', kcal: 338 },
  { id: '5', date: 'Sat, Mar 1', type: 'Serve Practice', duration: '24 min', kcal: 178 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '🎾',
    title: 'Serve Biomechanics',
    accent: '#EAB308',
    accentBg: 'rgba(234,179,8,0.12)',
    accentBorder: 'rgba(234,179,8,0.3)',
    facts: [
      {
        label: 'Roetert 1995: elite serve velocity range; ball-racket contact time',
        value: '180–200 km/h · <5 ms',
      },
      {
        label: 'Elliott 2003: shoulder internal rotation contribution to serve velocity; forearm pronation share',
        value: '44% · 30%',
      },
      {
        label: 'Reid 2007: knee bend angle at trophy position correlated with serve speed (r=0.71)',
        value: '60–75° knee bend',
      },
      {
        label: 'Bahamonde 2000: racket head speed at ball contact in professional players',
        value: '33–37 m/s',
      },
    ],
  },
  {
    emoji: '🏃',
    title: 'Movement & Court Coverage',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.12)',
    accentBorder: 'rgba(34,197,94,0.3)',
    facts: [
      {
        label: 'Kovacs 2006: direction changes per match; shots requiring lateral movement',
        value: '300–500 · 72%',
      },
      {
        label: 'Fernandez 2006: ATP player distance per match; work-to-rest ratio',
        value: '8–15 km · ~1:3',
      },
      {
        label: 'Reid 2012: optimal split-step timing before opponent ball contact',
        value: '120–150 ms',
      },
      {
        label: 'Girard 2011: CMJ height decline and sprint speed reduction after a five-set match',
        value: '−5.3% CMJ · −2.1% sprint',
      },
    ],
  },
  {
    emoji: '⚡',
    title: 'Energy Systems & Physiology',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.3)',
    facts: [
      {
        label: 'Kovacs 2007: contribution of aerobic, PCr/ATP, and glycolytic systems during match play',
        value: '70% · 20% · 10%',
      },
      {
        label: 'Smekal 2001: average heart rate and blood lactate concentration during match',
        value: '155–165 bpm · 2–4 mmol/L',
      },
      {
        label: 'Hornery 2007: sweat fluid loss rate per hour in hot conditions',
        value: '1.5–2.5 L/hr',
      },
      {
        label: 'Christmass 1998: VO₂max range for ATP professional players',
        value: '60–65 mL/kg/min',
      },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Injury Prevention',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.3)',
    facts: [
      {
        label: 'Abrams 2012: prevalence of lateral epicondylalgia (tennis elbow) in recreational players',
        value: '40–50% affected',
      },
      {
        label: 'Kibler 2013: glenohumeral internal rotation deficit >20° as primary rotator cuff predictor',
        value: 'GIRD >20°',
      },
      {
        label: 'Hutchinson 1995: patellar tendinopathy prevalence among clay-court players',
        value: '32% prevalence',
      },
      {
        label: 'Pluim 2006: injury rate reduction from structured warm-up programs',
        value: '28–35% reduction',
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionTypeColor(type: string): string {
  if (type === 'Match Play') return '#EAB308'
  if (type === 'Practice Set') return '#facc15'
  if (type === 'Drills & Rallying') return '#fde047'
  return '#fef08a'
}

function sessionTypeFg(type: string): string {
  // All yellow shades are light enough that dark text is needed
  return '#0a0a0a'
}

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
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
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
            <span
              style={{
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.5,
                flex: 1,
              }}
            >
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TennisSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1400 0%, #0f0b00 40%, #0a0a0a 100%)',
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
            background:
              'radial-gradient(circle, rgba(234,179,8,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Sport icon badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(234,179,8,0.15)',
              border: '1px solid rgba(234,179,8,0.3)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            🎾
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #EAB308, #facc15, #fde68a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Tennis Science
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
            Serve biomechanics · movement science · energy systems & physiology ·
            evidence-based injury prevention
          </p>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
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
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#e2e8f0',
              margin: '0 0 4px',
            }}
          >
            Session Type Breakdown
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Distribution of training formats over the past 90 days
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
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}
                    >
                      {s.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{s.desc}</span>
                  </div>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: s.color }}
                  >
                    {s.pct}%
                  </span>
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

        {/* ── Weekly calorie chart ──────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '20px 20px 24px',
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#e2e8f0',
              margin: '0 0 4px',
            }}
          >
            Weekly Calories Burned — Last 8 Weeks
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Active calories from all tennis sessions per week
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
                  {/* kcal label above bar */}
                  <span
                    style={{
                      fontSize: 10,
                      color: '#EAB308',
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
                      background: 'linear-gradient(180deg, #EAB308, #a16207)',
                      borderRadius: '4px 4px 2px 2px',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  {/* Week label */}
                  <span
                    style={{ fontSize: 10, color: '#475569', marginTop: 4 }}
                  >
                    {w.week}
                  </span>
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
            <h3
              style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}
            >
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
                  borderBottom:
                    i < RECENT_SESSIONS.length - 1
                      ? '1px solid #161616'
                      : 'none',
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
                    width: 100,
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
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {s.duration}
                  </span>
                </div>

                {/* Calories */}
                <div
                  style={{
                    textAlign: 'right',
                    flexShrink: 0,
                    minWidth: 72,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#EAB308',
                    }}
                  >
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
          Research references: Roetert et al. 1995 · Elliott et al. 2003 · Reid et al. 2007 ·
          Bahamonde 2000 · Kovacs 2006 · Fernandez et al. 2006 · Reid et al. 2012 ·
          Girard et al. 2011 · Kovacs 2007 · Smekal et al. 2001 · Hornery et al. 2007 ·
          Christmass et al. 1998 · Abrams et al. 2012 · Kibler et al. 2013 ·
          Hutchinson et al. 1995 · Pluim et al. 2006
        </p>
      </main>
    </div>
  )
}
