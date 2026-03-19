import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { InjuryRiskClient } from './injury-risk-client'

export const metadata = { title: 'Injury Risk Score' }

export interface DayLoad {
  date: string  // YYYY-MM-DD
  minutes: number
}

export interface RiskFactor {
  name: string
  points: number
  description: string
  icon: string  // emoji
}

export interface InjuryRiskData {
  score: number
  level: 'low' | 'elevated' | 'high'
  acwr: number
  acuteLoad: number    // avg min/day
  chronicLoad: number  // avg min/day
  consecutiveDays: number
  factors: RiskFactor[]
  dailyLoads: DayLoad[]  // 28 days for chart
  recommendations: string[]
}

// Build a map of date string → total workout minutes for the past 28 days
function buildDayMinuteMap(
  workouts: { start_time: string; duration_minutes: number }[]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const w of workouts) {
    const date = w.start_time.slice(0, 10)
    map.set(date, (map.get(date) ?? 0) + (w.duration_minutes ?? 0))
  }
  return map
}

// Average minutes/day across a set of dates (only counts days with data in denominator)
// ACWR convention: divide total load by number of days in the window (not just active days)
function avgOverWindow(dayMap: Map<string, number>, dates: string[]): number {
  if (dates.length === 0) return 0
  const total = dates.reduce((sum, d) => sum + (dayMap.get(d) ?? 0), 0)
  return total / dates.length
}

