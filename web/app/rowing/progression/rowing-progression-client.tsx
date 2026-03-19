'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export interface RowingProgressionData {
  totalSessions: number
  totalMeters: number
  avgMeters: number
  avgPerWeek: number
  avgSplit500Str: string
  bestSplit500Str: string
  avgSplit500Secs: number
  bestSplit500Secs: number
  splitTrend: number         // negative = improving (faster split)
  firstAvgSplit: number      // secs per 500m
  lastAvgSplit: number
  firstAvgSplitStr: string
  lastAvgSplitStr: string
  firstAvgDist: number       // meters
  lastAvgDist: number
  trendPoints: { date: string; distanceM: number; split500Secs: number; trend: number }[]
  months: {
    month: string; label: string; sessions: number; totalM: number
    avgSplit500Secs: number; bestSplit500Secs: number
  }[]
}

function secsToStr(secs: number): string {
  const s = Math.round(secs)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function RowingProgressionClient({ data }: { data: RowingProgressionData }) {
  const {
    totalSessions, totalMeters, avgMeters, avgPerWeek,
    avgSplit500Str, bestSplit500Str, splitTrend,
    firstAvgSplit, lastAvgSplit, firstAvgSplitStr, lastAvgSplitStr, firstAvgDist, lastAvgDist,
    trendPoints, months,
  } = data

  const improving = splitTrend < -1
  const worsening = splitTrend > 1
  const trendColor = improving ? 'text-emerald-400' : worsening ? 'text-red-400' : 'text-text-secondary'
  const trendSign = splitTrend > 0 ? '+' : ''

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Sessions (1yr)</p>
          <p className="text-2xl font-bold text-pink-500">{totalSessions}</p>
          <p className="text-xs text-text-secondary mt-1">{avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Total Distance</p>
          <p className="text-2xl font-bold text-rose-400">{(totalMeters / 1000).toFixed(1)} km</p>
          <p className="text-xs text-text-secondary mt-1">{avgMeters} m avg/session</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Avg 500m Split</p>
          <p className="text-2xl font-bold text-fuchsia-400">{avgSplit500Str || '—'}</p>
          <p className="text-xs text-text-secondary mt-1">Best: {bestSplit500Str || '—'}</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Split Trend</p>
          <p className={`text-2xl font-bold ${trendColor}`}>{trendSign}{Math.abs(splitTrend).toFixed(0)}s</p>
          <p className="text-xs text-text-secondary mt-1">
            {improving ? 'Getting faster ↑' : worsening ? 'Getting slower ↓' : 'Stable split'}
          </p>
        </div>
      </div>

      {/* First vs last 30 days */}
      {firstAvgSplit > 0 && lastAvgSplit > 0 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-3">First vs. Last 30 Days</h2>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-text-secondary mb-1">First 30 days</p>
              <p className="text-lg font-bold text-text-primary">{firstAvgSplitStr}</p>
              <p className="text-xs text-text-secondary">{firstAvgDist} m avg</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Last 30 days</p>
              <p className="text-lg font-bold text-text-primary">{lastAvgSplitStr}</p>
              <p className="text-xs text-text-secondary">{lastAvgDist} m avg</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary pt-2 border-t border-border">
            {lastAvgSplit < firstAvgSplit - 1
              ? `${(firstAvgSplit - lastAvgSplit).toFixed(0)}s/500m faster — consistent aerobic gains.`
              : lastAvgSplit > firstAvgSplit + 1
              ? `${(lastAvgSplit - firstAvgSplit).toFixed(0)}s/500m slower — review technique and recovery.`
              : '500m split is consistent year-over-year.'}
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
              <Bar dataKey="totalM" fill="#ec4899" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Split trend (reversed Y: lower = faster = better at top) */}
      {trendPoints.length >= 4 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">500m Split Trend</h2>
          <p className="text-xs text-text-secondary mb-1">Each session · reversed axis: faster = higher</p>
          <p className="text-xs text-text-secondary mb-4">Dashed = trend line</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendPoints} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v.slice(5)} interval={Math.max(0, Math.floor(trendPoints.length / 6))} />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                reversed tickFormatter={(v) => secsToStr(v)} domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [secsToStr(v), name === 'trend' ? 'Trend' : '500m Split']}
              />
              <Line type="monotone" dataKey="split500Secs" stroke="#ec4899" dot={{ r: 2 }} strokeWidth={1.5} opacity={0.6} name="Split" />
              <Line type="monotone" dataKey="trend" stroke="#fbbf24" dot={false} strokeWidth={2} strokeDasharray="6 3" name="Trend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly avg split */}
      {months.filter((m) => m.avgSplit500Secs > 0).length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Avg 500m Split</h2>
          <p className="text-xs text-text-secondary mb-4">Reversed axis: faster = higher</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={months.filter((m) => m.avgSplit500Secs > 0)} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                reversed tickFormatter={(v) => secsToStr(v)} domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [secsToStr(v), 'Avg 500m Split']}
              />
              <Line type="monotone" dataKey="avgSplit500Secs" stroke="#d946ef" dot={{ r: 3 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-surface-primary rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-semibold text-pink-400 mb-3">Rowing Training Principles</h2>
        <div className="space-y-3 text-xs text-text-secondary">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500/60 mt-1.5 shrink-0" />
            <div><span className="text-pink-400 font-medium">Progression:</span> Aim to improve 500m split by 1–2 sec/month with consistent training.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500/60 mt-1.5 shrink-0" />
            <div><span className="text-fuchsia-400 font-medium">Technique:</span> Drive sequence — legs (60%) → back swing (20%) → arm pull (20%). Ratio is key.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 mt-1.5 shrink-0" />
            <div><span className="text-purple-400 font-medium">Intensity:</span> 80% steady-state (18–22 spm) + 20% interval work (5×2min hard, 2min easy).</div>
          </div>
        </div>
      </div>
    </div>
  )
}
