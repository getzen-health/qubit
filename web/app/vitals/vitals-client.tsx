'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  restingHR: VitalReading[]
  hrv: VitalReading[]
  bodyTemp: VitalReading[]
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

export function VitalsClient({ spO2, respRate, bloodPressure, restingHR, hrv, bodyTemp }: VitalsClientProps) {
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C')
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

  // Resting Heart Rate
  const rhrValues = restingHR.map((r) => r.value)
  const latestRHR = restingHR.length > 0 ? restingHR[restingHR.length - 1].value : null
  const avgRHR = avg(rhrValues)
  const minRHR = rhrValues.length > 0 ? Math.min(...rhrValues) : null
  const rhrDaily = dailyAvg(restingHR)

  // HRV
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const latestHRV = hrv.length > 0 ? hrv[hrv.length - 1].value : null
  const avg7HRV = avg(hrv.filter((r) => new Date(r.time) >= sevenDaysAgo).map((r) => r.value))
  const hrvDaily = dailyAvg(hrv)

  // Body Temperature
  function toF(c: number) { return +(c * 9 / 5 + 32).toFixed(2) }
  const latestTempC = bodyTemp.length > 0 ? bodyTemp[bodyTemp.length - 1].value : null
  const latestTemp = latestTempC != null ? (tempUnit === 'C' ? latestTempC : toF(latestTempC)) : null
  const avgTempC = avg(bodyTemp.map((r) => r.value))
  const avgTemp = avgTempC != null ? (tempUnit === 'C' ? +avgTempC.toFixed(2) : toF(avgTempC)) : null
  const tempNormalLow = tempUnit === 'C' ? 36.1 : toF(36.1)
  const tempNormalHigh = tempUnit === 'C' ? 37.2 : toF(37.2)
  function tempStatus(t: number) {
    if (t < tempNormalLow) return { label: 'Below normal', color: 'text-blue-400' }
    if (t > tempNormalHigh) return { label: 'Above normal', color: 'text-orange-400' }
    return { label: 'Normal', color: 'text-green-400' }
  }
  const tempDaily = dailyAvg(bodyTemp).map((d) => ({
    ...d,
    value: tempUnit === 'C' ? d.value : toF(d.value),
  }))

  return (
    <div className="space-y-6">

      {/* Blood Oxygen (SpO2) */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Blood Oxygen (SpO₂)</h2>
        {spO2.length === 0 ? <EmptyVital name="blood oxygen" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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

      {/* Resting Heart Rate */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Resting Heart Rate</h2>
        {restingHR.length === 0 ? <EmptyVital name="resting heart rate" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <StatPill
                label="Latest"
                value={latestRHR != null ? `${latestRHR}` : '—'}
                unit="bpm"
                color={latestRHR != null && latestRHR < 60 ? 'text-blue-400' : latestRHR != null && latestRHR > 100 ? 'text-red-400' : 'text-green-400'}
              />
              <StatPill
                label="30-Day Avg"
                value={avgRHR != null ? Math.round(avgRHR).toString() : '—'}
                unit="bpm"
                color="text-blue-400"
              />
              <StatPill
                label="Lowest"
                value={minRHR != null ? `${minRHR}` : '—'}
                unit="bpm"
                color="text-text-primary"
              />
            </div>

            {rhrDaily.length >= 2 && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Average (30 days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={rhrDaily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
                      formatter={(v: number) => [`${v} bpm`, 'Resting HR']}
                    />
                    <ReferenceLine y={60} stroke="rgba(96,165,250,0.4)" strokeDasharray="4 3" label={{ value: '60 athletic', position: 'insideTopRight', fontSize: 10, fill: 'rgba(96,165,250,0.6)' }} />
                    <ReferenceLine y={100} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 3" label={{ value: '100', position: 'insideTopRight', fontSize: 10, fill: 'rgba(239,68,68,0.6)' }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#f97316' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-text-secondary mt-2">
                  Normal range: 50–100 bpm. Athletic individuals often below 60 bpm.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* HRV */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Heart Rate Variability (HRV)</h2>
        {hrv.length === 0 ? <EmptyVital name="HRV" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <StatPill
                label="Latest RMSSD"
                value={latestHRV != null ? latestHRV.toFixed(1) : '—'}
                unit="ms"
                color="text-violet-400"
              />
              <StatPill
                label="7-Day Avg"
                value={avg7HRV != null ? avg7HRV.toFixed(1) : '—'}
                unit="ms"
                color="text-blue-400"
              />
            </div>

            {hrvDaily.length >= 2 && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Average (30 days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={hrvDaily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
                      formatter={(v: number) => [`${v} ms`, 'HRV']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#8b5cf6' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-text-secondary mt-2">
                  Higher HRV generally indicates better recovery and cardiovascular fitness.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Body Temperature */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Body Temperature</h2>
          <button
            onClick={() => setTempUnit((u) => u === 'C' ? 'F' : 'C')}
            className="text-xs px-2.5 py-1 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
          >
            °C / °F
          </button>
        </div>
        {bodyTemp.length === 0 ? <EmptyVital name="body temperature" /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className={`text-2xl font-bold ${latestTemp != null ? tempStatus(latestTemp).color : 'text-text-primary'}`}>
                  {latestTemp != null ? latestTemp.toFixed(1) : '—'}
                  <span className="text-sm font-normal text-text-secondary ml-1">°{tempUnit}</span>
                </p>
                <p className="text-xs text-text-secondary mt-0.5">Latest</p>
                {latestTemp != null && (
                  <span className={`text-xs font-medium mt-1 block ${tempStatus(latestTemp).color}`}>
                    {tempStatus(latestTemp).label}
                  </span>
                )}
              </div>
              <StatPill
                label="30-Day Avg"
                value={avgTemp != null ? avgTemp.toFixed(1) : '—'}
                unit={`°${tempUnit}`}
                color="text-blue-400"
              />
            </div>

            {tempDaily.length >= 2 && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Average (30 days)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={tempDaily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide domain={['dataMin - 0.3', 'dataMax + 0.3']} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v.toFixed(1)}°${tempUnit}`, 'Temp']}
                    />
                    <ReferenceLine y={tempNormalLow} stroke="rgba(96,165,250,0.4)" strokeDasharray="4 3" label={{ value: `${tempNormalLow.toFixed(1)}°`, position: 'insideTopLeft', fontSize: 9, fill: 'rgba(96,165,250,0.6)' }} />
                    <ReferenceLine y={tempNormalHigh} stroke="rgba(251,146,60,0.4)" strokeDasharray="4 3" label={{ value: `${tempNormalHigh.toFixed(1)}°`, position: 'insideTopRight', fontSize: 9, fill: 'rgba(251,146,60,0.6)' }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#fb923c"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#fb923c' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-text-secondary mt-2">
                  Normal range: 36.1–37.2°C (97.0–99.0°F). Measured at wrist during sleep.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ECG History link */}
      <Link
        href="/hrv/ecg"
        className="flex items-center justify-between bg-surface rounded-xl border border-border p-4 hover:bg-surface-secondary transition-colors group"
      >
        <div>
          <p className="text-sm font-semibold text-text-primary">ECG History</p>
          <p className="text-xs text-text-secondary mt-0.5">View electrocardiogram recordings from Apple Watch</p>
        </div>
        <span className="text-text-secondary group-hover:text-text-primary transition-colors text-lg">→</span>
      </Link>

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-1">
        <p className="font-medium text-text-primary text-sm">How this data is collected</p>
        <p>Blood oxygen and respiratory rate are measured by your Apple Watch during sleep and periodic spot checks. Resting heart rate and HRV (RMSSD) are computed nightly by Apple Watch. Body temperature uses wrist skin temperature measured during sleep. Blood pressure requires a compatible third-party device connected to Apple Health. Data syncs automatically through the GetZen iOS app.</p>
      </div>
    </div>
  )
}
