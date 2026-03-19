'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  LineChart,
  Line,
  Cell,
} from 'recharts'

interface NightData {
  date: string
  tibMinutes: number
  tst: number
  awake: number
  efficiency: number | null
  solEstimate: number
}

interface EfficiencyClientProps {
  nights: NightData[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// Clinical sleep efficiency thresholds
const OPTIMAL_MIN = 85
const OPTIMAL_MAX = 95

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtMin(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function efficiencyColor(pct: number): string {
  if (pct >= OPTIMAL_MIN && pct <= OPTIMAL_MAX) return '#4ade80'
  if (pct >= 80) return '#facc15'
  return '#f87171'
}

function efficiencyLabel(pct: number): { label: string; color: string; desc: string } {
  if (pct >= OPTIMAL_MIN && pct <= OPTIMAL_MAX)
    return { label: 'Optimal', color: 'text-green-400', desc: 'Your sleep is efficient. You spend most of your time in bed actually sleeping.' }
  if (pct > OPTIMAL_MAX)
    return { label: 'High', color: 'text-blue-400', desc: 'Very high efficiency can mean you need more time in bed. Consider an earlier bedtime.' }
  if (pct >= 80)
    return { label: 'Below Target', color: 'text-yellow-400', desc: 'Slightly below optimal. Reducing time in bed before you feel sleepy and rising at a consistent time helps.' }
  if (pct >= 70)
    return { label: 'Low', color: 'text-orange-400', desc: 'Low sleep efficiency. Avoid lying in bed awake — get up if you can\'t sleep within 20 minutes (stimulus control).' }
  return { label: 'Poor', color: 'text-red-400', desc: 'Poor sleep efficiency. This may indicate insomnia, sleep apnea, or spending too much time in bed. Consider speaking with a sleep specialist.' }
}

export function EfficiencyClient({ nights }: EfficiencyClientProps) {
  if (nights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🛏️</span>
        <h2 className="text-lg font-semibold text-text-primary">No sleep data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sleep efficiency is calculated from your recorded bedtime and wake time. Sync Apple Health data to get started.
        </p>
      </div>
    )
  }

  const withEff = nights.filter((n) => n.efficiency !== null)
  const avgEff = withEff.length > 0
    ? withEff.reduce((s, n) => s + n.efficiency!, 0) / withEff.length
    : null
  const avgTIB = Math.round(nights.reduce((s, n) => s + n.tibMinutes, 0) / nights.length)
  const avgTST = Math.round(nights.reduce((s, n) => s + n.tst, 0) / nights.length)
  const avgSOL = Math.round(nights.reduce((s, n) => s + n.solEstimate, 0) / nights.length)

  const effStatus = avgEff !== null ? efficiencyLabel(avgEff) : null

  // Trend data — last 30 nights
  const trendData = nights.slice(-30).map((n) => ({
    date: fmtDate(n.date),
    efficiency: n.efficiency,
  }))

  // Distribution buckets
  const buckets = [
    { label: '<70%', min: 0, max: 70, color: '#f87171' },
    { label: '70–80%', min: 70, max: 80, color: '#fb923c' },
    { label: '80–85%', min: 80, max: 85, color: '#facc15' },
    { label: '85–95%', min: 85, max: 95, color: '#4ade80' },
    { label: '>95%', min: 95, max: 101, color: '#60a5fa' },
  ]
  const distributionData = buckets.map((b) => ({
    label: b.label,
    nights: withEff.filter((n) => n.efficiency! >= b.min && n.efficiency! < b.max).length,
    color: b.color,
  }))

  // Best and worst nights
  const sorted = [...withEff].sort((a, b) => b.efficiency! - a.efficiency!)
  const bestNight = sorted[0]
  const worstNight = sorted[sorted.length - 1]

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Avg Efficiency',
            value: avgEff !== null ? `${avgEff.toFixed(1)}%` : '—',
            color: avgEff !== null ? efficiencyColor(avgEff) : undefined,
            sub: 'Target 85–95%',
          },
          {
            label: 'Time in Bed',
            value: fmtMin(avgTIB),
            color: undefined,
            sub: 'avg per night',
          },
          {
            label: 'Sleep Time',
            value: fmtMin(avgTST),
            color: undefined,
            sub: 'avg per night',
          },
          {
            label: 'Wake Time in Bed',
            value: `~${avgSOL} min`,
            color: avgSOL > 30 ? '#f87171' : avgSOL > 15 ? '#facc15' : '#4ade80',
            sub: 'awake while in bed',
          },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-text-secondary mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color: color ?? 'var(--color-text-primary)' }}>{value}</p>
            <p className="text-xs opacity-50 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Status banner */}
      {effStatus && avgEff !== null && (
        <div className={`rounded-xl border p-4 space-y-1 ${
          avgEff >= OPTIMAL_MIN && avgEff <= OPTIMAL_MAX
            ? 'border-green-500/30 bg-green-500/5'
            : avgEff >= 80
            ? 'border-yellow-500/30 bg-yellow-500/5'
            : 'border-red-500/30 bg-red-500/5'
        }`}>
          <p className={`font-semibold text-sm ${effStatus.color}`}>
            {effStatus.label} — {avgEff.toFixed(1)}% efficiency
          </p>
          <p className="text-xs text-text-secondary opacity-80">{effStatus.desc}</p>
        </div>
      )}

      {/* Trend chart */}
      {trendData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Efficiency Trend (last 30 nights)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[60, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}%`}
                width={32}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Efficiency']} />
              <ReferenceLine y={OPTIMAL_MIN} stroke="rgba(74,222,128,0.4)" strokeDasharray="4 3" label={{ value: '85%', position: 'right', fontSize: 9, fill: 'rgba(74,222,128,0.6)' }} />
              <ReferenceLine y={OPTIMAL_MAX} stroke="rgba(74,222,128,0.4)" strokeDasharray="4 3" label={{ value: '95%', position: 'right', fontSize: 9, fill: 'rgba(74,222,128,0.6)' }} />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#818cf8"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-night bar chart */}
      {withEff.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Night-by-Night Efficiency</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={withEff.slice(-20).map((n) => ({ date: fmtDate(n.date), eff: n.efficiency }))}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis domain={[60, 100]} tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Efficiency']} />
              <ReferenceLine y={OPTIMAL_MIN} stroke="rgba(74,222,128,0.3)" strokeDasharray="3 2" />
              <Bar dataKey="eff" radius={[3, 3, 0, 0]}>
                {withEff.slice(-20).map((n, i) => (
                  <Cell key={i} fill={efficiencyColor(n.efficiency!)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-400 inline-block" /> Optimal (85–95%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-400 inline-block" /> Below target</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Low</span>
          </div>
        </div>
      )}

      {/* Distribution */}
      {withEff.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Efficiency Distribution</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={distributionData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} night${v !== 1 ? 's' : ''}`, '']} />
              <Bar dataKey="nights" radius={[4, 4, 0, 0]}>
                {distributionData.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best / worst nights */}
      {bestNight && worstNight && bestNight.date !== worstNight.date && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { night: bestNight, label: 'Most Efficient', icon: '⭐', border: 'border-green-500/30' },
            { night: worstNight, label: 'Least Efficient', icon: '😴', border: 'border-red-500/30' },
          ].map(({ night, label, icon, border }) => (
            <div key={label} className={`bg-surface rounded-xl border ${border} p-4`}>
              <p className="text-xs font-medium text-text-secondary mb-2">{icon} {label}</p>
              <p className="text-sm font-semibold text-text-primary">{fmtDate(night.date)}</p>
              <div className="mt-2 space-y-0.5 text-xs text-text-secondary">
                <p>Efficiency: <strong style={{ color: efficiencyColor(night.efficiency!) }}>{night.efficiency!.toFixed(1)}%</strong></p>
                <p>In bed: {fmtMin(night.tibMinutes)}</p>
                <p>Asleep: {fmtMin(night.tst)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CBT-I Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">About Sleep Efficiency</p>
        <div className="space-y-2">
          {[
            {
              title: 'What is sleep efficiency?',
              text: 'Sleep efficiency (SE) = Total Sleep Time ÷ Time in Bed × 100%. It measures how much of your time in bed is actually spent sleeping. A score of 85–95% is considered optimal.',
            },
            {
              title: 'Why it matters',
              text: 'Low SE is a hallmark of insomnia. It can mean taking too long to fall asleep (high sleep onset latency), waking frequently during the night, or lying awake before getting up.',
            },
            {
              title: 'Improving efficiency',
              text: 'Cognitive Behavioral Therapy for Insomnia (CBT-I) uses sleep restriction (reducing TIB to match TST) and stimulus control (bed = sleep only) to raise SE. Avoid spending excessive time in bed.',
            },
            {
              title: 'High efficiency (>95%)',
              text: 'Consistently very high SE may indicate you need more sleep. You fall asleep the moment your head hits the pillow because you\'re carrying sleep debt. Try an earlier bedtime.',
            },
          ].map(({ title, text }) => (
            <div key={title}>
              <p className="font-medium text-text-primary">{title}</p>
              <p className="opacity-70 mt-0.5">{text}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1">Calculated from Apple Health sleep start/end times vs actual sleep duration recorded by Apple Watch.</p>
      </div>
    </div>
  )
}
