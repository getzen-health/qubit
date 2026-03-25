import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { YearClient } from './year-client'

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function YearPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: summaries }, { data: workouts }, { data: profile }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes, avg_hrv')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('workout_records')
      .select('start_time')
      .eq('user_id', user.id),
    supabase
      .from('users')
      .select('step_goal, calorie_goal, sleep_goal_minutes')
      .eq('id', user.id)
      .single(),
  ])

  const rows = summaries ?? []
  const stepGoal = profile?.step_goal ?? 10000
  const calorieGoal = profile?.calorie_goal ?? 500
  const sleepGoalMinutes = profile?.sleep_goal_minutes ?? 480

  // Workout dates set (YYYY-MM-DD)
  const workoutDates = (workouts ?? []).map((w) => w.start_time.slice(0, 10))

  // Find available years from data
  const yearSet = new Set(rows.map((r) => parseInt(r.date.slice(0, 4), 10)))
  const currentYear = new Date().getFullYear()
  yearSet.add(currentYear)
  const availableYears = Array.from(yearSet).sort((a, b) => b - a)

  const totalDays = rows.filter((r) => r.steps > 0 || r.active_calories > 0 || (r.sleep_duration_minutes ?? 0) > 0).length

  // ── Weekly aggregation ─────────────────────────────────────────────────────
  const weekMap = new Map<string, { steps: number[]; sleep: number[]; hrv: number[]; start: string }>()
  for (const s of rows) {
    const wk = getISOWeek(s.date)
    if (!weekMap.has(wk)) weekMap.set(wk, { steps: [], sleep: [], hrv: [], start: s.date })
    const entry = weekMap.get(wk)!
    if (s.steps) entry.steps.push(s.steps)
    if (s.sleep_duration_minutes) entry.sleep.push(s.sleep_duration_minutes / 60)
    if (s.avg_hrv) entry.hrv.push(s.avg_hrv)
  }

  const allWeeks = Array.from(weekMap.entries())
    .map(([week, data]) => ({
      week,
      start: data.start,
      avgSteps: data.steps.length
        ? Math.round(data.steps.reduce((a, b) => a + b, 0) / data.steps.length)
        : 0,
      avgSleep: data.sleep.length
        ? +(data.sleep.reduce((a, b) => a + b, 0) / data.sleep.length).toFixed(1)
        : 0,
      avgHrv: data.hrv.length
        ? Math.round(data.hrv.reduce((a, b) => a + b, 0) / data.hrv.length)
        : 0,
      daysWithData: Math.max(data.steps.length, data.sleep.length),
    }))
    .sort((a, b) => a.week.localeCompare(b.week))

  // ── Streak computation ─────────────────────────────────────────────────────
  const sortedActiveDates = rows
    .filter((s) => (s.steps ?? 0) > 0)
    .map((s) => s.date)
    .sort()

  let bestStreak = sortedActiveDates.length > 0 ? 1 : 0
  let runStreak = 1
  for (let i = 1; i < sortedActiveDates.length; i++) {
    const prev = new Date(sortedActiveDates[i - 1] + 'T00:00:00')
    const curr = new Date(sortedActiveDates[i] + 'T00:00:00')
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      runStreak++
      bestStreak = Math.max(bestStreak, runStreak)
    } else {
      runStreak = 1
    }
  }

  const activeDateSet = new Set(sortedActiveDates)
  let currentStreak = 0
  const checkDate = new Date()
  while (activeDateSet.has(toDateStr(checkDate))) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/steps"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to Steps"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Year View</h1>
            <p className="text-sm text-text-secondary">
              {totalDays > 0 ? `${totalDays} days tracked` : 'No data yet'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📅</span>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No data yet</h2>
            <p className="text-sm text-text-secondary">Sync your health data to see your year at a glance.</p>
          </div>
        ) : (
          <YearClient
            summaries={rows}
            workoutDates={workoutDates}
            availableYears={availableYears}
            initialYear={currentYear}
            stepGoal={stepGoal}
            calorieGoal={calorieGoal}
            sleepGoalMinutes={sleepGoalMinutes}
            allWeeks={allWeeks}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
          />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
