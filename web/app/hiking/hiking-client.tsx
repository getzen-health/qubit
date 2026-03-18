'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts'

interface Hike {
  id: string
  start_time: string
  duration_minutes: number
  distance_meters?: number | null
  avg_heart_rate?: number | null
  elevation_gain_meters?: number | null
  active_calories?: number | null
  avg_pace_per_km?: number | null
}

interface HikingClientProps {
  hikes: Hike[]
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

function avgOf(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null && v > 0)
  if (!valid.length) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

// Hike difficulty: based on elevation gain and distance (Shenandoah scale variant)
// Rating = sqrt(elev_ft * 2 * dist_miles)
function difficultyRating(hike: Hike): { label: string; color: string; score: number } | null {
  const distM = hike.distance_meters ?? 0
  const elevM = hike.elevation_gain_meters ?? 0
  if (distM < 100 || elevM < 1) return null
  const elevFt = elevM * 3.28084
  const distMiles = distM * 0.000621371
  const score = Math.sqrt(elevFt * 2 * distMiles)
  if (score < 50)  return { label: 'Easy',       color: '#4ade80', score }
  if (score < 100) return { label: 'Moderate',    color: '#facc15', score }
  if (score < 150) return { label: 'Strenuous',   color: '#fb923c', score }
  return           { label: 'Very Strenuous', color: '#f87171', score }
}

export function HikingClient({ hikes }: HikingClientProps) {
  if (hikes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🥾</span>
        <h2 className="text-lg font-semibold text-text-primary">No hiking data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import hiking workouts from Apple Health or the Fitness app. Requires Apple Watch for heart rate data.
        </p>
      </div>
    )
  }

  const totalHikes = hikes.length
  const totalKm = hikes.reduce((s, h) => s + (h.distance_meters ?? 0) / 1000, 0)
  const totalMinutes = hikes.reduce((s, h) => s + h.duration_minutes, 0)
  const totalElevation = hikes.reduce((s, h) => s + (h.elevation_gain_meters ?? 0), 0)
  const totalCalories = hikes.reduce((s, h) => s + (h.active_calories ?? 0), 0)

  const avgHr = avgOf(hikes.map((h) => h.avg_heart_rate))
  const avgDuration = Math.round((totalMinutes / totalHikes))
  const avgElevation = Math.round(totalElevation / totalHikes)

  const hikesWithDifficulty = hikes.map((h) => ({
    ...h,
    difficulty: difficultyRating(h),
  }))

  // Elevation chart
  const elevChartData = hikesWithDifficulty
    .filter((h) => (h.elevation_gain_meters ?? 0) > 0)
    .map((h) => ({
      date: fmtDate(h.start_time),
      elev: Math.round(h.elevation_gain_meters!),
      color: h.difficulty?.color ?? '#94a3b8',
    }))

  // Distance chart
  const distChartData = hikes
    .filter((h) => (h.distance_meters ?? 0) > 0)
    .map((h) => ({
      date: fmtDate(h.start_time),
      distKm: +((h.distance_meters ?? 0) / 1000).toFixed(1),
    }))

  // Distance vs elevation scatter for difficulty analysis
  const scatterData = hikesWithDifficulty
    .filter((h) => (h.distance_meters ?? 0) > 0 && (h.elevation_gain_meters ?? 0) > 0)
    .map((h) => ({
      distKm: +((h.distance_meters ?? 0) / 1000).toFixed(1),
      elevM: Math.round(h.elevation_gain_meters!),
      color: h.difficulty?.color ?? '#94a3b8',
      date: fmtDate(h.start_time),
    }))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-lime-400">{totalHikes}</p>
          <p className="text-xs text-text-secondary mt-0.5">Hikes</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{totalKm.toFixed(0)} km</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Distance</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{Math.round(totalElevation).toLocaleString()} m</p>
          <p className="text-xs text-text-secondary mt-0.5">Elevation Gained</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{fmtDuration(totalMinutes)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Time</p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-indigo-400">{fmtDuration(avgDuration)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-amber-400">{avgElevation} m</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Elevation</p>
        </div>
        {avgHr !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-red-400">{Math.round(avgHr)} bpm</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Heart Rate</p>
          </div>
        )}
      </div>

      {/* Elevation per hike */}
      {elevChartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Elevation Gained per Hike (m)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={elevChartData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={36} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} m`, 'Elevation']} />
              <Bar dataKey="elev" radius={[3, 3, 0, 0]}>
                {elevChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distance per hike */}
      {distChartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Distance per Hike (km)</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={distChartData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={24} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} km`, 'Distance']} />
              <Bar dataKey="distKm" fill="#84cc16" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distance vs elevation scatter */}
      {scatterData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">Distance vs Elevation (difficulty map)</h3>
          <p className="text-xs text-text-secondary mb-3 opacity-70">Each dot is one hike. Color = difficulty rating.</p>
          <ResponsiveContainer width="100%" height={160}>
            <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="distKm" name="Distance" unit=" km" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} type="number" />
              <YAxis dataKey="elevM" name="Elevation" unit=" m" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={40} type="number" />
              <Tooltip contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => name === 'distKm' ? [`${v} km`, 'Distance'] : [`${v} m`, 'Elevation']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''} />
              <Scatter data={scatterData} fill="#84cc16">
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
            {[{ label: 'Easy', color: '#4ade80' }, { label: 'Moderate', color: '#facc15' }, { label: 'Strenuous', color: '#fb923c' }, { label: 'Very Strenuous', color: '#f87171' }].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</div>
            ))}
          </div>
        </div>
      )}

      {/* Hike list */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Hikes</h2>
        {[...hikesWithDifficulty].reverse().slice(0, 20).map((h) => {
          const date = new Date(h.start_time)
          const distKm = (h.distance_meters ?? 0) / 1000

          return (
            <div key={h.id} className="bg-surface rounded-xl border border-border px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  {h.difficulty && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: h.difficulty.color, backgroundColor: h.difficulty.color + '22', border: `1px solid ${h.difficulty.color}44` }}>
                      {h.difficulty.label}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {distKm > 0 && <p className="text-sm font-bold text-lime-400">{distKm.toFixed(1)} km</p>}
                  <p className="text-xs text-text-secondary">{fmtDuration(h.duration_minutes)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                {(h.elevation_gain_meters ?? 0) > 0 && <span className="text-orange-400">⛰ {Math.round(h.elevation_gain_meters!)} m gain</span>}
                {h.avg_heart_rate && h.avg_heart_rate > 0 && <span>❤️ {h.avg_heart_rate} bpm</span>}
                {(h.active_calories ?? 0) > 0 && <span>🔥 {Math.round(h.active_calories!)} kcal</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
