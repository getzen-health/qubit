import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GitCompareArrows, TrendingUp } from 'lucide-react'
import { TrendsWrapper } from './trends-wrapper'
import { BottomNav } from '@/components/bottom-nav'
import { TrendsPageSkeleton } from '@/components/skeletons'

export default async function TrendsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, sleep_duration_minutes, avg_hrv, recovery_score, resting_heart_rate')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })

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
            <h1 className="text-xl font-bold text-text-primary">Trends & Patterns</h1>
            <p className="text-sm text-text-secondary">90-day analysis</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/correlations"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Correlations
            </Link>
            <Link
              href="/compare"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <GitCompareArrows className="w-4 h-4" />
              Compare
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <Suspense fallback={<TrendsPageSkeleton />}>
          <TrendsWrapper initialSummaries={summaries ?? []} />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  )
}
