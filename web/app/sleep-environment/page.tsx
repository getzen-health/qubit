import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { SleepEnvClient } from './sleep-env-client'
import { calculateSleepEnvironmentScore } from '@/lib/sleep-environment'
import type { SleepEnvironmentLog } from '@/lib/sleep-environment'

export const metadata = {
  title: 'Sleep Environment Optimizer',
  description: 'Optimize your sleep environment with science-backed temperature, darkness, noise, and pre-sleep routine tracking.',
}

export default async function SleepEnvironmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs } = await supabase
    .from('sleep_environment_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const scoredLogs = (logs ?? []).map((log: SleepEnvironmentLog) => ({
    ...log,
    score: calculateSleepEnvironmentScore(log),
  }))

  const latest = scoredLogs[0] ?? null

  return (
    <div className="min-h-screen bg-background pb-24">
      <SleepEnvClient initialLogs={scoredLogs} latestLog={latest} />
      <BottomNav />
    </div>
  )
}
