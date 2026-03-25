import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardDataLoader } from './dashboard-data-loader'
import { DashboardDataSkeleton } from '@/components/skeletons'

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

