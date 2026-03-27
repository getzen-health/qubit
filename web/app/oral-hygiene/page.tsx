import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OralHygieneClient, type OralHygieneLog } from './oral-hygiene-client'

export const metadata = { title: 'Oral Hygiene — KQuarks' }

export default async function OralHygienePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
  const { data: logs } = await supabase
    .from('oral_hygiene_logs')
    .select(
      'id, user_id, logged_date, sessions, morning, afternoon, evening, total_duration_seconds, notes, created_at, updated_at'
    )
    .eq('user_id', user.id)
    .gte('logged_date', since)
    .order('logged_date', { ascending: false })

  return <OralHygieneClient initialLogs={(logs ?? []) as OralHygieneLog[]} />
}
