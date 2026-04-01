import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardDataLoader } from './dashboard-data-loader'
import { DashboardDataSkeleton } from '@/components/skeletons'
import StreaksSummaryCard from '@/components/streaks-summary-card'
import NutritionSummaryCard from '@/components/nutrition-summary-card'
import { HabitsTodayCard } from '@/components/habits-today-card'
import XpCard from '@/components/xp-card'
import PrescriptionCard from './components/prescription-card'
import { VoiceLogger } from '@/components/voice-logger'
import { QuickLogCard } from './components/quick-log-card'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your health dashboard with real-time stats, workouts, sleep data, and AI insights.',
  openGraph: {
    title: 'GetZen Dashboard',
    description: 'Your health dashboard with real-time stats, workouts, sleep data, and AI insights.',
    type: 'website',
  },
  twitter: {
    title: 'GetZen Dashboard',
    description: 'Your health dashboard with real-time stats, workouts, sleep data, and AI insights.',
  },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch dashboard data in parallel to avoid sequential N+1 queries
  const [
    { data: profile },
    { data: streaks },
    { data: stats },
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id),
    supabase
      .from('user_stats')
      .select('total_xp, current_streak')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <>
      <div className="mb-4">
        <XpCard totalXP={stats?.total_xp ?? 0} currentStreak={stats?.current_streak ?? 0} />
      </div>
      <QuickLogCard />
      <div className="mb-4">
        <PrescriptionCard />
      </div>
      <div className="mb-4">
        <a
          href="/insights/benchmarks"
          className="block bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">Benchmarks</p>
                <p className="text-xs text-text-secondary">Compare your stats to your age group</p>
              </div>
            </div>
            <span className="text-text-tertiary text-lg">→</span>
          </div>
        </a>
      </div>
      <Suspense fallback={<DashboardDataSkeleton />}>
        <DashboardDataLoader user={user} />
      </Suspense>
      <div className="mt-4 space-y-4">
        <NutritionSummaryCard />
        <HabitsTodayCard />
        <StreaksSummaryCard streaks={streaks ?? []} />
      </div>
      <VoiceLogger />
    </>
  )
}


