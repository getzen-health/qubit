'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DaySummary {
  date: string
  avg_hrv: number
}

interface HRVRecommenderClientProps {
  summaries: DaySummary[]
  todayHrv: number | null
  todayDate: string | null
  baseline: number | null
  ratio: number | null
}

// ── Zone config ────────────────────────────────────────────────────────────────

type ReadinessZone = 'high' | 'normal' | 'reduced' | 'low'

interface ZoneConfig {
  label: string
  tagline: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  sessions: Session[]
}

interface Session {
  name: string
  detail: string
  duration: string
  intensity: string
  intensityColor: string
}

function getZone(ratio: number | null): ReadinessZone {
  if (ratio === null) return 'low'
  if (ratio >= 1.08) return 'high'
  if (ratio >= 0.95) return 'normal'
  if (ratio >= 0.85) return 'reduced'
  return 'low'
}

const ZONE_CONFIG: Record<ReadinessZone, ZoneConfig> = {
  high: {
    label: 'High Readiness',
    tagline: 'Hard Training Day',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.25)',
    textColor: '#22c55e',
    sessions: [
      {
        name: 'High-Intensity Intervals',
        detail: '6–8 × 3 min at 90–95% max HR with 2 min active recovery',
        duration: '45–55 min',
        intensity: 'Very Hard',
        intensityColor: '#ef4444',
      },
      {
        name: 'Tempo Run / Threshold Ride',
        detail: 'Sustained effort at lactate threshold — comfortably hard but controlled',
        duration: '40–50 min',
        intensity: 'Hard',
        intensityColor: '#f97316',
      },
      {
        name: 'Heavy Strength Session',
        detail: 'Compound lifts at 80–90% 1RM — squat, deadlift, press — 4–5 sets × 4–6 reps',
        duration: '60–75 min',
        intensity: 'Hard',
        intensityColor: '#f97316',
      },
      {
        name: 'Long Aerobic + Surge',
        detail: 'Easy base effort with 4–6 × 1 min surges at race pace woven in',
        duration: '60–90 min',
        intensity: 'Moderate–Hard',
        intensityColor: '#eab308',
      },
    ],
  },
  normal: {
    label: 'Normal Readiness',
    tagline: 'Moderate Training Day',
    color: '#2dd4bf',
    bgColor: 'rgba(45,212,191,0.08)',
    borderColor: 'rgba(45,212,191,0.25)',
    textColor: '#2dd4bf',
    sessions: [
      {
        name: 'Steady-State Cardio',
        detail: 'Run, bike, row or swim at 65–75% max HR — conversational pace',
        duration: '40–60 min',
        intensity: 'Moderate',
        intensityColor: '#eab308',
      },
      {
        name: 'Moderate Strength',
        detail: 'Full-body resistance training at 70–80% 1RM — 3–4 sets × 8–10 reps',
        duration: '45–60 min',
        intensity: 'Moderate',
        intensityColor: '#eab308',
      },
      {
        name: 'Circuit Training',
        detail: 'Functional movement circuit — 6 exercises × 45 s on / 15 s off for 4 rounds',
        duration: '35–45 min',
        intensity: 'Moderate',
        intensityColor: '#eab308',
      },
      {
        name: 'Sport / Recreational Activity',
        detail: 'Tennis, basketball, hiking, or group fitness class at a sustainable effort',
        duration: '45–75 min',
        intensity: 'Moderate',
        intensityColor: '#eab308',
      },
    ],
  },
  reduced: {
    label: 'Reduced Readiness',
    tagline: 'Easy Training Day',
    color: '#fb923c',
    bgColor: 'rgba(251,146,60,0.08)',
    borderColor: 'rgba(251,146,60,0.25)',
    textColor: '#fb923c',
    sessions: [
      {
        name: 'Zone 2 Easy Walk / Jog',
        detail: 'Keep HR below 65% max — nose-breathe, hold a conversation comfortably',
        duration: '30–45 min',
        intensity: 'Easy',
        intensityColor: '#22c55e',
      },
      {
        name: 'Light Mobility & Stretching',
        detail: 'Dynamic warm-up flows, hip openers, thoracic rotation — slow and controlled',
        duration: '20–30 min',
        intensity: 'Very Easy',
        intensityColor: '#4ade80',
      },
      {
        name: 'Low-Load Strength (Maintenance)',
        detail: 'Bodyweight or light resistance — 2–3 sets × 15–20 reps, RPE ≤ 5',
        duration: '30–40 min',
        intensity: 'Easy',
        intensityColor: '#22c55e',
      },
      {
        name: 'Restorative Yoga',
        detail: 'Yin or restorative poses held 3–5 min each — parasympathetic focus',
        duration: '30–45 min',
        intensity: 'Very Easy',
        intensityColor: '#4ade80',
      },
    ],
  },
  low: {
    label: 'Low Readiness',
    tagline: 'Rest or Recovery Day',
    color: '#f87171',
    bgColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.25)',
    textColor: '#f87171',
    sessions: [
      {
        name: 'Full Rest',
        detail: 'No structured exercise — sleep, nutrition, and stress management take priority',
        duration: 'All day',
        intensity: 'Rest',
        intensityColor: '#94a3b8',
      },
      {
        name: 'Gentle Walk',
        detail: 'Easy 15–20 min flat walk outdoors — purely for blood flow and mood',
        duration: '15–20 min',
        intensity: 'Very Easy',
        intensityColor: '#4ade80',
      },
      {
        name: 'Breathwork & Meditation',
        detail: '4-7-8 breathing or box breathing — 10–20 min to activate parasympathetic state',
        duration: '10–20 min',
        intensity: 'Passive',
        intensityColor: '#94a3b8',
      },
      {
        name: 'Foam Rolling / Self-Massage',
        detail: 'Full-body soft-tissue work — quads, calves, lats, pecs — gentle pressure only',
        duration: '15–25 min',
        intensity: 'Passive',
        intensityColor: '#94a3b8',
      },
    ],
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HRVRecommenderClient({
  summaries,
  todayHrv,
  todayDate,
  baseline,
  ratio,
}: HRVRecommenderClientProps) {
  if (summaries.length === 0 || todayHrv === null || baseline === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">💗</span>
        <h2 className="text-lg font-semibold text-text-primary">No HRV data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          HRV syncs from Apple Watch via the KQuarks iOS app. Ensure your Watch measures HRV
          during sleep. At least a few days of data are needed to compute your baseline.
        </p>
      </div>
    )
  }

  const zone = getZone(ratio)
  const config = ZONE_CONFIG[zone]
  const pctVsBaseline = Math.round(((todayHrv - baseline) / baseline) * 100)
  const displayRatio = ratio !== null ? Math.round(ratio * 100) / 100 : null

  // Chart data: 30-day HRV bars with baseline rule
  const chartData = summaries.map((s) => ({
    date: fmtDate(s.date),
    hrv: Math.round(s.avg_hrv),
    isToday: s.date === todayDate,
  }))

  return (
    <div className="space-y-6">
      {/* ── Readiness zone banner ─────────────────────────────────────────── */}
      <div
        className="rounded-xl border p-5"
        style={{ background: config.bgColor, borderColor: config.borderColor }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">Today&apos;s Readiness</p>
            <p className="text-3xl font-black" style={{ color: config.textColor }}>
              {config.label}
            </p>
            <p className="text-sm mt-1" style={{ color: config.textColor, opacity: 0.8 }}>
              {config.tagline}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-black text-text-primary">{Math.round(todayHrv)}</p>
            <p className="text-xs text-text-secondary mt-0.5">ms SDNN</p>
          </div>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-text-primary">{Math.round(todayHrv)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Today&apos;s HRV</p>
          <p className="text-xs text-text-secondary opacity-60">ms SDNN</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-text-primary">{Math.round(baseline)}</p>
          <p className="text-xs text-text-secondary mt-0.5">30-Day Baseline</p>
          <p className="text-xs text-text-secondary opacity-60">rolling average</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p
            className="text-2xl font-black"
            style={{ color: pctVsBaseline >= 0 ? '#22c55e' : '#f87171' }}
          >
            {pctVsBaseline > 0 ? '+' : ''}{pctVsBaseline}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">vs Baseline</p>
          <p className="text-xs text-text-secondary opacity-60">
            ratio {displayRatio ?? '—'}
          </p>
        </div>
      </div>

      {/* ── 30-day HRV bar chart with baseline rule ───────────────────────── */}
      {chartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">30-Day HRV History</h3>
          <p className="text-xs text-text-secondary mb-3 opacity-70">
            Dashed line = 30-day baseline · Today highlighted
          </p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={34}
                domain={[
                  Math.max(0, Math.min(...chartData.map((d) => d.hrv)) - 10),
                  Math.max(...chartData.map((d) => d.hrv)) + 10,
                ]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} ms`, 'HRV']}
              />
              <ReferenceLine
                y={Math.round(baseline)}
                stroke="rgba(56,189,248,0.5)"
                strokeDasharray="5 3"
                label={{
                  value: `Baseline ${Math.round(baseline)} ms`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: 'rgba(56,189,248,0.7)',
                }}
              />
              <Bar dataKey="hrv" radius={[3, 3, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      d.isToday
                        ? config.color
                        : d.hrv >= baseline * 1.08
                        ? '#22c55e'
                        : d.hrv >= baseline * 0.95
                        ? '#38bdf8'
                        : d.hrv >= baseline * 0.85
                        ? '#fb923c'
                        : '#f87171'
                    }
                    opacity={d.isToday ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Suggested sessions ────────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: config.color }}
          />
          <h3 className="text-sm font-semibold text-text-primary">
            Recommended Sessions for Today
          </h3>
        </div>
        <div className="space-y-3">
          {config.sessions.map((session, i) => (
            <div
              key={i}
              className="rounded-lg border border-border p-3.5 bg-background"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary leading-snug">
                    {session.name}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {session.detail}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: session.intensityColor,
                      background: `${session.intensityColor}18`,
                    }}
                  >
                    {session.intensity}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-text-secondary opacity-60">Duration:</span>
                <span className="text-xs text-text-secondary font-medium">{session.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Readiness zone key ────────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Readiness Zones</h3>
        <div className="space-y-2.5">
          {(
            [
              {
                zone: 'high' as ReadinessZone,
                label: 'High Readiness',
                desc: 'ratio ≥ 1.08 — HRV well above baseline',
                tagline: 'Hard Training Day',
              },
              {
                zone: 'normal' as ReadinessZone,
                label: 'Normal Readiness',
                desc: 'ratio ≥ 0.95 — HRV near baseline',
                tagline: 'Moderate Training Day',
              },
              {
                zone: 'reduced' as ReadinessZone,
                label: 'Reduced Readiness',
                desc: 'ratio ≥ 0.85 — HRV somewhat below baseline',
                tagline: 'Easy Training Day',
              },
              {
                zone: 'low' as ReadinessZone,
                label: 'Low Readiness',
                desc: 'ratio < 0.85 — HRV significantly suppressed',
                tagline: 'Rest or Recovery Day',
              },
            ] as const
          ).map(({ zone: z, label, desc, tagline }) => (
            <div
              key={z}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{
                background:
                  z === zone
                    ? ZONE_CONFIG[z].bgColor
                    : 'rgba(255,255,255,0.03)',
                border: `1px solid ${z === zone ? ZONE_CONFIG[z].borderColor : 'transparent'}`,
              }}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: ZONE_CONFIG[z].color }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold leading-snug"
                  style={{ color: ZONE_CONFIG[z].color }}
                >
                  {label}
                  {z === zone && (
                    <span className="ml-2 text-text-secondary font-normal opacity-70">
                      ← today
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-secondary opacity-70 mt-0.5">{desc}</p>
              </div>
              <p className="text-xs text-text-secondary opacity-60 shrink-0 text-right hidden sm:block">
                {tagline}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          The Science of HRV-Guided Training
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Heart rate variability reflects the balance between your sympathetic and parasympathetic
          nervous systems. When HRV is elevated above your personal baseline, your body has
          recovered well and can handle greater training stress. When suppressed, it signals
          accumulated fatigue, inadequate sleep, illness, or life stress — all legitimate reasons
          to reduce load.
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          Rather than following a rigid weekly schedule, HRV-guided training lets your body&apos;s
          physiology dictate intensity day-to-day. Research by Kiviniemi et al. (2010) found that
          athletes who adjusted training intensity based on daily HRV improved{' '}
          <span className="font-semibold text-text-primary">VO₂ max by 19%</span> over a 4-week
          block — significantly more than a matched group following a fixed plan.
        </p>
        <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
          <p className="font-semibold text-sky-400 mb-1">Key principles</p>
          <ul className="text-text-secondary space-y-1 list-disc list-inside">
            <li>Compare today&apos;s HRV to your own rolling baseline — not population norms</li>
            <li>A single low reading is not an alarm; look for trends across 3–5 days</li>
            <li>HRV responds to sleep quality, hydration, alcohol, travel, and mental stress</li>
            <li>Consistent measurement time (morning, on waking) gives the most reliable signal</li>
          </ul>
        </div>
        <p className="text-xs text-text-secondary opacity-50">
          Reference: Kiviniemi AM et al. (2010). Endurance performance and heart rate variability.{' '}
          <em>Int J Sports Physiol Perform</em>.
        </p>
      </div>
    </div>
  )
}
