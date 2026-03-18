import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GitCompareArrows } from 'lucide-react'
import { CorrelationsClient } from './correlations-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function CorrelationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, sleep_duration_minutes, avg_hrv, resting_heart_rate, recovery_score')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
    .order('date', { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/trends"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <GitCompareArrows className="w-5 h-5 text-accent" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Correlations</h1>
              <p className="text-sm text-text-secondary">How your metrics influence each other</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CorrelationsClient summaries={summaries ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
