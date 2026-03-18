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

interface VitalReading {
  time: string
  value: number
}

interface VitalsClientProps {
  spO2: VitalReading[]
  respRate: VitalReading[]
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

function avg(arr: number[]) {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
}

function StatPill({ label, value, unit, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}<span className="text-sm font-normal text-text-secondary ml-1">{unit}</span></p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

function EmptyVital({ name }: { name: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-6 text-center text-text-secondary text-sm">
      No {name} data found. Sync your iPhone after an Apple Watch reading.
    </div>
  )
}

export function VitalsClient({ spO2, respRate }: VitalsClientProps) {
  // Downsample to daily averages for clarity (too many points otherwise)
  function dailyAvg(readings: VitalReading[]): { date: string; value: number }[] {
    const byDay: Record<string, number[]> = {}
    for (const r of readings) {
      const day = r.time.slice(0, 10)
      byDay[day] = byDay[day] ?? []
      byDay[day].push(r.value)
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: fmtDate(date + 'T00:00:00'),
        value: +((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
      }))
  }

  const spO2Daily = dailyAvg(spO2)
  const rrDaily = dailyAvg(respRate)

  const spO2Values = spO2.map((r) => r.value)
  const rrValues = respRate.map((r) => r.value)
  const latestSpO2 = spO2.length > 0 ? spO2[spO2.length - 1].value : null
  const latestRR = respRate.length > 0 ? respRate[respRate.length - 1].value : null
  const avgSpO2 = avg(spO2Values)
  const minSpO2 = spO2Values.length > 0 ? Math.min(...spO2Values) : null
  const avgRR = avg(rrValues)

  return (
    <div className="space-y-6">

      {/* Blood Oxygen (SpO2) */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Blood Oxygen (SpO₂)</h2>
        {spO2.length === 0 ? <EmptyVital name="blood oxygen" /> : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatPill
                label="Latest"
                value={latestSpO2 != null ? latestSpO2.toFixed(1) : '—'}
                unit="%"
                color={latestSpO2 != null && latestSpO2 < 95 ? 'text-red-400' : 'text-green-400'}
              />
              <StatPill
                label="30-Day Avg"
                value={avgSpO2 != null ? avgSpO2.toFixed(1) : '—'}
                unit="%"
                color="text-blue-400"
              />
              <StatPill
                label="Lowest"
                value={minSpO2 != null ? minSpO2.toFixed(1) : '—'}
                unit="%"
                color={minSpO2 != null && minSpO2 < 95 ? 'text-red-400' : 'text-text-primary'}
              />
            </div>

            {spO2Daily.length >= 2 && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Average (30 days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={spO2Daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v}%`, 'SpO₂']}
                    />
                    <ReferenceLine y={95} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 3" label={{ value: '95%', position: 'insideTopRight', fontSize: 10, fill: 'rgba(239,68,68,0.6)' }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#22c55e' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-text-secondary mt-2">
                  Normal range: 95–100%. Below 95% may need attention.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Respiratory Rate */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Respiratory Rate</h2>
        {respRate.length === 0 ? <EmptyVital name="respiratory rate" /> : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatPill
                label="Latest"
                value={latestRR != null ? latestRR.toFixed(1) : '—'}
                unit="brpm"
                color="text-purple-400"
              />
              <StatPill
                label="30-Day Avg"
                value={avgRR != null ? avgRR.toFixed(1) : '—'}
                unit="brpm"
                color="text-blue-400"
              />
            </div>

            {rrDaily.length >= 2 && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Average (30 days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={rrDaily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v} brpm`, 'Resp Rate']}
                    />
                    <ReferenceLine y={12} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
                    <ReferenceLine y={20} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" label={{ value: 'normal range', position: 'insideTopRight', fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#a78bfa' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-text-secondary mt-2">
                  Normal resting range: 12–20 breaths per minute.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-1">
        <p className="font-medium text-text-primary text-sm">How this data is collected</p>
        <p>Blood oxygen and respiratory rate are measured by your Apple Watch during sleep and periodic spot checks. Data syncs automatically through the KQuarks iOS app.</p>
      </div>
    </div>
  )
}
