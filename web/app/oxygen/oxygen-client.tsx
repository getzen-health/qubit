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
  AreaChart,
  Area,
} from 'recharts'

interface OxygenRecord {
  value: number
  start_time: string
}

interface OxygenClientProps {
  records: OxygenRecord[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function classifySpo2(pct: number): { label: string; color: string; bg: string } {
  if (pct >= 95) return { label: 'Normal', color: '#4ade80', bg: 'bg-green-500/10 border-green-500/20' }
  if (pct >= 90) return { label: 'Mild Hypoxemia', color: '#fb923c', bg: 'bg-orange-500/10 border-orange-500/20' }
  return { label: 'Low', color: '#f87171', bg: 'bg-red-500/10 border-red-500/20' }
}

function dotColor(pct: number): string {
  if (pct >= 95) return '#4ade80'
  if (pct >= 90) return '#fb923c'
  return '#f87171'
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDate(iso: string) {
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getHour(iso: string): number {
  return new Date(iso).getHours()
}

export function OxygenClient({ records }: OxygenClientProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🫁</span>
        <h2 className="text-lg font-semibold text-text-primary">No SpO₂ data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch Series 6+ takes background blood oxygen readings. Enable Blood Oxygen in the Health app and sync your iPhone.
        </p>
      </div>
    )
  }

  const values = records.map((r) => r.value)
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10
  const min = Math.min(...values)
  const max = Math.max(...values)
  const latest = records[records.length - 1].value
  const latestStatus = classifySpo2(latest)
  const avgStatus = classifySpo2(avg)

  const belowNormal = records.filter((r) => r.value < 95).length
  const belowNormalPct = Math.round((belowNormal / records.length) * 100)

  // Daily average trend
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
    }))

  // Hourly distribution (time of day when readings occur)
  const hourlyAvg: Record<number, number[]> = {}
  for (const r of records) {
    const h = getHour(r.start_time)
    if (!hourlyAvg[h]) hourlyAvg[h] = []
    hourlyAvg[h].push(r.value)
  }
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`,
    avg: hourlyAvg[h] ? Math.round(hourlyAvg[h].reduce((a, b) => a + b, 0) / hourlyAvg[h].length * 10) / 10 : null,
    count: hourlyAvg[h]?.length ?? 0,
  })).filter((d) => d.avg !== null)

  // Nightly (sleep hours: 10pm–6am) vs daytime
  const nightReadings = records.filter((r) => { const h = getHour(r.start_time); return h >= 22 || h < 6 })
  const dayReadings = records.filter((r) => { const h = getHour(r.start_time); return h >= 6 && h < 22 })
  const nightAvg = nightReadings.length > 0
    ? Math.round(nightReadings.reduce((s, r) => s + r.value, 0) / nightReadings.length * 10) / 10
    : null
  const dayAvg = dayReadings.length > 0
    ? Math.round(dayReadings.reduce((s, r) => s + r.value, 0) / dayReadings.length * 10) / 10
    : null

  // Recent scatter data (last 30 days)
  const scatterData = records.slice(-200).map((r) => ({
    time: new Date(r.start_time).getTime(),
    value: r.value,
    label: `${fmtDate(r.start_time)} ${fmtTime(r.start_time)}`,
    color: dotColor(r.value),
  }))

  return (
    <div className="space-y-6">
      {/* Hero status */}
      <div className={`rounded-xl border p-5 ${latestStatus.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Latest Reading</p>
            <p className="text-5xl font-black" style={{ color: latestStatus.color }}>{latest}%</p>
            <p className="text-sm font-medium mt-1" style={{ color: latestStatus.color }}>{latestStatus.label}</p>
          </div>
          <div className="text-right text-sm text-text-secondary">
            <p className="text-2xl font-bold text-text-primary">{avg}%</p>
            <p className="text-xs">90-day avg</p>
            <p className={`text-xs mt-0.5 ${avgStatus.color}`}>{avgStatus.label}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Minimum', value: `${min}%`, color: min < 95 ? 'text-orange-400' : 'text-text-primary' },
          { label: 'Average', value: `${avg}%`, color: 'text-green-400' },
          { label: 'Maximum', value: `${max}%`, color: 'text-text-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Readings breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Reading Distribution</h3>
        <div className="space-y-2">
          {[
            { label: 'Normal (≥ 95%)', count: records.filter((r) => r.value >= 95).length, color: '#4ade80' },
            { label: 'Mild Hypoxemia (90–94%)', count: records.filter((r) => r.value >= 90 && r.value < 95).length, color: '#fb923c' },
            { label: 'Low (< 90%)', count: records.filter((r) => r.value < 90).length, color: '#f87171' },
          ].map(({ label, count, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">{label}</span>
                <span style={{ color }}>{count} ({Math.round((count / records.length) * 100)}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(count / records.length) * 100}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
        </div>
        {belowNormalPct > 10 && (
          <p className="text-xs text-orange-400 mt-3">
            {belowNormalPct}% of readings below 95% — consider discussing with a healthcare provider if symptoms occur.
          </p>
        )}
      </div>

      {/* Day vs night */}
      {nightAvg !== null && dayAvg !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Day vs Night</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: dotColor(dayAvg) }}>{dayAvg}%</p>
              <p className="text-xs text-text-secondary mt-0.5">Daytime avg</p>
              <p className="text-xs text-text-secondary opacity-60">6am–10pm · {dayReadings.length} readings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: dotColor(nightAvg) }}>{nightAvg}%</p>
              <p className="text-xs text-text-secondary mt-0.5">Overnight avg</p>
              <p className="text-xs text-text-secondary opacity-60">10pm–6am · {nightReadings.length} readings</p>
            </div>
          </div>
          {nightAvg < dayAvg - 2 && (
            <p className="text-xs text-orange-400 mt-3">
              Overnight SpO₂ is {(dayAvg - nightAvg).toFixed(1)}% lower than daytime — a notable dip. Low overnight oxygen can indicate sleep-disordered breathing.
            </p>
          )}
        </div>
      )}

      {/* Daily trend */}
      {dailyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Average Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={[Math.max(85, min - 2), 100]} width={28} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [`${v}%`, name === 'avg' ? 'Daily avg' : 'Daily min']}
              />
              <ReferenceLine y={95} stroke="rgba(74,222,128,0.3)" strokeDasharray="3 2" label={{ value: '95%', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.5)' }} />
              <Area type="monotone" dataKey="avg" stroke="#4ade80" strokeWidth={2} fill="url(#spo2Grad)" dot={false} />
              <Area type="monotone" dataKey="min" stroke="#fb923c" strokeWidth={1} fill="none" dot={false} strokeDasharray="3 2" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-green-400" /> Daily avg</div>
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-orange-400 opacity-70" style={{ borderTop: '1px dashed' }} /> Daily min</div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">About SpO₂</p>
        <p>Blood oxygen saturation (SpO₂) measures the percentage of hemoglobin carrying oxygen. Normal levels are 95–100%.</p>
        <p>Apple Watch Series 6+ takes background readings using infrared and visible light sensors on the back. Readings during movement or with poor skin contact may be inaccurate.</p>
        <p className="text-text-secondary/60">⚠️ Apple Watch SpO₂ readings are for wellness purposes only and not a medical device. Consult a doctor for clinical assessment.</p>
      </div>
    </div>
  )
}
