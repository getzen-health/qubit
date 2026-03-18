import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Compare Weeks' }

function fmtSteps(n: number) { return n.toLocaleString() }
function fmtCal(n: number) { return `${Math.round(n)} kcal` }
function fmtSleep(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${m}m`
}
function fmtHrv(n: number) { return `${Math.round(n)} ms` }
function fmtRecovery(n: number) { return `${Math.round(n)}%` }
function fmtMin(n: number) { return `${Math.round(n)} min` }
function fmtDist(m: number) { return `${(m / 1000).toFixed(1)} km` }

interface Metric {
  label: string
  thisWeek: number
  lastWeek: number
  format: (n: number) => string
  higherIsBetter: boolean
}

function pct(a: number, b: number): number | null {
  if (b === 0) return null
  return Math.round(((a - b) / b) * 100)
}

function MetricRow({ metric }: { metric: Metric }) {
  const change = pct(metric.thisWeek, metric.lastWeek)
  const isUp = change !== null && change > 0
  const isDown = change !== null && change < 0
  const positive = metric.higherIsBetter ? isUp : isDown
  const negative = metric.higherIsBetter ? isDown : isUp

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-3">{metric.label}</p>
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs text-text-secondary mb-0.5">This week</p>
          <p className="text-xl font-bold text-text-primary">{metric.thisWeek > 0 ? metric.format(metric.thisWeek) : '—'}</p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-text-secondary mb-0.5">Last week</p>
          <p className="text-lg font-semibold text-text-secondary">{metric.lastWeek > 0 ? metric.format(metric.lastWeek) : '—'}</p>
        </div>
        <div className="shrink-0 text-right">
          {change !== null && metric.thisWeek > 0 && metric.lastWeek > 0 ? (
            <div className={`flex items-center gap-1 font-semibold text-sm ${positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-text-secondary'}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : isDown ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {change > 0 ? '+' : ''}{change}%
            </div>
          ) : (
            <Minus className="w-4 h-4 text-text-secondary opacity-30" />
          )}
        </div>
      </div>
    </div>
  )
}

export default async function ComparePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  // This week: last 7 days (including today)
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - 6)
  // Last week: 7 days before that
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(thisWeekStart)
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [{ data: thisWeekData }, { data: lastWeekData }, { data: thisWeekWorkouts }, { data: lastWeekWorkouts }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('steps, active_calories, sleep_duration_minutes, avg_hrv, recovery_score, active_minutes, distance_meters')
      .eq('user_id', user.id)
      .gte('date', fmt(thisWeekStart))
      .lte('date', fmt(today)),
    supabase
      .from('daily_summaries')
      .select('steps, active_calories, sleep_duration_minutes, avg_hrv, recovery_score, active_minutes, distance_meters')
      .eq('user_id', user.id)
      .gte('date', fmt(lastWeekStart))
      .lte('date', fmt(lastWeekEnd)),
    supabase
      .from('workout_records')
      .select('id')
      .eq('user_id', user.id)
      .gte('start_time', `${fmt(thisWeekStart)}T00:00:00`)
      .lte('start_time', `${fmt(today)}T23:59:59`),
    supabase
      .from('workout_records')
      .select('id')
      .eq('user_id', user.id)
      .gte('start_time', `${fmt(lastWeekStart)}T00:00:00`)
      .lte('start_time', `${fmt(lastWeekEnd)}T23:59:59`),
  ])

  function sum(rows: typeof thisWeekData, key: string): number {
    return (rows ?? []).reduce((a, r) => a + ((r as Record<string, number>)[key] ?? 0), 0)
  }
  function avg(rows: typeof thisWeekData, key: string): number {
    const vals = (rows ?? []).map((r) => (r as Record<string, number>)[key]).filter((v) => v > 0)
    if (vals.length === 0) return 0
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const metrics: Metric[] = [
    {
      label: 'Total Steps',
      thisWeek: sum(thisWeekData, 'steps'),
      lastWeek: sum(lastWeekData, 'steps'),
      format: fmtSteps,
      higherIsBetter: true,
    },
    {
      label: 'Active Calories',
      thisWeek: sum(thisWeekData, 'active_calories'),
      lastWeek: sum(lastWeekData, 'active_calories'),
      format: fmtCal,
      higherIsBetter: true,
    },
    {
      label: 'Distance',
      thisWeek: sum(thisWeekData, 'distance_meters'),
      lastWeek: sum(lastWeekData, 'distance_meters'),
      format: fmtDist,
      higherIsBetter: true,
    },
    {
      label: 'Active Minutes',
      thisWeek: sum(thisWeekData, 'active_minutes'),
      lastWeek: sum(lastWeekData, 'active_minutes'),
      format: fmtMin,
      higherIsBetter: true,
    },
    {
      label: 'Avg Sleep',
      thisWeek: avg(thisWeekData, 'sleep_duration_minutes'),
      lastWeek: avg(lastWeekData, 'sleep_duration_minutes'),
      format: fmtSleep,
      higherIsBetter: true,
    },
    {
      label: 'Avg HRV',
      thisWeek: avg(thisWeekData, 'avg_hrv'),
      lastWeek: avg(lastWeekData, 'avg_hrv'),
      format: fmtHrv,
      higherIsBetter: true,
    },
    {
      label: 'Avg Recovery',
      thisWeek: avg(thisWeekData, 'recovery_score'),
      lastWeek: avg(lastWeekData, 'recovery_score'),
      format: fmtRecovery,
      higherIsBetter: true,
    },
    {
      label: 'Workouts',
      thisWeek: (thisWeekWorkouts ?? []).length,
      lastWeek: (lastWeekWorkouts ?? []).length,
      format: (n) => n.toString(),
      higherIsBetter: true,
    },
  ]

  const thisWeekLabel = `${thisWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  const lastWeekLabel = `${lastWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/trends"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Week Comparison</h1>
            <p className="text-sm text-text-secondary">{lastWeekLabel} vs {thisWeekLabel}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-3">
        {metrics
          .filter((m) => m.thisWeek > 0 || m.lastWeek > 0)
          .map((m) => (
            <MetricRow key={m.label} metric={m} />
          ))}
        {metrics.every((m) => m.thisWeek === 0 && m.lastWeek === 0) && (
          <div className="text-center py-20 text-text-secondary">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No data to compare yet.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
