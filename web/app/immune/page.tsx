import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const ImmuneClient = dynamic(() => import('./immune-client').then(m => ({ default: m.ImmuneClient })))
import { calculateImmuneScore } from '@/lib/immune-score'
import type { ImmuneLog } from '@/lib/immune-score'

export const metadata = { title: 'Immune System Tracker — GetZen' }

export default async function ImmunePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs } = await supabase
    .from('immune_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = (logs ?? []).find((l) => l.date === today) ?? null
  const currentScore = todayLog ? calculateImmuneScore(todayLog as ImmuneLog) : null

  const trend = (logs ?? []).slice(0, 7).map((l) => ({
    date: l.date,
    score: calculateImmuneScore(l as ImmuneLog).total,
  }))

  return (
    <div className="min-h-screen bg-background pb-24">
      <ImmuneClient
        initialLogs={logs ?? []}
        todayLog={todayLog}
        currentScore={currentScore}
        trend={trend}
      />
      <BottomNav />
    </div>
  )
}
