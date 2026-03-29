import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
const HiitClient = dynamic(() => import('./hiit-client').then(m => ({ default: m.HiitClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HIIT Analytics' }

export default async function HiitPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const [{ data: sessions }, { data: dailyHrvRows }, { data: maxHrRow }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('id, start_time, duration_minutes, avg_heart_rate, max_heart_rate, active_calories')
      .eq('user_id', user.id)
      .in('workout_type', ['HIIT', 'High Intensity Interval Training'])
      .gte('start_time', startIso)
      .gt('duration_minutes', 0)
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
      .not('avg_hrv', 'is', null)
      .gt('avg_hrv', 0),
    supabase
      .from('workout_records')
      .select('max_heart_rate')
      .eq('user_id', user.id)
      .not('max_heart_rate', 'is', null)
      .gt('max_heart_rate', 0)
      .order('max_heart_rate', { ascending: false })
      .limit(1)
      .single(),
  ])

  const observedMaxHr = maxHrRow?.max_heart_rate ?? 190

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">HIIT Analytics</h1>
            <p className="text-sm text-text-secondary">
              Last 90 days · {sessions?.length ?? 0} sessions
            </p>
          </div>
          <Link
            href="/hiit/progression"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="HIIT progression"
            title="HIIT Progression"
          >
            <TrendingUp className="w-5 h-5" />
          </Link>
          <Link
            href="/hiit/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="HIIT patterns"
            title="HIIT Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HiitClient
          sessions={sessions ?? []}
          dailyHrv={dailyHrvRows ?? []}
          maxHr={observedMaxHr > 100 ? observedMaxHr : 190}
        />
      </main>
      <BottomNav />
    </div>
  )
}
