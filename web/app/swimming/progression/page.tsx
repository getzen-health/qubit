import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
const SwimmingProgressionClient = dynamic(() => import('./swimming-progression-client').then(m => ({ default: m.SwimmingProgressionClient })), { ssr: false })
import type { SwimmingProgressionData } from './swimming-progression-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Swimming Progression' }

function pace100mStr(minsPerKm: number): string {
  const secsTotal = Math.round((minsPerKm * 60) / 10)
  return `${Math.floor(secsTotal / 60)}:${String(secsTotal % 60).padStart(2, '0')}`
}

export default async function SwimmingProgressionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const since = oneYearAgo.toISOString()

  const { data: rawSwims } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate, active_calories')
    .eq('user_id', user.id)
    .eq('workout_type', 'Swimming')
    .gt('duration_minutes', 3)
    .gt('distance_meters', 200)
    .gte('start_time', since)
    .not('avg_pace_per_km', 'is', null)
    .gt('avg_pace_per_km', 0)
    .order('start_time', { ascending: true })

  const swims = (rawSwims ?? []).filter((r) => (r.distance_meters ?? 0) > 0)

  // pace per 100m in seconds
  function pace100Secs(minsPerKm: number): number {
    return (minsPerKm * 60) / 10
  }

  interface Swim {
    date: string
    distanceM: number
    durationMins: number
    pace100Secs: number
    avgHr: number | null
  }

  const points: Swim[] = swims.map((s) => ({
    date: s.start_time.slice(0, 10),
    distanceM: s.distance_meters ?? 0,
    durationMins: s.duration_minutes,
    pace100Secs: pace100Secs(s.avg_pace_per_km!),
    avgHr: s.avg_heart_rate ?? null,
  })).filter((s) => s.pace100Secs > 50 && s.pace100Secs < 300)

  // ── Monthly buckets ───────────────────────────────────────────────────────
  const monthMap: Record<string, { sessions: number; totalM: number; paces: number[] }> = {}
  for (const p of points) {
    const key = p.date.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { sessions: 0, totalM: 0, paces: [] }
    monthMap[key].sessions += 1
    monthMap[key].totalM += p.distanceM
    monthMap[key].paces.push(p.pace100Secs)
  }

  const months = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      sessions: d.sessions,
      totalM: Math.round(d.totalM),
      avgPace100Secs: d.paces.length > 0
        ? +(d.paces.reduce((a, b) => a + b) / d.paces.length).toFixed(1) : 0,
      bestPace100Secs: d.paces.length > 0 ? Math.min(...d.paces) : 0,
    }))

  // ── Linear regression on pace ──────────────────────────────────────────────
  function linReg(ys: number[]): { slope: number; intercept: number } {
    const n = ys.length
    if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 }
    const mx = (n - 1) / 2
    const my = ys.reduce((a, b) => a + b) / n
    const ssxx = ys.reduce((s, _, i) => s + (i - mx) ** 2, 0)
    const ssxy = ys.reduce((s, y, i) => s + (i - mx) * (y - my), 0)
    return { slope: ssxy / ssxx, intercept: my - (ssxy / ssxx) * mx }
  }

  const paceSeries = points.map((p) => p.pace100Secs)
  const { slope, intercept } = linReg(paceSeries)
  // Positive trend = getting slower; negative = getting faster (improvement)
  const paceTrend = paceSeries.length >= 4 ? slope * (paceSeries.length - 1) : 0

  const trendPoints = points.map((p, i) => ({
    date: p.date,
    distanceM: p.distanceM,
    pace100Secs: +p.pace100Secs.toFixed(1),
    trend: +(intercept + slope * i).toFixed(1),
  }))

  // ── First 30 vs last 30 ───────────────────────────────────────────────────
  const first30Cut = new Date(oneYearAgo)
  first30Cut.setDate(first30Cut.getDate() + 30)
  const last30Cut = new Date()
  last30Cut.setDate(last30Cut.getDate() - 30)

  const first30 = points.filter((p) => p.date <= first30Cut.toISOString().slice(0, 10))
  const last30 = points.filter((p) => p.date >= last30Cut.toISOString().slice(0, 10))

  const firstAvgPace = first30.length > 0
    ? +(first30.reduce((a, p) => a + p.pace100Secs, 0) / first30.length).toFixed(1) : 0
  const lastAvgPace = last30.length > 0
    ? +(last30.reduce((a, p) => a + p.pace100Secs, 0) / last30.length).toFixed(1) : 0
  const firstAvgDist = first30.length > 0
    ? Math.round(first30.reduce((a, p) => a + p.distanceM, 0) / first30.length) : 0
  const lastAvgDist = last30.length > 0
    ? Math.round(last30.reduce((a, p) => a + p.distanceM, 0) / last30.length) : 0

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalSwims = points.length
  const totalMeters = Math.round(points.reduce((a, p) => a + p.distanceM, 0))
  const avgMeters = totalSwims > 0 ? Math.round(totalMeters / totalSwims) : 0
  const avgPace = paceSeries.length > 0 ? +(paceSeries.reduce((a, b) => a + b) / paceSeries.length).toFixed(1) : 0
  const bestPace = paceSeries.length > 0 ? +Math.min(...paceSeries).toFixed(1) : 0
  const avgPerWeek = +(totalSwims / 52).toFixed(1)

  const data: SwimmingProgressionData = {
    totalSwims,
    totalMeters,
    avgMeters,
    avgPerWeek,
    avgPace100Str: avgPace > 0 ? pace100mStr(avgPace / 6) : '',
    bestPace100Str: bestPace > 0 ? pace100mStr(bestPace / 6) : '',
    avgPace100Secs: avgPace,
    bestPace100Secs: bestPace,
    paceTrend: +paceTrend.toFixed(1),
    firstAvgPace,
    lastAvgPace,
    firstAvgPaceStr: firstAvgPace > 0 ? pace100mStr(firstAvgPace / 6) : '',
    lastAvgPaceStr: lastAvgPace > 0 ? pace100mStr(lastAvgPace / 6) : '',
    firstAvgDist,
    lastAvgDist,
    trendPoints,
    months,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/swimming" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Swimming Progression</h1>
            <p className="text-sm text-text-secondary">12-month pace & distance trend</p>
          </div>
          <TrendingUp className="w-5 h-5 text-cyan-500" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SwimmingProgressionClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
