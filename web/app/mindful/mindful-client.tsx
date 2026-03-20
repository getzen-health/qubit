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

interface MindfulSession {
  value: number       // duration in minutes
  start_time: string
  end_time: string
  source?: string | null
}

interface MindfulClientProps {
  sessions: MindfulSession[]
}

const PURPLE = '#a78bfa'
const PURPLE_DIM = '#7c3aed'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDur(min: number) {
  const m = Math.round(min)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

// Monday-aligned week label
function weekLabel(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Compute current and longest streaks from a sorted array of ISO date strings (YYYY-MM-DD)
function computeStreaks(days: string[]): { current: number; longest: number } {
  if (days.length === 0) return { current: 0, longest: 0 }

  const sorted = [...new Set(days)].sort()
  let longest = 1
  let run = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const curr = new Date(sorted[i] + 'T00:00:00')
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diffDays === 1) {
      run++
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }

  // Current streak: walk backwards from today
  const todayStr = new Date().toISOString().slice(0, 10)
  const daySet = new Set(sorted)
  let current = 0
  const check = new Date()
  for (let i = 0; i < 365; i++) {
    const ds = check.toISOString().slice(0, 10)
    if (daySet.has(ds)) {
      current++
      check.setDate(check.getDate() - 1)
    } else if (i === 0) {
      // Allow yesterday as "still going" if today hasn't been logged
      check.setDate(check.getDate() - 1)
      const yest = check.toISOString().slice(0, 10)
      if (daySet.has(yest)) {
        current++
        check.setDate(check.getDate() - 1)
      } else {
        break
      }
    } else {
      break
    }
  }
  void todayStr // used indirectly via new Date()

  return { current, longest: Math.max(longest, current) }
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type ConsistencyLevel = 'Dedicated' | 'Regular' | 'Occasional' | 'Getting Started'

function consistencyLevel(avgSessionsPerWeek: number): ConsistencyLevel {
  if (avgSessionsPerWeek >= 5) return 'Dedicated'
  if (avgSessionsPerWeek >= 3) return 'Regular'
  if (avgSessionsPerWeek >= 1) return 'Occasional'
  return 'Getting Started'
}

const CONSISTENCY_COLOR: Record<ConsistencyLevel, string> = {
  Dedicated: '#22c55e',
  Regular: '#a78bfa',
  Occasional: '#facc15',
  'Getting Started': '#94a3b8',
}

export function MindfulClient({ sessions }: MindfulClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🧘</span>
        <h2 className="text-lg font-semibold text-text-primary">No mindful minutes yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Use the Apple Watch Mindfulness app or any meditation app that writes to Apple Health.
          Sessions will appear here after your next sync.
        </p>
      </div>
    )
  }

  // ─── Summary stats ─────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((s, r) => s + r.value, 0)
  const totalHours = totalMinutes / 60
  const avgDuration = totalMinutes / totalSessions

  // Unique practice days
  const practiceDays = sessions.map((s) => s.start_time.slice(0, 10))
  const uniqueDays = [...new Set(practiceDays)].sort()
  const { current: currentStreak, longest: longestStreak } = computeStreaks(uniqueDays)

  // Weekly avg: sessions per week over the 90-day window (13 weeks)
  const weeklyAvg = totalSessions / 13

  // Consistency level
  const level = consistencyLevel(weeklyAvg)
  const levelColor = CONSISTENCY_COLOR[level]

  // ─── Weekly sessions chart (last 13 weeks, Monday-aligned) ─────────────────
  const now = new Date()
  const todayDow = now.getDay()
  const daysSinceMonday = (todayDow + 6) % 7
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - daysSinceMonday)
  thisMonday.setHours(0, 0, 0, 0)

  const weeklyCounts: { week: string; sessions: number }[] = []
  for (let w = 12; w >= 0; w--) {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(thisMonday.getDate() - w * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = sessions.filter((r) => {
      const d = new Date(r.start_time)
      return d >= weekStart && d < weekEnd
    }).length

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeklyCounts.push({ week: label, sessions: count })
  }
  void weekLabel // referenced above

  // ─── Day-of-week distribution ───────────────────────────────────────────────
  const dowCounts = Array(7).fill(0) as number[]
  for (const s of sessions) {
    const dow = new Date(s.start_time).getDay()
    dowCounts[dow]++
  }
  const dowMax = Math.max(...dowCounts)
  const dowData = DAY_NAMES.map((name, i) => ({ day: name, count: dowCounts[i] }))

  // ─── Time-of-day distribution ───────────────────────────────────────────────
  // Morning 5–9, Mid-AM 9–12, Afternoon 12–17, Evening 17–21, Night 21–24+early
  const timeBuckets = [
    { label: 'Morning', range: '5–9 AM', min: 5, max: 9, count: 0 },
    { label: 'Mid-AM', range: '9–12 PM', min: 9, max: 12, count: 0 },
    { label: 'Afternoon', range: '12–5 PM', min: 12, max: 17, count: 0 },
    { label: 'Evening', range: '5–9 PM', min: 17, max: 21, count: 0 },
    { label: 'Night', range: '9 PM+', min: 21, max: 29, count: 0 }, // 29 wraps 0–5
  ]
  for (const s of sessions) {
    const hour = new Date(s.start_time).getHours()
    const h = hour < 5 ? hour + 24 : hour // treat 0–4 as 24–28 → "Night"
    for (const bucket of timeBuckets) {
      if (h >= bucket.min && h < bucket.max) {
        bucket.count++
        break
      }
    }
  }
  const todMax = Math.max(...timeBuckets.map((b) => b.count))
  const todData = timeBuckets.map((b) => ({ label: b.label, range: b.range, count: b.count }))

  return (
    <div className="space-y-6">
      {/* ── Summary cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: PURPLE }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: PURPLE }}>
            {totalHours.toFixed(1)} h
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Hours</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: PURPLE }}>
            {Math.round(avgDuration)} min
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: PURPLE }}>
            {weeklyAvg.toFixed(1)}/wk
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Weekly Avg</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {currentStreak}d
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Current Streak</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">
            {longestStreak}d
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Longest Streak</p>
        </div>
      </div>

      {/* ── Practice consistency level ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4 relative overflow-hidden"
        style={{ borderColor: levelColor + '44', background: levelColor + '0d' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: levelColor }}>
              Practice Level
            </p>
            <p className="text-xl font-bold text-text-primary mt-0.5">{level}</p>
            <p className="text-xs text-text-secondary mt-1">
              {weeklyAvg.toFixed(1)} sessions/week average
            </p>
          </div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: levelColor + '22', border: `2px solid ${levelColor}44` }}
          >
            {level === 'Dedicated' ? '🏆' : level === 'Regular' ? '🧘' : level === 'Occasional' ? '🌱' : '✨'}
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap text-xs text-text-secondary">
          {(['Getting Started', 'Occasional', 'Regular', 'Dedicated'] as ConsistencyLevel[]).map(
            (l) => (
              <span
                key={l}
                className="px-2 py-0.5 rounded-full border"
                style={{
                  color: l === level ? CONSISTENCY_COLOR[l] : undefined,
                  borderColor: l === level ? CONSISTENCY_COLOR[l] + '88' : 'var(--color-border)',
                  background: l === level ? CONSISTENCY_COLOR[l] + '22' : undefined,
                  fontWeight: l === level ? 600 : 400,
                  opacity: l === level ? 1 : 0.5,
                }}
              >
                {l}
              </span>
            )
          )}
        </div>
        <p className="text-xs text-text-secondary mt-2 opacity-60">
          Getting Started &lt;1/wk · Occasional ≥1/wk · Regular ≥3/wk · Dedicated ≥5/wk
        </p>
      </div>

      {/* ── Weekly sessions bar chart ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-secondary">Weekly Sessions — Last 90 Days</h3>
          <span
            className="text-xs rounded-full px-2 py-0.5 border"
            style={{ color: PURPLE, borderColor: PURPLE + '44', background: PURPLE + '11' }}
          >
            Target: 3/wk
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyCounts} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Sessions']}
              labelFormatter={(label: string) => `Week of ${label}`}
            />
            <ReferenceLine
              y={3}
              stroke={PURPLE}
              strokeDasharray="4 3"
              strokeOpacity={0.55}
              label={{ value: '3/wk', position: 'insideTopRight', fontSize: 10, fill: PURPLE }}
            />
            <Bar dataKey="sessions" fill={PURPLE} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Day-of-week distribution ───────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Sessions by Day of Week</h3>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={dowData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={24}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Sessions']}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {dowData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count === dowMax && dowMax > 0 ? PURPLE : PURPLE_DIM + '66'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Time-of-day distribution ───────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">When You Meditate</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={todData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={24}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _: string, props: { payload?: { range: string } }) => [
                `${v} sessions`,
                props.payload?.range ?? '',
              ]}
              labelFormatter={(label: string) => label}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {todData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count === todMax && todMax > 0 ? PURPLE : PURPLE_DIM + '66'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary opacity-70">
          {todData.map((b) => (
            <span key={b.label}>
              {b.label}: {b.range}
            </span>
          ))}
        </div>
      </div>

      {/* ── Science card ───────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-purple-500/30 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-700/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
              Science &amp; Research
            </h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Mindfulness meditation activates the parasympathetic nervous system, lowering cortisol
            and raising heart rate variability (HRV). Even brief daily sessions can produce
            measurable changes within 8 weeks.
          </p>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            <li className="flex gap-2">
              <span className="text-purple-400 shrink-0">•</span>
              <span>
                <strong className="text-text-primary">HRV:</strong> Regular meditators show higher
                resting HRV — a marker of cardiovascular resilience and stress recovery.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 shrink-0">•</span>
              <span>
                <strong className="text-text-primary">Cortisol:</strong> Studies link consistent
                mindfulness practice to lower morning cortisol and reduced stress reactivity.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-purple-400 shrink-0">•</span>
              <span>
                <strong className="text-text-primary">Goyal et al. 2014</strong> (JAMA Internal
                Medicine meta-analysis, 47 trials): Mindfulness meditation produced moderate
                improvements in anxiety, depression, and pain.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
