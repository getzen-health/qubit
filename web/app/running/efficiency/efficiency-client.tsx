'use client'

import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

interface EfficiencyPoint {
  date: string
  distanceKm: number
  durationMinutes: number
  paceSecsPerKm: number
  avgHr: number
  aei: number
  category: 'short' | 'medium' | 'long'
}

interface Props {
  points: EfficiencyPoint[]
  trendSlope: number | null
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const CATEGORY_COLORS: Record<string, string> = {
  short: '#60a5fa',
  medium: '#4ade80',
  long: '#f97316',
}

function fmtPace(secsPerKm: number): string {
  const min = Math.floor(secsPerKm / 60)
  const sec = Math.round(secsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// 7-run rolling average of AEI
function rollingAvg(points: EfficiencyPoint[], window = 7): Array<{ date: string; aei: number }> {
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1)
    const avg = slice.reduce((s, x) => s + x.aei, 0) / slice.length
    return { date: p.date, aei: Math.round(avg * 100) / 100 }
  })
}

export function EfficiencyClient({ points, trendSlope }: Props) {
  if (points.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏃</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Log at least 3 runs with both pace and heart rate to see your efficiency trends.
          Wear your Apple Watch for all runs.
        </p>
      </div>
    )
  }

  const latest = points[points.length - 1]
  const first7 = points.slice(0, Math.min(7, points.length))
  const last7 = points.slice(-7)
  const baselineAei = first7.reduce((s, p) => s + p.aei, 0) / first7.length
  const recentAei = last7.reduce((s, p) => s + p.aei, 0) / last7.length
  const change = recentAei - baselineAei
  const changePct = baselineAei > 0 ? (change / baselineAei) * 100 : 0

  const avgAei = points.reduce((s, p) => s + p.aei, 0) / points.length
  const avgHr = points.reduce((s, p) => s + p.avgHr, 0) / points.length
  const avgPace = points.reduce((s, p) => s + p.paceSecsPerKm, 0) / points.length

  const isImproving = trendSlope !== null && trendSlope > 0.002
  const isDeclining = trendSlope !== null && trendSlope < -0.002

  const rolling = rollingAvg(points)

  // AEI vs HR scatter data
  const scatterData = points.map((p) => ({ hr: p.avgHr, aei: p.aei, category: p.category }))

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Latest AEI',
            value: latest.aei.toFixed(2),
            sub: 'aerobic efficiency',
            color: 'text-emerald-400',
          },
          {
            label: '90-Day Change',
            value: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`,
            sub: `vs early ${points.length > 7 ? 'runs' : 'baseline'}`,
            color: changePct >= 0 ? 'text-green-400' : 'text-red-400',
          },
          {
            label: 'Avg Heart Rate',
            value: `${Math.round(avgHr)} bpm`,
            sub: 'during runs',
            color: 'text-red-400',
          },
          {
            label: 'Avg Pace',
            value: fmtPace(avgPace),
            sub: 'all runs',
            color: 'text-blue-400',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Trend banner */}
      <div className={`rounded-xl p-4 border ${
        isImproving ? 'bg-green-500/5 border-green-500/20' :
        isDeclining ? 'bg-red-500/5 border-red-500/20' :
        'bg-surface border-border'
      }`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{isImproving ? '📈' : isDeclining ? '📉' : '➡️'}</span>
          <div>
            <p className={`text-sm font-semibold ${
              isImproving ? 'text-green-400' : isDeclining ? 'text-red-400' : 'text-text-secondary'
            }`}>
              {isImproving
                ? 'Aerobic efficiency is improving'
                : isDeclining
                ? 'Efficiency declining — check recovery and training volume'
                : 'Efficiency is stable'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {isImproving
                ? 'You are running faster at the same heart rate. Your aerobic base is building.'
                : isDeclining
                ? 'HR is rising faster than pace improvement. Consider more easy-zone running.'
                : 'AEI is consistent. Continue current training to build the trend.'}
            </p>
          </div>
        </div>
      </div>

      {/* AEI Trend Chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">
          Aerobic Efficiency Index (7-run rolling avg)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rolling} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
              tickFormatter={fmtDate}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v.toFixed(2), 'AEI']}
              labelFormatter={fmtDate}
            />
            <ReferenceLine y={avgAei} stroke="#6366f1" strokeDasharray="4 4" />
            <Line
              dataKey="aei"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-text-secondary opacity-50 mt-2 text-center">
          Dashed line = 90-day average ({avgAei.toFixed(2)})
        </p>
      </div>

      {/* AEI vs HR scatter */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-1">HR vs Efficiency</h2>
        <p className="text-xs text-text-secondary mb-3">
          Lower HR at high efficiency = better aerobic fitness
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="hr"
              name="Heart Rate"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              label={{ value: 'Avg HR (bpm)', position: 'insideBottom', offset: -4, fontSize: 10, fill: '#888' }}
            />
            <YAxis
              dataKey="aei"
              name="AEI"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(v: number, name: string) => [
                name === 'aei' ? v.toFixed(2) : `${v} bpm`,
                name === 'aei' ? 'Efficiency' : 'Avg HR',
              ]}
            />
            <Scatter data={scatterData} isAnimationActive={false}>
              {scatterData.map((d, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[d.category]} fillOpacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary justify-center">
          {[
            { label: 'Short (<5 km)', color: '#60a5fa' },
            { label: 'Medium (5–12 km)', color: '#4ade80' },
            { label: 'Long (>12 km)', color: '#f97316' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Run list summary */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Runs</h2>
        <div className="space-y-0 text-xs">
          {points.slice(-10).reverse().map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-2 py-2 border-b border-border last:border-0 items-center"
            >
              <span className="text-text-secondary">{fmtDate(p.date)}</span>
              <span className="text-text-primary">{p.distanceKm.toFixed(1)} km</span>
              <span className="text-text-secondary">{fmtPace(p.paceSecsPerKm)}</span>
              <span className={`font-medium ${
                p.aei > avgAei * 1.03 ? 'text-green-400' :
                p.aei < avgAei * 0.97 ? 'text-red-400' : 'text-text-primary'
              }`}>
                AEI {p.aei.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">What is AEI?</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p>
            The <span className="text-emerald-400 font-medium">Aerobic Efficiency Index</span> measures
            how much speed you generate per heartbeat:{' '}
            <span className="text-text-primary font-mono">AEI = speed (m/min) ÷ heart rate × 100</span>
          </p>
          <p>
            As aerobic fitness improves, your heart pumps more oxygen per beat — so you run faster
            at the same HR, or the same pace at a lower HR. Both increase AEI.
          </p>
          <p>
            <span className="text-orange-400 font-medium">For best results:</span> compare runs of similar
            distance and conditions. AEI can temporarily drop after hard training — look at the rolling
            trend, not individual points.
          </p>
          <p className="opacity-60">
            AEI requires both pace and heart rate data. Run with Apple Watch active for all runs.
          </p>
        </div>
      </div>
    </div>
  )
}
