import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { InflammationClient } from './inflammation-client'
import { calcInflammationScore } from '@/lib/inflammation'
import type { InflammationLog } from '@/lib/inflammation'

export const metadata = { title: 'Inflammation Tracker — KQuarks' }

export default async function InflammationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs } = await supabase
    .from('inflammation_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = (logs ?? []).find((l) => l.date === today) ?? null
  const currentScore = todayLog ? calcInflammationScore(todayLog as InflammationLog) : null

  const trend = (logs ?? []).slice(0, 30).map((l) => {
    const s = calcInflammationScore(l as InflammationLog)
    return {
      date: l.date.slice(5), // MM-DD
      crp_proxy: s.crp_proxy,
      diet_score: s.anti_inflammatory_diet_score,
      omega_ratio: s.omega_ratio,
      dii_category: s.dii_category,
    }
  })

  return (
    <div className="min-h-screen bg-background pb-24">
      <InflammationClient
        initialLogs={(logs ?? []) as InflammationLog[]}
        todayLog={todayLog as InflammationLog | null}
        currentScore={currentScore}
        trend={trend}
      />
      <BottomNav />
    </div>
  )
}
