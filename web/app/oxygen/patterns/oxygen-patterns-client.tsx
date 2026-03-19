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
  Legend,
} from 'recharts'

export interface HourBucketSpo2 {
  label: string
  count: number
  avgPct: number | null
}

export interface DowSpo2Stat {
  label: string
  count: number
  avgPct: number | null
  normalPct: number | null
}

export interface MonthSpo2Stat {
  label: string
  avgPct: number
  minPct: number
  normalPct: number
  count: number
}

export interface OxygenPatternData {
  totalReadings: number
  avgPct: number
  minPct: number
  maxPct: number
  normalCount: number
  mildCount: number
  lowCount: number
  nightAvg: number | null
  dayAvg: number | null
  nightCount: number
  dayCount: number
  hourBuckets: HourBucketSpo2[]
  dowData: DowSpo2Stat[]
  monthData: MonthSpo2Stat[]
}

function spo2Color(pct: number): string {
  if (pct >= 95) return '#22c55e'
  if (pct >= 90) return '#f97316'
  return '#ef4444'
}

function spo2TextClass(pct: number): string {
  if (pct >= 95) return 'text-green-400'
  if (pct >= 90) return 'text-orange-400'
  return 'text-red-400'
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function OxygenPatternsClient({ data }: { data: OxygenPatternData }) {
  const {
    totalReadings, avgPct, minPct, maxPct,
    normalCount, mildCount, lowCount,
    nightAvg, dayAvg, nightCount, dayCount,
    hourBuckets, dowData, monthData,
  } = data

  const dowWithData = dowData.filter((d) => d.avgPct !== null && d.count > 0)
  const hasMonthData = monthData.length >= 2
  const normalPct = Math.round((normalCount / totalReadings) * 100)
  const yDomain = [Math.max(85, minPct - 2), 100] as [number, number]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${spo2TextClass(avgPct)}`}>{avgPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Average SpO₂</p>
          <p className="text-xs text-text-secondary opacity-60">{totalReadings} readings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{normalPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Normal (≥95%)</p>
          <p className="text-xs text-text-secondary opacity-60">{normalCount} readings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{minPct}–{maxPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Range</p>
          <p className="text-xs text-text-secondary opacity-60">Past year</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          {lowCount > 0 ? (
            <>
              <p className="text-2xl font-bold text-red-400">{lowCount}</p>
              <p className="text-xs text-text-secondary mt-0.5">Low (&lt;90%) Events</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-green-400">0</p>
              <p className="text-xs text-text-secondary mt-0.5">Low Events</p>
            </>
          )}
          <p className="text-xs text-text-secondary opacity-60">Readings below 90%</p>
        </div>
      </div>

      {/* Zone breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">Zone Distribution</p>
        <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
          {normalCount > 0 && <div className="bg-green-500/70 flex-none" style={{ width: `${normalPct}%` }} />}
          {mildCount > 0 && <div className="bg-orange-500/70 flex-none" style={{ width: `${Math.round(mildCount / totalReadings * 100)}%` }} />}
          {lowCount > 0 && <div className="bg-red-500/70 flex-none" style={{ width: `${Math.round(lowCount / totalReadings * 100)}%` }} />}
        </div>
        <div className="space-y-2">
          {[
            { label: 'Normal (≥ 95%)', count: normalCount, color: 'bg-green-500/70', text: 'text-green-400' },
            { label: 'Mild (90–94%)', count: mildCount, color: 'bg-orange-500/70', text: 'text-orange-400' },
            { label: 'Low (< 90%)', count: lowCount, color: 'bg-red-500/70', text: 'text-red-400' },
          ].map((z) => z.count > 0 && (
            <div key={z.label} className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full flex-none ${z.color}`} />
              <span className="text-xs text-text-primary flex-1">{z.label}</span>
              <span className={`text-xs font-semibold w-8 text-right ${z.text}`}>
                {Math.round(z.count / totalReadings * 100)}%
              </span>
              <span className="text-xs text-text-secondary w-16 text-right opacity-60">{z.count} readings</span>
            </div>
          ))}
        </div>
      </div>

      {/* Night vs day */}
      {nightAvg !== null && dayAvg !== null && nightCount > 0 && dayCount > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Night vs Day</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-surface-secondary rounded-xl p-4">
              <p className="text-2xl mb-1">🌙</p>
              <p className={`text-xl font-bold ${spo2TextClass(nightAvg)}`}>{nightAvg}%</p>
              <p className="text-xs text-text-secondary">Overnight (10pm–6am)</p>
              <p className="text-xs text-text-secondary opacity-60">{nightCount} readings</p>
            </div>
            <div className="text-center bg-surface-secondary rounded-xl p-4">
              <p className="text-2xl mb-1">☀️</p>
              <p className={`text-xl font-bold ${spo2TextClass(dayAvg)}`}>{dayAvg}%</p>
              <p className="text-xs text-text-secondary">Daytime (6am–10pm)</p>
              <p className="text-xs text-text-secondary opacity-60">{dayCount} readings</p>
            </div>
          </div>
          {Math.abs(nightAvg - dayAvg) >= 1 && (
            <p className="text-xs text-text-secondary text-center mt-3 opacity-70">
              {nightAvg < dayAvg
                ? `SpO₂ drops ${(dayAvg - nightAvg).toFixed(1)}% overnight — may indicate sleep-disordered breathing`
                : `SpO₂ is ${(nightAvg - dayAvg).toFixed(1)}% higher overnight`}
            </p>
          )}
        </div>
      )}

      {/* Hourly pattern */}
      {hourBuckets.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">3-Hour Average SpO₂</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val}%`, 'Avg SpO₂']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={95} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Normal', fill: '#22c55e', fontSize: 10 }} />
              <ReferenceLine y={90} stroke="#f97316" strokeDasharray="4 2" strokeOpacity={0.5} />
              <Bar dataKey="avgPct" name="Avg SpO₂ (%)" radius={[3, 3, 0, 0]}>
                {hourBuckets.map((b, i) => (
                  <rect key={i} fill={b.avgPct !== null ? spo2Color(b.avgPct) : '#6b7280'} opacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-1 opacity-60">Green: ≥95% normal · Orange: 90–94%</p>
        </div>
      )}

      {/* DOW bar chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average SpO₂ by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val}%`, 'Avg SpO₂']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={95} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Bar dataKey="avgPct" name="Avg SpO₂ (%)" fill="#60a5fa" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW normal % */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Normal Range % by Day</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">% of readings ≥95% on each day</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.normalPct === null) return null
              const color = d.normalPct >= 90 ? '#22c55e' : d.normalPct >= 70 ? '#f59e0b' : '#ef4444'
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.normalPct}%`, backgroundColor: color + 'cc' }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color }}>{d.normalPct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average SpO₂</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val}%`, name === 'normalPct' ? 'Normal %' : 'Avg SpO₂']}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={95} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="avgPct" name="Avg SpO₂ (%)" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="minPct" name="Min SpO₂ (%)" stroke="#f97316" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">SpO₂ Reference</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-green-400 font-medium">≥ 95%</span> — Normal oxygen saturation</p>
          <p><span className="text-orange-400 font-medium">90–94%</span> — Mild hypoxemia; consult doctor if persistent</p>
          <p><span className="text-red-400 font-medium">&lt; 90%</span> — Clinically significant low; seek medical attention</p>
        </div>
        <p className="text-xs text-text-secondary opacity-60 mt-3">
          Apple Watch background readings may be lower at night (movement, cold, poor fit). Single low readings may not indicate a clinical issue — look for patterns.
        </p>
      </div>
    </div>
  )
}
