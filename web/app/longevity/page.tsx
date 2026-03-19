import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LongevityClient } from './longevity-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Vitality Score' }

export default async function LongevityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const since = ninetyDaysAgo.toISOString().slice(0, 10)

  const [{ data: summaries }, { data: vo2Records }, { data: walkingRecords }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate, steps, sleep_duration_minutes, active_calories')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: true }),
    supabase
      .from('health_records')
      .select('start_time, value')
      .eq('user_id', user.id)
      .eq('type', 'vo2_max')
      .gte('start_time', ninetyDaysAgo.toISOString())
      .order('start_time', { ascending: true }),
    supabase
      .from('health_records')
      .select('start_time, value')
      .eq('user_id', user.id)
      .eq('type', 'walking_speed')
      .gte('start_time', ninetyDaysAgo.toISOString())
      .order('start_time', { ascending: true }),
  ])

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recent = (summaries ?? []).filter((s) => s.date >= thirtyDaysAgo.toISOString().slice(0, 10))

  function avg30(key: 'avg_hrv' | 'resting_heart_rate' | 'steps' | 'sleep_duration_minutes' | 'active_calories') {
    const vals = recent.map((s) => s[key]).filter((v): v is number => v !== null && v > 0)
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  const recentWalking = (walkingRecords ?? []).filter((r) => r.start_time >= thirtyDaysAgo.toISOString())
  const avgWalkingSpeed =
    recentWalking.length > 0 ? recentWalking.reduce((s, r) => s + r.value, 0) / recentWalking.length : null

  // Latest VO2 max
  const latestVO2 = vo2Records && vo2Records.length > 0 ? vo2Records[vo2Records.length - 1].value : null

  const metrics = {
    vo2Max: latestVO2,
    rhr: avg30('resting_heart_rate'),
    hrv: avg30('avg_hrv'),
    walkingSpeed: avgWalkingSpeed,
    dailySteps: avg30('steps'),
    sleepMinutes: avg30('sleep_duration_minutes'),
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
          <div>
            <h1 className="text-xl font-bold text-text-primary">Vitality Score</h1>
            <p className="text-sm text-text-secondary">Multi-metric health index · 30-day average</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <LongevityClient metrics={metrics} summaries={summaries ?? []} vo2Records={vo2Records ?? []} walkingRecords={walkingRecords ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
