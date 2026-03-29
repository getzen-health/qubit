import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
const CyclingProgressionClient = dynamic(() => import('./cycling-progression-client').then(m => ({ default: m.CyclingProgressionClient })))
import type { CyclingProgressionData } from './cycling-progression-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Cycling Progression' }

export default async function CyclingProgressionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const since = oneYearAgo.toISOString()

  const { data: rawRides } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_heart_rate, active_calories, elevation_gain_meters')
    .eq('user_id', user.id)
    .eq('workout_type', 'Cycling')
    .gt('duration_minutes', 3)
    .gt('distance_meters', 500)
    .gte('start_time', since)
    .order('start_time', { ascending: true })

  const rides = (rawRides ?? []).filter((r) => (r.distance_meters ?? 0) > 0)

  // ── Per-ride points ───────────────────────────────────────────────────────
  interface Ride {
    date: string
    distanceKm: number
    durationMins: number
    speedKph: number         // avg km/h
    elevationM: number
    avgHr: number | null
  }

  const points: Ride[] = rides.map((r) => {
    const km = (r.distance_meters ?? 0) / 1000
    const speed = r.duration_minutes > 0 ? (km / r.duration_minutes) * 60 : 0
    return {
      date: r.start_time.slice(0, 10),
      distanceKm: +km.toFixed(2),
      durationMins: r.duration_minutes,
      speedKph: +speed.toFixed(1),
      elevationM: r.elevation_gain_meters ?? 0,
      avgHr: r.avg_heart_rate ?? null,
    }
  }).filter((r) => r.speedKph > 5 && r.speedKph < 80)

  // ── Monthly buckets ───────────────────────────────────────────────────────
  const monthMap: Record<string, {
    sessions: number; totalKm: number; totalMins: number; totalElevM: number; speeds: number[]
  }> = {}

  for (const p of points) {
    const key = p.date.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { sessions: 0, totalKm: 0, totalMins: 0, totalElevM: 0, speeds: [] }
    monthMap[key].sessions += 1
    monthMap[key].totalKm += p.distanceKm
    monthMap[key].totalMins += p.durationMins
    monthMap[key].totalElevM += p.elevationM
    if (p.speedKph > 0) monthMap[key].speeds.push(p.speedKph)
  }

  const months = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      sessions: d.sessions,
      totalKm: +d.totalKm.toFixed(1),
      totalMins: Math.round(d.totalMins),
      totalElevM: Math.round(d.totalElevM),
      avgSpeedKph: d.speeds.length > 0 ? +(d.speeds.reduce((a, b) => a + b) / d.speeds.length).toFixed(1) : 0,
      avgKmPerRide: +(d.totalKm / d.sessions).toFixed(1),
    }))

  // ── Quarterly breakdown ───────────────────────────────────────────────────
  const quarterMap: Record<string, { sessions: number; totalKm: number; totalElevM: number; speeds: number[] }> = {}
  for (const p of points) {
    const d = new Date(p.date)
    const q = `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`
    if (!quarterMap[q]) quarterMap[q] = { sessions: 0, totalKm: 0, totalElevM: 0, speeds: [] }
    quarterMap[q].sessions += 1
    quarterMap[q].totalKm += p.distanceKm
    quarterMap[q].totalElevM += p.elevationM
    if (p.speedKph > 0) quarterMap[q].speeds.push(p.speedKph)
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
      totalKm: +d.totalKm.toFixed(1),
      totalElevM: Math.round(d.totalElevM),
      avgSpeedKph: d.speeds.length > 0 ? +(d.speeds.reduce((a, b) => a + b) / d.speeds.length).toFixed(1) : 0,
    }))

  // ── Linear regression on speed ────────────────────────────────────────────
  function linReg(ys: number[]): { slope: number; intercept: number } {
    const n = ys.length
    if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 }
    const mx = (n - 1) / 2
    const my = ys.reduce((a, b) => a + b) / n
    const ssxx = ys.reduce((s, _, i) => s + (i - mx) ** 2, 0)
    const ssxy = ys.reduce((s, y, i) => s + (i - mx) * (y - my), 0)
    return { slope: ssxy / ssxx, intercept: my - (ssxy / ssxx) * mx }
  }

  const speedSeries = points.map((p) => p.speedKph)
  const { slope: sSlope, intercept: sIntercept } = linReg(speedSeries)
  const speedTrend = speedSeries.length >= 4 ? sSlope * (speedSeries.length - 1) : 0

  const trendPoints = points.map((p, i) => ({
    date: p.date,
    distanceKm: p.distanceKm,
    speedKph: p.speedKph,
    trend: +(sIntercept + sSlope * i).toFixed(2),
  }))

  // ── First 30 vs last 30 days ──────────────────────────────────────────────
  const first30Cut = new Date(oneYearAgo)
  first30Cut.setDate(first30Cut.getDate() + 30)
  const last30Cut = new Date()
  last30Cut.setDate(last30Cut.getDate() - 30)

  const first30 = points.filter((p) => p.date <= first30Cut.toISOString().slice(0, 10))
  const last30 = points.filter((p) => p.date >= last30Cut.toISOString().slice(0, 10))

  const firstAvgSpeed = first30.length > 0
    ? +(first30.reduce((a, p) => a + p.speedKph, 0) / first30.length).toFixed(1) : 0
  const lastAvgSpeed = last30.length > 0
    ? +(last30.reduce((a, p) => a + p.speedKph, 0) / last30.length).toFixed(1) : 0
  const firstAvgDist = first30.length > 0
    ? +(first30.reduce((a, p) => a + p.distanceKm, 0) / first30.length).toFixed(1) : 0
  const lastAvgDist = last30.length > 0
    ? +(last30.reduce((a, p) => a + p.distanceKm, 0) / last30.length).toFixed(1) : 0

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalRides = points.length
  const totalKm = +points.reduce((a, p) => a + p.distanceKm, 0).toFixed(1)
  const totalElevM = Math.round(points.reduce((a, p) => a + p.elevationM, 0))
  const avgKmPerRide = totalRides > 0 ? +(totalKm / totalRides).toFixed(1) : 0
  const avgSpeedKph = speedSeries.length > 0
    ? +(speedSeries.reduce((a, b) => a + b) / speedSeries.length).toFixed(1) : 0
  const bestSpeedKph = speedSeries.length > 0 ? +Math.max(...speedSeries).toFixed(1) : 0
  const avgPerWeek = +(totalRides / 52).toFixed(1)

  const data: CyclingProgressionData = {
    totalRides,
    totalKm,
    totalElevM,
    avgKmPerRide,
    avgSpeedKph,
    bestSpeedKph,
    avgPerWeek,
    speedTrend: +speedTrend.toFixed(2),
    firstAvgSpeed,
    lastAvgSpeed,
    firstAvgDist,
    lastAvgDist,
    trendPoints,
    months,
    quarters,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/cycling" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Cycling Progression</h1>
            <p className="text-sm text-text-secondary">12-month distance & speed trend</p>
          </div>
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CyclingProgressionClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
