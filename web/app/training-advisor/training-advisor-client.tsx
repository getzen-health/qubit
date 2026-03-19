'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { AdvisorDay } from './page'

type WeekType = 'recovery' | 'easy' | 'base' | 'build' | 'peak'
type SessionType = 'rest' | 'easy' | 'active' | 'moderate' | 'long' | 'hard'

interface SessionDef {
  type: SessionType
  suggestion: string
  zone: string
  duration: string
}

interface WeekMeta {
  label: string
  tagline: string
  color: string
  bgColor: string
  emoji: string
}

const WEEK_META: Record<WeekType, WeekMeta> = {
  recovery: {
    label: 'Recovery Week',
    tagline: 'Your body is signaling it needs recovery. Prioritize sleep and gentle movement.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    emoji: '🛌',
  },
  easy: {
    label: 'Easy Week',
    tagline: 'Slightly below baseline — keep intensity low and let your body bounce back.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    emoji: '🚶',
  },
  base: {
    label: 'Base Week',
    tagline: 'HRV is stable. A solid week for building aerobic base and consistency.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    emoji: '🏃',
  },
  build: {
    label: 'Build Week',
    tagline: 'HRV is elevated — your body is responding well. Good time for harder sessions.',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    emoji: '⚡',
  },
  peak: {
    label: 'Peak Week',
    tagline: 'HRV is significantly above baseline. Leverage this window for peak-effort training.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    emoji: '🔥',
  },
}

const SESSION_STYLE: Record<SessionType, { color: string; bg: string; dot: string }> = {
  rest:     { color: 'text-text-secondary', bg: 'bg-surface-secondary', dot: '#6b7280' },
  easy:     { color: 'text-blue-400',       bg: 'bg-blue-500/10',       dot: '#60a5fa' },
  active:   { color: 'text-teal-400',       bg: 'bg-teal-500/10',       dot: '#2dd4bf' },
  moderate: { color: 'text-green-400',      bg: 'bg-green-500/10',      dot: '#4ade80' },
  long:     { color: 'text-indigo-400',     bg: 'bg-indigo-500/10',     dot: '#818cf8' },
  hard:     { color: 'text-orange-400',     bg: 'bg-orange-500/10',     dot: '#fb923c' },
}

