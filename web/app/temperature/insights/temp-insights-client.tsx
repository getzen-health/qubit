'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface TempPoint {
  date: string
  temp: number
  nextDayHrv: number | null
  sleepHours: number | null
  rhr: number | null
  category: 'elevated' | 'normal' | 'low'
}

interface Props {
  points: TempPoint[]
  hrv: { elevated: number | null; normal: number | null; low: number | null }
  maxConsecElevated: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function tempColor(category: string): string {
  return category === 'elevated' ? '#f97316' : category === 'low' ? '#60a5fa' : '#6b7280'
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TempInsightsClient({ points, hrv, maxConsecElevated }: Props) {
  if (points.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🌡️</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Requires Apple Watch Series 8 or Ultra with at least 5 nights of wrist temperature data.
        </p>
      </div>
    )
  }

  const elevatedCount = points.filter(p => p.category === 'elevated').length
  const normalCount = points.filter(p => p.category === 'normal').length
  const lowCount = points.filter(p => p.category === 'low').length
  const elevatedPct = Math.round((elevatedCount / points.length) * 100)

  // Average temp
  const avgTemp = points.reduce((s, p) => s + p.temp, 0) / points.length

  // Scatter data: temp vs next-day HRV
  const scatterData = points.filter(p => p.nextDayHrv !== null).map(p => ({
    temp: p.temp,
    hrv: p.nextDayHrv!,
    category: p.category,
    date: p.date,
  }))

  // HRV by category bar data
  const hrvBarData = [
    { label: 'Low Temp', hrv: hrv.low, color: '#60a5fa' },
    { label: 'Normal', hrv: hrv.normal, color: '#6b7280' },
    { label: 'Elevated', hrv: hrv.elevated, color: '#f97316' },
  ].filter(d => d.hrv !== null)

  // Time series of temperature
  const timeSeriesData = points.map((p, i) => ({ i, temp: p.temp, date: p.date, category: p.category }))

  const illnessWarning = maxConsecElevated >= 3

  return (
    <div className="space-y-6">
      {/* Illness signal banner */}
      {illnessWarning && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤒</span>
            <div>
              <p className="text-sm font-semibold text-red-400">
                {maxConsecElevated} consecutive nights with elevated temperature detected
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                This pattern may indicate illness, significant stress, or hormonal changes. Monitor HRV and rest accordingly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Elevated Nights', value: `${elevatedCount}`, sub: `${elevatedPct}% of nights (>+0.3°C)`, color: 'text-orange-400' },
          { label: 'Normal Nights', value: `${normalCount}`, sub: 'within ±0.3°C', color: 'text-text-primary' },
          { label: 'Avg Deviation', value: `${avgTemp >= 0 ? '+' : ''}${avgTemp.toFixed(2)}°C`, sub: 'from personal baseline', color: avgTemp > 0 ? 'text-orange-400' : 'text-blue-400' },
          { label: 'Max Streak', value: `${maxConsecElevated}`, sub: 'consecutive elevated nights', color: maxConsecElevated >= 3 ? 'text-red-400' : 'text-text-primary' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Temperature trend */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Nightly Temperature Deviation (°C)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={timeSeriesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="i"
              type="number"
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)}°C`, 'Deviation']}
              labelFormatter={(i: number) => fmtDate(timeSeriesData[i]?.date ?? '')}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <ReferenceLine y={0.3} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={-0.3} stroke="#60a5fa" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Bar dataKey="temp" radius={[1, 1, 0, 0]}>
              {timeSeriesData.map((d, i) => (
                <Cell key={i} fill={tempColor(d.category)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary justify-center">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-orange-500" />Elevated (&gt;+0.3°C)</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-gray-500" />Normal</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />Low (&lt;-0.3°C)</div>
        </div>
      </div>

      {/* HRV by temperature category */}
      {hrvBarData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Next-Day HRV by Temperature</h2>
          <p className="text-xs text-text-secondary mb-3">
            Does a warmer or cooler night predict better or worse recovery?
          </p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={hrvBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} ms`, 'Avg Next-Day HRV']} />
              <Bar dataKey="hrv" radius={[4, 4, 0, 0]}>
                {hrvBarData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scatter: temp vs HRV */}
      {scatterData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Temperature vs Next-Day HRV</h2>
          <p className="text-xs text-text-secondary mb-3">
            Each point = one night. Does elevated temp predict lower HRV?
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="temp"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}`}
                label={{ value: 'Temp deviation (°C)', position: 'insideBottom', offset: -4, fontSize: 10, fill: '#888' }}
              />
              <YAxis
                dataKey="hrv"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                label={{ value: 'Next-day HRV (ms)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(v: number, name: string) => [
                  name === 'temp' ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}°C` : `${v} ms`,
                  name === 'temp' ? 'Temp' : 'HRV',
                ]}
                labelFormatter={(i) => fmtDate(scatterData[i]?.date ?? '')}
              />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
              <Scatter data={scatterData} isAnimationActive={false}>
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={tempColor(d.category)} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">Understanding Wrist Temperature</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p>
            Apple Watch Series 8+ measures wrist skin temperature deviation from your personal nightly baseline.
            The absolute temperature varies by person, so Apple reports <span className="text-orange-400 font-medium">deviation (°C)</span> from your own baseline.
          </p>
          <p>
            <span className="text-orange-400 font-medium">Elevated temperature</span> (&gt;+0.3°C) can indicate:
            fever or illness onset, physical stress or hard training, hormonal shifts (menstrual cycle),
            alcohol consumption, or sleeping in a warm environment.
          </p>
          <p>
            <span className="text-blue-400 font-medium">Below-baseline temperature</span> is less common but
            can occur during deep recovery, cold environments, or following intense training with good adaptation.
          </p>
          <p className="opacity-60 pt-1">
            Temperature readings require Apple Watch Series 8, Ultra, or later, and must be worn during sleep.
          </p>
        </div>
      </div>
    </div>
  )
}
