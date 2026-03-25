'use client'

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
} from 'recharts'
import type { SleepScoreNight } from './page'

interface Props {
  nights: SleepScoreNight[]
}

const GRADE_COLORS: Record<string, string> = {
  Excellent: '#22c55e',
  Good:      '#60a5fa',
  Fair:      '#fb923c',
  Poor:      '#f87171',
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtHours(h: number) {
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  return min > 0 ? `${hrs}h ${min}m` : `${hrs}h`
}

function gradeColor(grade: string) {
  return GRADE_COLORS[grade] ?? '#6b7280'
}

export function SleepScoreClient({ nights }: Props) {
  if (nights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">⭐</span>
        <h2 className="text-lg font-semibold text-text-primary">No sleep data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your sleep data from Apple Health to see nightly quality scores.
        </p>
      </div>
    )
  }

  // Statistics
  const avgScore = Math.round(nights.reduce((s, n) => s + n.totalScore, 0) / nights.length)
  const latest = nights[nights.length - 1]
  const best = nights.reduce((b, n) => n.totalScore > b.totalScore ? n : b)
  const gradeCounts = nights.reduce((acc, n) => {
    acc[n.grade] = (acc[n.grade] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const excellentNights = gradeCounts['Excellent'] ?? 0
  const poorNights = gradeCounts['Poor'] ?? 0

  // Chart data — last 30 nights
  const chartData = nights.slice(-30).map((n) => ({
    date: fmtDate(n.date),
    score: n.totalScore,
    grade: n.grade,
    hours: n.sleepHours,
  }))

  // Component breakdown averages
  const avgDuration = Math.round(nights.reduce((s, n) => s + n.durationScore, 0) / nights.length)
  const avgStages   = Math.round(nights.reduce((s, n) => s + n.stagesScore, 0) / nights.length)
  const avgEff      = Math.round(nights.reduce((s, n) => s + n.efficiencyScore, 0) / nights.length)

  // Day-of-week averages
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowScores = DOW.map((day, i) => {
    const dayNights = nights.filter((n) => new Date(n.date + 'T12:00:00').getDay() === i)
    const avg = dayNights.length > 0
      ? Math.round(dayNights.reduce((s, n) => s + n.totalScore, 0) / dayNights.length)
      : null
    return { day, avg, count: dayNights.length }
  })
  const maxDow = Math.max(...dowScores.map((d) => d.avg ?? 0))

  // Score vs next-day HRV scatter
  const hvScatter = nights.filter((n) => n.nextDayHrv !== null).map((n) => ({
    score: n.totalScore,
    hrv: n.nextDayHrv!,
    date: fmtDate(n.date),
  }))

  return (
    <div className="space-y-6">
      {/* Tonight's score */}
      <div className="bg-surface rounded-xl border border-border p-5 text-center">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Most Recent Night
        </p>
        <div className="relative inline-flex items-center justify-center mb-3">
          <div
            className="text-6xl font-black leading-none"
            style={{ color: gradeColor(latest.grade) }}
          >
            {latest.totalScore}
          </div>
          <span className="ml-1 text-xl text-text-secondary font-light self-end mb-1">/100</span>
        </div>
        <p
          className="text-lg font-semibold mb-1"
          style={{ color: gradeColor(latest.grade) }}
        >
          {latest.grade}
        </p>
        <p className="text-sm text-text-secondary">
          {fmtDate(latest.date)} · {fmtHours(latest.sleepHours)} sleep
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          {[
            { label: 'Duration', score: latest.durationScore },
            { label: 'Stages',   score: latest.stagesScore },
            { label: 'Efficiency', score: latest.efficiencyScore },
          ].map(({ label, score }) => (
            <div key={label}>
              <p className="text-xl font-bold text-text-primary">{score}</p>
              <p className="text-xs text-text-secondary">{label}</p>
              <div className="mt-1 h-1 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, background: gradeColor(latest.grade) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Avg Score',    value: String(avgScore), sub: `${nights.length} nights`, color: gradeColor(avgScore >= 80 ? 'Excellent' : avgScore >= 65 ? 'Good' : avgScore >= 50 ? 'Fair' : 'Poor') },
          { label: 'Best Night',   value: String(best.totalScore), sub: fmtDate(best.date), color: '#22c55e' },
          { label: 'Excellent',    value: String(excellentNights), sub: 'nights ≥ 80', color: '#22c55e' },
          { label: 'Poor',         value: String(poorNights), sub: 'nights < 50', color: '#f87171' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold leading-tight" style={{ color }}>{value}</p>
            <p className="text-xs font-medium text-text-secondary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Score Trend */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-1">Quality Score — Last 30 Nights</h2>
        <p className="text-xs text-text-secondary mb-3 opacity-70">Green = Excellent, Blue = Good, Orange = Fair, Red = Poor</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v}`, 'Score']}
            />
            <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={65} stroke="#60a5fa" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={50} stroke="#fb923c" strokeDasharray="3 3" strokeOpacity={0.3} />
            <Bar dataKey="score" radius={[3, 3, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={gradeColor(d.grade)} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Component Averages */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Component Breakdown</h2>
        <div className="space-y-3">
          {[
            { label: 'Duration', avg: avgDuration, desc: 'Scored against 7–9h optimal range', weight: '40%' },
            { label: 'Sleep Stages', avg: avgStages, desc: '≥15% deep, ≥20% REM target', weight: '30%' },
            { label: 'Efficiency', avg: avgEff, desc: '% of time in bed actually asleep', weight: '30%' },
          ].map(({ label, avg, desc, weight }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium text-text-primary">{label}</span>
                  <span className="ml-2 text-xs text-text-secondary opacity-60">{weight} weight</span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: gradeColor(avg >= 80 ? 'Excellent' : avg >= 65 ? 'Good' : avg >= 50 ? 'Fair' : 'Poor') }}
                >
                  {avg}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${avg}%`,
                    background: gradeColor(avg >= 80 ? 'Excellent' : avg >= 65 ? 'Good' : avg >= 50 ? 'Fair' : 'Poor'),
                  }}
                />
              </div>
              <p className="text-xs text-text-secondary opacity-60 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Day-of-week */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Average Score by Day of Week</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart
            data={dowScores}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => { const n = typeof v === 'number' ? v : null; return n ? [`${Math.round(n)}`, 'Avg Score'] : ['—', 'Avg Score']; }} />
            <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
              {dowScores.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.avg === maxDow ? '#22c55e' : d.avg && d.avg >= 65 ? '#60a5fa' : '#6366f1'}
                  opacity={d.count > 0 ? 0.85 : 0.2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-text-secondary text-center mt-2 opacity-60">
          Green = your best sleep day
        </p>
      </div>

      {/* Score vs HRV scatter */}
      {hvScatter.length >= 7 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Sleep Score → Next-Day HRV</h2>
          <p className="text-xs text-text-secondary mb-3 opacity-70">
            Does a higher sleep quality score predict better HRV recovery?
          </p>
          <ResponsiveContainer width="100%" height={150}>
            <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                dataKey="score"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                label={{ value: 'Sleep Score', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#888' }}
              />
              <YAxis
                type="number"
                dataKey="hrv"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  name === 'score' ? `${v}` : `${v} ms`,
                  name === 'score' ? 'Score' : 'HRV',
                ]}
              />
              <Scatter data={hvScatter} fill="#818cf8" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grade Guide */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Score Guide</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { grade: 'Excellent', range: '80–100', desc: 'Optimal recovery', tip: 'Hard training day is ideal' },
            { grade: 'Good',      range: '65–79',  desc: 'Solid sleep',     tip: 'Moderate training OK' },
            { grade: 'Fair',      range: '50–64',  desc: 'Some deficits',   tip: 'Stick to easy effort' },
            { grade: 'Poor',      range: '0–49',   desc: 'Poor recovery',   tip: 'Prioritize rest today' },
          ].map(({ grade, range, desc, tip }) => (
            <div key={grade} className="p-3 rounded-lg bg-surface-secondary">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: gradeColor(grade) }} />
                <span className="text-sm font-semibold" style={{ color: gradeColor(grade) }}>{grade}</span>
                <span className="text-xs text-text-secondary ml-auto">{range}</span>
              </div>
              <p className="text-xs text-text-secondary">{desc}</p>
              <p className="text-xs text-text-secondary opacity-60 mt-0.5">→ {tip}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary opacity-60 pt-1">
          Score = 40% duration + 30% sleep stages + 30% efficiency. Stages score is neutral when data is unavailable.
        </p>
      </div>
    </div>
  )
}
