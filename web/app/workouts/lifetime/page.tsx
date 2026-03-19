import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { LifetimeClient } from './lifetime-client'

export const metadata = { title: 'Lifetime Training' }

const SPORT_MAP: Record<string, string> = {
  Running: 'Running',
  Cycling: 'Cycling',
  Swimming: 'Swimming',
  'Strength Training': 'Strength',
  'Functional Strength Training': 'Strength',
  'Core Training': 'Strength',
  'Cross Training': 'Strength',
  Hiking: 'Hiking',
  HIIT: 'HIIT',
  'High Intensity Interval Training': 'HIIT',
  Rowing: 'Rowing',
  'Indoor Rowing': 'Rowing',
  Walking: 'Walking',
  Yoga: 'Yoga',
}

const SPORT_COLORS: Record<string, string> = {
  Running: '#f97316',
  Cycling: '#3b82f6',
  Swimming: '#06b6d4',
  Strength: '#ef4444',
  HIIT: '#f43f5e',
  Hiking: '#22c55e',
  Rowing: '#a855f7',
  Walking: '#84cc16',
  Yoga: '#ec4899',
  Other: '#94a3b8',
}

const GROUP_ORDER = [
  'Running', 'Cycling', 'Swimming', 'Strength', 'HIIT',
  'Hiking', 'Rowing', 'Walking', 'Yoga', 'Other',
]

// Sports that accumulate meaningful km distance
const DISTANCE_SPORTS = new Set(['Running', 'Cycling', 'Swimming', 'Hiking', 'Walking', 'Rowing'])

export interface YearStat {
  year: number
  sessions: number
  hours: number
}

export interface SportLifetime {
  sport: string
  sessions: number
  hours: number
  km: number | null
  color: string
}

export interface LifetimeData {
  totalSessions: number
  totalHours: number
  totalKm: number
  totalCalories: number
  totalWorkoutDays: number
  firstWorkoutDate: string | null
  sportStats: SportLifetime[]
  yearStats: YearStat[]
  bestYear: number | null
  bestYearSessions: number
  runKm: number
  cycleKm: number
  swimKm: number
}

export default async function LifetimeTrainingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time, workout_type, duration_minutes, distance_meters, active_calories, avg_heart_rate')
    .eq('user_id', user.id)
    .gt('duration_minutes', 3)
    .order('start_time', { ascending: true })

  const rows = workouts ?? []

  // Overall totals
  let totalSessions = 0
  let totalMinutes = 0
  let totalDistanceM = 0
  let totalCalories = 0

  // Per-sport accumulators
  const sportSessions: Record<string, number> = {}
  const sportMinutes: Record<string, number> = {}
  const sportDistanceM: Record<string, number> = {}
  for (const g of GROUP_ORDER) {
    sportSessions[g] = 0
    sportMinutes[g] = 0
    sportDistanceM[g] = 0
  }

  // Year accumulators
  const yearSessions: Record<number, number> = {}
  const yearMinutes: Record<number, number> = {}

  // Unique calendar dates for streak / workout days calculation
  const uniqueDates = new Set<string>()

  // First workout date
  let firstWorkoutDate: string | null = null

  for (const w of rows) {
    const d = new Date(w.start_time)
    const dateStr = d.toISOString().slice(0, 10)
    const year = d.getFullYear()
    const sport = SPORT_MAP[w.workout_type] ?? 'Other'
    const mins = w.duration_minutes ?? 0
    const distM = w.distance_meters ?? 0
    const cals = w.active_calories ?? 0

    totalSessions++
    totalMinutes += mins
    totalDistanceM += distM
    totalCalories += cals

    sportSessions[sport] = (sportSessions[sport] ?? 0) + 1
    sportMinutes[sport] = (sportMinutes[sport] ?? 0) + mins
    sportDistanceM[sport] = (sportDistanceM[sport] ?? 0) + distM

    yearSessions[year] = (yearSessions[year] ?? 0) + 1
    yearMinutes[year] = (yearMinutes[year] ?? 0) + mins

    uniqueDates.add(dateStr)

    if (!firstWorkoutDate) firstWorkoutDate = w.start_time
  }

  // Sport stats sorted by sessions desc, only sports with >= 1 session
  const sportStats: SportLifetime[] = GROUP_ORDER
    .filter((g) => (sportSessions[g] ?? 0) >= 1)
    .map((g) => ({
      sport: g,
      sessions: sportSessions[g] ?? 0,
      hours: (sportMinutes[g] ?? 0) / 60,
      km: DISTANCE_SPORTS.has(g) ? (sportDistanceM[g] ?? 0) / 1000 : null,
      color: SPORT_COLORS[g] ?? '#94a3b8',
    }))
    .sort((a, b) => b.sessions - a.sessions)

  // Year-over-year stats sorted ascending
  const yearStats: YearStat[] = Object.keys(yearSessions)
    .map(Number)
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      sessions: yearSessions[year] ?? 0,
      hours: (yearMinutes[year] ?? 0) / 60,
    }))

  // Best year
  let bestYear: number | null = null
  let bestYearSessions = 0
  for (const ys of yearStats) {
    if (ys.sessions > bestYearSessions) {
      bestYearSessions = ys.sessions
      bestYear = ys.year
    }
  }

  // Longest consecutive-day streak
  const sortedDates = [...uniqueDates].sort()
  let longestActiveStreak = 0
  let currentStreak = 0
  let prevDate: Date | null = null
  for (const ds of sortedDates) {
    const d = new Date(ds)
    if (prevDate) {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / 86_400_000)
      if (diffDays === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
    } else {
      currentStreak = 1
    }
    if (currentStreak > longestActiveStreak) longestActiveStreak = currentStreak
    prevDate = d
  }

  const data: LifetimeData = {
    totalSessions,
    totalHours: totalMinutes / 60,
    totalKm: totalDistanceM / 1000,
    totalCalories,
    totalWorkoutDays: uniqueDates.size,
    firstWorkoutDate,
    sportStats,
    yearStats,
    bestYear,
    bestYearSessions,
    runKm: (sportDistanceM['Running'] ?? 0) / 1000,
    cycleKm: (sportDistanceM['Cycling'] ?? 0) / 1000,
    swimKm: (sportDistanceM['Swimming'] ?? 0) / 1000,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Lifetime Training</h1>
            <p className="text-sm text-text-secondary">{totalSessions} total sessions</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <LifetimeClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
