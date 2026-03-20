'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeklyEntry {
  week: string
  sessions: number
  goalMet: boolean
}

interface SportEntry {
  sport: string
  sessions: number
  color: string
}

interface GoalsData {
  weeklyData: WeeklyEntry[]
  sportBreakdown: SportEntry[]
  weeklyGoal: number
  currentWeekSessions: number
  currentStreak: number
  weeksHit: number
  totalWeeks: number
  totalSessionsQuarter: number
}

interface WorkoutGoalsClientProps {
  data: GoalsData
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GREEN = '#22c55e'
const BLUE = '#3b82f6'
const YELLOW = '#eab308'
const ORANGE = '#f97316'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function CircularProgress({
  percent,
  size = 120,
  strokeWidth = 10,
  color,
  children,
}: {
  percent: number
  size?: number
  strokeWidth?: number
  color: string
  children?: React.ReactNode
}) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ─── Sport breakdown horizontal bar ──────────────────────────────────────────

function SportBar({ sport, sessions, maxSessions, color }: SportEntry & { maxSessions: number }) {
  const pct = Math.round((sessions / maxSessions) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-16 shrink-0 text-right">{sport}</span>
      <div className="flex-1 h-5 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        >
          {pct > 20 && (
            <span className="text-[10px] font-semibold text-white">{sessions}</span>
          )}
        </div>
      </div>
      {pct <= 20 && (
        <span className="text-xs font-medium text-text-secondary w-6 shrink-0">{sessions}</span>
      )}
    </div>
  )
}

// ─── Custom tooltip for weekly bar chart ─────────────────────────────────────

function WeeklyTooltip({ active, payload, label, goal }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  goal: number
}) {
  if (!active || !payload?.length) return null
  const count = payload[0].value
  return (
    <div style={tooltipStyle} className="px-3 py-2 rounded-lg">
      <p className="text-text-secondary mb-0.5">Week of {label}</p>
      <p className="font-semibold" style={{ color: count >= goal ? GREEN : BLUE }}>
        {count} session{count !== 1 ? 's' : ''}
      </p>
      <p className="text-xs text-text-secondary mt-0.5">
        {count >= goal ? 'Goal met ✓' : `${goal - count} short of goal`}
      </p>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function WorkoutGoalsClient({ data }: WorkoutGoalsClientProps) {
  const {
    weeklyData,
    sportBreakdown,
    weeklyGoal,
    currentWeekSessions,
    currentStreak,
    weeksHit,
    totalWeeks,
    totalSessionsQuarter,
  } = data

  const progressPercent = Math.min(100, Math.round((currentWeekSessions / weeklyGoal) * 100))
  const goalMet = currentWeekSessions >= weeklyGoal
  const progressColor = goalMet ? GREEN : BLUE
  const completionRate = Math.round((weeksHit / totalWeeks) * 100)
  const streakColor = currentStreak >= 4 ? ORANGE : YELLOW
  const maxSport = Math.max(...sportBreakdown.map((s) => s.sessions))

  const goalOptions = [2, 3, 4, 5, 6, 7]

  return (
    <div className="space-y-6">

      {/* ── This Week card ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: goalMet
            ? 'rgba(34,197,94,0.08)'
            : 'rgba(59,130,246,0.08)',
          borderColor: goalMet
            ? 'rgba(34,197,94,0.25)'
            : 'rgba(59,130,246,0.25)',
        }}
      >
        <div className="flex items-center gap-5">
          {/* Circular ring */}
          <CircularProgress
            percent={progressPercent}
            size={108}
            strokeWidth={9}
            color={progressColor}
          >
            <span className="text-xl font-bold text-text-primary">
              {currentWeekSessions}/{weeklyGoal}
            </span>
            <span className="text-[10px] text-text-secondary">sessions</span>
          </CircularProgress>

          {/* Text info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-1">
              This Week
            </p>
            <p className="text-lg font-bold" style={{ color: progressColor }}>
              {progressPercent}% of goal
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {goalMet
                ? 'Goal reached! Great work 🎉'
                : `${weeklyGoal - currentWeekSessions} more to reach your goal!`}
            </p>
          </div>
        </div>

        {/* Quarter stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/40">
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{completionRate}%</p>
            <p className="text-[11px] text-text-secondary">Completion rate</p>
          </div>
          <div className="text-center border-x border-border/40">
            <p className="text-lg font-bold text-text-primary">
              {weeksHit}/{totalWeeks}
            </p>
            <p className="text-[11px] text-text-secondary">Weeks hit</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{totalSessionsQuarter}</p>
            <p className="text-[11px] text-text-secondary">Sessions (Q1)</p>
          </div>
        </div>
      </div>

      {/* ── Goal streak card ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4 flex items-center justify-between"
        style={{
          background: currentStreak >= 4 ? 'rgba(249,115,22,0.08)' : 'rgba(234,179,8,0.06)',
          borderColor: currentStreak >= 4 ? 'rgba(249,115,22,0.25)' : 'rgba(234,179,8,0.20)',
        }}
      >
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-0.5">
            Goal Streak
          </p>
          <p className="text-3xl font-bold" style={{ color: streakColor }}>
            {currentStreak}{' '}
            <span className="text-base font-normal text-text-secondary">
              consecutive week{currentStreak !== 1 ? 's' : ''}
            </span>
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {currentStreak >= 4
              ? 'You\'re on fire! Keep the momentum going.'
              : `${4 - currentStreak} more week${4 - currentStreak !== 1 ? 's' : ''} to light the flame!`}
          </p>
        </div>
        <span
          className="text-5xl select-none"
          style={{ filter: currentStreak >= 4 ? 'none' : 'grayscale(0.6)' }}
        >
          🔥
        </span>
      </div>

      {/* ── 13-week progress bar chart ───────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-text-secondary">
            Weekly Sessions — Last 13 Weeks
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: GREEN }} />
              Goal met
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: BLUE }} />
              Below goal
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={20}
              allowDecimals={false}
              domain={[0, Math.max(weeklyGoal + 2, 7)]}
            />
            <Tooltip
              content={<WeeklyTooltip goal={weeklyGoal} />}
            />
            <ReferenceLine
              y={weeklyGoal}
              stroke={ORANGE}
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{
                value: `Goal (${weeklyGoal})`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: ORANGE,
                dy: -4,
              }}
            />
            <Bar dataKey="sessions" radius={[3, 3, 0, 0]}>
              {weeklyData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.sessions >= weeklyGoal ? GREEN : BLUE}
                  fillOpacity={i === weeklyData.length - 1 ? 0.65 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-text-secondary mt-1 text-right">
          * Current week in progress
        </p>
      </div>

      {/* ── Sport breakdown horizontal bar chart ─────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          Sport Breakdown — Last 13 Weeks
        </h3>
        <div className="space-y-3">
          {sportBreakdown.map((entry) => (
            <SportBar
              key={entry.sport}
              {...entry}
              maxSessions={maxSport}
            />
          ))}
        </div>
        <p className="text-[11px] text-text-secondary mt-4 text-right">
          {sportBreakdown.reduce((s, e) => s + e.sessions, 0)} total sessions across{' '}
          {sportBreakdown.length} sports
        </p>
      </div>

      {/* ── Goal setting info ────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Weekly Goal Setting</h3>
        <p className="text-xs text-text-secondary mb-3">
          Your current goal is{' '}
          <span className="font-semibold text-text-primary">{weeklyGoal} sessions/week</span>.
          You can adjust it anytime — choose a target that fits your schedule.
        </p>
        <div className="flex flex-wrap gap-2">
          {goalOptions.map((n) => (
            <span
              key={n}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={
                n === weeklyGoal
                  ? {
                      background: 'rgba(34,197,94,0.15)',
                      borderColor: 'rgba(34,197,94,0.4)',
                      color: GREEN,
                    }
                  : {
                      background: 'transparent',
                      borderColor: 'rgba(255,255,255,0.12)',
                      color: 'var(--color-text-secondary)',
                    }
              }
            >
              {n} session{n !== 1 ? 's' : ''}{n === weeklyGoal ? ' ✓' : ''}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-text-secondary mt-3">
          Goal changes take effect from the next calendar week.
        </p>
      </div>

    </div>
  )
}
