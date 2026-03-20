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
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeekData {
  weekLabel: string  // e.g. "Jan 6"
  minutes: number
}

export interface DayPattern {
  day: string        // "Mon" … "Sun"
  avgMinutes: number
}

export interface ExerciseMinutesData {
  thisWeekMinutes: number
  goalStreak: number        // consecutive weeks ≥ 150 min
  bestWeekMinutes: number
  avg12WeekMinutes: number
  weeks52: WeekData[]       // oldest first, length = 52
  weeks26: WeekData[]       // last 26 of weeks52 (oldest first)
  dayPattern: DayPattern[]  // Mon–Sun
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GREEN  = '#22C55E'
const YELLOW = '#EAB308'
const ORANGE = '#F97316'
const GRAY   = '#374151'

const WHO_GOAL = 150

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type GoalTier = 'met' | 'close' | 'partial' | 'low'

function tier(minutes: number): GoalTier {
  if (minutes >= 150) return 'met'
  if (minutes >= 100) return 'close'
  if (minutes >= 50)  return 'partial'
  return 'low'
}

function tierColor(t: GoalTier): string {
  if (t === 'met')     return GREEN
  if (t === 'close')   return YELLOW
  if (t === 'partial') return ORANGE
  return GRAY
}

function barColor(minutes: number): string {
  return tierColor(tier(minutes))
}

// ─── Circular progress gauge ──────────────────────────────────────────────────

function CircularGauge({ current, goal }: { current: number; goal: number }) {
  const pct = Math.min(current / goal, 1)
  const radius = 52
  const stroke = 8
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct)
  const size = (radius + stroke) * 2 + 4

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={pct >= 1 ? GREEN : pct >= 0.67 ? YELLOW : ORANGE}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ─── 52-week grid ─────────────────────────────────────────────────────────────

function GoalHistoryGrid({ weeks }: { weeks: WeekData[] }) {
  // Display 52 weeks as 13 columns × 4 rows (oldest top-left, newest bottom-right)
  const cells = [...weeks]
  // Pad to 52 if shorter
  while (cells.length < 52) cells.unshift({ weekLabel: '', minutes: -1 })

  // Build 4 rows × 13 cols
  const rows: WeekData[][] = []
  for (let row = 0; row < 4; row++) {
    rows.push(cells.slice(row * 13, row * 13 + 13))
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map((cell, ci) => {
            if (cell.minutes < 0) {
              return <div key={ci} className="w-5 h-5 rounded-sm" style={{ background: 'rgba(255,255,255,0.04)' }} />
            }
            const t = tier(cell.minutes)
            const color = tierColor(t)
            return (
              <div
                key={ci}
                className="w-5 h-5 rounded-sm flex-none"
                style={{ background: color, opacity: t === 'low' ? 0.35 : t === 'partial' ? 0.7 : 0.85 }}
                title={`${cell.weekLabel}: ${cell.minutes} min`}
              />
            )
          })}
        </div>
      ))}
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        {([
          { label: '<50 min',    color: GRAY,   opacity: 0.35 },
          { label: '50–99 min',  color: ORANGE, opacity: 0.7 },
          { label: '100–149 min',color: YELLOW, opacity: 0.85 },
          { label: '≥150 min',   color: GREEN,  opacity: 0.85 },
        ] as const).map(({ label, color, opacity }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm flex-none" style={{ background: color, opacity }} />
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExerciseMinutesClient({ data }: { data: ExerciseMinutesData }) {
  const {
    thisWeekMinutes,
    goalStreak,
    bestWeekMinutes,
    avg12WeekMinutes,
    weeks52,
    weeks26,
    dayPattern,
  } = data

  const pct = Math.round((thisWeekMinutes / WHO_GOAL) * 100)
  const remaining = Math.max(0, WHO_GOAL - thisWeekMinutes)

  return (
    <div className="space-y-6">

      {/* ── Summary card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(34,197,94,0.07)', borderColor: 'rgba(34,197,94,0.22)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
              This Week
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold" style={{ color: GREEN }}>
                {thisWeekMinutes}
              </p>
              <p className="text-base text-text-secondary">min</p>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {pct}% of 150-min WHO goal
              {remaining > 0 && (
                <span className="ml-2 text-yellow-400 font-medium">· {remaining} min to go</span>
              )}
            </p>
          </div>

          {/* Circular gauge */}
          <div className="relative flex-none">
            <CircularGauge current={thisWeekMinutes} goal={WHO_GOAL} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-text-primary">{pct}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-xl font-bold" style={{ color: GREEN }}>{goalStreak}</p>
            <p className="text-xs text-text-secondary mt-0.5">Goal Streak</p>
            <p className="text-xs text-text-secondary opacity-50">weeks ≥150 min</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-text-primary">{bestWeekMinutes}</p>
            <p className="text-xs text-text-secondary mt-0.5">Best Week</p>
            <p className="text-xs text-text-secondary opacity-50">minutes</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-text-primary">{avg12WeekMinutes}</p>
            <p className="text-xs text-text-secondary mt-0.5">12-Week Avg</p>
            <p className="text-xs text-text-secondary opacity-50">min/week</p>
          </div>
        </div>
      </div>

      {/* ── 52-week goal history grid ─────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">52-Week Goal History</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Each square = one week · green ≥ 150 min · yellow 100–149 · orange 50–99 · gray &lt; 50
        </p>
        <GoalHistoryGrid weeks={weeks52} />
      </div>

      {/* ── 26-week bar chart ─────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">26-Week History</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Bars colored by goal tier · dashed line = WHO 150-min target
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeks26} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={30}
              domain={[0, 240]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val} min`, 'Exercise Minutes']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            <ReferenceLine
              y={WHO_GOAL}
              stroke={GREEN}
              strokeDasharray="6 3"
              strokeOpacity={0.55}
              label={{ value: '150 min WHO goal', fill: GREEN, fontSize: 9, position: 'insideTopRight' }}
            />
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
              {weeks26.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.minutes)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Day-of-week pattern ───────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Day-of-Week Pattern</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Average exercise minutes per day across the last 26 weeks
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dayPattern} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={30}
              domain={[0, 60]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val} min`, 'Avg Minutes']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            <Bar dataKey="avgMinutes" radius={[4, 4, 0, 0]} fill={GREEN} fillOpacity={0.75} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── WHO guidelines card ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl flex-none mt-0.5">🏃</span>
          <div>
            <p className="text-sm font-semibold text-green-400 mb-1">WHO Physical Activity Guidelines</p>
            <p className="text-xs text-text-secondary opacity-70">For adults aged 18–64</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-background/40 rounded-xl">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-none" style={{ background: GREEN }} />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                150–300 min/week moderate-intensity
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Brisk walking, light cycling, water aerobics
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-background/40 rounded-xl">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-none" style={{ background: YELLOW }} />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                75–150 min/week vigorous-intensity
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Running, fast cycling, aerobics, team sports
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-background/40 rounded-xl">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-none" style={{ background: ORANGE }} />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Muscle-strengthening 2× per week
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                All major muscle groups — weights, resistance bands, bodyweight
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <p className="text-sm font-semibold text-green-400 mb-0.5">More is better</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Adults who exceed 300 min/week of moderate or 150 min/week of vigorous activity gain
              additional health benefits. Any activity is better than none — even short bouts count.
            </p>
          </div>
        </div>

        <p className="text-xs text-text-secondary mt-4 opacity-50">
          Source: WHO Global recommendations on physical activity for health (2020)
        </p>
      </div>

    </div>
  )
}
