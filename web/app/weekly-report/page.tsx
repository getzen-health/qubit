import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const WeeklyReportClient = dynamic(() => import('./weekly-report-client').then(m => ({ default: m.WeeklyReportClient })))
import type { DaySummary } from './weekly-report-client'

export const metadata = { title: 'Weekly Report — KQuarks' }

function avg(vals: (number | null | undefined)[]): number | null {
  const valid = vals.filter((v): v is number => v != null && v > 0)
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}

export default async function WeeklyReportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const d7ago = new Date(today)
  d7ago.setDate(today.getDate() - 7)
  const d14ago = new Date(today)
  d14ago.setDate(today.getDate() - 14)

  const { data: rows } = await supabase
    .from('daily_summaries')
    .select(
      'date, steps, active_calories, sleep_duration_minutes, avg_hrv, resting_heart_rate, recovery_score'
    )
    .eq('user_id', user.id)
    .gte('date', d14ago.toISOString().slice(0, 10))
    .order('date', { ascending: true })

  const allRows = (rows ?? []) as DaySummary[]
  const d7agoStr = d7ago.toISOString().slice(0, 10)

  // Rolling 7-day window vs prior 7 days
  const thisWeek = allRows.filter((r) => r.date > d7agoStr)
  const prevWeek = allRows.filter((r) => r.date <= d7agoStr)

  // This week averages
  const avgSteps = avg(thisWeek.map((r) => r.steps))
  const avgSleepHours = avg(
    thisWeek.map((r) => (r.sleep_duration_minutes ? r.sleep_duration_minutes / 60 : null))
  )
  const avgHRV = avg(thisWeek.map((r) => r.avg_hrv))
  const avgRHR = avg(thisWeek.map((r) => r.resting_heart_rate))
  const totalCalories = thisWeek.reduce((s, r) => s + (r.active_calories ?? 0), 0)
  const avgHealthScore = avg(thisWeek.map((r) => r.recovery_score))

  // Prev week averages (for WoW comparison)
  const prevAvgSteps = avg(prevWeek.map((r) => r.steps))
  const prevAvgSleepHours = avg(
    prevWeek.map((r) => (r.sleep_duration_minutes ? r.sleep_duration_minutes / 60 : null))
  )
  const prevAvgHRV = avg(prevWeek.map((r) => r.avg_hrv))
  const prevAvgRHR = avg(prevWeek.map((r) => r.resting_heart_rate))
  const prevTotalCalories = prevWeek.reduce((s, r) => s + (r.active_calories ?? 0), 0)

  // Highlights
  const bestStepDay =
    thisWeek.length > 0
      ? thisWeek.reduce((best, r) => ((r.steps ?? 0) > (best.steps ?? 0) ? r : best))
      : null

  const sleepDays = thisWeek.filter((r) => (r.sleep_duration_minutes ?? 0) > 0)
  const worstSleepNight =
    sleepDays.length > 0
      ? sleepDays.reduce((worst, r) =>
          (r.sleep_duration_minutes ?? 999) < (worst.sleep_duration_minutes ?? 999) ? r : worst
        )
      : null

  const hrvDays = thisWeek.filter((r) => (r.avg_hrv ?? 0) > 0)
  const highestHRVDay =
    hrvDays.length > 0
      ? hrvDays.reduce((best, r) => ((r.avg_hrv ?? 0) > (best.avg_hrv ?? 0) ? r : best))
      : null

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)
  const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

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
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Weekly Report</h1>
              <p className="text-sm text-text-secondary">{weekRange}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <WeeklyReportClient
          thisWeekDays={thisWeek}
          metrics={{
            avgSteps,
            avgSleepHours,
            avgHRV,
            avgRHR,
            totalCalories,
            avgHealthScore,
          }}
          prevMetrics={{
            avgSteps: prevAvgSteps,
            avgSleepHours: prevAvgSleepHours,
            avgHRV: prevAvgHRV,
            avgRHR: prevAvgRHR,
            totalCalories: prevTotalCalories > 0 ? prevTotalCalories : null,
          }}
          highlights={{ bestStepDay, worstSleepNight, highestHRVDay }}
          weekRange={weekRange}
        />
      </main>
      <BottomNav />
    </div>
  )
}
