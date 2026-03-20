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

export interface DailyStanding {
  date: string
  hours: number
  metGoal: boolean
}

export interface HourlyRate {
  hour: string
  rate: number
}

export interface StandingData {
  todayHours: number
  avg30d: number
  daysMetGoal: number
  currentStreak: number
  longestStreak: number
  daily: DailyStanding[]
  hourlyRates: HourlyRate[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE         = '#3B82F6'
const BLUE_MED     = '#60A5FA'
const BLUE_LIGHT   = '#BFDBFE'
const BLUE_MUTED   = 'rgba(59,130,246,0.18)'
const GOAL         = 12

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Tile color by stand hours ────────────────────────────────────────────────

function tileColor(hours: number): string {
  if (hours >= 12) return BLUE
  if (hours >= 8)  return BLUE_MED
  if (hours >= 4)  return BLUE_LIGHT
  return '#374151'   // gray
}

function tileTextColor(hours: number): string {
  if (hours >= 8)  return '#fff'
  if (hours >= 4)  return '#1e3a8a'
  return '#9CA3AF'
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function ProgressRing({ value, max }: { value: number; max: number }) {
  const radius = 52
  const stroke = 9
  const norm   = radius - stroke / 2
  const circ   = 2 * Math.PI * norm
  const pct    = Math.min(value / max, 1)
  const offset = circ * (1 - pct)

  return (
    <svg width={120} height={120} className="rotate-[-90deg]">
      {/* track */}
      <circle
        cx={60} cy={60} r={norm}
        fill="none"
        stroke="rgba(59,130,246,0.15)"
        strokeWidth={stroke}
      />
      {/* fill */}
      <circle
        cx={60} cy={60} r={norm}
        fill="none"
        stroke={BLUE}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StandingClient({ data }: { data: StandingData }) {
  const {
    todayHours,
    avg30d,
    daysMetGoal,
    currentStreak,
    longestStreak,
    daily,
    hourlyRates,
  } = data

  // daily in chronological order (oldest first) for the bar chart
  // reverse for grid (most recent first — top-left)
  const gridDays = [...daily].reverse()

  return (
    <div className="space-y-6">

      {/* ── Summary card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.22)' }}
      >
        <div className="flex items-center gap-6 mb-5">
          {/* Ring */}
          <div className="relative flex-none">
            <ProgressRing value={todayHours} max={GOAL} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold" style={{ color: BLUE }}>{todayHours}</p>
              <p className="text-xs text-text-secondary">/ {GOAL}</p>
            </div>
          </div>
          {/* Text */}
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-0.5">
              Today's Stand Hours
            </p>
            <p className="text-3xl font-bold" style={{ color: BLUE }}>
              {todayHours}
              <span className="text-lg font-normal text-text-secondary"> / {GOAL} hrs</span>
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {todayHours >= GOAL
                ? 'Goal reached! Great job keeping active.'
                : `${GOAL - todayHours} more hour${GOAL - todayHours !== 1 ? 's' : ''} to reach your daily goal.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-primary">{avg30d}</p>
            <p className="text-xs text-text-secondary mt-0.5">30d Average</p>
            <p className="text-xs text-text-secondary opacity-50">hrs / day</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold" style={{ color: BLUE }}>{daysMetGoal}</p>
            <p className="text-xs text-text-secondary mt-0.5">Days Hit Goal</p>
            <p className="text-xs text-text-secondary opacity-50">last 30 days</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold" style={{ color: BLUE_MED }}>{currentStreak}</p>
            <p className="text-xs text-text-secondary mt-0.5">Goal Streak</p>
            <p className="text-xs text-text-secondary opacity-50">days in a row</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-primary">{longestStreak}</p>
            <p className="text-xs text-text-secondary mt-0.5">Longest Streak</p>
            <p className="text-xs text-text-secondary opacity-50">last 30 days</p>
          </div>
        </div>
      </div>

      {/* ── 30-day history grid ────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">30-Day History</h3>
        <p className="text-xs text-text-secondary mb-3 opacity-70">
          Most recent top-left — dark blue ≥12 hrs · medium 8–11 · light 4–7 · gray &lt;4
        </p>
        <div className="grid grid-cols-10 gap-1">
          {gridDays.map((day, i) => (
            <div
              key={i}
              title={`${day.date}: ${day.hours} hrs`}
              className="aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold"
              style={{
                background: tileColor(day.hours),
                color: tileTextColor(day.hours),
              }}
            >
              {day.hours}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {[
            { color: BLUE,       label: '≥12 hrs' },
            { color: BLUE_MED,   label: '8–11 hrs' },
            { color: BLUE_LIGHT, label: '4–7 hrs',  dark: true },
            { color: '#374151',  label: '<4 hrs' },
          ].map(({ color, label, dark }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm flex-none"
                style={{ background: color }}
              />
              <span className="text-xs text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 30-day bar chart ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Daily Stand Hours — 30 Days</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Dashed line = 12-hour daily goal
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              domain={[0, 16]}
              ticks={[0, 4, 8, 12, 16]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={24}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val} hrs`, 'Stand Hours']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            <ReferenceLine
              y={GOAL}
              stroke={BLUE_MED}
              strokeDasharray="6 3"
              strokeOpacity={0.7}
              label={{ value: '12hr goal', fill: BLUE_MED, fontSize: 9, position: 'insideTopRight' }}
            />
            <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
              {daily.map((entry, i) => (
                <Cell
                  key={i}
                  fill={BLUE}
                  fillOpacity={entry.metGoal ? 0.85 : 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Hourly pattern chart ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Hourly Standing Pattern</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          How often you stood during each clock hour (30-day average) — 0 to 100%
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourlyRates} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              tickFormatter={(v: number) => `${v}%`}
              width={32}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val}%`, 'Standing rate']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            <ReferenceLine
              y={50}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 3"
            />
            <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
              {hourlyRates.map((entry, i) => (
                <Cell
                  key={i}
                  fill={BLUE}
                  fillOpacity={0.4 + (entry.rate / 100) * 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-primary">The Science Behind Standing</h3>
          <p className="text-xs text-text-secondary mt-0.5 opacity-70">
            Why Apple chose 12 hours and what the research says
          </p>
        </div>

        <div className="divide-y divide-border">
          {/* Biswas 2015 */}
          <div
            className="px-4 py-4"
            style={{ background: 'rgba(59,130,246,0.04)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex-none w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: BLUE_MUTED, color: BLUE }}
              >
                59
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  59% Increased Mortality Risk
                </p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Biswas et al. (2015, <em>Annals of Internal Medicine</em>) found that sitting ≥8 hours
                  per day was associated with a 59% higher all-cause mortality risk — independent of
                  leisure-time physical activity. Even regular exercise did not fully offset the harm
                  from prolonged sitting.
                </p>
                <p className="text-xs text-text-secondary mt-2 opacity-60">
                  Biswas A, et al. Ann Intern Med. 2015;162(2):123–132.
                </p>
              </div>
            </div>
          </div>

          {/* Dunstan 2012 */}
          <div className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex-none w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: BLUE_MUTED, color: BLUE }}
              >
                30
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  30% Lower Post-Meal Glucose
                </p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Dunstan et al. (2012, <em>Diabetes Care</em>) showed that breaking up prolonged
                  sitting with brief standing or light-walking breaks every 20–30 minutes reduced
                  post-meal blood glucose by ~30% and insulin by ~24% compared with uninterrupted
                  sitting — critical for metabolic health.
                </p>
                <p className="text-xs text-text-secondary mt-2 opacity-60">
                  Dunstan DW, et al. Diabetes Care. 2012;35(5):976–983.
                </p>
              </div>
            </div>
          </div>

          {/* Apple's 12-hour rationale */}
          <div
            className="px-4 py-4"
            style={{ background: 'rgba(59,130,246,0.04)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex-none w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: BLUE_MUTED, color: BLUE }}
              >
                12
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Why 12 Hours? Apple's Rationale
                </p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Apple set the Stand goal at 12 of your waking hours to encourage movement
                  throughout the entire day rather than clustering activity in a single workout.
                  Standing and moving for just 1 minute per clock hour keeps your musculoskeletal
                  system active, improves circulation, and signals to your metabolism that you are
                  not in prolonged sedentary mode. The award is binary per hour — all-or-nothing —
                  which nudges users to act before the hour ends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
