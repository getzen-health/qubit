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
  ScatterChart,
  Scatter,
} from 'recharts'

interface Run {
  date: string
  distanceKm: number
  durationMins: number
  paceSecsPerKm: number
  avgHr: number | null
}

interface TrendPoint {
  date: string
  trend: number
}

interface MonthEntry {
  month: string
  distKm: number
  sessions: number
  avgPaceSecs: number
}

interface QuarterEntry {
  quarter: string
  distKm: number
  sessions: number
  avgPaceSecs: number
}

export interface ProgressionData {
  runs: Run[]
  trendPoints: TrendPoint[]
  months: MonthEntry[]
  quarters: QuarterEntry[]
  totalDistKm: number
  totalSessions: number
  longestRunKm: number
  bestPaceSecs: number | null
  bestPaceDate: string | null
  bestLongRunKm: number | null
  avgPaceFirstSecs: number | null
  avgPaceLastSecs: number | null
  totalImprovementSecs: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 8,
  color: 'var(--color-text-primary, #fff)',
  fontSize: 12,
}

function fmtPace(secs: number): string {
  if (!secs || secs <= 0) return '—'
  const min = Math.floor(secs / 60)
  const sec = Math.round(secs % 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

function fmtDist(km: number): string {
  return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`
}

function shortMonth(yyyyMM: string): string {
  const d = new Date(yyyyMM + '-15')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProgressionClient({ data }: { data: ProgressionData }) {
  const {
    runs, trendPoints, months, quarters,
    totalDistKm, totalSessions, longestRunKm,
    bestPaceSecs, bestPaceDate, bestLongRunKm,
    avgPaceFirstSecs, avgPaceLastSecs, totalImprovementSecs,
  } = data

  if (totalSessions < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-5xl">🏃</span>
        <h2 className="text-lg font-semibold text-text-primary">Not Enough Running Data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Log at least 3 running workouts to see your pace progression and monthly volume analysis.
        </p>
      </div>
    )
  }

  const improving = totalImprovementSecs > 0  // positive = faster pace
  const pctImprovement = avgPaceFirstSecs && avgPaceLastSecs && avgPaceFirstSecs > 0
    ? Math.round(((avgPaceFirstSecs - avgPaceLastSecs) / avgPaceFirstSecs) * 100)
    : null

  // Pace chart data: each run as a point + trend line
  const paceChartData = runs.map((r, i) => ({
    date: shortDate(r.date),
    pace: +(r.paceSecsPerKm / 60).toFixed(3),
    trend: trendPoints[i] ? +(trendPoints[i].trend / 60).toFixed(3) : undefined,
    dist: r.distanceKm,
  }))

  // Min/max for Y-axis (in minutes)
  const paceVals = paceChartData.map((p) => p.pace)
  const paceMin = Math.floor(Math.min(...paceVals) * 2) / 2
  const paceMax = Math.ceil(Math.max(...paceVals) * 2) / 2

  return (
    <div className="space-y-4">

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary opacity-70 mb-1">Total Distance</p>
          <p className="text-2xl font-bold text-orange-400">{fmtDist(totalDistKm)}</p>
          <p className="text-xs text-text-secondary mt-0.5">last 12 months</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary opacity-70 mb-1">Runs</p>
          <p className="text-2xl font-bold text-text-primary">{totalSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">logged sessions</p>
        </div>
        {pctImprovement !== null && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Pace Change</p>
            <p className={`text-2xl font-bold ${improving ? 'text-green-400' : 'text-orange-400'}`}>
              {pctImprovement > 0 ? '+' : ''}{pctImprovement}%
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{improving ? 'faster' : 'slower'}</p>
          </div>
        )}
        {longestRunKm > 0 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Longest Run</p>
            <p className="text-2xl font-bold text-text-primary">{fmtDist(longestRunKm)}</p>
            <p className="text-xs text-text-secondary mt-0.5">this year</p>
          </div>
        )}
      </div>

      {/* Best stats */}
      {(bestPaceSecs || bestLongRunKm) && (
        <div className="grid grid-cols-2 gap-3">
          {bestPaceSecs && (
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-text-secondary opacity-70 mb-1">Best Pace</p>
              <p className="text-xl font-bold text-green-400">{fmtPace(bestPaceSecs)}</p>
              {bestPaceDate && (
                <p className="text-xs text-text-secondary mt-0.5">{shortDate(bestPaceDate)}</p>
              )}
            </div>
          )}
          {bestLongRunKm && (
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-text-secondary opacity-70 mb-1">Best Long Run</p>
              <p className="text-xl font-bold text-blue-400">{fmtDist(bestLongRunKm)}</p>
              <p className="text-xs text-text-secondary mt-0.5">single session</p>
            </div>
          )}
        </div>
      )}

      {/* Pace trend chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Pace Progression</p>
        <p className="text-xs text-text-secondary opacity-70 mb-4">
          Each dot = one run. Trend line shows overall direction (lower = faster).
          {improving
            ? ` You are running ${fmtPace(Math.abs(totalImprovementSecs))} faster per km overall.`
            : totalImprovementSecs < 0
              ? ` Pace has slowed slightly — consider recovery or base-building.`
              : ''}
        </p>

        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              type="category"
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
              axisLine={false} tickLine={false}
              interval={Math.max(0, Math.floor(paceChartData.length / 6))}
            />
            <YAxis
              dataKey="pace"
              type="number"
              domain={[paceMin, paceMax]}
              reversed  // lower pace = faster = top of chart
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
              axisLine={false} tickLine={false}
              tickFormatter={(v: number) => fmtPace(Math.round(v * 60))}
              width={48}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                name === 'pace' ? fmtPace(Math.round(v * 60)) : `${v.toFixed(1)} km`,
                name === 'pace' ? 'Pace' : 'Distance',
              ]}
            />
            {/* Actual run dots */}
            <Scatter data={paceChartData} dataKey="pace" fill="rgba(249,115,22,0.65)" r={4} />
            {/* Trend line */}
            {trendPoints.length >= 2 && (
              <Scatter
                data={paceChartData.filter((p) => p.trend !== undefined)}
                dataKey="trend"
                line={{ stroke: 'rgba(249,115,22,0.4)', strokeWidth: 2, strokeDasharray: '4 2' }}
                shape={() => null as unknown as React.ReactElement}
                fill="transparent"
                r={0}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>

        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Run
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 border-t-2 border-dashed border-orange-400/40 inline-block" /> Trend
          </span>
        </div>
      </div>

      {/* Monthly volume */}
      {months.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Volume</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">Distance run per month</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={months} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={shortMonth}
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false} tickLine={false}
                interval={Math.max(0, Math.floor(months.length / 6))}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `${v}km`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(1)} km`, 'Distance']}
                labelFormatter={shortMonth}
              />
              <Bar dataKey="distKm" fill="rgba(249,115,22,0.65)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quarterly comparison */}
      {quarters.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Quarterly Breakdown</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">Training volume and average pace by quarter</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quarters.map((q) => (
              <div key={q.quarter} className="rounded-lg bg-surface-secondary border border-border/50 p-3 text-center">
                <p className="text-xs text-text-secondary mb-1">{q.quarter}</p>
                <p className="text-lg font-bold text-orange-400">{fmtDist(q.distKm)}</p>
                <p className="text-xs text-text-secondary">{q.sessions} runs</p>
                {q.avgPaceSecs > 0 && (
                  <p className="text-xs text-text-secondary opacity-70 mt-0.5">{fmtPace(q.avgPaceSecs)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* First vs last comparison */}
      {avgPaceFirstSecs && avgPaceLastSecs && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Pace Comparison</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            First runs in this window vs. most recent runs
          </p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-surface-secondary border border-border/50 p-3">
              <p className="text-xs text-text-secondary mb-1">Early period</p>
              <p className="text-xl font-bold text-text-primary">{fmtPace(avgPaceFirstSecs)}</p>
              <p className="text-xs text-text-secondary opacity-70">avg pace</p>
            </div>
            <div className={`rounded-lg border p-3 ${improving ? 'bg-green-500/10 border-green-500/20' : 'bg-surface-secondary border-border/50'}`}>
              <p className="text-xs text-text-secondary mb-1">Recent period</p>
              <p className={`text-xl font-bold ${improving ? 'text-green-400' : 'text-text-primary'}`}>
                {fmtPace(avgPaceLastSecs)}
              </p>
              <p className="text-xs text-text-secondary opacity-70">avg pace</p>
            </div>
          </div>
          {pctImprovement !== null && (
            <p className={`text-sm text-center mt-3 font-medium ${improving ? 'text-green-400' : 'text-orange-400'}`}>
              {improving
                ? `Running ${Math.abs(pctImprovement)}% faster than when you started this period`
                : `Pace is ${Math.abs(pctImprovement)}% slower — consider easier training or more recovery`}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        {totalSessions} runs · {fmtDist(totalDistKm)} total · 12-month window
      </p>
    </div>
  )
}
