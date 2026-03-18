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

interface BPReading {
  time: string
  systolic: number
  diastolic: number
}

interface VitalsClientProps {
  spO2: VitalReading[]
  respRate: VitalReading[]
  bloodPressure: BPReading[]
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

function StatPill({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}{unit && <span className="text-sm font-normal text-text-secondary ml-1">{unit}</span>}</p>
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

export function VitalsClient({ spO2, respRate, bloodPressure }: VitalsClientProps) {
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

      {/* Blood Pressure */}
      {bloodPressure.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Blood Pressure</h2>
          {(() => {
            const latest = bloodPressure[bloodPressure.length - 1]
            const avgSys = Math.round(bloodPressure.reduce((s, r) => s + r.systolic, 0) / bloodPressure.length)
            const avgDia = Math.round(bloodPressure.reduce((s, r) => s + r.diastolic, 0) / bloodPressure.length)
            // BP classification
            function bpClass(sys: number, dia: number) {
              if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-green-400' }
              if (sys < 130 && dia < 80) return { label: 'Elevated', color: 'text-yellow-400' }
              if (sys < 140 || dia < 90) return { label: 'High Stage 1', color: 'text-orange-400' }
              return { label: 'High Stage 2', color: 'text-red-400' }
            }
            const latestClass = bpClass(latest.systolic, latest.diastolic)
            const bpChartData = bloodPressure.slice(-30).map((r) => ({
              date: fmtDate(r.time),
              systolic: r.systolic,
              diastolic: r.diastolic,
            }))

            return (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <StatPill
                    label="Latest"
                    value={`${latest.systolic}/${latest.diastolic}`}
                    unit="mmHg"
                    color={latestClass.color}
                  />
                  <StatPill
                    label="Avg Systolic"
                    value={`${avgSys}`}
                    unit="mmHg"
                    color="text-red-400"
                  />
                  <StatPill
                    label="Avg Diastolic"
                    value={`${avgDia}`}
                    unit="mmHg"
                    color="text-blue-400"
                  />
                </div>
                <div className="mb-3 px-3 py-2 rounded-lg bg-surface border border-border inline-flex items-center gap-2">
                  <span className={`text-sm font-semibold ${latestClass.color}`}>{latestClass.label}</span>
                  <span className="text-xs text-text-secondary">— based on latest reading</span>
                </div>
                {bpChartData.length >= 2 && (
                  <div className="bg-surface rounded-xl border border-border p-4">
                    <h3 className="text-sm font-medium text-text-secondary mb-3">Systolic &amp; Diastolic (30 days)</h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={bpChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v: number, name: string) => [`${v} mmHg`, name === 'systolic' ? 'Systolic' : 'Diastolic']}
                        />
                        <ReferenceLine y={120} stroke="rgba(250,204,21,0.3)" strokeDasharray="4 3" label={{ value: '120', position: 'insideTopRight', fontSize: 9, fill: 'rgba(250,204,21,0.5)' }} />
                        <ReferenceLine y={80} stroke="rgba(250,204,21,0.2)" strokeDasharray="4 3" label={{ value: '80', position: 'insideTopRight', fontSize: 9, fill: 'rgba(250,204,21,0.4)' }} />
                        <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block" /> Systolic</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Diastolic</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">Normal: below 120/80 mmHg</p>
                  </div>
                )}
              </>
            )
          })()}
        </section>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-1">
        <p className="font-medium text-text-primary text-sm">How this data is collected</p>
        <p>Blood oxygen and respiratory rate are measured by your Apple Watch during sleep and periodic spot checks. Blood pressure requires a compatible third-party device connected to Apple Health. Data syncs automatically through the KQuarks iOS app.</p>
      </div>
    </div>
  )
}
