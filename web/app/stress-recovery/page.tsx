import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const StressRecoveryClient = dynamic(() => import('./stress-recovery-client').then(m => ({ default: m.StressRecoveryClient })))

export const metadata = { title: 'Stress & Recovery Analysis' }

export type Quadrant = 'peaking' | 'overreaching' | 'recovering' | 'balanced'

export interface WeekPoint {
  monday: string       // YYYY-MM-DD
  stressScore: number  // 0-100
  recoveryScore: number // 0-100
  quadrant: Quadrant
}

export interface StressRecoveryData {
  weekPoints: WeekPoint[]
  currentQuadrant: Quadrant
  currentStress: number
  currentRecovery: number
  noHRVData: boolean
}

function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().split('T')[0]
}

function classifyQuadrant(stressScore: number, recoveryScore: number): Quadrant {
  if (stressScore >= 50 && recoveryScore >= 50) return 'peaking'
  if (stressScore >= 50 && recoveryScore < 50) return 'overreaching'
  if (stressScore < 50 && recoveryScore >= 50) return 'recovering'
  return 'balanced'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export default async function StressRecoveryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7)

  // Fetch workout records for stress calculation
  const { data: rawWorkouts } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes')
    .eq('user_id', user.id)
    .gte('start_time', twelveWeeksAgo.toISOString())
    .gt('duration_minutes', 0)
    .order('start_time', { ascending: true })

  // Fetch daily summaries for recovery calculation
  const { data: rawSummaries } = await supabase
    .from('daily_summaries')
    .select('date, avg_hrv, resting_heart_rate')
    .eq('user_id', user.id)
    .gte('date', twelveWeeksAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })

  const workouts = rawWorkouts ?? []
  const summaries = rawSummaries ?? []

  // ── Build week → total workout minutes map ─────────────────────────────────

  const weekMinutes = new Map<string, number>()
  for (const w of workouts) {
    const monday = getMondayOf(new Date(w.start_time))
    weekMinutes.set(monday, (weekMinutes.get(monday) ?? 0) + (w.duration_minutes ?? 0))
  }

  // ── Build week → { hrv values, rhr values } map ────────────────────────────

  interface WeekRecovery {
    hrvValues: number[]
    rhrValues: number[]
  }
  const weekRecovery = new Map<string, WeekRecovery>()
  for (const s of summaries) {
    const monday = getMondayOf(new Date(s.date + 'T00:00:00Z'))
    if (!weekRecovery.has(monday)) {
      weekRecovery.set(monday, { hrvValues: [], rhrValues: [] })
    }
    const entry = weekRecovery.get(monday)!
    if (s.avg_hrv != null && s.avg_hrv > 0) entry.hrvValues.push(s.avg_hrv)
    if (s.resting_heart_rate != null && s.resting_heart_rate > 0) entry.rhrValues.push(s.resting_heart_rate)
  }

  // ── Build 12 Monday-anchored week buckets ──────────────────────────────────

  const now = new Date()
  const thisMondayStr = getMondayOf(now)
  const thisMondayDate = new Date(thisMondayStr + 'T00:00:00Z')

  const mondays: string[] = []
  for (let i = 11; i >= 0; i--) {
    const mondayDate = new Date(thisMondayDate)
    mondayDate.setUTCDate(thisMondayDate.getUTCDate() - i * 7)
    mondays.push(mondayDate.toISOString().split('T')[0])
  }

  // ── Compute max weekly minutes for stress normalization ────────────────────

  const allMinutes = mondays.map((m) => weekMinutes.get(m) ?? 0)
  const maxWeeklyMinutes = Math.max(...allMinutes, 1)

  // ── Compute HRV and RHR baselines across 12-week window ───────────────────

  const allHRV: number[] = []
  const allRHR: number[] = []
  for (const monday of mondays) {
    const rec = weekRecovery.get(monday)
    if (rec) {
      allHRV.push(...rec.hrvValues)
      allRHR.push(...rec.rhrValues)
    }
  }

  const noHRVData = allHRV.length === 0

  const hrvBaseline = allHRV.length > 0
    ? allHRV.reduce((a, b) => a + b, 0) / allHRV.length
    : null

  const rhrBaseline = allRHR.length > 0
    ? allRHR.reduce((a, b) => a + b, 0) / allRHR.length
    : null

  // ── Compute week points ────────────────────────────────────────────────────

  const weekPoints: WeekPoint[] = mondays.map((monday) => {
    const totalMinutes = weekMinutes.get(monday) ?? 0
    const stressScore = (totalMinutes / maxWeeklyMinutes) * 100

    const rec = weekRecovery.get(monday)
    let recoveryScore = 50

    if (rec) {
      // HRV component
      if (hrvBaseline !== null && rec.hrvValues.length > 0) {
        const weekAvgHRV = rec.hrvValues.reduce((a, b) => a + b, 0) / rec.hrvValues.length
        const ratio = weekAvgHRV / hrvBaseline
        const hrvScore = clamp((ratio - 0.85) / 0.30 * 30, -30, 30)
        recoveryScore += hrvScore * 0.6
      }

      // RHR component (lower = better)
      if (rhrBaseline !== null && rec.rhrValues.length > 0) {
        const weekAvgRHR = rec.rhrValues.reduce((a, b) => a + b, 0) / rec.rhrValues.length
        const ratio = weekAvgRHR / rhrBaseline
        const rhrScore = clamp((1.10 - ratio) / 0.20 * 20, -20, 20)
        recoveryScore += rhrScore * 0.4
      }
    }

    recoveryScore = clamp(recoveryScore, 0, 100)

    const quadrant = classifyQuadrant(stressScore, recoveryScore)

    return { monday, stressScore, recoveryScore, quadrant }
  })

  const currentPoint = weekPoints[weekPoints.length - 1]

  const data: StressRecoveryData = {
    weekPoints,
    currentQuadrant: currentPoint?.quadrant ?? 'balanced',
    currentStress: currentPoint?.stressScore ?? 0,
    currentRecovery: currentPoint?.recoveryScore ?? 50,
    noHRVData,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Stress &amp; Recovery</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Training quadrant analysis · 12 weeks</p>
          </div>
          <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        <StressRecoveryClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
