import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const ConsistencyClient = dynamic(() => import('./consistency-client').then(m => ({ default: m.ConsistencyClient })), { ssr: false })

export const metadata = { title: 'Training Consistency' }

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

const SPORT_ORDER = ['Running', 'Cycling', 'Swimming', 'Strength', 'HIIT', 'Hiking', 'Rowing', 'Walking', 'Yoga', 'Other']

export interface WeekConsistency {
  weekLabel: string  // "Jan W1"
  weekStart: string  // ISO date
  totalSessions: number
  trainingDays: number
  [sport: string]: number | string  // sport group → session count
}

export interface ConsistencyData {
  weeks: WeekConsistency[]
  totalSessions52w: number
  activeWeeks: number
  avgSessionsPerActiveWeek: number
  currentStreak: number
  longestStreak: number
  bestWeekSessions: number
  bestWeekLabel: string
  activeSports: { sport: string; sessions: number; color: string }[]
  sports: string[]  // active sport groups with data
  sportColors: Record<string, string>
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function weekLabel(monday: Date): string {
  const month = monday.toLocaleDateString('en-US', { month: 'short' })
  const weekOfMonth = Math.ceil(monday.getDate() / 7)
  return `${month} W${weekOfMonth}`
}

export default async function WorkoutConsistencyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: raw } = await supabase
    .from('workout_records')
    .select('start_time, workout_type, duration_minutes')
    .eq('user_id', user.id)
    .gte('start_time', oneYearAgo.toISOString())
    .gt('duration_minutes', 5)
    .order('start_time', { ascending: true })

  const workouts = raw ?? []

  // Build 52 Monday-anchored week buckets
  const now = new Date()
  const thisMonday = getMonday(now)

  const weekMap = new Map<string, WeekConsistency>()
  for (let i = 51; i >= 0; i--) {
    const monday = new Date(thisMonday)
    monday.setDate(thisMonday.getDate() - i * 7)
    const isoKey = monday.toISOString().slice(0, 10)
    const pt: WeekConsistency = {
      weekLabel: weekLabel(monday),
      weekStart: isoKey,
      totalSessions: 0,
      trainingDays: 0,
    }
    for (const s of SPORT_ORDER) pt[s] = 0
    weekMap.set(isoKey, pt)
  }

  // Track unique dates per week for trainingDays calculation
  const weekDateSets = new Map<string, Set<string>>()
  for (const key of weekMap.keys()) {
    weekDateSets.set(key, new Set())
  }

  // Accumulate workouts into week buckets
  const sportTotals: Record<string, number> = {}
  for (const s of SPORT_ORDER) sportTotals[s] = 0

  for (const w of workouts) {
    const d = new Date(w.start_time)
    const monday = getMonday(d)
    const key = monday.toISOString().slice(0, 10)
    const pt = weekMap.get(key)
    if (!pt) continue

    const sport = SPORT_MAP[w.workout_type] ?? 'Other'
    pt[sport] = (pt[sport] as number) + 1
    pt.totalSessions += 1
    sportTotals[sport] = (sportTotals[sport] ?? 0) + 1

    const dateStr = d.toISOString().slice(0, 10)
    weekDateSets.get(key)!.add(dateStr)
  }

  // Finalize trainingDays for each week
  for (const [key, pt] of weekMap.entries()) {
    pt.trainingDays = weekDateSets.get(key)?.size ?? 0
  }

  const weeks = [...weekMap.values()]

  // Active sports (have at least 1 session)
  const activeSportNames = SPORT_ORDER.filter((s) => (sportTotals[s] ?? 0) > 0)

  const activeSports = activeSportNames
    .map((s) => ({ sport: s, sessions: sportTotals[s], color: SPORT_COLORS[s] ?? '#94a3b8' }))
    .sort((a, b) => b.sessions - a.sessions)

  // Compute summary stats
  const totalSessions52w = weeks.reduce((a, w) => a + w.totalSessions, 0)
  const activeWeeksList = weeks.filter((w) => w.totalSessions > 0)
  const activeWeeks = activeWeeksList.length
  const avgSessionsPerActiveWeek = activeWeeks > 0 ? totalSessions52w / activeWeeks : 0

  // Current streak: consecutive weeks (most recent first) with >= 1 session
  let currentStreak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].totalSessions > 0) {
      currentStreak++
    } else {
      break
    }
  }

  // Longest streak in 52 weeks
  let longestStreak = 0
  let runStreak = 0
  for (const w of weeks) {
    if (w.totalSessions > 0) {
      runStreak++
      if (runStreak > longestStreak) longestStreak = runStreak
    } else {
      runStreak = 0
    }
  }

  // Best week
  const bestWeek = weeks.reduce(
    (best, w) => (w.totalSessions > best.totalSessions ? w : best),
    weeks[0] ?? { totalSessions: 0, weekLabel: '—', weekStart: '', trainingDays: 0 }
  )

  const data: ConsistencyData = {
    weeks,
    totalSessions52w,
    activeWeeks,
    avgSessionsPerActiveWeek,
    currentStreak,
    longestStreak,
    bestWeekSessions: bestWeek.totalSessions,
    bestWeekLabel: bestWeek.weekLabel,
    activeSports,
    sports: activeSportNames,
    sportColors: SPORT_COLORS,
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
            <h1 className="text-xl font-bold text-text-primary">Training Consistency</h1>
            <p className="text-sm text-text-secondary">Session frequency · 52 weeks</p>
          </div>
          <Activity className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ConsistencyClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
