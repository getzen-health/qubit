'use client'

import dynamic from 'next/dynamic'
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Pie,
  Legend,
} from 'recharts'

const BarChart = dynamic(() => import('recharts').then((m) => ({ default: m.BarChart })), { ssr: false })
const PieChart = dynamic(() => import('recharts').then((m) => ({ default: m.PieChart })), { ssr: false })

interface RunPoint {
  date: string
  week: string
  durationMinutes: number
  distanceKm: number
  paceSecsPerKm: number
  zone: 1 | 2 | 3 | 4 | 5
  avgHr: number | null
}

interface Props {
  points: RunPoint[]
  thresholdPace: number | null  // seconds/km
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const ZONE_CONFIG = {
  1: { label: 'Easy', color: '#60a5fa', desc: '> 125% of threshold pace' },
  2: { label: 'Steady', color: '#4ade80', desc: '110–125% of threshold' },
  3: { label: 'Tempo', color: '#facc15', desc: '103–110% of threshold' },
  4: { label: 'Threshold', color: '#fb923c', desc: '98–103% of threshold' },
  5: { label: 'Race', color: '#f87171', desc: 'At or faster than threshold' },
}

function fmtPace(secsPerKm: number) {
  const min = Math.floor(secsPerKm / 60)
  const sec = Math.round(secsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

function fmtMin(mins: number) {
  if (mins < 60) return `${Math.round(mins)} min`
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function PaceZonesClient({ points, thresholdPace }: Props) {
  if (points.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏃</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Log at least 3 runs with distance and pace to see your pace zone distribution.
        </p>
      </div>
    )
  }

  // Total minutes per zone
  const zoneTotals = [1, 2, 3, 4, 5].map((z) => {
    const zPoints = points.filter((p) => p.zone === z)
    const mins = zPoints.reduce((s, p) => s + p.durationMinutes, 0)
    const km = zPoints.reduce((s, p) => s + p.distanceKm, 0)
    return { zone: z as 1|2|3|4|5, mins, km, count: zPoints.length }
  })

  const totalMins = zoneTotals.reduce((s, z) => s + z.mins, 0)
  const easyMins = zoneTotals.filter((z) => z.zone <= 2).reduce((s, z) => s + z.mins, 0)
  const hardMins = totalMins - easyMins
  const easyPct = totalMins > 0 ? Math.round((easyMins / totalMins) * 100) : 0
  const hardPct = 100 - easyPct

  const isGood8020 = easyPct >= 75

  // Pie data
  const pieData = zoneTotals
    .filter((z) => z.mins > 0)
    .map((z) => ({
      name: ZONE_CONFIG[z.zone].label,
      value: z.mins,
      color: ZONE_CONFIG[z.zone].color,
      zone: z.zone,
    }))

  // Weekly zone breakdown
  const weekMap = new Map<string, Record<number, number>>()
  for (const p of points) {
    if (!weekMap.has(p.week)) weekMap.set(p.week, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
    weekMap.get(p.week)![p.zone] += p.durationMinutes
  }
  const weeklyData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // last 12 weeks
    .map(([week, zones]) => ({
      week: week.replace(/^(\d{4})-W(\d+)$/, 'W$2'),
      easy: Math.round((zones[1] ?? 0) + (zones[2] ?? 0)),
      tempo: Math.round(zones[3] ?? 0),
      threshold: Math.round(zones[4] ?? 0),
      race: Math.round(zones[5] ?? 0),
    }))

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Runs', value: points.length.toString(), sub: 'last 90 days', color: 'text-text-primary' },
          { label: 'Easy/Steady', value: `${easyPct}%`, sub: fmtMin(easyMins), color: easyPct >= 75 ? 'text-green-400' : 'text-yellow-400' },
          { label: 'Hard (Z3-5)', value: `${hardPct}%`, sub: fmtMin(hardMins), color: hardPct <= 25 ? 'text-green-400' : 'text-orange-400' },
          { label: 'Threshold Pace', value: thresholdPace ? fmtPace(thresholdPace) : '—', sub: 'fastest recorded', color: 'text-red-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* 80/20 banner */}
      <div className={`rounded-xl p-4 border ${isGood8020 ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{isGood8020 ? '✅' : '⚠️'}</span>
          <div>
            <p className={`text-sm font-semibold ${isGood8020 ? 'text-green-400' : 'text-orange-400'}`}>
              {isGood8020
                ? `${easyPct}% easy — great 80/20 balance`
                : `${easyPct}% easy — aim for at least 75–80%`}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {isGood8020
                ? 'Most elite endurance athletes run 80% of their mileage at easy pace. You\'re building aerobic base efficiently.'
                : 'Too much hard running leads to accumulation of fatigue without proportional aerobic gains. Add more easy runs.'}
            </p>
          </div>
        </div>
      </div>

      {/* Pie chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-4">Time in Each Zone (minutes)</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtMin(v), 'Time']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {zoneTotals.map((z) => (
              <div key={z.zone} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: ZONE_CONFIG[z.zone].color }} />
                  <span className="text-text-primary font-medium">Z{z.zone} {ZONE_CONFIG[z.zone].label}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-primary">{fmtMin(z.mins)}</span>
                  <span className="text-text-secondary text-xs ml-1">
                    ({totalMins > 0 ? Math.round((z.mins / totalMins) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly stacked bar */}
      {weeklyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Weekly Zone Distribution (min)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [fmtMin(v), name]} />
              <Bar dataKey="easy" stackId="a" name="Easy/Steady" fill="#60a5fa" />
              <Bar dataKey="tempo" stackId="a" name="Tempo" fill="#facc15" />
              <Bar dataKey="threshold" stackId="a" name="Threshold" fill="#fb923c" />
              <Bar dataKey="race" stackId="a" name="Race" fill="#f87171" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
            {[
              { color: '#60a5fa', label: 'Easy/Steady' },
              { color: '#facc15', label: 'Tempo' },
              { color: '#fb923c', label: 'Threshold' },
              { color: '#f87171', label: 'Race' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone table */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Zone Definitions</h2>
        <div className="space-y-2 text-xs">
          {([1, 2, 3, 4, 5] as const).map((z) => {
            const zone = ZONE_CONFIG[z]
            const data = zoneTotals.find((t) => t.zone === z)!
            return (
              <div key={z} className="grid grid-cols-4 gap-2 py-2 border-b border-border last:border-0 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: zone.color }} />
                  <span className="font-medium text-text-primary">Z{z} {zone.label}</span>
                </div>
                <span className="text-text-secondary">{zone.desc}</span>
                <span className="text-text-secondary">{fmtMin(data.mins)}</span>
                <span className="text-text-secondary">{data.count} runs</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-text-secondary opacity-50 mt-3">
          Zones calculated relative to your fastest recorded pace ({thresholdPace ? fmtPace(thresholdPace) : '—'}). Each run is classified by its average pace.
        </p>
      </div>

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">The 80/20 Rule</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p>Research by Dr. Stephen Seiler shows that elite endurance athletes spend <span className="text-green-400 font-medium">roughly 80% of training time at low intensity</span> (Z1–Z2) and only 20% at moderate-to-high intensity.</p>
          <p>This polarized approach builds a large aerobic base while allowing full recovery between hard sessions — resulting in superior adaptation compared to always training at moderate intensity.</p>
          <p><span className="text-orange-400 font-medium">Avoid the "grey zone":</span> Running at moderate pace (Z3) is too hard to be truly easy, and too easy to drive significant adaptation. It accumulates fatigue without the benefits of either extreme.</p>
          <p className="opacity-60 pt-1">Zones are relative to your fastest recorded pace, not HR. For HR-based zones see the Training Zones page.</p>
        </div>
      </div>
    </div>
  )
}
