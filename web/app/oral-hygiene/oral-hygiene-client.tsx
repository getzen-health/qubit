'use client'

import { useState, useTransition, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Flame,
  Loader2,
  AlertTriangle,
  BarChart2,
} from 'lucide-react'
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
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { BottomNav } from '@/components/bottom-nav'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OralHygieneLog {
  id: string
  user_id: string
  logged_date: string
  sessions: number
  morning: boolean
  afternoon: boolean
  evening: boolean
  total_duration_seconds: number
  notes: string | null
  created_at: string
  updated_at: string
}

interface DayRecord {
  date: string
  label: string
  sessions: number
  totalDuration: number
  morning: boolean
  afternoon: boolean
  evening: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildChartData(logs: OralHygieneLog[]): DayRecord[] {
  const map = new Map(logs.map((l) => [l.logged_date, l]))
  const records: DayRecord[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const dateStr = d.toISOString().slice(0, 10)
    const log = map.get(dateStr)
    records.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: log?.sessions ?? 0,
      totalDuration: log?.total_duration_seconds ?? 0,
      morning: log?.morning ?? false,
      afternoon: log?.afternoon ?? false,
      evening: log?.evening ?? false,
    })
  }
  return records
}

function computeStreak(records: DayRecord[]): number {
  // Records are oldest-first; walk backwards from today
  let streak = 0
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].sessions >= 2) streak++
    else break
  }
  return streak
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function fmtDuration(sec: number): string {
  if (sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ─── Recharts helpers ─────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function BarTooltipContent({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: DayRecord }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const avgDur = d.sessions > 0 ? Math.round(d.totalDuration / d.sessions) : 0
  return (
    <div style={tooltipStyle} className="px-3 py-2 space-y-1">
      <p className="font-medium text-white text-xs">{d.label}</p>
      <p className="text-xs text-gray-300">
        {d.sessions} session{d.sessions !== 1 ? 's' : ''}
      </p>
      {avgDur > 0 && <p className="text-xs text-gray-400">{avgDur}s avg</p>}
    </div>
  )
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusCard({
  emoji,
  label,
  done,
}: {
  emoji: string
  label: string
  done: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors',
        done
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-surface border-border'
      )}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      ) : (
        <XCircle className="w-5 h-5 text-text-secondary/40" />
      )}
    </div>
  )
}

function StreakBadge({ streak }: { streak: number }) {
  const active = streak >= 7
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-4',
        active
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-surface border-border'
      )}
    >
      <Flame
        className={cn(
          'w-8 h-8 shrink-0',
          active ? 'text-orange-400' : 'text-text-secondary/40'
        )}
      />
      <div>
        <p
          className={cn(
            'text-3xl font-bold tabular-nums',
            active ? 'text-orange-400' : 'text-text-primary'
          )}
        >
          {streak}
        </p>
        <p className="text-xs text-text-secondary leading-tight">
          day streak · 2+ sessions/day
        </p>
      </div>
    </div>
  )
}

// ─── Log form ─────────────────────────────────────────────────────────────────

interface LogFormProps {
  existingLog: OralHygieneLog | null
  onSaved: (log: OralHygieneLog) => void
}

