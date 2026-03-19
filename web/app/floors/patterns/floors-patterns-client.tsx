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

export interface DowFloorsStat {
  label: string
  count: number
  avgFloors: number | null
  goalPct: number | null
}

export interface MonthFloorsStat {
  label: string
  avgFloors: number
  maxFloors: number
  goalPct: number
  count: number
}

export interface DistBucket {
  label: string
  count: number
  min: number
  max: number
}

export interface FloorsPatternData {
  totalDays: number
  avgFloors: number
  maxFloors: number
  totalFloors: number
  goalDays: number
  goal: number
  currentStreak: number
  longestStreak: number
  distBuckets: DistBucket[]
  dowData: DowFloorsStat[]
  monthData: MonthFloorsStat[]
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function FloorsPatternsClient({ data }: { data: FloorsPatternData }) {
  const {
    totalDays, avgFloors, maxFloors, totalFloors,
    goalDays, goal, currentStreak, longestStreak,
    distBuckets, dowData, monthData,
  } = data

  const dowWithData = dowData.filter((d) => d.avgFloors !== null && d.count > 0)
  const hasMonthData = monthData.length >= 2
  const goalPct = Math.round(goalDays / totalDays * 100)
  const yMax = Math.ceil(Math.max(maxFloors, goal + 5) / 5) * 5

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{avgFloors}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Floors/Day</p>
          <p className="text-xs text-text-secondary opacity-60">{totalDays} days tracked</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${goalPct >= 70 ? 'text-green-400' : goalPct >= 40 ? 'text-yellow-400' : 'text-orange-400'}`}>
            {goalPct}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Goal Days (≥{goal})</p>
          <p className="text-xs text-text-secondary opacity-60">{goalDays} of {totalDays} days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{maxFloors}</p>
          <p className="text-xs text-text-secondary mt-0.5">Best Day</p>
          <p className="text-xs text-text-secondary opacity-60">floors climbed</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{totalFloors.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Floors</p>
          <p className="text-xs text-text-secondary opacity-60">past year</p>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Goal Streaks</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center bg-surface-secondary rounded-xl p-3">
            <p className="text-2xl font-bold text-violet-400">{currentStreak}</p>
            <p className="text-xs text-text-secondary">Current streak</p>
            <p className="text-xs text-text-secondary opacity-60">consecutive goal days</p>
          </div>
          <div className="text-center bg-surface-secondary rounded-xl p-3">
            <p className="text-2xl font-bold text-violet-400">{longestStreak}</p>
            <p className="text-xs text-text-secondary">Longest streak</p>
            <p className="text-xs text-text-secondary opacity-60">consecutive goal days</p>
          </div>
        </div>

        {/* Goal progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>Goal achievement: {goalPct}%</span>
            <span>{goalDays}/{totalDays} days</span>
          </div>
          <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500/70 transition-all"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* DOW chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average Floors by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, yMax]} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} floors`, 'Avg Floors']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={goal} stroke="#a78bfa" strokeDasharray="4 2" strokeOpacity={0.6} label={{ value: `Goal (${goal})`, fill: '#a78bfa', fontSize: 10 }} />
              <Bar dataKey="avgFloors" name="Avg Floors" fill="#7c3aed" opacity={0.75} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW goal % */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Goal Rate by Day</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">% of days reaching {goal}+ floors on each day of week</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.goalPct === null) return null
              const color = d.goalPct >= 70 ? '#22c55e' : d.goalPct >= 40 ? '#eab308' : '#f97316'
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.goalPct}%`, backgroundColor: color + 'cc' }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color }}>{d.goalPct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Distribution */}
      {distBuckets.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Daily Floors Distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={distBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} days`, 'Days']}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="count" name="Days" fill="#7c3aed" opacity={0.75} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average Floors</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, yMax]} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} floors`, name]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={goal} stroke="#a78bfa" strokeDasharray="4 2" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="avgFloors" name="Avg Floors" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="maxFloors" name="Max Floors" stroke="#a78bfa" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly goal % */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Goal Rate</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">% of days per month reaching {goal}+ floors</p>
          <div className="space-y-2">
            {monthData.map((m) => {
              const color = m.goalPct >= 70 ? '#22c55e' : m.goalPct >= 40 ? '#eab308' : '#f97316'
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{m.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${m.goalPct}%`, backgroundColor: color + 'cc' }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color }}>{m.goalPct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">About Floors Climbed</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p>Apple Watch detects stair climbing using the barometric altimeter and accelerometer.</p>
          <p><span className="text-violet-400 font-medium">1 floor = ~3 meters</span> of elevation gain</p>
          <p><span className="text-violet-400 font-medium">10 floors/day</span> is the Apple Watch default goal (~30m elevation)</p>
          <p>Stair climbing burns more calories per minute than jogging and strengthens the cardiovascular system.</p>
        </div>
      </div>
    </div>
  )
}
