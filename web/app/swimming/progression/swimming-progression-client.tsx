'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export interface SwimmingProgressionData {
  totalSwims: number
  totalMeters: number
  avgMeters: number
  avgPerWeek: number
  avgPace100Str: string
  bestPace100Str: string
  avgPace100Secs: number
  bestPace100Secs: number
  paceTrend: number          // negative = improving (faster pace)
  firstAvgPace: number       // secs per 100m
  lastAvgPace: number
  firstAvgPaceStr: string
  lastAvgPaceStr: string
  firstAvgDist: number       // meters
  lastAvgDist: number
  trendPoints: { date: string; distanceM: number; pace100Secs: number; trend: number }[]
  months: {
    month: string; label: string; sessions: number; totalM: number
    avgPace100Secs: number; bestPace100Secs: number
  }[]
}

function secsToStr(secs: number): string {
  const s = Math.round(secs)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function SwimmingProgressionClient({ data }: { data: SwimmingProgressionData }) {
  const {
    totalSwims, totalMeters, avgMeters, avgPerWeek,
    avgPace100Str, bestPace100Str, paceTrend,
    firstAvgPace, lastAvgPace, firstAvgPaceStr, lastAvgPaceStr, firstAvgDist, lastAvgDist,
    trendPoints, months,
  } = data

  // Lower pace = faster = improvement; negative trend = getting faster
  const improving = paceTrend < -1
  const worsening = paceTrend > 1
  const trendColor = improving ? 'text-emerald-400' : worsening ? 'text-red-400' : 'text-text-secondary'
  const trendSign = paceTrend > 0 ? '+' : ''

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Swims (1yr)</p>
          <p className="text-2xl font-bold text-cyan-500">{totalSwims}</p>
          <p className="text-xs text-text-secondary mt-1">{avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Total Distance</p>
          <p className="text-2xl font-bold text-teal-400">{(totalMeters / 1000).toFixed(1)} km</p>
          <p className="text-xs text-text-secondary mt-1">{avgMeters} m avg/swim</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Avg Pace/100m</p>
          <p className="text-2xl font-bold text-blue-400">{avgPace100Str || '—'}</p>
          <p className="text-xs text-text-secondary mt-1">Best: {bestPace100Str || '—'}</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Pace Trend</p>
          <p className={`text-2xl font-bold ${trendColor}`}>{trendSign}{Math.abs(paceTrend).toFixed(0)}s</p>
          <p className="text-xs text-text-secondary mt-1">
            {improving ? 'Getting faster ↑' : worsening ? 'Getting slower ↓' : 'Stable pace'}
          </p>
        </div>
      </div>

      {/* First vs last 30 days */}
      {firstAvgPace > 0 && lastAvgPace > 0 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-3">First vs. Last 30 Days</h2>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-text-secondary mb-1">First 30 days</p>
              <p className="text-lg font-bold text-text-primary">{firstAvgPaceStr}</p>
              <p className="text-xs text-text-secondary">{firstAvgDist} m avg/swim</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Last 30 days</p>
              <p className="text-lg font-bold text-text-primary">{lastAvgPaceStr}</p>
              <p className="text-xs text-text-secondary">{lastAvgDist} m avg/swim</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary pt-2 border-t border-border">
            {lastAvgPace < firstAvgPace - 1
              ? `${(firstAvgPace - lastAvgPace).toFixed(0)} sec/100m faster — solid technique gains.`
              : lastAvgPace > firstAvgPace + 1
              ? `${(lastAvgPace - firstAvgPace).toFixed(0)} sec/100m slower — review technique and fatigue.`
              : 'Pace is consistent year-over-year.'}
          </p>
        </div>
      )}

      {/* Monthly distance */}
      {months.length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Distance</h2>
          <p className="text-xs text-text-secondary mb-4">Total meters per month</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={months} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} m`, 'Distance']}
              />
              <Bar dataKey="totalM" fill="#06b6d4" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pace trend (reversed Y: lower = faster = better at top) */}
      {trendPoints.length >= 4 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Pace Trend (per 100m)</h2>
          <p className="text-xs text-text-secondary mb-1">Each swim · reversed axis: faster = higher</p>
          <p className="text-xs text-text-secondary mb-4">Dashed = trend line</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendPoints} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v.slice(5)} interval={Math.max(0, Math.floor(trendPoints.length / 6))} />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                reversed
                tickFormatter={(v) => secsToStr(v)}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [secsToStr(v), name === 'trend' ? 'Trend' : 'Pace/100m']}
              />
              <Line type="monotone" dataKey="pace100Secs" stroke="#06b6d4" dot={{ r: 2 }} strokeWidth={1.5} opacity={0.6} name="Pace" />
              <Line type="monotone" dataKey="trend" stroke="#fbbf24" dot={false} strokeWidth={2} strokeDasharray="6 3" name="Trend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly avg pace */}
      {months.filter((m) => m.avgPace100Secs > 0).length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Avg Pace/100m</h2>
          <p className="text-xs text-text-secondary mb-4">Reversed axis: faster = higher</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={months.filter((m) => m.avgPace100Secs > 0)} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                reversed tickFormatter={(v) => secsToStr(v)} domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [secsToStr(v), 'Avg Pace/100m']}
              />
              <Line type="monotone" dataKey="avgPace100Secs" stroke="#14b8a6" dot={{ r: 3 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-surface-primary rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-semibold text-cyan-400 mb-3">Swimming Training Principles</h2>
        <div className="space-y-3 text-xs text-text-secondary">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 mt-1.5 shrink-0" />
            <div><span className="text-cyan-400 font-medium">Technique:</span> 1–2 sec improvement per 100m per month is realistic with consistent drill work and focused feedback.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500/60 mt-1.5 shrink-0" />
            <div><span className="text-teal-400 font-medium">Volume:</span> Build by adding 10–15% per week. Most recreational swimmers benefit from 3–5 sessions/week.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60 mt-1.5 shrink-0" />
            <div><span className="text-blue-400 font-medium">Intensity:</span> 80% aerobic (Zone 2) + 20% threshold intervals (e.g., 4×100m at race pace with full rest).</div>
          </div>
        </div>
      </div>
    </div>
  )
}
