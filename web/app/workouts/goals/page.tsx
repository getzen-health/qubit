import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const WorkoutGoalsClient = dynamic(() => import('./workout-goals-client').then(m => ({ default: m.WorkoutGoalsClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Workout Goals' }

const SPORT_COLORS: Record<string, string> = {
  running: '#22c55e', cycling: '#3b82f6', strength: '#a855f7',
  hiit: '#f97316', yoga: '#06b6d4', hiking: '#eab308',
  swimming: '#0ea5e9', walking: '#84cc16', other: '#6b7280',
}

export default async function WorkoutGoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch last 91 days (13 weeks) of workouts
  const since = new Date(Date.now() - 91 * 86400000).toISOString().slice(0, 10)
  const { data: workouts } = await supabase
    .from('workout_records')
    .select('workout_type, start_time')
    .eq('user_id', user.id)
    .gte('start_time', since)
    .order('start_time', { ascending: true })

  const WEEKLY_GOAL = 4

  // Build 13-week grid
  const now = new Date()
  // Start of current week (Monday)
  const dayOfWeek = (now.getDay() + 6) % 7
  const weekStart = new Date(now.getTime() - dayOfWeek * 86400000)
  weekStart.setHours(0, 0, 0, 0)

  const weeks: { label: string; start: Date; end: Date }[] = []
  for (let i = 12; i >= 0; i--) {
    const start = new Date(weekStart.getTime() - i * 7 * 86400000)
    const end = new Date(start.getTime() + 7 * 86400000)
    weeks.push({
      label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      start,
      end,
    })
  }

  const weeklyData = weeks.map(({ label, start, end }) => {
    const sessions = (workouts ?? []).filter((w) => {
      const t = new Date(w.start_time).getTime()
      return t >= start.getTime() && t < end.getTime()
    }).length
    return { week: label, sessions, goalMet: sessions >= WEEKLY_GOAL }
  })

  // Sport breakdown
  const sportCounts: Record<string, number> = {}
  for (const w of workouts ?? []) {
    const key = (w.workout_type ?? 'other').toLowerCase()
    sportCounts[key] = (sportCounts[key] ?? 0) + 1
  }
  const sportBreakdown = Object.entries(sportCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([sport, sessions]) => ({
      sport: sport.charAt(0).toUpperCase() + sport.slice(1),
      sessions,
      color: SPORT_COLORS[sport] ?? SPORT_COLORS.other,
    }))

  // Derived stats
  const totalWeeks = 13
  const currentWeekSessions = weeklyData[weeklyData.length - 1]?.sessions ?? 0
  const weeksHit = weeklyData.filter((w) => w.goalMet).length
  const totalSessionsQuarter = weeklyData.reduce((s, w) => s + w.sessions, 0)

  let currentStreak = 0
  for (let i = weeklyData.length - 2; i >= 0; i--) {
    if (weeklyData[i].goalMet) currentStreak++
    else break
  }

  const data = { weeklyData, sportBreakdown, weeklyGoal: WEEKLY_GOAL, currentWeekSessions, currentStreak, weeksHit, totalWeeks, totalSessionsQuarter }

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
            <h1 className="text-xl font-bold text-text-primary">Workout Goals 🏆</h1>
            <p className="text-sm text-text-secondary">
              {weeksHit}/{totalWeeks} weeks hit · last 13 weeks
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WorkoutGoalsClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}

