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

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayCell {
  date: string
  distanceKm: number | null
}

interface WeekBucket {
  week: string
  runDays: number
}

interface RunningStreaksClientProps {
  grid: DayCell[]
  weeklyFrequency: WeekBucket[]
  currentStreak: number
  longestStreak: number
  totalRunDays: number
  runRate: number
  avgRunsPerWeek: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ORANGE = '#f97316'
const ORANGE_80 = 'rgba(249,115,22,0.80)'
const ORANGE_60 = 'rgba(249,115,22,0.60)'
const ORANGE_40 = 'rgba(249,115,22,0.40)'
const GRAY_CELL = 'rgba(255,255,255,0.06)'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function heatmapColor(distanceKm: number | null): string {
  if (distanceKm === null) return GRAY_CELL
  if (distanceKm >= 20) return ORANGE
  if (distanceKm >= 10) return ORANGE_80
  if (distanceKm >= 5) return ORANGE_60
  return ORANGE_40
}

function barColor(runDays: number): string {
  if (runDays >= 5) return ORANGE
  if (runDays >= 3) return ORANGE_60
  return ORANGE_40
}

// ── Circular progress ring ────────────────────────────────────────────────────

function CircleRing({
  value,
  max,
  size = 88,
  stroke = 7,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const progress = Math.min(value / max, 1)
  const dashOffset = circumference * (1 - progress)

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={GRAY_CELL}
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={ORANGE}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function ActivityHeatmap({ grid }: { grid: DayCell[] }) {
  // grid has 90 days oldest→newest. Pad to 91 so we get exactly 13 × 7
  const cells = grid.slice(0, 91)

  // Build week labels: show abbreviated month at start of each calendar month boundary
  const weekLabels: string[] = []
  for (let col = 0; col < 13; col++) {
    const cellIndex = col * 7
    const day = cells[cellIndex]
    if (!day) { weekLabels.push(''); continue }
    const d = new Date(day.date)
    // Show month label if first column OR month changes from previous column
    if (col === 0) {
      weekLabels.push(d.toLocaleDateString('en-US', { month: 'short' }))
    } else {
      const prevDay = cells[(col - 1) * 7]
      const prevMonth = prevDay ? new Date(prevDay.date).getMonth() : -1
      weekLabels.push(
        d.getMonth() !== prevMonth
          ? d.toLocaleDateString('en-US', { month: 'short' })
          : ''
      )
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-4">
        90-Day Activity Heatmap
      </h3>

      {/* Week (column) labels */}
      <div className="flex gap-1 mb-1 ml-0">
        {weekLabels.map((label, i) => (
          <div
            key={i}
            className="text-[10px] text-text-secondary"
            style={{ width: 14, minWidth: 14, textAlign: 'left' }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid: 13 columns × 7 rows */}
      <div className="flex gap-1">
        {Array.from({ length: 13 }, (_, col) => (
          <div key={col} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, row) => {
              const cell = cells[col * 7 + row]
              if (!cell) return <div key={row} style={{ width: 14, height: 14 }} />
              const color = heatmapColor(cell.distanceKm)
              const title =
                cell.distanceKm !== null
                  ? `${cell.date}: ${cell.distanceKm.toFixed(1)} km`
                  : `${cell.date}: rest`
              return (
                <div
                  key={row}
                  title={title}
                  className="rounded-sm"
                  style={{
                    width: 14,
                    height: 14,
                    background: color,
                    cursor: 'default',
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <span className="text-[10px] text-text-secondary">Less</span>
        {[GRAY_CELL, ORANGE_40, ORANGE_60, ORANGE_80, ORANGE].map((c, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{ width: 12, height: 12, background: c }}
          />
        ))}
        <span className="text-[10px] text-text-secondary">More</span>
        <span className="text-[10px] text-text-secondary ml-2 opacity-60">
          ≥20 km · ≥10 km · ≥5 km · &lt;5 km · rest
        </span>
      </div>
    </div>
  )
}

// ── Weekly frequency chart ────────────────────────────────────────────────────

function WeeklyFrequencyChart({
  weeklyFrequency,
  avgRunsPerWeek,
}: {
  weeklyFrequency: WeekBucket[]
  avgRunsPerWeek: number
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">
        Weekly Run Frequency — Last 13 Weeks
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={weeklyFrequency}
          margin={{ top: 8, right: 4, left: -4, bottom: 0 }}
        >
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
            domain={[0, 7]}
            ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number) => [v, 'Run days']}
          />
          <ReferenceLine
            y={avgRunsPerWeek}
            stroke={ORANGE_60}
            strokeDasharray="5 3"
            label={{
              value: `avg ${avgRunsPerWeek}`,
              position: 'insideTopRight',
              fontSize: 10,
              fill: 'rgba(249,115,22,0.70)',
            }}
          />
          <Bar dataKey="runDays" radius={[3, 3, 0, 0]}>
            {weeklyFrequency.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.runDays)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Consistency tier card ─────────────────────────────────────────────────────

function ConsistencyCard({ runRate }: { runRate: number }) {
  type Tier = { label: string; min: number; color: string; bg: string; border: string }
  const tiers: Tier[] = [
    { label: 'Elite', min: 70, color: ORANGE, bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)' },
    { label: 'Strong', min: 50, color: ORANGE_80, bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
    { label: 'Regular', min: 30, color: ORANGE_60, bg: 'rgba(249,115,22,0.05)', border: 'rgba(249,115,22,0.18)' },
    { label: 'Building', min: 0, color: ORANGE_40, bg: 'rgba(249,115,22,0.04)', border: 'rgba(249,115,22,0.12)' },
  ]

  const currentTier = tiers.find((t) => runRate >= t.min) ?? tiers[tiers.length - 1]

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: currentTier.bg, borderColor: currentTier.border }}
    >
      {/* Badge + rate */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">
            Consistency Level
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span
              className="text-lg font-bold"
              style={{ color: currentTier.color }}
            >
              {currentTier.label} Runner
            </span>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-4xl font-bold tabular-nums"
            style={{ color: currentTier.color }}
          >
            {runRate}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">run rate</p>
        </div>
      </div>

      {/* Tier ladder */}
      <div className="space-y-1.5">
        {tiers.map((tier) => {
          const active = tier.label === currentTier.label
          const threshold = tier.min === 0 ? '<30%' : `≥${tier.min}%`
          return (
            <div
              key={tier.label}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderLeft: active ? `3px solid ${tier.color}` : '3px solid transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: tier.color }}
                />
                <span
                  className={`text-sm font-medium ${active ? 'text-text-primary' : 'text-text-secondary'}`}
                >
                  {tier.label}
                </span>
                {active && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: tier.color, color: '#000' }}
                  >
                    YOU
                  </span>
                )}
              </div>
              <span className="text-xs text-text-secondary tabular-nums">{threshold}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export function RunningStreaksClient({
  grid,
  weeklyFrequency,
  currentStreak,
  longestStreak,
  totalRunDays,
  runRate,
  avgRunsPerWeek,
}: RunningStreaksClientProps) {
  return (
    <div className="space-y-6">

      {/* ── Streak hero card ── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: 'rgba(249,115,22,0.07)',
          borderColor: 'rgba(249,115,22,0.25)',
        }}
      >
        <div className="flex items-center gap-5">
          {/* Circular progress ring */}
          <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
            <CircleRing value={currentStreak} max={30} size={88} stroke={7} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none" style={{ color: ORANGE }}>
                {currentStreak}
              </span>
              <span className="text-[10px] text-text-secondary leading-tight">/ 30</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">🔥</span>
              <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Current Streak
              </p>
            </div>
            <p className="text-3xl font-bold mb-3" style={{ color: ORANGE }}>
              {currentStreak} days
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-lg font-bold text-text-primary">{longestStreak}</p>
                <p className="text-xs text-text-secondary">longest</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {totalRunDays}
                  <span className="text-sm font-normal text-text-secondary">/90</span>
                </p>
                <p className="text-xs text-text-secondary">run days</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{avgRunsPerWeek}</p>
                <p className="text-xs text-text-secondary">runs/week</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary stats row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ORANGE }}>
            {currentStreak}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Current Streak</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ORANGE }}>
            {longestStreak}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Longest Streak</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ORANGE }}>
            {runRate}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Run Rate</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ORANGE }}>
            {avgRunsPerWeek}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg / Week</p>
        </div>
      </div>

      {/* ── 90-day activity heatmap ── */}
      <ActivityHeatmap grid={grid} />

      {/* ── Weekly frequency bar chart ── */}
      <WeeklyFrequencyChart
        weeklyFrequency={weeklyFrequency}
        avgRunsPerWeek={avgRunsPerWeek}
      />

      {/* ── Consistency level card ── */}
      <ConsistencyCard runRate={runRate} />

    </div>
  )
}