function LogForm({ existingLog, onSaved }: LogFormProps) {
  const [morning, setMorning] = useState(existingLog?.morning ?? false)
  const [afternoon, setAfternoon] = useState(existingLog?.afternoon ?? false)
  const [evening, setEvening] = useState(existingLog?.evening ?? false)
  const [duration, setDuration] = useState(
    existingLog && existingLog.sessions > 0
      ? Math.round(existingLog.total_duration_seconds / existingLog.sessions)
      : 120
  )
  const [notes, setNotes] = useState(existingLog?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sessions = [morning, afternoon, evening].filter(Boolean).length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/oral-hygiene', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logged_date: todayStr(),
            sessions,
            morning,
            afternoon,
            evening,
            total_duration_seconds: sessions * duration,
            notes: notes.trim() || null,
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setError(
            (json as { error?: string }).error ?? 'Failed to save. Please try again.'
          )
          return
        }
        const json = await res.json()
        onSaved(json.log as OralHygieneLog)
      } catch {
        setError('Network error — please try again.')
      }
    })
  }

  const checkboxes = [
    { id: 'morning', emoji: '☀️', label: 'Morning', state: morning, set: setMorning },
    {
      id: 'afternoon',
      emoji: '🌤️',
      label: 'Afternoon',
      state: afternoon,
      set: setAfternoon,
    },
    { id: 'evening', emoji: '🌙', label: 'Evening', state: evening, set: setEvening },
  ]

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-2xl border border-border p-5 space-y-5"
    >
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-text-primary">
          Log Today&apos;s Brushing
        </h3>
        <span className="ml-auto text-xs text-text-secondary">
          {fmtDate(todayStr())}
        </span>
      </div>

      {/* Session checkboxes */}
      <div>
        <p className="text-xs text-text-secondary mb-2">Sessions</p>
        <div className="grid grid-cols-3 gap-2">
          {checkboxes.map(({ id, emoji, label, state, set }) => (
            <label
              key={id}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-colors select-none',
                state
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-surface border-border text-text-secondary hover:border-border/80'
              )}
            >
              <input
                type="checkbox"
                checked={state}
                onChange={(e) => set(e.target.checked)}
                className="sr-only"
              />
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
              {state ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-current opacity-40" />
              )}
            </label>
          ))}
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {sessions} session{sessions !== 1 ? 's' : ''} selected
          {sessions >= 2 && (
            <span className="text-emerald-400 ml-1">· ADA goal met ✓</span>
          )}
        </p>
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">
          Avg brush duration (seconds per session)
        </label>
        <input
          type="number"
          min={0}
          max={600}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
        <p className="text-xs text-text-secondary mt-1">
          ADA recommends ≥ 120 seconds
          {duration >= 120 && sessions > 0 && (
            <span className="text-emerald-400 ml-1">· ✓</span>
          )}
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="e.g. used electric brush, flossed after…"
          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-text-secondary/40"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || sessions === 0}
        className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving…
          </>
        ) : existingLog ? (
          'Update Log'
        ) : (
          'Save Log'
        )}
      </button>
    </form>
  )
}

// ─── Recent logs list ─────────────────────────────────────────────────────────

