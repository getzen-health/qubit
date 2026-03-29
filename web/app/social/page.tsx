import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const SocialClient = dynamic(() => import('./social-client').then(m => ({ default: m.SocialClient })))
import { calculateSocialScore, emptyLog } from '@/lib/social-health'
import type { SocialLog } from '@/lib/social-health'

export const metadata = { title: 'Social Health — KQuarks' }

export default async function SocialPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)

  const { data: logs } = await supabase
    .from('social_health_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const typedLogs = (logs ?? []) as SocialLog[]
  const todayLog = typedLogs.find((l) => l.date === today) ?? emptyLog(today)
  const currentScore = calculateSocialScore(todayLog)

  return (
    <div className="min-h-screen bg-background pb-24">
      <SocialClient
        initialLogs={typedLogs}
        todayLog={todayLog}
        currentScore={currentScore}
      />
      <BottomNav />
    </div>
  )
}
