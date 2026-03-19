'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Flame, Clock, Dumbbell, Activity } from 'lucide-react'

interface WorkoutEntry {
  id: string
  type: string
  durationMinutes: number
  distanceKm: number | null
  calories: number | null
  avgHr: number | null
}

interface WorkoutDay {
  date: string
  workouts: WorkoutEntry[]
}

interface Props {
  days: WorkoutDay[]
}

// Workout type → color + icon label
const TYPE_CONFIG: Record<string, { color: string; dot: string }> = {
  Running:           { color: '#f97316', dot: 'bg-orange-500' },
  Cycling:           { color: '#3b82f6', dot: 'bg-blue-500' },
  Swimming:          { color: '#06b6d4', dot: 'bg-cyan-500' },
  'Strength Training': { color: '#ef4444', dot: 'bg-red-500' },
  HIIT:              { color: '#ec4899', dot: 'bg-pink-500' },
  Hiking:            { color: '#22c55e', dot: 'bg-green-500' },
  Rowing:            { color: '#0ea5e9', dot: 'bg-sky-500' },
  Walking:           { color: '#84cc16', dot: 'bg-lime-500' },
  Yoga:              { color: '#a855f7', dot: 'bg-purple-500' },
  Pilates:           { color: '#d946ef', dot: 'bg-fuchsia-500' },
  Elliptical:        { color: '#f59e0b', dot: 'bg-amber-500' },
}

function typeColor(type: string): string {
  return TYPE_CONFIG[type]?.color ?? '#6366f1'
}

function typeDot(type: string): string {
  return TYPE_CONFIG[type]?.dot ?? 'bg-indigo-500'
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${Math.round(mins)}m`
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WorkoutCalendarClient({ days }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Index all workout days by date string
  const dayMap = useMemo(() => {
    const m = new Map<string, WorkoutEntry[]>()
    for (const d of days) m.set(d.date, d.workouts)
    return m
  }, [days])

  // Build calendar grid
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay() // 0=Sun
    const cells: Array<{ date: string | null; day: number | null }> = []
    for (let i = 0; i < startPad; i++) cells.push({ date: null, day: null })
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ date: dateStr, day: d })
    }
    return cells
  }, [year, month])

  // Month-level stats
  const monthStats = useMemo(() => {
    const prefix = monthKey(year, month)
    let totalWorkouts = 0, totalMins = 0, totalKm = 0, totalCal = 0
    for (const [date, ws] of dayMap.entries()) {
      if (!date.startsWith(prefix)) continue
      totalWorkouts += ws.length
      totalMins += ws.reduce((s, w) => s + w.durationMinutes, 0)
      totalKm += ws.reduce((s, w) => s + (w.distanceKm ?? 0), 0)
      totalCal += ws.reduce((s, w) => s + (w.calories ?? 0), 0)
    }
    return { totalWorkouts, totalMins, totalKm: Math.round(totalKm * 10) / 10, totalCal: Math.round(totalCal) }
  }, [dayMap, year, month])

  // Training streak (consecutive days with ≥1 workout up to today)
  const streak = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    let streak = 0
    let d = new Date()
    while (true) {
      const ds = d.toISOString().slice(0, 10)
      if (ds > today) { d.setDate(d.getDate() - 1); continue }
      if (dayMap.has(ds)) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
    return streak
  }, [dayMap])

  // Navigation
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }
  const canGoForward = !(year === now.getFullYear() && month === now.getMonth())

  const selectedWorkouts = selectedDate ? (dayMap.get(selectedDate) ?? []) : []

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📅</span>
        <h2 className="text-lg font-semibold text-text-primary">No workouts yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">Sync your health data to see your training calendar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Month summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Workouts', value: monthStats.totalWorkouts.toString(), icon: <Dumbbell className="w-4 h-4" />, color: 'text-violet-400' },
          { label: 'Time', value: fmtDuration(monthStats.totalMins), icon: <Clock className="w-4 h-4" />, color: 'text-blue-400' },
          { label: 'Distance', value: monthStats.totalKm > 0 ? `${monthStats.totalKm} km` : '—', icon: <Activity className="w-4 h-4" />, color: 'text-green-400' },
          { label: 'Calories', value: monthStats.totalCal > 0 ? `${monthStats.totalCal.toLocaleString()}` : '—', icon: <Flame className="w-4 h-4" />, color: 'text-orange-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <div className={`flex items-center justify-center gap-1 mt-0.5 ${color}`}>{icon}
              <p className="text-xs font-medium text-text-primary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Streak banner */}
      {streak >= 2 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-semibold text-orange-400">{streak}-day training streak</p>
            <p className="text-xs text-text-secondary">Keep it going — you're building momentum!</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-surface rounded-xl border border-border p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h2 className="text-base font-semibold text-text-primary">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} disabled={canGoForward === false} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-30">
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-text-secondary py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px">
          {grid.map((cell, i) => {
            if (!cell.date) return <div key={i} />
            const cellWorkouts = dayMap.get(cell.date) ?? []
            const isToday = cell.date === now.toISOString().slice(0, 10)
            const isSelected = cell.date === selectedDate
            const hasWorkout = cellWorkouts.length > 0

            return (
              <button
                key={cell.date}
                onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                className={`
                  relative flex flex-col items-center justify-start pt-1 pb-1.5 rounded-lg min-h-[52px] transition-colors
                  ${isSelected ? 'bg-violet-500/20 border border-violet-500/40' : hasWorkout ? 'hover:bg-surface-secondary' : 'hover:bg-surface-secondary/50'}
                  ${isToday ? 'ring-1 ring-violet-400/60' : ''}
                `}
              >
                <span className={`text-xs font-medium leading-none mb-1 ${
                  isToday ? 'text-violet-400' : hasWorkout ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {cell.day}
                </span>
                {/* Workout dots (max 3 visible) */}
                <div className="flex flex-wrap gap-0.5 justify-center px-0.5">
                  {cellWorkouts.slice(0, 3).map((w, j) => (
                    <div
                      key={j}
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: typeColor(w.type) }}
                    />
                  ))}
                  {cellWorkouts.length > 3 && (
                    <span className="text-[9px] text-text-secondary leading-tight">+{cellWorkouts.length - 3}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          {selectedWorkouts.length === 0 ? (
            <p className="text-sm text-text-secondary">Rest day</p>
          ) : (
            <div className="space-y-2">
              {selectedWorkouts.map((w) => (
                <div key={w.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: typeColor(w.type) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{w.type}</p>
                    <div className="flex gap-3 text-xs text-text-secondary mt-0.5">
                      {w.durationMinutes > 0 && <span>{fmtDuration(w.durationMinutes)}</span>}
                      {w.distanceKm && <span>{w.distanceKm.toFixed(1)} km</span>}
                      {w.calories && <span>{Math.round(w.calories)} kcal</span>}
                      {w.avgHr && <span>{Math.round(w.avgHr)} bpm avg</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Workout Types</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
              <span className="text-xs text-text-secondary">{type}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs text-text-secondary">Other</span>
          </div>
        </div>
      </div>
    </div>
  )
}
