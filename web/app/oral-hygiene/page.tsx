'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
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
import { BottomNav } from '@/components/bottom-nav'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DayRecord {
  date: string
  label: string
  sessions: number
  totalDuration: number
  morning: boolean
  afternoon: boolean
  evening: boolean
}

// ─── Tooltip styles ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Custom Tooltip for bar chart ─────────────────────────────────────────────

function BarTooltipContent({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: DayRecord }>
}) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  const avgDur = d.sessions > 0 ? Math.round(d.totalDuration / d.sessions) : 0
  return (
    <div style={tooltipStyle} className="px-3 py-2 space-y-1">
      <p className="font-medium text-white text-xs">{d.label}</p>
      <p className="text-xs text-gray-300">{d.sessions} session{d.sessions !== 1 ? 's' : ''}</p>
      {avgDur > 0 && (
        <p className="text-xs text-gray-400">{avgDur}s avg duration</p>
      )}
    </div>
  )
}

// ─── Custom Pie label ─────────────────────────────────────────────────────────

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number
  percent: number
}) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

// ─── Helper: build last-90-days grid from API logs ────────────────────────────

function buildChartData(logs: Array<{
  logged_date: string
  sessions: number
  morning: boolean
  afternoon: boolean
  evening: boolean
  total_duration_seconds: number
}>): DayRecord[] {
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function OralHygienePage() {
  const [data, setData] = useState<DayRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logSessions, setLogSessions] = useState(2)
  const [logMorning, setLogMorning] = useState(true)
  const [logEvening, setLogEvening] = useState(true)
  const [logDuration, setLogDuration] = useState(120)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/oral-hygiene')
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      setData(buildChartData(json.logs ?? []))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      await fetch('/api/oral-hygiene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logged_date: today,
          sessions: logSessions,
          morning: logMorning,
          afternoon: false,
          evening: logEvening,
          total_duration_seconds: logSessions * logDuration,
        }),
      })
      setShowLogForm(false)
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  // ── Derived statistics ────────────────────────────────────────────────────────

  const totalDays = data.length || 1
  const daysWithAnyBrush = data.filter((d) => d.sessions > 0).length
  const daysMetGoal = data.filter((d) => d.sessions >= 2).length
  const goalRate = Math.round((daysMetGoal / totalDays) * 100)
  const avgSessionsPerDay =
    Math.round((data.reduce((s, d) => s + d.sessions, 0) / totalDays) * 10) / 10

  const totalSessions = data.reduce((s, d) => s + d.sessions, 0)
  const totalDuration = data.reduce((s, d) => s + d.totalDuration, 0)
  const avgDurationPerSession = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0

  let currentStreak = 0
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].sessions > 0) currentStreak++
    else break
  }

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              🦷 Oral Hygiene
            </h1>
            <p className="text-sm text-text-secondary">
              Apple Watch autodetects brushing since Series 5
            </p>
          </div>
          <button
            onClick={() => setShowLogForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Log
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Manual log form ── */}
        {showLogForm && (
          <form onSubmit={handleLog} className="bg-surface rounded-xl border border-emerald-500/30 p-4 space-y-4">
            <h3 className="text-sm font-medium text-text-primary">Log Today&apos;s Brushing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Sessions today</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={logSessions}
                  onChange={(e) => setLogSessions(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Avg duration (sec)</label>
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={logDuration}
                  onChange={(e) => setLogDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm"
                />
              </div>
            </div>
            <div className="flex gap-4">
              {[
                { label: 'Morning', state: logMorning, set: setLogMorning },
                { label: 'Evening', state: logEvening, set: setLogEvening },
              ].map(({ label, state, set }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={(e) => set(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span className="text-sm text-text-secondary">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="px-4 py-2 rounded-lg bg-surface-secondary text-text-secondary text-sm hover:bg-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
        ) : (
          <>
            {daysWithAnyBrush === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-surface rounded-xl border border-border">
                <p className="text-3xl mb-3">🦷</p>
                <p className="text-sm font-medium text-text-primary mb-1">No brushing data yet</p>
                <p className="text-xs text-text-secondary mb-4">
                  Sync from the iOS app or tap Log to add today&apos;s session manually.
                </p>
              </div>
            )}

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{currentStreak}</p>
                <p className="text-xs text-text-secondary mt-0.5">Current Streak</p>
                <p className="text-xs text-text-secondary opacity-60">days</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{goalRate}%</p>
                <p className="text-xs text-text-secondary mt-0.5">Goal Rate</p>
                <p className="text-xs text-text-secondary opacity-60">2x/day met</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className="text-2xl font-bold text-teal-400">{avgSessionsPerDay}</p>
                <p className="text-xs text-text-secondary mt-0.5">Avg Sessions</p>
                <p className="text-xs text-text-secondary opacity-60">per day</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className="text-2xl font-bold text-cyan-400">{avgDurationPerSession}s</p>
                <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
                <p className="text-xs text-text-secondary opacity-60">per session</p>
              </div>
            </div>

            {/* ── 90-day brushing frequency chart ── */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Daily Brushing Frequency</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Last 90 days — green = goal met (2×), orange = under</p>
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
                <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap="8%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
                    label={{ value: 'Goal', position: 'insideTopRight', fontSize: 9, fill: '#22c55e' }}
                  />
                  <Bar dataKey="sessions" radius={[2, 2, 0, 0]} maxBarSize={8}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.sessions >= 2 ? '#10b981' : entry.sessions === 1 ? '#f97316' : '#374151'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Duration distribution + Time-of-day ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Duration distribution pie */}
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-primary mb-1">Session Duration</h3>
                <p className="text-xs text-text-secondary mb-3">Distribution across brushing days</p>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie
                        data={durationPieData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={58}
                        innerRadius={28}
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
                    <div className="pt-1 border-t border-border">
                      <p className="text-xs text-text-secondary">
                        ADA recommends <span className="text-emerald-400 font-medium">2 min</span> per session
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time-of-day radar */}
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-text-primary mb-1">Time of Day</h3>
                <p className="text-xs text-text-secondary mb-3">When you brush most often</p>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={130} height={130}>
                    <RadarChart cx="50%" cy="50%" outerRadius={50} data={todData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
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
                      <div key={entry.subject} className="flex items-center gap-2">
                        <div className="flex-1">
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
                      </div>
                    ))}
                    <p className="text-xs text-text-secondary pt-1 border-t border-border">
                      Ideal: morning + evening bookends
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Science section ── */}
        <div className="bg-surface rounded-xl border border-emerald-500/30 p-4 relative overflow-hidden">
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
                    The American Dental Association recommends brushing <strong className="text-text-primary">twice daily</strong> for a minimum of <strong className="text-text-primary">2 minutes</strong> each session — morning and before bed.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">Cardiovascular Link</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Dietrich et al. (2013) found that brushing teeth &lt;2×/day was associated with a significantly higher risk of cardiovascular events — likely via oral bacteria and systemic inflammation.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">How Apple Watch Detects Brushing</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Apple Watch Series 5+ uses its accelerometer and gyroscope to classify the repetitive wrist motion of toothbrushing. The motion model was trained on labeled brushing sessions and fires automatically when the pattern is detected for ≥5 seconds.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">Why 2 Minutes?</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Studies show most people brush for only 45–70 seconds. Two minutes ensures all quadrants receive adequate coverage and fluoride contact time for remineralisation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Setup guide ── */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              Setup Guide
            </h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Apple Watch detects brushing automatically on Series 5 and later. No manual logging required.
          </p>
          <ol className="space-y-3">
            {[
              {
                step: '1',
                title: 'Wear your Apple Watch while brushing',
                body: 'Apple Watch Series 5 or later detects toothbrushing automatically via motion. Keep the watch on the same wrist you brush with.',
              },
              {
                step: '2',
                title: 'Enable Toothbrushing detection',
                body: 'Open the Health app on your iPhone → Browse → Dental → Toothbrushing → turn on "Apple Watch Detection".',
              },
              {
                step: '3',
                title: 'Check your data in Health',
                body: 'After brushing, a notification will appear confirming detection. Review your history under Health → Browse → Dental.',
              },
              {
                step: '4',
                title: 'Sync to KQuarks',
                body: 'Go to Sync in KQuarks and grant Health access. Your brushing events (toothbrushingEvent) will import automatically.',
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
          <div className="mt-4 px-3 py-2.5 bg-surface-secondary rounded-lg">
            <p className="text-xs text-text-secondary">
              <span className="text-cyan-400 font-medium">Compatibility:</span> Apple Watch Series 5, SE (1st gen), Series 6, 7, 8, 9, Ultra, Ultra 2, Series 10 running watchOS 7 or later. Older models cannot detect brushing via motion.
            </p>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}

