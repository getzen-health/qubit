'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from 'recharts'

interface Metrics {
  vo2Max: number | null
  rhr: number | null
  hrv: number | null
  walkingSpeed: number | null
  dailySteps: number | null
  sleepMinutes: number | null
}

interface DailySummary {
  date: string
  avg_hrv: number | null
  resting_heart_rate: number | null
  steps: number | null
  sleep_duration_minutes: number | null
  active_calories: number | null
}

interface HealthRecord {
  start_time: string
  value: number
}

interface LongevityClientProps {
  metrics: Metrics
  summaries: DailySummary[]
  vo2Records: HealthRecord[]
  walkingRecords: HealthRecord[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// --- Scoring functions ---
// Each returns 0–100 using piecewise linear interpolation

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function piecewise(v: number, pts: [number, number][]) {
  if (v <= pts[0][0]) return pts[0][1]
  if (v >= pts[pts.length - 1][0]) return pts[pts.length - 1][1]
  for (let i = 0; i < pts.length - 1; i++) {
    const [v0, s0] = pts[i]
    const [v1, s1] = pts[i + 1]
    if (v >= v0 && v <= v1) return lerp(s0, s1, (v - v0) / (v1 - v0))
  }
  return 50
}

const scoreVO2 = (v: number) => piecewise(v, [[18, 5], [28, 25], [35, 50], [42, 70], [50, 88], [60, 100]])
const scoreRHR = (v: number) => piecewise(v, [[44, 100], [55, 88], [63, 72], [70, 55], [78, 35], [90, 10]])
const scoreHRV = (v: number) => piecewise(v, [[8, 5], [18, 25], [30, 50], [45, 72], [60, 88], [80, 100]])
const scoreWalk = (v: number) => piecewise(v, [[0.5, 5], [0.8, 25], [1.0, 50], [1.2, 70], [1.4, 88], [1.6, 100]])
const scoreSteps = (v: number) => piecewise(v, [[1500, 5], [3500, 25], [6000, 55], [9000, 78], [11000, 92], [14000, 100]])

function scoreSleep(minutes: number) {
  const hrs = minutes / 60
  if (hrs >= 7 && hrs <= 9) return 100
  if (hrs >= 6.5 && hrs < 7) return lerp(75, 100, (hrs - 6.5) / 0.5)
  if (hrs > 9 && hrs <= 9.5) return lerp(75, 100, (9.5 - hrs) / 0.5)
  if (hrs >= 6 && hrs < 6.5) return lerp(50, 75, (hrs - 6) / 0.5)
  if (hrs > 9.5 && hrs <= 10.5) return lerp(50, 75, (10.5 - hrs) / 1)
  if (hrs >= 5 && hrs < 6) return lerp(20, 50, (hrs - 5))
  if (hrs > 10.5 && hrs <= 12) return lerp(20, 50, (12 - hrs) / 1.5)
  return 10
}

interface MetricScore {
  key: string
  label: string
  value: number | null
  score: number | null
  weight: number
  unit: string
  format: (v: number) => string
  scoreFn: (v: number) => number
  refText: string
  color: string
}

function computeMetricScores(metrics: Metrics): MetricScore[] {
  return [
    {
      key: 'vo2',
      label: 'VO₂ Max',
      value: metrics.vo2Max,
      score: metrics.vo2Max !== null ? scoreVO2(metrics.vo2Max) : null,
      weight: 0.30,
      unit: 'mL/kg/min',
      format: (v) => v.toFixed(1),
      scoreFn: scoreVO2,
      refText: 'Elite ≥50',
      color: '#f59e0b',
    },
    {
      key: 'hrv',
      label: 'HRV',
      value: metrics.hrv,
      score: metrics.hrv !== null ? scoreHRV(metrics.hrv) : null,
      weight: 0.22,
      unit: 'ms',
      format: (v) => v.toFixed(0),
      scoreFn: scoreHRV,
      refText: 'Excellent ≥60ms',
      color: '#8b5cf6',
    },
    {
      key: 'rhr',
      label: 'Resting HR',
      value: metrics.rhr,
      score: metrics.rhr !== null ? scoreRHR(metrics.rhr) : null,
      weight: 0.20,
      unit: 'bpm',
      format: (v) => v.toFixed(0),
      scoreFn: scoreRHR,
      refText: 'Athletic ≤55',
      color: '#ef4444',
    },
    {
      key: 'walk',
      label: 'Walking Speed',
      value: metrics.walkingSpeed,
      score: metrics.walkingSpeed !== null ? scoreWalk(metrics.walkingSpeed) : null,
      weight: 0.13,
      unit: 'm/s',
      format: (v) => v.toFixed(2),
      scoreFn: scoreWalk,
      refText: 'Strong ≥1.3 m/s',
      color: '#06b6d4',
    },
    {
      key: 'steps',
      label: 'Daily Steps',
      value: metrics.dailySteps,
      score: metrics.dailySteps !== null ? scoreSteps(metrics.dailySteps) : null,
      weight: 0.10,
      unit: 'steps/day',
      format: (v) => Math.round(v).toLocaleString(),
      scoreFn: scoreSteps,
      refText: '≥10,000/day',
      color: '#4ade80',
    },
    {
      key: 'sleep',
      label: 'Sleep',
      value: metrics.sleepMinutes,
      score: metrics.sleepMinutes !== null ? scoreSleep(metrics.sleepMinutes) : null,
      weight: 0.05,
      unit: 'hrs/night',
      format: (v) => `${Math.floor(v / 60)}h ${Math.round(v % 60)}m`,
      scoreFn: scoreSleep,
      refText: '7–9 hours',
      color: '#60a5fa',
    },
  ]
}

function computeVitality(scores: MetricScore[]) {
  const available = scores.filter((s) => s.score !== null)
  if (available.length === 0) return null
  const totalWeight = available.reduce((s, m) => s + m.weight, 0)
  const weighted = available.reduce((s, m) => s + m.score! * m.weight, 0)
  return Math.round(weighted / totalWeight)
}

function vitalityZone(score: number) {
  if (score >= 90) return { label: 'Elite', color: '#22c55e', desc: 'Top-tier cardiovascular and metabolic health. Keep pushing.' }
  if (score >= 75) return { label: 'Excellent', color: '#4ade80', desc: 'Well above average across key health markers.' }
  if (score >= 60) return { label: 'Good', color: '#facc15', desc: 'Solid health foundation with room to improve.' }
  if (score >= 45) return { label: 'Average', color: '#fb923c', desc: 'Some metrics need attention. Focus on the weakest areas.' }
  return { label: 'Below Average', color: '#f87171', desc: 'Significant opportunity to improve core health metrics.' }
}

function scoreBar(score: number | null, color: string) {
  if (score === null) return null
  return (
    <div className="w-full bg-surface-secondary rounded-full h-1.5 mt-2">
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  )
}

function fmtWeek(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function LongevityClient({ metrics, summaries, vo2Records, walkingRecords }: LongevityClientProps) {
  const metricScores = computeMetricScores(metrics)
  const vitalityScore = computeVitality(metricScores)
  const hasAny = metricScores.some((m) => m.score !== null)

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🧬</span>
        <h2 className="text-lg font-semibold text-text-primary">No data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync Apple Health data from the iOS app. Vitality Score needs at least one of: VO₂ Max, HRV, resting heart rate, walking speed, steps, or sleep.
        </p>
      </div>
    )
  }

  const zone = vitalityScore !== null ? vitalityZone(vitalityScore) : null

  // Build weekly trend: group summaries by ISO week, compute vitality for each week
  const weeklyMap = new Map<string, { hrv: number[]; rhr: number[]; steps: number[]; sleep: number[] }>()
  for (const s of summaries) {
    const d = new Date(s.date + 'T00:00:00')
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1) - day
    const mon = new Date(d)
    mon.setDate(d.getDate() + diff)
    const wk = mon.toISOString().slice(0, 10)
    if (!weeklyMap.has(wk)) weeklyMap.set(wk, { hrv: [], rhr: [], steps: [], sleep: [] })
    const b = weeklyMap.get(wk)!
    if (s.avg_hrv && s.avg_hrv > 0) b.hrv.push(s.avg_hrv)
    if (s.resting_heart_rate && s.resting_heart_rate > 0) b.rhr.push(s.resting_heart_rate)
    if (s.steps && s.steps > 0) b.steps.push(s.steps)
    if (s.sleep_duration_minutes && s.sleep_duration_minutes > 0) b.sleep.push(s.sleep_duration_minutes)
  }

