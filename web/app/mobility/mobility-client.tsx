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

interface DataPoint {
  week: string
  value: number
}

interface MobilityClientProps {
  speedData: DataPoint[]
  stepLengthData: DataPoint[]
  asymmetryData: DataPoint[]
  doubleSupportData: DataPoint[]
  steadinessData: DataPoint[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtWeek(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function latestValue(data: DataPoint[]) {
  return data.length > 0 ? data[data.length - 1].value : null
}

function avgValue(data: DataPoint[]) {
  if (!data.length) return null
  return data.reduce((a, b) => a + b.value, 0) / data.length
}

function MiniChart({
  data,
  color,
  label,
  formatter,
  domain,
  refLines,
}: {
  data: DataPoint[]
  color: string
  label: string
  formatter: (v: number) => string
  domain?: [number | string, number | string]
  refLines?: { y: number; color: string; label: string }[]
}) {
  if (data.length < 2) return null
  const chartData = data.map((d) => ({ week: fmtWeek(d.week), v: d.value }))
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">{label}</h3>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
            tickFormatter={(v: number) => formatter(v)}
            domain={domain ?? ['dataMin - 0.05', 'dataMax + 0.05']}
            width={36}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatter(v), label]} />
          {refLines?.map((r) => (
            <ReferenceLine
              key={r.y}
              y={r.y}
              stroke={r.color}
              strokeDasharray="4 3"
              label={{ value: r.label, position: 'insideTopRight', fontSize: 9, fill: r.color }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="v"
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

export function MobilityClient({ speedData, stepLengthData, asymmetryData, doubleSupportData, steadinessData }: MobilityClientProps) {
  const hasAny = speedData.length > 0 || stepLengthData.length > 0 || asymmetryData.length > 0 || doubleSupportData.length > 0 || steadinessData.length > 0

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🚶</span>
        <h2 className="text-lg font-semibold text-text-primary">No mobility data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          iPhone measures your walking health weekly — walking speed, step length, and symmetry are captured automatically as you move around.
        </p>
        <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary max-w-xs text-left space-y-1.5">
          <p className="font-semibold text-text-primary">Requirements</p>
          <p>• iPhone with iOS 14.0 or later</p>
          <p>• Carried in your pocket while walking</p>
          <p>• At least one week of motion data</p>
        </div>
      </div>
    )
  }

  const latestSpeed = latestValue(speedData)
  const avgSpeed = avgValue(speedData)
  const latestAsymmetry = latestValue(asymmetryData)
  const latestStepLength = latestValue(stepLengthData)
  const latestSteadiness = latestValue(steadinessData)

  function steadinessZone(v: number): { label: string; color: string } {
    if (v >= 60) return { label: 'OK', color: 'text-green-400' }
    if (v >= 40) return { label: 'Low', color: 'text-orange-400' }
    return { label: 'Very Low', color: 'text-red-400' }
  }

  // Walking speed: typical healthy adult 1.2–1.6 m/s
  function speedColor(v: number) {
    if (v >= 1.3) return 'text-green-400'
    if (v >= 1.0) return 'text-yellow-400'
    return 'text-red-400'
  }

  // Asymmetry: lower is better (0% = perfect symmetry, >4% is notable)
  function asymColor(v: number) {
    if (v <= 3) return 'text-green-400'
    if (v <= 5) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {latestSpeed !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${speedColor(latestSpeed)}`}>{latestSpeed.toFixed(2)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Speed (m/s)</p>
          </div>
        )}
        {avgSpeed !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${speedColor(avgSpeed)}`}>{avgSpeed.toFixed(2)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Speed</p>
          </div>
        )}
        {latestStepLength !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{(latestStepLength * 100).toFixed(0)} cm</p>
            <p className="text-xs text-text-secondary mt-0.5">Step Length</p>
          </div>
        )}
        {latestAsymmetry !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${asymColor(latestAsymmetry)}`}>{latestAsymmetry.toFixed(1)}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Asymmetry</p>
          </div>
        )}
        {latestSteadiness !== null && (() => {
          const zone = steadinessZone(latestSteadiness)
          return (
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-2xl font-bold ${zone.color}`}>{latestSteadiness.toFixed(0)}%</p>
              <p className="text-xs text-text-secondary mt-0.5">Steadiness · {zone.label}</p>
            </div>
          )
        })()}
      </div>

      {/* Charts */}
      <MiniChart
        data={speedData}
        color="#4ade80"
        label="Walking Speed (m/s)"
        formatter={(v) => `${v.toFixed(2)}`}
        domain={[0.6, 2.0]}
        refLines={[
          { y: 1.0, color: 'rgba(251,146,60,0.5)', label: '1.0' },
          { y: 1.3, color: 'rgba(74,222,128,0.5)', label: '1.3' },
        ]}
      />
      <MiniChart
        data={stepLengthData}
        color="#a78bfa"
        label="Step Length (m)"
        formatter={(v) => `${(v * 100).toFixed(0)}cm`}
        domain={[0.3, 1.0]}
      />
      <MiniChart
        data={asymmetryData}
        color="#fb923c"
        label="Walking Asymmetry (%)"
        formatter={(v) => `${v.toFixed(1)}%`}
        domain={[0, 15]}
        refLines={[
          { y: 3, color: 'rgba(74,222,128,0.4)', label: '3%' },
          { y: 6, color: 'rgba(251,146,60,0.4)', label: '6%' },
        ]}
      />
      <MiniChart
        data={doubleSupportData}
        color="#38bdf8"
        label="Double Support Time (%)"
        formatter={(v) => `${v.toFixed(1)}%`}
        domain={[15, 50]}
        refLines={[{ y: 20, color: 'rgba(74,222,128,0.4)', label: '20%' }]}
      />
      <MiniChart
        data={steadinessData}
        color="#4ade80"
        label="Walking Steadiness (%)"
        formatter={(v) => `${v.toFixed(0)}%`}
        domain={[0, 100]}
        refLines={[
          { y: 60, color: 'rgba(74,222,128,0.4)', label: 'OK ≥60%' },
          { y: 40, color: 'rgba(251,146,60,0.4)', label: 'Low ≥40%' },
        ]}
      />

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">What these metrics mean</p>
        <div className="space-y-2">
          {[
            {
              name: 'Walking Speed',
              detail: 'Measures how fast you walk naturally. Slowing speed over time can indicate reduced fitness or balance concerns. Healthy adults typically walk 1.2–1.6 m/s.',
            },
            {
              name: 'Step Length',
              detail: 'The distance covered in each step. Shorter steps can indicate caution, fatigue, or musculoskeletal issues. Longer strides generally indicate better mobility.',
            },
            {
              name: 'Walking Asymmetry',
              detail: 'How differently you step with each foot. Values below 3% are excellent. Higher asymmetry can indicate injury, weakness, or compensation patterns.',
            },
            {
              name: 'Double Support Time',
              detail: 'The percentage of your gait cycle where both feet are on the ground. Increases with age. Lower values indicate a more confident, dynamic gait.',
            },
            {
              name: 'Walking Steadiness',
              detail: 'iPhone's fall-risk metric (0–100%). OK is ≥60%, Low is 40–59%, Very Low is below 40%. Captures balance and gait stability over time using motion sensors.',
            },
          ].map(({ name, detail }) => (
            <div key={name}>
              <p className="font-medium text-text-primary">{name}</p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1">iPhone measures these metrics automatically using the accelerometer and gyroscope while you carry it in your pocket or bag.</p>
      </div>
    </div>
  )
}
