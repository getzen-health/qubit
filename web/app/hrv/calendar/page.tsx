import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HRVCalendarClient } from './hrv-calendar-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HRV Recovery Calendar' }

export default async function HRVCalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch up to 1 year of HRV data
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: rows } = await supabase
    .from('daily_summaries')
    .select('date, avg_hrv')
    .eq('user_id', user.id)
    .gte('date', oneYearAgo.toISOString().slice(0, 10))
    .not('avg_hrv', 'is', null)
    .gt('avg_hrv', 0)
    .order('date', { ascending: true })

  // Compute 28-day rolling baseline for each day
  interface HRVDay {
    date: string
    hrv: number
    baseline: number
    deviation: number   // percentage deviation from baseline
    level: number       // -2 to +2 for coloring
  }

  const all = (rows ?? []).map(r => ({ date: r.date, hrv: r.avg_hrv as number }))

  const days: HRVDay[] = all.map((r, i) => {
    // Rolling 28-day baseline (use up to 28 prior days, excluding current)
    const slice = all.slice(Math.max(0, i - 28), i)
    const baseline = slice.length > 0
      ? slice.reduce((s, x) => s + x.hrv, 0) / slice.length
      : r.hrv
    const deviation = baseline > 0 ? ((r.hrv - baseline) / baseline) * 100 : 0
    // Level: +2 = well above, +1 = above, 0 = normal, -1 = below, -2 = well below
    const level = deviation > 15 ? 2 : deviation > 5 ? 1 : deviation < -15 ? -2 : deviation < -5 ? -1 : 0
    return { date: r.date, hrv: Math.round(r.hrv), baseline: Math.round(baseline), deviation: Math.round(deviation), level }
  })

  const totalDays = days.length
  const recoveredDays = days.filter(d => d.level > 0).length
  const stressedDays = days.filter(d => d.level < 0).length
  const avgHrv = totalDays > 0 ? Math.round(days.reduce((s, d) => s + d.hrv, 0) / totalDays) : null
  const latestBaseline = days.length > 0 ? days[days.length - 1].baseline : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hrv"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to HRV"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">HRV Recovery Calendar</h1>
            <p className="text-sm text-text-secondary">
              {totalDays > 0
                ? `${totalDays} days · ${recoveredDays} recovered · ${stressedDays} stressed`
                : '365-day recovery heatmap'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        <HRVCalendarClient
          days={days}
          avgHrv={avgHrv}
          latestBaseline={latestBaseline}
          recoveredDays={recoveredDays}
          stressedDays={stressedDays}
        />
      </main>
      <BottomNav />
    </div>
  )
}
