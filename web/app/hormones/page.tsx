import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HormonesClient } from './hormones-client'
import { BottomNav } from '@/components/bottom-nav'
import { calculateHormoneScores, emptyHormoneLog } from '@/lib/hormone-health'

export const metadata = { title: 'Hormone Health' }

export default async function HormonesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: logs } = await supabase
    .from('hormone_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceStr)
    .order('date', { ascending: false })
    .limit(30)

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.find((l) => l.date === today) ?? emptyHormoneLog(today)
  const currentScore = calculateHormoneScores(todayLog)

  const scoredLogs = (logs ?? []).map((l) => ({
    ...l,
    scores: calculateHormoneScores(l),
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-2xl">⚗️</span>
          <div>
            <h1 className="font-semibold text-text-primary text-lg leading-tight">Hormone Health</h1>
            <p className="text-xs text-text-secondary">Testosterone · Cortisol · Thyroid · Estrogen</p>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <HormonesClient
          logs={scoredLogs}
          currentScore={currentScore}
          todayLog={todayLog}
        />
      </main>
      <BottomNav />
    </div>
  )
}
