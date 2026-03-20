'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

interface Workout {
  start_time: string
  workout_type: string
  duration_minutes: number
}

interface OutdoorIndoorClientProps {
  workouts: Workout[]
}

const OUTDOOR_COLOR = '#eab308'
const INDOOR_COLOR = '#3b82f6'

const OUTDOOR_KEYWORDS = [
  'run', 'cycl', 'hik', 'walk', 'swim', 'row', 'ski', 'soccer',
  'tennis', 'golf', 'baseball', 'softball',
]

function isOutdoor(workoutType: string): boolean {
  const t = workoutType.toLowerCase()
  return OUTDOOR_KEYWORDS.some((kw) => t.includes(kw))
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function sportLabel(workoutType: string): string {
  const t = workoutType.toLowerCase()
  if (t.includes('run')) return 'Running'
  if (t.includes('cycl') || t.includes('bike')) return 'Cycling'
  if (t.includes('hik')) return 'Hiking'
  if (t.includes('walk')) return 'Walking'
  if (t.includes('swim')) return 'Swimming'
  if (t.includes('row')) return 'Rowing'
  if (t.includes('ski')) return 'Skiing'
  if (t.includes('soccer')) return 'Soccer'
  if (t.includes('tennis')) return 'Tennis'
  if (t.includes('golf')) return 'Golf'
  if (t.includes('baseball')) return 'Baseball'
  if (t.includes('softball')) return 'Softball'
  if (t.includes('yoga')) return 'Yoga'
  if (t.includes('pilates')) return 'Pilates'
  if (t.includes('strength') || t.includes('weight')) return 'Strength'
  if (t.includes('hiit')) return 'HIIT'
  if (t.includes('stair')) return 'Stair Climbing'
  if (t.includes('elliptical')) return 'Elliptical'
  if (t.includes('dance')) return 'Dance'
  // Capitalise first word as fallback
  const words = workoutType.split(/[\s_]+/)
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || workoutType
}

export function OutdoorIndoorClient({ workouts }: OutdoorIndoorClientProps) {
  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🌤️</span>
        <h2 className="text-lg font-semibold text-text-primary">No workout data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import workouts from Apple Health. Outdoor/indoor split will appear
          once workouts are available.
        </p>
      </div>
    )
  }

  const outdoorWorkouts = workouts.filter((w) => isOutdoor(w.workout_type))
  const indoorWorkouts = workouts.filter((w) => !isOutdoor(w.workout_type))
  const outdoorCount = outdoorWorkouts.length
  const indoorCount = indoorWorkouts.length
  const total = workouts.length
  const outdoorPct = Math.round((outdoorCount / total) * 100)

  // ─── Stacked monthly bar chart ─────────────────────────────────────────────
  const monthMap: Map<string, { month: string; outdoor: number; indoor: number }> = new Map()
  for (const w of workouts) {
    const d = new Date(w.start_time)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!monthMap.has(key)) monthMap.set(key, { month: label, outdoor: 0, indoor: 0 })
    const entry = monthMap.get(key)!
    if (isOutdoor(w.workout_type)) {
      entry.outdoor += w.duration_minutes
    } else {
      entry.indoor += w.duration_minutes
    }
  }
  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      ...v,
      outdoor: Math.round(v.outdoor),
      indoor: Math.round(v.indoor),
    }))

  // ─── Per-sport outdoor % bars ──────────────────────────────────────────────
  const sportMap: Map<string, { outdoor: number; indoor: number }> = new Map()
  for (const w of workouts) {
    const label = sportLabel(w.workout_type)
    if (!sportMap.has(label)) sportMap.set(label, { outdoor: 0, indoor: 0 })
    const entry = sportMap.get(label)!
    if (isOutdoor(w.workout_type)) {
      entry.outdoor++
    } else {
      entry.indoor++
    }
  }
  const sportBreakdown = Array.from(sportMap.entries())
    .map(([sport, { outdoor, indoor }]) => ({
      sport,
      outdoor,
      indoor,
      total: outdoor + indoor,
      outdoorPct: Math.round((outdoor / (outdoor + indoor)) * 100),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // ─── Monthly trend summary ────────────────────────────────────────────────
  const recentMonths = monthlyData.slice(-3)
  const recentOutdoorPct =
    recentMonths.length > 0
      ? Math.round(
          (recentMonths.reduce((s, m) => s + m.outdoor, 0) /
            recentMonths.reduce((s, m) => s + m.outdoor + m.indoor, 0)) *
            100
        )
      : null

  const trendSummary = (() => {
    if (monthlyData.length < 2 || recentOutdoorPct === null) return null
    const early = monthlyData.slice(0, Math.ceil(monthlyData.length / 2))
    const earlyPct =
      early.length > 0
        ? Math.round(
            (early.reduce((s, m) => s + m.outdoor, 0) /
              early.reduce((s, m) => s + m.outdoor + m.indoor, 0)) *
              100
          )
        : null
    if (earlyPct === null) return null
    const diff = recentOutdoorPct - earlyPct
    if (Math.abs(diff) < 5) return `Your outdoor/indoor split has been consistent at around ${recentOutdoorPct}% outdoor over the last 6 months.`
    if (diff > 0) return `You've been training more outdoors recently — ${recentOutdoorPct}% outdoor in the last 3 months, up from ${earlyPct}% earlier in the period.`
    return `You've been training more indoors recently — ${recentOutdoorPct}% outdoor in the last 3 months, down from ${earlyPct}% earlier in the period.`
  })()

  return (
    <div className="space-y-6">
      {/* Split summary */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Workout Split (6 months)</h3>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: OUTDOOR_COLOR }}>
              {outdoorCount}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Outdoor</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{outdoorPct}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Outdoor</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: INDOOR_COLOR }}>
              {indoorCount}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Indoor</p>
          </div>
        </div>
        {/* Visual indicator bar */}
        <div className="h-4 rounded-full overflow-hidden flex">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${outdoorPct}%`, backgroundColor: OUTDOOR_COLOR }}
          />
          <div
            className="h-full flex-1"
            style={{ backgroundColor: INDOOR_COLOR }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1.5">
          <span style={{ color: OUTDOOR_COLOR }}>Outdoor {outdoorPct}%</span>
          <span style={{ color: INDOOR_COLOR }}>Indoor {100 - outdoorPct}%</span>
        </div>
      </div>

      {/* Stacked monthly bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Monthly Volume by Setting (minutes)
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={30}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                `${v} min`,
                name === 'outdoor' ? 'Outdoor' : 'Indoor',
              ]}
            />
            <Legend
              formatter={(value) => (value === 'outdoor' ? 'Outdoor' : 'Indoor')}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="outdoor" stackId="a" fill={OUTDOOR_COLOR} radius={[0, 0, 0, 0]} />
            <Bar dataKey="indoor" stackId="a" fill={INDOOR_COLOR} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-sport outdoor % */}
      {sportBreakdown.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            Outdoor % by Sport
          </h3>
          <div className="space-y-3">
            {sportBreakdown.map((s) => (
              <div key={s.sport} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-28 shrink-0 truncate">
                  {s.sport}
                </span>
                <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${s.outdoorPct}%`,
                      backgroundColor: s.outdoorPct >= 50 ? OUTDOOR_COLOR : INDOOR_COLOR,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-text-primary w-10 text-right shrink-0">
                  {s.outdoorPct}%
                </span>
                <span className="text-xs text-text-secondary w-10 shrink-0">
                  {s.total}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly trend text */}
      {trendSummary && (
        <div className="bg-surface rounded-2xl border border-yellow-500/30 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-blue-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                Trend Summary
              </h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{trendSummary}</p>
          </div>
        </div>
      )}
    </div>
  )
}
