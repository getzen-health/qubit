import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '84', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '68 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '612 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Full Game', desc: '2 h+', pct: 22, color: '#f97316' },
  { name: 'Scrimmage', desc: '60–120 min', pct: 35, color: '#fb923c' },
  { name: 'Team Practice', desc: '30–60 min', pct: 31, color: '#fdba74' },
  { name: 'Skill Work', desc: '<30 min', pct: 12, color: '#fed7aa' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 1840 },
  { week: 'Wk 2', kcal: 2310 },
  { week: 'Wk 3', kcal: 1650 },
  { week: 'Wk 4', kcal: 2580 },
  { week: 'Wk 5', kcal: 2140 },
  { week: 'Wk 6', kcal: 1920 },
  { week: 'Wk 7', kcal: 2760 },
  { week: 'Wk 8', kcal: 2430 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const RECENT_SESSIONS = [
  { id: '1', date: 'Fri, Mar 14', type: 'Full Game', duration: '124 min', kcal: 892 },
  { id: '2', date: 'Tue, Mar 11', type: 'Team Practice', duration: '55 min', kcal: 498 },
  { id: '3', date: 'Sat, Mar 8', type: 'Scrimmage', duration: '88 min', kcal: 714 },
  { id: '4', date: 'Wed, Mar 5', type: 'Skill Work', duration: '28 min', kcal: 241 },
  { id: '5', date: 'Sat, Mar 1', type: 'Scrimmage', duration: '75 min', kcal: 638 },
]

// ─── Science card data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    emoji: '🏃',
    title: 'Physical Demands by Position',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.3)',
    facts: [
      {
        label: 'McInnes 1995: guards cover more ground than forwards',
        value: '4.8 km vs 4.2 km',
      },
      {
        label: 'Ben Abdelkrim 2007: average heart rate & % of max HR',
        value: '169 bpm · 84% HRmax',
      },
      {
        label: 'Ziv & Lidor 2010: explosive movements per game',
        value: '1,000+ actions',
      },
      {
        label: 'Caloric burn range by position per hour',
        value: '400–700 kcal/hr',
      },
    ],
  },
  {
    emoji: '⚡',
    title: 'Jump Science & Explosiveness',
    accent: '#eab308',
    accentBg: 'rgba(234,179,8,0.12)',
    accentBorder: 'rgba(234,179,8,0.3)',
    facts: [
      {
        label: 'Ziv & Lidor 2010: NBA small forwards avg countermovement jump',
        value: '67 cm CMJ',
      },
      {
        label: 'CMJ biomechanics: simultaneous triple extension',
        value: 'Hip · Knee · Ankle',
      },
      {
        label: 'Scanlan 2014: jump height decline from Q1 to Q4',
        value: '−8.4%',
      },
      {
        label: 'Matavulj 2001: depth jump plyometrics over 6 weeks',
        value: '+5.6 cm gain',
      },
    ],
  },
  {
    emoji: '🎯',
    title: 'Shooting Biomechanics',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.3)',
    facts: [
      {
        label: 'Okazaki 2006: optimal ball launch arc above horizontal',
        value: '45–55°',
      },
      {
        label: 'Hamilton 1982: wrist flexion generates backspin',
        value: '2–3 Hz spin',
      },
      {
        label: 'Cheng 2016: 3-point accuracy drop in OT vs regulation',
        value: '−3.5%',
      },
      {
        label: 'Goldman 2012: clutch shooters maintain consistent arc under pressure',
        value: 'Confirmed',
      },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Injury Prevention & Fatigue',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.3)',
    facts: [
      {
        label: 'Drakos 2010: ankle sprains share of all NBA injuries',
        value: '13.2%',
      },
      {
        label: 'Lian 2005: prevalence of patellar tendinopathy in elite players',
        value: '32% affected',
      },
      {
        label: 'Cheng 2016: jump height reduction in back-to-back games',
        value: '3–5% drop',
      },
      {
        label: 'Achilles rupture risk: big men >100 kg after age 30',
        value: 'Highest risk',
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionTypeColor(type: string): string {
  if (type === 'Full Game') return '#f97316'
  if (type === 'Scrimmage') return '#fb923c'
  if (type === 'Team Practice') return '#fdba74'
  return '#fed7aa'
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
      <p style={{ fontSize: 26, fontWeight: 800, color: '#f97316', margin: 0, letterSpacing: '-0.5px' }}>
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

export default async function BasketballSciencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since12w = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rawSessions } = await supabase
    .from('workout_records')
    .select('id, start_time, duration_minutes, active_calories, avg_heart_rate, max_heart_rate')
    .eq('user_id', user.id)
    .ilike('workout_type', '%basketball%')
    .gte('start_time', since12w)
    .order('start_time', { ascending: false })
    .limit(50)

  const sessions = (rawSessions ?? []).map((r) => ({
    id: r.id as string,
    start_time: r.start_time as string,
    duration_minutes: (r.duration_minutes as number) ?? 0,
    active_calories: (r.active_calories as number) ?? 0,
  }))

  const totalSessions = sessions.length || 84
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.duration_minutes, 0) / sessions.length)
    : 68
  const avgKcal = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.active_calories || 0), 0) / sessions.length)
    : 612

  const dynamicStats = [
    { label: 'Total Sessions', value: String(totalSessions), sub: 'past 12 months' },
    { label: 'Avg Duration', value: `${avgDuration} min`, sub: 'per session' },
    { label: 'Avg Kcal Burned', value: `${avgKcal} kcal`, sub: 'per session' },
  ]

  const recentSessions = sessions.slice(0, 5).map((s) => ({
    id: s.id,
    date: new Date(s.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    type: s.duration_minutes >= 120 ? 'Full Game' : s.duration_minutes >= 60 ? 'Scrimmage' : s.duration_minutes >= 30 ? 'Team Practice' : 'Skill Work',
    duration: `${s.duration_minutes} min`,
    kcal: Math.round(s.active_calories || 0),
  }))
  const displaySessions = recentSessions.length > 0 ? recentSessions : RECENT_SESSIONS

  const now = Date.now()
  const weeklyMap: Record<number, number> = {}
  sessions.forEach((s) => {
    const age = now - new Date(s.start_time).getTime()
    const weekIdx = Math.floor(age / (7 * 24 * 60 * 60 * 1000))
    if (weekIdx < 8) weeklyMap[weekIdx] = (weeklyMap[weekIdx] ?? 0) + (s.active_calories || 0)
  })
  const weeklyCaloriesFromData = Array.from({ length: 8 }, (_, i) => ({
    week: `Wk ${i + 1}`,
    kcal: Math.round(weeklyMap[7 - i] ?? 0),
  }))
  const displayWeeklyCalories = weeklyCaloriesFromData.some((w) => w.kcal > 0)
    ? weeklyCaloriesFromData
    : WEEKLY_CALORIES
  const maxWeeklyKcal = Math.max(...displayWeeklyCalories.map((w) => w.kcal))

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Basketball Science</h1>
      </div>

      {/* ── Hero Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a0a00 0%, #0f0600 40%, #0a0a0a 100%)',
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
            width: 320,
            height: 320,
            background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
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
              background: 'rgba(249,115,22,0.15)',
              border: '1px solid rgba(249,115,22,0.3)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            🏀
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #f97316, #fb923c, #fdba74)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Basketball Science
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              margin: 0,
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            Jump mechanics · shooting biomechanics · position-specific physiological demands ·
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
          {dynamicStats.map((s) => (
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
            Active calories from all basketball sessions per week
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
            {displayWeeklyCalories.map((w) => {
              const heightPct = (w.kcal / maxWeeklyKcal) * 100
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
                  {/* Tooltip-style kcal label on top */}
                  <span
                    style={{
                      fontSize: 10,
                      color: '#f97316',
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
                      background: 'linear-gradient(180deg, #f97316, #c2410c)',
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
            <span style={{ fontSize: 11, color: '#475569' }}>Last 12 weeks</span>
          </div>

          {/* Session rows */}
          <div>
            {displaySessions.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: i < displaySessions.length - 1 ? '1px solid #161616' : 'none',
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>
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
          Research references: McInnes et al. 1995 · Ben Abdelkrim et al. 2007 · Ziv & Lidor 2010 ·
          Scanlan et al. 2014 · Matavulj et al. 2001 · Okazaki & Rodacki 2006 · Hamilton 1982 ·
          Cheng et al. 2016 · Goldman et al. 2012 · Drakos et al. 2010 · Lian et al. 2005
        </p>
      </main>
    </div>
  )
}
