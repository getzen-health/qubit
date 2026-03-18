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

interface AudioReading {
  date: string
  value: number
}

interface HearingClientProps {
  headphoneReadings: AudioReading[]
  environmentalReadings: AudioReading[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// WHO / NIOSH safe listening thresholds
const SAFE_THRESHOLD = 70  // dB — consistently safe
const CAUTION_THRESHOLD = 80 // dB — prolonged exposure risky
const LOUD_THRESHOLD = 85   // dB — damage risk with extended exposure

function dbColor(db: number) {
  if (db >= LOUD_THRESHOLD) return 'text-red-400'
  if (db >= CAUTION_THRESHOLD) return 'text-orange-400'
  if (db >= SAFE_THRESHOLD) return 'text-yellow-400'
  return 'text-green-400'
}

function dbLabel(db: number) {
  if (db >= LOUD_THRESHOLD) return 'Loud'
  if (db >= CAUTION_THRESHOLD) return 'Moderate'
  if (db >= SAFE_THRESHOLD) return 'Low'
  return 'Very Low'
}

function avg(readings: AudioReading[]) {
  if (!readings.length) return 0
  return readings.reduce((a, b) => a + b.value, 0) / readings.length
}

function AudioChart({ readings, label, color }: { readings: AudioReading[]; label: string; color: string }) {
  if (readings.length < 2) return null
  const chartData = readings.map((r) => ({
    date: fmtDate(r.date),
    db: +r.value.toFixed(1),
  }))
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <h2 className="text-sm font-medium text-text-secondary mb-3">{label} (dB)</h2>
      <ResponsiveContainer width="100%" height={160}>
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
            tickFormatter={(v: number) => `${v}`}
            domain={[50, 'dataMax + 5']}
            width={32}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number) => [`${v} dB`, 'Exposure']}
          />
          <ReferenceLine y={SAFE_THRESHOLD} stroke="rgba(74,222,128,0.3)" strokeDasharray="4 3" label={{ value: '70dB', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.5)' }} />
          <ReferenceLine y={CAUTION_THRESHOLD} stroke="rgba(251,146,60,0.3)" strokeDasharray="4 3" label={{ value: '80dB', position: 'insideTopRight', fontSize: 9, fill: 'rgba(251,146,60,0.5)' }} />
          <ReferenceLine y={LOUD_THRESHOLD} stroke="rgba(248,113,113,0.3)" strokeDasharray="4 3" label={{ value: '85dB', position: 'insideTopRight', fontSize: 9, fill: 'rgba(248,113,113,0.5)' }} />
          <Line
            type="monotone"
            dataKey="db"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HearingClient({ headphoneReadings, environmentalReadings }: HearingClientProps) {
  const hasAny = headphoneReadings.length > 0 || environmentalReadings.length > 0

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🎧</span>
        <h2 className="text-lg font-semibold text-text-primary">No hearing data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch and iPhone track headphone and environmental audio exposure. Sync your iPhone to import this data.
        </p>
        <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary max-w-xs text-left space-y-1.5">
          <p className="font-semibold text-text-primary">Requirements</p>
          <p>• iPhone with iOS 14.0 or later</p>
          <p>• AirPods or wired headphones (headphone data)</p>
          <p>• Microphone access enabled</p>
        </div>
      </div>
    )
  }

  const headAvg = avg(headphoneReadings)
  const envAvg = avg(environmentalReadings)

  const headLoudDays = headphoneReadings.filter((r) => r.value >= LOUD_THRESHOLD).length
  const envLoudDays = environmentalReadings.filter((r) => r.value >= LOUD_THRESHOLD).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {headphoneReadings.length > 0 && (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-2xl font-bold ${dbColor(headAvg)}`}>{headAvg.toFixed(1)} dB</p>
              <p className="text-xs text-text-secondary mt-0.5">Headphone Avg</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{headLoudDays}</p>
              <p className="text-xs text-text-secondary mt-0.5">Loud Headphone Days</p>
            </div>
          </>
        )}
        {environmentalReadings.length > 0 && (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-2xl font-bold ${dbColor(envAvg)}`}>{envAvg.toFixed(1)} dB</p>
              <p className="text-xs text-text-secondary mt-0.5">Environment Avg</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{envLoudDays}</p>
              <p className="text-xs text-text-secondary mt-0.5">Loud Environment Days</p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <AudioChart readings={headphoneReadings} label="Headphone Audio Exposure" color="#a78bfa" />
      <AudioChart readings={environmentalReadings} label="Environmental Audio Exposure" color="#38bdf8" />

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">Noise exposure guide</p>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {[
            { icon: '🟢', range: '< 70 dB', desc: 'Safe — whisper, normal conversation' },
            { icon: '🟡', range: '70–79 dB', desc: 'Low risk — city traffic, vacuum cleaner' },
            { icon: '🟠', range: '80–84 dB', desc: 'Moderate — heavy traffic, loud music' },
            { icon: '🔴', range: '≥ 85 dB', desc: 'Risky — prolonged exposure causes damage' },
          ].map(({ icon, range, desc }) => (
            <div key={range} className="space-y-0.5">
              <p>{icon} <span className="font-mono">{range}</span></p>
              <p className="opacity-70">{desc}</p>
            </div>
          ))}
        </div>
        <p className="opacity-60 pt-1">WHO recommends keeping average exposure below 70 dB over 24 hours to prevent long-term hearing loss.</p>
      </div>

      {/* Day list */}
      {headphoneReadings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Headphone Exposure</h2>
          {[...headphoneReadings].reverse().slice(0, 30).map((r) => {
            const date = new Date(r.date + 'T00:00:00')
            return (
              <div key={r.date} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-text-primary">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">{dbLabel(r.value)}</span>
                  <span className={`text-sm font-semibold w-16 text-right ${dbColor(r.value)}`}>
                    {r.value.toFixed(1)} dB
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
