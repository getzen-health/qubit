import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { StepPatternsClient, type PatternData } from './step-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Step Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function StepPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const since = oneYearAgo.toISOString().slice(0, 10)

  const [{ data: summaries }, { data: profile }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps')
      .eq('user_id', user.id)
      .gte('date', since)
      .gt('steps', 0)
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('step_goal')
      .eq('id', user.id)
      .single(),
  ])

  const rows = summaries ?? []
  const stepGoal = profile?.step_goal ?? 10000

  // ── Day-of-week averages ────────────────────────────────────────────────────
  const dowBuckets: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }))
  for (const r of rows) {
    const dow = new Date(r.date + 'T12:00:00').getDay()  // 0=Sun
    dowBuckets[dow].sum += r.steps
    dowBuckets[dow].count++
  }
  const dowData = dowBuckets.map((b, i) => ({
    label: DOW_LABELS[i],
    avg: b.count > 0 ? Math.round(b.sum / b.count) : 0,
    count: b.count,
    isWeekend: i === 0 || i === 6,
  }))

  // ── Monthly averages ────────────────────────────────────────────────────────
  const monthBuckets: { sum: number; count: number }[] = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }))
  for (const r of rows) {
    const month = new Date(r.date + 'T12:00:00').getMonth()  // 0=Jan
    monthBuckets[month].sum += r.steps
    monthBuckets[month].count++
  }
  const monthData = monthBuckets.map((b, i) => ({
    label: MONTH_LABELS[i],
    avg: b.count > 0 ? Math.round(b.sum / b.count) : 0,
    count: b.count,
  }))

  // ── Step distribution histogram ──────────────────────────────────────────────
  const BUCKETS = [
    { label: '0–2K',  min: 0,     max: 2000  },
    { label: '2–4K',  min: 2000,  max: 4000  },
    { label: '4–6K',  min: 4000,  max: 6000  },
    { label: '6–8K',  min: 6000,  max: 8000  },
    { label: '8–10K', min: 8000,  max: 10000 },
    { label: '10–12K',min: 10000, max: 12000 },
    { label: '12–15K',min: 12000, max: 15000 },
    { label: '15K+',  min: 15000, max: Infinity },
  ]
  const histogram = BUCKETS.map(b => ({
    label: b.label,
    count: rows.filter(r => r.steps >= b.min && r.steps < b.max).length,
  }))

  // ── Consistency metrics ──────────────────────────────────────────────────────
  const stepValues = rows.map(r => r.steps)
  const totalDays  = stepValues.length
  const mean       = totalDays > 0 ? stepValues.reduce((a, b) => a + b, 0) / totalDays : 0
  const variance   = totalDays > 1
    ? stepValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / totalDays
    : 0
  const stddev     = Math.sqrt(variance)
  const cv         = mean > 0 ? stddev / mean : 0  // coefficient of variation (lower = more consistent)

  // ── Goal hit rate ────────────────────────────────────────────────────────────
  const goalHitDays = rows.filter(r => r.steps >= stepGoal).length
  const goalHitRate = totalDays > 0 ? Math.round((goalHitDays / totalDays) * 100) : 0

  // ── Best/worst day-of-week ───────────────────────────────────────────────────
  const validDow = dowData.filter(d => d.count >= 3)
  const bestDow  = validDow.length > 0 ? validDow.reduce((a, b) => a.avg > b.avg ? a : b) : null
  const worstDow = validDow.length > 0 ? validDow.reduce((a, b) => a.avg < b.avg ? a : b) : null

  // ── Weekday vs weekend ──────────────────────────────────────────────────────
  const weekdayAvg = avg(dowData.filter(d => !d.isWeekend).map(d => d.avg).filter(v => v > 0))
  const weekendAvg = avg(dowData.filter(d => d.isWeekend).map(d => d.avg).filter(v => v > 0))

  const patternData: PatternData = {
    dowData,
    monthData,
    histogram,
    totalDays,
    mean: Math.round(mean),
    stddev: Math.round(stddev),
    cv: +cv.toFixed(2),
    goalHitRate,
    goalHitDays,
    stepGoal,
    bestDow,
    worstDow,
    weekdayAvg: Math.round(weekdayAvg),
    weekendAvg: Math.round(weekendAvg),
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/steps"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to steps"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Step Patterns</h1>
            <p className="text-sm text-text-secondary">
              {totalDays > 0 ? `${totalDays} days analysed · last 12 months` : 'Day-of-week & seasonal analysis'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StepPatternsClient data={patternData} />
      </main>
      <BottomNav />
    </div>
  )
}

function avg(vals: number[]): number {
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
