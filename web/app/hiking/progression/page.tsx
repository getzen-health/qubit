import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HikingProgressionClient } from './hiking-progression-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Hiking Progression' }

interface MonthStat {
  label: string
  totalKm: number
  totalElevationM: number
  sessions: number
}

interface QuarterRow {
  label: string
  sessions: number
  totalKm: number
  avgKm: number
  totalElevationM: number
}

interface SessionPoint {
  date: string
  distKm: number
  elevationM: number
  durationMins: number
}

export interface HikingProgressionData {
  totalSessions: number
  totalKm: number
  totalElevationM: number
  avgDistKm: number
  longestKm: number
  highestClimbM: number
  firstCount: number
  firstAvgKm: number
  firstAvgElev: number
  lastCount: number
  lastAvgKm: number
  lastAvgElev: number
  monthStats: MonthStat[]
  sessions: SessionPoint[]
  quarterRows: QuarterRow[]
  distSlope: number
  elevSlope: number
  hasElevation: boolean
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

export default async function HikingProgressionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: raw } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, elevation_gain_meters')
    .eq('user_id', user.id)
    .eq('workout_type', 'Hiking')
    .gte('start_time', oneYearAgo.toISOString())
    .gt('duration_minutes', 5)
    .gt('distance_meters', 200)
    .order('start_time', { ascending: true })

  const rows = (raw ?? []).filter((r) => r.distance_meters && r.distance_meters > 0)

  if (rows.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/hiking" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Hiking Progression</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-16 text-center text-text-secondary">
          Not enough hiking data yet. Complete more hikes to see progression.
        </main>
        <BottomNav />
      </div>
    )
  }

  // Build session points
  const sessions: SessionPoint[] = rows.map((r) => ({
    date: r.start_time,
    distKm: (r.distance_meters ?? 0) / 1000,
    elevationM: r.elevation_gain_meters ?? 0,
    durationMins: r.duration_minutes ?? 0,
  }))

  const totalKm = sessions.reduce((a, s) => a + s.distKm, 0)
  const totalElevationM = sessions.reduce((a, s) => a + s.elevationM, 0)
  const avgDistKm = totalKm / sessions.length
  const longestKm = Math.max(...sessions.map((s) => s.distKm))
  const highestClimbM = Math.max(...sessions.map((s) => s.elevationM))

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
  const monthMap = new Map<string, { km: number; elevM: number; count: number; sortKey: string }>()
  for (const s of sessions) {
    const d = new Date(s.date)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cur = monthMap.get(label) ?? { km: 0, elevM: 0, count: 0, sortKey }
    monthMap.set(label, { km: cur.km + s.distKm, elevM: cur.elevM + s.elevationM, count: cur.count + 1, sortKey: cur.sortKey || sortKey })
  }
  const monthStats: MonthStat[] = [...monthMap.entries()]
    .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
    .map(([label, v]) => ({ label, totalKm: v.km, totalElevationM: v.elevM, sessions: v.count }))

  // Quarterly breakdown
  const qMap = new Map<string, { sessions: number; km: number; elevM: number }>()
  for (const s of sessions) {
    const d = new Date(s.date)
    const y = d.getFullYear()
    const q = Math.floor(d.getMonth() / 3) + 1
    const key = `${y} Q${q}`
    const cur = qMap.get(key) ?? { sessions: 0, km: 0, elevM: 0 }
    qMap.set(key, { sessions: cur.sessions + 1, km: cur.km + s.distKm, elevM: cur.elevM + s.elevationM })
  }
  const quarterRows: QuarterRow[] = [...qMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, v]) => ({
      label,
      sessions: v.sessions,
      totalKm: v.km,
      avgKm: v.sessions > 0 ? v.km / v.sessions : 0,
      totalElevationM: v.elevM,
    }))

  // Linear regression
  const xs = sessions.map((s) => new Date(s.date).getTime() / 1e6)
  const { slope: distSlope } = linReg(xs, sessions.map((s) => s.distKm))
  const elevSessions = sessions.filter((s) => s.elevationM > 0)
  const xsElev = elevSessions.map((s) => new Date(s.date).getTime() / 1e6)
  const { slope: elevSlope } = linReg(xsElev, elevSessions.map((s) => s.elevationM))

  const data: HikingProgressionData = {
    totalSessions: sessions.length,
    totalKm,
    totalElevationM,
    avgDistKm,
    longestKm,
    highestClimbM,
    firstCount: firstSessions.length,
    firstAvgKm: avg(firstSessions.map((s) => s.distKm)),
    firstAvgElev: avg(firstSessions.map((s) => s.elevationM)),
    lastCount: lastSessions.length,
    lastAvgKm: avg(lastSessions.map((s) => s.distKm)),
    lastAvgElev: avg(lastSessions.map((s) => s.elevationM)),
    monthStats,
    sessions,
    quarterRows,
    distSlope,
    elevSlope,
    hasElevation: totalElevationM > 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hiking"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to hiking"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Hiking Progression</h1>
            <p className="text-sm text-text-secondary">Last 12 months · {sessions.length} hikes</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HikingProgressionClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
