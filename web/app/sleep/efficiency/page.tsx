import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EfficiencyClient } from './efficiency-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Efficiency' }

export default async function SleepEfficiencyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { data: records } = await supabase
    .from('sleep_records')
    .select('start_time, end_time, duration_minutes, awake_minutes')
    .eq('user_id', user.id)
    .gte('start_time', sixtyDaysAgo.toISOString())
    .gt('duration_minutes', 60)
    .order('start_time', { ascending: true })

  // Compute efficiency for each night
  const nights = (records ?? []).map((r) => {
    const startMs = new Date(r.start_time).getTime()
    const endMs = new Date(r.end_time).getTime()
    const tibMinutes = (endMs - startMs) / 60000
    const tst = r.duration_minutes        // total sleep time (minutes actually asleep)
    const awake = r.awake_minutes ?? 0

    // Sleep efficiency = TST / TIB × 100
    const efficiency = tibMinutes > 0 ? Math.min(100, (tst / tibMinutes) * 100) : null

    // Sleep onset latency estimate = TIB - TST - awake_minutes_after_sleep_onset
    // Approximation: awake minutes already included in TIB, so SOL ≈ (TIB - TST) / 2
    const sol = tibMinutes > tst ? Math.round((tibMinutes - tst) / 2) : 0

    return {
      date: r.start_time.slice(0, 10),
      tibMinutes: Math.round(tibMinutes),
      tst,
      awake,
      efficiency: efficiency !== null ? Math.round(efficiency * 10) / 10 : null,
      solEstimate: sol,
    }
  }).filter((n) => n.efficiency !== null && n.tibMinutes > 60 && n.tibMinutes < 720)

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
            <h1 className="text-xl font-bold text-text-primary">Sleep Efficiency</h1>
            <p className="text-sm text-text-secondary">
              {nights.length > 0 ? `${nights.length} nights analyzed` : 'Time asleep vs time in bed'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <EfficiencyClient nights={nights} />
      </main>
      <BottomNav />
    </div>
  )
}
