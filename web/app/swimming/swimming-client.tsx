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

interface Swim {
  id: string
  start_time: string
  duration_minutes: number
  distance_meters?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
  active_calories?: number | null
}

interface SwimmingClientProps {
  swims: Swim[]
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

// Pace in seconds per 100m (standard swimming metric)
function pacePerHundred(distMeters: number, durationMinutes: number): number {
  return (durationMinutes * 60 / distMeters) * 100
}

function fmtPace(secsPerHundred: number): string {
  const m = Math.floor(secsPerHundred / 60)
  const s = Math.round(secsPerHundred % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function TrendLine<T extends object>({
  data, dataKey, label, color, formatter, domain, refLines,
}: {
  data: T[]
  dataKey: keyof T & string
  label: string
  color: string
  formatter: (v: number) => string
  domain?: [string | number, string | number]
  refLines?: { y: number; color: string; label: string }[]
}) {
  if (data.length < 2) return null
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">{label}</h3>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} tickFormatter={formatter} domain={domain ?? ['auto', 'auto']} width={38} />
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

export function SwimmingClient({ swims }: SwimmingClientProps) {
  if (swims.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏊</span>
        <h2 className="text-lg font-semibold text-text-primary">No swimming data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import swimming workouts from Apple Health. Requires Apple Watch Series 2 or later.
        </p>
      </div>
    )
  }

  const totalSwims = swims.length
  const totalMinutes = swims.reduce((s, sw) => s + sw.duration_minutes, 0)
  const totalMeters = swims.reduce((s, sw) => s + (sw.distance_meters ?? 0), 0)
  const totalCalories = swims.reduce((s, sw) => s + (sw.active_calories ?? 0), 0)
  const avgHr = avgOf(swims.map((sw) => sw.avg_heart_rate))

  // Pace data — only for swims with distance
  const swimsWithDist = swims.filter((sw) => (sw.distance_meters ?? 0) > 0)
  const paceData = swimsWithDist.map((sw) => ({
    date: fmtDate(sw.start_time),
    pace: +pacePerHundred(sw.distance_meters!, sw.duration_minutes).toFixed(1),
  }))

  const avgPaceRaw = avgOf(swimsWithDist.map((sw) => pacePerHundred(sw.distance_meters!, sw.duration_minutes)))

  // Distance per session chart
  const distChartData = swimsWithDist.map((sw) => ({
    date: fmtDate(sw.start_time),
    dist: Math.round((sw.distance_meters ?? 0)),
  }))

  // HR chart
  const hrChartData = swims
    .filter((sw) => sw.avg_heart_rate && sw.avg_heart_rate > 0)
    .map((sw) => ({
      date: fmtDate(sw.start_time),
      hr: sw.avg_heart_rate!,
    }))

  // Duration trend
  const durationChartData = swims.map((sw) => ({
    date: fmtDate(sw.start_time),
    min: sw.duration_minutes,
  }))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{totalSwims}</p>
          <p className="text-xs text-text-secondary mt-0.5">Swims</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {totalMeters >= 1000 ? `${(totalMeters / 1000).toFixed(1)} km` : `${Math.round(totalMeters)} m`}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Distance</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{fmtDuration(totalMinutes)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Time</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{Math.round(totalCalories).toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Calories</p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3">
        {avgPaceRaw !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-teal-400">{fmtPace(avgPaceRaw)} /100m</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Pace</p>
          </div>
        )}
        {avgHr !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-red-400">{Math.round(avgHr)} bpm</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Heart Rate</p>
          </div>
        )}
      </div>

      {/* Distance per session bar */}
      {distChartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Distance per Swim (m)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={distChartData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={36} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : `${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} m`, 'Distance']} />
              <ReferenceLine y={1000} stroke="rgba(56,189,248,0.3)" strokeDasharray="4 3"
                label={{ value: '1km', position: 'insideTopRight', fontSize: 9, fill: 'rgba(56,189,248,0.5)' }} />
              <Bar dataKey="dist" fill="#22d3ee" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pace trend */}
      {paceData.length >= 2 && (
        <TrendLine
          data={paceData}
          dataKey="pace"
          label="Pace (min:sec per 100m)"
          color="#2dd4bf"
          formatter={(v) => fmtPace(v)}
          domain={['dataMin - 5', 'dataMax + 5']}
          refLines={[
            { y: 120, color: 'rgba(74,222,128,0.3)', label: '2:00' },
            { y: 90, color: 'rgba(74,222,128,0.5)', label: '1:30' },
          ]}
        />
      )}

      {/* HR trend */}
      {hrChartData.length >= 2 && (
        <TrendLine
          data={hrChartData}
          dataKey="hr"
          label="Avg Heart Rate (bpm)"
          color="#f87171"
          formatter={(v) => `${Math.round(v)}`}
          domain={[100, 180]}
        />
      )}

      {/* Duration trend */}
      {durationChartData.length >= 2 && (
        <TrendLine
          data={durationChartData}
          dataKey="min"
          label="Session Duration (min)"
          color="#818cf8"
          formatter={(v) => `${Math.round(v)} min`}
          refLines={[
            { y: 30, color: 'rgba(74,222,128,0.3)', label: '30m' },
            { y: 45, color: 'rgba(74,222,128,0.5)', label: '45m' },
          ]}
        />
      )}

      {/* Swimming pace guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Swimming pace benchmarks (per 100m)</p>
        <div className="space-y-2">
          {[
            { range: '> 2:30', label: 'Beginner', color: 'text-blue-400', detail: 'Building technique and endurance. Focus on form over speed.' },
            { range: '2:00–2:30', label: 'Recreational', color: 'text-green-400', detail: 'Comfortable fitness swimming. Good for cardio and low-impact training.' },
            { range: '1:30–2:00', label: 'Intermediate', color: 'text-yellow-400', detail: 'Consistent training pace. Competitive age-group swimmer territory.' },
            { range: '< 1:30', label: 'Advanced', color: 'text-orange-400', detail: 'Competitive club swimmer level. Requires high technical efficiency.' },
          ].map(({ range, label, color, detail }) => (
            <div key={range}>
              <p className="font-medium text-text-primary">
                <span className={`font-mono ${color}`}>{range}</span> — {label}
              </p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1">Requires Apple Watch Series 2 or later for open water and pool swim tracking.</p>
      </div>

      {/* Swim list */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Swims</h2>
        {[...swims].reverse().slice(0, 20).map((sw) => {
          const date = new Date(sw.start_time)
          const distM = sw.distance_meters ?? 0
          const pace = distM > 0 ? pacePerHundred(distM, sw.duration_minutes) : null

          return (
            <div key={sw.id} className="bg-surface rounded-xl border border-border px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="text-right">
                  {distM > 0 && (
                    <p className="text-sm font-bold text-cyan-400">
                      {distM >= 1000 ? `${(distM / 1000).toFixed(2)} km` : `${Math.round(distM)} m`}
                    </p>
                  )}
                  <p className="text-xs text-text-secondary">{fmtDuration(sw.duration_minutes)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                {pace !== null && <span className="text-teal-400">{fmtPace(pace)} /100m</span>}
                {sw.avg_heart_rate && sw.avg_heart_rate > 0 && <span>❤️ {sw.avg_heart_rate} bpm</span>}
                {(sw.active_calories ?? 0) > 0 && <span>🔥 {Math.round(sw.active_calories!)} kcal</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
