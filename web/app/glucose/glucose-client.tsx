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

interface GlucoseReading {
  timestamp: string
  mgdl: number
  mmol: number
  hour: number
}

interface GlucoseClientProps {
  readings: GlucoseReading[]
}

// ADA / WHO glucose ranges (fasting or general)
// Using mg/dL throughout; show mmol/L as secondary
const RANGES = {
  hypo: 70,      // < 70: hypoglycemia
  normal: 100,   // 70–99: normal fasting
  preDiabetes: 126, // 100–125: pre-diabetes range
  // > 126 fasting: diabetes territory
}

function classify(mgdl: number): { label: string; color: string } {
  if (mgdl < 70) return { label: 'Low', color: '#60a5fa' }
  if (mgdl < 100) return { label: 'Normal', color: '#4ade80' }
  if (mgdl < 126) return { label: 'Elevated', color: '#facc15' }
  if (mgdl < 180) return { label: 'High', color: '#fb923c' }
  return { label: 'Very High', color: '#f87171' }
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function fmtHour(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

export function GlucoseClient({ readings }: GlucoseClientProps) {
  if (readings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🩸</span>
        <h2 className="text-lg font-semibold text-text-primary">No blood glucose data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import glucose readings from a CGM or blood glucose meter connected to Apple Health.
        </p>
      </div>
    )
  }

  const mgdlValues = readings.map((r) => r.mgdl)
  const avgMgdl = Math.round(mgdlValues.reduce((a, b) => a + b, 0) / mgdlValues.length)
  const minMgdl = Math.min(...mgdlValues)
  const maxMgdl = Math.max(...mgdlValues)
  const latest = readings[readings.length - 1]
  const latestCat = classify(latest.mgdl)

  // Estimated A1c from average glucose: eA1C = (avgMgdl + 46.7) / 28.7
  const estA1c = ((avgMgdl + 46.7) / 28.7).toFixed(1)

  // Low / in-range / high counts
  const lowCount = readings.filter((r) => r.mgdl < 70).length
  const inRangeCount = readings.filter((r) => r.mgdl >= 70 && r.mgdl <= 180).length
  const highCount = readings.filter((r) => r.mgdl > 180).length
  const timeInRange = Math.round((inRangeCount / readings.length) * 100)

  // Time series (last 200 points max)
  const trendData = readings.slice(-200).map((r) => ({
    date: fmtDate(r.timestamp),
    mgdl: r.mgdl,
  }))

  // Hourly average for pattern analysis
  const hourlyMap: Record<number, number[]> = {}
  for (const r of readings) {
    if (!hourlyMap[r.hour]) hourlyMap[r.hour] = []
    hourlyMap[r.hour].push(r.mgdl)
  }
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const vals = hourlyMap[h]
    if (!vals || !vals.length) return null
    return { hour: fmtHour(h), avgMgdl: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }
  }).filter(Boolean) as { hour: string; avgMgdl: number }[]

  return (
    <div className="space-y-6">
      {/* Latest reading */}
      <div className="bg-surface rounded-xl border border-border p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary mb-1">Latest Reading</p>
          <p className="text-4xl font-bold" style={{ color: latestCat.color }}>
            {latest.mgdl} <span className="text-lg text-text-secondary">mg/dL</span>
          </p>
          <p className="text-sm text-text-secondary">{latest.mmol} mmol/L</p>
          <p className="text-xs text-text-secondary mt-1">{fmtDateTime(latest.timestamp)}</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-surface-secondary border border-border" style={{ color: latestCat.color }}>
            {latestCat.label}
          </span>
          <p className="text-xs text-text-secondary mt-3">Est. A1c</p>
          <p className="text-xl font-bold text-purple-400">{estA1c}%</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{avgMgdl}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg (mg/dL)</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-xl font-bold ${timeInRange >= 70 ? 'text-green-400' : timeInRange >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {timeInRange}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Time in Range</p>
          <p className="text-xs text-text-secondary opacity-60">70–180 mg/dL</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-blue-400">{minMgdl}</p>
          <p className="text-xs text-text-secondary mt-0.5">Lowest (mg/dL)</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-orange-400">{maxMgdl}</p>
          <p className="text-xs text-text-secondary mt-0.5">Highest (mg/dL)</p>
        </div>
      </div>

      {/* Time in range breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Time in Range Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: 'Low (< 70)', count: lowCount, color: '#60a5fa' },
            { label: 'In Range (70–180)', count: inRangeCount, color: '#4ade80' },
            { label: 'High (> 180)', count: highCount, color: '#fb923c' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-xs font-medium" style={{ color }}>{label}</div>
              <div className="flex-1 h-4 bg-surface-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(count / readings.length) * 100}%`, backgroundColor: color + '99' }} />
              </div>
              <div className="text-xs text-text-secondary w-16 text-right shrink-0">
                {count} ({Math.round((count / readings.length) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      {trendData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Glucose Trend (mg/dL)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={[40, 300]} width={32} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${Math.round(v)} mg/dL`, 'Glucose']} />
              <ReferenceLine y={70} stroke="rgba(96,165,250,0.4)" strokeDasharray="4 3"
                label={{ value: '70', position: 'insideTopRight', fontSize: 9, fill: 'rgba(96,165,250,0.5)' }} />
              <ReferenceLine y={100} stroke="rgba(74,222,128,0.3)" strokeDasharray="4 3"
                label={{ value: '100', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.4)' }} />
              <ReferenceLine y={180} stroke="rgba(251,146,60,0.3)" strokeDasharray="4 3"
                label={{ value: '180', position: 'insideTopRight', fontSize: 9, fill: 'rgba(251,146,60,0.4)' }} />
              <Area type="monotone" dataKey="mgdl" stroke="#a78bfa" fill="rgba(167,139,250,0.1)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hourly pattern */}
      {hourlyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Average by Time of Day (mg/dL)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={hourlyData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={[60, 200]} width={32} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} mg/dL`, 'Avg glucose']} />
              <ReferenceLine y={70} stroke="rgba(96,165,250,0.3)" strokeDasharray="3 2" />
              <ReferenceLine y={180} stroke="rgba(251,146,60,0.3)" strokeDasharray="3 2" />
              <Area type="monotone" dataKey="avgMgdl" stroke="#c084fc" fill="rgba(192,132,252,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reference guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Glucose reference ranges</p>
        <div className="space-y-2">
          {[
            { label: 'Hypoglycemia', range: '< 70 mg/dL (< 3.9 mmol/L)', color: 'text-blue-400', detail: 'Low blood sugar. May cause dizziness, confusion. Treat immediately with fast-acting carbs.' },
            { label: 'Normal fasting', range: '70–99 mg/dL (3.9–5.5 mmol/L)', color: 'text-green-400', detail: 'Healthy fasting range. Post-meal: up to ~140 mg/dL is typical.' },
            { label: 'Pre-diabetes', range: '100–125 mg/dL (5.6–6.9 mmol/L)', color: 'text-yellow-400', detail: 'Impaired fasting glucose. Lifestyle changes can prevent progression to diabetes.' },
            { label: 'Diabetes', range: '≥ 126 mg/dL (≥ 7.0 mmol/L)', color: 'text-red-400', detail: 'Consistently high glucose. Requires medical evaluation and management.' },
            { label: 'Time in Range goal (CGM)', range: '70–180 mg/dL ≥ 70% of time', color: 'text-purple-400', detail: 'ADA target for people with diabetes. Higher TIR is associated with fewer complications.' },
          ].map(({ label, range, color, detail }) => (
            <div key={label}>
              <p className="font-medium text-text-primary"><span className={color}>{label}</span> — <span className="font-mono">{range}</span></p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1 border-t border-border">
          Estimated A1c uses the formula: eA1C = (avg glucose + 46.7) / 28.7 (ADA 2008). For diagnostic purposes only — consult your healthcare provider.
        </p>
      </div>

      {/* Recent readings */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Readings</h2>
        {[...readings].reverse().slice(0, 20).map((r, i) => {
          const cat = classify(r.mgdl)
          return (
            <div key={i} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-text-secondary">{fmtDateTime(r.timestamp)}</p>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: cat.color }}>{r.mgdl} mg/dL</p>
                <p className="text-xs text-text-secondary">{r.mmol} mmol/L · {cat.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
