import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Thermometer } from 'lucide-react'
import { TempInsightsClient } from './temp-insights-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Temperature Insights' }

export default async function TempInsightsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const [{ data: tempRecords }, { data: summaries }] = await Promise.all([
    supabase
      .from('health_records')
      .select('start_time, value')
      .eq('user_id', user.id)
      .eq('type', 'wrist_temperature')
      .gte('start_time', startIso)
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, sleep_duration_minutes, resting_heart_rate')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
  ])

  // Deduplicate temp to one reading per night
  const tempByDay = new Map<string, number>()
  for (const r of tempRecords ?? []) {
    const day = r.start_time.slice(0, 10)
    if (!tempByDay.has(day)) tempByDay.set(day, r.value)
  }

  // Index summaries by date
  const summaryByDate = new Map(
    (summaries ?? []).map(s => [s.date, s])
  )

  // Build correlation points
  interface TempPoint {
    date: string
    temp: number           // deviation in °C
    nextDayHrv: number | null
    sleepHours: number | null
    rhr: number | null
    category: 'elevated' | 'normal' | 'low'
  }

  const points: TempPoint[] = Array.from(tempByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, temp]) => {
      // Next-day date
      const nextDay = new Date(date + 'T12:00:00')
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayStr = nextDay.toISOString().slice(0, 10)
      const todaySummary = summaryByDate.get(date)
      const nextDaySummary = summaryByDate.get(nextDayStr)

      return {
        date,
        temp,
        nextDayHrv: nextDaySummary?.avg_hrv ?? null,
        sleepHours: todaySummary?.sleep_duration_minutes
          ? todaySummary.sleep_duration_minutes / 60
          : null,
        rhr: todaySummary?.resting_heart_rate ?? null,
        category: temp > 0.3 ? 'elevated' : temp < -0.3 ? 'low' : 'normal',
      }
    })

  // Consecutive elevated nights (illness signal)
  let maxConsecElevated = 0
  let curConsec = 0
  for (const p of points) {
    if (p.category === 'elevated') { curConsec++; maxConsecElevated = Math.max(maxConsecElevated, curConsec) }
    else curConsec = 0
  }

  // Average next-day HRV by temp category
  const avgHrvByCategory = (cat: 'elevated' | 'normal' | 'low') => {
    const vals = points.filter(p => p.category === cat && p.nextDayHrv !== null).map(p => p.nextDayHrv!)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }

  const hrv = {
    elevated: avgHrvByCategory('elevated'),
    normal: avgHrvByCategory('normal'),
    low: avgHrvByCategory('low'),
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/temperature"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to temperature"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Temperature Insights</h1>
              <p className="text-sm text-text-secondary">
                {points.length > 0
                  ? `${points.length} nights · correlations with HRV & sleep`
                  : 'Wrist temp correlations'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TempInsightsClient
          points={points}
          hrv={hrv}
          maxConsecElevated={maxConsecElevated}
        />
      </main>
      <BottomNav />
    </div>
  )
}
