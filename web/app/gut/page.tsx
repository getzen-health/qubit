import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GutClient } from './gut-client'
import { calculateGutScore, emptyGutLog } from '@/lib/gut-health'

export default async function GutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: logs } = await supabase
    .from('gut_health_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceStr)
    .order('date', { ascending: false })
    .limit(30)

  const today = new Date().toISOString().slice(0, 10)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  const weeklyPlantCount = (logs ?? [])
    .filter((l) => l.date >= weekAgoStr)
    .reduce((sum, l) => sum + (l.plant_species_count ?? 0), 0)

  const todayLog = logs?.find((l) => l.date === today) ?? emptyGutLog(today)
  const currentScore = calculateGutScore(todayLog, weeklyPlantCount)

  const trend = (logs ?? [])
    .slice(0, 7)
    .map((l) => ({ date: l.date, score: calculateGutScore(l, 0).total }))
    .reverse()

  return (
    <GutClient
      initialLog={todayLog}
      logs={logs ?? []}
      currentScore={currentScore}
      trend={trend}
      weeklyPlantCount={weeklyPlantCount}
    />
  )
}
