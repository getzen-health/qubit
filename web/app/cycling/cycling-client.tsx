'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface Ride {
  id: string
  start_time: string
  duration_minutes: number
  distance_meters?: number | null
  avg_pace_per_km?: number | null  // seconds per km → convert to km/h
  avg_heart_rate?: number | null
  elevation_gain_meters?: number | null
  active_calories?: number | null
}

interface CyclingClientProps {
  rides: Ride[]
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

function paceToSpeed(secsPerKm: number): number {
  // seconds per km → km per hour
  return 3600 / secsPerKm
}

function avgOf(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null && v > 0)
  if (!valid.length) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function TrendChart<T extends object>({
  data,
  dataKey,
  label,
  color,
  formatter,
  domain,
  refLines,
}: {
  data: T[]
  dataKey: keyof T & string
  label: string
  color: string
  formatter: (v: number) => string
  domain?: [number | string, number | string]
  refLines?: { y: number; color: string; label: string }[]
}) {
  if (data.length < 2) return null
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">{label}</h3>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
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
            tickFormatter={formatter}
            domain={domain ?? ['auto', 'auto']}
            width={40}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatter(v), label]} />
          {refLines?.map((r) => (
            <ReferenceLine key={r.y} y={r.y} stroke={r.color} strokeDasharray="4 3"
              label={{ value: r.label, position: 'insideTopRight', fontSize: 9, fill: r.color }} />
          ))}
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CyclingClient({ rides }: CyclingClientProps) {
  if (rides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🚴</span>
        <h2 className="text-lg font-semibold text-text-primary">No cycling data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import cycling workouts from Apple Health or the Fitness app.
        </p>
      </div>
    )
  }

  const totalRides = rides.length
  const totalKm = rides.reduce((s, r) => s + (r.distance_meters ?? 0) / 1000, 0)
  const totalMinutes = rides.reduce((s, r) => s + r.duration_minutes, 0)
  const totalElevation = rides.reduce((s, r) => s + (r.elevation_gain_meters ?? 0), 0)
  const totalCalories = rides.reduce((s, r) => s + (r.active_calories ?? 0), 0)

  const speeds = rides
    .filter((r) => r.avg_pace_per_km && r.avg_pace_per_km > 0)
    .map((r) => paceToSpeed(r.avg_pace_per_km!))
  const avgSpeed = avgOf(speeds)
  const avgHr = avgOf(rides.map((r) => r.avg_heart_rate))

  // Chart data
  const distanceChartData = rides
    .filter((r) => (r.distance_meters ?? 0) > 0)
    .map((r) => ({
      date: fmtDate(r.start_time),
      distKm: +((r.distance_meters ?? 0) / 1000).toFixed(1),
    }))

  const speedChartData = rides
    .filter((r) => r.avg_pace_per_km && r.avg_pace_per_km > 0)
    .map((r) => ({
      date: fmtDate(r.start_time),
      speed: +paceToSpeed(r.avg_pace_per_km!).toFixed(1),
    }))

  const hrChartData = rides
    .filter((r) => r.avg_heart_rate && r.avg_heart_rate > 0)
    .map((r) => ({
      date: fmtDate(r.start_time),
      hr: r.avg_heart_rate!,
    }))

  const elevChartData = rides
    .filter((r) => (r.elevation_gain_meters ?? 0) > 0)
    .map((r) => ({
      date: fmtDate(r.start_time),
      elev: Math.round(r.elevation_gain_meters!),
    }))

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{totalRides}</p>
          <p className="text-xs text-text-secondary mt-0.5">Rides</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{totalKm.toFixed(0)} km</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Distance</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{fmtDuration(totalMinutes)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Time</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{Math.round(totalElevation).toLocaleString()} m</p>
          <p className="text-xs text-text-secondary mt-0.5">Elevation Gained</p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        {avgSpeed !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-purple-400">{avgSpeed.toFixed(1)} km/h</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Speed</p>
          </div>
        )}
        {avgHr !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-red-400">{Math.round(avgHr)} bpm</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Heart Rate</p>
          </div>
        )}
        {totalCalories > 0 && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-amber-400">{Math.round(totalCalories).toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-0.5">Total Calories</p>
          </div>
        )}
      </div>

      {/* Distance per ride chart */}
      {distanceChartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Distance per Ride (km)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={distanceChartData} margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}`}
                width={32}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} km`, 'Distance']} />
              <Bar dataKey="distKm" fill="#60a5fa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Speed trend */}
      <TrendChart
        data={speedChartData}
        dataKey="speed"
        label="Avg Speed (km/h)"
        color="#a78bfa"
        formatter={(v) => `${v.toFixed(1)}`}
        domain={['dataMin - 2', 'dataMax + 2']}
        refLines={[
          { y: 20, color: 'rgba(74,222,128,0.3)', label: '20' },
          { y: 30, color: 'rgba(74,222,128,0.5)', label: '30' },
        ]}
      />

      {/* HR trend */}
      <TrendChart
        data={hrChartData}
        dataKey="hr"
        label="Avg Heart Rate (bpm)"
        color="#f87171"
        formatter={(v) => `${Math.round(v)}`}
        domain={[100, 180]}
      />

      {/* Elevation trend */}
      {elevChartData.length >= 2 && (
        <TrendChart
          data={elevChartData}
          dataKey="elev"
          label="Elevation Gain (m)"
          color="#fb923c"
          formatter={(v) => `${Math.round(v)} m`}
        />
      )}

      {/* Cycling zones guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Cycling speed benchmarks</p>
        <div className="space-y-2">
          {[
            { range: '< 15 km/h', label: 'Casual', color: 'text-blue-400', detail: 'Easy riding, commuting, or recovery pace.' },
            { range: '15–25 km/h', label: 'Recreational', color: 'text-green-400', detail: 'Moderate effort suitable for most fitness cyclists.' },
            { range: '25–35 km/h', label: 'Enthusiast', color: 'text-yellow-400', detail: 'Requires sustained aerobic effort. Typical road cyclist range.' },
            { range: '> 35 km/h', label: 'Performance', color: 'text-orange-400', detail: 'High-intensity riding. Competitive amateur and elite territory.' },
          ].map(({ range, label, color, detail }) => (
            <div key={range}>
              <p className="font-medium text-text-primary">
                <span className={`font-mono ${color}`}>{range}</span> — {label}
              </p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1">Speed is derived from average pace recorded by Apple Watch or iPhone GPS during your ride.</p>
      </div>

      {/* Ride list */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Rides</h2>
        {[...rides].reverse().slice(0, 20).map((ride) => {
          const date = new Date(ride.start_time)
          const distKm = (ride.distance_meters ?? 0) / 1000
          const speed = ride.avg_pace_per_km && ride.avg_pace_per_km > 0
            ? paceToSpeed(ride.avg_pace_per_km)
            : null

          return (
            <div key={ride.id} className="bg-surface rounded-xl border border-border px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="text-right">
                  {distKm > 0 && <p className="text-sm font-bold text-blue-400">{distKm.toFixed(1)} km</p>}
                  <p className="text-xs text-text-secondary">{fmtDuration(ride.duration_minutes)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                {speed !== null && <span className="text-purple-400">{speed.toFixed(1)} km/h</span>}
                {ride.avg_heart_rate && ride.avg_heart_rate > 0 && <span>❤️ {ride.avg_heart_rate} bpm</span>}
                {(ride.elevation_gain_meters ?? 0) > 0 && <span>⛰ {Math.round(ride.elevation_gain_meters!)} m</span>}
                {(ride.active_calories ?? 0) > 0 && <span>🔥 {Math.round(ride.active_calories!)} kcal</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
