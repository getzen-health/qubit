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
  AreaChart,
  Area,
} from 'recharts'

export interface HourBucketResp {
  label: string
  count: number
  avgBpm: number | null
}

export interface DowRespStat {
  label: string
  count: number
  avgBpm: number | null
  normalPct: number | null
}

export interface MonthRespStat {
  label: string
  avgBpm: number
  minBpm: number
  maxBpm: number
  normalPct: number
  count: number
}

export interface RespiratoryPatternData {
  totalReadings: number
  avgBpm: number
  minBpm: number
  maxBpm: number
  normalCount: number
  lowCount: number
  highCount: number
  nightAvg: number | null
  dayAvg: number | null
  nightCount: number
  dayCount: number
  hourBuckets: HourBucketResp[]
  dowData: DowRespStat[]
  monthData: MonthRespStat[]
}

function respColor(bpm: number): string {
  if (bpm >= 12 && bpm <= 20) return '#22d3ee' // cyan - normal
  if (bpm < 12) return '#818cf8'               // indigo - low
  if (bpm <= 24) return '#fb923c'              // orange - slightly high
  return '#ef4444'                              // red - high
}

function respTextClass(bpm: number): string {
  if (bpm >= 12 && bpm <= 20) return 'text-cyan-400'
  if (bpm < 12) return 'text-indigo-400'
  if (bpm <= 24) return 'text-orange-400'
  return 'text-red-400'
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function RespiratoryPatternsClient({ data }: { data: RespiratoryPatternData }) {
  const {
    totalReadings, avgBpm, minBpm, maxBpm,
    normalCount, lowCount, highCount,
    nightAvg, dayAvg, nightCount, dayCount,
    hourBuckets, dowData, monthData,
  } = data

  const dowWithData = dowData.filter((d) => d.avgBpm !== null && d.count > 0)
  const hasMonthData = monthData.length >= 2
  const normalPct = Math.round((normalCount / totalReadings) * 100)
  const yMin = Math.max(8, minBpm - 1)
  const yMax = Math.min(30, maxBpm + 1)
  const yDomain = [yMin, yMax] as [number, number]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${respTextClass(avgBpm)}`}>{avgBpm}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg br/min</p>
          <p className="text-xs text-text-secondary opacity-60">{totalReadings} readings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{normalPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Normal (12–20)</p>
          <p className="text-xs text-text-secondary opacity-60">{normalCount} readings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{minBpm}–{maxBpm}</p>
          <p className="text-xs text-text-secondary mt-0.5">Range</p>
          <p className="text-xs text-text-secondary opacity-60">br/min · past year</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          {highCount > 0 ? (
            <>
              <p className="text-2xl font-bold text-orange-400">{highCount}</p>
              <p className="text-xs text-text-secondary mt-0.5">Elevated (&gt;20)</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-cyan-400">0</p>
              <p className="text-xs text-text-secondary mt-0.5">Elevated Events</p>
            </>
          )}
          <p className="text-xs text-text-secondary opacity-60">Readings above 20 br/min</p>
        </div>
      </div>

      {/* Zone breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">Zone Distribution</p>
        <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
          {normalCount > 0 && <div className="bg-cyan-500/70 flex-none" style={{ width: `${normalPct}%` }} />}
          {lowCount > 0 && <div className="bg-indigo-500/70 flex-none" style={{ width: `${Math.round(lowCount / totalReadings * 100)}%` }} />}
          {highCount > 0 && <div className="bg-orange-500/70 flex-none" style={{ width: `${Math.round(highCount / totalReadings * 100)}%` }} />}
        </div>
        <div className="space-y-2">
          {[
            { label: 'Normal (12–20 br/min)', count: normalCount, color: 'bg-cyan-500/70', text: 'text-cyan-400' },
            { label: 'Low (< 12 br/min)', count: lowCount, color: 'bg-indigo-500/70', text: 'text-indigo-400' },
            { label: 'Elevated (> 20 br/min)', count: highCount, color: 'bg-orange-500/70', text: 'text-orange-400' },
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
              <p className={`text-xl font-bold ${respTextClass(nightAvg)}`}>{nightAvg}</p>
              <p className="text-xs text-text-secondary">Overnight (10pm–6am)</p>
              <p className="text-xs text-text-secondary opacity-60">{nightCount} readings · br/min</p>
            </div>
            <div className="text-center bg-surface-secondary rounded-xl p-4">
              <p className="text-2xl mb-1">☀️</p>
              <p className={`text-xl font-bold ${respTextClass(dayAvg)}`}>{dayAvg}</p>
              <p className="text-xs text-text-secondary">Daytime (6am–10pm)</p>
              <p className="text-xs text-text-secondary opacity-60">{dayCount} readings · br/min</p>
            </div>
          </div>
          {Math.abs(nightAvg - dayAvg) >= 0.5 && (
            <p className="text-xs text-text-secondary text-center mt-3 opacity-70">
              {nightAvg < dayAvg
                ? `Breathing rate ${(dayAvg - nightAvg).toFixed(1)} br/min lower overnight — consistent with relaxed sleep`
                : `Breathing rate ${(nightAvg - dayAvg).toFixed(1)} br/min higher overnight — may indicate disrupted sleep`}
            </p>
          )}
        </div>
      )}

      {/* Hourly pattern */}
      {hourBuckets.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">3-Hour Average Rate</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} br/min`, 'Avg Rate']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={20} stroke="#fb923c" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Upper Normal', fill: '#fb923c', fontSize: 10 }} />
              <ReferenceLine y={12} stroke="#818cf8" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Lower Normal', fill: '#818cf8', fontSize: 10 }} />
              <Bar dataKey="avgBpm" name="Avg Rate (br/min)" fill="#22d3ee" opacity={0.75} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-1 opacity-60">Cyan: normal range (12–20 br/min)</p>
        </div>
      )}

      {/* DOW bar chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average Rate by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} br/min`, 'Avg Rate']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={20} stroke="#fb923c" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={12} stroke="#818cf8" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Bar dataKey="avgBpm" name="Avg Rate (br/min)" fill="#22d3ee" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW normal % */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Normal Range % by Day</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">% of readings in 12–20 br/min range each day</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.normalPct === null) return null
              const color = d.normalPct >= 90 ? '#22d3ee' : d.normalPct >= 70 ? '#fb923c' : '#ef4444'
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
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average Rate</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} br/min`, name]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={20} stroke="#fb923c" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={12} stroke="#818cf8" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="avgBpm" name="Avg Rate (br/min)" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="minBpm" name="Min Rate (br/min)" stroke="#818cf8" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Respiratory Rate Reference</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-indigo-400 font-medium">&lt; 12 br/min</span> — Below normal (bradypnea); may indicate deep sleep or fitness</p>
          <p><span className="text-cyan-400 font-medium">12–20 br/min</span> — Normal resting respiratory rate</p>
          <p><span className="text-orange-400 font-medium">20–24 br/min</span> — Slightly elevated; common with activity or stress</p>
          <p><span className="text-red-400 font-medium">&gt; 24 br/min</span> — Elevated; consult doctor if persistent</p>
        </div>
        <p className="text-xs text-text-secondary opacity-60 mt-3">
          Apple Watch measures respiratory rate primarily during sleep. Daytime readings may be less frequent. A consistently elevated rate can be an early indicator of illness or cardiovascular stress.
        </p>
      </div>
    </div>
  )
}
