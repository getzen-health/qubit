'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trophy, X, TrendingUp, Bike, Waves, Mountain } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Workout {
  id: string
  workout_type: string
  start_time: string
  duration_minutes: number
  active_calories?: number
  distance_meters?: number
  avg_heart_rate?: number
  avg_pace_per_km?: number  // seconds per km
}

const WORKOUT_ICONS: Record<string, string> = {
  Running: '🏃',
  Walking: '🚶',
  Hiking: '🥾',
  Cycling: '🚴',
  Swimming: '🏊',
  'Strength Training': '💪',
  Yoga: '🧘',
  HIIT: '⚡',
  Rowing: '🚣',
  Pilates: '🤸',
  Dance: '💃',
}

function workoutIcon(type: string): string {
  return WORKOUT_ICONS[type] ?? '⚡'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Workout types that have meaningful pace data
const DISTANCE_TYPES = new Set(['Running', 'Cycling', 'Walking', 'Hiking', 'Rowing'])

function fmtPace(secsPerKm: number): string {
  const min = Math.floor(secsPerKm / 60)
  const sec = Math.round(secsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function PaceChart({ workouts }: { workouts: Workout[] }) {
  const withPace = [...workouts]
    .filter((w) => w.avg_pace_per_km && w.avg_pace_per_km > 0)
    .reverse() // oldest first for chart
    .slice(-30) // last 30 sessions
    .map((w) => ({
      date: new Date(w.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      paceRaw: w.avg_pace_per_km!,
      // Invert for chart: lower seconds = faster = higher on chart
      // We'll use negative of secsPerKm so that "better" is visually up
      paceDisplay: w.avg_pace_per_km!,
      paceLabel: fmtPace(w.avg_pace_per_km!),
    }))

  if (withPace.length < 2) return null

  const bestPace = Math.min(...withPace.map((d) => d.paceRaw))
  const avgPace = withPace.reduce((s, d) => s + d.paceRaw, 0) / withPace.length

  // Invert Y axis so faster (lower sec) = higher on chart
  const yMin = Math.min(...withPace.map((d) => d.paceRaw)) - 10
  const yMax = Math.max(...withPace.map((d) => d.paceRaw)) + 10

  return (
    <div className="mb-6 bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Pace Trend</h2>
        <div className="flex gap-3 text-xs text-text-secondary">
          <span>Best <span className="text-green-400 font-medium">{fmtPace(bestPace)}/km</span></span>
          <span>Avg <span className="text-text-primary font-medium">{fmtPace(Math.round(avgPace))}/km</span></span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={withPace} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            hide
            domain={[yMin, yMax]}
            reversed
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(_: number, __: string, props: { payload?: { paceLabel: string } }) => [props.payload?.paceLabel ?? '', 'Pace']}
          />
          <Line
            type="monotone"
            dataKey="paceRaw"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 3, fill: '#6366f1' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-text-secondary text-center mt-1">Lower line = faster pace (chart inverted)</p>
    </div>
  )
}

const LOG_WORKOUT_TYPES = [
  'Running', 'Walking', 'Cycling', 'Swimming', 'Hiking',
  'Strength Training', 'HIIT', 'Yoga', 'Pilates', 'Rowing', 'Dance', 'Other',
]

function LogWorkoutModal({ onClose, onLogged }: { onClose: () => void; onLogged: () => void }) {
  const [type, setType] = useState('Running')
  const [durationHours, setDurationHours] = useState('')
  const [durationMins, setDurationMins] = useState('')
  const [calories, setCalories] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const hours = parseFloat(durationHours) || 0
    const mins = parseFloat(durationMins) || 0
    const totalMins = hours * 60 + mins
    if (totalMins <= 0) { setError('Enter a duration'); return }

    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        workout_type: type,
        duration_minutes: totalMins,
      }
      if (calories) body.active_calories = parseFloat(calories)
      if (distanceKm) body.distance_meters = parseFloat(distanceKm) * 1000
      if (heartRate) body.avg_heart_rate = parseInt(heartRate, 10)

      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        onLogged()
        onClose()
      } else {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Failed to save')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-text-primary">Log Workout</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Workout type */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {LOG_WORKOUT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    type === t
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  {workoutIcon(t)} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">Duration</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={0}
                max={24}
                placeholder="0"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-20 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-text-secondary text-sm">h</span>
              <input
                type="number"
                min={0}
                max={59}
                placeholder="30"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                className="w-20 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-text-secondary text-sm">min</span>
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Calories', placeholder: 'kcal', value: calories, set: setCalories },
              { label: 'Distance', placeholder: 'km', value: distanceKm, set: setDistanceKm },
              { label: 'Avg HR', placeholder: 'bpm', value: heartRate, set: setHeartRate },
            ].map(({ label, placeholder, value, set }) => (
              <div key={label}>
                <label className="text-[10px] text-text-secondary mb-1 block">{label}</label>
                <input
                  type="number"
                  min={0}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full px-2.5 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Workout'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface WorkoutsListProps {
  workouts: Workout[]
}

// Compute ISO week label "MMM d" for the Monday of each week
function weekLabel(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function WorkoutsList({ workouts }: WorkoutsListProps) {
  const [activeType, setActiveType] = useState<string | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const router = useRouter()

  // Unique types that appear in this user's workouts, preserving occurrence order
  const types = Array.from(new Set(workouts.map((w) => w.workout_type)))
  const filtered = activeType ? workouts.filter((w) => w.workout_type === activeType) : workouts

  // 12-week frequency chart (always from full workouts list, not filtered)
  const weekFrequency = (() => {
    const weeks: Map<string, number> = new Map()
    const now = new Date()
    // Seed last 12 weeks with 0 so missing weeks appear
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weeks.set(weekLabel(d), 0)
    }
    for (const w of workouts) {
      const label = weekLabel(new Date(w.start_time))
      if (weeks.has(label)) {
        weeks.set(label, (weeks.get(label) ?? 0) + 1)
      }
    }
    return Array.from(weeks.entries()).map(([week, count]) => ({ week, count }))
  })()

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
            <h1 className="text-xl font-bold text-text-primary">Workouts</h1>
            <p className="text-sm text-text-secondary">{workouts.length} sessions</p>
          </div>
          <Link
            href="/hiking"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Hiking analytics"
            title="Hiking Analytics"
          >
            <Mountain className="w-5 h-5" />
          </Link>
          <Link
            href="/swimming"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Swimming analytics"
            title="Swimming Analytics"
          >
            <Waves className="w-5 h-5" />
          </Link>
          <Link
            href="/cycling"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Cycling analytics"
            title="Cycling Analytics"
          >
            <Bike className="w-5 h-5" />
          </Link>
          <Link
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Running analytics"
            title="Running Analytics"
          >
            <TrendingUp className="w-5 h-5" />
          </Link>
          <Link
            href="/workouts/prs"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Workout personal records"
          >
            <Trophy className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Pace chart — only for distance-based workout types */}
        {activeType && DISTANCE_TYPES.has(activeType) && (
          <PaceChart workouts={filtered} />
        )}

        {/* 12-week frequency chart */}
        {workouts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Weekly Frequency</h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weekFrequency} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface, #1a1a1a)',
                    border: '1px solid var(--color-border, #333)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value, 'Workouts']}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Type filter chips */}
        {types.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <button
              onClick={() => setActiveType(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeType === null
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              All
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(activeType === type ? null : type)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeType === type
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {workoutIcon(type)} {type}
              </button>
            ))}
          </div>
        )}

        {workouts.length > 0 && (() => {
          const totalMinutes = filtered.reduce((s, w) => s + w.duration_minutes, 0)
          const totalCal = filtered.reduce((s, w) => s + (w.active_calories ?? 0), 0)
          const h = Math.floor(totalMinutes / 60)
          const m = totalMinutes % 60
          return (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Sessions', value: filtered.length.toString() },
                { label: 'Total Time', value: h > 0 ? `${h}h ${m}m` : `${m}m` },
                { label: 'Calories', value: totalCal > 0 ? `${Math.round(totalCal).toLocaleString()} cal` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
                  <p className="text-lg font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )
        })()}
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">⚡</span>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No workouts yet</h2>
            <p className="text-sm text-text-secondary">
              Sync your iPhone to import workouts from Apple Health.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.length === 0 ? (
              <p className="text-center text-text-secondary py-12">No {activeType} workouts found.</p>
            ) : (() => {
              // Group by month label
              const groups: { label: string; items: typeof filtered }[] = []
              for (const workout of filtered) {
                const label = new Date(workout.start_time).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                const last = groups[groups.length - 1]
                if (last && last.label === label) {
                  last.items.push(workout)
                } else {
                  groups.push({ label, items: [workout] })
                }
              }
              return groups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">{group.label}</h3>
                  <div className="space-y-2">
                    {group.items.map((workout) => {
                      const date = new Date(workout.start_time)
                      const stats: string[] = [formatDuration(workout.duration_minutes)]
                      if (workout.active_calories && workout.active_calories > 0) {
                        stats.push(`${Math.round(workout.active_calories)} cal`)
                      }
                      if (workout.distance_meters && workout.distance_meters > 0) {
                        stats.push(`${(workout.distance_meters / 1000).toFixed(1)} km`)
                      }
                      if (workout.avg_heart_rate && workout.avg_heart_rate > 0) {
                        stats.push(`${workout.avg_heart_rate} bpm avg`)
                      }
                      return (
                        <Link
                          key={workout.id}
                          href={`/workouts/${workout.id}`}
                          className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border hover:bg-surface-secondary transition-colors"
                        >
                          <span className="text-3xl">{workoutIcon(workout.workout_type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-text-primary truncate">
                                {workout.workout_type}
                              </span>
                              <span className="text-sm text-text-secondary shrink-0">
                                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-text-secondary mt-0.5">{stats.join(' · ')}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
          </div>
        )}
      </main>
      <BottomNav />

      {showLogModal && (
        <LogWorkoutModal
          onClose={() => setShowLogModal(false)}
          onLogged={() => router.refresh()}
        />
      )}
    </div>
  )
}
