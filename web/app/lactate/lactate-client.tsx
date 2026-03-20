'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

interface Run {
  id: string
  start_time: string
  duration_minutes: number
  distance_meters?: number | null
  avg_pace_per_km?: number | null
  avg_heart_rate?: number | null
}

interface LactateClientProps {
  runs: Run[]
}

const ORANGE = '#f97316'
const ORANGE_MUTED = '#fb923c'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// Compute pace seconds/km from duration_minutes and distance_meters
function computePaceSecs(durationMin: number, distanceMeters: number): number {
  if (distanceMeters <= 0) return 0
  return (durationMin * 60) / (distanceMeters / 1000)
}

// Format pace seconds/km as mm:ss
function fmtPace(secsPerKm: number): string {
  if (!secsPerKm || secsPerKm <= 0) return '—'
  const m = Math.floor(secsPerKm / 60)
  const s = Math.round(secsPerKm % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 85th percentile of a sorted numeric array
function percentile85(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil(sorted.length * 0.85) - 1
  return sorted[Math.max(0, idx)]
}

type EffortLabel = 'Easy' | 'Moderate' | 'Threshold' | 'Hard'

function effortColor(label: EffortLabel): string {
  switch (label) {
    case 'Easy':      return '#22c55e'   // green
    case 'Moderate':  return '#14b8a6'   // teal
    case 'Threshold': return '#f97316'   // orange
    case 'Hard':      return '#ef4444'   // red
  }
}

function effortLabel(hr: number, lt1: number, lt2: number): EffortLabel {
  if (hr < lt1) return 'Easy'
  if (hr < lt2) return 'Moderate'
  if (hr <= lt2 + 10) return 'Threshold'
  return 'Hard'
}

interface TrainingZone {
  name: string
  label: string
  hrRange: string
  description: string
  color: string
}

function buildZones(lt1: number, lt2: number, maxHr: number): TrainingZone[] {
  return [
    {
      name: 'Z1',
      label: 'Recovery',
      hrRange: `< ${Math.round(lt1 - 10)} bpm`,
      description: 'Very easy. Active recovery, warm-up and cool-down.',
      color: '#22c55e',
    },
    {
      name: 'Z2',
      label: 'Aerobic',
      hrRange: `${Math.round(lt1 - 10)}–${Math.round(lt1)} bpm`,
      description: 'Conversational pace. Builds aerobic base and fat oxidation.',
      color: '#14b8a6',
    },
    {
      name: 'Z3',
      label: 'Tempo',
      hrRange: `${Math.round(lt1 + 1)}–${Math.round(lt2 - 5)} bpm`,
      description: 'Comfortably hard. Improves lactate clearance and efficiency.',
      color: '#eab308',
    },
    {
      name: 'Z4',
      label: 'Threshold',
      hrRange: `${Math.round(lt2 - 4)}–${Math.round(lt2 + 6)} bpm`,
      description: 'Hard, unsustainable for long. Raises lactate threshold.',
      color: '#f97316',
    },
    {
      name: 'Z5',
      label: 'VO2Max',
      hrRange: `> ${Math.round(lt2 + 7)} bpm`,
      description: 'Max effort. Short intervals. Develops VO2Max and speed.',
      color: '#ef4444',
    },
  ]
}

export function LactateClient({ runs }: LactateClientProps) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">O</span>
        <h2 className="text-lg font-semibold text-text-primary">No qualifying runs yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Lactate threshold analysis requires at least one run over 15 minutes with heart rate data.
          Sync more runs from Apple Health to see your thresholds.
        </p>
      </div>
    )
  }

  // ─── Compute LT2 (LTHR) = 85th percentile of avg_heart_rate ──────────────
  const heartRates = runs
    .map((r) => r.avg_heart_rate ?? 0)
    .filter((hr) => hr > 0)
    .sort((a, b) => a - b)

  const lt2 = Math.round(percentile85(heartRates))
  const lt1 = lt2 - 20
  const estimatedMaxHr = lt2 + Math.round((220 - lt2) * 0.12) // conservative max HR estimate

  // ─── Build scatter data (HR vs pace) ──────────────────────────────────────
  const scatterData = runs
    .map((r) => {
      const hr = r.avg_heart_rate ?? 0
      if (hr <= 0) return null

      // Use avg_pace_per_km if present, otherwise compute from duration + distance
      let paceSecs: number | null = null
      if (r.avg_pace_per_km && r.avg_pace_per_km > 0) {
        paceSecs = r.avg_pace_per_km
      } else if ((r.distance_meters ?? 0) > 0) {
        paceSecs = computePaceSecs(r.duration_minutes, r.distance_meters ?? 0)
      }

      if (paceSecs === null || paceSecs <= 0) return null

      const effort = effortLabel(hr, lt1, lt2)

      return {
        date: new Date(r.start_time).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        hr,
        paceSecs: +paceSecs.toFixed(0),
        paceLabel: fmtPace(paceSecs),
        effort,
        color: effortColor(effort),
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)

  // Y axis domain for pace (inverted — lower seconds = faster)
  const allPaceSecs = scatterData.map((d) => d.paceSecs)
  const paceMin = allPaceSecs.length ? Math.min(...allPaceSecs) - 20 : 200
  const paceMax = allPaceSecs.length ? Math.max(...allPaceSecs) + 20 : 700

  // HR domain
  const hrMin = heartRates.length ? Math.min(...heartRates) - 5 : 100
  const hrMax = heartRates.length ? Math.max(...heartRates) + 10 : 200

  // ─── Training zones ────────────────────────────────────────────────────────
  const zones = buildZones(lt1, lt2, estimatedMaxHr)

  // ─── Effort counts for summary ─────────────────────────────────────────────
  const easySessions  = scatterData.filter((d) => d.effort === 'Easy').length
  const modSessions   = scatterData.filter((d) => d.effort === 'Moderate').length
  const thrSessions   = scatterData.filter((d) => d.effort === 'Threshold').length
  const hardSessions  = scatterData.filter((d) => d.effort === 'Hard').length

  // Pace at LT1 and LT2: find nearest point in scatter data below each HR
  function paceAtHr(targetHr: number): string {
    const nearby = scatterData
      .filter((d) => Math.abs(d.hr - targetHr) <= 8)
      .sort((a, b) => Math.abs(a.hr - targetHr) - Math.abs(b.hr - targetHr))
    return nearby.length > 0 ? `${nearby[0].paceLabel}/km` : '—'
  }

  const paceAtLt1 = paceAtHr(lt1)
  const paceAtLt2 = paceAtHr(lt2)

  return (
    <div className="space-y-6">

      {/* ── Threshold summary cards ─────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">
          Estimated Thresholds
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#14b8a6' }}>
              {lt1} bpm
            </p>
            <p className="text-xs text-text-secondary mt-0.5">LT1 — Aerobic</p>
            <p className="text-xs text-text-secondary opacity-60 mt-1">{paceAtLt1}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: ORANGE }}>
              {lt2} bpm
            </p>
            <p className="text-xs text-text-secondary mt-0.5">LT2 — LTHR</p>
            <p className="text-xs text-text-secondary opacity-60 mt-1">{paceAtLt2}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">
              {estimatedMaxHr} bpm
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Est. Max HR</p>
            <p className="text-xs text-text-secondary opacity-60 mt-1">from LT2</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">
              {runs.length}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Qualifying Runs</p>
            <p className="text-xs text-text-secondary opacity-60 mt-1">&gt; 15 min + HR</p>
          </div>
        </div>
      </div>

      {/* ── HR vs Pace scatter chart ─────────────────────────────────────── */}
      {scatterData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">
            Heart Rate vs Pace
          </h3>
          <p className="text-xs text-text-secondary mb-3 opacity-70">
            Each dot is a run. Color = effort zone. Vertical lines mark LT1 and LT2.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="hr"
                type="number"
                domain={[hrMin, hrMax]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Avg HR (bpm)',
                  position: 'insideBottom',
                  offset: -2,
                  style: { fontSize: 10, fill: 'var(--color-text-secondary)' },
                }}
              />
              <YAxis
                dataKey="paceSecs"
                type="number"
                domain={[paceMin, paceMax]}
                reversed
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={40}
                tickFormatter={(v: number) => fmtPace(v)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null
                  const d = payload[0].payload as (typeof scatterData)[0]
                  return (
                    <div style={tooltipStyle} className="px-3 py-2 space-y-0.5">
                      <p className="font-medium text-text-primary">{d.date}</p>
                      <p className="text-text-secondary">{d.hr} bpm</p>
                      <p className="text-text-secondary">{d.paceLabel}/km</p>
                      <p style={{ color: d.color }}>{d.effort}</p>
                    </div>
                  )
                }}
              />
              <ReferenceLine
                x={lt1}
                stroke="#14b8a6"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `LT1 ${lt1}`,
                  position: 'top',
                  fontSize: 10,
                  fill: '#14b8a6',
                }}
              />
              <ReferenceLine
                x={lt2}
                stroke={ORANGE}
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `LT2 ${lt2}`,
                  position: 'top',
                  fontSize: 10,
                  fill: ORANGE,
                }}
              />
              <Scatter data={scatterData} opacity={0.88}>
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Effort legend */}
          <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
            {(
              [
                { label: 'Easy', color: '#22c55e' },
                { label: 'Moderate', color: '#14b8a6' },
                { label: 'Threshold', color: '#f97316' },
                { label: 'Hard', color: '#ef4444' },
              ] as { label: EffortLabel; color: string }[]
            ).map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1 text-xs text-text-secondary">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: color }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Training Zones ───────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            5 Training Zones
          </h3>
          <p className="text-xs text-text-secondary opacity-70 mt-0.5">
            Based on Coggan/LT model from your estimated LT1 ({lt1} bpm) and LT2 ({lt2} bpm)
          </p>
        </div>
        <div className="divide-y divide-border">
          {zones.map((zone) => (
            <div key={zone.name} className="flex items-start gap-3 px-4 py-3">
              <div
                className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: zone.color }}
              >
                {zone.name}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-text-primary">{zone.label}</span>
                  <span className="text-xs tabular-nums" style={{ color: zone.color }}>
                    {zone.hrRange}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {zone.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Effort distribution summary ──────────────────────────────────── */}
      {scatterData.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { label: 'Easy', count: easySessions,  color: '#22c55e' },
              { label: 'Moderate', count: modSessions,   color: '#14b8a6' },
              { label: 'Threshold', count: thrSessions,   color: '#f97316' },
              { label: 'Hard', count: hardSessions,  color: '#ef4444' },
            ] as { label: string; count: number; color: string }[]
          ).map(({ label, count, color }) => (
            <div key={label} className="bg-surface rounded-2xl border border-border p-4 text-center">
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs text-text-secondary mt-0.5">{label} Runs</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Science card ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: 'rgba(249,115,22,0.06)',
          borderColor: 'rgba(249,115,22,0.25)',
        }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: ORANGE_MUTED }}
        >
          The Science of Lactate Thresholds
        </h3>
        <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
          <div>
            <span className="font-medium text-teal-400">LT1 — Aerobic Threshold</span>
            <p className="mt-0.5">
              The first lactate inflection point where blood lactate begins to rise above baseline.
              Below LT1, your body primarily uses fat for fuel and lactate clears as fast as it is
              produced. This is the foundation of aerobic base building (Z1–Z2 training).
            </p>
          </div>
          <div>
            <span className="font-medium" style={{ color: ORANGE_MUTED }}>
              LT2 — Lactate Threshold / LTHR
            </span>
            <p className="mt-0.5">
              The maximum intensity you can sustain for roughly 30–60 minutes before lactate
              accumulates faster than it can be cleared. Also called the anaerobic threshold or
              functional threshold. Raising LT2 is the single biggest predictor of endurance
              performance improvement.
            </p>
          </div>
          <div>
            <span className="font-medium text-text-primary">Coggan Training Zones</span>
            <p className="mt-0.5">
              Zones here are derived from your LT2 (LTHR). The 80/20 rule applies: roughly 80 % of
              your training should fall below LT1 (Z1–Z2), and 20 % in Z3–Z5. Most recreational
              runners spend too much time in the grey "moderate" zone — hard enough to accumulate
              fatigue, but not hard enough to generate training adaptations.
            </p>
          </div>
          <div>
            <span className="font-medium text-text-primary">How LT2 is estimated here</span>
            <p className="mt-0.5">
              LT2 is estimated as the 85th percentile of average heart rate across all qualifying
              runs (&gt; 15 min with HR data). LT1 is set at LT2 − 20 bpm. For a precise lab
              measurement, a ramp test or blood-lactate test is recommended.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
