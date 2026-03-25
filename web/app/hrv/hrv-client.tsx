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
  Cell,
  ComposedChart,
  Area,
} from 'recharts'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface DailySummary {
  date: string
  avg_hrv: number | null
  resting_heart_rate: number | null
  sleep_duration_minutes: number | null
  recovery_score: number | null
  active_calories: number | null
}

interface SleepRecord {
  end_time: string
  duration_minutes: number
  deep_minutes: number | null
  rem_minutes: number | null
}

interface WorkoutDay {
  start_time: string
  duration_minutes: number
  active_calories: number | null
}

interface HrvClientProps {
  summaries: DailySummary[]
  sleepRecords: SleepRecord[]
  workoutDays: WorkoutDay[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Compute N-day exponential moving average
function ema(values: number[], span: number): number[] {
  const k = 2 / (span + 1)
  const result: number[] = []
  let prev: number | null = null
  for (const v of values) {
    if (prev === null) {
      result.push(Math.round(v * 10) / 10)
      prev = v
    } else {
      const next: number = v * k + prev * (1 - k)
      result.push(Math.round(next * 10) / 10)
      prev = next
    }
  }
  return result
}

export function HrvClient({ summaries, sleepRecords, workoutDays }: HrvClientProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">💗</span>
        <h2 className="text-lg font-semibold text-text-primary">No HRV data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          HRV syncs from Apple Watch via the KQuarks iOS app. Ensure your Watch is set to measure
          HRV during sleep.
        </p>
      </div>
    )
  }

  const hrvValues = summaries.map((s) => s.avg_hrv!)
  const mean = hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length
  const std = Math.sqrt(hrvValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / hrvValues.length)
  const baseline = Math.round(mean)
  const bandLow = Math.round(mean - std)
  const bandHigh = Math.round(mean + std)

  const latestHrv = hrvValues[hrvValues.length - 1]
  const prev7Avg =
    hrvValues.slice(-8, -1).length > 0
      ? Math.round(hrvValues.slice(-8, -1).reduce((a, b) => a + b, 0) / hrvValues.slice(-8, -1).length)
      : null
  const trendPct =
    prev7Avg && prev7Avg > 0
      ? Math.round(((latestHrv - prev7Avg) / prev7Avg) * 100)
      : null

  const bestHrv = Math.max(...hrvValues)
  const worstHrv = Math.min(...hrvValues)
  const bestDate = summaries[hrvValues.indexOf(bestHrv)].date
  const worstDate = summaries[hrvValues.indexOf(worstHrv)].date

  // 7-day EMA for trend smoothing
  const ema7 = ema(hrvValues, 7)

  // Chart data with EMA
  const chartData = summaries.map((s, i) => ({
    date: fmtDate(s.date),
    hrv: Math.round(s.avg_hrv!),
    ema7: ema7[i],
    baseline,
  }))

  // Day-of-week HRV averages
  const dowSums = Array(7).fill(0)
  const dowCounts = Array(7).fill(0)
  for (const s of summaries) {
    const dow = new Date(s.date + 'T00:00:00').getDay()
    dowSums[dow] += s.avg_hrv!
    dowCounts[dow]++
  }
  const dowData = DAY_LABELS.map((label, i) => ({
    label,
    avg: dowCounts[i] > 0 ? Math.round(dowSums[i] / dowCounts[i]) : null,
  })).filter((d) => d.avg !== null)

