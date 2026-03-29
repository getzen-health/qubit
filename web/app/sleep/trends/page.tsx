import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const TrendsClient = dynamic(() => import('./trends-client').then(m => ({ default: m.TrendsClient })), { ssr: false })
import type { TrendEntry, TrendSummary } from './trends-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Trends' }

export default async function SleepTrendsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString().slice(0, 10)

  const [{ data: sleepRecords }, { data: summaries }] = await Promise.all([
    supabase
      .from('sleep_records')
      .select('date, start_time, end_time, duration_minutes, awake_minutes, rem_minutes, deep_minutes, core_minutes')
      .eq('user_id', user.id)
      .gte('date', since)
      .gt('duration_minutes', 60)
      .order('date', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, sleep_score')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: true }),
  ])

  const records = sleepRecords ?? []
  const sums = summaries ?? []

  // Build sleep_score lookup from daily_summaries
  const scoreByDate = new Map<string, number>()
  for (const s of sums) {
    if (s.sleep_score != null) scoreByDate.set(s.date, s.sleep_score)
  }

  // Take primary record per day (longest duration)
  const byDate = new Map<string, (typeof records)[number]>()
  for (const r of records) {
    const existing = byDate.get(r.date)
    if (!existing || r.duration_minutes > existing.duration_minutes) {
      byDate.set(r.date, r)
    }
  }

  // Build trendData sorted by date ascending
  const trendData: TrendEntry[] = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateIso, r]) => {
      const startMs = new Date(r.start_time).getTime()
      const endMs = new Date(r.end_time).getTime()
      const tibMinutes = (endMs - startMs) / 60000
      const efficiency =
        tibMinutes > 60
          ? Math.round(Math.min(100, (r.duration_minutes / tibMinutes) * 100) * 10) / 10
          : null

      const date = new Date(dateIso + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })

      return {
        date,
        dateIso,
        durationHours: +(r.duration_minutes / 60).toFixed(2),
        efficiency,
        sleepScore: scoreByDate.get(dateIso) ?? null,
        deepMinutes: r.deep_minutes ?? 0,
        remMinutes: r.rem_minutes ?? 0,
        coreMinutes: r.core_minutes ?? 0,
        awakeMinutes: r.awake_minutes ?? 0,
      }
    })

  const totalNights = trendData.length

  // Average duration
  const avgDuration =
    totalNights > 0
      ? +(trendData.reduce((s, d) => s + d.durationHours, 0) / totalNights).toFixed(2)
      : 0

  // Average efficiency
  const effValues = trendData
    .filter((d) => d.efficiency !== null)
    .map((d) => d.efficiency as number)
  const avgEfficiency =
    effValues.length > 0
      ? Math.round(effValues.reduce((s, v) => s + v, 0) / effValues.length)
      : null

  // Best night: prefer sleepScore, fallback to efficiency
  const bestNight = trendData.reduce<TrendEntry | null>((best, cur) => {
    const curScore = cur.sleepScore ?? cur.efficiency ?? 0
    const bestScore = best ? (best.sleepScore ?? best.efficiency ?? 0) : -1
    return curScore > bestScore ? cur : best
  }, null)

  // Trend: compare last 7 days avg duration vs prior 7 days
  const last7 = trendData.slice(-7)
  const prior7 = trendData.slice(-14, -7)
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (last7.length >= 3 && prior7.length >= 3) {
    const last7Avg = last7.reduce((s, d) => s + d.durationHours, 0) / last7.length
    const prior7Avg = prior7.reduce((s, d) => s + d.durationHours, 0) / prior7.length
    if (last7Avg > prior7Avg + 0.25) trend = 'improving'
    else if (last7Avg < prior7Avg - 0.25) trend = 'declining'
  }

  const summary: TrendSummary = {
    avgDuration,
    avgEfficiency,
    bestNight: bestNight
      ? {
          dateIso: bestNight.dateIso,
          dateLabel: bestNight.date,
          score: bestNight.sleepScore ?? bestNight.efficiency ?? 0,
        }
      : null,
    trend,
    totalNights,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Sleep Trends</h1>
            <p className="text-sm text-text-secondary">
              {totalNights > 0 ? `${totalNights} nights · last 30 days` : '30-day duration & quality trend'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TrendsClient trendData={trendData} summary={summary} />
      </main>
      <BottomNav />
    </div>
  )
}
