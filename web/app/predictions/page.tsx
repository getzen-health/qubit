import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
const PredictionsClient = dynamic(() => import('./predictions-client').then(m => ({ default: m.PredictionsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Forecast – KQuarks' }

export default async function PredictionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, sleep_duration_minutes, avg_hrv, resting_heart_rate')
    .eq('user_id', user.id)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: true })
    .limit(30)

  return (
    <>
      <PredictionsClient summaries={summaries ?? []} />
      <BottomNav />
    </>
  )
}

