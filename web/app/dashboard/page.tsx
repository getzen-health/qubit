import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardDataLoader } from './dashboard-data-loader'
import { DashboardDataSkeleton } from '@/components/skeletons'

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

  return (
    <Suspense fallback={<DashboardDataSkeleton />}>
      <DashboardDataLoader user={user} />
    </Suspense>
  )
}

