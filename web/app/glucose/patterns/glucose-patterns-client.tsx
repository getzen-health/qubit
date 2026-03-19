'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, ReferenceLine,
} from 'recharts'

export interface RangeDist {
  label: string
  range: string
  count: number
  pct: number
  colorClass: string
}

export interface DowGlucoseStat {
  label: string
  count: number
  avgMgdl: number | null
  inRangePct: number | null
}

export interface HourBucket {
  label: string
  count: number
  avgMgdl: number | null
}

export interface TimePeriodGlucose {
  label: string
  icon: string
  time: string
  avg: number | null
  count: number
}

export interface MonthGlucoseStat {
  label: string
  count: number
  avgMgdl: number
  minMgdl: number
  maxMgdl: number
  inRangePct: number
}

export interface GlucosePatternData {
  totalReadings: number
  avgMgdl: number
  minMgdl: number
  maxMgdl: number
  estA1c: number
  inRangePct: number
  rangeDist: RangeDist[]
  dowData: DowGlucoseStat[]
  hourBuckets: HourBucket[]
  timePeriods: TimePeriodGlucose[]
  monthData: MonthGlucoseStat[]
  targetLow: number
  targetHigh: number
}

function glucoseColor(mgdl: number, targetHigh: number): string {
  if (mgdl < 70) return '#ef4444'
  if (mgdl <= targetHigh) return '#22c55e'
  if (mgdl <= 180) return '#f59e0b'
  return '#dc2626'
}

function a1cColor(a1c: number): string {
  if (a1c < 5.7) return 'text-green-400'
  if (a1c < 6.5) return 'text-amber-400'
  return 'text-red-400'
}

function a1cLabel(a1c: number): string {
  if (a1c < 5.7) return 'Normal'
  if (a1c < 6.5) return 'Pre-diabetic'
  return 'Diabetic range'
}

export function GlucosePatternsClient({ data }: { data: GlucosePatternData }) {
  const {
    totalReadings, avgMgdl, minMgdl, maxMgdl, estA1c, inRangePct,
    rangeDist, dowData, hourBuckets, timePeriods, monthData, targetLow, targetHigh,
  } = data

  const dowWithData = dowData.filter((d) => d.count > 0 && d.avgMgdl !== null)
  const hasMonthData = monthData.length >= 2

  const avgColor = glucoseColor(avgMgdl, targetHigh)
  const inRangeColor = inRangePct >= 70 ? 'text-green-400' : inRangePct >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: avgColor }}>{avgMgdl}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Glucose</p>
          <p className="text-xs text-text-secondary opacity-60">mg/dL</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${inRangeColor}`}>{inRangePct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Time in Range</p>
          <p className="text-xs text-text-secondary opacity-60">{targetLow}–{targetHigh} mg/dL</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${a1cColor(estA1c)}`}>{estA1c}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Est. A1C</p>
          <p className="text-xs text-text-secondary opacity-60">{a1cLabel(estA1c)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-base font-bold text-text-secondary">{minMgdl}–{maxMgdl}</p>
          <p className="text-xs text-text-secondary mt-0.5">Range</p>
          <p className="text-xs text-text-secondary opacity-60">{totalReadings} readings</p>
        </div>
      </div>

      {/* Time in range visual */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time in Range</p>
        <p className="text-xs text-text-secondary mb-4">ADA target: ≥70% in {targetLow}–{targetHigh} mg/dL</p>
        {/* Stacked bar visual */}
        <div className="flex h-6 rounded-full overflow-hidden mb-4 gap-0.5">
          {rangeDist.map((r) => r.pct > 0 && (
            <div
              key={r.label}
              className={`${r.colorClass} flex-none`}
              style={{ width: `${r.pct}%` }}
            />
          ))}
        </div>
        <div className="space-y-2">
          {rangeDist.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full flex-none ${r.colorClass}`} />
              <div className="flex-1">
                <span className="text-xs font-medium text-text-primary">{r.label}</span>
                <span className="text-xs text-text-secondary ml-2">{r.range} mg/dL</span>
              </div>
              <span className="text-xs font-semibold text-text-primary w-10 text-right">{r.pct}%</span>
              <span className="text-xs text-text-secondary w-10 text-right">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time of day periods */}
      {timePeriods.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Time of Day Averages</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {timePeriods.map((p) => (
              <div key={p.label} className="text-center">
                <p className="text-xl mb-1">{p.icon}</p>
                <p className="text-xs text-text-secondary">{p.label}</p>
                <p className="text-xs text-text-secondary opacity-60 mb-1">{p.time}</p>
                {p.avg !== null ? (
                  <>
                    <p className="text-sm font-bold" style={{ color: glucoseColor(p.avg, targetHigh) }}>
                      {p.avg} mg/dL
                    </p>
                    <p className="text-xs text-text-secondary opacity-60">{p.count} readings</p>
                  </>
                ) : (
                  <p className="text-sm text-text-secondary">—</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly pattern */}
      {hourBuckets.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">3-Hour Average Glucose</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={[50, 'dataMax + 10']} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} mg/dL`, 'Avg Glucose']}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <ReferenceLine y={targetLow} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.5} />
              <ReferenceLine y={targetHigh} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} />
              <Bar dataKey="avgMgdl" name="Avg Glucose" radius={[3, 3, 0, 0]}>
                {hourBuckets.map((b, i) => (
                  <rect key={i} fill={b.avgMgdl !== null ? glucoseColor(b.avgMgdl, targetHigh) : '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-1 opacity-60">
            Green line: {targetLow} · Amber line: {targetHigh} mg/dL
          </p>
        </div>
      )}

      {/* DOW bar chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average Glucose by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 'dataMax + 10']} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [
                  `${val}${name === 'inRangePct' ? '%' : ' mg/dL'}`,
                  name === 'inRangePct' ? 'In Range %' : 'Avg Glucose',
                ]}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={targetHigh} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Bar dataKey="avgMgdl" name="Avg Glucose (mg/dL)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW in-range bars */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">In-Range % by Day</p>
          <p className="text-xs text-text-secondary mb-4">Target: ≥70% of readings in {targetLow}–{targetHigh} mg/dL</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.inRangePct === null) return null
              const color = d.inRangePct >= 70 ? '#22c55e' : d.inRangePct >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.inRangePct}%`, backgroundColor: color + 'cc' }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color }}>{d.inRangePct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average Glucose</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [
                  `${val}${name === 'inRangePct' ? '%' : ' mg/dL'}`,
                  name === 'inRangePct' ? 'In Range %' : 'Avg Glucose',
                ]}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={targetHigh} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="avgMgdl" name="Avg Glucose (mg/dL)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="inRangePct" name="In Range %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 2" yAxisId={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
