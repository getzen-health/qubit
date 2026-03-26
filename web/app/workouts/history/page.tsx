"use client"
import { useState, useEffect, useCallback } from 'react'
import { Activity, Clock, Flame, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import Link from 'next/link'

const WORKOUT_ICONS: Record<string, string> = {
  Running: '🏃', Cycling: '🚴', Swimming: '🏊', Walking: '🚶',
  Strength: '💪', HIIT: '⚡', Yoga: '🧘', Hiking: '🥾',
  default: '🏋️'
}

const WORKOUT_TYPES = ['All', 'Running', 'Cycling', 'Swimming', 'Walking', 'Strength', 'HIIT', 'Yoga']

interface Workout {
  id: string
  type: string
  workout_date: string
  duration_minutes: number
  calories: number | null
  notes: string | null
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const [expanded, setExpanded] = useState(false)
  const icon = WORKOUT_ICONS[workout.type] ?? WORKOUT_ICONS.default

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface/80 transition-colors">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">{workout.type}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{workout.duration_minutes}min</span>
            {workout.calories && <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{workout.calories} kcal</span>}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 grid grid-cols-2 gap-3">
          {workout.duration_minutes && <div className="bg-background rounded-lg p-3 text-center"><p className="text-xs text-text-secondary">Duration</p><p className="font-bold text-text-primary">{workout.duration_minutes} min</p></div>}
          {workout.calories && <div className="bg-background rounded-lg p-3 text-center"><p className="text-xs text-text-secondary">Calories</p><p className="font-bold text-text-primary">{workout.calories}</p></div>}
          {workout.notes && <div className="col-span-2 bg-background rounded-lg p-3"><p className="text-xs text-text-secondary mb-1">Notes</p><p className="text-sm text-text-primary">{workout.notes}</p></div>}
        </div>
      )}
    </div>
  )
}

function groupByDate(workouts: Workout[]): Record<string, Workout[]> {
  return workouts.reduce<Record<string, Workout[]>>((acc, w) => {
    const date = new Date(w.workout_date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(w)
    return acc
  }, {})
}

export default function WorkoutHistoryPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback((type: string, pg: number, append = false) => {
    const params = new URLSearchParams({ page: String(pg) })
    if (type !== 'All') params.set('type', type)
    setLoading(true)
    fetch(`/api/workouts/history?${params}`)
      .then(r => r.json())
      .then(d => {
        setWorkouts(prev => append ? [...prev, ...(d.data ?? [])] : (d.data ?? []))
        setHasMore(d.hasMore ?? false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setPage(1)
    load(filter, 1, false)
  }, [filter, load])

  const grouped = groupByDate(workouts)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workout History</h1>
          <p className="text-text-secondary text-sm">{workouts.length} sessions</p>
        </div>
        <Link href="/workouts" className="text-sm text-primary hover:underline">Log workout →</Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {WORKOUT_TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${filter === t ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary hover:text-text-primary'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && page === 1 && (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />)}</div>
      )}

      {!loading && workouts.length === 0 && (
        <div className="text-center py-16">
          <Activity className="w-12 h-12 text-text-secondary mx-auto mb-3" />
          <p className="font-semibold text-text-primary">No workouts found</p>
          <p className="text-text-secondary text-sm mt-1">Start logging your workouts to see history here.</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">{date}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              {items.map(w => <WorkoutCard key={w.id} workout={w} />)}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button onClick={() => { const next = page + 1; setPage(next); load(filter, next, true) }}
          className="w-full mt-6 py-3 border border-border rounded-xl text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
