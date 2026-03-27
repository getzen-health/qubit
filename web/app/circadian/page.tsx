import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CircadianClient } from './circadian-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function CircadianPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString().split('T')[0]

  const [{ data: lightLogs }, { data: latestAssessment }] = await Promise.all([
    supabase
      .from('light_exposure_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: false }),
    supabase
      .from('circadian_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <CircadianClient
        lightLogs={lightLogs ?? []}
        latestAssessment={latestAssessment ?? null}
      />
      <BottomNav />
    </div>
  )
}
