import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { RowingProgressionClient, type RowingProgressionData } from './rowing-progression-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Rowing Progression' }

const ROWING_TYPES = ['Rowing', 'Indoor Rowing', 'Rowing Machine', 'Sculling']

function splitStr(minsPerKm: number): string {
  const splitMins = minsPerKm / 2  // 500m split in minutes
  const totalSecs = Math.round(splitMins * 60)
  return `${Math.floor(totalSecs / 60)}:${String(totalSecs % 60).padStart(2, '0')}`
}

export default async function RowingProgressionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const since = oneYearAgo.toISOString()

  const { data: rawRows } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate, active_calories')
    .eq('user_id', user.id)
    .in('workout_type', ROWING_TYPES)
    .gt('duration_minutes', 3)
    .gt('distance_meters', 500)
    .gte('start_time', since)
    .not('avg_pace_per_km', 'is', null)
    .gt('avg_pace_per_km', 0)
    .order('start_time', { ascending: true })

  const rows = (rawRows ?? []).filter((r) => (r.distance_meters ?? 0) > 0)

  // 500m split in seconds: pacePerKm (min/km) / 2 → min/500m → *60 = secs/500m
  function split500Secs(minsPerKm: number): number {
    return (minsPerKm / 2) * 60
  }

  interface Row {
    date: string
    distanceM: number
    durationMins: number
    split500Secs: number
    avgHr: number | null
  }

  const points: Row[] = rows.map((r) => ({
    date: r.start_time.slice(0, 10),
    distanceM: r.distance_meters ?? 0,
    durationMins: r.duration_minutes,
    split500Secs: split500Secs(r.avg_pace_per_km!),
    avgHr: r.avg_heart_rate ?? null,
  })).filter((r) => r.split500Secs > 60 && r.split500Secs < 600)

  // ── Monthly buckets ───────────────────────────────────────────────────────
  const monthMap: Record<string, { sessions: number; totalM: number; splits: number[] }> = {}
  for (const p of points) {
    const key = p.date.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { sessions: 0, totalM: 0, splits: [] }
    monthMap[key].sessions += 1
    monthMap[key].totalM += p.distanceM
    monthMap[key].splits.push(p.split500Secs)
  }

  const months = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      sessions: d.sessions,
      totalM: Math.round(d.totalM),
      avgSplit500Secs: d.splits.length > 0
        ? +(d.splits.reduce((a, b) => a + b) / d.splits.length).toFixed(1) : 0,
      bestSplit500Secs: d.splits.length > 0 ? Math.min(...d.splits) : 0,
    }))

  // ── Linear regression on 500m split ─────────────────────────────────────
  function linReg(ys: number[]): { slope: number; intercept: number } {
    const n = ys.length
    if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 }
    const mx = (n - 1) / 2
    const my = ys.reduce((a, b) => a + b) / n
    const ssxx = ys.reduce((s, _, i) => s + (i - mx) ** 2, 0)
    const ssxy = ys.reduce((s, y, i) => s + (i - mx) * (y - my), 0)
    return { slope: ssxy / ssxx, intercept: my - (ssxy / ssxx) * mx }
  }

  const splitSeries = points.map((p) => p.split500Secs)
  const { slope, intercept } = linReg(splitSeries)
  // Negative slope = getting faster (improvement)
  const splitTrend = splitSeries.length >= 4 ? slope * (splitSeries.length - 1) : 0

  const trendPoints = points.map((p, i) => ({
    date: p.date,
    distanceM: p.distanceM,
    split500Secs: +p.split500Secs.toFixed(1),
    trend: +(intercept + slope * i).toFixed(1),
  }))

  // ── First 30 vs last 30 ───────────────────────────────────────────────────
  const first30Cut = new Date(oneYearAgo)
  first30Cut.setDate(first30Cut.getDate() + 30)
  const last30Cut = new Date()
  last30Cut.setDate(last30Cut.getDate() - 30)

  const first30 = points.filter((p) => p.date <= first30Cut.toISOString().slice(0, 10))
  const last30 = points.filter((p) => p.date >= last30Cut.toISOString().slice(0, 10))

  const firstAvgSplit = first30.length > 0
    ? +(first30.reduce((a, p) => a + p.split500Secs, 0) / first30.length).toFixed(1) : 0
  const lastAvgSplit = last30.length > 0
    ? +(last30.reduce((a, p) => a + p.split500Secs, 0) / last30.length).toFixed(1) : 0
  const firstAvgDist = first30.length > 0
    ? Math.round(first30.reduce((a, p) => a + p.distanceM, 0) / first30.length) : 0
  const lastAvgDist = last30.length > 0
    ? Math.round(last30.reduce((a, p) => a + p.distanceM, 0) / last30.length) : 0

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalSessions = points.length
  const totalMeters = Math.round(points.reduce((a, p) => a + p.distanceM, 0))
  const avgMeters = totalSessions > 0 ? Math.round(totalMeters / totalSessions) : 0
  const avgSplit = splitSeries.length > 0 ? +(splitSeries.reduce((a, b) => a + b) / splitSeries.length).toFixed(1) : 0
  const bestSplit = splitSeries.length > 0 ? +Math.min(...splitSeries).toFixed(1) : 0
  const avgPerWeek = +(totalSessions / 52).toFixed(1)

  const data: RowingProgressionData = {
    totalSessions,
    totalMeters,
    avgMeters,
    avgPerWeek,
    avgSplit500Str: avgSplit > 0 ? splitStr(avgSplit / 30) : '',
    bestSplit500Str: bestSplit > 0 ? splitStr(bestSplit / 30) : '',
    avgSplit500Secs: avgSplit,
    bestSplit500Secs: bestSplit,
    splitTrend: +splitTrend.toFixed(1),
    firstAvgSplit,
    lastAvgSplit,
    firstAvgSplitStr: firstAvgSplit > 0 ? splitStr(firstAvgSplit / 30) : '',
    lastAvgSplitStr: lastAvgSplit > 0 ? splitStr(lastAvgSplit / 30) : '',
    firstAvgDist,
    lastAvgDist,
    trendPoints,
    months,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/rowing" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Rowing Progression</h1>
            <p className="text-sm text-text-secondary">12-month 500m split & distance trend</p>
          </div>
          <TrendingUp className="w-5 h-5 text-pink-500" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RowingProgressionClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
