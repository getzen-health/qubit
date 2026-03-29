import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
const AlcoholClient = dynamic(() => import('./alcohol-client').then(m => ({ default: m.AlcoholClient })))

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

  const { data: profile } = await supabase
    .from('users')
    .select('biological_sex')
    .eq('id', user.id)
    .single()

  const sex = (profile?.biological_sex === 'female' ? 'female' : 'male') as 'male' | 'female'

  return <AlcoholClient initialLogs={logs ?? []} sex={sex} />
}
