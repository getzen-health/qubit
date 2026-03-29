import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const ProgressionClient = dynamic(() => import('./progression-client').then(m => ({ default: m.ProgressionClient })))
import type { ProgressionData } from './progression-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Running Progression' }

export default async function RunningProgressionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const since = oneYearAgo.toISOString()

  const { data: rawRuns } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_heart_rate, active_calories')
    .eq('user_id', user.id)
    .eq('workout_type', 'running')
    .gt('duration_minutes', 5)
    .gt('distance_meters', 500)
    .gte('start_time', since)
    .order('start_time', { ascending: true })

  const runs = (rawRuns ?? []).filter((r) => r.distance_meters && r.distance_meters > 0)

  // ── Per-run: compute pace ─────────────────────────────────────────────────
  interface Run {
    date: string
    distanceKm: number
    durationMins: number
    paceSecsPerKm: number  // pace = secs / km
    avgHr: number | null
  }

  const processedRuns: Run[] = runs.map((r) => {
    const km = (r.distance_meters ?? 0) / 1000
    const pace = km > 0 ? (r.duration_minutes * 60) / km : 0
    return {
      date: r.start_time.slice(0, 10),
      distanceKm: +km.toFixed(2),
      durationMins: r.duration_minutes,
      paceSecsPerKm: +pace.toFixed(1),
      avgHr: r.avg_heart_rate ?? null,
    }
  }).filter((r) => r.paceSecsPerKm > 120 && r.paceSecsPerKm < 900)  // 2 min – 15 min /km

  // ── Monthly buckets ────────────────────────────────────────────────────────
  const monthMap: Record<string, { distKm: number; durationMins: number; sessions: number; paces: number[] }> = {}
  for (const r of processedRuns) {
    const key = r.date.slice(0, 7)  // YYYY-MM
    if (!monthMap[key]) monthMap[key] = { distKm: 0, durationMins: 0, sessions: 0, paces: [] }
    monthMap[key].distKm += r.distanceKm
    monthMap[key].durationMins += r.durationMins
    monthMap[key].sessions += 1
    if (r.paceSecsPerKm > 0) monthMap[key].paces.push(r.paceSecsPerKm)
  }

  const months = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      distKm: +d.distKm.toFixed(1),
      sessions: d.sessions,
      avgPaceSecs: d.paces.length > 0 ? Math.round(d.paces.reduce((a, b) => a + b) / d.paces.length) : 0,
    }))

  // ── Linear trend on pace (simple linear regression over run index) ─────────
  function linearRegression(ys: number[]): { slope: number; intercept: number } {
    const n = ys.length
    if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 }
    const xs = ys.map((_, i) => i)
    const mx = (n - 1) / 2
    const my = ys.reduce((a, b) => a + b) / n
    const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) /
      xs.reduce((s, x) => s + (x - mx) ** 2, 0)
    return { slope, intercept: my - slope * mx }
  }

  const paceSeries = processedRuns.map((r) => r.paceSecsPerKm)
  const { slope } = linearRegression(paceSeries)
  // Improvement over entire period: if slope < 0 → pace getting faster
  const totalImprovement = paceSeries.length >= 2
    ? -(slope * (paceSeries.length - 1))  // positive = improvement (faster)
    : 0

  // ── Trend line points for chart (one per run) ─────────────────────────────
  const { slope: s, intercept: b } = linearRegression(paceSeries)
  const trendPoints = processedRuns.map((r, i) => ({
    date: r.date,
    trend: Math.round(b + s * i),
  }))

  // ── First 30 vs last 30 days ───────────────────────────────────────────────
  const first30 = processedRuns.slice(0, Math.min(5, Math.floor(processedRuns.length / 4)))
  const last30  = processedRuns.slice(-Math.min(5, Math.floor(processedRuns.length / 4)))
  const avgPaceFirst = first30.length > 0 ? Math.round(first30.reduce((a, r) => a + r.paceSecsPerKm, 0) / first30.length) : null
  const avgPaceLast  = last30.length  > 0 ? Math.round(last30.reduce((a, r) => a + r.paceSecsPerKm, 0) / last30.length) : null

  // ── Total stats ────────────────────────────────────────────────────────────
  const totalDistKm    = +processedRuns.reduce((a, r) => a + r.distanceKm, 0).toFixed(1)
  const totalSessions  = processedRuns.length
  const longestRunKm   = processedRuns.reduce((a, r) => r.distanceKm > a ? r.distanceKm : a, 0)
  const bestPaceRun    = processedRuns.filter((r) => r.distanceKm >= 1)
                          .reduce<Run | null>((a, r) => !a || r.paceSecsPerKm < a.paceSecsPerKm ? r : a, null)
  const bestLongRun    = processedRuns.reduce<Run | null>((a, r) => !a || r.distanceKm > a.distanceKm ? r : a, null)

  // ── Quarterly buckets (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec) ──
  const quarterMap: Record<string, { distKm: number; paces: number[]; sessions: number }> = {}
  for (const r of processedRuns) {
    const month = parseInt(r.date.slice(5, 7))
    const year  = r.date.slice(0, 4)
    const q     = `${year} Q${Math.ceil(month / 3)}`
    if (!quarterMap[q]) quarterMap[q] = { distKm: 0, paces: [], sessions: 0 }
    quarterMap[q].distKm += r.distanceKm
    quarterMap[q].paces.push(r.paceSecsPerKm)
    quarterMap[q].sessions += 1
  }
  const quarters = Object.entries(quarterMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([q, d]) => ({
      quarter: q,
      distKm: +d.distKm.toFixed(1),
      sessions: d.sessions,
      avgPaceSecs: d.paces.length > 0 ? Math.round(d.paces.reduce((a, b) => a + b) / d.paces.length) : 0,
    }))

  const data: ProgressionData = {
    runs: processedRuns,
    trendPoints,
    months,
    quarters,
    totalDistKm,
    totalSessions,
    longestRunKm,
    bestPaceSecs: bestPaceRun?.paceSecsPerKm ?? null,
    bestPaceDate: bestPaceRun?.date ?? null,
    bestLongRunKm: bestLongRun?.distanceKm ?? null,
    avgPaceFirstSecs: avgPaceFirst,
    avgPaceLastSecs: avgPaceLast,
    totalImprovementSecs: +totalImprovement.toFixed(1),
  }

  const subtitle = totalSessions > 0
    ? `${totalSessions} runs · ${totalDistKm.toLocaleString()} km · last 12 months`
    : '12-month running progression'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to running"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Running Progression</h1>
            <p className="text-sm text-text-secondary">{subtitle}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ProgressionClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
