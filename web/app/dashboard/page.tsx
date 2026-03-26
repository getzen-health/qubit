import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardDataLoader } from './dashboard-data-loader'
import { DashboardDataSkeleton } from '@/components/skeletons'
import { SleepSummaryCard } from '@/components/sleep-summary-card'
import { WorkoutSummaryCard } from '@/components/workout-summary-card'
import { MoodSummaryCard } from '@/components/mood-summary-card'
import StreaksSummaryCard from '@/components/streaks-summary-card'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your health dashboard with real-time stats, workouts, sleep data, and AI insights.',
  openGraph: {
    title: 'KQuarks Dashboard',
    description: 'Your health dashboard with real-time stats, workouts, sleep data, and AI insights.',
    type: 'website',
  },
  twitter: {
    title: 'KQuarks Dashboard',
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

  // Fetch streaks for summary card
  const { data: streaks } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)

  return (
    <>
      <Suspense fallback={<DashboardDataSkeleton />}>
        <DashboardDataLoader user={user} />
      </Suspense>
      <StreaksSummaryCard streaks={streaks ?? []} />
    </>
  )
}


