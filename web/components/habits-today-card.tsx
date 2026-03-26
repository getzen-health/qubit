import Link from 'next/link'
import { CheckCircle2, Circle, Flame, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

export function HabitsTodayCard() {
  const [habits, setHabits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/habits')
      .then((r) => r.json())
      .then((data) => {
        setHabits(data)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="bg-surface rounded-2xl border border-border p-5 animate-pulse h-24" />
  )
  if (!habits.length) return (
    <div className="bg-surface rounded-2xl border border-border p-5 flex flex-col items-center justify-center gap-2">
      <span className="text-2xl">✨</span>
      <span className="text-sm text-text-secondary">No habits yet</span>
      <Link href="/habits" className="mt-1 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold">Add Habit</Link>
    </div>
  )
  const todayDone = habits.filter((h) => h.is_done_today).length
  return (
    <Link href="/habits" className="block bg-surface rounded-2xl border border-border p-5 hover:bg-surface-secondary transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xl">✅</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Habits</p>
          <p className="text-xs text-text-secondary">{todayDone}/{habits.length} done today</p>
        </div>
        <div className="flex items-center gap-1">
          {habits.slice(0, 3).map((h) => (
            <span key={h.id} className="text-xl">{h.icon}</span>
          ))}
        </div>
        <Plus className="w-4 h-4 text-accent ml-2" />
      </div>
    </Link>
  )
}
