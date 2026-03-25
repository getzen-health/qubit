'use client'

import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

interface Estimate {
  date: string
  vo2max: number
  source: string | null
}

function acsmCategory(v: number): { label: string; color: string; bg: string } {
  if (v > 62) return { label: 'Superior', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' }
  if (v >= 53) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' }
  if (v >= 44) return { label: 'Good', color: 'text-lime-400', bg: 'bg-lime-400/10 border-lime-400/30' }
  if (v >= 33) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' }
  return { label: 'Poor', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtSource(s: string | null) {
  if (!s) return '—'
  return s.replace(/_/g, ' ')
}

const tooltipStyle = {
  backgroundColor: 'rgba(15,15,20,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  fontSize: 12,
}

const ACSM_BANDS = [
  { label: 'Poor', range: '<33', color: 'text-orange-400' },
  { label: 'Fair', range: '33–43', color: 'text-yellow-400' },
  { label: 'Good', range: '44–52', color: 'text-lime-400' },
  { label: 'Excellent', range: '53–62', color: 'text-green-400' },
  { label: 'Superior', range: '>62', color: 'text-purple-400' },
]

export function VO2maxClient({ estimates }: { estimates: Estimate[] }) {
  if (estimates.length === 0) {
    return (
      <div className="text-center py-16 text-text-secondary">
        <p className="text-lg font-medium mb-2">No VO₂max data yet</p>
        <p className="text-sm opacity-60 mb-6">Log some runs to start tracking your aerobic fitness.</p>
        <Link href="/running" className="text-purple-400 hover:text-purple-300 text-sm">
          ← Running
        </Link>
      </div>
    )
  }

  const current = estimates[estimates.length - 1]
  const cat = acsmCategory(current.vo2max)

  const chartData = estimates.map((e) => ({
    date: fmtDate(e.date),
    vo2max: e.vo2max,
  }))

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)
  const entry30d = [...estimates].reverse().find((e) => e.date <= thirtyDaysAgoStr)
  const delta =
    entry30d !== undefined ? +(current.vo2max - entry30d.vo2max).toFixed(1) : null

  return (
    <div className="space-y-4">
      {/* Current value card */}
      <div className="bg-surface rounded-xl border border-border p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">Current VO₂max</p>
          <p className={`text-5xl font-bold ${cat.color}`}>{current.vo2max}</p>
          <p className="text-xs text-text-secondary mt-1">ml/kg/min</p>
        </div>
        <div className="text-right space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold ${cat.color} ${cat.bg}`}>
            {cat.label}
          </span>
          {delta !== null && (
            <p className={`text-sm font-medium ${delta >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
              {delta >= 0 ? `↑ +${delta}` : `↓ ${delta}`} vs 30d ago
            </p>
          )}
        </div>
      </div>

      {/* ACSM legend */}
      <div className="flex flex-wrap gap-3 px-1 text-xs">
        {ACSM_BANDS.map(({ label, range, color }) => (
          <span key={label} className={`${color} opacity-80`}>
            {label} <span className="opacity-60">{range}</span>
          </span>
        ))}
      </div>

      {/* 90-day trend chart */}
      {chartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-medium text-text-primary">90-Day Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
              <defs>
                <linearGradient id="vo2maxDetailGrad" x1="0" y1="0" x2="0" y2="1">
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
                y={current.vo2max}
                stroke="rgba(192,132,252,0.5)"
                strokeDasharray="4 3"
                label={{
                  value: `${current.vo2max}`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: 'rgba(192,132,252,0.8)',
                }}
              />
              <Area
                type="monotone"
                dataKey="vo2max"
                stroke="#c084fc"
                strokeWidth={2}
                fill="url(#vo2maxDetailGrad)"
                dot={{ r: 3, fill: '#c084fc' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent estimates table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary">Recent Estimates</h3>
        </div>
        <div className="divide-y divide-border">
          {[...estimates].reverse().slice(0, 20).map((e) => {
            const c = acsmCategory(e.vo2max)
            return (
              <div key={e.date} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-text-secondary">{fmtDate(e.date)}</span>
                <span className="text-xs text-text-secondary opacity-50 capitalize">{fmtSource(e.source)}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${c.color} opacity-70`}>{c.label}</span>
                  <span className={`text-sm font-semibold ${c.color}`}>{e.vo2max}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-2">
        <Link href="/running" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Running
        </Link>
      </div>
    </div>
  )
}
