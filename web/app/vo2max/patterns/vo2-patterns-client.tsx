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
  Legend,
  AreaChart,
  Area,
} from 'recharts'

export interface VO2PatternStats {
  latest: number
  avg: number
  min: number
  max: number
  totalReadings: number
  currentLevel: { label: string; color: string }
  trendDelta: number | null
}

export interface WeeklyPoint {
  date: string
  vo2: number
}

export interface MonthVO2Stat {
  label: string
  shortLabel: string
  avgVO2: number
  minVO2: number
  maxVO2: number
  level: string
  levelColor: string
  count: number
}

export interface LevelHistoryPoint {
  label: string
  level: string
  color: string
  vo2: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

const FITNESS_LEVELS = [
  { label: 'Elite', threshold: 59, color: '#a855f7' },
  { label: 'Excellent', threshold: 51, color: '#22c55e' },
  { label: 'Good', threshold: 44, color: '#84cc16' },
  { label: 'Average', threshold: 38, color: '#f59e0b' },
  { label: 'Below Avg', threshold: 30, color: '#f97316' },
  { label: 'Poor', threshold: 0, color: '#ef4444' },
]

function getLevelColor(label: string): string {
  return FITNESS_LEVELS.find((l) => l.label === label)?.color ?? '#6b7280'
}

export function VO2PatternClient({
  stats,
  weeklyPoints,
  monthData,
  levelHistory,
}: {
  stats: VO2PatternStats
  weeklyPoints: WeeklyPoint[]
  monthData: MonthVO2Stat[]
  levelHistory: LevelHistoryPoint[]
}) {
  const { latest, avg, min, max, totalReadings, currentLevel, trendDelta } = stats
  const yDomain = [Math.max(20, min - 3), Math.min(80, max + 3)] as [number, number]

  const trendText =
    trendDelta === null ? null
    : trendDelta >= 1 ? { text: `+${trendDelta} improving`, color: 'text-green-400' }
    : trendDelta <= -1 ? { text: `${trendDelta} declining`, color: 'text-red-400' }
    : { text: 'Stable', color: 'text-text-secondary' }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: currentLevel.color }}>{latest}</p>
          <p className="text-xs text-text-secondary mt-0.5">Latest VO₂ Max</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: currentLevel.color }}>{currentLevel.label}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{avg}</p>
          <p className="text-xs text-text-secondary mt-0.5">2-Year Average</p>
          <p className="text-xs text-text-secondary opacity-60">{totalReadings} readings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{min}–{max}</p>
          <p className="text-xs text-text-secondary mt-0.5">Range</p>
          <p className="text-xs text-text-secondary opacity-60">all time</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          {trendText ? (
            <>
              <p className={`text-base font-bold ${trendText.color}`}>{trendText.text.split(' ')[0]}</p>
              <p className="text-xs text-text-secondary mt-0.5">90-Day Trend</p>
              <p className="text-xs text-text-secondary opacity-60">vs prior 90 days</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-text-primary">—</p>
              <p className="text-xs text-text-secondary">Trend</p>
            </>
          )}
        </div>
      </div>

      {/* Fitness Level Classification */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">Fitness Level Scale</p>
        <div className="space-y-2">
          {FITNESS_LEVELS.map((lvl) => {
            const isCurrentLevel = lvl.label === currentLevel.label
            return (
              <div key={lvl.label} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${isCurrentLevel ? 'bg-surface-secondary' : ''}`}>
                <span className="w-3 h-3 rounded-full flex-none" style={{ backgroundColor: lvl.color + '99' }} />
                <span className={`text-xs flex-1 ${isCurrentLevel ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                  {lvl.label}
                </span>
                <span className="text-xs text-text-secondary opacity-60 w-16 text-right">
                  {lvl.label === 'Elite' ? '≥ 59'
                    : lvl.label === 'Excellent' ? '51–58'
                    : lvl.label === 'Good' ? '44–50'
                    : lvl.label === 'Average' ? '38–43'
                    : lvl.label === 'Below Avg' ? '30–37'
                    : '< 30'} ml/kg/min
                </span>
                {isCurrentLevel && (
                  <span className="text-xs font-bold" style={{ color: lvl.color }}>← You</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly trend chart */}
      {weeklyPoints.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly VO₂ Max Trend</p>
          {trendText && (
            <p className={`text-xs ${trendText.color} mb-3 opacity-80`}>{trendText.text} vs prior 90 days</p>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyPoints} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vo2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={false} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} ml/kg/min`, 'VO₂ Max']}
                contentStyle={tooltipStyle}
                labelFormatter={(l) => l}
              />
              {/* Level reference lines */}
              <ReferenceLine y={59} stroke="#a855f7" strokeDasharray="3 2" strokeOpacity={0.3} label={{ value: 'Elite', fill: '#a855f7', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={51} stroke="#22c55e" strokeDasharray="3 2" strokeOpacity={0.3} label={{ value: 'Excellent', fill: '#22c55e', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={44} stroke="#84cc16" strokeDasharray="3 2" strokeOpacity={0.3} label={{ value: 'Good', fill: '#84cc16', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={38} stroke="#f59e0b" strokeDasharray="3 2" strokeOpacity={0.3} label={{ value: 'Avg', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />
              <Area type="monotone" dataKey="vo2" stroke="#22c55e" strokeWidth={2} fill="url(#vo2Grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly average */}
      {monthData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly VO₂ Max (avg + range)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="shortLabel" tick={{ fontSize: 10 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} ml/kg/min`, name]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="avgVO2" name="Avg VO₂ Max" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="minVO2" name="Min" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="maxVO2" name="Max" stroke="#a855f7" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fitness level timeline */}
      {levelHistory.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Fitness Level History</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">How your fitness classification has changed over time</p>
          <div className="flex gap-1 flex-wrap">
            {levelHistory.map((pt, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getLevelColor(pt.level) + '99' }}
                  title={`${pt.label}: ${pt.vo2} ml/kg/min (${pt.level})`}
                >
                  {pt.vo2}
                </div>
                <span className="text-[9px] text-text-secondary">{pt.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap mt-3">
            {FITNESS_LEVELS.filter((l) => levelHistory.some((p) => p.level === l.label)).map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-text-secondary">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">About VO₂ Max</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p>VO₂ Max (ml/kg/min) measures the maximum rate of oxygen your body can use during exercise — a key indicator of cardiorespiratory fitness and longevity.</p>
          <p className="mt-2">Apple Watch estimates VO₂ Max from heart rate and pace data during outdoor walks, runs, or hikes. Results are most accurate during vigorous effort.</p>
          <p className="mt-2 opacity-60">Higher VO₂ Max is associated with reduced cardiovascular disease risk, slower aging, and greater endurance capacity.</p>
        </div>
      </div>
    </div>
  )
}
