'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface TemperatureReading {
  date: string
  value: number
}

interface TemperatureClientProps {
  readings: TemperatureReading[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function tempColor(v: number) {
  if (v > 0.5) return 'text-orange-400'
  if (v > 0.1) return 'text-yellow-400'
  if (v < -0.5) return 'text-blue-400'
  if (v < -0.1) return 'text-cyan-400'
  return 'text-green-400'
}

export function TemperatureClient({ readings }: TemperatureClientProps) {
  if (readings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🌡️</span>
        <h2 className="text-lg font-semibold text-text-primary">No temperature data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Wrist temperature during sleep is recorded by Apple Watch Series 8 and later. Sync your iPhone to import this data.
        </p>
        <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary max-w-xs text-left space-y-1.5">
          <p className="font-semibold text-text-primary">Requirements</p>
          <p>• Apple Watch Series 8, Ultra, or later</p>
          <p>• iOS 16.0 or later</p>
          <p>• Worn during sleep tracking</p>
        </div>
      </div>
    )
  }

  const latest = readings[readings.length - 1]
  const values = readings.map((r) => r.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const warmNights = values.filter((v) => v > 0.1).length
  const coldNights = values.filter((v) => v < -0.1).length

  const chartData = readings.map((r) => ({
    date: fmtDate(r.date),
    rawDate: r.date,
    temp: +r.value.toFixed(2),
  }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${tempColor(latest.value)}`}>
            {latest.value > 0 ? '+' : ''}{latest.value.toFixed(2)}°C
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Last Night</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${tempColor(avg)}`}>
            {avg > 0 ? '+' : ''}{avg.toFixed(2)}°C
          </p>
          <p className="text-xs text-text-secondary mt-0.5">90-Day Avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{warmNights}</p>
          <p className="text-xs text-text-secondary mt-0.5">Warm Nights</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{coldNights}</p>
          <p className="text-xs text-text-secondary mt-0.5">Cool Nights</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Temperature Deviation (°C from baseline)</h2>
          <p className="text-xs text-text-secondary mb-3 opacity-70">Positive = warmer than usual · Negative = cooler than usual</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
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
                tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
                domain={['dataMin - 0.2', 'dataMax + 0.2']}
                width={40}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}°C`, 'Deviation']}
              />
              {/* Baseline */}
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
              {/* Warm threshold */}
              <ReferenceLine y={0.5} stroke="rgba(251,146,60,0.3)" strokeDasharray="4 3" label={{ value: '+0.5°', position: 'insideTopRight', fontSize: 9, fill: 'rgba(251,146,60,0.5)' }} />
              {/* Cool threshold */}
              <ReferenceLine y={-0.5} stroke="rgba(96,165,250,0.3)" strokeDasharray="4 3" label={{ value: '-0.5°', position: 'insideBottomRight', fontSize: 9, fill: 'rgba(96,165,250,0.5)' }} />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ r: 3, fill: '#a78bfa' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">What does this mean?</p>
        <p>Apple Watch measures your wrist temperature each night and shows the deviation from your personal baseline (established over your first few nights).</p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { icon: '🟠', range: '> +0.5°C', desc: 'Elevated — possible illness, stress, or late exercise' },
            { icon: '🟢', range: '−0.1 to +0.1°C', desc: 'Baseline — typical, well-recovered night' },
            { icon: '🔵', range: '< −0.5°C', desc: 'Cool — deep recovery or cooler environment' },
          ].map(({ icon, range, desc }) => (
            <div key={range} className="space-y-0.5">
              <p>{icon} <span className="font-mono">{range}</span></p>
              <p className="opacity-70">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Night list */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Nights</h2>
        {[...readings].reverse().slice(0, 30).map((r) => {
          const date = new Date(r.date)
          const deviation = r.value
          return (
            <div key={r.date} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-text-primary">
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-surface-secondary rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      width: `${Math.min(Math.abs(deviation) / 1.5 * 50, 50)}%`,
                      left: deviation >= 0 ? '50%' : `${50 - Math.min(Math.abs(deviation) / 1.5 * 50, 50)}%`,
                      backgroundColor: deviation > 0.1 ? '#fb923c' : deviation < -0.1 ? '#60a5fa' : '#4ade80',
                    }}
                  />
                  <div className="absolute top-0 left-1/2 w-px h-full bg-white opacity-20" />
                </div>
                <span className={`text-sm font-semibold w-16 text-right ${tempColor(deviation)}`}>
                  {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}°C
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
