'use client'

import { useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface RunData {
  date: string
  durationMinutes: number
  distanceKm: number
  paceSecsPerKm: number | null
  heartRate: number | null
  cadence: number | null
  strideLength: number | null
  verticalOscillation: number | null
  groundContactTime: number | null
  power: number | null
}

interface Vo2maxEntry {
  date: string
  vo2max: number
}

interface RunningClientProps {
  runs: RunData[]
  vo2maxHistory: Vo2maxEntry[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtPace(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function avgOf(runs: RunData[], key: keyof RunData): number | null {
  const vals = runs.map((r) => r[key] as number | null).filter((v): v is number => v !== null && v > 0)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function vo2maxCategoryACSM(v: number): { label: string; color: string } {
  if (v > 62) return { label: 'Superior', color: 'text-purple-400' }
  if (v >= 53) return { label: 'Excellent', color: 'text-green-400' }
  if (v >= 44) return { label: 'Good', color: 'text-lime-400' }
  if (v >= 33) return { label: 'Fair', color: 'text-yellow-400' }
  return { label: 'Poor', color: 'text-orange-400' }
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
            width={38}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatter(v), label]} />
          {refLines?.map((r) => (
            <ReferenceLine key={r.y} y={r.y} stroke={r.color} strokeDasharray="4 3"
              label={{ value: r.label, position: 'insideTopRight', fontSize: 9, fill: r.color }} />
          ))}
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RunningClient({ runs, vo2maxHistory }: RunningClientProps) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏃</span>
        <h2 className="text-lg font-semibold text-text-primary">No running data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import running workouts. Form metrics (cadence, stride, oscillation) require Apple Watch Series 4 or later with iOS 16+.
        </p>
      </div>
    )
  }

  const hasFormData = runs.some((r) => r.cadence !== null)
  const avgCadence = avgOf(runs, 'cadence')
  const avgStride = avgOf(runs, 'strideLength')
  const avgOscillation = avgOf(runs, 'verticalOscillation')
  const avgGCT = avgOf(runs, 'groundContactTime')
  const avgPace = avgOf(runs, 'paceSecsPerKm')
  const totalKm = runs.reduce((s, r) => s + r.distanceKm, 0)
  const totalRuns = runs.length

  // VO2max estimation per run (Jack Daniels vDot formula, simplified)
  // v = speed in m/min, VO2 = -4.6 + 0.182258*v + 0.000104*v^2
  // %VO2max = 0.8 + 0.1894393*e^(-0.012778*t) + 0.2989558*e^(-0.1932605*t)  where t = duration in minutes
  // VO2max = VO2 / %VO2max
  function estimateVO2max(paceSecsPerKm: number, durationMinutes: number): number | null {
    if (!paceSecsPerKm || paceSecsPerKm <= 0 || !durationMinutes || durationMinutes < 5) return null
    const v = 1000 / (paceSecsPerKm / 60) // m/min
    const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v
    const t = durationMinutes
    const pctVO2max = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t)
    if (pctVO2max <= 0) return null
    return Math.round(vo2 / pctVO2max)
  }

  const vo2maxData = runs
    .filter((r) => r.paceSecsPerKm && r.paceSecsPerKm > 0 && r.durationMinutes >= 5)
    .map((r) => ({ date: fmtDate(r.date), vo2max: estimateVO2max(r.paceSecsPerKm!, r.durationMinutes) }))
    .filter((d): d is { date: string; vo2max: number } => d.vo2max !== null && d.vo2max > 20 && d.vo2max < 90)

  // Rolling 7-day average VO2max to smooth noise
  const smoothedVO2max = vo2maxData.map((d, i) => {
    const window = vo2maxData.slice(Math.max(0, i - 3), i + 4)
    const avg = window.reduce((s, x) => s + x.vo2max, 0) / window.length
    return { ...d, vo2max: Math.round(avg) }
  })

  const latestVO2max = smoothedVO2max.length > 0 ? smoothedVO2max[smoothedVO2max.length - 1].vo2max : null
  function vo2maxCategory(v: number): { label: string; color: string } {
    if (v >= 60) return { label: 'Superior', color: 'text-purple-400' }
    if (v >= 52) return { label: 'Excellent', color: 'text-green-400' }
    if (v >= 44) return { label: 'Good', color: 'text-lime-400' }
    if (v >= 37) return { label: 'Fair', color: 'text-yellow-400' }
    return { label: 'Needs work', color: 'text-orange-400' }
  }

  // Persist latest VO2max estimate to Supabase for long-term trending
  useEffect(() => {
    if (!latestVO2max) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      supabase.from('vo2max_estimates').upsert(
        { user_id: user.id, date: today, vo2max: latestVO2max, source: 'daniels_vdot' },
        { onConflict: 'user_id,date' }
      ).then(() => {}) // fire-and-forget
    })
  }, [latestVO2max])

  // Chart data
  const paceChartData = runs
    .filter((r) => r.paceSecsPerKm && r.paceSecsPerKm > 0)
    .map((r) => ({ date: fmtDate(r.date), pace: r.paceSecsPerKm! }))

  const cadenceChartData = runs
    .filter((r) => r.cadence && r.cadence > 0)
    .map((r) => ({ date: fmtDate(r.date), cadence: Math.round(r.cadence!) }))

  const oscChartData = runs
    .filter((r) => r.verticalOscillation && r.verticalOscillation > 0)
    .map((r) => ({ date: fmtDate(r.date), osc: +r.verticalOscillation!.toFixed(1) }))

  const gctChartData = runs
    .filter((r) => r.groundContactTime && r.groundContactTime > 0)
    .map((r) => ({ date: fmtDate(r.date), gct: Math.round(r.groundContactTime!) }))

  // VO2max history from database (persisted over time)
  const vo2maxHistoryChartData = vo2maxHistory.map((e) => ({
    date: fmtDate(e.date),
    vo2max: e.vo2max,
  }))
  const currentHistoryVO2max =
    vo2maxHistory.length > 0 ? vo2maxHistory[vo2maxHistory.length - 1].vo2max : null
  const thirtyDaysAgoStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })()
  const entry30dAgo = [...vo2maxHistory].reverse().find((e) => e.date <= thirtyDaysAgoStr)
  const vo2maxDelta =
    currentHistoryVO2max !== null && entry30dAgo !== undefined
      ? +(currentHistoryVO2max - entry30dAgo.vo2max).toFixed(1)
      : null

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{totalRuns}</p>
          <p className="text-xs text-text-secondary mt-0.5">Runs</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{totalKm.toFixed(0)} km</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Distance</p>
        </div>
        {avgPace && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{fmtPace(avgPace)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Pace /km</p>
          </div>
        )}
        {avgCadence && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${avgCadence >= 170 ? 'text-green-400' : avgCadence >= 160 ? 'text-yellow-400' : 'text-orange-400'}`}>
              {Math.round(avgCadence)}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Cadence (spm)</p>
          </div>
        )}
        {latestVO2max && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${vo2maxCategory(latestVO2max).color}`}>{latestVO2max}</p>
            <p className="text-xs text-text-secondary mt-0.5">VO₂max est.</p>
            <p className={`text-xs font-medium ${vo2maxCategory(latestVO2max).color}`}>{vo2maxCategory(latestVO2max).label}</p>
          </div>
        )}
      </div>

      {/* Form metric stats */}
      {hasFormData && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {avgStride && (
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-indigo-400">{(avgStride * 100).toFixed(0)} cm</p>
              <p className="text-xs text-text-secondary mt-0.5">Avg Stride</p>
            </div>
          )}
          {avgOscillation && (
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-2xl font-bold ${avgOscillation <= 8 ? 'text-green-400' : avgOscillation <= 10 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {avgOscillation.toFixed(1)} cm
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Vert. Oscillation</p>
            </div>
          )}
          {avgGCT && (
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-2xl font-bold ${avgGCT <= 240 ? 'text-green-400' : avgGCT <= 280 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {Math.round(avgGCT)} ms
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Ground Contact</p>
            </div>
          )}
        </div>
      )}

      {/* VO2max trend chart (locally estimated, last 90 days of runs) */}
      {smoothedVO2max.length >= 2 && (
        <TrendChart
          data={smoothedVO2max}
          dataKey="vo2max"
          label="VO₂max Estimate (ml/kg/min) — Daniels vDot formula"
          color="#c084fc"
          formatter={(v) => `${Math.round(v)}`}
          domain={[30, 70]}
          refLines={[
            { y: 44, color: 'rgba(163,230,53,0.4)', label: 'Good' },
            { y: 52, color: 'rgba(74,222,128,0.4)', label: 'Excellent' },
          ]}
        />
      )}

      {/* VO2max long-term trend from persisted estimates */}
      {vo2maxHistoryChartData.length >= 2 && currentHistoryVO2max !== null && (
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-text-primary">VO₂max Trend (90 days)</h3>
              <p className="text-xs text-text-secondary opacity-60 mt-0.5">Based on general adult norms (ACSM)</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${vo2maxCategoryACSM(currentHistoryVO2max).color}`}>
                {currentHistoryVO2max}
              </p>
              <p className={`text-xs font-medium ${vo2maxCategoryACSM(currentHistoryVO2max).color}`}>
                {vo2maxCategoryACSM(currentHistoryVO2max).label}
              </p>
              <p className="text-xs text-text-secondary">ml/kg/min</p>
            </div>
          </div>

          {vo2maxDelta !== null && (
            <p className={`text-sm font-medium ${vo2maxDelta >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
              {vo2maxDelta >= 0 ? '↑' : '↓'} {vo2maxDelta >= 0 ? `+${vo2maxDelta}` : vo2maxDelta} ml/kg/min vs 30 days ago
            </p>
          )}

          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={vo2maxHistoryChartData} margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
              <defs>
                <linearGradient id="vo2maxHistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                domain={[30, 70]}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${Math.round(v)} ml/kg/min`, 'VO₂max']}
              />
              <ReferenceLine
                y={currentHistoryVO2max}
                stroke="rgba(192,132,252,0.5)"
                strokeDasharray="4 3"
                label={{ value: `${currentHistoryVO2max}`, position: 'insideTopRight', fontSize: 9, fill: 'rgba(192,132,252,0.8)' }}
              />
              <Area
                type="monotone"
                dataKey="vo2max"
                stroke="#c084fc"
                strokeWidth={2}
                fill="url(#vo2maxHistGrad)"
                dot={{ r: 3, fill: '#c084fc' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { label: 'Poor', range: '<33', color: 'text-orange-400' },
              { label: 'Fair', range: '33–43', color: 'text-yellow-400' },
              { label: 'Good', range: '44–52', color: 'text-lime-400' },
              { label: 'Excellent', range: '53–62', color: 'text-green-400' },
              { label: 'Superior', range: '>62', color: 'text-purple-400' },
            ].map(({ label, range, color }) => (
              <span key={label} className={`${color} opacity-80`}>
                {label} <span className="opacity-60">{range}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trend charts */}
      <TrendChart
        data={paceChartData}
        dataKey="pace"
        label="Pace (min/km)"
        color="#a78bfa"
        formatter={(v) => fmtPace(v)}
        domain={['dataMin - 30', 'dataMax + 30']}
      />
      {cadenceChartData.length >= 2 && (
        <TrendChart
          data={cadenceChartData}
          dataKey="cadence"
          label="Cadence (steps/min)"
          color="#4ade80"
          formatter={(v) => `${Math.round(v)}`}
          domain={[140, 200]}
          refLines={[
            { y: 170, color: 'rgba(74,222,128,0.4)', label: '170' },
            { y: 180, color: 'rgba(74,222,128,0.6)', label: '180' },
          ]}
        />
      )}
      {oscChartData.length >= 2 && (
        <TrendChart
          data={oscChartData}
          dataKey="osc"
          label="Vertical Oscillation (cm)"
          color="#fb923c"
          formatter={(v) => `${v.toFixed(1)} cm`}
          domain={[4, 16]}
          refLines={[{ y: 8, color: 'rgba(74,222,128,0.4)', label: '8cm' }]}
        />
      )}
      {gctChartData.length >= 2 && (
        <TrendChart
          data={gctChartData}
          dataKey="gct"
          label="Ground Contact Time (ms)"
          color="#38bdf8"
          formatter={(v) => `${Math.round(v)} ms`}
          domain={[180, 340]}
          refLines={[{ y: 240, color: 'rgba(74,222,128,0.4)', label: '240ms' }]}
        />
      )}

      {/* Form guide */}
      {hasFormData && (
        <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
          <p className="font-medium text-text-primary text-sm">Running form guide</p>
          <div className="space-y-2">
            {[
              {
                name: 'Cadence',
                good: '≥ 170 spm',
                detail: 'Higher cadence reduces impact forces and overstriding. Elite runners typically run at 180+ spm.',
              },
              {
                name: 'Vertical Oscillation',
                good: '≤ 8 cm',
                detail: 'How much you bounce up and down. Less is more efficient — energy spent moving up is wasted. Aim for a smooth, horizontal motion.',
              },
              {
                name: 'Ground Contact Time',
                good: '≤ 240 ms',
                detail: 'Time your foot is on the ground. Shorter contact = quicker turnover = faster, more efficient running.',
              },
              {
                name: 'Stride Length',
                good: 'Improves with speed',
                detail: 'Should increase naturally with pace — not by overstriding (landing heel-first far ahead of body).',
              },
            ].map(({ name, good, detail }) => (
              <div key={name}>
                <p className="font-medium text-text-primary">{name} <span className="text-green-400 font-mono">{good}</span></p>
                <p className="opacity-70 mt-0.5">{detail}</p>
              </div>
            ))}
          </div>
          <p className="opacity-50 pt-1">Requires Apple Watch Series 4+ running iOS 16 or later.</p>
        </div>
      )}

      {/* Run list */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Runs</h2>
        {[...runs].reverse().slice(0, 20).map((run) => {
          const date = new Date(run.date + 'T00:00:00')
          return (
            <div key={run.date + run.durationMinutes} className="bg-surface rounded-xl border border-border px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{run.distanceKm.toFixed(2)} km</p>
                  <p className="text-xs text-text-secondary">{fmtDuration(run.durationMinutes)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                {run.paceSecsPerKm && run.paceSecsPerKm > 0 && (
                  <span className="text-purple-400">{fmtPace(run.paceSecsPerKm)} /km</span>
                )}
                {run.heartRate && <span>❤️ {run.heartRate} bpm</span>}
                {run.cadence && <span>👟 {Math.round(run.cadence)} spm</span>}
                {run.verticalOscillation && <span>↕️ {run.verticalOscillation.toFixed(1)} cm</span>}
                {run.groundContactTime && <span>⏱ {Math.round(run.groundContactTime)} ms</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Deep-dive links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/running/race-predictor"
          className="bg-surface rounded-2xl p-4 border border-border flex flex-col gap-1 hover:bg-surface/80 transition-colors">
          <span className="text-xl">🏁</span>
          <p className="text-sm font-semibold text-text-primary">Race Predictor</p>
          <p className="text-xs text-text-secondary">5K → Marathon times</p>
        </Link>
        <Link href="/running/pacing"
          className="bg-surface rounded-2xl p-4 border border-border flex flex-col gap-1 hover:bg-surface/80 transition-colors">
          <span className="text-xl">⚡</span>
          <p className="text-sm font-semibold text-text-primary">Pacing Analysis</p>
          <p className="text-xs text-text-secondary">Splits & negative splits</p>
        </Link>
      </div>
    </div>
  )
}
