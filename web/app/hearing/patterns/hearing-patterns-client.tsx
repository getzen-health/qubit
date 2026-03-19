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

export interface DowHearingStat {
  label: string
  count: number
  avgDb: number | null
  safePct: number | null
}

export interface HourBucketHearing {
  label: string
  count: number
  avgDb: number | null
}

export interface MonthHearingStat {
  label: string
  avgDb: number
  maxDb: number
  loudPct: number
  count: number
}

export interface HearingPatternData {
  totalReadings: number
  avgDb: number
  maxDb: number
  safeCount: number
  moderateCount: number
  loudCount: number
  dangerousCount: number
  headphoneAvg: number | null
  envAvg: number | null
  headphoneCount: number
  envCount: number
  dowData: DowHearingStat[]
  hourBuckets: HourBucketHearing[]
  monthData: MonthHearingStat[]
}

function dbColor(db: number): string {
  if (db < 70) return '#22c55e'   // green - safe
  if (db < 80) return '#eab308'   // yellow - moderate
  if (db < 90) return '#f97316'   // orange - loud
  return '#ef4444'                 // red - dangerous
}

function dbTextClass(db: number): string {
  if (db < 70) return 'text-green-400'
  if (db < 80) return 'text-yellow-400'
  if (db < 90) return 'text-orange-400'
  return 'text-red-400'
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function HearingPatternsClient({ data }: { data: HearingPatternData }) {
  const {
    totalReadings, avgDb, maxDb,
    safeCount, moderateCount, loudCount, dangerousCount,
    headphoneAvg, envAvg, headphoneCount, envCount,
    dowData, hourBuckets, monthData,
  } = data

  const dowWithData = dowData.filter((d) => d.avgDb !== null && d.count > 0)
  const hasMonthData = monthData.length >= 2
  const safePct = Math.round(safeCount / totalReadings * 100)
  const yMin = 50
  const yMax = Math.min(110, Math.ceil(maxDb / 10) * 10 + 5)
  const yDomain = [yMin, yMax] as [number, number]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${dbTextClass(avgDb)}`}>{avgDb}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg dB</p>
          <p className="text-xs text-text-secondary opacity-60">{totalReadings} readings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{safePct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Safe (&lt;70 dB)</p>
          <p className="text-xs text-text-secondary opacity-60">{safeCount} readings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${dbTextClass(maxDb)}`}>{maxDb}</p>
          <p className="text-xs text-text-secondary mt-0.5">Peak dB</p>
          <p className="text-xs text-text-secondary opacity-60">Past year max</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          {loudCount + dangerousCount > 0 ? (
            <>
              <p className="text-2xl font-bold text-orange-400">{loudCount + dangerousCount}</p>
              <p className="text-xs text-text-secondary mt-0.5">Loud Events</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-green-400">0</p>
              <p className="text-xs text-text-secondary mt-0.5">Loud Events</p>
            </>
          )}
          <p className="text-xs text-text-secondary opacity-60">Readings ≥80 dB</p>
        </div>
      </div>

      {/* Zone breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">Noise Zone Distribution</p>
        <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
          {safeCount > 0 && <div className="bg-green-500/70 flex-none" style={{ width: `${safePct}%` }} />}
          {moderateCount > 0 && <div className="bg-yellow-500/70 flex-none" style={{ width: `${Math.round(moderateCount / totalReadings * 100)}%` }} />}
          {loudCount > 0 && <div className="bg-orange-500/70 flex-none" style={{ width: `${Math.round(loudCount / totalReadings * 100)}%` }} />}
          {dangerousCount > 0 && <div className="bg-red-500/70 flex-none" style={{ width: `${Math.round(dangerousCount / totalReadings * 100)}%` }} />}
        </div>
        <div className="space-y-2">
          {[
            { label: 'Safe (< 70 dB)', count: safeCount, color: 'bg-green-500/70', text: 'text-green-400' },
            { label: 'Moderate (70–79 dB)', count: moderateCount, color: 'bg-yellow-500/70', text: 'text-yellow-400' },
            { label: 'Loud (80–89 dB)', count: loudCount, color: 'bg-orange-500/70', text: 'text-orange-400' },
            { label: 'Dangerous (≥ 90 dB)', count: dangerousCount, color: 'bg-red-500/70', text: 'text-red-400' },
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

      {/* Headphone vs Environmental */}
      {headphoneAvg !== null && envAvg !== null && headphoneCount > 0 && envCount > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Source Comparison</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-surface-secondary rounded-xl p-4">
              <p className="text-2xl mb-1">🎧</p>
              <p className={`text-xl font-bold ${dbTextClass(headphoneAvg)}`}>{headphoneAvg} dB</p>
              <p className="text-xs text-text-secondary">Headphone exposure</p>
              <p className="text-xs text-text-secondary opacity-60">{headphoneCount} readings</p>
            </div>
            <div className="text-center bg-surface-secondary rounded-xl p-4">
              <p className="text-2xl mb-1">🌍</p>
              <p className={`text-xl font-bold ${dbTextClass(envAvg)}`}>{envAvg} dB</p>
              <p className="text-xs text-text-secondary">Environmental noise</p>
              <p className="text-xs text-text-secondary opacity-60">{envCount} readings</p>
            </div>
          </div>
          {headphoneAvg > envAvg + 5 && (
            <p className="text-xs text-text-secondary text-center mt-3 opacity-70">
              Headphone exposure is {(headphoneAvg - envAvg).toFixed(1)} dB higher than your environment — consider lowering volume
            </p>
          )}
        </div>
      )}

      {/* Hourly pattern */}
      {hourBuckets.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">3-Hour Average Exposure</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} dB`, 'Avg Exposure']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={80} stroke="#f97316" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Loud', fill: '#f97316', fontSize: 10 }} />
              <ReferenceLine y={70} stroke="#eab308" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Bar dataKey="avgDb" name="Avg dB" fill="#22c55e" opacity={0.75} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-1 opacity-60">Green zone: safe (&lt;70 dB) · Yellow line: moderate · Orange line: loud</p>
        </div>
      )}

      {/* DOW chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average Exposure by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} dB`, 'Avg Exposure']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={80} stroke="#f97316" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={70} stroke="#eab308" strokeDasharray="4 2" strokeOpacity={0.3} />
              <Bar dataKey="avgDb" name="Avg dB" fill="#22c55e" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW safe % */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Safe Hearing % by Day</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">% of readings below 70 dB on each day</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.safePct === null) return null
              const color = d.safePct >= 90 ? '#22c55e' : d.safePct >= 60 ? '#eab308' : '#ef4444'
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.safePct}%`, backgroundColor: color + 'cc' }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color }}>{d.safePct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average Exposure</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} dB`, name]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={80} stroke="#f97316" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={70} stroke="#eab308" strokeDasharray="4 2" strokeOpacity={0.3} />
              <Line type="monotone" dataKey="avgDb" name="Avg dB" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="maxDb" name="Max dB" stroke="#f97316" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">WHO Noise Exposure Guidelines</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-green-400 font-medium">&lt; 70 dB</span> — Safe for unlimited exposure (normal conversation ~60 dB)</p>
          <p><span className="text-yellow-400 font-medium">70–79 dB</span> — Moderate; safe for extended periods (city traffic ~75 dB)</p>
          <p><span className="text-orange-400 font-medium">80–89 dB</span> — Loud; limit daily exposure to 2 hours (busy restaurant ~85 dB)</p>
          <p><span className="text-red-400 font-medium">≥ 90 dB</span> — Dangerous; limit to 30 min without hearing protection (motorcycle ~95 dB)</p>
        </div>
        <p className="text-xs text-text-secondary opacity-60 mt-3">
          Noise-induced hearing loss is permanent and cumulative. Apple Watch and AirPods can track your audio exposure in real time. Readings represent the dB(A) weighted average for each period.
        </p>
      </div>
    </div>
  )
}
