import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const CaloriePatternsClient = dynamic(() => import('./calorie-patterns-client').then(m => ({ default: m.CaloriePatternsClient })))
import type { CaloriePatternData } from './calorie-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Calorie Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function CaloriePatternsPage() {
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
      .select('date, active_calories')
      .eq('user_id', user.id)
      .gte('date', since)
      .gt('active_calories', 0)
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('calorie_goal')
      .eq('id', user.id)
      .single(),
  ])

  const rows = summaries ?? []
  const calorieGoal = profile?.calorie_goal ?? null

  // ── Day-of-week averages ────────────────────────────────────────────────────
  const dowBuckets: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }))
  for (const r of rows) {
    const dow = new Date(r.date + 'T12:00:00').getDay()
    dowBuckets[dow].sum += r.active_calories ?? 0
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
    const month = new Date(r.date + 'T12:00:00').getMonth()
    monthBuckets[month].sum += r.active_calories ?? 0
    monthBuckets[month].count++
  }
  const monthData = monthBuckets.map((b, i) => ({
    label: MONTH_LABELS[i],
    avg: b.count > 0 ? Math.round(b.sum / b.count) : 0,
    count: b.count,
  }))

  // ── Calorie distribution histogram ──────────────────────────────────────────
  const BUCKETS = [
    { label: '<100',    min: 0,    max: 100   },
    { label: '100–200', min: 100,  max: 200   },
    { label: '200–350', min: 200,  max: 350   },
    { label: '350–500', min: 350,  max: 500   },
    { label: '500–700', min: 500,  max: 700   },
    { label: '700–900', min: 700,  max: 900   },
    { label: '900–1.2K',min: 900,  max: 1200  },
    { label: '1.2K+',  min: 1200, max: Infinity },
  ]
  const histogram = BUCKETS.map(b => ({
    label: b.label,
    count: rows.filter(r => (r.active_calories ?? 0) >= b.min && (r.active_calories ?? 0) < b.max).length,
    isHighGoal: calorieGoal !== null && b.min >= calorieGoal,
  }))

  // ── Consistency metrics ──────────────────────────────────────────────────────
  const calValues = rows.map(r => r.active_calories ?? 0)
  const totalDays = calValues.length
  const mean      = totalDays > 0 ? calValues.reduce((a, b) => a + b, 0) / totalDays : 0
  const variance  = totalDays > 1
    ? calValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / totalDays
    : 0
  const stddev    = Math.sqrt(variance)
  const cv        = mean > 0 ? stddev / mean : 0

  // ── Goal hit rate ─────────────────────────────────────────────────────────
  const goalHitDays = calorieGoal !== null ? rows.filter(r => (r.active_calories ?? 0) >= calorieGoal).length : null
  const goalHitRate = calorieGoal !== null && totalDays > 0
    ? Math.round(((goalHitDays ?? 0) / totalDays) * 100)
    : null

  // ── Best/worst day-of-week ───────────────────────────────────────────────────
  const validDow = dowData.filter(d => d.count >= 3)
  const bestDow  = validDow.length > 0 ? validDow.reduce((a, b) => a.avg > b.avg ? a : b) : null
  const worstDow = validDow.length > 0 ? validDow.reduce((a, b) => a.avg < b.avg ? a : b) : null

  // ── Weekday vs weekend ──────────────────────────────────────────────────────
  const weekdayAvg = avgOf(dowData.filter(d => !d.isWeekend).map(d => d.avg).filter(v => v > 0))
  const weekendAvg = avgOf(dowData.filter(d => d.isWeekend).map(d => d.avg).filter(v => v > 0))

  const data: CaloriePatternData = {
    dowData,
    monthData,
    histogram,
    totalDays,
    mean: Math.round(mean),
    stddev: Math.round(stddev),
    cv: +cv.toFixed(2),
    calorieGoal,
    goalHitRate,
    goalHitDays,
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
            href="/calories"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to calories"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Calorie Patterns</h1>
            <p className="text-sm text-text-secondary">
              {totalDays > 0 ? `${totalDays} days analysed · last 12 months` : 'Day-of-week & seasonal analysis'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CaloriePatternsClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}

function avgOf(vals: number[]): number {
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