const SCHEDULES: Record<WeekType, SessionDef[]> = {
  recovery: [
    { type: 'easy',   suggestion: 'Easy 20 min walk or gentle yoga',     zone: 'Zone 1 (50–60%)',  duration: '15–20 min' },
    { type: 'rest',   suggestion: 'Full rest — prioritize sleep',          zone: '—',                duration: '0 min' },
    { type: 'active', suggestion: 'Light stretching or 15 min walk',       zone: 'Zone 1',           duration: '15 min' },
    { type: 'rest',   suggestion: 'Full rest day',                          zone: '—',                duration: '0 min' },
    { type: 'easy',   suggestion: 'Easy jog or walk at conversational pace',zone: 'Zone 1–2 (50–65%)',duration: '20–25 min' },
    { type: 'active', suggestion: 'Gentle long walk or mobility work',      zone: 'Zone 1',           duration: '30 min' },
    { type: 'rest',   suggestion: 'Rest day — recharge for next week',      zone: '—',                duration: '0 min' },
  ],
  easy: [
    { type: 'easy',   suggestion: 'Easy 30 min run or brisk walk',               zone: 'Zone 2 (60–65%)', duration: '25–30 min' },
    { type: 'rest',   suggestion: 'Rest day',                                      zone: '—',               duration: '0 min' },
    { type: 'easy',   suggestion: 'Easy 30 min aerobic session',                  zone: 'Zone 2',          duration: '30 min' },
    { type: 'easy',   suggestion: 'Light 20 min run with form drills',            zone: 'Zone 1–2',        duration: '20 min' },
    { type: 'rest',   suggestion: 'Rest day',                                      zone: '—',               duration: '0 min' },
    { type: 'long',   suggestion: 'Easy long run or hike',                        zone: 'Zone 2 (60–65%)', duration: '45–60 min' },
    { type: 'rest',   suggestion: 'Rest and recovery',                             zone: '—',               duration: '0 min' },
  ],
  base: [
    { type: 'easy',   suggestion: 'Easy 30 min run',                              zone: 'Zone 2 (60–65%)', duration: '30 min' },
    { type: 'moderate', suggestion: 'Aerobic threshold: 4×8 min @ Zone 3',        zone: 'Zone 3 (70–80%)', duration: '35–40 min' },
    { type: 'rest',   suggestion: 'Rest day',                                      zone: '—',               duration: '0 min' },
    { type: 'moderate', suggestion: 'Tempo intervals or steady 40 min',           zone: 'Zone 3–4',        duration: '35–45 min' },
    { type: 'easy',   suggestion: 'Easy flush run',                               zone: 'Zone 2',          duration: '30 min' },
    { type: 'long',   suggestion: 'Long easy run or cycle',                       zone: 'Zone 2',          duration: '60–80 min' },
    { type: 'rest',   suggestion: 'Rest and recover',                              zone: '—',               duration: '0 min' },
  ],
  build: [
    { type: 'moderate', suggestion: 'Aerobic 40 min with strides',               zone: 'Zone 2–3',          duration: '40 min' },
    { type: 'hard',   suggestion: 'Intervals: 6×3 min @ Zone 4–5',               zone: 'Zone 4–5 (80–90%)', duration: '45–50 min' },
    { type: 'rest',   suggestion: 'Rest day',                                      zone: '—',                 duration: '0 min' },
    { type: 'moderate', suggestion: 'Threshold run 30 min @ Zone 3–4',           zone: 'Zone 3–4 (70–85%)', duration: '40 min' },
    { type: 'hard',   suggestion: 'Hill repeats or short intervals',              zone: 'Zone 4–5',          duration: '40 min' },
    { type: 'long',   suggestion: 'Long aerobic run — push the distance',         zone: 'Zone 2',            duration: '75–90 min' },
    { type: 'rest',   suggestion: 'Rest — great week!',                            zone: '—',                 duration: '0 min' },
  ],
  peak: [
    { type: 'easy',   suggestion: 'Short easy run — fresh legs',                 zone: 'Zone 2',            duration: '25 min' },
    { type: 'hard',   suggestion: 'Race-pace: 8×90 sec @ Zone 5',                zone: 'Zone 5 (>90%)',     duration: '40–45 min' },
    { type: 'rest',   suggestion: 'Full rest day',                                 zone: '—',                 duration: '0 min' },
    { type: 'moderate', suggestion: 'Threshold 4 mile run @ comfortably hard',   zone: 'Zone 3–4',          duration: '35 min' },
    { type: 'easy',   suggestion: 'Very easy shakeout',                           zone: 'Zone 1–2',          duration: '20 min' },
    { type: 'long',   suggestion: 'Longest run of cycle — push your limits',      zone: 'Zone 2–3',          duration: '90–120 min' },
    { type: 'rest',   suggestion: 'Rest — outstanding week!',                      zone: '—',                 duration: '0 min' },
  ],
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtHours(h: number) {
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  return min > 0 ? `${hrs}h ${min}m` : `${hrs}h`
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

interface Props {
  days: AdvisorDay[]
}

export function TrainingAdvisorClient({ days }: Props) {
  const withHRV = days.filter((d) => d.hrv !== null && d.hrv > 0)

  if (withHRV.length < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🧠</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Need at least 7 days of HRV data to generate training recommendations. Keep syncing your health data!
        </p>
      </div>
    )
  }

  // Compute metrics
  const last7hrv = withHRV.slice(-7).map((d) => d.hrv!)
  const baselineData = withHRV.slice(0, -7)
  const baselineHRV = baselineData.length > 0
    ? baselineData.map((d) => d.hrv!).reduce((a, b) => a + b, 0) / baselineData.length
    : last7hrv.reduce((a, b) => a + b, 0) / last7hrv.length

  const avgHRV7 = last7hrv.reduce((a, b) => a + b, 0) / last7hrv.length
  const devPct = ((avgHRV7 - baselineHRV) / baselineHRV) * 100

  const last7sleep = days.slice(-7).filter((d) => d.sleepHours !== null)
  const avgSleep = last7sleep.length > 0
    ? last7sleep.reduce((s, d) => s + d.sleepHours!, 0) / last7sleep.length
    : null

  // Classify week type
  let weekType: WeekType
  if (avgSleep !== null && avgSleep < 6.5) {
    weekType = devPct < -5 ? 'recovery' : 'easy'
  } else if (devPct > 15) {
    weekType = 'peak'
  } else if (devPct > 5) {
    weekType = 'build'
  } else if (devPct > -5) {
    weekType = 'base'
  } else if (devPct > -15) {
    weekType = 'easy'
  } else {
    weekType = 'recovery'
  }

  const meta = WEEK_META[weekType]
  const schedule = SCHEDULES[weekType]

  // HRV trend data (last 14 days with HRV)
  const trendData = withHRV.slice(-14).map((d) => ({
    date: fmtDate(d.date),
    hrv: Math.round(d.hrv!),
    baseline: Math.round(baselineHRV),
  }))

  // Find today's day of week (0=Mon, 6=Sun)
  const todayDow = (new Date().getDay() + 6) % 7  // convert Sun=0 to Mon=0

  return (
    <div className="space-y-6">
      {/* Week Type Banner */}
      <div className={`border rounded-xl p-4 ${meta.bgColor}`}>
        <div className="flex items-start gap-3">
          <span className="text-4xl leading-none mt-0.5">{meta.emoji}</span>
          <div>
            <h2 className={`text-lg font-bold ${meta.color}`}>{meta.label}</h2>
            <p className="text-sm text-text-secondary mt-1">{meta.tagline}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: '7-Day HRV Avg',
            value: `${Math.round(avgHRV7)} ms`,
            sub: `${devPct >= 0 ? '+' : ''}${devPct.toFixed(0)}% vs baseline`,
            subColor: devPct > 5 ? 'text-green-400' : devPct < -5 ? 'text-red-400' : 'text-text-secondary',
          },
          {
            label: '28-Day Baseline',
            value: `${Math.round(baselineHRV)} ms`,
            sub: 'HRV average',
            subColor: 'text-text-secondary',
          },
          {
            label: 'Avg Sleep',
            value: avgSleep !== null ? fmtHours(avgSleep) : '—',
            sub: 'last 7 nights',
            subColor: avgSleep !== null && avgSleep < 6.5 ? 'text-orange-400' : 'text-text-secondary',
          },
        ].map(({ label, value, sub, subColor }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-base font-bold text-text-primary leading-tight">{value}</p>
            <p className="text-xs font-medium text-text-secondary mt-0.5">{label}</p>
            <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* HRV Trend Chart */}
      {trendData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">HRV — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} ms`, 'HRV']} />
              <ReferenceLine
                y={Math.round(baselineHRV)}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="4 3"
                label={{ value: 'baseline', position: 'insideTopRight', fontSize: 9, fill: '#888' }}
              />
              <Line
                type="monotone"
                dataKey="hrv"
                stroke="#818cf8"
                strokeWidth={2}
                dot={{ r: 3, fill: '#818cf8' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly Plan */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Your Week</h2>
        <div className="space-y-2">
          {schedule.map((s, i) => {
            const style = SESSION_STYLE[s.type]
            const isToday = i === todayDow
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isToday
                    ? `${style.bg} border-[${style.dot}]/40`
                    : 'border-transparent hover:bg-surface-secondary'
                }`}
              >
                {/* Day label */}
                <div className="shrink-0 w-8 text-center pt-0.5">
                  <p className={`text-xs font-bold ${isToday ? style.color : 'text-text-secondary'}`}>
                    {WEEKDAYS[i]}
                  </p>
                  {isToday && (
                    <div className="mt-0.5 mx-auto w-1 h-1 rounded-full" style={{ backgroundColor: style.dot }} />
                  )}
                </div>

                {/* Session info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold capitalize ${style.color}`}>{s.type}</span>
                    {isToday && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary mt-0.5 leading-tight">{s.suggestion}</p>
                  {s.zone !== '—' && (
                    <p className="text-xs text-text-secondary mt-0.5 opacity-70">
                      {s.zone} · {s.duration}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="shrink-0 text-right">
                  <p className="text-xs font-mono text-text-secondary">{s.duration}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session Legend */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Session Types</h2>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(SESSION_STYLE) as [SessionType, typeof SESSION_STYLE[SessionType]][]).map(([type, style]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
              <span className={`text-xs font-medium capitalize ${style.color}`}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">How This Works</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p>
            <span className="text-indigo-400 font-medium">HRV Baseline:</span> Your 28-day personal HRV average
            is your baseline. Deviations reveal recovery status — not good or bad by themselves, just a signal.
          </p>
          <p>
            <span className="text-green-400 font-medium">Week Classification:</span> HRV {'>'}5% above baseline
            = Build/Peak. Near baseline = Base. Below = Easy/Recovery. Poor sleep shifts everything down by one tier.
          </p>
          <p>
            <span className="text-blue-400 font-medium">Zone 2 Foundation:</span> Easy sessions target Zone 2
            (50–65% max HR) — the conversational pace that builds aerobic base and improves fat oxidation.
          </p>
          <p className="opacity-60 pt-1">
            These recommendations are guidelines, not prescriptions. Listen to your body — if you feel off,
            take an extra rest day regardless of what the data suggests.
          </p>
        </div>
      </div>
    </div>
  )
}
