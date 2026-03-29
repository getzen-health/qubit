import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const MindfulnessImpactClient = dynamic(() => import('./mindfulness-impact-client').then(m => ({ default: m.MindfulnessImpactClient })), { ssr: false })
import type { ImpactData } from './mindfulness-impact-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Mindfulness Impact' }

export default async function MindfulnessImpactPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const since = ninetyDaysAgo.toISOString().slice(0, 10)

  const [{ data: mindRecords }, { data: summaries }] = await Promise.all([
    supabase
      .from('health_records')
      .select('value, start_time')
      .eq('user_id', user.id)
      .eq('type', 'mindfulness')
      .gte('start_time', ninetyDaysAgo.toISOString())
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate, recovery_score, sleep_duration_minutes')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: true }),
  ])

  // ── Aggregate mindfulness minutes by date ─────────────────────────────────
  const mindByDate: Record<string, number> = {}
  for (const r of mindRecords ?? []) {
    const day = r.start_time.slice(0, 10)
    mindByDate[day] = (mindByDate[day] ?? 0) + (r.value ?? 0)
  }

  // ── Build summary map ──────────────────────────────────────────────────────
  const summaryMap: Record<string, { hrv: number | null; rhr: number | null; recovery: number | null }> = {}
  for (const s of summaries ?? []) {
    summaryMap[s.date] = {
      hrv: s.avg_hrv,
      rhr: s.resting_heart_rate,
      recovery: s.recovery_score,
    }
  }

  // ── Day-pairs: mindfulness day → next day metrics ─────────────────────────
  const rows = (summaries ?? []).sort((a, b) => a.date.localeCompare(b.date))
  const pairs = rows.map((s, i) => {
    const nextDay = rows[i + 1]
    const minsMeditated = mindByDate[s.date] ?? 0
    return {
      date: s.date,
      minsMeditated,
      hadMindfulness: minsMeditated > 0,
      nextHrv:      nextDay ? nextDay.avg_hrv      : null,
      nextRhr:      nextDay ? nextDay.resting_heart_rate : null,
      nextRecovery: nextDay ? nextDay.recovery_score     : null,
    }
  }).filter((p) => p.nextHrv !== null || p.nextRhr !== null)

  const withMind = pairs.filter((p) => p.hadMindfulness)
  const withoutMind = pairs.filter((p) => !p.hadMindfulness)

  function avgHrv(arr: typeof pairs) {
    const vals = arr.map((p) => p.nextHrv).filter((v): v is number => v !== null && v > 0)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }
  function avgRhr(arr: typeof pairs) {
    const vals = arr.map((p) => p.nextRhr).filter((v): v is number => v !== null && v > 0)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }
  function avgRec(arr: typeof pairs) {
    const vals = arr.map((p) => p.nextRecovery).filter((v): v is number => v !== null && v > 0)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }

  // ── Weekly mindfulness minutes ────────────────────────────────────────────
  const weekBuckets: Record<string, number> = {}
  for (const [date, mins] of Object.entries(mindByDate)) {
    const d = new Date(date + 'T12:00:00')
    // ISO week start = Monday
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(d.setDate(diff)).toISOString().slice(0, 10)
    weekBuckets[weekStart] = (weekBuckets[weekStart] ?? 0) + mins
  }
  const weeklyMins = Object.entries(weekBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, mins]) => ({ date, mins }))

  // ── Total stats ───────────────────────────────────────────────────────────
  const totalSessions = Object.keys(mindByDate).length
  const totalMins     = Object.values(mindByDate).reduce((a, b) => a + b, 0)

  const data: ImpactData = {
    withMindfulness: {
      days:        withMind.length,
      avgHrv:      avgHrv(withMind),
      avgRhr:      avgRhr(withMind),
      avgRecovery: avgRec(withMind),
    },
    withoutMindfulness: {
      days:        withoutMind.length,
      avgHrv:      avgHrv(withoutMind),
      avgRhr:      avgRhr(withoutMind),
      avgRecovery: avgRec(withoutMind),
    },
    weeklyMins,
    totalSessions,
    totalMins: Math.round(totalMins),
    pairs: pairs.map((p) => ({
      date: p.date,
      minsMeditated: p.minsMeditated,
      nextHrv: p.nextHrv,
    })).filter((p) => p.nextHrv !== null),
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/mindfulness"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to mindfulness"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Mindfulness Impact</h1>
            <p className="text-sm text-text-secondary">
              {totalSessions > 0 ? `${totalSessions} sessions · ${Math.round(totalMins / 60)}h ${totalMins % 60}m total` : '90-day impact analysis'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <MindfulnessImpactClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
