'use client'

import {
  AreaChart,
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

interface HealthRecord {
  value: number
  start_time: string
}

interface Summary {
  date: string
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  resting_heart_rate: number | null
}

interface RespiratoryClientProps {
  records: HealthRecord[]
  summaries: Summary[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function classify(bpm: number): { label: string; color: string; bg: string } {
  if (bpm < 12) return { label: 'Below Normal', color: '#fb923c', bg: 'bg-orange-500/10 border-orange-500/20' }
  if (bpm <= 20) return { label: 'Normal', color: '#4ade80', bg: 'bg-green-500/10 border-green-500/20' }
  if (bpm <= 25) return { label: 'Elevated', color: '#facc15', bg: 'bg-yellow-500/10 border-yellow-500/20' }
  return { label: 'High', color: '#f87171', bg: 'bg-red-500/10 border-red-500/20' }
}

function fmtDate(iso: string) {
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RespiratoryClient({ records, summaries }: RespiratoryClientProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🌬️</span>
        <h2 className="text-lg font-semibold text-text-primary">No respiratory data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch measures breathing rate during sleep. Enable sleep tracking in the Health app and sync your iPhone.
        </p>
      </div>
    )
  }

  const values = records.map((r: HealthRecord) => r.value)
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10
  const min = Math.min(...values)
  const max = Math.max(...values)
  const latest = records[records.length - 1].value
  const latestStatus = classify(latest)
  const avgStatus = classify(avg)

  // Daily averages
  const dailyMap: Record<string, number[]> = {}
  for (const r of records) {
    const day = r.start_time.slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = []
    dailyMap[day].push(r.value)
  }
  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, vals]) => ({
      date: fmtDate(day + 'T00:00:00'),
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10,
      min: Math.min(...vals),
      max: Math.max(...vals),
    }))

  // Distribution bucketed by bpm range
  const buckets: Record<string, number> = {}
  for (const v of values) {
    const bucket = `${Math.floor(v)}`
    buckets[bucket] = (buckets[bucket] ?? 0) + 1
  }
  const distData = Object.entries(buckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([bpm, count]) => ({ bpm: `${bpm}`, count }))

  // Trend: 7-day rolling average
  const rollingData = dailyData.map((d, i) => {
    const slice = dailyData.slice(Math.max(0, i - 6), i + 1)
    const rolling = Math.round(slice.reduce((s, x) => s + x.avg, 0) / slice.length * 10) / 10
    return { ...d, rolling }
  })

  // Correlation with sleep duration
  const sleepByDate = new Map(summaries.map((s) => [s.date, s]))
  const sleepCorr: Array<{ sleep: number; resp: number }> = []
  for (const [day, vals] of Object.entries(dailyMap)) {
    const s = sleepByDate.get(day)
    if (s?.sleep_duration_minutes && s.sleep_duration_minutes > 60) {
      sleepCorr.push({
        sleep: Math.round(s.sleep_duration_minutes / 60 * 10) / 10,
        resp: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10,
      })
    }
  }

  // Week-over-week trend
  const weeks: Record<string, number[]> = {}
  for (const [day, vals] of Object.entries(dailyMap)) {
    const d = new Date(day + 'T00:00:00')
    const dow = (d.getDay() + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - dow)
    const wk = monday.toISOString().slice(0, 10)
    if (!weeks[wk]) weeks[wk] = []
    weeks[wk].push(...vals)
  }
  const weeklyData = Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([wk, vals]) => ({
      week: fmtDate(wk + 'T00:00:00'),
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10,
    }))

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className={`rounded-xl border p-5 ${latestStatus.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Latest Reading</p>
            <p className="text-5xl font-black" style={{ color: latestStatus.color }}>{latest}</p>
            <p className="text-sm" style={{ color: latestStatus.color }}>breaths/min · {latestStatus.label}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">{avg}</p>
            <p className="text-xs text-text-secondary">90-day avg</p>
            <p className={`text-xs mt-0.5`} style={{ color: avgStatus.color }}>{avgStatus.label}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Minimum', value: min, unit: 'brpm' },
          { label: 'Average', value: avg, unit: 'brpm' },
          { label: 'Maximum', value: max, unit: 'brpm' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{unit}</p>
            <p className="text-xs text-text-secondary opacity-70">{label}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {rollingData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={rollingData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={[Math.max(6, min - 2), Math.min(35, max + 2)]} width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v} brpm`, name === 'avg' ? 'Daily avg' : '7-day avg']} />
              <ReferenceLine y={12} stroke="rgba(74,222,128,0.3)" strokeDasharray="3 2" />
              <ReferenceLine y={20} stroke="rgba(74,222,128,0.3)" strokeDasharray="3 2" label={{ value: 'Normal (12–20)', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.4)' }} />
              <Area type="monotone" dataKey="avg" stroke="#22d3ee" strokeWidth={1.5} fill="url(#respGrad)" dot={false} opacity={0.5} />
              <Area type="monotone" dataKey="rolling" stroke="#22d3ee" strokeWidth={2.5} fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribution histogram */}
      {distData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Breathing Rate Distribution</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={distData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="bpm" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} unit=" br" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={24} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Readings']} />
              <Bar dataKey="count" fill="#22d3ee" radius={[2, 2, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly averages */}
      {weeklyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Weekly Average</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={[Math.max(8, min - 2), Math.min(30, max + 2)]} width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} brpm`, 'Weekly avg']} />
              <ReferenceLine y={20} stroke="rgba(74,222,128,0.3)" strokeDasharray="3 2" />
              <Bar dataKey="avg" fill="#818cf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">About Respiratory Rate</p>
        <p>Normal adult respiratory rate at rest is 12–20 breaths per minute. Apple Watch measures breathing rate primarily during sleep using motion sensors to detect chest movements.</p>
        <div className="space-y-1">
          {[
            { range: '< 12 brpm', label: 'Below Normal', color: 'text-orange-400', desc: 'Can indicate very deep relaxation or bradypnea' },
            { range: '12–20 brpm', label: 'Normal', color: 'text-green-400', desc: 'Healthy adult range at rest' },
            { range: '21–25 brpm', label: 'Elevated', color: 'text-yellow-400', desc: 'May indicate mild stress or illness' },
            { range: '> 25 brpm', label: 'High', color: 'text-red-400', desc: 'Tachypnea — consult a doctor if persistent' },
          ].map(({ range, label, color, desc }) => (
            <div key={range} className="flex gap-2">
              <span className="font-mono opacity-70 shrink-0 w-20">{range}</span>
              <span className={`${color} shrink-0`}>{label}</span>
              <span className="opacity-60">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
