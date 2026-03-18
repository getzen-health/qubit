'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, Flame } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'


interface Habit {
  id: string
  name: string
  emoji: string
  target_days: string[]
  sort_order: number
  created_at: string
}

interface Completion {
  habit_id: string
  date: string
}

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const ALL_DAYS_LABEL = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const EMOJI_PRESETS = ['💧', '🏃', '📚', '🧘', '🥗', '😴', '💊', '🚶', '🧘', '✍️', '🎯', '💪', '🌿', '☀️', '🍎']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function todayDow(): string {
  return DOW[new Date().getDay()]
}

function computeStreak(habitId: string, completions: Completion[]): number {
  const datesSet = new Set(
    completions.filter((c) => c.habit_id === habitId).map((c) => c.date)
  )
  let streak = 0
  const d = new Date()
  // Check today first, then go backwards
  for (let i = 0; i < 90; i++) {
    const dateStr = new Date(d.getTime() - i * 86400000).toISOString().slice(0, 10)
    if (datesSet.has(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

function computeCompletionRate(habitId: string, completions: Completion[], days = 30): number {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const doneCount = completions.filter(
    (c) => c.habit_id === habitId && c.date >= since
  ).length
  return Math.round((doneCount / days) * 100)
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<Set<string>>(new Set())

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✅')
  const [newDays, setNewDays] = useState<string[]>(ALL_DAYS)
  const [adding, setAdding] = useState(false)

  const today = todayStr()
  const todayDowStr = todayDow()

  const load = useCallback(async () => {
    const res = await fetch('/api/habits?days=30')
    if (res.ok) {
      const { habits: h, completions: c } = await res.json()
      setHabits(h ?? [])
      setCompletions(c ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (habit: Habit, date: string) => {
    const key = `${habit.id}:${date}`
    if (toggling.has(key)) return
    setToggling((prev) => new Set(prev).add(key))

    const isCompleted = completions.some((c) => c.habit_id === habit.id && c.date === date)
    const newCompleted = !isCompleted

    // Optimistic update
    setCompletions((prev) =>
      newCompleted
        ? [...prev, { habit_id: habit.id, date }]
        : prev.filter((c) => !(c.habit_id === habit.id && c.date === date))
    )

    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habit.id, date, completed: newCompleted }),
    })

    setToggling((prev) => {
      const s = new Set(prev)
      s.delete(key)
      return s
    })
  }

  const archive = async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
    await fetch(`/api/habits/manage?id=${id}`, { method: 'DELETE' })
  }

  const addHabit = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/habits/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, target_days: newDays }),
    })
    if (res.ok) {
      await load()
      setNewName('')
      setNewEmoji('✅')
      setNewDays(ALL_DAYS)
      setShowAdd(false)
    }
    setAdding(false)
  }

  const todayHabits = habits.filter((h) => h.target_days.includes(todayDowStr))
  const todayDone = todayHabits.filter((h) =>
    completions.some((c) => c.habit_id === h.id && c.date === today)
  ).length

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Habits</h1>
            <p className="text-sm text-text-secondary">
              {todayHabits.length > 0
                ? `${todayDone}/${todayHabits.length} done today`
                : 'Build daily routines'}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* Add habit form */}
        {showAdd && (
          <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
            <p className="text-sm font-semibold text-text-primary">New Habit</p>

            {/* Emoji picker */}
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">Icon</p>
              <div className="flex flex-wrap gap-2">
                {EMOJI_PRESETS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      newEmoji === e
                        ? 'bg-accent/20 ring-2 ring-accent'
                        : 'bg-surface-secondary hover:bg-surface-secondary/80'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <p className="text-xs text-text-secondary">Habit name</p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                placeholder="e.g. Drink 8 glasses of water"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Days */}
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">Track on</p>
              <div className="flex gap-1.5">
                {ALL_DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() =>
                      setNewDays((prev) =>
                        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                      )
                    }
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      newDays.includes(day)
                        ? 'bg-accent text-white'
                        : 'bg-surface-secondary text-text-secondary'
                    }`}
                  >
                    {ALL_DAYS_LABEL[i]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addHabit}
                disabled={adding || !newName.trim()}
                className="flex-1 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40"
              >
                {adding ? 'Adding…' : 'Add Habit'}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && habits.length === 0 && !showAdd && (
          <div className="text-center py-16 space-y-3">
            <p className="text-5xl">🎯</p>
            <p className="text-sm font-semibold text-text-primary">No habits yet</p>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Habits help you build consistent routines. Tap Add to create your first one.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium"
            >
              Add your first habit
            </button>
          </div>
        )}

        {/* Today's habits */}
        {!loading && todayHabits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Today</p>

            {/* Progress bar */}
            <div className="bg-surface rounded-xl border border-border px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">Today&apos;s progress</span>
                <span className="text-xs font-semibold text-text-primary">{todayDone}/{todayHabits.length}</span>
              </div>
              <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: todayHabits.length > 0 ? `${(todayDone / todayHabits.length) * 100}%` : '0%' }}
                />
              </div>
              {todayDone === todayHabits.length && todayHabits.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-green-400 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All done! Great work 🎉
                </div>
              )}
            </div>

            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              {todayHabits.map((habit, i) => {
                const done = completions.some((c) => c.habit_id === habit.id && c.date === today)
                const streak = computeStreak(habit.id, completions)
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < todayHabits.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <button
                      onClick={() => toggle(habit, today)}
                      className="shrink-0 transition-transform active:scale-90"
                    >
                      {done
                        ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                        : <Circle className="w-6 h-6 text-text-secondary/40" />
                      }
                    </button>
                    <span className="text-xl">{habit.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${done ? 'text-text-secondary line-through opacity-60' : 'text-text-primary'}`}>
                        {habit.name}
                      </p>
                      {streak > 1 && (
                        <div className="flex items-center gap-1 text-orange-400 text-xs mt-0.5">
                          <Flame className="w-3 h-3" />
                          {streak}-day streak
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => archive(habit.id)}
                      className="p-1.5 rounded-lg text-text-secondary/30 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All habits + stats */}
        {!loading && habits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">All Habits</p>
            <div className="space-y-2">
              {habits.map((habit) => {
                const streak = computeStreak(habit.id, completions)
                const rate = computeCompletionRate(habit.id, completions, 30)
                return (
                  <div key={habit.id} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-3">
                    <span className="text-xl">{habit.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{habit.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-text-secondary">{rate}% last 30d</span>
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-orange-400 text-xs">
                            <Flame className="w-3 h-3" />
                            {streak}
                          </div>
                        )}
                        <span className="text-xs text-text-secondary/50">
                          {habit.target_days.length === 7 ? 'Every day' : habit.target_days.join(', ')}
                        </span>
                      </div>
                    </div>
                    {/* 7-day mini history */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(Date.now() - (6 - i) * 86400000)
                        const ds = d.toISOString().slice(0, 10)
                        const done = completions.some((c) => c.habit_id === habit.id && c.date === ds)
                        const targetDay = DOW[d.getDay()]
                        const isTarget = habit.target_days.includes(targetDay)
                        return (
                          <div
                            key={ds}
                            className={`w-3 h-3 rounded-sm ${
                              done ? 'bg-green-400' : isTarget ? 'bg-surface-secondary' : 'bg-transparent'
                            }`}
                          />
                        )
                      })}
                    </div>
                    <button
                      onClick={() => archive(habit.id)}
                      className="p-1.5 rounded-lg text-text-secondary/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Past days quick log */}
        {!loading && habits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Past 7 Days</p>
            <div className="bg-surface rounded-2xl border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-text-secondary font-medium">Habit</th>
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(Date.now() - (6 - i) * 86400000)
                      const isToday = d.toISOString().slice(0, 10) === today
                      return (
                        <th key={i} className={`px-2 py-2 text-center font-medium w-10 ${isToday ? 'text-accent' : 'text-text-secondary'}`}>
                          {d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                          <br />
                          <span className="opacity-60">{d.getDate()}</span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit, hi) => (
                    <tr key={habit.id} className={hi < habits.length - 1 ? 'border-b border-border' : ''}>
                      <td className="px-4 py-2 text-text-primary font-medium">
                        {habit.emoji} {habit.name}
                      </td>
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(Date.now() - (6 - i) * 86400000)
                        const ds = d.toISOString().slice(0, 10)
                        const dow = DOW[d.getDay()]
                        const isTarget = habit.target_days.includes(dow)
                        const done = completions.some((c) => c.habit_id === habit.id && c.date === ds)
                        return (
                          <td key={ds} className="px-2 py-2 text-center">
                            {isTarget ? (
                              <button
                                onClick={() => toggle(habit, ds)}
                                className="mx-auto flex items-center justify-center w-7 h-7 rounded-full transition-colors"
                              >
                                {done
                                  ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                                  : <Circle className="w-5 h-5 text-text-secondary/30" />
                                }
                              </button>
                            ) : (
                              <span className="text-text-secondary/20">·</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
