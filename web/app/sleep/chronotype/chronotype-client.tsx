'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  LineChart,
  Line,
  Cell,
} from 'recharts'

interface NightPoint {
  date: string
  midpoint: number
  midpointFmt: string
  durationHours: number
  isWeekend: boolean
  weekday: number
}

interface Props {
  nights: NightPoint[]
  chronotype: 'Early' | 'Intermediate' | 'Late' | 'Unknown'
  weekdayMid: number | null
  weekendMid: number | null
  overallMid: number | null
  socialJetLag: number | null
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const CHRONOTYPE_CONFIG = {
  Early: {
    emoji: '🐦',
    label: 'Early Bird',
    color: 'text-yellow-400',
    border: 'border-yellow-500/20',
    bg: 'bg-yellow-500/5',
    desc: 'Your natural sleep midpoint is before 2 am. You tend to feel most alert in the morning and perform best in the first half of the day.',
    optimal: 'Aim to sleep by 10–11 pm and wake by 6–7 am to match your biology.',
  },
  Intermediate: {
    emoji: '🦅',
    label: 'Intermediate',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    desc: 'Your sleep midpoint falls between 2–4 am. This is the most common chronotype, roughly 50% of the population.',
    optimal: 'Aim for 11 pm–12 am bedtime and 7–8 am wake time to align with your rhythm.',
  },
  Late: {
    emoji: '🦉',
    label: 'Night Owl',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    desc: 'Your natural sleep midpoint is after 4 am. You feel most alert in the evening and need later sleep/wake times to function optimally.',
    optimal: 'Aim for 12–1 am bedtime and 8–9 am wake time if your schedule allows.',
  },
  Unknown: {
    emoji: '❓',
    label: 'Unknown',
    color: 'text-text-secondary',
    border: 'border-border',
    bg: 'bg-surface',
    desc: 'Not enough data to classify your chronotype.',
    optimal: 'Log more sleep data to get your chronotype analysis.',
  },
}

function fmtHour(h: number): string {
  const total = ((h % 24) + 24) % 24
  const hh = Math.floor(total)
  const mm = Math.round((total - hh) * 60)
  const period = hh < 12 ? 'am' : 'pm'
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`
}

function fmtJetLag(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}min`
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ChronotypeClient({
  nights,
  chronotype,
  weekdayMid,
  weekendMid,
  overallMid,
  socialJetLag,
}: Props) {
  if (nights.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🦉</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough sleep data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Log at least 5 full nights of sleep to see your chronotype analysis.
        </p>
      </div>
    )
  }

  const cfg = CHRONOTYPE_CONFIG[chronotype]

  const sjlSeverity =
    socialJetLag === null ? null :
    socialJetLag < 0.5 ? 'low' :
    socialJetLag < 1.5 ? 'moderate' : 'high'

  // By-day-of-week averages
  const byWeekday: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const n of nights) byWeekday[n.weekday].push(n.midpoint)
  const weekdayAvgs = Object.entries(byWeekday).map(([day, mps]) => ({
    day: WEEKDAY_NAMES[parseInt(day)],
    midpoint: mps.length > 0 ? mps.reduce((a, b) => a + b, 0) / mps.length : null,
    isWeekend: parseInt(day) === 0 || parseInt(day) === 6,
  }))

  // Trend line data (recent 60 nights)
  const trendData = nights.slice(-60).map((n, i) => ({
    i,
    midpoint: n.midpoint,
    date: n.date,
    isWeekend: n.isWeekend,
  }))

