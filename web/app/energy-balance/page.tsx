import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { EnergyBalanceClient } from './energy-balance-client'

export const metadata = { title: 'Energy System Balance' }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DimensionResult {
  /** 0–100 */
  score: number
  /** Actual measured value (percentage or count) */
  actual: number
  /** Target value */
  target: number
  /** Number of sessions/data points used */
  sampleSize: number
}

export interface WeekBalancePoint {
  /** YYYY-MM-DD of Monday */
  monday: string
  /** Overall balance score 0–100 */
  overallScore: number
}

export interface EnergyBalanceData {
  aerobic: DimensionResult
  threshold: DimensionResult
  vo2max: DimensionResult
  strength: DimensionResult
  recovery: DimensionResult
  /** 0–100 */
  overallScore: number
  /** 4-week trend, oldest first */
  weekTrend: WeekBalancePoint[]
  totalWorkouts: number
  noData: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().split('T')[0]
}

function isStrengthType(workoutType: string): boolean {
  const t = workoutType.toLowerCase()
  return (
    t.includes('strength') ||
    t.includes('weight') ||
    t.includes('functional') ||
    t.includes('resistance') ||
    t.includes('crossfit') ||
    t.includes('powerlifting') ||
    t.includes('bodybuilding') ||
    t.includes('core') ||
    t.includes('pilates') ||
    t.includes('gym')
  )
}

/** Score formulas per dimension — 100 at target, penalised for over/under */
function scoreAerobic(pct: number): number {
  return clamp(100 - Math.abs(pct - 80) * 3, 0, 100)
}
function scoreThreshold(pct: number): number {
  return clamp(100 - Math.abs(pct - 15) * 4, 0, 100)
}
function scoreVO2Max(pct: number): number {
  return clamp(100 - Math.abs(pct - 5) * 6, 0, 100)
}
function scoreStrength(pct: number): number {
  return clamp(100 - Math.abs(pct - 25) * 2, 0, 100)
}
function scoreRecovery(restDays: number): number {
  return clamp(100 - Math.abs(restDays - 2) * 15, 0, 100)
}

interface WorkoutRow {
  workout_type: string
  duration_minutes: number
  avg_heart_rate: number | null
  max_heart_rate: number | null
  date: string
}

interface WeekMetrics {
  aerobicMins: number
  thresholdMins: number
  vo2maxMins: number
  totalCardioMins: number
  totalSessions: number
  strengthSessions: number
  workoutDays: Set<string>
  allDays: Set<string>
}

function buildWeekMetrics(workouts: WorkoutRow[]): WeekMetrics {
  let aerobicMins = 0
  let thresholdMins = 0
  let vo2maxMins = 0
  let totalCardioMins = 0
  let totalSessions = 0
  let strengthSessions = 0
  const workoutDays = new Set<string>()

  for (const w of workouts) {
    totalSessions++
    workoutDays.add(w.date)

    if (isStrengthType(w.workout_type)) {
      strengthSessions++
      // Strength sessions don't count toward cardio zone minutes
      continue
    }

    const maxHR = w.max_heart_rate ?? 190
    const avgHR = w.avg_heart_rate
    const mins = w.duration_minutes

    if (avgHR == null || avgHR < 40) {
      // No HR data — assume aerobic (conservative)
      aerobicMins += mins
      totalCardioMins += mins
      continue
    }

    const pctMax = avgHR / maxHR

    if (pctMax < 0.70) {
      aerobicMins += mins
    } else if (pctMax < 0.90) {
      thresholdMins += mins
    } else {
      vo2maxMins += mins
    }
    totalCardioMins += mins
  }

  // Build allDays for a 7-day window anchored to the workouts' week
  // We'll compute this externally based on the date range
  const allDays = new Set<string>()

  return { aerobicMins, thresholdMins, vo2maxMins, totalCardioMins, totalSessions, strengthSessions, workoutDays, allDays }
}

function computeRestDaysInWeek(mondayStr: string, workoutDates: Set<string>): number {
  const monday = new Date(mondayStr + 'T00:00:00Z')
  let restDays = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    if (!workoutDates.has(dateStr)) restDays++
  }
  return restDays
}

