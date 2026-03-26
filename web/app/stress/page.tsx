import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { StressClient } from './stress-client'
import { StressForm } from './stress-form'

export const metadata = { title: 'Stress & Cortisol' }

export type StressLog = {
  id: string
  stress_level: number
  source: string
  notes: string | null
  context_tags: string[]
  logged_at: string
}

export type TrendPoint = {
  date: string
  avg_stress: number | null
  hrv_derived_stress: number | null
  log_count: number
}

export type CorrelationData = {
  r: number | null
  strength: string
  interpretation: string
  n: number
}

export type StressPageData = {
  today: {
    latestManual: StressLog | null
    hrvDerived: { stress_level: number; hrv_input: number } | null
    dailyAverage: number | null
    logCount: number
  }
  trend: TrendPoint[]
  correlation: CorrelationData
  contextFrequencies: Record<string, number>
}

function hrvToStressLevel(hrv: number): number {
  return Math.max(1, Math.min(10, Math.round((200 - hrv) / 18)))
}

function pearsonR(xs: number[], ys: number[]): number | null {
  const n = xs.length
  if (n < 3) return null
  const meanX = xs.reduce((s, v) => s + v, 0) / n
  const meanY = ys.reduce((s, v) => s + v, 0) / n
  let num = 0, denomX = 0, denomY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX, dy = ys[i] - meanY
    num += dx * dy; denomX += dx * dx; denomY += dy * dy
  }
  const denom = Math.sqrt(denomX * denomY)
  return denom === 0 ? null : Math.round((num / denom) * 1000) / 1000
}

export default async function StressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [
    { data: todayLogs },
    { data: todaySummary },
    { data: trendLogs },
    { data: trendSummaries },
    { data: recentLogs },
  ] = await Promise.all([
    supabase
      .from('stress_logs')
      .select('id, stress_level, source, notes, context_tags, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00.000Z`)
      .lte('logged_at', `${today}T23:59:59.999Z`)
      .order('logged_at', { ascending: false }),
    supabase
      .from('daily_summaries')
      .select('avg_hrv')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('stress_logs')
      .select('stress_level, logged_at')
      .eq('user_id', user.id)
      .eq('source', 'manual')
      .gte('logged_at', `${since30}T00:00:00.000Z`)
      .order('logged_at', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, sleep_duration_minutes')
      .eq('user_id', user.id)
      .gte('date', since30)
      .order('date', { ascending: true }),
    supabase
      .from('stress_logs')
      .select('context_tags')
      .eq('user_id', user.id)
      .eq('source', 'manual')
      .gte('logged_at', `${since30}T00:00:00.000Z`),
  ])

  // ── Today's summary ──────────────────────────────────────────────────────
  const manualLogs = (todayLogs ?? []).filter((l) => l.source === 'manual')
  const latestManual = (manualLogs[0] as StressLog) ?? null
  const dailyAverage =
    manualLogs.length > 0
      ? Math.round(
          (manualLogs.reduce((s, l) => s + l.stress_level, 0) / manualLogs.length) * 10
        ) / 10
      : null
  const hrvDerived =
    todaySummary?.avg_hrv != null
      ? { stress_level: hrvToStressLevel(todaySummary.avg_hrv), hrv_input: todaySummary.avg_hrv }
      : null

  // ── 30-day trend ─────────────────────────────────────────────────────────
  const byDate: Record<string, number[]> = {}
  for (const log of trendLogs ?? []) {
    const date = (log.logged_at as string).slice(0, 10)
    ;(byDate[date] ??= []).push(log.stress_level as number)
  }
  const hrvMap: Record<string, number> = {}
  for (const row of trendSummaries ?? []) {
    if (row.avg_hrv != null) {
      hrvMap[row.date as string] = hrvToStressLevel(row.avg_hrv as number)
    }
  }
  const allDates = new Set([...Object.keys(byDate), ...Object.keys(hrvMap)])
  const trend: TrendPoint[] = Array.from(allDates)
    .sort()
    .map((date) => {
      const levels = byDate[date] ?? []
      const avg =
        levels.length > 0
          ? Math.round((levels.reduce((s, v) => s + v, 0) / levels.length) * 10) / 10
          : null
      return { date, avg_stress: avg, hrv_derived_stress: hrvMap[date] ?? null, log_count: levels.length }
    })

  // ── Context tag frequencies ───────────────────────────────────────────────
  const contextFrequencies: Record<string, number> = {}
  for (const log of recentLogs ?? []) {
    for (const tag of (log.context_tags as string[]) ?? []) {
      contextFrequencies[tag] = (contextFrequencies[tag] ?? 0) + 1
    }
  }

  // ── Stress vs sleep correlation ───────────────────────────────────────────
  const stressByDate: Record<string, number> = {}
  for (const [date, levels] of Object.entries(byDate)) {
    stressByDate[date] = levels.reduce((s, v) => s + v, 0) / levels.length
  }
  const pairs: { stress: number; sleep: number }[] = []
  for (const row of trendSummaries ?? []) {
    const date = row.date as string
    if (stressByDate[date] != null && row.sleep_duration_minutes != null) {
      pairs.push({
        stress: stressByDate[date],
        sleep: (row.sleep_duration_minutes as number) / 60,
      })
    }
  }

  let correlation: CorrelationData = {
    r: null,
    strength: 'insufficient_data',
    interpretation: 'Log stress daily to uncover sleep correlations',
    n: 0,
  }
  if (pairs.length >= 3) {
    const xs = pairs.map((p) => p.stress)
    const ys = pairs.map((p) => p.sleep)
    const r = pearsonR(xs, ys)
    const abs = r !== null ? Math.abs(r) : 0
    const strength =
      abs < 0.2 ? 'negligible' : abs < 0.4 ? 'weak' : abs < 0.6 ? 'moderate' : abs < 0.8 ? 'strong' : 'very_strong'
    const interpretation =
      r !== null && r < -0.2
        ? 'Higher stress days linked to fewer hours of sleep'
        : r !== null && r > 0.2
        ? 'Higher stress days linked to more sleep (unusual pattern)'
        : 'No consistent link between stress level and sleep duration'
    correlation = { r, strength, interpretation, n: pairs.length }
  }

  const data: StressPageData = {
    today: { latestManual, hrvDerived, dailyAverage, logCount: manualLogs.length },
    trend,
    correlation,
    contextFrequencies,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Stress &amp; Cortisol</h1>
            <p className="text-sm text-text-secondary">Manual logs · HRV-derived · 30-day trend</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StressForm />
        <StressClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
