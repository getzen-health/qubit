'use client'

import { SummaryCard } from '@/components/ui/summary-card'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '61', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '112 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '548 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Outdoor Multi-Pitch', desc: '≥ 3 h', pct: 18, color: '#92400e' },
  { name: 'Outdoor Single Pitch', desc: '1–3 h', pct: 27, color: '#b45309' },
  { name: 'Indoor Lead / Top-rope', desc: '1–2.5 h', pct: 38, color: '#d97706' },
  { name: 'Bouldering', desc: '< 1.5 h', pct: 17, color: '#fbbf24' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 1120 },
  { week: 'Wk 2', kcal: 1640 },
  { week: 'Wk 3', kcal: 980 },
  { week: 'Wk 4', kcal: 2140 },
  { week: 'Wk 5', kcal: 1780 },
  { week: 'Wk 6', kcal: 1380 },
  { week: 'Wk 7', kcal: 2310 },
  { week: 'Wk 8', kcal: 1950 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const RECENT_SESSIONS = [
  { id: '1', date: 'Thu, Mar 13', type: 'Outdoor Multi-Pitch', duration: '204 min', kcal: 874 },
  { id: '2', date: 'Sun, Mar 9', type: 'Indoor Lead / Top-rope', duration: '95 min', kcal: 512 },
  { id: '3', date: 'Fri, Mar 7', type: 'Bouldering', duration: '72 min', kcal: 389 },
  { id: '4', date: 'Tue, Mar 4', type: 'Outdoor Single Pitch', duration: '138 min', kcal: 631 },
  { id: '5', date: 'Sat, Mar 1', type: 'Indoor Lead / Top-rope', duration: '88 min', kcal: 476 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '🤚',
    title: 'Finger & Grip Physiology',
    accent: '#d97706',
    accentBg: 'rgba(217,119,6,0.12)',
    accentBorder: 'rgba(217,119,6,0.3)',
    facts: [
      {
        label: 'Schweizer 2001: crimp grip A2 pulley force — half-crimp reduces force by 30%',
        value: '380–420 N',
      },
      {
        label: 'Vigouroux 2006: FDP + FDS combined force on hard boulder problems',
        value: '> 1,200 N',
      },
      {
        label: 'MacLeod 2007: elite flexor CSA advantage — hangboard increases strength',
        value: '+40% CSA · +22% strength',
      },
      {
        label: 'España-Romero 2009: forearm VO₂peak — 4× resting metabolic rate',
        value: '35–40 mL/100g/min',
      },
    ],
  },
  {
    emoji: '🧗',
    title: 'Movement Biomechanics',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.3)',
    facts: [
      {
        label: 'Fuss 2012: hip-in flagging reduces arm load on overhangs',
        value: '35–45% reduction',
      },
      {
        label: 'Quaine 1997: optimal hip-to-wall distance minimising blood-flow restriction',
        value: '20–35 cm',
      },
      {
        label: 'Billat 1995: experienced climbers save energy per meter via reduced co-contraction',
        value: '28% less energy',
      },
      {
        label: 'Niechwiej-Szwedo 2005: sequence preview advantage — experts vs. novices',
        value: '1.8 s vs. 0.4 s',
      },
    ],
  },
  {
    emoji: '📈',
    title: 'Training Systems',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.3)',
    facts: [
      {
        label: 'Mermier 2000: technique variance vs. grip strength variance in performance',
        value: '48% vs. 18%',
      },
      {
        label: 'Fryer 2011: 18 mm hangboard — 2× strength gain but 3× injury risk vs. 22–24 mm optimal',
        value: 'Avoid < 20 mm',
      },
      {
        label: 'Anderson 2014: repeater protocol (7 s on / 3 s off) — contact strength gain in 8 weeks',
        value: '+24%',
      },
      {
        label: 'Baláš 2012: campus board training improves contact strength reaction time',
        value: '31 ms → 18 ms',
      },
    ],
  },
  {
    emoji: '🩹',
    title: 'Injury Prevention',
    accent: '#eab308',
    accentBg: 'rgba(234,179,8,0.12)',
    accentBorder: 'rgba(234,179,8,0.3)',
    facts: [
      {
        label: 'Bollen 1988: A2 pulley rupture share of all climbing injuries — MRI gold standard',
        value: '30% of injuries',
      },
      {
        label: 'Pieber 2012: overall injury rate — overuse injuries share',
        value: '4.2 / 1,000 h · 77% overuse',
      },
      {
        label: 'Rohrbough 2000: epiphyseal plate fractures in youth climbers under 17 years',
        value: 'High risk < 17 yrs',
      },
      {
        label: 'Schöffl 2013: UIAA 6-week return protocol — eccentric flexor training reduces epicondylitis',
        value: '−68% epicondylitis',
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionTypeColor(type: string): string {
  if (type === 'Outdoor Multi-Pitch') return '#92400e'
  if (type === 'Outdoor Single Pitch') return '#b45309'
  if (type === 'Indoor Lead / Top-rope') return '#d97706'
  return '#fbbf24'
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RockClimbingSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1c0f00 0%, #0f0800 40%, #0a0a0a 100%)',
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
            background: 'radial-gradient(circle, rgba(146,64,14,0.18) 0%, transparent 70%)',
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
              background: 'rgba(146,64,14,0.18)',
              border: '1px solid rgba(146,64,14,0.35)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            🧗
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #92400e, #d97706, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Rock Climbing Science
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
            Finger physiology · movement biomechanics · training system research ·
            injury prevention evidence
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

        {/* ── Grade scale note ──────────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderLeft: '3px solid #92400e',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 220 }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🪨</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#d97706', margin: '0 0 2px' }}>
                YDS — Yosemite Decimal System
              </p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                5.0–5.7 beginner · 5.8–5.10 intermediate · 5.11–5.12 advanced · 5.13–5.15 elite
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 220 }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🪵</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#d97706', margin: '0 0 2px' }}>
                V-Scale — Hueco System (Bouldering)
              </p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                V0–V2 beginner · V3–V5 intermediate · V6–V8 advanced · V9–V17 elite
              </p>
            </div>
          </div>
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
            Distribution of climbing formats over the past 90 days
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
            Active calories from all climbing sessions per week
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
                      color: '#d97706',
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
                      background: 'linear-gradient(180deg, #d97706, #92400e)',
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
                    color: '#0a0a0a',
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>
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
          Research references: Schweizer 2001 · Vigouroux et al. 2006 · MacLeod et al. 2007 ·
          España-Romero et al. 2009 · Fuss & Niegl 2012 · Quaine et al. 1997 · Billat et al. 1995 ·
          Niechwiej-Szwedo et al. 2005 · Mermier et al. 2000 · Fryer et al. 2011 ·
          Anderson & Anderson 2014 · Baláš et al. 2012 · Bollen 1988 · Pieber et al. 2012 ·
          Rohrbough et al. 2000 · Schöffl et al. 2013
        </p>
      </main>
    </div>
  )
}