  // HRV after workout vs rest days
  const workoutDateSet = new Set(workoutDays.map((w) => w.start_time.slice(0, 10)))
  const dayAfterWorkout = new Set(
    workoutDays.map((w) => {
      const d = new Date(w.start_time.slice(0, 10) + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      return d.toISOString().slice(0, 10)
    })
  )

  const hrvAfterWorkout: number[] = []
  const hrvRestDays: number[] = []
  for (const s of summaries) {
    if (!s.avg_hrv) continue
    if (dayAfterWorkout.has(s.date)) {
      hrvAfterWorkout.push(s.avg_hrv)
    } else if (!workoutDateSet.has(s.date)) {
      hrvRestDays.push(s.avg_hrv)
    }
  }
  const avgHrvAfterWorkout =
    hrvAfterWorkout.length > 0
      ? Math.round(hrvAfterWorkout.reduce((a, b) => a + b, 0) / hrvAfterWorkout.length)
      : null
  const avgHrvRest =
    hrvRestDays.length > 0
      ? Math.round(hrvRestDays.reduce((a, b) => a + b, 0) / hrvRestDays.length)
      : null

  // Sleep quality vs HRV correlation
  // Build sleep by morning date
  const sleepByDate = new Map<string, { duration: number; deep: number; rem: number }>()
  for (const r of sleepRecords) {
    const date = r.end_time.slice(0, 10)
    const existing = sleepByDate.get(date)
    if (!existing || r.duration_minutes > existing.duration) {
      sleepByDate.set(date, {
        duration: r.duration_minutes,
        deep: r.deep_minutes ?? 0,
        rem: r.rem_minutes ?? 0,
      })
    }
  }

  // For scatter-style: group HRV by sleep duration buckets
  const sleepHrvPairs = summaries
    .filter((s) => s.avg_hrv && sleepByDate.has(s.date))
    .map((s) => ({
      sleepH: Math.round((sleepByDate.get(s.date)!.duration / 60) * 10) / 10,
      hrv: Math.round(s.avg_hrv!),
    }))

  // Bucket sleep into 30-min intervals and average HRV
  const sleepBuckets = new Map<number, number[]>()
  for (const p of sleepHrvPairs) {
    const bucket = Math.floor(p.sleepH * 2) / 2 // round to nearest 0.5h
    if (!sleepBuckets.has(bucket)) sleepBuckets.set(bucket, [])
    sleepBuckets.get(bucket)!.push(p.hrv)
  }
  const sleepCorrelData = Array.from(sleepBuckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([h, hrvs]) => ({
      sleep: `${h}h`,
      avgHrv: Math.round(hrvs.reduce((a, b) => a + b, 0) / hrvs.length),
    }))

  // HRV status classification
  function classifyHrv(hrv: number): { label: string; color: string } {
    if (hrv >= bandHigh) return { label: 'Elevated', color: '#22c55e' }
    if (hrv >= bandLow) return { label: 'Normal', color: '#38bdf8' }
    if (hrv >= bandLow * 0.85) return { label: 'Below baseline', color: '#f97316' }
    return { label: 'Low', color: '#ef4444' }
  }

  const currentStatus = classifyHrv(latestHrv)

  // 7-day drop-off warning: alert when latest is >15% below 7-day average
  const sevenDayAvg = hrvValues.slice(-7).length > 0
    ? hrvValues.slice(-7).reduce((a, b) => a + b, 0) / hrvValues.slice(-7).length
    : null
  const dropPct = sevenDayAvg ? Math.round(((latestHrv - sevenDayAvg) / sevenDayAvg) * 100) : null
  const showDropWarning = dropPct !== null && dropPct <= -15

  // Parasympathetic/sympathetic state based on HRV vs personal baseline
  const pnsState = latestHrv >= baseline + std
    ? { label: 'Parasympathetic dominant', desc: 'Well-recovered — good day for hard training', color: 'text-green-400' }
    : latestHrv <= baseline - std
    ? { label: 'Sympathetic dominant', desc: 'Stressed or fatigued — prioritise recovery', color: 'text-red-400' }
    : { label: 'Balanced', desc: 'Normal autonomic tone — moderate training OK', color: 'text-yellow-400' }

  return (
    <div className="space-y-6">
      {/* 7-day drop-off warning banner */}
      {showDropWarning && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">HRV {Math.abs(dropPct!)}% below 7-day average</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Your HRV has dropped significantly. Consider rest, sleep quality, or stress as contributing factors.
            </p>
          </div>
        </div>
      )}

      {/* Parasympathetic / sympathetic state */}
      <div className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold ${pnsState.color}`}>{pnsState.label}</p>
          <p className="text-xs text-text-secondary mt-0.5">{pnsState.desc}</p>
        </div>
        <p className={`text-3xl font-black ${pnsState.color}`}>{Math.round(latestHrv)}</p>
      </div>

      {/* Current status */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary mb-1">Today&apos;s HRV</p>
            <p className="text-5xl font-black text-text-primary">{Math.round(latestHrv)}</p>
            <p className="text-sm text-text-secondary mt-1">ms SDNN</p>
          </div>
          <div className="text-right">
            <p
              className="text-lg font-bold"
              style={{ color: currentStatus.color }}
            >
              {currentStatus.label}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {trendPct !== null
                ? `${trendPct > 0 ? '+' : ''}${trendPct}% vs 7-day avg`
                : ''}
            </p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">
              Baseline {baseline} ms ({bandLow}–{bandHigh})
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Avg HRV', value: `${baseline} ms`, sub: '90-day baseline' },
          { label: 'Best', value: `${Math.round(bestHrv)} ms`, sub: fmtDate(bestDate) },
          { label: 'Lowest', value: `${Math.round(worstHrv)} ms`, sub: fmtDate(worstDate) },
          { label: 'Variability', value: `±${Math.round(std)} ms`, sub: 'natural fluctuation' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-black text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
            <p className="text-xs font-medium text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* HRV trend with baseline band */}
      {chartData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">HRV Trend</h3>
          <p className="text-xs text-text-secondary mb-3">
            Dots = daily · Line = 7-day EMA · Dashed zone = your baseline ±1 SD
          </p>
          <ResponsiveContainer width="100%" height={175}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={34}
                tickFormatter={(v) => `${v}`}
                domain={[Math.max(0, bandLow - 20), bandHigh + 20]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  `${v} ms`,
                  name === 'hrv' ? 'HRV' : '7-day avg',
                ]}
              />
              {/* Baseline band */}
              <ReferenceLine
                y={bandHigh}
                stroke="rgba(56,189,248,0.25)"
                strokeDasharray="4 2"
              />
              <ReferenceLine
                y={bandLow}
                stroke="rgba(56,189,248,0.25)"
                strokeDasharray="4 2"
                label={{
                  value: 'Baseline',
                  position: 'insideBottomRight',
                  fontSize: 9,
                  fill: 'rgba(56,189,248,0.5)',
                }}
              />
              <ReferenceLine y={baseline} stroke="rgba(56,189,248,0.15)" />
              {/* Daily dots */}
              <Line
                type="monotone"
                dataKey="hrv"
                stroke="rgba(56,189,248,0.4)"
                strokeWidth={0}
                dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0, opacity: 0.7 }}
                activeDot={{ r: 5 }}
              />
              {/* EMA line */}
              <Line
                type="monotone"
                dataKey="ema7"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day-of-week averages */}
      {dowData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Average HRV by Day of Week
          </h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={dowData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                tickFormatter={(v) => `${v}`}
                domain={[Math.max(0, baseline - 15), baseline + 15]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} ms`, 'Avg HRV']}
              />
              <ReferenceLine y={baseline} stroke="rgba(56,189,248,0.3)" strokeDasharray="4 2" />
              <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                {dowData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      (d.avg ?? 0) >= baseline + std * 0.5
                        ? '#22c55e'
                        : (d.avg ?? 0) >= baseline - std * 0.5
                        ? '#38bdf8'
                        : '#f97316'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* After workout vs rest */}
      {avgHrvAfterWorkout !== null && avgHrvRest !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            HRV: After Workout vs Rest Days
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-4xl font-black text-text-primary">{avgHrvAfterWorkout}</p>
              <p className="text-xs text-text-secondary mt-1">ms · after workout</p>
              <p className="text-xs text-text-secondary opacity-60 mt-0.5">
                n={hrvAfterWorkout.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-text-primary">{avgHrvRest}</p>
              <p className="text-xs text-text-secondary mt-1">ms · rest days</p>
              <p className="text-xs text-text-secondary opacity-60 mt-0.5">
                n={hrvRestDays.length}
              </p>
            </div>
          </div>
          {(() => {
            const diff = avgHrvAfterWorkout - avgHrvRest
            const pct = Math.round((Math.abs(diff) / avgHrvRest) * 100)
            return (
              <div
                className="mt-3 rounded-lg p-3 text-center text-sm border"
                style={{
                  background: diff < -3 ? 'rgba(249,115,22,0.08)' : 'rgba(34,197,94,0.08)',
                  borderColor: diff < -3 ? 'rgba(249,115,22,0.2)' : 'rgba(34,197,94,0.2)',
                }}
              >
                <span style={{ color: diff < -3 ? '#f97316' : '#22c55e' }} className="font-semibold">
                  {diff > 0 ? '+' : ''}{diff} ms ({pct}%)
                </span>{' '}
                <span className="text-text-secondary">
                  {diff < -5
                    ? 'exercise stress reduces HRV — prioritize recovery after hard sessions'
                    : diff > 5
                    ? 'training is building your HRV — aerobic fitness is improving'
                    : 'minimal difference — your training load is well-managed'}
                </span>
              </div>
            )
          })()}
        </div>
      )}

      {/* Sleep vs HRV correlation */}
      {sleepCorrelData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">Sleep Duration vs HRV</h3>
          <p className="text-xs text-text-secondary mb-3">
            Average HRV grouped by hours slept the previous night
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={sleepCorrelData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="sleep"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} ms`, 'Avg HRV']}
              />
              <ReferenceLine y={baseline} stroke="rgba(56,189,248,0.3)" strokeDasharray="4 2" />
              <Bar dataKey="avgHrv" radius={[3, 3, 0, 0]}>
                {sleepCorrelData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.avgHrv >= baseline ? '#6366f1' : 'rgba(99,102,241,0.4)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* HRV classification guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">Your HRV Baseline</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
            <span>
              <span className="font-medium text-text-primary">Above {bandHigh} ms</span> — elevated,
              excellent recovery and readiness
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
            <span>
              <span className="font-medium text-text-primary">{bandLow}–{bandHigh} ms</span> — normal
              range, proceed as planned
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400 shrink-0" />
            <span>
              <span className="font-medium text-text-primary">Below {bandLow} ms</span> — below
              baseline, consider lighter activity
            </span>
          </div>
        </div>
        <p className="opacity-60 pt-1">
          HRV is highly individual — compare to your own baseline, not others. Your 90-day
          baseline: {baseline} ms ± {Math.round(std)} ms.
        </p>
      </div>

      {/* ECG History link */}
      <Link
        href="/hrv/ecg"
        className="flex items-center justify-between bg-surface rounded-xl border border-border p-4 hover:bg-surface-secondary transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-text-primary">ECG History</p>
          <p className="text-xs text-text-secondary mt-0.5">Apple Watch recordings</p>
        </div>
        <span className="text-sm text-text-secondary">View ECG History →</span>
      </Link>
    </div>
  )
}
