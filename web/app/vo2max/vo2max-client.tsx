'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface VO2Reading {
  time: string
  value: number
}

interface VO2MaxClientProps {
  records: VO2Reading[]
}

// Fitness level classifications (general population, mL/kg/min)
// Note: Apple Watch shows age/sex-adjusted, but we use general thresholds here
const FITNESS_LEVELS = [
  { label: 'Superior',      min: 60,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Excellent',     min: 52,  color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20'     },
  { label: 'Good',          min: 43,  color: 'text-lime-400',    bg: 'bg-lime-500/10 border-lime-500/20'       },
  { label: 'Average',       min: 34,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20'   },
  { label: 'Below Average', min: 25,  color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20'   },
  { label: 'Poor',          min: 0,   color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
] as const

function fitnessLevel(vo2: number) {
  return FITNESS_LEVELS.find((l) => vo2 >= l.min) ?? FITNESS_LEVELS[FITNESS_LEVELS.length - 1]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

export function VO2MaxClient({ records }: VO2MaxClientProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🫁</span>
        <h2 className="text-lg font-semibold text-text-primary mb-2">No VO₂ Max data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch estimates VO₂ Max during outdoor walks, runs, and hikes. Sync your iPhone after an outdoor workout.
        </p>
      </div>
    )
  }

  // Deduplicate to one reading per day (latest of the day)
  const byDay: Record<string, number> = {}
  for (const r of records) {
    const day = r.time.slice(0, 10)
    byDay[day] = r.value
  }

  const dailyData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date: fmtDate(date + 'T00:00:00'),
      rawDate: date,
      value: +value.toFixed(1),
    }))

  const latest = dailyData[dailyData.length - 1].value
  const peak = Math.max(...dailyData.map((d) => d.value))
  const avg = +(dailyData.reduce((s, d) => s + d.value, 0) / dailyData.length).toFixed(1)
  const level = fitnessLevel(latest)
  const trend = dailyData.length >= 2
    ? dailyData[dailyData.length - 1].value - dailyData[0].value
    : 0

  return (
    <div className="space-y-6">
      {/* Fitness level hero */}
      <div className={`rounded-xl border p-5 text-center ${level.bg}`}>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Current Fitness Level</p>
        <p className={`text-5xl font-bold ${level.color}`}>{latest.toFixed(1)}</p>
        <p className="text-sm text-text-secondary mt-1">mL/kg/min</p>
        <p className={`mt-2 text-lg font-semibold ${level.color}`}>{level.label}</p>
        {trend !== 0 && (
          <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)} over {dailyData.length} readings
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-blue-400">{latest.toFixed(1)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Latest</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-green-400">{peak.toFixed(1)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Peak (90d)</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{avg.toFixed(1)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Average</p>
        </div>
      </div>

      {/* Chart */}
      {dailyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">VO₂ Max Trend (90 days)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} mL/kg/min`, 'VO₂ Max']}
              />
              {/* Zone reference lines */}
              <ReferenceLine y={60} stroke="rgba(52,211,153,0.25)" strokeDasharray="4 3" label={{ value: 'Superior', position: 'insideTopRight', fontSize: 9, fill: 'rgba(52,211,153,0.5)' }} />
              <ReferenceLine y={52} stroke="rgba(74,222,128,0.25)" strokeDasharray="4 3" />
              <ReferenceLine y={43} stroke="rgba(163,230,53,0.25)" strokeDasharray="4 3" />
              <ReferenceLine y={34} stroke="rgba(250,204,21,0.2)" strokeDasharray="4 3" />
              <ReferenceLine y={25} stroke="rgba(251,146,60,0.2)" strokeDasharray="4 3" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#22d3ee' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fitness level scale */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Fitness Levels</h2>
        <div className="space-y-2">
          {FITNESS_LEVELS.map((lvl, i) => {
            const nextMin = i > 0 ? FITNESS_LEVELS[i - 1].min : null
            const range = nextMin != null ? `${lvl.min}–${nextMin - 1}` : `≥ ${lvl.min}`
            const isActive = latest >= lvl.min && (i === 0 || latest < FITNESS_LEVELS[i - 1].min)
            return (
              <div
                key={lvl.label}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  isActive ? `${lvl.bg} border` : 'bg-surface-secondary'
                }`}
              >
                <span className={`text-sm font-medium ${isActive ? lvl.color : 'text-text-secondary'}`}>
                  {lvl.label}
                </span>
                <span className={`text-xs ${isActive ? lvl.color : 'text-text-secondary'}`}>
                  {range} mL/kg/min
                </span>
                {isActive && <span className="text-xs ml-2">← you</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-1.5">
        <p className="font-medium text-text-primary text-sm">About VO₂ Max</p>
        <p>VO₂ Max is the maximum rate at which your body can use oxygen during exercise — the gold standard measure of cardiorespiratory fitness.</p>
        <p>Apple Watch estimates it automatically during outdoor walks and runs using heart rate and GPS data. Higher is better. Fitness levels are general guidelines and vary by age and sex.</p>
      </div>
    </div>
  )
}
