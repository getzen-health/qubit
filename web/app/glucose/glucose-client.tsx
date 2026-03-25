'use client'

import { useState, useEffect } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts'

interface GlucoseReading {
  timestamp: string
  mgdl: number
  mmol: number
  hour: number
}

interface GlucoseClientProps {
  readings: GlucoseReading[]
}

type GlucoseUnit = 'mgdl' | 'mmol'
type TimeRange = '24h' | '7d' | '30d'

const MGDL_TO_MMOL = 18.0182

function toUnit(mgdl: number, unit: GlucoseUnit): number {
  return unit === 'mmol' ? Math.round((mgdl / MGDL_TO_MMOL) * 10) / 10 : Math.round(mgdl)
}

function fmtVal(mgdl: number, unit: GlucoseUnit): string {
  return unit === 'mmol' ? (mgdl / MGDL_TO_MMOL).toFixed(1) : Math.round(mgdl).toString()
}

function unitLabel(unit: GlucoseUnit): string {
  return unit === 'mmol' ? 'mmol/L' : 'mg/dL'
}

function classify(mgdl: number, lowThreshold: number = 70, highThreshold: number = 180): { label: string; color: string } {
  if (mgdl < lowThreshold) return { label: 'Low', color: '#60a5fa' }
  if (mgdl < 100) return { label: 'Normal', color: '#4ade80' }
  if (mgdl < 126) return { label: 'Elevated', color: '#facc15' }
  if (mgdl < highThreshold) return { label: 'High', color: '#fb923c' }
  return { label: 'Very High', color: '#f87171' }
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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function fmtHour(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

export function GlucoseClient({ readings: initialReadings }: GlucoseClientProps) {
  const [unit, setUnit] = useState<GlucoseUnit>('mgdl')
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [readings, setReadings] = useState<GlucoseReading[]>(initialReadings)
  const [isLoading, setIsLoading] = useState(false)
  const [lowThreshold, setLowThreshold] = useState(70)
  const [highThreshold, setHighThreshold] = useState(180)
  const [isSaving, setIsSaving] = useState(false)
  const [showThresholdSettings, setShowThresholdSettings] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('glucose_unit')
    if (stored === 'mgdl' || stored === 'mmol') setUnit(stored)
    
    const storedLow = localStorage.getItem('glucose_low_threshold')
    const storedHigh = localStorage.getItem('glucose_high_threshold')
    if (storedLow) setLowThreshold(Number(storedLow))
    if (storedHigh) setHighThreshold(Number(storedHigh))
  }, [])

  useEffect(() => {
    if (timeRange === '24h') {
      setReadings(initialReadings)
      return
    }

    async function fetchReadings() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/glucose?range=${timeRange}`)
        if (res.ok) {
          const data = await res.json()
          setReadings(data.readings)
        }
      } catch (err) {
        console.error('Failed to fetch glucose data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReadings()
  }, [timeRange, initialReadings])

  function toggleUnit() {
    const next: GlucoseUnit = unit === 'mgdl' ? 'mmol' : 'mgdl'
    setUnit(next)
    localStorage.setItem('glucose_unit', next)
  }

  async function saveThresholds() {
    setIsSaving(true)
    try {
      localStorage.setItem('glucose_low_threshold', String(lowThreshold))
      localStorage.setItem('glucose_high_threshold', String(highThreshold))
      
      const res = await fetch('/api/user-preferences/glucose-thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          glucose_low_threshold_mgdl: lowThreshold,
          glucose_high_threshold_mgdl: highThreshold,
          glucose_alerts_enabled: true 
        }),
      })
      if (!res.ok) {
        console.error('Failed to save thresholds')
      }
    } catch (err) {
      console.error('Failed to save glucose thresholds:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (readings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🩸</span>
        <h2 className="text-lg font-semibold text-text-primary">No blood glucose data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import glucose readings from a CGM or blood glucose meter connected to Apple Health.
        </p>
      </div>
    )
  }

  const mgdlValues = readings.map((r) => r.mgdl)
  const avgMgdl = Math.round(mgdlValues.reduce((a, b) => a + b, 0) / mgdlValues.length)
  const minMgdl = Math.min(...mgdlValues)
  const maxMgdl = Math.max(...mgdlValues)
  const latest = readings[readings.length - 1]
  const latestCat = classify(latest.mgdl, lowThreshold, highThreshold)

  // Estimated A1c from average glucose: eA1C = (avgMgdl + 46.7) / 28.7
  const estA1c = ((avgMgdl + 46.7) / 28.7).toFixed(1)

  // Low / in-range / high counts using configured thresholds
  const lowCount = readings.filter((r) => r.mgdl < lowThreshold).length
  const inRangeCount = readings.filter((r) => r.mgdl >= lowThreshold && r.mgdl <= highThreshold).length
  const highCount = readings.filter((r) => r.mgdl > highThreshold).length
  const timeInRange = Math.round((inRangeCount / readings.length) * 100)

  // Time series (last 200 points max)
  const trendData = readings.slice(-200).map((r) => ({
    date: fmtDate(r.timestamp),
    mgdl: r.mgdl,
    mmol: r.mmol,
  }))

  // Hourly average for pattern analysis
  const hourlyMap: Record<number, number[]> = {}
  for (const r of readings) {
    if (!hourlyMap[r.hour]) hourlyMap[r.hour] = []
    hourlyMap[r.hour].push(r.mgdl)
  }
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const vals = hourlyMap[h]
    if (!vals || !vals.length) return null
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return {
      hour: fmtHour(h),
      avgMgdl: Math.round(avg),
      avgMmol: Math.round((avg / MGDL_TO_MMOL) * 10) / 10,
    }
  }).filter(Boolean) as { hour: string; avgMgdl: number; avgMmol: number }[]

  const trendKey = unit === 'mmol' ? 'mmol' : 'mgdl'
  const hourlyKey = unit === 'mmol' ? 'avgMmol' : 'avgMgdl'
  const yDomain = unit === 'mmol' ? [2.2, 16.7] : [40, 300]
  const yDomainHourly = unit === 'mmol' ? [3.3, 11.1] : [60, 200]
  const refLow = toUnit(lowThreshold, unit)
  const refNormal = toUnit(100, unit)
  const refHigh = toUnit(highThreshold, unit)

  // Time-in-range range labels with configurable thresholds
  const tirLowLabel = unit === 'mmol' ? `< ${(lowThreshold / MGDL_TO_MMOL).toFixed(1)} mmol/L` : `< ${lowThreshold} mg/dL`
  const tirInLabel = unit === 'mmol' ? `${(lowThreshold / MGDL_TO_MMOL).toFixed(1)}–${(highThreshold / MGDL_TO_MMOL).toFixed(1)} mmol/L` : `${lowThreshold}–${highThreshold} mg/dL`
  const tirHighLabel = unit === 'mmol' ? `> ${(highThreshold / MGDL_TO_MMOL).toFixed(1)} mmol/L` : `> ${highThreshold} mg/dL`

  return (
    <div className="space-y-6">
      {/* Time range and unit controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === range
                  ? 'bg-accent text-accent-foreground'
                  : 'border border-border bg-surface hover:bg-surface-secondary'
              } disabled:opacity-50`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Unit toggle */}
        <div className="flex gap-2">
          <button
            onClick={toggleUnit}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-surface hover:bg-surface-secondary transition-colors"
          >
            Show in <span className="text-accent">{unit === 'mgdl' ? 'mmol/L' : 'mg/dL'}</span>
          </button>
          <button
            onClick={() => setShowThresholdSettings(!showThresholdSettings)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-surface hover:bg-surface-secondary transition-colors"
            title="Configure alert thresholds"
          >
            ⚙️ Thresholds
          </button>
        </div>
      </div>

      {/* Alert threshold settings */}
      {showThresholdSettings && (
        <div className="flex flex-col gap-2 p-4 bg-zinc-800 rounded-xl border border-border">
          <h3 className="text-sm font-semibold text-white">Alert Thresholds</h3>
          <p className="text-xs text-zinc-400 mb-2">Customize your glucose alert boundaries (mg/dL)</p>
          <div className="flex gap-4 flex-wrap">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Low (mg/dL)
              <input 
                type="number" 
                min={40} 
                max={100} 
                value={lowThreshold}
                onChange={e => setLowThreshold(+e.target.value)}
                onBlur={saveThresholds}
                disabled={isSaving}
                className="bg-zinc-700 text-white rounded px-2 py-1 w-24 disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              High (mg/dL)
              <input 
                type="number" 
                min={120} 
                max={300} 
                value={highThreshold}
                onChange={e => setHighThreshold(+e.target.value)}
                onBlur={saveThresholds}
                disabled={isSaving}
                className="bg-zinc-700 text-white rounded px-2 py-1 w-24 disabled:opacity-50"
              />
            </label>
          </div>
          {isSaving && <p className="text-xs text-zinc-500">Saving...</p>}
        </div>
      )}

      {/* Latest reading */}
      <div className="bg-surface rounded-xl border border-border p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary mb-1">Latest Reading</p>
          <p className="text-4xl font-bold" style={{ color: latestCat.color }}>
            {fmtVal(latest.mgdl, unit)} <span className="text-lg text-text-secondary">{unitLabel(unit)}</span>
          </p>
          <p className="text-sm text-text-secondary">
            {unit === 'mgdl' ? `${latest.mmol} mmol/L` : `${Math.round(latest.mgdl)} mg/dL`}
          </p>
          <p className="text-xs text-text-secondary mt-1">{fmtDateTime(latest.timestamp)}</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-surface-secondary border border-border" style={{ color: latestCat.color }}>
            {latestCat.label}
          </span>
          <p className="text-xs text-text-secondary mt-3">Est. A1c</p>
          <p className="text-xl font-bold text-purple-400">{estA1c}%</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{fmtVal(avgMgdl, unit)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg ({unitLabel(unit)})</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-xl font-bold ${timeInRange >= 70 ? 'text-green-400' : timeInRange >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {timeInRange}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Time in Range</p>
          <p className="text-xs text-text-secondary opacity-60">{tirInLabel}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-blue-400">{fmtVal(minMgdl, unit)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Lowest ({unitLabel(unit)})</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-orange-400">{fmtVal(maxMgdl, unit)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Highest ({unitLabel(unit)})</p>
        </div>
      </div>

      {/* Time in range breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Time in Range Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: `Low (${tirLowLabel})`, count: lowCount, color: '#60a5fa' },
            { label: `In Range (${tirInLabel})`, count: inRangeCount, color: '#4ade80' },
            { label: `High (${tirHighLabel})`, count: highCount, color: '#fb923c' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-40 shrink-0 text-xs font-medium" style={{ color }}>{label}</div>
              <div className="flex-1 h-4 bg-surface-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(count / readings.length) * 100}%`, backgroundColor: color + '99' }} />
              </div>
              <div className="text-xs text-text-secondary w-16 text-right shrink-0">
                {count} ({Math.round((count / readings.length) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      {trendData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Glucose Trend ({unitLabel(unit)})</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={yDomain} width={36} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} ${unitLabel(unit)}`, 'Glucose']} />
              <ReferenceLine y={refLow} stroke="rgba(96,165,250,0.4)" strokeDasharray="4 3"
                label={{ value: String(refLow), position: 'insideTopRight', fontSize: 9, fill: 'rgba(96,165,250,0.5)' }} />
              <ReferenceLine y={refNormal} stroke="rgba(74,222,128,0.3)" strokeDasharray="4 3"
                label={{ value: String(refNormal), position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.4)' }} />
              <ReferenceLine y={refHigh} stroke="rgba(251,146,60,0.3)" strokeDasharray="4 3"
                label={{ value: String(refHigh), position: 'insideTopRight', fontSize: 9, fill: 'rgba(251,146,60,0.4)' }} />
              <Area type="monotone" dataKey={trendKey} stroke="#a78bfa" fill="rgba(167,139,250,0.1)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hourly pattern */}
      {hourlyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Average by Time of Day ({unitLabel(unit)})</h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={hourlyData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={yDomainHourly} width={36} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} ${unitLabel(unit)}`, 'Avg glucose']} />
              <ReferenceLine y={refLow} stroke="rgba(96,165,250,0.3)" strokeDasharray="3 2" />
              <ReferenceLine y={refHigh} stroke="rgba(251,146,60,0.3)" strokeDasharray="3 2" />
              <Area type="monotone" dataKey={hourlyKey} stroke="#c084fc" fill="rgba(192,132,252,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reference guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Glucose reference ranges</p>
        <div className="space-y-2">
          {[
            { label: 'Hypoglycemia', range: unit === 'mmol' ? '< 3.9 mmol/L (< 70 mg/dL)' : '< 70 mg/dL (< 3.9 mmol/L)', color: 'text-blue-400', detail: 'Low blood sugar. May cause dizziness, confusion. Treat immediately with fast-acting carbs.' },
            { label: 'Normal fasting', range: unit === 'mmol' ? '3.9–5.5 mmol/L (70–99 mg/dL)' : '70–99 mg/dL (3.9–5.5 mmol/L)', color: 'text-green-400', detail: 'Healthy fasting range. Post-meal: up to ~140 mg/dL (7.8 mmol/L) is typical.' },
            { label: 'Pre-diabetes', range: unit === 'mmol' ? '5.6–6.9 mmol/L (100–125 mg/dL)' : '100–125 mg/dL (5.6–6.9 mmol/L)', color: 'text-yellow-400', detail: 'Impaired fasting glucose. Lifestyle changes can prevent progression to diabetes.' },
            { label: 'Diabetes', range: unit === 'mmol' ? '≥ 7.0 mmol/L (≥ 126 mg/dL)' : '≥ 126 mg/dL (≥ 7.0 mmol/L)', color: 'text-red-400', detail: 'Consistently high glucose. Requires medical evaluation and management.' },
            { label: 'Time in Range goal (CGM)', range: unit === 'mmol' ? '3.9–10.0 mmol/L ≥ 70% of time' : '70–180 mg/dL ≥ 70% of time', color: 'text-purple-400', detail: 'ADA target for people with diabetes. Higher TIR is associated with fewer complications.' },
          ].map(({ label, range, color, detail }) => (
            <div key={label}>
              <p className="font-medium text-text-primary"><span className={color}>{label}</span> — <span className="font-mono">{range}</span></p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1 border-t border-border">
          Estimated A1c uses the formula: eA1C = (avg glucose + 46.7) / 28.7 (ADA 2008). For diagnostic purposes only — consult your healthcare provider.
        </p>
      </div>

      {/* Recent readings */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Readings</h2>
        {[...readings].reverse().slice(0, 20).map((r, i) => {
          const cat = classify(r.mgdl, lowThreshold, highThreshold)
          return (
            <div key={i} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-text-secondary">{fmtDateTime(r.timestamp)}</p>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: cat.color }}>{fmtVal(r.mgdl, unit)} {unitLabel(unit)}</p>
                <p className="text-xs text-text-secondary">
                  {unit === 'mgdl' ? `${r.mmol} mmol/L` : `${Math.round(r.mgdl)} mg/dL`} · {cat.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
