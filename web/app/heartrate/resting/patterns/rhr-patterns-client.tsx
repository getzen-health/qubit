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

export interface RHRPatternStats {
  latest: number
  avg: number
  min: number
  max: number
  totalDays: number
  currentClass: { label: string; color: string }
  trendDelta: number | null
  classDist: {
    athlete: number
    excellent: number
    good: number
    aboveAvg: number
    average: number
    belowAvg: number
  }
}

export interface DowRHRStat {
  label: string
  avgRHR: number | null
  count: number
}

export interface MonthRHRStat {
  label: string
  avgRHR: number
  minRHR: number
  maxRHR: number
  count: number
}

export interface DistBucket {
  label: string
  count: number
}

export interface RHRTrendPoint {
  date: string
  rhr: number
  rolling: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

function rhrColor(rhr: number): string {
  if (rhr < 45) return '#a855f7'
  if (rhr < 54) return '#22c55e'
  if (rhr < 62) return '#84cc16'
  if (rhr < 70) return '#f59e0b'
  if (rhr < 80) return '#f97316'
  return '#ef4444'
}

const FITNESS_CLASSES = [
  { label: 'Athlete', range: '< 45', color: '#a855f7', key: 'athlete' },
  { label: 'Excellent', range: '45–53', color: '#22c55e', key: 'excellent' },
  { label: 'Good', range: '54–61', color: '#84cc16', key: 'good' },
  { label: 'Above Avg', range: '62–69', color: '#f59e0b', key: 'aboveAvg' },
  { label: 'Average', range: '70–79', color: '#f97316', key: 'average' },
  { label: 'Below Avg', range: '≥ 80', color: '#ef4444', key: 'belowAvg' },
] as const

export function RHRPatternsClient({
  stats,
  dowData,
  monthData,
  distBuckets,
  trendData,
}: {
  stats: RHRPatternStats
  dowData: DowRHRStat[]
  monthData: MonthRHRStat[]
  distBuckets: DistBucket[]
  trendData: RHRTrendPoint[]
}) {
  const { latest, avg, min, max, totalDays, currentClass, trendDelta, classDist } = stats
  const yDomain = [Math.max(30, min - 3), Math.min(120, max + 3)] as [number, number]
  const dowWithData = dowData.filter((d) => d.avgRHR !== null && d.count > 0)

  const trendText =
    trendDelta === null ? null
    : trendDelta <= -1 ? { text: `${trendDelta} bpm improving`, color: 'text-green-400' }
    : trendDelta >= 1 ? { text: `+${trendDelta} bpm rising`, color: 'text-red-400' }
    : { text: 'Stable trend', color: 'text-text-secondary' }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: currentClass.color }}>{latest}</p>
          <p className="text-xs text-text-secondary mt-0.5">Latest RHR (bpm)</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: currentClass.color }}>{currentClass.label}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: rhrColor(avg) }}>{avg}</p>
          <p className="text-xs text-text-secondary mt-0.5">Annual Average</p>
          <p className="text-xs text-text-secondary opacity-60">{totalDays} days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{min}–{max}</p>
          <p className="text-xs text-text-secondary mt-0.5">Range (bpm)</p>
          <p className="text-xs text-text-secondary opacity-60">past year</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          {trendText ? (
            <>
              <p className={`text-base font-bold ${trendText.color}`}>{trendText.text.split(' ')[0]}</p>
              <p className="text-xs text-text-secondary mt-0.5">30-Day Trend</p>
              <p className="text-xs text-text-secondary opacity-60">vs prior 30 days</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-text-primary">—</p>
              <p className="text-xs text-text-secondary">Trend</p>
            </>
          )}
        </div>
      </div>

      {/* Fitness class distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">Fitness Classification Breakdown</p>
        <div className="space-y-2">
          {FITNESS_CLASSES.map((cls) => {
            const count = classDist[cls.key]
            const pct = Math.round(count / totalDays * 100)
            const isCurrent = cls.label === currentClass.label
            return (
              <div key={cls.label} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${isCurrent ? 'bg-surface-secondary' : ''}`}>
                <span className="w-3 h-3 rounded-full flex-none" style={{ backgroundColor: cls.color + '99' }} />
                <span className={`text-xs flex-1 ${isCurrent ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                  {cls.label}
                </span>
                <span className="text-xs text-text-secondary opacity-60 w-12 text-center">{cls.range} bpm</span>
                <div className="w-24 bg-surface-secondary rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cls.color + '99' }} />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color: cls.color }}>{pct}%</span>
                {isCurrent && <span className="text-xs" style={{ color: cls.color }}>←</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* 90-day trend chart */}
      {trendData.length >= 14 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">90-Day Trend</p>
          {trendText && (
            <p className={`text-xs ${trendText.color} mb-3 opacity-80`}>{trendText.text}</p>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rhrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={false} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} bpm`, name === 'rolling' ? '7-day avg' : 'Daily']}
                contentStyle={tooltipStyle}
                labelFormatter={(l) => l}
              />
              {/* Fitness class reference lines */}
              <ReferenceLine y={45} stroke="#a855f7" strokeDasharray="3 2" strokeOpacity={0.3} label={{ value: 'Athlete', fill: '#a855f7', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={54} stroke="#22c55e" strokeDasharray="3 2" strokeOpacity={0.3} label={{ value: 'Excellent', fill: '#22c55e', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={62} stroke="#84cc16" strokeDasharray="3 2" strokeOpacity={0.3} label={{ value: 'Good', fill: '#84cc16', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 2" strokeOpacity={0.3} />
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 2" strokeOpacity={0.3} />
              <Area type="monotone" dataKey="rhr" stroke="#ef4444" strokeWidth={0} fill="url(#rhrGrad)" dot={false} />
              <Line type="monotone" dataKey="rolling" name="7-day avg" stroke="#ef4444" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average RHR by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} bpm`, 'Avg RHR']}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="avgRHR" name="Avg RHR" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribution */}
      {distBuckets.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">RHR Distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={distBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} days`, 'Days']}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="count" name="Days" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly trend */}
      {monthData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Avg Resting HR</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} bpm`, name]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="avgRHR" name="Avg RHR (bpm)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="minRHR" name="Min RHR (bpm)" stroke="#22c55e" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Resting Heart Rate Reference</p>
        <div className="space-y-1 text-xs text-text-secondary">
          {FITNESS_CLASSES.map((cls) => (
            <p key={cls.label}>
              <span className="font-medium" style={{ color: cls.color }}>{cls.label} ({cls.range} bpm)</span>
              {cls.label === 'Athlete' ? ' · Elite endurance athletes' :
               cls.label === 'Excellent' ? ' · Very fit, regular cardio training' :
               cls.label === 'Good' ? ' · Good cardiovascular fitness' :
               cls.label === 'Above Avg' ? ' · Active lifestyle' :
               cls.label === 'Average' ? ' · Typical sedentary adult' :
               ' · May indicate deconditioning or health issues'}
            </p>
          ))}
        </div>
        <p className="text-xs text-text-secondary opacity-60 mt-3">
          Apple Watch measures resting HR throughout the day when you are still. Lower values generally indicate better cardiovascular fitness. Temporary elevation can indicate illness, stress, or inadequate recovery.
        </p>
      </div>
    </div>
  )
}
