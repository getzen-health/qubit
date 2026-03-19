import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'
import { SleepScoreClient } from './sleep-score-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Quality Score' }

export interface SleepScoreNight {
  date: string
  sleepHours: number
  deepPct: number | null     // % of sleep that is deep
  remPct: number | null      // % of sleep that is REM
  efficiency: number | null  // % time asleep vs time in bed
  durationScore: number      // 0–100
  stagesScore: number        // 0–100
  efficiencyScore: number    // 0–100
  totalScore: number         // weighted composite 0–100
  grade: string              // Poor / Fair / Good / Excellent
  nextDayHrv: number | null
}

function scoreDuration(hours: number): number {
  if (hours >= 8 && hours <= 9) return 100
  if (hours >= 7 && hours < 8) return 90
  if (hours > 9 && hours <= 10) return 80
  if (hours >= 6 && hours < 7) return 60
  if (hours > 10) return 55
  if (hours >= 5 && hours < 6) return 35
  return 15
}

function scoreStages(deepPct: number | null, remPct: number | null): number {
  if (deepPct === null && remPct === null) return 50 // unknown → neutral
  let score = 0
  let components = 0
  if (deepPct !== null) {
    // Target ≥ 15% deep. Ideal ~20%
    const deep = Math.min(deepPct / 0.20, 1) * 100
    score += deep; components++
  }
  if (remPct !== null) {
    // Target ≥ 20% REM. Ideal ~25%
    const rem = Math.min(remPct / 0.25, 1) * 100
    score += rem; components++
  }
  return components > 0 ? Math.round(score / components) : 50
}

function scoreEfficiency(eff: number | null): number {
  if (eff === null) return 50 // unknown → neutral
  if (eff >= 90) return 100
  if (eff >= 85) return 90
  if (eff >= 75) return 70
  if (eff >= 65) return 45
  return 25
}

function grade(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

export default async function SleepScorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().slice(0, 10)

  const [{ data: records }, { data: summaries }] = await Promise.all([
    supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes, awake_minutes')
      .eq('user_id', user.id)
      .gte('start_time', sixtyDaysAgo.toISOString())
      .gt('duration_minutes', 60)
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, deep_sleep_minutes, rem_sleep_minutes, sleep_duration_minutes, avg_hrv')
      .eq('user_id', user.id)
      .gte('date', sixtyDaysAgoStr)
      .order('date', { ascending: true }),
  ])

  // Index summaries by date
  const byDate = new Map((summaries ?? []).map((s) => [s.date, s]))

  const nights: SleepScoreNight[] = (records ?? [])
    .map((r) => {
      const date = r.start_time.slice(0, 10)
      const startMs = new Date(r.start_time).getTime()
      const endMs = new Date(r.end_time).getTime()
      const tibMinutes = (endMs - startMs) / 60000
      const sleepHours = r.duration_minutes / 60

      // Efficiency
      const eff = tibMinutes > 60
        ? Math.min(100, Math.round((r.duration_minutes / tibMinutes) * 1000) / 10)
        : null

      // Stages from daily_summaries (same date or next date)
      const summary = byDate.get(date)
      const totalSleepMin = summary?.sleep_duration_minutes ?? r.duration_minutes
      const deepPct = summary?.deep_sleep_minutes && totalSleepMin > 0
        ? summary.deep_sleep_minutes / totalSleepMin
        : null
      const remPct = summary?.rem_sleep_minutes && totalSleepMin > 0
        ? summary.rem_sleep_minutes / totalSleepMin
        : null

      // Next day HRV (for correlation)
      const nextDate = new Date(date + 'T12:00:00')
      nextDate.setDate(nextDate.getDate() + 1)
      const nextKey = nextDate.toISOString().slice(0, 10)
      const nextDay = byDate.get(nextKey)
      const nextDayHrv = nextDay?.avg_hrv ?? null

      // Score components
      const durationScore = Math.round(scoreDuration(sleepHours))
      const stagesScore = Math.round(scoreStages(deepPct, remPct))
      const efficiencyScore = Math.round(scoreEfficiency(eff))

      // Weighted composite: 40% duration, 30% stages, 30% efficiency
      const total = Math.round(durationScore * 0.4 + stagesScore * 0.3 + efficiencyScore * 0.3)

      return {
        date,
        sleepHours: Math.round(sleepHours * 10) / 10,
        deepPct: deepPct !== null ? Math.round(deepPct * 1000) / 10 : null,
        remPct: remPct !== null ? Math.round(remPct * 1000) / 10 : null,
        efficiency: eff,
        durationScore,
        stagesScore,
        efficiencyScore,
        totalScore: total,
        grade: grade(total),
        nextDayHrv,
      } satisfies SleepScoreNight
    })
    .filter((n) => n.sleepHours > 1 && n.sleepHours < 16)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Sleep Quality Score</h1>
              <p className="text-sm text-text-secondary">
                {nights.length > 0
                  ? `${nights.length} nights · duration + stages + efficiency`
                  : 'Duration, stages and efficiency combined'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SleepScoreClient nights={nights} />
      </main>
      <BottomNav />
    </div>
  )
}