// Produce an array of YYYY-MM-DD strings for today and the previous (n-1) days
function lastNDates(n: number, today: Date): string[] {
  const dates: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

export default async function InjuryRiskPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const twentyEightDaysAgo = new Date(now)
  twentyEightDaysAgo.setDate(now.getDate() - 28)

  // ── 1. Workout records — last 28 days ──────────────────────────────────────
  const { data: rawWorkouts } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, workout_type')
    .eq('user_id', user.id)
    .gte('start_time', twentyEightDaysAgo.toISOString())
    .gt('duration_minutes', 0)
    .order('start_time', { ascending: true })

  const workouts = rawWorkouts ?? []

  // ── 2. HRV — prefer daily_summaries.avg_hrv; fall back to hrv_records ──────
  type HrvRow = { recorded_at?: string; date?: string; sdnn_ms?: number; avg_hrv?: number }
  let hrvRows: HrvRow[] = []

  // Primary: daily_summaries (confirmed in schema)
  const { data: summaryHrv } = await supabase
    .from('daily_summaries')
    .select('date, avg_hrv')
    .eq('user_id', user.id)
    .gte('date', twentyEightDaysAgo.toISOString().slice(0, 10))
    .not('avg_hrv', 'is', null)
    .gt('avg_hrv', 0)
    .order('date', { ascending: false })

  if (summaryHrv && summaryHrv.length > 0) {
    hrvRows = summaryHrv.map((r) => ({ date: r.date, avg_hrv: r.avg_hrv }))
  } else {
    // Fallback: try hrv_records table (may not exist)
    try {
      const { data: hrvRecords } = await supabase
        .from('hrv_records')
        .select('recorded_at, sdnn_ms')
        .eq('user_id', user.id)
        .gte('recorded_at', twentyEightDaysAgo.toISOString())
        .not('sdnn_ms', 'is', null)
        .gt('sdnn_ms', 0)
        .order('recorded_at', { ascending: false })

      if (hrvRecords && hrvRecords.length > 0) {
        hrvRows = hrvRecords.map((r) => ({
          date: r.recorded_at?.slice(0, 10),
          avg_hrv: r.sdnn_ms,
        }))
      }
    } catch {
      // hrv_records table doesn't exist — use zero points
    }
  }

  // ── 3. Resting HR — from daily_summaries ────────────────────────────────────
  const { data: rawSummaries } = await supabase
    .from('daily_summaries')
    .select('date, resting_heart_rate')
    .eq('user_id', user.id)
    .gte('date', twentyEightDaysAgo.toISOString().slice(0, 10))
    .not('resting_heart_rate', 'is', null)
    .gt('resting_heart_rate', 0)
    .order('date', { ascending: false })

  const summaries = rawSummaries ?? []

  // ═══════════════════════════════════════════════════════════════════════════
  // RISK CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  const today = now
  const allDates28 = lastNDates(28, today)  // index 0 = today, 27 = 28 days ago
  const acuteDates = lastNDates(7, today)   // last 7 days (today back 6)
  // Chronic = days 8–28: start from 7 days ago going back to 28 days ago
  const chronicStart = new Date(today)
  chronicStart.setDate(today.getDate() - 7)
  const chronicDates = lastNDates(21, chronicStart)  // 21 days (days 8–28)

  const dayMap = buildDayMinuteMap(workouts)

  // ── Factor 1: ACWR ──────────────────────────────────────────────────────────
  const acuteLoad = avgOverWindow(dayMap, acuteDates)
  const chronicLoad = avgOverWindow(dayMap, chronicDates)
  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : acuteLoad > 0 ? 2.0 : 1.0

  let acwrPoints = 0
  let acwrDescription = 'Workload ratio is within safe range'
  if (acwr > 1.5) {
    acwrPoints = 40
    acwrDescription = `ACWR of ${acwr.toFixed(2)} — very high spike, injury risk elevated`
  } else if (acwr >= 1.3) {
    acwrPoints = 25
    acwrDescription = `ACWR of ${acwr.toFixed(2)} — moderate spike above chronic load`
  } else if (acwr < 0.8 && acuteLoad > 0) {
    acwrPoints = 10
    acwrDescription = `ACWR of ${acwr.toFixed(2)} — very low relative to baseline`
  } else if (acwr < 0.8 && acuteLoad === 0) {
    acwrPoints = 0
    acwrDescription = 'No workout activity in the past 7 days'
  }

  // ── Factor 2: Consecutive training days ─────────────────────────────────────
  let consecutiveDays = 0
  for (let i = 0; i < 28; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    if ((dayMap.get(dateStr) ?? 0) > 0) {
      consecutiveDays++
    } else {
      break
    }
  }

  let consecutivePoints = 0
  let consecutiveDescription = 'Training frequency looks sustainable'
  if (consecutiveDays >= 4) {
    consecutivePoints = 20
    consecutiveDescription = `${consecutiveDays} consecutive training days — recovery deficit likely`
  } else if (consecutiveDays === 3) {
    consecutivePoints = 10
    consecutiveDescription = '3 consecutive training days — consider a rest day soon'
  }

  // ── Factor 3: HRV drop ──────────────────────────────────────────────────────
  let hrvPoints = 0
  let hrvDescription = 'HRV within normal range'

  if (hrvRows.length >= 4) {
    // Sort by date descending
    const sorted = [...hrvRows].sort((a, b) => {
      const da = a.date ?? ''
      const db = b.date ?? ''
      return db.localeCompare(da)
    })

    const recent3 = sorted.slice(0, 3).map((r) => r.avg_hrv ?? 0)
    const baseline28 = sorted.map((r) => r.avg_hrv ?? 0)

    const avg3 = recent3.reduce((a, b) => a + b, 0) / recent3.length
    const avg28 = baseline28.reduce((a, b) => a + b, 0) / baseline28.length

    if (avg28 > 0) {
      const dropPct = (avg28 - avg3) / avg28
      if (dropPct > 0.15) {
        hrvPoints = 20
        hrvDescription = `HRV dropped ${Math.round(dropPct * 100)}% below 28-day baseline — possible overreaching`
      } else if (dropPct > 0.1) {
        hrvPoints = 10
        hrvDescription = `HRV dropped ${Math.round(dropPct * 100)}% below baseline — monitor recovery`
      } else {
        hrvDescription = `HRV is ${dropPct < 0 ? 'above' : 'near'} your 28-day baseline`
      }
    }
  } else {
    hrvDescription = 'Not enough HRV data for comparison'
  }

  // ── Factor 4: Resting HR elevation ──────────────────────────────────────────
  let rhrPoints = 0
  let rhrDescription = 'Resting HR within normal range'

  if (summaries.length >= 4) {
    const sortedRhr = [...summaries].sort((a, b) =>
      (b.date as string).localeCompare(a.date as string)
    )

    const recent3rhr = sortedRhr
      .slice(0, 3)
      .map((r) => r.resting_heart_rate as number)
      .filter((v) => v > 0)
    const all28rhr = sortedRhr
      .map((r) => r.resting_heart_rate as number)
      .filter((v) => v > 0)

    if (recent3rhr.length > 0 && all28rhr.length > 0) {
      const avg3rhr = recent3rhr.reduce((a, b) => a + b, 0) / recent3rhr.length
      const avg28rhr = all28rhr.reduce((a, b) => a + b, 0) / all28rhr.length

      if (avg28rhr > 0) {
        const risePct = (avg3rhr - avg28rhr) / avg28rhr
        if (risePct > 0.1) {
          rhrPoints = 15
          rhrDescription = `Resting HR elevated ${Math.round(risePct * 100)}% above baseline — possible fatigue or illness`
        } else if (risePct > 0.05) {
          rhrPoints = 8
          rhrDescription = `Resting HR slightly elevated ${Math.round(risePct * 100)}% above baseline`
        } else {
          rhrDescription = 'Resting HR is stable'
        }
      }
    }
  } else {
    rhrDescription = 'Not enough resting HR data for comparison'
  }

  // ── Factor 5: Monotony (same workout type last 7 workouts) ──────────────────
  const last7Workouts = [...workouts]
    .sort((a, b) => b.start_time.localeCompare(a.start_time))
    .slice(0, 7)

  let monotonyPoints = 0
  let monotonyDescription = 'Good workout variety detected'

  if (last7Workouts.length >= 7) {
    const types = new Set(last7Workouts.map((w) => w.workout_type))
    if (types.size === 1) {
      monotonyPoints = 5
      monotonyDescription = `Last 7 workouts all the same type (${last7Workouts[0].workout_type}) — consider cross-training`
    }
  }

  // ── Total Score ──────────────────────────────────────────────────────────────
  const rawScore = acwrPoints + consecutivePoints + hrvPoints + rhrPoints + monotonyPoints
  const score = Math.min(100, Math.max(0, rawScore))

  const level: 'low' | 'elevated' | 'high' =
    score <= 30 ? 'low' : score <= 60 ? 'elevated' : 'high'

  // ── Build factors list (only include non-zero contributors) ─────────────────
  const allFactors: RiskFactor[] = [
    {
      name: 'Acute:Chronic Workload Ratio',
      points: acwrPoints,
      description: acwrDescription,
      icon: '⚡',
    },
    {
      name: 'Consecutive Training Days',
      points: consecutivePoints,
      description: consecutiveDescription,
      icon: '📅',
    },
    {
      name: 'HRV Drop',
      points: hrvPoints,
      description: hrvDescription,
      icon: '💓',
    },
    {
      name: 'Resting HR Elevation',
      points: rhrPoints,
      description: rhrDescription,
      icon: '❤️',
    },
    {
      name: 'Training Monotony',
      points: monotonyPoints,
      description: monotonyDescription,
      icon: '🔄',
    },
  ]
  const factors = allFactors.filter((f) => f.points > 0)

  // ── Daily loads for chart (28 days, oldest first) ───────────────────────────
  const dailyLoads: DayLoad[] = allDates28
    .slice()
    .reverse()
    .map((date) => ({
      date,
      minutes: dayMap.get(date) ?? 0,
    }))

  // ── Recommendations ──────────────────────────────────────────────────────────
  const recommendations: string[] = []

  if (score <= 30) {
    recommendations.push('Your injury risk is low — keep up your current training rhythm.')
    recommendations.push('Continue monitoring your workload ratio as you progress.')
  } else {
    if (acwrPoints >= 25) {
      recommendations.push(
        'Reduce training volume this week to lower your acute:chronic workload ratio below 1.3.'
      )
    }
    if (consecutivePoints >= 20) {
      recommendations.push(
        `You've trained ${consecutiveDays} days in a row. Schedule at least one full rest or active recovery day.`
      )
    } else if (consecutivePoints === 10) {
      recommendations.push('Consider taking a rest or easy day tomorrow to prevent accumulated fatigue.')
    }
    if (hrvPoints > 0) {
      recommendations.push(
        'Your HRV is below baseline — prioritise sleep, nutrition, and stress management today.'
      )
    }
    if (rhrPoints > 0) {
      recommendations.push(
        'Elevated resting HR suggests your body needs recovery. Avoid high-intensity sessions.'
      )
    }
    if (monotonyPoints > 0) {
      recommendations.push(
        'Vary your training types to reduce repetitive stress on the same muscle groups.'
      )
    }
    if (score > 60) {
      recommendations.push(
        'Consider taking 1–2 full rest days before your next high-intensity session.'
      )
    }
  }

  const data: InjuryRiskData = {
    score,
    level,
    acwr: Math.round(acwr * 100) / 100,
    acuteLoad: Math.round(acuteLoad * 10) / 10,
    chronicLoad: Math.round(chronicLoad * 10) / 10,
    consecutiveDays,
    factors,
    dailyLoads,
    recommendations,
  }

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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Injury Risk Score</h1>
            <p className="text-sm text-text-secondary">Multi-factor risk assessment · Last 28 days</p>
          </div>
          <ShieldAlert className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <InjuryRiskClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
