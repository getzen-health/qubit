import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NudgesClient, type Nudge } from './nudges-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Smart Nudges' }

interface SummaryRow {
  date: string
  steps: number
  active_calories: number | null
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  recovery_score: number | null
  distance_meters: number | null
}

// ── Rule engine (TypeScript port of iOS SmartNudgesView) ──────────────────────

function avg(vals: number[]): number {
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function pct(a: number, b: number) {
  if (b === 0) return 0
  return Math.round(((a - b) / b) * 100)
}

function analyse(rows: SummaryRow[], stepGoal: number, calGoal: number): Nudge[] {
  const results: Nudge[] = []

  // Sort oldest→newest
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))

  // ── HRV ─────────────────────────────────────────────────────────────────
  const hrv = sorted.map(r => r.avg_hrv).filter((v): v is number => v !== null && v > 0)
  if (hrv.length >= 5) {
    const baseline = avg(hrv.slice(0, hrv.length - 3))
    const recent3  = avg(hrv.slice(-3))
    const ratio    = recent3 / baseline

    if (ratio <= 0.80) {
      results.push({
        id: 'hrv-low',
        icon: 'waveform',
        colorClass: 'text-red-400',
        bgClass: 'bg-red-500/10',
        category: 'HRV',
        title: 'HRV Significantly Below Baseline',
        body: `Your 3-day HRV average (${Math.round(recent3)} ms) is ${Math.round((1 - ratio) * 100)}% below your baseline (${Math.round(baseline)} ms). This typically signals accumulated fatigue or early illness.`,
        action: 'Prioritise sleep and avoid intense training today.',
        priority: 2,
      })
    } else if (ratio <= 0.90) {
      results.push({
        id: 'hrv-dip',
        icon: 'waveform',
        colorClass: 'text-orange-400',
        bgClass: 'bg-orange-500/10',
        category: 'Recovery',
        title: 'HRV Trending Down',
        body: `Your recent HRV (${Math.round(recent3)} ms) is ${Math.round((1 - ratio) * 100)}% under your ${Math.round(baseline)} ms baseline.`,
        action: 'Consider an easy day — a walk, yoga, or extra sleep.',
        priority: 1,
      })
    } else if (ratio >= 1.15) {
      results.push({
        id: 'hrv-high',
        icon: 'heart',
        colorClass: 'text-green-400',
        bgClass: 'bg-green-500/10',
        category: 'Fitness',
        title: 'Great Recovery!',
        body: `Your HRV (${Math.round(recent3)} ms) is ${Math.round((ratio - 1) * 100)}% above baseline — your body is well-rested and ready to perform.`,
        action: 'A quality workout today could be very productive.',
        priority: 0,
      })
    }
  }

  // ── Sleep ────────────────────────────────────────────────────────────────
  const sleepMins = sorted.map(r => r.sleep_duration_minutes).filter((v): v is number => v !== null && v > 60)
  if (sleepMins.length >= 5) {
    const avgSleepH = avg(sleepMins) / 60
    const last3H    = avg(sleepMins.slice(-3)) / 60

    if (avgSleepH < 6.5) {
      results.push({
        id: 'sleep-chronic',
        icon: 'moon',
        colorClass: 'text-indigo-400',
        bgClass: 'bg-indigo-500/10',
        category: 'Sleep',
        title: 'Chronic Sleep Deficit Detected',
        body: `You're averaging ${avgSleepH.toFixed(1)} hours of sleep — well below the 7–9 hour target. Chronic under-sleep raises cortisol and suppresses recovery.`,
        action: 'Aim for an earlier bedtime by 30–45 minutes this week.',
        priority: 2,
      })
    } else if (last3H < 6.5 && avgSleepH >= 6.5) {
      results.push({
        id: 'sleep-recent',
        icon: 'moon',
        colorClass: 'text-indigo-400',
        bgClass: 'bg-indigo-500/10',
        category: 'Sleep',
        title: 'Short Sleep the Last 3 Nights',
        body: `You've averaged ${last3H.toFixed(1)} hours over the last 3 nights. Even short-term deficits affect next-day mood, focus, and workout performance.`,
        action: 'Try to get to bed 30 minutes earlier tonight.',
        priority: 1,
      })
    }
  }

  // ── Steps ────────────────────────────────────────────────────────────────
  const steps = sorted.map(r => r.steps).filter(v => v > 0)
  if (steps.length >= 5) {
    const weekAvg = avg(steps.slice(-7))
    const goalPct = weekAvg / stepGoal

    if (goalPct < 0.60) {
      results.push({
        id: 'steps-low',
        icon: 'footprints',
        colorClass: 'text-green-400',
        bgClass: 'bg-green-500/10',
        category: 'Activity',
        title: 'Steps Goal Far Below Target',
        body: `Your 7-day step average (${Math.round(weekAvg).toLocaleString()}) is ${Math.round(goalPct * 100)}% of your ${stepGoal.toLocaleString()} goal. Low daily steps are linked to increased cardiovascular risk.`,
        action: 'Add a 15-minute walk after lunch or dinner to close the gap.',
        priority: 1,
      })
    } else if (goalPct >= 1.30) {
      results.push({
        id: 'steps-high',
        icon: 'footprints',
        colorClass: 'text-green-400',
        bgClass: 'bg-green-500/10',
        category: 'Activity',
        title: 'Crushing Your Step Goal!',
        body: `Your 7-day average (${Math.round(weekAvg).toLocaleString()} steps) is ${pct(weekAvg, stepGoal)}% above your goal of ${stepGoal.toLocaleString()}. Keep the momentum going!`,
        action: null,
        priority: 0,
      })
    }

    // 7-day streak
    const recentHitCount = steps.slice(-7).filter(s => s >= stepGoal).length
    if (recentHitCount >= 7) {
      results.push({
        id: 'steps-streak',
        icon: 'flame',
        colorClass: 'text-orange-400',
        bgClass: 'bg-orange-500/10',
        category: 'Streak',
        title: '7-Day Steps Streak!',
        body: "You've hit your step goal every day this week. Consistency like this compounds into real fitness gains over time.",
        action: null,
        priority: 0,
      })
    }
  }

  // ── Calories ─────────────────────────────────────────────────────────────
  const calories = sorted.map(r => r.active_calories).filter((v): v is number => v !== null && v > 0)
  if (calories.length >= 5) {
    const recent7Avg = avg(calories.slice(-7))
    if (recent7Avg < calGoal * 0.50) {
      results.push({
        id: 'cal-low',
        icon: 'zap',
        colorClass: 'text-red-400',
        bgClass: 'bg-red-500/10',
        category: 'Activity',
        title: 'Active Calories Well Below Goal',
        body: `Your 7-day calorie average (${Math.round(recent7Avg)} kcal) is only ${Math.round((recent7Avg / calGoal) * 100)}% of your ${Math.round(calGoal)} kcal target.`,
        action: 'A 20-minute moderate workout would add roughly 150–250 kcal.',
        priority: 1,
      })
    }
  }

  // ── Recovery Score ───────────────────────────────────────────────────────
  const recovery = sorted.map(r => r.recovery_score).filter((v): v is number => v !== null && v > 0)
  if (recovery.length >= 3) {
    const avgRecovery = avg(recovery.slice(-3))
    if (avgRecovery < 40) {
      results.push({
        id: 'recovery-low',
        icon: 'activity',
        colorClass: 'text-red-400',
        bgClass: 'bg-red-500/10',
        category: 'Recovery',
        title: 'Low Recovery Score',
        body: `Your 3-day average recovery score is ${Math.round(avgRecovery)}% — indicating high physiological stress or poor adaptation.`,
        action: 'Skip or significantly reduce training intensity. Prioritise nutrition and sleep.',
        priority: 2,
      })
    } else if (avgRecovery >= 80) {
      results.push({
        id: 'recovery-high',
        icon: 'activity',
        colorClass: 'text-green-400',
        bgClass: 'bg-green-500/10',
        category: 'Recovery',
        title: 'Excellent Recovery',
        body: `Your recovery score averages ${Math.round(avgRecovery)}% over the last 3 days — your body is primed for hard training.`,
        action: 'A challenging workout today will yield great adaptation.',
        priority: 0,
      })
    }
  }

  // ── Training Monotony ─────────────────────────────────────────────────────
  if (steps.length >= 7) {
    const recent = steps.slice(-7)
    const mean = avg(recent)
    const variance = avg(recent.map(s => Math.pow(s - mean, 2)))
    const sd = Math.sqrt(variance)
    const monotony = mean / Math.max(sd, 1)
    if (monotony > 2.0 && mean > 4000) {
      results.push({
        id: 'monotony',
        icon: 'refresh',
        colorClass: 'text-blue-400',
        bgClass: 'bg-blue-500/10',
        category: 'Training',
        title: 'Very Consistent Activity Pattern',
        body: 'Your step counts have been very similar day after day. While consistency is positive, building in planned rest days or high-activity days improves overall adaptation.',
        action: 'Try a long walk or hike this weekend to create productive variation.',
        priority: 0,
      })
    }
  }

  // ── Distance ramp ────────────────────────────────────────────────────────
  const distances = sorted.map(r => r.distance_meters).filter((v): v is number => v !== null && v > 500)
  if (distances.length >= 6) {
    const half = Math.floor(distances.length / 2)
    const firstHalf  = avg(distances.slice(0, half))
    const secondHalf = avg(distances.slice(-half))
    if (secondHalf > firstHalf * 1.25) {
      results.push({
        id: 'distance-ramp',
        icon: 'map',
        colorClass: 'text-teal-400',
        bgClass: 'bg-teal-500/10',
        category: 'Fitness',
        title: 'Distance Is Ramping Up',
        body: `Your recent activity distance (avg ${(secondHalf / 1000).toFixed(1)} km/day) is up 25%+ vs the start of this period. Be mindful of increasing volume too quickly.`,
        action: "Follow the 10% rule — don't increase weekly distance by more than 10% per week.",
        priority: 1,
      })
    }
  }

  // Sort: urgent → normal → positive, cap at 7
  results.sort((a, b) => b.priority - a.priority)
  return results.slice(0, 7)
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function NudgesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
  const since = fourteenDaysAgo.toISOString().slice(0, 10)

  const [{ data: summaries }, { data: profile }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes, avg_hrv, recovery_score, distance_meters')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('step_goal, calorie_goal')
      .eq('id', user.id)
      .single(),
  ])

  const stepGoal  = profile?.step_goal  ?? 10000
  const calGoal   = profile?.calorie_goal ?? 500
  const nudges    = analyse(summaries ?? [], stepGoal, calGoal)
  const rowCount  = (summaries ?? []).length

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/insights"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Smart Nudges</h1>
            <p className="text-sm text-text-secondary">
              {nudges.length > 0
                ? `${nudges.length} recommendation${nudges.length !== 1 ? 's' : ''} from last 14 days`
                : 'Algorithmic health recommendations'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <NudgesClient nudges={nudges} rowCount={rowCount} />
      </main>
      <BottomNav />
    </div>
  )
}
