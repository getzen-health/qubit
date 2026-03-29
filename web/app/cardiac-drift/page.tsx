import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const CardiacDriftClient = dynamic(() => import('./cardiac-drift-client').then(m => ({ default: m.CardiacDriftClient })))

export const metadata = { title: 'Cardiac Drift' }

// ─── Types ────────────────────────────────────────────────────────────────────

export type DriftLevel = 'excellent' | 'moderate' | 'high'

export interface DriftRun {
  id: string
  date: string          // ISO date string
  workout_type: string
  duration_minutes: number
  avg_heart_rate: number
  max_heart_rate: number | null
  // Derived in server
  first_half_hr: number
  second_half_hr: number
  drift_pct: number
  drift_level: DriftLevel
}

export interface CardiacDriftData {
  runs: DriftRun[]
  avgDrift: number
  bestDrift: number     // lowest drift (best aerobic base)
  worstDrift: number    // highest drift
  trendDirection: 'improving' | 'worsening' | 'stable' | 'insufficient'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyDrift(pct: number): DriftLevel {
  if (pct < 5) return 'excellent'
  if (pct <= 10) return 'moderate'
  return 'high'
}

/**
 * Derive first/second half heart rates from available summary columns.
 *
 * Apple Health only exposes avg and max for a workout summary — it does not
 * store per-minute HR splits. We estimate using a physiologically-motivated
 * proxy:
 *
 *   estimated_drift ≈ (max_hr - avg_hr) / avg_hr * 100 * 0.6
 *
 * The 0.6 factor converts the full peak-to-mean spread into a realistic
 * first→second half drift (most of the rise happens in the second half).
 * The first half is modelled as avg_hr * (1 - drift/2 / 100) and the
 * second half as avg_hr * (1 + drift/2 / 100).
 *
 * When max_hr is unavailable we fall back to a fixed 4 % drift assumption
 * (representative of a moderately fit aerobic athlete).
 */
function deriveHRSplits(avgHR: number, maxHR: number | null): {
  firstHalf: number
  secondHalf: number
  driftPct: number
} {
  let driftPct: number

  if (maxHR != null && maxHR > avgHR) {
    driftPct = ((maxHR - avgHR) / avgHR) * 100 * 0.6
  } else {
    // Fallback: assume a gentle 4 % drift
    driftPct = 4
  }

  // Cap at a realistic ceiling (cardiac drift rarely exceeds ~20 % even in
  // very unfit athletes or severe dehydration scenarios)
  driftPct = Math.min(driftPct, 20)

  const halfDrift = driftPct / 2
  const firstHalf = Math.round(avgHR * (1 - halfDrift / 100))
  const secondHalf = Math.round(avgHR * (1 + halfDrift / 100))

  return { firstHalf, secondHalf, driftPct: Math.round(driftPct * 10) / 10 }
}

function computeTrend(runs: DriftRun[]): CardiacDriftData['trendDirection'] {
  if (runs.length < 4) return 'insufficient'

  // Compare the average drift of the most recent half vs the older half
  const mid = Math.floor(runs.length / 2)
  // runs are ordered newest-first; older half is end of array
  const recentHalf = runs.slice(0, mid)
  const olderHalf = runs.slice(mid)

  const recentAvg = recentHalf.reduce((s, r) => s + r.drift_pct, 0) / recentHalf.length
  const olderAvg = olderHalf.reduce((s, r) => s + r.drift_pct, 0) / olderHalf.length

  const delta = recentAvg - olderAvg

  if (delta < -0.8) return 'improving'  // drift decreasing = getting fitter
  if (delta > 0.8) return 'worsening'
  return 'stable'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CardiacDriftPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch long runs (≥ 45 min) from the last 12 months
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)

  const { data: rawRows } = await supabase
    .from('workout_records')
    .select('id, start_time, workout_type, duration_minutes, avg_heart_rate, max_heart_rate')
    .eq('user_id', user.id)
    .ilike('workout_type', '%run%')
    .gte('duration_minutes', 45)
    .gte('start_time', twelveMonthsAgo.toISOString())
    .gt('avg_heart_rate', 0)
    .order('start_time', { ascending: false })
    .limit(50)

  const rows = rawRows ?? []

  const runs: DriftRun[] = rows.map((row) => {
    const avgHR = Number(row.avg_heart_rate)
    const maxHR = row.max_heart_rate != null ? Number(row.max_heart_rate) : null
    const { firstHalf, secondHalf, driftPct } = deriveHRSplits(avgHR, maxHR)

    return {
      id: String(row.id),
      date: String(row.start_time ?? ''),
      workout_type: String(row.workout_type ?? 'Running'),
      duration_minutes: Number(row.duration_minutes),
      avg_heart_rate: avgHR,
      max_heart_rate: maxHR,
      first_half_hr: firstHalf,
      second_half_hr: secondHalf,
      drift_pct: driftPct,
      drift_level: classifyDrift(driftPct),
    }
  })

  const emptyData: CardiacDriftData = {
    runs: [],
    avgDrift: 0,
    bestDrift: 0,
    worstDrift: 0,
    trendDirection: 'insufficient',
  }

  if (runs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader />
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
          <CardiacDriftClient data={emptyData} />
        </main>
        <BottomNav />
      </div>
    )
  }

  const driftValues = runs.map((r) => r.drift_pct)
  const avgDrift = Math.round((driftValues.reduce((s, d) => s + d, 0) / driftValues.length) * 10) / 10
  const bestDrift = Math.min(...driftValues)
  const worstDrift = Math.max(...driftValues)
  const trendDirection = computeTrend(runs)

  const data: CardiacDriftData = {
    runs,
    avgDrift,
    bestDrift,
    worstDrift,
    trendDirection,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        <CardiacDriftClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}

function PageHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
        <Link
          href="/running"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back to running"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cardiac Drift</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Heart rate rise in long runs · estimated</p>
        </div>
        <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>
    </header>
  )
}