  // Index VO2 and walking by week
  function weekKey(iso: string) {
    const d = new Date(iso)
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1) - day
    const mon = new Date(d)
    mon.setDate(d.getDate() + diff)
    return mon.toISOString().slice(0, 10)
  }
  const vo2ByWeek = new Map<string, number[]>()
  for (const r of vo2Records) {
    const wk = weekKey(r.start_time)
    vo2ByWeek.set(wk, [...(vo2ByWeek.get(wk) ?? []), r.value])
  }
  const walkByWeek = new Map<string, number[]>()
  for (const r of walkingRecords) {
    const wk = weekKey(r.start_time)
    walkByWeek.set(wk, [...(walkByWeek.get(wk) ?? []), r.value])
  }

  function meanArr(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null }

  const trendData = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([wk, b]) => {
      const weekMetrics: Metrics = {
        hrv: meanArr(b.hrv),
        rhr: meanArr(b.rhr),
        dailySteps: meanArr(b.steps),
        sleepMinutes: meanArr(b.sleep),
        vo2Max: meanArr(vo2ByWeek.get(wk) ?? []),
        walkingSpeed: meanArr(walkByWeek.get(wk) ?? []),
      }
      const wScores = computeMetricScores(weekMetrics)
      const score = computeVitality(wScores)
      return { week: fmtWeek(wk), score }
    })
    .filter((d) => d.score !== null)

  const sorted = [...metricScores].filter((m) => m.score !== null).sort((a, b) => b.score! - a.score!)
  const strengths = sorted.slice(0, 2)
  const improvements = [...sorted].reverse().slice(0, 2)

  return (
    <div className="space-y-6">
      {/* Main score */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <div className="flex items-center gap-6">
          {/* Radial indicator */}
          <div className="relative shrink-0">
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={50} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
              {vitalityScore !== null && (
                <circle
                  cx={60} cy={60} r={50}
                  fill="none"
                  stroke={zone?.color ?? '#888'}
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - vitalityScore / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              )}
              <text x={60} y={56} textAnchor="middle" fontSize={28} fontWeight="bold" fill={zone?.color ?? '#888'}>
                {vitalityScore ?? '—'}
              </text>
              <text x={60} y={74} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.45)">
                / 100
              </text>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {zone && (
              <>
                <p className="text-2xl font-bold" style={{ color: zone.color }}>{zone.label}</p>
                <p className="text-sm text-text-secondary mt-1 leading-snug">{zone.desc}</p>
              </>
            )}
            <p className="text-xs text-text-secondary opacity-50 mt-3">
              Based on {metricScores.filter((m) => m.score !== null).length} of 6 metrics · 30-day average
            </p>
          </div>
        </div>
      </div>

      {/* Metric breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metricScores.map((m) => (
          <div key={m.key} className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text-secondary">{m.label}</span>
              {m.score !== null ? (
                <span className="text-xs font-bold" style={{ color: m.color }}>{Math.round(m.score)}</span>
              ) : (
                <span className="text-xs text-text-secondary opacity-40">—</span>
              )}
            </div>
            {m.value !== null ? (
              <p className="text-xl font-bold text-text-primary">{m.format(m.value)}</p>
            ) : (
              <p className="text-xl font-bold text-text-secondary opacity-30">No data</p>
            )}
            <p className="text-xs text-text-secondary opacity-50 mt-0.5">{m.unit} · {m.refText}</p>
            {scoreBar(m.score, m.color)}
          </div>
        ))}
      </div>

      {/* Strengths / improvements */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-green-400 mb-2">Top Strengths</p>
            <ul className="space-y-1">
              {strengths.map((m) => (
                <li key={m.key} className="text-xs text-text-secondary flex justify-between">
                  <span>{m.label}</span>
                  <span className="font-medium text-green-400">{Math.round(m.score!)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-orange-400 mb-2">To Improve</p>
            <ul className="space-y-1">
              {improvements.map((m) => (
                <li key={m.key} className="text-xs text-text-secondary flex justify-between">
                  <span>{m.label}</span>
                  <span className="font-medium text-orange-400">{Math.round(m.score!)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Trend chart */}
      {trendData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Vitality Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={28}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [Math.round(v), 'Vitality']} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ r: 3, fill: '#a78bfa' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">How Vitality Score is calculated</p>
        <div className="space-y-2">
          {[
            { name: 'VO₂ Max (30%)', detail: 'The strongest single predictor of cardiovascular longevity. Elite athletes score ≥50 mL/kg/min.' },
            { name: 'HRV (22%)', detail: 'Heart rate variability reflects autonomic nervous system health. Higher is better — it indicates the body handles stress well.' },
            { name: 'Resting HR (20%)', detail: 'A lower resting heart rate indicates greater cardiovascular efficiency. Athletic hearts beat fewer times per minute.' },
            { name: 'Walking Speed (13%)', detail: 'One of the most cited longevity predictors — walking speed above 1.3 m/s correlates with better outcomes in research.' },
            { name: 'Daily Steps (10%)', detail: 'Total daily movement is independently associated with reduced all-cause mortality.' },
            { name: 'Sleep (5%)', detail: '7–9 hours of quality sleep per night supports recovery, hormones, and metabolic health.' },
          ].map(({ name, detail }) => (
            <div key={name}>
              <p className="font-medium text-text-primary">{name}</p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1">Scores use piecewise interpolation against published population reference ranges. This is for informational purposes — not medical advice.</p>
      </div>
    </div>
  )
}