  return (
    <div className="space-y-6">
      {/* Chronotype card */}
      <div className={`rounded-xl p-5 border ${cfg.border} ${cfg.bg}`}>
        <div className="flex items-start gap-4">
          <span className="text-4xl">{cfg.emoji}</span>
          <div>
            <p className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-text-secondary mt-1 max-w-sm">{cfg.desc}</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-surface/50 rounded-lg">
          <p className="text-xs font-medium text-text-secondary">💡 {cfg.optimal}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Weekday Midpoint',
            value: weekdayMid !== null ? fmtHour(weekdayMid) : '—',
            sub: 'Mon–Fri sleep midpoint',
            color: 'text-blue-400',
          },
          {
            label: 'Weekend Midpoint',
            value: weekendMid !== null ? fmtHour(weekendMid) : '—',
            sub: 'Sat–Sun sleep midpoint',
            color: 'text-indigo-400',
          },
          {
            label: 'Social Jet Lag',
            value: socialJetLag !== null ? fmtJetLag(socialJetLag) : '—',
            sub: 'weekday vs weekend shift',
            color: sjlSeverity === 'low' ? 'text-green-400' : sjlSeverity === 'moderate' ? 'text-yellow-400' : 'text-red-400',
          },
          {
            label: 'Overall Midpoint',
            value: overallMid !== null ? fmtHour(overallMid) : '—',
            sub: '90-day average',
            color: 'text-text-primary',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Social Jet Lag banner */}
      {socialJetLag !== null && (
        <div className={`rounded-xl p-4 border ${
          sjlSeverity === 'low' ? 'bg-green-500/5 border-green-500/20' :
          sjlSeverity === 'moderate' ? 'bg-yellow-500/5 border-yellow-500/20' :
          'bg-red-500/5 border-red-500/20'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {sjlSeverity === 'low' ? '✅' : sjlSeverity === 'moderate' ? '⚠️' : '🚨'}
            </span>
            <div>
              <p className={`text-sm font-semibold ${
                sjlSeverity === 'low' ? 'text-green-400' :
                sjlSeverity === 'moderate' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                Social Jet Lag: {fmtJetLag(socialJetLag)} —{' '}
                {sjlSeverity === 'low' ? 'Very low' : sjlSeverity === 'moderate' ? 'Moderate' : 'High'}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {sjlSeverity === 'low'
                  ? 'Your weekday and weekend sleep schedules are well-aligned. Minimal circadian disruption.'
                  : sjlSeverity === 'moderate'
                  ? 'You sleep notably later on weekends. This is equivalent to flying 1–1.5 time zones each week.'
                  : 'High social jet lag is associated with fatigue, metabolic risk, and mood issues. Try to align your sleep schedule across all days.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Midpoint trend chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Sleep Midpoint Over Time</h2>
        <ResponsiveContainer width="100%" height={180}>
          <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="i"
              type="number"
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="midpoint"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              tickFormatter={(v) => fmtHour(v)}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(v: number) => [fmtHour(v), 'Midpoint']}
              labelFormatter={(i: number) => trendData[i]?.date ?? ''}
            />
            {overallMid !== null && (
              <ReferenceLine y={overallMid} stroke="#6366f1" strokeDasharray="4 4" />
            )}
            <Scatter data={trendData} isAnimationActive={false}>
              {trendData.map((d, i) => (
                <Cell key={i} fill={d.isWeekend ? '#818cf8' : '#60a5fa'} fillOpacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary justify-center">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" />Weekday</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />Weekend</div>
        </div>
      </div>

      {/* By day of week bar */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Average Midpoint by Day of Week</h2>
        <div className="space-y-2">
          {weekdayAvgs.map(({ day, midpoint, isWeekend }) => {
            if (midpoint === null) return null
            const baseline = overallMid ?? 3
            const offset = midpoint - baseline
            const barWidth = Math.min(Math.abs(offset) * 15, 80)
            return (
              <div key={day} className="flex items-center gap-3">
                <span className={`text-xs w-7 ${isWeekend ? 'text-indigo-400' : 'text-text-secondary'} font-medium`}>
                  {day}
                </span>
                <div className="flex-1 flex items-center gap-1">
                  <div
                    className={`h-5 rounded transition-all ${isWeekend ? 'bg-indigo-500/40' : 'bg-blue-500/40'}`}
                    style={{ width: `${barWidth}%`, minWidth: 4 }}
                  />
                </div>
                <span className="text-xs text-text-primary w-20 text-right">{fmtHour(midpoint)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">About Chronotype</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p>
            Your <span className="text-text-primary font-medium">chronotype</span> is your biological
            clock's natural preference — determined primarily by genetics, but shifts with age (teens
            trend late; older adults trend early).
          </p>
          <p>
            <span className="text-yellow-400 font-medium">Sleep Midpoint</span> is the halfway point
            between sleep onset and final wake time. It's a more robust chronotype marker than bedtime
            or wake time alone because it's less affected by early work schedules.
          </p>
          <p>
            <span className="text-red-400 font-medium">Social Jet Lag</span> (difference between
            weekday and weekend sleep timing) is linked to fatigue, obesity risk, depression, and
            cardiovascular risk — independent of total sleep duration. Even 1 hour of SJL has
            measurable metabolic effects.
          </p>
          <p className="opacity-60 pt-1">
            Classification uses sleep midpoint: Early (&lt;2 am), Intermediate (2–4 am), Late (&gt;4 am).
            Based on Till Roenneberg's Munich Chronotype Questionnaire research.
          </p>
        </div>
      </div>
    </div>
  )
}
