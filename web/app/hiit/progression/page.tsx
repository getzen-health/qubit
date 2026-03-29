import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const HiitProgressionClient = dynamic(() => import('./hiit-progression-client').then(m => ({ default: m.HiitProgressionClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HIIT Progression' }

interface MonthStat {
  label: string
  sessions: number
  totalMins: number
  totalCalories: number
}

interface QuarterRow {
  label: string
  sessions: number
  totalMins: number
  avgDurationMins: number
  avgCalories: number
}

interface SessionPoint {
  date: string
  durationMins: number
  calories: number
}

export interface HiitProgressionData {
  totalSessions: number
  totalMins: number
  totalCalories: number
  avgDurationMins: number
  avgCaloriesPerSession: number
  peakHR: number
  firstCount: number
  firstAvgDuration: number
  firstAvgCalories: number
  lastCount: number
  lastAvgDuration: number
  lastAvgCalories: number
  monthStats: MonthStat[]
  sessions: SessionPoint[]
  quarterRows: QuarterRow[]
  durationSlope: number
}

function linReg(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length
  if (n < 2) return { slope: 0, intercept: 0 }
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const ssxy = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0)
  const ssxx = xs.reduce((acc, x) => acc + (x - mx) ** 2, 0)
  if (ssxx === 0) return { slope: 0, intercept: my }
  const slope = ssxy / ssxx
  return { slope, intercept: my - slope * mx }
}

export default async function HiitProgressionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const [{ data: raw }, { data: maxHrRow }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('start_time, duration_minutes, active_calories, max_heart_rate')
      .eq('user_id', user.id)
      .in('workout_type', ['HIIT', 'High Intensity Interval Training'])
      .gte('start_time', oneYearAgo.toISOString())
      .gt('duration_minutes', 5)
      .order('start_time', { ascending: true }),
    supabase
      .from('workout_records')
      .select('max_heart_rate')
      .eq('user_id', user.id)
      .in('workout_type', ['HIIT', 'High Intensity Interval Training'])
      .not('max_heart_rate', 'is', null)
      .gt('max_heart_rate', 0)
      .order('max_heart_rate', { ascending: false })
      .limit(1)
      .single(),
  ])

  const rows = raw ?? []

  if (rows.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/hiit" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">HIIT Progression</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-16 text-center text-text-secondary">
          Not enough HIIT data yet. Complete more sessions to see progression.
        </main>
        <BottomNav />
      </div>
    )
  }

  const sessions: SessionPoint[] = rows.map((r) => ({
    date: r.start_time,
    durationMins: r.duration_minutes ?? 0,
    calories: r.active_calories ?? 0,
  }))

  const totalMins = sessions.reduce((a, s) => a + s.durationMins, 0)
  const totalCalories = sessions.reduce((a, s) => a + s.calories, 0)
  const avgDurationMins = totalMins / sessions.length
  const avgCaloriesPerSession = totalCalories / sessions.length
  const peakHR = maxHrRow?.max_heart_rate ?? 0

  // First vs last 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 3600 * 1000)
  const lastSessions = sessions.filter((s) => new Date(s.date) >= thirtyDaysAgo)
  const firstSessions = sessions.filter((s) => {
    const d = new Date(s.date)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  })
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

  // Monthly stats
  const monthMap = new Map<string, { sessions: number; mins: number; calories: number; sortKey: string }>()
  for (const s of sessions) {
    const d = new Date(s.date)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cur = monthMap.get(label) ?? { sessions: 0, mins: 0, calories: 0, sortKey }
    monthMap.set(label, {
      sessions: cur.sessions + 1,
      mins: cur.mins + s.durationMins,
      calories: cur.calories + s.calories,
      sortKey: cur.sortKey || sortKey,
    })
  }
  const monthStats: MonthStat[] = [...monthMap.entries()]
    .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
    .map(([label, v]) => ({ label, sessions: v.sessions, totalMins: v.mins, totalCalories: v.calories }))

  // Quarterly breakdown
  const qMap = new Map<string, { sessions: number; mins: number; calories: number }>()
  for (const s of sessions) {
    const d = new Date(s.date)
    const y = d.getFullYear()
    const q = Math.floor(d.getMonth() / 3) + 1
    const key = `${y} Q${q}`
    const cur = qMap.get(key) ?? { sessions: 0, mins: 0, calories: 0 }
    qMap.set(key, { sessions: cur.sessions + 1, mins: cur.mins + s.durationMins, calories: cur.calories + s.calories })
  }
  const quarterRows: QuarterRow[] = [...qMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, v]) => ({
      label,
      sessions: v.sessions,
      totalMins: v.mins,
      avgDurationMins: v.sessions > 0 ? v.mins / v.sessions : 0,
      avgCalories: v.sessions > 0 ? v.calories / v.sessions : 0,
    }))

  // Linear regression on duration
  const xs = sessions.map((s) => new Date(s.date).getTime() / 1e6)
  const { slope: durationSlope } = linReg(xs, sessions.map((s) => s.durationMins))

  const data: HiitProgressionData = {
    totalSessions: sessions.length,
    totalMins,
    totalCalories,
    avgDurationMins,
    avgCaloriesPerSession,
    peakHR,
    firstCount: firstSessions.length,
    firstAvgDuration: avg(firstSessions.map((s) => s.durationMins)),
    firstAvgCalories: avg(firstSessions.map((s) => s.calories)),
    lastCount: lastSessions.length,
    lastAvgDuration: avg(lastSessions.map((s) => s.durationMins)),
    lastAvgCalories: avg(lastSessions.map((s) => s.calories)),
    monthStats,
    sessions,
    quarterRows,
    durationSlope,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hiit"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to HIIT"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">HIIT Progression</h1>
            <p className="text-sm text-text-secondary">Last 12 months · {sessions.length} sessions</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HiitProgressionClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
