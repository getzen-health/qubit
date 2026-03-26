import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlcoholClient } from './alcohol-client'

export default async function AlcoholPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = new Date()
  since.setDate(since.getDate() - 90)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: logs } = await supabase
    .from('alcohol_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceStr)
    .order('date', { ascending: false })
    .limit(90)

  return <AlcoholClient initialLogs={logs ?? []} />
}