function computeDimensions(workouts: WorkoutRow[], weekDates: Set<string>): {
  aerobic: DimensionResult
  threshold: DimensionResult
  vo2max: DimensionResult
  strength: DimensionResult
  recovery: DimensionResult
  overallScore: number
} {
  const metrics = buildWeekMetrics(workouts)

  // Aerobic / threshold / VO2max as % of total cardio time
  const aerobicPct = metrics.totalCardioMins > 0 ? (metrics.aerobicMins / metrics.totalCardioMins) * 100 : 0
  const thresholdPct = metrics.totalCardioMins > 0 ? (metrics.thresholdMins / metrics.totalCardioMins) * 100 : 0
  const vo2maxPct = metrics.totalCardioMins > 0 ? (metrics.vo2maxMins / metrics.totalCardioMins) * 100 : 0

  // Strength as % of total sessions
  const strengthPct = metrics.totalSessions > 0 ? (metrics.strengthSessions / metrics.totalSessions) * 100 : 0

  // Rest days: days in the date window with no workout
  const restDays = [...weekDates].filter((d) => !metrics.workoutDays.has(d)).length
  const avgRestPerWeek = weekDates.size > 0 ? (restDays / weekDates.size) * 7 : 0

  const aerobicScore = metrics.totalSessions === 0 ? 0 : scoreAerobic(aerobicPct)
  const thresholdScore = metrics.totalSessions === 0 ? 0 : scoreThreshold(thresholdPct)
  const vo2maxScore = metrics.totalSessions === 0 ? 0 : scoreVO2Max(vo2maxPct)
  const strengthScore = metrics.totalSessions === 0 ? 0 : scoreStrength(strengthPct)
  const recoveryScore = weekDates.size === 0 ? 50 : scoreRecovery(avgRestPerWeek)

  const overallScore = Math.round((aerobicScore + thresholdScore + vo2maxScore + strengthScore + recoveryScore) / 5)

  return {
    aerobic: { score: Math.round(aerobicScore), actual: Math.round(aerobicPct), target: 80, sampleSize: metrics.totalSessions },
    threshold: { score: Math.round(thresholdScore), actual: Math.round(thresholdPct), target: 15, sampleSize: metrics.totalSessions },
    vo2max: { score: Math.round(vo2maxScore), actual: Math.round(vo2maxPct), target: 5, sampleSize: metrics.totalSessions },
    strength: { score: Math.round(strengthScore), actual: Math.round(strengthPct), target: 25, sampleSize: metrics.totalSessions },
    recovery: { score: Math.round(recoveryScore), actual: Math.round(avgRestPerWeek * 10) / 10, target: 2, sampleSize: weekDates.size },
    overallScore,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EnergyBalancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch last 28 days of workouts for the main analysis window
  const twentyEightDaysAgo = new Date()
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28)
  const twentyEightDaysAgoStr = twentyEightDaysAgo.toISOString().split('T')[0]

  const { data: rawWorkouts } = await supabase
    .from('workout_records')
    .select('workout_type, duration_minutes, avg_heart_rate, max_heart_rate, date')
    .eq('user_id', user.id)
    .gte('date', twentyEightDaysAgoStr)
    .gt('duration_minutes', 0)
    .order('date', { ascending: true })

  const workouts: WorkoutRow[] = (rawWorkouts ?? []).map((w) => ({
    workout_type: w.workout_type ?? 'unknown',
    duration_minutes: w.duration_minutes ?? 0,
    avg_heart_rate: w.avg_heart_rate ?? null,
    max_heart_rate: w.max_heart_rate ?? null,
    date: typeof w.date === 'string' ? w.date : (w.date as string),
  }))

  const noData = workouts.length === 0

  // Build the set of all calendar days in the 28-day window
  const allDaysInWindow = new Set<string>()
  for (let i = 0; i < 28; i++) {
    const d = new Date(twentyEightDaysAgo)
    d.setDate(twentyEightDaysAgo.getDate() + i)
    allDaysInWindow.add(d.toISOString().split('T')[0])
  }

  // Overall 28-day dimensions
  const dimensions = noData
    ? {
        aerobic: { score: 0, actual: 0, target: 80, sampleSize: 0 },
        threshold: { score: 0, actual: 0, target: 15, sampleSize: 0 },
        vo2max: { score: 0, actual: 0, target: 5, sampleSize: 0 },
        strength: { score: 0, actual: 0, target: 25, sampleSize: 0 },
        recovery: { score: 0, actual: 0, target: 2, sampleSize: 0 },
        overallScore: 0,
      }
    : computeDimensions(workouts, allDaysInWindow)

  // ── 4-week trend ────────────────────────────────────────────────────────────
  // Build 4 Monday-anchored week buckets
  const now = new Date()
  const thisMondayStr = getMondayOf(now)
  const thisMondayDate = new Date(thisMondayStr + 'T00:00:00Z')

  const mondays: string[] = []
  for (let i = 3; i >= 0; i--) {
    const md = new Date(thisMondayDate)
    md.setUTCDate(thisMondayDate.getUTCDate() - i * 7)
    mondays.push(md.toISOString().split('T')[0])
  }

  const weekTrend: WeekBalancePoint[] = mondays.map((monday) => {
    const mondayDate = new Date(monday + 'T00:00:00Z')

    // Build 7-day date set for this week
    const weekDays = new Set<string>()
    for (let d = 0; d < 7; d++) {
      const day = new Date(mondayDate)
      day.setUTCDate(mondayDate.getUTCDate() + d)
      weekDays.add(day.toISOString().split('T')[0])
    }

    // Filter workouts that fall in this week
    const weekWorkouts = workouts.filter((w) => weekDays.has(w.date))

    if (weekWorkouts.length === 0) {
      // No workouts in this week — score rest only
      const mondayEnd = new Date(mondayDate)
      mondayEnd.setUTCDate(mondayDate.getUTCDate() + 6)
      const pastDays = new Set<string>()
      const today = new Date()
      for (const day of weekDays) {
        if (new Date(day + 'T00:00:00Z') <= today) pastDays.add(day)
      }
      if (pastDays.size === 0) return { monday, overallScore: 0 }
      const restDayCount = pastDays.size // all past days in week are rest
      const restScore = scoreRecovery((restDayCount / pastDays.size) * 7)
      return { monday, overallScore: Math.round(restScore / 5) }
    }

    const dims = computeDimensions(weekWorkouts, weekDays)
    return { monday, overallScore: dims.overallScore }
  })

  const data: EnergyBalanceData = {
    ...dimensions,
    weekTrend,
    totalWorkouts: workouts.length,
    noData,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Energy System Balance</h1>
            <p className="text-sm text-text-secondary">Training dimension analysis · 28 days</p>
          </div>
          <Zap className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        <EnergyBalanceClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
