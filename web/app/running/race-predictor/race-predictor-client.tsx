'use client'

import { useMemo, useState } from 'react'
import { Trophy, TrendingUp, Info } from 'lucide-react'

interface RunRow {
  duration_minutes: number
  distance_meters: number
  avg_pace_per_km: number | null
}

interface RacePredictorClientProps {
  runs: RunRow[]
}

const RACE_DISTANCES = [
  { label: '5K',        meters: 5000 },
  { label: '10K',       meters: 10000 },
  { label: 'Half',      meters: 21097 },
  { label: 'Marathon',  meters: 42195 },
]

// Riegel formula: T2 = T1 × (D2 / D1) ^ 1.06
function riegelPredict(t1Secs: number, d1Meters: number, d2Meters: number): number {
  return t1Secs * Math.pow(d2Meters / d1Meters, 1.06)
}

function fmtTime(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = Math.round(totalSecs % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtPace(paceSecsPerKm: number): string {
  const m = Math.floor(paceSecsPerKm / 60)
  const s = Math.round(paceSecsPerKm % 60)
  return `${m}:${s.toString().padStart(2, '0')} /km`
}

// Find the best effort run for a given distance band (within ±20% of target)
function bestEffort(runs: RunRow[], targetMeters: number): { timeSecs: number; distanceM: number } | null {
  const candidates = runs.filter((r) => {
    const ratio = r.distance_meters / targetMeters
    return ratio >= 0.8 && ratio <= 1.2 && r.duration_minutes > 0
  })
  if (candidates.length === 0) return null
  // Best = fastest pace (lowest secs per km)
  const best = candidates.reduce((a, b) => {
    const paceA = (a.duration_minutes * 60) / (a.distance_meters / 1000)
    const paceB = (b.duration_minutes * 60) / (b.distance_meters / 1000)
    return paceA < paceB ? a : b
  })
  return { timeSecs: best.duration_minutes * 60, distanceM: best.distance_meters }
}

// Pick the best source effort overall (closest to 10K distance band as anchor)
function bestAnchor(runs: RunRow[]): { timeSecs: number; distanceM: number } | null {
  if (runs.length === 0) return null
  // Try 10K band first, then 5K, then anything ≥1km
  for (const targetM of [10000, 5000, 3000, 1500]) {
    const e = bestEffort(runs, targetM)
    if (e) return e
  }
  // Fallback: longest run
  const sorted = [...runs].sort((a, b) => b.distance_meters - a.distance_meters)
  return { timeSecs: sorted[0].duration_minutes * 60, distanceM: sorted[0].distance_meters }
}

export function RacePredictorClient({ runs }: RacePredictorClientProps) {
  const [showInfo, setShowInfo] = useState(false)

  const anchor = useMemo(() => bestAnchor(runs), [runs])

  const predictions = useMemo(() => {
    if (!anchor) return []
    return RACE_DISTANCES.map((race) => {
      const predSecs = riegelPredict(anchor.timeSecs, anchor.distanceM, race.meters)
      const pacePerKm = predSecs / (race.meters / 1000)
      return { ...race, predSecs, pacePerKm }
    })
  }, [anchor])

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8 space-y-3">
        <span className="text-5xl">🏁</span>
        <h2 className="text-lg font-semibold text-text-primary">No running data yet</h2>
        <p className="text-sm text-text-secondary">
          Sync at least one run (1 km+) to see race time predictions.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Info toggle */}
      <button
        onClick={() => setShowInfo((v) => !v)}
        className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        How are predictions calculated?
      </button>
      {showInfo && (
        <div className="bg-surface rounded-2xl p-4 text-xs text-text-secondary space-y-1.5 border border-border">
          <p className="font-semibold text-text-primary">Riegel Formula</p>
          <p>T₂ = T₁ × (D₂ ÷ D₁)^1.06</p>
          <p>Where T₁ is your best recent effort time over D₁ metres. The 1.06 exponent accounts for the non-linear relationship between distance and fatigue.</p>
          <p className="text-text-secondary/60 mt-1">Accuracy is best when your anchor run is close in distance to the target race. Predictions assume even effort and good conditions.</p>
        </div>
      )}

      {/* Anchor effort */}
      {anchor && (
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-text-primary">Anchor Effort</p>
          </div>
          <p className="text-xs text-text-secondary">
            Best run: {(anchor.distanceM / 1000).toFixed(2)} km in {fmtTime(anchor.timeSecs)}
            {' · '}avg pace {fmtPace(anchor.timeSecs / (anchor.distanceM / 1000))}
          </p>
        </div>
      )}

      {/* Predictions grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Predicted Race Times</h2>
        {predictions.map((p, i) => {
          const gradient = ['from-green-500', 'from-blue-500', 'from-purple-500', 'from-orange-500'][i]
          return (
            <div
              key={p.label}
              className={`bg-surface rounded-2xl p-4 border border-border flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} to-transparent/0 flex items-center justify-center`}>
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-text-primary">{p.label}</p>
                  <p className="text-xs text-text-secondary">{fmtPace(p.pacePerKm)}</p>
                </div>
              </div>
              <p className="text-2xl font-black text-text-primary tabular-nums">{fmtTime(p.predSecs)}</p>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-text-secondary text-center pb-2">
        Predictions update as you sync more runs. Train hard! 💪
      </p>
    </div>
  )
}
