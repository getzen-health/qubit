'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

interface Workout {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  avg_heart_rate: number
  max_heart_rate?: number | null
  distance_meters?: number | null
  active_calories?: number | null
}

interface ZonesClientProps {
  workouts: Workout[]
  maxHr: number
}

const ZONES = [
  { zone: 1, name: 'Recovery', pctMin: 0, pctMax: 0.5, color: '#94a3b8', description: 'Very light effort. Active recovery, easy walks.' },
  { zone: 2, name: 'Aerobic Base', pctMin: 0.5, pctMax: 0.6, color: '#60a5fa', description: 'Light effort. Fat oxidation, builds aerobic base. The "conversational pace" zone.' },
  { zone: 3, name: 'Aerobic', pctMin: 0.6, pctMax: 0.7, color: '#4ade80', description: 'Moderate effort. Improves cardiovascular efficiency. Sustainable for long sessions.' },
  { zone: 4, name: 'Threshold', pctMin: 0.7, pctMax: 0.85, color: '#fb923c', description: 'Hard effort near lactate threshold. Builds speed and power. Hard to sustain beyond 30-60 min.' },
  { zone: 5, name: 'Max Effort', pctMin: 0.85, pctMax: 1.0, color: '#f87171', description: 'Maximum intensity. Improves VO₂ max. Sustainable only in short bursts.' },
]

function getZone(bpm: number, maxHr: number) {
  const pct = bpm / maxHr
  for (const z of [...ZONES].reverse()) {
    if (pct >= z.pctMin) return z
  }
  return ZONES[0]
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

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function ZonesClient({ workouts, maxHr }: ZonesClientProps) {
  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">❤️</span>
        <h2 className="text-lg font-semibold text-text-primary">No workout heart rate data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import workouts with heart rate data from Apple Watch.
        </p>
      </div>
    )
  }

  // Tag each workout with its zone
  const tagged = workouts.map((w) => ({
    ...w,
    zone: getZone(w.avg_heart_rate, maxHr),
    pct: w.avg_heart_rate / maxHr,
  }))

  // Zone distribution (count & minutes per zone)
  const zoneSummary = ZONES.map((z) => {
    const inZone = tagged.filter((w) => w.zone.zone === z.zone)
    return {
      zone: z.zone,
      name: z.name,
      color: z.color,
      count: inZone.length,
      minutes: inZone.reduce((s, w) => s + w.duration_minutes, 0),
      bpmRange: `${Math.round(z.pctMin * maxHr)}–${z.zone === 5 ? maxHr : Math.round(z.pctMax * maxHr)} bpm`,
    }
  })

  const totalMinutes = tagged.reduce((s, w) => s + w.duration_minutes, 0)

  // Weekly breakdown: ISO week key → zone count
  const weekZones: Record<string, Record<number, number>> = {}
  for (const w of tagged) {
    const d = new Date(w.start_time)
    const jan4 = new Date(d.getFullYear(), 0, 4)
    const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
    const key = `W${weekNum}`
    if (!weekZones[key]) weekZones[key] = {}
    weekZones[key][w.zone.zone] = (weekZones[key][w.zone.zone] ?? 0) + w.duration_minutes
  }

  const weekChartData = Object.entries(weekZones)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, zones]) => ({
      week,
      z1: zones[1] ?? 0,
      z2: zones[2] ?? 0,
      z3: zones[3] ?? 0,
      z4: zones[4] ?? 0,
      z5: zones[5] ?? 0,
    }))

  // Pie data
  const pieData = zoneSummary
    .filter((z) => z.minutes > 0)
    .map((z) => ({ name: `Z${z.zone} ${z.name}`, value: z.minutes, color: z.color }))

  return (
    <div className="space-y-6">
      {/* Max HR context */}
      <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <span className="text-red-400 text-lg font-bold">{maxHr}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Max Heart Rate: {maxHr} bpm</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Derived from your highest recorded workout HR. Zone thresholds update automatically as new data syncs.
          </p>
        </div>
      </div>

      {/* Zone thresholds */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Your Zones</h2>
        {zoneSummary.map((z) => (
          <div key={z.zone} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
              style={{ backgroundColor: z.color + '33', color: z.color, border: `1px solid ${z.color}44` }}>
              Z{z.zone}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{z.name}</span>
                <span className="text-xs text-text-secondary font-mono">{z.bpmRange}</span>
              </div>
              {totalMinutes > 0 && z.minutes > 0 && (
                <div className="mt-1.5 h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(z.minutes / totalMinutes) * 100}%`, backgroundColor: z.color }}
                  />
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold" style={{ color: z.color }}>{z.count}</p>
              <p className="text-xs text-text-secondary">{fmtDuration(z.minutes)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Zone distribution pie */}
      {pieData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Time Distribution by Zone</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={1}
                  stroke="rgba(0,0,0,0.3)"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtDuration(v), '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-text-secondary flex-1">{d.name}</span>
                  <span className="font-mono text-text-primary">{Math.round((d.value / totalMinutes) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weekly zone stacked bar */}
      {weekChartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Weekly Zone Time (minutes)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekChartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={28}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${Math.round(v)} min`, name.toUpperCase()]} />
              {ZONES.map((z) => (
                <Bar key={z.zone} dataKey={`z${z.zone}`} stackId="a" fill={z.color} name={`Zone ${z.zone}`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {ZONES.map((z) => (
              <div key={z.zone} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: z.color }} />
                Z{z.zone}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Training zone guide</p>
        <div className="space-y-2">
          {ZONES.map((z) => (
            <div key={z.zone}>
              <p className="font-medium" style={{ color: z.color }}>
                Zone {z.zone} — {z.name} ({Math.round(z.pctMin * 100)}–{Math.round(z.pctMax * 100)}% max HR)
              </p>
              <p className="opacity-70 mt-0.5">{z.description}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1 border-t border-border">
          Ideal training mix for endurance athletes: 80% Zones 1–2, 20% Zones 4–5 (polarized training model).
        </p>
      </div>

      {/* Recent workouts by zone */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Workouts</h2>
        {[...tagged].reverse().slice(0, 20).map((w) => (
          <div key={w.id} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ backgroundColor: w.zone.color + '22', color: w.zone.color, border: `1px solid ${w.zone.color}44` }}
            >
              Z{w.zone.zone}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{w.workout_type}</p>
              <p className="text-xs text-text-secondary">{fmtDate(w.start_time)} · {fmtDuration(w.duration_minutes)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-red-400">{w.avg_heart_rate} bpm</p>
              <p className="text-xs text-text-secondary">{Math.round(w.pct * 100)}% max</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
