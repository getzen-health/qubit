'use client'

import { useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface Run {
  start_time: string
  duration_minutes: number
  distance_meters: number | null
  avg_pace_per_km: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
}

interface RacePredictorClientProps {
  runs: Run[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const RACE_DISTANCES = [
  { label: '1 Mile', meters: 1609, icon: '🏅' },
  { label: '5K', meters: 5000, icon: '🏃' },
  { label: '10K', meters: 10000, icon: '🏃' },
  { label: 'Half Marathon', meters: 21097, icon: '🥈' },
  { label: 'Marathon', meters: 42195, icon: '🥇' },
]

// Riegel formula: T2 = T1 × (D2 / D1)^1.06
function riegelPredict(knownDistM: number, knownTimeSecs: number, targetDistM: number): number {
  return knownTimeSecs * Math.pow(targetDistM / knownDistM, 1.06)
}

function fmtTime(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = Math.round(totalSecs % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtPace(secsPerKm: number): string {
  const min = Math.floor(secsPerKm / 60)
  const sec = Math.round(secsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Jack Daniels VDOT table approximation based on race performance
// VDOT ≈ 0.8664 + 0.1894 × pace_mpm^(-0.5) ... simplified
// We use: VDOT = VO2max estimate from pace at lactate threshold
// Simple approximation: Strava/Garmin use percentage of maxHR; we use pace-based
function estimateVDOT(km: number, secsPerKm: number): number | null {
  if (km < 1.5) return null // too short for VDOT
  const v = (1000 / secsPerKm) * 60 // meters per minute
  // Jack Daniels VDOT approximation (simplified polynomial)
  const pctVO2max = 0.8 + 0.1894393 * Math.exp(-0.012778 * (km * 1000 / v)) + 0.2989558 * Math.exp(-0.1932605 * (km * 1000 / v))
  const vo2atPace = (-4.60 + 0.182258 * v + 0.000104 * v * v)
  return Math.round(vo2atPace / pctVO2max)
}

// Choose the best reference run: the longest recent run with a valid pace
// Long runs better represent aerobic capacity for prediction
function selectBestReferenceRun(runs: Run[]): Run | null {
  const valid = runs
    .filter((r) => r.distance_meters && r.distance_meters >= 1000 && r.avg_pace_per_km && r.avg_pace_per_km > 100)
    .sort((a, b) => (b.distance_meters ?? 0) - (a.distance_meters ?? 0))
  return valid[0] ?? null
}

export function RacePredictorClient({ runs }: RacePredictorClientProps) {
  const [selectedRunIdx, setSelectedRunIdx] = useState<number>(0)

  const validRuns = runs.filter(
    (r) => r.distance_meters && r.distance_meters >= 1000 && r.avg_pace_per_km && r.avg_pace_per_km > 100
  )

  if (validRuns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏁</span>
        <h2 className="text-lg font-semibold text-text-primary">No running data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync outdoor running workouts with GPS distance data to get race time predictions.
        </p>
      </div>
    )
  }

  // Default to best reference run (longest), allow user to change
  const defaultRef = selectBestReferenceRun(validRuns)
  const refIdx = Math.min(selectedRunIdx, validRuns.length - 1)
  const refRun = validRuns[refIdx] ?? defaultRef!

  const refDistM = refRun.distance_meters!
  const refTimeSecs = refRun.duration_minutes * 60
  const refPace = refRun.avg_pace_per_km!
  const refKm = refDistM / 1000
  const vdot = estimateVDOT(refKm, refPace)

  // Compute predictions for each race distance
  const predictions = RACE_DISTANCES.map(({ label, meters, icon }) => {
    const predictedSecs = riegelPredict(refDistM, refTimeSecs, meters)
    const predictedPaceSecsPerKm = predictedSecs / (meters / 1000)
    return { label, meters, icon, predictedSecs, predictedPaceSecsPerKm }
  })

  // Scatter data: distance (km) vs pace (min/km) for all runs
  const scatterData = validRuns.map((r) => ({
    km: Math.round((r.distance_meters! / 1000) * 10) / 10,
    paceMin: Math.round((r.avg_pace_per_km! / 60) * 100) / 100,
    date: fmtDateShort(r.start_time),
    isRef: r === refRun,
  }))

  // Riegel curve for chart: predict pace at various distances given ref run
  const curveData = [1, 2, 3, 5, 7, 10, 15, 21.1, 30, 42.2].map((km) => {
    const secs = riegelPredict(refDistM, refTimeSecs, km * 1000)
    return { km, paceMin: Math.round((secs / km / 60) * 100) / 100 }
  })

  return (
    <div className="space-y-6">
      {/* Reference run selector */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-2">Reference Run</p>
        <select
          value={refIdx}
          onChange={(e) => setSelectedRunIdx(Number(e.target.value))}
          className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {validRuns.map((r, i) => {
            const km = ((r.distance_meters ?? 0) / 1000).toFixed(1)
            return (
              <option key={i} value={i}>
                {fmtDateShort(r.start_time)} — {km} km · {fmtPace(r.avg_pace_per_km!)}
              </option>
            )
          })}
        </select>
        <div className="flex gap-4 mt-3 text-xs text-text-secondary">
          <span>Distance: <span className="text-text-primary font-medium">{(refDistM / 1000).toFixed(2)} km</span></span>
          <span>Pace: <span className="text-text-primary font-medium">{fmtPace(refPace)}</span></span>
          <span>Time: <span className="text-text-primary font-medium">{fmtTime(refTimeSecs)}</span></span>
          {vdot && <span>VDOT: <span className="text-blue-400 font-medium">~{vdot}</span></span>}
        </div>
      </div>

      {/* Race predictions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Predicted Times</h3>
        {predictions.map(({ label, meters, icon, predictedSecs, predictedPaceSecsPerKm }) => {
          const isLonger = meters > refDistM
          return (
            <div
              key={label}
              className={`bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-3 ${
                meters === refDistM ? 'border-blue-500/30 bg-blue-500/5' : ''
              }`}
            >
              <span className="text-xl">{icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary">
                  {(meters / 1000).toFixed(1)} km · {fmtPace(predictedPaceSecsPerKm)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold font-mono ${isLonger ? 'text-text-primary' : 'text-blue-400'}`}>
                  {fmtTime(predictedSecs)}
                </p>
                {meters === refDistM && (
                  <p className="text-xs text-blue-400">actual</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pace vs distance scatter */}
      {scatterData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Pace vs Distance (90 days)</h3>
          <p className="text-xs text-text-secondary mb-2">Lower pace = faster. Longer runs are naturally slower.</p>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                dataKey="km"
                name="Distance"
                unit=" km"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="paceMin"
                name="Pace"
                unit=" min/km"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={40}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  name === 'Pace' ? `${Math.floor(v)}:${Math.round((v % 1) * 60).toString().padStart(2, '0')} /km` : `${v} km`,
                  name,
                ]}
                content={({ payload }) => {
                  if (!payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={tooltipStyle} className="p-2 text-xs">
                      <p className="font-medium text-text-primary">{d.date}</p>
                      <p className="text-text-secondary">{d.km} km · {Math.floor(d.paceMin)}:{Math.round((d.paceMin % 1) * 60).toString().padStart(2, '0')} /km</p>
                    </div>
                  )
                }}
              />
              {/* Riegel curve */}
              <Scatter
                data={curveData}
                fill="rgba(96,165,250,0.15)"
                stroke="#60a5fa"
                strokeWidth={1}
                strokeDasharray="3 2"
                line
                shape={() => <g />}
              />
              {/* Actual runs */}
              <Scatter
                data={scatterData.filter((d) => !d.isRef)}
                fill="#818cf8"
                fillOpacity={0.7}
              />
              <Scatter
                data={scatterData.filter((d) => d.isRef)}
                fill="#fbbf24"
                stroke="#fbbf24"
                fillOpacity={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Your runs</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Reference run</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-400 opacity-60" /> Riegel curve</div>
          </div>
        </div>
      )}

      {/* Methodology note */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">How predictions work</p>
        <p>
          Predictions use <span className="text-text-primary">Riegel&apos;s formula</span>: T₂ = T₁ × (D₂ / D₁)^1.06, where T₁ and D₁ are your reference run time and distance. The exponent 1.06 accounts for the fact that pace slows as distance increases.
        </p>
        <p>
          <span className="font-medium text-text-primary">Best accuracy:</span> Use a recent race-effort run ≥ 5K. Easy or recovery runs will underestimate your performance. The prediction assumes similar effort and conditions.
        </p>
        {vdot && (
          <p>
            <span className="font-medium text-text-primary">VDOT ~{vdot}:</span> Your estimated aerobic capacity based on this run. Jack Daniels&apos; VDOT tables use this to prescribe training paces.
          </p>
        )}
      </div>
    </div>
  )
}
