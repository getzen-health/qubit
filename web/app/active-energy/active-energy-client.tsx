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

export interface DayRecord {
  date: string // ISO YYYY-MM-DD
  kcal: number
}

export interface ActiveEnergyClientProps {
  days: DayRecord[]
  todayKcal: number
  goalKcal: number
  streak: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_GOAL = 500
const WEEKLY_GOAL = 3500

const MOVE_RED = '#ef4444'      // red-500
const MOVE_ORANGE = '#f97316'   // orange-500

// ─── Helpers ─────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function barColor(kcal: number): string {
  if (kcal >= 700) return '#7f1d1d'  // red-900
  if (kcal >= 500) return '#dc2626'  // red-600
  if (kcal >= 300) return '#f87171'  // red-400
  return '#fecaca'                    // red-200
}

function fmtShortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// 0 = Monday, 6 = Sunday
function dowIndex(iso: string): number {
  const d = new Date(iso + 'T00:00:00')
  return (d.getDay() + 6) % 7
}

// ISO week-of-year key "YYYY-Www"
function isoWeekKey(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  const jan4 = new Date(date.getFullYear(), 0, 4)
  const weekNum = Math.ceil(
    ((date.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7
  )
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function CircleRing({ pct, size = 140, stroke = 12 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 1))
  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1f1f1f"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={pct >= 1 ? '#ef4444' : '#f97316'}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function DailyTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div style={tooltipStyle} className="px-3 py-2 rounded-lg shadow-lg">
      <p className="text-xs text-text-secondary mb-0.5">{label}</p>
      <p className="text-sm font-semibold" style={{ color: barColor(val) }}>
        {val.toLocaleString()} kcal
      </p>
      {val >= DAILY_GOAL && (
        <p className="text-xs text-green-400 mt-0.5">Goal met</p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActiveEnergyClient({
  days,
  todayKcal,
  goalKcal,
  streak,
}: ActiveEnergyClientProps) {
  const goal = goalKcal ?? DAILY_GOAL

  // ── Derived stats ──────────────────────────────────────────────────────────
  const last30 = days.slice(-30)
  const avg30 = last30.length > 0
    ? Math.round(last30.reduce((s, d) => s + d.kcal, 0) / last30.length)
    : 0
  const best = last30.reduce((b, d) => Math.max(b, d.kcal), 0)
  const daysMetGoal = last30.filter((d) => d.kcal >= goal).length

  // Rolling 7-day average value (for gray dashed reference line)
  const last7 = days.slice(-7)
  const rolling7Avg = last7.length > 0
    ? Math.round(last7.reduce((s, d) => s + d.kcal, 0) / last7.length)
    : 0

  // ── 30-day bar chart data ──────────────────────────────────────────────────
  const dailyChartData = last30.map((d) => ({
    date: fmtShortDate(d.date),
    kcal: d.kcal,
  }))

  // ── Weekly totals ──────────────────────────────────────────────────────────
  const weekMap: Record<string, number> = {}
  for (const d of last30) {
    const key = isoWeekKey(d.date)
    weekMap[key] = (weekMap[key] ?? 0) + d.kcal
  }
  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, kcal]) => ({ week: week.slice(5), kcal, metGoal: kcal >= WEEKLY_GOAL }))

  // ── Day-of-week pattern ────────────────────────────────────────────────────
  const dowTotals = [0, 0, 0, 0, 0, 0, 0]
  const dowCounts = [0, 0, 0, 0, 0, 0, 0]
  for (const d of last30) {
    const i = dowIndex(d.date)
    dowTotals[i] += d.kcal
    dowCounts[i]++
  }
  const dowData = DOW_LABELS.map((label, i) => ({
    day: label,
    avg: dowCounts[i] > 0 ? Math.round(dowTotals[i] / dowCounts[i]) : 0,
  }))

  // ── Hero ring ──────────────────────────────────────────────────────────────
  const todayPct = todayKcal / goal

  return (
    <div className="space-y-6">

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between">
          {/* Ring + numbers */}
          <div className="relative flex items-center justify-center">
            <CircleRing pct={todayPct} size={148} stroke={14} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold" style={{ color: todayPct >= 1 ? MOVE_RED : MOVE_ORANGE }}>
                {todayKcal.toLocaleString()}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">kcal</p>
            </div>
          </div>

          {/* Info column */}
          <div className="flex-1 pl-6 space-y-3">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Today</p>
              <p className="text-sm text-text-primary mt-0.5">
                {todayKcal >= goal ? (
                  <span className="text-red-400 font-semibold">Goal crushed!</span>
                ) : (
                  <span>
                    <span className="font-semibold text-text-primary">{(goal - todayKcal).toLocaleString()}</span>
                    <span className="text-text-secondary"> kcal to go</span>
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Goal</span>
                <span className="text-text-primary font-medium">{goal.toLocaleString()} kcal</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(todayPct * 100, 100)}%`,
                    background: `linear-gradient(to right, ${MOVE_ORANGE}, ${MOVE_RED})`,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <p className="text-xs text-text-secondary text-right">
                {Math.round(todayPct * 100)}%
              </p>
            </div>

            {/* Streak badge */}
            {streak > 0 && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.12)', color: MOVE_RED, border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <span>🔥</span>
                <span>{streak}-day streak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '30d Average', value: `${avg30.toLocaleString()} kcal`, color: 'text-orange-400' },
          { label: 'Best Day', value: `${best.toLocaleString()} kcal`, color: 'text-red-400' },
          { label: `Days ≥ ${goal}`, value: `${daysMetGoal} / ${last30.length}`, color: 'text-rose-400' },
          { label: 'Current Streak', value: `${streak} days`, color: streak >= 7 ? 'text-red-400' : 'text-text-secondary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── 30-day daily bar chart ─────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Daily Active Energy — 30 Days</h3>
          <p className="text-xs text-text-secondary mt-0.5">Move ring calories</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-200" /> &lt;300
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-400" /> 300–499
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-600" /> 500–699
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-900" /> 700+
          </span>
        </div>

        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={dailyChartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              width={30}
              domain={[0, 'auto']}
            />
            <Tooltip content={<DailyTooltip />} />
            {/* Goal line */}
            <ReferenceLine
              y={goal}
              stroke="rgba(34,197,94,0.6)"
              strokeDasharray="5 4"
              label={{
                value: `${goal} goal`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'rgba(34,197,94,0.7)',
              }}
            />
            {/* Rolling 7-day average */}
            {rolling7Avg > 0 && (
              <ReferenceLine
                y={rolling7Avg}
                stroke="rgba(156,163,175,0.45)"
                strokeDasharray="3 3"
                label={{
                  value: `7d avg ${rolling7Avg}`,
                  position: 'insideTopLeft',
                  fontSize: 9,
                  fill: 'rgba(156,163,175,0.55)',
                }}
              />
            )}
            <Bar dataKey="kcal" radius={[3, 3, 0, 0]} maxBarSize={24}>
              {dailyChartData.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.kcal)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Weekly totals chart ────────────────────────────────────────────── */}
      {weeklyData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Weekly Totals</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Goal: {WEEKLY_GOAL.toLocaleString()} kcal / week
              {' · '}
              <span className="text-red-400 font-medium">
                {weeklyData.filter((w) => w.metGoal).length} of {weeklyData.length} weeks met goal
              </span>
            </p>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={34}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Total']}
                labelFormatter={(label: string) => `Week ${label}`}
              />
              <ReferenceLine
                y={WEEKLY_GOAL}
                stroke="rgba(34,197,94,0.6)"
                strokeDasharray="5 4"
                label={{
                  value: '3,500 goal',
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: 'rgba(34,197,94,0.7)',
                }}
              />
              <Bar dataKey="kcal" radius={[3, 3, 0, 0]} maxBarSize={40}>
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.metGoal ? '#dc2626' : '#9f1239'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-600" />
              Met 3,500 kcal goal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#9f1239' }} />
              Under goal
            </span>
          </div>
        </div>
      )}

      {/* ── Day-of-week pattern ────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Day-of-Week Pattern</h3>
          <p className="text-xs text-text-secondary mt-0.5">Average active calories per day · last 30 days</p>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dowData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              width={30}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Avg']}
            />
            <ReferenceLine
              y={goal}
              stroke="rgba(34,197,94,0.6)"
              strokeDasharray="5 4"
              label={{
                value: `${goal} goal`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'rgba(34,197,94,0.7)',
              }}
            />
            <Bar dataKey="avg" radius={[3, 3, 0, 0]} maxBarSize={48}>
              {dowData.map((entry, i) => (
                <Cell key={i} fill={entry.avg >= goal ? '#dc2626' : '#f97316'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">The Science of Active Energy</h3>
        <div className="space-y-4">
          {[
            {
              badge: '≥ 1,000 kcal / wk',
              color: 'text-red-400',
              bg: 'rgba(239,68,68,0.08)',
              border: 'rgba(239,68,68,0.2)',
              headline: 'All-cause mortality reduced ~30%',
              detail: 'Harvard Alumni Study (Lee & Paffenbarger, 2000): men expending ≥ 1,000 kcal/week in leisure-time activity showed a ~30% lower risk of all-cause mortality versus sedentary peers.',
            },
            {
              badge: '200 kcal / day',
              color: 'text-orange-400',
              bg: 'rgba(249,115,22,0.08)',
              border: 'rgba(249,115,22,0.2)',
              headline: 'Cardioprotective minimum',
              detail: 'ACSM & CDC landmark paper (Pate et al., 1995): ~200 kcal/day of moderate-intensity activity is the evidence-based minimum to achieve meaningful cardiovascular benefit.',
            },
            {
              badge: 'NEAT Effect',
              color: 'text-amber-400',
              bg: 'rgba(245,158,11,0.08)',
              border: 'rgba(245,158,11,0.2)',
              headline: 'Non-exercise activity thermogenesis',
              detail: 'Fidgeting, posture, household chores, and incidental movement (NEAT) can account for 200–500+ kcal/day of variation between individuals — often exceeding structured workout burns.',
            },
            {
              badge: 'Move Ring',
              color: 'text-rose-400',
              bg: 'rgba(244,63,94,0.08)',
              border: 'rgba(244,63,94,0.2)',
              headline: 'Apple Watch 500 kcal default',
              detail: 'Apple Watch defaults to a 500 kcal active-energy goal. Consistent ring closure has been correlated with improved resting heart rate, increased HRV, and higher VO₂max estimates in observational cohort data.',
            },
          ].map(({ badge, color, bg, border, headline, detail }) => (
            <div
              key={badge}
              className="flex gap-3"
            >
              <div
                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold leading-tight h-fit mt-0.5"
                style={{ background: bg, color, border: `1px solid ${border}` }}
              >
                {badge}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{headline}</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
