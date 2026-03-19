import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { StrengthProgressionClient, type ProgressionData } from './strength-progression-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Strength Progression' }

const STRENGTH_TYPES = [
  'Strength Training',
  'Functional Strength Training',
  'Core Training',
  'Cross Training',
  'Flexibility',
  'Mixed Cardio',
]

export default async function StrengthProgressionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const since = oneYearAgo.toISOString()

  const { data: rawSessions } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, active_calories, workout_type, avg_heart_rate')
    .eq('user_id', user.id)
    .in('workout_type', STRENGTH_TYPES)
    .gt('duration_minutes', 5)
    .gte('start_time', since)
    .order('start_time', { ascending: true })

  const sessions = rawSessions ?? []

  // ── Per-session points ────────────────────────────────────────────────────
  interface Session {
    date: string
    type: string
    durationMins: number
    calories: number
    avgHr: number | null
  }

  const points: Session[] = sessions.map((s) => ({
    date: s.start_time.slice(0, 10),
    type: s.workout_type ?? 'Strength Training',
    durationMins: s.duration_minutes,
    calories: s.active_calories ?? 0,
    avgHr: s.avg_heart_rate ?? null,
  }))

  // ── Monthly buckets ───────────────────────────────────────────────────────
  const monthMap: Record<string, { sessions: number; totalMins: number; totalCals: number }> = {}
  for (const p of points) {
    const key = p.date.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { sessions: 0, totalMins: 0, totalCals: 0 }
    monthMap[key].sessions += 1
    monthMap[key].totalMins += p.durationMins
    monthMap[key].totalCals += p.calories
  }

  const months = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      sessions: d.sessions,
      totalMins: Math.round(d.totalMins),
      totalCals: Math.round(d.totalCals),
      avgDurationMins: Math.round(d.totalMins / d.sessions),
    }))

  // ── Quarterly breakdown ───────────────────────────────────────────────────
  const quarterMap: Record<string, { sessions: number; totalMins: number; totalCals: number }> = {}
  for (const p of points) {
    const d = new Date(p.date)
    const q = `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`
    if (!quarterMap[q]) quarterMap[q] = { sessions: 0, totalMins: 0, totalCals: 0 }
    quarterMap[q].sessions += 1
    quarterMap[q].totalMins += p.durationMins
    quarterMap[q].totalCals += p.calories
  }

  const quarters = Object.entries(quarterMap)
    .sort(([a], [b]) => {
      const [qa, ya] = a.split(' ')
      const [qb, yb] = b.split(' ')
      return ya !== yb ? +ya - +yb : +qa.slice(1) - +qb.slice(1)
    })
    .map(([quarter, d]) => ({
      quarter,
      sessions: d.sessions,
      totalHours: +(d.totalMins / 60).toFixed(1),
      avgDurationMins: Math.round(d.totalMins / d.sessions),
    }))

  // ── Type breakdown ────────────────────────────────────────────────────────
  const typeMap: Record<string, number> = {}
  for (const p of points) {
    typeMap[p.type] = (typeMap[p.type] ?? 0) + 1
  }
  const typeBreakdown = Object.entries(typeMap)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count }))

  // ── Linear regression on session duration ─────────────────────────────────
  function linReg(ys: number[]): { slope: number; intercept: number } {
    const n = ys.length
    if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 }
    const mx = (n - 1) / 2
    const my = ys.reduce((a, b) => a + b) / n
    const ssxx = ys.reduce((s, _, i) => s + (i - mx) ** 2, 0)
    const ssxy = ys.reduce((s, y, i) => s + (i - mx) * (y - my), 0)
    const slope = ssxy / ssxx
    return { slope, intercept: my - slope * mx }
  }

  const durSeries = points.map((p) => p.durationMins)
  const { slope: durSlope, intercept: durIntercept } = linReg(durSeries)
  const trendPoints = points.map((p, i) => ({
    date: p.date,
    duration: p.durationMins,
    trend: +(durIntercept + durSlope * i).toFixed(1),
  }))

  // Improvement: positive slope = longer sessions (volume progression)
  const durationTrend =
    durSeries.length >= 4
      ? durSlope * (durSeries.length - 1)
      : 0

  // ── First 30 vs last 30 days ──────────────────────────────────────────────
  const cutoff30 = new Date(oneYearAgo)
  cutoff30.setDate(cutoff30.getDate() + 30)
  const cutoff30Iso = cutoff30.toISOString().slice(0, 10)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().slice(0, 10)

  const firstPeriod = points.filter((p) => p.date <= cutoff30Iso)
  const lastPeriod = points.filter((p) => p.date >= thirtyDaysAgoIso)

  const firstAvgDuration = firstPeriod.length > 0
    ? Math.round(firstPeriod.reduce((a, p) => a + p.durationMins, 0) / firstPeriod.length)
    : 0
  const lastAvgDuration = lastPeriod.length > 0
    ? Math.round(lastPeriod.reduce((a, p) => a + p.durationMins, 0) / lastPeriod.length)
    : 0

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalSessions = points.length
  const totalMins = points.reduce((a, p) => a + p.durationMins, 0)
  const avgDurationMins = totalSessions > 0 ? Math.round(totalMins / totalSessions) : 0
  const totalCals = Math.round(points.reduce((a, p) => a + p.calories, 0))
  const avgPerWeek = +(totalSessions / 52).toFixed(1)

  const data: ProgressionData = {
    totalSessions,
    totalHours: +(totalMins / 60).toFixed(1),
    avgDurationMins,
    avgPerWeek,
    totalCals,
    durationTrend: +durationTrend.toFixed(1),
    firstAvgDuration,
    lastAvgDuration,
    trendPoints,
    months,
    quarters,
    typeBreakdown,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/strength"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to strength"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Strength Progression</h1>
            <p className="text-sm text-text-secondary">12-month training volume trend</p>
          </div>
          <TrendingUp className="w-5 h-5 text-red-500" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StrengthProgressionClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
