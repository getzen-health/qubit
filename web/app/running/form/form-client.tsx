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

interface RunData {
  date: string
  durationMinutes: number
  distanceKm: number
  paceSecsPerKm: number | null
  cadence: number | null         // steps/min
  strideLength: number | null    // meters
  verticalOscillation: number | null  // cm
  groundContactTime: number | null    // ms
  power: number | null               // watts
}

interface Props {
  runs: RunData[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function avg(vals: (number | null)[]) {
  const v = vals.filter((x): x is number => x !== null && x > 0)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

function scoreClass(val: number | null, target: number, dir: 'up' | 'down', threshold = 0.05) {
  if (val === null) return { color: 'text-text-secondary', label: '—' }
  const pct = Math.abs((val - target) / target)
  const better = dir === 'up' ? val >= target : val <= target
  if (pct <= threshold) return { color: 'text-green-400', label: '✓ On target' }
  if (better) return { color: 'text-blue-400', label: dir === 'up' ? '↑ Above target' : '↓ Below target' }
  return { color: 'text-yellow-400', label: dir === 'up' ? '↓ Below target' : '↑ Above target' }
}

interface MetricChartProps {
  data: { date: string; value: number }[]
  label: string
  unit: string
  color: string
  refLine?: number
  refLabel?: string
  domain?: [number | 'auto', number | 'auto']
  formatter?: (v: number) => string
}

function MetricChart({ data, label, unit, color, refLine, refLabel, domain, formatter }: MetricChartProps) {
  if (data.length < 2) return null
  const fmt = formatter ?? ((v: number) => v.toFixed(1))
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-sm font-medium text-text-secondary mb-3">{label}</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={domain ?? ['auto', 'auto']}
            tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
            tickFormatter={fmt}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number) => [`${fmt(v)} ${unit}`, label]}
          />
          {refLine !== undefined && (
            <ReferenceLine
              y={refLine}
              stroke="rgba(255,255,255,0.3)"
              strokeDasharray="4 3"
              label={{ value: refLabel ?? `Target: ${refLine}`, fill: '#888', fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={data.length <= 20 ? { r: 3, fill: color } : false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RunningFormClient({ runs }: Props) {
  const runsWithForm = runs.filter(
    (r) =>
      r.cadence !== null ||
      r.strideLength !== null ||
      r.verticalOscillation !== null ||
      r.groundContactTime !== null ||
      r.power !== null
  )

  if (runsWithForm.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏃</span>
        <h2 className="text-lg font-semibold text-text-primary">No form data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Running form metrics (cadence, stride, vertical oscillation) are captured by Apple Watch
          Series 4+ during outdoor runs. Make sure to sync your iPhone.
        </p>
        <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary max-w-xs text-left space-y-1.5 mt-2">
          <p className="font-medium text-text-primary">Requirements</p>
          <p>• Apple Watch Series 4 or later</p>
          <p>• Outdoor running workout type</p>
          <p>• iPhone held or in armband</p>
        </div>
      </div>
    )
  }

  // Compute averages
  const avgCadence = avg(runs.map((r) => r.cadence))
  const avgStride = avg(runs.map((r) => r.strideLength))
  const avgVOS = avg(runs.map((r) => r.verticalOscillation))
  const avgGCT = avg(runs.map((r) => r.groundContactTime))
  const avgPower = avg(runs.map((r) => r.power))

  // Build chart data
  const cadenceData = runs.filter((r) => r.cadence && r.cadence > 100).map((r) => ({ date: fmtDate(r.date), value: Math.round(r.cadence!) }))
  const strideData = runs.filter((r) => r.strideLength && r.strideLength > 0).map((r) => ({ date: fmtDate(r.date), value: +r.strideLength!.toFixed(2) }))
  const vosData = runs.filter((r) => r.verticalOscillation && r.verticalOscillation > 0).map((r) => ({ date: fmtDate(r.date), value: +r.verticalOscillation!.toFixed(1) }))
  const gctData = runs.filter((r) => r.groundContactTime && r.groundContactTime > 0).map((r) => ({ date: fmtDate(r.date), value: Math.round(r.groundContactTime!) }))
  const powerData = runs.filter((r) => r.power && r.power > 0).map((r) => ({ date: fmtDate(r.date), value: Math.round(r.power!) }))

  const cadenceScore = scoreClass(avgCadence, 175, 'up', 0.03)
  const vosScore = scoreClass(avgVOS, 7, 'down', 0.15)
  const gctScore = scoreClass(avgGCT, 240, 'down', 0.10)

  // Coaching tips
  const tips: { title: string; desc: string; priority: 'high' | 'medium' | 'low' }[] = []
  if (avgCadence !== null && avgCadence < 165) {
    tips.push({ title: 'Increase Cadence', desc: `Your avg cadence is ${Math.round(avgCadence)} spm. Aim for 170–180 spm. Try running to a metronome or playlist at that tempo to train your turnover.`, priority: 'high' })
  }
  if (avgVOS !== null && avgVOS > 9) {
    tips.push({ title: 'Reduce Vertical Oscillation', desc: `Your bounce (${avgVOS.toFixed(1)} cm) is high. Focus on a forward lean, shorter stride at the back, and pulling your foot up quickly. Lower bounce = less wasted energy.`, priority: 'high' })
  }
  if (avgGCT !== null && avgGCT > 280) {
    tips.push({ title: 'Reduce Ground Contact Time', desc: `Your foot spends ${Math.round(avgGCT)}ms on the ground per step (elite: <200ms). Practice "quick feet" drills — land under your hips, not in front.`, priority: 'medium' })
  }
  if (avgCadence !== null && avgCadence >= 170 && avgCadence <= 185) {
    tips.push({ title: 'Cadence Looks Great', desc: `${Math.round(avgCadence)} spm is in the optimal range. Maintain consistency across different paces — many runners lose cadence on easy days.`, priority: 'low' })
  }

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: 'Avg Cadence', value: avgCadence ? `${Math.round(avgCadence)} spm` : '—', target: '170–180 spm', color: cadenceScore.color },
          { label: 'Avg Stride', value: avgStride ? `${avgStride.toFixed(2)} m` : '—', target: 'Longer = faster', color: 'text-text-primary' },
          { label: 'Vertical Bounce', value: avgVOS ? `${avgVOS.toFixed(1)} cm` : '—', target: 'Target: <8 cm', color: vosScore.color },
          { label: 'Gnd Contact', value: avgGCT ? `${Math.round(avgGCT)} ms` : '—', target: 'Target: <250 ms', color: gctScore.color },
          { label: 'Avg Power', value: avgPower ? `${Math.round(avgPower)} W` : '—', target: 'Depends on pace', color: 'text-purple-400' },
          { label: 'Runs w/ Form', value: `${runsWithForm.length}`, target: `of ${runs.length} total`, color: 'text-text-primary' },
        ].map(({ label, value, target, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{target}</p>
          </div>
        ))}
      </div>

      {/* Coaching tips */}
      {tips.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Coaching Insights</h2>
          {tips.map((tip, i) => (
            <div key={i} className={`rounded-xl border p-4 space-y-1 ${
              tip.priority === 'high' ? 'bg-orange-500/5 border-orange-500/20' :
              tip.priority === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' :
              'bg-green-500/5 border-green-500/20'
            }`}>
              <p className={`text-sm font-semibold ${
                tip.priority === 'high' ? 'text-orange-400' :
                tip.priority === 'medium' ? 'text-yellow-400' :
                'text-green-400'
              }`}>{tip.title}</p>
              <p className="text-xs text-text-secondary">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trend charts */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Trends Over Time</h2>
        <MetricChart data={cadenceData} label="Cadence (steps/min)" unit="spm" color="#60a5fa" refLine={175} refLabel="Target 175" domain={[140, 200]} formatter={(v) => `${Math.round(v)}`} />
        <MetricChart data={strideData} label="Stride Length (m)" unit="m" color="#4ade80" formatter={(v) => v.toFixed(2)} />
        <MetricChart data={vosData} label="Vertical Oscillation (cm)" unit="cm" color="#f97316" refLine={8} refLabel="Target 8" domain={[3, 15]} />
        <MetricChart data={gctData} label="Ground Contact Time (ms)" unit="ms" color="#c084fc" refLine={250} refLabel="Target 250" domain={[150, 400]} formatter={(v) => `${Math.round(v)}`} />
        {powerData.length >= 2 && (
          <MetricChart data={powerData} label="Running Power (W)" unit="W" color="#f472b6" formatter={(v) => `${Math.round(v)}`} />
        )}
      </div>

      {/* Reference table */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Elite Benchmarks</h2>
        <div className="space-y-2 text-xs">
          {[
            { metric: 'Cadence', good: '165–175 spm', elite: '180–190 spm', note: 'Higher cadence reduces impact forces.' },
            { metric: 'Vertical Oscillation', good: '6–9 cm', elite: '< 6 cm', note: 'Less bounce = more efficient forward propulsion.' },
            { metric: 'Ground Contact', good: '220–260 ms', elite: '< 200 ms', note: 'Shorter contact = faster turnover, less braking force.' },
            { metric: 'Stride Length', good: 'Speed-dependent', elite: 'Optimized at target cadence', note: 'Should increase with speed, not just cadence.' },
          ].map(({ metric, good, elite, note }) => (
            <div key={metric} className="grid grid-cols-4 gap-2 py-2 border-b border-border last:border-0">
              <span className="font-medium text-text-primary">{metric}</span>
              <span className="text-green-400">{good}</span>
              <span className="text-blue-400">{elite}</span>
              <span className="text-text-secondary opacity-70">{note}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary opacity-50">
          ⚠️ Optimal values vary by pace and individual biomechanics. Focus on trends, not absolute targets.
        </p>
      </div>
    </div>
  )
}
