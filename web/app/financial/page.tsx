import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinancialClient } from './financial-client'
import { calculateFinancialWellness } from '@/lib/financial-wellness'
import type { FinancialWellnessLog } from '@/lib/financial-wellness'

export const metadata = {
  title: 'Financial Wellness | KQuarks',
  description: 'Track financial wellness perceptions, stress, and money-health correlations',
}

export default async function FinancialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [{ data: logs }, { data: summaries }] = await Promise.all([
    supabase
      .from('financial_wellness_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since30)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('daily_summaries')
      .select('date, avg_mood, sleep_quality, avg_stress')
      .eq('user_id', user.id)
      .gte('date', since30)
      .order('date', { ascending: false })
      .limit(30),
  ])

  const typedLogs = (logs ?? []) as FinancialWellnessLog[]
  const latestScore = typedLogs.length > 0 ? calculateFinancialWellness(typedLogs[0]) : null

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-text-secondary text-sm">Loading…</div>}>
      <FinancialClient
        initialLogs={typedLogs}
        initialScore={latestScore}
        initialSummaries={(summaries ?? []) as { date: string; avg_mood?: number | null; sleep_quality?: number | null; avg_stress?: number | null }[]}
      />
    </Suspense>
  )
}
