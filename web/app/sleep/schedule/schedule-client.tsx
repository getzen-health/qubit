'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts'

interface Night {
  date: string
  bedtimeIso: string
  waketimeIso: string
  bedHour: number    // hours since noon (8 = 8pm, 12 = midnight, 13 = 1am)
  wakeHour: number   // 0-24
  durationMinutes: number
  isWeekend: boolean
  weekday: number
  debt: number
  cumDebtMinutes: number
}

interface SleepScheduleClientProps {
  nights: Night[]
  sleepGoalMinutes: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtHour(h: number): string {
  // h is hours since noon: 0=noon, 8=8pm, 12=midnight, 13=1am
  const actual = (h + 12) % 24
  const hour = Math.floor(actual)
  const min = Math.round((actual - hour) * 60)
  const ampm = hour < 12 ? 'am' : 'pm'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${min.toString().padStart(2, '0')} ${ampm}`
}

function fmtWakeHour(h: number): string {
  const hour = Math.floor(h)
  const min = Math.round((h - hour) * 60)
  const ampm = hour < 12 ? 'am' : 'pm'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${min.toString().padStart(2, '0')} ${ampm}`
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function mean(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function socialJetLagLabel(hours: number): { label: string; color: string } {
  if (hours < 0.5) return { label: 'Minimal', color: 'text-green-400' }
  if (hours < 1) return { label: 'Mild', color: 'text-yellow-400' }
  if (hours < 2) return { label: 'Moderate', color: 'text-orange-400' }
  return { label: 'High', color: 'text-red-400' }
}

function consistencyLabel(sdHours: number): { label: string; color: string } {
  if (sdHours < 0.5) return { label: 'Very consistent', color: 'text-green-400' }
  if (sdHours < 1) return { label: 'Consistent', color: 'text-blue-400' }
  if (sdHours < 1.5) return { label: 'Variable', color: 'text-yellow-400' }
  return { label: 'Irregular', color: 'text-red-400' }
}

function chronotype(avgBedHour: number): string {
  // bedHour = hours since noon (8 = 8pm, 12 = midnight, 13 = 1am)
  if (avgBedHour < 7) return '🌅 Early Bird (before 7pm)' // unlikely but handle
  if (avgBedHour < 9) return '🌅 Early Bird (before 9pm)'
  if (avgBedHour < 10.5) return '🌤 Morning Person (9–10:30pm)'
  if (avgBedHour < 12.5) return '🌙 Intermediate (10:30pm–12:30am)'
  if (avgBedHour < 14) return '🦉 Night Owl (12:30–2am)'
  return '🦉 Extreme Night Owl (after 2am)'
}

export function SleepScheduleClient({ nights, sleepGoalMinutes }: SleepScheduleClientProps) {
  if (nights.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🌙</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough sleep data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          At least 5 nights of sleep data required for schedule analysis. Sync your iPhone to get started.
        </p>
      </div>
    )
  }

  const bedHours = nights.map((n) => n.bedHour)
  const wakeHours = nights.map((n) => n.wakeHour)
  const avgBedHour = mean(bedHours)
  const avgWakeHour = mean(wakeHours)
  const sdBed = stdDev(bedHours)
  const sdWake = stdDev(wakeHours)

  // Social jet lag
  const weekdayBeds = nights.filter((n) => !n.isWeekend).map((n) => n.bedHour)
  const weekendBeds = nights.filter((n) => n.isWeekend).map((n) => n.bedHour)
  const socialJetLagHours = weekdayBeds.length > 0 && weekendBeds.length > 0
    ? Math.abs(mean(weekendBeds) - mean(weekdayBeds))
    : null

  const consistency = consistencyLabel(sdBed)
  const currentDebt = nights[nights.length - 1]?.cumDebtMinutes ?? 0

  // Bedtime scatter chart data (last 30 nights)
  const scatterData = nights.slice(-30).map((n, i) => ({
    index: i,
    date: fmtDate(n.date),
    bedHour: +n.bedHour.toFixed(2),
    wakeHour: +n.wakeHour.toFixed(2),
    isWeekend: n.isWeekend,
  }))

  // Sleep debt area chart
  const debtChartData = nights.slice(-30).map((n) => ({
    date: fmtDate(n.date),
    debt: Math.round(n.cumDebtMinutes / 60 * 10) / 10, // hours, negative
  }))

  // Bedtime trend (line-like scatter)
  const bedtimeChartData = nights.slice(-30).map((n) => ({
    date: fmtDate(n.date),
    bed: +n.bedHour.toFixed(2),
    wake: +n.wakeHour.toFixed(2),
  }))

  return (
    <div className="space-y-6">
      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-xl font-bold ${consistency.color}`}>{consistency.label}</p>
          <p className="text-xs text-text-secondary mt-0.5">Bedtime consistency</p>
          <p className="text-xs text-text-secondary opacity-60">± {sdBed.toFixed(1)}h SD</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-indigo-400">{fmtHour(avgBedHour)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg bedtime</p>
          <p className="text-xs text-text-secondary opacity-60">± {sdBed.toFixed(1)}h</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-amber-400">{fmtWakeHour(avgWakeHour)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg wake time</p>
          <p className="text-xs text-text-secondary opacity-60">± {sdWake.toFixed(1)}h</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-xl font-bold ${currentDebt < -60 ? 'text-red-400' : currentDebt < -30 ? 'text-orange-400' : 'text-green-400'}`}>
            {currentDebt === 0 ? 'None' : `${(Math.abs(currentDebt) / 60).toFixed(1)}h`}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sleep debt</p>
          <p className="text-xs text-text-secondary opacity-60">accumulated</p>
        </div>
      </div>

      {/* Chronotype + social jet lag */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Chronotype</p>
          <p className="text-sm font-medium text-text-primary">{chronotype(avgBedHour)}</p>
          <p className="text-xs text-text-secondary mt-1">Based on your average bedtime of {fmtHour(avgBedHour)}.</p>
        </div>
        {socialJetLagHours !== null && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Social Jet Lag</p>
            <div className="flex items-center gap-2">
              <p className={`text-lg font-bold ${socialJetLagLabel(socialJetLagHours).color}`}>
                {socialJetLagHours.toFixed(1)}h
              </p>
              <p className={`text-sm ${socialJetLagLabel(socialJetLagHours).color}`}>
                {socialJetLagLabel(socialJetLagHours).label}
              </p>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Difference between your weekday ({weekdayBeds.length > 0 ? fmtHour(mean(weekdayBeds)) : '—'}) and weekend ({weekendBeds.length > 0 ? fmtHour(mean(weekendBeds)) : '—'}) bedtimes.
              High social jet lag is linked to metabolic and cardiovascular risks.
            </p>
          </div>
        )}
      </div>

      {/* Bedtime / wake scatter */}
      {bedtimeChartData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Bedtime & Wake Time (last 30 nights)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                type="category"
                data={bedtimeChartData}
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[4, 24]}
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => {
                  const h = v === 0 ? 12 : v > 12 ? v - 12 : v
                  const ampm = v < 12 ? 'am' : 'pm'
                  return `${h}${ampm}`
                }}
                width={36}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => {
                const h = Math.floor(v)
                const m = Math.round((v - h) * 60)
                const ampm = h < 12 ? 'am' : 'pm'
                const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
                return [`${h12}:${m.toString().padStart(2, '0')} ${ampm}`, name === 'bed' ? 'Bedtime' : 'Wake time']
              }} />
              <ReferenceLine y={avgBedHour < 12 ? avgBedHour + 12 : avgBedHour} stroke="#818cf8" strokeDasharray="4 3" />
              <ReferenceLine y={avgWakeHour} stroke="#fbbf24" strokeDasharray="4 3" />
              <Scatter data={bedtimeChartData.map(d => ({ ...d, bedActual: d.bed < 12 ? d.bed + 12 : d.bed }))}
                dataKey="bedActual" fill="#818cf8" name="bed" r={3} />
              <Scatter data={bedtimeChartData} dataKey="wake" fill="#fbbf24" name="wake" r={3} />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-400" /> Bedtime</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> Wake time</div>
          </div>
        </div>
      )}

      {/* Sleep debt area chart */}
      {debtChartData.some((d) => d.debt < 0) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">Accumulated Sleep Debt (hours)</h3>
          <p className="text-xs text-text-secondary mb-3 opacity-70">Negative = hours owed relative to your {Math.floor(sleepGoalMinutes / 60)}h goal</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={debtChartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}h`}
                width={32}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}h`, 'Sleep debt']} />
              <ReferenceLine y={0} stroke="rgba(74,222,128,0.3)" />
              <Area type="monotone" dataKey="debt" stroke="#f87171" fill="rgba(248,113,113,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Why schedule consistency matters</p>
        <div className="space-y-2">
          {[
            { title: 'Bedtime consistency', detail: 'A standard deviation under 30 min is optimal. Irregular sleep times disrupt your circadian rhythm, impairing mood, cognition, and metabolic health.' },
            { title: 'Social jet lag', detail: 'Sleeping later on weekends mimics traveling across time zones every week. Even 1–2h of social jet lag is associated with higher obesity and cardiovascular risk.' },
            { title: 'Sleep debt', detail: 'Sleep debt is cumulative. The body cannot fully recover by sleeping extra on weekends — the cognitive effects of sustained short sleep persist for weeks.' },
            { title: 'Chronotype', detail: 'Your natural sleep timing preference. Night owls who must wake early for work accumulate the most social jet lag. Exposure to morning light can shift chronotype earlier.' },
          ].map(({ title, detail }) => (
            <div key={title}>
              <p className="font-medium text-text-primary">{title}</p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
