'use client'

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts'

interface Workout {
  start_time: string
  duration_minutes: number
  active_calories: number | null
  workout_type: string
  avg_heart_rate: number | null
}

interface TrainingLoadClientProps {
  workouts: Workout[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtShort(iso: string) {
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Compute Training Stress Score proxy from a workout
// Uses active_calories as the primary signal, falls back to duration-based estimate
function computeTSS(workout: Workout): number {
  const calories = workout.active_calories ?? 0
  const durationMins = workout.duration_minutes

  if (calories > 0) {
    // Scale: ~300 cal/hr easy workout = TSS ~50, ~600 cal/hr hard = TSS ~100
    // TSS = (calories / 300) * 50 * (duration / 60) normalized to ~50/hour moderate
    return Math.min(300, (calories / 5))
  }
  // Fallback: duration-based (30 min moderate = TSS ~50)
  return Math.min(150, (durationMins / 60) * 50)
}

// Exponentially weighted average with decay constant k
// ATL: k = 1 - exp(-1/7)  (7-day characteristic time)
// CTL: k = 1 - exp(-1/42) (42-day characteristic time)
function buildLoadCurves(dailyTSS: Map<string, number>, days: string[]) {
  const kAtl = 1 - Math.exp(-1 / 7)
  const kCtl = 1 - Math.exp(-1 / 42)

  let atl = 0
  let ctl = 0
  const result: Array<{ date: string; tss: number; atl: number; ctl: number; tsb: number }> = []

  for (const day of days) {
    const tss = dailyTSS.get(day) ?? 0
    atl = atl + kAtl * (tss - atl)
    ctl = ctl + kCtl * (tss - ctl)
    const tsb = ctl - atl
    result.push({ date: day, tss: Math.round(tss), atl: Math.round(atl), ctl: Math.round(ctl), tsb: Math.round(tsb) })
  }

  return result
}

function getFormStatus(tsb: number): { label: string; color: string; bg: string; advice: string } {
  if (tsb > 25) return {
    label: 'Very Fresh',
    color: '#60a5fa',
    bg: 'bg-blue-500/10 border-blue-500/20',
    advice: 'You\'re very well rested. Good time for a key workout or race effort.'
  }
  if (tsb >= 5) return {
    label: 'Optimal Form',
    color: '#4ade80',
    bg: 'bg-green-500/10 border-green-500/20',
    advice: 'Sweet spot between fitness and freshness. Peak performance window.'
  }
  if (tsb >= -10) return {
    label: 'Productive',
    color: '#a3e635',
    bg: 'bg-lime-500/10 border-lime-500/20',
    advice: 'Normal training load. Building fitness. Some fatigue is expected.'
  }
  if (tsb >= -30) return {
    label: 'Fatigued',
    color: '#fb923c',
    bg: 'bg-orange-500/10 border-orange-500/20',
    advice: 'Significant fatigue accumulation. Consider an easy day or rest day.'
  }
  return {
    label: 'Overreaching',
    color: '#f87171',
    bg: 'bg-red-500/10 border-red-500/20',
    advice: 'High fatigue risk. Rest is necessary to avoid injury or burnout.'
  }
}

function getRampRate(curves: ReturnType<typeof buildLoadCurves>): number {
  if (curves.length < 8) return 0
  const current = curves[curves.length - 1].ctl
  const weekAgo = curves[curves.length - 8].ctl
  return Math.round(current - weekAgo)
}

function getRampStatus(ramp: number): { label: string; color: string } {
  if (ramp > 8) return { label: 'Too Fast — injury risk', color: 'text-red-400' }
  if (ramp > 5) return { label: 'Aggressive', color: 'text-orange-400' }
  if (ramp >= 0) return { label: 'Safe progression', color: 'text-green-400' }
  return { label: 'Deload / recovery', color: 'text-blue-400' }
}

export function TrainingLoadClient({ workouts }: TrainingLoadClientProps) {
  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📈</span>
        <h2 className="text-lg font-semibold text-text-primary">No workout data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import workouts. Training load curves build after a few weeks of data.
        </p>
      </div>
    )
  }

  // Build daily TSS map
  const dailyTSS = new Map<string, number>()
  for (const w of workouts) {
    const day = w.start_time.slice(0, 10)
    dailyTSS.set(day, (dailyTSS.get(day) ?? 0) + computeTSS(w))
  }

  // Build full date range (180 days)
  const days: string[] = []
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  for (let i = 179; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  const curves = buildLoadCurves(dailyTSS, days)
  const today = curves[curves.length - 1]
  const formStatus = getFormStatus(today.tsb)
  const rampRate = getRampRate(curves)
  const rampStatus = getRampStatus(rampRate)

  // Last 90 days for chart
  const chartData = curves.slice(-90).map((d) => ({
    ...d,
    label: fmtShort(d.date),
  }))

  // Weekly TSS for bar chart
  const weeklyTSS: Record<string, number> = {}
  for (const [day, tss] of dailyTSS.entries()) {
    const d = new Date(day + 'T00:00:00')
    // Week starting Monday
    const dow = (d.getDay() + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - dow)
    const weekKey = monday.toISOString().slice(0, 10)
    weeklyTSS[weekKey] = (weeklyTSS[weekKey] ?? 0) + Math.round(tss)
  }
  const weeklyData = Object.entries(weeklyTSS)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, tss]) => ({ week: fmtDate(week + 'T00:00:00'), tss }))

  // Peak CTL and current
  const peakCtl = Math.max(...curves.map((c) => c.ctl))

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-text-secondary mb-1">Fitness (CTL)</p>
          <p className="text-3xl font-black text-blue-400">{today.ctl}</p>
          <p className="text-xs text-text-secondary mt-1">42-day avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-text-secondary mb-1">Fatigue (ATL)</p>
          <p className="text-3xl font-black text-orange-400">{today.atl}</p>
          <p className="text-xs text-text-secondary mt-1">7-day avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-text-secondary mb-1">Form (TSB)</p>
          <p className="text-3xl font-black" style={{ color: formStatus.color }}>
            {today.tsb > 0 ? '+' : ''}{today.tsb}
          </p>
          <p className="text-xs text-text-secondary mt-1">CTL − ATL</p>
        </div>
      </div>

      {/* Form status */}
      <div className={`rounded-xl border p-4 ${formStatus.bg}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold" style={{ color: formStatus.color }}>{formStatus.label}</p>
          <p className="text-xs text-text-secondary">Today&apos;s TSS: {today.tss}</p>
        </div>
        <p className="text-sm text-text-secondary">{formStatus.advice}</p>
      </div>

      {/* Ramp rate */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Weekly Ramp Rate</p>
            <p className="text-xs text-text-secondary mt-0.5">Change in fitness (CTL) over past 7 days</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${rampRate >= 0 ? 'text-green-400' : 'text-blue-400'}`}>
              {rampRate >= 0 ? '+' : ''}{rampRate}
            </p>
            <p className={`text-xs mt-0.5 ${rampStatus.color}`}>{rampStatus.label}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-text-secondary">
          <span>Safe zone: <span className="text-green-400 font-medium">+3 to +8 per week</span></span>
          <span>Peak: <span className="text-blue-400 font-medium">{peakCtl} CTL</span></span>
        </div>
      </div>

      {/* CTL/ATL/TSB chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">90-Day Fitness & Fatigue Curves</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => {
                const labels: Record<string, string> = { ctl: 'Fitness (CTL)', atl: 'Fatigue (ATL)', tsb: 'Form (TSB)' }
                return [Math.round(v), labels[name] ?? name]
              }}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            <Area type="monotone" dataKey="tsb" name="tsb" fill="rgba(74,222,128,0.05)" stroke="none" />
            <Line type="monotone" dataKey="ctl" name="ctl" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="atl" name="atl" stroke="#fb923c" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="tsb" name="tsb" stroke="#4ade80" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
          {[
            { color: '#60a5fa', label: 'Fitness (CTL)' },
            { color: '#fb923c', label: 'Fatigue (ATL)' },
            { color: '#4ade80', label: 'Form (TSB)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly training load */}
      {weeklyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Weekly Training Stress</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [Math.round(v), 'TSS']} />
              <Bar dataKey="tss" name="TSS" fill="#818cf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Training zones guide */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3 text-xs text-text-secondary">
        <p className="font-medium text-text-primary text-sm">Understanding Training Load</p>
        <div className="space-y-2">
          {[
            {
              term: 'Fitness (CTL)',
              color: '#60a5fa',
              desc: '42-day exponential average of daily training stress. Higher = more fit, but takes weeks to build.',
            },
            {
              term: 'Fatigue (ATL)',
              color: '#fb923c',
              desc: '7-day average of training stress. Spikes quickly after hard blocks, drops with rest.',
            },
            {
              term: 'Form (TSB)',
              color: '#4ade80',
              desc: 'CTL minus ATL. Positive = fresh and sharp. Negative = tired but building. Target +5 to +25 for peak races.',
            },
            {
              term: 'Ramp Rate',
              color: '#a78bfa',
              desc: 'Week-over-week CTL change. Safe progression is 3–8 points per week. Over 8 = injury risk.',
            },
          ].map(({ term, color, desc }) => (
            <div key={term} className="flex gap-2">
              <div className="w-1.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: color, alignSelf: 'start', height: '1em' }} />
              <div>
                <span className="font-medium text-text-primary">{term}: </span>
                {desc}
              </div>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1 border-t border-border">
          TSS is estimated from active calories (or workout duration). Accuracy improves with more workout data. Based on the Banister impulse-response model used by cycling and triathlon coaches.
        </p>
      </div>
    </div>
  )
}
