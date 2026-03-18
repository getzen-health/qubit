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

interface Session {
  start_time: string
  duration_minutes: number
  distance_meters: number | null
  avg_pace_per_km: number | null
  avg_heart_rate: number | null
  active_calories: number | null
  max_heart_rate: number | null
}

interface RowingClientProps {
  sessions: Session[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// Rowing pace is conventionally expressed in seconds per 500m
// avg_pace_per_km is stored as seconds/km
// seconds/500m = avg_pace_per_km / 2
function kmPaceToSplitPace(secsPerKm: number): number {
  return secsPerKm / 2
}

function fmtSplit(secsPerHalfKm: number): string {
  const min = Math.floor(secsPerHalfKm / 60)
  const sec = Math.round(secsPerHalfKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function fmtDate(iso: string) {
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDist(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

function splitColor(secsPerHalfKm: number): string {
  // Elite rowers: sub 1:40 (100 secs)
  // Recreational: 2:00-2:30 (120-150)
  // Beginner: > 2:30 (150+)
  if (secsPerHalfKm < 100) return '#4ade80'
  if (secsPerHalfKm < 120) return '#a3e635'
  if (secsPerHalfKm < 150) return '#facc15'
  return '#fb923c'
}

// Watts from pace: P = 2.80/t³ where t = split time in seconds per 500m
function splitToWatts(secsPerHalfKm: number): number {
  return Math.round(2.80 / Math.pow(secsPerHalfKm, 3) * 1e9)
}

export function RowingClient({ sessions }: RowingClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🚣</span>
        <h2 className="text-lg font-semibold text-text-primary">No rowing sessions yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Log rowing machine or on-water sessions in Apple Fitness or any rowing app that writes to Apple Health.
        </p>
      </div>
    )
  }

  const withPace = sessions.filter((s) => s.avg_pace_per_km && s.avg_pace_per_km > 0 && s.distance_meters && s.distance_meters > 0)
  const withDist = sessions.filter((s) => s.distance_meters && s.distance_meters > 0)

  const totalMeters = withDist.reduce((s, r) => s + (r.distance_meters ?? 0), 0)
  const totalMinutes = sessions.reduce((s, r) => s + r.duration_minutes, 0)
  const totalCalories = sessions.reduce((s, r) => s + (r.active_calories ?? 0), 0)
  const avgSplit = withPace.length > 0
    ? withPace.reduce((s, r) => s + kmPaceToSplitPace(r.avg_pace_per_km!), 0) / withPace.length
    : null
  const bestSplit = withPace.length > 0
    ? Math.min(...withPace.map((r) => kmPaceToSplitPace(r.avg_pace_per_km!)))
    : null

  // Split trend chart
  const splitData = withPace.map((s) => ({
    date: fmtDate(s.start_time),
    split: Math.round(kmPaceToSplitPace(s.avg_pace_per_km!) * 10) / 10,
    watts: splitToWatts(kmPaceToSplitPace(s.avg_pace_per_km!)),
    dist: Math.round((s.distance_meters ?? 0) / 100) / 10,
    hr: s.avg_heart_rate ? Math.round(s.avg_heart_rate) : null,
  }))

  // Distance per session
  const distData = withDist.map((s) => ({
    date: fmtDate(s.start_time),
    meters: Math.round(s.distance_meters!),
    km: Math.round((s.distance_meters! / 1000) * 10) / 10,
  }))

  // Pace benchmarks (seconds per 500m)
  const SPLIT_BENCHMARKS = [
    { label: 'Elite (men)', secs: 95, color: 'rgba(74,222,128,0.3)' },
    { label: 'Good (rec.)', secs: 120, color: 'rgba(163,230,53,0.2)' },
    { label: 'Beginner', secs: 150, color: 'rgba(250,204,21,0.2)' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Sessions', value: sessions.length, sub: '90 days' },
          { label: 'Distance', value: fmtDist(totalMeters), sub: 'total meters' },
          { label: 'Time', value: fmtDuration(totalMinutes), sub: 'on water/erg' },
          ...(avgSplit ? [{ label: 'Avg Split', value: fmtSplit(avgSplit), sub: '/500m avg' }] : []),
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-black text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
            <p className="text-xs font-medium text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Best and avg splits */}
      {bestSplit !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Split Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: splitColor(bestSplit) }}>
                {fmtSplit(bestSplit)}
              </p>
              <p className="text-xs text-text-secondary mt-1">Best /500m split</p>
              {bestSplit > 0 && (
                <p className="text-xs text-text-secondary opacity-60">{splitToWatts(bestSplit)}W</p>
              )}
            </div>
            {avgSplit !== null && (
              <div className="text-center">
                <p className="text-3xl font-black text-text-primary">{fmtSplit(avgSplit)}</p>
                <p className="text-xs text-text-secondary mt-1">Avg /500m split</p>
                <p className="text-xs text-text-secondary opacity-60">{splitToWatts(avgSplit)}W avg</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split trend */}
      {splitData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">500m Split Trend</h3>
          <p className="text-xs text-text-secondary mb-3">Lower is faster</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={splitData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={36}
                tickFormatter={(v) => fmtSplit(v)}
                reversed
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtSplit(v), '/500m split']}
              />
              {SPLIT_BENCHMARKS.map(({ label, secs, color }) => (
                <ReferenceLine key={label} y={secs} stroke={color} strokeDasharray="3 2"
                  label={{ value: label, position: 'insideTopRight', fontSize: 9, fill: color }} />
              ))}
              <Line type="monotone" dataKey="split" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: '#38bdf8' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distance per session */}
      {distData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Distance per Session</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={distData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={32} tickFormatter={(v) => `${v}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} km`, 'Distance']} />
              <ReferenceLine y={2} stroke="rgba(56,189,248,0.3)" strokeDasharray="3 2" />
              <Bar dataKey="km" fill="#38bdf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sessions list */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Sessions</h3>
        {sessions.slice().reverse().slice(0, 10).map((s, i) => {
          const split = s.avg_pace_per_km ? kmPaceToSplitPace(s.avg_pace_per_km) : null
          return (
            <div key={i} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🚣</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {s.distance_meters ? fmtDist(s.distance_meters) : 'Rowing'} · {fmtDuration(s.duration_minutes)}
                </p>
                <p className="text-xs text-text-secondary">
                  {fmtDate(s.start_time)}
                  {s.avg_heart_rate ? ` · ${Math.round(s.avg_heart_rate)} bpm` : ''}
                  {s.active_calories ? ` · ${Math.round(s.active_calories)} cal` : ''}
                </p>
              </div>
              {split !== null && (
                <div className="text-right">
                  <p className="text-lg font-bold font-mono" style={{ color: splitColor(split) }}>{fmtSplit(split)}</p>
                  <p className="text-xs text-text-secondary">/500m</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pace guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">Split Time Reference</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { range: '< 1:35', label: 'Elite', color: 'text-green-400' },
            { range: '1:35–1:55', label: 'Advanced', color: 'text-lime-400' },
            { range: '2:00–2:20', label: 'Intermediate', color: 'text-yellow-400' },
            { range: '> 2:20', label: 'Beginner', color: 'text-orange-400' },
          ].map(({ range, label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="font-mono opacity-70">{range}</span>
              <span className={color}>{label}</span>
            </div>
          ))}
        </div>
        <p className="opacity-60">Splits measured in mm:ss per 500m. These benchmarks are approximate and vary significantly by age, body weight, and training experience.</p>
      </div>
    </div>
  )
}
