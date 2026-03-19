import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity, GitPullRequest, BarChart2, TrendingDown, Heart, HeartPulse } from 'lucide-react'
import { HeartRateClient } from './heartrate-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function HeartRatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, resting_heart_rate, avg_hrv')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
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
            <h1 className="text-xl font-bold text-text-primary">Heart Rate</h1>
            <p className="text-sm text-text-secondary">Last 90 days</p>
          </div>
          <Link
            href="/heartrate/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Daily HR pattern"
            title="Daily HR Pattern"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
          <Link
            href="/hrv"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="HRV analysis"
            title="HRV Analysis"
          >
            <GitPullRequest className="w-5 h-5" />
          </Link>
          <Link
            href="/zones"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Training zones"
            title="Training Zones"
          >
            <Activity className="w-5 h-5" />
          </Link>
          <Link
            href="/heartrate/resting"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Resting heart rate"
            title="Resting HR Analysis"
          >
            <Heart className="w-5 h-5" />
          </Link>
          <Link
            href="/heartrate/recovery"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="HR recovery"
            title="HR Recovery"
          >
            <TrendingDown className="w-5 h-5" />
          </Link>
          <Link
            href="/heartrate/cardio"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Cardio health summary"
            title="Cardio Health"
          >
            <HeartPulse className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HeartRateClient summaries={summaries ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