function RecentLogs({ logs }: { logs: OralHygieneLog[] }) {
  const last7 = logs.slice(0, 7)

  if (last7.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6 text-center">
        <p className="text-2xl mb-2">🦷</p>
        <p className="text-sm text-text-secondary">No logs yet — save your first one above.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-2 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Recent Logs</h3>
        <p className="text-xs text-text-secondary mt-0.5">Last 7 days</p>
      </div>
      <ul className="divide-y divide-border">
        {last7.map((log) => {
          const goalMet = log.sessions >= 2
          return (
            <li key={log.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex flex-col items-center w-12 shrink-0">
                <p className="text-xs font-semibold text-text-primary tabular-nums">
                  {new Date(log.logged_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-[10px] text-text-secondary">
                  {new Date(log.logged_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                  })}
                </p>
              </div>

              {/* Session icons */}
              <div className="flex gap-1.5 items-center flex-1">
                <span
                  title="Morning"
                  className={cn(
                    'text-base',
                    log.morning ? 'opacity-100' : 'opacity-20'
                  )}
                >
                  ☀️
                </span>
                <span
                  title="Afternoon"
                  className={cn(
                    'text-base',
                    log.afternoon ? 'opacity-100' : 'opacity-20'
                  )}
                >
                  🌤️
                </span>
                <span
                  title="Evening"
                  className={cn(
                    'text-base',
                    log.evening ? 'opacity-100' : 'opacity-20'
                  )}
                >
                  🌙
                </span>
                <span className="text-xs text-text-secondary ml-1">
                  {log.sessions}×
                </span>
                {log.total_duration_seconds > 0 && (
                  <span className="text-xs text-text-secondary">
                    · {fmtDuration(log.total_duration_seconds)}
                  </span>
                )}
              </div>

              {/* Goal badge */}
              <div className="shrink-0">
                {goalMet ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Goal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary text-[10px]">
                    {log.sessions}×
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── Charts (client-only via dynamic) ────────────────────────────────────────

function Charts({ data }: { data: DayRecord[] }) {
  const totalDays = data.length || 1
  const totalSessions = data.reduce((s, d) => s + d.sessions, 0)
  const totalDuration = data.reduce((s, d) => s + d.totalDuration, 0)
  const avgDurationPerSession =
    totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0

  const durationBuckets = { short: 0, medium: 0, full: 0 }
  data.forEach((d) => {
    if (d.sessions === 0) return
    const avgDur = d.totalDuration / d.sessions
    if (avgDur < 90) durationBuckets.short++
    else if (avgDur < 120) durationBuckets.medium++
    else durationBuckets.full++
  })
  const durationPieData = [
    { name: 'Short (<90s)', value: durationBuckets.short, fill: '#f97316' },
    { name: 'Medium (90-120s)', value: durationBuckets.medium, fill: '#22c55e' },
    { name: 'Full (≥120s)', value: durationBuckets.full, fill: '#16a34a' },
  ]

  const todCounts = { Morning: 0, Afternoon: 0, Evening: 0 }
  data.forEach((d) => {
    if (d.morning) todCounts.Morning++
    if (d.afternoon) todCounts.Afternoon++
    if (d.evening) todCounts.Evening++
  })
  const todTotal = todCounts.Morning + todCounts.Afternoon + todCounts.Evening
  const todData = [
    { subject: 'Morning', value: Math.round((todCounts.Morning / (todTotal || 1)) * 100) },
    { subject: 'Afternoon', value: Math.round((todCounts.Afternoon / (todTotal || 1)) * 100) },
    { subject: 'Evening', value: Math.round((todCounts.Evening / (todTotal || 1)) * 100) },
  ]

  return (
    <>
      {/* 90-day bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Daily Brushing Frequency</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Last 90 days — green = goal met (2×), orange = under
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-secondary shrink-0">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              2+
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400" />
              &lt;2
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
            barCategoryGap="8%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval={14}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={20}
              allowDecimals={false}
              domain={[0, 3]}
              ticks={[0, 1, 2]}
            />
            <Tooltip content={<BarTooltipContent />} />
            <ReferenceLine
              y={2}
              stroke="#22c55e"
              strokeDasharray="4 3"
              strokeOpacity={0.7}
              label={{
                value: 'Goal',
                position: 'insideTopRight',
                fontSize: 9,
                fill: '#22c55e',
              }}
            />
            <Bar dataKey="sessions" radius={[2, 2, 0, 0]} maxBarSize={8}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.sessions >= 2
                      ? '#10b981'
                      : entry.sessions === 1
                      ? '#f97316'
                      : '#374151'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Duration + time-of-day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-0.5">
            Session Duration
          </h3>
          <p className="text-xs text-text-secondary mb-3">
            Avg per session: {avgDurationPerSession}s
          </p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={durationPieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={55}
                  innerRadius={26}
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {durationPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [v, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {durationPieData.map((entry) => (
                <div key={entry.name} className="flex items-start gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <div>
                    <p className="text-xs text-text-primary leading-tight">{entry.name}</p>
                    <p className="text-xs text-text-secondary">{entry.value} days</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-secondary border-t border-border pt-1">
                ADA: <span className="text-emerald-400 font-medium">≥ 2 min</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-0.5">
            Time of Day
          </h3>
          <p className="text-xs text-text-secondary mb-3">When you brush most often</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <RadarChart cx="50%" cy="50%" outerRadius={48} data={todData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Brushing %"
                  dataKey="value"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v}%`, 'Brushing']}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {todData.map((entry) => (
                <div key={entry.subject}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-text-secondary">{entry.subject}</span>
                    <span className="text-emerald-400 font-medium">{entry.value}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${entry.value}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-secondary border-t border-border pt-1">
                Ideal: morning + evening
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Lazy-load charts to avoid SSR issues with recharts
const LazyCharts = dynamic(() => Promise.resolve(Charts), { ssr: false })

// ─── Main client component ────────────────────────────────────────────────────

export function OralHygieneClient({
  initialLogs,
}: {
  initialLogs: OralHygieneLog[]
}) {
  const [logs, setLogs] = useState<OralHygieneLog[]>(initialLogs)

  const handleSaved = useCallback((saved: OralHygieneLog) => {
    setLogs((prev) => {
      const filtered = prev.filter((l) => l.logged_date !== saved.logged_date)
      return [saved, ...filtered].sort((a, b) =>
        b.logged_date.localeCompare(a.logged_date)
      )
    })
  }, [])

  const today = todayStr()
  const todayLog = logs.find((l) => l.logged_date === today) ?? null
  const data = buildChartData(logs)
  const streak = computeStreak(data)

  const totalDays = data.length || 1
  const daysMetGoal = data.filter((d) => d.sessions >= 2).length
  const goalRate = Math.round((daysMetGoal / totalDays) * 100)
  const avgSessions =
    Math.round((data.reduce((s, d) => s + d.sessions, 0) / totalDays) * 10) / 10

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
              🦷 Oral Hygiene
            </h1>
            <p className="text-xs text-text-secondary truncate">
              Apple Watch autodetects brushing since Series 5
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-28 space-y-5">

        {/* ── Today's status ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Today&apos;s Status
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatusCard emoji="☀️" label="Morning" done={todayLog?.morning ?? false} />
            <StatusCard emoji="🌤️" label="Afternoon" done={todayLog?.afternoon ?? false} />
            <StatusCard emoji="🌙" label="Evening" done={todayLog?.evening ?? false} />
          </div>
          {todayLog && (
            <p className="text-xs text-text-secondary mt-2 text-center">
              {todayLog.sessions} session{todayLog.sessions !== 1 ? 's' : ''} logged today
              {todayLog.total_duration_seconds > 0 && ` · ${fmtDuration(todayLog.total_duration_seconds)} total`}
            </p>
          )}
        </section>

        {/* ── Streak + stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <StreakBadge streak={streak} />
          </div>
          <div className="grid grid-cols-2 gap-3 col-span-2 sm:col-span-1">
            <div className="bg-surface rounded-2xl border border-border p-3 text-center">
              <p className="text-2xl font-bold text-green-400 tabular-nums">{goalRate}%</p>
              <p className="text-xs text-text-secondary mt-0.5">Goal Rate</p>
              <p className="text-[10px] text-text-secondary opacity-60">2× met</p>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-3 text-center">
              <p className="text-2xl font-bold text-teal-400 tabular-nums">{avgSessions}</p>
              <p className="text-xs text-text-secondary mt-0.5">Avg Sessions</p>
              <p className="text-[10px] text-text-secondary opacity-60">per day</p>
            </div>
          </div>
        </div>

        {/* ── Log form ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Log Brushing
          </h2>
          <LogForm existingLog={todayLog} onSaved={handleSaved} />
        </section>

        {/* ── Recent 7 days ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Recent Activity
          </h2>
          <RecentLogs logs={logs} />
        </section>

        {/* ── Charts ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            90-Day Trends
          </h2>
          <LazyCharts data={data} />
        </section>

        {/* ── Science section ── */}
        <div className="bg-surface rounded-2xl border border-emerald-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                Science &amp; Guidelines
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">ADA Recommendation</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Brush <strong className="text-text-primary">twice daily</strong> for a minimum of{' '}
                    <strong className="text-text-primary">2 minutes</strong> per session — morning and before bed.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">Cardiovascular Link</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Brushing fewer than 2× per day is associated with higher cardiovascular event risk
                    via oral bacteria and systemic inflammation.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">Apple Watch Detection</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Series 5+ uses its accelerometer and gyroscope to classify the repetitive wrist
                    motion of toothbrushing, firing automatically after ≥5 seconds of the pattern.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">Why 2 Minutes?</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Most people brush for only 45–70 s. Two minutes ensures all quadrants receive
                    adequate coverage and fluoride contact time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Setup guide ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              Setup Guide
            </h3>
          </div>
          <ol className="space-y-3">
            {[
              {
                step: '1',
                title: 'Wear your Apple Watch while brushing',
                body: 'Series 5 or later detects toothbrushing automatically. Keep the watch on the wrist you brush with.',
              },
              {
                step: '2',
                title: 'Enable Toothbrushing detection',
                body: 'Health app → Browse → Dental → Toothbrushing → turn on "Apple Watch Detection".',
              },
              {
                step: '3',
                title: 'Sync to GetZen',
                body: 'Open GetZen → Sync → grant Health access. Brushing events import automatically.',
              },
            ].map(({ step, title, body }) => (
              <li key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-cyan-400">{step}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{title}</p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 px-3 py-2.5 bg-surface-secondary rounded-xl">
            <p className="text-xs text-text-secondary">
              <span className="text-cyan-400 font-medium">Compatibility:</span> Apple Watch Series 5,
              SE (1st gen), Series 6–10, Ultra, Ultra 2 running watchOS 7+.
            </p>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
